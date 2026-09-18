import {
  ATTENDANCE_COLUMNS,
  WORKFLOW_COLUMNS,
  ATTENDANCE_BOARD_LANES,
} from '@services/business/operationsBoardService.js';
import { maskAttendanceColumnForHR } from './hrAttendancePrivacy.js';
import { CARD_TYPE } from './operationsBoardConstants.js';

const { PRESENT, LATE, ABSENT, EXCUSED, HUMAN_CASE } = ATTENDANCE_BOARD_LANES;

export function resolveCardStatus(card, t, roleContext = {}) {
  if (!card) {
    return { statusColumns: [], displayColumn: null, statusColumn: null, statusLabel: '—' };
  }
  const isAttendance = card.type === CARD_TYPE.ATTENDANCE;
  const statusColumns = isAttendance ? ATTENDANCE_COLUMNS : WORKFLOW_COLUMNS;
  const displayColumn = isAttendance
    ? maskAttendanceColumnForHR(card.column, roleContext)
    : card.column;
  const statusColumn = statusColumns.find((c) => c.id === displayColumn);
  const statusLabel = statusColumn ? t(statusColumn.i18nKey) || statusColumn.name : displayColumn;
  return { isAttendance, statusColumns, displayColumn, statusColumn, statusLabel };
}

export const ATTENDANCE_CODE_TO_BOARD = {
  ATTENDANCE_PRESENT: PRESENT,
  ATTENDANCE_LATE: LATE,
  ATTENDANCE_ABSENT: ABSENT,
  ATTENDANCE_ABSENT_NO_EXCUSE: ABSENT,
  ABSENT_WITH_EXCUSE: EXCUSED,
  ATTENDANCE_LEAVE: EXCUSED,
  ATTENDANCE_EXCUSED_LEAVE: EXCUSED,
  SICK_LEAVE: EXCUSED,
  ATTENDANCE_HUMAN_CASE: HUMAN_CASE,
  EARLY_DEPARTURE: HUMAN_CASE,
  STANDUP_PRESENT: PRESENT,
  STANDUP_LATE: LATE,
  STANDUP_ABSENT: ABSENT,
};

export function normalizeStatusId(value) {
  if (!value) return null;
  if (typeof value === 'object') {
    return normalizeStatusId(value.code || value.id || value.nameEn || null);
  }
  const raw = String(value).trim();
  const upper = raw.toUpperCase().replace(/\s+/g, '_');
  if (ATTENDANCE_CODE_TO_BOARD[upper]) return ATTENDANCE_CODE_TO_BOARD[upper];
  if (ATTENDANCE_COLUMNS.some((col) => col.id === upper)) return upper;
  const byName = ATTENDANCE_COLUMNS.find(
    (col) => col.name.toLowerCase() === raw.toLowerCase(),
  );
  return byName?.id || upper;
}

export function resolveBoardStatusMeta(statusId, t, roleContext = {}) {
  const normalized = normalizeStatusId(statusId);
  if (!normalized) return { label: '—', color: '#94a3b8' };
  const displayId = maskAttendanceColumnForHR(normalized, roleContext);
  const columns = [...ATTENDANCE_COLUMNS, ...WORKFLOW_COLUMNS];
  const match = columns.find((col) => col.id === displayId);
  if (match) {
    return { label: t(match.i18nKey) || match.name, color: match.color };
  }
  return { label: normalized.replace(/_/g, ' '), color: '#94a3b8' };
}
