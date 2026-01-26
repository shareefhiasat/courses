# 🧪 Comprehensive E2E Testing Strategy
## React Education Platform - Complete Test Plan

**Created:** January 25, 2026  
**Status:** Planning Phase  
**Priority:** Critical

---

## 📋 Executive Summary

This document provides a comprehensive End-to-End (E2E) testing strategy for the React Education Platform, covering role-based access control, critical workflows, notification systems, Material-UI components, Firebase authentication, and cross-device testing.

### Testing Framework
- **Primary Tool:** Playwright
- **Language:** JavaScript/TypeScript
- **Test Location:** `tests/e2e/`
- **Configuration:** `tests/e2e/playwright.config.js`

---

## 1. ROLE-BASED ACCESS TESTING

### 1.1 Role Hierarchy & Permissions

#### **Super Admin** (`isSuperAdmin: true`)
**Full System Access + Role Management**

**Accessible Screens:**
- ✅ All admin screens
- ✅ Role Access Pro (`/role-access-pro`) - **EXCLUSIVE**
- ✅ User management with role assignment
- ✅ System configuration
- ✅ All analytics and reports

**Test Cases:**
```javascript
// TC-RBAC-001: Super Admin Role Access
- Login as super admin
- Verify Role Access Pro menu item appears
- Verify can access all admin screens
- Verify can modify role permissions
- Verify can assign/revoke roles from users
```

#### **Admin** (`role: 'admin'` or `admin` claim)
**Dashboard, User Management, Analytics**

**Accessible Screens:**
- ✅ Dashboard (`/dashboard`)
- ✅ User Management
- ✅ Analytics (`/analytics`)
- ✅ Advanced Analytics (`/advanced-analytics`)
- ✅ Quiz Management
- ✅ Attendance Management
- ✅ All enrollment management
- ❌ Role Access Pro (Super Admin only)

**Test Cases:**
```javascript
// TC-RBAC-002: Admin Role Access
- Login as admin
- Verify Role Access Pro is NOT visible
- Verify can access dashboard
- Verify can manage users
- Verify can view all analytics
- Verify can create/edit quizzes
- Verify can manage enrollments
```

#### **Instructor** (`role: 'instructor'` or `isInstructor: true`)
**Quizzes, Attendance, Grading**

**Accessible Screens:**
- ✅ Home (`/`)
- ✅ Activities (`/activities`)
- ✅ Quiz Management (`/quiz-management`)
- ✅ Quiz Builder (`/quiz-builder`)
- ✅ Quiz Results (`/quiz-results`)
- ✅ Attendance (`/attendance`)
- ✅ Instructor Participation (`/instructor-participation`)
- ✅ Instructor Behavior (`/instructor-behavior`)
- ✅ Marks Entry (`/marks-entry`)
- ✅ Student Profile (view only)
- ❌ Dashboard (admin only)
- ❌ Role Access Pro
- ❌ HR Attendance

**Test Cases:**
```javascript
// TC-RBAC-003: Instructor Role Access
- Login as instructor
- Verify can create quizzes
- Verify can start attendance sessions
- Verify can grade submissions
- Verify can view student progress
- Verify CANNOT access dashboard
- Verify CANNOT access HR features
```

#### **HR** (`role: 'hr'` or `isHR: true`)
**HR Attendance, Penalties, Analytics**

**Accessible Screens:**
- ✅ HR Attendance (`/hr-attendance`)
- ✅ HR Penalties (`/hr-penalties`)
- ✅ Analytics (`/analytics`)
- ✅ Student Profile (view only)
- ✅ Chat (limited)
- ❌ Quiz Management
- ❌ Attendance (instructor version)
- ❌ Dashboard

**Test Cases:**
```javascript
// TC-RBAC-004: HR Role Access
- Login as HR user
- Verify can access HR Attendance page
- Verify can edit attendance records
- Verify can manage penalties
- Verify can export attendance reports
- Verify CANNOT access quiz features
- Verify CANNOT access instructor attendance
```

#### **Student** (`role: 'student'` or default)
**Learning Activities, Progress Tracking**

**Accessible Screens:**
- ✅ Student Dashboard (`/student-dashboard`)
- ✅ Activities (`/activities`)
- ✅ Progress (`/progress`)
- ✅ Resources (`/resources`)
- ✅ Quizzes (take only)
- ✅ My Attendance (`/my-attendance`)
- ✅ My Enrollments (`/my-enrollments`)
- ✅ Course Progress (`/course-progress`)
- ✅ Chat
- ❌ Quiz Management
- ❌ Quiz Builder
- ❌ Dashboard
- ❌ Analytics

**Test Cases:**
```javascript
// TC-RBAC-005: Student Role Access
- Login as student
- Verify can view student dashboard
- Verify can take quizzes
- Verify can scan attendance QR codes
- Verify can view progress
- Verify CANNOT create quizzes
- Verify CANNOT access admin features
```

### 1.2 Role Access Pro Testing

**Screen:** `/role-access-pro`  
**Access:** Super Admin only

**Test Cases:**
```javascript
// TC-RBAC-006: Role Access Pro Configuration
- Login as super admin
- Navigate to Role Access Pro
- Verify all roles are listed (admin, instructor, hr, student)
- Toggle screen access for each role
- Save configuration
- Logout and login as affected role
- Verify access changes are applied
- Test edge cases (all screens disabled, all enabled)
```

### 1.3 Route Protection Testing

**Test Cases:**
```javascript
// TC-RBAC-007: Unauthorized Route Access
- Attempt to access /dashboard as student → Should redirect
- Attempt to access /role-access-pro as admin → Should redirect
- Attempt to access /quiz-builder as student → Should redirect
- Attempt to access /hr-attendance as instructor → Should redirect
- Verify redirect goes to home or login
- Verify error message shown (optional)
```

