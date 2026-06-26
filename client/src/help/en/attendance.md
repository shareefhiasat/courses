---
title: Attendance
tags: [attendance, qr, check-in, hr]
route: /attendance
order: 20
keywords: [attendance, QR scanner, check-in, HR attendance, bulk attendance, present, absent, late, excused, session, penalties, participation, export, standup, late mode, export and submit, session start, session end]
---

# Attendance

The Attendance screen allows instructors and HR staff to take, review, and export attendance records. It supports two attendance modes — **regular** (classroom) and **standup** (morning roll-call) — and includes a QR scanner for fast check-in. Attendance data feeds into penalties, participation scores, and workflow approval documents.

## Who can access

| Role | Operations | What they can do |
| --- | --- | --- |
| Super Admin | view, create, update, delete | Full attendance management |
| Admin | view, create, update, delete | Full attendance management |
| HR | view, create, update, delete | HR Attendance and bulk operations |
| Instructor | view, create, update | Take attendance for their classes |
| Student | view | View their own attendance records |

> **Screen IDs:** `attendance` (main), `hr-attendance` (HR bulk), `qr-scanner` (daily scan). Each has separate permission checks.

## Attendance modes

The system supports two distinct attendance modes, each with its own set of status codes:

### Regular attendance

Used for classroom sessions. Statuses are set via the main attendance screen or QR scanner.

| Status | Code | Description |
| --- | --- | --- |
| **Present** | `PRESENT` | Student attended the session. |
| **Absent (no excuse)** | `ABSENT_NO_EXCUSE` | Student did not attend and no excuse was provided. |
| **Late** | `LATE` | Student arrived after the session start time. |
| **Absent (with excuse)** | `ABSENT_WITH_EXCUSE` | Student was absent with a pre-approved excuse. |
| **Excused leave** | `EXCUSED_LEAVE` | Student was on approved leave. |
| **Human case** | `HUMAN_CASE` | Special humanitarian circumstance (admin-managed). |

### Standup attendance

Used for morning standup formations. Statuses are prefixed with `STANDUP_`.

| Status | Code | Description |
| --- | --- | --- |
| **Standup Present** | `STANDUP_PRESENT` | Present at morning standup. |
| **Standup Late** | `STANDUP_LATE` | Arrived late to standup. |
| **Standup Absent** | `STANDUP_ABSENT` | Absent from standup. |
| **Standup Clinic** | `STANDUP_CLINIC` | At the medical clinic during standup. |

## Key actions

### Taking attendance

- **Select a class** — Filter classes by program, subject, or instructor. Only classes with sessions on the current date are shown by default.
- **Select a session** — Choose a class session from the dropdown. Sessions must exist on the [Scheduling](/en/scheduling) calendar.
- **Mark students** — Click each student's status button (Present, Absent, Late, Excused). The system saves each mark individually via `markAttendance`.
- **Toggle late mode** — Switch the entire class to late-mode marking. When enabled, all unmarked students are assumed late unless explicitly marked otherwise.

### Session management

- **Start session** — Opens a new attendance session for the selected class and date. Generates a QR code for student self-check-in.
- **End session** — Closes the attendance session. No further marks can be recorded until a new session is started.
- **QR code generation** — When a session starts, a QR code is displayed. Students scan this code with their mobile device to check themselves in.

### QR Scanner

- **Open scanner** — Navigate to the QR scanner page. Requires `qr-scanner.canUseQRScanner` permission.
- **Scan student QR** — Each student has a personal QR code generated from their [Profile](/en/profile) page. Scanning it marks them as present.
- **Manual input** — If the camera is unavailable, use the manual input field to enter a student number and mark attendance. Requires `canManualInput`.
- **Bulk scan** — Scan multiple students in sequence without returning to the roster. Requires `canBulkScan`.

### HR bulk attendance

- **Bulk validate** — Enter a list of student numbers. The system validates them against the selected class enrolment via `bulkValidateStudents`. Invalid numbers are reported back.
- **Bulk upsert** — Once validated, submit the batch. The system creates or updates attendance records for all valid students via `bulkUpsertAttendance`.
- **Bulk mode** — Supports both regular and standup attendance modes. The mode is selected before validation.

### Export and submit

