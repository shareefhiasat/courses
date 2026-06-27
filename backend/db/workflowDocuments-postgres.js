/**
 * Workflow Documents DB Service - PostgreSQL Operations
 * 
 * PURPOSE: Database operations for workflow documents using Prisma
 * ARCHITECTURE: DB Services → Prisma → PostgreSQL
 */

import prisma from './prismaClient.js';
import { buildLocalizedNameFields, buildNotificationNameVars } from '../utils/localizedUserName.js';
import { buildTaxonomyFields } from '../utils/workflowTaxonomy.js';

function buildWhereFromFilters(filters = {}) {
  const {
    status,
    workflowType,
    workflowCategory,
    attendanceSubtype,
    approvalFlow,
  } = filters;

  return {
    ...(status && { status }),
    ...(workflowType && { workflowType }),
    ...(workflowCategory && { workflowCategory }),
    ...(attendanceSubtype && { attendanceSubtype }),
    ...(approvalFlow && { approvalFlow }),
  };
}

const workflowDocumentIncludes = {
  file: {
    include: {
      currentVersion: true,
    },
  },
  submitter: {
    include: {
      roleAssignments: {
        include: {
          role: true,
        },
      },
    },
  },
  currentAssignee: {
    include: {
      roleAssignments: {
        include: {
          role: true,
        },
      },
    },
  },
  class: true,
  linkedAttendances: {
    include: {
      attendance: {
        include: {
          user: true,
          status: true,
          class: true,
        },
      },
    },
  },
};


/**
 * Create a new workflow document
 * Note: File record creation is handled in the service layer transaction
 */
