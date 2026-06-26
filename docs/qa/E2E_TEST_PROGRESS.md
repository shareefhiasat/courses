# Military LMS — E2E Test Progress Tracker

**Last Updated:** 2026-06-24 (Session 2 — 21:30 UTC+3)  
**Total Spec Files:** 55  
**Total Test Cases:** ~1,800+  
**Specs Run:** 28 of 55  
**Total Results:** 319 pass, 70 fail, 151 skip

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ Verified | Tests written, run, and passing (0 failures) |
| ⚠️ Partial | Tests written but some failures or skips remain |
| 📝 Written | Tests written but not yet run/verified |
| ❌ Missing | No test spec file exists for this module |
| 🐛 Known Bug | Module has known bugs affecting tests |

---

## Module Progress

### Core Modules

| # | Module | Spec File | Tests | Status | Last Run | Notes |
|---|--------|-----------|-------|--------|----------|-------|
| 1 | Authentication | `auth.spec.js` | 50 | ✅ Verified | 2026-06-24 | 38 pass, 12 skip (optional UI elements). TC-AUTH-001–050 |
| 2 | RBAC / Access Control | `rbac-api.spec.js` | 35 | ✅ Verified | 2026-06-24 | 35 pass, 0 fail. TC-RBAC-001–020, SEC1–SEC15. 🐛 SHA-16 acknowledged |
| 3 | Programs (API) | `programs-api.spec.js` | 13 | ⚠️ Partial | 2026-06-24 | 12 pass, 1 fail (POST create returns 400), 0 skip |
| 4 | Programs (UI) | `programs-ui-enhanced.spec.js` | 37 | ⚠️ Partial | 2026-06-24 | 13 pass, 1 fail (create button not visible), 23 skip |
| 5 | Programs (UI legacy) | `programs.ui.spec.js` | 3 | ⚠️ Partial | 2026-06-24 | 0 pass, 0 fail, 3 skip — all conditionally skipped |
| 6 | Subjects (API) | `subjects-api.spec.js` | 13 | ⚠️ Partial | 2026-06-24 | 12 pass, 1 fail (POST create returns 400), 0 skip |
| 7 | Subjects (UI) | `subjects-ui.spec.js` | 32 | ⚠️ Partial | 2026-06-24 | 11 pass, 1 fail (create button not visible), 20 skip |
| 8 | Classes (API) | `classes-api.spec.js` | 13 | ⚠️ Partial | 2026-06-24 | 12 pass, 1 fail (POST create returns 400), 0 skip |
| 9 | Classes (UI) | `classes-ui.spec.js` | 37 | ⚠️ Partial | 2026-06-24 | 12 pass, 1 fail (create button not visible), 24 skip |
| 10 | Enrollments (API) | `enrollments-api.spec.js` | 13 | ✅ Verified | 2026-06-24 | 13 pass, 0 fail, 0 skip |
| 11 | Enrollments (UI) | `enrollments-ui.spec.js` | 33 | ⚠️ Partial | 2026-06-24 | 6 pass, 2 fail (table/list render, row count), 25 skip |
| 12 | Manage Enrollments (UI) | `manage-enrollments-ui.spec.js` | 61 | 📝 Written | — | Not yet run |
| 13 | Activities (API) | `activities-api.spec.js` | 11 | ⚠️ Partial | 2026-06-24 | 5 pass, 3 fail (POST create, RBAC student/instructor), 3 skip |
| 14 | Activities (UI) | `activities-ui.spec.js` | 32 | ⚠️ Partial | 2026-06-24 | 3 pass, 3 fail (list render, row count, create button), 26 skip |
| 15 | Resources (API) | `resources-api.spec.js` | 9 | ⚠️ Partial | 2026-06-24 | 7 pass, 1 fail (RBAC student), 1 skip |
| 16 | Resources/Participations/Behaviors (UI) | `resources-participations-behaviors-ui.spec.js` | 91 | 📝 Written | — | Not yet run |
| 17 | Announcements (API) | `announcements-api.spec.js` | 9 | ⚠️ Partial | 2026-06-24 | 7 pass, 1 fail (POST create), 1 skip |
| 18 | Announcements (UI) | `announcements-ui.spec.js` | 39 | ⚠️ Partial | 2026-06-24 | 10 pass, 2 fail (create button, tab switching), 27 skip |
| 19 | Quizzes (API) | `quizzes-api.spec.js` | 8 | ⚠️ Partial | 2026-06-24 | 6 pass, 2 fail (stats, POST create), 0 skip |
| 20 | Quizzes (UI) | `quizzes-ui.spec.js` | 90 | 📝 Written | — | Not yet run |
| 21 | Attendance (API) | `attendance-api.spec.js` | 10 | ⚠️ Partial | 2026-06-24 | 5 pass, 2 fail (POST create, RBAC instructor), 3 skip |
| 22 | Attendance (UI) | `attendance-ui.spec.js` | 141 | 📝 Written | — | Not yet run (user stopped — too many tests) |
| 23 | Penalties (API) | `penalties-api.spec.js` | 8 | ⚠️ Partial | 2026-06-24 | 7 pass, 1 fail (POST create), 0 skip |
| 24 | Penalties (UI) | `penalties-ui.spec.js` | 24 | ✅ Verified | 2026-06-25 | 22 pass, 0 fail, 2 skip (no enrolled students in test data, pagination threshold). Fixed: inline form selectors, MUI DataGrid scroll for actions column, custom Select dropdown chaining |
| 25 | Participations (API) | `participations-api.spec.js` | 11 | ⚠️ Partial | 2026-06-24 | 7 pass, 2 fail (stats, POST create), 2 skip |
| 26 | Behaviors (API) | `behaviors-api.spec.js` | 8 | ⚠️ Partial | 2026-06-24 | 5 pass, 2 fail (GET :id, POST create), 1 skip |
| 27 | Marks (API) | `marks-api.spec.js` | 8 | ⚠️ Partial | 2026-06-24 | 5 pass, 2 fail (PUT update, PUT batch), 1 skip |
| 28 | Marks (UI) | `marks-ui.spec.js` | 107 | 📝 Written | — | Not yet run |
| 29 | Chat (API) | `chat-api.spec.js` | 13 | ✅ Verified | 2026-06-24 | 13 pass, 0 fail, 0 skip |
| 30 | Chat (UI) | `chat-ui.spec.js` | 101 | 📝 Written | — | Not yet run |
| 31 | Notifications (API) | `notifications-api.spec.js` | 11 | ✅ Verified | 2026-06-24 | 11 pass, 0 fail, 0 skip |
| 32 | Notifications (UI) | `notifications-ui.spec.js` | 50 | 📝 Written | — | Not yet run |
| 33 | Drive (API) | `drive-api.spec.js` | 19 | ⚠️ Partial | 2026-06-24 | 14 pass, 5 fail, 0 skip |
| 34 | Drive (UI) | `drive-ui.spec.js` | 67 | 📝 Written | — | Not yet run |
| 35 | Workflow (API) | `workflow-api.spec.js` | 15 | ⚠️ Partial | 2026-06-24 | 5 pass, 3 fail (POST create, compliance, analytics), 7 skip |
| 36 | Workflow (UI) | `workflow-ui.spec.js` | 84 | 📝 Written | — | Not yet run |
| 37 | Workflow Pages (UI) | `workflow-pages-ui.spec.js` | 30 | 📝 Written | — | Not yet run |
| 38 | Scheduling (API) | `scheduling-api.spec.js` | 29 | 📝 Written | — | Not yet run |
| 39 | Scheduling (UI) | `scheduling-ui.spec.js` | 108 | 📝 Written | — | Not yet run |
| 40 | Scheduling Availability (UI) | `scheduling-availability-ui.spec.js` | 70 | 📝 Written | — | Not yet run |
| 41 | Classrooms (API) | `classrooms-api.spec.js` | 8 | ⚠️ Partial | 2026-06-24 | 5 pass, 3 fail (available, program/:id, :id), 0 skip |
| 42 | Dashboard (UI) | `dashboard-ui.spec.js` | 92 | 📝 Written | — | Not yet run |
| 43 | Dashboard Admin (UI) | `dashboard-admin-ui.spec.js` | 36 | 📝 Written | — | Not yet run |
| 44 | Analytics (UI) | `analytics-ui.spec.js` | 136 | 📝 Written | — | Not yet run |
| 45 | Users (API) | `users-admin-api.spec.js` | 38 | ⚠️ Partial | 2026-06-24 | 35 pass, 3 fail (dashboard summary, teacher, lookup types), 0 skip |
| 46 | Users (UI) | `users-ui.spec.js` | 31 | 📝 Written | — | Not yet run |
| 47 | Profile & Settings (UI) | `profile-ui.spec.js` | 55 | 📝 Written | — | Not yet run |
| 48 | Home (UI) | `home-ui.spec.js` | 30 | 📝 Written | — | Not yet run |
| 49 | Review Results (UI) | `review-results-ui.spec.js` | 31 | 📝 Written | — | Not yet run |

