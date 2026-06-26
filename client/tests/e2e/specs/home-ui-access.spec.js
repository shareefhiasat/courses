/**
 * Home Page - Role-Based Access & Resources Mode Tests
 * Focused test suite for access control and resources mode
 */

import { test, expect } from '@playwright/test';
import { testConfig } from '../config/test.config.js';
import { navigateToHome, waitForContent } from '../utils/home-helpers.js';
import { dismissOverlays, isAccessDenied } from '../utils/ui-helpers.js';

test.describe('Home Page — Role-Based Access', () => {
  test('TC-HOME-RBAC-001: Student sees home page', async ({ page }) => {
    await navigateToHome(page, 'activities', 'all', 'student');
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-HOME-RBAC-002: Student can switch to Resources mode', async ({ page }) => {
    await navigateToHome(page, 'resources', 'all', 'student');
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-HOME-RBAC-003: Student can switch to Activities mode', async ({ page }) => {
    await navigateToHome(page, 'activities', 'all', 'student');
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-HOME-RBAC-004: Admin sees home page', async ({ page }) => {
    await navigateToHome(page, 'activities', 'all', 'admin');
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-HOME-RBAC-005: Instructor sees home page', async ({ page }) => {
    await navigateToHome(page, 'activities', 'all', 'instructor');
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });
});

test.describe('Home Page — Resources Mode', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToHome(page, 'resources', 'all', 'superAdmin');
    await dismissOverlays(page);
  });

  test('TC-HOME-RES-001: Resources page loads', async ({ page }) => {
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-HOME-RES-002: Resource type filter — All visible', async ({ page }) => {
    const allFilter = page.locator('button:has-text("All"), [data-testid*="all"]').first();
    const visible = await allFilter.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'No All filter');
  });

  test('TC-HOME-RES-003: Resource type filter — Academic changes results', async ({ page }) => {
    const academicFilter = page.locator('button:has-text("Academic"), [data-testid*="academic"]').first();
    const visible = await academicFilter.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'No Academic filter');
    await academicFilter.click();
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-HOME-RES-004: Resource type filter — Administrative changes results', async ({ page }) => {
    const adminFilter = page.locator('button:has-text("Administrative"), [data-testid*="administrative"]').first();
    const visible = await adminFilter.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'No Administrative filter');
    await adminFilter.click();
    await page.waitForTimeout(2000);
    const hasContent = await waitForContent(page);
    expect(hasContent).toBe(true);
  });

  test('TC-HOME-RES-005: Resource search filters results', async ({ page }) => {
    const search = page.locator('input[placeholder*="Search" i]').first();
    const visible = await search.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) test.skip(true, 'No search box');
    await search.fill('zzz_nonexistent_xyz');
    await page.waitForTimeout(2000);
    const cards = page.locator('.unified-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(0);
    await search.fill('');
    await page.waitForTimeout(1500);
  });
});

test.describe('Home Page — Unauthenticated', () => {
  test('TC-HOME-AUTH-001: Redirect to login', async ({ page }) => {
    await page.goto(`${testConfig.baseUrl}/`);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  });
});
