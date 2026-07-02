---
title: Attendance
tags: [attendance, qr, check-in, hr]
route: /attendance
order: 20
keywords: [attendance, QR scanner, check-in, HR attendance, bulk attendance, present, absent, late, excused, session, penalties, participation, export, standup, late mode, export and submit, session start, session end, official report, daily official, attendance official, violations, behavioral, penalty, export drawer, export history, date range, Smart Drive, message instructor, voice message, standup mode, regular mode, PDF, Excel, format picker, serial number, watermark, deduction]
---

# Attendance

The Attendance screen allows instructors and HR staff to take, review, and export attendance records. It supports two attendance modes — **regular** (classroom) and **standup** (morning roll-call) — and includes a QR scanner for fast check-in. Attendance data feeds into penalties, participation scores, and workflow approval documents. The screen also provides official report generation (PDF/Excel), behavioral and penalty exports with date range selection, an export history drawer for managing all past exports, and a quick-action to message the class instructor.

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

Used for morning standup formations. Statuses are prefixed with `STANDUP_`. Standup mode operates at the **program level** — you select a program instead of a specific class. Standup attendance uses a separate API endpoint (`/standup-attendance`) and does not interfere with regular classroom records.

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
- **Message class instructor** — Admin, HR, and Super Admin can message the selected class's instructor directly from the attendance screen. Click the message button to open a [Chat](/en/chat) direct message in a new tab. The button only appears when an instructor is assigned to the selected class.

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
- **Penalty export** — Export penalty records generated from attendance violations. Logged as `penalty` export type.

All exports are automatically saved to [Smart Drive](/en/smart-drive) → Exported Files and logged in the export history drawer.

### Official reports

The system generates formal official reports with serial numbers, watermarks, and official formatting. Two types are available:

#### Daily Official Report

Generates a formal daily attendance report for the selected class (regular mode) or program (standup mode).

- **Regular mode** — Requires a class selection. The report shows each student's number, name, attendance status marks, and notes.
- **Standup mode** — Requires a program selection. The report uses program-level data instead of class-level.
- **Format** — Choose between **PDF** and **Excel** via the format picker.
- **Serial number** — Each report receives a unique serial number via `buildDailyOfficialSerial`.
- **Watermark** — Reports include a watermark with the exporting user's name.
- **Export type** — Logged as `official` in export history.

#### Attendance Official Report (Violations)

Generates a formal violations/behavior report covering a date range. Titled "Behavior / Attendance Violation Form".

- **Date range** — Select a from-date and to-date. Defaults to the last 30 days.
- **Subject selection** — Choose which subjects to include (multi-select checkboxes).
- **Violation types** — Filter by violation type: Absent (No Excuse), Excused Leave, Late, Human Case.
- **Grouping** — Violations are grouped by student → date → violation type → subject, with deduction amounts shown per violation.
- **Format** — Choose between **PDF** and **Excel** via the format picker.
- **Serial number** — Each report receives a unique serial number via `buildViolationsOfficialSerial`.
- **Export type** — Logged as `official_attendance` in export history.

### Attendance violations & behavioral reports

The **Attendance Violations Modal** provides two modes for exporting violation data:

#### Standard mode (behavioral export)

- Exports attendance violations as an Excel file.
- Filename includes the date, year, semester (S1/S2), program name, and subject label.
- Logged as `behavioral` export type in export history.
- Saved to [Smart Drive](/en/smart-drive) → Exported Files.

#### Official mode (official report)

- Opens the format picker to choose PDF or Excel.
- Uses the `prepareAttendanceOfficialData` engine to build the formal report.
- See "Attendance Official Report" under Official Reports above.

#### Violations modal controls

| Control | Description |
| --- | --- |
| **Date from** | Start date for the report range. Defaults to 30 days before the selected date. |
| **Date to** | End date for the report range. Defaults to the selected date. |
| **Subjects** | Multi-select checkboxes for which subjects to include. |
| **Violation types** | Checkboxes for Absent (No Excuse), Excused Leave, Late, Human Case. |
| **Format picker** | PDF or Excel (official mode only). Defaults to PDF. |

