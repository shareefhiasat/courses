import { test, expect } from '@playwright/test';
import { testConfig } from '../config/test.config.js';

test.describe('Demo Test Suite - First Test with Reports', () => {
  
  test('1. Demo: Application Connectivity Check', async ({ page }) => {
    console.log('🚀 Starting demo test...');
    console.log('👤 Using test user:', testConfig.superAdmin.email);
    
    // Navigate to application
    await page.goto(testConfig.baseUrl);
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Check URL (should redirect to Keycloak)
    const currentUrl = page.url();
    console.log('🔍 Current URL:', currentUrl);
    
    // Verify it's a Keycloak redirect (expected)
    expect(currentUrl).toContain('localhost:8080');
    expect(currentUrl).toContain('military-lms');
    
    console.log('✅ Demo test passed - Application redirects to Keycloak as expected');
  });

  test('2. Demo: Keycloak Health Check', async ({ request }) => {
    console.log('🔍 Testing Keycloak health...');
    
    // Test Keycloak realm configuration
    const response = await request.get(`${testConfig.keycloakUrl}/realms/${testConfig.keycloakRealm}/.well-known/openid-configuration`);
    
    expect(response.status()).toBe(200);
    const config = await response.json();
    expect(config.issuer).toBeTruthy();
    expect(config.authorization_endpoint).toBeTruthy();
    
    console.log('✅ Demo test passed - Keycloak is healthy');
    console.log('🔐 Realm issuer:', config.issuer);
  });

  test('3. Demo: Environment Configuration Check', async ({ page }) => {
    console.log('🔍 Checking test configuration...');
    
    // Log configuration (without sensitive data)
    console.log('🌐 Base URL:', testConfig.baseUrl);
    console.log('🏛️ Keycloak URL:', testConfig.keycloakUrl);
    console.log('👤 Test User:', testConfig.superAdmin.email);
    console.log('🔑 Client ID:', testConfig.keycloakClientId);
    
    // Verify configuration is loaded
    expect(testConfig.baseUrl).toBeTruthy();
    expect(testConfig.superAdmin.email).toBeTruthy();
    
    console.log('✅ Demo test passed - Configuration loaded successfully');
  });

});
