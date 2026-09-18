/**
 * Language-aware user display name resolution.
 * English names come from Keycloak/DB; Arabic names are LMS-managed DB fields.
 */

const UNKNOWN_USER = 'Unknown User';

const ARABIC_BLOCK_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+(?:\s+[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+)*/g;
const LATIN_NAME_RE = /[A-Za-z]+(?:['-]?[A-Za-z]+)*/g;

function extractLatin(text) {
  if (!text) return '';
  const matches = String(text).match(LATIN_NAME_RE);
  return matches ? matches.join(' ').trim() : '';
}

function extractArabic(text) {
  if (!text) return '';
  const matches = String(text).match(ARABIC_BLOCK_RE);
  return matches ? matches.join(' ').trim() : '';
}

export function getEnglishUserName(user, fallback = UNKNOWN_USER) {
  if (!user) return fallback;

  // Prefer explicit Latin-script display/real/name fields; if mixed, extract the Latin part
  const latinDisplayName = extractLatin(user.displayName);
  if (latinDisplayName) return latinDisplayName;
  const latinRealName = extractLatin(user.realName);
  if (latinRealName) return latinRealName;
  const latinName = extractLatin(user.name);
  if (latinName) return latinName;

  // Combine Latin first/last names individually so a missing or Arabic field does not hide the other
  const latinFirst = extractLatin(user.firstName);
  const latinLast = extractLatin(user.lastName);
  if (latinFirst || latinLast) return `${latinFirst} ${latinLast}`.trim();

  return fallback;
}

export function getArabicUserName(user, fallback = null) {
  if (!user) return fallback;

  if (user.displayNameAr?.trim()) return user.displayNameAr.trim();
  if (user.nameAr?.trim()) return user.nameAr.trim();
  if (user.realNameAr?.trim()) return user.realNameAr.trim();
  if (user.studentNameAr?.trim()) return user.studentNameAr.trim();
  if (user.firstNameAr && user.lastNameAr) {
    return `${user.firstNameAr} ${user.lastNameAr}`.trim();
  }
  if (user.firstNameAr?.trim()) return user.firstNameAr.trim();

  // Fallback: extract Arabic parts from bilingual/mixed generic fields
  const arDisplayName = extractArabic(user.displayName);
  if (arDisplayName) return arDisplayName;
  const arRealName = extractArabic(user.realName);
  if (arRealName) return arRealName;
  const arName = extractArabic(user.name);
  if (arName) return arName;

  const arFirst = extractArabic(user.firstName);
  const arLast = extractArabic(user.lastName);
  if (arFirst || arLast) return `${arFirst} ${arLast}`.trim();

  return fallback;
}

/**
 * @param {object|null|undefined} user
 * @param {'en'|'ar'|string} [lang='en']
 * @param {string} [fallback=UNKNOWN_USER]
 */
export function getLocalizedUserName(user, lang = 'en', fallback = UNKNOWN_USER) {
  if (!user) return fallback;

  if (lang === 'ar') {
    const arabicName = getArabicUserName(user);
    if (arabicName) return arabicName;
  }

  return getEnglishUserName(user, fallback);
}

/** Attach bilingual student/instructor name fields to a row/DTO. */
export function applyLocalizedNameFields(target, user, fallback = UNKNOWN_USER) {
  if (!target || !user) return target;
  const nameEn = getLocalizedUserName(user, 'en', fallback);
  const nameAr = getLocalizedUserName(user, 'ar', nameEn);
  target.studentName = nameEn;
  target.studentNameAr = nameAr;
  target.instructorName = nameEn;
  target.instructorNameAr = nameAr;
  return target;
}

export default getLocalizedUserName;
