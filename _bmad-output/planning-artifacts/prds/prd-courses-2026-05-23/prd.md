---
title: "Attendance Document Workflow System"
status: final
created: "2026-05-23"
updated: "2026-05-23"
---

# Attendance Document Workflow System

## Executive Summary

This PRD defines a document workflow system for attendance reports in the Military LMS. The system enables instructors to export and submit attendance documents (Word/Excel) for HR review and approval, with full version history, change tracking, and audit logging. The workflow supports multiple review cycles, document amendments, and custom document approval flows beyond attendance.

**Stakes:** High - attendance records directly impact student marks, HR compliance, and disciplinary actions. Accurate change tracking is critical for audit trails and mark deduction decisions.

**Target Users:** Instructors, HR staff, Administrators

## Problem Statement

Currently, the LMS lacks a structured workflow for attendance document submission and approval. Instructors can export attendance reports but have no mechanism to submit them for HR review. HR cannot track document versions, record approval decisions, or maintain an audit trail of changes. When attendance amendments are needed (e.g., sick leave excusals, humanitarian cases), there is no systematic way to document who changed what, when, and why - information critical for future mark deduction decisions.

## Goals

### Primary Goals
1. Enable instructors to submit attendance documents (Word/Excel) directly from the daily attendance screen
2. Provide HR with a review and approval workflow for attendance documents
3. Track full document version history with change attribution (who, when, why)
4. Support multiple review cycles with comments and feedback
5. Enable HR to amend attendance data and regenerate documents as source of truth
6. Maintain audit trail for compliance and mark deduction decisions

### Secondary Goals
1. Support custom document approval workflows beyond attendance
2. Enable document scanning/upload (not just system exports)
3. Integrate with existing MinIO Smart Drive infrastructure
4. Leverage existing permission model and sharing system

## Non-Goals
- Real-time collaborative editing (Google Docs-style)
- External document sharing outside the LMS
- Automated attendance calculation (manual review only)
- Integration with external HR systems

## Assumptions
- [ASSUMPTION] Instructors have access to daily attendance screen with export functionality
- [ASSUMPTION] HR and Admin roles have permission to amend attendance records
- [ASSUMPTION] MinIO bucket `lms-workflow` will store workflow documents
- [ASSUMPTION] Existing attendance system has class, instructor, date, program, and subject data
- [ASSUMPTION] File versioning will use MinIO's native versioning capabilities

## Features

### F1: Document Submission from Attendance Screen

**User Story:** As an instructor, I want to export and submit attendance documents directly from the daily attendance screen so that I don't need to navigate to Smart Drive separately.

**Functional Requirements:**
- FR-1.1: System shall provide "Export & Submit for HR Review" button on daily attendance screen
- FR-1.2: System shall generate attendance report in Word or Excel format (existing export functionality)
- FR-1.3: System shall prompt user to confirm submission with optional comments
- FR-1.4: System shall upload document to `lms-workflow` bucket with structured naming convention
- FR-1.5: System shall link document to specific class, instructor, date, program, and subject
- FR-1.6: System shall create workflow document record with status "Submitted"
- FR-1.7: System shall notify HR of new submission via inbox/notification
- FR-1.8: System shall support manual file upload (Word/Excel/PDF) for scanned documents (treated as static attachments, no OCR)

**Document Naming Convention:**
```
attendance/{program}/{subject}/{class_id}/{date}/{instructor_id}/{timestamp}_{version}.{ext}
Example: attendance/Batch24/Mathematics/CLS-001/2026-05-23/INS-005/1716480000_v1.docx
```

### F2: Workflow Inbox and Review

**User Story:** As HR staff, I want to see all pending attendance document submissions in a centralized inbox so that I can review and approve them efficiently.

**Functional Requirements:**
- FR-2.1: System shall provide workflow inbox page for HR and Admin roles
- FR-2.2: System shall display submitted documents with metadata (class, date, instructor, status)
- FR-2.3: System shall support filtering by status, date range, program, instructor
- FR-2.4: System shall show unread count and allow bulk mark-as-read
- FR-2.5: System shall allow HR to view document details and download file
- FR-2.6: System shall display document version history with change attribution
- FR-2.7: System shall show all comments and feedback across review cycles
- FR-2.8: System shall allow HR to add comments without changing document status
- FR-2.9: System shall allow HR to approve document with optional comments
- FR-2.10: System shall allow HR to reject document with required feedback
- FR-2.11: System shall allow HR to return document to instructor/admin for amendment
- FR-2.12: System shall notify submitter of status changes via notification
- FR-2.13: System shall allow instructor to withdraw submitted document before HR review
- FR-2.14: System shall display SLA status (72 hours) with color coding in inbox
- FR-2.15: System shall sort inbox by SLA urgency (overdue items first)

