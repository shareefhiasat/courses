import { chromium } from 'playwright';
const URL = 'https://localhost:5174/welcome?programId=5&termId=6&tab=violations&classId=60&date=2026-08-24';
const EMAIL = 'all.admin@example.com';
const PASSWORD = 'Jordan123$';
const browser = await chromium.launch({ headless: true, args: ['--host-resolver-rules=MAP localhost 127.0.0.1'] });
const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
let url = page.url();
if (url.includes('8080') || url.includes('keycloak')) {
  await page.locator('input[name="username"], input#username').first().fill(EMAIL);
  await page.locator('input[name="password"], input#password').first().fill(PASSWORD);
  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await page.waitForURL((u) => !u.toString().includes('8080') && !u.toString().includes('keycloak'), { timeout: 45000 });
  await page.waitForTimeout(3000);
}
let bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
if (bodyText.includes('Select Program')) { await page.locator('text=Cyber Diploma').first().click(); await page.waitForTimeout(3000); }
bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
if (bodyText.includes('Select Semester')) { await page.locator('text=Fall 2027').first().click(); await page.waitForTimeout(3000); }
await page.evaluate(() => {
  localStorage.setItem('welcomeTourSeen_en', 'true');
  localStorage.setItem('welcomeTourSeen_ar', 'true');
  localStorage.setItem('violationsTourSeen_en', 'true');
  localStorage.setItem('violationsTourSeen_ar', 'true');
});
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);

const rows = await page.locator('tbody tr').all();
let targetBtn = null;
for (const row of rows) {
  const text = await row.textContent();
  if (text && text.includes('Review & Issue') && !text.includes('View Dismissal')) {
    targetBtn = await row.locator('button').first();
    console.log('Found row:', text.slice(0, 80));
    break;
  }
}
if (!targetBtn) targetBtn = await page.locator('button:has-text("Review & Issue")').first();
await targetBtn.click();
await page.waitForTimeout(3000);

await page.screenshot({ path: '/tmp/violations-issue-before.png', fullPage: false });

await page.locator('[role="dialog"] button:has-text("Issue 1st warning")').first().click();
await page.waitForTimeout(3000);

await page.screenshot({ path: '/tmp/violations-issue-toast.png', fullPage: false });
console.log('Saved screenshots');

await browser.close();
