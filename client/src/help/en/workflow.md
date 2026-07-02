---
title: Workflow
tags: [workflow, approval, inbox, compliance, analytics]
route: /workflow/inbox
order: 50
keywords: [workflow, approval, inbox, document routing, compliance calendar, analytics, delegate, recall, reject, approve, template, escalation, overdue, auto-escalation, send, return, close, resubmit, withdraw, reupload, upload signed, DRAFT, SUBMITTED, UNDER_HR_REVIEW, UNDER_ADMIN_REVIEW, APPROVED, REJECTED, ATTENDANCE_DAILY, ATTENDANCE_WEEKLY, custom workflow, workflow trace, SLA, cycle time, rejection reasons, comments, action history, weekly summary, behavioral, penalty, cron, signed document, threshold check, target student, duplicate prevention, dedup, 409, BEHAVIOR, DISCONTINUATION, WARNING, EXCUSE]
---

# Workflow

The Workflow system manages approval processes and document routing. It ensures that requests (leave, training, equipment, attendance reports, etc.) follow the correct approval chain before being executed. The system supports multiple document types, role-based approval stages, comments, delegation, recall, analytics, weekly attendance summaries, signed document uploads, and automated SLA monitoring.

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
- **Generate weekly summary** — HR can generate a weekly attendance summary by selecting a date range. The system aggregates all `ATTENDANCE_DAILY` documents in that range and creates an `ATTENDANCE_WEEKLY` workflow document with an Excel report attached. See [Weekly summary auto-export](#weekly-summary-auto-export) below.
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
- **Upload signed** — Upload a signed/approved version of the document after it has been approved. For `ATTENDANCE_WEEKLY` documents, only Admin users can upload signed versions. The signed upload creates a new file version and reassigns the document back to HR for final review. Version tracking uses `reviewCycleCount`.

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

### Weekly summary auto-export

The weekly summary feature allows HR to aggregate daily attendance documents into a single weekly report:

1. HR selects a date range (`weekStart` and `weekEnd`).
2. The system queries all `ATTENDANCE_DAILY` workflow documents in that range with status `SUBMITTED`.
3. Attendance data is aggregated across all daily documents.
4. An Excel report is generated with class-level summaries.
5. A new workflow document of type `ATTENDANCE_WEEKLY` is created with category `ATTENDANCE` and subtype `WEEKLY_SUMMARY`.
6. The approval flow is `HR_THEN_ADMIN` — HR creates and submits, Admin reviews and approves.
7. The weekly document links back to all source daily documents via `linkedDailyDocumentIds` in its metadata.

This creates an end-to-end audit trail: daily attendance exports → `ATTENDANCE_DAILY` documents → weekly summary → `ATTENDANCE_WEEKLY` document → Admin approval → signed upload.

### Behavioral and penalty report connection

Attendance violations flow through the system as follows:

1. **Attendance marking** — Instructors mark students in the [Attendance](/en/attendance) screen.
2. **Violations identified** — Absences, late arrivals, and other violations are tracked.
3. **Behavioral export** — From the attendance screen, a behavioral Excel report can be generated for selected subjects, violation types, and date ranges.
4. **Penalty reports** — Penalty records are generated from attendance violation data and can be exported as `penalty` type.
5. **Workflow submission** — Behavioral and penalty reports can be submitted through the workflow system as supporting documents for HR/Admin review.

### Target student support

Certain workflow types require a target student to be selected when creating the document:

| Category | Subtype | Requires target student? |
| --- | --- | --- |
| ATTENDANCE | EXCUSE | Yes — scoped to class + student + date range |
| ATTENDANCE | WARNING | Yes — scoped to class + student |
| BEHAVIOR | — | Yes — scoped to class + student |
| PENALTY | — | Yes — scoped to class + student |
| DISCONTINUATION | — | Yes — scoped to class + student |
| ATTENDANCE | DAILY | No — scoped to class + date |
| ATTENDANCE | WEEKLY | No — scoped to class + date range |
| GENERAL | — | No — exempt from dedup |

When a target student is required, a student selector appears in the Custom Workflow Dialog. The selected student's info is displayed in:
- **Workflow inbox** — A new column shows the target student with a student icon and localized name.
- **Document detail page** — Student info appears in the title card.
- **File Details workflow tab** — Student info appears in both list and grid views.

### Duplicate workflow prevention

The system prevents creation of duplicate in-progress workflows for the same scope. If you try to create a workflow that overlaps with an existing in-progress one, the system returns a **409 Conflict** with the existing workflow details.

Dedup rules by type:
- **ATTENDANCE/DAILY** — classId + date
- **ATTENDANCE/WEEKLY** — classId + dateFrom + dateTo
- **ATTENDANCE/EXCUSE** — classId + targetStudentId + dateFrom + dateTo
- **ATTENDANCE/WARNING** — classId + targetStudentId
- **PENALTY/BEHAVIOR/DISCONTINUATION** — classId + targetStudentId
- **GENERAL** — exempt (no dedup)

The frontend displays a message with a link to the existing workflow document when a 409 is returned.

### Automated monitoring

The system runs automated background jobs via a cron scheduler:

- **SLA monitor** — Runs every 6 hours. Checks workflow documents for overdue SLA items and triggers alerts.
- **Attendance threshold check** — Runs every 6 hours. Checks attendance thresholds and triggers alerts or penalty records when thresholds are exceeded.

Both jobs run in the `Asia/Riyadh` timezone and are initialized automatically when the backend server starts.

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
- **Weekly summary aggregation** — Weekly summaries can only be generated from `ATTENDANCE_DAILY` documents with status `SUBMITTED`. Draft or rejected daily documents are excluded.
- **Signed upload restriction** — Only `ATTENDANCE_WEEKLY` documents can have signed uploads, and only Admin users can perform the upload.
- **Cron-based monitoring** — SLA and attendance threshold checks run automatically every 6 hours. No manual intervention is needed.
- **Target student required** — BEHAVIOR, PENALTY, DISCONTINUATION, WARNING, and EXCUSE workflow types require a target student. The student selector appears in the Custom Workflow Dialog when needed.
- **Duplicate prevention** — The system blocks creation of overlapping in-progress workflows for the same scope (class + student + date). A 409 Conflict is returned with a link to the existing document.

## Limitations

- You cannot edit a workflow document after the first approval — you must recall it first.
- Parallel approvals (multiple approvers at the same stage) are not supported in the current version.
- Analytics data is aggregated daily — real-time workflow metrics are not available.
- Custom workflows require a file from Smart Drive — you cannot create a custom workflow without an attached file.
- Withdrawn documents cannot be resumed — a new document must be created.
- Weekly summaries require at least one `ATTENDANCE_DAILY` document in the selected date range. If none exist, the generation fails.
- Signed document uploads are restricted to `ATTENDANCE_WEEKLY` documents only.

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
| Cannot upload signed version | The document must be in `APPROVED` state to upload a signed version. Check the current state on the detail page. For `ATTENDANCE_WEEKLY`, only Admin users can upload signed versions. |
| Weekly summary generation fails | Ensure at least one `ATTENDANCE_DAILY` document with status `SUBMITTED` exists in the selected date range. |
| Analytics page shows no data | Data is aggregated daily. Check back after the next aggregation cycle, or verify that workflow documents exist. |
| 409 Conflict when creating workflow | An in-progress workflow already exists for the same class/student/date scope. Click the link in the error message to view the existing document. |
| Target student selector not appearing | The selector only appears for BEHAVIOR, PENALTY, DISCONTINUATION, WARNING, and EXCUSE types. Verify the workflow category is correct. |

## Related articles

- [Notifications](/en/notifications) — You receive notifications when workflow tasks are assigned or completed.
- [Dashboard](/en/dashboard) — Scheduled Reports tab can generate workflow performance reports.
- [Profile & Settings](/en/profile) — Manage your workflow notification preferences.
- [Scheduling](/en/scheduling) — Workflow due dates appear on the compliance calendar alongside scheduling events.
- [Attendance](/en/attendance) — Export and submit creates an `ATTENDANCE_DAILY` workflow document. Behavioral and penalty reports can also be submitted through workflow.
- [Smart Drive](/en/smart-drive) — Custom workflows can be created from files stored in Smart Drive. All exports are saved to Smart Drive → Exported Files.
