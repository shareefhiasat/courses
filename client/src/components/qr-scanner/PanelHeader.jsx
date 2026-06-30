import React from 'react';
import { CircleIcon } from "@utils/icons.jsx";
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_COLORS } from '@constants/attendanceTypes';

export default function PanelHeader({ student, attendanceStatus, t, lang, isRTL, theme = 'light' }) {
  console.log('🔍 PanelHeader - Props:', {
    student,
    attendanceStatus,
    lang,
    isRTL
  });

  const avatarColor = getAvatarColor(student?.name || '');
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      <div style={{
        width: '3.5rem',
        height: '3.5rem',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.125rem',
        fontWeight: 500,
        background: avatarColor.bg,
        color: avatarColor.color,
        flexShrink: 0
      }}>
        {getInitials(student.displayName || student.realName || student.name || '')}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <h3 style={{ fontWeight: 600, color: theme === 'dark' ? '#ffffff' : 'var(--text, #111827)', margin: 0, fontSize: '1.0625rem' }}>
            {student.displayName || student.realName || student.name || student.email || t('unknown_student')}
          </h3>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted, #6b7280)',
            fontFamily: 'monospace',
            background: 'var(--panel-hover, #f3f4f6)',
            padding: '0.0625rem 0.375rem',
            borderRadius: '0.25rem'
          }}>
            #{student.studentNumber || student.id}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {attendanceStatus && attendanceStatus.en !== 'None' ? (
              <>
                <span style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  background: attendanceStatus.color,
                  borderRadius: '9999px'
                }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #6b7280)' }}>
                  {lang === 'ar' ? (attendanceStatus.ar || attendanceStatus.en) : attendanceStatus.en}
                </span>
              </>
            ) : (
              <>
                <CircleIcon style={{ width: '14px', height: '14px', stroke: 'var(--text-muted, #9ca3af)' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #9ca3af)' }}>
                  {t('none') || 'None'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
