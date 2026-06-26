---
title: Home
tags: [home, dashboard, landing, widgets]
route: /
order: 1
keywords: [home, landing page, widgets, dashboard, navigation, role-based widgets, quick access, command palette]
---

# Home

The Home page is your starting point after logging in. It displays role-based widgets and quick-access cards so you can immediately see what needs your attention.

## Who can access

| Role | Access |
| --- | --- |
| Super Admin | Full home page with all admin widgets |
| Admin | Admin home with management widgets |
| HR | HR-focused widgets (attendance, penalties) |
| Instructor | Instructor widgets (activities, classes, schedule) |
| Student | Student dashboard with progress and assignments |

> **Screen ID:** `home` — Requires `view` operation. All authenticated users can access this screen.

## Widgets

The widgets shown depend on your role:

- **Activities** — Shows your assigned activities and their current status. Click a card to go to the [Dashboard](/en/dashboard) activities tab.
- **Resources** — Lists recently added resources for your courses. Click to open [Smart Drive](/en/smart-drive).
- **Announcements** — Displays recent announcements from instructors and admins. Click to read full text on the [Dashboard](/en/dashboard) announcements tab.
- **Progress** — (Students only) Shows your overall progress across enrolled programs, including quiz scores and attendance rate.
- **Schedule** — (Instructors) Shows today's sessions and upcoming classes. Links to the [Scheduling](/en/scheduling) calendar.
- **Pending Tasks** — (Admins/Instructors) Shows workflow tasks awaiting your action. Links to the [Workflow](/en/workflow) inbox.

## Navigation

- **Side drawer** — Click the hamburger icon (top-left) to open the navigation menu. Items are filtered by your role and permissions.
- **Language toggle** — Switch between English and Arabic. Your preference is saved automatically.
- **Theme toggle** — Switch between light and dark mode.
- **Help search** — Press `Ctrl+K` (or `Cmd+K` on Mac) to open the command palette for quick navigation.

## Validations & business rules

- You must be authenticated via Keycloak to see the home page. Unauthenticated users are redirected to the login page.
- Widgets load asynchronously — if a backend service is unavailable, the widget shows a retry button instead of failing silently.
- The home page content is cached for 5 minutes. A hard refresh bypasses the cache.

## Limitations

- You cannot customise which widgets appear — they are determined by your role.
- The home page does not show real-time updates; you need to refresh to see new data.

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Widgets not loading | Check your network connection. If a backend service is down, the widget shows a retry button. Click it to reload. |
| Home page shows stale data | The page caches content for 5 minutes. Do a hard refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`) to bypass the cache. |
| Navigation drawer won't open | Ensure JavaScript is enabled. Try a hard refresh. If the issue persists, clear browser cache. |
| Help search (`Ctrl+K`) not responding | The command palette requires JavaScript. Ensure pop-ups are not blocked. Try clicking the search bar directly. |

## Related articles

- [Dashboard](/en/dashboard) — The administrative hub for managing content and operations.
- [Notifications](/en/notifications) — View and manage system notifications.
- [Profile & Settings](/en/profile) — Manage your account preferences.
