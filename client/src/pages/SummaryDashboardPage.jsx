import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { usePermissions } from '@hooks/usePermissions';
import { useDataScope } from '@hooks/useDataScope';
import { Button, SimpleLoading, useToast, Card, CardBody } from '@ui';
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
import BreakSessionModal from '@components/scheduling/summary/BreakSessionModal';
import SchedulingOverviewPanel from '@components/scheduling/SchedulingOverviewPanel';
import CollapsibleSection from '@components/scheduling/CollapsibleSection';
import {
  CalendarDays, Coffee, User, DoorOpen, BarChart3, Palmtree,
} from 'lucide-react';
import { getAllUsers, getUserRoles } from '@services/business/userService';
import { getAllSubjects } from '@services/business/subjectService';
import { getAllClasses } from '@services/business/classService';
import { getAccessibleProgramsForUser } from '@services/business/userCategoryAccessService';
import { getAllPrograms } from '@services/business/programService';
import timeSlotBusinessService from '@services/business/timeSlotBusinessService';
import {
  buildSchedulingOverviewCards,
  buildInstructorOverviewCards,
} from '@utils/schedulingOverviewCards';

const SummaryDashboardPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin, isInstructor } = useAuth();
  const { t, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canAccessScreen, hasPermission } = usePermissions();
  const { scope } = useDataScope();

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
  const [reportFilters, setReportFilters] = useState({
    programId: '',
    subjectId: '',
    classId: '',
    term: '',
    year: '',
    instructorId: prefilterInstructor || (isSelfView && dbUserId ? String(dbUserId) : ''),
    reportFormat: 'summary',
  });
  const [timeRange, setTimeRange] = useState('year');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(Date.now());
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);

  const canView = canAccessScreen('summary-dashboard') || isAdmin || isHR || isSuperAdmin || isInstructor;
  const canExport = hasPermission('summary-dashboard.canExport') || isSuperAdmin || isHR;
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
      let programs = [];
      if (scope.unrestricted || isSuperAdmin || isAdmin || isHR) {
        const result = await getAllPrograms();
        if (result?.success) programs = result.data || [];
      } else {
        const result = await getAccessibleProgramsForUser(dbUserId);
        if (result.success) programs = result.data || [];
        if (scope.programIds?.length) {
          const allowed = new Set(scope.programIds.map(Number));
          programs = programs.filter((p) => allowed.has(Number(p.id)));
        }
      }
      setAccessiblePrograms(programs);
    } catch (err) {
      console.error('Error loading programs:', err);
    }
  }, [dbUserId, scope.unrestricted, scope.programIds, isSuperAdmin, isAdmin, isHR]);

  const loadLookupData = useCallback(async () => {
    try {
      const [subjRes, classRes, userRes] = await Promise.all([
        getAllSubjects(),
        getAllClasses(),
        isSelfView ? Promise.resolve(null) : getAllUsers({ excludeStudents: true }),
      ]);
      if (subjRes?.data) setSubjects(subjRes.data);
      if (classRes?.data) setClasses(classRes.data);
      if (userRes?.data) {
        const instructorList = userRes.data.filter((u) => {
          const roles = getUserRoles(u);
          return roles.includes('instructor') || roles.includes('INSTRUCTOR');
        });
        setInstructors(instructorList);
      }
    } catch (err) {
      console.error('Error loading lookup data:', err);
    }
  }, [isSelfView]);

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
  }, [queryParams, toast, t, activeInstructorId]);

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
    const pid = reportFilters.programId;
    if (!pid) { setTimeSlots([]); return; }
    (async () => {
      const result = await timeSlotBusinessService.getAllTimeSlots({ programId: pid, isBreak: true });
      if (result.success) setTimeSlots(result.data || []);
    })();
  }, [reportFilters.programId]);

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

  const handleTimeRangeChange = (patch) => {
    if (patch.timeRange) setTimeRange(patch.timeRange);
    if (patch.startDate !== undefined) setStartDate(patch.startDate);
    if (patch.endDate !== undefined) setEndDate(patch.endDate);
  };

  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const border = theme === 'dark' ? '#374151' : '#e5e7eb';

  const quickActions = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
      <Button variant="outline" size="sm" onClick={() => navigate('/scheduling-calendar')} title={t('view_schedule')} aria-label={t('view_schedule')}>
        <CalendarDays size={16} />
      </Button>
      <Button variant="outline" size="sm" onClick={() => setBreakModalOpen(true)} title={t('manage_break_sessions')} aria-label={t('manage_break_sessions')}>
        <Coffee size={16} />
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/instructor-availability')} title={t('manage_instructor_availability')} aria-label={t('manage_instructor_availability')}>
        <User size={16} />
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/classroom-availability')} title={t('manage_room_availability')} aria-label={t('manage_room_availability')}>
        <DoorOpen size={16} />
      </Button>
    </div>
  );

  if (!canView) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: 500 }}>{t('access_denied')}</div>
        <div style={{ fontSize: '0.875rem', color: muted, marginTop: '0.5rem' }}>{t('dashboard_permission_required')}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }} data-testid="summary-dashboard-page">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
      }}>
        <AutoRefreshBar
          compact
          onRefresh={loadAll}
          intervalMs={refreshInterval}
          onIntervalChange={setRefreshInterval}
        />
        {quickActions}
      </div>

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

      <TimeRangeSelector
        timeRange={timeRange}
        startDate={startDate}
        endDate={endDate}
        onChange={handleTimeRangeChange}
        onApply={loadAll}
      />

      {loading ? (
        <SimpleLoading />
      ) : loadError ? (
        <div style={{ padding: '1rem', color: '#ef4444' }}>
          <p>{loadError}</p>
        </div>
      ) : (
        <>
          {overviewCards.length > 0 && (
            <SchedulingOverviewPanel
              title={isInstructorDetailView ? (t('instructor_overview') || 'Instructor Overview') : (t('scheduling_overview') || 'Scheduling Overview')}
              stats={overviewStats}
              cards={overviewCards}
              defaultOpen
            />
          )}

          <CollapsibleSection
            title={isInstructorDetailView ? (t('teacher_effort_report') || 'Teacher Effort') : (t('organization_effort_report') || 'Organization Effort Report')}
            summary={`${effortReport?.totals?.sessionCount ?? 0} ${t('sessions')} · ${effortReport?.totals?.teacherCount ?? 0} ${t('total_teachers')}`}
            icon={BarChart3}
            defaultOpen
            testId="effort-report-section"
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

          {isInstructorDetailView && teacherEffort && (
            <CollapsibleSection
              title={t('instructor_detail') || 'Instructor Detail'}
              summary={isRTL ? teacherEffort.teacher?.instructorNameAr : teacherEffort.teacher?.instructorName}
              icon={User}
              defaultOpen
              testId="instructor-detail-section"
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
            <CollapsibleSection
              title={t('breaks_and_holidays') || 'Breaks & Holidays'}
              summary={`${dashboardData.breakSessions?.length ?? 0} ${t('breaks')} · ${dashboardData.holidays?.length ?? 0} ${t('holidays')}`}
              icon={Palmtree}
              defaultOpen={false}
              testId="breaks-holidays-section"
              actions={(
                <Button variant="outline" size="sm" onClick={() => setBreakModalOpen(true)} title={t('manage_break_sessions')} aria-label={t('manage_break_sessions')}>
                  <Coffee size={14} />
                </Button>
              )}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <Card>
                  <CardBody>
                    <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.75rem' }}>{t('today_schedule')}</h3>
                    {dashboardData.todaySchedule?.length > 0 ? (
                      dashboardData.todaySchedule.map((session, index) => (
                        <div key={index} style={{ padding: '0.5rem 0', borderBottom: `1px solid ${border}`, fontSize: '0.875rem' }}>
                          {isRTL ? session.subject?.nameAr : session.subject?.nameEn || '—'}
                          {' · '}{session.timeSlot?.startTime}–{session.timeSlot?.endTime}
                        </div>
                      ))
                    ) : (
                      <p style={{ color: muted, textAlign: 'center' }}>{t('no_sessions_today')}</p>
                    )}
                  </CardBody>
                </Card>
                <BreakSessionTimeline breaks={dashboardData.breakSessions} />
                <UpcomingHolidaysList holidays={dashboardData.holidays} />
                <HolidayImpactCard impact={dashboardData.holidayImpact} />
                <BreakTypeDistributionCard distribution={dashboardData.breakTypeDistribution} />
              </div>
            </CollapsibleSection>
          )}

          <BreakSessionModal
            open={breakModalOpen}
            onClose={() => setBreakModalOpen(false)}
            onSaved={loadAll}
            programId={reportFilters.programId}
            programs={accessiblePrograms}
            timeSlots={timeSlots}
            instructors={instructors}
          />
        </>
      )}
    </div>
  );
};

export default SummaryDashboardPage;
