/**
 * Test user creation with proper JSON
 */

const testUser = {
  email: 'testuser@example.com',
  displayName: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  role: 'student'
};

console.log('Testing user creation...');
console.log('Data:', JSON.stringify(testUser, null, 2));

const { exec } = require('child_process');

exec(`curl -X POST "http://localhost:8081/api/v1/users/admin/users" -H "Content-Type: application/json" -d '${JSON.stringify(testUser)}'`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log('✅ Response:', stdout);
});
