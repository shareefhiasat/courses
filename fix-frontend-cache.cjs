/**
 * Fix Frontend Cache and Configuration
 */

console.log('🔧 Fixing Frontend Cache and Configuration...\n');

console.log('🔍 The issue is that your frontend is still trying to access military-lms realm.');
console.log('This is because of browser cache or stored configuration.\n');

console.log('📋 SOLUTION STEPS:\n');

console.log('1️⃣ CREATE .env.local FILE:');
console.log('Create this file: client/.env.local');
console.log('Add these contents:');
console.log('');
console.log('VITE_KEYCLOAK_URL=http://localhost:8080');
console.log('VITE_KEYCLOAK_REALM=master');
console.log('VITE_KEYCLOAK_CLIENT_ID=military-lms-app');
console.log('');

console.log('2️⃣ CLEAR BROWSER DATA:');
console.log('Open Chrome DevTools (F12)');
console.log('Go to Application → Storage');
console.log('Click "Clear site data"');
console.log('Or press Ctrl+Shift+Del and clear everything\n');

console.log('3️⃣ CLEAR LOCAL STORAGE:');
console.log('Open browser console');
console.log('Run this command:');
console.log('localStorage.clear();');
console.log('sessionStorage.clear();\n');

console.log('4️⃣ RESTART FRONTEND:');
console.log('Stop your frontend server (Ctrl+C)');
console.log('Restart with: npm run dev\n');

console.log('5️⃣ VERIFY CONFIGURATION:');
console.log('After restart, open: http://localhost:5174/debug-frontend-config.js');
console.log('This will show what environment variables are being used\n');

console.log('🧪 TEST THE FIX:');
console.log('1. Create the .env.local file');
console.log('2. Clear browser data completely');
console.log('3. Restart frontend');
console.log('4. Try accessing: http://localhost:8080/admin/');
console.log('5. Should no longer see military-lms references\n');

console.log('💡 If you still see military-lms:');
console.log('1. Try incognito mode');
console.log('2. Try different browser');
console.log('3. Check if any hardcoded references exist\n');

console.log('🔧 QUICK FIX COMMANDS:');
console.log('In browser console, run:');
console.log('// Clear all storage');
console.log('localStorage.clear();');
console.log('sessionStorage.clear();');
console.log('');
console.log('// Check what realm is being used');
console.log('console.log("Realm:", import.meta.env.VITE_KEYCLOAK_REALM);');
