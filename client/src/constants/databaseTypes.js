/**
 * Database Type Constants
 * 
 * Centralized database constants that should be used for:
 * 1. Database constraints (CHECK constraints for validation)
 * 2. Lookup tables (for frequently changing values)
 * 3. ENUM types (for stable, rarely changing values)
 */

// User Roles - Use CHECK constraint (stable values)
export const USER_ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
  STAFF: 'staff',
  HR: 'hr',
  PARENT: 'parent',
  GUEST: 'guest',
  SUPER_ADMIN: 'super_admin'
};

// User Status - Use CHECK constraint (stable values)
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
};

// Enrollment Status - Use CHECK constraint (stable values)
export const ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
  SUSPENDED: 'suspended',
  ON_HOLD: 'on_hold'
};

// Activity Types - Use CHECK constraint (stable values)
export const ACTIVITY_TYPES = {
  ASSIGNMENT: 'assignment',
  QUIZ: 'quiz',
  EXAM: 'exam',
  PROJECT: 'project',
  DISCUSSION: 'discussion',
  READING: 'reading',
  VIDEO: 'video',
  LAB: 'lab',
  PRESENTATION: 'presentation',
  OTHER: 'other'
};

// Attendance Status - Use CHECK constraint (stable values)
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
  ON_LEAVE: 'on_leave'
};

// Submission Status - Use CHECK constraint (stable values)
export const SUBMISSION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  RETURNED: 'returned',
  LATE: 'late',
  PLAGIARIZED: 'plagiarized'
};

// Quiz Status - Use CHECK constraint (stable values)
export const QUIZ_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

// Question Difficulty - Use CHECK constraint (stable values)
export const QUESTION_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert'
};

// Schedule Types - Use CHECK constraint (stable values)
export const SCHEDULE_TYPES = {
  CLASS: 'class',
  EXAM: 'exam',
  MEETING: 'meeting',
  EVENT: 'event',
  HOLIDAY: 'holiday',
  MAINTENANCE: 'maintenance',
  OTHER: 'other'
};

// Student Progress Status - Use CHECK constraint (stable values)
export const STUDENT_PROGRESS_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  DROPPED: 'dropped'
};

// Gamification Types - Use CHECK constraint (stable values)
export const GAMIFICATION_TYPES = {
  LOGIN: 'login',
  ASSIGNMENT_COMPLETED: 'assignment_completed',
  QUIZ_PASSED: 'quiz_passed',
  PARTICIPATION: 'participation',
  BONUS: 'bonus',
  PENALTY: 'penalty',
  ACHIEVEMENT: 'achievement',
  OTHER: 'other'
};

// Template Types - Use CHECK constraint (stable values)
export const TEMPLATE_TYPES = {
  EMAIL: 'email',
  ANNOUNCEMENT: 'announcement',
  CERTIFICATE: 'certificate',
  REPORT: 'report',
  NOTIFICATION: 'notification',
  OTHER: 'other'
};

// Config Types - Use CHECK constraint (stable values)
export const CONFIG_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  OBJECT: 'object',
  ARRAY: 'array',
  JSON: 'json'
};

// Assessment Types - Use CHECK constraint (stable values)
export const ASSESSMENT_TYPES = {
  ASSIGNMENT: 'assignment',
  QUIZ: 'quiz',
  EXAM: 'exam',
  PROJECT: 'project',
  PARTICIPATION: 'participation',
  ATTENDANCE: 'attendance',
  LAB: 'lab',
  PRESENTATION: 'presentation',
  MIDTERM: 'midterm',
  FINAL: 'final',
  HOMEWORK: 'homework',
  EXTRA_CREDIT: 'extra_credit'
};

// Academic Terms - Use CHECK constraint (stable values)
export const ACADEMIC_TERMS = {
  FALL: 'fall',
  SPRING: 'spring',
  SUMMER: 'summer',
  WINTER: 'winter'
};

// Activity Log Actions - Use CHECK constraint (stable values)
export const ACTIVITY_LOG_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  SUBMIT: 'submit',
  GRADE: 'grade',
  APPROVE: 'approve',
  REJECT: 'reject',
  VIEW: 'view',
  DOWNLOAD: 'download',
  UPLOAD: 'upload'
};

// ======================================================================
// VALUES THAT SHOULD USE LOOKUP TABLES (frequently changing or extensible)
// ======================================================================
// @deprecated - Use useLookupTypes hook instead
// These lookup tables are deprecated. All lookup data should be fetched 
// dynamically from the backend API using the useLookupTypes hook.
// ======================================================================

// Behavior Types - Use lookup table (can be customized per institution)
export const BEHAVIOR_TYPES_LOOKUP = [
  { id: 1, code: 'positive_participation', name: 'Positive Participation', points: 5 },
  { id: 2, code: 'helping_others', name: 'Helping Others', points: 3 },
  { id: 3, code: 'leadership', name: 'Leadership', points: 10 },
  { id: 4, code: 'disruptive_behavior', name: 'Disruptive Behavior', points: -5 },
  { id: 5, code: 'late_arrival', name: 'Late Arrival', points: -2 },
  { id: 6, code: 'missed_deadline', name: 'Missed Deadline', points: -3 }
];

