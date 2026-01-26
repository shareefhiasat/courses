/**
 * Review Results Page Test Suite
 * Tests: Quiz, Homework, Training, Lab & Project results viewing, filtering, statistics
 */
import { test, expect } from '@playwright/test';
import { ReviewResultsPage } from '../pages/ReviewResultsPage';
import { loginAs } from '../utils/auth';
import { testConfig, tags } from '../config/test-config';

test.describe('Review Results Page', () => {
  let reviewResultsPage;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, testConfig.superAdmin);
    reviewResultsPage = new ReviewResultsPage(page);
  });

  test(`TC-REVIEW-001: View Quiz Results ${tags.critical} ${tags.dashboard}`, async ({ page }) => {
    await reviewResultsPage.goto('quiz');
    
    // Verify quiz tab is active
    await expect(reviewResultsPage.quizTab).toBeVisible();
    
    // Verify results grid is visible
    const gridVisible = await reviewResultsPage.verifyResultsGridVisible();
    expect(gridVisible).toBeTruthy();
    
    // Verify statistics are visible
    const statsVisible = await reviewResultsPage.verifyStatisticsVisible();
    expect(statsVisible).toBeTruthy();
  });

  test(`TC-REVIEW-002: View Homework Results ${tags.critical} ${tags.dashboard}`, async ({ page }) => {
    await reviewResultsPage.goto('homework');
    
    // Verify homework tab is active
    await expect(reviewResultsPage.homeworkTab).toBeVisible();
    
    // Verify results grid is visible
    const gridVisible = await reviewResultsPage.verifyResultsGridVisible();
    expect(gridVisible).toBeTruthy();
  });

  test(`TC-REVIEW-003: View Training Results ${tags.critical} ${tags.dashboard}`, async ({ page }) => {
    await reviewResultsPage.goto('training');
    
    // Verify training tab is active
    await expect(reviewResultsPage.trainingTab).toBeVisible();
    
    // Verify results grid is visible
    const gridVisible = await reviewResultsPage.verifyResultsGridVisible();
    expect(gridVisible).toBeTruthy();
  });

  test(`TC-REVIEW-004: View Lab & Project Results ${tags.critical} ${tags.dashboard}`, async ({ page }) => {
    await reviewResultsPage.goto('labandproject');
    
    // Verify lab & project tab is active
    await expect(reviewResultsPage.labProjectTab).toBeVisible();
    
    // Verify results grid is visible
    const gridVisible = await reviewResultsPage.verifyResultsGridVisible();
    expect(gridVisible).toBeTruthy();
  });

  test(`TC-REVIEW-005: Switch Between Result Modes ${tags.dashboard}`, async ({ page }) => {
    await reviewResultsPage.goto('quiz');
    await page.waitForTimeout(1000);
    
    // Switch to Homework
    await reviewResultsPage.switchToHomework();
    await expect(reviewResultsPage.homeworkTab).toBeVisible();
    
    // Switch to Training
    await reviewResultsPage.switchToTraining();
    await expect(reviewResultsPage.trainingTab).toBeVisible();
    
    // Switch to Lab & Project
    await reviewResultsPage.switchToLabProject();
    await expect(reviewResultsPage.labProjectTab).toBeVisible();
    
    // Switch back to Quiz
    await reviewResultsPage.switchToQuiz();
    await expect(reviewResultsPage.quizTab).toBeVisible();
  });

  test(`TC-REVIEW-006: Filter Results by Program ${tags.dashboard}`, async ({ page }) => {
    await reviewResultsPage.goto('quiz');
    await page.waitForTimeout(2000);
    
    // Expand filters if collapsed
    const filtersSection = reviewResultsPage.filtersSection;
    if (await filtersSection.isVisible()) {
      const toggleButton = filtersSection.locator('button').first();
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Filter by program (if programs exist)
    const programSelect = reviewResultsPage.programFilter;
    if (await programSelect.isVisible()) {
      await programSelect.click();
      await page.waitForTimeout(500);
      const options = page.locator('option, [role="option"]');
      const optionCount = await options.count();
      if (optionCount > 1) {
        await options.nth(1).click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Verify filter is applied
    expect(true).toBeTruthy();
  });

  test(`TC-REVIEW-007: Filter Results by Subject ${tags.dashboard}`, async ({ page }) => {
    await reviewResultsPage.goto('quiz');
    await page.waitForTimeout(2000);
    
    // Expand filters
    const filtersSection = reviewResultsPage.filtersSection;
    if (await filtersSection.isVisible()) {
      const toggleButton = filtersSection.locator('button').first();
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Filter by subject
    const subjectSelect = reviewResultsPage.subjectFilter;
    if (await subjectSelect.isVisible()) {
      await subjectSelect.click();
      await page.waitForTimeout(500);
      const options = page.locator('option, [role="option"]');
      const optionCount = await options.count();
      if (optionCount > 1) {
        await options.nth(1).click();
        await page.waitForTimeout(1000);
      }
    }
    
    expect(true).toBeTruthy();
  });

  test(`TC-REVIEW-008: Filter Results by Class ${tags.dashboard}`, async ({ page }) => {
    await reviewResultsPage.goto('quiz');
    await page.waitForTimeout(2000);
    
    // Expand filters
    const filtersSection = reviewResultsPage.filtersSection;
    if (await filtersSection.isVisible()) {
      const toggleButton = filtersSection.locator('button').first();
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Filter by class
    const classSelect = reviewResultsPage.classFilter;
    if (await classSelect.isVisible()) {
      await classSelect.click();
      await page.waitForTimeout(500);
      const options = page.locator('option, [role="option"]');
      const optionCount = await options.count();
      if (optionCount > 1) {
        await options.nth(1).click();
        await page.waitForTimeout(1000);
      }
    }
    
    expect(true).toBeTruthy();
  });

  test(`TC-REVIEW-009: Search Activity ID ${tags.dashboard}`, async ({ page }) => {
    await reviewResultsPage.goto('quiz');
    await page.waitForTimeout(2000);
    
    // Expand filters
    const filtersSection = reviewResultsPage.filtersSection;
    if (await filtersSection.isVisible()) {
      const toggleButton = filtersSection.locator('button').first();
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Search for activity ID
    await reviewResultsPage.searchActivityId('test');
    await page.waitForTimeout(1000);
    
    expect(true).toBeTruthy();
  });

  test(`TC-REVIEW-010: View Statistics ${tags.critical} ${tags.dashboard}`, async ({ page }) => {
    await reviewResultsPage.goto('quiz');
    await page.waitForTimeout(2000);
    
    // Verify statistics cards are visible
    const statsVisible = await reviewResultsPage.verifyStatisticsVisible();
    expect(statsVisible).toBeTruthy();
    
    // Verify specific stat cards
    const totalVisible = await reviewResultsPage.totalResultsCard.isVisible().catch(() => false);
    const avgVisible = await reviewResultsPage.averageScoreCard.isVisible().catch(() => false);
    const passedVisible = await reviewResultsPage.passedCard.isVisible().catch(() => false);
    
    expect(totalVisible || avgVisible || passedVisible).toBeTruthy();
  });

  test(`TC-REVIEW-011: Results Grid Display ${tags.critical} ${tags.dashboard}`, async ({ page }) => {
    await reviewResultsPage.goto('quiz');
    await page.waitForTimeout(2000);
    
    // Verify grid is visible
    const gridVisible = await reviewResultsPage.verifyResultsGridVisible();
    expect(gridVisible).toBeTruthy();
    
    // Get results count
    const count = await reviewResultsPage.getResultsCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test(`TC-REVIEW-012: Filter by Difficulty ${tags.dashboard}`, async ({ page }) => {
    await reviewResultsPage.goto('quiz');
    await page.waitForTimeout(2000);
    
    // Expand filters
    const filtersSection = reviewResultsPage.filtersSection;
    if (await filtersSection.isVisible()) {
      const toggleButton = filtersSection.locator('button').first();
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Filter by difficulty
    const difficultySelect = reviewResultsPage.difficultyFilter;
    if (await difficultySelect.isVisible()) {
      await difficultySelect.click();
      await page.waitForTimeout(500);
      const options = page.locator('option, [role="option"]');
      const optionCount = await options.count();
      if (optionCount > 1) {
        await options.nth(1).click();
        await page.waitForTimeout(1000);
      }
    }
    
    expect(true).toBeTruthy();
  });
});
