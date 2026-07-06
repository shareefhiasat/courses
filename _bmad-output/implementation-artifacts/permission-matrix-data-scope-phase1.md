# Permission Matrix & Data Scope — Phase 1 Implementation

**Status:** In progress (foundation shipped)  
**Owner:** Amelia (Dev)  
**Date:** 2026-06-19

## Goal

Align permission matrix with all current menu items, and establish data-level scoping (category → program → subject → class) with instructor class-assignment union.

## Phase 1 — Done in this session

- [x] `client/src/config/navigationRegistry.js` — canonical path/hash → `screenId` mapping + new screen definitions
- [x] `backend/scripts/sync-permission-screens.js` — non-destructive upsert of 27 new screens + role presets
- [x] `usePermissions.canAccessScreen` — uses navigation registry (fixes scheduling/availability/dashboard tab resolution)
- [x] `SideDrawer` — permission filter uses registry + explicit `screenId` on scheduling items
- [x] `backend/services/scopeResolver.js` — effective scope (super admin unrestricted; instructor ∪ UCA; admin/HR legacy unrestricted until UCA assigned)
- [x] `GET /api/v1/me/data-scope` — frontend scope hook
- [x] `client/src/hooks/useDataScope.js`
- [x] Programs list API filtered by scope (first API wired)
- [x] User category access API secured (`requireAuth` + `requireSuperAdmin`)
- [x] Dashboard allows instructor + HR (was admin-only shell)

## Phase 2 — API permission middleware (done)

- [x] `requirePermission(screenId, operation)` middleware + `screenOps` / `qrScannerOps` helpers
- [x] `permissionsService.checkPermissionForRoles` — union across user roles
- [x] Super admin bypass only in middleware
- [x] Attendance + standup routes wired to `qr-scanner` matrix ops
- [x] Attendance/standup controllers enforce data scope (class/program)
- [x] Write routes: penalties, participations, behaviors, enrollments, programs, subjects, classes, marks
- [x] `attachDataScope` mounted globally after auth
- [x] HR always unrestricted in `scopeResolver` + `useDataScope`
- [x] Subjects/classes list APIs scope-filtered (supports daily attendance dropdowns)
- [x] QR scanner class list relies on scoped classes API (HR/super admin see all)

## Phase 3 — Data scope on all list APIs (done)

- [x] Full menu matrix sync (`BASE_PERMISSION_SCREEN_DEFINITIONS` + QR ops)
- [x] subjects, classes, enrollments, penalties, participation, behavior, activities APIs scoped
- [x] `applyListScope` shared helper
- [x] `usePermissions` union across roles; SideDrawer screenIds
- [x] Instructor = taught classes ∪ UCA (scopeResolver unchanged, enforced on APIs)
- [x] HR + super admin unrestricted; admin scoped when UCA assigned

See `permission-matrix-data-scope-phase3.md` for Phase 4 polish items.

## Phase 4 — Instructor dual access polish (next)

- [ ] Document: instructor sees `Class.instructorId` ∪ `UserCategoryAccess`
- [ ] Replace page-level `instructorId === user.uid` filters with shared scope
- [ ] Allow instructors on scheduling calendar via matrix (view-only default)

## Super admin + instructor

- Super admin: `unrestricted: true` in scopeResolver; matrix + RoleGuard bypass unchanged
- Teaching assignment does **not** limit super admin

## Run after deploy

```bash
node backend/scripts/sync-permission-screens.js
```

Restart backend after schema/env changes.
