# QAF Academy Testing Plan

## Overview

This document outlines a comprehensive testing strategy for the QAF Academy learning management system, covering authentication, user roles (Admin, Student, Instructor), email notifications, and cross-platform compatibility.

## Testing Architecture

### Test Environments

1. **Unit Tests** - Component and logic testing
2. **Integration Tests** - Component interaction testing
3. **E2E Tests** - Full user journey testing with Playwright
4. **Email Testing** - Mailtrap for notification verification

### Supported Platforms

- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome Mobile, Safari Mobile (iOS)
- **Email**: Mailtrap SMTP testing service

## Test User Roles & Scenarios

### 1. Student Role Testing

**Test Accounts:**
- `student.test@qaf.test` / `StudentPass123!`
- `student.arabic@qaf.test` / `StudentPass123!` (Arabic interface)

**Core Scenarios:**
- ✅ Login/logout functionality
- ✅ View available activities, resources, quizzes
- ✅ Submit assignments and activities
- ✅ Take quizzes and view results
- ✅ Access enrolled courses
- ✅ View progress and grades
- ✅ Receive email notifications for:
  - Assignment deadlines
  - Quiz results
  - Course updates
  - Grade notifications

**Advanced Scenarios:**
- Filter and search content
- Bookmark favorite items
- View attendance records
- Access student dashboard
- Mobile responsiveness

### 2. Instructor Role Testing

**Test Accounts:**
- `instructor.test@qaf.test` / `InstructorPass123!`
- `instructor.senior@qaf.test` / `InstructorPass123!`

**Core Scenarios:**
- ✅ Login/logout functionality
- ✅ Create and manage activities
- ✅ Create and manage quizzes
- ✅ Grade student submissions
- ✅ View class attendance
- ✅ Access instructor dashboard
- ✅ Send notifications to students
- ✅ Receive email notifications for:
  - New submissions
  - Student questions
  - System updates

**Advanced Scenarios:**
- Bulk grading operations
- Quiz analytics and reporting
- Student progress tracking
- Class schedule management
- Mobile content creation

### 3. Admin Role Testing

**Test Accounts:**
- `admin.super@qaf.test` / `AdminPass123!`
- `admin.hr@qaf.test` / `AdminPass123!`

**Core Scenarios:**
- ✅ Login/logout functionality
- ✅ User management (create, edit, delete users)
- ✅ Role assignment and permissions
- ✅ Course and program management
- ✅ System configuration
- ✅ View analytics and reports
- ✅ Manage email templates
- ✅ Receive email notifications for:
  - System alerts
  - User registrations
  - Security events

**Advanced Scenarios:**
- Bulk user operations
- System backup and restore
- Email campaign management
- Advanced analytics
- Security audit logs

## Email Testing with Mailtrap

### Setup

1. **Create Mailtrap Account** (Free Tier)
   - Visit https://mailtrap.io
   - Sign up for free account
   - Create a new inbox for "QAF Academy Testing"

2. **Get SMTP Credentials**
   ```
   SMTP Host: smtp.mailtrap.io
   SMTP Port: 2525 (or 587 for TLS)
   Username: [your-mailtrap-username]
   Password: [your-mailtrap-password]
   ```

3. **Configure Environment**
   ```bash
   # .env.test
   VITE_SMTP_HOST=smtp.mailtrap.io
   VITE_SMTP_PORT=2525
   VITE_SMTP_USER=your-mailtrap-username
   VITE_SMTP_PASS=your-mailtrap-password
   ```

### Email Scenarios to Test

**Authentication Emails:**
- Welcome email on registration
- Password reset emails
- Email verification

**Notification Emails:**
- Assignment deadlines (students)
- Grade notifications (students)
- Submission confirmations (students)
- New submission alerts (instructors)
- System announcements (all users)

**Administrative Emails:**
- User registration alerts (admins)
- System error notifications (admins)
- Security alerts (admins)

## E2E Testing with Playwright

### Setup

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Install mobile browsers
npx playwright install webkit  # For Safari
```

### Configuration

```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile browsers (focus area)
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Test environment
    {
      name: 'test-env',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5174',
      },
      testMatch: '**/*.test.e2e.ts',
    },
  ],
});
```

### Mobile Testing Focus

**Priority Mobile Scenarios:**
1. **Authentication** - Login/signup on mobile
2. **Content Consumption** - View activities/resources on mobile
3. **Quiz Taking** - Complete quizzes on mobile devices
4. **Navigation** - Use mobile menu and tabs
5. **File Upload** - Submit assignments from mobile
6. **Notifications** - Receive and interact with push notifications

**Mobile-Specific Tests:**
```javascript
// e2e/mobile-auth.spec.js
import { test, expect } from '@playwright/test';

