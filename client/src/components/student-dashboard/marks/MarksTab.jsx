import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast } from '@ui';
import { Card, CardBody, Button, Badge, AdvancedDataGrid, SimpleLoading, EmptyState } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import CollapsibleSection from '@components/scheduling/CollapsibleSection';
import { GraduationCap, ClipboardList } from 'lucide-react';
import {
  getAllStudentMarksReport,
  getSubjectMarksDistribution,
  updateStudentMarks,
  calculateLetterGrade,
  getStudentMarksHistory,
} from '@services/business/enrollmentMarksService';
import MarksHistoryDrawer from '@components/academic/MarksHistoryDrawer';
import { info, error } from '@services/utils/logger.js';
import styles from './MarksTab.module.css';

/**
 * Marks Tab – replicates the dashboard MarksPage UI.
 * Students see a read-only view; staff (HR/admin/instructor) get full editing.
 * Shows semester-grouped GPA summary + AdvancedDataGrid with marks breakdown.
 */
const MarksTab = React.memo(({
  marks = [],
  semesters = [],
  statsData = {},
  canNavigateToMarksEntry = false,
  studentId,
  classId,
  t,
  lang,
}) => {
  const { user, isAdmin, isSuperAdmin, isInstructor, isHR } = useAuth();
  const { t: tFn } = useLang();
  const { theme } = useTheme();
  const toast = useToast();

  const isStaff = isAdmin || isSuperAdmin || isInstructor || isHR;
  const canEdit = isStaff;

  const [marksReportData, setMarksReportData] = useState([]);
  const [marksReportLoading, setMarksReportLoading] = useState(false);
  const [marksDistribution, setMarksDistribution] = useState(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryStudent, setSelectedHistoryStudent] = useState(null);

  // Load marks report data filtered by studentId or classId
  const loadMarksReport = useCallback(async () => {
    if (!studentId && !classId) return;
    setMarksReportLoading(true);
    try {
      const filters = studentId ? { studentId } : { classId };
      const result = await getAllStudentMarksReport(filters);
      if (result.success) {
        setMarksReportData(result.data || []);
      } else {
        error('[MarksTab] Error loading marks report:', result.error);
      }
    } catch (err) {
      error('[MarksTab] Error loading marks report:', err);
    } finally {
      setMarksReportLoading(false);
    }
  }, [studentId, classId]);

  useEffect(() => {
    loadMarksReport();
  }, [loadMarksReport]);

  // Load marks distribution for the first subject (for display)
  const firstSubjectId = useMemo(() => {
    if (marksReportData.length > 0) return marksReportData[0].subjectId;
    return null;
  }, [marksReportData]);

  useEffect(() => {
    if (!firstSubjectId) {
      setMarksDistribution(null);
      return;
    }
    (async () => {
      try {
        const result = await getSubjectMarksDistribution(firstSubjectId);
        if (result.success) setMarksDistribution(result.data);
      } catch (err) {
        error('[MarksTab] Error loading marks distribution:', err);
      }
    })();
  }, [firstSubjectId]);

  // Group marks report data by semester/year
  const groupedMarks = useMemo(() => {
    const groups = new Map();
    for (const row of marksReportData) {
      const semester = row.semester || 'Unknown';
      const year = row.year || row.academicYear || new Date().getFullYear();
      const key = `${semester}-${year}`;
      if (!groups.has(key)) {
        groups.set(key, { semester, year, courses: [], gpa: 0 });
      }
      groups.get(key).courses.push(row);
    }
    // Calculate GPA per semester
    for (const group of groups.values()) {
      const gradedCourses = group.courses.filter(c => c.totalMarks != null);
      const totalPoints = gradedCourses.reduce((s, c) => {
        const grade = calculateLetterGrade(c.totalMarks, c.isRepeated);
        const points = gradeToPoints(grade);
        return s + points * (c.credits || 3);
      }, 0);
      const totalCredits = gradedCourses.reduce((s, c) => s + (c.credits || 3), 0);
      group.gpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
      group.courseCount = group.courses.length;
      group.repeatedCount = group.courses.filter(c => c.isRepeated).length;
    }
    return Array.from(groups.values()).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.semester.localeCompare(a.semester);
    });
  }, [marksReportData]);

  // Load marks history
  const loadMarksHistory = useCallback(async (row) => {
    try {
      setHistoryLoading(true);
      const result = await getStudentMarksHistory(row.studentId, row.subjectId, row.classId);
      if (result.success) {
        setHistoryData(result.data);
        setSelectedHistoryStudent(row);
        setShowHistoryDrawer(true);
      }
    } catch (err) {
      error('[MarksTab] Error loading marks history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Build columns for AdvancedDataGrid
  const columns = useMemo(() => {
    const makeMarkCell = (field, label, maxDefault) => ({
      field,
      headerName: t(label) || label,
      width: 90,
      editable: canEdit,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const max = marksDistribution?.[field] || maxDefault;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span>{value}/{max}</span>
          </div>
        );
      },
    });

    return [
      {
        field: 'subjectName',
        headerName: t('subject') || 'Subject',
        flex: 1,
        minWidth: 150,
        editable: false,
      },
      {
        field: 'className',
        headerName: t('class') || 'Class',
        flex: 1,
        minWidth: 120,
        editable: false,
      },
      makeMarkCell('midTermExam', 'mid_term', 20),
      makeMarkCell('finalExam', 'final', 40),
      makeMarkCell('homework', 'homework', 5),
      makeMarkCell('labsProjectResearch', 'labs', 10),
      makeMarkCell('quizzes', 'quizzes', 5),
      makeMarkCell('participation', 'participation', 10),
      makeMarkCell('attendance', 'attendance', 10),
      {
        field: 'totalMarks',
        headerName: t('total') || 'Total',
        width: 100,
        editable: false,
        renderCell: (params) => {
          const row = params.row;
          const gradeType = row.gradeType || 'calculated';
          if (gradeType !== 'calculated') {
            return (
              <div style={{
                padding: '4px 8px', borderRadius: '4px',
                background: '#dc2626', color: 'white',
                textAlign: 'center', fontWeight: 600,
              }}>{gradeType}</div>
            );
          }
          const value = params.value || 0;
          return (
            <div style={{
              padding: '4px 8px', borderRadius: '4px',
              background: value >= 90 ? '#dc2626' : value >= 80 ? '#f59e0b' : value >= 70 ? '#fbbf24' : value >= 60 ? '#60a5fa' : '#ef4444',
              color: 'white', textAlign: 'center', fontWeight: 500,
            }}>{value.toFixed(1)}%</div>
          );
        },
      },
      {
        field: 'letterGrade',
        headerName: t('grade') || 'Grade',
        width: 80,
        editable: false,
        renderCell: (params) => {
          const grade = params.value || '';
          let color = '#ef4444';
          if (grade.startsWith('A')) color = '#10b981';
          else if (grade.startsWith('B')) color = '#60a5fa';
          else if (grade.startsWith('C')) color = '#fbbf24';
          else if (grade.startsWith('D')) color = '#f59e0b';
          return (
            <div style={{
              padding: '4px 8px', borderRadius: '4px',
              background: color, color: 'white',
              textAlign: 'center', fontWeight: 600, fontSize: '0.8rem',
            }}>{grade}</div>
          );
        },
      },
      {
        field: 'isRepeated',
        headerName: t('repeated') || 'Repeated',
        width: 100,
        editable: false,
        renderCell: (params) => {
          const isRepeated = Boolean(params.value);
          return (
            <Badge variant={isRepeated ? 'success' : 'secondary'}>
              {isRepeated ? (t('yes') || 'Yes') : (t('no') || 'No')}
            </Badge>
          );
        },
      },
      {
        field: 'history',
        headerName: t('history') || 'History',
        width: 80,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => loadMarksHistory(params.row)}
            disabled={historyLoading}
            style={{ padding: '4px 8px', fontSize: '0.75rem', minWidth: '60px' }}
          >
            {historyLoading ? '...' : (t('history') || 'History')}
          </Button>
        ),
      },
    ];
  }, [t, canEdit, marksDistribution, historyLoading, loadMarksHistory]);

  // Process row update for staff editing
  const processRowUpdate = useCallback(async (newRow) => {
    try {
      const distribution = marksDistribution || {
        midTermExam: 20, finalExam: 40, homework: 5,
        labsProjectResearch: 10, quizzes: 5, participation: 10, attendance: 10,
      };
      const validationErrors = [];
      if (newRow.midTermExam > distribution.midTermExam) validationErrors.push(`Mid-term cannot exceed ${distribution.midTermExam}`);
      if (newRow.finalExam > distribution.finalExam) validationErrors.push(`Final cannot exceed ${distribution.finalExam}`);
      if (newRow.homework > distribution.homework) validationErrors.push(`Homework cannot exceed ${distribution.homework}`);
      if (newRow.labsProjectResearch > distribution.labsProjectResearch) validationErrors.push(`Labs cannot exceed ${distribution.labsProjectResearch}`);
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
        gradeType: newRow.gradeType || 'calculated',
      };
      const result = await updateStudentMarks(newRow.studentId, newRow.subjectId, newRow.classId, marksData);
      if (result.success) {
        await loadMarksReport();
        toast?.success?.(t('marks_updated') || 'Marks updated');
      }
      return newRow;
    } catch (err) {
      error('[MarksTab] Error saving marks:', err);
      toast?.error?.(t('error_saving_marks') || 'Error saving marks');
      throw err;
    }
  }, [marksDistribution, toast, t, loadMarksReport]);

  // Overall GPA summary
  const overallGPA = useMemo(() => {
    if (groupedMarks.length === 0) return 0;
    const totalGPA = groupedMarks.reduce((s, g) => s + g.gpa * g.courseCount, 0);
    const totalCourses = groupedMarks.reduce((s, g) => s + g.courseCount, 0);
    return totalCourses > 0 ? parseFloat((totalGPA / totalCourses).toFixed(2)) : 0;
  }, [groupedMarks]);

  const totalRepeated = useMemo(() =>
    groupedMarks.reduce((s, g) => s + (g.repeatedCount || 0), 0), [groupedMarks]);

  if (marksReportLoading && marksReportData.length === 0) {
    return (
      <div className={styles.container}>
        <SimpleLoading loading type="spinner" size="md" />
      </div>
    );
  }

  if (marksReportData.length === 0) {
    return (
      <div className={styles.container}>
        <EmptyState
          icon={getThemedIcon('ui', 'clipboard', 48)}
          title={t('no_marks_found') || (lang === 'ar' ? 'لا توجد درجات' : 'No Marks Found')}
          description={t('no_marks_description') || (lang === 'ar' ? 'لم يتم العثور على درجات لهذا الطالب' : 'No marks records found for this student')}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* GPA Summary Card */}
      <div className={styles.gpaCard}>
        <div className={styles.gpaIcon}>
          <GraduationCap size={28} color="white" />
        </div>
        <div className={styles.gpaInfo}>
          <span className={styles.gpaLabel}>{t('gpa') || 'GPA'}</span>
          <span className={styles.gpaValue}>{overallGPA.toFixed(2)}</span>
        </div>
        <div className={styles.gpaDivider} />
        <div className={styles.gpaInfo}>
          <span className={styles.gpaLabel}>{t('total_courses') || 'Total Courses'}</span>
          <span className={styles.gpaValue}>{marksReportData.length}</span>
        </div>
        <div className={styles.gpaDivider} />
        <div className={styles.gpaInfo}>
          <span className={styles.gpaLabel}>{t('repeated') || 'Repeated'}</span>
          <span className={styles.gpaValue}>{totalRepeated}</span>
        </div>
      </div>

      {/* Marks Distribution Display (staff only) */}
      {canEdit && marksDistribution && (
        <Card style={{ marginBottom: '1rem' }}>
          <CardBody>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem' }}>
              <span>{t('mid_term') || 'Mid-Term'}: {marksDistribution.midTermExam}%</span>
              <span>{t('final') || 'Final'}: {marksDistribution.finalExam}%</span>
              <span>{t('homework') || 'Homework'}: {marksDistribution.homework}%</span>
              <span>{t('labs') || 'Labs'}: {marksDistribution.labsProjectResearch}%</span>
              <span>{t('quizzes') || 'Quizzes'}: {marksDistribution.quizzes}%</span>
              <span>{t('participation') || 'Participation'}: {marksDistribution.participation}%</span>
              <span>{t('attendance') || 'Attendance'}: {marksDistribution.attendance}%</span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Semester-grouped marks grids */}
      {groupedMarks.map((group) => (
        <CollapsibleSection
          key={`${group.semester}-${group.year}`}
          title={`${group.semester} ${group.year}`}
          summary={`GPA: ${group.gpa.toFixed(2)} · ${group.courseCount} ${tFn('courses') || 'courses'}${group.repeatedCount > 0 ? ` · ${group.repeatedCount} ${tFn('repeated') || 'repeated'}` : ''}`}
          icon={ClipboardList}
          defaultOpen
          testId={`marks-semester-${group.semester}-${group.year}`}
        >
          <AdvancedDataGrid
            key={`marks-grid-${group.semester}-${group.year}-${group.courses.length}`}
            rows={group.courses}
            columns={columns}
            pageSize={10}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            exportFileName={`marks-${group.semester}-${group.year}`}
            showExportButton
            exportLabel={t('export') || 'Export'}
            loadingOverlayMessage={marksReportLoading ? (t('loading_marks') || 'Loading marks...') : undefined}
            processRowUpdate={canEdit ? processRowUpdate : undefined}
          />
        </CollapsibleSection>
      ))}

      {/* Marks History Drawer */}
      <MarksHistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        historyData={historyData}
        loading={historyLoading}
        selectedStudent={selectedHistoryStudent}
      />
    </div>
  );
});

// Helper: Convert letter grade to GPA points
function gradeToPoints(grade) {
  const map = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0, 'FB': 0, 'FA': 0, 'WF': 0,
  };
  return map[grade] ?? 0;
}

MarksTab.displayName = 'MarksTab';
export default MarksTab;
