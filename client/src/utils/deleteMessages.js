/**
 * Generic Delete Messages Utility
 * 
 * Provides standardized delete confirmation messages for different entity types.
 * This ensures consistent messaging across all screens and makes it easy to add new entity types.
 */

import { RECORD_TYPES } from '@utils/sharedTypes';
import { ICON_TYPES } from '@constants/iconTypes';

/**
 * Convert React icon component to SVG string for HTML usage
 * @param {React.Component} iconComponent - React icon component from ICON_TYPES
 * @returns {string} SVG string
 */
const iconComponentToSvg = (iconComponent) => {
  // Map of known icon components to their SVG strings
  // This ensures we get clean SVG markup instead of [object Object]
  const iconSvgMap = {
    // UI Icons
    'book_open': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
    'home': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9,22 9,12 15,12 15,22"></polyline></svg>',
    'calendar': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    'alert_triangle': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    'users': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    'bar_chart_3': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>',
    'target': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
    'file_text': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>',
    'close': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    // Special icons for specific categories
    'behaviors_disruptive': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    'penalties_cheating': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    'participations_excellent': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon></svg>'
  };
  
  // Try to identify the icon based on common patterns
  if (iconComponent === ICON_TYPES.ui.book_open) return iconSvgMap.book_open;
  if (iconComponent === ICON_TYPES.ui.home) return iconSvgMap.home;
  if (iconComponent === ICON_TYPES.ui.calendar) return iconSvgMap.calendar;
  if (iconComponent === ICON_TYPES.ui.alert_triangle) return iconSvgMap.alert_triangle;
  if (iconComponent === ICON_TYPES.ui.users) return iconSvgMap.users;
  if (iconComponent === ICON_TYPES.ui.bar_chart_3) return iconSvgMap.bar_chart_3;
  if (iconComponent === ICON_TYPES.ui.target) return iconSvgMap.target;
  if (iconComponent === ICON_TYPES.ui.file_text) return iconSvgMap.file_text;
  if (iconComponent === ICON_TYPES.ui.close) return iconSvgMap.close;
  if (iconComponent === ICON_TYPES.behavior_type.disruptive) return iconSvgMap.behaviors_disruptive;
  if (iconComponent === ICON_TYPES.penalty_type.cheating) return iconSvgMap.penalties_cheating;
  if (iconComponent === ICON_TYPES.participation_type.excellent) return iconSvgMap.participations_excellent;
  
  // Fallback to file_text icon
  return iconSvgMap.file_text;
};

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
        // Use actual React components from ICON_TYPES
        const iconComponentMap = {
          'book_open': ICON_TYPES.ui.book_open,
          'home': ICON_TYPES.ui.home,
          'calendar': ICON_TYPES.ui.calendar,
          'alert_triangle': ICON_TYPES.ui.alert_triangle,
          'users': ICON_TYPES.ui.users,
          'bar_chart': ICON_TYPES.ui.bar_chart_3,
          'target': ICON_TYPES.ui.target,
          'file_text': ICON_TYPES.ui.file_text,
          // Use the specific categories from iconTypes
          'behaviors': ICON_TYPES.behavior_type.disruptive,
          'penalties': ICON_TYPES.penalty_type.cheating,
          'participations': ICON_TYPES.participation_type.excellent
        };
        
        const iconComponent = iconComponentMap[icon] || ICON_TYPES.ui.file_text;
        
        // Convert React component to clean SVG string using our helper
        const iconHtml = iconComponentToSvg(iconComponent);
        
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
      <p style="margin: 0 0 16px 0; font-weight: 500;">${t('are_you_sure_delete', { itemName: actualEntityName }) || `Are you sure you want to delete <strong>"${actualEntityName}"</strong>?`}</p>
      <p style="margin: 0 0 8px 0; color: #6b7280;">${t('will_delete_related_records') || 'This will also delete the following related records:'}</p>
      ${tableHtml}
      <p style="margin: 16px 0 0 0; color: #dc2626; font-weight: 500;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 8px; vertical-align: middle;">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        ${t('action_cannot_be_undone') || 'This action cannot be undone.'}
      </p>
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

