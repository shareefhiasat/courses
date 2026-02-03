import React from 'react';
import { RECORD_TYPES } from '@constants/activityTypes';
import ConfirmModal from '@ui/Modal/ConfirmModal';

const DeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  deleteType, 
  studentName, 
  deleteLoading, 
  t 
}) => {
  const getTitle = () => {
    return t('delete_activity_title', { 
      type: deleteType === RECORD_TYPES.ATTENDANCE
        ? t('attendance')
        : deleteType === RECORD_TYPES.PARTICIPATION
          ? t('participation')
          : deleteType === RECORD_TYPES.BEHAVIOR
            ? t('behavior')
            : t('penalty')
    });
  };

  const getMessage = () => {
    return t('delete_activity_msg', { 
      studentName: studentName || t('this_student') 
    });
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
