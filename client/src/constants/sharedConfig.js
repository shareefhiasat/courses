import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Shared Configuration & Types
 * Centralized configuration management for the application
 */

// ===== RANK CONFIGURATION =====
export const RANK_CONFIG = {
  RECRUIT: {
    name: "Recruit",
    nameAr: "مجند",
    icon: "🎖️",
    min: 0,
    max: 99,
    color: "#CD7F32",
    description: "Beginning rank for new students",
    descriptionAr: "بداية الرتبة للطلاب الجدد"
  },
  PRIVATE: {
    name: "Private",
    nameAr: "جندي",
    icon: "🪖",
    min: 100,
    max: 249,
    color: "#CD7F32",
    description: "Basic rank achieved after initial progress",
    descriptionAr: "رتبة أساسية بعد التقدم الأولي"
  },
  CORPORAL: {
    name: "Corporal",
    nameAr: "عريف",
    icon: "⭐",
    min: 250,
    max: 499,
    color: "#C0C0C0",
    description: "Intermediate rank for consistent performers",
    descriptionAr: "رتبة متوسطة للمؤدين المنتظمين"
  },
  SERGEANT: {
    name: "Sergeant",
    nameAr: "رقيب",
    icon: "⌃",
    min: 500,
    max: 999,
    color: "#C0C0C0",
    description: "Advanced rank for dedicated students",
    descriptionAr: "رتبة متقدمة للطلاب الملتزمين"
  },
  LIEUTENANT: {
    name: "Lieutenant",
    nameAr: "ملازم",
    icon: "━",
    min: 1000,
    max: 1999,
    color: "#D4AF37",
    description: "Leadership rank for outstanding students",
    descriptionAr: "رتبة قيادية للطلاب المتميزين"
  },
  CAPTAIN: {
    name: "Captain",
    nameAr: "نقيب",
    icon: "👑",
    min: 2000,
    max: 3999,
    color: "#D4AF37",
    description: "Senior leadership rank",
    descriptionAr: "رتبة قيادية عليا"
  },
  MAJOR: {
    name: "Major",
    nameAr: "رائد",
    icon: "🏆",
    min: 4000,
    max: 7999,
    color: "#FFD700",
    description: "Executive leadership rank",
    descriptionAr: "رتبة قيادية تنفيذية"
  },
  COLONEL: {
    name: "Colonel",
    nameAr: "عقيد",
    icon: "🌟",
    min: 8000,
    max: 14999,
    color: "#FFD700",
    description: "High command rank",
    descriptionAr: "رتبة قيادية عليا"
  },
  GENERAL: {
    name: "General",
    nameAr: "جنرال",
    icon: "⚡",
    min: 15000,
    max: Infinity,
    color: "#FFD700",
    description: "Highest achievable rank",
    descriptionAr: "أعلى رتبة يمكن تحقيقها"
  }
};

// ===== RANK HELPER FUNCTIONS =====

/**
 * Get rank by points
 * @param {number} totalPoints - Total points to calculate rank
 * @returns {Object} Rank information with current, next, and previous ranks
 */
export const getStudentRank = (totalPoints) => {
  const ranks = Object.values(RANK_CONFIG);
  const currentRank = ranks.find(rank => totalPoints >= rank.min && totalPoints <= rank.max);
  const nextRank = ranks.find(rank => totalPoints < rank.min);
  const previousRank = ranks.reverse().find(rank => totalPoints > rank.max);

  return {
    current: currentRank || ranks[0],
    next: nextRank || null,
    previous: previousRank || null,
    pointsToNext: nextRank ? nextRank.min - totalPoints : 0,
    progress: currentRank ? ((totalPoints - currentRank.min) / (currentRank.max - currentRank.min)) * 100 : 0
  };
};

/**
 * Get rank configuration
 * @returns {Object} Complete rank configuration
 */
export const getRankConfig = () => {
  return RANK_CONFIG;
};

