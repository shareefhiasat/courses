import { chromium } from 'playwright';

const URL = 'https://localhost:5174/welcome?programId=5&termId=6&tab=schedule&date=2026-08-05&lane=status&classId=62&workflowId=39';
const EMAIL = 'all.admin@example.com';
const PASSWORD = 'Jordan123$';
const SELECTION = JSON.stringify({ program: { id: 5, name: 'Cyber Diploma', code: 'CY-DIP' }, academicTerm: { id: 6, name: 'Fall 2027' } });

const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP localhost 127.0.0.1', '--allow-running-insecure-content'],
});
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 900 },
});
await context.addInitScript((sel) => {
  try { sessionStorage.setItem('welcome_selection', sel); } catch {}
}, SELECTION);
const page = await context.newPage();

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);

let url = page.url();
if (url.includes('8080') || url.includes('keycloak') || url.includes('auth')) {
  await page.locator('input[name="username"], input#username').first().fill(EMAIL);
  await page.locator('input[name="password"], input#password').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.toString().includes('8080') && !u.toString().includes('keycloak'), { timeout: 45000 });
}

const finish = page.locator('button:has-text("Finish"), button:has-text("Skip")').first();
if (await finish.isVisible().catch(() => false)) await finish.click();

await page.waitForTimeout(3000);

const cell = page.locator('text=Dr Hana Al-Ghamdi').first().locator('xpath=ancestor::td[1]');
const styles = await cell.evaluate((el) => {
  const inner = el.querySelector('div');
  const span = inner ? inner.querySelector('span') : null;
  const spanRect = span ? span.getBoundingClientRect() : null;
  return {
    tdHeight: el.getBoundingClientRect().height,
    innerHeight: inner ? inner.getBoundingClientRect().height : null,
    innerMinHeight: inner ? getComputedStyle(inner).minHeight : null,
    innerPaddingTop: inner ? getComputedStyle(inner).paddingTop : null,
    innerPaddingBottom: inner ? getComputedStyle(inner).paddingBottom : null,
    innerLineHeight: inner ? getComputedStyle(inner).lineHeight : null,
    innerFontSize: inner ? getComputedStyle(inner).fontSize : null,
    spanMarginBottom: span ? getComputedStyle(span).marginBottom : null,
    spanWhiteSpace: span ? getComputedStyle(span).whiteSpace : null,
    spanHeight: spanRect ? spanRect.height : null,
    spanWidth: spanRect ? spanRect.width : null,
    spanHTML: span ? span.innerHTML : null,
  };
});
console.log('Instructor cell computed styles:', JSON.stringify(styles, null, 2));

await page.screenshot({ path: '/tmp/schedule-instructor.png', fullPage: false });
console.log('saved /tmp/schedule-instructor.png');
await browser.close();
