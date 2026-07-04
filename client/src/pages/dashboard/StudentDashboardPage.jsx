import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect, useRef } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast } from '@ui';
import { useGlobalLoading, GlobalLoadingFallback } from '@contexts/GlobalLoadingContext';
import { Container, Button, Select, UserSelect, Tabs } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { ROLE_STRINGS } from '@constants';
import ProgramsSelect from '@ui/Select/ProgramsSelect';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { getUsers, getUserById } from '@services/business/userService';

import useStudentDashboardPermissions from '@hooks/useStudentDashboardPermissions';
import useStudentDashboardFilters from '@hooks/useStudentDashboardFilters';
import useStudentDashboardData from '@hooks/useStudentDashboardData';
import useClassLevelMetrics from '@hooks/useClassLevelMetrics';
import useDashboardAnalytics from '@hooks/useDashboardAnalytics';
import usePersistentState from '@hooks/usePersistentState';
import DashboardAnalyticsPanel from '@components/analytics/DashboardAnalyticsPanel';
import AttendanceAnalyticsPanel from '@components/analytics/AttendanceAnalyticsPanel';
import CollapsibleSection from '@components/scheduling/CollapsibleSection';
import { ClipboardList, HardDrive, GitBranch, Activity } from 'lucide-react';

import {
  STUDENT_ATTENDANCE_DEFAULT_WIDGETS,
  STUDENT_ATTENDANCE_STORAGE_KEY,
  STUDENT_ATTENDANCE_MAX_WIDGETS,
  buildStudentPerformanceRawData,
} from '@constants/studentPerformanceWidgets';

import {
  DRIVE_ANALYTICS_DEFAULT_WIDGETS,
  DRIVE_ANALYTICS_MAX_WIDGETS,
  WORKFLOW_ANALYTICS_DEFAULT_WIDGETS,
  WORKFLOW_ANALYTICS_MAX_WIDGETS,
  ACTIVITY_ANALYTICS_DEFAULT_WIDGETS,
  ACTIVITY_ANALYTICS_MAX_WIDGETS,
} from '@constants/dashboardAnalyticsWidgets';

import {
  OverviewTab,
  MarksTab,
  ClassTab,
} from '@components/student-dashboard';
import AttendanceTab from '@components/student-dashboard/attendance/AttendanceTab';
import styles from './StudentDashboardPage.module.css';

