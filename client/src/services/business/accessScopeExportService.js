import {
  exportWeeklyScheduleReport,
  exportDailyOfficialReport,
  exportAttendanceOfficialReport,
  prepareWeeklyScheduleData,
  prepareDailyOfficialData,
  prepareAttendanceOfficialData,
  EXPORT_FORMAT,
} from '@services/export/official-reports/index.jsx';
import { persistAndLogExport, mimeTypeForFormat } from '@services/business/exportDriveService.js';
import { loadWeeklyScheduleSources } from '@services/business/weeklyScheduleExportService.js';
import { getAttendanceByClass } from '@services/business/attendanceService.js';
import { getAttendanceRecords } from '@services/business/attendanceService.js';
import { getStudentsByClass } from '@services/business/enrollmentService.js';
import { getClassById } from '@services/business/classService.js';
import { formatQatarDateOnly } from '@utils/qatarDate.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { academicTermToYearTerm, resolveLocalizedYearTerm } from '@utils/academicTermUtils.js';
import { ATTENDANCE_STATUS } from '@constants/attendanceTypes';
import { getStatusCodeFromRecord } from '@constants/attendanceTypes';

function sanitize(str) {
  return str ? String(str).replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') : '';
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function resolveInstructorLabel(value, cls, lang) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object') {
    const localized = getLocalizedUserName(value, lang, '');
    if (localized) return localized;
  }
  if (cls?.instructor) return getLocalizedUserName(cls.instructor, lang, '');
  return '';
}

function buildClassMetadata(cls, program, subject, lang, extras = {}) {
  const programName = program
    ? (lang === 'ar' ? program.nameAr || program.nameEn : program.nameEn || program.nameAr)
    : '';
  const subjectName = subject
    ? (lang === 'ar' ? subject.nameAr || subject.nameEn : subject.nameEn || subject.nameAr)
    : '';
  const className = lang === 'ar'
    ? cls.nameAr || cls.nameEn || cls.code
    : cls.nameEn || cls.nameAr || cls.code;
  const instructorName = resolveInstructorLabel(
    extras.instructorName ?? extras.slotInstructor,
    cls,
    lang,
  );
  const { year, term } = resolveLocalizedYearTerm({
    academicTerm: extras.academicTerm,
    year: cls.year,
    term: cls.term,
    lang,
  });

  return {
    programId: cls.programId,
    subjectId: cls.subjectId,
    classId: cls.id,
    programName,
    subjectName,
    className,
    year,
    term,
    instructorName,
    batch: className,
  };
}

async function resolveClassForExport(cls, extras = {}) {
  if (!cls?.id) return cls;
  const hasInstructorObject = cls.instructor?.displayName || cls.instructor?.displayNameAr;
  const hasInstructorString = typeof extras.instructorName === 'string' && extras.instructorName.trim();
  if (hasInstructorObject || hasInstructorString) {
    return cls;
  }
  try {
    const result = await getClassById(cls.id);
    if (result?.success && result.data) {
      return { ...cls, ...result.data, subject: cls.subject || result.data.subject };
    }
  } catch {
    // fall back to provided class payload
  }
  return cls;
}

export async function exportWeeklyScheduleForScope({
  cls,
  program,
  subject,
  academicTerm,
  lang,
  t,
  user,
  format = EXPORT_FORMAT.PDF,
}) {
  const resolvedClass = await resolveClassForExport(cls);
  const { year: termYear, term: termCode } = academicTerm
    ? academicTermToYearTerm(academicTerm)
    : { year: '', term: '' };
  const meta = buildClassMetadata(resolvedClass, program, subject, lang, { academicTerm });
  const sources = await loadWeeklyScheduleSources({
    classId: cls.id,
    programId: cls.programId || program?.id,
    year: resolvedClass.year || termYear,
    term: resolvedClass.term || termCode,
    academicTermId: academicTerm?.id ?? cls.academicTermId,
    academicTermCode: academicTerm?.code,
  });
  const reportData = prepareWeeklyScheduleData({
    metadata: {
      ...meta,
      watermarkUser: user,
    },
    lang,
    t,
    sessions: sources.sessions,
    breakSessions: sources.breakSessions,
    instructorAvailability: sources.instructorAvailability,
    timeSlots: sources.timeSlots,
  });
  const filename = `${reportData.serial}_weekly_schedule_${sanitize(meta.programName || meta.className)}`;
  const blob = await exportWeeklyScheduleReport(reportData, { format, filename });
  await persistAndLogExport({
    blob,
    filename,
    mimeType: mimeTypeForFormat(format),
    format,
    exportType: 'weekly_class_schedule',
    programId: meta.programId,
    classId: meta.classId,
  }).catch(() => {});
  triggerDownload(blob, `${filename}.${format === EXPORT_FORMAT.EXCEL ? 'xlsx' : 'pdf'}`);
  return { filename, dataSource: reportData.dataSource };
}

