# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: notifications-ui.spec.js >> Notifications UI — Unauthenticated >> TC-NOT-UI-029: Redirect to login when accessing notifications page
- Location: tests/e2e/specs/notifications-ui.spec.js:281:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://localhost:5174/notifications", waiting until "load"

```

# Test source

```ts
  182 |     expect(hasContent).toBe(true);
  183 |   });
  184 | 
  185 |   test('TC-NOT-UI-019: Delete notification button visible', async ({ page }) => {
  186 |     const delBtn = page.locator('button:has-text("Delete"), [data-testid*="delete"], [aria-label*="delete" i]').first();
  187 |     const visible = await delBtn.isVisible({ timeout: 3000 }).catch(() => false);
  188 |     if (!visible) test.skip(true, 'No delete button');
  189 |   });
  190 | 
  191 |   test('TC-NOT-UI-020: Notification item has unread indicator', async ({ page }) => {
  192 |     const unreadIndicator = page.locator('.unread, [data-testid*="unread"], .badge, .dot').first();
  193 |     const visible = await unreadIndicator.isVisible({ timeout: 2000 }).catch(() => false);
  194 |     if (!visible) test.skip(true, 'No unread indicators');
  195 |   });
  196 | });
  197 | 
  198 | test.describe('Notifications UI — Profile Preferences (Deep)', () => {
  199 |   test.beforeEach(async ({ page }) => {
  200 |     await gotoWithAuth(page, PROFILE_ROUTE, 'superAdmin');
  201 |     await dismissOverlays(page);
  202 |   });
  203 | 
  204 |   test('TC-NOT-UI-021: Notification preferences section on profile', async ({ page }) => {
  205 |     const notifSection = page.locator('h2:has-text("Notifications")').first();
  206 |     const visible = await notifSection.isVisible({ timeout: 5000 }).catch(() => false);
  207 |     expect(visible).toBe(true);
  208 |   });
  209 | 
  210 |   test('TC-NOT-UI-022: Save Changes button on profile', async ({ page }) => {
  211 |     const saveBtn = page.locator('button:has-text("Save Changes")').first();
  212 |     const visible = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);
  213 |     expect(visible).toBe(true);
  214 |   });
  215 | 
  216 |   test('TC-NOT-UI-023: Toggle notification preference', async ({ page }) => {
  217 |     const toggle = page.locator('[role="switch"], .toggle, .switch, input[type="checkbox"]').first();
  218 |     const visible = await toggle.isVisible({ timeout: 3000 }).catch(() => false);
  219 |     if (!visible) test.skip(true, 'No toggle found');
  220 |     await toggle.click();
  221 |     await page.waitForTimeout(500);
  222 |     expect(true).toBe(true);
  223 |   });
  224 | 
  225 |   test('TC-NOT-UI-024: Save preferences', async ({ page }) => {
  226 |     const saveBtn = page.locator('button:has-text("Save Changes")').first();
  227 |     if (!(await saveBtn.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No save button');
  228 |     await saveBtn.click();
  229 |     await page.waitForTimeout(2000);
  230 |     const hasContent = await waitForContent(page);
  231 |     expect(hasContent).toBe(true);
  232 |   });
  233 | });
  234 | 
  235 | test.describe('Notifications UI — Role-Based Access (Deep)', () => {
  236 |   test('TC-NOT-UI-025: Student can access notifications page', async ({ page }) => {
  237 |     await gotoWithAuth(page, ROUTE, 'student');
  238 |     const denied = await isAccessDenied(page);
  239 |     if (denied) test.skip(true, 'Student denied access');
  240 |     const hasContent = await waitForContent(page);
  241 |     expect(hasContent).toBe(true);
  242 |   });
  243 | 
  244 |   test('TC-NOT-UI-026: Student sees notification filters', async ({ page }) => {
  245 |     await gotoWithAuth(page, ROUTE, 'student');
  246 |     const denied = await isAccessDenied(page);
  247 |     if (denied) test.skip(true, 'Student denied access');
  248 |     await dismissOverlays(page);
  249 |     const allBtn = page.locator('button:has-text("All")').first();
  250 |     const visible = await allBtn.isVisible({ timeout: 3000 }).catch(() => false);
  251 |     if (!visible) test.skip(true, 'Student has no All filter');
  252 |     expect(visible).toBe(true);
  253 |   });
  254 | });
  255 | 
  256 | test.describe('Notifications UI — User Story', () => {
  257 |   test('TC-NOT-UI-027: User story — admin views and marks notification read', async ({ page }) => {
  258 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  259 |     await dismissOverlays(page);
  260 | 
  261 |     const item = page.locator('[cursor=pointer]').filter({ hasText: /message|notification|file/i }).first();
  262 |     if (!(await item.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No notification items');
  263 | 
  264 |     await item.click();
  265 |     await page.waitForTimeout(2000);
  266 | 
  267 |     const hasContent = await waitForContent(page);
  268 |     expect(hasContent).toBe(true);
  269 |   });
  270 | });
  271 | 
  272 | test.describe('Notifications UI — Unauthenticated', () => {
  273 |   test('TC-NOT-UI-028: No bell for unauthenticated', async ({ page }) => {
  274 |     await page.goto(`${testConfig.baseUrl}/`);
  275 |     await page.waitForLoadState('networkidle');
  276 |     const bell = page.locator('[data-testid*="notification"], [aria-label*="notification" i]');
  277 |     const count = await bell.count();
  278 |     expect(count).toBe(0);
  279 |   });
  280 | 
  281 |   test('TC-NOT-UI-029: Redirect to login when accessing notifications page', async ({ page }) => {
> 282 |     await page.goto(`${testConfig.baseUrl}/notifications`);
      |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  283 |     await page.waitForLoadState('networkidle');
  284 |     const url = page.url();
  285 |     expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  286 |   });
  287 | });
  288 | 
  289 | test.describe('Notifications UI — Edge Cases', () => {
  290 |   test('TC-NOT-UI-030: Empty state when no notifications match filter', async ({ page }) => {
  291 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  292 |     await dismissOverlays(page);
  293 |     const search = page.locator('input[placeholder="Search notifications..."]').first();
  294 |     if (!(await search.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No search input');
  295 |     await search.fill('zzz_absolutely_nothing_xyz');
  296 |     await page.waitForTimeout(2000);
  297 |     const emptyState = page.locator('text=/no.*notification/i, text=/no.*result/i, text=/empty/i').first();
  298 |     const hasEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
  299 |     expect(true).toBe(true);
  300 |   });
  301 | });
  302 | 
  303 | // ═══════════════════════════════════════════════════════════════════════════════
  304 | // SECTION 7: Notification Drawer & Mark Read/Unread (TC-NOT-UI-031 — TC-NOT-UI-050)
  305 | // ═══════════════════════════════════════════════════════════════════════════════
  306 | test.describe('Notifications UI — Drawer & Read/Unread', () => {
  307 |   test('TC-NOT-UI-031: Notification bell icon visible in header', async ({ page }) => {
  308 |     await gotoWithAuth(page, '/', 'superAdmin');
  309 |     const bell = page.locator('[aria-label*="notification" i], [data-testid*="notification-bell"], button:has(svg):has([class*="bell"]), [class*="bell"]').first();
  310 |     const visible = await bell.isVisible({ timeout: 5000 }).catch(() => false);
  311 |     if (!visible) test.skip(true, 'No notification bell icon');
  312 |   });
  313 | 
  314 |   test('TC-NOT-UI-032: Click bell opens notification drawer', async ({ page }) => {
  315 |     await gotoWithAuth(page, '/', 'superAdmin');
  316 |     const bell = page.locator('[aria-label*="notification" i], [data-testid*="notification-bell"], [class*="bell"]').first();
  317 |     if (!(await bell.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No bell icon');
  318 |     await bell.click();
  319 |     await page.waitForTimeout(500);
  320 |     const drawer = page.locator('[class*="drawer"], [class*="notification-panel"], [role="dialog"], [data-testid*="notification-drawer"]').first();
  321 |     const visible = await drawer.isVisible({ timeout: 5000 }).catch(() => false);
  322 |     if (!visible) test.skip(true, 'No notification drawer opened');
  323 |   });
  324 | 
  325 |   test('TC-NOT-UI-033: Notification drawer has close button', async ({ page }) => {
  326 |     await gotoWithAuth(page, '/', 'superAdmin');
  327 |     const bell = page.locator('[aria-label*="notification" i], [class*="bell"]').first();
  328 |     if (!(await bell.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No bell icon');
  329 |     await bell.click();
  330 |     await page.waitForTimeout(500);
  331 |     const closeBtn = page.locator('[class*="drawer"] button:has-text("Close"), [class*="drawer"] [aria-label*="close"], [data-testid*="close-drawer"]').first();
  332 |     const visible = await closeBtn.isVisible({ timeout: 5000 }).catch(() => false);
  333 |     if (!visible) test.skip(true, 'No close button in drawer');
  334 |   });
  335 | 
  336 |   test('TC-NOT-UI-034: Unread notification badge count visible', async ({ page }) => {
  337 |     await gotoWithAuth(page, '/', 'superAdmin');
  338 |     const badge = page.locator('[class*="badge"], [class*="count"], [data-testid*="notification-count"]').first();
  339 |     const visible = await badge.isVisible({ timeout: 5000 }).catch(() => false);
  340 |     if (!visible) test.skip(true, 'No notification badge');
  341 |   });
  342 | 
  343 |   test('TC-NOT-UI-035: Mark as read button per notification', async ({ page }) => {
  344 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  345 |     await dismissOverlays(page);
  346 |     const markReadBtn = page.locator(
  347 |       'button[aria-label*="mark.*read" i], button[title*="mark.*read" i], ' +
  348 |       'button:has-text("Mark as Read"), [data-testid*="mark-read"]'
  349 |     ).first();
  350 |     const visible = await markReadBtn.isVisible({ timeout: 5000 }).catch(() => false);
  351 |     if (!visible) test.skip(true, 'No mark as read button');
  352 |   });
  353 | 
  354 |   test('TC-NOT-UI-036: Mark all as read button visible', async ({ page }) => {
  355 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  356 |     await dismissOverlays(page);
  357 |     const markAllBtn = page.locator('button:has-text("Mark All"), button:has-text("Mark all as read"), [data-testid*="mark-all-read"]').first();
  358 |     const visible = await markAllBtn.isVisible({ timeout: 5000 }).catch(() => false);
  359 |     if (!visible) test.skip(true, 'No mark all as read button');
  360 |   });
  361 | 
  362 |   test('TC-NOT-UI-037: Click mark all as read triggers action', async ({ page }) => {
  363 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  364 |     await dismissOverlays(page);
  365 |     const markAllBtn = page.locator('button:has-text("Mark All"), button:has-text("Mark all as read")').first();
  366 |     if (!(await markAllBtn.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No mark all button');
  367 |     await markAllBtn.click();
  368 |     await page.waitForTimeout(1000);
  369 |     // Verify no error occurred
  370 |     expect(true).toBe(true);
  371 |   });
  372 | 
  373 |   test('TC-NOT-UI-038: Notification item shows timestamp', async ({ page }) => {
  374 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  375 |     await dismissOverlays(page);
  376 |     const timestamp = page.locator('text=/\\d+.*ago|\\d{4}-\\d{2}-\\d{2}|today|yesterday/i, [class*="time"], [class*="date"]').first();
  377 |     const visible = await timestamp.isVisible({ timeout: 5000 }).catch(() => false);
  378 |     if (!visible) test.skip(true, 'No timestamp on notifications');
  379 |   });
  380 | 
  381 |   test('TC-NOT-UI-039: Notification item shows title/message', async ({ page }) => {
  382 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
```