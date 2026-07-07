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
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';
import useQRPermissions from '@hooks/useQRPermissions';
import AppMenu from '@components/ui/mui/AppMenu.jsx';

function ScheduleContextMenu({
  session,
  anchorEl,
  open,
  onClose,
  selectedDate,
  program,
  onOpenInbox,
  onOpenHistory,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLang();
  const { canExport, canSeeStandupMode } = useQRPermissions();
  const [exporting, setExporting] = useState(null);

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
        children: [
          {
            id: 'export-weekly-pdf',
            label: t('export_pdf'),
            icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
            disabled: exporting === 'export-weekly-pdf',
            onClick: () => runExport('export-weekly-pdf', () =>
              exportWeeklyScheduleForScope({ cls, program, subject, lang, t, user, format: EXPORT_FORMAT.PDF })),
          },
          {
            id: 'export-weekly-excel',
            label: t('export_excel'),
            icon: getThemedIcon('ui', 'file_text', 18, 'currentColor'),
            disabled: exporting === 'export-weekly-excel',
            onClick: () => runExport('export-weekly-excel', () =>
              exportWeeklyScheduleForScope({ cls, program, subject, lang, t, user, format: EXPORT_FORMAT.EXCEL })),
          },
        ],
      });
      items.push({
        id: 'export-daily',
        label: t('daily_official'),
        icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
        hint: dateStr,
        children: [
          {
            id: 'export-daily-pdf',
            label: t('export_pdf'),
            icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
            disabled: exporting === 'export-daily-pdf',
            onClick: () => runExport('export-daily-pdf', () =>
              exportDailyOfficialForDate({ cls, program, subject, lang, user, date: dateStr, format: EXPORT_FORMAT.PDF })),
          },
          {
            id: 'export-daily-excel',
            label: t('export_excel'),
            icon: getThemedIcon('ui', 'file_text', 18, 'currentColor'),
            disabled: exporting === 'export-daily-excel',
            onClick: () => runExport('export-daily-excel', () =>
              exportDailyOfficialForDate({ cls, program, subject, lang, user, date: dateStr, format: EXPORT_FORMAT.EXCEL })),
          },
        ],
      });
      items.push({
        id: 'export-template',
        label: t('daily_official_template'),
        icon: getThemedIcon('ui', 'file_text', 18, 'currentColor'),
        children: [
          {
            id: 'export-template-pdf',
            label: t('export_pdf'),
            icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
            disabled: exporting === 'export-template-pdf',
            onClick: () => runExport('export-template-pdf', () =>
              exportDailyOfficialTemplate({ cls, program, subject, lang, user, format: EXPORT_FORMAT.PDF })),
          },
          {
            id: 'export-template-excel',
            label: t('export_excel'),
            icon: getThemedIcon('ui', 'file_text', 18, 'currentColor'),
            disabled: exporting === 'export-template-excel',
            onClick: () => runExport('export-template-excel', () =>
              exportDailyOfficialTemplate({ cls, program, subject, lang, user, format: EXPORT_FORMAT.EXCEL })),
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
          label: t('workspace_take_attendance'),
          icon: getThemedIcon('ui', 'check_circle', 18, 'currentColor'),
          onClick: () => handleScan(ATTENDANCE_TYPE_CATEGORY.REGULAR),
        },
        ...(canSeeStandupMode ? [{
          id: 'scan-standup',
          label: t('standup_attendance'),
          icon: getThemedIcon('ui', 'users', 18, 'currentColor'),
          onClick: () => handleScan(ATTENDANCE_TYPE_CATEGORY.STANDUP),
        }] : []),
      ],
    });

    items.push({ divider: true });

    items.push({
      id: 'messages',
      label: t('inbox_tab'),
      icon: getThemedIcon('ui', 'mailbox', 18, 'currentColor'),
      children: [
        {
          id: 'open-inbox',
          label: t('inbox_tab'),
          icon: getThemedIcon('ui', 'mailbox', 18, 'currentColor'),
          onClick: () => handleInbox('inbox'),
        },
        {
          id: 'open-outbox',
          label: t('outbox_tab'),
          icon: getThemedIcon('ui', 'send', 18, 'currentColor'),
          onClick: () => handleInbox('outbox'),
        },
      ],
    });

    items.push({
      id: 'open-history',
      label: t('workspace_class_history'),
      icon: getThemedIcon('ui', 'history', 18, 'currentColor'),
      onClick: handleHistory,
    });

    return items;
  }, [canExport, cls, program, subject, lang, t, user, dateStr, exporting, runExport, handleScan, handleInbox, handleHistory, canSeeStandupMode]);

  return (
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
  );
}

export default ScheduleContextMenu;
