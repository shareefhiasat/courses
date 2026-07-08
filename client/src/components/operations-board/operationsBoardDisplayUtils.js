import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { formatDate } from '@utils/date-formatter.js';

export function resolveBoardStudentName(item, lang = 'en') {
  if (!item) return '';
  if (item.user) return getLocalizedUserName(item.user, lang, item.name || '');
  if (lang === 'ar' && item.nameAr) return item.nameAr;
  return item.nameEn || item.name || '';
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
