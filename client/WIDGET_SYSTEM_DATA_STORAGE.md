# Widget System Data Storage - README

## Overview

This document explains exactly how and where widget data is stored in the widget system, including collections, data flow, and storage mechanisms.

## Data Storage Architecture

### 1. Widget Configurations Storage

#### Firestore Storage (Primary)
**Location**: `users/{uid}/preferences/dashboards/{dashboardKey}`

**Structure**:
```javascript
// Document: users/{userId}/preferences
{
  dashboards: {
    "student_dashboard_overview_student": {
      widgets: [...],           // Array of widget configurations
      pinnedIds: [...],         // Array of pinned widget IDs
      updatedAt: timestamp      // Firestore timestamp
    },
    "student_dashboard_performance_student": {
      widgets: [...],
      pinnedIds: [...],
      updatedAt: timestamp
    },
    "analytics_admin_overview_admin": {
      widgets: [...],
      pinnedIds: [...],
      updatedAt: timestamp
    }
  }
}
```

**Storage Key Format**: `{page}_{dashboard}_{role}`
- Examples:
  - `student_dashboard_overview_student`
  - `student_dashboard_performance_instructor`
  - `analytics_admin_overview_admin`

#### localStorage Fallback (Secondary)
**Key Format**: `wdg_{dashboardKey}`

**Examples**:
- `wdg_student_dashboard_overview_student`
- `wdg_student_dashboard_performance_student`

### 2. Widget Configuration Data

#### Widget Object Structure
```javascript
{
  id: "widget_unique_id",                    // Unique identifier
  title: "Widget Title",                      // Display title
  chartType: "bar|line|pie|area|count",      // Chart type
  dataSource: "enrollments|attendance|marks", // Data source
  groupBy: "status|subject|class",           // Grouping field (optional)
  aggregation: "count|average|sum",           // Aggregation method
  dateRange: "current|last30|all",           // Time range
  filters: [                                  // Applied filters
    { field: "status", value: "present" }
  ],
  layout: {                                   // Grid layout
    x: 0, y: 0, w: 4, h: 3
  },
  isCustom: false,                            // Custom widget flag
  role: "student",                           // Target role
  dashboard: "overview"                       // Target dashboard
}
```

### 3. Data Sources & Collections

#### Primary Data Collections
```javascript
// Student/Instructor Data
"enrollments"    → Collection: enrollments
"attendance"     → Collection: attendance  
"marks"          → Collection: marks
"participations" → Collection: participations
"behaviors"      → Collection: behaviors
"penalties"      → Collection: penalties

// Class/Course Data
"classes"        → Collection: classes
"subjects"       → Collection: subjects
"programs"       → Collection: programs

// User Data
"users"          → Collection: users
"activityLogs"   → Collection: activityLogs

// Admin/HR Data
"trainings"      → Collection: trainings
"leaves"         → Collection: leaves
"departments"    → Collection: departments
"performanceReviews" → Collection: performanceReviews
"surveys"        → Collection: surveys
```

#### Data Access by Role
```javascript
// Student can access:
const studentDataSources = [
  'enrollments', 'attendance', 'marks', 
  'participations', 'behaviors', 'penalties'
];

// Instructor can access:
const instructorDataSources = [
  'enrollments', 'attendance', 'marks', 'submissions', 
  'activityLogs', 'classes'
];

// HR can access:
const hrDataSources = [
  'users', 'trainings', 'leaves', 'departments',
  'attendance', 'performanceReviews', 'surveys'
];

// Admin can access:
const adminDataSources = [
  'users', 'classes', 'enrollments', 'activityLogs',
  'resources', 'metrics', 'system'
];

// Super Admin can access:
const superAdminDataSources = ['*']; // All data sources
```

## Data Flow & Processing

### 1. Widget Loading Flow
```javascript
// 1. User loads dashboard
useRoleBasedWidgets(dashboard)
  ↓
// 2. Load from Firestore first
doc(db, 'users', uid, 'preferences')
  ↓
// 3. Fallback to localStorage if Firestore fails
localStorage.getItem(`wdg_${dashboardKey}`)
  ↓
// 4. Merge with role-based defaults
WidgetConfigurationService.getDefaultWidgets(role, dashboard)
  ↓
// 5. Filter by permissions
WidgetConfigurationService.filterWidgetsByPermissions(widgets, role)
```

