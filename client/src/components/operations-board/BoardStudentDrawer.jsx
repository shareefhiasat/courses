import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from '@ui';
import { Button } from '@/components/kibo/ui/button';
import { Input } from '@/components/kibo/ui/input';
import { Tabs, Tab, Box } from '@mui/material';
import {
  moveAttendanceCard,
  fetchWorkflowHistory,
  fetchAttendanceHistory,
  addWorkflowBoardComment,
  ATTENDANCE_BOARD_LANES,
} from '@services/business/operationsBoardService.js';
import { getLectureLog } from '@services/business/attendanceLogService.js';
import LectureLogDrawer from '@components/workspace/LectureLogDrawer.jsx';
import { getParticipationsByClassAndDate, createParticipation } from '@services/business/participationService.js';
import {
  shouldHideAttendancePrivacyTabs,
  shouldHideNotesCommentsOnly,
  filterActivityEntriesForHR,
  isHROnlyViewer,
  isInstructorOnlyViewer,
  canViewParticipation,
} from './hrAttendancePrivacy.js';
import {
  CARD_TYPE,
  ACTIVITY_TYPE,
  COMMENT_ACTION,
  DRAWER_TAB,
  LECTURE_LOG_TYPE,
} from './operationsBoardConstants.js';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { getDateGroup, getGroupLabel } from '@utils/notificationHelpers.js';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import {
  formatBoardDate,
  resolveBoardClassName,
  resolveBoardStudentName,
  parseWorkflowCardName,
} from './operationsBoardDisplayUtils.js';
import {
  resolveCardStatus,
} from './operationsBoardStatusUtils.js';
import {
  buildStatusEntry,
  cleanActorName,
  parseAttendanceNotesList,
  normalizeSavedWorkflowComment,
  buildOptimisticComment,
} from './operationsBoardHistoryUtils.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { getUserRoleColor, getUserRoleIcon } from '@constants/iconTypes';
import { ROLE_STRINGS, resolveUserRole } from '@utils/userUtils';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import DriveUserAvatar from '@components/ui/DriveTimeline/DriveUserAvatar.jsx';
import GridQuickFilterChips from '@components/ui/GridQuickFilterChips';
import WorkflowPdfPreviewPanel from './WorkflowPdfPreviewPanel.jsx';
import { exportDailyOfficialForDate } from '@services/business/accessScopeExportService.js';
import { getClasses } from '@services/business/classService.js';
import { getSubjects } from '@services/business/programService.js';
import { createDM } from '@services/business/chatService.js';
import {
  FileText, X, Eye, EyeOff, CheckCircle2, ShieldCheck, Pencil,
  Activity, StickyNote, MessageSquare, Award, Workflow as WorkflowIcon, Search,
  ChevronDown, ChevronUp,
} from '@constants/iconTypes';
import { formatDateTime, getQatarDateParts } from '@utils/date-formatter.js';
import { ATTENDANCE_BOARD_COLORS, BOARD_PARTICIPATION_COLOR } from '@constants/workspaceStatusColors.js';
import { getLocalizedNoteText } from '@constants/noteTypes';
import { getWorkflowStatusColor } from '@constants/workspaceStatusColors.js';
import { getAttendanceColor } from '@constants/attendanceTypes.js';

const { PRESENT, LATE, ABSENT, EXCUSED, HUMAN_CASE, NOT_TAKEN } = ATTENDANCE_BOARD_LANES;

function matchesDateFilter(entry, filterKey) {
  if (filterKey === 'all') return true;
  const nowParts = getQatarDateParts(new Date());
  if (!nowParts) return true;
  const today = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day);
  const oneDay = 24 * 60 * 60 * 1000;
  const days = { last7days: 7, last14days: 14, last30days: 30 }[filterKey];
  const startOffset = filterKey === 'yesterday' ? 1 : days ? days - 1 : 0;
  const start = today - startOffset * oneDay;
  const ts = entry.at ? new Date(entry.at) : null;
  const entryParts = ts ? getQatarDateParts(ts) : null;
  if (!entryParts) return false;
  const entryDay = Date.UTC(entryParts.year, entryParts.month - 1, entryParts.day);
  if (filterKey === 'yesterday') return entryDay === start;
  return entryDay >= start && entryDay <= today;
}

