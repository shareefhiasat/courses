import React, { useState } from 'react';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import {
  exportSemesterCertificateReport,
  exportClassSubjectMarksReport,
  exportQualitativeCardReport,
  exportAttendanceWarningReport,
  exportWeeklyScheduleReport,
  prepareSemesterCertificateData,
  prepareClassSubjectMarksData,
  prepareQualitativeCardData,
  prepareAttendanceWarningData,
  prepareWeeklyScheduleData,
  resolveWarningType,
  WARNING_TYPE,
} from '@services/export/official-reports/index.jsx';
import { persistAndLogExport, mimeTypeForFormat } from '@services/business/exportDriveService.js';
import { extractExportFileId, extractExportFolderId } from '@utils/exportSuccessUrls';
import { fetchAbsenceWarningCounts } from '@services/business/attendanceDeductionService';
import { loadWeeklyScheduleSources } from '@services/business/weeklyScheduleExportService.js';
import { useAuth } from '@contexts/AuthContext';
import OfficialReportsExportDialog from '@components/export/OfficialReportsExportDialog.jsx';
import { ALL_EXPORT_MODES } from '@components/export/officialReportButtons.js';

const EXPORT_TYPES = {
  semester: 'marks_semester_certificate',
  class: 'marks_class_subject',
  qualitative: 'marks_qualitative_card',
  'warning-first': 'marks_warning_first',
  'warning-final': 'marks_warning_final',
  'weekly-schedule': 'weekly_class_schedule',
};

