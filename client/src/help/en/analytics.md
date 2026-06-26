---
title: Analytics
tags: [analytics, widgets, charts, reports, dashboards, export, advanced-analytics, summary-cards, widget-builder, guided-tour, drill-down]
route: /advanced-analytics
order: 3
keywords: [analytics, widgets, charts, dashboard, bar chart, line chart, pie chart, donut chart, list, count, export, edit layout, add widget, data source, group by, measure, date range, summary cards, user roles, activity cards, filters, drill-down, guided tour, joyride, widget builder, dashboard engine, widget wrapper, optimized chart renderer, react-grid-layout, widget persistence, drive analytics, workflow analytics, activity analytics, storage usage, approval rate, submissions timeline, resources by type, recent files, recent workflows, recent activities, recent submissions, reset dashboard, minimize widget, duplicate widget, refresh widget, delete widget, download SVG, count metric, aggregation, custom date range, row limit, grid columns, RTL support, role-based access]
---

# Analytics

The analytics experience is a flexible, widget-based dashboard system. You can build and arrange chart cards, lists, and single-value counters to visualise the data that matters for your role. The same widget engine powers the **Advanced Analytics** screen, the **Summary Dashboard → Analytics** section, and the analytics panels inside the **Student Dashboard** and other pages.

The analytics screen has two major areas:

1. **Dashboard Statistics** — Summary cards showing key counts (programs, subjects, classes, enrollments, activities, resources, users by role, quizzes, announcements, penalties, behaviors, participations) with filtering by program, subject, and class.
2. **Dashboard Analytics Panel** — A widget-based grid with draggable, resizable chart widgets covering Drive, Workflow, and Activity categories.

## Who can access

| Role | Access |
| --- | --- |
| Super Admin | Full analytics, all widgets, export, and layout editing. Sees system-wide counts. |
| Admin | Full analytics scoped to accessible programs. Sees counts for accessible programs. |
| HR | User and attendance-related analytics. |
| Instructor | Personal classes, activities, attendance, and marks analytics. Sees only own classes and related data. |
| Student | Limited or read-only analytics depending on role settings. |

## Screen IDs

- `advancedAnalytics` — `/advanced-analytics` page
- `summary-dashboard` — Summary dashboard page with analytics sections
- `dashboard` — Dashboard analytics panels (role-based)

## Dashboard Statistics (Summary Cards)

The top section of the analytics page displays a set of summary cards inside a collapsible section titled **Dashboard Statistics**. Each card shows a count with an icon, a label, and a tooltip.

### Filters

Above the summary cards, a filter bar lets you narrow down all statistics:

- **Program** — Select a program to filter subjects, classes, enrollments, activities, and resources by that program.
- **Subject** — Select a subject (filtered by the chosen program) to further narrow classes, enrollments, and activities.
- **Class** — Select a specific class to see only its enrollments, activities, and announcements.

Changing the program filter resets the subject and class filters. Changing the subject filter resets the class filter. The resource count is re-fetched from the server whenever any filter changes.

### Summary cards (first row)

| Card | Who sees it | What it shows |
| --- | --- | --- |
| **Programs** | Super Admin only | Total number of programs in the system. |
| **Subjects** | Admin and Super Admin | Subjects in the system (Super Admin) or in accessible programs (Admin). Filtered by program if selected. |
| **Classes** | All roles | Classes filtered by program/subject/class. Instructors see only their own classes (matched by `instructorId`, `ownerEmail`, or `instructor` field). |
| **Enrollments** | All roles | Enrollments filtered by class/subject/program. Instructors see only enrollments in their classes. |
| **Activities** | All roles | Activities filtered by class/subject/program. Instructors see only activities in their classes. |
| **Resources** | All roles | Server-side resource count filtered by program/subject/class. Shows `...` while loading. |

### User role cards (second row)

Visible to **Admin and Super Admin only**. Shows counts for each user role:

- **Students** — Users with `isStudent === true`
- **Instructors** — Users with `isInstructor === true`
- **HR** — Users with `isHR === true`
- **Admins** — Users with `isAdmin === true`
- **Super Admins** — Users with `isSuperAdmin === true`

