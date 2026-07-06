import React, { useCallback, useState } from 'react';
import { Button } from '@ui';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { OFFICIAL_REPORT_BUTTONS } from '@components/export/officialReportButtons.js';
import ExportProgressToast from '@components/export/ExportProgressToast';
import {
  EXPORT_FORMAT,
  exportSemesterCertificateReport,
  exportClassSubjectMarksReport,
  exportQualitativeCardReport,
  exportAttendanceWarningReport,
  prepareSemesterCertificateData,
  prepareClassSubjectMarksData,
  prepareQualitativeCardData,
  prepareAttendanceWarningData,
  resolveWarningType,
  WARNING_TYPE,
} from '@services/export/official-reports/index.jsx';
import { persistAndLogExport, mimeTypeForFormat } from '@services/business/exportDriveService.js';
import { fetchAbsenceWarningCounts } from '@services/business/attendanceDeductionService';
import { WORKFLOW_UI_COLORS } from '@constants/workflowConfig';

const MODE_LABELS = {
  semester: { en: 'Semester certificate', ar: 'شهادة الفصل' },
  class: { en: 'Class subject report', ar: 'كشف درجات المادة' },
  qualitative: { en: 'Qualitative card', ar: 'البطاقة النوعية' },
  'warning-first': { en: 'First warning', ar: 'إنذار أول' },
  'warning-final': { en: 'Final warning', ar: 'إنذار نهائي' },
};

const EXPORT_TYPES = {
  semester: 'marks_semester_certificate',
  class: 'marks_class_subject',
  qualitative: 'marks_qualitative_card',
  'warning-first': 'marks_warning_first',
  'warning-final': 'marks_warning_final',
};

/**
 * Official marks / attendance export controls (PDF / Excel) with Smart Drive auto-save.
 */
