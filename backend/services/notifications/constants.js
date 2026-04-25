/**
 * Notification Constants - Canonical definitions
 * 
 * These are the single source of truth for notification events, categories,
 * priorities, and channels. Shared between backend and client.
 */

// Notification Categories (mapped to Prisma enum)
export const CATEGORIES = {
  SYSTEM: 'SYSTEM',
  ACADEMIC: 'ACADEMIC',
  ATTENDANCE: 'ATTENDANCE',
  ASSESSMENT: 'ASSESSMENT',
  COMMUNICATION: 'COMMUNICATION',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  WORKFLOW: 'WORKFLOW',
  FILE: 'FILE',
  QR: 'QR',
  BEHAVIOR: 'BEHAVIOR'
};

// Notification Events (canonical event names)
export const EVENTS = {
  // Workflow events
  WORKFLOW_ASSIGNED: 'workflow.assigned',
  WORKFLOW_APPROVED: 'workflow.approved',
  WORKFLOW_REJECTED: 'workflow.rejected',
  WORKFLOW_COMPLETED: 'workflow.completed',
  WORKFLOW_SLA_WARNING: 'workflow.sla_warning',
  WORKFLOW_SLA_OVERDUE: 'workflow.sla_overdue',
  
  // Announcement events
  ANNOUNCEMENT_POSTED: 'announcement.posted',
  
  // QR events
  QR_CODE_SENT: 'qr.code_sent',
  
  // Attendance events
  ATTENDANCE_MARKED: 'attendance.marked',
  ATTENDANCE_THRESHOLD_WARNING: 'attendance.threshold_warning',
  
  // Behavior events
  BEHAVIOR_RECORDED: 'behavior.recorded',
  BEHAVIOR_UPDATED: 'behavior.updated',
  BEHAVIOR_DELETED: 'behavior.deleted',
  
  // File events
  FILE_SHARED: 'file.shared',
  
  // Enrollment events
  ENROLLMENT_CONFIRMED: 'enrollment.confirmed',
  
  // Grade events
  GRADE_POSTED: 'grade.posted',
  
  // Quiz events
  QUIZ_AVAILABLE: 'quiz.available',
  QUIZ_GRADED: 'quiz.graded',
  
  // Assignment events
  ASSIGNMENT_DUE: 'assignment.due',
  
  // System events
  SYSTEM_ALERT: 'system.alert'
};

// Notification Priorities (mapped to Prisma enum)
export const PRIORITIES = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

// Notification Channels
export const CHANNELS = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push'
};

// Delivery statuses
export const DELIVERY_STATUS = {
  QUEUED: 'queued',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  SKIPPED: 'skipped'
};

// Event to category mapping
export const EVENT_CATEGORIES = {
  [EVENTS.WORKFLOW_ASSIGNED]: CATEGORIES.WORKFLOW,
  [EVENTS.WORKFLOW_APPROVED]: CATEGORIES.WORKFLOW,
  [EVENTS.WORKFLOW_REJECTED]: CATEGORIES.WORKFLOW,
  [EVENTS.WORKFLOW_COMPLETED]: CATEGORIES.WORKFLOW,
  [EVENTS.WORKFLOW_SLA_WARNING]: CATEGORIES.WORKFLOW,
  [EVENTS.WORKFLOW_SLA_OVERDUE]: CATEGORIES.WORKFLOW,
  
  [EVENTS.ANNOUNCEMENT_POSTED]: CATEGORIES.ANNOUNCEMENT,
  
  [EVENTS.QR_CODE_SENT]: CATEGORIES.QR,
  
  [EVENTS.ATTENDANCE_MARKED]: CATEGORIES.ATTENDANCE,
  [EVENTS.ATTENDANCE_THRESHOLD_WARNING]: CATEGORIES.ATTENDANCE,
  
  [EVENTS.BEHAVIOR_RECORDED]: CATEGORIES.BEHAVIOR,
  [EVENTS.BEHAVIOR_UPDATED]: CATEGORIES.BEHAVIOR,
  [EVENTS.BEHAVIOR_DELETED]: CATEGORIES.BEHAVIOR,
  
  [EVENTS.FILE_SHARED]: CATEGORIES.FILE,
  
  [EVENTS.ENROLLMENT_CONFIRMED]: CATEGORIES.ACADEMIC,
  
  [EVENTS.GRADE_POSTED]: CATEGORIES.ASSESSMENT,
  
  [EVENTS.QUIZ_AVAILABLE]: CATEGORIES.ASSESSMENT,
  [EVENTS.QUIZ_GRADED]: CATEGORIES.ASSESSMENT,
  
  [EVENTS.ASSIGNMENT_DUE]: CATEGORIES.ASSESSMENT,
  
  [EVENTS.SYSTEM_ALERT]: CATEGORIES.SYSTEM
};

// Default priority per event
export const EVENT_PRIORITIES = {
  [EVENTS.WORKFLOW_ASSIGNED]: PRIORITIES.NORMAL,
  [EVENTS.WORKFLOW_APPROVED]: PRIORITIES.NORMAL,
  [EVENTS.WORKFLOW_REJECTED]: PRIORITIES.HIGH,
  [EVENTS.WORKFLOW_COMPLETED]: PRIORITIES.NORMAL,
  [EVENTS.WORKFLOW_SLA_WARNING]: PRIORITIES.HIGH,
  [EVENTS.WORKFLOW_SLA_OVERDUE]: PRIORITIES.URGENT,
  
  [EVENTS.ANNOUNCEMENT_POSTED]: PRIORITIES.NORMAL,
  
  [EVENTS.QR_CODE_SENT]: PRIORITIES.NORMAL,
  
  [EVENTS.ATTENDANCE_MARKED]: PRIORITIES.LOW,
  [EVENTS.ATTENDANCE_THRESHOLD_WARNING]: PRIORITIES.HIGH,
  
  [EVENTS.BEHAVIOR_RECORDED]: PRIORITIES.NORMAL,
  [EVENTS.BEHAVIOR_UPDATED]: PRIORITIES.NORMAL,
  [EVENTS.BEHAVIOR_DELETED]: PRIORITIES.NORMAL,
  
  [EVENTS.FILE_SHARED]: PRIORITIES.NORMAL,
  
  [EVENTS.ENROLLMENT_CONFIRMED]: PRIORITIES.NORMAL,
  
  [EVENTS.GRADE_POSTED]: PRIORITIES.NORMAL,
  
  [EVENTS.QUIZ_AVAILABLE]: PRIORITIES.NORMAL,
  [EVENTS.QUIZ_GRADED]: PRIORITIES.NORMAL,
  
  [EVENTS.ASSIGNMENT_DUE]: PRIORITIES.HIGH,
  
  [EVENTS.SYSTEM_ALERT]: PRIORITIES.URGENT
};

// Helper function to get category from event
export const getCategoryFromEvent = (event) => {
  return EVENT_CATEGORIES[event] || CATEGORIES.SYSTEM;
};

// Helper function to get default priority from event
export const getPriorityFromEvent = (event) => {
  return EVENT_PRIORITIES[event] || PRIORITIES.NORMAL;
};

export default {
  CATEGORIES,
  EVENTS,
  PRIORITIES,
  CHANNELS,
  DELIVERY_STATUS,
  EVENT_CATEGORIES,
  EVENT_PRIORITIES,
  getCategoryFromEvent,
  getPriorityFromEvent
};
