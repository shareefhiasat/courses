# Resources Module

## Business Context
Resources are course materials (files, links, documents) shared by instructors with their classes. Resources can be marked as required or optional. Students view and download resources for enrolled classes.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/resources` | List | all authenticated |
| GET | `/api/v1/resources/:id` | Get by ID | all authenticated |
| GET | `/api/v1/resources/class/:classId` | By class | all authenticated |
| POST | `/api/v1/resources` | Create | instructor, admin, super_admin |
| PUT | `/api/v1/resources/:id` | Update | instructor (own), admin, super_admin |
| DELETE | `/api/v1/resources/:id` | Delete | instructor (own), admin, super_admin |

## UI Pages
- `/resources` — ResourcesPage

## Business Rules
- Instructors upload resources for their classes
- Students view resources for enrolled classes only
- Resource types: file, link, video, document
- Required vs optional flag
- Resources link to Smart Drive for file storage

## Test Coverage
- **API tests**: `specs/resources-api.spec.js` — 9 tests
- **Test IDs**: TC-RES-001 through TC-RES-007

## Known Issues
None discovered yet.

## Related Modules
- `module:classes` — Resources belong to classes
- `module:drive` — File storage
- `module:activities` — Activities can reference resources
