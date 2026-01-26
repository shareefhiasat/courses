/**
 * Page Object for Categories Management (Dashboard Categories Tab)
 * File: client/src/pages/DashboardPage.jsx - Categories tab
 */
import { BASE_URL, PATHS, TIMEOUTS } from '../config/constants.js';

export class CategoriesPage {
  constructor(page) {
    this.page = page;
    
    // Navigation
    this.categoriesTab = page.locator('button:has-text("Categories"), [role="tab"]:has-text("Categories")');
    
    // Form elements
    this.idInput = page.locator('input[placeholder*="ID"], input[placeholder*="python"]').first();
    this.nameEnInput = page.locator('input[placeholder*="Name (English)"], input[name="name_en"]').first();
    this.nameArInput = page.locator('input[placeholder*="Name (Arabic)"], input[name="name_ar"]').first();
    this.orderInput = page.locator('input[type="number"][placeholder*="Order"], input[name="order"]').first();
    
    // Buttons
    this.submitButton = page.locator('button[type="submit"]:has-text("Add"), button[type="submit"]:has-text("Update")').first();
    this.cancelButton = page.locator('button:has-text("Cancel")').first();
    this.addDefaultButton = page.locator('button:has-text("Add Default Categories"), button:has-text("➕")').first();
    
    // Grid
    this.dataGrid = page.locator('[role="grid"], .data-grid, table').first();
    
    // Actions
    this.editButton = (categoryId) => page.locator(`button:has-text("Edit"):near(:text("${categoryId}"))`).first();
    this.deleteButton = (categoryId) => page.locator(`button:has-text("Delete"):near(:text("${categoryId}"))`).first();
  }

  async goto() {
    await this.page.goto(BASE_URL + '/dashboard?tab=categories');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(TIMEOUTS.PAGE_LOAD);
  }

  async navigateToCategoriesTab() {
    await this.categoriesTab.click();
    await this.page.waitForTimeout(500);
  }

  async createCategory(categoryData) {
    // Fill form
    if (categoryData.id) await this.idInput.fill(categoryData.id);
    if (categoryData.name_en) await this.nameEnInput.fill(categoryData.name_en);
    if (categoryData.name_ar) await this.nameArInput.fill(categoryData.name_ar);
    if (categoryData.order !== undefined) await this.orderInput.fill(String(categoryData.order));
    
    // Submit
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async editCategory(categoryId, updates) {
    await this.editButton(categoryId).click();
    await this.page.waitForTimeout(500);
    
    if (updates.name_en) await this.nameEnInput.fill(updates.name_en);
    if (updates.order !== undefined) await this.orderInput.fill(String(updates.order));
    
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async deleteCategory(categoryId) {
    await this.deleteButton(categoryId).click();
    await this.page.waitForTimeout(500);
    await this.page.locator('button:has-text("OK"), button:has-text("Confirm")').first().click();
    await this.page.waitForTimeout(2000);
  }

  async addDefaultCategories() {
    if (await this.addDefaultButton.isVisible()) {
      await this.addDefaultButton.click();
      await this.page.waitForTimeout(2000);
    }
  }

  async getCategoryInGrid(categoryId) {
    return this.page.locator(`[role="row"]:has-text("${categoryId}")`).first();
  }

  async verifyCategoryExists(categoryId) {
    const category = await this.getCategoryInGrid(categoryId);
    return await category.isVisible();
  }
}
