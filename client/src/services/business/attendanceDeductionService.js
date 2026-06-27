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

export default {
  fetchAttendanceDeductionSuggestion,
  fetchAbsenceDeductionRules,
};
