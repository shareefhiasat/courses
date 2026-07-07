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
import { formatQatarDateOnly } from '@utils/qatarDate.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
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

function buildClassMetadata(cls, program, subject, lang) {
  const programName = program
    ? (lang === 'ar' ? program.nameAr || program.nameEn : program.nameEn || program.nameAr)
    : '';
  const subjectName = subject
    ? (lang === 'ar' ? subject.nameAr || subject.nameEn : subject.nameEn || subject.nameAr)
    : '';
  const className = lang === 'ar'
    ? cls.nameAr || cls.nameEn || cls.code
    : cls.nameEn || cls.nameAr || cls.code;
  const instructorName = cls.instructor
    ? (lang === 'ar'
      ? cls.instructor.displayNameAr || cls.instructor.displayName
      : cls.instructor.displayName)
    : '';

  return {
    programId: cls.programId,
    subjectId: cls.subjectId,
    classId: cls.id,
    programName,
    subjectName,
    className,
    year: cls.year || '',
    term: cls.term || '',
    instructorName,
    batch: className,
  };
}

export async function exportWeeklyScheduleForScope({
  cls,
  program,
  subject,
  lang,
  t,
  user,
  format = EXPORT_FORMAT.PDF,
}) {
  const meta = buildClassMetadata(cls, program, subject, lang);
  const sources = await loadWeeklyScheduleSources({
    classId: cls.id,
    programId: cls.programId,
    year: cls.year,
    term: cls.term,
  });
  const reportData = prepareWeeklyScheduleData({
    metadata: { ...meta, watermarkUser: user },
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

  const sources = await loadWeeklyScheduleSources({
    programId: program?.id,
    year,
    term,
    academicTermId: academicTerm?.id,
    academicTermCode: academicTerm?.code,
  });

  const reportData = prepareWeeklyScheduleData({
    metadata: {
      programId: program?.id,
      programName,
      year,
      term,
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
  lang,
  user,
  format = EXPORT_FORMAT.PDF,
}) {
  const meta = buildClassMetadata(cls, program, subject, lang);
  const reportData = prepareDailyOfficialData({
    roster: [],
    attendanceByUserId: {},
    lang,
    isStandup: false,
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
  lang,
  user,
  date,
  format = EXPORT_FORMAT.PDF,
}) {
  const meta = buildClassMetadata(cls, program, subject, lang);
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
    ? enrollments.map((e) => ({
        id: e.userId ?? e.user?.id ?? e.studentId,
        studentNumber: e.user?.studentNumber || e.studentNumber,
        displayName: e.user?.displayName || e.user?.name,
        sequence: e.sequence ?? e.studentOrder,
      }))
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

  const filename = `${reportData.serial}_daily_official_${sanitize(meta.className)}_${formattedDate}`;
  const blob = await exportDailyOfficialReport(reportData, { format, filename });
  await persistAndLogExport({
    blob,
    filename,
    mimeType: mimeTypeForFormat(format),
    format,
    exportType: 'attendance_daily_official',
    classId: meta.classId,
    subjectId: meta.subjectId,
    programId: meta.programId,
    reportDate: formattedDate,
  }).catch(() => {});
  triggerDownload(blob, `${filename}.${format === EXPORT_FORMAT.EXCEL ? 'xlsx' : 'pdf'}`);
  return { filename };
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
