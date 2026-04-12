import { info, error, warn, debug } from '../services/utils/logger.js';

// Core Tables
export const TABLES = {
  // User Management
  USERS: 'users',
  USER_AUTH: 'user_auth',
  USER_PROFILES: 'user_profiles',
  
  // Academic Structure
  PROGRAMS: 'programs',
  SUBJECTS: 'subjects',
  CLASSES: 'classes',
  CATEGORIES: 'categories',
  DEPARTMENTS: 'departments',
  
  // Enrollment & Progress
  ENROLLMENTS: 'enrollments',
  SUBJECT_ENROLLMENTS: 'subject_enrollments',
  STUDENT_PROGRESS: 'student_progress',
  GRADES: 'grades',
  
  // Quizzes & Assessments
  QUIZZES: 'quizzes',
  QUIZ_SUBMISSIONS: 'quiz_submissions',
  QUIZ_RESULTS: 'quiz_results',
  QUIZ_QUESTIONS: 'quiz_questions',
  QUIZ_ANSWERS: 'quiz_answers',
  ASSESSMENTS: 'assessments',
  
  // Attendance & Behavior
  ATTENDANCE: 'attendance',
  ATTENDANCE_RECORDS: 'attendance_records',
  BEHAVIOR: 'behavior',
  PENALTIES: 'penalties',
  PARTICIPATION: 'participation',
  GAMIFICATION: 'gamification',
  
  // Communication
  CHAT_ROOMS: 'chat_rooms',
  CHAT_MESSAGES: 'chat_messages',
  NOTIFICATIONS: 'notifications',
  EMAIL_TEMPLATES: 'email_templates',
  ANNOUNCEMENTS: 'announcements',
  
  // Resources & Activities
  RESOURCES: 'resources',
  ACTIVITIES: 'activities',
  ACTIVITY_SUBMISSIONS: 'activity_submissions',
  FILES: 'files',
  MEDIA: 'media'
};

// Table Categories
export const USER_TABLES = {
  USERS: TABLES.USERS,
  USER_AUTH: TABLES.USER_AUTH,
  USER_PROFILES: TABLES.USER_PROFILES
};

export const ACADEMIC_TABLES = {
  PROGRAMS: TABLES.PROGRAMS,
  SUBJECTS: TABLES.SUBJECTS,
  CLASSES: TABLES.CLASSES,
  CATEGORIES: TABLES.CATEGORIES,
  DEPARTMENTS: TABLES.DEPARTMENTS
};

export const ENROLLMENT_TABLES = {
  ENROLLMENTS: TABLES.ENROLLMENTS,
  SUBJECT_ENROLLMENTS: TABLES.SUBJECT_ENROLLMENTS,
  STUDENT_PROGRESS: TABLES.STUDENT_PROGRESS,
  GRADES: TABLES.GRADES
};

export const QUIZ_TABLES = {
  QUIZZES: TABLES.QUIZZES,
  QUIZ_SUBMISSIONS: TABLES.QUIZ_SUBMISSIONS,
  QUIZ_RESULTS: TABLES.QUIZ_RESULTS,
  QUIZ_QUESTIONS: TABLES.QUIZ_QUESTIONS,
  QUIZ_ANSWERS: TABLES.QUIZ_ANSWERS,
  ASSESSMENTS: TABLES.ASSESSMENTS
};

export const ATTENDANCE_TABLES = {
  ATTENDANCE: TABLES.ATTENDANCE,
  ATTENDANCE_RECORDS: TABLES.ATTENDANCE_RECORDS,
  BEHAVIOR: TABLES.BEHAVIOR,
  PENALTIES: TABLES.PENALTIES,
  PARTICIPATION: TABLES.PARTICIPATION,
  GAMIFICATION: TABLES.GAMIFICATION
};

export const COMMUNICATION_TABLES = {
  CHAT_ROOMS: TABLES.CHAT_ROOMS,
  CHAT_MESSAGES: TABLES.CHAT_MESSAGES,
  NOTIFICATIONS: TABLES.NOTIFICATIONS,
  EMAIL_TEMPLATES: TABLES.EMAIL_TEMPLATES,
  ANNOUNCEMENTS: TABLES.ANNOUNCEMENTS
};

