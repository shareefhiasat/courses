/**
 * Test login after password reset
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function testLoginAfterReset() {
  try {
    console.log('🧪 Testing login after password reset...\n');
    
    // Test direct login as this user
    const loginResponse = await fetch(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'military-lms-app',
        username: 'shareef.hiasat@gmail.com',
        password: 'Jordan123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful after password reset!');
      console.log('📋 Login details:');
      console.log('  Access token length:', loginData.access_token.length);
      console.log('  Refresh token length:', loginData.refresh_token?.length || 0);
      console.log('  Expires in:', loginData.expires_in, 'seconds');
      console.log('  Token type:', loginData.token_type);
      
      // Decode the token to check user info
      const tokenParts = loginData.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('\n👤 User info from token:');
        console.log('  Email:', payload.email);
        console.log('  Name:', payload.name);
        console.log('  Preferred username:', payload.preferred_username);
        console.log('  Subject:', payload.sub);
        console.log('  Issuer:', payload.iss);
        console.log('  Audience:', payload.aud);
      }
      
      console.log('\n🎯 Login is now working!');
      console.log('🔐 Credentials confirmed:');
      console.log('  Email: shareef.hiasat@gmail.com');
      console.log('  Password: Jordan123');
      console.log('  Role: super_admin');
      
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Login still failed:', errorData);
      console.log('  Error:', errorData.error_description || errorData.error);
      
      if (loginResponse.status === 401) {
        console.log('\n🔧 Additional troubleshooting needed...');
        console.log('1. Check if client is properly configured');
        console.log('2. Try logging in via Keycloak admin console');
        console.log('3. Check browser console for specific errors');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLoginAfterReset();
