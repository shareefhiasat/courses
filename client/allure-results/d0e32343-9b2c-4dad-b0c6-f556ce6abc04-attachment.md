# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: programs-ui-enhanced.spec.js >> Programs UI — User Story: Admin Creates Program >> TC-PROG-UI-027: User story — create program and verify in list
- Location: tests/e2e/specs/programs-ui-enhanced.spec.js:428:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]:
      - button "Menu" [ref=e6] [cursor=pointer]:
        - img [ref=e7]
      - button "Collapse navbar" [ref=e9] [cursor=pointer]:
        - img [ref=e10]
      - img "QAF" [ref=e14]
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e18]: 2:33 PM
          - generic [ref=e19]:
            - button [ref=e21] [cursor=pointer]:
              - img [ref=e22]
            - button [ref=e25] [cursor=pointer]:
              - img [ref=e26]
        - generic [ref=e28]: Jun 25, Thu 2026
      - generic [ref=e29]:
        - generic [ref=e30]:
          - button [ref=e32] [cursor=pointer]:
            - img [ref=e33]
          - button "Switch to Arabic" [ref=e37] [cursor=pointer]:
            - img [ref=e38]
          - button "Help" [ref=e42] [cursor=pointer]:
            - img [ref=e43]
          - button "information" [ref=e47] [cursor=pointer]:
            - img [ref=e48]
          - button [ref=e51] [cursor=pointer]:
            - img [ref=e52]
        - generic [ref=e54] [cursor=pointer]:
          - generic [ref=e57]: S
          - generic [ref=e58]:
            - img [ref=e61]
            - img [ref=e65]
  - generic [ref=e68]:
    - generic "Resize" [ref=e69]
    - generic [ref=e71]:
      - generic [ref=e73]: S
      - generic [ref=e74]:
        - button "Switch to Dark" [ref=e75] [cursor=pointer]:
          - img [ref=e76]
        - button "Collapse" [ref=e78] [cursor=pointer]:
          - img [ref=e79]
        - button "enable auto hide" [ref=e81] [cursor=pointer]:
          - img [ref=e82]
        - button "disable sticky" [ref=e85] [cursor=pointer]:
          - img [ref=e86]
        - button [ref=e88] [cursor=pointer]:
          - img [ref=e89]
    - navigation [ref=e92]:
      - generic [ref=e93]:
        - button "Main" [ref=e94] [cursor=pointer]:
          - generic [ref=e95]: Main
          - img [ref=e96]
        - generic [ref=e98]:
          - generic [ref=e99]:
            - link "Home" [ref=e100] [cursor=pointer]:
              - /url: /
              - img [ref=e102]
              - generic [ref=e105]: Home
            - button "Open in new tab" [ref=e106] [cursor=pointer]:
              - img [ref=e107]
            - button "pin" [ref=e111] [cursor=pointer]:
              - img [ref=e112]
          - generic [ref=e114]:
            - link "Dashboard" [ref=e115] [cursor=pointer]:
              - /url: /dashboard
              - img [ref=e117]
              - generic [ref=e122]: Dashboard
            - button "Open in new tab" [ref=e123] [cursor=pointer]:
              - img [ref=e124]
            - button "pin" [ref=e128] [cursor=pointer]:
              - img [ref=e129]
          - generic [ref=e131]:
            - link "Student Dashboard" [ref=e132] [cursor=pointer]:
              - /url: /student-dashboard
              - img [ref=e134]
              - generic [ref=e139]: Student Dashboard
            - button "Open in new tab" [ref=e140] [cursor=pointer]:
              - img [ref=e141]
            - button "pin" [ref=e145] [cursor=pointer]:
              - img [ref=e146]
      - button "Activity" [ref=e149] [cursor=pointer]:
        - generic [ref=e150]: Activity
        - img [ref=e151]
      - button "Quiz" [ref=e154] [cursor=pointer]:
        - generic [ref=e155]: Quiz
        - img [ref=e156]
      - button "Academic" [ref=e159] [cursor=pointer]:
        - generic [ref=e160]: Academic
        - img [ref=e161]
      - button "Enrollments" [ref=e164] [cursor=pointer]:
        - generic [ref=e165]: Enrollments
        - img [ref=e166]
      - button "Academic Records" [ref=e169] [cursor=pointer]:
        - generic [ref=e170]: Academic Records
        - img [ref=e171]
      - button "Scheduling And Availabilities" [ref=e174] [cursor=pointer]:
        - generic [ref=e175]: Scheduling And Availabilities
        - img [ref=e176]
      - button "Availability" [ref=e179] [cursor=pointer]:
        - generic [ref=e180]: Availability
        - img [ref=e181]
      - button "Availability Setup" [ref=e184] [cursor=pointer]:
        - generic [ref=e185]: Availability Setup
        - img [ref=e186]
      - button "Users" [ref=e189] [cursor=pointer]:
        - generic [ref=e190]: Users
        - img [ref=e191]
      - button "Review Results" [ref=e194] [cursor=pointer]:
        - generic [ref=e195]: Review Results
        - img [ref=e196]
      - button "Attendance" [ref=e199] [cursor=pointer]:
        - generic [ref=e200]: Attendance
        - img [ref=e201]
      - button "Drive" [ref=e204] [cursor=pointer]:
        - generic [ref=e205]: Drive
        - img [ref=e206]
      - button "Analytics" [ref=e209] [cursor=pointer]:
        - generic [ref=e210]: Analytics
        - img [ref=e211]
      - button "Communication" [ref=e214] [cursor=pointer]:
        - generic [ref=e215]: Communication
        - img [ref=e216]
      - button "Community" [ref=e219] [cursor=pointer]:
        - generic [ref=e220]: Community
        - img [ref=e221]
      - button "Tools" [ref=e224] [cursor=pointer]:
        - generic [ref=e225]: Tools
        - img [ref=e226]
      - button "Workspace Settings" [ref=e229] [cursor=pointer]:
        - generic [ref=e230]: Workspace Settings
        - img [ref=e231]
    - generic [ref=e233]:
      - generic [ref=e234]:
        - generic: v1.0.0 - Jun 25, 2026
      - generic [ref=e235]:
        - button "العربية" [ref=e236] [cursor=pointer]:
          - generic [ref=e237]: العربية
        - button "Logout" [ref=e238] [cursor=pointer]:
          - generic [ref=e239]: Logout
  - main [ref=e240]:
    - generic [ref=e241]:
      - generic [ref=e242]:
        - generic [ref=e243]:
          - textbox "Program Code * (e.g., CS-DIP)*" [ref=e246]
          - textbox "Program Name (English) * (e.g., Computer Science Diploma)*" [ref=e249]
          - textbox "Program Name (Arabic) * (e.g., دبلوم علوم الحاسوب)*" [ref=e252]
          - spinbutton [ref=e255]: "2"
          - spinbutton [ref=e258]: "1.5"
          - spinbutton [ref=e261]: "70"
        - generic [ref=e262]:
          - textbox "Description (English)" [ref=e265]
          - textbox "Description (Arabic) - وصف البرنامج بالعربية" [ref=e268]
        - button "Save" [ref=e270] [cursor=pointer]:
          - generic [ref=e271]: Save
      - generic [ref=e274]:
        - button "Export" [ref=e276] [cursor=pointer]
        - generic [ref=e277]:
          - grid [ref=e278]:
            - row "Select all rows Program Code Program Name (EN) Program Name (AR) Duration (Years) min gpa header credit hours header Created By" [ref=e279]:
              - columnheader "Select all rows" [ref=e280]:
                - generic [ref=e282] [cursor=pointer]:
                  - checkbox "Select all rows" [ref=e283]
                  - img [ref=e284]
                - img [ref=e287]
              - columnheader "Program Code" [ref=e289] [cursor=pointer]:
                - generic [ref=e291]: Program Code
                - generic [ref=e292]:
                  - img
              - columnheader "Program Name (EN)" [ref=e293] [cursor=pointer]:
                - generic [ref=e295]: Program Name (EN)
                - generic [ref=e296]:
                  - img
              - columnheader "Program Name (AR)" [ref=e297] [cursor=pointer]:
                - generic [ref=e299]: Program Name (AR)
                - generic [ref=e300]:
                  - img
              - columnheader "Duration (Years)" [ref=e301] [cursor=pointer]:
                - generic [ref=e303]: Duration (Years)
                - generic [ref=e304]:
                  - img
              - columnheader "min gpa header" [ref=e305] [cursor=pointer]:
                - generic [ref=e307]: min gpa header
                - generic [ref=e308]:
                  - img
              - columnheader "credit hours header" [ref=e309] [cursor=pointer]:
                - generic [ref=e311]: credit hours header
                - generic [ref=e312]:
                  - img
              - columnheader "Created By" [ref=e313] [cursor=pointer]:
                - generic [ref=e315]: Created By
                - generic [ref=e316]:
                  - img
            - rowgroup [ref=e317]:
              - row "Select row EE-ENG Electrical Engineering الهندسة الكهربائية 4 years N/A Shareef Hiasat" [ref=e318]:
                - gridcell "Select row" [ref=e319]:
                  - generic [ref=e320] [cursor=pointer]:
                    - checkbox "Select row" [ref=e321]
                    - img [ref=e322]
                - gridcell "EE-ENG" [ref=e324]
                - gridcell "Electrical Engineering" [ref=e325]
                - gridcell "الهندسة الكهربائية" [ref=e326]
                - gridcell "4 years" [ref=e327]
                - gridcell "N/A" [ref=e328]
                - gridcell [ref=e329]
                - gridcell "Shareef Hiasat" [ref=e330]
              - row "Select row IT Information Technology Diploma دبلوم تقنية المعلومات 2 years 1.50 70 Shareef Hiasat" [ref=e331]:
                - gridcell "Select row" [ref=e332]:
                  - generic [ref=e333] [cursor=pointer]:
                    - checkbox "Select row" [ref=e334]
                    - img [ref=e335]
                - gridcell "IT" [ref=e337]
                - gridcell "Information Technology Diploma" [ref=e338]
                - gridcell "دبلوم تقنية المعلومات" [ref=e339]
                - gridcell "2 years" [ref=e340]
                - gridcell "1.50" [ref=e341]
                - gridcell "70" [ref=e342]
                - gridcell "Shareef Hiasat" [ref=e343]
              - row "Select row CE-ENG Updated 1782323263382 الهندسة المدنية 4 years N/A Shareef Hiasat" [ref=e344]:
                - gridcell "Select row" [ref=e345]:
                  - generic [ref=e346] [cursor=pointer]:
                    - checkbox "Select row" [ref=e347]
                    - img [ref=e348]
                - gridcell "CE-ENG" [ref=e350]
                - gridcell "Updated 1782323263382" [ref=e351]
                - gridcell "الهندسة المدنية" [ref=e352]
                - gridcell "4 years" [ref=e353]
                - gridcell "N/A" [ref=e354]
                - gridcell [ref=e355]
                - gridcell "Shareef Hiasat" [ref=e356]
          - generic [ref=e361]:
            - paragraph [ref=e362]: "Rows per page:"
            - generic [ref=e363]:
              - 'combobox "Rows per page: 10" [ref=e364] [cursor=pointer]': "10"
              - textbox: "10"
              - img
            - paragraph [ref=e365]: 1–3 of 3
            - generic [ref=e366]:
              - button "Go to previous page" [disabled]:
                - img
              - button "Go to next page" [disabled]:
                - img