---

## 2. CRITICAL WORKFLOWS

### 2.1 Authentication Flows

#### **Login Flow**
**File:** `client/src/pages/LoginPage.jsx`  
**Firebase:** `client/src/firebase/auth.js`

**Test Cases:**
```javascript
// TC-AUTH-001: Successful Login
- Navigate to /login
- Enter valid email (from allowlist)
- Enter valid password
- Click "Sign In"
- Verify redirect to home or dashboard (based on role)
- Verify user profile loaded
- Verify role-based menu items appear

// TC-AUTH-002: Failed Login - Invalid Credentials
- Enter invalid email/password
- Click "Sign In"
- Verify error message displayed
- Verify user remains on login page

// TC-AUTH-003: Failed Login - Email Not in Allowlist
- Enter email not in allowlist
- Attempt signup
- Verify error message
- Verify user not created

// TC-AUTH-004: Session Timeout
- Login successfully
- Wait 30 minutes (or mock timeout)
- Verify automatic logout
- Verify redirect to login
- Verify session timeout reason logged

// TC-AUTH-005: Logout Flow
- Login successfully
- Click logout button
- Verify user signed out
- Verify redirect to login/home
- Verify session cleared
```

#### **Signup Flow**
**Test Cases:**
```javascript
// TC-AUTH-006: Successful Signup (Allowlist User)
- Navigate to /login
- Click "Sign Up" or navigate to signup
- Enter email in allowlist
- Enter password
- Enter display name
- Submit
- Verify Firebase auth user created
- Verify Firestore user document created
- Verify redirect to home

// TC-AUTH-007: Signup - Email Not in Allowlist
- Attempt signup with non-allowlist email
- Verify error message
- Verify user not created
```

#### **Password Reset Flow**
**Test Cases:**
```javascript
// TC-AUTH-008: Password Reset Request
- Navigate to login
- Click "Forgot Password"
- Enter registered email
- Submit
- Verify reset email sent (mock or check Firebase)
- Verify success message displayed

// TC-AUTH-009: Password Reset Completion
- Use reset link (mock or test email)
- Enter new password
- Submit
- Verify password updated
- Verify can login with new password
```

### 2.2 QR Scanner Workflows

#### **Instructor: Start Attendance Session**
**File:** `client/src/pages/AttendancePage.jsx`

**Test Cases:**
```javascript
// TC-ATTEND-001: Start Attendance Session
- Login as instructor
- Navigate to /attendance
- Select class from dropdown
- Click "Start Session"
- Verify QR code generated
- Verify 6-digit manual code displayed
- Verify session status is "open"
- Verify real-time scan counter shows 0
- Verify student link can be copied

// TC-ATTEND-002: QR Code Rotation
- Start attendance session
- Wait for token rotation (30s default)
- Verify QR code updates
- Verify manual code updates
- Verify old QR codes are invalidated

// TC-ATTEND-003: End Attendance Session
- Start session
- Click "End Session"
- Verify session status is "closed"
- Verify QR code no longer displayed
- Verify late mode option available
- Verify can export CSV

// TC-ATTEND-004: Late Mode
- End session
- Enable "Late Mode"
- Verify students can still scan
- Verify late arrivals marked as "late"
```

#### **Student: Scan Attendance**
**File:** `client/src/pages/StudentAttendancePage.jsx`

**Test Cases:**
```javascript
// TC-ATTEND-005: QR Code Scan (Camera)
- Login as student
- Navigate to /my-attendance
- Grant camera permission (mock)
- Point camera at QR code
- Verify QR code detected
- Verify attendance recorded
- Verify success message
- Verify status shown (present/leave)

// TC-ATTEND-006: Manual Code Entry
- Navigate to /my-attendance
- Enter 6-digit code
- Select status (Present/Leave)
- If Leave: Select reason (Medical/Official/Other)
- If Leave: Add optional note
- Submit
- Verify attendance recorded
- Verify success message

// TC-ATTEND-007: Magic Link (Direct Access)
- Receive attendance link via URL params
- Navigate to /my-attendance?sid=...&t=...
- If logged in: Verify auto-submit
- If not logged in: Verify redirect to login, then back
- Verify attendance recorded

// TC-ATTEND-008: Invalid QR Code
- Attempt to scan expired QR code
- Verify error message
- Verify attendance not recorded

// TC-ATTEND-009: Device Binding (if enabled)
- Scan attendance from device A
- Attempt to scan from device B (same session)
- Verify error: "device_change_blocked"
- Verify attendance not recorded
```

#### **HR: Attendance Management**
**File:** `client/src/pages/HRAttendancePage.jsx`

**Test Cases:**
```javascript
// TC-ATTEND-010: HR View All Attendance
- Login as HR
- Navigate to /hr-attendance
- Verify all sessions visible
- Filter by class, date, status
- Verify attendance records displayed
- Verify can edit attendance status
- Verify can add reasons/feedback

// TC-ATTEND-011: HR Edit Attendance
- View attendance record
- Change status (present → absent, etc.)
- Add reason/feedback
- Save
- Verify changes saved
- Verify student sees updated status

// TC-ATTEND-012: HR Export Reports
- Filter attendance data
- Click "Export CSV"
- Verify CSV file downloaded
- Verify CSV contains correct data
- Verify all filters applied to export
```

### 2.3 Quiz Creation Workflow

#### **Create Quiz**
**File:** `client/src/pages/QuizBuilderPage.jsx`  
**Firebase:** `client/src/firebase/quizzes.js`

