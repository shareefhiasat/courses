import { apiService } from '../api/apiService.js';
import {
  getWorkflowDocument,
  updateWorkflowDocumentStatus,
  addWorkflowComment,
  approveWorkflowDocument,
  rejectWorkflowDocument,
  returnWorkflowDocument,
  resubmitWorkflowDocument,
} from '../api/workflow-documents-api.js';
import { ATTENDANCE_STATUS, getStatusCodeFromRecord } from '../../constants/attendanceTypes.js';
import {
  WORKFLOW_STATUS_COLORS,
  ATTENDANCE_BOARD_COLORS,
} from '../../constants/workspaceStatusColors.js';
import { info, error as logError } from '../utils/logger.js';

const SERVICE_NAME = 'OperationsBoardService';

export const WORKFLOW_COLUMNS = [
  { id: 'DRAFT', name: 'Draft', i18nKey: 'operations_board_lane_draft', color: WORKFLOW_STATUS_COLORS.DRAFT },
  { id: 'TAKEN', name: 'Taken', i18nKey: 'operations_board_lane_taken', color: WORKFLOW_STATUS_COLORS.TAKEN },
  { id: 'SUBMITTED', name: 'Submitted', i18nKey: 'operations_board_lane_submitted', color: WORKFLOW_STATUS_COLORS.SUBMITTED },
  { id: 'UNDER_ADMIN_REVIEW', name: 'In Admin Review', i18nKey: 'operations_board_lane_admin_review', color: WORKFLOW_STATUS_COLORS.UNDER_ADMIN_REVIEW },
  { id: 'UNDER_HR_REVIEW', name: 'In HR Review', i18nKey: 'operations_board_lane_hr_review', color: WORKFLOW_STATUS_COLORS.UNDER_HR_REVIEW },
  { id: 'APPROVED', name: 'Approved', i18nKey: 'operations_board_lane_approved', color: WORKFLOW_STATUS_COLORS.APPROVED },
  { id: 'REJECTED', name: 'Rejected', i18nKey: 'operations_board_lane_rejected', color: WORKFLOW_STATUS_COLORS.REJECTED },
];

export const ATTENDANCE_COLUMNS = [
  { id: 'NOT_TAKEN', name: 'Not Taken', i18nKey: 'operations_board_lane_not_taken', color: ATTENDANCE_BOARD_COLORS.NOT_TAKEN },
  { id: 'PRESENT', name: 'Present', i18nKey: 'operations_board_lane_present', color: ATTENDANCE_BOARD_COLORS.PRESENT },
  { id: 'LATE', name: 'Late', i18nKey: 'operations_board_lane_late', color: ATTENDANCE_BOARD_COLORS.LATE },
  { id: 'ABSENT', name: 'Absent', i18nKey: 'operations_board_lane_absent', color: ATTENDANCE_BOARD_COLORS.ABSENT },
  { id: 'EXCUSED', name: 'Excused Leave', i18nKey: 'operations_board_lane_leave', color: ATTENDANCE_BOARD_COLORS.EXCUSED },
  { id: 'HUMAN_CASE', name: 'Human Case', i18nKey: 'operations_board_lane_human_case', color: ATTENDANCE_BOARD_COLORS.HUMAN_CASE },
];

const BOARD_LANE_TO_DB_CODE = {
  PRESENT: ATTENDANCE_STATUS.PRESENT,
  LATE: ATTENDANCE_STATUS.LATE,
  ABSENT: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE,
  EXCUSED: ATTENDANCE_STATUS.EXCUSED_LEAVE,
  HUMAN_CASE: ATTENDANCE_STATUS.HUMAN_CASE,
};

const DB_CODE_TO_BOARD_LANE = {
  [ATTENDANCE_STATUS.PRESENT]: 'PRESENT',
  PRESENT: 'PRESENT',
  [ATTENDANCE_STATUS.LATE]: 'LATE',
  LATE: 'LATE',
  [ATTENDANCE_STATUS.ABSENT_NO_EXCUSE]: 'ABSENT',
  ABSENT_NO_EXCUSE: 'ABSENT',
  ABSENT: 'ABSENT',
  [ATTENDANCE_STATUS.EXCUSED_LEAVE]: 'EXCUSED',
  EXCUSED_LEAVE: 'EXCUSED',
  EXCUSED: 'EXCUSED',
  ABSENT_WITH_EXCUSE: 'EXCUSED',
  [ATTENDANCE_STATUS.HUMAN_CASE]: 'HUMAN_CASE',
  HUMAN_CASE: 'HUMAN_CASE',
};

function normalizeAttendanceStatus(value) {
  if (value === null || value === undefined) return 'NOT_TAKEN';
  if (typeof value === 'object') {
    const code = getStatusCodeFromRecord(value);
    if (!code) return 'NOT_TAKEN';
    return DB_CODE_TO_BOARD_LANE[code] || 'NOT_TAKEN';
  }
  const str = String(value).toUpperCase().trim().replace(/\s+/g, '_');
  return DB_CODE_TO_BOARD_LANE[str] || ATTENDANCE_COLUMNS.find((col) => col.id === str)?.id || 'NOT_TAKEN';
}

