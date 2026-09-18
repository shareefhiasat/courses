import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Joyride from 'react-joyride';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
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
  mergeComplementaryRecords,
  getOriginalMark,
  isManualGradeType,
  getGradeTypeLabelKey,
  getAttemptLabelKey,
  getFailReasonLabelKey,
  formatTermDisplay,
  getLocalizedTermDisplay,
} from '@services/business/enrollmentMarksService';
import { getUsers } from '@services/business/userService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getClasses } from '@services/business/classService';
import ClassInfoBar from '@components/ui/ClassInfoBar';
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger.jsx';
// OLD: import { ACTIVITY_TYPES } from '@constants/activityTypes';
// NOW: Not used in this component
import { RECORD_TYPES } from '@utils/sharedTypes';
import { getAttendanceColor, ATTENDANCE_STATUS } from '@constants/attendanceTypes';

// Default distribution weights used as fallback for filters and form defaults
const DEFAULT_MARKS_DISTRIBUTION = {
  midTermExam: 20,
  finalExam: 40,
  homework: 5,
  labsProjectResearch: 10,
  quizzes: 5,
  participation: 10,
  attendance: 10,
};

// Style override for GPA overview section to reduce padding
const gpaOverviewStyle = (
  <style>{`
    .gpa-overview-section .fullContent {
      padding: 0.5rem !important;
    }
  `}</style>
);
import { ROLE_STRINGS } from '@utils/userUtils';
import { Container, Card, CardBody, Button, Input, Badge, EmptyState, useToast, Select, AdvancedDataGrid, SimpleLoading, NumberInput } from '@ui';
// Icons are rendered via getThemedIcon from '@constants/iconTypes'
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { ProgramsSelect } from '@ui';
import { useTheme } from '@contexts/ThemeContext';
import { getStudentMarksHistory, getAbsenceWarningCounts } from '@services/business/enrollmentMarksService';
import { getThemedIcon } from '@constants/iconTypes';
import { CollapsibleSideWindow, CollapsibleDashboardSection } from '@ui';
import usePersistentState from '@hooks/usePersistentState';
import BehaviorPage from '../../../operations/behavior/BehaviorPage';
import PenaltiesPage from '../../../operations/penalty/PenaltiesPage';
import ParticipationPage from '../../../operations/participation/ParticipationPage';
import MarksHistoryDrawer from '@components/academic/MarksHistoryDrawer';
import DeductionDrawer from '@components/academic/DeductionDrawer';
import MarksOfficialExportBar from '@components/academic/MarksOfficialExportBar';
import MarksExportDialog from '@components/academic/MarksExportDialog';
import { fetchAttendanceDeductionSuggestion, fetchDeductionHistory } from '@services/business/attendanceDeductionService';
import { resolveWarningType, WARNING_TYPE } from '@services/export/official-reports/index.jsx';
import styles from './EnrollmentsMarksPage.module.css';

// Remove the " - Fall 2024" style suffix from class names so the grid shows just the class
const cleanClassDisplayName = (name) => {
  if (!name) return name;
  return name.replace(/\s*[-–]\s*.*\d{4}.*$/, '').trim();
};

