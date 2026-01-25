// End-to-end login test scaffold using Playwright
// Credentials are read from environment variables for safety.
import { test, expect } from '@playwright/test';

test('login with env credentials', async ({ page }) => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;

  // Navigate to the application's login page
  await page.goto(baseURL);

  // Adjust selectors to match your app's actual login form
  await page.fill('input[name="email"]', username ?? '');
  await page.fill('input[name="password"]', password ?? '');
  await Promise.all([
    page.waitForNavigation({ url: '**/*' }),
    page.click('button[type="submit"]'),
  ]);

  // Basic assertion to ensure login redirected somewhere expected
  await expect(page).toHaveURL(/.*(dashboard|home|profile).*/i);
});