### Cross-Cutting / Global Specs

| # | Module | Spec File | Tests | Status | Last Run | Notes |
|---|--------|-----------|-------|--------|----------|-------|
| 50 | Dark Mode (UI) | `dark-mode-ui.spec.js` | 27 | 📝 Written | — | Not yet run |
| 51 | Arabic/RTL (UI) | `arabic-rtl-ui.spec.js` | 31 | 📝 Written | — | Not yet run |
| 52 | Global UI | `global-ui.spec.js` | 30 | 📝 Written | — | Not yet run |
| 53 | Misc Pages (UI) | `misc-pages-ui.spec.js` | 30 | 📝 Written | — | Not yet run |
| 54 | Missing Routes (UI) | `missing-routes-ui.spec.js` | 23 | 📝 Written | — | Not yet run |
| 55 | Misc (API) | `misc-api.spec.js` | 22 | ⚠️ Partial | 2026-06-24 | 13 pass, 9 fail, 0 skip |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total spec files | 55 |
| ✅ Verified (all pass) | 5 |
| ⚠️ Partial (has failures) | 23 |
| 📝 Written (not yet run) | 27 |
| ❌ Missing (no spec) | 0 |
| **Total test cases** | **~1,800+** |
| **Tests run** | **540** |
| **Passed** | **319** |
| **Failed** | **70** |
| **Skipped** | **151** |