### F3: Document Versioning and Change Tracking

**User Story:** As HR, I want to see full version history of attendance documents so that I can track who changed what and why for audit purposes.

**Functional Requirements:**
- FR-3.1: System shall use MinIO native versioning for document storage
- FR-3.2: System shall create new version on each upload (even by same user)
- FR-3.3: System shall record version metadata: uploader, timestamp, file size, comments
- FR-3.4: System shall display version history in chronological order
- FR-3.5: System shall allow users to download any previous version
- FR-3.6: System shall show diff summary between versions (file metadata, not content diff)
- FR-3.7: System shall prevent deletion of versions (soft delete only)
- FR-3.8: System shall maintain version history even after document approval

### F4: Attendance Amendment and Regeneration

**User Story:** As HR, I want to amend attendance records and regenerate the document so that the system reflects approved changes as the source of truth.

**Functional Requirements:**
- FR-4.1: System shall allow HR to amend attendance from HR attendance screen
- FR-4.2: System shall record all attendance changes with attribution (who, when, why)
- FR-4.3: System shall allow HR to re-export attendance report after amendments
- FR-4.4: System shall allow HR to upload regenerated document as new version
- FR-4.5: System shall auto-generate comment describing amendments made
- FR-4.6: System shall update document status to "Amended" after regeneration
- FR-4.7: System shall link regenerated document to original workflow record
- FR-4.8: System shall notify instructor of amendments via notification

### F5: Multi-Cycle Review and Resubmission

**User Story:** As an instructor, I want to resubmit documents after rejection so that I can address HR feedback without creating duplicate workflows.

**Functional Requirements:**
- FR-5.1: System shall allow unlimited resubmission cycles after rejection
- FR-5.2: System shall maintain single workflow record across resubmissions
- FR-5.3: System shall create new document version on each resubmission
- FR-5.4: System shall display all previous feedback in review history
- FR-5.5: System shall track number of review cycles per document
- FR-5.6: System shall allow HR to close workflow after 3 review cycles (configurable)
- FR-5.7: System shall notify HR of resubmission via notification

### F6: Custom Document Workflow

**User Story:** As any user, I want to submit arbitrary documents for approval so that I can use the workflow system beyond attendance reports.

**Functional Requirements:**
- FR-6.1: System shall provide "Create Workflow" action in Smart Drive file context menu
- FR-6.2: System shall allow users to select any file from Smart Drive for workflow submission
- FR-6.3: System shall copy file to `lms-workflow` bucket on workflow creation
- FR-6.4: System shall prompt user to specify workflow type, title, description
- FR-6.5: System shall allow users to assign reviewers (by role or specific user)
- FR-6.6: System shall support custom workflow types with configurable approval steps
- FR-6.7: System shall use same review/approval mechanics as attendance workflow
- FR-6.8: System shall maintain separate inbox views per workflow type
- FR-6.9: System shall allow optional file attachments for custom workflows (can trigger without attachment)

### F7: Status Tracking and Transitions

**User Story:** As a system administrator, I want clear status tracking so that I can monitor workflow progress and identify bottlenecks.

**Functional Requirements:**
- FR-7.1: System shall support status flow: Draft → Submitted → Under Review → Approved/Rejected → Amended → Closed
- FR-7.2: System shall record status transitions with actor and timestamp
- FR-7.3: System shall display current status prominently in inbox and detail views
- FR-7.4: System shall show status history in document detail view
- FR-7.5: System shall allow status-based filtering in inbox
- FR-7.6: System shall prevent invalid status transitions (e.g., Approved → Draft)
- FR-7.7: System shall allow Admin to override status with audit log entry
- FR-7.8: System shall provide workflow analytics (cycle time, approval rate, rejection reasons)

### F8: Permissions and Access Control

