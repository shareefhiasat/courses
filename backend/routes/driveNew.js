/**
 * SmartDrive DMS — authenticated drive routes.
 * Mounted at `/api/v1/drive`.
 */

import { Router } from 'express';
import { keycloakAuth } from '../middleware/keycloakAuth.js';
import { PrismaClient } from '@prisma/client';
import { BUCKETS } from '../services/minioService.js';

const prisma = new PrismaClient();

function resolveBucket(input) {
  if (!input) return BUCKETS.PRIVATE;
  return BUCKETS[String(input).toUpperCase()] || BUCKETS.PRIVATE;
}

import {
  initiateUpload,
  completeUpload,
  getFile,
  listFiles,
  updateFile,
  deleteFile,
  generatePublicLink,
  uploadNewVersion,
  getVersions,
  restoreVersion,
  shareFile,
  unshareFile,
  getSharedFiles,
  addComment,
  getComments,
  deleteComment,
  downloadFile,
  getStorageUsage,
  toggleStarFile,
  softDeleteFile,
  restoreFile,
  permanentDeleteFile,
  createFolder,
  getPreview,
  proxyDownload,
} from '../controllers/fileController.js';

import {
  listChildren as listFolderChildren,
  getFolder,
  createFolder as createFolderV2,
  updateFolder,
  softDeleteFolder,
  restoreFolder,
  toggleStarFolder,
  downloadFolder,
} from '../controllers/folderController.js';

import { search as searchFiles } from '../controllers/fileSearchController.js';

import {
  createFileShare,
  listFileShares,
  revokeFileShare,
  listSharedWithMe,
  listSharedByMe,
  listSharedFiles,
} from '../controllers/fileShareController.js';

import {
  createPublicLink,
  listPublicLinks,
  revokePublicLink,
  inspectPublicLink,
  downloadViaPublicLink,
} from '../controllers/publicLinkController.js';

import { getFileActivities } from '../controllers/fileActivityController.js';

const router = Router();

// WOPI endpoints for Collabora - no auth required (Collabora accesses these directly)
const wopiRouter = Router();

/**
 * WOPI Discovery endpoint for Collabora
 */
wopiRouter.get('/hosting/discovery', async (req, res) => {
  const discoveryXml = `<?xml version="1.0" encoding="utf-8"?>
<wopi-discovery>
  <net-zone name="external-https">
    <app name="Collabora Online">
      <action name="edit" ext="docx" urlsrc="${process.env.COLLABORA_URL || 'https://localhost:9980'}/browser/4610258811/cool.html?"/>
      <action name="edit" ext="xlsx" urlsrc="${process.env.COLLABORA_URL || 'https://localhost:9980'}/browser/4610258811/cool.html?"/>
      <action name="edit" ext="pptx" urlsrc="${process.env.COLLABORA_URL || 'https://localhost:9980'}/browser/4610258811/cool.html?"/>
      <action name="view" ext="docx" urlsrc="${process.env.COLLABORA_URL || 'https://localhost:9980'}/browser/4610258811/cool.html?"/>
      <action name="view" ext="xlsx" urlsrc="${process.env.COLLABORA_URL || 'https://localhost:9980'}/browser/4610258811/cool.html?"/>
      <action name="view" ext="pptx" urlsrc="${process.env.COLLABORA_URL || 'https://localhost:9980'}/browser/4610258811/cool.html?"/>
    </app>
  </net-zone>
</wopi-discovery>`;
  
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(discoveryXml);
});

/**
 * WOPI CheckFileInfo endpoint - returns file metadata
 */
