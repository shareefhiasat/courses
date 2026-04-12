# 📊 Analytics Dashboard System

A **plug-and-play, metadata-driven analytics dashboard** for React + Firebase applications.  
Build, persist, and reuse analytics widgets anywhere in your app with zero boilerplate.

---

## 🚀 Quick Start

```jsx
import AdvancedAnalytics from '@components/AdvancedAnalytics';

function AnyPage() {
  return (
    <AdvancedAnalytics
      globalFilters={{ classId, programId }}   // Optional: scope data
      storageKey="my_dashboard"                // Isolate widgets per page
      defaultWidgets={[]}                      // Start empty → user builds
      title="My Analytics"
    />
  );
}
```

---

## 📦 What You Get

- **16 Firebase collections** fetched in parallel (permission‑tolerant)
- **Drag‑and‑drop grid layout** (`react-grid-layout`)
- **4 chart types**: Bar, Line, Pie, Area
- **Per‑widget controls**: Pin, Minimize, Maximize, Edit, Delete, Refresh
- **Firestore persistence** (localStorage fallback)
- **Full i18n** (EN + AR)
- **Context‑aware filtering** via `globalFilters`
- **Real‑time data** with optional auto‑refresh
- **CSV export**
- **Drill‑down modals**

---

## 🧩 Architecture

```
AdvancedAnalytics (orchestrator)
├─ useAnalyticsData (data fetching + processing)
├─ useWidgetDashboard (Firestore persistence)
└─ DashboardEngine (grid + widgets)
   ├─ WidgetWrapper (UI shell)
   └─ WidgetBuilder (modal form)
```

- **UI Layer** (`/components`): Logic‑free components
- **Logic Layer** (`/hooks`): Data fetching, processing, persistence
- **Service Layer** (`/services`): Firebase calls only

---

## 🎯 Use Cases & Examples

### 1️⃣ Single Widget on Any Page

```jsx
const CLASS_WIDGET = [
  {
    id: 'w1',
    title: 'Submissions by Status',
    chartType: 'pie',
    dataSource: 'submissions',
    groupBy: 'status',
    aggregation: 'count',
    dateRange: 'all',
    filters: [],
    comparisonMode: false,
    layout: { x: 0, y: 0, w: 12, h: 6 }
  }
];

function ClassPage({ classId }) {
  return (
    <AdvancedAnalytics
      globalFilters={{ classId }}
      storageKey={`class_${classId}_widget`}
      defaultWidgets={CLASS_WIDGET}
      title="Class Analytics"
    />
  );
}
```

---

### 2️⃣ Multi‑Widget Dashboard

```jsx
const STUDENT_WIDGETS = [
  {
    id: 'w1',
    title: 'My Attendance',
    chartType: 'bar',
    dataSource: 'attendance',
    groupBy: 'status',
    aggregation: 'count',
    dateRange: 'last30',
    filters: [],
    comparisonMode: false,
    layout: { x: 0, y: 0, w: 6, h: 4 }
  },
  {
    id: 'w2',
    title: 'Marks Trend',
    chartType: 'line',
    dataSource: 'studentMarks',
    groupBy: 'date',
    aggregation: 'avg',
    dateRange: 'last90',
    filters: [],
    comparisonMode: false,
    layout: { x: 6, y: 0, w: 6, h: 4 }
  }
];

function StudentDashboard({ studentId }) {
  return (
    <AdvancedAnalytics
      globalFilters={{ studentId }}
      storageKey={`student_${studentId}_dash`}
      defaultWidgets={STUDENT_WIDGETS}
      title="My Progress"
    />
  );
}
```

---

### 3️⃣ Builder Mode (User Creates Widgets)

```jsx
function HRAnalyticsPage() {
  return (
    <AdvancedAnalytics
      globalFilters={{}}                // Admin view
      storageKey="hr_analytics"
      defaultWidgets={[]}               // Start empty → user builds
      title="HR Analytics"
    />
  );
}
```