### 2. Data Fetching Flow
```javascript
// 1. Extract data sources from widgets
const dataSources = widgets.map(w => w.dataSource);

// 2. Fetch data in parallel (Promise.all)
Promise.all([
  fetchCachedEnrollments(filters),
  fetchCachedAttendance(filters),
  fetchCachedMarks(filters)
  // ... other data sources
])
  ↓
// 3. Process data for each widget
widgets.forEach(widget => {
  const processedData = processWidgetDataOptimized(widget, rawData, globalFilters);
});
```

### 3. Data Processing Example
```javascript
// Example: Processing attendance data for a pie chart
function processAttendanceData(widget, rawData, filters) {
  let filtered = rawData.attendance || [];
  
  // Apply filters
  if (filters.classId) {
    filtered = filtered.filter(item => item.classId === filters.classId);
  }
  if (filters.studentId) {
    filtered = filtered.filter(item => item.studentId === filters.studentId);
  }
  
  // Group by status
  if (widget.groupBy === 'status') {
    const grouped = {};
    filtered.forEach(item => {
      const key = item.status || 'Unknown';
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    return Object.entries(grouped).map(([label, value]) => ({ 
      label, 
      value 
    }));
  }
  
  return [{ label: 'Attendance', value: filtered.length }];
}
```

## Storage Implementation Details

### 1. Firestore Operations

#### Saving Widget Configuration
```javascript
// In useWidgetDashboard.js
const debouncedSave = useCallback(async (nextWidgets, nextPinned) => {
  const payload = { 
    widgets: nextWidgets, 
    pinnedIds: nextPinned 
  };

  // Always write localStorage as fast cache
  localStorage.setItem(`wdg_${dashboardKey}`, JSON.stringify(payload));

  // Write Firestore if authenticated
  if (uid) {
    const ref = doc(db, 'users', uid);
    await setDoc(ref, {
      preferences: {
        dashboards: {
          [dashboardKey]: { 
            ...payload, 
            updatedAt: serverTimestamp() 
          }
        }
      }
    }, { merge: true });
  }
}, [uid, dashboardKey]);
```

#### Loading Widget Configuration
```javascript
// In useWidgetDashboard.js
const load = async () => {
  if (uid) {
    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const prefs = snap.data()?.preferences?.dashboards?.[dashboardKey];
        if (prefs?.widgets?.length) {
          setWidgetsState(prefs.widgets);
          setPinnedIdsState(prefs.pinnedIds || []);
          return;
        }
      }
    } catch (e) {
      logger.warn('Firestore load failed, falling back to localStorage:', e);
    }
  }

  // Fallback: localStorage
  const saved = localStorage.getItem(`wdg_${dashboardKey}`);
  if (saved) {
    const parsed = JSON.parse(saved);
    setWidgetsState(parsed.widgets || defaultWidgets);
    setPinnedIdsState(parsed.pinnedIds || []);
  }
};
```

### 2. Caching Strategy

#### React.cache for Data Fetching
```javascript
// Cached fetchers prevent duplicate requests
const fetchCachedEnrollments = cache(async (filters) => {
  // Actual data fetching logic
  return await getEnrollments(filters);
});

// Parallel fetching with deduplication
export const fetchWidgetDataParallel = cache(async (widgets, globalFilters) => {
  // Extract unique data sources
  const dataSources = new Set(widgets.map(w => w.dataSource));
  
  // Fetch in parallel
  const fetchPromises = Array.from(dataSources).map(source => {
    return fetchCachedData(source, globalFilters);
  });
  
  return Promise.all(fetchPromises);
});
```

#### Memoization for Processing
```javascript
// Processed data is cached to prevent recalculation
export const processWidgetDataOptimized = cache((widget, rawData, globalFilters) => {
  // Data processing logic
  return processedData;
});
```

### 3. Permission-Based Data Filtering

