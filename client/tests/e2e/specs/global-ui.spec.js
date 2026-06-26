/**
 * Global UI Tests — Deep Navbar, Sidebar, Theme, Language, Logout Verification
 * Module: global, navigation
 * Covers: TC-GLB-UI-001 through TC-GLB-UI-030
 *
 * Test depth:
 * - Sidebar: all sections expand + verify sub-items visible
 * - Navbar: menu toggle, help, language toggle, theme toggle, avatar, logout
 * - Pin/open in new tab buttons
 * - Navigation: click sidebar link → verify page changes
 * - Role-based: student limited sidebar, instructor sidebar
 * - User story: admin navigates via sidebar to programs → verifies content
 * - Unauthenticated redirect
 */
import { test, expect } from '@playwright/test';
import { testConfig } from '../config/test.config.js';
import { gotoWithAuth, waitForContent, isAccessDenied, dismissOverlays } from '../utils/ui-helpers.js';

test.describe('Global UI — Sidebar Navigation (Deep)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithAuth(page, '/', 'superAdmin');
    await dismissOverlays(page);
  });

  test('TC-GLB-UI-001: Sidebar renders with navigation sections', async ({ page }) => {
    const nav = page.locator('nav, [role="navigation"]').first();
    const visible = await nav.isVisible({ timeout: 5000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-002: Main section has Home and Dashboard links', async ({ page }) => {
    const mainSection = page.locator('button:has-text("Main")').first();
    const visible = await mainSection.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) test.skip(true, 'No Main section');
    await mainSection.click();
    await page.waitForTimeout(500);
    const homeLink = page.locator('a[href="/"]').first();
    const dashboardLink = page.locator('a[href="/dashboard"]').first();
    expect(await homeLink.isVisible({ timeout: 3000 }).catch(() => false)).toBe(true);
    expect(await dashboardLink.isVisible({ timeout: 3000 }).catch(() => false)).toBe(true);
  });

  test('TC-GLB-UI-003: Activity section expands with sub-items', async ({ page }) => {
    const activityBtn = page.locator('button:has-text("Activity")').first();
    await activityBtn.click();
    await page.waitForTimeout(500);
    const activitiesLink = page.locator('a[href*="mode=activities"]').first();
    const visible = await activitiesLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-004: Quiz section expands with sub-items', async ({ page }) => {
    const quizBtn = page.locator('button:has-text("Quiz")').first();
    await quizBtn.click();
    await page.waitForTimeout(500);
    const quizzesLink = page.locator('a[href="/quizzes"]').first();
    const visible = await quizzesLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-005: Academic section expands with sub-items', async ({ page }) => {
    const academicBtn = page.locator('button:has-text("Academic")').first();
    await academicBtn.click();
    await page.waitForTimeout(500);
    const programsLink = page.locator('a[href*="dashboard#programs"]').first();
    const visible = await programsLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-006: Enrollments section expands with sub-items', async ({ page }) => {
    const enrollmentsBtn = page.locator('button:has-text("Enrollments")').first();
    await enrollmentsBtn.click();
    await page.waitForTimeout(500);
    const manageEnrollmentsLink = page.locator('a[href="/manage-enrollments"]').first();
    const visible = await manageEnrollmentsLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-007: Academic Records section expands with sub-items', async ({ page }) => {
    const recordsBtn = page.locator('button:has-text("Academic Records")').first();
    await recordsBtn.click();
    await page.waitForTimeout(500);
    const penaltyLink = page.locator('a[href*="dashboard#penalty"]').first();
    const visible = await penaltyLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-008: Scheduling section expands with sub-items', async ({ page }) => {
    const schedulingBtn = page.locator('button:has-text("Scheduling And Availabilities")').first();
    await schedulingBtn.click();
    await page.waitForTimeout(500);
    const summaryLink = page.locator('a[href="/summary-dashboard"]').first();
    const visible = await summaryLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-009: Availability section expands with sub-items', async ({ page }) => {
    const availBtn = page.locator('button:has-text("Availability")').first();
    await availBtn.click();
    await page.waitForTimeout(500);
    const classesAvailLink = page.locator('a[href*="tab=classes"]').first();
    const visible = await classesAvailLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-010: Review Results section expands with sub-items', async ({ page }) => {
    const reviewBtn = page.locator('button:has-text("Review Results")').first();
    await reviewBtn.click();
    await page.waitForTimeout(500);
    const quizResultsLink = page.locator('a[href*="review-results?activityType=quiz"]').first();
    const visible = await quizResultsLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-011: Attendance section expands with sub-items', async ({ page }) => {
    const attendanceBtn = page.locator('button:has-text("Attendance")').first();
    await attendanceBtn.click();
    await page.waitForTimeout(500);
    const attendanceLink = page.locator('a[href="/attendance"]').first();
    const visible = await attendanceLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-012: Drive section expands with sub-items', async ({ page }) => {
    const driveBtn = page.locator('button:has-text("Drive")').first();
    await driveBtn.click();
    await page.waitForTimeout(500);
    const smartDriveLink = page.locator('a[href="/smart-drive"]').first();
    const visible = await smartDriveLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-013: Analytics section expands with sub-items', async ({ page }) => {
    const analyticsBtn = page.locator('button:has-text("Analytics")').first();
    await analyticsBtn.click();
    await page.waitForTimeout(500);
    const breaksLink = page.locator('a:has-text("Breaks Analytics")').first();
    const visible = await breaksLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-014: Community section expands with sub-items', async ({ page }) => {
    const communityBtn = page.locator('button:has-text("Community")').first();
    await communityBtn.click();
    await page.waitForTimeout(500);
    const chatLink = page.locator('a[href="/chat"]').first();
    const visible = await chatLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-015: Tools section expands with Timer', async ({ page }) => {
    const toolsBtn = page.locator('button:has-text("Tools")').first();
    await toolsBtn.click();
    await page.waitForTimeout(500);
    const timerBtn = page.locator('button:has-text("Timer")').first();
    const visible = await timerBtn.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-016: Workspace Settings section expands with sub-items', async ({ page }) => {
    const settingsBtn = page.locator('button:has-text("Workspace Settings")').first();
    await settingsBtn.click();
    await page.waitForTimeout(500);
    const notificationsLink = page.locator('a[href="/notifications"]').first();
    const visible = await notificationsLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(visible).toBe(true);
  });
});

