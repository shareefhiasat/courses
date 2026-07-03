# Localization Audit Report — Military LMS

**Date:** 2026-06-27
**Scope:** `client/src/pages/**` + `client/src/components/**` (excluding `.stories.jsx`)
**i18n System:** `LangContext.jsx` with `useLang()` hook, `t()` function, `DICT` (en/ar)

## Executive Summary

| Category | Count | Description |
|----------|-------|-------------|
| P1 — No useLang + has hardcoded text | 30 | Zero localization, all text hardcoded |
| P2 — Has useLang but >5 hardcoded strings | 16 | Partially localized, significant gaps |
| P3 — Has useLang, 1-5 hardcoded strings | 29 | Mostly localized, minor fixes needed |
| P4 — Has useLang, 0 hardcoded strings | 173 | Fully localized |
| P5 — No useLang, no visible text | 223 | Utility/logic files, no localization needed |
| **Total** | **471** | |

## Priority 1: No useLang + Has Hardcoded Text

These files have **zero localization** — all user-visible text is hardcoded English.

| Type | File | Hardcoded Count | Samples |
|------|------|----------------|---------|
| COMP | `client/src/components/quiz/DetailedResults.jsx` | 12 | >Explanation:<; >By Topic<; >By Question Type<; >By Difficulty<; >
                Practice Incorrect Questions
              < |
| COMP | `client/src/components/ui/TimerStopwatch/TimerStopwatch.jsx` | 10 | >SW<; >
              Test
            <; >Start<; >Pause<; >Reset< |
| COMP | `client/src/components/ui/VariableHelper.jsx` | 7 | >
        Click any variable to copy it to clipboard
      <; >Click to copy<; >Use <; >En<; >Ar< |
| COMP | `client/src/components/ui/history/StudentCard.jsx` | 7 | >None<; >Present:<; >Late:<; >Absent:<; >Absent Excused:< |
| COMP | `client/src/components/drive/DriveFileGrid.jsx` | 5 | >Name<; >Creator<; >Created<; >Modified<; >Size< |
| COMP | `client/src/components/ui/LoadingProgress/LoadingProgressDemo.jsx` | 5 | >Loading Progress Demo<; >
        Test the global loading progress bar that appears at the top of the screen.
      <; >
          Manual Loading Steps
        <; >Usage Examples:<; >Load Data< |
| COMP | `client/src/components/ui/UserDeletionModal/UserDeletionModal.jsx` | 5 | >Are you sure you want to delete this user?<; >This action cannot be undone.<; >Cancel<; >
            Delete User
          <; title="Delete User" |
