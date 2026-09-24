import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import {
  AlertTriangle,
  AlertCircle,
  UserX,
  CheckCircle2,
  X,
  Eye,
  FileCheck,
  FileX2,
  Send,
  CircleX,
  Heart,
  Paperclip,
  Clock,
  FileText,
  FilePenLine,
  GitBranch,
  ExternalLink,
} from 'lucide-react';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import BoardStudentAvatar from '@components/operations-board/BoardStudentAvatar.jsx';
import { useToast } from '@ui';
import { useLang } from '@contexts/LangContext';
import {
  fetchAttendanceDeductionSuggestion,
  approveAttendanceExcuse,
  uploadChatAttachment,
} from '@services/business/attendanceDeductionService.js';
import { previewWarningLetter, initiateWarningWorkflow } from '@services/business/violationViewService.js';
import {
  getWeekRange,
  getApprovedSnapshotForWeek,
  getDailyWorkflowHistory,
} from '@services/business/workflowSnapshotService.js';

const STATUS_LABELS = {
  ATTENDANCE_ABSENT: { labelKey: 'violations.unexcused' },
  ATTENDANCE_LEAVE: { labelKey: 'violations.excused' },
  ATTENDANCE_HUMAN_CASE: { labelKey: 'violations.human' },
  ATTENDANCE_LATE: { labelKey: 'violations.late' },
  ATTENDANCE_PRESENT: { labelKey: 'violations.present' },
};

const STATUS_ICONS = {
  ATTENDANCE_ABSENT: { icon: CircleX, color: '#ef4444' },
  ATTENDANCE_LEAVE: { icon: FileCheck, color: '#ec4899' },
  ATTENDANCE_HUMAN_CASE: { icon: Heart, color: '#8b5cf6' },
  ATTENDANCE_LATE: { icon: Clock, color: '#f59e0b' },
  ATTENDANCE_PRESENT: { icon: CheckCircle2, color: '#22c55e' },
};


