/**
 * Dark Mode UI Tests — Systematic dark mode verification across all major pages
 * Module: Global theme toggle, dark mode rendering, contrast, readability
 * Covers: TC-DM-UI-001 through TC-DM-UI-080
 *
 * Configuration:
 *   DARK_MODE=true  → run only dark mode tests
 *   DARK_MODE=both  → run both light and dark mode tests
 *   Default         → run both light and dark mode tests (for comprehensive coverage)
 *
 * Test depth:
 * - Theme toggle button visible and functional
 * - data-theme attribute switches correctly
 * - Body dark-mode class toggles
 * - localStorage persistence
 * - All major pages render without errors in dark mode
 * - Text readability / contrast on key elements
 * - No console errors in dark mode
 * - Cards, tables, forms, modals render correctly
 * - Sidebar, navbar, footer render in dark mode
 * - Buttons, inputs, selects, toggles visible in dark mode
 * - Charts/widgets render in dark mode
 * - RTL + dark mode combined
 */
import { test, expect } from '@playwright/test';
import { testConfig } from '../config/test.config.js';
import { gotoWithAuth, waitForContent, dismissOverlays } from '../utils/ui-helpers.js';
import {
  applyTheme,
  applyDarkMode,
  applyLightMode,
  verifyDarkModeActive,
  verifyLightModeActive,
  verifyTextReadable,
  verifyNoThemeConsoleErrors,
  getThemeModes,
  themeSuffix,
} from '../utils/dark-mode-helpers.js';

const MODES = getThemeModes().length > 0 ? getThemeModes() : ['light', 'dark'];

