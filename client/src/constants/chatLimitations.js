/**
 * Chat Limitations Configuration
 * Role-based restrictions for chat functionality
 */

import { USER_ROLES } from './userRoles';

// ===== CHAT LIMITATIONS BY ROLE =====

export const CHAT_LIMITATIONS = {
  // Student limitations
  [USER_ROLES.STUDENT]: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxVoiceRecordingTime: 5 * 60, // 5 minutes in seconds
    allowedFileTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'text/plain'
    ]
  },
  
  // Instructor limitations
  [USER_ROLES.INSTRUCTOR]: {
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxVoiceRecordingTime: 25 * 60, // 25 minutes in seconds
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif', 
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'video/mp4',
      'video/avi',
      'video/mov',
      'audio/mp3',
      'audio/wav',
      'audio/mpeg'
    ]
  },
  
  // Admin limitations
  [USER_ROLES.ADMIN]: {
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxVoiceRecordingTime: 25 * 60, // 25 minutes in seconds
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'video/mp4',
      'video/avi',
      'video/mov',
      'audio/mp3',
      'audio/wav',
      'audio/mpeg',
      'application/zip',
      'application/x-rar-compressed'
    ]
  },
  
  // Super Admin limitations
  [USER_ROLES.SUPER_ADMIN]: {
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxVoiceRecordingTime: 25 * 60, // 25 minutes in seconds
    allowedFileTypes: [
      // All common file types
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'audio/mp3',
      'audio/wav',
      'audio/mpeg',
      'audio/ogg',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/x-gzip'
    ]
  },
  
  // HR limitations
  [USER_ROLES.HR]: {
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxVoiceRecordingTime: 25 * 60, // 25 minutes in seconds
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'video/mp4',
      'video/avi',
      'video/mov',
      'audio/mp3',
      'audio/wav',
      'audio/mpeg',
      'application/zip'
    ]
  }
};

// ===== HELPER FUNCTIONS =====

/**
 * Get chat limitations for a specific user role
 * @param {string} userRole - The user's role
 * @returns {Object} Chat limitations for the role
 */
export const getChatLimitations = (userRole) => {
  return CHAT_LIMITATIONS[userRole] || CHAT_LIMITATIONS[USER_ROLES.STUDENT];
};

/**
 * Check if a file type is allowed for a user role
 * @param {string} userRole - The user's role
 * @param {string} fileType - The MIME type of the file
 * @returns {boolean} True if file type is allowed
 */
export const isFileTypeAllowed = (userRole, fileType) => {
  const limitations = getChatLimitations(userRole);
  return limitations.allowedFileTypes.includes(fileType);
};

/**
 * Check if a file size is within limits for a user role
 * @param {string} userRole - The user's role
 * @param {number} fileSize - The file size in bytes
 * @returns {boolean} True if file size is within limits
 */
export const isFileSizeAllowed = (userRole, fileSize) => {
  const limitations = getChatLimitations(userRole);
  return fileSize <= limitations.maxFileSize;
};

/**
 * Get maximum file size for a user role in human-readable format
 * @param {string} userRole - The user's role
 * @returns {string} Maximum file size (e.g., "5MB", "25MB")
 */
export const getMaxFileSizeDisplay = (userRole) => {
  const limitations = getChatLimitations(userRole);
  const sizeInMB = limitations.maxFileSize / (1024 * 1024);
  return `${sizeInMB}MB`;
};

/**
 * Get maximum voice recording time for a user role in human-readable format
 * @param {string} userRole - The user's role
 * @returns {string} Maximum recording time (e.g., "5 minutes", "25 minutes")
 */
export const getMaxVoiceTimeDisplay = (userRole) => {
  const limitations = getChatLimitations(userRole);
  const timeInMinutes = limitations.maxVoiceRecordingTime / 60;
  return `${timeInMinutes} minutes`;
};

/**
 * Validate file upload against user role limitations
 * @param {string} userRole - The user's role
 * @param {File} file - The file to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validateFileUpload = (userRole, file) => {
  const limitations = getChatLimitations(userRole);
  
  // Check file type
  if (!isFileTypeAllowed(userRole, file.type)) {
    return {
      isValid: false,
      message: `File type "${file.type}" is not allowed for your role. Allowed types: ${limitations.allowedFileTypes.join(', ')}`
    };
  }
  
  // Check file size
  if (!isFileSizeAllowed(userRole, file.size)) {
    return {
      isValid: false,
      message: `File size exceeds maximum limit of ${getMaxFileSizeDisplay(userRole)} for your role.`
    };
  }
  
  return {
    isValid: true,
    message: null
  };
};

/**
 * Check if voice recording time is within limits for a user role
 * @param {string} userRole - The user's role
 * @param {number} recordingTime - Current recording time in seconds
 * @returns {boolean} True if recording time is within limits
 */
export const isVoiceTimeAllowed = (userRole, recordingTime) => {
  const limitations = getChatLimitations(userRole);
  return recordingTime <= limitations.maxVoiceRecordingTime;
};

/**
 * Get voice recording progress percentage for a user role
 * @param {string} userRole - The user's role
 * @param {number} currentSeconds - Current recording time in seconds
 * @returns {number} Progress percentage (0-100)
 */
export const getVoiceRecordingProgress = (userRole, currentSeconds) => {
  const limitations = getChatLimitations(userRole);
  return Math.min((currentSeconds / limitations.maxVoiceRecordingTime) * 100, 100);
};

// ===== DEFAULT LIMITATIONS (for unknown roles) =====
export const DEFAULT_CHAT_LIMITATIONS = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxVoiceRecordingTime: 5 * 60, // 5 minutes
  allowedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain'
  ]
};