**Test Cases:**
```javascript
// TC-QUIZ-001: Create Basic Quiz
- Login as instructor/admin
- Navigate to /quiz-builder
- Enter quiz title (EN/AR)
- Enter description
- Select quiz type (multiple_choice, etc.)
- Add questions:
  - Add question text
  - Add options (mark correct answer)
  - Set points
  - Set time limit (optional)
- Configure settings:
  - Time limit
  - Allow retake
  - Show correct answers
  - Randomize order
- Assign to class(es)
- Set deadline (optional)
- Save quiz
- Verify quiz created in Firestore
- Verify redirect to quiz management

// TC-QUIZ-002: Create Quiz with All Question Types
- Create quiz with:
  - Multiple choice
  - True/False
  - Short answer
  - Essay
  - Matching
  - Fill in the blank
  - Ordering
  - Image-based questions
- Verify all question types saved correctly
- Verify preview shows all types

// TC-QUIZ-003: Quiz Settings Configuration
- Create quiz
- Configure all settings:
  - Time limit (per quiz and per question)
  - Shuffle questions
  - Shuffle options
  - Show correct answers
  - Allow retake
  - Show leaderboard
  - Proctoring settings
- Save
- Verify settings persisted
- Verify settings applied when taking quiz

// TC-QUIZ-004: Quiz Assignment
- Create quiz
- Assign to multiple classes
- Set deadline
- Enable "Notify Students"
- Save
- Verify quiz assigned to classes
- Verify notifications sent (check Firestore)
- Verify students see quiz in their list
```

#### **Quiz Management**
**File:** `client/src/pages/QuizManagementPage.jsx`

**Test Cases:**
```javascript
// TC-QUIZ-005: View Quiz List
- Login as instructor/admin
- Navigate to /quiz-management
- Verify all quizzes listed
- Verify creator name displayed (not raw email)
- Verify quiz metadata (questions, attempts, avg score)
- Filter by search term
- Sort by date/name

// TC-QUIZ-006: Edit Quiz
- Select quiz from list
- Click "Edit"
- Modify questions/settings
- Save
- Verify changes saved
- Verify version history (if implemented)

// TC-QUIZ-007: Delete Quiz
- Select quiz
- Click "Delete"
- Confirm deletion
- Verify quiz deleted from Firestore
- Verify related submissions handled (archived/deleted)
- Verify success message
```

### 2.4 Quiz Taking Workflow

#### **Student Takes Quiz**
**File:** `client/src/pages/StudentQuizPage.jsx`

**Test Cases:**
```javascript
// TC-QUIZ-008: Start Quiz
- Login as student
- Navigate to quiz (via link or list)
- View quiz info (title, questions, time limit)
- Click "Start Quiz"
- Verify quiz started
- Verify timer started (if time limit set)
- Verify questions displayed
- Verify navigation controls visible

// TC-QUIZ-009: Answer Questions
- Start quiz
- Answer each question:
  - Multiple choice: Select option
  - True/False: Select true/false
  - Short answer: Type answer
  - Essay: Type long answer
- Mark questions for review
- Navigate between questions
- Verify answers saved (check localStorage/Firestore)
- Verify "Marked for Review" indicator

// TC-QUIZ-010: Quiz Timer
- Start quiz with time limit
- Verify timer counts down
- Verify warning at 5 minutes remaining
- Verify warning at 1 minute remaining
- Verify auto-submit when time expires
- Verify cannot continue after time expires

// TC-QUIZ-011: Submit Quiz
- Complete all questions
- Click "Submit Quiz"
- Confirm submission
- Verify answers submitted to Firestore
- Verify score calculated
- Verify redirect to results page
- Verify results displayed correctly

// TC-QUIZ-012: Quiz Retake
- View quiz results
- If retake allowed: Verify "Retake" button
- Click "Retake"
- Verify new attempt started
- Verify previous attempt preserved
- Verify best score tracked

// TC-QUIZ-013: Quiz Randomization
- Start quiz with shuffle enabled
- Verify question order randomized
- Verify option order randomized (if enabled)
- Verify randomization consistent per user (seed-based)
- Verify different users see different orders

// TC-QUIZ-014: Resume Quiz (Unlimited Time)
- Start quiz with unlimited time
- Close browser/tab
- Reopen and navigate to quiz
- Verify can resume from last question
- Verify previous answers loaded
```

### 2.5 Notification System Workflow

#### **Real-Time Notifications**
**Files:**
- `client/src/hooks/useNotifications.js`
- `client/src/firebase/notifications.js`
- `client/src/components/NotificationBell.jsx`
- `client/src/components/NotificationDrawer.jsx`

**Test Cases:**
```javascript
// TC-NOTIF-001: Notification Delivery
- Login as student
- Trigger notification (quiz assigned, grade released, etc.)
- Verify notification appears in bell icon
- Verify unread count updates
- Verify notification sound plays (if enabled)
- Verify notification vibration (mobile, if enabled)

// TC-NOTIF-002: Notification Types
- Test all notification types:
  - System notifications
  - Quiz notifications (assigned, graded, deadline)
  - Attendance notifications
  - Activity notifications
  - Grade notifications
  - Chat mentions
- Verify each type displays correctly
- Verify icons/colors differentiate types

// TC-NOTIF-003: Notification Drawer
- Click notification bell
- Verify drawer opens
- Verify all notifications listed
- Verify unread/read status
- Verify filters work (type, date, class)
- Verify can mark as read
- Verify can archive
- Verify can delete

// TC-NOTIF-004: Notification Navigation
- Click notification
- Verify navigates to relevant page:
  - Quiz notification → Quiz page
  - Grade notification → Results page
  - Attendance notification → Attendance page
- Verify notification marked as read
- Verify drawer closes

// TC-NOTIF-005: Real-Time Updates
- Open notification drawer
- Trigger new notification (from another user/action)
- Verify notification appears in real-time
- Verify no page refresh needed
- Verify unread count updates immediately

// TC-NOTIF-006: Notification Edge Cases
- Test with 100+ notifications (performance)
- Test with notifications from multiple classes
- Test with expired notifications
- Test notification delivery when offline (queue)
- Test notification delivery when online (sync)
```

