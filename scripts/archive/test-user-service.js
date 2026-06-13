// Test userService API configuration
import { appConfig } from './client/src/services/config/apiConfig.js';
import { getAllUsers } from './client/src/services/business/userService.js';

console.log('Testing userService...');
console.log('API Base URL:', appConfig.getApiBaseUrl());
console.log('API Version:', appConfig.getApiVersion());

// Test getAllUsers (will fail without auth but should show correct URL)
getAllUsers()
  .then(result => {
    console.log('getAllUsers result:', result);
  })
  .catch(error => {
    console.log('Expected error (no auth):', error.message);
  });
