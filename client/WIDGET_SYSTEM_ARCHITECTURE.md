# Dynamic Role-Based Widget System - Architecture Summary

## Overview

This document explains how the dynamic, role-based widget system works in the Student Dashboard and how components communicate with each other.

## Architecture Flow

```
StudentDashboardPage
    ↓ (passes filters)
OverviewTab / PerformanceTab
    ↓ (uses AdvancedAnalyticsWithRoleSupport)
AdvancedAnalyticsWithRoleSupport
    ↓ (manages widgets via useRoleBasedWidgets)
DashboardEngine
    ↓ (renders widgets via OptimizedChartRenderer)
Chart Components (BarChart, LineChart, PieChart, AreaChart)
```

## Key Components & Their Roles

### 1. StudentDashboardPage.jsx
**Purpose**: Main dashboard container that manages tabs and filters
**Responsibilities**:
- Manages tab switching (overview, attendance, marks, performance)
- Handles class/student selection filters
- Passes filter props to child components
- Controls data loading and error states

**Key Props Passed to Tabs**:
```javascript
selectedClassId={filters.selectedClassId}
selectedStudentId={filters.selectedStudentId}
selectedProgramId={filters.selectedProgramId}
selectedSubjectId={filters.selectedSubjectId}
```

### 2. OverviewTab.jsx & PerformanceTab.jsx
**Purpose**: Tab components that display role-based widgets
**Responsibilities**:
- Create global filters from parent props
- Generate role-specific storage keys
- Pass configuration to AdvancedAnalyticsWithRoleSupport

**Communication**:
```javascript
// Creates global filters for widgets
const globalFilters = useMemo(() => {
  const filters = {};
  if (selectedClassId && selectedClassId !== 'all') {
    filters.classId = selectedClassId;
  }
  if (selectedStudentId) {
    filters.studentId = selectedStudentId;
  }
  // ... other filters
  return filters;
}, [selectedClassId, selectedStudentId, ...]);

// Uses AdvancedAnalyticsWithRoleSupport
<AdvancedAnalyticsWithRoleSupport
  title={title}
  storageKey={storageKey}
  globalFilters={globalFilters}
  dashboard="overview" // or "performance"
  enableCustomization={true}
  showFilters={false}
/>
```

### 3. AdvancedAnalyticsWithRoleSupport.jsx
**Purpose**: Enhanced analytics component with role-based widget support
**Responsibilities**:
- Loads role-based default widgets via useRoleBasedWidgets
- Manages widget permissions and customization
- Handles global filters and data fetching
- Provides super admin widget management

**Key Features**:
- Automatic role detection and widget filtering
- Parallel data fetching with Promise.all
- Widget assignment manager for super admins
- Performance optimizations (caching, memoization)

### 4. useRoleBasedWidgets.js Hook
**Purpose**: Manages widget state and role-based configurations
**Responsibilities**:
- Loads default widgets for user role/dashboard
- Filters widgets based on permissions
- Manages widget persistence (Firestore + localStorage)
- Provides widget CRUD operations

**Usage**:
```javascript
const {
  widgets,           // Filtered widgets for current role
  setWidgets,        // Update widgets
  pinnedIds,         // Pinned widget IDs
  setPinnedIds,      // Update pinned widgets
  canEdit,           // Can user edit widgets?
  userRole,          // Current user's role
  stats              // Widget statistics
} = useRoleBasedWidgets(dashboard, {
  enableCustomization: true,
  filterByPermissions: true,
  mergeWithDefaults: true
});
```

### 5. WidgetConfigurationService.js
**Purpose**: Central service for widget configurations and permissions
**Responsibilities**:
- Provides default widget configurations per role
- Manages widget permissions and data source access
- Handles widget merging and validation
- Generates storage keys for persistence

**Default Widget Configurations**:
- **Student**: Enrollment status, attendance rate, recent marks
- **Instructor**: Total students, class attendance, pending submissions
- **HR**: Employee counts, department distribution, training metrics
- **Admin**: System overview, active courses, user activity
- **Super Admin**: All admin widgets + multi-tenant overview

### 6. DashboardEngine.jsx
**Purpose**: Renders the widget grid and manages layout
**Responsibilities**:
- Manages widget grid layout (react-grid-layout)
- Handles widget drag/resize operations
- Renders individual widgets via OptimizedChartRenderer
- Manages widget state (pinned, minimized, refreshed)

