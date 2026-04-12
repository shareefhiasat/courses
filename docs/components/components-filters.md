# Centralized Filter Components

This directory contains reusable filter components that eliminate code duplication across HomePage, StudentDashboard, and ReviewResultsPage.

## Components

### 1. UnifiedFilterSection
The main component that combines all filter elements into a single, configurable section.

**Usage:**
```jsx
import { UnifiedFilterSection } from '@/components/filters';

<UnifiedFilterSection
  stats={stats}
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
  searchPlaceholder="Search activities..."
  
  // Status filters (for HomePage/StudentDashboard)
  completedFilter={completedFilter}
  setCompletedFilter={setCompletedFilter}
  pendingFilter={pendingFilter}
  setPendingFilter={setPendingFilter}
  requiredFilter={requiredFilter}
  setRequiredFilter={setRequiredFilter}
  optionalFilter={optionalFilter}
  setOptionalFilter={setOptionalFilter}
  overdueFilter={overdueFilter}
  setOverdueFilter={setOverdueFilter}
  
  // Performance filters (for ReviewResultsPage)
  passedFilter={passedFilter}
  setPassedFilter={setPassedFilter}
  failedFilter={failedFilter}
  setFailedFilter={setFailedFilter}
  excellentFilter={excellentFilter}
  setExcellentFilter={setExcellentFilter}
  
  // Difficulty filter
  difficultyFilter={difficultyFilter}
  setDifficultyFilter={setDifficultyFilter}
  
  // Toggle filters
  bookmarkFilter={bookmarkFilter}
  setBookmarkFilter={setBookmarkFilter}
  featuredFilter={featuredFilter}
  setFeaturedFilter={setFeaturedFilter}
  retakableFilter={retakableFilter}
  setRetakableFilter={setRetakableFilter}
  gradedFilter={gradedFilter}
  setGradedFilter={setGradedFilter}
  
  // Hierarchy filters
  programs={programs}
  subjects={subjects}
  classes={classes}
  students={students}
  selectedProgram={selectedProgram}
  setSelectedProgram={setSelectedProgram}
  selectedSubject={selectedSubject}
  setSelectedSubject={setSelectedSubject}
  selectedClass={selectedClass}
  setSelectedClass={setSelectedClass}
  selectedStudent={selectedStudent}
  setSelectedStudent={setSelectedStudent}
  
  // UI config
  isMinified={isMinified}
  theme={theme}
  lang={lang}
  t={t}
  primaryColor={primaryColor}
  
  // Visibility config
  showStatusFilters={true}
  showDifficultyFilters={true}
  showPerformanceFilters={false}
  showToggleFilters={true}
  showHierarchyFilters={true}
  hierarchyConfig={{
    showPrograms: true,
    showSubjects: true,
    showClasses: true,
    showStudents: false
  }}
  toggleConfig={{
    showBookmark: true,
    showFeatured: true,
    showRetakable: true,
    showGraded: true
  }}
/>
```

### 2. StatsBar
Displays compact statistics with icons and counts.

**Usage:**
```jsx
import { StatsBar } from '@/components/filters';

<StatsBar
  stats={{
    total: 10,
    completed: 5,
    pending: 3,
    overdue: 2,
    passed: 7,
    failed: 3,
    excellent: 2,
    average: 75
  }}
  theme={theme}
  primaryColor={primaryColor}
  t={t}
/>
```

### 3. StatusFilterChips
Status filter chips for Completed, Pending, Required, Optional, Overdue.

**Usage:**
```jsx
import { StatusFilterChips } from '@/components/filters';

<StatusFilterChips
  completedFilter={completedFilter}
  setCompletedFilter={setCompletedFilter}
  pendingFilter={pendingFilter}
  setPendingFilter={setPendingFilter}
  requiredFilter={requiredFilter}
  setRequiredFilter={setRequiredFilter}
  optionalFilter={optionalFilter}
  setOptionalFilter={setOptionalFilter}
  overdueFilter={overdueFilter}
  setOverdueFilter={setOverdueFilter}
  isMinified={false}
  theme={theme}
  lang={lang}
  t={t}
/>
```

### 4. DifficultyFilterChips
Difficulty level filter chips (All Levels, Beginner, Intermediate, Advanced).

**Usage:**
```jsx
import { DifficultyFilterChips } from '@/components/filters';

<DifficultyFilterChips
  difficultyFilter={difficultyFilter}
  setDifficultyFilter={setDifficultyFilter}
  isMinified={false}
  theme={theme}
  primaryColor={primaryColor}
  t={t}
/>
```

