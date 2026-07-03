---
title: Scheduling
tags: [scheduling, calendar, availability, classes, rooms, instructors]
route: /scheduling-calendar
order: 60
keywords: [scheduling, calendar, session, instructor availability, room availability, rooms management, conflict detection, capacity check, recurring sessions, drag to reschedule, timezone, summary dashboard, export, holiday, weekend, break time, bilingual conflict messages, teacher conflict, classroom conflict, max sessions]
---

# Scheduling

The Scheduling system manages class sessions, instructor availability, and room booking. It provides a calendar-based interface for creating and managing the academic timetable.

## Who can access

| Role | Operations | What they can do |
| --- | --- | --- |
| Super Admin | view, create, update, delete | Full scheduling management |
| Admin | view, create, update, delete | Full scheduling management |
| HR | view (matrix) | View calendar and availability **scoped to UCA** — Program A UCA shows Program A instructors/sessions only |
| Instructor | view, create, update | Create and manage their own sessions (within scope) |
| Student | view | View scheduled sessions |

> **Screen IDs:** `scheduling-calendar` (main), `summary-dashboard` (metrics), `instructor-availability-setup` / `instructor-availability-view`, `room-availability-setup` / `room-availability-view`, `rooms-management`, `classes-availability`.

## Screens

| Screen | Screen ID | Description |
| --- | --- | --- |
| **Scheduling Calendar** | `scheduling-calendar` | View and create sessions on a day/week/month calendar. |
| **Summary Dashboard** | `summary-dashboard` | Key metrics: total sessions, utilisation rate, upcoming sessions, and conflicts. |
| **Instructor Availability** | `instructor-availability-setup` | Set when instructors are available for teaching. |
| **Classroom Availability** | `room-availability-setup` | Manage room availability and booking. |
| **Rooms Management** | `rooms-management` | Create, edit, and delete classroom definitions (capacity, equipment, location). |

## Key actions

- **Create session** — Click on a calendar slot to open the session creation form. Select a program, subject, instructor, and room.
- **Filter** — Filter by program, subject, instructor, or room to focus on specific sessions.
- **Drag to reschedule** — Drag a session to a new time slot. The system checks for conflicts before saving.
- **Set availability** — Define recurring availability patterns for instructors and rooms (e.g., "available Mon–Fri, 08:00–16:00").
- **Export** — Download the calendar as Excel or PDF. Requires `export` permission on `summary-dashboard`.

## Data scope (HR / Admin on one program)

If HR or Admin has **User Category Access** on Program A and matrix permission for availability or calendar **View**:

- Dropdowns (program, subject, class, instructor) list only scoped entities.
- Calendar sessions and availability blocks outside Program A are hidden.
- Chart widgets on Summary Dashboard use the same scoped APIs.

Super Admin sees all programs. See [User Access & Permissions](/en/user-access) for the full model.

## Validations & business rules

- **Conflict detection** — The system warns about scheduling conflicts before saving:
  - **Teacher conflict** — An instructor cannot be in two sessions at the same time.
  - **Classroom conflict** — A room cannot host two sessions simultaneously.
  - **Max sessions exceeded** — Daily or weekly session limits for an instructor or room cannot be exceeded.
  - **Weekend conflict** — Sessions cannot be scheduled on weekends (configurable).
  - **Holiday conflict** — Sessions cannot be scheduled on holidays defined in the system.
  - **Break time conflict** — Sessions cannot overlap with configured break times.
- **Bilingual conflict messages** — All conflict warnings are displayed in both Arabic and English.
- **Capacity check** — The number of enrolled students in a class cannot exceed the room's capacity.
- **Availability enforcement** — Sessions can only be scheduled during the instructor's and room's defined availability windows. If no availability is set, the system warns but may allow scheduling depending on configuration.
- **Session duration** — Minimum session duration is 30 minutes. Maximum is 8 hours.
- **Recurring sessions** — You can create recurring sessions (daily, weekly, bi-weekly) with an optional end date.
- **Timezone** — All times are displayed in the user's local timezone but stored in UTC.

## Prerequisites

- Instructors and rooms must be set up in the system before scheduling sessions.
- Instructor and room availability should be defined to avoid conflict warnings.
- Classes must be created in the [Dashboard](/en/dashboard) Classes tab before they can be scheduled.

## Limitations

- You cannot create sessions in the past.
- The calendar view is limited to 90 days forward and 90 days backward.
- Drag-to-reschedule is only available in the week view, not in day or month views.
- Room capacity changes do not retroactively affect already-scheduled sessions.

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Conflict warning when creating a session | The instructor or room is already booked, or the date falls on a holiday/weekend. Choose a different time slot, date, or resource. Check the conflict type in the warning message. |
| Cannot drag a session to a new time | Drag-to-reschedule only works in week view. Switch to week view and try again. |
| Instructor not appearing in dropdown | Ensure the instructor has availability set up. Go to Instructor Availability screen. |
| Room capacity exceeded warning | The enrolled class size exceeds the room's capacity. Choose a larger room or reduce the class size. |
| Session not visible on calendar | Check the date range — the calendar shows 90 days forward/backward. Use the date picker to navigate. |

## Related articles

- [Attendance](/en/attendance) — Sessions must exist on the calendar before attendance can be taken.
- [Dashboard](/en/dashboard) — Classes tab defines the class sections that scheduling uses.
- [Notifications](/en/notifications) — Instructors and students receive notifications when sessions are created or changed.
- [Workflow](/en/workflow) — Scheduling conflicts or room changes can trigger workflow approvals.
