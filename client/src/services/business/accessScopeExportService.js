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
import { getParticipationsByClassAndDate } from '@services/business/participationService.js';
import { getClassById, getClasses } from '@services/business/classService.js';
import { getSubjects } from '@services/business/programService.js';
import { formatQatarDateOnly } from '@utils/qatarDate.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { academicTermToYearTerm, resolveLocalizedYearTerm } from '@utils/academicTermUtils.js';
import { ATTENDANCE_STATUS } from '@constants/attendanceTypes';
import { getStatusCodeFromRecord } from '@constants/attendanceTypes';
import { formatForDateInput, getQatarDateParts } from '@utils/date-formatter.js';
import { buildReportFilename } from '@services/export/official-reports/engine/reportFilename.js';
import { notifyExportSuccess, withExportLoading } from '@services/export/official-reports/engine/exportToast.js';

function sanitize(str) {
  return str ? String(str).replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') : '';
}

const extFor = (format) => (format === EXPORT_FORMAT.EXCEL ? 'xlsx' : 'pdf');

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
    programId: cls.programId || cls.program?.id,
    subjectId: cls.subjectId || cls.subject?.id,
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

export function exportWeeklyScheduleForScope(params) {
  return withExportLoading(
    params?.lang === 'ar' ? 'جاري إنشاء الجدول الأسبوعي...' : 'Generating weekly schedule...',
    () => exportWeeklyScheduleForScopeImpl(params),
  );
}

