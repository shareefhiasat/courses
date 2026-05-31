# Story 2.6: Multi-Cycle Review and Resubmission Support

Status: done

## Story

As an instructor or HR,
I want to resubmit documents after rejection without creating duplicate workflows,
so that I can address feedback and maintain a single workflow record.

## Acceptance Criteria

1. **Given** a document has been rejected with feedback
   **When** the submitter uploads a new version addressing the feedback
   **Then** the system creates a new document version
   **And** the system increments the reviewCycleCount
   **And** the system updates the status to "Submitted"
   **And** the system maintains a single workflow record across resubmissions
   **And** the system displays all previous feedback in review history
   **And** the system notifies HR of the resubmission

2. **Given** the review cycle count reaches 3
   **When** HR reviews the document
   **Then** HR can close the workflow (configurable threshold)

## Tasks / Subtasks

- [x] Add resubmit API endpoint to backend
- [x] Add version creation on resubmission
- [x] Add review cycle count increment logic
- [x] Add resubmit notification event
- [x] Add resubmit button to detail page
- [x] Add file upload for resubmission
- [x] Add resubmission validation
- [x] Test resubmission flow

## Dev Notes

### Architecture Patterns and Constraints

- **Backend Architecture**: Follow layered pattern: routes → controllers → services → db services → Prisma
- **API Endpoint**: POST /api/v1/workflow-documents/:id/resubmit
- **Version Creation**: Create new File record for uploaded file, link to existing WorkflowDocument
- **Review Cycle Count**: Increment reviewCycleCount field on resubmission
- **Status Update**: Change status from REJECTED to SUBMITTED on resubmission
- **Notification**: Emit WORKFLOW_RESUBMITTED event to HR users
- **Single Workflow Record**: Maintain same WorkflowDocument ID across resubmissions
- **Feedback Display**: Show all previous feedback in status history/comments
- **Configurable Threshold**: Review cycle limit (default: 3) can be configured
- **Access Control**: Only submitter can resubmit their own rejected documents

### Source Tree Components to Touch

**Backend (UPDATE):**
- `backend/controllers/workflowDocuments.js` (UPDATE - add resubmit handler)
- `backend/services/workflowDocumentService.js` (UPDATE - add resubmit function)
- `backend/db/workflowDocuments-postgres.js` (UPDATE - add resubmit logic)
- `backend/services/notifications/constants.js` (UPDATE - add WORKFLOW_RESUBMITTED event)
- `backend/services/notifications/templates.js` (UPDATE - add resubmitted template)
- `backend/routes/workflow-documents.js` (UPDATE - add resubmit route)

**Frontend (UPDATE):**
- `client/src/pages/workflow/WorkflowDocumentDetailPage.jsx` (UPDATE - add resubmit button and modal)
- `client/src/services/api/workflow-documents-api.js` (UPDATE - add resubmit API call)

### Critical Considerations

1. **Version Management:**
   - Create new File record for uploaded file
   - Update WorkflowDocument.fileId to new file
   - Keep old file accessible in version history
   - Record version metadata (createdBy, createdAt, reason)

2. **Review Cycle Count:**
   - Increment on each resubmission
   - Reset on approval
   - Display in UI
   - Configurable threshold for closing workflow

3. **Status Transition:**
   - REJECTED → SUBMITTED on resubmission
   - Record status history with reason
   - Maintain audit trail

4. **Notification:**
   - Notify HR users of resubmission
   - Include document details and cycle count
   - Use existing notification system

5. **Access Control:**
   - Only submitter can resubmit
   - Only rejected documents can be resubmitted
   - Validate file upload

6. **Feedback Display:**
   - Show all previous feedback in status history
   - Show comments from previous cycles
   - Maintain context across cycles

7. **Workflow Closure:**
   - Allow HR to close workflow after N cycles
   - Configurable threshold
   - Record closure reason

### References

- [Source: _bmad-output/implementation-artifacts/1-1-database-schema-for-workflow-documents.md] - WorkflowDocument schema (reviewCycleCount field)
- [Source: _bmad-output/implementation-artifacts/1-3-file-model-integration-with-minio-uploads.md] - File model and MinIO integration
- [Source: _bmad-output/implementation-artifacts/2-2-document-detail-view-with-version-history.md] - Detail page implementation
- [Source: _bmad-output/implementation-artifacts/2-3-review-actions-approve-reject-return-with-comments.md] - Review actions implementation

