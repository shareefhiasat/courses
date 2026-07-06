/**
 * Shared sort + label helpers for program/subject/class dropdowns.
 * Matches QR Scanner ProgramsSelect conventions.
 */

import { formatDate } from './date-formatter';
import { ACADEMIC_TERMS, getAcademicTermLabel } from '@constants/academicTerms';

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
  let className =
    lang === 'ar'
      ? cls.nameAr || cls.nameEn || cls.name || cls.titleAr || cls.title || 'Unnamed Class'
      : cls.nameEn || cls.name || cls.nameAr || cls.title || cls.titleAr || 'Unnamed Class';

  // If there's a code, parse it to extract term and year for both languages
  if (cls.code) {
    const codeParts = cls.code.split('-');
    if (codeParts.length >= 3) {
      const year = codeParts[1];
      const termCode = codeParts[2]?.toLowerCase();
      
      // Get localized term label
      const termConfig = Object.values(ACADEMIC_TERMS).find(t => t.value === termCode);
      const termLabel = termConfig ? (lang === 'ar' ? termConfig.label.ar : termConfig.label.en) : termCode;
      
      // Remove any existing term/year pattern from the name to avoid duplication
      // Split by " - " and filter out parts that contain the year (regardless of format)
      const parts = className.split(' - ');
      const cleanParts = parts.filter(part => {
        // Keep parts that don't contain the specific year from the code
        return !part.includes(year);
      });
      className = cleanParts.join(' - ').trim();
      
      // Build label with localized term and year (no code in parentheses)
      return `${className} - ${termLabel} ${year}`;
    }
  }

  // Fallback: if code doesn't match expected format, show it in parentheses
  return className + (cls.code ? ` (${cls.code})` : '');
}

function formatDateShort(dateStr, lang = 'en') {
  if (!dateStr) return '';
  return formatDate(dateStr, lang);
}

export function getClassDateRangeSubtext(cls, lang = 'en', t) {
  if (!cls.startDate && !cls.endDate) return '';
  const start = formatDateShort(cls.startDate, lang);
  const end = formatDateShort(cls.endDate, lang);
  if (start && end) return `${start} → ${end}`;
  if (start) return `${t ? t('class_start_date') : 'Start'}: ${start}`;
  if (end) return `${t ? t('class_end_date') : 'End'}: ${end}`;
  return '';
}

export function getProgramDateRangeSubtext(program, lang = 'en', t) {
  if (!program.startDate && !program.endDate) return '';
  const start = formatDateShort(program.startDate, lang);
  const end = formatDateShort(program.endDate, lang);
  if (start && end) return `${start} → ${end}`;
  if (start) return `${t ? t('class_start_date') : 'Start'}: ${start}`;
  if (end) return `${t ? t('class_end_date') : 'End'}: ${end}`;
  return '';
}

