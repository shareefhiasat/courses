/**
 * Attendance Service - Backend Business Logic
 * 
 * PURPOSE: Business logic layer for attendance operations
 * ARCHITECTURE: Controller → Business Service → DB Service → PostgreSQL
 */

import prisma from '../db/prismaClient.js';
import notificationGateway from './notifications/index.js';
import { EVENTS } from './notifications/constants.js';
import { buildLocalizedNameFields, buildNotificationNameVars } from '../utils/localizedUserName.js';
import { USER_NAME_SELECT_WITH_IMAGE, normalizeProfileImageUrl } from '../utils/userNameFields.js';
import { checkAttendanceWorkflowLock, checkWeeklyWorkflowLock } from './workflowDocumentService.js';
import { createChangeLog } from '../db/attendance-log-postgres.js';
import { ATTENDANCE_STATUS_CODES } from '../constants/attendanceConstants.js';


/**
 * Get database user ID from Keycloak user object
 * 
 * @param {object} user - User object from request
 * @returns {Promise<number|null>} - Database user ID or null
 */
const getDatabaseUserId = async (user) => {
  if (!user) return null;
  
  try {
    // Try to find user by email (primary method)
    if (user.email) {
      const emailUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true }
      });
      
      if (emailUser) return emailUser.id;
    }
    
    // If no email, try display name as fallback
    if (user.displayName || user.firstName) {
      const displayName = user.displayName || `${user.firstName} ${user.lastName || ''}`.trim();
      const nameUser = await prisma.user.findFirst({
        where: { displayName },
        select: { id: true }
      });
      
      if (nameUser) return nameUser.id;
    }
    
    return null;
  } catch (error) {
    console.error('[Attendance Service] Error getting database user ID:', error);
    return null;
  }
};

/**
 * Validate the note/attachment requirements for an attendance status change.
 * - Target status ATTENDANCE_LEAVE (excused leave): attachment is mandatory, note optional.
 * - Target status ATTENDANCE_HUMAN_CASE: note is mandatory, attachment optional.
 */
function validateStatusChangeMetadata(statusCode, notes, attachmentUrl) {
  const normalized = String(statusCode || '').trim().toUpperCase();
  if (normalized === ATTENDANCE_STATUS_CODES.LEAVE) {
    if (!attachmentUrl) {
      return { valid: false, error: 'An attachment is required when marking attendance as excused leave.' };
    }
  }
  if (normalized === ATTENDANCE_STATUS_CODES.HUMAN_CASE) {
    if (!notes || !String(notes).trim()) {
      return { valid: false, error: 'A note is required when marking attendance as human case.' };
    }
  }
  return { valid: true };
}

const QATAR_OFFSET_MS = 3 * 60 * 60 * 1000;

function getQatarDayRange(dateInput) {
  const d = new Date(dateInput);
  // Convert UTC instant to Qatar time and use that calendar date
  const qatarTime = new Date(d.getTime() + QATAR_OFFSET_MS);
  const y = qatarTime.getUTCFullYear();
  const m = qatarTime.getUTCMonth();
  const day = qatarTime.getUTCDate();
  // Qatar midnight is UTC 21:00 of the previous day (offset -3)
  const dayStart = new Date(Date.UTC(y, m, day, -3, 0, 0));
  const dayEnd = new Date(Date.UTC(y, m, day + 1, -3, 0, 0));
  return { dayStart, dayEnd };
}

