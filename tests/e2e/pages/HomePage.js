/**
 * Page Object for Home Page (Activities, Resources, Quizzes)
 * File: client/src/pages/HomePage.jsx
 */
import { BASE_URL, PATHS, TIMEOUTS } from '../config/constants';

export class HomePage {
  constructor(page) {
    this.page = page;
    this.baseURL = PATHS.HOME;
    
    // Mode tabs (Activities, Resources, Quizzes)
    this.activitiesTab = page.locator('button:has-text("Activities"), [role="tab"]:has-text("Activities")');
    this.resourcesTab = page.locator('button:has-text("Resources"), [role="tab"]:has-text("Resources")');
    this.quizzesTab = page.locator('button:has-text("Quizzes"), [role="tab"]:has-text("Quizzes")');
    
    // Course/Category tabs (for Activities)
    this.allTab = page.locator('button:has-text("All"), [role="tab"]:has-text("All")').first();
    this.programmingTab = page.locator('button:has-text("Programming"), [role="tab"]:has-text("Programming")');
    this.computingTab = page.locator('button:has-text("Computing"), [role="tab"]:has-text("Computing")');
    
    // Filters
    this.searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    this.allLevelsFilter = page.locator('button:has-text("All Levels")');
    this.beginnerFilter = page.locator('button:has-text("Beginner")');
    this.intermediateFilter = page.locator('button:has-text("Intermediate")');
    this.advancedFilter = page.locator('button:has-text("Advanced")');
    
    // Type filters - more specific selectors to avoid conflicts
    this.allTypesFilter = page.locator('button:has-text("All Types")');
    this.trainingFilter = page.locator('button[title="Training"], button:has-text("Training"):not([role="tab"])');
    this.homeworkFilter = page.locator('button[title="Homework"], button:has-text("Homework"):not([role="tab"])');
    this.quizFilter = page.locator('button[title="Quiz"], button:has-text("Quiz"):not([role="tab"])');
    this.labFilter = page.locator('button[title="Lab"], button:has-text("Lab"):not([role="tab"])');
    
    // Status filters
    this.completedFilter = page.locator('button:has-text("Completed"), [aria-label*="Completed" i]');
    this.pendingFilter = page.locator('button:has-text("Pending"), [aria-label*="Pending" i]');
    this.requiredFilter = page.locator('button:has-text("Required"), [aria-label*="Required" i]');
    this.optionalFilter = page.locator('button:has-text("Optional"), [aria-label*="Optional" i]');
    this.overdueFilter = page.locator('button:has-text("overdue"), [aria-label*="overdue" i]');
    
    // Additional filters
    this.bookmarkedFilter = page.locator('button:has-text("Bookmarked"), [aria-label*="Bookmarked" i]');
    this.featuredFilter = page.locator('button:has-text("Featured"), [aria-label*="Featured" i]');
    this.retakeAllowedFilter = page.locator('button:has-text("Retakable"), [aria-label*="Retake" i]');
    this.gradedFilter = page.locator('button:has-text("Graded"), [aria-label*="Graded" i]');
    
    // Category tabs
    this.algorithmTab = page.locator('button:has-text("Algorithm"), [role="tab"]:has-text("Algorithm")');
    this.securityTab = page.locator('button:has-text("Security"), [role="tab"]:has-text("Security")');
    this.generalTab = page.locator('button:has-text("General"), [role="tab"]:has-text("General")');
    
    // Activity cards
    this.activityCards = page.locator('[data-testid="activity-card"], .activity-card, [class*="card"]');
    this.playButton = (activityTitle) => page.locator(`button:has-text("${activityTitle}")`).locator('..').locator('button:has-text("Play"), button[aria-label*="Start" i]').first();
  }

