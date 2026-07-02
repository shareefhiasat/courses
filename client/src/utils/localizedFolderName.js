/**
 * Returns the localized folder name based on the current language.
 * Falls back to whichever name is available if one is missing.
 *
 * @param {{ name?: string, nameAr?: string } | null | undefined} folder
 * @param {'en' | 'ar'} lang
 * @returns {string}
 */
export function getLocalizedFolderName(folder, lang) {
  if (!folder) return '';
  if (lang === 'ar') {
    return folder.nameAr || folder.name || '';
  }
  return folder.name || folder.nameAr || '';
}
