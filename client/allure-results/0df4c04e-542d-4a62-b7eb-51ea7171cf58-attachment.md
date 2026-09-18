# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ai-assistant-manual.spec.js >> AI assistant greets and answers a query
- Location: tests/e2e/specs/ai-assistant-manual.spec.js:52:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('[role="dialog"] [data-testid="ai-message"]').first()
Expected: 2
Received: 1

Call log:
  - Expect "toHaveCount" with timeout 70000ms
  - waiting for locator('[role="dialog"] [data-testid="ai-message"]').first()
    111 × locator resolved to 1 element
        - unexpected value "1"

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
          - generic: v1.0.0 - 23 Aug 2026
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
  - dialog "Smart Query Assistant Offline natural queries for attendance, warnings, schedule & workflows Clear history" [ref=e134]:
    - heading "Smart Query Assistant Offline natural queries for attendance, warnings, schedule & workflows Clear history" [level=2] [ref=e135]:
      - generic [ref=e136]:
        - img [ref=e138]
        - generic [ref=e141]:
          - heading "Smart Query Assistant" [level=6] [ref=e142]
          - text: Offline natural queries for attendance, warnings, schedule & workflows
      - generic [ref=e143]:
        - button "Clear history" [ref=e144] [cursor=pointer]:
          - img [ref=e145]
        - button [ref=e148] [cursor=pointer]:
          - img [ref=e149]
    - generic [ref=e152]:
      - generic [ref=e153]:
        - generic [ref=e154]:
          - img [ref=e156]
          - generic [ref=e159]: You • 01:23 PM
        - paragraph [ref=e161]: hi
      - generic [ref=e162]:
        - generic [ref=e163]:
          - img [ref=e165]
          - generic [ref=e168]: Assistant • 01:23 PM
        - generic [ref=e169]:
          - paragraph [ref=e170]: "Hello! I am the Smart Query Assistant. I can help you with: • Attendance and absence statistics • Absence warnings (first / final) • Humanitarian cases • Student counts and enrollments • Class schedules and lectures • Marks averages and results • Workflow approvals and status Choose one of the suggestions below or type your question freely."
          - generic [ref=e171]:
            - generic [ref=e173]: Welcome
            - button "Copy answer" [ref=e174] [cursor=pointer]:
              - img [ref=e175]
      - generic [ref=e178]:
        - generic [ref=e179]:
          - img [ref=e181]
          - generic [ref=e184]: You • 01:23 PM
        - paragraph [ref=e186]: How many absences were recorded last month?
      - generic [ref=e187]:
        - generic [ref=e188]:
          - img [ref=e190]
          - generic [ref=e193]: Assistant • 01:23 PM
        - generic [ref=e194]:
          - paragraph [ref=e195]: Failed to communicate with the AI assistant.
          - button "Copy answer" [ref=e197] [cursor=pointer]:
            - img [ref=e198]
    - generic [ref=e201]:
      - generic [ref=e202]: "Suggestions:"
      - button "Last month absences" [active] [ref=e203] [cursor=pointer]:
        - generic [ref=e204]: Last month absences
      - button "Absence warnings" [ref=e205] [cursor=pointer]:
        - generic [ref=e206]: Absence warnings
      - button "Human cases" [ref=e207] [cursor=pointer]:
        - generic [ref=e208]: Human cases
      - button "Student count" [ref=e209] [cursor=pointer]:
        - generic [ref=e210]: Student count
      - button "Today schedule" [ref=e211] [cursor=pointer]:
        - generic [ref=e212]: Today schedule
      - button "Marks average" [ref=e213] [cursor=pointer]:
        - generic [ref=e214]: Marks average
      - button "Pending workflows" [ref=e215] [cursor=pointer]:
        - generic [ref=e216]: Pending workflows
      - button "Late records (Admin)" [ref=e217] [cursor=pointer]:
        - generic [ref=e218]: Late records (Admin)
      - button "Notes & Comments (Admin)" [ref=e219] [cursor=pointer]:
        - generic [ref=e220]: Notes & Comments (Admin)
    - generic [ref=e221]:
      - generic [ref=e223]:
        - textbox "Type your question here... (e.g. How many absences last month?)" [ref=e224]
        - group
      - button [disabled]:
        - img
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
  48 |   const dialog = page.locator('[role="dialog"]').filter({ hasText: /Smart Query Assistant|AI Query Assistant|المساعد الذكي/ });
  49 |   await expect(dialog).toBeVisible({ timeout: 10000 });
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
> 76 |   await expect(aiMessage).toHaveCount(2, { timeout: 70000 });
     |                           ^ Error: expect(locator).toHaveCount(expected) failed
  77 |   const reply = page.locator('[role="dialog"] [data-testid="ai-message"]').nth(1);
  78 |   const replyText = await reply.textContent();
  79 |   expect(replyText.length).toBeGreaterThan(10);
  80 |   expect(replyText).not.toContain('I\'m not sure I understood');
  81 | });
  82 | 
```