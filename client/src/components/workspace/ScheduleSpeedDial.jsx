import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import { CheckCircle2, ExternalLink, Download } from 'lucide-react';
import { getThemedIcon } from '@constants/iconTypes';
import { EXPORT_FORMAT, downloadBlob, startExportLoading } from '@services/export/official-reports/index.jsx';
import { buildReportFilename } from '@services/export/official-reports/engine/reportFilename.js';
import {
  exportWeeklyScheduleForScope,
  exportDailyOfficialForDate,
} from '@services/business/accessScopeExportService.js';
import { getAttendanceRecords } from '@services/business/attendanceService.js';
import { getUsers } from '@services/business/userService.js';
import { exportGeneric } from '@services/export/excelExportService.js';
import { openDriveFileInCollabora } from '@utils/collaboraUtils.js';
import { getStatusCodeFromRecord } from '@constants/attendanceTypes';
import useQRPermissions from '@hooks/useQRPermissions';
import PdfPreviewDialog from '@components/workspace/PdfPreviewDialog.jsx';
import { findExistingAttendanceWorkflow } from '@services/business/workflowInitiationService.js';
import { isHROnlyViewer } from '@components/operations-board/hrAttendancePrivacy.js';

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
  onExportSuccess,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { canExport } = useQRPermissions();
  const [exporting, setExporting] = useState(null);
  const [dailyPreviewOpen, setDailyPreviewOpen] = useState(false);
  const [dialOpen, setDialOpen] = useState(false);
  const [existingWorkflow, setExistingWorkflow] = useState(null);

  const cls = session?.class;
  const subject = cls?.subject;
  const slotInstructor = session?.instructor;
  const dateStr = selectedDate
    ? selectedDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const roleContext = {
    isAdmin: user?.isAdmin,
    isHR: user?.isHR,
    isInstructor: user?.isInstructor,
    isSuperAdmin: user?.isSuperAdmin,
  };
  const isHROnly = isHROnlyViewer(roleContext);

  useEffect(() => {
    if (!cls?.id || !dateStr) {
      setExistingWorkflow(null);
      return undefined;
    }
    let cancelled = false;
    findExistingAttendanceWorkflow(cls.id, dateStr).then((result) => {
      if (!cancelled) setExistingWorkflow(result.success ? result.data : null);
    });
    return () => { cancelled = true; };
  }, [cls?.id, dateStr]);

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

  const buildExportBanner = useCallback((label, format, blob, filename, blobUrl, fileId = null) => {
    const downloadFile = () => downloadBlob(blob, `${filename}.xlsx`);
    const isExcel = format === EXPORT_FORMAT.EXCEL;
    return {
      pillColor: '#059669',
      icon: <CheckCircle2 size={16} className="shrink-0" />,
      message: isExcel
        ? `${label}${dateStr ? ` — ${dateStr}` : ''} — ${t('export_success') || 'Export successful'}`
        : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
            {`${label}${dateStr ? ` — ${dateStr}` : ''} — ${t('export_success') || 'Export successful'}`}
            <button
              type="button"
              className="inline-flex items-center gap-0.5 rounded-md text-xs font-semibold px-1.5 py-0.5 hover:bg-white/25 transition-colors"
              onClick={() => window.open(blobUrl, '_blank')}
              style={{ marginInlineStart: '4px' }}
              aria-label={t('open_in_new_tab') || 'Open in new tab'}
            >
              <ExternalLink size={14} />
            </button>
          </span>
        ),
      actions: isExcel
        ? (fileId
          ? [
              { label: t('export_open_collabora') || 'Open in Collabora', icon: <ExternalLink size={14} />, onClick: async () => { if (!(await openDriveFileInCollabora(fileId))) downloadFile(); } },
              { label: t('export_save_file') || 'Save', icon: <Download size={14} />, onClick: downloadFile },
            ]
          : [{ label: t('export_save_file') || 'Save', icon: <Download size={14} />, onClick: downloadFile }])
        : undefined,
    };
  }, [t, dateStr]);

  const handleExportAttendanceSummary = useCallback(async () => {
    if (!cls) return;
    const key = 'export-attendance-summary';
    setExporting(key);
    const stopLoading = startExportLoading(
      lang === 'ar' ? 'جاري إنشاء ملخص الحضور...' : 'Generating attendance summary...'
    );
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
        t('student_number'),
        t('student_name'),
        t('attendance_present'),
        t('attendance_late'),
        t('absent_no_excuse'),
        t('absent_with_excuse'),
        t('excused_leave'),
        t('human_case'),
        t('total_sessions'),
        t('attendance_percentage'),
      ];

      const filename = buildReportFilename({
        type: 'class-summary',
        programName: lang === 'ar' ? program?.nameAr || program?.nameEn : program?.nameEn || program?.name,
        className: lang === 'ar' ? cls.nameAr || cls.nameEn || cls.code : cls.nameEn || cls.name || cls.code,
        subjectName: lang === 'ar' ? subject?.nameAr || subject?.nameEn : subject?.nameEn || subject?.name,
        ext: 'xlsx',
        lang,
      });
      const baseName = filename.replace(/\.xlsx$/i, '');

      const blob = await exportGeneric(rows, headers, {
        rtl: lang === 'ar',
        sheetName: t('attendance_summary'),
        fileName: baseName,
      });

      const blobUrl = URL.createObjectURL(blob);
      onExportSuccess?.(buildExportBanner(
        `${t('attendance_summary')} — ${t('export_excel') || 'Excel'}`,
        EXPORT_FORMAT.EXCEL,
        blob,
        baseName,
        blobUrl,
      ));
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      console.error('[ScheduleSpeedDial] attendance summary export failed:', err);
    } finally {
      stopLoading();
      setExporting(null);
    }
  }, [cls, lang, program, subject, t, onExportSuccess, buildExportBanner]);

  const actions = useMemo(() => {
    const items = [];

    if (canExport && cls) {
      // Hide daily export options for HR-only users
      if (!isHROnly) {
        items.push({
          id: 'export-daily-pdf',
          name: `${t('daily_official')} PDF`,
          icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
          disabled: exporting === 'export-daily-pdf',
          onClick: () => runExport('export-daily-pdf', async () => {
            const result = await exportDailyOfficialForDate({ cls, program, subject, academicTerm, lang, user, date: dateStr, instructorName: slotInstructor, format: EXPORT_FORMAT.PDF, skipDownload: true });
            const blobUrl = URL.createObjectURL(result.blob);
            onExportSuccess?.(buildExportBanner(`${t('daily_official')} PDF`, EXPORT_FORMAT.PDF, result.blob, result.filename, blobUrl));
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
          }),
        });
        if (!pdfOnly) {
          items.push({
            id: 'export-daily-excel',
            name: `${t('daily_official')} Excel`,
            icon: getThemedIcon('ui', 'file_text', 18, 'currentColor'),
            disabled: exporting === 'export-daily-excel',
            onClick: () => runExport('export-daily-excel', async () => {
              const result = await exportDailyOfficialForDate({ cls, program, subject, academicTerm, lang, user, date: dateStr, instructorName: slotInstructor, format: EXPORT_FORMAT.EXCEL, skipDownload: true });
              const blobUrl = URL.createObjectURL(result.blob);
              onExportSuccess?.(buildExportBanner(`${t('daily_official')} Excel`, EXPORT_FORMAT.EXCEL, result.blob, result.filename, blobUrl, result.fileId || null));
              setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
            }),
          });
        }
      }
      items.push({
        id: 'export-weekly-pdf',
        name: `${t('weekly_schedule')} PDF`,
        icon: getThemedIcon('ui', 'file_signature', 18, 'currentColor'),
        disabled: exporting === 'export-weekly-pdf',
        onClick: () => runExport('export-weekly-pdf', async () => {
          const result = await exportWeeklyScheduleForScope({ cls, program, subject, academicTerm, lang, t, user, format: EXPORT_FORMAT.PDF, skipDownload: true });
          const blobUrl = URL.createObjectURL(result.blob);
          onExportSuccess?.(buildExportBanner(`${t('weekly_schedule')} PDF`, EXPORT_FORMAT.PDF, result.blob, result.filename, blobUrl));
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        }),
      });
      if (!pdfOnly) {
        items.push({
          id: 'export-weekly-excel',
          name: `${t('weekly_schedule')} Excel`,
          icon: getThemedIcon('ui', 'file_text', 18, 'currentColor'),
          disabled: exporting === 'export-weekly-excel',
          onClick: () => runExport('export-weekly-excel', async () => {
            const result = await exportWeeklyScheduleForScope({ cls, program, subject, academicTerm, lang, t, user, format: EXPORT_FORMAT.EXCEL, skipDownload: true });
            const blobUrl = URL.createObjectURL(result.blob);
            onExportSuccess?.(buildExportBanner(`${t('weekly_schedule')} Excel`, EXPORT_FORMAT.EXCEL, result.blob, result.filename, blobUrl, result.fileId || null));
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
          }),
        });
      }
      if (!pdfOnly) {
        items.push({
          id: 'export-attendance-summary',
          name: t('attendance_summary'),
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
    <>
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
      onClose={() => setDialOpen(false)}
      onOpen={() => setDialOpen(true)}
      open={dialOpen}
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

export default ScheduleSpeedDial;