export async function createWorkflowDocument(data) {
  try {
    const { 
      workflowType, 
      workflowCategory,
      attendanceSubtype,
      approvalFlow,
      title, 
      description, 
      fileId,
      fileVersionId,
      status: requestedStatus,
      submitterId, 
      currentAssigneeId, 
      classId, 
      instructorId, 
      date,
      dateFrom,
      dateTo,
      metadata,
      attendanceIds = [],
      program, 
      subject,
      createdBy,
      updatedBy
    } = data;

    const taxonomy = buildTaxonomyFields({
      workflowType,
      workflowCategory,
      attendanceSubtype,
      approvalFlow,
    });

    const workflowDocument = await prisma.$transaction(async (tx) => {
      const doc = await tx.workflowDocument.create({
        data: {
          workflowType: taxonomy.workflowType,
          approvalFlow: taxonomy.approvalFlow,
          workflowCategory: taxonomy.workflowCategory,
          attendanceSubtype: taxonomy.attendanceSubtype,
          title,
          description,
          status: requestedStatus || 'SUBMITTED',
          fileId,
          fileVersionId,
          submitterId,
          currentAssigneeId,
          classId,
          instructorId,
          date: date ? new Date(date) : null,
          dateFrom: dateFrom ? new Date(dateFrom) : null,
          dateTo: dateTo ? new Date(dateTo) : null,
          metadata: metadata || undefined,
          program,
          subject,
          reviewCycleCount: 0,
          createdBy,
          updatedBy,
        },
        include: workflowDocumentIncludes,
      });

      if (attendanceIds.length > 0) {
        await tx.workflowDocumentAttendance.createMany({
          data: attendanceIds.map((attendanceId) => ({
            workflowDocumentId: doc.id,
            attendanceId,
          })),
          skipDuplicates: true,
        });
      }

      return doc;
    });

    // Create initial status history for submission
    await createWorkflowStatusHistory({
      workflowDocumentId: workflowDocument.id,
      fromStatus: null,
      toStatus: workflowDocument.status,
      actorId: submitterId,
      reason: 'Initial document submission'
    });

    return { success: true, data: workflowDocument };
  } catch (error) {
    console.error('Error creating workflow document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create workflow status history entry
 */
export async function createWorkflowStatusHistory(data) {
  try {
    const { workflowDocumentId, fromStatus, toStatus, actorId, reason } = data;

    const statusHistory = await prisma.workflowStatusHistory.create({
      data: {
        workflowDocumentId,
        fromStatus,
        toStatus,
        actorId,
        reason
      }
    });

    return { success: true, data: statusHistory };
  } catch (error) {
    console.error('Error creating workflow status history:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get workflow document by ID
 */
export async function getWorkflowDocumentById(id) {
  try {
    const document = await prisma.workflowDocument.findUnique({
      where: { id },
      include: {
        file: {
          include: {
            currentVersion: true,
            versions: true
          }
        },
        submitter: true,
        currentAssignee: true,
        instructor: true,
        class: true,
        comments: {
          include: {
            author: true
          },
          orderBy: { createdAt: 'desc' }
        },
        statusHistory: {
          include: {
            actor: true
          },
          orderBy: { createdAt: 'desc' }
        },
        linkedAttendances: {
          include: {
            attendance: {
              include: {
                user: true,
                status: true,
                class: true,
              },
            },
          },
        },
      }
    });

    // If fileVersionId is set, find the corresponding version and add its number
    if (document && document.fileVersionId && document.file) {
      const snapshotVersion = document.file.versions.find(v => v.id === document.fileVersionId);
      if (snapshotVersion) {
        document.fileVersionNumber = snapshotVersion.versionNumber;
      }
    }

    return { success: true, data: document };
  } catch (error) {
    console.error('Error getting workflow document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get workflow documents by submitter
 */
export async function getWorkflowDocumentsBySubmitter(submitterId, filters = {}) {
  try {
    const { limit = 50, offset = 0 } = filters;

    console.log('[getWorkflowDocumentsBySubmitter] submitterId:', submitterId, 'filters:', filters);

    const where = {
      submitterId,
      ...buildWhereFromFilters(filters),
    };

    console.log('[getWorkflowDocumentsBySubmitter] where clause:', JSON.stringify(where, null, 2));

    const documents = await prisma.workflowDocument.findMany({
      where,
      include: workflowDocumentIncludes,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.workflowDocument.count({ where });

    console.log('[getWorkflowDocumentsBySubmitter] Documents returned:', documents.length, 'Total:', total);
    console.log('[getWorkflowDocumentsBySubmitter] Document IDs:', documents.map(d => ({ 
      id: d.id, 
      title: d.title, 
      status: d.status, 
      submitterId: d.submitterId,
      currentAssigneeId: d.currentAssigneeId,
      submitter: d.submitter ? { id: d.submitter.id, displayName: d.submitter.displayName } : null,
      currentAssignee: d.currentAssignee ? { id: d.currentAssignee.id, displayName: d.currentAssignee.displayName } : null
    })));

    // Add fileVersionNumber and fileVersionAlias to each document
    const documentsWithVersionNumber = documents.map(doc => ({
      ...doc,
      fileVersionNumber: doc.file?.currentVersion?.versionNumber || null,
      fileVersionAlias: doc.file?.currentVersion?.changeNote || null
    }));

    return { success: true, data: documentsWithVersionNumber, total };
  } catch (error) {
    console.error('Error getting workflow documents by submitter:', error);
    return { success: false, error: error.message };
  }
}

export async function getWorkflowDocumentsByFileId(fileId) {
  try {
    const documents = await prisma.workflowDocument.findMany({
      where: { fileId },
      include: {
        ...workflowDocumentIncludes,
        file: {
          include: {
            currentVersion: true,
            versions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add fileVersionNumber and fileVersionAlias to each document
    const documentsWithVersionNumber = documents.map(doc => {
      // If fileVersionId is set, find the corresponding version and add its number
      let snapshotVersionNumber = null;
      if (doc.fileVersionId && doc.file) {
        const snapshotVersion = doc.file.versions.find(v => v.id === doc.fileVersionId);
        if (snapshotVersion) {
          snapshotVersionNumber = snapshotVersion.versionNumber;
        }
      }

      return {
        ...doc,
        fileVersionNumber: snapshotVersionNumber || doc.file?.currentVersion?.versionNumber || null,
        fileVersionAlias: doc.file?.currentVersion?.changeNote || null
      };
    });

    return { success: true, data: documentsWithVersionNumber, total: documents.length };
  } catch (error) {
    console.error('Error getting workflow documents by fileId:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get workflow documents by assignee (for HR/Admin inbox)
 * Includes documents assigned to the user AND unassigned documents (currentAssigneeId is null)
 */
export async function getWorkflowDocumentsByAssignee(assigneeId, filters = {}) {
  try {
    const { limit = 50, offset = 0 } = filters;

    console.log('[getWorkflowDocumentsByAssignee] assigneeId:', assigneeId, 'filters:', filters);

    const where = {
      OR: [
        { currentAssigneeId: assigneeId },
        { currentAssigneeId: null }
      ],
      ...buildWhereFromFilters(filters),
    };

    console.log('[getWorkflowDocumentsByAssignee] where clause:', JSON.stringify(where, null, 2));

    const documents = await prisma.workflowDocument.findMany({
      where,
      include: workflowDocumentIncludes,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.workflowDocument.count({ where });

    console.log('[getWorkflowDocumentsByAssignee] Documents returned:', documents.length, 'Total:', total);
    console.log('[getWorkflowDocumentsByAssignee] Document IDs:', documents.map(d => ({ id: d.id, title: d.title, status: d.status, currentAssigneeId: d.currentAssigneeId })));

    // Add fileVersionNumber and fileVersionAlias to each document
    const documentsWithVersionNumber = documents.map(doc => ({
      ...doc,
      fileVersionNumber: doc.file?.currentVersion?.versionNumber || null,
      fileVersionAlias: doc.file?.currentVersion?.changeNote || null
    }));

    return { success: true, data: documentsWithVersionNumber, total };
  } catch (error) {
    console.error('Error getting workflow documents by assignee:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update workflow document status
 */
export async function updateWorkflowDocumentStatus(id, status, actorId, reason) {
  try {
    // Get current document
    const current = await prisma.workflowDocument.findUnique({
      where: { id }
    });

    if (!current) {
      return { success: false, error: 'Document not found' };
    }

    // Update document
    const updated = await prisma.workflowDocument.update({
      where: { id },
      data: {
        status,
        updatedBy: actorId,
        reviewCycleCount: status === 'SUBMITTED' ? current.reviewCycleCount + 1 : current.reviewCycleCount
      }
    });

    // Create status history
    await createWorkflowStatusHistory({
      workflowDocumentId: id,
      fromStatus: current.status,
      toStatus: status,
      actorId,
      reason
    });

    // If a reason/comment is provided, also create a comment entry
    if (reason && reason.trim()) {
      await addWorkflowComment({
        workflowDocumentId: id,
        authorId: actorId,
        comment: reason,
        action: status // Store the action (APPROVED, REJECTED, etc.)
      });
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error updating workflow document status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add comment to workflow document
 */
export async function addWorkflowComment(data) {
  try {
    const { workflowDocumentId, authorId, comment, action } = data;

    const workflowComment = await prisma.workflowComment.create({
      data: {
        workflowDocumentId,
        authorId,
        comment,
        action
      },
      include: {
        author: true
      }
    });

    return { success: true, data: workflowComment };
  } catch (error) {
    console.error('Error adding workflow comment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get comments for workflow document
 */
export async function getCommentsByWorkflowDocument(workflowDocumentId) {
  try {
    console.log('[getCommentsByWorkflowDocument] Fetching comments for workflowDocumentId:', workflowDocumentId);
    const comments = await prisma.workflowComment.findMany({
      where: {
        workflowDocumentId
      },
      select: {
        id: true,
        comment: true,
        action: true,
        authorId: true,
        createdAt: true,
        author: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log('[getCommentsByWorkflowDocument] Found comments:', comments.length);

    return { success: true, data: comments };
  } catch (error) {
    console.error('Error getting workflow comments:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete workflow comment
 */
export async function deleteWorkflowComment(commentId) {
  try {
    const deletedComment = await prisma.workflowComment.delete({
      where: {
        id: parseInt(commentId)
      }
    });

    return { success: true, data: deletedComment };
  } catch (error) {
    console.error('Error deleting workflow comment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Resubmit workflow document with new file
 */
export async function resubmitWorkflowDocument(data) {
  try {
    const { documentId, fileId, submitterId, comment, updatedBy } = data;

    // Get current document
    const current = await prisma.workflowDocument.findUnique({
      where: { id: documentId }
    });

    if (!current) {
      return { success: false, error: 'Document not found' };
    }

    // Update document with new file, increment cycle, reset status
    const updated = await prisma.workflowDocument.update({
      where: { id: documentId },
      data: {
        fileId,
        status: 'SUBMITTED',
        reviewCycleCount: current.reviewCycleCount + 1,
        updatedBy,
        updatedAt: new Date()
      },
      include: {
        file: true,
        submitter: true,
        currentAssignee: true,
        class: true
      }
    });

    // Record status history
    await createWorkflowStatusHistory({
      workflowDocumentId: documentId,
      fromStatus: current.status,
      toStatus: 'SUBMITTED',
      actorId: submitterId,
      reason: comment || 'Resubmitted with new file'
    });

    // Add comment if provided
    if (comment) {
      await addWorkflowComment({
        workflowDocumentId: documentId,
        authorId: submitterId,
        comment,
        action: 'RESUBMITTED'
      });
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error resubmitting workflow document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get compliance data for calendar view
 * Aggregates submission data by date, program, instructor, workflow type
 */
export async function getComplianceData(filters) {
  try {
    const { startDate, endDate, program, instructorId, workflowType } = filters;

    // Build where clause
    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (program) where.program = program;
    if (instructorId) where.instructorId = instructorId;
    if (workflowType) where.workflowType = workflowType;

    // Get all workflow documents within date range
    const documents = await prisma.workflowDocument.findMany({
      where,
      include: {
        file: true,
        submitter: true,
        instructor: true,
        class: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Get all classes to determine expected submissions
    const classes = await prisma.class.findMany({
      where: program ? { program } : undefined,
      include: {
        enrollments: true
      }
    });

    // Calculate compliance by date
    const complianceByDate = {};
    const uniqueDates = new Set();

    documents.forEach(doc => {
      if (!doc.date) return;
      
      const dateStr = doc.date.toISOString().split('T')[0];
      uniqueDates.add(dateStr);

      if (!complianceByDate[dateStr]) {
        complianceByDate[dateStr] = {
          date: dateStr,
          expected: 0,
          submitted: 0,
          missed: 0,
          partial: 0,
          complete: 0,
          details: []
        };
      }

      complianceByDate[dateStr].submitted++;
      complianceByDate[dateStr].details.push({
        id: doc.id,
        title: doc.title,
        workflowType: doc.workflowType,
        program: doc.program,
        subject: doc.subject,
        classId: doc.classId,
        instructorId: doc.instructorId,
        instructorName: doc.instructor
          ? buildLocalizedNameFields(doc.instructor, 'Unknown').instructorName
          : 'Unknown',
        instructorNameAr: doc.instructor
          ? buildLocalizedNameFields(doc.instructor, 'Unknown').instructorNameAr
          : 'Unknown',
        status: doc.status,
        submittedAt: doc.submittedAt
      });
    });

    // Calculate expected submissions based on classes
    uniqueDates.forEach(dateStr => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      
      // Count expected submissions (exclude weekends for daily attendance)
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const expectedCount = isWeekend ? 0 : classes.length;
      
      complianceByDate[dateStr].expected = expectedCount;
      
      if (expectedCount === 0) {
        complianceByDate[dateStr].status = 'weekend';
      } else if (complianceByDate[dateStr].submitted === 0) {
        complianceByDate[dateStr].status = 'missed';
        complianceByDate[dateStr].missed = expectedCount;
      } else if (complianceByDate[dateStr].submitted < expectedCount) {
        complianceByDate[dateStr].status = 'partial';
        complianceByDate[dateStr].partial = expectedCount - complianceByDate[dateStr].submitted;
      } else {
        complianceByDate[dateStr].status = 'complete';
        complianceByDate[dateStr].complete = complianceByDate[dateStr].submitted;
      }
    });

    // Calculate overall statistics
    const totalExpected = Object.values(complianceByDate).reduce((sum, day) => sum + day.expected, 0);
    const totalSubmitted = Object.values(complianceByDate).reduce((sum, day) => sum + day.submitted, 0);
    const submissionRate = totalExpected > 0 ? (totalSubmitted / totalExpected) * 100 : 0;
    const missedDays = Object.values(complianceByDate).filter(day => day.status === 'missed').length;
    const partialDays = Object.values(complianceByDate).filter(day => day.status === 'partial').length;
    const completeDays = Object.values(complianceByDate).filter(day => day.status === 'complete').length;

    return {
      success: true,
      data: {
        complianceByDate: Object.values(complianceByDate),
        statistics: {
          submissionRate: Math.round(submissionRate * 100) / 100,
          totalExpected,
          totalSubmitted,
          missedDays,
          partialDays,
          completeDays
        }
      }
    };
  } catch (error) {
    console.error('Error getting compliance data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get analytics data for workflow dashboard
 * Calculates cycle time, approval rate, rejection reasons
 */
export async function getAnalyticsData(filters) {
  try {
    const { startDate, endDate, program, workflowType } = filters;

    // Build where clause
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (program) where.program = program;
    if (workflowType) where.workflowType = workflowType;

    // Get all workflow documents
    const documents = await prisma.workflowDocument.findMany({
      where,
      include: {
        file: true,
        submitter: true,
        instructor: true,
        class: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' }
        },
        comments: {
          where: {
            action: { in: ['REJECTED', 'RETURNED'] }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Calculate cycle time per workflow type
    const cycleTimeByType = {};
    const approvalCountByType = {};
    const rejectionCountByType = {};
    const totalCountByType = {};
    const rejectionReasons = {};

    documents.forEach(doc => {
      const type = doc.workflowType;
      
      // Count total documents per type
      totalCountByType[type] = (totalCountByType[type] || 0) + 1;

      // Count approvals/rejections
      if (doc.status === 'APPROVED') {
        approvalCountByType[type] = (approvalCountByType[type] || 0) + 1;
      } else if (doc.status === 'REJECTED' || doc.status === 'RETURNED') {
        rejectionCountByType[type] = (rejectionCountByType[type] || 0) + 1;
      }

      // Calculate cycle time (time from submission to completion)
      if (doc.statusHistory && doc.statusHistory.length >= 2) {
        const submitted = doc.statusHistory.find(h => h.toStatus === 'SUBMITTED');
        const completed = doc.statusHistory.find(h => 
          h.toStatus === 'APPROVED' || h.toStatus === 'REJECTED'
        );

        if (submitted && completed) {
          const cycleTimeMs = new Date(completed.createdAt) - new Date(submitted.createdAt);
          const cycleTimeHours = cycleTimeMs / (1000 * 60 * 60);
          
          if (!cycleTimeByType[type]) {
            cycleTimeByType[type] = { total: 0, count: 0 };
          }
          cycleTimeByType[type].total += cycleTimeHours;
          cycleTimeByType[type].count += 1;
        }
      }

      // Aggregate rejection reasons from comments
      if (doc.comments && doc.comments.length > 0) {
        doc.comments.forEach(comment => {
          const reason = comment.comment || 'No reason provided';
          rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
        });
      }
    });

    // Calculate average cycle time per type
    const averageCycleTimeByType = {};
    Object.keys(cycleTimeByType).forEach(type => {
      averageCycleTimeByType[type] = cycleTimeByType[type].total / cycleTimeByType[type].count;
    });

    // Calculate approval rate per type
    const approvalRateByType = {};
    Object.keys(totalCountByType).forEach(type => {
      const total = totalCountByType[type];
      const approved = approvalCountByType[type] || 0;
      approvalRateByType[type] = total > 0 ? (approved / total) * 100 : 0;
    });

    // Sort rejection reasons by frequency
    const sortedRejectionReasons = Object.entries(rejectionReasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([reason, count]) => ({ reason, count }));

    // Calculate overall statistics
    const totalDocuments = documents.length;
    const totalApproved = Object.values(approvalCountByType).reduce((sum, count) => sum + count, 0);
    const totalRejected = Object.values(rejectionCountByType).reduce((sum, count) => sum + count, 0);
    const overallApprovalRate = totalDocuments > 0 ? (totalApproved / totalDocuments) * 100 : 0;

    return {
      success: true,
      data: {
        cycleTimeByType: averageCycleTimeByType,
        approvalRateByType,
        rejectionReasons: sortedRejectionReasons,
        overallStatistics: {
          totalDocuments,
          totalApproved,
          totalRejected,
          overallApprovalRate: Math.round(overallApprovalRate * 100) / 100
        }
      }
    };
  } catch (error) {
    console.error('Error getting analytics data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Hard delete a workflow document
 * This permanently deletes the workflow document and its associated data
 */
export async function deleteWorkflowDocument(id) {
  try {
    // Check if document exists
    const existing = await prisma.workflowDocument.findUnique({
      where: { id },
      include: { file: true }
    });

    if (!existing) {
      return { success: false, error: 'Workflow document not found' };
    }

    // Delete in transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Check if file is used by other documents BEFORE deleting this document
      let shouldDeleteFile = false;
      if (existing.fileId) {
        const fileUsageCount = await tx.workflowDocument.count({
          where: { fileId: existing.fileId }
        });
        // Only delete file if this is the ONLY document using it (count === 1 means only this document)
        shouldDeleteFile = fileUsageCount === 1;
      }

      // Delete status history
      await tx.workflowStatusHistory.deleteMany({
        where: { workflowDocumentId: id }
      });

      // Delete comments
      await tx.workflowComment.deleteMany({
        where: { workflowDocumentId: id }
      });

      // Delete workflow document
      await tx.workflowDocument.delete({
        where: { id }
      });

      // Never delete the file - it should remain in Smart Drive
      // The file belongs to the user, not the workflow
    });

    return { success: true, data: { id } };
  } catch (error) {
    console.error('Error deleting workflow document:', error);
    return { success: false, error: error.message };
  }
}

export default {
  createWorkflowDocument,
  createWorkflowStatusHistory,
  getWorkflowDocumentById,
  getWorkflowDocumentsBySubmitter,
  getWorkflowDocumentsByFileId,
  getWorkflowDocumentsByAssignee,
  updateWorkflowDocumentStatus,
  addWorkflowComment,
  getCommentsByWorkflowDocument,
  deleteWorkflowComment,
  resubmitWorkflowDocument,
  getComplianceData,
  getAnalyticsData,
  deleteWorkflowDocument
};
