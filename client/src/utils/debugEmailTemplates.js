/**
 * Debug script to test email template fetching
 * Run this in the browser console to see what templates are available
 */

async function debugEmailTemplates() {
  console.log('🚀 Starting email template debug...');
  
  try {
    // Import the getEmailTemplates function
    const { getEmailTemplates } = await import('./services/business/emailService.js');
    
    console.log('📋 Fetching email templates...');
    const result = await getEmailTemplates();
    
    console.log('📊 Result:', result);
    
    if (result.success) {
      console.log('✅ Templates fetched successfully!');
      console.log('📋 Template count:', result.data.length);
      
      // Group templates by type for better analysis
      const templates = result.data;
      const qrTemplates = templates.filter(t => 
        t.id.toLowerCase().includes('qr') || 
        t.name?.toLowerCase().includes('qr')
      );
      
      const studentTemplates = templates.filter(t => 
        t.id.toLowerCase().includes('student') || 
        t.name?.toLowerCase().includes('student')
      );
      
      console.log('🔍 QR-related templates:', qrTemplates);
      console.log('👤 Student-related templates:', studentTemplates);
      
      // Check for the specific template we need
      const studentQRCode = templates.find(t => t.id === 'student_qr_code');
      console.log('🎯 student_qr_code template:', studentQRCode);
      
      if (!studentQRCode) {
        console.warn('❌ student_qr_code template NOT found!');
        console.log('💡 Available template IDs:', templates.map(t => t.id));
        console.log('💡 Available template names:', templates.map(t => t.name || 'N/A'));
      }
    } else {
      console.error('❌ Failed to fetch templates:', result.error);
    }
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.debugEmailTemplates = debugEmailTemplates;
  console.log('🔧 Debug function available: window.debugEmailTemplates()');
}

export default debugEmailTemplates;
