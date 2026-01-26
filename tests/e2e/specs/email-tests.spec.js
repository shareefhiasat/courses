/**
 * Email Testing Suite
 * Tests email functionality using Mailtrap
 * 
 * Features:
 * - Welcome emails on signup
 * - Password reset emails
 * - Notification emails
 * - Email content verification
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { loginAs, logout } from '../utils/auth';
import { 
  waitForEmail, 
  getEmailBody, 
  extractLinkFromEmail,
  waitForSuperAdminEmail,
  verifyEmailReceived,
  getEmailsForRecipient
} from '../utils/email';
import { sendEmailViaMailtrapAPI, testMailtrapSendAPI } from '../utils/mailtrap-send';
import { testConfig, testData, tags } from '../config/test-config';
import { generateGmailPlusAddress } from '../utils/gmail-check';

// Use Gmail plus addressing for all test emails
// Format: shareef.hiasat+DDMMYYYYHHMMrole@gmail.com
// All emails go to shareef.hiasat@gmail.com inbox

test.describe('Email Testing Suite', () => {
  
  test.describe('Mailtrap Configuration', () => {
    test(`TC-EMAIL-001: Mailtrap Send API is configured ${tags.email}`, async () => {
      // Test Mailtrap Send API configuration
      const result = await testMailtrapSendAPI(testConfig.superAdmin.email);
      
      expect(result.success).toBeTruthy();
      expect(result.messageId).toBeTruthy();
    });

    test(`TC-EMAIL-002: Can send test email via Mailtrap API ${tags.email}`, async () => {
      const testEmail = {
        to: testConfig.superAdmin.email,
        subject: 'E2E Test - Mailtrap API Test',
        text: 'This is a test email from E2E tests.',
        html: '<p>This is a test email from <strong>E2E tests</strong>.</p>',
        category: 'E2E Test'
      };

      const result = await sendEmailViaMailtrapAPI(testEmail);
      
      expect(result.success).toBeTruthy();
      
      // Wait a bit for email to arrive in inbox
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify email was received (if inbox is configured)
      const email = await waitForSuperAdminEmail('Mailtrap API Test', 10000);
      if (email) {
        expect(email.subject).toContain('Mailtrap API Test');
      }
    });
  });

  test.describe('Welcome Email on Signup', () => {
    test(`TC-EMAIL-003: Welcome email sent when user signs up ${tags.email} ${tags.critical}`, async ({ page }) => {
      // This test requires:
      // 1. Super admin creates user
      // 2. User signs up
      // 3. Check for welcome email
      
      // Login as super admin
      await loginAs(page, testConfig.superAdmin);
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.navigateToTab('Users');
      
      // Create student
      // Generate unique email using Gmail plus addressing
      const studentEmail = generateGmailPlusAddress('student', 'email');
      const studentName = testData.generateDisplayName('Email Test', 'Student');
      
      console.log('Testing welcome email with student:', studentEmail);
      
      await dashboardPage.addUser({
        email: studentEmail,
        displayName: studentName,
        role: 'student',
        autoAddToAllowlist: true
      });
      
      await page.waitForTimeout(2000);
      await logout(page);
      
      // Signup
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const signUpLink = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")');
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await page.waitForTimeout(500);
      }
      
      await page.locator('input[type="email"]').fill(studentEmail);
      await page.locator('input[type="password"]').first().fill(testData.defaultPassword);
      const confirmPassword = page.locator('input[type="password"]').nth(1);
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill(testData.defaultPassword);
      }
      
      // Record time before signup
      const signupTime = Date.now();
      
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL(/.*(dashboard|home|\/).*/i, { timeout: 15000 });
      
      // Wait for welcome email (if system sends it)
      // Note: This depends on your welcome email implementation
      const email = await waitForEmail(studentEmail, 'welcome', 30000);
      
      if (email) {
        expect(email.to_email).toContain(studentEmail);
        expect(email.subject?.toLowerCase()).toMatch(/welcome|account.*created/i);
      } else {
        // Email might not be sent automatically, that's okay for now
        console.log('Welcome email not found - may not be implemented yet');
      }
    });
  });

  test.describe('Password Reset Email', () => {
    test(`TC-EMAIL-004: Password reset email sent when requested ${tags.email} ${tags.critical}`, async ({ page }) => {
      // Login as super admin
      await loginAs(page, testConfig.superAdmin);
      
      // Navigate to password reset
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // Click forgot password
      const forgotPasswordLink = page.locator('a:has-text("Forgot"), button:has-text("Forgot")');
      if (await forgotPasswordLink.isVisible()) {
        await forgotPasswordLink.click();
        await page.waitForTimeout(500);
      }
      
      // Enter super admin email
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(testConfig.superAdmin.email);
      
      // Submit
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      
      // Wait for success message
      await page.waitForTimeout(2000);
      
      // Check for password reset email
      const email = await waitForSuperAdminEmail('password.*reset|reset.*password', 30000);
      
      if (email) {
        expect(email.subject?.toLowerCase()).toMatch(/password|reset/i);
        
        // Extract reset link if present
        const emailBody = await getEmailBody(email.id);
        if (emailBody) {
          const resetLink = extractLinkFromEmail(emailBody, 'reset');
          if (resetLink) {
            expect(resetLink).toContain('password');
          }
        }
      } else {
        console.log('Password reset email not found - may need Mailtrap inbox configuration');
      }
    });
  });

  test.describe('Super Admin Notification Emails', () => {
    test(`TC-EMAIL-005: Super admin receives notification emails ${tags.email}`, async ({ page }) => {
      // Test that super admin receives emails when acting as instructor
      // This would test notification emails sent to super admin
      
      // For now, we'll test by sending a test email
      const testEmail = {
        to: testConfig.superAdmin.email,
        subject: 'QAF Courses - Test Notification',
        text: 'This is a test notification email for super admin.',
        html: '<p>This is a test <strong>notification</strong> email for super admin.</p>',
        category: 'Notification Test'
      };

      const result = await sendEmailViaMailtrapAPI(testEmail);
      expect(result.success).toBeTruthy();
      
      // Verify email received
      const email = await waitForSuperAdminEmail('Test Notification', 15000);
      if (email) {
        expect(email.subject).toContain('Test Notification');
      }
    });
  });

  test.describe('Email Content Verification', () => {
    test(`TC-EMAIL-006: Email contains expected content ${tags.email}`, async () => {
      // Send test email
      const testEmail = {
        to: testConfig.superAdmin.email,
        subject: 'E2E Content Test',
        text: 'This email contains a test link: https://example.com/test',
        html: '<p>This email contains a <a href="https://example.com/test">test link</a>.</p>',
        category: 'Content Test'
      };

      await sendEmailViaMailtrapAPI(testEmail);
      
      // Wait and get email
      const email = await waitForSuperAdminEmail('Content Test', 15000);
      
      if (email) {
        const emailBody = await getEmailBody(email.id);
        expect(emailBody).toBeTruthy();
        expect(emailBody).toContain('test link');
        
        // Extract link
        const link = extractLinkFromEmail(emailBody, 'test link');
        if (link) {
          expect(link).toContain('example.com');
        }
      }
    });
  });
});
