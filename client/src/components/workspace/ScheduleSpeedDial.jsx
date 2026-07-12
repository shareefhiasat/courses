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
} from '@services/business/accessScopeExportService.js';
import { getAttendanceRecords } from '@services/business/attendanceService.js';
import { getUsers } from '@services/business/userService.js';
import { exportGeneric } from '@services/export/excelExportService.js';
import { getStatusCodeFromRecord } from '@constants/attendanceTypes';
import useQRPermissions from '@hooks/useQRPermissions';

function ScheduleSpeedDial({
  session,
  selectedDate,
  program,
  academicTerm,
  onClose,
  onOpenInbox,
  onOpenHistory,
  onOpenNotifications,
  pdfOnly = false,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { canExport } = useQRPermissions();
  const [exporting, setExporting] = useState(null);

  const cls = session?.class;
  const subject = cls?.subject;
  const slotInstructor = session?.instructor;
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

  const handleScanManual = useCallback(() => {
    if (!cls) return;
    const params = new URLSearchParams({
      classId: cls.id,
      classCode: cls.code || '',
      date: dateStr,
      manual: '1',
    });
    navigate(`/qr-scanner?${params.toString()}`);
    onClose();
  }, [cls, dateStr, navigate, onClose]);

  const handleExportAttendanceSummary = useCallback(async () => {
    if (!cls) return;
    const key = 'export-attendance-summary';
    setExporting(key);
    try {
      const [attendanceResponse, usersResponse] = await Promise.all([
        getAttendanceRecords({ classId: cls.id, limit: 10000 }),
        getUsers(),
      ]);

      const records = attendanceResponse.success ? attendanceResponse.data : [];
      const allUsers = usersResponse.success ? usersResponse.data : [];

      const statsByStudent = {};
      records.forEach((record) => {
        const studentId = String(record.studentId ?? record.userId);
        if (!studentId || studentId === 'undefined') return;
        if (!statsByStudent[studentId]) {
          statsByStudent[studentId] = {
            present: 0,
            late: 0,
            absentNoExcuse: 0,
            absentWithExcuse: 0,
            excusedLeave: 0,
            humanCase: 0,
            total: 0,
          };
        }
        const status = String(getStatusCodeFromRecord(record) || record.status || 'present').toLowerCase();
        statsByStudent[studentId].total++;
        if (status === 'present' || status === 'standup_present') statsByStudent[studentId].present++;
        else if (status === 'late' || status === 'standup_late') statsByStudent[studentId].late++;
        else if (status === 'absent_no_excuse' || status === 'standup_absent') statsByStudent[studentId].absentNoExcuse++;
        else if (status === 'absent_with_excuse') statsByStudent[studentId].absentWithExcuse++;
        else if (status === 'excused_leave' || status === 'standup_clinic') statsByStudent[studentId].excusedLeave++;
        else if (status === 'human_case') statsByStudent[studentId].humanCase++;
      });

      const studentIds = Object.keys(statsByStudent);
      const rows = studentIds.map((studentId, idx) => {
        const student = allUsers.find((u) => String(u.id) === studentId);
        const stats = statsByStudent[studentId];
        const attendancePercentage = stats.total > 0
          ? (((stats.present + stats.late) / stats.total) * 100).toFixed(2)
          : '0.00';
        return [
          idx + 1,
          student?.studentNumber || '',
          student ? (lang === 'ar' ? (student.nameAr || student.nameEn || student.displayName || student.name || '') : (student.nameEn || student.displayName || student.name || '')) : studentId,
          stats.present,
          stats.late,
          stats.absentNoExcuse,
          stats.absentWithExcuse,
          stats.excusedLeave,
          stats.humanCase,
          stats.total,
          `${attendancePercentage}%`,
        ];
      });

      const headers = [
        '#',
        lang === 'ar' ? 'رقم الطالب' : 'Student Number',
        lang === 'ar' ? 'اسم الطالب' : 'Student Name',
        lang === 'ar' ? 'حاضر' : 'Present',
        lang === 'ar' ? 'متأخر' : 'Late',
        lang === 'ar' ? 'غائب بدون عذر' : 'Absent (No Excuse)',
        lang === 'ar' ? 'غائب بعذر' : 'Absent With Excuse',
        lang === 'ar' ? 'إجازة بعذر' : 'Excused Leave',
        lang === 'ar' ? 'حالة إنسانية' : 'Human Case',
        lang === 'ar' ? 'إجمالي الجلسات' : 'Total Sessions',
        lang === 'ar' ? 'نسبة الحضور' : 'Attendance %',
      ];

      const className = lang === 'ar' && cls.nameAr ? cls.nameAr : cls.nameEn || cls.code || '';
      const safeClassName = String(className).replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
      const filename = `${safeClassName}_attendance_summary`;

      const blob = await exportGeneric(rows, headers, {
        rtl: lang === 'ar',
        sheetName: lang === 'ar' ? 'ملخص الحضور' : 'Attendance Summary',
        fileName: filename,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[ScheduleSpeedDial] attendance summary export failed:', err);
    } finally {
      setExporting(null);
    }
  }, [cls, lang]);

  const actions = useMemo(() => {
    const items = [];

    if (canExport && cls) {
      items.push({
        id: 'export-daily-pdf',
        name: `${t('daily_official')} PDF`,
        icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
        disabled: exporting === 'export-daily-pdf',
        onClick: () => runExport('export-daily-pdf', () =>
          exportDailyOfficialForDate({ cls, program, subject, academicTerm, lang, user, date: dateStr, instructorName: slotInstructor, format: EXPORT_FORMAT.PDF })),
      });
      if (!pdfOnly) {
        items.push({
          id: 'export-daily-excel',
          name: `${t('daily_official')} Excel`,
          icon: getThemedIcon('ui', 'file_text', 18, 'currentColor'),
          disabled: exporting === 'export-daily-excel',
          onClick: () => runExport('export-daily-excel', () =>
            exportDailyOfficialForDate({ cls, program, subject, academicTerm, lang, user, date: dateStr, instructorName: slotInstructor, format: EXPORT_FORMAT.EXCEL })),
        });
      }
      items.push({
        id: 'export-weekly-pdf',
        name: `${t('weekly_schedule')} PDF`,
        icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
        disabled: exporting === 'export-weekly-pdf',
        onClick: () => runExport('export-weekly-pdf', () =>
          exportWeeklyScheduleForScope({ cls, program, subject, academicTerm, lang, t, user, format: EXPORT_FORMAT.PDF })),
      });
      if (!pdfOnly) {
        items.push({
          id: 'export-weekly-excel',
          name: `${t('weekly_schedule')} Excel`,
          icon: getThemedIcon('ui', 'file_text', 18, 'currentColor'),
          disabled: exporting === 'export-weekly-excel',
          onClick: () => runExport('export-weekly-excel', () =>
            exportWeeklyScheduleForScope({ cls, program, subject, academicTerm, lang, t, user, format: EXPORT_FORMAT.EXCEL })),
        });
      }
      if (!pdfOnly) {
        items.push({
          id: 'export-attendance-summary',
          name: lang === 'ar' ? 'ملخص الحضور' : 'Attendance Summary',
          icon: getThemedIcon('ui', 'bar_chart', 18, 'currentColor'),
          disabled: exporting === 'export-attendance-summary',
          onClick: () => runExport('export-attendance-summary', handleExportAttendanceSummary),
        });
      }
    }

    items.push({
      id: 'scan-attendance-manual',
      name: t('workspace_take_attendance'),
      icon: getThemedIcon('ui', 'qr_code', 18, 'currentColor'),
      onClick: handleScanManual,
    });

    return items;
  }, [canExport, cls, program, subject, academicTerm, slotInstructor, lang, t, user, dateStr, exporting, runExport, handleScanManual, handleExportAttendanceSummary, pdfOnly]);

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
