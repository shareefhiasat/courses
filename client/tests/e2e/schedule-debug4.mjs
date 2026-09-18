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
const responses = [];
page.on('request', (r) => { requests.push({ url: r.url(), method: r.method() }); });
page.on('response', (r) => { responses.push({ url: r.url(), status: r.status() }); });
page.on('console', (msg) => console.log('CONSOLE:', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(15000);
let url = page.url();
console.log('URL:', url);
if (url.includes('8080') || url.includes('keycloak') || url.includes('auth')) {
  await page.locator('input[name="username"], input#username').first().fill(EMAIL);
  await page.locator('input[name="password"], input#password').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  try {
    await page.waitForURL((u) => !u.toString().includes('8080') && !u.toString().includes('keycloak'), { timeout: 60000 });
  } catch (e) { console.log('waitForURL error', e.message); }
  await page.waitForTimeout(15000);
}
console.log('requests:', JSON.stringify(requests.filter(r => r.url.includes('8001') || r.url.includes('8080')), null, 2));
console.log('responses:', JSON.stringify(responses.filter(r => r.url.includes('8001') || r.url.includes('8080')), null, 2));
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
console.log('body:', bodyText);
await page.screenshot({ path: '/tmp/schedule-debug4.png', fullPage: false });
console.log('saved /tmp/schedule-debug4.png');
await browser.close();
