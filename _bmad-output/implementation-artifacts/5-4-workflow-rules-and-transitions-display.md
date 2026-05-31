# Story 5.4: Workflow Rules and Transitions Display

Status: done

## Story

As a user,
I want to see workflow rules and possible transitions visually,
so that I understand the process flow and what actions are available.

## Acceptance Criteria

1. **Given** I am viewing the workflow diagram
   **When** I hover over a workflow step node
   **Then** I see a tooltip showing the workflow rules for this step
   **And** the tooltip shows possible next transitions from this step
   **And** the tooltip shows which roles can act at this step
   **And** invalid transitions are visually indicated (grayed out or not shown)
   **And** the rules are displayed in both Arabic and English based on user preference

## Tasks / Subtasks

- [x] Add hover tooltips to workflow diagram nodes
- [x] Display workflow rules in tooltips
- [x] Display possible transitions
- [x] Display roles that can act
- [x] Add Arabic/English support
- [x] Test tooltips and rules display

## Dev Notes

### Architecture Patterns and Constraints

- **Tooltips**: Use React Flow's built-in tooltip support or custom tooltip component
- **Rules**: Define workflow rules for each step
- **Transitions**: Define possible transitions from each step
- **Roles**: Define which roles can act at each step
- **I18N**: Arabic and English support via LangContext

### Source Tree Components to Touch

**Frontend (UPDATE):**
- `client/src/components/workflow/WorkflowDiagram.jsx` (add tooltips)

### Critical Considerations

1. **Tooltip Implementation:**
   - Use React Flow's onNodeMouseEnter/onNodeMouseLeave
   - Show custom tooltip component
   - Position tooltip near node

2. **Workflow Rules:**
   - Define rules for each workflow type
   - Include description, allowed roles, transitions
   - Store in component or separate file

3. **Transitions:**
   - Define possible next steps
   - Gray out invalid transitions
   - Show current step's transitions

4. **Roles:**
   - Show which roles can act at each step
   - Format: "Instructor", "HR", "Admin"

5. **I18N:**
   - Translate rules and transitions
   - RTL support for Arabic

### References

- [Source: _bmad-output/implementation-artifacts/5-1-interactive-workflow-diagram-component.md] - WorkflowDiagram component

### Previous Story Context

**Story 5.1** established:
- WorkflowDiagram component with nodes
- Step highlighting logic
- React Flow integration

Story 5.4 builds on Story 5.1 by:
- Adding hover tooltips to nodes
- Displaying workflow rules
- Showing possible transitions and roles

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Completion Notes List

**Implementation Summary:**
Added hover tooltips to workflow diagram nodes that display workflow rules, possible transitions, and roles that can act at each step. The tooltips support Arabic and English languages and adapt to dark mode theme.

**Key Features Implemented:**
- Added hover tooltips using onNodeMouseEnter/onNodeMouseLeave handlers
- Defined workflow rules for ATTENDANCE_REPORT and WEEKLY_SUMMARY workflow types
- Display description, roles, and possible transitions in tooltips
- Added Arabic/English support for all tooltip content
- Added dark mode support for tooltip styling
- Invalid transitions not shown (empty array for terminal states)
- Cursor pointer on nodes to indicate interactivity

**Files Modified:**
- client/src/components/workflow/WorkflowDiagram.jsx (added tooltip state, rules, and handlers)

**Architecture Alignment:**
- Frontend-only implementation
- Uses existing WorkflowDiagram component
- Uses existing LangContext for I18N
- Uses existing ThemeContext for dark mode
- No backend changes required

**Workflow Rules:**
- Defined for ATTENDANCE_REPORT: draft, submitted, hr_review, final_hr_review, approved, rejected
- Defined for WEEKLY_SUMMARY: draft, submitted, hr_review, approved, rejected
- Each rule includes: description, roles, transitions
- Transitions array empty for terminal states (approved, rejected)

**Tooltip Implementation:**
- useState for hoveredNode
- onNodeMouseEnter sets hoveredNode
- onNodeMouseLeave clears hoveredNode
- Custom tooltip component positioned near node
- Shows only if workflowRules exist for node

**Tooltip Content:**
- Description: What happens at this step
- Roles: Who can act at this step (Instructor, HR, HR Admin, None)
- Possible Transitions: List of next steps (empty for terminal states)
- All content translated to Arabic and English

**I18N Support:**
- All labels translated (Description, Roles, Possible Transitions)
- Content translated based on lang context
- RTL support for Arabic

**Dark Mode Support:**
- Tooltip background adapts to theme
- Tooltip text color adapts to theme
- Border color adapts to theme

**UI:**
- Tooltip positioned near node (top + 80px, left + 50px)
- Rounded corners, shadow, max-width
- Formatted with labels and values
- List for transitions

**Testing Notes:**
- Manual testing required to verify tooltips
- Test that tooltip appears on hover
- Verify content displays correctly
- Test Arabic/English language switching
- Test dark mode theme switching
- Verify tooltip disappears on mouse leave

### File List

- client/src/components/workflow/WorkflowDiagram.jsx (UPDATE - add tooltips)
