// Simple test to verify logging is working
console.log('🧪 Testing logging after circular object fix');
console.log('📊 Simple object:', { test: 'data', number: 123 });
console.log('🔍 QR Scanner test:', { qrData: 'STU-12345' });
console.log('✅ Test complete - logs should be in localStorage now');

// Check if logs are stored
setTimeout(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
    console.log('📁 Logs in localStorage:', logs.length, 'entries');
    if (logs.length > 0) {
      console.log('📋 Latest log:', logs[logs.length - 1]);
    }
  }
}, 1000);
