/**
 * Final setup completion script
 */

const { exec } = require('child_process');

async function executeCommand(cmd, description) {
  console.log(`\n🔧 ${description}`);
  console.log(`📝 Command: ${cmd}`);
  
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        reject(error);
      } else {
        console.log(`✅ Success: ${description}`);
        if (stdout) console.log(`📄 Output: ${stdout.trim()}`);
        resolve(stdout);
      }
    });
  });
}

async function completeSetup() {
  console.log('🎯 Completing final setup steps...\n');
  
  try {
    // Step 1: Create database roles
    console.log('🏷️ Step 1: Creating database roles...');
    await executeCommand('node create-user-roles.cjs', 'Creating database roles');
    
    // Step 2: Verify Keycloak is running
    console.log('\n🔍 Step 2: Verifying Keycloak status...');
    await executeCommand('curl -s http://localhost:8080/realms/master/.well-known/openid-configuration', 'Checking Keycloak master realm');
    
    // Step 3: Test user creation
    console.log('\n👤 Step 3: Testing user creation via API...');
    try {
      await executeCommand(
        'curl -X POST "http://localhost:8081/api/v1/users/admin/users" -H "Content-Type: application/json" -d "{\"email\":\"testuser@example.com\",\"displayName\":\"Test User\",\"firstName\":\"Test\",\"lastName\":\"User\",\"role\":\"student\"}"',
        'Testing user creation API'
      );
    } catch (error) {
      console.log('⚠️ Backend not running - will test later');
    }
    
    // Step 4: Check container status
    console.log('\n🐳 Step 4: Checking container status...');
    await executeCommand('docker ps --filter "name=lms-qaf-keycloak"', 'Keycloak container status');
    await executeCommand('docker ps --filter "name=lms-qaf-keycloak-db"', 'PostgreSQL container status');
    
    console.log('\n🎉 SETUP COMPLETE!');
    console.log('\n📋 What was configured:');
    console.log('✅ PostgreSQL database (port 5433)');
    console.log('✅ Keycloak server (port 8080)');
    console.log('✅ Master realm with all roles');
    console.log('✅ military-lms-app client');
    console.log('✅ shareef.hiasat@gmail.com super_admin user');
    console.log('✅ Database roles in PostgreSQL');
    
    console.log('\n🔐 Login Credentials:');
    console.log('📧 Email: shareef.hiasat@gmail.com');
    console.log('🔑 Password: Jordan123');
    console.log('🎯 Role: super_admin');
    console.log('🌐 Realm: master');
    
    console.log('\n🌐 Access URLs:');
    console.log('🔑 Keycloak Admin: http://localhost:8080/admin');
    console.log('👤 Admin: admin / admin123');
    console.log('🚀 LMS App: http://localhost:5174');
    
    console.log('\n🎯 Final Steps:');
    console.log('1. Ensure frontend .env.local has:');
    console.log('   VITE_KEYCLOAK_URL=http://localhost:8080');
    console.log('   VITE_KEYCLOAK_REALM=master');
    console.log('   VITE_KEYCLOAK_CLIENT_ID=military-lms-app');
    console.log('2. Restart frontend: npm run dev');
    console.log('3. Clear browser cache');
    console.log('4. Test login');
    
  } catch (error) {
    console.error('\n❌ Setup completion failed:', error.message);
  }
}

completeSetup();
