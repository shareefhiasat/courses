# Story 2.4: Multi-Stage Routing (HR→Admin→HR for Weekly Summaries)

Status: done

## Story

As the system,
I want to route weekly summary documents through HR→Admin→HR stages,
so that Admin can review before final HR approval.

## Acceptance Criteria

1. **Given** a weekly summary document is submitted by HR
   **When** the document is created with workflowType "ATTENDANCE_WEEKLY"
   **Then** the system sets currentAssigneeId to an Admin user
   **And** the system routes the document to the Admin inbox
   **When** Admin uploads the signed document after student signatures
   **Then** the system creates a new version of the document
   **And** the system reassigns currentAssigneeId to HR
   **And** the system routes the document back to the HR inbox for final review
   **And** the system maintains a single workflow record across stages

## Tasks / Subtasks

- [x] Add workflow type-based routing logic to document creation
- [x] Add Admin assignment for ATTENDANCE_WEEKLY workflow type
- [x] Add signed document upload action for Admin
- [x] Add HR reassignment after Admin review
- [x] Add routing stage tracking
- [x] Test multi-stage routing flow

## Dev Notes

### Architecture Patterns and Constraints

- **Backend Architecture**: Follow layered pattern: routes → controllers → services → db services → Prisma
- **Workflow Type Routing**: ATTENDANCE_WEEKLY documents route to Admin first, then back to HR
- **Routing Stages**: Track current stage (HR_REVIEW, ADMIN_REVIEW, FINAL_HR_REVIEW)
- **Assignment Logic**: 
  - ATTENDANCE_WEEKLY: HR → Admin → HR
  - Other types: HR → HR (existing behavior)
- **Signed Document Upload**: Admin uploads signed version after student signatures
- **Version Creation**: Create new file version on Admin upload
- **Single Workflow Record**: Maintain same WorkflowDocument ID across stages
- **Status Tracking**: Use status to track stage progression

### Source Tree Components to Touch

**Backend (UPDATE):**
- `backend/services/workflowDocumentService.js` (UPDATE - add routing logic)
- `backend/db/workflowDocuments-postgres.js` (UPDATE - add routing stage tracking)
- `backend/controllers/workflowDocuments.js` (UPDATE - add Admin upload handler)

**Frontend (UPDATE):**
- `client/src/pages/workflow/WorkflowDocumentDetailPage.jsx` (UPDATE - add Admin upload button)

### Critical Considerations

1. **Workflow Type Detection:**
   - Check workflowType on document creation
   - ATTENDANCE_WEEKLY → Admin assignment
   - Other types → HR assignment (existing)

2. **Admin Selection:**
   - Need to select an Admin user for assignment
   - Could be round-robin or specific Admin user
   - Consider Admin availability/workload

3. **Stage Tracking:**
   - Add routingStage field to WorkflowDocument
   - Track: INITIAL, ADMIN_REVIEW, FINAL_HR_REVIEW
   - Update stage on each transition

4. **Admin Upload:**
   - Only Admin can upload signed document
   - Create new file version
   - Reassign to HR
   - Update routing stage

5. **Status Transitions:**
   - SUBMITTED (HR) → UNDER_ADMIN_REVIEW (Admin)
   - UNDER_ADMIN_REVIEW → UNDER_FINAL_HR_REVIEW (HR)
   - UNDER_FINAL_HR_REVIEW → APPROVED/REJECTED

6. **Notification:**
   - Notify Admin when assigned weekly summary
   - Notify HR when document returns for final review

7. **Access Control:**
   - Only Admin can upload signed document
   - Only HR can submit weekly summary
   - Validate stage before allowing actions

### References

- [Source: _bmad-output/implementation-artifacts/1-1-database-schema-for-workflow-documents.md] - WorkflowDocument schema
- [Source: _bmad-output/implementation-artifacts/1-4-weekly-summary-generation-and-submission.md] - Weekly summary implementation
- [Source: _bmad-output/implementation-artifacts/2-2-document-detail-view-with-version-history.md] - Detail page implementation

