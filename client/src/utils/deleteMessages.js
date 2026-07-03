/**
 * Generic Delete Messages Utility
 * 
 * Provides standardized delete confirmation messages for different entity types.
 * This ensures consistent messaging across all screens and makes it easy to add new entity types.
 */

import { RECORD_TYPES } from '@utils/sharedTypes';
import { ICON_TYPES } from '@constants/iconTypes';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
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
  const actualEntityName = entityName || t('this_item');
  
  // Special handling for entities with related records
  if (entityType === RECORD_TYPES.USER && relatedRecords) {
    // Create a formatted table for the related records using Lucide icons
    const recordTypes = [
      { key: 'enrollments', label: t('enrollments'), icon: 'book_open' },
      { key: 'classes', label: t('classes'), icon: 'home' },
      { key: 'attendance', label: t('attendance_records'), icon: 'calendar' },
      { key: 'penalties', label: t('penalties'), icon: 'alert_triangle' },
      { key: 'participations', label: t('participations'), icon: 'users' },
      { key: 'behaviors', label: t('behaviors'), icon: 'bar_chart' },
      { key: 'activities', label: t('activities'), icon: 'target' },
      { key: 'submissions', label: t('submissions'), icon: 'file_text' }
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
      <p style="margin: 0 0 16px 0; font-weight: 500;">${t('are_you_sure_delete', { itemName: actualEntityName })}</p>
      <p style="margin: 0 0 8px 0; color: #6b7280;">${t('will_delete_related_records')}</p>
      ${tableHtml}
      <p style="margin: 16px 0 0 0; color: #dc2626; font-weight: 500;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 8px; vertical-align: middle;">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        ${t('action_cannot_be_undone')}
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
            enrollments: t('enrollments'),
            classes: t('classes'),
            activities: t('activities'),
            submissions: t('submissions'),
            attendance: t('attendance_records'),
            penalties: t('penalties'),
            participations: t('participations'),
            behaviors: t('behaviors'),
            quizzes: t('quizzes')
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
            subjects: t('subjects'),
            classes: t('classes'),
            activities: t('activities'),
            students: t('students'),
            enrollments: t('enrollments'),
            assignments: t('assignments'),
            quizzes: t('quizzes'),
            resources: t('resources')
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
    [RECORD_TYPES.ACTIVITY]: t('activity'),
    [RECORD_TYPES.USER]: t('user'),
    [RECORD_TYPES.PROGRAM]: t('program'),
    [RECORD_TYPES.SUBJECT]: t('subject'),
    [RECORD_TYPES.CLASS]: t('class'),
    [RECORD_TYPES.CATEGORY]: t('category'),
    [RECORD_TYPES.QUIZ]: t('quiz'),
    [RECORD_TYPES.ATTENDANCE]: t('attendance'),
    [RECORD_TYPES.PARTICIPATION]: t('participation'),
    [RECORD_TYPES.BEHAVIOR]: t('behavior'),
    [RECORD_TYPES.PENALTY]: t('penalty'),
    [RECORD_TYPES.RESOURCE]: t('resource'),
    [RECORD_TYPES.ENROLLMENT]: t('enrollment'),
    [RECORD_TYPES.ANNOUNCEMENT]: t('announcement'),
    [RECORD_TYPES.SUBMISSION]: t('submission'),
    [RECORD_TYPES.ASSIGNMENT]: t('assignment'),
    [RECORD_TYPES.COURSE]: t('course'),
    [RECORD_TYPES.MARK]: t('mark'),
    [RECORD_TYPES.GRADE]: t('grade'),
    [RECORD_TYPES.SCHEDULE]: t('schedule'),
    [RECORD_TYPES.EVENT]: t('event'),
    [RECORD_TYPES.NOTIFICATION]: t('notification'),
    // Common entity types
    'enrollment': t('enrollment'),
    'announcement': t('announcement'),
    'submission': t('submission'),
    'assignment': t('assignment'),
    'course': t('course'),
    'mark': t('mark'),
    'grade': t('grade'),
    'schedule': t('schedule'),
    'event': t('event'),
    'notification': t('notification'),
    'email': t('email'),
    'template': t('template'),
    'report': t('report'),
    'document': t('document'),
    'file': t('file'),
    'folder': t('folder'),
    'comment': t('comment'),
    'tag': t('tag'),
    'setting': t('setting'),
    'permission': t('permission'),
    'role': t('role'),
    'group': t('group'),
    'team': t('team'),
    'project': t('project'),
    'task': t('task'),
    'note': t('note'),
    'message': t('message'),
    'chat': t('chat'),
    'thread': t('thread'),
    'post': t('post'),
    'reply': t('reply'),
    'like': t('like'),
    'bookmark': t('bookmark'),
    'favorite': t('favorite'),
    'subscription': t('subscription'),
    'payment': t('payment'),
    'invoice': t('invoice'),
    'receipt': t('receipt'),
    'transaction': t('transaction'),
    'order': t('order'),
    'product': t('product'),
    'service': t('service'),
    'item': t('item')
  };

  const typeLabel = entityTypes[entityType] || t('item');
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

