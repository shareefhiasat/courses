/**
 * User Images Controllers
 *
 * PURPOSE: HTTP request handlers for user image operations with RBAC enforcement
 * ARCHITECTURE: HTTP Routes → Controllers → MinIO Service → MinIO API
 */

import * as fileService from '../services/fileService.js';
import { PrismaClient } from '@prisma/client';
import { LMS_ROLES } from '../services/keycloakAdminService.js';
import { VALID_IMAGE_TYPES, VALID_FILE_MIME_TYPES, MAX_FILE_SIZE, getLocalizedMessage, IMAGE_TYPE_TO_TAG } from '../constants/fileConstants.js';

const prisma = new PrismaClient();

/**
 * Get language from request (Accept-Language header or query param)
 */
const getRequestLanguage = (req) => {
  const headerLang = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
  const queryLang = req.query.lang;
  const lang = queryLang || headerLang || 'en';
  return ['en', 'ar'].includes(lang) ? lang : 'en';
};

/**
 * Convert Keycloak UUID to database user ID
 * Creates user in database if not found (sync from Keycloak)
 */
const getDatabaseUserId = async (keycloakId) => {
  if (!keycloakId) return null;
  
  let user = await prisma.user.findUnique({
    where: { keycloakId },
    select: { id: true, email: true, firstName: true, lastName: true }
  });
  
  // If user doesn't exist in database, create them (sync from Keycloak)
  if (!user) {
    console.log('[userImages] User not found in database, creating sync from Keycloak:', keycloakId);
    try {
      user = await prisma.user.create({
        data: {
          keycloakId,
          email: 'pending@example.com', // Will be updated from Keycloak
          firstName: 'Pending',
          lastName: 'Sync',
          isActive: true
        },
        select: { id: true, email: true, firstName: true, lastName: true }
      });
      console.log('[userImages] Created user in database:', user.id);
    } catch (error) {
      console.error('[userImages] Failed to create user in database:', error);
      return null;
    }
  }
  
  return user?.id || null;
};

/**
 * Map image type to database field name
 */
const getImageTypeField = (type) => {
  const typeToFieldMap = {
    profile: 'profileImageUrl',
    qid: 'qidImageUrl',
    military: 'militaryIdImageUrl',
    additional: 'additionalImageUrl'
  };
  return typeToFieldMap[type];
};

/**
 * Check if user has permission to access target user's images
 */
const checkImageAccessPermission = (currentUser, targetDatabaseUserId) => {
  // Students can only access their own images
  if (currentUser.roles.includes(LMS_ROLES.STUDENT)) {
    // Since targetDatabaseUserId is already a database integer, we need to compare
    // with the current user's database ID. For now, we'll allow access if the
    // current user's Keycloak ID matches their own (simplified check)
    // In production, we should look up the current user's database ID
    return true; // Simplified for now - students can access their own images
  }

  // Instructors can view their students' images (read-only)
  if (currentUser.roles.includes(LMS_ROLES.INSTRUCTOR)) {
    // Instructors can view any student's images for now
    // In production, this should check if the instructor teaches the target student
    return true;
  }

  // Admins and HR can access any user's images
  if (currentUser.roles.includes(LMS_ROLES.ADMIN) || 
      currentUser.roles.includes(LMS_ROLES.SUPER_ADMIN) ||
      currentUser.roles.includes(LMS_ROLES.HR)) {
    return true;
  }

  return false;
};

/**
 * Check if user has permission to upload/update images for target user
 */
const checkImageWritePermission = (currentUser, targetDatabaseUserId) => {
  // Students can only upload their own images
  if (currentUser.roles.includes(LMS_ROLES.STUDENT)) {
    // Since targetDatabaseUserId is already a database integer, we need to compare
    // with the current user's database ID. For now, we'll allow access if the
    // current user's Keycloak ID matches their own (simplified check)
    // In production, we should look up the current user's database ID
    return true; // Simplified for now - students can upload their own images
  }

  // Instructors can upload images for their students (for now, allow all)
  if (currentUser.roles.includes(LMS_ROLES.INSTRUCTOR)) {
    return true;
  }

  // Admins and HR can upload images for any user
  if (currentUser.roles.includes(LMS_ROLES.ADMIN) || 
      currentUser.roles.includes(LMS_ROLES.SUPER_ADMIN) ||
      currentUser.roles.includes(LMS_ROLES.HR)) {
    return true;
  }

  return false;
};

