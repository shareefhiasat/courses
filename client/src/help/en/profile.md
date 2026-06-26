---
title: Profile & Settings
tags: [profile, settings, password, language, theme]
route: /profile
order: 90
keywords: [profile, settings, password, change password, language, theme, accent color, notification preferences, permission matrix, RBAC, roles, self-lock prevention, audit log, Keycloak]
---

# Profile & Settings

Manage your personal account settings, preferences, and (for Super Admins) the Permission Matrix.

## Who can access

| Role | Operations | What they can do |
| --- | --- | --- |
| Super Admin | view, update | Edit own profile + manage Permission Matrix |
| Admin | view, update | Edit own profile |
| HR | view, update | Edit own profile |
| Instructor | view, update | Edit own profile |
| Student | view, update | Edit own profile |

> **Screen ID:** `profile` — Requires `view` operation. `update` is needed to save changes. Permission Matrix uses screen ID `permission-matrix`.

## Key actions

### Personal settings

- **Edit name** — Update your display name. Changes appear across the system immediately.
- **Change password** — Set a new password. You must enter your current password to confirm the change.
- **Language** — Switch between English and Arabic. Your preference is saved and applied on every login.
- **Theme** — Toggle between light and dark mode.
- **Accent colour** — Choose your preferred accent colour from a preset palette.
- **Notification preferences** — Enable or disable specific notification types (announcements, quiz results, attendance alerts, workflow tasks, chat messages).

### Permission Matrix (Super Admin only)

The Permission Matrix is a grid that shows which roles have access to which screens and operations. Super Admins can:

- **View** the full matrix of screens × roles × operations.
- **Toggle** individual operations (view, create, update, delete, export) per role per screen.
- **Reset** a role's permissions to the default configuration.
- **Sync** new screens from the navigation registry into the matrix.

## Validations & business rules

- **Password strength** — New passwords must be at least 8 characters and include a mix of letters and numbers.
- **Current password required** — You cannot change your password without verifying the current one.
- **Language persistence** — Language preference is stored in local storage and synced with the server.
- **Theme persistence** — Theme preference is stored in local storage.
- **Permission Matrix changes** — All changes are logged with the admin user, timestamp, previous value, and new value.
- **Self-lock prevention** — You cannot remove your own `view` permission for the Permission Matrix to prevent locking yourself out.

## Limitations

- You cannot change your own role — only another Super Admin can change roles.
- You cannot change your email address — it is managed via Keycloak by the administrator.
- Permission Matrix changes take effect immediately for new sessions. Users with active sessions may need to log out and log back in to see the updated permissions.
- The Permission Matrix can only be accessed by Super Admins — there is no read-only view for other roles.

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Password change fails | Ensure your current password is correct and the new password meets the 8-character minimum with letters and numbers. |
| Language switch not persisting | Clear browser cache and cookies, then log in again. Language preference is stored in local storage. |
| Permission Matrix tab not visible | Only Super Admins can see this tab. Verify your role with another Super Admin. |
| Cannot remove a permission in the Matrix | The system prevents removing your own `view` permission for the Permission Matrix to avoid self-lockout. |
| Permission changes not taking effect | Users with active sessions may need to log out and log back in. Changes apply immediately to new sessions. |

## Related articles

- [Home](/en/home) — Your home page widgets depend on your role and permissions.
- [Dashboard](/en/dashboard) — Dashboard tab visibility is controlled by the Permission Matrix.
- [Notifications](/en/notifications) — Configure which notifications you receive from this screen.
- [Help Center](/en) — Overview of roles and system navigation.