#### Data Source Permissions
```javascript
// In WidgetConfigurationService.js
static filterWidgetsByPermissions(widgets, role) {
  const dataSourcePermissions = {
    [USER_ROLES.STUDENT]: ['enrollments', 'attendance', 'marks', 'participations', 'behaviors', 'penalties'],
    [USER_ROLES.INSTRUCTOR]: ['enrollments', 'attendance', 'marks', 'submissions', 'activityLogs', 'classes'],
    [USER_ROLES.HR]: ['users', 'trainings', 'leaves', 'departments', 'attendance', 'performanceReviews', 'surveys'],
    [USER_ROLES.ADMIN]: ['users', 'classes', 'enrollments', 'activityLogs', 'resources', 'metrics', 'system'],
    [USER_ROLES.SUPER_ADMIN]: ['*'] // All data sources
  };

  const allowedSources = dataSourcePermissions[role] || [];
  
  return widgets.filter(widget => {
    if (role === USER_ROLES.SUPER_ADMIN) return true;
    return allowedSources.includes('*') || allowedSources.includes(widget.dataSource);
  });
}
```

## Real Data Examples

### Student Widget Configuration
```javascript
// Stored in: users/student123/preferences/dashboards/student_dashboard_overview_student
{
  widgets: [
    {
      id: "student_overview_1_1640995200000",
      title: "Enrollment Status",
      chartType: "count",
      dataSource: "enrollments",
      aggregation: "count",
      dateRange: "current",
      filters: [],
      layout: { x: 0, y: 0, w: 4, h: 3 },
      role: "student",
      dashboard: "overview"
    },
    {
      id: "student_overview_2_1640995200000", 
      title: "Attendance Rate",
      chartType: "pie",
      dataSource: "attendance",
      groupBy: "status",
      aggregation: "count",
      dateRange: "current",
      filters: [],
      layout: { x: 4, y: 0, w: 4, h: 3 },
      role: "student",
      dashboard: "overview"
    }
  ],
  pinnedIds: ["student_overview_1_1640995200000"],
  updatedAt: { "_seconds": 1640995200, "_nanoseconds": 0 }
}
```

### Processed Widget Data
```javascript
// After data processing, widgets receive this data structure:
[
  { label: "Present", value: 45 },
  { label: "Absent", value: 3 },
  { label: "Late", value: 2 }
]
```

## Security & Privacy

### 1. Data Access Control
- **Role-based filtering**: Users only see data sources their role allows
- **User-specific data**: Students only see their own data when filtered
- **Class-level data**: Instructors see class data but not other classes
- **Admin oversight**: Admins can see system-level data

### 2. Data Validation
```javascript
// All widget configurations are validated before saving
const validateWidgetConfig = (widget) => {
  const required = ['id', 'title', 'chartType', 'dataSource'];
  return required.every(field => widget[field]);
};
```

### 3. Privacy Protection
- **No sensitive data in localStorage**: Only widget configurations, not actual data
- **Encrypted Firestore**: All data transmitted and stored securely
- **Audit logging**: All widget configuration changes logged

## Performance Considerations

### 1. Lazy Loading
- Chart components loaded on-demand
- Data fetched only when needed
- Widget configurations cached

### 2. Batching
- Multiple data sources fetched in parallel
- Firestore writes batched when possible
- Local storage used for fast cache

### 3. Optimization
- React.memo prevents unnecessary re-renders
- useMemo for expensive calculations
- useCallback for stable function references

## Troubleshooting Storage Issues

### Common Problems
1. **Widgets not saving**: Check Firestore permissions
2. **Wrong data showing**: Verify role and filters
3. **Performance issues**: Check data source complexity
4. **Lost configurations**: Check localStorage fallback

### Debug Tools
```javascript
// Check stored widget configuration
console.log(localStorage.getItem('wdg_student_dashboard_overview_student'));

// Check Firestore permissions
firebase.firestore().collection('users').doc(userId).get()
  .then(doc => console.log('Firestore data:', doc.data()));

// Monitor data fetching
logger.log('[WidgetSystem] Data sources:', dataSources);
logger.log('[WidgetSystem] Filters applied:', globalFilters);
```

This storage system ensures that widget configurations are persistent, secure, and performant while maintaining proper data access controls based on user roles.
