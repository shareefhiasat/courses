import React from 'react';
import { useIsMobile } from '@hooks/useIsMobile';
import { Button, InfoTooltip, PerformedBy } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { getAttendanceMethodLabel, shouldShowMethodLabel } from '@constants';
import logger from '@utils/logger';
import PortalTooltip from '@ui/PortalTooltip';

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
  studentName
}) => {
  const isMobile = useIsMobile();

  // Handle invalid times
  const getTimeDisplay = () => {
    try {
      if (log.time?.toDate) {
        const date = log.time.toDate();
        
        if (isNaN(date.getTime())) {
          logger.log('🔧 HistoryEntry - invalid Firestore timestamp:', { time: log.time, logId: log.id });
          return '--:--';
        }
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return timeStr;
      } else if (log.time) {
        const date = new Date(log.time);
        
        if (isNaN(date.getTime())) {
          logger.log('🔧 HistoryEntry - invalid date string:', { time: log.time, logId: log.id });
          return '--:--';
        }
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return timeStr;
      }
      return '--:--';
    } catch (error) {
      return '--:--';
    }
  };

  const timeDisplay = getTimeDisplay();
  const isStandupEntry = type === RECORD_TYPES.ATTENDANCE && log.attendanceCategory === 'standup';

    return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: isMobile ? '0.125rem' : '0.5rem', 
      padding: isMobile ? '0.125rem 0' : '0.25rem 0',
      fontSize: isMobile ? '0.75rem' : '0.8125rem',
      borderBottom: 'none',
      marginBottom: isMobile ? '0.0625rem' : '0.125rem'
    }}>
      <span style={{ 
        color: 'var(--text-muted, #64748b)', 
        minWidth: isMobile ? '50px' : '70px', 
        fontSize: isMobile ? '0.65rem' : '0.75rem' 
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
        color: 'var(--text-secondary, #374151)', 
        fontWeight: 500,
        fontSize: isMobile ? '0.7rem' : '0.8125rem',
        flex: 1
      }}>
        {log.label}
        {studentName && (
          <span style={{ 
            color: 'var(--text-muted, #6b7280)', 
            fontWeight: 400,
            fontSize: isMobile ? '0.6rem' : '0.7rem',
            marginLeft: '0.5rem'
          }}>
            {studentName.displayName || studentName.name || studentName}
            {studentName.email && studentName.displayName && (
              <span style={{ color: 'var(--text-secondary, #374151)', fontWeight: 500 }}>
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
                background: 'var(--panel-hover, #f3f4f6)',
                borderRadius: '0.25rem',
                fontSize: '0.625rem'
              }}>
                {getThemedIcon('ui', 'user', 10, 'var(--text-muted, #6b7280)')}
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
        
        if (type === RECORD_TYPES.ATTENDANCE && log.method) {
          if (shouldShowMethodLabel(log.method, log.comment)) {
            // Use localized method label instead of notes
            displayComment = getAttendanceMethodLabel(log.method, t, lang);
            showTooltip = log.comment && log.comment !== displayComment; // Show tooltip if original notes were different
          } else {
            // Use original notes
            displayComment = log.comment;
            showTooltip = log.comment && log.comment.length > 30;
          }
        } else if (log.comment) {
          showTooltip = log.comment.length > 30;
        }

        return displayComment && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ color: '#64748b', fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
              {displayComment}
            </span>
            {showTooltip && (
              <InfoTooltip>
                <div style={{ 
                  maxWidth: '300px', 
                  padding: '0.5rem',
                  fontSize: '0.75rem',
                  lineHeight: '1.4'
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    {log.comment}
                  </div>
                  {type === RECORD_TYPES.ATTENDANCE && log.method && shouldShowMethodLabel(log.method, log.comment) && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      paddingTop: '0.5rem', 
                      borderTop: '1px solid #e5e7eb',
                      fontSize: '0.625rem',
                      color: '#6b7280'
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
          padding: isMobile ? '0.0625rem 0.25rem' : '0.125rem 0.375rem',
          background: log.points > 0 ? 'var(--color-info-light, #eff6ff)' : 'var(--color-warning-light, #fff7ed)',
          color: log.points > 0 ? 'var(--color-info-dark, #1e40af)' : 'var(--color-warning-dark, #c2410c)',
          borderRadius: '0.25rem',
          fontSize: isMobile ? '0.7rem' : '0.75rem'
        }}>
          {log.points > 0 ? '+' : ''}{log.points}
        </span>
      )}
      
      {log.severity && (
        <span style={{ 
          padding: isMobile ? '0.0625rem 0.25rem' : '0.125rem 0.375rem',
          background: 'var(--color-danger-light, #fef2f2)',
          color: 'var(--color-danger-dark, #b91c1c)',
          borderRadius: '0.25rem',
          fontSize: isMobile ? '0.7rem' : '0.75rem'
        }}>
          {log.severity}
        </span>
      )}
      
      {/* User Attribution */}
      {log.performedBy && (
        <div style={{
          display: isMobile ? 'none' : 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          [isRTL ? 'marginRight' : 'marginLeft']: 'auto',
          padding: '0.125rem 0.5rem',
          background: 'var(--color-info-light, #f0f9ff)',
          border: '1px solid var(--color-info-border, #bae6fd)',
          borderRadius: '1rem',
          fontSize: '0.625rem',
          color: 'var(--color-info-dark, #0369a1)'
        }}>
          <PerformedBy 
            performedByName={log.performedByName}
            performedBy={log.performedBy}
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
        <PortalTooltip content={t('delete_record').replace('{type}', type)} position="top">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(log.id);
          }}
          style={{ 
            marginLeft: isMobile ? '0.25rem' : '0.5rem', 
            color: 'var(--color-danger, #ef4444)',
            padding: isMobile ? '0.125rem' : '0.25rem'
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
