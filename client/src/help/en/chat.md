---
title: Chat
tags: [chat, messaging, communication]
route: /chat
order: 30
---

# Chat

The Chat screen provides real-time messaging between users. It supports text messages, file attachments, and conversation search.

## Who can access

| Role | Operations | What they can do |
| --- | --- | --- |
| Super Admin | view, create | Chat with any user |
| Admin | view, create | Chat with any user |
| HR | view, create | Chat with any user |
| Instructor | view, create | Chat with students and other instructors |
| Student | view, create | Chat with instructors and classmates |

> **Screen ID:** `chat` — Requires `view` and `create` operations. All authenticated users have chat access.

## Key actions

- **Start a conversation** — Select a user from the contact list to begin chatting.
- **Send messages** — Type and send text messages in real time. Messages are delivered instantly — no refresh needed.
- **Attach files** — Upload files from [Smart Drive](/en/smart-drive) or your device.
- **Search** — Search through conversations and message content.
- **Pin conversations** — Pin important conversations to the top of your list for quick access.
- **Unread badges** — The navbar shows a count of unread messages.

## Validations & business rules

- **Real-time delivery** — Messages use WebSocket connections. If the connection drops, the system reconnects automatically.
- **Message ordering** — Messages are ordered by server timestamp, not client time, to prevent ordering issues.
- **File size limit** — Attachments are limited to 50 MB per file. Larger files should be shared via [Smart Drive](/en/smart-drive).
- **User availability** — The contact list shows which users are currently online (green indicator) or offline.
- **Message history** — All messages are persisted. You can scroll up in any conversation to load older messages.

## Limitations

- You cannot delete sent messages — only the recipient can delete them from their view.
- Group chats are not currently supported — only one-to-one conversations.
- Message search is limited to the last 90 days. Older messages are accessible by scrolling but not searchable.

## Related articles

- [Notifications](/en/notifications) — Chat messages can trigger notifications.
- [Smart Drive](/en/smart-drive) — Share files via chat by attaching them from your drive.
- [Profile & Settings](/en/profile) — Manage your chat notification preferences.
