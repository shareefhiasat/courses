/**
 * Page Object for Activities Management (Dashboard Activities Tab)
 * File: client/src/pages/DashboardPage.jsx - Activities tab
 */
import { BASE_URL, PATHS, TIMEOUTS } from '../config/constants.js';

export class ActivitiesPage {
  constructor(page) {
    this.page = page;
    
    // Navigation
    this.activitiesTab = page.locator('button:has-text("Activities"), [role="tab"]:has-text("Activities")');
    
    // Form elements
    this.titleEnInput = page.locator('input[placeholder*="Title (English)"], input[name="title_en"]').first();
    this.titleArInput = page.locator('input[placeholder*="Title (Arabic)"], input[name="title_ar"]').first();
    this.typeSelect = page.locator('select, [role="combobox"]').first();
    this.classSelect = page.locator('select, [role="combobox"]').nth(1);
    this.urlInput = page.locator('input[type="url"], input[placeholder*="URL"], input[name="url"]').first();
    this.descriptionEnTextarea = page.locator('textarea[placeholder*="Description (English)"], textarea[name="description_en"]').first();
    this.descriptionArTextarea = page.locator('textarea[placeholder*="Description (Arabic)"], textarea[name="description_ar"]').first();
    
    // Buttons
    this.submitButton = page.locator('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Update")').first();
    this.addActivityButton = page.locator('button:has-text("Add Activity"), button:has-text("Create Activity")').first();
    
    // Grid
    this.dataGrid = page.locator('[role="grid"], .data-grid, table').first();
    
    // Actions
    this.editButton = (activityTitle) => page.locator(`button:has-text("Edit"):near(:text("${activityTitle}"))`).first();
    this.deleteButton = (activityTitle) => page.locator(`button:has-text("Delete"):near(:text("${activityTitle}"))`).first();
  }

  async goto() {
    await this.page.goto(BASE_URL + '/dashboard?tab=activities');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(TIMEOUTS.PAGE_LOAD);
  }

  async navigateToActivitiesTab() {
    await this.activitiesTab.click();
    await this.page.waitForTimeout(500);
  }

  async createActivity(activityData) {
    // Click Add Activity button if visible
    if (await this.addActivityButton.isVisible()) {
      await this.addActivityButton.click();
      await this.page.waitForTimeout(500);
    }
    
    // Fill form
    if (activityData.title_en) await this.titleEnInput.fill(activityData.title_en);
    if (activityData.title_ar) await this.titleArInput.fill(activityData.title_ar);
    
    // Select type
    if (activityData.type) {
      await this.typeSelect.click();
      await this.page.waitForTimeout(300);
      const typeOptions = ['homework', 'activity', 'resource', 'announcement', 'quiz'];
      const typeIndex = typeOptions.indexOf(activityData.type.toLowerCase());
      if (typeIndex >= 0) {
        await this.page.locator(`text=${activityData.type}, option:has-text("${activityData.type}")`).first().click();
      }
    }
    
    // Select class
    if (activityData.classId) {
      await this.classSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${activityData.classId}`).first().click();
    }
    
    // Fill URL if provided
    if (activityData.url) await this.urlInput.fill(activityData.url);
    
    // Fill descriptions
    if (activityData.description_en) await this.descriptionEnTextarea.fill(activityData.description_en);
    if (activityData.description_ar) await this.descriptionArTextarea.fill(activityData.description_ar);
    
    // Submit
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async editActivity(activityTitle, updates) {
    await this.editButton(activityTitle).click();
    await this.page.waitForTimeout(500);
    
    if (updates.title_en) await this.titleEnInput.fill(updates.title_en);
    
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async deleteActivity(activityTitle) {
    await this.deleteButton(activityTitle).click();
    await this.page.waitForTimeout(500);
    await this.page.locator('button:has-text("OK"), button:has-text("Confirm")').first().click();
    await this.page.waitForTimeout(2000);
  }

  async getActivityInGrid(activityTitle) {
    return this.page.locator(`[role="row"]:has-text("${activityTitle}")`).first();
  }

  async verifyActivityExists(activityTitle) {
    const activity = await this.getActivityInGrid(activityTitle);
    return await activity.isVisible();
  }
}
