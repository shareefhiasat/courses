/**
 * Fix Keycloak client configuration in master realm
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function fixKeycloakClientConfig() {
  try {
    console.log('🔧 Fixing Keycloak client configuration...');
    
    // Get admin token from master realm
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
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to get admin token');
    }
    
    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;
    console.log('✅ Master admin token obtained');
    
    // Check if military-lms-app client exists in master realm
    console.log('🔍 Checking for military-lms-app client in master realm...');
    
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
        console.log(`✅ Found client: ${client.clientId} (ID: ${client.id})`);
        
        // Update client configuration
        console.log('🔄 Updating client configuration...');
        
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
            'http://localhost:3000'
          ],
          webOrigins: [
            'http://localhost:5174',
            'http://localhost:3000',
            '+'
          ],
          rootUrl: 'http://localhost:5174',
          baseUrl: '/',
          adminUrl: '/',
          frontchannelLogout: true,
          attributes: {
            'post.logout.redirect.uris': 'http://localhost:5174/*',
            'backchannel.logout.session.required': 'false',
            'display.on.consent.screen': 'false',
            'oauth2.device.authorization.grant.enabled': 'false',
            'pkce.code.challenge.method': 'S256',
            'saml.assertion.signature': 'RSA_SHA256',
            'saml.multivalued.roles': 'false',
            'saml.force.post.binding': 'false',
            'saml.server.signature': 'false',
            'saml.server.signature.keyinfo.ext': 'false',
            'exclude.session.state.from.auth.response': 'false',
            'saml_force_name_id_format': 'false',
            'saml.client.signature': 'false',
            'tls.client.certificate.bound.access.tokens': 'false',
            'saml.authnstatement': 'false',
            'front.channel.logout.session.required': 'false',
            'acr.loa.map': '{}',
            'require.pushed.authorization.requests': 'false',
            'login_theme': 'keycloak',
            'ciba.auth.required': 'false',
            'saml_ecp_flow_enabled': 'false',
            'backchannel.logout.revoke.offline.tokens': 'false'
          }
        };
        
        const updateResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/clients/${client.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedClient)
        });
        
        if (updateResponse.ok) {
          console.log('✅ Client configuration updated successfully');
        } else {
          console.log('⚠️ Failed to update client configuration');
          const errorText = await updateResponse.text();
          console.log('Error:', errorText);
        }
        
      } else {
        console.log('❌ Client military-lms-app not found in master realm');
        console.log('🔨 Creating new client...');
        
        // Create the client
        const newClient = {
          clientId: 'military-lms-app',
          name: 'Military LMS Frontend',
          description: 'Frontend application for Military LMS',
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
            'http://localhost:3000'
          ],
          webOrigins: [
            'http://localhost:5174',
            'http://localhost:3000',
            '+'
          ],
          rootUrl: 'http://localhost:5174',
          baseUrl: '/',
          adminUrl: '/',
          frontchannelLogout: true
        };
        
        const createResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master/clients`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newClient)
        });
        
        if (createResponse.ok) {
          console.log('✅ Client created successfully');
        } else {
          console.log('❌ Failed to create client');
          const errorText = await createResponse.text();
          console.log('Error:', errorText);
        }
      }
    }
    
    // Also check and update realm settings
    console.log('🔍 Checking master realm settings...');
    
    const realmResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (realmResponse.ok) {
      const realm = await realmResponse.json();
      
      // Update realm settings to allow proper redirects
      const updatedRealm = {
        ...realm,
        browserSecurityHeaders: {
          'contentSecurityPolicy': "frame-src 'self'; frame-ancestors 'self'; object-src 'none';",
          'contentSecurityPolicyReportOnly': '',
          'xContentTypeOptions': 'nosniff',
          'xFrameOptions': 'SAMEORIGIN',
          'xRobotsTag': 'none',
          'xXSSProtection': '1; mode=block',
          'referrerPolicy': 'no-referrer',
          'strictTransportSecurity': 'max-age=31536000; includeSubDomains'
        },
        attributes: {
          ...realm.attributes,
          'frontendUrl': 'http://localhost:5174',
          'postBindingLogoutForSamlFlow': 'false',
          'oauth2DeviceAuthorizationGrantEnabled': 'false',
          'oauth2DeviceCodeLifespan': '600',
          'oauth2DevicePollingInterval': '5'
        }
      };
      
      const realmUpdateResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/master`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedRealm)
      });
      
      if (realmUpdateResponse.ok) {
        console.log('✅ Master realm settings updated');
      } else {
        console.log('⚠️ Failed to update realm settings');
      }
    }
    
    console.log('\n🎉 Keycloak configuration fixed!');
    console.log('📋 Next steps:');
    console.log('1. Clear browser cache and cookies');
    console.log('2. Restart frontend application');
    console.log('3. Try login again');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixKeycloakClientConfig();
