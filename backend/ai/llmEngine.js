/**
 * LLM Engine with Tool Calling (Offline via Ollama)
 *
 * Full agentic flow:
 * 1. User asks a question in any phrasing (English/Arabic)
 * 2. LLM receives the question + tool definitions (function calling)
 * 3. LLM decides which tool(s) to call and with what parameters
 * 4. Backend executes the tool (scoped DB query)
 * 5. Tool results go back to the LLM
 * 6. LLM generates a natural language answer from the data
 * 7. Answer is cached in Redis
 *
 * Falls back to rule-based parser + template answers when Ollama is unavailable.
 */

import { getScopedClasses, getScopedPrograms } from './scope.js';
import { checkToolAccess } from './permissions.js';
import { getTool } from './tools/index.js';
import { mapDateRange, isOllamaAvailable } from './llmParser.js';
import { getCachedAnswer, setCachedAnswer, isCacheAvailable, getCachedMetric, setCachedMetric } from './cache.js';
import { formatAnswer } from '../services/aiQueryService.js';
import { getRagContext } from './rag.js';
import { resolveScopeKey } from './dataCache.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b';
const OLLAMA_INTENT_MODEL = process.env.OLLAMA_INTENT_MODEL || OLLAMA_MODEL;
const OLLAMA_REASONING_MODEL = process.env.OLLAMA_REASONING_MODEL || OLLAMA_MODEL;
const OLLAMA_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS || '120000', 10);
const AI_LLM_REASONING = process.env.AI_LLM_REASONING === 'true';

// Use a shorter timeout for the first LLM call (tool selection) so users don't wait
// too long if Ollama is slow. On CPU-first loads this still needs enough time to load
// the model into memory. If it times out, we fall back immediately to the rule-based parser.
const FIRST_LLM_TIMEOUT_MS = Math.min(
  600000,
  parseInt(process.env.AI_FIRST_LLM_TIMEOUT_MS || OLLAMA_TIMEOUT_MS, 10)
);

/**
 * Build tool definitions for Ollama function calling.
 * These describe the available tools to the LLM.
 */
const DATE_RANGE_PARAM = {
  type: 'string',
  description: 'Time period for the query. Use one of: today, yesterday, this_week, last_week, this_month, last_month, last_N_days (e.g. last_10_days), last_N_weeks, last_N_months, or none.',
};

const CLASS_ID_PARAM = { type: 'number', description: 'Specific class ID if known from context. Omit if not specified.' };
const PROGRAM_ID_PARAM = { type: 'number', description: 'Specific program ID if known from context. Omit if not specified.' };

