/**
 * Role Configuration Usage Examples
 * Demonstrates how to use the global role configuration system
 */

import {
  getRoleConfig,
  hasPermission,
  getRoleLimit,
  isFileTypeAllowedForRole,
  getAllRolePermissions,
  getHigherPrivilegeRole,
  canManageRole,
  ROLE_STRINGS
} from '@constants';

// ===== USAGE EXAMPLES =====

// Example 1: Check if a user can upload a file
export const canUserUploadFile = (userRole, fileSize, fileType) => {
  const maxFileSize = getRoleLimit(userRole, 'files', 'maxFileSize');
  const isAllowedType = isFileTypeAllowedForRole(userRole, 'files', fileType);
  
  return fileSize <= maxFileSize && isAllowedType;
};

// Example 2: Check if a user can create a quiz
export const canUserCreateQuiz = (userRole) => {
  return hasPermission(userRole, 'quiz', 'canCreateQuiz');
};

// Example 3: Get chat limitations for a role
export const getUserChatLimits = (userRole) => {
  return getRoleConfig(userRole, 'chat');
};

// Example 4: Check if a user can moderate chat
export const canUserModerateChat = (userRole) => {
  return hasPermission(userRole, 'chat', 'canModerateChat');
};

// Example 5: Get all dashboard permissions for a role
export const getDashboardPermissions = (userRole) => {
  const dashboardConfig = getRoleConfig(userRole, 'dashboard');
  return {
    canViewAnalytics: dashboardConfig.canViewAnalytics || false,
    canManageUsers: dashboardConfig.canManageUsers || false,
    canManageClasses: dashboardConfig.canManageClasses || false,
    canViewReports: dashboardConfig.canViewReports || false,
    canExportData: dashboardConfig.canExportData || false
  };
};

// Example 6: Validate file upload against role limits
export const validateFileUploadForRole = (userRole, files) => {
  const config = getRoleConfig(userRole, 'files');
  const maxFiles = config.maxFilesPerUpload || 1;
  const maxSize = config.maxFileSize || 5 * 1024 * 1024; // 5MB default
  const allowedTypes = config.allowedFileTypes || [];
  
  const errors = [];
  
  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed per upload`);
  }
  
  for (const file of files) {
    if (file.size > maxSize) {
      errors.push(`File ${file.name} exceeds maximum size of ${maxSize / (1024 * 1024)}MB`);
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Example 7: Check role hierarchy for management actions
export const canUserManageOtherUser = (actorRole, targetRole) => {
  return canManageRole(actorRole, targetRole);
};

// Example 8: Get the highest role from a list of roles
export const getHighestRole = (roles) => {
  return roles.reduce((highest, current) => {
    return getHigherPrivilegeRole(highest, current);
  }, ROLE_STRINGS.STUDENT);
};

// Example 9: Role-based feature access control
export const getAccessibleFeatures = (userRole) => {
  const allPerms = getAllRolePermissions(userRole);
  
  return {
    chat: {
      canSendMessage: true,
      canSendFiles: allPerms.chat?.canSendFiles || false,
      canSendVoice: allPerms.chat?.canSendVoiceMessages || false,
      canCreateGlobalChat: allPerms.chat?.canCreateGlobalChat || false,
      canCreateClassChat: allPerms.chat?.canCreateClassChat || false,
      canModerate: allPerms.chat?.canModerateChat || false
    },
    quiz: {
      canCreate: allPerms.quiz?.canCreateQuiz || false,
      canGrade: allPerms.quiz?.canGradeQuiz || false,
      canDelete: allPerms.quiz?.canDeleteQuiz || false,
      canViewResults: allPerms.quiz?.canViewResults || false,
      canRetake: allPerms.quiz?.canRetakeQuiz || false
    },
    activity: {
      canCreate: allPerms.activity?.canCreateActivity || false,
      canGrade: allPerms.activity?.canGradeSubmissions || false,
      canDelete: allPerms.activity?.canDeleteActivity || false,
      canDownload: allPerms.activity?.canDownloadResources || false
    },
    dashboard: {
      canViewAnalytics: allPerms.dashboard?.canViewAnalytics || false,
      canManageUsers: allPerms.dashboard?.canManageUsers || false,
      canManageClasses: allPerms.dashboard?.canManageClasses || false,
      canExportData: allPerms.dashboard?.canExportData || false,
      canManageSystem: allPerms.dashboard?.canManageSystem || false
    },
    files: {
      maxFileSize: allPerms.files?.maxFileSize || 5 * 1024 * 1024,
      maxFilesPerUpload: allPerms.files?.maxFilesPerUpload || 5,
      totalStorageLimit: allPerms.files?.totalStorageLimit || 100 * 1024 * 1024,
      allowedFileTypes: allPerms.files?.allowedFileTypes || []
    }
  };
};

// Example 10: Progress tracking limits
export const getProgressLimits = (userRole) => {
  const quizConfig = getRoleConfig(userRole, 'quiz');
  const activityConfig = getRoleConfig(userRole, 'activity');
  
  return {
    maxQuizAttemptsPerDay: quizConfig.maxAttemptsPerDay || 10,
    maxActivitySubmissionsPerDay: activityConfig.maxSubmissionsPerDay || 20,
    canSubmitLate: activityConfig.canSubmitLate || false,
    timeBonusEnabled: quizConfig.timeBonusEnabled || false
  };
};

// Example 11: Storage management
export const getUserStorageInfo = (userRole, currentUsage = 0) => {
  const config = getRoleConfig(userRole, 'files');
  const totalLimit = config.totalStorageLimit || 100 * 1024 * 1024; // 100MB default
  
  return {
    totalLimit,
    currentUsage,
    remainingSpace: totalLimit - currentUsage,
    usagePercentage: (currentUsage / totalLimit) * 100,
    isNearLimit: (currentUsage / totalLimit) > 0.9, // 90% threshold
    isOverLimit: currentUsage > totalLimit
  };
};

// Example 12: Voice recording limits
export const getVoiceRecordingLimits = (userRole) => {
  const chatConfig = getRoleConfig(userRole, 'chat');
  
  return {
    maxRecordingTime: chatConfig.maxVoiceRecordingTime || 5 * 60, // 5 minutes default
    canSendVoiceMessages: chatConfig.canSendVoiceMessages || false,
    maxFileSize: chatConfig.maxFileSize || 5 * 1024 * 1024 // 5MB default
  };
};
