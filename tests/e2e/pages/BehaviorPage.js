/**
 * Page Object for Instructor Behavior Management
 * File: client/src/pages/InstructorBehaviorPage.jsx
 */
export class BehaviorPage {
  constructor(page) {
    this.page = page;
    this.baseURL = '/instructor-behavior';
    
    // Navigation (if accessed via Dashboard)
    this.behaviorTab = page.locator('button:has-text("Behavior"), [role="tab"]:has-text("Behavior")');
    
    // Form elements
    this.studentSelect = page.locator('select, [role="combobox"]').first();
    this.classSelect = page.locator('select, [role="combobox"]').nth(1);
    this.subjectSelect = page.locator('select, [role="combobox"]').nth(2);
    this.typeSelect = page.locator('select, [role="combobox"]').nth(3);
    this.severitySelect = page.locator('select, [role="combobox"]').nth(4);
    this.noteTextarea = page.locator('textarea[placeholder*="Note"], textarea[name="note"]').first();
    this.dateInput = page.locator('input[type="date"], input[placeholder*="Date"]').first();
    
    // Buttons
    this.addButton = page.locator('button:has-text("Add Behavior"), button:has-text("Create Behavior")').first();
    this.submitButton = page.locator('button[type="submit"]:has-text("Add"), button[type="submit"]:has-text("Save")').first();
    
    // Grid
    this.dataGrid = page.locator('[role="grid"], .data-grid, table').first();
    this.searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    
    // Filters
    this.classFilter = page.locator('select, [role="combobox"]').first();
    this.typeFilter = page.locator('select, [role="combobox"]').nth(1);
    
    // Actions
    this.editButton = (behaviorId) => page.locator(`button:has-text("Edit"):near(:text("${behaviorId}"))`).first();
    this.deleteButton = (behaviorId) => page.locator(`button:has-text("Delete"):near(:text("${behaviorId}"))`).first();
  }

  async goto() {
    await this.page.goto(this.baseURL);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  async navigateToBehaviorTab() {
    if (await this.behaviorTab.isVisible()) {
      await this.behaviorTab.click();
      await this.page.waitForTimeout(500);
    }
  }

  async createBehavior(behaviorData) {
    // Click Add button if visible
    if (await this.addButton.isVisible()) {
      await this.addButton.click();
      await this.page.waitForTimeout(500);
    }
    
    // Select student
    if (behaviorData.studentId) {
      await this.studentSelect.click();
      await this.page.waitForTimeout(500);
      await this.page.locator(`text=${behaviorData.studentId}`).first().click();
    }
    
    // Select class
    if (behaviorData.classId) {
      await this.classSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${behaviorData.classId}`).first().click();
    }
    
    // Select subject
    if (behaviorData.subjectId) {
      await this.subjectSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${behaviorData.subjectId}`).first().click();
    }
    
    // Select type
    if (behaviorData.type) {
      await this.typeSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${behaviorData.type}`).first().click();
    }
    
    // Select severity
    if (behaviorData.severity) {
      await this.severitySelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${behaviorData.severity}`).first().click();
    }
    
    // Fill note
    if (behaviorData.note) {
      await this.noteTextarea.fill(behaviorData.note);
    }
    
    // Fill date
    if (behaviorData.date) {
      await this.dateInput.fill(behaviorData.date);
    }
    
    // Submit
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async editBehavior(behaviorId, updates) {
    await this.editButton(behaviorId).click();
    await this.page.waitForTimeout(500);
    
    if (updates.note) await this.noteTextarea.fill(updates.note);
    if (updates.severity) {
      await this.severitySelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${updates.severity}`).first().click();
    }
    
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async deleteBehavior(behaviorId) {
    await this.deleteButton(behaviorId).click();
    await this.page.waitForTimeout(500);
    await this.page.locator('button:has-text("OK"), button:has-text("Confirm")').first().click();
    await this.page.waitForTimeout(2000);
  }

  async searchBehavior(searchTerm) {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(searchTerm);
      await this.page.waitForTimeout(500);
    }
  }

  async filterByClass(className) {
    await this.classFilter.click();
    await this.page.waitForTimeout(300);
    await this.page.locator(`text=${className}`).first().click();
    await this.page.waitForTimeout(500);
  }

  async getBehaviorInGrid(studentEmail) {
    return this.page.locator(`[role="row"]:has-text("${studentEmail}")`).first();
  }

  async verifyBehaviorExists(studentEmail) {
    const behavior = await this.getBehaviorInGrid(studentEmail);
    return await behavior.isVisible();
  }
}
