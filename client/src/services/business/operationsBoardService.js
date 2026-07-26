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
import { getLocalizedUserName } from '@utils/localizedUserName.js';

const SERVICE_NAME = 'OperationsBoardService';

export const ATTENDANCE_BOARD_LANES = {
  NOT_TAKEN: 'NOT_TAKEN',
  PRESENT: 'PRESENT',
  LATE: 'LATE',
  ABSENT: 'ABSENT',
  EXCUSED: 'EXCUSED',
  HUMAN_CASE: 'HUMAN_CASE',
};

export const WORKFLOW_COLUMNS = [
  { id: 'DRAFT', name: 'Draft', i18nKey: 'operations_board_lane_draft', color: WORKFLOW_STATUS_COLORS.DRAFT },
  { id: 'SUBMITTED', name: 'Confirmed', i18nKey: 'operations_board_lane_confirmed', color: WORKFLOW_STATUS_COLORS.SUBMITTED },
  { id: 'UNDER_ADMIN_REVIEW', name: 'Admin', i18nKey: 'operations_board_lane_admin_review', color: WORKFLOW_STATUS_COLORS.UNDER_ADMIN_REVIEW },
  { id: 'UNDER_HR_REVIEW', name: 'HR', i18nKey: 'operations_board_lane_hr_review', color: WORKFLOW_STATUS_COLORS.UNDER_HR_REVIEW },
  { id: 'APPROVED', name: 'Approved', i18nKey: 'operations_board_lane_approved', color: WORKFLOW_STATUS_COLORS.APPROVED },
  { id: 'REJECTED', name: 'Rejected', i18nKey: 'operations_board_lane_rejected', color: WORKFLOW_STATUS_COLORS.REJECTED },
];

export const ATTENDANCE_COLUMNS = [
  { id: ATTENDANCE_BOARD_LANES.NOT_TAKEN, name: 'Not Taken', i18nKey: 'operations_board_lane_not_taken', color: ATTENDANCE_BOARD_COLORS.NOT_TAKEN },
  { id: ATTENDANCE_BOARD_LANES.PRESENT, name: 'Present', i18nKey: 'operations_board_lane_present', color: ATTENDANCE_BOARD_COLORS.PRESENT },
  { id: ATTENDANCE_BOARD_LANES.LATE, name: 'Late', i18nKey: 'operations_board_lane_late', color: ATTENDANCE_BOARD_COLORS.LATE },
  { id: ATTENDANCE_BOARD_LANES.ABSENT, name: 'Absent', i18nKey: 'operations_board_lane_absent', color: ATTENDANCE_BOARD_COLORS.ABSENT },
  { id: ATTENDANCE_BOARD_LANES.EXCUSED, name: 'Excused Leave', i18nKey: 'operations_board_lane_leave', color: ATTENDANCE_BOARD_COLORS.EXCUSED },
  { id: ATTENDANCE_BOARD_LANES.HUMAN_CASE, name: 'Human Case', i18nKey: 'operations_board_lane_human_case', color: ATTENDANCE_BOARD_COLORS.HUMAN_CASE },
];

const BOARD_LANE_TO_DB_CODE = {
  [ATTENDANCE_BOARD_LANES.PRESENT]: ATTENDANCE_STATUS.PRESENT,
  [ATTENDANCE_BOARD_LANES.LATE]: ATTENDANCE_STATUS.LATE,
  [ATTENDANCE_BOARD_LANES.ABSENT]: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE,
  [ATTENDANCE_BOARD_LANES.EXCUSED]: ATTENDANCE_STATUS.EXCUSED_LEAVE,
  [ATTENDANCE_BOARD_LANES.HUMAN_CASE]: ATTENDANCE_STATUS.HUMAN_CASE,
};