Validation: at least one subject, one violation type, and a valid date range (end date ≥ start date) are required.

### Export history drawer

The **Export History Drawer** shows all past attendance and behavioral exports in one place.

- **Filter by type** — Filter exports by type: `attendance_daily`, `official`, `behavioral`, `penalty`, `summary`.
- **Filter by format** — Filter by file format: `pdf`, `excel`.
- **Grouped by user and date** — Exports are grouped by the user who generated them and the date of export.
- **File details** — Each entry shows the filename, export type, format, timestamp, and exporting user.
- **Open/download** — Click any export entry to open or download the file.
- **Smart Drive integration** — All exports are also available in [Smart Drive](/en/smart-drive) → Exported Files.

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
- **Official report prerequisites** — Daily official reports require a class (regular mode) or program (standup mode) selection. Attendance official reports require at least one subject and one violation type selected.
- **Date range validation** — For violations and official reports, the end date must be on or after the start date. The default range is 30 days.
- **Export logging** — All exports (daily, official, behavioral, penalty, summary) are logged to export history and saved to Smart Drive → Exported Files.
- **Deduction calculation** — Official violation reports show deduction amounts per violation type, calculated based on the attendance status and excuse approval status.

## Prerequisites

- A class session must exist on the [Scheduling](/en/scheduling) calendar before you can take attendance.
- You must have at least `view` permission on the `attendance` screen.
- For QR scanning, the student must have a generated QR code (issued from their [Profile](/en/profile)).
- For HR bulk attendance, you need `HR` or `Admin` role and access to the `hr-attendance` screen.
- For export and submit, the [Workflow](/en/workflow) system must be configured to accept `ATTENDANCE_DAILY` document types.
- For official reports, the selected class (regular) or program (standup) must have attendance data for the chosen date.
- For behavioral and official violation reports, at least one subject and one violation type must be selected, and a valid date range must be provided.

## Limitations

- The QR scanner requires camera access. If the browser blocks camera permissions, manual input is the fallback.
- Bulk HR attendance cannot be undone in a single action — each record must be edited individually.
- Attendance export is limited to 10,000 records per request. For larger exports, narrow the date range.
- Late mode applies to the entire class session — it cannot be toggled per student.
- Standup attendance statuses are not interchangeable with regular attendance statuses.
- Official reports in standup mode require a program selection — you cannot generate a daily official report for a single class in standup mode.
- Export history is limited to exports made within the current academic year. Older exports are available in [Smart Drive](/en/smart-drive) → Exported Files.
- The message instructor button is only available to Admin, HR, and Super Admin roles, and only when an instructor is assigned to the selected class.

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
| Official report button is disabled | Ensure a class (regular mode) or program (standup mode) is selected. The report requires attendance data for the selected date. |
| Violations modal shows no data | Check the date range — there may be no attendance records in the selected period. Try widening the date range. |
| Export history drawer is empty | No exports have been made yet. Generate an export first, then check the drawer. |
| Cannot download from export history | The file may have been moved or deleted from Smart Drive. Check Smart Drive → Exported Files directly. |
| Message instructor button not visible | The button appears only for Admin/HR/Super Admin and only when an instructor is assigned to the selected class. Verify the class has an instructor. |
| Official report PDF fails to generate | The PDF renderer may be loading. Wait a moment and retry. If the issue persists, try Excel format as a fallback. |

## Related articles

- [Dashboard](/en/dashboard) — View attendance data in the Operations tabs (Penalty, Participation).
- [Scheduling](/en/scheduling) — Sessions must exist on the calendar before attendance can be taken.
- [Notifications](/en/notifications) — Students receive alerts for absences and late marks.
- [Workflow](/en/workflow) — Export and submit creates a workflow document for HR/Admin review. Weekly summaries aggregate daily attendance documents.
- [Profile & Settings](/en/profile) — Students generate their QR codes from the profile page.
- [Smart Drive](/en/smart-drive) — All exports are automatically saved to Smart Drive → Exported Files.
- [Chat](/en/chat) — The message instructor feature opens a direct message in the chat interface.
