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
import {
  fetchWorkflowHistory,
  fetchAttendanceHistory,
  addWorkflowBoardComment,
  moveAttendanceCard,
} from '@services/business/operationsBoardService.js';
import { useLang } from '@contexts/LangContext';

export default function BoardDetailDrawer({ open, onOpenChange, card, mode }) {
  const { t } = useLang();
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!card) return;
    setLoading(true);
    try {
      if (card.type === 'workflow') {
        const histResult = await fetchWorkflowHistory(card.rawId);
        if (histResult.success) {
          setHistory(histResult.data?.history || histResult.data || []);
        }
        setComments(card.raw?.comments || []);
      } else if (card.type === 'attendance') {
        const histResult = await fetchAttendanceHistory(card.rawId);
        if (histResult.success) {
          setHistory(histResult.data?.changes || histResult.data || []);
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
      loadDetail();
    }
  }, [open, card, loadDetail]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !card) return;
    try {
      if (card.type === 'workflow') {
        const result = await addWorkflowBoardComment(card.rawId, newComment.trim());
        if (result.success) {
          setComments((prev) => [...prev, result.data?.comment || result.data]);
          setNewComment('');
        }
      }
    } catch (err) {
      console.error('BoardDetailDrawer:handleAddComment:error', err);
    }
  };

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{card.name}</span>
            <Badge variant="secondary">{card.column}</Badge>
          </DialogTitle>
          <DialogDescription>
            {card.type === 'workflow' ? t('operations_board_workflow') : t('operations_board_attendance')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="flex flex-col gap-4 p-1">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {card.type === 'workflow' && (
                <>
                  {card.assignee && (
                    <div>
                      <span className="text-muted-foreground">{t('operations_board_card_assignee')}: </span>
                      <span>{card.assignee}</span>
                    </div>
                  )}
                  {card.workflowType && (
                    <div>
                      <span className="text-muted-foreground">Type: </span>
                      <span>{card.workflowType}</span>
                    </div>
                  )}
                </>
              )}
              {card.type === 'attendance' && (
                <>
                  {card.className && (
                    <div>
                      <span className="text-muted-foreground">{t('operations_board_class')}: </span>
                      <span>{card.className}</span>
                    </div>
                  )}
                  {card.date && (
                    <div>
                      <span className="text-muted-foreground">Date: </span>
                      <span>{new Date(card.date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {card.notes && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">{t('operations_board_card_notes')}: </span>
                      <span>{card.notes}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <Separator />

            {/* History */}
            <div>
              <h3 className="mb-2 text-sm font-semibold">{t('operations_board_card_history')}</h3>
              {loading ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No history available</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.map((entry, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-border bg-muted/30 p-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {entry.fromStatus || entry.oldStatus || '—'} → {entry.toStatus || entry.newStatus || '—'}
                        </span>
                        {entry.createdAt && (
                          <span className="text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {entry.reason && (
                        <p className="mt-1 text-muted-foreground">{entry.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Comments */}
            <div>
              <h3 className="mb-2 text-sm font-semibold">{t('operations_board_card_comments')}</h3>
              {comments.length > 0 && (
                <div className="mb-3 flex flex-col gap-2">
                  {comments.map((c, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-border bg-muted/30 p-2 text-xs"
                    >
                      <p>{c.comment || c.text || c.message}</p>
                      {(c.author?.name || c.authorName) && (
                        <span className="mt-1 block text-muted-foreground">
                          — {c.author?.name || c.authorName}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {card.type === 'workflow' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('operations_board_card_add_comment')}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment();
                    }}
                  />
                  <Button size="sm" onClick={handleAddComment}>
                    {t('operations_board_note_save')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
