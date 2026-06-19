import { getLocalizedUserName } from './localizedUserName.js';

/**
 * Pick a localized display name from a row DTO or user object.
 */
export function pickLocalizedName({
  row = null,
  user = null,
  lang = 'en',
  enKey = 'studentName',
  arKey = 'studentNameAr',
  fallback = '—',
}) {
  if (lang === 'ar') {
    const ar = row?.[arKey] ?? (user ? getLocalizedUserName(user, 'ar') : null);
    if (ar) return ar;
  }
  const en = row?.[enKey] ?? (user ? getLocalizedUserName(user, lang, fallback) : null);
  return en || fallback;
}

export function pickStudentName(row, user, lang, fallback = '—') {
  return pickLocalizedName({ row, user, lang, enKey: 'studentName', arKey: 'studentNameAr', fallback });
}

export function pickInstructorName(row, user, lang, fallback = '—') {
  return pickLocalizedName({ row, user, lang, enKey: 'instructorName', arKey: 'instructorNameAr', fallback });
}
