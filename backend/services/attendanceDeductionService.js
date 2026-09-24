/**
 * Centralized absence deduction calculator using AbsenceDeductionRule table.
 */

import prisma from '../db/prismaClient.js';
import { normalizeProfileImageUrl } from '../utils/userNameFields.js';
import {
  ATTENDANCE_STATUS_CODES,
  normalizeAttendanceStatus,
} from '../constants/attendanceConstants.js';
import { ENROLLMENT_STATUS_CODES } from '../constants/enrollmentConstants.js';

const DEFAULT_RULES = {
  [ATTENDANCE_STATUS_CODES.ABSENT]: 0.5,
  [ATTENDANCE_STATUS_CODES.LEAVE]: 0.5,
  [ATTENDANCE_STATUS_CODES.LATE]: 0.5,
  [ATTENDANCE_STATUS_CODES.HUMAN_CASE]: 0.5,
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
      creator: { select: { id: true, displayName: true, realName: true, firstName: true, lastName: true, keycloakId: true, profileImageUrl: true, updatedAt: true } },
      workflowLinks: {
        include: {
          workflowDocument: { select: { id: true, status: true, title: true } },
        },
      },
      amendments: {
        orderBy: { amendedAt: 'desc' },
        take: 1,
        include: {
          fromStatus: { select: { id: true, code: true, nameEn: true, nameAr: true } },
          toStatus: { select: { id: true, code: true, nameEn: true, nameAr: true } },
          amendedByUser: { select: { id: true, displayName: true, realName: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  const deducting = attendances
    .map((row) => {
      const deduction = resolveDeductionForAttendance(row, rules);
      const workflowDoc = row.workflowLinks?.[0]?.workflowDocument;
      const recordedByUser = normalizeProfileImageUrl(row.creator);
      const latestAmendment = row.amendments?.[0] || null;
      return {
        attendanceId: row.id,
        date: row.date,
        statusCode: row.status?.code,
        notes: row.notes || null,
        excusedViaWorkflow: Boolean(row.excuseApprovedAt),
        deduction,
        recordedBy: recordedByUser?.displayName || recordedByUser?.realName || [recordedByUser?.firstName, recordedByUser?.lastName].filter(Boolean).join(' ') || null,
        recordedByProfileImageUrl: recordedByUser?.profileImageUrl || null,
        recordedByUpdatedAt: recordedByUser?.updatedAt || null,
        workflowDocumentId: workflowDoc?.id || null,
        workflowStatus: workflowDoc?.status || null,
        workflowTitle: workflowDoc?.title || null,
        lastAmendment: latestAmendment ? {
          id: latestAmendment.id,
          reason: latestAmendment.reason,
          attachmentUrl: latestAmendment.attachmentUrl,
          attachmentName: latestAmendment.attachmentName,
          attachmentType: latestAmendment.attachmentType,
          amendedAt: latestAmendment.amendedAt,
          amendedByUser: latestAmendment.amendedByUser,
        } : null,
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
      creator: { select: { id: true, displayName: true, realName: true, firstName: true, lastName: true, keycloakId: true, profileImageUrl: true, updatedAt: true } },
      amendments: {
        include: {
          fromStatus: true,
          toStatus: true,
          amendedByUser: { select: { id: true, displayName: true, realName: true, keycloakId: true, profileImageUrl: true, updatedAt: true } },
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
        actorProfileImageUrl: normalizeProfileImageUrl(att.creator)?.profileImageUrl || null,
        actorUpdatedAt: att.creator?.updatedAt || null,
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
        actorProfileImageUrl: normalizeProfileImageUrl(amend.amendedByUser)?.profileImageUrl || null,
        actorUpdatedAt: amend.amendedByUser?.updatedAt || null,
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
export async function getClassAbsenceWarningCounts({ classId, userId, dateFrom, dateTo }) {
  if (!classId) {
    return { success: false, error: 'classId is required' };
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: Number(classId),
      status: { code: ENROLLMENT_STATUS_CODES.ACTIVE },
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
          keycloakId: true,
          profileImageUrl: true,
          updatedAt: true,
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

  const rules = await loadRules();

  const dateFilter = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo) dateFilter.lte = new Date(dateTo);

  const attendances = await prisma.attendance.findMany({
    where: {
      classId: Number(classId),
      userId: { in: studentIds },
      ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
    },
    include: {
      status: true,
      amendments: {
        orderBy: { amendedAt: 'desc' },
        take: 1,
        select: { reason: true },
      },
    },
    orderBy: { date: 'asc' },
  });

  const countsByUser = new Map();
  studentIds.forEach((id) => {
    countsByUser.set(id, {
      totalAbsences: 0,
      unexcusedAbsences: 0,
      excusedAbsences: 0,
      lateCount: 0,
      humanCaseCount: 0,
      presentCount: 0,
      deductionApproved: 0,
      deductionNotApproved: 0,
      deductionTotal: 0,
      absences: [],
    });
  });

  attendances.forEach((row) => {
    const code = normalizeAttendanceStatus(row.status?.code);
    const entry = countsByUser.get(row.userId);
    if (!entry) return;
    switch (code) {
      case ATTENDANCE_STATUS_CODES.PRESENT:
        entry.presentCount += 1;
        break;
      case ATTENDANCE_STATUS_CODES.ABSENT:
        entry.unexcusedAbsences += 1;
        entry.totalAbsences += 1;
        entry.absences.push({
          date: row.date,
          statusCode: code,
          excusedViaWorkflow: Boolean(row.excuseApprovedAt),
          note: row.notes || row.amendments?.[0]?.reason || null,
        });
        break;
      case ATTENDANCE_STATUS_CODES.LEAVE:
        entry.excusedAbsences += 1;
        entry.totalAbsences += 1;
        entry.absences.push({
          date: row.date,
          statusCode: code,
          excusedViaWorkflow: Boolean(row.excuseApprovedAt),
          note: row.notes || row.amendments?.[0]?.reason || null,
        });
        break;
      case ATTENDANCE_STATUS_CODES.LATE:
        entry.lateCount += 1;
        break;
      case ATTENDANCE_STATUS_CODES.HUMAN_CASE:
        entry.humanCaseCount += 1;
        entry.totalAbsences += 1;
        entry.absences.push({
          date: row.date,
          statusCode: code,
          excusedViaWorkflow: Boolean(row.excuseApprovedAt),
          note: row.notes || row.amendments?.[0]?.reason || null,
        });
        break;
      default:
        break;
    }

    if (code !== ATTENDANCE_STATUS_CODES.LATE) {
      const deduction = resolveDeductionForAttendance(row, rules);
      if (deduction > 0) {
        if (row.excuseApprovedAt) {
          entry.deductionApproved += deduction;
        } else {
          entry.deductionNotApproved += deduction;
        }
        entry.deductionTotal += deduction;
      }
    }
  });

  const data = enrollments.map((enrollment) => {
    const rawCounts = countsByUser.get(enrollment.userId) || {
      totalAbsences: 0,
      unexcusedAbsences: 0,
      excusedAbsences: 0,
      lateCount: 0,
      humanCaseCount: 0,
      presentCount: 0,
      deductionApproved: 0,
      deductionNotApproved: 0,
      deductionTotal: 0,
      absences: [],
    };
    const counts = {
      ...rawCounts,
      deductionApproved: Number((rawCounts.deductionApproved || 0).toFixed(2)),
      deductionNotApproved: Number((rawCounts.deductionNotApproved || 0).toFixed(2)),
      deductionTotal: Number((rawCounts.deductionTotal || 0).toFixed(2)),
    };
    const profileImageUrl = enrollment.user.profileImageUrl
      ? (enrollment.user.profileImageUrl.startsWith('http') || enrollment.user.profileImageUrl.startsWith('/api/')
          ? enrollment.user.profileImageUrl
          : `/api/v1/user-images/proxy/${enrollment.user.keycloakId || enrollment.user.id}/profile`)
      : null;
    return {
      studentId: enrollment.userId,
      studentNumber: enrollment.user.studentNumber || '',
      studentName: enrollment.user.displayName || '',
      studentNameAr: enrollment.user.displayNameAr || '',
      rankEn: enrollment.user.rankEn || '',
      rankAr: enrollment.user.rankAr || '',
      sequence: enrollment.user.sequence,
      profileImageUrl,
      avatarUpdatedAt: enrollment.user.updatedAt?.getTime?.() || null,
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

function toISODate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function getClassAttendanceWeeks({ classId }) {
  if (!classId) {
    return { success: false, error: 'classId is required' };
  }

  const agg = await prisma.attendance.aggregate({
    where: { classId: Number(classId) },
    _min: { date: true },
    _max: { date: true },
  });

  const minDate = agg._min?.date ? new Date(agg._min.date) : null;
  const maxDate = agg._max?.date ? new Date(agg._max.date) : null;

  if (!minDate || !maxDate) {
    return { success: true, weeks: [] };
  }

  const weeks = [];
  const end = startOfWeek(maxDate);
  let current = startOfWeek(minDate);

  while (current <= end) {
    const weekEnd = addDays(current, 6);
    weeks.push({
      value: toISODate(current),
      start: toISODate(current),
      end: toISODate(weekEnd),
    });
    current = addDays(current, 7);
  }

  return { success: true, weeks };
}

export default {
  calculateStudentAbsenceDeductions,
  suggestAttendanceMarkComponent,
  listDeductionRules,
  upsertDeductionRule,
  getDeductionHistory,
  getFailureThresholds,
  getClassAbsenceWarningCounts,
  getClassAttendanceWeeks,
};
