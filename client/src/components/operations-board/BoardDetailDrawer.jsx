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
import { Shield, User, Briefcase, GraduationCap } from 'lucide-react';
import {
  fetchWorkflowHistory,
  fetchAttendanceHistory,
  addWorkflowBoardComment,
  moveAttendanceCard,
  ATTENDANCE_COLUMNS,
  WORKFLOW_COLUMNS,
  ATTENDANCE_BOARD_LANES,
  normalizeAttendanceStatus,
} from '@services/business/operationsBoardService.js';
import { useLang } from '@contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import {
  formatBoardDate,
  resolveBoardClassName,
  resolveBoardStudentName,
} from './operationsBoardDisplayUtils.js';
import { formatDateTime } from '@utils/date-formatter.js';
import { getLocalizedAttendanceLabel, ATTENDANCE_STATUS } from '@constants/attendanceTypes.js';
import {
  CARD_TYPE,
  ACTIVITY_TYPE,
  DRAWER_TAB,
} from './operationsBoardConstants.js';

const { NOT_TAKEN, PRESENT, LATE, ABSENT, EXCUSED, HUMAN_CASE } = ATTENDANCE_BOARD_LANES;

function statusColor(value) {
  if (!value) return null;
  const raw = typeof value === 'object' ? (value.code || value.nameEn || '') : String(value);
  const key = String(raw).toUpperCase().trim().replace(/\s+/g, '_');
  const allColumns = [...ATTENDANCE_COLUMNS, ...WORKFLOW_COLUMNS];
  const directMatch = allColumns.find(
    (col) => col.id === key || col.name.toLowerCase() === raw.toLowerCase()
  );
  if (directMatch) return directMatch.color;
  const normalized = normalizeAttendanceStatus(value);
  const normalizedMatch = ATTENDANCE_COLUMNS.find((col) => col.id === normalized);
  return normalizedMatch?.color || null;
}

function shortStatus(value, lang = 'en') {
  if (!value) return '—';
  if (typeof value === 'object') {
    const code = value.code || value.nameEn || '—';
    const normalizedCode = normalizeStatusCode(code);
    const localized = getLocalizedAttendanceLabel(normalizedCode, lang);
    if (localized) return localized;
    return value.nameEn || value.code || '—';
  }
  const code = String(value);
  const normalizedCode = normalizeStatusCode(code);
  const localized = getLocalizedAttendanceLabel(normalizedCode, lang);
  if (localized) return localized;
  // Fallback to removing prefix
  return code.replace(/^ATTENDANCE_/, '').replace(/^ATTENDANCE\s+/, '');
}

function normalizeStatusCode(code) {
  if (!code) return code;
  const str = String(code).toUpperCase().trim();
  // Map common variations to canonical codes
  const statusMap = {
    [PRESENT]: ATTENDANCE_STATUS.PRESENT,
    [ABSENT]: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE,
    [LATE]: ATTENDANCE_STATUS.LATE,
    [EXCUSED]: ATTENDANCE_STATUS.EXCUSED_LEAVE,
    [EXCUSED_LEAVE]: ATTENDANCE_STATUS.EXCUSED_LEAVE,
    [HUMAN_CASE]: ATTENDANCE_STATUS.HUMAN_CASE,
    LEAVE: ATTENDANCE_STATUS.EXCUSED_LEAVE,
  };
  // Handle ATTENDANCE_ABSENT and ATTENDANCE ABSENT formats
  const withPrefix = str.replace(/ATTENDANCE\s+/g, 'ATTENDANCE_');
  return statusMap[withPrefix] || statusMap[str] || withPrefix;
}

