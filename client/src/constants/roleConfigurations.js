/**
 * Global Role-Based Configuration System
 * Centralized limitations and permissions for all user roles
 */

import { ROLE_STRINGS, ROLE_HIERARCHY } from '@utils/userUtils';

// ===== GLOBAL ROLE CONFIGURATIONS =====

export const ROLE_CONFIGURATIONS = {
  // Student configuration
  [ROLE_STRINGS.STUDENT]: {
    // Chat limitations
    chat: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxVoiceRecordingTime: 5 * 60, // 5 minutes in seconds
      allowedFileTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'application/pdf',
        'text/plain'
      ],
      maxMessageLength: 1000,
      canCreateGlobalChat: false,
      canCreateClassChat: false,
      canSendFiles: true,
      canSendVoiceMessages: true
    },
    
    // Quiz limitations
    quiz: {
      maxAttemptsPerDay: 10,
      canViewResults: true,
      canRetakeQuiz: true,
      canSeeCorrectAnswers: false,
      timeBonusEnabled: true
    },
    
    // Activity limitations
    activity: {
      maxSubmissionsPerDay: 20,
      canSubmitLate: true,
      canViewOtherSubmissions: false,
      canDownloadResources: true
    },
    
    // Dashboard limitations
    dashboard: {
      canViewAnalytics: false,
      canManageUsers: false,
      canManageClasses: false,
      canViewReports: true,
      canExportData: false
    },
    
    // File upload limitations
    files: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedFileTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'application/pdf',
        'text/plain'
      ],
      maxFilesPerUpload: 5,
      totalStorageLimit: 100 * 1024 * 1024 // 100MB
    }
  },
  
  // Instructor configuration
  [ROLE_STRINGS.INSTRUCTOR]: {
    // Chat limitations
    chat: {
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
      ],
      maxMessageLength: 2000,
      canCreateGlobalChat: false,
      canCreateClassChat: true,
      canSendFiles: true,
      canSendVoiceMessages: true,
      canModerateChat: true
    },
    
    // Quiz limitations
    quiz: {
      maxAttemptsPerDay: 50,
      canViewResults: true,
      canRetakeQuiz: true,
      canSeeCorrectAnswers: true,
      canCreateQuiz: true,
      canGradeQuiz: true,
      timeBonusEnabled: true
    },
    
    // Activity limitations
    activity: {
      maxSubmissionsPerDay: 100,
      canSubmitLate: true,
      canViewOtherSubmissions: true,
      canDownloadResources: true,
      canCreateActivity: true,
      canGradeSubmissions: true
    },
    
    // Dashboard limitations
    dashboard: {
      canViewAnalytics: true,
      canManageUsers: false,
      canManageClasses: true,
      canViewReports: true,
      canExportData: true,
      canManageContent: true
    },
    
    // File upload limitations
    files: {
      maxFileSize: 25 * 1024 * 1024, // 25MB
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
      ],
      maxFilesPerUpload: 10,
      totalStorageLimit: 1024 * 1024 * 1024 // 1GB
    }
  },
  
  // HR configuration
  [ROLE_STRINGS.HR]: {
    // Chat limitations
    chat: {
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
      ],
      maxMessageLength: 2000,
      canCreateGlobalChat: false,
      canCreateClassChat: false,
      canSendFiles: true,
      canSendVoiceMessages: true,
      canModerateChat: false
    },
    
    // Quiz limitations
    quiz: {
      maxAttemptsPerDay: 50,
      canViewResults: true,
      canRetakeQuiz: true,
      canSeeCorrectAnswers: true,
      canCreateQuiz: false,
      canGradeQuiz: true,
      timeBonusEnabled: true
    },
    
    // Activity limitations
    activity: {
      maxSubmissionsPerDay: 100,
      canSubmitLate: true,
      canViewOtherSubmissions: true,
      canDownloadResources: true,
      canCreateActivity: false,
      canGradeSubmissions: true
    },
    
    // Dashboard limitations
    dashboard: {
      canViewAnalytics: true,
      canManageUsers: true,
      canManageClasses: false,
      canViewReports: true,
      canExportData: true,
      canManageContent: false
    },
    
    // File upload limitations
    files: {
      maxFileSize: 25 * 1024 * 1024, // 25MB
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
      ],
      maxFilesPerUpload: 10,
      totalStorageLimit: 1024 * 1024 * 1024 // 1GB
    }
  },
  
  // Admin configuration
  [ROLE_STRINGS.ADMIN]: {
    // Chat limitations
    chat: {
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
      ],
      maxMessageLength: 5000,
      canCreateGlobalChat: true,
      canCreateClassChat: true,
      canSendFiles: true,
      canSendVoiceMessages: true,
      canModerateChat: true,
      canDeleteAnyMessage: true
    },
    
    // Quiz limitations
    quiz: {
      maxAttemptsPerDay: 100,
      canViewResults: true,
      canRetakeQuiz: true,
      canSeeCorrectAnswers: true,
      canCreateQuiz: true,
      canGradeQuiz: true,
      canDeleteQuiz: true,
      canManageAllQuizzes: true,
      timeBonusEnabled: true
    },
    
    // Activity limitations
    activity: {
      maxSubmissionsPerDay: 200,
      canSubmitLate: true,
      canViewOtherSubmissions: true,
      canDownloadResources: true,
      canCreateActivity: true,
      canGradeSubmissions: true,
      canDeleteActivity: true,
      canManageAllActivities: true
    },
    
    // Dashboard limitations
    dashboard: {
      canViewAnalytics: true,
      canManageUsers: true,
      canManageClasses: true,
      canViewReports: true,
      canExportData: true,
      canManageContent: true,
      canManageSystem: true
    },
    
    // File upload limitations
    files: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedFileTypes: [
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
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
      ],
      maxFilesPerUpload: 20,
      totalStorageLimit: 5 * 1024 * 1024 * 1024 // 5GB
    }
  },
  
  // Super Admin configuration
  [ROLE_STRINGS.SUPER_ADMIN]: {
    // Chat limitations (unlimited)
    chat: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxVoiceRecordingTime: 60 * 60, // 60 minutes in seconds
      allowedFileTypes: [
        // All common file types
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'text/html',
        'text/css',
        'text/javascript',
        'application/json',
        'application/xml',
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/flv',
        'video/webm',
        'video/quicktime',
        'audio/mp3',
        'audio/wav',
        'audio/mpeg',
        'audio/ogg',
        'audio/aac',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/x-tar',
        'application/gzip'
      ],
      maxMessageLength: 10000,
      canCreateGlobalChat: true,
      canCreateClassChat: true,
      canSendFiles: true,
      canSendVoiceMessages: true,
      canModerateChat: true,
      canDeleteAnyMessage: true,
      canManageSystemSettings: true
    },
    
    // Quiz limitations (unlimited)
    quiz: {
      maxAttemptsPerDay: 1000,
      canViewResults: true,
      canRetakeQuiz: true,
      canSeeCorrectAnswers: true,
      canCreateQuiz: true,
      canGradeQuiz: true,
      canDeleteQuiz: true,
      canManageAllQuizzes: true,
      canModifySystemSettings: true,
      timeBonusEnabled: true
    },
    
    // Activity limitations (unlimited)
    activity: {
      maxSubmissionsPerDay: 1000,
      canSubmitLate: true,
      canViewOtherSubmissions: true,
      canDownloadResources: true,
      canCreateActivity: true,
      canGradeSubmissions: true,
      canDeleteActivity: true,
      canManageAllActivities: true,
      canModifySystemSettings: true
    },
    
    // Dashboard limitations (full access)
    dashboard: {
      canViewAnalytics: true,
      canManageUsers: true,
      canManageClasses: true,
      canViewReports: true,
      canExportData: true,
      canManageContent: true,
      canManageSystem: true,
      canModifySystemSettings: true,
      canAccessSystemLogs: true
    },
    
    // File upload limitations (high limits)
    files: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedFileTypes: [
        // All supported file types
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
        'image/tiff',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'text/html',
        'text/css',
        'text/javascript',
        'application/json',
        'application/xml',
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/flv',
        'video/webm',
        'video/quicktime',
        'video/3gpp',
        'audio/mp3',
        'audio/wav',
        'audio/mpeg',
        'audio/ogg',
        'audio/aac',
        'audio/flac',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/x-tar',
        'application/gzip',
        'application/x-shockwave-flash',
        'application/x-msdownload'
      ],
      maxFilesPerUpload: 50,
      totalStorageLimit: 50 * 1024 * 1024 * 1024 // 50GB
    }
  }
};

