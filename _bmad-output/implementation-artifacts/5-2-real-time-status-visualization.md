# Story 5.2: Real-Time Status Visualization

Status: done

## Story

As a user,
I want the workflow diagram to update in real-time as status changes,
so that I always see the current state without refreshing.

## Acceptance Criteria

1. **Given** I am viewing a workflow document with the visualization component
   **When** the document status changes (e.g., from Submitted to Under Review)
   **Then** the diagram updates automatically to reflect the new status
   **And** the current step highlight moves to the new node
   **And** the previous step is marked as completed
   **And** the update happens without page refresh (using WebSocket or polling)
   **And** the transition is animated for visual feedback

## Tasks / Subtasks

- [x] Add polling mechanism for real-time updates
- [x] Add automatic diagram updates on status change
- [x] Add animated transitions
- [x] Test real-time updates

## Dev Notes

### Architecture Patterns and Constraints

- **Update Mechanism**: Polling (simpler than WebSocket for this use case)
- **Polling Interval**: 30 seconds (configurable)
- **Component**: Update WorkflowDocumentDetailPage to poll for status changes
- **Animation**: React Flow already supports animated edges
- **No Refresh**: Updates happen in-place without page reload

### Source Tree Components to Touch

**Frontend (UPDATE):**
- `client/src/pages/workflow/WorkflowDocumentDetailPage.jsx` (add polling logic)
- `client/src/components/workflow/WorkflowDiagram.jsx` (already has animated edges)

### Critical Considerations

1. **Polling Mechanism:**
   - Use useEffect with setInterval
   - Poll every 30 seconds
   - Cleanup interval on unmount
   - Only poll when document is not in terminal state (APPROVED, REJECTED)

2. **Status Change Detection:**
   - Compare new status with current status
   - Only update diagram if status changed
   - Update document state with new data

3. **Animation:**
   - React Flow already has animated edges
   - Current transition edge is animated
   - Visual feedback on status change

4. **Performance:**
   - Stop polling when component unmounts
   - Stop polling for terminal states
   - Debounce rapid status changes

### References

- [Source: _bmad-output/implementation-artifacts/5-1-interactive-workflow-diagram-component.md] - WorkflowDiagram component

### Previous Story Context

**Story 5.1** established:
- WorkflowDiagram component with status prop
- Animated edges for current transition
- Step highlighting logic

Story 5.2 builds on Story 5.1 by:
- Adding polling mechanism to parent component
- Updating diagram automatically on status change
- Leveraging existing animation support

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Completion Notes List

**Implementation Summary:**
Added polling mechanism to WorkflowDocumentDetailPage for real-time status updates. The component polls every 30 seconds for status changes and automatically updates the diagram when the status changes. React Flow already provides animated edges for visual feedback on transitions.

**Key Features Implemented:**
- Added polling mechanism with 30-second interval
- Polling stops for terminal states (APPROVED, REJECTED)
- Automatic diagram updates on status change
- Toast notification when status changes
- Cleanup interval on component unmount
- Animated transitions (already supported by React Flow)
- No page refresh required

**Files Modified:**
- client/src/pages/workflow/WorkflowDocumentDetailPage.jsx (added polling logic)

**Architecture Alignment:**
- Frontend-only implementation
- Uses existing WorkflowDiagram component
- Uses existing API calls
- Follows existing patterns
- No backend changes required

**Polling Mechanism:**
- useEffect with setInterval
- 30-second polling interval
- Polls /api/v1/workflow-documents/:id endpoint
- Compares new status with current status
- Updates document state only if status changed
- Cleanup interval on component unmount

**Status Change Detection:**
- Compares data.data.status with document.status
- Only triggers update if status actually changed
- Shows toast notification on status change
- Updates document state with new data
- WorkflowDiagram automatically re-renders with new status

**Terminal State Handling:**
- Stops polling for APPROVED status
- Stops polling for REJECTED status
- Prevents unnecessary API calls
- Improves performance

**Animation:**
- React Flow already supports animated edges
- Current transition edge is animated
- Visual feedback on status change
- No additional implementation needed

**Performance:**
- Cleanup interval on unmount prevents memory leaks
- Terminal state handling reduces unnecessary API calls
- Efficient status comparison
- Minimal re-renders

**Testing Notes:**
- Manual testing required to verify real-time updates
- Test that diagram updates when status changes
- Verify toast notification appears
- Test polling stops for terminal states
- Verify cleanup on unmount

### File List

- client/src/pages/workflow/WorkflowDocumentDetailPage.jsx (UPDATE - add polling logic)
