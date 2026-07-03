# User Access Operator Guide

## Four layers

1. **Identity** — Keycloak roles (super_admin, admin, hr, instructor, student)
2. **Permission Matrix** — Which screens and actions each role can use
3. **User Category Access (UCA)** — Which programs/subjects/classes each user sees
4. **Resource ACL** — Smart Drive shares, workflow participants, notification ownership

## Super Admin vs everyone else

Super Admin is the only role that:

- Edits the permission matrix
- Manages User Category Access rows
- Has unrestricted data scope (sees all programs/classes)
- Bypasses matrix checks at runtime

HR and Admin differ **only** by what Super Admin configures in the matrix. Both require UCA rows to see data — empty UCA means no academic data.

Instructors additionally see classes where they are assigned as `instructorId` (union with UCA).

## Permission dependencies

When you grant an action, prerequisites are auto-enabled:

- Create/Update/Delete/Export requires View on the same screen
- QR Edit/Bulk requires Mark Attendance
- Workflow actions require Workflow View
- Drive write ops require Drive View
- Dashboard tab View requires Dashboard View

The matrix UI shows an amber notice when prerequisites are implied.

## Smart Drive vs matrix

Matrix `drive.canView/create/update/delete` gates API access. File-level sharing uses VIEW → DOWNLOAD → COMMENT → EDIT hierarchy separately via FileShare records.

Workflow auto-share sends files to scoped users (role + UCA on workflow class), not the entire role globally.

## Assigning scoped access

1. Open Dashboard → User Access (Super Admin only)
2. Pick user, category, optionally narrow to program/subject/class
3. `canView` = read-only scope; `canManage` = read + write within scope
4. Multiple rows per category are allowed (different programs/classes)

## After matrix or UCA changes

Users may need to refresh the page. Run `node backend/scripts/sync-permission-screens.js` after deploy when new screens are added.