### 2.6 Dashboard Analytics Workflow

#### **Admin Dashboard**
**File:** `client/src/pages/DashboardPage.jsx`

**Test Cases:**
```javascript
// TC-DASH-001: Dashboard Overview
- Login as admin
- Navigate to /dashboard
- Verify KPI cards displayed:
  - Total Users
  - Total Classes
  - Total Quizzes
  - Active Sessions
- Verify charts load
- Verify data is current

// TC-DASH-002: User Management Tab
- Navigate to Users tab
- Verify user list displayed
- Search users by name/email
- Filter by role
- Create new user
- Edit user (role, status)
- Delete user (with confirmation)
- Verify changes saved

// TC-DASH-003: Analytics Tab
- Navigate to Analytics tab
- Verify attendance analytics
- Verify quiz performance analytics
- Verify student progress analytics
- Filter by date range
- Filter by class
- Export reports (CSV)
- Verify charts update with filters

// TC-DASH-004: Advanced Analytics
- Navigate to /advanced-analytics
- Verify custom widgets
- Verify drag-and-drop functionality
- Verify real-time data updates
- Verify export functionality
```

#### **Student Dashboard**
**File:** `client/src/pages/StudentDashboardPage.jsx`

**Test Cases:**
```javascript
// TC-DASH-005: Student Dashboard
- Login as student
- Navigate to /student-dashboard
- Verify progress cards:
  - Completed activities
  - Average score
  - Attendance rate
  - Pending tasks
- Verify recent activity feed
- Verify upcoming deadlines
- Verify quick access to quizzes/activities
- Verify charts (progress over time)
```

---

## 3. COMPREHENSIVE TEST PLAN

### 3.1 Smoke Tests (Critical Paths)

**Priority:** CRITICAL  
**Execution Time:** ~15 minutes  
**Frequency:** Every commit/PR

**Test Suite:**
```javascript
// Smoke Test Suite
1. User can login
2. User can logout
3. Student can view dashboard
4. Instructor can create quiz
5. Student can take quiz
6. Instructor can start attendance session
7. Student can scan attendance
8. Notifications appear in real-time
9. Role-based access works
10. Mobile responsive layout loads
```

### 3.2 Regression Tests (All Features)

**Priority:** HIGH  
**Execution Time:** ~2-3 hours  
**Frequency:** Nightly, before releases

**Coverage:**
- All pages load without errors
- All CRUD operations work
- All role permissions enforced
- All workflows complete successfully
- All Material-UI components render
- All Firebase operations succeed
- All notifications delivered
- All exports generate correctly

### 3.3 Mobile Responsiveness Testing

**Devices to Test:**
- iPhone 12/13/14 (375px, 390px, 428px)
- iPhone SE (375px)
- Samsung Galaxy S21 (360px)
- iPad (768px, 1024px)
- Desktop (1920px, 1440px, 1280px)

**Test Cases:**
```javascript
// TC-MOBILE-001: Mobile Navigation
- Open app on mobile
- Verify hamburger menu appears
- Verify side drawer opens/closes
- Verify navigation works
- Verify touch targets are adequate (44x44px min)

// TC-MOBILE-002: Mobile Forms
- Test all forms on mobile:
  - Login form
  - Quiz creation form
  - Attendance form
  - Profile settings
- Verify inputs are accessible
- Verify keyboard appears correctly
- Verify form submission works

// TC-MOBILE-003: Mobile QR Scanner
- Test QR scanner on mobile
- Verify camera permission requested
- Verify camera opens
- Verify QR code detection works
- Verify works in portrait/landscape

// TC-MOBILE-004: Mobile Tables/Grids
- Test data grids on mobile
- Verify horizontal scroll works
- Verify columns are readable
- Verify filters work
- Verify export works

// TC-MOBILE-005: Mobile Charts
- Test all charts on mobile
- Verify charts resize correctly
- Verify touch interactions work
- Verify legends are readable
- Verify tooltips work
```

### 3.4 Accessibility Compliance Testing

**Standards:** WCAG 2.1 AA

**Test Cases:**
```javascript
// TC-A11Y-001: Keyboard Navigation
- Navigate entire app using only keyboard
- Verify all interactive elements focusable
- Verify focus indicators visible
- Verify tab order logical
- Verify escape closes modals

// TC-A11Y-002: Screen Reader Support
- Test with screen reader (NVDA/JAWS/VoiceOver)
- Verify all images have alt text
- Verify form labels associated
- Verify ARIA labels present
- Verify landmarks used correctly

// TC-A11Y-003: Color Contrast
- Verify text contrast meets WCAG AA (4.5:1)
- Verify interactive elements meet contrast
- Verify error states visible
- Test in dark mode

// TC-A11Y-004: Form Accessibility
- Verify all inputs have labels
- Verify error messages associated
- Verify required fields indicated
- Verify validation messages clear

// TC-A11Y-005: RTL Support
- Switch to Arabic (RTL)
- Verify layout flips correctly
- Verify text alignment correct
- Verify icons positioned correctly
- Verify navigation works
```

### 3.5 Performance & Load Testing