export function deriveAction(fromStatus, toStatus) {
  if (toStatus === 'REJECTED') return 'REJECT';
  if (toStatus === 'DRAFT') return 'RETURN';
  if (toStatus === 'TAKEN' && fromStatus === 'DRAFT') return 'MARK_TAKEN';
  if (toStatus === 'SUBMITTED' && fromStatus === 'TAKEN') return 'SUBMIT';
  if (toStatus === 'SUBMITTED' && fromStatus === 'DRAFT') return 'SUBMIT';
  if (toStatus === 'SUBMITTED' && fromStatus === 'REJECTED') return 'RESUBMIT';
  if (toStatus === 'UNDER_HR_REVIEW' || toStatus === 'UNDER_ADMIN_REVIEW' || toStatus === 'APPROVED') return 'APPROVE';
  return null;
}

function boardLaneToDbCode(laneId) {
  return BOARD_LANE_TO_DB_CODE[laneId] || laneId;
}

export const ensureDailyWorkflows = async (date, classIds = []) => {
  try {
    return await apiService.post('/workflow-documents/ensure-daily', { date, classIds });
  } catch (err) {
    logError(`${SERVICE_NAME}:ensureDailyWorkflows:error`, { error: err.message });
    return { success: false, error: err.message };
  }
};

export const fetchWorkflowBoardData = async (filters = {}) => {
  try {
    info(`${SERVICE_NAME}:fetchWorkflowBoardData`, { filters });

    const params = new URLSearchParams();
    if (filters.date) params.append('date', filters.date);
    if (filters.classId) params.append('classId', filters.classId);
    if (filters.programId) params.append('programId', filters.programId);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    if (filters.status) params.append('status', filters.status);
    if (filters.workflowType) params.append('workflowType', filters.workflowType);
    if (filters.search) params.append('search', filters.search);
    params.append('workflowCategory', 'ATTENDANCE');
    params.append('attendanceSubtype', 'DAILY');

    const queryString = params.toString();
    const url = `/workflow-documents/board?${queryString}`;
    const result = await apiService.get(url);

    if (!result.success) return { success: false, data: [], error: result.error };

    const documents = result.data || [];
    const boardData = documents.map((doc) => ({
      id: `wf-${doc.id}`,
      column: doc.status || 'DRAFT',
      type: 'workflow',
      title: doc.title || `Document #${doc.id}`,
      name: doc.title || `Document #${doc.id}`,
      rawId: doc.id,
      status: doc.status,
      assignee: doc.currentAssignee?.displayName || doc.currentAssignee?.name || doc.currentAssignee?.fullName || null,
      assigneeId: doc.currentAssigneeId,
      workflowType: doc.workflowType,
      classId: doc.classId,
      className: doc.class?.nameEn || doc.class?.code,
      programName: doc.class?.program?.nameEn,
      subjectName: doc.class?.subject?.nameEn,
      date: doc.date,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      description: doc.description,
      fileName: doc.file?.name || null,
      fileId: doc.file?.id || null,
      raw: doc,
    }));

    let filtered = boardData;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = boardData.filter(
        (d) =>
          d.title?.toLowerCase().includes(q) ||
          d.className?.toLowerCase().includes(q) ||
          d.programName?.toLowerCase().includes(q) ||
          d.subjectName?.toLowerCase().includes(q)
      );
    }

    return { success: true, data: filtered };
  } catch (err) {
    logError(`${SERVICE_NAME}:fetchWorkflowBoardData:error`, { error: err.message });
    return { success: false, data: [], error: err.message };
  }
};

export const fetchWorkflowById = async (workflowId) => {
  try {
    const result = await getWorkflowDocument(workflowId);
    if (!result.success) return { success: false, data: null, error: result.error };
    return { success: true, data: result.data };
  } catch (err) {
    return { success: false, data: null, error: err.message };
  }
};

