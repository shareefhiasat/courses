import React, { useState, useEffect, useMemo, useCallback } from 'react';
import logger from '@utils/logger';
import { Button, Input } from '@ui';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { ATTENDANCE_STATUS_LABELS } from '@constants/attendanceTypes';
import { getAvatarColor } from '@utils/avatarUtils';
import { BEHAVIOR_TYPES, getBehaviorIcon, getBehaviorColor } from '@constants/behaviorTypes';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';

export default function StudentActionPanel({
  student,
  onClose,
  onBehaviorSubmit,
  onMarkAttendance,
  onUpdate
}) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t, lang, isRTL } = useLang();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [note, setNote] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const attendanceStatus = useMemo(() => {
    const status = student?.attendance;
    
    if (status && status !== 'absent_no_excuse') {
      const statusInfo = ATTENDANCE_STATUS_LABELS[status];
      if (statusInfo) {
        return statusInfo;
      }
    }
    
    return {
      en: t('none') || 'None',
      ar: t('none') || 'لا شيء',
      color: '#9ca3af'
    };
  }, [student?.attendance, t]);

  const avatarColor = useMemo(() => getAvatarColor(student?.name || ''), [student?.name]);

  const getInitials = useCallback((name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const handleBehaviorSelect = useCallback((behavior) => {
    setSelectedBehavior(behavior);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedBehavior) {
      showError(t('please_select_behavior'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onBehaviorSubmit(student.docId || student.id, [selectedBehavior], note);
      showSuccess(t('behavior_recorded_successfully'));
      setSelectedBehavior(null);
      setNote('');
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      logger.error('Error submitting behavior:', error);
      showError(t('failed_to_record_behavior'));
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedBehavior, note, student, onBehaviorSubmit, onUpdate, onClose, t, showSuccess, showError]);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1999
        }}
        onClick={onClose}
      />
      <div dir={isRTL ? 'rtl' : 'ltr'} style={{
        position: 'fixed',
        top: 0,
        [isRTL ? 'left' : 'right']: 0,
        width: isMobile ? '100%' : '100%',
        maxWidth: isMobile ? '100%' : '28rem',
        height: '100%',
        background: 'white',
        boxShadow: isRTL ? '4px 0 24px rgba(0,0,0,0.1)' : '-4px 0 24px rgba(0,0,0,0.1)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 500,
                background: avatarColor.bg,
                color: avatarColor.color
              }}>
                {getInitials(student.displayName || student.realName || student.name || '')}
              </div>
              <div>
                <h3 style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: '0.875rem' }}>
                  {student.displayName || student.realName || student.name || student.email || t('unknown_student')}
                </h3>
                {attendanceStatus && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <span style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      background: attendanceStatus.color,
                      borderRadius: '9999px'
                    }} />
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {lang === 'ar' ? (attendanceStatus.ar || attendanceStatus.en) : attendanceStatus.en}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              {getThemedIcon('ui', 'close', 20, theme)}
            </Button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#6b7280',
              marginBottom: '0.75rem'
            }}>
              {t('select_behavior')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {BEHAVIOR_TYPES.map((behavior) => (
                <div
                  key={behavior.id}
                  onClick={() => handleBehaviorSelect(behavior)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: `2px solid ${selectedBehavior?.id === behavior.id ? getBehaviorColor(behavior.id) : '#e5e7eb'}`,
                    background: selectedBehavior?.id === behavior.id ? `${getBehaviorColor(behavior.id)}10` : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '0.375rem',
                      background: `${getBehaviorColor(behavior.id)}20`,
                      color: getBehaviorColor(behavior.id),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getThemedIcon('ui', getBehaviorIcon(behavior.id), 16, theme)}
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#111827'
                    }}>
                      {lang === 'ar' ? (behavior.label_ar || behavior.label_en) : behavior.label_en}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#6b7280',
              marginBottom: '0.75rem'
            }}>
              {t('note')}
            </h4>
            <Input
              type="text"
              placeholder={t('add_note')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              onClick={handleSubmit}
              disabled={!selectedBehavior || isSubmitting}
              style={{ flex: 1 }}
            >
              {isSubmitting ? t('saving') : t('save')}
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
