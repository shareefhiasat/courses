/**
 * Page Object for Classes Management (Dashboard Classes Tab)
 * File: client/src/pages/DashboardPage.jsx - Classes tab
 */
import { BASE_URL, PATHS, TIMEOUTS } from '../config/constants.js';

export class ClassesPage {
  constructor(page) {
    this.page = page;
    
    // Navigation
    this.dashboardTab = page.locator('button:has-text("Classes"), [role="tab"]:has-text("Classes")');
    
    // Form elements (Basic Info tab)
    this.nameInput = page.locator('input[placeholder*="Class Name"], input[name="name"]').first();
    this.nameArInput = page.locator('input[placeholder*="Class Name (Arabic)"], input[name="nameAr"]').first();
    this.codeInput = page.locator('input[placeholder*="Class Code"], input[name="code"]').first();
    
    // Form tabs
    this.basicTab = page.locator('button:has-text("Basic Info"), [data-tab="basic"]');
    this.academicTab = page.locator('button:has-text("Academic Info"), [data-tab="academic"]');
    
    // Academic Info tab
    this.subjectSelect = page.locator('select, [role="combobox"]').first();
    this.instructorSelect = page.locator('select, [role="combobox"]').nth(1);
    
    // Buttons
    this.submitButton = page.locator('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Update")').first();
    
    // Grid
    this.dataGrid = page.locator('[role="grid"], .data-grid, table').first();
    
    // Actions
    this.editButton = (className) => page.locator(`button:has-text("Edit"):near(:text("${className}"))`).first();
    this.deleteButton = (className) => page.locator(`button:has-text("Delete"):near(:text("${className}"))`).first();
  }

  async goto() {
    await this.page.goto(BASE_URL + '/dashboard?tab=classes');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(TIMEOUTS.PAGE_LOAD);
  }

  async navigateToClassesTab() {
    await this.dashboardTab.click();
    await this.page.waitForTimeout(500);
  }

  async createClass(classData) {
    // Switch to Basic Info tab if needed
    if (await this.basicTab.isVisible()) {
      await this.basicTab.click();
      await this.page.waitForTimeout(300);
    }
    
    // Fill basic info
    if (classData.name) await this.nameInput.fill(classData.name);
    if (classData.nameAr) await this.nameArInput.fill(classData.nameAr);
    if (classData.code) await this.codeInput.fill(classData.code);
    
    // Switch to Academic Info if subject/instructor provided
    if (classData.subjectId || classData.ownerEmail) {
      if (await this.academicTab.isVisible()) {
        await this.academicTab.click();
        await this.page.waitForTimeout(300);
      }
      
      if (classData.subjectId) {
        await this.subjectSelect.click();
        await this.page.waitForTimeout(300);
        await this.page.locator(`text=${classData.subjectId}`).first().click();
      }
      
      if (classData.ownerEmail) {
        await this.instructorSelect.click();
        await this.page.waitForTimeout(300);
        await this.page.locator(`text=${classData.ownerEmail}`).first().click();
      }
    }
    
    // Submit
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async editClass(className, updates) {
    await this.editButton(className).click();
    await this.page.waitForTimeout(500);
    
    if (updates.name) await this.nameInput.fill(updates.name);
    
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async deleteClass(className) {
    await this.deleteButton(className).click();
    await this.page.waitForTimeout(500);
    await this.page.locator('button:has-text("OK"), button:has-text("Confirm")').first().click();
    await this.page.waitForTimeout(2000);
  }

  async getClassInGrid(className) {
    return this.page.locator(`[role="row"]:has-text("${className}")`).first();
  }

  async verifyClassExists(className) {
    const classRow = await this.getClassInGrid(className);
    return await classRow.isVisible();
  }
}
