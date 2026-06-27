/**
 * Weekly Summary Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for weekly attendance summary generation
 * ARCHITECTURE: Controllers → Services → DB Services → Prisma → PostgreSQL
 */

import prisma from '../db/prismaClient.js';
import { createWorkflowDocumentWithUpload } from './workflowDocumentService.js';


/**
 * Generate weekly attendance summary
 */
export async function generateWeeklySummary(data) {
  try {
    const {
      weekStart,
      weekEnd,
      hrUserId,
      comments
    } = data;

    // Query daily attendance documents within date range
    const dailyDocuments = await prisma.workflowDocument.findMany({
      where: {
        workflowType: 'ATTENDANCE_DAILY',
        date: {
          gte: new Date(weekStart),
          lte: new Date(weekEnd)
        },
        status: 'SUBMITTED'
      },
      include: {
        file: true,
        submitter: true,
        class: true
      },
      orderBy: { date: 'asc' }
    });

    if (dailyDocuments.length === 0) {
      return { success: false, error: 'No daily attendance documents found for the selected date range' };
    }

    // Aggregate attendance data
    const summaryData = aggregateAttendanceData(dailyDocuments);

    // Generate Excel document
    const excelFile = await generateWeeklyExcelReport(summaryData, { weekStart, weekEnd });

    // Create workflow document with ATTENDANCE_WEEKLY type
    const result = await createWorkflowDocumentWithUpload({
      workflowType: 'ATTENDANCE_WEEKLY',
      workflowCategory: 'ATTENDANCE',
      attendanceSubtype: 'WEEKLY_SUMMARY',
      approvalFlow: 'HR_THEN_ADMIN',
      title: `Weekly Attendance Summary - ${weekStart} to ${weekEnd}`,
      description: comments || `Weekly summary aggregating ${dailyDocuments.length} daily attendance documents`,
      fileData: excelFile.data,
      fileName: excelFile.fileName,
      fileType: excelFile.fileType,
      submitterId: hrUserId,
      currentAssigneeId: null,
      classId: null,
      instructorId: null,
      date: new Date(weekStart),
      dateFrom: new Date(weekStart),
      dateTo: new Date(weekEnd),
      metadata: {
        linkedDailyDocumentIds: dailyDocuments.map((d) => d.id),
      },
      program: null,
      subject: null,
      createdBy: hrUserId,
      updatedBy: hrUserId
    });

    // Store references to related daily documents
    if (result.success) {
      await linkDailyDocuments(result.data.document.id, dailyDocuments.map(d => d.id));
    }

    return result;
  } catch (error) {
    console.error('Error in generateWeeklySummary:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Aggregate attendance data from daily documents
 */
function aggregateAttendanceData(dailyDocuments) {
  const studentMap = new Map();
  const classMap = new Map();

  dailyDocuments.forEach(doc => {
    const className = doc.class?.name || 'Unknown';
    const program = doc.program || 'Unknown';
    const subject = doc.subject || 'Unknown';

    // Track class-level data
    if (!classMap.has(className)) {
      classMap.set(className, {
        className,
        program,
        subject,
        totalDays: 0,
        totalStudents: new Set()
      });
    }
    const classData = classMap.get(className);
    classData.totalDays++;

    // Note: In a real implementation, we would parse the actual attendance data
    // from the uploaded Excel files. For now, we'll aggregate metadata.
    // This would need to:
    // 1. Download each file from MinIO
    // 2. Parse the Excel/Word content
    // 3. Extract student-level attendance records
    // 4. Calculate deductions per student
  });

  return {
    totalDailyDocuments: dailyDocuments.length,
    totalClasses: classMap.size,
    classes: Array.from(classMap.values()),
    students: Array.from(studentMap.values()),
    weekStart: dailyDocuments[0]?.date,
    weekEnd: dailyDocuments[dailyDocuments.length - 1]?.date
  };
}

/**
 * Generate Excel report from aggregated data
 */
async function generateWeeklyExcelReport(summaryData, metadata) {
  try {
    const { weekStart, weekEnd } = metadata;

    // Prepare data for Excel export
    const headers = ['Class', 'Program', 'Subject', 'Total Days'];
    const rows = summaryData.classes.map(cls => [
      cls.className,
      cls.program,
      cls.subject,
      cls.totalDays
    ]);

    // Generate Excel file using existing export service
    const { exportToExcel } = await import('../services/export/excelExportService.js');
    const blob = await exportToExcel(rows, headers, {
      sheetName: `Weekly Summary ${weekStart}`,
      fileName: `weekly_summary_${weekStart.replace(/-/g, '')}_${weekEnd.replace(/-/g, '')}.xlsx`
    });

    // Convert blob to base64
    const base64Data = await blobToBase64(blob);

    return {
      data: base64Data,
      fileName: `weekly_summary_${weekStart.replace(/-/g, '')}_${weekEnd.replace(/-/g, '')}.xlsx`,
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  } catch (error) {
    console.error('Error generating weekly Excel report:', error);
    throw error;
  }
}

/**
 * Convert blob to base64
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Link weekly summary to related daily documents
 */
async function linkDailyDocuments(weeklyDocumentId, dailyDocumentIds) {
  try {
    if (!dailyDocumentIds?.length) return;

    const existing = await prisma.workflowDocument.findUnique({
      where: { id: weeklyDocumentId },
      select: { metadata: true },
    });

    const metadata = existing?.metadata && typeof existing.metadata === 'object'
      ? existing.metadata
      : {};

    await prisma.workflowDocument.update({
      where: { id: weeklyDocumentId },
      data: {
        metadata: {
          ...metadata,
          linkedDailyDocumentIds: dailyDocumentIds,
        },
      },
    });
  } catch (error) {
    console.error('Error linking daily documents:', error);
  }
}

/**
 * Get daily documents for a date range
 */
export async function getDailyDocumentsForRange(weekStart, weekEnd) {
  try {
    const documents = await prisma.workflowDocument.findMany({
      where: {
        workflowType: 'ATTENDANCE_DAILY',
        date: {
          gte: new Date(weekStart),
          lte: new Date(weekEnd)
        }
      },
      include: {
        file: true,
        submitter: true,
        class: true
      },
      orderBy: { date: 'asc' }
    });

    return { success: true, data: documents };
  } catch (error) {
    console.error('Error getting daily documents:', error);
    return { success: false, error: error.message };
  }
}

export default {
  generateWeeklySummary,
  getDailyDocumentsForRange
};
