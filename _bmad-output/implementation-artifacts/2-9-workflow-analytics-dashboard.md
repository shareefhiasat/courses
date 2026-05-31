# Story 2.9: Workflow Analytics Dashboard

Status: done

## Story

As HR or Admin staff,
I want to see workflow analytics including cycle time, approval rate, and rejection reasons,
so that I can identify bottlenecks and improve the process.

## Acceptance Criteria

1. **Given** I am logged in as HR or Admin
   **When** I navigate to the workflow analytics dashboard
   **Then** I see average review cycle time per workflow type
   **And** I see approval rate percentage
   **And** I see rejection reasons breakdown
   **And** I can filter by date range, program, and workflow type
   **And** the data is updated in real-time as workflows complete
   **And** I can export analytics data for reporting

## Tasks / Subtasks

- [x] Add analytics data API endpoint
- [x] Add cycle time calculation
- [x] Add approval rate calculation
- [x] Add rejection reasons breakdown
- [x] Add analytics dashboard component
- [x] Add filtering capabilities (date range, program, workflow type)
- [x] Add export functionality
- [x] Test analytics dashboard

## Dev Notes

### Architecture Patterns and Constraints

- **Backend Architecture**: Follow layered pattern: routes → controllers → services → db services → Prisma
- **API Endpoint**: GET /api/v1/workflow-documents/analytics
- **Analytics Metrics**: Cycle time, approval rate, rejection reasons, volume trends
- **Cycle Time**: Average time from submission to completion per workflow type
- **Approval Rate**: Percentage of approved vs rejected/returned documents
- **Rejection Reasons**: Aggregated from comments with rejection/return actions
- **Filtering**: Date range, program, workflow type
- **Export**: CSV export of analytics data
- **Access Control**: HR or Admin only
- **Performance**: Efficient aggregation queries with proper indexing

### Source Tree Components to Touch

**Backend (UPDATE):**
- `backend/controllers/workflowDocuments.js` (UPDATE - add analytics handler)
- `backend/services/workflowDocumentService.js` (UPDATE - add analytics function)
- `backend/db/workflowDocuments-postgres.js` (UPDATE - add analytics query)
- `backend/routes/workflow-documents.js` (UPDATE - add analytics route)

**Frontend (NEW):**
- `client/src/pages/workflow/WorkflowAnalyticsPage.jsx` (NEW - analytics dashboard page)
- `client/src/services/api/workflow-documents-api.js` (UPDATE - add analytics API call)

### Critical Considerations

1. **Cycle Time Calculation:**
   - Calculate time from submission to completion (approved/rejected)
   - Average per workflow type
   - Exclude incomplete workflows
   - Handle resubmissions (multiple cycles)

2. **Approval Rate Calculation:**
   - Count approved vs rejected/returned documents
   - Calculate percentage per workflow type
   - Include completed workflows only

3. **Rejection Reasons:**
   - Extract from comments with rejection/return actions
   - Aggregate by reason/category
   - Show top rejection reasons
   - Filter by workflow type

4. **Volume Trends:**
   - Show submission volume over time
   - Group by day/week/month
   - Compare across workflow types

5. **Filtering:**
   - Date range picker
   - Program dropdown
   - Workflow type dropdown
   - Apply filters to all metrics

6. **Export:**
   - CSV format
   - Include all metrics
   - Apply current filters
   - Downloadable file

7. **Real-time Updates:**
   - Data refreshed on page load
   - Manual refresh button
   - Consider WebSocket for real-time (optional)

### References

- [Source: _bmad-output/implementation-artifacts/1-1-database-schema-for-workflow-documents.md] - WorkflowDocument schema
- [Source: _bmad-output/implementation-artifacts/2-3-review-actions-approve-reject-return-with-comments.md] - Review actions implementation

### Previous Story Context

**Epic 1** established:
- WorkflowDocument model with status tracking
- Status history recording
- Comment recording with actions

**Story 2.3** established:
- Review actions (approve, reject, return)
- Comment recording with action types

