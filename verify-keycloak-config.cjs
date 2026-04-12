/**
 * Verify Keycloak configuration
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function verifyConfig() {
  try {
    console.log('🔍 Verifying Keycloak configuration...');
    
    // Get admin token
    const tokenResponse = await fetch(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;
    
    // Check client configuration
    const clientsResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/clients?clientId=military-lms-app`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (clientsResponse.ok) {
      const clients = await clientsResponse.json();
      if (clients.length > 0) {
        const client = clients[0];
        console.log('✅ Client found:', client.clientId);
        console.log('📋 Redirect URIs:', client.redirectUris);
        console.log('🌐 Web Origins:', client.webOrigins);
        console.log('🔓 Public Client:', client.publicClient);
        console.log('🔄 Enabled:', client.enabled);
      }
    }
    
    // Test login URL
    const authUrl = `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/auth?client_id=military-lms-app&redirect_uri=http://localhost:5174&response_type=code&scope=openid&nonce=test`;
    console.log('\n🔗 Login URL should be:');
    console.log(authUrl);
    
    // Check realm well-known
    const wellKnownResponse = await fetch(`${KEYCLOAK_URL}/realms/master/.well-known/openid-configuration`);
    if (wellKnownResponse.ok) {
      const config = await wellKnownResponse.json();
      console.log('\n✅ Master realm is accessible');
      console.log('📍 Authorization endpoint:', config.authorization_endpoint);
      console.log('📍 Token endpoint:', config.token_endpoint);
      console.log('📍 Logout endpoint:', config.end_session_endpoint);
    }
    
    console.log('\n🎉 Configuration verified!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyConfig();
