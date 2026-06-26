---
title: FAQ
tags: [faq, questions, answers, troubleshooting]
route: /faq
order: 97
keywords: [faq, frequently asked questions, help, login, password, permissions, attendance, quiz, upload, notifications]
---

# Frequently Asked Questions

Quick answers to the most common questions about the Military LMS.

## Getting started

### How do I log in?

Use your Keycloak credentials provided by your administrator. Navigate to the login page and enter your username and password. If you've forgotten your password, contact your administrator — password resets are managed through Keycloak.

### How do I change my password?

Go to [Profile & Settings](/en/profile), enter your current password, then set a new one. The new password must be at least 8 characters with a mix of letters and numbers. See the [Profile article](/en/profile) for details.

### How do I switch between English and Arabic?

Use the language toggle in the top bar, or go to [Profile & Settings](/en/profile) and select your preferred language. Your choice is saved and applied on every login.

### Why can't I see a specific tab or screen?

Your access is controlled by [Role-Based Access Control](/en/glossary) (RBAC). Each screen requires specific permissions. If a tab is missing, you likely lack the `view` permission for that screen. Contact your administrator or check the [Permission Matrix](/en/profile) (Super Admin only).

## Attendance

### Why can't I take attendance for a class?

Ensure a class session exists on the [Scheduling](/en/scheduling) calendar for today's date. You also need at least `view` permission on the `attendance` screen. See [Attendance prerequisites](/en/attendance#prerequisites).

### The QR scanner won't open — what do I do?

Check your browser camera permissions. Click the camera icon in the address bar and allow access. If the issue persists, use manual input as a fallback. See the [Attendance troubleshooting table](/en/attendance#troubleshooting).

### Can I edit attendance after submitting?

Yes, within the editable attendance window. All edits are logged with your username, timestamp, and the previous value for audit purposes. Outside the window, records are locked.

## Quizzes

### Why can't my students see the quiz I created?

Ensure the quiz is **published** and assigned to the correct program/subject. Also verify the due date hasn't passed. See the [Quizzes troubleshooting table](/en/quizzes#troubleshooting).

### Can I edit quiz questions after a student has submitted?

No. Questions are locked once any student submits an attempt, to preserve integrity. You would need to create a new quiz version.

### Why isn't auto-grading working?

Only multiple-choice and true/false questions are auto-graded. Essay questions require manual grading via the [Dashboard](/en/dashboard) Marks Entry tab.

## Files & Smart Drive

### What's the maximum file size I can upload?

Individual files are limited to **500 MB**. For larger files, contact your administrator. Bulk ZIP downloads are limited to **2 GB** total. See [Smart Drive](/en/smart-drive).

### How long do deleted files stay in Trash?

Deleted files remain in Trash for **30 days** before permanent removal. You can restore them at any time during this period. Note: Trash items still count against your storage quota.

### Why can't the recipient see a file I shared?

Sharing does not push in real time. Ask the recipient to refresh their Smart Drive page. See the [Smart Drive troubleshooting table](/en/smart-drive#troubleshooting).

## Notifications

### Why is my unread badge showing the wrong count?

Refresh the page — the badge syncs on page load. If it persists, clear your browser cache and reload. See the [Notifications troubleshooting table](/en/notifications#troubleshooting).

### How long are notifications retained?

Notifications are retained for **90 days**. Older notifications are archived and no longer visible.

### Can I delete notifications?

No. You can only mark them as read or unread. To control which notifications you receive, configure your preferences in [Profile & Settings](/en/profile).

## Workflow

### Why is my workflow document stuck in "pending"?

The current approver may not have acted yet. Check the approval chain in the document detail view, or use the delegate option to reassign the task. See the [Workflow troubleshooting table](/en/workflow#troubleshooting).

### Can I edit a workflow document after submission?

Only before the first approval. After the first approval, the document is locked. You must recall it first to make changes.

## Permissions

### How do I get access to a screen I can't see?

Contact your administrator. Only a Super Admin can grant permissions via the [Permission Matrix](/en/profile). If you are a Super Admin, go to Profile & Settings → Permission Matrix and toggle the required operation for your role.

### Why didn't my permission changes take effect immediately?

Permission changes apply to **new sessions**. Users with active sessions need to log out and log back in to see the updated permissions.

## Technical

### The page is showing stale data — how do I fix it?

Do a hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac). This bypasses the browser cache. See [Keyboard Shortcuts](/en/shortcuts).

### What browsers are supported?

The LMS supports modern browsers: Chrome, Firefox, Safari, and Edge (latest versions). Internet Explorer is not supported.

### Who do I contact for technical support?

Contact your organisation's LMS administrator. For system-wide issues, they will escalate to the technical team.

## Related articles

- [Glossary](/en/glossary) — Definitions of technical terms.
- [Keyboard Shortcuts](/en/shortcuts) — Quick reference for all shortcuts.
- [Help Center](/en) — Overview of roles and system navigation.
- [What's New](/en/changelog) — Recent updates and changes.
