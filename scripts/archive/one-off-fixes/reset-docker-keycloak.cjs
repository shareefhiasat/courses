/**
 * Reset Docker Keycloak with clean configuration
 */

const { exec } = require('child_process');

console.log('🔄 Resetting Docker Keycloak...');

const commands = [
  // Stop and remove existing container
  'docker stop lms-qaf-keycloak',
  'docker rm lms-qaf-keycloak',
  
  // Remove volume (optional - will delete all data)
  // 'docker volume rm lms-qaf-keycloak-data',
  
  // Start fresh Keycloak with master realm focus
  'docker run -d --name lms-qaf-keycloak-new -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin123 -e KC_FEATURES=preview quay.io/keycloak/keycloak:26.0 start-dev'
];

async function executeCommands() {
  for (const cmd of commands) {
    console.log(`🔧 Executing: ${cmd}`);
    try {
      await new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            console.log(`⚠️ Warning: ${error.message}`);
          }
          console.log(`✅ Done: ${cmd}`);
          resolve();
        });
      });
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Docker Keycloak reset complete!');
  console.log('🌐 Available at: http://localhost:8080');
  console.log('👤 Admin console: http://localhost:8080/admin');
  console.log('🔑 Admin credentials: admin / admin123');
  console.log('\n⚠️ Note: You will need to recreate the master realm configuration');
}

executeCommands();
