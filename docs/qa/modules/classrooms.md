# Classrooms Module

## Business Context
Classrooms are physical spaces where classes are held. Each classroom has a code, name, capacity, and equipment list. Classroom availability is checked during scheduling to prevent double-booking.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/classrooms` | List | all authenticated |
| GET | `/api/v1/classrooms/available` | Available for date/time | instructor, admin, super_admin |
| GET | `/api/v1/classrooms/program/:programId` | By program | all authenticated |
| GET | `/api/v1/classrooms/:id` | Get by ID | all authenticated |
| POST | `/api/v1/classrooms` | Create | admin, super_admin |
| PUT | `/api/v1/classrooms/:id` | Update | admin, super_admin |
| DELETE | `/api/v1/classrooms/:id` | Delete | admin, super_admin |

## UI Pages
- `/scheduling-calendar` — Classrooms tab

## Business Rules
- Classroom code must be unique
- Capacity enforced during scheduling
- Availability check: date + time range
- Program association for scoped access
- Equipment tracking (projector, whiteboard, etc.)

## Test Coverage
- **API tests**: `specs/classrooms-api.spec.js` — 9 tests
- **Test IDs**: TC-CLRM-001 through TC-CLRM-007

## Known Issues
None discovered yet.

## Related Modules
- `module:scheduling` — Classroom availability for sessions
- `module:programs` — Classrooms associated with programs
