/**
 * User Images Routes
 *
 * PURPOSE: Expose endpoints for user image uploads with Keycloak authentication and RBAC
 * ARCHITECTURE: HTTP Routes → Controllers → Nextcloud Service → Nextcloud WebDAV API
 */

import { Router } from 'express';
import multer from 'multer';
import { keycloakAuth } from '../middleware/keycloakAuth.js';
import { LMS_ROLES } from '../services/keycloakAdminService.js';
import {
  uploadUserImageController,
  getUserImageController,
  deleteUserImageController,
  getAllUserImagesController,
  proxyImageController
} from '../controllers/userImages.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// All routes require Keycloak authentication (supports Bearer header or cookie)
router.use(keycloakAuth([]));

// Proxy image from Nextcloud (serves image through backend to avoid auth dialog)
// Cookie-based auth allows <img> tags to load images without Bearer token
router.get('/proxy/:userId/:type', proxyImageController);

// Upload image for a user (type: profile|qid|military|additional)
router.post('/:userId/images/:type', upload.single('file'), uploadUserImageController);

// Get specific image for a user
router.get('/:userId/images/:type', getUserImageController);

// Get all images for a user
router.get('/:userId/images', getAllUserImagesController);

// Delete image for a user
router.delete('/:userId/images/:type', deleteUserImageController);

export default router;
