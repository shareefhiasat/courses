---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics-revised", "step-03-create-stories"]
inputDocuments: ["_bmad-output/planning-artifacts/prds/prd-courses-2026-05-23/prd.md"]
---

# Attendance Document Workflow System - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Attendance Document Workflow System, decomposing the requirements from the PRD into implementable stories. This is a brownfield project building on existing Military LMS infrastructure with Prisma, React, Keycloak, and MinIO.

## Requirements Inventory

### Functional Requirements

FR-1.1: System shall provide "Export & Submit for HR Review" button on daily attendance screen
FR-1.2: System shall generate attendance report in Word or Excel format (existing export functionality)
FR-1.3: System shall prompt user to confirm submission with optional comments
FR-1.4: System shall upload document to `lms-workflow` bucket with structured naming convention
FR-1.5: System shall link document to specific class, instructor, date, program, and subject
FR-1.6: System shall create workflow document record with status "Submitted"
FR-1.7: System shall notify HR of new submission via inbox/notification
FR-1.8: System shall support manual file upload (Word/Excel/PDF) for scanned documents (treated as static attachments, no OCR)

FR-2.1: System shall provide workflow inbox page for HR and Admin roles
FR-2.2: System shall display submitted documents with metadata (class, date, instructor, status)
FR-2.3: System shall support filtering by status, date range, program, instructor
FR-2.4: System shall show unread count and allow bulk mark-as-read
FR-2.5: System shall allow HR to view document details and download file
FR-2.6: System shall display document version history with change attribution
FR-2.7: System shall show all comments and feedback across review cycles
FR-2.8: System shall allow HR to add comments without changing document status
FR-2.9: System shall allow HR to approve document with optional comments
FR-2.10: System shall allow HR to reject document with required feedback
FR-2.11: System shall allow HR to return document to instructor/admin for amendment
FR-2.12: System shall notify submitter of status changes via notification
FR-2.13: System shall allow instructor to withdraw submitted document before HR review
FR-2.14: System shall display SLA status (72 hours) with color coding in inbox
FR-2.15: System shall sort inbox by SLA urgency (overdue items first)

FR-3.1: System shall use MinIO native versioning for document storage
FR-3.2: System shall create new version on each upload (even by same user)
FR-3.3: System shall record version metadata: uploader, timestamp, file size, comments
FR-3.4: System shall display version history in chronological order
FR-3.5: System shall allow users to download any previous version
FR-3.6: System shall show diff summary between versions (file metadata, not content diff)
FR-3.7: System shall prevent deletion of versions (soft delete only)
FR-3.8: System shall maintain version history even after document approval

FR-4.1: System shall allow HR to amend attendance from HR attendance screen
FR-4.2: System shall record all attendance changes with attribution (who, when, why)
FR-4.3: System shall allow HR to re-export attendance report after amendments
FR-4.4: System shall allow HR to upload regenerated document as new version
FR-4.5: System shall auto-generate comment describing amendments made
FR-4.6: System shall update document status to "Amended" after regeneration
FR-4.7: System shall link regenerated document to original workflow record
FR-4.8: System shall notify instructor of amendments via notification

FR-5.1: System shall allow unlimited resubmission cycles after rejection
FR-5.2: System shall maintain single workflow record across resubmissions
FR-5.3: System shall create new document version on each resubmission
FR-5.4: System shall display all previous feedback in review history
FR-5.5: System shall track number of review cycles per document
FR-5.6: System shall allow HR to close workflow after 3 review cycles (configurable)
FR-5.7: System shall notify HR of resubmission via notification

FR-6.1: System shall provide "Create Workflow" action in Smart Drive file context menu
FR-6.2: System shall allow users to select any file from Smart Drive for workflow submission
FR-6.3: System shall copy file to `lms-workflow` bucket on workflow creation
FR-6.4: System shall prompt user to specify workflow type, title, description
FR-6.5: System shall allow users to assign reviewers (by role or specific user)
FR-6.6: System shall support custom workflow types with configurable approval steps
FR-6.7: System shall use same review/approval mechanics as attendance workflow
FR-6.8: System shall maintain separate inbox views per workflow type
FR-6.9: System shall allow optional file attachments for custom workflows (can trigger without attachment)

