/**
 * Page Object for Subjects Management
 * File: client/src/pages/SubjectsManagementPage.jsx
 */
export class SubjectsPage {
  constructor(page) {
    this.page = page;
    this.baseURL = '/subjects';
    
    // Form elements
    this.programSelect = page.locator('select, [role="combobox"]').first();
    this.codeInput = page.locator('input[placeholder*="Subject Code"], input[placeholder*="code" i]').first();
    this.nameEnInput = page.locator('input[placeholder*="Subject Name (English)"], input[placeholder*="name_en" i]').first();
    this.nameArInput = page.locator('input[placeholder*="Subject Name (Arabic)"], input[placeholder*="name_ar" i]').first();
    this.creditHoursInput = page.locator('input[type="number"][placeholder*="Credit Hours"], input[placeholder*="credit" i]').first();
    this.totalHoursInput = page.locator('input[type="number"][placeholder*="Total Hours"], input[placeholder*="total" i]').first();
    this.typeSelect = page.locator('select, [role="combobox"]').nth(1); // Second select for type
    this.requirementTypeSelect = page.locator('select, [role="combobox"]').nth(2); // Third select
    this.hoursPerWeekInput = page.locator('input[type="number"][placeholder*="Hours Per Week"], input[placeholder*="hoursPerWeek" i]').first();
    
    // Buttons
    this.submitButton = page.locator('button[type="submit"]:has-text("Add Subject"), button[type="submit"]:has-text("Update")').first();
    this.cancelButton = page.locator('button:has-text("Cancel")').first();
    
    // Filters
    this.programFilter = page.locator('select, [role="combobox"]').first();
    
    // Grid
    this.dataGrid = page.locator('[role="grid"], .data-grid, table').first();
    
    // Actions
    this.editButton = (subjectName) => page.locator(`button:has-text("Edit"):near(:text("${subjectName}"))`).first();
    this.deleteButton = (subjectName) => page.locator(`button:has-text("Delete"):near(:text("${subjectName}"))`).first();
  }

  async goto() {
    await this.page.goto(this.baseURL);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  async createSubject(subjectData) {
    // Select program
    if (subjectData.programId) {
      await this.programSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${subjectData.programId}, option:has-text("${subjectData.programId}")`).first().click();
    }
    
    // Fill form
    if (subjectData.code) await this.codeInput.fill(subjectData.code);
    if (subjectData.name_en) await this.nameEnInput.fill(subjectData.name_en);
    if (subjectData.name_ar) await this.nameArInput.fill(subjectData.name_ar);
    if (subjectData.creditHours) await this.creditHoursInput.fill(String(subjectData.creditHours));
    if (subjectData.totalHours) await this.totalHoursInput.fill(String(subjectData.totalHours));
    if (subjectData.type) {
      await this.typeSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${subjectData.type}, option:has-text("${subjectData.type}")`).first().click();
    }
    if (subjectData.requirementType) {
      await this.requirementTypeSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`text=${subjectData.requirementType}`).first().click();
    }
    if (subjectData.hoursPerWeek) await this.hoursPerWeekInput.fill(String(subjectData.hoursPerWeek));
    
    // Submit
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async editSubject(subjectName, updates) {
    await this.editButton(subjectName).click();
    await this.page.waitForTimeout(500);
    
    if (updates.name_en) await this.nameEnInput.fill(updates.name_en);
    if (updates.creditHours) await this.creditHoursInput.fill(String(updates.creditHours));
    
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async deleteSubject(subjectName) {
    await this.deleteButton(subjectName).click();
    await this.page.waitForTimeout(500);
    await this.page.locator('button:has-text("OK"), button:has-text("Confirm")').first().click();
    await this.page.waitForTimeout(2000);
  }

  async filterByProgram(programName) {
    await this.programFilter.click();
    await this.page.waitForTimeout(300);
    await this.page.locator(`text=${programName}, option:has-text("${programName}")`).first().click();
    await this.page.waitForTimeout(500);
  }

  async getSubjectInGrid(subjectName) {
    return this.page.locator(`[role="row"]:has-text("${subjectName}")`).first();
  }

  async verifySubjectExists(subjectName) {
    const subject = await this.getSubjectInGrid(subjectName);
    return await subject.isVisible();
  }
}
