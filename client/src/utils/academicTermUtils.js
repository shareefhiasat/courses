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
