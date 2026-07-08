import { apiService } from '../api/apiService.js';
import { getWorkflowDocuments, updateWorkflowDocumentStatus, addWorkflowComment } from '../api/workflow-documents-api.js';
import { info, error as logError } from '../utils/logger.js';

const SERVICE_NAME = 'OperationsBoardService';

export const WORKFLOW_COLUMNS = [
  { id: 'DRAFT', name: 'Draft', i18nKey: 'operations_board_lane_draft', color: '#6B7280' },
  { id: 'SUBMITTED', name: 'Submitted', i18nKey: 'operations_board_lane_submitted', color: '#3B82F6' },
  { id: 'UNDER_HR_REVIEW', name: 'In HR Review', i18nKey: 'operations_board_lane_hr_review', color: '#F59E0B' },
  { id: 'UNDER_ADMIN_REVIEW', name: 'In Admin Review', i18nKey: 'operations_board_lane_admin_review', color: '#F97316' },
  { id: 'APPROVED', name: 'Approved', i18nKey: 'operations_board_lane_approved', color: '#10B981' },
  { id: 'REJECTED', name: 'Rejected', i18nKey: 'operations_board_lane_rejected', color: '#EF4444' },
];

export const ATTENDANCE_COLUMNS = [
  { id: 'NOT_TAKEN', name: 'Not Taken', i18nKey: 'operations_board_lane_not_taken', color: '#6B7280' },
  { id: 'PRESENT', name: 'Present', i18nKey: 'operations_board_lane_present', color: '#10B981' },
  { id: 'LATE', name: 'Late', i18nKey: 'operations_board_lane_late', color: '#F59E0B' },
  { id: 'ABSENT', name: 'Absent', i18nKey: 'operations_board_lane_absent', color: '#EF4444' },
  { id: 'EXCUSED', name: 'Excused Leave', i18nKey: 'operations_board_lane_leave', color: '#8B5CF6' },
  { id: 'HUMAN_CASE', name: 'Human Case', i18nKey: 'operations_board_lane_human_case', color: '#F97316' },
];

const STATUS_TO_ACTION = {
  DRAFT_TO_SUBMITTED: 'SUBMIT',
  SUBMITTED_TO_UNDER_HR_REVIEW: 'APPROVE',
  UNDER_HR_REVIEW_TO_UNDER_ADMIN_REVIEW: 'APPROVE',
  UNDER_ADMIN_REVIEW_TO_APPROVED: 'APPROVE',
  TO_REJECTED: 'REJECT',
  TO_DRAFT: 'RETURN',
};

const ATTENDANCE_STATUS_MAP = {
  'NOT_TAKEN': 'NOT_TAKEN',
  'NOT_TAKEN': 'NOT_TAKEN',
  'PRESENT': 'PRESENT',
  'LATE': 'LATE',
  'ABSENT': 'ABSENT',
  'EXCUSED': 'EXCUSED',
  'EXCUSED_LEAVE': 'EXCUSED',
  'HUMAN_CASE': 'HUMAN_CASE',
  'HUMAN_CASES': 'HUMAN_CASE',
  '1': 'PRESENT',
  '2': 'ABSENT',
  '3': 'LATE',
  '4': 'EXCUSED',
  '5': 'HUMAN_CASE',
  '6': 'NOT_TAKEN',
};

function normalizeAttendanceStatus(value) {
  if (value === null || value === undefined) return 'NOT_TAKEN';
  const str = String(value).toUpperCase().trim().replace(/\s+/g, '_');
  return ATTENDANCE_STATUS_MAP[str] || ATTENDANCE_COLUMNS.find((col) => col.id === str)?.id || 'NOT_TAKEN';
}

function deriveAction(fromStatus, toStatus) {
  if (toStatus === 'REJECTED') return 'REJECT';
  if (toStatus === 'DRAFT') return 'RETURN';
  if (toStatus === 'SUBMITTED' && fromStatus === 'DRAFT') return 'SUBMIT';
  if (toStatus === 'SUBMITTED' && fromStatus === 'REJECTED') return 'RESUBMIT';
  if (toStatus === 'UNDER_HR_REVIEW' || toStatus === 'UNDER_ADMIN_REVIEW' || toStatus === 'APPROVED') return 'APPROVE';
  return null;
}

