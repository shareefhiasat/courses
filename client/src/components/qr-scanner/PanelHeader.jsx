import React from 'react';
import { CircleIcon } from "@utils/icons.jsx";
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_COLORS } from '@constants/attendanceTypes';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { getUserRoleFromObject } from '@utils/userUtils';

export default function PanelHeader({ student, attendanceStatus, t, lang, isRTL, theme = 'light' }) {
  console.log('🔍 PanelHeader - Props:', {
    student,
    attendanceStatus,
    lang,
    isRTL
  });

  const displayName = getLocalizedUserName(student, lang, t('unknown_student'));
  const avatarColor = getAvatarColor(displayName || '');
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
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--font-size-lg)',
          fontWeight: 500,
          background: avatarColor.bg,
          color: avatarColor.color,
          flexShrink: 0,
          overflow: 'hidden'
        }}>
          {student.profileImageUrl ? (
            <img
              src={student.profileImageUrl}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            getInitials(displayName)
          )}
        </div>
        {/* Role badge overlay */}
        {(() => {
          const role = getUserRoleFromObject(student);
          if (!role) return null;
          const roleIcon = getUserRoleIcon(role);
          const roleColor = getUserRoleColor(role);
          if (!roleIcon) return null;
          return (
            <div style={{
              position: 'absolute',
              bottom: '-2px',
              insetInlineEnd: '-2px',
              width: '1.25rem',
              height: '1.25rem',
              borderRadius: '9999px',
              background: 'var(--panel, white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid var(--panel, white)',
              boxShadow: '0 0 0 1px var(--border, #e5e7eb)',
            }}
              title={t(`roles.${role}`, role)}
            >
              {React.cloneElement(roleIcon, { color: roleColor, size: 12 })}
            </div>
          );
        })()}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <h3 style={{ fontWeight: 600, color: theme === 'dark' ? '#ffffff' : 'var(--text, #111827)', margin: 0, fontSize: '1.0625rem' }}>
            {displayName}
          </h3>
          <span style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-muted, #6b7280)',
            fontFamily: 'var(--font-family-mono)',
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
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted, #6b7280)' }}>
                  {lang === 'ar' ? (attendanceStatus.ar || attendanceStatus.en) : attendanceStatus.en}
                </span>
              </>
            ) : (
              <>
                <CircleIcon style={{ width: '14px', height: '14px', stroke: 'var(--text-muted, #9ca3af)' }} />
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted, #9ca3af)' }}>
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
