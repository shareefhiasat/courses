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
  WORKFLOW_COLUMNS,
} from '@services/business/operationsBoardService.js';
import { getRecordHistory } from '@services/business/attendanceLogService.js';
import { getParticipationsByClassAndDate } from '@services/business/participationService.js';
import { useLang } from '@contexts/LangContext';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import {
  formatBoardDate,
  resolveBoardClassName,
  resolveBoardStudentName,
  parseWorkflowCardName,
} from './operationsBoardDisplayUtils.js';
import { getAllowedAttendanceActions } from './attendanceBoardRules.js';
import WorkflowPdfPreviewPanel from './WorkflowPdfPreviewPanel.jsx';
import { FileText, X, Check, Clock, MinusCircle, Save, Eye, EyeOff } from 'lucide-react';
import { formatDateTime } from '@utils/date-formatter.js';
import { ATTENDANCE_BOARD_COLORS } from '@constants/workspaceStatusColors.js';

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
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [participationList, setParticipationList] = useState([]);

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
        if (card.classId && card.date) {
          try {
            const partResult = await getParticipationsByClassAndDate(card.classId, card.date);
            if (partResult.success && partResult.data) {
              setParticipationList(partResult.data.filter((p) => String(p.userId) === String(card.userId)));
            } else {
              setParticipationList([]);
            }
          } catch { setParticipationList([]); }
        } else {
          setParticipationList([]);
        }
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
      setPdfPreviewOpen(false);
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
  const workflowNameParts = card.type === 'workflow' ? parseWorkflowCardName(card.name) : [];
  const workflowTitle = workflowNameParts[0] || studentName;
  const workflowClassName = workflowNameParts[1] || className;
  const displayTitle = card.type === 'workflow' ? workflowTitle : studentName;
  const displayClassName = card.type === 'workflow' ? workflowClassName : className;

  const statusColumns = card.type === 'attendance' ? ATTENDANCE_COLUMNS : WORKFLOW_COLUMNS;
  const statusColumn = statusColumns.find((c) => c.id === card.column);
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
      hideCloseButton
      title={null}
      data-testid="operations-board-drawer"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header: avatar / doc icon + title + meta + close */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          {card.type === 'attendance' ? (
            <BoardStudentAvatar name={studentName} profileImageUrl={card.profileImageUrl} size="md" />
          ) : (
            <span
              className="inline-flex items-center justify-center rounded-full shrink-0"
              style={{
                width: 40,
                height: 40,
                backgroundColor: statusColumn ? `${statusColumn.color}14` : 'hsl(var(--muted))',
                color: statusColumn?.color || 'currentColor',
              }}
            >
              <FileText size={18} />
            </span>
          )}
          <Box sx={{ minWidth: 0, flex: 1, pt: 0.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <span className="text-base font-semibold truncate">{displayTitle}</span>
              {statusColumn && (
                <Badge
                  variant="outline"
                  style={{
                    borderColor: statusColumn.color,
                    color: statusColumn.color,
                    backgroundColor: `${statusColumn.color}14`,
                    fontSize: '0.7rem',
                    textTransform: 'none',
                  }}
                >
                  {statusLabel}
                </Badge>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
              {displayClassName && (
                <span className="text-xs text-muted-foreground truncate">{displayClassName}</span>
              )}
              {card.date && (
                <>
                  {displayClassName && <span className="text-xs text-muted-foreground/50">•</span>}
                  <span className="text-xs text-muted-foreground">{formatBoardDate(card.date, lang)}</span>
                </>
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

        {/* Status buttons for attendance */}
        {card.type === 'attendance' && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
            {allowedActions.map((col) => {
              const isNotTaken = col.id === 'NOT_TAKEN';
              const isSelected = card.column === col.id;
              const iconMap = {
                PRESENT: <Check size={14} />,
                LATE: <Clock size={14} />,
                ABSENT: <MinusCircle size={14} />,
                EXCUSED: <FileText size={14} />,
                NOT_TAKEN: <MinusCircle size={14} />,
              };
              if (isNotTaken) {
                return (
                  <button
                    key={col.id}
                    disabled={savingStatus != null}
                    onClick={() => handleAttendanceStatus(col.id)}
                    data-testid={`operations-board-set-status-${col.id}`}
                    className="operations-board-drawer-status-chip"
                    style={{
                      '--chip-color': col.color,
                      padding: '0.4rem 0.5rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={t(col.i18nKey) || col.name}
                  >
                    {iconMap[col.id] || <MinusCircle size={14} />}
                  </button>
                );
              }
              return (
                <button
                  key={col.id}
                  disabled={savingStatus != null}
                  onClick={() => handleAttendanceStatus(col.id)}
                  data-testid={`operations-board-set-status-${col.id}`}
                  className={`operations-board-drawer-status-chip${isSelected ? ' selected' : ''}`}
                  style={{ '--chip-color': col.color }}
                >
                  <span className="operations-board-drawer-status-chip-dot" style={{ backgroundColor: col.color }} />
                  {iconMap[col.id]}
                  {t(col.i18nKey) || col.name}
                </button>
              );
            })}
            <button
              size="sm"
              onClick={handleSaveNotes}
              disabled={savingStatus != null}
              className="operations-board-drawer-status-chip"
              style={{ '--chip-color': '#3b82f6', marginLeft: 'auto' }}
              data-testid="operations-board-save-notes-btn"
            >
              <Save size={14} />
              {t('operations_board_note_save') || 'Save'}
            </button>
          </Box>
        )}

        {card.type === 'workflow' && card.status === 'DRAFT' && (
          <Button size="sm" onClick={handleMarkTaken} data-testid="operations-board-mark-taken">
            {t('operations_board_mark_taken')}
          </Button>
        )}

        {card.type === 'workflow' && card.fileId && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            <Button
              size="sm"
              variant="outline"
              className="w-fit h-8 gap-2 px-3"
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

        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth" sx={{ flexShrink: 0 }}>
          <Tab value="activity" label={t('operations_board_tab_activity')} data-testid="operations-board-drawer-tab-activity" />
          <Tab value="profile" label={t('operations_board_tab_profile') || 'Profile'} data-testid="operations-board-drawer-tab-profile" />
          <Tab value="notes" label={t('operations_board_tab_notes')} data-testid="operations-board-drawer-tab-notes" />
          {card.type === 'attendance' && (
            <Tab value="participation" label={t('operations_board_participation') || 'Participation'} data-testid="operations-board-drawer-tab-participation" />
          )}
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
              <div className="flex flex-col">
                {activityEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="py-3 text-sm"
                    style={{
                      borderBottom: idx < activityEntries.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    }}
                  >
                    <div className="flex justify-between gap-2 mb-1">
                      <span className="font-medium text-foreground">{entry.actor}</span>
                      {entry.at && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDateTime(entry.at, lang)}
                        </span>
                      )}
                    </div>
                    {entry.type === 'status' && (
                      <p className="text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-medium text-foreground/80">{entry.from || '—'}</span>
                          <span className="text-xs">→</span>
                          <span className="font-medium text-foreground/80">{entry.to || '—'}</span>
                        </span>
                      </p>
                    )}
                    {entry.text && <p className="mt-1 text-foreground">{entry.text}</p>}
                    {entry.reason && <p className="mt-1 text-muted-foreground">{entry.reason}</p>}
                  </div>
                ))}
              </div>
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

        {tab === 'notes' && (
          <Box sx={{ flex: 1, overflow: 'auto' }} data-testid="operations-board-notes-panel">
            <textarea
              className="min-h-[140px] w-full rounded-md border border-input bg-background p-3 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('operations_board_card_notes')}
              data-testid="operations-board-notes-input"
            />
            <Button size="sm" className="mt-2" onClick={handleSaveNotes}>
              {t('operations_board_note_save') || 'Save'}
            </Button>
            {(() => {
              const notesHistory = history.filter((h) => h.notes || h.comment);
              return notesHistory.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 tracking-wide">
                    {t('operations_board_notes_history') || 'Notes History'}
                  </p>
                  {notesHistory.map((h, idx) => (
                    <div
                      key={idx}
                      className="py-2 text-sm"
                      style={{
                        borderBottom: idx < notesHistory.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                      }}
                    >
                      <p className="text-foreground">{h.notes || h.comment}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(h.createdAt || h.changedAt, lang)}
                      </span>
                    </div>
                  ))}
                </Box>
              ) : null;
            })()}
          </Box>
        )}

        {tab === 'participation' && card.type === 'attendance' && (
          <Box sx={{ flex: 1, overflow: 'auto' }} data-testid="operations-board-participation-panel">
            {participationList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('operations_board_no_participation') || 'No participation records for this student.'}
              </p>
            ) : (
              <div className="flex flex-col">
                {participationList.map((p, idx) => (
                  <div
                    key={idx}
                    className="py-3 text-sm"
                    style={{
                      borderBottom: idx < participationList.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-foreground">
                        {p.participationTypeName || p.typeName || (lang === 'ar' ? 'مشاركة' : 'Participation')}
                      </span>
                      {p.points != null && (
                        <Badge variant="outline" style={{ borderColor: '#3b82f6', color: '#3b82f6', fontSize: '0.7rem' }}>
                          {p.points} {t('operations_board_points') || 'pts'}
                        </Badge>
                      )}
                    </div>
                    {p.notes && <p className="text-muted-foreground text-xs">{p.notes}</p>}
                    {p.createdAt && (
                      <span className="text-xs text-muted-foreground block">
                        {formatDateTime(p.createdAt, lang)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Box>
        )}

        {tab === 'comments' && card.type === 'workflow' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('operations_board_no_comments') || 'No comments yet.'}
                </p>
              ) : (
                <div className="flex flex-col">
                  {comments.map((c, idx) => (
                    <div
                      key={idx}
                      className="py-3 text-sm"
                      style={{
                        borderBottom: idx < comments.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                      }}
                    >
                      <p className="text-foreground">{c.comment || c.text}</p>
                      {c.createdAt && (
                        <span className="text-xs text-muted-foreground block mt-1">
                          {formatDateTime(c.createdAt, lang)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
