import React from 'react';
import { Button, Card, CardBody, Modal } from '@ui';


import { info, error, warn, debug } from '@services/utils/logger.js';const UserDeletionModal = ({ open, onClose, user }) => {
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    setLoading(true);
    // TODO: Implement actual user deletion logic
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Delete User">
      <div style={{ padding: '1rem' }}>
        <p>Are you sure you want to delete this user?</p>
        <p><strong>{user?.displayName || user?.email}</strong></p>
        <p style={{ color: '#dc2626' }}>This action cannot be undone.</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleDelete} loading={loading} style={{ backgroundColor: '#dc2626' }}>
            Delete User
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UserDeletionModal;
