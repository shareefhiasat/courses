const { test, expect } = require('@playwright/test');

test.describe('Enhanced List Chart Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display localized column headers', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Wait for charts to load
    await page.waitForSelector('[data-testid="list-chart"]', { timeout: 10000 });
    
    // Check for localized column headers
    await expect(page.locator('text=Student Name')).toBeVisible();
    await expect(page.locator('text=Student Number')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Class')).toBeVisible();
  });

  test('should show actual student names instead of "Student Unknown"', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Wait for charts to load
    await page.waitForSelector('[data-testid="list-chart"]', { timeout: 10000 });
    
    // Click on attendance pie chart slice to create list widget
    const attendanceChart = page.locator('text=Attendance by Status').first();
    await attendanceChart.locator('ancestor::div').locator('svg').first().locator('path').first().click();
    
    // Wait for list widget to appear
    await page.waitForSelector('text=Attendance by Status - Present');
    
    // Check that student names are displayed (not "Student Unknown")
    const listContent = page.locator('.list-chart-content');
    await expect(listContent).not.toContainText('Student Unknown');
    
    // Should contain actual student information
    await expect(listContent).toBeVisible();
  });

  test('should show class names instead of object IDs', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Wait for charts to load
    await page.waitForSelector('[data-testid="list-chart"]', { timeout: 10000 });
    
    // Click on attendance pie chart slice to create list widget
    const attendanceChart = page.locator('text=Attendance by Status').first();
    await attendanceChart.locator('ancestor::div').locator('svg').first().locator('path').first().click();
    
    // Wait for list widget to appear
    await page.waitForSelector('text=Attendance by Status - Present');
    
    // Check that class names are displayed (not object IDs like "xsJnz2J32PLllqhF8...")
    const listContent = page.locator('.list-chart-content');
    await expect(listContent).not.toContainText('xsJnz2J32PLllqhF8');
  });

  test('should show student numbers instead of N/A', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Wait for charts to load
    await page.waitForSelector('[data-testid="list-chart"]', { timeout: 10000 });
    
    // Click on attendance pie chart slice to create list widget
    const attendanceChart = page.locator('text=Attendance by Status').first();
    await attendanceChart.locator('ancestor::div').locator('svg').first().locator('path').first().click();
    
    // Wait for list widget to appear
    await page.waitForSelector('text=Attendance by Status - Present');
    
    // Check that student numbers are displayed (not "N/A")
    const listContent = page.locator('.list-chart-content');
    await expect(listContent).not.toContainText('N/A');
  });

  test('should show specific attendance status instead of "Not specified"', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Wait for charts to load
    await page.waitForSelector('[data-testid="list-chart"]', { timeout: 10000 });
    
    // Click on attendance pie chart slice to create list widget
    const attendanceChart = page.locator('text=Attendance by Status').first();
    await attendanceChart.locator('ancestor::div').locator('svg').first().locator('path').first().click();
    
    // Wait for list widget to appear
    await page.waitForSelector('text=Attendance by Status - Present');
    
    // Check that specific status is displayed (not "Not specified")
    const listContent = page.locator('.list-chart-content');
    await expect(listContent).not.toContainText('Not specified');
    
    // Should contain actual attendance status like "Present", "Late", etc.
    await expect(listContent).toContainText(/Present|Late|Absent/);
  });

  test('should display Arabic titles for activities', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Wait for charts to load
    await page.waitForSelector('[data-testid="list-chart"]', { timeout: 10000 });
    
    // Click on activity types pie chart slice to create list widget
    const activityChart = page.locator('text=Activity Types').first();
    await activityChart.locator('ancestor::div').locator('svg').first().locator('path').first().click();
    
    // Wait for list widget to appear
    await page.waitForSelector('text=Activity Types -');
    
    // Check that Arabic title column exists
    await expect(page.locator('text=Title (AR)')).toBeVisible();
  });
});
