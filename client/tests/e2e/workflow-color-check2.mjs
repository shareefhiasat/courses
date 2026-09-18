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
await context.addInitScript((sel) => {
  try {
    sessionStorage.setItem('welcome_selection', sel);
    localStorage.setItem('welcomeTourSeen_en', 'true');
  } catch {}
}, SELECTION);
const page = await context.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);

let url = page.url();
if (url.includes('8080') || url.includes('keycloak') || url.includes('auth')) {
  await page.locator('input[name="username"], input#username').first().waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('input[name="username"], input#username').first().fill(EMAIL);
  await page.locator('input[name="password"], input#password').first().fill(PASSWORD);
  await page.locator('input[type="submit"], button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.toString().includes('8080') && !u.toString().includes('keycloak'), { timeout: 60000 });
}

await page.waitForSelector('table tbody tr', { timeout: 60000 });
await page.waitForTimeout(3000);

const all = await page.evaluate(() => {
  const result = [];
  for (const td of document.querySelectorAll('td')) {
    const iconWrap = td.querySelector('span[class*="workflowIconWrap"]');
    if (!iconWrap) continue;
    const icon = iconWrap.querySelector('svg');
    const fileWrap = td.querySelector('span[class*="attendanceIconWrap"]');
    const fileIcon = fileWrap ? fileWrap.querySelector('svg') : null;
    result.push({
      cellText: td.textContent.slice(0, 80),
      workflowIconColor: icon ? getComputedStyle(icon).stroke : null,
      fileIconColor: fileIcon ? getComputedStyle(fileIcon).stroke : null,
    });
  }
  return result;
});
console.log(JSON.stringify(all, null, 2));

const legend = await page.evaluate(() => {
  const items = [];
  for (const el of document.querySelectorAll('[data-testid^="operations-board-legend-wf-"]')) {
    const icon = el.querySelector('svg');
    items.push({
      id: el.getAttribute('data-testid'),
      color: icon ? getComputedStyle(icon).stroke : null,
      text: el.textContent.trim(),
    });
  }
  return items;
});
console.log('LEGEND:', JSON.stringify(legend, null, 2));

await page.screenshot({ path: '/tmp/schedule-color-check.png', fullPage: true });
await browser.close();
