# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ai-assistant-ui.spec.js >> AI Assistant — greetings and queries >> handles an attendance question through the UI
- Location: tests/e2e/specs/ai-assistant-ui.spec.js:79:3

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
  - button "18"
  - button "Switch to Arabic"
  - button "My Access"
  - button "Dark"
  - img "Profile"
- img "Robert Johnson"
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
- text: v1.0.0 - 23 Aug 2026
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
  12 | const WELCOME_TEXT = /I am the Smart Query Assistant|أنا المساعد الذكي/;
  13 | 
  14 | async function maybeSkipTour(page) {
  15 |   const skip = page.locator('button:has-text("Skip"), [data-testid="tour-skip"]').first();
  16 |   if (await skip.isVisible({ timeout: 3000 }).catch(() => false)) {
  17 |     await skip.click();
  18 |     await page.waitForTimeout(500);
  19 |   }
  20 | }
  21 | 
  22 | async function openAiDialog(page) {
  23 |   await maybeSkipTour(page);
  24 | 
  25 |   const aiButton = page.locator('[data-testid="ai-assistant-fab"]').first();
> 26 |   await expect(aiButton).toBeVisible({ timeout: 15000 });
     |                          ^ Error: expect(locator).toBeVisible() failed
  27 |   await aiButton.click();
  28 | 
  29 |   const dialog = page.locator('[role="dialog"]').filter({ hasText: /AI Query Assistant|المساعد الذكي/ });
  30 |   await expect(dialog).toBeVisible({ timeout: 10000 });
  31 |   return dialog;
  32 | }
  33 | 
  34 | async function sendMessage(page, text) {
  35 |   const input = page.locator('[role="dialog"] input, [role="dialog"] textarea').first();
  36 |   await input.fill(text);
  37 |   await input.press('Enter');
  38 | }
  39 | 
  40 | async function waitForAssistantReply(page, timeout = 65000) {
  41 |   const loading = page.locator('text=/Querying database|جارٍ/').first();
  42 |   try {
  43 |     await expect(loading).not.toBeVisible({ timeout });
  44 |   } catch {
  45 |     // If loading never appeared, continue
  46 |   }
  47 |   const aiMessage = page.locator('[role="dialog"] [data-testid="ai-message"]').first();
  48 |   await expect(aiMessage).toBeVisible({ timeout });
  49 |   return aiMessage;
  50 | }
  51 | 
  52 | 
  53 | 
  54 | test.describe('AI Assistant — greetings and queries', () => {
  55 |   test.beforeEach(async ({ page }) => {
  56 |     await gotoWithAuth(page, '/dashboard', 'admin');
  57 |   });
  58 | 
  59 |   test('greets the user and shows capabilities', async ({ page }) => {
  60 |     await openAiDialog(page);
  61 |     await sendMessage(page, 'hi');
  62 |     const reply = await waitForAssistantReply(page, 15000);
  63 |     await expect(reply).toContainText(WELCOME_TEXT);
  64 | 
  65 |     // The response should not show the ugly "unknown" chip
  66 |     await expect(page.locator('text=unknown')).not.toBeVisible();
  67 |     // Capabilities should be listed
  68 |     await expect(reply).toContainText(/Attendance|students|schedules|marks|workflows/);
  69 |   });
  70 | 
  71 |   test('suggestion chips remain accessible and wrapped', async ({ page }) => {
  72 |     await openAiDialog(page);
  73 |     const suggestions = page.locator('[role="dialog"] button, [role="dialog"] [role="button"]').filter({ hasText: /absences|today|average|pending|Absences/ });
  74 |     await expect(suggestions.first()).toBeVisible();
  75 |     const count = await suggestions.count();
  76 |     expect(count).toBeGreaterThanOrEqual(2);
  77 |   });
  78 | 
  79 |   test('handles an attendance question through the UI', async ({ page }) => {
  80 |     await openAiDialog(page);
  81 |     // Click a suggestion that maps to attendance
  82 |     const attendanceSuggestion = page.locator('[role="dialog"] .MuiChip-root, [role="dialog"] button').filter({ hasText: /Last month absences|How many absences/ }).first();
  83 |     if (await attendanceSuggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
  84 |       await attendanceSuggestion.click();
  85 |     } else {
  86 |       await sendMessage(page, 'How many absences last month?');
  87 |     }
  88 |     const reply = await waitForAssistantReply(page, 70000);
  89 |     const text = await reply.textContent();
  90 |     expect(text.length).toBeGreaterThan(10);
  91 |     // Should be a real answer, not the unknown fallback
  92 |     expect(text).not.toContain('I\'m not sure I understood');
  93 |   });
  94 | });
  95 | 
```