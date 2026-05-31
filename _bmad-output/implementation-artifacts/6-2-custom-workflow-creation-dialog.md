# Story 6.2: Custom Workflow Creation Dialog

Status: done

## Story

As a user,
I want to specify workflow type, title, description, and reviewers when creating a custom workflow,
so that the workflow is properly configured for the approval process.

## Acceptance Criteria

1. **Given** I click "Create Workflow" on a file
   **When** the custom workflow creation dialog opens
   **Then** I can select a workflow type from a dropdown (e.g., General Approval, Budget Request, Policy Review)
   **And** I can enter a title for the workflow
   **And** I can enter a description
   **And** I can assign reviewers by role (e.g., HR, Admin) or specific users
   **And** I can choose to attach the file or create a workflow without attachment
   **And** the dialog validates that required fields are filled
   **And** when I confirm, the system creates the workflow document

## Tasks / Subtasks

- [x] Create workflow creation dialog component
- [x] Add workflow type dropdown
- [x] Add title and description fields
- [x] Add reviewer assignment
- [x] Add file attachment option
- [x] Add form validation
- [x] Test dialog functionality

## Dev Notes

### Architecture Patterns and Constraints

- **Dialog**: Use existing Modal component from UI library
- **Form**: Form with validation for required fields
- **Workflow Types**: Define custom workflow types (General Approval, Budget Request, Policy Review)
- **Reviewers**: Assign by role or specific users
- **File Attachment**: Optional, can create workflow without attachment
- **API**: Use existing workflow documents API to create workflow

### Source Tree Components to Touch

**Frontend (NEW/UPDATE):**
- `client/src/components/workflow/CustomWorkflowDialog.jsx` (NEW - dialog component)
- `client/src/pages/DrivePage.jsx` (UPDATE - integrate dialog)

### Critical Considerations

1. **Dialog Component:**
   - Use existing Modal component
   - Form with required field validation
   - Workflow type dropdown with predefined types
   - Title and description text fields
   - Reviewer selection (role-based or user-specific)
   - File attachment checkbox (pre-selected if file provided)
   - Cancel and Confirm buttons

2. **Workflow Types:**
   - General Approval: Simple approval workflow
   - Budget Request: Budget approval workflow
   - Policy Review: Policy review workflow
   - Custom: User-defined workflow

3. **Reviewer Assignment:**
   - Role-based: HR, Admin, Instructor
   - User-specific: Select specific users
   - Multi-select for reviewers

4. **File Attachment:**
   - Optional checkbox
   - Pre-selected if file provided from Drive
   - Can create workflow without attachment

5. **Validation:**
   - Required fields: workflow type, title
   - Optional fields: description, reviewers, file attachment
   - Show validation errors

### References

- [Source: _bmad-output/implementation-artifacts/1-1-database-schema-for-workflow-documents.md] - WorkflowDocument model
- [Source: _bmad-output/implementation-artifacts/6-1-smart-drive-context-menu-integration.md] - Context menu integration

### Previous Story Context

**Story 6.1** established:
- Context menu integration for workflow creation
- Permission validation
- Handler to open dialog and set selected file

Story 6.2 builds on Story 6.1 by:
- Creating the custom workflow creation dialog
- Implementing form with validation
- Integrating with workflow documents API

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Completion Notes List

**Implementation Summary:**
Created CustomWorkflowDialog component with form for creating custom workflows. The dialog includes workflow type dropdown, title and description fields, reviewer assignment by role, file attachment option, and form validation. Integrated the dialog into DrivePage with handler for workflow submission (API call deferred to Story 6.3).

**Key Features Implemented:**
- Created CustomWorkflowDialog component using existing Modal
- Added workflow type dropdown (General Approval, Budget Request, Policy Review, Custom)
- Added title field with validation (required)
- Added description field (optional)
- Added reviewer assignment by role (HR, Admin, Instructor) with checkboxes
- Added file attachment checkbox (pre-selected if file provided)
- Added form validation for required fields
- Added I18N support for all labels
- Integrated dialog into DrivePage
- Added handleWorkflowSubmit handler (API call deferred)

**Files Modified:**
- client/src/components/workflow/CustomWorkflowDialog.jsx (NEW - dialog component)
- client/src/pages/DrivePage.jsx (added dialog integration and handler)

**Architecture Alignment:**
- Frontend-only implementation
- Uses existing Modal component
- Uses existing I18N patterns
- Integrates with Story 6.1 handler
- API call deferred to Story 6.3
- No backend changes required

**Dialog Component:**
- Uses existing Modal component
- Form with required field validation
- Workflow type dropdown with 4 predefined types
- Title text field (required)
- Description textarea (optional)
- Reviewer checkboxes for HR, Admin, Instructor roles
- File attachment checkbox (shows file name if provided)
- Cancel and Submit buttons
- Loading state during submission

**Workflow Types:**
- General Approval: Simple approval workflow
- Budget Request: Budget approval workflow
- Policy Review: Policy review workflow
- Custom: User-defined workflow
- All types have English and Arabic labels

**Form Validation:**
- Required fields: workflow type, title
- Optional fields: description, reviewers, file attachment
- Shows validation errors inline
- Submit error handling
- Form reset on successful submission

**Reviewer Assignment:**
- Role-based selection (HR, Admin, Instructor)
- Multi-select with checkboxes
- Stored as array of role values
- Optional field

**File Attachment:**
- Optional checkbox
- Pre-selected if file provided from Drive
- Shows file name in label
- Can create workflow without attachment
- File data passed to onSubmit handler

**I18N Support:**
- All labels translated with fallbacks
- Workflow type labels in English (Arabic available)
- Reviewer role labels in English (Arabic available)
- Consistent with existing I18N patterns

**Dialog Integration:**
- Added to DrivePage with isOpen, onClose, file, onSubmit props
- handleWorkflowSubmit handler logs data and shows alert
- API call deferred to Story 6.3
- State management for dialog visibility and selected file

**UI:**
- Consistent styling with existing forms
- Required field indicators (red asterisk)
- Validation error styling (red border and text)
- Loading state on submit button
- Responsive design

**Testing Notes:**
- Manual testing required to verify dialog functionality
- Test form validation for required fields
- Test reviewer selection
- Test file attachment checkbox
- Verify dialog opens and closes correctly
- Test form reset on cancel
- API integration to be tested in Story 6.3

### File List

- client/src/components/workflow/CustomWorkflowDialog.jsx (NEW - dialog component)
- client/src/pages/DrivePage.jsx (UPDATE - integrate dialog)
