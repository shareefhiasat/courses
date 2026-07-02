/**
 * Attendance Amendment Service
 * 
 * PURPOSE: Service layer for attendance amendment operations
 * ARCHITECTURE: Service → DB Service → Prisma → PostgreSQL
 */

import { createAttendanceAmendment, getAttendanceAmendments, getAllAttendanceAmendments } from '../db/attendance-amendment-postgres.js';
import { addWorkflowComment } from '../db/workflowDocuments-postgres.js';
import { emit } from './notifications/index.js';
import { EVENTS } from './notifications/constants.js';
import prisma from '../db/prismaClient.js';
import { buildNotificationNameVars } from '../utils/localizedUserName.js';


/**
 * Amend attendance record
 */
export async function amendAttendance(data) {
  try {
    const { attendanceId, toStatusId, reason, amendedBy, workflowDocumentId } = data;

    // Get current attendance record
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        user: true,
        status: true
      }
    });

    if (!attendance) {
      return { success: false, error: 'Attendance record not found' };
    }

    // Create amendment record
    const amendment = await createAttendanceAmendment({
      attendanceId,
      fromStatusId: attendance.statusId,
      toStatusId,
      reason,
      amendedBy
    });

    if (!amendment.success) {
      return amendment;
    }

    // Update attendance status
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        statusId: toStatusId,
        updatedBy: amendedBy,
        updatedAt: new Date()
      },
      include: {
        status: true,
        user: true,
        class: true
      }
    });

    // Auto-generate comment if workflow document is provided
    if (workflowDocumentId) {
      const commentText = `Amended by HR: changed student ${attendance.user.firstName || attendance.user.id} from ${attendance.status.nameEn} to ${amendment.data.toStatus.nameEn} (${reason})`;
      
      await addWorkflowComment({
        workflowDocumentId,
        authorId: amendedBy,
        comment: commentText,
        action: 'AMENDED'
      });

      // Send notification to instructor
      try {
        const workflowDocument = await prisma.workflowDocument.findUnique({
          where: { id: workflowDocumentId },
          include: { instructor: true }
        });

        if (workflowDocument && workflowDocument.instructor) {
          const amender = await prisma.user.findUnique({
            where: { id: amendedBy },
            select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true }
          });
          const cls = workflowDocument.classId ? await prisma.class.findUnique({
            where: { id: workflowDocument.classId },
            select: { id: true, nameEn: true, nameAr: true }
          }) : null;
          await emit(EVENTS.WORKFLOW_AMENDED, {
            ...buildNotificationNameVars(amender, 'Unknown User'),
            workflowName: workflowDocument.title,
            documentId: workflowDocumentId,
            amendmentSummary: commentText,
            versionHistoryLink: `/workflow-documents/${workflowDocumentId}`,
            senderName: amender?.displayName || 'Unknown',
            senderId: amendedBy,
            className: cls?.nameEn || null,
            classNameAr: cls?.nameAr || cls?.nameEn || null,
            recipientType: 'user',
            recipientUserId: workflowDocument.instructorId,
          }, { id: amendedBy }, { userId: workflowDocument.instructorId });
        }
      } catch (notificationError) {
        console.error('Error sending amendment notification:', notificationError);
        // Don't fail the amendment if notification fails
      }
    }

    return { success: true, data: { amendment: amendment.data, attendance: updatedAttendance } };
  } catch (error) {
    console.error('Error amending attendance:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get attendance amendments for a specific attendance record
 */
export async function getAmendmentsForAttendance(attendanceId) {
  return await getAttendanceAmendments(attendanceId);
}

/**
 * Get all attendance amendments with filters
 */
export async function getAllAmendments(filters) {
  return await getAllAttendanceAmendments(filters);
}

export default {
  amendAttendance,
  getAmendmentsForAttendance,
  getAllAmendments
};
