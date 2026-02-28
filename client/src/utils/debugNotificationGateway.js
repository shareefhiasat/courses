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
    
    console.log('📋 Testing template mapping for WELCOME_SIGNUP trigger...');
    
    // Test the template mapping for welcome signup
    const welcomeTemplate = notificationGateway.getMappedTemplate(NOTIFICATION_TRIGGERS.WELCOME_SIGNUP);
    console.log('🔍 Mapped template for WELCOME_SIGNUP:', welcomeTemplate);
    
    console.log('📋 Testing template mapping for QR_CODE_SENT trigger...');
    
    // Test the template mapping directly
    const mappedTemplate = notificationGateway.getMappedTemplate(NOTIFICATION_TRIGGERS.QR_CODE_SENT);
    console.log('🔍 Mapped template for QR_CODE_SENT:', mappedTemplate);
    
    // Test with sample data for welcome signup (won't actually send, just shows the process)
    console.log('📋 Testing welcome signup notification process...');
    
    const welcomeTestData = {
      userId: 'test-user-id',
      role: 'student',
      email: 'test@example.com',
      variables: {
        displayName: 'Test Student',
        userEmail: 'test@example.com',
        userId: 'test-user-id',
        signupDate: new Date().toLocaleDateString()
      },
      title: 'Welcome to QAF Learning Hub!',
      message: 'Hi Test Student, welcome to QAF Learning Hub! Your account has been created successfully.',
      type: 'success'
    };
    
    console.log('📊 Welcome signup test data:', welcomeTestData);
    console.log('🔍 Welcome trigger:', NOTIFICATION_TRIGGERS.WELCOME_SIGNUP);
    
    // Test the template selection logic for welcome
    const welcomeTemplateId = notificationGateway.getMappedTemplate(NOTIFICATION_TRIGGERS.WELCOME_SIGNUP);
    console.log('🎯 Final welcome template ID that would be used:', welcomeTemplateId);
    
    // Test notification settings for welcome
    console.log('📋 Testing welcome notification settings...');
    const welcomeSettings = await notificationGateway.getSettings('student', NOTIFICATION_TRIGGERS.WELCOME_SIGNUP);
    console.log('⚙️ Notification settings for student/WELCOME_SIGNUP:', welcomeSettings);
    
    // Test with sample data (won't actually send, just shows the process)
    console.log('📋 Testing QR code notification process...');
    
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
    
    console.log('📊 QR code test data:', testData);
    console.log('🔍 QR trigger:', NOTIFICATION_TRIGGERS.QR_CODE_SENT);
    
    // Test the template selection logic
    const templateId = testData.templateId || notificationGateway.getMappedTemplate(NOTIFICATION_TRIGGERS.QR_CODE_SENT);
    console.log('🎯 Final QR template ID that would be used:', templateId);
    
    // Test notification settings (this will show what settings are loaded)
    console.log('📋 Testing QR notification settings...');
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
