# User Access Module Audit

**Date:** 2026-07-03  
**Status:** Living checklist — updated during implementation

Legend: List/Detail/Write = data scope enforcement. Matrix = `requirePermission`/`screenOps` on API routes.

| Epic | Module | screenId | Routes | List | Detail | Write | Matrix | Deps | Status |
|------|--------|----------|--------|------|--------|-------|--------|------|--------|
| E0 | Permission Matrix | permission-matrix | permissions.js | N/A | N/A | N/A | super_admin PUT | — | Done |
| E0 | User Category Access | user-category-access | user-category-access.js | N/A | N/A | N/A | super_admin | — | Done |
| E0 | Users | users | users.js | partial | partial | partial | screenOps | dashboard | In progress |
| E0 | Me / data-scope | — | me.js | N/A | N/A | N/A | N/A | — | Done |
| E1 | Dashboard tabs | dashboard + tab ids | dashboard.js | varies | varies | varies | partial | dashboard.canView | In progress |
| E2 | QR Scanner | qr-scanner | attendances, standup, exportHistory | Done | Done | Done | qrScannerOps | Done | Done |
| E2 | Attendance | attendance | attendances.js | Done | Done | Done | qrScannerOps | Done | Done |
| E2 | HR Attendance | hr-attendance | — | partial | partial | partial | Missing | — | Todo |
| E2 | Export history | — | exportHistory.js | partial | partial | N/A | qrScannerOps | — | In progress |
| E3 | Summary Dashboard | summary-dashboard | scheduling.js | Done | Done | N/A | export op | Done | Done |
| E3 | Scheduling calendar | scheduling-calendar | schedule-sessions, flexible-scheduling | Done | partial | partial | Missing | — | In progress |
| E3 | Instructor availability | instructor-availability-* | instructor-availability.js | partial | partial | partial | Missing | — | Todo |
| E3 | Room availability | room-availability-* | classroom-availability.js | partial | partial | partial | Missing | — | Todo |
| E4 | Programs | programs | programs.js | Done | Done | Done | screenOps | Done | Done |
| E4 | Subjects | subjects | subjects.js | Done | Done | Done | screenOps | Done | Done |
| E4 | Classes | classes | classes.js | Done | Done | Done | screenOps | Done | Done |
| E4 | Enrollments | enrollments | enrollments.js | Done | Done | Done | screenOps | Done | Done |
| E4 | Activities | activities | activities.js | Done | partial | partial | screenOps | Done | In progress |
| E4 | Resources | resources | resources.js | Done | partial | partial | screenOps | Done | In progress |
| E4 | Quizzes | quizzes | quizzes.js | Done | partial | partial | screenOps | Done | In progress |
| E4 | Marks | marks-entry | marks.js | Done | Done | partial | screenOps | Done | In progress |
| E5 | Results pages | *-results | quizzes.js | Done | partial | N/A | partial | view | Done |
| E5 | Advanced analytics | advanced-analytics | dashboard.js | partial | partial | N/A | Missing | — | Todo |
| E5 | Scheduled reports | scheduled-reports | — | Todo | Todo | Todo | Missing | — | Todo |
| E6 | Chat | chat | chat.js | partial | partial | partial | screenOps | Done | In progress |
| E6 | Notifications | notifications | notifications.js | own | own | own | screenOps | — | In progress |
| E6 | Announcements | announcements | announcements.js | partial | partial | partial | screenOps | Done | In progress |
| E7 | Workflow engine | workflow | workflows.js | Todo | Todo | Todo | screenOps | Done | In progress |
| E7 | Workflow documents | workflow | workflow-documents.js | Todo | Todo | Todo | screenOps | Done | In progress |
| E8 | Smart Drive | drive | driveNew.js | partial | Done | partial | screenOps | Done | In progress |
| E9 | Lookup types | *-types | lookup.js | N/A | N/A | N/A | partial | dashboard | Todo |
| E10 | Student-facing | home, student-* | various | enrollment | enrollment | limited | partial | — | Done |
| E11 | Cross-cutting | — | ProtectedRoute, SideDrawer | FE | FE | FE | usePermissions | — | Done |

## Super Admin hard gates (code-only, not matrix-grantable)

- PUT `/permissions`
- All `/user-category-access/*`
- Workflow definition create (`workflowEngine.js`)
- Export history audit (all users)
- Widget assignment UI (advanced analytics)
- Programs dashboard tab

## Scope model (post Phase 1)

| Role | Data scope |
|------|------------|
| Super Admin | Unrestricted |
| HR / Admin | UCA only; empty = no data |
| Instructor | taught classes ∪ UCA |
| Student | own enrollments |
