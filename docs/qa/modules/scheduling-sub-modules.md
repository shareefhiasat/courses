# Scheduling Sub-Modules

## Time Slots (`module:time-slots`)
Define schedulable time periods per program (e.g., 08:00-09:30).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/time-slots` | List |
| GET | `/api/v1/time-slots/schedulable` | Schedulable only |
| GET | `/api/v1/time-slots/program/:programId` | By program |
| POST | `/api/v1/time-slots/bulk-init` | Bulk initialize |
| POST | `/api/v1/time-slots` | Create |

## Holidays (`module:holidays`)
Manage holiday calendar per program.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/holidays` | List |
| GET | `/api/v1/holidays/upcoming` | Upcoming |
| GET | `/api/v1/holidays/program/:programId` | By program |
| POST | `/api/v1/holidays` | Create |

## Teacher Availability (`module:teacher-availability`)
Track instructor availability by day/time.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/teacher-availability` | List |
| GET | `/api/v1/teacher-availability/available` | Available for date |
| GET | `/api/v1/teacher-availability/user/:userId` | By user |
| POST | `/api/v1/teacher-availability` | Create |

## Schedule Sessions (`module:schedule-sessions`)
Book class sessions in classrooms with time slots.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/schedule-sessions` | List |
| GET | `/api/v1/schedule-sessions/range` | By date range |
| POST | `/api/v1/schedule-sessions/check-conflicts` | Conflict check |
| POST | `/api/v1/schedule-sessions/bulk` | Bulk create |

## Scheduling Summary (`module:scheduling-summary`)
Dashboard with workload, utilization, and effort reports.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/scheduling/summary` | Summary |
| GET | `/api/v1/scheduling/summary/break-sessions` | Break sessions |
| GET | `/api/v1/scheduling/summary/holidays` | Holidays |
| GET | `/api/v1/scheduling/summary/teacher-workload` | Teacher workload |
| GET | `/api/v1/scheduling/summary/classroom-utilization` | Classroom utilization |
| GET | `/api/v1/scheduling/effort-report` | Effort report |
| GET | `/api/v1/scheduling/break-sessions` | Break sessions list |

## Test Coverage
- **API tests**: `specs/scheduling-api.spec.js` — 20 tests across all sub-modules
- **Test IDs**: TC-TS-*, TC-HOL-*, TC-TA-*, TC-SS-*, TC-SSUM-*

## Known Issues
None discovered yet.
