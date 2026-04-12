/**
 * Check current Keycloak configuration
 */

// This will show what environment variables are being used
console.log('🔍 Current Keycloak Configuration:');
console.log('VITE_KEYCLOAK_URL:', import.meta.env.VITE_KEYCLOAK_URL || 'NOT SET');
console.log('VITE_KEYCLOAK_REALM:', import.meta.env.VITE_KEYCLOAK_REALM || 'NOT SET');
console.log('VITE_KEYCLOAK_CLIENT_ID:', import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'NOT SET');

// This is what should be configured
console.log('\n✅ Expected Configuration:');
console.log('VITE_KEYCLOAK_URL: http://localhost:8080');
console.log('VITE_KEYCLOAK_REALM: master');
console.log('VITE_KEYCLOAK_CLIENT_ID: military-lms-app');

// Check if configuration is correct
const isCorrect = 
  import.meta.env.VITE_KEYCLOAK_URL === 'http://localhost:8080' &&
  import.meta.env.VITE_KEYCLOAK_REALM === 'master';

console.log('\n🎯 Configuration Correct:', isCorrect);

if (!isCorrect) {
  console.log('\n⚠️ Please create/update your .env.local file with:');
  console.log('VITE_KEYCLOAK_URL=http://localhost:8080');
  console.log('VITE_KEYCLOAK_REALM=master');
  console.log('VITE_KEYCLOAK_CLIENT_ID=military-lms-app');
}