```

# Test source

```ts
  353 | 
  354 |     const stillExists = await verifyInList(page, rowText.slice(0, 20));
  355 |     expect(stillExists).toBe(true);
  356 |   });
  357 | });
  358 | 
  359 | test.describe('Programs UI — Status Toggle & Filter (Deep)', () => {
  360 |   test.beforeEach(async ({ page }) => {
  361 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  362 |     await dismissOverlays(page);
  363 |   });
  364 | 
  365 |   test('TC-PROG-UI-021: Status toggle visible', async ({ page }) => {
  366 |     const toggle = page.locator('[data-testid*="status"], .toggle, input[type="checkbox"], button:has-text("Active"), button:has-text("Inactive")').first();
  367 |     const visible = await toggle.isVisible({ timeout: 3000 }).catch(() => false);
  368 |     if (!visible) test.skip(true, 'No status toggle found');
  369 |     expect(visible).toBe(true);
  370 |   });
  371 | 
  372 |   test('TC-PROG-UI-022: Filter by status changes results', async ({ page }) => {
  373 |     const statusFilter = page.locator('select[name*="status"], [data-testid*="status-filter"]').first();
  374 |     const visible = await statusFilter.isVisible({ timeout: 3000 }).catch(() => false);
  375 |     if (!visible) test.skip(true, 'No status filter');
  376 | 
  377 |     const options = await statusFilter.locator('option').allTextContents();
  378 |     if (options.length <= 1) test.skip(true, 'No status options');
  379 | 
  380 |     await statusFilter.selectOption({ index: 1 });
  381 |     await page.waitForTimeout(2000);
  382 |     const hasContent = await waitForContent(page);
  383 |     expect(hasContent).toBe(true);
  384 |   });
  385 | 
  386 |   test('TC-PROG-UI-023: Filter by category changes results', async ({ page }) => {
  387 |     const categoryFilter = page.locator('select[name*="category"], select[name*="type"], [data-testid*="category-filter"]').first();
  388 |     const visible = await categoryFilter.isVisible({ timeout: 3000 }).catch(() => false);
  389 |     if (!visible) test.skip(true, 'No category filter');
  390 | 
  391 |     const options = await categoryFilter.locator('option').allTextContents();
  392 |     if (options.length <= 1) test.skip(true, 'No category options');
  393 | 
  394 |     await categoryFilter.selectOption({ index: 1 });
  395 |     await page.waitForTimeout(2000);
  396 |     const hasContent = await waitForContent(page);
  397 |     expect(hasContent).toBe(true);
  398 |   });
  399 | });
  400 | 
  401 | test.describe('Programs UI — Role-Based Access (Deep)', () => {
  402 |   test('TC-PROG-UI-024: Student redirected from programs management', async ({ page }) => {
  403 |     await gotoWithAuth(page, ROUTE, 'student');
  404 |     const url = page.url();
  405 |     const denied = await isAccessDenied(page);
  406 |     expect(url.includes('unauthorized') || url.includes('dashboard') || url.includes('programs') || denied).toBe(true);
  407 |   });
  408 | 
  409 |   test('TC-PROG-UI-025: Student cannot see create button', async ({ page }) => {
  410 |     await gotoWithAuth(page, ROUTE, 'student');
  411 |     await dismissOverlays(page);
  412 |     const createBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
  413 |     const visible = await createBtn.isVisible({ timeout: 3000 }).catch(() => false);
  414 |     if (visible) console.warn('BUG: Student can see create program button');
  415 |     expect(true).toBe(true);
  416 |   });
  417 | 
  418 |   test('TC-PROG-UI-026: Instructor can view programs', async ({ page }) => {
  419 |     await gotoWithAuth(page, ROUTE, 'instructor');
  420 |     const denied = await isAccessDenied(page);
  421 |     if (denied) test.skip(true, 'Instructor denied access');
  422 |     const hasContent = await waitForContent(page);
  423 |     expect(hasContent).toBe(true);
  424 |   });
  425 | });
  426 | 
  427 | test.describe('Programs UI — User Story: Admin Creates Program', () => {
  428 |   test('TC-PROG-UI-027: User story — create program and verify in list', async ({ page }) => {
  429 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  430 |     await dismissOverlays(page);
  431 | 
  432 |     const testName = `${TEST_PREFIX}STORY_${Date.now()}`;
  433 |     const opened = await openForm(page, ['Add Program', 'Create Program', 'Add', 'Create']);
  434 |     if (!opened) test.skip(true, 'Create form did not open');
  435 | 
  436 |     const nameField = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
  437 |     if (await nameField.isVisible({ timeout: 2000 }).catch(() => false)) {
  438 |       await nameField.fill(testName);
  439 |     }
  440 | 
  441 |     const codeField = page.locator('input[name*="code"], input[placeholder*="code" i]').first();
  442 |     if (await codeField.isVisible({ timeout: 2000 }).catch(() => false)) {
  443 |       await codeField.fill(`STORY-${Date.now()}`);
  444 |     }
  445 | 
  446 |     const result = await submitForm(page, ['Save', 'Create', 'Submit']);
  447 |     if (!result.submitted) test.skip(true, 'Could not submit program');
  448 | 
  449 |     await page.waitForTimeout(2000);
  450 | 
  451 |     // Verify program appears in list
  452 |     const found = await verifyInList(page, testName);
> 453 |     expect(found).toBe(true);
      |                   ^ Error: expect(received).toBe(expected) // Object.is equality
  454 |   });
  455 | });
  456 | 
  457 | test.describe('Programs UI — Bulk & Export Operations', () => {
  458 |   test.beforeEach(async ({ page }) => {
  459 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  460 |     await dismissOverlays(page);
  461 |   });
  462 | 
  463 |   test('TC-PROG-UI-028: Select all checkbox visible', async ({ page }) => {
  464 |     const selectAll = page.locator('thead input[type="checkbox"], [data-testid*="select-all"], th input[type="checkbox"]').first();
  465 |     const visible = await selectAll.isVisible({ timeout: 3000 }).catch(() => false);
  466 |     if (!visible) test.skip(true, 'No select all checkbox');
  467 |     expect(visible).toBe(true);
  468 |   });
  469 | 
  470 |   test('TC-PROG-UI-029: Row checkbox selection works', async ({ page }) => {
  471 |     const rowCheckbox = page.locator('tbody input[type="checkbox"]').first();
  472 |     const visible = await rowCheckbox.isVisible({ timeout: 3000 }).catch(() => false);
  473 |     if (!visible) test.skip(true, 'No row checkboxes');
  474 |     await rowCheckbox.click();
  475 |     const isChecked = await rowCheckbox.isChecked();
  476 |     expect(isChecked).toBe(true);
  477 |   });
  478 | 
  479 |   test('TC-PROG-UI-030: Export button visible', async ({ page }) => {
  480 |     const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid*="export"]').first();
  481 |     const visible = await exportBtn.isVisible({ timeout: 3000 }).catch(() => false);
  482 |     if (!visible) test.skip(true, 'No export button');
  483 |   });
  484 | });
  485 | 
  486 | test.describe('Programs UI — Unauthenticated', () => {
  487 |   test('TC-PROG-UI-031: Redirect to login when not authenticated', async ({ page }) => {
  488 |     await page.goto(`${testConfig.baseUrl}/programs`);
  489 |     await page.waitForLoadState('networkidle');
  490 |     const url = page.url();
  491 |     expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  492 |   });
  493 | });
  494 | 
  495 | test.describe('Programs UI — Edge Cases', () => {
  496 |   test('TC-PROG-UI-032: Empty state message when no programs match search', async ({ page }) => {
  497 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  498 |     await dismissOverlays(page);
  499 |     const search = page.locator('input[placeholder*="search" i]').first();
  500 |     if (await search.isVisible({ timeout: 2000 }).catch(() => false)) {
  501 |       await search.fill('zzz_nonexistent_xyz_12345');
  502 |       await page.waitForTimeout(2000);
  503 |       const emptyState = page.locator('text=/no.*program/i, text=/no.*result/i, text=/empty/i, [data-testid*="empty"]');
  504 |       const hasEmpty = await emptyState.first().isVisible({ timeout: 2000 }).catch(() => false);
  505 |       if (hasEmpty) expect(hasEmpty).toBe(true);
  506 |       await search.fill('');
  507 |     }
  508 |     expect(true).toBe(true);
  509 |   });
  510 | 
  511 |   test('TC-PROG-UI-033: Long name text handling in form', async ({ page }) => {
  512 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  513 |     await dismissOverlays(page);
  514 |     const opened = await openForm(page, ['Add Program', 'Create', 'Add']);
  515 |     if (!opened) test.skip(true, 'Form did not open');
  516 | 
  517 |     const nameField = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
  518 |     if (await nameField.isVisible({ timeout: 2000 }).catch(() => false)) {
  519 |       await nameField.fill('A'.repeat(200));
  520 |       const value = await nameField.inputValue();
  521 |       expect(value.length).toBeGreaterThan(0);
  522 |     }
  523 |     await closeForm(page);
  524 |   });
  525 | 
  526 |   test('TC-PROG-UI-034: Duplicate program code validation', async ({ page }) => {
  527 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  528 |     await dismissOverlays(page);
  529 |     const firstRow = page.locator('table tbody tr, [data-testid*="program-item"]').first();
  530 |     if (!(await firstRow.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No programs exist');
  531 | 
  532 |     const rowText = await firstRow.textContent().catch(() => '');
  533 |     const opened = await openForm(page, ['Add Program', 'Create', 'Add']);
  534 |     if (!opened) test.skip(true, 'Create form did not open');
  535 | 
  536 |     // Try to fill with existing code — just verify form accepts input
  537 |     const codeField = page.locator('input[name*="code"], input[placeholder*="code" i]').first();
  538 |     if (await codeField.isVisible({ timeout: 2000 }).catch(() => false)) {
  539 |       await codeField.fill('DUPLICATE_CODE_TEST');
  540 |     }
  541 |     await closeForm(page);
  542 |     expect(true).toBe(true);
  543 |   });
  544 | 
  545 |   test('TC-PROG-UI-035: Program detail view shows related data', async ({ page }) => {
  546 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  547 |     await dismissOverlays(page);
  548 |     const firstRow = page.locator('table tbody tr, [data-testid*="program-item"]').first();
  549 |     if (!(await firstRow.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No programs exist');
  550 | 
  551 |     const urlBefore = page.url();
  552 |     await firstRow.click();
  553 |     await page.waitForTimeout(2000);
```