const startOfDay = (dateInput) => {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfNextDay = (dateInput) => {
  const d = startOfDay(dateInput);
  d.setDate(d.getDate() + 1);
  return d;
};

// Get all attendance records with filtering
export const getAllAttendance = async (params = {}) => {
  try {
    const { userId, classId, date, dateFrom, dateTo, subjectId, page = 1, limit = 100 } = params;
    
    const where = {};
    if (userId) where.userId = parseInt(userId);
    if (classId) where.classId = parseInt(classId);
    if (subjectId) where.subjectId = parseInt(subjectId);
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = getQatarDayRange(dateFrom).dayStart;
      if (dateTo) where.date.lt = getQatarDayRange(dateTo).dayEnd;
    } else if (date) {
      const { dayStart, dayEnd } = getQatarDayRange(date);
      where.date = { gte: dayStart, lt: dayEnd };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [rawAttendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              firstName: true,
              lastName: true,
              firstNameAr: true,
              lastNameAr: true,
              displayNameAr: true,
              studentNumber: true
            }
          },
          class: {
            select: {
              id: true,
              nameEn: true,
              code: true,
              programId: true,
              subjectId: true,
              program: {
                select: {
                  categoryId: true,
                },
              },
            }
          },
          status: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true
            }
          },
          creator: {
            select: USER_NAME_SELECT_WITH_IMAGE
          },
          updater: {
            select: USER_NAME_SELECT_WITH_IMAGE
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.attendance.count({ where })
    ]);
    
    const attendances = rawAttendances.map((a) => ({
      ...a,
      creator: a.creator ? normalizeProfileImageUrl(a.creator) : a.creator,
      updater: a.updater ? normalizeProfileImageUrl(a.updater) : a.updater,
    }));
    
    return {
      success: true,
      data: attendances,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    console.error('Get all attendance error:', error);
    return {
      success: false,
      error: 'Internal server error',
      data: []
    };
  }
};

// Get attendance by ID
export const getAttendanceById = async (id) => {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true
          }
        },
        class: {
          select: {
            id: true,
            nameEn: true,
            code: true,
            programId: true,
            subjectId: true,
            program: {
              select: {
                categoryId: true,
              },
            },
          }
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        creator: {
          select: USER_NAME_SELECT_WITH_IMAGE
        }
      }
    });
    
    if (!attendance) {
      return {
        success: false,
        error: 'Attendance record not found',
        data: null
      };
    }
    
    return {
      success: true,
      data: attendance
    };
  } catch (error) {
    console.error('Get attendance by ID error:', error);
    return {
      success: false,
      error: 'Internal server error',
      data: null
    };
  }
};

