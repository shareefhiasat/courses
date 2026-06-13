/**
 * Check current Keycloak configuration
 */

console.log('🔍 Checking Keycloak configuration...');
console.log('VITE_KEYCLOAK_URL:', import.meta.env.VITE_KEYCLOAK_URL);
console.log('VITE_KEYCLOAK_REALM:', import.meta.env.VITE_KEYCLOAK_REALM);
console.log('VITE_KEYCLOAK_CLIENT_ID:', import.meta.env.VITE_KEYCLOAK_CLIENT_ID);

// Check what's actually configured
const config = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID
};

console.log('📋 Full Keycloak config:', config);

// Expected values for military-lms
const expected = {
  url: 'http://localhost:8080',
  realm: 'military-lms',
  clientId: 'military-lms-app' // or whatever the correct client ID is
};

console.log('✅ Expected config:', expected);

// Check if configuration matches
const isConfigCorrect = 
  config.url === expected.url &&
  config.realm === expected.realm;

console.log('🎯 Configuration correct:', isConfigCorrect);

if (!isConfigCorrect) {
  console.log('⚠️ Configuration issues found:');
  if (config.url !== expected.url) {
    console.log(`  - URL: got "${config.url}", expected "${expected.url}"`);
  }
  if (config.realm !== expected.realm) {
    console.log(`  - Realm: got "${config.realm}", expected "${expected.realm}"`);
  }
  if (config.clientId !== expected.clientId) {
    console.log(`  - Client ID: got "${config.clientId}", expected "${expected.clientId}"`);
  }
} else {
  console.log('🎉 Configuration looks good!');
}