const MarksExportDialog = ({
  isOpen,
  onClose,
  reportRows = [],
  metadata = {},
  distribution = null,
  lang = 'ar',
  t = (k, d) => d || k,
  disabled = false,
  loadReportRows = null,
  studentIds = null,
  classId = null,
  onSuccess,
  onError,
  theme = 'light',
  modes = ALL_EXPORT_MODES,
}) => {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportingMode, setExportingMode] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  const sanitize = (str) => (str ? String(str).replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') : '');

  const isButtonDisabled = (mode) => {
    if (mode === 'weekly-schedule') return false;
    if (disabled) return true;
    if (mode.startsWith('warning')) return !classId && !metadata.classId;
    if (mode === 'class') return !reportRows?.length && !loadReportRows;
    return !loadReportRows;
  };

  const handleExport = async (mode, exportFormat) => {
    setExporting(true);
    setExportingMode(mode);
    try {
      const baseMeta = { ...metadata, watermarkUser: user };

      if (mode === 'weekly-schedule') {
        const sources = await loadWeeklyScheduleSources({
          classId: metadata.classId || classId,
          programId: metadata.programId,
          year: metadata.year,
          term: metadata.term,
        });
        const reportData = prepareWeeklyScheduleData({
          metadata: baseMeta,
          lang,
          t,
          sessions: sources.sessions,
          breakSessions: sources.breakSessions,
          instructorAvailability: sources.instructorAvailability,
          timeSlots: sources.timeSlots,
        });
        const filename = `${reportData.serial}_weekly_schedule_${sanitize(metadata.programName || 'IT')}`;
        const blob = await exportWeeklyScheduleReport(reportData, { format: exportFormat, filename });
        const blobUrl = URL.createObjectURL(blob);
        const persisted = await persistAndLogExport({
          blob,
          filename,
          mimeType: mimeTypeForFormat(exportFormat),
          format: exportFormat,
          exportType: EXPORT_TYPES['weekly-schedule'],
          programId: metadata.programId,
          classId: metadata.classId,
        });
        setSuccessResult({
          mode,
          filename: persisted?.filename || filename,
          fileId: extractExportFileId(persisted),
          folderId: extractExportFolderId(persisted),
          blobUrl,
          format: exportFormat,
        });
        return;
      } else if (mode === 'warning-first' || mode === 'warning-final') {
        const targetClassId = classId || metadata.classId;
        if (!targetClassId) {
          onError?.(t('marks.export.classRequired', 'Select a class first'));
          return;
        }
        const warningType = mode === 'warning-final' ? WARNING_TYPE.FINAL : WARNING_TYPE.FIRST;
        const res = await fetchAbsenceWarningCounts({ classId: targetClassId });
        const counts = res?.data || res?.payload || [];
        const selectedSet = studentIds?.length ? new Set(studentIds.map(String)) : null;
        const eligible = counts
          .filter((s) => !selectedSet || selectedSet.has(String(s.studentId)))
          .filter((s) => resolveWarningType(s.totalAbsences, s.unexcusedAbsences) === warningType);
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
        const blob = await exportAttendanceWarningReport(reportData, { format: exportFormat, filename });
        const blobUrl = URL.createObjectURL(blob);
        const persisted = await persistAndLogExport({
          blob,
          filename,
          mimeType: mimeTypeForFormat(exportFormat),
          format: exportFormat,
          exportType: EXPORT_TYPES[mode],
          classId: targetClassId,
          programId: metadata.programId,
        });
        setSuccessResult({
          mode,
          filename: persisted?.filename || filename,
          fileId: extractExportFileId(persisted),
          folderId: extractExportFolderId(persisted),
          blobUrl,
          format: exportFormat,
        });
        return;
      } else {
        const rows = mode === 'class'
          ? reportRows
          : (typeof loadReportRows === 'function' ? await loadReportRows() : reportRows);
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
          const blob = await exportQualitativeCardReport(reportData, { format: exportFormat, filename });
          const blobUrl = URL.createObjectURL(blob);
          const persisted = await persistAndLogExport({
            blob,
            filename,
            mimeType: mimeTypeForFormat(exportFormat),
            format: exportFormat,
            exportType: EXPORT_TYPES.qualitative,
            programId: metadata.programId,
          });
          setSuccessResult({
            mode,
            filename: persisted?.filename || filename,
            fileId: extractExportFileId(persisted),
            folderId: extractExportFolderId(persisted),
            blobUrl,
            format: exportFormat,
          });
          return;
        } else if (mode === 'semester') {
          const reportData = prepareSemesterCertificateData({ reportRows: rows, metadata: baseMeta, lang, studentIds });
          const filename = `${reportData.serial}_semester_certificate_${sanitize(metadata.programName)}`;
          const blob = await exportSemesterCertificateReport(reportData, { format: exportFormat, filename });
          const blobUrl = URL.createObjectURL(blob);
          const persisted = await persistAndLogExport({
            blob,
            filename,
            mimeType: mimeTypeForFormat(exportFormat),
            format: exportFormat,
            exportType: EXPORT_TYPES.semester,
            programId: metadata.programId,
            classId: metadata.classId,
          });
          setSuccessResult({
            mode,
            filename: persisted?.filename || filename,
            fileId: extractExportFileId(persisted),
            folderId: extractExportFolderId(persisted),
            blobUrl,
            format: exportFormat,
          });
          return;
        } else {
          const reportData = prepareClassSubjectMarksData({
            reportRows: rows,
            distribution: distribution || rows[0]?.distribution,
            metadata: baseMeta,
            lang,
          });
          const filename = `${reportData.serial}_class_marks_${sanitize(metadata.subjectName)}_${sanitize(metadata.className)}`;
          const blob = await exportClassSubjectMarksReport(reportData, { format: exportFormat, filename });
          const blobUrl = URL.createObjectURL(blob);
          const persisted = await persistAndLogExport({
            blob,
            filename,
            mimeType: mimeTypeForFormat(exportFormat),
            format: exportFormat,
            exportType: EXPORT_TYPES.class,
            programId: metadata.programId,
            subjectId: metadata.subjectId,
            classId: metadata.classId,
          });
          setSuccessResult({
            mode,
            filename: persisted?.filename || filename,
            fileId: extractExportFileId(persisted),
            folderId: extractExportFolderId(persisted),
            blobUrl,
            format: exportFormat,
          });
          return;
        }
      }
    } catch (err) {
      console.error('[MarksExportDialog] export failed', err);
      onError?.(err.message || t('export_failed', 'Export failed'));
    } finally {
      setExporting(false);
      setExportingMode(null);
    }
  };

  return (
    <OfficialReportsExportDialog
      isOpen={isOpen}
      onClose={() => {
        if (successResult?.blobUrl) {
          URL.revokeObjectURL(successResult.blobUrl);
        }
        setSuccessResult(null);
        onClose();
      }}
      onExport={handleExport}
      modes={modes}
      isButtonDisabled={isButtonDisabled}
      lang={lang}
      t={t}
      theme={theme}
      exporting={exporting}
      exportingMode={exportingMode}
      successResult={successResult}
    />
  );
};

export default MarksExportDialog;
