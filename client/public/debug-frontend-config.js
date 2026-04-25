/**
 * Debug frontend configuration
 */

console.log('🔍 Debugging frontend configuration...\n');

// Check what environment variables are being used
console.log('🌐 Frontend Environment Variables:');
console.log('VITE_KEYCLOAK_URL:', import.meta.env.VITE_KEYCLOAK_URL || 'NOT SET');
console.log('VITE_KEYCLOAK_REALM:', import.meta.env.VITE_KEYCLOAK_REALM || 'NOT SET');
console.log('VITE_KEYCLOAK_CLIENT_ID:', import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'NOT SET');

// Check what the Keycloak config is using
console.log('\n🔧 Keycloak Configuration:');

// Try to access the keycloak config
try {
  const config = {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'military-lms',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'military-lms-app'
  };
  
  console.log('URL:', config.url);
  console.log('Realm:', config.realm);
  console.log('Client ID:', config.clientId);
  
  // Show what the 3p-cookies URL would be
  const cookiesUrl = `${config.url}/realms/${config.realm}/protocol/openid-connect/3p-cookies/step1.html`;
  console.log('\n🍪 3p-cookies URL that would be used:', cookiesUrl);
  
  if (config.realm === 'military-lms') {
    console.log('\n❌ PROBLEM FOUND: Frontend is still using military-lms realm!');
    console.log('🔧 SOLUTION: Update your frontend environment variables');
  } else {
    console.log('\n✅ Frontend realm configuration looks correct');
  }
  
} catch (error) {
  console.log('❌ Error accessing config:', error.message);
}

console.log('\n📋 What to check:');
console.log('1. client/.env.local file');
console.log('2. client/src/config/keycloak.js');
console.log('3. client/src/services/config/apiConfig.js');
console.log('4. Browser localStorage (might have cached realm)');

// Check localStorage
if (typeof localStorage !== 'undefined') {
  console.log('\n💾 LocalStorage check:');
  const keycloakToken = localStorage.getItem('keycloak_token');
  if (keycloakToken) {
    console.log('Found keycloak_token in localStorage - might contain old realm info');
  }
  
  // Check for any cached realm info
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.toLowerCase().includes('keycloak') || key.toLowerCase().includes('realm')) {
      console.log(`Found localStorage key: ${key}`);
    }
  }
}