FR-7.1: System shall support status flow: Draft → Submitted → Under Review → Approved/Rejected → Amended → Closed
FR-7.2: System shall record status transitions with actor and timestamp
FR-7.3: System shall display current status prominently in inbox and detail views
FR-7.4: System shall show status history in document detail view
FR-7.5: System shall allow status-based filtering in inbox
FR-7.6: System shall prevent invalid status transitions (e.g., Approved → Draft)
FR-7.7: System shall allow Admin to override status with audit log entry
FR-7.8: System shall provide workflow analytics (cycle time, approval rate, rejection reasons)

FR-8.1: System shall integrate with existing Keycloak authentication
FR-8.2: System shall reuse existing drive permissions for file operations
FR-8.3: System shall add workflow-specific permissions: create, submit, review, approve, amend
FR-8.4: System shall enforce role-based access to workflow inbox
FR-8.5: System shall allow instructors to view only their own submissions
FR-8.6: System shall allow any user with HR role to view and review all submissions (role-based delegation)
FR-8.7: System shall allow Admin to view all submissions and override permissions
FR-8.8: System shall log all permission denials for audit

FR-9.1: System shall allow HR to generate weekly summary documents aggregating all daily attendance for all students/classes
FR-9.2: System shall link weekly summary to date range (week start/end) and all related daily attendance documents
FR-9.3: System shall allow HR to submit weekly summary to Admin review workflow
FR-9.4: System shall show deduction breakdown in weekly summary document
FR-9.5: System shall notify Admin of new weekly summary submission

FR-10.1: System shall provide calendar view showing expected submission dates vs actual submission dates
FR-10.2: System shall highlight missed days (no submission) for follow-up
FR-10.3: System shall allow filtering by date range, program, instructor, workflow type
FR-10.4: System shall show compliance statistics (submission rate, average delay)

FR-11.1: System shall provide interactive visual workflow diagram showing current status and people involved
FR-11.2: System shall display workflow rules and transitions visually (better than static Mermaid)
FR-11.3: System shall allow users to click on workflow steps to see details and history
FR-11.4: System shall render workflow visualization in real-time as status changes

### NonFunctional Requirements

NFR-1: Document upload must complete within 10 seconds for files up to 50MB
NFR-2: Workflow inbox must load within 3 seconds with up to 1000 items
NFR-3: Version history view must load within 2 seconds
NFR-4: Document download must support HTTP Range requests for large files

NFR-5: All workflow operations must require Keycloak authentication
NFR-6: Document access must be restricted based on workflow ownership and permissions
NFR-7: Audit logs must be immutable and tamper-evident
NFR-8: Presigned URLs for file access must expire within 5 minutes

NFR-9: System must maintain 99.5% uptime during business hours
NFR-10: Document uploads must not be lost on server failure
NFR-11: Version history must be preserved even if document is deleted
NFR-12: System must handle concurrent submissions without data corruption

NFR-13: System must support 10,000 concurrent workflow documents
NFR-14: System must support 100 concurrent document uploads
NFR-15: Database queries must be optimized for pagination with large datasets

NFR-16: UI must support Arabic and English languages
NFR-17: UI must work on mobile, tablet, and desktop (320px to 1280px+)
NFR-18: UI must respect dark mode theme
NFR-19: Error messages must be clear and actionable
NFR-20: Loading states must be visible for all async operations

NFR-21: Code must follow existing project patterns (ES modules, Prisma, React)
NFR-22: All new code must be written testable by design
NFR-23: API endpoints must follow existing `/api/v1/` convention
NFR-24: Database changes must use Prisma `db push` (no migrations)

NFR-25: All workflow actions must be auditable for 7 years
NFR-26: System must support data export for regulatory requests

### Additional Requirements

- Integration with existing MinIO Smart Drive infrastructure (lms-workflow bucket)
- Leverage existing permission model and sharing system from Smart Drive
- Use existing Keycloak authentication (realm: military-lms)
- Use existing attendance system data (class, instructor, date, program, subject)
- Leverage existing File model from MinIO system for document storage
- Follow existing project patterns: ES modules, Prisma, React
- Use existing drive permissions as base for workflow permissions
- API endpoints must follow existing `/api/v1/` convention
- Database changes must use Prisma `db push` (no migrations per project context)
- Integrate with existing notification system for workflow alerts
- Use existing localization system (LangContext) for Arabic/English support
- Follow existing dark mode theme from MUI theme provider
- Use existing path aliases (@components, @pages, @services, @ui, @hooks)

