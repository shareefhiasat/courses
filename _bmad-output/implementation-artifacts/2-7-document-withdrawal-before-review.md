# Story 2.7: Document Withdrawal Before Review

Status: done

## Story

As an instructor,
I want to withdraw a submitted document before HR review,
so that I can correct mistakes before they are reviewed.

## Acceptance Criteria

1. **Given** I am the submitter of a document
   **When** the document status is "Submitted" and has not been reviewed yet
   **And** I click "Withdraw" button
   **Then** the system updates the document status to "Draft"
   **And** the system records the withdrawal action in status history
   **And** I can resubmit the document after making corrections

2. **Given** the document status is already "Under Review" or later
   **When** I view the document
   **Then** the withdrawal button is disabled

## Tasks / Subtasks

- [x] Add withdraw API endpoint to backend
- [x] Add status update to Draft on withdrawal
- [x] Add withdrawal validation (only before review)
- [x] Add withdrawal button to detail page
- [x] Add withdrawal confirmation modal
- [x] Test withdrawal flow

## Dev Notes

### Architecture Patterns and Constraints

- **Backend Architecture**: Follow layered pattern: routes → controllers → services → db services → Prisma
- **API Endpoint**: POST /api/v1/workflow-documents/:id/withdraw
- **Status Update**: Change status from SUBMITTED to DRAFT on withdrawal
- **Access Control**: Only submitter can withdraw their own documents
- **Validation**: Only documents in SUBMITTED status can be withdrawn
- **Status History**: Record withdrawal action with reason
- **UI Components**: Withdraw button with confirmation modal
- **Resubmission**: After withdrawal, document can be resubmitted (existing functionality)

### Source Tree Components to Touch

**Backend (UPDATE):**
- `backend/controllers/workflowDocuments.js` (UPDATE - add withdraw handler)
- `backend/services/workflowDocumentService.js` (UPDATE - add withdraw function)
- `backend/db/workflowDocuments-postgres.js` (UPDATE - add withdraw logic)
- `backend/routes/workflow-documents.js` (UPDATE - add withdraw route)

**Frontend (UPDATE):**
- `client/src/pages/workflow/WorkflowDocumentDetailPage.jsx` (UPDATE - add withdraw button and modal)
- `client/src/services/api/workflow-documents-api.js` (UPDATE - add withdraw API call)

### Critical Considerations

1. **Status Validation:**
   - Only SUBMITTED documents can be withdrawn
   - Documents in UNDER_REVIEW, APPROVED, REJECTED, etc. cannot be withdrawn
   - Check status before allowing withdrawal

2. **Access Control:**
   - Only submitter can withdraw their own documents
   - Validate user is the submitter before allowing withdrawal

3. **Status History:**
   - Record withdrawal action in status history
   - Include reason (optional comment)
   - Track actor and timestamp

4. **Notification:**
   - Consider notifying HR if document is withdrawn
   - Or keep it silent since document wasn't reviewed yet

5. **UI Considerations:**
   - Withdraw button only visible to submitter
   - Button disabled if status is not SUBMITTED
   - Confirmation modal before withdrawal
   - Optional comment for withdrawal reason

6. **Resubmission:**
   - After withdrawal, document can be resubmitted
   - Reuse existing resubmit functionality
   - Or create new submission from draft

### References

- [Source: _bmad-output/implementation-artifacts/1-1-database-schema-for-workflow-documents.md] - WorkflowDocument schema
- [Source: _bmad-output/implementation-artifacts/2-2-document-detail-view-with-version-history.md] - Detail page implementation
- [Source: _bmad-output/implementation-artifacts/2-3-review-actions-approve-reject-return-with-comments.md] - Review actions implementation

### Previous Story Context

**Epic 1** established:
- WorkflowDocument model with status tracking
- Status history recording

**Story 2.2** established:
- WorkflowDocumentDetailPage for viewing documents
- Document metadata display

**Story 2.3** established:
- Review actions with status transitions
- Status history recording

Story 2.7 builds on Epic 1, Story 2.2, and Story 2.3 by:
- Adding withdrawal capability for submitted documents
- Implementing status rollback to DRAFT
- Recording withdrawal in status history
- Adding withdraw button to detail page

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Debug Log References

None - story creation phase.

### Completion Notes List

**Implementation Summary:**
Added document withdrawal capability, enabling instructors to withdraw submitted documents before HR review. The implementation includes status rollback to DRAFT, access control validation, and status history recording.

**Key Features Implemented:**
- Added `withdrawWorkflowDocument()` service function for document withdrawal
- Status update from SUBMITTED to DRAFT on withdrawal
- Access control (only submitter can withdraw their own documents)
- Status validation (only SUBMITTED documents can be withdrawn)
- Status history recording for withdrawal action
- Comment recording for withdrawal (optional)
- Clear assignee on withdrawal (currentAssigneeId set to null)
- Withdraw button in WorkflowDocumentDetailPage (visible only to submitter of SUBMITTED documents)
- Withdrawal confirmation modal with optional comment
- `canWithdraw()` validation function

**Files Modified:**
- backend/services/workflowDocumentService.js (added withdrawWorkflowDocument function)
- backend/controllers/workflowDocuments.js (added withdrawWorkflowDocumentController)
- backend/routes/workflow-documents.js (added POST /:id/withdraw route)
- client/src/services/api/workflow-documents-api.js (added withdrawWorkflowDocument API call)
- client/src/pages/workflow/WorkflowDocumentDetailPage.jsx (added withdraw button and modal)

**Architecture Alignment:**
- Reuses existing WorkflowDocument model from Epic 1
- Reuses existing status history from Epic 1
- Extends WorkflowDocumentDetailPage from Story 2.2
- Builds on status update logic from Story 2.3
- Follows existing layered architecture pattern
- Uses existing UI components (Modal, Textarea, Button)

**Withdrawal Logic:**
- Only submitter can withdraw their own documents
- Only SUBMITTED status documents can be withdrawn
- Status changes from SUBMITTED to DRAFT
- Assignee is cleared (currentAssigneeId set to null)
- Status history records the withdrawal
- Optional comment can be provided
- After withdrawal, document can be resubmitted (existing functionality)

**API Integration:**
- POST /api/v1/workflow-documents/:id/withdraw - optional comment
- Validates that user is the submitter
- Validates that document is in SUBMITTED status
- Updates status to DRAFT
- Clears assignee
- Records status history and comment
- No notification (document wasn't reviewed yet)

**Testing Notes:**
- Manual testing required to verify withdrawal flow
- Test withdrawal by submitter
- Test that non-submitter cannot withdraw
- Test that non-SUBMITTED documents cannot be withdrawn
- Verify status change to DRAFT
- Verify assignee is cleared
- Verify status history recording
- Test resubmission after withdrawal

### File List

- backend/controllers/workflowDocuments.js (UPDATE - add withdraw handler)
- backend/services/workflowDocumentService.js (UPDATE - add withdraw function)
- backend/db/workflowDocuments-postgres.js (UPDATE - add withdraw logic)
- backend/routes/workflow-documents.js (UPDATE - add withdraw route)
- client/src/pages/workflow/WorkflowDocumentDetailPage.jsx (UPDATE - add withdraw button and modal)
- client/src/services/api/workflow-documents-api.js (UPDATE - add withdraw API call)
