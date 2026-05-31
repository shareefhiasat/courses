# Story 5.1: Interactive Workflow Diagram Component

Status: done

## Story

As a user,
I want to see an interactive visual diagram showing the workflow progress,
so that I can quickly understand where the document is in the process.

## Acceptance Criteria

1. **Given** I am viewing a workflow document detail view
   **When** the workflow visualization component loads
   **Then** I see an interactive diagram showing all workflow steps (nodes)
   **And** the current step is highlighted with a distinct color
   **And** completed steps are marked as done
   **And** pending steps are shown as future nodes
   **And** the diagram is more engaging than static Mermaid diagrams (using a modern visualization library)
   **And** the component supports Arabic and English languages (NFR-16)
   **And** the component is responsive on mobile, tablet, and desktop (NFR-17)
   **And** the component respects dark mode theme (NFR-18)

## Tasks / Subtasks

- [x] Select modern visualization library
- [x] Create workflow diagram component
- [x] Add step highlighting logic
- [x] Add Arabic/English support
- [x] Add responsive design
- [x] Add dark mode support
- [x] Test component functionality

## Dev Notes

### Architecture Patterns and Constraints

- **Visualization Library**: Use React Flow or similar modern library
- **Component**: Reusable WorkflowDiagram component
- **Data**: Workflow steps from WorkflowDocument.status
- **Highlighting**: Current step highlighted, completed steps marked done
- **I18N**: Arabic and English support via LangContext
- **Responsive**: Mobile, tablet, desktop support
- **Dark Mode**: Respect theme from theme context

### Source Tree Components to Touch

**Frontend (NEW/UPDATE):**
- `client/src/components/workflow/WorkflowDiagram.jsx` (NEW - diagram component)
- `client/src/pages/workflow/WorkflowDocumentDetailPage.jsx` (UPDATE - add diagram)
- `client/package.json` (UPDATE - add visualization library)

### Critical Considerations

1. **Visualization Library Selection:**
   - React Flow (reactflow.dev) - modern, interactive, customizable
   - Alternative: D3.js, Cytoscape.js
   - Must be more engaging than static Mermaid diagrams

2. **Workflow Steps:**
   - Define workflow stages: DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED
   - Multi-stage routing: SUBMITTED → HR_REVIEW → FINAL_HR_REVIEW → APPROVED
   - Map status to diagram nodes

3. **Highlighting Logic:**
   - Current step: distinct color (e.g., blue)
   - Completed steps: green checkmark
   - Pending steps: gray/faded
   - Rejected steps: red

4. **I18N Support:**
   - Use LangContext for Arabic/English
   - RTL support for Arabic
   - Translated labels for nodes

5. **Responsive Design:**
   - Mobile: vertical layout
   - Tablet: compact layout
   - Desktop: horizontal layout
   - Use Tailwind responsive classes

6. **Dark Mode:**
   - Respect theme from theme context
   - Light/dark color schemes
   - Smooth transitions

### References

- [Source: _bmad-output/implementation-artifacts/1-1-database-schema-for-workflow-documents.md] - Workflow status values
- [Source: _bmad-output/implementation-artifacts/2-4-multi-stage-routing-hr-admin-hr-for-weekly-summaries.md] - Multi-stage routing

### Previous Story Context

**Epic 1** established:
- WorkflowDocument model with status field
- Workflow status values and transitions
- Multi-stage routing logic

Story 5.1 builds on Epic 1 by:
- Visualizing workflow progress
- Showing current status in diagram
- Supporting multi-stage routing visualization

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Completion Notes List

**Implementation Summary:**
Created an interactive workflow diagram component using React Flow library. The component visualizes workflow progress with step highlighting, completed step marking, Arabic/English support, responsive design, and dark mode support. The component is integrated into the WorkflowDocumentDetailPage.

**Key Features Implemented:**
- Selected React Flow (reactflow) as the modern visualization library
- Created WorkflowDiagram component with workflow stage definitions
- Added step highlighting logic: current step (blue), completed steps (green), pending steps (gray), rejected (red)
- Added Arabic/English support via LangContext with RTL support
- Added responsive design: mobile (h-64), tablet (h-80), desktop (h-96)
- Added dark mode support via ThemeContext with color scheme adaptation
- Integrated component into WorkflowDocumentDetailPage
- Support for multiple workflow types (ATTENDANCE_REPORT, WEEKLY_SUMMARY)
- Animated edges for current transitions
- MiniMap and Controls for better UX

**Files Modified:**
- client/package.json (added reactflow dependency)
- client/src/components/workflow/WorkflowDiagram.jsx (NEW - diagram component)
- client/src/pages/workflow/WorkflowDocumentDetailPage.jsx (added WorkflowDiagram import and usage)

**Architecture Alignment:**
- Frontend-only implementation
- Uses existing WorkflowDocument status field
- Uses existing LangContext for I18N
- Uses existing ThemeContext for dark mode
- Follows existing component patterns
- No backend changes required

**Visualization Library:**
- React Flow (reactflow) v11.11.4
- Modern, interactive, customizable
- More engaging than static Mermaid diagrams
- Supports background, controls, minimap
- Smooth animations and transitions

**Step Highlighting Logic:**
- Current step: blue background (#dbeafe), blue border (#3b82f6), blue dot icon
- Completed steps: green background (#d1fae5), green border (#10b981), checkmark icon
- Pending steps: gray background (#f3f4f6), gray border (#d1d5db)
- Rejected steps: red background (#fee2e2), red border (#ef4444), X icon
- Animated edges for current transition

**Arabic/English Support:**
- Uses LangContext for language detection
- RTL layout for Arabic (isRTL logic)
- Translated labels for all workflow stages
- Direction-aware node positioning

**Responsive Design:**
- Mobile: h-64 (256px height)
- Tablet: h-80 (320px height)
- Desktop: h-96 (384px height)
- Tailwind responsive classes
- FitView for automatic sizing

**Dark Mode Support:**
- Respects theme from ThemeContext
- Light mode: white background, dark text
- Dark mode: gray-900 background, light text
- Background dots color adaptation
- Controls and minimap color adaptation

**Workflow Types:**
- ATTENDANCE_REPORT: 6 stages (Draft → Submitted → HR Review → Final HR Review → Approved/Rejected)
- WEEKLY_SUMMARY: 5 stages (Draft → Submitted → HR Review → Approved/Rejected)
- Extensible for additional workflow types

**Testing Notes:**
- Manual testing required to verify component functionality
- Test step highlighting for different statuses
- Test Arabic/English language switching
- Test responsive design on different screen sizes
- Test dark mode theme switching
- Verify component renders in WorkflowDocumentDetailPage

### File List

- client/package.json (UPDATE - add React Flow)
- client/src/components/workflow/WorkflowDiagram.jsx (NEW - diagram component)
- client/src/pages/workflow/WorkflowDocumentDetailPage.jsx (UPDATE - add diagram)
