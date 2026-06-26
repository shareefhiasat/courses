---
title: Dashboard
tags: [dashboard, activities, announcements, resources, programs, subjects, classes, admin]
route: /dashboard
order: 2
---

# Dashboard

The Dashboard is the main administrative hub. It uses a ribbon tab interface to switch between different management screens without leaving the page.

## Who can access

| Role | Access |
| --- | --- |
| Super Admin | All tabs |
| Admin | All tabs except Permission Matrix |
| HR | Users, Attendance-related tabs, Penalty |
| Instructor | Activities, Announcements, Resources, Quizzes, Marks Entry, Scheduling |
| Student | Limited or no access (students use the [Home](/en/home) page instead) |

> **Screen ID:** `dashboard` — Requires `view` operation. Individual tabs have their own screen IDs and permission checks.

## Tabs

### Content

| Tab | Screen ID | Operations | Description |
| --- | --- | --- | --- |
| **Activities** | `activities` | view, create, update, delete | Create, edit, and manage course activities (quizzes, homework, training, labs). |
| **Announcements** | `announcements` | view, create, update, delete | Post announcements visible to students and instructors. |
| **Resources** | `resources` | view, create, update, delete | Upload and organise learning resources (files, links, videos). |

### Academic

| Tab | Screen ID | Operations | Description |
| --- | --- | --- | --- |
| **Programs** | `programs` | view, create, update, delete | Define academic programs (admin only). |
| **Subjects** | `subjects` | view, create, update, delete | Manage subjects within programs. |
| **Classes** | `classes` | view, create, update, delete | Create and manage class sections. |

### Enrollments

| Tab | Screen ID | Operations | Description |
| --- | --- | --- | --- |
| **Enrollments** | `enrollments` | view | View student enrollments. |
| **Manage Enrollments** | `manage-enrollments` | view, create, update, delete | Bulk enrollment management. |
| **Marks Entry** | `marks-entry` | view, update | Enter and edit student grades. |

### Operations

| Tab | Screen ID | Operations | Description |
| --- | --- | --- | --- |
| **Penalty** | `penalty` | view, create, update, delete | Record and review penalty incidents. |
| **Participation** | `participation` | view, create, update, delete | Track student participation points. |
| **Behavior** | `behavior` | view, create, update, delete | Log behaviour incidents. |

### Users

| Tab | Screen ID | Operations | Description |
| --- | --- | --- | --- |
| **Users** | `users` | view, create, update, delete | Manage user accounts (admin/HR only). |
| **User Category Access** | `user-category-access` | view, create, update, delete | Control which categories a user can access. |

### Communication

| Tab | Screen ID | Operations | Description |
| --- | --- | --- | --- |
| **Email Templates** | `email-templates` | view, create, update, delete | Manage email template definitions. |
| **Notification Logs** | `notification-logs` | view | View sent notification history. |
| **Scheduled Reports** | `scheduled-reports` | view, create, update, delete | Configure recurring reports. |

### Settings

| Tab | Screen ID | Operations | Description |
| --- | --- | --- | --- |
| **Categories** | `categories` | view, create, update, delete | Manage resource and activity categories. |
| **Activity Types** | `activity-types` | view, create, update, delete | Configure activity type lookups. |
| **Behavior Types** | `behavior-types` | view, create, update, delete | Configure behaviour type lookups. |
| **Participation Types** | `participation-types` | view, create, update, delete | Configure participation type lookups. |
| **Penalty Types** | `penalty-types` | view, create, update, delete | Configure penalty type lookups. |

## Validations & business rules

- **Tab visibility** — Tabs are filtered by your role and permission matrix. If you lack `view` permission for a screen, its tab is hidden.
- **Active tab persistence** — The active tab is saved in your browser's local storage. You return to it automatically on your next visit.
- **Deep linking** — Use the URL hash (e.g., `/dashboard#programs`) to link directly to a specific tab.
- **Create/Edit forms** — Most forms validate required fields before submission. Invalid data shows inline error messages.
- **Delete confirmation** — All delete actions require confirmation. Some items use soft-delete and can be restored.

## Limitations

- You cannot rearrange tabs — the order is fixed by the system.
- Some tabs load data lazily; switching to a tab for the first time may take a moment.
- The dashboard does not auto-refresh; you need to switch tabs or refresh the page to see new data.

## Related articles

- [Home](/en/home) — Role-based widgets and quick access cards.
- [Quizzes](/en/quizzes) — Quiz creation and management.
- [Attendance](/en/attendance) — Taking and reviewing attendance.
- [Scheduling](/en/scheduling) — Class sessions and room booking.
- [Workflow](/en/workflow) — Approval processes and document routing.
- [Profile & Settings](/en/profile) — Permission Matrix access for Super Admins.
