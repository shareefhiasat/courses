# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: subjects-ui.spec.js >> Subjects UI — Create Flow (Deep) >> TC-SUBJ-UI-007: Create subject — fill form and submit
- Location: tests/e2e/specs/subjects-ui.spec.js:88:3

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
      - generic [ref=e5]:
        - button "Menu" [ref=e6] [cursor=pointer]:
          - img [ref=e7]
        - button "Collapse navbar" [ref=e9] [cursor=pointer]:
          - img [ref=e10]
        - img "QAF" [ref=e14]
        - generic [ref=e15]:
          - generic [ref=e16]:
            - generic [ref=e18]: 2:37 PM
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
    - main [ref=e240]:
      - generic [ref=e241]:
        - generic [ref=e242]:
          - generic [ref=e243]:
            - button "Select Program" [ref=e246] [cursor=pointer]:
              - generic [ref=e249]: Select Program
              - img [ref=e251]
            - textbox "Subject Code * (e.g., CS101)*" [ref=e255]
            - textbox "Subject Name (English) * (e.g., Introduction to Programming)*" [ref=e258]
            - textbox "Subject Name (Arabic) * (e.g., مقدمة في البرمجة)*" [ref=e261]
            - spinbutton [ref=e264]: "3"
            - button "Core Subject" [ref=e267] [cursor=pointer]:
              - generic [ref=e269]:
                - img [ref=e271]
                - generic [ref=e274]: Core Subject
              - generic [ref=e275]:
                - button [ref=e276]:
                  - img [ref=e277]
                - img [ref=e280]
            - button "Mandatory" [ref=e284] [cursor=pointer]:
              - generic [ref=e286]:
                - img [ref=e288]
                - generic [ref=e290]: Mandatory
              - generic [ref=e291]:
                - button [ref=e292]:
                  - img [ref=e293]
                - img [ref=e296]
          - generic [ref=e298]:
            - textbox "Description (English)" [ref=e301]
            - textbox "Description (Arabic) - وصف البرنامج بالعربية" [ref=e304]
          - button "Save" [ref=e306] [cursor=pointer]:
            - generic [ref=e307]: Save
        - generic [ref=e310]:
          - button "Export" [ref=e312] [cursor=pointer]
          - generic [ref=e313]:
            - grid [ref=e314]:
              - row "Select all rows Code Name (EN) Name (AR) Credits Type Requirement Type Created By" [ref=e315]:
                - columnheader "Select all rows" [ref=e316]:
                  - generic [ref=e318] [cursor=pointer]:
                    - checkbox "Select all rows" [ref=e319]
                    - img [ref=e320]
                  - img [ref=e323]
                - columnheader "Code" [ref=e325] [cursor=pointer]:
                  - generic [ref=e327]: Code
                  - generic [ref=e328]:
                    - img
                - columnheader "Name (EN)" [ref=e329] [cursor=pointer]:
                  - generic [ref=e331]: Name (EN)
                  - generic [ref=e332]:
                    - img
                - columnheader "Name (AR)" [ref=e333] [cursor=pointer]:
                  - generic [ref=e335]: Name (AR)
                  - generic [ref=e336]:
                    - img
                - columnheader "Credits" [ref=e337] [cursor=pointer]:
                  - generic [ref=e339]: Credits
                  - generic [ref=e340]:
                    - img
                - columnheader "Type" [ref=e341] [cursor=pointer]:
                  - generic [ref=e343]: Type
                  - generic [ref=e344]:
                    - img
                - columnheader "Requirement Type" [ref=e345] [cursor=pointer]:
                  - generic [ref=e347]: Requirement Type
                  - generic [ref=e348]:
                    - img
                - columnheader "Created By" [ref=e349] [cursor=pointer]:
                  - generic [ref=e351]: Created By
                  - generic [ref=e352]:
                    - img
              - rowgroup [ref=e353]:
                - row "Select row E2E-SUBJ-1782387387354 Updated 1782387388093 مادة اختبار E2E 3 Core Subject Mandatory Shareef Hiasat" [ref=e354]:
                  - gridcell "Select row" [ref=e355]:
                    - generic [ref=e356] [cursor=pointer]:
                      - checkbox "Select row" [ref=e357]
                      - img [ref=e358]
                  - gridcell "E2E-SUBJ-1782387387354" [ref=e360]
                  - gridcell "Updated 1782387388093" [ref=e361]
                  - gridcell "مادة اختبار E2E" [ref=e362]
                  - gridcell "3" [ref=e363]
                  - gridcell "Core Subject" [ref=e364]
                  - gridcell "Mandatory" [ref=e365]
                  - gridcell "Shareef Hiasat" [ref=e366]
                - row "Select row E2E-SUBJ-1782386573493 E2E Test مادة 3 Core Subject Mandatory Shareef Hiasat" [ref=e367]:
                  - gridcell "Select row" [ref=e368]:
                    - generic [ref=e369] [cursor=pointer]:
                      - checkbox "Select row" [ref=e370]
                      - img [ref=e371]
                  - gridcell "E2E-SUBJ-1782386573493" [ref=e373]
                  - gridcell "E2E Test" [ref=e374]
                  - gridcell "مادة" [ref=e375]
                  - gridcell "3" [ref=e376]
                  - gridcell "Core Subject" [ref=e377]
                  - gridcell "Mandatory" [ref=e378]
                  - gridcell "Shareef Hiasat" [ref=e379]
                - row "Select row E2E-SUBJ-1782383213663 E2E-SUBJ-1782383213663 مادة اختبار E2E 3 Core Subject Mandatory Shareef Hiasat" [ref=e380]:
                  - gridcell "Select row" [ref=e381]:
                    - generic [ref=e382] [cursor=pointer]:
                      - checkbox "Select row" [ref=e383]
                      - img [ref=e384]
                  - gridcell "E2E-SUBJ-1782383213663" [ref=e386]
                  - gridcell "E2E-SUBJ-1782383213663" [ref=e387]
                  - gridcell "مادة اختبار E2E" [ref=e388]
                  - gridcell "3" [ref=e389]
                  - gridcell "Core Subject" [ref=e390]
                  - gridcell "Mandatory" [ref=e391]
                  - gridcell "Shareef Hiasat" [ref=e392]
                - row "Select row EE101 Updated 1782382320788 تحليل الدوائر 4 Core Subject Mandatory Shareef Hiasat" [ref=e393]:
                  - gridcell "Select row" [ref=e394]:
                    - generic [ref=e395] [cursor=pointer]:
                      - checkbox "Select row" [ref=e396]
                      - img [ref=e397]
                  - gridcell "EE101" [ref=e399]
                  - gridcell "Updated 1782382320788" [ref=e400]
                  - gridcell "تحليل الدوائر" [ref=e401]
                  - gridcell "4" [ref=e402]
                  - gridcell "Core Subject" [ref=e403]
                  - gridcell "Mandatory" [ref=e404]
                  - gridcell "Shareef Hiasat" [ref=e405]
                - row "Select row ME102 Thermodynamics الديناميكا الحرارية 3 Core Subject Mandatory Shareef Hiasat" [ref=e406]:
                  - gridcell "Select row" [ref=e407]:
                    - generic [ref=e408] [cursor=pointer]:
                      - checkbox "Select row" [ref=e409]
                      - img [ref=e410]
                  - gridcell "ME102" [ref=e412]
                  - gridcell "Thermodynamics" [ref=e413]
                  - gridcell "الديناميكا الحرارية" [ref=e414]
                  - gridcell "3" [ref=e415]
                  - gridcell "Core Subject" [ref=e416]
                  - gridcell "Mandatory" [ref=e417]
                  - gridcell "Shareef Hiasat" [ref=e418]
                - row "Select row NET101 Network Fundamentals أساسيات الشبكات 3 Core Subject Mandatory Shareef Hiasat" [ref=e419]:
                  - gridcell "Select row" [ref=e420]:
                    - generic [ref=e421] [cursor=pointer]:
                      - checkbox "Select row" [ref=e422]
                      - img [ref=e423]
                  - gridcell "NET101" [ref=e425]
                  - gridcell "Network Fundamentals" [ref=e426]
                  - gridcell "أساسيات الشبكات" [ref=e427]
                  - gridcell "3" [ref=e428]
                  - gridcell "Core Subject" [ref=e429]
                  - gridcell "Mandatory" [ref=e430]
                  - gridcell "Shareef Hiasat" [ref=e431]
                - row "Select row DB101 Database Management إدارة قواعد البيانات 3 Core Subject Mandatory Shareef Hiasat" [ref=e432]:
                  - gridcell "Select row" [ref=e433]:
                    - generic [ref=e434] [cursor=pointer]:
                      - checkbox "Select row" [ref=e435]
                      - img [ref=e436]
                  - gridcell "DB101" [ref=e438]
                  - gridcell "Database Management" [ref=e439]
                  - gridcell "إدارة قواعد البيانات" [ref=e440]
                  - gridcell "3" [ref=e441]
                  - gridcell "Core Subject" [ref=e442]
                  - gridcell "Mandatory" [ref=e443]
                  - gridcell "Shareef Hiasat" [ref=e444]
                - row "Select row WEB101 Web Development Basics أساسيات تطوير الويب 4 Core Subject Mandatory Shareef Hiasat" [ref=e445]:
                  - gridcell "Select row" [ref=e446]:
                    - generic [ref=e447] [cursor=pointer]:
                      - checkbox "Select row" [ref=e448]
                      - img [ref=e449]
                  - gridcell "WEB101" [ref=e451]
                  - gridcell "Web Development Basics" [ref=e452]
                  - gridcell "أساسيات تطوير الويب" [ref=e453]
                  - gridcell "4" [ref=e454]
                  - gridcell "Core Subject" [ref=e455]
                  - gridcell "Mandatory" [ref=e456]
                  - gridcell "Shareef Hiasat" [ref=e457]
                - row "Select row CS101 Computer Science Fundamentals أساسيات علوم الكمبيوتر 3 Core Subject Mandatory Shareef Hiasat" [ref=e458]:
                  - gridcell "Select row" [ref=e459]:
                    - generic [ref=e460] [cursor=pointer]:
                      - checkbox "Select row" [ref=e461]
                      - img [ref=e462]
                  - gridcell "CS101" [ref=e464]
                  - gridcell "Computer Science Fundamentals" [ref=e465]
                  - gridcell "أساسيات علوم الكمبيوتر" [ref=e466]
                  - gridcell "3" [ref=e467]
                  - gridcell "Core Subject" [ref=e468]
                  - gridcell "Mandatory" [ref=e469]
                  - gridcell "Shareef Hiasat" [ref=e470]
            - generic [ref=e475]:
              - paragraph [ref=e476]: "Rows per page:"
              - generic [ref=e477]:
                - 'combobox "Rows per page: 10" [ref=e478] [cursor=pointer]': "10"
                - textbox: "10"
                - img
              - paragraph [ref=e479]: 1–9 of 9
              - generic [ref=e480]:
                - button "Go to previous page" [disabled]:
                  - img
                - button "Go to next page" [disabled]:
                  - img
  - img "Loading..." [ref=e485]