**User Story:** As a system administrator, I want role-based access control so that only authorized users can perform workflow actions.

**Functional Requirements:**
- FR-8.1: System shall integrate with existing Keycloak authentication
- FR-8.2: System shall reuse existing drive permissions for file operations
- FR-8.3: System shall add workflow-specific permissions: create, submit, review, approve, amend
- FR-8.4: System shall enforce role-based access to workflow inbox
- FR-8.5: System shall allow instructors to view only their own submissions
- FR-8.6: System shall allow any user with HR role to view and review all submissions (role-based delegation)
- FR-8.7: System shall allow Admin to view all submissions and override permissions
- FR-8.8: System shall log all permission denials for audit

## Non-Functional Requirements

### Performance
- NFR-1: Document upload must complete within 10 seconds for files up to 50MB
- NFR-2: Workflow inbox must load within 3 seconds with up to 1000 items
- NFR-3: Version history view must load within 2 seconds
- NFR-4: Document download must support HTTP Range requests for large files

### Security
- NFR-5: All workflow operations must require Keycloak authentication
- NFR-6: Document access must be restricted based on workflow ownership and permissions
- NFR-7: Audit logs must be immutable and tamper-evident
- NFR-8: Presigned URLs for file access must expire within 5 minutes

### Reliability
- NFR-9: System must maintain 99.5% uptime during business hours
- NFR-10: Document uploads must not be lost on server failure
- NFR-11: Version history must be preserved even if document is deleted
- NFR-12: System must handle concurrent submissions without data corruption

### Scalability
- NFR-13: System must support 10,000 concurrent workflow documents
- NFR-14: System must support 100 concurrent document uploads
- NFR-15: Database queries must be optimized for pagination with large datasets

### Usability
- NFR-16: UI must support Arabic and English languages
- NFR-17: UI must work on mobile, tablet, and desktop (320px to 1280px+)
- NFR-18: UI must respect dark mode theme
- NFR-19: Error messages must be clear and actionable
- NFR-20: Loading states must be visible for all async operations

### Maintainability
- NFR-21: Code must follow existing project patterns (ES modules, Prisma, React)
- NFR-22: All new code must be written testable by design
- NFR-23: API endpoints must follow existing `/api/v1/` convention
- NFR-24: Database changes must use Prisma `db push` (no migrations)

### Compliance
- NFR-25: All workflow actions must be auditable for 7 years
- NFR-26: System must support data export for regulatory requests

## User Journeys

### UJ-1: Instructor Submits Attendance Document

**Actor:** Instructor
**Trigger:** End of lecture, attendance taken

**Steps:**
1. Instructor navigates to daily attendance screen for completed class
2. Instructor reviews attendance data and clicks "Export & Submit for HR Review"
3. System generates attendance report (Word/Excel) and prompts for confirmation
4. Instructor adds optional comments (e.g., "2 students absent with sick leave notes")
5. Instructor confirms submission
6. System uploads document to `lms-workflow` bucket with structured naming
7. System creates workflow record with status "Submitted"
8. System sends notification to HR staff
9. Instructor sees confirmation with document ID and status

**Success Criteria:** Document submitted successfully, HR notified, instructor can track status

### UJ-2: HR Reviews and Approves Document

**Actor:** HR Staff
**Trigger:** New document in workflow inbox

**Steps:**
1. HR navigates to workflow inbox and filters by "Submitted" status
2. HR opens document detail view
3. HR downloads and reviews attendance document
4. HR checks version history (should be v1)
5. HR adds comment: "Looks correct, no issues"
6. HR clicks "Approve" with optional approval comment
7. System updates status to "Approved"
8. System notifies instructor of approval
9. HR marks inbox item as read

**Success Criteria:** Document approved, instructor notified, audit trail recorded

### UJ-3: HR Requests Amendment

**Actor:** HR Staff
**Trigger:** Attendance document has errors or missing information

**Steps:**
1. HR opens submitted document from inbox
2. HR reviews document and identifies issue (e.g., student marked absent but has excuse)
3. HR adds comment: "Student #15 has sick leave excuse - please amend"
4. HR clicks "Return to Instructor" with required feedback
5. System updates status to "Rejected" with feedback
6. System notifies instructor of rejection with feedback
7. Instructor receives notification and opens document
8. Instructor amends attendance record and re-exports document
9. Instructor resubmits document as new version (v2)
10. System updates status to "Submitted" (new cycle)
11. System notifies HR of resubmission