async function exportWeeklyScheduleForScopeImpl({
  cls,
  program,
  subject,
  academicTerm,
  lang,
  t,
  user,
  format = EXPORT_FORMAT.PDF,
  skipDownload = false,
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
  const filename = buildReportFilename({
    type: 'weekly-schedule',
    programName: meta.programName,
    className: meta.className,
    subjectName: meta.subjectName,
    serial: reportData.serial,
    ext: extFor(format),
    lang,
  });
  const blob = await exportWeeklyScheduleReport(reportData, { format, filename, download: !skipDownload });
  const persistRes = await persistAndLogExport({
    blob,
    filename,
    mimeType: mimeTypeForFormat(format),
    format,
    exportType: 'weekly_class_schedule',
    programId: meta.programId,
    classId: meta.classId,
  }).catch(() => null);
  if (!skipDownload) notifyExportSuccess('weekly-schedule', format === EXPORT_FORMAT.EXCEL ? 'excel' : 'pdf', lang, blob, filename, persistRes?.fileId);
  return { filename, blob, fileId: persistRes?.fileId || null, dataSource: reportData.dataSource };
}

export function exportWeeklyScheduleForProgram(params) {
  return withExportLoading(
    params?.lang === 'ar' ? 'جاري إنشاء الجدول الأسبوعي...' : 'Generating weekly schedule...',
    () => exportWeeklyScheduleForProgramImpl(params),
  );
}

async function exportWeeklyScheduleForProgramImpl({
  program,
  academicTerm,
  year,
  term,
  lang,
  t,
  user,
  format = EXPORT_FORMAT.PDF,
  skipDownload = false,
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

  const filename = buildReportFilename({
    type: 'weekly-schedule',
    programName,
    serial: reportData.serial,
    ext: extFor(format),
    lang,
  });
  const blob = await exportWeeklyScheduleReport(reportData, { format, filename, download: !skipDownload });
  let persistRes = null;
  if (!skipDownload) {
    persistRes = await persistAndLogExport({
      blob,
      filename,
      mimeType: mimeTypeForFormat(format),
      format,
      exportType: 'weekly_class_schedule',
      programId: program?.id,
    }).catch(() => null);
    notifyExportSuccess('weekly-schedule', format === EXPORT_FORMAT.EXCEL ? 'excel' : 'pdf', lang, blob, filename, persistRes?.fileId);
  }
  return { filename, blob, fileId: persistRes?.fileId || null, dataSource: reportData.dataSource };
}

export function exportDailyOfficialTemplate(params) {
  return withExportLoading(
    params?.lang === 'ar' ? 'جاري إنشاء النموذج اليومي...' : 'Generating daily template...',
    () => exportDailyOfficialTemplateImpl(params),
  );
}

async function exportDailyOfficialTemplateImpl({
  cls,
  program,
  subject,
  academicTerm,
  lang,
  user,
  format = EXPORT_FORMAT.PDF,
  instructorName,
  skipDownload = false,
  skipPersist = false,
  includeNotes = true,
  includeParticipation = false,
  date = null,
}) {
  const resolvedClass = await resolveClassForExport(cls, { instructorName });
  const meta = buildClassMetadata(resolvedClass, program, subject, lang, { instructorName, academicTerm });

  let roster = [];
  if (resolvedClass?.id) {
    try {
      const studentsRes = await getStudentsByClass(resolvedClass.id);
      const enrollments = studentsRes.success ? studentsRes.data : [];
      roster = enrollments.map((e) => {
        const studentUser = e.user || e;
        return {
          id: e.userId ?? studentUser.id ?? e.studentId,
          user: studentUser,
          studentNumber: studentUser.studentNumber || e.studentNumber,
          sequence: e.sequence ?? e.studentOrder,
        };
      });
    } catch {
      // fall back to empty roster (blank template)
    }
  }

  const reportData = prepareDailyOfficialData({
    roster,
    attendanceByUserId: {},
    participationByUserId: {},
    lang,
    isStandup: false,
    isTemplate: true,
    includeNotes,
    includeParticipation,
    metadata: {
      date: '—',
      ...meta,
      watermarkUser: user,
    },
  });
  const filename = buildReportFilename({
    type: 'daily-template',
    programName: meta.programName,
    className: meta.className,
    subjectName: meta.subjectName,
    serial: reportData.serial,
    ext: extFor(format),
    lang,
  });
  const blob = await exportDailyOfficialReport(reportData, { format, filename, download: !skipDownload });
  const driveResult = skipPersist ? null : await persistAndLogExport({
    blob,
    filename,
    mimeType: mimeTypeForFormat(format),
    format,
    exportType: 'attendance_daily_template',
    classId: meta.classId,
    subjectId: meta.subjectId,
    programId: meta.programId,
  }).catch(() => null);
  if (!skipDownload) notifyExportSuccess('daily-template', format === EXPORT_FORMAT.EXCEL ? 'excel' : 'pdf', lang, blob, filename, driveResult?.fileId);
  return { filename, blob, fileId: driveResult?.fileId || null };
}

export function exportDailyOfficialForDate(params) {
  return withExportLoading(
    params?.lang === 'ar' ? 'جاري إنشاء التقرير اليومي الرسمي...' : 'Generating daily official report...',
    () => exportDailyOfficialForDateImpl(params),
  );
}

async function exportDailyOfficialForDateImpl({
  cls,
  program,
  subject,
  academicTerm,
  lang,
  user,
  date,
  format = EXPORT_FORMAT.PDF,
  skipDownload = false,
  skipPersist = false,
  instructorName,
  workflowStatus = null,
  approvedBy = null,
  approvedAt = null,
  includeNotes = true,
  includeParticipation = false,
}) {
  const resolvedClass = await resolveClassForExport(cls, { instructorName });
  const meta = buildClassMetadata(resolvedClass, program, subject, lang, { instructorName, academicTerm });
  const formattedDate = formatQatarDateOnly(date);
  const reportDate = formatForDateInput(date);

  const [attendanceRes, studentsRes] = await Promise.all([
    getAttendanceByClass(cls.id, { date }),
    getStudentsByClass(cls.id),
  ]);

  console.log('[exportDailyOfficialForDate] date', date, 'classId', cls.id, 'attendanceRes', attendanceRes);

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

  const participationByUserId = {};
  if (includeParticipation && cls?.id && date) {
    const participationRes = await getParticipationsByClassAndDate(cls.id, date);
    if (participationRes.success) {
      participationRes.data.forEach((p) => {
        const uid = String(p.userId ?? p.studentId);
        if (!participationByUserId[uid]) participationByUserId[uid] = [];
        participationByUserId[uid].push(p);
      });
    }
  }

  const enrollments = studentsRes.success ? studentsRes.data : [];
  console.log('[exportDailyOfficialForDate] attendanceData.length', attendanceData.length, 'enrollments.length', enrollments.length, 'attendanceByUserId keys', Object.keys(attendanceByUserId));
  console.log('[exportDailyOfficialForDate] roster ids', (enrollments.length > 0 ? enrollments.slice(0, 5) : attendanceData.slice(0, 5)).map((e) => ({ id: e.userId ?? e.id, userId: e.userId })));
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
    participationByUserId,
    lang,
    isStandup: false,
    isTemplate: roster.length === 0,
    includeNotes,
    includeParticipation,
    metadata: {
      date: formattedDate,
      ...meta,
      watermarkUser: user,
      watermarkStatus: workflowStatus,
      approvedByUser: approvedBy,
      approvedAt,
    },
  });

  const STATUS_FILENAME_LABELS = {
    DRAFT: { en: 'Draft', ar: 'مسودة' },
    APPROVED: { en: 'Approved', ar: 'معتمد' },
  };
  const workflowStatusUpper = workflowStatus ? String(workflowStatus).toUpperCase() : null;
  const statusLabels = STATUS_FILENAME_LABELS[workflowStatusUpper];
  const statusSlug = statusLabels
    ? (lang === 'ar' ? statusLabels.ar : statusLabels.en)
    : '';
  const filename = buildReportFilename({
    type: 'daily-official',
    extra: statusSlug || undefined,
    programName: meta.programName,
    className: meta.className,
    subjectName: meta.subjectName,
    serial: reportData.serial,
    ext: extFor(format),
    lang,
  });
  const blob = await exportDailyOfficialReport(reportData, { format, filename, download: !skipDownload });
  const driveResult = skipPersist ? null : await persistAndLogExport({
    blob,
    filename,
    mimeType: mimeTypeForFormat(format),
    format,
    exportType: 'attendance_daily_official',
    classId: meta.classId,
    subjectId: meta.subjectId,
    programId: meta.programId,
    reportDate,
    metadata: {
      workflowStatus,
      approvedByName: approvedBy?.displayName || null,
      approvedAt,
    },
  }).catch(() => null);
  if (!skipDownload) notifyExportSuccess('daily-official', format === EXPORT_FORMAT.EXCEL ? 'excel' : 'pdf', lang, blob, filename, driveResult?.fileId);
  return { filename, blob, fileId: driveResult?.fileId || null };
}

