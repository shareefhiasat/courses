/**
 * Centralized absence deduction calculator using AbsenceDeductionRule table.
 */

import prisma from '../db/prismaClient.js';

const DEFAULT_RULES = {
  ABSENT_NO_EXCUSE: 0.5,
  ABSENT_WITH_EXCUSE: 0.25,
  EXCUSED_LEAVE: 0.25,
  LATE: 0.5,
  HUMAN_CASE: 0.25,
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
    return DEFAULT_RULES.ABSENT_WITH_EXCUSE;
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
    include: { status: true },
    orderBy: { date: 'asc' },
  });

  const deducting = attendances
    .map((row) => {
      const deduction = resolveDeductionForAttendance(row, rules);
      return {
        attendanceId: row.id,
        date: row.date,
        statusCode: row.status?.code,
        excusedViaWorkflow: Boolean(row.excuseApprovedAt),
        deduction,
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

export function getFailureThresholds() {
  return {
    absenceCount: FAILURE_ABSENCE_COUNT,
    absencePercent: FAILURE_ABSENCE_PERCENT,
    failureGrade: 'FB',
  };
}

export default {
  calculateStudentAbsenceDeductions,
  suggestAttendanceMarkComponent,
  listDeductionRules,
  upsertDeductionRule,
  getFailureThresholds,
};
