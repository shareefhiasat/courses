/**
 * Debug and fix logout 400 error
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function debugLogoutError() {
  try {
    console.log('🔍 Debugging logout 400 error...\n');
    
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
    console.log('✅ Admin token obtained');
    
    // Get current client configuration
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
        console.log('🔍 Current client configuration:');
        console.log('Redirect URIs:', client.redirectUris);
        console.log('Web Origins:', client.webOrigins);
        console.log('Attributes:', client.attributes);
        
        // The issue might be that we need to add the exact redirect URI without wildcard
        const updatedClient = {
          ...client,
          redirectUris: [
            'http://localhost:5174',
            'http://localhost:5174/*',
            'http://localhost:3000',
            'http://localhost:3000/*',
            'http://localhost:8080/*'
          ],
          webOrigins: [
            'http://localhost:5174',
            'http://localhost:3000',
            'http://localhost:8080',
            '+',
            '*'
          ],
          attributes: {
            ...client.attributes,
            'post.logout.redirect.uris': 'http://localhost:5174',
            'backchannel.logout.session.required': 'false',
            'display.on.consent.screen': 'false',
            'pkce.code.challenge.method': 'S256',
            'sso.session.max.age': '36000',
            'logout.redirect.uri': 'http://localhost:5174',
            'frontchannel.logout.url': 'http://localhost:5174'
          }
        };
        
        console.log('\n🔧 Updating client with exact redirect URI...');
        const clientUpdateResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/clients/${client.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedClient)
        });
        
        if (clientUpdateResponse.ok) {
          console.log('✅ Client configuration updated');
        } else {
          console.log('⚠️ Failed to update client');
        }
      }
    }
    
    console.log('\n🔍 The 400 error might be due to:');
    console.log('1. Invalid id_token_hint');
    console.log('2. Missing or invalid session');
    console.log('3. Client configuration issue');
    
    console.log('\n🔧 Alternative logout approach:');
    console.log('Try calling logout without post_logout_redirect_uri:');
    console.log('await keycloak.logout();');
    console.log('Or with a simpler redirect:');
    console.log('await keycloak.logout({ redirectUri: "http://localhost:5174" });');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugLogoutError();