---

### 4️⃣ With Pre‑Filters (Program/Subject/Term)

```jsx
function ProgramDashboard({ programId }) {
  const PROGRAM_WIDGETS = [
    {
      id: 'w1',
      title: 'Enrollments by Class',
      chartType: 'bar',
      dataSource: 'enrollments',
      groupBy: 'classId',
      aggregation: 'count',
      dateRange: 'all',
      filters: [],                     // globalFilters injects programId
      comparisonMode: false,
      layout: { x: 0, y: 0, w: 6, h: 4 }
    }
  ];

  return (
    <AdvancedAnalytics
      globalFilters={{ programId }}
      storageKey={`program_${programId}`}
      defaultWidgets={PROGRAM_WIDGETS}
      title="Program Analytics"
    />
  );
}
```

---

## 📋 Available Data Sources

### Firestore Collections Read (No New Collections Created)

The analytics dashboard **reads from existing Firestore collections** — it does **not create any new collections**. All data lives in your existing RISX/LMS collections.

| Value | Firestore Collection | Required Fields | Supported Group‑By | Supported Aggregations | Date Range |
|-------|--------------------|----------------|-------------------|------------------------|------------|
| `submissions` | `submissions` | `status`, `classId`, `programId`, `subjectId`, `userId`, `createdAt` (timestamp) | status, classId, programId, subjectId, userId, date, semester, term, year | count, sum, avg, min, max, median | ✅ |
| `activities` | `activities` | `type`, `classId`, `programId`, `subjectId`, `userId`, `createdAt` (timestamp) | type, classId, programId, subjectId, userId, date, semester, term | count, sum, avg, min, max, median | ✅ |
| `users` | `users` | `role`, `status`, `programId`, `createdAt` (timestamp) | role, status, programId, date | count, sum, avg, min, max, median | ✅ |
| `classes` | `classes` | `programId`, `term`, `year`, `semester`, `status`, `createdAt` (timestamp) | programId, term, year, semester, status | count, sum, avg, min, max, median | ✅ |
| `programs` | `programs` | `status`, `type`, `createdAt` (timestamp) | status, type | count, sum, avg, min, max, median | ✅ |
| `subjects` | `subjects` | `programId`, `semester`, `type`, `createdAt` (timestamp) | programId, semester, type | count, sum, avg, min, max, median | ✅ |
| `enrollments` | `enrollments` | `status`, `classId`, `programId`, `subjectId`, `semester`, `year`, `createdAt` (timestamp) | status, classId, programId, subjectId, semester, year | count, sum, avg, min, max, median | ✅ |
| `quizzes` | `quizzes` | `type`, `difficulty`, `classId`, `programId`, `subjectId`, `createdAt` (timestamp) | type, difficulty, classId, programId, subjectId | count, sum, avg, min, max, median | ✅ |
| `quizSubmissions` | `quizSubmissions` | `status`, `classId`, `userId`, `createdAt` (timestamp) | status, classId, userId, date | count, sum, avg, min, max, median | ✅ |
| `attendance` | `attendance` | `status`, `classId`, `studentId`, `date`, `markedBy`, `method`, `createdAt` (timestamp) | status, classId, studentId, date, method | count, sum, avg, min, max, median | ✅ |
| `penalties` | `penalties` | `penaltyType`, `classId`, `userId`, `createdAt` (timestamp) | penaltyType, classId, userId, date | count, sum, avg, min, max, median | ✅ |
| `absences` | `absences` | `absenceType`, `classId`, `userId`, `createdAt` (timestamp) | absenceType, classId, userId, date | count, sum, avg, min, max, median | ✅ |
| `notifications` | `notifications` | `type`, `status`, `createdAt` (timestamp) | type, status, date | count, sum, avg, min, max, median | ✅ |
| `studentMarks` | `studentMarks` | `markType`, `classId`, `userId`, `programId`, `subjectId`, `createdAt` (timestamp) | markType, classId, userId, programId, subjectId | count, sum, avg, min, max, median | ✅ |
| `activityLogs` | `activityLogs` | `type`, `userId`, `createdAt` (timestamp) | type, userId, date | count, sum, avg, min, max, median | ✅ |
| `emailLogs` | `emailLogs` | `status`, `type`, `createdAt` (timestamp) | status, type, date | count, sum, avg, min, max, median | ✅ |

