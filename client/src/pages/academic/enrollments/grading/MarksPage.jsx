import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect, useRef } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getSubjects, getPrograms } from '@services/business/programService';
import {
  getSubjectMarksDistribution,
  setSubjectMarksDistribution,
  getStudentMarks,
  updateStudentMarks,
  getAllStudentMarksReport,
  calculateLetterGrade
} from '@services/business/enrollmentMarksService';
import { getUsers } from '@services/business/userService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getClasses } from '@services/business/classService';
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger.jsx';
// OLD: import { ACTIVITY_TYPES } from '@constants/activityTypes';
// NOW: Not used in this component
import { RECORD_TYPES } from '@utils/sharedTypes';
import { ROLE_STRINGS } from '@utils/userUtils';
import { Container, Card, CardBody, Button, Input, Badge, EmptyState, useToast, Select, AdvancedDataGrid, SimpleLoading } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { ProgramsSelect } from '@ui';
import { useTheme } from '@contexts/ThemeContext';
import { getStudentMarksHistory } from '@services/business/enrollmentMarksService';
import { getThemedIcon } from '@constants/iconTypes';
import { CollapsibleSideWindow } from '@ui';
import BehaviorPage from '../../../operations/behavior/BehaviorPage';
import PenaltiesPage from '../../../operations/penalty/PenaltiesPage';
import ParticipationPage from '../../../operations/participation/ParticipationPage';
import MarksHistoryDrawer from '@components/academic/MarksHistoryDrawer';
import styles from './EnrollmentsMarksPage.module.css';

