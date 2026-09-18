/**
 * LLM-Powered Intent Parser (Offline via Ollama)
 *
 * Uses a local LLM (Qwen 2.5) running through Ollama to parse natural language
 * questions into structured intents. Falls back to the rule-based parser if
 * Ollama is unavailable or the LLM response is invalid.
 *
 * The LLM only does intent classification + entity extraction.
 * All data queries and answer formatting remain rule-based for reliability.
 */

import { parseQuery as ruleBasedParse } from './parser.js';
import { extractDateRange, extractEntities } from './parser.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const OLLAMA_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS || '15000', 10);

const SYSTEM_PROMPT = `You are an intent parser for a Military Learning Management System AI assistant.
Given a user's question (in English or Arabic), extract the intent and return ONLY valid JSON.

Available tools:
1. "attendanceSummary" - Attendance/absence statistics (present, absent, excused, human case counts, attendance rate)
2. "absenceWarningCounts" - Absence warning counts (first warning = 4+ absences, final warning = 9+ absences)
3. "lateCount" - Late arrival records (admin only)
4. "humanCaseCount" - Humanitarian case records
5. "studentCount" - Number of enrolled students, student counts
6. "marksSummary" - Student marks/grades summary (average score, pass/fail counts)
7. "scheduleSummary" - Class schedule, lectures, sessions, timetable
8. "workflowSummary" - Workflow document status (pending, approved, rejected, drafts, approval time)
9. "notesAndComments" - Notes, comments, remarks, feedback on records (admin only)
10. "topAbsenceStudent" - Student(s) with the most/highest absences

Return JSON in this exact format:
{
  "tool": "<tool_name from the list above>",
  "dateRange": "today|yesterday|this_week|last_week|this_month|last_month|none",
  "entityKeyword": "<class name, program name, or code mentioned in the question, or null>",
  "workflowId": <number or null>,
  "warningType": "first|final|none"
}

Rules:
- If the question does not match any tool, return {"tool": "unknown", "dateRange": "none", "entityKeyword": null, "workflowId": null, "warningType": "none"}
- Extract the date range from natural language expressions (e.g. "last month" -> "last_month", "اليوم" -> "today", "الشهر الماضي" -> "last_month")
- "entityKeyword" should capture any class name, program name, or code mentioned in the question (e.g. "Class A", "Diploma", "CS-101")
- For workflow-specific queries, extract the workflow ID number if mentioned (e.g. "workflow 12" -> 12)
- For warning-specific queries, determine if it is about "first" or "final" warnings
- Return ONLY the JSON object, no other text, no markdown, no explanation`;

/**
 * Map LLM dateRange string to actual Date objects + labels.
 */
export function mapDateRange(dateRangeStr) {
  const now = new Date();
  const startOfDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  const endOfDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

  // Rolling ranges: last_N_days, last_N_weeks, last_N_months
  const rollingMatch = typeof dateRangeStr === 'string' && dateRangeStr.match(/^last_(\d+)_(days?|weeks?|months?)$/);
  if (rollingMatch) {
    const n = parseInt(rollingMatch[1], 10);
    const unit = rollingMatch[2].toLowerCase();
    const from = new Date(now);
    if (unit.startsWith('day')) from.setDate(from.getDate() - n);
    else if (unit.startsWith('week')) from.setDate(from.getDate() - n * 7);
    else if (unit.startsWith('month')) from.setMonth(from.getMonth() - n);

    return {
      dateFrom: startOfDay(from),
      dateTo: endOfDay(now),
      labelEn: `Last ${n} ${unit.charAt(0).toUpperCase() + unit.slice(1)}`,
      labelAr: unit.startsWith('day')
        ? `آخر ${n} يوم`
        : unit.startsWith('week')
          ? `آخر ${n} أسبوع`
          : `آخر ${n} شهر`,
    };
  }

  switch (dateRangeStr) {
    case 'today':
      return { dateFrom: startOfDay(now), dateTo: endOfDay(now), labelEn: 'Today', labelAr: 'اليوم' };
    case 'yesterday': {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      return { dateFrom: startOfDay(yest), dateTo: endOfDay(yest), labelEn: 'Yesterday', labelAr: 'أمس' };
    }
    case 'this_week': {
      const startWeek = new Date(now);
      startWeek.setDate(startWeek.getDate() - startWeek.getDay());
      const endWeek = new Date(startWeek);
      endWeek.setDate(endWeek.getDate() + 6);
      return { dateFrom: startOfDay(startWeek), dateTo: endOfDay(endWeek), labelEn: 'This Week', labelAr: 'هذا الأسبوع' };
    }
    case 'last_week': {
      const endLastWeek = new Date(now);
      endLastWeek.setDate(endLastWeek.getDate() - (endLastWeek.getDay() + 1));
      const startLastWeek = new Date(endLastWeek);
      startLastWeek.setDate(startLastWeek.getDate() - 6);
      return { dateFrom: startOfDay(startLastWeek), dateTo: endOfDay(endLastWeek), labelEn: 'Last Week', labelAr: 'الأسبوع الماضي' };
    }
    case 'this_month':
      return {
        dateFrom: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
        dateTo: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)),
        labelEn: 'This Month', labelAr: 'هذا الشهر',
      };
    case 'last_month':
      return {
        dateFrom: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)),
        dateTo: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999)),
        labelEn: 'Last Month', labelAr: 'الشهر الماضي',
      };
    default:
      return {
        dateFrom: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
        dateTo: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)),
        labelEn: 'Current Month', labelAr: 'الشهر الحالي',
      };
  }
}

