# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ai-assistant-ui.spec.js >> AI Assistant — quick questions and queries >> greets the user and shows capabilities
- Location: tests/e2e/specs/ai-assistant-ui.spec.js:67:3

# Error details

```
Error: page.evaluate: Execution context was destroyed, most likely because of a navigation
```

# Page snapshot

```yaml
- img "Loading..." [ref=e6]
```

# Test source

```ts
  1   | /**
  2   |  * AI Assistant UI / Quick-Question E2E Test
  3   |  *
  4   |  * Validates that the AI assistant:
  5   |  * - Opens from the floating AI Assistant (Sparkles) button on /welcome.
  6   |  * - Displays quick-question suggestion chips.
  7   |  * - Returns real data for a quick-question chip.
  8   |  * - Supports quick-question autocomplete.
  9   |  * - Still falls back to natural-language answers.
  10  |  */
  11  | import { test, expect } from '@playwright/test';
  12  | import { gotoWithAuth } from '../utils/ui-helpers.js';
  13  | 
  14  | test.setTimeout(120000);
  15  | 
  16  | const WELCOME_TEXT = /I am the Smart Query Assistant|أنا المساعد الذكي/;
  17  | 
  18  | async function maybeSkipTour(page) {
  19  |   // Onboarding tour may appear on first load; try to skip it repeatedly.
  20  |   for (let i = 0; i < 5; i++) {
  21  |     await page.waitForTimeout(1000);
> 22  |     const clicked = await page.evaluate(() => {
      |                                ^ Error: page.evaluate: Execution context was destroyed, most likely because of a navigation
  23  |       const buttons = Array.from(document.querySelectorAll('button, [role="button"], .MuiButtonBase-root'));
  24  |       const skip = buttons.find((b) => b.textContent?.includes('Skip'));
  25  |       if (skip) {
  26  |         skip.click();
  27  |         return true;
  28  |       }
  29  |       return false;
  30  |     });
  31  |     if (clicked) {
  32  |       await page.waitForTimeout(800);
  33  |       break;
  34  |     }
  35  |   }
  36  | }
  37  | 
  38  | async function openAiDialog(page) {
  39  |   await maybeSkipTour(page);
  40  | 
  41  |   const aiButton = page.locator('[data-testid="ai-assistant-fab"]').first();
  42  |   await expect(aiButton).toBeVisible({ timeout: 15000 });
  43  |   await aiButton.click();
  44  | 
  45  |   const dialog = page.locator('[role="dialog"]').filter({ hasText: /Smart Query Assistant|AI Query Assistant|المساعد الذكي/ });
  46  |   await expect(dialog).toBeVisible({ timeout: 10000 });
  47  |   return dialog;
  48  | }
  49  | 
  50  | async function sendMessage(page, text) {
  51  |   const input = page.locator('[data-testid="ai-query-input"]').first();
  52  |   await input.fill(text);
  53  |   await input.press('Enter');
  54  | }
  55  | 
  56  | async function waitForAssistantReply(page, timeout = 30000) {
  57  |   const aiMessage = page.locator('[role="dialog"] [data-testid="ai-message"]').first();
  58  |   await expect(aiMessage).toBeVisible({ timeout });
  59  |   return aiMessage;
  60  | }
  61  | 
  62  | test.describe('AI Assistant — quick questions and queries', () => {
  63  |   test.beforeEach(async ({ page }) => {
  64  |     await gotoWithAuth(page, '/welcome', 'admin');
  65  |   });
  66  | 
  67  |   test('greets the user and shows capabilities', async ({ page }) => {
  68  |     await openAiDialog(page);
  69  |     await sendMessage(page, 'hi');
  70  |     const reply = await waitForAssistantReply(page, 15000);
  71  |     await expect(reply).toContainText(WELCOME_TEXT);
  72  | 
  73  |     await expect(page.locator('text=unknown')).not.toBeVisible();
  74  |     await expect(reply).toContainText(/Attendance|students|schedules|marks|workflows/);
  75  |   });
  76  | 
  77  |   test('suggestion chips remain accessible and wrapped', async ({ page }) => {
  78  |     await openAiDialog(page);
  79  |     const suggestions = page.locator('[role="dialog"] button, [role="dialog"] [role="button"]').filter({ hasText: /Attendance|today|last month|Warnings|Students/ });
  80  |     await expect(suggestions.first()).toBeVisible();
  81  |     const count = await suggestions.count();
  82  |     expect(count).toBeGreaterThanOrEqual(2);
  83  |   });
  84  | 
  85  |   test('clicks a quick-question chip and gets an instant attendance answer', async ({ page }) => {
  86  |     await openAiDialog(page);
  87  |     const attendanceSuggestion = page.locator('[role="dialog"] button, [role="dialog"] [role="button"]').filter({ hasText: /Attendance summary \(last month\)/ }).first();
  88  |     await expect(attendanceSuggestion).toBeVisible({ timeout: 3000 });
  89  |     await attendanceSuggestion.click();
  90  |     const reply = await waitForAssistantReply(page, 30000);
  91  |     const text = await reply.textContent();
  92  |     expect(text.length).toBeGreaterThan(10);
  93  |     expect(text).not.toContain("I'm not sure I understood");
  94  |     expect(text).toMatch(/Attendance|Records|records|غياب/);
  95  |   });
  96  | 
  97  |   test('uses the quick-question autocomplete to get a student count answer', async ({ page }) => {
  98  |     await openAiDialog(page);
  99  |     const combo = page.locator('[role="combobox"]').first();
  100 |     await combo.fill('enrolled');
  101 |     const option = page.locator('[role="option"]').filter({ hasText: /Enrolled student count/ }).first();
  102 |     await expect(option).toBeVisible({ timeout: 3000 });
  103 |     await option.click();
  104 |     const reply = await waitForAssistantReply(page, 30000);
  105 |     const text = await reply.textContent();
  106 |     expect(text).toMatch(/Unique Students|Total Class Enrollments|students/);
  107 |   });
  108 | });
  109 | 
```