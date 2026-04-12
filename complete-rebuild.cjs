/**
 * Complete Keycloak & Database Rebuild
 * Clean setup from scratch with all configurations
 */

const { exec } = require('child_process');
const { spawn } = require('child_process');

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

async function checkContainerHealth(containerName, maxAttempts = 30) {
  console.log(`\n🏥 Checking ${containerName} health...`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const cmd = `docker inspect --format='{{.State.Health.Status}}' ${containerName}`;
      const { exec } = require('child_process');
      
      const status = await new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            resolve('starting');
          } else {
            resolve(stdout.trim());
          }
        });
      });
      
      console.log(`📊 Health check ${i + 1}/${maxAttempts}: ${status}`);
      
      if (status === 'healthy') {
        console.log(`✅ ${containerName} is healthy!`);
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`⏳ Waiting for ${containerName} to start...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`⚠️ ${containerName} health check timeout`);
  return false;
}

async function rebuildEverything() {
  console.log('🚀 Starting complete Keycloak & Database rebuild...\n');
  
  try {
    // Step 1: Start PostgreSQL
    console.log('\n📊 Step 1: Starting PostgreSQL...');
    await executeCommand(
      'docker run -d --name lms-qaf-keycloak-db -p 5433:5432 -e POSTGRES_DB=keycloak -e POSTGRES_USER=keycloak -e POSTGRES_PASSWORD=keycloak123 postgres:15-alpine',
      'Starting PostgreSQL database'
    );
    
    // Wait for PostgreSQL to be healthy
    await checkContainerHealth('lms-qaf-keycloak-db');
    
    // Step 2: Start Keycloak
    console.log('\n🔐 Step 2: Starting Keycloak...');
    await executeCommand(
      'docker run -d --name lms-qaf-keycloak --link lms-qaf-keycloak-db:postgres -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin123 -e KC_DB=postgres -e KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak -e KC_DB_USERNAME=keycloak -e KC_DB_PASSWORD=keycloak123 -e KC_FEATURES=preview quay.io/keycloak/keycloak:26.0 start-dev',
      'Starting Keycloak server'
    );
    
    // Wait for Keycloak to be healthy
    await checkContainerHealth('lms-qaf-keycloak');
    
    // Step 3: Wait for Keycloak to fully start
    console.log('\n⏳ Step 3: Waiting for Keycloak to fully initialize...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Step 4: Verify Keycloak is accessible
    console.log('\n🔍 Step 4: Verifying Keycloak accessibility...');
    try {
      await executeCommand('curl -s http://localhost:8080/health', 'Keycloak health check');
    } catch (error) {
      console.log('⏳ Keycloak still starting, waiting longer...');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
    
    // Step 5: Run our configuration scripts
    console.log('\n⚙️ Step 5: Configuring Keycloak...');
    
    // Import our setup functions
    const setupKeycloak = require('./cleanup-keycloak-realms.cjs');
    const fixClientConfig = require('./fix-keycloak-client-config.cjs');
    const verifyConfig = require('./verify-keycloak-config.cjs');
    
    console.log('🏛️ Setting up master realm...');
    await new Promise((resolve) => {
      // Override the cleanup function to just setup master
      const originalLog = console.log;
      console.log = (...args) => {
        originalLog(...args);
        if (args[0] === '🎉 Master realm setup complete!') {
          resolve();
        }
      };
      setupKeycloak();
    });
    
    console.log('🔧 Fixing client configuration...');
    await new Promise((resolve) => {
      const originalLog = console.log;
      console.log = (...args) => {
        originalLog(...args);
        if (args[0] === '🎉 Keycloak configuration fixed!') {
          resolve();
        }
      };
      fixClientConfig();
    });
    
    console.log('🔍 Verifying final configuration...');
    await new Promise((resolve) => {
      const originalLog = console.log;
      console.log = (...args) => {
        originalLog(...args);
        if (args[0] === '🎉 Configuration verified!') {
          resolve();
        }
      };
      verifyConfig();
    });
    
    // Step 6: Create database roles
    console.log('\n🏷️ Step 6: Creating database roles...');
    const createRoles = require('./create-user-roles.cjs');
    await new Promise((resolve) => {
      const originalLog = console.log;
      console.log = (...args) => {
        originalLog(...args);
        if (args[0] === '🎉 User roles setup complete!') {
          resolve();
        }
      };
      createRoles();
    });
    
    console.log('\n🎉 COMPLETE REBUILD SUCCESSFUL!');
    console.log('\n📋 Summary:');
    console.log('✅ PostgreSQL database running on port 5433');
    console.log('✅ Keycloak server running on port 8080');
    console.log('✅ Master realm configured with all roles');
    console.log('✅ military-lms-app client configured');
    console.log('✅ shareef.hiasat@gmail.com user created as super_admin');
    console.log('✅ Database roles created in PostgreSQL');
    
    console.log('\n🔐 Login Credentials:');
    console.log('📧 Email: shareef.hiasat@gmail.com');
    console.log('🔑 Password: Jordan123');
    console.log('🎯 Role: super_admin');
    console.log('🌐 Realm: master');
    
    console.log('\n🌐 Access URLs:');
    console.log('🔑 Keycloak Admin Console: http://localhost:8080/admin');
    console.log('👤 Admin credentials: admin / admin123');
    console.log('🚀 LMS Application: http://localhost:5174');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Ensure frontend .env.local is configured correctly');
    console.log('2. Restart frontend application');
    console.log('3. Test login functionality');
    console.log('4. Test user creation in UsersPage');
    
  } catch (error) {
    console.error('\n❌ Rebuild failed:', error.message);
    console.log('\n🔧 Manual cleanup might be required:');
    console.log('docker stop lms-qaf-keycloak lms-qaf-keycloak-db');
    console.log('docker rm lms-qaf-keycloak lms-qaf-keycloak-db');
    console.log('docker volume prune -f');
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Rebuild interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Rebuild terminated');
  process.exit(0);
});

// Start the rebuild
rebuildEverything();
