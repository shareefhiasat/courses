import React from 'react';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import {
  SCHEDULE_WORKFLOW_COLORS,
  WORKFLOW_STATUS_COLORS,
} from '@constants/workspaceStatusColors';
import { formatDate, formatTime } from '@utils/date-formatter.js';
import gridStyles from './officialWeeklyScheduleGrid.module.css';

function workflowStatusToKey(status) {
  if (!status) return 'not_taken';
  let code;
  if (typeof status === 'object') {
    code = status.code || status.nameEn || status.workflowStatus || status.toStatus;
  } else {
    code = status;
  }
  if (!code) return 'not_taken';
  const normalized = String(code).toUpperCase().replace(/\s+/g, '_');
  return normalized;
}

function getWorkflowStatusColorByKey(key) {
  if (!key) return '#6b7280';
  
  // Try exact match first
  if (SCHEDULE_WORKFLOW_COLORS[key]) {
    return SCHEDULE_WORKFLOW_COLORS[key];
  }
  if (WORKFLOW_STATUS_COLORS[key]) {
    return WORKFLOW_STATUS_COLORS[key];
  }
  
  // Try case-insensitive match
  const lowerKey = key.toLowerCase();
  const scheduleKeys = Object.keys(SCHEDULE_WORKFLOW_COLORS);
  const matchingScheduleKey = scheduleKeys.find(k => k.toLowerCase() === lowerKey);
  if (matchingScheduleKey) {
    return SCHEDULE_WORKFLOW_COLORS[matchingScheduleKey];
  }
  
  const workflowKeys = Object.keys(WORKFLOW_STATUS_COLORS);
  const matchingWorkflowKey = workflowKeys.find(k => k.toLowerCase() === lowerKey);
  if (matchingWorkflowKey) {
    return WORKFLOW_STATUS_COLORS[matchingWorkflowKey];
  }
  
  return '#6b7280';
}

function resolveActorName(entry, lang) {
  if (lang === 'ar' && entry.actorNameAr) return entry.actorNameAr;
  return entry.actorNameEn || entry.actor?.displayName || null;
}

function buildHistoryEntries(status, fallbackDate) {
  const history = status?.statusHistory || [];
  const entries = [];
  
  // Only add history entries - the workflow icon itself represents the current status
  if (history.length > 0) {
    history.forEach((entry) => {
      entries.push({
        key: workflowStatusToKey(entry.toStatus),
        createdAt: entry.createdAt || entry.changedAt || null,
        actorNameEn: entry.actorNameEn,
        actorNameAr: entry.actorNameAr,
        actor: entry.actor,
      });
    });
  }
  
  return entries;
}

function StatusHistoryEntry({ entry, lang, t }) {
  const color = getWorkflowStatusColorByKey(entry.key);
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

export default function ScheduleStatusHistoryTooltip({ status, lang, fallbackDate, children, t, currentColor }) {
  const entries = buildHistoryEntries(status, fallbackDate);
  const accent = currentColor || '#6b7280';

  if (entries.length === 0) return children;

  const title = (
    <div className={gridStyles.statusHistoryTooltip}>
      {entries.map((entry, index) => (
        <StatusHistoryEntry key={`${entry.key}-${entry.createdAt || index}`} entry={entry} lang={lang} t={t} />
      ))}
    </div>
  );

  return (
    <ColoredTooltip
      title={title}
      color={accent}
      borderColor={accent}
      placement="bottom"
      arrow
      enterDelay={200}
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 420,
            p: 0,
          },
        },
      }}
    >
      {children}
    </ColoredTooltip>
  );
}