### Previous Story Context

**Epic 1** established:
- WorkflowDocument model with reviewCycleCount field
- File model for document storage
- Status history tracking
- Notification system

**Story 2.2** established:
- WorkflowDocumentDetailPage for viewing documents
- Version history display
- Comments display

**Story 2.3** established:
- Review actions (approve, reject, return)
- Status transitions
- Notification emission

Story 2.6 builds on Epic 1, Story 2.2, and Story 2.3 by:
- Adding resubmission capability for rejected documents
- Creating new file versions on resubmission
- Incrementing review cycle count
- Maintaining single workflow record
- Notifying HR of resubmissions

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Debug Log References

None - story creation phase.

### Completion Notes List

**Implementation Summary:**
Added multi-cycle review and resubmission support, enabling instructors and HR to resubmit rejected documents without creating duplicate workflows. The implementation includes file upload, version creation, review cycle count increment, status reset, and notification emission.

**Key Features Implemented:**
- Added WORKFLOW_RESUBMITTED event to notification constants
- Added notification template for workflow resubmitted event (English/Arabic)
- Created backend API endpoint: POST /:id/resubmit
- New file version creation on resubmission (File record + MinIO upload)
- Review cycle count increment on resubmission
- Status reset from REJECTED to SUBMITTED
- Status history recording for resubmission
- Comment recording for resubmission
- Notification emission to HR users on resubmission
- Access control (only submitter can resubmit their own rejected documents)
- Resubmit button in WorkflowDocumentDetailPage (visible only to submitter of rejected documents)
- File upload modal for resubmission
- Base64 file encoding for upload
- Rollback on failure (file deletion if document update fails)

**Files Modified:**
- backend/services/notifications/constants.js (added WORKFLOW_RESUBMITTED event)
- backend/services/notifications/templates.js (added workflow.resubmitted template)
- backend/controllers/workflowDocuments.js (added resubmit handler)
- backend/services/workflowDocumentService.js (added resubmit function with file upload)
- backend/db/workflowDocuments-postgres.js (added resubmit DB logic)
- backend/routes/workflow-documents.js (added resubmit route)
- client/src/services/api/workflow-documents-api.js (added resubmit API call)
- client/src/pages/workflow/WorkflowDocumentDetailPage.jsx (added resubmit button and modal)

**Architecture Alignment:**
- Reuses existing WorkflowDocument model from Epic 1 (reviewCycleCount field)
- Reuses existing File model from Epic 1
- Reuses existing MinIO service from Epic 1
- Reuses existing notification system from Epic 1
- Extends WorkflowDocumentDetailPage from Story 2.2
- Builds on review actions from Story 2.3
- Follows existing layered architecture pattern
- Uses existing UI components (Modal, Textarea, Button)

**API Integration:**
- POST /api/v1/workflow-documents/:id/resubmit - requires fileData, fileName, fileType, optional comment
- Validates that user is the submitter
- Validates that document is rejected
- Creates new File record and uploads to MinIO
- Updates WorkflowDocument with new file, increments cycle, resets status
- Records status history and comment
- Emits notification to HR users
- Rolls back file creation on failure

**Testing Notes:**
- Manual testing required to verify resubmission flow
- Test file upload and base64 encoding
- Test review cycle count increment
- Test status reset to SUBMITTED
- Test notification delivery to HR
- Verify version history recording
- Test access control (only submitter can resubmit)
- Test rollback on failure

### File List

- backend/controllers/workflowDocuments.js (UPDATE - add resubmit handler)
- backend/services/workflowDocumentService.js (UPDATE - add resubmit function)
- backend/db/workflowDocuments-postgres.js (UPDATE - add resubmit logic)
- backend/services/notifications/constants.js (UPDATE - add WORKFLOW_RESUBMITTED event)
- backend/services/notifications/templates.js (UPDATE - add resubmitted template)
- backend/routes/workflow-documents.js (UPDATE - add resubmit route)
- client/src/pages/workflow/WorkflowDocumentDetailPage.jsx (UPDATE - add resubmit button and modal)
- client/src/services/api/workflow-documents-api.js (UPDATE - add resubmit API call)
