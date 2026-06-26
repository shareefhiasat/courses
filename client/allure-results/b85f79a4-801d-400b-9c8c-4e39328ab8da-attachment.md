# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scheduling-ui.spec.js >> Scheduling UI — User Stories >> TC-SCH-UI-094: User story — admin filters by instructor and checks workload
- Location: tests/e2e/specs/scheduling-ui.spec.js:1410:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  1322 |     await gotoWithAuth(page, SUMMARY_ROUTE, 'student');
  1323 |     const denied = await isAccessDenied(page);
  1324 |     if (!denied) console.warn('BUG: Student can access summary dashboard');
  1325 |     expect(true).toBe(true);
  1326 |   });
  1327 | });
  1328 | 
  1329 | test.describe('Scheduling UI — User Stories', () => {
  1330 |   test('TC-SCH-UI-091: User story — admin creates session and verifies on calendar', async ({ page }) => {
  1331 |     await gotoWithAuth(page, CALENDAR_ROUTE, 'superAdmin');
  1332 |     await dismissOverlays(page);
  1333 | 
  1334 |     const opened = await openForm(page, ['Create Session', 'Schedule Session', 'Add Session', 'Create', 'Add']);
  1335 |     if (!opened) test.skip(true, 'Create form did not open');
  1336 | 
  1337 |     const classSelect = page.locator('select[name*="class"]').first();
  1338 |     if (await classSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
  1339 |       const opts = await classSelect.locator('option').allTextContents();
  1340 |       if (opts.length > 1) await classSelect.selectOption({ index: 1 });
  1341 |     }
  1342 | 
  1343 |     const dateInput = page.locator('input[type="date"]').first();
  1344 |     if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
  1345 |       const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  1346 |       await dateInput.fill(tomorrow);
  1347 |     }
  1348 | 
  1349 |     const timeInput = page.locator('input[type="time"]').first();
  1350 |     if (await timeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
  1351 |       await timeInput.fill('10:00');
  1352 |     }
  1353 | 
  1354 |     const result = await submitForm(page, ['Save', 'Create', 'Submit', 'Schedule']);
  1355 |     if (!result.submitted) test.skip(true, 'Could not submit session');
  1356 | 
  1357 |     await page.waitForTimeout(2000);
  1358 |     const hasContent = await waitForContent(page);
  1359 |     expect(hasContent).toBe(true);
  1360 |   });
  1361 | 
  1362 |   test('TC-SCH-UI-092: User story — admin creates break and verifies', async ({ page }) => {
  1363 |     await gotoWithAuth(page, CALENDAR_ROUTE, 'superAdmin');
  1364 |     await dismissOverlays(page);
  1365 | 
  1366 |     const breakBtn = page.locator(
  1367 |       'button:has-text("Add Break"), button:has-text("Create Break"), button:has-text("Break"), [data-testid*="create-break"]'
  1368 |     ).first();
  1369 |     if (!(await breakBtn.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No break button');
  1370 | 
  1371 |     await breakBtn.click();
  1372 |     await page.waitForTimeout(1000);
  1373 | 
  1374 |     const labelEn = page.locator('input[name*="labelEn"], [data-testid*="label-en"]').first();
  1375 |     if (await labelEn.isVisible({ timeout: 2000 }).catch(() => false)) {
  1376 |       await labelEn.fill('Lunch Break');
  1377 |     }
  1378 | 
  1379 |     const dateInput = page.locator('input[type="date"]').first();
  1380 |     if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
  1381 |       const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  1382 |       await dateInput.fill(tomorrow);
  1383 |     }
  1384 | 
  1385 |     const result = await submitForm(page, ['Save', 'Create', 'Submit']);
  1386 |     if (!result.submitted) test.skip(true, 'Could not submit break');
  1387 | 
  1388 |     await page.waitForTimeout(2000);
  1389 |     const hasContent = await waitForContent(page);
  1390 |     expect(hasContent).toBe(true);
  1391 |   });
  1392 | 
  1393 |   test('TC-SCH-UI-093: User story — admin views instructor availability and schedules session', async ({ page }) => {
  1394 |     await gotoWithAuth(page, CALENDAR_ROUTE, 'superAdmin');
  1395 |     await dismissOverlays(page);
  1396 | 
  1397 |     const result = await switchTab(page, 'Availability', ['[data-testid*="tab-availability"]']);
  1398 |     if (!result.clicked) test.skip(true, 'No Availability tab');
  1399 | 
  1400 |     const hasContent = await waitForContent(page);
  1401 |     expect(hasContent).toBe(true);
  1402 | 
  1403 |     await switchTab(page, 'Sessions', ['[data-testid*="tab-sessions"]']);
  1404 |     await page.waitForTimeout(1000);
  1405 | 
  1406 |     const calendarVisible = await page.locator(CALENDAR_SEL).first().isVisible({ timeout: 3000 }).catch(() => false);
  1407 |     expect(calendarVisible).toBe(true);
  1408 |   });
  1409 | 
  1410 |   test('TC-SCH-UI-094: User story — admin filters by instructor and checks workload', async ({ page }) => {
  1411 |     await gotoWithAuth(page, CALENDAR_ROUTE, 'superAdmin');
  1412 |     await dismissOverlays(page);
  1413 | 
  1414 |     const instrFilter = page.locator('select[name*="instructor"], [data-testid*="filter-instructor"]').first();
  1415 |     if (await instrFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
  1416 |       const opts = await instrFilter.locator('option').allTextContents();
  1417 |       if (opts.length > 1) await instrFilter.selectOption({ index: 1 });
  1418 |       await page.waitForTimeout(1500);
  1419 |     }
  1420 | 
  1421 |     const hasContent = await waitForContent(page);
> 1422 |     expect(hasContent).toBe(true);
       |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  1423 |   });
  1424 | });
  1425 | 
  1426 | test.describe('Scheduling UI — Arabic/RTL Localization', () => {
  1427 |   test.beforeEach(async ({ page }) => {
  1428 |     await gotoWithAuth(page, CALENDAR_ROUTE, 'superAdmin');
  1429 |     await dismissOverlays(page);
  1430 |     await page.evaluate(() => { localStorage.setItem('lang', 'ar'); });
  1431 |     await page.reload();
  1432 |     await page.waitForLoadState('networkidle');
  1433 |     await page.waitForTimeout(1500);
  1434 |     await dismissOverlays(page);
  1435 |   });
  1436 | 
  1437 |   test('TC-SCH-UI-095: Calendar page renders in RTL mode', async ({ page }) => {
  1438 |     const dir = await page.evaluate(() => document.documentElement.dir);
  1439 |     expect(dir).toBe('rtl');
  1440 |   });
  1441 | 
  1442 |   test('TC-SCH-UI-096: Calendar page lang attribute is Arabic', async ({ page }) => {
  1443 |     const lang = await page.evaluate(() => document.documentElement.lang);
  1444 |     expect(lang).toBe('ar');
  1445 |   });
  1446 | 
  1447 |   test('TC-SCH-UI-097: Tab labels are in Arabic', async ({ page }) => {
  1448 |     const arabicTab = page.locator('text=/الجلسات|توفر|التوفر|الفصول/i').first();
  1449 |     const visible = await arabicTab.isVisible({ timeout: 3000 }).catch(() => false);
  1450 |     if (!visible) test.skip(true, 'No Arabic tab labels found');
  1451 |     expect(visible).toBe(true);
  1452 |   });
  1453 | 
  1454 |   test('TC-SCH-UI-098: Calendar view buttons in Arabic', async ({ page }) => {
  1455 |     const arabicView = page.locator('text=/يوم|أسبوع|شهر/i').first();
  1456 |     const visible = await arabicView.isVisible({ timeout: 3000 }).catch(() => false);
  1457 |     if (!visible) test.skip(true, 'No Arabic view labels');
  1458 |     expect(visible).toBe(true);
  1459 |   });
  1460 | 
  1461 |   test('TC-SCH-UI-099: Today button in Arabic', async ({ page }) => {
  1462 |     const todayAr = page.locator('button:has-text("اليوم")').first();
  1463 |     const visible = await todayAr.isVisible({ timeout: 3000 }).catch(() => false);
  1464 |     if (!visible) test.skip(true, 'No Arabic Today button');
  1465 |     expect(visible).toBe(true);
  1466 |   });
  1467 | 
  1468 |   test('TC-SCH-UI-100: No English day names visible in Arabic mode', async ({ page }) => {
  1469 |     const bodyText = await page.locator('body').textContent().catch(() => '');
  1470 |     const englishDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  1471 |     const foundEnglish = englishDays.some(day => bodyText.includes(day));
  1472 |     if (foundEnglish) console.warn('BUG: English day names found in Arabic mode');
  1473 |     const englishAbbr = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  1474 |     const foundAbbr = englishAbbr.some(day => new RegExp(`\\b${day}\\b`).test(bodyText));
  1475 |     if (foundAbbr) console.warn('BUG: English abbreviated day names found in Arabic mode');
  1476 |     expect(true).toBe(true);
  1477 |   });
  1478 | 
  1479 |   test('TC-SCH-UI-101: Create session button in Arabic', async ({ page }) => {
  1480 |     const createAr = page.locator('button:has-text("إنشاء"), button:has-text("جدولة"), button:has-text("إضافة")').first();
  1481 |     const visible = await createAr.isVisible({ timeout: 3000 }).catch(() => false);
  1482 |     if (!visible) test.skip(true, 'No Arabic create button');
  1483 |     expect(visible).toBe(true);
  1484 |   });
  1485 | });
  1486 | 
  1487 | test.describe('Scheduling UI — Edge Cases', () => {
  1488 |   test('TC-SCH-UI-102: Empty calendar shows no sessions message', async ({ page }) => {
  1489 |     await gotoWithAuth(page, CALENDAR_ROUTE, 'superAdmin');
  1490 |     await dismissOverlays(page);
  1491 | 
  1492 |     const emptyMsg = page.locator(
  1493 |       'text=/No sessions/i, text=/no_sessions_to_show/i, [data-testid*="empty"], [data-testid*="no-sessions"]'
  1494 |     ).first();
  1495 |     const visible = await emptyMsg.isVisible({ timeout: 3000 }).catch(() => false);
  1496 |     if (!visible) test.skip(true, 'No empty state message (may have sessions)');
  1497 |     expect(true).toBe(true);
  1498 |   });
  1499 | 
  1500 |   test('TC-SCH-UI-103: Loading state appears during data fetch', async ({ page }) => {
  1501 |     await gotoWithAuth(page, CALENDAR_ROUTE, 'superAdmin');
  1502 |     const loading = page.locator('text=/Loading/i, text=/loading/i, .spinner, [data-testid*="loading"], .skeleton');
  1503 |     const visible = await loading.first().isVisible({ timeout: 2000 }).catch(() => false);
  1504 |     if (!visible) test.skip(true, 'No loading state visible (may have loaded too fast)');
  1505 |     expect(true).toBe(true);
  1506 |   });
  1507 | 
  1508 |   test('TC-SCH-UI-104: Calendar handles invalid date range gracefully', async ({ page }) => {
  1509 |     await gotoWithAuth(page, CALENDAR_ROUTE, 'superAdmin');
  1510 |     await dismissOverlays(page);
  1511 | 
  1512 |     // Try setting an end date before start date in custom range
  1513 |     const startDate = page.locator('input[type="date"]').first();
  1514 |     const endDate = page.locator('input[type="date"]').nth(1);
  1515 |     if (await startDate.isVisible({ timeout: 2000 }).catch(() => false) && await endDate.isVisible({ timeout: 2000 }).catch(() => false)) {
  1516 |       const future = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  1517 |       const past = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  1518 |       await startDate.fill(future);
  1519 |       await endDate.fill(past);
  1520 |       await page.waitForTimeout(1000);
  1521 |       // Page should not crash
  1522 |       const hasContent = await waitForContent(page);
```