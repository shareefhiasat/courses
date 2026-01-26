/**
 * Page Object for HR Penalties Management
 * File: client/src/pages/HRPenaltiesPage.jsx
 */
export class PenaltiesPage {
  constructor(page) {
    this.page = page;
    this.baseURL = '/hr-penalties';
    
    // Navigation (if accessed via Dashboard)
    this.penaltiesTab = page.locator('button:has-text("HR Penalties"), [role="tab"]:has-text("Penalties")');
    
    // Form elements
    this.studentSelect = page.locator('select, [role="combobox"]').first();
    this.classSelect = page.locator('select, [role="combobox"]').nth(1);
    this.subjectSelect = page.locator('select, [role="combobox"]').nth(2);
    this.typeSelect = page.locator('select, [role="combobox"]').nth(3);
    this.pointsInput = page.locator('input[type="number"][placeholder*="Points"], input[name="points"]').first();
    this.reasonTextarea = page.locator('textarea[placeholder*="Reason"], textarea[name="reason"]').first();
    this.dateInput = page.locator('input[type="date"], input[placeholder*="Date"]').first();
    
    // Buttons
    this.addButton = page.locator('button:has-text("Add Penalty"), button:has-text("Create Penalty")').first();
    this.submitButton = page.locator('button[type="submit"]:has-text("Add"), button[type="submit"]:has-text("Save")').first();
    
    // Grid
    this.dataGrid = page.locator('[role="grid"], .data-grid, table').first();
    this.searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    
    // Filters
    this.classFilter = page.locator('select, [role="combobox"]').first();
    this.dateFilter = page.locator('input[type="date"]').first();
    
    // Actions
    this.editButton = (penaltyId) => page.locator(`button:has-text("Edit"):near(:text("${penaltyId}"))`).first();
    this.deleteButton = (penaltyId) => page.locator(`button:has-text("Delete"):near(:text("${penaltyId}"))`).first();
  }

  async goto() {
    await this.page.goto(this.baseURL);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  async navigateToPenaltiesTab() {
    if (await this.penaltiesTab.isVisible()) {
      await this.penaltiesTab.click();
      await this.page.waitForTimeout(500);
    }
  }

  async createPenalty(penaltyData) {
    // Click Add button if visible
    if (await this.addButton.isVisible()) {
      await this.addButton.click();
      await this.page.waitForTimeout(500);
    }
    
    // Select student
    if (penaltyData.studentId) {
      await this.studentSelect.click();
      await this.page.waitForTimeout(500);
      await this.page.locator(`text=${penaltyData.studentId}, option:has-text("${penaltyData.studentId}")`).first().click();
    }
    
    // Select class
    if (penaltyData.classId) {
      await this.classSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${penaltyData.classId}`).first().click();
    }
    
    // Select subject
    if (penaltyData.subjectId) {
      await this.subjectSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${penaltyData.subjectId}`).first().click();
    }
    
    // Select type
    if (penaltyData.type) {
      await this.typeSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${penaltyData.type}`).first().click();
    }
    
    // Fill points
    if (penaltyData.points !== undefined) {
      await this.pointsInput.fill(String(penaltyData.points));
    }
    
    // Fill reason
    if (penaltyData.reason) {
      await this.reasonTextarea.fill(penaltyData.reason);
    }
    
    // Fill date
    if (penaltyData.date) {
      await this.dateInput.fill(penaltyData.date);
    }
    
    // Submit
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async editPenalty(penaltyId, updates) {
    await this.editButton(penaltyId).click();
    await this.page.waitForTimeout(500);
    
    if (updates.points !== undefined) await this.pointsInput.fill(String(updates.points));
    if (updates.reason) await this.reasonTextarea.fill(updates.reason);
    
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async deletePenalty(penaltyId) {
    await this.deleteButton(penaltyId).click();
    await this.page.waitForTimeout(500);
    await this.page.locator('button:has-text("OK"), button:has-text("Confirm")').first().click();
    await this.page.waitForTimeout(2000);
  }

  async searchPenalty(searchTerm) {
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

  async getPenaltyInGrid(studentEmail) {
    return this.page.locator(`[role="row"]:has-text("${studentEmail}")`).first();
  }

  async verifyPenaltyExists(studentEmail) {
    const penalty = await this.getPenaltyInGrid(studentEmail);
    return await penalty.isVisible();
  }
}
