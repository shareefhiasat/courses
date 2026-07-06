# Permission Matrix & Data Scope — Phase 3

**Status:** Implemented (core)  
**Date:** 2026-06-19

## Data scope rules (authoritative)

| Role | Data scope |
|------|------------|
| **Super admin** | Unrestricted — sees/does everything even when also instructor |
| **HR** | Unrestricted — all programs/categories/classes |
| **Admin** | UCA rows → scoped to category/program/subject/class; no UCA → legacy full access |
| **Instructor** | `Class.instructorId` ∪ `UserCategoryAccess` (union, not intersection) |
| **Student** | Own records only (existing page logic) |

## Phase 3 — Done

### Permission matrix (full menu)

- [x] `BASE_PERMISSION_SCREEN_DEFINITIONS` — all legacy/menu screens in `navigationRegistry.js`
- [x] `getAllSyncScreenDefinitions()` — deduped merge for sync
- [x] `QR_SCANNER_OPERATION_DEFINITIONS` — daily scan granular ops
- [x] `sync-permission-screens.js` syncs **all** menu screens + QR ops + instructor presets
- [x] `resolveScreenIdFromNavItem` — `?mode=activities` / `?mode=resources` paths
- [x] `usePermissions` — **union** across all user roles (not highest-only)
- [x] SideDrawer — explicit `screenId` on admin academic/operations/analytics items

### Data scope on list APIs

- [x] `backend/utils/applyListScope.js` — shared field maps
- [x] Programs, subjects, classes (all list endpoints)
- [x] Enrollments (all list + students-by-class)
- [x] Penalties, participations, behaviors, activities
- [x] Attendance + standup (phase 2)

### Frontend

- [x] Penalties / Behavior pages — rely on scoped enrollment API (removed instructorId client filter)
- [x] `useDataScope` — HR + super admin unrestricted

## Run after deploy

```bash
node backend/scripts/sync-permission-screens.js
# Restart backend
node backend/server.js
```

## Phase 4 — Scoped UX polish (done)

- [x] Quiz list API scoped via linked activities (`quizScope.js`)
- [x] Quiz results pages rely on scoped APIs (removed instructorId client filters)
- [x] Marks API scoped (`getStudentMarks`, `getAllStudentMarksReport`, distribution read)
- [x] Schedule sessions list/range scoped
- [x] Chat class membership uses scoped `getClasses()` (instructor ∪ UCA)
- [x] Home page activities/resources use `useDataScope.canAccessRecord` (instructor ∪ UCA)
- [x] Analytics dashboards — per-user saved layouts unchanged (no code change needed)

## Phase 5 — Optional

- [ ] Analytics summary cards: remove redundant instructorId filters (data already scoped if loaded via API)
- [ ] Scheduling calendar instructor page gate
- [ ] Marks write endpoints assert scope on update
