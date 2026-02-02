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
        
        // Create composite image with QAF logo embedded
        const compositeImage = await createQRCodeWithLogo(qrDataUrl, '/qaf_logo_transparent.png');
        
        setQrCodeData({ 
          image: compositeImage
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

    const createQRCodeWithLogo = async (qrDataUrl, logoUrl) => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 400;
        
        canvas.width = size;
        canvas.height = size;
        
        // Load QR code image
        const qrImg = new Image();
        qrImg.onload = () => {
          // Draw QR code
          ctx.drawImage(qrImg, 0, 0, size, size);
          
          // Load and draw logo
          const logoImg = new Image();
          logoImg.onload = () => {
            // Calculate logo size (about 20% of QR code size)
            const logoSize = size * 0.2;
            const logoX = (size - logoSize) / 2;
            const logoY = (size - logoSize) / 2;
            
            // Create white background for logo
            ctx.fillStyle = 'white';
            ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
            
            // Draw logo
            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
            
            // Convert to data URL
            resolve(canvas.toDataURL());
          };
          logoImg.onerror = reject;
          logoImg.src = logoUrl;
        };
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });
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
    if (!qrCodeData?.image) {
      showError('No QR code available to share');
      return;
    }
    
    try {
      console.log('🔗 Starting share process');
      
      if (navigator.share) {
        console.log('🔗 Using native share API');
        
        // Convert data URL to blob
        const response = await fetch(qrCodeData.image);
        const blob = await response.blob();
        const file = new File([blob], 'qrcode.png', { type: 'image/png' });
        
        const shareData = {
          title: t('student_qrcode') || 'Student QR Code',
          text: studentInfo 
            ? `${t('student') || 'Student'}: ${studentInfo.name || studentInfo.displayName} (${studentInfo.studentNumber || studentId})`
            : `${t('student') || 'Student'}: ${studentId}`,
          files: [file]
        };
        
        console.log('🔗 Share data:', shareData);
        await navigator.share(shareData);
        showSuccess(t('qrcode_shared') || 'QR code shared successfully');
        
      } else {
        console.log('🔗 Using clipboard fallback');
        // Fallback: copy to clipboard
        const text = studentInfo 
          ? `${t('student') || 'Student'}: ${studentInfo.name || studentInfo.displayName} (${studentInfo.studentNumber || studentId})`
          : `${t('student') || 'Student'}: ${studentId}`;
        
        await navigator.clipboard.writeText(text);
        showSuccess(t('qrcode_copied') || 'QR code info copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      
      // Try fallback if native share failed
      if (error.name !== 'AbortError') {
        try {
          const text = studentInfo 
            ? `${t('student') || 'Student'}: ${studentInfo.name || studentInfo.displayName} (${studentInfo.studentNumber || studentId})`
            : `${t('student') || 'Student'}: ${studentId}`;
          
          await navigator.clipboard.writeText(text);
          showSuccess(t('qrcode_copied') || 'QR code info copied to clipboard');
        } catch (clipboardError) {
          console.error('Clipboard fallback also failed:', clipboardError);
          showError(t('error_share_qrcode') || 'Failed to share QR code');
        }
      }
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
    console.log('🔑 Key pressed:', e.key); // Debug log
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
    } else if (e.key === 'b' || e.key === 'B') {
      e.preventDefault();
      console.log('🔑 B pressed, navigating back');
      navigate(-1);
    }
  };

  useEffect(() => {
    const keyHandler = (e) => handleKeyPress(e);
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [navigate, qrCodeData, studentInfo, studentId]); // Add dependencies

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
                  <img 
                    src={qrCodeData.image} 
                    alt="Student QR Code with QAF Logo"
                    className="max-w-full max-h-full object-contain"
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      height: 'auto',
                      border: '4px solid #800000',
                      borderRadius: '8px'
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <p>{t('qrcode_generation_failed') || 'QR code generation failed'}</p>
                  </div>
                )}
              </div>
              
              {/* Simple Keyboard Shortcuts */}
              <div className="mt-6 text-center">
                <div className="flex justify-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <kbd className="bg-gray-200 px-2 py-1 rounded text-xs border border-gray-400">F</kbd> 
                    <span>Fullscreen</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="bg-gray-200 px-2 py-1 rounded text-xs border border-gray-400">R</kbd> 
                    <span>Rotate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="bg-gray-200 px-2 py-1 rounded text-xs border border-gray-400">D</kbd> 
                    <span>Download</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="bg-gray-200 px-2 py-1 rounded text-xs border border-gray-400">S</kbd> 
                    <span>Share</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="bg-gray-200 px-2 py-1 rounded text-xs border border-gray-400">B</kbd> 
                    <span>Back</span>
                  </span>
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
