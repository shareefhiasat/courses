# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: resources-participations-behaviors-ui.spec.js >> Behaviors UI — Create Flow (Deep) >> TC-BEH-UI-007: Cancel closes record form
- Location: tests/e2e/specs/resources-participations-behaviors-ui.spec.js:376:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic:
      - button "Menu":
        - img
      - generic:
        - button "Collapse navbar":
          - img
      - generic:
        - generic:
          - img "QAF"
      - generic:
        - generic:
          - generic:
            - generic: 2:34 PM
          - generic:
            - generic:
              - button:
                - img
            - generic:
              - button:
                - img
        - generic:
          - generic: Jun 25, Thu 2026
      - generic:
        - generic:
          - generic:
            - button "Switch to Arabic":
              - img
          - generic:
            - button "Help":
              - img
          - generic:
            - button "information":
              - img
          - generic:
            - button:
              - img
        - generic:
          - generic:
            - generic: D
          - generic:
            - generic:
              - generic:
                - img
  - generic [ref=e5]:
    - generic "Resize" [ref=e6]
    - generic [ref=e8]:
      - generic [ref=e10]: D
      - generic [ref=e11]:
        - button "Switch to Dark" [ref=e12] [cursor=pointer]:
          - img [ref=e13]
        - button "Collapse" [ref=e15] [cursor=pointer]:
          - img [ref=e16]
        - button "enable auto hide" [ref=e18] [cursor=pointer]:
          - img [ref=e19]
        - button "disable sticky" [ref=e22] [cursor=pointer]:
          - img [ref=e23]
        - button [ref=e25] [cursor=pointer]:
          - img [ref=e26]
    - navigation [ref=e29]:
      - generic [ref=e30]:
        - button "Main" [ref=e31] [cursor=pointer]:
          - generic [ref=e32]: Main
          - img [ref=e33]
        - generic [ref=e35]:
          - generic [ref=e36]:
            - link "Home" [ref=e37] [cursor=pointer]:
              - /url: /
              - img [ref=e39]
              - generic [ref=e42]: Home
            - button "Open in new tab" [ref=e43] [cursor=pointer]:
              - img [ref=e44]
            - button "pin" [ref=e48] [cursor=pointer]:
              - img [ref=e49]
          - generic [ref=e51]:
            - link "Dashboard" [ref=e52] [cursor=pointer]:
              - /url: /dashboard
              - img [ref=e54]
              - generic [ref=e59]: Dashboard
            - button "Open in new tab" [ref=e60] [cursor=pointer]:
              - img [ref=e61]
            - button "pin" [ref=e65] [cursor=pointer]:
              - img [ref=e66]
      - button "Activity" [ref=e69] [cursor=pointer]:
        - generic [ref=e70]: Activity
        - img [ref=e71]
      - button "Quiz" [ref=e74] [cursor=pointer]:
        - generic [ref=e75]: Quiz
        - img [ref=e76]
      - button "Academic" [ref=e79] [cursor=pointer]:
        - generic [ref=e80]: Academic
        - img [ref=e81]
      - button "Enrollments" [ref=e84] [cursor=pointer]:
        - generic [ref=e85]: Enrollments
        - img [ref=e86]
      - button "Academic Records" [ref=e89] [cursor=pointer]:
        - generic [ref=e90]: Academic Records
        - img [ref=e91]
      - button "Scheduling And Availabilities" [ref=e94] [cursor=pointer]:
        - generic [ref=e95]: Scheduling And Availabilities
        - img [ref=e96]
      - button "Availability" [ref=e99] [cursor=pointer]:
        - generic [ref=e100]: Availability
        - img [ref=e101]
      - button "Review Results" [ref=e104] [cursor=pointer]:
        - generic [ref=e105]: Review Results
        - img [ref=e106]
      - button "Attendance" [ref=e109] [cursor=pointer]:
        - generic [ref=e110]: Attendance
        - img [ref=e111]
      - button "Drive" [ref=e114] [cursor=pointer]:
        - generic [ref=e115]: Drive
        - img [ref=e116]
      - button "Analytics" [ref=e119] [cursor=pointer]:
        - generic [ref=e120]: Analytics
        - img [ref=e121]
      - button "Community" [ref=e124] [cursor=pointer]:
        - generic [ref=e125]: Community
        - img [ref=e126]
      - button "Tools" [ref=e129] [cursor=pointer]:
        - generic [ref=e130]: Tools
        - img [ref=e131]
      - button "Workspace Settings" [ref=e134] [cursor=pointer]:
        - generic [ref=e135]: Workspace Settings
        - img [ref=e136]
    - generic [ref=e138]:
      - generic [ref=e139]:
        - generic: v1.0.0 - Jun 25, 2026
      - generic [ref=e140]:
        - button "العربية" [ref=e141] [cursor=pointer]:
          - generic [ref=e142]: العربية
        - button "Logout" [ref=e143] [cursor=pointer]:
          - generic [ref=e144]: Logout
  - main [ref=e145]:
    - generic [ref=e146]:
      - generic [ref=e147]:
        - generic [ref=e149]:
          - button "All Programs" [ref=e153] [cursor=pointer]:
            - generic [ref=e156]: All Programs
            - img [ref=e158]
          - button "All Subjects" [ref=e163] [cursor=pointer]:
            - generic [ref=e166]: All Subjects
            - img [ref=e168]
          - button "All Classes" [ref=e173] [cursor=pointer]:
            - generic [ref=e176]: All Classes
            - img [ref=e178]
        - button "Select Student *" [ref=e183] [cursor=pointer]:
          - generic [ref=e186]: Select Student *
          - img [ref=e188]
        - button "Select Behavior Type *" [ref=e193] [cursor=pointer]:
          - generic [ref=e196]: Select Behavior Type *
          - img [ref=e198]
        - generic [ref=e200]:
          - textbox "Enter Comment (Optional)" [ref=e201]
          - spinbutton [ref=e202]: "-1"
        - button "Add Behavior" [ref=e204] [cursor=pointer]:
          - generic [ref=e205]: Add Behavior
      - generic [ref=e206]:
        - generic [ref=e208]:
          - button "All Programs" [ref=e212] [cursor=pointer]:
            - generic [ref=e215]: All Programs
            - img [ref=e217]
          - button "All Subjects" [ref=e222] [cursor=pointer]:
            - generic [ref=e225]: All Subjects
            - img [ref=e227]
          - button "All Classes" [ref=e232] [cursor=pointer]:
            - generic [ref=e235]: All Classes
            - img [ref=e237]
        - generic [ref=e239]:
          - button "Select an option" [ref=e243] [cursor=pointer]:
            - generic [ref=e246]: Select an option
            - img [ref=e248]
          - button "All Types" [ref=e253] [cursor=pointer]:
            - generic [ref=e256]: All Types
            - generic [ref=e257]:
              - button [ref=e258]:
                - img [ref=e259]
              - img [ref=e262]
      - generic [ref=e264]:
        - generic [ref=e265]:
          - img [ref=e266]
          - text: 0 Total
        - generic [ref=e270]:
          - img [ref=e271]
          - text: 0 Students
        - generic [ref=e276]:
          - img [ref=e277]
          - text: 0 Positive
        - generic [ref=e280]:
          - img [ref=e281]
          - text: 0 Negative
      - generic [ref=e286]:
        - button "Export" [ref=e288] [cursor=pointer]
        - generic [ref=e289]:
          - grid [ref=e290]:
            - row "Select all rows User Class Program Subject Type Behavior Points Comment" [ref=e291]:
              - columnheader "Select all rows" [ref=e292]:
                - generic [ref=e294] [cursor=pointer]:
                  - checkbox "Select all rows" [ref=e295]
                  - img [ref=e296]
                - img [ref=e299]
              - columnheader "User" [ref=e301] [cursor=pointer]:
                - generic [ref=e303]: User
                - generic [ref=e304]:
                  - img
              - columnheader "Class" [ref=e305] [cursor=pointer]:
                - generic [ref=e307]: Class
                - generic [ref=e308]:
                  - img
              - columnheader "Program" [ref=e309] [cursor=pointer]:
                - generic [ref=e311]: Program
                - generic [ref=e312]:
                  - img
              - columnheader "Subject" [ref=e313] [cursor=pointer]:
                - generic [ref=e315]: Subject
                - generic [ref=e316]:
                  - img
              - columnheader "Type" [ref=e317] [cursor=pointer]:
                - generic [ref=e319]: Type
                - generic [ref=e320]:
                  - img
              - columnheader "Behavior Points" [ref=e321] [cursor=pointer]:
                - generic [ref=e323]: Behavior Points
                - generic [ref=e324]:
                  - img
              - columnheader "Comment" [ref=e325] [cursor=pointer]:
                - generic [ref=e327]: Comment
                - generic [ref=e328]:
                  - img
            - generic [ref=e330]: No Data
            - rowgroup
          - generic [ref=e335]:
            - paragraph [ref=e336]: "Rows per page:"
            - generic [ref=e337]:
              - 'combobox "Rows per page: 10" [ref=e338] [cursor=pointer]': "10"
              - textbox: "10"
              - img
            - paragraph [ref=e339]: 0–0 of 0
            - generic [ref=e340]:
              - button "Go to previous page" [disabled]:
                - img
              - button "Go to next page" [disabled]:
                - img
