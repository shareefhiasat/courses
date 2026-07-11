import React, { useState, useCallback, useEffect } from 'react';
import { Drawer } from '@ui';
import { Button } from '@/components/kibo/ui/button';
import { Input } from '@/components/kibo/ui/input';
import { Tabs, Tab, Box } from '@mui/material';
import {
  moveAttendanceCard,
  markWorkflowAsTaken,
  fetchWorkflowHistory,
  fetchAttendanceHistory,
  addWorkflowBoardComment,
  ATTENDANCE_COLUMNS,
  WORKFLOW_COLUMNS,
} from '@services/business/operationsBoardService.js';
import { getLectureLog } from '@services/business/attendanceLogService.js';
import { getParticipationsByClassAndDate, createParticipation } from '@services/business/participationService.js';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import {
  formatBoardDate,
  resolveBoardClassName,
  resolveBoardStudentName,
  parseWorkflowCardName,
} from './operationsBoardDisplayUtils.js';
import WorkflowPdfPreviewPanel from './WorkflowPdfPreviewPanel.jsx';
import {
  FileText, X, Eye, EyeOff,
  Activity, User, StickyNote, MessageSquare, Award, Workflow as WorkflowIcon,
} from 'lucide-react';
import { formatDateTime } from '@utils/date-formatter.js';
import { ATTENDANCE_BOARD_COLORS, BOARD_PARTICIPATION_COLOR } from '@constants/workspaceStatusColors.js';

const TAKEN_GREEN = '#ca8a04';

const ATTENDANCE_CODE_TO_BOARD = {
  ATTENDANCE_PRESENT: 'PRESENT',
  ATTENDANCE_LATE: 'LATE',
  ATTENDANCE_ABSENT_NO_EXCUSE: 'ABSENT',
  ATTENDANCE_EXCUSED_LEAVE: 'EXCUSED',
  ATTENDANCE_HUMAN_CASE: 'HUMAN_CASE',
  STANDUP_PRESENT: 'PRESENT',
};

function parseAttendanceNotesList(notesStr, actorName) {
  if (!notesStr?.trim()) return [];
  return notesStr.split('\n---\n').filter(Boolean).map((text, idx) => ({
    id: `saved-note-${idx}`,
    text: text.trim(),
    actor: actorName,
    dotColor: '#f59e0b',
  }));
}

function normalizeSavedWorkflowComment(resultData, fallback) {
  if (resultData && typeof resultData === 'object' && resultData.id != null) {
    return resultData;
  }
  return fallback;
}

function DrawerTimeline({ entries, emptyMessage, lang }) {
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <div className="operations-board-timeline">
      {entries.map((entry, idx) => (
        <div key={entry.id || idx} className="operations-board-timeline-item">
          <span
            className="operations-board-timeline-dot"
            style={{ backgroundColor: entry.dotColor || '#3b82f6' }}
          />
          <div className="operations-board-timeline-line-text">
            {entry.at && (
              <span className="operations-board-timeline-date">
                {formatDateTime(entry.at, lang)}
              </span>
            )}
            {entry.actor && (
              <span className="operations-board-timeline-actor">{entry.actor}</span>
            )}
          </div>
          {entry.type === 'status' && (
            <p className="operations-board-timeline-line-text" style={{ marginTop: '0.35rem' }}>
              <span className="operations-board-timeline-status" style={{ color: entry.fromColor }}>{entry.from || '—'}</span>
              <span className="text-xs text-muted-foreground"> → </span>
              <span className="operations-board-timeline-status" style={{ color: entry.toColor }}>{entry.to || '—'}</span>
            </p>
          )}
          {entry.text && <p className="mt-1 text-sm text-foreground">{entry.text}</p>}
          {entry.reason && <p className="operations-board-timeline-reason">{entry.reason}</p>}
        </div>
      ))}
    </div>
  );
}

