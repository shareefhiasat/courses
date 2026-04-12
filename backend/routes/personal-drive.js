/**
 * Personal Drive Routes
 *
 * PURPOSE: Expose personal file management endpoints with Nextcloud integration
 */

import { Router } from 'express';
import multer from 'multer';
import {
  uploadFileController,
  listFilesController,
  deleteFileController,
  shareFileController,
  addCommentController,
  downloadFileController
} from '../controllers/personalDrive.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// File operations
router.post('/upload', upload.single('file'), uploadFileController);
router.get('/files', listFilesController);
router.delete('/files', deleteFileController);
router.post('/share', shareFileController);
router.post('/comment', addCommentController);
router.get('/download', downloadFileController);

export default router;
