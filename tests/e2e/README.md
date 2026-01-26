# E2E Testing - Complete Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
npx playwright install
```

### 2. Configure Environment
Create `.env.test` in **project root**:

```env
BASE_URL=http://localhost:5174
TEST_SUPERADMIN_EMAIL=shareef.hiasat@gmail.com
TEST_SUPERADMIN_PASSWORD=Jordan123$
MAILTRAP_INBOX_ID=your_inbox_id_here
```

### 3. Run Tests
```bash
# See all tests in UI (recommended)
npm run test:e2e:ui

# Run smoke tests
npm run test:e2e:smoke

# Run specific test
npx playwright test specs/instructor-creation.spec.js
```

---

## 📋 Test Suites

### Core Test Suites

1. **`super-admin-flow.spec.js`** (12 tests)
   - Super admin login
   - Create all user types (Instructor, Student, HR, Admin)
   - Test signup flows
   - Validation tests

2. **`instructor-creation.spec.js`** (4 tests)
   - Create instructor via dashboard
   - Instructor signup
   - Welcome email verification
   - Login after signup

3. **`auth-validation.spec.js`** (13 tests)
   - Login validations
   - Signup validations
   - Email format validation
   - Password rules

4. **`comprehensive-user-flow.spec.js`** (6 tests)
   - Complete workflows per role
   - Signup → Login → Access Control

5. **`email-tests.spec.js`** (6 tests)
   - Mailtrap configuration
   - Welcome emails
   - Password reset emails
   - Email content verification

### Dashboard Management

6. **`dashboard-programs.spec.js`** (7 tests)
   - CRUD operations, grid, search, filters

7. **`dashboard-subjects.spec.js`** (6 tests)
   - CRUD operations, filter by program

8. **`dashboard-classes.spec.js`** (5 tests)
   - CRUD operations, validation

9. **`dashboard-enrollment.spec.js`** (3 tests)
   - Enroll student, view enrollments, duplicate prevention

10. **`dashboard-activities.spec.js`** (7 tests)
    - Create: Homework, Activity, Resource, Announcement
    - Update, Delete, Grid viewing

11. **`dashboard-categories.spec.js`** (5 tests)
    - Create, Update, Delete, Add defaults

12. **`dashboard-penalties.spec.js`** (7 tests)
    - CRUD operations, grid, search, filters

13. **`dashboard-behavior.spec.js`** (6 tests)
    - CRUD operations, grid, search, filters

14. **`dashboard-participation.spec.js`** (6 tests)
    - CRUD operations, grid, search, filters

### Home Page & Results

15. **`home-page.spec.js`** (11 tests) ⭐ **NEW**
    - Activities, Resources, Quizzes tabs
    - Filter by category, level, type (Training, Homework)
    - Search, status filters

16. **`review-results.spec.js`** (12 tests) ⭐ **NEW**
    - Quiz, Homework, Training, Lab & Project results
    - Filters, statistics, grid display

### Additional

17. **`auth.spec.js`** (10 tests)
    - Basic authentication
    - Login/logout flows

18. **`rbac.spec.js`** (16 tests)
    - Role-based access control
    - Permission verification

**Total: 100+ test cases**

---

## 📧 Email Testing Strategy

### Gmail Plus Addressing
All test emails use Gmail plus addressing pattern:
```
shareef.hiasat+DDMMYYYYHHMMrole@gmail.com
```

**Example:**
- `shareef.hiasat+250120251430instructor@gmail.com`
- `shareef.hiasat+250120251430student@gmail.com`

**Benefits:**
- ✅ All emails go to `shareef.hiasat@gmail.com` inbox
- ✅ Easy to filter/search in Gmail
- ✅ Unique emails for each test
- ✅ Timestamp shows when user was created

### Mailtrap Usage

**Mailtrap Inbox (SMTP Testing):**
- Captures emails sent via SMTP
- Use for testing email sending functionality
- Check inbox at: https://mailtrap.io

**Mailtrap Send API:**
- Sends emails to real addresses (Gmail)
- Used for production-like testing
- Emails appear in your Gmail inbox

**When to Use:**
- **Mailtrap Inbox:** Test SMTP configuration, verify email content
- **Gmail Inbox:** Verify emails reach real recipients, test email delivery

---

## 🎯 Test Execution Order

### Phase 1: Setup
1. **TC-SA-001:** Super Admin Login
2. **TC-EMAIL-001:** Verify Mailtrap Configuration

### Phase 2: User Creation
3. **TC-INSTRUCTOR-001:** Create Instructor ⭐
4. **TC-SA-004:** Create Student
5. **TC-SA-006:** Create HR
6. **TC-SA-008:** Create Admin

### Phase 3: Signup & Login
7. **TC-INSTRUCTOR-002:** Instructor Signup ⭐
8. **TC-SA-005:** Student Signup
9. **TC-SA-007:** HR Signup
10. **TC-SA-009:** Admin Signup

### Phase 4: Complete Workflows
11. Run `comprehensive-user-flow.spec.js`
12. Run `email-tests.spec.js`

---

## 🏷️ Test Tags

- `@smoke` - Critical path (16 tests)
- `@critical` - Must pass (31 tests)
- `@main-flow` - Primary workflows (4 tests)
- `@email` - Email-related (6 tests)

**Run by tag:**
```bash
npm run test:e2e:smoke  # Run @smoke tests
npx playwright test --grep "@critical"
npx playwright test --grep "@email"
```

---

## 📧 Email Testing

### How It Works

1. **Test creates user** with Gmail plus address
2. **User signs up** → System sends welcome email
3. **Email goes to** `shareef.hiasat@gmail.com` (via plus addressing)
4. **Check Gmail inbox** for the email
5. **Search in Gmail:** `to:shareef.hiasat+*instructor*@gmail.com`

### Mailtrap vs Gmail

| Feature | Mailtrap Inbox | Gmail Inbox |
|---------|---------------|-------------|
| **Purpose** | SMTP testing | Real email delivery |
| **When Used** | Test email sending | Verify email received |
| **Access** | https://mailtrap.io | Your Gmail |
| **Email Pattern** | Any email | Gmail plus addressing |

### Test Email Scenarios

- ✅ Welcome email on signup
- ✅ Password reset email
- ✅ Notification emails
- ✅ Email content verification

---

## 🔧 Configuration

### Test Config
`config/test-config.js` - All credentials and settings

### Email Generation
Uses Gmail plus addressing:
- Format: `shareef.hiasat+DDMMYYYYHHMMrole@gmail.com`
- All emails go to your Gmail inbox
- Easy to filter and search

### Mailtrap
- **SMTP:** `sandbox.smtp.mailtrap.io:587`
- **Send API:** `https://send.api.mailtrap.io`
- **Inbox:** Check at https://mailtrap.io

