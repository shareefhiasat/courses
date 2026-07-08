import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import { getThemedIcon } from '@constants/iconTypes';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import {
  exportWeeklyScheduleForScope,
  exportDailyOfficialForDate,
  exportDailyOfficialTemplate,
} from '@services/business/accessScopeExportService.js';
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';
import useQRPermissions from '@hooks/useQRPermissions';

function ScheduleSpeedDial({
  session,
  selectedDate,
  program,
  academicTerm,
  onClose,
  onOpenInbox,
  onOpenHistory,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
    } catch (err) {
      console.error('[ScheduleSpeedDial] export failed:', err);
    } finally {
      setExporting(null);
    }
  }, []);

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
        id: 'export-weekly-pdf',
        name: `${t('weekly_schedule')} PDF`,
        icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
        disabled: exporting === 'export-weekly-pdf',
        onClick: () => runExport('export-weekly-pdf', () =>
          exportWeeklyScheduleForScope({ cls, program, subject, academicTerm, lang, t, user, format: EXPORT_FORMAT.PDF })),
      });
      items.push({
        id: 'export-weekly-excel',
        name: `${t('weekly_schedule')} Excel`,
        icon: getThemedIcon('ui', 'file_text', 18, 'currentColor'),
        disabled: exporting === 'export-weekly-excel',
        onClick: () => runExport('export-weekly-excel', () =>
          exportWeeklyScheduleForScope({ cls, program, subject, academicTerm, lang, t, user, format: EXPORT_FORMAT.EXCEL })),
      });
      items.push({
        id: 'export-daily-pdf',
        name: `${t('daily_official')} PDF`,
        icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
        disabled: exporting === 'export-daily-pdf',
        onClick: () => runExport('export-daily-pdf', () =>
          exportDailyOfficialForDate({ cls, program, subject, lang, user, date: dateStr, format: EXPORT_FORMAT.PDF })),
      });
      items.push({
        id: 'export-daily-excel',
        name: `${t('daily_official')} Excel`,
        icon: getThemedIcon('ui', 'file_text', 18, 'currentColor'),
        disabled: exporting === 'export-daily-excel',
        onClick: () => runExport('export-daily-excel', () =>
          exportDailyOfficialForDate({ cls, program, subject, lang, user, date: dateStr, format: EXPORT_FORMAT.EXCEL })),
      });
      items.push({
        id: 'export-template-pdf',
        name: `${t('daily_official_template')} PDF`,
        icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
        disabled: exporting === 'export-template-pdf',
        onClick: () => runExport('export-template-pdf', () =>
          exportDailyOfficialTemplate({ cls, program, subject, lang, user, format: EXPORT_FORMAT.PDF })),
      });
    }

    items.push({
      id: 'scan-attendance',
      name: t('workspace_take_attendance'),
      icon: getThemedIcon('ui', 'check_circle', 18, 'currentColor'),
      onClick: () => handleScan(ATTENDANCE_TYPE_CATEGORY.REGULAR),
    });

    if (canSeeStandupMode) {
      items.push({
        id: 'scan-standup',
        name: t('standup_attendance'),
        icon: getThemedIcon('ui', 'users', 18, 'currentColor'),
        onClick: () => handleScan(ATTENDANCE_TYPE_CATEGORY.STANDUP),
      });
    }

    items.push({
      id: 'open-inbox',
      name: t('inbox_tab'),
      icon: getThemedIcon('ui', 'mailbox', 18, 'currentColor'),
      onClick: () => handleInbox('inbox'),
    });
    items.push({
      id: 'open-history',
      name: t('workspace_class_history'),
      icon: getThemedIcon('ui', 'history', 18, 'currentColor'),
      onClick: handleHistory,
    });

    return items;
  }, [canExport, cls, program, subject, academicTerm, lang, t, user, dateStr, exporting, runExport, handleScan, handleInbox, handleHistory, canSeeStandupMode]);

  if (!session) return null;

  const subjectName = cls?.code || subject?.name || session.classId;

  return (
    <SpeedDial
      ariaLabel={subjectName}
      sx={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 1300,
        '& .MuiSpeedDial-fab': {
          bgcolor: isDark ? '#7c3aed' : '#8b5cf6',
          '&:hover': { bgcolor: isDark ? '#6d28d9' : '#7c3aed' },
        },
      }}
      FabProps={{ size: 'small' }}
      icon={<SpeedDialIcon />}
      onClose={onClose}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.id}
          icon={action.icon}
          tooltipTitle={action.name}
          tooltipOpen
          disabled={action.disabled}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick?.();
          }}
          sx={{
            '& .MuiSpeedDialAction-fab': {
              bgcolor: isDark ? '#1e293b' : '#fff',
              '&:hover': { bgcolor: isDark ? '#334155' : '#f1f5f9' },
            },
          }}
        />
      ))}
    </SpeedDial>
  );
}

export default ScheduleSpeedDial;
