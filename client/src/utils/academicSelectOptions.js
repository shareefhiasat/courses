/**
 * Shared sort + label helpers for program/subject/class dropdowns.
 * Matches QR Scanner ProgramsSelect conventions.
 */

export function sortSubjectsByCode(subjects = []) {
  return [...subjects].sort((a, b) =>
    (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' })
  );
}

export function sortClassesForSelect(classes = [], lang = 'en') {
  return [...classes].sort((a, b) => {
    const codeCmp = (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' });
    if (codeCmp !== 0) return codeCmp;
    const nameA =
      lang === 'ar'
        ? a.nameAr || a.nameEn || a.name || ''
        : a.nameEn || a.name || a.nameAr || '';
    const nameB =
      lang === 'ar'
        ? b.nameAr || b.nameEn || b.name || ''
        : b.nameEn || b.name || b.nameAr || '';
    return nameA.localeCompare(nameB, lang === 'ar' ? 'ar' : 'en', { sensitivity: 'base' });
  });
}

export function getProgramOptionLabel(program, lang = 'en') {
  if (lang === 'ar') {
    return program.nameAr || program.nameEn || program.name || program.code || 'Unnamed Program';
  }
  return program.nameEn || program.name || program.nameAr || program.code || 'Unnamed Program';
}

export function getSubjectOptionLabel(subject, lang = 'en') {
  if (lang === 'ar') {
    return subject.nameAr || subject.nameEn || subject.name || subject.code || 'Unnamed Subject';
  }
  return subject.nameEn || subject.name || subject.nameAr || subject.code || 'Unnamed Subject';
}

export function getClassOptionLabel(cls, lang = 'en') {
  const className =
    lang === 'ar'
      ? cls.nameAr || cls.nameEn || cls.name || cls.titleAr || cls.title || 'Unnamed Class'
      : cls.nameEn || cls.name || cls.nameAr || cls.title || cls.titleAr || 'Unnamed Class';
  return className + (cls.code ? ` (${cls.code})` : '');
}
