import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  KanbanProvider,
  KanbanBoard,
  KanbanCards,
  KanbanCard,
} from '@/components/kibo-ui/kanban';
import { Star, ChevronRight, ChevronLeft, Circle, NotebookPen, Award, Loader2, Lock, GitBranch, FilePenLine, FileBarChart, FileText, FileSpreadsheet, Layers, CheckCircle2, ExternalLink, Paperclip } from 'lucide-react';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import BoardLaneHeader from './BoardLaneHeader.jsx';
import {
  resolveBoardStudentName,
} from './operationsBoardDisplayUtils.js';
import { canMoveAttendanceToColumn } from './attendanceBoardRules.js';
import {
  isHROnlyViewer,
  canViewParticipation,
  mapAttendanceBoardDataForHR,
  maskAttendanceColumnForHR,
  maskAttendanceStatsForHR,
} from './hrAttendancePrivacy.js';
import { fetchAttendanceStats, ATTENDANCE_COLUMNS, ATTENDANCE_BOARD_LANES, updateAttendanceNotes, createAttendanceNote } from '@services/business/operationsBoardService.js';
import { getParticipationsByClassAndDate, createParticipation } from '@services/business/participationService.js';
import { formatDateShort } from '@utils/date-formatter.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { useAuth } from '@contexts/AuthContext';
import { exportStudentSummaryReport } from '@services/business/studentSummaryReportService.js';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';
import AttendanceStatusDots from './AttendanceStatusDots.jsx';
import { ATTENDANCE_BOARD_COLORS, BOARD_PARTICIPATION_COLOR, WORKFLOW_STATUS_COLORS } from '@constants/workspaceStatusColors';

const CARD_ORDER_KEY = 'operations_board_card_order';

// Daily workflow statuses shown in the lock tooltip, in pipeline order.
const LOCK_STATUS_ROWS = [
  { key: 'DRAFT', labelKey: 'workflow.inbox.statusDraft', fallback: 'Draft' },
  { key: 'SUBMITTED', labelKey: 'workflow.inbox.statusSubmitted', fallback: 'Confirmed' },
  { key: 'UNDER_ADMIN_REVIEW', labelKey: 'workflow.inbox.statusUnderAdminReview', fallback: 'Admin Review' },
  { key: 'UNDER_HR_REVIEW', labelKey: 'workflow.inbox.statusUnderHrReview', fallback: 'HR Review' },
  { key: 'REJECTED', labelKey: 'workflow.inbox.statusRejected', fallback: 'Rejected' },
  { key: 'APPROVED', labelKey: 'workflow.inbox.approved', fallback: 'Approved' },
];

function LockReasonContent({ lockReason, lockReasonType, lockStatusCounts, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, minWidth: 160 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
        <Lock size={12} color="#dc2626" />
        {lockReasonType === 'weekly' && <GitBranch size={12} color="#dc2626" />}
        {lockReasonType === 'daily' && <FilePenLine size={12} color="#dc2626" />}
        <span>{lockReason}</span>
      </div>
      {lockStatusCounts && LOCK_STATUS_ROWS.map((row) => (
        <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <GitBranch size={12} color={WORKFLOW_STATUS_COLORS[row.key]} strokeWidth={2.5} style={{ flexShrink: 0 }} />
          <span style={{ color: WORKFLOW_STATUS_COLORS[row.key], fontWeight: 600, minWidth: 14, textAlign: 'end' }}>
            {lockStatusCounts[row.key] || 0}
          </span>
          <span style={{ color: WORKFLOW_STATUS_COLORS[row.key] }}>{t(row.labelKey) || row.fallback}</span>
        </div>
      ))}
    </div>
  );
}

function scalePx(base, fontScale = 100) {
  return Math.max(6, Math.round(base * (fontScale / 100)));
}