function getRoleIcon(actorName) {
  if (!actorName) return null;
  const upperName = actorName.toUpperCase();
  if (upperName.includes('ADMIN') || upperName.includes('SUPER ADMIN') || upperName.includes('GLOBAL ADMIN')) {
    return Shield;
  }
  if (upperName.includes('INSTRUCTOR')) {
    return GraduationCap;
  }
  if (upperName.includes('HR')) {
    return Briefcase;
  }
  return User;
}

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
      if (card.type === CARD_TYPE.WORKFLOW) {
        const histResult = await fetchWorkflowHistory(card.rawId);
        if (histResult.success) {
          setHistory(histResult.data?.history || []);
          setComments(histResult.data?.comments || card.raw?.comments || []);
        }
      } else if (card.type === CARD_TYPE.ATTENDANCE) {
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
    if (!newComment.trim() || !card || card.type !== CARD_TYPE.WORKFLOW) return;
    const result = await addWorkflowBoardComment(card.rawId, newComment.trim());
    if (result.success) {
      setComments((prev) => [...prev, result.data?.comment || result.data]);
      setNewComment('');
    }
  };

  const handleSaveNotes = async () => {
    if (!card || card.type !== CARD_TYPE.ATTENDANCE || !card.rawId) return;
    await moveAttendanceCard(card.rawId, card.column, notes);
    onRefresh?.();
  };

  const handleAttendanceStatus = async (statusId) => {
    if (!card || card.type !== CARD_TYPE.ATTENDANCE) return;
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

  const statusColumn = (lane === CARD_TYPE.ATTENDANCE ? ATTENDANCE_COLUMNS : []).find((c) => c.id === card.column);
  const statusLabel = statusColumn
    ? t(statusColumn.i18nKey) || statusColumn.name
    : card.column;

  const studentName = resolveBoardStudentName(card, lang);
  const className = resolveBoardClassName(card, lang);

  const activityEntries = [
    ...history.map((h) => {
      const fromRaw = h.fromStatus || h.fromStatus?.nameEn || h.oldStatus;
      const toRaw = h.toStatus || h.toStatus?.nameEn || h.newStatus;
      const actorName = h.actor?.displayName || h.changedByUser?.displayName;

      // Debug: log status values
      console.log('[BoardDetailDrawer] History entry:', {
        fromRaw,
        toRaw,
        fromType: typeof fromRaw,
        toType: typeof toRaw,
        lang
      });

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
        type: ACTIVITY_TYPE.STATUS,
        actor: translatedActorName || t('operations_board_system_actor'),
        isSystem: !actorName,
        from: shortStatus(fromRaw, lang),
        to: shortStatus(toRaw, lang),
        fromColor: statusColor(fromRaw),
        toColor: statusColor(toRaw),
        at: h.createdAt || h.changedAt,
        reason: h.reason || h.comment,
        profileImageUrl: h.actor?.profileImageUrl || h.changedByUser?.profileImageUrl,
      };
    }),
    ...comments.map((c) => {
      const commentActorName = c.author?.displayName || c.authorName || t('operations_board_unknown_user');

      // Translate role names for Arabic in comments
      let translatedCommentActor = commentActorName;
      if (lang === 'ar' && commentActorName) {
        if (commentActorName === 'Global Admin' || commentActorName === 'Super Admin') {
          translatedCommentActor = t('roles.super_admin') || 'مدير عام';
        } else if (commentActorName === 'Admin') {
          translatedCommentActor = t('roles.admin') || 'مدير';
        } else if (commentActorName === 'Instructor') {
          translatedCommentActor = t('roles.instructor') || 'مدرب';
        } else if (commentActorName === 'HR') {
          translatedCommentActor = t('roles.hr') || 'موارد بشرية';
        }
      }

      return {
        type: ACTIVITY_TYPE.COMMENT,
        actor: translatedCommentActor,
        isSystem: false,
        text: c.comment || c.text,
        at: c.createdAt,
        profileImageUrl: c.author?.profileImageUrl,
      };
    }),
  ].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  // Prefer formatDateTime for consistent DD/MM/YYYY, hh:mm a formatting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0" data-testid="operations-board-drawer">
        <DialogHeader className="space-y-3 border-b border-border px-6 py-4">
          <div className="flex items-start gap-3">
            {card.type === CARD_TYPE.ATTENDANCE && (
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
                  className="sm:hidden"
                >
                  {statusLabel}
                </Badge>
                <Badge
                  variant="outline"
                  style={statusColumn ? { borderColor: statusColumn.color, color: statusColumn.color } : undefined}
                  className="w-fit inline-flex"
                >
                  {card.type === CARD_TYPE.ATTENDANCE && statusColumn && (
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0 mr-1"
                      style={{ backgroundColor: statusColumn.color }}
                      aria-hidden
                    />
                  )}
                  {statusLabel}
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                {card.date ? `${formatBoardDate(card.date, lang)}` : ''}
                {card.date && className ? ' · ' : ''}
                {className ? `${className}` : ''}
              </DialogDescription>
            </div>
          </div>

          {card.type === CARD_TYPE.ATTENDANCE && (
            <div className="flex flex-wrap gap-2" data-testid="operations-board-attendance-actions">
              {ATTENDANCE_COLUMNS.filter((col) => col.id !== NOT_TAKEN).map((col) => (
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
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  onOpenChange(false);
                  navigate('/qr-scanner', {
                    state: {
                      classId: card.classId,
                      studentId: card.userId,
                      studentNumber: card.studentNumber,
                      date: card.date,
                      openManual: true,
                    },
                  });
                }}
                data-testid="operations-board-mark-attendance"
              >
                {t('operations_board_mark_attendance') || 'Mark Attendance'}
              </Button>
            </div>
          )}

          {card.type === CARD_TYPE.WORKFLOW && card.fileId && (
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
            sx={{ 
              mb: 2, 
              borderBottom: 1, 
              borderColor: 'divider',
              minHeight: 24,
              '& .MuiTab-root': {
                minHeight: 24,
                fontSize: '0.65rem',
                fontWeight: 600,
                py: 0.25,
              }
            }}
          >
            <Tab value={DRAWER_TAB.ACTIVITY} label={t('operations_board_tab_activity')} data-testid="operations-board-drawer-tab-activity" />
            <Tab value={DRAWER_TAB.NOTES} label={t('operations_board_tab_notes')} data-testid="operations-board-drawer-tab-notes" />
            {card.type === CARD_TYPE.WORKFLOW && (
              <Tab value={DRAWER_TAB.COMMENTS} label={t('operations_board_tab_comments')} data-testid="operations-board-drawer-tab-comments" />
            )}
          </Tabs>

          {tab === DRAWER_TAB.ACTIVITY && (
            <ScrollArea className="max-h-[45vh] pr-2">
              <div data-testid="operations-board-activity-feed">
                {loading ? (
                  <p className="text-xs text-muted-foreground">{t('operations_board_loading')}</p>
                ) : activityEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('operations_board_no_activity')}</p>
                ) : (
                  activityEntries.map((entry, idx) => (
                    <div key={idx} className="mb-2 flex gap-2">
                      <BoardStudentAvatar
                        name={entry.actor}
                        profileImageUrl={entry.profileImageUrl}
                        size="sm"
                      />
                      <div className="flex-1 rounded-lg border border-border bg-muted/20 p-2 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {entry.type === ACTIVITY_TYPE.STATUS && (
                            <span className="inline-flex items-center gap-0.75 shrink-0">
                              <span style={{ color: entry.fromColor || undefined, fontWeight: 600 }}>{entry.from || '—'}</span>
                              <span
                                className="inline-block h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: entry.toColor || '#94a3b8' }}
                                aria-hidden
                              />
                              <span style={{ color: entry.toColor || undefined, fontWeight: 600 }}>{entry.to || '—'}</span>
                            </span>
                          )}
                          <span className="font-medium text-xs flex items-center gap-1" style={entry.isSystem ? { color: 'var(--text-muted, #64748b)' } : undefined}>
                            {(() => {
                              const RoleIcon = getRoleIcon(entry.actor);
                              const isRole = ['ADMIN', 'SUPER ADMIN', 'GLOBAL ADMIN', 'INSTRUCTOR', 'HR'].some(role =>
                                entry.actor?.toUpperCase()?.includes(role)
                              );
                              return isRole && RoleIcon ? (
                                <>
                                  <RoleIcon size={12} className="text-muted-foreground" />
                                  {entry.actor}
                                </>
                              ) : (
                                entry.actor
                              );
                            })()}
                          </span>
                          {entry.at && (
                            <span className="text-[0.65rem] text-muted-foreground ml-auto">
                              {formatDateTime(entry.at, lang)}
                            </span>
                          )}
                        </div>
                        {entry.text && <p className="mt-0.5 text-xs">{entry.text}</p>}
                        {entry.reason && (
                          <p className="mt-0.25 text-[0.65rem] text-muted-foreground">
                            {entry.reason === 'Initial document submission' || entry.reason === 'operations board initial document submission'
                              ? t('operations_board_initial_document_submission')
                              : entry.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {tab === DRAWER_TAB.NOTES && (
            <div>
              <TextField
                multiline
                minRows={5}
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('operations_board_card_notes')}
                inputProps={{ 'data-testid': 'operations-board-notes-input', style: { fontSize: '0.75rem' } }}
              />
              {card.type === CARD_TYPE.ATTENDANCE && card.rawId && (
                <Button size="sm" className="mt-2" onClick={handleSaveNotes}>
                  {t('operations_board_note_save')}
                </Button>
              )}
              {card.type === CARD_TYPE.ATTENDANCE && history.length > 0 && (
                <div className="mt-3" data-testid="operations-board-notes-history">
                  <p className="text-[0.65rem] font-medium text-muted-foreground mb-1.5">
                    {t('operations_board_notes_history') || 'Notes History'}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {history
                      .filter((h) => h.notes || h.reason || h.comment)
                      .map((h, idx) => {
                        const notesActorName = h.actor?.displayName || h.changedByUser?.displayName || t('operations_board_system_actor');

                        // Translate role names for Arabic in notes history
                        let translatedNotesActor = notesActorName;
                        if (lang === 'ar' && notesActorName) {
                          if (notesActorName === 'Global Admin' || notesActorName === 'Super Admin') {
                            translatedNotesActor = t('roles.super_admin') || 'مدير عام';
                          } else if (notesActorName === 'Admin') {
                            translatedNotesActor = t('roles.admin') || 'مدير';
                          } else if (notesActorName === 'Instructor') {
                            translatedNotesActor = t('roles.instructor') || 'مدرب';
                          } else if (notesActorName === 'HR') {
                            translatedNotesActor = t('roles.hr') || 'موارد بشرية';
                          }
                        }

                        return (
                          <div key={idx} className="rounded-lg border border-border bg-muted/20 p-2 text-xs">
                            <div className="flex justify-between gap-1.5 mb-0.5">
                              <span className="text-[0.65rem] text-muted-foreground">
                                {translatedNotesActor}
                              </span>
                            {(h.createdAt || h.changedAt) && (
                              <span className="text-[0.65rem] text-muted-foreground">
                                {formatDateTime(h.createdAt || h.changedAt, lang)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs">{h.notes || h.reason || h.comment}</p>
                        </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === DRAWER_TAB.COMMENTS && card.type === CARD_TYPE.WORKFLOW && (
            <div>
              <div className="mb-2 flex flex-col gap-1.5">
                {comments.map((c, idx) => {
                  const commentAuthorName = c.author?.displayName || c.authorName;

                  // Translate role names for Arabic in comments tab
                  let translatedCommentAuthor = commentAuthorName;
                  if (lang === 'ar' && commentAuthorName) {
                    if (commentAuthorName === 'Global Admin' || commentAuthorName === 'Super Admin') {
                      translatedCommentAuthor = t('roles.super_admin') || 'مدير عام';
                    } else if (commentAuthorName === 'Admin') {
                      translatedCommentAuthor = t('roles.admin') || 'مدير';
                    } else if (commentAuthorName === 'Instructor') {
                      translatedCommentAuthor = t('roles.instructor') || 'مدرب';
                    } else if (commentAuthorName === 'HR') {
                      translatedCommentAuthor = t('roles.hr') || 'موارد بشرية';
                    }
                  }

                  return (
                    <div key={idx} className="rounded-lg border border-border bg-muted/20 p-2 text-xs">
                      <p className="text-xs">{c.comment || c.text}</p>
                      <span className="text-[0.65rem] text-muted-foreground">
                        — {translatedCommentAuthor}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1.5">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('operations_board_card_add_comment')}
                  data-testid="operations-board-comment-input"
                  style={{ fontSize: '0.75rem' }}
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
