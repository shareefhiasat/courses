import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import {
  exportWeeklyScheduleForScope,
  exportDailyOfficialTemplate,
  exportDailyOfficialForDate,
} from '@services/business/accessScopeExportService.js';
import { FileText, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton } from '@mui/material';
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';
import useQRPermissions from '@hooks/useQRPermissions';
import AppMenu from '@components/ui/mui/AppMenu.jsx';
import InitiateWorkflowDialog from '@components/workspace/InitiateWorkflowDialog.jsx';
import WorkflowPdfPreviewPanel from '@components/operations-board/WorkflowPdfPreviewPanel.jsx';
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
}) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { t, lang } = useLang();
  const { canExport, canSeeStandupMode } = useQRPermissions();
  const [exporting, setExporting] = useState(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [existingWorkflow, setExistingWorkflow] = useState(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

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

  const handleScan = useCallback((mode) => {
    if (!cls) return;
    const params = new URLSearchParams({
      classId: cls.id,
      classCode: cls.code || '',
      date: dateStr,
    });
    if (mode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      params.set('mode', ATTENDANCE_TYPE_CATEGORY.STANDUP);
    }
    navigate(`/qr-scanner?${params.toString()}`);
    onClose();
  }, [cls, dateStr, navigate, onClose]);

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
    setPdfPreviewOpen(true);
    onClose();
  }, [onClose]);

  const handleCloseWorkflowDialog = useCallback(() => {
    setWorkflowDialogOpen(false);
  }, []);

  const handleGoToOperationsFromWorkflow = useCallback((existingWorkflow) => {
    const params = {
      lane: 'status',
      classId: cls?.id,
      date: dateStr,
      _t: String(Date.now()),
    };
    if (existingWorkflow?.id) {
      params.workflowId = String(existingWorkflow.id);
    }
    onOpenOperations?.(params);
    setWorkflowDialogOpen(false);
  }, [cls, dateStr, onOpenOperations]);

  const handleInbox = useCallback((tab) => {
    onOpenInbox?.(tab, cls?.id);
    onClose();
  }, [onOpenInbox, cls?.id, onClose]);

  const handleHistory = useCallback(() => {
    onOpenHistory?.(cls, selectedDate);
    onClose();
  }, [onOpenHistory, cls, selectedDate, onClose]);

  const actions = useMemo(() => {
    const items = [];

    if (canExport && cls) {
      items.push({
        id: 'export-weekly',
        label: t('weekly_schedule'),
        icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
        trailingActions: [
          {
            title: t('export_pdf') || 'PDF',
            icon: <FileText size={16} style={{ color: '#e53935' }} />,
            tooltipColor: '#e53935',
            onClick: () => runExport('export-weekly-pdf', () =>
              exportWeeklyScheduleForScope({ cls, program, subject, academicTerm, lang, t, user, format: EXPORT_FORMAT.PDF })),
          },
          {
            title: t('export_excel') || 'Excel',
            icon: <FileSpreadsheet size={16} style={{ color: '#43a047' }} />,
            tooltipColor: '#43a047',
            onClick: () => runExport('export-weekly-excel', () =>
              exportWeeklyScheduleForScope({ cls, program, subject, academicTerm, lang, t, user, format: EXPORT_FORMAT.EXCEL })),
          },
        ],
      });
      items.push({
        id: 'export-daily',
        label: t('daily_official'),
        icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
        trailingActions: [
          {
            title: t('export_pdf') || 'PDF',
            icon: <FileText size={16} style={{ color: '#e53935' }} />,
            tooltipColor: '#e53935',
            onClick: () => runExport('export-daily-pdf', () =>
              exportDailyOfficialForDate({ cls, program, subject, academicTerm, lang, user, date: dateStr, instructorName: slotInstructor, format: EXPORT_FORMAT.PDF })),
          },
          {
            title: t('export_excel') || 'Excel',
            icon: <FileSpreadsheet size={16} style={{ color: '#43a047' }} />,
            tooltipColor: '#43a047',
            onClick: () => runExport('export-daily-excel', () =>
              exportDailyOfficialForDate({ cls, program, subject, academicTerm, lang, user, date: dateStr, instructorName: slotInstructor, format: EXPORT_FORMAT.EXCEL })),
          },
        ],
      });
      items.push({
        id: 'export-templates',
        label: t('templates') || 'Templates',
        icon: getThemedIcon('ui', 'file_text', 18, 'currentColor'),
        children: [
          {
            id: 'template-daily',
            label: t('daily_template') || 'Daily',
            icon: getThemedIcon('ui', 'file_text', 18, 'currentColor'),
            trailingActions: [
              {
                title: t('export_pdf') || 'PDF',
                icon: <FileText size={16} style={{ color: '#e53935' }} />,
                tooltipColor: '#e53935',
                onClick: () => runExport('export-template-pdf', () =>
                  exportDailyOfficialTemplate({ cls, program, subject, academicTerm, lang, user, instructorName: slotInstructor, format: EXPORT_FORMAT.PDF })),
              },
              {
                title: t('export_excel') || 'Excel',
                icon: <FileSpreadsheet size={16} style={{ color: '#43a047' }} />,
                tooltipColor: '#43a047',
                onClick: () => runExport('export-template-excel', () =>
                  exportDailyOfficialTemplate({ cls, program, subject, academicTerm, lang, user, instructorName: slotInstructor, format: EXPORT_FORMAT.EXCEL })),
              },
            ],
          },
        ],
      });
      items.push({ divider: true });
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
    const standupItem = canSeeStandupMode ? {
      id: 'scan-standup',
      label: t('standup') || 'Standup',
      icon: getThemedIcon('ui', 'users', 18, 'currentColor'),
      onClick: () => handleScan(ATTENDANCE_TYPE_CATEGORY.STANDUP),
    } : null;

    if (isAdmin) {
      attendanceChildren.push(boardItem, manualItem);
      if (standupItem) attendanceChildren.push(standupItem);
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

    items.push({
      id: 'workflow',
      labelKey: 'workspace_menu_workflow',
      labelFallback: 'Workflow',
      icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
      children: [
        {
          id: 'initiate-workflow',
          labelNode: existingWorkflow
            ? (
              <span>
                {t('workspace_menu_workflow_initiate') || 'Initiate'}
                {' — '}
                <span style={{ color: '#ea580c', fontWeight: 600 }}>
                  {t('workspace_menu_workflow_exists') || 'Workflow already exists'}
                </span>
              </span>
            )
            : undefined,
          labelKey: existingWorkflow ? undefined : 'workspace_menu_workflow_initiate',
          labelFallback: 'Initiate',
          icon: existingWorkflow
            ? <AlertCircle size={18} color="#f59e0b" />
            : getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
          onClick: handleInitiateWorkflow,
          trailingActions: existingWorkflow ? [{
            title: t('initiate_workflow_go_operations') || 'Go to existing',
            icon: getThemedIcon('ui', 'external_link', 16, 'currentColor') || <FileText size={16} />,
            tooltipColor: '#f59e0b',
            onClick: () => handleGoToOperationsFromWorkflow(existingWorkflow),
          }] : undefined,
        },
        ...(existingWorkflow ? [{
          id: 'preview-workflow-pdf',
          labelKey: 'workspace_menu_workflow_preview_pdf',
          labelFallback: 'Preview PDF',
          icon: <FileText size={18} color="#3b82f6" />,
          onClick: handlePreviewPdf,
          disabled: !existingWorkflow?.fileId,
        }] : []),
      ],
    });

    items.push({ divider: true });

    items.push({
      id: 'messages',
      label: t('inbox_tab'),
      icon: getThemedIcon('ui', 'mailbox', 18, 'currentColor'),
      trailingActions: [
        {
          title: t('inbox_tab') || 'Inbox',
          icon: getThemedIcon('ui', 'mailbox', 16, 'currentColor'),
          tooltipColor: '#8b5cf6',
          onClick: () => handleInbox('inbox'),
        },
        {
          title: t('outbox_tab') || 'Outbox',
          icon: getThemedIcon('ui', 'send', 16, 'currentColor'),
          tooltipColor: '#0ea5e9',
          onClick: () => handleInbox('outbox'),
        },
      ],
    });

    items.push({
      id: 'open-history',
      label: t('history') || 'History',
      icon: getThemedIcon('ui', 'history', 18, 'currentColor'),
      trailingActions: [
        {
          title: t('workspace_class_history') || 'Class History',
          icon: getThemedIcon('ui', 'history', 16, 'currentColor'),
          tooltipColor: '#f59e0b',
          onClick: handleHistory,
        },
      ],
    });

    return items;
  }, [canExport, cls, program, subject, academicTerm, slotInstructor, lang, t, user, dateStr, exporting, runExport, handleScan, handleOpenOperations, handleInitiateWorkflow, handleInbox, handleHistory, canSeeStandupMode, existingWorkflow, handlePreviewPdf, handleGoToOperationsFromWorkflow, isAdmin]);

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
      <Dialog
        open={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        data-testid="schedule-workflow-pdf-preview-dialog"
      >
        <DialogTitle>{t('operations_board_preview_pdf') || 'Preview PDF'}</DialogTitle>
        <DialogContent>
          <WorkflowPdfPreviewPanel
            fileId={existingWorkflow?.fileId}
            fileName={existingWorkflow?.fileName || existingWorkflow?.title}
            open={pdfPreviewOpen}
            onClose={() => setPdfPreviewOpen(false)}
            t={t}
          />
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setPdfPreviewOpen(false)}>
            {t('close') || 'Close'}
          </MuiButton>
          {existingWorkflow && (
            <MuiButton
              variant="contained"
              onClick={() => {
                setPdfPreviewOpen(false);
                handleGoToOperationsFromWorkflow(existingWorkflow);
              }}
            >
              {t('initiate_workflow_go_operations') || 'Go to Operations'}
            </MuiButton>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ScheduleContextMenu;
