import React, { useState, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import logger from '@utils/logger';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { 
  Container, Button, Select, Tabs, useToast, Card, CardBody, Badge, EmptyState
} from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { getThemedIcon } from '@constants/iconTypes';
import { getCardConfig } from '@utils/cardColors';
import { TYPE_CATEGORIES, getTypeLabel, getStatusLabel, TASK_STATUS } from '@utils/sharedTypes';
import { getUsers } from '@services/business/userService';
import { getPrograms, getSubjects } from '@services/business/programService';
import useDashboardData from '@hooks/useDashboardData';
import TimelineNavigation from '../../components/student-dashboard/TimelineNavigation';
import CourseCard from '../../components/student-dashboard/CourseCard';
import ActivityFeed from '../../components/student-dashboard/ActivityFeed';
import StatsCards from '../../components/student-dashboard/StatsCards';
import ModernTasksView from '../../components/student-dashboard/ModernTasksView';
import OverviewView from '../../components/student-dashboard/OverviewView';
import AttendanceView from '../../components/student-dashboard/AttendanceView';
import PerformanceView from '../../components/student-dashboard/PerformanceView';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import styles from './StudentDashboardPage.module.css';

export default function StudentDashboardPage() {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user, userProfile, isAdmin, isInstructor, isHR, isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  const exportRef = useRef(null);
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeSemester, setActiveSemester] = useState(null);
  const [viewMode, setViewMode] = useState('timeline');
  const [detailView, setDetailView] = useState('overview');
  const [exporting, setExporting] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const displayUserId = selectedStudent || user?.uid;
  const displayName = selectedStudent 
    ? studentsList.find(s => s.id === selectedStudent)?.displayName || t('student') || 'Student'
    : userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || t('student') || 'Student';

  const {
    semesters,
    enrollments,
    attendance,
    penalties,
    participations,
    behaviors,
    marks,
    activities,
    submissions,
    quizResults,
    allActivities,
    loading,
    reload
  } = useDashboardData(displayUserId);

  React.useEffect(() => {
    if (semesters && semesters.length > 0 && !activeSemester) {
      const currentSemester = semesters.find(s => s.status === 'active') || semesters[semesters.length - 1];
      setActiveSemester(currentSemester?.id);
    }
  }, [semesters, activeSemester]);

  React.useEffect(() => {
    if (isAdmin || isInstructor || isHR) {
      loadStudentsList();
      loadPrograms();
    }
  }, [isAdmin, isInstructor, isHR]);

  const loadStudentsList = async () => {
    try {
      const result = await getUsers();
      if (result.success) {
        const students = result.data.filter(u => u.role === 'student');
        setStudentsList(students);
      }
    } catch (error) {
      logger.error((t('failed_to_load_students_list') || 'Failed to load students list'), error);
    }
  };

  const loadPrograms = async () => {
    try {
      const programsResult = await getPrograms();
      if (programsResult.success) {
        setPrograms(programsResult.data || []);
      }
      const subjectsResult = await getSubjects();
      if (subjectsResult.success) {
        setSubjects(subjectsResult.data || []);
      }
    } catch (error) {
      logger.error((t('failed_to_load_programs_subjects') || 'Failed to load programs/subjects'), error);
    }
  };

  const activeSemesterData = useMemo(() => {
    return semesters.find(s => s.id === activeSemester);
  }, [semesters, activeSemester]);

  const filteredCourses = useMemo(() => {
    if (!activeSemesterData) return [];
    
    let courses = activeSemesterData.courses || [];
    
    if (selectedProgram !== (t('all') || 'all')) {
      courses = courses.filter(c => c.programId === selectedProgram);
    }
    
    if (selectedSubject !== (t('all') || 'all')) {
      courses = courses.filter(c => c.subjectId === selectedSubject);
    }
    
    return courses;
  }, [activeSemesterData, selectedProgram, selectedSubject]);

  const statsData = useMemo(() => {
    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter(e => e.status === (t('active') || 'active')).length;
    
    const totalAttendance = attendance.length;
    const presentCount = attendance.filter(a => a.status === (t('present') || 'present')).length;
    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;
    
    const totalPenalties = penalties.length;
    const totalParticipations = participations.length;
    const totalBehaviors = behaviors.length;
    
    const gradesWithPoints = marks.filter(m => m.points !== undefined);
    const totalPoints = gradesWithPoints.reduce((sum, m) => sum + (m.points * (m.credits || 3)), 0);
    const totalCredits = gradesWithPoints.reduce((sum, m) => sum + (m.credits || 3), 0);
    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    
    const pendingTasks = submissions.filter(s => s.status === (t('pending') || 'pending') || !s.status).length;
    const completedTasks = submissions.filter(s => s.status === (t('graded') || 'graded') || s.status === (t('completed') || 'completed')).length;
    
    const netScore = totalParticipations - totalPenalties - totalBehaviors;
    
    return {
      gpa,
      attendanceRate: attendanceRate.toFixed(1),
      enrollments: totalEnrollments,
      activeEnrollments,
      tasks: pendingTasks + completedTasks,
      pendingTasks,
      participations: totalParticipations,
      penalties: totalPenalties,
      behaviors: totalBehaviors,
      netScore
    };
  }, [enrollments, attendance, penalties, participations, behaviors, marks, submissions]);

  const handleSemesterClick = useCallback((semesterId) => {
    setActiveSemester(semesterId);
    logger.log('Semester changed', { semesterId });
  }, []);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const element = exportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`student-dashboard-${displayName}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast?.showSuccess?.(t('exported_successfully') || 'Exported successfully');
    } catch (error) {
      logger.error('Export failed', error);
      toast?.showError?.(t('export_failed') || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportImage = async () => {
    setExporting(true);
    try {
      const element = exportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff'
      });
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `student-dashboard-${displayName}-${new Date().toISOString().split('T')[0]}.png`;
        link.click();
        URL.revokeObjectURL(url);
        toast?.showSuccess?.(t('exported_successfully') || 'Exported successfully');
      });
    } catch (error) {
      logger.error('Export failed', error);
      toast?.showError?.(t('export_failed') || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = () => {
    const data = filteredCourses.map(course => ({
      Semester: `${course.semester} ${course.year || course.academicYear}`,
      Course: course.name || course.className,
      Code: course.code || 'N/A',
      Credits: course.credits || 3,
      Grade: course.grade || 'N/A',
      Mark: course.mark || course.totalMarks || 'N/A',
      Attendance: `${course.attendanceRate?.toFixed(1) || 0}%`,
      Status: course.status || 'active'
    }));
    
    if (data.length === 0) {
      toast?.showWarning?.(t('no_data_to_export') || 'No data to export');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `student-courses-${displayName}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast?.showSuccess?.(t('exported_successfully') || 'Exported successfully');
  };

  const programOptions = useMemo(() => {
    return [
      { value: 'all', label: lang === 'ar' ? 'كل البرامج' : 'All Programs' },
      ...programs.map(p => ({
        value: p.id || p.docId,
        label: lang === 'ar' ? p.name_ar : p.name_en
      }))
    ];
  }, [programs, lang]);

  const subjectOptions = useMemo(() => {
    return [
      { value: 'all', label: lang === 'ar' ? 'كل المواد' : 'All Subjects' },
      ...subjects.map(s => ({
        value: s.id || s.docId,
        label: lang === 'ar' ? s.name_ar : s.name_en
      }))
    ];
  }, [subjects, lang]);

  const studentOptions = useMemo(() => {
    return [
      { value: '', label: lang === 'ar' ? 'اختر طالب' : 'Select Student' },
      ...studentsList.map(s => ({
        value: s.id || s.uid,
        label: s.displayName || s.email
      }))
    ];
  }, [studentsList, lang]);

  const viewModeOptions = [
    { value: 'timeline', label: lang === 'ar' ? 'عرض الجدول الزمني' : 'Timeline View' },
    { value: 'list', label: lang === 'ar' ? 'عرض القائمة' : 'List View' }
  ];

  const detailViewTabs = [
    { id: 'overview', label: lang === 'ar' ? 'نظرة عامة' : 'Overview' },
    { id: 'tasks', label: lang === 'ar' ? 'المهام' : 'Tasks' },
    { id: 'attendance', label: lang === 'ar' ? 'الحضور' : 'Attendance' },
    { id: 'performance', label: lang === 'ar' ? 'الأداء' : 'Performance' },
    { id: 'marks', label: lang === 'ar' ? 'الدرجات' : 'Marks' },
    { id: 'penalties', label: lang === 'ar' ? 'العقوبات' : 'Penalties' },
    { id: 'participations', label: lang === 'ar' ? 'المشاركات' : 'Participations' },
    { id: 'behaviors', label: lang === 'ar' ? 'السلوك' : 'Behaviors' }
  ];

  // Auth loading check
  if (authLoading) {
    return <GlobalLoadingFallback />;
  }

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!user) return;

    let stopped = false;
    const stopGlobalLoading = startLoading();
    const safeStop = () => {
      if (stopped) return;
      stopped = true;
      stopGlobalLoading();
    };

    const loadData = async () => {
      try {
        await reload(); // Use the reload function from useDashboardData
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        safeStop();
      }
    };

    loadData();

    return () => {
      safeStop();
    };
  }, [authLoading, user, reload, startLoading]);

  return (
    <div className={styles.dashboard} ref={exportRef}>
      <Container maxWidth="xxl">
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerTitle}>
              <h1>{lang === 'ar' ? 'لوحة تحكم الطالب' : 'Student Dashboard'}</h1>
              <p className={styles.subtitle}>
                {displayName} - {lang === 'ar' ? 'الرحلة الأكاديمية' : 'Academic Journey'}
              </p>
            </div>
            
            <div className={styles.headerActions}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={exporting}
              >
                {getThemedIcon('ui', 'download', 16, theme)}
                {lang === 'ar' ? 'تصدير PDF' : 'Export PDF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportImage}
                disabled={exporting}
              >
                {getThemedIcon('ui', 'file', 16, theme)}
                {lang === 'ar' ? 'تصدير صورة' : 'Export Image'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
              >
                {getThemedIcon('ui', 'file_text', 16, theme)}
                {lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}
              </Button>
            </div>
          </div>

          {(isAdmin || isInstructor || isHR) && (
            <div className={styles.filters}>
              <Select
                value={selectedStudent || ''}
                onChange={(e) => setSelectedStudent(e.target.value || null)}
                options={studentOptions}
                placeholder={lang === 'ar' ? 'اختر طالب' : 'Select Student'}
              />
              <Select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                options={programOptions}
              />
              <Select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                options={subjectOptions}
              />
            </div>
          )}
        </div>

        <StatsCards stats={statsData} theme={theme} lang={lang} t={t} />

        {viewMode === 'timeline' && (
          <>
            <TimelineNavigation
              semesters={semesters}
              activeSemester={activeSemester}
              onSemesterClick={handleSemesterClick}
            />

            {activeSemesterData && (
              <div className={styles.semesterContent}>
                <div className={styles.semesterHeader}>
                  <h2>
                    {activeSemesterData.semester} {activeSemesterData.year}
                  </h2>
                  <div className={styles.semesterStats}>
                    <Badge variant="info">
                      {activeSemesterData.courseCount} {lang === 'ar' ? 'مقررات' : 'Courses'}
                    </Badge>
                    <Badge variant="success">
                      {lang === 'ar' ? 'المعدل' : 'GPA'}: {activeSemesterData.gpa?.toFixed(2) || '0.00'}
                    </Badge>
                    <Badge variant="warning">
                      {lang === 'ar' ? 'الحضور' : 'Attendance'}: {activeSemesterData.stats?.attendanceRate?.toFixed(1) || 0}%
                    </Badge>
                  </div>
                </div>

                <div className={styles.coursesGrid}>
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                      <CourseCard
                        key={course.id || course.docId}
                        course={course}
                        theme={theme}
                        lang={lang}
                        onClick={() => navigate(`/classes/${course.classId}`)}
                      />
                    ))
                  ) : (
                    <EmptyState
                      message={lang === 'ar' ? 'لا توجد مقررات في هذا الفصل' : 'No courses in this semester'}
                    />
                  )}
                </div>

                {allActivities && allActivities.length > 0 && (
                  <div className={styles.activitySection}>
                    <ActivityFeed
                      activities={allActivities}
                      theme={theme}
                      lang={lang}
                      maxItems={15}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className={styles.detailsSection}>
          <Tabs
            tabs={detailViewTabs}
            activeTab={detailView}
            onTabChange={setDetailView}
          />

          <div className={styles.detailContent}>
            {detailView === 'overview' && (
              <OverviewView
                urgentTasks={submissions.filter(s => s.status === 'pending' || !s.status)}
                tasks={submissions}
                attendance={attendance}
                enrollments={enrollments}
                theme={theme}
                lang={lang}
                t={t}
              />
            )}
            {detailView === 'tasks' && (
              <ModernTasksView
                submissions={submissions}
                activities={allActivities}
              />
            )}
            {detailView === 'attendance' && (
              <AttendanceView
                attendance={attendance}
                theme={theme}
                lang={lang}
                t={t}
              />
            )}
            {detailView === 'performance' && (
              <PerformanceView
                marks={marks}
                enrollments={enrollments}
                theme={theme}
                lang={lang}
                t={t}
              />
            )}
            {detailView === 'marks' && (
              <div className={styles.marksGrid}>
                {marks.length > 0 ? (
                  marks.map((mark, index) => (
                    <Card key={mark.id || index}>
                      <CardBody>
                        <div className={styles.markItem}>
                          <div className={styles.markHeader}>
                            <h4>{mark.className || mark.courseName}</h4>
                            <Badge variant={mark.grade?.startsWith('A') ? 'success' : 'warning'}>
                              {mark.grade || 'N/A'}
                            </Badge>
                          </div>
                          <div className={styles.markDetails}>
                            <span>{lang === 'ar' ? 'الدرجة' : 'Mark'}: {mark.totalMarks || 0}%</span>
                            <span>{lang === 'ar' ? 'النقاط' : 'Points'}: {mark.points || 0}</span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <EmptyState message={lang === 'ar' ? 'لا توجد درجات' : 'No marks available'} />
                )}
              </div>
            )}
            {detailView === 'penalties' && (
              <div className={styles.recordsGrid}>
                {penalties.length > 0 ? (
                  penalties.map((penalty, index) => (
                    <Card key={penalty.id || index}>
                      <CardBody>
                        <div className={styles.recordItem}>
                          <Badge variant="danger">
                            {getTypeLabel(TYPE_CATEGORIES.PENALTY, penalty.type, lang)}
                          </Badge>
                          <p>{penalty.reason || penalty.notes}</p>
                          <span className={styles.recordDate}>
                            {new Date(penalty.date).toLocaleDateString(lang === 'ar' ? 'ar-QA' : 'en-US')}
                          </span>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <EmptyState message={lang === 'ar' ? 'لا توجد عقوبات' : 'No penalties'} />
                )}
              </div>
            )}
            {detailView === 'participations' && (
              <div className={styles.recordsGrid}>
                {participations.length > 0 ? (
                  participations.map((participation, index) => (
                    <Card key={participation.id || index}>
                      <CardBody>
                        <div className={styles.recordItem}>
                          <Badge variant="success">
                            {getTypeLabel(TYPE_CATEGORIES.PARTICIPATION, participation.type, lang)}
                          </Badge>
                          <p>{participation.notes || participation.description}</p>
                          <span className={styles.recordDate}>
                            {new Date(participation.date).toLocaleDateString(lang === 'ar' ? 'ar-QA' : 'en-US')}
                          </span>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <EmptyState message={lang === 'ar' ? 'لا توجد مشاركات' : 'No participations'} />
                )}
              </div>
            )}
            {detailView === 'behaviors' && (
              <div className={styles.recordsGrid}>
                {behaviors.length > 0 ? (
                  behaviors.map((behavior, index) => (
                    <Card key={behavior.id || index}>
                      <CardBody>
                        <div className={styles.recordItem}>
                          <Badge variant="warning">
                            {getTypeLabel(TYPE_CATEGORIES.BEHAVIOR, behavior.type, lang)}
                          </Badge>
                          <p>{behavior.notes || behavior.description}</p>
                          <span className={styles.recordDate}>
                            {new Date(behavior.date).toLocaleDateString(lang === 'ar' ? 'ar-QA' : 'en-US')}
                          </span>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <EmptyState message={lang === 'ar' ? 'لا توجد سلوكيات' : 'No behaviors recorded'} />
                )}
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
