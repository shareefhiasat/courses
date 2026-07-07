import prisma from '../db/prismaClient.js';

/**
 * Get lecture log for a class+date — action history (marked, submitted, approved, rejected, returned)
 */
export const getLectureLog = async ({ classId, date }) => {
  try {
    const targetDate = new Date(date);
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

    const [workflowDocs, attendances] = await Promise.all([
      prisma.workflowDocument.findMany({
        where: {
          classId: parseInt(classId),
          date: { gte: dayStart, lt: dayEnd },
        },
        include: {
          submitter: { select: { id: true, displayName: true, firstName: true, lastName: true } },
          statusHistory: {
            include: {
              actor: { select: { id: true, displayName: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.attendance.findMany({
        where: {
          classId: parseInt(classId),
          date: { gte: dayStart, lt: dayEnd },
        },
        include: {
          status: { select: { id: true, code: true, nameEn: true, nameAr: true } },
          creator: { select: { id: true, displayName: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const logEntries = [];

    for (const att of attendances) {
      logEntries.push({
        type: 'attendance_marked',
        timestamp: att.createdAt,
        actor: att.creator?.displayName || 'System',
        status: att.status?.nameEn || 'Unknown',
        statusAr: att.status?.nameAr || att.status?.nameEn || 'Unknown',
        details: `Attendance marked for ${att.userId}`,
      });
    }

    for (const doc of workflowDocs) {
      for (const hist of doc.statusHistory) {
        logEntries.push({
          type: 'workflow_status_change',
          timestamp: hist.createdAt,
          actor: hist.actor?.displayName || 'System',
          action: hist.action || 'STATUS_CHANGE',
          fromStatus: hist.fromStatus,
          toStatus: hist.toStatus,
          comment: hist.comment,
          documentId: doc.id,
          documentTitle: doc.title,
        });
      }
    }

    logEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return { success: true, data: logEntries };
  } catch (error) {
    console.error('[attendance-log-postgres] getLectureLog:', error);
    return { success: false, error: 'Internal server error' };
  }
};

/**
 * Get per-record change history for a specific attendance record
 */
export const getRecordHistory = async (attendanceId) => {
  try {
    const changes = await prisma.attendanceChangeLog.findMany({
      where: { attendanceId: parseInt(attendanceId) },
      include: {
        fromStatus: { select: { id: true, code: true, nameEn: true, nameAr: true } },
        toStatus: { select: { id: true, code: true, nameEn: true, nameAr: true } },
        changedByUser: { select: { id: true, displayName: true, firstName: true, lastName: true } },
      },
      orderBy: { changedAt: 'asc' },
    });

    return { success: true, data: changes };
  } catch (error) {
    console.error('[attendance-log-postgres] getRecordHistory:', error);
    return { success: false, error: 'Internal server error' };
  }
};

/**
 * Create a change log entry
 */
export const createChangeLog = async ({ attendanceId, fromStatusId, toStatusId, changedBy, reason, source }) => {
  try {
    const log = await prisma.attendanceChangeLog.create({
      data: {
        attendanceId: parseInt(attendanceId),
        fromStatusId: fromStatusId ? parseInt(fromStatusId) : null,
        toStatusId: toStatusId ? parseInt(toStatusId) : null,
        changedBy: changedBy ? parseInt(changedBy) : null,
        reason: reason || null,
        source: source || 'manual',
      },
    });
    return { success: true, data: log };
  } catch (error) {
    console.error('[attendance-log-postgres] createChangeLog:', error);
    return { success: false, error: 'Internal server error' };
  }
};

export default {
  getLectureLog,
  getRecordHistory,
  createChangeLog,
};
