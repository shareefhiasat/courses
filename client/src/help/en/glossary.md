---
title: Glossary
tags: [glossary, terms, definitions, reference]
route: /glossary
order: 95
keywords: [glossary, definitions, terms, keycloak, minio, permission matrix, soft delete, screen id, RBAC, websocket, QR, UTC]
---

# Glossary

Key terms used throughout this documentation and the Military LMS.

## A–F

| Term | Definition |
| --- | --- |
| **Attendance Window** | The editable period during which attendance records can be modified. Outside this window, records are locked. |
| **Bulk Action** | An operation applied to multiple items at once (e.g., marking 50 notifications as read). |
| **Class Session** | A scheduled instance of a class on the [Scheduling](/en/scheduling) calendar. Attendance is taken per session. |
| **Command Palette** | The quick-navigation overlay opened with `Ctrl+K` (or `Cmd+K` on Mac). Allows searching and jumping to any screen. |
| **Compliance Calendar** | A calendar view in [Workflow](/en/workflow) showing due dates and overdue items for approval processes. |
| **Cross-link** | A hyperlink in one help article pointing to a related article, enabling end-to-end workflow navigation. |
| **Deep Link** | A URL that points directly to a specific tab or section (e.g., `/dashboard#programs`). |
| **Due Date** | The deadline for a quiz, workflow stage, or assignment. Past due dates block new submissions. |

## G–M

| Term | Definition |
| --- | --- |
| **HR Attendance** | Bulk attendance recording by HR personnel, typically for organisation-wide events or corrections. |
| **Keycloak** | The identity and access management system that handles user authentication, login, and session management for the LMS. |
| **Lazy Loading** | A technique where tab content is loaded only when the tab is first opened, improving initial page load speed. |
| **Local Storage** | Browser-side storage used for persisting user preferences (language, theme, active tab) across sessions. |
| **MinIO** | The object storage backend that powers [Smart Drive](/en/smart-drive). Stores all uploaded files and attachments. |

## N–S

| Term | Definition |
| --- | --- |
| **Notification Retention** | The 90-day window during which notifications are visible. Older notifications are archived. |
| **Permission Matrix** | A grid in [Profile & Settings](/en/profile) (Super Admin only) showing which roles have which operations on which screens. |
| **QR Code** | A unique scannable code generated per student for fast attendance check-in via the QR scanner. |
| **RBAC** | Role-Based Access Control — the model where user roles (Super Admin, Admin, HR, Instructor, Student) determine screen access and permitted operations. |
| **Redis** | In-memory data store used for caching and real-time features like chat WebSocket connections. |
| **Screen ID** | A unique identifier for each screen (e.g., `attendance`, `quizzes`, `drive`) used by the Permission Matrix and navigation registry. |
| **Soft Delete** | A deletion that marks a record as deleted without removing it from the database. Soft-deleted items can be restored (e.g., Smart Drive files in Trash for 30 days). |

## T–Z

| Term | Definition |
| --- | --- |
| **Troubleshooting** | A section in each help article listing common problems and their solutions. |
| **UTC** | Coordinated Universal Time — all times are stored in UTC and displayed in the user's local timezone. |
| **WebSocket** | A persistent bidirectional connection used for real-time features like [Chat](/en/chat) message delivery and notification updates. |
| **Workflow Template** | A predefined form and approval chain for a specific request type (leave, training, equipment, etc.) in the [Workflow](/en/workflow) system. |

## Related articles

- [Help Center](/en) — Overview of roles and system navigation.
- [Keyboard Shortcuts](/en/shortcuts) — Quick reference for all keyboard shortcuts.
- [FAQ](/en/faq) — Frequently asked questions and answers.