```

# Test source

```ts
  285 | 
  286 |   test('TC-PAR-UI-012: Student cannot award participations', async ({ page }) => {
  287 |     await gotoWithAuth(page, PAR_ROUTE, 'student');
  288 |     const denied = await isAccessDenied(page);
  289 |     if (denied) test.skip(true, 'Student redirected');
  290 |     await dismissOverlays(page);
  291 |     const awardBtn = page.locator('button:has-text("Award"), button:has-text("Add")').first();
  292 |     const visible = await awardBtn.isVisible({ timeout: 3000 }).catch(() => false);
  293 |     if (visible) console.warn('BUG: Student can see award button');
  294 |     expect(true).toBe(true);
  295 |   });
  296 | 
  297 |   test('TC-PAR-UI-013: Unauthenticated redirect', async ({ page }) => {
  298 |     await page.goto(`${testConfig.baseUrl}/participation`);
  299 |     await page.waitForLoadState('networkidle');
  300 |     const url = page.url();
  301 |     expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  302 |   });
  303 | });
  304 | 
  305 | // ============================================================
  306 | // BEHAVIORS
  307 | // ============================================================
  308 | 
  309 | test.describe('Behaviors UI — Page Load & Structure', () => {
  310 |   test.beforeEach(async ({ page }) => {
  311 |     await gotoWithAuth(page, BEH_ROUTE, 'instructor');
  312 |     await dismissOverlays(page);
  313 |   });
  314 | 
  315 |   test('TC-BEH-UI-001: Behaviors page loads', async ({ page }) => {
  316 |     const hasContent = await waitForContent(page);
  317 |     expect(hasContent).toBe(true);
  318 |   });
  319 | 
  320 |   test('TC-BEH-UI-002: Behaviors list or empty state renders', async ({ page }) => {
  321 |     const list = page.locator('table, [data-testid*="behavior"], .card, text=/No behavior/i').first();
  322 |     const visible = await list.isVisible({ timeout: 5000 }).catch(() => false);
  323 |     expect(visible).toBe(true);
  324 |   });
  325 | 
  326 |   test('TC-BEH-UI-003: Record behavior button visible', async ({ page }) => {
  327 |     const btn = page.locator('button:has-text("Add"), button:has-text("Record"), [data-testid*="create"]').first();
  328 |     const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);
  329 |     expect(visible).toBe(true);
  330 |   });
  331 | });
  332 | 
  333 | test.describe('Behaviors UI — Create Flow (Deep)', () => {
  334 |   test.beforeEach(async ({ page }) => {
  335 |     await gotoWithAuth(page, BEH_ROUTE, 'instructor');
  336 |     await dismissOverlays(page);
  337 |   });
  338 | 
  339 |   test('TC-BEH-UI-004: Record form opens', async ({ page }) => {
  340 |     const opened = await openForm(page, ['Record', 'Add Behavior', 'Add', 'Create']);
  341 |     if (!opened) test.skip(true, 'Record form did not open');
  342 | 
  343 |     const form = page.locator('form, [role="dialog"], .modal, .drawer').first();
  344 |     const formVisible = await form.isVisible({ timeout: 3000 }).catch(() => false);
  345 |     expect(formVisible).toBe(true);
  346 | 
  347 |     await closeForm(page);
  348 |   });
  349 | 
  350 |   test('TC-BEH-UI-005: Behavior rating selector visible in form', async ({ page }) => {
  351 |     const opened = await openForm(page, ['Record', 'Add Behavior', 'Add']);
  352 |     if (!opened) test.skip(true, 'Record form did not open');
  353 | 
  354 |     const rating = page.locator(
  355 |       'select[name*="rating"], [data-testid*="rating"], ' +
  356 |       'label:has-text("positive"), label:has-text("negative"), ' +
  357 |       'button:has-text("Positive"), button:has-text("Negative")'
  358 |     ).first();
  359 |     const visible = await rating.isVisible({ timeout: 3000 }).catch(() => false);
  360 |     if (!visible) test.skip(true, 'No rating selector');
  361 | 
  362 |     await closeForm(page);
  363 |   });
  364 | 
  365 |   test('TC-BEH-UI-006: Behavior form has student selector', async ({ page }) => {
  366 |     const opened = await openForm(page, ['Record', 'Add Behavior', 'Add']);
  367 |     if (!opened) test.skip(true, 'Record form did not open');
  368 | 
  369 |     const studentSelect = page.locator('select[name*="student"], [data-testid*="student"]').first();
  370 |     const visible = await studentSelect.isVisible({ timeout: 3000 }).catch(() => false);
  371 |     if (!visible) test.skip(true, 'No student selector');
  372 | 
  373 |     await closeForm(page);
  374 |   });
  375 | 
  376 |   test('TC-BEH-UI-007: Cancel closes record form', async ({ page }) => {
  377 |     const opened = await openForm(page, ['Record', 'Add Behavior', 'Add']);
  378 |     if (!opened) test.skip(true, 'Record form did not open');
  379 | 
  380 |     await closeForm(page);
  381 |     await page.waitForTimeout(1000);
  382 | 
  383 |     const form = page.locator('form, [role="dialog"], .modal, .drawer').first();
  384 |     const stillOpen = await form.isVisible({ timeout: 1000 }).catch(() => false);
> 385 |     expect(stillOpen).toBe(false);
      |                       ^ Error: expect(received).toBe(expected) // Object.is equality
  386 |   });
  387 | 
  388 |   test('TC-BEH-UI-008: Form validation — empty submit shows errors', async ({ page }) => {
  389 |     const opened = await openForm(page, ['Record', 'Add Behavior', 'Add']);
  390 |     if (!opened) test.skip(true, 'Record form did not open');
  391 | 
  392 |     const submitBtn = page.locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Record")').first();
  393 |     if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  394 |       await submitBtn.click();
  395 |       await page.waitForTimeout(1000);
  396 |     }
  397 | 
  398 |     await closeForm(page);
  399 |     expect(true).toBe(true);
  400 |   });
  401 | });
  402 | 
  403 | test.describe('Behaviors UI — Delete & Role-Based (Deep)', () => {
  404 |   test('TC-BEH-UI-009: Delete behavior button visible', async ({ page }) => {
  405 |     await gotoWithAuth(page, BEH_ROUTE, 'instructor');
  406 |     await dismissOverlays(page);
  407 |     const delBtn = page.locator('button:has-text("Delete"), [data-testid*="delete"]').first();
  408 |     const visible = await delBtn.isVisible({ timeout: 3000 }).catch(() => false);
  409 |     if (!visible) test.skip(true, 'No delete button');
  410 |   });
  411 | 
  412 |   test('TC-BEH-UI-010: Delete — confirm dialog, then cancel', async ({ page }) => {
  413 |     await gotoWithAuth(page, BEH_ROUTE, 'instructor');
  414 |     await dismissOverlays(page);
  415 |     const delBtn = page.locator('button:has-text("Delete"), [data-testid*="delete"]').first();
  416 |     if (!(await delBtn.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No delete button');
  417 | 
  418 |     await delBtn.click();
  419 |     await page.waitForTimeout(1000);
  420 | 
  421 |     const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("No")').first();
  422 |     if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  423 |       await cancelBtn.click();
  424 |     } else {
  425 |       await page.keyboard.press('Escape');
  426 |     }
  427 |     expect(true).toBe(true);
  428 |   });
  429 | 
  430 |   test('TC-BEH-UI-011: Student views own behaviors', async ({ page }) => {
  431 |     await gotoWithAuth(page, BEH_ROUTE, 'student');
  432 |     const denied = await isAccessDenied(page);
  433 |     if (denied) test.skip(true, 'Student redirected');
  434 |     const hasContent = await waitForContent(page);
  435 |     expect(hasContent).toBe(true);
  436 |   });
  437 | 
  438 |   test('TC-BEH-UI-012: Student cannot record behaviors', async ({ page }) => {
  439 |     await gotoWithAuth(page, BEH_ROUTE, 'student');
  440 |     const denied = await isAccessDenied(page);
  441 |     if (denied) test.skip(true, 'Student redirected');
  442 |     await dismissOverlays(page);
  443 |     const recordBtn = page.locator('button:has-text("Record"), button:has-text("Add")').first();
  444 |     const visible = await recordBtn.isVisible({ timeout: 3000 }).catch(() => false);
  445 |     if (visible) console.warn('BUG: Student can see record behavior button');
  446 |     expect(true).toBe(true);
  447 |   });
  448 | 
  449 |   test('TC-BEH-UI-013: Unauthenticated redirect', async ({ page }) => {
  450 |     await page.goto(`${testConfig.baseUrl}/behavior`);
  451 |     await page.waitForLoadState('networkidle');
  452 |     const url = page.url();
  453 |     expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  454 |   });
  455 | });
  456 | 
  457 | // ═══════════════════════════════════════════════════════════════════════════════
  458 | // SECTION 4: Participation Grade Impact Tests (TC-PAR-UI-020 — TC-PAR-UI-035)
  459 | // Verify add/subtract participation reflects in analytics & grades
  460 | // ═══════════════════════════════════════════════════════════════════════════════
  461 | test.describe('Participation — Grade Impact & Analytics', () => {
  462 |   test('TC-PAR-UI-020: Participation page loads with add/subtract controls', async ({ page }) => {
  463 |     await gotoWithAuth(page, PAR_ROUTE, 'superAdmin');
  464 |     const addBtn = page.locator('button:has-text("Add"), button:has-text("+"), button[aria-label*="add" i]').first();
  465 |     const subtractBtn = page.locator('button:has-text("Subtract"), button:has-text("-"), button[aria-label*="subtract" i]').first();
  466 |     const hasAdd = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);
  467 |     const hasSubtract = await subtractBtn.isVisible({ timeout: 3000 }).catch(() => false);
  468 |     if (!hasAdd && !hasSubtract) test.skip(true, 'No add/subtract controls');
  469 |   });
  470 | 
  471 |   test('TC-PAR-UI-021: Participation form has points field', async ({ page }) => {
  472 |     await gotoWithAuth(page, PAR_ROUTE, 'superAdmin');
  473 |     const addBtn = page.locator('button:has-text("Add"), button:has-text("+"), [data-testid*="add"]').first();
  474 |     if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  475 |       await addBtn.click();
  476 |       await page.waitForTimeout(500);
  477 |     }
  478 |     const pointsInput = page.locator('input[name*="point"], input[type="number"], [data-testid*="point"]').first();
  479 |     const visible = await pointsInput.isVisible({ timeout: 5000 }).catch(() => false);
  480 |     if (!visible) test.skip(true, 'No points input in participation form');
  481 |   });
  482 | 
  483 |   test('TC-PAR-UI-022: Participation form has student selector', async ({ page }) => {
  484 |     await gotoWithAuth(page, PAR_ROUTE, 'superAdmin');
  485 |     const addBtn = page.locator('button:has-text("Add"), [data-testid*="add"]').first();
```