import React from 'react';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { getDeleteMessage, getDeleteTitle } from '@utils/deleteMessages';
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
  relatedRecords, // Object with counts of related records
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
  
  // Use utility functions for consistent messaging
  const getTitle = () => {
    if (customTitle) return customTitle;
    return getDeleteTitle(actualEntityType, t);
  };

  const getMessage = () => {
    if (customMessage) return customMessage;
    return getDeleteMessage(actualEntityType, actualEntityName, { relatedRecords }, t);
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
