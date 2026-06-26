# Authentication & Authorization Module

## Business Context
The Military LMS uses Keycloak SSO for authentication. Role-based access control (RBAC) determines which screens and API endpoints each role can access. Admin scopes (program/classroom/instructor level) provide granular data filtering for admin users.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/users/me` | Current user profile | all authenticated |
| GET | `/api/v1/me/data-scope` | Effective data scope | all authenticated |
| GET | `/api/v1/permissions` | All permissions | authenticated |
| PUT | `/api/v1/permissions` | Update permissions | super_admin only |
| POST | `/api/v1/notifications/admin/test` | Test notification | admin only |

## UI Pages
- `/login` — LoginPage (Keycloak redirect)
- `/unauthorized` — UnauthorizedPage (403 display)
- `/silent-check-sso.html` — Silent SSO status check

## Roles
| Role | Description | Access Level |
|------|-------------|-------------|
| `super_admin` | Full system access | Everything including permission matrix |
| `admin` | Program/classroom/instructor scoped | Most modules, scoped by admin scope |
| `hr` | HR operations | Attendance, penalties, enrollments |
| `instructor` | Teaching operations | Own classes, activities, attendance, marks |
| `student` | Learning operations | Own enrollments, activities, quizzes, chat |

## Admin Scopes
| Scope Type | Description |
|------------|-------------|
| `PROGRAM` | Admin sees only data within assigned programs |
| `CLASSROOM` | Admin sees only data within assigned classrooms |
| `INSTRUCTOR` | Admin sees only data for assigned instructors |

## Business Rules
- Login via Keycloak SSO (redirect flow)
- Session persists across page refreshes
- ProtectedRoute component enforces screen-level access
- API routes enforce role via middleware (`requireAuth`, `requireSuperAdmin`, `screenOps`)
- Admin scopes filter data at the database query level
- Unauthenticated requests return 401
- Unauthorized requests return 403

## Test Coverage
- **UI**: `specs/auth.spec.js` — 50 tests (login flow, logout, session management, protected routes, unauthorized page, role-based redirect)
- **RBAC**: `specs/rbac-api.spec.js` — 35 cross-cutting security tests (role-based API access, admin scopes, unauthenticated denial)
- **Test IDs**: TC-AUTH-001 through TC-AUTH-050, TC-RBAC-001 through TC-RBAC-020, TC-RBAC-SEC1 through TC-RBAC-SEC15

## Known Issues
| ID | Issue | Priority |
|----|-------|----------|
| SHA-16 | requireSuperAdmin commented out on GET /users | **Critical** |

## Related Modules
- `module:rbac` — Cross-cutting RBAC tests
- `module:admin-scopes` — Admin scope management
- `module:permissions` — Permission matrix
- `module:users` — User management
