import { getAcademicTermLabel } from '@constants/academicTerms';

/**
 * Map academic_terms row to year/term strings used on Class records and export loaders.
 */
export function academicTermToYearTerm(academicTerm) {
  if (!academicTerm) return { year: null, term: null, termCode: null };

  const code = String(academicTerm.code || '').trim();
  const dashIdx = code.indexOf('-');
  const year = dashIdx > 0 ? code.slice(0, dashIdx) : null;

  // Classes often store full term code (e.g. 2024-FALL) — prefer code over parsed name.
  const termCode = code || null;
  let term = termCode;
  if (dashIdx > 0 && code.length > dashIdx + 1) {
    term = code;
  } else if (academicTerm.nameEn) {
    const name = academicTerm.nameEn.trim();
    const withoutYear = year ? name.replace(year, '').trim() : name;
    term = withoutYear.split(/\s+/)[0] || termCode;
  }

  return { year, term, termCode };
}

/**
 * Returns a user-facing localized display name for an academic term.
 * Prefers nameAr for Arabic, otherwise builds a clean label from the
 * year/term so raw codes like "FALL" never leak into the navbar.
 */
export function getAcademicTermDisplayName(academicTerm, lang = 'en') {
  if (!academicTerm) return '';

  const nameAr = academicTerm.nameAr?.trim();
  if (lang === 'ar' && nameAr) return nameAr;

  const { year, term } = academicTermToYearTerm(academicTerm);
  const rawTermPart = term && String(term).includes('-')
    ? String(term).split('-').pop()
    : term;

  const localizedTerm = getAcademicTermLabel(rawTermPart, lang)
    || getAcademicTermLabel(term, lang)
    || rawTermPart
    || term
    || '';

  if (!localizedTerm) return nameAr || academicTerm.nameEn?.trim() || '';

  return year ? `${localizedTerm} ${year}` : localizedTerm;
}

function splitCompoundTerm(raw) {
  if (!raw) return { year: null, termPart: null };
  const str = String(raw).trim();
  const match = str.match(/^(\d{4})-([a-zA-Z]+)$/);
  if (match) return { year: match[1], termPart: match[2] };
  return { year: null, termPart: str };
}

/**
 * Year/term labels for report headers — uses academic_terms Arabic/English names when available.
 */
export function resolveLocalizedYearTerm({ academicTerm, year, term, lang = 'en' }) {
  const isAr = lang === 'ar';
  let resolvedYear = year ? String(year).trim() : '';
  let resolvedTerm = term ? String(term).trim() : '';

  if (academicTerm) {
    const parsed = academicTermToYearTerm(academicTerm);
    if (!resolvedYear && parsed.year) resolvedYear = parsed.year;

    if (isAr) {
      const arName = academicTerm.nameAr?.trim();
      if (arName) {
        resolvedTerm = resolvedYear
          ? arName.replace(resolvedYear, '').replace(/^\s*[-/]\s*/, '').trim() || arName
          : arName;
      } else {
        resolvedTerm = getAcademicTermLabel(parsed.termCode || resolvedTerm, 'ar') || parsed.term || resolvedTerm;
      }
    } else {
      resolvedTerm = academicTerm.nameEn?.trim()
        || getAcademicTermLabel(parsed.termCode || resolvedTerm, 'en')
        || resolvedTerm;
    }
  } else if (resolvedTerm) {
    const { year: embeddedYear, termPart } = splitCompoundTerm(resolvedTerm);
    if (!resolvedYear && embeddedYear) resolvedYear = embeddedYear;
    const termKey = termPart || resolvedTerm;
    const localized = getAcademicTermLabel(termKey, isAr ? 'ar' : 'en');
    if (localized && localized !== termKey) {
      resolvedTerm = embeddedYear && isAr
        ? localized.replace(`${embeddedYear}-`, '').trim()
        : localized;
    }
  }

  return { year: resolvedYear, term: resolvedTerm };
}
