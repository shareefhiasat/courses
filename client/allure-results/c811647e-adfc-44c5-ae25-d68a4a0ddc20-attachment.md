# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: analytics-ui.spec.js >> Analytics UI — Role-Based Access (Deep) >> TC-ANL-UI-089: Instructor can access main analytics
- Location: tests/e2e/specs/analytics-ui.spec.js:1062:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  967  |       test.skip(true, 'No select filter');
  968  |     const options = await filter.locator('option').allTextContents();
  969  |     if (options.length <= 1) test.skip(true, 'No filter options');
  970  |     await filter.selectOption({ index: 1 });
  971  |     await page.waitForTimeout(2000);
  972  |     const hasContent = await waitForContent(page);
  973  |     expect(hasContent).toBe(true);
  974  |   });
  975  | 
  976  |   test('TC-ANL-UI-080: Analytics page renders data tables', async ({ page }) => {
  977  |     const table = page.locator('table, [role="grid"], [data-testid*="table"]').first();
  978  |     const visible = await table.isVisible({ timeout: 3000 }).catch(() => false);
  979  |     if (!visible) test.skip(true, 'No data tables');
  980  |   });
  981  | });
  982  | 
  983  | // ═══════════════════════════════════════════════════════════════════════════════
  984  | // SECTION 8: Scheduled Reports (TC-ANL-UI-081 — TC-ANL-UI-088)
  985  | // ═══════════════════════════════════════════════════════════════════════════════
  986  | test.describe('Analytics UI — Scheduled Reports (Deep)', () => {
  987  |   test.beforeEach(async ({ page }) => {
  988  |     await gotoWithAuth(page, REPORTS_ROUTE, ROLES.SUPER_ADMIN);
  989  |     await dismissOverlays(page);
  990  |   });
  991  | 
  992  |   test('TC-ANL-UI-081: Scheduled reports page loads', async ({ page }) => {
  993  |     const denied = await isAccessDenied(page);
  994  |     if (denied) test.skip(true, 'Access denied');
  995  |     const hasContent = await waitForContent(page);
  996  |     expect(hasContent).toBe(true);
  997  |   });
  998  | 
  999  |   test('TC-ANL-UI-082: Scheduled reports list or empty state', async ({ page }) => {
  1000 |     const content = page.locator('table, [data-testid*="report"], .card, text=/no.*report/i').first();
  1001 |     const visible = await content.isVisible({ timeout: 5000 }).catch(() => false);
  1002 |     if (!visible) test.skip(true, 'No reports content');
  1003 |   });
  1004 | 
  1005 |   test('TC-ANL-UI-083: Create scheduled report button', async ({ page }) => {
  1006 |     const createBtn = page.locator(
  1007 |       'button:has-text("Create"), button:has-text("Add"), button:has-text("Schedule")'
  1008 |     ).first();
  1009 |     const visible = await createBtn.isVisible({ timeout: 3000 }).catch(() => false);
  1010 |     if (!visible) test.skip(true, 'No create button');
  1011 |   });
  1012 | 
  1013 |   test('TC-ANL-UI-084: Scheduled reports — row count', async ({ page }) => {
  1014 |     const count = await getRowCount(page);
  1015 |     const emptyState = page.locator('text=/no.*report/i, text=/empty/i').first();
  1016 |     const hasEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
  1017 |     expect(count > 0 || hasEmpty).toBe(true);
  1018 |   });
  1019 | 
  1020 |   test('TC-ANL-UI-085: Scheduled reports — delete button visible', async ({ page }) => {
  1021 |     const delBtn = page.locator('button:has-text("Delete"), [data-testid*="delete"]').first();
  1022 |     const visible = await delBtn.isVisible({ timeout: 3000 }).catch(() => false);
  1023 |     if (!visible) test.skip(true, 'No delete button');
  1024 |   });
  1025 | 
  1026 |   test('TC-ANL-UI-086: Scheduled reports — export button visible', async ({ page }) => {
  1027 |     const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download")').first();
  1028 |     const visible = await exportBtn.isVisible({ timeout: 3000 }).catch(() => false);
  1029 |     if (!visible) test.skip(true, 'No export button');
  1030 |   });
  1031 | 
  1032 |   test('TC-ANL-UI-087: Schedule Report button navigates to reports page', async ({ page }) => {
  1033 |     await gotoWithAuth(page, ADVANCED_ROUTE, ROLES.SUPER_ADMIN);
  1034 |     await dismissOverlays(page);
  1035 |     const scheduleBtn = page.locator('button:has-text("Schedule Report"), button:has-text("schedule_report")').first();
  1036 |     if (!(await scheduleBtn.isVisible({ timeout: 3000 }).catch(() => false)))
  1037 |       test.skip(true, 'No schedule report button');
  1038 |     await scheduleBtn.click();
  1039 |     await page.waitForTimeout(2000);
  1040 |     const url = page.url();
  1041 |     expect(url).toContain('scheduled-reports');
  1042 |   });
  1043 | 
  1044 |   test('TC-ANL-UI-088: Scheduled reports — create flow opens form', async ({ page }) => {
  1045 |     const createBtn = page.locator(
  1046 |       'button:has-text("Create"), button:has-text("Add"), button:has-text("Schedule")'
  1047 |     ).first();
  1048 |     if (!(await createBtn.isVisible({ timeout: 3000 }).catch(() => false)))
  1049 |       test.skip(true, 'No create button');
  1050 |     await createBtn.click();
  1051 |     await page.waitForTimeout(1000);
  1052 |     const form = page.locator('form, [class*="form"], [role="dialog"], input, select').first();
  1053 |     const visible = await form.isVisible({ timeout: 3000 }).catch(() => false);
  1054 |     if (!visible) test.skip(true, 'No form opened');
  1055 |   });
  1056 | });
  1057 | 
  1058 | // ═══════════════════════════════════════════════════════════════════════════════
  1059 | // SECTION 9: Role-Based Access (TC-ANL-UI-089 — TC-ANL-UI-094)
  1060 | // ═══════════════════════════════════════════════════════════════════════════════
  1061 | test.describe('Analytics UI — Role-Based Access (Deep)', () => {
  1062 |   test('TC-ANL-UI-089: Instructor can access main analytics', async ({ page }) => {
  1063 |     await gotoWithAuth(page, ANALYTICS_ROUTE, ROLES.INSTRUCTOR);
  1064 |     const denied = await isAccessDenied(page);
  1065 |     if (denied) test.skip(true, 'Instructor denied');
  1066 |     const hasContent = await waitForContent(page);
> 1067 |     expect(hasContent).toBe(true);
       |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  1068 |   });
  1069 | 
  1070 |   test('TC-ANL-UI-090: Instructor can access advanced analytics', async ({ page }) => {
  1071 |     await gotoWithAuth(page, ADVANCED_ROUTE, ROLES.INSTRUCTOR);
  1072 |     const denied = await isAccessDenied(page);
  1073 |     if (denied) test.skip(true, 'Instructor denied');
  1074 |     const hasContent = await waitForContent(page);
  1075 |     expect(hasContent).toBe(true);
  1076 |   });
  1077 | 
  1078 |   test('TC-ANL-UI-091: Student access to main analytics', async ({ page }) => {
  1079 |     await gotoWithAuth(page, ANALYTICS_ROUTE, ROLES.STUDENT);
  1080 |     const denied = await isAccessDenied(page);
  1081 |     if (denied) test.skip(true, 'Student denied');
  1082 |     const hasContent = await waitForContent(page);
  1083 |     expect(hasContent).toBe(true);
  1084 |   });
  1085 | 
  1086 |   test('TC-ANL-UI-092: Student cannot access advanced analytics', async ({ page }) => {
  1087 |     await gotoWithAuth(page, ADVANCED_ROUTE, ROLES.STUDENT);
  1088 |     const denied = await isAccessDenied(page);
  1089 |     if (!denied) console.warn('BUG: Student can access advanced analytics');
  1090 |     expect(true).toBe(true);
  1091 |   });
  1092 | 
  1093 |   test('TC-ANL-UI-093: Student cannot access scheduled reports', async ({ page }) => {
  1094 |     await gotoWithAuth(page, REPORTS_ROUTE, ROLES.STUDENT);
  1095 |     const denied = await isAccessDenied(page);
  1096 |     if (!denied) console.warn('BUG: Student can access scheduled reports');
  1097 |     expect(true).toBe(true);
  1098 |   });
  1099 | 
  1100 |   test('TC-ANL-UI-094: Instructor does not see Manage Widgets button', async ({ page }) => {
  1101 |     await gotoWithAuth(page, ADVANCED_ROUTE, ROLES.INSTRUCTOR);
  1102 |     await dismissOverlays(page);
  1103 |     const manageBtn = page.locator('button:has-text("Manage Widgets"), button:has-text("manage_widgets")').first();
  1104 |     const visible = await manageBtn.isVisible({ timeout: 3000 }).catch(() => false);
  1105 |     if (visible) console.warn('BUG: Instructor can see Manage Widgets button');
  1106 |     expect(true).toBe(true);
  1107 |   });
  1108 | });
  1109 | 
  1110 | // ═══════════════════════════════════════════════════════════════════════════════
  1111 | // SECTION 10: User Stories (TC-ANL-UI-095 — TC-ANL-UI-098)
  1112 | // ═══════════════════════════════════════════════════════════════════════════════
  1113 | test.describe('Analytics UI — User Stories', () => {
  1114 |   test('TC-ANL-UI-095: User story — admin views analytics, filters, and exports', async ({ page }) => {
  1115 |     await gotoWithAuth(page, ADVANCED_ROUTE, ROLES.SUPER_ADMIN);
  1116 |     await dismissOverlays(page);
  1117 |     const hasContent = await waitForContent(page);
  1118 |     expect(hasContent).toBe(true);
  1119 | 
  1120 |     // Apply a filter
  1121 |     const programSelect = page.locator('select').filter({ hasText: /program/i }).first();
  1122 |     if (await programSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
  1123 |       const options = await programSelect.locator('option').allTextContents();
  1124 |       const idx = options.findIndex(o => o && !/all/i.test(o));
  1125 |       if (idx >= 0) {
  1126 |         await programSelect.selectOption({ index: idx });
  1127 |         await page.waitForTimeout(2000);
  1128 |       }
  1129 |     }
  1130 | 
  1131 |     // Click export
  1132 |     const exportBtn = page.locator('button:has-text("Export"), button:has-text("export")').first();
  1133 |     if (await exportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  1134 |       await exportBtn.click().catch(() => {});
  1135 |       await page.waitForTimeout(1000);
  1136 |     }
  1137 |     expect(true).toBe(true);
  1138 |   });
  1139 | 
  1140 |   test('TC-ANL-UI-096: User story — admin adds widget, configures, and saves', async ({ page }) => {
  1141 |     await gotoWithAuth(page, ADVANCED_ROUTE, ROLES.SUPER_ADMIN);
  1142 |     await dismissOverlays(page);
  1143 |     const opened = await openWidgetBuilder(page);
  1144 |     if (!opened) test.skip(true, 'Could not open widget builder');
  1145 | 
  1146 |     // Fill title
  1147 |     const titleInput = page.locator('input[type="text"]').first();
  1148 |     await titleInput.fill('E2E Test Widget');
  1149 | 
  1150 |     // Select bar chart
  1151 |     const barBtn = page.locator('text=/Bar/i').first();
  1152 |     if (await barBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  1153 |       await barBtn.click();
  1154 |       await page.waitForTimeout(300);
  1155 |     }
  1156 | 
  1157 |     // Save
  1158 |     const saveBtn = page.locator('button:has-text("Create"), button:has-text("Save")').first();
  1159 |     await saveBtn.click();
  1160 |     await page.waitForTimeout(2000);
  1161 | 
  1162 |     const hasWidgets = await waitForWidgets(page);
  1163 |     expect(hasWidgets).toBe(true);
  1164 |   });
  1165 | 
  1166 |   test('TC-ANL-UI-097: User story — admin edits widget and updates', async ({ page }) => {
  1167 |     await gotoWithAuth(page, ADVANCED_ROUTE, ROLES.SUPER_ADMIN);
```