/**
 * Simple API Test
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: './.env' });

const baseUrl = process.env.API_BASE_URL || 'http://localhost:8080';
const apiVersion = process.env.API_VERSION || 'v1';

fetch(`${baseUrl}/api/${apiVersion}/programs`)
  .then(response => response.json())
  .then(data => console.log('Programs response:', data))
  .catch(error => console.error('Error:', error));
