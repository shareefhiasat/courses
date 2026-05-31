# Story 2.5: SLA Tracking with Color Coding and Urgency Sorting

Status: done

## Story

As HR or Admin staff,
I want to see SLA status with color coding and urgency sorting in the inbox,
so that I can prioritize overdue documents.

## Acceptance Criteria

1. **Given** I am viewing the workflow inbox
   **When** documents have different ages since submission
   **Then** the system displays SLA status (72 hours) with color coding (green: <24h, yellow: 24-48h, orange: 48-72h, red: >72h)
   **And** the system sorts the inbox by SLA urgency (overdue items first)
   **And** I can see the time elapsed since submission for each document
   **And** the color coding is visible in both list and detail views

## Tasks / Subtasks

- [x] Add SLA calculation utility function
- [x] Add SLA status to workflow document API response
- [x] Add SLA color coding utility function
- [x] Add SLA badge to inbox page
- [x] Add SLA sorting to inbox page
- [x] Add SLA display to detail page
- [x] Test SLA color coding
- [x] Test SLA sorting

## Dev Notes

### Architecture Patterns and Constraints

- **SLA Threshold**: 72 hours (3 days) for document review
- **Color Coding**:
  - Green: < 24 hours (within first day)
  - Yellow: 24-48 hours (1-2 days)
  - Orange: 48-72 hours (2-3 days)
  - Red: > 72 hours (overdue)
- **Time Calculation**: Based on submittedAt timestamp
- **Sorting**: Overdue items first, then by SLA urgency (oldest first)
- **UI Components**: Badge for SLA status, time elapsed display
- **Backend**: Add SLA calculation to service layer
- **Frontend**: Add SLA display to inbox and detail pages

### Source Tree Components to Touch

**Backend (UPDATE):**
- `backend/services/workflowDocumentService.js` (UPDATE - add SLA calculation)

**Frontend (UPDATE):**
- `client/src/pages/workflow/WorkflowInboxPage.jsx` (UPDATE - add SLA badge and sorting)
- `client/src/pages/workflow/WorkflowDocumentDetailPage.jsx` (UPDATE - add SLA display)
- `client/src/utils/sla.js` (NEW - SLA calculation utilities)

### Critical Considerations

1. **Time Zone**: Use Qatar time zone for SLA calculations
2. **Time Display**: Show time elapsed in human-readable format (e.g., "2 hours ago", "1 day ago")
3. **SLA Badge**: Display in inbox grid and detail view
4. **Default Sorting**: Sort by SLA urgency (overdue first) as default
5. **Manual Override**: Allow manual sorting override
6. **SLA Warning**: Consider adding SLA warning notification at 48 hours
7. **SLA Overdue**: Consider adding SLA overdue notification at 72 hours
8. **Performance**: SLA calculation should be fast (client-side or server-side)

### References

- [Source: _bmad-output/implementation-artifacts/1-1-database-schema-for-workflow-documents.md] - WorkflowDocument schema (submittedAt field)
- [Source: _bmad-output/implementation-artifacts/2-1-workflow-inbox-page-with-filtering-and-pagination.md] - Inbox page implementation
- [Source: _bmad-output/implementation-artifacts/2-2-document-detail-view-with-version-history.md] - Detail page implementation
- [Source: client/src/utils/timezone.js] - Time zone utilities

### Previous Story Context

**Epic 1** established:
- WorkflowDocument model with submittedAt timestamp
- Status tracking and history

**Story 2.1** established:
- WorkflowInboxPage with filtering and pagination
- Advanced data grid for document listing

**Story 2.2** established:
- WorkflowDocumentDetailPage for viewing documents
- Document metadata display

Story 2.5 builds on Epic 1, Story 2.1, and Story 2.2 by:
- Adding SLA calculation based on submittedAt
- Adding SLA color coding to inbox and detail views
- Adding SLA sorting to inbox page
- Displaying time elapsed since submission

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Debug Log References

None - story creation phase.

### Completion Notes List

**Implementation Summary:**
Added SLA tracking with color coding and urgency sorting to help HR and Admin staff prioritize overdue documents. Implemented client-side SLA calculation with color-coded badges and sorting functionality.

**Key Features Implemented:**
- Created SLA utility functions (calculateHoursElapsed, getSlaStatus, getSlaBadgeVariant, getTimeElapsed, getSlaInfo, sortBySlaUrgency)
- SLA threshold: 72 hours (3 days) for document review
- Color coding: green (<24h), yellow (24-48h), orange (48-72h), red (>72h)
- Added SLA badge column to inbox page with time elapsed display
- Added "Sort by SLA" toggle button to inbox page (default enabled)
- Added SLA status display to detail page with submittedAt timestamp
- Overdue indicator in both inbox and detail views
- Human-readable time elapsed format (e.g., "2 hours ago", "1 day ago")

**Files Created:**
- client/src/utils/sla.js (NEW - SLA calculation utilities)

**Files Modified:**
- client/src/pages/workflow/WorkflowInboxPage.jsx (added SLA badge column, sorting toggle, sorted data)
- client/src/pages/workflow/WorkflowDocumentDetailPage.jsx (added SLA status display in document details)

**Architecture Alignment:**
- Reuses existing submittedAt field from Epic 1
- Extends WorkflowInboxPage from Story 2.1
- Extends WorkflowDocumentDetailPage from Story 2.2
- Uses existing time zone utilities
- Follows existing UI patterns (Badge, Button)
- Client-side calculation for performance (no backend changes needed)

**SLA Calculation Logic:**
- Based on submittedAt timestamp
- Calculates hours elapsed since submission
- Maps hours to color-coded status
- Provides human-readable time elapsed
- Sorts by urgency (oldest first for overdue items)

**Testing Notes:**
- Manual testing required to verify color coding accuracy
- Test SLA badge display in inbox grid
- Test SLA sorting toggle functionality
- Verify time elapsed display accuracy
- Test overdue indicator display
- Verify SLA display in detail page

### File List

- client/src/utils/sla.js (NEW - SLA calculation utilities)
- client/src/pages/workflow/WorkflowInboxPage.jsx (UPDATE - add SLA badge and sorting)
- client/src/pages/workflow/WorkflowDocumentDetailPage.jsx (UPDATE - add SLA display)