### UX Design Requirements

No UX Design document provided. UX requirements will be derived from user journeys in PRD and existing component patterns in the codebase.

### FR Coverage Map

FR-1.1 through FR-1.8: Epic 1 - Attendance Document Submission (Daily + Weekly)
FR-2.1 through FR-2.15: Epic 2 - Multi-Stage Workflow Review and Approval
FR-3.1 through FR-3.8: Epic 3 - Document Versioning and Audit Trail
FR-4.1 through FR-4.8: Epic 4 - Attendance Amendment and Regeneration
FR-5.1 through FR-5.7: Epic 2 - Multi-Stage Workflow Review and Approval
FR-6.1 through FR-6.9: Epic 6 - Custom Document Workflows
FR-7.1, FR-7.3, FR-7.5: Epic 2 - Multi-Stage Workflow Review and Approval
FR-7.2, FR-7.4, FR-7.7: Epic 3 - Document Versioning and Audit Trail
FR-7.8: Epic 2 - Multi-Stage Workflow Review and Approval
FR-8.1, FR-8.2, FR-8.3: Epic 1 - Attendance Document Submission (Daily + Weekly)
FR-8.4, FR-8.5, FR-8.6: Epic 2 - Multi-Stage Workflow Review and Approval
FR-8.7: Epic 4 - Attendance Amendment and Regeneration
FR-8.8: Epic 3 - Document Versioning and Audit Trail

NEW FRs for Weekly Summary and Calendar Tracking:
FR-9.1 through FR-9.5: Epic 1 - Weekly Summary Generation
FR-10.1 through FR-10.4: Epic 2 - Calendar Compliance Tracking
FR-11.1 through FR-11.4: Epic 5 - Visual Workflow Rendering

## Epic List

### Epic 1: Attendance Document Submission (Daily + Weekly)
Instructors can submit daily attendance documents, and HR can generate weekly summary documents for all students/classes, both using unified submission infrastructure with proper metadata linkage and notifications.
**FRs covered:** FR-1.1 through FR-1.8, FR-8.1, FR-8.2, FR-8.3, FR-9.1 through FR-9.5

### Epic 2: Multi-Stage Workflow Review and Approval
HR and Admin can review, approve, reject, and provide feedback on submitted documents in a centralized inbox with multi-stage routing (HR→Admin→HR for weekly), SLA tracking, multi-cycle support, and calendar compliance view showing missed days.
**FRs covered:** FR-2.1 through FR-2.15, FR-5.1 through FR-5.7, FR-7.1, FR-7.3, FR-7.5, FR-7.8, FR-8.4, FR-8.5, FR-8.6, FR-10.1 through FR-10.4

### Epic 3: Document Versioning and Audit Trail
Users can track full document version history with change attribution for compliance and audit purposes.
**FRs covered:** FR-3.1 through FR-3.8, FR-7.2, FR-7.4, FR-7.7, FR-8.8

### Epic 4: Attendance Amendment and Regeneration
HR can amend attendance records and regenerate documents as source of truth with full change tracking.
**FRs covered:** FR-4.1 through FR-4.8, FR-8.7

### Epic 5: Visual Workflow Rendering
Users can see interactive visual representations of workflow progress, showing people involved at each step, current status, and workflow rules in an engaging format (better than static Mermaid diagrams).
**FRs covered:** FR-11.1 through FR-11.4

### Epic 6: Custom Document Workflows
Users can submit arbitrary documents (with or without attachments) for approval using the same workflow infrastructure beyond attendance.
**FRs covered:** FR-6.1 through FR-6.9

## Epic 1: Attendance Document Submission (Daily + Weekly)

Instructors can submit daily attendance documents, and HR can generate weekly summary documents for all students/classes, both using unified submission infrastructure with proper metadata linkage and notifications.

### Story 1.1: Database Schema for Workflow Documents

As a system,
I want a database schema to store workflow documents, comments, and status history,
So that the workflow system can persist and track all attendance document submissions.

**Acceptance Criteria:**

