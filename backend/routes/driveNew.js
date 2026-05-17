/**
 * SmartDrive DMS — authenticated drive routes.
 * Mounted at `/api/v1/drive`.
 */

import { Router } from 'express';
import { keycloakAuth } from '../middleware/keycloakAuth.js';

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
