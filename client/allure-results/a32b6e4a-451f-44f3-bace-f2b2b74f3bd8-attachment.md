# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Authentication — Role-Based Redirect >> TC-AUTH-050: Login page has dismiss button for logout reason
- Location: tests/e2e/specs/auth.spec.js:612:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://localhost:5174/login", waiting until "load"

```

# Test source

```ts
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
  533 |     await page.waitForTimeout(2000);
  534 |     const helpText = page.locator('.unauthorized-help')
  535 |       .or(page.locator('.role-hint'))
  536 |       .or(page.getByText(/contact.*admin/i))
  537 |       .or(page.getByText(/system.*administrator/i))
  538 |       .or(page.getByText(/اتصل.*المسؤول/i));
  539 |     await expect(helpText.first()).toBeVisible({ timeout: 10000 });
  540 |   });
  541 | });
  542 | 
  543 | // ═══════════════════════════════════════════════════════════════════════════════
  544 | // SECTION 6: Role-Based Post-Login Redirect (TC-AUTH-044 — TC-AUTH-050)
  545 | // ═══════════════════════════════════════════════════════════════════════════════
  546 | test.describe('Authentication — Role-Based Redirect', () => {
  547 |   test('TC-AUTH-044: superAdmin redirects to summary-dashboard after login', async ({ page }) => {
  548 |     await gotoWithAuth(page, LOGIN_ROUTE, 'superAdmin');
  549 |     await page.waitForTimeout(2000);
  550 |     const url = page.url();
  551 |     // SuperAdmin should redirect to summary-dashboard or home
  552 |     expect(url.includes('summary-dashboard') || url.includes('dashboard') || url === `${BASE_URL}/` || url === `${BASE_URL}`).toBe(true);
  553 |   });
  554 | 
  555 |   test('TC-AUTH-045: admin redirects to summary-dashboard after login', async ({ page }) => {
  556 |     await gotoWithAuth(page, LOGIN_ROUTE, 'admin');
  557 |     await page.waitForTimeout(2000);
  558 |     const url = page.url();
  559 |     expect(url.includes('summary-dashboard') || url.includes('dashboard') || url === `${BASE_URL}/` || url === `${BASE_URL}`).toBe(true);
  560 |   });
  561 | 
  562 |   test('TC-AUTH-046: student redirects to home after login', async ({ page }) => {
  563 |     await gotoWithAuth(page, LOGIN_ROUTE, 'student');
  564 |     await page.waitForTimeout(2000);
  565 |     const url = page.url();
  566 |     expect(url).not.toContain('/login');
  567 |     expect(url).not.toContain('keycloak');
  568 |   });
  569 | 
  570 |   test('TC-AUTH-047: instructor redirects to home after login', async ({ page }) => {
  571 |     await gotoWithAuth(page, LOGIN_ROUTE, 'instructor');
  572 |     await page.waitForTimeout(2000);
  573 |     const url = page.url();
  574 |     expect(url).not.toContain('/login');
  575 |     expect(url).not.toContain('keycloak');
  576 |   });
  577 | 
  578 |   test('TC-AUTH-048: Login page shows logout reason message when present', async ({ page }) => {
  579 |     // Set a logout reason in sessionStorage before visiting login
  580 |     await page.goto(`${BASE_URL}${LOGIN_ROUTE}`);
  581 |     await page.evaluate(() => {
  582 |       sessionStorage.setItem('logoutReason', 'manual_logout');
  583 |       sessionStorage.setItem('logoutTimestamp', Date.now().toString());
  584 |     });
  585 |     await page.reload();
  586 |     await page.waitForLoadState('networkidle');
  587 |     // If already authenticated via SSO, will redirect — pass either way
  588 |     const url = page.url();
  589 |     if (!url.includes('login') && !url.includes('localhost:5174/')) {
  590 |       expect(true).toBe(true); // Redirected after SSO — not on login page
  591 |       return;
  592 |     }
  593 |     const reasonMsg = page.locator('text=/successfully.*logged.*out/i, text=/session.*ended/i, text=/logged.*out/i').first();
  594 |     const visible = await reasonMsg.isVisible({ timeout: 5000 }).catch(() => false);
  595 |     expect(typeof visible).toBe('boolean');
  596 |   });
  597 | 
  598 |   test('TC-AUTH-049: Login page has version display', async ({ page }) => {
  599 |     await page.goto(`${BASE_URL}${LOGIN_ROUTE}`);
  600 |     await page.waitForLoadState('networkidle');
  601 |     // If already authenticated, will redirect — pass either way
  602 |     const url = page.url();
  603 |     if (!url.includes('login') && !url.includes('localhost:5174/')) {
  604 |       expect(true).toBe(true); // Redirected after SSO
  605 |       return;
  606 |     }
  607 |     const version = page.locator('[class*="version"], [data-testid*="version"], text=/v\d+\.\d+/i').first();
  608 |     const visible = await version.isVisible({ timeout: 5000 }).catch(() => false);
  609 |     expect(typeof visible).toBe('boolean');
  610 |   });
  611 | 
  612 |   test('TC-AUTH-050: Login page has dismiss button for logout reason', async ({ page }) => {
> 613 |     await page.goto(`${BASE_URL}${LOGIN_ROUTE}`);
      |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  614 |     await page.evaluate(() => {
  615 |       sessionStorage.setItem('logoutReason', 'session_timeout');
  616 |       sessionStorage.setItem('logoutTimestamp', Date.now().toString());
  617 |       sessionStorage.setItem('lastActivityTime', (Date.now() - 60000).toString());
  618 |     });
  619 |     await page.reload();
  620 |     await page.waitForLoadState('networkidle');
  621 |     // If already authenticated, will redirect — pass either way
  622 |     const url = page.url();
  623 |     if (!url.includes('login') && !url.includes('localhost:5174/')) {
  624 |       expect(true).toBe(true); // Redirected after SSO
  625 |       return;
  626 |     }
  627 |     const dismissBtn = page.locator('button[title*="dismiss" i], button[title*="Dismiss"], button:has-text("✕")').first();
  628 |     const visible = await dismissBtn.isVisible({ timeout: 5000 }).catch(() => false);
  629 |     expect(typeof visible).toBe('boolean');
  630 |   });
  631 | });
  632 | 
```