// ===== UTILITY FUNCTIONS =====

/**
 * Get configuration for a specific role and category
 * @param {string} role - User role
 * @param {string} category - Configuration category (chat, quiz, activity, dashboard, files)
 * @returns {Object} Configuration object for the role and category
 */
export const getRoleConfig = (role, category) => {
  const roleConfig = ROLE_CONFIGURATIONS[role];
  if (!roleConfig) {
    console.warn(`No configuration found for role: ${role}`);
    return {};
  }
  
  const categoryConfig = roleConfig[category];
  if (!categoryConfig) {
    console.warn(`No ${category} configuration found for role: ${role}`);
    return {};
  }
  
  return categoryConfig;
};

/**
 * Check if a role has permission for a specific action
 * @param {string} role - User role
 * @param {string} category - Configuration category
 * @param {string} permission - Permission key
 * @returns {boolean} Whether the role has the permission
 */
export const hasPermission = (role, category, permission) => {
  const config = getRoleConfig(role, category);
  return config[permission] === true;
};

/**
 * Get the maximum allowed value for a role and category
 * @param {string} role - User role
 * @param {string} category - Configuration category
 * @param {string} limitType - Type of limit (maxFileSize, maxVoiceRecordingTime, etc.)
 * @returns {number} Maximum allowed value
 */
