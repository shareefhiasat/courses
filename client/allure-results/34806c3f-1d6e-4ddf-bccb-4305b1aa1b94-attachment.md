# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: misc-pages-ui.spec.js >> Permission Matrix UI — Deep >> TC-MISC-UI-011: Permission matrix page loads
- Location: tests/e2e/specs/misc-pages-ui.spec.js:107:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  9   |  * - Permission Matrix: table + role columns + toggle permission
  10  |  * - User Category Access: table + content
  11  |  * - HR Attendance: table + export + filter
  12  |  * - Announcements page: list + create button
  13  |  * - Role-based: student QR access, instructor categories
  14  |  * - User story: admin creates category → verifies
  15  |  * - Unauthenticated redirects
  16  |  */
  17  | import { test, expect } from '@playwright/test';
  18  | import { testConfig } from '../config/test.config.js';
  19  | import { gotoWithAuth, waitForContent, isAccessDenied, dismissOverlays } from '../utils/ui-helpers.js';
  20  | import { openForm, closeForm, getRowCount } from '../utils/crud-helpers.js';
  21  | 
  22  | test.describe('QR Scanner UI — Deep', () => {
  23  |   test.beforeEach(async ({ page }) => {
  24  |     await gotoWithAuth(page, '/qr-scanner', 'superAdmin');
  25  |     await dismissOverlays(page);
  26  |   });
  27  | 
  28  |   test('TC-MISC-UI-001: QR scanner page loads', async ({ page }) => {
  29  |     const hasContent = await waitForContent(page);
  30  |     expect(hasContent).toBe(true);
  31  |   });
  32  | 
  33  |   test('TC-MISC-UI-002: QR scanner has camera view or scanner area', async ({ page }) => {
  34  |     const scanner = page.locator('[data-testid*="scanner"], .scanner, video, canvas, [data-testid*="qr"]').first();
  35  |     const visible = await scanner.isVisible({ timeout: 5000 }).catch(() => false);
  36  |     if (!visible) test.skip(true, 'No scanner area');
  37  |   });
  38  | 
  39  |   test('TC-MISC-UI-003: QR scanner has start/stop button', async ({ page }) => {
  40  |     const startBtn = page.locator('button:has-text("Start"), button:has-text("Scan"), button:has-text("Stop")').first();
  41  |     const visible = await startBtn.isVisible({ timeout: 3000 }).catch(() => false);
  42  |     if (!visible) test.skip(true, 'No start/stop button');
  43  |   });
  44  | 
  45  |   test('TC-MISC-UI-004: Student can access QR scanner', async ({ page }) => {
  46  |     await gotoWithAuth(page, '/qr-scanner', 'student');
  47  |     const denied = await isAccessDenied(page);
  48  |     if (denied) test.skip(true, 'Student denied');
  49  |     const hasContent = await waitForContent(page);
  50  |     expect(hasContent).toBe(true);
  51  |   });
  52  | 
  53  |   test('TC-MISC-UI-005: QR scanner redirect to login', async ({ page }) => {
  54  |     await page.goto(`${testConfig.baseUrl}/qr-scanner`);
  55  |     await page.waitForLoadState('networkidle');
  56  |     const url = page.url();
  57  |     expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  58  |   });
  59  | });
  60  | 
  61  | test.describe('Categories UI — Deep', () => {
  62  |   test.beforeEach(async ({ page }) => {
  63  |     await gotoWithAuth(page, '/categories', 'superAdmin');
  64  |     await dismissOverlays(page);
  65  |   });
  66  | 
  67  |   test('TC-MISC-UI-006: Categories page loads', async ({ page }) => {
  68  |     const hasContent = await waitForContent(page);
  69  |     expect(hasContent).toBe(true);
  70  |   });
  71  | 
  72  |   test('TC-MISC-UI-007: Categories list or table renders', async ({ page }) => {
  73  |     const list = page.locator('table, [data-testid*="category"], .card, .list').first();
  74  |     const visible = await list.isVisible({ timeout: 5000 }).catch(() => false);
  75  |     if (!visible) test.skip(true, 'No categories list');
  76  |   });
  77  | 
  78  |   test('TC-MISC-UI-008: Create category button', async ({ page }) => {
  79  |     const btn = page.locator('button:has-text("Add"), button:has-text("Create"), [data-testid*="create"]').first();
  80  |     const visible = await btn.isVisible({ timeout: 3000 }).catch(() => false);
  81  |     if (!visible) test.skip(true, 'No create button');
  82  |   });
  83  | 
  84  |   test('TC-MISC-UI-009: Create category form opens', async ({ page }) => {
  85  |     const opened = await openForm(page, ['Add Category', 'Create Category', 'Add', 'Create']);
  86  |     if (!opened) test.skip(true, 'Create form did not open');
  87  |     const form = page.locator('form, [role="dialog"], .modal').first();
  88  |     const formVisible = await form.isVisible({ timeout: 3000 }).catch(() => false);
  89  |     expect(formVisible).toBe(true);
  90  |     await closeForm(page);
  91  |   });
  92  | 
  93  |   test('TC-MISC-UI-010: Categories — row count or empty state', async ({ page }) => {
  94  |     const count = await getRowCount(page);
  95  |     const emptyState = page.locator('text=/no.*categor/i, text=/empty/i').first();
  96  |     const hasEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
  97  |     expect(count > 0 || hasEmpty).toBe(true);
  98  |   });
  99  | });
  100 | 
  101 | test.describe('Permission Matrix UI — Deep', () => {
  102 |   test.beforeEach(async ({ page }) => {
  103 |     await gotoWithAuth(page, '/permission-matrix', 'superAdmin');
  104 |     await dismissOverlays(page);
  105 |   });
  106 | 
  107 |   test('TC-MISC-UI-011: Permission matrix page loads', async ({ page }) => {
  108 |     const hasContent = await waitForContent(page);
> 109 |     expect(hasContent).toBe(true);
      |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  110 |   });
  111 | 
  112 |   test('TC-MISC-UI-012: Permission matrix table renders', async ({ page }) => {
  113 |     const table = page.locator('table, [role="grid"], [data-testid*="permission"]').first();
  114 |     const visible = await table.isVisible({ timeout: 5000 }).catch(() => false);
  115 |     if (!visible) test.skip(true, 'No permission table');
  116 |   });
  117 | 
  118 |   test('TC-MISC-UI-013: Permission matrix has role columns', async ({ page }) => {
  119 |     const roleHeader = page.locator('th:has-text("Admin"), th:has-text("Instructor"), th:has-text("Student"), th:has-text("Super")').first();
  120 |     const visible = await roleHeader.isVisible({ timeout: 3000 }).catch(() => false);
  121 |     if (!visible) test.skip(true, 'No role columns');
  122 |   });
  123 | 
  124 |   test('TC-MISC-UI-014: Permission matrix has permission rows', async ({ page }) => {
  125 |     const rows = page.locator('table tbody tr, [data-testid*="permission-row"]');
  126 |     const count = await rows.count();
  127 |     if (count === 0) test.skip(true, 'No permission rows');
  128 |     expect(count).toBeGreaterThan(0);
  129 |   });
  130 | });
  131 | 
  132 | test.describe('User Category Access UI — Deep', () => {
  133 |   test('TC-MISC-UI-015: User category access page loads', async ({ page }) => {
  134 |     await gotoWithAuth(page, '/user-category-access', 'superAdmin');
  135 |     const hasContent = await waitForContent(page);
  136 |     expect(hasContent).toBe(true);
  137 |   });
  138 | 
  139 |   test('TC-MISC-UI-016: User category access table renders', async ({ page }) => {
  140 |     await gotoWithAuth(page, '/user-category-access', 'superAdmin');
  141 |     await dismissOverlays(page);
  142 |     const table = page.locator('table, [role="grid"], [data-testid*="access"]').first();
  143 |     const visible = await table.isVisible({ timeout: 5000 }).catch(() => false);
  144 |     if (!visible) test.skip(true, 'No access table');
  145 |   });
  146 | });
  147 | 
  148 | test.describe('HR Attendance UI — Deep', () => {
  149 |   test.beforeEach(async ({ page }) => {
  150 |     await gotoWithAuth(page, '/hr-attendance', 'superAdmin');
  151 |     await dismissOverlays(page);
  152 |   });
  153 | 
  154 |   test('TC-MISC-UI-017: HR attendance page loads', async ({ page }) => {
  155 |     const hasContent = await waitForContent(page);
  156 |     expect(hasContent).toBe(true);
  157 |   });
  158 | 
  159 |   test('TC-MISC-UI-018: HR attendance table renders', async ({ page }) => {
  160 |     const table = page.locator('table, [role="grid"], [data-testid*="attendance"]').first();
  161 |     const visible = await table.isVisible({ timeout: 5000 }).catch(() => false);
  162 |     if (!visible) test.skip(true, 'No HR attendance table');
  163 |   });
  164 | 
  165 |   test('TC-MISC-UI-019: HR attendance export button', async ({ page }) => {
  166 |     const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid*="export"]').first();
  167 |     const visible = await exportBtn.isVisible({ timeout: 3000 }).catch(() => false);
  168 |     if (!visible) test.skip(true, 'No export button');
  169 |   });
  170 | 
  171 |   test('TC-MISC-UI-020: HR attendance filter visible', async ({ page }) => {
  172 |     const filter = page.locator('select, [data-testid*="filter"], input[type="date"]').first();
  173 |     const visible = await filter.isVisible({ timeout: 3000 }).catch(() => false);
  174 |     if (!visible) test.skip(true, 'No filter');
  175 |   });
  176 | });
  177 | 
  178 | test.describe('Announcements Page UI — Deep', () => {
  179 |   test.beforeEach(async ({ page }) => {
  180 |     await gotoWithAuth(page, '/dashboard#announcements', 'superAdmin');
  181 |     await dismissOverlays(page);
  182 |   });
  183 | 
  184 |   test('TC-MISC-UI-021: Announcements page loads', async ({ page }) => {
  185 |     const hasContent = await waitForContent(page);
  186 |     expect(hasContent).toBe(true);
  187 |   });
  188 | 
  189 |   test('TC-MISC-UI-022: Announcements list renders', async ({ page }) => {
  190 |     const list = page.locator('table, [data-testid*="announcement"], .card, .list').first();
  191 |     const visible = await list.isVisible({ timeout: 5000 }).catch(() => false);
  192 |     if (!visible) test.skip(true, 'No announcements list');
  193 |   });
  194 | 
  195 |   test('TC-MISC-UI-023: Create announcement button', async ({ page }) => {
  196 |     const btn = page.locator('button:has-text("Add"), button:has-text("Create"), [data-testid*="create"]').first();
  197 |     const visible = await btn.isVisible({ timeout: 3000 }).catch(() => false);
  198 |     if (!visible) test.skip(true, 'No create button');
  199 |   });
  200 | });
  201 | 
  202 | test.describe('Misc Pages UI — Role-Based Access (Deep)', () => {
  203 |   test('TC-MISC-UI-024: Instructor can access categories', async ({ page }) => {
  204 |     await gotoWithAuth(page, '/categories', 'instructor');
  205 |     const denied = await isAccessDenied(page);
  206 |     if (denied) test.skip(true, 'Instructor denied');
  207 |     const hasContent = await waitForContent(page);
  208 |     expect(hasContent).toBe(true);
  209 |   });
```