### Activity cards (third row)

Visible to **all roles**. Shows counts for:

- **Activities** — Filtered by class/subject/program. Instructors see only their own.
- **Quizzes** — Total quizzes. Clicking the card navigates to `/quizzes`.
- **Announcements** — Filtered by class/subject/program.
- **Penalties** — Filtered by class/subject/program. Instructors see only their own.
- **Behaviors** — Filtered by class/subject/program. Instructors see only their own.
- **Participations** — Filtered by class/subject/program. Instructors see only their own.

### Data loading

All summary card data is loaded in parallel using `Promise.allSettled` on component mount. If a service fails, the card shows `0` and a warning is logged. A refresh button in the section header re-fetches all data and shows a success/failure toast.

### Guided tour

The Dashboard Statistics section includes a **guided tour** (powered by Joyride) that auto-starts on first visit. The tour covers:

1. **Filters** — How to use the program/subject/class filters.
2. **Summary cards** — Key counts for programs, classes, enrollments, activities, and resources.
3. **User role cards** — User counts by role (students, instructors, HR, admins, super admins).
4. **Activity cards** — Totals for quizzes, announcements, penalties, behaviors, and participations.
5. **Refresh** — How to refresh the dashboard with the latest data.

The tour can be re-started by clicking the **help icon** (?) in the section header. Tour completion is saved to `localStorage` per language (`analyticsDashboardTourSeen_en` / `analyticsDashboardTourSeen_ar`).

## Dashboard Analytics Panel

Below the summary cards is the **Dashboard Analytics Panel** — a widget grid powered by the `DashboardEngine` component. This panel provides pre-built and custom widgets covering three categories:

- **Drive** — File counts, storage usage, file activities, files by type/bucket, recent files.
- **Workflow** — Document counts by status/type/program, approval rate, timeline, recent documents.
- **Activity** — Activity/submission/resource counts, activities by type, timelines, recent activities/submissions.

### Default widgets

The system ships with **28+ default widgets** arranged in a 12-column grid:

**Count widgets (top rows):**

| Widget | Category | Metric |
| --- | --- | --- |
| Total Files | Drive | `totalFiles` |
| Total Folders | Drive | `totalFolders` |
| Total Storage (MB) | Drive | `totalStorageSize` |
| File Activities | Drive | `totalActivities` |
| Workflow Documents | Workflow | `totalDocuments` |
| Approved Workflows | Workflow | `approvedCount` |
| Pending Workflows | Workflow | `pendingCount` |
| Rejected Workflows | Workflow | `rejectedCount` |
| Total Activities | Activity | `totalActivities` |
| Total Submissions | Activity | `totalSubmissions` |
| Total Resources | Activity | `totalResources` |
| Approval Rate % | Workflow | `approvalRate` |

**Chart widgets (middle rows):**

| Widget | Chart type | Data source | Group by |
| --- | --- | --- | --- |
| Files by Type (Pie/Bar) | Pie / Bar | `driveFilesByMimeType` | `label` |
| Files by Bucket (Pie/Bar) | Pie / Bar | `driveFilesByBucket` | `bucket` |
| File Activity by Action (Pie/Bar) | Pie / Bar | `driveFileActivities` | `action` |
| Storage Usage by User (MB) | Bar | `driveStorageByUser` | `label` |
| Workflows by Status (Pie/Bar) | Pie / Bar | `workflowByStatus` | `status` |
| Workflows by Type (Pie/Bar) | Pie / Bar | `workflowByType` | `workflowType` |
| Workflow Submissions Timeline | Line | `workflowTimeline` | `date` |
| Workflows by Program | Bar | `workflowByProgram` | `program` |
| Activities by Type (Pie/Bar) | Pie / Bar | `activitiesByType` | `activityType` |
| Activity Creation Timeline | Line | `activityTimeline` | `date` |
| Submissions by Status (Pie/Bar) | Pie / Bar | `submissionsByStatus` | `status` |
| Submission Timeline | Line | `submissionTimeline` | `date` |
| Resources by Type (Pie/Bar) | Pie / Bar | `resourcesByType` | `resourceType` |

**List widgets (bottom rows):**

