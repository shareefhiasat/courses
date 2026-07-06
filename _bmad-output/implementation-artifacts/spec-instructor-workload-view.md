---
title: 'Instructor Workload View with Tree and Table Modes'
type: 'feature'
created: '2026-06-13'
status: 'ready-for-dev'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The current availability view shows instructors with a simple "Available" label and session count, but provides no meaningful context about WHEN they are available, what their upcoming schedule looks like, or how their workload compares to their actual availability hours. Users cannot see which days/times instructors work, cannot sort by workload, and have no quick way to jump to the calendar filtered for a specific instructor.

**Approach:** Replace the availability view with an intelligent Instructor Workload View that displays instructors in both tree and table formats, showing workload metrics (session count, scheduled hours, workload percentage), upcoming sessions with dates/times, and provides sorting, filtering, and a "Show on Calendar" shortcut to jump directly to that instructor's calendar view.

## Boundaries & Constraints

**Always:**
- Respect existing dark mode theme from MUI
- Use existing localization system (LangContext) for all user-facing strings
- Follow existing component patterns and styling conventions
- Maintain responsive design (mobile 320px, tablet 768px, desktop 1280px+)
- Use existing state management (no new global state)
- Keep the existing availability toggle between instructor/room types

**Ask First:**
- Adding new database fields for instructor availability schedules (if not already present)
- Changing the overall layout structure of SchedulingCalendarPage
- Adding external libraries for advanced visualizations

**Never:**
- Remove existing functionality without user confirmation
- Hardcode strings (must use localization)
- Break existing calendar view or other view modes
- Add features that require backend API changes without confirming schema support

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Instructor with no sessions | Instructor has 0 scheduled sessions | Shows "Available" badge, workload 0%, no upcoming sessions list | N/A |
| Instructor with upcoming sessions | Instructor has 5 sessions scheduled | Shows session count, workload %, expandable tree shows all 5 sessions with date/time | N/A |
| Sort by workload ascending | User clicks "Sort by Availability" | Instructors reorder with most available (lowest workload %) at top | N/A |
| Show on calendar action | User clicks "Show on Calendar" for instructor | Calendar view switches to instructor filter mode with that instructor selected | N/A |
| Toggle tree/table view | User clicks view toggle button | Display switches between tree (expandable) and table (grid) layout | N/A |
| Filter by workload threshold | User sets filter to "< 50% workload" | Only instructors with workload below 50% are displayed | N/A |
| No instructors match filter | All instructors have > 80% workload, filter set to < 50% | Display empty state message "No instructors match the current filter" | N/A |

</frozen-after-approval>

## Code Map

- `client/src/pages/SchedulingCalendarPage.jsx` -- Main scheduling page containing availability view, needs workload view implementation
- `client/src/contexts/LangContext.jsx` -- Localization context, needs new keys for workload view strings
- `client/src/constants/schedulingConstants.js` -- Constants for scheduling, may need workload thresholds

## Tasks & Acceptance

**Execution:**
- [ ] `client/src/contexts/LangContext.jsx` -- Add localization keys for workload view (workload_view, scheduled_hours, workload_percentage, most_available, show_on_calendar, tree_view, table_view, filter_by_workload, no_instructors_match_filter, upcoming_sessions, available_badge) -- Required for i18n compliance
- [ ] `client/src/pages/SchedulingCalendarPage.jsx` -- Replace current availability view (lines 1428-1543) with new workload view component that includes: (1) View mode toggle (tree/table), (2) Sort controls (by workload %, by name, by session count), (3) Filter controls (workload threshold slider), (4) Tree view: expandable instructor cards showing metrics and session list, (5) Table view: data grid with columns for instructor, sessions, hours, workload %, actions, (6) "Show on Calendar" button that switches viewMode to 'instructor' and sets selectedInstructor -- Provides comprehensive workload visibility
- [ ] `client/src/pages/SchedulingCalendarPage.jsx` -- Add workload calculation logic: compute scheduled hours from session durations, calculate workload percentage (scheduled hours / available hours * 100), sort instructors by workload metrics -- Enables intelligent sorting and filtering
- [ ] `client/src/pages/SchedulingCalendarPage.jsx` -- Add state variables for workload view: workloadViewMode ('tree' | 'table'), workloadSortBy ('workload' | 'name' | 'sessions'), workloadFilterThreshold (0-100), workloadSortOrder ('asc' | 'desc') -- Manages view configuration

**Acceptance Criteria:**
- Given I am on the scheduling calendar page, when I click the "Availability" button, then I see the new workload view with tree mode as default
- Given I am viewing the workload view in tree mode, when I click an instructor card, then it expands to show all upcoming sessions with date/time
- Given I am viewing the workload view, when I click "Table View" toggle, then the display switches to a table grid with columns for instructor, sessions, hours, workload %, and actions
- Given I am viewing the workload view, when I click "Sort by Availability", then instructors reorder with most available (lowest workload %) at the top
- Given I am viewing an instructor in the workload view, when I click "Show on Calendar", then the calendar switches to instructor filter mode with that instructor selected
- Given I am viewing the workload view, when I adjust the workload filter slider to "< 50%", then only instructors with workload below 50% are displayed
- Given no instructors match the current filter, when I view the workload view, then I see an empty state message "No instructors match the current filter"
- Given I am viewing the workload view, when I switch between light and dark themes, then all colors and styles adapt correctly
- Given I am viewing the workload view on mobile (320px), when I interact with the view, then all controls are accessible and the layout is responsive

## Spec Change Log

## Design Notes

**Workload Calculation:**
```javascript
// Calculate scheduled hours from sessions
const scheduledHours = sessions.reduce((total, session) => {
  const duration = (new Date(session.endDateTime) - new Date(session.startDateTime)) / (1000 * 60 * 60);
  return total + duration;
}, 0);

// Assume 40 hours/week as default available hours (configurable)
const availableHours = 40;
const workloadPercentage = (scheduledHours / availableHours) * 100;
```

**Tree View Structure:**
```
📊 Instructor Workload (Tree View)
├─ Dr. James Wilson
│  ├─ 12 sessions | 18 hrs | 45% workload
│  ├─ [Show on Calendar]
│  └─ Upcoming Sessions (expandable)
│     ├─ Mon Jun 10, 9:00 AM - CS101
│     ├─ Tue Jun 11, 2:00 PM - CS102
│     └─ ...
├─ Prof. Sarah Ahmed
│  ├─ 8 sessions | 12 hrs | 30% workload
│  └─ ...
```

**Table View Columns:**
- Instructor Name
- Sessions Count
- Scheduled Hours
- Workload %
- Next Session (date/time)
- Actions (Show on Calendar button)

**Color Coding for Workload:**
- Green (< 50%): Low workload, highly available
- Yellow (50-75%): Moderate workload
- Orange (75-90%): High workload
- Red (> 90%): Overloaded

## Verification

**Commands:**
- `cd client && npx eslint src/pages/SchedulingCalendarPage.jsx` -- expected: no errors
- `cd client && node node_modules/vite/bin/vite.js build` -- expected: build succeeds

**Manual checks:**
- Navigate to scheduling calendar page → click "Availability" → verify workload view displays with tree mode
- Click instructor card → verify it expands to show upcoming sessions
- Click "Table View" toggle → verify display switches to table grid
- Click "Sort by Availability" → verify instructors reorder by workload %
- Click "Show on Calendar" for an instructor → verify calendar switches to instructor filter mode
- Adjust workload filter slider → verify only matching instructors display
- Switch to dark mode → verify all colors adapt correctly
- Test on mobile device → verify responsive layout works
