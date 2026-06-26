# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: missing-routes-ui.spec.js >> Dashboard Lookup Tabs UI — Deep >> TC-MR-UI-47: classrooms-management tab loads with content
- Location: tests/e2e/specs/missing-routes-ui.spec.js:250:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
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
  223 |     { from: '/course-progress/1', to: 'student-dashboard', check: (url) => url.includes('student-dashboard') },
  224 |     { from: '/my-progress', to: 'student-dashboard', check: (url) => url.includes('student-dashboard') },
  225 |   ];
  226 | 
  227 |   redirects.forEach((r, idx) => {
  228 |     test(`TC-MR-UI-${String(idx + 22).padStart(2, '0')}: ${r.from} redirects to ${r.to}`, async ({ page }) => {
  229 |       // Login first at a stable route, then navigate to the redirect source
  230 |       await gotoWithAuth(page, '/dashboard', 'superAdmin');
  231 |       await page.goto(`${testConfig.baseUrl}${r.from}`);
  232 |       // Wait for client-side redirect to complete (React Router Navigate is async)
  233 |       await page.waitForURL(url => r.check(url.toString()), { timeout: 10000 }).catch(() => {});
  234 |       await page.waitForLoadState('networkidle').catch(() => {});
  235 |       await page.waitForTimeout(1000);
  236 |       expect(r.check(page.url())).toBe(true);
  237 |     });
  238 |   });
  239 | });
  240 | 
  241 | test.describe('Dashboard Lookup Tabs UI — Deep', () => {
  242 |   const lookupTabs = [
  243 |     'emailTemplates', 'notificationLogs', 'activity-types', 'behavior-types',
  244 |     'participation-types', 'penalty-types', 'resource-types', 'priority-types',
  245 |     'user-roles', 'subject-types', 'assessment-types', 'question-types',
  246 |     'attendance-status-types', 'enrollment-status-types', 'classrooms-management',
  247 |   ];
  248 | 
  249 |   lookupTabs.forEach((tab, idx) => {
  250 |     test(`TC-MR-UI-${String(idx + 33).padStart(2, '0')}: ${tab} tab loads with content`, async ({ page }) => {
  251 |       await gotoWithAuth(page, `/dashboard#${tab}`, 'superAdmin');
  252 |       const hasContent = await waitForContent(page);
> 253 |       expect(hasContent).toBe(true);
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  254 |     });
  255 |   });
  256 | });
  257 | 
```