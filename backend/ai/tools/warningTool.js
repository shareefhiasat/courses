/**
 * AI Query Tool: Absence Warning Counts
 *
 * Calculates students reaching First Warning (>= 4 absences)
 * or Final Warning (>= 9 absences) thresholds.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';
import { ATTENDANCE_STATUS_CODES } from '../../constants/attendanceConstants.js';

const FIRST_WARNING_THRESHOLD = 4;
const FINAL_WARNING_THRESHOLD = 9;

export async function execute(req, params = {}) {
  const { classId, programId, className, programName, warningType } = params;

  const scopeResult = await buildScopedFilter(req, { classId, programId });
  if (!scopeResult.allowed) {
    return {
      success: false,
      error: scopeResult.reason,
    };
  }

  // Find all absences for students in scoped classes
  const attendances = await prisma.attendance.findMany({
    where: {
      ...scopeResult.filter,
      status: { code: ATTENDANCE_STATUS_CODES.ABSENT },
    },
    select: {
      userId: true,
      classId: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          firstNameAr: true,
          lastNameAr: true,
          displayNameAr: true,
          displayName: true,
          studentNumber: true,
        },
      },
      class: {
        select: { id: true, nameEn: true, nameAr: true, code: true },
      },
    },
  });

  // Group absences per student & class
  const studentMap = {};

  for (const att of attendances) {
    const key = `${att.userId}_${att.classId}`;
    if (!studentMap[key]) {
      studentMap[key] = {
        userId: att.userId,
        classId: att.classId,
        user: att.user,
        class: att.class,
        absenceCount: 0,
      };
    }
    studentMap[key].absenceCount++;
  }

  const firstWarnings = [];
  const finalWarnings = [];

  for (const item of Object.values(studentMap)) {
    if (item.absenceCount >= FINAL_WARNING_THRESHOLD) {
      finalWarnings.push(item);
    } else if (item.absenceCount >= FIRST_WARNING_THRESHOLD) {
      firstWarnings.push(item);
    }
  }

  return {
    success: true,
    data: {
      warningTypeFilter: warningType || 'all',
      firstWarningCount: firstWarnings.length,
      finalWarningCount: finalWarnings.length,
      firstWarningStudents: firstWarnings.slice(0, 5).map((s) => ({
        name: s.user?.displayName || `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim(),
        nameAr: s.user?.displayNameAr || `${s.user?.firstNameAr || ''} ${s.user?.lastNameAr || ''}`.trim(),
        militaryNumber: s.user?.studentNumber,
        className: s.class?.nameAr || s.class?.nameEn || s.class?.code,
        absences: s.absenceCount,
      })),
      finalWarningStudents: finalWarnings.slice(0, 5).map((s) => ({
        name: s.user?.displayName || `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim(),
        nameAr: s.user?.displayNameAr || `${s.user?.firstNameAr || ''} ${s.user?.lastNameAr || ''}`.trim(),
        militaryNumber: s.user?.studentNumber,
        className: s.class?.nameAr || s.class?.nameEn || s.class?.code,
        absences: s.absenceCount,
      })),
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
