/**
 * Page Object for Enrollment Management (Dashboard Enrollments Tab)
 * File: client/src/pages/DashboardPage.jsx - Enrollments tab
 */
import { BASE_URL, PATHS, TIMEOUTS } from '../config/constants.js';

export class EnrollmentPage {
  constructor(page) {
    this.page = page;
    
    // Navigation
    this.enrollmentsTab = page.locator('button:has-text("Enrollments"), [role="tab"]:has-text("Enrollments")');
    
    // Form tabs
    this.userTab = page.locator('button:has-text("User Info"), [data-tab="user"]');
    this.classTab = page.locator('button:has-text("Class Info"), [data-tab="class"]');
    
    // Form elements
    this.userSelect = page.locator('select, [role="combobox"]').first();
    this.classSelect = page.locator('select, [role="combobox"]').nth(1);
    this.programSelect = page.locator('select, [role="combobox"]').nth(2);
    this.subjectSelect = page.locator('select, [role="combobox"]').nth(3);
    this.roleSelect = page.locator('select, [role="combobox"]').last();
    
    // Buttons
    this.submitButton = page.locator('button[type="submit"]:has-text("Add Enrollment"), button[type="submit"]:has-text("Create")').first();
    
    // Grid
    this.dataGrid = page.locator('[role="grid"], .data-grid, table').first();
  }

  async goto() {
    await this.page.goto(BASE_URL + '/dashboard?tab=enrollments');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(TIMEOUTS.PAGE_LOAD);
  }

  async navigateToEnrollmentsTab() {
    await this.enrollmentsTab.click();
    await this.page.waitForTimeout(500);
  }

  async enrollStudent(enrollmentData) {
    // Switch to User Info tab
    if (await this.userTab.isVisible()) {
      await this.userTab.click();
      await this.page.waitForTimeout(300);
    }
    
    // Select student
    if (enrollmentData.userId) {
      await this.userSelect.click();
      await this.page.waitForTimeout(500);
      // Try to find by email or display name
      const userOption = this.page.locator(`text=${enrollmentData.userId}, option:has-text("${enrollmentData.userId}")`).first();
      if (await userOption.isVisible()) {
        await userOption.click();
      } else {
        // Try typing
        await this.userSelect.fill(enrollmentData.userId);
        await this.page.keyboard.press('Enter');
      }
    }
    
    // Switch to Class Info tab
    if (await this.classTab.isVisible()) {
      await this.classTab.click();
      await this.page.waitForTimeout(300);
    }
    
    // Select class
    if (enrollmentData.classId) {
      await this.classSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${enrollmentData.classId}`).first().click();
    }
    
    // Select program if provided
    if (enrollmentData.programId) {
      await this.programSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${enrollmentData.programId}`).first().click();
    }
    
    // Select subject if provided
    if (enrollmentData.subjectId) {
      await this.subjectSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${enrollmentData.subjectId}`).first().click();
    }
    
    // Select role (default: student)
    if (enrollmentData.role && enrollmentData.role !== 'student') {
      await this.roleSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${enrollmentData.role}`).first().click();
    }
    
    // Submit
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async getEnrollmentInGrid(studentEmail, className) {
    return this.page.locator(`[role="row"]:has-text("${studentEmail}")`).first();
  }

  async verifyEnrollmentExists(studentEmail, className) {
    const enrollment = await this.getEnrollmentInGrid(studentEmail, className);
    return await enrollment.isVisible();
  }
}