**Given** the Prisma schema exists
**When** I add WorkflowDocument, WorkflowComment, and WorkflowStatusHistory models
**Then** the models are created with all required fields (id, workflowType, title, description, status, fileId, submitterId, currentAssigneeId, classId, instructorId, date, program, subject, timestamps, auditFields)
**And** WorkflowComment has fields for workflowDocumentId, authorId, comment, action, createdAt
**And** WorkflowStatusHistory has fields for workflowDocumentId, fromStatus, toStatus, actorId, reason, createdAt
**And** all foreign key relationships are properly defined
**And** enums are created for WorkflowType (ATTENDANCE_DAILY, ATTENDANCE_WEEKLY, GENERAL) and WorkflowStatus (DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, AMENDED, CLOSED)
**And** Prisma db push successfully creates the tables

### Story 1.2: Daily Attendance Export and Submission

As an instructor,
I want to export attendance report and submit it for HR review directly from the daily attendance screen,
So that I don't need to navigate to Smart Drive separately.

**Acceptance Criteria:**

**Given** I am logged in as an instructor
**When** I navigate to the daily attendance screen for a completed class
**And** I click "Export & Submit for HR Review" button
**Then** the system generates an attendance report in Word or Excel format
**And** the system prompts me to confirm submission with optional comments
**And** when I confirm, the system uploads the document to lms-workflow bucket with structured naming (attendance/{program}/{subject}/{class_id}/{date}/{instructor_id}/{timestamp}_v1.{ext})
**And** the system creates a WorkflowDocument record with status "Submitted" and links it to the class, instructor, date, program, and subject
**And** the system notifies HR users via the notification system
**And** I see a confirmation message with the document ID and status

### Story 1.3: Manual File Upload for Scanned Documents

As an instructor,
I want to manually upload scanned attendance documents (Word/Excel/PDF),
So that I can submit physical documents that were scanned.

**Acceptance Criteria:**

**Given** I am logged in as an instructor
**When** I navigate to the daily attendance screen
**And** I click "Upload Scanned Document" button
**Then** the system displays a file upload dialog accepting Word, Excel, and PDF files
**And** when I select a file and confirm with optional comments
**Then** the system uploads the document to lms-workflow bucket with structured naming
**And** the system creates a WorkflowDocument record with status "Submitted" and workflowType "ATTENDANCE_DAILY"
**And** the system links the document to the selected class, date, and metadata
**And** the system notifies HR users via the notification system

### Story 1.4: Weekly Summary Generation and Submission

As HR staff,
I want to generate a weekly summary document aggregating all daily attendance for all students/classes,
So that I can review overall attendance patterns and deductions for the week.

**Acceptance Criteria:**

**Given** I am logged in as HR staff
**When** I navigate to the weekly summary generation screen
**And** I select a date range (week start/end)
**And** I click "Generate Weekly Summary"
**Then** the system aggregates all daily attendance documents for that date range
**And** the system generates a weekly summary document showing all students, classes, and deduction breakdown
**And** the system links the weekly summary to the date range and all related daily attendance documents
**And** the system prompts me to submit the summary to Admin review
**And** when I confirm, the system uploads the document to lms-workflow bucket with workflowType "ATTENDANCE_WEEKLY"
**And** the system creates a WorkflowDocument record with status "Submitted" and currentAssigneeId set to Admin
**And** the system notifies Admin users via the notification system

### Story 1.5: Workflow Notifications Integration

As a user,
I want to receive notifications when workflow documents are submitted to me for review,
So that I can promptly review and act on pending items.

**Acceptance Criteria:**

**Given** a workflow document is submitted
**When** the document is assigned to a specific role (HR or Admin)
**Then** the system sends notifications to all users with that role
**And** the notification includes document title, submitter, workflow type, and a link to the workflow inbox
**And** the notification is delivered through the existing notification system
**And** users can click the notification to navigate directly to the document detail view

## Epic 2: Multi-Stage Workflow Review and Approval

HR and Admin can review, approve, reject, and provide feedback on submitted documents in a centralized inbox with multi-stage routing (HR→Admin→HR for weekly), SLA tracking, multi-cycle support, and calendar compliance view showing missed days.

### Story 2.1: Workflow Inbox Page with Filtering and Pagination

As HR or Admin staff,
I want a centralized inbox showing all workflow documents assigned to me with filtering and pagination,
So that I can efficiently review and manage pending documents.

**Acceptance Criteria:**