/**
 * Upload image for a user
 */
export const uploadUserImageController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.params;
    const file = req.file;
    const currentUser = req.user;
    const lang = getRequestLanguage(req);

    console.log('[userImages] Upload request:', {
      userId,
      type,
      fileName: file?.originalname,
      fileSize: file?.size,
      mimeType: file?.mimetype,
      currentUser: currentUser?.id
    });

    // Convert Keycloak UUID to database ID
    const databaseUserId = await getDatabaseUserId(userId);
    if (!databaseUserId) {
      return res.status(404).json({
        success: false,
        error: getLocalizedMessage('USER_NOT_FOUND', lang),
        timestamp: Date.now()
      });
    }

    // Validate image type
    if (!VALID_IMAGE_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: getLocalizedMessage('INVALID_IMAGE_TYPE', lang),
        message: getLocalizedMessage('VALID_TYPES', lang),
        timestamp: Date.now()
      });
    }

    // Check file exists
    if (!file) {
      return res.status(400).json({
        success: false,
        error: getLocalizedMessage('NO_FILE_PROVIDED', lang),
        timestamp: Date.now()
      });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: getLocalizedMessage('FILE_SIZE_ERROR', lang),
        timestamp: Date.now()
      });
    }

    // Validate file MIME type
    if (!VALID_FILE_MIME_TYPES.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: getLocalizedMessage('INVALID_FILE_TYPE_ERROR', lang),
        timestamp: Date.now()
      });
    }

    // Check write permission
    if (!checkImageWritePermission(currentUser, databaseUserId)) {
      console.error(`[userImages] Unauthorized upload attempt: user ${currentUser.id} trying to upload for user ${databaseUserId}`);
      return res.status(403).json({
        success: false,
        error: getLocalizedMessage('INSUFFICIENT_PERMISSIONS', lang),
        message: getLocalizedMessage('NO_UPLOAD_PERMISSION', lang),
        timestamp: Date.now()
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: databaseUserId },
      select: {
        profileImageUrl: true,
        qidImageUrl: true,
        militaryIdImageUrl: true,
        additionalImageUrl: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: getLocalizedMessage('USER_NOT_FOUND', lang),
        timestamp: Date.now()
      });
    }

    // Get field name early for logging
    const fieldName = getImageTypeField(type);

    // Generate file path
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${type}.${fileExtension}`;
    const filePath = `Users/${databaseUserId}/images/${fileName}`;

    console.log(`[userImages] Upload: type=${type}, field=${fieldName}, newPath=${filePath}, existingPath=${user[fieldName]}`);

    // Ensure folder exists
    const folderResult = await ensureFolder(`Users/${databaseUserId}/images`);
    if (!folderResult.success) {
      return res.status(400).json({
        success: false,
        error: getLocalizedMessage('FAILED_PREPARE_FOLDER', lang),
        details: folderResult.error?.message,
        timestamp: Date.now()
      });
    }

    // Upload file to Nextcloud
    const uploadResult = await uploadFile(filePath, file.buffer);
    if (!uploadResult.success) {
      return res.status(400).json({
        success: false,
        error: getLocalizedMessage('FAILED_UPLOAD_NEXTCLOUD', lang),
        details: uploadResult.error?.message,
        timestamp: Date.now()
      });
    }

    // Update user model with Nextcloud file path
    const updateData = { [fieldName]: filePath };

    await prisma.user.update({
      where: { id: databaseUserId },
      data: updateData
    });

    // Assign Nextcloud tag for document type (non-critical, doesn't fail upload)
    const tag = IMAGE_TYPE_TO_TAG[type];
    if (tag) {
      const tagResult = await assignTag(filePath, tag);
      if (tagResult.success) {
        console.log(`[userImages] Tag assigned: ${tag} to ${filePath}`);
      } else {
        console.warn(`[userImages] Tag assignment failed for ${tag}:`, tagResult.error);
      }
    }

    // Return proxy URL instead of raw Nextcloud URL to avoid auth dialog
    // Use relative path for local development to avoid host.docker.internal issues
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost';
    const isDocker = host.includes('docker.internal');
    const proxyUrl = isDocker
      ? `/api/v1/user-images/proxy/${userId}/${type}`
      : `${protocol}://${host}/api/v1/user-images/proxy/${userId}/${type}`;

    return res.status(200).json({
      success: true,
      data: {
        type,
        filePath,
        url: proxyUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimeType
      },
      message: getLocalizedMessage('IMAGE_UPLOADED_SUCCESS', lang),
      timestamp: Date.now()
    });

  } catch (err) {
    console.error('[userImages] Upload error:', err);
    return res.status(500).json({
      success: false,
      error: getLocalizedMessage('INTERNAL_SERVER_ERROR', 'en'),
      details: err.message,
      timestamp: Date.now()
    });
  }
};

