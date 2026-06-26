# Penalties Module

## Business Context
Penalties are disciplinary actions applied to students for infractions (late attendance, missing activities, behavior issues). HR and admins manage penalties. Penalty points affect student standing and weekly summaries.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/penalties` | List | super_admin, admin, hr, instructor |
| GET | `/api/v1/penalties/:id` | Get by ID | super_admin, admin, hr, instructor |
| GET | `/api/v1/penalties/student/:studentId` | By student | super_admin, admin, hr, instructor, student (own) |
| GET | `/api/v1/penalties/class/:classId` | By class | super_admin, admin, hr, instructor |
| POST | `/api/v1/penalties` | Create | super_admin, admin, hr |
| PUT | `/api/v1/penalties/:id` | Update | super_admin, admin, hr |
| DELETE | `/api/v1/penalties/:id` | Delete | super_admin, admin |

## UI Pages
- `/penalties` — PenaltiesPage

## Business Rules
- Penalty types: late, absence, behavior, dress code, other
- Points system (negative values)
- Students can view own penalties only
- HR can manage all penalties
- Instructors can view penalties for their classes
- Penalties appear in weekly summaries

## Test Coverage
- **API tests**: `specs/penalties-api.spec.js` — 9 tests
- **Test IDs**: TC-PEN-001 through TC-PEN-007

## Known Issues
None discovered yet.

## Related Modules
- `module:attendance` — Attendance infractions generate penalties
- `module:behaviors` — Behavior issues can lead to penalties
- `module:weekly-summary` — Penalties in weekly reports
- `module:lookup` — Penalty types
