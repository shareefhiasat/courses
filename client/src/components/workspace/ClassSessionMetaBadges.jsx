import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { BOARD_PARTICIPATION_COLOR, BOARD_COMMENT_COLOR } from '@constants/workspaceStatusColors.js';

export function getClassSessionMetaFromStatus(status, options = {}) {
  const hideNotesParticipation = options.hideNotesParticipation === true;
  const hideNotesComments = options.hideNotesComments === true;
  const hideParticipation = options.hideParticipation === true;
  if (!status) {
    return { notesCount: 0, participationCount: 0, commentsCount: 0 };
  }
  const toCount = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  return {
    notesCount: (hideNotesParticipation || hideNotesComments) ? 0 : toCount(status.notesCount),
    participationCount: (hideNotesParticipation || hideParticipation) ? 0 : toCount(status.participationCount),
    commentsCount: hideNotesComments ? 0 : toCount(status.workflowCommentsCount ?? status.commentsCount),
  };
}

function toThreePartName(fullName) {
  if (!fullName) return '';
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length <= 3) return fullName;
  return `${parts[0]} ${parts[1]} ${parts[parts.length - 1]}`;
}

function formatParticipantName(record, lang) {
  if (lang === 'ar') {
    const arName = toThreePartName(record.studentNameAr) || toThreePartName(record.studentName);
    if (arName) return arName;
    return record.studentName || '—';
  }
  const enName = toThreePartName(record.studentName);
  if (enName) return enName;
  return '—';
}

function formatParticipationNote(record, lang) {
  if (record.comment) return record.comment;
  if (lang === 'ar' && record.descriptionAr) return record.descriptionAr;
  if (record.descriptionEn) return record.descriptionEn;
  return '';
}

function formatMark(record, t) {
  if (record.points == null) return '';
  const sign = record.isPositive !== false ? '+' : '−';
  return `${sign}${record.points}`;
}

