const { test, expect } = require('@playwright/test');

test.describe('List Widget Column Manager', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should show list widget type in widget builder', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Click "Add Widget" button
    await page.click('button:has-text("Add Widget")');
    
    // Wait for widget builder to open
    await page.waitForSelector('text=Chart Type');
    
    // Check that "List" option is available
    await expect(page.locator('text=List')).toBeVisible();
    
    // Click on List chart type
    await page.click('button:has-text("List")');
    
    // Verify list is selected
    const listButton = page.locator('button').filter({ hasText: 'List' }).first();
    await expect(listButton).toHaveClass(/selected/);
  });

  test('should show column manager button in list widget', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Wait for existing list widget or create one
    const existingListWidget = page.locator('text=Recent Activities');
    if (await existingListWidget.count() === 0) {
      // Create a list widget
      await page.click('button:has-text("Add Widget")');
      await page.waitForSelector('text=Chart Type');
      await page.click('button:has-text("List")');
      
      // Configure list widget
      await page.selectOption('select[name="dataSource"]', 'activities,announcements,resources');
      await page.click('button:has-text("Save")');
      await page.waitForTimeout(1000);
    }
    
    // Check for column manager button
    await expect(page.locator('button:has-text("Columns")')).toBeVisible();
  });

  test('should open column manager dialog', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Find and click column manager button
    const columnButton = page.locator('button:has-text("Columns")').first();
    await columnButton.click();
    
    // Check that column manager dialog opens
    await expect(page.locator('text=Manage Columns')).toBeVisible();
    await expect(page.locator('text=Base Columns')).toBeVisible();
    
    // Close dialog
    await page.click('button:has-text("Cancel")');
  });

  test('should show related collection columns for attendance', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Create an attendance list widget
    await page.click('button:has-text("Add Widget")');
    await page.waitForSelector('text=Chart Type');
    await page.click('button:has-text("List")');
    await page.selectOption('select[name="dataSource"]', 'attendance');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);
    
    // Open column manager
    const columnButton = page.locator('button:has-text("Columns")').first();
    await columnButton.click();
    
    // Check for related collection columns
    await expect(page.locator('text=Related Collection Columns')).toBeVisible();
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('text=Classes')).toBeVisible();
    
    // Check for specific related columns
    await expect(page.locator('text=Student Email')).toBeVisible();
    await expect(page.locator('text=Student Phone')).toBeVisible();
    await expect(page.locator('text=Class Instructor')).toBeVisible();
    
    // Close dialog
    await page.click('button:has-text("Cancel")');
  });

  test('should show related collection columns for activities', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Create an activity list widget
    await page.click('button:has-text("Add Widget")');
    await page.waitForSelector('text=Chart Type');
    await page.click('button:has-text("List")');
    await page.selectOption('select[name="dataSource"]', 'activities,announcements,resources');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);
    
    // Open column manager
    const columnButton = page.locator('button:has-text("Columns")').first();
    await columnButton.click();
    
    // Check for activity-related columns
    await expect(page.locator('text=Creator Email')).toBeVisible();
    await expect(page.locator('text=Creator Role')).toBeVisible();
    await expect(page.locator('text=Class Subject')).toBeVisible();
    
    // Close dialog
    await page.click('button:has-text("Cancel")');
  });

  test('should allow toggling column selection', async ({ page }) => {
    // Navigate to advanced analytics
    await page.goto('/advanced-analytics');
    await page.waitForLoadState('networkidle');

    // Create a list widget
    await page.click('button:has-text("Add Widget")');
    await page.waitForSelector('text=Chart Type');
    await page.click('button:has-text("List")');
    await page.selectOption('select[name="dataSource"]', 'attendance');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);
    
    // Open column manager
    const columnButton = page.locator('button:has-text("Columns")').first();
    await columnButton.click();
    
    // Toggle a column checkbox
    const studentEmailCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: 'Student Email' }).first();
    await studentEmailCheckbox.check();
    
    // Verify it's checked
    await expect(studentEmailCheckbox).toBeChecked();
    
    // Uncheck it
    await studentEmailCheckbox.uncheck();
    await expect(studentEmailCheckbox).not.toBeChecked();
    
    // Close dialog
    await page.click('button:has-text("Cancel")');
  });
});
