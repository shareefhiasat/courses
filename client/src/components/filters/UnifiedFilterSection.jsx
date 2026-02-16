import React from 'react';
import StatsBar from './StatsBar';
import StatusFilterChips from './StatusFilterChips';
import DifficultyFilterChips from './DifficultyFilterChips';
import PerformanceFilterChips from './PerformanceFilterChips';
import ToggleFilterChips from './ToggleFilterChips';
import HierarchyFilters from './HierarchyFilters';

/**
 * Unified Filter Section Component
 * Centralized filtering UI used across HomePage, StudentDashboard, and ReviewResultsPage
 * 
 * @param {Object} props
 * @param {Object} props.stats - Statistics object to display
 * @param {string} props.searchTerm - Current search term
 * @param {Function} props.setSearchTerm - Search term setter
 * @param {string} props.searchPlaceholder - Placeholder for search input
 * @param {boolean} props.completedFilter - Completed filter state
 * @param {Function} props.setCompletedFilter - Completed filter setter
 * @param {boolean} props.pendingFilter - Pending filter state
 * @param {Function} props.setPendingFilter - Pending filter setter
 * @param {boolean} props.requiredFilter - Required filter state
 * @param {Function} props.setRequiredFilter - Required filter setter
 * @param {boolean} props.optionalFilter - Optional filter state
 * @param {Function} props.setOptionalFilter - Optional filter setter
 * @param {boolean} props.overdueFilter - Overdue filter state
 * @param {Function} props.setOverdueFilter - Overdue filter setter
 * @param {string} props.difficultyFilter - Difficulty filter state
 * @param {Function} props.setDifficultyFilter - Difficulty filter setter
 * @param {boolean} props.bookmarkFilter - Bookmark filter state
 * @param {Function} props.setBookmarkFilter - Bookmark filter setter
 * @param {boolean} props.featuredFilter - Featured filter state
 * @param {Function} props.setFeaturedFilter - Featured filter setter
 * @param {boolean} props.retakableFilter - Retakable filter state
 * @param {Function} props.setRetakableFilter - Retakable filter setter
 * @param {string} props.gradedFilter - Graded filter state
 * @param {Function} props.setGradedFilter - Graded filter setter
 * @param {Array} props.programs - Programs array
 * @param {Array} props.subjects - Subjects array
 * @param {Array} props.classes - Classes array
 * @param {Array} props.students - Students array
 * @param {string} props.selectedProgram - Selected program
 * @param {Function} props.setSelectedProgram - Selected program setter
 * @param {string} props.selectedSubject - Selected subject
 * @param {Function} props.setSelectedSubject - Selected subject setter
 * @param {string} props.selectedClass - Selected class
 * @param {Function} props.setSelectedClass - Selected class setter
 * @param {string} props.selectedStudent - Selected student
 * @param {Function} props.setSelectedStudent - Selected student setter
 * @param {boolean} props.isMinified - Minified mode
 * @param {string} props.theme - Theme ('light' | 'dark')
 * @param {string} props.lang - Language ('en' | 'ar')
 * @param {Function} props.t - Translation function
 * @param {string} props.primaryColor - Primary color
 * @param {boolean} props.showStatusFilters - Show status filter chips
 * @param {boolean} props.showDifficultyFilters - Show difficulty filter chips
 * @param {boolean} props.showPerformanceFilters - Show performance filter chips (for results pages)
 * @param {boolean} props.showToggleFilters - Show toggle filter chips
 * @param {boolean} props.showHierarchyFilters - Show hierarchy filters
 * @param {Object} props.hierarchyConfig - Configuration for which hierarchy filters to show
 */