function getInstructorDisplayName(instructor, lang = 'en') {
  if (!instructor) return '';
  if (lang === 'ar') {
    return instructor.displayNameAr || instructor.firstNameAr || instructor.lastNameAr ||
           instructor.displayName || `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.email || '';
  }
  return instructor.displayName || `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.email || '';
}

function getClassroomDisplayText(classroom, lang = 'en') {
  if (!classroom) return '';
  if (lang === 'ar') {
    const name = classroom.nameAr || classroom.nameEn || classroom.code || '';
    const room = classroom.roomNumber || '';
    return [name, room].filter(Boolean).join(' - ') || classroom.code || '';
  }
  const name = classroom.nameEn || classroom.nameAr || classroom.code || '';
  const room = classroom.roomNumber || '';
  return [name, room].filter(Boolean).join(' - ') || classroom.code || '';
}

function countInstructorsForClasses(classRows = []) {
  return new Set(classRows.map((c) => c.instructorId).filter(Boolean)).size;
}

function countLabel(count, key, t, fallback) {
  const label = t ? t(key) : fallback;
  return `${count} ${label}`;
}

export function getClassSubtextLines(cls, lang = 'en', t) {
  const lines = [];

  const instructorName = getInstructorDisplayName(cls.instructor, lang);
  if (instructorName) {
    const label = t ? t('instructor') : 'Instructor';
    lines.push(`${label}: ${instructorName}`);
  }

  const enrollCount = cls._count?.enrollments ?? cls.enrollmentCount ?? null;
  if (enrollCount != null) {
    lines.push(countLabel(enrollCount, 'students', t, 'Students'));
  }

  const subInstructorName = getInstructorDisplayName(cls.substituteInstructor, lang);
  if (subInstructorName) {
    const label = t ? t('substitute_instructor') : 'Substitute';
    lines.push(`${label}: ${subInstructorName}`);
  }

  const classroom = getClassroomDisplayText(cls.classroom, lang);
  if (classroom) {
    const label = t ? t('classroom') : 'Room';
    lines.push(`${label}: ${classroom}`);
  }

  const dateRange = getClassDateRangeSubtext(cls, lang, t);
  if (dateRange) lines.push(dateRange);

  return lines.length > 0 ? lines : undefined;
}

/**
 * Standard program dropdown subtext: classes, subjects, instructors (+ optional dates).
 * Pass `classes` and `subjects` arrays when available for live counts; falls back to _count.
 */
export function getProgramSubtextLines(program, lang = 'en', t, meta = {}) {
  const { classes = [], subjects = [] } = meta;
  const lines = [];
  const progClasses = classes.length
    ? classes.filter((c) => c.programId === program.id)
    : [];

  if (progClasses.length) {
    lines.push(countLabel(progClasses.length, 'scope_classes', t, 'Classes'));
    const subjectCount = subjects.filter((s) => s.programId === program.id).length;
    if (subjectCount) lines.push(countLabel(subjectCount, 'subjects', t, 'Subjects'));
    const instructorCount = countInstructorsForClasses(progClasses);
    if (instructorCount) lines.push(countLabel(instructorCount, 'instructors', t, 'Instructors'));
  } else {
    const classCount = program._count?.classes ?? null;
    const subjectCount = program._count?.subjects ?? null;
    if (classCount != null) lines.push(countLabel(classCount, 'scope_classes', t, 'Classes'));
    if (subjectCount != null) lines.push(countLabel(subjectCount, 'subjects', t, 'Subjects'));
  }

  const dateRange = getProgramDateRangeSubtext(program, lang, t);
  if (dateRange) lines.push(dateRange);

  return lines.length > 0 ? lines : undefined;
}

/** @deprecated Use getProgramSubtextLines with meta */
export function getProgramSubtextWithInstructors(program, classes = [], subjects = [], lang = 'en', t) {
  return getProgramSubtextLines(program, lang, t, { classes, subjects });
}

/**
 * Standard subject dropdown subtext: classes + instructors.
 */
export function getSubjectSubtextLines(subject, lang = 'en', t, meta = {}) {
  const { classes = [] } = meta;
  const lines = [];
  const subClasses = classes.length
    ? classes.filter((c) => c.subjectId === subject.id)
    : [];

  if (subClasses.length) {
    lines.push(countLabel(subClasses.length, 'scope_classes', t, 'Classes'));
    const instructorCount = countInstructorsForClasses(subClasses);
    if (instructorCount) lines.push(countLabel(instructorCount, 'instructors', t, 'Instructors'));
  } else {
    const classCount = subject._count?.classes ?? null;
    if (classCount != null) lines.push(countLabel(classCount, 'scope_classes', t, 'Classes'));
  }

  return lines.length > 0 ? lines : undefined;
}

/** @deprecated Use getSubjectSubtextLines with meta */
export function getSubjectSubtextWithInstructors(subject, classes = [], lang = 'en', t) {
  return getSubjectSubtextLines(subject, lang, t, { classes });
}
