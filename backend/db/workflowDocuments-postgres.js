/**
 * Workflow Documents DB Service - PostgreSQL Operations
 * 
 * PURPOSE: Database operations for workflow documents using Prisma
 * ARCHITECTURE: DB Services → Prisma → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new workflow document
 * Note: File record creation is handled in the service layer transaction
 */
export async function createWorkflowDocument(data) {
  try {
    const { 
      workflowType, 
      title, 
      description, 
      fileId, 
      submitterId, 
      currentAssigneeId, 
      classId, 
      instructorId, 
      date, 
      program, 
      subject,
      createdBy,
      updatedBy
    } = data;

    const workflowDocument = await prisma.workflowDocument.create({
      data: {
        workflowType,
        title,
        description,
        status: 'SUBMITTED',
        fileId,
        submitterId,
        currentAssigneeId,
        classId,
        instructorId,
        date: date ? new Date(date) : null,
        program,
        subject,
        reviewCycleCount: 0,
        createdBy,
        updatedBy
      },
      include: {
        file: true,
        submitter: true,
        currentAssignee: true,
        instructor: true,
        class: true
      }
    });

    // Create initial status history for submission
    await createWorkflowStatusHistory({
      workflowDocumentId: workflowDocument.id,
      fromStatus: null,
      toStatus: 'SUBMITTED',
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
        }
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
    const { status, workflowType, limit = 50, offset = 0 } = filters;

    const where = {
      submitterId,
      ...(status && { status }),
      ...(workflowType && { workflowType })
    };

    const documents = await prisma.workflowDocument.findMany({
      where,
      include: {
        file: {
          include: {
            currentVersion: true
          }
        },
        currentAssignee: true,
        class: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.workflowDocument.count({ where });

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
        file: {
          include: {
            currentVersion: true,
            versions: true
          }
        },
        currentAssignee: true,
        class: true,
        submitter: true
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
 */
export async function getWorkflowDocumentsByAssignee(assigneeId, filters = {}) {
  try {
    const { status, workflowType, limit = 50, offset = 0 } = filters;

    const where = {
      currentAssigneeId: assigneeId,
      ...(status && { status }),
      ...(workflowType && { workflowType })
    };

    const documents = await prisma.workflowDocument.findMany({
      where,
      include: {
        file: {
          include: {
            currentVersion: true
          }
        },
        submitter: true,
        class: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.workflowDocument.count({ where });

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
        instructorName: doc.instructor?.name || 'Unknown',
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

export default {
  createWorkflowDocument,
  createWorkflowStatusHistory,
  getWorkflowDocumentById,
  getWorkflowDocumentsBySubmitter,
  getWorkflowDocumentsByFileId,
  getWorkflowDocumentsByAssignee,
  updateWorkflowDocumentStatus,
  addWorkflowComment,
  resubmitWorkflowDocument,
  getComplianceData,
  getAnalyticsData
};
