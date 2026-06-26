# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: activities-ui.spec.js >> Activities UI — Unauthenticated >> TC-ACT-UI-030: Redirect to login when not authenticated
- Location: tests/e2e/specs/activities-ui.spec.js:584:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://localhost:5174/activities", waiting until "load"

```

# Test source

```ts
  485 | 
  486 |     const stillExists = await verifyInList(page, rowText.slice(0, 20));
  487 |     expect(stillExists).toBe(true);
  488 |   });
  489 | });
  490 | 
  491 | test.describe('Activities UI — Role-Based Access (Deep)', () => {
  492 |   test('TC-ACT-UI-024: Student views activities', async ({ page }) => {
  493 |     await gotoWithAuth(page, ROUTE, 'student');
  494 |     const denied = await isAccessDenied(page);
  495 |     if (denied) test.skip(true, 'Student denied access');
  496 |     const hasContent = await waitForContent(page);
  497 |     expect(hasContent).toBe(true);
  498 |   });
  499 | 
  500 |   test('TC-ACT-UI-025: Student cannot see create button', async ({ page }) => {
  501 |     await gotoWithAuth(page, ROUTE, 'student');
  502 |     await dismissOverlays(page);
  503 |     const createBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
  504 |     const visible = await createBtn.isVisible({ timeout: 3000 }).catch(() => false);
  505 |     if (visible) console.warn('BUG: Student can see create activity button');
  506 |     expect(true).toBe(true);
  507 |   });
  508 | 
  509 |   test('TC-ACT-UI-026: Admin can view and create activities', async ({ page }) => {
  510 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  511 |     await dismissOverlays(page);
  512 |     const createBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
  513 |     const visible = await createBtn.isVisible({ timeout: 3000 }).catch(() => false);
  514 |     if (!visible) test.skip(true, 'Admin has no create button');
  515 |     expect(visible).toBe(true);
  516 |   });
  517 | });
  518 | 
  519 | test.describe('Activities UI — User Story & Bulk', () => {
  520 |   test('TC-ACT-UI-027: User story — instructor creates activity, student sees it', async ({ page }) => {
  521 |     await gotoWithAuth(page, ROUTE, 'instructor');
  522 |     await dismissOverlays(page);
  523 | 
  524 |     const testTitle = `${TEST_PREFIX}STORY_${Date.now()}`;
  525 |     const opened = await openForm(page, ['Add Activity', 'Create Activity', 'Add', 'Create']);
  526 |     if (!opened) test.skip(true, 'Create form did not open');
  527 | 
  528 |     const titleField = page.locator('input[name*="title"], input[name*="name"]').first();
  529 |     if (await titleField.isVisible({ timeout: 2000 }).catch(() => false)) {
  530 |       await titleField.fill(testTitle);
  531 |     }
  532 | 
  533 |     const result = await submitForm(page, ['Save', 'Create', 'Submit']);
  534 |     if (!result.submitted) test.skip(true, 'Could not submit activity');
  535 | 
  536 |     await page.waitForTimeout(2000);
  537 |     // Verify the activity was created — check page still has content
  538 |     const hasContent = await waitForContent(page);
  539 |     expect(hasContent).toBe(true);
  540 | 
  541 |     // Cleanup: delete the created story activity via UI
  542 |     const search = page.locator('input[placeholder*="search" i], input[placeholder*="Search" i], [data-testid*="search"] input').first();
  543 |     if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
  544 |       await search.fill(testTitle);
  545 |       await page.waitForTimeout(2000);
  546 |     }
  547 | 
  548 |     const row = page.locator('table tbody tr, [data-testid*="activity-item"], .card').first();
  549 |     if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
  550 |       const delBtn = row.locator('button:has-text("Delete"), [data-testid*="delete"]').first();
  551 |       if (await delBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  552 |         await delBtn.click();
  553 |         await page.waitForTimeout(1000);
  554 |         const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK"), button:has-text("Delete")').last();
  555 |         if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  556 |           await confirmBtn.click();
  557 |           await page.waitForTimeout(2000);
  558 |         }
  559 |       }
  560 |     }
  561 |   });
  562 | 
  563 |   test('TC-ACT-UI-028: Row checkbox selection works', async ({ page }) => {
  564 |     await gotoWithAuth(page, ROUTE, 'instructor');
  565 |     await dismissOverlays(page);
  566 |     const rowCheckbox = page.locator('tbody input[type="checkbox"]').first();
  567 |     const visible = await rowCheckbox.isVisible({ timeout: 3000 }).catch(() => false);
  568 |     if (!visible) test.skip(true, 'No row checkboxes');
  569 |     await rowCheckbox.click();
  570 |     const isChecked = await rowCheckbox.isChecked();
  571 |     expect(isChecked).toBe(true);
  572 |   });
  573 | 
  574 |   test('TC-ACT-UI-029: Export button visible', async ({ page }) => {
  575 |     await gotoWithAuth(page, ROUTE, 'instructor');
  576 |     await dismissOverlays(page);
  577 |     const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid*="export"]').first();
  578 |     const visible = await exportBtn.isVisible({ timeout: 3000 }).catch(() => false);
  579 |     if (!visible) test.skip(true, 'No export button');
  580 |   });
  581 | });
  582 | 
  583 | test.describe('Activities UI — Unauthenticated', () => {
  584 |   test('TC-ACT-UI-030: Redirect to login when not authenticated', async ({ page }) => {
> 585 |     await page.goto(`${testConfig.baseUrl}/activities`);
      |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  586 |     await page.waitForLoadState('networkidle');
  587 |     const url = page.url();
  588 |     expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  589 |   });
  590 | });
  591 | 
```