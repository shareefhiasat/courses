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
page.on('console', msg => console.log(`[console ${msg.type()}]`, msg.text()));
page.on('pageerror', err => console.log(`[pageerror]`, err.message));
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
let url = page.url();
if (url.includes('8080') || url.includes('keycloak') || url.includes('auth')) {
  await page.locator('input[name="username"], input#username').first().fill(EMAIL);
  await page.locator('input[name="password"], input#password').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.toString().includes('8080') && !u.toString().includes('keycloak'), { timeout: 60000 });
}
await page.waitForTimeout(5000);
await page.screenshot({ path: '/tmp/schedule-debug.png', fullPage: true });
await browser.close();
