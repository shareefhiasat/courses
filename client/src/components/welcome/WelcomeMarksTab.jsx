import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Search,
  History,
  FileText,
  Maximize2,
  Minimize2,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast, AdvancedDataGrid, Button, Card, CardBody, SimpleLoading, EmptyState, GridQuickFilterChips, Input } from '@ui';
import { getGradeColor } from '@constants/gradingStandards';
import ProgramsSelect from '@components/ui/Select/ProgramsSelect';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { getThemedIcon } from '@constants/iconTypes';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { academicTermToYearTerm } from '@utils/academicTermUtils';
import {
  getAllStudentMarksReport,
  getSubjectMarksDistribution,
  updateStudentMarks,
  getStudentMarksHistory,
  GRADE_TYPE,
} from '@services/business/enrollmentMarksService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getEnrollments } from '@services/business/enrollmentService';
import MarksHistoryDrawer from '@components/academic/MarksHistoryDrawer';
import ClassHistoryDrawer from '@components/workspace/ClassHistoryDrawer';
import MarksExportDialog from '@components/academic/MarksExportDialog';

const DEFAULT_MARKS_DISTRIBUTION = {
  midTermExam: 20,
  finalExam: 40,
  homework: 5,
  labsProjectResearch: 10,
  quizzes: 5,
  participation: 10,
  attendance: 10,
};

const VIEW_MODES = {
  TABLE: 'table',
  BOARD: 'board',
};

const SORT_KEYS = {
  NAME: 'name',
  TOTAL: 'total',
  GRADE: 'grade',
};

const FILTER_CHIPS = [
  { id: 'all', labelKey: 'all', color: 'gray' },
  { id: 'not_started', labelKey: 'marks.not_started', color: 'red' },
  { id: 'partial', labelKey: 'marks.partial', color: 'amber' },
  { id: 'complete', labelKey: 'marks.complete', color: 'green' },
  { id: 'in_workflow', labelKey: 'marks.in_workflow', color: 'purple' },
];

const STATUS_CHIP_COLORS = {
  red: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: '#ef4444' },
  amber: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: '#f59e0b' },
  green: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: '#22c55e' },
  purple: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: '#8b5cf6' },
  gray: { color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: '#64748b' },
};

function getCompletionStatus(row) {
  const workflow = row.marksWorkflow;
  if (workflow && workflow.status && workflow.status !== 'APPROVED') return 'in_workflow';
  const total = Number(row.totalMarks) || 0;
  if (total === 0) return 'not_started';
  if (total >= 100) return 'complete';
  return 'partial';
}

function getStatusColor(status) {
  return STATUS_CHIP_COLORS[FILTER_CHIPS.find((c) => c.id === status)?.color || 'muted'];
}

