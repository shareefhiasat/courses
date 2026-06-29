import React from 'react';

const ManualInputForm = ({
  showManualInput,
  manualStudentId,
  setManualStudentId,
  onSubmit,
  onClose,
  isMobile,
  t
}) => {
  if (!showManualInput) return null;

  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '0' : '50%',
      left: isMobile ? '0' : '50%',
      transform: isMobile ? 'none' : 'translate(-50%, -50%)',
      background: 'white',
      borderRadius: isMobile ? '0' : '0.5rem',
      padding: isMobile ? '1rem' : '1.5rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      zIndex: 1003,
      width: isMobile ? '100vw' : '400px',
      maxWidth: isMobile ? '100vw' : '400px',
      minWidth: isMobile ? '100vw' : '350px',
      height: isMobile ? '100vh' : 'auto',
      maxHeight: isMobile ? '100vh' : '80vh',
      overflow: 'auto'
    }}>
      <h3 style={{
        margin: '0 0 1rem 0',
        fontSize: '1.125rem',
        fontWeight: 600,
        color: '#111827'
      }}>
        {t('manual_student_id') || 'Manual Student ID'}
      </h3>

      <input
        type="text"
        value={manualStudentId}
        onChange={(e) => setManualStudentId(e.target.value)}
        placeholder={t('enter_reference_id') || 'Enter student number or reference ID (STU-XXXXXX)...'}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          marginBottom: '1rem',
          outline: 'none',
          boxSizing: 'border-box'
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            onSubmit();
          }
        }}
      />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginTop: '1rem'
      }}>
        <button
          onClick={onSubmit}
          disabled={!manualStudentId.trim()}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            background: manualStudentId.trim() ? '#3b82f6' : '#9ca3af',
            color: 'white',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            cursor: manualStudentId.trim() ? 'pointer' : 'not-allowed',
            width: '100%',
            fontWeight: 500,
            transition: 'all 0.2s ease'
          }}
        >
          {t('simulate_scan') || 'Simulate Scan'}
        </button>

        <button
          onClick={onClose}
          style={{
            padding: '0.75rem 1rem',
            border: '1px solid #d1d5db',
            background: 'white',
            color: '#6b7280',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
            width: '100%',
            fontWeight: 500,
            transition: 'all 0.2s ease'
          }}
        >
          {t('cancel') || 'Cancel'}
        </button>
      </div>
    </div>
  );
};

export default ManualInputForm;
