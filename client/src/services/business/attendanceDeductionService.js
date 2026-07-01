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

export default {
  fetchAttendanceDeductionSuggestion,
  fetchAbsenceDeductionRules,
  fetchDeductionHistory,
};
