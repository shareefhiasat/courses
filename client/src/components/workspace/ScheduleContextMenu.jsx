import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import {
  exportWeeklyScheduleForScope,
  exportDailyOfficialTemplate,
  exportDailyOfficialForDate,
} from '@services/business/accessScopeExportService.js';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';
import useQRPermissions from '@hooks/useQRPermissions';
import AppMenu from '@components/ui/mui/AppMenu.jsx';
import InitiateWorkflowDialog from '@components/workspace/InitiateWorkflowDialog.jsx';

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
  const { user } = useAuth();
  const { t, lang } = useLang();
  const { canExport, canSeeStandupMode } = useQRPermissions();
  const [exporting, setExporting] = useState(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);

  const cls = session?.class;
  const subject = cls?.subject;
  const dateStr = selectedDate
    ? selectedDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

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

  const handleCloseWorkflowDialog = useCallback(() => {
    setWorkflowDialogOpen(false);
  }, []);

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
              exportDailyOfficialForDate({ cls, program, subject, lang, user, date: dateStr, format: EXPORT_FORMAT.PDF })),
          },
          {
            title: t('export_excel') || 'Excel',
            icon: <FileSpreadsheet size={16} style={{ color: '#43a047' }} />,
            tooltipColor: '#43a047',
            onClick: () => runExport('export-daily-excel', () =>
              exportDailyOfficialForDate({ cls, program, subject, lang, user, date: dateStr, format: EXPORT_FORMAT.EXCEL })),
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
                  exportDailyOfficialTemplate({ cls, program, subject, lang, user, format: EXPORT_FORMAT.PDF })),
              },
              {
                title: t('export_excel') || 'Excel',
                icon: <FileSpreadsheet size={16} style={{ color: '#43a047' }} />,
                tooltipColor: '#43a047',
                onClick: () => runExport('export-template-excel', () =>
                  exportDailyOfficialTemplate({ cls, program, subject, lang, user, format: EXPORT_FORMAT.EXCEL })),
              },
            ],
          },
        ],
      });
      items.push({ divider: true });
    }

    items.push({
      id: 'attendance',
      label: t('workspace_take_attendance'),
      icon: getThemedIcon('ui', 'check_circle', 18, 'currentColor'),
      children: [
        {
          id: 'scan-attendance',
          label: t('take_attendance_qr_short') || 'QR Scanner',
          icon: getThemedIcon('ui', 'check_circle', 18, 'currentColor'),
          onClick: () => handleScan(ATTENDANCE_TYPE_CATEGORY.REGULAR),
        },
        {
          id: 'operations-attendance',
          label: t('take_attendance_operations_short') || 'Operations Board',
          icon: getThemedIcon('ui', 'layout_grid', 18, 'currentColor'),
          onClick: handleOpenOperations,
        },
        ...(canSeeStandupMode ? [{
          id: 'scan-standup',
          label: t('standup_attendance'),
          icon: getThemedIcon('ui', 'users', 18, 'currentColor'),
          onClick: () => handleScan(ATTENDANCE_TYPE_CATEGORY.STANDUP),
        }] : []),
        { divider: true },
        {
          id: 'initiate-workflow',
          label: t('initiate_workflow') || 'Initiate Workflow',
          icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
          onClick: handleInitiateWorkflow,
        },
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
  }, [canExport, cls, program, subject, academicTerm, lang, t, user, dateStr, exporting, runExport, handleScan, handleOpenOperations, handleInitiateWorkflow, handleInbox, handleHistory, canSeeStandupMode]);

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
        onGoToOperations={handleOpenOperations}
      />
    </>
  );
}

export default ScheduleContextMenu;