| Widget | Data source | Row limit |
| --- | --- | --- |
| Recent Files | `driveRecentFiles` | 100 |
| Recent Workflow Documents | `workflowRecentDocuments` | 100 |
| Recent Activities | `activityRecentActivities` | 100 |
| Recent Submissions | `activityRecentSubmissions` | 100 |

## Toolbar anatomy

The toolbar sits above the widget grid. Each icon performs a distinct action.

| Icon / Button | Action | What it does |
| --- | --- | --- |
| **Search widgets** | Filter | Type to narrow the visible widgets by title (English, Arabic), ID, or group-by field. Only matching cards remain visible. |
| **Category tabs** | Filter | Pick a category: All, Drive, Workflow, or Activity. Only widgets in that category are shown. Uses `inferAnalyticsWidgetCategory` to map each data source to its category. |
| **Refresh** | Reload | Re-fetches the underlying analytics data from the server API (`DashboardAnalyticsService`) without reloading the page. |
| **Edit Layout** | Toggle mode | Enables drag-and-drop and resize handles on every widget. Move cards, resize them, then click the button again to lock the layout. |
| **Add Widget** | Open builder | Opens the widget builder modal so you can create a new chart, list, or count card. Respects the maximum widget limit. |
| **Reset** | Restore defaults | Opens a confirmation modal. On confirm, removes all custom widgets and restores the system default widget set. |

## Widget hover actions

Hover over any widget card to reveal a small action bar in the top-right corner.

| Icon | Action | Description |
| --- | --- | --- |
| Chevron up / down | **Minimise / Restore** | Collapse the widget to its header only (height = 1 row), or expand it back to its original size. Original size is preserved and restored. |
| Pencil | **Edit** | Re-opens the widget builder for that widget with all its current settings. |
| Copy | **Duplicate** | Creates an exact copy of the widget with a new ID and "(Copy)" suffix in the title. Offset by 1 position from the original. Respects the widget limit. |
| Download | **Save chart** | Saves the current chart as an SVG file. Hidden for list and count widgets. |
| Trash | **Delete** | Removes the widget from the dashboard immediately. Also cleans up minimized state, refresh versions, and timestamps. |
| Refresh (per widget) | **Refresh widget** | Bumps the widget's version counter to force a re-render from already-loaded data. If `onSmartReload` is available, fetches fresh data for that widget. Shows a "recently refreshed" indicator for ~1.4 seconds. |

## Widget maximize

Clicking the widget header (or a maximize button) opens a **full-screen modal** showing the chart at maximum size. This is useful for detailed inspection of complex charts and lists.

## Add / Edit a widget

Click **Add Widget** or hover over a card and click **Edit** to open the widget builder modal. The builder has the following fields:

### Title

- **Title** — Optional display title shown on the card.
- **Title (English)** — English version of the title (`titleEn`).
- **Title (Arabic)** — Arabic version of the title (`titleAr`). The correct title is shown automatically based on your selected language (`getWidgetDisplayTitle`).

### Chart type

Choose the visualisation type. Six options are available as icon buttons:

| Type | Icon | Best for |
| --- | --- | --- |
| **Bar** | Bar chart | Comparing values across categories. |
| **Line** | Line chart | Showing trends over time. |
| **Pie** | Pie chart | Showing parts of a whole. |
| **Donut** | Donut chart | Compact parts-of-a-whole visualisation. |
| **List** | List icon | Displaying raw rows with a configurable row limit. |
| **Count** | Hash icon | Highlighting a single numeric metric. |

Not every data source is compatible with every chart type. The builder disables incompatible options (shown at 35% opacity and `not-allowed` cursor). Compatible sources are determined by `getSourcesForChartType(chartType, category)`.

### Data source

Pick the underlying data source from a dropdown. The available sources depend on the selected category tab and chart type. Category tabs at the top of the data-source section let you switch between:

