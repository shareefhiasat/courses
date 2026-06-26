# Dashboard & Analytics Module

## Business Context
The dashboard provides role-based overviews of system data. Super admins see global analytics, admins see scoped data, instructors see their classes, and students see their progress. Analytics cover drive usage, workflow status, and activity trends.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/dashboard/summary` | Role-based summary | all authenticated |
| GET | `/api/v1/dashboard/teacher/:teacherUserId` | Teacher dashboard | instructor (own), admin, super_admin |
| GET | `/api/v1/dashboard/analytics` | Global analytics | admin, super_admin |
| GET | `/api/v1/dashboard/analytics/drive` | Drive analytics | admin, super_admin |
| GET | `/api/v1/dashboard/analytics/workflow` | Workflow analytics | admin, super_admin |
| GET | `/api/v1/dashboard/analytics/activity` | Activity analytics | admin, super_admin |
| GET | `/api/v1/me/dashboards/:key` | Custom dashboard config | all authenticated |
| PUT | `/api/v1/me/dashboards/:key` | Save dashboard config | all authenticated |
| DELETE | `/api/v1/me/dashboards/:key` | Delete dashboard config | all authenticated |

## UI Pages
- `/` — DashboardPage (role-based widgets)
- `/analytics` — AnalyticsPage

## Business Rules
- Dashboard widgets are role-specific
- Users can customize widget layout (saved per user)
- Analytics include: total users, classes, enrollments, drive usage, workflow status
- Teacher dashboard: own classes, attendance rates, pending activities
- Student dashboard: enrolled classes, upcoming activities, marks
- Admin dashboard: scoped data based on admin scopes

## Test Coverage
- **API tests**: `specs/users-admin-api.spec.js` — 10 tests (Dashboard + Me sections)
- **Test IDs**: TC-DASH-001 through TC-DASH-010

## Known Issues
None discovered yet.

## Related Modules
- `module:admin-scopes` — Data scoping for admins
- `module:drive` — Drive analytics
- `module:workflow` — Workflow analytics
- `module:activities` — Activity analytics