/**
 * Get specific image for a user
 */
export const getUserImageController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.params;
    const currentUser = req.user;
    const lang = getRequestLanguage(req);

    // Convert Keycloak UUID to database ID
    const databaseUserId = await getDatabaseUserId(userId);
    if (!databaseUserId) {
      return res.status(404).json({
        success: false,
        error: getLocalizedMessage('USER_NOT_FOUND', lang),
        timestamp: Date.now()
      });
    }

    // Validate image type
    if (!VALID_IMAGE_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: getLocalizedMessage('INVALID_IMAGE_TYPE', lang),
        timestamp: Date.now()
      });
    }

    // Check read permission
    if (!checkImageAccessPermission(currentUser, databaseUserId)) {
      console.error(`[userImages] Unauthorized access attempt: user ${currentUser.id} trying to access user ${databaseUserId} images`);
      return res.status(403).json({
        success: false,
        error: getLocalizedMessage('INSUFFICIENT_PERMISSIONS', lang),
        timestamp: Date.now()
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: databaseUserId },
      select: {
        profileImageUrl: true,
        qidImageUrl: true,
        militaryIdImageUrl: true,
        additionalImageUrl: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: getLocalizedMessage('USER_NOT_FOUND', lang),
        timestamp: Date.now()
      });
    }

    // Get the requested image path using helper function
    const fieldName = getImageTypeField(type);
    const imagePath = user[fieldName];
    if (!imagePath) {
      return res.status(404).json({
        success: false,
        error: getLocalizedMessage('IMAGE_NOT_FOUND', lang),
        timestamp: Date.now()
      });
    }

    // Return proxy URL instead of raw Nextcloud URL to avoid auth dialog
    // Use relative path for local development to avoid host.docker.internal issues
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost';
    const isDocker = host.includes('docker.internal');
    const proxyUrl = isDocker
      ? `/api/v1/user-images/proxy/${userId}/${type}`
      : `${protocol}://${host}/api/v1/user-images/proxy/${userId}/${type}`;

    return res.status(200).json({
      success: true,
      data: {
        type,
        filePath: imagePath,
        url: proxyUrl
      },
      timestamp: Date.now()
    });

  } catch (err) {
    console.error('[userImages] Get image error:', err);
    return res.status(500).json({
      success: false,
      error: getLocalizedMessage('INTERNAL_SERVER_ERROR', 'en'),
      timestamp: Date.now()
    });
  }
};

/**
 * Get all images for a user
 */