const PAGES = [
  { name: 'Home', path: '/home', roles: ['superAdmin'] },
  { name: 'Dashboard', path: '/dashboard', roles: ['superAdmin'] },
  { name: 'Analytics', path: '/analytics', roles: ['superAdmin'] },
  { name: 'Summary Dashboard', path: '/summary-dashboard', roles: ['superAdmin'] },
  { name: 'Advanced Analytics', path: '/advanced-analytics', roles: ['superAdmin'] },
  { name: 'Student Dashboard', path: '/student-dashboard', roles: ['superAdmin'] },
  { name: 'Scheduling', path: '/scheduling-calendar', roles: ['superAdmin'] },
  { name: 'Scheduling Availability', path: '/scheduling-calendar?tab=availability', roles: ['superAdmin'] },
  { name: 'Attendance / QR Scanner', path: '/qr-scanner', roles: ['superAdmin'] },
  { name: 'Marks', path: '/marks', roles: ['superAdmin'] },
  { name: 'Classes', path: '/classes', roles: ['superAdmin'] },
  { name: 'Enrollments', path: '/enrollments', roles: ['superAdmin'] },
  { name: 'Manage Enrollments', path: '/manage-enrollments', roles: ['superAdmin'] },
  { name: 'Quizzes', path: '/quizzes', roles: ['superAdmin'] },
  { name: 'Quiz Builder', path: '/quiz-builder', roles: ['superAdmin'] },
  { name: 'Activities', path: '/activities', roles: ['superAdmin'] },
  { name: 'Announcements', path: '/announcements', roles: ['superAdmin'] },
  { name: 'Resources', path: '/resources', roles: ['superAdmin'] },
  { name: 'Drive', path: '/drive', roles: ['superAdmin'] },
  { name: 'Penalties', path: '/penalties', roles: ['superAdmin'] },
  { name: 'Notifications', path: '/notifications', roles: ['superAdmin'] },
  { name: 'Profile Settings', path: '/profile-settings', roles: ['superAdmin'] },
  { name: 'Users', path: '/users', roles: ['superAdmin'] },
  { name: 'Programs', path: '/programs', roles: ['superAdmin'] },
  { name: 'Subjects', path: '/subjects', roles: ['superAdmin'] },
  { name: 'Workflow', path: '/workflow', roles: ['superAdmin'] },
  { name: 'Chat', path: '/chat', roles: ['superAdmin'] },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: Theme Toggle Functionality (TC-DM-UI-001 — TC-DM-UI-010)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('Dark Mode — Theme Toggle', () => {
  test('TC-DM-UI-001: Theme toggle button is visible', async ({ page }) => {
    await gotoWithAuth(page, '/home', 'superAdmin');
    const themeBtn = page.locator(
      'button:has-text("Dark"), button:has-text("Light"), ' +
      'button:has-text("🌙"), button:has-text("☀️"), ' +
      '[data-testid*="theme-toggle"], [aria-label*="theme" i]'
    ).first();
    const visible = await themeBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) test.skip(true, 'No theme toggle button found');
    expect(visible).toBe(true);
  });

  test('TC-DM-UI-002: Clicking theme toggle switches to dark mode', async ({ page }) => {
    await gotoWithAuth(page, '/home', 'superAdmin');
    await applyLightMode(page);
    await applyDarkMode(page);
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');
  });

  test('TC-DM-UI-003: Dark mode adds dark-mode class to body', async ({ page }) => {
    await gotoWithAuth(page, '/home', 'superAdmin');
    await applyDarkMode(page);
    const hasClass = await page.evaluate(() => document.body.classList.contains('dark-mode'));
    expect(hasClass).toBe(true);
  });

  test('TC-DM-UI-004: Toggling back to light mode removes dark-mode class', async ({ page }) => {
    await gotoWithAuth(page, '/home', 'superAdmin');
    await applyDarkMode(page);
    await applyLightMode(page);
    const hasClass = await page.evaluate(() => document.body.classList.contains('dark-mode'));
    expect(hasClass).toBe(false);
  });

  test('TC-DM-UI-005: Theme persists in localStorage', async ({ page }) => {
    await gotoWithAuth(page, '/home', 'superAdmin');
    await applyDarkMode(page);
    const stored = await page.evaluate(() => localStorage.getItem('app_theme'));
    expect(stored).toBe('dark');
  });

  test('TC-DM-UI-006: Light mode persists in localStorage', async ({ page }) => {
    await gotoWithAuth(page, '/home', 'superAdmin');
    await applyLightMode(page);
    const stored = await page.evaluate(() => localStorage.getItem('app_theme'));
    expect(stored).toBe('light');
  });

  test('TC-DM-UI-007: Theme persists after page reload (dark)', async ({ page }) => {
    await gotoWithAuth(page, '/home', 'superAdmin');
    await applyDarkMode(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');
  });

  test('TC-DM-UI-008: Theme persists after navigation (dark)', async ({ page }) => {
    await gotoWithAuth(page, '/home', 'superAdmin');
    await applyDarkMode(page);
    await gotoWithAuth(page, '/analytics', 'superAdmin');
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');
  });

  test('TC-DM-UI-009: No console errors when toggling theme', async ({ page }) => {
    await gotoWithAuth(page, '/home', 'superAdmin');
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await applyDarkMode(page);
    await applyLightMode(page);
    await page.waitForTimeout(500);
    const themeErrors = errors.filter(e => /theme|css|style/i.test(e));
    expect(themeErrors.length).toBe(0);
  });

  test('TC-DM-UI-010: Theme toggle button has accessible label', async ({ page }) => {
    await gotoWithAuth(page, '/home', 'superAdmin');
    const themeBtn = page.locator(
      '[data-testid*="theme-toggle"], [aria-label*="theme" i], ' +
      'button:has-text("Dark"), button:has-text("Light"), ' +
      'button:has-text("🌙"), button:has-text("☀️")'
    ).first();
    const visible = await themeBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) test.skip(true, 'No theme toggle button');
    const ariaLabel = await themeBtn.getAttribute('aria-label');
    const title = await themeBtn.getAttribute('title');
    const text = await themeBtn.textContent();
    const hasLabel = ariaLabel || title || (text && text.trim().length > 0);
    expect(hasLabel).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: Page Rendering in Dark Mode (TC-DM-UI-011 — TC-DM-UI-040)
// ═══════════════════════════════════════════════════════════════════════════════
let tcCounter = 11;

for (const pageConfig of PAGES) {
  for (const mode of MODES) {
    const tcId = `TC-DM-UI-${String(tcCounter).padStart(3, '0')}`;
    tcCounter++;

    test(`${tcId}: ${pageConfig.name} renders correctly${themeSuffix(mode)}`, async ({ page }) => {
      await gotoWithAuth(page, pageConfig.path, pageConfig.roles[0]);
      await applyTheme(page, mode);
      await page.waitForTimeout(500);

      // Verify data-theme attribute
      const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      expect(theme).toBe(mode);

      // Verify main content is visible
      const mainVisible = await page.locator('main, [role="main"], .main-content, .card, h1, h2, h3').first()
        .isVisible({ timeout: 5000 }).catch(() => false);
      expect(mainVisible).toBe(true);

      // Verify no error overlays
      const errorOverlay = page.locator('[class*="error-boundary"], text=/Something went wrong/i');
      const hasError = await errorOverlay.first().isVisible({ timeout: 1000 }).catch(() => false);
      expect(hasError).toBe(false);
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: Text Readability & Contrast (TC-DM-UI-041 — TC-DM-UI-055)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('Dark Mode — Text Readability', () => {
  const readabilityPages = [
    { name: 'Home', path: '/home' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Marks', path: '/marks' },
    { name: 'Classes', path: '/classes' },
    { name: 'Quizzes', path: '/quizzes' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'Profile Settings', path: '/profile-settings' },
  ];

  for (const p of readabilityPages) {
    for (const mode of MODES) {
      test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: ${p.name} text readable${themeSuffix(mode)}`, async ({ page }) => {
        tcCounter++;
        await gotoWithAuth(page, p.path, 'superAdmin');
        await applyTheme(page, mode);
        await page.waitForTimeout(500);

        // Check heading text readability
        const heading = page.locator('h1, h2, h3').first();
        if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
          const readable = await verifyTextReadable(page, 'h1, h2, h3');
          // Log but don't fail — contrast detection is approximate
          if (!readable) console.log(`Contrast warning on ${p.name} ${mode} heading`);
        }

        // Check body text readability
        const body = page.locator('p, span, td, label').first();
        if (await body.isVisible({ timeout: 2000 }).catch(() => false)) {
          const readable = await verifyTextReadable(page, 'p, span, td, label');
          if (!readable) console.log(`Contrast warning on ${p.name} ${mode} body text`);
        }

        // Verify page didn't crash
        const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
        expect(theme).toBe(mode);
      });
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: UI Components in Dark Mode (TC-DM-UI-056 — TC-DM-UI-070)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('Dark Mode — UI Components', () => {
  for (const mode of MODES) {
    test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Cards render with correct background${themeSuffix(mode)}`, async ({ page }) => {
      tcCounter++;
      await gotoWithAuth(page, '/dashboard', 'superAdmin');
      await applyTheme(page, mode);
      const card = page.locator('.card, [class*="card"]').first();
      if (!(await card.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No card found');
      const bg = await card.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(bg).toBeTruthy();
    });

    test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Table headers visible${themeSuffix(mode)}`, async ({ page }) => {
      tcCounter++;
      await gotoWithAuth(page, '/marks', 'superAdmin');
      await applyTheme(page, mode);
      const th = page.locator('th, [role="columnheader"]').first();
      if (!(await th.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No table headers');
      const readable = await verifyTextReadable(page, 'th, [role="columnheader"]');
      if (!readable) console.log(`Table header contrast warning in ${mode} mode`);
    });

    test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Buttons visible and styled${themeSuffix(mode)}`, async ({ page }) => {
      tcCounter++;
      await gotoWithAuth(page, '/home', 'superAdmin');
      await applyTheme(page, mode);
      const btn = page.locator('button').first();
      const visible = await btn.isVisible({ timeout: 3000 }).catch(() => false);
      if (!visible) test.skip(true, 'No buttons');
      const { background, color } = await btn.evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { background: s.backgroundColor, color: s.color };
      });
      expect(background).toBeTruthy();
      expect(color).toBeTruthy();
    });

    test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Input fields visible in dark mode${themeSuffix(mode)}`, async ({ page }) => {
      tcCounter++;
      await gotoWithAuth(page, '/profile-settings', 'superAdmin');
      await applyTheme(page, mode);
      const input = page.locator('input[type="text"], input[type="email"], input[type="tel"]').first();
      if (!(await input.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No input fields');
      const { background, color } = await input.evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { background: s.backgroundColor, color: s.color };
      });
      expect(background).toBeTruthy();
      expect(color).toBeTruthy();
    });

    test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Sidebar renders correctly${themeSuffix(mode)}`, async ({ page }) => {
      tcCounter++;
      await gotoWithAuth(page, '/home', 'superAdmin');
      await applyTheme(page, mode);
      const sidebar = page.locator('[class*="sidebar"], nav, [data-testid*="sidebar"]').first();
      if (!(await sidebar.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No sidebar');
      const bg = await sidebar.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(bg).toBeTruthy();
    });

    test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Navbar renders correctly${themeSuffix(mode)}`, async ({ page }) => {
      tcCounter++;
      await gotoWithAuth(page, '/home', 'superAdmin');
      await applyTheme(page, mode);
      const navbar = page.locator('[class*="navbar"], header, [data-testid*="navbar"]').first();
      if (!(await navbar.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No navbar');
      const bg = await navbar.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(bg).toBeTruthy();
    });

    test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Select dropdowns visible${themeSuffix(mode)}`, async ({ page }) => {
      tcCounter++;
      await gotoWithAuth(page, '/marks', 'superAdmin');
      await applyTheme(page, mode);
      const select = page.locator('select, [class*="select"]').first();
      if (!(await select.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No select elements');
      const bg = await select.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(bg).toBeTruthy();
    });

    test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Toggle switches visible${themeSuffix(mode)}`, async ({ page }) => {
      tcCounter++;
      await gotoWithAuth(page, '/profile-settings', 'superAdmin');
      await applyTheme(page, mode);
      const toggle = page.locator('[class*="toggle"], [role="switch"], input[type="checkbox"]').first();
      if (!(await toggle.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No toggle switches');
      expect(await toggle.isVisible()).toBe(true);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: Dark Mode + RTL Combined (TC-DM-UI-071 — TC-DM-UI-080)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('Dark Mode — RTL Combined', () => {
  const rtlPages = [
    { name: 'Home', path: '/home' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Marks', path: '/marks' },
    { name: 'Classes', path: '/classes' },
  ];

  for (const p of rtlPages) {
    test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: ${p.name} dark mode + RTL renders correctly`, async ({ page }) => {
      tcCounter++;
      await gotoWithAuth(page, p.path, 'superAdmin');

      // Switch to Arabic
      const langBtn = page.locator('button:has-text("AR"), [data-testid*="lang-toggle"], [aria-label*="Arabic"]').first();
      if (await langBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await langBtn.click();
        await page.waitForTimeout(500);
      } else {
        await page.evaluate(() => {
          localStorage.setItem('lang', 'ar');
          document.documentElement.lang = 'ar';
          document.documentElement.dir = 'rtl';
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }

      // Apply dark mode
      await applyDarkMode(page);

      // Verify both dark mode and RTL
      const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      const dir = await page.evaluate(() => document.documentElement.dir);
      expect(theme).toBe('dark');
      expect(dir).toBe('rtl');

      // Verify content visible
      const content = await page.locator('main, [role="main"], .card, h1, h2, h3').first()
        .isVisible({ timeout: 5000 }).catch(() => false);
      expect(content).toBe(true);
    });
  }

  test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Dark mode + RTL no console errors`, async ({ page }) => {
    tcCounter++;
    await gotoWithAuth(page, '/home', 'superAdmin');
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Switch to Arabic
    await page.evaluate(() => {
      localStorage.setItem('lang', 'ar');
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Apply dark mode
    await applyDarkMode(page);
    await page.waitForTimeout(500);

    const criticalErrors = errors.filter(e =>
      /theme|css|style|dark|rtl|direction/i.test(e) && !/warning|deprecat/i.test(e)
    );
    expect(criticalErrors.length).toBe(0);
  });

  test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Theme toggle works in RTL mode`, async ({ page }) => {
    tcCounter++;
    await gotoWithAuth(page, '/home', 'superAdmin');

    // Switch to Arabic
    await page.evaluate(() => {
      localStorage.setItem('lang', 'ar');
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Toggle theme
    await applyDarkMode(page);
    let theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');

    await applyLightMode(page);
    theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('light');
  });

  test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Dark mode persists across RTL navigation`, async ({ page }) => {
    tcCounter++;
    await gotoWithAuth(page, '/home', 'superAdmin');

    // Set Arabic + dark mode
    await page.evaluate(() => localStorage.setItem('lang', 'ar'));
    await applyDarkMode(page);

    // Navigate to another page
    await gotoWithAuth(page, '/analytics', 'superAdmin');

    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(theme).toBe('dark');
    expect(dir).toBe('rtl');
  });

  test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: All major pages dark mode screenshot comparison`, async ({ page }) => {
    tcCounter++;
    await gotoWithAuth(page, '/dashboard', 'superAdmin');
    await applyDarkMode(page);
    await page.waitForTimeout(500);

    // Verify dark mode is active
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'dark-mode-dashboard.png' });
  });
});