```

# Test source

```ts
  11  |  * - Delete: click delete → confirm dialog → cancel → verify remains
  12  |  * - Form validation: submit empty → verify errors
  13  |  * - Filter: program filter, type filter — verify results change
  14  |  * - Role-based: student access, instructor access
  15  |  * - User story: admin creates subject → verify visible
  16  |  * - Pagination + sorting + bulk + export
  17  |  */
  18  | import { test, expect } from '@playwright/test';
  19  | import { testConfig } from '../config/test.config.js';
  20  | import { gotoWithAuth, waitForContent, isAccessDenied, dismissOverlays } from '../utils/ui-helpers.js';
  21  | import {
  22  |   openForm, closeForm, submitForm, verifyInList, verifyNotInList,
  23  |   getRowCount, searchAndVerify, clearSearch,
  24  |   clickEditAndVerifyForm, clickDeleteAndConfirm, verifyFormValidation,
  25  |   getTableHeaders, verifyPagination, verifySorting,
  26  |   selectFromCustomDropdown, fillByPlaceholder,
  27  | } from '../utils/crud-helpers.js';
  28  | 
  29  | const ROUTE = '/subjects';
  30  | const TEST_PREFIX = 'TEST_SUBJ_';
  31  | 
  32  | test.describe('Subjects UI — Page Load & Structure', () => {
  33  |   test.beforeEach(async ({ page }) => {
  34  |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  35  |     await dismissOverlays(page);
  36  |   });
  37  | 
  38  |   test('TC-SUBJ-UI-001: Subjects page loads with content', async ({ page }) => {
  39  |     const hasContent = await waitForContent(page);
  40  |     expect(hasContent).toBe(true);
  41  |   });
  42  | 
  43  |   test('TC-SUBJ-UI-002: Subjects table or card list renders', async ({ page }) => {
  44  |     const table = page.locator('table, [role="grid"], [data-testid*="subject"]').first();
  45  |     const visible = await table.isVisible({ timeout: 5000 }).catch(() => false);
  46  |     expect(visible).toBe(true);
  47  |   });
  48  | 
  49  |   test('TC-SUBJ-UI-003: Table has expected column headers', async ({ page }) => {
  50  |     const headers = await getTableHeaders(page);
  51  |     if (headers.length === 0) test.skip(true, 'No table headers — card layout');
  52  |     const hasName = headers.some(h => /name|subject/i.test(h));
  53  |     expect(hasName).toBe(true);
  54  |   });
  55  | 
  56  |   test('TC-SUBJ-UI-004: Row count is non-zero or empty state shown', async ({ page }) => {
  57  |     const count = await getRowCount(page);
  58  |     const emptyState = page.locator('text=/no.*subject/i, text=/empty/i, [data-testid*="empty"]');
  59  |     const hasEmpty = await emptyState.first().isVisible({ timeout: 2000 }).catch(() => false);
  60  |     expect(count > 0 || hasEmpty).toBe(true);
  61  |   });
  62  | });
  63  | 
  64  | test.describe('Subjects UI — Create Flow (Deep)', () => {
  65  |   test.beforeEach(async ({ page }) => {
  66  |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  67  |     await dismissOverlays(page);
  68  |   });
  69  | 
  70  |   test('TC-SUBJ-UI-005: Create form visible for admin', async ({ page }) => {
  71  |     // Subjects page uses an inline dashboard-form, not a button-triggered modal
  72  |     const form = page.locator('form.dashboard-form').first();
  73  |     const visible = await form.isVisible({ timeout: 5000 }).catch(() => false);
  74  |     expect(visible).toBe(true);
  75  |   });
  76  | 
  77  |   test('TC-SUBJ-UI-006: Create form opens with expected fields', async ({ page }) => {
  78  |     const opened = await openForm(page, ['Add Subject', 'Create Subject', 'New Subject', 'Add', 'Create']);
  79  |     if (!opened) test.skip(true, 'Create form did not open');
  80  | 
  81  |     const nameField = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
  82  |     const nameVisible = await nameField.isVisible({ timeout: 3000 }).catch(() => false);
  83  |     expect(nameVisible).toBe(true);
  84  | 
  85  |     await closeForm(page);
  86  |   });
  87  | 
  88  |   test('TC-SUBJ-UI-007: Create subject — fill form and submit', async ({ page }) => {
  89  |     const testName = `${TEST_PREFIX}Subject_${Date.now()}`;
  90  |     const opened = await openForm(page, ['Add Subject', 'Create Subject', 'New Subject', 'Add', 'Create']);
  91  |     if (!opened) test.skip(true, 'Create form did not open');
  92  | 
  93  |     // Select program using custom dropdown
  94  |     const programSelected = await selectFromCustomDropdown(page, 'Program', 'Program');
  95  |     if (!programSelected) test.skip(true, 'Could not select program');
  96  | 
  97  |     // Fill code field
  98  |     await fillByPlaceholder(page, 'Code', `SUBJ-${Date.now()}`);
  99  | 
  100 |     // Fill English name
  101 |     await fillByPlaceholder(page, 'English', testName);
  102 | 
  103 |     // Fill Arabic name
  104 |     await fillByPlaceholder(page, 'Arabic', 'مادة اختبار');
  105 | 
  106 |     const result = await submitForm(page, ['Save', 'Create', 'Submit', 'Confirm']);
  107 |     expect(result.submitted).toBe(true);
  108 | 
  109 |     await page.waitForTimeout(2000);
  110 |     const found = await verifyInList(page, testName);
> 111 |     expect(found).toBe(true);
      |                   ^ Error: expect(received).toBe(expected) // Object.is equality
  112 |   });
  113 | 
  114 |   test('TC-SUBJ-UI-008: Form validation — empty submit shows errors', async ({ page }) => {
  115 |     const opened = await openForm(page, ['Add Subject', 'Create Subject', 'Add', 'Create']);
  116 |     if (!opened) test.skip(true, 'Create form did not open');
  117 | 
  118 |     const result = await verifyFormValidation(page, ['Save', 'Create', 'Submit']);
  119 |     expect(result.validationErrorVisible || !result.submitted).toBe(true);
  120 | 
  121 |     await closeForm(page);
  122 |   });
  123 | 
  124 |   test('TC-SUBJ-UI-009: Cancel button — form data not saved without submit', async ({ page }) => {
  125 |     const opened = await openForm(page, ['Add Subject', 'Create Subject', 'Add', 'Create']);
  126 |     if (!opened) test.skip(true, 'Create form did not open');
  127 | 
  128 |     const nameField = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
  129 |     if (await nameField.isVisible({ timeout: 2000 }).catch(() => false)) {
  130 |       await nameField.fill(`${TEST_PREFIX}CANCELLED`);
  131 |     }
  132 | 
  133 |     // For inline forms, just navigate away without submitting
  134 |     await page.waitForTimeout(500);
  135 | 
  136 |     // Verify the unsaved data did not appear in the list
  137 |     const found = await verifyInList(page, `${TEST_PREFIX}CANCELLED`);
  138 |     expect(found).toBe(false);
  139 |   });
  140 | 
  141 |   test('TC-SUBJ-UI-010: Arabic name field visible in form', async ({ page }) => {
  142 |     const opened = await openForm(page, ['Add Subject', 'Create Subject', 'Add', 'Create']);
  143 |     if (!opened) test.skip(true, 'Create form did not open');
  144 | 
  145 |     const arField = page.locator('input[name*="Ar"], input[placeholder*="arabic" i], [data-testid*="arabic"]').first();
  146 |     const visible = await arField.isVisible({ timeout: 3000 }).catch(() => false);
  147 |     if (!visible) test.skip(true, 'No Arabic field found');
  148 |     expect(visible).toBe(true);
  149 | 
  150 |     await closeForm(page);
  151 |   });
  152 | 
  153 |   test('TC-SUBJ-UI-011: Subject type dropdown has options', async ({ page }) => {
  154 |     const opened = await openForm(page, ['Add Subject', 'Create Subject', 'Add', 'Create']);
  155 |     if (!opened) test.skip(true, 'Create form did not open');
  156 | 
  157 |     const typeSelect = page.locator('select[name*="type"], [data-testid*="type"]').first();
  158 |     const visible = await typeSelect.isVisible({ timeout: 3000 }).catch(() => false);
  159 |     if (!visible) test.skip(true, 'No type dropdown');
  160 |     const options = await typeSelect.locator('option').count();
  161 |     expect(options).toBeGreaterThan(1);
  162 | 
  163 |     await closeForm(page);
  164 |   });
  165 | });
  166 | 
  167 | test.describe('Subjects UI — Read & Search (Deep)', () => {
  168 |   test.beforeEach(async ({ page }) => {
  169 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  170 |     await dismissOverlays(page);
  171 |   });
  172 | 
  173 |   test('TC-SUBJ-UI-012: Search filters subjects', async ({ page }) => {
  174 |     const search = page.locator('input[placeholder*="search" i], input[placeholder*="Search" i], [data-testid*="search"] input').first();
  175 |     const visible = await search.isVisible({ timeout: 3000 }).catch(() => false);
  176 |     if (!visible) test.skip(true, 'No search input');
  177 | 
  178 |     const rowBefore = await getRowCount(page);
  179 |     await search.fill('zzz_nonexistent_xyz');
  180 |     await page.waitForTimeout(2000);
  181 |     const rowAfter = await getRowCount(page);
  182 |     expect(rowAfter).toBeLessThanOrEqual(rowBefore);
  183 | 
  184 |     await search.fill('');
  185 |     await page.waitForTimeout(1500);
  186 |     const rowRestored = await getRowCount(page);
  187 |     expect(rowRestored).toBeGreaterThanOrEqual(rowAfter);
  188 |   });
  189 | 
  190 |   test('TC-SUBJ-UI-013: Click subject row to view detail', async ({ page }) => {
  191 |     const row = page.locator('table tbody tr, [data-testid*="subject-item"], .card').first();
  192 |     if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No subjects');
  193 | 
  194 |     const urlBefore = page.url();
  195 |     await row.click();
  196 |     await page.waitForTimeout(2000);
  197 | 
  198 |     const urlAfter = page.url();
  199 |     const detailPanel = page.locator('[data-testid*="detail"], .detail-panel, [role="dialog"], .drawer').first();
  200 |     const detailVisible = await detailPanel.isVisible({ timeout: 2000 }).catch(() => false);
  201 |     expect(urlBefore !== urlAfter || detailVisible).toBe(true);
  202 |   });
  203 | 
  204 |   test('TC-SUBJ-UI-014: Pagination controls visible if many subjects', async ({ page }) => {
  205 |     const hasPagination = await verifyPagination(page);
  206 |     const count = await getRowCount(page);
  207 |     if (count < 10) test.skip(true, 'Not enough rows for pagination');
  208 |     expect(hasPagination).toBe(true);
  209 |   });
  210 | 
  211 |   test('TC-SUBJ-UI-015: Sort by column header changes row order', async ({ page }) => {
```