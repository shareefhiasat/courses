import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';

const STATUS_COLORS = {
  taken: { bg: '#22c55e', label: 'Attendance Taken' },
  submitted: { bg: '#3b82f6', label: 'Daily Official Submitted' },
  not_taken: { bg: '#94a3b8', label: 'Not Taken' },
};

const ClassCell = ({ session, status, onClick }) => {
  const { lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!session) {
    return (
      <div
        style={{
          minHeight: '80px',
          borderRadius: '8px',
          border: `1px dashed ${isDark ? '#334155' : '#e2e8f0'}`,
          background: 'transparent',
        }}
      />
    );
  }

  const cls = session.class;
  const subject = cls?.subject;
  const classroom = session.classroom;

  const statusKey = status?.workflowStatus === 'SUBMITTED' || status?.workflowStatus === 'UNDER_ADMIN_REVIEW' || status?.workflowStatus === 'UNDER_HR_REVIEW'
    ? 'submitted'
    : status?.hasAttendance
      ? 'taken'
      : 'not_taken';

  const statusColor = STATUS_COLORS[statusKey];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '10px',
        borderRadius: '8px',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        background: isDark ? '#1e293b' : '#ffffff',
        cursor: 'pointer',
        minHeight: '80px',
        textAlign: lang === 'ar' ? 'right' : 'left',
        position: 'relative',
        transition: 'all 0.15s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: statusColor.bg,
          flexShrink: 0,
        }}
        title={statusColor.label}
      />

      <div style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b', lineHeight: 1.2 }}>
        {lang === 'ar' && cls?.nameAr ? cls.nameAr : cls?.nameEn || cls?.code}
      </div>
      <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
        {lang === 'ar' && subject?.nameAr ? subject.nameAr : subject?.nameEn || ''}
      </div>
      {classroom && (
        <div style={{ fontSize: '10px', color: isDark ? '#64748b' : '#94a3b8' }}>
          {lang === 'ar' && classroom.nameAr ? classroom.nameAr : classroom.nameEn || classroom.code}
        </div>
      )}
    </button>
  );
};

export default ClassCell;
