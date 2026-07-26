import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import { EXPORT_FORMAT, downloadBlob } from '@services/export/official-reports/index.jsx';
import {
  exportWeeklyScheduleForScope,
  exportDailyOfficialTemplate,
  exportDailyOfficialForDate,
} from '@services/business/accessScopeExportService.js';
import { FileText, FileSpreadsheet, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton } from '@mui/material';
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';
import useQRPermissions from '@hooks/useQRPermissions';
import { isHROnlyViewer } from '@components/operations-board/hrAttendancePrivacy.js';
import { academicTermToYearTerm } from '@utils/academicTermUtils';
import AppMenu from '@components/ui/mui/AppMenu.jsx';
import InitiateWorkflowDialog from '@components/workspace/InitiateWorkflowDialog.jsx';
import { findExistingAttendanceWorkflow } from '@services/business/workflowInitiationService.js';

function ScheduleContextMenu({
  session,
  anchorEl,
  open,
  onClose,
  selectedDate,
  program,
  academicTerm,
  onOpenInbox,
  onOpenHistory,
  onOpenOperations,
  onOpenNotifications,
  onExportSuccess,
}) {
  const { user, isAdmin, isHR, isSuperAdmin, isInstructor } = useAuth();
  const { t, lang } = useLang();
  const { canExport, canSeeStandupMode } = useQRPermissions();
  const hrOnly = isHROnlyViewer({ isHR, isAdmin, isSuperAdmin });
  const instructorOnly = isInstructor && !isAdmin && !isHR && !isSuperAdmin;
  const [exporting, setExporting] = useState(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [existingWorkflow, setExistingWorkflow] = useState(null);

  const cls = session?.class;
  const subject = cls?.subject;
  const slotInstructor = session?.instructor || cls?.instructorName;
  const dateStr = selectedDate
    ? selectedDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!cls?.id || !dateStr) {
      setExistingWorkflow(null);
      return undefined;
    }
    if (!open) return undefined;
    let cancelled = false;
    findExistingAttendanceWorkflow(cls.id, dateStr).then((result) => {
      if (!cancelled) setExistingWorkflow(result.success ? result.data : null);
    });
    return () => { cancelled = true; };
  }, [open, cls?.id, dateStr]);

  const runExport = useCallback(async (key, fn) => {
    setExporting(key);
    try {
      await fn();
      onClose();
    } catch (err) {
      console.error('[ScheduleContextMenu] export failed:', err);
    } finally {
      setExporting(null);
    }
  }, [onClose]);

  const buildExportBanner = useCallback((label, format, blob, filename, blobUrl) => ({
    pillColor: '#059669',
    icon: <CheckCircle2 size={16} className="shrink-0" />,
    message: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0px', fontSize: '0.75rem' }}>
        {`${label} — ${t('export_success') || 'Export successful'}`}
        <button
          type="button"
          className="inline-flex items-center gap-0.5 rounded-md text-xs font-semibold px-1.5 py-0.5 hover:bg-white/25 transition-colors"
          onClick={() =>
            format === EXPORT_FORMAT.EXCEL
              ? downloadBlob(blob, `${filename}.xlsx`)
              : window.open(blobUrl, '_blank')
          }
          style={{ marginLeft: '8px' }}
          aria-label={
            format === EXPORT_FORMAT.EXCEL
              ? (t('download_file') || 'Download file')
              : (t('open_in_new_tab') || 'Open in new tab')
          }
        >
          <ExternalLink size={14} />
        </button>
      </span>
    ),
  }), [t]);

  const handleScan = useCallback((mode) => {
    if (!cls) return;
    const params = new URLSearchParams({
      classId: cls.id,
      classCode: cls.code || '',
      date: dateStr,
      programId: cls.programId || cls.program?.id || '',
      subjectId: cls.subjectId || cls.subject?.id || '',
    });
    params.set('mode', mode);
    window.open(`/qr-scanner?${params.toString()}`, '_blank');
    onClose();
  }, [cls, dateStr, onClose]);

  const handleOpenOperations = useCallback(() => {
    if (!cls) return;
    onOpenOperations?.({
      lane: 'attendance',
      classId: cls.id,
      date: dateStr,
    });
    onClose();
  }, [cls, dateStr, onOpenOperations, onClose]);

  const handleInitiateWorkflow = useCallback(() => {
    setWorkflowDialogOpen(true);
    onClose();
  }, [onClose]);

  const handlePreviewPdf = useCallback(() => {
    if (!existingWorkflow?.fileId) return;
    onClose();
    runExport('preview-workflow-pdf', async () => {
      try {
        const { apiService } = await import('@services/api/apiService.js');
        const response = await apiService.get(`/drive/files/${existingWorkflow.fileId}/download`, {
          responseType: 'blob',
        });
        const blob = response.data;
        const blobUrl = URL.createObjectURL(blob);
        onExportSuccess?.(buildExportBanner(
          t('operations_board_preview_pdf') || 'Preview PDF',
          EXPORT_FORMAT.PDF,
          blob,
          existingWorkflow.fileName || 'workflow_document',
          blobUrl,
        ));
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } catch (err) {
        console.error('[ScheduleContextMenu] preview PDF failed:', err);
        const errorMsg = err.response?.status === 404
          ? (t('file_not_found_reinitiate') || 'File not found in storage. Please reject and re-initiate the workflow to generate a new document.')
          : err.response?.status === 403
          ? (t('access_denied') || 'Access denied. You do not have permission to view this file.')
          : err.response?.status === 500
          ? (t('server_error') || 'Server error. The file may not exist in storage. Try rejecting and re-initiating the workflow.')
          : (err.message || (t('operations_board_preview_failed') || 'Preview unavailable'));
        onExportSuccess?.({
          pillColor: '#dc2626',
          icon: <AlertCircle size={16} className="shrink-0" />,
          message: errorMsg,
        });
      }
    });
  }, [existingWorkflow?.fileId, existingWorkflow?.fileName, onClose, runExport, onExportSuccess, buildExportBanner, t]);

  const handleCloseWorkflowDialog = useCallback(() => {
    setWorkflowDialogOpen(false);
  }, []);

  const handleGoToOperationsFromWorkflow = useCallback((wf) => {
    const params = {
      lane: 'status',
      classId: cls?.id,
      date: dateStr,
      _t: String(Date.now()),
    };
    if (wf?.id) {
      params.workflowId = String(wf.id);
    }
    onOpenOperations?.(params);
    setWorkflowDialogOpen(false);
  }, [cls, dateStr, onOpenOperations]);

  const handleOpenFilteredNotifications = useCallback(() => {
    const { year } = academicTerm ? academicTermToYearTerm(academicTerm) : {};
    onOpenNotifications?.({
      filterClass: cls?.id ? String(cls.id) : 'all',
      filterSubject: subject?.id || cls?.subjectId ? String(subject?.id || cls?.subjectId) : 'all',
      filterProgram: program?.id ? String(program.id) : 'all',
      filterYear: year ? String(year) : 'all',
      filterSemester: academicTerm?.semester || academicTerm?.code || 'all',
      showAdvanced: true,
    });
    onClose();
  }, [academicTerm, cls, subject, program, onOpenNotifications, onClose]);

  const handleHistory = useCallback(() => {
    onOpenHistory?.(cls, selectedDate, 'lecture');
    onClose();
  }, [onOpenHistory, cls, selectedDate, onClose]);

  const actions = useMemo(() => {
    const items = [];

    if (canExport && cls) {
      // Hide daily export options for HR-only users
      if (!hrOnly) {
        items.push({
          id: 'export-daily',
          label: t('daily_official'),
          icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
          trailingActions: [
            {
              title: t('export_pdf') || 'PDF',
              icon: <FileText size={16} style={{ color: '#e53935' }} />,
              tooltipColor: '#e53935',
              onClick: () => runExport('export-daily-pdf', async () => {
                try {
                  const result = await exportDailyOfficialForDate({ cls, program, subject, academicTerm, lang, user, date: dateStr, instructorName: slotInstructor, format: EXPORT_FORMAT.PDF, skipDownload: true });
                  const blobUrl = URL.createObjectURL(result.blob);
                  onExportSuccess?.(buildExportBanner(`${t('daily_official') || 'Daily Official'} PDF`, EXPORT_FORMAT.PDF, result.blob, result.filename, blobUrl));
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
                } catch (err) {
                  console.error('[ScheduleContextMenu] export daily pdf failed:', err);
                  throw err;
                }
              }),
            },
            {
              title: t('export_excel') || 'Excel',
              icon: <FileSpreadsheet size={16} style={{ color: '#43a047' }} />,
              tooltipColor: '#43a047',
              onClick: () => runExport('export-daily-excel', async () => {
                try {
                  const result = await exportDailyOfficialForDate({ cls, program, subject, academicTerm, lang, user, date: dateStr, instructorName: slotInstructor, format: EXPORT_FORMAT.EXCEL, skipDownload: true });
                  const blobUrl = URL.createObjectURL(result.blob);
                  onExportSuccess?.(buildExportBanner(`${t('daily_official') || 'Daily Official'} Excel`, EXPORT_FORMAT.EXCEL, result.blob, result.filename, blobUrl));
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
                } catch (err) {
                  console.error('[ScheduleContextMenu] export daily excel failed:', err);
                  throw err;
                }
              }),
            },
          ],
        });
        items.push({ divider: true });
      }
    }

    const attendanceChildren = [];
    const boardItem = {
      id: 'operations-attendance',
      label: t('workspace_menu_attendance_board') || 'Board',
      icon: getThemedIcon('ui', 'layout_grid', 18, 'currentColor'),
      onClick: handleOpenOperations,
    };
    const manualItem = {
      id: 'scan-attendance',
      label: t('workspace_menu_attendance_manual') || 'Manual',
      icon: getThemedIcon('ui', 'qr_code', 18, 'currentColor'),
      onClick: () => handleScan(ATTENDANCE_TYPE_CATEGORY.REGULAR),
    };
    const standupItem = canSeeStandupMode && !hrOnly ? {
      id: 'scan-standup',
      label: t('standup') || 'Standup',
      icon: getThemedIcon('ui', 'users', 18, 'currentColor'),
      onClick: () => handleScan(ATTENDANCE_TYPE_CATEGORY.STANDUP),
    } : null;

    if (hrOnly) {
      attendanceChildren.push(manualItem, boardItem);
    } else if (isAdmin) {
      attendanceChildren.push(boardItem, manualItem);
      if (standupItem) attendanceChildren.push(standupItem);
    } else if (instructorOnly) {
      attendanceChildren.push(boardItem);
    } else {
      attendanceChildren.push(manualItem, boardItem);
      if (standupItem) attendanceChildren.push(standupItem);
    }

    items.push({
      id: 'attendance',
      label: t('workspace_menu_attendance') || 'Attendance',
      icon: getThemedIcon('ui', 'check_circle', 18, 'currentColor'),
      children: attendanceChildren,
    });

    const workflowChildren = existingWorkflow
      ? ((() => {
        const status = String(existingWorkflow.status || '').toUpperCase();
        const statusColors = {
          APPROVED: { bg: '#16a34a', text: '#ffffff', border: '#16a34a' },
          REJECTED: { bg: '#dc2626', text: '#ffffff', border: '#dc2626' },
          DRAFT: { bg: '#6b7280', text: '#ffffff', border: '#6b7280' },
          SUBMITTED: { bg: '#2563eb', text: '#ffffff', border: '#2563eb' },
          UNDER_ADMIN_REVIEW: { bg: '#f59e0b', text: '#ffffff', border: '#f59e0b' },
          UNDER_HR_REVIEW: { bg: '#e11d48', text: '#ffffff', border: '#e11d48' },
        };
        const colorCfg = statusColors[status] || { bg: '#6b7280', text: '#ffffff', border: '#6b7280' };
        const statusLabel = t(`workflow_status_${status.toLowerCase()}`, status);
        const iconColor = colorCfg.bg;
        const displayStatus = (hrOnly && status === 'REJECTED') ? null : status;
        if (!displayStatus) return [];
        const workflowActions = [{
          id: 'daily-attendance-existing',
          labelNode: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {t('workspace_menu_daily_attendance') || 'Daily attendance'}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 10px',
                borderRadius: '9999px',
                fontSize: '0.65rem',
                fontWeight: 700,
                backgroundColor: colorCfg.bg,
                color: colorCfg.text,
                border: `1px solid ${colorCfg.border}`,
                lineHeight: '1.4',
                whiteSpace: 'nowrap',
              }}>
                {statusLabel}
              </span>
            </span>
          ),
          icon: <AlertCircle size={18} color={iconColor} />,
          onClick: () => handleGoToOperationsFromWorkflow(existingWorkflow),
          trailingActions: (existingWorkflow.fileId && status !== 'DRAFT') ? [{
            title: t('operations_board_preview_pdf') || 'Preview PDF',
            icon: <FileText size={16} color="#3b82f6" />,
            tooltipColor: '#3b82f6',
            onClick: handlePreviewPdf,
          }] : undefined,
        }];
        if (status === 'REJECTED' || status === 'DRAFT' || !existingWorkflow.fileId) {
          workflowActions.push({
            id: 'reinitiate-workflow',
            labelKey: 'workspace_menu_workflow_initiate',
            labelFallback: 'Re-initiate',
            icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
            onClick: handleInitiateWorkflow,
          });
        }
        return workflowActions;
      })())
      : [{
        id: 'initiate-workflow',
        labelKey: 'workspace_menu_workflow_initiate',
        labelFallback: 'Initiate',
        icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
        onClick: handleInitiateWorkflow,
      }];

    if (!instructorOnly) {
      items.push({
        id: 'workflow',
        labelKey: 'workspace_menu_workflow',
        labelFallback: 'Workflow',
        icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
        children: workflowChildren,
      });
    }

    if (!instructorOnly) {
      items.push({ divider: true });
    }

    items.push({
      id: 'open-notifications',
      label: t('inbox_tab') || 'Inbox',
      icon: getThemedIcon('ui', 'mailbox', 18, 'currentColor'),
      onClick: handleOpenFilteredNotifications,
    });

    if (!instructorOnly) {
      items.push({
        id: 'open-history',
        label: t('history') || 'History',
        icon: getThemedIcon('ui', 'history', 18, 'currentColor'),
        onClick: handleHistory,
      });
    }

    return items;
  }, [canExport, cls, program, subject, academicTerm, slotInstructor, lang, t, user, dateStr, runExport, handleScan, handleOpenOperations, handleInitiateWorkflow, handleHistory, canSeeStandupMode, existingWorkflow, handlePreviewPdf, handleGoToOperationsFromWorkflow, isAdmin, hrOnly, handleOpenFilteredNotifications, instructorOnly]);

  return (
    <>
      <AppMenu
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        actions={actions}
        t={t}
        isRTL={lang === 'ar'}
        anchorOrigin={{ vertical: 'top', horizontal: lang === 'ar' ? 'left' : 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: lang === 'ar' ? 'right' : 'left' }}
      />
      <InitiateWorkflowDialog
        open={workflowDialogOpen}
        onClose={handleCloseWorkflowDialog}
        cls={cls}
        program={program}
        subject={subject}
        selectedDate={dateStr}
        lang={lang}
        t={t}
        user={user}
        onGoToOperations={handleGoToOperationsFromWorkflow}
        knownExisting={existingWorkflow}
      />
    </>
  );
}

export default ScheduleContextMenu;
