# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: missing-routes-ui.spec.js >> Student Dashboard UI — Deep >> TC-MR-UI-003: Student dashboard shows progress info
- Location: tests/e2e/specs/missing-routes-ui.spec.js:40:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/performance/i).or(getByText(/overview/i)).or(locator('[data-testid*="student-overview-analytics"]')).or(locator('[data-testid*="performance"]')).or(getByText(/الأداء/i)).or(getByText(/نظرة عامة/i)).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/performance/i).or(getByText(/overview/i)).or(locator('[data-testid*="student-overview-analytics"]')).or(locator('[data-testid*="performance"]')).or(getByText(/الأداء/i)).or(getByText(/نظرة عامة/i)).first()

```

# Test source

```ts
  1   | /**
  2   |  * Missing Routes UI Tests — Deep Student Dashboard, Availability, Redirects, Lookup Tabs
  3   |  * Module: student-dashboard, activity-detail, quiz-taking, unauthorized, qrcode, redirects
  4   |  * Covers: TC-MR-UI-001 through TC-MR-UI-045
  5   |  *
  6   |  * Test depth:
  7   |  * - Student dashboard: widgets + progress + attendance + grades
  8   |  * - Instructor/classroom availability: calendar + selector
  9   |  * - Unauthorized page: 403 message
  10  |  * - QR code display: public page renders
  11  |  * - Activity detail: page load + info
  12  |  * - Quiz taking: page load + questions/start button
  13  |  * - Quiz preview: page load
  14  |  * - Workflow document detail: page load
  15  |  * - Redirect routes: verify URL changes
  16  |  * - Dashboard lookup tabs: all 15 tabs load with content
  17  |  */
  18  | import { test, expect } from '@playwright/test';
  19  | import { testConfig } from '../config/test.config.js';
  20  | import { gotoWithAuth, waitForContent, isAccessDenied, dismissOverlays } from '../utils/ui-helpers.js';
  21  | 
  22  | test.describe('Student Dashboard UI — Deep', () => {
  23  |   test.beforeEach(async ({ page }) => {
  24  |     await gotoWithAuth(page, '/student-dashboard', 'student');
  25  |     await dismissOverlays(page);
  26  |   });
  27  | 
  28  |   test('TC-MR-UI-001: Student dashboard loads', async ({ page }) => {
  29  |     const hasContent = await waitForContent(page);
  30  |     expect(hasContent).toBe(true);
  31  |   });
  32  | 
  33  |   test('TC-MR-UI-002: Student dashboard has widgets/cards', async ({ page }) => {
  34  |     // Dashboard renders tabs and collapsible sections — accept any content container
  35  |     const content = page.locator('[data-testid*="widget"], .widget, .card, .stat-card, [data-testid*="analytics"], [class*="collapsible"], .tabs, [role="tablist"]');
  36  |     const count = await content.count();
  37  |     expect(count).toBeGreaterThan(0);
  38  |   });
  39  | 
  40  |   test('TC-MR-UI-003: Student dashboard shows progress info', async ({ page }) => {
  41  |     // Dashboard has Performance tab and Overview analytics section
  42  |     const progress = page.getByText(/performance/i)
  43  |       .or(page.getByText(/overview/i))
  44  |       .or(page.locator('[data-testid*="student-overview-analytics"]'))
  45  |       .or(page.locator('[data-testid*="performance"]'))
  46  |       .or(page.getByText(/الأداء/i))
  47  |       .or(page.getByText(/نظرة عامة/i));
> 48  |     await expect(progress.first()).toBeVisible({ timeout: 10000 });
      |                                    ^ Error: expect(locator).toBeVisible() failed
  49  |   });
  50  | 
  51  |   test('TC-MR-UI-004: Student dashboard shows attendance info', async ({ page }) => {
  52  |     // Dashboard has Attendance Analytics collapsible section with testId
  53  |     const attendance = page.locator('[data-testid="attendance-analytics-section"]')
  54  |       .or(page.getByText(/attendance.*analytics/i))
  55  |       .or(page.getByText(/تحليلات.*الحضور/i))
  56  |       .or(page.getByText(/attendance/i));
  57  |     await expect(attendance.first()).toBeVisible({ timeout: 10000 });
  58  |   });
  59  | 
  60  |   test('TC-MR-UI-005: Admin access to student dashboard', async ({ page }) => {
  61  |     await gotoWithAuth(page, '/student-dashboard', 'superAdmin');
  62  |     // Admin may see access denied or the dashboard with selection prompt — both are valid
  63  |     const denied = await isAccessDenied(page);
  64  |     if (denied) {
  65  |       expect(true).toBe(true); // Admin denied is acceptable
  66  |       return;
  67  |     }
  68  |     const hasContent = await waitForContent(page);
  69  |     expect(hasContent).toBe(true);
  70  |   });
  71  | 
  72  |   test('TC-MR-UI-006: Student dashboard redirect to login', async ({ page }) => {
  73  |     await page.goto(`${testConfig.baseUrl}/student-dashboard`);
  74  |     // SPA may show login page or redirect to Keycloak — wait for either
  75  |     await page.waitForTimeout(3000);
  76  |     const url = page.url();
  77  |     // After Keycloak init, unauthenticated users get redirected to Keycloak login
  78  |     // or the SPA shows its own login/loading state
  79  |     expect(
  80  |       url.includes('keycloak') ||
  81  |       url.includes('login') ||
  82  |       url.includes('8080') ||
  83  |       url.includes('student-dashboard') // SPA may stay and show login prompt
  84  |     ).toBe(true);
  85  |   });
  86  | });
  87  | 
  88  | test.describe('Instructor & Classroom Availability — Deep', () => {
  89  |   test('TC-MR-UI-007: Instructor availability page loads', async ({ page }) => {
  90  |     await gotoWithAuth(page, '/instructor-availability', 'superAdmin');
  91  |     const hasContent = await waitForContent(page);
  92  |     expect(hasContent).toBe(true);
  93  |   });
  94  | 
  95  |   test('TC-MR-UI-008: Instructor availability has calendar or schedule', async ({ page }) => {
  96  |     await gotoWithAuth(page, '/instructor-availability', 'superAdmin');
  97  |     await dismissOverlays(page);
  98  |     // Page has AdvancedDataGrid which renders a table-like structure
  99  |     const calendar = page.locator('[data-testid*="calendar"], .calendar, table, [role="grid"], .schedule, .data-grid, [class*="grid"], form').first();
  100 |     await expect(calendar).toBeVisible({ timeout: 10000 });
  101 |   });
  102 | 
  103 |   test('TC-MR-UI-009: Instructor availability has instructor selector', async ({ page }) => {
  104 |     await gotoWithAuth(page, '/instructor-availability', 'superAdmin');
  105 |     await dismissOverlays(page);
  106 |     // Page has UserSelect for instructor and Select elements for program/subject/class
  107 |     // UserSelect may render as a custom combobox, not a native <select>
  108 |     const selector = page.locator('select, [role="combobox"], [role="listbox"], [class*="select"], [class*="UserSelect"], [data-testid*="instructor"], [data-testid*="teacher"], input[placeholder*="Instructor"], input[placeholder*="instructor"]').first();
  109 |     await expect(selector).toBeVisible({ timeout: 10000 });
  110 |   });
  111 | 
  112 |   test('TC-MR-UI-010: Classroom availability page loads', async ({ page }) => {
  113 |     await gotoWithAuth(page, '/classroom-availability', 'superAdmin');
  114 |     const hasContent = await waitForContent(page);
  115 |     expect(hasContent).toBe(true);
  116 |   });
  117 | 
  118 |   test('TC-MR-UI-011: Classroom availability has calendar or grid', async ({ page }) => {
  119 |     await gotoWithAuth(page, '/classroom-availability', 'superAdmin');
  120 |     await dismissOverlays(page);
  121 |     const calendar = page.locator('[data-testid*="calendar"], .calendar, table, [role="grid"], .schedule, .data-grid, [class*="grid"], form').first();
  122 |     await expect(calendar).toBeVisible({ timeout: 10000 });
  123 |   });
  124 | 
  125 |   test('TC-MR-UI-012: Classroom availability has room selector', async ({ page }) => {
  126 |     await gotoWithAuth(page, '/classroom-availability', 'superAdmin');
  127 |     await dismissOverlays(page);
  128 |     // Page has Select for classroom and filter Select for classroom filter
  129 |     const selector = page.locator('select, [role="combobox"], [role="listbox"], [class*="select"], [data-testid*="room"], [data-testid*="classroom"], input[placeholder*="classroom"], input[placeholder*="Classroom"]').first();
  130 |     await expect(selector).toBeVisible({ timeout: 10000 });
  131 |   });
  132 | });
  133 | 
  134 | test.describe('Unauthorized & QR Code — Deep', () => {
  135 |   test('TC-MR-UI-013: Unauthorized page loads with 403 message', async ({ page }) => {
  136 |     // Use student role — superAdmin gets redirected away from /unauthorized
  137 |     await gotoWithAuth(page, '/unauthorized', 'student');
  138 |     await page.waitForTimeout(2000);
  139 |     const text = page.locator('.unauthorized-title')
  140 |       .or(page.getByText(/403/i))
  141 |       .or(page.getByText(/unauthorized/i))
  142 |       .or(page.getByText(/access.*denied/i))
  143 |       .or(page.getByText(/no.*permission/i))
  144 |       .or(page.getByText(/غير.*مصرح/i))
  145 |       .or(page.getByText(/محظور/i));
  146 |     await expect(text.first()).toBeVisible({ timeout: 10000 });
  147 |   });
  148 | 
```