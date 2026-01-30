import React from 'react';
import { Button, Card, CardBody } from '@ui';

const DeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  deleteType, 
  studentName, 
  deleteLoading, 
  t 
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <Card style={{ maxWidth: '400px', margin: '1rem' }}>
        <CardBody>
          <h3>
            {t('delete_activity_title', { 
              type: deleteType === 'attendance' ? t('attendance') : t('penalty') 
            })}
          </h3>
          <p>
            {t('delete_activity_msg', { 
              studentName: studentName || t('this_student') 
            })}
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            justifyContent: 'flex-end', 
            marginTop: '1rem' 
          }}>
            <Button 
              variant="primary" 
              onClick={onConfirm} 
              loading={deleteLoading} 
              style={{ backgroundColor: '#dc2626' }}
            >
              {t('delete') || 'Delete'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {t('cancel') || 'Cancel'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default DeleteModal;
