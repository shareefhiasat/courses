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

const cell = page.locator('text=Dr Hana Al-Ghamdi').first().locator('xpath=ancestor::td[1]');
const info = await cell.evaluate((td) => {
  const button = td.querySelector('button');
  if (!button) return { error: 'no button' };
  const c = getComputedStyle(button);
  const rules = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText && button.matches(rule.selectorText)) {
          rules.push({
            selector: rule.selectorText,
            padding: rule.style.padding,
            paddingTop: rule.style.paddingTop,
            paddingBottom: rule.style.paddingBottom,
            paddingLeft: rule.style.paddingLeft,
            paddingRight: rule.style.paddingRight,
            minHeight: rule.style.minHeight,
            cssText: rule.style.cssText,
            sheetHref: sheet.href,
          });
        }
      }
    } catch (e) {}
  }
  return {
    density: document.documentElement.dataset.density,
    spacingScale: getComputedStyle(document.documentElement).getPropertyValue('--spacing-scale'),
    buttonClass: button.className,
    padding: c.padding,
    minHeight: c.minHeight,
    rules: rules,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
