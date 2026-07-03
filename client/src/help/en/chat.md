---
title: Chat
tags: [chat, messaging, communication, groups, direct messages, polls, reactions, voice messages]
route: /chat
order: 30
keywords: [chat, messaging, real-time, WebSocket, instant message, file attachment, contact list, unread badge, conversation, pin, group chat, direct message, DM, global chat, voice message, reactions, polls, star message, read receipts, group admin, room stats, leave group, assign admin, online status, wallpaper, lightbox, participant management, group info, media tab, documents tab, starred filter]
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
- **Start a DM** — Click the new DM button to open the **DM Picker Drawer**. Search for a user by name and click to start a direct message. The drawer shows all users you can message, with search and filtering. The other person's name is shown in the DM header instead of a generic label.
- **Create a group** — Click the new group button to open the **Group Chat Modal**. Enter a group name (English and/or Arabic), filter members by role, search by name, select users from the list, and confirm. The creator becomes the group admin. A guided tour is available for first-time group creation.
- **Message instructor** — From the [Attendance](/en/attendance) screen, admins/HR can click the message button to open a DM with the class instructor in a new tab.

### Sending messages

- **Text messages** — Type and send text messages in real time. Messages are delivered instantly via WebSocket — no refresh needed. URLs in messages are automatically linkified.
- **File attachments** — Upload files from [Smart Drive](/en/smart-drive) or your device. Supported types include images, videos, documents, and archives. File names are shortened for display (e.g., `jpeg` → `JPG`, `docx` → `DOC`).
- **Voice messages** — Record and send audio clips directly in the chat. Press the microphone icon to start recording, press again to stop, or cancel. Recording duration is tracked and displayed on playback. Voice messages require microphone permission.
- **Image previews** — Images sent in chat show an inline thumbnail. Click any image to open an in-app lightbox preview.
- **Message editing** — Edit your own sent messages. The updated message is broadcast to all participants in real time.
- **Message deletion** — Delete your own messages. The deletion is synced to all participants.

### Message interactions

- **Reactions** — Toggle emoji reactions on any message. Reactions are visible to all room participants.
- **Star messages** — Bookmark important messages for quick reference later. Starred messages are private to you — other users cannot see which messages you have starred.
- **Starred messages filter** — Toggle the starred filter button in the chat header to show only starred messages in the current conversation. A count badge on the button shows the number of starred messages. Click the toggle again to return to the normal message view.
- **Pin messages** — Pin important messages to the top of the conversation. Available in group chats only. Pinned messages are visible to all group members. A **pinned message banner** appears at the top of the chat showing the pinned content and sender name — click it to scroll to the original message.
- **Read receipts** — The system tracks which messages have been read by each participant. Read receipts are synced in real time.
- **Image lightbox** — Click any image in a chat message to open an in-app lightbox preview instead of opening a new tab. Close the lightbox by clicking outside the image or pressing Escape.
- **URL linkification** — URLs in text messages are automatically converted to clickable links.

### Polls

- **Create a poll** — Click the poll button in the chat input area to open the poll modal. Enter a question and two or more options. Submit to post the poll in the chat room.
- **Vote on a poll** — Select an option to vote. Votes are tallied in real time and visible to all participants.
- **Real-time updates** — Poll results update instantly as new votes come in via WebSocket.
- **Poll display** — Polls appear as special message cards in the conversation with the question, options, vote counts, and percentages.

### Group chat management

- **Create group** — Any user can create a group chat. The creator becomes the group admin. The Group Chat Modal includes role filtering, user search, and a member list with avatars.
- **Rename group** — The group admin can rename the group (supports English and Arabic names) via `updateGroupRoom`.
- **Assign admin** — The group admin can transfer the admin role to another member via `assignGroupAdmin`. A confirmation dialog appears before the transfer is completed.
- **Leave group** — Any member can leave a group chat via `leaveGroupRoom`. A confirmation dialog appears before leaving.
- **Participant management** — The group admin can open the **Participant Management Modal** to view all members with their avatars, roles, and online status. Admins can assign a new admin or remove themselves from the group from this modal.
- **Members side drawer** — Click the member count in the chat header to open a side drawer showing all group members. Quick actions are available per member.
- **Room stats** — View message count, media count, document count, and link count for a group chat via `getRoomStats`.
- **Group info panel** — Click the group name or info icon to open the **Group Info Panel**, a slide-out drawer with multiple tabs:
  - **Media** — All images and videos shared in the group, displayed as a thumbnail grid. Click to open the lightbox.
  - **Documents** — All files and documents shared in the group, with file type icons, names, and sizes.
  - **Links** — All URLs shared in the group, extracted from messages.
  - Each tab includes a search bar to filter items.

### Chat customization

- **Wallpaper picker** — Customize the chat background for any conversation. Choose from preset wallpaper themes. The wallpaper is saved per room using room-specific localStorage keys, with a fallback to global preferences. Each room can have a different wallpaper.
- **DM display name** — Direct message conversations show the other person's name in the header instead of a generic "Direct Message" label.

### Drawers and panels

The chat interface uses several slide-out drawers and panels:

| Drawer / Panel | How to open | What it shows |
| --- | --- | --- |
| **DM Picker Drawer** | Click the new DM (+) button in the sidebar | Searchable list of all users you can message. Click a user to start a DM. |
| **Members Side Drawer** | Click the member count in the chat header | List of all group members with avatars, roles, and quick actions. |
| **Group Info Panel** | Click the group name or info icon | Tabs for Media, Documents, and Links shared in the group, with search. |
| **Participant Management Modal** | From the Group Info Panel | Manage members — assign admin, leave group, view roles and status. |
| **Pinned Message Banner** | Appears automatically when a message is pinned | Shows pinned message content and sender. Click to scroll to the message. |
| **Starred Messages Filter** | Click the star button in the chat header | Filters the conversation to show only your starred messages, with a count badge. |

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