const DB_CODE_TO_BOARD_LANE = {
  [ATTENDANCE_STATUS.PRESENT]: ATTENDANCE_BOARD_LANES.PRESENT,
  [ATTENDANCE_BOARD_LANES.PRESENT]: ATTENDANCE_BOARD_LANES.PRESENT,
  [ATTENDANCE_STATUS.LATE]: ATTENDANCE_BOARD_LANES.LATE,
  [ATTENDANCE_BOARD_LANES.LATE]: ATTENDANCE_BOARD_LANES.LATE,
  [ATTENDANCE_STATUS.ABSENT_NO_EXCUSE]: ATTENDANCE_BOARD_LANES.ABSENT,
  ABSENT_NO_EXCUSE: ATTENDANCE_BOARD_LANES.ABSENT,
  [ATTENDANCE_BOARD_LANES.ABSENT]: ATTENDANCE_BOARD_LANES.ABSENT,
  [ATTENDANCE_STATUS.EXCUSED_LEAVE]: ATTENDANCE_BOARD_LANES.EXCUSED,
  EXCUSED_LEAVE: ATTENDANCE_BOARD_LANES.EXCUSED,
  [ATTENDANCE_BOARD_LANES.EXCUSED]: ATTENDANCE_BOARD_LANES.EXCUSED,
  ABSENT_WITH_EXCUSE: ATTENDANCE_BOARD_LANES.EXCUSED,
  [ATTENDANCE_STATUS.HUMAN_CASE]: ATTENDANCE_BOARD_LANES.HUMAN_CASE,
  [ATTENDANCE_BOARD_LANES.HUMAN_CASE]: ATTENDANCE_BOARD_LANES.HUMAN_CASE,
};

export function normalizeAttendanceStatus(value) {
  if (value === null || value === undefined) return ATTENDANCE_BOARD_LANES.NOT_TAKEN;
  if (typeof value === 'object') {
    const code = getStatusCodeFromRecord(value);
    if (!code) return ATTENDANCE_BOARD_LANES.NOT_TAKEN;
    return DB_CODE_TO_BOARD_LANE[code] || ATTENDANCE_BOARD_LANES.NOT_TAKEN;
  }
  const str = String(value).toUpperCase().trim().replace(/\s+/g, '_');
  return DB_CODE_TO_BOARD_LANE[str] || ATTENDANCE_COLUMNS.find((col) => col.id === str)?.id || ATTENDANCE_BOARD_LANES.NOT_TAKEN;
}

