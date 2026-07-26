import React, { useState, useCallback, useEffect } from 'react';
import { Drawer } from '@ui';
import { Button } from '@/components/kibo/ui/button';
import { Input } from '@/components/kibo/ui/input';
import { Tabs, Tab, Box } from '@mui/material';
import {
  moveAttendanceCard,
  fetchWorkflowHistory,
  fetchAttendanceHistory,
  addWorkflowBoardComment,
  ATTENDANCE_COLUMNS,
  WORKFLOW_COLUMNS,
  ATTENDANCE_BOARD_LANES,
} from '@services/business/operationsBoardService.js';
import { getLectureLog } from '@services/business/attendanceLogService.js';
import { getParticipationsByClassAndDate, createParticipation } from '@services/business/participationService.js';
import {
  shouldHideAttendancePrivacyTabs,
  shouldHideNotesCommentsOnly,
  filterActivityEntriesForHR,
  maskAttendanceColumnForHR,
  isHROnlyViewer,
  isInstructorOnlyViewer,
} from './hrAttendancePrivacy.js';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import {
  formatBoardDate,
  resolveBoardClassName,
  resolveBoardStudentName,
  parseWorkflowCardName,
} from './operationsBoardDisplayUtils.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import WorkflowPdfPreviewPanel from './WorkflowPdfPreviewPanel.jsx';
import { exportDailyOfficialForDate } from '@services/business/accessScopeExportService.js';
import { getClasses } from '@services/business/classService.js';
import { getSubjects } from '@services/business/programService.js';
import {
  FileText, X, Eye, EyeOff, CheckCircle2, ShieldCheck,
  Activity, User, StickyNote, MessageSquare, Award, Workflow as WorkflowIcon,
} from 'lucide-react';
import { formatDateTime } from '@utils/date-formatter.js';
import { ATTENDANCE_BOARD_COLORS, BOARD_PARTICIPATION_COLOR } from '@constants/workspaceStatusColors.js';

const { PRESENT, LATE, ABSENT, EXCUSED, HUMAN_CASE, NOT_TAKEN } = ATTENDANCE_BOARD_LANES;

const ATTENDANCE_CODE_TO_BOARD = {
  ATTENDANCE_PRESENT: PRESENT,
  ATTENDANCE_LATE: LATE,
  ATTENDANCE_ABSENT: ABSENT,
  ATTENDANCE_ABSENT_NO_EXCUSE: ABSENT,
  ABSENT_WITH_EXCUSE: EXCUSED,
  ATTENDANCE_LEAVE: EXCUSED,
  ATTENDANCE_EXCUSED_LEAVE: EXCUSED,
  SICK_LEAVE: EXCUSED,
  ATTENDANCE_HUMAN_CASE: HUMAN_CASE,
  EARLY_DEPARTURE: HUMAN_CASE,
  STANDUP_PRESENT: PRESENT,
  STANDUP_LATE: LATE,
  STANDUP_ABSENT: ABSENT,
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
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.toColor || '#94a3b8' }}
                aria-hidden
              />
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

