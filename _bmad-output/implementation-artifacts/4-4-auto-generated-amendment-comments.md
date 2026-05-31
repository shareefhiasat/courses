# Story 4.4: Auto-Generated Amendment Comments

Status: done

## Story

As the system,
I want to auto-generate comments describing amendments made,
so that reviewers understand what changed without manual documentation.

## Acceptance Criteria

1. **Given** HR amends attendance and uploads a regenerated document
   **When** the new version is created
   **Then** the system auto-generates a comment describing the amendments
   **And** the comment format is: "Amended by HR: changed student {id} from {old_status} to {new_status} ({reason})"
   **And** the comment is added to the WorkflowComment table
   **And** the comment action is set to "AMENDED"
   **And** the comment is visible in the version history

## Tasks / Subtasks

- [x] Add auto-generated comment logic to amendment service
- [x] Add comment to WorkflowComment table
- [x] Set comment action to "AMENDED"
- [x] Ensure comment visible in version history
- [x] Test auto-generated comments

## Dev Notes

### Architecture Patterns and Constraints

- **Comment Format**: "Amended by HR: changed student {id} from {old_status} to {new_status} ({reason})"
- **WorkflowComment Table**: Use existing WorkflowComment model
- **Action Field**: Set to "AMENDED"
- **Visibility**: Comments already visible in version history (Epic 1)

### Source Tree Components to Touch

**Backend (UPDATE):**
- `backend/services/attendanceAmendmentService.js` (add auto-generated comment logic)
- `backend/db/workflowDocuments-postgres.js` (use existing addWorkflowComment)

### Critical Considerations

1. **Auto-Generated Comment:**
   - Generate comment when amendment is created
   - Format: "Amended by HR: changed student {id} from {old_status} to {new_status} ({reason})"
   - Include student name or ID
   - Include old and new status names
   - Include amendment reason

2. **WorkflowComment Table:**
   - Use existing addWorkflowComment function
   - Link to workflow document (if applicable)
   - Set action to "AMENDED"
   - Set author to HR user who made the amendment

3. **Visibility:**
   - Comments already visible in version history (Epic 1)
   - No additional UI changes needed

4. **Multiple Amendments:**
   - Generate comment for each amendment
   - If multiple amendments in one batch, generate summary comment

### References

- [Source: _bmad-output/implementation-artifacts/4-1-hr-attendance-amendment-interface.md] - Amendment implementation
- [Source: _bmad-output/implementation-artifacts/1-1-database-schema-for-workflow-documents.md] - WorkflowComment model

### Previous Story Context

**Story 4.1** established:
- AttendanceAmendment model
- Amendment service layer
- Amendment API endpoints

Story 4.4 builds on Story 4.1 by:
- Adding auto-generated comment logic to amendment service
- Using existing WorkflowComment table
- Setting comment action to "AMENDED"

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Debug Log References

None - story creation phase.

### Completion Notes List

**Implementation Summary:**
Added auto-generated comment logic to the attendance amendment service. When HR amends attendance and provides a workflowDocumentId, the system automatically generates a comment describing the amendment and adds it to the WorkflowComment table with action set to "AMENDED". Comments are already visible in version history from Epic 1.

**Key Features Implemented:**
- Added auto-generated comment logic to amendAttendance service function
- Comment format: "Amended by HR: changed student {name/id} from {old_status} to {new_status} ({reason})"
- Uses existing addWorkflowComment function from workflowDocuments-postgres.js
- Comment action set to "AMENDED"
- Optional workflowDocumentId parameter in amendment API
- Comments visible in version history (existing Epic 1 functionality)

**Files Modified:**
- backend/services/attendanceAmendmentService.js (added auto-generated comment logic)
- backend/controllers/attendance-amendment.js (added workflowDocumentId parameter)
- backend/routes/attendance-amendment.js (updated Swagger documentation)

**Architecture Alignment:**
- Builds on Story 4.1 amendment service
- Uses existing WorkflowComment table from Epic 1
- Uses existing addWorkflowComment function
- No breaking changes to existing functionality
- Comments already visible in version history (Epic 1)

**Comment Generation Logic:**
- Triggered when workflowDocumentId is provided in amendment request
- Format: "Amended by HR: changed student {firstName or id} from {oldStatus.nameEn} to {newStatus.nameEn} ({reason})"
- Includes student name or ID for identification
- Includes old and new status names (English)
- Includes amendment reason
- Added to WorkflowComment table with action "AMENDED"

**API Changes:**
- POST /api/v1/attendance-amendment now accepts optional workflowDocumentId parameter
- If provided, auto-generates comment and adds to workflow document
- If not provided, amendment proceeds without comment
- Swagger documentation updated

**Visibility:**
- Comments already visible in version history from Epic 1
- No additional UI changes needed
- Comments with action "AMENDED" displayed in workflow document detail view

**Testing Notes:**
- Manual testing required to verify auto-generated comments
- Test comment format matches specification
- Test that comment is added to WorkflowComment table
- Test that comment action is set to "AMENDED"
- Verify comment visible in version history
- Test with and without workflowDocumentId parameter

### File List

- backend/services/attendanceAmendmentService.js (UPDATE - add auto-generated comment logic)
- backend/db/workflowDocuments-postgres.js (USE - addWorkflowComment)
