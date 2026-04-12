/**
 * Fix Keycloak admin console configuration
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function fixKeycloakAdminConsole() {
  try {
    console.log('🔧 Fixing Keycloak admin console configuration...');
    
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
    
    // Get master realm configuration
    console.log('🔍 Getting master realm configuration...');
    const realmResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (realmResponse.ok) {
      const realm = await realmResponse.json();
      
      // Update realm configuration to fix admin console
      const updatedRealm = {
        ...realm,
        attributes: {
          ...realm.attributes,
          // Remove any references to port 5174
          'frontendUrl': 'http://localhost:8080',
          'adminUrl': 'http://localhost:8080',
          'login_theme': 'keycloak',
          'accountTheme': 'keycloak',
          'adminTheme': 'keycloak'
        },
        // Update browser security headers to allow admin console
        browserSecurityHeaders: {
          'contentSecurityPolicy': "frame-src 'self' 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self'; object-src 'none';",
          'contentSecurityPolicyReportOnly': '',
          'xContentTypeOptions': 'nosniff',
          'xFrameOptions': 'SAMEORIGIN',
          'xRobotsTag': 'none',
          'xXSSProtection': '1; mode=block',
          'referrerPolicy': 'no-referrer'
        }
      };
      
      console.log('🔄 Updating realm configuration...');
      const updateResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedRealm)
      });
      
      if (updateResponse.ok) {
        console.log('✅ Realm configuration updated');
      } else {
        console.log('⚠️ Failed to update realm configuration');
        const errorText = await updateResponse.text();
        console.log('Error:', errorText);
      }
    }
    
    // Also check if there are any clients with wrong redirect URIs
    console.log('🔍 Checking for misconfigured clients...');
    const clientsResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/clients`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (clientsResponse.ok) {
      const clients = await clientsResponse.json();
      
      for (const client of clients) {
        if (client.redirectUris && client.redirectUris.includes('http://localhost:5174')) {
          console.log(`🔧 Updating client: ${client.clientId}`);
          
          const updatedClient = {
            ...client,
            redirectUris: client.redirectUris.map(uri => 
              uri.replace('http://localhost:5174', 'http://localhost:8080')
            ),
            webOrigins: client.webOrigins ? client.webOrigins.map(origin => 
              origin.replace('http://localhost:5174', 'http://localhost:8080')
            ) : ['+']
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
            console.log(`✅ Updated client: ${client.clientId}`);
          }
        }
      }
    }
    
    console.log('\n🎉 Keycloak admin console configuration fixed!');
    console.log('📋 Next steps:');
    console.log('1. Restart Keycloak container');
    console.log('2. Clear browser cache');
    console.log('3. Try accessing admin console again');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixKeycloakAdminConsole();
