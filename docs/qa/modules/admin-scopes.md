# Admin Scopes Module

## Business Context
Admin scopes provide granular data-level access control for admin users. Instead of all-or-nothing access, admins can be scoped to specific programs, classrooms, or instructors. The effective scope is the union of all assigned scopes.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/admin-scopes` | List all scopes | super_admin |
| GET | `/api/v1/admin-scopes/user/:userId` | User's scopes | super_admin, admin (own) |
| GET | `/api/v1/admin-scopes/user/:userId/effective` | Effective scope | super_admin, admin (own) |
| POST | `/api/v1/admin-scopes` | Create scope | super_admin |
| PUT | `/api/v1/admin-scopes/:id` | Update scope | super_admin |
| DELETE | `/api/v1/admin-scopes/:id` | Delete scope | super_admin |

## UI Pages
- `/settings/admin-scopes` — AdminScopesPage

## Business Rules
- Scope types: PROGRAM, CLASSROOM, INSTRUCTOR
- Multiple scopes per user (union = effective scope)
- Effective scope filters: programIds, classroomIds, instructorUserIds
- Super admin manages all scopes
- Admin can view own effective scope
- Scopes should be applied by all data-fetching queries (BUG: not applied in chat)

## Test Coverage
- **API tests**: `specs/users-admin-api.spec.js` — 5 tests
- **Test IDs**: TC-ASC-001 through TC-ASC-010

## Known Issues
| ID | Issue | Priority |
|----|-------|----------|
| SHA-17 | Chat rooms not filtered by admin scope | Medium |

## Related Modules
- `module:rbac` — Role-based access control
- `module:users` — User management
- `module:programs` — Program scoping
- `module:chat` — Chat should use scopes (bug)