- **All** — All categories
- **Academic** — Activities, announcements, resources, enrollments, classes, programs, subjects
- **Assessment** — Student marks, quizzes, quiz submissions
- **Operations** — Attendance, users, penalties, absences, behaviors, participations, activity logs
- **Content** — Smart Drive files, Smart Drive shares
- **Workflow** — Workflow documents, workflow tasks
- **Scheduling** — Sessions, instructors, classes, rooms, breaks, holidays, attendance, workflow
- **Student** — Student overview, attendance, penalties, behaviors, participations, marks, enrollments
- **Analytics** — Drive overview, workflow overview, activity overview, and their detailed breakdowns

When you switch categories, the data source dropdown updates automatically. If the current source is not available in the new category, it defaults to the first available source.

### What to count (count widgets)

When the chart type is **Count**, a grid of metric buttons appears. Each metric exposes a different pre-computed count. For example:

- **Drive Overview**: Total Files, Total Folders, Total Storage, File Activities
- **Workflow Overview**: Total Documents, Approved, Pending, Rejected, Approval Rate
- **Activity Overview**: Total Activities, Total Submissions, Total Resources

Selecting a metric sets the `countMetric`, `statKey`, `titleKey`, and clears `groupBy`.

### Measure (numeric sources)

For sources that expose numeric value fields, choose the **Measure** you want to aggregate:

- `sessionCount` — Number of sessions
- `teachingHours` — Total teaching hours
- `fileCount` — Number of files
- `activityCount` — Number of activities
- `documentCount` — Number of documents
- `submissionCount` — Number of submissions
- `resourceCount` — Number of resources
- `storageMB` — Storage in megabytes
- `score` — Quiz score
- Other numeric fields depending on the source

The aggregation defaults to **Sum** for numeric measures. For plain count sources, the aggregation is always **Count**.

### Group By

For bar, line, pie, and donut charts, choose how to group the data. A grid of buttons is shown including a **None** option. Common options include:

- None
- Status / Type
- Program / Subject / Class
- Instructor / Student / Room
- Date / Term / Year
- Penalty type / Attendance type / Break type
- MIME type / Bucket / Action
- Workflow type / Activity type / Resource type

The available options depend on the selected data source's `groupBy` configuration.

### Aggregation

For sources without numeric value fields, the aggregation is **Count** only. For sources with numeric fields, three options are available:

- **Count** — Number of records
- **Sum** — Total of the value field
- **Average** — Mean of the value field

### Date range

Restrict the data to a period. Six preset buttons are shown:

| Range | Description |
| --- | --- |
| **All** | All available data |
| **Today** | Data from today only |
| **Last 7 Days** | Rolling 7-day window |
| **Last 30 Days** | Rolling 30-day window |
| **Last 90 Days** | Rolling 90-day window |
| **Custom Range** | Pick explicit start and end dates using a date range slider |

When **Custom Range** is selected, a `DateRangeSlider` component appears with from/to date pickers.

### Row limit (list widgets)

For list widgets, choose how many rows to display: **10, 25, 50, 100, or 200**. Default is 50.

### Layout size

- **Width (columns 2–12)** — How many grid columns the widget occupies. A full row is 12 columns. Default is 6.
- **Height (rows 2–12)** — How many vertical rows the widget occupies. Default is 4.

### Save or update

- **Create** — Adds the widget to the dashboard with a unique ID (`w` + timestamp).
- **Update** — Saves changes to the existing widget.
- **Cancel** — Closes the builder without saving.

## Chart rendering

Charts are rendered by the `OptimizedChartRenderer` component, which uses **React.lazy** and **Suspense** to lazy-load each chart type (Bar, Line, Pie, List) on demand, reducing initial bundle size. The renderer is memoized to prevent unnecessary re-renders.

### Count widget rendering

Count widgets display a large number centered in a card with:

- Animated radial gradient background (pulse animation)
- Animated number entrance (scale + translate)
- Responsive font size based on widget dimensions (2.5rem–7rem)
- Accent-colored gradient background and border
- Number formatted with `toLocaleString()`

### List widget rendering

List widgets display raw data rows with:

- Configurable row limit
- Column management (add/remove columns)
- Data from the raw analytics arrays
- Normalized status and type labels (via `normalizeAttendanceStatus`, `normalizeActivityType`)

## Drill-down interactions

Clicking a data point on a chart (pie slice, bar segment, line point) triggers a **drill-down**:

