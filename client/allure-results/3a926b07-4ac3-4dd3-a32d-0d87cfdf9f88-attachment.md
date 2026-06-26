# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: resources-participations-behaviors-ui.spec.js >> Participations UI — Page Load & Structure >> TC-PAR-UI-002: Participations list or empty state renders
- Location: tests/e2e/specs/resources-participations-behaviors-ui.spec.js:180:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic:
        - button "Menu":
          - img
        - generic:
          - button "Collapse navbar":
            - img
        - generic:
          - generic:
            - img "QAF"
        - generic:
          - generic:
            - generic:
              - generic: 2:34 PM
            - generic:
              - generic:
                - button:
                  - img
              - generic:
                - button:
                  - img
          - generic:
            - generic: Jun 25, Thu 2026
        - generic:
          - generic:
            - generic:
              - button "Switch to Arabic":
                - img
            - generic:
              - button "Help":
                - img
            - generic:
              - button "information":
                - img
            - generic:
              - button:
                - img
          - generic:
            - generic:
              - generic: D
            - generic:
              - generic:
                - generic:
                  - img
    - generic [ref=e5]:
      - generic "Resize" [ref=e6]
      - generic [ref=e8]:
        - generic [ref=e10]: D
        - generic [ref=e11]:
          - button "Switch to Dark" [ref=e12] [cursor=pointer]:
            - img [ref=e13]
          - button "Collapse" [ref=e15] [cursor=pointer]:
            - img [ref=e16]
          - button "enable auto hide" [ref=e18] [cursor=pointer]:
            - img [ref=e19]
          - button "disable sticky" [ref=e22] [cursor=pointer]:
            - img [ref=e23]
          - button [ref=e25] [cursor=pointer]:
            - img [ref=e26]
      - navigation [ref=e29]:
        - generic [ref=e30]:
          - button "Main" [ref=e31] [cursor=pointer]:
            - generic [ref=e32]: Main
            - img [ref=e33]
          - generic [ref=e35]:
            - generic [ref=e36]:
              - link "Home" [ref=e37] [cursor=pointer]:
                - /url: /
                - img [ref=e39]
                - generic [ref=e42]: Home
              - button "Open in new tab" [ref=e43] [cursor=pointer]:
                - img [ref=e44]
              - button "pin" [ref=e48] [cursor=pointer]:
                - img [ref=e49]
            - generic [ref=e51]:
              - link "Dashboard" [ref=e52] [cursor=pointer]:
                - /url: /dashboard
                - img [ref=e54]
                - generic [ref=e59]: Dashboard
              - button "Open in new tab" [ref=e60] [cursor=pointer]:
                - img [ref=e61]
              - button "pin" [ref=e65] [cursor=pointer]:
                - img [ref=e66]
        - button "Activity" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: Activity
          - img [ref=e71]
        - button "Quiz" [ref=e74] [cursor=pointer]:
          - generic [ref=e75]: Quiz
          - img [ref=e76]
        - button "Academic" [ref=e79] [cursor=pointer]:
          - generic [ref=e80]: Academic
          - img [ref=e81]
        - button "Enrollments" [ref=e84] [cursor=pointer]:
          - generic [ref=e85]: Enrollments
          - img [ref=e86]
        - button "Academic Records" [ref=e89] [cursor=pointer]:
          - generic [ref=e90]: Academic Records
          - img [ref=e91]
        - button "Scheduling And Availabilities" [ref=e94] [cursor=pointer]:
          - generic [ref=e95]: Scheduling And Availabilities
          - img [ref=e96]
        - button "Availability" [ref=e99] [cursor=pointer]:
          - generic [ref=e100]: Availability
          - img [ref=e101]
        - button "Review Results" [ref=e104] [cursor=pointer]:
          - generic [ref=e105]: Review Results
          - img [ref=e106]
        - button "Attendance" [ref=e109] [cursor=pointer]:
          - generic [ref=e110]: Attendance
          - img [ref=e111]
        - button "Drive" [ref=e114] [cursor=pointer]:
          - generic [ref=e115]: Drive
          - img [ref=e116]
        - button "Analytics" [ref=e119] [cursor=pointer]:
          - generic [ref=e120]: Analytics
          - img [ref=e121]
        - button "Community" [ref=e124] [cursor=pointer]:
          - generic [ref=e125]: Community
          - img [ref=e126]
        - button "Tools" [ref=e129] [cursor=pointer]:
          - generic [ref=e130]: Tools
          - img [ref=e131]
        - button "Workspace Settings" [ref=e134] [cursor=pointer]:
          - generic [ref=e135]: Workspace Settings
          - img [ref=e136]
      - generic [ref=e138]:
        - generic [ref=e139]:
          - generic: v1.0.0 - Jun 25, 2026
        - generic [ref=e140]:
          - button "العربية" [ref=e141] [cursor=pointer]:
            - generic [ref=e142]: العربية
          - button "Logout" [ref=e143] [cursor=pointer]:
            - generic [ref=e144]: Logout
    - main [ref=e145]:
      - generic [ref=e146]:
        - generic [ref=e147]:
          - generic [ref=e149]:
            - button "All Programs" [ref=e153] [cursor=pointer]:
              - generic [ref=e156]: All Programs
              - img [ref=e158]
            - button "All Subjects" [ref=e163] [cursor=pointer]:
              - generic [ref=e166]: All Subjects
              - img [ref=e168]
            - button "All Classes" [ref=e173] [cursor=pointer]:
              - generic [ref=e176]: All Classes
              - img [ref=e178]
          - button "Select Student *" [ref=e183] [cursor=pointer]:
            - generic [ref=e186]: Select Student *
            - img [ref=e188]
          - button "Select Participation Type *" [ref=e193] [cursor=pointer]:
            - generic [ref=e196]: Select Participation Type *
            - img [ref=e198]
          - generic [ref=e200]:
            - textbox "Comment (Optional)" [ref=e201]
            - spinbutton [ref=e202]: "1"
          - button "Add Participation" [ref=e204] [cursor=pointer]:
            - generic [ref=e205]: Add Participation
        - generic [ref=e206]:
          - generic [ref=e208]:
            - button "All Programs" [ref=e212] [cursor=pointer]:
              - generic [ref=e215]: All Programs
              - img [ref=e217]
            - button "All Subjects" [ref=e222] [cursor=pointer]:
              - generic [ref=e225]: All Subjects
              - img [ref=e227]
            - button "All Classes" [ref=e232] [cursor=pointer]:
              - generic [ref=e235]: All Classes
              - img [ref=e237]
          - generic [ref=e239]:
            - button "Select an option" [ref=e243] [cursor=pointer]:
              - generic [ref=e246]: Select an option
              - img [ref=e248]
            - button "All Types" [ref=e253] [cursor=pointer]:
              - generic [ref=e256]: All Types
              - generic [ref=e257]:
                - button [ref=e258]:
                  - img [ref=e259]
                - img [ref=e262]
        - generic [ref=e264]:
          - generic [ref=e265]:
            - img [ref=e266]
            - text: Total 0
          - generic [ref=e268]:
            - img [ref=e269]
            - text: 0 Students
          - generic [ref=e274]:
            - img [ref=e275]
            - text: 0 Positive
          - generic [ref=e278]:
            - img [ref=e279]
            - text: 0 Negative
        - generic [ref=e284]:
          - button "Export" [ref=e286] [cursor=pointer]
          - generic [ref=e287]:
            - grid [ref=e288]:
              - row "Select all rows User Class Type Participation Points Program Subject Comment" [ref=e289]:
                - columnheader "Select all rows" [ref=e290]:
                  - generic [ref=e292] [cursor=pointer]:
                    - checkbox "Select all rows" [ref=e293]
                    - img [ref=e294]
                  - img [ref=e297]
                - columnheader "User" [ref=e299] [cursor=pointer]:
                  - generic [ref=e301]: User
                  - generic [ref=e302]:
                    - img
                - columnheader "Class" [ref=e303] [cursor=pointer]:
                  - generic [ref=e305]: Class
                  - generic [ref=e306]:
                    - img
                - columnheader "Type" [ref=e307] [cursor=pointer]:
                  - generic [ref=e309]: Type
                  - generic [ref=e310]:
                    - img
                - columnheader "Participation Points" [ref=e311] [cursor=pointer]:
                  - generic [ref=e313]: Participation Points
                  - generic [ref=e314]:
                    - img
                - columnheader "Program" [ref=e315] [cursor=pointer]:
                  - generic [ref=e317]: Program
                  - generic [ref=e318]:
                    - img
                - columnheader "Subject" [ref=e319] [cursor=pointer]:
                  - generic [ref=e321]: Subject
                  - generic [ref=e322]:
                    - img
                - columnheader "Comment" [ref=e323] [cursor=pointer]:
                  - generic [ref=e325]: Comment
                  - generic [ref=e326]:
                    - img
              - generic [ref=e328]: No Data
              - rowgroup
            - generic [ref=e333]:
              - paragraph [ref=e334]: "Rows per page:"
              - generic [ref=e335]:
                - 'combobox "Rows per page: 10" [ref=e336] [cursor=pointer]': "10"
                - textbox: "10"
                - img
              - paragraph [ref=e337]: 0–0 of 0
              - generic [ref=e338]:
                - button "Go to previous page" [disabled]:
                  - img
                - button "Go to next page" [disabled]:
                  - img
  - generic:
    - generic [ref=e339]:
      - img [ref=e341]
      - generic [ref=e345]: Failed to load participations
      - button "Close notification" [ref=e346] [cursor=pointer]:
        - img [ref=e347]
    - generic [ref=e350]:
      - img [ref=e352]
      - generic [ref=e356]: Failed to load participations
      - button "Close notification" [ref=e357] [cursor=pointer]:
        - img [ref=e358]
