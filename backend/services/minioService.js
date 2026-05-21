/**
 * MinIO Service — object storage adapter for SmartDrive DMS.
 *
 * Responsibilities:
 *   - Initialise client, ensure buckets exist, enable bucket-level versioning.
 *   - Generate presigned PUT/GET URLs (short-lived).
 *   - Stream objects back to Express with HTTP Range support (secure proxy).
 *   - Low-level stat/copy/delete helpers.
 *
 * This is the ONLY module allowed to import 'minio'. Application code that
 * needs storage should go through business services which call this module.
 */

import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  region: process.env.MINIO_REGION || 'us-east-1',
});

const BUCKETS = {
  PRIVATE: process.env.MINIO_BUCKET_PRIVATE || 'lms-private',
  WORKFLOW: process.env.MINIO_BUCKET_WORKFLOW || 'lms-workflow',
  SHARED: process.env.MINIO_BUCKET_SHARED || 'lms-shared',
};

const PRESIGNED_EXPIRY = {
  PUT: parseInt(process.env.PRESIGNED_PUT_EXPIRY || '600', 10),
  GET: parseInt(process.env.PRESIGNED_GET_EXPIRY || '300', 10),
};

/**
 * Which MIME types we're willing to preview inline via a presigned GET URL.
 * Everything else is forced through the proxy download endpoint.
 */
const INLINE_PREVIEWABLE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
]);

export const isInlinePreviewable = (mimeType) => INLINE_PREVIEWABLE_MIME.has(mimeType);

/**
 * Ensure every bucket exists AND has object versioning enabled.
 * Called once at server startup.
 */
export async function ensureBuckets() {
  const buckets = Object.values(BUCKETS);
  for (const bucket of buckets) {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      await minioClient.makeBucket(bucket, process.env.MINIO_REGION || 'us-east-1');
      console.log(`[minio] Created bucket: ${bucket}`);
    }
    try {
      await minioClient.setBucketVersioning(bucket, { Status: 'Enabled' });
      console.log(`[minio] Versioning enabled on bucket: ${bucket}`);
    } catch (err) {
      console.warn(`[minio] Could not enable versioning on ${bucket}:`, err.message);
    }
  }
  console.log(`[minio] Buckets ready: ${buckets.join(', ')}`);
  return { success: true };
}

/** Short-lived presigned PUT URL for direct browser upload. */
export async function generatePresignedPutUrl(bucket, objectKey, expirySeconds = PRESIGNED_EXPIRY.PUT) {
  return minioClient.presignedPutObject(bucket, objectKey, expirySeconds);
}

/**
 * Short-lived presigned GET URL (for inline preview of safe mime types).
 * Never use for sensitive workflow documents — prefer `streamObject` instead.
 */
export async function generatePresignedGetUrl(bucket, objectKey, expirySeconds = PRESIGNED_EXPIRY.GET) {
  return minioClient.presignedGetObject(bucket, objectKey, expirySeconds);
}

export async function deleteObject(bucket, objectKey) {
  await minioClient.removeObject(bucket, objectKey);
  return { success: true };
}

/**
 * Remove a specific object version. Used during hard-delete / version purging.
 */
export async function deleteObjectVersion(bucket, objectKey, versionId) {
  await minioClient.removeObject(bucket, objectKey, { versionId });
  return { success: true };
}

export async function copyObject(sourceBucket, sourceKey, destBucket, destKey) {
  const conds = new minioClient.CopyConditions();
  await minioClient.copyObject(destBucket, destKey, `/${sourceBucket}/${sourceKey}`, conds);
  return { success: true };
}

/**
 * Stat an object and return its size/etag/version/meta.
 * Used by upload-complete to verify the upload actually landed.
 */
export async function getObjectMetadata(bucket, objectKey) {
  const stat = await minioClient.statObject(bucket, objectKey);
  return {
    size: stat.size,
    etag: stat.etag,
    versionId: stat.versionId || null,
    lastModified: stat.lastModified,
    metaData: stat.metaData,
  };
}

/**
 * Stream an object to an Express response with HTTP Range support.
 * Preferred path for sensitive downloads (no presigned URL leaks).
 *
 * @param {object}   args
 * @param {string}   args.bucket
 * @param {string}   args.objectKey
 * @param {object}   args.req  - Express request (for Range header)
 * @param {object}   args.res  - Express response
 * @param {string}   args.filename - user-facing filename for Content-Disposition
 * @param {string}   args.mimeType
 */
export async function streamObject({ bucket, objectKey, req, res, filename, mimeType }) {
  const stat = await minioClient.statObject(bucket, objectKey);
  const total = stat.size;
  const range = req.headers.range;

  res.setHeader('Content-Type', mimeType || 'application/octet-stream');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
  if (filename) {
    const safe = String(filename).replace(/["\\\r\n]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safe}"`);
  }

  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : total - 1;
      const length = end - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', length);
      const stream = await minioClient.getPartialObject(bucket, objectKey, start, length);
      stream.pipe(res);
      return;
    }
  }

  res.setHeader('Content-Length', total);
  const stream = await minioClient.getObject(bucket, objectKey);
  stream.pipe(res);
}

/** List all versions of an object (newest first). */
export async function listObjectVersions(bucket, prefix) {
  const results = [];
  const stream = minioClient.listObjects(bucket, prefix, true, { IncludeVersion: true });
  for await (const item of stream) {
    results.push(item);
  }
  return results;
}

/** Total bytes stored under a bucket (optionally filtered by prefix). */
export async function getBucketSize(bucket, prefix = '') {
  let total = 0;
  const stream = minioClient.listObjects(bucket, prefix, true);
  for await (const obj of stream) {
    total += obj.size;
  }
  return total;
}

export { minioClient, BUCKETS, PRESIGNED_EXPIRY };

export default {
  minioClient,
  BUCKETS,
  PRESIGNED_EXPIRY,
  ensureBuckets,
  generatePresignedPutUrl,
  generatePresignedGetUrl,
  deleteObject,
  deleteObjectVersion,
  copyObject,
  getObjectMetadata,
  streamObject,
  listObjectVersions,
  getBucketSize,
  isInlinePreviewable,
};
