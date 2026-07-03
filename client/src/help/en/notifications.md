---
title: Notifications
tags: [notifications, alerts, inbox]
route: /notifications
order: 31
keywords: [notifications, alerts, inbox, unread, read, mark as read, filter, announcement, quiz results, attendance alert, workflow task, chat message, scheduling change, email, push notifications, standup attendance, drive folder, drive comment, public link, workflow comment, workflow withdrawn, behavioral, penalty, participation, marks, resources, bilingual]
---

# Notifications

The Notifications screen shows all system notifications in one place — announcements, quiz results, attendance alerts, workflow tasks, chat messages, drive activity, behavioral incidents, and more. Notifications are bilingual (English and Arabic) and include contextual details such as sender name, class name, and student status.

Notifications are generated automatically by the system when events occur. You receive notifications addressed to you directly, to your role, or to a class you are a member of. A real-time unread badge in the navbar keeps you informed of new activity.

## Who can access

| Role | Operations | What they can do |
| --- | --- | --- |
| Super Admin | view, update | View and manage all notifications |
| Admin | view, update | View and manage notifications |
| HR | view, update | View and manage notifications |
| Instructor | view, update | View and manage their notifications |
| Student | view, update | View and manage their notifications |

> **Screen ID:** `notifications` — Requires `view` operation. `update` is needed to mark as read/unread.

## Notification delivery channels

Notifications are delivered through multiple channels:

| Channel | Description |
| --- | --- |
| **In-app notification drawer** | Slide-out drawer accessible from the navbar bell icon. Shows recent notifications with icons, category colors, and deep links. |
| **Notifications page** | Full-page view at `/notifications` with filtering, bulk actions, and complete history. |
| **Navbar unread badge** | Real-time count of unread notifications displayed on the bell icon. Updates via WebSocket. |
| **Email** | Optional email delivery based on your notification preferences configured in [Profile & Settings](/en/profile). |
| **Browser push** | Optional browser push notifications. Requires browser permission. |

## Key actions

- **Read notifications** — Click a notification to view its full details. Some notifications include deep links to the relevant screen.
- **Mark as read/unread** — Toggle read status individually or in bulk.
- **Filter** — Filter by type, date range, or importance level.
- **Category colors** — Each notification category has a distinct color for quick visual identification:

  | Category | Color |
  | --- | --- |
  | Assessment | Blue |
  | Communication | Amber |
  | Announcement | Cyan |
  | Attendance | Orange |
  | Workflow | Purple |
  | Behavior | Pink |
  | File / Drive | Indigo |
  | QR | Teal |
  | Participation | Green |
  | Penalty | Red |
  | Resource | Indigo |
  | Academic | Blue |
  | System | Gray |

- **Settings** — Configure which notifications you receive via the [Profile & Settings](/en/profile) page.

## Notification types

### Academic & Assessment

| Type | Trigger | Related screen |
| --- | --- | --- |
| **Announcement** | New announcement posted | [Dashboard](/en/dashboard) → Announcements |
| **Quiz Result** | Quiz auto-graded or manually graded | [Quizzes](/en/quizzes) |
| **Marks Posted** | Grade posted or marks updated (single or batch) | [Dashboard](/en/dashboard) → Marks Entry |
| **Resource Added** | New resource uploaded, updated, or deleted | [Dashboard](/en/dashboard) → Resources |

### Attendance

| Type | Trigger | Related screen |
| --- | --- | --- |
| **Attendance Alert** | Student marked absent or late | [Attendance](/en/attendance) |
| **Attendance Updated** | Attendance record updated | [Attendance](/en/attendance) |
| **Standup Attendance Marked** | Student marked at morning standup | [Attendance](/en/attendance) |
| **Standup Attendance Updated** | Standup attendance record updated | [Attendance](/en/attendance) |

### Workflow

| Type | Trigger | Related screen |
| --- | --- | --- |
| **Workflow Task** | New task assigned to you (submit, approve, review) | [Workflow](/en/workflow) |
| **Workflow Comment** | Comment added to a workflow document | [Workflow](/en/workflow) |
| **Workflow Withdrawn** | Document withdrawn by submitter | [Workflow](/en/workflow) |
| **Workflow Submitted** | Document submitted for approval | [Workflow](/en/workflow) |
| **Workflow Approved** | Document approved at a stage | [Workflow](/en/workflow) |
| **Workflow Rejected** | Document rejected | [Workflow](/en/workflow) |
| **Workflow Returned** | Document returned to submitter for changes | [Workflow](/en/workflow) |
| **Workflow Resubmitted** | Document resubmitted after rejection | [Workflow](/en/workflow) |
| **Workflow Assigned** | Document assigned to a specific user | [Workflow](/en/workflow) |

### Chat & Communication

