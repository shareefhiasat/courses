# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dark-mode-ui.spec.js >> Dark Mode — Theme Toggle >> TC-DM-UI-003: Dark mode adds dark-mode class to body
- Location: tests/e2e/specs/dark-mode-ui.spec.js:96:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForTimeout: Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]:
      - button "Menu" [ref=e6] [cursor=pointer]:
        - img [ref=e7]
      - button "Collapse navbar" [ref=e9] [cursor=pointer]:
        - img [ref=e10]
      - img "QAF" [ref=e14]
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e18]: 4:57 PM
          - generic [ref=e19]:
            - button [ref=e21] [cursor=pointer]:
              - img [ref=e22]
            - button [ref=e25] [cursor=pointer]:
              - img [ref=e26]
        - generic [ref=e28]: Jun 25, Thu 2026
      - generic [ref=e29]:
        - generic [ref=e30]:
          - button [ref=e32] [cursor=pointer]:
            - img [ref=e33]
          - button "Switch to Arabic" [ref=e37] [cursor=pointer]:
            - img [ref=e38]
          - button "Help" [ref=e42] [cursor=pointer]:
            - img [ref=e43]
          - button "information" [ref=e47] [cursor=pointer]:
            - img [ref=e48]
          - button [ref=e51] [cursor=pointer]:
            - img [ref=e52]
        - generic [ref=e54] [cursor=pointer]:
          - generic [ref=e57]: S
          - generic [ref=e58]:
            - img [ref=e61]
            - img [ref=e65]
  - generic [ref=e68]:
    - generic "Resize" [ref=e69]
    - generic [ref=e71]:
      - generic [ref=e73]: S
      - generic [ref=e74]:
        - button "Switch to Dark" [ref=e75] [cursor=pointer]:
          - img [ref=e76]
        - button "Collapse" [ref=e78] [cursor=pointer]:
          - img [ref=e79]
        - button "enable auto hide" [ref=e81] [cursor=pointer]:
          - img [ref=e82]
        - button "disable sticky" [ref=e85] [cursor=pointer]:
          - img [ref=e86]
        - button [ref=e88] [cursor=pointer]:
          - img [ref=e89]
    - navigation [ref=e92]:
      - generic [ref=e93]:
        - button "Main" [ref=e94] [cursor=pointer]:
          - generic [ref=e95]: Main
          - img [ref=e96]
        - generic [ref=e98]:
          - generic [ref=e99]:
            - link "Home" [ref=e100] [cursor=pointer]:
              - /url: /
              - img [ref=e102]
              - generic [ref=e105]: Home
            - button "Open in new tab" [ref=e106] [cursor=pointer]:
              - img [ref=e107]
            - button "pin" [ref=e111] [cursor=pointer]:
              - img [ref=e112]
          - generic [ref=e114]:
            - link "Dashboard" [ref=e115] [cursor=pointer]:
              - /url: /dashboard
              - img [ref=e117]
              - generic [ref=e122]: Dashboard
            - button "Open in new tab" [ref=e123] [cursor=pointer]:
              - img [ref=e124]
            - button "pin" [ref=e128] [cursor=pointer]:
              - img [ref=e129]
          - generic [ref=e131]:
            - link "Student Dashboard" [ref=e132] [cursor=pointer]:
              - /url: /student-dashboard
              - img [ref=e134]
              - generic [ref=e139]: Student Dashboard
            - button "Open in new tab" [ref=e140] [cursor=pointer]:
              - img [ref=e141]
            - button "pin" [ref=e145] [cursor=pointer]:
              - img [ref=e146]
      - button "Activity" [ref=e149] [cursor=pointer]:
        - generic [ref=e150]: Activity
        - img [ref=e151]
      - button "Quiz" [ref=e154] [cursor=pointer]:
        - generic [ref=e155]: Quiz
        - img [ref=e156]
      - button "Academic" [ref=e159] [cursor=pointer]:
        - generic [ref=e160]: Academic
        - img [ref=e161]
      - button "Enrollments" [ref=e164] [cursor=pointer]:
        - generic [ref=e165]: Enrollments
        - img [ref=e166]
      - button "Academic Records" [ref=e169] [cursor=pointer]:
        - generic [ref=e170]: Academic Records
        - img [ref=e171]
      - button "Scheduling And Availabilities" [ref=e174] [cursor=pointer]:
        - generic [ref=e175]: Scheduling And Availabilities
        - img [ref=e176]
      - button "Availability" [ref=e179] [cursor=pointer]:
        - generic [ref=e180]: Availability
        - img [ref=e181]
      - button "Availability Setup" [ref=e184] [cursor=pointer]:
        - generic [ref=e185]: Availability Setup
        - img [ref=e186]
      - button "Users" [ref=e189] [cursor=pointer]:
        - generic [ref=e190]: Users
        - img [ref=e191]
      - button "Review Results" [ref=e194] [cursor=pointer]:
        - generic [ref=e195]: Review Results
        - img [ref=e196]
      - button "Attendance" [ref=e199] [cursor=pointer]:
        - generic [ref=e200]: Attendance
        - img [ref=e201]
      - button "Drive" [ref=e204] [cursor=pointer]:
        - generic [ref=e205]: Drive
        - img [ref=e206]
      - button "Analytics" [ref=e209] [cursor=pointer]:
        - generic [ref=e210]: Analytics
        - img [ref=e211]
      - button "Communication" [ref=e214] [cursor=pointer]:
        - generic [ref=e215]: Communication
        - img [ref=e216]
      - button "Community" [ref=e219] [cursor=pointer]:
        - generic [ref=e220]: Community
        - img [ref=e221]
      - button "Tools" [ref=e224] [cursor=pointer]:
        - generic [ref=e225]: Tools
        - img [ref=e226]
      - button "Workspace Settings" [ref=e229] [cursor=pointer]:
        - generic [ref=e230]: Workspace Settings
        - img [ref=e231]
    - generic [ref=e233]:
      - generic [ref=e234]:
        - generic: v1.0.0 - Jun 25, 2026
      - generic [ref=e235]:
        - button "العربية" [ref=e236] [cursor=pointer]:
          - generic [ref=e237]: العربية
        - button "Logout" [ref=e238] [cursor=pointer]:
          - generic [ref=e239]: Logout
  - main [ref=e240]
