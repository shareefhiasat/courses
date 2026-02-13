/**
 * Generic Delete Messages Utility
 * 
 * Provides standardized delete confirmation messages for different entity types.
 * This ensures consistent messaging across all screens and makes it easy to add new entity types.
 */

import { RECORD_TYPES } from '@utils/sharedTypes';

/**
 * Get delete confirmation message for any entity type
 * @param {string} entityType - Type of entity being deleted
 * @param {string} entityName - Name of the specific entity
 * @param {Object} options - Additional options
 * @param {Object} options.relatedRecords - Counts of related records (for cascade deletions)
 * @param {Function} t - Translation function
 * @returns {string} Formatted delete message
 */
export const getDeleteMessage = (entityType, entityName, options = {}, t = (key) => key) => {
  const { relatedRecords } = options;
  const actualEntityName = entityName || t('this_item') || 'this item';
  
  // Special handling for entities with related records
  if (entityType === RECORD_TYPES.USER && relatedRecords) {
    const hasRelatedRecords = Object.values(relatedRecords).some(count => count > 0);
    
    if (hasRelatedRecords) {
      const recordsList = Object.entries(relatedRecords)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => {
          const typeLabels = {
            enrollments: t('enrollments') || 'Enrollments',
            activities: t('activities') || 'Activities',
            submissions: t('submissions') || 'Submissions',
            attendance: t('attendance_records') || 'Attendance Records',
            penalties: t('penalties') || 'Penalties',
            grades: t('grades') || 'Grades',
            assignments: t('assignments') || 'Assignments',
            quizzes: t('quizzes') || 'Quizzes',
            reports: t('reports') || 'Reports',
            comments: t('comments') || 'Comments',
            files: t('files') || 'Files'
          };
          return `${count} ${typeLabels[type] || type}`;
        })
        .join(', ');

      return t('delete_user_with_records_msg', { 
        userName: actualEntityName,
        records: recordsList
      }) || `Are you sure you want to delete "${actualEntityName}"? This will also delete: ${recordsList}. This action cannot be undone.`;
    }
  }

  // Special handling for enrollment with related student records
  if (entityType === 'enrollment' && relatedRecords) {
    const hasRelatedRecords = Object.values(relatedRecords).some(count => count > 0);

    if (hasRelatedRecords) {
      const recordsList = Object.entries(relatedRecords)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => {
          const typeLabels = {
            enrollments: t('enrollments') || 'Enrollments',
            classes: t('classes') || 'Classes',
            activities: t('activities') || 'Activities',
            submissions: t('submissions') || 'Submissions',
            attendance: t('attendance_records') || 'Attendance Records',
            penalties: t('penalties') || 'Penalties',
            participations: t('participations') || 'Participations',
            behaviors: t('behaviors') || 'Behaviors',
            quizzes: t('quizzes') || 'Quizzes'
          };
          return `${count} ${typeLabels[type] || type}`;
        })
        .join(', ');

      return t('delete_enrollment_with_records_msg', {
        entityName: actualEntityName,
        records: recordsList
      }) || `Are you sure you want to delete the enrollment for "${actualEntityName}"? This student currently has: ${recordsList}. This action cannot be undone.`;
    }
  }

  // Special handling for program/subject/class with related items
  if (['program', 'subject', 'class'].includes(entityType) && relatedRecords) {
    const hasRelatedRecords = Object.values(relatedRecords).some(count => count > 0);
    
    if (hasRelatedRecords) {
      const recordsList = Object.entries(relatedRecords)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => {
          const typeLabels = {
            subjects: t('subjects') || 'Subjects',
            classes: t('classes') || 'Classes',
            activities: t('activities') || 'Activities',
            students: t('students') || 'Students',
            enrollments: t('enrollments') || 'Enrollments',
            assignments: t('assignments') || 'Assignments',
            quizzes: t('quizzes') || 'Quizzes',
            resources: t('resources') || 'Resources'
          };
          return `${count} ${typeLabels[type] || type}`;
        })
        .join(', ');

      return t('delete_entity_with_records_msg', { 
        entityName: actualEntityName,
        entityType: t(entityType) || entityType,
        records: recordsList
      }) || `Are you sure you want to delete "${actualEntityName}"? This will also delete: ${recordsList}. This action cannot be undone.`;
    }
  }

  // Default generic message
  const translationKey = 'delete_entity_msg';
  const translated = t(translationKey, { 
    entityName: actualEntityName
  });
  
  // Check if translation exists (not the same as the key)
  if (translated && translated !== translationKey) {
    return translated;
  }
  
  // Fallback to English message
  return `Are you sure you want to delete "${actualEntityName}"? This action cannot be undone.`;
};

/**
 * Get delete title for any entity type
 * @param {string} entityType - Type of entity being deleted
 * @param {Function} t - Translation function
 * @returns {string} Formatted delete title
 */
