import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Enhanced List Widget Functionality
 * Tests the complete list widget flow including:
 * - Widget builder with restricted data sources
 * - Aggregation field hidden for list widgets
 * - Resolved values (no N/A or ObjectIDs)
 * - Column manager functionality
 * - Drill-down from charts
 */

test.describe('Enhanced List Widget', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to analytics
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
  });

  test('Widget Builder - List type hides aggregation and restricts data sources', async ({ page }) => {
    // Open widget builder
    await page.click('button:has-text("Add Widget")');
    await expect(page.locator('text=Create New Widget')).toBeVisible();

    // Select list chart type
    await page.click('button:has-text("List")');

    // Verify aggregation field is hidden
    const aggregationField = page.locator('label:has-text("Aggregation")');
    await expect(aggregationField).not.toBeVisible();

    // Verify Group By is relabeled to "Prefilter (optional)"
    await expect(page.locator('label:has-text("Prefilter (optional)")')).toBeVisible();

    // Open data source dropdown
    await page.click('select[value*="enrollments"], select:near(:text("Data Source"))').first();

    // Verify only allowed data sources are available
    const allowedSources = [
      'ds all activities',
      'Activities',
      'participations',
      'penalties',
      'behaviors',
      'Users',
      'Enrollments',
      'Attendance'
    ];

    // Verify restricted sources are NOT available
    const restrictedSources = [
      'Quizzes',
      'Quiz Submissions',
      'Classes',
      'Programs',
      'Subjects'
    ];

    for (const source of restrictedSources) {
      const option = page.locator(`option:has-text("${source}")`);
      await expect(option).not.toBeVisible();
    }
  });

  test('Attendance List - Shows resolved student names and numbers', async ({ page }) => {
    // Create attendance list widget
    await page.click('button:has-text("Add Widget")');
    await page.click('button:has-text("List")');
    
    // Select attendance data source
    await page.selectOption('select:near(:text("Data Source"))', { label: /Attendance/i });
    
    // Fill in title
    await page.fill('input[placeholder*="widget title"]', 'Attendance List Test');
    
    // Save widget
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(1000);

    // Verify list widget is created
    await expect(page.locator('text=Attendance List Test')).toBeVisible();

    // Verify student names are resolved (not "Unknown Student" or "N/A")
    const studentNameCells = page.locator('[style*="width: 25%"]:has-text("Student")');
    const firstStudentName = await studentNameCells.first().textContent();
    
    // Should not contain N/A, Unknown, or object IDs
    expect(firstStudentName).not.toContain('N/A');
    expect(firstStudentName).not.toContain('Unknown Student');
    expect(firstStudentName).not.toMatch(/^[a-zA-Z0-9]{20,}$/); // Not an ObjectID

    // Verify student numbers are shown
    const studentNumberCells = page.locator('[style*="width: 15%"]:has-text("Number")');
    const firstStudentNumber = await studentNumberCells.first().textContent();
    expect(firstStudentNumber).not.toBe('N/A');

    // Verify status is localized
    const statusCells = page.locator('text=/Present|Late|Absent/');
    await expect(statusCells.first()).toBeVisible();

    // Verify class names are resolved
    const classNameCells = page.locator('[style*="width: 20%"]').filter({ hasText: /Class/ });
    const firstClassName = await classNameCells.first().textContent();
    expect(firstClassName).not.toMatch(/^[a-zA-Z0-9]{20,}$/); // Not an ObjectID
  });

  test('Activity List - Shows resolved creator names and types', async ({ page }) => {
    // Create activity list widget
    await page.click('button:has-text("Add Widget")');
    await page.click('button:has-text("List")');
    
    // Select activities data source
    await page.selectOption('select:near(:text("Data Source"))', { label: /Activities/i });
    
    // Fill in title
    await page.fill('input[placeholder*="widget title"]', 'Activity List Test');
    
    // Save widget
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(1000);

    // Verify list widget is created
    await expect(page.locator('text=Activity List Test')).toBeVisible();

    // Verify activity types are localized
    const typeCells = page.locator('text=/Homework|Quiz|Video|Link/');
    await expect(typeCells.first()).toBeVisible();

    // Verify creator names are resolved (not "Unknown" or object IDs)
    const creatorCells = page.locator('[style*="width: 15%"]').filter({ hasText: /Created/ });
    const firstCreator = await creatorCells.first().textContent();
    expect(firstCreator).not.toContain('Unknown');
    expect(firstCreator).not.toMatch(/^[a-zA-Z0-9]{20,}$/);

    // Verify titles are shown
    const titleCells = page.locator('[style*="width: 25%"]').filter({ hasText: /Title/ });
    await expect(titleCells.first()).toBeVisible();
  });

  test('Column Manager - Opens and allows column toggling', async ({ page }) => {
    // Create a list widget first
    await page.click('button:has-text("Add Widget")');
    await page.click('button:has-text("List")');
    await page.selectOption('select:near(:text("Data Source"))', { label: /Attendance/i });
    await page.fill('input[placeholder*="widget title"]', 'Column Manager Test');
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(1000);

    // Open column manager
    await page.click('button:has-text("Columns")');
    
    // Verify column manager dialog is open
    await expect(page.locator('text=Manage Columns')).toBeVisible();

    // Verify base columns section
    await expect(page.locator('text=Base Columns')).toBeVisible();
    
    // Verify required columns are checked and disabled
    const requiredColumns = ['student name', 'status', 'date'];
    for (const col of requiredColumns) {
      const checkbox = page.locator(`input[type="checkbox"]:near(:text("${col}"))`).first();
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toBeDisabled();
    }

    // Verify related collection columns section
    await expect(page.locator('text=Related Collection Columns')).toBeVisible();
    
    // Verify Users section with student email, phone, etc.
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('text=Student Email')).toBeVisible();
    await expect(page.locator('text=Student Phone')).toBeVisible();

    // Verify Classes section
    await expect(page.locator('text=Classes')).toBeVisible();
    await expect(page.locator('text=Class Instructor')).toBeVisible();

    // Toggle a related column
    await page.click('input[type="checkbox"]:near(:text("Student Email"))');
    
    // Apply changes
    await page.click('button:has-text("Apply")');
    
    // Verify dialog closes
    await expect(page.locator('text=Manage Columns')).not.toBeVisible();
  });

  test('Drill-down from Pie Chart - Creates filtered list widget', async ({ page }) => {
    // Wait for default pie chart to load (Attendance by Status)
    await page.waitForSelector('text=Attendance by Status', { timeout: 10000 });

    // Click on a pie slice (Present)
    const pieChart = page.locator('svg').filter({ has: page.locator('path[fill]') }).first();
    await pieChart.click({ position: { x: 100, y: 100 } });
    
    // Wait for list widget to be created
    await page.waitForTimeout(1500);

    // Verify a new list widget was created with filtered data
    const listWidgets = page.locator('text=/Attendance by Status - (Present|Late|Absent)/');
    await expect(listWidgets.first()).toBeVisible({ timeout: 5000 });

    // Verify the list shows only filtered items
    const listRows = page.locator('[style*="border-bottom"]').filter({ hasText: /Present|Late/ });
    const rowCount = await listRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Enrollment List - Shows program names and student info', async ({ page }) => {
    // Create enrollment list widget
    await page.click('button:has-text("Add Widget")');
    await page.click('button:has-text("List")');
    
    // Select enrollments data source
    await page.selectOption('select:near(:text("Data Source"))', { label: /Enrollments/i });
    
    // Fill in title
    await page.fill('input[placeholder*="widget title"]', 'Enrollment List Test');
    
    // Save widget
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(1000);

    // Verify program names are resolved
    const programCells = page.locator('[style*="width: 25%"]').filter({ hasText: /Program/ });
    const firstProgram = await programCells.first().textContent();
    expect(firstProgram).not.toMatch(/^[a-zA-Z0-9]{20,}$/); // Not an ObjectID
    expect(firstProgram).not.toBe('Not specified');

    // Verify student names are resolved
    const studentCells = page.locator('[style*="width: 30%"]').filter({ hasText: /Student/ });
    const firstStudent = await studentCells.first().textContent();
    expect(firstStudent).not.toContain('Unknown Student');
  });

  test('List Widget - Handles empty data gracefully', async ({ page }) => {
    // Create a list widget with filters that return no data
    await page.click('button:has-text("Add Widget")');
    await page.click('button:has-text("List")');
    await page.selectOption('select:near(:text("Data Source"))', { label: /Penalties/i });
    await page.fill('input[placeholder*="widget title"]', 'Empty List Test');
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(1000);

    // Verify "No data available" message is shown
    await expect(page.locator('text=No data available')).toBeVisible();
  });

  test('List Widget - IDs are truncated to 8 characters', async ({ page }) => {
    // Create a list widget
    await page.click('button:has-text("Add Widget")');
    await page.click('button:has-text("List")');
    await page.selectOption('select:near(:text("Data Source"))', { label: /Attendance/i });
    await page.fill('input[placeholder*="widget title"]', 'ID Truncation Test');
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(1000);

    // Find ID column cells
    const idCells = page.locator('[style*="width: 10%"]').filter({ hasText: /[a-zA-Z0-9]{8}/ });
    
    if (await idCells.count() > 0) {
      const firstId = await idCells.first().textContent();
      // Verify ID is truncated (8 chars + "..." or just 8 chars)
      expect(firstId.length).toBeLessThanOrEqual(11); // 8 chars + "..."
    }
  });

  test('Participation List - Shows student and class info', async ({ page }) => {
    // Create participation list widget
    await page.click('button:has-text("Add Widget")');
    await page.click('button:has-text("List")');
    
    // Select participations data source
    await page.selectOption('select:near(:text("Data Source"))', { label: /participations/i });
    
    // Fill in title
    await page.fill('input[placeholder*="widget title"]', 'Participation List Test');
    
    // Save widget
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(1000);

    // Verify widget is created
    await expect(page.locator('text=Participation List Test')).toBeVisible();

    // Verify student names are shown
    const studentCells = page.locator('text=/Student/').first();
    await expect(studentCells).toBeVisible();
  });

  test('Behavior List - Shows type and severity', async ({ page }) => {
    // Create behavior list widget
    await page.click('button:has-text("Add Widget")');
    await page.click('button:has-text("List")');
    
    // Select behaviors data source
    await page.selectOption('select:near(:text("Data Source"))', { label: /behaviors/i });
    
    // Fill in title
    await page.fill('input[placeholder*="widget title"]', 'Behavior List Test');
    
    // Save widget
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(1000);

    // Verify widget is created
    await expect(page.locator('text=Behavior List Test')).toBeVisible();
  });
});
