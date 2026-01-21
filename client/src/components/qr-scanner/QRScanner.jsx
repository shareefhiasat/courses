import React, { useState } from 'react';
import { Button } from './ui/button';

const QrCodeIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const CameraIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
);

export default function QRScanner({ onScan }) {
  const [isScanning, setIsScanning] = useState(false);
  const [recentScans, setRecentScans] = useState(0);

  const handleActivateCamera = () => {
    setIsScanning(true);
    // Simulate scan after 2 seconds
    setTimeout(() => {
      const mockStudentId = '249001';
      onScan(mockStudentId);
      setRecentScans((prev) => prev + 1);
      setIsScanning(false);
    }, 2000);
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      border: '1px solid #e5e7eb',
      padding: '1.5rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <QrCodeIcon className="w-5 h-5" style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
          <h3 style={{ fontWeight: 600, color: '#111827', margin: 0 }}>Scanner Ready</h3>
        </div>
        <span style={{
          fontSize: '0.75rem',
          padding: '0.25rem 0.5rem',
          background: '#dbeafe',
          color: '#1e40af',
          borderRadius: '0.375rem',
          fontWeight: 500
        }}>
          IDLE
        </span>
      </div>

      <div style={{
        background: '#0f172a',
        borderRadius: '0.5rem',
        aspectRatio: '16/9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {!isScanning ? (
          <div style={{ textAlign: 'center', zIndex: 1 }}>
            <CameraIcon className="w-12 h-12" style={{ 
              width: '3rem', 
              height: '3rem', 
              color: '#475569',
              margin: '0 auto 0.75rem'
            }} />
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
              Tap to activate camera
            </p>
          </div>
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '12rem',
              height: '12rem',
              border: '2px solid #8b5cf6',
              borderRadius: '0.5rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '1rem',
                height: '1rem',
                borderTop: '2px solid #8b5cf6',
                borderLeft: '2px solid #8b5cf6'
              }} />
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '1rem',
                height: '1rem',
                borderTop: '2px solid #8b5cf6',
                borderRight: '2px solid #8b5cf6'
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '1rem',
                height: '1rem',
                borderBottom: '2px solid #8b5cf6',
                borderLeft: '2px solid #8b5cf6'
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '1rem',
                height: '1rem',
                borderBottom: '2px solid #8b5cf6',
                borderRight: '2px solid #8b5cf6'
              }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '100%',
                  height: '2px',
                  background: '#8b5cf6',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }} />
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleActivateCamera}
          disabled={isScanning}
          variant="ghost"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            cursor: isScanning ? 'not-allowed' : 'pointer'
          }}
        >
          <span className="qr-sr-only">Activate camera</span>
        </Button>
      </div>

      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.875rem',
          marginBottom: '0.5rem'
        }}>
          <span style={{ color: '#6b7280' }}>Recent Scans</span>
          <span style={{ fontWeight: 600, color: '#111827' }}>{recentScans}</span>
        </div>
      </div>
    </div>
  );
}
