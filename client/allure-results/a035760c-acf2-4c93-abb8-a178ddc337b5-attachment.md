# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dark-mode-ui.spec.js >> Dark Mode — Theme Toggle >> TC-DM-UI-007: Theme persists after page reload (dark)
- Location: tests/e2e/specs/dark-mode-ui.spec.js:125:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
TimeoutError: page.reload: Timeout 30000ms exceeded.
Call log:
  - waiting for navigation until "load"
    - navigated to "https://localhost:5174/home"

```

# Test source

```ts
  28  | import {
  29  |   applyTheme,
  30  |   applyDarkMode,
  31  |   applyLightMode,
  32  |   verifyDarkModeActive,
  33  |   verifyLightModeActive,
  34  |   verifyTextReadable,
  35  |   verifyNoThemeConsoleErrors,
  36  |   getThemeModes,
  37  |   themeSuffix,
  38  | } from '../utils/dark-mode-helpers.js';
  39  | 
  40  | const MODES = getThemeModes().length > 0 ? getThemeModes() : ['light', 'dark'];
  41  | 
  42  | const PAGES = [
  43  |   { name: 'Home', path: '/home', roles: ['superAdmin'] },
  44  |   { name: 'Dashboard', path: '/dashboard', roles: ['superAdmin'] },
  45  |   { name: 'Analytics', path: '/analytics', roles: ['superAdmin'] },
  46  |   { name: 'Summary Dashboard', path: '/summary-dashboard', roles: ['superAdmin'] },
  47  |   { name: 'Advanced Analytics', path: '/advanced-analytics', roles: ['superAdmin'] },
  48  |   { name: 'Student Dashboard', path: '/student-dashboard', roles: ['superAdmin'] },
  49  |   { name: 'Scheduling', path: '/scheduling-calendar', roles: ['superAdmin'] },
  50  |   { name: 'Scheduling Availability', path: '/scheduling-calendar?tab=availability', roles: ['superAdmin'] },
  51  |   { name: 'Attendance / QR Scanner', path: '/qr-scanner', roles: ['superAdmin'] },
  52  |   { name: 'Marks', path: '/marks', roles: ['superAdmin'] },
  53  |   { name: 'Classes', path: '/classes', roles: ['superAdmin'] },
  54  |   { name: 'Enrollments', path: '/enrollments', roles: ['superAdmin'] },
  55  |   { name: 'Manage Enrollments', path: '/manage-enrollments', roles: ['superAdmin'] },
  56  |   { name: 'Quizzes', path: '/quizzes', roles: ['superAdmin'] },
  57  |   { name: 'Quiz Builder', path: '/quiz-builder', roles: ['superAdmin'] },
  58  |   { name: 'Activities', path: '/activities', roles: ['superAdmin'] },
  59  |   { name: 'Announcements', path: '/announcements', roles: ['superAdmin'] },
  60  |   { name: 'Resources', path: '/resources', roles: ['superAdmin'] },
  61  |   { name: 'Drive', path: '/drive', roles: ['superAdmin'] },
  62  |   { name: 'Penalties', path: '/penalties', roles: ['superAdmin'] },
  63  |   { name: 'Notifications', path: '/notifications', roles: ['superAdmin'] },
  64  |   { name: 'Profile Settings', path: '/profile-settings', roles: ['superAdmin'] },
  65  |   { name: 'Users', path: '/users', roles: ['superAdmin'] },
  66  |   { name: 'Programs', path: '/programs', roles: ['superAdmin'] },
  67  |   { name: 'Subjects', path: '/subjects', roles: ['superAdmin'] },
  68  |   { name: 'Workflow', path: '/workflow', roles: ['superAdmin'] },
  69  |   { name: 'Chat', path: '/chat', roles: ['superAdmin'] },
  70  | ];
  71  | 
  72  | // ═══════════════════════════════════════════════════════════════════════════════
  73  | // SECTION 1: Theme Toggle Functionality (TC-DM-UI-001 — TC-DM-UI-010)
  74  | // ═══════════════════════════════════════════════════════════════════════════════
  75  | test.describe('Dark Mode — Theme Toggle', () => {
  76  |   test('TC-DM-UI-001: Theme toggle button is visible', async ({ page }) => {
  77  |     await gotoWithAuth(page, '/home', 'superAdmin');
  78  |     const themeBtn = page.locator(
  79  |       'button:has-text("Dark"), button:has-text("Light"), ' +
  80  |       'button:has-text("🌙"), button:has-text("☀️"), ' +
  81  |       '[data-testid*="theme-toggle"], [aria-label*="theme" i]'
  82  |     ).first();
  83  |     const visible = await themeBtn.isVisible({ timeout: 5000 }).catch(() => false);
  84  |     if (!visible) test.skip(true, 'No theme toggle button found');
  85  |     expect(visible).toBe(true);
  86  |   });
  87  | 
  88  |   test('TC-DM-UI-002: Clicking theme toggle switches to dark mode', async ({ page }) => {
  89  |     await gotoWithAuth(page, '/home', 'superAdmin');
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
> 128 |     await page.reload();
      |                ^ TimeoutError: page.reload: Timeout 30000ms exceeded.
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
  190 |       expect(theme).toBe(mode);
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
```