| PAGE | `client/src/pages/hr/weekly-summary/WeeklySummaryPage.jsx` | 4 | >Loading...<; >Access denied. HR role required.<; setError('Pl; setError('No |
| COMP | `client/src/components/security/TurnstileWidget.jsx` | 4 | >
            Retry
          <; setError('Tu; setError('Se |
| COMP | `client/src/components/ui/AttendanceFilters.jsx` | 4 | placeholder="Program"; placeholder="Subject"; placeholder="Year" |
| COMP | `client/src/components/ui/ErrorBoundary.jsx` | 4 | >
          Oops! Something went wrong
        <; >
          We encountered an unexpected error. Don't worry, this has been logged and we'll look int; >Error:<; >Stack Trace:< |
| COMP | `client/src/components/ui/Pagination/Pagination.jsx` | 4 | aria-label="First page"; aria-label="Previous page"; aria-label="Next page" |
| PAGE | `client/src/pages/communications/chat/components/ChatInput.jsx` | 3 | >
                Voice Message Ready
              <; >
              Cancel
            <; >
                  Recording
                < |
| COMP | `client/src/components/ui/DateRangePicker/DateRangePicker.jsx` | 3 | >
                  Close
                <; >
                    Clear
                  <; aria-label="Clear dates" |
| COMP | `client/src/components/ui/DateRangeSlider/DateRangeSlider.jsx` | 3 | aria-label="Clear all dates"; aria-label="Clear from date"; aria-label="Clear to date" |
| COMP | `client/src/components/ui/UrlInput/UrlInput.jsx` | 3 | title="Open in new tab"; title="Copy URL"; title="Clear" |
| COMP | `client/src/components/qr-scanner/DebugPanel.jsx` | 2 | >
          Clear
        <; >
            No logs yet...
          < |
| COMP | `client/src/components/quiz/Calculator.jsx` | 2 | >Calculator<; >AC< |
| COMP | `client/src/components/ui/FileUpload/FileUpload.jsx` | 2 | >Click to upload<; aria-label="Remove file" |
| COMP | `client/src/components/ui/SmartEmailComposer/SmartEmailComposer.jsx` | 2 | >Cancel<; >
            Send Email
          < |
| COMP | `client/src/components/ui/Breadcrumb/Breadcrumb.jsx` | 1 | aria-label="Breadcrumb" |
| COMP | `client/src/components/ui/Drawer/Drawer.jsx` | 1 | aria-label="Close drawer" |
| COMP | `client/src/components/ui/Modal/Modal.jsx` | 1 | aria-label="Close modal" |
| COMP | `client/src/components/ui/PerformedBy/PerformedBy.jsx` | 1 | >
          By:
        < |
| COMP | `client/src/components/ui/SimpleLoading/SimpleLoading.jsx` | 1 | >QAF< |
| COMP | `client/src/components/ui/Table/Table.jsx` | 1 | >Loading data...< |
| COMP | `client/src/components/ui/Tag/Tag.jsx` | 1 | aria-label="Remove tag" |
| COMP | `client/src/components/ui/Toast/Toast.jsx` | 1 | aria-label="Close notification" |
| COMP | `client/src/components/ui/attendance/AttendanceResultModal.jsx` | 1 | >
          OK
        < |
| COMP | `client/src/components/ui/history/HistoryEntry.jsx` | 1 | >Method:< |

## Priority 2: Has useLang But >5 Hardcoded Strings

These files import `useLang` but still have many hardcoded English strings mixed with `t()` calls.

| Type | File | Hardcoded Count | Samples |
|------|------|----------------|---------|
| PAGE | `client/src/pages/quizzes/QuizzesPage.jsx` | 51 | >Retake allowed<; >Shuffle questions<; >Shuffle options<; >Retake allowed<; >Shuffle questions< |
| PAGE | `client/src/pages/quizzes/QuizBuilderPage.jsx` | 32 | >No Questions to Preview<; >Add some questions to see how your quiz will look<; >
                      Add Questions
                    <; >No question text<; >No question text< |
| PAGE | `client/src/pages/feedback/reports/ScheduledReportsPage.jsx` | 24 | >Access Denied<; >You don't have permission to view this page.<; >
            Schedule Report
          <; >
            Export
          <; >Description< |
| PAGE | `client/src/pages/SchedulingCalendarPage.jsx` | 18 | >
          Access Denied
        <; >
          You need admin or HR privileges to access scheduling.
        <; >
                  Suggested Alternatives
                <; >
                Are you sure you want to delete this session?
              <; >
                Cancel
              < |
| PAGE | `client/src/pages/quizzes/quiz-results/QuizResultsPage.jsx` | 18 | >
              View Details
            <; >
                  Clear Selection
                <; >Student:<; >Quiz:<; >Current Score:< |
| PAGE | `client/src/pages/communications/chat/ChatPage.jsx` | 15 | >Not seen yet<; >Direct Messages<; >
                  Voice Message Ready
                <; >
                Cancel
              <; >
                    Recording
                  < |
| PAGE | `client/src/pages/SchedulingCalendarPageOld.jsx` | 12 | >
          Access Denied
        <; >
          You need admin or HR privileges to access scheduling.
        <; >
            Drag classes to the calendar to schedule
          <; >
                No classes found
              <; >
              Class Scheduling Calendar
            < |
| PAGE | `client/src/pages/quizzes/StudentQuizPage.jsx` | 11 | >Error<; >
                Back to Activities
              <; >
                      Start Fresh
                    <; >Quiz Completed!<; >Correct< |
| PAGE | `client/src/pages/users/StudentProfilePage.jsx` | 10 | >
            Student Not Found
          <; >Filters<; >No students found<; >
                            View Profile
                          <; >Attendance Progress< |
| PAGE | `client/src/pages/workflow/CalendarCompliancePage.jsx` | 9 | >All Programs<; >Officer<; >NCO<; >All Types<; >Daily Attendance< |
| PAGE | `client/src/pages/workflow/WorkflowAnalyticsPage.jsx` | 9 | >All Programs<; >Officer<; >NCO<; >All Types<; >Daily Attendance< |
| COMP | `client/src/components/ui/EmailLogs/EmailLogs.jsx` | 9 | >Type:<; >Subject:<; >From:<; >To:<; >Status:< |
| PAGE | `client/src/pages/UserAccessPage.jsx` | 8 | >
          Access Denied
        <; >
          You need super admin privileges to manage user category access.
        <; >Program (Optional)<; >Subject (Optional)<; >Class (Optional)< |
| PAGE | `client/src/pages/users/UsersPage.jsx` | 8 | >Reset Password:<; >Role Assignment:<; > User's role from form is automatically assigned in Keycloak
              <; >User:<; >Name:< |
| COMP | `client/src/components/academic/MarksHistoryDrawer.jsx` | 7 | >Attempt: <; >Total: <; aria-label="Close drawer"; aria-label="Close"; aria-label="Search history" |
| COMP | `client/src/components/smart-drive/FileDetailsModal.jsx` | 6 | >
                Loading preview...
              <; >
                    Your browser does not support video playback.
                  <; >Preview not available for this file type. Please download to view.<; >
                Loading editor...
              <; >Failed to load editor. Please try again.< |

## Priority 3: Has useLang, 1-5 Hardcoded Strings

These files are mostly localized with minor hardcoded strings.

| Type | File | Hardcoded Count |
|------|------|----------------|
| PAGE | `client/src/pages/operations/attendance/QRCodeDisplayPage.jsx` | 5 |
| COMP | `client/src/components/ui/EmailManager/EmailManager.jsx` | 5 |
| PAGE | `client/src/pages/system/LogsActivityPage.jsx` | 4 |
| PAGE | `client/src/pages/workflow/WorkflowInboxPage.jsx` | 4 |
| COMP | `client/src/components/quiz/FormulaSheet.jsx` | 4 |
| COMP | `client/src/components/ui/SmartGrid/SmartGrid.jsx` | 4 |
| PAGE | `client/src/pages/UserCategoryAccessPage.jsx` | 2 |
| PAGE | `client/src/pages/communications/notifications/NotificationsPage.jsx` | 2 |
| PAGE | `client/src/pages/operations/attendance/HRAttendancePage.jsx` | 2 |
| COMP | `client/src/components/drive/CollaboraModal.jsx` | 2 |
| COMP | `client/src/components/drive/DriveToolbar.jsx` | 2 |
| COMP | `client/src/components/qr-scanner/StudentActionStatsPanel.jsx` | 2 |
| COMP | `client/src/components/ui/DataGrid/DataGrid.jsx` | 2 |
| COMP | `client/src/components/ui/StudentQuickActionModal.jsx` | 2 |
| PAGE | `client/src/pages/dashboard/StudentDashboardPage.jsx` | 1 |
| PAGE | `client/src/pages/operations/attendance/StudentAttendancePage.jsx` | 1 |
| PAGE | `client/src/pages/operations/behavior/BehaviorPage.jsx` | 1 |
| PAGE | `client/src/pages/operations/participation/ParticipationPage.jsx` | 1 |
| PAGE | `client/src/pages/operations/penalty/PenaltiesPage.jsx` | 1 |
| PAGE | `client/src/pages/quizzes/QuestionBankPage.jsx` | 1 |
| COMP | `client/src/components/drive/BulkActionBar.jsx` | 1 |
| COMP | `client/src/components/games/SpinWheelGame.jsx` | 1 |
| COMP | `client/src/components/qr-scanner/QRScanner.jsx` | 1 |
| COMP | `client/src/components/quiz/ScratchPad.jsx` | 1 |
| COMP | `client/src/components/ui/EmailTemplates/EmailTemplateList.jsx` | 1 |
| COMP | `client/src/components/ui/SearchBar/SearchBar.jsx` | 1 |
| COMP | `client/src/components/ui/StudentQRCodeDisplay/StudentQRCodeDisplay.jsx` | 1 |
| COMP | `client/src/components/ui/UserSelect/UserSelect.jsx` | 1 |
| COMP | `client/src/components/ui/history/StudentTableRow.jsx` | 1 |

## Recommended Fix Plan

### Phase 1: Add useLang to P1 files (quick wins)

- [ ] **`client/src/components/quiz/DetailedResults.jsx`** — Add `useLang` import, replace 12 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/TimerStopwatch/TimerStopwatch.jsx`** — Add `useLang` import, replace 10 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/VariableHelper.jsx`** — Add `useLang` import, replace 7 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/history/StudentCard.jsx`** — Add `useLang` import, replace 7 hardcoded strings with `t()` calls
- [ ] **`client/src/components/drive/DriveFileGrid.jsx`** — Add `useLang` import, replace 5 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/LoadingProgress/LoadingProgressDemo.jsx`** — Add `useLang` import, replace 5 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/UserDeletionModal/UserDeletionModal.jsx`** — Add `useLang` import, replace 5 hardcoded strings with `t()` calls
- [ ] **`client/src/pages/hr/weekly-summary/WeeklySummaryPage.jsx`** — Add `useLang` import, replace 4 hardcoded strings with `t()` calls
- [ ] **`client/src/components/security/TurnstileWidget.jsx`** — Add `useLang` import, replace 4 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/AttendanceFilters.jsx`** — Add `useLang` import, replace 4 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/ErrorBoundary.jsx`** — Add `useLang` import, replace 4 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/Pagination/Pagination.jsx`** — Add `useLang` import, replace 4 hardcoded strings with `t()` calls
- [ ] **`client/src/pages/communications/chat/components/ChatInput.jsx`** — Add `useLang` import, replace 3 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/DateRangePicker/DateRangePicker.jsx`** — Add `useLang` import, replace 3 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/DateRangeSlider/DateRangeSlider.jsx`** — Add `useLang` import, replace 3 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/UrlInput/UrlInput.jsx`** — Add `useLang` import, replace 3 hardcoded strings with `t()` calls
- [ ] **`client/src/components/qr-scanner/DebugPanel.jsx`** — Add `useLang` import, replace 2 hardcoded strings with `t()` calls
- [ ] **`client/src/components/quiz/Calculator.jsx`** — Add `useLang` import, replace 2 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/FileUpload/FileUpload.jsx`** — Add `useLang` import, replace 2 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/SmartEmailComposer/SmartEmailComposer.jsx`** — Add `useLang` import, replace 2 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/Breadcrumb/Breadcrumb.jsx`** — Add `useLang` import, replace 1 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/Drawer/Drawer.jsx`** — Add `useLang` import, replace 1 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/Modal/Modal.jsx`** — Add `useLang` import, replace 1 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/PerformedBy/PerformedBy.jsx`** — Add `useLang` import, replace 1 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/SimpleLoading/SimpleLoading.jsx`** — Add `useLang` import, replace 1 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/Table/Table.jsx`** — Add `useLang` import, replace 1 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/Tag/Tag.jsx`** — Add `useLang` import, replace 1 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/Toast/Toast.jsx`** — Add `useLang` import, replace 1 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/attendance/AttendanceResultModal.jsx`** — Add `useLang` import, replace 1 hardcoded strings with `t()` calls
- [ ] **`client/src/components/ui/history/HistoryEntry.jsx`** — Add `useLang` import, replace 1 hardcoded strings with `t()` calls

### Phase 2: Fix P2 files (highest impact)

- [ ] **`client/src/pages/quizzes/QuizzesPage.jsx`** — Replace 51 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/pages/quizzes/QuizBuilderPage.jsx`** — Replace 32 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/pages/feedback/reports/ScheduledReportsPage.jsx`** — Replace 24 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/pages/SchedulingCalendarPage.jsx`** — Replace 18 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/pages/quizzes/quiz-results/QuizResultsPage.jsx`** — Replace 18 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/pages/communications/chat/ChatPage.jsx`** — Replace 15 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/pages/SchedulingCalendarPageOld.jsx`** — Replace 12 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/pages/quizzes/StudentQuizPage.jsx`** — Replace 11 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/pages/users/StudentProfilePage.jsx`** — Replace 10 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/pages/workflow/CalendarCompliancePage.jsx`** — Replace 9 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/pages/workflow/WorkflowAnalyticsPage.jsx`** — Replace 9 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/components/ui/EmailLogs/EmailLogs.jsx`** — Replace 9 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/pages/UserAccessPage.jsx`** — Replace 8 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/pages/users/UsersPage.jsx`** — Replace 8 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/components/academic/MarksHistoryDrawer.jsx`** — Replace 7 hardcoded strings with `t()` calls, add missing keys to DICT
- [ ] **`client/src/components/smart-drive/FileDetailsModal.jsx`** — Replace 6 hardcoded strings with `t()` calls, add missing keys to DICT

### Phase 3: Fix P3 files (polish)

- [ ] **`client/src/pages/operations/attendance/QRCodeDisplayPage.jsx`** — Replace 5 hardcoded string(s)
- [ ] **`client/src/components/ui/EmailManager/EmailManager.jsx`** — Replace 5 hardcoded string(s)
- [ ] **`client/src/pages/system/LogsActivityPage.jsx`** — Replace 4 hardcoded string(s)
- [ ] **`client/src/pages/workflow/WorkflowInboxPage.jsx`** — Replace 4 hardcoded string(s)
- [ ] **`client/src/components/quiz/FormulaSheet.jsx`** — Replace 4 hardcoded string(s)
- [ ] **`client/src/components/ui/SmartGrid/SmartGrid.jsx`** — Replace 4 hardcoded string(s)
- [ ] **`client/src/pages/UserCategoryAccessPage.jsx`** — Replace 2 hardcoded string(s)
- [ ] **`client/src/pages/communications/notifications/NotificationsPage.jsx`** — Replace 2 hardcoded string(s)
- [ ] **`client/src/pages/operations/attendance/HRAttendancePage.jsx`** — Replace 2 hardcoded string(s)
- [ ] **`client/src/components/drive/CollaboraModal.jsx`** — Replace 2 hardcoded string(s)
- [ ] **`client/src/components/drive/DriveToolbar.jsx`** — Replace 2 hardcoded string(s)
- [ ] **`client/src/components/qr-scanner/StudentActionStatsPanel.jsx`** — Replace 2 hardcoded string(s)
- [ ] **`client/src/components/ui/DataGrid/DataGrid.jsx`** — Replace 2 hardcoded string(s)
- [ ] **`client/src/components/ui/StudentQuickActionModal.jsx`** — Replace 2 hardcoded string(s)
- [ ] **`client/src/pages/dashboard/StudentDashboardPage.jsx`** — Replace 1 hardcoded string(s)
- [ ] **`client/src/pages/operations/attendance/StudentAttendancePage.jsx`** — Replace 1 hardcoded string(s)
- [ ] **`client/src/pages/operations/behavior/BehaviorPage.jsx`** — Replace 1 hardcoded string(s)
- [ ] **`client/src/pages/operations/participation/ParticipationPage.jsx`** — Replace 1 hardcoded string(s)
- [ ] **`client/src/pages/operations/penalty/PenaltiesPage.jsx`** — Replace 1 hardcoded string(s)
- [ ] **`client/src/pages/quizzes/QuestionBankPage.jsx`** — Replace 1 hardcoded string(s)
- [ ] **`client/src/components/drive/BulkActionBar.jsx`** — Replace 1 hardcoded string(s)
- [ ] **`client/src/components/games/SpinWheelGame.jsx`** — Replace 1 hardcoded string(s)
- [ ] **`client/src/components/qr-scanner/QRScanner.jsx`** — Replace 1 hardcoded string(s)
- [ ] **`client/src/components/quiz/ScratchPad.jsx`** — Replace 1 hardcoded string(s)
- [ ] **`client/src/components/ui/EmailTemplates/EmailTemplateList.jsx`** — Replace 1 hardcoded string(s)
- [ ] **`client/src/components/ui/SearchBar/SearchBar.jsx`** — Replace 1 hardcoded string(s)
- [ ] **`client/src/components/ui/StudentQRCodeDisplay/StudentQRCodeDisplay.jsx`** — Replace 1 hardcoded string(s)
- [ ] **`client/src/components/ui/UserSelect/UserSelect.jsx`** — Replace 1 hardcoded string(s)
- [ ] **`client/src/components/ui/history/StudentTableRow.jsx`** — Replace 1 hardcoded string(s)

### Phase 4: Add missing DICT keys

For each hardcoded string replaced with `t('key')`, add corresponding entries:
- `en` section: English text
- `ar` section: Arabic translation

### How to Fix (Template)

```jsx
// Before (hardcoded):
<h1>Access Denied</h1>
<p>You need admin privileges to access this page.</p>

// After (localized):
import { useLang } from '@contexts/LangContext';
const { t } = useLang();
<h1>{t('access_denied')}</h1>
<p>{t('admin_privileges_required')}</p>
```

Then add to DICT in `LangContext.jsx`:
```js
en: { access_denied: 'Access Denied', admin_privileges_required: 'You need admin privileges to access this page.' }
ar: { access_denied: 'تم رفض الوصول', admin_privileges_required: 'تحتاج إلى صلاحيات المسؤول للوصول إلى هذه الصفحة.' }
```
