import { chromium } from 'playwright';
const URL = 'https://localhost:5174/welcome?programId=5&termId=6&tab=violations&classId=60&date=2026-08-24';
const EMAIL = 'cy.instructor1@example.com';
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

const dims = await page.evaluate(() => {
  const top = document.querySelector('[data-tour="violations-filter-bar"]')?.parentElement;
  const chipContainer = document.querySelector('[data-tour="violations-filter-bar"]');
  const chips = chipContainer?.firstElementChild;
  return {
    topBarWidth: top?.getBoundingClientRect().width,
    chipContainerWidth: chipContainer?.getBoundingClientRect().width,
    chipsRootWidth: chips?.getBoundingClientRect().width,
    chipsRootComputed: window.getComputedStyle(chips)?.width,
    chipsRootFlex: window.getComputedStyle(chips)?.flex,
    chipContainerFlex: window.getComputedStyle(chipContainer)?.flex,
  };
});
console.log(JSON.stringify(dims, null, 2));

await browser.close();
