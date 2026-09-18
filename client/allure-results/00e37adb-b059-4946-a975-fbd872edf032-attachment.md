# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ai-assistant-manual.spec.js >> AI assistant greets and answers a query
- Location: tests/e2e/specs/ai-assistant-manual.spec.js:52:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[role="dialog"]').filter({ hasText: /AI Query Assistant|المساعد الذكي/ })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[role="dialog"]').filter({ hasText: /AI Query Assistant|المساعد الذكي/ })

```

```yaml
- dialog "Smart Query Assistant Offline natural queries for attendance, warnings, schedule & workflows":
  - heading "Smart Query Assistant Offline natural queries for attendance, warnings, schedule & workflows" [level=2]:
    - heading "Smart Query Assistant" [level=6]
    - text: Offline natural queries for attendance, warnings, schedule & workflows
    - button
  - heading "How can I assist you today?" [level=6]
  - paragraph: Ask questions about attendance records, warnings, human cases, lectures schedule, or workflow documents. All queries are securely scoped to your permissions.
  - text: "Suggestions:"
  - button "Last month absences"
  - button "Absence warnings"
  - button "Human cases"
  - button "Student count"
  - button "Today schedule"
  - button "Marks average"
  - button "Pending workflows"
  - button "Late records (Admin)"
  - button "Notes & Comments (Admin)"
  - textbox "Type your question here... (e.g. How many absences last month?)"
  - button [disabled]
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
  14 |   await page.goto(`${BASE_URL}/welcome`);
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
  48 |   const dialog = page.locator('[role="dialog"]').filter({ hasText: /AI Query Assistant|المساعد الذكي/ });
> 49 |   await expect(dialog).toBeVisible({ timeout: 10000 });
     |                        ^ Error: expect(locator).toBeVisible() failed
  50 | }
  51 | 
  52 | test('AI assistant greets and answers a query', async ({ page }) => {
  53 |   await login(page);
  54 |   await openAiDialog(page);
  55 | 
  56 |   // 1. Greeting
  57 |   const input = page.locator('[role="dialog"] input, [role="dialog"] textarea').first();
  58 |   await input.fill('hi');
  59 |   await input.press('Enter');
  60 | 
  61 |   const aiMessage = page.locator('[role="dialog"] [data-testid="ai-message"]').first();
  62 |   await expect(aiMessage).toBeVisible({ timeout: 15000 });
  63 |   const greetingText = await aiMessage.textContent();
  64 |   expect(greetingText).toMatch(/Smart Query Assistant|المساعد الذكي/);
  65 |   expect(greetingText).not.toContain('unknown');
  66 | 
  67 |   // 2. Data query via suggestion chip
  68 |   const attendanceChip = page.locator('[role="dialog"] .MuiChip-root, [role="dialog"] button').filter({ hasText: /Last month absences|How many absences/ }).first();
  69 |   if (await attendanceChip.isVisible({ timeout: 3000 }).catch(() => false)) {
  70 |     await attendanceChip.click();
  71 |   } else {
  72 |     await input.fill('How many absences last month?');
  73 |     await input.press('Enter');
  74 |   }
  75 | 
  76 |   await expect(aiMessage).toHaveCount(2, { timeout: 70000 });
  77 |   const reply = page.locator('[role="dialog"] [data-testid="ai-message"]').nth(1);
  78 |   const replyText = await reply.textContent();
  79 |   expect(replyText.length).toBeGreaterThan(10);
  80 |   expect(replyText).not.toContain('I\'m not sure I understood');
  81 | });
  82 | 
```