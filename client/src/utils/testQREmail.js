/**
 * Test QR Email - Zero Function Approach
 * Test this in your browser console
 */

import { sendQRUrlEmail, getQRInfo } from './qrSimpleLink';

/**
 * Test QR URL generation
 */
export const testQRUrl = () => {
  // Test with student number 1 (like your example)
  const info = getQRInfo('student123', '1');
  
  console.log('🎯 QR Info (Zero Function Test):');
  console.log('URL:', info.qrUrl);
  console.log('Reference ID:', info.referenceId);
  console.log('Instructions:', info.instructions);
  
  // Should output: https://localhost:5174/qrcode/1
  return info;
};

/**
 * Test QR email sending
 * Replace with actual student data to test
 */
export const testQREmail = async () => {
  try {
    const result = await sendQRUrlEmail(
      'test@example.com',           // student email
      'Test Student',              // student name
      'student123',                 // student id
      '1'                          // student number
    );
    
    console.log('✅ QR URL email sent successfully!');
    console.log('QR URL:', result.qrUrl);
    return result;
    
  } catch (error) {
    console.error('❌ Failed to send QR URL email:', error);
    throw error;
  }
};

/**
 * Quick test - run this in browser console
 */
export const quickTest = () => {
  console.log('🧪 Testing QR URL generation...');
  
  const testCases = [
    { studentId: 'abc123', studentNumber: '1' },
    { studentId: 'def456', studentNumber: '123' },
    { studentId: 'ghi789', studentNumber: null }, // should use ID slice
  ];
  
  testCases.forEach((testCase, index) => {
    const info = getQRInfo(testCase.studentId, testCase.studentNumber);
    console.log(`Test ${index + 1}:`, info.qrUrl);
  });
  
  console.log('✅ All tests completed!');
  console.log('🌐 Visit: https://localhost:5174/qrcode/1 to see QR page');
};

// Auto-run quick test when imported
if (typeof window !== 'undefined') {
  console.log('🎯 QR Email Test Loaded');
  console.log('Run quickTest() in console to test URL generation');
  console.log('Run testQREmail() in console to test email sending');
}
