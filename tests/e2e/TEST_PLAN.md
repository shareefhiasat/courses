# E2E Test Plan - Complete Test Cases

## 📊 Test Overview

**Total Test Cases:** 67+  
**Test Suites:** 7  
**Priority:** Critical workflows first

---

## 🎯 Test Execution Strategy

### Phase 1: Foundation (Start Here)
**Goal:** Verify basic setup and super admin access

| Test ID | Description | Priority | Tags |
|---------|-------------|----------|------|
| TC-SA-001 | Super Admin Login | P0 | @smoke @critical |
| TC-EMAIL-001 | Mailtrap Configuration | P0 | @email |

**Execution Time:** ~2 minutes

---

### Phase 2: User Creation
**Goal:** Create all user types via Dashboard

| Test ID | Description | Priority | Tags |
|---------|-------------|----------|------|
| TC-INSTRUCTOR-001 | Create Instructor | P0 | @smoke @critical @main-flow |
| TC-SA-004 | Create Student | P0 | @smoke @critical @main-flow |
| TC-SA-006 | Create HR | P1 | @critical |
| TC-SA-008 | Create Admin | P1 | @critical |
| TC-SA-010 | Validation: No email | P1 | @critical |
| TC-SA-011 | Validation: Invalid email | P1 | @critical |
| TC-SA-012 | Validation: Optional display name | P2 | @critical |

**Execution Time:** ~10 minutes

---

### Phase 3: Signup Flows
**Goal:** Test signup for each user type

| Test ID | Description | Priority | Tags |
|---------|-------------|----------|------|
| TC-INSTRUCTOR-002 | Instructor Signup | P0 | @smoke @critical @main-flow |
| TC-INSTRUCTOR-003 | Instructor Welcome Email | P1 | @email @critical |
| TC-INSTRUCTOR-004 | Instructor Login | P0 | @smoke @critical |
| TC-SA-005 | Student Signup | P0 | @smoke @critical @main-flow |
| TC-SA-007 | HR Signup | P1 | @critical |
| TC-SA-009 | Admin Signup | P1 | @critical |

**Execution Time:** ~15 minutes

---

### Phase 4: Authentication Validation
**Goal:** Verify all form validations

| Test ID | Description | Priority | Tags |
|---------|-------------|----------|------|
| TC-AUTH-VAL-001 | Login: No email | P0 | @smoke @critical |
| TC-AUTH-VAL-002 | Login: No password | P0 | @smoke @critical |
| TC-AUTH-VAL-003 | Login: Invalid email format | P1 | @critical |
| TC-AUTH-VAL-004 | Login: Invalid credentials | P0 | @smoke @critical |
| TC-AUTH-VAL-005 | Signup: No email | P0 | @smoke @critical |
| TC-AUTH-VAL-006 | Signup: No password | P0 | @smoke @critical |
| TC-AUTH-VAL-007 | Signup: Password < 6 chars | P0 | @smoke @critical |
| TC-AUTH-VAL-008 | Signup: Passwords don't match | P0 | @smoke @critical |
| TC-AUTH-VAL-009 | Signup: Email not in allowlist | P0 | @smoke @critical |
| TC-AUTH-VAL-010 | Signup: Display name optional | P2 | @critical |
| TC-AUTH-VAL-012 | Email format validation | P1 | @critical |
| TC-AUTH-VAL-013 | Valid email formats | P1 | @critical |

**Execution Time:** ~10 minutes

---

### Phase 5: Complete Workflows
**Goal:** End-to-end workflows per role

| Test ID | Description | Priority | Tags |
|---------|-------------|----------|------|
| TC-FLOW-001 | Instructor: Signup → Login → Access | P0 | @smoke @critical @main-flow |
| TC-FLOW-002 | Instructor: Login after signup | P0 | @smoke @critical |
| TC-FLOW-003 | Student: Signup → Login → Access | P0 | @smoke @critical @main-flow |
| TC-FLOW-004 | Student: Login after signup | P0 | @smoke @critical |
| TC-FLOW-005 | HR: Signup → Login → Access | P1 | @critical @main-flow |
| TC-FLOW-006 | Admin: Signup → Login → Access | P1 | @critical @main-flow |

