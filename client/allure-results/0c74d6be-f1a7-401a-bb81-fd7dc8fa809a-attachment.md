# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dark-mode-ui.spec.js >> Dark Mode — RTL Combined >> TC-DM-UI-038: Dark mode + RTL no console errors
- Location: tests/e2e/specs/dark-mode-ui.spec.js:395:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]: ⚠️
  - heading "Oops! Something went wrong" [level=1] [ref=e6]
  - paragraph [ref=e7]: We encountered an unexpected error. Don't worry, this has been logged and we'll look into it.
  - group [ref=e8]:
    - generic "🔍 Technical Details" [ref=e9] [cursor=pointer]
  - generic [ref=e10]:
    - button "🔑 Go to Login" [ref=e11] [cursor=pointer]
    - button "🏠 Go Home" [ref=e12] [cursor=pointer]
    - button "🔄 Reload Page" [ref=e13] [cursor=pointer]
  - paragraph [ref=e14]:
    - text: If this problem persists, please contact support at
    - link "shareef.hiasat@gmail.com" [ref=e15] [cursor=pointer]:
      - /url: mailto:shareef.hiasat@gmail.com
```

# Test source

```ts
  320 |       if (!(await navbar.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No navbar');
  321 |       const bg = await navbar.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  322 |       expect(bg).toBeTruthy();
  323 |     });
  324 | 
  325 |     test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Select dropdowns visible${themeSuffix(mode)}`, async ({ page }) => {
  326 |       tcCounter++;
  327 |       await gotoWithAuth(page, '/marks', 'superAdmin');
  328 |       await applyTheme(page, mode);
  329 |       const select = page.locator('select, [class*="select"]').first();
  330 |       if (!(await select.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No select elements');
  331 |       const bg = await select.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  332 |       expect(bg).toBeTruthy();
  333 |     });
  334 | 
  335 |     test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Toggle switches visible${themeSuffix(mode)}`, async ({ page }) => {
  336 |       tcCounter++;
  337 |       await gotoWithAuth(page, '/profile-settings', 'superAdmin');
  338 |       await applyTheme(page, mode);
  339 |       const toggle = page.locator('[class*="toggle"], [role="switch"], input[type="checkbox"]').first();
  340 |       if (!(await toggle.isVisible({ timeout: 3000 }).catch(() => false))) test.skip(true, 'No toggle switches');
  341 |       expect(await toggle.isVisible()).toBe(true);
  342 |     });
  343 |   }
  344 | });
  345 | 
  346 | // ═══════════════════════════════════════════════════════════════════════════════
  347 | // SECTION 5: Dark Mode + RTL Combined (TC-DM-UI-071 — TC-DM-UI-080)
  348 | // ═══════════════════════════════════════════════════════════════════════════════
  349 | test.describe('Dark Mode — RTL Combined', () => {
  350 |   const rtlPages = [
  351 |     { name: 'Home', path: '/home' },
  352 |     { name: 'Dashboard', path: '/dashboard' },
  353 |     { name: 'Analytics', path: '/analytics' },
  354 |     { name: 'Marks', path: '/marks' },
  355 |     { name: 'Classes', path: '/classes' },
  356 |   ];
  357 | 
  358 |   for (const p of rtlPages) {
  359 |     test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: ${p.name} dark mode + RTL renders correctly`, async ({ page }) => {
  360 |       tcCounter++;
  361 |       await gotoWithAuth(page, p.path, 'superAdmin');
  362 | 
  363 |       // Switch to Arabic
  364 |       const langBtn = page.locator('button:has-text("AR"), [data-testid*="lang-toggle"], [aria-label*="Arabic"]').first();
  365 |       if (await langBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  366 |         await langBtn.click();
  367 |         await page.waitForTimeout(500);
  368 |       } else {
  369 |         await page.evaluate(() => {
  370 |           localStorage.setItem('lang', 'ar');
  371 |           document.documentElement.lang = 'ar';
  372 |           document.documentElement.dir = 'rtl';
  373 |         });
  374 |         await page.reload();
  375 |         await page.waitForLoadState('networkidle');
  376 |         await page.waitForTimeout(1000);
  377 |       }
  378 | 
  379 |       // Apply dark mode
  380 |       await applyDarkMode(page);
  381 | 
  382 |       // Verify both dark mode and RTL
  383 |       const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  384 |       const dir = await page.evaluate(() => document.documentElement.dir);
  385 |       expect(theme).toBe('dark');
  386 |       expect(dir).toBe('rtl');
  387 | 
  388 |       // Verify content visible
  389 |       const content = await page.locator('main, [role="main"], .card, h1, h2, h3').first()
  390 |         .isVisible({ timeout: 5000 }).catch(() => false);
  391 |       expect(content).toBe(true);
  392 |     });
  393 |   }
  394 | 
  395 |   test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Dark mode + RTL no console errors`, async ({ page }) => {
  396 |     tcCounter++;
  397 |     await gotoWithAuth(page, '/home', 'superAdmin');
  398 |     const errors = [];
  399 |     page.on('console', (msg) => {
  400 |       if (msg.type() === 'error') errors.push(msg.text());
  401 |     });
  402 | 
  403 |     // Switch to Arabic
  404 |     await page.evaluate(() => {
  405 |       localStorage.setItem('lang', 'ar');
  406 |       document.documentElement.lang = 'ar';
  407 |       document.documentElement.dir = 'rtl';
  408 |     });
  409 |     await page.reload();
  410 |     await page.waitForLoadState('networkidle');
  411 |     await page.waitForTimeout(1000);
  412 | 
  413 |     // Apply dark mode
  414 |     await applyDarkMode(page);
  415 |     await page.waitForTimeout(500);
  416 | 
  417 |     const criticalErrors = errors.filter(e =>
  418 |       /theme|css|style|dark|rtl|direction/i.test(e) && !/warning|deprecat/i.test(e)
  419 |     );
> 420 |     expect(criticalErrors.length).toBe(0);
      |                                   ^ Error: expect(received).toBe(expected) // Object.is equality
  421 |   });
  422 | 
  423 |   test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Theme toggle works in RTL mode`, async ({ page }) => {
  424 |     tcCounter++;
  425 |     await gotoWithAuth(page, '/home', 'superAdmin');
  426 | 
  427 |     // Switch to Arabic
  428 |     await page.evaluate(() => {
  429 |       localStorage.setItem('lang', 'ar');
  430 |       document.documentElement.lang = 'ar';
  431 |       document.documentElement.dir = 'rtl';
  432 |     });
  433 |     await page.reload();
  434 |     await page.waitForLoadState('networkidle');
  435 |     await page.waitForTimeout(1000);
  436 | 
  437 |     // Toggle theme
  438 |     await applyDarkMode(page);
  439 |     let theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  440 |     expect(theme).toBe('dark');
  441 | 
  442 |     await applyLightMode(page);
  443 |     theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  444 |     expect(theme).toBe('light');
  445 |   });
  446 | 
  447 |   test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: Dark mode persists across RTL navigation`, async ({ page }) => {
  448 |     tcCounter++;
  449 |     await gotoWithAuth(page, '/home', 'superAdmin');
  450 | 
  451 |     // Set Arabic + dark mode
  452 |     await page.evaluate(() => localStorage.setItem('lang', 'ar'));
  453 |     await applyDarkMode(page);
  454 | 
  455 |     // Navigate to another page
  456 |     await gotoWithAuth(page, '/analytics', 'superAdmin');
  457 | 
  458 |     const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  459 |     const dir = await page.evaluate(() => document.documentElement.dir);
  460 |     expect(theme).toBe('dark');
  461 |     expect(dir).toBe('rtl');
  462 |   });
  463 | 
  464 |   test(`TC-DM-UI-${String(tcCounter).padStart(3, '0')}: All major pages dark mode screenshot comparison`, async ({ page }) => {
  465 |     tcCounter++;
  466 |     await gotoWithAuth(page, '/dashboard', 'superAdmin');
  467 |     await applyDarkMode(page);
  468 |     await page.waitForTimeout(500);
  469 | 
  470 |     // Verify dark mode is active
  471 |     const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  472 |     expect(theme).toBe('dark');
  473 | 
  474 |     // Take a screenshot for visual verification
  475 |     await page.screenshot({ path: 'dark-mode-dashboard.png' });
  476 |   });
  477 | });
  478 | 
```