// Normalize a row date (ISO string or Date) to a local YYYY-MM-DD key.
function toLocalISODate(d) {
  if (d instanceof Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return String(d).slice(0, 10);
}

const JOURNEY_STEPS = [
  { key: 'compliant', threshold: 0, labelKey: 'violations.compliant', color: '#22c55e', icon: CheckCircle2 },
  { key: 'first', threshold: 4, labelKey: 'violations.1st_warning', color: '#f59e0b', icon: AlertTriangle },
  { key: 'final', threshold: 8, labelKey: 'violations.final_warning', color: '#ef4444', icon: AlertCircle },
  { key: 'dismissed', threshold: 9, labelKey: 'violations.dismissal', color: '#b91c1c', icon: UserX },
];

function getStepForWarning(warningType, unexcusedAbsences) {
  if (warningType === 'dismissed' || unexcusedAbsences >= 9) return 3;
  if (warningType === 'final' || unexcusedAbsences >= 8) return 2;
  if (warningType === 'first' || unexcusedAbsences >= 4) return 1;
  return 0;
}

export default function ViolationReviewDialog({
  open,
  onClose,
  student,
  classId,
  programId,
  isDark,
  isAr,
  lang,
  metadata,
  user,
  onUpdated,
}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [approving, setApproving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [weeklyFileByWeek, setWeeklyFileByWeek] = useState({});
  const [dailyFileByDate, setDailyFileByDate] = useState({});

  const [approvalComment, setApprovalComment] = useState('');
  const [approvalFile, setApprovalFile] = useState(null);
  const toast = useToast();
  const { t } = useLang();


  const name = isAr ? (student.studentNameAr || student.studentName) : (student.studentName || student.studentNameAr);
  const rank = isAr ? (student.rankAr || student.rankEn) : (student.rankEn || student.rankAr);

  const activeStep = useMemo(
    () => getStepForWarning(student.warningType, student.classUnexcusedAbsences || 0),
    [student]
  );

  const nextWarningInfo = useMemo(() => {
    const unexcused = student.classUnexcusedAbsences || 0;
    const nextStep = JOURNEY_STEPS[activeStep + 1];
    if (!nextStep) {
      return { message: t('violations.next_warning_dismissed'), progress: 1, color: '#b91c1c' };
    }
    const remaining = Math.max(0, nextStep.threshold - unexcused);
    const progress = nextStep.threshold > 0 ? Math.min(1, unexcused / nextStep.threshold) : 1;
    return {
      message: t('violations.next_warning_progress', { remaining, nextWarning: t(nextStep.labelKey) }),
      progress,
      color: nextStep.color,
      remaining,
    };
  }, [activeStep, student.classUnexcusedAbsences, t]);

  const reviewableStatusCodes = useMemo(
    () => new Set(['ATTENDANCE_ABSENT', 'ATTENDANCE_LEAVE', 'ATTENDANCE_HUMAN_CASE']),
    []
  );

  const pendingRows = useMemo(
    () => records.filter((r) => reviewableStatusCodes.has(r.statusCode) && !r.excusedViaWorkflow && r.deduction > 0),
    [records, reviewableStatusCodes]
  );

  const approvedRows = useMemo(
    () => records.filter((r) => reviewableStatusCodes.has(r.statusCode) && (r.excusedViaWorkflow || r.deduction === 0)),
    [records, reviewableStatusCodes]
  );

  // Group pending + approved rows by attendance week (Sun–Thu), newest week first.
  const weekGroups = useMemo(() => {
    const groups = new Map();
    const addRow = (row, bucket) => {
      const { weekFrom, weekTo } = getWeekRange(toLocalISODate(row.date));
      if (!groups.has(weekFrom)) {
        groups.set(weekFrom, { weekFrom, weekTo, pending: [], approved: [] });
      }
      groups.get(weekFrom)[bucket].push(row);
    };
    pendingRows.forEach((r) => addRow(r, 'pending'));
    approvedRows.forEach((r) => addRow(r, 'approved'));
    return [...groups.values()].sort((a, b) => b.weekFrom.localeCompare(a.weekFrom));
  }, [pendingRows, approvedRows]);

  useEffect(() => {
    if (!open || !student.studentId || !classId) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      setSelectedIds(new Set());
      setApprovalComment('');
      setApprovalFile(null);
      try {
        const res = await fetchAttendanceDeductionSuggestion({
          userId: student.studentId,
          classId,
        });
        const payload = res?.data || res?.payload || res;
        const rows = payload?.rows || [];
        if (mounted) {
          setRecords(rows);
        }

        // Load approved daily report files (class-scoped, one call) and
        // approved weekly snapshot files (program-scoped, one call per week).
        try {
          const dailyRes = await getDailyWorkflowHistory({ classId, programId });
          const dailyMap = {};
          (dailyRes?.data || []).forEach((doc) => {
            if (String(doc.status || '').toUpperCase() !== 'APPROVED') return;
            const fid = doc.snapshotFileId || doc.fileId || doc.snapshotFile?.id || doc.file?.id;
            if (!fid) return;
            const entry = { fileId: fid, docId: doc.id };
            // Map every plausible date key (raw slice + local conversion, plus
            // dateFrom/dateTo fallbacks) so a UTC-shifted timestamp still
            // matches the attendance row's day.
            [doc.date, doc.dateFrom, doc.dateTo].filter(Boolean).forEach((d) => {
              dailyMap[String(d).slice(0, 10)] = entry;
              dailyMap[toLocalISODate(new Date(d))] = entry;
            });
          });
          if (mounted) setDailyFileByDate(dailyMap);
        } catch {
          /* non-blocking */
        }

        try {
          const weekKeys = [
            ...new Set(rows.map((r) => getWeekRange(toLocalISODate(r.date)).weekFrom)),
          ];
          const weeklyMap = {};
          await Promise.all(
            weekKeys.map(async (wf) => {
              const { weekFrom, weekTo } = getWeekRange(wf);
              const snapRes = await getApprovedSnapshotForWeek({ weekFrom, weekTo, programId });
              const doc = snapRes?.data;
              const fid = doc?.snapshotFileId || doc?.fileId;
              if (fid) weeklyMap[weekFrom] = { fileId: fid, docId: doc.id };
            })
          );
          if (mounted) setWeeklyFileByWeek(weeklyMap);
        } catch {
          /* non-blocking */
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load deduction details');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [open, student.studentId, classId, programId]);

  const toggleAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(pendingRows.map((r) => r.attendanceId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleOne = (id, checked) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleApproveSelected = async () => {
    if (selectedIds.size === 0) return;

    const comment = approvalComment.trim();
    if (!comment) {
      setError(t('violations.please_enter_an_approval_comment'));
      return;
    }

    setApproving(true);
    setError(null);
    try {
      let attachment = null;
      if (approvalFile) {
        attachment = await uploadChatAttachment(approvalFile);
      }

      const ids = Array.from(selectedIds);
      for (const attendanceId of ids) {
        await approveAttendanceExcuse({
          attendanceId,
          reason: comment,
          attachmentUrl: attachment?.url,
          attachmentName: attachment?.name,
          attachmentType: attachment?.type,
        });
      }

      const res = await fetchAttendanceDeductionSuggestion({
        userId: student.studentId,
        classId,
      });
      const payload = res?.data || res?.payload || res;
      setRecords(payload?.rows || []);
      setSelectedIds(new Set());
      setApprovalComment('');
      setApprovalFile(null);
      toast.success(t('violations.excuses_approved', { 'ids.length': ids.length }));
      if (onUpdated) onUpdated();
    } catch (err) {
      const msg = err.message || 'Failed to approve excuse(s)';
      setError(msg);
      toast.error(t('violations.approve_excuse_failed', { msg }));
    } finally {
      setApproving(false);
    }
  };

  // Generate the warning letter PDF and open it in a new tab (no embedded preview).
  const handlePreview = async () => {
    if (!student.warningType || previewing) return;
    setPreviewing(true);
    try {
      const url = await previewWarningLetter(student, student.warningType, lang, metadata);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.message || 'Failed to preview warning letter');
    } finally {
      setPreviewing(false);
    }
  };

  const handleIssue = async () => {
    if (!student.warningType) return;
    setIssuing(true);
    setError(null);
    try {
      await initiateWarningWorkflow({
        student,
        warningType: student.warningType,
        lang,
        metadata,
        user,
      });
      if (onUpdated) onUpdated();
      onClose();
      toast.success(t('violations.warning_issued'));
    } catch (err) {
      const msg = err.message || 'Failed to issue warning';
      setError(msg);
      toast.error(t('violations.issue_warning_failed', { msg }));
    } finally {
      setIssuing(false);
    }
  };

  const actionRefs = useRef({});
  useEffect(() => {
    actionRefs.current = { handlePreview, handleIssue, handleApproveSelected, onClose };
  });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        actionRefs.current.onClose();
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        actionRefs.current.handlePreview();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        actionRefs.current.handleIssue();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        actionRefs.current.handleApproveSelected();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const statusLabel = (code) => {
    const cfg = STATUS_LABELS[code] || STATUS_LABELS.ATTENDANCE_ABSENT;
    return t(cfg.labelKey);
  };

  const getLastAmendment = (row) => row.lastAmendment || (row.amendments?.length ? row.amendments[row.amendments.length - 1] : null);

  const openFileInNewTab = (fileId) => {
    if (!fileId) return;
    window.open(`/api/v1/drive/files/${fileId}/download`, '_blank', 'noopener,noreferrer');
  };

  // Open the operations board focused on this workflow (week or day view).
  const openWorkflowInNewTab = (docId, { date, viewMode = 'week' } = {}) => {
    if (!docId) return;
    const params = new URLSearchParams({
      programId: String(programId || ''),
      tab: 'operations',
      lane: 'status',
      viewMode,
      workflowId: String(docId),
    });
    if (classId) params.set('classId', String(classId));
    if (date) params.set('date', date);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    window.open(`${origin}${pathname}?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  // Week header label matching the calendar toolbar: "W31 02/08 - 06/08" / "أسبوع 31 02/08 - 06/08".
  const formatWeekLabel = (weekFrom) => {
    const weekStart = new Date(`${weekFrom}T00:00:00`);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const jan1 = new Date(weekStart.getFullYear(), 0, 1);
    const weekNum = Math.ceil((Math.floor((weekStart - jan1) / 86400000) + 1) / 7);
    return isAr
      ? `${t('violations.week')} ${weekNum} · ${fmt(weekStart)} - ${fmt(weekEnd)}`
      : `W${weekNum} · ${fmt(weekStart)} - ${fmt(weekEnd)}`;
  };

  const renderRecordRow = (row, isApproved) => {
    const isSelected = !isApproved && selectedIds.has(row.attendanceId);
    const deductionColor = row.deduction === 0.25 ? '#22c55e' : '#ef4444';
    const dailyDoc = dailyFileByDate[toLocalISODate(row.date)];
    const dailyFileId = dailyDoc?.fileId;
    const dailyDocId = dailyDoc?.docId;
    const lastAmendment = getLastAmendment(row);
    const note = lastAmendment?.reason;
    const attachmentUrl = lastAmendment?.attachmentUrl;
    const attachmentName = lastAmendment?.attachmentName;

    const genericNoteRegex = /^excuse approved(?:\s*via\s*workflow\s*#?\d+)?\.?$/i;
    const showNote = isApproved && note && !genericNoteRegex.test(note.trim());

    const statusCfg = STATUS_ICONS[row.statusCode] || STATUS_ICONS.ATTENDANCE_ABSENT;
    const StatusIcon = isApproved ? CheckCircle2 : statusCfg.icon;
    const statusColor = isApproved ? '#22c55e' : statusCfg.color;

    return (
      <div
        key={row.attendanceId}
        className="flex items-center gap-3 px-1 py-2.5 border-b border-slate-200/70 last:border-b-0 hover:bg-muted/30 transition-colors"
      >
        {!isApproved && (
          <Checkbox
            size="small"
            checked={isSelected}
            onChange={(e) => toggleOne(row.attendanceId, e.target.checked)}
            sx={{ p: 0.5 }}
          />
        )}
        {isApproved && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">
              {new Date(row.date).toLocaleDateString(isAr ? 'ar-QA' : 'en-GB')}
            </span>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <StatusIcon size={14} style={{ color: statusColor }} />
              {statusLabel(row.statusCode)}
            </span>
          </div>
          {(showNote || attachmentUrl) && (
            <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {showNote && <span className="block truncate">{note}</span>}
              {attachmentUrl && (
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Paperclip size={12} />
                  {attachmentName || (t('violations.attachment'))}
                </a>
              )}
            </div>
          )}
        </div>
        <div className="text-sm font-bold tabular-nums" style={{ color: deductionColor }}>
          - {row.deduction.toFixed(2)}
        </div>
        <ColoredTooltip title={t('violations.open_daily_report')} color="#3b82f6" placement="top">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (dailyFileId) {
                openFileInNewTab(dailyFileId);
              } else {
                toast.info(t('violations.no_daily_report'));
              }
            }}
            aria-label={t('violations.open_daily_report')}
            sx={{ p: 0.25, opacity: dailyFileId ? 1 : 0.35 }}
          >
            <FilePenLine size={15} color="#3b82f6" />
          </IconButton>
        </ColoredTooltip>
        {dailyDocId && (
          <ColoredTooltip title={t('violations.open_workflow')} color="#64748b" placement="top">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                openWorkflowInNewTab(dailyDocId, { date: toLocalISODate(row.date), viewMode: 'day' });
              }}
              aria-label={t('violations.open_workflow')}
              sx={{ p: 0.25 }}
            >
              <ExternalLink size={14} color="#64748b" />
            </IconButton>
          </ColoredTooltip>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper" PaperProps={{ className: 'border-0 shadow-xl' }}>
      <DialogTitle className="flex items-center justify-between pr-4">
        <div className="flex items-center gap-3">
          <BoardStudentAvatar
            name={name}
            profileImageUrl={student.profileImageUrl}
            cacheBuster={student.avatarUpdatedAt}
            size="md"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {rank && <span className="text-xs text-muted-foreground font-normal">{rank}</span>}
              <span className="font-semibold text-base">{name}</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">{student.studentNumber}</span>
          </div>
          <div className="flex items-center gap-2 ml-2 sm:ml-4 text-xs tabular-nums">
            <ColoredTooltip title={t('violations.deduction_approved') || 'Approved deduction'} color="#16a34a" placement="bottom">
              <span className="inline-flex items-center gap-1 font-semibold" style={{ color: '#16a34a', cursor: 'default' }}>
                <FileCheck size={13} />
                -{Number(student.classDeductionApproved ?? student.deductionApproved ?? 0).toFixed(2)}
              </span>
            </ColoredTooltip>
            <ColoredTooltip title={t('violations.deduction_not_approved') || 'Pending deduction'} color="#ef4444" placement="bottom">
              <span className="inline-flex items-center gap-1 font-semibold" style={{ color: '#ef4444', cursor: 'default' }}>
                <FileX2 size={13} />
                -{Number(student.classDeductionNotApproved ?? student.deductionNotApproved ?? 0).toFixed(2)}
              </span>
            </ColoredTooltip>
            <ColoredTooltip title={t('violations.deduction_total') || 'Total deduction'} color="#64748b" placement="bottom">
              <span className="text-base font-bold text-red-500" style={{ cursor: 'default' }}>
                = -{Number(student.deductionTotal || 0).toFixed(2)}
              </span>
            </ColoredTooltip>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconButton onClick={onClose} size="small">
            <X size={18} />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent className="py-4 flex flex-col gap-6">
        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        {/* Warning journey — compact stepper, only the active step is colored */}
        <div>
          <div className="flex items-center">
            {JOURNEY_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === activeStep;
              const color = isActive ? step.color : 'var(--muted-foreground, #94a3b8)';
              const unexcused = student.classUnexcusedAbsences || 0;
              const remaining = Math.max(0, step.threshold - unexcused);
              const tip = step.threshold === 0
                ? t('violations.compliant_tooltip', { count: unexcused }) || `Compliant — ${unexcused} unexcused (below 4)`
                : unexcused >= step.threshold
                  ? t('violations.step_reached_tooltip', { label: t(step.labelKey), threshold: step.threshold }) || `${t(step.labelKey)} — reached (≥${step.threshold} unexcused)`
                  : t('violations.step_remaining_tooltip', { remaining, label: t(step.labelKey), threshold: step.threshold }) || `${remaining} more unexcused until ${t(step.labelKey)} (≥${step.threshold})`;
              return (
                <React.Fragment key={step.key}>
                  <ColoredTooltip title={tip} color={step.color} placement="top">
                    <div
                      className="flex items-center gap-1.5 min-w-0"
                      style={{ opacity: isActive ? 1 : 0.55, cursor: 'default' }}
                    >
                      <StepIcon size={14} style={{ color, flexShrink: 0 }} />
                      <span className="text-xs font-semibold whitespace-nowrap" style={{ color }}>
                        {t(step.labelKey)}
                      </span>
                      {step.threshold > 0 && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">≥{step.threshold}</span>
                      )}
                    </div>
                  </ColoredTooltip>
                  {idx < JOURNEY_STEPS.length - 1 && (
                    <div className="flex-1 h-px bg-muted-foreground/15 mx-2" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {nextWarningInfo && (
            <ColoredTooltip title={nextWarningInfo.message} color={nextWarningInfo.color} placement="top">
              <div className="mt-2.5 flex items-center gap-3" style={{ cursor: 'default' }}>
                <div className="flex-1 h-1 rounded-full overflow-hidden bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${nextWarningInfo.progress * 100}%`, backgroundColor: nextWarningInfo.color }}
                  />
                </div>
              </div>
            </ColoredTooltip>
          )}
        </div>

        {/* Breakdown summary — single inline row, muted when zero */}
        <div className="flex items-center gap-5 flex-wrap border-y border-slate-200/70 py-2.5">
          {[
            { key: 'unexcused', label: t('violations.unexcused'), value: student.classUnexcusedAbsences || 0, color: '#ef4444', icon: CircleX },
            { key: 'excused', label: t('violations.excused'), value: student.classExcusedAbsences || 0, color: '#ec4899', icon: FileCheck },
            { key: 'human', label: t('violations.human'), value: student.classHumanCaseCount || 0, color: '#8b5cf6', icon: Heart },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <span key={item.key} className="inline-flex items-center gap-1.5" style={{ color: item.color, opacity: item.value > 0 ? 1 : 0.55 }}>
                <Icon size={14} />
                <span className="text-sm font-bold tabular-nums">{item.value}</span>
                <span className="text-xs">{item.label}</span>
              </span>
            );
          })}
        </div>

        {/* Bulk approve */}
        {pendingRows.length > 0 && (
          <div className="rounded-lg border border-slate-200/70 p-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Checkbox
                  size="small"
                  checked={selectedIds.size === pendingRows.length}
                  indeterminate={selectedIds.size > 0 && selectedIds.size < pendingRows.length}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
                <span className="font-semibold">
                  {t('violations.approve_all_pending', { count: pendingRows.length })}
                </span>
              </div>

              {selectedIds.size > 0 && (
                <div className="flex flex-col gap-3">
                  <TextField
                    multiline
                    minRows={2}
                    maxRows={4}
                    fullWidth
                    size="small"
                    placeholder={t('violations.enter_a_reason_for_approving_these_records')}
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    disabled={approving}
                  />
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      size="small"
                      variant="outlined"
                      component="label"
                      startIcon={<Paperclip size={16} />}
                      disabled={approving}
                    >
                      {approvalFile
                        ? (approvalFile.name.length > 30 ? `${approvalFile.name.slice(0, 27)}...` : approvalFile.name)
                        : (t('violations.attach_file_optional'))}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setApprovalFile(file);
                        }}
                      />
                    </Button>
                    {approvalFile && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => setApprovalFile(null)}
                        disabled={approving}
                      >
                        {t('violations.remove')}
                      </Button>
                    )}
                    <ColoredTooltip
                      title={t('violations.approve_shortcut', { shortcut: 'Ctrl+Shift+A' })}
                      color="#22c55e"
                      placement="top"
                    >
                      <span className="ms-auto">
                        <Button
                          onClick={handleApproveSelected}
                          disabled={approving || !approvalComment.trim()}
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={approving ? <CircularProgress size={16} color="inherit" /> : <FileCheck size={16} />}
                        >
                          {approving
                            ? (t('violations.approving'))
                            : (t('violations.approve', { 'selectedIds.size': selectedIds.size }))}
                        </Button>
                      </span>
                    </ColoredTooltip>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review records */}
        <div className="flex flex-col">
          {loading ? (
            <div className="flex justify-center py-6">
              <CircularProgress size={24} />
            </div>
          ) : pendingRows.length === 0 && approvedRows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t('violations.no_records_to_review')}
            </div>
          ) : (
            <div className="flex flex-col max-h-72 overflow-y-auto">
              {weekGroups.map((group) => {
                const weeklyDoc = weeklyFileByWeek[group.weekFrom];
                const weeklyFileId = weeklyDoc?.fileId;
                const weeklyDocId = weeklyDoc?.docId;
                return (
                  <div key={group.weekFrom} className="mb-2 last:mb-0">
                    <div
                      className="flex items-center gap-2 px-1 py-1.5 sticky top-0 z-10"
                      style={{ backgroundColor: 'var(--panel, #ffffff)' }}
                    >
                      <span className="text-xs font-bold text-muted-foreground">
                        {formatWeekLabel(group.weekFrom)}
                      </span>
                      {group.approved.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600">
                          <CheckCircle2 size={14} />
                          {group.approved.length} {t('violations.approved')}
                        </span>
                      )}
                      <span style={{ marginInlineStart: 'auto', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                        <ColoredTooltip title={t('violations.open_weekly_report')} color="#8b5cf6" placement="top">
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (weeklyFileId) {
                                openFileInNewTab(weeklyFileId);
                              } else {
                                toast.info(t('violations.no_weekly_report'));
                              }
                            }}
                            aria-label={t('violations.open_weekly_report')}
                            sx={{ p: 0.25, opacity: weeklyFileId ? 1 : 0.35 }}
                          >
                            <GitBranch size={14} color="#8b5cf6" />
                          </IconButton>
                        </ColoredTooltip>
                        {weeklyDocId && (
                          <ColoredTooltip title={t('violations.open_workflow')} color="#64748b" placement="top">
                            <IconButton
                              size="small"
                              onClick={() => openWorkflowInNewTab(weeklyDocId, { date: group.weekFrom, viewMode: 'week' })}
                              aria-label={t('violations.open_workflow')}
                              sx={{ p: 0.25 }}
                            >
                              <ExternalLink size={13} color="#64748b" />
                            </IconButton>
                          </ColoredTooltip>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      {group.pending.map((row) => renderRecordRow(row, false))}
                      {group.approved.map((row) => renderRecordRow(row, true))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </DialogContent>

      <DialogActions className="px-4 py-3 border-t border-slate-200 gap-2 bg-transparent">
        <ColoredTooltip
          title={t('violations.close_shortcut', { shortcut: 'Esc' })}
          color="#64748b"
          placement="top"
        >
          <span>
            <Button onClick={onClose} size="small" color="inherit">
              {t('violations.close')}
            </Button>
          </span>
        </ColoredTooltip>

        {student.warningType && (
          <>
            <ColoredTooltip
              title={t('violations.preview_shortcut', { shortcut: 'Ctrl+Shift+P' })}
              color="#3b82f6"
              placement="top"
            >
              <span>
                <Button
                  onClick={handlePreview}
                  disabled={issuing || previewing}
                  size="small"
                  variant="outlined"
                  color="info"
                  startIcon={previewing ? <CircularProgress size={16} color="inherit" /> : <Eye size={16} />}
                >
                  {t('violations.preview')}
                </Button>
              </span>
            </ColoredTooltip>
            {student.warningType !== 'dismissed' && (
              <ColoredTooltip
                title={t('violations.issue_shortcut', { shortcut: 'Ctrl+Shift+I' })}
                color={student.warningType === 'first' ? '#f59e0b' : '#ef4444'}
                placement="top"
              >
                <span>
                  <Button
                    onClick={handleIssue}
                    disabled={issuing}
                    size="small"
                    variant="contained"
                    color={student.warningType === 'first' ? 'warning' : 'error'}
                    startIcon={issuing ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
                  >
                    {issuing
                      ? (t('violations.issuing'))
                      : (isAr
                          ? 'إصدار الإنذار'
                          : (student.warningType === 'first' ? 'Issue 1st warning' : 'Issue final warning'))}
                  </Button>
                </span>
              </ColoredTooltip>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
