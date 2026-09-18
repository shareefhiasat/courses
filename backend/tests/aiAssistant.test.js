/**
 * AI Assistant Unit Tests
 *
 * Tests the offline rule-based parser, permission gates, and tool routing.
 */

import { describe, it, expect, vi } from 'vitest';
import { parseQuery, extractDateRange, normalizeArabicText } from '../ai/parser.js';
import { checkToolAccess } from '../ai/permissions.js';
import { formatAnswer } from '../services/aiQueryService.js';
import { mapDateRange, isOllamaAvailable } from '../ai/llmParser.js';
import { processWithLLM, TOOL_DEFINITIONS, TOOL_NAME_MAP } from '../ai/llmEngine.js';
import { normalizeQuestion } from '../ai/cache.js';
import { parsePrismaSchema, buildModelDocuments, buildEnumDocuments } from '../ai/schemaRag.js';
import { buildUserDocument, buildNamedEntityDocument, buildTypeDocument, formatEntitiesForPrompt } from '../ai/entityRag.js';

// Mock scope functions to avoid DB calls during parser tests
vi.mock('../ai/scope.js', () => ({
  getScopedClasses: vi.fn().mockResolvedValue([]),
  getScopedPrograms: vi.fn().mockResolvedValue([]),
  buildScopedFilter: vi.fn().mockResolvedValue({ allowed: true, filter: {} }),
}));

// Mock Ollama availability check (tests run without Ollama)
vi.mock('../ai/llmParser.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    isOllamaAvailable: vi.fn().mockResolvedValue(false),
    parseWithLLM: vi.fn(async (req, message) => {
      // Delegate to rule-based parser when Ollama is not available
      const { parseQuery } = await import('../ai/parser.js');
      return parseQuery(req, message);
    }),
  };
});

// Mock ioredis so cache.js loads without a real Redis connection
vi.mock('ioredis', () => ({
  default: class MockRedis {
    async ping() { return 'PONG'; }
    async get() { return null; }
    async setex() { return 'OK'; }
    async keys() { return []; }
    async del() { return 0; }
    on() {}
    connect() {}
  },
}));