/**
 * Check if Ollama is available and the model is loaded.
 */
export async function isOllamaAvailable() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return false;
    const data = await res.json();
    return data.models?.some((m) => m.name?.startsWith(OLLAMA_MODEL.split(':')[0])) || false;
  } catch {
    return false;
  }
}

/**
 * Call Ollama chat API to parse the user question into structured intent.
 */
async function callOllama(message) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        stream: false,
        format: 'json',
        options: {
          temperature: 0.1,
          num_predict: 200,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}`);
    }

    const data = await res.json();
    const content = data.message?.content || '';

    // Parse the JSON response
    const parsed = JSON.parse(content);

    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * LLM-powered parser. Uses Ollama for smart intent extraction,
 * then enriches with scoped entity matching from the database.
 *
 * Falls back to the rule-based parser if Ollama is unavailable.
 */
export async function parseWithLLM(req, message = '') {
  if (!message || typeof message !== 'string') {
    return { tool: 'unknown', params: {} };
  }

  // Try LLM parsing first
  let llmResult = null;
  try {
    const available = await isOllamaAvailable();
    if (available) {
      console.log('[AI LLM Parser] Ollama available, using LLM parsing');
      llmResult = await callOllama(message.trim());
      console.log('[AI LLM Parser] LLM result:', llmResult);
    } else {
      console.log('[AI LLM Parser] Ollama not available, falling back to rule-based parser');
    }
  } catch (error) {
    console.warn('[AI LLM Parser] LLM parsing failed, falling back to rule-based:', error.message);
  }

  // If LLM gave us a valid tool, use it but enrich with DB-scoped entities
  if (llmResult && llmResult.tool && llmResult.tool !== 'unknown') {
    const validTools = [
      'attendanceSummary', 'absenceWarningCounts', 'lateCount', 'humanCaseCount',
      'studentCount', 'marksSummary', 'scheduleSummary', 'workflowSummary',
      'notesAndComments', 'topAbsenceStudent',
    ];

    if (validTools.includes(llmResult.tool)) {
      // Get date range from LLM result
      const dates = mapDateRange(llmResult.dateRange || 'none');

      // Enrich with scoped entities from DB (class/program matching)
      const entities = await extractEntities(req, message);

      // If LLM provided an entityKeyword, try to match it against scoped entities
      // The extractEntities already does text-based matching, so we use its results
      // But if LLM gave a keyword and DB matching didn't find anything, we pass the keyword
      const params = {
        ...dates,
        classId: entities.classId,
        className: entities.className,
        programId: entities.programId,
        programName: entities.programName,
        workflowId: llmResult.workflowId || entities.workflowId,
        warningType: llmResult.warningType !== 'none' ? llmResult.warningType : entities.warningType,
      };

      return { tool: llmResult.tool, params };
    }
  }

  // Fallback: use the existing rule-based parser
  console.log('[AI LLM Parser] Using rule-based fallback parser');
  return ruleBasedParse(req, message);
}

export default {
  parseWithLLM,
  isOllamaAvailable,
  mapDateRange,
};
