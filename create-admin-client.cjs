/**
 * Create admin-cli client in military-lm realm
 */

const KEYCLOAK_URL = 'http://localhost:8080';

async function createAdminClient() {
  try {
    console.log('🔧 Creating admin-cli client in military-lm realm...');
    
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
    
    // Create admin-cli client
    const clientData = {
      clientId: 'admin-cli',
      name: 'admin-cli',
      description: 'Admin CLI Client for Military LMS',
      enabled: true,
      clientAuthenticatorType: 'client-secret',
      secret: 'admin-cli-secret',
      directAccessGrantsEnabled: true,
      serviceAccountsEnabled: true,
      standardFlowEnabled: false,
      implicitFlowEnabled: false,
      publicClient: false,
      protocol: 'openid-connect',
      fullScopeAllowed: true
    };
    
    console.log('🔧 Creating admin-cli client...');
    const clientResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/military-lm/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clientData)
    });
    
    if (clientResponse.ok) {
      console.log('✅ admin-cli client created successfully!');
      
      // Test connection with military-lm realm
      console.log('🔍 Testing connection with military-lm realm...');
      const testTokenResponse = await fetch(`${KEYCLOAK_URL}/realms/military-lm/protocol/openid-connect/token`, {
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
      
      if (testTokenResponse.ok) {
        const testTokenData = await testTokenResponse.json();
        console.log('✅ Successfully connected to military-lm realm!');
        console.log('🔑 Token length:', testTokenData.access_token?.length || 0);
        
        // Try to list users
        const usersResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/military-lm/users`, {
          headers: {
            'Authorization': `Bearer ${testTokenData.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (usersResponse.ok) {
          const users = await usersResponse.json();
          console.log(`✅ Found ${users.length} users in military-lm realm`);
          console.log('👥 Users:', users.map(u => u.email || u.username).join(', '));
        }
        
      } else {
        const errorData = await testTokenResponse.json();
        console.log('❌ Failed to get token from military-lm:', errorData);
      }
      
    } else {
      const errorData = await clientResponse.text();
      console.log('❌ Failed to create admin-cli client:', clientResponse.status, errorData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminClient();
