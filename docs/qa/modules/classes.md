# Classes Module

## Business Context
Classes are specific course offerings within a program, taught by an instructor in a classroom. Classes have schedules, enrollments, attendance, activities, and chat rooms. They are the central operational unit of the LMS.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/classes` | List (paginated, filterable) | all authenticated |
| GET | `/api/v1/classes/:id` | Get by ID | all authenticated |
| GET | `/api/v1/classes/program/:programId` | By program | all authenticated |
| GET | `/api/v1/classes/subject/:subjectId` | By subject | all authenticated |
| GET | `/api/v1/classes/instructor/:instructorId` | By instructor | all authenticated |
| POST | `/api/v1/classes` | Create | super_admin, admin, instructor |
| PUT | `/api/v1/classes/:id` | Update | super_admin, admin, instructor (own) |
| DELETE | `/api/v1/classes/:id` | Delete | super_admin, admin |

## UI Pages
- `/classes` — ClassesManagementPage
- `/classes/:id` — Class detail

## Business Rules
- Class code must be unique
- Supports Arabic and English names
- Has term, capacity, and classroom assignment
- Instructor assignment required
- Cannot delete class with active enrollments
- Students see only enrolled classes
- Instructors see only assigned classes
- Admins see classes within their scope

## Test Coverage
- **API tests**: `specs/classes-api.spec.js` — 13 tests
- **Test IDs**: TC-CLS-001 through TC-CLS-012

## Known Issues
None discovered yet.

## Related Modules
- `module:programs` — Classes belong to programs
- `module:subjects` — Classes reference subjects
- `module:enrollments` — Students enroll in classes
- `module:attendance` — Attendance per class session
- `module:activities` — Activities per class
- `module:chat` — Class chat rooms
- `module:scheduling` — Class session scheduling
