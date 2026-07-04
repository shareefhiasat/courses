import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect, useRef } from 'react';
import Joyride from 'react-joyride';
import { usePageTour } from '@hooks/usePageTour';
import { getJoyrideBaseProps, getTourStyles } from '@utils/tourConfig';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getSubjects, getPrograms } from '@services/business/programService';
import {
  getSubjectMarksDistribution,
  setSubjectMarksDistribution,
  updateStudentMarks,
  getAllStudentMarksReport,
  GRADE_TYPE,
  resolveMarkGrade,
  getGradeColor,
  getGpaStanding,
  calculateGpaFromMarks,
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
import DeductionDrawer from '@components/academic/DeductionDrawer';
import { fetchAttendanceDeductionSuggestion, fetchDeductionHistory } from '@services/business/attendanceDeductionService';
import styles from './EnrollmentsMarksPage.module.css';

const MarksPage = () => {
  const { user, isAdmin, isSuperAdmin, isInstructor, loading: authLoading } = useAuth();
  const { lang, t } = useLang();
  const { theme, isDarkMode } = useTheme();
  const toast = useToast();

  // ── Guided Tour ───────────────────────────────────────────────────────────
  const buildTourSteps = useCallback(() => [
    { target: '[data-tour="marks-filters"]',      content: t('tour.marks_filters'),  disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="marks-distribution"]', content: t('tour.marks_bulk'),     disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="marks-grid"]',         content: t('tour.marks_grid'),     disableBeacon: true, placement: 'top' },
    { target: '[data-tour="marks-export"]',       content: t('tour.marks_export'),   disableBeacon: true, placement: 'top' },
  ].filter(s => !!document.querySelector(s.target)), [t]);
  const { run: runTour, steps: activeTourSteps, callback: handleTourCallback, TourTooltipComponent } =
    usePageTour('marks', 'marksTourSeen', buildTourSteps);
  // ─────────────────────────────────────────────────────────────────────────
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

  // Deduction drawer state
  const [showDeductionDrawer, setShowDeductionDrawer] = useState(false);
  const [deductionData, setDeductionData] = useState(null);
  const [deductionHistory, setDeductionHistory] = useState([]);
  const [deductionLoading, setDeductionLoading] = useState(false);
  const [deductionStudent, setDeductionStudent] = useState(null);
  const [deductionCache, setDeductionCache] = useState({});

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

  // Per-student GPA overview when a class is selected (all subjects in class)
  const [classGpaRows, setClassGpaRows] = useState([]);
  const [gpaSearch, setGpaSearch] = useState('');
  const [selectedGpaStudent, setSelectedGpaStudent] = useState(null);
  const [hoveredTip, setHoveredTip] = useState(null);
  useEffect(() => {
    if (!classFilter) {
      setClassGpaRows([]);
      return;
    }
    (async () => {
      const filters = { classId: classFilter };
      if (yearFilter) filters.year = yearFilter;
      if (termFilter) filters.term = termFilter;
      const result = await getAllStudentMarksReport(filters);
      if (!result.success) return;
      const byStudent = new Map();
      for (const row of result.data || []) {
        const key = row.studentId;
        if (!byStudent.has(key)) {
          byStudent.set(key, { studentId: key, studentName: row.studentName, marks: [] });
        }
        byStudent.get(key).marks.push(row);
      }
      setClassGpaRows(
        Array.from(byStudent.values()).map((entry) => {
          const { gpa } = calculateGpaFromMarks(entry.marks);
          const standing = getGpaStanding(gpa, lang);
          return { ...entry, gpa, standing: standing.label };
        }).sort((a, b) => a.studentName.localeCompare(b.studentName))
      );
    })();
  }, [classFilter, yearFilter, termFilter, lang]);

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
          profileImageUrl: enrollment?.user?.profileImageUrl || null,
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
        toast?.error?.(result.error || t('error_loading_distribution'));
      }
    } catch (error) {
      error('[MarksPage] Error loading marks distribution:', error);
      toast?.error?.(t('error_loading_distribution'));
    }
  }, [selectedSubject, t, toast]);

  const loadStudentMarks = useCallback(async () => {
    if (!selectedSubject) return;
    
    // Build studentMarks map from marksReportData (already fetched via getAllStudentMarksReport)
    const subjectId = selectedSubject.docId || selectedSubject.id;
    const marksMap = {};
    for (const row of marksReportData) {
      if (String(row.subjectId) !== String(subjectId)) continue;
      const studentId = row.studentId || row.userId || row.id;
      if (studentId) marksMap[studentId] = row;
    }
    setStudentMarks(marksMap);
  }, [selectedSubject, marksReportData]);

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

  // Load deduction data for a student
  const loadDeductionData = useCallback(async (student) => {
    try {
      setDeductionLoading(true);
      const studentId = student.studentId || student.id || student.userId;
      const classId = student.classId;
      const cacheKey = `${studentId}_${classId || ''}`;

      if (deductionCache[cacheKey]) {
        setDeductionData(deductionCache[cacheKey].data);
        setDeductionHistory(deductionCache[cacheKey].history);
        setDeductionStudent(student);
        setShowDeductionDrawer(true);
        setDeductionLoading(false);
        return;
      }

      const [deductionRes, historyRes] = await Promise.all([
        fetchAttendanceDeductionSuggestion({ userId: studentId, classId }),
        fetchDeductionHistory({ userId: studentId, classId }),
      ]);

      const data = deductionRes?.data || deductionRes;
      const history = historyRes?.data || historyRes || [];

      setDeductionData(data);
      setDeductionHistory(history);
      setDeductionStudent(student);
      setShowDeductionDrawer(true);
      setDeductionCache(prev => ({ ...prev, [cacheKey]: { data, history } }));
    } catch (err) {
      error('[MarksPage] Error loading deduction data:', err);
      toast?.error?.('Failed to load deduction data');
    } finally {
      setDeductionLoading(false);
    }
  }, [toast, deductionCache]);

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
      headerName: t('user'),
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
              <div style={{ fontSize: 'var(--font-size-sm)', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
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
                {t('penalties')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={getThemedIcon('behavior_type', 'disruptive', 14, theme)}
                onClick={() => openSideWindow(RECORD_TYPES.BEHAVIOR, student, filters)}
              >
                {t('behaviors')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={getThemedIcon('ui', 'award', 14, theme)}
                onClick={() => openSideWindow(RECORD_TYPES.PARTICIPATION, student, filters)}
              >
                {t('participation')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={getThemedIcon('ui', 'eye', 14, theme)}
                onClick={() => openSideWindow('sneakpeek', student, filters)}
              >
                {t('peek')}
              </Button>
            </div>
          </div>
        );
      }
    },
    {
      field: 'midTermExam',
      headerName: t('mid_term'),
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
      headerName: t('final'),
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
      headerName: t('homework'),
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
      headerName: t('labs_projects_research'),
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
      headerName: t('quizzes'),
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
      headerName: t('participation'),
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
      headerName: t('attendance'),
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
      headerName: t('total_marks'),
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
            <h3 style={{ marginTop: 0 }}>{t('student_overview')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong>{t('name')}:</strong> {sideWindowStudent.displayName || sideWindowStudent.email}
              </div>
              <div>
                <strong>{t('email')}:</strong> {sideWindowStudent.email}
              </div>
              {(() => {
                const studentId = sideWindowStudent.uid || sideWindowStudent.docId || sideWindowStudent.id;
                const marks = studentMarks[studentId];
                return marks && (
                  <div>
                    <strong>{t('current_marks')}:</strong>
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div>{t('total_score')}: {marks.totalScore?.toFixed?.(2) || 0}</div>
                      <div>{t('grade')}: {marks.grade || 'N/A'}</div>
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
      <Joyride
        {...getJoyrideBaseProps({ theme, t })}
        run={runTour}
        steps={activeTourSteps}
        callback={handleTourCallback}
        tooltipComponent={TourTooltipComponent}
        styles={getTourStyles(theme)}
      />
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody>
          <div data-tour="marks-filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
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

      {classGpaRows.length > 0 && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                {t('student_gpa_overview')}
              </h3>
              <input
                type="text"
                placeholder={t('search_students')}
                value={gpaSearch}
                onChange={(e) => setGpaSearch(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.85rem', width: '200px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {classGpaRows
                .filter(row => !gpaSearch || row.studentName?.toLowerCase().includes(gpaSearch.toLowerCase()))
                .map((row) => {
                const studentInfo = students.find(s => String(s.uid) === String(row.studentId));
                const avatarUrl = studentInfo?.profileImageUrl;
                const isSelected = String(selectedGpaStudent) === String(row.studentId);
                return (
                  <div
                    key={row.studentId}
                    onClick={() => setSelectedGpaStudent(isSelected ? null : row.studentId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: `2px solid ${isSelected ? 'var(--brand)' : (isDarkMode ? '#374151' : '#e5e7eb')}`,
                      background: isSelected ? 'var(--brand-alpha, rgba(129,12,41,0.05))' : (isDarkMode ? '#111827' : '#f9fafb'),
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={row.studentName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        row.studentName?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.studentName}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {row.gpa.toFixed(2)}
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, marginInlineStart: '0.5rem', opacity: 0.85 }}>
                          {row.standing}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {(() => {
        const dist = marksDistribution;
        const hasData = selectedSubject && dist;
        if (!hasData) {
          return (
            <Card data-tour="marks-distribution" style={{ marginBottom: '1.5rem' }}>
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  {getThemedIcon('ui', 'info', 16, theme)}
                  {t('select_subject_to_view')}
                </div>
              </CardBody>
            </Card>
          );
        }
        const total = (dist.midTermExam || 0) + (dist.finalExam || 0) + (dist.homework || 0) +
          (dist.labsProjectResearch || 0) + (dist.quizzes || 0) + (dist.participation || 0) + (dist.attendance || 0);
        const segments = [
          { key: 'midTermExam', label: t('mid_term'), color: '#6366f1', weight: dist.midTermExam || 0 },
          { key: 'finalExam', label: t('final'), color: '#8b5cf6', weight: dist.finalExam || 0 },
          { key: 'homework', label: t('homework'), color: '#ec4899', weight: dist.homework || 0 },
          { key: 'labsProjectResearch', label: t('labs_projects_research'), color: '#f59e0b', weight: dist.labsProjectResearch || 0 },
          { key: 'quizzes', label: t('quizzes'), color: '#10b981', weight: dist.quizzes || 0 },
          { key: 'participation', label: t('participation'), color: '#3b82f6', weight: dist.participation || 0 },
          { key: 'attendance', label: t('attendance'), color: '#64748b', weight: dist.attendance || 0 },
        ].filter(s => s.weight > 0);
        const studentRow = selectedGpaStudent
          ? marksReportData.find(r => String(r.studentId) === String(selectedGpaStudent) && String(r.subjectId) === String(selectedSubject.docId || selectedSubject.id))
          : null;
        const studentMarks = studentRow ? {
          midTermExam: studentRow.midTermExam || 0,
          finalExam: studentRow.finalExam || 0,
          homework: studentRow.homework || 0,
          labsProjectResearch: studentRow.labsProjectResearch || 0,
          quizzes: studentRow.quizzes || 0,
          participation: studentRow.participation || 0,
          attendance: studentRow.attendance || 0,
        } : null;
        const studentTotal = studentMarks
          ? studentMarks.midTermExam + studentMarks.finalExam + studentMarks.homework +
            studentMarks.labsProjectResearch + studentMarks.quizzes +
            studentMarks.participation + studentMarks.attendance
          : 0;
        const studentTotalRounded = Math.round(studentTotal * 1000) / 1000;
        return (
          <Card data-tour="marks-distribution" style={{ marginBottom: '1.5rem' }}>
            <CardBody>
              <div className={styles.distributionCard}>
                <div className={styles.distributionBarRow}>
                  <div className={styles.distributionBar} style={{ flex: 1 }}>
                    {segments.map(s => (
                      <div
                        key={s.key}
                        className={styles.distSegment}
                        style={{ width: `${s.weight}%`, background: s.color }}
                        onMouseEnter={(e) => setHoveredTip({ text: `${s.label}: ${s.weight}%`, x: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2, y: e.currentTarget.offsetTop })}
                        onMouseLeave={() => setHoveredTip(null)}
                      />
                    ))}
                  </div>
                </div>
                {studentMarks && (
                  <div className={styles.distributionBar}>
                    {segments.map(s => {
                      const mark = studentMarks[s.key] || 0;
                      const fillPct = s.weight > 0 ? Math.min((mark / s.weight) * 100, 100) : 0;
                      return (
                        <div
                          key={s.key}
                          className={styles.distSegment}
                          style={{ width: `${s.weight}%`, background: 'var(--border)' }}
                          onMouseEnter={(e) => setHoveredTip({ text: `${s.label}: ${mark}/${s.weight}`, x: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2, y: e.currentTarget.offsetTop })}
                          onMouseLeave={() => setHoveredTip(null)}
                        >
                          <div style={{ width: `${fillPct}%`, height: '100%', background: s.color, opacity: 0.7, transition: 'width 0.3s ease', pointerEvents: 'none' }} />
                        </div>
                      );
                    })}
                  </div>
                )}
                {hoveredTip && (
                  <div style={{
                    position: 'absolute',
                    left: `${hoveredTip.x}px`,
                    top: `${hoveredTip.y - 6}px`,
                    transform: 'translate(-50%, -100%)',
                    background: '#1f2937',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}>
                    {hoveredTip.text}
                  </div>
                )}
                <div className={styles.distributionLegend}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDistributionForm({
                        midTermExam: dist.midTermExam || 20,
                        finalExam: dist.finalExam || 40,
                        homework: dist.homework || 5,
                        labsProjectResearch: dist.labsProjectResearch || 10,
                        quizzes: dist.quizzes || 5,
                        participation: dist.participation || 10,
                        attendance: dist.attendance || 10,
                      });
                      setEditingDistribution(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', padding: '0.2rem 0.4rem', flexShrink: 0 }}
                  >
                    {getThemedIcon('ui', 'settings', 12, theme)}
                  </Button>
                  {segments.map(s => (
                    <div key={s.key} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: s.color }} />
                      <span className={styles.legendLabel}>{s.label}</span>
                      <span className={styles.legendValue}>
                        {studentMarks ? `${studentMarks[s.key] || 0}/${s.weight}` : `${s.weight}%`}
                      </span>
                    </div>
                  ))}
                  <div className={styles.legendItemTotal}>
                    <span className={styles.legendTotalLabel}>{t('total')}</span>
                    <span className={styles.legendTotalValue}>
                      {studentMarks ? `${studentTotalRounded}/${total}` : `${total}%`}
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })()}

      {editingDistribution && selectedSubject && (
        <Card style={{ marginBottom: '1rem', background: '#fef3c7', border: '1px solid #fbbf24' }}>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>{t('edit_marks_distribution')}</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingDistribution(false)}>
                {t('cancel')}
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
                  toast?.error?.(t('distribution_must_sum_100'));
                  return;
                }

                // Validate: new max must not be below existing student marks
                const categories = [
                  { key: 'midTermExam', label: t('mid_term') },
                  { key: 'finalExam', label: t('final') },
                  { key: 'homework', label: t('homework') },
                  { key: 'labsProjectResearch', label: t('labs_projects_research') },
                  { key: 'quizzes', label: t('quizzes') },
                  { key: 'participation', label: t('participation') },
                  { key: 'attendance', label: t('attendance') },
                ];
                const subjectRows = marksReportData.filter(row => row.subjectId == subjectFilter);
                const collisionErrors = [];
                for (const cat of categories) {
                  const newMax = distributionForm[cat.key] || 0;
                  const existingMax = Math.max(0, ...subjectRows.map(r => Number(r[cat.key]) || 0));
                  if (existingMax > newMax) {
                    collisionErrors.push(
                      t('distribution_max_below_existing', { category: cat.label, max: existingMax })
                        || `Cannot set ${cat.label} max below ${existingMax} — students already have marks up to ${existingMax}`
                    );
                  }
                }
                if (collisionErrors.length > 0) {
                  toast?.error?.(collisionErrors.join('\n'));
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
                  toast?.error?.(t('error_updating_distribution'));
                }
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <div>
                  <label>{t('mid_term')} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={distributionForm.midTermExam}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, midTermExam: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('final')} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={distributionForm.finalExam}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, finalExam: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('homework')} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={distributionForm.homework}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, homework: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('labs_projects_research')} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={distributionForm.labsProjectResearch}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, labsProjectResearch: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('quizzes')} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={distributionForm.quizzes}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, quizzes: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('participation')} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={distributionForm.participation}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, participation: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('attendance')} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={distributionForm.attendance}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, attendance: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 'var(--font-size-sm)', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  {t('total')}: {(
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
                  {t('save')}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card data-tour="marks-grid">
        <CardBody>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              
            </div>
            {/* Additional Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: '1rem' }}>
            <Select
              searchable
              placeholder={t('select_year')}
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              options={[
                { value: '', label: t('all_years') },
                ...availableYears.map(year => ({ value: year, label: year }))
              ]}
              fullWidth
            />
            <Select
              searchable
              placeholder={t('select_term')}
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              options={[
                { value: '', label: t('all_terms') },
                ...availableTerms.map(term => ({ value: term, label: term }))
              ]}
              fullWidth
            />
            <Select
              searchable
              placeholder={t('select_status')}
              value={repeatedFilter}
              onChange={(e) => setRepeatedFilter(e.target.value)}
              options={[
                { value: '', label: t('all') },
                { value: 'false', label: t('first_attempt') },
                { value: 'true', label: t('repeated') }
              ]}
              fullWidth
            />
          </div>
          
          {marksReportLoading && !marksReportData.length ? (
            <SimpleLoading loading type="spinner" size="md" />
          ) : !selectedSubject ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '2rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {getThemedIcon('ui', 'info', 16, theme)}
              {t('select_subject_to_view')}
            </div>
          ) : marksReportData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>{t('no_students_found')}</p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: '#666' }}>
                  {t('try_different_filters')}
                </p>
              </div>
            ) : (
              <AdvancedDataGrid
                key={`marks-grid-${subjectFilter}-${marksReportData.map(r => `${r.userId}-${r.subjectId}`).join('|')}`}
                rows={marksReportData.filter(row => row.subjectId == subjectFilter)}
                columns={[
                  {
                    field: 'studentNumber',
                    headerName: t('student_number'),
                    width: 100,
                    editable: false,
                    valueFormatter: (params) => {
                      const row = params?.row || {};
                      return row.studentNumber || row.studentId || '';
                    },
                    renderCell: (params) => {
                      const row = params?.row || {};
                      const value = row.studentNumber || row.studentId || '';
                      return <span>{value}</span>;
                    }
                  },
                  {
                    field: 'studentName',
                    headerName: t('student_name'),
                    flex: 1,
                    minWidth: 180,
                    editable: false
                  },
                  {
                    field: 'programName',
                    headerName: t('program'),
                    flex: 1,
                    minWidth: 120,
                    editable: false
                  },
                  {
                    field: 'subjectName',
                    headerName: t('subject'),
                    flex: 1,
                    minWidth: 120,
                    editable: false
                  },
                  {
                    field: 'className',
                    headerName: t('class'),
                    flex: 1,
                    minWidth: 120,
                    editable: false
                  },
                  {
                    field: 'midTermExam',
                    headerName: t('mid_term'),
                    width: 90,
                    editable: true,
                    type: 'number',
                    valueParser: (value) => {
                      const num = parseFloat(value);
                      const max = marksDistribution?.midTermExam || 20;
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    valueFormatter: (params) => {
                      const value = params?.value || 0;
                      const max = marksDistribution?.midTermExam || 20;
                      return `${value}/${max}`;
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
                    headerName: t('final'),
                    width: 90,
                    editable: true,
                    type: 'number',
                    valueParser: (value) => {
                      const num = parseFloat(value);
                      const max = marksDistribution?.finalExam || 40;
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    valueFormatter: (params) => {
                      const value = params?.value || 0;
                      const max = marksDistribution?.finalExam || 40;
                      return `${value}/${max}`;
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
                    headerName: t('homework'),
                    width: 90,
                    editable: true,
                    type: 'number',
                    valueParser: (value) => {
                      const num = parseFloat(value);
                      const max = marksDistribution?.homework || 5;
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    valueFormatter: (params) => {
                      const value = params?.value || 0;
                      const max = marksDistribution?.homework || 5;
                      return `${value}/${max}`;
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
                    headerName: t('labs'),
                    width: 90,
                    editable: true,
                    type: 'number',
                    valueParser: (value) => {
                      const num = parseFloat(value);
                      const max = marksDistribution?.labsProjectResearch || 10;
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    valueFormatter: (params) => {
                      const value = params?.value || 0;
                      const max = marksDistribution?.labsProjectResearch || 10;
                      return `${value}/${max}`;
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
                    headerName: t('quizzes'),
                    width: 90,
                    editable: true,
                    type: 'number',
                    valueParser: (value) => {
                      const num = parseFloat(value);
                      const max = marksDistribution?.quizzes || 5;
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    valueFormatter: (params) => {
                      const value = params?.value || 0;
                      const max = marksDistribution?.quizzes || 5;
                      return `${value}/${max}`;
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
                    headerName: t('participation'),
                    width: 90,
                    editable: true,
                    type: 'number',
                    valueParser: (value) => {
                      const num = parseFloat(value);
                      const max = marksDistribution?.participation || 10;
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    valueFormatter: (params) => {
                      const value = params?.value || 0;
                      const max = marksDistribution?.participation || 10;
                      return `${value}/${max}`;
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
                    headerName: t('attendance'),
                    width: 90,
                    editable: true,
                    type: 'number',
                    valueParser: (value) => {
                      const num = parseFloat(value);
                      const max = marksDistribution?.attendance || 10;
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    valueFormatter: (params) => {
                      const value = params?.value || 0;
                      const max = marksDistribution?.attendance || 10;
                      return `${value}/${max}`;
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
                    headerName: t('grade_type'),
                    width: 120,
                    editable: true,
                    type: 'singleSelect',
                    valueOptions: [
                      { value: 'calculated', label: t('calculated') },
                      { value: GRADE_TYPE.COMPLEMENTARY, label: t('complementary_exam') },
                      { value: 'FB', label: `FB - ${t('grade_fb')}` },
                      { value: 'FA', label: `FA - ${t('grade_fa')}` },
                      { value: 'WF', label: `WF - ${t('grade_wf')}` },
                    ],
                    valueFormatter: (params) => {
                      const value = params?.value || 'calculated';
                      const options = {
                        calculated: t('calculated'),
                        [GRADE_TYPE.COMPLEMENTARY]: t('complementary_exam'),
                        FB: `FB - ${t('grade_fb')}`,
                        FA: `FA - ${t('grade_fa')}`,
                        WF: `WF - ${t('grade_wf')}`,
                      };
                      return options[value] || value;
                    },
                    renderCell: (params) => {
                      const value = params.value || 'calculated';
                      const options = {
                        calculated: t('calculated'),
                        [GRADE_TYPE.COMPLEMENTARY]: t('complementary_exam'),
                        FB: `FB - ${t('grade_fb')}`,
                        FA: `FA - ${t('grade_fa')}`,
                        WF: `WF - ${t('grade_wf')}`,
                      };
                      return (
                        <div style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          background: value === 'calculated' ? '#e5e7eb' : '#fef3c7',
                          color: value === 'calculated' ? '#374151' : '#92400e',
                          textAlign: 'center',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 500
                        }}>
                          {options[value] || value}
                        </div>
                      );
                    }
                  },
                  {
                    field: 'totalMarks',
                    headerName: t('total'),
                    width: 100,
                    editable: false,
                    valueFormatter: (params) => {
                      const row = params?.row || {};
                      const gradeType = row.gradeType || 'calculated';
                      if (gradeType !== 'calculated') return gradeType;
                      const value = params?.value || 0;
                      return `${value.toFixed(1)}%`;
                    },
                    renderCell: (params) => {
                      const row = params.row;
                      const gradeType = row.gradeType || GRADE_TYPE.CALCULATED;
                      
                      if (gradeType === GRADE_TYPE.COMPLEMENTARY) {
                        const resolved = resolveMarkGrade({
                          gradeType,
                          complementaryScore: row.finalExam,
                          lang,
                        });
                        return (
                          <div style={{ 
                            padding: '4px 8px', borderRadius: '4px',
                            background: resolved.passed ? '#60a5fa' : '#ef4444',
                            color: 'white', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem',
                          }}>
                            {resolved.passed ? `${resolved.totalMarks}%` : `${row.finalExam}/100`}
                          </div>
                        );
                      }

                      if (gradeType !== GRADE_TYPE.CALCULATED) {
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
                          background: value >= 90 ? '#10b981' : value >= 80 ? '#3b82f6' : value >= 70 ? '#f59e0b' : value >= 60 ? '#60a5fa' : '#ef4444',
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
                    headerName: t('grade'),
                    width: 80,
                    editable: false,
                    valueFormatter: (params) => {
                      const row = params?.row || {};
                      const gradeType = row.gradeType || GRADE_TYPE.CALCULATED;
                      if (gradeType !== GRADE_TYPE.CALCULATED) {
                        const resolved = resolveMarkGrade({ gradeType, complementaryScore: row.finalExam, lang });
                        return resolved.letter;
                      }
                      return params?.value || '';
                    },
                    renderCell: (params) => {
                      const row = params.row;
                      const resolved = resolveMarkGrade({
                        totalMarks: row.totalMarks,
                        letterGrade: params.value,
                        gradeType: row.gradeType,
                        isRepeated: row.isRepeated,
                        complementaryScore: row.finalExam,
                        lang,
                      });
                      const color = getGradeColor(resolved.letter);
                      return (
                        <div style={{ 
                          padding: '4px 8px', borderRadius: '4px',
                          background: color, color: 'white',
                          textAlign: 'center', fontSize: 'var(--font-size-xs)', fontWeight: 600
                        }}>
                          {resolved.letter}
                        </div>
                      );
                    }
                  },
                  {
                    field: 'gradeDescription',
                    headerName: t('grade_description'),
                    width: 130,
                    editable: false,
                    valueGetter: (params) => {
                      const row = params.row;
                      return resolveMarkGrade({
                        totalMarks: row.totalMarks,
                        letterGrade: row.letterGrade,
                        gradeType: row.gradeType,
                        isRepeated: row.isRepeated,
                        complementaryScore: row.finalExam,
                        lang,
                      }).gradeDescription;
                    },
                  },
                  {
                    field: 'gradePoints',
                    headerName: t('grade_points'),
                    width: 80,
                    editable: false,
                    valueGetter: (params) => {
                      const row = params.row;
                      return resolveMarkGrade({
                        totalMarks: row.totalMarks,
                        letterGrade: row.letterGrade,
                        gradeType: row.gradeType,
                        isRepeated: row.isRepeated,
                        complementaryScore: row.finalExam,
                        lang,
                      }).points ?? row.gradePoints ?? 0;
                    },
                  },
                  // Hide these columns to save space
                  {
                    field: 'gradeRange',
                    headerName: t('range'),
                    width: 80,
                    editable: false
                  },
                  {
                    field: 'isRepeated',
                    headerName: t('repeated'),
                    width: 120,
                    editable: false,
                    valueFormatter: (params) => {
                      return Boolean(params?.value) ? (t('yes')) : (t('no'));
                    },
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
                                
                                toast?.success?.(t('marks_updated_successfully'));
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
                            {isRepeated ? t('yes') : t('no')}
                          </span>
                        </div>
                      );
                    }
                  },
                  {
                    field: 'deductions',
                    headerName: t('deductions'),
                    width: 110,
                    sortable: false,
                    filterable: false,
                    exportable: false,
                    renderCell: (params) => {
                      const row = params.row;
                      const gradeType = row.gradeType || 'calculated';
                      const isFB = gradeType === 'FB' || gradeType === 'FA';
                      const cacheKey = `${row.studentId || row.id}_${row.classId || ''}`;
                      const cached = deductionCache[cacheKey];

                      if (cached?.data) {
                        const total = cached.data.totalDeduction || 0;
                        const count = cached.data.absenceCount || 0;
                        const weight = marksDistribution?.attendance || 10;
                        const failThreshold = 8;
                        const isFail = cached.data.failureByCount || isFB;
                        const pct = failThreshold > 0 ? count / failThreshold : 0;
                        const bgColor = isFail ? '#dc2626' : pct >= 0.75 ? '#ef4444' : pct >= 0.5 ? '#f59e0b' : '#22c55e';

                        return (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              height: '100%',
                            }}
                            onClick={() => loadDeductionData(row)}
                            title={`${total.toFixed(2)} deducted, ${count}/${failThreshold} absences`}
                          >
                            <div style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: bgColor,
                              color: 'white',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}>
                              -{total.toFixed(1)}
                            </div>
                            <div style={{
                              fontSize: 'var(--font-size-xs)',
                              color: isDarkMode ? '#9ca3af' : '#6b7280',
                              whiteSpace: 'nowrap',
                            }}>
                              {count}/{failThreshold}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <Button
                            size="sm"
                            variant="outline-info"
                            onClick={() => loadDeductionData(row)}
                            disabled={deductionLoading}
                            style={{
                              padding: '4px 8px',
                              fontSize: 'var(--font-size-xs)',
                              minWidth: '70px',
                            }}
                          >
                            {deductionLoading ? (
                              <span>...</span>
                            ) : (
                              <>
                                {getThemedIcon('ui', 'alert_triangle', 14, theme)}
                                <span style={{ marginLeft: '4px' }}>{t('view')}</span>
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    }
                  },
                  {
                    field: 'history',
                    headerName: t('history'),
                    width: 80,
                    sortable: false,
                    filterable: false,
                    exportable: false,
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
                              fontSize: 'var(--font-size-xs)',
                              minWidth: '60px'
                            }}
                          >
                            {historyLoading ? (
                              <span>...</span>
                            ) : (
                              <>
                                {getThemedIcon('ui', 'clock', 14, theme)}
                                <span style={{ marginLeft: '4px' }}>{t('history')}</span>
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    }
                  }
                ]}
                pageSize={50}
                pageSizeOptions={[10, 25, 50, 100]}
                checkboxSelection
                disableRowSelectionOnClick
                exportFileName="student-marks"
                showExportButton
                exportLabel={t('export')}
                loadingOverlayMessage={marksReportLoading ? (t('loading_marks')) : undefined}
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
                      
                      toast?.success?.(t('marks_updated'));
                    }
                    return newRow;
                  } catch (err) {
                    error('[MarksPage] Error saving marks:', err);
                    toast?.error?.(t('error_saving_marks'));
                    throw err;
                  }
                }}
              />
            )}
          </div>
        </CardBody>
      </Card>

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

      {/* Deduction Drawer */}
      <DeductionDrawer
        isOpen={showDeductionDrawer}
        onClose={() => setShowDeductionDrawer(false)}
        student={deductionStudent}
        data={deductionData}
        history={deductionHistory}
        loading={deductionLoading}
        type="absence"
        weight={marksDistribution?.attendance || 10}
        thresholds={{ failureCount: 8, failureGrade: 'FB' }}
      />
    </Container>
  );
};

export default MarksPage;
