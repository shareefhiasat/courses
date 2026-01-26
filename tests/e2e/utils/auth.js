/**
 * Authentication Helper Utilities
 */
import { BASE_URL, PATHS, SELECTORS, TIMEOUTS } from '../config/constants';
import { LoginPage } from '../pages/LoginPage';
import { testUsers } from '../fixtures/users';

/**
 * Login as a specific user
 * @param {Page} page - Playwright page object
 * @param {Object} user - User object from testUsers
 * @param {string} expectedRedirect - Expected path after login
 */
export async function loginAs(page, user, expectedRedirect = null) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(user.email, user.password);
  
  // Wait for login to process
  await page.waitForTimeout(TIMEOUTS.LOGIN);
  
  await loginPage.waitForRedirect(expectedRedirect);
  
  // Wait for auth state to be ready
  await page.waitForTimeout(TIMEOUTS.AUTH_STATE);
  
  // Verify we're logged in (not on login page)
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    // Take screenshot for debugging
    await page.screenshot({ path: 'login-failure.png', fullPage: true });
    throw new Error(`Login failed for user: ${user.email}. Still on login page.`);
  }
}

/**
 * Login by role
 * @param {Page} page - Playwright page object
 * @param {string} role - Role name (superAdmin, admin, instructor, hr, student)
 */
export async function loginByRole(page, role) {
  const user = testUsers[role] || testUsers.student;
  await loginAs(page, user);
  return user;
}

/**
 * Logout current user
 * @param {Page} page - Playwright page object
 */
export async function logout(page) {
  // Look for logout button in navbar
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a[href*="logout"]');
  
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL(/.*(login|home|\/).*/i);
  } else {
    // If no logout button, navigate to login (will trigger logout)
    await page.goto(BASE_URL + PATHS.LOGIN);
  }
  
  await page.waitForTimeout(500);
}

/**
 * Check if user is logged in
 * @param {Page} page - Playwright page object
 */
export async function isLoggedIn(page) {
  const currentUrl = page.url();
  return !currentUrl.includes('/login');
}

/**
 * Get current user role from UI (if displayed)
 * @param {Page} page - Playwright page object
 */
export async function getCurrentUserRole(page) {
  // Try to find role indicator in navbar or user menu
  const roleIndicator = page.locator('[data-testid="user-role"], .user-role, [data-role]');
  if (await roleIndicator.isVisible()) {
    return await roleIndicator.textContent();
  }
  return null;
}

/**
 * Wait for authentication to complete
 * @param {Page} page - Playwright page object
 */
export async function waitForAuth(page) {
  // Wait for auth context to be ready
  await page.waitForFunction(() => {
    return window.firebase?.auth?.currentUser !== undefined;
  }, { timeout: 10000 }).catch(() => {
    // If Firebase not available, just wait a bit
    return page.waitForTimeout(2000);
  });
}
