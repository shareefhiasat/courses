---
title: Attendance
tags: [attendance, qr, check-in, hr]
route: /attendance
order: 20
---

# Attendance

The Attendance screen allows instructors and HR staff to take, review, and export attendance records. It also includes a QR scanner for fast check-in.

## Who can access

| Role | Operations | What they can do |
| --- | --- | --- |
| Super Admin | view, create, update, delete | Full attendance management |
| Admin | view, create, update, delete | Full attendance management |
| HR | view, create, update, delete | HR Attendance and bulk operations |
| Instructor | view, create, update | Take attendance for their classes |
| Student | view | View their own attendance records |

> **Screen IDs:** `attendance` (main), `hr-attendance` (HR bulk), `qr-scanner` (daily scan). Each has separate permission checks.

## Key actions

- **Take attendance** — Mark students as present, absent, late, or excused for a specific class session.
- **QR Scanner** — Open the QR scanner page to check students in by scanning their QR code. Requires `qr-scanner.canUseQRScanner` permission.
- **HR Attendance** — Bulk mark attendance for HR purposes. Accessed via the HR Attendance screen.
- **Export** — Download attendance reports as Excel or CSV. Requires `attendance.canExport` or `qr-scanner.canExport` permission.
- **Edit records** — Modify attendance status after the session. Requires `update` permission.

## Attendance statuses

| Status | Description |
| --- | --- |
| **Present** | Student attended the session. |
| **Absent** | Student did not attend. |
| **Late** | Student arrived after the start time. |
| **Excused** | Student has an approved absence. |

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
- **One record per student per session** — Each student can have only one attendance record per session. Duplicate entries are rejected.
- **Status change log** — All attendance edits are logged with the user, timestamp, and previous value for audit purposes.
- **Attendance feeds into penalties** — Absences and late arrivals can automatically generate penalty records via configured rules.
- **Attendance feeds into participation** — Present and on-time check-ins contribute to participation scores.

## Limitations

- The QR scanner requires camera access. If the browser blocks camera permissions, manual input is the fallback.
- Bulk HR attendance cannot be undone in a single action — each record must be edited individually.
- Attendance export is limited to 10,000 records per request. For larger exports, narrow the date range.

## Related articles

- [Dashboard](/en/dashboard) — View attendance data in the Operations tabs (Penalty, Participation).
- [Scheduling](/en/scheduling) — Sessions must exist on the calendar before attendance can be taken.
- [Notifications](/en/notifications) — Students receive alerts for absences and late marks.
- [Workflow](/en/workflow) — Attendance anomalies can trigger workflow approval tasks.
