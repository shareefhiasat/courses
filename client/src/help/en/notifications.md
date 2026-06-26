---
title: Notifications
tags: [notifications, alerts, inbox]
route: /notifications
order: 31
---

# Notifications

The Notifications screen shows all system notifications in one place — announcements, quiz results, attendance alerts, workflow tasks, and more.

## Who can access

| Role | Operations | What they can do |
| --- | --- | --- |
| Super Admin | view, update | View and manage all notifications |
| Admin | view, update | View and manage notifications |
| HR | view, update | View and manage notifications |
| Instructor | view, update | View and manage their notifications |
| Student | view, update | View and manage their notifications |

> **Screen ID:** `notifications` — Requires `view` operation. `update` is needed to mark as read/unread.

## Key actions

- **Read notifications** — Click a notification to view its full details. Some notifications include deep links to the relevant screen.
- **Mark as read/unread** — Toggle read status individually or in bulk.
- **Filter** — Filter by type, date range, or importance level.
- **Settings** — Configure which notifications you receive via the [Profile & Settings](/en/profile) page.

## Notification types

| Type | Trigger | Related screen |
| --- | --- | --- |
| **Announcement** | New announcement posted | [Dashboard](/en/dashboard) → Announcements |
| **Quiz Result** | Quiz auto-graded or manually graded | [Quizzes](/en/quizzes) |
| **Attendance Alert** | Student marked absent or late | [Attendance](/en/attendance) |
| **Workflow Task** | New task assigned to you | [Workflow](/en/workflow) |
| **Chat Message** | New chat message received | [Chat](/en/chat) |
| **Schedule Change** | Session created, moved, or cancelled | [Scheduling](/en/scheduling) |

## Validations & business rules

- **Unread badge** — The navbar shows a count of unread notifications. It updates in real time.
- **Auto-mark as read** — Clicking a notification automatically marks it as read.
- **Retention** — Notifications are retained for 90 days. Older notifications are archived and no longer visible.
- **Per-user scope** — You can only see notifications addressed to you or broadcast to your role.
- **Bulk actions** — You can mark up to 50 notifications as read/unread in a single action.

## Limitations

- You cannot delete notifications — only mark them as read or unread.
- Email delivery of notifications depends on your profile settings and the email template configuration.
- Push notifications (browser) require permission to be granted in the browser settings.

## Related articles

- [Profile & Settings](/en/profile) — Configure which notifications you receive and how.
- [Dashboard](/en/dashboard) — Announcement and notification log tabs.
- [Chat](/en/chat) — Chat messages also generate notifications.
- [Workflow](/en/workflow) — Workflow tasks generate notifications when assigned.