describe('AI Parser & Permissions', () => {
  describe('parseQuery intent matching', () => {
    it('matches "how many students" (plural)', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'how many students are enrolled?');
      expect(result.tool).toBe('studentCount');
    });

    it('matches "how many student" (singular)', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'how many student enrolled?');
      expect(result.tool).toBe('studentCount');
    });

    it('matches "which student has the most absences"', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'which student has the most absences?');
      expect(result.tool).toBe('topAbsenceStudent');
    });

    it('matches "who is the most person who do go absent"', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'who is the most person who do go absent in cyber diploma program');
      expect(result.tool).toBe('topAbsenceStudent');
    });

    it('matches "student name that has the most count of absences"', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'I want a student name that has the most count of absences');
      expect(result.tool).toBe('topAbsenceStudent');
    });

    it('does NOT match "how many absences" as topAbsenceStudent', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'how many absences last month?');
      expect(result.tool).toBe('attendanceSummary');
    });

    it('matches Arabic "اكثر طالب غياب"', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'من اكثر طالب غياب');
      expect(result.tool).toBe('topAbsenceStudent');
    });

    it('matches Arabic student count "كم عدد الطلاب"', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'كم عدد الطلاب المسجلين؟');
      expect(result.tool).toBe('studentCount');
    });

    it('matches typo "scduels" as schedule intent', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'today is SUN we have scduels how yo usay 0');
      expect(result.tool).toBe('scheduleSummary');
      expect(result.params?.labelAr).toBe('اليوم');
    });

    it('matches "what is today schedule" as schedule intent', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'what is today schedule?');
      expect(result.tool).toBe('scheduleSummary');
      expect(result.params?.labelEn).toBe('Today');
    });
  });

  describe('LLM Parser', () => {
    it('mapDateRange returns correct labels for each range type', () => {
      expect(mapDateRange('today').labelEn).toBe('Today');
      expect(mapDateRange('today').labelAr).toBe('اليوم');
      expect(mapDateRange('yesterday').labelEn).toBe('Yesterday');
      expect(mapDateRange('this_week').labelEn).toBe('This Week');
      expect(mapDateRange('last_week').labelEn).toBe('Last Week');
      expect(mapDateRange('this_month').labelEn).toBe('This Month');
      expect(mapDateRange('last_month').labelEn).toBe('Last Month');
      expect(mapDateRange('none').labelEn).toBe('Current Month');
      expect(mapDateRange('invalid').labelEn).toBe('Current Month');
    });

    it('mapDateRange returns Date objects for dateFrom and dateTo', () => {
      const result = mapDateRange('today');
      expect(result.dateFrom).toBeInstanceOf(Date);
      expect(result.dateTo).toBeInstanceOf(Date);
      expect(result.dateFrom.getTime()).toBeLessThanOrEqual(result.dateTo.getTime());
    });

    it('isOllamaAvailable returns false when Ollama is not running', async () => {
      const result = await isOllamaAvailable();
      expect(result).toBe(false);
    });
  });

  describe('LLM Engine', () => {
    it('defines all 30 tool definitions for Ollama function calling', () => {
      expect(TOOL_DEFINITIONS).toHaveLength(30);
      const names = TOOL_DEFINITIONS.map((t) => t.function.name);
      // Existing 10
      expect(names).toContain('getAttendanceSummary');
      expect(names).toContain('getStudentCount');
      expect(names).toContain('getTopAbsenceStudent');
      expect(names).toContain('getMarksSummary');
      expect(names).toContain('getWorkflowSummary');
      // New 20
      expect(names).toContain('getClassCount');
      expect(names).toContain('getProgramInfo');
      expect(names).toContain('getSubjectInfo');
      expect(names).toContain('getEnrollmentInfo');
      expect(names).toContain('getPenaltySummary');
      expect(names).toContain('getBehaviorSummary');
      expect(names).toContain('getParticipationSummary');
      expect(names).toContain('getHolidayInfo');
      expect(names).toContain('getSessionSummary');
      expect(names).toContain('getExportHistory');
    });

    it('maps LLM tool names to internal tool names correctly', () => {
      expect(TOOL_NAME_MAP.getAttendanceSummary).toBe('attendanceSummary');
      expect(TOOL_NAME_MAP.getTopAbsenceStudent).toBe('topAbsenceStudent');
      expect(TOOL_NAME_MAP.getStudentCount).toBe('studentCount');
      expect(TOOL_NAME_MAP.getMarksSummary).toBe('marksSummary');
      // New mappings
      expect(TOOL_NAME_MAP.getClassCount).toBe('classCount');
      expect(TOOL_NAME_MAP.getProgramInfo).toBe('programInfo');
      expect(TOOL_NAME_MAP.getSubjectInfo).toBe('subjectInfo');
      expect(TOOL_NAME_MAP.getEnrollmentInfo).toBe('enrollmentInfo');
      expect(TOOL_NAME_MAP.getPenaltySummary).toBe('penaltySummary');
      expect(TOOL_NAME_MAP.getBehaviorSummary).toBe('behaviorSummary');
      expect(TOOL_NAME_MAP.getParticipationSummary).toBe('participationSummary');
      expect(TOOL_NAME_MAP.getHolidayInfo).toBe('holidayInfo');
      expect(TOOL_NAME_MAP.getSessionSummary).toBe('sessionSummary');
      expect(TOOL_NAME_MAP.getExportHistory).toBe('exportHistory');
    });

    it('processWithLLM returns null when Ollama is unavailable (signals fallback)', async () => {
      const req = { user: { roles: ['admin'], id: 1 } };
      const result = await processWithLLM(req, 'how many students?', 'en', []);
      expect(result).toBe(null);
    });

    it('each tool definition has required Ollama function calling fields', () => {
      for (const def of TOOL_DEFINITIONS) {
        expect(def.type).toBe('function');
        expect(def.function.name).toBeDefined();
        expect(def.function.description).toBeDefined();
        expect(def.function.parameters).toBeDefined();
        expect(def.function.parameters.type).toBe('object');
      }
    });
  });

  describe('Cache', () => {
    it('normalizeQuestion lowercases and collapses whitespace', () => {
      expect(normalizeQuestion('  How   Many  Students  ')).toBe('how many students');
    });

    it('normalizeQuestion normalizes Arabic diacritics and hamzas', () => {
      expect(normalizeQuestion('إِنْذَارَاتُ')).toBe('انذارات');
      expect(normalizeQuestion('ملاحظة')).toBe('ملاحظه');
    });

    it('normalizeQuestion handles empty input', () => {
      expect(normalizeQuestion('')).toBe('');
      expect(normalizeQuestion(null)).toBe('');
    });
  });

  describe('normalizeArabicText', () => {
    it('normalizes diacritics, hamzas, and taa marbuta', () => {
      expect(normalizeArabicText('إِنْذَارَاتُ الطَّالِبِ')).toBe('انذارات الطالب');
      expect(normalizeArabicText('ملاحظة')).toBe('ملاحظه');
    });
  });

  describe('extractDateRange', () => {
    it('extracts today date range', () => {
      const dates = extractDateRange('كم غياب اليوم؟');
      expect(dates.labelAr).toBe('اليوم');
      expect(dates.dateFrom).toBeInstanceOf(Date);
      expect(dates.dateTo).toBeInstanceOf(Date);
    });

    it('extracts last 10 days date range', () => {
      const dates = extractDateRange('how many absences in last 10 days?');
      expect(dates.labelEn).toBe('Last 10 Days');
      expect(dates.dateFrom).toBeInstanceOf(Date);
      expect(dates.dateTo).toBeInstanceOf(Date);
      const diffDays = (dates.dateTo - dates.dateFrom) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(10);
    });

    it('matches typo "abesne" as attendanceSummary', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'how many abesne in last 10 days');
      expect(result.tool).toBe('attendanceSummary');
      expect(result.params.labelEn).toBe('Last 10 Days');
    });

    it('matches typo "absense" as attendanceSummary', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'how many absense this week');
      expect(result.tool).toBe('attendanceSummary');
    });

    it('matches Arabic "كم غياب اليوم" as attendanceSummary', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'كم غياب اليوم؟');
      expect(result.tool).toBe('attendanceSummary');
    });

    it('matches Arabic "إنذار أول" as absenceWarningCounts first', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'كم إنذار أول مسجل؟');
      expect(result.tool).toBe('absenceWarningCounts');
      expect(result.params.warningType).toBe('first');
    });

    it('matches Arabic "إنذار نهائي" as absenceWarningCounts final', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'كم إنذار نهائي للطلاب؟');
      expect(result.tool).toBe('absenceWarningCounts');
      expect(result.params.warningType).toBe('final');
    });

    it('extracts date range with Arabic-Indic numerals', () => {
      const dates = extractDateRange('كم غياب آخر ٧ أيام؟');
      expect(dates.labelAr).toBe('آخر 7 يوم');
      const diffDays = (dates.dateTo - dates.dateFrom) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(7);
    });

    it('extracts last 10 days date range', () => {
      const dates = extractDateRange('how many absences in last 10 days?');
      expect(dates.labelEn).toBe('Last 10 Days');
      expect(dates.dateFrom).toBeInstanceOf(Date);
      expect(dates.dateTo).toBeInstanceOf(Date);
      const diffDays = (dates.dateTo - dates.dateFrom) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(10);
    });
  });

  describe('checkToolAccess', () => {
    it('blocks unauthenticated requests', () => {
      const res = checkToolAccess(null, 'attendanceSummary');
      expect(res.allowed).toBe(false);
    });

    it('allows HR users for general tools', () => {
      const req = { user: { roles: ['hr'] } };
      const res = checkToolAccess(req, 'attendanceSummary');
      expect(res.allowed).toBe(true);
    });

    it('blocks HR users from admin-only lateCount tool', () => {
      const req = { user: { roles: ['hr'] } };
      const res = checkToolAccess(req, 'lateCount');
      expect(res.allowed).toBe(false);
    });

    it('blocks HR users from admin-only notesAndComments tool', () => {
      const req = { user: { roles: ['hr'] } };
      const res = checkToolAccess(req, 'notesAndComments');
      expect(res.allowed).toBe(false);
    });

    it('allows Admin users for lateCount and notesAndComments tools', () => {
      const req = { user: { roles: ['admin'] } };
      expect(checkToolAccess(req, 'lateCount').allowed).toBe(true);
      expect(checkToolAccess(req, 'notesAndComments').allowed).toBe(true);
    });
  });

  describe('formatAnswer', () => {
    it('formats attendance summary in Arabic and English', () => {
      const data = {
        counts: { total: 10, present: 8, absent: 1, excused: 1, humanCase: 0 },
        attendanceRate: 80,
        target: 'Class A',
        targetAr: 'فصل أ',
        dateRange: { labelEn: 'Last Month', labelAr: 'الشهر الماضي' },
      };

      const arAnswer = formatAnswer('attendanceSummary', data, 'ar');
      expect(arAnswer).toContain('إحصائيات الحضور والغياب');
      expect(arAnswer).toContain('8 (80%)');

      const enAnswer = formatAnswer('attendanceSummary', data, 'en');
      expect(enAnswer).toContain('Attendance Summary');
      expect(enAnswer).toContain('Present: 8 (80%)');
    });

    it('formats topAbsenceStudent in English and Arabic', () => {
      const data = {
        topStudents: [
          { name: 'John Doe', nameAr: 'جون دو', militaryNumber: 'M001', absenceCount: 12, className: 'Class A' },
        ],
        target: 'All Permitted Classes',
        targetAr: 'كافة الفصول المصرح بها',
        dateRange: { labelEn: 'Current Month', labelAr: 'الشهر الحالي' },
      };

      const enAnswer = formatAnswer('topAbsenceStudent', data, 'en');
      expect(enAnswer).toContain('Most Absences');
      expect(enAnswer).toContain('John Doe');
      expect(enAnswer).toContain('12 absences');

      const arAnswer = formatAnswer('topAbsenceStudent', data, 'ar');
      expect(arAnswer).toContain('الأكثر غياباً');
      expect(arAnswer).toContain('12 غياب');
    });

    it('formats humanCaseCount in Arabic and English', () => {
      const data = {
        humanCaseCount: 1,
        sampleRecords: [
          { studentName: 'Ahmed Khalid', studentNameAr: 'أحمد خالد', militaryNumber: '1010', className: 'Ethical Hacking', classNameAr: 'الاختراق الأخلاقي', date: '2026-08-11', notes: 'QUICK_ATTENDANCE_HUMAN_CASE' },
        ],
        target: 'All Permitted Classes',
        targetAr: 'كافة الفصول المصرح بها',
        dateRange: { labelEn: 'This Month', labelAr: 'هذا الشهر' },
      };

      const enAnswer = formatAnswer('humanCaseCount', data, 'en');
      expect(enAnswer).toContain('Human Cases Summary');
      expect(enAnswer).toContain('Ahmed Khalid');
      expect(enAnswer).toContain('Ethical Hacking');
      expect(enAnswer).not.toContain('أحمد خالد');

      const arAnswer = formatAnswer('humanCaseCount', data, 'ar');
      expect(arAnswer).toContain('الحالات الإنسانية');
      expect(arAnswer).toContain('أحمد خالد');
      expect(arAnswer).toContain('الاختراق الأخلاقي');
      expect(arAnswer).not.toContain('Ahmed Khalid');
    });

    it('formats marksSummary with correct fields', () => {
      const data = {
        totalRecords: 20,
        average: '75.50',
        passed: 15,
        failed: 5,
        target: 'Class A',
        targetAr: 'فصل أ',
      };

      const enAnswer = formatAnswer('marksSummary', data, 'en');
      expect(enAnswer).toContain('Marks Summary');
      expect(enAnswer).toContain('Total Records: 20');
      expect(enAnswer).toContain('Passed: 15');
      expect(enAnswer).toContain('Failed: 5');
    });

    it('formats classCount in Arabic and English', () => {
      const data = { totalCount: 5, programBreakdown: { 'Cyber': 3, 'Network': 2 } };
      const arAnswer = formatAnswer('classCount', data, 'ar');
      expect(arAnswer).toContain('إجمالي الفصول');
      expect(arAnswer).toContain('5');
      const enAnswer = formatAnswer('classCount', data, 'en');
      expect(enAnswer).toContain('Total Classes');
      expect(enAnswer).toContain('5');
    });

    it('formats programInfo in Arabic and English', () => {
      const data = {
        programs: [{ nameEn: 'Cyber Security', nameAr: 'الأمن السيبراني', code: 'CS', classCount: 3, subjectCount: 10, studentCount: 50 }],
        count: 1,
      };
      const enAnswer = formatAnswer('programInfo', data, 'en');
      expect(enAnswer).toContain('Programs');
      expect(enAnswer).toContain('Cyber Security');
      expect(enAnswer).toContain('Classes: 3');
      const arAnswer = formatAnswer('programInfo', data, 'ar');
      expect(arAnswer).toContain('البرامج');
      expect(arAnswer).toContain('الأمن السيبراني');
    });

    it('formats penaltySummary in Arabic and English', () => {
      const data = {
        totalPenalties: 10,
        totalPoints: 25,
        typeBreakdown: { LATE: { name: 'Late', count: 5, points: 10 } },
      };
      const enAnswer = formatAnswer('penaltySummary', data, 'en');
      expect(enAnswer).toContain('Total Penalties: 10');
      expect(enAnswer).toContain('Points: 25');
      const arAnswer = formatAnswer('penaltySummary', data, 'ar');
      expect(arAnswer).toContain('إجمالي العقوبات');
      expect(arAnswer).toContain('10');
    });

    it('formats participationSummary in Arabic and English', () => {
      const data = {
        totalParticipations: 15,
        totalPoints: 30,
        totalPositive: 20,
        totalNegative: 10,
        typeBreakdown: {},
      };
      const enAnswer = formatAnswer('participationSummary', data, 'en');
      expect(enAnswer).toContain('Total Participations: 15');
      expect(enAnswer).toContain('Positive: 20');
      const arAnswer = formatAnswer('participationSummary', data, 'ar');
      expect(arAnswer).toContain('إجمالي المشاركات');
      expect(arAnswer).toContain('15');
    });

    it('formats holidayInfo in Arabic and English', () => {
      const data = {
        holidays: [{ nameEn: 'National Day', nameAr: 'اليوم الوطني', startDate: '2026-12-18', endDate: '2026-12-18', typeName: 'National' }],
        count: 1,
      };
      const enAnswer = formatAnswer('holidayInfo', data, 'en');
      expect(enAnswer).toContain('Holidays');
      expect(enAnswer).toContain('National Day');
      const arAnswer = formatAnswer('holidayInfo', data, 'ar');
      expect(arAnswer).toContain('الإجازات');
      expect(arAnswer).toContain('اليوم الوطني');
    });

    it('formats exportHistory in Arabic and English', () => {
      const data = {
        exports: [{ fileName: 'report.pdf', exportType: 'semester_certificate', format: 'pdf', status: 'completed', createdAt: '2026-01-01', recordCount: 30 }],
        count: 1,
      };
      const enAnswer = formatAnswer('exportHistory', data, 'en');
      expect(enAnswer).toContain('Export History');
      expect(enAnswer).toContain('report.pdf');
      const arAnswer = formatAnswer('exportHistory', data, 'ar');
      expect(arAnswer).toContain('سجل التصدير');
    });
  });

  describe('New parser intents (fallback)', () => {
    it('matches "how many classes" as classCount', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'how many classes are there?');
      expect(result.tool).toBe('classCount');
    });

    it('matches "programs" as programInfo', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'what programs are available?');
      expect(result.tool).toBe('programInfo');
    });

    it('matches "penalties" as penaltySummary', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'how many penalties this month?');
      expect(result.tool).toBe('penaltySummary');
    });

    it('matches "participation" as participationSummary', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'show participation summary');
      expect(result.tool).toBe('participationSummary');
    });

    it('matches "holiday" as holidayInfo', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'what holidays are coming?');
      expect(result.tool).toBe('holidayInfo');
    });

    it('matches "export history" as exportHistory', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'show export history');
      expect(result.tool).toBe('exportHistory');
    });

    it('matches Arabic "البرامج" as programInfo', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'ما هي البرامج المتوفرة؟');
      expect(result.tool).toBe('programInfo');
    });

    it('matches Arabic "عقوب" as penaltySummary', async () => {
      const req = { user: { roles: ['admin'] } };
      const result = await parseQuery(req, 'كم عدد العقوبات؟');
      expect(result.tool).toBe('penaltySummary');
    });
  });

  describe('Schema-Aware RAG', () => {
    it('parses the Prisma schema into models and enums', async () => {
      const { models, enums } = await parsePrismaSchema();
      expect(models.length).toBeGreaterThan(0);
      expect(enums.length).toBeGreaterThan(0);

      const userModel = models.find((m) => m.name === 'User');
      expect(userModel).toBeDefined();
      expect(userModel.fields.some((f) => f.name === 'firstName')).toBe(true);
      expect(userModel.fields.some((f) => f.name === 'email')).toBe(true);
    });

    it('builds natural-language documents from a model', () => {
      const model = {
        name: 'Attendance',
        dbName: 'attendance',
        fields: [
          { name: 'id', type: 'Int', isId: true, isOptional: false, isList: false, defaultValue: 'autoincrement()', attributes: '@id @default(autoincrement())' },
          { name: 'userId', type: 'Int', isOptional: false, isList: false, attributes: '' },
          { name: 'date', type: 'DateTime', isOptional: false, isList: false, attributes: '' },
          { name: 'statusId', type: 'Int', isOptional: false, isList: false, attributes: '' },
        ],
        relations: [
          { field: 'user', target: 'User', sourceFields: ['userId'], targetFields: ['id'] },
          { field: 'status', target: 'AttendanceStatusTypes', sourceFields: ['statusId'], targetFields: ['id'] },
        ],
      };
      const docs = buildModelDocuments(model);
      expect(docs.length).toBeGreaterThan(0);
      expect(docs[0].text).toContain('Attendance');
      expect(docs[0].text).toContain('attendance');
      expect(docs[0].text).toContain('userId');

      const relationDocs = docs.filter((d) => d.topic === 'relation');
      expect(relationDocs.length).toBe(2);
      expect(relationDocs.some((d) => d.text.includes('User'))).toBe(true);
    });

    it('builds natural-language documents from an enum', () => {
      const enumDef = { name: 'WorkflowStatus', values: ['DRAFT', 'REVIEW', 'APPROVED', 'REJECTED'] };
      const docs = buildEnumDocuments(enumDef);
      expect(docs.length).toBe(1);
      expect(docs[0].text).toContain('WorkflowStatus');
      expect(docs[0].text).toContain('APPROVED');
    });
  });

  describe('Entity-Aware RAG', () => {
    it('builds user documents with Arabic and English names', () => {
      const user = {
        id: 1,
        firstName: 'Ahmed',
        lastName: 'Khalid',
        firstNameAr: 'أحمد',
        lastNameAr: 'خالد',
        email: 'ahmed@example.com',
        studentNumber: 'M001',
        rankEn: 'Cadet',
        rankAr: 'طالب',
        isActive: true,
      };
      const doc = buildUserDocument(user, [{ code: 'student', nameEn: 'Student' }]);
      expect(doc.text).toContain('Ahmed Khalid');
      expect(doc.text).toContain('أحمد');
      expect(doc.text).toContain('M001');
      expect(doc.text).toContain('student');
      expect(doc.entityType).toBe('User');
      expect(doc.id).toBe('user_1');
    });

    it('builds named entity documents for classes and programs', () => {
      const program = { id: 5, code: 'SWE', nameEn: 'Software Engineering', nameAr: 'هندسة البرمجيات' };
      const doc = buildNamedEntityDocument(program, 'Program');
      expect(doc.text).toContain('Software Engineering');
      expect(doc.text).toContain('هندسة البرمجيات');
      expect(doc.text).toContain('SWE');
      expect(doc.entityType).toBe('Program');
    });

    it('builds type documents for lookup values', () => {
      const type = { id: 2, code: 'ABSENT', nameEn: 'Absent', nameAr: 'غائب', description: 'Not present' };
      const doc = buildTypeDocument(type, 'AttendanceStatus');
      expect(doc.text).toContain('Absent');
      expect(doc.text).toContain('غائب');
      expect(doc.entityType).toBe('AttendanceStatus');
    });

    it('formats entities for prompt', () => {
      const docs = [
        { text: 'User Ahmed. Student number M001.' },
        { text: 'Class CS101.' },
      ];
      const ar = formatEntitiesForPrompt(docs, 'ar');
      expect(ar).toContain('كيانات واقعية');
      expect(ar).toContain('Ahmed');

      const en = formatEntitiesForPrompt(docs, 'en');
      expect(en).toContain('Real-world entities');
      expect(en).toContain('CS101');
    });
  });
});
