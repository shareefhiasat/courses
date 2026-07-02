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

function formatDateShort(dateStr, lang = 'en') {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(lang === 'ar' ? 'ar' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

export function getClassSubtextLines(cls, lang = 'en', t) {
  const lines = [];

  const dateRange = getClassDateRangeSubtext(cls, lang, t);
  if (dateRange) lines.push(dateRange);

  const instructorName = getInstructorDisplayName(cls.instructor, lang);
  if (instructorName) {
    const label = t ? t('instructor') : 'Instructor';
    lines.push(`${label}: ${instructorName}`);
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

  const enrollCount = cls._count?.enrollments ?? cls.enrollmentCount ?? null;
  if (enrollCount != null) {
    const studentLabel = t ? t('students') : 'students';
    lines.push(`${enrollCount} ${studentLabel}`);
  }

  return lines.length > 0 ? lines : undefined;
}

export function getProgramSubtextLines(program, lang = 'en', t) {
  const lines = [];

  const classCount = program._count?.classes ?? null;
  const subjectCount = program._count?.subjects ?? null;

  if (classCount != null) {
    const label = t ? t('classes') : 'classes';
    lines.push(`${classCount} ${label}`);
  }
  if (subjectCount != null) {
    const label = t ? t('subjects') : 'subjects';
    lines.push(`${subjectCount} ${label}`);
  }

  const dateRange = getProgramDateRangeSubtext(program, lang, t);
  if (dateRange) lines.push(dateRange);

  return lines.length > 0 ? lines : undefined;
}

export function getSubjectSubtextLines(subject, lang = 'en', t) {
  const lines = [];

  const classCount = subject._count?.classes ?? null;
  if (classCount != null) {
    const label = t ? t('classes') : 'classes';
    lines.push(`${classCount} ${label}`);
  }

  return lines.length > 0 ? lines : undefined;
}