```

# Test source

```ts
  1   | /**
  2   |  * UI Auth Helpers — Keycloak login via browser
  3   |  */
  4   | import { testConfig } from '../config/test.config.js';
  5   | 
  6   | /**
  7   |  * Login via Keycloak UI. Call after navigating to a protected page.
  8   |  * Detects Keycloak redirect and fills credentials.
  9   |  */
  10  | export async function loginAsRole(page, role = 'superAdmin') {
  11  |   const user = testConfig[role];
  12  |   if (!user) throw new Error(`Unknown role: ${role}`);
  13  | 
  14  |   // Wait for possible redirect to Keycloak (up to 10s)
  15  |   await page.waitForTimeout(1000);
  16  |   let currentUrl = page.url();
  17  |   for (let i = 0; i < 10 && !(currentUrl.includes('keycloak') || currentUrl.includes('8080')); i++) {
  18  |     await page.waitForTimeout(1000);
  19  |     currentUrl = page.url();
  20  |   }
  21  | 
  22  |   if (currentUrl.includes('keycloak') || currentUrl.includes('8080')) {
  23  |     // Wait for the login form to be visible
  24  |     const usernameField = page.locator('input[name="username"], input[type="email"], input#username').first();
  25  |     const passwordField = page.locator('input[name="password"], input[type="password"], input#password').first();
  26  |     const submitBtn = page.locator('button[type="submit"], input[type="submit"], button[name="login"]').first();
  27  | 
  28  |     await usernameField.waitFor({ state: 'visible', timeout: 10000 });
  29  |     await usernameField.fill(user.email);
  30  |     await passwordField.fill(user.password);
  31  |     await submitBtn.click();
  32  | 
  33  |     // Wait for redirect back to app (30s timeout)
  34  |     await page.waitForURL(url => !url.toString().includes('keycloak') && !url.toString().includes('8080'), {
  35  |       timeout: 30000,
  36  |     });
  37  |     await page.waitForLoadState('networkidle').catch(() => {});
  38  |   }
  39  |   return user;
  40  | }
  41  | 
  42  | /**
  43  |  * Navigate to a path and handle Keycloak login if redirected.
  44  |  */
  45  | export async function gotoWithAuth(page, path, role = 'superAdmin') {
  46  |   await page.goto(`${testConfig.baseUrl}${path}`);
  47  |   await page.waitForLoadState('networkidle');
  48  |   await loginAsRole(page, role);
> 49  |   await page.waitForTimeout(1500);
      |              ^ Error: page.waitForTimeout: Test timeout of 60000ms exceeded.
  50  | }
  51  | 
  52  | /**
  53  |  * Logout from the application.
  54  |  */
  55  | export async function logout(page) {
  56  |   const logoutSelectors = [
  57  |     'button:has-text("Logout")',
  58  |     'button:has-text("Sign Out")',
  59  |     'a[href*="logout"]',
  60  |     '[data-testid="logout-btn"]',
  61  |   ];
  62  |   for (const sel of logoutSelectors) {
  63  |     const btn = page.locator(sel).first();
  64  |     if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
  65  |       await btn.click();
  66  |       break;
  67  |     }
  68  |   }
  69  | }
  70  | 
  71  | /**
  72  |  * Wait for main content to render. Checks for common content containers.
  73  |  */
  74  | export async function waitForContent(page) {
  75  |   const selectors = [
  76  |     'main',
  77  |     '[role="main"]',
  78  |     '.main-content',
  79  |     'table',
  80  |     '[role="grid"]',
  81  |     '.card',
  82  |     '.list',
  83  |     'h1, h2, h3',
  84  |   ];
  85  |   for (const sel of selectors) {
  86  |     if (await page.locator(sel).first().isVisible({ timeout: 5000 }).catch(() => false)) {
  87  |       return true;
  88  |     }
  89  |   }
  90  |   return false;
  91  | }
  92  | 
  93  | /**
  94  |  * Wait for a table or list to render.
  95  |  */
  96  | export async function waitForList(page, selectors = ['table', '[role="grid"]', '.list', '[data-testid*="list"]', 'main']) {
  97  |   for (const sel of selectors) {
  98  |     if (await page.locator(sel).first().isVisible({ timeout: 5000 }).catch(() => false)) {
  99  |       return true;
  100 |     }
  101 |   }
  102 |   return false;
  103 | }
  104 | 
  105 | /**
  106 |  * Check if access denied message is shown.
  107 |  */
  108 | export async function isAccessDenied(page) {
  109 |   const denied = page.locator('text=/Access Denied/i, text=/unauthorized/i, text=/need.*privileges/i');
  110 |   return await denied.first().isVisible({ timeout: 2000 }).catch(() => false);
  111 | }
  112 | 
  113 | /**
  114 |  * Dismiss any modal/overlay that might block clicks (clock overlay, etc).
  115 |  */
  116 | export async function dismissOverlays(page) {
  117 |   // The app has a clock overlay that can intercept clicks
  118 |   await page.evaluate(() => {
  119 |     const overlays = document.querySelectorAll('.clock-content, .navbar-container');
  120 |     overlays.forEach(el => {
  121 |       if (el.style) el.style.pointerEvents = 'none';
  122 |     });
  123 |   }).catch(() => {});
  124 | }
  125 | 
  126 | /**
  127 |  * Try multiple selectors to find and click a button.
  128 |  */
  129 | export async function clickButton(page, textOptions) {
  130 |   for (const text of textOptions) {
  131 |     const btn = page.locator(`button:has-text("${text}"), [data-testid*="${text.toLowerCase().replace(/\s+/g, '-')}"]`).first();
  132 |     if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
  133 |       await btn.click();
  134 |       return true;
  135 |     }
  136 |   }
  137 |   return false;
  138 | }
  139 | 
  140 | /**
  141 |  * Fill a form field by trying multiple selectors.
  142 |  */
  143 | export async function fillField(page, selectors, value) {
  144 |   for (const sel of selectors) {
  145 |     const field = page.locator(sel).first();
  146 |     if (await field.isVisible({ timeout: 2000 }).catch(() => false)) {
  147 |       await field.fill(value);
  148 |       return true;
  149 |     }
```