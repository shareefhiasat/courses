/**
 * Debug script to test notification gateway template mapping
 * Run this in the browser console to see template selection process
 */

async function debugNotificationGateway() {
  console.log('🚀 Starting notification gateway debug...');
  
  try {
    // Import required modules
    const { notificationGateway } = await import('./services/business/notificationGateway.js');
    const { NOTIFICATION_TRIGGERS } = await import('./constants/notificationTypes.jsx');
    
    console.log('📋 Testing template mapping for QR_CODE_SENT trigger...');
    
    // Test the template mapping directly
    const mappedTemplate = notificationGateway.getMappedTemplate(NOTIFICATION_TRIGGERS.QR_CODE_SENT);
    console.log('🔍 Mapped template for QR_CODE_SENT:', mappedTemplate);
    
    // Test with sample data (won't actually send, just shows the process)
    console.log('📋 Testing notification gateway send process...');
    
    const testData = {
      userId: 'test-user-id',
      role: 'student',
      email: 'test@example.com',
      templateId: 'student_qr_code',
      variables: {
        studentName: 'Test Student',
        referenceId: 'TEST-123',
        qrUrl: 'https://example.com/qr/test',
        siteUrl: window.location.origin,
        instructions: 'Test instructions'
      },
      title: 'Test QR Code Email',
      message: 'This is a test QR code email',
      type: 'success'
    };
    
    console.log('📊 Test data:', testData);
    console.log('🔍 Trigger:', NOTIFICATION_TRIGGERS.QR_CODE_SENT);
    
    // Test the template selection logic
    const templateId = testData.templateId || notificationGateway.getMappedTemplate(NOTIFICATION_TRIGGERS.QR_CODE_SENT);
    console.log('🎯 Final template ID that would be used:', templateId);
    
    // Test notification settings (this will show what settings are loaded)
    console.log('📋 Testing notification settings...');
    const settings = await notificationGateway.getSettings('student', NOTIFICATION_TRIGGERS.QR_CODE_SENT);
    console.log('⚙️ Notification settings for student/QR_CODE_SENT:', settings);
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.debugNotificationGateway = debugNotificationGateway;
  console.log('🔧 Debug function available: window.debugNotificationGateway()');
}

export default debugNotificationGateway;
