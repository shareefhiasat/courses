import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { usePermissions } from '@hooks/usePermissions';
import { useDataScope } from '@hooks/useDataScope';
import { SimpleLoading, useToast, Card, CardBody } from '@ui';
import schedulingSummaryService from '@services/business/schedulingSummaryService';
import AutoRefreshBar from '@components/scheduling/summary/AutoRefreshBar';
import TimeRangeSelector from '@components/scheduling/summary/TimeRangeSelector';
import ReportFilterBar from '@components/scheduling/summary/ReportFilterBar';
import SchedulingSummaryAnalytics from '@components/scheduling/summary/SchedulingSummaryAnalytics';
import BreakSessionTimeline from '@components/scheduling/summary/BreakSessionTimeline';
import BreakTypeDistributionCard from '@components/scheduling/summary/BreakTypeDistributionCard';
import UpcomingHolidaysList from '@components/scheduling/summary/UpcomingHolidaysList';
import HolidayImpactCard from '@components/scheduling/summary/HolidayImpactCard';
import TeacherEffortSummary from '@components/scheduling/summary/TeacherEffortSummary';
import TeacherSubjectDistribution from '@components/scheduling/summary/TeacherSubjectDistribution';
import TeacherEffortExport from '@components/scheduling/summary/TeacherEffortExport';
import SchedulingOverviewPanel from '@components/scheduling/SchedulingOverviewPanel';
import CollapsibleSection from '@components/scheduling/CollapsibleSection';
import {
  CalendarDays, Coffee, User, DoorOpen, BarChart3, Palmtree, ExternalLink, ClipboardList,
  HardDrive, GitBranch, Activity,
} from 'lucide-react';
import { getAllUsers, getUserRoles } from '@services/business/userService';
import { getAllSubjects } from '@services/business/subjectService';
import { getAllClasses } from '@services/business/classService';
import { getAllPrograms } from '@services/business/programService';
import {
  buildSchedulingOverviewCards,
  buildInstructorOverviewCards,
} from '@utils/schedulingOverviewCards';
import {
  SCHEDULING_SUMMARY_DEFAULT_WIDGETS,
  SCHEDULING_ATTENDANCE_DEFAULT_WIDGETS,
  SCHEDULING_ATTENDANCE_STORAGE_KEY,
  SCHEDULING_ATTENDANCE_MAX_WIDGETS,
  SCHEDULING_BREAKS_HOLIDAYS_DEFAULT_WIDGETS,
  SCHEDULING_BREAKS_HOLIDAYS_STORAGE_KEY,
  SCHEDULING_BREAKS_HOLIDAYS_MAX_WIDGETS,
  buildSchedulingRawData,
} from '@constants/schedulingSummaryWidgets';
import DashboardAnalyticsPanel from '@components/analytics/DashboardAnalyticsPanel';
import AttendanceAnalyticsPanel from '@components/analytics/AttendanceAnalyticsPanel';
import BreaksHolidaysAnalyticsPanel from '@components/analytics/BreaksHolidaysAnalyticsPanel';
import {
  DRIVE_ANALYTICS_DEFAULT_WIDGETS,
  DRIVE_ANALYTICS_MAX_WIDGETS,
  WORKFLOW_ANALYTICS_DEFAULT_WIDGETS,
  WORKFLOW_ANALYTICS_MAX_WIDGETS,
  ACTIVITY_ANALYTICS_DEFAULT_WIDGETS,
  ACTIVITY_ANALYTICS_MAX_WIDGETS,
} from '@constants/dashboardAnalyticsWidgets';
import useDashboardAnalytics from '@hooks/useDashboardAnalytics';
import useStudentDashboardData from '@hooks/useStudentDashboardData';
import usePersistentState from '@hooks/usePersistentState';
import AttendanceTab from '@components/student-dashboard/attendance/AttendanceTab';

const SummaryDashboardPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin, isInstructor } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canAccessScreen, hasPermission, loading: permissionsLoading } = usePermissions();
  const canViewAdvancedAnalytics = hasPermission('advanced-analytics.canView');
  const { scope, filterItems } = useDataScope();

  const prefilterInstructor = searchParams.get('instructorId');
  const isSelfView = isInstructor && !isAdmin && !isHR && !isSuperAdmin;
  const dbUserId = user?.dbId;

  const [dashboardData, setDashboardData] = useState(null);
  const [effortReport, setEffortReport] = useState(null);
  const [teacherEffort, setTeacherEffort] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [accessiblePrograms, setAccessiblePrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [reportFilters, setReportFilters] = usePersistentState('summary_report_filters', {
    programId: '',
    subjectId: '',
    classId: '',
    term: '',
    year: '',
    instructorId: prefilterInstructor || (isSelfView && dbUserId ? String(dbUserId) : ''),
    reportFormat: 'summary',
  });
  const [timeRange, setTimeRange] = usePersistentState('summary_time_range', 'year');
  const [startDate, setStartDate] = usePersistentState('summary_start_date', '');
  const [endDate, setEndDate] = usePersistentState('summary_end_date', '');
  const [refreshInterval, setRefreshInterval] = usePersistentState('summary_refresh_interval', 30000);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(Date.now());
  const analyticsHook = useDashboardAnalytics(null, { enabled: canViewAdvancedAnalytics });
  const recordsClassId = reportFilters.classId || null;
  const recordsHook = useStudentDashboardData(null, Boolean(recordsClassId), recordsClassId, reportFilters.programId || null);

  // ── Guided Tour ────────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = `summaryDashboardTourSeen_${lang}`;

  useEffect(() => {
    setTourSteps([
      { target: '[data-tour="summary-quick-actions"]', content: t('tour.summary_quick_actions'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="summary-auto-refresh"]', content: t('tour.summary_auto_refresh'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="summary-report-filters"]', content: t('tour.summary_report_filters'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="summary-time-range"]', content: t('tour.summary_time_range'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="summary-overview"]', content: t('tour.summary_overview'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="summary-analytics"]', content: t('tour.summary_analytics'), disableBeacon: true, placement: 'top' },
      { target: '[data-tour="summary-breaks"]', content: t('tour.summary_breaks'), disableBeacon: true, placement: 'top' },
      { target: '[data-tour="summary-attendance"]', content: t('tour.summary_attendance'), disableBeacon: true, placement: 'top' },
      { target: '[data-tour="summary-drive-analytics"]', content: t('tour.summary_drive_analytics'), disableBeacon: true, placement: 'top' },
    ]);
  }, [lang, t]);

  useEffect(() => {
    const start = () => setRunTour(true);
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => { window.removeEventListener('app:joyride', start); window.removeEventListener('app:help', start); };
  }, []);

  useEffect(() => {
    try { if (!localStorage.getItem(tourSeenKey)) setRunTour(true); } catch {}
  }, [tourSeenKey]);

  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') {
      setRunTour(false);
      try { localStorage.setItem(tourSeenKey, 'true'); } catch {}
    }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);

  const canView = canAccessScreen('summary-dashboard');
  const canExport = hasPermission('summary-dashboard.canExport');
  const activeInstructorId = isSelfView ? dbUserId : reportFilters.instructorId;
  const isInstructorDetailView = Boolean(activeInstructorId);

  const queryParams = useMemo(() => ({
    programId: reportFilters.programId || undefined,
    subjectId: reportFilters.subjectId || undefined,
    classId: reportFilters.classId || undefined,
    term: reportFilters.term || undefined,
    year: reportFilters.year || undefined,
    instructorId: activeInstructorId || undefined,
    reportFormat: reportFilters.reportFormat || 'summary',
    timeRange,
    startDate: timeRange === 'custom' ? startDate : undefined,
    endDate: timeRange === 'custom' ? endDate : undefined,
  }), [reportFilters, timeRange, startDate, endDate, activeInstructorId]);

  const loadPrograms = useCallback(async () => {
    if (!dbUserId) return;
    try {
      const result = await getAllPrograms();
      if (!result?.success) return;
      let programs = result.data || [];
      if (!scope.unrestricted && !isSuperAdmin && !isHR) {
        if (scope.programIds?.length) {
          const allowed = new Set(scope.programIds.map(Number));
          programs = programs.filter((p) => allowed.has(Number(p.id)));
        } else {
          programs = [];
        }
      }
      setAccessiblePrograms(programs);
    } catch (err) {
      console.error('Error loading programs:', err);
    }
  }, [dbUserId, scope.unrestricted, scope.programIds, isSuperAdmin, isHR]);

  const loadLookupData = useCallback(async () => {
    try {
      const [subjRes, classRes, userRes] = await Promise.all([
        getAllSubjects(),
        getAllClasses(),
        isSelfView ? Promise.resolve(null) : getAllUsers({ excludeStudents: true }),
      ]);

      let subjectList = subjRes?.data || [];
      let classList = classRes?.data || [];
      if (!scope.unrestricted) {
        subjectList = filterItems(subjectList, {
          idField: 'id',
          programField: 'programId',
          subjectField: 'id',
        });
        classList = filterItems(classList, {
          idField: 'id',
          classField: 'id',
          programField: 'programId',
          subjectField: 'subjectId',
        });
      }
      setSubjects(subjectList);
      setClasses(classList);

      if (userRes?.data) {
        const scopedInstructorIds = new Set(
          classList.map((c) => Number(c.instructorId)).filter(Boolean),
        );
        const instructorList = userRes.data.filter((u) => {
          const roles = getUserRoles(u);
          const isInstructorUser = roles.includes('instructor') || roles.includes('INSTRUCTOR');
          if (!isInstructorUser) return false;
          if (scope.unrestricted) return true;
          return scopedInstructorIds.has(Number(u.id)) || scopedInstructorIds.has(Number(u.dbId));
        });
        setInstructors(instructorList);
      }
    } catch (err) {
      console.error('Error loading lookup data:', err);
    }
  }, [isSelfView, scope.unrestricted, filterItems]);

  useEffect(() => {
    if (isSelfView && dbUserId) {
      setReportFilters((f) => ({ ...f, instructorId: String(dbUserId) }));
    }
  }, [isSelfView, dbUserId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [summaryRes, reportRes] = await Promise.all([
        schedulingSummaryService.getSchedulingSummary(queryParams),
        schedulingSummaryService.getEffortReport(queryParams),
      ]);

      if (summaryRes.success) setDashboardData(summaryRes.data);
      else {
        setLoadError(summaryRes.error);
        toast.error(summaryRes.error || t('failed_to_load_dashboard'));
      }

      if (reportRes.success) setEffortReport(reportRes.data);
      else if (!summaryRes.success) setLoadError(reportRes.error);

      if (activeInstructorId) {
        const effortRes = await schedulingSummaryService.getTeacherEffort(activeInstructorId, queryParams);
        if (effortRes.success) setTeacherEffort(effortRes.data);
      } else {
        setTeacherEffort(null);
      }
    } catch (err) {
      setLoadError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
      setLastUpdatedAt(Date.now());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast identity is unstable; queryParams drives reloads
  }, [queryParams, activeInstructorId]);

  useEffect(() => { if (dbUserId) loadPrograms(); }, [dbUserId, loadPrograms]);
  useEffect(() => { loadLookupData(); }, [loadLookupData]);
  useEffect(() => {
    if (canView) loadAll();
  }, [canView, loadAll]);

  useEffect(() => {
    if (prefilterInstructor) {
      setReportFilters((f) => ({ ...f, instructorId: prefilterInstructor }));
    }
  }, [prefilterInstructor]);

  useEffect(() => {
    if (!prefilterInstructor || scope.unrestricted || isSelfView) return;
    const allowed = instructors.some(
      (u) => String(u.id) === prefilterInstructor || String(u.dbId) === prefilterInstructor,
    );
    if (!allowed && instructors.length > 0) {
      setReportFilters((f) => ({ ...f, instructorId: '' }));
      toast.error(t('access_denied'));
    }
  }, [prefilterInstructor, instructors, scope.unrestricted, isSelfView, toast, t]);

  const overviewStats = useMemo(() => {
    const base = dashboardData?.overview || {};
    if (isInstructorDetailView && teacherEffort) {
      return {
        ...base,
        totalSessions: teacherEffort.sessionCount ?? effortReport?.totals?.sessionCount ?? 0,
        teachingHours: teacherEffort.teachingHours ?? 0,
        subjectCount: teacherEffort.subjectCount ?? 0,
        classCount: teacherEffort.classCount ?? 0,
        scheduledCount: teacherEffort.scheduledCount ?? base.scheduledCount,
        completedCount: teacherEffort.completedCount ?? base.completedCount,
        cancelledCount: teacherEffort.cancelledCount ?? base.cancelledCount,
      };
    }
    if (effortReport?.totals) {
      return {
        ...base,
        totalSessions: effortReport.totals.sessionCount ?? base.totalSessions,
      };
    }
    return base;
  }, [dashboardData, effortReport, teacherEffort, isInstructorDetailView]);

  const overviewCards = useMemo(() => {
    if (isInstructorDetailView && teacherEffort) {
      const name = isRTL ? teacherEffort.teacher?.instructorNameAr : teacherEffort.teacher?.instructorName;
      return buildInstructorOverviewCards({
        totalSessions: teacherEffort.sessionCount,
        teachingHours: teacherEffort.teachingHours,
        subjectCount: teacherEffort.subjectCount,
        classCount: teacherEffort.classCount,
        scheduledCount: overviewStats.scheduledCount,
        completedCount: overviewStats.completedCount,
        cancelledCount: overviewStats.cancelledCount,
      }, t, name);
    }
    return buildSchedulingOverviewCards(overviewStats, t);
  }, [isInstructorDetailView, teacherEffort, overviewStats, t, isRTL]);

  // ─── Analytics panel summaries ─────────────────────────────────────────────
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

  const activitySummary = useMemo(() => {
    if (analyticsHook.loading || !analyticsHook.data?.activity?.overview) return '…';
    const o = analyticsHook.data.activity.overview;
    const parts = [];
    if (o.totalActivities != null) parts.push(`${o.totalActivities} ${t('activities') || 'activities'}`);
    if (o.totalSubmissions != null) parts.push(`${o.totalSubmissions} ${t('submissions') || 'submissions'}`);
    if (o.totalResources != null) parts.push(`${o.totalResources} ${t('resources') || 'resources'}`);
    return parts.join(' · ') || '—';
  }, [analyticsHook, t]);

  const handleTimeRangeChange = (patch) => {
    if (patch.timeRange) setTimeRange(patch.timeRange);
    if (patch.startDate !== undefined) setStartDate(patch.startDate);
    if (patch.endDate !== undefined) setEndDate(patch.endDate);
  };

  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const border = theme === 'dark' ? '#374151' : '#e5e7eb';
  const headerButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.35rem 0.65rem',
    fontSize: 'var(--font-size-sm)',
    borderRadius: '6px',
    border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`,
    background: theme === 'dark' ? '#374151' : '#fff',
    color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
  const compactButtonStyle = {
    ...headerButtonStyle,
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    fontSize: 'calc(var(--font-size-sm) * 0.8)',
    whiteSpace: 'normal',
    lineHeight: 1.2,
    maxWidth: '7.5rem',
  };

  const quickActions = (
    <div data-tour="summary-quick-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
      <div data-tour="summary-auto-refresh">
        <AutoRefreshBar
          compact
          showInterval={false}
          showLastUpdated={false}
          onRefresh={loadAll}
          intervalMs={refreshInterval}
          onIntervalChange={setRefreshInterval}
        />
      </div>
      <button type="button" style={headerButtonStyle} onClick={() => window.open('/scheduling-calendar', '_blank')} aria-label={t('schedules_view_schedule')}>
        <CalendarDays size={16} />
        <span>{t('schedules_view_schedule')}</span>
        <ExternalLink size={13} aria-hidden style={{ opacity: 0.65 }} />
      </button>
      <button type="button" style={headerButtonStyle} onClick={() => navigate('/scheduling-calendar')} aria-label={t('manage_breaks_and_holidays')}>
        <Coffee size={16} />
        <span>{t('manage_breaks_and_holidays')}</span>
      </button>
      <button type="button" style={headerButtonStyle} onClick={() => window.open('/instructor-availability', '_blank')} aria-label={t('manage_instructor_availability')}>
        <User size={16} />
        <span>{t('instructors')}</span>
        <ExternalLink size={13} aria-hidden style={{ opacity: 0.65 }} />
      </button>
      <button type="button" style={headerButtonStyle} onClick={() => window.open('/classroom-availability', '_blank')} aria-label={t('manage_room_availability')}>
        <DoorOpen size={16} />
        <span>{t('rooms')}</span>
        <ExternalLink size={13} aria-hidden style={{ opacity: 0.65 }} />
      </button>
      
    </div>
  );

  if (permissionsLoading) {
    return <SimpleLoading />;
  }

  if (!canView) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 500 }}>{t('access_denied')}</div>
        <div style={{ fontSize: 'var(--font-size-sm)', color: muted, marginTop: '0.5rem' }}>{t('dashboard_permission_required')}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }} data-testid="summary-dashboard-page">
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
      }}>
        {quickActions}
      </div>

      <div data-tour="summary-report-filters">
        <ReportFilterBar
          programs={accessiblePrograms}
          subjects={subjects}
          classes={classes}
          instructors={instructors}
          filters={reportFilters}
          onChange={setReportFilters}
          showInstructor={!isSelfView}
          isRTL={isRTL}
          defaultOpen
        />
      </div>

      <div data-tour="summary-time-range">
        <TimeRangeSelector
          timeRange={timeRange}
          startDate={startDate}
          endDate={endDate}
          onChange={handleTimeRangeChange}
          onApply={loadAll}
        />
      </div>

      {loading ? (
        <SimpleLoading />
      ) : loadError ? (
        <div style={{ padding: '1rem', color: '#ef4444' }}>
          <p>{loadError}</p>
        </div>
      ) : (
        <>
          {overviewCards.length > 0 && (
            <div data-tour="summary-overview">
              <SchedulingOverviewPanel
                title={isInstructorDetailView ? (t('instructor_overview')) : (t('scheduling_overview'))}
                stats={overviewStats}
                cards={overviewCards}
                defaultOpen={false}
                testId="summary-overview-panel"
                storageKey="summary_overview"
              />
            </div>
          )}

          <div data-tour="summary-analytics">
          <CollapsibleSection
            title={isInstructorDetailView ? (t('teacher_effort_report')) : (t('analytics'))}
            summary={`${SCHEDULING_SUMMARY_DEFAULT_WIDGETS.length} ${t('widgets')} · ${effortReport?.totals?.sessionCount ?? 0} ${t('sessions')} · ${effortReport?.totals?.teacherCount ?? 0} ${t('total_teachers')}`}
            icon={BarChart3}
            defaultOpen={false}
            testId="effort-report-section"
            storageKey="summary_effort_report"
          >
            <SchedulingSummaryAnalytics
              effortReport={effortReport}
              dashboardData={dashboardData}
              isRTL={isRTL}
              canExport={canExport}
              onReload={loadAll}
              lastUpdatedAt={lastUpdatedAt}
            />
          </CollapsibleSection>
          </div>

          {isInstructorDetailView && teacherEffort && (
            <CollapsibleSection
              title={t('instructor_detail')}
              summary={isRTL ? teacherEffort.teacher?.instructorNameAr : teacherEffort.teacher?.instructorName}
              icon={User}
              defaultOpen={false}
              testId="instructor-detail-section"
              storageKey="summary_instructor_detail"
            >
              <TeacherEffortExport
                teacherId={String(activeInstructorId)}
                params={queryParams}
                effort={teacherEffort}
                canExport={canExport}
              />
              <TeacherEffortSummary effort={teacherEffort} />
              <TeacherSubjectDistribution effort={teacherEffort} />
            </CollapsibleSection>
          )}

          {dashboardData && (
            <div data-tour="summary-breaks">
              <CollapsibleSection
                title={t('breaks_and_holidays_analytics')}
                summary={`${SCHEDULING_BREAKS_HOLIDAYS_MAX_WIDGETS} ${t('widgets')} · ${dashboardData.breakSessions?.length ?? 0} ${t('breaks')} · ${dashboardData.holidays?.length ?? 0} ${t('holidays')}`}
                icon={Palmtree}
                defaultOpen={false}
                testId="breaks-holidays-section"
                storageKey="summary_breaks_holidays"
                actions={(
                  <button type="button" style={headerButtonStyle} onClick={() => navigate('/scheduling-calendar')} aria-label={t('manage_breaks_and_holidays')}>
                    <CalendarDays size={14} />
                    <span>{t('manage_in_calendar')}</span>
                  </button>
                )}
              >
                <BreaksHolidaysAnalyticsPanel
                  rawData={buildSchedulingRawData(effortReport, dashboardData, isRTL)}
                  defaultWidgets={SCHEDULING_BREAKS_HOLIDAYS_DEFAULT_WIDGETS}
                  storageKey={SCHEDULING_BREAKS_HOLIDAYS_STORAGE_KEY}
                  maxWidgets={SCHEDULING_BREAKS_HOLIDAYS_MAX_WIDGETS}
                  widgetCategoryResolver="scheduling"
                  builderCategoryScope="scheduling"
                  onReload={loadAll}
                  lastUpdatedAt={lastUpdatedAt}
                />
              </CollapsibleSection>
            </div>
          )}

          {dashboardData && (
            <div data-tour="summary-attendance">
              <CollapsibleSection
                title={t('attendance_analytics')}
                summary={`${SCHEDULING_ATTENDANCE_MAX_WIDGETS} ${t('widgets')} · ${t('class_and_daily')}`}
                icon={ClipboardList}
                defaultOpen={false}
                testId="attendance-analytics-section"
                storageKey="summary_attendance_analytics"
              >
                <AttendanceAnalyticsPanel
                  rawData={buildSchedulingRawData(effortReport, dashboardData, isRTL)}
                  defaultWidgets={SCHEDULING_ATTENDANCE_DEFAULT_WIDGETS}
                  storageKey={SCHEDULING_ATTENDANCE_STORAGE_KEY}
                  maxWidgets={SCHEDULING_ATTENDANCE_MAX_WIDGETS}
                  widgetCategoryResolver="scheduling"
                  builderCategoryScope="scheduling"
                  onReload={loadAll}
                  lastUpdatedAt={lastUpdatedAt}
                />
              </CollapsibleSection>
            </div>
          )}

          <div data-tour="summary-student-records">
            <CollapsibleSection
              title={recordsClassId ? t('class_records') : t('records')}
              summary={recordsClassId ? (recordsHook.loading ? '…' : `${(recordsHook.attendance?.length || 0) + (recordsHook.penalties?.length || 0) + (recordsHook.behaviors?.length || 0) + (recordsHook.participations?.length || 0)} ${t('records') || 'records'}`) : (t('select_class_to_view') || 'Select a class')}
              icon={ClipboardList}
              defaultOpen={false}
              testId="summary-student-records-section"
              storageKey="summary_student_records"
            >
              {!recordsClassId ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)' }}>
                  {t('select_class_to_view_records') || 'Select a class to view student records'}
                </div>
              ) : recordsHook.loading ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)' }}>
                  {t('common.loading')}
                </div>
              ) : (
                <AttendanceTab
                  studentId={null}
                  classId={recordsClassId}
                  attendance={recordsHook.attendance || []}
                  participations={recordsHook.participations || []}
                  penalties={recordsHook.penalties || []}
                  behaviors={recordsHook.behaviors || []}
                  students={[]}
                  onRefresh={recordsHook.reload}
                  t={t}
                  lang={lang}
                />
              )}
            </CollapsibleSection>
          </div>

          {canViewAdvancedAnalytics && (
          <div data-tour="summary-drive-analytics">
            <CollapsibleSection
              title={t('drive')}
              summary={driveSummary}
              icon={HardDrive}
              defaultOpen={false}
              testId="summary-drive-analytics-section"
              storageKey="summary_drive_analytics"
            >
              <DashboardAnalyticsPanel
                analyticsData={analyticsHook.data}
                loading={analyticsHook.loading}
                onReload={analyticsHook.reload}
                lastUpdatedAt={lastUpdatedAt}
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
              testId="summary-workflow-analytics-section"
              storageKey="summary_workflow_analytics"
            >
              <DashboardAnalyticsPanel
                analyticsData={analyticsHook.data}
                loading={analyticsHook.loading}
                onReload={analyticsHook.reload}
                lastUpdatedAt={lastUpdatedAt}
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
              testId="summary-activity-analytics-section"
              storageKey="summary_activity_analytics"
            >
              <DashboardAnalyticsPanel
                analyticsData={analyticsHook.data}
                loading={analyticsHook.loading}
                onReload={analyticsHook.reload}
                lastUpdatedAt={lastUpdatedAt}
                lockedCategory="activity"
                storageKeySuffix="_activity"
                defaultWidgets={ACTIVITY_ANALYTICS_DEFAULT_WIDGETS}
                maxWidgets={ACTIVITY_ANALYTICS_MAX_WIDGETS}
              />
            </CollapsibleSection>
          </div>
          )}

        </>
      )}
    </div>
  );
};

export default SummaryDashboardPage;
