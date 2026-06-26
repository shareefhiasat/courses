# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scheduling-ui.spec.js >> Scheduling UI — Unauthenticated >> TC-SCH-UI-107: Redirect to login for summary dashboard when not authenticated
- Location: tests/e2e/specs/scheduling-ui.spec.js:1558:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://localhost:5174/scheduling-summary", waiting until "load"

```

# Test source

```ts
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
  1523 |       expect(hasContent).toBe(true);
  1524 |     } else {
  1525 |       test.skip(true, 'No custom date range inputs');
  1526 |     }
  1527 |   });
  1528 | 
  1529 |   test('TC-SCH-UI-105: Page refresh preserves current tab and view', async ({ page }) => {
  1530 |     await gotoWithAuth(page, CALENDAR_ROUTE, 'superAdmin');
  1531 |     await dismissOverlays(page);
  1532 | 
  1533 |     // Switch to Month view if possible
  1534 |     const monthBtn = page.locator('button:has-text("Month"), [data-testid*="view-month"]').first();
  1535 |     if (await monthBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  1536 |       await monthBtn.click();
  1537 |       await page.waitForTimeout(500);
  1538 |     }
  1539 | 
  1540 |     // Reload page
  1541 |     await page.reload();
  1542 |     await page.waitForLoadState('networkidle');
  1543 |     await page.waitForTimeout(1500);
  1544 | 
  1545 |     const hasContent = await waitForContent(page);
  1546 |     expect(hasContent).toBe(true);
  1547 |   });
  1548 | });
  1549 | 
  1550 | test.describe('Scheduling UI — Unauthenticated', () => {
  1551 |   test('TC-SCH-UI-106: Redirect to login when not authenticated', async ({ page }) => {
  1552 |     await page.goto(`${testConfig.baseUrl}/scheduling-calendar`);
  1553 |     await page.waitForLoadState('networkidle');
  1554 |     const url = page.url();
  1555 |     expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  1556 |   });
  1557 | 
  1558 |   test('TC-SCH-UI-107: Redirect to login for summary dashboard when not authenticated', async ({ page }) => {
> 1559 |     await page.goto(`${testConfig.baseUrl}/scheduling-summary`);
       |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  1560 |     await page.waitForLoadState('networkidle');
  1561 |     const url = page.url();
  1562 |     expect(url.includes('keycloak') || url.includes('login') || url.includes('8080')).toBe(true);
  1563 |   });
  1564 | });
  1565 | 
```