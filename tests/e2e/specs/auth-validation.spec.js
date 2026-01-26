/**
 * Authentication Validation Tests
 * Tests all validation rules for login and signup forms
 * Based on code validations found in AuthForm.jsx
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testConfig, testData, tags } from '../config/test-config';

test.describe('Authentication Validation', () => {
  
  test.describe('Login Validation', () => {
    test(`TC-AUTH-VAL-001: Cannot login without email ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // Try to submit without email
      await loginPage.submitButton.click();
      
      // HTML5 validation should prevent submission
      const emailInput = loginPage.emailInput;
      const isInvalid = await emailInput.evaluate(el => el.validity.valueMissing);
      expect(isInvalid).toBeTruthy();
    });

    test(`TC-AUTH-VAL-002: Cannot login without password ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // Fill email but not password
      await loginPage.emailInput.fill('test@example.com');
      await loginPage.submitButton.click();
      
      // HTML5 validation should prevent submission
      const passwordInput = loginPage.passwordInput;
      const isInvalid = await passwordInput.evaluate(el => el.validity.valueMissing);
      expect(isInvalid).toBeTruthy();
    });

    test(`TC-AUTH-VAL-003: Cannot login with invalid email format ${tags.critical}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // Fill invalid email
      await loginPage.emailInput.fill('invalid-email');
      await loginPage.passwordInput.fill('password123');
      await loginPage.submitButton.click();
      
      // HTML5 validation should prevent submission
      const emailInput = loginPage.emailInput;
      const isInvalid = await emailInput.evaluate(el => el.validity.typeMismatch);
      expect(isInvalid).toBeTruthy();
    });

    test(`TC-AUTH-VAL-004: Shows error for invalid credentials ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.login('invalid@test.com', 'wrongpassword');
      
      // Should show error message
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.toLowerCase()).toContain('error');
    });
  });

  test.describe('Signup Validation', () => {
    test(`TC-AUTH-VAL-005: Cannot signup without email ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // Switch to signup
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      // Try to submit without email
      await page.locator('button[type="submit"]').first().click();
      
      // HTML5 validation should prevent
      const emailInput = page.locator('input[type="email"]').first();
      const isInvalid = await emailInput.evaluate(el => el.validity.valueMissing);
      expect(isInvalid).toBeTruthy();
    });

    test(`TC-AUTH-VAL-006: Cannot signup without password ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      // Fill email but not password
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('button[type="submit"]').first().click();
      
      // HTML5 validation should prevent
      const passwordInput = page.locator('input[type="password"]').first();
      const isInvalid = await passwordInput.evaluate(el => el.validity.valueMissing);
      expect(isInvalid).toBeTruthy();
    });

    test(`TC-AUTH-VAL-007: Password must be at least 6 characters ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      // Fill form with short password
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').first().fill('12345'); // 5 characters
      const confirmPassword = page.locator('input[type="password"]').nth(1);
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill('12345');
      }
      
      await page.locator('button[type="submit"]').first().click();
      
      // Should show error about password length
      const errorMessage = page.locator('.error-message, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      const errorText = await errorMessage.textContent();
      expect(errorText?.toLowerCase()).toContain('6');
    });

    test(`TC-AUTH-VAL-008: Passwords must match ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      // Fill form with mismatched passwords
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').first().fill('password123');
      const confirmPassword = page.locator('input[type="password"]').nth(1);
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill('different123');
      }
      
      await page.locator('button[type="submit"]').first().click();
      
      // Should show error about password mismatch
      const errorMessage = page.locator('.error-message, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      const errorText = await errorMessage.textContent();
      expect(errorText?.toLowerCase()).toMatch(/match|mismatch/);
    });

    test(`TC-AUTH-VAL-009: Cannot signup with email not in allowlist ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      // Try to signup with email not in allowlist
      const notAllowedEmail = `notallowed-${Date.now()}@test.com`;
      await page.locator('input[type="email"]').fill(notAllowedEmail);
      await page.locator('input[type="password"]').first().fill('password123');
      const confirmPassword = page.locator('input[type="password"]').nth(1);
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill('password123');
      }
      
      await page.locator('button[type="submit"]').first().click();
      
      // Should show error about allowlist
      const errorMessage = page.locator('.error-message, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      const errorText = await errorMessage.textContent();
      expect(errorText?.toLowerCase()).toMatch(/allowlist|restricted|not.*list/);
    });

    test(`TC-AUTH-VAL-010: Display name is optional in signup ${tags.critical}`, async ({ page }) => {
      // This test requires a user to be created in dashboard first
      // We'll test that signup works without display name
      // (Actual test would need allowlist setup)
      
      // For now, just verify the field exists and is not required
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      // Check that display name field exists and is not required
      const displayNameInput = page.locator('input[type="text"][name*="display"], input[type="text"][name*="name"]').first();
      if (await displayNameInput.isVisible()) {
        const isRequired = await displayNameInput.evaluate(el => el.hasAttribute('required'));
        expect(isRequired).toBeFalsy();
      }
    });

    test(`TC-AUTH-VAL-011: Can signup with valid email in allowlist ${tags.critical} ${tags.smoke}`, async ({ page }) => {
      // This test requires:
      // 1. Super admin to create user in dashboard
      // 2. Then test signup
      // For now, we'll structure it but it needs the full flow
      
      // This would be tested in the main flow tests
      // TC-SA-003, TC-SA-005, etc. already cover this
      test.skip(); // Skip for now, covered in main flow
    });
  });

  test.describe('Email Format Validation', () => {
    test(`TC-AUTH-VAL-012: Validates email format on blur ${tags.critical}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const emailInput = loginPage.emailInput;
      await emailInput.fill('invalid-email');
      await emailInput.blur();
      
      // HTML5 validation should mark as invalid
      const isInvalid = await emailInput.evaluate(el => el.validity.typeMismatch);
      expect(isInvalid).toBeTruthy();
    });

    test(`TC-AUTH-VAL-013: Accepts valid email formats ${tags.critical}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@example-domain.com'
      ];
      
      for (const email of validEmails) {
        await loginPage.emailInput.fill(email);
        const isValid = await loginPage.emailInput.evaluate(el => el.validity.valid);
        expect(isValid).toBeTruthy();
      }
    });
  });
});
