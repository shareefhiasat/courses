import { ROLE_STRINGS, ROLE_HIERARCHY } from '../utils/userUtils.js';
import { info, error, warn, debug } from '../services/utils/logger.js';

// ===== GLOBAL ROLE CONFIGURATIONS =====

export const ROLE_CONFIGURATIONS = {
  // Student configuration
  [ROLE_STRINGS.STUDENT]: {
    // Chat limitations
    chat: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxVoiceRecordingTime: 5 * 60, // 5 minutes in seconds
      maxTextMessageLength: 1000,
      canCreateGroups: false,
      canSendFiles: true,
      canSendVoice: true,
      canSendImages: true
    },
    
    // Attendance limitations
    attendance: {
      canViewOwnAttendance: true,
      canViewClassAttendance: false,
      canMarkAttendance: false,
      canEditAttendance: false,
      canBulkImport: false
    },
    
    // Academic limitations
    academic: {
      canViewOwnGrades: true,
      canViewClassGrades: false,
      canSubmitAssignments: true,
      canViewAssignments: true,
      canCreateAssignments: false,
      canEditAssignments: false
    },
    
    // Profile limitations
    profile: {
      canEditOwnProfile: true,
      canViewOtherProfiles: false,
      canEditOtherProfiles: false,
      canViewSensitiveData: false
    }
  },
  
  // Instructor configuration
  [ROLE_STRINGS.INSTRUCTOR]: {
    // Chat limitations
    chat: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxVoiceRecordingTime: 10 * 60, // 10 minutes
      maxTextMessageLength: 2000,
      canCreateGroups: true,
      canSendFiles: true,
      canSendVoice: true,
      canSendImages: true
    },
    
    // Attendance limitations
    attendance: {
      canViewOwnAttendance: false,
      canViewClassAttendance: true,
      canMarkAttendance: true,
      canEditAttendance: true,
      canBulkImport: true
    },
    
    // Academic limitations
    academic: {
      canViewOwnGrades: false,
      canViewClassGrades: true,
      canSubmitAssignments: false,
      canViewAssignments: true,
      canCreateAssignments: true,
      canEditAssignments: true
    },
    
    // Profile limitations
    profile: {
      canEditOwnProfile: true,
      canViewOtherProfiles: true,
      canEditOtherProfiles: false,
      canViewSensitiveData: false
    }
  },
  
  // Admin configuration
  [ROLE_STRINGS.ADMIN]: {
    // Chat limitations
    chat: {
      maxFileSize: 20 * 1024 * 1024, // 20MB
      maxVoiceRecordingTime: 15 * 60, // 15 minutes
      maxTextMessageLength: 5000,
      canCreateGroups: true,
      canSendFiles: true,
      canSendVoice: true,
      canSendImages: true
    },
    
    // Attendance limitations
    attendance: {
      canViewOwnAttendance: false,
      canViewClassAttendance: true,
      canMarkAttendance: true,
      canEditAttendance: true,
      canBulkImport: true
    },
    
    // Academic limitations
    academic: {
      canViewOwnGrades: false,
      canViewClassGrades: true,
      canSubmitAssignments: false,
      canViewAssignments: true,
      canCreateAssignments: true,
      canEditAssignments: true
    },
    
    // Profile limitations
    profile: {
      canEditOwnProfile: true,
      canViewOtherProfiles: true,
      canEditOtherProfiles: true,
      canViewSensitiveData: true
    }
  },
  
  // HR configuration
  [ROLE_STRINGS.HR]: {
    // Chat limitations
    chat: {
      maxFileSize: 15 * 1024 * 1024, // 15MB
      maxVoiceRecordingTime: 10 * 60, // 10 minutes
      maxTextMessageLength: 3000,
      canCreateGroups: true,
      canSendFiles: true,
      canSendVoice: true,
      canSendImages: true
    },
    
    // Attendance limitations
    attendance: {
      canViewOwnAttendance: false,
      canViewClassAttendance: true,
      canMarkAttendance: false,
      canEditAttendance: false,
      canBulkImport: false
    },
    
    // Academic limitations
    academic: {
      canViewOwnGrades: false,
      canViewClassGrades: true,
      canSubmitAssignments: false,
      canViewAssignments: false,
      canCreateAssignments: false,
      canEditAssignments: false
    },
    
    // Profile limitations
    profile: {
      canEditOwnProfile: true,
      canViewOtherProfiles: true,
      canEditOtherProfiles: true,
      canViewSensitiveData: true
    }
  },
  
  // Super Admin configuration
  [ROLE_STRINGS.SUPER_ADMIN]: {
    // Chat limitations
    chat: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxVoiceRecordingTime: 30 * 60, // 30 minutes
      maxTextMessageLength: 10000,
      canCreateGroups: true,
      canSendFiles: true,
      canSendVoice: true,
      canSendImages: true
    },
    
    // Attendance limitations
    attendance: {
      canViewOwnAttendance: false,
      canViewClassAttendance: true,
      canMarkAttendance: true,
      canEditAttendance: true,
      canBulkImport: true
    },
    
    // Academic limitations
    academic: {
      canViewOwnGrades: false,
      canViewClassGrades: true,
      canSubmitAssignments: false,
      canViewAssignments: true,
      canCreateAssignments: true,
      canEditAssignments: true
    },
    
    // Profile limitations
    profile: {
      canEditOwnProfile: true,
      canViewOtherProfiles: true,
      canEditOtherProfiles: true,
      canViewSensitiveData: true
    }
  }
};

// Helper functions to get role-specific configurations
export const getRoleConfig = (role) => {
  return ROLE_CONFIGURATIONS[role] || ROLE_CONFIGURATIONS[ROLE_STRINGS.STUDENT];
};

export const hasPermission = (role, category, permission) => {
  const config = getRoleConfig(role);
  return config[category]?.[permission] || false;
};

export const getLimit = (role, category, limit) => {
  const config = getRoleConfig(role);
  return config[category]?.[limit] || 0;
};

export default {
  ROLE_CONFIGURATIONS,
  getRoleConfig,
  hasPermission,
  getLimit
};