**Given** I am logged in as HR or Admin
**When** I navigate to the workflow inbox page
**Then** I see a list of workflow documents with metadata (class, date, instructor, status, workflow type)
**And** I can filter by status, date range, program, instructor, and workflow type
**And** I see an unread count and can bulk mark items as read
**And** the list supports pagination for up to 1000 items
**And** the page loads within 3 seconds (NFR-2)
**And** instructors see only their own submissions (FR-8.5)
**And** HR sees all submissions (FR-8.6)
**And** Admin sees all submissions (FR-8.7)

### Story 2.2: Document Detail View with Version History

As HR or Admin staff,
I want to view document details and version history,
So that I can understand the full context and track changes.

**Acceptance Criteria:**

**Given** I am viewing the workflow inbox
**When** I click on a workflow document
**Then** I see the document detail view with all metadata
**And** I can download the current file version
**And** I see the version history in chronological order with uploader, timestamp, file size, and comments
**And** I can download any previous version
**And** I see all comments and feedback across review cycles
**And** the version history view loads within 2 seconds (NFR-3)

### Story 2.3: Review Actions (Approve, Reject, Return with Comments)

As HR or Admin staff,
I want to approve, reject, or return documents with comments,
So that I can provide feedback and move the workflow forward.

**Acceptance Criteria:**

**Given** I am viewing a document in detail view
**When** I click "Approve" with optional comments
**Then** the system updates the document status to "Approved"
**And** the system records the status transition with actor and timestamp
**And** the system notifies the submitter of the approval
**When** I click "Reject" with required feedback
**Then** the system updates the document status to "Rejected"
**And** the system records the rejection reason
**And** the system notifies the submitter with the feedback
**When** I click "Return to Instructor/Admin" with comments
**Then** the system updates the document status to "Rejected"
**And** the system records the return reason
**And** the system notifies the target user with the feedback

### Story 2.4: Multi-Stage Routing (HR→Admin→HR for Weekly Summaries)

As the system,
I want to route weekly summary documents through HR→Admin→HR stages,
So that Admin can review before final HR approval.

**Acceptance Criteria:**

**Given** a weekly summary document is submitted by HR
**When** the document is created with workflowType "ATTENDANCE_WEEKLY"
**Then** the system sets currentAssigneeId to an Admin user
**And** the system routes the document to the Admin inbox
**When** Admin uploads the signed document after student signatures
**Then** the system creates a new version of the document
**And** the system reassigns currentAssigneeId to HR
**And** the system routes the document back to the HR inbox for final review
**And** the system maintains a single workflow record across stages

### Story 2.5: SLA Tracking with Color Coding and Urgency Sorting

As HR or Admin staff,
I want to see SLA status with color coding and urgency sorting in the inbox,
So that I can prioritize overdue documents.

**Acceptance Criteria:**

**Given** I am viewing the workflow inbox
**When** documents have different ages since submission
**Then** the system displays SLA status (72 hours) with color coding (green: <24h, yellow: 24-48h, orange: 48-72h, red: >72h)
**And** the system sorts the inbox by SLA urgency (overdue items first)
**And** I can see the time elapsed since submission for each document
**And** the color coding is visible in both list and detail views

### Story 2.6: Multi-Cycle Review and Resubmission Support

As an instructor or HR,
I want to resubmit documents after rejection without creating duplicate workflows,
So that I can address feedback and maintain a single workflow record.

**Acceptance Criteria:**

**Given** a document has been rejected with feedback
**When** the submitter uploads a new version addressing the feedback
**Then** the system creates a new document version
**And** the system increments the reviewCycleCount
**And** the system updates the status to "Submitted"
**And** the system maintains a single workflow record across resubmissions
**And** the system displays all previous feedback in review history
**And** the system notifies HR of the resubmission
**When** the review cycle count reaches 3
**Then** HR can close the workflow (configurable threshold)

### Story 2.7: Document Withdrawal Before Review

As an instructor,
I want to withdraw a submitted document before HR review,
So that I can correct mistakes before they are reviewed.

**Acceptance Criteria:**

**Given** I am the submitter of a document
**When** the document status is "Submitted" and has not been reviewed yet
**And** I click "Withdraw" button
**Then** the system updates the document status to "Draft"
**And** the system records the withdrawal action in status history
**And** I can resubmit the document after making corrections
**When** the document status is already "Under Review" or later
**Then** the withdrawal button is disabled