export function exportAttendanceOfficialForScope(params) {
  return withExportLoading(
    params?.lang === 'ar' ? 'جاري إنشاء تقرير الحضور...' : 'Generating attendance report...',
    () => exportAttendanceOfficialForScopeImpl(params),
  );
}

async function exportAttendanceOfficialForScopeImpl({
  subjectIds,
  violationTypes,
  dateFrom,
  dateTo,
  programId,
  programName,
  lang,
  user,
  format = EXPORT_FORMAT.PDF,
  preview = false,
  skipPersist = false,
  download = true,
  classIds = [],
  classId = null,
  workflowStatus = null,
  approvedBy = null,
  approvedAt = null,
}) {
  // Fetch attendance by classId (subjectId is often NULL in the database,
  // so filtering by subjectId returns no records). We fetch by class with
  // date range, then filter by subject on the client side using class->subject mapping.
  const fetchClassIds = classIds.length > 0 ? classIds : [];

  let allAttendanceData = [];

  if (fetchClassIds.length > 0) {
    // Fetch attendance for each class in the cohort
    const attendancePromises = fetchClassIds.map((classId) =>
      getAttendanceRecords({
        classId: Number(classId),
        dateFrom,
        dateTo,
        limit: 5000,
      })
    );

    const attendanceResults = await Promise.all(attendancePromises);
    allAttendanceData = attendanceResults
      .filter((result) => result.success)
      .flatMap((result) => result.data);
  } else {
    // Fallback: fetch by subjectId (for callers that don't pass classIds)
    const attendancePromises = subjectIds.map((subjectId) =>
      getAttendanceRecords({
        subjectId: Number(subjectId),
        dateFrom,
        dateTo,
        limit: 5000,
      })
    );

    const attendanceResults = await Promise.all(attendancePromises);
    allAttendanceData = attendanceResults
      .filter((result) => result.success)
      .flatMap((result) => result.data);
  }

  const deduplicatedData = Array.from(
    new Map(allAttendanceData.map((record) => [record.id, record])).values()
  );

  // Client-side date filter using Qatar timezone to ensure correct calendar date
  const inRange = deduplicatedData.filter((record) => {
    const raw = record.date || record.at || record.createdAt;
    const parts = getQatarDateParts(raw);
    const dateKey = parts
      ? `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
      : (typeof raw === 'string' ? raw.split('T')[0] : formatForDateInput(new Date(raw)));
    return dateKey >= dateFrom && dateKey <= dateTo;
  });

  // Build a set of selected subject IDs for filtering (as strings for loose comparison)
  const selectedSubjectSet = new Set(subjectIds.map(String));

  // Enrich records with subject and class objects (needed by prepareAttendanceOfficialData
  // for subject names in the report rows). When record.subjectId is NULL (common in the DB),
  // resolve the subject from the class's subjectId.
  const [classesRes, subjectsRes] = await Promise.all([
    getClasses({ programId, isActive: true, limit: 500 }),
    getSubjects({ programId }),
  ]);
  const allClasses = classesRes?.success ? (classesRes.data || []) : [];
  const allSubjects = subjectsRes?.success ? (subjectsRes.data || []) : [];

  // Filter to only records whose class belongs to one of the selected subjects
  const subjectFiltered = inRange.filter((record) => {
    const recordClass = allClasses.find((c) => c.id === record.classId);
    const effectiveSubjectId = record.subjectId ?? recordClass?.subjectId ?? recordClass?.subject?.id;
    return effectiveSubjectId != null && selectedSubjectSet.has(String(effectiveSubjectId));
  });

  const enrichedData = subjectFiltered.map((record) => {
    const recordClass = allClasses.find((c) => c.id === record.classId);
    const effectiveSubjectId = record.subjectId ?? recordClass?.subjectId ?? recordClass?.subject?.id;
    const recordSubject = allSubjects.find((s) => s.id == effectiveSubjectId);
    const studentName = getLocalizedUserName(record.user, lang, '');
    const studentNumber = record.user?.studentNumber || '';

    return {
      ...record,
      studentName,
      studentNumber,
      className:
        lang === 'ar'
          ? recordClass?.nameAr || recordClass?.name || recordClass?.nameEn || ''
          : recordClass?.nameEn || recordClass?.name || '',
      subjectName:
        lang === 'ar'
          ? recordSubject?.nameAr || recordSubject?.name || recordSubject?.nameEn || ''
          : recordSubject?.nameEn || recordSubject?.name || '',
      subject: recordSubject,
      class: recordClass,
    };
  });

  const filteredData = enrichedData.filter((record) => {
    const statusCode = getStatusCodeFromRecord(record) || '';
    if (violationTypes.absentNoExcuse && statusCode === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE) return true;
    if ((violationTypes.absentWithExcuse || violationTypes.excusedLeave) && statusCode === ATTENDANCE_STATUS.EXCUSED_LEAVE) return true;
    if (violationTypes.late && statusCode === ATTENDANCE_STATUS.LATE) return true;
    if (violationTypes.humanCase && statusCode === ATTENDANCE_STATUS.HUMAN_CASE) return true;
    return false;
  });

  const reportData = prepareAttendanceOfficialData({
    records: filteredData,
    violationTypes,
    lang,
    preview,
    metadata: {
      programId,
      programName,
      dateFrom,
      dateTo,
      watermarkUser: user,
      watermarkStatus: workflowStatus,
      approvedByUser: approvedBy,
      approvedAt,
    },
  });

  const filename = buildReportFilename({
    type: 'attendance-official',
    programName,
    serial: reportData.serial,
    ext: extFor(format),
    lang,
  });
  const blob = await exportAttendanceOfficialReport(reportData, { format, filename, download });
  const blobUrl = URL.createObjectURL(blob);
  let driveResult = null;
  if (!skipPersist) {
    driveResult = await persistAndLogExport({
      blob,
      filename,
      mimeType: mimeTypeForFormat(format),
      exportType: 'official_attendance',
      format,
      classId: classId || (classIds.length === 1 ? classIds[0] : null),
      programId,
      reportDate: dateFrom,
      metadata: {
        workflowStatus,
        approvedByName: approvedBy?.displayName || null,
        approvedAt,
      },
    }).catch(() => {});
  }
  if (download) notifyExportSuccess('attendance-official', format === EXPORT_FORMAT.EXCEL ? 'excel' : 'pdf', lang, blob, filename, driveResult?.fileId);

  return {
    filename: driveResult?.filename || filename,
    blob,
    blobUrl,
    fileId: driveResult?.fileId || null,
    folderId: driveResult?.folderId || null,
    format,
  };
}
