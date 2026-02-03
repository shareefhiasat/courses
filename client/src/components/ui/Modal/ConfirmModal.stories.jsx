import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';
import Button from '../Button';

export default {
  title: 'UI/Modal/ConfirmModal',
  component: ConfirmModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A standardized confirmation modal built on the base Modal component. Used for delete confirmations and other destructive actions.'
      }
    }
  }
};

// Basic Confirmation
export const Basic = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Show Basic Confirmation</Button>
      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          console.log('Confirmed!');
          setIsOpen(false);
        }}
        title="Confirm Action"
        message="Are you sure you want to perform this action?"
      />
    </>
  );
};

// Delete Confirmation
export const DeleteConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete Item
      </Button>
      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          console.log('Item deleted');
          setIsOpen(false);
        }}
        title="Delete Confirmation"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};

// Loading State
export const LoadingState = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsOpen(false);
    }, 2000);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Show Loading Confirmation</Button>
      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title="Processing"
        message="Please wait while we process your request..."
        confirmText="Processing..."
        loading={loading}
        variant="primary"
      />
    </>
  );
};

// Different Variants
export const AllVariants = () => {
  const [modal, setModal] = useState(null);

  const showConfirmModal = (variant) => {
    setModal(variant);
  };

  const handleClose = () => {
    setModal(null);
  };

  const handleConfirm = () => {
    console.log(`${modal} confirmed`);
    handleClose();
  };

  const getModalProps = (variant) => {
    switch (variant) {
      case 'danger':
        return {
          title: 'Delete Item',
          message: 'Are you sure you want to delete this item? This cannot be undone.',
          confirmText: 'Delete',
          variant: 'danger'
        };
      case 'primary':
        return {
          title: 'Save Changes',
          message: 'Are you sure you want to save these changes?',
          confirmText: 'Save',
          variant: 'primary'
        };
      case 'success':
        return {
          title: 'Approve Request',
          message: 'Are you sure you want to approve this request?',
          confirmText: 'Approve',
          variant: 'success'
        };
      default:
        return {};
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button variant="danger" onClick={() => showConfirmModal('danger')}>
          Danger Modal
        </Button>
        <Button variant="primary" onClick={() => showConfirmModal('primary')}>
          Primary Modal
        </Button>
        <Button variant="success" onClick={() => showConfirmModal('success')}>
          Success Modal
        </Button>
      </div>

      {modal && (
        <ConfirmModal
          isOpen={!!modal}
          onClose={handleClose}
          onConfirm={handleConfirm}
          {...getModalProps(modal)}
        />
      )}
    </>
  );
};

// Different Sizes
export const DifferentSizes = () => {
  const [size, setSize] = useState(null);

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button onClick={() => setSize('small')}>Small Modal</Button>
        <Button onClick={() => setSize('medium')}>Medium Modal</Button>
        <Button onClick={() => setSize('large')}>Large Modal</Button>
      </div>

      {size && (
        <ConfirmModal
          isOpen={!!size}
          onClose={() => setSize(null)}
          onConfirm={() => {
            console.log(`${size} modal confirmed`);
            setSize(null);
          }}
          title={`${size.charAt(0).toUpperCase() + size.slice(1)} Confirmation`}
          message={`This is a ${size} confirmation modal with more content to demonstrate the size. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`}
          size={size}
        />
      )}
    </>
  );
};

// Custom Messages
export const CustomMessages = () => {
  const [modalType, setModalType] = useState(null);

  const modals = {
    user: {
      title: 'Delete User Account',
      message: 'Are you sure you want to delete the user account for "john.doe@example.com"? All associated data will be permanently removed.',
      confirmText: 'Delete User',
      variant: 'danger'
    },
    file: {
      title: 'Delete File',
      message: 'Are you sure you want to delete "document.pdf"? This action cannot be undone.',
      confirmText: 'Delete File',
      variant: 'danger'
    },
    settings: {
      title: 'Reset Settings',
      message: 'Are you sure you want to reset all settings to default values? Your current configuration will be lost.',
      confirmText: 'Reset',
      variant: 'primary'
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button onClick={() => setModalType('user')}>Delete User</Button>
        <Button onClick={() => setModalType('file')}>Delete File</Button>
        <Button onClick={() => setModalType('settings')}>Reset Settings</Button>
      </div>

      {modalType && (
        <ConfirmModal
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
          onConfirm={() => {
            console.log(`${modalType} action confirmed`);
            setModalType(null);
          }}
          {...modals[modalType]}
        />
      )}
    </>
  );
};