### 5. PerformanceFilterChips
Performance filter chips for Passed, Failed, Excellent (used in results pages).

**Usage:**
```jsx
import { PerformanceFilterChips } from '@/components/filters';

<PerformanceFilterChips
  passedFilter={passedFilter}
  setPassedFilter={setPassedFilter}
  failedFilter={failedFilter}
  setFailedFilter={setFailedFilter}
  excellentFilter={excellentFilter}
  setExcellentFilter={setExcellentFilter}
  isMinified={false}
  theme={theme}
  t={t}
/>
```

### 6. ToggleFilterChips
Toggle filter chips for Bookmark, Featured, Retakable, Graded.

**Usage:**
```jsx
import { ToggleFilterChips } from '@/components/filters';

<ToggleFilterChips
  bookmarkFilter={bookmarkFilter}
  setBookmarkFilter={setBookmarkFilter}
  featuredFilter={featuredFilter}
  setFeaturedFilter={setFeaturedFilter}
  retakableFilter={retakableFilter}
  setRetakableFilter={setRetakableFilter}
  gradedFilter={gradedFilter}
  setGradedFilter={setGradedFilter}
  isMinified={false}
  theme={theme}
  lang={lang}
  t={t}
  showBookmark={true}
  showFeatured={true}
  showRetakable={true}
  showGraded={true}
/>
```

### 7. HierarchyFilters
Dropdown filters for Program, Subject, Class, Student hierarchy.

**Usage:**
```jsx
import { HierarchyFilters } from '@/components/filters';

<HierarchyFilters
  programs={programs}
  subjects={subjects}
  classes={classes}
  students={students}
  selectedProgram={selectedProgram}
  setSelectedProgram={setSelectedProgram}
  selectedSubject={selectedSubject}
  setSelectedSubject={setSelectedSubject}
  selectedClass={selectedClass}
  setSelectedClass={setSelectedClass}
  selectedStudent={selectedStudent}
  setSelectedStudent={setSelectedStudent}
  theme={theme}
  lang={lang}
  t={t}
  showPrograms={true}
  showSubjects={true}
  showClasses={true}
  showStudents={false}
/>
```

## Configuration Examples

### HomePage Configuration
```jsx
<UnifiedFilterSection
  showStatusFilters={true}
  showDifficultyFilters={true}
  showPerformanceFilters={false}
  showToggleFilters={true}
  showHierarchyFilters={false}
  hierarchyConfig={{
    showPrograms: false,
    showSubjects: false,
    showClasses: false,
    showStudents: false
  }}
  toggleConfig={{
    showBookmark: true,
    showFeatured: true,
    showRetakable: true,
    showGraded: true
  }}
/>
```

### ReviewResultsPage Configuration
```jsx
<UnifiedFilterSection
  showStatusFilters={false}
  showDifficultyFilters={true}
  showPerformanceFilters={true}
  showToggleFilters={false}
  showHierarchyFilters={true}
  hierarchyConfig={{
    showPrograms: true,
    showSubjects: true,
    showClasses: true,
    showStudents: true
  }}
/>
```

### StudentDashboard Configuration
```jsx
<UnifiedFilterSection
  showStatusFilters={true}
  showDifficultyFilters={true}
  showPerformanceFilters={false}
  showToggleFilters={true}
  showHierarchyFilters={true}
  hierarchyConfig={{
    showPrograms: true,
    showSubjects: true,
    showClasses: true,
    showStudents: false
  }}
  toggleConfig={{
    showBookmark: true,
    showFeatured: true,
    showRetakable: false,
    showGraded: false
  }}
/>
```

## Benefits

1. **Single Source of Truth**: All filter UI logic is centralized
2. **Consistency**: Same look and feel across all pages
3. **Maintainability**: Changes in one place affect all pages
4. **Flexibility**: Highly configurable to show/hide specific filters
5. **Reusability**: Easy to add filters to new pages
6. **Performance**: Optimized with proper memoization
7. **Accessibility**: Consistent keyboard navigation and ARIA labels

## Styling

All components use inline styles for maximum portability and theme support. They automatically adapt to:
- Light/Dark theme
- RTL/LTR languages
- Minified/Full view modes
- Primary color customization

## Future Enhancements

- Add animation transitions for filter chips
- Add keyboard shortcuts for common filters
- Add filter presets (save/load filter combinations)
- Add filter history (undo/redo)
- Add export filter state to URL params
