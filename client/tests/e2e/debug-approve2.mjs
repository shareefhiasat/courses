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
await page.waitForTimeout(5000);

// Click a student with absences (e.g. row with amber or red status)
const rows = await page.locator('tbody tr').all();
let targetRow = null;
for (const row of rows) {
  const text = await row.textContent();
  if (text && (text.includes('First Warning') || text.includes('Disconnected') || text.includes('Final Warning'))) {
    targetRow = row;
    break;
  }
}
if (!targetRow) targetRow = await page.locator('tbody tr').first();
const reviewBtn = await targetRow.locator('[data-testid="violations-review-action"]').first();
await reviewBtn.click();
await page.waitForTimeout(1200);

// Use JavaScript to check all checkboxes in the dialog
await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]');
  if (dialog) {
    const cbs = dialog.querySelectorAll('input[type="checkbox"]');
    cbs.forEach((cb) => { if (!cb.disabled) cb.click(); });
  }
});
await page.waitForTimeout(600);

// Click Approve button
const approveBtn = page.locator('[role="dialog"] button:has-text("Approve")').first();
if (await approveBtn.isEnabled().catch(() => false)) {
  await approveBtn.click();
  await page.waitForTimeout(1500);
}

await page.screenshot({ path: '/tmp/violations-approve2.png', fullPage: false });
console.log('Screenshot saved to /tmp/violations-approve2.png');
await browser.close();
