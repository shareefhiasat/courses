# Permission Matrix & Data Scope — Phase 6

**Status:** Implemented  
**Date:** 2026-07-03

## Role model (authoritative)

| Role | Data scope | Matrix | Hard gates |
|------|------------|--------|------------|
| Super Admin | Unrestricted | Bypass all ops | Matrix PUT, UCA CRUD, workflow defs |
| HR / Admin | UCA only; empty = no data | Super Admin configures via matrix | Same as other roles |
| Instructor | taught classes ∪ UCA | Matrix-configurable | — |
| Student | Own enrollments | Matrix-configurable | — |

## Changes in this phase

- Removed HR unrestricted data scope from `scopeResolver.js`
- Removed `admin_legacy_unrestricted` fallback
- Frontend `useDataScope` no longer treats HR as unrestricted
- UCA schema: dropped `@@unique([userId, categoryId])`; service-level dedup on create
- `canManage` on UCA included in scope read (`canView` OR `canManage`)
- Permission dependency system: `permissionDependencies.js` + matrix auto-grant
- Matrix middleware on: activities, resources, quizzes, announcements, chat, notifications, workflows, workflow-documents, drive, dashboard, users (SHA-16 fix)
- Workflow file access: HR/Admin blanket removed from `canAccessFile`
- Workflow auto-share: scoped to users with role + UCA on workflow class
- Chat rooms filtered by data scope
- Notifications filtered by metadata class/program/subject scope
- Marks write asserts class scope

## Deploy

```bash
node backend/scripts/sync-permission-screens.js
npx prisma generate --schema=client/prisma/schema.prisma
npx prisma db push --schema=client/prisma/schema.prisma
# restart backend
```
