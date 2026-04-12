import { useState, useCallback } from 'react';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { createDeleteModalState, resetDeleteModalState } from '@utils/deleteMessages';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * useDeleteModal Hook
 * 
 * Provides a standardized way to handle delete modals across all screens.
 * This eliminates the need for repetitive delete modal state management.
 * 
 * @param {Function} t - Translation function (optional, will use identity function if not provided)
 * @returns {Object} Delete modal state and handlers
 */
export const useDeleteModal = (t = (key) => key) => {
  const [deleteModal, setDeleteModal] = useState(resetDeleteModalState());

  /**
   * Show delete confirmation modal
   * @param {string} entityType - Type of entity being deleted
   * @param {string} entityName - Name of the entity
   * @param {Function} onConfirm - Function to call when deletion is confirmed
   * @param {Object} options - Additional options
   */
  const showDeleteModal = useCallback((entityType, entityName, onConfirm, options = {}) => {
    setDeleteModal(createDeleteModalState(entityType, entityName, onConfirm, options));
  }, []);

  /**
   * Hide delete modal
   */
  const hideDeleteModal = useCallback(() => {
    setDeleteModal(resetDeleteModalState());
  }, []);

  /**
   * Handle delete confirmation (calls the onConfirm function)
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (deleteModal.onConfirm) {
      try {
        await deleteModal.onConfirm();
      } catch (error) {
        error('Delete operation failed:', error);
        // Don't re-throw, just log and close modal
      } finally {
        hideDeleteModal();
      }
    } else {
      hideDeleteModal();
    }
  }, [deleteModal, hideDeleteModal]);

  /**
   * Convenience methods for common entity types
   */
  const handlers = {
    // Activity deletion
    deleteActivity: useCallback((activity, onConfirm) => {
      const activityName = activity.title_en || activity.title || activity.name || 'this activity';
      showDeleteModal(RECORD_TYPES.ACTIVITY, activityName, onConfirm);
    }, [showDeleteModal]),

    // User deletion
    deleteUser: useCallback((user, onConfirm, relatedRecords) => {
      const userName = user.displayName || user.name || user.email || 'this user';
      showDeleteModal(RECORD_TYPES.USER, userName, onConfirm, { relatedRecords });
    }, [showDeleteModal]),

    // Program deletion
    deleteProgram: useCallback((program, onConfirm, relatedRecords) => {
      const programName = program.name_en || program.name || 'this program';
      showDeleteModal('program', programName, onConfirm, { relatedRecords });
    }, [showDeleteModal]),

    // Subject deletion
    deleteSubject: useCallback((subject, onConfirm, relatedRecords) => {
      const subjectName = subject.name_en || subject.name || 'this subject';
      showDeleteModal(RECORD_TYPES.SUBJECT, subjectName, onConfirm, { relatedRecords });
    }, [showDeleteModal]),

    // Class deletion
    deleteClass: useCallback((classItem, onConfirm, relatedRecords) => {
      const className = classItem.name_en || classItem.name || 'this class';
      showDeleteModal(RECORD_TYPES.CLASS, className, onConfirm, { relatedRecords });
    }, [showDeleteModal]),

    // Quiz deletion
    deleteQuiz: useCallback((quiz, onConfirm) => {
      const quizName = quiz.title_en || quiz.title || quiz.name || 'this quiz';
      showDeleteModal(RECORD_TYPES.QUIZ, quizName, onConfirm);
    }, [showDeleteModal]),

    // Category deletion
    deleteCategory: useCallback((category, onConfirm) => {
      const categoryName = category.name_en || category.name || 'this category';
      showDeleteModal(RECORD_TYPES.CATEGORY, categoryName, onConfirm);
    }, [showDeleteModal]),

    // Generic deletion
    deleteEntity: useCallback((entityType, entity, onConfirm, options = {}) => {
      const entityName = entity.name_en || entity.name || entity.title || entity.displayName || 'this item';
      showDeleteModal(entityType, entityName, onConfirm, options);
    }, [showDeleteModal])
  };

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
    ...handlers,
    
    // Reset function
    reset: hideDeleteModal
  };
};

export default useDeleteModal;