export const RESOURCE_TABLES = {
  RESOURCES: TABLES.RESOURCES,
  ACTIVITIES: TABLES.ACTIVITIES,
  ACTIVITY_SUBMISSIONS: TABLES.ACTIVITY_SUBMISSIONS,
  FILES: TABLES.FILES,
  MEDIA: TABLES.MEDIA
};

// Helper function to validate table names
export const isValidTable = (tableName) => {
  return Object.values(TABLES).includes(tableName);
};

// Helper function to get tables by category
export const getTablesByCategory = (category) => {
  const categories = {
    USER: USER_TABLES,
    ACADEMIC: ACADEMIC_TABLES,
    ENROLLMENT: ENROLLMENT_TABLES,
    QUIZ: QUIZ_TABLES,
    ATTENDANCE: ATTENDANCE_TABLES,
    COMMUNICATION: COMMUNICATION_TABLES,
    RESOURCE: RESOURCE_TABLES
  };
  
  return categories[category] || {};
};

// Helper function to get table relationships
export const getTableRelationships = (tableName) => {
  const relationships = {
    [TABLES.USERS]: {
      oneToMany: [TABLES.ENROLLMENTS, TABLES.ATTENDANCE, TABLES.GRADES],
      manyToMany: [TABLES.CLASSES, TABLES.SUBJECTS]
    },
    [TABLES.PROGRAMS]: {
      oneToMany: [TABLES.SUBJECTS, TABLES.CLASSES, TABLES.ENROLLMENTS],
      manyToMany: [TABLES.USERS]
    },
    [TABLES.CLASSES]: {
      oneToMany: [TABLES.ATTENDANCE, TABLES.ENROLLMENTS],
      manyToMany: [TABLES.USERS, TABLES.SUBJECTS]
    },
    [TABLES.SUBJECTS]: {
      oneToMany: [TABLES.QUIZZES, TABLES.ACTIVITIES],
      manyToMany: [TABLES.USERS, TABLES.CLASSES]
    },
    [TABLES.QUIZZES]: {
      oneToMany: [TABLES.QUIZ_QUESTIONS, TABLES.QUIZ_SUBMISSIONS],
      manyToMany: [TABLES.SUBJECTS, TABLES.CLASSES]
    }
  };
  
  return relationships[tableName] || { oneToMany: [], manyToMany: [] };
};

// Helper function to get primary key for table
export const getPrimaryKey = (tableName) => {
  const primaryKeys = {
    [TABLES.USERS]: 'id',
    [TABLES.PROGRAMS]: 'id',
    [TABLES.SUBJECTS]: 'id',
    [TABLES.CLASSES]: 'id',
    [TABLES.ENROLLMENTS]: 'id',
    [TABLES.QUIZZES]: 'id',
    [TABLES.ATTENDANCE]: 'id',
    [TABLES.NOTIFICATIONS]: 'id',
    [TABLES.ACTIVITIES]: 'id'
  };
  
  return primaryKeys[tableName] || 'id';
};

// Helper function to get common fields for tables
export const getCommonFields = (tableName) => {
  const commonFields = {
    created_at: 'timestamp',
    updated_at: 'timestamp',
    deleted_at: 'timestamp',
    is_active: 'boolean',
    created_by: 'integer',
    updated_by: 'integer'
  };
  
  // Some tables might have additional common fields
  const tableSpecificFields = {
    [TABLES.USERS]: {
      ...commonFields,
      email: 'varchar',
      password_hash: 'varchar',
      role: 'varchar',
      status: 'varchar'
    },
    [TABLES.PROGRAMS]: {
      ...commonFields,
      name: 'varchar',
      description: 'text',
      duration: 'integer',
      credits: 'integer'
    }
  };
  
  return tableSpecificFields[tableName] || commonFields;
};

export default {
  TABLES,
  USER_TABLES,
  ACADEMIC_TABLES,
  ENROLLMENT_TABLES,
  QUIZ_TABLES,
  ATTENDANCE_TABLES,
  COMMUNICATION_TABLES,
  RESOURCE_TABLES,
  isValidTable,
  getTablesByCategory,
  getTableRelationships,
  getPrimaryKey,
  getCommonFields
};
