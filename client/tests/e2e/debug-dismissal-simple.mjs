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
console.log('Rows:', rows.length);
let targetBtn = null;
for (const row of rows) {
  const text = await row.textContent();
  if (text && text.includes('View Dismissal')) {
    targetBtn = await row.locator('button').first();
    console.log('Found view dismissal row:', text.slice(0, 80));
    break;
  }
}
if (!targetBtn) {
  console.log('No View Dismissal row found, using fallback');
  targetBtn = await page.locator('button:has-text("View Dismissal")').first();
}
await targetBtn.click();
await page.waitForTimeout(3000);

const title = await page.locator('[role="dialog"] h2').first().textContent();
console.log('Dialog title:', title?.slice(0, 80));
await page.screenshot({ path: '/tmp/violations-dismissal-dialog.png', fullPage: false });
console.log('Saved /tmp/violations-dismissal-dialog.png');

const previewBtn = page.locator('[role="dialog"] button:has-text("Preview")').first();
console.log('Preview visible:', await previewBtn.isVisible().catch(() => false));

await browser.close();
