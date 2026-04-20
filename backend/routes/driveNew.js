import { Router } from 'express';
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
  downloadFile,
  getStorageUsage,
  toggleStarFile,
  softDeleteFile,
  restoreFile,
  permanentDeleteFile,
  createFolder,
} from '../controllers/fileController.js';

const router = Router();

// File operations
router.post('/upload/initiate', initiateUpload);
router.post('/upload/:fileId/complete', completeUpload);
router.get('/files', listFiles);
router.get('/files/:fileId', getFile);
router.put('/files/:fileId', updateFile);
router.delete('/files/:fileId', deleteFile);

// Star, Trash, Restore
router.patch('/files/:fileId/star', toggleStarFile);
router.delete('/files/:fileId/trash', softDeleteFile);
router.post('/files/:fileId/restore', restoreFile);
router.delete('/files/:fileId/permanent', permanentDeleteFile);

// Folders
router.post('/folders', createFolder);

// Download endpoint
router.get('/files/:s3Key/download', downloadFile);

// Storage
router.get('/storage', getStorageUsage);

// Public links
router.post('/files/:fileId/public-link', generatePublicLink);

// Versioning
router.post('/files/:fileId/versions', uploadNewVersion);
router.get('/files/:fileId/versions', getVersions);
router.post('/versions/:versionId/restore', restoreVersion);

// Sharing
router.post('/files/:fileId/share', shareFile);
router.delete('/shares/:shareId', unshareFile);
router.get('/shared', getSharedFiles);

// Comments
router.post('/files/:fileId/comments', addComment);
router.get('/files/:fileId/comments', getComments);

export default router;
