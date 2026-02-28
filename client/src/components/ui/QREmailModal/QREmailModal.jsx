import React, { useState, useCallback, useRef } from 'react';
import { Button, Modal, Input } from '@ui';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast } from '@ui';
import logger from '@utils/logger';

/**
 * QR Code Email Modal Component
 * 
 * A modal for sending QR codes via email with the option to use
 * a custom email address instead of the default student email.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal should close
 * @param {Object} props.student - Student object with id, email, displayName, etc.
 * @param {Function} props.t - Translation function (optional)
 */
const QREmailModal = ({ 
  isOpen, 
  onClose, 
  student, 
  t = (key) => key 
}) => {
  const { theme } = useTheme();
  const toast = useToast();
  const { lang } = useLang();
  
  // Form state
  const [useCustomEmail, setUseCustomEmail] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Ref for uncontrolled input
  const customEmailRef = useRef(null);

  // Sync ref when state changes
  React.useEffect(() => {
    if (customEmailRef.current) {
      customEmailRef.current.value = customEmail || '';
    }
  }, [customEmail, isOpen]);

  // Read value from ref before submit
  const syncRefToState = useCallback(() => {
    return customEmailRef.current?.value || customEmail || '';
  }, [customEmail]);

  const handleSendQRCode = useCallback(async () => {
    if (!student) {
      toast?.showError('Student information is required');
      return;
    }

    const targetEmail = useCustomEmail ? syncRefToState() : student.email;
    
    // Validate email
    if (!targetEmail) {
      toast?.showError('Email address is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      toast?.showError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      // ZERO FUNCTION EMAIL APPROACH - Send QR URL via email
      const { sendQRUrlEmail } = await import('@utils/qrCode');
      
      const result = await sendQRUrlEmail(
        targetEmail,
        student.displayName || student.realName || 'Student',
        student.id || student.docId,
        student.studentNumber,
        student.role || 'student'
      );
      
      if (result.success) {
        toast?.showSuccess(`QR code email sent successfully to ${targetEmail} 🎯`);
        toast?.showInfo(`Link: ${result.qrUrl}`, 5000);
        
        // Log activity
        try {
          const { logActivity } = await import('@services/other/activityLogger');
          const { ACTIVITY_LOG_TYPES } = await import('@services/other/activityLogger');
          await logActivity(ACTIVITY_LOG_TYPES.USER_UPDATED, {
            userId: student.docId || student.id,
            userEmail: student.email,
            targetEmail: targetEmail,
            action: 'qr_code_email_sent',
            qrUrl: result.qrUrl,
            useCustomEmail: useCustomEmail
          });
        } catch (e) {
          logger.error('Failed to log QR code email activity:', e);
        }
        
        onClose();
      } else {
        toast?.showError('Failed to send QR code email');
      }
    } catch (error) {
      logger.error('Error sending QR code email:', error);
      toast?.showError('Failed to send QR code email');
    } finally {
      setLoading(false);
    }
  }, [student, useCustomEmail, syncRefToState, toast, onClose]);

  const handleClose = useCallback(() => {
    if (!loading) {
      setUseCustomEmail(false);
      setCustomEmail('');
      onClose();
    }
  }, [loading, onClose]);

  const footer = (
    <>
      <Button 
        variant="outline" 
        onClick={handleClose}
        disabled={loading}
      >
        {t('cancel') || 'Cancel'}
      </Button>
      <Button 
        variant="primary" 
        onClick={handleSendQRCode} 
        loading={loading}
      >
        {t('send_qr_code') || 'Send QR Code'}
      </Button>
    </>
  );

  const studentName = student?.displayName || student?.realName || student?.email || 'Student';
  const defaultEmail = student?.email || '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('send_qr_code_email') || 'Send QR Code Email'}
      footer={footer}
      size="small"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      className="qr-email-modal"
      titleStyle={{ fontSize: '1rem', fontWeight: '600' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Student Information */}
        <div>
          <div style={{ 
            fontSize: '0.875rem', 
            fontWeight: '500', 
            marginBottom: '4px',
            color: 'var(--color-muted-foreground, #6b7280)'
          }}>
            {t('student') || 'Student'}:
          </div>
          <div style={{ 
            fontSize: '0.95rem', 
            fontWeight: '600',
            color: 'var(--color-foreground, #1f2937)'
          }}>
            {studentName}
          </div>
        </div>

        {/* Email Selection */}
        <div>
          <div style={{ 
            fontSize: '0.875rem', 
            fontWeight: '500', 
            marginBottom: '12px',
            color: 'var(--color-muted-foreground, #6b7280)'
          }}>
            {t('send_to_email') || 'Send to email'}:
          </div>
          
          {/* Default Email Option */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '16px',
            border: useCustomEmail ? '1px solid var(--color-border, #e5e7eb)' : '2px solid var(--color-primary, #3b82f6)',
            borderRadius: '8px',
            backgroundColor: useCustomEmail ? 'var(--color-muted, #f9fafb)' : 'var(--color-primary-background, #eff6ff)',
            cursor: 'pointer',
            marginBottom: '12px',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onClick={() => setUseCustomEmail(false)}
          >
            {/* Card selection indicator */}
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '2px solid var(--color-primary, #3b82f6)',
              backgroundColor: useCustomEmail ? 'transparent' : 'var(--color-primary, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {!useCustomEmail && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            
            <div style={{ flex: 1, paddingRight: '30px' }}>
              <div style={{ 
                fontSize: '0.9rem', 
                fontWeight: '500',
                color: 'var(--color-foreground, #1f2937)',
                marginBottom: '4px'
              }}>
                {t('default_email') || 'Default Email'}
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: 'var(--color-muted-foreground, #6b7280)',
                wordBreak: 'break-all'
              }}>
                {defaultEmail}
              </div>
            </div>
          </div>

          {/* Custom Email Option */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '16px',
            border: useCustomEmail ? '2px solid var(--color-primary, #3b82f6)' : '1px solid var(--color-border, #e5e7eb)',
            borderRadius: '8px',
            backgroundColor: useCustomEmail ? 'var(--color-primary-background, #eff6ff)' : 'var(--color-background, #ffffff)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onClick={() => setUseCustomEmail(true)}
          >
            {/* Card selection indicator */}
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '2px solid var(--color-primary, #3b82f6)',
              backgroundColor: useCustomEmail ? 'var(--color-primary, #3b82f6)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {useCustomEmail && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            
            <div style={{ flex: 1, paddingRight: '30px', width: '100%' }}>
              <div style={{ 
                fontSize: '0.9rem', 
                fontWeight: '500',
                color: 'var(--color-foreground, #1f2937)',
                marginBottom: '8px'
              }}>
                {t('custom_email') || 'Custom Email'}
              </div>
              <Input
                ref={customEmailRef}
                type="email"
                placeholder={t('enter_custom_email') || 'Enter custom email address'}
                defaultValue={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                disabled={!useCustomEmail}
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  fontSize: '0.875rem',
                  backgroundColor: useCustomEmail ? 'var(--color-background, #ffffff)' : 'var(--color-muted, #f9fafb)'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Hook for managing QR email modal state
 */
export const useQREmailModal = (t = (key) => key) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    student: null
  });

  const showQREmailModal = useCallback((student) => {
    setModalState({
      isOpen: true,
      student
    });
  }, []);

  const hideQREmailModal = useCallback(() => {
    setModalState({
      isOpen: false,
      student: null
    });
  }, []);

  return {
    isOpen: modalState.isOpen,
    student: modalState.student,
    showQREmailModal,
    hideQREmailModal
  };
};

export default QREmailModal;
