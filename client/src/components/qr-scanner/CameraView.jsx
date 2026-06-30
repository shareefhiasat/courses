import React from 'react';
import { Button } from '@ui';

const CameraView = ({
  videoRef,
  canvasRef,
  isScanning,
  loading,
  error,
  isMobile,
  onToggleCamera,
  t
}) => {
  return (
    <div style={{
      background: '#0f172a',
      borderRadius: '0.5rem',
      aspectRatio: isMobile ? '1/1' : '4/3',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1rem',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      maxWidth: isMobile ? '100%' : '550px',
      margin: isMobile ? '0 auto 1rem auto' : '0 auto 1rem auto'
    }}>
      {loading ? (
        <div style={{ textAlign: 'center', zIndex: 10, position: 'relative', background: 'white', padding: '2rem' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #1e293b',
            borderTop: '3px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 0.75rem'
          }}></div>
          <p style={{ color: '#94a3b8', fontSize: 'var(--font-size-sm)', margin: 0 }}>
            {t('loading') || 'Loading...'}
          </p>
        </div>
      ) : !isScanning ? (
        <div style={{
          textAlign: 'center',
          zIndex: 1,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%'
        }}>
          <p style={{ color: '#ffffff', fontSize: 'var(--font-size-sm)', margin: '0 0 0.75rem' }}>
            {t('tap_to_activate')}
          </p>
          {error && (
            <p style={{ color: 'var(--color-danger, #ef4444)', fontSize: 'var(--font-size-xs)', marginTop: '0.5rem' }}>
              {typeof error === 'function' ? 'Error occurred' : (error?.toString?.() || String(error))}
            </p>
          )}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              width: '60%',
              height: '60%',
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
                borderTop: '3px solid #8b5cf6',
                borderLeft: '3px solid #8b5cf6'
              }} />
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '1rem',
                height: '1rem',
                borderTop: '3px solid #8b5cf6',
                borderRight: '3px solid #8b5cf6'
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '1rem',
                height: '1rem',
                borderBottom: '3px solid #8b5cf6',
                borderLeft: '3px solid #8b5cf6'
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '1rem',
                height: '1rem',
                borderBottom: '3px solid #8b5cf6',
                borderRight: '3px solid #8b5cf6'
              }} />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '2px',
                background: '#8b5cf6',
                animation: 'qr-scan-line 2s linear infinite'
              }} />
            </div>
          </div>
        </>
      )}

      <Button
        onClick={onToggleCamera}
        variant="ghost"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
      />
    </div>
  );
};

export default CameraView;
