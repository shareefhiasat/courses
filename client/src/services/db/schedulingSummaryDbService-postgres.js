/**
 * Scheduling Summary API Client
 */

import api from '@api';

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') q.append(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const getSchedulingSummary = (params) => api.get(`/scheduling/summary${buildQuery(params)}`);
export const getEffortReport = (params) => api.get(`/scheduling/effort-report${buildQuery(params)}`);
export const getBreakSessionSummary = (params) => api.get(`/scheduling/summary/break-sessions${buildQuery(params)}`);
export const getHolidaySummary = (params) => api.get(`/scheduling/summary/holidays${buildQuery(params)}`);
export const getTeacherWorkloadSummary = (params) => api.get(`/scheduling/summary/teacher-workload${buildQuery(params)}`);
export const getClassroomUtilizationSummary = (params) => api.get(`/scheduling/summary/classroom-utilization${buildQuery(params)}`);
export const getTeacherEffort = (teacherId, params) => api.get(`/scheduling/teacher-effort/${teacherId}${buildQuery(params)}`);

export const getBreakSessions = (params) => api.get(`/scheduling/break-sessions${buildQuery(params)}`);
export const createBreakSession = (data) => api.post('/scheduling/break-sessions', data);
export const updateBreakSession = (id, data) => api.put(`/scheduling/break-sessions/${id}`, data);
export const deleteBreakSession = (id, deleteScope = 'single') =>
  api.delete(`/scheduling/break-sessions/${id}`, { data: { deleteScope } });

export default {
  getSchedulingSummary,
  getEffortReport,
  getBreakSessionSummary,
  getHolidaySummary,
  getTeacherWorkloadSummary,
  getClassroomUtilizationSummary,
  getTeacherEffort,
  getBreakSessions,
  createBreakSession,
  updateBreakSession,
  deleteBreakSession,
};
