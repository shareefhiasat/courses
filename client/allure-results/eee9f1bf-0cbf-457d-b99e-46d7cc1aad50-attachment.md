# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: global-ui.spec.js >> Global UI — Unauthenticated >> TC-GLB-UI-030: Redirect to Keycloak login
- Location: tests/e2e/specs/global-ui.spec.js:288:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://localhost:5174/", waiting until "load"

```

# Test source

```ts
  189 |     const langBtn = page.locator('button:has-text("العربية"), button:has-text("Switch to Arabic"), [data-testid*="language"]').first();
  190 |     const visible = await langBtn.isVisible({ timeout: 3000 }).catch(() => false);
  191 |     if (!visible) test.skip(true, 'No language toggle');
  192 |   });
  193 | 
  194 |   test('TC-GLB-UI-020: Theme toggle visible', async ({ page }) => {
  195 |     const themeBtn = page.locator('button:has-text("Dark"), button:has-text("Light"), [data-testid*="theme"], [aria-label*="theme" i]').first();
  196 |     const visible = await themeBtn.isVisible({ timeout: 3000 }).catch(() => false);
  197 |     if (!visible) test.skip(true, 'No theme toggle');
  198 |   });
  199 | 
  200 |   test('TC-GLB-UI-021: User avatar/profile button visible', async ({ page }) => {
  201 |     const avatar = page.locator('[data-testid*="avatar"], .avatar, .user-avatar, img[alt*="avatar" i], button:has-text("shareef")').first();
  202 |     const visible = await avatar.isVisible({ timeout: 3000 }).catch(() => false);
  203 |     if (!visible) test.skip(true, 'No avatar');
  204 |   });
  205 | 
  206 |   test('TC-GLB-UI-022: Logout button visible', async ({ page }) => {
  207 |     const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [data-testid*="logout"]').first();
  208 |     const visible = await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false);
  209 |     if (!visible) test.skip(true, 'No logout button');
  210 |   });
  211 | });
  212 | 
  213 | test.describe('Global UI — Pin/Open in New Tab & Navigation (Deep)', () => {
  214 |   test.beforeEach(async ({ page }) => {
  215 |     await gotoWithAuth(page, '/', 'superAdmin');
  216 |     await dismissOverlays(page);
  217 |   });
  218 | 
  219 |   test('TC-GLB-UI-023: Open in new tab button for Home', async ({ page }) => {
  220 |     const openNewTabBtn = page.locator('button:has-text("Open in new tab"), [aria-label*="Open in new tab"]').first();
  221 |     const visible = await openNewTabBtn.isVisible({ timeout: 3000 }).catch(() => false);
  222 |     if (!visible) test.skip(true, 'No open in new tab button');
  223 |   });
  224 | 
  225 |   test('TC-GLB-UI-024: Pin button for Home', async ({ page }) => {
  226 |     const pinBtn = page.locator('button:has-text("pin"), [aria-label*="pin"]').first();
  227 |     const visible = await pinBtn.isVisible({ timeout: 3000 }).catch(() => false);
  228 |     if (!visible) test.skip(true, 'No pin button');
  229 |   });
  230 | 
  231 |   test('TC-GLB-UI-025: Click sidebar link navigates to page', async ({ page }) => {
  232 |     const dashboardLink = page.locator('a[href="/dashboard"]').first();
  233 |     if (!(await dashboardLink.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No dashboard link');
  234 |     await dashboardLink.click();
  235 |     await page.waitForTimeout(2000);
  236 |     const hasContent = await waitForContent(page);
  237 |     expect(hasContent).toBe(true);
  238 |   });
  239 | });
  240 | 
  241 | test.describe('Global UI — Role-Based Access (Deep)', () => {
  242 |   test('TC-GLB-UI-026: Student sees limited sidebar', async ({ page }) => {
  243 |     await gotoWithAuth(page, '/', 'student');
  244 |     const nav = page.locator('nav, [role="navigation"]').first();
  245 |     const visible = await nav.isVisible({ timeout: 5000 }).catch(() => false);
  246 |     expect(visible).toBe(true);
  247 |   });
  248 | 
  249 |   test('TC-GLB-UI-027: Student does not see Admin tools', async ({ page }) => {
  250 |     await gotoWithAuth(page, '/', 'student');
  251 |     await dismissOverlays(page);
  252 |     const adminTools = page.locator('button:has-text("Workspace Settings")').first();
  253 |     const visible = await adminTools.isVisible({ timeout: 3000 }).catch(() => false);
  254 |     if (visible) console.warn('BUG: Student can see Workspace Settings');
  255 |   });
  256 | 
  257 |   test('TC-GLB-UI-028: Instructor sees sidebar navigation', async ({ page }) => {
  258 |     await gotoWithAuth(page, '/', 'instructor');
  259 |     const nav = page.locator('nav, [role="navigation"]').first();
  260 |     const visible = await nav.isVisible({ timeout: 5000 }).catch(() => false);
  261 |     expect(visible).toBe(true);
  262 |   });
  263 | });
  264 | 
  265 | test.describe('Global UI — User Story', () => {
  266 |   test('TC-GLB-UI-029: User story — admin navigates via sidebar to dashboard', async ({ page }) => {
  267 |     await gotoWithAuth(page, '/', 'superAdmin');
  268 |     await dismissOverlays(page);
  269 | 
  270 |     const mainSection = page.locator('button:has-text("Main")').first();
  271 |     if (await mainSection.isVisible({ timeout: 3000 }).catch(() => false)) {
  272 |       await mainSection.click();
  273 |       await page.waitForTimeout(500);
  274 |     }
  275 | 
  276 |     const dashboardLink = page.locator('a[href="/dashboard"]').first();
  277 |     if (await dashboardLink.isVisible({ timeout: 3000 }).catch(() => false)) {
  278 |       await dashboardLink.click();
  279 |       await page.waitForTimeout(2000);
  280 |     }
  281 | 
  282 |     const hasContent = await waitForContent(page);
  283 |     expect(hasContent).toBe(true);
  284 |   });
  285 | });
  286 | 
  287 | test.describe('Global UI — Unauthenticated', () => {
  288 |   test('TC-GLB-UI-030: Redirect to Keycloak login', async ({ page }) => {
> 289 |     await page.goto(`${testConfig.baseUrl}/`);
      |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  290 |     await page.waitForLoadState('networkidle');
  291 |     const url = page.url();
  292 |     expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  293 |   });
  294 | });
  295 | 
```