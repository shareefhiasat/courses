/**
 * Client wrapper for backend attendance deduction calculator.
 */

import { apiService } from '../api/apiService';

export async function fetchAttendanceDeductionSuggestion({ userId, classId, dateFrom, dateTo }) {
  const params = new URLSearchParams();
  params.append('userId', String(userId));
  params.append('classId', String(classId));
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  return apiService.get(`/marks/attendance-deduction?${params.toString()}`);
}

export async function fetchAbsenceDeductionRules() {
  return apiService.get('/marks/absence-deduction-rules');
}

export async function fetchDeductionHistory({ userId, classId }) {
  const params = new URLSearchParams();
  params.append('userId', String(userId));
  if (classId) params.append('classId', String(classId));

  return apiService.get(`/marks/deduction-history?${params.toString()}`);
}

export async function approveAttendanceExcuse({ attendanceId, reason, attachmentUrl, attachmentName, attachmentType }) {
  return apiService.post('/attendance-amendment/approve', {
    attendanceId,
    reason,
    attachmentUrl,
    attachmentName,
    attachmentType,
  });
}

export async function uploadChatAttachment(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiService.post('/drive/chat-upload', formData);
  const data = res?.data || res?.payload || res;
  return {
    url: data?.url,
    name: data?.fileName,
    type: data?.fileType,
  };
}

export async function fetchClassAttendanceWeeks({ classId }) {
  const params = new URLSearchParams();
  params.append('classId', String(classId));
  return apiService.get(`/marks/class-attendance-weeks?${params.toString()}`);
}

export async function fetchAbsenceWarningCounts({ classId, userId, dateFrom, dateTo }) {
  const params = new URLSearchParams();
  params.append('classId', String(classId));
  if (userId) params.append('userId', String(userId));
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  return apiService.get(`/marks/absence-warning-counts?${params.toString()}`);
}

export default {
  fetchAttendanceDeductionSuggestion,
  fetchAbsenceDeductionRules,
  fetchDeductionHistory,
  fetchAbsenceWarningCounts,
  approveAttendanceExcuse,
};
