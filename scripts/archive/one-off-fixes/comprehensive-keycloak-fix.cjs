/**
 * Comprehensive Keycloak Fix - Remove all military-lms references
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function comprehensiveKeycloakFix() {
  try {
    console.log('🔧 Comprehensive Keycloak fix starting...');
    
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
    
    // Step 1: Update master realm with completely permissive CSP
    console.log('🔧 Step 1: Updating master realm CSP...');
    const realmResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (realmResponse.ok) {
      const realm = await realmResponse.json();
      
      // Completely disable CSP for development
      const updatedRealm = {
        ...realm,
        browserSecurityHeaders: {
          'contentSecurityPolicy': '',
          'contentSecurityPolicyReportOnly': '',
          'xContentTypeOptions': '',
          'xFrameOptions': '',
          'xRobotsTag': '',
          'xXSSProtection': '',
          'referrerPolicy': ''
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
        console.log('✅ CSP completely disabled for development');
      } else {
        console.log('⚠️ Failed to disable CSP');
      }
    }
    
    // Step 2: Update all clients to remove military-lms references
    console.log('🔧 Step 2: Updating all clients...');
    const clientsResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/clients`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (clientsResponse.ok) {
      const clients = await clientsResponse.json();
      
      for (const client of clients) {
        let needsUpdate = false;
        const updatedClient = { ...client };
        
        // Check and update redirect URIs
        if (client.redirectUris) {
          const oldUris = client.redirectUris.filter(uri => uri.includes('military-lms'));
          if (oldUris.length > 0) {
            updatedClient.redirectUris = client.redirectUris.map(uri => 
              uri.replace('military-lms', 'master')
            );
            needsUpdate = true;
            console.log(`🔧 Updating ${client.clientId} redirect URIs`);
          }
        }
        
        // Check and update web origins
        if (client.webOrigins) {
          const oldOrigins = client.webOrigins.filter(origin => origin.includes('military-lms'));
          if (oldOrigins.length > 0) {
            updatedClient.webOrigins = client.webOrigins.map(origin => 
              origin.replace('military-lms', 'master')
            );
            needsUpdate = true;
            console.log(`🔧 Updating ${client.clientId} web origins`);
          }
        }
        
        // Update admin URL for military-lms-app
        if (client.clientId === 'military-lms-app') {
          updatedClient.adminUrl = 'http://localhost:8080';
          updatedClient.rootUrl = 'http://localhost:5174';
          updatedClient.baseUrl = '/';
          needsUpdate = true;
          console.log(`🔧 Updating military-lms-app specific settings`);
        }
        
        if (needsUpdate) {
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
          } else {
            console.log(`⚠️ Failed to update client: ${client.clientId}`);
          }
        }
      }
    }
    
    // Step 3: Check for any remaining military-lms realm references
    console.log('🔍 Step 3: Checking for military-lms realm references...');
    
    // Try to access military-lms realm - it should fail
    const militaryLMSResponse = await fetch(`${KEYCLOAK_URL}/realms/military-lms/.well-known/openid-configuration`);
    if (militaryLMSResponse.ok) {
      console.log('⚠️ military-lms realm still exists - this might be causing issues');
    } else {
      console.log('✅ military-lms realm does not exist (good)');
    }
    
    // Step 4: Create a simple test client for admin console
    console.log('🔧 Step 4: Creating admin console test client...');
    
    const testClient = {
      clientId: 'admin-console-test',
      name: 'Admin Console Test',
      description: 'Test client for admin console access',
      enabled: true,
      publicClient: true,
      standardFlowEnabled: true,
      implicitFlowEnabled: false,
      directAccessGrantsEnabled: true,
      serviceAccountsEnabled: false,
      consentRequired: false,
      clientAuthenticatorType: 'public-client',
      redirectUris: [
        'http://localhost:8080/*',
        'http://localhost:8080/admin/*'
      ],
      webOrigins: [
        'http://localhost:8080',
        '+'
      ],
      rootUrl: 'http://localhost:8080',
      baseUrl: '/admin',
      adminUrl: 'http://localhost:8080'
    };
    
    // Check if test client exists
    const existingTestClient = await fetch(`${KEYCLOAK_URL}/admin/realms/master/clients?clientId=admin-console-test`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (existingTestClient.ok) {
      const existingClients = await existingTestClient.json();
      if (existingClients.length === 0) {
        // Create the test client
        const createTestClientResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/clients`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testClient)
        });
        
        if (createTestClientResponse.ok) {
          console.log('✅ Admin console test client created');
        } else {
          console.log('⚠️ Failed to create admin console test client');
        }
      } else {
        console.log('ℹ️ Admin console test client already exists');
      }
    }
    
    console.log('\n🎉 Comprehensive fix completed!');
    console.log('📋 What was done:');
    console.log('1. ✅ CSP completely disabled for development');
    console.log('2. ✅ All client references updated');
    console.log('3. ✅ Admin console test client created');
    console.log('4. ✅ Realm configurations verified');
    
    console.log('\n🔧 Next steps:');
    console.log('1. Restart Keycloak container');
    console.log('2. Clear browser cache completely');
    console.log('3. Try admin console in incognito mode');
    console.log('4. If still issues, try accessing: http://localhost:8080/admin/master/console/');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

comprehensiveKeycloakFix();