export const TOOL_DEFINITIONS = [
  // === Existing 10 tools ===
  {
    type: 'function',
    function: {
      name: 'getAttendanceSummary',
      description: 'Get attendance statistics: present, absent, excused, and human case counts, plus attendance rate. Use for questions about attendance, absences, حضور, غياب, نسبة الحضور.',
      parameters: {
        type: 'object',
        properties: { dateRange: DATE_RANGE_PARAM, classId: CLASS_ID_PARAM, programId: PROGRAM_ID_PARAM },
        required: ['dateRange'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getAbsenceWarningCounts',
      description: 'Get counts of students reaching absence warning thresholds: first warning (4+ absences) and final warning (9+ absences). Use for questions about warnings, إنذار, إنذارات.',
      parameters: {
        type: 'object',
        properties: {
          warningType: { type: 'string', enum: ['first', 'final', 'all'], description: 'Which warning type. Use "all" if not specified.' },
          classId: CLASS_ID_PARAM,
          programId: PROGRAM_ID_PARAM,
        },
        required: ['warningType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getLateCount',
      description: 'Get late arrival records and counts. Admin only. Use for questions about late arrivals, تأخير, متأخر.',
      parameters: {
        type: 'object',
        properties: { dateRange: DATE_RANGE_PARAM, classId: CLASS_ID_PARAM },
        required: ['dateRange'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getHumanCaseCount',
      description: 'Get humanitarian case attendance records and counts. Use for questions about human cases, حالة إنسانية, حالات إنسانية.',
      parameters: {
        type: 'object',
        properties: { dateRange: DATE_RANGE_PARAM, classId: CLASS_ID_PARAM },
        required: ['dateRange'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getStudentCount',
      description: 'Get the number of enrolled students with optional class breakdown. Use ONLY for questions about students, عدد الطلاب, كم طالب, enrolled students. Do NOT use for classes, programs or subjects.',
      parameters: {
        type: 'object',
        properties: { classId: CLASS_ID_PARAM, programId: PROGRAM_ID_PARAM },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getMarksSummary',
      description: 'Get student marks/grades summary: average score, pass/fail counts, total records. Use for questions about marks, grades, درجات, متوسط, نتائج, نجاح, رسوب.',
      parameters: {
        type: 'object',
        properties: { classId: CLASS_ID_PARAM, programId: PROGRAM_ID_PARAM },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getScheduleSummary',
      description: 'Get scheduled class sessions, lectures, and timetable. Use for questions about schedule, جدول, محاضرات, حصص, sessions.',
      parameters: {
        type: 'object',
        properties: { dateRange: DATE_RANGE_PARAM, classId: CLASS_ID_PARAM },
        required: ['dateRange'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getWorkflowSummary',
      description: 'Get workflow document status: pending, approved, rejected, draft counts. Or get details of a specific workflow by ID. Use for questions about workflows, معاملات, اعتماد, سير العمل.',
      parameters: {
        type: 'object',
        properties: {
          workflowId: { type: 'number', description: 'Specific workflow document ID if mentioned. Omit if asking for summary.' },
          dateRange: DATE_RANGE_PARAM,
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getNotesAndComments',
      description: 'Get notes, comments, and remarks on workflow documents and attendance records. Admin only. Use for questions about notes, comments, ملاحظات, تعليقات.',
      parameters: {
        type: 'object',
        properties: {
          workflowId: { type: 'number', description: 'Specific workflow document ID if mentioned.' },
          classId: CLASS_ID_PARAM,
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTopAbsenceStudent',
      description: 'Find the student(s) with the most/highest absences. Use for questions like "which student has the most absences", اكثر طالب غياب, اعلى غياب.',
      parameters: {
        type: 'object',
        properties: { dateRange: DATE_RANGE_PARAM, classId: CLASS_ID_PARAM, programId: PROGRAM_ID_PARAM },
        required: ['dateRange'],
      },
    },
  },

  // === New 20 tools ===
  {
    type: 'function',
    function: {
      name: 'getClassCount',
      description: 'Count active classes, optionally filtered by program. Use ONLY for "how many classes", عدد الفصول, كم فصل. Do NOT use for student or program counts.',
      parameters: {
        type: 'object',
        properties: { programId: PROGRAM_ID_PARAM },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getAttendanceTypes',
      description: 'List all active attendance status types in the system. Use for "types of attendance", أنواع الحضور, حالات الحضور.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getProgramInfo',
      description: 'List programs with class, student, and subject counts. Use for "what programs do we have", البرامج, الدبلومات.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getSubjectInfo',
      description: 'List subjects with credits and program info, optionally filtered by program. Use for "what subjects", المواد, المواد الدراسية.',
      parameters: {
        type: 'object',
        properties: { programId: PROGRAM_ID_PARAM },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getEnrollmentInfo',
      description: 'Enrollment breakdown by status (active, withdrawn, graduated, etc.). Use for "enrollment breakdown", التسجيل, المسجلين.',
      parameters: {
        type: 'object',
        properties: { programId: PROGRAM_ID_PARAM },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getPenaltySummary',
      description: 'Summary of penalties by type and total points. Use for "penalties", العقوبات, جزاءات.',
      parameters: {
        type: 'object',
        properties: { programId: PROGRAM_ID_PARAM },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getBehaviorSummary',
      description: 'Summary of behaviors by type and total points. Use for "behaviors", السلوك, السلوكيات.',
      parameters: {
        type: 'object',
        properties: { programId: PROGRAM_ID_PARAM },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getMarksDistribution',
      description: 'Marks distribution weights for a subject (e.g. midterm 30%, final 70%). Use for "marks distribution", توزيع الدرجات, وزن الدرجات.',
      parameters: {
        type: 'object',
        properties: { classId: CLASS_ID_PARAM, programId: PROGRAM_ID_PARAM, subjectId: { type: 'number', description: 'Specific subject ID if known.' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getParticipationSummary',
      description: 'Summary of participation by type (positive/negative) and total points. Use for "participation", المشاركة, مشاركات.',
      parameters: {
        type: 'object',
        properties: { programId: PROGRAM_ID_PARAM },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getActivityInfo',
      description: 'List class activities with type and submission counts. Use for "activities", الأنشطة, تكاليف.',
      parameters: {
        type: 'object',
        properties: { classId: CLASS_ID_PARAM, programId: PROGRAM_ID_PARAM },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getAnnouncementInfo',
      description: 'Recent announcements count and list with titles/dates. Use for "announcements", إعلانات, تنبيهات.',
      parameters: {
        type: 'object',
        properties: { classId: CLASS_ID_PARAM, programId: PROGRAM_ID_PARAM },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getQuizSummary',
      description: 'Quiz stats: total quizzes, attempts, average scores, pass rate. Use for "quiz", "quizzes", اختبارات قصيرة, نتائج الاختبارات.',
      parameters: {
        type: 'object',
        properties: { classId: CLASS_ID_PARAM, programId: PROGRAM_ID_PARAM },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getStandupAttendance',
      description: 'Standup/morning assembly attendance summary. Use for "standup", "morning assembly", طابور, حضور الطابور.',
      parameters: {
        type: 'object',
        properties: { dateRange: DATE_RANGE_PARAM, classId: CLASS_ID_PARAM, programId: PROGRAM_ID_PARAM },
        required: ['dateRange'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getClassroomInfo',
      description: 'List classrooms with capacity, equipment, status. Use for "classrooms", القاعات, الغرف, قاعات الدراسة.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getSubmissionSummary',
      description: 'Submission counts by status (submitted, graded, pending, late). Use for "submissions", التسليمات, تسليم الواجبات.',
      parameters: {
        type: 'object',
        properties: { classId: CLASS_ID_PARAM, programId: PROGRAM_ID_PARAM },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getHolidayInfo',
      description: 'List upcoming/current holidays. Use for "holidays", الإجازات, العطل.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getBreakSessionSummary',
      description: 'Summary of break sessions (tea, prayer, lunch) by type and count. Use for "break sessions", الاستراحات, فترات الراحة.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getSessionSummary',
      description: 'Scheduled session counts by status (scheduled, completed, cancelled) and type (lecture, office_hours). Use for "sessions summary", الجلسات, عدد الحصص المجدولة.',
      parameters: {
        type: 'object',
        properties: { dateRange: DATE_RANGE_PARAM, classId: CLASS_ID_PARAM, programId: PROGRAM_ID_PARAM },
        required: ['dateRange'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getAcademicClosureInfo',
      description: 'Academic closure info by type (weekly, monthly, semester) and scope. Use for "academic closures", الإغلاقات الأكاديمية, إغلاق.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getExportHistory',
      description: 'Recent export history for the current user. Use for "export history", سجل التصدير, التقارير المصدرة.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

/**
 * Tool categories for the 2-stage LLM router.
 * Stage 1: a small model picks the most relevant categories.
 * Stage 2: the model sees only tools inside those categories.
 */
const TOOL_CATEGORIES = {
  attendance: ['getAttendanceSummary', 'getAbsenceWarningCounts', 'getLateCount', 'getHumanCaseCount', 'getTopAbsenceStudent', 'getStandupAttendance', 'getAttendanceTypes'],
  marks: ['getMarksSummary', 'getMarksDistribution'],
  students: ['getClassCount', 'getStudentCount', 'getEnrollmentInfo', 'getProgramInfo', 'getSubjectInfo'],
  schedule: ['getScheduleSummary', 'getClassroomInfo', 'getSessionSummary', 'getHolidayInfo', 'getBreakSessionSummary', 'getAcademicClosureInfo'],
  activities: ['getActivityInfo', 'getQuizSummary', 'getSubmissionSummary', 'getAnnouncementInfo'],
  behavior: ['getPenaltySummary', 'getBehaviorSummary', 'getParticipationSummary', 'getNotesAndComments'],
  workflows: ['getWorkflowSummary', 'getExportHistory'],
};

const CATEGORY_DESCRIPTIONS = {
  attendance: 'Attendance, absences, late, warnings, standup, attendance types.',
  marks: 'Marks, grades, marks distribution.',
  students: 'Students, classes, programs, subjects, enrollment counts and info.',
  schedule: 'Schedule, sessions, classrooms, holidays, breaks, academic closures.',
  activities: 'Activities, quizzes, submissions, announcements.',
  behavior: 'Penalties, behavior, participation, notes.',
  workflows: 'Workflows, approvals, export history.',
};

const COMMON_TOOLS = new Set(['getClassCount', 'getStudentCount', 'getAttendanceSummary', 'getMarksSummary', 'getProgramInfo']);

/**
 * Map LLM tool names to internal tool names.
 */
export const TOOL_NAME_MAP = {
  // Existing
  getAttendanceSummary: 'attendanceSummary',
  getAbsenceWarningCounts: 'absenceWarningCounts',
  getLateCount: 'lateCount',
  getHumanCaseCount: 'humanCaseCount',
  getStudentCount: 'studentCount',
  getMarksSummary: 'marksSummary',
  getScheduleSummary: 'scheduleSummary',
  getWorkflowSummary: 'workflowSummary',
  getNotesAndComments: 'notesAndComments',
  getTopAbsenceStudent: 'topAbsenceStudent',
  // New
  getClassCount: 'classCount',
  getAttendanceTypes: 'attendanceTypes',
  getProgramInfo: 'programInfo',
  getSubjectInfo: 'subjectInfo',
  getEnrollmentInfo: 'enrollmentInfo',
  getPenaltySummary: 'penaltySummary',
  getBehaviorSummary: 'behaviorSummary',
  getMarksDistribution: 'marksDistribution',
  getParticipationSummary: 'participationSummary',
  getActivityInfo: 'activityInfo',
  getAnnouncementInfo: 'announcementInfo',
  getQuizSummary: 'quizSummary',
  getStandupAttendance: 'standupAttendance',
  getClassroomInfo: 'classroomInfo',
  getSubmissionSummary: 'submissionSummary',
  getHolidayInfo: 'holidayInfo',
  getBreakSessionSummary: 'breakSessionSummary',
  getSessionSummary: 'sessionSummary',
  getAcademicClosureInfo: 'academicClosureInfo',
  getExportHistory: 'exportHistory',
};

/**
 * Build context about the user's accessible classes and programs
 * so the LLM can resolve entity references (class names, program names) to IDs.
 */
async function buildUserContext(req) {
  const [classes, programs] = await Promise.all([
    getScopedClasses(req),
    getScopedPrograms(req),
  ]);

  const classList = classes.map((c) => ({
    id: c.id,
    name: c.nameEn || c.nameAr || c.code,
    nameAr: c.nameAr || c.nameEn || c.code,
    code: c.code,
    programId: c.programId,
  }));

  const programList = programs.map((p) => ({
    id: p.id,
    name: p.nameEn || p.nameAr || p.code,
    nameAr: p.nameAr || p.nameEn || p.code,
    code: p.code,
  }));

  return { classes: classList, programs: programList };
}

/**
 * Build the system prompt with user context.
 */
function buildSystemPrompt(userContext, userLang, ragContext = '') {
  const langInstruction = userLang === 'ar'
    ? 'Respond in Arabic. If the question is in English, still respond in Arabic unless asked otherwise.'
    : 'Respond in English. If the question is in Arabic, still respond in English unless asked otherwise.';

  const classList = userContext.classes.length > 0
    ? userContext.classes.slice(0, 20).map((c) => `  - ID: ${c.id}, Name: "${c.name}" / "${c.nameAr}", Code: ${c.code}`)
    : '  (No specific classes assigned - user has unrestricted access)';

  const programList = userContext.programs.length > 0
    ? userContext.programs.slice(0, 10).map((p) => `  - ID: ${p.id}, Name: "${p.name}" / "${p.nameAr}", Code: ${p.code}`)
    : '  (No specific programs assigned - user has unrestricted access)';

  return `You are an AI assistant for a Military Learning Management System (LMS). You help administrators and HR staff query student data, attendance, marks, schedules, workflows, and more.

${langInstruction}

${ragContext ? `${ragContext}\n\n` : ''}## DATABASE SCHEMA (non-sensitive fields only)

### Core Entities
- **Program**: id, code, nameEn, nameAr, isActive — Academic programs/diplomas (e.g. Cyber Security Diploma)
- **Subject**: id, code, nameEn, nameAr, credits, programId — Subjects within programs
- **Class**: id, code, nameEn, nameAr, programId, subjectId, isActive — Specific class sections
- **Enrollment**: userId, classId, programId, statusId — Student enrollment in classes
- **User**: id, firstName, lastName, firstNameAr, lastNameAr, studentNumber, rankEn, rankAr — Students/instructors (NEVER expose email, password, keycloakId, imageUrl, ip, userAgent)

### Attendance
- **Attendance**: userId, classId, date, statusId — Daily attendance records
- **AttendanceStatusTypes**: code, nameEn, nameAr — Types: PRESENT, ABSENT, LEAVE, HUMAN_CASE, LATE
- **StandupAttendance**: userId, classId, date, status — Morning assembly/standup attendance

### Academic
- **StudentMarks**: userId, classId, marks, grade — Student grades
- **MarksDistribution**: classId, subjectId, assessmentType, weight, maxMarks — Grade weights (e.g. midterm 30%, final 70%)
- **Activity**: classId, title, type, dueDate, maxScore — Class activities/assignments
- **Submission**: activityId, userId, status — Assignment submissions (submitted, graded, pending, late)
- **Quiz**: classId, title, status, maxScore, passingScore — Quizzes
- **QuizAttempt**: quizId, userId, score, passed — Quiz attempt results
- **Announcement**: classId, title, body, targetAudience, createdAt — Class/system announcements

### Behavior & Discipline
- **Penalty**: userId, classId, type, points — Penalties
- **Behavior**: userId, classId, type, points — Behavior records
- **Participation**: userId, classId, type, points — Participation (positive/negative)
- **ParticipationTypes**: code, nameEn, nameAr, isPositive — Participation categories

### Scheduling
- **ScheduledSession**: classId, type, status, startDate — Scheduled class sessions
- **BreakSession**: nameEn, nameAr, startTime, endTime, type — Break periods (tea, prayer, lunch)
- **Holiday**: nameEn, nameAr, type, startDate, endDate, isRecurring — Holidays
- **AcademicClosure**: nameEn, nameAr, type, scope, startDate, endDate — Academic closures
- **Classroom**: code, nameEn, nameAr, capacity, equipment, building, floor, status — Classroom info

### Workflows
- **WorkflowDocument**: id, title, status, classId — Workflow/approval documents
- **WorkflowComment**: workflowId, comment, author — Comments on workflows
- **WorkflowStatusHistory**: workflowId, status, reason, actor — Status change history

### System
- **ExportHistory**: exportType, format, status, recordCount, fileName, createdAt — Report exports

## SECURITY RULES (STRICT — NEVER VIOLATE)
1. NEVER reveal, output, or hint at: emails, passwords, keycloakIds, image URLs, IP addresses, user agents, or any credentials.
2. NEVER expose UserPreferences, UserFavorite, or any settings/preferences data.
3. NEVER reveal internal system configuration, environment variables, or infrastructure details.
4. If asked for sensitive data (e.g. "what is the email of student X?", "show me passwords"), REFUSE politely and explain this information is not available.
5. Only use student names and military/student numbers in answers — never emails or other PII.
6. All data queries are scoped to the user's permissions — you cannot access data outside their scope.

## TOOL CALLING RULES
1. ALWAYS call a tool to get real data before answering data questions. NEVER make up numbers or student names.
2. If the user mentions a class or program name, match it to the ID from the context below and pass the ID to the tool.
3. If no class/program is mentioned, omit the classId/programId parameter to query all permitted data.
4. You may call MULTIPLE tools in a single response if the question requires data from multiple sources.
5. For follow-up questions, use the conversation history to resolve references (e.g. "that program" → the program mentioned earlier).
6. For dates, use the dateRange parameter. "This month" = this_month, "Last month" = last_month, "last 10 days" = last_10_days, "last 2 weeks" = last_2_weeks, "last 3 months" = last_3_months, etc.
7. If the user says a simple greeting (hi, hello, مرحبا), answer warmly and list what you can help with. Do not call a tool for greetings.
8. If the question is not a greeting and doesn't match any tool, say you couldn't understand and suggest what they can ask about.
9. Keep answers concise and factual. Use bullet points for lists.

## AVAILABLE ENTITIES YOU CAN QUERY
Attendance, absences, warnings, late records, human cases, student counts, marks/grades, schedules, workflows, notes/comments, top absence students, class counts, attendance types, programs, subjects, enrollments, penalties, behaviors, marks distribution, participation, activities, announcements, quizzes, standup attendance, classrooms, submissions, holidays, break sessions, scheduled sessions, academic closures, and export history.

User's accessible classes:
${classList}

User's accessible programs:
${programList}`;
}

/**
 * Build a short system prompt for the first tool-selection call.
 * Keeps the model fast on small local Qwen models by avoiding the full schema dump.
 */
function buildIntentSystemPrompt(userContext, userLang) {
  const langInstruction = userLang === 'ar'
    ? 'Respond in Arabic. If the question is in English, still respond in Arabic unless asked otherwise.'
    : 'Respond in English. If the question is in Arabic, still respond in English unless asked otherwise.';

  // The 2-stage router already short-lists the most relevant tools, so the
  // model only needs a concise reminder. Keep it short for the small local
  // Qwen model on CPU.
  return `You are a smart Military LMS assistant.

${langInstruction}

CRITICAL: You MUST call one of the provided tools. Do not answer the user directly. Do not ask for clarification. Never make up numbers.

TOOL RULES:
1. ALWAYS call a tool for data questions.
2. If the user mentions a class/program name and you know its ID, pass the numeric ID; otherwise omit classId/programId.
3. For dates use dateRange: today, yesterday, this_week, last_week, this_month, last_month, last_N_days, last_N_weeks, last_N_months.
4. Disambiguation (CRITICAL — never mix these up):
   - For students, enrolled, طلاب: call getStudentCount.
   - For classes, فصول: call getClassCount.
   - For programs, برامج, diplomas: call getProgramInfo.
   - For subjects, مواد: call getSubjectInfo.`;
}

/**
 * Execute a tool call from the LLM.
 */
async function executeToolCall(req, toolCall) {
  const fnName = toolCall.function?.name;
  let fnArgs = toolCall.function?.arguments || '{}';
  if (typeof fnArgs === 'string') {
    try {
      fnArgs = JSON.parse(fnArgs);
    } catch {
      console.warn('[AI LLM Engine] Could not parse tool arguments:', fnArgs);
      fnArgs = {};
    }
  }

  const internalName = TOOL_NAME_MAP[fnName];
  if (!internalName) {
    return { error: `Unknown tool: ${fnName}` };
  }

  // Permission check
  const accessCheck = checkToolAccess(req, internalName);
  if (!accessCheck.allowed) {
    return { error: accessCheck.reason };
  }

  // Get tool implementation
  const tool = getTool(internalName);
  if (!tool) {
    return { error: `Tool ${internalName} is not implemented` };
  }

  // Map LLM params to tool params
  const dates = fnArgs.dateRange ? mapDateRange(fnArgs.dateRange) : {};
  const params = {
    ...dates,
    classId: fnArgs.classId,
    programId: fnArgs.programId,
    workflowId: fnArgs.workflowId,
    warningType: fnArgs.warningType,
    subjectId: fnArgs.subjectId,
  };

  // Remove undefined / null / empty / 0 / '0' id values (LLM may emit programId: 0 for "all")
  for (const k of Object.keys(params)) {
    const v = params[k];
    if (v === undefined || v === null) {
      delete params[k];
    } else if ((k === 'classId' || k === 'programId' || k === 'subjectId' || k === 'workflowId') && (v === 0 || v === '0' || v === '')) {
      delete params[k];
    }
  }

  console.log('[AI LLM Engine] Executing tool:', internalName, 'params:', { ...params, dateFrom: params.dateFrom?.toISOString?.() });

  // Try the precomputed metric cache first (Redis)
  try {
    const scopeKey = await resolveScopeKey(req, params);
    if (scopeKey) {
      const metricCacheTtl = parseInt(process.env.AI_METRIC_CACHE_TTL_SECONDS || '60', 10);
      const cached = await getCachedMetric(internalName, params, scopeKey);
      if (cached) {
        console.log('[AI LLM Engine] Metric cache hit:', internalName, scopeKey);
        return { success: true, data: cached.data };
      }
      // Execute live and store in metric cache for high-rate reuse
      const result = await tool.execute(req, params);
      if (result && result.success) {
        await setCachedMetric(internalName, params, scopeKey, result.data, metricCacheTtl);
      }
      return result;
    }
  } catch (err) {
    console.warn('[AI LLM Engine] Metric cache check failed:', err.message);
  }

  try {
    const result = await tool.execute(req, params);
    return result;
  } catch (err) {
    console.error('[AI LLM Engine] Tool execution error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Call Ollama chat API with tool support.
 */
async function callOllamaWithTools(messages, tools, systemPrompt, timeoutMs = OLLAMA_TIMEOUT_MS, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const model = options.model || OLLAMA_MODEL;
    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: false,
      think: false,
      keep_alive: '30m',
      options: {
        temperature: 0.1,
        num_predict: options.num_predict ?? 500,
        num_ctx: options.num_ctx ?? 4096,
      },
    };

    if (options.format) {
      body.format = options.format;
    }

    if (tools && tools.length > 0) {
      body.tools = tools;
    }

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      throw new Error(`Ollama call timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Stage 1 router: ask the LLM to pick the most relevant tool categories
 * for the user's question. This keeps the real tool-calling call small
 * enough for the small local Qwen model to handle on CPU.
 */
async function selectToolCategories(message, userLang, timeoutMs = FIRST_LLM_TIMEOUT_MS, model = OLLAMA_INTENT_MODEL) {
  const langInstruction = userLang === 'ar'
    ? 'Respond in Arabic.'
    : 'Respond in English.';
  const catalog = Object.entries(CATEGORY_DESCRIPTIONS)
    .map(([name, desc]) => `- ${name}: ${desc}`)
    .join('\n');

  const system = `You are a smart Military LMS router.

${langInstruction}

Pick the SINGLE best category for the user question. Only pick a second category if the question clearly asks about two different topics (e.g. "attendance and marks for class 1").

Categories:
${catalog}`;

  const schema = {
    type: 'object',
    properties: {
      categories: {
        type: 'array',
        items: { type: 'string', enum: Object.keys(CATEGORY_DESCRIPTIONS) },
        minItems: 1,
        maxItems: 2,
        description: 'Best category names for this question',
      },
    },
    required: ['categories'],
  };

  try {
    const res = await callOllamaWithTools(
      [{ role: 'user', content: message.trim() }],
      null,
      system,
      timeoutMs,
      { model, num_predict: 80, num_ctx: 1024, format: schema },
    );

    const content = res?.message?.content || '{"categories":[]}';
    const parsed = JSON.parse(content);
    const categories = Array.from(new Set((parsed.categories || []).filter((c) => TOOL_CATEGORIES[c])));

    console.log('[AI LLM Engine] Category router selected:', categories);
    return categories.length > 0 ? categories : ['students', 'attendance'];
  } catch (err) {
    console.warn('[AI LLM Engine] Category router failed:', err.message);
    // Safe fallback: expose a few common categories so the user still gets an answer.
    return ['students', 'attendance'];
  }
}

/**
 * Full LLM agentic flow: question → tool calls → natural language answer.
 *
 * @param {Object} req - Express request with user info
 * @param {string} message - User's question
 * @param {string} userLang - 'ar' or 'en'
 * @param {Array} history - Optional conversation history [{role, text}, ...]
 * @returns {Object} { success, answer, tool, data, cached }
 */
export async function processWithLLM(req, message = '', userLang = 'ar', history = []) {
  if (!message || typeof message !== 'string') {
    return { success: false, answer: 'Empty question', tool: 'unknown' };
  }

  // Build user scope key for cache isolation
  const userId = req.user?.id || 'anonymous';
  const scopeKey = `u${userId}`;

  // 1. Check Redis cache
  const cacheAvailable = await isCacheAvailable();
  if (cacheAvailable) {
    const cached = await getCachedAnswer(message, scopeKey);
    if (cached) {
      console.log('[AI LLM Engine] Cache hit for:', message.slice(0, 60));
      return { ...cached, cached: true };
    }
  }

  // 2. Check Ollama availability
  const ollamaReady = await isOllamaAvailable();
  if (!ollamaReady) {
    console.log('[AI LLM Engine] Ollama not available, returning null to trigger fallback');
    return null; // Signal to caller to use fallback
  }

  // 3. Build user context (scoped classes/programs for the LLM)
  const userContext = await buildUserContext(req);

  // 3a. Retrieve schema-aware RAG context for the reasoning call later
  let ragContext = '';
  try {
    ragContext = await getRagContext(message, userLang, 8);
    console.log('[AI LLM Engine] RAG context length:', ragContext.length);
  } catch (ragErr) {
    console.warn('[AI LLM Engine] RAG context retrieval failed:', ragErr.message);
  }

  // Fast intent prompt (small) for tool selection, full prompt for answer generation
  const intentSystemPrompt = buildIntentSystemPrompt(userContext, userLang);
  const systemPrompt = buildSystemPrompt(userContext, userLang, ragContext);

  // 4. Build conversation messages from history + current question
  const conversationMessages = [];
  const recentHistory = history.slice(-10); // Keep last 10 messages for context
  for (const h of recentHistory) {
    if (h.role === 'user' && h.text) {
      conversationMessages.push({ role: 'user', content: h.text });
    } else if (h.role === 'ai' && h.text) {
      conversationMessages.push({ role: 'assistant', content: h.text });
    }
  }
  conversationMessages.push({ role: 'user', content: message.trim() });

  // 5. Two-stage LLM-only routing:
  //    5a. Category router picks the relevant topic.
  //    5b. The model sees only the tools inside that category.
  //    This keeps the prompt small enough for qwen2.5:1.5b to handle on CPU.
  console.log('[AI LLM Engine] Stage 1: routing question to categories:', message.slice(0, 80));
  const selectedCategory = (await selectToolCategories(message, userLang))[0];

  const selectedToolNames = new Set();
  if (selectedCategory && TOOL_CATEGORIES[selectedCategory]) {
    for (const toolName of TOOL_CATEGORIES[selectedCategory]) {
      selectedToolNames.add(toolName);
    }
  }
  // Always expose a few common count/info tools so broad questions are answerable.
  for (const toolName of COMMON_TOOLS) {
    selectedToolNames.add(toolName);
  }

  const selectedTools = TOOL_DEFINITIONS.filter((t) => selectedToolNames.has(t.function.name));
  console.log('[AI LLM Engine] Stage 2: short-listed', selectedTools.length, 'tools for LLM:', selectedTools.map(t => t.function.name).join(', '));

  let firstResponse;
  try {
    firstResponse = await callOllamaWithTools(
      conversationMessages,
      selectedTools,
      intentSystemPrompt,
      FIRST_LLM_TIMEOUT_MS,
      { num_predict: 120, num_ctx: 1024, model: OLLAMA_INTENT_MODEL },
    );
  } catch (llmErr) {
    console.warn('[AI LLM Engine] LLM call failed/timed out, returning null for fallback:', llmErr.message);
    return null;
  }

  const assistantMessage = firstResponse.message;
  console.log('[AI LLM Engine] LLM response:', {
    hasToolCalls: !!(assistantMessage?.tool_calls?.length),
    toolCalls: assistantMessage?.tool_calls?.map((tc) => tc.function?.name),
    hasContent: !!assistantMessage?.content,
  });

  // 6. If LLM made tool calls, execute them (support multi-tool)
  if (assistantMessage?.tool_calls?.length > 0) {
    const toolCalls = assistantMessage.tool_calls;
    const toolNames = toolCalls.map((tc) => TOOL_NAME_MAP[tc.function?.name] || 'unknown');
    const primaryTool = toolNames[0];

    // Execute all tool calls
    const toolResults = [];
    for (let i = 0; i < toolCalls.length; i++) {
      const toolCall = toolCalls[i];
      const toolName = toolNames[i];
      const result = await executeToolCall(req, toolCall);
      toolResults.push({ tool: toolName, result });
      console.log('[AI LLM Engine] Tool result:', toolName, 'success:', result?.success);
    }

    // Use the first successful result for answer generation
    const firstResult = toolResults[0];
    if (!firstResult?.result?.success) {
      return {
        success: false,
        tool: primaryTool,
        error: firstResult?.result?.error,
        answer: userLang === 'ar'
          ? `حدث خطأ أثناء تنفيذ الاستعلام: ${firstResult?.result?.error}`
          : `An error occurred: ${firstResult?.result?.error}`,
      };
    }

    // 7. Optional reasoning call: ask the LLM to turn the tool data into a natural-language answer.
    // Disabled by default on CPU-only Ollama because it adds another 30-60s.
    let answer;
    if (AI_LLM_REASONING) {
      try {
        const resultText = JSON.stringify(firstResult.result.data, null, 2);
        const reasoningMessages = [
          { role: 'system', content: `${systemPrompt}\n\nYou have just called a tool. Use the tool result below to answer the user's question. Be concise, factual, and respond in the user\'s language.` },
          ...conversationMessages,
          { role: 'assistant', content: `[Tool call: ${firstResult.tool}]` },
          { role: 'user', content: `Tool result:\n${resultText}\n\nAnswer the user\'s question based on this data. Do not make up numbers.` },
        ];
        const reasoningResponse = await callOllamaWithTools(
          reasoningMessages,
          null,
          null,
          OLLAMA_TIMEOUT_MS,
          { model: OLLAMA_REASONING_MODEL, num_predict: 300, num_ctx: 2048 },
        );
        answer = reasoningResponse?.message?.content?.trim();
      } catch (reasoningErr) {
        console.warn('[AI LLM Engine] Reasoning call failed, falling back to template:', reasoningErr.message);
      }
    } else {
      console.log('[AI LLM Engine] Reasoning disabled; using template answer');
    }

    if (!answer) {
      answer = formatAnswer(primaryTool, firstResult.result.data, userLang, {});
    }

    const result = {
      success: true,
      tool: primaryTool,
      answer,
      data: firstResult.result.data,
      toolsCalled: toolNames,
    };

    // 8. Cache the result
    if (cacheAvailable) {
      await setCachedAnswer(message, result, scopeKey);
    }

    return result;
  }

  // 8. LLM didn't call any tool — it either answered directly or didn't understand
  if (assistantMessage?.content) {
    console.log('[AI LLM Engine] LLM direct content:', assistantMessage.content.slice(0, 200));
    console.log('[AI LLM Engine] LLM answered directly without a tool; treating as unknown');
  }

  // 9. LLM returned nothing useful
  return {
    success: true,
    tool: 'unknown',
    answer: userLang === 'ar'
      ? 'عذراً، لم أتمكن من فهم السؤال. يمكنك السؤال عن: الحضور والغياب، الإنذارات، التأخير، الحالات الإنسانية، أعداد الطلاب، الدرجات، الجداول، معاملات سير العمل، الملاحظات، الفصول، البرامج، المواد، التسجيل، العقوبات، السلوك، المشاركة، الأنشطة، الإعلانات، الاختبارات، الطابور، القاعات، التسليمات، الإجازات، الاستراحات، الجلسات، الإغلاقات الأكاديمية، أو سجل التصدير.'
      : 'Sorry, I could not understand the question. You can ask about: attendance, absences, warnings, late records, human cases, student counts, marks, schedules, workflows, notes, classes, programs, subjects, enrollment, penalties, behaviors, participation, activities, announcements, quizzes, standup, classrooms, submissions, holidays, break sessions, sessions, academic closures, or export history.',
  };
}

export default {
  processWithLLM,
  isOllamaAvailable,
  TOOL_DEFINITIONS,
  TOOL_NAME_MAP,
};
