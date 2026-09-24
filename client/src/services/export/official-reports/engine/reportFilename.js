/**
 * Build descriptive, filesystem-safe filenames for official report exports.
 *
 * Format: {type}_{program}_{class}_{subject}_{student}_{YYYYMMDD}.{ext}
 * Missing segments are skipped. Example:
 *   deduction-report_CY-DIP_Intro-Cybersec_Class-A_20260924.pdf
 *   student-attendance_CY-DIP_Intro-Cybersec_Class-A_551911-Muhammad-Ali_20260924.xlsx
 */

import { getQatarDateParts } from '@utils/date-formatter.js';

const pad = (n) => String(n).padStart(2, '0');

/** Report type slugs per language — used as the first filename segment. */
const TYPE_SLUGS = {
  'student-attendance': { en: 'student-attendance', ar: 'حضور-طالب' },
  'class-summary': { en: 'class-summary', ar: 'ملخص-الشعبة' },
  'deduction-report': { en: 'deduction-report', ar: 'تقرير-الخصومات' },
  'program-summary': { en: 'program-summary', ar: 'ملخص-البرنامج' },
  'weekly-schedule': { en: 'weekly-schedule', ar: 'الجدول-الأسبوعي' },
  'daily-official': { en: 'daily-official', ar: 'التقرير-اليومي' },
  'daily-template': { en: 'daily-template', ar: 'النموذج-اليومي' },
  'attendance-official': { en: 'attendance-official', ar: 'تقرير-الحضور' },
  'semester-certificate': { en: 'semester-certificate', ar: 'شهادة-الفصل' },
  'marks-sheet': { en: 'marks-sheet', ar: 'كشف-الدرجات' },
  'attendance-warning': { en: 'attendance-warning', ar: 'إنذار-حضور' },
  'qualitative-card': { en: 'qualitative-card', ar: 'البطاقة-النوعية' },
};

const ALL_CLASSES_SLUG = { en: 'all-classes', ar: 'جميع-الشعب' };

/** Strip characters illegal in filenames, collapse whitespace to dashes, truncate. */
export function sanitizeFilenameSegment(value, maxLen = 40) {
  if (value == null) return '';
  return String(value)
    .replace(/[/\\?%*:|"<>]/g, ' ')
    .replace(/[.#]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLen);
}

function dateStamp(date) {
  const parts = getQatarDateParts(date || new Date());
  if (!parts) return '';
  return `${parts.year}${pad(parts.month)}${pad(parts.day)}`;
}

/**
 * @param {Object} opts
 * @param {string} opts.type - report slug, e.g. 'student-attendance', 'class-summary', 'deduction-report', 'program-summary'
 * @param {string} [opts.programName]
 * @param {string} [opts.className]
 * @param {string} [opts.subjectName]
 * @param {string} [opts.studentName]
 * @param {string} [opts.studentNumber]
 * @param {string} [opts.scope] - e.g. 'all-classes' for cross-class student reports
 * @param {string|string[]} [opts.extra] - extra segment(s) inserted after the type (e.g. workflow status)
 * @param {string} [opts.serial] - official serial; appended last instead of the date stamp
 * @param {Date} [opts.date]
 * @param {string} opts.ext - 'pdf' | 'xlsx'
 * @param {string} [opts.lang] - 'ar' localizes the type slug; pass Ar name fields too
 */
export function buildReportFilename({
  type,
  programName,
  className,
  subjectName,
  studentName,
  studentNumber,
  scope,
  extra,
  serial,
  date,
  ext = 'pdf',
  lang = 'en',
}) {
  const isAr = lang === 'ar';
  const typeSlug = TYPE_SLUGS[type]?.[isAr ? 'ar' : 'en'] || type;
  const segments = [typeSlug];
  if (extra) segments.push(...(Array.isArray(extra) ? extra : [extra]));
  if (programName) segments.push(programName);
  if (className) segments.push(className);
  if (subjectName) segments.push(subjectName);
  if (scope === 'all') segments.push(ALL_CLASSES_SLUG[isAr ? 'ar' : 'en']);
  const student = [studentNumber, studentName].filter(Boolean).join('-');
  if (student) segments.push(student);
  segments.push(serial || dateStamp(date));

  const name = segments
    .map((s) => sanitizeFilenameSegment(s))
    .filter(Boolean)
    // Drop consecutive duplicates (e.g. class named after its subject)
    .filter((s, i, arr) => i === 0 || s !== arr[i - 1])
    .join('_');
  return `${name || 'report'}.${ext}`;
}
