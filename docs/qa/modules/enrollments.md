# Enrollments Module

## Business Context
Enrollments link students to classes. Admin/HR manage enrollments. Students can only see their own enrollments. Enrollment status tracks the student's journey: active, withdrawn, completed.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/enrollments` | List all | super_admin, admin, hr |
| GET | `/api/v1/enrollments/students-by-class` | Students by class | super_admin, admin, hr, instructor |
| GET | `/api/v1/enrollments/:id` | Get by ID | super_admin, admin, hr |
| GET | `/api/v1/enrollments/student/:studentId` | By student | super_admin, admin, hr, instructor, student (own) |
| GET | `/api/v1/enrollments/class/:classId` | By class | super_admin, admin, hr, instructor |
| GET | `/api/v1/enrollments/program/:programId` | By program | super_admin, admin, hr |
| POST | `/api/v1/enrollments` | Enroll student | super_admin, admin, hr |
| PUT | `/api/v1/enrollments/:id` | Update status | super_admin, admin, hr |
| DELETE | `/api/v1/enrollments/:id` | Remove | super_admin, admin |

## UI Pages
- `/enrollments` — EnrollmentsPage

## Business Rules
- One enrollment per student per class (no duplicates)
- Status: active, withdrawn, completed, suspended
- Max capacity enforced at class level
- Students see only their own enrollments
- Instructors see enrollments for their classes
- HR can manage all enrollments

## Test Coverage
- **API tests**: `specs/enrollments-api.spec.js` — 12 tests
- **Test IDs**: TC-ENR-001 through TC-ENR-010

## Known Issues
None discovered yet.

## Related Modules
- `module:classes` — Classes being enrolled into
- `module:users` — Student management
- `module:attendance` — Enrollment required for attendance
- `module:chat` — Enrollment grants class chat access
