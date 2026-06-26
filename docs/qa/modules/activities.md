# Activities Module

## Business Context
Activities are course assignments and tasks given to students by instructors. Activities support file attachments, due dates, and participation tracking. They are the primary way instructors engage students beyond class sessions.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/activities` | List | all authenticated |
| GET | `/api/v1/activities/:id` | Get by ID | all authenticated |
| GET | `/api/v1/activities/class/:classId` | By class | all authenticated |
| POST | `/api/v1/activities` | Create | instructor, admin, super_admin |
| PUT | `/api/v1/activities/:id` | Update | instructor (own), admin, super_admin |
| DELETE | `/api/v1/activities/:id` | Delete | instructor (own), admin, super_admin |

## UI Pages
- `/activities` — ActivitiesPage

## Business Rules
- Instructors create activities for their classes
- Students view activities for enrolled classes
- Activities have due dates and optional file attachments
- Activity types: assignment, quiz, discussion, reading
- Cannot delete activity with submissions
- Participation points can be linked to activities

## Test Coverage
- **API tests**: `specs/activities-api.spec.js` — 11 tests
- **Test IDs**: TC-ACT-001 through TC-ACT-008

## Known Issues
None discovered yet.

## Related Modules
- `module:classes` — Activities belong to classes
- `module:resources` — Activity attachments
- `module:participations` — Activity participation tracking
- `module:drive` — File attachments stored in drive
