/**
 * Page Object for Admin Dashboard
 * File: client/src/pages/DashboardPage.jsx
 */
import { BASE_URL, PATHS, TIMEOUTS } from '../config/constants.js';

export class DashboardPage {
  constructor(page) {
    this.page = page;
    // Main navigation
    this.navbar = page.locator('nav, [role="navigation"]');
    this.sideDrawer = page.locator('[data-testid="side-drawer"], .side-drawer');
    
    // Dashboard tabs
    this.usersTab = page.locator('button:has-text("Users"), [role="tab"]:has-text("Users")');
    this.analyticsTab = page.locator('button:has-text("Analytics"), [role="tab"]:has-text("Analytics")');
    this.classesTab = page.locator('button:has-text("Classes"), [role="tab"]:has-text("Classes")');
    
    // User management
    this.addUserButton = page.locator('button:has-text("Add User"), button:has-text("Create User")');
    this.userSearchInput = page.locator('input[placeholder*="Search"], input[name="search"]');
    this.userTable = page.locator('table, [role="table"], .data-grid');
    
    // KPI Cards
    this.totalUsersCard = page.locator('[data-testid="total-users"], .kpi-card:has-text("Total Users")');
    this.totalClassesCard = page.locator('[data-testid="total-classes"], .kpi-card:has-text("Total Classes")');
    
    // Role Access Pro (Super Admin only)
    this.roleAccessMenu = page.locator('a[href*="role-access"], button:has-text("Role Access")');
  }

  async goto() {
    await this.page.goto(BASE_URL + PATHS.DASHBOARD);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(TIMEOUTS.PAGE_LOAD);
  }

  async navigateToTab(tabName) {
    const tab = this.page.locator(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`);
    await tab.click();
    await this.page.waitForTimeout(500); // Wait for tab content to load
  }

  async searchUsers(searchTerm) {
    await this.userSearchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Wait for search to filter
  }

  async addUser(userData) {
    await this.addUserButton.click();
    await this.page.waitForTimeout(500); // Wait for form to appear
    
    // Fill basic info tab (email, displayName)
    // Check if we're on basic tab, if not switch to it
    const basicTab = this.page.locator('button:has-text("Basic Info"), [data-tab="basic"]');
    if (await basicTab.isVisible()) {
      await basicTab.click();
      await this.page.waitForTimeout(300);
    }
    
    // Fill email (required)
    const emailInput = this.page.locator('input[type="email"], input[placeholder*="email" i]').first();
    await emailInput.fill(userData.email);
    
    // Fill display name if provided
    if (userData.displayName) {
      const displayNameInput = this.page.locator('input[type="text"][placeholder*="display" i], input[placeholder*="name" i]').first();
      await displayNameInput.fill(userData.displayName);
    }
    
    // Switch to role tab
    const roleTab = this.page.locator('button:has-text("Role"), [data-tab="role"]');
    if (await roleTab.isVisible()) {
      await roleTab.click();
      await this.page.waitForTimeout(300);
    }
    
    // Select role
    if (userData.role) {
      // The Select component might be a custom component, try multiple selectors
      const roleSelect = this.page.locator('select, [role="combobox"], input[placeholder*="role" i]').first();
      await roleSelect.click();
      await this.page.waitForTimeout(200);
      
      // Select the role option
      const roleOption = this.page.locator(`text=${userData.role}`, { hasText: new RegExp(userData.role, 'i') }).first();
      if (await roleOption.isVisible()) {
        await roleOption.click();
      } else {
        // Try typing the role
        await roleSelect.fill(userData.role);
        await this.page.keyboard.press('Enter');
      }
    }
    
    // Enable auto-add to allowlist if needed (default is usually enabled)
    if (userData.autoAddToAllowlist !== false) {
      const allowlistToggle = this.page.locator('input[type="checkbox"][label*="allowlist" i], label:has-text("allowlist") input[type="checkbox"]');
      if (await allowlistToggle.isVisible()) {
        const isChecked = await allowlistToggle.isChecked();
        if (!isChecked) {
          await allowlistToggle.check();
        }
      }
    }
    
    // Submit form
    const saveButton = this.page.locator('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create"), button:has-text("Save"):not([type="button"])').first();
    await saveButton.click();
    
    // Wait for success message
    await this.page.waitForSelector('.toast-success, .success-message, [role="alert"]:has-text("success")', { timeout: 10000 }).catch(() => {});
  }
  
  async searchUser(email) {
    await this.userSearchInput.fill(email);
    await this.page.waitForTimeout(500); // Wait for search to filter
  }
  
  async getUserInTable(email) {
    // Wait for table to load
    await this.userTable.waitFor({ timeout: 5000 }).catch(() => {});
    // Find user row by email
    return this.page.locator(`tr:has-text("${email}")`).first();
  }
  
  async isUserInTable(email) {
    const userRow = await this.getUserInTable(email);
    return await userRow.isVisible();
  }

  async isRoleAccessVisible() {
    return await this.roleAccessMenu.isVisible();
  }

  async getTotalUsers() {
    const text = await this.totalUsersCard.textContent();
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }
}