1. The system checks if a pre-defined drill-down list widget exists for the clicked data source and data point.
2. If found, the drill-down list widget is added to the dashboard.
3. If not found, a new list widget is created dynamically with:
   - Title: `{parentWidgetTitle} - {sliceLabel}`
   - Same data source and group-by as the parent widget
   - A `filterValue` set to the clicked slice label
   - Placed below the parent widget in the grid
4. The drill-down respects the widget limit — if at the limit, a warning is shown.

## Edit Layout mode

When you click **Edit Layout**:

1. Widgets show a drag handle (`.drag-handle` class) on the left.
2. You can drag cards to new positions on the 12-column grid.
3. You can resize cards from any corner (SE, SW, NE, NW handles).
4. Your layout is saved automatically to PostgreSQL (`user_preferences.settings.dashboards`) when you drop or resize a card.
5. Click **Edit Layout** again to toggle off and lock the layout.

### Grid layout details

- **Grid**: `react-grid-layout` with `WidthProvider` for responsive width.
- **Columns**: 12 (fixed).
- **Row height**: 64 pixels.
- **Margins**: 12px between items.
- **Compaction**: None (`compactType={null}`) — widgets stay where placed.
- **Collision prevention**: Disabled (`preventCollision={false}`).
- **RTL support**: Grid positions are mirrored for RTL layouts. The grid container stays LTR for positioning, but widget content is RTL.

### Filtered layout compaction

When a search query or category filter is active, visible widgets are re-packed from the top-left using a custom `compactLayoutItems` function to avoid gaps.

## Widget persistence

Widgets and layouts are saved **per user** in PostgreSQL via the `useWidgetDashboard` hook. The storage path is `user_preferences.settings.dashboards[storageKey]`, where `storageKey` identifies the dashboard context (e.g., `dashboard_analytics`). Your customisations do not affect other users.

### Widget limit

Each dashboard has a maximum widget count (`DASHBOARD_ANALYTICS_MAX_WIDGETS`), set to the number of default widgets. When the limit is reached:

- The **Add Widget** button shows a warning banner: "Widget limit reached — Maximum N widgets (system default). Delete or edit existing widgets before adding more."
- The warning auto-dismisses after 6 seconds.
- Duplicate and drill-down actions also respect this limit.

## Reset to system default

Click the **Reset** (history) icon to open a confirmation modal:

> **Reset Dashboard** — Reset dashboard to system defaults? Your custom layout will be lost.

On confirm:
- All custom widgets are removed.
- The default widget set is restored.
- Minimized states, original sizes, refresh versions, and timestamps are cleared.
- The reset is persisted to PostgreSQL.

## Data sources catalog

The widget builder supports data sources across nine categories:

### Academic
- Activities, Announcements, Resources, Enrollments, Classes, Programs, Subjects

### Assessment
- Student Marks (with value fields: totalMarks, midTermExam, finalExam, homework, quizzes, participation, attendance)
- Quizzes, Quiz Submissions (with score field)

### Operations
- Attendance, Users, Penalties, Absences, Behaviors, Participations, Activity Logs

### Content (Smart Drive)
- Smart Drive Files (with size field, filters by type/mimeType)
- Smart Drive Shares

### Workflow
- Workflow Documents (filters by status: pending, approved)
- Workflow Tasks (filters by status: open)

### Scheduling
- Scheduling Overview Stats (17 count metrics including sessions, instructors, rooms, teaching hours, breaks, holidays)
- Scheduling Sessions, Teachers, Courses, Classes, Rooms
- Instructor/Room Availability, Calendar, Breaks, Holidays
- Session Timeline, Instructor Workload, Class Coverage, Recurrence Breakdown
- Attendance by Status/Program/Instructor/Type/Timeline
- Workflow by Status/Type/Program/Timeline

### Student
- Student Overview Stats (14 count metrics including enrollments, attendance, penalties, behaviors, participations, GPA, net score)
- Attendance, Penalties, Behaviors, Participations, Student Marks, Enrollments

