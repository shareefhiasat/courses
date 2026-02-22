const { test, expect } = require('@playwright/test');

test.describe('Pie Chart Click Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should show activity type details when clicking pie chart slices', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Wait for charts to load
    await page.waitForSelector('[data-testid="pie-chart"]', { timeout: 10000 });
    
    // Find the Activity Types pie chart
    const activityChart = page.locator('text=Activity Types').first();
    await expect(activityChart).toBeVisible();

    // Click on a slice in the Activity Types pie chart
    const pieChart = page.locator('svg').filter({ has: page.locator('path[fill*="rgb"]') }).first();
    await pieChart.locator('path').first().click();

    // Verify the modal appears with activity details
    await expect(page.locator('text=Items')).toBeVisible();
    await expect(page.locator('text=Type')).toBeVisible();
    await expect(page.locator('text=Title')).toBeVisible();
    await expect(page.locator('text=ID')).toBeVisible();
    await expect(page.locator('text=Created')).toBeVisible();

    // Close the modal
    await page.click('[aria-label="close"], button:has-text("×")');
    await expect(page.locator('text=Items')).not.toBeVisible();
  });

  test('should show attendance details when clicking attendance pie chart', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Wait for charts to load
    await page.waitForSelector('[data-testid="pie-chart"]', { timeout: 10000 });
    
    // Find the Attendance by Status pie chart
    const attendanceChart = page.locator('text=Attendance by Status').first();
    await expect(attendanceChart).toBeVisible();

    // Click on a slice in the Attendance pie chart
    const pieChart = attendanceChart.locator('ancestor::div').locator('svg').first();
    await pieChart.locator('path').first().click();

    // Verify the modal appears with attendance details
    await expect(page.locator('text=Items')).toBeVisible();
    await expect(page.locator('text=Student Name')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Date')).toBeVisible();
    await expect(page.locator('text=Class')).toBeVisible();

    // Close the modal
    await page.click('[aria-label="close"], button:has-text("×")');
    await expect(page.locator('text=Items')).not.toBeVisible();
  });

  test('should show appropriate tooltips on hover', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Wait for charts to load
    await page.waitForSelector('[data-testid="pie-chart"]', { timeout: 10000 });

    // Hover over a pie chart slice
    const pieChart = page.locator('svg').filter({ has: page.locator('path[fill*="rgb"]') }).first();
    const slice = pieChart.locator('path').first();
    
    await slice.hover();
    
    // Check if tooltip appears (title attribute)
    const title = await slice.getAttribute('title');
    expect(title).toContain('Click for details');
  });

  test('should handle legend clicks as well', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Wait for charts to load
    await page.waitForSelector('[data-testid="pie-chart"]', { timeout: 10000 });

    // Find and click on a legend item
    const legendItem = page.locator('div').filter({ hasText: /\(\d+\)/ }).first();
    await legendItem.click();

    // Verify the modal appears
    await expect(page.locator('text=Items')).toBeVisible();

    // Close the modal
    await page.click('[aria-label="close"], button:has-text("×")');
  });
});
