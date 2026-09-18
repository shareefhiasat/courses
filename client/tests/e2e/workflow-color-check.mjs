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
const skip = page.locator('button:has-text("Skip"), button:has-text("Finish")').first();
if (await skip.isVisible().catch(() => false)) await skip.click();
await page.waitForTimeout(3000);

const colors = await page.evaluate(() => {
  const tds = [...document.querySelectorAll('td')].filter(d => d.textContent.includes('Digital Forensics'));
  return tds.map(td => {
    const dot = td.querySelector('span[class*="statusDot_"]');
    const icon = td.querySelector('svg[stroke]');
    return {
      cellText: td.textContent.slice(0, 80),
      dotColor: dot ? getComputedStyle(dot).backgroundColor : null,
      dotClass: dot ? dot.className.split(' ').find(c => c.includes('statusDot_')) : null,
      dotComputedColor: dot ? dot.style.getPropertyValue('--dot-color') : null,
      iconColor: icon ? getComputedStyle(icon).color : null,
      iconStroke: icon ? getComputedStyle(icon).stroke : null,
    };
  });
});
console.log(JSON.stringify(colors, null, 2));
await browser.close();