// ===== CONFIGURATION TYPES =====
export const CONFIG_TYPES = {
  ALLOWLIST: 'allowlist',
  RANK_SETTINGS: 'rankSettings',
  SYSTEM_SETTINGS: 'systemSettings',
  EMAIL_CONFIG: 'emailConfig',
  NOTIFICATION_SETTINGS: 'notificationSettings',
  GRADE_SETTINGS: 'gradeSettings',
  ATTENDANCE_SETTINGS: 'attendanceSettings',
  QUIZ_SETTINGS: 'quizSettings',
  SCHEDULED_REPORTS: 'scheduledReports'
};

// ===== DEFAULT CONFIGURATION VALUES =====
export const DEFAULT_CONFIG = {
  [CONFIG_TYPES.ALLOWLIST]: {
    allowedEmails: [],
    adminEmails: [],
    allowedStudents: [],
    allowedInstructors: [],
    allowedHr: [],
    superAdmins: [],
    enabled: true,
    requireApproval: false
  },
  [CONFIG_TYPES.RANK_SETTINGS]: {
    enabled: true,
    autoPromote: true,
    showProgress: true,
    ranks: Object.values(RANK_CONFIG)
  },
  [CONFIG_TYPES.SYSTEM_SETTINGS]: {
    maintenance: false,
    debugMode: false,
    logLevel: 'info',
    timezone: 'Asia/Qatar',
    language: 'en',
    theme: 'light'
  },
  [CONFIG_TYPES.EMAIL_CONFIG]: {
    enabled: true,
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: true,
    smtpUser: '',
    templates: {
      welcome: true,
      quizAvailable: true,
      deadlineReminder: true,
      gradeReleased: true
    }
  },
  [CONFIG_TYPES.NOTIFICATION_SETTINGS]: {
    enabled: true,
    pushNotifications: true,
    emailNotifications: true,
    inAppNotifications: true,
    batchSize: 50,
    retryAttempts: 3
  },
  [CONFIG_TYPES.GRADE_SETTINGS]: {
    passingScore: 70,
    maxScore: 100,
    gradeScale: [
      { min: 90, max: 100, grade: 'A', gradeAr: 'أ', color: '#10b981' },
      { min: 80, max: 89, grade: 'B', gradeAr: 'ب', color: '#3b82f6' },
      { min: 70, max: 79, grade: 'C', gradeAr: 'ج', color: '#f59e0b' },
      { min: 60, max: 69, grade: 'D', gradeAr: 'د', color: '#f97316' },
      { min: 0, max: 59, grade: 'F', gradeAr: 'و', color: '#ef4444' }
    ]
  },
  [CONFIG_TYPES.ATTENDANCE_SETTINGS]: {
    autoMarkPresent: false,
    requireReason: true,
    gracePeriod: 15,
    maxAbsences: 10,
    warningThreshold: 5
  },
  [CONFIG_TYPES.QUIZ_SETTINGS]: {
    timeLimit: true,
    showResults: true,
    allowRetakes: false,
    maxAttempts: 3,
    shuffleQuestions: false,
    randomizeAnswers: false
  },
  [CONFIG_TYPES.SCHEDULED_REPORTS]: {
    enabled: true,
    defaultSchedule: 'weekly',
    defaultRecipients: [],
    autoGenerate: false,
    retentionDays: 90
  }
};

// ===== CONFIGURATION HELPERS =====
export const getConfigTypeLabel = (type, lang = 'en') => {
  const labels = {
    [CONFIG_TYPES.ALLOWLIST]: {
      en: 'Email Allowlist',
      ar: 'قائمة البريد الإلكتروني المسموح'
    },
    [CONFIG_TYPES.RANK_SETTINGS]: {
      en: 'Rank Settings',
      ar: 'إعدادات الرتب'
    },
    [CONFIG_TYPES.SYSTEM_SETTINGS]: {
      en: 'System Settings',
      ar: 'إعدادات النظام'
    },
    [CONFIG_TYPES.EMAIL_CONFIG]: {
      en: 'Email Configuration',
      ar: 'تكوين البريد الإلكتروني'
    },
    [CONFIG_TYPES.NOTIFICATION_SETTINGS]: {
      en: 'Notification Settings',
      ar: 'إعدادات الإشعارات'
    },
    [CONFIG_TYPES.GRADE_SETTINGS]: {
      en: 'Grade Settings',
      ar: 'إعدادات الدرجات'
    },
    [CONFIG_TYPES.ATTENDANCE_SETTINGS]: {
      en: 'Attendance Settings',
      ar: 'إعدادات الحضور'
    },
    [CONFIG_TYPES.QUIZ_SETTINGS]: {
      en: 'Quiz Settings',
      ar: 'إعدادات الاختبارات'
    },
    [CONFIG_TYPES.SCHEDULED_REPORTS]: {
      en: 'Scheduled Reports',
      ar: 'التقارير المجدولة'
    }
  };
  
  return labels[type]?.[lang] || type;
};

