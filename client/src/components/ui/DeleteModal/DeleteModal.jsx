import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getThemedIcon } from '@constants/iconTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { getDeleteMessage, getDeleteTitle, createDeleteModalState, resetDeleteModalState } from '@utils/deleteMessages';
import { info, error, warn, debug } from '@services/utils/logger.js';

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
  if (!isOpen) return null;

  const title = customTitle || getDeleteTitle(entityType, t);
  const message = customMessage || getDeleteMessage(entityType, entityName, { relatedRecords, theme }, t);

  const handleConfirm = useCallback(async () => {
    if (!loading && onConfirm) {
      try {
        await onConfirm();
        onClose();
      } catch (error) {
        console.error('Delete operation failed:', error);
        onClose();
      }
    }
  }, [loading, onConfirm, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const isHtml = /<[a-z][\s\S]*>/i.test(message);

  return createPortal(
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}>
          {getThemedIcon('ui', 'trash', 28, 'white')}
        </div>

        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 0.5rem 0'
        }}>
          {title}
        </h3>

        {isHtml ? (
          <div 
            style={{ fontSize: '1rem', color: '#6b7280', margin: '0 0 1.5rem 0', lineHeight: '1.5' }}
            dangerouslySetInnerHTML={{ __html: message }} 
          />
        ) : (
          <p style={{
            fontSize: '1rem',
            color: '#6b7280',
            margin: '0 0 1.5rem 0',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap'
          }}>
            {message}
          </p>
        )}

        <div style={{
          borderTop: '1px solid #e5e7eb',
          margin: '0 -2rem -2rem -2rem',
          padding: '1rem 2rem',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              background: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              flex: 1,
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '...' : (t('delete') || 'Delete')}
          </button>
        </div>
      </div>
    </div>,
    document.body
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
      } catch (err) {
        error('Delete operation failed:', err);
        // Still close modal on error
        hideDeleteModal();
      }
    }
  }, [deleteModal, hideDeleteModal]);

  // Convenience methods for common entity types
  const deleteActivity = useCallback((activity, onConfirm) => {
    const activityName = activity.titleEn || activity.title || activity.name || 'this activity';
    showDeleteModal(RECORD_TYPES.ACTIVITY, activityName, onConfirm);
  }, [showDeleteModal]);

  const deleteUser = useCallback((user, onConfirm, relatedRecords) => {
    const userName = user.displayName || user.name || user.email || 'this user';
    showDeleteModal(RECORD_TYPES.USER, userName, onConfirm, { relatedRecords });
  }, [showDeleteModal]);

  const deleteProgram = useCallback((program, onConfirm, relatedRecords) => {
    const programName = program.nameEn || program.name || 'this program';
    showDeleteModal('program', programName, onConfirm, { relatedRecords });
  }, [showDeleteModal]);

  const deleteSubject = useCallback((subject, onConfirm, relatedRecords) => {
    const subjectName = subject.nameEn || subject.name || 'this subject';
    showDeleteModal(RECORD_TYPES.SUBJECT, subjectName, onConfirm, { relatedRecords });
  }, [showDeleteModal]);

  const deleteClass = useCallback((classItem, onConfirm, relatedRecords) => {
    const className = classItem.nameEn || classItem.name || 'this class';
    showDeleteModal(RECORD_TYPES.CLASS, className, onConfirm, { relatedRecords });
  }, [showDeleteModal]);

  const deleteQuiz = useCallback((quiz, onConfirm) => {
    const quizName = quiz.titleEn || quiz.title || quiz.name || 'this quiz';
    showDeleteModal(RECORD_TYPES.QUIZ, quizName, onConfirm);
  }, [showDeleteModal]);

  const deleteCategory = useCallback((category, onConfirm) => {
    const categoryName = category.nameEn || category.name || 'this category';
    showDeleteModal(RECORD_TYPES.CATEGORY, categoryName, onConfirm);
  }, [showDeleteModal]);

  const deleteEntity = useCallback((entityType, entity, onConfirm, options = {}) => {
    const entityName = entity.nameEn || entity.name || entity.title || entity.displayName || 'this item';
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

