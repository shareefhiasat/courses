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
          await emit(EVENTS.WORKFLOW_AMENDED, {
            workflowName: workflowDocument.title,
            documentId: workflowDocumentId,
            amendmentSummary: commentText,
            versionHistoryLink: `/workflow-documents/${workflowDocumentId}`
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
    return { success: false, error: error.message };
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
