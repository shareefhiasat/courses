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

function resolveImageUrl(user) {
  if (!user?.profileImageUrl) return null;
  const url = user.profileImageUrl;
  if (url.startsWith('http') || url.startsWith('/api/')) return url;
  const proxyId = user.keycloakId || user.id;
  if (proxyId) return `/api/v1/user-images/proxy/${proxyId}/profile`;
  return null;
}

/** Notification template vars: English body uses studentName; Arabic body uses Arabic name. */
export function buildNotificationNameVars(user, fallback = UNKNOWN) {
  const fields = buildLocalizedNameFields(user, fallback);
  const imageUrl = resolveImageUrl(user);
  const userRole = typeof user?.role === 'string' ? user.role
    : (user?.role?.code)
    || (user?.roleAssignments?.[0]?.role?.code)
    || (Array.isArray(user?.roles) && user.roles.length ? user.roles[0] : null)
    || null;
  return {
    studentName: fields.nameEn,
    studentNameAr: fields.nameAr,
    instructorName: fields.nameEn,
    instructorNameAr: fields.nameAr,
    userName: fields.nameEn,
    userNameAr: fields.nameAr,
    userImage: imageUrl,
    userImageAr: imageUrl,
    userRole: userRole ? userRole.toLowerCase() : null,
  };
}

export default getLocalizedUserName;
