/**
 * Attendance Result Modal Component
 * 
 * PURPOSE: Displays attendance operation results with appropriate styling
 * Used to reduce complexity in QRScanner component
 */

import React from 'react';
import { Modal } from '@ui';
import { getAttendanceIcon, getAttendanceColor } from '@constants/attendanceTypes';
import { getThemedIcon } from '@constants/iconTypes';

const AttendanceResultModal = ({ 
  isOpen, 
  onClose, 
  type, 
  message, 
  isSummary = false,
  attendanceStatus = null 
}) => {
  // If attendance status is provided, use its color and icon
  let finalType = type;
  let finalMessage = message;
  let iconColor = '#6b7280'; // Default gray
  let iconName = 'CheckCircle';
  
  // Always prioritize attendance status for colors and icons
  if (attendanceStatus) {
    iconColor = getAttendanceColor(attendanceStatus);
    iconName = getAttendanceIcon(attendanceStatus);
  } else if (type) {
    // Fallback to type-based colors for backward compatibility
    iconColor = getAttendanceColor(type);
    iconName = getAttendanceIcon(type);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSummary ? 'Attendance Summary' : 'Attendance Result'}
      size="small"
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div style={{ 
        padding: '1rem 0',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: `${iconColor}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {getThemedIcon('ui', iconName.toLowerCase(), 24, iconColor)}
          </div>
        </div>
        
        <p style={{ 
          fontSize: '1rem', 
          lineHeight: 1.5,
          color: 'var(--text, #111827)',
          margin: '0 0 1rem 0',
          fontWeight: '500'
        }}>
          {finalMessage}
        </p>
        
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: iconColor,
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          OK
        </button>
      </div>
    </Modal>
  );
};

export default AttendanceResultModal;