### By Category

| Category | Specs Run | Passed | Failed | Skipped |
|----------|-----------|--------|--------|---------|
| Auth + RBAC | 2 | 73 | 0 | 12 |
| API specs | 20 | 190 | 37 | 33 |
| UI specs | 8 | 56 | 13 | 106 |
| **Total** | **30** | **319** | **50** | **151** |

---

## Verified Modules (✅ All Pass)

| Spec | Tests | Passed | Skipped | Failed |
|------|-------|--------|---------|--------|
| `auth.spec.js` | 50 | 38 | 12 | 0 |
| `rbac-api.spec.js` | 35 | 35 | 0 | 0 |
| `enrollments-api.spec.js` | 13 | 13 | 0 | 0 |
| `chat-api.spec.js` | 13 | 13 | 0 | 0 |
| `notifications-api.spec.js` | 11 | 11 | 0 | 0 |

---

## Common Failure Patterns

### 1. POST create endpoints returning 400 instead of 201
**Affected:** programs, subjects, classes, activities, attendance, announcements, penalties, participations, quizzes, behaviors
**Cause:** Test data may not match required fields, or validation is stricter than expected
**Fix needed:** Review each POST test's payload against the actual API schema

### 2. UI "Create button not visible for admin"
**Affected:** programs-ui, subjects-ui, classes-ui, activities-ui, announcements-ui
**Cause:** The create button selector doesn't match the actual UI, or the admin role doesn't see it
**Fix needed:** Update selectors in UI test specs to match actual button text/selector

