import React, { useState, useCallback, useEffect } from 'react';
import { Drawer } from '@ui';
import { Button } from '@/components/kibo/ui/button';
import { Badge } from '@/components/kibo/ui/badge';
import { Input } from '@/components/kibo/ui/input';
import { Tabs, Tab, Box } from '@mui/material';
import {
  moveAttendanceCard,
  markWorkflowAsTaken,
  fetchWorkflowHistory,
  fetchAttendanceHistory,
  addWorkflowBoardComment,
  ATTENDANCE_COLUMNS,
} from '@services/business/operationsBoardService.js';
import { getRecordHistory } from '@services/business/attendanceLogService.js';
import { useLang } from '@contexts/LangContext';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import {
  formatBoardDate,
  resolveBoardClassName,
  resolveBoardStudentName,
} from './operationsBoardDisplayUtils.js';
import { getAllowedAttendanceActions } from './attendanceBoardRules.js';

export default function BoardStudentDrawer({
  open,
  onClose,
  card,
  lane,
  onRefresh,
  roleContext = {},
}) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState('activity');
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(null);

  const loadDetail = useCallback(async () => {
    if (!card) return;
    setLoading(true);
    try {
      if (card.type === 'workflow') {
        const histResult = await fetchWorkflowHistory(card.rawId);
        if (histResult.success) {
          setHistory(histResult.data?.history || []);
          setComments(histResult.data?.comments || card.raw?.comments || []);
        }
      } else if (card.type === 'attendance') {
        setNotes(card.notes || '');
        if (card.rawId) {
          const [histResult, logResult] = await Promise.all([
            fetchAttendanceHistory(card.rawId),
            getRecordHistory(card.rawId),
          ]);
          if (histResult.success) setHistory(histResult.data || []);
          if (logResult.success) setAttendanceLog(logResult.data || []);
        } else {
          setHistory([]);
          setAttendanceLog([]);
        }
        setComments([]);
      }
    } catch (err) {
      console.error('BoardStudentDrawer:loadDetail:error', err);
    } finally {
      setLoading(false);
    }
  }, [card]);

  useEffect(() => {
    if (open && card) {
      setTab('activity');
      loadDetail();
    }
  }, [open, card, loadDetail]);

  const handleAttendanceStatus = async (statusId) => {
    if (!card || card.type !== 'attendance') return;
    setSavingStatus(statusId);
    try {
      const result = await moveAttendanceCard(
        card.rawId,
        statusId,
        notes || null,
        !card.rawId ? {
          userId: card.userId,
          classId: card.classId,
          date: card.date,
        } : null
      );
      if (result.success) {
        onRefresh?.();
        onClose();
      }
    } finally {
      setSavingStatus(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!card || card.type !== 'attendance') return;
    if (!card.rawId) {
      await moveAttendanceCard(null, card.column === 'NOT_TAKEN' ? 'PRESENT' : card.column, notes, {
        userId: card.userId,
        classId: card.classId,
        date: card.date,
      });
    } else {
      await moveAttendanceCard(card.rawId, card.column, notes);
    }
    onRefresh?.();
    loadDetail();
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !card || card.type !== 'workflow') return;
    const result = await addWorkflowBoardComment(card.rawId, newComment.trim());
    if (result.success) {
      setComments((prev) => [...prev, result.data?.comment || result.data]);
      setNewComment('');
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
  const statusColumn = (lane === 'attendance' ? ATTENDANCE_COLUMNS : []).find((c) => c.id === card.column);
  const statusLabel = statusColumn ? t(statusColumn.i18nKey) || statusColumn.name : card.column;
  const allowedActions = card.type === 'attendance' ? getAllowedAttendanceActions(roleContext) : [];

  const activityEntries = [
    ...history.map((h) => ({
      type: 'status',
      actor: h.actor?.displayName || h.changedByUser?.displayName || h.changedBy || t('operations_board_system_actor'),
      from: typeof h.fromStatus === 'object' ? (h.fromStatus?.code || h.fromStatus?.nameEn) : h.fromStatus || h.oldStatus,
      to: typeof h.toStatus === 'object' ? (h.toStatus?.code || h.toStatus?.nameEn) : h.toStatus || h.newStatus,
      at: h.createdAt || h.changedAt,
      reason: h.reason || h.comment || h.notes,
    })),
    ...comments.map((c) => ({
      type: 'comment',
      actor: c.author?.displayName || c.authorName || t('operations_board_unknown_user'),
      text: c.comment || c.text,
      at: c.createdAt,
    })),
    ...attendanceLog.map((log) => ({
      type: 'log',
      actor: log.changedByName || log.actorName || t('operations_board_system_actor'),
      from: typeof log.fromStatus === 'object' ? (log.fromStatus?.code || log.fromStatus?.nameEn) : log.fromStatus,
      to: typeof log.toStatus === 'object' ? (log.toStatus?.code || log.toStatus?.nameEn) : log.toStatus,
      at: log.changedAt || log.createdAt,
      reason: log.notes || log.reason,
    })),
  ].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      position={lang === 'ar' ? 'left' : 'right'}
      size="lg"
      resizable
      title={studentName}
      data-testid="operations-board-drawer"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {card.type === 'attendance' && (
            <BoardStudentAvatar name={studentName} profileImageUrl={card.profileImageUrl} size="lg" />
          )}
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Badge
                variant="outline"
                style={statusColumn ? { borderColor: statusColumn.color, color: statusColumn.color } : undefined}
              >
                {statusLabel}
              </Badge>
              {className && (
                <span className="text-sm text-muted-foreground">{className}</span>
              )}
              {card.date && (
                <span className="text-sm text-muted-foreground">{formatBoardDate(card.date, lang)}</span>
              )}
            </Box>
          </Box>
        </Box>

        {card.type === 'attendance' && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {allowedActions.map((col) => (
              <Button
                key={col.id}
                size="sm"
                variant={card.column === col.id ? 'default' : 'outline'}
                disabled={savingStatus != null}
                onClick={() => handleAttendanceStatus(col.id)}
                className="gap-2"
                data-testid={`operations-board-set-status-${col.id}`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                {t(col.i18nKey) || col.name}
              </Button>
            ))}
          </Box>
        )}

        {card.type === 'workflow' && card.status === 'DRAFT' && (
          <Button size="sm" onClick={handleMarkTaken} data-testid="operations-board-mark-taken">
            {t('operations_board_mark_taken')}
          </Button>
        )}

        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth">
          <Tab value="activity" label={t('operations_board_tab_activity')} data-testid="operations-board-drawer-tab-activity" />
          <Tab value="profile" label={t('operations_board_tab_profile') || 'Profile'} data-testid="operations-board-drawer-tab-profile" />
          <Tab value="notes" label={t('operations_board_tab_notes')} data-testid="operations-board-drawer-tab-notes" />
          {card.type === 'workflow' && (
            <Tab value="comments" label={t('operations_board_tab_comments')} data-testid="operations-board-drawer-tab-comments" />
          )}
        </Tabs>

        {tab === 'activity' && (
          <Box sx={{ flex: 1, overflow: 'auto' }} data-testid="operations-board-activity-feed">
            {loading ? (
              <p className="text-sm text-muted-foreground">{t('operations_board_loading')}</p>
            ) : activityEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('operations_board_no_activity')}</p>
            ) : (
              activityEntries.map((entry, idx) => (
                <div key={idx} className="mb-3 rounded-lg border border-border bg-muted/20 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{entry.actor}</span>
                    {entry.at && (
                      <span className="text-xs text-muted-foreground">
                        {formatBoardDate(entry.at, lang)}
                      </span>
                    )}
                  </div>
                  {entry.type === 'status' && (
                    <p className="mt-1 text-muted-foreground">{entry.from || '—'} → {entry.to || '—'}</p>
                  )}
                  {entry.text && <p className="mt-1">{entry.text}</p>}
                  {entry.reason && <p className="mt-1 text-muted-foreground">{entry.reason}</p>}
                </div>
              ))
            )}
          </Box>
        )}

        {tab === 'profile' && (
          <Box sx={{ flex: 1, overflow: 'auto' }} data-testid="operations-board-profile">
            {(() => {
              const u = card.user || {};
              const profileRows = [
                { label: t('operations_board_profile_name') || 'Name', value: studentName },
                { label: t('operations_board_profile_name_ar') || 'Name (Arabic)', value: [u.firstNameAr, u.lastNameAr].filter(Boolean).join(' ') || null },
                { label: t('operations_board_profile_student_number') || 'Student Number', value: u.studentNumber || card.studentNumber || null },
                { label: t('operations_board_profile_email') || 'Email', value: u.email || null },
                { label: t('operations_board_profile_rank') || 'Rank', value: (lang === 'ar' ? u.rankAr : u.rankEn) || null },
                { label: t('operations_board_profile_display_name') || 'Display Name', value: (lang === 'ar' ? u.displayNameAr : u.displayName) || null },
                { label: t('operations_board_profile_sequence') || 'Sequence', value: u.sequence != null ? String(u.sequence) : (card.sequence != null ? String(card.sequence) : null) },
              ];
              return (
                <div className="flex flex-col gap-3">
                  {profileRows.map((row, idx) => (
                    row.value ? (
                      <div key={idx} className="flex flex-col gap-0.5 border-b border-border pb-2">
                        <span className="text-xs text-muted-foreground">{row.label}</span>
                        <span className="text-sm font-medium">{row.value}</span>
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

        {tab === 'notes' && (
          <Box>
            <textarea
              className="min-h-[140px] w-full rounded-md border border-input bg-background p-3 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('operations_board_card_notes')}
              data-testid="operations-board-notes-input"
            />
            <Button size="sm" className="mt-2" onClick={handleSaveNotes}>
              {t('operations_board_note_save')}
            </Button>
          </Box>
        )}

        {tab === 'comments' && card.type === 'workflow' && (
          <Box>
            <div className="mb-3 flex flex-col gap-2">
              {comments.map((c, idx) => (
                <div key={idx} className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                  <p>{c.comment || c.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('operations_board_card_add_comment')}
                data-testid="operations-board-comment-input"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
              />
              <Button size="sm" onClick={handleAddComment}>{t('operations_board_note_save')}</Button>
            </div>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
