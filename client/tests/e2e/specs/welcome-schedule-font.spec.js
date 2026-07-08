/**
 * Welcome page schedule font scaling
 */
import { test, expect } from '@playwright/test';
import { gotoWithAuth, dismissOverlays } from '../utils/ui-helpers.js';
import {
  SCHEDULE_FONT_SCALE_DEFAULT,
  SCHEDULE_FONT_SCALE_MAX,
  scheduleFontPxFromScale,
} from '../../../src/constants/scheduleFontScale.js';

async function readScheduleFontMetrics(page) {
  return page.evaluate(() => {
    const grid = document.querySelector('[data-testid="official-weekly-schedule-grid"]');
    const table = grid?.querySelector('table');
    const subjectBtn = grid?.querySelector('[data-testid^="schedule-cell-"]');
    const subjectText = subjectBtn?.querySelector('span');
    const rowLabel = grid?.querySelector('tbody tr td:nth-child(2) div');
    const lectureHeader = grid?.querySelector('thead th:nth-child(3) span');
    const outsideChip = grid?.querySelector('.MuiChip-root');
    const scrollArea = grid?.querySelector('[class*="tableFill"], [class*="tableScroll"]');

    const px = (el) => (el ? parseFloat(getComputedStyle(el).fontSize) : null);

    return {
      cssScale: parseFloat(getComputedStyle(grid).getPropertyValue('--schedule-font-scale')),
      table: px(table),
      subject: px(subjectText),
      rowLabel: px(rowLabel),
      lectureHeader: px(lectureHeader),
      outsideChip: px(outsideChip),
      scrollOverflow: scrollArea ? getComputedStyle(scrollArea).overflowY : null,
      sundayVisible: Boolean(grid?.querySelector('tbody[data-day="Sun"]')),
    };
  });
}

test.describe('Welcome schedule font scaling', () => {
  test('slider scales table cells and expanded mode keeps scroll', async ({ page }) => {
    await gotoWithAuth(page, '/welcome?tab=schedule', 'instructor');

    await expect(page.getByTestId('official-weekly-schedule-grid')).toBeVisible({ timeout: 30000 });
    await dismissOverlays(page);
    await page.getByRole('button', { name: /close|skip|last|back/i }).click().catch(() => {});
    await page.locator('.react-joyride__overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await expect(page.getByTestId('schedule-font-slider')).toBeVisible({ timeout: 15000 });

    const before = await readScheduleFontMetrics(page);
    const basePx = scheduleFontPxFromScale(SCHEDULE_FONT_SCALE_DEFAULT);
    expect(before.table).toBeCloseTo(basePx, 0);
    expect(before.subject).toBeCloseTo(basePx, 0);

    const slider = page.getByRole('slider', { name: /schedule font size/i });
    await slider.focus();
    await expect(slider).toHaveAttribute('aria-valuenow', String(SCHEDULE_FONT_SCALE_DEFAULT));
    await slider.press('End');
    await expect(slider).toHaveAttribute('aria-valuenow', String(SCHEDULE_FONT_SCALE_MAX));
    await page.waitForTimeout(300);

    const after = await readScheduleFontMetrics(page);
    const maxPx = scheduleFontPxFromScale(SCHEDULE_FONT_SCALE_MAX);
    expect(after.table).toBeCloseTo(maxPx, 0);
    expect(after.subject).toBeCloseTo(maxPx, 0);
    expect(after.table).toBeGreaterThan(before.table);
    expect(after.cssScale).toBeCloseTo(SCHEDULE_FONT_SCALE_MAX / 100, 1);

    await page.evaluate(() => {
      try { localStorage.setItem('welcome_tour_seen', '1'); } catch {}
      document.querySelector('.react-joyride__overlay')?.remove();
      document.getElementById('react-joyride-portal')?.remove();
    });
    await page.getByTestId('schedule-expand-btn').click({ force: true });
    await page.waitForTimeout(400);

    const expanded = await readScheduleFontMetrics(page);
    expect(expanded.sundayVisible).toBe(true);
    expect(['auto', 'scroll']).toContain(expanded.scrollOverflow);
  });
});
