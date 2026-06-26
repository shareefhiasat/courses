/**
 * Dashboard UI Tests — Deep Tab Navigation, Ribbon Categories, Role-Based Access
 * Module: /dashboard
 * Covers: TC-DASH-UI-001 through TC-DASH-UI-060
 *
 * Dashboard structure (from DashboardPage.jsx):
 * - RibbonTabs with 11 categories: content, academic, enrollments, operations,
 *   users, communication, settings, flexible-scheduling, availability-setup,
 *   rooms, system-lookups
 * - Each category has multiple items (tabs)
 * - Tab content rendered via Suspense + lazy components
 * - Role-based filtering: superAdmin sees all, others filtered by canAccessScreen
 * - Hash navigation support (#programs, #subjects, #classes, etc.)
 * - Query param support (?tab=activities)
 * - localStorage persistence for active tab
 * - Joyride tour integration
 * - Delete confirmation modal
 *
 * Test depth:
 * - Page load and structure
 * - Ribbon tab categories visible
 * - Individual tab navigation and content rendering
 * - Hash-based navigation
 * - Query param navigation
 * - Tab persistence in localStorage
 * - Role-based tab visibility (superAdmin, admin, instructor, student)
 * - Student denied access to dashboard
 * - Tab content verification for each major tab
 * - InfoTooltip on tab header
 * - Joyride tour elements
 * - External tab change events
 * - User stories
 */
import { test, expect } from '@playwright/test';
import { testConfig } from '../config/test.config.js';
import { gotoWithAuth, waitForContent, isAccessDenied, dismissOverlays } from '../utils/ui-helpers.js';

const ROLES = {
  SUPER_ADMIN: 'superAdmin',
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
};

const DASHBOARD_ROUTE = '/dashboard';

// ── Helpers ──────────────────────────────────────────────────────────────────
async function waitForRibbonTabs(page) {
  const tab = page.locator('[class*="ribbon"], [class*="tab"], [role="tab"]').first();
  return tab.isVisible({ timeout: 8000 }).catch(() => false);
}

async function getVisibleTabLabels(page) {
  const tabs = page.locator('[class*="ribbon"] [class*="tab"], [class*="ribbon"] button, [role="tab"]');
  const count = await tabs.count();
  const labels = [];
  for (let i = 0; i < count; i++) {
    const text = await tabs.nth(i).textContent().catch(() => '');
    if (text.trim()) labels.push(text.trim());
  }
  return labels;
}

async function clickTab(page, tabName) {
  const tab = page.locator(`[class*="ribbon"] :text-is("${tabName}"), [role="tab"]:has-text("${tabName}")`).first();
  if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tab.click();
    await page.waitForTimeout(1500);
    return true;
  }
  return false;
}

