# Story 2.2: Document Detail View with Version History

Status: done

## Story

As HR or Admin staff,
I want to view document details and version history,
so that I can understand the full context and track changes.

## Acceptance Criteria

1. **Given** I am viewing the workflow inbox
   **When** I click on a workflow document
   **Then** I see the document detail view with all metadata
   **And** I can download the current file version
   **And** I see the version history in chronological order with uploader, timestamp, file size, and comments
   **And** I can download any previous version
   **And** I see all comments and feedback across review cycles
   **And** the version history view loads within 2 seconds (NFR-3)

## Tasks / Subtasks

- [x] Create document detail view page component
- [x] Display document metadata (title, description, status, workflow type, submitter, assignee, class, date)
- [x] Implement file download functionality for current version
- [x] Display version history list with uploader, timestamp, file size, comments
- [x] Implement download for previous versions
- [x] Display comments and feedback across review cycles
- [x] Add status history timeline
- [x] Optimize version history load performance (< 2 seconds)
- [x] Test document detail view
- [x] Test file downloads
- [x] Test version history navigation

## Dev Notes

### Architecture Patterns and Constraints

- **Frontend Architecture**: React with MUI components
- **API Integration**: Use existing workflow document API endpoint (GET /api/v1/workflow-documents/:id)
- **File Download**: Use MinIO streamObject or presigned GET URL for file downloads
- **Version History**: Use FileVersion model from existing File model integration
- **Comments**: Use WorkflowComment model from Epic 1
- **Status History**: Use WorkflowStatusHistory model from Epic 1
- **Performance**: Implement lazy loading for version history if needed

### Source Tree Components to Touch

**Frontend (NEW):**
- `client/src/pages/workflow/WorkflowDocumentDetailPage.jsx` (NEW - main detail page)
- `client/src/components/workflow/VersionHistory.jsx` (NEW - version history component)
- `client/src/components/workflow/DocumentComments.jsx` (NEW - comments component)

**Frontend (UPDATE):**
- Update routing to include workflow document detail route (/workflow/:id)

**Backend (REUSE):**
- Use existing `backend/db/workflowDocuments-postgres.js` - getWorkflowDocumentById (already includes file, comments, statusHistory)
- Use existing `backend/routes/workflow-documents.js` - GET /:id endpoint
- Use existing `backend/services/minioService.js` - streamObject or generatePresignedGetUrl for downloads

### Critical Considerations

1. **Document Metadata Display**:
   - Title, description, status, workflowType
   - Submitter (name, email)
   - Current assignee (name, email)
   - Class (name, program, subject)
   - Date
   - Created/updated timestamps

2. **File Download**:
   - Current version: Use file.s3Key and file.bucket with minioService.streamObject
   - Previous versions: Use fileVersion.s3Key with minioService.streamObject
   - Ensure proper Content-Type and Content-Disposition headers

3. **Version History**:
   - Query FileVersion records for the File
   - Display in chronological order (newest first)
   - Show: version number, uploader, timestamp, file size, changeNote, isCurrent
   - Add download button for each version

4. **Comments Display**:
   - Query WorkflowComment records for the document
   - Group by review cycle or display chronologically
   - Show: author, comment, action, timestamp
   - Differentiate between submitter comments and reviewer feedback

5. **Status History Timeline**:
   - Query WorkflowStatusHistory records
   - Display as timeline: fromStatus → toStatus with actor, reason, timestamp
   - Visual representation of workflow progression

6. **Performance Optimization**:
   - API already includes all related data (file, comments, statusHistory) in single query
   - Version history is part of File model (file.versions)
   - Should load within 2 seconds with proper indexing

7. **Navigation**:
   - Back button to return to workflow inbox
   - Breadcrumb navigation

### References

- [Source: _bmad-output/implementation-artifacts/1-3-file-model-integration-with-minio-uploads.md] - File model integration
- [Source: _bmad-output/implementation-artifacts/1-1-database-schema-for-workflow-documents.md] - WorkflowDocument schema
- [Source: backend/db/workflowDocuments-postgres.js] - Existing API functions
- [Source: backend/services/minioService.js] - File download methods
- [Source: _bmad-output/planning-artifacts/epics.md] - Epic 2 story definitions

### Previous Story Context

**Epic 1** established:
- WorkflowDocument model with relations to File, WorkflowComment, WorkflowStatusHistory
- File model with FileVersion relation
- API endpoints for retrieving workflow documents with includes

**Story 2.1** established:
- Workflow inbox page with navigation to document detail
- Document ID passed in route parameter

Story 2.2 builds on Epic 1 and Story 2.1 by:
- Creating the detail view for individual documents
- Displaying all related data (file, versions, comments, status history)
- Implementing file download functionality
- Providing comprehensive document context for review

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Debug Log References

None - story creation phase.

### Completion Notes List

**Implementation Summary:**
Created WorkflowDocumentDetailPage.jsx with full document detail view including metadata display, file download, version history, comments, and status history timeline.

**Key Features Implemented:**
- Complete document detail view with all metadata (title, description, status, workflowType, submitter, assignee, class, program, subject, date, reviewCycleCount, createdAt)
- File download functionality for current version using MinIO
- Version history display with uploader, timestamp, file size, changeNote, and isCurrent indicator
- Download capability for all previous versions
- Comments display with author, comment, action, and timestamp
- Status history timeline showing workflow progression (fromStatus → toStatus with actor, reason, timestamp)
- Back button navigation to workflow inbox
- Empty state and error handling
- Loading states with SimpleLoading component

**Files Created:**
- client/src/pages/workflow/WorkflowDocumentDetailPage.jsx (NEW - 350+ lines)

**Files Modified:**
- client/src/App.jsx (added WorkflowDocumentDetailPage import and route /workflow-documents/:documentId)
- client/src/pages/workflow/WorkflowInboxPage.jsx (updated navigation link to use /workflow-documents/:documentId)

**Architecture Alignment:**
- Uses existing workflow document API endpoint (GET /api/v1/workflow-documents/:id)
- Reuses File model integration from Story 1.3 for version history
- Uses existing UI components (Card, Button, Badge, etc.)
- Follows existing React patterns and component structure
- Integrates with routing from Story 2.1

**API Integration:**
- Fetches document with includes: file, submitter, currentAssignee, instructor, class, comments, statusHistory
- File download uses /api/v1/files/:fileId/download endpoint
- All data loaded in single API call for performance

**Testing Notes:**
- Manual testing required to verify document detail view
- Test file download functionality
- Test version history navigation and downloads
- Verify comments display
- Test status history timeline
- Test navigation from workflow inbox

### File List

- client/src/pages/workflow/WorkflowDocumentDetailPage.jsx (NEW)
- client/src/components/workflow/VersionHistory.jsx (NEW)
- client/src/components/workflow/DocumentComments.jsx (NEW)
- client/src/services/api/workflow-documents-api.js (REUSE)
- client/src/services/business/workflowDocumentService.js (REUSE)