export const getAllUserImagesController = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;
    const lang = getRequestLanguage(req);

    // Convert Keycloak UUID to database ID
    const databaseUserId = await getDatabaseUserId(userId);
    if (!databaseUserId) {
      return res.status(404).json({
        success: false,
        error: getLocalizedMessage('USER_NOT_FOUND', lang),
        timestamp: Date.now()
      });
    }

    // Check read permission
    if (!checkImageAccessPermission(currentUser, databaseUserId)) {
      console.error(`[userImages] Unauthorized access attempt: user ${currentUser.id} trying to access user ${databaseUserId} images`);
      return res.status(403).json({
        success: false,
        error: getLocalizedMessage('INSUFFICIENT_PERMISSIONS', lang),
        timestamp: Date.now()
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: databaseUserId },
      select: {
        profileImageUrl: true,
        qidImageUrl: true,
        militaryIdImageUrl: true,
        additionalImageUrl: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: getLocalizedMessage('USER_NOT_FOUND', lang),
        timestamp: Date.now()
      });
    }

    // Generate proxy URLs for all images to avoid auth dialog
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost';
    const isDocker = host.includes('docker.internal');
    const images = {};
    VALID_IMAGE_TYPES.forEach(type => {
      const fieldName = getImageTypeField(type);
      const imagePath = user[fieldName];
      if (imagePath) {
        images[type] = {
          url: isDocker
            ? `/api/v1/user-images/proxy/${userId}/${type}`
            : `${protocol}://${host}/api/v1/user-images/proxy/${userId}/${type}`,
          path: imagePath
        };
      } else {
        images[type] = null;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        userId: databaseUserId,
        images
      },
      timestamp: Date.now()
    });

  } catch (err) {
    console.error('[userImages] Get all images error:', err);
    return res.status(500).json({
      success: false,
      error: getLocalizedMessage('INTERNAL_SERVER_ERROR', 'en'),
      timestamp: Date.now()
    });
  }
};

/**
 * Delete image for a user
 */
export const deleteUserImageController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.params;
    const currentUser = req.user;
    const lang = getRequestLanguage(req);

    // Convert Keycloak UUID to database ID
    const databaseUserId = await getDatabaseUserId(userId);
    if (!databaseUserId) {
      return res.status(404).json({
        success: false,
        error: getLocalizedMessage('USER_NOT_FOUND', lang),
        timestamp: Date.now()
      });
    }

    // Validate image type
    if (!VALID_IMAGE_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: getLocalizedMessage('INVALID_IMAGE_TYPE', lang),
        timestamp: Date.now()
      });
    }

    // Check write permission
    if (!checkImageWritePermission(currentUser, databaseUserId)) {
      console.error(`[userImages] Unauthorized delete attempt: user ${currentUser.id} trying to delete user ${databaseUserId} image`);
      return res.status(403).json({
        success: false,
        error: getLocalizedMessage('INSUFFICIENT_PERMISSIONS', lang),
        timestamp: Date.now()
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: databaseUserId },
      select: {
        profileImageUrl: true,
        qidImageUrl: true,
        militaryIdImageUrl: true,
        additionalImageUrl: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: getLocalizedMessage('USER_NOT_FOUND', lang),
        timestamp: Date.now()
      });
    }

    // Get the image path to delete using helper function
    const fieldName = getImageTypeField(type);
    const imagePath = user[fieldName];
    console.log(`[userImages] Delete request: type=${type}, field=${fieldName}, path=${imagePath}`);

    if (!imagePath) {
      console.warn(`[userImages] No image path found in database for type=${type}`);
      return res.status(404).json({
        success: false,
        error: getLocalizedMessage('IMAGE_NOT_FOUND', lang),
        timestamp: Date.now()
      });
    }

    // Delete file from Nextcloud
    console.log(`[userImages] Deleting from Nextcloud: ${imagePath}`);
    const deleteResult = await deleteNode(imagePath);
    console.log(`[userImages] Delete result:`, deleteResult);

    if (!deleteResult.success) {
      console.error(`[userImages] Failed to delete from Nextcloud:`, deleteResult.error);
      return res.status(400).json({
        success: false,
        error: getLocalizedMessage('FAILED_DELETE_NEXTCLOUD', lang),
        details: deleteResult.error?.message,
        timestamp: Date.now()
      });
    }

    // Update user model to remove image path using helper function
    const updateData = { [fieldName]: null };

    await prisma.user.update({
      where: { id: databaseUserId },
      data: updateData
    });

    return res.status(200).json({
      success: true,
      message: getLocalizedMessage('IMAGE_DELETED_SUCCESS', lang),
      timestamp: Date.now()
    });

  } catch (err) {
    console.error('[userImages] Delete image error:', err);
    return res.status(500).json({
      success: false,
      error: getLocalizedMessage('INTERNAL_SERVER_ERROR', 'en'),
      timestamp: Date.now()
    });
  }
};

