import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import jsQR from 'jsqr';

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
  const [error, setError] = useState('');
  const [cameraMode, setCameraMode] = useState('environment'); // 'environment' for back camera, 'user' for front
  const [devices, setDevices] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    setIsMobile(checkMobile());
  }, []);

  // Get available cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
      } catch (err) {
        console.error('Error getting devices:', err);
      }
    };
    getDevices();
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Request camera access with appropriate constraints
      const constraints = {
        video: {
          facingMode: cameraMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start scanning for QR codes
      scanIntervalRef.current = setInterval(scanQRCode, 100);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleQRCodeDetected(code.data);
      }
    }
  };

  const handleQRCodeDetected = (data) => {
    console.log('QR Code detected:', data);
    onScan(data);
    setRecentScans(prev => prev + 1);
    stopCamera();
  };

  const toggleCamera = () => {
    if (isScanning) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const switchCameraMode = () => {
    const newMode = cameraMode === 'environment' ? 'user' : 'environment';
    setCameraMode(newMode);
    
    if (isScanning) {
      stopCamera();
      setTimeout(() => {
        setCameraMode(newMode);
        startCamera();
      }, 100);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
          <h3 style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: '0.875rem' }}>
            Scanner {isScanning ? 'Active' : 'Ready'}
          </h3>
        </div>
        <span style={{
          fontSize: '0.75rem',
          padding: '0.25rem 0.5rem',
          background: isScanning ? '#dcfce7' : '#dbeafe',
          color: isScanning ? '#166534' : '#1e40af',
          borderRadius: '0.375rem',
          fontWeight: 500
        }}>
          {isScanning ? 'SCANNING' : 'IDLE'}
        </span>
      </div>

      <div style={{
        background: '#0f172a',
        borderRadius: '0.5rem',
        aspectRatio: '4/3',
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
            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                {error}
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
                objectFit: 'cover'
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
          onClick={toggleCamera}
          variant="ghost"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: isScanning ? 0 : 2
          }}
        >
          <span className="qr-sr-only">{isScanning ? 'Stop camera' : 'Activate camera'}</span>
        </Button>
      </div>

      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.875rem',
          marginBottom: '1rem',
          fontWeight: 600,
          color: '#111827'
        }}>
          <span>Recent Activity</span>
          <span style={{ 
            fontSize: '0.75rem', 
            background: '#8b5cf6', 
            color: 'white', 
            padding: '0.25rem 0.5rem', 
            borderRadius: '0.25rem',
            fontWeight: 500 
          }}>
            ACTIVE
          </span>
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem',
          paddingLeft: '1rem',
          borderLeft: '3px solid #8b5cf6'
        }}>
          {/* Sample recent activity logs - replace with real data */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0'
          }}>
            <span style={{ fontSize: '0.8125rem', color: '#6b7280', minWidth: '80px' }}>
              09:42 AM
            </span>
            <div style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#dcfce7',
              color: '#166534'
            }}>
              ✓ Present
            </div>
            <span style={{ fontSize: '0.8125rem', color: '#374151' }}>
              Ronel Hiasat was marked Present
            </span>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>
              QR Scan
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0'
          }}>
            <span style={{ fontSize: '0.8125rem', color: '#6b7280', minWidth: '80px' }}>
              09:44 AM
            </span>
            <div style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#fed7aa',
              color: '#92400e'
            }}>
              ⏰ Late
            </div>
            <span style={{ fontSize: '0.8125rem', color: '#374151' }}>
              Sarah Jenkins was marked Late
            </span>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>
              Manual
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0'
          }}>
            <span style={{ fontSize: '0.8125rem', color: '#6b7280', minWidth: '80px' }}>
              09:30 AM
            </span>
            <div style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#dbeafe',
              color: '#1d4ed8'
            }}>
              +5 Participation
            </div>
            <span style={{ fontSize: '0.8125rem', color: '#374151' }}>
              Michael Chang earned +5 Participation
            </span>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>
              Side Panel
            </span>
          </div>
        </div>
        
        {devices.length > 1 && isScanning && (
          <button
            onClick={switchCameraMode}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            Switch to {cameraMode === 'environment' ? 'Front' : 'Back'} Camera
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes qr-scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}
