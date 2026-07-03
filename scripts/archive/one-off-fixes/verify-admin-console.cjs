/**
 * Verify Keycloak admin console is working
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function verifyAdminConsole() {
  try {
    console.log('🔍 Verifying Keycloak admin console...');
    
    // Test if admin console is accessible
    const adminConsoleResponse = await fetch(`${KEYCLOAK_URL}/admin/`, {
      method: 'GET'
    });
    
    if (adminConsoleResponse.ok) {
      console.log('✅ Admin console is accessible');
      console.log('🌐 URL: http://localhost:8080/admin/');
      
      // Check for admin console resources
      const resourcesResponse = await fetch(`${KEYCLOAK_URL}/resources/`, {
        method: 'GET'
      });
      
      if (resourcesResponse.ok) {
        console.log('✅ Admin console resources are accessible');
      } else {
        console.log('⚠️ Admin console resources not accessible (this is expected)');
      }
      
      console.log('\n🎯 Try accessing the admin console now:');
      console.log('1. Open: http://localhost:8080/admin/');
      console.log('2. Login with: admin / admin123');
      console.log('3. The login screen should appear now');
      
    } else {
      console.log('❌ Admin console not accessible');
      console.log('Status:', adminConsoleResponse.status);
    }
    
    // Test realm endpoint
    const realmResponse = await fetch(`${KEYCLOAK_URL}/realms/master/.well-known/openid-configuration`);
    if (realmResponse.ok) {
      console.log('✅ Master realm is accessible');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyAdminConsole();
