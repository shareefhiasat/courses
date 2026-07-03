/**
 * Fix CSP and remove old realm references
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function fixCSPAndRealmReferences() {
  try {
    console.log('🔧 Fixing CSP and removing old realm references...');
    
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
    
    // Update master realm CSP to be more permissive for admin console
    console.log('🔧 Updating CSP configuration...');
    const realmResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (realmResponse.ok) {
      const realm = await realmResponse.json();
      
      // Update CSP to allow admin console to work properly
      const updatedRealm = {
        ...realm,
        browserSecurityHeaders: {
          'contentSecurityPolicy': "frame-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' blob: data:; media-src 'self' blob: data:;",
          'contentSecurityPolicyReportOnly': '',
          'xContentTypeOptions': 'nosniff',
          'xFrameOptions': 'ALLOW-FROM',
          'xRobotsTag': 'none',
          'xXSSProtection': '1; mode=block',
          'referrerPolicy': 'no-referrer'
        },
        attributes: {
          ...realm.attributes,
          'frontendUrl': 'http://localhost:8080',
          'adminUrl': 'http://localhost:8080',
          'login_theme': 'keycloak',
          'accountTheme': 'keycloak',
          'adminTheme': 'keycloak'
        }
      };
      
      const updateResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedRealm)
      });
      
      if (updateResponse.ok) {
        console.log('✅ CSP configuration updated');
      } else {
        console.log('⚠️ Failed to update CSP configuration');
      }
    }
    
    // Check and update military-lms-app client configuration
    console.log('🔧 Updating military-lms-app client...');
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
            'post.logout.redirect.uris': 'http://localhost:5174/* http://localhost:8080/*',
            'backchannel.logout.session.required': 'false',
            'display.on.consent.screen': 'false',
            'pkce.code.challenge.method': 'S256',
            'sso.session.max.age': '36000'
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
          console.log('✅ Client configuration updated');
        } else {
          console.log('⚠️ Failed to update client configuration');
        }
      }
    }
    
    console.log('\n🎉 Configuration updated!');
    console.log('📋 Next steps:');
    console.log('1. Restart Keycloak container');
    console.log('2. Clear browser cache completely');
    console.log('3. Try admin console again');
    console.log('4. If still issues, try in incognito mode');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixCSPAndRealmReferences();
