---
title: Help Center
tags: [help, welcome, getting started]
route: /help
order: 0
keywords: [help center, welcome, getting started, roles, super admin, admin, HR, instructor, student, access matrix, workflows, RBAC, navigation, permissions]
---

# Help Center

Welcome to the **Military LMS Help Center**. This documentation covers every screen in the system — what it does, who can access it, what validations apply, and how it connects to other screens.

## How to use this site

- **Search** — Use the search bar at the top or press `Ctrl+K` (or `Cmd+K` on Mac) to find any article instantly.
- **Sidebar** — Browse articles grouped by category in the left sidebar: Getting Started, Academic, Operations, Communication, Files, and Account.
- **Language** — Switch between English and Arabic using the language toggle in the top bar.
- **Cross-links** — Every article links to related screens so you can follow a workflow end-to-end.

## Getting started

If you are new to the system, read these articles first:

1. [Home](/en/home) — Overview of the home page, role-based widgets, and navigation.
2. [Dashboard](/en/dashboard) — The administrative hub: activities, announcements, resources, programs, and more.
3. [Attendance](/en/attendance) — Taking attendance, QR scanner, and HR attendance.
4. [Quizzes](/en/quizzes) — Creating, previewing, and taking quizzes.

## Roles in the system

The LMS uses role-based access control. Your role determines which screens you can see and what actions you can perform.

| Role | Description |
| --- | --- |
| **Super Admin** | Full access to all screens, settings, and the Permission Matrix. Can override any configuration. |
| **Admin** | Manage academic content, users, enrollments, and operations. Cannot access the Permission Matrix. |
| **HR** | Manage attendance, penalties, and user accounts. Focused on personnel operations. |
| **Instructor** | Create activities and quizzes, take attendance, schedule sessions, and enter marks. |
| **Student** | View assigned content, take quizzes, check attendance, and track progress. |

> Permissions are managed through the [Permission Matrix](/en/profile) (Super Admin only).

## Screen access by role

| Screen | Super Admin | Admin | HR | Instructor | Student |
| --- | --- | --- | --- | --- | --- |
| [Home](/en/home) | ✅ | ✅ | ✅ | ✅ | ✅ |
| [Dashboard](/en/dashboard) | ✅ All tabs | ✅ Most tabs | ✅ Users, ops | ✅ Academic tabs | ❌ |
| [Quizzes](/en/quizzes) | ✅ Full | ✅ Full | ❌ | ✅ Manage | ✅ Take |
| [Attendance](/en/attendance) | ✅ Full | ✅ Full | ✅ Bulk | ✅ Take | ✅ View |
| [Scheduling](/en/scheduling) | ✅ Full | ✅ Full | ✅ View | ✅ Manage | ✅ View |
| [Workflow](/en/workflow) | ✅ Full | ✅ Full | ✅ Approve | ✅ Submit | ✅ View |
| [Chat](/en/chat) | ✅ | ✅ | ✅ | ✅ | ✅ |
| [Notifications](/en/notifications) | ✅ | ✅ | ✅ | ✅ | ✅ |
| [Smart Drive](/en/smart-drive) | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Limited |
| [Profile](/en/profile) | ✅ + Matrix | ✅ | ✅ | ✅ | ✅ |

## Common workflows

### Taking attendance for a class

1. Open [Scheduling](/en/scheduling) to confirm the session exists on the calendar.
2. Go to [Attendance](/en/attendance) and select the class session.
3. Mark each student or use the QR scanner for fast check-in.
4. Review and submit. Absences automatically feed into penalties and participation.

### Creating and publishing a quiz

1. Open [Quizzes](/en/quizzes) and click **Create quiz**.
2. Add questions, set the time limit and passing score.
3. Preview the quiz to verify the student experience.
4. Publish when ready. Students receive a [notification](/en/notifications) automatically.
5. Review results in the [Dashboard](/en/dashboard) Marks Entry tab.

### Submitting a workflow request

1. Go to [Workflow](/en/workflow) and click **Submit a request**.
2. Select a template and fill in the required fields.
3. The document routes through the approval chain automatically.
4. Track progress in your inbox. You'll receive [notifications](/en/notifications) at each stage.

## Related articles

- [Profile & Settings](/en/profile) — Manage your account, language, theme, and permissions.
- [Dashboard](/en/dashboard) — The administrative hub for all management screens.
