import React, { useState } from 'react';
import {
  exportWeeklyScheduleReport,
  prepareWeeklyScheduleData,
} from '@services/export/official-reports/index.jsx';
import { persistAndLogExport, mimeTypeForFormat } from '@services/business/exportDriveService.js';
import { extractExportFileId, extractExportFolderId } from '@utils/exportSuccessUrls';
import { buildReportFilename } from '@services/export/official-reports/engine/reportFilename.js';
import { loadWeeklyScheduleSources } from '@services/business/weeklyScheduleExportService.js';
import { useAuth } from '@contexts/AuthContext';
import OfficialReportsExportDialog from '@components/export/OfficialReportsExportDialog.jsx';
import { SCHEDULING_EXPORT_MODES } from '@components/export/officialReportButtons.js';

/**
 * Scheduling export dialog — same shell as marks export, scheduling reports only.
 * Use on Scheduling Calendar / session availability pages.
 */
const SchedulingExportDialog = ({
  isOpen,
  onClose,
  metadata = {},
  lang = 'ar',
  t = (k, d) => d || k,
  onSuccess,
  onError,
  theme = 'light',
}) => {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportingMode, setExportingMode] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  const isButtonDisabled = () => false;

  const handleExport = async (mode, exportFormat) => {
    setExporting(true);
    setExportingMode(mode);
    try {
      const baseMeta = { ...metadata, watermarkUser: user };

      if (mode === 'weekly-schedule') {
        const sources = await loadWeeklyScheduleSources({
          classId: metadata.classId,
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
        const filename = buildReportFilename({
          type: 'weekly-schedule',
          programName: metadata.programName,
          className: metadata.className,
          subjectName: metadata.subjectName,
          serial: reportData.serial,
          ext: exportFormat === 'excel' ? 'xlsx' : 'pdf',
          lang,
        }).replace(/\.(pdf|xlsx)$/i, '');
        const blob = await exportWeeklyScheduleReport(reportData, { format: exportFormat, filename });
        const blobUrl = URL.createObjectURL(blob);
        const persisted = await persistAndLogExport({
          blob,
          filename,
          mimeType: mimeTypeForFormat(exportFormat),
          format: exportFormat,
          exportType: 'weekly_class_schedule',
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
        onSuccess?.(t('report_exported_successfully', 'Report exported successfully'));
      }
    } catch (err) {
      console.error('[SchedulingExportDialog] export failed', err);
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
      modes={SCHEDULING_EXPORT_MODES}
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

export default SchedulingExportDialog;
