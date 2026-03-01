/**
 * Database Collection Constants
 * Centralized collection names to avoid hardcoded strings throughout the application
 * Following DRY principles and maintainability best practices
 */

// Core Collections
export const COLLECTIONS = {
  // User Management
  USERS: 'users',
  USER_AUTH: 'userAuth',
  
  // Academic Structure
  PROGRAMS: 'programs',
  COURSES: 'courses',
  SUBJECTS: 'subjects',
  CLASSES: 'classes',
  CATEGORIES: 'categories',
  
  // Enrollment & Progress
  ENROLLMENTS: 'enrollments',
  SUBJECT_ENROLLMENTS: 'subjectEnrollments',
  STUDENT_PROGRESS: 'studentProgress',
  
  // Quizzes & Assessments
  QUIZZES: 'quizzes',
  QUIZ_SUBMISSIONS: 'quizSubmissions',
  QUIZ_RESULTS: 'quizResults',
  QUESTION_BANK: 'questionBank',
  SUBMISSIONS: 'submissions',
  
  // Attendance
  ATTENDANCE: 'attendance',
  ATTENDANCE_SESSIONS: 'attendanceSessions',
  ATTENDANCE_SESSIONS_SUBCOLLECTION: 'classes/{classId}/sessions',
  
  // Chat & Communication
  CHAT_ROOMS: 'chatRooms',
  CHAT_MESSAGES: 'chatMessages',
  DIRECT_ROOMS: 'directRooms',
  
  // Activities & Logging
  ACTIVITIES: 'activities',
  ACTIVITY_LOG: 'activityLog',
  
  // Notifications
  NOTIFICATIONS: 'notifications',
  
  // Resources & Templates
  RESOURCES: 'resources',
  EMAIL_TEMPLATES: 'emailTemplates',
  
  // Behavior & Gamification
  BEHAVIOR: 'behavior',
  PENALTIES: 'penalties',
  GAMIFICATION: 'gamification',
  PARTICIPATION: 'participation',
  
  // Bookmarks
  BOOKMARKS: 'bookmarks',
  
  // Announcements
  ANNOUNCEMENTS: 'announcements',
  
  // Schedule
  SCHEDULE: 'schedule'
};

// Collection Groups for easier access
export const USER_COLLECTIONS = {
  USERS: COLLECTIONS.USERS,
  USER_AUTH: COLLECTIONS.USER_AUTH
};

export const ACADEMIC_COLLECTIONS = {
  PROGRAMS: COLLECTIONS.PROGRAMS,
  COURSES: COLLECTIONS.COURSES,
  SUBJECTS: COLLECTIONS.SUBJECTS,
  CLASSES: COLLECTIONS.CLASSES,
  CATEGORIES: COLLECTIONS.CATEGORIES
};

export const ENROLLMENT_COLLECTIONS = {
  ENROLLMENTS: COLLECTIONS.ENROLLMENTS,
  SUBJECT_ENROLLMENTS: COLLECTIONS.SUBJECT_ENROLLMENTS,
  STUDENT_PROGRESS: COLLECTIONS.STUDENT_PROGRESS
};

export const QUIZ_COLLECTIONS = {
  QUIZZES: COLLECTIONS.QUIZZES,
  QUIZ_SUBMISSIONS: COLLECTIONS.QUIZ_SUBMISSIONS,
  QUIZ_RESULTS: COLLECTIONS.QUIZ_RESULTS,
  QUESTION_BANK: COLLECTIONS.QUESTION_BANK,
  SUBMISSIONS: COLLECTIONS.SUBMISSIONS
};

export const CHAT_COLLECTIONS = {
  CHAT_ROOMS: COLLECTIONS.CHAT_ROOMS,
  CHAT_MESSAGES: COLLECTIONS.CHAT_MESSAGES,
  DIRECT_ROOMS: COLLECTIONS.DIRECT_ROOMS
};

export const ACTIVITY_COLLECTIONS = {
  ACTIVITIES: COLLECTIONS.ACTIVITIES,
  ACTIVITY_LOG: COLLECTIONS.ACTIVITY_LOG
};

export const NOTIFICATION_COLLECTIONS = {
  NOTIFICATIONS: COLLECTIONS.NOTIFICATIONS,
  EMAIL_TEMPLATES: COLLECTIONS.EMAIL_TEMPLATES,
  RESOURCES: COLLECTIONS.RESOURCES
};

export const BEHAVIOR_COLLECTIONS = {
  BEHAVIOR: COLLECTIONS.BEHAVIOR,
  PENALTIES: COLLECTIONS.PENALTIES,
  GAMIFICATION: COLLECTIONS.GAMIFICATION,
  PARTICIPATION: COLLECTIONS.PARTICIPATION
};

// Helper function to validate collection names
export const isValidCollection = (collectionName) => {
  return Object.values(COLLECTIONS).includes(collectionName);
};

// Helper function to get collection by category
export const getCollectionsByCategory = (category) => {
  const categories = {
    USER: USER_COLLECTIONS,
    ACADEMIC: ACADEMIC_COLLECTIONS,
    ENROLLMENT: ENROLLMENT_COLLECTIONS,
    QUIZ: QUIZ_COLLECTIONS,
    CHAT: CHAT_COLLECTIONS,
    ACTIVITY: ACTIVITY_COLLECTIONS,
    NOTIFICATION: NOTIFICATION_COLLECTIONS,
    BEHAVIOR: BEHAVIOR_COLLECTIONS
  };
  
  return categories[category.toUpperCase()] || {};
};

export default COLLECTIONS;
