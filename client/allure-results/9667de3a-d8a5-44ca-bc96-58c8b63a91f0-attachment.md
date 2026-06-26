# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: missing-routes-ui.spec.js >> Instructor & Classroom Availability — Deep >> TC-MR-UI-011: Classroom availability has calendar or grid
- Location: tests/e2e/specs/missing-routes-ui.spec.js:118:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid*="calendar"], .calendar, table, [role="grid"], .schedule, .data-grid, [class*="grid"], form').first()
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-testid*="calendar"], .calendar, table, [role="grid"], .schedule, .data-grid, [class*="grid"], form').first()
    - waiting for" https://localhost:5174/classroom-availability" navigation to finish...

```

# Test source

```ts
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
  48  |     await expect(progress.first()).toBeVisible({ timeout: 10000 });
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
> 122 |     await expect(calendar).toBeVisible({ timeout: 10000 });
      |                            ^ Error: expect(locator).toBeVisible() failed
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
  149 |   test('TC-MR-UI-014: QR code page loads for student ID', async ({ page }) => {
  150 |     // Route requires auth — use gotoWithAuth with student role
  151 |     await gotoWithAuth(page, '/qrcode/test-student-id', 'student');
  152 |     // QRCodeDisplayPage writes directly to document.body via useEffect — wait for img to appear
  153 |     await page.waitForTimeout(3000);
  154 |     const qr = page.locator('img, canvas, svg, [data-testid*="qr"], .qr-code, [class*="qr"], [class*="card"]');
  155 |     await expect(qr.first()).toBeVisible({ timeout: 10000 });
  156 |   });
  157 | });
  158 | 
  159 | test.describe('Activity Detail & Quiz Pages — Deep', () => {
  160 |   test('TC-MR-UI-015: Activity detail page loads', async ({ page }) => {
  161 |     await gotoWithAuth(page, '/activity/1', 'superAdmin');
  162 |     const hasContent = await waitForContent(page);
  163 |     expect(hasContent).toBe(true);
  164 |   });
  165 | 
  166 |   test('TC-MR-UI-016: Activity detail shows activity info', async ({ page }) => {
  167 |     await gotoWithAuth(page, '/activity/1', 'superAdmin');
  168 |     await dismissOverlays(page);
  169 |     // Activity may not exist with ID 1 — accept any heading or content as valid
  170 |     const info = page.locator('[data-testid*="activity"], .activity-detail, h1, h2, .title, [class*="content"], main, .container').first();
  171 |     await expect(info).toBeVisible({ timeout: 10000 });
  172 |   });
  173 | 
  174 |   test('TC-MR-UI-017: Quiz taking page loads', async ({ page }) => {
  175 |     await gotoWithAuth(page, '/quiz/1', 'student');
  176 |     const hasContent = await waitForContent(page);
  177 |     expect(hasContent).toBe(true);
  178 |   });
  179 | 
  180 |   test('TC-MR-UI-018: Quiz page has questions or start button', async ({ page }) => {
  181 |     await gotoWithAuth(page, '/quiz/1', 'student');
  182 |     await dismissOverlays(page);
  183 |     // Quiz may not exist with ID 1 — accept any quiz-related content, error message, or page content
  184 |     const element = page.locator('button:has-text("Start"), button:has-text("ابدأ"), [data-testid*="question"], form, .quiz-container, [class*="quiz"], h1, h2, [class*="content"], main, .container')
  185 |       .or(page.getByText(/quiz/i))
  186 |       .or(page.getByText(/no.*quiz/i))
  187 |       .or(page.getByText(/not.*found/i));
  188 |     await expect(element.first()).toBeVisible({ timeout: 10000 });
  189 |   });
  190 | 
  191 |   test('TC-MR-UI-019: Quiz preview page loads', async ({ page }) => {
  192 |     await gotoWithAuth(page, '/quiz-preview/1', 'superAdmin');
  193 |     const hasContent = await waitForContent(page);
  194 |     expect(hasContent).toBe(true);
  195 |   });
  196 | });
  197 | 
  198 | test.describe('Workflow Document Detail — Deep', () => {
  199 |   test('TC-MR-UI-020: Workflow document detail loads', async ({ page }) => {
  200 |     await gotoWithAuth(page, '/workflow-documents/1', 'superAdmin');
  201 |     const hasContent = await waitForContent(page);
  202 |     expect(hasContent).toBe(true);
  203 |   });
  204 | 
  205 |   test('TC-MR-UI-021: Workflow detail (legacy route) loads', async ({ page }) => {
  206 |     await gotoWithAuth(page, '/workflow/1', 'superAdmin');
  207 |     const hasContent = await waitForContent(page);
  208 |     expect(hasContent).toBe(true);
  209 |   });
  210 | });
  211 | 
  212 | test.describe('Redirect Routes UI — Deep', () => {
  213 |   const redirects = [
  214 |     { from: '/home', to: '/', check: (url) => url.endsWith('/') || url.endsWith('/home') === false },
  215 |     { from: '/activities', to: 'mode=activities', check: (url) => url.includes('localhost:5174/') && !url.includes('/activities') },
  216 |     { from: '/resources', to: 'mode=resources', check: (url) => url.includes('localhost:5174/') && !url.includes('/resources') },
  217 |     { from: '/progress', to: 'student-dashboard', check: (url) => url.includes('student-dashboard') },
  218 |     { from: '/my-attendance', to: 'student-dashboard', check: (url) => url.includes('student-dashboard') },
  219 |     { from: '/my-enrollments', to: 'student-dashboard', check: (url) => url.includes('student-dashboard') },
  220 |     { from: '/quiz-management', to: 'quizzes', check: (url) => url.includes('quizzes') },
  221 |     { from: '/quiz-builder', to: 'quizzes', check: (url) => url.includes('quizzes') },
  222 |     { from: '/class-schedules', to: 'scheduling-calendar', check: (url) => url.includes('scheduling-calendar') },
```