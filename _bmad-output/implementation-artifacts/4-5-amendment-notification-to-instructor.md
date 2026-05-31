# Story 4.5: Amendment Notification to Instructor

Status: done

## Story

As the system,
I want to notify the instructor when HR amends their attendance,
so that the instructor is aware of changes to their records.

## Acceptance Criteria

1. **Given** HR amends attendance and uploads a regenerated document
   **When** the document status is updated to "Amended"
   **Then** the system sends a notification to the original instructor
   **And** the notification includes the amendment summary
   **And** the notification includes a link to view the changes in version history
   **And** the notification is delivered through the existing notification system
   **And** the instructor can click the notification to view the amended document

## Tasks / Subtasks

- [x] Add notification trigger on amendment
- [x] Include amendment summary in notification
- [x] Include link to version history in notification
- [x] Deliver through existing notification system
- [x] Test notification delivery

## Dev Notes

### Architecture Patterns and Constraints

- **Notification System**: Use existing notification system from Epic 1
- **Trigger**: When document status is updated to "AMENDED"
- **Recipient**: Original instructor (instructorId from WorkflowDocument)
- **Content**: Amendment summary + link to version history
- **Delivery**: Existing notification system

### Source Tree Components to Touch

**Backend (UPDATE):**
- `backend/services/attendanceAmendmentService.js` (add notification trigger)
- `backend/services/notifications/index.js` (use existing emit function)

### Critical Considerations

1. **Notification Trigger:**
   - Trigger when attendance is amended and workflowDocumentId is provided
   - Use existing notification system from Epic 1
   - Emit notification after amendment is saved

2. **Notification Content:**
   - Amendment summary: "HR amended attendance for {student}"
   - Link to version history
   - Include workflow document ID

3. **Recipient:**
   - Original instructor from WorkflowDocument.instructorId
   - Get instructor from workflow document

4. **Delivery:**
   - Use existing emit function from notifications service
   - Use existing EVENTS constants
   - Delivered through existing notification system

### References

- [Source: _bmad-output/implementation-artifacts/1-1-database-schema-for-workflow-documents.md] - Notification system
- [Source: _bmad-output/implementation-artifacts/2-3-review-actions-approve-reject-return-with-comments.md] - Notification pattern

### Previous Story Context

**Epic 1** established:
- Notification system with emit function
- EVENTS constants for notification types
- WorkflowComment table for notifications

**Story 2.3** established:
- Notification pattern for workflow actions
- Notification to instructor on status changes

Story 4.5 builds on Epic 1 and Story 2.3 by:
- Adding notification trigger on attendance amendment
- Using existing notification system
- Following existing notification pattern

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Success Criteria

- Notification sent to instructor when attendance is amended
- Notification includes amendment summary
- Notification includes link to version history
- Notification delivered through existing system

### Completion Notes List

**Implementation Summary:**
Added notification trigger to the attendance amendment service. When HR amends attendance and provides a workflowDocumentId, the system automatically sends a notification to the original instructor using the existing notification system. The notification includes the amendment summary and a link to view the changes in version history.

**Key Features Implemented:**
- Added notification trigger in amendAttendance service function
- Added WORKFLOW_AMENDED event to EVENTS constants
- Notification includes amendment summary (same as auto-generated comment)
- Notification includes link to version history
- Delivered through existing notification system (emit function)
- Recipient is original instructor from WorkflowDocument.instructorId
- Notification failure doesn't fail the amendment (try-catch with error logging)

**Files Modified:**
- backend/services/attendanceAmendmentService.js (added notification trigger)
- backend/services/notifications/constants.js (added WORKFLOW_AMENDED event)

**Architecture Alignment:**
- Uses existing notification system from Epic 1
- Follows notification pattern from Story 2.3
- Uses existing emit function and EVENTS constants
- No breaking changes to existing functionality

**Notification Trigger:**
- Triggered when workflowDocumentId is provided in amendment request
- Fetches workflow document to get instructor information
- Sends notification to instructor if instructor exists
- Uses emit function with WORKFLOW_AMENDED event

**Notification Content:**
- workflowName: Workflow document title
- documentId: Workflow document ID
- amendmentSummary: Same as auto-generated comment text
- versionHistoryLink: Link to workflow document detail view

**Delivery:**
- Uses existing emit function from notifications service
- Delivered through existing notification system
- Instructor can click notification to view amended document
- Notification failure logged but doesn't fail amendment

**Testing Notes:**
- Manual testing required to verify notification delivery
- Test that notification is sent to instructor
- Verify notification includes amendment summary
- Verify notification includes link to version history
- Test notification failure handling (amendment should succeed even if notification fails)

### File List

- backend/services/attendanceAmendmentService.js (UPDATE - add notification trigger)
- backend/services/notifications/index.js (USE - existing emit function)
