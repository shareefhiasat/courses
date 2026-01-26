/**
 * Page Object for Instructor Participation Management
 * File: client/src/pages/InstructorParticipationPage.jsx
 */
export class ParticipationPage {
  constructor(page) {
    this.page = page;
    this.baseURL = '/instructor-participation';
    
    // Navigation (if accessed via Dashboard)
    this.participationTab = page.locator('button:has-text("Participation"), [role="tab"]:has-text("Participation")');
    
    // Form elements
    this.studentSelect = page.locator('select, [role="combobox"]').first();
    this.classSelect = page.locator('select, [role="combobox"]').nth(1);
    this.subjectSelect = page.locator('select, [role="combobox"]').nth(2);
    this.typeSelect = page.locator('select, [role="combobox"]').nth(3);
    this.pointsInput = page.locator('input[type="number"][placeholder*="Points"], input[name="points"]').first();
    this.descriptionTextarea = page.locator('textarea[placeholder*="Description"], textarea[name="description"]').first();
    this.dateInput = page.locator('input[type="date"], input[placeholder*="Date"]').first();
    
    // Buttons
    this.addButton = page.locator('button:has-text("Add Participation"), button:has-text("Create Participation")').first();
    this.submitButton = page.locator('button[type="submit"]:has-text("Add"), button[type="submit"]:has-text("Save")').first();
    
    // Grid
    this.dataGrid = page.locator('[role="grid"], .data-grid, table').first();
    this.searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    
    // Filters
    this.classFilter = page.locator('select, [role="combobox"]').first();
    this.typeFilter = page.locator('select, [role="combobox"]').nth(1);
    
    // Actions
    this.editButton = (participationId) => page.locator(`button:has-text("Edit"):near(:text("${participationId}"))`).first();
    this.deleteButton = (participationId) => page.locator(`button:has-text("Delete"):near(:text("${participationId}"))`).first();
  }

  async goto() {
    await this.page.goto(this.baseURL);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  async navigateToParticipationTab() {
    if (await this.participationTab.isVisible()) {
      await this.participationTab.click();
      await this.page.waitForTimeout(500);
    }
  }

  async createParticipation(participationData) {
    // Click Add button if visible
    if (await this.addButton.isVisible()) {
      await this.addButton.click();
      await this.page.waitForTimeout(500);
    }
    
    // Select student
    if (participationData.studentId) {
      await this.studentSelect.click();
      await this.page.waitForTimeout(500);
      await this.page.locator(`text=${participationData.studentId}`).first().click();
    }
    
    // Select class
    if (participationData.classId) {
      await this.classSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${participationData.classId}`).first().click();
    }
    
    // Select subject
    if (participationData.subjectId) {
      await this.subjectSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${participationData.subjectId}`).first().click();
    }
    
    // Select type
    if (participationData.type) {
      await this.typeSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${participationData.type}`).first().click();
    }
    
    // Fill points
    if (participationData.points !== undefined) {
      await this.pointsInput.fill(String(participationData.points));
    }
    
    // Fill description
    if (participationData.description) {
      await this.descriptionTextarea.fill(participationData.description);
    }
    
    // Fill date
    if (participationData.date) {
      await this.dateInput.fill(participationData.date);
    }
    
    // Submit
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async editParticipation(participationId, updates) {
    await this.editButton(participationId).click();
    await this.page.waitForTimeout(500);
    
    if (updates.points !== undefined) await this.pointsInput.fill(String(updates.points));
    if (updates.description) await this.descriptionTextarea.fill(updates.description);
    
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async deleteParticipation(participationId) {
    await this.deleteButton(participationId).click();
    await this.page.waitForTimeout(500);
    await this.page.locator('button:has-text("OK"), button:has-text("Confirm")').first().click();
    await this.page.waitForTimeout(2000);
  }

  async searchParticipation(searchTerm) {
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

  async getParticipationInGrid(studentEmail) {
    return this.page.locator(`[role="row"]:has-text("${studentEmail}")`).first();
  }

  async verifyParticipationExists(studentEmail) {
    const participation = await this.getParticipationInGrid(studentEmail);
    return await participation.isVisible();
  }
}