**Execution Time:** ~20 minutes

---

### Phase 6: Email Testing
**Goal:** Verify email functionality

| Test ID | Description | Priority | Tags |
|---------|-------------|----------|------|
| TC-EMAIL-001 | Mailtrap Send API configured | P1 | @email |
| TC-EMAIL-002 | Send test email via API | P1 | @email |
| TC-EMAIL-003 | Welcome email on signup | P1 | @email @critical |
| TC-EMAIL-004 | Password reset email | P1 | @email @critical |
| TC-EMAIL-005 | Super admin notifications | P2 | @email |
| TC-EMAIL-006 | Email content verification | P2 | @email |

**Execution Time:** ~15 minutes

---

### Phase 7: Role-Based Access Control
**Goal:** Verify permissions per role

| Test ID | Description | Priority | Tags |
|---------|-------------|----------|------|
| TC-RBAC-001 | Super Admin: Role Access Pro | P0 | @critical |
| TC-RBAC-002 | Super Admin: All admin screens | P0 | @critical |
| TC-RBAC-003 | Admin: No Role Access Pro | P1 | @critical |
| TC-RBAC-004 | Admin: Dashboard access | P1 | @critical |
| TC-RBAC-005 | Instructor: Create quizzes | P1 | @critical |
| TC-RBAC-006 | Instructor: No dashboard | P1 | @critical |
| TC-RBAC-007 | Instructor: Start attendance | P1 | @critical |
| TC-RBAC-008 | HR: HR Attendance access | P1 | @critical |
| TC-RBAC-009 | HR: No quiz features | P1 | @critical |
| TC-RBAC-010 | HR: No instructor attendance | P1 | @critical |
| TC-RBAC-011 | Student: Student dashboard | P1 | @critical |
| TC-RBAC-012 | Student: No quiz creation | P1 | @critical |
| TC-RBAC-013 | Student: Scan attendance | P1 | @critical |
| TC-RBAC-014 | Student: No dashboard | P1 | @critical |
| TC-RBAC-015 | Unauthenticated redirect | P0 | @critical |
| TC-RBAC-016 | Student accessing admin route | P1 | @critical |

**Execution Time:** ~25 minutes

---

## 📧 Email Testing Strategy

### Gmail Plus Addressing Pattern
```
shareef.hiasat+DDMMYYYYHHMMrole@gmail.com
```

**Examples:**
- Instructor: `shareef.hiasat+250120251430instructor@gmail.com`
- Student: `shareef.hiasat+250120251430student@gmail.com`
- HR: `shareef.hiasat+250120251430hr@gmail.com`

**Benefits:**
- ✅ All emails go to your Gmail inbox
- ✅ Easy to filter: `to:shareef.hiasat+*instructor*@gmail.com`
- ✅ Timestamp shows creation time
- ✅ Unique for each test run

### Mailtrap Usage

**Mailtrap Inbox (SMTP Testing):**
- Use when testing SMTP configuration
- Captures emails sent via SMTP
- Check at: https://mailtrap.io

**Mailtrap Send API:**
- Sends to real email addresses (Gmail)
- Used for production-like testing
- Emails appear in your Gmail inbox

**When to Check:**
- **Mailtrap Inbox:** SMTP testing, email content verification
- **Gmail Inbox:** Real email delivery, welcome emails, notifications

---

## 🎯 Priority Matrix

### P0 - Critical (Must Run First)
- Super admin login
- User creation (Instructor, Student)
- Signup flows
- Basic validations
- Complete workflows

**Count:** 20 tests  
**Execution Time:** ~30 minutes

### P1 - High Priority
- HR/Admin creation
- Email testing
- RBAC verification
- Advanced validations

**Count:** 35 tests  
**Execution Time:** ~60 minutes

### P2 - Medium Priority
- Edge cases
- Optional features
- Advanced scenarios

**Count:** 12 tests  
**Execution Time:** ~20 minutes

---

## 📋 Test Execution Commands