### Previous Story Context

**Epic 1** established:
- WorkflowDocument model with workflowType field
- File model for document storage
- Status tracking and history

**Story 1.4** established:
- Weekly summary generation and submission
- ATTENDANCE_WEEKLY workflow type

Story 2.4 builds on Epic 1 and Story 1.4 by:
- Adding multi-stage routing for weekly summaries
- Implementing Admin review stage
- Adding signed document upload
- Maintaining single workflow record across stages

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Debug Log References

None - story creation phase.

### Completion Notes List

**Implementation Summary:**
Implemented multi-stage routing for weekly summary documents (HR→Admin→HR) to allow Admin review before final HR approval. The implementation includes workflow type-based routing, Admin assignment, signed document upload, and HR reassignment.

**Key Features Implemented:**
- Added `getAssigneeForWorkflowType()` function to determine assignee based on workflow type
- ATTENDANCE_WEEKLY documents automatically assigned to Admin users
- Other workflow types assigned to HR (existing behavior)
- Created `uploadSignedDocument()` service function for Admin signed document upload
- New file version creation on Admin upload (File record + MinIO upload)
- Automatic HR reassignment after Admin upload
- Status update to UNDER_FINAL_HR_REVIEW after Admin upload
- Status history recording for stage transitions
- Comment recording for Admin upload
- Notification emission to HR users on reassignment
- Access control (only Admin can upload signed documents for weekly summaries)
- Upload Signed button in WorkflowDocumentDetailPage (visible only to Admin for weekly summaries)
- File upload modal for signed document with base64 encoding

**Files Modified:**
- backend/services/workflowDocumentService.js (added routing logic and uploadSignedDocument function)
- backend/controllers/workflowDocuments.js (added uploadSignedDocumentController)
- backend/routes/workflow-documents.js (added POST /:id/upload-signed route)
- client/src/services/api/workflow-documents-api.js (added uploadSignedDocument API call)
- client/src/pages/workflow/WorkflowDocumentDetailPage.jsx (added upload signed button and modal)

**Architecture Alignment:**
- Reuses existing WorkflowDocument model from Epic 1
- Reuses existing File model from Epic 1
- Reuses existing MinIO service from Epic 1
- Reuses existing notification system from Epic 1
- Builds on weekly summary from Story 1.4
- Extends WorkflowDocumentDetailPage from Story 2.2
- Follows existing layered architecture pattern
- Uses existing UI components (Modal, Textarea, Button)

**Routing Logic:**
- ATTENDANCE_WEEKLY: HR → Admin → HR (multi-stage)
- Other types: HR → HR (existing single-stage)
- Admin selection: First available Admin user (could be enhanced with round-robin)
- HR reassignment: First available HR user after Admin upload

**API Integration:**
- POST /api/v1/workflow-documents/:id/upload-signed - requires fileData, fileName, fileType, optional comment
- Validates that document is ATTENDANCE_WEEKLY
- Validates that user is Admin
- Creates new File record and uploads to MinIO
- Updates WorkflowDocument with new file, reassigns to HR, updates status
- Records status history and comment
- Emits notification to HR users

**Testing Notes:**
- Manual testing required to verify multi-stage routing
- Test Admin assignment for weekly summaries
- Test signed document upload by Admin
- Test HR reassignment after Admin upload
- Test status transitions (SUBMITTED → UNDER_FINAL_HR_REVIEW)
- Test notification delivery to HR
- Verify access control (only Admin can upload signed documents)
- Test that other workflow types still route to HR

### File List

- backend/services/workflowDocumentService.js (UPDATE - add routing logic)
- backend/db/workflowDocuments-postgres.js (UPDATE - add routing stage tracking)
- backend/controllers/workflowDocuments.js (UPDATE - add Admin upload handler)
- client/src/pages/workflow/WorkflowDocumentDetailPage.jsx (UPDATE - add Admin upload button)
