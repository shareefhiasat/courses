import { chromium } from 'playwright';

const URL = 'https://localhost:5174/welcome?programId=5&termId=6&tab=schedule&date=2026-08-05&lane=status&classId=62&workflowId=39';
const EMAIL = 'all.admin@example.com';
const PASSWORD = 'Jordan123$';
const SELECTION = JSON.stringify({ program: { id: 5, name: 'Cyber Diploma', code: 'CY-DIP' }, academicTerm: { id: 6, name: 'Fall 2027' } });

const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP localhost 127.0.0.1', '--allow-running-insecure-content'],
});
const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
await context.addInitScript((sel) => { try { sessionStorage.setItem('welcome_selection', sel); } catch {} }, SELECTION);
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

const info = await page.evaluate(() => {
  const td = [...document.querySelectorAll('td')].find(d => d.textContent.includes('Dr Hana Al-Ghamdi'));
  if (!td) return null;
  const inner = td.querySelector('div');
  const span = inner.querySelector('span');
  const textNode = span?.childNodes[0];
  const button = span?.querySelector('button');
  const range = document.createRange();
  if (textNode) range.selectNodeContents(textNode);
  const textBox = range.getBoundingClientRect();
  const buttonBox = button?.getBoundingClientRect();
  return {
    spanBox: span.getBoundingClientRect(),
    textBox: { width: textBox?.width, height: textBox?.height, top: textBox?.top, left: textBox?.left },
    buttonBox: buttonBox ? { width: buttonBox.width, height: buttonBox.height, top: buttonBox.top, left: buttonBox.left } : null,
    spanComputed: {
      whiteSpace: getComputedStyle(span).whiteSpace,
      display: getComputedStyle(span).display,
      flexDirection: getComputedStyle(span).flexDirection,
      alignItems: getComputedStyle(span).alignItems,
      justifyContent: getComputedStyle(span).justifyContent,
      flexWrap: getComputedStyle(span).flexWrap,
      width: getComputedStyle(span).width,
      minWidth: getComputedStyle(span).minWidth,
    },
    textNodeData: textNode?.data,
    innerHTML: span.innerHTML,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
