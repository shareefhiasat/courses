# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Authentication — Login Flow >> TC-AUTH-009: Login page has submit button
- Location: tests/e2e/specs/auth.spec.js:126:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://localhost:5174/dashboard", waiting until "load"

```

# Test source

```ts
  27  | const UNAUTHORIZED_ROUTE = '/unauthorized';
  28  | const DASHBOARD_ROUTE = '/dashboard';
  29  | const HOME_ROUTE = '/';
  30  | 
  31  | // ═══════════════════════════════════════════════════════════════════════════════
  32  | // SECTION 1: Login Flow (TC-AUTH-001 — TC-AUTH-010)
  33  | // ═══════════════════════════════════════════════════════════════════════════════
  34  | test.describe('Authentication — Login Flow', () => {
  35  |   test('TC-AUTH-001: Unauthenticated access redirects to Keycloak login', async ({ page }) => {
  36  |     await page.goto(`${BASE_URL}${DASHBOARD_ROUTE}`);
  37  |     await page.waitForLoadState('networkidle');
  38  |     const url = page.url();
  39  |     // Should redirect to Keycloak or login page
  40  |     expect(url.includes('keycloak') || url.includes('8080') || url.includes('login')).toBe(true);
  41  |   });
  42  | 
  43  |   test('TC-AUTH-002: Keycloak login page has username and password fields', async ({ page }) => {
  44  |     await page.goto(`${BASE_URL}${DASHBOARD_ROUTE}`);
  45  |     await page.waitForLoadState('networkidle');
  46  |     const url = page.url();
  47  |     if (!url.includes('keycloak') && !url.includes('8080')) {
  48  |       // SPA handles auth internally — not redirected to Keycloak, pass
  49  |       expect(true).toBe(true);
  50  |       return;
  51  |     }
  52  |     const username = page.locator('input[name="username"], input[type="email"]').first();
  53  |     const password = page.locator('input[name="password"], input[type="password"]').first();
  54  |     await expect(username).toBeVisible({ timeout: 10000 });
  55  |     await expect(password).toBeVisible({ timeout: 5000 });
  56  |   });
  57  | 
  58  |   test('TC-AUTH-003: Login with invalid credentials shows error', async ({ page }) => {
  59  |     await page.goto(`${BASE_URL}${DASHBOARD_ROUTE}`);
  60  |     await page.waitForLoadState('networkidle');
  61  |     const url = page.url();
  62  |     if (!url.includes('keycloak') && !url.includes('8080')) {
  63  |       // SPA handles auth internally — not redirected to Keycloak, pass
  64  |       expect(true).toBe(true);
  65  |       return;
  66  |     }
  67  |     const username = page.locator('input[name="username"], input[type="email"]').first();
  68  |     const password = page.locator('input[name="password"], input[type="password"]').first();
  69  |     const submit = page.locator('button[type="submit"], input[type="submit"]').first();
  70  |     await username.fill('invalid_user@test.com');
  71  |     await password.fill('wrongpassword123');
  72  |     await submit.click();
  73  |     await page.waitForTimeout(2000);
  74  |     // Should show error message or stay on login
  75  |     const errorVisible = await page.locator('.alert-error, .error, [class*="error"], text=/invalid/i').first().isVisible({ timeout: 5000 }).catch(() => false);
  76  |     const stillOnKeycloak = page.url().includes('keycloak') || page.url().includes('8080');
  77  |     expect(errorVisible || stillOnKeycloak).toBe(true);
  78  |   });
  79  | 
  80  |   test('TC-AUTH-004: Successful login with superAdmin credentials', async ({ page }) => {
  81  |     await gotoWithAuth(page, DASHBOARD_ROUTE, 'superAdmin');
  82  |     const url = page.url();
  83  |     expect(url).not.toContain('/login');
  84  |     expect(url).not.toContain('keycloak');
  85  |     expect(url).not.toContain('8080');
  86  |   });
  87  | 
  88  |   test('TC-AUTH-005: Successful login with admin credentials', async ({ page }) => {
  89  |     await gotoWithAuth(page, DASHBOARD_ROUTE, 'admin');
  90  |     const url = page.url();
  91  |     expect(url).not.toContain('/login');
  92  |     expect(url).not.toContain('keycloak');
  93  |   });
  94  | 
  95  |   test('TC-AUTH-006: Successful login with instructor credentials', async ({ page }) => {
  96  |     await gotoWithAuth(page, DASHBOARD_ROUTE, 'instructor');
  97  |     const url = page.url();
  98  |     expect(url).not.toContain('/login');
  99  |     expect(url).not.toContain('keycloak');
  100 |   });
  101 | 
  102 |   test('TC-AUTH-007: Successful login with student credentials', async ({ page }) => {
  103 |     await gotoWithAuth(page, HOME_ROUTE, 'student');
  104 |     const url = page.url();
  105 |     expect(url).not.toContain('/login');
  106 |     expect(url).not.toContain('keycloak');
  107 |   });
  108 | 
  109 |   test('TC-AUTH-008: Empty username field shows validation', async ({ page }) => {
  110 |     await page.goto(`${BASE_URL}${DASHBOARD_ROUTE}`);
  111 |     await page.waitForLoadState('networkidle');
  112 |     const url = page.url();
  113 |     if (!url.includes('keycloak') && !url.includes('8080')) {
  114 |       // SPA handles auth internally — not redirected to Keycloak, pass
  115 |       expect(true).toBe(true);
  116 |       return;
  117 |     }
  118 |     const submit = page.locator('button[type="submit"], input[type="submit"]').first();
  119 |     await submit.click();
  120 |     await page.waitForTimeout(1000);
  121 |     // Should stay on Keycloak or show validation
  122 |     const stillOnKeycloak = page.url().includes('keycloak') || page.url().includes('8080');
  123 |     expect(stillOnKeycloak).toBe(true);
  124 |   });
  125 | 
  126 |   test('TC-AUTH-009: Login page has submit button', async ({ page }) => {
> 127 |     await page.goto(`${BASE_URL}${DASHBOARD_ROUTE}`);
      |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  128 |     await page.waitForLoadState('networkidle');
  129 |     const url = page.url();
  130 |     if (!url.includes('keycloak') && !url.includes('8080')) {
  131 |       // SPA handles auth internally — not redirected to Keycloak, pass
  132 |       expect(true).toBe(true);
  133 |       return;
  134 |     }
  135 |     const submit = page.locator('button[type="submit"], input[type="submit"]').first();
  136 |     await expect(submit).toBeVisible({ timeout: 10000 });
  137 |   });
  138 | 
  139 |   test('TC-AUTH-010: Login page has remember me option (if configured)', async ({ page }) => {
  140 |     await page.goto(`${BASE_URL}${DASHBOARD_ROUTE}`);
  141 |     await page.waitForLoadState('networkidle');
  142 |     const url = page.url();
  143 |     // If not redirected to Keycloak, SPA handles auth — pass anyway
  144 |     if (!url.includes('keycloak') && !url.includes('8080')) {
  145 |       expect(true).toBe(true); // SPA auth — remember me not applicable
  146 |       return;
  147 |     }
  148 |     const rememberMe = page.locator('input[name="rememberMe"], #rememberMe, [data-testid*="remember"]').first();
  149 |     const visible = await rememberMe.isVisible({ timeout: 3000 }).catch(() => false);
  150 |     // Remember me is optional in Keycloak — pass either way
  151 |     expect(typeof visible).toBe('boolean');
  152 |   });
  153 | });
  154 | 
  155 | // ═══════════════════════════════════════════════════════════════════════════════
  156 | // SECTION 2: Logout Flow (TC-AUTH-011 — TC-AUTH-018)
  157 | // ═══════════════════════════════════════════════════════════════════════════════
  158 | test.describe('Authentication — Logout Flow', () => {
  159 |   test('TC-AUTH-011: Logout button visible when logged in', async ({ page }) => {
  160 |     await gotoWithAuth(page, HOME_ROUTE, 'superAdmin');
  161 |     await dismissOverlays(page);
  162 |     const logoutBtn = page.locator(
  163 |       'button:has-text("Logout"), button:has-text("Sign Out"), ' +
  164 |       'a:has-text("Logout"), a:has-text("Sign Out"), ' +
  165 |       '[data-testid*="logout"], [aria-label*="logout" i], button:has-text("خروج")'
  166 |     ).first();
  167 |     await expect(logoutBtn).toBeVisible({ timeout: 10000 });
  168 |   });
  169 | 
  170 |   test('TC-AUTH-012: Click logout redirects to login or Keycloak', async ({ page }) => {
  171 |     await gotoWithAuth(page, HOME_ROUTE, 'superAdmin');
  172 |     await dismissOverlays(page);
  173 |     const logoutBtn = page.locator(
  174 |       'button:has-text("Logout"), button:has-text("Sign Out"), ' +
  175 |       'a:has-text("Logout"), a:has-text("Sign Out"), ' +
  176 |       '[data-testid*="logout"]'
  177 |     ).first();
  178 |     await expect(logoutBtn).toBeVisible({ timeout: 10000 });
  179 |     await logoutBtn.click();
  180 |     await page.waitForTimeout(3000);
  181 |     const url = page.url();
  182 |     expect(url.includes('login') || url.includes('keycloak') || url.includes('8080')).toBe(true);
  183 |   });
  184 | 
  185 |   test('TC-AUTH-013: Session cleared after logout — cannot access protected routes', async ({ page }) => {
  186 |     await gotoWithAuth(page, HOME_ROUTE, 'superAdmin');
  187 |     await dismissOverlays(page);
  188 |     await logout(page);
  189 |     await page.waitForTimeout(2000);
  190 |     // Try to access protected route
  191 |     await page.goto(`${BASE_URL}${DASHBOARD_ROUTE}`);
  192 |     await page.waitForLoadState('networkidle');
  193 |     // With Keycloak SSO, the browser may silently re-authenticate.
  194 |     // Valid outcomes: redirected to login/keycloak, OR SSO re-auth happens (new token).
  195 |     // In both cases, the app should either show login or render the page with a valid session.
  196 |     const url = page.url();
  197 |     const redirectedToLogin = url.includes('login') || url.includes('keycloak') || url.includes('8080');
  198 |     const appRendered = url.includes('localhost:5174');
  199 |     expect(redirectedToLogin || appRendered).toBe(true);
  200 |   });
  201 | 
  202 |   test('TC-AUTH-014: Logout clears localStorage token', async ({ page }) => {
  203 |     await gotoWithAuth(page, HOME_ROUTE, 'superAdmin');
  204 |     // Verify token exists
  205 |     const tokenBefore = await page.evaluate(() => localStorage.getItem('keycloak_token'));
  206 |     // Token may be stored under different key depending on Keycloak adapter
  207 |     if (!tokenBefore) {
  208 |       const altToken = await page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('kc_token'));
  209 |       if (!altToken) {
  210 |         expect(true).toBe(true); // No token found — adapter may use cookies only
  211 |         return;
  212 |       }
  213 |     }
  214 |     await dismissOverlays(page);
  215 |     await logout(page);
  216 |     await page.waitForTimeout(2000);
  217 |     const tokenAfter = await page.evaluate(() => localStorage.getItem('keycloak_token'));
  218 |     expect(tokenAfter).toBeNull();
  219 |   });
  220 | 
  221 |   test('TC-AUTH-015: Logout from student role', async ({ page }) => {
  222 |     await gotoWithAuth(page, HOME_ROUTE, 'student');
  223 |     await dismissOverlays(page);
  224 |     const logoutBtn = page.locator(
  225 |       'button:has-text("Logout"), button:has-text("Sign Out"), ' +
  226 |       '[data-testid*="logout"]'
  227 |     ).first();
```