export async function exportWeeklyScheduleForProgram({
  program,
  academicTerm,
  year,
  term,
  lang,
  t,
  user,
  format = EXPORT_FORMAT.PDF,
}) {
  const programName = program
    ? (lang === 'ar' ? program.nameAr || program.nameEn : program.nameEn || program.nameAr)
    : '';

  const { year: termYear, term: termCode } = academicTerm
    ? academicTermToYearTerm(academicTerm)
    : { year: year || '', term: term || '' };
  const localized = resolveLocalizedYearTerm({
    academicTerm,
    year: year || termYear,
    term: term || termCode,
    lang,
  });

  const sources = await loadWeeklyScheduleSources({
    programId: program?.id,
    year: year || termYear,
    term: term || termCode,
    academicTermId: academicTerm?.id,
    academicTermCode: academicTerm?.code,
  });

  const reportData = prepareWeeklyScheduleData({
    metadata: {
      programId: program?.id,
      programName,
      year: localized.year,
      term: localized.term,
      batch: programName,
      watermarkUser: user,
    },
    lang,
    t,
    sessions: sources.sessions,
    breakSessions: sources.breakSessions,
    instructorAvailability: sources.instructorAvailability,
    timeSlots: sources.timeSlots,
  });

  const filename = `${reportData.serial}_weekly_schedule_${sanitize(programName)}`;
  const blob = await exportWeeklyScheduleReport(reportData, { format, filename });
  await persistAndLogExport({
    blob,
    filename,
    mimeType: mimeTypeForFormat(format),
    format,
    exportType: 'weekly_class_schedule',
    programId: program?.id,
  }).catch(() => {});
  triggerDownload(blob, `${filename}.${format === EXPORT_FORMAT.EXCEL ? 'xlsx' : 'pdf'}`);
  return { filename, dataSource: reportData.dataSource };
}

export async function exportDailyOfficialTemplate({
  cls,
  program,
  subject,
  academicTerm,
  lang,
  user,
  format = EXPORT_FORMAT.PDF,
  instructorName,
}) {
  const resolvedClass = await resolveClassForExport(cls, { instructorName });
  const meta = buildClassMetadata(resolvedClass, program, subject, lang, { instructorName, academicTerm });
  const reportData = prepareDailyOfficialData({
    roster: [],
    attendanceByUserId: {},
    lang,
    isStandup: false,
    isTemplate: true,
    metadata: {
      date: '—',
      ...meta,
      watermarkUser: user,
    },
  });
  const filename = `${reportData.serial}_daily_official_template_${sanitize(meta.className)}`;
  const blob = await exportDailyOfficialReport(reportData, { format, filename });
  triggerDownload(blob, `${filename}.${format === EXPORT_FORMAT.EXCEL ? 'xlsx' : 'pdf'}`);
  return { filename };
}

