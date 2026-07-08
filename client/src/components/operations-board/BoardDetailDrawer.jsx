import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/kibo/ui/dialog';
import { Button } from '@/components/kibo/ui/button';
import { Badge } from '@/components/kibo/ui/badge';
import { ScrollArea } from '@/components/kibo/ui/scroll-area';
import { Input } from '@/components/kibo/ui/input';
import { Box, Tab, Tabs, TextField } from '@mui/material';
import {
  fetchWorkflowHistory,
  fetchAttendanceHistory,
  addWorkflowBoardComment,
  moveAttendanceCard,
  markWorkflowAsTaken,
  ATTENDANCE_COLUMNS,
} from '@services/business/operationsBoardService.js';
import { useLang } from '@contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import {
  formatBoardDate,
  resolveBoardClassName,
  resolveBoardStudentName,
} from './operationsBoardDisplayUtils.js';

export default function BoardDetailDrawer({ open, onOpenChange, card, lane, onRefresh }) {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [tab, setTab] = useState('activity');
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
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
          const histResult = await fetchAttendanceHistory(card.rawId);
          if (histResult.success) {
            setHistory(histResult.data || []);
          }
        } else {
          setHistory([]);
        }
        setComments([]);
      }
    } catch (err) {
      console.error('BoardDetailDrawer:loadDetail:error', err);
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

  const handleAddComment = async () => {
    if (!newComment.trim() || !card || card.type !== 'workflow') return;
    const result = await addWorkflowBoardComment(card.rawId, newComment.trim());
    if (result.success) {
      setComments((prev) => [...prev, result.data?.comment || result.data]);
      setNewComment('');
    }
  };

  const handleSaveNotes = async () => {
    if (!card || card.type !== 'attendance' || !card.rawId) return;
    await moveAttendanceCard(card.rawId, card.column, notes);
    onRefresh?.();
  };

  const handleMarkTaken = async () => {
    if (!card || card.type !== 'workflow') return;
    const result = await markWorkflowAsTaken(card.rawId);
    if (result.success) {
      onRefresh?.();
      onOpenChange(false);
    }
  };

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
        onOpenChange(false);
      }
    } finally {
      setSavingStatus(null);
    }
  };

  if (!card) return null;

  const statusColumn = (lane === 'attendance' ? ATTENDANCE_COLUMNS : []).find((c) => c.id === card.column);
  const statusLabel = statusColumn
    ? t(statusColumn.i18nKey) || statusColumn.name
    : card.column;

  const studentName = resolveBoardStudentName(card, lang);
  const className = resolveBoardClassName(card, lang);

  const activityEntries = [
    ...history.map((h) => ({
      type: 'status',
      actor: h.actor?.displayName || h.changedByUser?.displayName || t('operations_board_system_actor'),
      from: h.fromStatus || h.fromStatus?.nameEn || h.oldStatus,
      to: h.toStatus || h.toStatus?.nameEn || h.newStatus,
      at: h.createdAt || h.changedAt,
      reason: h.reason || h.comment,
      profileImageUrl: h.actor?.profileImageUrl || h.changedByUser?.profileImageUrl,
    })),
    ...comments.map((c) => ({
      type: 'comment',
      actor: c.author?.displayName || c.authorName || t('operations_board_unknown_user'),
      text: c.comment || c.text,
      at: c.createdAt,
      profileImageUrl: c.author?.profileImageUrl,
    })),
  ].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const dateFormatter = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0" data-testid="operations-board-drawer">
        <DialogHeader className="space-y-3 border-b border-border px-6 py-4">
          <div className="flex items-start gap-3">
            {card.type === 'attendance' && (
              <BoardStudentAvatar
                name={studentName}
                profileImageUrl={card.profileImageUrl}
                size="lg"
              />
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className="flex flex-wrap items-center gap-2 text-lg">
                <span className="truncate">{studentName}</span>
                <Badge
                  variant="outline"
                  style={statusColumn ? { borderColor: statusColumn.color, color: statusColumn.color } : undefined}
                >
                  {statusLabel}
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                {card.type === 'workflow' ? t('operations_board_workflow') : t('operations_board_attendance')}
                {className ? ` · ${className}` : ''}
                {card.date ? ` · ${formatBoardDate(card.date, lang)}` : ''}
              </DialogDescription>
            </div>
          </div>

          {card.type === 'attendance' && (
            <div className="flex flex-wrap gap-2" data-testid="operations-board-attendance-actions">
              {ATTENDANCE_COLUMNS.filter((col) => col.id !== 'NOT_TAKEN').map((col) => (
                <Button
                  key={col.id}
                  size="sm"
                  variant={card.column === col.id ? 'default' : 'outline'}
                  disabled={savingStatus != null}
                  onClick={() => handleAttendanceStatus(col.id)}
                  className="gap-2"
                  data-testid={`operations-board-set-status-${col.id}`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                  {t(col.i18nKey) || col.name}
                </Button>
              ))}
            </div>
          )}

          {card.type === 'workflow' && card.status === 'DRAFT' && (
            <Button size="sm" onClick={handleMarkTaken} data-testid="operations-board-mark-taken">
              {t('operations_board_mark_taken')}
            </Button>
          )}

          {card.type === 'workflow' && card.fileId && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2">
              <span className="text-xs font-medium">{t('operations_board_attached_file')}:</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => navigate(`/smart-drive?fileId=${card.fileId}`)}
              >
                {card.fileName || t('operations_board_view_file')}
              </Button>
            </div>
          )}
        </DialogHeader>

        <Box sx={{ px: 3, py: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="fullWidth"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab value="activity" label={t('operations_board_tab_activity')} data-testid="operations-board-drawer-tab-activity" />
            <Tab value="notes" label={t('operations_board_tab_notes')} data-testid="operations-board-drawer-tab-notes" />
            {card.type === 'workflow' && (
              <Tab value="comments" label={t('operations_board_tab_comments')} data-testid="operations-board-drawer-tab-comments" />
            )}
          </Tabs>

          {tab === 'activity' && (
            <ScrollArea className="max-h-[45vh] pr-2">
              <div data-testid="operations-board-activity-feed">
                {loading ? (
                  <p className="text-sm text-muted-foreground">{t('operations_board_loading')}</p>
                ) : activityEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('operations_board_no_activity')}</p>
                ) : (
                  activityEntries.map((entry, idx) => (
                    <div key={idx} className="mb-3 flex gap-3">
                      <BoardStudentAvatar
                        name={entry.actor}
                        profileImageUrl={entry.profileImageUrl}
                        size="md"
                      />
                      <div className="flex-1 rounded-lg border border-border bg-muted/20 p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{entry.actor}</span>
                          {entry.at && (
                            <span className="text-xs text-muted-foreground">
                              {dateFormatter.format(new Date(entry.at))}
                            </span>
                          )}
                        </div>
                        {entry.type === 'status' && (
                          <p className="mt-1 text-muted-foreground">
                            {entry.from || '—'} → {entry.to || '—'}
                          </p>
                        )}
                        {entry.text && <p className="mt-1">{entry.text}</p>}
                        {entry.reason && <p className="mt-1 text-muted-foreground">{entry.reason}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {tab === 'notes' && (
            <div>
              <TextField
                multiline
                minRows={5}
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('operations_board_card_notes')}
                inputProps={{ 'data-testid': 'operations-board-notes-input' }}
              />
              {card.type === 'attendance' && card.rawId && (
                <Button size="sm" className="mt-3" onClick={handleSaveNotes}>
                  {t('operations_board_note_save')}
                </Button>
              )}
            </div>
          )}

          {tab === 'comments' && card.type === 'workflow' && (
            <div>
              <div className="mb-3 flex flex-col gap-2">
                {comments.map((c, idx) => (
                  <div key={idx} className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                    <p>{c.comment || c.text}</p>
                    <span className="text-xs text-muted-foreground">
                      — {c.author?.displayName || c.authorName}
                    </span>
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
            </div>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