### Required Fields

All collections **must have** a timestamp field (`createdAt` or equivalent) for date filtering. The dashboard automatically detects:
- `createdAt.seconds` (Firestore Timestamp)
- `when.seconds` (alternative timestamp field)
- `submittedAt.seconds` (submission timestamps)
- Any ISO date string

### Aggregation Support

| Aggregation | Description | Works With |
|-------------|-------------|------------|
| `count` | Number of records | All collections |
| `sum` | Sum of numeric fields (e.g., scores, points) | Collections with numeric values |
| `avg` | Average of numeric fields | Collections with numeric values |
| `min` | Minimum value | Collections with sortable values |
| `max` | Maximum value | Collections with sortable values |
| `median` | Median value | Collections with sortable values |

### Date Range Support

All collections support date range filtering:
- `all` — No date filter
- `today` — Records from today
- `last7` — Last 7 days
- `last30` — Last 30 days
- `last90` — Last 90 days
- `custom` — User-selected date range

### Required vs Optional Widget Fields

```js
{
  dataSource: 'submissions',    // ✅ REQUIRED — must select a data source
  title: 'My Widget',          // ✅ REQUIRED — user must enter title
  chartType: 'bar',            // ✅ REQUIRED — must select chart type
  groupBy: 'status',           // ✅ REQUIRED — must select group-by field
  aggregation: 'count',        // ✅ REQUIRED — must select aggregation
  dateRange: 'all',            // ✅ REQUIRED — must select date range
  filters: [],                 // ❌ OPTIONAL — rarely used
  comparisonMode: false,       // ❌ OPTIONAL — default off
  comparisonPeriod: 'previous', // ❌ OPTIONAL — only if comparisonMode=true
  layout: { x, y, w, h }       // ❌ OPTIONAL — auto-generated if not provided
}
```

**Bottom line:** `dataSource`, `title`, `chartType`, `groupBy`, `aggregation`, and `dateRange` are **required**. Everything else is optional.

---

## 🎛️ Widget Config Schema

```js
{
  id: 'unique_id',
  title: 'Widget Title',
  chartType: 'bar' | 'line' | 'pie' | 'area',
  dataSource: 'submissions', // one of the 16 sources above
  groupBy: 'status',         // field name from the collection
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'median',
  dateRange: 'all' | 'today' | 'last7' | 'last30' | 'last90' | 'custom',
  customDateFrom: '',        // ISO string if dateRange === 'custom'
  customDateTo: '',
  filters: [],               // Additional static filters (rarely needed)
  comparisonMode: false,
  comparisonPeriod: 'previous' | 'lastYear',
  layout: { x, y, w, h }     // Grid position/size
}
```

---

## 🌐 Persistence

- **Firestore**: `users/{uid}/preferences.dashboards.{storageKey}`
- **Fallback**: `localStorage` key `wdg_{storageKey}`
- **Debounced save** (800ms) → fast UI, reliable backend
- **Cross‑device sync** for authenticated users
- **Offline support** via localStorage

---

## 🌍 Internationalization

All strings are translated via `LangContext`. Keys are in `LangContext.jsx` under the `// ── Analytics Dashboard ──` section.

- Data source labels: `ds_submissions`, `ds_activities`, …
- Group‑by labels: `gb_status`, `gb_class`, …
- Aggregation labels: `agg_count`, `agg_avg`, …
- UI labels: `add_widget`, `edit_widget`, `pin`, `minimize`, …

Add new keys in both EN and AR sections.

---

## 🎨 Theming

Uses CSS custom properties from your theme system:

