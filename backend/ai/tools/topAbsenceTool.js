/**
 * AI Query Tool: Top Student with Most Absences
 *
 * Finds students with the highest absence counts within scoped classes and date range.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';
import { ATTENDANCE_STATUS_CODES } from '../../constants/attendanceConstants.js';

export async function execute(req, params = {}) {
  const { dateFrom, dateTo, classId, programId, className, programName, labelEn, labelAr } = params;

  const scopeResult = await buildScopedFilter(req, { classId, programId });
  if (!scopeResult.allowed) {
    return {
      success: false,
      error: scopeResult.reason,
    };
  }

  const where = {
    ...scopeResult.filter,
    status: { code: ATTENDANCE_STATUS_CODES.ABSENT },
  };

  if (dateFrom && dateTo) {
    where.date = {
      gte: dateFrom,
      lte: dateTo,
    };
  }

  const records = await prisma.attendance.findMany({
    where,
    select: {
      userId: true,
      class: { select: { id: true, code: true, nameEn: true, nameAr: true } },
    },
  });

  if (records.length === 0) {
    return {
      success: true,
      data: {
        topStudents: [],
        dateRange: { labelEn, labelAr },
        target: className || programName || 'All Permitted Classes',
        targetAr: className || programName || 'كافة الفصول المصرح بها',
      },
    };
  }

  // Count absences per student
  const absenceMap = {};
  for (const rec of records) {
    const uid = rec.userId;
    if (!absenceMap[uid]) {
      absenceMap[uid] = { userId: uid, absenceCount: 0, classes: new Set() };
    }
    absenceMap[uid].absenceCount++;
    if (rec.class) {
      absenceMap[uid].classes.add(rec.class.nameAr || rec.class.nameEn || rec.class.code);
    }
  }

  // Get top 5 students by absence count
  const sortedIds = Object.values(absenceMap)
    .sort((a, b) => b.absenceCount - a.absenceCount)
    .slice(0, 5);

  const userIds = sortedIds.map((s) => s.userId);

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      firstNameAr: true,
      lastNameAr: true,
      displayName: true,
      displayNameAr: true,
      studentNumber: true,
      rankEn: true,
      rankAr: true,
    },
  });

  const userMap = {};
  for (const u of users) {
    userMap[u.id] = u;
  }

  const topStudents = sortedIds.map((s) => {
    const u = userMap[s.userId] || {};
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.displayName || `User #${s.userId}`;
    const nameAr = [u.firstNameAr, u.lastNameAr].filter(Boolean).join(' ') || u.displayNameAr || name;
    const className = Array.from(s.classes)[0] || '-';
    return {
      userId: s.userId,
      name,
      nameAr,
      militaryNumber: u.studentNumber || null,
      absenceCount: s.absenceCount,
      className,
    };
  });

  return {
    success: true,
    data: {
      topStudents,
      dateRange: { labelEn, labelAr },
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
