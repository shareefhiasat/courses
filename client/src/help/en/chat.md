---
title: Chat
tags: [chat, messaging, communication, groups, direct messages, polls, reactions, voice messages]
route: /chat
order: 30
keywords: [chat, messaging, real-time, WebSocket, instant message, file attachment, contact list, unread badge, conversation, pin, group chat, direct message, DM, global chat, voice message, reactions, polls, star message, read receipts, group admin, room stats, leave group, assign admin, online status]
---

# Chat

The Chat screen provides real-time messaging between users. It supports four room types — class chats, direct messages, group chats, and a global chat — with text messages, file attachments, voice messages, reactions, polls, message starring and pinning, read receipts, and group management features.

## Who can access

| Role | Operations | What they can do |
| --- | --- | --- |
| Super Admin | view, create | Chat in any room, create groups, manage groups they created |
| Admin | view, create | Chat in any room, create groups, manage groups they created |
| HR | view, create | Chat in any room, create groups, manage groups they created |
| Instructor | view, create | Chat with students and other instructors, create groups |
| Student | view, create | Chat with instructors and classmates, create groups |

> **Screen ID:** `chat` — Requires `view` and `create` operations. All authenticated users have chat access.

## Chat room types

The system supports four types of chat rooms:

| Room type | Description |
| --- | --- |
| **Class chat** | Automatically created for each class. All enrolled students and the instructor are members. Messages are visible to all class members. |
| **Direct message (DM)** | One-to-one conversation between any two users. Created on-demand when you select a user from the contact list or use the "message instructor" feature from [Attendance](/en/attendance). |
| **Group chat** | Multi-user room created by any user. The creator becomes the group admin. Members can be added by the admin. |
| **Global chat** | System-wide chat room available to all authenticated users. Useful for announcements and organization-wide communication. |

## Key actions

### Starting a conversation

- **Select a room** — Choose a class chat, DM, group, or the global chat from the sidebar.
- **Start a DM** — Select a user from the contact list to create or open a direct message room via `createDM`.
- **Create a group** — Create a new group chat, add members, and set a group name (supports both English and Arabic names).

### Sending messages

- **Text messages** — Type and send text messages in real time. Messages are delivered instantly via WebSocket — no refresh needed.
- **File attachments** — Upload files from [Smart Drive](/en/smart-drive) or your device.
- **Voice messages** — Record and send audio clips directly in the chat.
- **Message editing** — Edit your own sent messages. The updated message is broadcast to all participants in real time.
- **Message deletion** — Delete your own messages. The deletion is synced to all participants.

### Message interactions

- **Reactions** — Toggle emoji reactions on any message. Reactions are visible to all room participants.
- **Star messages** — Bookmark important messages for quick reference later. Starred messages are private to you.
- **Pin messages** — Pin important messages to the top of the conversation. Available in group chats only. Pinned messages are visible to all group members.
- **Read receipts** — The system tracks which messages have been read by each participant. Read receipts are synced in real time.

### Polls

- **Create a poll** — Create a poll with multiple options within any chat room.
- **Vote on a poll** — Select an option to vote. Votes are tallied in real time and visible to all participants.
- **Real-time updates** — Poll results update instantly as new votes come in via WebSocket.

### Group chat management

- **Create group** — Any user can create a group chat. The creator becomes the group admin.
- **Rename group** — The group admin can rename the group (supports English and Arabic names) via `updateGroupRoom`.
- **Assign admin** — The group admin can transfer the admin role to another member via `assignGroupAdmin`.
- **Leave group** — Any member can leave a group chat via `leaveGroupRoom`.
- **Room stats** — View message count, media count, document count, and link count for a group chat via `getRoomStats`.

### Sidebar and navigation

- **Room list** — The sidebar shows all your class chats, DMs, and group chats. The global chat appears at the top.
- **Search** — Search through conversations and message content.
- **Pin conversations** — Pin important conversations to the top of your sidebar for quick access.
- **Unread badges** — The navbar shows a count of unread messages. Individual rooms show unread badges in the sidebar.
- **Online status** — The contact list shows which users are currently online (green indicator) or offline.

## Validations & business rules

- **Real-time delivery** — Messages use WebSocket connections. If the connection drops, the system reconnects automatically.
- **Message ordering** — Messages are ordered by server timestamp, not client time, to prevent ordering issues.
- **File size limit** — Attachments are limited to 50 MB per file. Larger files should be shared via [Smart Drive](/en/smart-drive).
- **User availability** — The contact list shows which users are currently online or offline.
- **Message history** — All messages are persisted. You can scroll up in any conversation to load older messages.
- **Group admin permissions** — Only the group admin can rename the group, assign a new admin, or add members.
- **Pin messages restriction** — Message pinning is only available in group chats, not in DMs or class chats.
- **Edit/delete own messages** — You can only edit or delete your own messages. Other users' messages cannot be modified.
- **Poll voting** — Each user can vote once per poll option. Vote changes are tracked.

## Limitations

- Message search is limited to the last 90 days. Older messages are accessible by scrolling but not searchable.
- Group chat creation is available to all users, but group admins cannot remove other members — members must leave voluntarily.
- Voice message recording requires microphone access. If the browser blocks microphone permissions, text messages are the fallback.
- Read receipts may have a slight delay on slow network connections.

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Messages not sending | Check your network connection. If the WebSocket indicator shows "disconnected", wait for auto-reconnect or refresh the page. |
| Contact list is empty | Ensure other users exist in the system. If you are a student, you may only see instructors and classmates. |
| File attachment fails | File exceeds 50 MB limit. Share larger files via [Smart Drive](/en/smart-drive) instead. |
| Messages appear out of order | Messages are ordered by server timestamp. If your device clock is off, enable automatic time sync. |
| Unread badge not updating | Refresh the page. The badge updates on page load and via WebSocket events. |
| Cannot create a group chat | Verify you have `create` permission on the `chat` screen. Contact your administrator. |
| Voice message won't record | Check browser microphone permissions. Click the microphone icon in the address bar and allow access. |
| Poll votes not updating | The WebSocket connection may be interrupted. Refresh the page to see the latest poll results. |
| Cannot pin a message | Pinning is only available in group chats. In DMs or class chats, use star messages instead. |
| Cannot edit or delete a message | You can only edit or delete your own messages. Verify the message was sent by you. |

## Related articles

- [Notifications](/en/notifications) — Chat messages can trigger notifications.
- [Smart Drive](/en/smart-drive) — Share files via chat by attaching them from your drive.
- [Profile & Settings](/en/profile) — Manage your chat notification preferences.
- [Attendance](/en/attendance) — The "message instructor" feature opens a direct message in chat.
