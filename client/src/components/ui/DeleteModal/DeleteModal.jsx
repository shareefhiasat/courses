import React, { useState, useCallback } from 'react';
import { Button, Modal } from '@ui';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { getDeleteMessage, getDeleteTitle, createDeleteModalState, resetDeleteModalState } from '@utils/deleteMessages';

/**
 * Unified DeleteModal Component
 * 
 * Combines all delete functionality into a single component:
 * - Built-in message generation (no external utils needed)
 * - Built-in state management (no external hook needed)
 * - Built-in translations (no external context needed)
 * - Uses ConfirmModal base for consistent UI
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal should close
 * @param {Function} props.onConfirm - Function to call when confirmed
 * @param {string} props.entityType - Type of entity being deleted
 * @param {string} props.entityName - Name of the entity
 * @param {Object} props.relatedRecords - Related records count (for cascade delete warnings)
 * @param {boolean} props.loading - Whether delete action is loading
 * @param {string} props.customTitle - Custom title override
 * @param {string} props.customMessage - Custom message override
 * @param {Function} props.t - Translation function (optional, will use identity if not provided)
 */
const DeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  entityType, 
  entityName, 
  relatedRecords, 
  loading = false, 
  customTitle,
  customMessage,
  theme = 'light',
  t = (key) => key 
}) => {
  // Generate title and message using utilities
  const getTitle = () => {
    if (customTitle) return customTitle;
    return getDeleteTitle(entityType, t);
  };

  const getMessage = () => {
    if (customMessage) return customMessage;
    
    return getDeleteMessage(entityType, entityName, { relatedRecords, theme }, t);
  };

  const handleConfirm = useCallback(async () => {
    if (!loading && onConfirm) {
      try {
        await onConfirm();
        onClose();
      } catch (error) {
        logger.error('Delete operation failed:', error);
        // Still close modal on error
        onClose();
      }
    }
  }, [loading, onConfirm, onClose]);

  const footer = (
    <>
      <Button 
        variant="outline" 
        onClick={onClose}
        disabled={loading}
      >
        {t('cancel') || 'Cancel'}
      </Button>
      <Button 
        variant="danger" 
        onClick={handleConfirm} 
        loading={loading}
        style={{ backgroundColor: '#dc2626' }}
      >
        {t('delete') || 'Delete'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      footer={footer}
      size="small"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      className="delete-modal compact-modal"
      titleStyle={{ fontSize: '1rem', fontWeight: '600' }}
    >
      <div dangerouslySetInnerHTML={{ __html: getMessage() }} />
    </Modal>
  );
};

/**
 * Hook for managing delete modal state
 * Simplified version of useDeleteModal - just state management
 */
export const useDeleteModal = (t = (key) => key) => {
  const [deleteModal, setDeleteModal] = useState(resetDeleteModalState());

  const showDeleteModal = useCallback((entityType, entityName, onConfirm, options = {}) => {
    setDeleteModal(createDeleteModalState(entityType, entityName, onConfirm, options));
  }, []);

  const hideDeleteModal = useCallback(() => {
    setDeleteModal(resetDeleteModalState());
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteModal.onConfirm) {
      try {
        await deleteModal.onConfirm();
        hideDeleteModal();
      } catch (error) {
        logger.error('Delete operation failed:', error);
        // Still close modal on error
        hideDeleteModal();
      }
    }
  }, [deleteModal, hideDeleteModal]);

  // Convenience methods for common entity types
  const deleteActivity = useCallback((activity, onConfirm) => {
    const activityName = activity.title_en || activity.title || activity.name || 'this activity';
    showDeleteModal(RECORD_TYPES.ACTIVITY, activityName, onConfirm);
  }, [showDeleteModal]);

  const deleteUser = useCallback((user, onConfirm, relatedRecords) => {
    const userName = user.displayName || user.name || user.email || 'this user';
    showDeleteModal(RECORD_TYPES.USER, userName, onConfirm, { relatedRecords });
  }, [showDeleteModal]);

  const deleteProgram = useCallback((program, onConfirm, relatedRecords) => {
    const programName = program.name_en || program.name || 'this program';
    showDeleteModal('program', programName, onConfirm, { relatedRecords });
  }, [showDeleteModal]);

  const deleteSubject = useCallback((subject, onConfirm, relatedRecords) => {
    const subjectName = subject.name_en || subject.name || 'this subject';
    showDeleteModal(RECORD_TYPES.SUBJECT, subjectName, onConfirm, { relatedRecords });
  }, [showDeleteModal]);

  const deleteClass = useCallback((classItem, onConfirm, relatedRecords) => {
    const className = classItem.name_en || classItem.name || 'this class';
    showDeleteModal(RECORD_TYPES.CLASS, className, onConfirm, { relatedRecords });
  }, [showDeleteModal]);

  const deleteQuiz = useCallback((quiz, onConfirm) => {
    const quizName = quiz.title_en || quiz.title || quiz.name || 'this quiz';
    showDeleteModal(RECORD_TYPES.QUIZ, quizName, onConfirm);
  }, [showDeleteModal]);

  const deleteCategory = useCallback((category, onConfirm) => {
    const categoryName = category.name_en || category.name || 'this category';
    showDeleteModal(RECORD_TYPES.CATEGORY, categoryName, onConfirm);
  }, [showDeleteModal]);

  const deleteEntity = useCallback((entityType, entity, onConfirm, options = {}) => {
    const entityName = entity.name_en || entity.name || entity.title || entity.displayName || 'this item';
    showDeleteModal(entityType, entityName, onConfirm, options);
  }, [showDeleteModal]);

  return {
    // State
    deleteModal,
    isOpen: deleteModal.isOpen,
    entityType: deleteModal.entityType,
    entityName: deleteModal.entityName,
    
    // Handlers
    showDeleteModal,
    hideDeleteModal,
    handleDeleteConfirm,
    
    // Convenience methods
    deleteActivity,
    deleteUser,
    deleteProgram,
    deleteSubject,
    deleteClass,
    deleteQuiz,
    deleteCategory,
    deleteEntity,
    
    // Reset
    reset: hideDeleteModal
  };
};

export default DeleteModal;

