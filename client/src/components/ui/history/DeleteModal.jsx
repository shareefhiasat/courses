import React from 'react';
import { RECORD_TYPES } from '@utils/sharedTypes';
import ConfirmModal from '@ui/Modal/ConfirmModal';

/**
 * Generic Delete Modal Component
 * 
 * A centralized delete confirmation modal that can handle different entity types.
 * Supports special handling for user deletions with related record counts.
 * 
 * Backward compatibility: Supports old props (deleteType, studentName) and new props (entityType, entityName)
 */
const DeleteModal = ({ 
  // New props (recommended)
  isOpen, 
  onClose, 
  onConfirm, 
  entityType, // 'activity', 'user', 'program', 'subject', 'class', etc.
  entityName, // Name of the entity being deleted
  relatedRecords, // Object with counts of related records (for user deletion)
  deleteLoading = false, 
  customTitle,
  customMessage,
  
  // Backward compatibility props (deprecated)
  deleteType, // Old prop name for entityType
  studentName, // Old prop name for entityName when deleting user-related records
  t 
}) => {
  // Handle backward compatibility
  const actualEntityType = entityType || deleteType;
  const actualEntityName = entityName || studentName;
  const getTitle = () => {
    if (customTitle) return customTitle;
    
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
      // Additional entity types commonly deleted
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

    const typeLabel = entityTypes[actualEntityType] || t('item') || 'Item';
    return t('delete_entity_title', { type: typeLabel }) || `Delete ${typeLabel}`;
  };

  const getMessage = () => {
    if (customMessage) return customMessage;
    
    // Special handling for user deletion with related records
    if (actualEntityType === RECORD_TYPES.USER && relatedRecords) {
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
              penalties: t('penalties') || 'Penalties'
            };
            return `${count} ${typeLabels[type] || type}`;
          })
          .join(', ');

        return t('delete_user_with_records_msg', { 
          userName: actualEntityName || t('this_user'),
          records: recordsList
        }) || `Are you sure you want to delete "${actualEntityName || 'this user'}"? This will also delete: ${recordsList}. This action cannot be undone.`;
      }
    }

    // Default message for other entities
    return t('delete_entity_msg', { 
      entityName: actualEntityName || t('this_item'),
      type: getTitle().replace('Delete ', '').toLowerCase()
    }) || `Are you sure you want to delete "${actualEntityName || 'this item'}"? This action cannot be undone.`;
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={getTitle()}
      message={getMessage()}
      confirmText={t('delete') || 'Delete'}
      cancelText={t('cancel') || 'Cancel'}
      loading={deleteLoading}
      variant="danger"
      size="small"
    />
  );
};

export default DeleteModal;
