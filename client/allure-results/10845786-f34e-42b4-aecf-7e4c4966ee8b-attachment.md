# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ai-assistant-manual.spec.js >> AI Assistant — greetings and queries >> AI assistant greets and answers a query
- Location: tests/e2e/specs/ai-assistant-manual.spec.js:55:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at https://localhost:5174/welcome
Call log:
  - navigating to "https://localhost:5174/welcome", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Manual AI Assistant verification using user-provided admin credentials.
  3  |  * Logs in via Keycloak, opens the AI assistant, sends a greeting and a data query.
  4  |  */
  5  | import { test, expect } from '@playwright/test';
  6  | 
  7  | const BASE_URL = 'https://localhost:5174';
  8  | const USER = {
  9  |   email: 'all.admin@example.com',
  10 |   password: 'Jordan123$',
  11 | };
  12 | 
  13 | async function login(page) {
> 14 |   await page.goto(`${BASE_URL}/welcome`);
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at https://localhost:5174/welcome
  15 |   await page.waitForLoadState('networkidle');
  16 | 
  17 |   // Wait for Keycloak redirect
  18 |   await page.waitForURL((url) => url.toString().includes('keycloak') || url.toString().includes('8080'), {
  19 |     timeout: 20000,
  20 |   });
  21 | 
  22 |   await page.locator('input[name="username"], input[type="email"], input#username').first().fill(USER.email);
  23 |   await page.locator('input[name="password"], input[type="password"], input#password').first().fill(USER.password);
  24 |   await page.locator('button[type="submit"], input[type="submit"]').first().click();
  25 | 
  26 |   // Wait for redirect back to the app
  27 |   await page.waitForURL((url) => !url.toString().includes('keycloak') && !url.toString().includes('8080'), {
  28 |     timeout: 30000,
  29 |   });
  30 |   await page.waitForLoadState('networkidle');
  31 | }
  32 | 
  33 | async function maybeSkipTour(page) {
  34 |   await page.waitForTimeout(1500);
  35 |   await page.evaluate(() => {
  36 |     const buttons = Array.from(document.querySelectorAll('button, [role="button"], .MuiButtonBase-root'));
  37 |     const skip = buttons.find((b) => b.textContent?.includes('Skip'));
  38 |     if (skip) skip.click();
  39 |   });
  40 |   await page.waitForTimeout(800);
  41 | }
  42 | 
  43 | async function openAiDialog(page) {
  44 |   await maybeSkipTour(page);
  45 |   const aiButton = page.locator('[data-testid="ai-assistant-fab"]').first();
  46 |   await expect(aiButton).toBeVisible({ timeout: 15000 });
  47 |   await aiButton.click();
  48 |   const dialog = page.locator('[role="dialog"]').filter({ hasText: /Smart Query Assistant|AI Query Assistant|المساعد الذكي/ });
  49 |   await expect(dialog).toBeVisible({ timeout: 10000 });
  50 | }
  51 | 
  52 | test.setTimeout(180000);
  53 | 
  54 | test.describe('AI Assistant — greetings and queries', () => {
  55 |   test('AI assistant greets and answers a query', async ({ page }) => {
  56 |     await login(page);
  57 |     await openAiDialog(page);
  58 | 
  59 |     // 1. Greeting
  60 |     const input = page.locator('[role="dialog"] input, [role="dialog"] textarea').first();
  61 |     await input.fill('hi');
  62 |     await input.press('Enter');
  63 | 
  64 |   const aiMessage = page.locator('[role="dialog"] [data-testid="ai-message"]').first();
  65 |   await expect(aiMessage).toBeVisible({ timeout: 15000 });
  66 |   const greetingText = await aiMessage.textContent();
  67 |   expect(greetingText).toMatch(/Smart Query Assistant|المساعد الذكي/);
  68 |   expect(greetingText).not.toContain('unknown');
  69 | 
  70 |   // 2. Data query via suggestion chip
  71 |   const attendanceChip = page.locator('[role="dialog"] .MuiChip-root, [role="dialog"] button').filter({ hasText: /Last month absences|How many absences/ }).first();
  72 |   if (await attendanceChip.isVisible({ timeout: 3000 }).catch(() => false)) {
  73 |     await attendanceChip.click();
  74 |   } else {
  75 |     await input.fill('How many absences last month?');
  76 |     await input.press('Enter');
  77 |   }
  78 | 
  79 |   await expect(aiMessage).toHaveCount(2, { timeout: 120000 });
  80 |   const reply = page.locator('[role="dialog"] [data-testid="ai-message"]').nth(1);
  81 |   const replyText = await reply.textContent();
  82 |   expect(replyText.length).toBeGreaterThan(10);
  83 |   expect(replyText).not.toContain('I\'m not sure I understood');
  84 | });
  85 | });
  86 | 
```