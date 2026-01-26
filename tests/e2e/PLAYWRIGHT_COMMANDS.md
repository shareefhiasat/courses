# Playwright Test Commands Guide

## 🎯 Running Tests - Three Modes

### 1. **Headless Mode** (Default - No Browser Visible)
Runs tests in the background without showing the browser window. Fastest option.

```bash
# Run all tests (headless by default)
npm run test:e2e

# Run specific test file (headless)
npx playwright test specs/main-flow.spec.js

# Run tests matching a pattern (headless)
npx playwright test --grep "TC-MAIN-001"
```

**Note:** The flag `--headed=false` doesn't exist. Headless is the default when you don't use `--headed`.

---

### 2. **Headed Mode** (Browser Visible)
Shows the browser window so you can see what's happening. Great for debugging.

```bash
# Run all tests with browser visible
npm run test:e2e:headed

# Run specific test file (headed)
npx playwright test specs/main-flow.spec.js --headed

# Run tests matching a pattern (headed)
npx playwright test --grep "TC-MAIN-001" --headed
```

**Tip:** Use this when tests fail and you want to see what's happening in the browser.

---

### 3. **UI Mode** (Interactive Test Runner) ⭐ **RECOMMENDED FOR EXPLORATION**
Opens Playwright's interactive UI where you can:
- See all test cases organized by file
- Run individual tests or groups
- Watch tests execute in real-time
- See screenshots and videos
- Debug step-by-step

```bash
# Open Playwright UI (best way to explore tests)
npm run test:e2e:ui

# Or directly
npx playwright test --ui
```

**This is the best way to:**
- See all your test cases at once
- Run specific tests by clicking
- Watch tests execute visually
- Debug failing tests

---

## 📋 Command Reference

### Basic Commands

```bash
# Run all tests (headless)
npm run test:e2e

# Run all tests (headed - see browser)
npm run test:e2e:headed

# Open UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test specs/main-flow.spec.js

# Run specific test file (headed)
npx playwright test specs/main-flow.spec.js --headed

# Run specific test file (UI mode)
npx playwright test specs/main-flow.spec.js --ui
```

### Filtering Tests

```bash
# Run tests matching a tag
npx playwright test --grep "@smoke"
npx playwright test --grep "@critical"

# Run tests matching a pattern
npx playwright test --grep "TC-MAIN-001"
npx playwright test --grep "Admin"

# Run tests in a specific file
npx playwright test specs/main-flow.spec.js

# Run tests in multiple files
npx playwright test specs/main-flow.spec.js specs/auth.spec.js
```

### Debug Mode

```bash
# Debug mode (opens browser with inspector)
npm run test:e2e:debug

# Or
npx playwright test --debug

# Debug specific test
npx playwright test --grep "TC-MAIN-001" --debug
```

### Viewing Reports

```bash
# View HTML report (after running tests)
npm run test:e2e:report

# Or
npx playwright show-report
```

---

## 🎨 UI Mode Features

When you run `npm run test:e2e:ui`, you'll see:

### Left Sidebar
- **Test Files** - All your test files organized
- **Test Cases** - Individual test cases with their tags
- **Groups** - Tests organized by `test.describe()` blocks

### Main Panel
- **Test List** - All tests with status (passed/failed/skipped)
- **Run Button** - Run all or selected tests
- **Filter** - Search/filter tests by name or tag

### When Running Tests
- **Live Browser** - See the browser executing tests
- **Console** - See console logs and errors
- **Network** - See network requests
- **Timeline** - See test execution timeline

### After Tests Complete
- **Screenshots** - See screenshots on failure
- **Videos** - Watch video recordings
- **Traces** - Inspect detailed traces

---

## 📝 Example Workflows

### Workflow 1: Explore All Tests (First Time)
```bash
# Open UI mode to see all tests
npm run test:e2e:ui

# In the UI:
# 1. Browse all test files in sidebar
# 2. Click on a test file to see its tests
# 3. Click "Run" on individual tests
# 4. Watch them execute
```