// Create new attendance record
export const createAttendance = async (attendanceData, user = null) => {
  try {
    const { userId, classId, status, date, notes, checkInTime, programId, subjectId, attachmentUrl, attachmentName, attachmentType } = attendanceData;

    // Validate required fields
    if (!userId || !classId || (!status && !attendanceData.statusId) || !date) {
      return {
        success: false,
        error: 'Missing required fields: userId, classId, status, date',
        data: null
      };
    }

    // Resolve status: prefer statusId if provided, otherwise look up by code
    let statusId = attendanceData.statusId;
    let resolvedStatusCode = null;
    if (!statusId && status) {
      const attendanceStatus = await prisma.attendanceStatusTypes.findUnique({
        where: { code: status }
      });
      if (!attendanceStatus) {
        return {
          success: false,
          error: `Invalid attendance status: ${status}`,
          data: null
        };
      }
      statusId = attendanceStatus.id;
      resolvedStatusCode = attendanceStatus.code;
    } else if (statusId) {
      statusId = parseInt(statusId);
      const attendanceStatus = await prisma.attendanceStatusTypes.findUnique({
        where: { id: statusId }
      });
      resolvedStatusCode = attendanceStatus?.code || null;
    }

    if (!statusId) {
      return {
        success: false,
        error: `Invalid attendance status: ${status}`,
        data: null
      };
    }

    // Validate note/attachment requirements for the target status
    const validation = validateStatusChangeMetadata(resolvedStatusCode || status, notes, attachmentUrl);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        data: null
      };
    }

    const weeklyLock = await checkWeeklyWorkflowLock(date, classId);
    if (weeklyLock.blocked) {
      return {
        success: false,
        error: 'Attendance is locked because a weekly summary workflow is already in progress for this class this week.',
        data: null,
      };
    }
    
    // Check if attendance already exists for this student, class, and date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: parseInt(userId),
        classId: parseInt(classId),
        date: new Date(date)
      }
    });
    
    if (existingAttendance) {
      // Get database user ID for updatedBy field
      const updatedBy = await getDatabaseUserId(user);
      
      // Update existing record instead of creating duplicate
      const updatedAttendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          statusId: statusId,
          notes: notes || null,
          updatedBy: updatedBy || null,
          updatedAt: new Date(),
          programId: programId ? parseInt(programId) : null,
          subjectId: subjectId ? parseInt(subjectId) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              firstName: true,
              lastName: true,
              firstNameAr: true,
              lastNameAr: true,
              displayNameAr: true,
              studentNumber: true
            }
          },
          class: {
            select: {
              id: true,
              nameEn: true,
              nameAr: true,
              code: true
            }
          },
          status: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true
            }
          }
        }
      });

      if (existingAttendance.statusId !== statusId) {
        await createChangeLog({
          attendanceId: existingAttendance.id,
          fromStatusId: existingAttendance.statusId,
          toStatusId: statusId,
          changedBy: updatedBy,
          reason: notes || null,
          source: 'manual',
          attachmentUrl: attachmentUrl || null,
          attachmentName: attachmentName || null,
          attachmentType: attachmentType || null,
        });
      }
      
      // Emit notification for attendance update
      try {
        const statusEventMap = {
          [ATTENDANCE_STATUS_CODES.PRESENT]: EVENTS.ATTENDANCE_MARKED_PRESENT,
          [ATTENDANCE_STATUS_CODES.ABSENT]: EVENTS.ATTENDANCE_MARKED_ABSENT,
          [ATTENDANCE_STATUS_CODES.LATE]: EVENTS.ATTENDANCE_MARKED_LATE,
          [ATTENDANCE_STATUS_CODES.LEAVE]: EVENTS.ATTENDANCE_MARKED_EXCUSED
        };
        
        const eventType = statusEventMap[status] || EVENTS.ATTENDANCE_MARKED;
        const actorDbId = await getDatabaseUserId(user);
        const actorUser = actorDbId ? await prisma.user.findUnique({
          where: { id: actorDbId },
          select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true }
        }) : null;
        
        await notificationGateway.emit(
          eventType,
          {
            ...buildNotificationNameVars(updatedAttendance.user, 'Unknown Student'),
            ...buildNotificationNameVars(actorUser, 'Unknown User'),
            date: updatedAttendance.date,
            className: updatedAttendance.class.nameEn,
            classNameAr: updatedAttendance.class.nameAr || updatedAttendance.class.nameEn,
            status: status,
            senderName: actorUser?.displayName || 'Unknown',
            senderId: actorDbId || null,
            recipientType: 'user',
            recipientUserId: parseInt(userId),
          },
          user,
          { userId: parseInt(userId) }
        );
      } catch (notificationError) {
        console.error('[Attendance Service] Failed to emit notification:', notificationError);
      }
      
      if (global.chatWSBroadcast) {
        global.chatWSBroadcast('board:attendance_updated', {
          attendanceId: updatedAttendance.id,
          userId: updatedAttendance.userId,
          classId: updatedAttendance.classId,
          date: updatedAttendance.date,
          status: { code: updatedAttendance.status.code, nameEn: updatedAttendance.status.nameEn, nameAr: updatedAttendance.status.nameAr },
          notes: updatedAttendance.notes,
        });
      }

      return {
        success: true,
        data: updatedAttendance,
        message: 'Attendance updated successfully'
      };
    }
    
    // Get database user ID for createdBy field
    const createdBy = await getDatabaseUserId(user);
    
    // Create new attendance record
    const newAttendance = await prisma.attendance.create({
      data: {
        userId: parseInt(userId),
        classId: parseInt(classId),
        statusId: statusId,
        date: new Date(date),
        notes: notes || null,
        createdBy: createdBy || null,
        programId: programId ? parseInt(programId) : null,
        subjectId: subjectId ? parseInt(subjectId) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true
          }
        },
        class: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        }
      }
    });

    // Create a change log entry for the new attendance record (initial status)
    try {
      await createChangeLog({
        attendanceId: newAttendance.id,
        fromStatusId: null,
        toStatusId: statusId,
        changedBy: createdBy,
        reason: notes || null,
        source: 'manual',
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        attachmentType: attachmentType || null,
      });
    } catch (logError) {
      console.error('[Attendance Service] Failed to create initial change log:', logError);
    }

    // Emit notification for attendance creation
    try {
      const statusEventMap = {
        'present': EVENTS.ATTENDANCE_MARKED_PRESENT,
        'absent': EVENTS.ATTENDANCE_MARKED_ABSENT,
        'late': EVENTS.ATTENDANCE_MARKED_LATE,
        'excused': EVENTS.ATTENDANCE_MARKED_EXCUSED
      };
      
      const eventType = statusEventMap[status] || EVENTS.ATTENDANCE_MARKED;
      const actorDbId = await getDatabaseUserId(user);
      const actorUser = actorDbId ? await prisma.user.findUnique({
        where: { id: actorDbId },
        select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true }
      }) : null;
      
      await notificationGateway.emit(
        eventType,
        {
          ...buildNotificationNameVars(newAttendance.user, 'Unknown Student'),
          ...buildNotificationNameVars(actorUser, 'Unknown User'),
          date: newAttendance.date,
          className: newAttendance.class.nameEn,
          classNameAr: newAttendance.class.nameAr || newAttendance.class.nameEn,
          status: status,
          senderName: actorUser?.displayName || 'Unknown',
          senderId: actorDbId || null,
          recipientType: 'user',
          recipientUserId: parseInt(userId),
        },
        user,
        { userId: parseInt(userId) }
      );

      // Also notify the class instructor when an admin marks attendance
      if (user?.isAdmin) {
        const cls = await prisma.class.findUnique({
          where: { id: parseInt(classId) },
          select: { instructorId: true },
        });
        if (cls?.instructorId && cls.instructorId !== actorDbId) {
          await notificationGateway.emit(
            EVENTS.ATTENDANCE_MARKED,
            {
              ...buildNotificationNameVars(newAttendance.user, 'Student'),
              date: newAttendance.date,
              statusName: newAttendance.status.nameEn,
              changedBy: actorUser?.displayName || 'Admin',
            },
            { dbId: user.dbId, id: user.keycloakId || user.id },
            { userId: cls.instructorId }
          );
        }
      }
    } catch (notificationError) {
      console.error('[Attendance Service] Failed to emit notification:', notificationError);
    }

    if (global.chatWSBroadcast) {
      global.chatWSBroadcast('board:attendance_updated', {
        attendanceId: newAttendance.id,
        userId: newAttendance.userId,
        classId: newAttendance.classId,
        date: newAttendance.date,
        status: { code: newAttendance.status.code, nameEn: newAttendance.status.nameEn, nameAr: newAttendance.status.nameAr },
        notes: newAttendance.notes,
      });
    }

    return {
      success: true,
      data: newAttendance,
      message: 'Attendance marked successfully'
    };
  } catch (error) {
    console.error('Create attendance error:', error);
    return {
      success: false,
      error: 'Internal server error',
      data: null
    };
  }
};

