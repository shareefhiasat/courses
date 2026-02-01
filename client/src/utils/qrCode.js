import QRCode from 'qrcode';

/**
 * Generate a reference ID for a student based on their UID
 * Format: STU-XXXXXX (6 characters from end of UID)
 */
export const generateReferenceId = (uid) => {
  if (!uid || typeof uid !== 'string') {
    throw new Error('Valid UID is required to generate reference ID');
  }
  
  // Take last 6 characters and convert to uppercase
  const suffix = uid.slice(-6).toUpperCase();
  return `STU-${suffix}`;
};

/**
 * Validate reference ID format
 */
export const validateReferenceId = (referenceId) => {
  if (!referenceId || typeof referenceId !== 'string') {
    return false;
  }
  
  // Check format: STU-XXXXXX where X is alphanumeric
  const regex = /^STU-[A-Z0-9]{6}$/;
  return regex.test(referenceId);
};

/**
 * Generate QR code data URL for student profile
 * @param {string} studentNumber - Student number (can be any text/number)
 * @param {Object} options - QR code options
 * @returns {Promise<string>} - Data URL of the QR code
 */
export const generateStudentQRCode = async (studentNumber, options = {}) => {
  if (!studentNumber) {
    throw new Error('Student number is required');
  }
  
  const defaultOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  };
  
  const qrOptions = { ...defaultOptions, ...options };
  
  try {
    // Generate QR code content - use student number directly
    const qrContent = studentNumber;
    
    // Generate QR code
    const qrDataUrl = await QRCode.toDataURL(qrContent, qrOptions);
    
    return qrDataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code for download/print
 * @param {string} studentNumber - Student number
 * @param {Object} studentInfo - Student information for the card
 * @param {Object} options - QR code options
 * @returns {Promise<string>} - Data URL of the complete QR card
 */
export const generateStudentQRCard = async (studentNumber, studentInfo = {}, options = {}) => {
  try {
    // Generate QR code
    const qrDataUrl = await generateStudentQRCode(studentNumber, {
      width: 200,
      margin: 1,
      ...options
    });
    
    // Create canvas for the complete card
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Card dimensions
    const cardWidth = 400;
    const cardHeight = 250;
    
    canvas.width = cardWidth;
    canvas.height = cardHeight;
    
    // Card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cardWidth, cardHeight);
    
    // Border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, cardWidth - 20, cardHeight - 20);
    
    // Load QR code image
    const qrImage = new Image();
    qrImage.src = qrDataUrl;
    
    await new Promise((resolve, reject) => {
      qrImage.onload = resolve;
      qrImage.onerror = reject;
    });
    
    // Draw QR code
    const qrSize = 150;
    const qrX = 30;
    const qrY = (cardHeight - qrSize) / 2;
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    
    // Student info text
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(studentInfo.displayName || 'Student Name', 200, 60);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(studentInfo.email || 'email@example.com', 200, 85);
    
    // Student Number
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#059669';
    ctx.fillText(studentNumber, 200, 120);
    
    // School/Institution info
    ctx.font = '12px Arial';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Student ID Card', 200, 160);
    
    // Date issued
    const today = new Date().toLocaleDateString();
    ctx.fillText(`Issued: ${today}`, 200, 180);
    
    // Instructions
    ctx.font = '10px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Scan this QR code for quick profile access', 200, 220);
    
    // Convert to data URL
    const cardDataUrl = canvas.toDataURL('image/png');
    
    return cardDataUrl;
  } catch (error) {
    console.error('Failed to generate QR card:', error);
    throw new Error('Failed to generate QR card');
  }
};

/**
 * Download QR code as image file
 * @param {string} dataUrl - Data URL of the image
 * @param {string} filename - Filename for download
 */
export const downloadQRCode = (dataUrl, filename = 'student-qr-code.png') => {
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to download QR code:', error);
    throw new Error('Failed to download QR code');
  }
};