**Success Criteria:** Feedback delivered, document resubmitted, version history preserved

### UJ-4: HR Amends Attendance and Regenerates

**Actor:** HR Staff
**Trigger:** Instructor unable to amend, or HR has direct authority

**Steps:**
1. HR opens submitted document from inbox
2. HR identifies amendment needed (e.g., humanitarian case)
3. HR navigates to HR attendance screen
4. HR amends attendance record (e.g., change absent to excused)
5. System records amendment with attribution (HR user, timestamp, reason)
6. HR re-exports attendance report with amended data
7. HR uploads regenerated document as new version
8. System auto-generates comment: "Amended by HR: changed student #12 from absent to excused (humanitarian case)"
9. System updates status to "Amended"
10. System notifies instructor of amendment
11. Instructor views amendment in version history

**Success Criteria:** Attendance amended, document regenerated, audit trail complete

### UJ-5: Custom Document Submission

**Actor:** Any User (e.g., Admin)
**Trigger:** Need to submit non-attendance document for approval

**Steps:**
1. User navigates to Smart Drive
2. User selects file for workflow submission
3. User right-clicks and selects "Create Workflow"
4. System prompts for workflow type, title, description
5. User selects "General Approval" workflow type
6. User assigns reviewers (e.g., HR Manager)
7. User confirms submission
8. System copies file to `lms-workflow` bucket
9. System creates workflow record with status "Submitted"
10. System notifies assigned reviewers
11. User tracks status in workflow inbox

**Success Criteria:** Custom workflow created, reviewers notified, tracking enabled

## Data Model

### WorkflowDocument
- id (primary key)
- workflowType (enum: ATTENDANCE, GENERAL, CUSTOM)
- title (string)
- description (text)
- status (enum: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, AMENDED, CLOSED)
- fileId (foreign key to File model in MinIO system)
- submitterId (foreign key to User)
- currentAssigneeId (foreign key to User)
- classId (foreign key to Class, nullable for custom workflows)
- instructorId (foreign key to User, nullable)
- date (date, nullable)
- program (string, nullable)
- subject (string, nullable)
- submittedAt (timestamp)
- reviewedAt (timestamp, nullable)
- approvedAt (timestamp, nullable)
- approvedBy (foreign key to User, nullable)
- reviewCycleCount (integer, default 0)
- createdAt (timestamp)
- updatedAt (timestamp)
- auditFields (jsonb for soft delete tracking)

### WorkflowComment
- id (primary key)
- workflowDocumentId (foreign key)
- authorId (foreign key to User)
- comment (text)
- action (enum: SUBMITTED, COMMENTED, APPROVED, REJECTED, RETURNED, AMENDED, CLOSED)
- createdAt (timestamp)

### WorkflowStatusHistory
- id (primary key)
- workflowDocumentId (foreign key)
- fromStatus (enum)
- toStatus (enum)
- actorId (foreign key to User)
- reason (text, nullable)
- createdAt (timestamp)

### WorkflowPermission (extends existing drive permissions)
- workflowCreate (boolean)
- workflowSubmit (boolean)
- workflowReview (boolean)
- workflowApprove (boolean)
- workflowAmend (boolean)

## Resolved Decisions

1. **Scanned documents:** Treated as static attachments, no OCR processing
2. **Review cycles:** Maximum 3 cycles before HR can force-close workflow
3. **Withdrawal:** Instructors can withdraw submitted documents before HR review
4. **Archival:** Not implementing automatic archival (deferred for future consideration)
5. **Delegation:** Role-based - any user with HR role can review (not user-specific assignment)
6. **SLA:** 72-hour review SLA with clear UX color coding and inbox ordering by urgency
7. **Optional attachments:** Custom workflows can be triggered with or without file attachments

## Success Metrics

- SM-1: 95% of attendance documents submitted within 24 hours of class completion
- SM-2: Average HR review time < 48 hours
- SM-3: < 10% of documents require more than 2 review cycles
- SM-4: 100% of document changes have complete audit trail
- SM-5: User satisfaction score > 4.0/5.0 for workflow usability