**Test Cases:**
```javascript
// TC-PERF-001: Page Load Performance
- Measure time to first contentful paint (FCP)
- Measure largest contentful paint (LCP)
- Measure time to interactive (TTI)
- Target: FCP < 1.5s, LCP < 2.5s, TTI < 3.5s

// TC-PERF-002: Large Data Sets
- Test with 1000+ users
- Test with 500+ quizzes
- Test with 10000+ attendance records
- Verify pagination works
- Verify filters perform well
- Verify exports complete

// TC-PERF-003: Real-Time Updates
- Test with 100+ concurrent users
- Verify notifications deliver quickly
- Verify no performance degradation
- Verify Firestore listeners efficient

// TC-PERF-004: Network Conditions
- Test on 3G (slow connection)
- Test on offline mode
- Verify offline queue works
- Verify sync when online
- Verify error handling

// TC-PERF-005: Memory Leaks
- Run app for extended period
- Monitor memory usage
- Verify no memory leaks
- Verify listeners cleaned up
```

---

## 4. SPECIFIC REQUIREMENTS

### 4.1 Notification System Edge Cases

**Test Cases:**
```javascript
// TC-NOTIF-EDGE-001: Notification Flood
- Send 50 notifications in 1 second
- Verify all delivered
- Verify UI doesn't freeze
- Verify unread count accurate

// TC-NOTIF-EDGE-002: Notification While Offline
- Go offline
- Trigger notification
- Verify notification queued
- Go online
- Verify notification delivered

// TC-NOTIF-EDGE-003: Notification Permission Denied
- Deny notification permission
- Verify app still works
- Verify in-app notifications work
- Verify no errors thrown

// TC-NOTIF-EDGE-004: Notification for Deleted Resource
- Create quiz
- Assign to student (notification sent)
- Delete quiz
- Verify notification still accessible
- Verify navigation handles gracefully

// TC-NOTIF-EDGE-005: Notification for Archived User
- Send notification to user
- Archive user
- Verify notification still accessible
- Verify user can still view (if allowed)
```

### 4.2 Role-Based Access Control Thorough Testing

**Test Matrix:**
```
Screen              | Super Admin | Admin | Instructor | HR | Student
--------------------|-------------|-------|------------|----|--------
/                   | ✅          | ✅    | ✅         | ✅ | ✅
/dashboard          | ✅          | ✅    | ❌         | ❌ | ❌
/role-access-pro    | ✅          | ❌    | ❌         | ❌ | ❌
/quiz-builder       | ✅          | ✅    | ✅         | ❌ | ❌
/quiz-management    | ✅          | ✅    | ✅         | ❌ | ❌
/attendance         | ✅          | ✅    | ✅         | ❌ | ❌
/hr-attendance      | ✅          | ✅    | ❌         | ✅ | ❌
/my-attendance      | ✅          | ✅    | ❌         | ❌ | ✅
/student-dashboard  | ✅          | ✅    | ❌         | ❌ | ✅
/analytics          | ✅          | ✅    | ✅         | ✅ | ❌
```

**Test Cases:**
```javascript
// TC-RBAC-THOROUGH-001: All Role Combinations
- Test every screen with every role
- Verify access granted/denied correctly
- Verify redirects work
- Verify error messages appropriate

// TC-RBAC-THOROUGH-002: Role Change During Session
- Login as student
- Admin changes role to instructor
- Refresh page
- Verify new permissions applied
- Verify old permissions revoked

// TC-RBAC-THOROUGH-003: Impersonation (if implemented)
- Login as admin
- Impersonate student
- Verify sees student view
- Verify can switch back
- Verify actions logged correctly
```

### 4.3 Material-UI Component Interactions

**Components to Test:**
- Button (all variants)
- Card
- Input/Select
- Modal
- DataGrid
- Tabs
- Toast
- Spinner
- Badge
- Table
- Chart

**Test Cases:**
```javascript
// TC-MUI-001: Button Interactions
- Test all button variants
- Test loading states
- Test disabled states
- Test click handlers
- Test keyboard navigation

// TC-MUI-002: Form Components
- Test Input validation
- Test Select dropdown
- Test DatePicker
- Test FileUpload
- Test form submission

// TC-MUI-003: Data Display
- Test DataGrid sorting
- Test DataGrid filtering
- Test DataGrid pagination
- Test Table interactions
- Test Chart interactions

// TC-MUI-004: Modal/Drawer
- Test modal open/close
- Test drawer open/close
- Test escape key
- Test overlay click
- Test scroll lock

// TC-MUI-005: Toast Notifications
- Test all toast types
- Test auto-dismiss
- Test stacking
- Test positioning
```

### 4.4 Firebase Authentication Scenarios

**Test Cases:**
```javascript
// TC-FIREBASE-001: Email/Password Auth
- Sign up with email/password
- Sign in with email/password
- Sign out
- Verify Firestore user doc created
- Verify auth state persisted

// TC-FIREBASE-002: Auth State Persistence
- Login
- Refresh page
- Verify still logged in
- Close browser
- Reopen browser
- Verify still logged in (if session valid)

// TC-FIREBASE-003: Auth Errors
- Test invalid email format
- Test weak password
- Test email not verified (if required)
- Test account disabled
- Verify error messages clear

// TC-FIREBASE-004: Allowlist Enforcement
- Attempt signup with non-allowlist email
- Verify blocked
- Add email to allowlist
- Attempt signup again
- Verify allowed

// TC-FIREBASE-005: Session Management
- Login
- Wait for session timeout (30 min)
- Verify auto-logout
- Verify session cleared
- Verify redirect to login
```

### 4.5 Mobile/Tablet Cross-Device Testing

**Test Matrix:**
```
Feature              | Mobile | Tablet | Desktop
---------------------|--------|--------|----------
Login                | ✅     | ✅     | ✅
Dashboard            | ✅     | ✅     | ✅
Quiz Taking          | ✅     | ✅     | ✅
QR Scanner           | ✅     | ✅     | N/A
Attendance           | ✅     | ✅     | ✅
Chat                 | ✅     | ✅     | ✅
Notifications        | ✅     | ✅     | ✅
Analytics            | ✅     | ✅     | ✅
```

