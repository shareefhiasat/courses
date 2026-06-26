# Remaining Modules

## Attendance Amendment (`module:attendance-amendment`)
Correction workflow for attendance records. Requires approval.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/attendance-amendment` | Create amendment |
| GET | `/api/v1/attendance-amendment/:attendanceId` | By attendance |
| GET | `/api/v1/attendance-amendment` | List all |

## Instructor History (`module:instructor-history`)
Tracks instructor class assignments and workload over time.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/instructor-history/class/:classId` | Class history |
| GET | `/api/v1/instructor-history/instructor/:instructorId` | Instructor history |
| GET | `/api/v1/instructor-history/session/:sessionId` | Session history |
| GET | `/api/v1/instructor-history/workload/:instructorId` | Workload |

## Audit Export (`module:audit-export`)
Compliance audit data export.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/audit-export/workflow-status-history` | Workflow status history |
| GET | `/api/v1/audit-export/permission-denials` | Permission denials |

## Weekly Summary (`module:weekly-summary`)
Weekly aggregate report of attendance, activities, penalties, and behaviors.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/weekly-summary/generate` | Generate weekly summary |
| GET | `/api/v1/weekly-summary/daily-documents` | Daily documents |

## Profile (`module:profile`)
User profile management (own settings).

| UI Page | Description |
|---------|-------------|
| `/profile` | ProfilePage |

## User Images (`module:user-images`)
Profile image upload and management via MinIO.

## Test Coverage
- **API tests**: `specs/misc-api.spec.js` — covers amendments, instructor history, audit, weekly summary, help
- **Test IDs**: TC-AA-*, TC-IH-*, TC-AE-*, TC-WS-*, TC-HELP-*

## Known Issues
None discovered yet.
