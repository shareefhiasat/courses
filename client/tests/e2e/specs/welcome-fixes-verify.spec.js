/**
 * One-off verification for welcome page UI fixes (manual run).
 * Credentials via env: VERIFY_EMAIL, VERIFY_PASSWORD
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://localhost:5174';
const EMAIL = process.env.VERIFY_EMAIL || 'cy.instructor1@example.com';
const PASSWORD = process.env.VERIFY_PASSWORD || 'Jordan123$';

async function login(page) {
  await page.goto(`${BASE}/welcome?programId=5&termId=6&date=2026-07-09`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1500);
  const url = page.url();
  if (url.includes('8080') || url.includes('keycloak')) {
    await page.locator('input[name="username"], input#username').first().fill(EMAIL);
    await page.locator('input[name="password"], input#password').first().fill(PASSWORD);
    await page.locator('button[type="submit"], input[type="submit"]').first().click();
    await page.waitForURL((u) => !u.toString().includes('8080') && !u.toString().includes('keycloak'), {
      timeout: 45000,
    });
    await page.waitForLoadState('networkidle').catch(() => {});
  }
}

test.describe('Welcome fixes verification', () => {
  test.describe.configure({ mode: 'serial' });

  test('login and schedule tab loads', async ({ page }) => {
    await login(page);
    await expect(page.getByTestId('official-weekly-schedule-grid')).toBeVisible({ timeout: 30000 });
  });

  test('selection section uses nearly full viewport width', async ({ page }) => {
    await login(page);
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.waitForTimeout(1000);

    const metrics = await page.evaluate(() => {
      const section = document.querySelector('.selection-section');
      const main = document.querySelector('.main-content') || document.querySelector('main');
      if (!section || !main) return null;
      const s = section.getBoundingClientRect();
      const m = main.getBoundingClientRect();
      return {
        sectionWidth: s.width,
        mainWidth: m.width,
        ratio: s.width / m.width,
        maxWidth: getComputedStyle(section).maxWidth,
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics.maxWidth).toBe('none');
    expect(metrics.ratio).toBeGreaterThan(0.92);
    console.log('WIDTH:', JSON.stringify(metrics));
  });

  test('room/time cells match subject row height', async ({ page }) => {
    await login(page);
    await page.waitForTimeout(1500);

    const heights = await page.evaluate(() => {
      const subject = document.querySelector('.scheduleSubjectCell .scheduleCellInner');
      const room = document.querySelector('.scheduleRoomCell .scheduleCellInner');
      const time = document.querySelector('.scheduleTimeCell .scheduleCellInner');
      if (!subject || !room || !time) return null;
      const sh = subject.getBoundingClientRect().height;
      const rh = room.getBoundingClientRect().height;
      const th = time.getBoundingClientRect().height;
      return { subject: sh, room: rh, time: th };
    });

    expect(heights).not.toBeNull();
    expect(Math.abs(heights.subject - heights.room)).toBeLessThanOrEqual(3);
    expect(Math.abs(heights.subject - heights.time)).toBeLessThanOrEqual(3);
    console.log('HEIGHTS:', JSON.stringify(heights));
  });

  test('reset lane widths stays stable across multiple clicks', async ({ page }) => {
    await login(page);
    await page.getByRole('tab', { name: /Operations/i }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId('operations-board-page')).toBeVisible({ timeout: 20000 });

    const resetBtn = page.getByTestId('operations-board-reset-lanes');
    await expect(resetBtn).toBeVisible({ timeout: 15000 });

    const widths = [];
    for (let i = 0; i < 4; i += 1) {
      await resetBtn.click();
      await page.waitForTimeout(400);
      const w = await page.evaluate(() => {
        const grid = document.querySelector('.operations-board-kanban > div')
          || document.querySelector('[class*="grid-flow-col"]');
        const viewport = document.querySelector('.operations-board-viewport');
        if (!grid) return null;
        const g = grid.getBoundingClientRect();
        const v = viewport?.getBoundingClientRect();
        return {
          gridWidth: g.width,
          viewportWidth: v?.width ?? 0,
          cssColumns: getComputedStyle(grid).gridTemplateColumns,
        };
      });
      widths.push(w);
    }

    expect(widths.every(Boolean)).toBeTruthy();
    const gridWidths = widths.map((w) => w.gridWidth);
    const maxDelta = Math.max(...gridWidths) - Math.min(...gridWidths);
    expect(maxDelta).toBeLessThanOrEqual(4);
    console.log('LANE_RESET:', JSON.stringify(widths));
  });

  test('calendar shows 5:00 AM as first time slot', async ({ page }) => {
    await login(page);
    await page.getByRole('tab', { name: /Operations/i }).click();
    await page.waitForTimeout(1500);
    await page.getByTestId('operations-board-tab-calendar').click();
    await expect(page.getByTestId('operations-board-schedule-calendar')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    const timeLabels = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.rbc-time-gutter .rbc-label'))
        .map((el) => el.textContent?.trim())
        .filter(Boolean),
    );

    expect(timeLabels.length).toBeGreaterThan(0);
    const first = timeLabels[0];
    expect(first).toMatch(/5:00|05:00|5:00 AM|05:00 AM|٥:٠٠/i);
    expect(first).not.toMatch(/12:00 AM|00:00|٠٠:٠٠/i);
    console.log('CALENDAR_TIMES:', timeLabels.slice(0, 5));
  });
});