function sortRows(rows, sortKey, sortDir) {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    let aVal = '';
    let bVal = '';
    switch (sortKey) {
      case SORT_KEYS.NAME:
        aVal = (a.studentName || '').toLowerCase();
        bVal = (b.studentName || '').toLowerCase();
        break;
      case SORT_KEYS.TOTAL:
        aVal = Number(a.totalMarks) || 0;
        bVal = Number(b.totalMarks) || 0;
        break;
      case SORT_KEYS.GRADE:
        aVal = a.letterGrade || '';
        bVal = b.letterGrade || '';
        break;
      default:
        return 0;
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

export default function WelcomeMarksTab({
  welcomeContext,
  isDark: isDarkProp,
  expanded = false,
  onToggleExpand,
}) {
  const { t, lang } = useLang();
  const { user, isAdmin, isSuperAdmin, isHR, isInstructor } = useAuth();
  const { theme } = useTheme();
  const isDark = isDarkProp ?? theme === 'dark';
  const toast = useToast();
  const isAr = lang === 'ar';

  const canEditAll = isAdmin || isSuperAdmin || isHR;
  const isInstructorOnly = isInstructor && !canEditAll;

  const [programs, setPrograms] = useState(() => (welcomeContext?.program ? [welcomeContext.program] : []));
  const [subjects, setSubjects] = useState(() => (welcomeContext?.subjects || []));
  const [classes, setClasses] = useState(() => (welcomeContext?.classes || []));
  const [enrollments, setEnrollments] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  const [programFilter, setProgramFilter] = useState(() => String(welcomeContext?.program?.id || ''));
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const [marksReportData, setMarksReportData] = useState([]);
  const [marksReportLoading, setMarksReportLoading] = useState(false);
  const [marksDistribution, setMarksDistribution] = useState(null);
  const [loading, setLoading] = useState(false);

  const [viewMode, setViewMode] = useState(VIEW_MODES.TABLE);
  const [activeFilterId, setActiveFilterId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState(SORT_KEYS.NAME);
  const [sortDir, setSortDir] = useState('asc');

  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [classHistoryOpen, setClassHistoryOpen] = useState(false);
  const [classHistoryClass, setClassHistoryClass] = useState(null);

  const [showExportDialog, setShowExportDialog] = useState(false);

  const gridRef = useRef(null);

  // Derive year/term from selected class or academic term
  useEffect(() => {
    if (welcomeContext?.academicTerm) {
      const { year, term } = academicTermToYearTerm(welcomeContext.academicTerm);
      setYearFilter(String(year || ''));
      setTermFilter(String(term || ''));
    }
  }, [welcomeContext?.academicTerm]);

  // Initial data load (only if not provided from context)
  useEffect(() => {
    let cancelled = false;
    const loadInitial = async () => {
      setLoading(true);
      try {
        const [programsRes, subjectsRes, classesRes, enrollmentsRes] = await Promise.all([
          programs.length ? Promise.resolve({ success: true, data: programs }) : getPrograms(),
          subjects.length ? Promise.resolve({ success: true, data: subjects }) : getSubjects({ programId: welcomeContext?.program?.id }),
          classes.length ? Promise.resolve({ success: true, data: classes }) : getClasses(),
          getEnrollments({ programId: welcomeContext?.program?.id, limit: 10000, page: 1 }),
        ]);
        if (cancelled) return;
        if (programsRes.success) setPrograms(programsRes.data || []);
        if (subjectsRes.success) setSubjects(subjectsRes.data || []);
        if (classesRes.success) setClasses(classesRes.data || []);
        if (enrollmentsRes.success) {
          setEnrollments(enrollmentsRes.data || []);
          const enrollmentStudents = enrollmentsRes.data || [];
          const studentIds = [...new Set(enrollmentStudents.map((e) => e.userId).filter(Boolean))];
          setAllStudents(
            studentIds.map((id) => {
              const enrollment = enrollmentStudents.find((e) => e.userId === id);
              return {
                id,
                displayName: enrollment?.user?.displayName || enrollment?.user?.realName || t('student_name_placeholder', { id }),
                displayNameAr: enrollment?.user?.displayNameAr,
                email: enrollment?.user?.email,
                studentNumber: enrollment?.user?.studentNumber,
              };
            })
          );
        }
      } catch (err) {
        console.error('[WelcomeMarksTab] Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcomeContext?.program?.id, programs.length, subjects.length, classes.length, t]);

  // Load marks report when filters change
  const loadMarksReport = useCallback(async () => {
    if (!programFilter) {
      setMarksReportData([]);
      return;
    }
    setMarksReportLoading(true);
    try {
      const filters = { programId: programFilter };
      if (subjectFilter) filters.subjectId = subjectFilter;
      if (classFilter) filters.classId = classFilter;
      if (yearFilter) filters.year = yearFilter;
      if (termFilter) filters.term = termFilter;
      const result = await getAllStudentMarksReport(filters);
      if (result.success) {
        setMarksReportData(result.data || []);
      } else {
        console.error('[WelcomeMarksTab] Error loading marks report:', result.error);
        toast?.error?.(result.error || t('error_loading_marks'));
      }
    } catch (err) {
      console.error('[WelcomeMarksTab] Error loading marks report:', err);
      toast?.error?.(t('error_loading_marks'));
    } finally {
      setMarksReportLoading(false);
    }
  }, [programFilter, subjectFilter, classFilter, yearFilter, termFilter, t, toast]);

  useEffect(() => {
    loadMarksReport();
  }, [loadMarksReport]);

  // Load marks distribution when subject changes
  useEffect(() => {
    const load = async () => {
      if (!subjectFilter) {
        setMarksDistribution(null);
        return;
      }
      const result = await getSubjectMarksDistribution(subjectFilter);
      if (result.success) {
        setMarksDistribution(result.data || null);
      } else {
        setMarksDistribution(null);
      }
    };
    load();
  }, [subjectFilter]);

  const effectiveDistribution = useMemo(() => ({
    ...DEFAULT_MARKS_DISTRIBUTION,
    ...(marksDistribution || {}),
  }), [marksDistribution]);

  const classReportRows = useMemo(() => {
    if (!subjectFilter) return [];
    return marksReportData.filter((row) => {
      if (classFilter && String(row.classId) !== String(classFilter)) return false;
      if (String(row.subjectId) !== String(subjectFilter)) return false;
      return !row.isRepeated;
    });
  }, [marksReportData, subjectFilter, classFilter]);

  const mergedSubjectRows = useMemo(() => {
    if (!subjectFilter) return [];
    return marksReportData.filter((row) => String(row.subjectId) === String(subjectFilter));
  }, [marksReportData, subjectFilter]);

  const filteredGridRows = useMemo(() => {
    if (!subjectFilter) return [];
    let rows = mergedSubjectRows;

    if (activeFilterId !== 'all') {
      rows = rows.filter((row) => getCompletionStatus(row) === activeFilterId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((row) => {
        const name = (row.studentName || '').toLowerCase();
        const nameAr = (row.studentNameAr || '').toLowerCase();
        const number = String(row.studentNumber || '').toLowerCase();
        const email = String(row.studentEmail || '').toLowerCase();
        const className = (row.className || '').toLowerCase();
        const subjectName = (row.subjectName || '').toLowerCase();
        return name.includes(q) || nameAr.includes(q) || number.includes(q) || email.includes(q) || className.includes(q) || subjectName.includes(q);
      });
    }

    return sortRows(rows, sortKey, sortDir);
  }, [mergedSubjectRows, activeFilterId, searchQuery, sortKey, sortDir, subjectFilter]);

  const boardColumns = useMemo(() => {
    const columns = {
      not_started: [],
      partial: [],
      complete: [],
      in_workflow: [],
    };
    filteredGridRows.forEach((row) => {
      const status = getCompletionStatus(row);
      columns[status].push(row);
    });
    return columns;
  }, [filteredGridRows]);

  const selectedClassObj = useMemo(() => classes.find((c) => String(c.id) === String(classFilter)), [classes, classFilter]);
  const selectedSubjectObj = useMemo(() => subjects.find((s) => String(s.docId || s.id) === String(subjectFilter)), [subjects, subjectFilter]);
  const selectedProgramObj = useMemo(() => programs.find((p) => String(p.id) === String(programFilter)), [programs, programFilter]);

  const exportMetadata = useMemo(() => {
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
  }, [selectedProgramObj, selectedSubjectObj, selectedClassObj, programFilter, subjectFilter, classFilter, yearFilter, termFilter, lang, t]);

  const loadReportRows = useCallback(async () => {
    if (!programFilter) return [];
    const filters = { programId: programFilter };
    if (yearFilter) filters.year = yearFilter;
    if (termFilter) filters.term = termFilter;
    const result = await getAllStudentMarksReport(filters);
    return result.success ? (result.data || []) : [];
  }, [programFilter, yearFilter, termFilter]);

  const handleLoadMarksHistory = useCallback(async (student) => {
    setHistoryLoading(true);
    try {
      const studentId = student.studentId || student.id;
      const subjectId = student.subjectId;
      const classId = student.classId;
      const result = await getStudentMarksHistory(studentId, subjectId, classId);
      if (result.success) {
        setHistoryData(result.data || []);
        setSelectedStudent(student);
        setShowHistoryDrawer(true);
      } else {
        toast?.error?.(result.error || t('failed_to_load_marks_history'));
      }
    } catch (err) {
      toast?.error?.(t('failed_to_load_marks_history'));
    } finally {
      setHistoryLoading(false);
    }
  }, [t, toast]);

  const handleOpenClassHistory = useCallback(() => {
    if (!selectedClassObj) return;
    setClassHistoryClass(selectedClassObj);
    setClassHistoryOpen(true);
  }, [selectedClassObj]);

  const handleSort = useCallback((key) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const columns = useMemo(() => [
    {
      field: 'studentName',
      headerName: t('student'),
      flex: 1,
      minWidth: 240,
      sortable: true,
      renderCell: (params) => {
        const row = params.row || {};
        const student = allStudents.find((s) => String(s.id) === String(row.studentId));
        const status = getCompletionStatus(row);
        const statusColor = getStatusColor(status);
        const displayName = getLocalizedUserName(
          { displayName: row.studentName, displayNameAr: row.studentNameAr },
          lang,
          row.studentName || ''
        );
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, color: isDark ? '#f3f4f6' : '#1f2937' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: statusColor.color,
                    display: 'inline-block',
                  }}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </span>
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: isDark ? '#9ca3af' : '#6b7280', marginInlineStart: 14 }}>
                {row.studentNumber || student?.studentNumber || row.studentEmail || t('no_email')}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={getThemedIcon('ui', 'history', 14, theme)}
              onClick={() => handleLoadMarksHistory(row)}
            >
              {t('history')}
            </Button>
          </div>
        );
      },
    },
    {
      field: 'midTermExam',
      headerName: t('mid_term_short'),
      width: 80,
      editable: true,
      type: 'number',
      sortable: true,
      renderCell: (params) => {
        const value = params.value || 0;
        const max = effectiveDistribution.midTermExam;
        return (
          <div style={{ padding: '4px 8px', borderRadius: '4px', background: value >= max ? '#dc2626' : value >= max * 0.6 ? '#f59e0b' : '#10b981', color: 'white', textAlign: 'center', fontWeight: 500, fontSize: 12 }}>
            {value}/{max}
          </div>
        );
      },
    },
    {
      field: 'finalExam',
      headerName: t('final'),
      width: 90,
      editable: true,
      type: 'number',
      sortable: true,
      renderCell: (params) => {
        const value = params.value || 0;
        const max = effectiveDistribution.finalExam;
        return (
          <div style={{ padding: '4px 8px', borderRadius: '4px', background: value >= max ? '#dc2626' : value >= max * 0.6 ? '#f59e0b' : '#10b981', color: 'white', textAlign: 'center', fontWeight: 500, fontSize: 12 }}>
            {value}/{max}
          </div>
        );
      },
    },
    {
      field: 'homework',
      headerName: t('homework_short'),
      width: 80,
      editable: true,
      type: 'number',
      sortable: true,
      renderCell: (params) => {
        const value = params.value || 0;
        const max = effectiveDistribution.homework;
        return (
          <div style={{ padding: '4px 8px', borderRadius: '4px', background: value >= max ? '#dc2626' : value >= max * 0.6 ? '#f59e0b' : '#10b981', color: 'white', textAlign: 'center', fontWeight: 500, fontSize: 12 }}>
            {value}/{max}
          </div>
        );
      },
    },
    {
      field: 'labsProjectResearch',
      headerName: t('labs_projects_research_short'),
      width: 90,
      editable: true,
      type: 'number',
      sortable: true,
      renderCell: (params) => {
        const value = params.value || 0;
        const max = effectiveDistribution.labsProjectResearch;
        return (
          <div style={{ padding: '4px 8px', borderRadius: '4px', background: value >= max ? '#dc2626' : value >= max * 0.6 ? '#f59e0b' : '#10b981', color: 'white', textAlign: 'center', fontWeight: 500, fontSize: 12 }}>
            {value}/{max}
          </div>
        );
      },
    },
    {
      field: 'quizzes',
      headerName: t('quizzes'),
      width: 80,
      editable: true,
      type: 'number',
      sortable: true,
      renderCell: (params) => {
        const value = params.value || 0;
        const max = effectiveDistribution.quizzes;
        return (
          <div style={{ padding: '4px 8px', borderRadius: '4px', background: value >= max ? '#dc2626' : value >= max * 0.6 ? '#f59e0b' : '#10b981', color: 'white', textAlign: 'center', fontWeight: 500, fontSize: 12 }}>
            {value}/{max}
          </div>
        );
      },
    },
    {
      field: 'participation',
      headerName: t('participation'),
      width: 90,
      editable: true,
      type: 'number',
      sortable: true,
      renderCell: (params) => {
        const value = params.value || 0;
        const max = effectiveDistribution.participation;
        return (
          <div style={{ padding: '4px 8px', borderRadius: '4px', background: value >= max ? '#dc2626' : value >= max * 0.6 ? '#f59e0b' : '#10b981', color: 'white', textAlign: 'center', fontWeight: 500, fontSize: 12 }}>
            {value}/{max}
          </div>
        );
      },
    },
    {
      field: 'attendance',
      headerName: t('attendance'),
      width: 90,
      editable: true,
      type: 'number',
      sortable: true,
      renderCell: (params) => {
        const value = params.value || 0;
        const max = effectiveDistribution.attendance;
        return (
          <div style={{ padding: '4px 8px', borderRadius: '4px', background: value >= max ? '#dc2626' : value >= max * 0.6 ? '#f59e0b' : '#10b981', color: 'white', textAlign: 'center', fontWeight: 500, fontSize: 12 }}>
            {value}/{max}
          </div>
        );
      },
    },
    {
      field: 'totalMarks',
      headerName: t('total_marks'),
      width: 100,
      type: 'number',
      editable: false,
      sortable: true,
      renderCell: (params) => {
        const value = Number(params.value) || 0;
        return (
          <div style={{ padding: '4px 8px', borderRadius: '4px', background: value >= 90 ? '#dc2626' : value >= 80 ? '#f59e0b' : value >= 70 ? '#fbbf24' : value >= 60 ? '#60a5fa' : '#ef4444', color: 'white', textAlign: 'center', fontWeight: 600, fontSize: 12 }}>
            {value.toFixed(2)}%
          </div>
        );
      },
    },
    {
      field: 'letterGrade',
      headerName: t('grade'),
      width: 80,
      editable: false,
      sortable: true,
      renderCell: (params) => {
        const grade = params.value || '-';
        const color = getGradeColor(grade) || '#6b7280';
        return (
          <div style={{ padding: '4px 8px', borderRadius: '4px', background: color, color: 'white', textAlign: 'center', fontWeight: 600, fontSize: 12 }}>
            {grade}
          </div>
        );
      },
    },
  ], [t, lang, isDark, effectiveDistribution, theme, allStudents, handleLoadMarksHistory]);

  const processRowUpdate = useCallback(async (newRow) => {
    try {
      const gradeType = newRow.gradeType || 'calculated';
      const distribution = newRow.distribution || effectiveDistribution;
      const validationErrors = [];

      if (gradeType === 'calculated') {
        if (Number(newRow.midTermExam) > Number(distribution.midTermExam)) validationErrors.push(t('field_cannot_exceed_max', { field: t('mid_term_exam'), max: distribution.midTermExam }));
        if (Number(newRow.finalExam) > Number(distribution.finalExam)) validationErrors.push(t('field_cannot_exceed_max', { field: t('final_exam'), max: distribution.finalExam }));
        if (Number(newRow.homework) > Number(distribution.homework)) validationErrors.push(t('field_cannot_exceed_max', { field: t('homework'), max: distribution.homework }));
        if (Number(newRow.labsProjectResearch) > Number(distribution.labsProjectResearch)) validationErrors.push(t('field_cannot_exceed_max', { field: t('labs_project_research'), max: distribution.labsProjectResearch }));
        if (Number(newRow.quizzes) > Number(distribution.quizzes)) validationErrors.push(t('field_cannot_exceed_max', { field: t('quizzes'), max: distribution.quizzes }));
        if (Number(newRow.participation) > Number(distribution.participation)) validationErrors.push(t('field_cannot_exceed_max', { field: t('participation'), max: distribution.participation }));
        if (Number(newRow.attendance) > Number(distribution.attendance)) validationErrors.push(t('field_cannot_exceed_max', { field: t('attendance'), max: distribution.attendance }));
      } else if (gradeType === GRADE_TYPE.COMPLEMENTARY) {
        if (Number(newRow.finalExam || 0) > 100) validationErrors.push(t('complementary_exam_score_cannot_exceed'));
      }

      if (validationErrors.length > 0) {
        toast?.error?.(validationErrors.join(', '));
        throw new Error(t('validation_failed'));
      }

      const marksData = {
        midTermExam: Number(newRow.midTermExam) || 0,
        finalExam: Number(newRow.finalExam) || 0,
        homework: Number(newRow.homework) || 0,
        labsProjectResearch: Number(newRow.labsProjectResearch) || 0,
        quizzes: Number(newRow.quizzes) || 0,
        participation: Number(newRow.participation) || 0,
        attendance: Number(newRow.attendance) || 0,
        isRepeated: Boolean(newRow.isRepeated),
        gradeType,
      };

      const result = await updateStudentMarks(newRow.studentId, newRow.subjectId, newRow.classId, marksData);

      if (result.success) {
        await loadMarksReport();
        toast?.success?.(t('marks_updated'));
      } else {
        toast?.error?.(result.error || t('error_saving_marks'));
        throw new Error(result.error || t('error_saving_marks'));
      }

      return newRow;
    } catch (err) {
      console.error('[WelcomeMarksTab] Error saving marks:', err);
      toast?.error?.(t('error_saving_marks'));
      throw err;
    }
  }, [effectiveDistribution, t, toast, loadMarksReport]);

  const renderToolbar = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
      <div style={{ flex: '1 1 360px', minWidth: 280 }}>
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
          showTerms={false}
          showYears={false}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 auto' }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          size="small"
          onChange={(_, v) => v && setViewMode(v)}
          sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: '8px', p: '2px' }}
        >
          <ToggleButton value={VIEW_MODES.TABLE} sx={{ textTransform: 'none', borderRadius: '6px', border: 0 }}>
            <TableIcon size={14} style={{ marginInlineEnd: 4 }} />
            {t('table')}
          </ToggleButton>
          <ToggleButton value={VIEW_MODES.BOARD} sx={{ textTransform: 'none', borderRadius: '6px', border: 0 }}>
            <LayoutGrid size={14} style={{ marginInlineEnd: 4 }} />
            {t('board')}
          </ToggleButton>
        </ToggleButtonGroup>

        <div style={{ position: 'relative', flex: '1 1 160px', minWidth: 160 }}>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_students')}
            icon={<Search size={16} />}
          />
        </div>

        <ColoredTooltip title={t('marks_export')}>
          <span>
            <IconButton
              size="small"
              disabled={!classFilter || !subjectFilter}
              onClick={() => setShowExportDialog(true)}
              sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              <FileText size={18} />
            </IconButton>
          </span>
        </ColoredTooltip>

        <ColoredTooltip title={t('class_history')}>
          <span>
            <IconButton
              size="small"
              disabled={!classFilter}
              onClick={handleOpenClassHistory}
              sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              <History size={18} />
            </IconButton>
          </span>
        </ColoredTooltip>

        <ColoredTooltip title={expanded ? t('minimize') : t('maximize')}>
          <IconButton
            size="small"
            onClick={onToggleExpand}
            sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
          >
            {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </IconButton>
        </ColoredTooltip>
      </div>
    </div>
  );

  const renderChips = () => {
    const counts = {};
    mergedSubjectRows.forEach((row) => {
      const status = getCompletionStatus(row);
      counts[status] = (counts[status] || 0) + 1;
    });

    const chips = FILTER_CHIPS.map((chip) => ({
      ...chip,
      label: t(chip.labelKey) || chip.labelKey,
      count: chip.id === 'all' ? mergedSubjectRows.length : counts[chip.id] || 0,
      active: activeFilterId === chip.id,
      variant: chip.color,
    }));

    return (
      <div style={{ marginBottom: '0.75rem' }}>
        <GridQuickFilterChips
          chips={chips}
          onChipClick={(chip) => setActiveFilterId(chip.id)}
        />
      </div>
    );
  };

  const renderBoardColumn = (status, title, rows) => {
    const color = getStatusColor(status);
    return (
      <div
        key={status}
        style={{
          flex: '1 1 0',
          minWidth: 220,
          background: isDark ? '#111827' : '#f8fafc',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div
          style={{
            padding: '0.6rem 0.75rem',
            borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: `${color.color}14`,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: color.color }}>{title}</span>
          <span
            style={{
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '0.7rem',
              fontWeight: 700,
              background: color.color,
              color: '#fff',
            }}
          >
            {rows.length}
          </span>
        </div>
        <div style={{ padding: '0.5rem', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {rows.length === 0 && (
            <div style={{ textAlign: 'center', padding: '1rem', color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.8rem' }}>
              {t('no_students')}
            </div>
          )}
          {rows.map((row) => {
            const displayName = getLocalizedUserName(
              { displayName: row.studentName, displayNameAr: row.studentNameAr },
              lang,
              row.studentName || ''
            );
            const statusColor = getStatusColor(getCompletionStatus(row));
            return (
              <div
                key={row.id}
                onClick={() => handleLoadMarksHistory(row)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: isDark ? '#1f2937' : '#fff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor.color }} />
                  <span style={{ fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{row.studentNumber}</span>
                  <span>{Number(row.totalMarks).toFixed(2)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTable = () => (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <AdvancedDataGrid
        rows={filteredGridRows}
        columns={columns}
        getRowId={(row) => row.id}
        gridId="welcome-marks-tab"
        pageSize={50}
        pageSizeOptions={[10, 25, 50, 100]}
        checkboxSelection
        disableRowSelectionOnClick
        loadingOverlayMessage={marksReportLoading ? t('loading_marks') : undefined}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={(err) => console.error('[WelcomeMarksTab] row update error:', err)}
        autoHeight={false}
        sx={{ flex: 1 }}
      />
    </div>
  );

  const renderBoard = () => (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        gap: '0.75rem',
        overflowX: 'auto',
        padding: '0.25rem 0.25rem 1rem',
      }}
    >
      {renderBoardColumn('not_started', t('marks.not_started'), boardColumns.not_started)}
      {renderBoardColumn('partial', t('marks.partial'), boardColumns.partial)}
      {renderBoardColumn('complete', t('marks.complete'), boardColumns.complete)}
      {renderBoardColumn('in_workflow', t('marks.in_workflow'), boardColumns.in_workflow)}
    </div>
  );

  if (loading && !marksReportData.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Card style={{ marginBottom: '0.75rem', flexShrink: 0 }}>
        <CardBody>
          {renderToolbar()}
          {subjectFilter && renderChips()}
        </CardBody>
      </Card>

      {!subjectFilter ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: isDark ? '#94a3b8' : '#64748b',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {getThemedIcon('ui', 'graduation_cap', 48, theme)}
          <Typography variant="h6" color="textSecondary">
            {t('select_subject_to_view_marks')}
          </Typography>
        </Box>
      ) : (
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <CardBody style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {viewMode === VIEW_MODES.TABLE ? renderTable() : renderBoard()}
          </CardBody>
        </Card>
      )}

      <MarksHistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        historyData={historyData}
        loading={historyLoading}
        selectedStudent={selectedStudent}
      />

      <ClassHistoryDrawer
        isOpen={classHistoryOpen}
        onClose={() => setClassHistoryOpen(false)}
        classInfo={classHistoryClass}
        initialTab="export"
      />

      <MarksExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        reportRows={classReportRows}
        metadata={exportMetadata}
        distribution={marksDistribution}
        lang={lang}
        t={t}
        disabled={!programFilter}
        loadReportRows={loadReportRows}
        classId={classFilter}
        onSuccess={(msg) => toast?.success?.(msg)}
        onError={(msg) => toast?.error?.(msg)}
        theme={theme}
      />
    </Box>
  );
}