```

# Test source

```ts
  83  |     const fileInput = page.locator('input[type="file"]').first();
  84  |     const exists = await fileInput.count();
  85  |     if (exists === 0) test.skip(true, 'No file input in form');
  86  | 
  87  |     await closeForm(page);
  88  |   });
  89  | 
  90  |   test('TC-RES-UI-007: Cancel closes upload form', async ({ page }) => {
  91  |     const opened = await openForm(page, ['Upload', 'Add Resource', 'Add']);
  92  |     if (!opened) test.skip(true, 'Upload form did not open');
  93  | 
  94  |     await closeForm(page);
  95  |     await page.waitForTimeout(1000);
  96  | 
  97  |     const form = page.locator('form, [role="dialog"], .modal, .drawer').first();
  98  |     const stillOpen = await form.isVisible({ timeout: 1000 }).catch(() => false);
  99  |     expect(stillOpen).toBe(false);
  100 |   });
  101 | });
  102 | 
  103 | test.describe('Resources UI — Delete & Role-Based (Deep)', () => {
  104 |   test('TC-RES-UI-008: Delete resource button visible', async ({ page }) => {
  105 |     await gotoWithAuth(page, RES_ROUTE, 'instructor');
  106 |     await dismissOverlays(page);
  107 |     const delBtn = page.locator('button:has-text("Delete"), [data-testid*="delete"]').first();
  108 |     const visible = await delBtn.isVisible({ timeout: 3000 }).catch(() => false);
  109 |     if (!visible) test.skip(true, 'No delete button');
  110 |   });
  111 | 
  112 |   test('TC-RES-UI-009: Delete — confirm dialog appears, then cancel', async ({ page }) => {
  113 |     await gotoWithAuth(page, RES_ROUTE, 'instructor');
  114 |     await dismissOverlays(page);
  115 |     const delBtn = page.locator('button:has-text("Delete"), [data-testid*="delete"]').first();
  116 |     if (!(await delBtn.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No delete button');
  117 | 
  118 |     await delBtn.click();
  119 |     await page.waitForTimeout(1000);
  120 | 
  121 |     const confirmDialog = page.locator(
  122 |       '[role="dialog"], .modal, text=/confirm/i, text=/sure/i, ' +
  123 |       'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")'
  124 |     ).first();
  125 |     const confirmVisible = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);
  126 | 
  127 |     if (confirmVisible) {
  128 |       const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("No")').first();
  129 |       if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
  130 |         await cancelBtn.click();
  131 |       } else {
  132 |         await page.keyboard.press('Escape');
  133 |       }
  134 |     }
  135 |     expect(true).toBe(true);
  136 |   });
  137 | 
  138 |   test('TC-RES-UI-010: Student can view resources', async ({ page }) => {
  139 |     await gotoWithAuth(page, RES_ROUTE, 'student');
  140 |     const denied = await isAccessDenied(page);
  141 |     if (denied) test.skip(true, 'Student redirected');
  142 |     const hasContent = await waitForContent(page);
  143 |     expect(hasContent).toBe(true);
  144 |   });
  145 | 
  146 |   test('TC-RES-UI-011: Student cannot upload resources', async ({ page }) => {
  147 |     await gotoWithAuth(page, RES_ROUTE, 'student');
  148 |     const denied = await isAccessDenied(page);
  149 |     if (denied) test.skip(true, 'Student redirected');
  150 |     await dismissOverlays(page);
  151 |     const uploadBtn = page.locator('button:has-text("Upload"), button:has-text("Add")').first();
  152 |     const visible = await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false);
  153 |     if (visible) console.warn('BUG: Student can see upload resource button');
  154 |     expect(true).toBe(true);
  155 |   });
  156 | 
  157 |   test('TC-RES-UI-012: Unauthenticated redirect', async ({ page }) => {
  158 |     await page.goto(`${testConfig.baseUrl}/?mode=resources`);
  159 |     await page.waitForLoadState('networkidle');
  160 |     const url = page.url();
  161 |     expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  162 |   });
  163 | });
  164 | 
  165 | // ============================================================
  166 | // PARTICIPATIONS
  167 | // ============================================================
  168 | 
  169 | test.describe('Participations UI — Page Load & Structure', () => {
  170 |   test.beforeEach(async ({ page }) => {
  171 |     await gotoWithAuth(page, PAR_ROUTE, 'instructor');
  172 |     await dismissOverlays(page);
  173 |   });
  174 | 
  175 |   test('TC-PAR-UI-001: Participations page loads', async ({ page }) => {
  176 |     const hasContent = await waitForContent(page);
  177 |     expect(hasContent).toBe(true);
  178 |   });
  179 | 
  180 |   test('TC-PAR-UI-002: Participations list or empty state renders', async ({ page }) => {
  181 |     const list = page.locator('table, [data-testid*="participation"], .card, text=/No participation/i').first();
  182 |     const visible = await list.isVisible({ timeout: 5000 }).catch(() => false);
> 183 |     expect(visible).toBe(true);
      |                     ^ Error: expect(received).toBe(expected) // Object.is equality
  184 |   });
  185 | 
  186 |   test('TC-PAR-UI-003: Award participation button visible', async ({ page }) => {
  187 |     const btn = page.locator('button:has-text("Add"), button:has-text("Award"), [data-testid*="create"]').first();
  188 |     const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);
  189 |     expect(visible).toBe(true);
  190 |   });
  191 | 
  192 |   test('TC-PAR-UI-004: Stats summary visible', async ({ page }) => {
  193 |     const stats = page.locator('[data-testid*="stats"], .stat-card, text=/total|points/i').first();
  194 |     const visible = await stats.isVisible({ timeout: 3000 }).catch(() => false);
  195 |     if (!visible) test.skip(true, 'No stats');
  196 |   });
  197 | });
  198 | 
  199 | test.describe('Participations UI — Create Flow (Deep)', () => {
  200 |   test.beforeEach(async ({ page }) => {
  201 |     await gotoWithAuth(page, PAR_ROUTE, 'instructor');
  202 |     await dismissOverlays(page);
  203 |   });
  204 | 
  205 |   test('TC-PAR-UI-005: Award form opens', async ({ page }) => {
  206 |     const opened = await openForm(page, ['Award', 'Add Participation', 'Add', 'Create']);
  207 |     if (!opened) test.skip(true, 'Award form did not open');
  208 | 
  209 |     const form = page.locator('form, [role="dialog"], .modal, .drawer').first();
  210 |     const formVisible = await form.isVisible({ timeout: 3000 }).catch(() => false);
  211 |     expect(formVisible).toBe(true);
  212 | 
  213 |     await closeForm(page);
  214 |   });
  215 | 
  216 |   test('TC-PAR-UI-006: Award form has student selector', async ({ page }) => {
  217 |     const opened = await openForm(page, ['Award', 'Add Participation', 'Add']);
  218 |     if (!opened) test.skip(true, 'Award form did not open');
  219 | 
  220 |     const studentSelect = page.locator('select[name*="student"], [data-testid*="student"]').first();
  221 |     const visible = await studentSelect.isVisible({ timeout: 3000 }).catch(() => false);
  222 |     if (!visible) test.skip(true, 'No student selector');
  223 | 
  224 |     await closeForm(page);
  225 |   });
  226 | 
  227 |   test('TC-PAR-UI-007: Award form has points field', async ({ page }) => {
  228 |     const opened = await openForm(page, ['Award', 'Add Participation', 'Add']);
  229 |     if (!opened) test.skip(true, 'Award form did not open');
  230 | 
  231 |     const pointsField = page.locator('input[name*="point"], input[type="number"], [data-testid*="point"]').first();
  232 |     const visible = await pointsField.isVisible({ timeout: 3000 }).catch(() => false);
  233 |     if (!visible) test.skip(true, 'No points field');
  234 | 
  235 |     await closeForm(page);
  236 |   });
  237 | 
  238 |   test('TC-PAR-UI-008: Cancel closes award form', async ({ page }) => {
  239 |     const opened = await openForm(page, ['Award', 'Add Participation', 'Add']);
  240 |     if (!opened) test.skip(true, 'Award form did not open');
  241 | 
  242 |     await closeForm(page);
  243 |     await page.waitForTimeout(1000);
  244 | 
  245 |     const form = page.locator('form, [role="dialog"], .modal, .drawer').first();
  246 |     const stillOpen = await form.isVisible({ timeout: 1000 }).catch(() => false);
  247 |     expect(stillOpen).toBe(false);
  248 |   });
  249 | });
  250 | 
  251 | test.describe('Participations UI — Delete & Role-Based (Deep)', () => {
  252 |   test('TC-PAR-UI-009: Delete participation button visible', async ({ page }) => {
  253 |     await gotoWithAuth(page, PAR_ROUTE, 'instructor');
  254 |     await dismissOverlays(page);
  255 |     const delBtn = page.locator('button:has-text("Delete"), [data-testid*="delete"]').first();
  256 |     const visible = await delBtn.isVisible({ timeout: 3000 }).catch(() => false);
  257 |     if (!visible) test.skip(true, 'No delete button');
  258 |   });
  259 | 
  260 |   test('TC-PAR-UI-010: Delete — confirm dialog, then cancel', async ({ page }) => {
  261 |     await gotoWithAuth(page, PAR_ROUTE, 'instructor');
  262 |     await dismissOverlays(page);
  263 |     const delBtn = page.locator('button:has-text("Delete"), [data-testid*="delete"]').first();
  264 |     if (!(await delBtn.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No delete button');
  265 | 
  266 |     await delBtn.click();
  267 |     await page.waitForTimeout(1000);
  268 | 
  269 |     const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("No")').first();
  270 |     if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  271 |       await cancelBtn.click();
  272 |     } else {
  273 |       await page.keyboard.press('Escape');
  274 |     }
  275 |     expect(true).toBe(true);
  276 |   });
  277 | 
  278 |   test('TC-PAR-UI-011: Student views own participations', async ({ page }) => {
  279 |     await gotoWithAuth(page, PAR_ROUTE, 'student');
  280 |     const denied = await isAccessDenied(page);
  281 |     if (denied) test.skip(true, 'Student redirected');
  282 |     const hasContent = await waitForContent(page);
  283 |     expect(hasContent).toBe(true);
```