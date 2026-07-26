import prisma from '../db/prismaClient.js';
import { normalizeProfileImageUrl } from '../utils/userNameFields.js';

/**
 * Get lecture log for a class+date — action history (marked, submitted, approved, rejected, returned)
 */
export const getLectureLog = async ({ classId, date }) => {
  try {
    const targetDate = new Date(date);
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

    const [workflowDocs, attendances, attendanceChanges] = await Promise.all([
      prisma.workflowDocument.findMany({
        where: {
          classId: parseInt(classId),
          date: { gte: dayStart, lt: dayEnd },
        },
        include: {
          submitter: { select: { id: true, displayName: true, firstName: true, lastName: true, profileImageUrl: true, keycloakId: true, email: true } },
          statusHistory: {
            include: {
              actor: { select: { id: true, displayName: true, firstName: true, lastName: true, profileImageUrl: true, keycloakId: true, email: true } },
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
          user: { select: { id: true, displayName: true, firstName: true, lastName: true, displayNameAr: true, firstNameAr: true, lastNameAr: true, profileImageUrl: true, keycloakId: true, email: true } },
          creator: { select: { id: true, displayName: true, firstName: true, lastName: true, profileImageUrl: true, keycloakId: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.attendanceChangeLog.findMany({
        where: {
          attendance: {
            classId: parseInt(classId),
            date: { gte: dayStart, lt: dayEnd },
          },
        },
        include: {
          attendance: {
            include: {
              user: { select: { id: true, displayName: true, firstName: true, lastName: true, displayNameAr: true, firstNameAr: true, lastNameAr: true, profileImageUrl: true, keycloakId: true, email: true } },
            },
          },
          fromStatus: { select: { id: true, code: true, nameEn: true, nameAr: true } },
          toStatus: { select: { id: true, code: true, nameEn: true, nameAr: true } },
          changedByUser: { select: { id: true, displayName: true, firstName: true, lastName: true, profileImageUrl: true, keycloakId: true, email: true } },
        },
        orderBy: { changedAt: 'asc' },
      }),
    ]);

    // Normalize profileImageUrl from raw MinIO key to proxy URL
    const norm = (user) => user ? normalizeProfileImageUrl(user) : null;

    const logEntries = [];

    for (const att of attendances) {
      logEntries.push({
        type: 'attendance_marked',
        timestamp: att.createdAt,
        actor: att.creator?.displayName || 'System',
        user: norm(att.creator) || null,
        student: norm(att.user) || null,
        status: att.status?.nameEn || 'Unknown',
        statusAr: att.status?.nameAr || att.status?.nameEn || 'Unknown',
        details: `Attendance marked for ${att.userId}`,
      });
    }

    for (const change of attendanceChanges) {
      logEntries.push({
        type: 'attendance_status_change',
        timestamp: change.changedAt,
        actor: change.changedByUser?.displayName || 'System',
        user: norm(change.changedByUser) || null,
        userId: change.attendance?.userId,
        student: norm(change.attendance?.user) || null,
        fromStatus: change.fromStatus?.nameEn || 'Unknown',
        fromStatusAr: change.fromStatus?.nameAr || change.fromStatus?.nameEn || 'Unknown',
        toStatus: change.toStatus?.nameEn || 'Unknown',
        toStatusAr: change.toStatus?.nameAr || change.toStatus?.nameEn || 'Unknown',
        reason: change.reason,
        source: change.source,
      });
    }

    for (const doc of workflowDocs) {
      for (const hist of doc.statusHistory) {
        logEntries.push({
          type: 'workflow_status_change',
          timestamp: hist.createdAt,
          actor: hist.actor?.displayName || 'System',
          user: norm(hist.actor) || null,
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
        attendance: {
          include: {
            user: { select: { id: true, displayName: true, firstName: true, lastName: true, displayNameAr: true, firstNameAr: true, lastNameAr: true, profileImageUrl: true, keycloakId: true, email: true } },
          },
        },
        fromStatus: { select: { id: true, code: true, nameEn: true, nameAr: true } },
        toStatus: { select: { id: true, code: true, nameEn: true, nameAr: true } },
        changedByUser: { select: { id: true, displayName: true, firstName: true, lastName: true, profileImageUrl: true, keycloakId: true, email: true } },
      },
      orderBy: { changedAt: 'asc' },
    });

    return { success: true, data: changes.map(c => ({ ...c, changedByUser: normalizeProfileImageUrl(c.changedByUser), student: normalizeProfileImageUrl(c.attendance?.user) || null })) };
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
