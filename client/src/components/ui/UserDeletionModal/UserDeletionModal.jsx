import React from 'react';
import { Button, Card, CardBody, Modal } from '@ui';
import { useLang } from '@contexts/LangContext';


import { info, error, warn, debug } from '@services/utils/logger.js';const UserDeletionModal = ({ open, onClose, user }) => {
  const { t } = useLang();
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
    <Modal isOpen={open} onClose={onClose} title={t('delete_user')}>
      <div style={{ padding: '1rem' }}>
        <p>{t('are_you_sure_delete_user')}</p>
        <p><strong>{user?.displayName || user?.email}</strong></p>
        <p style={{ color: '#dc2626' }}>{t('cannot_be_undone')}</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
          <Button variant="primary" onClick={handleDelete} loading={loading} style={{ backgroundColor: '#dc2626' }}>
            {t('delete_user')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UserDeletionModal;
