import React from 'react';
import { Button, Modal } from '@ui';

/**
 * ConfirmModal Component
 * 
 * A standardized confirmation modal built on the base Modal component.
 * Used for delete confirmations and other destructive actions.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal should close
 * @param {Function} props.onConfirm - Function to call when confirmed
 * @param {string} props.title - Modal title
 * @param {string} props.message - Confirmation message
 * @param {string} props.confirmText - Text for confirm button (default: "Delete")
 * @param {string} props.cancelText - Text for cancel button (default: "Cancel")
 * @param {boolean} props.loading - Whether confirm action is loading
 * @param {'danger'|'primary'|'success'} props.variant - Button variant (default: "danger")
 * @param {string} props.size - Modal size (default: "small")
 */
const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Delete', 
  cancelText = 'Cancel',
  loading = false,
  variant = 'danger',
  size = 'small'
}) => {
  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  const footer = (
    <>
      <Button 
        variant="outline" 
        onClick={onClose}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button 
        variant={variant} 
        onClick={handleConfirm} 
        loading={loading}
        style={variant === 'danger' ? { backgroundColor: '#dc2626' } : {}}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size={size}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <p>{message}</p>
    </Modal>
  );
};

export default ConfirmModal;
