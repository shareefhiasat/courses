/**
 * Attendance Threshold Check
 * 
 * Checks for students who have reached the attendance threshold (4 unexcused absences)
 * and sends notifications to the student, instructor, and HR
 */

import prisma from '../db/prismaClient.js';
import notificationGateway from '../services/notifications/index.js';
import { EVENTS } from '../services/notifications/constants.js';
import { buildNotificationNameVars } from '../utils/localizedUserName.js';

const ABSENCE_THRESHOLD = 4; // 4 unexcused absences trigger notification

/**
 * Run the attendance threshold check
 * Can be called from cron or manually
 */
export async function runAttendanceThresholdCheck() {
  console.log('[AttendanceThreshold] Starting check...');
  
  try {
    // Get all classes with their enrollments
    const classes = await prisma.class.findMany({
      where: { isActive: true },
      include: {
        enrollments: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                displayNameAr: true,
                firstNameAr: true,
                lastNameAr: true
              }
            }
          }
        },
        instructor: {
          select: { id: true }
        }
      }
    });

    let notificationsSent = 0;

    for (const classData of classes) {
      for (const enrollment of classData.enrollments) {
        const studentId = enrollment.userId;

        // Count unexcused absences for this student in this class
        const absenceCount = await prisma.attendance.count({
          where: {
            userId: studentId,
            classId: classData.id,
            statusId: {
              in: await getUnexcusedAbsenceStatusIds()
            }
          }
        });

        // Check if threshold is reached (exactly 4, not more, to avoid duplicate notifications)
        if (absenceCount === ABSENCE_THRESHOLD) {
          // Check if we already sent a notification for this student+class+threshold
          const existingNotification = await prisma.notification.findFirst({
            where: {
              type: 'ATTENDANCE',
              metadata: {
                path: ['studentId'],
                equals: studentId
              },
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Within last 7 days
              }
            }
          });

          if (existingNotification) {
            console.log(`[AttendanceThreshold] Notification already sent for student ${studentId} in class ${classData.id}`);
            continue;
          }

          // Send notification to student
          try {
            await notificationGateway.emit(
              EVENTS.ATTENDANCE_THRESHOLD_WARNING,
              {
                ...buildNotificationNameVars(enrollment.user, 'Unknown Student'),
                className: classData.nameEn || classData.nameAr,
                absenceCount: ABSENCE_THRESHOLD
              },
              { id: 1 }, // System actor
              { userId: studentId }
            );

            // Send notification to instructor
            if (classData.instructorId) {
              await notificationGateway.emit(
                EVENTS.ATTENDANCE_THRESHOLD_WARNING,
                {
                  ...buildNotificationNameVars(enrollment.user, 'Unknown Student'),
                  className: classData.nameEn || classData.nameAr,
                  absenceCount: ABSENCE_THRESHOLD
                },
                { id: 1 },
                { userId: classData.instructorId }
              );
            }

            // Send notification to HR role
            await notificationGateway.emit(
              EVENTS.ATTENDANCE_THRESHOLD_WARNING,
              {
                ...buildNotificationNameVars(enrollment.user, 'Unknown Student'),
                className: classData.nameEn || classData.nameAr,
                absenceCount: ABSENCE_THRESHOLD
              },
              { id: 1 },
              { role: 'hr' }
            );

            notificationsSent++;
            console.log(`[AttendanceThreshold] Sent notifications for student ${studentId} in class ${classData.id}`);
          } catch (notifError) {
            console.error(`[AttendanceThreshold] Error sending notification for student ${studentId}:`, notifError);
          }
        }
      }
    }

    console.log(`[AttendanceThreshold] Check completed. Sent ${notificationsSent} notification sets.`);
    return { success: true, notificationsSent };
  } catch (error) {
    console.error('[AttendanceThreshold] Error during check:', error);
    throw error;
  }
}

/**
 * Get status IDs for unexcused absences
 */
async function getUnexcusedAbsenceStatusIds() {
  const statuses = await prisma.attendanceStatusTypes.findMany({
    where: {
      code: {
        in: ['absent', 'ABSENT', 'unexcused_absent', 'UNEXCUSED_ABSENT']
      }
    },
    select: { id: true }
  });
  
  return statuses.map(s => s.id);
}

export default {
  runAttendanceThresholdCheck
};
