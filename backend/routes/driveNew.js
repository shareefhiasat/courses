/**
 * SmartDrive DMS — authenticated drive routes.
 * Mounted at `/api/v1/drive`.
 */

import { Router } from 'express';
import multer from 'multer';
import { keycloakAuth } from '../middleware/keycloakAuth.js';
import prisma from '../db/prismaClient.js';
import { isHrAccessibleWorkflow, isAdminAccessibleWorkflow } from '../utils/workflowTaxonomy.js';
import { BUCKETS, putObject, streamObject, deleteObject } from '../services/minioService.js';


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
  getFolderTree,
  getFolder,
  createFolder as createFolderV2,
  updateFolder,
  softDeleteFolder,
  restoreFolder,
  permanentDeleteFolder,
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
  // Collabora runs with SSL, but backend is HTTP - WOPI endpoints are HTTP
  const collaboraUrl = process.env.COLLABORA_URL || 'https://localhost:9980';
  const wopiBaseUrl = process.env.WOPI_BASE_URL || 'http://host.docker.internal:8001/api/v1/wopi';
  const discoveryXml = `<?xml version="1.0" encoding="utf-8"?>
<wopi-discovery>
  <net-zone name="external-https">
    <app name="Collabora Online">
      <action name="edit" ext="docx" urlsrc="${collaboraUrl}/browser/4610258811/cool.html?WOPISrc=${wopiBaseUrl}/files/<id>&amp;access_token=<access_token>"/>
      <action name="edit" ext="xlsx" urlsrc="${collaboraUrl}/browser/4610258811/cool.html?WOPISrc=${wopiBaseUrl}/files/<id>&amp;access_token=<access_token>"/>
      <action name="edit" ext="pptx" urlsrc="${collaboraUrl}/browser/4610258811/cool.html?WOPISrc=${wopiBaseUrl}/files/<id>&amp;access_token=<access_token>"/>
      <action name="view" ext="docx" urlsrc="${collaboraUrl}/browser/4610258811/cool.html?WOPISrc=${wopiBaseUrl}/files/<id>&amp;access_token=<access_token>"/>
      <action name="view" ext="xlsx" urlsrc="${collaboraUrl}/browser/4610258811/cool.html?WOPISrc=${wopiBaseUrl}/files/<id>&amp;access_token=<access_token>"/>
      <action name="view" ext="pptx" urlsrc="${collaboraUrl}/browser/4610258811/cool.html?WOPISrc=${wopiBaseUrl}/files/<id>&amp;access_token=<access_token>"/>
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
    // Content-Disposition not needed for WOPI - Collabora handles filename from CheckFileInfo
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

// Mount WOPI (no auth required for WOPI - Collabora accesses directly)
router.use('/wopi', wopiRouter);

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
router.get('/files/:fileId/collabora/edit', async (req, res) => {
  try {
    const { fileId } = req.params;
    const actorUserId = req.user?.keycloakId;

    if (!actorUserId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Get database user ID from Keycloak ID
    const user = await prisma.user.findUnique({ 
      where: { keycloakId: actorUserId },
      include: { roleAssignments: true }
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get user's application roles
    const roleIds = user?.roleAssignments?.map(ra => ra.roleId) || [];
    const roles = await prisma.userRoles.findMany({
      where: { id: { in: roleIds } },
      select: { code: true }
    });
    const userRoles = roles.map(r => r.code.toLowerCase());

    // Get file
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Check edit permission - owners always have edit permission
    const { canAccessFile } = await import('../services/permissionService.js');
    const permissionResult = await canAccessFile(fileId, { userId: user.id, roles: userRoles });
    
    // Owner always has edit permission
    const isOwner = file.ownerId === user.id;
    const hasEditPermission = isOwner || (permissionResult.allowed && permissionResult.permission === 'EDIT');
    
    if (!hasEditPermission) {
      return res.status(403).json({ success: false, error: 'No edit permission' });
    }

    // Generate WOPI token with write permission
    const { generateWopiToken } = await import('../services/wopiService.js');
    const userInfo = {
      displayName: user.displayName || 'User',
      email: user.email || '',
      id: user.id,
    };
    const wopiToken = generateWopiToken(user.id, fileId, 'write', userInfo);

    return res.json({ success: true, payload: { wopiToken } });
  } catch (error) {
    console.error('[Collabora Edit] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get('/files/:fileId/download', async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const actorUserId = req.user?.keycloakId;

    console.log('[driveNew.js] Download request:', { fileId, actorUserId, userRoles: req.user?.roles });

    if (!actorUserId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Get database user ID from Keycloak ID
    const user = await prisma.user.findUnique({ where: { keycloakId: actorUserId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    console.log('[driveNew.js] User found:', { userId: user.id, email: user.email });

    // Check if file is part of a workflow document
    const workflowDoc = await prisma.workflowDocument.findFirst({
      where: { fileId },
      select: {
        id: true,
        submitterId: true,
        currentAssigneeId: true,
        workflowType: true,
        workflowCategory: true,
        attendanceSubtype: true,
        approvalFlow: true,
        status: true
      }
    });

    console.log('[driveNew.js] Workflow document lookup:', { workflowDoc });

    // If file is part of a workflow, check if user is a participant
    if (workflowDoc) {
      const userRoles = req.user?.roles || [];
      const isHR = userRoles.includes('hr') || userRoles.includes('HR');
      const isAdmin = userRoles.includes('admin') || userRoles.includes('ADMIN');
      const isSuperAdmin = userRoles.includes('super_admin') || userRoles.includes('SUPER_ADMIN');
      const isSubmitter = workflowDoc.submitterId === user.id;
      const isAssignee = workflowDoc.currentAssigneeId === user.id;

      console.log('[driveNew.js] Workflow permission check:', {
        userRoles,
        isHR,
        isAdmin,
        isSuperAdmin,
        isSubmitter,
        isAssignee,
        workflowType: workflowDoc.workflowType
      });

      // Allow download if user is:
      // - Submitter
      // - Current assignee
      // - HR (for GENERAL workflows)
      // - Admin (for ATTENDANCE_WEEKLY workflows)
      // - Super Admin (any workflow)
      if (isSubmitter || isAssignee || isSuperAdmin) {
        console.log('[driveNew.js] Workflow participant allowed download:', { fileId, userId: user.id, reason: 'participant' });
        return next();
      }

      if (isHR && isHrAccessibleWorkflow(workflowDoc)) {
        console.log('[driveNew.js] HR allowed download for workflow:', { fileId, userId: user.id, category: workflowDoc.workflowCategory });
        return next();
      }

      if (isAdmin && isAdminAccessibleWorkflow(workflowDoc)) {
        console.log('[driveNew.js] Admin allowed download for workflow:', { fileId, userId: user.id, category: workflowDoc.workflowCategory });
        return next();
      }

      console.log('[driveNew.js] Not a workflow participant — falling through to ACL permission check:', { fileId, userId: user.id, userRoles, workflowType: workflowDoc.workflowType });
      // Do NOT return 403 here — fall through to the standard ACL check below so users
      // with a valid fileShare on this file can still download it.
    }

    // Standard ACL check: VIEW (or higher) share is sufficient for download.
    const { requireFilePermission } = await import('../services/permissionService.js');
    const dbRoles = req.user?.roles || [];
    await requireFilePermission(fileId, { userId: user.id, roles: dbRoles }, 'VIEW');

    // Permission granted, proceed with download
    next();
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, error: 'No download permission' });
    }
    if (error.status === 404) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    console.error('[driveNew.js] Download permission check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
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
    const user = await prisma.user.findUnique({
      where: { keycloakId: actorUserId },
      include: { roleAssignments: { include: { role: true } } },
    });
    if (!user) {
      console.error('[driveNew.js] User not found for Keycloak ID:', actorUserId);
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Require at least VIEW permission before accepting an activity log entry.
    const { requireFilePermission } = await import('../services/permissionService.js');
    const userRoles = user.roleAssignments?.map(ra => ra.role?.code?.toLowerCase()).filter(Boolean) || [];
    await requireFilePermission(fileId, { userId: user.id, roles: userRoles }, 'VIEW');

    await prisma.fileActivity.create({
      data: {
        fileId,
        userId: user.id,
        action: action || 'view',
      },
    });

    res.json({ success: true });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, error: 'No permission to log activity on this file' });
    }
    if (error.status === 404) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    console.error('[driveNew.js] Activity logging error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Legacy redirect-based download (s3Key based) — keep temporarily.
router.get('/files-by-key/:s3Key/download', downloadFile);

// ---------------- Folders (v2) ----------------
router.get('/folders', listFolderChildren);
router.get('/folders/tree', getFolderTree);
router.get('/folders/:folderId', getFolder);
router.post('/folders', createFolderV2);
// Legacy path used by existing front-end code — points at same handler.
router.post('/folders/legacy', createFolder);
router.patch('/folders/:folderId', updateFolder);
router.delete('/folders/:folderId/trash', softDeleteFolder);
router.post('/folders/:folderId/restore', restoreFolder);
router.delete('/folders/:folderId/permanent', permanentDeleteFolder);
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

// ---------------- Chat Upload ----------------
const chatUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
router.post('/chat-upload', chatUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }
    // Scope path to the uploading user so files are user-isolated and never path-guessable.
    const actorId = req.user?.keycloakId || 'unknown';
    const filePath = `chat-attachments/${actorId}/${Date.now()}_${req.file.originalname}`;
    const bucket = BUCKETS.PRIVATE;
    const metaData = {
      'Content-Type': req.file.mimetype,
    };
    await putObject(bucket, filePath, req.file.buffer, req.file.size, metaData);

    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/api/v1/drive/chat-file-preview/${encodeURIComponent(filePath)}`;

    res.json({ success: true, data: { url: fileUrl, path: filePath, fileName: req.file.originalname, fileType: req.file.mimetype, fileSize: req.file.size } });
  } catch (err) {
    console.error('[driveNew] chat-upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- Chat File Preview (stream from MinIO by path) ----------------
router.get('/chat-file-preview/:filePath', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const bucket = BUCKETS.PRIVATE;

    // Determine filename and mime type from path
    const filename = filePath.split('/').pop() || 'file';
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeMap = {
      webm: 'audio/webm', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
      pdf: 'application/pdf', txt: 'text/plain', json: 'application/json',
      mp4: 'video/mp4', webm_video: 'video/webm',
    };
    const mimeType = mimeMap[ext] || 'application/octet-stream';

    await streamObject({ bucket, objectKey: filePath, req, res, filename, mimeType });
  } catch (err) {
    console.error('[driveNew] chat-file-preview error:', err);
    if (!res.headersSent) {
      res.status(404).json({ success: false, error: 'File not found' });
    }
  }
});

// ---------------- Chat File Delete (remove from MinIO by path) ----------------
router.delete('/chat-file', async (req, res) => {
  try {
    const filePath = req.query.filePath;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'filePath is required' });
    }
    const bucket = BUCKETS.PRIVATE;
    await deleteObject(bucket, filePath);
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    console.error('[driveNew] chat-file delete error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
export { wopiRouter };