  async goto(mode = 'activities') {
    await this.page.goto(BASE_URL + PATHS.HOME + `?mode=${mode}`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(TIMEOUTS.PAGE_LOAD);
  }

  async switchToActivities() {
    await this.activitiesTab.click();
    await this.page.waitForTimeout(500);
  }

  async switchToResources() {
    await this.resourcesTab.click();
    await this.page.waitForTimeout(500);
  }

  async switchToQuizzes() {
    await this.quizzesTab.click();
    await this.page.waitForTimeout(500);
  }

  async selectCategory(categoryName) {
    const categoryTab = this.page.locator(`[role="tab"]:has-text("${categoryName}")`);
    if (await categoryTab.isVisible()) {
      await categoryTab.click();
      await this.page.waitForTimeout(500);
    }
  }

  async searchActivities(searchTerm) {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500);
  }

  async filterByLevel(level) {
    const levelMap = {
      'all': this.allLevelsFilter,
      'beginner': this.beginnerFilter,
      'intermediate': this.intermediateFilter,
      'advanced': this.advancedFilter
    };
    const filter = levelMap[level.toLowerCase()];
    if (filter && await filter.isVisible()) {
      await filter.click();
      await this.page.waitForTimeout(500);
    }
  }

  async filterByType(type) {
    const typeMap = {
      'all': this.allTypesFilter,
      'training': this.trainingFilter,
      'homework': this.homeworkFilter,
      'quiz': this.quizFilter,
      'lab': this.labFilter
    };
    const filter = typeMap[type.toLowerCase()];
    if (filter) {
      await filter.first().click();
      await this.page.waitForTimeout(500);
    }
  }

  async filterByStatus(status) {
    const statusMap = {
      'completed': this.completedFilter,
      'pending': this.pendingFilter,
      'required': this.requiredFilter,
      'optional': this.optionalFilter,
      'overdue': this.overdueFilter
    };
    const filter = statusMap[status.toLowerCase()];
    if (filter && await filter.isVisible()) {
      await filter.click();
      await this.page.waitForTimeout(500);
    }
  }

  async getActivityCard(activityTitle) {
    return this.page.locator(`[data-testid="activity-card"]:has-text("${activityTitle}"), .activity-card:has-text("${activityTitle}")`).first();
  }

  async clickActivity(activityTitle) {
    const card = await this.getActivityCard(activityTitle);
    const playButton = card.locator('button:has-text("Play"), button[aria-label*="Start" i]').first();
    if (await playButton.isVisible()) {
      await playButton.click();
    } else {
      await card.click();
    }
    await this.page.waitForTimeout(1000);
  }

  async verifyActivityExists(activityTitle) {
    const card = await this.getActivityCard(activityTitle);
    return await card.isVisible();
  }

  async getActivityCount() {
    const cards = await this.activityCards.count();
    return cards;
  }

  // Additional filter methods for new test cases
  async filterByBookmarked() {
    if (await this.bookmarkedFilter.isVisible()) {
      await this.bookmarkedFilter.click();
      await this.page.waitForTimeout(500);
    }
  }

  async filterByFeatured() {
    if (await this.featuredFilter.isVisible()) {
      await this.featuredFilter.click();
      await this.page.waitForTimeout(500);
    }
  }

  async filterByRetakeAllowed() {
    if (await this.retakeAllowedFilter.isVisible()) {
      await this.retakeAllowedFilter.click();
      await this.page.waitForTimeout(500);
    }
  }

  async filterByGraded() {
    if (await this.gradedFilter.isVisible()) {
      await this.gradedFilter.click();
      await this.page.waitForTimeout(500);
    }
  }

  async getFirstActivityTitle() {
    const firstCard = this.activityCards.first();
    if (await firstCard.isVisible()) {
      return await firstCard.textContent();
    }
    return null;
  }

  async playActivity(activityTitle) {
    await this.clickActivity(activityTitle);
  }

  async resetAllFilters() {
    // Reset to All categories
    await this.allTab.click();
    await this.page.waitForTimeout(500);
    
    // Reset to All Levels
    await this.allLevelsFilter.click();
    await this.page.waitForTimeout(500);
    
    // Reset to All Types
    await this.allTypesFilter.click();
    await this.page.waitForTimeout(500);
    
    // Clear search
    await this.searchInput.clear();
    await this.page.waitForTimeout(500);
  }
}
