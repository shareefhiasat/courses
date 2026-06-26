# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: analytics-ui.spec.js >> Analytics UI — Student Dashboard Component Reuse (Deep) >> TC-ANL-UI-110: Switch to Class tab renders ClassAnalytics
- Location: tests/e2e/specs/analytics-ui.spec.js:1317:3

# Error details

```
Test timeout of 60000ms exceeded while running "beforeEach" hook.
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
            - generic [ref=e18]: 4:59 PM
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
  1168 |     await dismissOverlays(page);
  1169 |     const hasWidgets = await waitForWidgets(page);
  1170 |     if (!hasWidgets) test.skip(true, 'No widgets to edit');
  1171 |     const widget = page.locator('[class*="react-grid-item"], [class*="widget-wrapper"]').first();
  1172 |     await widget.hover();
  1173 |     await page.waitForTimeout(300);
  1174 |     const editBtn = widget.locator('[class*="widget-actions"] button').nth(1);
  1175 |     if (!(await editBtn.isVisible({ timeout: 2000 }).catch(() => false)))
  1176 |       test.skip(true, 'No edit button');
  1177 |     await editBtn.click();
  1178 |     await page.waitForTimeout(1000);
  1179 | 
  1180 |     // Change title
  1181 |     const titleInput = page.locator('input[type="text"]').first();
  1182 |     await titleInput.fill('Updated E2E Widget');
  1183 |     await page.waitForTimeout(300);
  1184 | 
  1185 |     // Click Update
  1186 |     const updateBtn = page.locator('button:has-text("Update"), button:has-text("Save")').first();
  1187 |     if (await updateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  1188 |       await updateBtn.click();
  1189 |       await page.waitForTimeout(2000);
  1190 |     }
  1191 |     expect(true).toBe(true);
  1192 |   });
  1193 | 
  1194 |   test('TC-ANL-UI-098: User story — admin resets dashboard to defaults', async ({ page }) => {
  1195 |     await gotoWithAuth(page, ADVANCED_ROUTE, ROLES.SUPER_ADMIN);
  1196 |     await dismissOverlays(page);
  1197 |     const resetBtn = page.locator('button:has-text("Reset"), button:has-text("reset")').first();
  1198 |     if (!(await resetBtn.isVisible({ timeout: 3000 }).catch(() => false)))
  1199 |       test.skip(true, 'No reset button');
  1200 |     await resetBtn.click();
  1201 |     await page.waitForTimeout(1000);
  1202 | 
  1203 |     // Confirm in modal
  1204 |     const confirmBtn = page.locator(
  1205 |       'button:has-text("Confirm"), button:has-text("Reset"), button:has-text("Yes")'
  1206 |     ).first();
  1207 |     if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  1208 |       await confirmBtn.click();
  1209 |       await page.waitForTimeout(2000);
  1210 |     }
  1211 |     const hasContent = await waitForContent(page);
  1212 |     expect(hasContent).toBe(true);
  1213 |   });
  1214 | });
  1215 | 
  1216 | // ═══════════════════════════════════════════════════════════════════════════════
  1217 | // SECTION 11: Student Dashboard — DashboardEngine Reuse in Summary Tabs (TC-ANL-UI-099 — TC-ANL-UI-115)
  1218 | // ═══════════════════════════════════════════════════════════════════════════════
  1219 | test.describe('Analytics UI — Student Dashboard Component Reuse (Deep)', () => {
> 1220 |   test.beforeEach(async ({ page }) => {
       |        ^ Test timeout of 60000ms exceeded while running "beforeEach" hook.
  1221 |     await gotoWithAuth(page, '/student-dashboard', ROLES.SUPER_ADMIN);
  1222 |     await dismissOverlays(page);
  1223 |   });
  1224 | 
  1225 |   test('TC-ANL-UI-099: Student dashboard page loads', async ({ page }) => {
  1226 |     const denied = await isAccessDenied(page);
  1227 |     if (denied) test.skip(true, 'Access denied');
  1228 |     const hasContent = await waitForContent(page);
  1229 |     expect(hasContent).toBe(true);
  1230 |   });
  1231 | 
  1232 |   test('TC-ANL-UI-100: Tabs visible (Overview, Performance, Marks)', async ({ page }) => {
  1233 |     const tabs = page.locator('[role="tab"], button:has-text("Overview"), button:has-text("Performance"), button:has-text("Marks")');
  1234 |     const count = await tabs.count();
  1235 |     if (count === 0) test.skip(true, 'No tabs visible');
  1236 |     expect(count).toBeGreaterThanOrEqual(3);
  1237 |   });
  1238 | 
  1239 |   test('TC-ANL-UI-101: Class tab visible for staff', async ({ page }) => {
  1240 |     const classTab = page.locator('button:has-text("Class"), [role="tab"]:has-text("Class")').first();
  1241 |     const visible = await classTab.isVisible({ timeout: 3000 }).catch(() => false);
  1242 |     if (!visible) test.skip(true, 'No Class tab (may not be staff)');
  1243 |     expect(visible).toBe(true);
  1244 |   });
  1245 | 
  1246 |   test('TC-ANL-UI-102: Overview tab renders DashboardEngine widgets', async ({ page }) => {
  1247 |     const overviewSection = page.locator('[data-testid*="student-overview-analytics"], [data-testid*="overview-analytics-section"]').first();
  1248 |     const visible = await overviewSection.isVisible({ timeout: 5000 }).catch(() => false);
  1249 |     if (!visible) test.skip(true, 'No overview analytics section');
  1250 |     const widgets = page.locator('[class*="react-grid-item"], [class*="widget-wrapper"], .rgl-engine > div');
  1251 |     const count = await widgets.count();
  1252 |     if (count === 0) test.skip(true, 'No widgets in overview');
  1253 |     expect(count).toBeGreaterThan(0);
  1254 |   });
  1255 | 
  1256 |   test('TC-ANL-UI-103: Overview tab — widget search input visible', async ({ page }) => {
  1257 |     const searchInput = page.locator('[data-testid="widget-search-input"]').first();
  1258 |     const visible = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
  1259 |     if (!visible) test.skip(true, 'No widget search input on overview');
  1260 |     expect(visible).toBe(true);
  1261 |   });
  1262 | 
  1263 |   test('TC-ANL-UI-104: Overview tab — edit layout button visible', async ({ page }) => {
  1264 |     const editBtn = page.locator('[aria-label*="edit layout" i], [title*="edit layout" i]').first();
  1265 |     const visible = await editBtn.isVisible({ timeout: 3000 }).catch(() => false);
  1266 |     if (!visible) test.skip(true, 'No edit layout button on overview');
  1267 |     expect(visible).toBe(true);
  1268 |   });
  1269 | 
  1270 |   test('TC-ANL-UI-105: Overview tab — add widget button visible', async ({ page }) => {
  1271 |     const addBtn = page.locator('[aria-label*="add widget" i], [title*="add widget" i]').first();
  1272 |     const visible = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);
  1273 |     if (!visible) test.skip(true, 'No add widget button on overview');
  1274 |     expect(visible).toBe(true);
  1275 |   });
  1276 | 
  1277 |   test('TC-ANL-UI-106: Overview tab — reset to defaults button visible', async ({ page }) => {
  1278 |     const resetBtn = page.locator('[aria-label*="reset" i], [title*="reset" i]').first();
  1279 |     const visible = await resetBtn.isVisible({ timeout: 3000 }).catch(() => false);
  1280 |     if (!visible) test.skip(true, 'No reset button on overview');
  1281 |     expect(visible).toBe(true);
  1282 |   });
  1283 | 
  1284 |   test('TC-ANL-UI-107: Switch to Performance tab renders DashboardEngine', async ({ page }) => {
  1285 |     const perfTab = page.locator('button:has-text("Performance"), [role="tab"]:has-text("Performance")').first();
  1286 |     if (!(await perfTab.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No Performance tab');
  1287 |     await perfTab.click();
  1288 |     await page.waitForTimeout(1500);
  1289 |     const perfSection = page.locator('[data-testid*="student-performance-analytics"], [data-testid*="performance-analytics-section"]').first();
  1290 |     const visible = await perfSection.isVisible({ timeout: 5000 }).catch(() => false);
  1291 |     if (!visible) test.skip(true, 'No performance analytics section');
  1292 |     expect(visible).toBe(true);
  1293 |   });
  1294 | 
  1295 |   test('TC-ANL-UI-108: Performance tab — widgets render', async ({ page }) => {
  1296 |     const perfTab = page.locator('button:has-text("Performance"), [role="tab"]:has-text("Performance")').first();
  1297 |     if (!(await perfTab.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No Performance tab');
  1298 |     await perfTab.click();
  1299 |     await page.waitForTimeout(1500);
  1300 |     const widgets = page.locator('[class*="react-grid-item"], [class*="widget-wrapper"], .rgl-engine > div');
  1301 |     const count = await widgets.count();
  1302 |     if (count === 0) test.skip(true, 'No widgets in performance tab');
  1303 |     expect(count).toBeGreaterThan(0);
  1304 |   });
  1305 | 
  1306 |   test('TC-ANL-UI-109: Performance tab — reset to defaults button visible', async ({ page }) => {
  1307 |     const perfTab = page.locator('button:has-text("Performance"), [role="tab"]:has-text("Performance")').first();
  1308 |     if (!(await perfTab.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No Performance tab');
  1309 |     await perfTab.click();
  1310 |     await page.waitForTimeout(1500);
  1311 |     const resetBtn = page.locator('[aria-label*="reset" i], [title*="reset" i]').first();
  1312 |     const visible = await resetBtn.isVisible({ timeout: 3000 }).catch(() => false);
  1313 |     if (!visible) test.skip(true, 'No reset button on performance tab');
  1314 |     expect(visible).toBe(true);
  1315 |   });
  1316 | 
  1317 |   test('TC-ANL-UI-110: Switch to Class tab renders ClassAnalytics', async ({ page }) => {
  1318 |     const classTab = page.locator('button:has-text("Class"), [role="tab"]:has-text("Class")').first();
  1319 |     if (!(await classTab.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No Class tab');
  1320 |     await classTab.click();
```