---
title: What's New
tags: [changelog, updates, whats new, release notes]
route: /changelog
order: 98
keywords: [changelog, whats new, updates, release notes, new features, improvements, bug fixes]
---

# What's New

Recent updates and improvements to the Military LMS help documentation.

## Recent Updates — Attendance, Chat, Workflow, and Reports

### Attendance

- **Official attendance reports** — Generate formal daily and violations reports with serial numbers, watermarks, and official formatting in PDF or Excel format.
- **Attendance violations modal** — New modal with date range selection (from/to), subject multi-select, and violation type filtering (Absent No Excuse, Excused Leave, Late, Human Case).
- **Export history drawer** — Centralized drawer showing all past exports with filters by type (`attendance_daily`, `official`, `behavioral`, `penalty`, `summary`) and format (`pdf`, `excel`).
- **Behavioral and penalty report exports** — Export attendance violations as behavioral Excel reports or penalty reports, all logged in export history.
- **Standup attendance mode** — Program-level selection for standup attendance with separate API endpoint and official report support.
- **Message instructor** — Admin/HR/Super Admin can message the class instructor directly from the attendance screen via chat.
- **Export auto-save to Smart Drive** — All exports are automatically saved to Smart Drive → Exported Files.

### Chat

- **Group chats** — Create multi-user group chats with admin management (rename, assign admin, leave, room stats).
- **Direct messages** — One-to-one conversations with any user, created on-demand.
- **Global chat** — System-wide chat room for all authenticated users.
- **Voice messages** — Record and send audio clips directly in chat.
- **Message reactions** — Toggle emoji reactions on any message.
- **Polls** — Create polls with multiple options and real-time vote tracking.
- **Star and pin messages** — Bookmark important messages or pin them in group chats.
- **Read receipts** — Track which messages have been read by participants.
- **Message editing and deletion** — Edit or delete your own sent messages.

### Workflow

- **Weekly attendance summary** — HR can generate `ATTENDANCE_WEEKLY` documents that aggregate daily attendance documents over a date range.
- **Signed document upload** — Admin can upload signed versions of weekly summary documents with version tracking.
- **Behavioral and penalty report connection** — Attendance violations flow into behavioral exports and penalty reports that can be submitted through workflow.
- **Automated SLA monitoring** — Cron job runs every 6 hours to check for overdue workflow items.
- **Attendance threshold check** — Cron job runs every 6 hours to trigger alerts when attendance thresholds are exceeded.

### Scheduling

- **Holiday and weekend conflict detection** — Sessions cannot be scheduled on holidays or weekends with bilingual conflict messages.
- **Expanded conflict types** — Teacher conflict, classroom conflict, max sessions exceeded, weekend, holiday, and break time conflicts.

## June 2026 — Documentation Overhaul

### New features

- **Bilingual help center** — Complete documentation available in both English and Arabic with full RTL support.
- **Nextra-powered docs** — Migrated to Nextra for a modern, searchable documentation experience with sidebar navigation, dark mode, and `Ctrl+K` command palette.
- **Role×screen access matrix** — Added a comprehensive access matrix to the [Help Center](/en) index page showing which roles can access each screen and at what level.
- **Common workflow guides** — Added step-by-step workflow paths for taking attendance, creating quizzes, and submitting workflow requests.
- **Sidebar separators** — Grouped articles by category: Getting Started, Academic, Operations, Communication, Files, and Account.

### New pages

- [Glossary](/en/glossary) — Definitions of all technical terms used in the documentation.
- [Keyboard Shortcuts](/en/shortcuts) — Quick reference for all available keyboard shortcuts.
- [FAQ](/en/faq) — Frequently asked questions with quick answers.
- [What's New](/en/changelog) — This page — release notes for documentation updates.

### Content improvements

- **Prerequisites sections** — Added to [Attendance](/en/attendance), [Quizzes](/en/quizzes), and [Scheduling](/en/scheduling) to clarify what must be set up before using each feature.
- **Troubleshooting tables** — Added to all 10 main articles with 4–5 common problems and solutions each.
- **Bidirectional cross-links** — Every article now links to related screens, and those screens link back, enabling end-to-end workflow navigation.
- **Role-based access tables** — Every article now includes a "Who can access" table showing which roles can use the screen and what operations they can perform.
- **Validations & business rules** — Every article documents the key validations, business logic, and data integrity rules for that screen.
- **Limitations** — Every article explicitly lists what you cannot do and edge cases to be aware of.

### Search optimization

- Added `keywords` to frontmatter on all articles for improved Nextra search ranking.
- Articles are tagged with relevant terms for better discoverability.

## Related articles

- [Help Center](/en) — Overview of roles and system navigation.
- [Glossary](/en/glossary) — Definitions of technical terms.
- [FAQ](/en/faq) — Frequently asked questions.