### Run by Phase
```bash
# Phase 1: Foundation
npx playwright test --grep "TC-SA-001|TC-EMAIL-001"

# Phase 2: User Creation
npx playwright test --grep "TC-INSTRUCTOR-001|TC-SA-004|TC-SA-006|TC-SA-008"

# Phase 3: Signup Flows
npx playwright test --grep "TC-INSTRUCTOR-002|TC-SA-005|TC-SA-007|TC-SA-009"

# Phase 4: Validation
npx playwright test specs/auth-validation.spec.js

# Phase 5: Complete Workflows
npx playwright test specs/comprehensive-user-flow.spec.js

# Phase 6: Email Testing
npx playwright test specs/email-tests.spec.js

# Phase 7: RBAC
npx playwright test specs/rbac.spec.js
```

### Run by Priority
```bash
# P0 Tests (Critical)
npm run test:e2e:smoke

# All Critical Tests
npx playwright test --grep "@critical"

# Email Tests
npx playwright test --grep "@email"
```

### Run Specific Test
```bash
# Instructor Creation
npx playwright test specs/instructor-creation.spec.js

# Super Admin Flow
npx playwright test specs/super-admin-flow.spec.js
```

---

## 📊 Test Coverage Summary

| Feature | Test Cases | Status |
|---------|-----------|--------|
| Super Admin Login | 1 | ✅ |
| User Creation | 4 | ✅ |
| Instructor Creation | 4 | ✅ |
| Signup Flows | 4 | ✅ |
| Login Flows | 4 | ✅ |
| Form Validation | 13 | ✅ |
| Complete Workflows | 6 | ✅ |
| Email Testing | 6 | ✅ |
| RBAC | 16 | ✅ |
| Authentication | 10 | ✅ |
| **Total** | **67+** | ✅ |

---

## 🔄 Test Data Management

### Email Generation
- Uses Gmail plus addressing
- Format: `shareef.hiasat+DDMMYYYYHHMMrole@gmail.com`
- All emails go to your Gmail inbox
- Easy to filter and search

### User Cleanup
- Test users use unique emails (timestamp-based)
- No cleanup needed (emails are unique)
- Can filter in Gmail by timestamp

---

## 📚 Documentation Structure

### Main Files
1. **`README.md`** - This file (complete guide)
2. **`TEST_PLAN.md`** - Detailed test plan (this file)
3. **`PLAYWRIGHT_COMMANDS.md`** - Command reference
4. **`MAILTRAP_SETUP.md`** - Mailtrap configuration

### Removed/Consolidated
- ❌ `COMPLETE_QA_SETUP.md` → Merged into README
- ❌ `QA_SETUP_COMPLETE.md` → Merged into README
- ❌ `README_SETUP.md` → Merged into README
- ❌ `MAIN_FLOW_TESTS.md` → Merged into TEST_PLAN
- ❌ `E2E_FIXES_AND_MAIN_FLOW.md` → Merged into README

---

## ✅ Test Checklist

### Before Running Tests
- [ ] Dependencies installed (`npm install`)
- [ ] Playwright browsers installed (`npx playwright install`)
- [ ] `.env.test` file created
- [ ] Mailtrap Inbox ID added
- [ ] Super admin credentials verified

### Test Execution
- [ ] Phase 1: Foundation tests pass
- [ ] Phase 2: User creation tests pass
- [ ] Phase 3: Signup flows pass
- [ ] Phase 4: Validation tests pass
- [ ] Phase 5: Complete workflows pass
- [ ] Phase 6: Email tests pass
- [ ] Phase 7: RBAC tests pass

### Verification
- [ ] Check Gmail inbox for test emails
- [ ] Verify email content
- [ ] Check Mailtrap inbox (for SMTP tests)
- [ ] Review test reports

---

## 🎉 Ready to Test!

Everything is set up and ready. Start with:

```bash
npm run test:e2e:ui
```

Then run tests in order:
1. Super Admin Login
2. Create Instructor
3. Instructor Signup
4. Complete Workflows

---

**Last Updated:** January 25, 2026  
**Total Tests:** 67+  
**Status:** ✅ Complete Test Plan
