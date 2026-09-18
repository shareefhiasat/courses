import { chromium } from 'playwright';

const BASE = 'https://localhost:5174';
const EMAIL = 'cy.instructor1@example.com';
const PASSWORD = 'Jordan123$';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--host-resolver-rules=MAP localhost 127.0.0.1'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Navigate to welcome page with violations view
  console.log('Navigating to:', `${BASE}/welcome?programId=5&termId=6&date=2026-07-09&tab=overview&view=violations`);
  await page.goto(`${BASE}/welcome?programId=5&termId=6&date=2026-07-09&tab=overview&view=violations`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(3000);

  console.log('URL after initial load:', page.url());

  // Handle Keycloak login if redirected
  let url = page.url();
  if (url.includes('8080') || url.includes('keycloak')) {
    console.log('Keycloak login page detected, filling credentials...');
    await page.locator('input[name="username"], input#username').first().fill(EMAIL);
    await page.locator('input[name="password"], input#password').first().fill(PASSWORD);
    await page.locator('button[type="submit"], input[type="submit"]').first().click();
    await page.waitForURL((u) => !u.toString().includes('8080') && !u.toString().includes('keycloak'), {
      timeout: 45000,
    });
    await page.waitForLoadState('networkidle').catch(() => {});
    console.log('After login URL:', page.url());

    // Keycloak may redirect back to localhost — that's fine, continue
    await page.waitForTimeout(2000);
  }

  // Wait for app to fully render
  await page.waitForTimeout(5000);
  console.log('Final URL:', page.url());

  // Check if we got redirected back to welcome with correct params
  const finalUrl = page.url();
  if (!finalUrl.includes('view=violations')) {
    console.log('Redirected, navigating again with violations params...');
    await page.goto(`${BASE}/welcome?programId=5&termId=6&date=2026-07-09&tab=overview&view=violations`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);
    console.log('After re-nav URL:', page.url());
  }

  // Check if we're on the program selection screen
  const bodyText1 = await page.evaluate(() => document.body.innerText.slice(0, 500));
  if (bodyText1.includes('Select Program') || bodyText1.includes('Tap a program')) {
    console.log('On program selection screen, clicking Cyber Diploma...');
    // Click on the Cyber Diploma program card
    const programCard = page.locator('text=Cyber Diploma').first();
    await programCard.click();
    await page.waitForTimeout(5000);
    console.log('After program click URL:', page.url());
  }

  // Check if we're on the semester selection screen
  const bodyText2 = await page.evaluate(() => document.body.innerText.slice(0, 500));
  if (bodyText2.includes('Select Semester') || bodyText2.includes('Choose the academic term')) {
    console.log('On semester selection screen, clicking Fall 2027...');
    const termCard = page.locator('text=Fall 2027').first();
    await termCard.click();
    await page.waitForTimeout(5000);
    console.log('After term click URL:', page.url());
  }

  // Now navigate to violations tab
  console.log('Navigating to violations tab...');
  await page.goto(`${BASE}/welcome?programId=5&termId=6&date=2026-07-09&tab=overview&view=violations`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(5000);
  console.log('After violations nav URL:', page.url());

  // Take full page screenshot
  await page.screenshot({ path: '/tmp/violations-full.png', fullPage: false });
  console.log('Screenshot saved to /tmp/violations-full.png');

  // Also take a screenshot of just the violations content area
  const violationsTab = await page.locator('[data-testid="operations-board-student-avatar"], table').first();
  if (await violationsTab.isVisible().catch(() => false)) {
    await page.screenshot({ path: '/tmp/violations-table.png', fullPage: true });
    console.log('Table screenshot saved to /tmp/violations-table.png');
  }

  // Get page title and any error messages
  const title = await page.title();
  console.log('Page title:', title);

  // Dump visible body text for debugging
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 2000));
  console.log('Body text (first 2000 chars):', bodyText);

  // Check for error alerts
  const alerts = await page.locator('[role="alert"]').allTextContents();
  console.log('Alerts:', JSON.stringify(alerts));

  // Check what tabs are visible
  const tabs = await page.locator('[role="tab"]').allTextContents();
  console.log('Tabs:', JSON.stringify(tabs));

  // Check for filter chips
  const chips = await page.locator('[class*="chip"], [class*="filter"]').allTextContents();
  console.log('Chips/filters:', JSON.stringify(chips.slice(0, 10)));

  // Check for table headers
  const headers = await page.locator('th').allTextContents();
  console.log('Table headers:', JSON.stringify(headers));

  // Check for legend
  const legend = await page.locator('[class*="legend"], [class*="statusLegend"]').allTextContents();
  console.log('Legend:', JSON.stringify(legend.slice(0, 5)));

  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
