/**
 * AI Query Rule-Based Parser (Bilingual EN / AR)
 *
 * Extracts tool intent, date ranges, and entities (classes, programs, workflow IDs)
 * strictly constrained to the user's accessible data scope.
 */

import { getScopedClasses, getScopedPrograms } from './scope.js';

/**
 * Normalizes Arabic text by unifying hamzas, taa marbuta, and removing diacritics.
 */
export function normalizeArabicText(str = '') {
  return str
    .toLowerCase()
    .replace(/[ً-ْ]/g, '') // remove tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

/**
 * Compute Damerau-Levenshtein (optimal string alignment) distance between two strings.
 * Allows insert, delete, substitute, and adjacent transpositions.
 */
function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // deletion
        d[i][j - 1] + 1,      // insertion
        d[i - 1][j - 1] + cost // substitution
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost); // transposition
      }
    }
  }
  return d[m][n];
}

/**
 * Fuzzy keyword matcher. Returns true if any word in text is within `maxDistance`
 * of any keyword. Useful for tolerating common typos (abesne, absense, etc.).
 */
function fuzzyMatch(text, keywords, maxDistance = 2) {
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
  return words.some((word) =>
    keywords.some((keyword) =>
      Math.abs(word.length - keyword.length) <= maxDistance &&
      editDistance(word, keyword.toLowerCase()) <= maxDistance
    )
  );
}

/**
 * Parse date phrases into ISO Date objects { dateFrom, dateTo, labelEn, labelAr }
 */
export function extractDateRange(text = '') {
  // Convert Arabic-Indic numerals (٠-٩) to Western numerals (0-9) before parsing
  const convertArabicNumerals = (s = '') => s.replace(/[٠-٩]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 1584));
  const norm = normalizeArabicText(convertArabicNumerals(text)).toLowerCase();
  const now = new Date();

  // Helper for start and end of day in UTC
  const startOfDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  const endOfDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

  // Today
  if (/\b(today)\b/i.test(text) || norm.includes('اليوم')) {
    return {
      dateFrom: startOfDay(now),
      dateTo: endOfDay(now),
      labelEn: 'Today',
      labelAr: 'اليوم',
    };
  }

  // Yesterday
  if (/\b(yesterday)\b/i.test(text) || norm.includes('امس') || norm.includes('البارحه')) {
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    return {
      dateFrom: startOfDay(yest),
      dateTo: endOfDay(yest),
      labelEn: 'Yesterday',
      labelAr: 'أمس',
    };
  }

  // Next Week
  if (/next week/i.test(text) || norm.includes('الاسبوع القادم') || norm.includes('الاسبوع المقبل')) {
    const startNextWeek = new Date(now);
    startNextWeek.setDate(startNextWeek.getDate() + (7 - startNextWeek.getDay()));
    const endNextWeek = new Date(startNextWeek);
    endNextWeek.setDate(endNextWeek.getDate() + 6);
    return {
      dateFrom: startOfDay(startNextWeek),
      dateTo: endOfDay(endNextWeek),
      labelEn: 'Next Week',
      labelAr: 'الأسبوع القادم',
    };
  }

  // Last Week
  if (/last week/i.test(text) || norm.includes('الاسبوع الماضي') || norm.includes('الاسبوع الفايت')) {
    const endLastWeek = new Date(now);
    endLastWeek.setDate(endLastWeek.getDate() - (endLastWeek.getDay() + 1));
    const startLastWeek = new Date(endLastWeek);
    startLastWeek.setDate(startLastWeek.getDate() - 6);
    return {
      dateFrom: startOfDay(startLastWeek),
      dateTo: endOfDay(endLastWeek),
      labelEn: 'Last Week',
      labelAr: 'الأسبوع الماضي',
    };
  }

  // This Week
  if (/this week/i.test(text) || norm.includes('هذا الاسبوع') || norm.includes('الاسبوع الحالي')) {
    const startWeek = new Date(now);
    startWeek.setDate(startWeek.getDate() - startWeek.getDay());
    const endWeek = new Date(startWeek);
    endWeek.setDate(endWeek.getDate() + 6);
    return {
      dateFrom: startOfDay(startWeek),
      dateTo: endOfDay(endWeek),
      labelEn: 'This Week',
      labelAr: 'هذا الأسبوع',
    };
  }

  // Last N Days / Weeks / Months (e.g. "last 10 days", "last 2 weeks", "last 3 months")
  const nDaysMatch = text.match(/\b(?:last|past)\s+(\d+)\s*days?\b/i) || norm.match(/(?:خلال|في|اخر|آخر|ال)\s*(\d+)\s*(يوم|ايام|يوما|يومين)/);
  if (nDaysMatch) {
    const n = parseInt(nDaysMatch[1], 10);
    const from = new Date(now);
    from.setDate(from.getDate() - n);
    return {
      dateFrom: startOfDay(from),
      dateTo: endOfDay(now),
      labelEn: `Last ${n} Days`,
      labelAr: `آخر ${n} يوم`,
    };
  }

  const nWeeksMatch = text.match(/\b(?:last|past)\s+(\d+)\s*weeks?\b/i) || norm.match(/(?:خلال|في|اخر|آخر|ال)\s*(\d+)\s*(اسبوع|اسابيع|اسبوعا|اسبوعين)/);
  if (nWeeksMatch) {
    const n = parseInt(nWeeksMatch[1], 10);
    const from = new Date(now);
    from.setDate(from.getDate() - n * 7);
    return {
      dateFrom: startOfDay(from),
      dateTo: endOfDay(now),
      labelEn: `Last ${n} Weeks`,
      labelAr: `آخر ${n} أسبوع`,
    };
  }

  const nMonthsMatch = text.match(/\b(?:last|past)\s+(\d+)\s*months?\b/i) || norm.match(/(?:خلال|في|اخر|آخر|ال)\s*(\d+)\s*(شهر|اشهر|شهور|شهرا|شهرين)/);
  if (nMonthsMatch) {
    const n = parseInt(nMonthsMatch[1], 10);
    const from = new Date(now);
    from.setMonth(from.getMonth() - n);
    return {
      dateFrom: startOfDay(from),
      dateTo: endOfDay(now),
      labelEn: `Last ${n} Months`,
      labelAr: `آخر ${n} شهر`,
    };
  }

  // Last Month
  if (/last month/i.test(text) || norm.includes('الشهر الماضي') || norm.includes('الشهر الفايت')) {
    const startLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const endLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
    return {
      dateFrom: startLastMonth,
      dateTo: endLastMonth,
      labelEn: 'Last Month',
      labelAr: 'الشهر الماضي',
    };
  }

  // This Month
  if (/this month/i.test(text) || norm.includes('هذا الشهر') || norm.includes('الشهر الحالي')) {
    const startThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const endThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    return {
      dateFrom: startThisMonth,
      dateTo: endThisMonth,
      labelEn: 'This Month',
      labelAr: 'هذا الشهر',
    };
  }

  // Default: current month
  return {
    dateFrom: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    dateTo: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)),
    labelEn: 'Current Month',
    labelAr: 'الشهر الحالي',
  };
}

