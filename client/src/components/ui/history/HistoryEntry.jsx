import React, { useState, useEffect } from 'react';
import { Button, InfoTooltip, PerformedBy } from '@ui';
import { Trash2 } from 'lucide-react';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { getAttendanceMethodLabel, shouldShowMethodLabel } from '@constants';

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
  lang = 'en'
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        color: '#64748b', 
        minWidth: isMobile ? '50px' : '70px', 
        fontSize: isMobile ? '0.65rem' : '0.75rem' 
      }}>
        {log.time?.toDate 
          ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) 
          : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        }
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
      
      <span style={{ 
        color: '#374151', 
        fontWeight: 500,
        fontSize: isMobile ? '0.7rem' : '0.8125rem',
        flex: 1
      }}>
        {log.label}
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
              {displayComment.length > 30 && !showTooltip ? `${displayComment.substring(0, 30)}...` : displayComment}
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
          background: log.points > 0 ? '#eff6ff' : '#fff7ed',
          color: log.points > 0 ? '#1e40af' : '#c2410c',
          borderRadius: '0.25rem',
          fontSize: isMobile ? '0.7rem' : '0.75rem'
        }}>
          {log.points > 0 ? '+' : ''}{log.points}
        </span>
      )}
      
      {log.severity && (
        <span style={{ 
          padding: isMobile ? '0.0625rem 0.25rem' : '0.125rem 0.375rem',
          background: '#fef2f2',
          color: '#b91c1c',
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
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '1rem',
          fontSize: '0.625rem',
          color: '#0369a1'
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
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(log.id);
          }}
          style={{ 
            marginLeft: isMobile ? '0.25rem' : '0.5rem', 
            color: '#ef4444',
            padding: isMobile ? '0.125rem' : '0.25rem'
          }}
          title={t(`delete_${type}_record`) || `Delete ${type} record`}
        >
          <Trash2 style={{ width: isMobile ? '12px' : '14px', height: isMobile ? '12px' : '14px' }} />
        </Button>
      )}
    </div>
  );
};

export default HistoryEntry;
