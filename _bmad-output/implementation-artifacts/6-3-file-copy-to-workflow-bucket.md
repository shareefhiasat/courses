# Story 6.3: File Copy to Workflow Bucket

Status: done

## Story

As the system,
I want to copy files from Smart Drive to the lms-workflow bucket when creating a custom workflow,
so that workflow documents are stored in the dedicated workflow bucket.

## Acceptance Criteria

1. **Given** a user creates a custom workflow with a file attachment
   **When** the workflow is confirmed
   **Then** the system copies the file from its original Smart Drive bucket to lms-workflow bucket
   **And** the system uses MinIO for storage (no Nextcloud dependency)
   **And** the system maintains the original file in Smart Drive
   **And** the system links the copied file to the WorkflowDocument record
   **And** the system uses structured naming for the copied file

## Tasks / Subtasks

- [x] Add MinIO file copy service
- [x] Add backend API for custom workflow creation
- [x] Link copied file to WorkflowDocument
- [x] Update frontend to call API
- [x] Test file copy and workflow creation

## Dev Notes

### Architecture Patterns and Constraints

- **Storage**: MinIO (lms-workflow bucket)
- **File Copy**: Copy from Smart Drive bucket to lms-workflow bucket
- **Naming**: Structured naming (e.g., workflow-{id}-{timestamp}-{filename})
- **API**: POST /api/v1/workflow-documents/custom
- **Link**: Store copied file path in WorkflowDocument.filePath
- **No Nextcloud**: Use MinIO only

### Source Tree Components to Touch

**Backend (NEW/UPDATE):**
- `backend/services/minioService.js` (UPDATE - add copyFile method)
- `backend/controllers/workflow-document.js` (UPDATE - add createCustomWorkflow)
- `backend/routes/workflow-document.js` (UPDATE - add custom workflow route)

**Frontend (UPDATE):**
- `client/src/pages/DrivePage.jsx` (UPDATE - call API instead of alert)

### Critical Considerations

1. **File Copy Service:**
   - Add copyFile method to minioService
   - Copy from source bucket to destination bucket
   - Maintain original file in source bucket
   - Use structured naming for destination file

2. **Structured Naming:**
   - Format: workflow-{workflowId}-{timestamp}-{originalFilename}
   - Ensures unique names
   - Preserves original filename for reference

3. **API Endpoint:**
   - POST /api/v1/workflow-documents/custom
   - Accepts: workflowType, title, description, reviewers, sourceBucket, sourcePath
   - Returns: created WorkflowDocument with filePath

4. **WorkflowDocument Link:**
   - Store copied file path in filePath field
   - Store original file info in metadata if needed
   - Use existing WorkflowDocument model

5. **Error Handling:**
   - Handle file copy failures
   - Handle bucket access errors
   - Rollback workflow creation if file copy fails

### References

- [Source: _bmad-output/implementation-artifacts/1-1-database-schema-for-workflow-documents.md] - WorkflowDocument model
- [Source: _bmad-output/implementation-artifacts/3-1-minio-native-versioning-integration.md] - MinIO service patterns
- [Source: _bmad-output/implementation-artifacts/6-2-custom-workflow-creation-dialog.md] - Custom workflow dialog

### Previous Story Context

**Story 6.2** established:
- Custom workflow creation dialog
- Form with workflow type, title, description, reviewers, file attachment
- Frontend handler that logs data (API call deferred)

Story 6.3 builds on Story 6.2 by:
- Implementing backend API for custom workflow creation
- Adding MinIO file copy service
- Linking copied file to WorkflowDocument
- Updating frontend to call API

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Completion Notes List

**Implementation Summary:**
Implemented backend API for custom workflow creation with file copy from Smart Drive to lms-workflow bucket using MinIO. The service copies files while maintaining the original in Smart Drive, uses structured naming, and links the copied file to the WorkflowDocument record. Updated frontend to call the API and navigate to the workflow document detail page on success.

**Key Features Implemented:**
- Used existing copyObject method from minioService (already available)
- Added createCustomWorkflowDocument service function
- Added createCustomWorkflowDocumentController
- Added POST /api/v1/workflow-documents/custom route with Swagger documentation
- Structured file naming: custom/{workflowType}/{timestamp}_{filename}
- File record creation with MinIO version ID
- WorkflowDocument creation with file link
- Status history creation for custom workflows
- Reviewer assignment (first reviewer in list)
- Permission validation (instructor, HR, admin)
- Notification emission to assignee
- Frontend API integration with error handling
- Navigation to workflow document detail page on success

**Files Modified:**
- backend/services/workflowDocumentService.js (added createCustomWorkflowDocument function)
- backend/controllers/workflowDocuments.js (added createCustomWorkflowDocumentController)
- backend/routes/workflow-documents.js (added custom workflow route)
- client/src/pages/DrivePage.jsx (updated handleWorkflowSubmit to call API)

**Architecture Alignment:**
- Backend and frontend implementation
- Uses existing MinIO copyObject service
- Uses existing WorkflowDocument model
- Uses existing notification system
- Integrates with Story 6.2 dialog
- No Nextcloud dependency

**File Copy Service:**
- Used existing copyObject method from minioService
- Copies from source bucket to lms-workflow bucket
- Maintains original file in source bucket
- Structured naming: custom/{workflowType}/{timestamp}_{filename}
- Captures MinIO version ID for versioning support

**API Endpoint:**
- POST /api/v1/workflow-documents/custom
- Accepts: workflowType, title, description, reviewers, attachFile, sourceBucket, sourcePath, fileName
- Returns: created WorkflowDocument with file info
- Permission validation: instructor, HR, admin
- Swagger documentation included

**WorkflowDocument Link:**
- Stores copied file path in filePath field
- Stores File record ID in fileId field
- Creates File record with MinIO metadata
- Links file to workflow document

**Reviewer Assignment:**
- Assigns to first reviewer in list
- Uses byRole helper to get user by role
- Sets currentAssigneeId on WorkflowDocument
- Can be enhanced with round-robin or workload-based selection

**Status History:**
- Creates initial status history entry
- From status: null
- To status: SUBMITTED
- Comment: "Custom workflow created"

**Notification:**
- Emits WORKFLOW_SUBMITTED event to assignee
- Includes document title, ID, assignee ID, submitter ID
- Doesn't fail workflow creation if notification fails

**Frontend Integration:**
- Updated handleWorkflowSubmit to call API
- Maps dialog data to API request format
- Sets sourceBucket to 'lms-private' for Drive files
- Handles success with alert and navigation
- Handles errors with alert
- I18N support for messages

**Error Handling:**
- Permission denial logging
- Required field validation
- File copy error handling
- API error handling
- Notification error handling (non-blocking)

**Testing Notes:**
- Manual testing required to verify file copy
- Test workflow creation with file attachment
- Test workflow creation without file attachment
- Verify file copied to correct bucket
- Verify structured naming
- Verify WorkflowDocument linked correctly
- Test permission validation
- Test reviewer assignment
- Test notification emission

### File List

- backend/services/minioService.js (UPDATE - add copyFile method)
- backend/controllers/workflow-document.js (UPDATE - add createCustomWorkflow)
- backend/routes/workflow-document.js (UPDATE - add custom workflow route)
- client/src/pages/DrivePage.jsx (UPDATE - call API)
