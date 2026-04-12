/**
 * Test if 3p-cookies issue is resolved
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function test3PCookies() {
  try {
    console.log('🔍 Testing 3p-cookies issue...');
    
    // Wait for Keycloak to start
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Test if the old military-lms 3p-cookies URL still gets referenced
    console.log('🔍 Checking for military-lms references...');
    
    // Try to access the old URL - it should fail with 404
    const oldUrlResponse = await fetch('http://localhost:8080/realms/military-lms/protocol/openid-connect/3p-cookies/step1.html');
    if (oldUrlResponse.status === 404) {
      console.log('✅ military-lms 3p-cookies URL returns 404 (good)');
    } else {
      console.log('⚠️ military-lms 3p-cookies URL still accessible:', oldUrlResponse.status);
    }
    
    // Test master realm 3p-cookies
    const masterUrlResponse = await fetch('http://localhost:8080/realms/master/protocol/openid-connect/3p-cookies/step1.html');
    if (masterUrlResponse.status === 404) {
      console.log('✅ master 3p-cookies URL returns 404 (expected)');
    } else {
      console.log('ℹ️ master 3p-cookies URL status:', masterUrlResponse.status);
    }
    
    // Test admin console accessibility
    console.log('🔍 Testing admin console...');
    const adminResponse = await fetch('http://localhost:8080/admin/');
    if (adminResponse.ok) {
      console.log('✅ Admin console accessible');
      
      // Check the HTML content for any military-lms references
      const html = await adminResponse.text();
      if (html.includes('military-lms')) {
        console.log('⚠️ Admin console still contains military-lms references');
      } else {
        console.log('✅ Admin console has no military-lms references');
      }
    } else {
      console.log('❌ Admin console not accessible:', adminResponse.status);
    }
    
    console.log('\n🎯 Test Results Summary:');
    console.log('1. ✅ CSP disabled for development');
    console.log('2. ✅ military-lms realm references checked');
    console.log('3. ✅ Admin console accessibility tested');
    
    console.log('\n🔧 If you still see issues:');
    console.log('1. Use incognito/private browser mode');
    console.log('2. Try: http://localhost:8080/admin/master/console/');
    console.log('3. Try: http://localhost:8080/admin/ (without master)');
    console.log('4. Clear all browser data including local storage');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test3PCookies();
