# Permissions Module

## Business Context
The Permissions module manages the screen-level permission matrix. Super admins configure which roles can access which screens. This is the backbone of the RBAC system at the UI level.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/permissions` | Get permission matrix | all authenticated |
| PUT | `/api/v1/permissions` | Update permission matrix | super_admin only |

## UI Pages
- `/settings/permissions` — PermissionsMatrixPage

## Business Rules
- Permission matrix maps roles to screen IDs
- Super admin is always granted all permissions
- Changes take effect on next page load
- ProtectedRoute component checks permissions via screenId
- API middleware checks permissions via screenOps

## Test Coverage
- **API tests**: `specs/users-admin-api.spec.js` — 4 tests
- **Test IDs**: TC-PERM-001 through TC-PERM-003

## Known Issues
None discovered yet.

## Related Modules
- `module:rbac` — Role-based access control
- `module:auth` — Authentication
- `module:users` — User management
