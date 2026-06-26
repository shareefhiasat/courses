---
title: Workflow
tags: [workflow, approval, inbox, compliance, analytics]
route: /workflow/inbox
order: 50
keywords: [workflow, approval, inbox, document routing, compliance calendar, analytics, delegate, recall, reject, approve, template, escalation, overdue, auto-escalation, send, return, close, resubmit, withdraw, reupload, upload signed, DRAFT, SUBMITTED, UNDER_HR_REVIEW, UNDER_ADMIN_REVIEW, APPROVED, REJECTED, ATTENDANCE_DAILY, custom workflow, workflow trace, SLA, cycle time, rejection reasons, comments, action history]
---

# Workflow

The Workflow system manages approval processes and document routing. It ensures that requests (leave, training, equipment, attendance reports, etc.) follow the correct approval chain before being executed. The system supports multiple document types, role-based approval stages, comments, delegation, recall, and analytics.

## Who can access

| Role | Operations | What they can do |
| --- | --- | --- |
| Super Admin | view, create, update, delete | Full workflow management |
| Admin | view, create, update, delete | Create and manage workflow documents |
| HR | view, create, update | Initiate and approve workflow documents |
| Instructor | view, create, update | Submit and track workflow requests |
| Student | view | View their own submitted requests |

> **Screen ID:** `workflow` — Requires `view` operation. Create/update/delete require corresponding permissions.

## Document states

Workflow documents move through a defined state machine. Each state determines which actions are available to which roles.

| State | Description | Available actions |
| --- | --- | --- |
| **DRAFT** | Document created but not yet submitted. | Send, edit, delete, withdraw |
| **SUBMITTED** | Document sent for approval. | Approve, return, reject, comment, delegate |
| **UNDER_HR_REVIEW** | Document is being reviewed by HR. | Approve, return, reject, comment, delegate |
| **UNDER_ADMIN_REVIEW** | Document is being reviewed by Admin. | Approve, return, reject, comment, delegate |
| **APPROVED** | Document has passed all approval stages. | Close, comment, upload signed, reupload |
| **REJECTED** | Document was rejected at some stage. | Resubmit, comment, withdraw |

## Screens

| Screen | Description |
| --- | --- |
| **Inbox** | View tasks assigned to you that need action. Shows pending, completed, and overdue items. Supports filtering by status, date range, and document type. |
| **Document Detail** | Review a workflow document's metadata, approval chain, action history, comments, attachments, versions, and workflow trace. Take actions (send, approve, return, close, reject, resubmit). |
| **Calendar Compliance** | View due dates and overdue items on a calendar. Helps track deadlines visually. |
| **Analytics** | KPIs and charts showing workflow performance — overall statistics, cycle time, approval rates, rejection reasons, and bottleneck stages. |

## Key actions

### Creating and submitting

- **Create from template** — Select a workflow template and fill in the required fields. The system creates a document in `DRAFT` state via `createWorkflowDocument`.
- **Create custom workflow** — Upload a file from [Smart Drive](/en/smart-drive) and create a custom workflow document around it via `createCustomWorkflow`.
- **Submit attendance report** — From the [Attendance](/en/attendance) screen, export and submit generates an `ATTENDANCE_DAILY` workflow document with the Excel report attached via `submitAttendanceReport`.
- **Send** — Submit a draft document to the first approval stage. Transitions from `DRAFT` to `SUBMITTED` via `sendWorkflowDocument`. Requires a recipient selection.

### Approval actions

- **Approve** — Approve the document at the current stage. Moves it to the next stage in the chain or to `APPROVED` if it's the final stage. An optional comment can be added via `approveWorkflowDocument`.
- **Return** — Return the document to the submitter for changes. Transitions back to `DRAFT` via `returnWorkflowDocument`. A comment explaining the reason is required.
- **Reject** — Reject the document outright. Transitions to `REJECTED` via the rejection action. A comment is mandatory.
- **Close** — Close an approved document. Final state — no further actions except comments. Via `closeWorkflowDocument`.

### Post-decision actions

- **Resubmit** — After rejection, the submitter can resubmit the document. Transitions from `REJECTED` back to `SUBMITTED`.
- **Withdraw** — The submitter can withdraw a document at various stages. Removes it from the approval chain.
- **Reupload** — Replace the attached file on an approved document. Useful when a signed version needs to be uploaded.
- **Upload signed** — Upload a signed/approved version of the document after it has been approved.

### Communication

- **Comment** — Add a comment to a workflow document at any stage. Comments are visible to all participants. Comments can be added and deleted via the Comments tab.
- **Delegate** — Assign a task to another user. The original assignee is notified, and the delegation is logged.
- **Recall** — The submitter can recall a document before the first approval is made. Returns the document to `DRAFT`.

