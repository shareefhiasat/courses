import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast } from '@ui';
import { useGlobalLoading, GlobalLoadingFallback } from '@contexts/GlobalLoadingContext';
import { Container, Button, Select, UserSelect, Tabs, Skeleton } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { USER_ROLES } from '@constants';
import ProgramsSelect from '@ui/Select/ProgramsSelect';
import logger from '@utils/logger';

import useStudentDashboardPermissions from '@hooks/useStudentDashboardPermissions';
import useStudentDashboardFilters from '@hooks/useStudentDashboardFilters';
import useStudentDashboardData from '@hooks/useStudentDashboardData';
import useClassLevelMetrics from '@hooks/useClassLevelMetrics';
import { getStudentsByClass } from '@services/business/enrollmentService';

import {
  OverviewTab,
  AttendanceTab,
  MarksTab,
  PerformanceTab,
  RecordsTab,
} from '@components/student-dashboard';
import EnhancedStatsSection from '@components/student-dashboard/enhanced-stats/EnhancedStatsSection';
import NetScoreAnalysis from '@components/student-dashboard/net-score-analysis/NetScoreAnalysis';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import styles from './StudentDashboardPage.module.css';

export default function StudentDashboardPage() {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  const exportRef = useRef(null);
  const userSelectRef = useRef(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);

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
      return found?.displayName || t('student') || 'Student';
    }
    return userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || t('student') || 'Student';
  }, [permissions.isStaff, filters.selectedStudentId, filters.filteredStudents, userProfile, user, t]);

  // ─── Data hooks with proper conditional loading ────────────────────────────────
  const dashData = useStudentDashboardData(
    permissions.isStaff && !filters.hasSelection ? null : displayStudentId, 
    filters.hasSelection
  );

  // Class-level metrics for staff when no student is selected
  const classMetrics = useClassLevelMetrics(
    permissions.isStaff && filters.selectedClassId && filters.selectedClassId !== 'all' 
      ? filters.selectedClassId 
      : null,
    permissions.isStaff && !filters.hasSelection
  );

  // Load class enrollments when a class is selected (for UserSelect)
  const [classEnrollments, setClassEnrollments] = useState([]);
  const [loadingClassEnrollments, setLoadingClassEnrollments] = useState(false);

  useEffect(() => {
    const loadClassEnrollments = async () => {
      if (!permissions.isStaff || !filters.selectedClassId || filters.selectedClassId === 'all') {
        setClassEnrollments([]);
        return;
      }

      setLoadingClassEnrollments(true);
      logger.log('[StudentDashboardPage] Loading enrollments for class:', filters.selectedClassId);
      
      try {
        const result = await getStudentsByClass(filters.selectedClassId);
        if (result.success) {
          logger.log('[StudentDashboardPage] Loaded class enrollments:', result.data.length, 'students');
          setClassEnrollments(result.data || []);
        } else {
          logger.error('[StudentDashboardPage] Failed to load class enrollments:', result.error);
          setClassEnrollments([]);
        }
      } catch (error) {
        logger.error('[StudentDashboardPage] Error loading class enrollments:', error);
        setClassEnrollments([]);
      } finally {
        setLoadingClassEnrollments(false);
      }
    };

    loadClassEnrollments();
  }, [permissions.isStaff, filters.selectedClassId]);

  // Only students should appear in the user dropdown (defensive in case role is missing)
  const studentUsers = useMemo(() => {
    return filters.filteredStudents.filter(u => {
      const role = (u.role || '').toLowerCase();
      return role === (USER_ROLES.STUDENT || 'student');
    });
  }, [filters.filteredStudents]);

  // ─── Selection prompt state (needed early for debugging) ─────────────────────
  const showSelectionPrompt = permissions.isStaff && !filters.hasSelection;

  // Debug logging for data flow
  useEffect(() => {
    logger.log('[StudentDashboardPage] Dashboard state:', {
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
    logger.log('[StudentDashboardPage] Tab state:', {
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

  // ─── Memoized export handlers (Performance optimization) ───────────────────────
  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: theme === 'dark' ? '#111827' : '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, (canvas.height * imgWidth) / canvas.width);
      pdf.save(`student-dashboard-${displayName}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast?.showSuccess?.(t('exported_successfully') || 'Exported successfully');
    } catch (err) { logger.error('Export PDF failed', err); toast?.showError?.(t('export_failed') || 'Export failed'); }
    finally { setExporting(false); }
  }, [theme, displayName, toast, t]);

  const handleExportImage = useCallback(async () => {
    setExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: theme === 'dark' ? '#111827' : '#ffffff' });
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `student-dashboard-${displayName}-${new Date().toISOString().split('T')[0]}.png`;
        a.click(); URL.revokeObjectURL(url);
        toast?.showSuccess?.(t('exported_successfully') || 'Exported successfully');
      });
    } catch (err) { logger.error('Export image failed', err); toast?.showError?.(t('export_failed') || 'Export failed'); }
    finally { setExporting(false); }
  }, [theme, displayName, toast, t]);

  const handleExportCSV = useCallback(() => {
    const rows = dashData.enrollments.map(e => ({
      [t('dashboard.course') || (lang === 'ar' ? 'المقرر' : 'Course')]: e.className || e.courseName || '',
      [t('dashboard.semester') || (lang === 'ar' ? 'الفصل' : 'Semester')]: `${e.semester || ''} ${e.academicYear || e.year || ''}`.trim(),
      [t('dashboard.attendance_rate') || (lang === 'ar' ? 'الحضور' : 'Attendance')]: `${(e.attendanceRate || 0).toFixed(1)}%`,
      [t('dashboard.grade') || (lang === 'ar' ? 'التقدير' : 'Grade')]: e.grade || '—',
      [t('dashboard.mark') || (lang === 'ar' ? 'الدرجة' : 'Mark')]: e.totalMarks !== undefined ? `${e.totalMarks}%` : '—',
    }));
    if (!rows.length) { toast?.showWarning?.(t('dashboard.no_data_to_export') || (lang === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export')); return; }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h]}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `student-courses-${displayName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast?.showSuccess?.(t('exported_successfully') || 'Exported successfully');
  }, [dashData.enrollments, displayName, lang, toast, t]);

  // ─── Memoized select options (Performance optimization) ────────────────────────
  const studentOptions = useMemo(() => [
    { value: '', label: t('filters.select_student') || (lang === 'ar' ? 'اختر طالب' : 'Select Student') },
    ...filters.filteredStudents.map(s => ({ value: s.id || s.uid, label: s.displayName || s.email || '' })),
  ], [filters.filteredStudents, lang, t]);

  // ─── Memoized tabs configuration (Performance optimization) ─────────────────────
  const dashTabs = useMemo(() => [
    { value: 'overview',      label: t('dashboard.overview') || (lang === 'ar' ? 'نظرة عامة'   : 'Overview') },
    { value: 'attendance',    label: t('dashboard.attendance') || (lang === 'ar' ? 'الحضور'       : 'Attendance') },
    { value: 'marks',         label: t('dashboard.marks') || (lang === 'ar' ? 'الدرجات'      : 'Marks') },
    { value: 'performance',   label: t('dashboard.performance') || (lang === 'ar' ? 'الأداء'       : 'Performance') },
    { value: 'netScore',      label: t('dashboard.net_score_analysis') || (lang === 'ar' ? 'تحليل الصافي' : 'Net Score Analysis') },
    { value: 'penalties',     label: t('dashboard.penalties') || (lang === 'ar' ? 'العقوبات'     : 'Penalties') },
    { value: 'participations',label: t('dashboard.participations') || (lang === 'ar' ? 'المشاركات'    : 'Participations') },
    { value: 'behaviors',     label: t('dashboard.behaviors') || (lang === 'ar' ? 'السلوك'       : 'Behaviors') },
  ], [lang, t]);

  if (authLoading) return <GlobalLoadingFallback />;

  return (
    <div className={styles.dashboard} ref={exportRef}>
      <Container maxWidth="xxl">

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerTitle}>
              {/* Empty header - no username display */}
            </div>
            <div className={styles.headerActions}>
              <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting || showSelectionPrompt}>
                {getThemedIcon('ui', 'download', 16, theme)}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportImage} disabled={exporting || showSelectionPrompt}>
                {getThemedIcon('ui', 'file', 16, theme)}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={showSelectionPrompt}>
                {getThemedIcon('ui', 'file_text', 16, theme)}
              </Button>
            </div>
          </div>

          {/* ── Cascading filters for staff ── */}
          {permissions.isStaff && (
            <div className={styles.filters}>
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
              <UserSelect
                ref={userSelectRef}
                users={filters.selectedClassId && filters.selectedClassId !== 'all' ? classEnrollments : studentUsers}
                enrollments={dashData.enrollments}
                value={filters.selectedStudentId}
                onChange={e => filters.setSelectedStudentId(e.target.value)}
                placeholder={t('filters.select_student') || (lang === 'ar' ? 'اختر طالب' : 'Select Student')}
                roleFilter={[USER_ROLES.STUDENT]}
                showEnrollments={true}
                showStatus={true}
                searchable={true}
                disabled={loadingClassEnrollments}
              />
              {/* Debug info for student filtering */}
              {process.env.NODE_ENV === 'development' && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', border: '1px solid #3b82f6', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <strong>Debug - Student Selection:</strong><br/>
                  Selected Class: {filters.selectedClassId || 'None'}<br/>
                  Class Name: {filters.selectedClassId ? filters.classes.find(c => (c.id || c.docId) === filters.selectedClassId)?.name || 'Unknown' : 'N/A'}<br/>
                  Available Students: {studentUsers.length}<br/>
                  Filtered Students: {filters.filteredStudents.length}<br/>
                  Class Enrollments: {classEnrollments.length} students<br/>
                  Loading Class Enrollments: {loadingClassEnrollments ? 'Yes' : 'No'}<br/>
                  Enrollments Count: {dashData.enrollments?.length || 0}<br/>
                  {filters.selectedClassId && filters.selectedClassId !== 'all' && (
                    <>
                      Query: getStudentsByClass('{filters.selectedClassId}')<br/>
                      Class Enrollments: {dashData.enrollments?.filter(e => e.classId === filters.selectedClassId).length || 0}<br/>
                    </>
                  )}
                  {classEnrollments.length > 0 && (
                    <details style={{ marginTop: '0.5rem' }}>
                      <summary style={{ cursor: 'pointer', fontSize: '0.7rem' }}>View Class Students</summary>
                      <div style={{ fontSize: '0.6rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem', maxHeight: '100px', overflow: 'auto' }}>
                        {classEnrollments.map(student => (
                          <div key={student.id || student.docId}>
                            {student.displayName || student.email} ({student.id || student.docId})
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Enhanced Stats summary bar (Class-level or Student-level) ── */}
        {!showSelectionPrompt && !dashData.loading && (
          <EnhancedStatsSection
            statsData={dashData.statsData}
            classMetrics={classMetrics.metrics}
            isStaff={permissions.isStaff}
            selectedStudentId={filters.selectedStudentId}
            dashData={dashData}
          />
        )}

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

        {/* ── Loading skeleton ── */}
        {(dashData.loading || classMetrics.loading) && !showSelectionPrompt && (
          <div className={styles.skeletonGrid}>
            {[1,2,3,4].map(i => <Skeleton key={i} height={80} borderRadius={10} />)}
          </div>
        )}

        {/* ── Tabs + content (only when data is available) ── */}
        {!showSelectionPrompt && !dashData.loading && !dashData.error && !classMetrics.error && (
          <div className={styles.detailsSection}>
            <Tabs tabs={dashTabs} activeTab={activeTab} onTabChange={setActiveTab} />

            <div className={styles.detailContent}>
              {activeTab === 'overview' && (
                <OverviewTab
                  semesters={dashData.semesters}
                  enrollments={dashData.enrollments}
                  statsData={dashData.statsData}
                  classMetrics={permissions.isStaff && !filters.selectedStudentId ? classMetrics.metrics : null}
                  grouping={filters.grouping}
                  canViewAllStudents={permissions.canViewAllStudents}
                  onNavigateToClass={classId => navigate(`/classes/${classId}`)}
                  t={t}
                  lang={lang}
                />
              )}
              {activeTab === 'attendance' && (
                <AttendanceTab
                  studentId={displayStudentId}
                  classId={filters.selectedClassId !== 'all' ? filters.selectedClassId : undefined}
                  attendance={dashData.attendance}
                  participations={dashData.participations}
                  penalties={dashData.penalties}
                  behaviors={dashData.behaviors}
                  canInlineEdit={permissions.canInlineEdit}
                  canDeleteRecords={permissions.canDeleteRecords}
                  onRefresh={dashData.reload}
                  t={t}
                  lang={lang}
                />
              )}
              {activeTab === 'marks' && (
                <MarksTab
                  marks={dashData.marks}
                  semesters={dashData.semesters}
                  statsData={dashData.statsData}
                  canNavigateToMarksEntry={permissions.canNavigateToMarksEntry}
                  studentId={displayStudentId}
                  t={t}
                  lang={lang}
                />
              )}
              {activeTab === 'performance' && (
                <PerformanceTab
                  marks={dashData.marks}
                  enrollments={dashData.enrollments}
                  attendance={dashData.attendance}
                  participations={dashData.participations}
                  penalties={dashData.penalties}
                  behaviors={dashData.behaviors}
                  statsData={dashData.statsData}
                  canSeeClassDistributions={permissions.canSeeClassDistributions}
                  t={t}
                  lang={lang}
                />
              )}
              {activeTab === 'netScore' && (
                <NetScoreAnalysis
                  participations={dashData.participations}
                  penalties={dashData.penalties}
                  behaviors={dashData.behaviors}
                  marks={dashData.marks}
                  quizResults={dashData.quizResults}
                  isStaff={permissions.isStaff}
                  selectedStudentId={filters.selectedStudentId}
                />
              )}
              {activeTab === 'penalties' && (
                <RecordsTab recordType="penalties" records={dashData.penalties} t={t} lang={lang} />
              )}
              {activeTab === 'participations' && (
                <RecordsTab recordType="participations" records={dashData.participations} t={t} lang={lang} />
              )}
              {activeTab === 'behaviors' && (
                <RecordsTab recordType="behaviors" records={dashData.behaviors} t={t} lang={lang} />
              )}
            </div>
          </div>
        )}

      </Container>
    </div>
  );
}