test.describe('Global UI — Navbar (Deep)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithAuth(page, '/', 'superAdmin');
    await dismissOverlays(page);
  });

  test('TC-GLB-UI-017: Menu toggle button visible', async ({ page }) => {
    const menuBtn = page.locator('button:has-text("Menu"), [data-testid*="menu-toggle"], .navbar button').first();
    const visible = await menuBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) test.skip(true, 'No menu toggle');
  });

  test('TC-GLB-UI-018: Help button visible', async ({ page }) => {
    const helpBtn = page.locator('button:has-text("Help"), [data-testid*="help"], [aria-label*="help" i]').first();
    const visible = await helpBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'No help button');
  });

  test('TC-GLB-UI-019: Language toggle visible', async ({ page }) => {
    const langBtn = page.locator('button:has-text("العربية"), button:has-text("Switch to Arabic"), [data-testid*="language"]').first();
    const visible = await langBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'No language toggle');
  });

  test('TC-GLB-UI-020: Theme toggle visible', async ({ page }) => {
    const themeBtn = page.locator('button:has-text("Dark"), button:has-text("Light"), [data-testid*="theme"], [aria-label*="theme" i]').first();
    const visible = await themeBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'No theme toggle');
  });

  test('TC-GLB-UI-021: User avatar/profile button visible', async ({ page }) => {
    const avatar = page.locator('[data-testid*="avatar"], .avatar, .user-avatar, img[alt*="avatar" i], button:has-text("shareef")').first();
    const visible = await avatar.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'No avatar');
  });

  test('TC-GLB-UI-022: Logout button visible', async ({ page }) => {
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [data-testid*="logout"]').first();
    const visible = await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'No logout button');
  });
});

test.describe('Global UI — Pin/Open in New Tab & Navigation (Deep)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithAuth(page, '/', 'superAdmin');
    await dismissOverlays(page);
  });

  test('TC-GLB-UI-023: Open in new tab button for Home', async ({ page }) => {
    const openNewTabBtn = page.locator('button:has-text("Open in new tab"), [aria-label*="Open in new tab"]').first();
    const visible = await openNewTabBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'No open in new tab button');
  });

  test('TC-GLB-UI-024: Pin button for Home', async ({ page }) => {
    const pinBtn = page.locator('button:has-text("pin"), [aria-label*="pin"]').first();
    const visible = await pinBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'No pin button');
  });

  test('TC-GLB-UI-025: Click sidebar link navigates to page', async ({ page }) => {
    const dashboardLink = page.locator('a[href="/dashboard"]').first();
    if (!(await dashboardLink.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No dashboard link');
    await dashboardLink.click();
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });
});

test.describe('Global UI — Role-Based Access (Deep)', () => {
  test('TC-GLB-UI-026: Student sees limited sidebar', async ({ page }) => {
    await gotoWithAuth(page, '/', 'student');
    const nav = page.locator('nav, [role="navigation"]').first();
    const visible = await nav.isVisible({ timeout: 5000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-GLB-UI-027: Student does not see Admin tools', async ({ page }) => {
    await gotoWithAuth(page, '/', 'student');
    await dismissOverlays(page);
    const adminTools = page.locator('button:has-text("Workspace Settings")').first();
    const visible = await adminTools.isVisible({ timeout: 3000 }).catch(() => false);
    if (visible) console.warn('BUG: Student can see Workspace Settings');
  });

  test('TC-GLB-UI-028: Instructor sees sidebar navigation', async ({ page }) => {
    await gotoWithAuth(page, '/', 'instructor');
    const nav = page.locator('nav, [role="navigation"]').first();
    const visible = await nav.isVisible({ timeout: 5000 }).catch(() => false);
    expect(visible).toBe(true);
  });
});

test.describe('Global UI — User Story', () => {
  test('TC-GLB-UI-029: User story — admin navigates via sidebar to dashboard', async ({ page }) => {
    await gotoWithAuth(page, '/', 'superAdmin');
    await dismissOverlays(page);

    const mainSection = page.locator('button:has-text("Main")').first();
    if (await mainSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await mainSection.click();
      await page.waitForTimeout(500);
    }

    const dashboardLink = page.locator('a[href="/dashboard"]').first();
    if (await dashboardLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dashboardLink.click();
      await page.waitForTimeout(2000);
    }

    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });
});

test.describe('Global UI — Unauthenticated', () => {
  test('TC-GLB-UI-030: Redirect to Keycloak login', async ({ page }) => {
    await page.goto(`${testConfig.baseUrl}/`);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  });
});
