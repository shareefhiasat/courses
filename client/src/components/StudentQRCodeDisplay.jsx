import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useTheme } from '../contexts/ThemeContext';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  QrCode, 
  Download, 
  Printer, 
  Share2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Calendar,
  User,
  Mail,
  Settings
} from 'lucide-react';
import { Button, Card as UICard, CardBody } from '../components/ui';
import { 
  generateStudentQRCode, 
  generateStudentQRCard, 
  downloadQRCode, 
  validateReferenceId,
  parseQRContent 
} from '../utils/qrCode';
import { generateStudentReferenceId } from '../utils/referenceIdSeeding';
import { DEFAULT_ACCENT, normalizeHexColor } from '../utils/color';
import './StudentQRCodeDisplay.css';

const StudentQRCodeDisplay = ({ studentId, showSettings = true, compact = false }) => {
  const { user } = useAuth();
  const { t, isRTL } = useLang();
  const { isDark, theme } = useTheme();
  
  // State management
  const [studentData, setStudentData] = useState(null);
  const [referenceId, setReferenceId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCardUrl, setQrCardUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQR, setShowQR] = useState(true);
  const [qrSize, setQrSize] = useState(compact ? 150 : 256);
  const [printCount, setPrintCount] = useState(0);
  const [lastGenerated, setLastGenerated] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Settings state
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [qrColor, setQrColor] = useState('#000000');
  const [qrBackground, setQrBackground] = useState('#FFFFFF');
  const [includeInfo, setIncludeInfo] = useState(true);
  const [errorCorrection, setErrorCorrection] = useState('M');
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  // Theme color
  const accentColor = useMemo(() => {
    try {
      const savedColor = localStorage.getItem('userMessageColor');
      return normalizeHexColor(savedColor, DEFAULT_ACCENT);
    } catch {
      return DEFAULT_ACCENT;
    }
  }, []);

  // Check if viewing own profile
  const isOwnProfile = user?.uid === studentId;

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load student data and reference ID
  useEffect(() => {
    if (!studentId) return;
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const studentRef = doc(db, 'users', studentId);
      const studentDoc = await getDoc(studentRef);
      
      if (!studentDoc.exists()) {
        throw new Error('Student not found');
      }
      
      const data = studentDoc.data();
      
      if (data.role !== 'student') {
        throw new Error('This profile is not for a student');
      }
      
      setStudentData({
        uid: studentDoc.id,
        ...data
      });
      
      // Check if reference ID exists
      if (data.referenceId && validateReferenceId(data.referenceId)) {
        setReferenceId(data.referenceId);
        setPrintCount(data.qrPrintCount || 0);
        setLastGenerated(data.qrGeneratedAt?.toDate());
      } else {
        // Generate reference ID if it doesn't exist
        if (isOwnProfile || user?.isAdmin) {
          await generateReferenceId();
        }
      }
      
    } catch (error) {
      console.error('Failed to load student data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate reference ID
  const generateReferenceId = async () => {
    try {
      setIsGenerating(true);
      
      const result = await generateStudentReferenceId(studentId);
      
      if (result.success) {
        setReferenceId(result.referenceId);
        setSuccess('Reference ID generated successfully');
        
        if (!result.alreadyExisted) {
          setLastGenerated(new Date());
        }
        
        // Reload student data to get updated info
        await loadStudentData();
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('Failed to generate reference ID:', error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate QR code
  useEffect(() => {
    if (!referenceId) return;
    generateQR();
  }, [referenceId, qrSize, qrColor, qrBackground, errorCorrection]);

  const generateQR = async () => {
    try {
      setIsGenerating(true);
      
      const qrOptions = {
        width: qrSize,
        margin: 2,
        color: {
          dark: qrColor,
          light: qrBackground
        },
        errorCorrectionLevel: errorCorrection
      };
      
      const qrDataUrl = await generateStudentQRCode(referenceId, qrOptions);
      setQrCodeUrl(qrDataUrl);
      
      // Generate QR card if info is included
      if (includeInfo && studentData) {
        const cardDataUrl = await generateStudentQRCard(referenceId, studentData, {
          width: 400,
          margin: 1,
          color: {
            dark: qrColor,
            light: qrBackground
          },
          errorCorrectionLevel: errorCorrection
        });
        setQrCardUrl(cardDataUrl);
      }
      
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      setError('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download QR code
  const handleDownload = async (type = 'simple') => {
    try {
      const url = type === 'card' ? qrCardUrl : qrCodeUrl;
      const filename = type === 'card' 
        ? `${studentData.displayName || 'student'}-qr-card.png`
        : `${studentData.displayName || 'student'}-qr-code.png`;
      
      downloadQRCode(url, filename);
      
      // Update print count
      if (isOwnProfile || user?.isAdmin) {
        await updatePrintCount();
      }
      
      setSuccess('QR code downloaded successfully');
      
    } catch (error) {
      console.error('Failed to download QR code:', error);
      setError('Failed to download QR code');
    }
  };

  // Print QR code
  const handlePrint = async () => {
    try {
      const url = includeInfo ? qrCardUrl : qrCodeUrl;
      
      // Create print window
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Student QR Code - ${studentData?.displayName || 'Student'}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: white;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <img src="${url}" alt="Student QR Code" />
          </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for image to load, then print
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
        
        // Update print count
        if (isOwnProfile || user?.isAdmin) {
          await updatePrintCount();
        }
        
        setSuccess('Print dialog opened');
      } else {
        throw new Error('Could not open print window');
      }
      
    } catch (error) {
      console.error('Failed to print QR code:', error);
      setError('Failed to print QR code');
    }
  };

  // Copy QR code URL
  const handleCopyUrl = async () => {
    try {
      const baseUrl = window.location.origin;
      const qrUrl = `${baseUrl}/qr/student/${referenceId}`;
      
      await navigator.clipboard.writeText(qrUrl);
      setSuccess('QR code URL copied to clipboard');
      
    } catch (error) {
      console.error('Failed to copy URL:', error);
      setError('Failed to copy URL');
    }
  };

  // Share QR code
  const handleShare = async () => {
    try {
      if (navigator.share) {
        const baseUrl = window.location.origin;
        const qrUrl = `${baseUrl}/qr/student/${referenceId}`;
        
        await navigator.share({
          title: `${studentData.displayName || 'Student'} QR Code`,
          text: `Scan this QR code to view ${studentData.displayName || 'student'} profile`,
          url: qrUrl
        });
        
        setSuccess('QR code shared successfully');
      } else {
        // Fallback to copying URL
        await handleCopyUrl();
      }
      
    } catch (error) {
      console.error('Failed to share QR code:', error);
      setError('Failed to share QR code');
    }
  };

  // Update print count
  const updatePrintCount = async () => {
    try {
      const studentRef = doc(db, 'users', studentId);
      await updateDoc(studentRef, {
        qrPrintCount: (printCount || 0) + 1,
        lastPrintedAt: serverTimestamp()
      });
      
      setPrintCount(prev => prev + 1);
    } catch (error) {
      console.error('Failed to update print count:', error);
    }
  };

  // Regenerate QR code
  const handleRegenerate = async () => {
    try {
      setIsGenerating(true);
      
      if (isOwnProfile || user?.isAdmin) {
        await generateReferenceId();
      } else {
        throw new Error('You can only regenerate your own QR code');
      }
      
    } catch (error) {
      console.error('Failed to regenerate QR code:', error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className={`qr-code-display loading ${isDark ? 'dark' : 'light'} ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="loading-spinner">
          <RefreshCw className="spin" size={24} />
          <span>{t('loading') || 'Loading...'}</span>
        </div>
      </div>
    );
  }

  if (error && !studentData) {
    return (
      <div className={`qr-code-display error ${isDark ? 'dark' : 'light'} ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="error-message">
          <AlertCircle size={24} />
          <div>
            <h4>{t('error') || 'Error'}</h4>
            <p>{error}</p>
            {isOwnProfile && (
              <Button onClick={generateReferenceId} disabled={isGenerating}>
                {isGenerating ? t('generating_qr') : t('generate_reference_id')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`qr-code-display ${isDark ? 'dark' : 'light'} ${isRTL ? 'rtl' : 'ltr'} ${compact ? 'compact' : ''}`}>
      {/* Header */}
      <div className="qr-header">
        <div className="qr-title">
          <QrCode size={20} style={{ color: accentColor }} />
          <h3>{t('student_qr_code') || 'Student QR Code'}</h3>
        </div>
        
        {showSettings && (isOwnProfile || user?.isAdmin) && (
          <div className="qr-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              title={t('settings') || 'Settings'}
            >
              <Settings size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQR(!showQR)}
              title={showQR ? (t('hide_qr') || 'Hide QR') : (t('show_qr') || 'Show QR')}
            >
              {showQR ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
        )}
      </div>

      {/* Reference ID Display */}
      <div className="reference-id-display">
        <div className="reference-info">
          <label>{t('reference_id') || 'Reference ID'}</label>
          <div className="reference-value">
            <code>{referenceId || 'Not generated'}</code>
            {referenceId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyUrl}
                title={t('copy_url') || 'Copy URL'}
              >
                <Copy size={14} />
              </Button>
            )}
          </div>
        </div>
        
        {lastGenerated && (
          <div className="generated-info">
            <Calendar size={14} />
            <span>{t('generated_on') || 'Generated on'}: {lastGenerated.toLocaleDateString()}</span>
          </div>
        )}
        
        {printCount > 0 && (
          <div className="print-info">
            <Printer size={14} />
            <span>{t('printed') || 'Printed'}: {printCount} {t('times') || 'times'}</span>
          </div>
        )}
      </div>

      {/* QR Code Display */}
      {showQR && qrCodeUrl && (
        <div className="qr-code-container">
          <div className="qr-image">
            <img 
              src={qrCodeUrl} 
              alt="Student QR Code"
              style={{ 
                width: qrSize, 
                height: qrSize,
                border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
                background: qrBackground
              }}
            />
            
            {isGenerating && (
              <div className="qr-overlay">
                <RefreshCw className="spin" size={24} />
              </div>
            )}
          </div>
          
          {/* QR Info */}
          <div className="qr-info">
            <p className="qr-description">
              {t('qr_code_instructions') || 'Scan this QR code for quick profile access'}
            </p>
            
            <div className="device-info">
              {isMobile ? (
                <>
                  <Smartphone size={14} />
                  <span>{t('mobile_optimized') || 'Mobile optimized'}</span>
                </>
              ) : (
                <>
                  <Monitor size={14} />
                  <span>{t('desktop_view') || 'Desktop view'}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {showQR && qrCodeUrl && (
        <div className="qr-actions-panel">
          <div className="action-buttons">
            <Button
              onClick={() => handleDownload('simple')}
              variant="primary"
              size="sm"
              disabled={isGenerating}
            >
              <Download size={16} />
              {t('download_qr') || 'Download QR'}
            </Button>
            
            <Button
              onClick={handlePrint}
              variant="secondary"
              size="sm"
              disabled={isGenerating}
            >
              <Printer size={16} />
              {t('print_qr') || 'Print QR'}
            </Button>
            
            <Button
              onClick={handleShare}
              variant="ghost"
              size="sm"
              disabled={isGenerating}
            >
              <Share2 size={16} />
              {t('share') || 'Share'}
            </Button>
            
            {(isOwnProfile || user?.isAdmin) && (
              <Button
                onClick={handleRegenerate}
                variant="ghost"
                size="sm"
                disabled={isGenerating}
                className="regenerate-button"
              >
                <RefreshCw size={16} />
                {t('regenerate') || 'Regenerate'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettingsPanel && showSettings && (isOwnProfile || user?.isAdmin) && (
        <div className="settings-panel">
          <h4>{t('qr_settings') || 'QR Settings'}</h4>
          
          <div className="settings-grid">
            <div className="setting-group">
              <label>{t('qr_size') || 'QR Size'}</label>
              <select
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className="setting-select"
              >
                <option value={150}>Small (150px)</option>
                <option value={200}>Medium (200px)</option>
                <option value={256}>Large (256px)</option>
                <option value={300}>Extra Large (300px)</option>
              </select>
            </div>
            
            <div className="setting-group">
              <label>{t('qr_color') || 'QR Color'}</label>
              <div className="color-input-group">
                <input
                  type="color"
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  className="color-input"
                />
                <input
                  type="text"
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  className="color-text"
                  placeholder="#000000"
                />
              </div>
            </div>
            
            <div className="setting-group">
              <label>{t('background_color') || 'Background Color'}</label>
              <div className="color-input-group">
                <input
                  type="color"
                  value={qrBackground}
                  onChange={(e) => setQrBackground(e.target.value)}
                  className="color-input"
                />
                <input
                  type="text"
                  value={qrBackground}
                  onChange={(e) => setQrBackground(e.target.value)}
                  className="color-text"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
            
            <div className="setting-group">
              <label>{t('error_correction') || 'Error Correction'}</label>
              <select
                value={errorCorrection}
                onChange={(e) => setErrorCorrection(e.target.value)}
                className="setting-select"
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>
            
            <div className="setting-group full-width">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeInfo}
                  onChange={(e) => setIncludeInfo(e.target.checked)}
                  className="checkbox-input"
                />
                <span>{t('include_student_info') || 'Include student info in card'}</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="status-message error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-button">
            ×
          </button>
        </div>
      )}
      
      {success && (
        <div className="status-message success">
          <CheckCircle size={16} />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="close-button">
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentQRCodeDisplay;