export const getRoleLimit = (role, category, limitType) => {
  const config = getRoleConfig(role, category);
  return config[limitType] || 0;
};

/**
 * Check if a file type is allowed for a role
 * @param {string} role - User role
 * @param {string} category - Configuration category (usually 'files' or 'chat')
 * @param {string} fileType - MIME type of the file
 * @returns {boolean} Whether the file type is allowed
 */
export const isFileTypeAllowedForRole = (role, category, fileType) => {
  const config = getRoleConfig(role, category);
  const allowedTypes = config.allowedFileTypes || [];
  return allowedTypes.includes(fileType);
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {Object} All configurations for the role
 */
export const getAllRolePermissions = (role) => {
  return ROLE_CONFIGURATIONS[role] || {};
};

/**
 * Compare two roles and return the higher privilege role
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {string} The role with higher privileges
 */
export const getHigherPrivilegeRole = (role1, role2) => {
  const index1 = ROLE_HIERARCHY.indexOf(role1);
  const index2 = ROLE_HIERARCHY.indexOf(role2);
  
  if (index1 === -1) return role2;
  if (index2 === -1) return role1;
  
  return index1 > index2 ? role1 : role2;
};

/**
 * Check if a role can perform actions on another role
 * @param {string} actorRole - Role performing the action
 * @param {string} targetRole - Role being acted upon
 * @returns {boolean} Whether the actor role has higher privileges
 */
export const canManageRole = (actorRole, targetRole) => {
  const higherRole = getHigherPrivilegeRole(actorRole, targetRole);
  return higherRole === actorRole && actorRole !== targetRole;
};

// Export the chat limitations for backward compatibility
export const CHAT_LIMITATIONS = Object.fromEntries(
  Object.entries(ROLE_CONFIGURATIONS).map(([role, config]) => [role, config.chat])
);

export const DEFAULT_CHAT_LIMITATIONS = ROLE_CONFIGURATIONS[ROLE_STRINGS.STUDENT].chat;
