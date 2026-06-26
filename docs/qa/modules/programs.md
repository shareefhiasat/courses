# Programs Module

## Business Context
Programs are the top-level organizational unit in the Military LMS. Each program contains subjects, classes, enrollments, and has associated instructors and classrooms. Programs are the primary scope for admin access control.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/programs` | List (paginated) | all authenticated |
| GET | `/api/v1/programs/:id` | Get by ID | all authenticated |
| POST | `/api/v1/programs` | Create | super_admin, admin |
| PUT | `/api/v1/programs/:id` | Update | super_admin, admin |
| DELETE | `/api/v1/programs/:id` | Soft delete | super_admin |
| DELETE | `/api/v1/programs/:id/hard` | Hard delete | super_admin |

## UI Pages
- `/programs` — ProgramsManagementPage

## Business Rules
- Program code must be unique
- Programs support Arabic and English names
- Soft delete preserves data integrity (referenced by subjects, classes)
- Hard delete permanently removes
- Pagination with search by name/code
- Active/inactive status

## Test Coverage
- **API tests**: `specs/programs-api.spec.js` — 13 tests
- **UI tests**: `specs/programs.ui.spec.js` — existing tests
- **Test IDs**: TC-PROG-001 through TC-PROG-020

## Known Issues
None discovered yet.

## Related Modules
- `module:subjects` — Subjects belong to programs
- `module:classes` — Classes belong to programs
- `module:enrollments` — Enrollments link to programs
- `module:admin-scopes` — Programs used for scope filtering