**Test Cases:**
```javascript
// TC-CROSS-001: Responsive Layout
- Test all pages on mobile (375px)
- Test all pages on tablet (768px)
- Test all pages on desktop (1920px)
- Verify layout adapts correctly
- Verify no horizontal scroll (unless intended)

// TC-CROSS-002: Touch Interactions
- Test all buttons on touch devices
- Verify touch targets adequate
- Test swipe gestures (if implemented)
- Test pinch zoom (if applicable)

// TC-CROSS-003: Camera Access (Mobile)
- Test QR scanner on mobile
- Test camera permission flow
- Test camera switching (front/back)
- Test camera in different orientations

// TC-CROSS-004: Performance Across Devices
- Measure load times on mobile
- Measure load times on tablet
- Measure load times on desktop
- Verify acceptable on all devices
```

---

## 5. TEST CASES WITH PAGE OBJECTS

### 5.1 Page Object Model Structure

```
tests/e2e/
├── pages/
│   ├── LoginPage.js
│   ├── DashboardPage.js
│   ├── QuizBuilderPage.js
│   ├── StudentQuizPage.js
│   ├── AttendancePage.js
│   ├── StudentAttendancePage.js
│   ├── NotificationDrawer.js
│   └── ...
├── fixtures/
│   ├── users.js
│   ├── quizzes.js
│   └── testData.js
├── utils/
│   ├── auth.js
│   ├── firebase.js
│   └── helpers.js
└── specs/
    ├── auth.spec.js
    ├── rbac.spec.js
    ├── quiz.spec.js
    ├── attendance.spec.js
    ├── notifications.spec.js
    └── ...
```

### 5.2 Example Page Objects

#### **LoginPage.js**
```javascript
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.signUpLink = page.locator('a[href*="signup"]');
    this.forgotPasswordLink = page.locator('a[href*="forgot"]');
    this.errorMessage = page.locator('.error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async waitForRedirect() {
    await this.page.waitForURL(/.*(dashboard|home|profile).*/i);
  }
}
```

#### **QuizBuilderPage.js**
```javascript
export class QuizBuilderPage {
  constructor(page) {
    this.page = page;
    this.titleInput = page.locator('input[name="title"]');
    this.descriptionInput = page.locator('textarea[name="description"]');
    this.addQuestionButton = page.locator('button:has-text("Add Question")');
    this.saveButton = page.locator('button:has-text("Save Quiz")');
    this.questionTypeSelect = page.locator('select[name="questionType"]');
  }

  async goto() {
    await this.page.goto('/quiz-builder');
  }

  async createQuiz(title, description) {
    await this.titleInput.fill(title);
    await this.descriptionInput.fill(description);
  }

  async addQuestion(type, questionText, options) {
    await this.addQuestionButton.click();
    await this.questionTypeSelect.selectOption(type);
    // ... add question details
  }

  async saveQuiz() {
    await this.saveButton.click();
    await this.page.waitForSelector('.success-message');
  }
}
```

#### **StudentAttendancePage.js**
```javascript
export class StudentAttendancePage {
  constructor(page) {
    this.page = page;
    this.cameraContainer = page.locator('#qr-reader-container');
    this.manualCodeInput = page.locator('input[name="manualCode"]');
    this.submitButton = page.locator('button:has-text("Submit")');
    this.statusSelect = page.locator('select[name="status"]');
    this.reasonSelect = page.locator('select[name="reason"]');
  }

  async goto() {
    await this.page.goto('/my-attendance');
  }

  async enterManualCode(code, status = 'present', reason = null) {
    await this.manualCodeInput.fill(code);
    await this.statusSelect.selectOption(status);
    if (status === 'leave' && reason) {
      await this.reasonSelect.selectOption(reason);
    }
    await this.submitButton.click();
  }

  async waitForSuccess() {
    await this.page.waitForSelector('.toast-success');
  }
}
```

### 5.3 Example Test Specs

#### **auth.spec.js**
```javascript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testUsers } from '../fixtures/users';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.admin.email, testUsers.admin.password);
    await loginPage.waitForRedirect();
    await expect(page).toHaveURL(/.*(dashboard|home).*/i);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('invalid@email.com', 'wrongpassword');
    await expect(loginPage.errorMessage).toBeVisible();
  });
});
```

#### **rbac.spec.js**
```javascript
import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/users';
import { loginAs } from '../utils/auth';

test.describe('Role-Based Access Control', () => {
  test('super admin can access role access pro', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.goto('/role-access-pro');
    await expect(page).toHaveURL('/role-access-pro');
  });

  test('admin cannot access role access pro', async ({ page }) => {
    await loginAs(page, testUsers.admin);
    await page.goto('/role-access-pro');
    await expect(page).not.toHaveURL('/role-access-pro');
  });

  test('student cannot access dashboard', async ({ page }) => {
    await loginAs(page, testUsers.student);
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL('/dashboard');
  });
});
```

---

## 6. PRIORITY MATRIX

### 6.1 Test Priority Levels

#### **CRITICAL (P0)**
- Authentication flows
- Role-based access control
- Quiz creation and taking
- Attendance scanning
- Payment processing (if applicable)
- Data security

**Execution:** Every commit, blocking

#### **HIGH (P1)**
- Notification system
- Dashboard analytics
- User management
- Quiz management
- Attendance management
- Export functionality

**Execution:** Every PR, nightly

#### **MEDIUM (P2)**
- Mobile responsiveness
- Accessibility compliance
- Performance optimization
- Advanced features
- Edge cases

