---
title: Workflow
tags: [workflow, approval, inbox, compliance, analytics]
route: /workflow/inbox
order: 50
---

# Workflow

The Workflow system manages approval processes and document routing. It ensures that requests (leave, training, equipment, etc.) follow the correct approval chain before being executed.

## Who can access

| Role | Operations | What they can do |
| --- | --- | --- |
| Super Admin | view, create, update, delete | Full workflow management |
| Admin | view, create, update, delete | Create and manage workflow documents |
| HR | view, create, update | Initiate and approve workflow documents |
| Instructor | view, create, update | Submit and track workflow requests |
| Student | view | View their own submitted requests |

> **Screen ID:** `workflow` — Requires `view` operation. Create/update/delete require corresponding permissions.

## Screens

| Screen | Description |
| --- | --- |
| **Inbox** | View tasks assigned to you that need action. Shows pending, completed, and overdue items. |
| **Document Detail** | Review a workflow document's metadata, approval chain, comments, and attachments. |
| **Calendar Compliance** | View due dates and overdue items on a calendar. Helps track deadlines visually. |
| **Analytics** | KPIs and charts showing workflow performance — approval times, bottleneck stages, and completion rates. |

## Key actions

- **Submit a request** — Create a new workflow document by selecting a template and filling in the required fields.
- **Approve/Reject** — Take action on a task in your inbox. You must provide a comment when rejecting.
- **Comment** — Add a comment to a workflow document at any stage. Comments are visible to all participants.
- **Delegate** — Assign a task to another user. The original assignee is notified, and the delegation is logged.
- **Recall** — The submitter can recall a document before the first approval is made.

## Validations & business rules

- **Approval chain** — Each workflow template defines an ordered approval chain. The document moves to the next approver only after the current one approves.
- **Comment required on rejection** — You cannot reject a workflow document without providing a reason.
- **Delegation log** — All delegations are logged with the delegator, delegatee, timestamp, and reason.
- **Due dates** — Each stage has an optional due date. Overdue items appear in red in the Inbox and on the Compliance Calendar.
- **Document locking** — While a document is being reviewed, it is locked — the submitter cannot edit it until the review is complete or the document is recalled.
- **Auto-escalation** — If an approver does not act within the configured timeout, the task can be auto-escalated to their supervisor.

## Limitations

- You cannot edit a workflow document after the first approval — you must recall it first.
- Parallel approvals (multiple approvers at the same stage) are not supported in the current version.
- Analytics data is aggregated daily — real-time workflow metrics are not available.

## Related articles

- [Notifications](/en/notifications) — You receive notifications when workflow tasks are assigned or completed.
- [Dashboard](/en/dashboard) — Scheduled Reports tab can generate workflow performance reports.
- [Profile & Settings](/en/profile) — Manage your workflow notification preferences.
- [Scheduling](/en/scheduling) — Workflow due dates appear on the compliance calendar alongside scheduling events.
