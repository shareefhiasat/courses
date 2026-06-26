# RBAC Module (Cross-Cutting)

## Business Context
Role-Based Access Control is a cross-cutting concern that applies to every module. It enforces that users can only access endpoints and pages appropriate to their role. Admin scopes provide additional data-level filtering.

## Roles & Permissions Matrix

| Capability | super_admin | admin | hr | instructor | student |
|------------|:-----------:|:-----:|:--:|:----------:|:-------:|
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Programs | ✅ | ✅ (scoped) | ❌ | ❌ | ❌ |
| Manage Subjects | ✅ | ✅ (scoped) | ❌ | ❌ | ❌ |
| Manage Classes | ✅ | ✅ (scoped) | ❌ | ✅ (own) | ❌ |
| Manage Enrollments | ✅ | ✅ (scoped) | ✅ | ✅ (own) | ❌ |
| Mark Attendance | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| View Attendance | ✅ | ✅ (scoped) | ✅ (all) | ✅ (own) | ✅ (own) |
| Manage Activities | ✅ | ✅ (scoped) | ❌ | ✅ (own) | ❌ |
| Manage Resources | ✅ | ✅ (scoped) | ❌ | ✅ (own) | ❌ |
| Manage Quizzes | ✅ | ✅ (scoped) | ❌ | ✅ (own) | ❌ |
| Take Quizzes | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage Marks | ✅ | ✅ (scoped) | ❌ | ✅ (own) | ❌ |
| Manage Penalties | ✅ | ✅ (scoped) | ✅ | ❌ | ❌ |
| Manage Participations | ✅ | ✅ (scoped) | ✅ | ✅ (own) | ❌ |
| Manage Behaviors | ✅ | ✅ (scoped) | ✅ | ✅ (own) | ❌ |
| Chat Access | ✅ | ✅ | ✅ | ✅ | ✅ (limited) |
| Smart Drive | ✅ | ✅ | ✅ | ✅ | ✅ |
| Workflow | ✅ | ✅ | ✅ | ✅ | ❌ |
| Scheduling | ✅ | ✅ (scoped) | ❌ | ✅ (own) | ❌ |
| Permission Matrix | ✅ | ❌ | ❌ | ❌ | ❌ |
| Dashboard | ✅ | ✅ (scoped) | ✅ | ✅ (own) | ✅ (limited) |

## Admin Scope Filtering
| Scope Type | What It Filters |
|------------|----------------|
| PROGRAM | Classes, enrollments, attendance, activities within program |
| CLASSROOM | Sessions and scheduling within classroom |
| INSTRUCTOR | Data associated with specific instructor |

## Test Coverage
- **RBAC tests**: `specs/rbac-api.spec.js` — 16 cross-cutting tests
- **Per-module RBAC**: Each module spec includes role-specific tests
- **Test IDs**: TC-RBAC-001 through TC-RBAC-020

## Known Issues
| ID | Issue | Priority |
|----|-------|----------|
| SHA-16 | GET /users open to all roles (requireSuperAdmin commented out) | **Critical** |
| SHA-17 | Chat rooms not filtered by admin scope | Medium |

## Related Modules
- `module:auth` — Authentication
- `module:admin-scopes` — Scope management
- `module:permissions` — Permission matrix
- `module:users` — User management
