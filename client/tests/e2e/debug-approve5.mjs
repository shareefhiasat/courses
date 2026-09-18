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

// Pick the first first-warning row that is not already approved (pick by order)
const rows = await page.locator('tbody tr').all();
let targetBtn = null;
for (const row of rows) {
  const text = await row.textContent();
  if (text && text.includes('First Warning')) {
    targetBtn = await row.locator('[data-testid="violations-review-action"]').first();
    break;
  }
}
if (!targetBtn) {
  targetBtn = await page.locator('[data-testid="violations-review-action"]').first();
}
await targetBtn.click();
await page.waitForTimeout(1500);

// If there are pending review rows, select all and approve
const pending = await page.locator('[role="dialog"] .MuiCheckbox-root').count();
if (pending > 0) {
  const selectAll = page.locator('[role="dialog"] .MuiCheckbox-root').first();
  await selectAll.click();
  await page.waitForTimeout(600);

  const approveBtn = page.locator('[role="dialog"] button:has-text("Approve")').first();
  if (await approveBtn.isEnabled().catch(() => false)) {
    await approveBtn.click();
    await page.waitForTimeout(4000);
  }
}

await page.screenshot({ path: '/tmp/violations-approve5.png', fullPage: false });
console.log('Screenshot saved to /tmp/violations-approve5.png');
await browser.close();
