import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Report Constants
 * Centralized constants for report types, storage, and file operations
 */

// Report Types
export const REPORT_TYPES = {
  SUMMARY_REPORT: 'summary_report',
  ATTENDANCE_REPORT: 'attendance_report',
  STUDENT_PROGRESS_REPORT: 'student_progress_report',
  CLASS_PERFORMANCE_REPORT: 'class_performance_report',
  ENROLLMENT_REPORT: 'enrollment_report',
  PENALTY_REPORT: 'penalty_report',
  PARTICIPATION_REPORT: 'participation_report',
  BEHAVIOR_REPORT: 'behavior_report'
};

// Report Type Identifiers for UI
export const REPORT_TYPE_IDS = {
  DAILY: 'daily',
  SUMMARY: 'summary'
};

// Role Categories for Email Recipients
export const RECIPIENT_ROLES = {
  INSTRUCTORS: 'instructors',
  ADMINS: 'admins', 
  HR: 'hr',
  STUDENTS: 'students'
};

// File Storage Constants
export const STORAGE_CONSTANTS = {
  // Folders
  FOLDERS: {
    REPORTS: 'reports',
    SHARED: 'shared',
    USER_UPLOADS: 'user_uploads',
    ATTACHMENTS: 'attachments',
    BACKUPS: 'backups'
  },
  
  // File Status
  STATUS: {
    ACTIVE: 'active',
    DELETED: 'deleted',
    ARCHIVED: 'archived',
    PROCESSING: 'processing'
  },
  
  // Access Control
  ACCESS: {
    PUBLIC: true,
    PRIVATE: false
  },
  
  // Error Prefixes
  ERROR_PREFIXES: {
    STORAGE_FAILED: 'storage_failed_',
    UPLOAD_FAILED: 'upload_failed_',
    DOWNLOAD_FAILED: 'download_failed_',
    PROCESSING_FAILED: 'processing_failed_'
  },
  
  // Content Types
  CONTENT_TYPES: {
    CSV: 'text/csv',
    PDF: 'application/pdf',
    EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    JSON: 'application/json',
    TEXT: 'text/plain',
    IMAGE: 'image/*'
  }
};

// Report Metadata Fields
export const REPORT_METADATA_FIELDS = {
  REPORT_TYPE: 'reportType',
  PROGRAM_ID: 'programId',
  PROGRAM_NAME: 'programName',
  CLASS_ID: 'classId',
  CLASS_NAME: 'className',
  SUBJECT_ID: 'subjectId',
  SUBJECT_NAME: 'subjectName',
  TOTAL_STUDENTS: 'totalStudents',
  SELECTED_SUBJECTS: 'selectedSubjects',
  GENERATED_AT: 'generatedAt',
  GENERATED_BY: 'generatedBy',
  FILE_SIZE: 'fileSize',
  DOWNLOAD_COUNT: 'downloadCount'
};

// File Naming Patterns
export const FILE_NAMING_PATTERNS = {
  SUMMARY_REPORT: (programName, subjectCount, date) => 
    `summary_report_${programName}_${subjectCount}_subjects_${date}`,
  ATTENDANCE_REPORT: (className, date) => 
    `attendance_report_${className}_${date}`,
  STUDENT_PROGRESS_REPORT: (studentName, date) => 
    `student_progress_${studentName}_${date}`,
  CLASS_PERFORMANCE_REPORT: (className, programName, date) => 
    `class_performance_${className}_${programName}_${date}`
};

// Default Report Settings
export const DEFAULT_REPORT_SETTINGS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['.csv', '.pdf', '.xlsx', '.json'],
  RETENTION_DAYS: 365, // Keep files for 1 year
  MAX_DOWNLOADS: 100, // Maximum downloads per file
  AUTO_DELETE_EXPIRED: true
};

// Export all constants for easy importing
export default {
  REPORT_TYPES,
  STORAGE_CONSTANTS,
  REPORT_METADATA_FIELDS,
  FILE_NAMING_PATTERNS,
  DEFAULT_REPORT_SETTINGS
};
