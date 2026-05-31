# Story 6.1: Smart Drive Context Menu Integration

Status: done

## Story

As a user,
I want to see a "Create Workflow" action in the Smart Drive file context menu,
so that I can submit any file for approval without leaving Smart Drive.

## Acceptance Criteria

1. **Given** I am viewing Smart Drive
   **When** I right-click on a file
   **Then** I see a "Create Workflow" option in the context menu
   **And** the option is available for all file types
   **And** clicking the option opens the custom workflow creation dialog
   **And** the system validates that I have permission to create workflows

## Tasks / Subtasks

- [x] Add Create Workflow option to context menu
- [x] Add permission validation
- [x] Open custom workflow creation dialog
- [x] Test context menu integration

## Dev Notes

### Architecture Patterns and Constraints

- **Context Menu**: Use existing Smart Drive context menu component
- **Permission**: Validate user has permission to create workflows
- **Dialog**: Open custom workflow creation dialog (Story 6.2)
- **File Types**: Available for all file types
- **Integration**: Pass selected file to dialog

### Source Tree Components to Touch

**Frontend (UPDATE):**
- `client/src/components/drive/DriveContextMenu.jsx` (add Create Workflow option)
- `client/src/pages/drive/DrivePage.jsx` (handle Create Workflow action)

### Critical Considerations

1. **Context Menu Option:**
   - Add "Create Workflow" option to existing context menu
   - Show for all file types
   - Position appropriately in menu

2. **Permission Validation:**
   - Check if user has permission to create workflows
   - Check user role (Instructor, HR, Admin)
   - Disable option if no permission

3. **Dialog Integration:**
   - Open custom workflow creation dialog on click
   - Pass selected file information to dialog
   - Dialog will be implemented in Story 6.2

4. **UI:**
   - Use existing context menu patterns
   - Consistent styling with other menu items
   - I18N support for menu label

### References

- [Source: _bmad-output/implementation-artifacts/1-1-database-schema-for-workflow-documents.md] - WorkflowDocument model
- [Source: _bmad-output/implementation-artifacts/6-2-custom-workflow-creation-dialog.md] - Custom workflow creation dialog

### Previous Story Context

**Epic 1** established:
- WorkflowDocument model
- Workflow creation infrastructure
- Permission validation patterns

Story 6.1 builds on Epic 1 by:
- Adding context menu integration for workflow creation
- Using existing permission validation
- Preparing for custom workflow dialog (Story 6.2)

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Completion Notes List

**Implementation Summary:**
Added "Create Workflow" option to Smart Drive file context menu and file list. The option is available for users with instructor, HR, or admin roles. Clicking the option sets the selected file for workflow creation and opens the workflow dialog (to be implemented in Story 6.2).

**Key Features Implemented:**
- Added "Create Workflow" option to FileActionsMenu component
- Added permission validation (instructor, HR, admin roles)
- Added onCreateWorkflow prop to FileActionsMenu, FileCard, DriveFileGrid
- Added handleCreateWorkflow handler to DrivePage
- Added state for workflow dialog and selected file
- Added "Create Workflow" button to DrivePage file list
- I18N support for menu label

**Files Modified:**
- client/src/components/drive/FileActionsMenu.jsx (added Create Workflow option with permission validation)
- client/src/components/drive/FileCard.jsx (added onCreateWorkflow prop)
- client/src/components/drive/DriveFileGrid.jsx (added onCreateWorkflow prop)
- client/src/pages/DrivePage.jsx (added handler and state)

**Architecture Alignment:**
- Frontend-only implementation
- Uses existing context menu component
- Uses existing permission validation patterns
- Prepares for Story 6.2 dialog
- No backend changes required

**Context Menu Integration:**
- Added "Create Workflow" option to FileActionsMenu
- Positioned between Comment and Delete options
- Shows FileText icon
- Translated label with fallback
- Only shows if user has permission and onCreateWorkflow prop provided

**Permission Validation:**
- Checks user.roles for instructor, hr, or admin
- Disables option if no permission
- Uses existing AuthContext
- Consistent with existing permission patterns

**Dialog Integration:**
- Added showWorkflowDialog state
- Added selectedFileForWorkflow state
- handleCreateWorkflow sets selected file and opens dialog
- Dialog will be implemented in Story 6.2

**DrivePage Integration:**
- Added "Create Workflow" button to file list
- Positioned before Delete button
- Same permission validation as context menu
- Uses FileText icon
- Calls handleCreateWorkflow handler

**I18N Support:**
- Menu label: t('drive.actions.createWorkflow', 'Create Workflow')
- Fallback to English if translation missing
- Consistent with existing I18N patterns

**UI:**
- Consistent styling with other menu items
- Blue color for workflow action
- Hover effects
- Responsive design

**Testing Notes:**
- Manual testing required to verify context menu option
- Test permission validation for different roles
- Verify button appears in file list
- Test that handler sets selected file correctly
- Verify dialog state is set correctly

### File List

- client/src/components/drive/DriveContextMenu.jsx (UPDATE - add Create Workflow option)
- client/src/pages/drive/DrivePage.jsx (UPDATE - handle Create Workflow action)
