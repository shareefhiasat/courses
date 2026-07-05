/**
 * Centralized absence deduction calculator using AbsenceDeductionRule table.
 */

import prisma from '../db/prismaClient.js';

const DEFAULT_RULES = {
  ATTENDANCE_ABSENT: 0.5,
  ATTENDANCE_LEAVE: 0.25,
  ATTENDANCE_LATE: 0.5,
  ATTENDANCE_HUMAN_CASE: 0.25,
};

const FAILURE_ABSENCE_COUNT = 8;
const FAILURE_ABSENCE_PERCENT = 20;

let rulesCache = null;
let rulesCacheAt = 0;
const CACHE_TTL_MS = 60_000;

async function loadRules() {
  const now = Date.now();
  if (rulesCache && now - rulesCacheAt < CACHE_TTL_MS) {
    return rulesCache;
  }

  const rows = await prisma.absenceDeductionRule.findMany({
    where: { active: true },
  });

  rulesCache = rows;
  rulesCacheAt = now;
  return rows;
}

function resolveDeductionForAttendance(attendance, rules) {
  if (attendance.excuseApprovedAt) {
    const excusedRule = rules.find((r) => r.isExcused);
    if (excusedRule) return excusedRule.deduction;
    return DEFAULT_RULES.ATTENDANCE_LEAVE;
  }

  const statusCode = attendance.status?.code;
  const byStatus = rules.find((r) => r.statusCode === statusCode);
  if (byStatus) return byStatus.deduction;

  if (statusCode && DEFAULT_RULES[statusCode] !== undefined) {
    return DEFAULT_RULES[statusCode];
  }

  return 0;
}

