import { chromium } from 'playwright';
const URL = 'https://localhost:5174/welcome?programId=5&termId=6&tab=violations&date=2026-08-26';
const EMAIL = 'all.admin@example.com';
const PASSWORD = 'Jordan123$';

const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP localhost 127.0.0.1', '--allow-running-insecure-content'],
});
const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on('console', (msg) => console.log('BROWSER:', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('BROWSER ERROR:', err.message));
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
let url = page.url();
if (url.includes('8080') || url.includes('keycloak')) {
  await page.locator('input[name="username"], input#username').first().fill(EMAIL);
  await page.locator('input[name="password"], input#password').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.toString().includes('8080') && !u.toString().includes('keycloak'), { timeout: 45000 });
  await page.waitForTimeout(3000);
  await page.waitForLoadState('domcontentloaded');
}

for (let i = 0; i < 3; i++) {
  try {
    await page.evaluate(() => {
      const selection = { program: { id: 5, name: 'Cyber Diploma', code: 'CY-DIP' }, academicTerm: { id: 6, name: 'Fall 2027' } };
      sessionStorage.setItem('welcome_selection', JSON.stringify(selection));
      localStorage.setItem('welcomeTourSeen_en', 'true');
      localStorage.setItem('welcomeTourSeen_ar', 'true');
      localStorage.setItem('violationsTourSeen_en', 'true');
      localStorage.setItem('violationsTourSeen_ar', 'true');
      localStorage.setItem('violations_tab_sort', JSON.stringify({ sortBy: 'system', sortKey: null, sortDir: 'asc' }));
    });
    break;
  } catch (e) {
    if (i === 2) throw e;
    await page.waitForTimeout(1000);
  }
}

page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('attendance-deduction') || url.includes('absence-warning-counts') || url.includes('class-attendance-weeks')) {
    try {
      const body = await response.json();
      console.log('violations API response:', url.split('?')[0].split('/').pop(), response.status(), JSON.stringify(body).slice(0, 500));
    } catch (e) {
      console.log('violations API non-json response:', url.split('?')[0].split('/').pop(), response.status(), await response.text().slice(0, 200));
    }
  }
});

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(10000);

// Capture table view before switching to calendar
await page.screenshot({ path: '/tmp/violations-table-day.png', fullPage: false });
console.log('Saved /tmp/violations-table-day.png');

// Switch to week view via the unified top date controls
const weekToggle = page.locator('button:has-text("Week")').first();
if (await weekToggle.count() > 0) {
  await weekToggle.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/violations-table-week.png', fullPage: false });
  console.log('Saved /tmp/violations-table-week.png');
} else {
  console.log('Week toggle not visible');
}

// Verify week spinner: open the select and choose the first real week
const weekSelect = page.locator('[data-testid="violations-week-select"] [role="button"]').first();
if (await weekSelect.count() > 0) {
  await weekSelect.click();
  await page.waitForTimeout(300);
  const firstWeek = page.locator('[data-testid^="option-"]:not([data-testid="option-all"])').first();
  if (await firstWeek.count() > 0) {
    await firstWeek.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/violations-table-week-filtered.png', fullPage: false });
    console.log('Saved /tmp/violations-table-week-filtered.png');
  } else {
    await page.screenshot({ path: '/tmp/violations-week-dropdown.png', fullPage: false });
    console.log('Saved /tmp/violations-week-dropdown.png');
    await page.keyboard.press('Escape');
  }
} else {
  console.log('Week spinner not visible');
}

// Wait for the view toggle to be present; it may take a while for data to load
const calendarTab = page.locator('[data-testid="violations-view-mode"] button[aria-label="Calendar"]').first();
try {
  await calendarTab.waitFor({ timeout: 15000 });
} catch (e) {
  console.log('Calendar tab not present after wait; URL:', page.url());
  console.log('violations-view-mode count:', await page.locator('[data-testid="violations-view-mode"]').count());
  console.log('Calendar button count:', await calendarTab.count());
  await page.screenshot({ path: '/tmp/violations-page-debug.png', fullPage: false });
  console.log('Saved /tmp/violations-page-debug.png for debugging');
  throw new Error('Calendar tab not found');
}