export default function StudentDashboardPage() {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  const userSelectRef = useRef(null);

  const [activeTab, setActiveTab] = usePersistentState('sd_active_tab', 'overview');

  // ── Guided Tour ────────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = `studentDashboardTourSeen_${lang}`;

  // All candidate steps — filtered at start time to only visible DOM nodes
  const buildTourSteps = useCallback(() => {
    const allSteps = [
      { target: '[data-tour="student-filters"]',              content: t('tour.student_filters'),              disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="student-tabs"]',                 content: t('tour.student_tabs'),                 disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="student-overview"]',             content: t('tour.student_overview'),             disableBeacon: true, placement: 'top' },
      { target: '[data-tour="student-marks"]',                content: t('tour.student_marks'),                disableBeacon: true, placement: 'top' },
      { target: '[data-tour="student-class-tab"]',            content: t('tour.student_class_tab'),            disableBeacon: true, placement: 'top' },
      { target: '[data-tour="student-attendance-analytics"]', content: t('tour.student_attendance_analytics'), disableBeacon: true, placement: 'top' },
      { target: '[data-tour="student-drive-analytics"]',      content: t('tour.student_drive_analytics'),      disableBeacon: true, placement: 'top' },
    ];
    return allSteps.filter(s => !!document.querySelector(s.target));
  }, [t]);

  const startTour = useCallback(() => {
    const steps = buildTourSteps();
    if (steps.length === 0) return;
    setTourSteps(steps);
    setRunTour(true);
  }, [buildTourSteps]);

  useEffect(() => {
    window.addEventListener('app:joyride', startTour);
    window.addEventListener('app:help', startTour);
    return () => { window.removeEventListener('app:joyride', startTour); window.removeEventListener('app:help', startTour); };
  }, [startTour]);

  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') {
      setRunTour(false);
      try { localStorage.setItem(tourSeenKey, 'true'); } catch {}
    }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);
  // ──────────────────────────────────────────────────────────────────────────

  const permissions = useStudentDashboardPermissions();
  const filters = useStudentDashboardFilters({ isStaff: permissions.isStaff });

  // ─── Resolve display student ───────────────────────────────────────────────
  const displayStudentId = useMemo(
    () => permissions.resolveDisplayStudentId(user?.uid, filters.selectedStudentId),
    [permissions, user?.uid, filters.selectedStudentId]
  );

  const displayName = useMemo(() => {
    if (permissions.isStaff && filters.selectedStudentId) {
      const found = filters.filteredStudents.find(s => (s.id || s.uid) === filters.selectedStudentId);
      return found?.displayName || t('student');
    }
    return userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || t('student');
  }, [permissions.isStaff, filters.selectedStudentId, filters.filteredStudents, userProfile, user, t]);

  // ─── Data hooks with proper conditional loading ────────────────────────────────
  const dashData = useStudentDashboardData(
    permissions.isStaff && !filters.hasSelection ? null : displayStudentId, 
    filters.hasSelection,
    permissions.isStaff && !filters.selectedStudentId && filters.selectedClassId ? filters.selectedClassId : null,
    filters.selectedProgramId !== 'all' ? filters.selectedProgramId : null
  );

  // Class-level metrics for staff when a class is selected
  const classMetrics = useClassLevelMetrics(
    permissions.isStaff && filters.selectedClassId && filters.selectedClassId !== 'all' 
      ? filters.selectedClassId 
      : null,
    permissions.isStaff
  );
  const analyticsHook = useDashboardAnalytics(
    permissions.isStaff && filters.selectedClassId && filters.selectedClassId !== 'all'
      ? filters.selectedClassId
      : null
  );

  // Load all users for UserSelect (like enrollment page pattern)
  const [allUsers, setAllUsers] = useState([]);
  const [detailedStudent, setDetailedStudent] = useState(null);
  
  useEffect(() => {
    const loadAllUsers = async () => {
      if (!permissions.isStaff) return;
      try {
        const result = await getUsers({ limit: 100 });
        if (result.success) {
          setAllUsers(result.data || []);
        }
      } catch (error) {
        error('[StudentDashboardPage] Error loading users:', error);
      }
    };
    loadAllUsers();
  }, [permissions.isStaff]);

  // Students to display in dropdown - exclude current user
  const studentUsers = useMemo(() => {
    return allUsers.filter(u => u.email !== user?.email);
  }, [allUsers, user?.email]);

  // ─── Resolve selected student object for profile panel ────────────────────
  const selectedStudentBase = useMemo(() => {
    if (permissions.isStaff && filters.selectedStudentId) {
      const matchId = String(filters.selectedStudentId);
      const found = studentUsers.find(s =>
        String(s.docId) === matchId ||
        String(s.id) === matchId ||
        String(s.uid) === matchId
      ) || filters.filteredStudents.find(s =>
        String(s.docId) === matchId ||
        String(s.id) === matchId ||
        String(s.uid) === matchId
      );
      if (found) return found;
    }
    // For non-staff or when no student is selected, show own profile
    return userProfile || user || null;
  }, [permissions.isStaff, filters.selectedStudentId, studentUsers, filters.filteredStudents, userProfile, user]);

  // Fetch detailed user data (includes phoneNumber, images, etc.) when a student is selected
  useEffect(() => {
    if (!permissions.isStaff || !filters.selectedStudentId) { setDetailedStudent(null); return; }
    let cancelled = false;
    const fetchDetail = async () => {
      try {
        const id = filters.selectedStudentId;
        const res = await getUserById(id);
        if (!cancelled && res.success && res.data) {
          setDetailedStudent(res.data);
        }
      } catch (err) {
        error('[StudentDashboardPage] Error loading student detail:', err);
      }
    };
    fetchDetail();
    return () => { cancelled = true; };
  }, [permissions.isStaff, filters.selectedStudentId]);

  // Merge detailed student data (with phoneNumber etc.) over the base list data
  const selectedStudent = useMemo(() => {
    if (!selectedStudentBase) return null;
    if (detailedStudent) {
      return { ...selectedStudentBase, ...detailedStudent };
    }
    return selectedStudentBase;
  }, [selectedStudentBase, detailedStudent]);

  // ─── Selection prompt state (needed early for debugging) ─────────────────────
  const showSelectionPrompt = permissions.isStaff && !filters.hasSelection;

  // Auto-start tour on first visit — wait until data is loaded so DOM targets exist
  useEffect(() => {
    if (dashData.loading || showSelectionPrompt) return;
    try { if (!localStorage.getItem(tourSeenKey)) startTour(); } catch {}
  }, [tourSeenKey, startTour, dashData.loading, showSelectionPrompt]);

  // Debug logging for data flow
  useEffect(() => {
    info('[StudentDashboardPage] Dashboard state:', {
      authLoading,
      user: user?.uid,
      userProfile: userProfile?.displayName,
      isStaff: permissions.isStaff,
      hasSelection: filters.hasSelection,
      selectedProgramId: filters.selectedProgramId,
      selectedSubjectId: filters.selectedSubjectId,
      selectedClassId: filters.selectedClassId,
      selectedStudentId: filters.selectedStudentId,
      displayStudentId,
      showSelectionPrompt,
      dashDataLoading: dashData.loading,
      enrollmentsCount: dashData.enrollments?.length || 0,
      attendanceCount: dashData.attendance?.length || 0,
      penaltiesCount: dashData.penalties?.length || 0,
      behaviorsCount: dashData.behaviors?.length || 0,
      studentsAvailable: filters.students.length,
      filteredStudentsCount: filters.filteredStudents.length,
      studentUsersCount: studentUsers.length
    });
  }, [authLoading, user, userProfile, permissions.isStaff, filters.hasSelection, 
      filters.selectedProgramId, filters.selectedSubjectId, filters.selectedClassId, 
      filters.selectedStudentId, displayStudentId, showSelectionPrompt, dashData.loading, 
      dashData.enrollments?.length, dashData.attendance?.length, dashData.penalties?.length, 
      dashData.behaviors?.length, filters.students.length, filters.filteredStudents.length, studentUsers.length]);

  // Debug: Log tab changes
  useEffect(() => {
    info('[StudentDashboardPage] Tab state:', {
      activeTab,
      showSelectionPrompt,
      dashDataLoading: dashData.loading,
      dashDataError: dashData.error,
      classMetricsLoading: classMetrics.loading,
      classMetricsError: classMetrics.error
    });
  }, [activeTab, showSelectionPrompt, dashData.loading, dashData.error, classMetrics.loading, classMetrics.error]);

  // ─── Global loading ────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (authLoading || !user) return;
    let stopped = false;
    const stopGlobal = startLoading();
    const safeStop = () => { if (!stopped) { stopped = true; stopGlobal(); } };
    if (!dashData.loading) { safeStop(); return; }
    const timer = setTimeout(safeStop, 8000);
    return () => { clearTimeout(timer); safeStop(); };
  }, [authLoading, user, dashData.loading, startLoading]);

  // ─── Memoized select options
  const studentOptions = useMemo(() => [
    { value: '', label: t('filters.select_student') },
    ...filters.filteredStudents.map(s => ({ value: s.id || s.uid, label: s.displayName || s.email || '' })),
  ], [filters.filteredStudents, lang, t]);

  // ─── Analytics panel summaries (replace 'Ready' with actual stats) ─────────
  const driveSummary = useMemo(() => {
    if (analyticsHook.loading || !analyticsHook.data?.drive?.overview) return '…';
    const o = analyticsHook.data.drive.overview;
    const parts = [];
    if (o.totalFiles != null) parts.push(`${o.totalFiles} ${t('files') || 'files'}`);
    if (o.totalFolders != null) parts.push(`${o.totalFolders} ${t('folders') || 'folders'}`);
    if (o.totalActivities != null) parts.push(`${o.totalActivities} ${t('activities') || 'activities'}`);
    return parts.join(' · ') || '—';
  }, [analyticsHook, t]);

  const workflowSummary = useMemo(() => {
    if (analyticsHook.loading || !analyticsHook.data?.workflow?.overview) return '…';
    const o = analyticsHook.data.workflow.overview;
    const parts = [];
    if (o.totalDocuments != null) parts.push(`${o.totalDocuments} ${t('documents') || 'documents'}`);
    if (o.approvedCount != null) parts.push(`${o.approvedCount} ${t('approved') || 'approved'}`);
    if (o.pendingCount != null) parts.push(`${o.pendingCount} ${t('pending') || 'pending'}`);
    return parts.join(' · ') || '—';
  }, [analyticsHook, t]);

  // Context-aware records title
  const recordsTitle = useMemo(() => {
    if (filters.selectedStudentId) return t('student_records');
    if (filters.selectedClassId && filters.selectedClassId !== 'all') return t('class_records');
    return t('records');
  }, [filters.selectedStudentId, filters.selectedClassId, t]);

  const activitySummary = useMemo(() => {
    if (analyticsHook.loading || !analyticsHook.data?.activity?.overview) return '…';
    const o = analyticsHook.data.activity.overview;
    const parts = [];
    if (o.totalActivities != null) parts.push(`${o.totalActivities} ${t('activities') || 'activities'}`);
    if (o.totalSubmissions != null) parts.push(`${o.totalSubmissions} ${t('submissions') || 'submissions'}`);
    if (o.totalResources != null) parts.push(`${o.totalResources} ${t('resources') || 'resources'}`);
    return parts.join(' · ') || '—';
  }, [analyticsHook, t]);

  // ─── Memoized tabs configuration (Performance optimization) ─────────────────────
  const dashTabs = useMemo(() => {
    const tabs = [
      { value: 'overview',      label: t('dashboard.overview') },
      { value: 'attendance',    label: t('tab_attendance_analytics') },
      { value: 'activity',      label: t('tab_activity') },
    ];
    
    // Class tab for staff; Marks tab is always last
    if (permissions.isStaff) {
      tabs.push({ value: 'class', label: lang === 'ar' ? 'تحليلات الفصل' : 'Class' });
    }
    tabs.push({ value: 'marks', label: t('dashboard.marks') });
    
    return tabs;
  }, [lang, t, permissions.isStaff]);

  if (authLoading) return <GlobalLoadingFallback />;

  return (
    <div className={styles.dashboard}>
      <Joyride
        continuous
        run={runTour}
        steps={tourSteps}
        disableScrolling={false}
        scrollOffset={100}
        scrollToFirstStep
        showSkipButton
        showProgress
        tooltipComponent={TourTooltipComponent}
        spotlightClicks={false}
        callback={handleTourCallback}
        locale={{
          back: t('tour_back'),
          close: t('tour_close'),
          last: t('tour_finish'),
          next: t('tour_next'),
          skip: t('tour_skip'),
        }}
        styles={{
          options: {
            primaryColor: 'var(--color-primary, #800020)',
            textColor: theme === 'dark' ? '#e5e7eb' : '#000',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
            overlayColor: 'rgba(0,0,0,0.5)',
            arrowColor: theme === 'dark' ? '#1f2937' : '#fff',
            zIndex: 10000,
          },
        }}
      />
      <Container maxWidth="xxl">

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerTitle}>
              {/* Empty header - no username display */}
            </div>
            <div className={styles.headerActions}>
              
            </div>
          </div>

          {/* ── Cascading filters for staff ── */}
          {permissions.isStaff && (
            <div className={styles.filters} data-tour="student-filters">
              <ProgramsSelect
                programs={filters.programs}
                subjects={filters.subjects}
                classes={filters.classes}
                selectedProgram={filters.selectedProgramId}
                selectedSubject={filters.selectedSubjectId}
                selectedClass={filters.selectedClassId}
                onProgramChange={filters.setSelectedProgramId}
                onSubjectChange={filters.setSelectedSubjectId}
                onClassChange={filters.setSelectedClassId}
                showLabels={false}
                className="w-full"
              />
              {(() => {
                info('[StudentDashboardPage] UserSelect props:', {
                  studentUsersCount: studentUsers.length,
                  filteredStudentsCount: filters.filteredStudents.length,
                  dashDataEnrollmentsCount: dashData.enrollments?.length || 0,
                  dashDataEnrollmentsSample: (dashData.enrollments || []).slice(0, 3).map(e => ({
                    userId: e.userId,
                    classId: e.classId,
                    id: e.id,
                  })),
                  selectedClassId: filters.selectedClassId,
                  selectedStudentId: filters.selectedStudentId,
                  isClassMode: !displayStudentId && filters.selectedClassId,
                  studentUsersSample: studentUsers.slice(0, 3).map(u => ({
                    id: u.id,
                    docId: u.docId,
                    email: u.email,
                  })),
                });
                return null;
              })()}
              <UserSelect
                ref={userSelectRef}
                users={studentUsers}
                enrollments={dashData.enrollments}
                classes={filters.classes}
                value={filters.selectedStudentId}
                onChange={filters.setSelectedStudentId}
                placeholder={t('filters.select_student')}
                roleFilter={[ROLE_STRINGS.STUDENT]}
                includeAll={false}
                showEnrollments={!filters.selectedClassId || filters.selectedClassId === 'all'}
                searchable
                fullWidth
                disabled={filters.loading}
              />
            </div>
          )}
        </div>

        {/* ── Enhanced Stats summary bar (Class-level or Student-level) ── */}

        {/* ── Error state ── */}
        {(dashData.error || classMetrics.error) && (
          <div className={styles.errorState}>
            {getThemedIcon('ui', 'alert_triangle', 48, theme)}
            <h3>{t('dashboard.error_loading_data')}</h3>
            <p>{dashData.error?.message || classMetrics.error?.message}</p>
            <Button onClick={() => {
              dashData.reload?.();
              classMetrics.reload?.();
            }}>
              {t('common.retry')}
            </Button>
          </div>
        )}

        {/* ── Selection prompt ── */}
        {showSelectionPrompt && !dashData.error && !classMetrics.error && (
          <div className={styles.selectionPrompt}>
            {getThemedIcon('ui', 'users', 32, theme)}
            <p>{t('dashboard.select_class_or_student_to_view_data')}</p>
          </div>
        )}

        {/* ── Loading state (no skeleton) ── */}
        {(dashData.loading || classMetrics.loading) && !showSelectionPrompt && (
          <div className={styles.loadingState}>
            <p>{t('common.loading')}</p>
          </div>
        )}

        {/* ── Tabs + content (only when data is available) ── */}
        {!showSelectionPrompt && !dashData.loading && !dashData.error && !classMetrics.error && (
          <div className={styles.detailsSection}>
            <div data-tour="student-tabs">
              <Tabs tabs={dashTabs} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            <div style={{ display: 'none' }}>
              <span data-tour="student-tab-overview" />
              <span data-tour="student-tab-attendance" />
              <span data-tour="student-tab-activity" />
              <span data-tour="student-tab-marks" />
            </div>

            <div className={styles.detailContent}>
              {activeTab === 'overview' && (
                <div data-tour="student-overview">
                <OverviewTab
                  semesters={dashData.semesters}
                  enrollments={dashData.enrollments}
                  statsData={dashData.statsData}
                  classMetrics={permissions.isStaff && !filters.selectedStudentId ? classMetrics.metrics : null}
                  grouping={filters.grouping}
                  canViewAllStudents={permissions.canViewAllStudents}
                  onNavigateToClass={classId => navigate(`/classes/${classId}`)}
                  selectedClassId={filters.selectedClassId}
                  selectedStudentId={filters.selectedStudentId}
                  selectedProgramId={filters.selectedProgramId}
                  selectedSubjectId={filters.selectedSubjectId}
                  t={t}
                  lang={lang}
                  dashData={dashData}
                  lookupData={{ programs: filters.programs, subjects: filters.subjects, classes: filters.classes }}
                  isRTL={lang === 'ar'}
                  lastUpdatedAt={Date.now()}
                  studentId={displayStudentId}
                  classId={filters.selectedClassId !== 'all' ? filters.selectedClassId : undefined}
                  attendance={dashData.attendance}
                  participations={dashData.participations}
                  penalties={dashData.penalties}
                  behaviors={dashData.behaviors}
                  canInlineEdit={permissions.canInlineEdit}
                  canDeleteRecords={permissions.canDeleteRecords}
                  onRefresh={dashData.reload}
                  student={selectedStudent}
                  students={studentUsers}
                />
                </div>
              )}
              {activeTab === 'attendance' && (
                <div data-tour="student-attendance-analytics">
                  <CollapsibleSection
                    title={t('attendance')}
                    summary={`${STUDENT_ATTENDANCE_MAX_WIDGETS} ${t('widgets')}`}
                    icon={ClipboardList}
                    defaultOpen={false}
                    testId="attendance-analytics-section"
                    storageKey="sd_attendance_analytics"
                  >
                    <AttendanceAnalyticsPanel
                      rawData={buildStudentPerformanceRawData(
                        dashData,
                        { programs: filters.programs, subjects: filters.subjects, classes: filters.classes },
                        lang === 'ar'
                      )}
                      defaultWidgets={STUDENT_ATTENDANCE_DEFAULT_WIDGETS}
                      storageKey={STUDENT_ATTENDANCE_STORAGE_KEY}
                      maxWidgets={STUDENT_ATTENDANCE_MAX_WIDGETS}
                      widgetCategoryResolver="student"
                      builderCategoryScope="student"
                      onReload={dashData.reload}
                      lastUpdatedAt={Date.now()}
                    />
                  </CollapsibleSection>
                  <CollapsibleSection
                    title={recordsTitle}
                    summary={`${dashData.attendance?.length || 0} ${t('records') || 'records'}`}
                    icon={ClipboardList}
                    defaultOpen={false}
                    testId="attendance-history-section-tab"
                    storageKey="sd_attendance_history_tab"
                  >
                    <AttendanceTab
                      studentId={displayStudentId}
                      classId={filters.selectedClassId !== 'all' ? filters.selectedClassId : undefined}
                      attendance={dashData.attendance}
                      participations={dashData.participations}
                      penalties={dashData.penalties}
                      behaviors={dashData.behaviors}
                      students={studentUsers}
                      canInlineEdit={permissions.canInlineEdit}
                      canDeleteRecords={permissions.canDeleteRecords}
                      onRefresh={dashData.reload}
                      t={t}
                      lang={lang}
                      studentName={displayName}
                    />
                  </CollapsibleSection>
                </div>
              )}
              {activeTab === 'activity' && (
                <div data-tour="student-drive-analytics">
                  <CollapsibleSection
                    title={t('drive')}
                    summary={driveSummary}
                    icon={HardDrive}
                    defaultOpen={false}
                    testId="dashboard-drive-analytics-section"
                    storageKey="sd_drive_analytics"
                  >
                    <DashboardAnalyticsPanel
                      analyticsData={analyticsHook.data}
                      loading={analyticsHook.loading}
                      onReload={analyticsHook.reload}
                      lastUpdatedAt={Date.now()}
                      lockedCategory="drive"
                      storageKeySuffix="_drive"
                      defaultWidgets={DRIVE_ANALYTICS_DEFAULT_WIDGETS}
                      maxWidgets={DRIVE_ANALYTICS_MAX_WIDGETS}
                    />
                  </CollapsibleSection>
                  <CollapsibleSection
                    title={t('workflow')}
                    summary={workflowSummary}
                    icon={GitBranch}
                    defaultOpen={false}
                    testId="dashboard-workflow-analytics-section"
                    storageKey="sd_workflow_analytics"
                  >
                    <DashboardAnalyticsPanel
                      analyticsData={analyticsHook.data}
                      loading={analyticsHook.loading}
                      onReload={analyticsHook.reload}
                      lastUpdatedAt={Date.now()}
                      lockedCategory="workflow"
                      storageKeySuffix="_workflow"
                      defaultWidgets={WORKFLOW_ANALYTICS_DEFAULT_WIDGETS}
                      maxWidgets={WORKFLOW_ANALYTICS_MAX_WIDGETS}
                    />
                  </CollapsibleSection>
                  <CollapsibleSection
                    title={t('activity')}
                    summary={activitySummary}
                    icon={Activity}
                    defaultOpen={false}
                    testId="dashboard-activity-analytics-section"
                    storageKey="sd_activity_analytics"
                  >
                    <DashboardAnalyticsPanel
                      analyticsData={analyticsHook.data}
                      loading={analyticsHook.loading}
                      onReload={analyticsHook.reload}
                      lastUpdatedAt={Date.now()}
                      lockedCategory="activity"
                      storageKeySuffix="_activity"
                      defaultWidgets={ACTIVITY_ANALYTICS_DEFAULT_WIDGETS}
                      maxWidgets={ACTIVITY_ANALYTICS_MAX_WIDGETS}
                    />
                  </CollapsibleSection>
                </div>
              )}
              {activeTab === 'marks' && (
                <div data-tour="student-marks">
                <MarksTab
                  marks={dashData.marks}
                  semesters={dashData.semesters}
                  statsData={dashData.statsData}
                  canNavigateToMarksEntry={permissions.canNavigateToMarksEntry}
                  studentId={displayStudentId}
                  classId={filters.selectedClassId !== 'all' ? filters.selectedClassId : undefined}
                  t={t}
                  lang={lang}
                />
                </div>
              )}
              {activeTab === 'class' && permissions.isStaff && (
                <div data-tour="student-class-tab">
                <ClassTab
                  classId={filters.selectedClassId}
                  classMetrics={classMetrics.metrics}
                  classRawData={classMetrics.rawData}
                  loading={classMetrics.loading}
                  error={classMetrics.error}
                  onReload={classMetrics.reload}
                  selectedProgramId={filters.selectedProgramId}
                  selectedSubjectId={filters.selectedSubjectId}
                  t={t}
                  lang={lang}
                  dashData={dashData}
                  lookupData={{ programs: filters.programs, subjects: filters.subjects, classes: filters.classes }}
                  isRTL={lang === 'ar'}
                  lastUpdatedAt={Date.now()}
                />
                </div>
              )}
            </div>
          </div>
        )}

      </Container>
    </div>
  );
}