wopiRouter.get('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { verifyWopiToken, extractWopiToken } = await import('../services/wopiService.js');

    // Extract and verify access token
    const token = extractWopiToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Missing access token' });
    }

    const decoded = verifyWopiToken(token);
    if (!decoded || decoded.fileId !== fileId) {
      return res.status(403).json({ success: false, error: 'Invalid access token' });
    }

    // Use fileService instead of bare Prisma
    const { getFileById } = await import('../services/fileService.js');
    const result = await getFileById(fileId, decoded.userId);

    if (!result.success) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const file = result.payload;
    const canWrite = decoded.permission === 'write';
    const userInfo = decoded.userInfo || {};

    // If fileVersionId is present, disable editing to preserve snapshot
    const supportsUpdate = canWrite && !decoded.fileVersionId;

    const metadata = {
      BaseFileName: file.name,
      Size: file.size,
      Version: file.updatedAt.getTime().toString(),
      UserId: decoded.userId,
      OwnerId: file.ownerId,
      UserCanWrite: canWrite,
      UserCanNotWriteRelative: !canWrite,
      SupportsUpdate: supportsUpdate,
      SupportsLocks: supportsUpdate,
      SupportsGetLock: supportsUpdate,
      SupportsExtendedLockLength: true,
      SupportsFolders: false,
      SupportsRename: false,
      UserFriendlyName: userInfo.displayName || 'User',
    };

    // Set WOPI user headers for Collabora
    res.setHeader('X-WOPI-UserDisplayName', userInfo.displayName || 'User');
    res.setHeader('X-WOPI-UserId', userInfo.id || decoded.userId);
    res.setHeader('X-WOPI-UserEmail', userInfo.email || '');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(metadata);
  } catch (error) {
    console.error('[WOPI CheckFileInfo] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * WOPI GetFile endpoint - returns file contents
 */
wopiRouter.get('/files/:fileId/contents', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { verifyWopiToken, extractWopiToken } = await import('../services/wopiService.js');

    // Extract and verify access token
    const token = extractWopiToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Missing access token' });
    }

    const decoded = verifyWopiToken(token);
    if (!decoded || decoded.fileId !== fileId) {
      return res.status(403).json({ success: false, error: 'Invalid access token' });
    }

    // Use fileService instead of bare Prisma
    const { getFileById } = await import('../services/fileService.js');
    const result = await getFileById(fileId, decoded.userId);

    if (!result.success) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const file = result.payload;
    const bucketReal = resolveBucket(file.bucket);

    // If fileVersionId is present in token, use that specific version
    let s3Key = file.s3Key;
    if (decoded.fileVersionId) {
      console.log('[WOPI GetFile] Using specific file version:', decoded.fileVersionId);
      const fileVersion = await prisma.fileVersion.findUnique({
        where: { id: decoded.fileVersionId }
      });
      if (fileVersion && fileVersion.fileId === fileId) {
        s3Key = fileVersion.s3Key;
        console.log('[WOPI GetFile] Using version s3Key:', s3Key);
      } else {
        console.warn('[WOPI GetFile] File version not found or mismatch, falling back to current');
      }
    }

    // Stream the file from MinIO
    const { minioClient } = await import('../services/minioService.js');
    const stream = await minioClient.getObject(bucketReal, s3Key);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    stream.pipe(res);
  } catch (error) {
    console.error('[WOPI GetFile] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * WOPI Lock endpoint - locks file for editing
 */
wopiRouter.post('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const wopiOverride = req.headers['x-wopi-override'];
    const { verifyWopiToken, extractWopiToken } = await import('../services/wopiService.js');
    
    // Extract and verify access token
    const token = extractWopiToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Missing access token' });
    }
    
    const decoded = verifyWopiToken(token);
    if (!decoded || decoded.fileId !== fileId) {
      return res.status(403).json({ success: false, error: 'Invalid access token' });
    }
    
    // Check write permission
    if (decoded.permission !== 'write') {
      return res.status(403).json({ success: false, error: 'No write permission' });
    }
    
    // Use fileService instead of bare Prisma
    const { getFileById } = await import('../services/fileService.js');
    const result = await getFileById(fileId, decoded.userId);
    
    if (!result.success) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Handle different WOPI operations
    if (wopiOverride === 'LOCK' || wopiOverride === 'REFRESH_LOCK') {
      // File locking - just acknowledge it (simplified implementation)
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ success: true });
    } else if (wopiOverride === 'UNLOCK') {
      // File unlocking - just acknowledge it
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ success: true });
    } else if (wopiOverride === 'PUT') {
      // This shouldn't happen - PUT should go to /contents
      return res.status(400).json({ success: false, error: 'Use PUT /contents for file updates' });
    }
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(501).json({ success: false, error: 'Operation not implemented' });
  } catch (error) {
    console.error('[WOPI Lock/Unlock] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * WOPI PutFile endpoint - saves file changes
 */
wopiRouter.post('/files/:fileId/contents', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { verifyWopiToken, extractWopiToken } = await import('../services/wopiService.js');
    
    // Extract and verify access token
    const token = extractWopiToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Missing access token' });
    }
    
    const decoded = verifyWopiToken(token);
    if (!decoded || decoded.fileId !== fileId) {
      return res.status(403).json({ success: false, error: 'Invalid access token' });
    }
    
    // Check write permission
    if (decoded.permission !== 'write') {
      return res.status(403).json({ success: false, error: 'No write permission' });
    }
    
    // Use fileService instead of bare Prisma
    const { getFileById } = await import('../services/fileService.js');
    const result = await getFileById(fileId, decoded.userId);
    
    if (!result.success) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    const file = result.payload;
    const bucketReal = resolveBucket(file.bucket);
    
    // Get file buffer from request body
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        
        // Upload to MinIO
        const { minioClient } = await import('../services/minioService.js');
        await minioClient.putObject(bucketReal, file.s3Key, buffer, buffer.length, {
          'Content-Type': file.mimeType,
        });
        
        // Update file in database using fileService
        const { updateFile } = await import('../services/fileService.js');
        await updateFile(fileId, decoded.userId, { 
          size: buffer.length, 
          updatedAt: new Date() 
        });
        
        // Log activity
        await prisma.fileActivity.create({
          data: {
            fileId,
            userId: decoded.userId,
            action: 'edit',
          },
        });
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ success: true, LastModifiedTime: new Date().toISOString() });
      } catch (uploadError) {
        console.error('[WOPI PutFile] Upload error:', uploadError);
        res.status(500).json({ success: false, error: uploadError.message });
      }
    });
  } catch (error) {
    console.error('[WOPI PutFile] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// All drive routes require auth.
router.use(keycloakAuth([]));

// ---------------- Files ----------------
router.post('/upload/initiate', initiateUpload);
router.post('/upload/:fileId/complete', completeUpload);
router.get('/files', listFiles);
router.get('/files/search', searchFiles);
router.get('/files/:fileId', getFile);
router.put('/files/:fileId', updateFile);
router.delete('/files/:fileId', deleteFile);

// Star, Trash, Restore
router.patch('/files/:fileId/star', toggleStarFile);
router.delete('/files/:fileId/trash', softDeleteFile);
router.post('/files/:fileId/restore', restoreFile);
router.delete('/files/:fileId/permanent', permanentDeleteFile);

// Preview & secure download
router.get('/files/:fileId/preview', getPreview);
router.get('/files/:fileId/download', (req, res, next) => {
  console.log('[driveNew.js] Download route hit for fileId:', req.params.fileId);
  next();
}, proxyDownload);

// Activity logging
router.post('/files/:fileId/activity', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { action } = req.body;
    const actorUserId = req.user?.keycloakId;

    console.log('[driveNew.js] Activity logging:', { fileId, action, actorUserId });

    if (!actorUserId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Get database user ID from Keycloak ID
    const user = await prisma.user.findUnique({ where: { keycloakId: actorUserId } });
    if (!user) {
      console.error('[driveNew.js] User not found for Keycloak ID:', actorUserId);
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await prisma.fileActivity.create({
      data: {
        fileId,
        userId: user.id,
        action: action || 'view',
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[driveNew.js] Activity logging error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Legacy redirect-based download (s3Key based) — keep temporarily.
router.get('/files-by-key/:s3Key/download', downloadFile);

// ---------------- Folders (v2) ----------------
router.get('/folders', listFolderChildren);
router.get('/folders/:folderId', getFolder);
router.post('/folders', createFolderV2);
// Legacy path used by existing front-end code — points at same handler.
router.post('/folders/legacy', createFolder);
router.patch('/folders/:folderId', updateFolder);
router.delete('/folders/:folderId/trash', softDeleteFolder);
router.post('/folders/:folderId/restore', restoreFolder);
router.patch('/folders/:folderId/star', toggleStarFolder);
router.get('/folders/:folderId/download', downloadFolder);

// ---------------- Versions ----------------
router.post('/files/:fileId/versions', uploadNewVersion);
router.get('/files/:fileId/versions', getVersions);
router.post('/versions/:versionId/restore', restoreVersion);

// ---------------- Sharing (v2 unified ACL) ----------------
router.post('/shares', createFileShare);
router.get('/files/:fileId/shares', listFileShares);
router.delete('/shares/:shareId', revokeFileShare);
router.get('/shared-with-me', listSharedWithMe);
router.get('/shared-by-me', listSharedByMe);
router.get('/shared', listSharedFiles);

// Legacy endpoints (keep for backward compatibility, delegate to v2).
router.post('/files/:fileId/share', shareFile);
router.delete('/shares/:shareId', unshareFile);
router.get('/shared-legacy', getSharedFiles);

// ---------------- Public links (v2 token-based) ----------------
router.post('/public-links', createPublicLink);
router.get('/files/:fileId/public-links', listPublicLinks);
router.delete('/public-links/:linkId', revokePublicLink);

// Legacy endpoint (keep for backward compatibility).
router.post('/files/:fileId/public-link', generatePublicLink);

// ---------------- Comments ----------------
router.post('/files/:fileId/comments', addComment);
router.get('/files/:fileId/comments', getComments);
router.delete('/files/:fileId/comments/:commentId', deleteComment);

// ---------------- Activities ----------------
router.get('/files/:fileId/activities', getFileActivities);

// ---------------- Misc ----------------
router.get('/storage', getStorageUsage);

export default router;
export { wopiRouter };
