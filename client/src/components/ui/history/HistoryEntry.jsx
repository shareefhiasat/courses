import React from 'react';
import { useIsMobile } from '@hooks/useIsMobile';
import { Button, InfoTooltip, PerformedBy } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';
import { getAttendanceMethodLabel, shouldShowMethodLabel } from '@constants';
import { getLocalizedNoteText } from '@constants/noteTypes';
import { info, error, warn, debug } from '@services/utils/logger.js';
import PortalTooltip from '@ui/PortalTooltip';

const getEntryPalette = (theme) => {
  if (theme === 'dark') {
    return {
      surface: 'linear-gradient(120deg, rgba(15,23,42,0.92), rgba(30,41,59,0.9))',
      border: 'rgba(148,163,184,0.2)',
      divider: 'rgba(51,65,85,0.65)',
      shadow: '0 20px 30px rgba(2,6,23,0.6)',
      time: '#94a3b8',
      primary: '#f1f5f9',
      muted: '#9ca3af',
      chipBg: 'rgba(148,163,184,0.12)',
      chipText: '#cbd5f5',
      bubble: 'rgba(30,41,59,0.75)',
      bubbleBorder: 'rgba(148,163,184,0.25)'
    };
  }

  return {
    surface: '#ffffff',
    border: 'var(--border, #e5e7eb)',
    divider: 'var(--border-light, #f1f5f9)',
    shadow: '0 6px 18px rgba(15,23,42,0.08)',
    time: 'var(--text-muted, #6b7280)',
    primary: 'var(--text-secondary, #374151)',
    muted: 'var(--text-muted, #6b7280)',
    chipBg: 'var(--panel-hover, #f3f4f6)',
    chipText: 'var(--text-secondary, #374151)',
    bubble: '#f8fafc',
    bubbleBorder: 'var(--border, #e5e7eb)'
  };
};

