import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import LectureLogDrawer from '@components/workspace/LectureLogDrawer';

const ClassActionModal = ({ session, status, selectedDate, onClose }) => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);

  if (!session) return null;

  const cls = session.class;
  const dateForAction = selectedDate || new Date();
  const dateStr = dateForAction.toISOString().split('T')[0];
  const isSubmitted = ['SUBMITTED', 'UNDER_ADMIN_REVIEW', 'UNDER_HR_REVIEW', 'APPROVED', 'ADMIN_APPROVED'].includes(status?.workflowStatus);

  const handleTakeAttendance = () => {
    const params = new URLSearchParams({
      classId: cls.id,
      classCode: cls.code || '',
      date: dateStr,
    });
    navigate(`/qr-scanner?${params.toString()}`);
    onClose();
  };

  const handleLookupPrevious = () => {
    setLogDrawerOpen(true);
  };

  const handleSubmitDocument = () => {
    if (isSubmitted) return;
    // Phase 2: split preview + submit panel
    onClose();
  };

  const cardStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '32px 24px',
    borderRadius: '16px',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    background: isDark ? '#1e293b' : '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flex: '1 1 200px',
    maxWidth: '280px',
  };

  const submitCardStyle = {
    ...cardStyle,
    opacity: isSubmitted ? 0.5 : 1,
    cursor: isSubmitted ? 'not-allowed' : 'pointer',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? '#0f172a' : '#f8fafc',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '720px',
          width: '100%',
          dir: lang === 'ar' ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: isDark ? '#f1f5f9' : '#1e293b' }}>
            {lang === 'ar' && cls?.nameAr ? cls.nameAr : cls?.nameEn || cls?.code}
          </h2>
          <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', margin: '4px 0 0' }}>
            {cls?.subject && (lang === 'ar' ? cls.subject.nameAr : cls.subject.nameEn)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={cardStyle} onClick={handleTakeAttendance} role="button" tabIndex={0}>
            <div style={{ fontSize: '40px' }}>✅</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>
              {t('workspace_take_attendance') || 'Take Attendance'}
            </div>
            <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>
              {lang === 'ar' ? 'افتح ماسح QR مع تعبئة تلقائية' : 'Open QR Scanner with auto-fill'}
            </div>
          </div>

          <div style={cardStyle} onClick={handleLookupPrevious} role="button" tabIndex={0}>
            <div style={{ fontSize: '40px' }}>📋</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>
              {t('workspace_lookup_previous') || 'Lookup Previous'}
            </div>
            <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>
              {lang === 'ar' ? 'عرض سجل الحضور السابق' : 'View previous attendance records'}
            </div>
          </div>

          <div
            style={submitCardStyle}
            onClick={handleSubmitDocument}
            role="button"
            tabIndex={0}
            aria-disabled={isSubmitted}
          >
            <div style={{ fontSize: '40px' }}>📤</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>
              {t('workspace_submit_document') || 'Submit Document'}
            </div>
            <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>
              {isSubmitted
                ? (lang === 'ar' ? 'تم الإرسال مسبقاً' : 'Already submitted')
                : (lang === 'ar' ? 'إنشاء تقرير وإرسال للموافقة' : 'Generate report and submit for approval')}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              background: 'transparent',
              color: isDark ? '#94a3b8' : '#64748b',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {t('close') || 'Close'}
          </button>
        </div>
      </div>

      <LectureLogDrawer
        isOpen={logDrawerOpen}
        onClose={() => setLogDrawerOpen(false)}
        classInfo={cls}
        date={dateForAction}
      />
    </div>
  );
};

export default ClassActionModal;
