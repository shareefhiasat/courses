# Announcements Module

## Business Context
Announcements are broadcast messages from admin/HR/instructors to targeted audiences (program, class, or global). Announcements support Arabic/English content, priority levels, and expiry dates.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/announcements` | List | all authenticated |
| GET | `/api/v1/announcements/:id` | Get by ID | all authenticated |
| GET | `/api/v1/announcements/program/:programId` | By program | all authenticated |
| GET | `/api/v1/announcements/class/:classId` | By class | all authenticated |
| POST | `/api/v1/announcements` | Create | admin, hr, instructor, super_admin |
| PUT | `/api/v1/announcements/:id` | Update | creator, admin, super_admin |
| DELETE | `/api/v1/announcements/:id` | Delete | creator, admin, super_admin |

## UI Pages
- `/announcements` — AnnouncementsPage

## Business Rules
- Target audience: global, program, class, or specific roles
- Priority: normal, important, urgent
- Active/expired status based on expiry date
- Supports Arabic and English content
- Instructors can announce to their classes only
- Admin/HR can announce to programs
- Super admin can announce globally

## Test Coverage
- **API tests**: `specs/announcements-api.spec.js` — 9 tests
- **Test IDs**: TC-ANN-001 through TC-ANN-008

## Known Issues
None discovered yet.

## Related Modules
- `module:notifications` — Announcements trigger notifications
- `module:programs` — Program-level targeting
- `module:classes` — Class-level targeting
