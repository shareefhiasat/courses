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