### 3. UI "Table or list not rendering"
**Affected:** enrollments-ui, activities-ui
**Cause:** Page structure doesn't match expected selectors (table, [role=grid], .list)
**Fix needed:** Update `waitForList` selectors or add page-specific selectors

### 4. Workflow/Drive/Misc API failures
**Affected:** workflow-api (3 fail), drive-api (5 fail), misc-api (9 fail)
**Cause:** Various — missing endpoints, wrong params, or endpoint not implemented
**Fix needed:** Review each failure individually

### 5. Users Admin API (3 failures)
**Affected:** dashboard summary, teacher endpoint, lookup types
**Cause:** Endpoints may require different params or not exist
**Fix needed:** Check API routes for `/dashboard/summary`, `/dashboard/teacher/:id`, `/lookup/types`

---

## Infrastructure Fixes Applied

- `BASE_URL` changed from `http://` to `https://localhost:5174`
- `ignoreHTTPSErrors: true` added to Playwright config (global + project level)
- `headless` changed to `false` for local runs (visible browser)
- Keycloak realm corrected to `master` (matching `client/.env`)
- Test user credentials updated: `admin1`, `instructor1`, `student1`
- `loginAsRole` helper improved with proper element waits and 30s timeout
- `webServer` block disabled (HTTPS self-signed cert breaks health check)
- DB restarted to clear connection exhaustion (max_connections: 100)

---

## Specs Not Yet Run (27 remaining)

### High Priority (large UI specs)
1. `attendance-ui.spec.js` (141 tests) — user stopped twice, too many tests
2. `quizzes-ui.spec.js` (90 tests)
3. `marks-ui.spec.js` (107 tests)
4. `scheduling-ui.spec.js` (108 tests)
5. `chat-ui.spec.js` (101 tests)
6. `analytics-ui.spec.js` (136 tests)
7. `dashboard-ui.spec.js` (92 tests)
8. `resources-participations-behaviors-ui.spec.js` (91 tests)

### Medium Priority
9. `manage-enrollments-ui.spec.js` (61 tests)
10. `drive-ui.spec.js` (67 tests)
11. `scheduling-availability-ui.spec.js` (70 tests)
12. `workflow-ui.spec.js` (84 tests)
13. `profile-ui.spec.js` (55 tests)
14. `notifications-ui.spec.js` (50 tests)
15. `dashboard-admin-ui.spec.js` (36 tests)
16. `workflow-pages-ui.spec.js` (30 tests)
17. `scheduling-api.spec.js` (29 tests)

### Low Priority (small cross-cutting specs)
18. `dark-mode-ui.spec.js` (27 tests)
19. `arabic-rtl-ui.spec.js` (31 tests)
20. `global-ui.spec.js` (30 tests)
21. `misc-pages-ui.spec.js` (30 tests)
22. `missing-routes-ui.spec.js` (23 tests)
23. `home-ui.spec.js` (30 tests)
24. `review-results-ui.spec.js` (31 tests)
25. `users-ui.spec.js` (31 tests)

---

## How to Run

```bash
# Run a single spec
cd client/tests/e2e
npx playwright test specs/<spec-name>.spec.js --reporter=list

# Run all specs
cd client/tests/e2e
npx playwright test --reporter=list

# Run with grep filter
npx playwright test -g "TC-AUTH" --reporter=list
```

**Prerequisites:**
- Docker containers running (DB, Keycloak, MinIO, Redis)
- Backend on port 8001 (`pnpm api:dev` or `node backend/server.js`)
- Frontend on https://localhost:5174 (`pnpm start` or `cd client && vite --host`)
- Playwright browsers installed (`npx playwright install chromium`)
- Use `--headed` flag to see browser: `npx playwright test specs/<spec> --headed`

**⚠️ DB Connection Note:** Running many API tests can exhaust PostgreSQL connections (max: 100). If you see `too many clients already`, restart the DB container: `docker restart lms-qaf-app-db`