### Workflow 2: Run Specific Test Suite
```bash
# Run only main flow tests (headless)
npx playwright test specs/main-flow.spec.js

# Run only main flow tests (headed - see browser)
npx playwright test specs/main-flow.spec.js --headed

# Run only main flow tests (UI mode - interactive)
npx playwright test specs/main-flow.spec.js --ui
```

### Workflow 3: Run Tests by Tag
```bash
# Run only smoke tests
npm run test:e2e:smoke

# Or
npx playwright test --grep "@smoke"

# Run only critical tests
npx playwright test --grep "@critical"
```

### Workflow 4: Debug a Failing Test
```bash
# Option 1: Run in headed mode to see what's happening
npx playwright test --grep "TC-MAIN-001" --headed

# Option 2: Use debug mode (step through)
npx playwright test --grep "TC-MAIN-001" --debug

# Option 3: Use UI mode and click on the failing test
npx playwright test --ui
# Then click on the failing test in the UI
```

---

## 🔧 Configuration

### Change Default Mode

Edit `tests/e2e/playwright.config.js`:

```javascript
use: {
  // Change this to control default headless/headed
  headless: process.env.CI ? true : false, // false = headed by default
  // ...
}
```

### Environment Variables

```bash
# Force headless mode
PLAYWRIGHT_HEADLESS=true npx playwright test

# Force headed mode
PLAYWRIGHT_HEADLESS=false npx playwright test
```

---

## 📊 Test Organization in UI Mode

Your tests are organized like this in UI mode:

```
📁 specs/
  📁 main-flow.spec.js
    📁 Main Flow: Admin Creates Users
      ✅ TC-MAIN-001: Admin can create Instructor
      ✅ TC-MAIN-002: Admin can create Student
      ✅ TC-MAIN-003: Created Instructor can sign up
      ✅ TC-MAIN-004: Created Student can sign up
      ✅ TC-MAIN-005: Admin can view created users
  📁 auth.spec.js
    📁 Authentication
      📁 Login Flow
        ✅ TC-AUTH-001: Successful login
        ✅ TC-AUTH-002: Failed login
      📁 Logout Flow
        ✅ TC-AUTH-005: User can logout
  📁 rbac.spec.js
    📁 Role-Based Access Control
      📁 Super Admin Access
        ✅ TC-RBAC-001: Super Admin can access Role Access Pro
      📁 Admin Access
        ✅ TC-RBAC-003: Admin cannot access Role Access Pro
```

---

## 🎯 Quick Reference

| Command | What It Does |
|---------|-------------|
| `npm run test:e2e` | Run all tests (headless) |
| `npm run test:e2e:headed` | Run all tests (browser visible) |
| `npm run test:e2e:ui` | **Open interactive UI** ⭐ |
| `npm run test:e2e:debug` | Debug mode (step through) |
| `npm run test:e2e:smoke` | Run only @smoke tests |
| `npx playwright test --grep "pattern"` | Run tests matching pattern |
| `npx playwright show-report` | View HTML report |

---

## 💡 Pro Tips

1. **First Time?** Use UI mode to explore:
   ```bash
   npm run test:e2e:ui
   ```

2. **Debugging?** Use headed mode:
   ```bash
   npm run test:e2e:headed -- specs/main-flow.spec.js
   ```

3. **CI/CD?** Use headless (default):
   ```bash
   npm run test:e2e
   ```

4. **Quick Test?** Use grep:
   ```bash
   npx playwright test --grep "TC-MAIN-001"
   ```

5. **See All Tests?** UI mode is best:
   ```bash
   npm run test:e2e:ui
   ```

---

## 🐛 Common Issues

### "unknown option '--headed=false'"
**Solution:** Don't use `--headed=false`. Headless is the default. Just use `--headed` to show browser.

### "Tests not showing in UI"
**Solution:** Make sure you're in the correct directory and test files are in `specs/` folder.

### "Can't see browser in headed mode"
**Solution:** Make sure you're using `--headed` flag, not `--headless`.

---

## 📚 More Information

- Playwright Docs: https://playwright.dev/docs/running-tests
- UI Mode: https://playwright.dev/docs/test-ui-mode
- Debugging: https://playwright.dev/docs/debug