### Analytics (Dashboard)
- **Drive**: Drive Overview, Files by MIME Type, Files by Bucket, File Activities, Storage by User, Recent Files
- **Workflow**: Workflow Overview, Workflows by Status, Workflows by Type, Workflows by Program, Workflow Timeline, Recent Documents
- **Activity**: Activity Overview, Activities by Type, Activity Timeline, Submissions by Status, Submission Timeline, Resources by Type, Recent Activities, Recent Submissions

## Data processing

Widget data is processed by the `processWidgetData` function, which:

1. Reads the widget's `dataSource`, `groupBy`, `aggregation`, `filters`, `dateRange`, `customDateFrom`, `customDateTo`, and `valueField`.
2. Retrieves the raw data array from the `rawData` object.
3. Applies global filters (programId, subjectId, classId, etc.).
4. Applies widget-level filters.
5. Applies date range filtering (today, last 7/30/90 days, custom range).
6. Groups the data by the specified field.
7. Aggregates using count, sum, or average.
8. Returns an array of `{ label, value }` pairs suitable for chart rendering.

For overview/count sources (like `driveOverview`, `workflowOverview`, `activityOverview`), the function extracts the specific stat key from the overview object. For `totalStorageSize`, the value is converted from bytes to megabytes.

## API services

The `DashboardAnalyticsService` provides four API endpoints:

- **General Analytics** — Fetches general analytics data.
- **Drive Analytics** — Fetches drive-specific analytics (overview, files by type/bucket, activities, storage by user, recent files).
- **Workflow Analytics** — Fetches workflow-specific analytics (overview, by status/type/program, timeline, recent documents).
- **Activity Analytics** — Fetches activity-specific analytics (overview, activities by type, timeline, submissions by status, submission timeline, resources by type, recent activities/submissions).

All API calls include error handling and return data in the format expected by `buildAnalyticsRawData`, which maps the API response into the `rawData` structure consumed by `processWidgetData`.

## Validations and limitations

- **Widget limit**: Each dashboard enforces a maximum widget count. Adding, duplicating, or drill-down beyond the limit is blocked with a warning.
- **Chart type compatibility**: Not all data sources support all chart types. Incompatible options are disabled in the builder.
- **Count widgets**: Count widgets have no group-by or aggregation options — they display a single pre-computed metric.
- **List sources**: Only specific data sources support list widgets (defined in `LIST_ALLOWED_SOURCES`).
- **Date range**: Custom date range requires both start and end dates to be set.
- **RTL layout**: Grid positioning is mirrored for RTL, but the grid container itself stays LTR for correct positioning.
- **Permission errors**: If a data service returns `permission-denied`, the card shows `0` and the error is logged.

## Troubleshooting

| Problem | Cause | Solution |
| --- | --- | --- |
| Widget shows 0 or empty | Data service failed or returned empty | Click **Refresh** to re-fetch data. Check browser console for permission errors. |
| Cannot add widget | Widget limit reached | Delete or edit existing widgets before adding new ones. |
| Chart type disabled | No compatible data sources for that chart type in the selected category | Switch to a different category or chart type. |
| Layout not saving | PostgreSQL user preferences save failed | Check network connection and backend logs. Layout changes are saved via `useWidgetDashboard` hook. |
| Tour not starting | Tour already seen (stored in `localStorage`) | Click the **help icon** (?) in the section header to re-start the tour. |
| Drill-down not working | Widget limit reached or no compatible drill-down source | Check if you're at the widget limit. Some sources may not have pre-defined drill-down widgets. |
| Count widget shows wrong number | Stat key mismatch or data not loaded | Verify the data source and metric are correct. Refresh the dashboard. |
| Custom date range not applying | Missing start or end date | Ensure both dates are set in the DateRangeSlider. |

## Related articles

- [Summary Dashboard](/en/summary-dashboard) — Scheduling overview, breaks, holidays, and attendance analytics.
- [Dashboard](/en/dashboard) — Role-based dashboard tabs and analytics.
- [Smart Drive](/en/smart-drive) — File analytics feed into the Drive widget category.
- [Workflow](/en/workflow) — Workflow documents feed into the Workflow widget category.
- [Attendance](/en/attendance) — Attendance data feeds into the Operations widget category.
- [Reports](/en/scheduled-reports) — Schedule recurring analytics exports.
