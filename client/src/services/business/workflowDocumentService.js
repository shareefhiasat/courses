/**
 * Workflow Document Business Service
 * 
 * PURPOSE: Business logic for workflow document operations
 * ARCHITECTURE: Frontend Components → Business Service → API Client → Backend API
 */

import {
  createWorkflowDocument,
  createCustomWorkflowDocument,
  getWorkflowDocument,
  getWorkflowDocuments,
  updateWorkflowDocumentStatus,
  addWorkflowComment
} from '../api/workflow-documents-api.js';
import { apiService } from '../api/apiService.js';
import { exportToExcel } from '../export/excelExportService.js';
import { info, error as logError } from '../utils/logger.js';

/**
 * Submit attendance report for HR review
 */
export const submitAttendanceReport = async (attendanceData, metadata) => {
  try {
    const {
      classId,
      className,
      date,
      program,
      subject,
      instructorId,
      comments
    } = metadata;

    // Generate Excel report
    const excelFile = await generateAttendanceExcelReport(attendanceData, metadata);
    
    // Create workflow document
    const result = await createWorkflowDocument({
      workflowType: 'ATTENDANCE_DAILY',
      title: `Daily Attendance Report - ${date}`,
      description: comments || `Attendance report for ${className} on ${date}`,
      classId,
      date,
      program,
      subject,
      fileData: excelFile.data,
      fileName: excelFile.fileName,
      fileType: excelFile.fileType
    });

    return result;
  } catch (error) {
    console.error('Error submitting attendance report:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate Excel report from attendance data
 */
async function generateAttendanceExcelReport(attendanceData, metadata) {
  try {
    const { date, program, subject, className } = metadata;

    // Prepare data for Excel export
    const headers = ['Student Name', 'Student ID', 'Status', 'Check-in Time', 'Notes'];
    const rows = attendanceData.map(student => [
      student.name || '',
      student.studentId || '',
      student.status || '',
      student.checkInTime || '',
      student.notes || ''
    ]);

    // Generate Excel file
    const blob = await exportToExcel(rows, headers, {
      sheetName: `Attendance ${date}`,
      fileName: `attendance_${date.replace(/-/g, '')}.xlsx`
    });

    // Convert blob to base64 for API transmission
    const base64Data = await blobToBase64(blob);

    return {
      data: base64Data,
      fileName: `attendance_${date.replace(/-/g, '')}.xlsx`,
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  } catch (error) {
    console.error('Error generating Excel report:', error);
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
 * Get workflow documents for current user
 */
export const getUserWorkflowDocuments = async (filters = {}) => {
  return await getWorkflowDocuments(filters);
};

/**
 * Get workflow document details
 */
export const getWorkflowDocumentDetails = async (id) => {
  return await getWorkflowDocument(id);
};

/**
 * Update workflow document status
 */
export const updateDocumentStatus = async (id, status, reason) => {
  return await updateWorkflowDocumentStatus(id, { status, reason });
};

/**
 * Add comment to workflow document
 */
export const addCommentToDocument = async (id, comment, action) => {
  return await addWorkflowComment(id, { comment, action });
};

/**
 * Create custom workflow from existing file
 * @param {Object} file - File object from drive
 * @param {Object} workflowData - Workflow configuration
 * @returns {Promise<Object>} Created workflow document
 */
export const createCustomWorkflow = async (file, workflowData) => {
  console.log('🔵 [workflowDocumentService] Creating custom workflow', {
    file,
    workflowData,
    fileName: file?.name || file?.fileName,
    fileId: file?.id || file?.fileId,
    filePath: file?.path || file?.filePath,
    workflowType: workflowData.workflowType,
    reviewersCount: workflowData.reviewers?.length
  });

  try {
    // Validate required fields
    if (!workflowData.title) {
      console.error('❌ [workflowDocumentService] Missing title');
      throw new Error('Workflow title is required');
    }
    if (!workflowData.reviewers || workflowData.reviewers.length === 0) {
      console.error('❌ [workflowDocumentService] Missing reviewers');
      throw new Error('At least one reviewer is required');
    }

    // Prepare API payload
    const payload = {
      workflowType: workflowData.workflowType || 'GENERAL',
      title: workflowData.title,
      description: workflowData.description || '',
      reviewers: workflowData.reviewers,
      attachFile: workflowData.attachFile !== false, // Default to true
      sourceBucket: 'lms-private',
      sourcePath: file?.path || file?.filePath,
      fileName: file?.name || file?.fileName,
      fileId: file?.id || file?.fileId // Link to original file ID
    };

    console.log('🔵 [workflowDocumentService] API Payload:', payload);

    const result = await createCustomWorkflowDocument(payload);

    console.log('🔵 [workflowDocumentService] API Result:', result);

    if (result.success) {
      console.log('✅ [workflowDocumentService] Workflow created successfully', {
        documentId: result.data?.document?.id,
        fullResult: result
      });
    } else {
      console.error('❌ [workflowDocumentService] Workflow creation failed', {
        error: result.error,
        fullResult: result
      });
    }

    return result;
  } catch (error) {
    console.error('❌ [workflowDocumentService] Error creating custom workflow', {
      error: error.message,
      stack: error.stack,
      fullError: error
    });
    throw error;
  }
};

export default {
  submitAttendanceReport,
  getUserWorkflowDocuments,
  getWorkflowDocumentDetails,
  updateDocumentStatus,
  addCommentToDocument,
  createCustomWorkflow
};