// Update attendance record
export const updateAttendance = async (id, updateData, user = null) => {
  try {
    const { status, notes, programId, subjectId, attachmentUrl, attachmentName, attachmentType } = updateData;

    // Find the attendance record
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingAttendance) {
      return {
        success: false,
        error: 'Attendance record not found',
        data: null
      };
    }

    const weeklyLock = await checkWeeklyWorkflowLock(existingAttendance.date, existingAttendance.classId);
    if (weeklyLock.blocked) {
      return {
        success: false,
        error: 'Attendance is locked because a weekly summary workflow is already in progress for this class this week.',
        data: null,
      };
    }

    // Prepare update data
    const data = {
      updatedBy: user?.dbId || (user?.id && !isNaN(parseInt(user.id)) ? parseInt(user.id) : null),
      updatedAt: new Date()
    };
    
    let toStatusCode = null;
    if (status || updateData.statusId) {
      // Resolve status: prefer statusId if provided, otherwise look up by code
      let statusId = updateData.statusId;
      if (!statusId && status) {
        const attendanceStatus = await prisma.attendanceStatusTypes.findUnique({
          where: { code: status }
        });

        if (!attendanceStatus) {
          return {
            success: false,
            error: `Invalid attendance status: ${status}`,
            data: null
          };
        }
        statusId = attendanceStatus.id;
        toStatusCode = attendanceStatus.code;
      } else if (statusId) {
        statusId = parseInt(statusId);
        const attendanceStatus = await prisma.attendanceStatusTypes.findUnique({
          where: { id: statusId }
        });
        toStatusCode = attendanceStatus?.code || null;
      }

      if (!statusId) {
        return {
          success: false,
          error: `Invalid attendance status: ${status}`,
          data: null
        };
      }

      // Validate note/attachment requirements when status is actually changing
      if (statusId !== existingAttendance.statusId && toStatusCode) {
        const validation = validateStatusChangeMetadata(toStatusCode, notes, attachmentUrl);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error,
            data: null
          };
        }
      }

      data.statusId = statusId;
    }
    
    if (notes !== undefined) {
      data.notes = notes;
    }
    
    if (programId !== undefined) {
      data.programId = programId ? parseInt(programId) : null;
    }
    
    if (subjectId !== undefined) {
      data.subjectId = subjectId ? parseInt(subjectId) : null;
    }
    
    const updatedAttendance = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true
          }
        },
        class: {
          select: {
            id: true,
            nameEn: true,
            code: true
          }
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        }
      }
    });

    if (data.statusId && data.statusId !== existingAttendance.statusId) {
      const changedBy = await getDatabaseUserId(user);
      await createChangeLog({
        attendanceId: parseInt(id),
        fromStatusId: existingAttendance.statusId,
        toStatusId: data.statusId,
        changedBy,
        reason: notes || null,
        source: 'manual',
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        attachmentType: attachmentType || null,
      });
    }

    if (global.chatWSBroadcast) {
      try {
        global.chatWSBroadcast('board:attendance_updated', {
          attendanceId: updatedAttendance.id,
          userId: updatedAttendance.userId,
          classId: updatedAttendance.classId,
          date: updatedAttendance.date,
          status: { code: updatedAttendance.status.code, nameEn: updatedAttendance.status.nameEn, nameAr: updatedAttendance.status.nameAr },
          notes: updatedAttendance.notes,
        });
      } catch (wsErr) {
        console.error('[Attendance Service] WebSocket broadcast failed:', wsErr);
      }
    }

    // Notify class instructor when an admin overrides attendance
    if (user?.isAdmin && data.statusId && data.statusId !== existingAttendance.statusId) {
      try {
        const cls = await prisma.class.findUnique({
          where: { id: updatedAttendance.classId },
          select: { instructorId: true },
        });
        if (cls?.instructorId && cls.instructorId !== user?.dbId) {
          const actorName = user?.displayName || user?.firstName || user?.email || 'Admin';
          await notificationGateway.emit(
            EVENTS.ATTENDANCE_MARKED,
            {
              ...buildNotificationNameVars(updatedAttendance.user, 'Student'),
              date: updatedAttendance.date,
              statusName: updatedAttendance.status.nameEn,
              changedBy: actorName,
            },
            { dbId: user.dbId, id: user.keycloakId || user.id },
            { userId: cls.instructorId }
          );
        }
      } catch (notifyErr) {
        console.error('Failed to notify instructor after attendance update:', notifyErr);
      }
    }

    return {
      success: true,
      data: updatedAttendance,
      message: 'Attendance updated successfully'
    };
  } catch (error) {
    console.error('Update attendance error:', error);
    return {
      success: false,
      error: error.message || 'Internal server error',
      code: error.code || 500,
      data: null
    };
  }
};