### Analytics

- **Overall statistics** — Total documents, approval rate, rejection rate, and pending count.
- **Cycle time** — Average time from submission to final decision, broken down by stage.
- **Approval rates** — Percentage of documents approved vs. rejected, by document type.
- **Rejection reasons** — Aggregated comments from rejections, showing common reasons.
- **Bottleneck analysis** — Identifies which approval stage takes the longest.

## Inbox features

- **Filtering** — Filter by status (pending, completed, overdue), date range, and document type.
- **SLA notifications** — Items approaching their due date show an SLA warning badge. Overdue items appear in red.
- **Polling** — The inbox automatically refreshes to show new tasks. The `useWorkflowInbox` hook polls for updates.
- **Task count badge** — The navigation bar shows a badge with the count of pending tasks.

## Document detail page

The detail page shows comprehensive information about a workflow document:

- **Metadata** — Document type, title, description, submitter, current state, and created/updated dates.
- **Action history** — A chronological log of all actions taken on the document (created, sent, approved, returned, rejected, closed, etc.) with the user, timestamp, and comments for each.
- **Workflow trace** — A visual representation of the approval chain showing which stages have been completed and which are pending.
- **Comments tab** — All comments added by participants, with the ability to add new comments or delete your own.
- **Versions tab** — If the document has attached files, shows version history of the attachments.
- **Recipients** — Lists the filtered recipients who can act on the document at each stage.

## Validations & business rules

- **Approval chain** — Each workflow template defines an ordered approval chain. The document moves to the next approver only after the current one approves.
- **Comment required on rejection** — You cannot reject a workflow document without providing a reason.
- **Comment required on return** — You cannot return a document without explaining why.
- **Delegation log** — All delegations are logged with the delegator, delegatee, timestamp, and reason.
- **Due dates** — Each stage has an optional due date. Overdue items appear in red in the Inbox and on the Compliance Calendar.
- **Document locking** — While a document is being reviewed, it is locked — the submitter cannot edit it until the review is complete or the document is recalled.
- **Auto-escalation** — If an approver does not act within the configured timeout, the task can be auto-escalated to their supervisor.
- **Role-based actions** — Available actions depend on the user's role and the document's current state. For example, only HR can approve at the `UNDER_HR_REVIEW` stage.
- **Recipient filtering** — When sending a document, the system filters the available recipients based on the document type and the current stage.
- **Excel report generation** — When submitting an attendance report, the system generates an Excel file with attendance data and attaches it to the workflow document.

## Limitations

- You cannot edit a workflow document after the first approval — you must recall it first.
- Parallel approvals (multiple approvers at the same stage) are not supported in the current version.
- Analytics data is aggregated daily — real-time workflow metrics are not available.
- Custom workflows require a file from Smart Drive — you cannot create a custom workflow without an attached file.
- Withdrawn documents cannot be resumed — a new document must be created.

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Cannot submit a workflow request | Verify you have `create` permission on the `workflow` screen. Contact your administrator. |
| Document stuck in "pending" | The current approver may not have acted. Check the approval chain or use the delegate option. |
| Cannot edit a submitted document | Documents are locked after the first approval. Recall the document first to make changes. |
| Rejection fails with "comment required" | You must provide a reason when rejecting. Fill in the comment field and try again. |
| Return fails with "comment required" | You must provide a reason when returning a document. Fill in the comment field and try again. |
| Overdue task not escalating | Auto-escalation must be configured by the administrator. Contact your admin to verify the timeout setting. |
| Cannot see tasks in inbox | Check that you are the assigned approver for the current stage. Verify your role matches the stage requirement. |
| Export and submit fails | The Workflow system may be unavailable or the `ATTENDANCE_DAILY` type may not be configured. Try exporting from [Attendance](/en/attendance) without submission. |
| Cannot upload signed version | The document must be in `APPROVED` state to upload a signed version. Check the current state on the detail page. |
| Analytics page shows no data | Data is aggregated daily. Check back after the next aggregation cycle, or verify that workflow documents exist. |

## Related articles

- [Notifications](/en/notifications) — You receive notifications when workflow tasks are assigned or completed.
- [Dashboard](/en/dashboard) — Scheduled Reports tab can generate workflow performance reports.
- [Profile & Settings](/en/profile) — Manage your workflow notification preferences.
- [Scheduling](/en/scheduling) — Workflow due dates appear on the compliance calendar alongside scheduling events.
- [Attendance](/en/attendance) — Export and submit creates an `ATTENDANCE_DAILY` workflow document.
- [Smart Drive](/en/smart-drive) — Custom workflows can be created from files stored in Smart Drive.
