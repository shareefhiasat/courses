/**
 * Page Object for Review Results Page
 * File: client/src/pages/ReviewResultsPage.jsx
 * URL: /review-results?mode=quiz|homework|training|labandproject
 */
export class ReviewResultsPage {
  constructor(page) {
    this.page = page;
    this.baseURL = '/review-results';
    
    // Mode tabs
    this.quizTab = page.locator('button:has-text("Quiz"), [role="tab"]:has-text("Quiz")');
    this.homeworkTab = page.locator('button:has-text("Homework"), [role="tab"]:has-text("Homework")');
    this.trainingTab = page.locator('button:has-text("Training"), [role="tab"]:has-text("Training")');
    this.labProjectTab = page.locator('button:has-text("Lab & Project"), [role="tab"]:has-text("Lab")');
    
    // Filters section
    this.filtersSection = page.locator('[data-section-id="review-filters"], .collapsible-section:has-text("Filters")');
    
    // Filter dropdowns
    this.programFilter = page.locator('select, [role="combobox"]').first();
    this.subjectFilter = page.locator('select, [role="combobox"]').nth(1);
    this.classFilter = page.locator('select, [role="combobox"]').nth(2);
    this.activityFilter = page.locator('select, [role="combobox"]').nth(3);
    this.studentFilter = page.locator('select, [role="combobox"]').nth(4);
    this.retakeFilter = page.locator('select, [role="combobox"]').nth(5);
    this.difficultyFilter = page.locator('select, [role="combobox"]').nth(6);
    this.hasImageFilter = page.locator('select, [role="combobox"]').nth(7);
    this.statusFilter = page.locator('select, [role="combobox"]').nth(8);
    this.featuredFilter = page.locator('select, [role="combobox"]').nth(9);
    this.submissionFilter = page.locator('select, [role="combobox"]').nth(10);
    
    // Search
    this.searchActivityIdInput = page.locator('input[placeholder*="Search Activity ID"], input[type="search"]');
    
    // Statistics cards
    this.totalResultsCard = page.locator('[data-testid="total-results"], .stat-card:has-text("total results")');
    this.averageScoreCard = page.locator('[data-testid="average-score"], .stat-card:has-text("Average Score")');
    this.passedCard = page.locator('[data-testid="passed"], .stat-card:has-text("passed")');
    this.failedCard = page.locator('[data-testid="failed"], .stat-card:has-text("failed")');
    this.passRateCard = page.locator('[data-testid="pass-rate"], .stat-card:has-text("pass rate")');
    
    // Results grid/table
    this.resultsGrid = page.locator('[role="grid"], .data-grid, table').first();
    this.resultsRows = page.locator('[role="row"]');
  }

  async goto(mode = 'quiz') {
    await this.page.goto(`${this.baseURL}?mode=${mode}`);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
  }

  async switchToQuiz() {
    await this.quizTab.click();
    await this.page.waitForTimeout(1000);
  }

  async switchToHomework() {
    await this.homeworkTab.click();
    await this.page.waitForTimeout(1000);
  }

  async switchToTraining() {
    await this.trainingTab.click();
    await this.page.waitForTimeout(1000);
  }

  async switchToLabProject() {
    await this.labProjectTab.click();
    await this.page.waitForTimeout(1000);
  }

  async filterByProgram(programName) {
    await this.programFilter.click();
    await this.page.waitForTimeout(300);
    await this.page.locator(`text=${programName}, option:has-text("${programName}")`).first().click();
    await this.page.waitForTimeout(1000);
  }

  async filterBySubject(subjectName) {
    await this.subjectFilter.click();
    await this.page.waitForTimeout(300);
    await this.page.locator(`text=${subjectName}`).first().click();
    await this.page.waitForTimeout(1000);
  }

  async filterByClass(className) {
    await this.classFilter.click();
    await this.page.waitForTimeout(300);
    await this.page.locator(`text=${className}`).first().click();
    await this.page.waitForTimeout(1000);
  }

  async filterByActivity(activityName) {
    await this.activityFilter.click();
    await this.page.waitForTimeout(300);
    await this.page.locator(`text=${activityName}`).first().click();
    await this.page.waitForTimeout(1000);
  }

  async filterByStudent(studentEmail) {
    await this.studentFilter.click();
    await this.page.waitForTimeout(300);
    await this.page.locator(`text=${studentEmail}`).first().click();
    await this.page.waitForTimeout(1000);
  }

  async searchActivityId(activityId) {
    if (await this.searchActivityIdInput.isVisible()) {
      await this.searchActivityIdInput.fill(activityId);
      await this.page.waitForTimeout(500);
    }
  }

  async getResultsCount() {
    const rows = await this.resultsRows.count();
    // Subtract 1 for header row if present
    return rows > 0 ? rows - 1 : 0;
  }

  async verifyResultsGridVisible() {
    return await this.resultsGrid.isVisible();
  }

  async verifyStatisticsVisible() {
    const totalVisible = await this.totalResultsCard.isVisible().catch(() => false);
    const avgVisible = await this.averageScoreCard.isVisible().catch(() => false);
    return totalVisible && avgVisible;
  }

  async getResultRow(studentEmail) {
    return this.page.locator(`[role="row"]:has-text("${studentEmail}")`).first();
  }

  async verifyResultExists(studentEmail) {
    const row = await this.getResultRow(studentEmail);
    return await row.isVisible();
  }
}
