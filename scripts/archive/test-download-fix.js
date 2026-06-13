/**
 * Test script to verify download functionality
 * This script tests the download endpoint with proper file paths
 */

import https from 'https';
import fs from 'fs';

// Test data - simulate a file path that would come from the frontend
const testFilePath = 'Shared/1776271400848-teacher%20avaatar.png';

function testDownload() {
  const options = {
    hostname: 'localhost',
    port: 8001,
    path: `/api/v1/drive/files/${testFilePath}/download`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token', // This will fail auth but we can see if the route is found
      'Content-Type': 'application/json'
    },
    rejectUnauthorized: false // Allow self-signed certs
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Response body: ${data}`);
      
      if (res.statusCode === 404) {
        console.log('ERROR: Download endpoint not found - route issue');
      } else if (res.statusCode === 401) {
        console.log('SUCCESS: Download endpoint found but auth required (expected)');
      } else if (res.statusCode === 200) {
        console.log('SUCCESS: File download working');
      } else {
        console.log(`UNEXPECTED: Status code ${res.statusCode}`);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`Request error: ${error.message}`);
    console.error(`Full error:`, error);
  });

  req.end();
}

console.log('Testing download endpoint...');
testDownload();
