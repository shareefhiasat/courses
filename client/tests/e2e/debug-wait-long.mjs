import { chromium } from 'playwright';
const URL = 'https://localhost:5174/welcome?programId=5&termId=6&tab=violations&classId=60&date=2026-08-24';
const EMAIL = 'all.admin@example.com';
const PASSWORD = 'Jordan123$';
const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP localhost 127.0.0.1', '--allow-running-insecure-content'],
});
const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on('console', (msg) => console.log('CONSOLE:', msg.type(), msg.text().slice(0, 120)));
page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
let url = page.url();
if (url.includes('8080') || url.includes('keycloak')) {
  await page.locator('input[name="username"], input#username').first().fill(EMAIL);
  await page.locator('input[name="password"], input#password').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.toString().includes('8080') && !u.toString().includes('keycloak'), { timeout: 45000 });
  await page.waitForTimeout(5000);
}
await page.evaluate(() => {
  localStorage.setItem('welcomeTourSeen_en', 'true');
  localStorage.setItem('welcomeTourSeen_ar', 'true');
  localStorage.setItem('violationsTourSeen_en', 'true');
  localStorage.setItem('violationsTourSeen_ar', 'true');
});
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(15000);

const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 1000));
console.log('BODY:', bodyText);

const rows = await page.locator('tbody tr').all();
console.log('Rows:', rows.length);

if (rows.length > 0) {
  const firstReview = page.locator('tr:has-text("First Warning") [data-testid="violations-review-action"]').first();
  const count = await firstReview.count();
  if (count > 0) {
    await firstReview.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/violations-review-design.png', fullPage: false });
    console.log('Saved /tmp/violations-review-design.png');
  }
}

await page.screenshot({ path: '/tmp/violations-page-wait.png', fullPage: false });
console.log('Saved /tmp/violations-page-wait.png');

await browser.close();