| Type | Trigger | Related screen |
| --- | --- | --- |
| **Chat Message** | New chat message in a class, DM, or group room | [Chat](/en/chat) |
| **Chat Mention** | You were mentioned in a chat message | [Chat](/en/chat) |
| **Class Message** | New message in a class chat room | [Chat](/en/chat) |
| **Group Message** | New message in a group chat | [Chat](/en/chat) |
| **Direct Message** | New DM received | [Chat](/en/chat) |

### Smart Drive

| Type | Trigger | Related screen |
| --- | --- | --- |
| **Drive File Shared** | File or folder shared with you | [Smart Drive](/en/smart-drive) |
| **Drive Folder Created** | New folder created | [Smart Drive](/en/smart-drive) |
| **Drive Folder Deleted** | Folder deleted | [Smart Drive](/en/smart-drive) |
| **Drive Folder Restored** | Folder restored from trash | [Smart Drive](/en/smart-drive) |
| **Drive Comment** | Comment added to a file | [Smart Drive](/en/smart-drive) |
| **Drive File Uploaded** | New file uploaded | [Smart Drive](/en/smart-drive) |
| **Drive File Deleted** | File deleted | [Smart Drive](/en/smart-drive) |
| **Public Link Created** | Public link generated for a file | [Smart Drive](/en/smart-drive) |
| **Public Link Revoked** | Public link revoked | [Smart Drive](/en/smart-drive) |

### Operations

| Type | Trigger | Related screen |
| --- | --- | --- |
| **Behavior Recorded** | Positive or negative behavior logged, updated, or deleted | [Dashboard](/en/dashboard) → Behavior |
| **Penalty Recorded** | Penalty incident recorded | [Dashboard](/en/dashboard) → Penalty |
| **Participation Recorded** | Participation points awarded, updated, or deleted | [Dashboard](/en/dashboard) → Participation |

### Scheduling

| Type | Trigger | Related screen |
| --- | --- | --- |
| **Schedule Change** | Session created, moved, or cancelled | [Scheduling](/en/scheduling) |

## Notification payload details

All notification payloads are enriched with bilingual (EN/AR) contextual details:

- **Sender name** — Localized display name of the user who triggered the notification.
- **Recipient type** — `user`, `users`, `role`, or `class` — determines who receives the notification.
- **Recipient details** — `recipientUserId`, `recipientRole`, or `recipientClassId` depending on the recipient type.
- **Contextual vars** — Class name (bilingual), student name (bilingual), status, date, file name, folder name, etc.
- **Deep link** — Direct URL to the relevant screen or record.
- **Priority** — Notification priority level (info, warning, urgent).
- **Category** — Visual category for color coding in the drawer and notifications page.

## Validations & business rules

- **Unread badge** — The navbar shows a count of unread notifications. It updates in real time via WebSocket.
- **Auto-mark as read** — Clicking a notification automatically marks it as read.
- **Retention** — Notifications are retained for 90 days. Older notifications are archived and no longer visible.
- **Per-user scope** — You can only see notifications addressed to you, to your role, or to a class you are a member of.
- **Bulk actions** — You can mark up to 50 notifications as read/unread in a single action.
- **Bilingual support** — All notification content is available in both English and Arabic, displayed according to your language preference.
- **Real-time delivery** — Notifications are pushed in real time via WebSocket. No page refresh needed.

## Limitations

- You cannot delete notifications — only mark them as read or unread.
- Email delivery of notifications depends on your profile settings and the email template configuration.
- Push notifications (browser) require permission to be granted in the browser settings.
- Notification history is limited to 90 days. For longer-term audit trails, use the Notification Logs in the [Dashboard](/en/dashboard).

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Unread badge shows wrong count | Refresh the page. The badge syncs on page load and via WebSocket. If it persists, clear browser cache and reload. |
| Not receiving email notifications | Check your notification preferences in [Profile & Settings](/en/profile). Verify your email address is correct. |
| Browser push notifications not working | Check browser settings → Site Permissions → Notifications. Ensure notifications are allowed for this site. |
| Old notifications disappeared | Notifications are retained for 90 days. Older ones are archived and no longer visible. |
| Cannot mark notifications as read | Try refreshing the page. If the issue persists, check your network connection. |
| Notifications not in my language | Check your language preference in [Profile & Settings](/en/profile). All notifications are bilingual and displayed based on your language setting. |
| Missing notifications for a class | Ensure you are enrolled in the class or assigned as its instructor. Notifications are only sent to members of the class. |

## Related articles

- [Profile & Settings](/en/profile) — Configure which notifications you receive and how.
- [Dashboard](/en/dashboard) — Announcement and notification log tabs.
- [Chat](/en/chat) — Chat messages generate notifications for recipients.
- [Workflow](/en/workflow) — Workflow tasks generate notifications when assigned, approved, or rejected.
- [Smart Drive](/en/smart-drive) — File sharing, comments, and public links generate notifications.
- [Attendance](/en/attendance) — Attendance marking and standup generate notifications.
