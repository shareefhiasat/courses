import React, { useMemo, useState, useCallback, useEffect } from 'react';
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
import PdfPreviewDialog from '@components/workspace/PdfPreviewDialog.jsx';
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
}) {
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { canExport, canSeeStandupMode } = useQRPermissions();
  const hrOnly = isHROnlyViewer({ isHR, isAdmin, isSuperAdmin });
  const [exporting, setExporting] = useState(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [existingWorkflow, setExistingWorkflow] = useState(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [dailyPreviewOpen, setDailyPreviewOpen] = useState(false);

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
      programId: cls.programId || cls.program?.id || '',
      subjectId: cls.subjectId || cls.subject?.id || '',
    });
    if (mode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      params.set('mode', ATTENDANCE_TYPE_CATEGORY.STANDUP);
    }
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
    onClose();
    setPdfPreviewOpen(true);
  }, [onClose]);

  const handleClosePreview = useCallback(() => {
    setPdfPreviewOpen(false);
  }, []);

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
            onClick: () => {
              onClose();
              setDailyPreviewOpen(true);
            },
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
          APPROVED: '#16a34a',
          REJECTED: '#dc2626',
          DRAFT: '#f59e0b',
          TAKEN: '#f59e0b',
          SUBMITTED: '#f59e0b',
          UNDER_ADMIN_REVIEW: '#f59e0b',
          UNDER_HR_REVIEW: '#f59e0b',
        };
        const color = statusColors[status] || '#f59e0b';
        const statusLabel = t(`workflow_status_${status.toLowerCase()}`, status);
        const iconColor = status === 'APPROVED' ? '#16a34a' : status === 'REJECTED' ? '#dc2626' : '#f59e0b';
        return [{
          id: 'daily-attendance-existing',
          labelNode: (
            <span>
              {t('workspace_menu_daily_attendance') || 'Daily attendance'}
              {' — '}
              <span style={{ color, fontWeight: 600 }}>
                {statusLabel}
              </span>
            </span>
          ),
          icon: <AlertCircle size={18} color={iconColor} />,
          onClick: () => handleGoToOperationsFromWorkflow(existingWorkflow),
          trailingActions: existingWorkflow.fileId ? [{
            title: t('operations_board_preview_pdf') || 'Preview PDF',
            icon: <FileText size={16} color="#3b82f6" />,
            tooltipColor: '#3b82f6',
            onClick: handlePreviewPdf,
          }] : undefined,
        }];
      })())
      : [{
        id: 'initiate-workflow',
        labelKey: 'workspace_menu_workflow_initiate',
        labelFallback: 'Initiate',
        icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
        onClick: handleInitiateWorkflow,
      }];

    items.push({
      id: 'workflow',
      labelKey: 'workspace_menu_workflow',
      labelFallback: 'Workflow',
      icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
      children: workflowChildren,
    });

    items.push({ divider: true });

    items.push({
      id: 'open-notifications',
      label: t('inbox_tab') || 'Inbox',
      icon: getThemedIcon('ui', 'mailbox', 18, 'currentColor'),
      onClick: handleOpenFilteredNotifications,
    });

    items.push({
      id: 'open-history',
      label: t('history') || 'History',
      icon: getThemedIcon('ui', 'history', 18, 'currentColor'),
      onClick: handleHistory,
    });

    return items;
  }, [canExport, cls, program, subject, academicTerm, slotInstructor, lang, t, user, dateStr, runExport, handleScan, handleOpenOperations, handleInitiateWorkflow, handleHistory, canSeeStandupMode, existingWorkflow, handlePreviewPdf, handleGoToOperationsFromWorkflow, isAdmin, hrOnly, handleOpenFilteredNotifications]);

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
      <PdfPreviewDialog
        open={pdfPreviewOpen}
        onClose={handleClosePreview}
        cls={cls}
        program={program}
        subject={subject}
        academicTerm={academicTerm}
        date={dateStr}
        instructorName={slotInstructor}
        user={user}
        title={t('operations_board_preview_pdf') || 'Preview PDF'}
        fileId={existingWorkflow?.fileId}
        isApproved={String(existingWorkflow?.status || '').toUpperCase() === 'APPROVED'}
      />
      <PdfPreviewDialog
        open={dailyPreviewOpen}
        onClose={() => setDailyPreviewOpen(false)}
        cls={cls}
        program={program}
        subject={subject}
        academicTerm={academicTerm}
        date={dateStr}
        instructorName={slotInstructor}
        user={user}
        title={t('daily_official') || 'Daily Official'}
        fileId={existingWorkflow?.fileId}
        isApproved={String(existingWorkflow?.status || '').toUpperCase() === 'APPROVED'}
      />
    </>
  );
}

export default ScheduleContextMenu;
