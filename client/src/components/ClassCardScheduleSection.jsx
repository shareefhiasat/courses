import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getColoredIcon, CLASS_STAT_CONFIGS } from '@constants/iconTypes';
import { formatClassScheduleSummary, formatClassSessionTime } from '../utils/classStatsUtils.js';

const SESSIONS_COLOR = CLASS_STAT_CONFIGS.sessions.color;

export default function ClassCardScheduleSection({
  clsId,
  classStats,
  lang,
  isRTL,
  t,
  theme,
  onSessionSelect
}) {
  const [expanded, setExpanded] = useState(false);
  const stats = classStats[clsId];
  const sessions = stats?.sessionList || [];
  const count = stats?.sessions ?? 0;

  if (!stats) return null;

  const toggleExpanded = (e) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  const handleSessionClick = (e, session) => {
    e.stopPropagation();
    onSessionSelect?.(session);
  };

  if (count <= 0) {
    return (
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'start' }}
      >
        {t('classcard_no_scheduled_sessions')}
      </div>
    );
  }

  const summary = formatClassScheduleSummary(clsId, classStats, lang, t);
  const previewSession = sessions.find((s) => new Date(s.startDateTime) >= new Date()) || sessions[0];
  const hiddenCount = Math.max(0, count - 1);

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.35rem',
          width: '100%',
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: 'var(--muted)',
          fontSize: 10,
          textAlign: 'start'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, minWidth: 0 }}>
          {getColoredIcon('ui', 'calendar', 10, SESSIONS_COLOR, theme)}
          <span style={{ fontWeight: 600, color: SESSIONS_COLOR }}>{summary}</span>
          {!expanded && previewSession && (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              · {formatClassSessionTime(previewSession.startDateTime, lang)}
              {hiddenCount > 0 && (
                <span style={{ marginInlineStart: '0.25rem', opacity: 0.85 }}>
                  {t('classcard_more_sessions', { count: hiddenCount })}
                </span>
              )}
            </span>
          )}
        </span>
        {expanded
          ? <ChevronUp size={12} aria-hidden />
          : <ChevronDown size={12} aria-hidden />}
      </button>

      {expanded && (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            maxHeight: '120px',
            overflowY: 'auto'
          }}
        >
          {sessions.map((session) => (
            <li key={session.id}>
              <button
                type="button"
                onClick={(e) => handleSessionClick(e, session)}
                title={t('classcard_view_session_on_calendar')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.35rem',
                  padding: '0.25rem 0.35rem',
                  borderRadius: '0.25rem',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  background: theme === 'dark' ? '#111827' : '#f9fafb',
                  cursor: onSessionSelect ? 'pointer' : 'default',
                  fontSize: 10,
                  color: theme === 'dark' ? '#e5e7eb' : '#374151',
                  textAlign: 'start'
                }}
              >
                <span>{formatClassSessionTime(session.startDateTime, lang)}</span>
                {session.status && session.status !== 'scheduled' && (
                  <span style={{
                    fontSize: 9,
                    padding: '0 0.25rem',
                    borderRadius: 999,
                    background: `${SESSIONS_COLOR}20`,
                    color: SESSIONS_COLOR,
                    flexShrink: 0
                  }}>
                    {t(session.status)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
