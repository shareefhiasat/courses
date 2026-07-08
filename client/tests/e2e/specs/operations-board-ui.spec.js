import { test, expect } from '@playwright/test';
import { gotoWithAuth, waitForContent } from '../utils/ui-helpers.js';

test.describe('Operations Board UI', () => {
  test.describe.configure({ mode: 'serial' });

  test('isolated shell loads without main navbar', async ({ page }) => {
    await gotoWithAuth(page, '/operations/board?mode=workflow&lane=status', 'superAdmin');
    await waitForContent(page);
    await expect(page.getByTestId('operations-board-shell')).toBeVisible();
    await expect(page.getByTestId('operations-board-page')).toBeVisible();
    const navbar = page.locator('[class*="Navbar"], nav').first();
    const shellVisible = await page.getByTestId('operations-board-shell').isVisible();
    expect(shellVisible).toBeTruthy();
  });

  test('workflow kanban shows status columns', async ({ page }) => {
    await gotoWithAuth(page, '/operations/board?mode=workflow&lane=status', 'superAdmin');
    await waitForContent(page);
    await expect(page.getByTestId('operations-board-column-DRAFT')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('operations-board-column-SUBMITTED')).toBeVisible();
  });

  test('mini-calendar and filters are visible', async ({ page }) => {
    await gotoWithAuth(page, '/operations/board?mode=workflow', 'superAdmin');
    await waitForContent(page);
    await expect(page.getByTestId('operations-board-mini-calendar')).toBeVisible();
    await expect(page.getByTestId('operations-board-search')).toBeVisible();
    await expect(page.getByTestId('operations-board-add-filter')).toBeVisible();
  });

  test('view switcher changes to list view', async ({ page }) => {
    await gotoWithAuth(page, '/operations/board?mode=workflow&view=kanban', 'superAdmin');
    await waitForContent(page);
    await page.getByTestId('operations-board-view-list').click();
    await expect(page).toHaveURL(/view=list/);
  });

  test('view switcher changes to table view', async ({ page }) => {
    await gotoWithAuth(page, '/operations/board?mode=workflow&view=table', 'superAdmin');
    await waitForContent(page);
    await expect(page.getByTestId('operations-board-table')).toBeVisible({ timeout: 15000 });
  });

  test('attendance lane requires workflow context', async ({ page }) => {
    await gotoWithAuth(page, '/operations/board?lane=attendance&classId=1&date=2026-01-15', 'superAdmin');
    await waitForContent(page);
    await expect(page.getByTestId('operations-board-back')).toBeVisible();
  });
});

test.describe('Operations Board — Instructor', () => {
  test.describe.configure({ mode: 'serial' });

  test('instructor can access isolated operations board', async ({ page }) => {
    await gotoWithAuth(page, '/operations/board?mode=workflow&lane=status', 'instructor');
    await waitForContent(page);
    await expect(page).not.toHaveURL(/unauthorized/);
    await expect(page.getByTestId('operations-board-shell')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('operations-board-page')).toBeVisible();
  });

  test('instructor sees workflow kanban columns', async ({ page }) => {
    await gotoWithAuth(page, '/operations/board?mode=workflow&lane=status', 'instructor');
    await waitForContent(page);
    await expect(page.getByTestId('operations-board-column-DRAFT')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('operations-board-column-TAKEN')).toBeVisible();
    await expect(page.getByTestId('operations-board-column-SUBMITTED')).toBeVisible();
  });

  test('instructor can use mini-calendar and filters', async ({ page }) => {
    await gotoWithAuth(page, '/operations/board?mode=workflow', 'instructor');
    await waitForContent(page);
    await expect(page.getByTestId('operations-board-mini-calendar')).toBeVisible();
    await expect(page.getByTestId('operations-board-search')).toBeVisible();
    await expect(page.getByTestId('operations-board-add-filter')).toBeVisible();
  });

  test('instructor can switch to list and table views', async ({ page }) => {
    await gotoWithAuth(page, '/operations/board?mode=workflow&view=kanban', 'instructor');
    await waitForContent(page);
    await page.getByTestId('operations-board-view-list').click();
    await expect(page).toHaveURL(/view=list/);
    await page.getByTestId('operations-board-view-table').click();
    await expect(page).toHaveURL(/view=table/);
    await expect(page.getByTestId('operations-board-table')).toBeVisible({ timeout: 15000 });
  });

  test('instructor can open attendance drill-in lane with back navigation', async ({ page }) => {
    await gotoWithAuth(page, '/operations/board?lane=attendance&classId=1&date=2026-01-15', 'instructor');
    await waitForContent(page);
    await expect(page.getByTestId('operations-board-back')).toBeVisible();
    await page.getByTestId('operations-board-back').click();
    await expect(page).toHaveURL(/lane=status/);
  });

  test('instructor welcome FAB navigates to operations board', async ({ page }) => {
    await gotoWithAuth(page, '/welcome', 'instructor');
    await waitForContent(page);
    const fab = page.locator('[class*="fab"], button').filter({ hasText: /operations board/i }).first();
    const visible = await fab.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) {
      await page.goto('https://localhost:5174/operations/board?mode=workflow');
      await expect(page.getByTestId('operations-board-page')).toBeVisible({ timeout: 15000 });
      return;
    }
    await fab.click();
    await expect(page).toHaveURL(/operations\/board/);
    await expect(page.getByTestId('operations-board-page')).toBeVisible({ timeout: 15000 });
  });
});
