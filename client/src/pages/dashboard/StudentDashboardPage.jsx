import React, { useState, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import logger from '@utils/logger';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import {
  Container, Button, Select, Tabs, useToast, Badge, EmptyState, Skeleton,
} from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { getThemedIcon } from '@constants/iconTypes';
import useStudentDashboardPermissions from '@hooks/useStudentDashboardPermissions';
import useStudentDashboardFilters from '@hooks/useStudentDashboardFilters';
import useStudentDashboardData from '@hooks/useStudentDashboardData';
import {
  OverviewTab,
  AttendanceTab,
  MarksTab,
  PerformanceTab,
  RecordsTab,
} from '@components/student-dashboard';
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

  // ─── Data hook ─────────────────────────────────────────────────────────────
  const dashData = useStudentDashboardData(displayStudentId, filters.hasSelection);

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

  // ─── Export handlers ───────────────────────────────────────────────────────
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
      [lang === 'ar' ? 'المقرر' : 'Course']: e.className || e.courseName || '',
      [lang === 'ar' ? 'الفصل' : 'Semester']: `${e.semester || ''} ${e.academicYear || e.year || ''}`.trim(),
      [lang === 'ar' ? 'الحضور' : 'Attendance']: `${(e.attendanceRate || 0).toFixed(1)}%`,
      [lang === 'ar' ? 'التقدير' : 'Grade']: e.grade || '—',
      [lang === 'ar' ? 'الدرجة' : 'Mark']: e.totalMarks !== undefined ? `${e.totalMarks}%` : '—',
    }));
    if (!rows.length) { toast?.showWarning?.(t('no_data_to_export') || 'No data to export'); return; }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h]}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `student-courses-${displayName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast?.showSuccess?.(t('exported_successfully') || 'Exported successfully');
  }, [dashData.enrollments, displayName, lang, toast, t]);

  // ─── Select options ────────────────────────────────────────────────────────
  const programOptions = useMemo(() => [
    { value: 'all', label: lang === 'ar' ? 'كل البرامج' : 'All Programs' },
    ...filters.programs.map(p => ({ value: p.id || p.docId, label: lang === 'ar' ? (p.name_ar || p.name || '') : (p.name_en || p.name || '') })),
  ], [filters.programs, lang]);

  const subjectOptions = useMemo(() => [
    { value: 'all', label: lang === 'ar' ? 'كل المواد' : 'All Subjects' },
    ...filters.filteredSubjects.map(s => ({ value: s.id || s.docId, label: lang === 'ar' ? (s.name_ar || s.name || '') : (s.name_en || s.name || '') })),
  ], [filters.filteredSubjects, lang]);

  const classOptions = useMemo(() => [
    { value: 'all', label: lang === 'ar' ? 'كل الفصول' : 'All Classes' },
    ...filters.filteredClasses.map(c => ({ value: c.id || c.docId, label: lang === 'ar' ? (c.name_ar || c.name || '') : (c.name || '') })),
  ], [filters.filteredClasses, lang]);

  const studentOptions = useMemo(() => [
    { value: '', label: lang === 'ar' ? 'اختر طالب' : 'Select Student' },
    ...filters.filteredStudents.map(s => ({ value: s.id || s.uid, label: s.displayName || s.email || '' })),
  ], [filters.filteredStudents, lang]);

  // ─── Tabs ──────────────────────────────────────────────────────────────────
  const dashTabs = [
    { id: 'overview',      label: lang === 'ar' ? 'نظرة عامة'   : 'Overview' },
    { id: 'attendance',    label: lang === 'ar' ? 'الحضور'       : 'Attendance' },
    { id: 'marks',         label: lang === 'ar' ? 'الدرجات'      : 'Marks' },
    { id: 'performance',   label: lang === 'ar' ? 'الأداء'       : 'Performance' },
    { id: 'penalties',     label: lang === 'ar' ? 'العقوبات'     : 'Penalties' },
    { id: 'participations',label: lang === 'ar' ? 'المشاركات'    : 'Participations' },
    { id: 'behaviors',     label: lang === 'ar' ? 'السلوك'       : 'Behaviors' },
  ];

  if (authLoading) return <GlobalLoadingFallback />;

  // ─── Selection prompt for staff with no selection ──────────────────────────
  const showSelectionPrompt = permissions.isStaff && !filters.hasSelection;

  return (
    <div className={styles.dashboard} ref={exportRef}>
      <Container maxWidth="xxl">

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerTitle}>
              <h1>{lang === 'ar' ? 'لوحة تحكم الطالب' : 'Student Dashboard'}</h1>
              <p className={styles.subtitle}>
                {displayName}
                {permissions.isStaff && !filters.selectedStudentId && (
                  <span className={styles.subtitleHint}>
                    {' — '}{lang === 'ar' ? 'اختر طالباً لعرض البيانات' : 'Select a student to view data'}
                  </span>
                )}
              </p>
            </div>
            <div className={styles.headerActions}>
              <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting || showSelectionPrompt}>
                {getThemedIcon('ui', 'download', 16, theme)}
                {lang === 'ar' ? 'PDF' : 'PDF'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportImage} disabled={exporting || showSelectionPrompt}>
                {getThemedIcon('ui', 'file', 16, theme)}
                {lang === 'ar' ? 'صورة' : 'Image'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={showSelectionPrompt}>
                {getThemedIcon('ui', 'file_text', 16, theme)}
                {lang === 'ar' ? 'CSV' : 'CSV'}
              </Button>
            </div>
          </div>

          {/* ── Cascading filters for staff ── */}
          {permissions.isStaff && (
            <div className={styles.filters}>
              <Select
                value={filters.selectedProgramId}
                onChange={e => filters.setSelectedProgramId(e.target.value)}
                options={programOptions}
              />
              <Select
                value={filters.selectedSubjectId}
                onChange={e => filters.setSelectedSubjectId(e.target.value)}
                options={subjectOptions}
              />
              <Select
                value={filters.selectedClassId}
                onChange={e => filters.setSelectedClassId(e.target.value)}
                options={classOptions}
              />
              <Select
                value={filters.selectedStudentId}
                onChange={e => filters.setSelectedStudentId(e.target.value)}
                options={studentOptions}
                placeholder={lang === 'ar' ? 'اختر طالب' : 'Select Student'}
              />
            </div>
          )}
        </div>

        {/* ── Stats summary bar ── */}
        {!showSelectionPrompt && !dashData.loading && (
          <div className={styles.statsBar}>
            <div className={styles.statItem} data-color="purple">
              <span className={styles.statLabel}>{lang === 'ar' ? 'المعدل' : 'GPA'}</span>
              <span className={styles.statValue}>{dashData.statsData.gpa}</span>
            </div>
            <div className={styles.statItem} data-color="green">
              <span className={styles.statLabel}>{lang === 'ar' ? 'الحضور' : 'Attendance'}</span>
              <span className={styles.statValue}>{dashData.statsData.attendanceRate}%</span>
            </div>
            <div className={styles.statItem} data-color="blue">
              <span className={styles.statLabel}>{lang === 'ar' ? 'المشاركات' : 'Participations'}</span>
              <span className={styles.statValue}>{dashData.statsData.participations}</span>
            </div>
            <div className={styles.statItem} data-color="red">
              <span className={styles.statLabel}>{lang === 'ar' ? 'العقوبات' : 'Penalties'}</span>
              <span className={styles.statValue}>{dashData.statsData.penalties}</span>
            </div>
            <div className={styles.statItem} data-color="orange">
              <span className={styles.statLabel}>{lang === 'ar' ? 'الصافي' : 'Net Score'}</span>
              <span className={styles.statValue}>
                {dashData.statsData.netScore >= 0 ? '+' : ''}{dashData.statsData.netScore}
              </span>
            </div>
          </div>
        )}

        {/* ── Selection prompt ── */}
        {showSelectionPrompt && (
          <div className={styles.selectionPrompt}>
            {getThemedIcon('ui', 'users', 32, theme)}
            <p>{lang === 'ar' ? 'الرجاء اختيار فصل أو طالب لعرض البيانات' : 'Please select a class or student to view data'}</p>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {dashData.loading && !showSelectionPrompt && (
          <div className={styles.skeletonGrid}>
            {[1,2,3,4].map(i => <Skeleton key={i} height={80} borderRadius={10} />)}
          </div>
        )}

        {/* ── Tabs + content ── */}
        {!showSelectionPrompt && !dashData.loading && (
          <div className={styles.detailsSection}>
            <Tabs tabs={dashTabs} activeTab={activeTab} onTabChange={setActiveTab} />

            <div className={styles.detailContent}>
              {activeTab === 'overview' && (
                <OverviewTab
                  semesters={dashData.semesters}
                  enrollments={dashData.enrollments}
                  statsData={dashData.statsData}
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
