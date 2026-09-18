# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ai-assistant-ui.spec.js >> AI Assistant — greetings and queries >> handles an attendance question through the UI
- Location: tests/e2e/specs/ai-assistant-ui.spec.js:83:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="ai-assistant-fab"]').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('[data-testid="ai-assistant-fab"]').first()

```

```yaml
- navigation:
  - button "Menu"
  - button "Collapse navbar"
  - img "QAF"
  - button "Welcome"
  - button "13"
  - button "Switch to Arabic"
  - button "My Access"
  - button "Dark"
  - img "Profile"
- img "Global Admin"
- button
- button
- button
- button
- button
- navigation:
  - button "Drive"
  - button "Attendance"
  - button "Operations Board"
  - button "Settings"
- text: v1.0.0 - 31 Aug 2026
- button "Logout"
- main:
  - button "Expand All"
  - button "Collapse All"
  - button "Enrollments"
  - button "Marks"
  - button
  - button "Operations"
  - button "Penalty"
  - button
  - button "Behavior"
  - button
  - button "Scheduling and Availabilities"
  - button "Summary Dashboard"
  - button "Scheduling Calendar"
  - heading "Activity" [level=2]
  - button "Show information": i
  - button "All Programs"
  - button "All Subjects"
  - button "All Classes"
  - button "All Categories"
  - button "Type":
    - text: Type
    - button
  - button "Beginner":
    - text: Beginner
    - button
  - textbox "Title (English)*"
  - textbox "Title (Arabic)"
  - toolbar:
    - button "Normal":
      - text: Normal
      - img
    - button "bold":
      - img
    - button "italic":
      - img
    - button "underline":
      - img
    - button "strike":
      - img
    - button:
      - img
    - button:
      - img
    - 'button "list: ordered"':
      - img
    - 'button "list: bullet"':
      - img
    - button:
      - img
    - button "link":
      - img
    - button "clean":
      - img
  - paragraph
  - paragraph
  - toolbar:
    - button "Normal":
      - text: Normal
      - img
    - button "bold":
      - img
    - button "italic":
      - img
    - button "underline":
      - img
    - button "strike":
      - img
    - button:
      - img
    - button:
      - img
    - 'button "list: ordered"':
      - img
    - 'button "list: bullet"':
      - img
    - button:
      - img
    - button "link":
      - img
    - button "clean":
      - img
  - paragraph
  - paragraph
  - textbox "https://example.com or activity-link"
  - textbox:
    - /placeholder: "      Pick due date & time"
  - textbox "https://example.com/image.jpg"
  - spinbutton: "100"
  - switch "Show to students" [checked]
  - text: Show to students
  - switch "Retakable"
  - text: Retakable
  - switch "Featured"
  - text: Featured
  - switch "Optional"
  - text: Optional
  - switch "Requires Submission"
  - text: Requires Submission
  - button "Save"
  - toolbar "Quick filters":
    - button "Total 0" [pressed]
  - button "Export"
  - grid:
    - row "Select all rows Title (EN) Title (AR) Program Subject Class Type Difficulty Max Score":
      - columnheader "Select all rows":
        - checkbox "Select all rows"
      - columnheader "Title (EN)"
      - columnheader "Title (AR)"
      - columnheader "Program"
      - columnheader "Subject"
      - columnheader "Class"
      - columnheader "Type"
      - columnheader "Difficulty"
      - columnheader "Max Score"
    - text: No Data
    - rowgroup
  - paragraph: "Rows per page:"
  - 'combobox "Rows per page: 50"': "50"
  - paragraph: 0–0 of 0
  - button "Go to previous page" [disabled]
  - button "Go to next page" [disabled]
- alertdialog:
  - text: Step 1 of 7
  - button "Close": ✕
  - text: Filter activities by program, subject, class, type, and date range.
  - checkbox "Don't show this tour again"
  - text: Don't show this tour again
  - button "Back": ← Back
  - button "Skip"
  - button "Close": Next →
