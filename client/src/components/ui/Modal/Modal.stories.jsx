import React, { useState } from 'react';
import Modal from './Modal';
import Button from '../Button';
import Input from '../Input';


import { info, error, warn, debug } from '@services/utils/logger.js';export default {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Base modal component with advanced features like dragging, sizing, and accessibility. This is the foundation for specialized modal variations:\n\n- **ConfirmModal**: Standardized confirmation dialogs for destructive actions\n- **DeleteModal**: Business logic wrapper for activity deletion confirmations\n- **UserDeletionModal**: User account deletion confirmations\n\nSee the individual stories for each variation for specific use cases.'
      }
    }
  }
};

// Basic Modal
export const Basic = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Basic Modal"
      >
        <p>This is a basic modal with a title and content.</p>
        <p>Click outside or press Escape to close.</p>
      </Modal>
    </>
  );
};

// With Footer
export const WithFooter = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal with Footer</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Confirm
            </Button>
          </>
        }
      >
        <p>Are you sure you want to perform this action?</p>
      </Modal>
    </>
  );
};

// Sizes
export const AllSizes = () => {
  const [size, setSize] = useState(null);

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button onClick={() => setSize('small')}>Small Modal</Button>
        <Button onClick={() => setSize('medium')}>Medium Modal</Button>
        <Button onClick={() => setSize('large')}>Large Modal</Button>
        <Button onClick={() => setSize('full')}>Full Modal</Button>
      </div>
      <Modal
        isOpen={!!size}
        onClose={() => setSize(null)}
        title={`${size?.charAt(0).toUpperCase()}${size?.slice(1)} Modal`}
        size={size}
      >
        <p>This is a {size} modal.</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </Modal>
    </>
  );
};

// Form Modal
export const FormModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    info('Form submitted:', formData);
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Form Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add New User"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Save
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            fullWidth
          />
        </form>
      </Modal>
    </>
  );
};

// Delete Confirmation
export const DeleteConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    info('Item deleted');
    setIsOpen(false);
  };

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete Item
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Delete Confirmation"
        size="small"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete this item?</p>
        <p style={{ color: '#dc3545', fontWeight: '500' }}>
          This action cannot be undone.
        </p>
      </Modal>
    </>
  );
};

// Long Content
export const LongContent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal with Long Content</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Terms and Conditions"
        footer={
          <Button variant="primary" onClick={() => setIsOpen(false)} fullWidth>
            I Agree
          </Button>
        }
      >
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua.
          </p>
        ))}
      </Modal>
    </>
  );
};

// No Close Button
export const NoCloseButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal (No Close Button)</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Important Message"
        showCloseButton={false}
        closeOnOverlayClick={false}
        closeOnEscape={false}
        footer={
          <Button variant="primary" onClick={() => setIsOpen(false)} fullWidth>
            I Understand
          </Button>
        }
      >
        <p>You must acknowledge this message before continuing.</p>
        <p>Click the button below to proceed.</p>
      </Modal>
    </>
  );
};

// Success Message
export const SuccessMessage = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Show Success</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="small"
      >
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#d4edda',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '2rem'
          }}>
            ✓
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>Success!</h3>
          <p style={{ margin: 0, color: '#666' }}>
            Your changes have been saved successfully.
          </p>
        </div>
      </Modal>
    </>
  );
};

// Modal Variations Showcase
export const ModalVariations = () => {
  const [modalType, setModalType] = useState(null);

  const openModal = (type) => {
    setModalType(type);
  };

  const closeModal = () => {
    setModalType(null);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button onClick={() => openModal('basic')}>Basic Modal</Button>
        <Button variant="danger" onClick={() => openModal('confirm')}>Confirm Modal</Button>
        <Button variant="danger" onClick={() => openModal('delete')}>Delete Activity</Button>
        <Button variant="danger" onClick={() => openModal('userDelete')}>Delete User</Button>
      </div>

      {/* Basic Modal */}
      <Modal
        isOpen={modalType === 'basic'}
        onClose={closeModal}
        title="Basic Modal Example"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={closeModal}>OK</Button>
          </>
        }
      >
        <p>This is the base modal component. All other modal variations are built on top of this foundation.</p>
        <p>Features include dragging, resizing, accessibility, and keyboard navigation.</p>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        isOpen={modalType === 'confirm'}
        onClose={closeModal}
        title="Confirm Action"
        size="small"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="danger" onClick={closeModal}>Confirm</Button>
          </>
        }
      >
        <p>Are you sure you want to perform this action?</p>
        <p style={{ color: '#dc2626' }}>This cannot be undone.</p>
      </Modal>

      {/* Delete Activity Modal */}
      <Modal
        isOpen={modalType === 'delete'}
        onClose={closeModal}
        title="Delete Attendance Record"
        size="small"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="danger" onClick={closeModal}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete this attendance record for John Doe?</p>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={modalType === 'userDelete'}
        onClose={closeModal}
        title="Delete User"
        size="small"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="danger" onClick={closeModal}>Delete User</Button>
          </>
        }
      >
        <p>Are you sure you want to delete this user?</p>
        <p><strong>john.doe@example.com</strong></p>
        <p style={{ color: '#dc2626' }}>This action cannot be undone.</p>
      </Modal>
    </>
  );
};