const MarksPage = () => {
  const { user, isAdmin, isSuperAdmin, isInstructor, isHR, loading: authLoading } = useAuth();
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

  const [subjectGpaRows, setSubjectGpaRows] = useState([]);
  const [cumulativeGpaRows, setCumulativeGpaRows] = useState([]);
  const [gpaGradeFilter, setGpaGradeFilter] = useState(''); // '', 'A', 'B', 'C', 'D', 'F'
  const [gpaSortOrder, setGpaSortOrder] = useState('desc'); // 'asc' or 'desc'
  const gradeBadges = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'FB', 'FA', 'WF'];
  const gradeColors = { A: '#10b981', 'B+': '#3b82f6', B: '#3b82f6', 'C+': '#f59e0b', C: '#f59e0b', 'D+': '#60a5fa', D: '#60a5fa', F: '#ef4444', FB: '#ef4444', FA: '#ef4444', WF: '#6b7280' };
  const gradeArLabels = { A: 'ممتاز', 'B+': 'جيد جداً مرتفع', B: 'جيد جداً', 'C+': 'جيد مرتفع', C: 'جيد', 'D+': 'مقبول مرتفع', D: 'مقبول', F: 'راسب', FB: 'غياب', FA: 'غ نهائي', WF: 'انسحاب' };
  const gradeLetterLabel = useCallback((letter) => {
    if (lang === 'ar' && gradeArLabels[letter]) return gradeArLabels[letter];
    return letter;
  }, [lang]);
  const [showNotificationNote, setShowNotificationNote] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Slider range filters for mark components
  const [markRangeFilters, setMarkRangeFilters] = useState({
    midTermExam: [0, DEFAULT_MARKS_DISTRIBUTION.midTermExam],
    finalExam: [0, DEFAULT_MARKS_DISTRIBUTION.finalExam],
    homework: [0, DEFAULT_MARKS_DISTRIBUTION.homework],
    labsProjectResearch: [0, DEFAULT_MARKS_DISTRIBUTION.labsProjectResearch],
    quizzes: [0, DEFAULT_MARKS_DISTRIBUTION.quizzes],
    participation: [0, DEFAULT_MARKS_DISTRIBUTION.participation],
    attendance: [0, DEFAULT_MARKS_DISTRIBUTION.attendance],
    gradePoints: [0, 4],
  });

  // Effective distribution used for filter ranges (loaded distribution or defaults)
  const effectiveDistribution = useMemo(() => ({
    ...DEFAULT_MARKS_DISTRIBUTION,
    ...(marksDistribution || {}),
  }), [marksDistribution]);

  const getMarkRangeMax = (key) => {
    if (key === 'gradePoints') return 4;
    return effectiveDistribution[key] || DEFAULT_MARKS_DISTRIBUTION[key] || 100;
  };

  // Reset mark range filters when distribution weights change so max values stay valid
  useEffect(() => {
    setMarkRangeFilters({
      midTermExam: [0, getMarkRangeMax('midTermExam')],
      finalExam: [0, getMarkRangeMax('finalExam')],
      homework: [0, getMarkRangeMax('homework')],
      labsProjectResearch: [0, getMarkRangeMax('labsProjectResearch')],
      quizzes: [0, getMarkRangeMax('quizzes')],
      participation: [0, getMarkRangeMax('participation')],
      attendance: [0, getMarkRangeMax('attendance')],
      gradePoints: [0, 4],
    });
  }, [effectiveDistribution]);

  // Deduction drawer state
  const [showDeductionDrawer, setShowDeductionDrawer] = useState(false);
  const [deductionData, setDeductionData] = useState(null);
  const [deductionHistory, setDeductionHistory] = useState([]);
  const [deductionLoading, setDeductionLoading] = useState(false);
  const [deductionStudent, setDeductionStudent] = useState(null);
  const [deductionCache, setDeductionCache] = useState({});

  // Filters (persisted to localStorage)
  const [programFilter, setProgramFilter] = usePersistentState('marks_filter_program', '');
  const [subjectFilter, setSubjectFilter] = usePersistentState('marks_filter_subject', '');
  const [classFilter, setClassFilter] = usePersistentState('marks_filter_class', '');
  const [termFilter, setTermFilter] = usePersistentState('marks_filter_term', '');
  const [yearFilter, setYearFilter] = usePersistentState('marks_filter_year', '');
  const [repeatedFilter, setRepeatedFilter] = usePersistentState('marks_filter_repeated', ''); // '', 'true', 'false'
  const [gradeTypeFilter, setGradeTypeFilter] = usePersistentState('marks_filter_gradeType', '');
  const [gradeFilter, setGradeFilter] = usePersistentState('marks_filter_grade', '');
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Side window state
  const [sideWindowOpen, setSideWindowOpen] = useState(false);
  const [sideWindowContent, setSideWindowContent] = useState(null);
  const [sideWindowStudent, setSideWindowStudent] = useState(null);
  const [sideWindowFilters, setSideWindowFilters] = useState({});

  // Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false);

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

  // Available terms from classes (deduplicated by formatted label)
  const availableTerms = useMemo(() => {
    const seen = new Map();
    classes.forEach(cls => {
      if (cls.term) {
        const formatted = formatTermDisplay(cls.term);
        if (!seen.has(formatted.toLowerCase())) {
          seen.set(formatted.toLowerCase(), cls.term);
        }
      }
    });
    return Array.from(seen.values()).sort();
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
      if (gradeTypeFilter) filters.gradeType = gradeTypeFilter;

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
  }, [programFilter, subjectFilter, classFilter, yearFilter, termFilter, repeatedFilter, gradeTypeFilter]);

  const exportMetadata = useMemo(() => {
    const selectedClassObj = classes.find((c) => String(c.id) === String(classFilter));
    const selectedSubjectObj = subjects.find((s) => String(s.docId || s.id) === String(subjectFilter));
    const selectedProgramObj = programs.find((p) => String(p.id) === String(programFilter));
    const programName = selectedProgramObj
      ? (lang === 'ar' ? (selectedProgramObj.nameAr || selectedProgramObj.nameEn) : (selectedProgramObj.nameEn || selectedProgramObj.nameAr))
      : '';
    const subjectName = selectedSubjectObj
      ? (lang === 'ar' ? (selectedSubjectObj.nameAr || selectedSubjectObj.nameEn) : (selectedSubjectObj.nameEn || selectedSubjectObj.nameAr))
      : '';
    const className = selectedClassObj
      ? (lang === 'ar' ? (selectedClassObj.nameAr || selectedClassObj.nameEn || selectedClassObj.code) : (selectedClassObj.nameEn || selectedClassObj.nameAr || selectedClassObj.code))
      : '';
    return {
      programId: programFilter,
      subjectId: subjectFilter,
      classId: classFilter,
      programName,
      programNameAr: selectedProgramObj?.nameAr,
      subjectName,
      subjectNameAr: selectedSubjectObj?.nameAr,
      className,
      classNameAr: selectedClassObj?.nameAr || selectedClassObj?.nameEn,
      year: yearFilter || selectedClassObj?.year || '',
      term: termFilter || selectedClassObj?.term || '',
      examLabelAr: t('semester_certificate'),
      examLabelEn: t('semester_certificate'),
      termLabelAr: termFilter,
    };
  }, [programs, subjects, classes, programFilter, subjectFilter, classFilter, yearFilter, termFilter, lang]);

  const loadSemesterReportRows = useCallback(async () => {
    if (!programFilter) return [];
    const filters = { programId: programFilter };
    if (yearFilter) filters.year = yearFilter;
    if (termFilter) filters.term = termFilter;
    const result = await getAllStudentMarksReport(filters);
    return result.success ? (result.data || []) : [];
  }, [programFilter, yearFilter, termFilter]);

  const classReportRows = useMemo(() => {
    if (!subjectFilter) return [];
    return marksReportData.filter((row) => {
      if (classFilter && String(row.classId) !== String(classFilter)) return false;
      if (String(row.subjectId) !== String(subjectFilter)) return false;
      if (gradeFilter && String(row.letterGrade) !== String(gradeFilter)) return false;
      return !row.isRepeated;
    });
  }, [marksReportData, subjectFilter, classFilter, gradeFilter]);

  const mergedSubjectReportRows = useMemo(() => {
    if (!subjectFilter) return [];
    return mergeComplementaryRecords(
      marksReportData.filter((row) => String(row.subjectId) === String(subjectFilter))
    ).map((row) => ({
      ...row,
      originalMark: getOriginalMark(row),
    }));
  }, [marksReportData, subjectFilter]);

  // Per-student GPA overview when a class is selected (all subjects in class)
  const [classGpaRows, setClassGpaRows] = useState([]);
  const [gpaSearch, setGpaSearch] = useState('');
  const [selectedGpaStudents, setSelectedGpaStudents] = useState([]);
  const [hoveredTip, setHoveredTip] = useState(null);
  const [absenceWarningCounts, setAbsenceWarningCounts] = useState([]);

  const filteredGridRows = useMemo(() => {
    if (!subjectFilter) return [];
    console.log('[MarksPage] markRangeFilters:', markRangeFilters);
    console.log('[MarksPage] mergedSubjectReportRows count:', mergedSubjectReportRows.length);
    return mergedSubjectReportRows.filter((row) => {
      // Filter by selected GPA students
      if (selectedGpaStudents.length > 0 && !selectedGpaStudents.some((s) => String(row.studentId) === String(s))) {
        return false;
      }

      // Apply mark range filters
      const { midTermExam, finalExam, homework, labsProjectResearch, quizzes, participation, attendance, gradePoints } = markRangeFilters;

      const checkRange = (value, range, fieldName, studentName) => {
        if (value === null || value === undefined) return true;
        const inRange = value >= range[0] && value <= range[1];
        if (!inRange) {
          console.log(`[MarksPage] FILTERED OUT: ${studentName} (${row.studentId}) — ${fieldName}=${value} not in [${range[0]}, ${range[1]}]`);
        }
        return inRange;
      };

      const studentName = row.student?.name || row.studentName || row.studentNumber || `ID:${row.studentId}`;
      const isComplementary = row.gradeType === GRADE_TYPE.COMPLEMENTARY;

      if (!checkRange(row.midTermExam, midTermExam, 'midTermExam', studentName)) return false;
      // For complementary exams, finalExam is the complementary score out of 100, so use a 0-100 range instead of the distribution weight
      if (!checkRange(row.finalExam, isComplementary ? [0, 100] : finalExam, 'finalExam', studentName)) return false;
      if (!checkRange(row.homework, homework, 'homework', studentName)) return false;
      if (!checkRange(row.labsProjectResearch, labsProjectResearch, 'labsProjectResearch', studentName)) return false;
      if (!checkRange(row.quizzes, quizzes, 'quizzes', studentName)) return false;
      if (!checkRange(row.participation, participation, 'participation', studentName)) return false;
      if (!checkRange(row.attendance, attendance, 'attendance', studentName)) return false;
      if (!checkRange(row.gradePoints, gradePoints, 'gradePoints', studentName)) return false;

      return true;
    });
  }, [mergedSubjectReportRows, subjectFilter, selectedGpaStudents, markRangeFilters]);

  // Load marks report when filters change
  useEffect(() => {
    loadMarksReport();
  }, [loadMarksReport]);
  useEffect(() => {
    if (!classFilter) {
      setClassGpaRows([]);
      setAbsenceWarningCounts([]);
      return;
    }
    (async () => {
      const filters = { classId: classFilter };
      if (yearFilter) filters.year = yearFilter;
      if (termFilter) filters.term = termFilter;
      const result = await getAllStudentMarksReport(filters);
      if (!result.success) return;
      const mergedData = mergeComplementaryRecords(result.data || []);
      const byStudent = new Map();
      for (const row of mergedData) {
        const key = row.studentId;
        if (!byStudent.has(key)) {
          byStudent.set(key, { studentId: key, studentName: row.studentName, studentNameAr: row.studentNameAr, marks: [] });
        }
        byStudent.get(key).marks.push(row);
      }
      setClassGpaRows(
        Array.from(byStudent.values()).map((entry) => {
          const { gpa } = calculateGpaFromMarks(entry.marks);
          const standing = getGpaStanding(gpa, lang);
          return { ...entry, gpa, standing: standing.label, gpaLetter: standing.letter, detailMarks: entry.marks };
        }).sort((a, b) => a.studentName.localeCompare(b.studentName))
      );
      
      // Load absence warning counts for this class
      const absenceResult = await getAbsenceWarningCounts(classFilter);
      if (absenceResult.success) {
        setAbsenceWarningCounts(absenceResult.data || []);
      }
    })();
  }, [classFilter, yearFilter, termFilter, lang, refreshCounter]);

  // Subject-level GPA: calculated from marksReportData (all classes for the selected subject)
  useEffect(() => {
    if (!subjectFilter || marksReportData.length === 0) {
      setSubjectGpaRows([]);
      return;
    }
    const merged = mergeComplementaryRecords(marksReportData.filter(row => row.subjectId == subjectFilter));
    const byStudent = new Map();
    for (const row of merged) {
      const key = row.studentId;
      if (!byStudent.has(key)) {
        byStudent.set(key, { studentId: key, studentName: row.studentName, studentNameAr: row.studentNameAr, marks: [] });
      }
      byStudent.get(key).marks.push(row);
    }
    setSubjectGpaRows(
      Array.from(byStudent.values()).map((entry) => {
        const { gpa } = calculateGpaFromMarks(entry.marks);
        const standing = getGpaStanding(gpa, lang);
        return { ...entry, gpa, standing: standing.label, gpaLetter: standing.letter };
      }).sort((a, b) => a.studentName.localeCompare(b.studentName))
    );
  }, [subjectFilter, marksReportData, lang]);

  // Cumulative GPA: fetch all marks for all students in the selected program
  useEffect(() => {
    if (!programFilter) {
      setCumulativeGpaRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      // Fetch all marks for the program (no subject/class filter) to get true cumulative GPA
      const result = await getAllStudentMarksReport({ programId: programFilter });
      if (!result.success || cancelled) return;
      const merged = mergeComplementaryRecords(result.data || []);
      const byStudent = new Map();
      for (const row of merged) {
        const key = row.studentId;
        if (!byStudent.has(key)) {
          byStudent.set(key, { studentId: key, studentName: row.studentName, studentNameAr: row.studentNameAr, marks: [] });
        }
        byStudent.get(key).marks.push(row);
      }
      if (cancelled) return;
      setCumulativeGpaRows(
        Array.from(byStudent.values()).map((entry) => {
          const { gpa } = calculateGpaFromMarks(entry.marks);
          const standing = getGpaStanding(gpa, lang);
          return { ...entry, gpa, standing: standing.label, gpaLetter: standing.letter };
        }).sort((a, b) => a.studentName.localeCompare(b.studentName))
      );
    })();
    return () => { cancelled = true; };
  }, [programFilter, lang, refreshCounter]);

  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) setLoading(true);
    try {
      const [programsRes, subjectsRes, classesRes, enrollmentsRes] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getClasses(),
        getEnrollments({ limit: 10000, page: 1 })
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
          displayName: enrollment?.user?.displayName || enrollment?.user?.realName || t('student_name_placeholder', { id }),
          email: enrollment?.user?.email || t('student_email_placeholder', { id }),
          profileImageUrl: enrollment?.user?.profileImageUrl || null,
          enrollments: enrollmentStudents.filter(e => e.userId === id)
        };
      });
      setStudents(studentsWithEnrollment);
      
    } catch (error) {
      error('[MarksPage] Error loading data:', error);
      toast?.error?.(t('error_loading_data'));
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
      stopLoading = startLoading({ message: t('loading_marks') });
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
        toast?.error?.(result.error || t('failed_to_load_marks_history'));
      }
    } catch (error) {
      console.error('Error loading marks history:', error);
      toast?.error?.(t('failed_to_load_marks_history'));
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

      const enrichedStudent = {
        ...student,
        programNameAr: exportMetadata.programNameAr,
        subjectNameAr: exportMetadata.subjectNameAr,
        classNameAr: exportMetadata.classNameAr,
        term: exportMetadata.term,
        year: exportMetadata.year,
      };

      if (deductionCache[cacheKey]) {
        setDeductionData(deductionCache[cacheKey].data);
        setDeductionHistory(deductionCache[cacheKey].history);
        setDeductionStudent(enrichedStudent);
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
      setDeductionStudent(enrichedStudent);
      setShowDeductionDrawer(true);
      setDeductionCache(prev => ({ ...prev, [cacheKey]: { data, history } }));
    } catch (err) {
      error('[MarksPage] Error loading deduction data:', err);
      toast?.error?.(t('failed_to_load_deduction_data'));
    } finally {
      setDeductionLoading(false);
    }
  }, [toast, deductionCache, exportMetadata]);

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
        
        if (!student) return rowId || t('unknown');
        
        const filters = {
          programId: programFilter,
          subjectId: subjectFilter,
          classId: enrollment?.classId || ''
        };

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                {student.displayName || student.realName || student.email || t('unknown')}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                {student.email || t('no_email')}
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
      headerName: t('mid_term_short'),
      width: 80,
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
      headerName: t('homework_short'),
      width: 80,
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
      headerName: t('labs_projects_research_short'),
      width: 100,
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
  if (!isAdmin && !isSuperAdmin && !isInstructor && !isHR) return <Navigate to="/" replace />;

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
                      <div>{t('grade')}: {marks.grade || t('not_available')}</div>
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
      {gpaOverviewStyle}
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

      {classFilter && (
        <div style={{ marginBottom: '1.5rem' }}>
          <ClassInfoBar
            classObj={classes.find(c => String(c.id) === String(classFilter))}
            lang={lang}
            t={t}
          />
        </div>
      )}

      {(() => {
        const renderGradeBadges = () => (
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'nowrap' }}>
            <button
              onClick={() => setGpaGradeFilter('')}
              style={{
                padding: '2px 6px', borderRadius: '10px', border: '1px solid var(--border)',
                fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                background: gpaGradeFilter === '' ? 'var(--brand)' : 'transparent',
                color: gpaGradeFilter === '' ? '#fff' : 'var(--text)',
              }}
            >
              {t('all')}
            </button>
            {gradeBadges.map(g => (
              <button
                key={g}
                onClick={() => setGpaGradeFilter(gpaGradeFilter === g ? '' : g)}
                style={{
                  padding: '2px 6px', borderRadius: '10px', border: `1px solid ${gradeColors[g]}`,
                  fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: gpaGradeFilter === g ? gradeColors[g] : 'transparent',
                  color: gpaGradeFilter === g ? '#fff' : gradeColors[g],
                }}
              >
                {gradeLetterLabel(g)}
              </button>
            ))}
          </div>
        );

        const attemptLabel = (mark) => {
          const key = getAttemptLabelKey(mark);
          return key ? t(key) : mark.gradeType;
        };

        const failReasonLabel = (mark) => {
          const key = getFailReasonLabelKey(mark);
          return key ? t(key) : null;
        };

        const renderDetailChips = (marks) => {
          if (!marks || marks.length === 0) return null;
          return marks.map((m, i) => {
                const gt = m.gradeType || 'calculated';
                const isManualGrade = isManualGradeType(gt);
                const letter = isManualGrade ? gt : (m.letterGrade || (gt !== 'calculated' ? gt : '?'));
                const isFail = letter === 'F' || isManualGradeType(gt);
                const chipColor = gradeColors[letter] || gradeColors[gt] || (isFail ? '#ef4444' : '#6b7280');
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '2px',
                      padding: '0px 4px', borderRadius: '3px',
                      fontSize: '0.6rem', fontWeight: 600,
                      background: `${chipColor}15`, color: chipColor,
                      border: `1px solid ${chipColor}30`,
                      flexShrink: 0,
                    }}
                  >
                    {gradeLetterLabel(letter)}
                    <span style={{ opacity: 0.7, fontWeight: 400 }}>
                      {m.term ? t(m.term.replace(/^[0-9]{4}-/, '').toLowerCase()) || m.term.replace(/^[0-9]{4}-/, '') : (m.year ? String(m.year).slice(-2) : '')}
                    </span>
                  </span>
                );
              });
        };

        const renderGpaCard = (rows, title, subtitle, accentColor, showDetails) => {
          if (!rows || rows.length === 0) return null;
          const filtered = rows.filter(row => {
            if (gpaSearch && !(row.studentName?.toLowerCase().includes(gpaSearch.toLowerCase()) || row.studentNameAr?.toLowerCase().includes(gpaSearch.toLowerCase()))) return false;
            if (gpaGradeFilter && row.gpaLetter !== gpaGradeFilter) return false;
            return true;
          });
          if (filtered.length === 0) return null;
          return (
            <div style={{
              border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden',
              background: isDarkMode ? '#111827' : '#fff',
              minWidth: 0,
            }}>
              <div style={{
                padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)',
                background: `${accentColor}08`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: accentColor }}>{title}</div>
                  {subtitle && <div style={{ fontSize: '0.7rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
                </div>
                <span style={{
                  padding: '1px 7px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 700,
                  background: accentColor, color: '#fff', flexShrink: 0,
                }}>
                  {filtered.length}
                </span>
              </div>
              <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
                {filtered.map((row) => {
                  const isSelected = selectedGpaStudents.some(s => String(s) === String(row.studentId));
                  const isFailed = ['F', 'FB', 'FA', 'WF'].includes(row.gpaLetter);
                  const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                  const absenceCount = absenceInfo?.totalAbsences || 0;
                  const unexcusedCount = absenceInfo?.unexcusedAbsences || 0;
                  const failThreshold = 8;
                  const isAbsenceFail = absenceCount >= failThreshold;
                  const isAbsenceWarning = absenceCount >= Math.ceil(failThreshold * 0.75);
                  return (
                    <div
                      key={row.studentId}
                      onClick={() => setSelectedGpaStudents(prev => isSelected ? prev.filter(s => String(s) !== String(row.studentId)) : [...prev, row.studentId])}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.4rem 0.5rem', borderRadius: '6px',
                        border: `1.5px solid ${isSelected ? '#10b981' : isAbsenceFail ? '#ef4444' : isAbsenceWarning ? '#f59e0b' : 'transparent'}`,
                        background: isSelected ? 'var(--brand-alpha, rgba(129,12,41,0.05))' : isFailed ? (isDarkMode ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)') : (isDarkMode ? '#1f2937' : '#f9fafb'),
                        cursor: 'pointer', transition: 'all 0.15s',
                        minHeight: '42px',
                      }}
                    >
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: '20px', height: '20px', padding: '0 4px', borderRadius: '10px', flexShrink: 0,
                        fontSize: lang === 'ar' ? '0.55rem' : '0.65rem', fontWeight: 700, color: '#fff',
                        background: gradeColors[row.gpaLetter] || '#6b7280',
                      }}>
                        {gradeLetterLabel(row.gpaLetter)}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2,
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang === 'ar' ? (row.studentNameAr || row.studentName) : row.studentName}</span>
                          {showDetails && row.detailMarks && renderDetailChips(row.detailMarks)}
                        </div>
                        {showDetails && row.detailMarks && (() => {
                          const compMark = row.detailMarks.find(m => m.gradeType === 'complementary');
                          const failMark = row.detailMarks.find(m => isManualGradeType(m.gradeType) || m.letterGrade === 'F');
                          const prevAttempt = row.detailMarks.find(m => m.previousAttempt);
                          const items = [];
                          if (compMark) {
                            const score = compMark.finalExam || 0;
                            const passed = score >= 60;
                            items.push(
                              <span key="comp" style={{ color: passed ? '#3b82f6' : '#ef4444', fontWeight: 600 }}>
                                {t('complementary_exam')}: {score}/100
                              </span>
                            );
                          }
                          if (failMark) {
                            const reason = failReasonLabel(failMark);
                            if (reason) {
                              items.push(
                                <span key="fail" style={{ color: '#ef4444', fontWeight: 600 }}>
                                  {reason}
                                </span>
                              );
                            }
                          }
                          if (prevAttempt) {
                            const prev = prevAttempt.previousAttempt;
                            items.push(
                              <span key="prev" style={{ color: '#6b7280' }}>
                                {t('previous')}: {prev.totalMarks?.toFixed?.(1) || prev.totalMarks}% → {prev.letterGrade}
                              </span>
                            );
                          }
                          if (items.length === 0) return null;
                          return (
                            <div style={{ fontSize: '0.6rem', fontWeight: 500, marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {items.map((item, i) => (
                                <React.Fragment key={i}>
                                  {i > 0 && <span style={{ color: 'var(--muted)' }}>·</span>}
                                  {item}
                                </React.Fragment>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      {(isAbsenceFail || isAbsenceWarning) && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '1px 5px',
                            borderRadius: '10px',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            color: '#fff',
                            background: isAbsenceFail ? '#dc2626' : '#f59e0b',
                            flexShrink: 0,
                          }}
                        >
                          {getThemedIcon('ui', 'alert_triangle', 10, isAbsenceFail ? 'error' : 'warning')}
                          {absenceCount}/{failThreshold}
                        </span>
                      )}
                      <span style={{
                        fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
                        color: gradeColors[row.gpaLetter] || 'var(--text)',
                      }}>
                        {row.gpa.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        };

        const selectedClassObj = classes.find(c => String(c.id) === String(classFilter));
        const selectedSubjectObj = subjects.find(s => String(s.docId || s.id) === String(subjectFilter));
        const selectedProgramObj = programs.find(p => String(p.id) === String(programFilter));
        const classTerm = selectedClassObj?.term || termFilter || '';
        const localizedClassTerm = classTerm ? getLocalizedTermDisplay(classTerm, lang) : '';
        const classLabelBase = selectedClassObj ? (lang === 'ar' ? (selectedClassObj.nameAr || selectedClassObj.nameEn || selectedClassObj.code) : (selectedClassObj.nameEn || selectedClassObj.nameAr || selectedClassObj.code)) : '';
        const classLabel = localizedClassTerm ? `${classLabelBase} - ${localizedClassTerm}` : classLabelBase;
        const subjectLabel = selectedSubjectObj ? (lang === 'ar' ? (selectedSubjectObj.nameAr || selectedSubjectObj.nameEn) : (selectedSubjectObj.nameEn || selectedSubjectObj.nameAr)) : '';
        const programLabel = selectedProgramObj ? (lang === 'ar' ? (selectedProgramObj.nameAr || selectedProgramObj.nameEn) : (selectedProgramObj.nameEn || selectedProgramObj.nameAr)) : '';

        const hasAnyGpa = classGpaRows.length > 0 || subjectGpaRows.length > 0 || cumulativeGpaRows.length > 0;
        if (!hasAnyGpa) return null;

        return (
          <CollapsibleDashboardSection
            title={t('student_gpa_overview')}
            icon={getThemedIcon('ui', 'bar_chart3', 16, 'primary')}
            color="#6366f1"
            sectionId="marks-gpa-overview"
            defaultMode="minimize"
            className="gpa-overview-section"
            headerRight={
              <input
                type="text"
                placeholder={t('search_students')}
                value={gpaSearch}
                onChange={(e) => setGpaSearch(e.target.value)}
                style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.75rem', width: '150px' }}
              />
            }
            inlineFilters={renderGradeBadges()}
          >
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', width: '100%', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>
              {renderGpaCard(
                classGpaRows,
                t('class_gpa'),
                classLabel,
                '#6366f1',
                true
              )}
              </div>
              <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>
              {renderGpaCard(
                subjectGpaRows,
                t('subject_gpa'),
                subjectLabel,
                '#f59e0b',
                false
              )}
              </div>
              <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>
              {renderGpaCard(
                (() => {
                  const classStudentIds = new Set(classGpaRows.map(r => String(r.studentId)));
                  return cumulativeGpaRows.filter(r => classStudentIds.has(String(r.studentId)));
                })(),
                t('cumulative_gpa'),
                programLabel || t('all_subjects'),
                '#10b981',
                false
              )}
              </div>
            </div>
          </CollapsibleDashboardSection>
        );
      })()}

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
        const segments = [
          { key: 'midTermExam', label: t('mid_term_short'), color: '#6366f1', weight: dist.midTermExam || 0 },
          { key: 'finalExam', label: t('final'), color: '#8b5cf6', weight: dist.finalExam || 0 },
          { key: 'homework', label: t('homework_short'), color: '#ec4899', weight: dist.homework || 0 },
          { key: 'labsProjectResearch', label: t('labs_projects_research_short'), color: '#f59e0b', weight: dist.labsProjectResearch || 0 },
          { key: 'quizzes', label: t('quizzes'), color: '#10b981', weight: dist.quizzes || 0 },
          { key: 'participation', label: t('participation'), color: '#3b82f6', weight: dist.participation || 0 },
          { key: 'attendance', label: t('attendance'), color: '#64748b', weight: dist.attendance || 0 },
        ].filter(s => s.weight > 0);
        const selectedGpaStudent = selectedGpaStudents.length > 0 ? selectedGpaStudents[0] : null;
        const selectedStudentRows = selectedGpaStudents.map(sid =>
          mergedSubjectReportRows.find(r => String(r.studentId) === String(sid))
        ).filter(Boolean);
        const studentMarks = selectedStudentRows.length > 0 ? {
          midTermExam: selectedStudentRows[0].midTermExam || 0,
          finalExam: selectedStudentRows[0].finalExam || 0,
          homework: selectedStudentRows[0].homework || 0,
          labsProjectResearch: selectedStudentRows[0].labsProjectResearch || 0,
          quizzes: selectedStudentRows[0].quizzes || 0,
          participation: selectedStudentRows[0].participation || 0,
          attendance: selectedStudentRows[0].attendance || 0,
        } : null;
        const studentTotal = studentMarks
          ? studentMarks.midTermExam + studentMarks.finalExam + studentMarks.homework +
            studentMarks.labsProjectResearch + studentMarks.quizzes +
            studentMarks.participation + studentMarks.attendance
          : 0;
        const studentTotalRounded = Math.round(studentTotal * 1000) / 1000;

        const sortedRows = [...selectedStudentRows].map(sRow => {
          const isComp = (sRow.gradeType || GRADE_TYPE.CALCULATED) === GRADE_TYPE.COMPLEMENTARY;
          const sMarks = {
            midTermExam: (isComp && sRow.previousAttempt ? sRow.previousAttempt.midTermExam : sRow.midTermExam) || 0,
            finalExam: sRow.finalExam || 0,
            homework: (isComp && sRow.previousAttempt ? sRow.previousAttempt.homework : sRow.homework) || 0,
            labsProjectResearch: (isComp && sRow.previousAttempt ? sRow.previousAttempt.labsProjectResearch : sRow.labsProjectResearch) || 0,
            quizzes: (isComp && sRow.previousAttempt ? sRow.previousAttempt.quizzes : sRow.quizzes) || 0,
            participation: (isComp && sRow.previousAttempt ? sRow.previousAttempt.participation : sRow.participation) || 0,
            attendance: (isComp && sRow.previousAttempt ? sRow.previousAttempt.attendance : sRow.attendance) || 0,
          };
          const sTotal = sMarks.midTermExam + sMarks.finalExam + sMarks.homework +
            sMarks.labsProjectResearch + sMarks.quizzes +
            sMarks.participation + sMarks.attendance;
          const resolved = resolveMarkGrade({
            totalMarks: sRow.totalMarks,
            letterGrade: sRow.letterGrade,
            gradeType: sRow.gradeType,
            isRepeated: sRow.isRepeated,
            complementaryScore: sRow.finalExam,
            lang,
          });
          const displayTotal = isComp ? resolved.totalMarks : sTotal;
          const subjGpa = subjectGpaRows.find(r => String(r.studentId) === String(sRow.studentId));
          const cumGpa = cumulativeGpaRows.find(r => String(r.studentId) === String(sRow.studentId));
          return { sRow, sMarks, sTotal, displayTotal, isComp, subjGpa: subjGpa?.gpa, cumGpa: cumGpa?.gpa };
        }).sort((a, b) => gpaSortOrder === 'asc' ? a.displayTotal - b.displayTotal : b.displayTotal - a.displayTotal);

        return (
          <Card data-tour="marks-distribution" style={{ marginBottom: '1.5rem' }}>
            <CardBody>
              <div className={styles.distributionCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)', width: '150px', flexShrink: 0 }}>
                    {t('marks_distribution')}
                  </span>
                  <div className={styles.distributionBar} style={{ flex: 1 }}>
                    {segments.map(s => (
                      <div
                        key={s.key}
                        className={styles.distSegment}
                        style={{ width: `${s.weight}%`, background: s.color }}
                        onMouseMove={(e) => setHoveredTip({ text: `${s.label}: ${s.weight}%`, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredTip(null)}
                      />
                    ))}
                  </div>
                  {/* Spacer to match student row total + GPA columns (36px + 28px + 28px) */}
                  <div style={{ flexShrink: 0, minWidth: '92px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
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
                    <button
                      onClick={() => setShowExportDialog(true)}
                      style={{
                        background: 'linear-gradient(135deg, #800020 0%, #5c0017 100%)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                      }}
                    >
                      {getThemedIcon('ui', 'download', 16, 'white')}
                    </button>
                    {sortedRows.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setGpaSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        style={{ display: 'flex', alignItems: 'center', padding: '0.2rem 0.4rem', flexShrink: 0, border: 'none' }}
                      >
                        {gpaSortOrder === 'asc' ? '↑' : '↓'}
                      </Button>
                    )}
                  </div>
                </div>
                {sortedRows.map(({ sRow, sMarks, displayTotal, isComp, subjGpa, cumGpa }) => {
                  const sName = lang === 'ar' ? (sRow.studentNameAr || sRow.studentName) : sRow.studentName;
                  const displayName = sName && sName.length > 25 ? sName.slice(0, 25) : sName;
                  const isRowSelected = selectedGpaStudents.some(s => String(s) === String(sRow.studentId));
                  return (
                    <div
                      key={sRow.studentId}
                      onClick={() => setSelectedGpaStudents(prev => isRowSelected ? prev.filter(s => String(s) !== String(sRow.studentId)) : [...prev, sRow.studentId])}
                      style={{
                        marginTop: '4px',
                        padding: '2px 4px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: isRowSelected ? '2px solid #10b981' : '2px solid transparent',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ColoredTooltip title={sName}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text)', width: '150px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                          {displayName}
                        </span>
                        </ColoredTooltip>
                        <div className={styles.distributionBar} style={{ flex: 1 }}>
                          {segments.map(s => {
                            const mark = sMarks[s.key] || 0;
                            const segmentMax = s.key === 'finalExam' && isComp ? 100 : s.weight;
                            const fillPct = segmentMax > 0 ? Math.min((mark / segmentMax) * 100, 100) : 0;
                            return (
                              <div
                                key={s.key}
                                className={styles.distSegment}
                                style={{ width: `${s.weight}%`, background: 'var(--border)' }}
                                onMouseMove={(e) => setHoveredTip({
                                  text: `${sName} — ${s.label}: ${mark}/${segmentMax}`,
                                  x: e.clientX,
                                  y: e.clientY,
                                })}
                                onMouseLeave={() => setHoveredTip(null)}
                              >
                                <div style={{ width: `${fillPct}%`, height: '100%', background: s.color, opacity: 0.7, transition: 'width 0.3s ease', pointerEvents: 'none' }} />
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: '36px', wordWrap: 'break-word' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'normal' }}>
                            {Math.round(displayTotal * 10) / 10}
                          </span>
                          {isComp && sRow.previousAttempt && (
                            <span style={{ fontSize: '0.55rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                              {t('original_mark')}: {sRow.previousAttempt.totalMarks?.toFixed?.(1) ?? sRow.previousAttempt.totalMarks}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: '28px', wordWrap: 'break-word' }}>
                          <ColoredTooltip title={t('subject_gpa')}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#f59e0b', whiteSpace: 'normal' }}>
                              {subjGpa != null ? subjGpa.toFixed(2) : '—'}
                            </span>
                          </ColoredTooltip>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: '28px', wordWrap: 'break-word' }}>
                          <ColoredTooltip title={t('cumulative_gpa')}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#10b981', whiteSpace: 'normal' }}>
                              {cumGpa != null ? cumGpa.toFixed(2) : '—'}
                            </span>
                          </ColoredTooltip>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '2px' }}>
                        <div style={{ width: '150px', flexShrink: 0 }} />
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
                        {segments.map(s => {
                          const mark = sMarks[s.key] || 0;
                          return (
                            <span key={s.key} style={{ fontSize: '0.6rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                              <span style={{ color: s.color, fontWeight: 600 }}>●</span> {s.label}: {mark}/{s.weight}
                            </span>
                          );
                        })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {hoveredTip && createPortal(
                  <div style={{
                    position: 'fixed',
                    left: `${hoveredTip.x}px`,
                    top: `${hoveredTip.y}px`,
                    transform: 'translate(-50%, -120%)',
                    background: '#1f2937',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 99999,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}>
                    {hoveredTip.text}
                  </div>,
                  document.body
                )}
                <div className={styles.distributionLegend}>
                  {segments.map(s => (
                    <div key={s.key} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: s.color }} />
                      <span className={styles.legendLabel}>{s.label}</span>
                      <span className={styles.legendValue}>
                        {t('max')}: {s.weight}
                      </span>
                    </div>
                  ))}
                  {sortedRows.length > 0 && (
                    <>
                      <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: 'var(--text)' }} />
                        <span className={styles.legendLabel}>{t('total')}</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: '#f59e0b' }} />
                        <span className={styles.legendLabel}>{t('subject_gpa')}</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: '#10b981' }} />
                        <span className={styles.legendLabel}>{t('cumulative_gpa')}</span>
                      </div>
                    </>
                  )}
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
                  toast?.success?.(t('marks_distribution_updated'));
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
                <div>
                  <label>{t('mid_term')} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder={t('distribution_range_placeholder') || '0-100'}
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
                    placeholder={t('distribution_range_placeholder') || '0-100'}
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
                    placeholder={t('distribution_range_placeholder') || '0-100'}
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
                    placeholder={t('distribution_range_placeholder') || '0-100'}
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
                    placeholder={t('distribution_range_placeholder') || '0-100'}
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
                    placeholder={t('distribution_range_placeholder') || '0-100'}
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
                    placeholder={t('distribution_range_placeholder') || '0-100'}
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
                ...availableTerms.map(term => {
                  const formatted = formatTermDisplay(term);
                  return { value: term, label: t(formatted.toLowerCase()) || formatted };
                })
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
            <Select
              searchable
              placeholder={t('grade_type')}
              value={gradeTypeFilter}
              onChange={(e) => setGradeTypeFilter(e.target.value)}
              options={[
                { value: '', label: t('all') },
                { value: 'calculated', label: t(getGradeTypeLabelKey('calculated')) },
                { value: GRADE_TYPE.COMPLEMENTARY, label: t(getGradeTypeLabelKey(GRADE_TYPE.COMPLEMENTARY)) },
                { value: 'FB', label: `FB - ${t(getGradeTypeLabelKey('FB'))}` },
                { value: 'FA', label: `FA - ${t(getGradeTypeLabelKey('FA'))}` },
                { value: 'WF', label: `WF - ${t(getGradeTypeLabelKey('WF'))}` },
              ]}
              fullWidth
            />
            <Select
              searchable
              placeholder={t('grade')}
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              options={[
                { value: '', label: t('all') },
                ...gradeBadges.map(letter => ({ value: letter, label: gradeLetterLabel(letter) }))
              ]}
              fullWidth
            />
          </div>

          {/* Mark Range Filters — compact min/max inputs */}
          {(() => {
            const filterItems = [
              { key: 'midTermExam', label: t('mid_term_short'), color: '#6366f1' },
              { key: 'finalExam', label: t('final'), color: '#8b5cf6' },
              { key: 'homework', label: t('homework_short'), color: '#ec4899' },
              { key: 'labsProjectResearch', label: t('labs_projects_research_short'), color: '#f59e0b' },
              { key: 'quizzes', label: t('quizzes'), color: '#10b981' },
              { key: 'participation', label: t('participation'), color: '#3b82f6' },
              { key: 'attendance', label: t('attendance'), color: '#64748b' },
              { key: 'gradePoints', label: t('grade_points'), color: '#0ea5e9', step: 0.1 },
            ];
            const resetFilters = () => setMarkRangeFilters({
              midTermExam: [0, getMarkRangeMax('midTermExam')],
              finalExam: [0, getMarkRangeMax('finalExam')],
              homework: [0, getMarkRangeMax('homework')],
              labsProjectResearch: [0, getMarkRangeMax('labsProjectResearch')],
              quizzes: [0, getMarkRangeMax('quizzes')],
              participation: [0, getMarkRangeMax('participation')],
              attendance: [0, getMarkRangeMax('attendance')],
              gradePoints: [0, 4],
            });
            return (
              <div style={{ padding: '0.75rem', background: isDarkMode ? '#1f2937' : '#f9fafb', borderRadius: '8px', border: `1px solid var(--border)`, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{t('mark_range_filters')}</span>
                  <button
                    onClick={resetFilters}
                    style={{ padding: '2px 8px', fontSize: '0.7rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text)' }}
                  >
                    {t('reset')}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {filterItems.map(item => {
                    const max = getMarkRangeMax(item.key);
                    const [minVal, maxVal] = markRangeFilters[item.key] || [0, max];
                    const step = item.step || 1;
                    const isActive = minVal > 0 || maxVal < max;
                    const updateMin = (val) => setMarkRangeFilters(prev => ({ ...prev, [item.key]: [Math.min(val, maxVal), maxVal] }));
                    const updateMax = (val) => setMarkRangeFilters(prev => ({ ...prev, [item.key]: [minVal, Math.max(val, minVal)] }));
                    return (
                      <div
                        key={item.key}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '8px',
                          border: `1px solid ${isActive ? item.color : 'var(--border)'}`,
                          background: isDarkMode ? '#111827' : '#ffffff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: item.color, whiteSpace: 'nowrap' }}>{item.label}</span>
                          <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>/ {max}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between' }}>
                          <NumberInput
                            value={minVal}
                            onChange={updateMin}
                            min={0}
                            max={maxVal}
                            step={step}
                            width="52px"
                            readOnly
                            ariaLabel={`${item.label} ${t('min')}`}
                          />
                          <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>→</span>
                          <NumberInput
                            value={maxVal}
                            onChange={updateMax}
                            min={minVal}
                            max={max}
                            step={step}
                            width="52px"
                            readOnly
                            ariaLabel={`${item.label} ${t('max')}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          
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
              <>
              {selectedGpaStudents.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', padding: '0.4rem 0.75rem', marginBottom: '0.5rem', background: isDarkMode ? '#1f2937' : '#f0f9ff', border: `1px solid ${isDarkMode ? '#374151' : '#bae6fd'}`, borderRadius: '6px' }}>
                  {selectedGpaStudents.map(sid => {
                    const studentRow = marksReportData.find(r => String(r.studentId) === String(sid));
                    const studentName = lang === 'ar'
                      ? (studentRow?.studentNameAr || studentRow?.studentName || sid)
                      : (studentRow?.studentName || sid);
                    const gpaRow = classGpaRows.find(r => String(r.studentId) === String(sid)) ||
                                   subjectGpaRows.find(r => String(r.studentId) === String(sid)) ||
                                   cumulativeGpaRows.find(r => String(r.studentId) === String(sid));
                    const gpaLetter = gpaRow?.gpaLetter || '?';
                    const chipColor = gradeColors[gpaLetter] || '#6b7280';
                    return (
                      <span key={sid} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px 2px 4px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600, background: `${chipColor}15`, color: chipColor, border: `1px solid ${chipColor}30` }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '16px', height: '16px', padding: '0 3px', borderRadius: '8px', fontSize: '0.55rem', fontWeight: 700, color: '#fff', background: chipColor }}>
                          {gradeLetterLabel(gpaLetter)}
                        </span>
                        {studentName}
                        <span onClick={() => setSelectedGpaStudents(prev => prev.filter(s => String(s) !== String(sid)))} style={{ cursor: 'pointer', opacity: 0.6, fontWeight: 700, marginLeft: '2px' }}>×</span>
                      </span>
                    );
                  })}
                  <button
                    onClick={() => setSelectedGpaStudents([])}
                    style={{ padding: '2px 8px', border: '1px solid var(--border)', borderRadius: '4px', background: 'transparent', color: 'var(--text)', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600, marginInlineStart: 'auto', position: 'sticky', insetInlineEnd: '0' }}
                  >
                    {t('clear')} ×
                  </button>
                </div>
              )}
              <AdvancedDataGrid
                key={`marks-grid-${subjectFilter}-${refreshCounter}-${marksReportData.length}-${selectedGpaStudents.join(',')}`}
                rows={filteredGridRows}
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
                    minWidth: 250,
                    editable: false,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      return lang === 'ar' ? (row.studentNameAr || row.studentName) : row.studentName;
                    },
                  },
                  {
                    field: 'programName',
                    headerName: t('program'),
                    flex: 1,
                    minWidth: 200,
                    editable: false,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      return lang === 'ar' ? (row.programNameAr || row.programName) : row.programName;
                    },
                  },
                  {
                    field: 'subjectName',
                    headerName: t('subject'),
                    flex: 1,
                    minWidth: 220,
                    editable: false,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      return lang === 'ar' ? (row.subjectNameAr || row.subjectName) : row.subjectName;
                    },
                  },
                  {
                    field: 'className',
                    headerName: t('class'),
                    flex: 1,
                    minWidth: 200,
                    editable: false,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      const rawName = lang === 'ar' ? (row.classNameAr || row.className) : row.className;
                      return cleanClassDisplayName(rawName);
                    },
                  },
                  {
                    field: 'year',
                    headerName: t('year'),
                    width: 80,
                    editable: false,
                  },
                  {
                    field: 'term',
                    headerName: t('term') || t('semester'),
                    width: 90,
                    editable: false,
                    valueFormatter: (params) => {
                      const formatted = formatTermDisplay(params.value);
                      return t(formatted.toLowerCase()) || formatted;
                    },
                  },
                  {
                    field: 'midTermExam',
                    headerName: t('mid_term_short'),
                    width: 80,
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
                      const gt = params.row?.gradeType || 'calculated';
                      if (isManualGradeType(gt)) return <div style={{ color: '#9ca3af' }}>—</div>;
                      const value = params.value || 0;
                      const max = marksDistribution?.midTermExam || 20;
                      const isComp = gt === GRADE_TYPE.COMPLEMENTARY;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <ColoredTooltip title={isComp ? t('previous_attempt') : ''}>
                            <span style={{ opacity: isComp ? 0.5 : 1 }}>{value}/{max}</span>
                          </ColoredTooltip>
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
                    valueParser: (value, row) => {
                      const num = parseFloat(value);
                      const isComp = (row?.gradeType || 'calculated') === GRADE_TYPE.COMPLEMENTARY;
                      const max = isComp ? 100 : (marksDistribution?.finalExam || 40);
                      return isNaN(num) ? 0 : Math.max(0, Math.min(max, num));
                    },
                    valueFormatter: (params) => {
                      const value = params?.value || 0;
                      const row = params?.row || {};
                      const isComp = (row.gradeType || 'calculated') === GRADE_TYPE.COMPLEMENTARY;
                      const max = isComp ? 100 : (marksDistribution?.finalExam || 40);
                      return `${value}/${max}`;
                    },
                    renderCell: (params) => {
                      const row = params.row || {};
                      const gt = row.gradeType || 'calculated';
                      if (isManualGradeType(gt)) return <div style={{ color: '#9ca3af' }}>—</div>;
                      const value = params.value || 0;
                      const isComp = gt === GRADE_TYPE.COMPLEMENTARY;
                      const max = isComp ? 100 : (marksDistribution?.finalExam || 40);
                      const prevFinal = row.previousAttempt?.finalExam;
                      const prevMax = marksDistribution?.finalExam || 40;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontWeight: isComp ? 600 : 400 }}>{value}/{max}</span>
                          {isComp && prevFinal != null && (
                            <span style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280', opacity: 0.7 }}>
                              {t('previous')}: {prevFinal}/{prevMax}
                            </span>
                          )}
                        </div>
                      );
                    }
                  },
                  {
                    field: 'homework',
                    headerName: t('homework_short'),
                    width: 80,
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
                      const gt = params.row?.gradeType || 'calculated';
                      if (isManualGradeType(gt)) return <div style={{ color: '#9ca3af' }}>—</div>;
                      const value = params.value || 0;
                      const max = marksDistribution?.homework || 5;
                      const isComp = gt === GRADE_TYPE.COMPLEMENTARY;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <ColoredTooltip title={isComp ? t('previous_attempt') : ''}>
                            <span style={{ opacity: isComp ? 0.5 : 1 }}>{value}/{max}</span>
                          </ColoredTooltip>
                        </div>
                      );
                    }
                  },
                  {
                    field: 'labsProjectResearch',
                    headerName: t('labs_projects_research_short'),
                    width: 100,
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
                      const gt = params.row?.gradeType || 'calculated';
                      if (isManualGradeType(gt)) return <div style={{ color: '#9ca3af' }}>—</div>;
                      const value = params.value || 0;
                      const max = marksDistribution?.labsProjectResearch || 10;
                      const isComp = gt === GRADE_TYPE.COMPLEMENTARY;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <ColoredTooltip title={isComp ? t('previous_attempt') : ''}>
                            <span style={{ opacity: isComp ? 0.5 : 1 }}>{value}/{max}</span>
                          </ColoredTooltip>
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
                      const gt = params.row?.gradeType || 'calculated';
                      if (isManualGradeType(gt)) return <div style={{ color: '#9ca3af' }}>—</div>;
                      const value = params.value || 0;
                      const max = marksDistribution?.quizzes || 5;
                      const isComp = gt === GRADE_TYPE.COMPLEMENTARY;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <ColoredTooltip title={isComp ? t('previous_attempt') : ''}>
                            <span style={{ opacity: isComp ? 0.5 : 1 }}>{value}/{max}</span>
                          </ColoredTooltip>
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
                      const gt = params.row?.gradeType || 'calculated';
                      if (isManualGradeType(gt)) return <div style={{ color: '#9ca3af' }}>—</div>;
                      const value = params.value || 0;
                      const max = marksDistribution?.participation || 10;
                      const isComp = gt === GRADE_TYPE.COMPLEMENTARY;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <ColoredTooltip title={isComp ? t('previous_attempt') : ''}>
                            <span style={{ opacity: isComp ? 0.5 : 1 }}>{value}/{max}</span>
                          </ColoredTooltip>
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
                      const gt = params.row?.gradeType || 'calculated';
                      if (isManualGradeType(gt)) return <div style={{ color: '#9ca3af' }}>—</div>;
                      const value = params.value || 0;
                      const max = marksDistribution?.attendance || 10;
                      const isComp = gt === GRADE_TYPE.COMPLEMENTARY;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <ColoredTooltip title={isComp ? t('previous_attempt') : ''}>
                            <span style={{ opacity: isComp ? 0.5 : 1 }}>{value}/{max}</span>
                          </ColoredTooltip>
                        </div>
                      );
                    }
                  },
                  {
                    field: 'unexcusedAbsenceCount',
                    headerName: t('absent_no_excuse'),
                    width: 92,
                    type: 'number',
                    editable: false,
                    sortable: true,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                      return absenceInfo?.unexcusedAbsences || 0;
                    },
                    renderCell: (params) => {
                      const row = params?.row || {};
                      const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                      const count = absenceInfo?.unexcusedAbsences || 0;
                      const failThreshold = 8;
                      const isFail = count >= failThreshold;
                      const isWarning = !isFail && count >= Math.ceil(failThreshold * 0.75);
                      return (
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: isFail ? getAttendanceColor(ATTENDANCE_STATUS.ABSENT_NO_EXCUSE) : isWarning ? getAttendanceColor(ATTENDANCE_STATUS.LATE) : getAttendanceColor(ATTENDANCE_STATUS.PRESENT),
                          color: 'white',
                          textAlign: 'center',
                          fontWeight: 500,
                          minWidth: '60px'
                        }}>
                          {count}
                        </div>
                      );
                    }
                  },
                  {
                    field: 'excusedAbsenceCount',
                    headerName: t('absent_with_excuse'),
                    width: 92,
                    type: 'number',
                    editable: false,
                    sortable: true,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                      return absenceInfo?.excusedAbsences || 0;
                    },
                    renderCell: (params) => {
                      const row = params?.row || {};
                      const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                      const count = absenceInfo?.excusedAbsences || 0;
                      return (
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: getAttendanceColor(ATTENDANCE_STATUS.EXCUSED_LEAVE),
                          color: 'white',
                          textAlign: 'center',
                          fontWeight: 500,
                          minWidth: '60px'
                        }}>
                          {count}
                        </div>
                      );
                    }
                  },
                  {
                    field: 'lateCount',
                    headerName: t('late'),
                    width: 81,
                    type: 'number',
                    editable: false,
                    sortable: true,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                      return absenceInfo?.lateCount || 0;
                    },
                    renderCell: (params) => {
                      const row = params?.row || {};
                      const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                      const count = absenceInfo?.lateCount || 0;
                      return (
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: getAttendanceColor(ATTENDANCE_STATUS.LATE),
                          color: 'white',
                          textAlign: 'center',
                          fontWeight: 500,
                          minWidth: '60px'
                        }}>
                          {count}
                        </div>
                      );
                    }
                  },
                  {
                    field: 'humanCaseCount',
                    headerName: t('human_case'),
                    width: 98,
                    type: 'number',
                    editable: false,
                    sortable: true,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                      return absenceInfo?.humanCaseCount || 0;
                    },
                    renderCell: (params) => {
                      const row = params?.row || {};
                      const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                      const count = absenceInfo?.humanCaseCount || 0;
                      return (
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: getAttendanceColor(ATTENDANCE_STATUS.HUMAN_CASE),
                          color: 'white',
                          textAlign: 'center',
                          fontWeight: 500,
                          minWidth: '60px'
                        }}>
                          {count}
                        </div>
                      );
                    }
                  },
                  {
                    field: 'presentCount',
                    headerName: t('present'),
                    width: 87,
                    type: 'number',
                    editable: false,
                    sortable: true,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                      return absenceInfo?.presentCount || 0;
                    },
                    renderCell: (params) => {
                      const row = params?.row || {};
                      const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                      const count = absenceInfo?.presentCount || 0;
                      return (
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: getAttendanceColor(ATTENDANCE_STATUS.PRESENT),
                          color: 'white',
                          textAlign: 'center',
                          fontWeight: 500,
                          minWidth: '60px'
                        }}>
                          {count}
                        </div>
                      );
                    }
                  },
                  {
                    field: 'gradeType',
                    headerName: t('grade_type'),
                    width: 160,
                    editable: true,
                    type: 'singleSelect',
                    valueOptions: ({ row } = {}) => {
                      // Always show all grade type options so users can mark FB/FA/WF
                      // regardless of current calculated letter grade
                      const gradeTypeLabel = (code) => {
                        const isManual = isManualGradeType(code);
                        const label = t(getGradeTypeLabelKey(code));
                        return isManual ? `${code} - ${label}` : label;
                      };
                      return [
                        { value: 'calculated', label: gradeTypeLabel('calculated') },
                        { value: GRADE_TYPE.COMPLEMENTARY, label: gradeTypeLabel(GRADE_TYPE.COMPLEMENTARY) },
                        { value: 'FB', label: gradeTypeLabel('FB') },
                        { value: 'FA', label: gradeTypeLabel('FA') },
                        { value: 'WF', label: gradeTypeLabel('WF') },
                      ];
                    },
                    valueFormatter: (params) => {
                      const value = params?.value || 'calculated';
                      const isManual = isManualGradeType(value);
                      const label = t(getGradeTypeLabelKey(value));
                      return isManual ? `${value} - ${label}` : label;
                    },
                    renderCell: (params) => {
                      const value = params.value || 'calculated';
                      const isManual = isManualGradeType(value);
                      const isFail = isManual;
                      const isComp = value === GRADE_TYPE.COMPLEMENTARY;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <div style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            background: isFail ? '#dc2626' : isComp ? '#fef3c7' : '#e5e7eb',
                            color: isFail ? '#ffffff' : isComp ? '#92400e' : '#374151',
                            textAlign: 'center',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 500
                          }}>
                            {isManual ? `${value} - ${t(getGradeTypeLabelKey(value))}` : t(getGradeTypeLabelKey(value))}
                          </div>
                          {params.row.previousAttempt && (
                            <div style={{
                              fontSize: 'var(--font-size-xs)',
                              color: '#6b7280',
                              textAlign: 'center',
                              lineHeight: 1.2,
                              whiteSpace: 'nowrap',
                            }}>
                              {t('previous')}: {params.row.previousAttempt.totalMarks?.toFixed?.(1) || params.row.previousAttempt.totalMarks}% → {params.row.previousAttempt.letterGrade}
                            </div>
                          )}
                        </div>
                      );
                    }
                  },
                  {
                    field: 'originalMark',
                    headerName: t('original_mark'),
                    width: 95,
                    editable: false,
                    type: 'number',
                    valueFormatter: (params) => {
                      const value = params?.value;
                      if (value == null || value === '') return '—';
                      return `${Number(value).toFixed(1)}%`;
                    },
                    renderCell: (params) => {
                      const row = params.row || {};
                      const isComp = (row.gradeType || GRADE_TYPE.CALCULATED) === GRADE_TYPE.COMPLEMENTARY;
                      const value = row.originalMark ?? params.value;
                      if (value == null || value === '') {
                        return <div style={{ color: '#9ca3af' }}>—</div>;
                      }
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                          <span style={{ fontWeight: isComp ? 600 : 500 }}>
                            {Number(value).toFixed(1)}%
                          </span>
                          {isComp && row.previousAttempt?.letterGrade && (
                            <span style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280' }}>
                              ({row.previousAttempt.letterGrade})
                            </span>
                          )}
                        </div>
                      );
                    },
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
                        const score = row.finalExam || 0;
                        return (
                          <div style={{ 
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            padding: '4px 8px', borderRadius: '4px',
                            background: resolved.passed ? '#60a5fa' : '#ef4444',
                            color: 'white', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem',
                            lineHeight: 1.2,
                          }}>
                            <span>{score}/100</span>
                            <span style={{ fontSize: '0.6rem', fontWeight: 500, opacity: 0.9 }}>
                              {resolved.passed ? t('passed') : t('failed')}
                            </span>
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
                    field: 'attemptType',
                    headerName: t('attempt'),
                    width: 110,
                    editable: false,
                    valueGetter: (params) => {
                      const row = params.row || {};
                      const gradeType = row.gradeType || 'calculated';
                      if (gradeType === GRADE_TYPE.COMPLEMENTARY) return 'complementary';
                      if (isManualGradeType(gradeType)) return 'special';
                      return row.isRepeated ? 'repeated' : 'first';
                    },
                    renderCell: (params) => {
                      const value = params.value;
                      const styles = {
                        first: { bg: '#dbeafe', color: '#1e40af', label: t('first_attempt') },
                        complementary: { bg: '#fef3c7', color: '#92400e', label: t('complementary_exam') },
                        repeated: { bg: '#fce7f3', color: '#9f1239', label: t('repeated') },
                        special: { bg: '#fee2e2', color: '#991b1b', label: t('special_fail') },
                      };
                      const s = styles[value] || styles.first;
                      return (
                        <div style={{
                          padding: '3px 8px', borderRadius: '4px',
                          background: s.bg, color: s.color,
                          textAlign: 'center', fontSize: 'var(--font-size-xs)', fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}>
                          {s.label}
                        </div>
                      );
                    }
                  },
                  {
                    field: 'isRepeated',
                    headerName: t('repeated'),
                    width: 120,
                    editable: false,
                    valueFormatter: (params) => {
                      const row = params.row || {};
                      const gradeType = row.gradeType || 'calculated';
                      if (isManualGradeType(gradeType)) return '—';
                      return Boolean(params?.value) ? (t('yes')) : (t('no'));
                    },
                    renderCell: (params) => {
                      const row = params.row || {};
                      const gradeType = row.gradeType || 'calculated';
                      if (isManualGradeType(gradeType)) {
                        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>—</div>;
                      }
                      const isRepeated = Boolean(params.value);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', height: '100%' }}>
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
                                setRefreshCounter(c => c + 1);
                                
                                // Update the local state to show immediate feedback
                                params.api.updateRows([{ id: params.id, isRepeated: !isRepeated }]);
                                
                                toast?.success?.(t('marks_updated_successfully'));
                              } catch (error) {
                                console.error('Error updating isRepeated:', error);
                                toast?.error?.(error.message || t('failed_to_update_marks'));
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
                          <span style={{ fontSize: '12px', color: isRepeated ? '#22c55e' : '#ef4444' }}>
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
                    field: 'firstWarningEligible',
                    headerName: t('first_warning') || 'First Warning',
                    width: 100,
                    editable: false,
                    sortable: true,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                      if (!absenceInfo) return null;
                      const total = (absenceInfo.unexcusedAbsences || 0) + (absenceInfo.excusedAbsences || 0) + (absenceInfo.lateCount || 0) + (absenceInfo.humanCaseCount || 0);
                      return resolveWarningType(total, absenceInfo.unexcusedAbsences || 0) === WARNING_TYPE.FIRST ? 1 : 0;
                    },
                    renderCell: (params) => {
                      const row = params?.row || {};
                      const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                      if (!absenceInfo) return <span>—</span>;
                      const total = (absenceInfo.unexcusedAbsences || 0) + (absenceInfo.excusedAbsences || 0) + (absenceInfo.lateCount || 0) + (absenceInfo.humanCaseCount || 0);
                      const isEligible = resolveWarningType(total, absenceInfo.unexcusedAbsences || 0) === WARNING_TYPE.FIRST;
                      return (
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: isEligible ? '#dc2626' : 'transparent',
                          color: isEligible ? '#fff' : 'var(--muted, #6b7280)',
                          textAlign: 'center',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          minWidth: '60px'
                        }}>
                          {isEligible ? (t('yes') || 'Yes') : '—'}
                        </div>
                      );
                    }
                  },
                  {
                    field: 'finalWarningEligible',
                    headerName: t('final_warning') || 'Final Warning',
                    width: 100,
                    editable: false,
                    sortable: true,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                      if (!absenceInfo) return null;
                      const total = (absenceInfo.unexcusedAbsences || 0) + (absenceInfo.excusedAbsences || 0) + (absenceInfo.lateCount || 0) + (absenceInfo.humanCaseCount || 0);
                      return resolveWarningType(total, absenceInfo.unexcusedAbsences || 0) === WARNING_TYPE.FINAL ? 1 : 0;
                    },
                    renderCell: (params) => {
                      const row = params?.row || {};
                      const absenceInfo = absenceWarningCounts.find(a => String(a.studentId) === String(row.studentId));
                      if (!absenceInfo) return <span>—</span>;
                      const total = (absenceInfo.unexcusedAbsences || 0) + (absenceInfo.excusedAbsences || 0) + (absenceInfo.lateCount || 0) + (absenceInfo.humanCaseCount || 0);
                      const isEligible = resolveWarningType(total, absenceInfo.unexcusedAbsences || 0) === WARNING_TYPE.FINAL;
                      return (
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: isEligible ? '#991b1b' : 'transparent',
                          color: isEligible ? '#fff' : 'var(--muted, #6b7280)',
                          textAlign: 'center',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          minWidth: '60px'
                        }}>
                          {isEligible ? (t('yes') || 'Yes') : '—'}
                        </div>
                      );
                    }
                  },
                  {
                    field: 'classReport',
                    headerName: t('marks.export.classSubject', 'Report'),
                    width: 180,
                    sortable: false,
                    filterable: false,
                    exportable: false,
                    renderCell: (params) => {
                      const row = params.row;
                      const rowMetadata = {
                        ...exportMetadata,
                        classId: row.classId,
                        subjectId: row.subjectId,
                        programId: row.programId,
                        className: row.className,
                        classNameAr: row.classNameAr,
                        subjectName: row.subjectName,
                        subjectNameAr: row.subjectNameAr,
                        programName: row.programName,
                        programNameAr: row.programNameAr,
                      };
                      return (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 6 }}>
                          <MarksOfficialExportBar
                            mode="semester"
                            compact
                            reportRows={[row]}
                            metadata={rowMetadata}
                            lang={lang}
                            t={t}
                            onSuccess={(msg) => toast?.success?.(msg)}
                            onError={(msg) => toast?.error?.(msg)}
                          />
                          <MarksOfficialExportBar
                            mode="class"
                            compact
                            reportRows={[row]}
                            distribution={marksDistribution || row.distribution}
                            metadata={rowMetadata}
                            lang={lang}
                            t={t}
                            onSuccess={(msg) => toast?.success?.(msg)}
                            onError={(msg) => toast?.error?.(msg)}
                          />
                          <MarksOfficialExportBar
                            mode="qualitative"
                            compact
                            reportRows={[row]}
                            metadata={rowMetadata}
                            lang={lang}
                            t={t}
                            onSuccess={(msg) => toast?.success?.(msg)}
                            onError={(msg) => toast?.error?.(msg)}
                          />
                          <MarksOfficialExportBar
                            mode="warning-first"
                            compact
                            classId={row.classId}
                            studentIds={[row.studentId]}
                            metadata={rowMetadata}
                            lang={lang}
                            t={t}
                            onSuccess={(msg) => toast?.success?.(msg)}
                            onError={(msg) => toast?.error?.(msg)}
                          />
                          <MarksOfficialExportBar
                            mode="warning-final"
                            compact
                            classId={row.classId}
                            studentIds={[row.studentId]}
                            metadata={rowMetadata}
                            lang={lang}
                            t={t}
                            onSuccess={(msg) => toast?.success?.(msg)}
                            onError={(msg) => toast?.error?.(msg)}
                          />
                        </div>
                      );
                    },
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
                getRowHeight={(params) => {
                  const row = params.row || {};
                  const isComp = (row.gradeType || 'calculated') === GRADE_TYPE.COMPLEMENTARY;
                  const hasPrev = !!row.previousAttempt;
                  return (isComp && hasPrev) ? 52 : 36;
                }}
                pageSize={50}
                pageSizeOptions={[10, 25, 50, 100]}
                checkboxSelection
                disableRowSelectionOnClick
                exportFileName="student-marks"
                showExportButton
                exportLabel={t('export')}
                loadingOverlayMessage={marksReportLoading ? (t('loading_marks')) : undefined}
                onProcessRowUpdateError={(err) => {
                  error('[MarksPage] Row update error:', err);
                }}
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
                    
                    const gradeType = newRow.gradeType || 'calculated';

                    // Validate marks against distribution (only for calculated grades)
                    const validationErrors = [];
                    if (gradeType === 'calculated') {
                    if (newRow.midTermExam > distribution.midTermExam) validationErrors.push(t('field_cannot_exceed_max', { field: t('mid_term_exam'), max: distribution.midTermExam }));
                    if (newRow.finalExam > distribution.finalExam) validationErrors.push(t('field_cannot_exceed_max', { field: t('final_exam'), max: distribution.finalExam }));
                    if (newRow.homework > distribution.homework) validationErrors.push(t('field_cannot_exceed_max', { field: t('homework'), max: distribution.homework }));
                    if (newRow.labsProjectResearch > distribution.labsProjectResearch) validationErrors.push(t('field_cannot_exceed_max', { field: t('labs_project_research'), max: distribution.labsProjectResearch }));
                    if (newRow.quizzes > distribution.quizzes) validationErrors.push(t('field_cannot_exceed_max', { field: t('quizzes'), max: distribution.quizzes }));
                    if (newRow.participation > distribution.participation) validationErrors.push(t('field_cannot_exceed_max', { field: t('participation'), max: distribution.participation }));
                    if (newRow.attendance > distribution.attendance) validationErrors.push(t('field_cannot_exceed_max', { field: t('attendance'), max: distribution.attendance }));
                    } else if (gradeType === GRADE_TYPE.COMPLEMENTARY) {
                      if ((newRow.finalExam || 0) > 100) validationErrors.push(t('complementary_exam_score_cannot_exceed'));
                    }
                    
                    if (validationErrors.length > 0) {
                      toast?.error?.(validationErrors.join(', '));
                      throw new Error(t('validation_failed'));
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
                      gradeType
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
                      setRefreshCounter(c => c + 1);
                      
                      // Clear deduction cache for this student so drawer refreshes if reopened
                      const cacheKey = `${newRow.studentId}_${newRow.classId || ''}`;
                      setDeductionCache(prev => {
                        const next = { ...prev };
                        delete next[cacheKey];
                        return next;
                      });
                      
                      // Refresh deduction drawer if open for this student
                      if (showDeductionDrawer && deductionStudent && String(deductionStudent.studentId || deductionStudent.id) === String(newRow.studentId)) {
                        loadDeductionData({ ...deductionStudent, classId: newRow.classId, subjectId: newRow.subjectId });
                      }
                      
                      // Refresh history drawer if open for this student
                      if (showHistoryDrawer && selectedStudent && String(selectedStudent.studentId || selectedStudent.id) === String(newRow.studentId)) {
                        loadMarksHistory({ ...selectedStudent, classId: newRow.classId, subjectId: newRow.subjectId });
                      }
                      
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
              </>
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
        storageKey="marks_side_window"
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
        programId={programFilter}
        classId={deductionStudent?.classId || classFilter}
      />

      {/* Export Dialog */}
      <MarksExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        reportRows={classReportRows}
        metadata={exportMetadata}
        distribution={marksDistribution}
        lang={lang}
        t={t}
        disabled={!programFilter}
        loadReportRows={loadSemesterReportRows}
        studentIds={
          selectedGpaStudents.length > 0
            ? selectedGpaStudents
            : (selectedStudent
              ? [selectedStudent.studentId || selectedStudent.id]
              : (classFilter && classGpaRows.length > 0 ? classGpaRows.map((r) => r.studentId) : null))
        }
        classId={classFilter}
        onSuccess={(msg) => toast?.success?.(msg)}
        onError={(msg) => toast?.error?.(msg)}
        theme={theme}
      />
    </Container>
  );
};

export default MarksPage;