const UnifiedFilterSection = ({
  stats,
  searchTerm,
  setSearchTerm,
  searchPlaceholder,
  // Status filters
  completedFilter,
  setCompletedFilter,
  pendingFilter,
  setPendingFilter,
  requiredFilter,
  setRequiredFilter,
  optionalFilter,
  setOptionalFilter,
  overdueFilter,
  setOverdueFilter,
  requiresSubmissionFilter,
  setRequiresSubmissionFilter,
  // Status filter counts
  completedCount = 0,
  pendingCount = 0,
  requiredCount = 0,
  optionalCount = 0,
  overdueCount = 0,
  requiresSubmissionCount = 0,
  // Difficulty filter
  difficultyFilter,
  setDifficultyFilter,
  // Performance filters (for results pages)
  passedFilter,
  setPassedFilter,
  failedFilter,
  setFailedFilter,
  excellentFilter,
  setExcellentFilter,
  // Toggle filters
  bookmarkFilter,
  setBookmarkFilter,
  featuredFilter,
  setFeaturedFilter,
  retakableFilter,
  setRetakableFilter,
  gradedFilter,
  setGradedFilter,
  // Hierarchy filters
  programs = [],
  subjects = [],
  classes = [],
  students = [],
  years = [],
  terms = [],
  selectedProgram,
  setSelectedProgram,
  selectedSubject,
  setSelectedSubject,
  selectedClass,
  setSelectedClass,
  selectedStudent,
  setSelectedStudent,
  selectedYear,
  setSelectedYear,
  selectedTerm,
  setSelectedTerm,
  // UI config
  isMinified = false,
  theme = 'light',
  lang = 'en',
  t = (key) => key,
  primaryColor = '#800020',
  // Visibility config
  showStatusFilters = true,
  showDifficultyFilters = true,
  showPerformanceFilters = false,
  showToggleFilters = true,
  showHierarchyFilters = true,
  hierarchyConfig = {
    showPrograms: true,
    showSubjects: true,
    showClasses: true,
    showStudents: false,
    showYears: false,
    showTerms: false
  },
  toggleConfig = {
    showBookmark: true,
    showFeatured: true,
    showRetakable: true,
    showGraded: true
  }
}) => {
  const isDark = theme === 'dark';

  return (
    <div 
      className="filters-section" 
      style={{
        background: isDark ? '#1a1a1a' : 'white',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative',
        border: isDark ? '1px solid #333' : 'none'
      }}>
      
      {/* Row 1: Stats + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {/* Stats */}
        {stats && (
          <StatsBar
            stats={stats}
            theme={theme}
            primaryColor={primaryColor}
            t={t}
          />
        )}
        
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <input
            type="search"
            placeholder={searchPlaceholder || (t('search') || 'Search...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              border: isDark ? '1px solid #333' : '1px solid #e5e7eb',
              background: isDark ? '#0f172a' : '#fff',
              color: isDark ? '#f8fafc' : '#111',
              borderRadius: 8,
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Row 2: Status Filter Chips */}
      {showStatusFilters && (
        <div style={{ marginBottom: '0.75rem' }}>
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
          requiresSubmissionFilter={requiresSubmissionFilter}
          setRequiresSubmissionFilter={setRequiresSubmissionFilter}
          completedCount={completedCount}
          pendingCount={pendingCount}
          requiredCount={requiredCount}
          optionalCount={optionalCount}
          overdueCount={overdueCount}
          requiresSubmissionCount={requiresSubmissionCount}
          isMinified={isMinified}
          theme={theme}
          lang={lang}
          t={t}
        />
        </div>
      )}

      {/* Row 3: Performance Filter Chips */}
      {showPerformanceFilters && (
        <div style={{ marginBottom: '0.75rem' }}>
          <PerformanceFilterChips
            passedFilter={passedFilter}
            setPassedFilter={setPassedFilter}
            failedFilter={failedFilter}
            setFailedFilter={setFailedFilter}
            excellentFilter={excellentFilter}
            setExcellentFilter={setExcellentFilter}
            isMinified={isMinified}
            theme={theme}
            t={t}
        />
        </div>
      )}

      {/* Row 4: Difficulty + Hierarchy + Toggle Filters */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div className="filter-container filter-row" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Difficulty chips */}
        {showDifficultyFilters && (
          <DifficultyFilterChips
            difficultyFilter={difficultyFilter}
            setDifficultyFilter={setDifficultyFilter}
            isMinified={isMinified}
            theme={theme}
            primaryColor={primaryColor}
            t={t}
          />
        )}

        {/* Toggle filters */}
        {showToggleFilters && (
          <ToggleFilterChips
            bookmarkFilter={bookmarkFilter}
            setBookmarkFilter={setBookmarkFilter}
            featuredFilter={featuredFilter}
            setFeaturedFilter={setFeaturedFilter}
            retakableFilter={retakableFilter}
            setRetakableFilter={setRetakableFilter}
            gradedFilter={gradedFilter}
            setGradedFilter={setGradedFilter}
            isMinified={isMinified}
            theme={theme}
            lang={lang}
            t={t}
            {...toggleConfig}
          />
        )}
      </div>
      </div>

      {/* Row 5: Hierarchy Dropdowns (separate row for proper height) */}
      {showHierarchyFilters && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div className="filter-container filter-row" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
            {...hierarchyConfig}
          />
          </div>
        </div>
      )}

      {/* Row 6: Year and Term filters (separate row for better spacing) */}
      {(hierarchyConfig?.showYears || hierarchyConfig?.showTerms) && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div className="filter-container filter-row" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <HierarchyFilters
            years={years}
            terms={terms}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedTerm={selectedTerm}
            setSelectedTerm={setSelectedTerm}
            theme={theme}
            lang={lang}
            t={t}
            showPrograms={false}
            showSubjects={false}
            showClasses={false}
            showStudents={false}
            showYears={hierarchyConfig?.showYears}
            showTerms={hierarchyConfig?.showTerms}
          />
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedFilterSection;
