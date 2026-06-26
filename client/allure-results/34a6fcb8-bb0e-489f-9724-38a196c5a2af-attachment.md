# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: profile-ui.spec.js >> Profile Settings — Deep Settings Tests >> TC-PROF-UI-055: Settings page unauthenticated redirect
- Location: tests/e2e/specs/profile-ui.spec.js:523:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_TIMED_OUT at https://localhost:5174/profile/settings
Call log:
  - navigating to "https://localhost:5174/profile/settings", waiting until "load"

```

# Test source

```ts
  424 |     const saveBtn = page.locator('button:has-text("Save"), button[type="submit"]').first();
  425 |     if (!(await saveBtn.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No save button');
  426 |     await saveBtn.click();
  427 |     await page.waitForTimeout(1000);
  428 |     expect(true).toBe(true);
  429 |   });
  430 | 
  431 |   test('TC-PROF-UI-043: Personal info section visible', async ({ page }) => {
  432 |     await gotoWithAuth(page, SETTINGS_ROUTE, 'superAdmin');
  433 |     const infoSection = page.locator('text=/personal.*info/i, text=/profile.*info/i, [data-testid*="personal-info"]').first();
  434 |     const visible = await infoSection.isVisible({ timeout: 5000 }).catch(() => false);
  435 |     if (!visible) test.skip(true, 'No personal info section');
  436 |   });
  437 | 
  438 |   test('TC-PROF-UI-044: Name input field visible', async ({ page }) => {
  439 |     await gotoWithAuth(page, SETTINGS_ROUTE, 'superAdmin');
  440 |     const nameInput = page.locator('input[name*="name"], input[name*="firstName"], input[name*="fullName"]').first();
  441 |     const visible = await nameInput.isVisible({ timeout: 5000 }).catch(() => false);
  442 |     if (!visible) test.skip(true, 'No name input');
  443 |   });
  444 | 
  445 |   test('TC-PROF-UI-045: Email input field visible', async ({ page }) => {
  446 |     await gotoWithAuth(page, SETTINGS_ROUTE, 'superAdmin');
  447 |     const emailInput = page.locator('input[name*="email"], input[type="email"]').first();
  448 |     const visible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
  449 |     if (!visible) test.skip(true, 'No email input');
  450 |   });
  451 | 
  452 |   test('TC-PROF-UI-046: Avatar/profile image visible', async ({ page }) => {
  453 |     await gotoWithAuth(page, SETTINGS_ROUTE, 'superAdmin');
  454 |     const avatar = page.locator('img[class*="avatar"], [data-testid*="avatar"], [class*="profile-image"], img[alt*="profile" i]').first();
  455 |     const visible = await avatar.isVisible({ timeout: 5000 }).catch(() => false);
  456 |     if (!visible) test.skip(true, 'No avatar/profile image');
  457 |   });
  458 | 
  459 |   test('TC-PROF-UI-047: Appearance section visible', async ({ page }) => {
  460 |     await gotoWithAuth(page, SETTINGS_ROUTE, 'superAdmin');
  461 |     const appearance = page.locator('text=/appearance/i, text=/display/i, [data-testid*="appearance"]').first();
  462 |     const visible = await appearance.isVisible({ timeout: 5000 }).catch(() => false);
  463 |     if (!visible) test.skip(true, 'No appearance section');
  464 |   });
  465 | 
  466 |   test('TC-PROF-UI-048: Dark mode toggle changes theme class', async ({ page }) => {
  467 |     await gotoWithAuth(page, SETTINGS_ROUTE, 'superAdmin');
  468 |     const themeToggle = page.locator(
  469 |       'button[aria-label*="theme" i], [data-testid*="theme-toggle"], ' +
  470 |       'input[type="checkbox"][name*="theme"], [role="switch"][aria-label*="theme" i]'
  471 |     ).first();
  472 |     if (!(await themeToggle.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No theme toggle');
  473 |     const beforeClass = await page.evaluate(() => document.documentElement.className);
  474 |     await themeToggle.click();
  475 |     await page.waitForTimeout(1000);
  476 |     const afterClass = await page.evaluate(() => document.documentElement.className);
  477 |     // Class should change
  478 |     expect(beforeClass !== afterClass || true).toBe(true);
  479 |   });
  480 | 
  481 |   test('TC-PROF-UI-049: Color picker changes theme color', async ({ page }) => {
  482 |     await gotoWithAuth(page, SETTINGS_ROUTE, 'superAdmin');
  483 |     const colorPicker = page.locator('input[type="color"], [data-testid*="color-picker"]').first();
  484 |     if (!(await colorPicker.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No color picker');
  485 |     // Just verify it's interactive
  486 |     expect(true).toBe(true);
  487 |   });
  488 | 
  489 |   test('TC-PROF-UI-050: Student can access settings', async ({ page }) => {
  490 |     await gotoWithAuth(page, SETTINGS_ROUTE, 'student');
  491 |     const content = await page.locator('main, [role="main"], form').first().isVisible({ timeout: 5000 }).catch(() => false);
  492 |     if (!content) test.skip(true, 'Student cannot access settings');
  493 |   });
  494 | 
  495 |   test('TC-PROF-UI-051: Instructor can access settings', async ({ page }) => {
  496 |     await gotoWithAuth(page, SETTINGS_ROUTE, 'instructor');
  497 |     const content = await page.locator('main, [role="main"], form').first().isVisible({ timeout: 5000 }).catch(() => false);
  498 |     if (!content) test.skip(true, 'Instructor cannot access settings');
  499 |   });
  500 | 
  501 |   test('TC-PROF-UI-052: Settings page has multiple color swatches', async ({ page }) => {
  502 |     await gotoWithAuth(page, SETTINGS_ROUTE, 'superAdmin');
  503 |     const swatches = page.locator('[class*="color-swatch"], [class*="theme-color"] button, [data-testid*="color-swatch"]');
  504 |     const count = await swatches.count();
  505 |     if (count === 0) test.skip(true, 'No color swatches');
  506 |     expect(count).toBeGreaterThan(0);
  507 |   });
  508 | 
  509 |   test('TC-PROF-UI-053: Phone number field visible', async ({ page }) => {
  510 |     await gotoWithAuth(page, SETTINGS_ROUTE, 'superAdmin');
  511 |     const phoneInput = page.locator('input[name*="phone"], input[type="tel"], [data-testid*="phone"]').first();
  512 |     const visible = await phoneInput.isVisible({ timeout: 5000 }).catch(() => false);
  513 |     if (!visible) test.skip(true, 'No phone input');
  514 |   });
  515 | 
  516 |   test('TC-PROF-UI-054: Cancel/reset button visible', async ({ page }) => {
  517 |     await gotoWithAuth(page, SETTINGS_ROUTE, 'superAdmin');
  518 |     const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Reset"), button:has-text("Discard")').first();
  519 |     const visible = await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false);
  520 |     if (!visible) test.skip(true, 'No cancel/reset button');
  521 |   });
  522 | 
  523 |   test('TC-PROF-UI-055: Settings page unauthenticated redirect', async ({ page }) => {
> 524 |     await page.goto(`${testConfig.baseUrl}/profile/settings`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_TIMED_OUT at https://localhost:5174/profile/settings
  525 |     await page.waitForLoadState('networkidle');
  526 |     const url = page.url();
  527 |     expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  528 |   });
  529 | });
  530 | 
```