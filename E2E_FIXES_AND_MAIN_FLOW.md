# E2E Testing Fixes & Main Flow Focus

## ✅ Fixed Issues

### 1. Playwright Installation Error
**Problem:** `Cannot find module '@playwright/test'`

**Solution:**
- Added `@playwright/test` to `devDependencies` in `package.json`
- You need to run: `npm install` to install it

**Action Required:**
```bash
npm install
npx playwright install
```

### 2. Refocused on Main Flow
**Changed:** Tests now focus on the primary workflow: **Admin creates Instructor and Student via Dashboard**

## 🎯 Main Flow Tests Created

### New Test File: `tests/e2e/specs/main-flow.spec.js`

**5 Critical Test Cases:**

1. **TC-MAIN-001:** Admin creates Instructor via Dashboard
2. **TC-MAIN-002:** Admin creates Student via Dashboard  
3. **TC-MAIN-003:** Created Instructor can sign up and login
4. **TC-MAIN-004:** Created Student can sign up and login
5. **TC-MAIN-005:** Admin can view created users in table

### Updated Page Object: `tests/e2e/pages/DashboardPage.js`

**Enhanced `addUser()` method:**
- Handles tab navigation (Basic, Academic, Role)
- Fills email and display name
- Selects role from dropdown
- Enables "Auto-add to allowlist" toggle
- Waits for success message

## 📋 Test Flow

```
Admin Login
    ↓
Dashboard > Users Tab
    ↓
Create User Form:
  - Basic Tab: Email, Display Name
  - Role Tab: Select Role (instructor/student)
  - Toggle: Auto-add to allowlist
  - Submit
    ↓
Verify User Created:
  - Success message
  - User in table
  - Role displayed correctly
    ↓
(Optional) Test Signup:
  - Logout admin
  - User signs up
  - User logs in
  - Verify role-based access
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd e:\QAF\Github\courses
npm install
npx playwright install
```

### 2. Set Up Test User
You need an admin user in Firebase. Update `tests/e2e/fixtures/users.js` or set environment variables:

```env
TEST_ADMIN_EMAIL=your-admin@email.com
TEST_ADMIN_PASSWORD=YourPassword123
```

### 3. Run Main Flow Tests
```bash
# Run all main flow tests
npm run test:e2e -- specs/main-flow.spec.js

# Run in UI mode (recommended for first run)
npm run test:e2e:ui -- specs/main-flow.spec.js

# Run in headed mode (see browser)
npm run test:e2e:headed -- specs/main-flow.spec.js
```

## 📝 What's Different from Before

### Before:
- Tests covered all roles (Super Admin, Admin, HR, Instructor, Student)
- Complex role-based access matrix
- 200+ test cases defined

### Now (Focused):
- **Primary focus:** Admin → Create Instructor/Student → Test their workflows
- **Simplified:** Start with the main user creation flow
- **Expandable:** Can add more tests later (admin, super admin, HR)

## 🔧 Configuration Updates

### package.json
- ✅ Added `@playwright/test` to devDependencies
- ✅ Test scripts already configured

### playwright.config.js
- ✅ Already configured correctly
- ✅ Points to `./specs` directory
- ✅ Auto-starts dev server

## 📚 Documentation Created

1. **`tests/e2e/MAIN_FLOW_TESTS.md`** - Quick start guide for main flow tests
2. **`E2E_TESTING_STRATEGY.md`** - Complete strategy (still available for reference)
3. **This file** - Summary of fixes and changes

## ⚠️ Important Notes

### Selectors May Need Adjustment
The page object selectors are based on the code structure, but may need fine-tuning based on your actual UI. If tests fail with "element not found":

1. Run in headed mode to see what's happening:
   ```bash
   npm run test:e2e:headed -- specs/main-flow.spec.js
   ```

2. Update selectors in `tests/e2e/pages/DashboardPage.js`:
   - Check actual form field names/IDs
   - Check tab button text/selectors
   - Check role select dropdown structure

### User Creation Flow
Based on your code, the user creation form has:
- **Tabs:** Basic, Academic, Role
- **Basic Tab:** Email (required), Display Name
- **Role Tab:** Select dropdown with options (student, instructor, hr, admin, superadmin)
- **Toggle:** "Auto-add email to student allowlist"
- **Submit:** Save button

The page object handles this, but you may need to adjust selectors.

## 🎯 Next Steps

1. **Install dependencies:**
   ```bash
   npm install
   npx playwright install
   ```

2. **Run the tests:**
   ```bash
   npm run test:e2e:ui -- specs/main-flow.spec.js
   ```

3. **Fix any selector issues** based on test results

4. **Once main flow works, expand:**
   - Add instructor workflow tests (create quiz, start attendance)
   - Add student workflow tests (take quiz, scan attendance)
   - Add admin/super admin/HR tests later

## 📞 Troubleshooting

### "Cannot find module '@playwright/test'"
```bash
npm install
```

### Tests fail with selector errors
- Run in headed mode to debug
- Check actual HTML structure
- Update selectors in page objects

### User creation fails
- Check Firebase connection
- Verify admin user exists
- Check allowlist permissions

### Signup fails
- Verify "Auto-add to allowlist" is enabled
- Check Firebase `config/allowlist` document
- Verify email format matches

## ✅ Summary

- ✅ Fixed Playwright installation issue
- ✅ Created focused main flow tests (5 test cases)
- ✅ Enhanced DashboardPage page object
- ✅ Created documentation
- ⏳ **Action Required:** Run `npm install` and test

The main flow tests are ready to run once you install the dependencies!
