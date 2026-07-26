import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { formatDate } from '@utils/date-formatter.js';

export function resolveBoardStudentName(item, lang = 'en') {
  if (!item) return '';
  if (item.user) return getLocalizedUserName(item.user, lang, item.name || '');
  if (lang === 'ar' && item.nameAr) return item.nameAr;
  // Check multiple name fields
  if (item.nameEn) return item.nameEn;
  if (item.studentName) return item.studentName;
  if (item.studentNameEn) return item.studentNameEn;
  if (item.firstName && item.lastName) return `${item.firstName} ${item.lastName}`;
  if (item.firstName) return item.firstName;
  return item.name || '';
}

export function resolveBoardClassName(item, lang = 'en') {
  if (!item) return '';
  if (lang === 'ar') {
    return item.classNameAr || item.class?.nameAr || item.className || '';
  }
  return item.classNameEn || item.class?.nameEn || item.className || '';
}

export function formatBoardDate(value, lang = 'en') {
  return formatDate(value, lang);
}

export function summarizeBoardByColumn(data = []) {
  const summary = {};
  for (const item of data) {
    summary[item.column] = (summary[item.column] || 0) + 1;
  }
  return summary;
}

export function parseWorkflowCardName(name) {
  if (!name) return [];
  const parts = name.split(/\s+-\s+/);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** Keep full ISO date in workflow titles (2026-07-05). */
export function shortenWorkflowDisplayName(name) {
  if (!name) return '';
  return String(name);
}