export const fetchWorkflowBoardData = async (filters = {}) => {
  try {
    info(`${SERVICE_NAME}:fetchWorkflowBoardData`, { filters });
    const result = await getWorkflowDocuments(filters);
    if (!result.success) return { success: false, data: [], error: result.error };

    const documents = result.data?.documents || result.data || [];
    const boardData = documents.map((doc) => ({
      id: `wf-${doc.id}`,
      column: doc.status || 'DRAFT',
      type: 'workflow',
      title: doc.title || `Document #${doc.id}`,
      name: doc.title || `Document #${doc.id}`,
      rawId: doc.id,
      status: doc.status,
      assignee: doc.currentAssignee?.name || doc.currentAssignee?.fullName || null,
      assigneeId: doc.currentAssigneeId,
      workflowType: doc.workflowType,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      description: doc.description,
      raw: doc,
    }));

    return { success: true, data: boardData };
  } catch (err) {
    logError(`${SERVICE_NAME}:fetchWorkflowBoardData:error`, { error: err.message });
    return { success: false, data: [], error: err.message };
  }
};

export const fetchAttendanceBoardData = async (filters = {}) => {
  try {
    info(`${SERVICE_NAME}:fetchAttendanceBoardData`, { filters });
    const params = new URLSearchParams();
    if (filters.classId) params.append('classId', filters.classId);
    if (filters.date) params.append('date', filters.date);
    if (filters.programId) params.append('programId', filters.programId);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);

    const queryString = params.toString();
    const url = queryString ? `/attendance?${queryString}` : '/attendance';
    const result = await apiService.get(url);

    if (!result.success) return { success: false, data: [], error: result.error };

    const records = result.data?.attendances || result.data || [];
    const boardData = records.map((rec) => {
      const statusValue = rec.status ?? rec.statusName ?? rec.statusId ?? rec.attendanceStatus ?? 'NOT_TAKEN';
      const statusStr = normalizeAttendanceStatus(statusValue);
      return {
      id: `att-${rec.id}`,
      column: statusStr,
      type: 'attendance',
      title: rec.studentName || rec.user?.name || rec.User?.name || `Student #${rec.userId}`,
      name: rec.studentName || rec.user?.name || rec.User?.name || `Student #${rec.userId}`,
      rawId: rec.id,
      status: statusStr,
      date: rec.date,
      classId: rec.classId,
      className: rec.className,
      programName: rec.programName,
      subjectName: rec.subjectName,
      notes: rec.notes,
      raw: rec,
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
    const result = await updateWorkflowDocumentStatus(documentId, { status: toStatus, reason });
    return result;
  } catch (err) {
    logError(`${SERVICE_NAME}:moveWorkflowCard:error`, { error: err.message });
    return { success: false, error: err.message };
  }
};

export const moveAttendanceCard = async (attendanceId, newStatus, notes = null) => {
  try {
    info(`${SERVICE_NAME}:moveAttendanceCard`, { attendanceId, newStatus });
    const result = await apiService.patch(`/attendance/${attendanceId}`, {
      status: newStatus.toUpperCase(),
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
    const result = await apiService.get(`/workflow-documents/${documentId}/history`);
    return result;
  } catch (err) {
    logError(`${SERVICE_NAME}:fetchWorkflowHistory:error`, { error: err.message });
    return { success: false, data: [], error: err.message };
  }
};

export const fetchAttendanceHistory = async (attendanceId) => {
  try {
    const result = await apiService.get(`/attendance/${attendanceId}/changes`);
    return result;
  } catch (err) {
    logError(`${SERVICE_NAME}:fetchAttendanceHistory:error`, { error: err.message });
    return { success: false, data: [], error: err.message };
  }
};
