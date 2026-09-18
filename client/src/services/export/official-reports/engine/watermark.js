import { getLocalizedUserName, getArabicUserName } from '@utils/localizedUserName.js';
import { WORKFLOW_STATUS_COLORS } from '@constants/workspaceStatusColors.js';

/** Watermark text lines for PDF official reports. */
export function buildWatermarkLines(user) {
  if (!user) return { en: '', ar: '', uuid: '' };
  const en =
    user.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.email ||
    '';
  const ar =
    user.displayNameAr ||
    [user.firstNameAr, user.lastNameAr].filter(Boolean).join(' ') ||
    '';
  const uuid = user.id || user.uid || user.sub || '';
  return { en, ar, uuid };
}

const STATUS_LABELS = {
  DRAFT: { en: 'DRAFT', ar: 'مسودة' },
  SUBMITTED: { en: 'CONFIRMED', ar: 'مؤكد' },
  UNDER_REVIEW: { en: 'UNDER REVIEW', ar: 'قيد المراجعة' },
  UNDER_HR_REVIEW: { en: 'UNDER HR REVIEW', ar: 'قيد مراجعة الموارد البشرية' },
  UNDER_ADMIN_REVIEW: { en: 'UNDER ADMIN REVIEW', ar: 'قيد مراجعة الإدارة' },
  APPROVED: { en: 'APPROVED', ar: 'معتمد' },
  REJECTED: { en: 'REJECTED', ar: 'مرفوض' },
};

/**
 * Build status-based watermark/footer lines for PDF reports.
 * Returns the localized status label with the actor/approver name, optional
 * approval date, and serial. Returns null when no status is provided.
 */
export function buildStatusWatermark(
  status,
  approvedBy,
  lang = 'ar',
  approvedAt = null,
  watermarkUser = null,
  serial = '',
) {
  if (!status) return null;
  const upper = String(status).toUpperCase();
  const labels = STATUS_LABELS[upper];
  if (!labels) return null;

  const buildSuffix = (name, date, serialNum) => {
    const parts = [name, date, serialNum].filter(Boolean);
    if (parts.length === 0) return '';
    return ` — ${parts.join(' — ')}`;
  };

  let actorUser = watermarkUser;
  let dateEn = '';
  let dateAr = '';

  if (upper === 'APPROVED' && approvedBy) {
    actorUser = approvedBy;
    dateEn = approvedAt
      ? new Date(approvedAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : '';
    dateAr = approvedAt
      ? new Date(approvedAt).toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : '';
  }

  const actorEn = getLocalizedUserName(actorUser, 'en', '');
  const actorAr = getArabicUserName(actorUser) || '';

  return {
    en: `${labels.en}${buildSuffix(actorEn, dateEn, serial)}`,
    ar: `${labels.ar}${buildSuffix(actorAr, dateAr, serial)}`,
    uuid: '',
    status: upper === 'DRAFT' ? 'draft' : upper.toLowerCase(),
    color: WORKFLOW_STATUS_COLORS[upper] || '#6b7280',
  };
}