```

# Test source

```ts
  1  | /**
  2  |  * AI Assistant UI / Query E2E Test
  3  |  *
  4  |  * Validates that the AI assistant:
  5  |  * - Opens from the floating AI Assistant (Sparkles) button.
  6  |  * - Replies warmly to greetings.
  7  |  * - Returns real data for a natural-language query.
  8  |  */
  9  | import { test, expect } from '@playwright/test';
  10 | import { gotoWithAuth } from '../utils/ui-helpers.js';
  11 | 
  12 | test.setTimeout(180000);
  13 | 
  14 | const WELCOME_TEXT = /I am the Smart Query Assistant|أنا المساعد الذكي/;
  15 | 
  16 | async function maybeSkipTour(page) {
  17 |   await page.waitForTimeout(1500);
  18 |   await page.evaluate(() => {
  19 |     const buttons = Array.from(document.querySelectorAll('button, [role="button"], .MuiButtonBase-root'));
  20 |     const skip = buttons.find((b) => b.textContent?.includes('Skip'));
  21 |     if (skip) skip.click();
  22 |   });
  23 |   await page.waitForTimeout(800);
  24 | }
  25 | 
  26 | async function openAiDialog(page) {
  27 |   await maybeSkipTour(page);
  28 | 
  29 |   const aiButton = page.locator('[data-testid="ai-assistant-fab"]').first();
> 30 |   await expect(aiButton).toBeVisible({ timeout: 15000 });
     |                          ^ Error: expect(locator).toBeVisible() failed
  31 |   await aiButton.click();
  32 | 
  33 |   const dialog = page.locator('[role="dialog"]').filter({ hasText: /Smart Query Assistant|AI Query Assistant|المساعد الذكي/ });
  34 |   await expect(dialog).toBeVisible({ timeout: 10000 });
  35 |   return dialog;
  36 | }
  37 | 
  38 | async function sendMessage(page, text) {
  39 |   const input = page.locator('[role="dialog"] input, [role="dialog"] textarea').first();
  40 |   await input.fill(text);
  41 |   await input.press('Enter');
  42 | }
  43 | 
  44 | async function waitForAssistantReply(page, timeout = 120000) {
  45 |   const loading = page.locator('text=/Querying database|جارٍ/').first();
  46 |   try {
  47 |     await expect(loading).not.toBeVisible({ timeout });
  48 |   } catch {
  49 |     // If loading never appeared, continue
  50 |   }
  51 |   const aiMessage = page.locator('[role="dialog"] [data-testid="ai-message"]').first();
  52 |   await expect(aiMessage).toBeVisible({ timeout });
  53 |   return aiMessage;
  54 | }
  55 | 
  56 | 
  57 | 
  58 | test.describe('AI Assistant — greetings and queries', () => {
  59 |   test.beforeEach(async ({ page }) => {
  60 |     await gotoWithAuth(page, '/dashboard', 'admin');
  61 |   });
  62 | 
  63 |   test('greets the user and shows capabilities', async ({ page }) => {
  64 |     await openAiDialog(page);
  65 |     await sendMessage(page, 'hi');
  66 |     const reply = await waitForAssistantReply(page, 15000);
  67 |     await expect(reply).toContainText(WELCOME_TEXT);
  68 | 
  69 |     // The response should not show the ugly "unknown" chip
  70 |     await expect(page.locator('text=unknown')).not.toBeVisible();
  71 |     // Capabilities should be listed
  72 |     await expect(reply).toContainText(/Attendance|students|schedules|marks|workflows/);
  73 |   });
  74 | 
  75 |   test('suggestion chips remain accessible and wrapped', async ({ page }) => {
  76 |     await openAiDialog(page);
  77 |     const suggestions = page.locator('[role="dialog"] button, [role="dialog"] [role="button"]').filter({ hasText: /absences|today|average|pending|Absences/ });
  78 |     await expect(suggestions.first()).toBeVisible();
  79 |     const count = await suggestions.count();
  80 |     expect(count).toBeGreaterThanOrEqual(2);
  81 |   });
  82 | 
  83 |   test('handles an attendance question through the UI', async ({ page }) => {
  84 |     await openAiDialog(page);
  85 |     // Click a suggestion that maps to attendance
  86 |     const attendanceSuggestion = page.locator('[role="dialog"] .MuiChip-root, [role="dialog"] button').filter({ hasText: /Last month absences|How many absences/ }).first();
  87 |     if (await attendanceSuggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
  88 |       await attendanceSuggestion.click();
  89 |     } else {
  90 |       await sendMessage(page, 'How many absences last month?');
  91 |     }
  92 |     const reply = await waitForAssistantReply(page, 120000);
  93 |     const text = await reply.textContent();
  94 |     expect(text.length).toBeGreaterThan(10);
  95 |     // Should be a real answer, not the unknown fallback
  96 |     expect(text).not.toContain('I\'m not sure I understood');
  97 |   });
  98 | });
  99 | 
```