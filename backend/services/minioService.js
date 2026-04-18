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

async function ensureBuckets() {
  try {
    const bucketsToCreate = Object.values(BUCKETS);
    
    for (const bucket of bucketsToCreate) {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket, BUCKETS.REGION);
        console.log(`[minio] Created bucket: ${bucket}`);
      } else {
        console.log(`[minio] Bucket already exists: ${bucket}`);
      }
    }
    
    console.log(`[minio] Buckets ready: ${bucketsToCreate.join(', ')}`);
    return { success: true };
  } catch (error) {
    console.error('[minio] Error ensuring buckets:', error);
    throw error;
  }
}

async function generatePresignedPutUrl(bucket, objectKey, expirySeconds = PRESIGNED_EXPIRY.PUT) {
  try {
    const url = await minioClient.presignedPutObject(bucket, objectKey, expirySeconds);
    return url;
  } catch (error) {
    console.error('[minio] Error generating presigned PUT URL:', error);
    throw error;
  }
}

async function generatePresignedGetUrl(bucket, objectKey, expirySeconds = PRESIGNED_EXPIRY.GET) {
  try {
    const url = await minioClient.presignedGetObject(bucket, objectKey, expirySeconds);
    return url;
  } catch (error) {
    console.error('[minio] Error generating presigned GET URL:', error);
    throw error;
  }
}

async function deleteObject(bucket, objectKey) {
  try {
    await minioClient.removeObject(bucket, objectKey);
    return { success: true };
  } catch (error) {
    console.error('[minio] Error deleting object:', error);
    throw error;
  }
}

async function copyObject(sourceBucket, sourceKey, destBucket, destKey) {
  try {
    const conds = new minioClient.CopyConditions();
    await minioClient.copyObject(destBucket, destKey, `/${sourceBucket}/${sourceKey}`, conds);
    return { success: true };
  } catch (error) {
    console.error('[minio] Error copying object:', error);
    throw error;
  }
}

async function getObjectMetadata(bucket, objectKey) {
  try {
    const stat = await minioClient.statObject(bucket, objectKey);
    return {
      size: stat.size,
      etag: stat.etag,
      lastModified: stat.lastModified,
      metaData: stat.metaData,
    };
  } catch (error) {
    console.error('[minio] Error getting object metadata:', error);
    throw error;
  }
}

async function getBucketSize(bucketName) {
  try {
    let totalSize = 0;
    const objectsStream = minioClient.listObjects(bucketName, '', true);
    
    for await (const obj of objectsStream) {
      totalSize += obj.size;
    }
    
    return totalSize;
  } catch (error) {
    console.error(`[minio] Error getting bucket size for ${bucketName}:`, error);
    throw error;
  }
}

export {
  minioClient,
  BUCKETS,
  PRESIGNED_EXPIRY,
  ensureBuckets,
  generatePresignedPutUrl,
  generatePresignedGetUrl,
  deleteObject,
  copyObject,
  getObjectMetadata,
  getBucketSize,
};