---

## 📊 Test Cases by Feature

### Instructor Creation (4 tests)
- ✅ TC-INSTRUCTOR-001: Create Instructor
- ✅ TC-INSTRUCTOR-002: Instructor Signup
- ✅ TC-INSTRUCTOR-003: Welcome Email
- ✅ TC-INSTRUCTOR-004: Instructor Login

### Student Creation (4 tests)
- ✅ TC-SA-004: Create Student
- ✅ TC-SA-005: Student Signup
- ✅ (Add welcome email test)

### Authentication (13 tests)
- ✅ Login validations
- ✅ Signup validations
- ✅ Email format
- ✅ Password rules

### Email Testing (6 tests)
- ✅ Mailtrap configuration
- ✅ Welcome emails
- ✅ Password reset
- ✅ Email content

---

## 🐛 Troubleshooting

### "Cannot find module '@playwright/test'"
```bash
npm install
```

### "Element not found"
- Run in headed mode: `npm run test:e2e:headed`
- Check selectors in page objects

### "Email not in Gmail"
- Check Gmail plus address format
- Search in Gmail: `to:shareef.hiasat+*@gmail.com`
- Check spam folder

### "Mailtrap inbox empty"
- Mailtrap Inbox is for SMTP testing
- Real emails go to Gmail (via Send API)
- Check your Gmail inbox instead

---

## 📚 Documentation

- **This file** - Main guide
- **`PLAYWRIGHT_COMMANDS.md`** - Command reference
- **`MAILTRAP_SETUP.md`** - Mailtrap configuration

---

## ✅ Quick Commands

```bash
# UI Mode (see all tests)
npm run test:e2e:ui

# Run smoke tests
npm run test:e2e:smoke

# Run instructor creation
npx playwright test specs/instructor-creation.spec.js

# Run email tests
npx playwright test specs/email-tests.spec.js

# Run all tests
npm run test:e2e
```

---

**Last Updated:** January 25, 2026  
**Total Tests:** 100+  
**Status:** ✅ Complete Setup Ready
