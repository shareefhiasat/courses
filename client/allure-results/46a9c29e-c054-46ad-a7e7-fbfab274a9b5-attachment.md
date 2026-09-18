# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ai-assistant-ui.spec.js >> AI Assistant — quick questions and queries >> greets the user and shows capabilities
- Location: tests/e2e/specs/ai-assistant-ui.spec.js:67:3

# Error details

```
Error: locator.fill: Error: Element is not an <input>, <textarea>, <select> or [contenteditable] and does not have a role allowing [aria-readonly]
Call log:
  - waiting for locator('[data-testid="ai-query-input"]').first()
    - locator resolved to <div data-testid="ai-query-input" class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-cmpglg-MuiFormControl-root-MuiTextField-root">…</div>
    - fill("hi")
  - attempting fill action
    - waiting for element to be visible, enabled and editable

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - button [ref=e6] [cursor=pointer]:
          - img [ref=e7]
        - button [ref=e8] [cursor=pointer]:
          - img [ref=e9]
        - img [ref=e13]
        - generic [ref=e14]:
          - generic [ref=e15]:
            - button [ref=e16] [cursor=pointer]:
              - img [ref=e17]
            - button [ref=e21] [cursor=pointer]:
              - img [ref=e22]
              - generic [ref=e25]: "13"
            - button [ref=e26] [cursor=pointer]:
              - img [ref=e27]
            - button [ref=e30] [cursor=pointer]:
              - img [ref=e31]
            - button [ref=e33] [cursor=pointer]:
              - img [ref=e34]
          - generic [ref=e36] [cursor=pointer]:
            - img [ref=e38]
            - img [ref=e41]
    - generic [ref=e43]:
      - generic [ref=e46]:
        - generic [ref=e48]:
          - img [ref=e50]
          - img [ref=e52]
        - generic [ref=e54]:
          - button [ref=e55] [cursor=pointer]:
            - img [ref=e56]
          - button [ref=e58] [cursor=pointer]:
            - img [ref=e59]
          - button [ref=e61] [cursor=pointer]:
            - img [ref=e62]
          - button [ref=e65] [cursor=pointer]:
            - img [ref=e66]
          - button [ref=e68] [cursor=pointer]:
            - img [ref=e69]
      - navigation [ref=e72]:
        - button [ref=e74] [cursor=pointer]:
          - generic [ref=e75]: Drive
          - img [ref=e76]
        - button [ref=e79] [cursor=pointer]:
          - generic [ref=e80]: Attendance
          - img [ref=e81]
        - button [ref=e84] [cursor=pointer]:
          - generic [ref=e85]: Operations Board
          - img [ref=e86]
        - button [ref=e89] [cursor=pointer]:
          - generic [ref=e90]: Settings
          - img [ref=e91]
      - generic [ref=e93]:
        - generic [ref=e94]:
          - generic: v1.0.0 - 31 Aug 2026
        - button [ref=e96] [cursor=pointer]:
          - generic [ref=e97]: Logout
    - main [ref=e98]:
      - generic [ref=e99]:
        - generic [ref=e100]:
          - generic [ref=e101]: G
          - heading [level=1] [ref=e102]: Good afternoon, Global Admin
          - paragraph [ref=e103]:
            - text: What can we do today —
            - strong [ref=e104]: Admin
        - generic [ref=e106]:
          - heading [level=2] [ref=e107]: Select Program
          - paragraph [ref=e108]: Tap a program to continue automatically
          - generic [ref=e109]:
            - button [ref=e110] [cursor=pointer]:
              - generic [ref=e111]: Civil Engineering
              - generic [ref=e112]: CE-ENG
            - button [ref=e113] [cursor=pointer]:
              - generic [ref=e114]: Cyber Diploma
              - generic [ref=e115]: CY-DIP
            - button [ref=e116] [cursor=pointer]:
              - generic [ref=e117]: Electrical Engineering
              - generic [ref=e118]: EE-ENG
            - button [ref=e119] [cursor=pointer]:
              - generic [ref=e120]: Information Technology Diploma
              - generic [ref=e121]: IT
        - button [ref=e122] [cursor=pointer]: Go to home dashboard
        - generic [ref=e124]:
          - button [ref=e125] [cursor=pointer]:
            - img [ref=e126]
          - button [ref=e128] [cursor=pointer]:
            - img [ref=e129]
  - dialog "Smart Query Assistant Offline natural queries for attendance, warnings, schedule & workflows" [active] [ref=e134]:
    - heading "Smart Query Assistant Offline natural queries for attendance, warnings, schedule & workflows" [level=2] [ref=e135]:
      - generic [ref=e136]:
        - img [ref=e138]
        - generic [ref=e141]:
          - heading "Smart Query Assistant" [level=6] [ref=e142]
          - text: Offline natural queries for attendance, warnings, schedule & workflows
      - button [ref=e144] [cursor=pointer]:
        - img [ref=e145]
    - generic [ref=e149]:
      - img [ref=e151]
      - heading "How can I assist you today?" [level=6] [ref=e154]
      - paragraph [ref=e155]: Ask questions about attendance records, warnings, human cases, lectures schedule, or workflow documents. All queries are securely scoped to your permissions.
    - generic [ref=e156]:
      - generic [ref=e157]: "Suggestions:"
      - button "Attendance summary (today)" [ref=e158] [cursor=pointer]:
        - generic [ref=e159]: Attendance summary (today)
      - button "Attendance summary (this week)" [ref=e160] [cursor=pointer]:
        - generic [ref=e161]: Attendance summary (this week)
      - button "Attendance summary (last week)" [ref=e162] [cursor=pointer]:
        - generic [ref=e163]: Attendance summary (last week)
      - button "Attendance summary (this month)" [ref=e164] [cursor=pointer]:
        - generic [ref=e165]: Attendance summary (this month)
      - button "Attendance summary (last month)" [ref=e166] [cursor=pointer]:
        - generic [ref=e167]: Attendance summary (last month)
      - button "All absence warnings" [ref=e168] [cursor=pointer]:
        - generic [ref=e169]: All absence warnings
      - button "First warnings" [ref=e170] [cursor=pointer]:
        - generic [ref=e171]: First warnings
      - button "Final warnings" [ref=e172] [cursor=pointer]:
        - generic [ref=e173]: Final warnings
      - button "Late records (today)" [ref=e174] [cursor=pointer]:
        - generic [ref=e175]: Late records (today)
      - button "Late records (this week)" [ref=e176] [cursor=pointer]:
        - generic [ref=e177]: Late records (this week)
    - generic [ref=e178]:
      - generic [ref=e181]:
        - combobox "Search a quick question..." [ref=e182]
        - button "Open" [ref=e184] [cursor=pointer]:
          - img [ref=e185]
        - group
      - generic [ref=e187]: Pick a quick question for an instant answer, or type your own below (may take a while).
    - generic [ref=e188]:
      - generic [ref=e190]:
        - textbox "Type your own question here..." [ref=e191]
        - group
      - button [disabled]:
        - img
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
  22  |     const clicked = await page.evaluate(() => {
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
> 52  |   await input.fill(text);
      |               ^ Error: locator.fill: Error: Element is not an <input>, <textarea>, <select> or [contenteditable] and does not have a role allowing [aria-readonly]
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