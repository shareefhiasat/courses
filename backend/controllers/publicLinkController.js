/**
 * Public Link Controller
 *
 * Thin HTTP layer over publicLinkService.
 * Authenticated endpoints: create, list, revoke
 * Public endpoints: inspect, download (via token)
 */

import publicLinkService from '../services/publicLinkService.js';

export async function createPublicLink(req, res) {
  const { fileId, folderId, password, maxDownloads, expiryDays, expiresAt } = req.body;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await publicLinkService.createLink(
    { fileId, folderId, password, maxDownloads, expiryDays, expiresAt },
    actor
  );
  if (!result.success) {
    console.error('[publicLinkController.createPublicLink] Failed:', result.error);
    return res.status(400).json(result);
  }
  
  // Log the generated public link
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const publicUrl = `${baseUrl}/public/${result.payload.token}`;
  console.log('🔗 [PUBLIC LINK CREATED]', {
    fileId,
    folderId,
    token: result.payload.token,
    publicUrl,
    expiresAt: result.payload.expiresAt,
    createdBy: actor.userId
  });
  
  return res.status(201).json(result);
}

export async function listPublicLinks(req, res) {
  const { fileId } = req.params;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await publicLinkService.listLinksForFile(fileId, actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function revokePublicLink(req, res) {
  const { linkId } = req.params;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await publicLinkService.revokeLink(linkId, actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

// --------------------------------------------------------------------------
// Public (unauthenticated) endpoints
// --------------------------------------------------------------------------

export async function inspectPublicLink(req, res) {
  const { token } = req.params;
  const result = await publicLinkService.inspectLink(token);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function downloadViaPublicLink(req, res) {
  const { token } = req.params;
  const { password } = req.query; // Changed from req.body to req.query for GET
  const result = await publicLinkService.resolveTokenForDownload(token, { password });
  if (!result.success) return res.status(400).json(result);

  // Stream the file through the MinIO proxy (same as authenticated download).
  const { file } = result.payload;
  const minioService = (await import('../services/minioService.js')).default;
  const fileVersionService = (await import('../services/fileVersionService.js')).default;

  // Get latest version for streaming (skip auth check for public links)
  const versionRes = await fileVersionService.listVersions(file.id, null);

  // If no versions exist, try to use the file's direct s3Key if available
  let s3Key;
  let bucketName;
  if (!versionRes.success || !versionRes.payload.length) {
    console.log('[downloadViaPublicLink] No versions found, checking file.s3Key');
    if (file.s3Key) {
      s3Key = file.s3Key;
      bucketName = file.bucket;
    } else {
      return res.status(404).json({ 
        success: false, 
        error: { 
          code: 'NO_FILE_CONTENT', 
          message: 'File content not available. The file may have been corrupted or deleted from storage.' 
        } 
      });
    }
  } else {
    const latestVersion = versionRes.payload[0];
    s3Key = latestVersion.s3Key;
    bucketName = file.bucket;
  }

  // Map bucket name to actual MinIO bucket name
  const BUCKETS = {
    PRIVATE: process.env.MINIO_BUCKET_PRIVATE || 'lms-private',
    WORKFLOW: process.env.MINIO_BUCKET_WORKFLOW || 'lms-workflow',
    SHARED: process.env.MINIO_BUCKET_SHARED || 'lms-shared',
  };
  const bucket = BUCKETS[bucketName] || bucketName;

  try {
    await minioService.streamObject({ bucket, objectKey: s3Key, req, res, filename: file.name, mimeType: file.mimeType });
  } catch (error) {
    console.error('[downloadViaPublicLink] Unexpected error:', error);
    // Attempt fallback for legacy files if the error is about not found
    if (error.message?.includes('Not Found') || error.code === 'NotFound') {
      console.log('[downloadViaPublicLink] Object not found, attempting legacy fallback');
      try {
        const { minioClient } = await import('../services/minioService.js');
        const prefix = `${bucketName}/${file.ownerId}/${file.id}/`;
        console.log('[downloadViaPublicLink] Listing objects with prefix:', prefix);
        const objectsStream = minioClient.listObjects(bucket, prefix, true);
        const objects = [];
        for await (const obj of objectsStream) {
          objects.push(obj);
        }
        console.log('[downloadViaPublicLink] Found objects:', objects.length);
        if (objects.length > 0) {
          const fallbackKey = objects[0].name;
          console.log('[downloadViaPublicLink] Using fallback key:', fallbackKey);
          return await minioService.streamObject({ 
            bucket, 
            objectKey: fallbackKey, 
            req, 
            res, 
            filename: file.name, 
            mimeType: file.mimeType 
          });
        }
      } catch (listError) {
        console.error('[downloadViaPublicLink] Fallback failed:', listError);
      }
    }
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        error: { code: 'DOWNLOAD_FAILED', message: 'Failed to download file' } 
      });
    }
  }
}

export default {
  createPublicLink,
  listPublicLinks,
  revokePublicLink,
  inspectPublicLink,
  downloadViaPublicLink,
};
