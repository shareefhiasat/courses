import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'react-qr-code';
import { getThemedIcon } from '@constants/iconTypes';
import { useLang } from '@contexts/LangContext';
import PortalTooltip from '@ui/PortalTooltip';

import { info, error, warn, debug } from '@services/utils/logger.js';import './StudentQRCodeDisplay.css';

const StudentQRCodeDisplay = ({ 
  student, 
  onRefresh = null,
  showDownload = true,
  size = 200,
  className = ''
}) => {
  const { t } = useLang();
  const [qrData, setQrData] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student && student.id) {
      // Create QR code data with student information
      const qrContent = JSON.stringify({
        studentId: student.id,
        name: student.name || student.displayName || 'Unknown',
        email: student.email || '',
        timestamp: new Date().toISOString()
      });
      setQrData(qrContent);
    }
  }, [student]);

  const handleRefresh = async () => {
    if (onRefresh) {
      setLoading(true);
      try {
        await onRefresh();
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownload = () => {
    if (!qrData) return;

    // Create a download link for the QR code
    const svgElement = document.querySelector('.qr-code-svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `${student?.name || 'student'}-qr-code.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  if (!student) {
    return (
      <div className={`qr-code-display ${className}`}>
        <div className="qr-code-empty">
          {getThemedIcon('ui', 'user', 48)}
          <p>No student selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`qr-code-display ${className}`}>
      <div className="qr-code-header">
        <h3>{student.name || student.displayName || 'Student'}</h3>
        <div className="qr-code-actions">
          {onRefresh && (
            <PortalTooltip content={t('refresh_qr_code')} position="top">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="qr-code-refresh"
            >
              {getThemedIcon('ui', 'refresh_cw', 16)}
            </button>
            </PortalTooltip>
          )}
          {showDownload && (
            <PortalTooltip content={t('download_qr_code')} position="top">
            <button
              onClick={handleDownload}
              className="qr-code-download"
            >
              {getThemedIcon('ui', 'download', 16)}
            </button>
            </PortalTooltip>
          )}
        </div>
      </div>
      
      <div className="qr-code-content">
        <div className="qr-code-wrapper" style={{ width: size, height: size }}>
          {qrData ? (
            <QRCodeSVG
              value={qrData}
              size={size}
              level="H"
              includeMargin={true}
              className="qr-code-svg"
            />
          ) : (
            <div className="qr-code-loading">
              <div className="loading-spinner"></div>
            </div>
          )}
        </div>
        
        <div className="qr-code-info">
          <p className="student-name">{student.name || student.displayName}</p>
          {student.email && (
            <p className="student-email">{student.email}</p>
          )}
          {student.studentId && (
            <p className="student-id">ID: {student.studentId}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentQRCodeDisplay;
