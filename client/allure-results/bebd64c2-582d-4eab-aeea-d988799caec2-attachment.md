# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Authentication — Protected Route Enforcement >> TC-AUTH-031: Unauthenticated /notifications redirects to login
- Location: tests/e2e/specs/auth.spec.js:431:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_TIMED_OUT at https://localhost:5174/notifications
Call log:
  - navigating to "https://localhost:5174/notifications", waiting until "load"

```

# Test source

```ts
  332 |     const hasTestFn = await page.evaluate(() => typeof window.testSessionWarning === 'function');
  333 |     if (!hasTestFn) {
  334 |       expect(true).toBe(true); // Not dev mode — feature not available
  335 |       return;
  336 |     }
  337 |     await page.evaluate(() => window.testSessionWarning());
  338 |     await page.waitForTimeout(1000);
  339 |     // Check for session modal
  340 |     const modal = page.locator(
  341 |       '[class*="session-modal"], [class*="session-warning"], ' +
  342 |       '[role="dialog"] :has-text("session"), text=/session.*expir/i, ' +
  343 |       'text=/extend.*session/i, text=/stay.*logged/i'
  344 |     ).first();
  345 |     const visible = await modal.isVisible({ timeout: 5000 }).catch(() => false);
  346 |     expect(typeof visible).toBe('boolean');
  347 |   });
  348 | 
  349 |   test('TC-AUTH-024: Session modal has extend/logout buttons', async ({ page }) => {
  350 |     await gotoWithAuth(page, HOME_ROUTE, 'superAdmin');
  351 |     const hasTestFn = await page.evaluate(() => typeof window.testSessionWarning === 'function');
  352 |     if (!hasTestFn) {
  353 |       expect(true).toBe(true); // Not dev mode
  354 |       return;
  355 |     }
  356 |     await page.evaluate(() => window.testSessionWarning());
  357 |     await page.waitForTimeout(1000);
  358 |     const extendBtn = page.locator(
  359 |       'button:has-text("Extend"), button:has-text("Stay"), button:has-text("Continue"), ' +
  360 |       '[data-testid*="extend-session"]'
  361 |     ).first();
  362 |     const logoutBtn = page.locator(
  363 |       'button:has-text("Logout"), button:has-text("Sign Out"), ' +
  364 |       '[data-testid*="session-logout"]'
  365 |     ).first();
  366 |     const extendVisible = await extendBtn.isVisible({ timeout: 5000 }).catch(() => false);
  367 |     const logoutVisible = await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false);
  368 |     expect(extendVisible || logoutVisible).toBe(true);
  369 |   });
  370 | 
  371 |   test('TC-AUTH-025: Session modal shows countdown timer', async ({ page }) => {
  372 |     await gotoWithAuth(page, HOME_ROUTE, 'superAdmin');
  373 |     const hasTestFn = await page.evaluate(() => typeof window.testSessionWarning === 'function');
  374 |     if (!hasTestFn) {
  375 |       expect(true).toBe(true); // Not dev mode
  376 |       return;
  377 |     }
  378 |     await page.evaluate(() => window.testSessionWarning());
  379 |     await page.waitForTimeout(1000);
  380 |     const countdown = page.locator(
  381 |       'text=/\d+\s*second/i, text=/\d{2}:\d{2}/, [class*="countdown"], [data-testid*="countdown"]'
  382 |     ).first();
  383 |     const visible = await countdown.isVisible({ timeout: 5000 }).catch(() => false);
  384 |     expect(typeof visible).toBe('boolean');
  385 |   });
  386 | 
  387 |   test('TC-AUTH-026: Token refresh function available (dev mode)', async ({ page }) => {
  388 |     await gotoWithAuth(page, HOME_ROUTE, 'superAdmin');
  389 |     const hasTestFn = await page.evaluate(() => typeof window.testTokenRefresh === 'function');
  390 |     if (!hasTestFn) {
  391 |       expect(true).toBe(true); // Not dev mode — feature not available
  392 |       return;
  393 |     }
  394 |     expect(hasTestFn).toBe(true);
  395 |   });
  396 | 
  397 |   test('TC-AUTH-027: lastRefreshTime persists in localStorage', async ({ page }) => {
  398 |     await gotoWithAuth(page, HOME_ROUTE, 'superAdmin');
  399 |     const lastRefresh = await page.evaluate(() => localStorage.getItem('lastRefreshTime'));
  400 |     // May not be set if no refresh has occurred yet — pass either way
  401 |     expect(lastRefresh === null || typeof lastRefresh === 'string').toBe(true);
  402 |   });
  403 | 
  404 |   test('TC-AUTH-028: Cookie has kc_token after login', async ({ page }) => {
  405 |     await gotoWithAuth(page, HOME_ROUTE, 'superAdmin');
  406 |     const cookies = await page.context().cookies();
  407 |     const kcCookie = cookies.find(c => c.name === 'kc_token');
  408 |     // Cookie may not be present if Keycloak uses localStorage instead
  409 |     expect(typeof kcCookie).toBe('object');
  410 |   });
  411 | });
  412 | 
  413 | // ═══════════════════════════════════════════════════════════════════════════════
  414 | // SECTION 4: Protected Route Enforcement (TC-AUTH-029 — TC-AUTH-036)
  415 | // ═══════════════════════════════════════════════════════════════════════════════
  416 | test.describe('Authentication — Protected Route Enforcement', () => {
  417 |   test('TC-AUTH-029: Unauthenticated /dashboard redirects to login', async ({ page }) => {
  418 |     await page.goto(`${BASE_URL}${DASHBOARD_ROUTE}`);
  419 |     await page.waitForLoadState('networkidle');
  420 |     const url = page.url();
  421 |     expect(url.includes('login') || url.includes('keycloak') || url.includes('8080')).toBe(true);
  422 |   });
  423 | 
  424 |   test('TC-AUTH-030: Unauthenticated /profile redirects to login', async ({ page }) => {
  425 |     await page.goto(`${BASE_URL}/profile`);
  426 |     await page.waitForLoadState('networkidle');
  427 |     const url = page.url();
  428 |     expect(url.includes('login') || url.includes('keycloak') || url.includes('8080')).toBe(true);
  429 |   });
  430 | 
  431 |   test('TC-AUTH-031: Unauthenticated /notifications redirects to login', async ({ page }) => {
> 432 |     await page.goto(`${BASE_URL}/notifications`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_TIMED_OUT at https://localhost:5174/notifications
  433 |     await page.waitForLoadState('networkidle');
  434 |     const url = page.url();
  435 |     expect(url.includes('login') || url.includes('keycloak') || url.includes('8080')).toBe(true);
  436 |   });
  437 | 
  438 |   test('TC-AUTH-032: Unauthenticated /manage-enrollments redirects to login', async ({ page }) => {
  439 |     await page.goto(`${BASE_URL}/manage-enrollments`);
  440 |     await page.waitForLoadState('networkidle');
  441 |     const url = page.url();
  442 |     expect(url.includes('login') || url.includes('keycloak') || url.includes('8080')).toBe(true);
  443 |   });
  444 | 
  445 |   test('TC-AUTH-033: Unauthenticated /qr-scanner redirects to login', async ({ page }) => {
  446 |     await page.goto(`${BASE_URL}/qr-scanner`);
  447 |     await page.waitForLoadState('networkidle');
  448 |     const url = page.url();
  449 |     expect(url.includes('login') || url.includes('keycloak') || url.includes('8080')).toBe(true);
  450 |   });
  451 | 
  452 |   test('TC-AUTH-034: Unauthenticated /analytics redirects to login', async ({ page }) => {
  453 |     await page.goto(`${BASE_URL}/analytics`);
  454 |     await page.waitForLoadState('networkidle');
  455 |     const url = page.url();
  456 |     expect(url.includes('login') || url.includes('keycloak') || url.includes('8080')).toBe(true);
  457 |   });
  458 | 
  459 |   test('TC-AUTH-035: Unauthenticated /users redirects to login', async ({ page }) => {
  460 |     await page.goto(`${BASE_URL}/users`);
  461 |     await page.waitForLoadState('networkidle');
  462 |     const url = page.url();
  463 |     expect(url.includes('login') || url.includes('keycloak') || url.includes('8080')).toBe(true);
  464 |   });
  465 | 
  466 |   test('TC-AUTH-036: Unauthenticated /scheduling redirects to login', async ({ page }) => {
  467 |     await page.goto(`${BASE_URL}/scheduling`);
  468 |     await page.waitForLoadState('networkidle');
  469 |     const url = page.url();
  470 |     expect(url.includes('login') || url.includes('keycloak') || url.includes('8080')).toBe(true);
  471 |   });
  472 | });
  473 | 
  474 | // ═══════════════════════════════════════════════════════════════════════════════
  475 | // SECTION 5: Unauthorized Page (TC-AUTH-037 — TC-AUTH-043)
  476 | // ═══════════════════════════════════════════════════════════════════════════════
  477 | test.describe('Authentication — Unauthorized Page', () => {
  478 |   test('TC-AUTH-037: Unauthorized page shows access denied heading', async ({ page }) => {
  479 |     // Login as student — superAdmin gets redirected away from /unauthorized
  480 |     await gotoWithAuth(page, UNAUTHORIZED_ROUTE, 'student');
  481 |     // Wait for page to settle — superAdmin redirect won't happen for student
  482 |     await page.waitForTimeout(2000);
  483 |     const heading = page.locator('h1.unauthorized-title')
  484 |       .or(page.locator('h1:has-text("Access Denied")'))
  485 |       .or(page.locator('h1:has-text("Unauthorized")'))
  486 |       .or(page.getByText(/access.*denied/i));
  487 |     await expect(heading.first()).toBeVisible({ timeout: 10000 });
  488 |   });
  489 | 
  490 |   test('TC-AUTH-038: Unauthorized page shows shield icon', async ({ page }) => {
  491 |     await gotoWithAuth(page, UNAUTHORIZED_ROUTE, 'student');
  492 |     await page.waitForTimeout(2000);
  493 |     const icon = page.locator('.unauthorized-icon svg, .unauthorized-icon img, .unauthorized-icon').first();
  494 |     await expect(icon).toBeVisible({ timeout: 10000 });
  495 |   });
  496 | 
  497 |   test('TC-AUTH-039: Unauthorized page has Go Back button', async ({ page }) => {
  498 |     await gotoWithAuth(page, UNAUTHORIZED_ROUTE, 'student');
  499 |     await page.waitForTimeout(2000);
  500 |     const goBack = page.locator('.unauthorized-actions button:has-text("Go Back"), .unauthorized-actions button:has-text("رجوع"), button:has-text("Go Back")').first();
  501 |     await expect(goBack).toBeVisible({ timeout: 10000 });
  502 |   });
  503 | 
  504 |   test('TC-AUTH-040: Unauthorized page has Go Home button', async ({ page }) => {
  505 |     await gotoWithAuth(page, UNAUTHORIZED_ROUTE, 'student');
  506 |     await page.waitForTimeout(2000);
  507 |     const goHome = page.locator('.unauthorized-actions button:has-text("Go Home"), .unauthorized-actions button:has-text("الرئيسية"), button:has-text("Go Home")').first();
  508 |     await expect(goHome).toBeVisible({ timeout: 10000 });
  509 |   });
  510 | 
  511 |   test('TC-AUTH-041: Click Go Home navigates away from unauthorized', async ({ page }) => {
  512 |     await gotoWithAuth(page, UNAUTHORIZED_ROUTE, 'student');
  513 |     await page.waitForTimeout(2000);
  514 |     const goHome = page.locator('.unauthorized-actions button:has-text("Go Home"), button:has-text("Go Home"), button:has-text("الرئيسية")').first();
  515 |     await expect(goHome).toBeVisible({ timeout: 10000 });
  516 |     await goHome.click();
  517 |     await page.waitForTimeout(2000);
  518 |     expect(page.url()).not.toContain('/unauthorized');
  519 |   });
  520 | 
  521 |   test('TC-AUTH-042: Unauthorized page shows user role info', async ({ page }) => {
  522 |     await gotoWithAuth(page, UNAUTHORIZED_ROUTE, 'student');
  523 |     await page.waitForTimeout(2000);
  524 |     const roleInfo = page.locator('.unauthorized-role-info')
  525 |       .or(page.locator('.role-badge'))
  526 |       .or(page.getByText(/Your Role/i))
  527 |       .or(page.getByText(/دورك/i));
  528 |     await expect(roleInfo.first()).toBeVisible({ timeout: 10000 });
  529 |   });
  530 | 
  531 |   test('TC-AUTH-043: Unauthorized page shows contact admin help text', async ({ page }) => {
  532 |     await gotoWithAuth(page, UNAUTHORIZED_ROUTE, 'student');
```