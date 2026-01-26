/**
 * Page Object for Programs Management
 * File: client/src/pages/ProgramsManagementPage.jsx
 */
export class ProgramsPage {
  constructor(page) {
    this.page = page;
    this.baseURL = '/programs';
    
    // Form elements
    this.codeInput = page.locator('input[placeholder*="Program Code"], input[placeholder*="code" i]').first();
    this.nameEnInput = page.locator('input[placeholder*="Program Name (English)"], input[placeholder*="name_en" i]').first();
    this.nameArInput = page.locator('input[placeholder*="Program Name (Arabic)"], input[placeholder*="name_ar" i]').first();
    this.durationInput = page.locator('input[type="number"][placeholder*="Duration"], input[placeholder*="years" i]').first();
    this.minGPAInput = page.locator('input[type="number"][placeholder*="Minimum GPA"], input[placeholder*="GPA" i]').first();
    this.creditHoursInput = page.locator('input[type="number"][placeholder*="Credit Hours"], input[placeholder*="credit" i]').first();
    this.descriptionEnTextarea = page.locator('textarea[placeholder*="Description (English)"], textarea[placeholder*="description_en" i]').first();
    this.descriptionArTextarea = page.locator('textarea[placeholder*="Description (Arabic)"], textarea[placeholder*="description_ar" i]').first();
    
    // Buttons
    this.submitButton = page.locator('button[type="submit"]:has-text("Add Program"), button[type="submit"]:has-text("Update")').first();
    this.cancelButton = page.locator('button:has-text("Cancel")').first();
    
    // Grid/Table
    this.dataGrid = page.locator('[role="grid"], .data-grid, table').first();
    this.searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    
    // Actions
    this.editButton = (programName) => page.locator(`button:has-text("Edit"):near(:text("${programName}"))`).first();
    this.deleteButton = (programName) => page.locator(`button:has-text("Delete"):near(:text("${programName}"))`).first();
  }

  async goto() {
    await this.page.goto(this.baseURL);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  async createProgram(programData) {
    // Fill form
    if (programData.code) await this.codeInput.fill(programData.code);
    if (programData.name_en) await this.nameEnInput.fill(programData.name_en);
    if (programData.name_ar) await this.nameArInput.fill(programData.name_ar);
    if (programData.duration_years) await this.durationInput.fill(String(programData.duration_years));
    if (programData.minGPA) await this.minGPAInput.fill(String(programData.minGPA));
    if (programData.totalCreditHours) await this.creditHoursInput.fill(String(programData.totalCreditHours));
    if (programData.description_en) await this.descriptionEnTextarea.fill(programData.description_en);
    if (programData.description_ar) await this.descriptionArTextarea.fill(programData.description_ar);
    
    // Submit
    await this.submitButton.click();
    await this.page.waitForTimeout(2000); // Wait for save
  }

  async editProgram(programName, updates) {
    await this.editButton(programName).click();
    await this.page.waitForTimeout(500);
    
    // Update fields
    if (updates.name_en) await this.nameEnInput.fill(updates.name_en);
    if (updates.name_ar) await this.nameArInput.fill(updates.name_ar);
    if (updates.duration_years) await this.durationInput.fill(String(updates.duration_years));
    
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async deleteProgram(programName) {
    await this.deleteButton(programName).click();
    await this.page.waitForTimeout(500);
    
    // Confirm deletion
    await this.page.locator('button:has-text("OK"), button:has-text("Confirm"), button:has-text("Yes")').first().click();
    await this.page.waitForTimeout(2000);
  }

  async searchProgram(searchTerm) {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(searchTerm);
      await this.page.waitForTimeout(500);
    }
  }

  async getProgramInGrid(programName) {
    return this.page.locator(`[role="row"]:has-text("${programName}")`).first();
  }

  async verifyProgramExists(programName) {
    const program = await this.getProgramInGrid(programName);
    return await program.isVisible();
  }
}
