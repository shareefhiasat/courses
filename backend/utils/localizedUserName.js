/**
 * Language-aware user display name resolution (backend mirror of client helper).
 */

const UNKNOWN = 'Unknown';

export function getEnglishUserName(user, fallback = UNKNOWN) {
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

export function getLocalizedUserName(user, lang = 'en', fallback = UNKNOWN) {
  if (!user) return fallback;
  if (lang === 'ar') {
    const arabicName = getArabicUserName(user);
    if (arabicName) return arabicName;
  }
  return getEnglishUserName(user, fallback);
}

/** Bilingual name fields for API DTOs, grids, and notifications. */
export function buildLocalizedNameFields(user, fallback = UNKNOWN) {
  const nameEn = getLocalizedUserName(user, 'en', fallback);
  const nameAr = getLocalizedUserName(user, 'ar', nameEn);
  return {
    nameEn,
    nameAr,
    studentName: nameEn,
    studentNameAr: nameAr,
    instructorName: nameEn,
    instructorNameAr: nameAr,
    userName: nameEn,
    userNameAr: nameAr,
  };
}

/** Notification template vars: English body uses studentName; Arabic body uses Arabic name. */
export function buildNotificationNameVars(user, fallback = UNKNOWN) {
  const fields = buildLocalizedNameFields(user, fallback);
  return {
    studentName: fields.nameEn,
    studentNameAr: fields.nameAr,
    instructorName: fields.nameEn,
    instructorNameAr: fields.nameAr,
    userName: fields.nameEn,
    userNameAr: fields.nameAr,
  };
}

export default getLocalizedUserName;
