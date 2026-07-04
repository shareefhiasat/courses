import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast } from '@ui';
import { Card, CardBody, Button, Badge, AdvancedDataGrid, SimpleLoading, EmptyState } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import CollapsibleSection from '@components/scheduling/CollapsibleSection';
import { ClipboardList } from 'lucide-react';
import {
  getAllStudentMarksReport,
  getSubjectMarksDistribution,
  updateStudentMarks,
  getStudentMarksHistory,
  GRADE_TYPE,
  resolveMarkGrade,
  getGradeColor,
  calculateGpaFromMarks,
  groupMarksBySemester,
} from '@services/business/enrollmentMarksService';
import MarksHistoryDrawer from '@components/academic/MarksHistoryDrawer';
import GpaSummaryCard from './GpaSummaryCard';
import { error } from '@services/utils/logger.js';
import styles from './MarksTab.module.css';

const MarksTab = React.memo(({
  canNavigateToMarksEntry = false,
  studentId,
  classId,
  t,
  lang,
}) => {
  const { isAdmin, isSuperAdmin, isInstructor, isHR } = useAuth();
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

  const groupedMarks = useMemo(
    () => groupMarksBySemester(marksReportData),
    [marksReportData]
  );

  const cumulativeGpa = useMemo(
    () => calculateGpaFromMarks(marksReportData).gpa,
    [marksReportData]
  );

  const totalRepeated = useMemo(
    () => groupedMarks.reduce((s, g) => s + (g.repeatedCount || 0), 0),
    [groupedMarks]
  );

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

  const columns = useMemo(() => {
    const makeMarkCell = (field, label, maxDefault) => ({
      field,
      headerName: t(label) || label,
      width: 90,
      editable: canEdit,
      type: 'number',
      renderCell: (params) => {
        const row = params.row;
        if (row.gradeType === GRADE_TYPE.COMPLEMENTARY && field !== 'finalExam') {
          return <span style={{ opacity: 0.4 }}>—</span>;
        }
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
        headerName: t('subject'),
        flex: 1,
        minWidth: 150,
        editable: false,
      },
      {
        field: 'className',
        headerName: t('class'),
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
        headerName: t('total'),
        width: 100,
        editable: false,
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
              background: value >= 90 ? '#10b981' : value >= 80 ? '#3b82f6' : value >= 70 ? '#f59e0b' : value >= 60 ? '#60a5fa' : '#ef4444',
              color: 'white', textAlign: 'center', fontWeight: 500,
            }}>{value.toFixed(1)}%</div>
          );
        },
      },
      {
        field: 'letterGrade',
        headerName: t('grade'),
        width: 80,
        editable: false,
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
              textAlign: 'center', fontWeight: 600, fontSize: '0.8rem',
            }}>{resolved.letter}</div>
          );
        },
      },
      {
        field: 'gradeDescription',
        headerName: t('grade_description'),
        width: 130,
        editable: false,
        valueGetter: (params) => {
          const row = params.row;
          const resolved = resolveMarkGrade({
            totalMarks: row.totalMarks,
            letterGrade: row.letterGrade,
            gradeType: row.gradeType,
            isRepeated: row.isRepeated,
            complementaryScore: row.finalExam,
            lang,
          });
          return resolved.gradeDescription;
        },
      },
      {
        field: 'gradePoints',
        headerName: t('grade_points'),
        width: 80,
        editable: false,
        valueGetter: (params) => {
          const row = params.row;
          const resolved = resolveMarkGrade({
            totalMarks: row.totalMarks,
            letterGrade: row.letterGrade,
            gradeType: row.gradeType,
            isRepeated: row.isRepeated,
            complementaryScore: row.finalExam,
            lang,
          });
          return resolved.points ?? row.gradePoints ?? 0;
        },
        renderCell: (params) => (
          <span style={{ fontWeight: 600 }}>{params.value ?? 0}</span>
        ),
      },
      {
        field: 'isRepeated',
        headerName: t('repeated'),
        width: 100,
        editable: false,
        renderCell: (params) => {
          const isRepeated = Boolean(params.value);
          return (
            <Badge variant={isRepeated ? 'success' : 'secondary'}>
              {isRepeated ? t('yes') : t('no')}
            </Badge>
          );
        },
      },
      {
        field: 'gradeType',
        headerName: t('grade_type'),
        width: 110,
        editable: false,
        renderCell: (params) => {
          const value = params.value || GRADE_TYPE.CALCULATED;
          const labels = {
            [GRADE_TYPE.CALCULATED]: t('calculated'),
            [GRADE_TYPE.COMPLEMENTARY]: t('complementary_exam'),
            FB: 'FB', FA: 'FA', WF: 'WF',
          };
          return (
            <span style={{ fontSize: 'var(--font-size-xs)' }}>
              {labels[value] || value}
            </span>
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
        renderCell: (params) => (
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => loadMarksHistory(params.row)}
            disabled={historyLoading}
            style={{ padding: '4px 8px', fontSize: 'var(--font-size-xs)', minWidth: '60px' }}
          >
            {historyLoading ? '...' : t('history')}
          </Button>
        ),
      },
    ];
  }, [t, lang, canEdit, marksDistribution, historyLoading, loadMarksHistory]);

  const processRowUpdate = useCallback(async (newRow) => {
    try {
      const distribution = marksDistribution || {
        midTermExam: 20, finalExam: 40, homework: 5,
        labsProjectResearch: 10, quizzes: 5, participation: 10, attendance: 10,
      };
      const gradeType = newRow.gradeType || GRADE_TYPE.CALCULATED;

      if (gradeType === GRADE_TYPE.CALCULATED) {
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
        gradeType,
      };
      const result = await updateStudentMarks(newRow.studentId, newRow.subjectId, newRow.classId, marksData);
      if (result.success) {
        await loadMarksReport();
        toast?.success?.(t('marks_updated'));
      }
      return newRow;
    } catch (err) {
      error('[MarksTab] Error saving marks:', err);
      toast?.error?.(t('error_saving_marks'));
      throw err;
    }
  }, [marksDistribution, toast, t, loadMarksReport]);

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
          title={t('no_marks_found')}
          description={t('no_marks_description')}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GpaSummaryCard
        semesterGroups={groupedMarks}
        cumulativeGpa={cumulativeGpa}
        totalCourses={marksReportData.length}
        totalRepeated={totalRepeated}
        t={t}
        lang={lang}
      />

      {canEdit && marksDistribution && (
        <div className={styles.distributionCard}>
          <div className={styles.distributionHeader}>
            <span className={styles.distributionTitle}>{t('marks_distribution')}</span>
            <span className={styles.distributionTotal}>
              {marksDistribution.midTermExam + marksDistribution.finalExam + marksDistribution.homework +
               marksDistribution.labsProjectResearch + marksDistribution.quizzes +
               marksDistribution.participation + marksDistribution.attendance}%
            </span>
          </div>
          <div className={styles.distributionBar}>
            <div className={styles.distSegment} style={{ width: `${marksDistribution.midTermExam}%`, background: '#6366f1' }} title={`${t('mid_term')} ${marksDistribution.midTermExam}%`} />
            <div className={styles.distSegment} style={{ width: `${marksDistribution.finalExam}%`, background: '#8b5cf6' }} title={`${t('final')} ${marksDistribution.finalExam}%`} />
            <div className={styles.distSegment} style={{ width: `${marksDistribution.homework}%`, background: '#ec4899' }} title={`${t('homework')} ${marksDistribution.homework}%`} />
            <div className={styles.distSegment} style={{ width: `${marksDistribution.labsProjectResearch}%`, background: '#f59e0b' }} title={`${t('labs')} ${marksDistribution.labsProjectResearch}%`} />
            <div className={styles.distSegment} style={{ width: `${marksDistribution.quizzes}%`, background: '#10b981' }} title={`${t('quizzes')} ${marksDistribution.quizzes}%`} />
            <div className={styles.distSegment} style={{ width: `${marksDistribution.participation}%`, background: '#3b82f6' }} title={`${t('participation')} ${marksDistribution.participation}%`} />
            <div className={styles.distSegment} style={{ width: `${marksDistribution.attendance}%`, background: '#64748b' }} title={`${t('attendance')} ${marksDistribution.attendance}%`} />
          </div>
          <div className={styles.distributionLegend}>
            <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#6366f1' }} /><span className={styles.legendLabel}>{t('mid_term')}</span><span className={styles.legendValue}>{marksDistribution.midTermExam}%</span></div>
            <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#8b5cf6' }} /><span className={styles.legendLabel}>{t('final')}</span><span className={styles.legendValue}>{marksDistribution.finalExam}%</span></div>
            <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#ec4899' }} /><span className={styles.legendLabel}>{t('homework')}</span><span className={styles.legendValue}>{marksDistribution.homework}%</span></div>
            <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#f59e0b' }} /><span className={styles.legendLabel}>{t('labs')}</span><span className={styles.legendValue}>{marksDistribution.labsProjectResearch}%</span></div>
            <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#10b981' }} /><span className={styles.legendLabel}>{t('quizzes')}</span><span className={styles.legendValue}>{marksDistribution.quizzes}%</span></div>
            <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#3b82f6' }} /><span className={styles.legendLabel}>{t('participation')}</span><span className={styles.legendValue}>{marksDistribution.participation}%</span></div>
            <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#64748b' }} /><span className={styles.legendLabel}>{t('attendance')}</span><span className={styles.legendValue}>{marksDistribution.attendance}%</span></div>
          </div>
        </div>
      )}

      {groupedMarks.map((group) => (
        <CollapsibleSection
          key={`${group.semester}-${group.year}`}
          title={`${group.semester} ${group.year}`}
          summary={`${t('semester_gpa')}: ${group.gpa.toFixed(2)} · ${group.courseCount} ${tFn('courses') || 'courses'}${group.repeatedCount > 0 ? ` · ${group.repeatedCount} ${tFn('repeated') || 'repeated'}` : ''}`}
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
            exportLabel={t('export')}
            loadingOverlayMessage={marksReportLoading ? t('loading_marks') : undefined}
            processRowUpdate={canEdit ? processRowUpdate : undefined}
          />
        </CollapsibleSection>
      ))}

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

MarksTab.displayName = 'MarksTab';
export default MarksTab;