export const HistoryEntry = ({
  log,
  type,
  icon,
  iconColor,
  onDelete,
  t,
  isRTL,
  showDeleteButton = true,
  borderColor = '#f1f5f9',
  lang = 'en',
  studentName,
  theme = 'light'
}) => {
  const isMobile = useIsMobile();
  const palette = getEntryPalette(theme);

  // Handle invalid times - display in local timezone without forcing Qatar timezone
  const getTimeDisplay = () => {
    try {
      const raw = log.time?.toDate ? log.time.toDate() : log.time ? new Date(log.time) : null;
      if (!raw || isNaN(raw.getTime())) return '--:--';
      
      // Check if the timestamp has time information (not just date)
      const hours = raw.getHours();
      const minutes = raw.getMinutes();
      const seconds = raw.getSeconds();
      
      // If all time components are 0, it's likely a date-only timestamp
      // In this case, don't display a time
      if (hours === 0 && minutes === 0 && seconds === 0) {
        return '--:--';
      }
      
      // Otherwise, display the time in local timezone
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(raw);
    } catch (e) {
      return '--:--';
    }
  };

  const timeDisplay = getTimeDisplay();
  const isStandupEntry = type === RECORD_TYPES.ATTENDANCE && (typeof log.status === 'string' && log.status?.startsWith('standup_'));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? '0.35rem' : '0.65rem',
        padding: isMobile ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
        fontSize: isMobile ? '0.75rem' : '0.8125rem',
        border: `1px solid ${palette.border}`,
        borderRadius: '0.85rem',
        background: palette.surface,
        boxShadow: palette.shadow,
        marginBottom: isMobile ? '0.25rem' : '0.35rem',
        width: '100%',
        transition: 'border 0.2s ease, transform 0.2s ease'
      }}
    >
      <span
        style={{
          width: '4px',
          borderRadius: '999px',
          alignSelf: 'stretch',
          background: iconColor || 'var(--color-info, #3b82f6)',
          opacity: 0.85
        }}
      />
      <span style={{
        color: palette.time,
        minWidth: isMobile ? '48px' : '70px',
        fontSize: isMobile ? '0.65rem' : '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.04em'
      }}>
        {timeDisplay}
      </span>

      {icon && (
        <div style={{
          width: isMobile ? '12px' : '16px',
          height: isMobile ? '12px' : '16px',
          color: iconColor,
          [isRTL ? 'marginLeft' : 'marginRight']: isMobile ? '0.125rem' : '0.5rem',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0
        }}>
          {icon}
        </div>
      )}

      {isStandupEntry && (
        <PortalTooltip content={t('standup_attendance') || 'Standup Attendance'} position="top">
          <span style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            fontSize: isMobile ? '0.5rem' : '0.625rem',
            fontWeight: 600,
            padding: '0.125rem 0.375rem',
            borderRadius: '0.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.025em',
            flexShrink: 0
          }}>
            {t('standup') || 'Standup'}
          </span>
        </PortalTooltip>
      )}

      <span style={{
        color: palette.primary,
        fontWeight: 600,
        fontSize: isMobile ? '0.72rem' : '0.82rem',
        flex: 1
      }}>
        {log.label}
        {studentName && (
          <span style={{
            color: palette.muted,
            fontWeight: 400,
            fontSize: isMobile ? '0.6rem' : '0.7rem',
            marginLeft: '0.5rem'
          }}>
            {studentName.displayName || studentName.name || studentName}
            {studentName.email && studentName.displayName && (
              <span style={{ color: palette.primary, fontWeight: 500 }}>
                ({studentName.email})
              </span>
            )}
            {studentName.studentNumber && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.125rem',
                marginLeft: '0.25rem',
                padding: '0.125rem 0.25rem',
                background: palette.chipBg,
                borderRadius: '0.25rem',
                fontSize: '0.625rem'
              }}>
                {getThemedIcon('ui', 'user', 10, theme === 'dark' ? '#9ca3af' : 'var(--text-muted, #6b7280)')}
                {studentName.studentNumber}
              </span>
            )}
          </span>
        )}
      </span>
      
      {(() => {
        // For attendance records, check if we should show method label instead of notes
        let displayComment = log.comment;
        let showTooltip = false;
        
        // Translate note constants if present
        if (log.comment && /^[A-Z_]+$/.test(log.comment)) {
          displayComment = getLocalizedNoteText(log.comment, t) || log.comment;
        }
        
        if (type === RECORD_TYPES.ATTENDANCE && log.method) {
          if (shouldShowMethodLabel(log.method, log.comment)) {
            // Use localized method label instead of notes
            displayComment = getAttendanceMethodLabel(log.method, t, lang);
            showTooltip = log.comment && log.comment !== displayComment; // Show tooltip if original notes were different
          } else {
            // Use original notes (already translated above if it's a constant)
            displayComment = log.comment && /^[A-Z_]+$/.test(log.comment) 
              ? getLocalizedNoteText(log.comment, t) || log.comment 
              : log.comment;
            showTooltip = log.comment && log.comment.length > 30;
          }
        } else if (log.comment) {
          showTooltip = log.comment.length > 30;
        }

        return displayComment && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{
              color: palette.muted,
              fontSize: isMobile ? '0.68rem' : '0.75rem',
              background: palette.bubble,
              border: `1px solid ${palette.bubbleBorder}`,
              padding: '0.15rem 0.45rem',
              borderRadius: '0.5rem'
            }}>
              {displayComment}
            </span>
            {showTooltip && (
              <InfoTooltip>
                <div style={{
                  maxWidth: '300px',
                  padding: '0.5rem',
                  fontSize: 'var(--font-size-xs)',
                  lineHeight: '1.4'
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    {log.comment}
                  </div>
                  {type === RECORD_TYPES.ATTENDANCE && log.method && shouldShowMethodLabel(log.method, log.comment) && (
                    <div style={{
                      marginTop: '0.5rem',
                      paddingTop: '0.5rem',
                      borderTop: `1px solid ${palette.border}`,
                      fontSize: '0.625rem',
                      color: palette.muted
                    }}>
                      <strong>Method:</strong> {getAttendanceMethodLabel(log.method, t, lang)}
                    </div>
                  )}
                </div>
              </InfoTooltip>
            )}
          </div>
        );
      })()}
      
      {log.points !== undefined && type !== RECORD_TYPES.ATTENDANCE && (
        <span style={{
          padding: isMobile ? '0.1rem 0.35rem' : '0.15rem 0.45rem',
          background: log.points > 0
            ? (theme === 'dark' ? 'rgba(37,99,235,0.18)' : 'var(--color-info-light, #eff6ff)')
            : (theme === 'dark' ? 'rgba(251,146,60,0.2)' : 'var(--color-warning-light, #fff7ed)'),
          color: log.points > 0
            ? (theme === 'dark' ? '#93c5fd' : 'var(--color-info-dark, #1e40af)')
            : (theme === 'dark' ? '#fdba74' : 'var(--color-warning-dark, #c2410c)'),
          borderRadius: '0.35rem',
          fontSize: isMobile ? '0.68rem' : '0.75rem',
          fontWeight: 600
        }}>
          {log.points > 0 ? '+' : ''}{log.points}
        </span>
      )}

      {log.severity && (
        <span style={{
          padding: isMobile ? '0.1rem 0.35rem' : '0.15rem 0.45rem',
          background: theme === 'dark' ? 'rgba(239,68,68,0.18)' : 'var(--color-danger-light, #fef2f2)',
          color: theme === 'dark' ? '#fca5a5' : 'var(--color-danger-dark, #b91c1c)',
          borderRadius: '0.35rem',
          fontSize: isMobile ? '0.68rem' : '0.75rem',
          fontWeight: 600
        }}>
          {log.severity}
        </span>
      )}

      {/* User Attribution */}
      {log.performedBy && (
        <div style={{
          display: isMobile ? 'none' : 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          [isRTL ? 'marginRight' : 'marginLeft']: 'auto',
          padding: '0.15rem 0.75rem',
          background: theme === 'dark' ? 'rgba(37,99,235,0.16)' : 'var(--color-info-light, #f0f9ff)',
          border: theme === 'dark' ? '1px solid rgba(59,130,246,0.4)' : '1px solid var(--color-info-border, #bae6fd)',
          borderRadius: '999px',
          fontSize: '0.65rem',
          color: theme === 'dark' ? '#bfdbfe' : 'var(--color-info-dark, #0369a1)'
        }}>
          <PerformedBy 
            performedByName={log.performedByName}
            performedBy={log.performedBy}
            user={log.creator}
            lang={lang}
            containerStyle={{ marginBottom: 0 }}
            style={{ 
              background: 'transparent',
              padding: 0,
              fontSize: '0.625rem',
              border: 'none'
            }}
            iconStyle={{ width: '10px', height: '10px' }}
            textStyle={{ fontWeight: 500 }}
          />
        </div>
      )}
      
      {showDeleteButton && onDelete && (
        <PortalTooltip content={(t('delete_record') || '{type}').replace('{type}', type)} position="top">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(log.id);
          }}
          style={{ 
            marginLeft: isMobile ? '0.25rem' : '0.5rem', 
            color: theme === 'dark' ? '#fca5a5' : 'var(--color-danger, #ef4444)',
            padding: isMobile ? '0.125rem' : '0.25rem',
            borderRadius: '0.5rem',
            background: theme === 'dark' ? 'rgba(239,68,68,0.08)' : 'transparent'
          }}
        >
          {getThemedIcon('ui', 'trash2', isMobile ? 12 : 14)}
        </Button>
        </PortalTooltip>
      )}
    </div>
  );
};

export default HistoryEntry;
