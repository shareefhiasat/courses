/**
 * UI Auth Helpers — Keycloak login via browser
 */
import { testConfig } from '../config/test.config.js';

/**
 * Login via Keycloak UI. Call after navigating to a protected page.
 * Detects Keycloak redirect and fills credentials.
 */
export async function loginAsRole(page, role = 'superAdmin') {
  const user = testConfig[role];
  if (!user) throw new Error(`Unknown role: ${role}`);

  // Wait for possible redirect to Keycloak (up to 10s)
  await page.waitForTimeout(1000);
  let currentUrl = page.url();
  for (let i = 0; i < 10 && !(currentUrl.includes('keycloak') || currentUrl.includes('8080')); i++) {
    await page.waitForTimeout(1000);
    currentUrl = page.url();
  }

  if (currentUrl.includes('keycloak') || currentUrl.includes('8080')) {
    // Wait for the login form to be visible
    const usernameField = page.locator('input[name="username"], input[type="email"], input#username').first();
    const passwordField = page.locator('input[name="password"], input[type="password"], input#password').first();
    const submitBtn = page.locator('button[type="submit"], input[type="submit"], button[name="login"]').first();

    await usernameField.waitFor({ state: 'visible', timeout: 10000 });
    await usernameField.fill(user.email);
    await passwordField.fill(user.password);
    await submitBtn.click();

    // Wait for redirect back to app (30s timeout)
    await page.waitForURL(url => !url.toString().includes('keycloak') && !url.toString().includes('8080'), {
      timeout: 30000,
    });
    await page.waitForLoadState('networkidle').catch(() => {});
  }
  return user;
}

/**
 * Navigate to a path and handle Keycloak login if redirected.
 */
export async function gotoWithAuth(page, path, role = 'superAdmin') {
  await page.goto(`${testConfig.baseUrl}${path}`);
  await page.waitForLoadState('networkidle');
  await loginAsRole(page, role);
  await page.waitForTimeout(1500);
}

/**
 * Logout from the application.
 */
export async function logout(page) {
  const logoutSelectors = [
    'button:has-text("Logout")',
    'button:has-text("Sign Out")',
    'a[href*="logout"]',
    '[data-testid="logout-btn"]',
  ];
  for (const sel of logoutSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      break;
    }
  }
}

/**
 * Wait for main content to render. Checks for common content containers.
 */
export async function waitForContent(page) {
  const selectors = [
    'main',
    '[role="main"]',
    '.main-content',
    'table',
    '[role="grid"]',
    '.card',
    '.list',
    'h1, h2, h3',
  ];
  for (const sel of selectors) {
    if (await page.locator(sel).first().isVisible({ timeout: 5000 }).catch(() => false)) {
      return true;
    }
  }
  return false;
}

/**
 * Wait for a table or list to render.
 */
export async function waitForList(page, selectors = ['table', '[role="grid"]', '.list', '[data-testid*="list"]', 'main']) {
  for (const sel of selectors) {
    if (await page.locator(sel).first().isVisible({ timeout: 5000 }).catch(() => false)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if access denied message is shown.
 */
export async function isAccessDenied(page) {
  const denied = page.locator('text=/Access Denied/i, text=/unauthorized/i, text=/need.*privileges/i');
  return await denied.first().isVisible({ timeout: 2000 }).catch(() => false);
}

/**
 * Dismiss any modal/overlay that might block clicks (clock overlay, etc).
 */
export async function dismissOverlays(page) {
  // The app has a clock overlay that can intercept clicks
  await page.evaluate(() => {
    const overlays = document.querySelectorAll('.clock-content, .navbar-container');
    overlays.forEach(el => {
      if (el.style) el.style.pointerEvents = 'none';
    });
  }).catch(() => {});
}

/**
 * Try multiple selectors to find and click a button.
 */
export async function clickButton(page, textOptions) {
  for (const text of textOptions) {
    const btn = page.locator(`button:has-text("${text}"), [data-testid*="${text.toLowerCase().replace(/\s+/g, '-')}"]`).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      return true;
    }
  }
  return false;
}

/**
 * Fill a form field by trying multiple selectors.
 */
export async function fillField(page, selectors, value) {
  for (const sel of selectors) {
    const field = page.locator(sel).first();
    if (await field.isVisible({ timeout: 2000 }).catch(() => false)) {
      await field.fill(value);
      return true;
    }
  }
  return false;
}

/**
 * Wait for a dashboard tab to render its content.
 * The DashboardPage loads tab content asynchronously after setting the active tab.
 * Also tries clicking the tab button if the expected content isn't found.
 * @param {import('@playwright/test').Page} page
 * @param {string} tabName - The tab name (e.g., 'classes', 'subjects', 'announcements')
 * @param {number} timeout - ms to wait
 */
export async function waitForDashboardTab(page, tabName, timeout = 15000) {
  // First, try clicking the tab button to ensure the right tab is active
  const tabButton = page.locator(`button:has-text("${tabName.charAt(0).toUpperCase() + tabName.slice(1)}")`).first();
  if (await tabButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tabButton.click();
    // Wait for tab switch to complete (old content unmounts, new content mounts)
    await page.waitForTimeout(2000);
  }

  // Wait for any content to render
  const contentSelectors = [
    `form.dashboard-form`,
    `[role="grid"]`,
    `table`,
    `.card`,
  ];
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const sel of contentSelectors) {
      if (await page.locator(sel).first().isVisible({ timeout: 1000 }).catch(() => false)) {
        return true;
      }
    }
    await page.waitForTimeout(500);
  }
  return false;
}
