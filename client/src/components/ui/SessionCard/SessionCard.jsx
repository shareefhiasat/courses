/**
 * SessionCard Component
 * 
 * A reusable card component for displaying attendance session information
 * Used in HRAttendancePage and other attendance-related components
 */

import React from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useColorTheme } from '@contexts/ColorThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { createAttendanceBadge, getAttendanceStatusInfo } from '@constants/iconTypes';

const SessionCard = ({
  session,
  isSelected,
  onClick,
  theme,
  primaryColor,
  showInstructor = true,
  showDate = true,
  showStatus = true,
  showScanCounts = true,
  compact = false
}) => {
  const { theme: currentTheme } = useTheme();
  const actualTheme = theme || currentTheme;
  const actualPrimaryColor = primaryColor || '#800020';

  const createdAt = session.createdAt?.toDate ? session.createdAt.toDate() : new Date(session.createdAt || 0);

  return (
    <div
      onClick={onClick}
      style={{
        padding: compact ? '0.25rem 0.5rem' : '0.5rem 0.75rem',
        border: '1px solid var(--border)',
        borderRadius: 6,
        background: isSelected 
          ? (actualTheme === 'dark' ? `${actualPrimaryColor}25` : `${actualPrimaryColor}15`)
          : (actualTheme === 'dark' ? '#1f2937' : '#fff'),
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      {/* Session Title */}
      <div style={{ 
        fontWeight: 600, 
        fontSize: compact ? 11 : 13, 
        marginBottom: 4,
        color: actualTheme === 'dark' ? '#f9fafb' : '#111827'
      }}>
        {session.className || session.classId || 'General Session'}
      </div>

      {/* Attendance Summaries */}
      {showScanCounts && session.scanCounts && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.25rem', 
          marginBottom: '0.5rem',
          fontSize: 11
        }}>
          {createAttendanceBadge(
            session.scanCounts.present || session.scanCounts.PRESENT || 0,
            'check_circle',
            '#10b981',
            'Present',
            actualTheme
          )}
          {createAttendanceBadge(
            session.scanCounts.late || session.scanCounts.LATE || 0,
            'clock',
            '#f59e0b',
            'Late',
            actualTheme
          )}
          {createAttendanceBadge(
            (session.scanCounts.absent_no_excuse || session.scanCounts.absent || 0) + 
            (session.scanCounts.ABSENT_NO_EXCUSE || 0),
            'x_circle',
            '#ef4444',
            'Absent (No Excuse)',
            actualTheme
          )}
          {createAttendanceBadge(
            session.scanCounts.absent_with_excuse || session.scanCounts.ABSENT_WITH_EXCUSE || 0,
            'file_text',
            '#3b82f6',
            'Absent (Excused)',
            actualTheme
          )}
          {createAttendanceBadge(
            session.scanCounts.excused_leave || session.scanCounts.EXCUSED_LEAVE || 0,
            'home',
            '#8b5cf6',
            'Excused Leave',
            actualTheme
          )}
          {createAttendanceBadge(
            session.scanCounts.human_case || session.scanCounts.HUMAN_CASE || 0,
            'heart',
            '#ec4899',
            'Human Case',
            actualTheme
          )}
        </div>
      )}

      {/* Session Details */}
      <div style={{ 
        fontSize: 10, 
        color: 'var(--muted)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        flexWrap: 'wrap' 
      }}>
        {showInstructor && session.instructorName && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {getThemedIcon('ui', 'user', 12, actualTheme)}
            {session.instructorName}
          </span>
        )}
        
        {showDate && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {getThemedIcon('ui', 'calendar', 12, actualTheme)}
            {createdAt.toLocaleDateString('en-GB')} {createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        
        {showStatus && (
          <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4, 
            color: session.status === 'open' ? '#10b981' : '#6b7280', 
            fontWeight: 600 
          }}>
            <span style={{ 
              display: 'inline-block', 
              width: 6, 
              height: 6, 
              borderRadius: '50%', 
              background: session.status === 'open' ? '#10b981' : '#6b7280' 
            }}></span>
            {session.status === 'open' ? 'Active Session' : 'Ended'}
          </span>
        )}
        
        {showScanCounts && session.scanCounts && (
          <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4, 
            color: '#6b7280', 
            fontWeight: 600 
          }}>
            {getThemedIcon('ui', 'users', 12, actualTheme)}
            {session.scanCounts.total || 0} scans
          </span>
        )}
      </div>
    </div>
  );
};

export default SessionCard;