### Story 2.8: Calendar Compliance View (Missed Days Tracking)

As HR or Admin staff,
I want a calendar view showing expected submission dates vs actual submission dates,
So that I can identify missed days and follow up appropriately.

**Acceptance Criteria:**

**Given** I am logged in as HR or Admin
**When** I navigate to the calendar compliance view
**Then** I see a calendar showing expected daily attendance submission dates
**And** days with submissions are marked as complete
**And** days without submissions are highlighted as missed
**And** I can filter by date range, program, instructor, and workflow type
**And** I can click on a missed day to see which classes/instructors haven't submitted
**And** I see compliance statistics (submission rate, average delay)
**And** the view supports both daily and weekly workflow types

### Story 2.9: Workflow Analytics Dashboard

As HR or Admin staff,
I want to see workflow analytics including cycle time, approval rate, and rejection reasons,
So that I can identify bottlenecks and improve the process.

**Acceptance Criteria:**

**Given** I am logged in as HR or Admin
**When** I navigate to the workflow analytics dashboard
**Then** I see average review cycle time per workflow type
**And** I see approval rate percentage
**And** I see rejection reasons breakdown
**And** I can filter by date range, program, and workflow type
**And** the data is updated in real-time as workflows complete
**And** I can export analytics data for reporting

## Epic 3: Document Versioning and Audit Trail

Users can track full document version history with change attribution for compliance and audit purposes.

### Story 3.1: MinIO Native Versioning Integration

As the system,
I want to use MinIO native versioning for document storage,
So that every document upload creates a new version automatically.

**Acceptance Criteria:**

**Given** the lms-workflow bucket exists in MinIO
**When** I enable versioning on the bucket
**Then** MinIO automatically creates a new version for each upload
**And** each version has a unique version ID
**And** versions are preserved even if the object is deleted
**And** the system can list all versions of an object
**And** the system can download any specific version

### Story 3.2: Version Metadata Recording

As the system,
I want to record version metadata (uploader, timestamp, file size, comments) for each upload,
So that users can track who changed what and when.

**Acceptance Criteria:**

**Given** a document is uploaded to MinIO
**When** the upload completes
**Then** the system records the version metadata in the database
**And** the metadata includes uploader userId, timestamp, file size, and optional comments
**And** the metadata is linked to the WorkflowDocument record
**And** the system creates a new version even when the same user uploads
**And** the version number is incremented (v1, v2, v3...)

### Story 3.3: Version History Display and Download

As a user,
I want to view version history and download any previous version,
So that I can track changes and restore previous versions if needed.

**Acceptance Criteria:**

**Given** I am viewing a workflow document detail view
**When** I click on the version history section
**Then** I see all versions in chronological order
**And** each version shows uploader, timestamp, file size, and comments
**And** I can click on any version to download it
**And** I can see a diff summary between versions (file metadata, not content diff)
**And** the version history view loads within 2 seconds (NFR-3)
**And** version history is maintained even after document approval

### Story 3.4: Immutable Audit Trail Logging

As the system,
I want to maintain an immutable audit trail of all status transitions and actions,
So that compliance requirements are met for 7 years.

**Acceptance Criteria:**

**Given** a workflow document status changes
**When** the transition occurs (e.g., Submitted → Under Review)
**Then** the system records the transition in WorkflowStatusHistory
**And** the record includes fromStatus, toStatus, actorId, reason, and timestamp
**And** the record is immutable (cannot be modified or deleted)
**And** the audit trail is preserved even if the document is soft-deleted
**And** the system supports data export for regulatory requests (NFR-26)
**And** the audit trail is retained for 7 years (NFR-25)

### Story 3.5: Permission Denial Audit Logging

As the system,
I want to log all permission denials for audit purposes,
So that security incidents can be investigated.

**Acceptance Criteria:**

**Given** a user attempts to perform a workflow action
**When** the user does not have the required permission
**Then** the system logs the denial with userId, action attempted, resource, timestamp, and reason
**And** the log is stored in an immutable audit table
**And** the log includes the user's role at the time of the attempt
**And** HR and Admin can view permission denial logs
**And** the logs are retained for 7 years for compliance

## Epic 4: Attendance Amendment and Regeneration

