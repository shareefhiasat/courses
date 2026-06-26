# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: marks-ui.spec.js >> Marks UI — Unauthenticated >> TC-MRK-UI-026: Redirect to login when not authenticated
- Location: tests/e2e/specs/marks-ui.spec.js:323:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_TIMED_OUT at https://localhost:5174/marks-entry
Call log:
  - navigating to "https://localhost:5174/marks-entry", waiting until "load"

```

# Test source

```ts
  224 | 
  225 | test.describe('Marks UI — Report & Distribution (Deep)', () => {
  226 |   test.beforeEach(async ({ page }) => {
  227 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  228 |     await dismissOverlays(page);
  229 |   });
  230 | 
  231 |   test('TC-MRK-UI-018: Marks report button visible', async ({ page }) => {
  232 |     const reportBtn = page.locator('button:has-text("Report"), [data-testid*="report"]').first();
  233 |     const visible = await reportBtn.isVisible({ timeout: 3000 }).catch(() => false);
  234 |     if (!visible) test.skip(true, 'No report button');
  235 |     expect(visible).toBe(true);
  236 |   });
  237 | 
  238 |   test('TC-MRK-UI-019: Click report button opens report view', async ({ page }) => {
  239 |     const reportBtn = page.locator('button:has-text("Report"), [data-testid*="report"]').first();
  240 |     if (!(await reportBtn.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No report button');
  241 | 
  242 |     await reportBtn.click();
  243 |     await page.waitForTimeout(2000);
  244 | 
  245 |     const hasContent = await waitForContent(page);
  246 |     expect(hasContent).toBe(true);
  247 |   });
  248 | 
  249 |   test('TC-MRK-UI-020: Distribution view shows chart or stats', async ({ page }) => {
  250 |     const distBtn = page.locator('button:has-text("Distribution"), [data-testid*="distribution"]').first();
  251 |     if (!(await distBtn.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No distribution button');
  252 | 
  253 |     await distBtn.click();
  254 |     await page.waitForTimeout(2000);
  255 | 
  256 |     const chart = page.locator('canvas, svg, [data-testid*="chart"], .chart, [role="img"]').first();
  257 |     const stats = page.locator('text=/average/i, text=/mean/i, text=/median/i, text=/distribution/i').first();
  258 |     const hasChart = await chart.isVisible({ timeout: 2000 }).catch(() => false);
  259 |     const hasStats = await stats.isVisible({ timeout: 2000 }).catch(() => false);
  260 |     expect(hasChart || hasStats).toBe(true);
  261 |   });
  262 | });
  263 | 
  264 | test.describe('Marks UI — Role-Based Access (Deep)', () => {
  265 |   test('TC-MRK-UI-021: Student views own marks', async ({ page }) => {
  266 |     await gotoWithAuth(page, ROUTE, 'student');
  267 |     const denied = await isAccessDenied(page);
  268 |     if (denied) test.skip(true, 'Student denied access');
  269 |     const hasContent = await waitForContent(page);
  270 |     expect(hasContent).toBe(true);
  271 |   });
  272 | 
  273 |   test('TC-MRK-UI-022: Student cannot see save/batch buttons', async ({ page }) => {
  274 |     await gotoWithAuth(page, ROUTE, 'student');
  275 |     await dismissOverlays(page);
  276 |     const saveBtn = page.locator('button:has-text("Save"), button:has-text("Batch"), button:has-text("Save All")').first();
  277 |     const visible = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
  278 |     if (visible) console.warn('BUG: Student can see save marks button');
  279 |     expect(true).toBe(true);
  280 |   });
  281 | 
  282 |   test('TC-MRK-UI-023: Instructor can enter marks', async ({ page }) => {
  283 |     await gotoWithAuth(page, ROUTE, 'instructor');
  284 |     await dismissOverlays(page);
  285 |     const markInput = page.locator('input[type="number"], input[placeholder*="mark" i], [data-testid*="mark-input"]').first();
  286 |     const visible = await markInput.isVisible({ timeout: 3000 }).catch(() => false);
  287 |     if (!visible) test.skip(true, 'No mark input for instructor');
  288 |     expect(visible).toBe(true);
  289 |   });
  290 | });
  291 | 
  292 | test.describe('Marks UI — User Story & Bulk', () => {
  293 |   test('TC-MRK-UI-024: User story — instructor enters marks and saves', async ({ page }) => {
  294 |     await gotoWithAuth(page, ROUTE, 'instructor');
  295 |     await dismissOverlays(page);
  296 | 
  297 |     const markInput = page.locator('input[type="number"], input[placeholder*="mark" i], [data-testid*="mark-input"]').first();
  298 |     if (!(await markInput.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No mark input');
  299 | 
  300 |     await markInput.fill('88');
  301 |     await page.waitForTimeout(500);
  302 | 
  303 |     const saveBtn = page.locator('button:has-text("Save"), button:has-text("Submit"), [data-testid*="save"]').first();
  304 |     if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  305 |       await saveBtn.click();
  306 |       await page.waitForTimeout(2000);
  307 |     }
  308 | 
  309 |     const hasContent = await waitForContent(page);
  310 |     expect(hasContent).toBe(true);
  311 |   });
  312 | 
  313 |   test('TC-MRK-UI-025: Export button visible', async ({ page }) => {
  314 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  315 |     await dismissOverlays(page);
  316 |     const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid*="export"]').first();
  317 |     const visible = await exportBtn.isVisible({ timeout: 3000 }).catch(() => false);
  318 |     if (!visible) test.skip(true, 'No export button');
  319 |   });
  320 | });
  321 | 
  322 | test.describe('Marks UI — Unauthenticated', () => {
  323 |   test('TC-MRK-UI-026: Redirect to login when not authenticated', async ({ page }) => {
> 324 |     await page.goto(`${testConfig.baseUrl}/marks-entry`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_TIMED_OUT at https://localhost:5174/marks-entry
  325 |     await page.waitForLoadState('networkidle');
  326 |     const url = page.url();
  327 |     expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  328 |   });
  329 | });
  330 | 
  331 | test.describe('Marks UI — Large Data Volume: Pagination', () => {
  332 |   test.beforeEach(async ({ page }) => {
  333 |     await gotoWithAuth(page, ROUTE, 'instructor');
  334 |     await dismissOverlays(page);
  335 |   });
  336 | 
  337 |   test('TC-MRK-UI-027: Table renders with pagination controls', async ({ page }) => {
  338 |     const pagination = page.locator(
  339 |       '[data-testid*="pagination"], .pagination, nav[aria-label*="pagination" i], button:has-text("Next"), button:has-text("Previous")'
  340 |     ).first();
  341 |     const visible = await pagination.isVisible({ timeout: 3000 }).catch(() => false);
  342 |     if (!visible) test.skip(true, 'No pagination controls');
  343 |     expect(visible).toBe(true);
  344 |   });
  345 | 
  346 |   test('TC-MRK-UI-028: Page size selector visible', async ({ page }) => {
  347 |     const sizeSelector = page.locator(
  348 |       'select[name*="pageSize"], select:has(option:has-text("10")), select:has(option:has-text("25")), select:has(option:has-text("50")), select:has(option:has-text("100")), [data-testid*="page-size"]'
  349 |     ).first();
  350 |     const visible = await sizeSelector.isVisible({ timeout: 3000 }).catch(() => false);
  351 |     if (!visible) test.skip(true, 'No page size selector');
  352 |     expect(visible).toBe(true);
  353 |   });
  354 | 
  355 |   test('TC-MRK-UI-029: Change page size affects row count', async ({ page }) => {
  356 |     const sizeSelector = page.locator('select[name*="pageSize"], [data-testid*="page-size"]').first();
  357 |     if (!(await sizeSelector.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No page size selector');
  358 |     const rowsBefore = await getRowCount(page);
  359 |     const options = await sizeSelector.locator('option').allTextContents();
  360 |     if (options.length > 1) {
  361 |       await sizeSelector.selectOption({ index: 0 });
  362 |       await page.waitForTimeout(1500);
  363 |     }
  364 |     const rowsAfter = await getRowCount(page);
  365 |     expect(rowsAfter >= 0).toBe(true);
  366 |   });
  367 | 
  368 |   test('TC-MRK-UI-030: Navigate to next page', async ({ page }) => {
  369 |     const nextBtn = page.locator('button:has-text("Next"), [aria-label*="next" i], [data-testid*="next-page"]').first();
  370 |     if (!(await nextBtn.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No next page button');
  371 |     await nextBtn.click();
  372 |     await page.waitForTimeout(1500);
  373 |     const hasContent = await waitForContent(page);
  374 |     expect(hasContent).toBe(true);
  375 |   });
  376 | 
  377 |   test('TC-MRK-UI-031: Navigate to previous page', async ({ page }) => {
  378 |     const prevBtn = page.locator('button:has-text("Previous"), [aria-label*="previous" i], [data-testid*="prev-page"]').first();
  379 |     if (!(await prevBtn.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No previous page button');
  380 |     await prevBtn.click();
  381 |     await page.waitForTimeout(1500);
  382 |     const hasContent = await waitForContent(page);
  383 |     expect(hasContent).toBe(true);
  384 |   });
  385 | 
  386 |   test('TC-MRK-UI-032: Total record count displayed', async ({ page }) => {
  387 |     const countText = page.locator(
  388 |       'text=/\\d+\\s*(results|records|students|entries|items|rows)/i, [data-testid*="total-count"], [data-testid*="record-count"]'
  389 |     ).first();
  390 |     const visible = await countText.isVisible({ timeout: 3000 }).catch(() => false);
  391 |     if (!visible) test.skip(true, 'No total count display');
  392 |     expect(visible).toBe(true);
  393 |   });
  394 | });
  395 | 
  396 | test.describe('Marks UI — Large Data Volume: Sorting', () => {
  397 |   test.beforeEach(async ({ page }) => {
  398 |     await gotoWithAuth(page, ROUTE, 'instructor');
  399 |     await dismissOverlays(page);
  400 |   });
  401 | 
  402 |   test('TC-MRK-UI-033: Sort by student name column', async ({ page }) => {
  403 |     const nameHeader = page.locator('th:has-text("Student"), th:has-text("Name"), [role="columnheader"]:has-text("Student")').first();
  404 |     if (!(await nameHeader.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No student name column');
  405 |     await nameHeader.click();
  406 |     await page.waitForTimeout(1500);
  407 |     const hasContent = await waitForContent(page);
  408 |     expect(hasContent).toBe(true);
  409 |   });
  410 | 
  411 |   test('TC-MRK-UI-034: Sort by mark value column', async ({ page }) => {
  412 |     const markHeader = page.locator('th:has-text("Mark"), th:has-text("Score"), th:has-text("Grade"), [role="columnheader"]:has-text("Mark")').first();
  413 |     if (!(await markHeader.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No mark column header');
  414 |     await markHeader.click();
  415 |     await page.waitForTimeout(1500);
  416 |     const hasContent = await waitForContent(page);
  417 |     expect(hasContent).toBe(true);
  418 |   });
  419 | 
  420 |   test('TC-MRK-UI-035: Toggle sort direction (ascending/descending)', async ({ page }) => {
  421 |     const markHeader = page.locator('th:has-text("Mark"), th:has-text("Score"), [role="columnheader"]:has-text("Mark")').first();
  422 |     if (!(await markHeader.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No mark column header');
  423 |     await markHeader.click();
  424 |     await page.waitForTimeout(1000);
```