const MarksPage = () => {
  const { user, isAdmin, isSuperAdmin, isInstructor, loading: authLoading } = useAuth();
  const { lang, t } = useLang();
  const { theme, isDarkMode } = useTheme();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [marksDistribution, setMarksDistribution] = useState(null);
  const [studentMarks, setStudentMarks] = useState({});
  const [marksReportData, setMarksReportData] = useState([]);
  const [marksReportLoading, setMarksReportLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    midTermExam: 0,
    finalExam: 0,
    homework: 0,
    labsProjectResearch: 0,
    quizzes: 0,
    participation: 0,
    attendance: 0
  });
  const [editingDistribution, setEditingDistribution] = useState(false);
  const [distributionForm, setDistributionForm] = useState({
    midTermExam: 20,
    finalExam: 40,
    homework: 5,
    labsProjectResearch: 10,
    quizzes: 5,
    participation: 10,
    attendance: 10
  });

  const [showNotificationNote, setShowNotificationNote] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Filters
  const [programFilter, setProgramFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [repeatedFilter, setRepeatedFilter] = useState(''); // '', 'true', 'false'

  // Side window state
  const [sideWindowOpen, setSideWindowOpen] = useState(false);
  const [sideWindowContent, setSideWindowContent] = useState(null);
  const [sideWindowStudent, setSideWindowStudent] = useState(null);
  const [sideWindowFilters, setSideWindowFilters] = useState({});

  const selectedSubject = useMemo(() => {
    if (subjectFilter === '') return null;
    
    // Try multiple matching strategies
    const subject = subjects.find((s) => {
      const id1 = s.docId || s.id;
      const id2 = subjectFilter;
      
      // Try direct string match
      if (String(id1) === String(id2)) return true;
      
      // Try converting both to numbers
      const num1 = Number(id1);
      const num2 = Number(id2);
      if (!isNaN(num1) && !isNaN(num2) && num1 === num2) return true;
      
      return false;
    }) || null;
    
    return subject;
  }, [subjectFilter, subjects]);

  // Memoized students with enrollment counts per subject
  const studentsWithSubjectCounts = useMemo(() => {
    const subjectEnrollmentMap = {};
    
    enrollments.forEach(enrollment => {
      const subjectId = enrollment.subjectId;
      if (!subjectEnrollmentMap[subjectId]) {
        subjectEnrollmentMap[subjectId] = 0;
      }
      subjectEnrollmentMap[subjectId]++;
    });
    
    return students.map(student => ({
      ...student,
      enrollments: student.enrollments || [],
      subjectCounts: subjectEnrollmentMap
    }));
  }, [students, enrollments]);

  // Helper function to get enrollment count for a subject
  const getSubjectEnrollmentCount = useCallback((subjectId) => {
    return enrollments.filter(e => e.subjectId === subjectId).length;
  }, [enrollments]);

  // Available years from classes
  const availableYears = useMemo(() => {
    const years = new Set();
    classes.forEach(cls => {
      if (cls.year) {
        years.add(String(cls.year));
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [classes]);

  // Available terms from classes
  const availableTerms = useMemo(() => {
    const terms = new Set();
    classes.forEach(cls => {
      if (cls.term) {
        terms.add(cls.term);
      }
    });
    return Array.from(terms).sort();
  }, [classes]);
  const getSelectValue = useCallback((eventOrValue) => {
    if (eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue) {
      return eventOrValue.target?.value ?? '';
    }
    return eventOrValue ?? '';
  }, []);

  // Load marks report data
  const loadMarksReport = useCallback(async () => {
    setMarksReportLoading(true);
    try {
      const filters = {};
      if (programFilter) filters.programId = programFilter;
      if (subjectFilter) filters.subjectId = subjectFilter;
      if (classFilter) filters.classId = classFilter;
      if (yearFilter) filters.year = yearFilter;
      if (termFilter) filters.term = termFilter;
      if (repeatedFilter) filters.isRepeated = repeatedFilter;

      const result = await getAllStudentMarksReport(filters);
      
      if (result.success) {
        setMarksReportData(result.data);
      } else {
        error('[MarksPage] Error loading marks report:', result.error);
      }
    } catch (err) {
      error('[MarksPage] Error loading marks report:', err);
    } finally {
      setMarksReportLoading(false);
    }
  }, [programFilter, subjectFilter, classFilter, yearFilter, termFilter, repeatedFilter]);

  // Load marks report when filters change
  useEffect(() => {
    loadMarksReport();
  }, [loadMarksReport]);

  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) setLoading(true);
    try {
      const [programsRes, subjectsRes, classesRes, enrollmentsRes] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getClasses(),
        getEnrollments()
      ]);
      
      if (programsRes.success) setPrograms(programsRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      if (classesRes.success) setClasses(classesRes.data || []);
      if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data || []);
      
      // Extract students from enrollments and get real student data
      const enrollmentStudents = enrollmentsRes.data || [];
      const studentIds = [...new Set(enrollmentStudents.map(e => e.userId).filter(Boolean))];
      
      // Create students array with enrollment info
      const studentsWithEnrollment = studentIds.map(id => {
        const enrollment = enrollmentStudents.find(e => e.userId === id);
        return {
          uid: id,
          docId: id,
          id: id,
          displayName: enrollment?.user?.displayName || enrollment?.user?.realName || `Student ${id}`,
          email: enrollment?.user?.email || `student${id}@example.com`,
          enrollments: enrollmentStudents.filter(e => e.userId === id)
        };
      });
      setStudents(studentsWithEnrollment);
      
    } catch (error) {
      error('[MarksPage] Error loading data:', error);
      toast?.error?.('Error loading data');
    } finally {
      setLoading(false);
    }
  }, []); // Remove t and toast dependencies to prevent re-renders

  const loadMarksDistribution = useCallback(async () => {
    if (!selectedSubject) return;
    
    try {
      const result = await getSubjectMarksDistribution(selectedSubject.docId || selectedSubject.id);
      
      if (result.success) {
        setMarksDistribution(result.data);
      } else {
        error('[MarksPage] Error loading marks distribution:', result.error);
        toast?.error?.(result.error || t('error_loading_distribution') || 'Error loading marks distribution');
      }
    } catch (error) {
      error('[MarksPage] Error loading marks distribution:', error);
      toast?.error?.(t('error_loading_distribution') || 'Error loading marks distribution');
    }
  }, [selectedSubject, t, toast]);

  const loadStudentMarks = useCallback(async () => {
    if (!selectedSubject) return;
    
    try {
      const result = await getStudentMarks(selectedSubject.docId || selectedSubject.id);
      if (result.success) {
        setStudentMarks(result.data || {});
      } else {
        error('[MarksPage] Error loading student marks:', result.error);
        toast?.error?.(result.error || t('error_loading_marks') || 'Error loading student marks');
      }
    } catch (error) {
      error('[MarksPage] Error loading student marks:', error);
      toast?.error?.(t('error_loading_marks') || 'Error loading student marks');
    }
  }, [selectedSubject, t, toast]);

  // Initial load with Global Loading - run only once
  useLayoutEffect(() => {
    let stopLoading = null;

    const initialLoad = async () => {
      stopLoading = startLoading({ message: 'Loading marks...' });
      await loadData(true);
      if (stopLoading) stopLoading();
      setLoading(false);
    };

    initialLoad();

    return () => {
      if (stopLoading) stopLoading();
    };
  }, []); // Remove dependencies to run only once

  // Load marks data when subject changes
  useEffect(() => {
    if (selectedSubject) {
      loadMarksDistribution();
      loadStudentMarks();
    } else {
      setMarksDistribution(null);
      setStudentMarks({});
    }
  }, [selectedSubject, loadMarksDistribution, loadStudentMarks]);

  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      if (subjectFilter && c.subjectId !== subjectFilter) return false;
      if (programFilter) {
        const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
        if (subject?.programId !== programFilter) return false;
      }
      return true;
    });
  }, [classes, subjectFilter, programFilter, subjects]);

  // Load marks history for a student
  const loadMarksHistory = useCallback(async (student) => {
    try {
      setHistoryLoading(true);
      const studentId = student.studentId || student.id || student.userId;
      const subjectId = student.subjectId;
      const classId = student.classId;
      
      const result = await getStudentMarksHistory(studentId, subjectId, classId);
      
      if (result.success) {
        setHistoryData(result.data);
        setSelectedStudent(student);
        setShowHistoryDrawer(true);
      } else {
        toast?.error?.(result.error || 'Failed to load marks history');
      }
    } catch (error) {
      console.error('Error loading marks history:', error);
      toast?.error?.('Failed to load marks history');
    } finally {
      setHistoryLoading(false);
    }
  }, [toast]);

  // Filters state is below

  const handleEditMarks = useCallback((student) => {
    setEditingStudent(student);
    const studentId = student.docId || student.id || student.uid;
    const marks = studentMarks[studentId] || {};
    setFormData({
      midTermExam: marks.midTermExam || 0,
      finalExam: marks.finalExam || 0,
      homework: marks.homework || 0,
      labsProjectResearch: marks.labsProjectResearch || 0,
      quizzes: marks.quizzes || 0,
      participation: marks.participation || 0,
      attendance: marks.attendance || 0
    });
    setShowModal(true);
  }, [studentMarks]);

  const columns = useMemo(() => [
    {
      field: 'studentName',
      headerName: t('user') || 'User',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        const student = students.find(s => (s.docId || s.id || s.uid) === rowId);
        const enrollment = enrollments.find(e => e.userId === rowId && e.subjectId === subjectFilter);
        
        if (!student) return rowId || 'Unknown';
        
        const filters = {
          programId: programFilter,
          subjectId: subjectFilter,
          classId: enrollment?.classId || ''
        };

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                {student.displayName || student.realName || student.email || 'Unknown'}
              </div>
              <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                {student.email || 'No email'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <Button
                variant="ghost"
                size="sm"
                icon={getThemedIcon('penalty_type', 'cheating', 14, theme)}
                onClick={() => openSideWindow(RECORD_TYPES.PENALTY, student, filters)}
              >
                {t('penalties') || 'Penalties'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={getThemedIcon('behavior_type', 'disruptive', 14, theme)}
                onClick={() => openSideWindow(RECORD_TYPES.BEHAVIOR, student, filters)}
              >
                {t('behaviors') || 'Behaviors'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={getThemedIcon('ui', 'award', 14, theme)}
                onClick={() => openSideWindow(RECORD_TYPES.PARTICIPATION, student, filters)}
              >
                {t('participation') || 'Participation'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={getThemedIcon('ui', 'eye', 14, theme)}
                onClick={() => openSideWindow('sneakpeek', student, filters)}
              >
                {t('peek') || 'Peek'}
              </Button>
            </div>
          </div>
        );
      }
    },
    {
      field: 'midTermExam',
      headerName: t('mid_term') || 'Mid-Term',
      width: 100,
      editable: true,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const maxMarks = marksDistribution?.midTermExam || 20;
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= maxMarks ? '#dc2626' : value >= maxMarks * 0.6 ? '#f59e0b' : '#10b981',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value}/{maxMarks}
          </div>
        );
      }
    },
    {
      field: 'finalExam',
      headerName: t('final') || 'Final',
      width: 100,
      editable: true,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const maxMarks = marksDistribution?.finalExam || 40;
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= maxMarks ? '#dc2626' : value >= maxMarks * 0.6 ? '#f59e0b' : '#10b981',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value}/{maxMarks}
          </div>
        );
      }
    },
    {
      field: 'homework',
      headerName: t('homework') || 'Homework',
      width: 100,
      editable: true,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const maxMarks = marksDistribution?.homework || 5;
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= maxMarks ? '#dc2626' : value >= maxMarks * 0.6 ? '#f59e0b' : '#10b981',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value}/{maxMarks}
          </div>
        );
      }
    },
    {
      field: 'labsProjectResearch',
      headerName: t('labs_projects_research') || 'Labs/Projects/Research',
      width: 150,
      editable: true,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const maxMarks = marksDistribution?.labsProjectResearch || 10;
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= maxMarks ? '#dc2626' : value >= maxMarks * 0.6 ? '#f59e0b' : '#10b981',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value}/{maxMarks}
          </div>
        );
      }
    },
    {
      field: 'quizzes',
      headerName: t('quizzes') || 'Quizzes',
      width: 100,
      editable: true,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const maxMarks = marksDistribution?.quizzes || 5;
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= maxMarks ? '#dc2626' : value >= maxMarks * 0.6 ? '#f59e0b' : '#10b981',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value}/{maxMarks}
          </div>
        );
      }
    },
    {
      field: 'participation',
      headerName: t('participation') || 'Participation',
      width: 120,
      editable: true,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const maxMarks = marksDistribution?.participation || 10;
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= maxMarks ? '#dc2626' : value >= maxMarks * 0.6 ? '#f59e0b' : '#10b981',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value}/{maxMarks}
          </div>
        );
      }
    },
    {
      field: 'attendance',
      headerName: t('attendance') || 'Attendance',
      width: 100,
      editable: true,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const maxMarks = marksDistribution?.attendance || 10;
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= maxMarks ? '#dc2626' : value >= maxMarks * 0.6 ? '#f59e0b' : '#10b981',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value}/{maxMarks}
          </div>
        );
      }
    },
    {
      field: 'totalScore',
      headerName: t('total_marks') || 'Total Marks',
      width: 120,
      type: 'number',
      editable: false,
      renderCell: (params) => {
        const value = params.value || 0;
        const maxTotal = 100; // Total is always out of 100 after weighting
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= 90 ? '#dc2626' : value >= 80 ? '#f59e0b' : value >= 70 ? '#fbbf24' : value >= 60 ? '#60a5fa' : '#ef4444',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value.toFixed(2)}%
          </div>
        );
      }
    }
  ], [t, marksDistribution, theme, enrollments, programFilter, students, subjectFilter]);

  if (authLoading) return <GlobalLoadingFallback />;
  if (!isAdmin && !isSuperAdmin && !isInstructor) return <Navigate to="/" replace />;

  const renderSideWindowContent = () => {
    if (!sideWindowContent || !sideWindowStudent) return null;
    switch (sideWindowContent) {
      case RECORD_TYPES.BEHAVIOR:
        return (
          <BehaviorPage
            isDashboardTab
            initialFilters={sideWindowFilters}
            hideActions
          />
        );
      case RECORD_TYPES.PENALTY:
        return (
          <PenaltiesPage
            isDashboardTab
            initialFilters={sideWindowFilters}
            hideActions
          />
        );
      case RECORD_TYPES.PARTICIPATION:
        return (
          <ParticipationPage
            isDashboardTab
            initialFilters={sideWindowFilters}
            hideActions
          />
        );
      case 'sneakpeek':
        return (
          <div style={{ padding: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>{t('student_overview') || 'Student Overview'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong>{t('name') || 'Name'}:</strong> {sideWindowStudent.displayName || sideWindowStudent.email}
              </div>
              <div>
                <strong>{t('email') || 'Email'}:</strong> {sideWindowStudent.email}
              </div>
              {(() => {
                const studentId = sideWindowStudent.uid || sideWindowStudent.docId || sideWindowStudent.id;
                const marks = studentMarks[studentId];
                return marks && (
                  <div>
                    <strong>{t('current_marks') || 'Current Marks'}:</strong>
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div>{t('total_score') || 'Total Score'}: {marks.totalScore?.toFixed?.(2) || 0}</div>
                      <div>{t('grade') || 'Grade'}: {marks.grade || 'N/A'}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const openSideWindow = (content, student, filters) => {
    setSideWindowContent(content);
    setSideWindowStudent(student);
    setSideWindowFilters(filters);
    setSideWindowOpen(true);
  };

  const closeSideWindow = () => {
    setSideWindowOpen(false);
    setSideWindowContent(null);
    setSideWindowStudent(null);
    setSideWindowFilters({});
  };

  return (
    <Container maxWidth="xl" className={styles.page} style={{ padding: '1rem 0' }}>
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            <ProgramsSelect
              programs={programs}
              subjects={subjects}
              classes={classes}
              selectedProgram={programFilter}
              selectedSubject={subjectFilter}
              selectedClass={classFilter}
              onProgramChange={(val) => { setProgramFilter(val); setSubjectFilter(''); setClassFilter(''); }}
              onSubjectChange={(val) => { setSubjectFilter(val); setClassFilter(''); }}
              onClassChange={(val) => setClassFilter(val)}
              showLabels={false}
              fullWidth
            />
          </div>
        </CardBody>
      </Card>

      {selectedSubject && marksDistribution && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div className={styles.distributionGrid} style={{ flex: 1, marginRight: '0.5rem' }}>
                <div>{t('mid_term') || 'Mid-Term'} {marksDistribution.midTermExam}%</div>
                <div>{t('final') || 'Final'} {marksDistribution.finalExam}%</div>
                <div>{t('homework') || 'Homework'} {marksDistribution.homework}%</div>
                <div>{t('labs_projects_research') || 'Labs/Projects/Research'} {marksDistribution.labsProjectResearch}%</div>
                <div>{t('quizzes') || 'Quizzes'} {marksDistribution.quizzes}%</div>
                <div>{t('participation') || 'Participation'} {marksDistribution.participation}%</div>
                <div>{t('attendance') || 'Attendance'} {marksDistribution.attendance}%</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDistributionForm({
                    midTermExam: marksDistribution.midTermExam || 20,
                    finalExam: marksDistribution.finalExam || 40,
                    homework: marksDistribution.homework || 5,
                    labsProjectResearch: marksDistribution.labsProjectResearch || 10,
                    quizzes: marksDistribution.quizzes || 5,
                    participation: marksDistribution.participation || 10,
                    attendance: marksDistribution.attendance || 10,
                  });
                  setEditingDistribution(true);
                }}
                style={{ display: 'flex', alignItems: 'center', padding: '0.25rem 0.5rem' }}
              >
                {getThemedIcon('ui', 'settings', 14, theme)}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {editingDistribution && selectedSubject && (
        <Card style={{ marginBottom: '1rem', background: '#fef3c7', border: '1px solid #fbbf24' }}>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>{t('edit_marks_distribution') || 'Edit Marks Distribution'}</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingDistribution(false)}>
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const total = (
                  (distributionForm.midTermExam || 0) +
                  (distributionForm.finalExam || 0) +
                  (distributionForm.homework || 0) +
                  (distributionForm.labsProjectResearch || 0) +
                  (distributionForm.quizzes || 0) +
                  (distributionForm.participation || 0) +
                  (distributionForm.attendance || 0)
                );
                if (Math.abs(total - 100) > 0.01) {
                  toast?.error?.(t('distribution_must_sum_100') || 'Distribution must sum to 100%');
                  return;
                }

                try {
                  await setSubjectMarksDistribution(selectedSubject.docId || selectedSubject.id, distributionForm);
                  setEditingDistribution(false);
                  toast?.success?.('Distribution updated');
                  // Reload just the marks distribution, not all data
                  const result = await getSubjectMarksDistribution(selectedSubject.docId || selectedSubject.id);
                  if (result.success) {
                    setMarksDistribution(result.data);
                  }
                  await logActivity({
                    type: ACTIVITY_LOG_TYPES.MARKS_DISTRIBUTION_UPDATED,
                    details: { subjectId: selectedSubject.docId || selectedSubject.id, distribution: distributionForm }
                  });
                } catch (error) {
                  error('[MarksPage] Error updating distribution:', error);
                  toast?.error?.(t('error_updating_distribution') || 'Error updating distribution');
                }
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label>{t('mid_term') || 'Mid-Term'} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={distributionForm.midTermExam}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, midTermExam: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('final') || 'Final'} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={distributionForm.finalExam}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, finalExam: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('homework') || 'Homework'} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={distributionForm.homework}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, homework: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('labs_projects_research') || 'Labs/Projects/Research'} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={distributionForm.labsProjectResearch}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, labsProjectResearch: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('quizzes') || 'Quizzes'} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={distributionForm.quizzes}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, quizzes: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('participation') || 'Participation'} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={distributionForm.participation}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, participation: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('attendance') || 'Attendance'} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={distributionForm.attendance}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, attendance: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  {t('total') || 'Total'}: {(
                    (distributionForm.midTermExam || 0) +
                    (distributionForm.finalExam || 0) +
                    (distributionForm.homework || 0) +
                    (distributionForm.labsProjectResearch || 0) +
                    (distributionForm.quizzes || 0) +
                    (distributionForm.participation || 0) +
                    (distributionForm.attendance || 0)
                  )}%
                </div>
                <Button type="submit" variant="primary">
                  {t('save') || 'Save'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {selectedSubject && (
        <Card>
          <CardBody>
            <div style={{ marginBottom: '1rem' }}>
              {/* Additional Filters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: '1rem' }}>
              <Select
                searchable
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                options={[
                  { value: '', label: t('all_years') || 'All Years' },
                  ...availableYears.map(year => ({ value: year, label: year }))
                ]}
                fullWidth
              />
              <Select
                searchable
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                options={[
                  { value: '', label: t('all_terms') || 'All Terms' },
                  ...availableTerms.map(term => ({ value: term, label: term }))
                ]}
                fullWidth
              />
              <Select
                searchable
                value={repeatedFilter}
                onChange={(e) => setRepeatedFilter(e.target.value)}
                options={[
                  { value: '', label: t('all') || 'All' },
                  { value: 'false', label: t('first_attempt') || 'First Attempt' },
                  { value: 'true', label: t('repeated') || 'Repeated' }
                ]}
                fullWidth
              />
            </div>
            
            {marksReportLoading && !marksReportData.length ? (
              <SimpleLoading loading type="spinner" size="md" />
            ) : marksReportData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>{t('no_students_found') || 'No students found for the selected filters'}</p>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>
                  {t('try_different_filters') || 'Try adjusting your filters or check if students are enrolled'}
                </p>
              </div>
            ) : (
              <AdvancedDataGrid
                key={`marks-grid-${subjectFilter}-${marksReportData.length}`}
                rows={marksReportData.filter(row => row.subjectId == subjectFilter)}
                columns={[
                  {
                    field: 'studentNumber',
                    headerName: t('student_number') || 'Student No.',
                    width: 100,
                    editable: false,
                    renderCell: (params) => {
                      const row = params?.row || {};
                      const value = row.studentNumber || row.studentId || '';
                      return <span>{value}</span>;
                    }
                  },
                  {
                    field: 'studentName',
                    headerName: t('student_name') || 'Student Name',
                    flex: 1,
                    minWidth: 180,
                    editable: false
                  },
                  {
                    field: 'programName',
                    headerName: t('program') || 'Program',
                    flex: 1,
                    minWidth: 120,
                    editable: false
                  },
                  {
                    field: 'subjectName',
                    headerName: t('subject') || 'Subject',
                    flex: 1,
                    minWidth: 120,
                    editable: false
                  },
                  {
                    field: 'className',
                    headerName: t('class') || 'Class',
                    flex: 1,
                    minWidth: 120,
                    editable: false
                  },
                  {
                    field: 'midTermExam',
                    headerName: t('mid_term') || 'Mid-Term',
                    width: 90,
                    editable: true,
                    type: 'number',
                    valueParser: (value) => {
                      const num = parseFloat(value);
                      const max = marksDistribution?.midTermExam || 20;
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    renderCell: (params) => {
                      const value = params.value || 0;
                      const max = marksDistribution?.midTermExam || 20;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span>{value}/{max}</span>
                        </div>
                      );
                    }
                  },
                  {
                    field: 'finalExam',
                    headerName: t('final') || 'Final',
                    width: 90,
                    editable: true,
                    type: 'number',
                    valueParser: (value) => {
                      const num = parseFloat(value);
                      const max = marksDistribution?.finalExam || 40;
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    renderCell: (params) => {
                      const value = params.value || 0;
                      const max = marksDistribution?.finalExam || 40;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span>{value}/{max}</span>
                        </div>
                      );
                    }
                  },
                  {
                    field: 'homework',
                    headerName: t('homework') || 'Homework',
                    width: 90,
                    editable: true,
                    type: 'number',
                    valueParser: (value) => {
                      const num = parseFloat(value);
                      const max = marksDistribution?.homework || 5;
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    renderCell: (params) => {
                      const value = params.value || 0;
                      const max = marksDistribution?.homework || 5;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span>{value}/{max}</span>
                        </div>
                      );
                    }
                  },
                  {
                    field: 'labsProjectResearch',
                    headerName: t('labs') || 'Labs',
                    width: 90,
                    editable: true,
                    type: 'number',
                    valueParser: (value) => {
                      const num = parseFloat(value);
                      const max = marksDistribution?.labsProjectResearch || 10;
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    renderCell: (params) => {
                      const value = params.value || 0;
                      const max = marksDistribution?.labsProjectResearch || 10;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span>{value}/{max}</span>
                        </div>
                      );
                    }
                  },
                  {
                    field: 'quizzes',
                    headerName: t('quizzes') || 'Quizzes',
                    width: 90,
                    editable: true,
                    type: 'number',
                    valueParser: (value) => {
                      const num = parseFloat(value);
                      const max = marksDistribution?.quizzes || 5;
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    renderCell: (params) => {
                      const value = params.value || 0;
                      const max = marksDistribution?.quizzes || 5;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span>{value}/{max}</span>
                        </div>
                      );
                    }
                  },
                  {
                    field: 'participation',
                    headerName: t('participation') || 'Participation',
                    width: 90,
                    editable: true,
                    type: 'number',
                    valueParser: (value) => {
                      const num = parseFloat(value);
                      const max = marksDistribution?.participation || 10;
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    renderCell: (params) => {
                      const value = params.value || 0;
                      const max = marksDistribution?.participation || 10;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span>{value}/{max}</span>
                        </div>
                      );
                    }
                  },
                  {
                    field: 'attendance',
                    headerName: t('attendance') || 'Attendance',
                    width: 90,
                    editable: true,
                    type: 'number',
                    valueParser: (value) => {
                      const num = parseFloat(value);
                      const max = marksDistribution?.attendance || 10;
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    renderCell: (params) => {
                      const value = params.value || 0;
                      const max = marksDistribution?.attendance || 10;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span>{value}/{max}</span>
                        </div>
                      );
                    }
                  },
                  {
                    field: 'gradeType',
                    headerName: t('grade_type') || 'Grade Type',
                    width: 120,
                    editable: true,
                    type: 'singleSelect',
                    valueOptions: [
                      { value: 'calculated', label: t('calculated') || 'Calculated' },
                      { value: 'FB', label: 'FB - Fail Due to Absence' },
                      { value: 'FA', label: 'FA - Fail Due to Absence' },
                      { value: 'WF', label: 'WF - Withdrawal' }
                    ],
                    renderCell: (params) => {
                      const value = params.value || 'calculated';
                      const options = {
                        'calculated': t('calculated') || 'Calculated',
                        'FB': 'FB - Fail Due to Absence',
                        'FA': 'FA - Fail Due to Absence',
                        'WF': 'WF - Withdrawal'
                      };
                      return (
                        <div style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          background: value === 'calculated' ? '#e5e7eb' : '#fef3c7',
                          color: value === 'calculated' ? '#374151' : '#92400e',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 500
                        }}>
                          {options[value] || value}
                        </div>
                      );
                    }
                  },
                  {
                    field: 'totalMarks',
                    headerName: t('total') || 'Total',
                    width: 100,
                    editable: false,
                    renderCell: (params) => {
                      const row = params.row;
                      const gradeType = row.gradeType || 'calculated';
                      
                      // For manual grades, show the grade letter instead of percentage
                      if (gradeType !== 'calculated') {
                        return (
                          <div style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            background: '#dc2626',
                            color: 'white',
                            textAlign: 'center',
                            fontWeight: 600
                          }}>
                            {gradeType}
                          </div>
                        );
                      }
                      
                      const value = params.value || 0;
                      return (
                        <div style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          background: value >= 90 ? '#dc2626' : value >= 80 ? '#f59e0b' : value >= 70 ? '#fbbf24' : value >= 60 ? '#60a5fa' : '#ef4444',
                          color: 'white',
                          textAlign: 'center',
                          fontWeight: 500
                        }}>
                          {value.toFixed(1)}%
                        </div>
                      );
                    }
                  },
                  {
                    field: 'letterGrade',
                    headerName: t('grade') || 'Grade',
                    width: 80,
                    editable: false,
                    renderCell: (params) => {
                      const row = params.row;
                      const gradeType = row.gradeType || 'calculated';
                      const grade = params.value || '';
                      
                      // For manual grades, show the manual grade description
                      if (gradeType !== 'calculated') {
                        const manualGrades = {
                          'FB': { description: 'Fail Due to Absence', color: '#dc2626' },
                          'FA': { description: 'Fail Due to Absence', color: '#dc2626' },
                          'WF': { description: 'Withdrawal', color: '#6b7280' }
                        };
                        const manual = manualGrades[gradeType];
                        return (
                          <div style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            background: manual.color,
                            color: 'white',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {gradeType}
                          </div>
                        );
                      }
                      
                      // Normal calculated grades
                      let className = '';
                      if (grade === 'A+' || grade === 'A' || grade === 'A-') className = 'grade-excellent';
                      else if (grade.startsWith('B')) className = 'grade-good';
                      else if (grade.startsWith('C')) className = 'grade-average';
                      else if (grade.startsWith('D')) className = 'grade-pass';
                      else className = 'grade-fail';
                      
                      return <span className={className}>{grade}</span>;
                    }
                  },
                  // Hide these columns to save space
                  {
                    field: 'gradeRange',
                    headerName: t('range') || 'Range',
                    width: 80,
                    editable: false
                  },
                  {
                    field: 'isRepeated',
                    headerName: t('repeated') || 'Repeated',
                    width: 120,
                    editable: false,
                    renderCell: (params) => {
                      const isRepeated = Boolean(params.value);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <div
                            style={{
                              position: 'relative',
                              width: '44px',
                              height: '24px',
                              backgroundColor: isRepeated ? '#22c55e' : '#ef4444',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              border: isRepeated ? '2px solid #16a34a' : '2px solid #dc2626'
                            }}
                            onClick={async () => {
                              try {
                                // Create the updated row data with toggled isRepeated
                                const updatedRow = {
                                  ...params.row,
                                  isRepeated: !isRepeated
                                };
                                
                                // Get current marks distribution for validation
                                const distribution = marksDistribution || {
                                  midTermExam: 20,
                                  finalExam: 40,
                                  homework: 5,
                                  labsProjectResearch: 10,
                                  quizzes: 5,
                                  participation: 10,
                                  attendance: 10
                                };

                                // Create marks data
                                const marksData = {
                                  midTermExam: updatedRow.midTermExam || 0,
                                  finalExam: updatedRow.finalExam || 0,
                                  homework: updatedRow.homework || 0,
                                  labsProjectResearch: updatedRow.labsProjectResearch || 0,
                                  quizzes: updatedRow.quizzes || 0,
                                  participation: updatedRow.participation || 0,
                                  attendance: updatedRow.attendance || 0,
                                  isRepeated: updatedRow.isRepeated,
                                  gradeType: updatedRow.gradeType || 'calculated'
                                };

                                // Update the marks
                                await updateStudentMarks(
                                  updatedRow.studentId, 
                                  updatedRow.subjectId,
                                  updatedRow.classId,
                                  marksData
                                );
                                
                                // Render filtered history data to get updated grades
                                await loadMarksReport();
                                
                                // Update the local state to show immediate feedback
                                params.api.updateRows([{ id: params.id, isRepeated: !isRepeated }]);
                                
                                toast?.success?.(t('marks_updated_successfully') || 'Marks updated successfully');
                              } catch (error) {
                                console.error('Error updating isRepeated:', error);
                                toast?.error?.(error.message || 'Failed to update marks');
                              }
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                top: '2px',
                                left: isRepeated ? '20px' : '2px',
                                width: '16px',
                                height: '16px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                transition: 'left 0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            />
                          </div>
                          <span style={{ marginLeft: '8px', fontSize: '12px', color: isRepeated ? '#22c55e' : '#ef4444' }}>
                            {isRepeated ? 'Yes' : 'No'}
                          </span>
                        </div>
                      );
                    }
                  },
                  {
                    field: 'history',
                    headerName: t('history') || 'History',
                    width: 80,
                    sortable: false,
                    filterable: false,
                    renderCell: (params) => {
                      return (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => loadMarksHistory(params.row)}
                            disabled={historyLoading}
                            style={{ 
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              minWidth: '60px'
                            }}
                          >
                            {historyLoading ? (
                              <span>...</span>
                            ) : (
                              <>
                                {getThemedIcon('ui', 'clock', 14, theme)}
                                <span style={{ marginLeft: '4px' }}>{t('history') || 'History'}</span>
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    }
                  }
                ]}
                pageSize={10}
                pageSizeOptions={[10, 25, 50, 100]}
                checkboxSelection
                disableRowSelectionOnClick
                exportFileName="student-marks"
                showExportButton
                exportLabel={t('export') || 'Export'}
                loadingOverlayMessage={marksReportLoading ? (t('loading_marks') || 'Loading marks...') : undefined}
                processRowUpdate={async (newRow) => {
                  try {
                    // Get current marks distribution for validation
                    const distribution = marksDistribution || {
                      midTermExam: 20,
                      finalExam: 40,
                      homework: 5,
                      labsProjectResearch: 10,
                      quizzes: 5,
                      participation: 10,
                      attendance: 10
                    };
                    
                    // Validate marks against distribution
                    const validationErrors = [];
                    if (newRow.midTermExam > distribution.midTermExam) validationErrors.push(`Mid-term exam cannot exceed ${distribution.midTermExam}`);
                    if (newRow.finalExam > distribution.finalExam) validationErrors.push(`Final exam cannot exceed ${distribution.finalExam}`);
                    if (newRow.homework > distribution.homework) validationErrors.push(`Homework cannot exceed ${distribution.homework}`);
                    if (newRow.labsProjectResearch > distribution.labsProjectResearch) validationErrors.push(`Labs/Projects cannot exceed ${distribution.labsProjectResearch}`);
                    if (newRow.quizzes > distribution.quizzes) validationErrors.push(`Quizzes cannot exceed ${distribution.quizzes}`);
                    if (newRow.participation > distribution.participation) validationErrors.push(`Participation cannot exceed ${distribution.participation}`);
                    if (newRow.attendance > distribution.attendance) validationErrors.push(`Attendance cannot exceed ${distribution.attendance}`);
                    
                    if (validationErrors.length > 0) {
                      toast?.error?.(validationErrors.join(', '));
                      throw new Error('Validation failed');
                    }
                    
                    const marksData = {
                      midTermExam: newRow.midTermExam || 0,
                      finalExam: newRow.finalExam || 0,
                      homework: newRow.homework || 0,
                      labsProjectResearch: newRow.labsProjectResearch || 0,
                      quizzes: newRow.quizzes || 0,
                      participation: newRow.participation || 0,
                      attendance: newRow.attendance || 0,
                      isRepeated: Boolean(newRow.isRepeated),
                      gradeType: newRow.gradeType || 'calculated'
                    };
                    
                    const result = await updateStudentMarks(
                      newRow.studentId, 
                      newRow.subjectId,
                      newRow.classId,
                      marksData
                    );
                    
                    if (result.success) {
                      // Refresh the marks report data to get updated calculations
                      await loadMarksReport();
                      
                      toast?.success?.(t('marks_updated') || 'Marks updated');
                    }
                    return newRow;
                  } catch (err) {
                    error('[MarksPage] Error saving marks:', err);
                    toast?.error?.(t('error_saving_marks') || 'Error saving marks');
                    throw err;
                  }
                }}
              />
            )}
            </div>
          </CardBody>
      </Card>
    )}

      <CollapsibleSideWindow
        isOpen={sideWindowOpen}
        onClose={closeSideWindow}
        title={sideWindowContent}
        student={sideWindowStudent}
        filters={sideWindowFilters}
      />

      {/* Marks History Drawer */}
      <MarksHistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        historyData={historyData}
        loading={historyLoading}
        selectedStudent={selectedStudent}
      />
    </Container>
  );
};

export default MarksPage;