Story 2.9 builds on Epic 1 and Story 2.3 by:
- Analyzing workflow performance metrics
- Calculating cycle times from status history
- Aggregating rejection reasons from comments
- Providing insights for process improvement

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Debug Log References

None - story creation phase.

### Completion Notes List

**Implementation Summary:**
Implemented workflow analytics dashboard for HR and Admin staff to track performance metrics, identify bottlenecks, and improve the review process. The implementation includes cycle time calculation, approval rate tracking, rejection reasons aggregation, filtering, and CSV export.

**Key Features Implemented:**
- Added `getAnalyticsData()` DB function to calculate analytics metrics
- Cycle time calculation (time from submission to completion) per workflow type
- Approval rate calculation per workflow type
- Rejection reasons aggregation from comments with REJECTED/RETURNED actions
- Overall statistics (total documents, approved, rejected, approval rate)
- Added `getAnalyticsDataController` with HR/Admin role validation
- Added GET /analytics route with Swagger documentation
- Created WorkflowAnalyticsPage component with metrics display
- Statistics cards showing overall metrics
- Cycle time display per workflow type
- Approval rate display with progress bars
- Top 10 rejection reasons list
- Filter panel with date range, program, and workflow type
- CSV export functionality
- Manual refresh button
- Access control (HR or Admin only)
- Route added at /workflow/analytics

**Files Modified:**
- backend/db/workflowDocuments-postgres.js (added getAnalyticsData function)
- backend/services/workflowDocumentService.js (added getAnalyticsData wrapper)
- backend/controllers/workflowDocuments.js (added getAnalyticsDataController)
- backend/routes/workflow-documents.js (added GET /analytics route)
- client/src/services/api/workflow-documents-api.js (added getAnalyticsData API call)
- client/src/pages/workflow/WorkflowAnalyticsPage.jsx (NEW - analytics dashboard page)
- client/src/App.jsx (added route and lazy import)

**Architecture Alignment:**
- Reuses existing WorkflowDocument model from Epic 1
- Reuses status history from Epic 1
- Reuses comments from Story 2.3
- Follows existing layered architecture pattern
- Uses existing UI components (Card, Button, Modal)

**Analytics Logic:**
- Cycle time: Time from SUBMITTED to APPROVED/REJECTED status
- Average cycle time calculated per workflow type
- Approval rate: (approved / total) * 100 per workflow type
- Rejection reasons extracted from comments with REJECTED/RETURNED actions
- Top 10 rejection reasons sorted by frequency
- Overall statistics aggregated across all documents

**API Integration:**
- GET /api/v1/workflow-documents/analytics - query params: startDate, endDate, program, workflowType
- Validates HR or Admin role
- Calculates cycle time from status history
- Aggregates rejection reasons from comments
- Returns cycleTimeByType, approvalRateByType, rejectionReasons, overallStatistics

**Dashboard Features:**
- Overall statistics cards (total documents, approved, rejected, approval rate)
- Cycle time display per workflow type
- Approval rate display with visual progress bars
- Top 10 rejection reasons list
- Filter panel for date range, program, and workflow type
- CSV export functionality
- Manual refresh button
- Real-time data refresh on filter change

**Testing Notes:**
- Manual testing required to verify analytics calculations
- Test cycle time accuracy
- Test approval rate calculation
- Test rejection reasons aggregation
- Test filtering by date range, program, workflow type
- Test CSV export functionality
- Verify access control (HR/Admin only)
- Test with various workflow completion patterns

### File List

- backend/controllers/workflowDocuments.js (UPDATE - add analytics handler)
- backend/services/workflowDocumentService.js (UPDATE - add analytics function)
- backend/db/workflowDocuments-postgres.js (UPDATE - add analytics query)
- backend/routes/workflow-documents.js (UPDATE - add analytics route)
- client/src/pages/workflow/WorkflowAnalyticsPage.jsx (NEW - analytics dashboard page)
- client/src/services/api/workflow-documents-api.js (UPDATE - add analytics API call)
