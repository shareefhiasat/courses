/**
 * Activity Type Constants
 * 
 * Centralized constants for activity types used throughout the application.
 * These types are used for activities, marks, and other assessments.
 */

// Activity/Mark Types
export const ACTIVITY_TYPES = {
  QUIZ: 'quiz',
  HOMEWORK: 'homework',
  TRAINING: 'training',
  LAB_AND_PROJECT: 'labandproject',
  MID_EXAM: 'mid-exam',
  FINAL_EXAM: 'final-exam',
  ATTENDANCE: 'attendance',
  PARTICIPATION: 'participation'
};

// Labels for UI display
export const ACTIVITY_TYPE_LABELS = {
  [ACTIVITY_TYPES.QUIZ]: 'Quiz',
  [ACTIVITY_TYPES.HOMEWORK]: 'Homework',
  [ACTIVITY_TYPES.TRAINING]: 'Training',
  [ACTIVITY_TYPES.LAB_AND_PROJECT]: 'Lab & Project',
  [ACTIVITY_TYPES.MID_EXAM]: 'Mid-Term Exam',
  [ACTIVITY_TYPES.FINAL_EXAM]: 'Final Exam',
  [ACTIVITY_TYPES.ATTENDANCE]: 'Attendance',
  [ACTIVITY_TYPES.PARTICIPATION]: 'Participation'
};

// Options for dropdown/select components
export const ACTIVITY_TYPE_OPTIONS = Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => ({
  value,
  label
}));

// Mark types (subset of activity types used specifically for marks)
export const MARK_TYPES = {
  MID_TERM_EXAM: 'midTermExam',
  FINAL_EXAM: 'finalExam',
  HOMEWORK: 'homework',
  LABS_PROJECT_RESEARCH: 'labsProjectResearch',
  QUIZZES: 'quizzes',
  PARTICIPATION: 'participation',
  ATTENDANCE: 'attendance'
};

// Mapping from mark type keys to activity types
export const MARK_TYPE_TO_ACTIVITY_TYPE = {
  [MARK_TYPES.MID_TERM_EXAM]: ACTIVITY_TYPES.MID_EXAM,
  [MARK_TYPES.FINAL_EXAM]: ACTIVITY_TYPES.FINAL_EXAM,
  [MARK_TYPES.HOMEWORK]: ACTIVITY_TYPES.HOMEWORK,
  [MARK_TYPES.LABS_PROJECT_RESEARCH]: ACTIVITY_TYPES.LAB_AND_PROJECT,
  [MARK_TYPES.QUIZZES]: ACTIVITY_TYPES.QUIZ,
  [MARK_TYPES.PARTICIPATION]: ACTIVITY_TYPES.PARTICIPATION,
  [MARK_TYPES.ATTENDANCE]: ACTIVITY_TYPES.ATTENDANCE
};