export const validateConfigValue = (type, value) => {
  const validators = {
    [CONFIG_TYPES.ALLOWLIST]: (val) => {
      return Array.isArray(val?.allowedEmails) && 
             Array.isArray(val?.adminEmails) &&
             Array.isArray(val?.allowedStudents) &&
             Array.isArray(val?.allowedInstructors) &&
             Array.isArray(val?.allowedHr) &&
             Array.isArray(val?.superAdmins) &&
             typeof val?.enabled === 'boolean' &&
             typeof val?.requireApproval === 'boolean';
    },
    [CONFIG_TYPES.RANK_SETTINGS]: (val) => {
      return typeof val?.enabled === 'boolean' &&
             typeof val?.autoPromote === 'boolean' &&
             typeof val?.showProgress === 'boolean';
    },
    [CONFIG_TYPES.SYSTEM_SETTINGS]: (val) => {
      return typeof val?.maintenance === 'boolean' &&
             typeof val?.debugMode === 'boolean' &&
             ['info', 'debug', 'error', 'warn'].includes(val?.logLevel);
    }
  };
  
  return validators[type] ? validators[type](value) : true;
};

export const mergeWithDefaults = (type, userConfig) => {
  const defaults = DEFAULT_CONFIG[type];
  if (!defaults) return userConfig;
  
  return {
    ...defaults,
    ...userConfig,
    // Deep merge for nested objects
    ...(defaults.emails && { emails: { ...defaults.emails, ...userConfig.emails } }),
    ...(defaults.templates && { templates: { ...defaults.templates, ...userConfig.templates } }),
    ...(defaults.gradeScale && { gradeScale: [...defaults.gradeScale, ...(userConfig.gradeScale || [])] })
  };
};

// ===== SHARED APPLICATION CONSTANTS =====

// Application metadata
export const APP_CONFIG = {
  NAME: "QAF Learning Management System",
  NAME_AR: "نظام إدارة التعلم QAF",
  VERSION: "2.0.0",
  DESCRIPTION: "Advanced Learning Management System for QAF",
  DESCRIPTION_AR: "نظام إدارة تعلم متقدم لـ QAF",
  SUPPORT_EMAIL: "support@qaf.edu.qa",
  SUPPORT_PHONE: "+974 4444 0000"
};

// Default pagination settings
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100
};

// File upload limits
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_EXTENSIONS: [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', // Images
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', // Documents
    'mp4', 'mov', 'avi', 'mkv', 'webm', // Videos
    'mp3', 'wav', 'ogg', 'm4a', // Audio
    'zip', 'rar', '7z', 'tar', 'gz' // Archives
  ],
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ],
  MAX_FILES_PER_UPLOAD: 5
};

// Session configuration
export const SESSION_CONFIG = {
  TIMEOUT_MINUTES: 30,
  WARNING_MINUTES: 5,
  AUTO_EXTEND: true,
  MAX_EXTENSION_TIMES: 3
};

// Cache configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  USER_CACHE_TTL: 10 * 60 * 1000, // 10 minutes
  CONFIG_CACHE_TTL: 30 * 60 * 1000, // 30 minutes
  MAX_CACHE_SIZE: 100 // Maximum number of cached items
};

// API configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  BATCH_SIZE: 50 // Maximum items per batch request
};
