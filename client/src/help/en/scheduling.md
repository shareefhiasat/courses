---
title: Scheduling
tags: [scheduling, calendar, availability, classes, rooms, instructors]
route: /scheduling-calendar
order: 60
---

# Scheduling

The Scheduling system manages class sessions, instructor availability, and room booking. It provides a calendar-based interface for creating and managing the academic timetable.

## Who can access

| Role | Operations | What they can do |
| --- | --- | --- |
| Super Admin | view, create, update, delete | Full scheduling management |
| Admin | view, create, update, delete | Full scheduling management |
| HR | view | View scheduling calendar |
| Instructor | view, create, update | Create and manage their own sessions |
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

## Validations & business rules

- **Conflict detection** — The system warns about double-booking before saving:
  - An instructor cannot be in two sessions at the same time.
  - A room cannot host two sessions simultaneously.
- **Capacity check** — The number of enrolled students in a class cannot exceed the room's capacity.
- **Availability enforcement** — Sessions can only be scheduled during the instructor's and room's defined availability windows.
- **Session duration** — Minimum session duration is 30 minutes. Maximum is 8 hours.
- **Recurring sessions** — You can create recurring sessions (daily, weekly, bi-weekly) with an optional end date.
- **Timezone** — All times are displayed in the user's local timezone but stored in UTC.

## Limitations

- You cannot create sessions in the past.
- The calendar view is limited to 90 days forward and 90 days backward.
- Drag-to-reschedule is only available in the week view, not in day or month views.
- Room capacity changes do not retroactively affect already-scheduled sessions.

## Related articles

- [Attendance](/en/attendance) — Sessions must exist on the calendar before attendance can be taken.
- [Dashboard](/en/dashboard) — Classes tab defines the class sections that scheduling uses.
- [Notifications](/en/notifications) — Instructors and students receive notifications when sessions are created or changed.
- [Workflow](/en/workflow) — Scheduling conflicts or room changes can trigger workflow approvals.