export function deriveAction(fromStatus, toStatus) {
  if (toStatus === 'REJECTED') return 'REJECT';
  if (toStatus === 'SUBMITTED' && fromStatus === 'UNDER_ADMIN_REVIEW') return 'RETURN';
  if (toStatus === 'UNDER_ADMIN_REVIEW' && fromStatus === 'UNDER_HR_REVIEW') return 'RETURN';
  if (toStatus === 'DRAFT' && fromStatus === 'SUBMITTED') return 'RETURN';
  if (toStatus === 'SUBMITTED' && fromStatus === 'DRAFT') return 'SUBMIT';
  if (toStatus === 'SUBMITTED' && fromStatus === 'REJECTED') return 'RESUBMIT';
  if (
    (toStatus === 'UNDER_ADMIN_REVIEW' && fromStatus === 'SUBMITTED')
    || (toStatus === 'UNDER_HR_REVIEW' && fromStatus === 'UNDER_ADMIN_REVIEW')
    || (toStatus === 'APPROVED' && fromStatus === 'UNDER_HR_REVIEW')
  ) {
    return 'APPROVE';
  }
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
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.classId) params.append('classId', filters.classId);
    if (filters.programId) params.append('programId', filters.programId);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    if (filters.status) params.append('status', filters.status);
    if (filters.workflowType) params.append('workflowType', filters.workflowType);
    if (filters.search) params.append('search', filters.search);
    params.append('workflowCategory', 'ATTENDANCE');
    if (filters.attendanceSubtype) params.append('attendanceSubtype', filters.attendanceSubtype);

    params.append('_t', Date.now());
    const queryString = params.toString();
    const url = `/workflow-documents/board?${queryString}`;
    const result = await apiService.get(url);
    console.log('[fetchWorkflowBoardData] raw result:', { url, success: result.success, count: result.data?.length, firstId: result.data?.[0]?.id });

    if (!result.success) return { success: false, data: [], error: result.error };

    const documents = result.data || [];
    const lang = filters.lang || 'en';
    const boardData = documents.map((doc) => {
      const isWeeklySummary = doc.attendanceSubtype === 'WEEKLY_SUMMARY';
      const classInstructor = isWeeklySummary
        ? null
        : (doc.class?.instructor || doc.instructor || null);
      const classInstructorName = classInstructor
        ? getLocalizedUserName(classInstructor, lang, classInstructor.displayName || '')
        : null;

      const classNameEn = doc.class?.nameEn || doc.class?.code || '';
      const classNameAr = doc.class?.nameAr || classNameEn;
      const dateStr = doc.date
        ? (typeof doc.date === 'string' ? doc.date.slice(0, 10) : new Date(doc.date).toISOString().slice(0, 10))
        : '';
      const originalTitle = doc.title || `Document #${doc.id}`;
      // Rebuild the English title with the English class name so the drawer/board
      // do not show Arabic class names when the user is in English mode.
      const nameEn = dateStr && classNameEn
        ? `Daily Attendance — ${classNameEn} — ${dateStr}`
        : originalTitle;
      const nameAr = dateStr && classNameAr
        ? `الحضور اليومي — ${classNameAr} — ${dateStr}`
        : originalTitle;

      return {
        id: `wf-${doc.id}`,
        column: doc.status || 'DRAFT',
        type: 'workflow',
        title: nameEn,
        name: originalTitle,
        nameEn,
        nameAr,
        rawId: doc.id,
        status: doc.status,
        assignee: classInstructorName
          || doc.currentAssignee?.displayName
          || doc.currentAssignee?.name
          || doc.currentAssignee?.fullName
          || null,
        assigneeId: classInstructor?.id || doc.currentAssigneeId,
        classInstructorId: classInstructor?.id || doc.instructorId || null,
        classInstructorName,
        workflowType: doc.workflowType,
        classId: doc.classId,
        className: classNameEn,
        classNameEn,
        classNameAr,
        programId: doc.class?.programId || null,
        subjectId: doc.class?.subjectId || null,
        programName: doc.class?.program?.nameEn,
        subjectName: doc.class?.subject?.nameEn,
        date: doc.date,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        description: doc.description,
        fileName: doc.file?.name || null,
        fileId: doc.file?.id || null,
        snapshotFileId: doc.snapshotFileId || null,
        snapshotFileName: doc.snapshotFile?.name || null,
        raw: doc,
        comments: doc.comments || [],
      };
    });

    const uniqueClassDates = new Map();
    for (const doc of documents) {
      if (doc.classId && doc.date) {
        const dateStr = typeof doc.date === 'string' ? doc.date.slice(0, 10) : new Date(doc.date).toISOString().slice(0, 10);
        const key = `${doc.classId}_${dateStr}`;
        if (!uniqueClassDates.has(key)) {
          uniqueClassDates.set(key, { classId: doc.classId, date: dateStr });
        }
      }
    }

    const attendanceSummaryMap = new Map();
    await Promise.all(
      Array.from(uniqueClassDates.values()).map(async ({ classId, date }) => {
        try {
          apiService.clearCacheEntry(`/attendance?classId=${classId}&date=${date}`);
          const attResult = await apiService.get(`/attendance?classId=${classId}&date=${date}`);
          const records = attResult.data?.attendances || attResult.data || [];
          const counts = { present: 0, late: 0, absent: 0, excused: 0, humanCase: 0, notTaken: 0 };
          for (const rec of records) {
            const lane = normalizeAttendanceStatus(rec);
            if (lane === ATTENDANCE_BOARD_LANES.PRESENT) counts.present++;
            else if (lane === ATTENDANCE_BOARD_LANES.LATE) counts.late++;
            else if (lane === ATTENDANCE_BOARD_LANES.ABSENT) counts.absent++;
            else if (lane === ATTENDANCE_BOARD_LANES.EXCUSED) counts.excused++;
            else if (lane === ATTENDANCE_BOARD_LANES.HUMAN_CASE) counts.humanCase++;
            else counts.notTaken++;
          }
          attendanceSummaryMap.set(`${classId}_${date}`, counts);
        } catch {}
      })
    );

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

    filtered = filtered.map((item) => {
      if (item.classId && item.date) {
        const dateStr = typeof item.date === 'string' ? item.date.slice(0, 10) : new Date(item.date).toISOString().slice(0, 10);
        const key = `${item.classId}_${dateStr}`;
        const summary = attendanceSummaryMap.get(key);
        if (summary) item.attendanceSummary = summary;
      }
      return item;
    });

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

    let enrollments = [];
    let records = [];

    try {
      const rosterResult = await apiService.get(`/enrollments/students-by-class?classId=${classId}`);
      if (rosterResult?.success !== false) {
        enrollments = rosterResult?.data?.enrollments || rosterResult?.data || [];
        if (!Array.isArray(enrollments)) enrollments = [];
      }
      info(`${SERVICE_NAME}:fetchAttendanceBoardData:roster`, {
        classId,
        date: dateStr,
        enrollmentCount: enrollments.length,
        sampleUserId: enrollments[0]?.user?.id || enrollments[0]?.userId || null,
      });
    } catch (rosterErr) {
      logError(`${SERVICE_NAME}:fetchAttendanceBoardData:roster`, {
        error: rosterErr.message,
        status: rosterErr.response?.status,
        classId,
        date: dateStr,
      });
    }

    try {
      // Avoid stale empty-cache result after backend timezone fixes
      apiService.clearCacheEntry(`/attendance?classId=${classId}&date=${dateStr}`);
      const attendanceResult = await apiService.get(`/attendance?classId=${classId}&date=${dateStr}`);
      if (attendanceResult?.success !== false) {
        records = attendanceResult?.data?.attendances || attendanceResult?.data || [];
        if (!Array.isArray(records)) records = [];
      }
      info(`${SERVICE_NAME}:fetchAttendanceBoardData:attendance`, {
        classId,
        date: dateStr,
        recordCount: records.length,
        sampleUserId: records[0]?.userId || null,
        sampleStatus: records[0]?.status?.code || records[0]?.status || null,
      });
    } catch (attendanceErr) {
      logError(`${SERVICE_NAME}:fetchAttendanceBoardData:attendance`, {
        error: attendanceErr.message,
        status: attendanceErr.response?.status,
        classId,
        date: dateStr,
      });
    }

    if (!enrollments.length) {
      return {
        success: false,
        data: [],
        error: records.length
          ? 'Unable to load class roster for attendance board'
          : 'Unable to load attendance board data',
      };
    }

    const attendanceByUserId = new Map();
    for (const rec of records) {
      const uid = rec.userId ?? rec.user?.id;
      if (uid == null) continue;
      attendanceByUserId.set(String(uid), rec);
    }

    const boardData = enrollments.map((enrollment) => {
      const user = enrollment.user || enrollment.User || {};
      const uid = user.id ?? enrollment.userId;
      const rec = uid != null ? attendanceByUserId.get(String(uid)) : null;
      const statusStr = rec ? normalizeAttendanceStatus(rec) : ATTENDANCE_BOARD_LANES.NOT_TAKEN;
      const fallbackName = user.studentNumber
        ? `Student #${user.studentNumber}`
        : `Student #${uid}`;
      const studentNameEn = getLocalizedUserName(user, 'en', fallbackName);
      const studentNameAr = getLocalizedUserName(user, 'ar', studentNameEn);
      const classNameEn = enrollment.class?.nameEn || enrollment.class?.code || '';
      const classNameAr = enrollment.class?.nameAr || classNameEn;

      return {
        id: rec ? `att-${rec.id}` : `student-${uid}`,
        column: statusStr,
        type: 'attendance',
        title: studentNameEn,
        name: studentNameEn,
        nameEn: studentNameEn,
        nameAr: studentNameAr,
        rawId: rec?.id || null,
        userId: uid,
        profileImageUrl: user.profileImageUrl || null,
        user,
        sequence: user.sequence ?? null,
        studentNumber: user.studentNumber || null,
        status: statusStr,
        date: dateStr,
        classId: parseInt(classId, 10),
        className: classNameEn,
        classNameEn,
        classNameAr,
        programName: enrollment.program?.nameEn,
        subjectName: enrollment.subject?.nameEn,
        notes: rec?.notes || null,
        raw: rec || { userId: uid, classId, date: dateStr },
      };
    });

    const columnSummary = boardData.reduce((acc, row) => {
      acc[row.column] = (acc[row.column] || 0) + 1;
      return acc;
    }, {});
    info(`${SERVICE_NAME}:fetchAttendanceBoardData:summary`, {
      classId,
      date: dateStr,
      matchedRecords: boardData.filter((r) => r.rawId).length,
      columnSummary,
    });
    boardData.sort((a, b) => {
      const aSeq = a.sequence != null ? a.sequence : Infinity;
      const bSeq = b.sequence != null ? b.sequence : Infinity;
      if (aSeq !== bSeq) return aSeq - bSeq;
      const aName = (a.name || '').trim().toLowerCase();
      const bName = (b.name || '').trim().toLowerCase();
      if (aName === bName) return 0;
      return aName > bName ? 1 : -1;
    });

    return { success: true, data: boardData };
  } catch (err) {
    logError(`${SERVICE_NAME}:fetchAttendanceBoardData:error`, { error: err.message });
    return { success: false, data: [], error: err.message };
  }
};

