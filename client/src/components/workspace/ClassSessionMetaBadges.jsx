import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { BOARD_PARTICIPATION_COLOR } from '@constants/workspaceStatusColors.js';

export function getClassSessionMetaFromStatus(status, options = {}) {
  const hideNotesParticipation = options.hideNotesParticipation === true;
  const hideNotesComments = options.hideNotesComments === true;
  if (!status) {
    return { notesCount: 0, participationCount: 0, commentsCount: 0 };
  }
  const toCount = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  return {
    notesCount: (hideNotesParticipation || hideNotesComments) ? 0 : toCount(status.notesCount),
    participationCount: hideNotesParticipation ? 0 : toCount(status.participationCount),
    commentsCount: hideNotesComments ? 0 : toCount(status.workflowCommentsCount ?? status.commentsCount),
  };
}

export default function ClassSessionMetaBadges({
  status,
  t = (k) => k,
  zoomFactor = 1,
  compact = false,
  className = '',
  hideNotesParticipation = false,
  hideNotesComments = false,
}) {
  const { notesCount, participationCount, commentsCount } = getClassSessionMetaFromStatus(status, { hideNotesParticipation, hideNotesComments });
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
        <ColoredTooltip title={`${notesCount} ${t('operations_board_notes') || 'Notes'}`} color="#ef4444" placement="top">
          <span style={{ ...badgeStyle, color: '#ef4444' }}>
            <Star size={iconSize} fill="#ef4444" color="#ef4444" />
            <span>{notesCount}</span>
          </span>
        </ColoredTooltip>
      )}
      {participationCount > 0 && (
        <ColoredTooltip
          title={`${participationCount} ${t('operations_board_participation') || 'Participation'}`}
          color={BOARD_PARTICIPATION_COLOR}
          placement="top"
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
          color="#3b82f6"
          placement="top"
        >
          <span style={{ ...badgeStyle, color: '#3b82f6' }}>
            <MessageSquare size={iconSize} color="#3b82f6" />
            <span>{commentsCount}</span>
          </span>
        </ColoredTooltip>
      )}
    </span>
  );
}
