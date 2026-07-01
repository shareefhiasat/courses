/**
 * Test user creation with proper escaping
 */

const { exec } = require('child_process');

const testData = {
  email: 'testuser@example.com',
  displayName: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  role: 'student'
};

console.log('Testing user creation...');
console.log('Data:', JSON.stringify(testData, null, 2));

// Create a temporary JSON file
const fs = require('fs');
const tempFile = 'temp-user-data.json';
fs.writeFileSync(tempFile, JSON.stringify(testData, null, 2));

exec(`curl -X POST "http://localhost:8081/api/v1/users/admin/users" -H "Content-Type: application/json" -d @${tempFile}`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log('✅ Response:', stdout);
  
  // Clean up
  fs.unlinkSync(tempFile);
});