test.describe('Mobile Authentication', () => {
  test.use({ ...devices['iPhone 12'] });

  test('student can login on iPhone', async ({ page }) => {
    await page.goto('/');
    await page.tap('input[placeholder="Email"]');
    await page.fill('input[placeholder="Email"]', 'student.test@qaf.test');
    await page.fill('input[placeholder="Password"]', 'StudentPass123!');
    await page.tap('button:has-text("Sign In")');

    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});
```

## Test Data & Seed Setup

### Firebase Test Project

1. **Create Test Firebase Project**
   ```bash
   firebase projects:create qaf-academy-test
   firebase use qaf-academy-test
   ```

2. **Test Firebase Configuration**
   ```javascript
   // firebase-test-config.js
   export const testFirebaseConfig = {
     apiKey: process.env.VITE_TEST_FIREBASE_API_KEY,
     authDomain: "qaf-academy-test.firebaseapp.com",
     projectId: "qaf-academy-test",
     storageBucket: "qaf-academy-test.appspot.com",
     messagingSenderId: process.env.VITE_TEST_MESSAGING_SENDER_ID,
     appId: process.env.VITE_TEST_APP_ID
   };
   ```

### Seed Data Structure

```javascript
// test-data/seed.js
export const testUsers = {
  students: [
    {
      email: 'student.test@qaf.test',
      password: 'StudentPass123!',
      displayName: 'Test Student',
      role: 'student',
      enrolledClasses: ['class-1', 'class-2']
    }
  ],
  instructors: [
    {
      email: 'instructor.test@qaf.test',
      password: 'InstructorPass123!',
      displayName: 'Test Instructor',
      role: 'instructor',
      assignedClasses: ['class-1']
    }
  ],
  admins: [
    {
      email: 'admin.super@qaf.test',
      password: 'AdminPass123!',
      displayName: 'Super Admin',
      role: 'admin',
      permissions: ['all']
    }
  ]
};

export const testContent = {
  activities: [...],
  resources: [...],
  quizzes: [...],
  courses: [...]
};
```

## Environment Configuration

### Test Environment Files

```bash
# .env.test
# Firebase Test Project
VITE_FIREBASE_API_KEY=test_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=qaf-academy-test.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=qaf-academy-test
VITE_FIREBASE_STORAGE_BUCKET=qaf-academy-test.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=test_sender_id
VITE_FIREBASE_APP_ID=test_app_id

# Mailtrap (Free Tier)
VITE_SMTP_HOST=smtp.mailtrap.io
VITE_SMTP_PORT=2525
VITE_SMTP_USER=your_mailtrap_username
VITE_SMTP_PASS=your_mailtrap_password

# Test Flags
VITE_IS_TEST=true
VITE_SKIP_EMAIL_VERIFICATION=true

# PostHog (Test)
VITE_PUBLIC_POSTHOG_KEY=test_posthog_key
VITE_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

### Production Environment (Reference)

```bash
# .env.production
VITE_FIREBASE_API_KEY=prod_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=qaf-academy-prod.firebaseapp.com
# ... production config
```

## Test Execution Workflow

### 1. Environment Setup

```bash
# Install dependencies
npm install

# Set up test environment
cp .env.test .env
firebase use qaf-academy-test

# Start Mailtrap (if using local)
mailtrap

# Seed test data
npm run test:seed
```

### 2. Run Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests (all browsers)
npm run test:e2e

# E2E tests (mobile focus)
npm run test:e2e:mobile

# E2E tests (specific browser)
npx playwright test --project="Mobile Safari"
```

### 3. Email Verification

```bash
# Check Mailtrap inbox
open https://mailtrap.io/inboxes

# Or use API
curl -X GET "https://mailtrap.io/api/v1/inboxes/YOUR_INBOX_ID/messages" \
  -H "Api-Token: YOUR_API_TOKEN"
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Setup test environment
        run: |
          cp .env.test .env
          firebase use qaf-academy-test

      - name: Seed test data
        run: npm run test:seed

      - name: Run unit tests
        run: npm test

      - name: Run E2E tests
        run: npx playwright test --project="chromium"

      - name: Run mobile tests
        run: npx playwright test --project="Mobile Chrome" --project="Mobile Safari"

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

## Test Coverage Goals

- **Unit Tests**: >80% coverage for components and utilities
- **Integration Tests**: Key user flows and API interactions
- **E2E Tests**: Critical paths for all user roles
- **Email Tests**: All notification types
- **Mobile Tests**: Core functionality on iOS Safari and Android Chrome

## Monitoring & Reporting

### Test Results Dashboard

- Playwright HTML reports
- Jest coverage reports
- Mailtrap email logs
- Firebase test project analytics

### Performance Benchmarks

- Page load times < 3 seconds
- Test execution time < 10 minutes
- Email delivery confirmation < 5 seconds

## Troubleshooting

### Common Issues

1. **Firebase Auth Errors**: Check test project configuration
2. **Email Not Received**: Verify Mailtrap credentials and inbox
3. **Mobile Test Failures**: Check device emulation settings
4. **Seed Data Issues**: Ensure Firebase security rules allow test data

### Debug Commands

```bash
# Debug Playwright
DEBUG=pw:api npx playwright test

# Check Firebase auth
firebase auth:export users.json --project qaf-academy-test

# Verify email configuration
node scripts/test-email.js
```

## Next Steps

1. Set up Mailtrap account and get credentials
2. Create Firebase test project
3. Configure environment files
4. Implement seed data script
5. Write initial E2E test suite
6. Set up CI/CD pipeline

This testing plan ensures comprehensive coverage of all user roles, platforms, and email scenarios while maintaining isolation from production systems.

## 📋 Complete Testing Infrastructure Created

### **1. Testing README (`TESTING_README.md`)**
- Comprehensive testing strategy for admin, student, and instructor roles
- Email testing with Mailtrap free tier
- E2E testing with Playwright (mobile Safari/Chrome focus)
- Test scenarios for all user types and email notifications

### **2. Environment Configuration**
- **`.env.test`** - Separate test environment variables
- **`firebase-test-config.js`** - Test Firebase project configuration
- **`firestore.test.rules`** - Test database security rules

### **3. Test Data & Seeding**
- **`test-data/seed.js`** - Complete seed data for all user roles, classes, activities, etc.
- **`scripts/seed-test-data.js`** - Automated seeding script for test Firebase project

### **4. E2E Testing Setup**
- **`playwright.config.js`** - Mobile-focused Playwright configuration
- **`e2e/auth.spec.js`** - Sample authentication tests for all user roles
- Mobile Safari and Chrome testing prioritized

### **5. Email Testing**
- **`scripts/test-email-verification.js`** - Email verification utility for Mailtrap
- Tests welcome emails, password resets, notifications

### **6. CI/CD Pipeline**
- **`.github/workflows/test.yml`** - GitHub Actions workflow
- Automated testing on push/PR with mobile focus
- Email verification integration

### **7. Package.json Updates**
Added testing scripts:
- `npm run test:seed` - Seed test data
- `npm run test:e2e:mobile` - Mobile E2E tests
- `npm run test:all` - Run all tests

## 🚀 Quick Start Guide

1. **Set up Mailtrap** (https://mailtrap.io)
   - Create free account and inbox
   - Get SMTP credentials

2. **Create Test Firebase Project**
   ```bash
   firebase projects:create qaf-academy-test
   firebase use qaf-academy-test
   ```

3. **Configure Environment**
   ```bash
   # Update .env.test with your actual credentials
   VITE_SMTP_USER=your_mailtrap_username
   VITE_SMTP_PASS=your_mailtrap_password
   # Add your test Firebase keys
   ```

4. **Run Tests**
   ```bash
   npm run test:seed    # Seed test data
   npm run test:e2e:mobile  # Run mobile tests
   ```

## 🔐 Test Credentials

- **Student**: `student.test@qaf.test` / `StudentPass123!`
- **Instructor**: `instructor.test@qaf.test` / `InstructorPass123!`
- **Admin**: `admin.super@qaf.test` / `AdminPass123!`

## 📱 Mobile Testing Focus

- **iPhone 12** (Safari Mobile)
- **Pixel 5** (Chrome Mobile)
- Touch interactions and responsive design
- Real mobile browser behavior

This setup ensures comprehensive testing of authentication, user roles, email notifications, and mobile compatibility without affecting your production environment. All test data is isolated and automated.