// Penalty Types - Use lookup table (can be customized per institution)
export const PENALTY_TYPES_LOOKUP = [
  { id: 1, code: 'warning', name: 'Warning', severity: 'low' },
  { id: 2, code: 'probation', name: 'Probation', severity: 'medium' },
  { id: 3, code: 'suspension', name: 'Suspension', severity: 'high' },
  { id: 4, code: 'expulsion', name: 'Expulsion', severity: 'critical' }
];

// Notification Types - Use lookup table (can be extended)
export const NOTIFICATION_TYPES_LOOKUP = [
  { id: 1, code: 'assignment_due', name: 'Assignment Due', category: 'academic' },
  { id: 2, code: 'grade_posted', name: 'Grade Posted', category: 'academic' },
  { id: 3, code: 'announcement', name: 'Announcement', category: 'general' },
  { id: 4, code: 'system_maintenance', name: 'System Maintenance', category: 'system' },
  { id: 5, code: 'attendance_alert', name: 'Attendance Alert', category: 'attendance' }
];

// Achievement Types - Use lookup table (can be extended)
export const ACHIEVEMENT_TYPES_LOOKUP = [
  { id: 1, code: 'perfect_attendance', name: 'Perfect Attendance', points_reward: 50 },
  { id: 2, code: 'honor_roll', name: 'Honor Roll', points_reward: 100 },
  { id: 3, code: 'early_submitter', name: 'Early Submitter', points_reward: 25 },
  { id: 4, code: 'helpful_peer', name: 'Helpful Peer', points_reward: 30 },
  { id: 5, code: 'quiz_master', name: 'Quiz Master', points_reward: 75 }
];

// ======================================================================
// HELPER FUNCTIONS
// ======================================================================

// Get array of values for CHECK constraints
export const getConstraintValues = (typeEnum) => {
  return Object.values(typeEnum);
};

// Get constraint SQL for CHECK constraints
export const getConstraintSQL = (typeEnum, columnName) => {
  const values = getConstraintValues(typeEnum).map(v => `'${v}'`).join(', ');
  return `CHECK (${columnName} IN (${values}))`;
};

// Get lookup table SQL for creating lookup tables
export const getLookupTableSQL = (tableName, lookupData) => {
  const columns = Object.keys(lookupData[0]).join(', ');
  const values = lookupData.map(item => {
    const vals = Object.values(item).map(v => typeof v === 'string' ? `'${v}'` : v).join(', ');
    return `(${vals})`;
  }).join(', ');
  
  return `
CREATE TABLE ${tableName} (
  id SERIAL PRIMARY KEY,
  ${columns.replace('id SERIAL PRIMARY KEY, ', '')},
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO ${tableName} (${columns}) VALUES ${values};
  `;
};

// Export all constraint values for easy access
export const CONSTRAINT_VALUES = {
  USER_ROLES: getConstraintValues(USER_ROLES),
  USER_STATUS: getConstraintValues(USER_STATUS),
  ENROLLMENT_STATUS: getConstraintValues(ENROLLMENT_STATUS),
  ACTIVITY_TYPES: getConstraintValues(ACTIVITY_TYPES),
  ATTENDANCE_STATUS: getConstraintValues(ATTENDANCE_STATUS),
  SUBMISSION_STATUS: getConstraintValues(SUBMISSION_STATUS),
  QUIZ_STATUS: getConstraintValues(QUIZ_STATUS),
  QUESTION_DIFFICULTY: getConstraintValues(QUESTION_DIFFICULTY),
  SCHEDULE_TYPES: getConstraintValues(SCHEDULE_TYPES),
  STUDENT_PROGRESS_STATUS: getConstraintValues(STUDENT_PROGRESS_STATUS),
  GAMIFICATION_TYPES: getConstraintValues(GAMIFICATION_TYPES),
  TEMPLATE_TYPES: getConstraintValues(TEMPLATE_TYPES),
  CONFIG_TYPES: getConstraintValues(CONFIG_TYPES),
  ASSESSMENT_TYPES: getConstraintValues(ASSESSMENT_TYPES),
  ACADEMIC_TERMS: getConstraintValues(ACADEMIC_TERMS),
  ACTIVITY_LOG_ACTIONS: getConstraintValues(ACTIVITY_LOG_ACTIONS)
};

// Export lookup tables
export const LOOKUP_TABLES = {
  BEHAVIOR_TYPES: BEHAVIOR_TYPES_LOOKUP,
  PENALTY_TYPES: PENALTY_TYPES_LOOKUP,
  NOTIFICATION_TYPES: NOTIFICATION_TYPES_LOOKUP,
  ACHIEVEMENT_TYPES: ACHIEVEMENT_TYPES_LOOKUP
};
