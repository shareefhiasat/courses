/**
 * Language-aware user display name resolution.
 * English names come from Keycloak/DB; Arabic names are LMS-managed DB fields.
 */

const UNKNOWN_USER = 'Unknown User';

export function getEnglishUserName(user, fallback = UNKNOWN_USER) {
  if (!user) return fallback;

  if (user.displayName?.trim()) return user.displayName.trim();
  if (user.realName?.trim()) return user.realName.trim();
  if (user.name?.trim()) return user.name.trim();
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`.trim();
  if (user.firstName?.trim()) return user.firstName.trim();
  if (user.email) return user.email;

  return fallback;
}

export function getArabicUserName(user, fallback = null) {
  if (!user) return fallback;

  if (user.displayNameAr?.trim()) return user.displayNameAr.trim();
  if (user.firstNameAr && user.lastNameAr) {
    return `${user.firstNameAr} ${user.lastNameAr}`.trim();
  }
  if (user.firstNameAr?.trim()) return user.firstNameAr.trim();

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
