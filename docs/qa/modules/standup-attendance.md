# Standup Attendance Module

## Business Context
Standup attendance is the daily morning roll call using QR codes. Students scan a QR code to mark themselves present. This is separate from class attendance and tracks daily presence at the training facility.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| POST | `/api/v1/standup-attendance` | Create (mark present) | all authenticated |
| GET | `/api/v1/standup-attendance/user/:userId/date/:date` | By user and date | super_admin, admin, hr, instructor |
| GET | `/api/v1/standup-attendance/user/:userId` | By user (all dates) | super_admin, admin, hr, instructor, student (own) |
| GET | `/api/v1/standup-attendance/class` | By class and date | super_admin, admin, hr, instructor |
| GET | `/api/v1/standup-attendance/date/:date` | By date (all) | super_admin, admin, hr |
| GET | `/api/v1/standup-attendance/program` | By program and date | super_admin, admin, hr |
| GET | `/api/v1/standup-attendance/program/range` | By program and date range | super_admin, admin, hr |

## UI Pages
- `/standup-attendance` — StandupAttendancePage
- QR code display page (public)

## Business Rules
- One standup record per user per date
- QR code generated daily with time-limited validity
- Students self-mark via QR scan
- HR can view all programs' standup
- Instructors can view their classes' standup
- Date range queries for reporting
- Feeds into weekly summary

## Test Coverage
- **API tests**: `specs/misc-api.spec.js` — 8 tests
- **Test IDs**: TC-STD-001 through TC-STD-007

## Known Issues
None discovered yet.

## Related Modules
- `module:attendance` — Class-level attendance
- `module:weekly-summary` — Daily documents feed weekly summary
- `module:audit-export` — Compliance reporting