function resolveBoardStatusMeta(statusId, t, roleContext = {}) {
  const normalized = normalizeStatusId(statusId);
  if (!normalized) return { label: '—', color: '#94a3b8' };
  const displayId = maskAttendanceColumnForHR(normalized, roleContext);
  const columns = [...ATTENDANCE_COLUMNS, ...WORKFLOW_COLUMNS];
  const match = columns.find((col) => col.id === displayId);
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
  onActionBanner,
  roleContext = {},
}) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [tab, setTab] = useState('activity');
  const instructorViewer = isInstructorOnlyViewer(roleContext);
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
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewGeneratedAt, setPreviewGeneratedAt] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
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
        if (card.classId && card.date && !isHROnlyViewer(roleContext)) {
          const partResult = await getParticipationsByClassAndDate(card.classId, card.date);
          if (partResult?.success && partResult.data) {
            setParticipationList(partResult.data);
          } else {
            setParticipationList([]);
          }
        } else {
          setParticipationList([]);
        }
      } else if (card.type === 'attendance') {
        setNotes(card.notes || '');
        const fetches = [];
        if (card.rawId) {
          fetches.push(fetchAttendanceHistory(card.rawId));
        }
        if (card.classId && card.date) {
          fetches.push(getLectureLog(card.classId, card.date));
          if (!isHROnlyViewer(roleContext)) {
            fetches.push(getParticipationsByClassAndDate(card.classId, card.date));
          }
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
          if (!isHROnlyViewer(roleContext)) {
            const partResult = results[lecIdx];
            if (partResult?.success && partResult.data) {
              setParticipationList(partResult.data.filter((p) => String(p.userId) === String(card.userId)));
            } else {
              setParticipationList([]);
            }
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
  }, [card, roleContext]);

  const openedCardIdRef = React.useRef(null);

  useEffect(() => {
    if (!open || !card) {
      if (!open) openedCardIdRef.current = null;
      return;
    }
    const isNewCard = openedCardIdRef.current !== card.id;
    openedCardIdRef.current = card.id;
    if (isNewCard) {
      const defaultTab = instructorViewer
        ? (card.type === 'attendance' ? 'notes' : (card.classId && card.date ? 'participation' : 'notes'))
        : 'activity';
      setTab(defaultTab);
      setPdfPreviewOpen(false);
      setPreviewBlobUrl(null);
      setPreviewGeneratedAt(null);
      setNotes(card.type === 'attendance' ? (card.notes || '') : '');
      setNewComment('');
      setNewParticipationNote('');
      setAttendanceNotesList(parseAttendanceNotesList(card.notes, user?.displayName || user?.name));
      loadDetail();
    }
  }, [open, card?.id, loadDetail, user?.displayName, user?.name]);

  const handleGeneratePreview = useCallback(async () => {
    if (!card || card.type !== 'workflow') return;
    if (card.snapshotFileId || card.fileId) {
      setPdfPreviewOpen((v) => !v);
      return;
    }
    if (pdfPreviewOpen) {
      setPdfPreviewOpen(false);
      return;
    }
    setPreviewLoading(true);
    setPdfPreviewOpen(true);
    try {
      const dateStr = card.date ? String(card.date).slice(0, 10) : null;
      if (!dateStr || !card.classId) {
        setPreviewLoading(false);
        return;
      }
      const classesRes = await getClasses({ isActive: true, limit: 500 });
      const allClasses = classesRes?.success ? (classesRes.data || []) : [];
      const cls = allClasses.find((c) => c.id === card.classId);
      if (!cls) { setPreviewLoading(false); return; }
      const subjectsRes = await getSubjects({ programId: cls.programId });
      const allSubjects = subjectsRes?.success ? (subjectsRes.data || []) : [];
      const subject = allSubjects.find((s) => s.id === cls.subjectId);
      const result = await exportDailyOfficialForDate({
        cls,
        program: {
          id: cls.programId,
          nameEn: card.programName || cls.programName,
          nameAr: card.programNameAr || cls.programNameAr,
        },
        subject: subject ? { id: subject.id, nameEn: subject.nameEn, nameAr: subject.nameAr } : null,
        academicTerm: null,
        lang,
        user,
        date: dateStr,
        skipDownload: true,
        skipPersist: true,
      });
      if (result?.blob) {
        const url = URL.createObjectURL(result.blob);
        setPreviewBlobUrl(url);
        setPreviewGeneratedAt(new Date().toLocaleString());
      }
    } catch (err) {
      console.error('[BoardStudentDrawer] preview generation error:', err);
    } finally {
      setPreviewLoading(false);
    }
  }, [card, pdfPreviewOpen, lang, user]);

  const handleSaveNotes = async () => {
    if (!card || !notes.trim()) return;
    const name = resolveBoardStudentName(card, lang);
    if (card.type === 'workflow') {
      const text = notes.trim();
      const result = await addWorkflowBoardComment(card.rawId, text, 'NOTE');
      if (result.success) {
        const saved = normalizeSavedWorkflowComment(result.data, {
          id: `temp-${Date.now()}`,
          comment: text,
          action: 'NOTE',
          createdAt: new Date().toISOString(),
          author: { displayName: user?.displayName || user?.name },
        });
        setComments((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
        setNotes('');
        loadDetail({ silent: true });
        onActionBanner?.({
          message: t('operations_board_note_saved', { name }),
        });
      }
      return;
    }
    const text = notes.trim();
    const combinedNotes = card.notes?.trim() ? `${card.notes.trim()}\n---\n${text}` : text;
    const entry = {
      id: `temp-${Date.now()}`,
      text,
      at: new Date().toISOString(),
      actor: user?.displayName || user?.name || t('operations_board_system_actor'),
      dotColor: '#f59e0b',
    };
    let result;
    if (!card.rawId) {
      result = await moveAttendanceCard(null, card.column === NOT_TAKEN ? PRESENT : card.column, combinedNotes, {
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
      onActionBanner?.({
        message: t('operations_board_note_saved', { name }),
      });
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
        author: { displayName: user?.displayName || user?.name },
      });
      setComments((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
      setNewComment('');
      loadDetail({ silent: true });
      onActionBanner?.({
        message: t('operations_board_comment_added', { name: resolveBoardStudentName(card, lang) }),
      });
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
        onActionBanner?.({
          message: t('operations_board_participation_added', { name: resolveBoardStudentName(card, lang) }),
        });
      }
    } finally {
      setSavingParticipation(false);
    }
  };

  if (!card) return null;

  const studentName = resolveBoardStudentName(card, lang);
  const className = resolveBoardClassName(card, lang);
  const workflowNameParts = card.type === 'workflow' ? parseWorkflowCardName(card.name) : [];
  let workflowTitle = workflowNameParts[0] || studentName;
  if (lang === 'ar' && workflowTitle && workflowTitle.includes('Daily Attendance')) {
    workflowTitle = workflowTitle.replace(/Daily Attendance/g, t('operations_board_daily_attendance') || 'حضور يومي');
  }
  const displayTitle = card.type === 'workflow' ? workflowTitle : studentName;
  const displayClassName = className;
  const studentNumber = card.studentNumber || card.user?.studentNumber || null;
  const classInstructorName = card.classInstructorName || null;
  const isClassInstructor = Boolean(
    card.classInstructorId && user?.dbId && String(card.classInstructorId) === String(user.dbId),
  );
  const instructorDisplay = isClassInstructor
    ? (t('operations_board_you') || 'You')
    : classInstructorName;

  const workflowCommentItems = comments.filter((c) => !c.action || c.action === 'COMMENT');
  const workflowNoteItems = comments.filter((c) => c.action === 'NOTE');

  const statusColumns = card.type === 'attendance' ? ATTENDANCE_COLUMNS : WORKFLOW_COLUMNS;
  const displayColumn = card.type === 'attendance'
    ? maskAttendanceColumnForHR(card.column, roleContext)
    : card.column;
  const statusColumn = statusColumns.find((c) => c.id === displayColumn);
  const statusLabel = statusColumn ? t(statusColumn.i18nKey) || statusColumn.name : displayColumn;

  const hidePrivacyTabs = shouldHideAttendancePrivacyTabs(roleContext);
  const hideNotesComments = shouldHideNotesCommentsOnly(roleContext);
  const hrViewer = isHROnlyViewer(roleContext);

  const cleanActorName = (name) => {
    if (!name) return null;
    // Extract name from email address if present
    if (name.includes('@')) {
      const emailParts = name.split('@');
      const localPart = emailParts[0];
      // Convert email local part to display name (e.g., "admin@example.com" -> "Admin")
      return localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }
    return name;
  };

  const translateReason = (reason) => {
    if (!reason) return reason;
    if (reason === 'Initial document submission' || reason === 'operations board initial document submission') {
      return t('operations_board_initial_document_submission') || reason;
    }
    return reason;
  };

  const buildStatusEntry = (h, prefix = '') => {
    const fromId = typeof h.fromStatus === 'object' ? (h.fromStatus?.code || h.fromStatus?.nameEn) : h.fromStatus || h.oldStatus;
    const toId = typeof h.toStatus === 'object' ? (h.toStatus?.code || h.toStatus?.nameEn) : h.toStatus || h.newStatus;
    const fromMeta = resolveBoardStatusMeta(fromId || h.fromStatus, t, roleContext);
    const toMeta = resolveBoardStatusMeta(toId || h.toStatus, t, roleContext);
    const actorName = cleanActorName(h.actor?.displayName) || cleanActorName(h.changedByUser?.displayName) || cleanActorName(h.changedBy) || cleanActorName(h.actor);

    // Translate role names for Arabic
    let translatedActorName = actorName;
    if (lang === 'ar' && actorName) {
      if (actorName === 'Global Admin' || actorName === 'Super Admin') {
        translatedActorName = t('roles.super_admin') || 'مدير عام';
      } else if (actorName === 'Admin') {
        translatedActorName = t('roles.admin') || 'مدير';
      } else if (actorName === 'Instructor') {
        translatedActorName = t('roles.instructor') || 'مدرب';
      } else if (actorName === 'HR') {
        translatedActorName = t('roles.hr') || 'موارد بشرية';
      }
    }

    return {
      id: h.id || `${prefix}-${h.changedAt || h.createdAt || h.timestamp}`,
      type: 'status',
      actor: translatedActorName || t('operations_board_system_actor'),
      from: fromMeta.label,
      to: toMeta.label,
      fromColor: fromMeta.color,
      toColor: toMeta.color,
      at: h.createdAt || h.changedAt || h.timestamp,
      reason: translateReason(h.reason || h.comment || h.notes),
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

  if (card.type === 'attendance' && activityEntries.length === 0 && card.column !== NOT_TAKEN) {
    const recordActor = getLocalizedUserName(card.raw?.updater || card.raw?.creator, lang, null)
      || user?.displayName
      || user?.name
      || t('operations_board_system_actor');
    activityEntries.push({
      id: 'current-status',
      type: 'status',
      actor: recordActor,
      from: t('operations_board_lane_not_taken') || 'Not yet',
      to: statusLabel,
      fromColor: ATTENDANCE_BOARD_COLORS.NOT_TAKEN,
      toColor: statusColumn?.color || ATTENDANCE_BOARD_COLORS.PRESENT,
      at: card.raw?.updatedAt || card.raw?.createdAt || new Date().toISOString(),
    });
  }

  activityEntries = activityEntries.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
  activityEntries = filterActivityEntriesForHR(activityEntries, roleContext);

  const drawerTabs = [
    ...(!instructorViewer ? [{ key: 'activity', label: t('operations_board_tab_activity'), icon: Activity }] : []),
    ...(!instructorViewer && card.type === 'attendance'
      ? [{ key: 'profile', label: t('operations_board_tab_profile') || 'Profile', icon: User }]
      : !instructorViewer
        ? [{ key: 'details', label: t('operations_board_tab_details') || 'Details', icon: FileText }]
        : []),
    ...(!hrViewer ? [{ key: 'notes', label: t('operations_board_tab_notes'), icon: StickyNote }] : []),
    ...(card.type === 'attendance' && !hrViewer
      ? [{ key: 'participation', label: t('operations_board_participation') || 'Participation', icon: Award }]
      : []),
    ...(card.type === 'workflow'
      ? [
        ...(!hideNotesComments ? [{ key: 'comments', label: t('operations_board_tab_comments'), icon: MessageSquare }] : []),
        ...(card.classId && card.date && !hrViewer
          ? [{ key: 'participation', label: t('operations_board_participation') || 'Participation', icon: Award }]
          : []),
      ]
      : []),
  ];

  const validTab = drawerTabs.some((tb) => tb.key === tab);
  const effectiveTab = validTab ? tab : (drawerTabs[0]?.key || 'notes');

  const attendanceNoteEntries = attendanceNotesList
    .map((n) => ({
      ...n,
      at: n.at || card.raw?.updatedAt || card.raw?.createdAt,
    }))
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const participationTimelineEntries = participationList.map((p, idx) => ({
    id: p.id || `part-${idx}`,
    type: 'participation',
    actor: cleanActorName(p.creator?.displayName) || t('operations_board_system_actor'),
    text: p.descriptionEn || p.descriptionAr || p.notes || p.comment || t('operations_board_participation'),
    at: p.createdAt,
    dotColor: BOARD_PARTICIPATION_COLOR,
  })).sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const commentTimelineEntries = workflowCommentItems.map((c) => ({
    id: c.id,
    type: 'comment',
    actor: cleanActorName(c.author?.displayName) || cleanActorName(c.authorName) || t('operations_board_unknown_user'),
    text: c.comment || c.text,
    at: c.createdAt,
    dotColor: '#3b82f6',
  })).sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const noteTimelineEntries = workflowNoteItems.map((n) => ({
    id: n.id,
    type: 'note',
    actor: cleanActorName(n.author?.displayName) || cleanActorName(n.authorName) || t('operations_board_unknown_user'),
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
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          {card.type === 'attendance' ? (
            <BoardStudentAvatar name={studentName} profileImageUrl={card.profileImageUrl} size="sm" />
          ) : (
            <span
              className="inline-flex items-center justify-center rounded-full shrink-0"
              style={{
                width: 36,
                height: 36,
                backgroundColor: statusColumn ? `${statusColumn.color}14` : 'hsl(var(--muted))',
                color: statusColumn?.color || 'currentColor',
              }}
            >
              <FileText size={18} />
            </span>
          )}
          <Box sx={{ minWidth: 0, flex: 1, pt: 0.15 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.35 }}>
              <span className="text-xs font-semibold truncate">{displayTitle}</span>
              {card.type === 'attendance' && studentNumber && (
                <span className="text-[0.65rem] text-muted-foreground font-medium shrink-0">
                  {studentNumber}
                </span>
              )}
              {statusColumn && card.type === 'workflow' && (
                <span
                  className="inline-flex items-center gap-0.75 text-[0.65rem] font-semibold shrink-0"
                  style={{ color: statusColumn.color }}
                >
                  <WorkflowIcon size={10} aria-hidden />
                  {statusLabel}
                </span>
              )}
              {statusColumn && card.type === 'attendance' && (
                <span
                  className="inline-flex items-center gap-1 text-[0.65rem] font-semibold shrink-0"
                  style={{ color: statusColumn.color }}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: statusColumn.color }}
                    aria-hidden
                  />
                  {statusLabel}
                </span>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15 }}>
              {displayClassName && (
                <span className="text-[0.65rem] text-muted-foreground truncate">{displayClassName}</span>
              )}
              {card.date && (
                <span className="text-[0.65rem] text-muted-foreground">{formatBoardDate(card.date, lang)}</span>
              )}
              {card.type === 'workflow' && classInstructorName && (
                <span className="text-[0.65rem] text-muted-foreground">
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
            {card.fileId && !card.snapshotFileId && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-fit gap-2 px-3"
                onClick={handleGeneratePreview}
                disabled={previewLoading}
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
                    {previewLoading
                      ? (t('operations_board_generating') || 'Generating…')
                      : (t('operations_board_preview_pdf') || 'Preview PDF')}
                  </>
                )}
              </Button>
            )}
            {card.snapshotFileId && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-fit gap-2 px-3"
                onClick={handleGeneratePreview}
                data-testid="operations-board-preview-snapshot-toggle"
                style={{ borderColor: '#16a34a', color: '#16a34a' }}
              >
                <ShieldCheck size={16} />
                {pdfPreviewOpen ? (
                  <>
                    <EyeOff size={16} />
                    {t('operations_board_hide_snapshot') || 'Hide snapshot'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    {t('operations_board_view_approved_snapshot') || 'View Approved Snapshot'}
                  </>
                )}
              </Button>
            )}
          </Box>
        )}

        {card.type === 'workflow' && pdfPreviewOpen && (card.snapshotFileId || card.fileId) && (
          <Box sx={{ mb: 2 }}>
            <WorkflowPdfPreviewPanel
              fileId={card.snapshotFileId || card.fileId || undefined}
              blobUrl={(!card.snapshotFileId && !card.fileId) ? previewBlobUrl : undefined}
              generatedAt={(!card.snapshotFileId && !card.fileId) ? previewGeneratedAt : (card.raw?.file?.createdAt || card.createdAt || undefined)}
              isApproved={Boolean(card.snapshotFileId)}
              externalLoading={(!card.snapshotFileId && !card.fileId) ? previewLoading : false}
              fileName={card.snapshotFileId ? (card.snapshotFileName || (t('operations_board_approved_snapshot') || 'Approved Snapshot')) : (card.fileName || (t('operations_board_preview_pdf') || 'Preview PDF'))}
              open={pdfPreviewOpen}
              onClose={() => setPdfPreviewOpen(false)}
              t={t}
              compact
            />
          </Box>
        )}

        <Tabs
          value={effectiveTab}
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
          {drawerTabs.map(({ key, label, icon: Icon }) => (
            <Tab
              key={key}
              value={key}
              data-testid={`operations-board-drawer-tab-${key}`}
              label={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Icon size={12} />
                  {label}
                </span>
              }
              sx={{
                minHeight: 24,
                height: 24,
                textTransform: 'none',
                fontSize: '0.65rem',
                fontWeight: 600,
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: 'divider',
                px: 1,
                py: 0.25,
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

        {effectiveTab === 'activity' && (
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

        {effectiveTab === 'profile' && card.type === 'attendance' && (
          <Box sx={{ flex: 1, overflow: 'auto' }} data-testid="operations-board-profile">
            {(() => {
              const u = card.user || {};
              const profileRows = [
                { label: t('operations_board_profile_name') || 'Name', value: studentName },
                { label: t('operations_board_profile_name_ar') || 'Name (Arabic)', value: [u.firstNameAr, u.lastNameAr].filter(Boolean).join(' ') || null },
                { label: t('operations_board_profile_student_number') || 'Student Number', value: u.studentNumber || card.studentNumber || null },
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

        {effectiveTab === 'details' && card.type === 'workflow' && (
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

        {effectiveTab === 'notes' && (
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

        {effectiveTab === 'participation' && (card.type === 'attendance' || card.type === 'workflow') && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }} data-testid="operations-board-participation-panel">
            <Box sx={{ flex: 1, overflow: 'auto', pt: 1, mb: 2 }}>
              <DrawerTimeline
                entries={(card.type === 'workflow'
                  ? participationList
                  : participationList.filter((p) => String(p.userId) === String(card.userId))
                ).map((p, idx) => ({
                  id: p.id || `part-${idx}`,
                  type: 'participation',
                  actor: p.creator?.displayName || p.user?.displayName || t('operations_board_system_actor'),
                  text: p.descriptionEn || p.descriptionAr || p.notes || p.comment || t('operations_board_participation'),
                  at: p.createdAt,
                  dotColor: BOARD_PARTICIPATION_COLOR,
                }))}
                emptyMessage={t('operations_board_no_participation') || 'No participation records for this student.'}
                lang={lang}
              />
            </Box>
            {card.type === 'attendance' && (
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
            )}
          </Box>
        )}

        {effectiveTab === 'comments' && card.type === 'workflow' && (
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