HR can amend attendance records and regenerate documents as source of truth with full change tracking.

### Story 4.1: HR Attendance Amendment Interface

As HR staff,
I want to amend attendance records from the HR attendance screen,
So that I can correct attendance data when needed (e.g., sick leave excusals, humanitarian cases).

**Acceptance Criteria:**

**Given** I am logged in as HR staff
**When** I navigate to the HR attendance screen
**And** I select a student's attendance record
**Then** I can modify the attendance status (e.g., change absent to excused)
**And** I can provide a reason for the amendment
**And** the system validates that I have permission to amend attendance
**And** the amendment uses MinIO-based storage (no Nextcloud dependency)
**And** the system records the amendment with attribution

### Story 4.2: Attendance Change Attribution Recording

As the system,
I want to record all attendance changes with attribution (who, when, why),
So that there is a complete audit trail for mark deduction decisions.

**Acceptance Criteria:**

**Given** an attendance record is amended
**When** the amendment is saved
**Then** the system records the HR user who made the change
**And** the system records the timestamp of the change
**And** the system records the reason for the amendment
**And** the system links the change to the original attendance record
**And** the system stores the change in an immutable audit log
**And** the change history is viewable in the attendance detail view

### Story 4.3: Regenerated Document Upload and Versioning

As HR staff,
I want to re-export the attendance report after amendments and upload it as a new version,
So that the system reflects approved changes as the source of truth.

**Acceptance Criteria:**

**Given** I have amended attendance records
**When** I click "Re-export Attendance Report"
**Then** the system generates a new attendance report with the amended data
**And** when I upload the regenerated document
**Then** the system uploads it to lms-workflow bucket (MinIO, not Nextcloud)
**And** the system creates a new version of the document
**And** the system links the new version to the original workflow document
**And** the system maintains the single workflow record across versions

### Story 4.4: Auto-Generated Amendment Comments

As the system,
I want to auto-generate comments describing amendments made,
So that reviewers understand what changed without manual documentation.

**Acceptance Criteria:**

**Given** HR amends attendance and uploads a regenerated document
**When** the new version is created
**Then** the system auto-generates a comment describing the amendments
**And** the comment format is: "Amended by HR: changed student {id} from {old_status} to {new_status} ({reason})"
**And** the comment is added to the WorkflowComment table
**And** the comment action is set to "AMENDED"
**And** the comment is visible in the version history

### Story 4.5: Amendment Notification to Instructor

As the system,
I want to notify the instructor when HR amends their attendance,
So that the instructor is aware of changes to their records.

**Acceptance Criteria:**

**Given** HR amends attendance and uploads a regenerated document
**When** the document status is updated to "Amended"
**Then** the system sends a notification to the original instructor
**And** the notification includes the amendment summary
**And** the notification includes a link to view the changes in version history
**And** the notification is delivered through the existing notification system
**And** the instructor can click the notification to view the amended document

## Epic 5: Visual Workflow Rendering

Users can see interactive visual representations of workflow progress, showing people involved at each step, current status, and workflow rules in an engaging format (better than static Mermaid diagrams).

### Story 5.1: Interactive Workflow Diagram Component

As a user,
I want to see an interactive visual diagram showing the workflow progress,
So that I can quickly understand where the document is in the process.

**Acceptance Criteria:**

**Given** I am viewing a workflow document detail view
**When** the workflow visualization component loads
**Then** I see an interactive diagram showing all workflow steps (nodes)
**And** the current step is highlighted with a distinct color
**And** completed steps are marked as done
**And** pending steps are shown as future nodes
**And** the diagram is more engaging than static Mermaid diagrams (using a modern visualization library)
**And** the component supports Arabic and English languages (NFR-16)
**And** the component is responsive on mobile, tablet, and desktop (NFR-17)
**And** the component respects dark mode theme (NFR-18)

### Story 5.2: Real-Time Status Visualization

As a user,
I want the workflow diagram to update in real-time as status changes,
So that I always see the current state without refreshing.

**Acceptance Criteria:**

**Given** I am viewing a workflow document with the visualization component
**When** the document status changes (e.g., from Submitted to Under Review)
**Then** the diagram updates automatically to reflect the new status
**And** the current step highlight moves to the new node
**And** the previous step is marked as completed
**And** the update happens without page refresh (using WebSocket or polling)
**And** the transition is animated for visual feedback

