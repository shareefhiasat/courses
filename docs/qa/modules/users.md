# Users Module

## Business Context
User management for the Military LMS. Super admins manage all users. The module handles user CRUD, role assignment, instructor listing, and user-program/subject associations.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/users` | List all users | super_admin (BUG: currently open) |
| GET | `/api/v1/users/instructors` | List instructors | admin, super_admin |
| GET | `/api/v1/users/programs` | User's programs | admin, super_admin |
| GET | `/api/v1/users/subjects` | User's subjects | admin, super_admin |
| GET | `/api/v1/users/me` | Current user | all authenticated |
| GET | `/api/v1/users/:id` | Get by ID | super_admin |
| POST | `/api/v1/users` | Create user | super_admin |
| PUT | `/api/v1/users/:id` | Update user | super_admin |
| PUT | `/api/v1/users/:id/password` | Set password | super_admin |
| PUT | `/api/v1/users/:id/enable` | Enable user | super_admin |
| PUT | `/api/v1/users/:id/disable` | Disable user | super_admin |
| DELETE | `/api/v1/users/:id` | Delete user | super_admin |

## UI Pages
- `/users` — UsersPage (user management grid)
- `/profile` — ProfilePage (own profile settings)

## Business Rules
- Only super_admin can manage users
- Users are created in Keycloak and synced to database
- User can be enabled/disabled without deletion
- Password can be reset by super_admin
- Instructors listed for class assignment dropdowns
- User-program and user-subject associations for scoped access

## Test Coverage
- **API tests**: `specs/users-admin-api.spec.js` — 8 tests
- **Test IDs**: TC-USR-001 through TC-USR-022
- **RBAC tests**: Student GET /users should return 403

## Known Issues
| ID | Issue | Priority |
|----|-------|----------|
| SHA-16 | requireSuperAdmin commented out — any user can list all users | **Critical** |
| SHA-20 | Duplicate router.get('/me') route definition | Low |

## Related Modules
- `module:auth` — Authentication
- `module:rbac` — Role-based access
- `module:admin-scopes` — Admin scope assignment
- `module:permissions` — Permission matrix