export async function exportDailyOfficialForDate({
  cls,
  program,
  subject,
  academicTerm,
  lang,
  user,
  date,
  format = EXPORT_FORMAT.PDF,
  skipDownload = false,
  instructorName,
}) {
  const resolvedClass = await resolveClassForExport(cls, { instructorName });
  const meta = buildClassMetadata(resolvedClass, program, subject, lang, { instructorName, academicTerm });
  const formattedDate = formatQatarDateOnly(date);

  const [attendanceRes, studentsRes] = await Promise.all([
    getAttendanceByClass(cls.id, { date }),
    getStudentsByClass(cls.id),
  ]);

  const attendanceData = (attendanceRes.success ? attendanceRes.data : []).map((a) => ({
    ...a,
    status: getStatusCodeFromRecord(a),
    studentId: a.studentId ?? a.userId,
  }));

  const attendanceByUserId = {};
  attendanceData.forEach((record) => {
    const uid = String(record.studentId ?? record.userId);
    attendanceByUserId[uid] = record;
  });

  const enrollments = studentsRes.success ? studentsRes.data : [];
  const roster = enrollments.length > 0
    ? enrollments.map((e) => {
        const studentUser = e.user || e;
        return {
          id: e.userId ?? studentUser.id ?? e.studentId,
          user: studentUser,
          studentNumber: studentUser.studentNumber || e.studentNumber,
          sequence: e.sequence ?? e.studentOrder,
        };
      })
    : attendanceData.map((r) => ({
        id: r.studentId ?? r.userId,
        studentNumber: r.studentNumber,
        displayName: r.studentName,
        attendance: r.status,
      }));

  const reportData = prepareDailyOfficialData({
    roster,
    attendanceByUserId,
    lang,
    isStandup: false,
    metadata: {
      date: formattedDate,
      ...meta,
      watermarkUser: user,
    },
  });

  const filename = `${reportData.serial}_daily_official_${sanitize(meta.className)}`;
  const blob = await exportDailyOfficialReport(reportData, { format, filename, download: !skipDownload });
  const driveResult = await persistAndLogExport({
    blob,
    filename,
    mimeType: mimeTypeForFormat(format),
    format,
    exportType: 'attendance_daily_official',
    classId: meta.classId,
    subjectId: meta.subjectId,
    programId: meta.programId,
    reportDate: formattedDate,
  }).catch(() => null);
  return { filename, blob, fileId: driveResult?.fileId || null };
}

export async function exportAttendanceOfficialForScope({
  subjectIds,
  violationTypes,
  dateFrom,
  dateTo,
  programId,
  programName,
  lang,
  user,
  format = EXPORT_FORMAT.PDF,
}) {
  const attendancePromises = subjectIds.map((subjectId) =>
    getAttendanceRecords({
      subjectId: Number(subjectId),
      dateFrom,
      dateTo,
      limit: 5000,
    })
  );

  const attendanceResults = await Promise.all(attendancePromises);
  const allAttendanceData = attendanceResults
    .filter((result) => result.success)
    .flatMap((result) => result.data);

  const deduplicatedData = Array.from(
    new Map(allAttendanceData.map((record) => [record.id, record])).values()
  );

  const filteredData = deduplicatedData.filter((record) => {
    const statusCode = getStatusCodeFromRecord(record) || '';
    if (violationTypes.absentNoExcuse && statusCode === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE) return true;
    if ((violationTypes.absentWithExcuse || violationTypes.excusedLeave) && statusCode === ATTENDANCE_STATUS.EXCUSED_LEAVE) return true;
    if (violationTypes.late && statusCode === ATTENDANCE_STATUS.LATE) return true;
    if (violationTypes.humanCase && statusCode === ATTENDANCE_STATUS.HUMAN_CASE) return true;
    return false;
  }).map((record) => ({
    ...record,
    studentName: getLocalizedUserName(record.user, lang, ''),
    studentNumber: record.user?.studentNumber || '',
  }));

  const reportData = prepareAttendanceOfficialData({
    records: filteredData,
    violationTypes,
    lang,
    metadata: {
      programId,
      programName,
      dateFrom,
      dateTo,
      watermarkUser: user,
    },
  });

  const filename = `${reportData.serial}_attendance_official_${sanitize(programName)}`;
  const blob = await exportAttendanceOfficialReport(reportData, { format, filename });
  const blobUrl = URL.createObjectURL(blob);
  await persistAndLogExport({
    blob,
    filename,
    mimeType: mimeTypeForFormat(format),
    exportType: 'official_attendance',
    format,
    programId,
    reportDate: `${dateFrom}_${dateTo}`,
  }).catch(() => {});

  return {
    filename,
    blobUrl,
    format,
  };
}