function BoardStatusDot({ column, fontScale = 100 }) {
  const color = ATTENDANCE_BOARD_COLORS[column] || '#6b7280';
  const dotSize = scalePx(8, fontScale);
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${column === ATTENDANCE_BOARD_LANES.NOT_TAKEN ? gridStyles.legendDotPulse : ''}`}
      style={{ backgroundColor: color, '--dot-color': color, width: dotSize, height: dotSize }}
      aria-hidden
    />
  );
}

function getCardOrderKey(classId, date) {
  return `${CARD_ORDER_KEY}_${classId}_${date}`;
}

function loadCardOrder(classId, date) {
  try {
    const raw = localStorage.getItem(getCardOrderKey(classId, date));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCardOrder(classId, date, orderMap) {
  try {
    localStorage.setItem(getCardOrderKey(classId, date), JSON.stringify(orderMap));
  } catch {}
}

function getItemOrderId(item) {
  return item.userId || item.id;
}

function getStoredIndex(stored, column, item) {
  const colOrder = stored?.[column];
  if (!Array.isArray(colOrder)) return -1;
  const stableId = getItemOrderId(item);
  let idx = colOrder.indexOf(stableId);
  if (idx === -1) idx = colOrder.indexOf(item.id);
  return idx;
}

function sortDataForBoard(data, sortBy, classId, date, lang) {
  if (sortBy === 'alpha') {
    const byColumn = {};
    for (const item of data) {
      const col = item.column || '_';
      if (!byColumn[col]) byColumn[col] = [];
      byColumn[col].push(item);
    }
    const sorted = [];
    for (const items of Object.values(byColumn)) {
      items.sort((a, b) =>
        resolveBoardStudentName(a, lang).localeCompare(
          resolveBoardStudentName(b, lang),
          undefined,
          { sensitivity: 'base', numeric: true },
        ),
      );
      sorted.push(...items);
    }
    return sorted;
  }
  return applyStoredOrder(data, classId, date);
}

function applyStoredOrder(data, classId, date) {
  const stored = loadCardOrder(classId, date);
  if (!stored) return data;
  return [...data].sort((a, b) => {
    const aOrder = getStoredIndex(stored, a.column, a);
    const bOrder = getStoredIndex(stored, b.column, b);
    const aKnown = aOrder !== -1;
    const bKnown = bOrder !== -1;
    if (!aKnown && !bKnown) return 0;
    if (!aKnown) return 1;
    if (!bKnown) return -1;
    return aOrder - bOrder;
  });
}

function resolveDropColumn(over, columns, data) {
  if (!over) return null;
  const overItem = data.find((item) => item.id === over.id);
  if (overItem) return overItem.column;
  return columns.find((col) => col.id === over.id)?.id || null;
}

function AttendanceCardHoverTooltip({ item, stats, participationCount, participationItems = [], t, lang, roleContext = {}, columns = [], onMoveLeft, onMoveRight, onQuickAction, onActionBanner, readOnly = false, lockReason = '', lockReasonType = '', lockStatusCounts = null }) {
  const { user } = useAuth();
  const studentName = resolveBoardStudentName(item, lang);
  const runReport = (scope, format) => (e) => {
    e.stopPropagation();
    exportStudentSummaryReport({
      student: {
        studentId: item.userId,
        studentNumber: item.studentNumber,
        studentName: item.nameEn || item.name,
        studentNameAr: item.nameAr,
        rankEn: item.rankEn,
        rankAr: item.rankAr,
      },
      classId: item.classId,
      scope,
      format,
      lang,
      user,
      notify: false,
      metadata: {
        className: item.classNameEn || item.className,
        classNameAr: item.classNameAr,
        subjectName: item.subjectName,
        programName: item.programName,
      },
    }).then(({ blob, filename } = {}) => {
      if (!onActionBanner || !blob) return;
      const blobUrl = URL.createObjectURL(blob);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
      const openFile = () => {
        if (format === 'excel') {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename || 'export.xlsx';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          window.open(blobUrl, '_blank');
        }
      };
      const fmt = format === 'excel' ? 'Excel' : 'PDF';
      const done = lang === 'ar' ? 'تم التصدير بنجاح' : 'Export successful';
      const openLabel = lang === 'ar' ? 'فتح الملف' : 'Open file';
      onActionBanner({
        pillColor: '#059669',
        icon: <CheckCircle2 size={16} className="shrink-0" />,
        message: `${t('report_student_summary') || 'Student Summary Report'} — ${fmt} — ${done}`,
        action: { label: openLabel, icon: <ExternalLink size={14} />, onClick: openFile },
      });
    }).catch((err) => console.error('[Board] student summary export failed:', err));
  };
  const displayColumn = maskAttendanceColumnForHR(item.column, roleContext);
  const statusCol = ATTENDANCE_COLUMNS.find((c) => c.id === displayColumn);
  const statusLabel = statusCol ? (t(statusCol.i18nKey) || statusCol.name) : displayColumn;
  const statusColor = statusCol?.color || ATTENDANCE_BOARD_COLORS.NOT_TAKEN;
  const maskedStats = maskAttendanceStatsForHR(stats, roleContext);
  const hidePrivacy = isHROnlyViewer(roleContext);
  const isInstructorOnly = roleContext?.isInstructor && !roleContext?.isAdmin && !roleContext?.isHR && !roleContext?.isSuperAdmin;
  const showParticipation = canViewParticipation(roleContext);
  const isRTL = lang === 'ar';
  const labelColor = '#64748b';
  const nameColor = '#1e293b';
  // Note/attachment saved when the card was moved to Excused/Human Case.
  const attachmentUrl = item.attachmentUrl || item.raw?.attachmentUrl || null;
  const attachmentName = item.attachmentName || item.raw?.attachmentName || null;
  const canReviseNote = !readOnly && !hidePrivacy && !!onQuickAction;

  const colIds = (columns || []).map((c) => c.id);
  const currentIdx = colIds.indexOf(item.column);
  const canRevert = currentIdx > 0 && canMoveAttendanceToColumn(colIds[currentIdx - 1], roleContext);
  const canAdvance = currentIdx >= 0 && currentIdx < colIds.length - 1 && canMoveAttendanceToColumn(colIds[currentIdx + 1], roleContext);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ maxWidth: 384, minWidth: 240, fontSize: '0.75rem', lineHeight: 1.45, color: labelColor }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <BoardStudentAvatar
          name={studentName}
          profileImageUrl={item.profileImageUrl}
          size="md"
          borderColor={statusColor}
        />
        <div style={{ fontWeight: 700, color: nameColor }}>{studentName}</div>
      </div>
      {item.studentNumber && (
        <div style={{ marginBottom: 2 }}>
          <span>{t('operations_board_profile_student_number') || 'Student Number'}: </span>
          <span style={{ color: nameColor, fontWeight: 500 }}>{item.studentNumber}</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: statusColor,
            flexShrink: 0,
          }}
        />
        <span style={{ color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
      </div>
      {readOnly && lockReason && (
        <div style={{ marginBottom: 8, padding: 8, borderRadius: 6, backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 500 }}>
          <LockReasonContent lockReason={lockReason} lockReasonType={lockReasonType} lockStatusCounts={lockStatusCounts} t={t} />
        </div>
      )}
      {!readOnly && (canRevert || canAdvance) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          {canRevert && (
            <button
              type="button"
              onClick={(e) => onMoveLeft(item, e)}
              aria-label={t('operations_board_quick_revert') || 'Move to previous status'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${statusColor}`, background: 'transparent', cursor: 'pointer',
                color: statusColor, padding: '8px 20px', borderRadius: 4, minWidth: 80,
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${statusColor}1a`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          )}
          {canAdvance && (
            <button
              type="button"
              onClick={(e) => onMoveRight(item, e)}
              aria-label={t('operations_board_quick_advance') || 'Move to next status'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${statusColor}`, background: 'transparent', cursor: 'pointer',
                color: statusColor, padding: '8px 20px', borderRadius: 4, minWidth: 80,
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${statusColor}1a`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          )}
        </div>
      )}
      {maskedStats && maskedStats.total > 0 && !isInstructorOnly && (
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontWeight: 600, fontSize: '0.7rem', marginBottom: 3 }}>
            {t('attendance_summary') || 'Attendance Summary'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {[
              { label: t('present') || 'Present', count: maskedStats.present, color: ATTENDANCE_BOARD_COLORS.PRESENT },
              ...(!hidePrivacy ? [{ label: t('late') || 'Late', count: maskedStats.late, color: ATTENDANCE_BOARD_COLORS.LATE }] : []),
              { label: t('absent') || 'Absent', count: maskedStats.absent, color: ATTENDANCE_BOARD_COLORS.ABSENT },
            ].filter((row) => row.count > 0).map((row) => (
              <span key={row.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: row.color, fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: row.color }} />
                {row.count} {row.label}
              </span>
            ))}
            {(() => {
              const notYet = Math.max(0, (maskedStats.total || 0) - (maskedStats.present || 0) - (maskedStats.late || 0) - (maskedStats.absent || 0));
              return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#6b7280', fontWeight: 600 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#9ca3af' }} />
                  {notYet} {t('operations_board_lane_not_taken') || 'Not yet'}
                </span>
              );
            })()}
          </div>
        </div>
      )}
      {!hidePrivacy && (item.notes || attachmentUrl || participationCount > 0) && (
        <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(148,163,184,0.35)' }}>
          {item.notes && (() => {
            const notesList = (Array.isArray(item.notes) ? item.notes : [item.notes])
              .map((n) => (typeof n === 'string' ? n : n?.note || n?.text || n?.notes || n?.content || ''))
              .filter(Boolean);
            return (
              <ColoredTooltip
                title={notesList.length > 0 ? (
                  <div style={{ textAlign: 'start' }}>
                    {notesList.map((noteText, idx) => (
                      <div key={idx} style={{ whiteSpace: 'pre-wrap' }}>
                        {notesList.length > 1 ? `• ${noteText}` : noteText}
                      </div>
                    ))}
                  </div>
                ) : (t('operations_board_has_note') || 'Has a note')}
                color="#ef4444"
                placement="top"
              >
                <div
                  role={canReviseNote ? 'button' : undefined}
                  onClick={canReviseNote ? (e) => { e.stopPropagation(); onQuickAction(item, 'note'); } : undefined}
                  style={{ marginBottom: 2, color: '#ef4444', fontWeight: 600, cursor: canReviseNote ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <NotebookPen size={12} />
                  {notesList.length || 1} {t('operations_board_has_note') || 'Has a note'}
                </div>
              </ColoredTooltip>
            );
          })()}
          {attachmentUrl && (
            <ColoredTooltip
              title={attachmentName || t('operations_board_view_attachment') || 'View attachment'}
              color="#0ea5e9"
              placement="top"
            >
              <div
                role="button"
                onClick={(e) => { e.stopPropagation(); window.open(attachmentUrl, '_blank', 'noopener,noreferrer'); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 2, color: '#0ea5e9', fontWeight: 600, cursor: 'pointer' }}
              >
                <Paperclip size={12} />
                {attachmentName || (t('operations_board_view_attachment') || 'View attachment')}
              </div>
            </ColoredTooltip>
          )}
          {showParticipation && participationCount > 0 && (() => {
            const formatDayMonth = (date) => {
              const formatted = formatDateShort(date, lang);
              if (!formatted) return '—';
              const [day, month] = formatted.split(' ');
              return `${Number(day)} ${month || ''}`;
            };
            const participationRows = (participationItems || []).filter(Boolean);
            const cellStyle = { padding: '3px 6px', borderInlineEnd: '1px solid rgba(148,163,184,0.35)', verticalAlign: 'top', textAlign: 'start' };
            const lastCellStyle = { padding: '3px 6px', verticalAlign: 'top', textAlign: 'start' };
            return (
              <div style={{ marginTop: 4 }}>
                <div style={{ color: BOARD_PARTICIPATION_COLOR, fontWeight: 600, marginBottom: 4 }}>
                  {participationCount} {t('operations_board_participation') || 'Participation'}
                  {participationCount > 1 ? 's' : ''}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', color: labelColor }}>
                  <thead>
                    <tr style={{ color: BOARD_PARTICIPATION_COLOR, borderBottom: '1px solid rgba(148,163,184,0.5)' }}>
                      <th style={{ ...cellStyle, fontWeight: 600, width: '36%' }}>{t('student') || 'Student'}</th>
                      <th style={{ ...cellStyle, fontWeight: 600, width: '16%', textAlign: 'center' }}>{t('mark') || 'Mark'}</th>
                      <th style={{ ...cellStyle, fontWeight: 600, width: '32%' }}>{t('note') || 'Note'}</th>
                      <th style={{ ...lastCellStyle, fontWeight: 600, width: '16%', whiteSpace: 'nowrap' }}>{t('date') || 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participationRows.map((p, idx) => {
                      const note = lang === 'ar'
                        ? (p?.descriptionAr || p?.descriptionEn || p?.description || p?.comment || '')
                        : (p?.descriptionEn || p?.descriptionAr || p?.description || p?.comment || '');
                      const points = p?.points;
                      const mark = points == null ? '—' : (points > 0 ? `+${points}` : String(points));
                      return (
                        <tr key={p.id || idx} style={{ borderBottom: idx < participationRows.length - 1 ? '1px solid rgba(148,163,184,0.2)' : 'none' }}>
                          <td style={cellStyle}>{getLocalizedUserName(p?.user, lang, studentName)}</td>
                          <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 600 }}>{mark}</td>
                          <td style={cellStyle}>{note || '—'}</td>
                          <td style={{ ...lastCellStyle, whiteSpace: 'nowrap' }}>{formatDayMonth(p?.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}
      {((!readOnly && !hidePrivacy && onQuickAction) || item.userId) && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.35)' }}>
          {!readOnly && !hidePrivacy && onQuickAction && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <button
              type="button"
              onClick={() => onQuickAction(item, 'note')}
              aria-label={t('operations_board_add_note') || 'Add note'}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '6px 2px', border: 'none', borderRadius: 4, cursor: 'pointer',
                background: 'rgba(148,163,184,0.12)', color: '#f97316', fontSize: '0.65rem', fontWeight: 600,
              }}
            >
              <NotebookPen size={14} />
              <span>{t('note') || 'Note'}</span>
            </button>
            {showParticipation && (
            <button
              type="button"
              onClick={() => onQuickAction(item, 'participation')}
              aria-label={t('operations_board_add_participation') || 'Add participation'}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '6px 2px', border: 'none', borderRadius: 4, cursor: 'pointer',
                background: 'rgba(148,163,184,0.12)', color: '#38bdf8', fontSize: '0.65rem', fontWeight: 600,
              }}
            >
              <Award size={14} />
              <span>{t('participation') || 'Participation'}</span>
            </button>
            )}
          </div>
          )}
          {item.userId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: (!readOnly && !hidePrivacy && onQuickAction) ? 6 : 0 }}>
            {[
              { scope: 'class', label: t('report_student_summary_class') || 'Student Summary — This class', Icon: FileBarChart, color: '#0ea5e9' },
              { scope: 'all', label: t('report_student_summary_all') || 'Student Summary — All classes', Icon: Layers, color: '#8b5cf6' },
            ].map(({ scope, label, Icon, color }) => (
              <div key={scope} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={14} color={color} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.7rem', fontWeight: 600, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{label}</span>
                <ColoredTooltip title={t('export_pdf') || 'PDF'} color="#e53935" placement="top">
                  <button
                    type="button"
                    onClick={runReport(scope, 'pdf')}
                    aria-label={`${label} — PDF`}
                    style={{ display: 'inline-flex', alignItems: 'center', border: 'none', background: 'none', padding: 2, cursor: 'pointer' }}
                  >
                    <FileText size={14} color="#e53935" />
                  </button>
                </ColoredTooltip>
                <ColoredTooltip title={t('export_excel') || 'Excel'} color="#43a047" placement="top">
                  <button
                    type="button"
                    onClick={runReport(scope, 'excel')}
                    aria-label={`${label} — Excel`}
                    style={{ display: 'inline-flex', alignItems: 'center', border: 'none', background: 'none', padding: 2, cursor: 'pointer' }}
                  >
                    <FileSpreadsheet size={14} color="#43a047" />
                  </button>
                </ColoredTooltip>
              </div>
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AttendanceBoard({
  data,
  columns,
  onDragEnd,
  onCardClick,
  onDragRejected,
  onCardUpdated,
  t,
  lang = 'en',
  roleContext = {},
  sortBy = 'system',
  onLaneResize,
  onLaneWidthsReset,
  onLaneAutoFit,
  disableLaneReset = false,
  collapsedLanes = new Set(),
  onToggleLaneCollapse,
  onBulkMove,
  onActionBanner,
  participationRefreshKey = 0,
  fontScale = 100,
  showAvatars = true,
  style,
  readOnly = false,
  lockReason = '',
  lockReasonType = '',
  lockStatusCounts = null,
}) {
  const isRTL = lang === 'ar';
  const hrViewer = isHROnlyViewer(roleContext);
  const isInstructorOnly = roleContext?.isInstructor && !roleContext?.isAdmin && !roleContext?.isHR && !roleContext?.isSuperAdmin;
  const participationViewer = canViewParticipation(roleContext);
  const sourceData = hrViewer ? mapAttendanceBoardDataForHR(data, roleContext) : data;

  const [boardData, setBoardData] = useState(() => {
    const classId = sourceData[0]?.classId;
    const date = sourceData[0]?.date;
    return sortDataForBoard(sourceData, sortBy, classId, date, lang);
  });
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [participationMap, setParticipationMap] = useState({});
  const [quickAction, setQuickAction] = useState({ open: false, item: null, type: null, text: '', points: 1, saving: false, error: null });
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const dragOriginRef = useRef(null);
  const draggingRef = useRef(false);
  const lastSelectedRef = useRef(null);

  const classId = sourceData[0]?.classId;
  const date = sourceData[0]?.date;

  useEffect(() => {
    if (!draggingRef.current) {
      const next = sortDataForBoard(sourceData, sortBy, classId, date, lang);
      setBoardData(next);
    }
    setSelectedIds(new Set());
    lastSelectedRef.current = null;
  }, [sourceData, classId, date, sortBy, lang]);

  useEffect(() => {
    if (!classId || !date || !participationViewer) {
      setParticipationMap({});
      return;
    }
    let cancelled = false;
    getParticipationsByClassAndDate(classId, date).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        const map = {};
        for (const p of result.data) {
          const uid = String(p.userId);
          if (!map[uid]) map[uid] = [];
          map[uid].push(p);
        }
        setParticipationMap(map);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [classId, date, participationRefreshKey, participationViewer]);

  useEffect(() => {
    if (!classId || isInstructorOnly) { setAttendanceStats(null); return; }
    let cancelled = false;
    fetchAttendanceStats(classId).then((result) => {
      if (!cancelled && result.success) {
        setAttendanceStats(result.data);
      }
    });
    return () => { cancelled = true; };
  }, [classId, isInstructorOnly]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = useCallback((event) => {
    draggingRef.current = true;
    const item = boardData.find((d) => d.id === event.active.id);
    dragOriginRef.current = item?.column || null;
  }, [boardData]);

  const persistCardOrder = useCallback((items) => {
    const orderMap = {};
    for (const col of columns) {
      orderMap[col.id] = items.filter((d) => d.column === col.id).map((d) => getItemOrderId(d));
    }
    saveCardOrder(classId, date, orderMap);
  }, [columns, classId, date]);

  const handleDragEnd = useCallback((event) => {
    draggingRef.current = false;
    const fromColumn = dragOriginRef.current;
    dragOriginRef.current = null;

    if (readOnly) {
      setBoardData(sortDataForBoard(data, sortBy, classId, date, lang));
      if (lockReason) {
        onDragRejected?.({ type: 'locked', message: lockReason });
      }
      return;
    }

    const { active, over } = event;
    if (!over || !active) {
      setBoardData(sortDataForBoard(data, sortBy, classId, date, lang));
      return;
    }

    const toColumn = resolveDropColumn(over, columns, boardData);
    if (!fromColumn || !toColumn) {
      setBoardData(sortDataForBoard(data, sortBy, classId, date, lang));
      return;
    }

    if (fromColumn === toColumn) {
      setBoardData((prev) => {
        if (sortBy === 'system') persistCardOrder(prev);
        return sortDataForBoard(prev, sortBy, classId, date, lang);
      });
      return;
    }

    if (!canMoveAttendanceToColumn(toColumn, roleContext)) {
      onDragRejected?.(toColumn);
      setBoardData(sortDataForBoard(data, sortBy, classId, date, lang));
      return;
    }

    // Multi-select drag: if the dragged card is selected, move all selected
    // cards in the same lane together. Note: dragOver already moved the
    // dragged card out of fromColumn in boardData, so include it explicitly.
    const moveIds = selectedIds.has(active.id)
      ? [...new Set([active.id, ...boardData.filter((d) => d.column === fromColumn && selectedIds.has(d.id)).map((d) => d.id)])]
      : [active.id];

    setBoardData((prev) => {
      const next = prev.map((item) => (moveIds.includes(item.id) ? { ...item, column: toColumn } : item));
      if (sortBy === 'system') persistCardOrder(next);
      return sortDataForBoard(next, sortBy, classId, date, lang);
    });

    if (moveIds.length > 1 && onBulkMove) {
      setSelectedIds(new Set());
      lastSelectedRef.current = null;
      onBulkMove(fromColumn, toColumn, moveIds);
    } else {
      onDragEnd?.(active.id, fromColumn, toColumn);
    }
  }, [boardData, columns, data, classId, date, lang, sortBy, onDragEnd, onDragRejected, roleContext, persistCardOrder, readOnly, lockReason, selectedIds, onBulkMove]);

  const handleDragCancel = useCallback(() => {
    draggingRef.current = false;
    dragOriginRef.current = null;
    setBoardData(sortDataForBoard(data, sortBy, classId, date, lang));
  }, [data, sortBy, classId, date, lang]);

  const handleQuickAdvance = useCallback((item, e) => {
    if (readOnly) return;
    e.stopPropagation();
    const colIds = columns.map((c) => c.id);
    const currentIdx = colIds.indexOf(item.column);
    const nextIdx = currentIdx + 1;
    if (nextIdx >= colIds.length) return;
    const toColumn = colIds[nextIdx];
    if (!canMoveAttendanceToColumn(toColumn, roleContext)) return;
    setBoardData((prev) => {
      const next = prev.map((d) => (d.id === item.id ? { ...d, column: toColumn } : d));
      if (sortBy === 'system') persistCardOrder(next);
      return sortDataForBoard(next, sortBy, classId, date, lang);
    });
    onDragEnd?.(item.id, item.column, toColumn);
  }, [columns, roleContext, sortBy, persistCardOrder, onDragEnd, classId, date, lang, readOnly]);

  const handleQuickRevert = useCallback((item, e) => {
    if (readOnly) return;
    e.stopPropagation();
    const colIds = columns.map((c) => c.id);
    const currentIdx = colIds.indexOf(item.column);
    const prevIdx = currentIdx - 1;
    if (prevIdx < 0) return;
    const toColumn = colIds[prevIdx];
    if (!canMoveAttendanceToColumn(toColumn, roleContext)) return;
    setBoardData((prev) => {
      const next = prev.map((d) => (d.id === item.id ? { ...d, column: toColumn } : d));
      if (sortBy === 'system') persistCardOrder(next);
      return sortDataForBoard(next, sortBy, classId, date, lang);
    });
    onDragEnd?.(item.id, item.column, toColumn);
  }, [columns, roleContext, sortBy, persistCardOrder, onDragEnd, classId, date, lang, readOnly]);

  const handleCardSelect = useCallback((item, e) => {
    const isRange = e.shiftKey;
    e.stopPropagation();
    e.preventDefault();
    if (isRange && lastSelectedRef.current && lastSelectedRef.current !== item.id) {
      const anchor = boardData.find((d) => d.id === lastSelectedRef.current);
      if (anchor && anchor.column === item.column) {
        const colItems = boardData.filter((d) => d.column === item.column);
        const aIdx = colItems.findIndex((d) => d.id === anchor.id);
        const bIdx = colItems.findIndex((d) => d.id === item.id);
        if (aIdx !== -1 && bIdx !== -1) {
          const [lo, hi] = aIdx < bIdx ? [aIdx, bIdx] : [bIdx, aIdx];
          const rangeIds = colItems.slice(lo, hi + 1).map((d) => d.id);
          setSelectedIds((prev) => new Set([...prev, ...rangeIds]));
          return;
        }
      }
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
    lastSelectedRef.current = item.id;
  }, [selectedIds.size, boardData]);

  const handleLaneBulkMove = useCallback((fromColumn, toColumn) => {
    const laneSelected = boardData.filter((d) => d.column === fromColumn && selectedIds.has(d.id)).map((d) => d.id);
    setSelectedIds(new Set());
    lastSelectedRef.current = null;
    onBulkMove?.(fromColumn, toColumn, laneSelected.length ? laneSelected : null);
  }, [boardData, selectedIds, onBulkMove]);

  const handleOpenQuickAction = useCallback((item, type) => {
    if (readOnly) return;
    if (type === 'participation' && !participationViewer) return;
    // Prefill existing note so clicking the note icon revises it in place.
    const initialText = type === 'note' && typeof item?.notes === 'string' ? item.notes : '';
    const initialPoints = 1;
    setQuickAction({ open: true, item, type, text: initialText, points: initialPoints, saving: false, error: null });
  }, [readOnly, participationViewer]);

  const handleCloseQuickAction = useCallback(() => {
    setQuickAction({ open: false, item: null, type: null, text: '', points: 1, saving: false, error: null });
  }, []);

  const handleSaveQuickAction = useCallback(async () => {
    const { item, type, text, points } = quickAction;
    if (!item || !text.trim()) return;
    setQuickAction((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const trimmedText = text.trim();
      if (type === 'participation') {
        const createResult = await createParticipation({
          userId: item.userId,
          classId: item.classId,
          description: trimmedText,
          typeId: 1,
          points: Number(points) || 1,
        });
        if (!createResult.success) {
          throw new Error(createResult.error || 'Failed to save participation');
        }
        const result = await getParticipationsByClassAndDate(item.classId, item.date);
        if (result.success && result.data) {
          const map = {};
          for (const p of result.data) {
            const uid = String(p.userId);
            if (!map[uid]) map[uid] = [];
            map[uid].push(p);
          }
          setParticipationMap(map);
        }
      } else if (item.rawId) {
        const result = await updateAttendanceNotes(item.rawId, trimmedText);
        if (!result.success) {
          throw new Error(result.error || 'Failed to update note');
        }
        setBoardData((prev) => prev.map((d) => (d.id === item.id ? { ...d, notes: trimmedText } : d)));
        onCardUpdated?.(item.id, { notes: trimmedText });
      } else {
        const result = await createAttendanceNote({
          userId: item.userId,
          classId: item.classId,
          date: item.date,
          notes: trimmedText,
          programId: item.programId,
          subjectId: item.subjectId,
        });
        if (!result.success) {
          throw new Error(result.error || 'Failed to save note');
        }
        const newRawId = result.data?.id || result.data?.attendance?.id || null;
        setBoardData((prev) => prev.map((d) => (d.id === item.id ? { ...d, notes: trimmedText, rawId: newRawId || d.rawId } : d)));
        onCardUpdated?.(item.id, { notes: trimmedText, rawId: newRawId });
      }
      handleCloseQuickAction();
    } catch (err) {
      console.error('[AttendanceBoard] quick action failed:', err);
      setQuickAction((prev) => ({ ...prev, saving: false, error: err.message || 'Failed to save' }));
    }
  }, [quickAction, handleCloseQuickAction, onCardUpdated]);

  return (
    <>
    <KanbanProvider
      columns={columns}
      data={boardData}
      onDataChange={setBoardData}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      sensors={sensors}
      collisionDetection={pointerWithin}
      className="operations-board-kanban operations-attendance-kanban"
      style={style}
    >
      {(column) => {
        const collapsed = collapsedLanes.has(column.id);
        const laneCount = boardData.filter((d) => d.column === column.id).length;
        const laneSelectedCount = boardData.filter((d) => d.column === column.id && selectedIds.has(d.id)).length;
        const isPermitted = canMoveAttendanceToColumn(column.id, roleContext);
        const laneClass = isPermitted ? 'operations-board-lane-permitted' : 'operations-board-lane-readonly';
        return (
        <KanbanBoard
          id={column.id}
          key={column.id}
          data-testid={`operations-board-column-${column.id}`}
          className={`operations-board-lane ${laneClass}${collapsed ? ' operations-board-lane-collapsed' : ''}`}
          style={{
            '--lane-color': column.color || ATTENDANCE_BOARD_COLORS.NOT_TAKEN,
            direction: isRTL ? 'rtl' : 'ltr',
            ...(collapsed ? { alignSelf: 'start', height: 'fit-content', minHeight: 0 } : {}),
          }}
        >
          {!collapsed && onLaneResize && (
            <ColoredTooltip
              title={disableLaneReset
                ? (t('operations_board_resize_lane_drag_only') || 'Drag to resize lane.')
                : (t('operations_board_resize_lane') || 'Drag to resize lane. Double-click to fit lane to content.')}
              placement="top"
              color={column.color || ATTENDANCE_BOARD_COLORS.NOT_TAKEN}
            >
              <div
                className="operations-board-lane-resize-handle"
                role="separator"
                aria-orientation="vertical"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLaneResize(column.id, e);
                }}
                onDoubleClick={disableLaneReset ? undefined : (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onLaneAutoFit) {
                    onLaneAutoFit(column.id);
                  } else {
                    onLaneWidthsReset?.();
                  }
                }}
                data-testid={`operations-board-lane-resize-${column.id}`}
              />
            </ColoredTooltip>
          )}
          <BoardLaneHeader
            column={column}
            count={laneCount}
            collapsed={collapsed}
            onToggleCollapse={onToggleLaneCollapse}
            t={t}
            pulse
            onBulkMove={onBulkMove ? handleLaneBulkMove : undefined}
            locked={readOnly}
            selectedCount={laneSelectedCount}
            columns={columns}
            canMoveTo={(from, to) => canMoveAttendanceToColumn(to, roleContext)}
            fontScale={fontScale}
          />
          <KanbanCards id={column.id} className={collapsed ? 'operations-board-lane-cards-collapsed !p-1' : undefined}>
            {(item) => {
              const studentName = resolveBoardStudentName(item, lang);
              const stats = maskAttendanceStatsForHR(attendanceStats?.students?.[String(item.userId)], roleContext);
              const participationCount = participationViewer ? (participationMap[String(item.userId)]?.length || 0) : 0;
              const displayColumn = maskAttendanceColumnForHR(item.column, roleContext);
              const statusColor = ATTENDANCE_BOARD_COLORS[displayColumn] || ATTENDANCE_BOARD_COLORS.NOT_TAKEN;
              if (collapsed) {
                const colIds = columns.map((c) => c.id);
                const currentIdx = colIds.indexOf(item.column);
                const canAdvance = !readOnly && currentIdx >= 0 && currentIdx < colIds.length - 1 && canMoveAttendanceToColumn(colIds[currentIdx + 1], roleContext);
                const canRevert = !readOnly && currentIdx > 0 && canMoveAttendanceToColumn(colIds[currentIdx - 1], roleContext);
                const quickBtnStyle = {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: scalePx(28, fontScale),
                  height: scalePx(24, fontScale),
                  boxSizing: 'border-box',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: statusColor,
                  borderRadius: 4,
                  padding: '0 4px',
                };
                return (
                  <KanbanCard
                    column={column.id}
                    id={item.id}
                    key={item.id}
                    name={studentName}
                    className="operations-attendance-card operations-board-card-collapsed py-3 px-2 my-1.5"
                    style={{ '--card-status-color': statusColor, direction: isRTL ? 'rtl' : 'ltr', padding: '4px 14px' }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="flex justify-center"
                        onClick={(e) => {
                          if (readOnly) return;
                          e.stopPropagation();
                          onCardClick(item);
                        }}
                      >
                        {showAvatars ? (
                          <BoardStudentAvatar
                            name={studentName}
                            profileImageUrl={item.profileImageUrl}
                            size="sm"
                            fontScale={fontScale}
                            borderColor={statusColor}
                          />
                        ) : (
                          <div
                            className="flex items-center justify-center rounded-full font-medium text-white"
                            style={{
                              width: scalePx(28, fontScale),
                              height: scalePx(28, fontScale),
                              fontSize: scalePx(10, fontScale),
                              backgroundColor: statusColor,
                            }}
                            aria-label={studentName}
                          >
                            {studentName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      {readOnly && lockReason && (
                        <div className="flex items-center justify-center">
                          <Lock size={scalePx(14, fontScale)} color="#dc2626" />
                        </div>
                      )}
                      {!readOnly && (canRevert || canAdvance) && (
                        <div className="flex items-center justify-center gap-0.5">
                          {canRevert && (
                            <button
                              type="button"
                              aria-label={t('operations_board_quick_revert') || 'Move to previous status'}
                              onClick={(e) => handleQuickRevert(item, e)}
                              style={quickBtnStyle}
                              onMouseEnter={(e) => { e.currentTarget.style.background = `${statusColor}1a`; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              {isRTL ? <ChevronRight size={scalePx(14, fontScale)} /> : <ChevronLeft size={scalePx(14, fontScale)} />}
                            </button>
                          )}
                          {canAdvance && (
                            <button
                              type="button"
                              aria-label={t('operations_board_quick_advance') || 'Move to next status'}
                              onClick={(e) => handleQuickAdvance(item, e)}
                              style={quickBtnStyle}
                              onMouseEnter={(e) => { e.currentTarget.style.background = `${statusColor}1a`; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              {isRTL ? <ChevronLeft size={scalePx(14, fontScale)} /> : <ChevronRight size={scalePx(14, fontScale)} />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </KanbanCard>
                );
              }
              const colIds = columns.map((c) => c.id);
              const currentIdx = colIds.indexOf(item.column);
              const canAdvance = !readOnly && currentIdx >= 0 && currentIdx < colIds.length - 1 && canMoveAttendanceToColumn(colIds[currentIdx + 1], roleContext);
              const canRevert = !readOnly && currentIdx > 0 && canMoveAttendanceToColumn(colIds[currentIdx - 1], roleContext);
              const quickMoveButtonStyle = {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: scalePx(28, fontScale),
                alignSelf: 'stretch',
                minHeight: scalePx(48, fontScale),
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: statusColor,
                flexShrink: 0,
                transition: 'background 0.15s',
              };
              return (
                <KanbanCard
                  column={column.id}
                  id={item.id}
                  key={item.id}
                  name={studentName}
                  className="operations-attendance-card cursor-default py-3 px-2 my-1.5"
                  overlayStack={selectedIds.has(item.id) && selectedIds.size > 1}
                  overlayBadge={selectedIds.has(item.id) && selectedIds.size > 1 ? selectedIds.size : null}
                  style={{
                    '--card-status-color': statusColor,
                    direction: isRTL ? 'rtl' : 'ltr',
                    position: 'relative',
                    padding: '12px 14px',
                    ...(selectedIds.has(item.id) ? {
                      outline: `2px solid ${statusColor}`,
                      outlineOffset: 2,
                      backgroundColor: `${statusColor}14`,
                    } : {}),
                  }}
                >
                  {readOnly && lockReason && (
                    <ColoredTooltip
                      title={(
                        <LockReasonContent
                          lockReason={lockReason}
                          lockReasonType={lockReasonType}
                          lockStatusCounts={lockStatusCounts}
                          t={t}
                        />
                      )}
                      color="#dc2626"
                      placement="bottom"
                      slotProps={{
                        tooltip: { sx: { bgcolor: '#fef2f2', border: '1px solid #fecaca' } },
                        arrow: { sx: { color: '#fef2f2', '&::before': { border: '1px solid #fecaca' } } },
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 4,
                          insetInlineStart: 4,
                          zIndex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        data-testid={`card-lock-${item.id}`}
                      >
                        <Lock size={scalePx(12, fontScale)} color="#dc2626" />
                      </div>
                    </ColoredTooltip>
                  )}
                  <ColoredTooltip
                    title={(
                      <AttendanceCardHoverTooltip
                        item={{ ...item, column: displayColumn }}
                        stats={stats}
                        participationCount={participationCount}
                        participationItems={participationViewer ? (participationMap[String(item.userId)] || []) : []}
                        t={t}
                        lang={lang}
                        roleContext={roleContext}
                        columns={columns}
                        onMoveLeft={handleQuickRevert}
                        onMoveRight={handleQuickAdvance}
                        onQuickAction={handleOpenQuickAction}
                        onActionBanner={onActionBanner}
                        readOnly={readOnly}
                        lockReason={lockReason}
                        lockReasonType={lockReasonType}
                        lockStatusCounts={lockStatusCounts}
                      />
                    )}
                    color={statusColor}
                    placement="top"
                    enterDelay={500}
                    enterNextDelay={300}
                    leaveDelay={300}
                    slotProps={{ tooltip: { sx: { maxWidth: 400 } } }}
                  >
                    <div
                      className="relative flex items-center gap-2.5 select-none py-1 my-2"
                      onClick={(e) => handleCardSelect(item, e)}
                      onDoubleClick={(e) => {
                        if (readOnly) return;
                        e.stopPropagation();
                        onCardClick(item);
                      }}
                      data-selected={selectedIds.has(item.id) || undefined}
                    >
                      {canRevert && (
                        <button
                          aria-label={t('operations_board_quick_revert') || 'Move to previous status'}
                          onClick={(e) => handleQuickRevert(item, e)}
                          data-testid={`card-quick-revert-${item.id}`}
                          style={quickMoveButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.background = `${statusColor}1a`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          {isRTL ? <ChevronRight size={scalePx(14, fontScale)} /> : <ChevronLeft size={scalePx(14, fontScale)} />}
                        </button>
                      )}
                      {showAvatars && (
                        <BoardStudentAvatar
                          name={studentName}
                          profileImageUrl={item.profileImageUrl}
                          size="md"
                          fontScale={fontScale}
                          borderColor={statusColor}
                          className="my-1.5"
                          style={{ marginTop: '6px', marginBottom: '6px' }}
                        />
                      )}
                      <div className="min-w-0 flex-1" style={{ paddingLeft: (showAvatars || canRevert) ? 0 : '0.75rem' }}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <BoardStatusDot column={displayColumn} fontScale={fontScale} />
                          {item.notes && (
                            <Star size={scalePx(8, fontScale)} fill="#ef4444" color="#ef4444" data-testid={`card-notes-star-${item.id}`} style={{ flexShrink: 0 }} />
                          )}
                          {participationCount > 0 && (
                            <Star size={scalePx(8, fontScale)} fill={BOARD_PARTICIPATION_COLOR} color={BOARD_PARTICIPATION_COLOR} data-testid={`card-participation-star-${item.id}`} style={{ flexShrink: 0 }} />
                          )}
                          <p className="m-0 truncate text-sm font-medium leading-tight" style={{ fontSize: scalePx(14, fontScale) }}>{studentName}</p>
                        </div>
                        {stats && !isInstructorOnly && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: scalePx(11, fontScale) }} data-testid={`attendance-summary-${item.id}`}>
                            {stats.total > 0 ? (
                              <>
                                <span className="inline-flex items-center gap-0.5">
                                  <AttendanceStatusDots items={[{ key: 'present', count: 1, color: ATTENDANCE_BOARD_COLORS.PRESENT }]} dotSize={scalePx(10, fontScale)} className="shrink-0" />
                                  {stats.present}
                                </span>
                                {!hrViewer && stats.late > 0 && (
                                <span className="inline-flex items-center gap-0.5">
                                  <AttendanceStatusDots items={[{ key: 'late', count: 1, color: ATTENDANCE_BOARD_COLORS.LATE }]} dotSize={scalePx(10, fontScale)} className="shrink-0" />
                                  {stats.late}
                                </span>
                                )}
                                <span className="inline-flex items-center gap-0.5">
                                  <AttendanceStatusDots items={[{ key: 'absent', count: 1, color: ATTENDANCE_BOARD_COLORS.ABSENT }]} dotSize={scalePx(10, fontScale)} className="shrink-0" />
                                  {stats.absent}
                                </span>
                                <span className="inline-flex items-center gap-0.5">
                                  <AttendanceStatusDots items={[{ key: 'total', count: 1, color: ATTENDANCE_BOARD_COLORS.NOT_TAKEN }]} dotSize={scalePx(10, fontScale)} className="shrink-0" />
                                  {stats.total}
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground/70 py-0.5" style={{ fontSize: scalePx(10, fontScale) }}>{t('operations_board_no_stats_yet') || 'No stats yet'}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {canAdvance && (
                        <button
                          aria-label={t('operations_board_quick_advance') || 'Move to next status'}
                          onClick={(e) => handleQuickAdvance(item, e)}
                          data-testid={`card-quick-advance-${item.id}`}
                          style={quickMoveButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.background = `${statusColor}1a`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          {isRTL ? <ChevronLeft size={scalePx(14, fontScale)} /> : <ChevronRight size={scalePx(14, fontScale)} />}
                        </button>
                      )}
                    </div>
                  </ColoredTooltip>
                </KanbanCard>
              );
            }}
          </KanbanCards>
        </KanbanBoard>
        );
      }}
    </KanbanProvider>

    <Dialog open={quickAction.open} onClose={handleCloseQuickAction} maxWidth="xs" fullWidth>
      <DialogTitle style={{ fontSize: '1rem' }}>
        {quickAction.type === 'note' && (t('note') || 'Note')}
        {quickAction.type === 'participation' && (t('participation') || 'Participation')}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          value={quickAction.text}
          onChange={(e) => setQuickAction((prev) => ({ ...prev, text: e.target.value, error: null }))}
          placeholder={
            quickAction.type === 'participation'
              ? (t('operations_board_participation_description_placeholder') || 'Participation details...')
              : (t('operations_board_note_prompt') || 'Add a note...')
          }
          disabled={quickAction.saving}
          error={!!quickAction.error}
          helperText={quickAction.error || ''}
          style={{ marginTop: 8 }}
        />
        {quickAction.type === 'participation' && (
          <TextField
            fullWidth
            type="number"
            label={t('operations_board_points') || 'Points'}
            value={quickAction.points}
            onChange={(e) => setQuickAction((prev) => ({ ...prev, points: e.target.value, error: null }))}
            disabled={quickAction.saving}
            style={{ marginTop: 16 }}
            inputProps={{ min: 0 }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseQuickAction} disabled={quickAction.saving} color="inherit">
          {t('cancel') || 'Cancel'}
        </Button>
        <Button onClick={handleSaveQuickAction} disabled={quickAction.saving || !quickAction.text.trim()} variant="contained" color="primary">
          {quickAction.saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : (t('save') || 'Save')}
        </Button>
      </DialogActions>
    </Dialog>

    </>
  );
}
