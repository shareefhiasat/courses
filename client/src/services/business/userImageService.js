/**
 * User Image Service
 * 
 * PURPOSE: Frontend service for user image management with Nextcloud
 * ARCHITECTURE: UI Components → Business Service → Backend API → Nextcloud WebDAV
 */

import { apiService } from '../api/apiService';

const serviceName = 'userImageService';

// Valid image types
const VALID_IMAGE_TYPES = ['profile', 'qid', 'military', 'additional'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const VALID_FILE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

/**
 * Validate file before upload
 */
const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }

  if (!VALID_FILE_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Allowed: JPEG, PNG, PDF' };
  }

  return { valid: true };
};

/**
 * Upload user image
 * 
 * @param {number} userId - User ID
 * @param {string} imageType - Image type (profile|qid|military|additional)
 * @param {File} file - File to upload
 * @param {Object} options - Upload options (onProgress)
 * @returns {Promise<Object>} - Result object
 */
export const uploadUserImage = async (userId, imageType, file, options = {}) => {
  try {
    console.log(`[${serviceName}] Uploading ${imageType} image for user ${userId}:`, file.name);
    
    // Validate image type
    if (!VALID_IMAGE_TYPES.includes(imageType)) {
      return {
        success: false,
        error: `Invalid image type. Valid types: ${VALID_IMAGE_TYPES.join(', ')}`,
        data: null
      };
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        data: null
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiService.post(`/user-images/${userId}/images/${imageType}`, formData, {
      onUploadProgress: (progressEvent) => {
        if (options.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      }
    });
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Image uploaded successfully:`, response.data);
    } else {
      console.error(`[${serviceName}] ❌ Failed to upload image:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error uploading image:`, error);
    return {
      success: false,
      error: error.message || 'Failed to upload image',
      data: null
    };
  }
};

/**
 * Get specific user image
 * 
 * @param {number} userId - User ID
 * @param {string} imageType - Image type (profile|qid|military|additional)
 * @returns {Promise<Object>} - Result object
 */
export const getUserImage = async (userId, imageType) => {
  try {
    console.log(`[${serviceName}] Getting ${imageType} image for user ${userId}`);
    
    // Validate image type
    if (!VALID_IMAGE_TYPES.includes(imageType)) {
      return {
        success: false,
        error: `Invalid image type. Valid types: ${VALID_IMAGE_TYPES.join(', ')}`,
        data: null
      };
    }

    const response = await apiService.get(`/user-images/${userId}/images/${imageType}`);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Retrieved image URL`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to get image:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error getting image:`, error);
    return {
      success: false,
      error: error.message || 'Failed to get image',
      data: null
    };
  }
};

/**
 * Get all user images
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Result object
 */
export const getAllUserImages = async (userId) => {
  try {
    console.log(`[${serviceName}] Getting all images for user ${userId}`);
    
    const response = await apiService.get(`/user-images/${userId}/images`);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Retrieved ${Object.keys(response.data?.images || {}).length} images`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to get images:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error getting images:`, error);
    return {
      success: false,
      error: error.message || 'Failed to get images',
      data: { images: {} }
    };
  }
};

/**
 * Delete user image
 * 
 * @param {number} userId - User ID
 * @param {string} imageType - Image type (profile|qid|military|additional)
 * @returns {Promise<Object>} - Result object
 */
export const deleteUserImage = async (userId, imageType) => {
  try {
    console.log(`[${serviceName}] Deleting ${imageType} image for user ${userId}`);
    
    // Validate image type
    if (!VALID_IMAGE_TYPES.includes(imageType)) {
      return {
        success: false,
        error: `Invalid image type. Valid types: ${VALID_IMAGE_TYPES.join(', ')}`,
        data: null
      };
    }

    const response = await apiService.delete(`/user-images/${userId}/images/${imageType}`);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Image deleted successfully`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to delete image:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error deleting image:`, error);
    return {
      success: false,
      error: error.message || 'Failed to delete image',
      data: null
    };
  }
};

/**
 * Get user image URL (convenience function)
 * 
 * @param {number} userId - User ID
 * @param {string} imageType - Image type (profile|qid|military|additional)
 * @returns {Promise<string|null>} - Image URL or null
 */
export const getUserImageUrl = async (userId, imageType) => {
  try {
    const result = await getUserImage(userId, imageType);
    return result.success ? result.data?.url : null;
  } catch (error) {
    console.error(`[${serviceName}] Error getting image URL:`, error);
    return null;
  }
};
