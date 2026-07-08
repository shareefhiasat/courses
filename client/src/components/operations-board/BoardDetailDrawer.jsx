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
import { Separator } from '@/components/kibo/ui/separator';
import { ScrollArea } from '@/components/kibo/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/kibo/ui/avatar';
import {
  fetchWorkflowHistory,
  fetchAttendanceHistory,
  addWorkflowBoardComment,
  moveAttendanceCard,
  markWorkflowAsTaken,
} from '@services/business/operationsBoardService.js';
import { useLang } from '@contexts/LangContext';
import { useNavigate } from 'react-router-dom';

const TABS = { ACTIVITY: 'activity', NOTES: 'notes', COMMENTS: 'comments' };

export default function BoardDetailDrawer({ open, onOpenChange, card, lane, onRefresh }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [tab, setTab] = useState(TABS.ACTIVITY);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

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
      setTab(TABS.ACTIVITY);
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

  if (!card) return null;

  const activityEntries = [
    ...history.map((h) => ({
      type: 'status',
      actor: h.actor?.displayName || h.changedByUser?.displayName || 'System',
      from: h.fromStatus || h.fromStatus?.nameEn || h.oldStatus,
      to: h.toStatus || h.toStatus?.nameEn || h.newStatus,
      at: h.createdAt || h.changedAt,
      reason: h.reason || h.comment,
    })),
    ...comments.map((c) => ({
      type: 'comment',
      actor: c.author?.displayName || c.authorName || 'User',
      text: c.comment || c.text,
      at: c.createdAt,
    })),
  ].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="operations-board-drawer">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{card.name}</span>
            <Badge variant="secondary">{card.column}</Badge>
          </DialogTitle>
          <DialogDescription>
            {card.type === 'workflow' ? t('operations_board_workflow') : t('operations_board_attendance')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b border-border pb-2">
          {[TABS.ACTIVITY, TABS.NOTES, ...(card.type === 'workflow' ? [TABS.COMMENTS] : [])].map((tabKey) => (
            <Button
              key={tabKey}
              variant={tab === tabKey ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTab(tabKey)}
              data-testid={`operations-board-drawer-tab-${tabKey}`}
            >
              {t(`operations_board_tab_${tabKey}`) || tabKey}
            </Button>
          ))}
        </div>

        {card.type === 'workflow' && card.status === 'DRAFT' && (
          <Button size="sm" onClick={handleMarkTaken} data-testid="operations-board-mark-taken">
            {t('operations_board_mark_taken') || 'Mark attendance as taken'}
          </Button>
        )}

        {card.type === 'workflow' && card.fileId && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2">
            <span className="text-xs font-medium">{t('operations_board_attached_file') || 'Attached File'}:</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => navigate(`/smart-drive?fileId=${card.fileId}`)}
            >
              {card.fileName || t('operations_board_view_file') || 'View File'}
            </Button>
          </div>
        )}

        <ScrollArea className="max-h-[50vh]">
          <div className="flex flex-col gap-4 p-1">
            {tab === TABS.ACTIVITY && (
              <div data-testid="operations-board-activity-feed">
                {loading ? (
                  <p className="text-xs text-muted-foreground">{t('operations_board_loading')}</p>
                ) : activityEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('operations_board_no_activity') || 'No activity yet'}</p>
                ) : (
                  activityEntries.map((entry, idx) => (
                    <div key={idx} className="mb-3 flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{entry.actor?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 rounded-md border border-border bg-muted/30 p-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{entry.actor}</span>
                          {entry.at && (
                            <span className="text-muted-foreground">{new Date(entry.at).toLocaleString()}</span>
                          )}
                        </div>
                        {entry.type === 'status' && (
                          <p className="mt-1">{entry.from || '—'} → {entry.to || '—'}</p>
                        )}
                        {entry.text && <p className="mt-1">{entry.text}</p>}
                        {entry.reason && <p className="mt-1 text-muted-foreground">{entry.reason}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === TABS.NOTES && (
              <div>
                <textarea
                  className="min-h-[120px] w-full rounded-md border border-input bg-background p-3 text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('operations_board_card_notes')}
                  data-testid="operations-board-notes-input"
                />
                {card.type === 'attendance' && card.rawId && (
                  <Button size="sm" className="mt-2" onClick={handleSaveNotes}>
                    {t('operations_board_note_save')}
                  </Button>
                )}
              </div>
            )}

            {tab === TABS.COMMENTS && card.type === 'workflow' && (
              <div>
                <div className="mb-3 flex flex-col gap-2">
                  {comments.map((c, idx) => (
                    <div key={idx} className="rounded-md border border-border bg-muted/30 p-2 text-xs">
                      <p>{c.comment || c.text}</p>
                      <span className="text-muted-foreground">— {c.author?.displayName || c.authorName}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('operations_board_card_add_comment')}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    data-testid="operations-board-comment-input"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
                  />
                  <Button size="sm" onClick={handleAddComment}>{t('operations_board_note_save')}</Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
