# Behaviors Module

## Business Context
Behaviors track student conduct in class. Instructors record behavior observations (positive, neutral, negative) with notes. Behavior data supports the military training discipline system and feeds into weekly summaries.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/behaviors` | List | super_admin, admin, hr, instructor |
| GET | `/api/v1/behaviors/:id` | Get by ID | super_admin, admin, hr, instructor |
| GET | `/api/v1/behaviors/student/:studentId` | By student | super_admin, admin, hr, instructor, student (own) |
| GET | `/api/v1/behaviors/class/:classId` | By class | super_admin, admin, hr, instructor |
| POST | `/api/v1/behaviors` | Create | instructor, admin, super_admin |
| PUT | `/api/v1/behaviors/:id` | Update | instructor, admin, super_admin |
| DELETE | `/api/v1/behaviors/:id` | Delete | instructor, admin, super_admin |

## UI Pages
- `/behaviors` — BehaviorsPage

## Business Rules
- Behavior ratings: positive, neutral, negative
- Instructors record behavior for their classes
- Students view own behavior only
- Notes field for detailed observations
- Feeds into weekly summary and discipline tracking
- Negative behaviors can lead to penalties

## Test Coverage
- **API tests**: `specs/behaviors-api.spec.js` — 9 tests
- **Test IDs**: TC-BEH-001 through TC-BEH-007

## Known Issues
None discovered yet.

## Related Modules
- `module:penalties` — Negative behaviors can trigger penalties
- `module:classes` — Behavior per class
- `module:weekly-summary` — Behavior in weekly reports
- `module:lookup` — Behavior types
