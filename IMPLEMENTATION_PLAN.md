# UI/UX Improvements Implementation Plan

## Priority 1: Critical Fixes (Immediate)
- [x] Fix ManageEnrollments duplicate key error
- [ ] Add role selector to Users page (image 1)
- [ ] Redesign Dashboard tabs with modern grouping (image 3)
- [ ] Fix Student Profile layout (images 10-11)

## Priority 2: Feature Additions (High)
- [ ] Add student submission interface (image 2)
- [ ] Add dashboard widgets/KPI cards (images 5-7, 12-15)
- [ ] Enhance Analytics with comprehensive stats (image 9)

## Priority 3: Advanced Features (Medium)
- [ ] Dynamic metrics builder with drag-and-drop (ClickUp-style)
- [ ] Live charts and filters
- [ ] Conditional formatting

## Detailed Tasks

### 1. Users Page - Role Selector
**File**: `DashboardPage.jsx` (users tab)
**Changes**:
- Add role dropdown (Student, Instructor, HR, Admin, Super Admin)
- Update user creation form to include role selection
- Add visual role badges in user list

### 2. Dashboard Tabs Grouping
**File**: `DashboardPage.jsx`
**Changes**:
- Group tabs into categories: MAIN, CONTENT, USERS, COMMUNICATION, SETTINGS
- Use modern tab design with icons
- Collapsible groups for better organization

### 3. Student Submissions Interface
**File**: Create `StudentSubmissionsPage.jsx`
**Changes**:
- Student-facing submission page
- Upload interface for assignments
- View submission history
- Status tracking

### 4. Analytics Enhancement
**File**: `AnalyticsPage.jsx`
**Changes**:
- Add charts (attendance trends, performance by class)
- Student performance summary cards
- Export functionality
- Date range filters

### 5. Student Profile Redesign
**File**: `StudentProfilePage.jsx` (already improved)
**Additional**:
- Add charts for attendance trends
- Performance graphs
- Export PDF functionality

### 6. Dashboard Widgets
**File**: Create `DashboardWidgets.jsx` component
**Features**:
- KPI cards (total students, attendance rate, pending submissions)
- Quick stats
- Recent activity feed
- Upcoming deadlines

### 7. Dynamic Metrics Builder
**File**: Create `MetricsBuilder.jsx`
**Features**:
- Drag-and-drop interface using `@dnd-kit/core`
- Custom metric cards
- Filters and conditions
- Save custom dashboards