export async function calculateStudentAbsenceDeductions({
  userId,
  classId,
  programId,
  dateFrom,
  dateTo,
}) {
  const rules = await loadRules();

  const where = {
    userId,
    ...(classId && { classId }),
    ...(programId && { programId }),
    ...(dateFrom || dateTo
      ? {
          date: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) }),
          },
        }
      : {}),
  };

  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      status: true,
      workflowLinks: {
        include: {
          workflowDocument: { select: { id: true, status: true, title: true } },
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  const deducting = attendances
    .map((row) => {
      const deduction = resolveDeductionForAttendance(row, rules);
      const workflowDoc = row.workflowLinks?.[0]?.workflowDocument;
      return {
        attendanceId: row.id,
        date: row.date,
        statusCode: row.status?.code,
        excusedViaWorkflow: Boolean(row.excuseApprovedAt),
        deduction,
        workflowDocumentId: workflowDoc?.id || null,
        workflowStatus: workflowDoc?.status || null,
        workflowTitle: workflowDoc?.title || null,
      };
    })
    .filter((row) => row.deduction > 0);

  const totalDeduction = deducting.reduce((sum, row) => sum + row.deduction, 0);
  const absenceCount = deducting.length;

  return {
    userId,
    classId,
    totalDeduction,
    absenceCount,
    rows: deducting,
    failureByCount: absenceCount >= FAILURE_ABSENCE_COUNT,
    failureByPercent: false,
  };
}

export async function suggestAttendanceMarkComponent({
  userId,
  classId,
  distributionAttendanceWeight = 10,
  dateFrom,
  dateTo,
}) {
  const result = await calculateStudentAbsenceDeductions({
    userId,
    classId,
    dateFrom,
    dateTo,
  });

  const suggestedScore = Math.max(0, distributionAttendanceWeight - result.totalDeduction);

  return {
    ...result,
    distributionAttendanceWeight,
    suggestedScore,
    failureGrade: result.failureByCount ? 'FB' : null,
  };
}

export async function listDeductionRules() {
  return prisma.absenceDeductionRule.findMany({
    where: { active: true },
    orderBy: [{ statusCode: 'asc' }, { absenceTypeId: 'asc' }],
  });
}

export async function upsertDeductionRule(data) {
  const { id, ...fields } = data;
  if (id) {
    return prisma.absenceDeductionRule.update({ where: { id }, data: fields });
  }
  return prisma.absenceDeductionRule.create({ data: fields });
}

export async function getDeductionHistory({ userId, classId }) {
  const rules = await loadRules();

  const attendances = await prisma.attendance.findMany({
    where: { userId, ...(classId && { classId }) },
    include: {
      status: true,
      creator: { select: { id: true, displayName: true, realName: true, firstName: true, lastName: true } },
      amendments: {
        include: {
          fromStatus: true,
          toStatus: true,
          amendedByUser: { select: { id: true, displayName: true, realName: true } },
        },
        orderBy: { amendedAt: 'asc' },
      },
      workflowLinks: {
        include: {
          workflowDocument: { select: { id: true, title: true, status: true } },
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  const events = [];

  for (const att of attendances) {
    const statusCode = att.status?.code;
    const currentDeduction = resolveDeductionForAttendance(att, rules);

    if (currentDeduction > 0 || att.amendments.length > 0) {
      const workflowDoc = att.workflowLinks?.[0]?.workflowDocument;
      events.push({
        id: `att-${att.id}`,
        eventType: 'attendance_recorded',
        timestamp: att.createdAt,
        description: `Attendance recorded: ${att.status?.nameEn || statusCode || 'Unknown'} on ${new Date(att.date).toLocaleDateString()}`,
        deductionChange: { old: 0, new: currentDeduction },
        actorName: att.creator?.displayName || att.creator?.realName || [att.creator?.firstName, att.creator?.lastName].filter(Boolean).join(' ') || null,
        attendanceId: att.id,
        attendanceDate: att.date,
        workflowDocumentId: workflowDoc?.id || null,
        workflowTitle: workflowDoc?.title || null,
        workflowStatus: workflowDoc?.status || null,
      });
    }

    for (const amend of att.amendments) {
      const fromCode = amend.fromStatus?.code;
      const toCode = amend.toStatus?.code;
      const fromDeduction = (fromCode && DEFAULT_RULES[fromCode]) || 0;
      const toDeduction = (toCode && DEFAULT_RULES[toCode]) || 0;

      events.push({
        id: `amend-${amend.id}`,
        eventType: toCode === 'ATTENDANCE_LEAVE' ? 'amended_to_excused' : 'amended',
        timestamp: amend.amendedAt,
        description: `Status changed from ${amend.fromStatus?.nameEn || fromCode} to ${amend.toStatus?.nameEn || toCode}${amend.reason ? ` — ${amend.reason}` : ''}`,
        deductionChange: { old: fromDeduction, new: toDeduction },
        actorName: amend.amendedByUser?.displayName || amend.amendedByUser?.realName || 'System',
        attendanceId: att.id,
        attendanceDate: att.date,
      });
    }

    if (att.excuseApprovedAt) {
      const excusedDeduction = rules.find((r) => r.isExcused)?.deduction ?? DEFAULT_RULES.ATTENDANCE_LEAVE;
      const originalDeduction = DEFAULT_RULES[statusCode] ?? 0.5;
      const workflowDoc = att.workflowLinks?.[0]?.workflowDocument;

      events.push({
        id: `excuse-${att.id}`,
        eventType: 'excuse_approved',
        timestamp: att.excuseApprovedAt,
        description: `Excuse approved via workflow — attendance on ${new Date(att.date).toLocaleDateString()} marked as excused`,
        deductionChange: { old: originalDeduction, new: excusedDeduction },
        actorName: null,
        attendanceId: att.id,
        attendanceDate: att.date,
        workflowDocumentId: workflowDoc?.id || null,
        workflowTitle: workflowDoc?.title || null,
        workflowStatus: workflowDoc?.status || null,
        excusedViaWorkflow: true,
      });
    }
  }

  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return events;
}

export function getFailureThresholds() {
  return {
    absenceCount: FAILURE_ABSENCE_COUNT,
    absencePercent: FAILURE_ABSENCE_PERCENT,
    failureGrade: 'FB',
  };
}

/** Status codes counted as absence for official warnings (all non-present). */
const WARNING_ABSENCE_STATUS_CODES = new Set([
  'ATTENDANCE_ABSENT',
  'ATTENDANCE_LEAVE',
  'ATTENDANCE_LATE',
  'ATTENDANCE_HUMAN_CASE',
]);

const UNEXCUSED_ABSENCE_CODES = new Set(['ATTENDANCE_ABSENT']);

/**
 * Count absences per enrolled student in a class for warning reports.
 */
export async function getClassAbsenceWarningCounts({ classId, userId }) {
  if (!classId) {
    return { success: false, error: 'classId is required' };
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: Number(classId),
      status: { code: 'ENROLLED' },
      ...(userId && { userId: Number(userId) }),
    },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          displayNameAr: true,
          studentNumber: true,
          rankEn: true,
          rankAr: true,
          sequence: true,
        },
      },
      class: {
        include: {
          program: { select: { nameEn: true, nameAr: true } },
          subject: { select: { nameEn: true, nameAr: true, code: true } },
        },
      },
    },
  });

  const studentIds = enrollments.map((e) => e.userId);
  if (studentIds.length === 0) {
    return { success: true, data: [] };
  }

  const attendances = await prisma.attendance.findMany({
    where: {
      classId: Number(classId),
      userId: { in: studentIds },
    },
    include: { status: true },
  });

  const countsByUser = new Map();
  studentIds.forEach((id) => {
    countsByUser.set(id, { totalAbsences: 0, unexcusedAbsences: 0 });
  });

  attendances.forEach((row) => {
    const code = row.status?.code;
    if (!code || !WARNING_ABSENCE_STATUS_CODES.has(code)) return;
    const entry = countsByUser.get(row.userId);
    if (!entry) return;
    entry.totalAbsences += 1;
    if (UNEXCUSED_ABSENCE_CODES.has(code)) {
      entry.unexcusedAbsences += 1;
    }
  });

  const data = enrollments.map((enrollment) => {
    const counts = countsByUser.get(enrollment.userId) || { totalAbsences: 0, unexcusedAbsences: 0 };
    return {
      studentId: enrollment.userId,
      studentNumber: enrollment.user.studentNumber || '',
      studentName: enrollment.user.displayName || '',
      studentNameAr: enrollment.user.displayNameAr || '',
      rankEn: enrollment.user.rankEn || '',
      rankAr: enrollment.user.rankAr || '',
      sequence: enrollment.user.sequence,
      programName: enrollment.class?.program?.nameEn || '',
      programNameAr: enrollment.class?.program?.nameAr || '',
      subjectName: enrollment.class?.subject?.nameEn || '',
      subjectNameAr: enrollment.class?.subject?.nameAr || '',
      subjectCode: enrollment.class?.subject?.code || '',
      classId: enrollment.classId,
      ...counts,
    };
  });

  return { success: true, data };
}

export default {
  calculateStudentAbsenceDeductions,
  suggestAttendanceMarkComponent,
  listDeductionRules,
  upsertDeductionRule,
  getDeductionHistory,
  getFailureThresholds,
  getClassAbsenceWarningCounts,
};
