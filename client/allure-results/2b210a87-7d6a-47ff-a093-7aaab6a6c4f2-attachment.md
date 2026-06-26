# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: subjects-ui.spec.js >> Subjects UI — User Story & Bulk >> TC-SUBJ-UI-027: User story — create subject and verify in list
- Location: tests/e2e/specs/subjects-ui.spec.js:424:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
          - generic [ref=e18]: 2:38 PM
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
```

# Test source

```ts
  345 |     const row = page.locator('table tbody tr, [data-testid*="subject-item"], .card').first();
  346 |     if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No subjects');
  347 | 
  348 |     const delBtn = row.locator('button:has-text("Delete"), [data-testid*="delete"]').first();
  349 |     if (!(await delBtn.isVisible({ timeout: 2000 }).catch(() => false))) test.skip(true, 'No delete button');
  350 | 
  351 |     await delBtn.click();
  352 |     await page.waitForTimeout(1000);
  353 | 
  354 |     const confirmDialog = page.locator(
  355 |       '[role="dialog"], .modal, .confirm-dialog, ' +
  356 |       'text=/confirm/i, text=/sure/i, text=/delete.*subject/i, ' +
  357 |       'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")'
  358 |     ).first();
  359 |     const confirmVisible = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);
  360 | 
  361 |     if (confirmVisible) {
  362 |       const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("No")').first();
  363 |       if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
  364 |         await cancelBtn.click();
  365 |       } else {
  366 |         await page.keyboard.press('Escape');
  367 |       }
  368 |     }
  369 |     expect(true).toBe(true);
  370 |   });
  371 | 
  372 |   test('TC-SUBJ-UI-023: Delete — cancelled, subject remains in list', async ({ page }) => {
  373 |     const row = page.locator('table tbody tr, [data-testid*="subject-item"], .card').first();
  374 |     if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No subjects');
  375 | 
  376 |     const rowText = await row.textContent().catch(() => '');
  377 |     const delBtn = row.locator('button:has-text("Delete"), [data-testid*="delete"]').first();
  378 |     if (!(await delBtn.isVisible({ timeout: 2000 }).catch(() => false))) test.skip(true, 'No delete button');
  379 | 
  380 |     await delBtn.click();
  381 |     await page.waitForTimeout(1000);
  382 | 
  383 |     const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("No")').first();
  384 |     if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  385 |       await cancelBtn.click();
  386 |       await page.waitForTimeout(1000);
  387 |     } else {
  388 |       await page.keyboard.press('Escape');
  389 |     }
  390 | 
  391 |     const stillExists = await verifyInList(page, rowText.slice(0, 20));
  392 |     expect(stillExists).toBe(true);
  393 |   });
  394 | });
  395 | 
  396 | test.describe('Subjects UI — Role-Based Access (Deep)', () => {
  397 |   test('TC-SUBJ-UI-024: Student access to subjects', async ({ page }) => {
  398 |     await gotoWithAuth(page, ROUTE, 'student');
  399 |     const denied = await isAccessDenied(page);
  400 |     if (denied) test.skip(true, 'Student denied access');
  401 |     const hasContent = await waitForContent(page);
  402 |     expect(hasContent).toBe(true);
  403 |   });
  404 | 
  405 |   test('TC-SUBJ-UI-025: Student cannot see create button', async ({ page }) => {
  406 |     await gotoWithAuth(page, ROUTE, 'student');
  407 |     await dismissOverlays(page);
  408 |     const createBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
  409 |     const visible = await createBtn.isVisible({ timeout: 3000 }).catch(() => false);
  410 |     if (visible) console.warn('BUG: Student can see create subject button');
  411 |     expect(true).toBe(true);
  412 |   });
  413 | 
  414 |   test('TC-SUBJ-UI-026: Instructor can view subjects', async ({ page }) => {
  415 |     await gotoWithAuth(page, ROUTE, 'instructor');
  416 |     const denied = await isAccessDenied(page);
  417 |     if (denied) test.skip(true, 'Instructor denied access');
  418 |     const hasContent = await waitForContent(page);
  419 |     expect(hasContent).toBe(true);
  420 |   });
  421 | });
  422 | 
  423 | test.describe('Subjects UI — User Story & Bulk', () => {
  424 |   test('TC-SUBJ-UI-027: User story — create subject and verify in list', async ({ page }) => {
  425 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  426 |     await dismissOverlays(page);
  427 | 
  428 |     const testName = `${TEST_PREFIX}STORY_${Date.now()}`;
  429 |     const opened = await openForm(page, ['Add Subject', 'Create Subject', 'Add', 'Create']);
  430 |     if (!opened) test.skip(true, 'Create form did not open');
  431 | 
  432 |     // Select program using custom dropdown
  433 |     const programSelected = await selectFromCustomDropdown(page, 'Program', 'Program');
  434 |     if (!programSelected) test.skip(true, 'Could not select program');
  435 | 
  436 |     await fillByPlaceholder(page, 'Code', `SUBJ-STORY-${Date.now()}`);
  437 |     await fillByPlaceholder(page, 'English', testName);
  438 |     await fillByPlaceholder(page, 'Arabic', 'مادة قصة');
  439 | 
  440 |     const result = await submitForm(page, ['Save', 'Create', 'Submit']);
  441 |     if (!result.submitted) test.skip(true, 'Could not submit subject');
  442 | 
  443 |     await page.waitForTimeout(2000);
  444 |     const found = await verifyInList(page, testName);
> 445 |     expect(found).toBe(true);
      |                   ^ Error: expect(received).toBe(expected) // Object.is equality
  446 |   });
  447 | 
  448 |   test('TC-SUBJ-UI-028: Row checkbox selection works', async ({ page }) => {
  449 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  450 |     await dismissOverlays(page);
  451 |     const rowCheckbox = page.locator('tbody input[type="checkbox"]').first();
  452 |     const visible = await rowCheckbox.isVisible({ timeout: 3000 }).catch(() => false);
  453 |     if (!visible) test.skip(true, 'No row checkboxes');
  454 |     await rowCheckbox.click();
  455 |     const isChecked = await rowCheckbox.isChecked();
  456 |     expect(isChecked).toBe(true);
  457 |   });
  458 | 
  459 |   test('TC-SUBJ-UI-029: Export button visible', async ({ page }) => {
  460 |     await gotoWithAuth(page, ROUTE, 'superAdmin');
  461 |     await dismissOverlays(page);
  462 |     const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid*="export"]').first();
  463 |     const visible = await exportBtn.isVisible({ timeout: 3000 }).catch(() => false);
  464 |     if (!visible) test.skip(true, 'No export button');
  465 |   });
  466 | });
  467 | 
  468 | test.describe('Subjects UI — Unauthenticated & Edge Cases', () => {
  469 |   test('TC-SUBJ-UI-030: Redirect to login when not authenticated', async ({ page }) => {
  470 |     await page.goto(`${testConfig.baseUrl}/subjects`);
  471 |     await page.waitForLoadState('networkidle');
  472 |     const url = page.url();
  473 |     expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  474 |   });
  475 | });
  476 | 
```