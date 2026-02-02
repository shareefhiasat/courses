import React, { useState, useEffect } from 'react';
import { Button } from '@ui';
import { Trash2 } from 'lucide-react';
import { UserIcon } from '@utils/icons.jsx';

export const HistoryEntry = ({ 
  log, 
  type, 
  icon, 
  iconColor, 
  onDelete, 
  t, 
  isRTL,
  showDeleteButton = true,
  borderColor = '#f1f5f9'
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
      gap: isMobile ? '0.25rem' : '0.5rem', 
      padding: '0.25rem 0',
      fontSize: '0.8125rem',
      borderBottom: 'none',
      marginBottom: '0.125rem'
    }}>
      <span style={{ 
        color: '#64748b', 
        minWidth: isMobile ? '60px' : '70px', 
        fontSize: isMobile ? '0.7rem' : '0.75rem' 
      }}>
        {log.time?.toDate 
          ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) 
          : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        }
      </span>
      
      {icon && (
        <div style={{ 
          width: isMobile ? '14px' : '16px', 
          height: isMobile ? '14px' : '16px', 
          color: iconColor, 
          [isRTL ? 'marginLeft' : 'marginRight']: isMobile ? '0.25rem' : '0.5rem',
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
        fontSize: isMobile ? '0.75rem' : '0.8125rem',
        flex: 1
      }}>
        {log.label}
      </span>
      
      {log.comment && (
        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
          {log.comment}
        </span>
      )}
      
      {log.points !== undefined && type !== 'attendance' && (
        <span style={{ 
          padding: '0.125rem 0.375rem',
          background: log.points > 0 ? '#eff6ff' : '#fff7ed',
          color: log.points > 0 ? '#1e40af' : '#c2410c',
          borderRadius: '0.25rem',
          fontSize: '0.75rem'
        }}>
          {log.points > 0 ? '+' : ''}{log.points}
        </span>
      )}
      
      {log.severity && (
        <span style={{ 
          padding: '0.125rem 0.375rem',
          background: '#fef2f2',
          color: '#b91c1c',
          borderRadius: '0.25rem',
          fontSize: '0.75rem'
        }}>
          {log.severity}
        </span>
      )}
      
      {/* User Attribution */}
      {log.performedBy && (
        <div style={{
          display: 'flex',
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
          <UserIcon style={{ width: '10px', height: '10px' }} />
          <span style={{ fontWeight: 500 }}>
            {log.performedBy.displayName || log.performedBy.email || 'Unknown'}
          </span>
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
          style={{ marginLeft: '0.5rem', color: '#ef4444' }}
          title={t(`delete_${type}_record`) || `Delete ${type} record`}
        >
          <Trash2 style={{ width: '14px', height: '14px' }} />
        </Button>
      )}
    </div>
  );
};

export default HistoryEntry;