```css
--panel    /* Widget background */
--text     /* Text color */
--muted    /* Secondary text */
--border   /* Borders/dividers */
--bg       /* Page background */
--input-bg /* Input backgrounds */
```

Accent color is passed via the `accentColor` prop.

---

## 🔄 Auto‑Refresh

```jsx
<AdvancedAnalytics
  // ...props
  // Auto‑refresh is built‑in; user selects interval in UI
/>
```

- Options: Off, 1 min, 5 min, 15 min, 30 min, 60 min
- Visual progress bar
- Per‑widget refresh (local re‑render) vs full data reload

---

## 📤 CSV Export

```js
// Inside AdvancedAnalytics:
const handleExport = useCallback(() => {
  // Exports all widget data as CSV
}, [rawData, mergedFilters, storageKey, processWidgetData]);
```

Button appears in the header.

---

## 🧩 Extending the System

### Add a New Data Source

1. Add to `DATA_SOURCES` in `WidgetBuilder.jsx`
2. Add translation keys (`ds_my_source`)
3. Ensure `useAnalyticsData.js` fetches the collection
4. Add any custom group‑by mappings in `GROUP_BY_KEYS`

### Add a New Chart Type

1. Create component in `/components/charts/`
2. Import and add to `DashboardEngine.jsx` render logic
3. Add translation key (`my_chart`)

### Custom Aggregation

1. Add to `AGGREGATION_KEYS` in `WidgetBuilder.jsx`
2. Implement logic in `processWidgetData` in `useAnalyticsData.js`
3. Add translation key (`agg_my_agg`)

---

## 🛠️ Performance Tips

- **Memoization**: All expensive operations are wrapped in `useMemo`
- **Virtualization**: Lists >50 rows use `react-window` (if you add table widgets)
- **Lazy loading**: Charts render only when visible
- **Debounced persistence**: Avoids Firestore spam
- **Per‑widget refresh**: No full page reloads

---

## 🧪 Testing

- Unit tests for hooks (`useAnalyticsData`, `useWidgetDashboard`)
- Component tests for `WidgetWrapper`, `WidgetBuilder`, `DashboardEngine`
- Integration tests for Firestore persistence
- E2E tests for user workflows (build, edit, delete, export)

---

## 📂 File Structure

```
src/
├─ components/
│  ├─ AdvancedAnalytics.jsx          # Main orchestrator
│  ├─ analytics/
│  │  ├─ DashboardEngine.jsx          # Grid + widget orchestration
│  │  ├─ WidgetWrapper.jsx            # UI shell (minimize/pin/etc)
│  │  └─ WidgetBuilder.jsx            # Modal form
│  └─ charts/
│     ├─ BarChart.jsx
│     ├─ LineChart.jsx
│     ├─ PieChart.jsx
│     └─ AreaChart.jsx
├─ hooks/
│  ├─ useAnalyticsData.js             # Data fetching + processing
│  └─ useWidgetDashboard.js           # Firestore persistence
├─ contexts/
│  ├─ LangContext.jsx                 # i18n
│  └─ ThemeContext.jsx                # Theming
└─ services/
   └─ business/
      └─ userPreferenceService.js     # Firestore helpers
```

---

## 🤝 Contributing

1. **Keep the layering**: UI → Logic → Service
2. **Add tests** for new features
3. **Update i18n** for any user‑facing strings
4. **Document** new data sources/chart types
5. **Follow the memoization rules** in the workspace constitution

---

## 📄 License

Part of your LMS workspace. Follow the existing project license.

---

## 🧩 TL;DR

```jsx
// Anywhere in your app:
<AdvancedAnalytics
  globalFilters={{ programId, subjectId }}  // Optional filters
  storageKey="my_dashboard"               // Isolate widgets
  defaultWidgets={[]}                      // Start empty → user builds
  title="My Analytics"
/>
```

That’s it. You now have a full‑featured, production‑grade analytics dashboard. 🎉
