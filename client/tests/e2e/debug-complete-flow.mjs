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

let bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
if (bodyText.includes('Cyber Diploma')) {
  await page.locator('text=Cyber Diploma').first().click();
  await page.waitForTimeout(3000);
}
bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
if (bodyText.includes('Fall 2027')) {
  await page.locator('text=Fall 2027').first().click();
  await page.waitForTimeout(3000);
}

await page.waitForTimeout(8000);

const bodyText2 = await page.evaluate(() => document.body.innerText.slice(0, 500));
console.log('After program/term:', bodyText2);
console.log('URL:', page.url());

const rows = await page.locator('tbody tr').all();
console.log('Rows:', rows.length);
for (const row of rows) {
  console.log('ROW:', (await row.textContent()).slice(0, 120));
}

if (rows.length === 0) {
  await page.screenshot({ path: '/tmp/violations-no-rows.png', fullPage: false });
  console.log('Saved /tmp/violations-no-rows.png');
} else {
  const firstReview = page.locator('tr:has-text("First Warning") [data-testid="violations-review-action"]').first();
  const count = await firstReview.count();
  if (count > 0) {
    await firstReview.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/violations-review-design.png', fullPage: false });
    console.log('Saved /tmp/violations-review-design.png');
  } else {
    await page.screenshot({ path: '/tmp/violations-table.png', fullPage: false });
    console.log('Saved /tmp/violations-table.png');
  }
}

await browser.close();
