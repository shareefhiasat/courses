# Participations Module

## Business Context
Participations track student engagement in class activities. Instructors award participation points for answering questions, contributing to discussions, and completing activities. Participation data feeds into analytics and weekly summaries.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/participations` | List | super_admin, admin, hr, instructor |
| GET | `/api/v1/participations/stats` | Student stats | super_admin, admin, hr, instructor |
| GET | `/api/v1/participations/class-stats` | Class stats | super_admin, admin, hr, instructor |
| GET | `/api/v1/participations/:id` | Get by ID | super_admin, admin, hr, instructor |
| GET | `/api/v1/participations/student/:studentId` | By student | super_admin, admin, hr, instructor, student (own) |
| GET | `/api/v1/participations/class/:classId` | By class | super_admin, admin, hr, instructor |
| GET | `/api/v1/participations/activity/:activityId` | By activity | super_admin, admin, hr, instructor |
| POST | `/api/v1/participations` | Create | instructor, admin, super_admin |
| PUT | `/api/v1/participations/:id` | Update | instructor, admin, super_admin |
| DELETE | `/api/v1/participations/:id` | Delete | instructor, admin, super_admin |

## UI Pages
- `/participations` — ParticipationsPage

## Business Rules
- Participation types: answer, question, discussion, presentation, group_work
- Points system (positive values)
- Instructors award points for their classes
- Students view own participation only
- Stats include totals by type and class
- Feeds into weekly summary and analytics

## Test Coverage
- **API tests**: `specs/participations-api.spec.js` — 12 tests
- **Test IDs**: TC-PAR-001 through TC-PAR-010

## Known Issues
| ID | Issue | Priority |
|----|-------|----------|
| SHA-19 | Duplicate router.get('/class-stats') route | Low |

## Related Modules
- `module:activities` — Activities generate participation
- `module:classes` — Participation per class
- `module:weekly-summary` — Participation in weekly reports
- `module:lookup` — Participation types