export const getDeleteTitle = (entityType, t = (key) => key) => {
  const entityTypes = {
    [RECORD_TYPES.ACTIVITY]: t('activity') || 'Activity',
    [RECORD_TYPES.USER]: t('user') || 'User',
    [RECORD_TYPES.PROGRAM]: t('program') || 'Program',
    [RECORD_TYPES.SUBJECT]: t('subject') || 'Subject',
    [RECORD_TYPES.CLASS]: t('class') || 'Class',
    [RECORD_TYPES.CATEGORY]: t('category') || 'Category',
    [RECORD_TYPES.QUIZ]: t('quiz') || 'Quiz',
    [RECORD_TYPES.ATTENDANCE]: t('attendance') || 'Attendance',
    [RECORD_TYPES.PARTICIPATION]: t('participation') || 'Participation',
    [RECORD_TYPES.BEHAVIOR]: t('behavior') || 'Behavior',
    [RECORD_TYPES.PENALTY]: t('penalty') || 'Penalty',
    [RECORD_TYPES.RESOURCE]: t('resource') || 'Resource',
    [RECORD_TYPES.ENROLLMENT]: t('enrollment') || 'Enrollment',
    [RECORD_TYPES.ANNOUNCEMENT]: t('announcement') || 'Announcement',
    [RECORD_TYPES.SUBMISSION]: t('submission') || 'Submission',
    [RECORD_TYPES.ASSIGNMENT]: t('assignment') || 'Assignment',
    [RECORD_TYPES.COURSE]: t('course') || 'Course',
    [RECORD_TYPES.MARK]: t('mark') || 'Mark',
    [RECORD_TYPES.GRADE]: t('grade') || 'Grade',
    [RECORD_TYPES.SCHEDULE]: t('schedule') || 'Schedule',
    [RECORD_TYPES.EVENT]: t('event') || 'Event',
    [RECORD_TYPES.NOTIFICATION]: t('notification') || 'Notification',
    // Common entity types
    'enrollment': t('enrollment') || 'Enrollment',
    'announcement': t('announcement') || 'Announcement',
    'submission': t('submission') || 'Submission',
    'assignment': t('assignment') || 'Assignment',
    'course': t('course') || 'Course',
    'mark': t('mark') || 'Mark',
    'grade': t('grade') || 'Grade',
    'schedule': t('schedule') || 'Schedule',
    'event': t('event') || 'Event',
    'notification': t('notification') || 'Notification',
    'email': t('email') || 'Email',
    'template': t('template') || 'Template',
    'report': t('report') || 'Report',
    'document': t('document') || 'Document',
    'file': t('file') || 'File',
    'folder': t('folder') || 'Folder',
    'comment': t('comment') || 'Comment',
    'tag': t('tag') || 'Tag',
    'setting': t('setting') || 'Setting',
    'permission': t('permission') || 'Permission',
    'role': t('role') || 'Role',
    'group': t('group') || 'Group',
    'team': t('team') || 'Team',
    'project': t('project') || 'Project',
    'task': t('task') || 'Task',
    'note': t('note') || 'Note',
    'message': t('message') || 'Message',
    'chat': t('chat') || 'Chat',
    'thread': t('thread') || 'Thread',
    'post': t('post') || 'Post',
    'reply': t('reply') || 'Reply',
    'like': t('like') || 'Like',
    'bookmark': t('bookmark') || 'Bookmark',
    'favorite': t('favorite') || 'Favorite',
    'subscription': t('subscription') || 'Subscription',
    'payment': t('payment') || 'Payment',
    'invoice': t('invoice') || 'Invoice',
    'receipt': t('receipt') || 'Receipt',
    'transaction': t('transaction') || 'Transaction',
    'order': t('order') || 'Order',
    'product': t('product') || 'Product',
    'service': t('service') || 'Service',
    'item': t('item') || 'Item'
  };

  const typeLabel = entityTypes[entityType] || t('item') || 'Item';
  const translationKey = 'delete_entity_title';
  const translated = t(translationKey, { type: typeLabel });
  
  // Check if translation exists (not the same as the key)
  if (translated && translated !== translationKey) {
    return translated;
  }
  
  // Fallback to English title
  return `Delete ${typeLabel}`;
};

/**
 * Create delete modal state object
 * @param {string} entityType - Type of entity
 * @param {string} entityName - Name of entity
 * @param {Function} onConfirm - Confirmation handler
 * @param {Object} options - Additional options
 * @returns {Object} Delete modal state
 */
export const createDeleteModalState = (entityType, entityName, onConfirm, options = {}) => {
  return {
    isOpen: true,
    entityType,
    entityName,
    onConfirm,
    ...options
  };
};

/**
 * Reset delete modal state
 * @returns {Object} Reset delete modal state
 */
export const resetDeleteModalState = () => ({
  isOpen: false,
  entityType: '',
  entityName: '',
  onConfirm: null
});
