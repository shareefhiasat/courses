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
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
let url = page.url();
if (url.includes('8080') || url.includes('keycloak')) {
  await page.locator('input[name="username"], input#username').first().fill(EMAIL);
  await page.locator('input[name="password"], input#password').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.toString().includes('8080') && !u.toString().includes('keycloak'), { timeout: 45000 });
  await page.waitForTimeout(3000);
}
await page.evaluate(() => {
  localStorage.setItem('welcomeTourSeen_en', 'true');
  localStorage.setItem('welcomeTourSeen_ar', 'true');
  localStorage.setItem('violationsTourSeen_en', 'true');
  localStorage.setItem('violationsTourSeen_ar', 'true');
});
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(10000);

await page.screenshot({ path: '/tmp/violations-page-state.png', fullPage: false });

const bodyText = await page.evaluate(() => document.body.innerText);
console.log('BODY:', bodyText.slice(0, 1000));

const rows = await page.locator('tbody tr').all();
console.log('Rows:', rows.length);
for (const row of rows) {
  const text = await row.textContent();
  console.log('ROW:', text.slice(0, 120));
}

await browser.close();
