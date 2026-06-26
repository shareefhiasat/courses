# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: announcements-ui.spec.js >> Announcements UI — Create Flow (Deep) >> TC-ANN-UI-007: Create announcement — fill form and submit
- Location: tests/e2e/specs/announcements-ui.spec.js:101:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForTimeout: Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e2]:
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
            - generic [ref=e18]: 2:26 PM
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
  - img "Loading..." [ref=e245]
```

# Test source

```ts
  105 |     }
  106 |     if (!results[i]) results[i] = false;
  107 |   }
  108 |   return results;
  109 | }
  110 | 
  111 | /**
  112 |  * Submit a form and wait for success or error.
  113 |  * @param {import('@playwright/test').Page} page
  114 |  * @param {string[]} submitButtonTextOptions - e.g. ['Save', 'Submit', 'Create']
  115 |  * @param {number} timeout - ms to wait for response
  116 |  * @returns {Promise<{submitted: boolean, success: boolean, errorVisible: boolean}>}
  117 |  */
  118 | export async function submitForm(page, submitButtonTextOptions, timeout = 5000) {
  119 |   let submitted = false;
  120 |   for (const text of submitButtonTextOptions) {
  121 |     const btn = page.locator(`button:has-text("${text}"), button[type="submit"]`).first();
  122 |     if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
  123 |       await btn.click();
  124 |       submitted = true;
  125 |       break;
  126 |     }
  127 |   }
  128 |   if (!submitted) {
  129 |     // Try generic submit
  130 |     const submit = page.locator('button[type="submit"]').first();
  131 |     if (await submit.isVisible({ timeout: 1000 }).catch(() => false)) {
  132 |       await submit.click();
  133 |       submitted = true;
  134 |     }
  135 |   }
  136 |   if (!submitted) return { submitted: false, success: false, errorVisible: false };
  137 | 
  138 |   await page.waitForTimeout(timeout);
  139 | 
  140 |   // Check for success indicators
  141 |   const successIndicators = page.locator(
  142 |     'text=/success/i, text=/created/i, text=/saved/i, text=/updated/i, ' +
  143 |     '[data-testid*="success"], .toast-success, .alert-success, .notification-success'
  144 |   );
  145 |   const successVisible = await successIndicators.first().isVisible({ timeout: 2000 }).catch(() => false);
  146 | 
  147 |   // Check for error indicators
  148 |   const errorIndicators = page.locator(
  149 |     'text=/error/i, text=/failed/i, text=/invalid/i, text=/required/i, ' +
  150 |     '[data-testid*="error"], .toast-error, .alert-error, .error-message, .field-error'
  151 |   );
  152 |   const errorVisible = await errorIndicators.first().isVisible({ timeout: 2000 }).catch(() => false);
  153 | 
  154 |   // Check if form closed (another success indicator)
  155 |   const form = page.locator('form, [role="dialog"], .modal, .drawer').first();
  156 |   const formStillOpen = await form.isVisible({ timeout: 1000 }).catch(() => false);
  157 | 
  158 |   return {
  159 |     submitted: true,
  160 |     success: successVisible || !formStillOpen,
  161 |     errorVisible,
  162 |   };
  163 | }
  164 | 
  165 | /**
  166 |  * Verify an entity appears in a list/table.
  167 |  * Handles MUI DataGrid pagination and cases where the grid needs a page reload to refresh.
  168 |  * @param {import('@playwright/test').Page} page
  169 |  * @param {string} searchText - text to find in the list
  170 |  * @param {string[]} rowSelectors - selectors for list rows
  171 |  * @param {boolean} allowReload - if true, reload the page and retry if not found
  172 |  * @returns {Promise<boolean>}
  173 |  */
  174 | export async function verifyInList(page, searchText, rowSelectors = ['[role="grid"] [role="row"]', 'table tbody tr', '[data-testid*="item"]', '[data-testid*="row"]', '.list-item', '.card'], allowReload = true) {
  175 |   const _checkAllPages = async () => {
  176 |     for (let pageNum = 0; pageNum < 5; pageNum++) {
  177 |       for (const sel of rowSelectors) {
  178 |         const rows = page.locator(sel);
  179 |         const count = await rows.count();
  180 |         for (let i = 0; i < count; i++) {
  181 |           const text = await rows.nth(i).textContent().catch(() => '');
  182 |           if (text && text.includes(searchText)) {
  183 |             return true;
  184 |           }
  185 |         }
  186 |       }
  187 |       // Try next page
  188 |       const nextBtn = page.locator('[aria-label="Go to next page"], button:has-text("Next")').first();
  189 |       const nextVisible = await nextBtn.isVisible({ timeout: 1000 }).catch(() => false);
  190 |       if (!nextVisible) break;
  191 |       const isDisabled = await nextBtn.getAttribute('disabled');
  192 |       if (isDisabled !== null) break;
  193 |       await nextBtn.click();
  194 |       await page.waitForTimeout(1000);
  195 |     }
  196 |     return false;
  197 |   };
  198 | 
  199 |   // First attempt: check without reload
  200 |   if (await _checkAllPages()) return true;
  201 | 
  202 |   // Second attempt: reload the page to refresh grid data, then check
  203 |   if (allowReload) {
  204 |     await page.reload();
> 205 |     await page.waitForTimeout(5000);
      |                ^ Error: page.waitForTimeout: Test timeout of 60000ms exceeded.
  206 |     if (await _checkAllPages()) return true;
  207 |   }
  208 | 
  209 |   return false;
  210 | }
  211 | 
  212 | /**
  213 |  * Verify an entity does NOT appear in a list/table.
  214 |  */
  215 | export async function verifyNotInList(page, searchText, rowSelectors = ['[role="grid"] [role="row"]', 'table tbody tr', '[data-testid*="item"]', '[data-testid*="row"]', '.list-item', '.card']) {
  216 |   return !(await verifyInList(page, searchText, rowSelectors, false));
  217 | }
  218 | 
  219 | /**
  220 |  * Count rows in a table/list.
  221 |  * Checks MUI DataGrid rows first, then falls back to table/list selectors.
  222 |  */
  223 | export async function getRowCount(page, rowSelectors = ['table tbody tr', '[data-testid*="item"]', '[data-testid*="row"]', '.list-item']) {
  224 |   // Check MUI DataGrid first
  225 |   const gridRows = page.locator('[role="grid"] .MuiDataGrid-row');
  226 |   const gridCount = await gridRows.count();
  227 |   if (gridCount > 0) return gridCount;
  228 | 
  229 |   for (const sel of rowSelectors) {
  230 |     const rows = page.locator(sel);
  231 |     const count = await rows.count();
  232 |     if (count > 0) return count;
  233 |   }
  234 |   return 0;
  235 | }
  236 | 
  237 | /**
  238 |  * Switch to a tab and verify content changes.
  239 |  * @param {import('@playwright/test').Page} page
  240 |  * @param {string} tabText - visible text of the tab
  241 |  * @param {string[]} tabSelectors - alternative selectors
  242 |  * @returns {Promise<{clicked: boolean, contentBefore: string, contentAfter: string, changed: boolean}>}
  243 |  */
  244 | export async function switchTab(page, tabText, tabSelectors = []) {
  245 |   const contentBefore = await page.locator('main, [role="main"]').first().textContent().catch(() => '');
  246 | 
  247 |   const selectors = [
  248 |     `button:has-text("${tabText}")`,
  249 |     `[role="tab"]:has-text("${tabText}")`,
  250 |     `a:has-text("${tabText}")`,
  251 |     `[data-testid*="${tabText.toLowerCase().replace(/\s+/g, '-')}"]`,
  252 |     ...tabSelectors,
  253 |   ];
  254 | 
  255 |   for (const sel of selectors) {
  256 |     const tab = page.locator(sel).first();
  257 |     if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
  258 |       await tab.click();
  259 |       await page.waitForTimeout(1500);
  260 |       const contentAfter = await page.locator('main, [role="main"]').first().textContent().catch(() => '');
  261 |       return {
  262 |         clicked: true,
  263 |         contentBefore: contentBefore?.slice(0, 200) || '',
  264 |         contentAfter: contentAfter?.slice(0, 200) || '',
  265 |         changed: contentBefore !== contentAfter,
  266 |       };
  267 |     }
  268 |   }
  269 |   return { clicked: false, contentBefore: '', contentAfter: '', changed: false };
  270 | }
  271 | 
  272 | /**
  273 |  * Select a dropdown option and verify results change.
  274 |  * @param {import('@playwright/test').Page} page
  275 |  * @param {string[]} dropdownSelectors - selectors for the dropdown
  276 |  * @param {string} optionValue - value or label to select
  277 |  * @returns {Promise<{selected: boolean, rowBefore: number, rowAfter: number, changed: boolean}>}
  278 |  */
  279 | export async function selectDropdownAndVerify(page, dropdownSelectors, optionValue) {
  280 |   const rowBefore = await getRowCount(page);
  281 | 
  282 |   for (const sel of dropdownSelectors) {
  283 |     const dropdown = page.locator(sel).first();
  284 |     if (await dropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
  285 |       try {
  286 |         await dropdown.selectOption(optionValue);
  287 |       } catch {
  288 |         // Try clicking to open then select
  289 |         await dropdown.click();
  290 |         await page.waitForTimeout(500);
  291 |         const option = page.locator(`option:has-text("${optionValue}"), [role="option"]:has-text("${optionValue}")`).first();
  292 |         if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
  293 |           await option.click();
  294 |         }
  295 |       }
  296 |       await page.waitForTimeout(1500);
  297 |       const rowAfter = await getRowCount(page);
  298 |       return { selected: true, rowBefore, rowAfter, changed: rowBefore !== rowAfter };
  299 |     }
  300 |   }
  301 |   return { selected: false, rowBefore, rowAfter: rowBefore, changed: false };
  302 | }
  303 | 
  304 | /**
  305 |  * Search for text and verify results change.
```