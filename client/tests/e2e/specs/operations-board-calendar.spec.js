import { test, expect } from '@playwright/test';
import { gotoWithAuth } from '../utils/ui-helpers.js';

test('operations calendar tab loads class events without stuck spinner', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`PAGE: ${err.message}`));

  await gotoWithAuth(page, '/welcome?programId=5&termId=6&date=2026-07-09', 'instructor');
  await page.waitForTimeout(2000);

  await page.getByRole('tab', { name: 'Operations' }).click();
  await page.waitForTimeout(1500);

  const calTab = page.getByTestId('operations-board-tab-calendar');
  await expect(calTab).toBeVisible({ timeout: 20000 });
  await calTab.click();

  await expect(page.getByTestId('operations-board-schedule-calendar')).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('operations-board-calendar-legend')).toBeVisible();

  await expect(page.locator('.MuiCircularProgress-root')).toHaveCount(0, { timeout: 15000 });

  const events = await page.locator('.rbc-event').count();
  expect(events).toBeGreaterThan(0);

  const uniqueErrors = [...new Set(errors)].filter((e) => !e.includes('break2'));
  expect(uniqueErrors).toEqual([]);
});
