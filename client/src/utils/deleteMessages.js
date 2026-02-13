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
  const { relatedRecords, theme = 'light' } = options;
  const actualEntityName = entityName || t('this_item') || 'this item';
  
  // Special handling for entities with related records
  if (entityType === RECORD_TYPES.USER && relatedRecords) {
    // Create a formatted table for the related records using Lucide icons
    const recordTypes = [
      { key: 'enrollments', label: t('enrollments') || 'Enrollments', icon: 'book_open' },
      { key: 'classes', label: t('classes') || 'Classes', icon: 'home' },
      { key: 'attendance', label: t('attendance_records') || 'Attendance Records', icon: 'calendar' },
      { key: 'penalties', label: t('penalties') || 'Penalties', icon: 'alert_triangle' },
      { key: 'participations', label: t('participations') || 'Participations', icon: 'users' },
      { key: 'behaviors', label: t('behaviors') || 'Behaviors', icon: 'bar_chart' },
      { key: 'activities', label: t('activities') || 'Activities', icon: 'target' },
      { key: 'submissions', label: t('submissions') || 'Submissions', icon: 'file_text' }
    ];

    const tableRows = recordTypes
      .map(({ key, label, icon }) => {
        const count = relatedRecords[key] || 0;
        // Use simple SVG icons instead of React components
        const iconMap = {
          'book_open': '📚',
          'home': '🏫', 
          'calendar': '📅',
          'alert_triangle': '⚠️',
          'users': '👥',
          'bar_chart': '📊',
          'target': '🎯',
          'file_text': '📄'
        };
        const iconHtml = iconMap[icon] || '📄';
        return count > 0 ? `<tr><td class="icon-cell">${iconHtml}</td><td>${label}</td><td class="count-cell">${count}</td></tr>` : null;
      })
      .filter(Boolean)
      .join('');

    const tableHtml = `
      <div style="margin: 16px 0;">
        <style>
          .delete-table { 
            width: 100%; 
            border-collapse: collapse; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            overflow: hidden;
            font-size: 14px;
          }
          .delete-table thead { 
            background-color: #f9fafb; 
            border-bottom: 1px solid #e5e7eb; 
          }
          .delete-table th { 
            padding: 12px; 
            text-align: left; 
            font-weight: 600; 
            color: #374151; 
          }
          .delete-table td { 
            padding: 12px; 
            border-bottom: 1px solid #f3f4f6;
            color: #374151;
          }
          .delete-table tbody tr:last-child td { border-bottom: none; }
          .delete-table tbody tr:nth-child(even) { background-color: #f9fafb; }
          .delete-table .count-cell { text-align: right; font-weight: 600; color: #059669; }
          .delete-table .icon-cell { font-size: 16px; }
          
          /* Dark mode */
          [data-theme="dark"] .delete-table { border-color: #374151; }
          [data-theme="dark"] .delete-table thead { background-color: #1f2937; border-color: #374151; }
          [data-theme="dark"] .delete-table th { color: #f9fafb; }
          [data-theme="dark"] .delete-table td { color: #d1d5db; border-color: #374151; }
          [data-theme="dark"] .delete-table tbody tr:nth-child(even) { background-color: #1f2937; }
          [data-theme="dark"] .delete-table .count-cell { color: #10b981; }
        </style>
        <table class="delete-table">
          <thead>
            <tr>
              <th style="width: 40px;">Type</th>
              <th>Item</th>
              <th style="width: 80px;">Count</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #6b7280;">No related records found</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    
    // Try translation first
    const key = 'delete_user_with_records_msg';
    const translated = t(key, { 
      userName: actualEntityName,
      records: tableHtml
    });

    // If a real translation exists and is not just a placeholder, use it
    if (
      translated &&
      translated !== key &&
      translated.toLowerCase().trim() !== 'delete user with records msg'
    ) {
      return translated;
    }

    // Fallback: always show a detailed message with the formatted table
    return `<div style="line-height: 1.6;">
      <p style="margin: 0 0 16px 0; font-weight: 500;">Are you sure you want to delete <strong>"${actualEntityName}"</strong>?</p>
      <p style="margin: 0 0 8px 0; color: #6b7280;">This will also delete the following related records:</p>
      ${tableHtml}
      <p style="margin: 16px 0 0 0; color: #dc2626; font-weight: 500;">⚠️ This action cannot be undone.</p>
    </div>`;
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
