/**
 * Start standalone Keycloak
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting standalone Keycloak...');

// Check if Keycloak is downloaded
const fs = require('fs');
const keycloakPath = path.join(__dirname, 'keycloak-26.0.0');

if (!fs.existsSync(keycloakPath)) {
  console.log('📦 Keycloak not found. Please download it first:');
  console.log('1. Visit: https://www.keycloak.org/downloads');
  console.log('2. Download Keycloak 26.0.0 (ZIP)');
  console.log('3. Extract to: keycloak-26.0.0 folder in project root');
  process.exit(1);
}

// Start Keycloak
const keycloakProcess = spawn('cmd', ['/c', 'cd', keycloakPath, '&&', 'bin\\kc.bat', 'start-dev'], {
  stdio: 'inherit',
  shell: true
});

keycloakProcess.on('close', (code) => {
  console.log(`Keycloak process exited with code ${code}`);
});

keycloakProcess.on('error', (err) => {
  console.error('Failed to start Keycloak:', err);
});

console.log('⏳ Keycloak starting...');
console.log('🌐 Will be available at: http://localhost:8080');
console.log('👤 Admin console: http://localhost:8080/admin');
console.log('🔑 Admin credentials: admin / admin123');
