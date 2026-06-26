# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: enrollments-ui.spec.js >> Enrollments UI — Unauthenticated >> TC-ENR-UI-031: Redirect to login when not authenticated
- Location: tests/e2e/specs/enrollments-ui.spec.js:505:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://localhost:5174/enrollments", waiting until "load"

```

# Test source

```ts
  406 |       await cancelBtn.click();
  407 |       await page.waitForTimeout(1000);
  408 |     } else {
  409 |       await page.keyboard.press('Escape');
  410 |     }
  411 | 
  412 |     const stillExists = await verifyInList(page, rowText.slice(0, 20));
  413 |     expect(stillExists).toBe(true);
  414 |   });
  415 | });
  416 | 
  417 | test.describe('Enrollments UI — Role-Based Access (Deep)', () => {
  418 |   test('TC-ENR-UI-024: Student sees own enrollments', async ({ page }) => {
  419 |     await gotoWithAuth(page, ROUTE, 'student');
  420 |     const denied = await isAccessDenied(page);
  421 |     if (denied) test.skip(true, 'Student denied access');
  422 |     const hasContent = await waitForContent(page);
  423 |     expect(hasContent).toBe(true);
  424 |   });
  425 | 
  426 |   test('TC-ENR-UI-025: Student cannot see enroll button', async ({ page }) => {
  427 |     await gotoWithAuth(page, ROUTE, 'student');
  428 |     await dismissOverlays(page);
  429 |     const enrollBtn = page.locator('button:has-text("Enroll"), button:has-text("Add Student")').first();
  430 |     const visible = await enrollBtn.isVisible({ timeout: 3000 }).catch(() => false);
  431 |     if (visible) console.warn('BUG: Student can see enroll button');
  432 |     expect(true).toBe(true);
  433 |   });
  434 | 
  435 |   test('TC-ENR-UI-026: Instructor sees class enrollments', async ({ page }) => {
  436 |     await gotoWithAuth(page, ROUTE, 'instructor');
  437 |     const denied = await isAccessDenied(page);
  438 |     if (denied) test.skip(true, 'Instructor denied access');
  439 |     const hasContent = await waitForContent(page);
  440 |     expect(hasContent).toBe(true);
  441 |   });
  442 | });
  443 | 
  444 | test.describe('Enrollments UI — User Story & Bulk', () => {
  445 |   test('TC-ENR-UI-027: User story — admin enrolls student and verifies', async ({ page }) => {
  446 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  447 |     await dismissOverlays(page);
  448 | 
  449 |     const opened = await openForm(page, ['Enroll Student', 'Add Enrollment', 'Enroll', 'Add', 'Create']);
  450 |     if (!opened) test.skip(true, 'Enroll form did not open');
  451 | 
  452 |     const studentSelect = page.locator('select[name*="student"], [data-testid*="student"]').first();
  453 |     if (await studentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
  454 |       const options = await studentSelect.locator('option').allTextContents();
  455 |       if (options.length > 1) await studentSelect.selectOption({ index: 1 });
  456 |     }
  457 | 
  458 |     const classSelect = page.locator('select[name*="class"], [data-testid*="class"]').first();
  459 |     if (await classSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
  460 |       const options = await classSelect.locator('option').allTextContents();
  461 |       if (options.length > 1) await classSelect.selectOption({ index: 1 });
  462 |     }
  463 | 
  464 |     const result = await submitForm(page, ['Save', 'Enroll', 'Submit', 'Create']);
  465 |     if (!result.submitted) test.skip(true, 'Could not submit enrollment');
  466 | 
  467 |     await page.waitForTimeout(2000);
  468 |     const hasContent = await waitForContent(page);
  469 |     expect(hasContent).toBe(true);
  470 |   });
  471 | 
  472 |   test('TC-ENR-UI-028: Row checkbox selection works', async ({ page }) => {
  473 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  474 |     await dismissOverlays(page);
  475 |     const rowCheckbox = page.locator('tbody input[type="checkbox"]').first();
  476 |     const visible = await rowCheckbox.isVisible({ timeout: 3000 }).catch(() => false);
  477 |     if (!visible) test.skip(true, 'No row checkboxes');
  478 |     await rowCheckbox.click();
  479 |     const isChecked = await rowCheckbox.isChecked();
  480 |     expect(isChecked).toBe(true);
  481 |   });
  482 | 
  483 |   test('TC-ENR-UI-029: Export button visible', async ({ page }) => {
  484 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  485 |     await dismissOverlays(page);
  486 |     const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid*="export"]').first();
  487 |     const visible = await exportBtn.isVisible({ timeout: 3000 }).catch(() => false);
  488 |     if (!visible) test.skip(true, 'No export button');
  489 |   });
  490 | 
  491 |   test('TC-ENR-UI-030: Students-by-class view toggle', async ({ page }) => {
  492 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  493 |     await dismissOverlays(page);
  494 |     const classView = page.locator('[data-testid*="students-by-class"], button:has-text("Students"), button:has-text("By Class")').first();
  495 |     const visible = await classView.isVisible({ timeout: 3000 }).catch(() => false);
  496 |     if (!visible) test.skip(true, 'No students-by-class view');
  497 |     await classView.click();
  498 |     await page.waitForTimeout(2000);
  499 |     const hasContent = await waitForContent(page);
  500 |     expect(hasContent).toBe(true);
  501 |   });
  502 | });
  503 | 
  504 | test.describe('Enrollments UI — Unauthenticated', () => {
  505 |   test('TC-ENR-UI-031: Redirect to login when not authenticated', async ({ page }) => {
> 506 |     await page.goto(`${testConfig.baseUrl}/enrollments`);
      |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  507 |     await page.waitForLoadState('networkidle');
  508 |     const url = page.url();
  509 |     expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  510 |   });
  511 | });
  512 | 
```