const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/');
  await page.waitForLoadState('networkidle');

  const title = await page.title();
  console.log('Page Title:', title);

  const h1s = await page.locator('h1').allTextContents();
  console.log('H1 headings:', h1s);

  const h2s = await page.locator('h2').allTextContents();
  console.log('H2 headings:', h2s);

  const buttons = await page.locator('button').allTextContents();
  console.log('Visible buttons:', buttons);

  const links = await page.locator('a').allTextContents();
  console.log('Visible links:', links);

  // For layout, count some elements
  const divCount = await page.locator('div').count();
  console.log('Number of divs:', divCount);

  const imgCount = await page.locator('img').count();
  console.log('Number of images:', imgCount);

  // Get viewport size
  const viewport = page.viewportSize();
  console.log('Viewport size:', viewport);

  await browser.close();
})();
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/');
  await page.waitForLoadState('networkidle');

  const title = await page.title();
  console.log('Page Title:', title);

  const h1s = await page.locator('h1').allTextContents();
  console.log('H1 headings:', h1s);

  const h2s = await page.locator('h2').allTextContents();
  console.log('H2 headings:', h2s);

  const buttons = await page.locator('button').allTextContents();
  console.log('Visible buttons:', buttons);

  const links = await page.locator('a').allTextContents();
  console.log('Visible links:', links);

  // For layout, count some elements
  const divCount = await page.locator('div').count();
  console.log('Number of divs:', divCount);

  const imgCount = await page.locator('img').count();
  console.log('Number of images:', imgCount);

  // Get viewport size
  const viewport = page.viewportSize();
  console.log('Viewport size:', viewport);

  await browser.close();
})();
