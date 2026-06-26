# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dark-mode-ui.spec.js >> TC-DM-UI-017: Scheduling renders correctly [Light Mode]
- Location: tests/e2e/specs/dark-mode-ui.spec.js:183:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "light"
Received: null
```

# Test source

```ts
  90  |     await applyLightMode(page);
  91  |     await applyDarkMode(page);
  92  |     const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  93  |     expect(theme).toBe('dark');
  94  |   });
  95  | 
  96  |   test('TC-DM-UI-003: Dark mode adds dark-mode class to body', async ({ page }) => {
  97  |     await gotoWithAuth(page, '/home', 'superAdmin');
  98  |     await applyDarkMode(page);
  99  |     const hasClass = await page.evaluate(() => document.body.classList.contains('dark-mode'));
  100 |     expect(hasClass).toBe(true);
  101 |   });
  102 | 
  103 |   test('TC-DM-UI-004: Toggling back to light mode removes dark-mode class', async ({ page }) => {
  104 |     await gotoWithAuth(page, '/home', 'superAdmin');
  105 |     await applyDarkMode(page);
  106 |     await applyLightMode(page);
  107 |     const hasClass = await page.evaluate(() => document.body.classList.contains('dark-mode'));
  108 |     expect(hasClass).toBe(false);
  109 |   });
  110 | 
  111 |   test('TC-DM-UI-005: Theme persists in localStorage', async ({ page }) => {
  112 |     await gotoWithAuth(page, '/home', 'superAdmin');
  113 |     await applyDarkMode(page);
  114 |     const stored = await page.evaluate(() => localStorage.getItem('app_theme'));
  115 |     expect(stored).toBe('dark');
  116 |   });
  117 | 
  118 |   test('TC-DM-UI-006: Light mode persists in localStorage', async ({ page }) => {
  119 |     await gotoWithAuth(page, '/home', 'superAdmin');
  120 |     await applyLightMode(page);
  121 |     const stored = await page.evaluate(() => localStorage.getItem('app_theme'));
  122 |     expect(stored).toBe('light');
  123 |   });
  124 | 
  125 |   test('TC-DM-UI-007: Theme persists after page reload (dark)', async ({ page }) => {
  126 |     await gotoWithAuth(page, '/home', 'superAdmin');
  127 |     await applyDarkMode(page);
  128 |     await page.reload();
  129 |     await page.waitForLoadState('networkidle');
  130 |     await page.waitForTimeout(1000);
  131 |     const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  132 |     expect(theme).toBe('dark');
  133 |   });
  134 | 
  135 |   test('TC-DM-UI-008: Theme persists after navigation (dark)', async ({ page }) => {
  136 |     await gotoWithAuth(page, '/home', 'superAdmin');
  137 |     await applyDarkMode(page);
  138 |     await gotoWithAuth(page, '/analytics', 'superAdmin');
  139 |     const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  140 |     expect(theme).toBe('dark');
  141 |   });
  142 | 
  143 |   test('TC-DM-UI-009: No console errors when toggling theme', async ({ page }) => {
  144 |     await gotoWithAuth(page, '/home', 'superAdmin');
  145 |     const errors = [];
  146 |     page.on('console', (msg) => {
  147 |       if (msg.type() === 'error') errors.push(msg.text());
  148 |     });
  149 |     await applyDarkMode(page);
  150 |     await applyLightMode(page);
  151 |     await page.waitForTimeout(500);
  152 |     const themeErrors = errors.filter(e => /theme|css|style/i.test(e));
  153 |     expect(themeErrors.length).toBe(0);
  154 |   });
  155 | 
  156 |   test('TC-DM-UI-010: Theme toggle button has accessible label', async ({ page }) => {
  157 |     await gotoWithAuth(page, '/home', 'superAdmin');
  158 |     const themeBtn = page.locator(
  159 |       '[data-testid*="theme-toggle"], [aria-label*="theme" i], ' +
  160 |       'button:has-text("Dark"), button:has-text("Light"), ' +
  161 |       'button:has-text("🌙"), button:has-text("☀️")'
  162 |     ).first();
  163 |     const visible = await themeBtn.isVisible({ timeout: 5000 }).catch(() => false);
  164 |     if (!visible) test.skip(true, 'No theme toggle button');
  165 |     const ariaLabel = await themeBtn.getAttribute('aria-label');
  166 |     const title = await themeBtn.getAttribute('title');
  167 |     const text = await themeBtn.textContent();
  168 |     const hasLabel = ariaLabel || title || (text && text.trim().length > 0);
  169 |     expect(hasLabel).toBeTruthy();
  170 |   });
  171 | });
  172 | 
  173 | // ═══════════════════════════════════════════════════════════════════════════════
  174 | // SECTION 2: Page Rendering in Dark Mode (TC-DM-UI-011 — TC-DM-UI-040)
  175 | // ═══════════════════════════════════════════════════════════════════════════════
  176 | let tcCounter = 11;
  177 | 
  178 | for (const pageConfig of PAGES) {
  179 |   for (const mode of MODES) {
  180 |     const tcId = `TC-DM-UI-${String(tcCounter).padStart(3, '0')}`;
  181 |     tcCounter++;
  182 | 
  183 |     test(`${tcId}: ${pageConfig.name} renders correctly${themeSuffix(mode)}`, async ({ page }) => {
  184 |       await gotoWithAuth(page, pageConfig.path, pageConfig.roles[0]);
  185 |       await applyTheme(page, mode);
  186 |       await page.waitForTimeout(500);
  187 | 
  188 |       // Verify data-theme attribute
  189 |       const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
> 190 |       expect(theme).toBe(mode);
      |                     ^ Error: expect(received).toBe(expected) // Object.is equality
  191 | 
  192 |       // Verify main content is visible
  193 |       const mainVisible = await page.locator('main, [role="main"], .main-content, .card, h1, h2, h3').first()
  194 |         .isVisible({ timeout: 5000 }).catch(() => false);
  195 |       expect(mainVisible).toBe(true);
  196 | 
  197 |       // Verify no error overlays
  198 |       const errorOverlay = page.locator('[class*="error-boundary"], text=/Something went wrong/i');
  199 |       const hasError = await errorOverlay.first().isVisible({ timeout: 1000 }).catch(() => false);
  200 |       expect(hasError).toBe(false);
  201 |     });
  202 |   }
  203 | }
  204 | 
  205 | // ═══════════════════════════════════════════════════════════════════════════════
  206 | // SECTION 3: Text Readability & Contrast (TC-DM-UI-041 — TC-DM-UI-055)
  207 | // ═══════════════════════════════════════════════════════════════════════════════
  208 | test.describe('Dark Mode — Text Readability', () => {
  209 |   const readabilityPages = [
  210 |     { name: 'Home', path: '/home' },
  211 |     { name: 'Dashboard', path: '/dashboard' },
  212 |     { name: 'Analytics', path: '/analytics' },
  213 |     { name: 'Marks', path: '/marks' },
  214 |     { name: 'Classes', path: '/classes' },
  215 |     { name: 'Quizzes', path: '/quizzes' },
  216 |     { name: 'Notifications', path: '/notifications' },
  217 |     { name: 'Profile Settings', path: '/profile-settings' },
  218 |   ];
  219 | 
  220 |   for (const p of readabilityPages) {
  221 |     for (const mode of MODES) {
  222 |       test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: ${p.name} text readable${themeSuffix(mode)}`, async ({ page }) => {
  223 |         tcCounter++;
  224 |         await gotoWithAuth(page, p.path, 'superAdmin');
  225 |         await applyTheme(page, mode);
  226 |         await page.waitForTimeout(500);
  227 | 
  228 |         // Check heading text readability
  229 |         const heading = page.locator('h1, h2, h3').first();
  230 |         if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
  231 |           const readable = await verifyTextReadable(page, 'h1, h2, h3');
  232 |           // Log but don't fail — contrast detection is approximate
  233 |           if (!readable) console.log(`Contrast warning on ${p.name} ${mode} heading`);
  234 |         }
  235 | 
  236 |         // Check body text readability
  237 |         const body = page.locator('p, span, td, label').first();
  238 |         if (await body.isVisible({ timeout: 2000 }).catch(() => false)) {
  239 |           const readable = await verifyTextReadable(page, 'p, span, td, label');
  240 |           if (!readable) console.log(`Contrast warning on ${p.name} ${mode} body text`);
  241 |         }
  242 | 
  243 |         // Verify page didn't crash
  244 |         const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  245 |         expect(theme).toBe(mode);
  246 |       });
  247 |     }
  248 |   }
  249 | });
  250 | 
  251 | // ═══════════════════════════════════════════════════════════════════════════════
  252 | // SECTION 4: UI Components in Dark Mode (TC-DM-UI-056 — TC-DM-UI-070)
  253 | // ═══════════════════════════════════════════════════════════════════════════════
  254 | test.describe('Dark Mode — UI Components', () => {
  255 |   for (const mode of MODES) {
  256 |     test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Cards render with correct background${themeSuffix(mode)}`, async ({ page }) => {
  257 |       tcCounter++;
  258 |       await gotoWithAuth(page, '/dashboard', 'superAdmin');
  259 |       await applyTheme(page, mode);
  260 |       const card = page.locator('.card, [class*="card"]').first();
  261 |       if (!(await card.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No card found');
  262 |       const bg = await card.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  263 |       expect(bg).toBeTruthy();
  264 |     });
  265 | 
  266 |     test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Table headers visible${themeSuffix(mode)}`, async ({ page }) => {
  267 |       tcCounter++;
  268 |       await gotoWithAuth(page, '/marks', 'superAdmin');
  269 |       await applyTheme(page, mode);
  270 |       const th = page.locator('th, [role="columnheader"]').first();
  271 |       if (!(await th.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No table headers');
  272 |       const readable = await verifyTextReadable(page, 'th, [role="columnheader"]');
  273 |       if (!readable) console.log(`Table header contrast warning in ${mode} mode`);
  274 |     });
  275 | 
  276 |     test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Buttons visible and styled${themeSuffix(mode)}`, async ({ page }) => {
  277 |       tcCounter++;
  278 |       await gotoWithAuth(page, '/home', 'superAdmin');
  279 |       await applyTheme(page, mode);
  280 |       const btn = page.locator('button').first();
  281 |       const visible = await btn.isVisible({ timeout: 3000 }).catch(() => false);
  282 |       if (!visible) test.skip(true, 'No buttons');
  283 |       const { background, color } = await btn.evaluate((el) => {
  284 |         const s = window.getComputedStyle(el);
  285 |         return { background: s.backgroundColor, color: s.color };
  286 |       });
  287 |       expect(background).toBeTruthy();
  288 |       expect(color).toBeTruthy();
  289 |     });
  290 | 
```