export const fetchAttendanceBoardData = async (filters = {}) => {
  try {
    info(`${SERVICE_NAME}:fetchAttendanceBoardData`, { filters });

    let classId = filters.classId;
    let date = filters.date;

    if (filters.workflowId && (!classId || !date)) {
      const wfResult = await fetchWorkflowById(filters.workflowId);
      if (wfResult.success && wfResult.data) {
        classId = classId || wfResult.data.classId;
        date = date || wfResult.data.date;
      }
    }

    if (!classId || !date) {
      return { success: false, data: [], error: 'classId and date are required for attendance board' };
    }

    const dateStr = typeof date === 'string' ? date.slice(0, 10) : new Date(date).toISOString().slice(0, 10);

    const [rosterResult, attendanceResult] = await Promise.all([
      apiService.get(`/enrollments/students-by-class?classId=${classId}`),
      apiService.get(`/attendance?classId=${classId}&date=${dateStr}`),
    ]);

    const enrollments = rosterResult.data?.enrollments || rosterResult.data || [];
    const records = attendanceResult.data?.attendances || attendanceResult.data || [];

    const attendanceByUserId = new Map();
    for (const rec of records) {
      attendanceByUserId.set(rec.userId, rec);
    }

    const boardData = enrollments.map((enrollment) => {
      const user = enrollment.user || enrollment.User || {};
      const rec = attendanceByUserId.get(user.id || enrollment.userId);
      const statusStr = rec ? normalizeAttendanceStatus(rec) : 'NOT_TAKEN';
      const studentName =
        user.displayName ||
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        `Student #${user.id || enrollment.userId}`;

      return {
        id: rec ? `att-${rec.id}` : `student-${user.id || enrollment.userId}`,
        column: statusStr,
        type: 'attendance',
        title: studentName,
        name: studentName,
        rawId: rec?.id || null,
        userId: user.id || enrollment.userId,
        profileImageUrl: user.profileImageUrl || null,
        status: statusStr,
        date: dateStr,
        classId: parseInt(classId, 10),
        className: enrollment.class?.nameEn || enrollment.class?.nameAr,
        programName: enrollment.program?.nameEn,
        subjectName: enrollment.subject?.nameEn,
        notes: rec?.notes || null,
        raw: rec || { userId: user.id || enrollment.userId, classId, date: dateStr },
      };
    });

    return { success: true, data: boardData };
  } catch (err) {
    logError(`${SERVICE_NAME}:fetchAttendanceBoardData:error`, { error: err.message });
    return { success: false, data: [], error: err.message };
  }
};

export const moveWorkflowCard = async (documentId, fromStatus, toStatus, reason = null) => {
  try {
    info(`${SERVICE_NAME}:moveWorkflowCard`, { documentId, fromStatus, toStatus });
    const action = deriveAction(fromStatus, toStatus);

    if (action === 'APPROVE') {
      return await approveWorkflowDocument(documentId, { comment: reason });
    }
    if (action === 'REJECT') {
      return await rejectWorkflowDocument(documentId, { comment: reason || 'Rejected from board' });
    }
    if (action === 'RETURN') {
      return await returnWorkflowDocument(documentId, { comment: reason || 'Returned from board' });
    }
    if (action === 'RESUBMIT') {
      return await resubmitWorkflowDocument(documentId, { comment: reason });
    }

    return await updateWorkflowDocumentStatus(documentId, { status: toStatus, reason });
  } catch (err) {
    logError(`${SERVICE_NAME}:moveWorkflowCard:error`, { error: err.message });
    return { success: false, error: err.message };
  }
};

export const markWorkflowAsTaken = async (documentId, reason = null) => {
  return moveWorkflowCard(documentId, 'DRAFT', 'TAKEN', reason);
};

export const moveAttendanceCard = async (attendanceId, newStatus, notes = null, createPayload = null) => {
  try {
    info(`${SERVICE_NAME}:moveAttendanceCard`, { attendanceId, newStatus });
    const dbCode = boardLaneToDbCode(newStatus);

    if (!attendanceId && createPayload) {
      const result = await apiService.post('/attendance', {
        ...createPayload,
        status: dbCode,
        notes,
      });
      return result;
    }

    const result = await apiService.put(`/attendance/${attendanceId}`, {
      status: dbCode,
      notes,
    });
    return result;
  } catch (err) {
    logError(`${SERVICE_NAME}:moveAttendanceCard:error`, { error: err.message });
    return { success: false, error: err.message };
  }
};

export const addWorkflowBoardComment = async (documentId, comment, action = 'COMMENT') => {
  try {
    const result = await addWorkflowComment(documentId, { comment, action });
    return result;
  } catch (err) {
    logError(`${SERVICE_NAME}:addWorkflowBoardComment:error`, { error: err.message });
    return { success: false, error: err.message };
  }
};

export const fetchWorkflowHistory = async (documentId) => {
  try {
    const result = await getWorkflowDocument(documentId);
    if (!result.success) return { success: false, data: [], error: result.error };
    const doc = result.data?.document || result.data;
    return {
      success: true,
      data: {
        history: doc?.statusHistory || [],
        comments: doc?.comments || [],
        document: doc,
      },
    };
  } catch (err) {
    logError(`${SERVICE_NAME}:fetchWorkflowHistory:error`, { error: err.message });
    return { success: false, data: [], error: err.message };
  }
};

export const fetchAttendanceHistory = async (attendanceId) => {
  try {
    const result = await apiService.get(`/attendance/record-history/${attendanceId}`);
    return result;
  } catch (err) {
    logError(`${SERVICE_NAME}:fetchAttendanceHistory:error`, { error: err.message });
    return { success: false, data: [], error: err.message };
  }
};
