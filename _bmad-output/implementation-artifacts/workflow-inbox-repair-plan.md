# Workflow Inbox Screen - Repair & Alignment Plan

**Date:** 2026-05-26  
**Status:** Planning  
**Priority:** High  
**Goal:** Visibility-focused inbox for tracking workflow documents requiring action

---

## 🎯 Strategic Context

### User Goal
> "I want to see my inbox whenever I get workflow documents that I need to take action on. I want to count them and track them, and there will be a shortcut to go to the workflow screen that shows the details of that diagram we built."

### Key Insights
- **Primary Focus:** Monitor workflow status (visibility focus)
- **Secondary Focus:** Action tracking and counting
- **Brownfield Issue:** Current screen uses outdated terminology and doesn't align with source of truth
- **Source of Truth:** SmartDrivePage + WorkflowDocumentDetailPage + FileDetailsModal

---

## 📊 Current State Analysis

### What Exists (WorkflowInboxPage.jsx)
✅ **Working Well:**
- Statistics dashboard with 7 stat cards (sent, pending review, approved, needs action, unread, closed, total)
- Advanced filtering (view mode, action type, read status, recipient, search)
- SLA-based sorting with urgency indicators
- Data grid with comprehensive columns
- Workflow diagram modal integration
- Bulk mark as read functionality

❌ **Problems:**
1. **Terminology Mismatch:** Uses "inbox items" and "actions" instead of "workflow documents"
2. **Data Model Confusion:** Mixes `WorkflowInboxItem` with `WorkflowDocument` concepts
3. **Brownfield Code:** Not touched in a long time, uses old patterns
4. **Overwhelming UI:** 7 stat cards may be too much for visibility focus
5. **No Direct Link:** Missing clear path to WorkflowDocumentDetailPage
6. **Hook Complexity:** `useWorkflowInbox` merges received/sent items in complex ways

### Source of Truth Components

**1. WorkflowDocumentDetailPage.jsx**
- Shows workflow document with diagram, status history, attachments, comments
- Actions: approve, reject, return, resubmit, upload signed, withdraw
- Uses `WorkflowDocument` model with clear status types
- Has polling for real-time updates

**2. FileDetailsModal.jsx (Smart Drive)**
- Modal with tabs: preview, edit, details, versions, comments, activity, **workflow**, share
- Workflow tab shows workflow status for files
- Clean tab-based navigation

**3. SmartDrivePage.jsx**
- Main file management interface
- Has InboxDrawer component for workflow tasks
- Uses `useWorkflowTasks` hook

---

## 🎨 UX Design Recommendations (Freya)

### Simplified Inbox Layout