**Widget Rendering**:
```javascript
const renderChart = useCallback((widget, size) => {
  const data = chartDataMap[widget.id] || [];
  
  return (
    <OptimizedChartRenderer 
      widget={widget}
      size={size}
      data={data}
      accentColor={accentColor}
      onPointClick={(dp) => handleChartClick(widget, dp)}
    />
  );
}, [chartDataMap, handleChartClick, accentColor]);
```

### 7. OptimizedChartRenderer.jsx
**Purpose**: Optimized chart rendering with lazy loading
**Responsibilities**:
- Lazy loads chart components (React.lazy)
- Renders appropriate chart based on widget type
- Provides loading fallbacks
- Memoizes chart props for performance

**Supported Chart Types**:
- `bar` - BarChart component
- `line` - LineChart component  
- `pie` - PieChart component
- `area` - AreaChart component
- `count` - Simple count display (fallback)

### 8. useOptimizedAnalyticsData.js
**Purpose**: Performance-optimized data fetching hook
**Responsibilities**:
- Implements React.cache for data deduplication
- Parallel data fetching with Promise.all
- Memoized data processing
- Performance monitoring

## Data Flow & Communication

### Filter Flow
1. **StudentDashboardPage** → User selects class/student
2. **OverviewTab/PerformanceTab** → Creates globalFilters object
3. **AdvancedAnalyticsWithRoleSupport** → Merges with local filters
4. **DashboardEngine** → Passes to widget data processing
5. **OptimizedChartRenderer** → Receives filtered data

### Widget Configuration Flow
1. **useRoleBasedWidgets** → Detects user role
2. **WidgetConfigurationService** → Provides default widgets
3. **AdvancedAnalyticsWithRoleSupport** → Filters by permissions
4. **DashboardEngine** → Renders widget grid
5. **OptimizedChartRenderer** → Renders individual charts

### Persistence Flow
1. **useWidgetDashboard** → Saves to Firestore + localStorage
2. **WidgetConfigurationService** → Manages role-based configs
3. **useRoleBasedWidgets** → Merges defaults with saved widgets
4. **DashboardEngine** → Persists layout changes

## How to Use the System

### For Students (Automatic)
- Navigate to Student Dashboard
- Overview tab shows enrollment, attendance, and marks widgets
- Performance tab shows detailed analytics
- Widgets automatically update based on class selection

### For Instructors (Automatic)
- Overview shows class statistics and student counts
- Performance shows grade distributions and engagement
- Can filter by specific classes

### For Super Admins (Widget Management)
1. Go to any dashboard with widgets
2. Click "Manage Widgets" button (purple, settings icon)
3. Select role and dashboard to configure
4. Add/remove/reorder widgets from available templates
5. Save configuration

### Adding New Chart Types
1. Create chart component in `/components/charts/`
2. Add lazy import to `OptimizedChartRenderer.jsx`
3. Add case to switch statement
4. Update widget templates in `WidgetAssignmentManager.jsx`

### Adding New Widget Templates
1. Update `availableWidgets` array in `WidgetAssignmentManager.jsx`
2. Add default configuration to `WidgetConfigurationService.js`
3. Ensure data source exists in `useOptimizedAnalyticsData.js`

## Performance Optimizations

1. **Lazy Loading**: Chart components loaded on-demand
2. **Parallel Fetching**: Multiple data sources fetched simultaneously
3. **Memoization**: Widget data and props memoized to prevent re-renders
4. **Caching**: React.cache prevents duplicate data fetches
5. **Virtualization**: Large lists use react-window (when needed)

## Responsive Design

- **320px**: Mobile view (single column, touch-friendly)
- **768px**: Tablet view (2-3 columns)
- **1440px**: Desktop view (full 12-column grid)
- **RTL Support**: Uses logical properties (ms-, pe-, border-s)

## Security & Permissions

- Widgets filtered by user role automatically
- Data sources restricted by permissions
- Super admin can manage all role configurations
- Customizations saved per user/role/dashboard

## Troubleshooting

### Common Issues
1. **Missing Chart Components**: Check imports in `OptimizedChartRenderer.jsx`
2. **Permission Errors**: Verify role constants in `USER_ROLES`
3. **Widget Not Showing**: Check data source permissions in `WidgetConfigurationService`
4. **Layout Issues**: Verify grid layout props in widget configuration

### Debug Tools
- Browser console shows widget loading errors
- React DevTools can inspect widget state
- Network tab shows data fetching performance
- LocalStorage contains cached widget configurations

This system provides a flexible, performant, and secure way to display role-based analytics across the LMS platform.
