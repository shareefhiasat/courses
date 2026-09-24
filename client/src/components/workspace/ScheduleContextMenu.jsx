import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import { EXPORT_FORMAT, downloadBlob } from '@services/export/official-reports/index.jsx';
import {
  exportWeeklyScheduleForScope,
  exportDailyOfficialTemplate,
  exportDailyOfficialForDate,
  exportAttendanceOfficialForScope,
} from '@services/business/accessScopeExportService.js';
import { FileText, FileSpreadsheet, AlertCircle, CheckCircle2, ExternalLink, Workflow as WorkflowIcon, FilePenLine, GitBranch, FileSignature, Star, CircleDashed, FileBarChart, Paintbrush } from 'lucide-react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton, Box } from '@mui/material';
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';
import useQRPermissions from '@hooks/useQRPermissions';
import { isHROnlyViewer, canViewParticipation } from '@components/operations-board/hrAttendancePrivacy.js';
import AppMenu from '@components/ui/mui/AppMenu.jsx';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip.jsx';
import InitiateWorkflowDialog from '@components/workspace/InitiateWorkflowDialog.jsx';
import UploadSignedDialog from '@components/workflow/UploadSignedDialog.jsx';
import { handleFilePreview } from '@utils/fileUtils.js';
import { findExistingAttendanceWorkflow } from '@services/business/workflowInitiationService.js';
import { exportClassSummaryReport, exportClassDeductionReport } from '@services/business/studentSummaryReportService.js';
import { getWeekRange } from '@services/business/workflowSnapshotService.js';
import { toIsoDate } from '@components/operations-board/boardClassCalendarUtils.js';
import { WORKFLOW_STATUS } from '@constants/workflowStatusTypes.jsx';
import { getWorkflowBadgeColor, BOARD_PARTICIPATION_COLOR, SCHEDULE_WORKFLOW_COLORS } from '@constants/workspaceStatusColors.js';

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
  onOpenWeeklyWorkflowDialog,
  onExportSuccess,
}) {
  const { user, isAdmin, isHR, isSuperAdmin, isInstructor } = useAuth();
  const { t, lang } = useLang();
  const { canExport, canSeeStandupMode } = useQRPermissions();
  const hrOnly = isHROnlyViewer({ isHR, isAdmin, isSuperAdmin });
  const instructorOnly = isInstructor && !isAdmin && !isHR && !isSuperAdmin;
  const canSeeParticipation = canViewParticipation({ isInstructor, isAdmin, isHR, isSuperAdmin });
  const [exporting, setExporting] = useState(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [existingWorkflow, setExistingWorkflow] = useState(null);
  const [existingWeeklyWorkflow, setExistingWeeklyWorkflow] = useState(null);
  const [signedUploadTarget, setSignedUploadTarget] = useState(null); // 'daily' | 'weekly' | null
  const [dailyIncludeNotes, setDailyIncludeNotes] = useState(false);
  const [dailyIncludeParticipation, setDailyIncludeParticipation] = useState(false);
  const [colorizeClassSummary, setColorizeClassSummary] = useState(() => {
    try {
      const saved = localStorage.getItem('schedule_colorize_class_summary');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('schedule_colorize_class_summary', colorizeClassSummary ? 'true' : 'false');
    } catch { /* ignore */ }
  }, [colorizeClassSummary]);
  const canToggleDailyNotes = isAdmin || isSuperAdmin;

  const cls = session?.class;
  const subject = cls?.subject;
  const slotInstructor = session?.instructor || cls?.instructorName;
  const dateStr = toIsoDate(selectedDate) || toIsoDate(new Date());
  const canUploadSignedCopy = isAdmin || isHR || isSuperAdmin;

  const handleSignedClick = useCallback((workflow, target) => {
    if (!workflow) return;
    const signedFile = workflow.signedFile;
    if (signedFile?.id) {
      handleFilePreview(signedFile);
      onClose();
      return;
    }
    if (!canUploadSignedCopy) return;
    setSignedUploadTarget(target);
    onClose();
  }, [onClose, canUploadSignedCopy]);

  const handleSignedUploaded = useCallback((data) => {
    const patch = (prev) => (prev ? { ...prev, signedFile: data?.signedFile || prev.signedFile, signedFileId: data?.signedFileId || prev.signedFileId } : prev);
    if (signedUploadTarget === 'weekly') {
      setExistingWeeklyWorkflow(patch);
    } else {
      setExistingWorkflow(patch);
    }
  }, [signedUploadTarget]);

  useEffect(() => {
    if (!cls?.id || !dateStr) {
      setExistingWorkflow(null);
      setExistingWeeklyWorkflow(null);
      return undefined;
    }
    if (!open) return undefined;
    let cancelled = false;
    Promise.all([
      findExistingAttendanceWorkflow(cls.id, dateStr, 'DAILY'),
      findExistingAttendanceWorkflow(cls.id, dateStr, 'WEEKLY_SUMMARY'),
    ]).then(([dailyResult, weeklyResult]) => {
      if (!cancelled) {
        setExistingWorkflow(dailyResult.success ? dailyResult.data : null);
        setExistingWeeklyWorkflow(weeklyResult.success ? weeklyResult.data : null);
      }
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

  const buildExportBanner = useCallback((label, format, blob, filename, blobUrl, date = dateStr, workflowStatus = null) => ({
    pillColor: workflowStatus ? getWorkflowBadgeColor(String(workflowStatus).toUpperCase()).bg : '#059669',
    icon: <CheckCircle2 size={16} className="shrink-0" />,
    message: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
        {`${label}${date ? ` — ${date}` : ''} — ${t('export_success') || 'Export successful'}`}
        <button
          type="button"
          className="inline-flex items-center gap-0.5 rounded-md text-xs font-semibold px-1.5 py-0.5 hover:bg-white/25 transition-colors"
          onClick={() =>
            format === EXPORT_FORMAT.EXCEL
              ? downloadBlob(blob, `${filename}.xlsx`)
              : window.open(blobUrl, '_blank')
          }
          style={{ marginInlineStart: '4px' }}
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
  }), [t, dateStr]);

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
      viewMode: 'day',
    });
    onClose();
  }, [cls, dateStr, onOpenOperations, onClose]);

  const handleOpenWeeklyWorkflow = useCallback(() => {
    if (!cls) return;
    if (existingWeeklyWorkflow?.id) {
      onOpenOperations?.({
        lane: 'status',
        date: dateStr,
        viewMode: 'week',
        workflowId: String(existingWeeklyWorkflow.id),
      });
    } else {
      onOpenWeeklyWorkflowDialog?.(cls.id);
    }
    onClose();
  }, [cls, dateStr, existingWeeklyWorkflow, onOpenOperations, onOpenWeeklyWorkflowDialog, onClose]);

  const handleInitiateWorkflow = useCallback(() => {
    setWorkflowDialogOpen(true);
    onClose();
  }, [onClose]);

  const runDailyExport = useCallback(async (format) => {
    if (!existingWorkflow) return;
    const isApproved = existingWorkflow?.status === WORKFLOW_STATUS.APPROVED;
    const formatLabel = isApproved
      ? (format === EXPORT_FORMAT.PDF ? (t('export_pdf') || 'PDF') : (t('export_excel') || 'Excel'))
      : (format === EXPORT_FORMAT.PDF ? (t('operations_board_preview_pdf') || 'Preview PDF') : (t('operations_board_preview_excel') || 'Preview Excel'));
    const label = `${t('daily_official') || 'Daily Official'} — ${formatLabel}`;
    const result = await exportDailyOfficialForDate({
      cls,
      program,
      subject,
      academicTerm,
      lang,
      user,
      date: dateStr,
      instructorName: slotInstructor,
      format,
      skipDownload: true,
      skipPersist: !isApproved,
      workflowStatus: existingWorkflow?.status || null,
      approvedBy: existingWorkflow?.approvedBy || null,
      approvedAt: existingWorkflow?.approvedAt || null,
      includeNotes: dailyIncludeNotes,
      includeParticipation: dailyIncludeParticipation,
    });
    const blobUrl = URL.createObjectURL(result.blob);
    onExportSuccess?.(buildExportBanner(
      label,
      format,
      result.blob,
      result.filename || 'workflow_document',
      blobUrl,
      dateStr,
      existingWorkflow?.status || null,
    ));
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  }, [existingWorkflow, cls, program, subject, academicTerm, lang, user, dateStr, slotInstructor, onExportSuccess, buildExportBanner, t, dailyIncludeNotes, dailyIncludeParticipation]);

  const handleDailyPdf = useCallback(() => {
    if (!existingWorkflow) return;
    onClose();
    runExport('daily-pdf', () => runDailyExport(EXPORT_FORMAT.PDF));
  }, [existingWorkflow, onClose, runExport, runDailyExport]);

  const handleDailyExcel = useCallback(() => {
    if (!existingWorkflow) return;
    onClose();
    runExport('daily-excel', () => runDailyExport(EXPORT_FORMAT.EXCEL));
  }, [existingWorkflow, onClose, runExport, runDailyExport]);

  const runWeeklyExport = useCallback(async (format) => {
    if (!existingWeeklyWorkflow) return;
    const isApproved = existingWeeklyWorkflow?.status === WORKFLOW_STATUS.APPROVED;
    const formatLabel = isApproved
      ? (format === EXPORT_FORMAT.PDF ? (t('export_pdf') || 'PDF') : (t('export_excel') || 'Excel'))
      : (format === EXPORT_FORMAT.PDF ? (t('weekly_preview') || 'Weekly Preview PDF') : (t('weekly_preview_excel') || 'Weekly Preview Excel'));
    const label = `${t('attendance_summary') || 'Attendance Summary'} — ${formatLabel}`;
    const { weekFrom, weekTo } = getWeekRange(new Date(dateStr));
    const subjectIds = subject?.id ? [subject.id] : (cls?.subjectId ? [cls.subjectId] : []);
    const result = await exportAttendanceOfficialForScope({
      subjectIds,
      violationTypes: {
        absentNoExcuse: true,
        absentWithExcuse: true,
        excusedLeave: true,
        late: true,
        humanCase: true,
      },
      dateFrom: weekFrom,
      dateTo: weekTo,
      programId: program?.id,
      programName: program?.name || program?.nameEn || '',
      lang,
      user,
      format,
      preview: !isApproved,
      skipPersist: !isApproved,
      download: false,
      classIds: [cls.id],
      workflowStatus: existingWeeklyWorkflow?.status || null,
      approvedBy: existingWeeklyWorkflow?.approvedBy || null,
      approvedAt: existingWeeklyWorkflow?.approvedAt || null,
    });
    const weekRange = `${weekFrom} → ${weekTo}`;
    onExportSuccess?.(buildExportBanner(
      label,
      format,
      result.blob,
      result.filename || 'weekly_workflow_preview',
      result.blobUrl,
      weekRange,
      existingWeeklyWorkflow?.status || null,
    ));
    setTimeout(() => URL.revokeObjectURL(result.blobUrl), 60000);
  }, [existingWeeklyWorkflow, cls, subject, program, lang, user, dateStr, onExportSuccess, buildExportBanner, t]);

  const handleWeeklyPdf = useCallback(() => {
    if (!existingWeeklyWorkflow) return;
    onClose();
    runExport('weekly-pdf', () => runWeeklyExport(EXPORT_FORMAT.PDF));
  }, [existingWeeklyWorkflow, onClose, runExport, runWeeklyExport]);

  const handleWeeklyExcel = useCallback(() => {
    if (!existingWeeklyWorkflow) return;
    onClose();
    runExport('weekly-excel', () => runWeeklyExport(EXPORT_FORMAT.EXCEL));
  }, [existingWeeklyWorkflow, onClose, runExport, runWeeklyExport]);

  const handleCloseWorkflowDialog = useCallback(() => {
    setWorkflowDialogOpen(false);
  }, []);

  const handleGoToOperationsFromWorkflow = useCallback((wf) => {
    const params = {
      lane: 'status',
      classId: cls?.id,
      date: dateStr,
      viewMode: 'day',
      _t: String(Date.now()),
    };
    if (wf?.id) {
      params.workflowId = String(wf.id);
    }
    onOpenOperations?.(params);
    setWorkflowDialogOpen(false);
  }, [cls, dateStr, onOpenOperations]);

  const handleOpenFilteredNotifications = useCallback(() => {
    onOpenNotifications?.({
      filterClass: cls?.id ? String(cls.id) : 'all',
      filterSubject: cls?.subjectId || subject?.id ? String(cls?.subjectId || subject?.id) : 'all',
      filterProgram: program?.id ? String(program.id) : 'all',
      showAdvanced: true,
    });
    onClose();
  }, [cls, subject, program, onOpenNotifications, onClose]);

  const handleHistory = useCallback(() => {
    onOpenHistory?.(cls, selectedDate, 'lecture');
    onClose();
  }, [onOpenHistory, cls, selectedDate, onClose]);

  const actions = useMemo(() => {
    const items = [];

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
    const standupItem = null;

    if (hrOnly) {
      attendanceChildren.push(manualItem, boardItem);
    } else if (isAdmin) {
      attendanceChildren.push(boardItem, manualItem);
    } else if (instructorOnly) {
      attendanceChildren.push(boardItem);
    } else {
      attendanceChildren.push(manualItem, boardItem);
    }

    const notYetBadge = (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '2px 10px',
        minWidth: '96px',
        borderRadius: '9999px',
        fontSize: '0.65rem',
        fontWeight: 700,
        backgroundColor: SCHEDULE_WORKFLOW_COLORS.not_taken,
        color: '#ffffff',
        border: `1px solid ${SCHEDULE_WORKFLOW_COLORS.not_taken}`,
        lineHeight: '1.4',
        whiteSpace: 'nowrap',
      }}>
        <CircleDashed size={11} color="#ffffff" strokeWidth={2.5} />
        {t('workspace_status_not_taken') || 'Not yet'}
      </span>
    );

    // Add workflow actions inside the Attendance submenu for non-instructors
    if (!instructorOnly) {
      let workflowItem;
      if (existingWorkflow) {
        const status = String(existingWorkflow.status || '').toUpperCase();
        const displayStatus = (hrOnly && status === WORKFLOW_STATUS.REJECTED) ? null : status;
        if (displayStatus) {
          const colorCfg = getWorkflowBadgeColor(status);
          const statusLabel = t(`workflow_status_${status.toLowerCase()}`, status);
          const iconColor = colorCfg.bg;
          const canInitiate = (status === WORKFLOW_STATUS.REJECTED);
          const isApproved = status === WORKFLOW_STATUS.APPROVED;
          const trailingActions = [];
          if (canToggleDailyNotes) {
            trailingActions.push({
              title: dailyIncludeNotes ? (t('export_exclude_notes') || 'Exclude notes column') : (t('export_include_notes') || 'Include notes column'),
              icon: <Star size={16} style={{ color: '#ef4444' }} fill={dailyIncludeNotes ? '#ef4444' : 'none'} />,
              tooltipColor: '#ef4444',
              keepOpen: true,
              onClick: () => setDailyIncludeNotes((prev) => !prev),
            });
            if (canSeeParticipation) {
              trailingActions.push({
                title: dailyIncludeParticipation ? (t('export_exclude_participation') || 'Exclude participation column') : (t('export_include_participation') || 'Include participation column'),
                icon: <Star size={16} style={{ color: BOARD_PARTICIPATION_COLOR }} fill={dailyIncludeParticipation ? BOARD_PARTICIPATION_COLOR : 'none'} />,
                tooltipColor: BOARD_PARTICIPATION_COLOR,
                keepOpen: true,
                onClick: () => setDailyIncludeParticipation((prev) => !prev),
              });
            }
          }
          trailingActions.push({
            title: isApproved ? (t('export_pdf') || 'PDF') : (t('operations_board_preview_pdf') || 'PDF'),
            icon: <FileText size={16} style={{ color: '#e53935' }} />,
            tooltipColor: '#e53935',
            onClick: handleDailyPdf,
          });
          trailingActions.push({
            title: isApproved ? (t('export_excel') || 'Excel') : (t('operations_board_preview_excel') || 'Excel'),
            icon: <FileSpreadsheet size={16} style={{ color: '#43a047' }} />,
            tooltipColor: '#43a047',
            onClick: handleDailyExcel,
          });
          if (isApproved) {
            const hasSigned = Boolean(existingWorkflow?.signedFile?.id || existingWorkflow?.signedFileId);
            if (hasSigned || canUploadSignedCopy) {
              trailingActions.push({
                title: hasSigned ? (t('view_signed_copy') || 'View signed copy') : (t('upload_signed_copy') || 'Upload signed copy'),
                icon: <FileSignature size={16} style={{ color: '#8b5cf6' }} />,
                tooltipColor: '#8b5cf6',
                onClick: () => handleSignedClick(existingWorkflow, 'daily'),
              });
            }
          }
          if (canInitiate) {
            trailingActions.push({
              title: t('workspace_menu_workflow_initiate') || 'Re-initiate',
              icon: getThemedIcon('ui', 'file_signature', 16, '#16a34a'),
              tooltipColor: '#16a34a',
              onClick: handleInitiateWorkflow,
            });
          }
          workflowItem = {
            id: 'daily-attendance-existing',
            labelNode: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', minWidth: '48px' }}>{t('daily') || 'Daily'}</span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '2px 10px',
                  minWidth: '96px',
                  borderRadius: '9999px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: colorCfg.bg,
                  color: colorCfg.text,
                  border: `1px solid ${colorCfg.border}`,
                  lineHeight: '1.4',
                  whiteSpace: 'nowrap',
                }}>
                  <WorkflowIcon size={12} color={colorCfg.text} strokeWidth={2.5} />
                  {statusLabel}
                </span>
              </span>
            ),
            icon: <FilePenLine size={18} color="#3b82f6" />,
            onClick: () => handleGoToOperationsFromWorkflow(existingWorkflow),
            trailingActions,
          };
        }
      } else {
        workflowItem = {
          id: 'initiate-workflow',
          labelNode: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', minWidth: '48px' }}>{t('daily') || 'Daily'}</span>
              {notYetBadge}
            </span>
          ),
          icon: <FilePenLine size={18} color="#3b82f6" />,
          onClick: handleInitiateWorkflow,
        };
      }

      if (workflowItem) {
        attendanceChildren.push({ divider: true });
        attendanceChildren.push(workflowItem);
      }

      let weeklyWorkflowItem;
      if (existingWeeklyWorkflow) {
        const weeklyStatus = String(existingWeeklyWorkflow.status || '').toUpperCase();
        const weeklyDisplayStatus = (hrOnly && weeklyStatus === WORKFLOW_STATUS.REJECTED) ? null : weeklyStatus;
        if (weeklyDisplayStatus) {
          const weeklyColorCfg = getWorkflowBadgeColor(weeklyStatus);
          const weeklyStatusLabel = t(`workflow_status_${weeklyStatus.toLowerCase()}`, weeklyStatus);
          const weeklyIconColor = weeklyColorCfg.bg;
          const weeklyIsApproved = weeklyStatus === WORKFLOW_STATUS.APPROVED;
          const weeklyTrailingActions = [];
          weeklyTrailingActions.push({
            title: weeklyIsApproved ? (t('export_pdf') || 'PDF') : (t('operations_board_preview_pdf') || 'PDF'),
            icon: <FileText size={16} style={{ color: '#e53935' }} />,
            tooltipColor: '#e53935',
            onClick: handleWeeklyPdf,
          });
          weeklyTrailingActions.push({
            title: weeklyIsApproved ? (t('export_excel') || 'Excel') : (t('operations_board_preview_excel') || 'Excel'),
            icon: <FileSpreadsheet size={16} style={{ color: '#43a047' }} />,
            tooltipColor: '#43a047',
            onClick: handleWeeklyExcel,
          });
          if (weeklyIsApproved) {
            const hasSigned = Boolean(existingWeeklyWorkflow?.signedFile?.id || existingWeeklyWorkflow?.signedFileId);
            if (hasSigned || canUploadSignedCopy) {
              weeklyTrailingActions.push({
                title: hasSigned ? (t('view_signed_copy') || 'View signed copy') : (t('upload_signed_copy') || 'Upload signed copy'),
                icon: <FileSignature size={16} style={{ color: '#8b5cf6' }} />,
                tooltipColor: '#8b5cf6',
                onClick: () => handleSignedClick(existingWeeklyWorkflow, 'weekly'),
              });
            }
          }
          weeklyWorkflowItem = {
            id: 'weekly-workflow',
            labelNode: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', minWidth: '48px' }}>{t('weekly') || 'Weekly'}</span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '2px 10px',
                  minWidth: '96px',
                  borderRadius: '9999px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: weeklyColorCfg.bg,
                  color: weeklyColorCfg.text,
                  border: `1px solid ${weeklyColorCfg.border}`,
                  lineHeight: '1.4',
                  whiteSpace: 'nowrap',
                }}>
                  <WorkflowIcon size={12} color={weeklyColorCfg.text} strokeWidth={2.5} />
                  {weeklyStatusLabel}
                </span>
              </span>
            ),
            icon: <GitBranch size={18} color="#8b5cf6" />,
            onClick: handleOpenWeeklyWorkflow,
            trailingActions: weeklyTrailingActions,
          };
        }
      } else {
        weeklyWorkflowItem = {
          id: 'weekly-workflow',
          labelNode: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', minWidth: '48px' }}>{t('weekly') || 'Weekly'}</span>
              {notYetBadge}
            </span>
          ),
          icon: <GitBranch size={18} color="#8b5cf6" />,
          onClick: handleOpenWeeklyWorkflow,
        };
      }
      if (weeklyWorkflowItem) {
        attendanceChildren.push({ divider: true });
        attendanceChildren.push(weeklyWorkflowItem);
      }

      if (cls?.id) {
        const classInfo = {
          className: cls.nameEn || cls.name || '',
          classNameAr: cls.nameAr || '',
          subjectName: subject?.nameEn || subject?.name || '',
          subjectNameAr: subject?.nameAr || '',
          programName: program?.nameEn || program?.name || '',
          programNameAr: program?.nameAr || '',
          term: academicTerm,
        };
        const showReportBanner = (label, format, result) => {
          if (!result?.blob) return;
          const blobUrl = URL.createObjectURL(result.blob);
          const baseName = (result.filename || 'report').replace(/\.(pdf|xlsx)$/i, '');
          onExportSuccess?.(buildExportBanner(
            `${label} — ${format === EXPORT_FORMAT.EXCEL ? (t('export_excel') || 'Excel') : (t('export_pdf') || 'PDF')}`,
            format,
            result.blob,
            baseName,
            blobUrl,
            null,
          ));
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        };
        const runClassSummary = (format) => runExport(`class-summary-${format}`, async () => {
          console.log('[ScheduleContextMenu] exporting class summary:', { classId: cls.id, format, colorize: colorizeClassSummary });
          const result = await exportClassSummaryReport({ classId: cls.id, classInfo, format, lang, user, notify: false, colorize: colorizeClassSummary });
          showReportBanner(t('report_class_summary') || 'Class Summary', format, result);
        });
        const runClassDeduction = (format) => runExport(`class-deduction-${format}`, async () => {
          const result = await exportClassDeductionReport({ classId: cls.id, classInfo, format, lang, user, notify: false });
          showReportBanner(t('report_class_deduction') || 'Deduction Report', format, result);
        });
        attendanceChildren.push({ divider: true });
        attendanceChildren.push({
          id: 'class-summary',
          label: t('report_class_summary') || 'Class Summary',
          icon: <FileBarChart size={18} color="#0ea5e9" />,
          onClick: () => runClassSummary('excel'),
          trailing: (
            <ColoredTooltip
              title={
                colorizeClassSummary
                  ? (t('colorize_class_summary_on') || 'Colorize rows')
                  : (t('colorize_class_summary_off') || 'Plain rows')
              }
              color={colorizeClassSummary ? '#0ea5e9' : '#64748b'}
              placement="top"
            >
              <Box
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const newValue = !colorizeClassSummary;
                  console.log('[ScheduleContextMenu] colorizeClassSummary toggled:', { classId: cls?.id, newValue });
                  setColorizeClassSummary(newValue);
                  try {
                    localStorage.setItem('schedule_colorize_class_summary', newValue ? 'true' : 'false');
                  } catch { /* ignore */ }
                }}
                aria-label={
                  colorizeClassSummary
                    ? (t('colorize_class_summary_on') || 'Colorize rows')
                    : (t('colorize_class_summary_off') || 'Plain rows')
                }
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  borderRadius: 0.75,
                  opacity: 0.75,
                  color: colorizeClassSummary ? '#0ea5e9' : '#94a3b8',
                  '&:hover': { bgcolor: 'action.selected', opacity: 1 },
                }}
              >
                <Paintbrush
                  size={16}
                  fill={colorizeClassSummary ? '#0ea5e9' : 'none'}
                  color={colorizeClassSummary ? '#0ea5e9' : '#94a3b8'}
                />
              </Box>
            </ColoredTooltip>
          ),
          trailingActions: [
            {
              title: t('export_excel') || 'Excel',
              icon: <FileSpreadsheet size={16} style={{ color: '#43a047' }} />,
              tooltipColor: '#43a047',
              onClick: () => runClassSummary('excel'),
            },
          ],
        });
        attendanceChildren.push({
          id: 'class-deduction',
          label: t('report_class_deduction') || 'Deduction Report',
          icon: <FileBarChart size={18} color="#e53935" />,
          onClick: () => runClassDeduction('pdf'),
          trailingActions: [
            {
              title: t('export_pdf') || 'PDF',
              icon: <FileText size={16} style={{ color: '#e53935' }} />,
              tooltipColor: '#e53935',
              onClick: () => runClassDeduction('pdf'),
            },
            {
              title: t('export_excel') || 'Excel',
              icon: <FileSpreadsheet size={16} style={{ color: '#f59e0b' }} />,
              tooltipColor: '#f59e0b',
              onClick: () => runClassDeduction('excel'),
            },
          ],
        });
      }
    }

    items.push({
      id: 'attendance',
      label: t('workspace_menu_attendance') || 'Attendance',
      icon: getThemedIcon('ui', 'check_circle', 18, 'currentColor'),
      children: attendanceChildren,
    });

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
  }, [t, handleScan, handleOpenOperations, handleOpenWeeklyWorkflow, handleInitiateWorkflow, handleHistory, handleOpenFilteredNotifications, isAdmin, hrOnly, instructorOnly, canSeeParticipation, existingWorkflow, existingWeeklyWorkflow, handleGoToOperationsFromWorkflow, handleDailyPdf, handleDailyExcel, handleWeeklyPdf, handleWeeklyExcel, handleSignedClick, canUploadSignedCopy, canToggleDailyNotes, dailyIncludeNotes, dailyIncludeParticipation, colorizeClassSummary]);

  return (
    <>
      <AppMenu
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        actions={actions}
        t={t}
        isRTL={lang === 'ar'}
        flipToFit
        cascade
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
      <UploadSignedDialog
        open={Boolean(signedUploadTarget)}
        onClose={() => setSignedUploadTarget(null)}
        documentId={signedUploadTarget === 'weekly' ? existingWeeklyWorkflow?.id : existingWorkflow?.id}
        onUploaded={handleSignedUploaded}
      />
    </>
  );
}

export default ScheduleContextMenu;