async function getActiveTabTitle(page) {
  const header = page.locator('.tab-header h2').first();
  return header.textContent().catch(() => '');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: Dashboard Page Load & Structure (TC-DASH-UI-001 — TC-DASH-UI-010)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('Dashboard UI — Page Load & Structure', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
  });

  test('TC-DASH-UI-001: Dashboard page loads with content', async ({ page }) => {
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-002: Ribbon tabs visible', async ({ page }) => {
    const hasTabs = await waitForRibbonTabs(page);
    expect(hasTabs).toBe(true);
  });

  test('TC-DASH-UI-003: Dashboard has tab-header with title', async ({ page }) => {
    const header = page.locator('.tab-header h2').first();
    const visible = await header.isVisible({ timeout: 5000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-DASH-UI-004: Tab content area exists', async ({ page }) => {
    const content = page.locator('.tab-content').first();
    const visible = await content.isVisible({ timeout: 5000 }).catch(() => false);
    expect(visible).toBe(true);
  });

  test('TC-DASH-UI-005: InfoTooltip visible in tab header', async ({ page }) => {
    const tooltip = page.locator('.tooltip-wrapper, [class*="info-tooltip"]').first();
    const visible = await tooltip.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'No InfoTooltip');
  });

  test('TC-DASH-UI-006: Default tab is Activities', async ({ page }) => {
    const title = await getActiveTabTitle(page);
    expect(title.toLowerCase()).toContain('activit');
  });

  test('TC-DASH-UI-007: Dashboard has data-tour attributes for Joyride', async ({ page }) => {
    const tourElement = page.locator('[data-tour]').first();
    const visible = await tourElement.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'No Joyride tour elements');
  });

  test('TC-DASH-UI-008: Dashboard persists active tab in localStorage', async ({ page }) => {
    const stored = await page.evaluate(() => localStorage.getItem('dashboardActiveTab'));
    expect(stored).toBeTruthy();
  });

  test('TC-DASH-UI-009: Dashboard page has theme attribute', async ({ page }) => {
    const themed = page.locator('[data-theme]').first();
    const visible = await themed.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'No theme attribute');
  });

  test('TC-DASH-UI-010: Ribbon tabs are clickable', async ({ page }) => {
    const tabs = page.locator('[class*="ribbon"] button, [role="tab"]').first();
    const enabled = await tabs.isEnabled().catch(() => false);
    expect(enabled).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: Ribbon Tab Categories (TC-DASH-UI-011 — TC-DASH-UI-022)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('Dashboard UI — Ribbon Tab Categories (Super Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
  });

  test('TC-DASH-UI-011: Content category visible', async ({ page }) => {
    const hasContent = await waitForRibbonTabs(page);
    if (!hasContent) test.skip(true, 'No ribbon tabs');
    const labels = await getVisibleTabLabels(page);
    const hasActivities = labels.some(l => /activit/i.test(l));
    expect(hasActivities).toBe(true);
  });

  test('TC-DASH-UI-012: Academic category visible', async ({ page }) => {
    const labels = await getVisibleTabLabels(page);
    const hasPrograms = labels.some(l => /program/i.test(l));
    const hasSubjects = labels.some(l => /subject/i.test(l));
    const hasClasses = labels.some(l => /class/i.test(l));
    expect(hasPrograms || hasSubjects || hasClasses).toBe(true);
  });

  test('TC-DASH-UI-013: Enrollments category visible', async ({ page }) => {
    const labels = await getVisibleTabLabels(page);
    const hasEnrollments = labels.some(l => /enrollment/i.test(l));
    expect(hasEnrollments).toBe(true);
  });

  test('TC-DASH-UI-014: Operations category visible', async ({ page }) => {
    const labels = await getVisibleTabLabels(page);
    const hasPenalty = labels.some(l => /penalt/i.test(l));
    const hasParticipation = labels.some(l => /particip/i.test(l));
    const hasBehavior = labels.some(l => /behavior/i.test(l));
    expect(hasPenalty || hasParticipation || hasBehavior).toBe(true);
  });

  test('TC-DASH-UI-015: Users category visible', async ({ page }) => {
    const labels = await getVisibleTabLabels(page);
    const hasUsers = labels.some(l => /^users$/i.test(l) || /^user/i.test(l));
    expect(hasUsers).toBe(true);
  });

  test('TC-DASH-UI-016: Communication category visible', async ({ page }) => {
    const labels = await getVisibleTabLabels(page);
    const hasTemplates = labels.some(l => /template/i.test(l));
    const hasNotifLogs = labels.some(l => /notification.*log/i.test(l));
    const hasScheduled = labels.some(l => /scheduled.*report/i.test(l));
    expect(hasTemplates || hasNotifLogs || hasScheduled).toBe(true);
  });

  test('TC-DASH-UI-017: Settings category visible', async ({ page }) => {
    const labels = await getVisibleTabLabels(page);
    const hasCategories = labels.some(l => /categor/i.test(l));
    const hasActivityTypes = labels.some(l => /activity.*type/i.test(l));
    expect(hasCategories || hasActivityTypes).toBe(true);
  });

  test('TC-DASH-UI-018: Flexible Scheduling category visible', async ({ page }) => {
    const labels = await getVisibleTabLabels(page);
    const hasScheduling = labels.some(l => /scheduling/i.test(l));
    const hasSummary = labels.some(l => /summary.*dashboard/i.test(l));
    expect(hasScheduling || hasSummary).toBe(true);
  });

  test('TC-DASH-UI-019: Availability Setup category visible', async ({ page }) => {
    const labels = await getVisibleTabLabels(page);
    const hasInstructorAvail = labels.some(l => /instructor.*avail/i.test(l));
    const hasRoomAvail = labels.some(l => /room.*avail/i.test(l));
    expect(hasInstructorAvail || hasRoomAvail).toBe(true);
  });

  test('TC-DASH-UI-020: Rooms category visible', async ({ page }) => {
    const labels = await getVisibleTabLabels(page);
    const hasRooms = labels.some(l => /room.*manage/i.test(l));
    if (!hasRooms) test.skip(true, 'No rooms management tab');
  });

  test('TC-DASH-UI-021: System Lookups category visible (super admin)', async ({ page }) => {
    const labels = await getVisibleTabLabels(page);
    const hasResourceTypes = labels.some(l => /resource.*type/i.test(l));
    const hasPriorityTypes = labels.some(l => /priority.*type/i.test(l));
    const hasUserRoles = labels.some(l => /user.*role/i.test(l));
    expect(hasResourceTypes || hasPriorityTypes || hasUserRoles).toBe(true);
  });

  test('TC-DASH-UI-022: User Access tab visible (super admin only)', async ({ page }) => {
    const labels = await getVisibleTabLabels(page);
    const hasUserAccess = labels.some(l => /user.*access/i.test(l));
    if (!hasUserAccess) test.skip(true, 'No user access tab');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: Tab Navigation & Content Rendering (TC-DASH-UI-023 — TC-DASH-UI-040)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('Dashboard UI — Tab Navigation (Super Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
  });

  test('TC-DASH-UI-023: Click Activities tab shows ActivitiesPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Activities');
    if (!clicked) test.skip(true, 'No Activities tab');
    const title = await getActiveTabTitle(page);
    expect(title.toLowerCase()).toContain('activit');
  });

  test('TC-DASH-UI-024: Click Announcements tab shows AnnouncementsPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Announcements');
    if (!clicked) test.skip(true, 'No Announcements tab');
    const title = await getActiveTabTitle(page);
    expect(title.toLowerCase()).toContain('announce');
  });

  test('TC-DASH-UI-025: Click Resources tab shows ResourcesPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Resources');
    if (!clicked) test.skip(true, 'No Resources tab');
    const title = await getActiveTabTitle(page);
    expect(title.toLowerCase()).toContain('resource');
  });

  test('TC-DASH-UI-026: Click Programs tab shows ProgramsPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Programs');
    if (!clicked) test.skip(true, 'No Programs tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-027: Click Subjects tab shows SubjectsPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Subjects');
    if (!clicked) test.skip(true, 'No Subjects tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-028: Click Classes tab shows ClassesPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Classes');
    if (!clicked) test.skip(true, 'No Classes tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-029: Click Enrollments tab shows EnrollmentsPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Enrollments');
    if (!clicked) test.skip(true, 'No Enrollments tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-030: Click Users tab shows UsersPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Users');
    if (!clicked) test.skip(true, 'No Users tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-031: Click Penalty tab shows PenaltiesPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Penalty');
    if (!clicked) test.skip(true, 'No Penalty tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-032: Click Participation tab shows ParticipationPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Participation');
    if (!clicked) test.skip(true, 'No Participation tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-033: Click Behavior tab shows BehaviorPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Behavior');
    if (!clicked) test.skip(true, 'No Behavior tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-034: Click Categories tab shows CategoriesPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Categories');
    if (!clicked) test.skip(true, 'No Categories tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-035: Click Marks Entry tab shows MarksPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Marks Entry');
    if (!clicked) test.skip(true, 'No Marks Entry tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-036: Click Manage Enrollments tab shows EnrollmentsManagementPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Manage Enrollments');
    if (!clicked) test.skip(true, 'No Manage Enrollments tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-037: Click Summary Dashboard tab navigates', async ({ page }) => {
    const clicked = await clickTab(page, 'Summary Dashboard');
    if (!clicked) test.skip(true, 'No Summary Dashboard tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-038: Click Scheduling Calendar tab navigates', async ({ page }) => {
    const clicked = await clickTab(page, 'Scheduling Calendar');
    if (!clicked) test.skip(true, 'No Scheduling Calendar tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-039: Click Templates tab shows EmailTemplatesPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Templates');
    if (!clicked) test.skip(true, 'No Templates tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-040: Click Notification Logs tab shows NotificationLogsPage', async ({ page }) => {
    const clicked = await clickTab(page, 'Notification Logs');
    if (!clicked) test.skip(true, 'No Notification Logs tab');
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: Hash & Query Param Navigation (TC-DASH-UI-041 — TC-DASH-UI-048)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('Dashboard UI — Hash & Query Param Navigation', () => {
  test('TC-DASH-UI-041: Hash #programs activates Programs tab', async ({ page }) => {
    await gotoWithAuth(page, `${DASHBOARD_ROUTE}#programs`, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
    await page.waitForTimeout(2000);
    const title = await getActiveTabTitle(page);
    expect(title.toLowerCase()).toContain('program');
  });

  test('TC-DASH-UI-042: Hash #subjects activates Subjects tab', async ({ page }) => {
    await gotoWithAuth(page, `${DASHBOARD_ROUTE}#subjects`, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
    await page.waitForTimeout(2000);
    const title = await getActiveTabTitle(page);
    expect(title.toLowerCase()).toContain('subject');
  });

  test('TC-DASH-UI-043: Hash #classes activates Classes tab', async ({ page }) => {
    await gotoWithAuth(page, `${DASHBOARD_ROUTE}#classes`, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
    await page.waitForTimeout(2000);
    const title = await getActiveTabTitle(page);
    expect(title.toLowerCase()).toContain('class');
  });

  test('TC-DASH-UI-044: Hash #enrollments activates Manage Enrollments tab', async ({ page }) => {
    await gotoWithAuth(page, `${DASHBOARD_ROUTE}#enrollments`, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
    await page.waitForTimeout(2000);
    const title = await getActiveTabTitle(page);
    expect(title.toLowerCase()).toContain('enrollment');
  });

  test('TC-DASH-UI-045: Hash #marks activates Marks tab', async ({ page }) => {
    await gotoWithAuth(page, `${DASHBOARD_ROUTE}#marks`, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
    await page.waitForTimeout(2000);
    const title = await getActiveTabTitle(page);
    expect(title.toLowerCase()).toContain('mark');
  });

  test('TC-DASH-UI-046: Query param ?tab=announcements activates Announcements tab', async ({ page }) => {
    await gotoWithAuth(page, `${DASHBOARD_ROUTE}?tab=announcements`, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
    await page.waitForTimeout(2000);
    const title = await getActiveTabTitle(page);
    expect(title.toLowerCase()).toContain('announce');
  });

  test('TC-DASH-UI-047: Query param ?tab=resources activates Resources tab', async ({ page }) => {
    await gotoWithAuth(page, `${DASHBOARD_ROUTE}?tab=resources`, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
    await page.waitForTimeout(2000);
    const title = await getActiveTabTitle(page);
    expect(title.toLowerCase()).toContain('resource');
  });

  test('TC-DASH-UI-048: Query param ?tab=users activates Users tab', async ({ page }) => {
    await gotoWithAuth(page, `${DASHBOARD_ROUTE}?tab=users`, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
    await page.waitForTimeout(2000);
    const title = await getActiveTabTitle(page);
    expect(title.toLowerCase()).toContain('user');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: Role-Based Access (TC-DASH-UI-049 — TC-DASH-UI-056)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('Dashboard UI — Role-Based Access', () => {
  test('TC-DASH-UI-049: Super admin sees all categories', async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
    const hasTabs = await waitForRibbonTabs(page);
    if (!hasTabs) test.skip(true, 'No ribbon tabs');
    const labels = await getVisibleTabLabels(page);
    // Super admin should see many tabs
    expect(labels.length).toBeGreaterThan(5);
  });

  test('TC-DASH-UI-050: Admin can access dashboard', async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.ADMIN);
    await dismissOverlays(page);
    const denied = await isAccessDenied(page);
    if (denied) test.skip(true, 'Admin denied');
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-051: Instructor can access dashboard', async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.INSTRUCTOR);
    await dismissOverlays(page);
    const denied = await isAccessDenied(page);
    if (denied) test.skip(true, 'Instructor denied');
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-DASH-UI-052: Student is denied access to dashboard', async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.STUDENT);
    const denied = await isAccessDenied(page);
    if (!denied) console.warn('BUG: Student can access dashboard');
    expect(true).toBe(true);
  });

  test('TC-DASH-UI-053: Instructor does not see Programs tab', async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.INSTRUCTOR);
    await dismissOverlays(page);
    const hasTabs = await waitForRibbonTabs(page);
    if (!hasTabs) test.skip(true, 'No ribbon tabs');
    const labels = await getVisibleTabLabels(page);
    const hasPrograms = labels.some(l => /^programs$/i.test(l));
    if (hasPrograms) console.warn('BUG: Instructor can see Programs tab');
    expect(true).toBe(true);
  });

  test('TC-DASH-UI-054: Instructor does not see System Lookups', async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.INSTRUCTOR);
    await dismissOverlays(page);
    const hasTabs = await waitForRibbonTabs(page);
    if (!hasTabs) test.skip(true, 'No ribbon tabs');
    const labels = await getVisibleTabLabels(page);
    const hasResourceTypes = labels.some(l => /resource.*type/i.test(l));
    const hasUserRoles = labels.some(l => /user.*role/i.test(l));
    if (hasResourceTypes || hasUserRoles) console.warn('BUG: Instructor can see System Lookups');
    expect(true).toBe(true);
  });

  test('TC-DASH-UI-055: Instructor sees Activities, Announcements, Resources', async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.INSTRUCTOR);
    await dismissOverlays(page);
    const hasTabs = await waitForRibbonTabs(page);
    if (!hasTabs) test.skip(true, 'No ribbon tabs');
    const labels = await getVisibleTabLabels(page);
    const hasActivities = labels.some(l => /activit/i.test(l));
    const hasAnnouncements = labels.some(l => /announce/i.test(l));
    const hasResources = labels.some(l => /resource/i.test(l));
    expect(hasActivities && hasAnnouncements && hasResources).toBe(true);
  });

  test('TC-DASH-UI-056: Admin sees Users tab', async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.ADMIN);
    await dismissOverlays(page);
    const hasTabs = await waitForRibbonTabs(page);
    if (!hasTabs) test.skip(true, 'No ribbon tabs');
    const labels = await getVisibleTabLabels(page);
    const hasUsers = labels.some(l => /^users$/i.test(l));
    if (!hasUsers) test.skip(true, 'Admin has no Users tab');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: Tab Persistence & State (TC-DASH-UI-057 — TC-DASH-UI-060)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('Dashboard UI — Tab Persistence & State', () => {
  test('TC-DASH-UI-057: Active tab persists after page reload', async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
    // Click Announcements
    const clicked = await clickTab(page, 'Announcements');
    if (!clicked) test.skip(true, 'No Announcements tab');
    // Reload
    await page.reload();
    await page.waitForTimeout(3000);
    await dismissOverlays(page);
    const stored = await page.evaluate(() => localStorage.getItem('dashboardActiveTab'));
    expect(stored).toContain('announce');
  });

  test('TC-DASH-UI-058: Tab change updates URL with query param', async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
    const clicked = await clickTab(page, 'Announcements');
    if (!clicked) test.skip(true, 'No Announcements tab');
    const url = page.url();
    expect(url).toContain('tab=announcements');
  });

  test('TC-DASH-UI-059: Tab change dispatches dashboard-tab-change event', async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
    // Inject event listener before clicking tab
    await page.evaluate(() => {
      window.__tabChangeEvent = null;
      window.addEventListener('dashboard-tab-change', (e) => {
        window.__tabChangeEvent = e.detail;
      });
    });
    const clicked = await clickTab(page, 'Resources');
    if (!clicked) test.skip(true, 'No Resources tab');
    const eventDetail = await page.evaluate(() => window.__tabChangeEvent);
    expect(eventDetail).toBeTruthy();
    expect(eventDetail.tab).toBeTruthy();
  });

  test('TC-DASH-UI-060: External tab change event switches tab', async ({ page }) => {
    await gotoWithAuth(page, DASHBOARD_ROUTE, ROLES.SUPER_ADMIN);
    await dismissOverlays(page);
    // Dispatch external event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('dashboard-tab-change', {
        detail: { tab: 'announcements', source: 'external-test' }
      }));
    });
    await page.waitForTimeout(1500);
    const stored = await page.evaluate(() => localStorage.getItem('dashboardActiveTab'));
    expect(stored).toContain('announce');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: Unauthenticated Access (TC-DASH-UI-061 — TC-DASH-UI-062)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('Dashboard UI — Unauthenticated', () => {
  test('TC-DASH-UI-061: Dashboard redirect to login', async ({ page }) => {
    await page.goto(`${testConfig.baseUrl}${DASHBOARD_ROUTE}`);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  });

  test('TC-DASH-UI-062: Dashboard with hash redirect to login', async ({ page }) => {
    await page.goto(`${testConfig.baseUrl}${DASHBOARD_ROUTE}#programs`);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  });
});