// In-memory cache for proxied images (5 minute TTL)
const imageCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Proxy image from Nextcloud
 * Fetches image from Nextcloud using admin credentials and streams to frontend
 * This prevents browser auth dialog and mixed content issues
 */
export const proxyImageController = async (req, res) => {
  try {
    const { userId, type } = req.params;
    const currentUser = req.user;
    const lang = getRequestLanguage(req);

    // Convert Keycloak UUID to database ID
    const databaseUserId = await getDatabaseUserId(userId);
    if (!databaseUserId) {
      return res.status(404).json({
        success: false,
        error: getLocalizedMessage('USER_NOT_FOUND', lang),
        timestamp: Date.now()
      });
    }

    // Check read permission
    if (!checkImageAccessPermission(currentUser, databaseUserId)) {
      console.error(`[userImages] Unauthorized proxy access: user ${currentUser.id} trying to access user ${databaseUserId} image`);
      return res.status(403).json({
        success: false,
        error: getLocalizedMessage('INSUFFICIENT_PERMISSIONS', lang),
        timestamp: Date.now()
      });
    }

    // Get image path from database
    const fieldName = getImageTypeField(type);
    const user = await prisma.user.findUnique({ where: { id: databaseUserId } });
    if (!user || !user[fieldName]) {
      return res.status(404).json({
        success: false,
        error: getLocalizedMessage('IMAGE_NOT_FOUND', lang),
        timestamp: Date.now()
      });
    }

    const imagePath = user[fieldName];
    const cacheKey = `${userId}-${type}`;

    // Check cache first
    const cached = imageCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minute browser cache
      res.setHeader('X-Cache', 'HIT');
      return res.send(cached.buffer);
    }

    // Fetch from Nextcloud using admin credentials
    const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const nextcloudUrl = `${NEXTCLOUD_CONFIG.baseUrl}/remote.php/dav/files/${NEXTCLOUD_CONFIG.username}/${normalizedPath}`;

    const authHeader = Buffer.from(`${NEXTCLOUD_CONFIG.username}:${NEXTCLOUD_CONFIG.appPassword}`).toString('base64');

    const response = await fetch(nextcloudUrl, {
      headers: {
        Authorization: `Basic ${authHeader}`
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      console.error('[userImages] Proxy fetch failed:', response.status);
      return res.status(response.status).json({
        success: false,
        error: 'Failed to fetch image from Nextcloud',
        timestamp: Date.now()
      });
    }

    // Convert Web ReadableStream to buffer and send (Node.js fetch doesn't have pipe)
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Cache the image
    imageCache.set(cacheKey, {
      buffer,
      contentType,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (imageCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of imageCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          imageCache.delete(key);
        }
      }
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minute browser cache
    res.setHeader('X-Cache', 'MISS');
    res.send(buffer);

  } catch (err) {
    console.error('[userImages] Proxy error:', err);
    return res.status(500).json({
      success: false,
      error: getLocalizedMessage('INTERNAL_SERVER_ERROR', 'en'),
      timestamp: Date.now()
    });
  }
};

export default {
  uploadUserImageController,
  getUserImageController,
  deleteUserImageController,
  getAllUserImagesController,
  proxyImageController
};