// Delete attendance record
export const deleteAttendance = async (id, user = null) => {
  try {
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingAttendance) {
      return {
        success: false,
        error: 'Attendance record not found',
        data: null
      };
    }

    const weeklyLock = await checkWeeklyWorkflowLock(existingAttendance.date, existingAttendance.classId);
    if (weeklyLock.blocked) {
      return {
        success: false,
        error: 'Attendance is locked because a weekly summary workflow is already in progress for this class this week.',
        data: null,
      };
    }

    const changedBy = await getDatabaseUserId(user);
    await createChangeLog({
      attendanceId: parseInt(id),
      fromStatusId: existingAttendance.statusId,
      toStatusId: null,
      changedBy,
      reason: 'Attendance deleted (reverted to NOT_TAKEN)',
      source: 'manual',
    });

    await prisma.attendance.delete({
      where: { id: parseInt(id) }
    });

    if (global.chatWSBroadcast) {
      global.chatWSBroadcast('board:attendance_updated', {
        attendanceId: parseInt(id),
        userId: existingAttendance.userId,
        classId: existingAttendance.classId,
        date: existingAttendance.date,
        status: { code: 'NOT_TAKEN', nameEn: 'Not Taken', nameAr: 'لم يسجل' },
        notes: null,
      });
    }

    // Notify class instructor when an admin reverts attendance to NOT_TAKEN
    if (user?.isAdmin) {
      try {
        const cls = await prisma.class.findUnique({
          where: { id: existingAttendance.classId },
          select: { instructorId: true },
        });
        if (cls?.instructorId && cls.instructorId !== user?.dbId) {
          const actorName = user?.displayName || user?.firstName || user?.email || 'Admin';
          const studentUser = await prisma.user.findUnique({
            where: { id: existingAttendance.userId },
            select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true },
          });
          await notificationGateway.emit(
            EVENTS.ATTENDANCE_MARKED,
            {
              ...buildNotificationNameVars(studentUser, 'Student'),
              date: existingAttendance.date,
              statusName: 'Not Taken',
              changedBy: actorName,
            },
            { dbId: user.dbId, id: user.keycloakId || user.id },
            { userId: cls.instructorId }
          );
        }
      } catch (notifyErr) {
        console.error('Failed to notify instructor after attendance deletion:', notifyErr);
      }
    }

    return {
      success: true,
      data: { id: parseInt(id) },
      message: 'Attendance deleted successfully'
    };
  } catch (error) {
    console.error('Delete attendance error:', error);
    return {
      success: false,
      error: error.message || 'Internal server error',
      code: error.code || 500,
      data: null
    };
  }
};

// Get attendance statistics for a class
export const getClassAttendanceStats = async (classId, date) => {
  try {
    const where = { classId: parseInt(classId) };

    if (date) {
      const { dayStart, dayEnd } = getQatarDayRange(date);
      where.date = {
        gte: dayStart,
        lt: dayEnd
      };
    }
    
    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        status: {
          select: {
            code: true,
            nameEn: true
          }
        }
      }
    });
    
    const stats = {
      total: attendances.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      percentage: 0
    };
    
    attendances.forEach(attendance => {
      switch (attendance.status.code) {
        case ATTENDANCE_STATUS_CODES.PRESENT:
          stats.present++;
          break;
        case ATTENDANCE_STATUS_CODES.ABSENT:
          stats.absent++;
          break;
        case ATTENDANCE_STATUS_CODES.LATE:
          stats.late++;
          break;
        case ATTENDANCE_STATUS_CODES.LEAVE:
        case ATTENDANCE_STATUS_CODES.HUMAN_CASE:
          stats.excused++;
          break;
      }
    });
    
    stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Get class attendance stats error:', error);
    return {
      success: false,
      error: 'Internal server error',
      data: null
    };
  }
};

export const attendanceService = {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getClassAttendanceStats
};
