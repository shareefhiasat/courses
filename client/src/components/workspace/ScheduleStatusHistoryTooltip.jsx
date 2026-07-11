import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@contexts/ThemeContext';
import {
  SCHEDULE_WORKFLOW_COLORS,
  resolveScheduleWorkflowKey,
} from '@constants/workspaceStatusColors';
import { formatDate, formatTime } from '@utils/date-formatter.js';
import gridStyles from './officialWeeklyScheduleGrid.module.css';

function workflowStatusToKey(status) {
  if (!status) return 'not_taken';
  const code = typeof status === 'object' ? (status.code || status.nameEn) : status;
  return resolveScheduleWorkflowKey({ workflowStatus: code });
}

function resolveActorName(entry, lang) {
  if (lang === 'ar' && entry.actorNameAr) return entry.actorNameAr;
  return entry.actorNameEn || entry.actor?.displayName || null;
}

function buildHistoryEntries(status, fallbackDate) {
  const history = status?.statusHistory || [];
  if (history.length > 0) {
    return history.map((entry) => ({
      key: workflowStatusToKey(entry.toStatus),
      createdAt: entry.createdAt || entry.changedAt || null,
      actorNameEn: entry.actorNameEn,
      actorNameAr: entry.actorNameAr,
      actor: entry.actor,
    }));
  }
  const fallbackAt = status?.firstTakenAt || status?.updatedAt || fallbackDate || null;
  if (!fallbackAt && !status?.hasAttendance) return [];
  return [{
    key: resolveScheduleWorkflowKey(status),
    createdAt: fallbackAt,
    actorNameEn: null,
    actorNameAr: null,
  }];
}

function StatusHistoryEntry({ entry, lang }) {
  const color = SCHEDULE_WORKFLOW_COLORS[entry.key] || '#6b7280';
  const dateLabel = entry.createdAt ? formatDate(entry.createdAt, lang) : null;
  const timeLabel = entry.createdAt ? formatTime(entry.createdAt, lang) : null;
  const actor = resolveActorName(entry, lang);
  if (!dateLabel && !actor) return null;

  return (
    <div className={gridStyles.statusHistoryRow}>
      <span
        className={`${gridStyles.statusHistoryDot} ${gridStyles[`statusDot_${entry.key}`] || ''}`}
        style={{ '--dot-color': color, backgroundColor: color }}
        aria-hidden
      />
      {dateLabel && (
        <span className={gridStyles.statusHistoryMeta}>
          {dateLabel}{timeLabel ? ` ${timeLabel}` : ''}
        </span>
      )}
      {actor && <span className={gridStyles.statusHistoryMeta}>{actor}</span>}
    </div>
  );
}

export default function ScheduleStatusHistoryTooltip({ status, lang, fallbackDate, children }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const entries = buildHistoryEntries(status, fallbackDate).filter(
    (e) => e.createdAt || e.actorNameEn || e.actorNameAr || e.actor,
  );
  const currentKey = resolveScheduleWorkflowKey(status);
  const accent = SCHEDULE_WORKFLOW_COLORS[currentKey] || '#6b7280';
  const bg = isDark ? 'rgba(15, 23, 42, 0.97)' : 'rgba(255, 255, 255, 0.98)';

  if (entries.length === 0) return children;

  const title = (
    <div className={gridStyles.statusHistoryTooltip}>
      {entries.map((entry, index) => (
        <StatusHistoryEntry key={`${entry.key}-${entry.createdAt || index}`} entry={entry} lang={lang} />
      ))}
    </div>
  );

  return (
    <Tooltip
      title={title}
      placement="bottom"
      arrow
      enterDelay={200}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: bg,
            color: isDark ? '#e2e8f0' : '#1e293b',
            fontSize: '12px',
            border: `1px solid ${accent}44`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
            maxWidth: 420,
            p: 0,
          },
        },
        arrow: {
          sx: {
            color: bg,
            '&::before': { border: `1px solid ${accent}44` },
          },
        },
      }}
    >
      {children}
    </Tooltip>
  );
}
