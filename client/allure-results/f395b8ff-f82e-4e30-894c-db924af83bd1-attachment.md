# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ai-assistant-ui.spec.js >> AI Assistant — greetings and queries >> suggestion chips remain accessible and wrapped
- Location: tests/e2e/specs/ai-assistant-ui.spec.js:63:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[title="Smart Query Assistant"], [title="المساعد الذكي للاستعلامات"]').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[title="Smart Query Assistant"], [title="المساعد الذكي للاستعلامات"]').first()

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
  - text: Step 1 of 6
  - button "Close": ✕
  - text: Switch between different dashboard views and functionalities using these tabs
  - checkbox "Don't show this tour again"
  - text: Don't show this tour again
  - button "Back": ← Back
  - button "Skip"
  - button "Close": Next →
- img
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
  12 | const AI_ASSISTANT_TITLE = /AI Query Assistant|المساعد الذكي/;
  13 | const WELCOME_TEXT = /I am the Smart Query Assistant|أنا المساعد الذكي/;
  14 | 
  15 | async function openAiDialog(page) {
  16 |   // Click the floating AI (Sparkles) button
  17 |   const aiButton = page.locator('[title="Smart Query Assistant"], [title="المساعد الذكي للاستعلامات"]').first();
> 18 |   await expect(aiButton).toBeVisible({ timeout: 10000 });
     |                          ^ Error: expect(locator).toBeVisible() failed
  19 |   await aiButton.click();
  20 | 
  21 |   const dialog = page.locator('[role="dialog"]').filter({ hasText: AI_ASSISTANT_TITLE });
  22 |   await expect(dialog).toBeVisible({ timeout: 10000 });
  23 |   return dialog;
  24 | }
  25 | 
  26 | async function sendMessage(page, text) {
  27 |   const input = page.locator('[role="dialog"] input, [role="dialog"] textarea').first();
  28 |   await input.fill(text);
  29 |   await input.press('Enter');
  30 | }
  31 | 
  32 | async function waitForAssistantReply(page, timeout = 65000) {
  33 |   // Wait for the typing dots to disappear and a non-loading AI bubble to appear
  34 |   const loading = page.locator('text=/Querying database|جارٍ/').first();
  35 |   try {
  36 |     await expect(loading).not.toBeVisible({ timeout });
  37 |   } catch {
  38 |     // If loading never appeared, continue
  39 |   }
  40 |   const aiMessage = page.locator('[role="dialog"] [data-testid="ai-message"]').first();
  41 |   await expect(aiMessage).toBeVisible({ timeout });
  42 |   return aiMessage;
  43 | }
  44 | 
  45 | 
  46 | test.describe('AI Assistant — greetings and queries', () => {
  47 |   test.beforeEach(async ({ page }) => {
  48 |     await gotoWithAuth(page, '/dashboard', 'admin');
  49 |   });
  50 | 
  51 |   test('greets the user and shows capabilities', async ({ page }) => {
  52 |     await openAiDialog(page);
  53 |     await sendMessage(page, 'hi');
  54 |     const reply = await waitForAssistantReply(page, 15000);
  55 |     await expect(reply).toContainText(WELCOME_TEXT);
  56 | 
  57 |     // The response should not show the ugly "unknown" chip
  58 |     await expect(page.locator('text=unknown')).not.toBeVisible();
  59 |     // Capabilities should be listed
  60 |     await expect(reply).toContainText(/Attendance|students|schedules|marks|workflows/);
  61 |   });
  62 | 
  63 |   test('suggestion chips remain accessible and wrapped', async ({ page }) => {
  64 |     await openAiDialog(page);
  65 |     const suggestions = page.locator('[role="dialog"] .MuiChip-root, [role="dialog"] [role="button"]').filter({ hasText: /absences|today|average|pending/ });
  66 |     await expect(suggestions.first()).toBeVisible();
  67 |     const count = await suggestions.count();
  68 |     expect(count).toBeGreaterThanOrEqual(3);
  69 |   });
  70 | 
  71 |   test('handles an attendance question through the UI', async ({ page }) => {
  72 |     await openAiDialog(page);
  73 |     await page.locator('text=/How many absences last month?/i').first().click();
  74 |     const reply = await waitForAssistantReply(page, 70000);
  75 |     const text = await reply.textContent();
  76 |     expect(text.length).toBeGreaterThan(10);
  77 |     // Should be a real answer (number or "No data"), not the unknown fallback
  78 |     expect(text).not.toContain('I\'m not sure I understood');
  79 |   });
  80 | });
  81 | 
```