/**
 * Extract matched entities (class, program, workflowId, warningType) from text against scoped records.
 */
export async function extractEntities(req, text = '') {
  const norm = normalizeArabicText(text).toLowerCase();
  const lower = text.toLowerCase();

  const [scopedClasses, scopedPrograms] = await Promise.all([
    getScopedClasses(req),
    getScopedPrograms(req),
  ]);

  let matchedClass = null;
  let matchedProgram = null;
  let workflowId = null;
  let warningType = null; // 'first' | 'final' | null

  // 1. Check Warning Type
  if (/\b(final warning|final)\b/i.test(text) || norm.includes('نهائي') || norm.includes('انذار نهائي')) {
    warningType = 'final';
  } else if (/\b(first warning|first)\b/i.test(text) || norm.includes('اول') || norm.includes('انذار اول')) {
    warningType = 'first';
  }

  // 2. Check Workflow ID: e.g. "workflow 123", "معاملة 123", "document #123"
  const wfMatch = text.match(/(?:workflow|document|معاملة|وثيقة|طلب)\s*(?:#|no\.?|رقم)?\s*(\d+)/i);
  if (wfMatch) {
    workflowId = parseInt(wfMatch[1], 10);
  }

  // 3. Match Class (by Code, nameEn, nameAr)
  for (const c of scopedClasses) {
    const code = (c.code || '').toLowerCase();
    const nameEn = (c.nameEn || '').toLowerCase();
    const nameAr = normalizeArabicText(c.nameAr || '');

    if (code && (lower.includes(code) || norm.includes(code))) {
      matchedClass = c;
      break;
    }
    if (nameEn && nameEn.length > 2 && lower.includes(nameEn)) {
      matchedClass = c;
      break;
    }
    if (nameAr && nameAr.length > 2 && norm.includes(nameAr)) {
      matchedClass = c;
      break;
    }
  }

  // 4. Match Program (by Code, nameEn, nameAr)
  for (const p of scopedPrograms) {
    const code = (p.code || '').toLowerCase();
    const nameEn = (p.nameEn || '').toLowerCase();
    const nameAr = normalizeArabicText(p.nameAr || '');

    if (code && (lower.includes(code) || norm.includes(code))) {
      matchedProgram = p;
      break;
    }
    if (nameEn && nameEn.length > 3 && lower.includes(nameEn)) {
      matchedProgram = p;
      break;
    }
    if (nameAr && nameAr.length > 3 && norm.includes(nameAr)) {
      matchedProgram = p;
      break;
    }
  }

  return {
    classId: matchedClass?.id || null,
    className: matchedClass ? (matchedClass.nameAr || matchedClass.nameEn || matchedClass.code) : null,
    programId: matchedProgram?.id || null,
    programName: matchedProgram ? (matchedProgram.nameAr || matchedProgram.nameEn || matchedProgram.code) : null,
    workflowId,
    warningType,
  };
}

/**
 * Main parser entry point: maps input text into a structured Intent + Parameters.
 */
export async function parseQuery(req, message = '') {
  if (!message || typeof message !== 'string') {
    return { tool: 'unknown', params: {} };
  }

  const raw = message.trim();
  const lower = raw.toLowerCase();
  const norm = normalizeArabicText(raw);

  const dates = extractDateRange(raw);
  const entities = await extractEntities(req, raw);

  // Intent 1: Notes and Comments (ADMIN ONLY)
  if (
    /\b(note|notes|comment|comments|remark|remarks|feedback|reason for rejection|why rejected)\b/i.test(lower) ||
    norm.includes('ملاحظ') || norm.includes('تعليق') || norm.includes('سبب الرفض')
  ) {
    return {
      tool: 'notesAndComments',
      params: { ...dates, ...entities },
    };
  }

  // Intent 2: Late count / Lateness (ADMIN ONLY)
  if (
    /\b(late|tardy|tardiness|lateness|arrived late)\b/i.test(lower) ||
    norm.includes('تاخير') || norm.includes('متاخر') || norm.includes('المتاخرين')
  ) {
    return {
      tool: 'lateCount',
      params: { ...dates, ...entities },
    };
  }

  // Intent 3: Absence Warning Counts (First / Final)
  if (
    /\b(warning|warnings|first warning|final warning|absence warning)\b/i.test(lower) ||
    norm.includes('انذار') || norm.includes('تنبيه')
  ) {
    return {
      tool: 'absenceWarningCounts',
      params: { ...dates, ...entities },
    };
  }

  // Intent 4: Human Cases
  if (
    /\b(human case|human cases|humanitarian)\b/i.test(lower) ||
    norm.includes('حاله انسانيه') || norm.includes('حالات انسانيه') || norm.includes('انسانيه')
  ) {
    return {
      tool: 'humanCaseCount',
      params: { ...dates, ...entities },
    };
  }

  // Intent 5: Schedule / Timetable / Lectures (with typo-tolerant keyword list)
  const scheduleKeywords = [
    'schedule', 'schedules', 'scheduling',
    'scedule', 'scedules', 'scheduel', 'scheduels',
    'scdule', 'scdules', 'scduel', 'scduels',
    'schdule', 'schdules',
    'timetable', 'timetables', 'session', 'sessions',
    'lecture', 'lectures', 'class today', 'classes today', 'classes next week', 'periods',
  ];
  const scheduleAr = norm.includes('جدول') || norm.includes('محاضر') || norm.includes('حصص') || norm.includes('حصه') || norm.includes('مواعيد');
  if (scheduleKeywords.some((kw) => lower.includes(kw)) || scheduleAr) {
    return {
      tool: 'scheduleSummary',
      params: { ...dates, ...entities },
    };
  }

  // Intent 6: Marks / Grades / Exam Results
  if (
    /\b(mark|marks|grade|grades|score|scores|average mark|passed|failed|failing|gpa|exam|complementary)\b/i.test(lower) ||
    norm.includes('علام') || norm.includes('درج') || norm.includes('معدل') || norm.includes('راسب') || norm.includes('ناجح') || norm.includes('اختبار')
  ) {
    return {
      tool: 'marksSummary',
      params: { ...dates, ...entities },
    };
  }

  // Intent 7: Workflow Approvals / Workflow Status
  if (
    /\b(workflow|workflows|approval|approved|pending workflow|rejected workflow|submitted workflow|when approved|approval time)\b/i.test(lower) ||
    norm.includes('سير العمل') || norm.includes('معامل') || norm.includes('موافق') || norm.includes('اعتماد') || norm.includes('معلق')
  ) {
    return {
      tool: 'workflowSummary',
      params: { ...dates, ...entities },
    };
  }

  // Intent 8: Student Count / Enrolled Count
  // Be permissive: catch missing spaces and merged words like "mestudent count",
  // "studentcount", and "howmanystudents" by using substring "student" detection.
  const studentKeywords = /student|students|cadet|cadets|trainee|trainees|طالب|طلاب|دارس|متدرب/i;
  const countContext = /(?:\b(?:how\s*many|number\s*of)|\b(?:total|enrolled|cadets|trainees|count)\b|(?:student|students)\s*count|count\s*(?:student|students)|(?:total|enrolled)\s*(?:student|students)?)/i;
  const isStudentCount =
    (studentKeywords.test(lower) && countContext.test(lower)) ||
    (/(?:طالب|طلاب|دارس|متدرب)/.test(norm) && (norm.includes('عدد') || norm.includes('كم') || norm.includes('كل') || norm.includes('مجموع') || norm.includes('اجمالي')));
  if (isStudentCount) {
    return {
      tool: 'studentCount',
      // studentCount does not consume a date range; omitting it makes the
      // precomputed metric cache (warmed up with empty params) hit.
      params: { ...entities },
    };
  }

  // Intent 9a: Top Student with Most Absences
  // Broadened to catch natural phrasings where "most" and "absent" are separated
  if (
    /\b(highest absence|most absent|most absences|top absence|worst attendance|most missed)\b/i.test(lower) ||
    /\bwho\b.{0,30}\babsen/i.test(lower) ||
    /\bwhich\b.{0,30}\babsen/i.test(lower) ||
    /\b(name|person|student|cadet|trainee)\b.{0,30}\b(most|highest|top|worst)\b.{0,20}\babsen/i.test(lower) ||
    /\b(most|highest|top|worst)\b.{0,20}\babsen/i.test(lower) ||
    /\bwho\b.{0,20}\b(most|highest|top)\b.{0,20}\b(absen|missed|غياب|غائب)/i.test(lower) ||
    norm.includes('اكثر طالب غياب') || norm.includes('اكثر غياب') || norm.includes('اعلى غياب') || norm.includes('اكتر طالب غياب') || norm.includes('اكتر غياب') || norm.includes('من اكثر طالب غاب') || norm.includes('اكثر غائب') || norm.includes('اكثر شخص غياب') || norm.includes('اكثر واحد غياب') || norm.includes('من اكثر غياب') || norm.includes('من اكثر غائب') ||
    norm.includes('اكثر طالب غاب') || norm.includes('من اكثر طالب غياب') || norm.includes('اكتر واحد غاب') || norm.includes('اكثر واحد تغيب')
  ) {
    return {
      tool: 'topAbsenceStudent',
      params: { ...dates, ...entities },
    };
  }

  // Intent 9c: Attendance Warnings (first / final)
  // Important Arabic domain: إنذارات الغياب / تحذيرات
  const warningAr = norm.includes('انذار') || norm.includes('إنذار') || norm.includes('انذارات') ||
                    norm.includes('تحذير') || norm.includes('تحذيرات') || norm.includes('تنبيه') ||
                    norm.includes('تنبيهات') || norm.includes('ورنينج') || norm.includes('وارننغ');
  const isFirstWarning = norm.includes('اول') || norm.includes('أول') || norm.includes('first') || norm.includes('1') || norm.includes('١');
  const isFinalWarning = norm.includes('نهائي') || norm.includes('نهائيه') || norm.includes('اخير') || norm.includes('final') || norm.includes('2') || norm.includes('٢');
  if (warningAr && (norm.includes('غياب') || norm.includes('غائب') || norm.includes('حضور') || norm.includes('طالب') || norm.includes('طلاب') || norm.includes('student'))) {
    const warningType = isFinalWarning ? 'final' : 'first';
    return {
      tool: 'absenceWarningCounts',
      params: { warningType, ...dates, ...entities },
    };
  }

  // Intent 9b: Attendance / Absences / General Attendance Summary
  const attendanceFuzzy = fuzzyMatch(lower, ['absence', 'absences', 'absent', 'present', 'attendance', 'absen', 'excused', 'absentee'], 2);
  if (
    attendanceFuzzy ||
    /\b(absence|absences|absent|present|attendance|excused|sick leave|attendance rate|absentee)\b/i.test(lower) ||
    norm.includes('غياب') || norm.includes('حضور') || norm.includes('غائب') || norm.includes('استئذان') || norm.includes('اجازه') || norm.includes('نسبه الحضور') || norm.includes('نسبة الغياب')
  ) {
    return {
      tool: 'attendanceSummary',
      params: { ...dates, ...entities },
    };
  }

  // Intent 10: Class Count
  // Tolerate common typos like "clases", "do ew have", "classcount", missing spaces.
  const classFuzzy = fuzzyMatch(lower, ['class', 'classes', 'clases'], 1);
  const hasClassWord = classFuzzy || /\bclass(?:es?)?\b/i.test(lower);
  const classCountContext = /(?:\bhow\s*many\b|\bnumber\s*of\b|\bcount\b|\btotal\b|\bclass\s*count\b|\bhow\s*many\s*.*?\bclass|do\s*(?:we|ew|you|they|i|u)\s*have|\bhave\s*(?:we|ew|you|they|i|u)\s*got)/i;
  if (
    (hasClassWord && classCountContext.test(lower)) ||
    norm.includes('كم فصل') || norm.includes('عدد الفصول') || norm.includes('عدد الصفوف')
  ) {
    return { tool: 'classCount', params: { ...entities } };
  }

  // Intent 10b: Class List (numbered list of classes)
  const listContext = /(?:\blist\b|\ball\b|\bshow\b|\bgive\b|\bwhat\b|\bwhich\b|give\s*me\s*.*?\bclass|show\s*.*?\bclass|list\s*.*?\bclass|all\s*.*?\bclass)/i;
  if (
    (hasClassWord && listContext.test(lower)) ||
    norm.includes('قائمة الفصول') || norm.includes('قائمة الصفوف') ||
    norm.includes('كل الفصول') || norm.includes('كل الصفوف') ||
    (norm.includes('قائمة') && (norm.includes('فصول') || norm.includes('صفوف'))) ||
    norm.includes('اعطني الفصول') || norm.includes('اعطني الصفوف')
  ) {
    return { tool: 'classCount', params: { list: true, ...entities } };
  }

  // Intent 11: Attendance Types
  if (
    /\b(attendance types?|types of attendance|attendance status)\b/i.test(lower) ||
    norm.includes('انواع الحضور') || norm.includes('حالات الحضور') || norm.includes('انواع الغياب')
  ) {
    return { tool: 'attendanceTypes', params: {} };
  }

  // Intent 12: Program Info
  if (
    /\b(programs?|diplomas?|courses? available|what programs)\b/i.test(lower) ||
    norm.includes('البرامج') || norm.includes('الدبلومات') || norm.includes('الدورات')
  ) {
    return { tool: 'programInfo', params: {} };
  }

  // Intent 13: Subject Info
  if (
    /\b(subjects?|modules?|what subjects|course subjects)\b/i.test(lower) ||
    norm.includes('المواد') || norm.includes('المواد الدراسية') || norm.includes('المقررات')
  ) {
    return { tool: 'subjectInfo', params: { ...entities } };
  }

  // Intent 14: Enrollment Info
  if (
    /\b(enrollment|enrollments?|registered|registration status)\b/i.test(lower) ||
    norm.includes('التسجيل') || norm.includes('المسجلين') || norm.includes('القيد')
  ) {
    return { tool: 'enrollmentInfo', params: { ...entities } };
  }

  // Intent 15: Penalty Summary
  if (
    /\b(penalt|penalties|punishment|sanction)\b/i.test(lower) ||
    norm.includes('عقوب') || norm.includes('جزاء') || norm.includes('عقاب')
  ) {
    return { tool: 'penaltySummary', params: { ...dates, ...entities } };
  }

  // Intent 16: Behavior Summary
  if (
    /\b(behaviors?|behaviour|conduct)\b/i.test(lower) ||
    norm.includes('سلوك') || norm.includes('السلوكيات')
  ) {
    return { tool: 'behaviorSummary', params: { ...dates, ...entities } };
  }

  // Intent 17: Marks Distribution
  if (
    /\b(marks distribution|grade distribution|weight|grading scheme|grading policy)\b/i.test(lower) ||
    norm.includes('توزيع الدرجات') || norm.includes('وزن الدرجات') || norm.includes('توزيع العلامات')
  ) {
    return { tool: 'marksDistribution', params: { ...entities } };
  }

  // Intent 18: Participation Summary
  if (
    /\b(participation|participate|engagement)\b/i.test(lower) ||
    norm.includes('مشارك') || norm.includes('المشاركة')
  ) {
    return { tool: 'participationSummary', params: { ...dates, ...entities } };
  }

  // Intent 19: Activity Info
  if (
    /\b(activit|assignments?|homework|tasks?)\b/i.test(lower) ||
    norm.includes('الانشطة') || norm.includes('النشاط') || norm.includes('تكاليف') || norm.includes('واجبات')
  ) {
    return { tool: 'activityInfo', params: { ...entities } };
  }

  // Intent 20: Announcement Info
  if (
    /\b(announcement|announcements?|notices?|bulletin)\b/i.test(lower) ||
    norm.includes('اعلان') || norm.includes('اعلانات') || norm.includes('تنبيه')
  ) {
    return { tool: 'announcementInfo', params: { ...entities } };
  }

  // Intent 21: Quiz Summary
  if (
    /\b(quiz|quizzes|short test|short exam)\b/i.test(lower) ||
    norm.includes('اختبار قصير') || norm.includes('اختبارات قصيرة') || norm.includes('كويز')
  ) {
    return { tool: 'quizSummary', params: { ...entities } };
  }

  // Intent 22: Standup Attendance
  if (
    /\b(standup|morning assembly|morning lineup|roll call)\b/i.test(lower) ||
    norm.includes('طابور') || norm.includes('طابور الصباح') || norm.includes('الوقوف')
  ) {
    return { tool: 'standupAttendance', params: { ...dates, ...entities } };
  }

  // Intent 23: Classroom Info
  if (
    /\b(classroom|classrooms?|rooms?|halls?|venues?)\b/i.test(lower) ||
    norm.includes('قاعات') || norm.includes('قاعة') || norm.includes('الغرف') || norm.includes('قاعات الدراسة')
  ) {
    return { tool: 'classroomInfo', params: {} };
  }

  // Intent 24: Submission Summary
  if (
    /\b(submission|submissions?|submitted|turned in)\b/i.test(lower) ||
    norm.includes('تسليم') || norm.includes('التسليمات') || norm.includes('تسليم الواجبات')
  ) {
    return { tool: 'submissionSummary', params: { ...entities } };
  }

  // Intent 25: Holiday Info
  if (
    /\b(holiday|holidays?|vacation|break|public holiday)\b/i.test(lower) ||
    norm.includes('اجاز') || norm.includes('عطل') || norm.includes('الإجازات')
  ) {
    return { tool: 'holidayInfo', params: {} };
  }

  // Intent 26: Break Session Summary
  if (
    /\b(break session|breaks?|recess|tea break|prayer break|lunch break)\b/i.test(lower) ||
    norm.includes('استراح') || norm.includes('فترات الراحة') || norm.includes('استراحات')
  ) {
    return { tool: 'breakSessionSummary', params: {} };
  }

  // Intent 27: Session Summary (scheduled sessions)
  if (
    /\b(scheduled session|sessions summary|how many sessions|session count)\b/i.test(lower) ||
    norm.includes('الجلسات') || norm.includes('عدد الحصص المجدولة') || norm.includes('الجلسات المجدولة')
  ) {
    return { tool: 'sessionSummary', params: { ...dates, ...entities } };
  }

  // Intent 28: Academic Closure Info
  if (
    /\b(academic closure|closures?|semester closure|term closure)\b/i.test(lower) ||
    norm.includes('اغلاق') || norm.includes('الإغلاقات الأكاديمية') || norm.includes('إغلاقات')
  ) {
    return { tool: 'academicClosureInfo', params: {} };
  }

  // Intent 29: Export History
  if (
    /\b(export history|exported files?|export log|recent exports?)\b/i.test(lower) ||
    norm.includes('سجل التصدير') || norm.includes('التقارير المصدرة') || norm.includes('التصديرات')
  ) {
    return { tool: 'exportHistory', params: {} };
  }

  // Fallback: If no recognized keywords
  return {
    tool: 'unknown',
    params: { rawMessage: raw },
  };
}

export default {
  normalizeArabicText,
  extractDateRange,
  extractEntities,
  parseQuery,
};