**Execution:** Weekly, before releases

#### **LOW (P3)**
- UI polish
- Non-critical features
- Nice-to-have functionality
- Documentation

**Execution:** Monthly, as needed

### 6.2 Priority Matrix Table

| Feature | Priority | Frequency | Execution Time |
|---------|----------|-----------|----------------|
| Login/Logout | P0 | Every commit | 2 min |
| Role Access | P0 | Every commit | 5 min |
| Quiz Creation | P0 | Every PR | 10 min |
| Quiz Taking | P0 | Every PR | 15 min |
| Attendance Scan | P0 | Every PR | 10 min |
| Notifications | P1 | Nightly | 20 min |
| Dashboard | P1 | Nightly | 15 min |
| Mobile Tests | P2 | Weekly | 30 min |
| A11y Tests | P2 | Weekly | 20 min |
| Performance | P2 | Weekly | 15 min |

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1-2)
**Goal:** Set up testing infrastructure and critical path tests

**Tasks:**
1. ✅ Set up Playwright configuration
2. ✅ Create page object structure
3. ✅ Create test fixtures (users, data)
4. ✅ Implement authentication helpers
5. ✅ Write smoke tests (10 tests)
6. ✅ Set up CI/CD pipeline (basic)

**Deliverables:**
- Working test framework
- 10 smoke tests passing
- CI/CD running on commits

### Phase 2: Core Features (Week 3-4)
**Goal:** Test all critical workflows

**Tasks:**
1. Write authentication test suite (15 tests)
2. Write RBAC test suite (20 tests)
3. Write quiz workflow tests (25 tests)
4. Write attendance workflow tests (15 tests)
5. Write notification tests (10 tests)

**Deliverables:**
- 85 core feature tests
- All P0 tests passing
- Test coverage: 60%+

### Phase 3: Comprehensive Coverage (Week 5-6)
**Goal:** Complete test coverage for all features

**Tasks:**
1. Write dashboard tests (15 tests)
2. Write user management tests (10 tests)
3. Write analytics tests (10 tests)
4. Write mobile responsiveness tests (20 tests)
5. Write accessibility tests (15 tests)

**Deliverables:**
- 155 total tests
- Test coverage: 80%+
- All P0 and P1 tests passing

### Phase 4: Advanced & Edge Cases (Week 7-8)
**Goal:** Test edge cases and advanced scenarios

**Tasks:**
1. Write notification edge case tests (10 tests)
2. Write performance tests (10 tests)
3. Write load tests (5 tests)
4. Write cross-device tests (15 tests)
5. Write error handling tests (10 tests)

**Deliverables:**
- 205 total tests
- Test coverage: 90%+
- All priority tests passing
- Performance benchmarks established

### Phase 5: Maintenance & Optimization (Ongoing)
**Goal:** Maintain and improve test suite

**Tasks:**
1. Review and refactor tests monthly
2. Update tests for new features
3. Optimize test execution time
4. Add visual regression tests (optional)
5. Add API contract tests (optional)

---

## 8. TEST DATA MANAGEMENT STRATEGY

### 8.1 Test Data Structure

```
fixtures/
├── users.js          # Test user accounts
├── quizzes.js        # Sample quiz data
├── classes.js        # Sample class data
├── attendance.js     # Sample attendance data
└── testData.js       # General test data
```

### 8.2 Test Users

```javascript
// fixtures/users.js
export const testUsers = {
  superAdmin: {
    email: 'superadmin@test.com',
    password: 'Test123!@#',
    role: 'superAdmin',
    uid: 'test-superadmin-uid'
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123!@#',
    role: 'admin',
    uid: 'test-admin-uid'
  },
  instructor: {
    email: 'instructor@test.com',
    password: 'Test123!@#',
    role: 'instructor',
    uid: 'test-instructor-uid'
  },
  hr: {
    email: 'hr@test.com',
    password: 'Test123!@#',
    role: 'hr',
    uid: 'test-hr-uid'
  },
  student: {
    email: 'student@test.com',
    password: 'Test123!@#',
    role: 'student',
    uid: 'test-student-uid'
  }
};
```

### 8.3 Test Data Management Approaches

#### **Option 1: Seed Data (Recommended)**
- Pre-populate Firestore with test data
- Use Firebase emulator for isolation
- Reset data before each test run
- Fast and reliable

**Implementation:**
```javascript
// utils/seedData.js
export async function seedTestData() {
  // Create test users
  // Create test classes
  // Create test quizzes
  // Create test attendance sessions
}

export async function cleanupTestData() {
  // Delete all test data
}
```

#### **Option 2: Dynamic Data Creation**
- Create data on-the-fly during tests
- Clean up after each test
- More flexible but slower

**Implementation:**
```javascript
// utils/testHelpers.js
export async function createTestQuiz(page, quizData) {
  // Create quiz via UI or API
  // Return quiz ID
}

export async function deleteTestQuiz(page, quizId) {
  // Delete quiz
}
```

#### **Option 3: Fixture Data with Cleanup**
- Use predefined fixtures
- Clean up after test suite
- Balance between speed and flexibility

### 8.4 Data Isolation Strategy

**Per-Test Isolation:**
- Each test creates its own data
- Cleanup after each test
- Prevents test interference
- Slower execution

**Per-Suite Isolation:**
- Create data once per suite
- Cleanup after suite
- Faster execution
- Risk of interference

**Recommended:** Hybrid approach
- Critical tests: Per-test isolation
- Non-critical tests: Per-suite isolation

### 8.5 Test Data Cleanup