### Story 5.3: Clickable Workflow Steps with Details

As a user,
I want to click on workflow steps to see details and history,
So that I can understand what happened at each stage.

**Acceptance Criteria:**

**Given** I am viewing the workflow diagram
**When** I click on a workflow step node
**Then** a modal or panel opens showing step details
**And** the details include: who acted at this step, when they acted, comments made, and status transition
**And** I can see the history of all actions at this step
**And** I can close the details panel to return to the diagram
**And** the current step shows live details (who is currently assigned)

### Story 5.4: Workflow Rules and Transitions Display

As a user,
I want to see workflow rules and possible transitions visually,
So that I understand the process flow and what actions are available.

**Acceptance Criteria:**

**Given** I am viewing the workflow diagram
**When** I hover over a workflow step node
**Then** I see a tooltip showing the workflow rules for this step
**And** the tooltip shows possible next transitions from this step
**And** the tooltip shows which roles can act at this step
**And** invalid transitions are visually indicated (grayed out or not shown)
**And** the rules are displayed in both Arabic and English based on user preference

## Epic 6: Custom Document Workflows

Users can submit arbitrary documents (with or without attachments) for approval using the same workflow infrastructure beyond attendance.

### Story 6.1: Smart Drive Context Menu Integration

As a user,
I want to see a "Create Workflow" action in the Smart Drive file context menu,
So that I can submit any file for approval without leaving Smart Drive.

**Acceptance Criteria:**

**Given** I am viewing Smart Drive
**When** I right-click on a file
**Then** I see a "Create Workflow" option in the context menu
**And** the option is available for all file types
**And** clicking the option opens the custom workflow creation dialog
**And** the system validates that I have permission to create workflows

### Story 6.2: Custom Workflow Creation Dialog

As a user,
I want to specify workflow type, title, description, and reviewers when creating a custom workflow,
So that the workflow is properly configured for the approval process.

**Acceptance Criteria:**

**Given** I click "Create Workflow" on a file
**When** the custom workflow creation dialog opens
**Then** I can select a workflow type from a dropdown (e.g., General Approval, Budget Request, Policy Review)
**And** I can enter a title for the workflow
**And** I can enter a description
**And** I can assign reviewers by role (e.g., HR, Admin) or specific users
**And** I can choose to attach the file or create a workflow without attachment
**And** the dialog validates that required fields are filled
**And** when I confirm, the system creates the workflow document

### Story 6.3: File Copy to Workflow Bucket

As the system,
I want to copy files from Smart Drive to the lms-workflow bucket when creating a custom workflow,
So that workflow documents are stored in the dedicated workflow bucket.

**Acceptance Criteria:**

**Given** a user creates a custom workflow with a file attachment
**When** the workflow is confirmed
**Then** the system copies the file from its original Smart Drive bucket to lms-workflow bucket
**And** the system uses MinIO for storage (no Nextcloud dependency)
**And** the system maintains the original file in Smart Drive
**And** the system links the copied file to the WorkflowDocument record
**And** the system uses structured naming for the copied file

### Story 6.4: Configurable Workflow Types and Approval Steps

As an admin,
I want to configure custom workflow types with their approval steps,
So that different document types can have different approval processes.

**Acceptance Criteria:**

**Given** I am logged in as Admin
**When** I navigate to the workflow configuration page
**Then** I can create new workflow types (e.g., Budget Request, Policy Review)
**And** I can define the approval steps for each workflow type (e.g., Manager → Director → HR)
**And** I can specify which roles can act at each step
**And** I can configure whether the workflow requires a file attachment
**And** the system stores the workflow type configuration in the database
**And** the custom workflow types are available in the workflow creation dialog

### Story 6.5: Custom Workflow Inbox Views

As a user,
I want to see separate inbox views for different workflow types,
So that I can filter and manage workflows by type.

**Acceptance Criteria:**

**Given** I am viewing the workflow inbox
**When** I filter by workflow type
**Then** I see only workflows of the selected type
**And** I can switch between workflow type views (e.g., Attendance Daily, Attendance Weekly, General Approval)
**And** the system uses the same review/approval mechanics as attendance workflows
**And** the system applies the same SLA tracking and multi-cycle support
**And** the system respects the configurable approval steps for each workflow type
