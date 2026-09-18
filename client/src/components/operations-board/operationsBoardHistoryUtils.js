import { resolveBoardStatusMeta } from './operationsBoardStatusUtils.js';
import { getUserRoleColor } from '@constants/iconTypes';

export function cleanActorName(name) {
  if (!name) return null;
  if (name.includes('@')) {
    const emailParts = name.split('@');
    const localPart = emailParts[0];
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  }
  return name;
}

export function translateReason(reason, t) {
  if (!reason) return reason;
  if (reason === 'Initial document submission' || reason === 'operations board initial document submission') {
    return t('operations_board_initial_document_submission') || reason;
  }
  return reason;
}

export function parseAttendanceNotesList(notesStr, actorName, actorUser = null) {
  if (!notesStr?.trim()) return [];
  return notesStr.split('\n---\n').filter(Boolean).map((text, idx) => ({
    id: `saved-note-${idx}`,
    text: text.trim(),
    actor: actorName,
    actorImage: actorUser?.profileImageUrl,
    actorUser,
    dotColor: '#f59e0b',
  }));
}

export function normalizeSavedWorkflowComment(resultData, fallback) {
  if (resultData && typeof resultData === 'object' && resultData.id != null) {
    return resultData;
  }
  return fallback;
}

const STATUS_TO_ROLE = {
  UNDER_ADMIN_REVIEW: 'admin',
  UNDER_HR_REVIEW: 'hr',
};

function getRoleColorForStatus(statusId) {
  const normalized = typeof statusId === 'string' ? statusId.toUpperCase() : statusId;
  const role = STATUS_TO_ROLE[normalized];
  return role ? getUserRoleColor(role) : null;
}

export function buildStatusEntry(h, prefix = '', documentTitle = '', options = {}) {
  const { t, lang, roleContext = {} } = options;
  const fromId = typeof h.fromStatus === 'object'
    ? (h.fromStatus?.code || h.fromStatus?.nameEn)
    : (h.fromStatus || h.oldStatus);
  const toId = typeof h.toStatus === 'object'
    ? (h.toStatus?.code || h.toStatus?.nameEn)
    : (h.toStatus || h.newStatus);
  const fromMeta = resolveBoardStatusMeta(fromId || h.fromStatus, t, roleContext);
  const toMeta = resolveBoardStatusMeta(toId || h.toStatus, t, roleContext);
  const actorName =
    cleanActorName(h.actor?.displayName)
    || cleanActorName(h.changedByUser?.displayName)
    || cleanActorName(h.changedBy)
    || cleanActorName(h.actor);

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

  const actorObj = h.actor || h.changedByUser || h.changedBy;
  const actorImage = typeof actorObj === 'object'
    ? (actorObj.profileImageUrl || actorObj.image || null)
    : null;

  return {
    id: h.id || `${prefix}-${h.changedAt || h.createdAt || h.timestamp}`,
    type: ACTIVITY_TYPE.STATUS,
    actor: translatedActorName || t('operations_board_system_actor'),
    actorImage,
    actorUser: typeof actorObj === 'object' ? actorObj : null,
    documentTitle,
    from: fromMeta.label,
    to: toMeta.label,
    fromColor: fromMeta.color,
    toColor: toMeta.color,
    fromRoleColor: getRoleColorForStatus(fromId),
    toRoleColor: getRoleColorForStatus(toId),
    at: h.createdAt || h.changedAt || h.timestamp,
    reason: translateReason(h.reason || h.comment || h.notes, t),
  };
}

export function buildOptimisticComment(text, user, action = 'COMMENT', now = Date.now()) {
  return {
    id: `temp-${now}`,
    comment: text,
    action,
    createdAt: new Date().toISOString(),
    author: { displayName: user?.displayName || user?.name },
  };
}
