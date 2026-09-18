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
  await page.waitForLoadState('domcontentloaded');
}

// Set session selection and disable tours
for (let i = 0; i < 3; i++) {
  try {
    await page.evaluate(() => {
      const selection = { program: { id: 5, name: 'Cyber Diploma', code: 'CY-DIP' }, academicTerm: { id: 6, name: 'Fall 2027' } };
      sessionStorage.setItem('welcome_selection', JSON.stringify(selection));
      localStorage.setItem('welcomeTourSeen_en', 'true');
      localStorage.setItem('welcomeTourSeen_ar', 'true');
      localStorage.setItem('violationsTourSeen_en', 'true');
      localStorage.setItem('violationsTourSeen_ar', 'true');
    });
    break;
  } catch (e) {
    if (i === 2) throw e;
    await page.waitForTimeout(1000);
  }
}

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(10000);

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
  } else {
    console.log('No first warning row');
  }
} else {
  await page.screenshot({ path: '/tmp/violations-no-rows.png', fullPage: false });
  console.log('No rows');
}

await browser.close();
