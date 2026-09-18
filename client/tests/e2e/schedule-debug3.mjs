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
const requests = [];
page.on('request', (r) => requests.push(r.url()));
page.on('response', (r) => { if (r.status() >= 400) console.log('RESPONSE ERROR', r.status(), r.url()); });
page.on('console', (msg) => console.log('CONSOLE:', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
await page.goto(URL, { waitUntil: 'networkidle', timeout: 120000 });
let url = page.url();
console.log('URL after goto:', url);
if (url.includes('8080') || url.includes('keycloak') || url.includes('auth')) {
  await page.locator('input[name="username"], input#username').first().fill(EMAIL);
  await page.locator('input[name="password"], input#password').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.toString().includes('8080') && !u.toString().includes('keycloak'), { timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 120000 });
}
const visible = await page.locator('text=Dr Hana Al-Ghamdi').first().isVisible().catch(() => false);
console.log('visible:', visible);
console.log('requests:', requests.slice(-20));
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
console.log('body text:', bodyText);
await page.screenshot({ path: '/tmp/schedule-debug3.png', fullPage: false });
console.log('saved /tmp/schedule-debug3.png');
await browser.close();
