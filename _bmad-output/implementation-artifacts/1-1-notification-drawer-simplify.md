# Story 1.1: Simplify and Focus Notification Drawer

**Status**: ready-for-dev
**Complexity**: Medium
**Estimated Time**: 60 minutes

## Story

As a user,
I want the notification drawer to be clean, focused, and easy to scan,
so that I can quickly see and act on important notifications without visual overload.

## Acceptance Criteria

1. Notification drawer header is simplified — only essential filters remain (status + category), academic filters removed
2. Sound/vibration/browser notification toggles are moved behind a collapsible gear/cog panel — not always visible
3. Notification cards have clear visual hierarchy: category color bar, prominent title, subtle timestamp, clean spacing
4. Notifications are grouped by date (Today, Yesterday, This Week, Earlier) with section headers
5. Individual notification card actions are reduced — use hover-reveal for read/unread/archive/delete (via a "..." menu or inline icon group that appears on hover)
6. Cards have subtle Framer Motion entrance animation (fadeIn + slight slideUp)
7. All existing functionality (mark read, unread, archive, delete, navigate) is preserved
8. Dark mode support is maintained

## Tasks / Subtasks

- [x] Task 1: Simplify drawer header
  - [x] Remove academic filter row (program, subject, class, year, semester selects)
  - [x] Condense status + category filters into a single compact row
  - [x] Move sound/vibration/browser toggles behind a collapsible gear dropdown
  - [x] Keep search bar, mark-all-read, and close/external-link buttons
- [x] Task 2: Redesign notification card
  - [x] Add category color bar (4px left border) based on notification type
  - [x] Improve typography hierarchy: bold title, medium message, small timestamp
  - [x] Replace 4 individual action buttons with a hover-reveal icon bar (eye, eye_off, archive, trash)
  - [x] Add subtle hover lift effect
  - [x] Maintain unread dot indicator
- [x] Task 3: Add date grouping
  - [x] Create groupLabels map: Today, Yesterday, This Week, Earlier
  - [x] Render section headers between date groups
  - [x] Preserve existing notification order within groups
- [x] Task 4: Add entrance animations
  - [x] Import Framer Motion
  - [x] Wrap notification list items with motion.div with initial/animate/exit
  - [x] Keep animation subtle (opacity 0→1, y: 8→0)
- [x] Task 5: Verify and clean up
  - [x] Remove unused imports after refactoring
  - [x] Verify dark mode works for all new styles
  - [x] Verify all existing interactions work (mark read, mark unread, archive, delete, navigate, mark all read)

## Dev Notes

- File to modify: `client/src/components/ui/NotificationDrawer.jsx`
- Framer Motion 12.23 is available in the project (import from `framer-motion`)
- The drawer uses inline styles with isDark theme detection — maintain this pattern
- Use MUI icons via `getThemedIcon` for consistency
- Notification grouping logic: use `createdAt` field, compare to `new Date()`
- The action buttons should still be accessible, just visually hidden until hover
- Category colors: use existing notification type constants from `@constants/notificationTypes.jsx`

### Category Color Mapping

- activity/submission: #3b82f6 (blue)
- quiz: #8b5cf6 (purple)
- grade: #10b981 (green)
- message/chat: #f59e0b (amber)
- announcement/newsletter: #06b6d4 (cyan)
- penalty: #ef4444 (red)
- attendance/absence: #f97316 (orange)
- resource: #6366f1 (indigo)
- default: #6b7280 (gray)

### Date Grouping Logic

```js
const getDateGroup = (timestamp) => {
  const date = timestamp?.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (notificationDate.getTime() === today.getTime()) return 'Today';
  if (notificationDate.getTime() === yesterday.getTime()) return 'Yesterday';
  if (diff < 7 * 86400000) return 'This Week';
  return 'Earlier';
};
```

## Dev Agent Record

### Agent Model Used

deepseek-v4-flash-free

### Debug Log References

- Current NotificationDrawer: 938 lines, crowded header with 10+ filters + settings toggles + 4 action buttons per card

### Completion Notes List

- Successfully reduced NotificationDrawer from 938 to 707 lines (25% reduction)
- Removed academic filter row (6 select dropdowns: program, subject, class, year, semester)
- Moved sound/vibration/browser notification toggles behind gear icon collapsible panel
- Added category color bars (4px left border) using CATEGORY_COLORS map
- Added date grouping with section headers (Today, Yesterday, This Week, Earlier)
- Replaced 4 always-visible action buttons with hover-reveal icon group
- Added Framer Motion entrance animations (fadeIn + slideUp) and hover lift effects
- Cleaned up unused imports (Button, archiveAllRead, remove, loading, isMobileFunc)
- All existing notification interactions preserved (mark read/unread, archive, delete, navigate, mark all read)
- Fixed pre-existing bug: setLoading was never initialized (removed broken loading state)
- ESLint passes clean (0 errors, 0 warnings)

### File List

- `client/src/components/ui/NotificationDrawer.jsx` — refactored (simplified + enhanced)

## Change Log

- 2026-05-19: Implemented NotificationDrawer simplification — removed academic filters, condensed header, added date grouping, category color bars, Framer Motion animations, hover-reveal actions, moved settings toggles behind gear icon

## Status

**Status**: review
**Started**: 2026-05-19
**Completed**: 2026-05-19