/**
 * Parse QR code content to extract student number or reference ID
 * @param {string} qrContent - QR code content
 * @returns {string|null} - Student number/reference ID or null if invalid
 */
export const parseQRContent = (qrContent) => {
  if (!qrContent || typeof qrContent !== 'string') {
    return null;
  }
  
  try {
    // Parse URL format: https://domain.com/qr/student/STUDENT_NUMBER
    const url = new URL(qrContent);
    const pathParts = url.pathname.split('/');
    
    // Check if path matches /qr/student/STUDENT_NUMBER
    if (pathParts.length >= 4 && 
        pathParts[pathParts.length - 3] === 'qr' && 
        pathParts[pathParts.length - 2] === 'student') {
      
      const studentId = pathParts[pathParts.length - 1];
      
      if (studentId && studentId.trim()) {
        return studentId.trim();
      }
    }
    
    // Fallback: check if content is directly a student number or reference ID
    const trimmedContent = qrContent.trim();
    if (trimmedContent) {
      return trimmedContent;
    }
    
    return null;
  } catch (error) {
    // If URL parsing fails, try direct validation
    const trimmedContent = qrContent.trim();
    if (trimmedContent) {
      return trimmedContent;
    }
    return null;
  }
};

/**
 * Generate batch QR codes for multiple students
 * @param {Array} students - Array of student objects with uid and referenceId
 * @param {Object} options - QR code options
 * @returns {Promise<Array>} - Array of { student, qrDataUrl } objects
 */
export const generateBatchQRCodes = async (students, options = {}) => {
  if (!Array.isArray(students)) {
    throw new Error('Students must be an array');
  }
  
  const results = [];
  
  for (const student of students) {
    try {
      if (!student.referenceId) {
        console.warn(`Student ${student.uid} has no reference ID, skipping...`);
        continue;
      }
      
      const qrDataUrl = await generateStudentQRCode(student.referenceId, options);
      results.push({
        student,
        qrDataUrl,
        success: true
      });
    } catch (error) {
      console.error(`Failed to generate QR for student ${student.uid}:`, error);
      results.push({
        student,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
};

/**
 * QR code scanner configuration
 */
export const QR_SCANNER_CONFIG = {
  // Scanner settings
  fps: 10,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1.0,
  
  // Supported formats
  supportedFormats: [
    'qr_code',
    'code_128',
    'code_39',
    'ean_13',
    'ean_8',
    'upc_a',
    'upc_e'
  ],
  
  // Error handling
  maxRetries: 3,
  retryDelay: 1000,
  
  // Performance
  scanInterval: 500,
  maxScanTime: 30000, // 30 seconds
};

/**
 * Check if device has camera capabilities
 * @returns {Promise<boolean>} - True if camera is available
 */
export const checkCameraAvailability = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    return videoDevices.length > 0;
  } catch (error) {
    console.error('Failed to check camera availability:', error);
    return false;
  }
};

/**
 * Request camera permissions
 * @returns {Promise<boolean>} - True if permission granted
 */
export const requestCameraPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    });
    
    // Stop the stream immediately after getting permission
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
};

/**
 * Get QR code statistics for analytics
 * @param {string} referenceId - Student reference ID
 * @returns {Object} - QR code usage statistics
 */
export const getQRCodeStats = async (referenceId) => {
  // This would integrate with your analytics system
  // For now, return placeholder data
  return {
    referenceId,
    scansCount: 0,
    lastScanned: null,
    devices: [],
    locations: [],
    generatedAt: new Date().toISOString()
  };
};

export default {
  generateReferenceId,
  validateReferenceId,
  generateStudentQRCode,
  generateStudentQRCard,
  downloadQRCode,
  parseQRContent,
  generateBatchQRCodes,
  QR_SCANNER_CONFIG,
  checkCameraAvailability,
  requestCameraPermission,
  getQRCodeStats
};