function normalizeStatusId(value) {
  if (!value) return null;
  if (typeof value === 'object') {
    return normalizeStatusId(value.code || value.id || value.nameEn || null);
  }
  const raw = String(value).trim();
  const upper = raw.toUpperCase().replace(/\s+/g, '_');
  if (ATTENDANCE_CODE_TO_BOARD[upper]) return ATTENDANCE_CODE_TO_BOARD[upper];
  if (ATTENDANCE_COLUMNS.some((col) => col.id === upper)) return upper;
  const byName = ATTENDANCE_COLUMNS.find(
    (col) => col.name.toLowerCase() === raw.toLowerCase(),
  );
  return byName?.id || upper;
}

function resolveBoardStatusMeta(statusId, t) {
  const normalized = normalizeStatusId(statusId);
  if (!normalized) return { label: '—', color: '#94a3b8' };
  const columns = [...ATTENDANCE_COLUMNS, ...WORKFLOW_COLUMNS];
  const match = columns.find((col) => col.id === normalized);
  if (match) {
    return { label: t(match.i18nKey) || match.name, color: match.color };
  }
  return { label: normalized.replace(/_/g, ' '), color: '#94a3b8' };
}

export default function BoardStudentDrawer({
  open,
  onClose,
  card,
  lane,
  onRefresh,
  onCardUpdated,
  onParticipationRefresh,
  roleContext = {},
}) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [tab, setTab] = useState('activity');
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [lectureLogEntries, setLectureLogEntries] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [notes, setNotes] = useState('');
  const [newParticipationNote, setNewParticipationNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingParticipation, setSavingParticipation] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [participationList, setParticipationList] = useState([]);
  const [attendanceNotesList, setAttendanceNotesList] = useState([]);

  const loadDetail = useCallback(async ({ silent = false } = {}) => {
    if (!card) return;
    if (!silent) setLoading(true);
    try {
      if (card.type === 'workflow') {
        const histResult = await fetchWorkflowHistory(card.rawId);
        if (histResult.success) {
          setHistory(histResult.data?.history || []);
          setComments(histResult.data?.comments || card.raw?.comments || []);
        }
      } else if (card.type === 'attendance') {
        setNotes(card.notes || '');
        const fetches = [];
        if (card.rawId) {
          fetches.push(fetchAttendanceHistory(card.rawId));
        }
        if (card.classId && card.date) {
          fetches.push(getLectureLog(card.classId, card.date));
          fetches.push(getParticipationsByClassAndDate(card.classId, card.date));
        }
        const results = await Promise.all(fetches);
        let histIdx = 0;
        if (card.rawId) {
          const histResult = results[histIdx++];
          if (histResult?.success) {
            const rows = histResult.data || [];
            setHistory(rows);
            setAttendanceLog(rows);
          } else {
            setHistory([]);
            setAttendanceLog([]);
          }
        } else {
          setHistory([]);
          setAttendanceLog([]);
        }
        let lecIdx = card.rawId ? histIdx : 0;
        if (card.classId && card.date) {
          const lecResult = results[lecIdx++];
          if (lecResult?.success) {
            const studentLog = (lecResult.data || []).filter(
              (e) => e.type === 'attendance_status_change'
                && String(e.userId) === String(card.userId),
            );
            setLectureLogEntries(studentLog);
          } else {
            setLectureLogEntries([]);
          }
          const partResult = results[lecIdx];
          if (partResult?.success && partResult.data) {
            setParticipationList(partResult.data.filter((p) => String(p.userId) === String(card.userId)));
          } else {
            setParticipationList([]);
          }
        } else {
          setLectureLogEntries([]);
          setParticipationList([]);
        }
        setComments([]);
      }
    } catch (err) {
      console.error('BoardStudentDrawer:loadDetail:error', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [card]);

  useEffect(() => {
    if (open && card) {
      setTab('activity');
      setPdfPreviewOpen(false);
      setNotes(card.type === 'attendance' ? (card.notes || '') : '');
      setNewComment('');
      setNewParticipationNote('');
      setAttendanceNotesList(parseAttendanceNotesList(card.notes, user?.displayName || user?.name));
      loadDetail();
    }
  }, [open, card, loadDetail]);

  const handleSaveNotes = async () => {
    if (!card || !notes.trim()) return;
    if (card.type === 'workflow') {
      const text = notes.trim();
      const result = await addWorkflowBoardComment(card.rawId, text, 'NOTE');
      if (result.success) {
        const saved = normalizeSavedWorkflowComment(result.data, {
          id: `temp-${Date.now()}`,
          comment: text,
          action: 'NOTE',
          createdAt: new Date().toISOString(),
          author: { displayName: user?.displayName || user?.name || user?.email },
        });
        setComments((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
        setNotes('');
        loadDetail({ silent: true });
      }
      return;
    }
    const text = notes.trim();
    const combinedNotes = card.notes?.trim() ? `${card.notes.trim()}\n---\n${text}` : text;
    const entry = {
      id: `temp-${Date.now()}`,
      text,
      at: new Date().toISOString(),
      actor: user?.displayName || user?.name || user?.email || t('operations_board_system_actor'),
      dotColor: '#f59e0b',
    };
    let result;
    if (!card.rawId) {
      result = await moveAttendanceCard(null, card.column === 'NOT_TAKEN' ? 'PRESENT' : card.column, combinedNotes, {
        userId: card.userId,
        classId: card.classId,
        date: card.date,
      });
    } else {
      result = await moveAttendanceCard(card.rawId, card.column, combinedNotes);
    }
    if (result?.success) {
      const newRawId = result.data?.id || card.rawId;
      setAttendanceNotesList((prev) => [entry, ...prev]);
      setNotes('');
      onCardUpdated?.(card.id, { notes: combinedNotes, rawId: newRawId });
      onRefresh?.();
      loadDetail({ silent: true });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !card || card.type !== 'workflow') return;
    const text = newComment.trim();
    const result = await addWorkflowBoardComment(card.rawId, text, 'COMMENT');
    if (result.success) {
      const saved = normalizeSavedWorkflowComment(result.data, {
        id: `temp-${Date.now()}`,
        comment: text,
        action: 'COMMENT',
        createdAt: new Date().toISOString(),
        author: { displayName: user?.displayName || user?.name || user?.email },
      });
      setComments((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
      setNewComment('');
      loadDetail({ silent: true });
    }
  };

  const handleAddParticipation = async () => {
    if (!newParticipationNote.trim() || !card || card.type !== 'attendance') return;
    setSavingParticipation(true);
    try {
      const text = newParticipationNote.trim();
      const result = await createParticipation({
        userId: card.userId,
        classId: card.classId,
        description: text,
        typeId: 1,
        points: 1,
      });
      if (result.success) {
        const saved = result.data || {
          id: `temp-${Date.now()}`,
          descriptionEn: text,
          notes: text,
          points: 1,
          createdAt: new Date().toISOString(),
        };
        setParticipationList((prev) => [saved, ...prev]);
        setNewParticipationNote('');
        onParticipationRefresh?.();
        onRefresh?.();
        loadDetail({ silent: true });
      }
    } finally {
      setSavingParticipation(false);
    }
  };

  const handleMarkTaken = async () => {
    if (!card || card.type !== 'workflow') return;
    const result = await markWorkflowAsTaken(card.rawId);
    if (result.success) {
      onRefresh?.();
      onClose();
    }
  };

  if (!card) return null;

  const studentName = resolveBoardStudentName(card, lang);
  const className = resolveBoardClassName(card, lang);
  const workflowNameParts = card.type === 'workflow' ? parseWorkflowCardName(card.name) : [];
  const workflowTitle = workflowNameParts[0] || studentName;
  const workflowClassName = workflowNameParts[1] || className;
  const displayTitle = card.type === 'workflow' ? workflowTitle : studentName;
  const displayClassName = card.type === 'workflow' ? workflowClassName : className;
  const classInstructorName = card.classInstructorName || card.assignee || null;
  const isClassInstructor = Boolean(
    card.classInstructorId && user?.dbId && String(card.classInstructorId) === String(user.dbId),
  );
  const instructorDisplay = isClassInstructor
    ? (t('operations_board_you') || 'You')
    : classInstructorName;

  const workflowCommentItems = comments.filter((c) => !c.action || c.action === 'COMMENT');
  const workflowNoteItems = comments.filter((c) => c.action === 'NOTE');

  const statusColumns = card.type === 'attendance' ? ATTENDANCE_COLUMNS : WORKFLOW_COLUMNS;
  const statusColumn = statusColumns.find((c) => c.id === card.column);
  const statusLabel = statusColumn ? t(statusColumn.i18nKey) || statusColumn.name : card.column;

  const buildStatusEntry = (h, prefix = '') => {
    const fromId = typeof h.fromStatus === 'object' ? (h.fromStatus?.code || h.fromStatus?.nameEn) : h.fromStatus || h.oldStatus;
    const toId = typeof h.toStatus === 'object' ? (h.toStatus?.code || h.toStatus?.nameEn) : h.toStatus || h.newStatus;
    const fromMeta = resolveBoardStatusMeta(fromId || h.fromStatus, t);
    const toMeta = resolveBoardStatusMeta(toId || h.toStatus, t);
    return {
      id: h.id || `${prefix}-${h.changedAt || h.createdAt || h.timestamp}`,
      type: 'status',
      actor: h.actor?.displayName || h.changedByUser?.displayName || h.changedBy || h.actor || t('operations_board_system_actor'),
      from: fromMeta.label,
      to: toMeta.label,
      fromColor: fromMeta.color,
      toColor: toMeta.color,
      at: h.createdAt || h.changedAt || h.timestamp,
      reason: h.reason || h.comment || h.notes,
    };
  };

  let activityEntries = [
    ...history.map((h) => buildStatusEntry(h, 'hist')),
    ...lectureLogEntries.map((e, idx) => buildStatusEntry({
      ...e,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      changedAt: e.timestamp,
      id: `lec-${idx}`,
    }, 'lec')),
    ...participationList.map((p, idx) => ({
      id: p.id || `part-${idx}`,
      type: 'participation',
      actor: p.creator?.displayName || t('operations_board_system_actor'),
      text: p.descriptionEn || p.descriptionAr || p.notes || p.comment || t('operations_board_participation'),
      at: p.createdAt,
      dotColor: BOARD_PARTICIPATION_COLOR,
    })),
  ];

  if (card.type === 'attendance' && activityEntries.length === 0 && card.column !== 'NOT_TAKEN') {
    activityEntries.push({
      id: 'current-status',
      type: 'status',
      actor: t('operations_board_system_actor'),
      from: t('operations_board_lane_not_taken') || 'Not yet',
      to: statusLabel,
      fromColor: ATTENDANCE_BOARD_COLORS.NOT_TAKEN,
      toColor: statusColumn?.color || ATTENDANCE_BOARD_COLORS.PRESENT,
      at: card.raw?.updatedAt || card.raw?.createdAt || new Date().toISOString(),
    });
  }

  activityEntries = activityEntries.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const attendanceNoteEntries = attendanceNotesList
    .map((n) => ({
      ...n,
      at: n.at || card.raw?.updatedAt || card.raw?.createdAt,
    }))
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const participationTimelineEntries = participationList.map((p, idx) => ({
    id: p.id || `part-${idx}`,
    type: 'participation',
    actor: p.creator?.displayName || t('operations_board_system_actor'),
    text: p.descriptionEn || p.descriptionAr || p.notes || p.comment || t('operations_board_participation'),
    at: p.createdAt,
    dotColor: BOARD_PARTICIPATION_COLOR,
  })).sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const commentTimelineEntries = workflowCommentItems.map((c) => ({
    id: c.id,
    type: 'comment',
    actor: c.author?.displayName || c.authorName || t('operations_board_unknown_user'),
    text: c.comment || c.text,
    at: c.createdAt,
    dotColor: '#3b82f6',
  })).sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const noteTimelineEntries = workflowNoteItems.map((n) => ({
    id: n.id,
    type: 'note',
    actor: n.author?.displayName || n.authorName || t('operations_board_unknown_user'),
    text: n.comment || n.text,
    at: n.createdAt,
    dotColor: '#f59e0b',
  })).sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      position={lang === 'ar' ? 'left' : 'right'}
      size="lg"
      resizable
      hideCloseButton
      title={null}
      data-testid="operations-board-drawer"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header: avatar / doc icon + title + meta + close */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2.5, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          {card.type === 'attendance' ? (
            <BoardStudentAvatar name={studentName} profileImageUrl={card.profileImageUrl} size="md" />
          ) : (
            <span
              className="inline-flex items-center justify-center rounded-full shrink-0"
              style={{
                width: 44,
                height: 44,
                backgroundColor: statusColumn ? `${statusColumn.color}14` : 'hsl(var(--muted))',
                color: statusColumn?.color || 'currentColor',
              }}
            >
              <FileText size={22} />
            </span>
          )}
          <Box sx={{ minWidth: 0, flex: 1, pt: 0.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.75 }}>
              <span className="text-base font-semibold truncate">{displayTitle}</span>
              {statusColumn && card.type === 'workflow' && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold shrink-0"
                  style={{ color: statusColumn.color }}
                >
                  <WorkflowIcon size={14} aria-hidden />
                  {statusLabel}
                </span>
              )}
              {statusColumn && card.type === 'attendance' && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold shrink-0"
                  style={{ color: statusColumn.color }}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: statusColumn.color }}
                    aria-hidden
                  />
                  {statusLabel}
                </span>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
              {displayClassName && (
                <span className="text-sm text-muted-foreground truncate">{displayClassName}</span>
              )}
              {card.date && (
                <span className="text-sm text-muted-foreground">{formatBoardDate(card.date, lang)}</span>
              )}
              {card.type === 'workflow' && classInstructorName && (
                <span className="text-sm text-muted-foreground">
                  {t('operations_board_class_instructor') || 'Class instructor'}:{' '}
                  <span className="font-medium text-foreground">{instructorDisplay}</span>
                </span>
              )}
            </Box>
          </Box>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
          >
            <X size={18} />
          </button>
        </Box>

        {card.type === 'workflow' && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
            {card.status === 'DRAFT' && (
              <Button
                size="sm"
                onClick={handleMarkTaken}
                data-testid="operations-board-mark-taken"
                className="h-8 w-fit px-3 text-xs"
                style={{ backgroundColor: TAKEN_GREEN, color: '#fff' }}
              >
                {t('operations_board_mark_taken')}
              </Button>
            )}
            {card.fileId && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-fit gap-2 px-3"
                onClick={() => setPdfPreviewOpen((v) => !v)}
                data-testid="operations-board-preview-pdf-toggle"
              >
                <FileText size={16} />
                {pdfPreviewOpen ? (
                  <>
                    <EyeOff size={16} />
                    {t('operations_board_hide_preview') || 'Hide preview'}
                  </>
                ) : (
                  <>
                    <Eye size={16} />
                    {t('operations_board_preview_pdf') || 'Preview PDF'}
                  </>
                )}
              </Button>
            )}
          </Box>
        )}

        {card.type === 'workflow' && card.fileId && pdfPreviewOpen && (
          <Box sx={{ mb: 2 }}>
            <WorkflowPdfPreviewPanel
              fileId={card.fileId}
              fileName={card.fileName}
              open={pdfPreviewOpen}
              onClose={() => setPdfPreviewOpen(false)}
              t={t}
              compact
            />
          </Box>
        )}

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          data-drawer-tabs="true"
          sx={{
            flexShrink: 0,
            minHeight: 38,
            '& .MuiTabs-flexContainer': {
              display: 'flex',
              gap: '0.5rem',
            },
            '& .MuiTabs-indicator': { display: 'none' },
          }}
        >
          {[
            { key: 'activity', label: t('operations_board_tab_activity'), icon: Activity },
            ...(card.type === 'attendance'
              ? [{ key: 'profile', label: t('operations_board_tab_profile') || 'Profile', icon: User }]
              : [{ key: 'details', label: t('operations_board_tab_details') || 'Details', icon: FileText }]),
            { key: 'notes', label: t('operations_board_tab_notes'), icon: StickyNote },
            ...(card.type === 'attendance'
              ? [{ key: 'participation', label: t('operations_board_participation') || 'Participation', icon: Award }]
              : []),
            ...(card.type === 'workflow'
              ? [{ key: 'comments', label: t('operations_board_tab_comments'), icon: MessageSquare }]
              : []),
          ].map(({ key, label, icon: Icon }) => (
            <Tab
              key={key}
              value={key}
              data-testid={`operations-board-drawer-tab-${key}`}
              label={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Icon size={14} />
                  {label}
                </span>
              }
              sx={{
                minHeight: 32,
                height: 32,
                textTransform: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: 'divider',
                px: 2,
                py: 0.5,
                color: 'text.secondary',
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  color: '#fff',
                  bgcolor: 'primary.main',
                  borderColor: 'primary.main',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                },
                '&:hover:not(.Mui-selected)': {
                  bgcolor: 'action.hover',
                  borderColor: 'text.disabled',
                },
              }}
            />
          ))}
        </Tabs>

        {tab === 'activity' && (
          <Box sx={{ flex: 1, overflow: 'auto', pt: 1 }} data-testid="operations-board-activity-feed">
            {loading ? (
              <p className="text-sm text-muted-foreground">{t('operations_board_loading')}</p>
            ) : (
              <DrawerTimeline
                entries={activityEntries.map((entry) => ({
                  ...entry,
                  dotColor: entry.dotColor
                    || (entry.type === 'participation' ? BOARD_PARTICIPATION_COLOR
                      : entry.type === 'status' ? (entry.toColor || '#94a3b8') : '#3b82f6'),
                }))}
                emptyMessage={t('operations_board_no_activity')}
                lang={lang}
              />
            )}
          </Box>
        )}

        {tab === 'profile' && card.type === 'attendance' && (
          <Box sx={{ flex: 1, overflow: 'auto' }} data-testid="operations-board-profile">
            {(() => {
              const u = card.user || {};
              const profileRows = [
                { label: t('operations_board_profile_name') || 'Name', value: studentName },
                { label: t('operations_board_profile_name_ar') || 'Name (Arabic)', value: [u.firstNameAr, u.lastNameAr].filter(Boolean).join(' ') || null },
                { label: t('operations_board_profile_student_number') || 'Student Number', value: u.studentNumber || card.studentNumber || null },
                { label: t('operations_board_profile_email') || 'Email', value: u.email || null },
                { label: t('operations_board_profile_phone') || 'Phone', value: u.phone || u.phoneNumber || u.mobile || null },
                { label: t('operations_board_profile_rank') || 'Rank', value: (lang === 'ar' ? u.rankAr : u.rankEn) || null },
                { label: t('operations_board_profile_display_name') || 'Display Name', value: (lang === 'ar' ? u.displayNameAr : u.displayName) || null },
                { label: t('operations_board_profile_sequence') || 'Sequence', value: u.sequence != null ? String(u.sequence) : (card.sequence != null ? String(card.sequence) : null) },
              ];
              return (
                <div className="grid grid-cols-1 gap-4">
                  {profileRows.map((row, idx) => (
                    row.value ? (
                      <div key={idx} className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">{row.label}</span>
                        <span className="text-sm font-medium text-foreground">{row.value}</span>
                      </div>
                    ) : null
                  ))}
                  {profileRows.every((r) => !r.value) && (
                    <p className="text-sm text-muted-foreground">{t('operations_board_no_profile') || 'No profile information available.'}</p>
                  )}
                </div>
              );
            })()}
          </Box>
        )}

        {tab === 'details' && card.type === 'workflow' && (
          <Box sx={{ flex: 1, overflow: 'auto', pt: 1 }} data-testid="operations-board-workflow-details">
            <div className="operations-board-profile-list">
              {[
                { label: t('operations_board_details_workflow') || 'Workflow', value: displayTitle },
                { label: t('operations_board_details_class') || 'Class', value: displayClassName },
                { label: t('operations_board_details_date') || 'Date', value: card.date ? formatBoardDate(card.date, lang) : null },
                { label: t('operations_board_class_instructor') || 'Class instructor', value: instructorDisplay },
                { label: t('operations_board_details_status') || 'Status', value: statusLabel },
              ].filter((row) => row.value).map((row, idx) => (
                <div key={idx} className="operations-board-profile-row">
                  <span className="operations-board-profile-label">{row.label}</span>
                  <span className="operations-board-profile-value">{row.value}</span>
                </div>
              ))}
            </div>
          </Box>
        )}

        {tab === 'notes' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }} data-testid="operations-board-notes-panel">
            <Box sx={{ flex: 1, overflow: 'auto', pt: 1, mb: 2 }}>
              {card.type === 'workflow' ? (
                <DrawerTimeline
                  entries={noteTimelineEntries}
                  emptyMessage={t('operations_board_no_notes') || 'No notes yet.'}
                  lang={lang}
                />
              ) : (
                <DrawerTimeline
                  entries={attendanceNoteEntries}
                  emptyMessage={t('operations_board_no_notes') || 'No notes yet.'}
                  lang={lang}
                />
              )}
            </Box>
            <div className="flex gap-2">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('operations_board_add_note') || 'Add a note...'}
                data-testid="operations-board-notes-input"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNotes(); }}
              />
              <Button size="sm" onClick={handleSaveNotes}>{t('operations_board_note_save') || 'Save'}</Button>
            </div>
          </Box>
        )}

        {tab === 'participation' && card.type === 'attendance' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }} data-testid="operations-board-participation-panel">
            <Box sx={{ flex: 1, overflow: 'auto', pt: 1, mb: 2 }}>
              <DrawerTimeline
                entries={participationTimelineEntries}
                emptyMessage={t('operations_board_no_participation') || 'No participation records for this student.'}
                lang={lang}
              />
            </Box>
            <div className="flex gap-2">
              <Input
                value={newParticipationNote}
                onChange={(e) => setNewParticipationNote(e.target.value)}
                placeholder={t('operations_board_add_participation') || 'Add participation note...'}
                data-testid="operations-board-participation-input"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddParticipation(); }}
                disabled={savingParticipation}
              />
              <Button size="sm" onClick={handleAddParticipation} disabled={savingParticipation}>
                {t('operations_board_note_save') || 'Save'}
              </Button>
            </div>
          </Box>
        )}

        {tab === 'comments' && card.type === 'workflow' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ flex: 1, overflow: 'auto', pt: 1, mb: 2 }}>
              <DrawerTimeline
                entries={commentTimelineEntries}
                emptyMessage={t('operations_board_no_comments') || 'No comments yet.'}
                lang={lang}
              />
            </Box>
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('operations_board_card_add_comment')}
                data-testid="operations-board-comment-input"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
              />
              <Button size="sm" onClick={handleAddComment}>{t('operations_board_note_save') || 'Save'}</Button>
            </div>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