export const moveWorkflowCard = async (documentId, fromStatus, toStatus, reason = null, snapshotData = null, fileId = null) => {
  try {
    info(`${SERVICE_NAME}:moveWorkflowCard`, { documentId, fromStatus, toStatus });
    const action = deriveAction(fromStatus, toStatus);

    let result;
    if (action === 'APPROVE') {
      result = await approveWorkflowDocument(documentId, {
        comment: reason,
        ...(snapshotData || {}),
        ...(fileId ? { filedFileId: fileId } : {}),
      });
    } else if (action === 'REJECT') {
      result = await rejectWorkflowDocument(documentId, { comment: reason || 'Rejected from board' });
    } else if (action === 'RETURN') {
      result = await returnWorkflowDocument(documentId, { comment: reason || 'Returned from board' });
    } else if (action === 'RESUBMIT') {
      result = await resubmitWorkflowDocument(documentId, { comment: reason });
    } else {
      result = await updateWorkflowDocumentStatus(documentId, { status: toStatus, reason });
    }

    if (result?.success) {
      apiService.clearCacheByPrefix('/workflow-documents');
    }

    return result;
  } catch (err) {
    logError(`${SERVICE_NAME}:moveWorkflowCard:error`, { error: err.message });
    const isPermissionError = err?.response?.status === 403 || err?.message?.includes('403');
    const errorMessage = isPermissionError 
      ? 'You do not have permission to perform this action' 
      : err.message;
    return { success: false, error: errorMessage, isPermissionError };
  }
};