```
┌─────────────────────────────────────────────────────────────┐
│  📥 Workflow Inbox                                    [🔄]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 🔴 Urgent    │  │ ⚠️  Pending  │  │ ✅ Completed │      │
│  │    5 docs    │  │    12 docs   │  │    23 docs   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌─ Quick Filters ────────────────────────────────────────┐ │
│  │ [All] [Needs My Action] [Waiting] [Completed]         │ │
│  │ 🔍 Search...                                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─ Documents ─────────────────────────────────────────────┐│
│  │ 📄 Weekly Attendance Report - Week 21                   ││
│  │    Status: UNDER_HR_REVIEW  •  SLA: 2h remaining       ││
│  │    Submitter: Ahmed Hassan  •  Assigned to: You        ││
│  │    [View Details] [View Workflow]                       ││
│  ├──────────────────────────────────────────────────────────││
│  │ 📄 Student Behavior Report - May 2026                   ││
│  │    Status: SUBMITTED  •  SLA: Overdue by 3h            ││
│  │    Submitter: Sarah Ali  •  Assigned to: You           ││
│  │    [View Details] [View Workflow]                       ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Key UX Principles
1. **Reduce Cognitive Load:** 3 stat cards instead of 7 (Urgent, Pending, Completed)
2. **Action-Oriented:** "Needs My Action" filter as default
3. **Clear Navigation:** Direct buttons to WorkflowDocumentDetailPage
4. **Visual Hierarchy:** SLA badges with color coding (red=overdue, yellow=soon, green=ok)
5. **Consistent Terminology:** Use "WorkflowDocument" throughout

---

## 📋 Requirements (Saga - Business Analyst)

### Functional Requirements

**FR1: Document List Display**
- Display all workflow documents assigned to current user
- Show document title, status, submitter, assigned to, SLA
- Support pagination (50 items per page)
- Real-time updates via polling (30s interval)

**FR2: Status Tracking**
- Count documents by urgency: Urgent (SLA < 4h), Pending, Completed
- Filter by status: All, Needs My Action, Waiting, Completed
- Sort by SLA urgency (default), date, status

**FR3: Navigation**
- "View Details" → Navigate to `/workflow-documents/:id`
- "View Workflow" → Open workflow diagram modal
- Breadcrumb navigation back to Smart Drive

**FR4: Search & Filter**
- Search by document title, description, submitter name
- Filter by status, workflow type, date range
- Quick filters for common views

**FR5: Actions**
- Mark as read/unread
- Bulk mark as read
- Refresh inbox
- Navigate to create new workflow document

### Non-Functional Requirements

**NFR1: Performance**
- Load inbox in < 2s
- Polling should not block UI
- Support up to 500 documents without pagination issues

**NFR2: Accessibility**
- Keyboard navigation support
- Screen reader compatible
- Color-blind friendly status indicators

**NFR3: Responsiveness**
- Mobile-friendly layout (320px+)
- Tablet optimization (768px+)
- Desktop full features (1280px+)

---

## 🛠️ Technical Implementation Plan (Mimir)

### Phase 1: Data Model Alignment (Priority: High)

**Task 1.1: Unify Data Model**
- [ ] Remove `WorkflowInboxItem` concept
- [ ] Use `WorkflowDocument` as single source of truth
- [ ] Update `useWorkflowInbox` hook to return `WorkflowDocument[]`
- [ ] Align with backend API `/api/v1/workflow-documents/inbox`

**Task 1.2: Update Hook**
```javascript
// useWorkflowInbox.js - Simplified
const useWorkflowInbox = () => {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ urgent: 0, pending: 0, completed: 0 });
  
  // Fetch workflow documents assigned to current user
  // Calculate stats based on SLA and status
  // Return clean interface
}
```

### Phase 2: UI Simplification (Priority: High)

**Task 2.1: Reduce Stat Cards**
- [ ] Replace 7 cards with 3: Urgent, Pending, Completed
- [ ] Calculate urgency based on SLA (< 4h = urgent)
- [ ] Add visual indicators (red, yellow, green)

**Task 2.2: Simplify Filters**
- [ ] Remove complex inline filters
- [ ] Add quick filter buttons: All, Needs My Action, Waiting, Completed
- [ ] Keep search bar prominent

**Task 2.3: Update Document List**
- [ ] Show document title, status badge, SLA badge
- [ ] Add submitter and assignee info
- [ ] Two action buttons: "View Details", "View Workflow"

### Phase 3: Navigation & Integration (Priority: Medium)

**Task 3.1: Link to Detail Page**
- [ ] "View Details" → `navigate(/workflow-documents/${doc.id})`
- [ ] Pass document context via state
- [ ] Ensure back navigation works

**Task 3.2: Workflow Diagram Modal**
- [ ] Reuse existing WorkflowDiagram component
- [ ] Show in modal on "View Workflow" click
- [ ] Display document title in modal header

**Task 3.3: Smart Drive Integration**
- [ ] Add inbox badge to Smart Drive navigation
- [ ] Show unread count
- [ ] Link from InboxDrawer to WorkflowInboxPage

### Phase 4: Polish & Testing (Priority: Low)

**Task 4.1: Real-time Updates**
- [ ] Implement polling (30s interval)
- [ ] Show toast notification on status change
- [ ] Pause polling when tab is hidden

**Task 4.2: Accessibility**
- [ ] Add ARIA labels
- [ ] Keyboard navigation
- [ ] Focus management

**Task 4.3: Responsive Design**
- [ ] Mobile layout (stack cards vertically)
- [ ] Tablet layout (2-column grid)
- [ ] Desktop layout (3-column grid)

---

## 📁 Files to Modify

### High Priority
1. `client/src/pages/workflow/WorkflowInboxPage.jsx` - Main component
2. `client/src/hooks/useWorkflowInbox.js` - Data hook
3. `client/src/services/business/workflowService.js` - Business logic
4. `client/src/constants/workflowStatusTypes.jsx` - Status constants

### Medium Priority
5. `client/src/components/smart-drive/InboxDrawer.jsx` - Integration
6. `client/src/pages/SmartDrivePage.jsx` - Navigation
7. `client/src/App.jsx` - Routing

### Low Priority
8. `client/src/components/workflow/WorkflowDiagram.jsx` - Modal usage
9. `client/src/services/api/workflow-documents-api.js` - API calls

---

## 🎯 Success Criteria

1. ✅ Inbox shows only workflow documents (no mixed concepts)
2. ✅ 3 clear stat cards: Urgent, Pending, Completed
3. ✅ One-click navigation to WorkflowDocumentDetailPage
4. ✅ SLA-based urgency sorting works correctly
5. ✅ Search and quick filters are intuitive
6. ✅ Mobile responsive (320px+)
7. ✅ Real-time updates via polling
8. ✅ Consistent terminology throughout

---

## 📝 Next Steps

1. **Freya & Saga:** Review and approve this plan
2. **John (PM):** Prioritize tasks and set timeline
3. **Mimir:** Begin Phase 1 implementation
4. **Team:** Daily standup to track progress

---

## 🔗 Related Documents

- `client/src/pages/workflow/WorkflowDocumentDetailPage.jsx` - Detail page reference
- `client/src/components/smart-drive/FileDetailsModal.jsx` - Modal pattern reference
- `_bmad-output/project-context.md` - Project context
- `AGENTS.md` - Team structure

---

**Plan Created By:** Freya (UX Designer) + Saga (Analyst)  
**Approved By:** Pending  
**Implementation By:** Mimir (Builder)
