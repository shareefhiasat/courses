/** Watermark text lines for PDF official reports. */
export function buildWatermarkLines(user) {
  if (!user) return { en: '', ar: '' };
  const en =
    user.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.email ||
    '';
  const ar =
    user.displayNameAr ||
    [user.firstNameAr, user.lastNameAr].filter(Boolean).join(' ') ||
    en;
  return { en, ar };
}
