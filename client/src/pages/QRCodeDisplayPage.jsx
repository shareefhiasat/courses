import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardBody, Container } from '@ui';
import { ArrowLeft, Download, Share2, Maximize2, RotateCw, X } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';
import QRCode from 'qrcode';

const QRCodeDisplayPage = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const { studentId, classId } = useParams();
  
  const [qrCodeData, setQrCodeData] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const qrCodeRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const loadQRCodeData = async () => {
      try {
        setLoading(true);
        
        // Generate QR code data with high error correction for logo
        const qrDataUrl = await QRCode.toDataURL(studentId, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H' // High error correction for logo overlay
        });
        
        setQrCodeData({ 
          image: qrDataUrl,
          logo: '/qaf_logo_transparent.png'
        });
        
        // Set basic student info
        setStudentInfo({ 
          studentNumber: studentId,
          name: `Student ${studentId}`
        });
        
      } catch (error) {
        console.error('Error loading QR code:', error);
        showError(t('error_loading_qrcode') || 'Failed to load QR code');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      loadQRCodeData();
    }
  }, [studentId, classId, showError, t]);

  const handleDownload = async () => {
    if (!qrCodeData?.image) return;
    
    try {
      // Create download link directly from the data URL
      const link = document.createElement('a');
      link.download = `qrcode-${studentId || 'student'}-${Date.now()}.png`;
      link.href = qrCodeData.image;
      link.click();
      
      showSuccess(t('qrcode_downloaded') || 'QR code downloaded successfully');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      showError(t('error_download_qrcode') || 'Failed to download QR code');
    }
  };

  const handleShare = async () => {
    if (!qrCodeData?.image) return;
    
    try {
      if (navigator.share) {
        // Use native share API if available
        const blob = await (await fetch(qrCodeData.image)).blob();
        const file = new File([blob], 'qrcode.png', { type: 'image/png' });
        
        await navigator.share({
          title: t('student_qrcode') || 'Student QR Code',
          text: studentInfo 
            ? `${t('student')}: ${studentInfo.name || studentInfo.displayName} (${studentInfo.studentNumber || studentId})`
            : `${t('student')}: ${studentId}`,
          files: [file]
        });
      } else {
        // Fallback: copy to clipboard
        const text = studentInfo 
          ? `${t('student')}: ${studentInfo.name || studentInfo.displayName} (${studentInfo.studentNumber || studentId})`
          : `${t('student')}: ${studentId}`;
        
        await navigator.clipboard.writeText(text);
        showSuccess(t('qrcode_copied') || 'QR code info copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      showError(t('error_share_qrcode') || 'Failed to share QR code');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const rotateQRCode = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      rotateQRCode();
    } else if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      handleDownload();
    } else if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      handleShare();
    } else if (e.key === 'Escape') {
      navigate(-1);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (loading) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading') || 'Loading...'}</p>
        </div>
      </Container>
    );
  }

  if (!qrCodeData) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardBody className="text-center">
            <p className="text-red-600 mb-4">{t('qrcode_not_found') || 'QR code not found'}</p>
            <Button onClick={() => navigate(-1)}>
              {t('go_back') || 'Go Back'}
            </Button>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50">
      {/* Header - Minimal and Clean */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <Container className="py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={rotateQRCode}
                title={`${t('rotate') || 'Rotate'} (R)`}
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                title={`${t('fullscreen') || 'Fullscreen'} (F)`}
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                title={`${t('download') || 'Download'} (D)`}
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                title={`${t('share') || 'Share'} (S)`}
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* QR Code Display */}
      <Container className="py-8">
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl">
            <CardBody className="p-8">
              <div 
                ref={qrCodeRef}
                className="flex justify-center items-center bg-white rounded-lg p-8 relative"
                style={{ 
                  minHeight: '400px',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease-in-out'
                }}
              >
                {qrCodeData.image ? (
                  <div className="relative">
                    <img 
                      src={qrCodeData.image} 
                      alt="Student QR Code"
                      className="max-w-full max-h-full object-contain"
                      style={{
                        width: '100%',
                        maxWidth: '400px',
                        height: 'auto'
                      }}
                    />
                    {qrCodeData.logo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <img 
                          src={qrCodeData.logo} 
                          alt="QAF Logo"
                          style={{
                            width: '60px',
                            height: '60px'
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <p>{t('qrcode_generation_failed') || 'QR code generation failed'}</p>
                  </div>
                )}
              </div>
              
              {/* Simple Keyboard Shortcuts */}
              <div className="mt-6 text-center">
                <div className="flex justify-center gap-4 text-sm text-gray-600">
                  <span><kbd className="bg-gray-200 px-2 py-1 rounded text-xs">F</kbd> Fullscreen</span>
                  <span><kbd className="bg-gray-200 px-2 py-1 rounded text-xs">R</kbd> Rotate</span>
                  <span><kbd className="bg-gray-200 px-2 py-1 rounded text-xs">D</kbd> Download</span>
                  <span><kbd className="bg-gray-200 px-2 py-1 rounded text-xs">S</kbd> Share</span>
                  <span><kbd className="bg-gray-200 px-2 py-1 rounded text-xs">ESC</kbd> Back</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>

      {/* Mobile optimization styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 768px) {
          .max-w-2xl {
            max-width: 100% !important;
          }
          
          .p-8 {
            padding: 1rem !important;
          }
          
          .text-xl {
            font-size: 1.125rem !important;
          }
          
          .text-sm {
            font-size: 0.875rem !important;
          }
          
          .space-x-2 > * + * {
            margin-left: 0.5rem !important;
          }
          
          .space-x-4 > * + * {
            margin-left: 1rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .p-8 {
            padding: 0.5rem !important;
          }
          
          .text-xl {
            font-size: 1rem !important;
          }
          
          .space-x-2 > * + * {
            margin-left: 0.25rem !important;
          }
          
          .space-x-4 > * + * {
            margin-left: 0.5rem !important;
          }
          
          button span {
            display: none;
          }
        }
        
        /* Fullscreen styles */
        :fullscreen {
          background: white !important;
        }
        
        :fullscreen .bg-gray-50 {
          background: white !important;
        }
        
        :fullscreen .shadow-sm {
          box-shadow: none !important;
        }
        
        :fullscreen .border-b {
          border-bottom: none !important;
        }
        
        :fullscreen .sticky {
          position: static !important;
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .bg-gray-50 {
            background: white !important;
          }
          
          .text-gray-600 {
            color: #000 !important;
          }
          
          .border-b {
            border-color: #000 !important;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
          }
        }
        `
      }} />
    </div>
  );
};

export default QRCodeDisplayPage;
