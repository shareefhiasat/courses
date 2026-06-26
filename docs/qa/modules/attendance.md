# Attendance Module

## Business Context
Attendance is a **core daily operation** for instructors and HR in the military training environment. Students are marked present/absent/late per class session. HR uses attendance data for compliance reporting. Attendance records feed into penalty calculations and weekly summaries.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/attendance` | List all attendance | super_admin, admin, hr, instructor |
| GET | `/api/v1/attendance/stats` | Class attendance stats | super_admin, admin, hr, instructor |
| GET | `/api/v1/attendance/:id` | Get by ID | super_admin, admin, hr, instructor |
| POST | `/api/v1/attendance` | Create attendance | instructor, admin, super_admin |
| PUT | `/api/v1/attendance/:id` | Update attendance | instructor, admin, super_admin |
| DELETE | `/api/v1/attendance/:id` | Delete attendance | admin, super_admin |

## UI Pages
- `/attendance` — AttendancePage (instructors mark attendance)
- `/hr-attendance` — HRAttendancePage (HR views all programs)

## Business Rules
- Students can only view their own attendance
- Instructors can mark attendance for their classes only
- HR can view attendance across all programs
- Attendance status: `present`, `absent`, `late`, `excused`
- QR scanner can mark attendance (standup attendance)
- Attendance amendments require approval workflow

## Test Coverage
- **API tests**: `specs/attendance-api.spec.js` — 10 tests
- **Test IDs**: TC-ATT-001 through TC-ATT-020
- **RBAC tests**: Student cannot create, instructor can create, HR can view all

## Known Issues
None discovered yet.

## Related Modules
- `module:standup-attendance` — QR-based daily standup
- `module:attendance-amendment` — Correction workflow
- `module:penalties` — Attendance affects penalties
- `module:weekly-summary` — Attendance in weekly reports
