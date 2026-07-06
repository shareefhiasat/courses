import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  mergeComplementaryRecords,
  getGpaStanding,
  isManualGradeType,
  getGradeTypeLabelKey,
} from '@services/business/enrollmentMarksService';
import MarksHistoryDrawer from '@components/academic/MarksHistoryDrawer';
import MarksOfficialExportBar from '@components/academic/MarksOfficialExportBar';
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
  const [subjectDistributions, setSubjectDistributions] = useState({});
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryStudent, setSelectedHistoryStudent] = useState(null);
  const [hoveredTip, setHoveredTip] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

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
    () => groupMarksBySemester(mergeComplementaryRecords(marksReportData)),
    [marksReportData]
  );

  // Fetch mark distribution for ALL subjects across all semesters
  useEffect(() => {
    if (groupedMarks.length === 0) return;
    const allSubjectIds = new Set();
    groupedMarks.forEach(g => g.courses.forEach(c => { if (c.subjectId) allSubjectIds.add(c.subjectId); }));
    const missing = [...allSubjectIds].filter(id => !(id in subjectDistributions));
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = {};
      for (const subjId of missing) {
        try {
          const result = await getSubjectMarksDistribution(subjId);
          if (result.success) entries[subjId] = result.data;
        } catch (err) {
          error('[MarksTab] Error loading subject distribution:', err);
        }
      }
      if (!cancelled && Object.keys(entries).length > 0) {
        setSubjectDistributions(prev => ({ ...prev, ...entries }));
      }
    })();
    return () => { cancelled = true; };
  }, [groupedMarks]);

  const cumulativeGpa = useMemo(
    () => calculateGpaFromMarks(mergeComplementaryRecords(marksReportData)).gpa,
    [marksReportData]
  );

  const exportMetadata = useMemo(() => {
    const row = marksReportData[0];
    if (!row) return {};
    const classRow = classId
      ? marksReportData.find((r) => String(r.classId) === String(classId))
      : row;
    return {
      programId: row.programId,
      programName: row.programName,
      subjectId: classRow?.subjectId,
      subjectName: classRow?.subjectName,
      subjectNameAr: classRow?.subjectNameAr,
      classId: classId || classRow?.classId,
      className: classRow?.className,
      year: row.year || '',
      term: row.term || '',
      examLabelAr: 'شهادة الفصل',
      examLabelEn: 'Semester Certificate',
      termLabelAr: row.term,
    };
  }, [marksReportData, classId]);

  const classReportRows = useMemo(() => {
    if (!classId) return [];
    return marksReportData.filter((row) => String(row.classId) === String(classId) && !row.isRepeated);
  }, [marksReportData, classId]);

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
        const gt = row.gradeType || GRADE_TYPE.CALCULATED;
        if (isManualGradeType(gt)) return <span style={{ color: '#9ca3af' }}>—</span>;
        const isComp = gt === GRADE_TYPE.COMPLEMENTARY;
        if (isComp && field !== 'finalExam') {
          const prevValue = row.previousAttempt?.[field] || 0;
          const max = marksDistribution?.[field] || maxDefault;
          return (
            <span style={{ opacity: 0.5 }} title={t('previous_attempt')}>
              {prevValue}/{max}
            </span>
          );
        }
        const value = params.value || 0;
        const max = isComp ? 100 : (marksDistribution?.[field] || maxDefault);
        const prevFinal = isComp ? row.previousAttempt?.finalExam : null;
        const prevMax = marksDistribution?.finalExam || maxDefault;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontWeight: isComp ? 600 : 400 }}>{value}/{max}</span>
            {isComp && prevFinal != null && (
              <span style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280', opacity: 0.7 }}>
                {t('previous') || 'Prev'}: {prevFinal}/{prevMax}
              </span>
            )}
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
      {
        field: 'year',
        headerName: t('year') || 'Year',
        width: 80,
        editable: false,
      },
      {
        field: 'term',
        headerName: t('term') || t('semester') || 'Term',
        width: 90,
        editable: false,
        valueFormatter: (params) => {
          const formatted = formatTermDisplay(params.value);
          return t(formatted.toLowerCase()) || formatted;
        },
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
        width: 130,
        editable: false,
        renderCell: (params) => {
          const value = params.value || GRADE_TYPE.CALCULATED;
          const isManual = isManualGradeType(value);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontSize: 'var(--font-size-xs)' }}>
                {isManual ? `${value} - ${t(getGradeTypeLabelKey(value))}` : t(getGradeTypeLabelKey(value))}
              </span>
              {params.row.previousAttempt && (
                <span style={{
                  fontSize: 'var(--font-size-xs)',
                  color: '#6b7280',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}>
                  {t('previous')}: {params.row.previousAttempt.totalMarks?.toFixed?.(1) || params.row.previousAttempt.totalMarks}% → {params.row.previousAttempt.letterGrade}
                </span>
              )}
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
      } else if (gradeType === GRADE_TYPE.COMPLEMENTARY) {
        if ((newRow.finalExam || 0) > 100) {
          toast?.error?.('Complementary exam score cannot exceed 100');
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
        setRefreshCounter(c => c + 1);
        toast?.success?.(t('marks_updated'));
      }
      return newRow;
    } catch (err) {
      error('[MarksTab] Error saving marks:', err);
      toast?.error?.(t('error_saving_marks'));
      throw err;
    }
  }, [marksDistribution, toast, t, loadMarksReport, refreshCounter]);

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

      {studentId && marksReportData.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <MarksOfficialExportBar
            mode="qualitative"
            reportRows={marksReportData.filter((row) => !row.isRepeated)}
            metadata={exportMetadata}
            lang={lang}
            t={tFn}
            studentIds={[studentId]}
            onSuccess={(msg) => toast?.success?.(msg)}
            onError={(msg) => toast?.error?.(msg)}
          />
          <MarksOfficialExportBar
            mode="semester"
            reportRows={marksReportData.filter((row) => !row.isRepeated)}
            metadata={exportMetadata}
            lang={lang}
            t={tFn}
            studentIds={[studentId]}
            onSuccess={(msg) => toast?.success?.(msg)}
            onError={(msg) => toast?.error?.(msg)}
          />
          {classId && classReportRows.length > 0 && (
            <MarksOfficialExportBar
              mode="class"
              reportRows={classReportRows}
              distribution={subjectDistributions[classReportRows[0]?.subjectId] || marksDistribution}
              metadata={exportMetadata}
              lang={lang}
              t={tFn}
              onSuccess={(msg) => toast?.success?.(msg)}
              onError={(msg) => toast?.error?.(msg)}
            />
          )}
          {classId && (
            <>
              <MarksOfficialExportBar
                mode="warning-first"
                classId={classId}
                studentIds={[studentId]}
                metadata={exportMetadata}
                lang={lang}
                t={tFn}
                onSuccess={(msg) => toast?.success?.(msg)}
                onError={(msg) => toast?.error?.(msg)}
              />
              <MarksOfficialExportBar
                mode="warning-final"
                classId={classId}
                studentIds={[studentId]}
                metadata={exportMetadata}
                lang={lang}
                t={tFn}
                onSuccess={(msg) => toast?.success?.(msg)}
                onError={(msg) => toast?.error?.(msg)}
              />
            </>
          )}
        </div>
      )}

      {groupedMarks.map((group) => (
        <CollapsibleSection
          key={`${group.semester}-${group.year}`}
          title={`${group.semester} ${group.year}`}
          summary={`${t('semester_gpa')}: ${group.gpa.toFixed(2)} (${getGpaStanding(group.gpa, lang).letter}) · ${group.courseCount} ${tFn('courses') || 'courses'}${group.repeatedCount > 0 ? ` · ${group.repeatedCount} ${tFn('repeated') || 'repeated'}` : ''}`}
          icon={ClipboardList}
          defaultOpen={false}
          testId={`marks-semester-${group.semester}-${group.year}`}
          storageKey={`sd_marks_semester_${group.semester}_${group.year}`}
        >
          {group.courses.map((course) => {
            const dist = subjectDistributions[course.subjectId];
            if (!dist) return null;
            const total = dist.midTermExam + dist.finalExam + dist.homework +
              dist.labsProjectResearch + dist.quizzes +
              dist.participation + dist.attendance;
            const studentTotal = (course.midTermExam || 0) + (course.finalExam || 0) +
              (course.homework || 0) + (course.labsProjectResearch || 0) +
              (course.quizzes || 0) + (course.participation || 0) + (course.attendance || 0);
            const studentTotalRounded = Math.round(studentTotal * 1000) / 1000;
            const segments = [
              { key: 'midTermExam', label: t('mid_term'), color: '#6366f1', weight: dist.midTermExam, mark: course.midTermExam || 0 },
              { key: 'finalExam', label: t('final'), color: '#8b5cf6', weight: dist.finalExam, mark: course.finalExam || 0 },
              { key: 'homework', label: t('homework'), color: '#ec4899', weight: dist.homework, mark: course.homework || 0 },
              { key: 'labsProjectResearch', label: t('labs'), color: '#f59e0b', weight: dist.labsProjectResearch, mark: course.labsProjectResearch || 0 },
              { key: 'quizzes', label: t('quizzes'), color: '#10b981', weight: dist.quizzes, mark: course.quizzes || 0 },
              { key: 'participation', label: t('participation'), color: '#3b82f6', weight: dist.participation, mark: course.participation || 0 },
              { key: 'attendance', label: t('attendance'), color: '#64748b', weight: dist.attendance, mark: course.attendance || 0 },
            ].filter(s => s.weight > 0);
            return (
              <div key={course.subjectId} className={styles.distributionCard}>
                <div className={styles.distributionHeader}>
                  <span className={styles.distributionTitle}>{course.subjectName}</span>
                  <span className={styles.distributionTotal}>{total}%</span>
                </div>
                {/* Distribution weights bar */}
                <div className={styles.distributionBar}>
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
                {/* Student's actual marks bar */}
                <div className={styles.distributionBar}>
                  {segments.map(s => {
                    const fillPct = s.weight > 0 ? Math.min((s.mark / s.weight) * 100, 100) : 0;
                    return (
                      <div
                        key={s.key}
                        className={styles.distSegment}
                        style={{ width: `${s.weight}%`, background: 'var(--border, #e5e7eb)' }}
                        onMouseMove={(e) => setHoveredTip({ text: `${s.label}: ${s.mark}/${s.weight}`, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredTip(null)}
                      >
                        <div style={{ width: `${fillPct}%`, height: '100%', background: s.color, opacity: 0.7, transition: 'width 0.3s ease', pointerEvents: 'none' }} />
                      </div>
                    );
                  })}
                </div>
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
                      <span className={styles.legendValue}>{s.mark}/{s.weight}</span>
                    </div>
                  ))}
                  <div className={styles.legendItemTotal}>
                    <span className={styles.legendTotalLabel}>{t('total')}</span>
                    <span className={styles.legendTotalValue}>{studentTotalRounded}/{total}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <AdvancedDataGrid
            key={`marks-grid-${group.semester}-${group.year}-${group.courses.length}-${refreshCounter}`}
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