```javascript
// utils/cleanup.js
export async function cleanupAfterTest(testName) {
  // Delete test-specific data
  // Use test name as prefix for data
  // Clean up Firestore collections
  // Clean up Firebase Storage (if used)
}

export async function cleanupAfterSuite() {
  // Delete all test data
  // Reset test users
  // Clear test sessions
}
```

---

## 9. CI/CD INTEGRATION RECOMMENDATIONS

### 9.1 GitHub Actions Workflow

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start Firebase Emulator
        run: |
          npm install -g firebase-tools
          firebase emulators:start --detach
      
      - name: Seed test data
        run: npm run seed:test-data
      
      - name: Run smoke tests
        run: npx playwright test --grep "@smoke"
        env:
          BASE_URL: http://localhost:3000
          TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
      
      - name: Run critical tests
        if: github.event_name == 'pull_request'
        run: npx playwright test --grep "@critical"
      
      - name: Run full test suite
        if: github.ref == 'refs/heads/main'
        run: npx playwright test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
      
      - name: Cleanup
        if: always()
        run: |
          firebase emulators:exec --only firestore "echo 'Cleanup complete'"
```

### 9.2 Test Execution Strategy

#### **On Every Commit:**
- Run smoke tests (10 tests, ~5 minutes)
- Fast feedback
- Block merge if fails

#### **On Pull Request:**
- Run smoke tests
- Run critical tests (P0, ~30 minutes)
- Block merge if fails
- Post results as PR comment

#### **On Merge to Main:**
- Run full test suite (~2-3 hours)
- Generate coverage report
- Post results to Slack/email

#### **Nightly:**
- Run full regression suite
- Run performance tests
- Generate test reports
- Alert on failures

### 9.3 Test Parallelization

```javascript
// playwright.config.js
export default defineConfig({
  workers: process.env.CI ? 4 : 2, // Parallel workers
  fullyParallel: true, // Run tests in parallel
  projects: [
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
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
```

### 9.4 Test Reporting

**Recommended Tools:**
- Playwright HTML Report (built-in)
- Allure Report (advanced)
- TestRail (test management)
- GitHub Actions annotations

**Report Structure:**
```
Test Results
├── Summary (pass/fail counts)
├── Test Execution Time
├── Screenshots (on failure)
├── Videos (on failure)
├── Traces (on failure)
└── Coverage Report
```

### 9.5 Environment Configuration

```javascript
// .env.test
BASE_URL=http://localhost:3000
FIREBASE_EMULATOR_HOST=localhost:8080
TEST_USERNAME=test@example.com
TEST_PASSWORD=Test123!@#
TEST_ENV=test

// playwright.config.js
use: {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  storageState: 'storageState.json',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'retain-on-failure',
}
```

---

## 10. TEST MAINTENANCE GUIDELINES

### 10.1 Test Naming Conventions

```javascript
// Good
test('TC-AUTH-001: User can login with valid credentials', ...)
test('TC-QUIZ-005: Instructor can create quiz with multiple questions', ...)

// Bad
test('login test', ...)
test('quiz test 1', ...)
```

### 10.2 Test Organization

```javascript
test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('should login successfully', ...);
    test('should show error for invalid credentials', ...);
  });
  
  test.describe('Logout', () => {
    test('should logout successfully', ...);
  });
});
```

### 10.3 Test Documentation

- Each test should have clear description
- Document test data requirements
- Document expected behavior
- Document known issues/limitations

### 10.4 Test Review Checklist

- [ ] Test name is descriptive
- [ ] Test is isolated (no dependencies)
- [ ] Test cleans up after itself
- [ ] Test uses page objects
- [ ] Test has proper assertions
- [ ] Test handles errors gracefully
- [ ] Test is maintainable

---

## 11. METRICS & SUCCESS CRITERIA

### 11.1 Test Coverage Goals

- **Critical Paths:** 100%
- **Core Features:** 90%+
- **All Features:** 80%+
- **Edge Cases:** 70%+

### 11.2 Quality Metrics

- **Test Pass Rate:** >95%
- **Test Execution Time:** <3 hours (full suite)
- **Flaky Test Rate:** <2%
- **Test Maintenance Time:** <10% of dev time

### 11.3 Success Criteria

✅ All P0 tests passing  
✅ All P1 tests passing  
✅ Test coverage >80%  
✅ CI/CD integrated  
✅ Tests run on every PR  
✅ Test execution time <3 hours  
✅ Flaky test rate <2%  

---

## 12. NEXT STEPS

### Immediate Actions (Week 1)
1. Review and approve this strategy
2. Set up Playwright configuration
3. Create page object structure
4. Write first 10 smoke tests
5. Set up basic CI/CD

### Short-Term (Month 1)
1. Complete Phase 1 & 2
2. Write all critical tests
3. Integrate with CI/CD
4. Establish test data management

### Long-Term (Quarter 1)
1. Complete all phases
2. Achieve 90%+ coverage
3. Optimize test execution
4. Establish maintenance process

---

## APPENDIX

### A. Test Environment Setup

```bash
# Install dependencies
npm install --save-dev @playwright/test

# Install Playwright browsers
npx playwright install

# Run tests
npx playwright test

# Run tests in UI mode
npx playwright test --ui

# Generate test report
npx playwright show-report
```

### B. Useful Commands

```bash
# Run specific test
npx playwright test auth.spec.js

# Run tests matching pattern
npx playwright test --grep "@smoke"

# Run in headed mode
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Update snapshots
npx playwright test --update-snapshots
```

### C. Resources

- [Playwright Documentation](https://playwright.dev/)
- [Firebase Emulator](https://firebase.google.com/docs/emulator-suite)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Test Data Management Best Practices](https://martinfowler.com/articles/nonDeterminism.html)

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026  
**Maintained By:** QA Team  
**Review Frequency:** Monthly