export default function MarksOfficialExportBar({
  mode = 'semester',
  reportRows = [],
  metadata = {},
  distribution = null,
  lang = 'ar',
  t = (k, d) => d || k,
  compact = false,
  disabled = false,
  loadReportRows = null,
  studentIds = null,
  classId = null,
  onSuccess,
  onError,
}) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [format, setFormat] = useState(EXPORT_FORMAT.PDF);
  const [exporting, setExporting] = useState(false);
  const buttonConfig = OFFICIAL_REPORT_BUTTONS.find((b) => b.mode === mode);

  const sanitize = (str) => (str ? String(str).replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') : '');
  const isAr = lang === 'ar';
  const label = isAr ? buttonConfig?.labelAr : buttonConfig?.labelEn ||
    (isAr ? MODE_LABELS[mode]?.ar : MODE_LABELS[mode]?.en);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const baseMeta = { ...metadata, watermarkUser: user };

      if (mode === 'warning-first' || mode === 'warning-final') {
        const targetClassId = classId || metadata.classId;
        if (!targetClassId) {
          onError?.(t('marks.export.classRequired', 'Select a class first'));
          return;
        }
        const warningType = mode === 'warning-final' ? WARNING_TYPE.FINAL : WARNING_TYPE.FIRST;
        const res = await fetchAbsenceWarningCounts({ classId: targetClassId, userId: studentIds?.[0] });
        const counts = res?.data || res?.payload || [];
        const eligible = counts.filter((s) => resolveWarningType(s.totalAbsences, s.unexcusedAbsences) === warningType);
        if (!eligible.length) {
          onError?.(t('marks.export.noWarningStudents', 'No students eligible for this warning'));
          return;
        }
        const reportData = prepareAttendanceWarningData({
          students: eligible,
          metadata: baseMeta,
          lang,
          warningType,
        });
        const filename = `${reportData.serial}_warning_${sanitize(metadata.className)}`;
        const blob = await exportAttendanceWarningReport(reportData, { format, filename });
        await persistAndLogExport({
          blob,
          filename,
          mimeType: mimeTypeForFormat(format),
          format,
          exportType: EXPORT_TYPES[mode],
          classId: targetClassId,
          programId: metadata.programId,
        });
      } else {
        const rows = typeof loadReportRows === 'function' ? await loadReportRows() : reportRows;
        if (!rows?.length) {
          onError?.(t('marks.export.noData', 'No marks data to export'));
          return;
        }

        if (mode === 'qualitative') {
          const reportData = prepareQualitativeCardData({
            reportRows: rows,
            metadata: baseMeta,
            lang,
            studentIds,
          });
          if (!reportData.students?.length) {
            onError?.(t('marks.export.noData', 'No marks data to export'));
            return;
          }
          const filename = `${reportData.serial}_qualitative_card_${sanitize(metadata.programName)}`;
          const blob = await exportQualitativeCardReport(reportData, { format, filename });
          await persistAndLogExport({
            blob,
            filename,
            mimeType: mimeTypeForFormat(format),
            format,
            exportType: EXPORT_TYPES.qualitative,
            programId: metadata.programId,
          });
        } else if (mode === 'semester') {
          const reportData = prepareSemesterCertificateData({ reportRows: rows, metadata: baseMeta, lang });
          const filename = `${reportData.serial}_semester_certificate_${sanitize(metadata.programName)}`;
          const blob = await exportSemesterCertificateReport(reportData, { format, filename });
          await persistAndLogExport({
            blob,
            filename,
            mimeType: mimeTypeForFormat(format),
            format,
            exportType: EXPORT_TYPES.semester,
            programId: metadata.programId,
            classId: metadata.classId,
          });
        } else {
          const reportData = prepareClassSubjectMarksData({
            reportRows: rows,
            distribution: distribution || rows[0]?.distribution,
            metadata: baseMeta,
            lang,
          });
          const filename = `${reportData.serial}_class_marks_${sanitize(metadata.subjectName)}_${sanitize(metadata.className)}`;
          const blob = await exportClassSubjectMarksReport(reportData, { format, filename });
          await persistAndLogExport({
            blob,
            filename,
            mimeType: mimeTypeForFormat(format),
            format,
            exportType: EXPORT_TYPES.class,
            programId: metadata.programId,
            subjectId: metadata.subjectId,
            classId: metadata.classId,
          });
        }
      }

      onSuccess?.(t('report_exported_successfully', 'Report exported successfully'));
    } catch (err) {
      console.error('[MarksOfficialExportBar] export failed', err);
      onError?.(err.message || t('export_failed', 'Export failed'));
    } finally {
      setExporting(false);
    }
  }, [
    mode, reportRows, loadReportRows, metadata, distribution, lang, format, user,
    studentIds, classId, t, onSuccess, onError,
  ]);

  const canExport = mode.startsWith('warning')
    ? Boolean(classId || metadata.classId)
    : (typeof loadReportRows === 'function' || reportRows?.length > 0);

  if (compact) {
    return (
      <>
        <ExportProgressToast visible={exporting} />
        <button
          type="button"
          onClick={handleExport}
          disabled={disabled || exporting || !canExport}
          title={label}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: disabled || !canExport ? 'not-allowed' : 'pointer',
            padding: 2,
            display: 'inline-flex',
            alignItems: 'center',
            color: buttonConfig?.color || WORKFLOW_UI_COLORS.ACTIVE,
            opacity: disabled || !canExport ? 0.4 : 1,
          }}
        >
          {buttonConfig?.icon ? getThemedIcon('ui', buttonConfig.icon, 12, theme) : getThemedIcon('ui', 'file_text', 12, theme)}
        </button>
      </>
    );
  }

  return (
    <>
      <ExportProgressToast visible={exporting} message={t('exporting_report', 'Exporting report...')} />
      <div
        data-tour="marks-official-export"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #6b7280)' }}>{label}</span>
        <div style={{ display: 'inline-flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border, #e5e7eb)' }}>
          {[EXPORT_FORMAT.PDF, EXPORT_FORMAT.EXCEL].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                background: format === f ? WORKFLOW_UI_COLORS.ACTIVE : 'transparent',
                color: format === f ? '#fff' : 'inherit',
                fontWeight: format === f ? 600 : 400,
              }}
            >
              {f === EXPORT_FORMAT.PDF ? t('export.pdf', 'PDF') : t('export.excel', 'Excel')}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={handleExport}
          disabled={disabled || exporting || !canExport}
          style={{ background: WORKFLOW_UI_COLORS.ACTIVE, borderColor: WORKFLOW_UI_COLORS.ACTIVE }}
        >
          {exporting ? '...' : t('export', 'Export')}
        </Button>
      </div>
    </>
  );
}