// Click Calendar icon
if (await calendarTab.count() > 0) {
  await calendarTab.click();
  await page.waitForTimeout(3000);

  // Wait for calendar events, but don't fail if the default student has none (e.g., only late)
  try {
    await page.waitForSelector('.rbc-event-content, .rbc-event, .rbc-event-label', { timeout: 5000 });
  } catch (e) {
    console.log('No calendar events visible for default student (expected if all records are late/standup-late).');
  }
  await page.screenshot({ path: '/tmp/violations-calendar-month.png', fullPage: false });
  console.log('Saved /tmp/violations-calendar-month.png');

  // Select a student with mixed absence types to verify tooltip/day card colors
  const studentSelect = page.locator('[data-testid="violation-student-select"] [role="button"]').first();
  if (await studentSelect.count() > 0) {
    await studentSelect.click();
    await page.waitForTimeout(300);
    const searchInput = page.locator('input[placeholder="Search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Ahmed Khalid');
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/violations-student-dropdown.png', fullPage: false });
      console.log('Saved /tmp/violations-student-dropdown.png');
      const firstOption = page.locator('[data-testid^="option-"]').first();
      if (await firstOption.count() > 0) {
        await firstOption.click();
        await page.waitForTimeout(3000);
      }
    }
  }

  try {
    await page.waitForSelector('.rbc-event-content, .rbc-event, .rbc-event-label', { timeout: 5000 });
  } catch (e) {
    console.log('No calendar events visible after switching student.');
  }
  await page.screenshot({ path: '/tmp/violations-calendar-month-mixed.png', fullPage: false });
  console.log('Saved /tmp/violations-calendar-month-mixed.png');

  // Hover a few calendar events and capture tooltips to verify per-type colors
  const eventCount = await page.locator('.rbc-event-content, .rbc-event, .rbc-event-label').count();
  for (let i = 0; i < Math.min(5, eventCount); i += 1) {
    const event = page.locator('.rbc-event-content, .rbc-event, .rbc-event-label').nth(i);
    await event.hover();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `/tmp/violations-calendar-tooltip-${i + 1}.png`, fullPage: false });
    console.log(`Saved /tmp/violations-calendar-tooltip-${i + 1}.png`);
  }

  // Hover specific colored events to verify all tooltip colors
  for (const { cls, label } of [
    { cls: 'rbc-event--ATTENDANCE_ABSENT', label: 'absent' },
    { cls: 'rbc-event--ATTENDANCE_LATE', label: 'late' },
    { cls: 'rbc-event--ATTENDANCE_LEAVE', label: 'excused' },
    { cls: 'rbc-event--ATTENDANCE_HUMAN_CASE', label: 'human' },
  ]) {
    const specificEvent = page.locator(`.rbc-event.${cls}`).first();
    if (await specificEvent.count() > 0) {
      await specificEvent.hover();
      await page.waitForTimeout(600);
      await page.screenshot({ path: `/tmp/violations-tooltip-${label}.png`, fullPage: false });
      console.log(`Saved /tmp/violations-tooltip-${label}.png`);
    }
  }

  // Switch to week view
  const weekBtn = page.locator('button[title="Week"]').first();
  if (await weekBtn.count() > 0) {
    await weekBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/violations-calendar-week.png', fullPage: false });
    console.log('Saved /tmp/violations-calendar-week.png');
  }

  // Switch to day view
  const dayBtn = page.locator('button[title="Day"]').first();
  if (await dayBtn.count() > 0) {
    await dayBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/violations-calendar-day.png', fullPage: false });
    console.log('Saved /tmp/violations-calendar-day.png');
  }

  // Switch back to table view to verify view icons
  const tableIcon = page.locator('[data-testid="violations-view-mode"] button[aria-label="Table"]').first();
  if (await tableIcon.count() > 0) {
    await tableIcon.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/violations-table-view.png', fullPage: false });
    console.log('Saved /tmp/violations-table-view.png');

    // Toggle expand on the violations page (JS click to bypass overlapping floaters)
    const expandBtn = await page.locator('[data-testid="violations-expand"]').first();
    if (await expandBtn.count() > 0) {
      await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="violations-expand"]');
        if (btn) btn.click();
      });
      await page.waitForTimeout(1500);
      console.log('Expanded URL:', await page.url());
      await page.screenshot({ path: '/tmp/violations-expanded-view.png', fullPage: false });
      console.log('Saved /tmp/violations-expanded-view.png');
      // Collapse back
      await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="violations-expand"]');
        if (btn) btn.click();
      });
      await page.waitForTimeout(1500);
    }

    // Open Ahmed Khalid's review dialog to verify the updated UI
    const searchInput = page.locator('[data-testid="violations-search"] input').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Ahmed Khalid');
      await page.waitForTimeout(1000);
      const reviewBtn = page.locator('[data-testid="violations-review-action"]').first();
      if (await reviewBtn.count() > 0) {
        await reviewBtn.click();
        await page.waitForTimeout(2000);
        const dialogPaper = page.locator('.MuiDialog-paper').first();
        if (await dialogPaper.count() > 0) {
          await dialogPaper.screenshot({ path: '/tmp/violations-review-dialog.png' });
          console.log('Saved /tmp/violations-review-dialog.png');

          // Click Preview to generate and capture the first-warning PDF
          const previewBtn = page.locator('button:has-text("Preview")').first();
          if (await previewBtn.count() > 0) {
            const [previewPage] = await Promise.all([
              context.waitForEvent('page'),
              previewBtn.click(),
            ]);
            await previewPage.waitForLoadState('domcontentloaded', { timeout: 15000 });
            await previewPage.waitForTimeout(4000);
            await previewPage.screenshot({ path: '/tmp/violations-first-warning-preview.png', fullPage: true });
            console.log('Saved /tmp/violations-first-warning-preview.png');
          }
        }
      }
    }
  }

  // Switch to a student with all-pending events to verify the clock icon
  const calendarTab2 = page.locator('[data-testid="violations-view-mode"] button[aria-label="Calendar"]').first();
  if (await calendarTab2.count() > 0) {
    await calendarTab2.click();
    await page.waitForTimeout(2000);

    const studentInput2 = page.locator('[data-testid="violation-student-select"] input').first();
    if (await studentInput2.count() > 0) {
      await studentInput2.click();
      await studentInput2.fill('Turki');
      await page.waitForTimeout(500);
      const option2 = page.locator('[role="option"]').first();
      if (await option2.count() > 0) {
        await option2.click();
        await page.waitForTimeout(3000);
        await page.waitForSelector('.rbc-event-content, .rbc-event, .rbc-event-label', { timeout: 5000 });
        await page.screenshot({ path: '/tmp/violations-calendar-month-pending.png', fullPage: false });
        console.log('Saved /tmp/violations-calendar-month-pending.png');

        // Hover an absent event to verify the pending tooltip
        const pendingAbsent = page.locator('.rbc-event.rbc-event--ATTENDANCE_ABSENT').first();
        if (await pendingAbsent.count() > 0) {
          await pendingAbsent.hover();
          await page.waitForTimeout(600);
          await page.screenshot({ path: '/tmp/violations-tooltip-pending.png', fullPage: false });
          console.log('Saved /tmp/violations-tooltip-pending.png');
        }
      }
    }
  }
} else {
  console.log('Calendar tab not found');
}

// Quick operations week view color check
await page.goto('https://localhost:5174/welcome?programId=5&termId=6&tab=operations&date=2026-08-26', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(10000);
const opsWeekToggle = page.locator('button:has-text("Week")').first();
if (await opsWeekToggle.count() > 0) {
  await opsWeekToggle.click({ force: true });
  await page.waitForTimeout(2000);
}
await page.screenshot({ path: '/tmp/operations-table-week.png', fullPage: false });
console.log('Saved /tmp/operations-table-week.png');

await browser.close();
