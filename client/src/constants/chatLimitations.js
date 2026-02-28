/**
 * Chat Limitations Configuration
 * Boolean flag-based restrictions for chat functionality
 */

// ===== CHAT LIMITATIONS BY USER TYPE =====

export const CHAT_LIMITATIONS = {
  // Student limitations
  student: {
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
  instructor: {
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
  admin: {
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
  superAdmin: {
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
  hr: {
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
 * Get chat limitations for a specific user based on boolean flags
 * @param {Object} user - The user object with boolean flags
 * @returns {Object} Chat limitations for the user
 */
export const getChatLimitations = (user) => {
  if (!user || typeof user !== 'object') {
    return CHAT_LIMITATIONS.student;
  }
  
  // Check in order of precedence (super admin > admin > hr > instructor > student)
  if (user.isSuperAdmin) return CHAT_LIMITATIONS.superAdmin;
  if (user.isAdmin) return CHAT_LIMITATIONS.admin;
  if (user.isHR) return CHAT_LIMITATIONS.hr;
  if (user.isInstructor) return CHAT_LIMITATIONS.instructor;
  if (user.isStudent) return CHAT_LIMITATIONS.student;
  
  // Default to student limitations if no flags are set
  return CHAT_LIMITATIONS.student;
};

/**
 * Check if a file type is allowed for a user
 * @param {Object} user - The user object with boolean flags
 * @param {string} fileType - The MIME type of the file
 * @returns {boolean} True if file type is allowed
 */
export const isFileTypeAllowed = (user, fileType) => {
  const limitations = getChatLimitations(user);
  return limitations.allowedFileTypes.includes(fileType);
};

/**
 * Check if a file size is within limits for a user
 * @param {Object} user - The user object with boolean flags
 * @param {number} fileSize - The file size in bytes
 * @returns {boolean} True if file size is within limits
 */
export const isFileSizeAllowed = (user, fileSize) => {
  const limitations = getChatLimitations(user);
  return fileSize <= limitations.maxFileSize;
};

/**
 * Get maximum file size for a user in human-readable format
 * @param {Object} user - The user object with boolean flags
 * @returns {string} Maximum file size (e.g., "5MB", "25MB")
 */
export const getMaxFileSizeDisplay = (user) => {
  const limitations = getChatLimitations(user);
  const sizeInMB = limitations.maxFileSize / (1024 * 1024);
  return `${sizeInMB}MB`;
};

/**
 * Get maximum voice recording time for a user in human-readable format
 * @param {Object} user - The user object with boolean flags
 * @returns {string} Maximum recording time (e.g., "5 minutes", "25 minutes")
 */
export const getMaxVoiceTimeDisplay = (user) => {
  const limitations = getChatLimitations(user);
  const timeInMinutes = limitations.maxVoiceRecordingTime / 60;
  return `${timeInMinutes} minutes`;
};

/**
 * Validate file upload against user limitations
 * @param {Object} user - The user object with boolean flags
 * @param {File} file - The file to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validateFileUpload = (user, file) => {
  const limitations = getChatLimitations(user);
  
  // Check file type
  if (!isFileTypeAllowed(user, file.type)) {
    return {
      isValid: false,
      message: `File type "${file.type}" is not allowed for your role. Allowed types: ${limitations.allowedFileTypes.join(', ')}`
    };
  }
  
  // Check file size
  if (!isFileSizeAllowed(user, file.size)) {
    return {
      isValid: false,
      message: `File size exceeds maximum limit of ${getMaxFileSizeDisplay(user)} for your role.`
    };
  }
  
  return {
    isValid: true,
    message: null
  };
};

/**
 * Check if voice recording time is within limits for a user
 * @param {Object} user - The user object with boolean flags
 * @param {number} recordingTime - Current recording time in seconds
 * @returns {boolean} True if recording time is within limits
 */
export const isVoiceTimeAllowed = (user, recordingTime) => {
  const limitations = getChatLimitations(user);
  return recordingTime <= limitations.maxVoiceRecordingTime;
};

/**
 * Get voice recording progress percentage for a user
 * @param {Object} user - The user object with boolean flags
 * @param {number} currentSeconds - Current recording time in seconds
 * @returns {number} Progress percentage (0-100)
 */
export const getVoiceRecordingProgress = (user, currentSeconds) => {
  const limitations = getChatLimitations(user);
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
