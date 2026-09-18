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

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(10000);

await page.screenshot({ path: '/tmp/violations-tab-design.png', fullPage: false });
console.log('Saved /tmp/violations-tab-design.png');

const firstRow = page.locator('[data-testid="violations-table"] tbody tr').first();
const fifthRow = page.locator('[data-testid="violations-table"] tbody tr').nth(4);
await firstRow.dragTo(fifthRow);
await page.waitForTimeout(1000);

await page.screenshot({ path: '/tmp/violations-tab-dragged.png', fullPage: false });
console.log('Saved /tmp/violations-tab-dragged.png');

await browser.close();