function DrawerTimeline({ entries, emptyMessage, t, lang }) {
  const { user: currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filterOptions = useMemo(() => [
    { key: 'today', label: t('today') || 'Today' },
    { key: 'yesterday', label: t('yesterday') || 'Yesterday' },
    { key: 'last7days', label: `7 ${t('common.days') || 'days'}` },
    { key: 'last14days', label: `14 ${t('common.days') || 'days'}` },
    { key: 'last30days', label: `30 ${t('common.days') || 'days'}` },
    { key: 'all', label: t('all') || 'All' },
  ], [t]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return entries
      .filter((e) => matchesDateFilter(e, dateFilter))
      .filter((e) => {
        if (!term) return true;
        const hay = [
          e.actor,
          e.from,
          e.to,
          e.text,
          e.reason,
          e.documentTitle,
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(term);
      });
  }, [entries, dateFilter, searchTerm]);

  const groups = useMemo(() => {
    const byGroup = {};
    filtered.forEach((entry) => {
      const key = getDateGroup(entry.at);
      byGroup[key] = byGroup[key] || [];
      byGroup[key].push(entry);
    });
    Object.values(byGroup).forEach((list) => {
      list.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
    });
    const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
    return Object.entries(byGroup).sort(([a], [b]) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [filtered]);

  const counts = useMemo(() => {
    const c = {};
    filterOptions.forEach((f) => {
      c[f.key] = entries.filter((e) => matchesDateFilter(e, f.key)).length;
    });
    return c;
  }, [entries, filterOptions]);

  const dateFilterChips = useMemo(() => filterOptions.map((f) => ({
    id: f.key,
    label: f.label,
    count: counts[f.key] || 0,
    color: '#800020',
  })), [filterOptions, counts]);

  const cardStyle = useMemo(() => ({
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
    background: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
    marginBottom: '6px',
  }), [isDark]);

  const groupHeaderStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: '8px',
    gap: '6px',
  }), []);

  const actorRoleFor = (entry) => (entry.actorUser || entry.user ? resolveUserRole(entry.actorUser || entry.user) : null);
  const actorRoleColorFor = (entry) => {
    const role = actorRoleFor(entry);
    return role ? getUserRoleColor(role) : null;
  };
  const showRoleLabelFor = (entry) => {
    const role = actorRoleFor(entry);
    return role && (role === ROLE_STRINGS.ADMIN || role === ROLE_STRINGS.SUPER_ADMIN || role === ROLE_STRINGS.HR || role === ROLE_STRINGS.INSTRUCTOR);
  };

  const valueStyle = useMemo(() => ({
    fontSize: '14px',
    color: isDark ? '#f1f5f9' : '#1e293b',
    fontWeight: 500,
  }), [isDark]);

  const renderLogActor = (entry) => {
    const actor = entry.actorUser || entry.user;
    const displayName = actor
      ? getLocalizedUserName(actor, lang, entry.actor)
      : (entry.actor || '—');
    const canMessage = actor && actor.id && currentUser?.id && String(actor.id) !== String(currentUser.id);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span style={{ transform: 'scale(0.72)', transformOrigin: 'center', flexShrink: 0, lineHeight: 0 }}>
          <DriveUserAvatar
            user={actor || { displayName, profileImageUrl: entry.actorImage }}
            displayName={displayName}
            size="sm"
            showRoleBadge={false}
          />
        </span>
        {showRoleLabelFor(entry) && (
          <ColoredTooltip title={actorRoleFor(entry)} color={actorRoleColorFor(entry)} placement="top">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18,
                height: 18,
                borderRadius: 4,
                background: `${actorRoleColorFor(entry)}22`,
                color: actorRoleColorFor(entry),
              }}
            >
              {React.cloneElement(getUserRoleIcon(actorRoleFor(entry)), { size: 12, color: actorRoleColorFor(entry) })}
            </span>
          </ColoredTooltip>
        )}
        <span style={{ ...valueStyle, fontSize: '12px', fontWeight: 600 }}>{displayName}</span>
        {canMessage && (
          <ColoredTooltip title={t('message_user') || 'Message'} placement="top">
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const result = await createDM(actor.id);
                  if (result.success && result.data?.id) {
                    window.open(`/chat?dest=dm:${result.data.id}`, '_blank', 'noopener,noreferrer');
                  }
                } catch (err) {
                  console.error('Failed to message user', err);
                }
              }}
              style={{
                marginInlineStart: '0.15rem',
                padding: '0.1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                color: 'var(--color-primary, #3b82f6)',
              }}
            >
              <MessageSquare size={12} />
            </button>
          </ColoredTooltip>
        )}
      </span>
    );
  };

  const renderStatusTransition = (entry) => {
    const fromTextColor = entry.fromRoleColor || entry.fromColor || '#9ca3af';
    const toTextColor = entry.toRoleColor || entry.toColor || '#3b82f6';
    const arrowColor = isDark ? '#6b7280' : '#9ca3af';
    if (isRTL) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', direction: 'rtl' }}>
          <span style={{ color: fromTextColor }}>{entry.from || '—'}</span>
          <span style={{ color: arrowColor }}>←</span>
          <span style={{ color: toTextColor }}>{entry.to || '—'}</span>
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ color: fromTextColor }}>{entry.from || '—'}</span>
        <span style={{ color: arrowColor }}>→</span>
        <span style={{ color: toTextColor }}>{entry.to || '—'}</span>
      </span>
    );
  };

  const renderEntryCard = (entry, idx) => {
    const isWorkflow = entry.type === ACTIVITY_TYPE.STATUS;
    const iconColor = entry.toColor || entry.dotColor || '#3b82f6';
    const titleNode = isWorkflow
      ? renderStatusTransition(entry)
      : (entry.text || '—');
    return (
      <motion.div
        key={entry.id || idx}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: idx * 0.03 }}
        style={cardStyle}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{
            flexShrink: 0,
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
          }}>
            {isWorkflow ? (
              <WorkflowIcon size={14} color={iconColor} strokeWidth={2.5} />
            ) : (
              <span style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: iconColor,
                flexShrink: 0,
              }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: iconColor,
              }}>
                {titleNode}
              </span>
              <span style={{
                fontSize: '11px',
                color: isDark ? '#6b7280' : '#9ca3af',
              }}>
                {entry.at ? formatDateTime(entry.at, lang) : ''}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '2px' }}>
              {renderLogActor(entry)}
            </div>
            {entry.reason && (
              <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                "{getLocalizedNoteText(entry.reason, t)}"
              </div>
            )}
            {isWorkflow && entry.documentTitle && (
              <div style={{ fontSize: '11px', color: isDark ? '#6b7280' : '#9ca3af', marginTop: '2px' }}>
                {entry.documentTitle}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div style={{ padding: '12px', overflow: 'auto', height: '100%' }}>
      {entries.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          padding: '6px 10px',
          borderRadius: '8px',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
        }}>
          <Search size={14} style={{ color: isDark ? '#94a3b8' : '#800020' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search') || 'Search...'}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '13px',
              color: isDark ? '#f1f5f9' : '#1e293b',
            }}
          />
        </div>
      )}
      {entries.length > 0 && (
        <GridQuickFilterChips
          chips={dateFilterChips}
          activeId={dateFilter}
          onChange={setDateFilter}
          style={{ marginBottom: '12px' }}
        />
      )}
      <div>
        {groups.map(([groupKey, items]) => (
          <div key={groupKey} style={{ marginBottom: '12px' }}>
            <div style={groupHeaderStyle}>
              <GridQuickFilterChips
                chips={[
                  {
                    id: groupKey,
                    label: getGroupLabel(groupKey, t),
                    count: items.length,
                    color: isDark ? '#94a3b8' : '#64748b',
                  },
                ]}
                activeId="all"
                onChange={() => {}}
              />
            </div>
            <AnimatePresence initial={false}>
              {items.map((entry, idx) => renderEntryCard(entry, idx))}
            </AnimatePresence>
          </div>
        ))}
      </div>
      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">{t('no_matching_entries') || 'No matching entries'}</p>
      )}
    </div>
  );
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
  initialTab = null,
  view = 'kanban',
  embedded = false,
}) {
  const { t, lang, isRTL } = useLang();
  const { user } = useAuth();
  const [tab, setTab] = useState('notes');
  const [activityExpanded, setActivityExpanded] = useState(true);
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
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [participationList, setParticipationList] = useState([]);
  const [attendanceNotesList, setAttendanceNotesList] = useState([]);

  const loadDetail = useCallback(async ({ silent = false } = {}) => {
    if (!card) return;
    if (!silent) setLoading(true);
    try {
      if (card.type === CARD_TYPE.WORKFLOW) {
        const histResult = await fetchWorkflowHistory(card.rawId);
        if (histResult.success) {
          setHistory(histResult.data?.history || []);
          setComments(histResult.data?.comments || card.raw?.comments || []);
        }
        if (card.classId && card.date && canViewParticipation(roleContext)) {
          const partResult = await getParticipationsByClassAndDate(card.classId, card.date);
          if (partResult?.success && partResult.data) {
            setParticipationList(partResult.data);
          } else {
            setParticipationList([]);
          }
        } else {
          setParticipationList([]);
        }
      } else if (card.type === CARD_TYPE.ATTENDANCE) {
        setNotes(card.notes || '');
        const fetches = [];
        if (card.rawId) {
          fetches.push(fetchAttendanceHistory(card.rawId));
        }
        if (card.classId && card.date) {
          fetches.push(getLectureLog(card.classId, card.date));
          if (canViewParticipation(roleContext)) {
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
              (e) => e.type === LECTURE_LOG_TYPE.ATTENDANCE_STATUS_CHANGE
                && String(e.userId) === String(card.userId),
            );
            setLectureLogEntries(studentLog);
          } else {
            setLectureLogEntries([]);
          }
          if (canViewParticipation(roleContext)) {
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
        ? (card.type === CARD_TYPE.ATTENDANCE ? DRAWER_TAB.NOTES : (card.classId && card.date ? DRAWER_TAB.PARTICIPATION : DRAWER_TAB.NOTES))
        : DRAWER_TAB.NOTES;
      setTab(initialTab || defaultTab);
      setActivityExpanded(true);
      setPdfPreviewOpen(false);
      setPreviewBlobUrl(null);
      setPreviewGeneratedAt(null);
      setPreviewFileName('');
      setNotes(card.type === CARD_TYPE.ATTENDANCE ? (card.notes || '') : '');
      setNewComment('');
      setNewParticipationNote('');
      setAttendanceNotesList(parseAttendanceNotesList(card.notes, user?.displayName || user?.name, user));
      loadDetail();
    }
  }, [open, card, card?.id, card?.type, card?.classId, card?.date, card?.notes, loadDetail, user?.displayName, user?.name, initialTab, instructorViewer]);

  const handleGeneratePreview = useCallback(async () => {
    if (!card || card.type !== CARD_TYPE.WORKFLOW) return;
    if (card.snapshotFileId || (card.fileId && String(card.column).toUpperCase() !== 'DRAFT')) {
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
        workflowStatus: card.column,
        approvedBy: card.approvedBy || null,
        approvedAt: card.approvedAt || null,
        skipDownload: true,
        skipPersist: true,
      });
      if (result?.blob) {
        const url = URL.createObjectURL(result.blob);
        setPreviewBlobUrl(url);
        setPreviewGeneratedAt(new Date().toLocaleString());
        setPreviewFileName(result.filename || '');
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
    if (card.type === CARD_TYPE.WORKFLOW) {
      const text = notes.trim();
      const result = await addWorkflowBoardComment(card.rawId, text, COMMENT_ACTION.NOTE);
      if (result.success) {
        const saved = normalizeSavedWorkflowComment(result.data, buildOptimisticComment(text, user, COMMENT_ACTION.NOTE));
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
    if (!newComment.trim() || !card || card.type !== CARD_TYPE.WORKFLOW) return;
    const text = newComment.trim();
    const result = await addWorkflowBoardComment(card.rawId, text, COMMENT_ACTION.COMMENT);
    if (result.success) {
      const saved = normalizeSavedWorkflowComment(result.data, buildOptimisticComment(text, user, COMMENT_ACTION.COMMENT));
      setComments((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
      setNewComment('');
      loadDetail({ silent: true });
      onActionBanner?.({
        message: t('operations_board_comment_added', { name: resolveBoardStudentName(card, lang) }),
      });
    }
  };

  const handleAddParticipation = async () => {
    if (!newParticipationNote.trim() || !card || card.type !== CARD_TYPE.ATTENDANCE) return;
    if (!canViewParticipation(roleContext)) return;
    setSavingParticipation(true);
    try {
      const text = newParticipationNote.trim();
      const result = await createParticipation({
        userId: card.userId,
        classId: card.classId,
        programId: card.programId,
        subjectId: card.subjectId,
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
  const workflowNameParts = card.type === CARD_TYPE.WORKFLOW ? parseWorkflowCardName(card.name) : [];
  let workflowTitle = workflowNameParts[0] || studentName;
  if (lang === 'ar' && workflowTitle && workflowTitle.includes('Daily Attendance')) {
    workflowTitle = workflowTitle.replace(/Daily Attendance/g, t('operations_board_daily_attendance') || 'حضور يومي');
  }
  const displayTitle = card.type === CARD_TYPE.WORKFLOW ? workflowTitle : studentName;
  const displayClassName = className;
  const studentNumber = card.studentNumber || card.user?.studentNumber || null;
  const classInstructorName = card.classInstructorName || null;
  const isClassInstructor = Boolean(
    card.classInstructorId && user?.dbId && String(card.classInstructorId) === String(user.dbId),
  );
  const instructorDisplay = isClassInstructor
    ? (t('operations_board_you') || 'You')
    : classInstructorName;

  const workflowCommentItems = comments.filter((c) => !c.action || c.action === COMMENT_ACTION.COMMENT);
  const workflowNoteItems = comments.filter((c) => c.action === COMMENT_ACTION.NOTE);

  const { displayColumn, statusColumn, statusLabel } = resolveCardStatus(card, t, roleContext);

  const hidePrivacyTabs = shouldHideAttendancePrivacyTabs(roleContext);
  const hideNotesComments = shouldHideNotesCommentsOnly(roleContext);
  const hrViewer = isHROnlyViewer(roleContext);

  const workflowDocumentTitle = card.type === CARD_TYPE.WORKFLOW
    ? (card.name || `${workflowTitle} — ${displayClassName} — ${card.date ? formatBoardDate(card.date, lang) : ''}`)
    : (card.name || '');

  const statusEntryOptions = { t, lang, roleContext };

  let activityEntries = [
    ...history.map((h) => buildStatusEntry(h, 'hist', workflowDocumentTitle, statusEntryOptions)),
    ...lectureLogEntries.map((e, idx) => buildStatusEntry({
      ...e,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      changedAt: e.timestamp,
      id: `lec-${idx}`,
    }, 'lec', workflowDocumentTitle, statusEntryOptions)),
    ...participationList.map((p, idx) => ({
      id: p.id || `part-${idx}`,
      type: ACTIVITY_TYPE.PARTICIPATION,
      actor: p.creator?.displayName || t('operations_board_system_actor'),
      actorImage: p.creator?.profileImageUrl,
      actorUser: p.creator || null,
      text: p.descriptionEn || p.descriptionAr || p.notes || p.comment || t('operations_board_participation'),
      at: p.createdAt,
      dotColor: BOARD_PARTICIPATION_COLOR,
    })),
  ];

  if (card.type === CARD_TYPE.ATTENDANCE && activityEntries.length === 0 && card.column !== NOT_TAKEN) {
    const recordActor = getLocalizedUserName(card.raw?.updater || card.raw?.creator, lang, null)
      || user?.displayName
      || user?.name
      || t('operations_board_system_actor');
    const recordActorUser = card.raw?.updater || card.raw?.creator || null;
    const recordActorImage = recordActorUser?.profileImageUrl || user?.profileImageUrl || null;
    activityEntries.push({
      id: 'current-status',
      type: ACTIVITY_TYPE.STATUS,
      actor: recordActor,
      actorImage: recordActorImage,
      actorUser: recordActorUser,
      documentTitle: workflowDocumentTitle,
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
    ...(!hrViewer ? [{ key: DRAWER_TAB.NOTES, label: t('operations_board_tab_notes'), icon: StickyNote }] : []),
    ...(card.type === CARD_TYPE.ATTENDANCE && canViewParticipation(roleContext)
      ? [{ key: DRAWER_TAB.PARTICIPATION, label: t('operations_board_participation') || 'Participation', icon: Award }]
      : []),
    ...(card.type === CARD_TYPE.WORKFLOW
      ? [
        ...(!hideNotesComments ? [{ key: DRAWER_TAB.COMMENTS, label: t('operations_board_tab_comments'), icon: MessageSquare }] : []),
        ...(card.classId && card.date && canViewParticipation(roleContext)
          ? [{ key: DRAWER_TAB.PARTICIPATION, label: t('operations_board_participation') || 'Participation', icon: Award }]
          : []),
      ]
      : []),
  ];

  const validTab = drawerTabs.some((tb) => tb.key === tab);
  const effectiveTab = validTab ? tab : (drawerTabs[0]?.key || DRAWER_TAB.NOTES);

  const attendanceNoteEntries = attendanceNotesList
    .map((n) => ({
      ...n,
      at: n.at || card.raw?.updatedAt || card.raw?.createdAt,
    }))
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const participationTimelineEntries = participationList.map((p, idx) => ({
    id: p.id || `part-${idx}`,
    type: ACTIVITY_TYPE.PARTICIPATION,
    actor: cleanActorName(p.creator?.displayName) || t('operations_board_system_actor'),
    actorImage: p.creator?.profileImageUrl,
    actorUser: p.creator || null,
    text: p.descriptionEn || p.descriptionAr || p.notes || p.comment || t('operations_board_participation'),
    at: p.createdAt,
    dotColor: BOARD_PARTICIPATION_COLOR,
  })).sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const commentTimelineEntries = workflowCommentItems.map((c) => ({
    id: c.id,
    type: ACTIVITY_TYPE.COMMENT,
    actor: cleanActorName(c.author?.displayName) || cleanActorName(c.authorName) || t('operations_board_unknown_user'),
    actorImage: c.author?.profileImageUrl,
    actorUser: c.author || null,
    text: c.comment || c.text,
    at: c.createdAt,
    dotColor: '#3b82f6',
  })).sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const noteTimelineEntries = workflowNoteItems.map((n) => ({
    id: n.id,
    type: ACTIVITY_TYPE.NOTE,
    actor: cleanActorName(n.author?.displayName) || cleanActorName(n.authorName) || t('operations_board_unknown_user'),
    actorImage: n.author?.profileImageUrl,
    actorUser: n.author || null,
    text: n.comment || n.text,
    at: n.createdAt,
    dotColor: '#f59e0b',
  })).sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const workflowAttendanceNoteEntries = (card.attendanceNotes || [])
    .filter(Boolean)
    .map((text, idx) => ({
      id: `workflow-att-note-${idx}`,
      type: ACTIVITY_TYPE.NOTE,
      actor: t('operations_board_attendance_notes') || 'Attendance notes',
      text,
      at: card.raw?.updatedAt || card.raw?.createdAt || card.date,
      dotColor: '#f59e0b',
    }))
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const combinedWorkflowNoteEntries = [...workflowAttendanceNoteEntries, ...noteTimelineEntries]
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header: avatar / doc icon + title + meta + close */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          {card.type === CARD_TYPE.ATTENDANCE ? (
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
              {card.type === CARD_TYPE.ATTENDANCE && studentNumber && (
                <span className="text-[0.65rem] text-muted-foreground font-medium shrink-0">
                  {studentNumber}
                </span>
              )}
              {statusColumn && card.type === CARD_TYPE.WORKFLOW && (
                <span
                  className="inline-flex items-center gap-0.75 text-[0.65rem] font-semibold shrink-0"
                  style={{ color: statusColumn.color }}
                >
                  <WorkflowIcon size={10} aria-hidden />
                  {statusLabel}
                </span>
              )}
              {statusColumn && card.type === CARD_TYPE.ATTENDANCE && (
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
              {card.type === CARD_TYPE.WORKFLOW && classInstructorName && (
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

        {card.type === CARD_TYPE.WORKFLOW && (
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

        {card.type === CARD_TYPE.WORKFLOW && pdfPreviewOpen && (card.snapshotFileId || card.fileId || String(card.column).toUpperCase() === 'DRAFT') && (
          <Box sx={{ mb: 2 }}>
            <WorkflowPdfPreviewPanel
              fileId={card.snapshotFileId || (card.fileId && String(card.column).toUpperCase() !== 'DRAFT' ? card.fileId : undefined)}
              blobUrl={(!card.snapshotFileId && (!card.fileId || String(card.column).toUpperCase() === 'DRAFT')) ? previewBlobUrl : undefined}
              generatedAt={(!card.snapshotFileId && (!card.fileId || String(card.column).toUpperCase() === 'DRAFT')) ? previewGeneratedAt : (card.raw?.file?.createdAt || card.createdAt || undefined)}
              isApproved={String(card.column || '').toUpperCase() === 'APPROVED'}
              externalLoading={(!card.snapshotFileId && (!card.fileId || String(card.column).toUpperCase() === 'DRAFT')) ? previewLoading : false}
              fileName={card.snapshotFileId ? (card.snapshotFileName || (t('operations_board_approved_snapshot') || 'Approved Snapshot')) : (previewFileName || card.fileName || (t('operations_board_preview_pdf') || 'Preview PDF'))}
              open={pdfPreviewOpen}
              onClose={() => setPdfPreviewOpen(false)}
              t={t}
              compact
            />
          </Box>
        )}

        {/* Activity pane — expandable / collapsible */}
        <Box sx={{ flexShrink: 0, mb: 1 }} data-testid="operations-board-activity-pane">
          <button
            onClick={() => setActivityExpanded((v) => !v)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.5rem',
              background: 'transparent',
              border: '1px solid',
              borderColor: 'var(--border, #e5e7eb)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--text-secondary, #64748b)',
              textTransform: 'none',
            }}
            data-testid="operations-board-activity-toggle"
          >
            <Activity size={14} />
            <span>{t('operations_board_tab_activity') || 'Activity'}</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.6rem', opacity: 0.7 }}>
              {activityEntries.length}
            </span>
            {activityExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {activityExpanded && (
            <Box
              sx={{
                mt: 0.5,
                maxHeight: '40vh',
                overflow: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '0.375rem',
                position: 'relative',
              }}
              data-testid="operations-board-activity-feed"
            >
              {card.type === CARD_TYPE.ATTENDANCE ? (
                <LectureLogDrawer
                  isOpen
                  embedded
                  onClose={() => {}}
                  classInfo={{
                    id: card.classId,
                    nameEn: card.classNameEn || card.class?.nameEn || card.className || displayClassName || '',
                    nameAr: card.classNameAr || card.class?.nameAr || card.className || displayClassName || '',
                    code: card.classCode || card.class?.code || displayClassName || card.className || '',
                  }}
                  date={card.date}
                  studentId={card.userId}
                />
              ) : (
                <DrawerTimeline
                  entries={activityEntries.map((entry) => ({
                    ...entry,
                    dotColor: entry.dotColor
                      || (entry.type === ACTIVITY_TYPE.PARTICIPATION ? BOARD_PARTICIPATION_COLOR
                        : entry.type === ACTIVITY_TYPE.STATUS ? (entry.toColor || '#94a3b8') : '#3b82f6'),
                  }))}
                  emptyMessage={t('operations_board_no_activity')}
                  t={t}
                  lang={lang}
                />
              )}
            </Box>
          )}
        </Box>

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

        {effectiveTab === DRAWER_TAB.NOTES && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }} data-testid="operations-board-notes-panel">
            <Box sx={{ flex: 1, overflow: 'auto', pt: 1, mb: 2 }}>
              {card.type === CARD_TYPE.WORKFLOW ? (
                <DrawerTimeline
                  entries={combinedWorkflowNoteEntries}
                  emptyMessage={t('operations_board_no_notes') || 'No notes yet.'}
                  t={t}
                  lang={lang}
                />
              ) : (
                <DrawerTimeline
                  entries={attendanceNoteEntries}
                  emptyMessage={t('operations_board_no_notes') || 'No notes yet.'}
                  t={t}
                  lang={lang}
                />
              )}
            </Box>
            {card.type === CARD_TYPE.ATTENDANCE && (
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
            )}
          </Box>
        )}

        {effectiveTab === DRAWER_TAB.PARTICIPATION && (card.type === CARD_TYPE.ATTENDANCE || card.type === CARD_TYPE.WORKFLOW) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }} data-testid="operations-board-participation-panel">
            <Box sx={{ flex: 1, overflow: 'auto', pt: 1, mb: 2 }}>
              <DrawerTimeline
                entries={(card.type === CARD_TYPE.WORKFLOW
                  ? participationList
                  : participationList.filter((p) => String(p.userId) === String(card.userId))
                ).map((p, idx) => ({
                  id: p.id || `part-${idx}`,
                  type: ACTIVITY_TYPE.PARTICIPATION,
                  actor: p.creator?.displayName || p.user?.displayName || t('operations_board_system_actor'),
                  actorImage: p.creator?.profileImageUrl || p.user?.profileImageUrl,
                  actorUser: p.creator || p.user || null,
                  text: p.descriptionEn || p.descriptionAr || p.notes || p.comment || t('operations_board_participation'),
                  at: p.createdAt,
                  dotColor: BOARD_PARTICIPATION_COLOR,
                }))}
                emptyMessage={t('operations_board_no_participation') || 'No participation records for this student.'}
                t={t}
                lang={lang}
              />
            </Box>
            {card.type === CARD_TYPE.ATTENDANCE && (
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

        {effectiveTab === DRAWER_TAB.COMMENTS && card.type === CARD_TYPE.WORKFLOW && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ flex: 1, overflow: 'auto', pt: 1, mb: 2 }}>
              <DrawerTimeline
                entries={commentTimelineEntries}
                emptyMessage={t('operations_board_no_comments') || 'No comments yet.'}
                t={t}
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
  );

  if (embedded) {
    return drawerContent;
  }

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
      {drawerContent}
    </Drawer>
  );
}