export const markWorkflowAsTaken = async (documentId, reason = null) => {
  return moveWorkflowCard(documentId, 'DRAFT', 'TAKEN', reason);
};

export const moveAttendanceCard = async (attendanceId, newStatus, notes = null, createPayload = null) => {
  try {
    info(`${SERVICE_NAME}:moveAttendanceCard`, { attendanceId, newStatus });

    if (newStatus === ATTENDANCE_BOARD_LANES.NOT_TAKEN) {
      if (!attendanceId) return { success: true, data: null };
      const result = await apiService.delete(`/attendance/${attendanceId}`);
      if (result.success) {
        apiService.clearCacheByPrefix('/attendance');
      }
      return result;
    }

    const dbCode = boardLaneToDbCode(newStatus);

    if (!attendanceId && createPayload) {
      const result = await apiService.post('/attendance', {
        ...createPayload,
        status: dbCode,
        notes,
      });
      if (result.success) {
        apiService.clearCacheByPrefix('/attendance');
      }
      return result;
    }

    const result = await apiService.put(`/attendance/${attendanceId}`, {
      status: dbCode,
      notes,
    });
    if (result.success) {
      apiService.clearCacheByPrefix('/attendance');
    }
    return result;
  } catch (err) {
    const apiError = err?.response?.data?.error || err?.response?.data?.message || err.message;
    logError(`${SERVICE_NAME}:moveAttendanceCard:error`, { error: apiError, status: err?.response?.status, data: err?.response?.data });
    return { success: false, error: apiError };
  }
};

export const addWorkflowBoardComment = async (documentId, comment, action = 'COMMENT') => {
  try {
    const result = await addWorkflowComment(documentId, { comment, action });
    if (result.success) {
      apiService.clearCacheByPrefix(`/workflow-documents/${documentId}`);
      apiService.clearCacheByPrefix('/workflow-documents');
    }
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

export const updateAttendanceNotes = async (attendanceId, notes) => {
  try {
    info(`${SERVICE_NAME}:updateAttendanceNotes`, { attendanceId });
    const result = await apiService.put(`/attendance/${attendanceId}`, { notes });
    if (result.success) {
      apiService.clearCacheByPrefix('/attendance');
    }
    return result;
  } catch (err) {
    logError(`${SERVICE_NAME}:updateAttendanceNotes:error`, { error: err.message });
    return { success: false, error: err.message };
  }
};

export const fetchAttendanceStats = async (classId) => {
  try {
    const result = await apiService.get(`/attendance/stats?classId=${classId}`);
    return result;
  } catch (err) {
    logError(`${SERVICE_NAME}:fetchAttendanceStats:error`, { error: err.message });
    return { success: false, data: null, error: err.message };
  }
};