- **Export to Excel** — Download the current attendance data as an Excel file. Requires `attendance.canExport` or `qr-scanner.canExport`.
- **Export and submit** — Generates an Excel report and automatically creates a workflow document of type `ATTENDANCE_DAILY`, attaching the Excel file and submitting it for HR/Admin review. This bridges attendance with the [Workflow](/en/workflow) system.
- **Export summary** — Download a summarised attendance report. Requires `canExportSummary`.

### Editing records

- **Edit individual** — Click any student's status to change it. The previous value is logged for audit. Requires `update` permission.
- **Edit window** — Past attendance can be edited within a configurable time window. Dates outside this window are read-only.
- **Audit trail** — Every status change records the user, timestamp, previous status, and new status.

## QR Scanner granular permissions

The QR Scanner has its own set of granular operations:

| Operation | Description |
| --- | --- |
| `canMarkAttendance` | Mark attendance via scanner |
| `canUseQRScanner` | Access the QR scanner interface |
| `canManualInput` | Manually enter attendance without scanning |
| `canEditAttendance` | Edit today's attendance records |
| `canDeleteAttendance` | Delete attendance records |
| `canBulkScan` | Scan multiple students in sequence |
| `canExport` | Export attendance data |
| `canExportSummary` | Export a summary report |

## Validations & business rules

- **Session required** — You must select a class session before taking attendance.
- **Date validation** — Attendance can only be recorded for the current date or past dates (within an editable window). Future dates are blocked.
- **One record per student per session** — Each student can have only one attendance record per session. Duplicate entries are rejected by `markAttendance`.
- **Status mapping** — The system maps status strings (e.g. `PRESENT`) to internal status IDs via `getStatusId`. Unknown statuses are rejected.
- **Existence check** — Before inserting a new record, the system checks if one already exists for the same student, session, and date. If found, the existing record is updated instead.
- **Status change log** — All attendance edits are logged with the user, timestamp, and previous value for audit purposes.
- **Attendance feeds into penalties** — Absences and late arrivals can automatically generate penalty records via configured rules.
- **Attendance feeds into participation** — Present and on-time check-ins contribute to participation scores.
- **Standup vs regular separation** — Standup attendance uses a separate API endpoint and does not interfere with regular classroom attendance records.

## Prerequisites

- A class session must exist on the [Scheduling](/en/scheduling) calendar before you can take attendance.
- You must have at least `view` permission on the `attendance` screen.
- For QR scanning, the student must have a generated QR code (issued from their [Profile](/en/profile)).
- For HR bulk attendance, you need `HR` or `Admin` role and access to the `hr-attendance` screen.
- For export and submit, the [Workflow](/en/workflow) system must be configured to accept `ATTENDANCE_DAILY` document types.

## Limitations

- The QR scanner requires camera access. If the browser blocks camera permissions, manual input is the fallback.
- Bulk HR attendance cannot be undone in a single action — each record must be edited individually.
- Attendance export is limited to 10,000 records per request. For larger exports, narrow the date range.
- Late mode applies to the entire class session — it cannot be toggled per student.
- Standup attendance statuses are not interchangeable with regular attendance statuses.

## Troubleshooting

| Problem | Solution |
| --- | --- |
| QR scanner won't open | Check browser camera permissions. Click the camera icon in the address bar and allow access. |
| Student QR code not recognised | Ensure the student's QR code is generated from their Profile page. If expired, have them regenerate it. |
| Cannot select a session | Verify the session exists on the [Scheduling](/en/scheduling) calendar for today's date. |
| Export button is disabled | You need `canExport` permission. Contact your administrator. |
| Attendance status won't save | Check your network connection. If the issue persists, refresh the page and retry. |
| Bulk validate rejects student numbers | Ensure the student numbers match enrolled students in the selected class. Check for typos or leading zeros. |
| Export and submit fails | The Workflow system may be unavailable. Try exporting without submission, then submit manually from [Workflow](/en/workflow). |
| Late mode toggle not visible | Late mode is only available for regular attendance. Switch from standup mode to regular mode. |
| Standup statuses not appearing | Standup attendance requires a standup session on the scheduling calendar. Verify the session type is set to standup. |

## Related articles

- [Dashboard](/en/dashboard) — View attendance data in the Operations tabs (Penalty, Participation).
- [Scheduling](/en/scheduling) — Sessions must exist on the calendar before attendance can be taken.
- [Notifications](/en/notifications) — Students receive alerts for absences and late marks.
- [Workflow](/en/workflow) — Export and submit creates a workflow document for HR/Admin review.
- [Profile & Settings](/en/profile) — Students generate their QR codes from the profile page.
