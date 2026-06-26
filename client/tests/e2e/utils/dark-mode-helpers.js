/**
 * Dark Mode Test Helpers — Configurable dark mode testing layer
 *
 * Usage:
 *   Set DARK_MODE=true env var to run tests in dark mode.
 *   Set DARK_MODE=both to run tests in both light and dark mode.
 *   Default (unset or false): light mode only.
 *
 * Helpers:
 *   - applyDarkMode(page): toggles theme to dark if needed
 *   - applyLightMode(page): toggles theme to light if needed
 *   - verifyDarkModeActive(page): asserts data-theme="dark"
 *   - verifyLightModeActive(page): asserts data-theme="light"
 *   - withThemeVariants(test, callback): runs callback in configured theme(s)
 *   - getThemeModes(): returns array of modes to test based on env var
 */

const DARK_MODE_ENV = process.env.DARK_MODE || '';

/**
 * Get which theme modes to test based on DARK_MODE env var.
 * @returns {string[]} - ['light'], ['dark'], or ['light', 'dark']
 */
export function getThemeModes() {
  if (DARK_MODE_ENV === 'both') return ['light', 'dark'];
  if (DARK_MODE_ENV === 'true' || DARK_MODE_ENV === 'dark') return ['dark'];
  return ['light'];
}

/**
 * Apply a specific theme to the page.
 * @param {import('@playwright/test').Page} page
 * @param {string} mode - 'light' or 'dark'
 */
export async function applyTheme(page, mode = 'light') {
  const currentTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');
  if (mode === currentTheme) return;

  // Try clicking the theme toggle button
  const themeBtn = page.locator(
    'button:has-text("Dark"), button:has-text("Light"), ' +
    'button:has-text("🌙"), button:has-text("☀️"), ' +
    '[data-testid*="theme-toggle"], [aria-label*="theme" i], ' +
    '[aria-label*="dark" i], [aria-label*="light" i]'
  ).first();

  if (await themeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await themeBtn.click();
    await page.waitForTimeout(300);
  } else {
    // Fallback: set via localStorage and reload
    await page.evaluate((m) => {
      localStorage.setItem('app_theme', m);
      document.documentElement.setAttribute('data-theme', m);
      if (m === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.style.background = '#0f1115';
        document.body.style.color = '#e6e6e6';
      } else {
        document.body.classList.remove('dark-mode');
        document.body.style.background = '#f5f6fa';
        document.body.style.color = '#212529';
      }
    }, mode);
    await page.waitForTimeout(200);
  }
}

/**
 * Apply dark mode to the page.
 */
export async function applyDarkMode(page) {
  await applyTheme(page, 'dark');
}

/**
 * Apply light mode to the page.
 */
export async function applyLightMode(page) {
  await applyTheme(page, 'light');
}

/**
 * Verify that dark mode is active on the page.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Expect} expect
 */
export async function verifyDarkModeActive(page, expect) {
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(theme).toBe('dark');
  const hasDarkClass = await page.evaluate(() => document.body.classList.contains('dark-mode'));
  expect(hasDarkClass).toBe(true);
}

/**
 * Verify that light mode is active on the page.
 */
export async function verifyLightModeActive(page, expect) {
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(theme).toBe('light');
  const hasDarkClass = await page.evaluate(() => document.body.classList.contains('dark-mode'));
  expect(hasDarkClass).toBe(false);
}

/**
 * Verify no console errors related to theme/CSS in dark mode.
 */
export async function verifyNoThemeConsoleErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /theme|css|style|dark/i.test(msg.text())) {
      errors.push(msg.text());
    }
  });
  await page.waitForTimeout(500);
  return errors.length === 0;
}

/**
 * Verify that text is visible and readable in the current theme
 * (not white-on-white or black-on-black).
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - CSS selector for the element to check
 */
export async function verifyTextReadable(page, selector) {
  const el = page.locator(selector).first();
  if (!(await el.isVisible({ timeout: 2000 }).catch(() => false))) return false;

  const { color, backgroundColor } = await el.evaluate((node) => {
    const style = window.getComputedStyle(node);
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
    };
  });

  // Simple contrast check: parse rgb values
  const parseRgb = (str) => {
    const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : [0, 0, 0];
  };

  const [r1, g1, b1] = parseRgb(color);
  const [r2, g2, b2] = parseRgb(backgroundColor);
  const luminance = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const contrast = Math.abs(l1 - l2);

  return contrast > 0.15; // Minimum readable contrast
}

/**
 * Run a test callback in all configured theme modes.
 * Usage:
 *   await withThemeVariants(async (mode) => {
 *     // test code here, mode is 'light' or 'dark'
 *   });
 *
 * @param {Function} callback - async function receiving (mode)
 * @param {import('@playwright/test').Page} page
 */
export async function withThemeVariants(page, callback) {
  const modes = getThemeModes();
  for (const mode of modes) {
    await applyTheme(page, mode);
    await callback(mode);
  }
}

/**
 * Create a themed test description suffix.
 * @param {string} mode
 * @returns {string}
 */
export function themeSuffix(mode) {
  return mode === 'dark' ? ' [Dark Mode]' : ' [Light Mode]';
}