function NotesTooltip({ records, count, t, lang, isRTL }) {
  const header = t('operations_board_notes_count', { count }) || `${count} ${count === 1 ? 'Note' : 'Notes'}`;
  const studentLabel = t('operations_board_note_student') || 'Student';
  const noteLabel = t('operations_board_note_text') || 'Note';
  const gridStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '10px', alignItems: 'start' };
  const cellStyle = { whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, padding: '8px 0', minWidth: 320, maxWidth: 480, maxHeight: 320, textAlign: isRTL ? 'right' : 'left' }}
    >
      <div style={{ fontWeight: 600, paddingBottom: 2 }}>{header}</div>
      <div style={{ ...gridStyle, fontWeight: 600, padding: '4px 0', borderBottom: '1px solid rgba(128,128,128,0.25)' }}>
        <span style={cellStyle}>{studentLabel}</span>
        <span style={cellStyle}>{noteLabel}</span>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {records.map((record, index) => (
          <div
            key={record.id ?? index}
            style={{ ...gridStyle, padding: '5px 0', borderBottom: index < records.length - 1 ? '1px solid rgba(128,128,128,0.15)' : 'none' }}
          >
            <span style={cellStyle}>{formatParticipantName(record, lang)}</span>
            <span style={cellStyle}>{record.note || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParticipationTooltip({ records, count, t, lang, isRTL }) {
  const header = t('operations_board_participation_count', { count });
  const studentLabel = t('operations_board_participation_student') || 'Student';
  const markLabel = t('operations_board_participation_mark') || 'Mark';
  const noteLabel = t('operations_board_participation_note') || 'Note';
  const gridStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) auto minmax(0, 1fr)', gap: '10px', alignItems: 'start' };
  const cellStyle = { whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 };
  const markStyle = { ...cellStyle, whiteSpace: 'nowrap', textAlign: 'center', fontWeight: 600 };
  const mutedStyle = { opacity: 0.75, fontSize: 12, ...cellStyle };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, padding: '8px 0', minWidth: 320, maxWidth: 480, maxHeight: 320, textAlign: isRTL ? 'right' : 'left' }}
    >
      <div style={{ fontWeight: 600, paddingBottom: 2 }}>{header}</div>
      <div style={{ ...gridStyle, fontWeight: 600, padding: '4px 0', borderBottom: '1px solid rgba(128,128,128,0.25)' }}>
        <span style={cellStyle}>{studentLabel}</span>
        <span style={markStyle}>{markLabel}</span>
        <span style={cellStyle}>{noteLabel}</span>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {records.map((record, index) => {
          const note = formatParticipationNote(record, lang);
          return (
            <div
              key={record.id ?? index}
              style={{ ...gridStyle, padding: '5px 0', borderBottom: index < records.length - 1 ? '1px solid rgba(128,128,128,0.15)' : 'none' }}
            >
              <span style={cellStyle}>{formatParticipantName(record, lang)}</span>
              <span style={markStyle}>{formatMark(record, t)}</span>
              <span style={mutedStyle}>{note || '—'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ClassSessionMetaBadges({
  status,
  t = (k) => k,
  zoomFactor = 1,
  compact = false,
  className = '',
  hideNotesParticipation = false,
  hideNotesComments = false,
  hideParticipation = false,
}) {
  const { lang, isRTL } = useLang();
  const { notesCount, participationCount, commentsCount } = getClassSessionMetaFromStatus(status, { hideNotesParticipation, hideNotesComments, hideParticipation });
  const notesRecords = status?.notesRecords || [];
  const participationRecords = status?.participationRecords || [];
  if (!notesCount && !participationCount && !commentsCount) return null;

  const iconSize = Math.round((compact ? 10 : 11) * zoomFactor);
  const fontSize = `${0.68 * zoomFactor}rem`;

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    lineHeight: 1,
    fontSize,
    fontWeight: 700,
    flexShrink: 0,
  };

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? 4 : 6, flexShrink: 0 }}
      aria-label={t('operations_board_session_meta') || 'Session notes and activity'}
    >
      {notesCount > 0 && (
        <ColoredTooltip
          title={(
            <NotesTooltip
              records={notesRecords}
              count={notesCount}
              t={t}
              lang={lang}
              isRTL={isRTL}
            />
          )}
          color="#ef4444"
          placement="top"
          slotProps={{ tooltip: { sx: { maxWidth: 480 } } }}
        >
          <span style={{ ...badgeStyle, color: '#ef4444' }}>
            <Star size={iconSize} fill="#ef4444" color="#ef4444" />
            <span>{notesCount}</span>
          </span>
        </ColoredTooltip>
      )}
      {participationCount > 0 && (
        <ColoredTooltip
          title={(
            <ParticipationTooltip
              records={participationRecords}
              count={participationCount}
              t={t}
              lang={lang}
              isRTL={isRTL}
            />
          )}
          color={BOARD_PARTICIPATION_COLOR}
          placement="top"
          slotProps={{ tooltip: { sx: { maxWidth: 480 } } }}
        >
          <span style={{ ...badgeStyle, color: BOARD_PARTICIPATION_COLOR }}>
            <Star size={iconSize} fill={BOARD_PARTICIPATION_COLOR} color={BOARD_PARTICIPATION_COLOR} />
            <span>{participationCount}</span>
          </span>
        </ColoredTooltip>
      )}
      {commentsCount > 0 && (
        <ColoredTooltip
          title={`${commentsCount} ${t('operations_board_tab_comments') || 'Comments'}`}
          color={BOARD_COMMENT_COLOR}
          placement="top"
        >
          <span style={{ ...badgeStyle, color: BOARD_COMMENT_COLOR }}>
            <MessageSquare size={iconSize} color={BOARD_COMMENT_COLOR} />
            <span>{commentsCount}</span>
          </span>
        </ColoredTooltip>
      )}
    </span>
  );
}
