/**
 * Fix Keycloak logout redirect URI issue
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function fixLogoutRedirectURI() {
  try {
    console.log('🔧 Fixing Keycloak logout redirect URI...');
    
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
    
    // Get military-lms-app client
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
        console.log(`🔧 Updating client: ${client.clientId}`);
        
        // Update client with proper logout redirect URIs
        const updatedClient = {
          ...client,
          enabled: true,
          publicClient: true,
          standardFlowEnabled: true,
          implicitFlowEnabled: false,
          directAccessGrantsEnabled: true,
          serviceAccountsEnabled: false,
          consentRequired: false,
          clientAuthenticatorType: 'public-client',
          redirectUris: [
            'http://localhost:5174/*',
            'http://localhost:5174',
            'http://localhost:3000/*',
            'http://localhost:3000',
            'http://localhost:8080/*',
            'http://localhost:8080'
          ],
          webOrigins: [
            'http://localhost:5174',
            'http://localhost:3000',
            'http://localhost:8080',
            '+',
            '*'
          ],
          rootUrl: 'http://localhost:5174',
          baseUrl: '/',
          adminUrl: 'http://localhost:8080',
          frontchannelLogout: true,
          attributes: {
            ...client.attributes,
            'post.logout.redirect.uris': 'http://localhost:5174/* http://localhost:3000/* http://localhost:8080/*',
            'backchannel.logout.session.required': 'false',
            'display.on.consent.screen': 'false',
            'pkce.code.challenge.method': 'S256',
            'sso.session.max.age': '36000',
            'logout.redirect.uri': 'http://localhost:5174',
            'frontchannel.logout.url': 'http://localhost:5174'
          }
        };
        
        const clientUpdateResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/clients/${client.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedClient)
        });
        
        if (clientUpdateResponse.ok) {
          console.log('✅ Client configuration updated successfully');
          console.log('📋 Added logout redirect URIs:');
          console.log('   - http://localhost:5174/*');
          console.log('   - http://localhost:3000/*');
          console.log('   - http://localhost:8080/*');
        } else {
          console.log('⚠️ Failed to update client configuration');
          const errorText = await clientUpdateResponse.text();
          console.log('Error:', errorText);
        }
      }
    }
    
    console.log('\n🎉 Logout redirect URI fix completed!');
    console.log('📋 Next steps:');
    console.log('1. Clear browser cache');
    console.log('2. Try logout again');
    console.log('3. Should redirect properly to http://localhost:5174');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixLogoutRedirectURI();
