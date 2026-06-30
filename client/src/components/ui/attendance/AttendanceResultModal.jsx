/**
 * Attendance Result Modal Component
 * 
 * PURPOSE: Displays attendance operation results with appropriate styling
 * Used to reduce complexity in QRScanner component
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { getAttendanceIcon, getAttendanceColor, getLocalizedAttendanceLabel } from '@constants/attendanceTypes';
import { getThemedIcon } from '@constants/iconTypes';
import { useLang } from '@contexts/LangContext';

const AttendanceResultModal = ({ 
  isOpen, 
  onClose, 
  type, 
  message, 
  isSummary = false,
  attendanceStatus = null 
}) => {
  const { lang, t } = useLang();
  if (!isOpen) return null;

  let iconColor = '#6b7280';
  let iconName = 'CheckCircle';
  
  if (attendanceStatus) {
    iconColor = getAttendanceColor(attendanceStatus);
    iconName = getAttendanceIcon(attendanceStatus);
  } else if (type) {
    if (type === 'success') { iconColor = '#16a34a'; iconName = 'CheckCircle'; }
    else if (type === 'error') { iconColor = '#dc2626'; iconName = 'XCircle'; }
    else if (type === 'info') { iconColor = '#3b82f6'; iconName = 'Info'; }
  }

  const displayMessage = isSummary 
    ? (typeof message === 'object' ? JSON.stringify(message) : message)
    : message;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        cursor: 'pointer'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          cursor: 'default'
        }}
      >
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}>
          {getThemedIcon('ui', iconName.toLowerCase(), 30, 'white')}
        </div>

        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 0.5rem 0'
        }}>
          {attendanceStatus ? getLocalizedAttendanceLabel(attendanceStatus, lang) : 
            (type === 'success' ? (t('success') || 'Success') : type === 'error' ? (t('error') || 'Error') : type === 'info' ? (t('info') || 'Info') : (t('information') || 'Information'))}
        </h3>

        <p style={{
          fontSize: 'var(--font-size-md)',
          color: '#6b7280',
          margin: '0 0 1.5rem 0',
          lineHeight: '1.5'
        }}>
          {displayMessage}
        </p>

        <button
          onClick={onClose}
          style={{
            background: iconColor,
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontSize: 'var(--font-size-md)',
            fontWeight: '500',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          {t('ok') || 'OK'}
        </button>
      </div>
    </div>,
    document.body
  );
};

export default AttendanceResultModal;
