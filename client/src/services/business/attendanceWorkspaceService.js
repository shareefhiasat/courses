import { info, error } from '../utils/logger.js';

const serviceName = 'attendanceWorkspaceService';

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost:8001/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('keycloak_token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const getInstructorPrograms = async () => {
  try {
    const response = await fetch(`${API_BASE}/attendance-workspace/instructor-programs`, {
      headers: getHeaders(),
    });
    if (!response.ok) return { success: false, data: [] };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:getInstructorPrograms:error`, { error: err.message });
    return { success: false, data: [] };
  }
};

export const getAllPrograms = async () => {
  try {
    const response = await fetch(`${API_BASE}/attendance-workspace/programs`, {
      headers: getHeaders(),
    });
    if (!response.ok) return { success: false, data: [] };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:getAllPrograms:error`, { error: err.message });
    return { success: false, data: [] };
  }
};

export const getProgramTerms = async (programId, { all = false } = {}) => {
  try {
    const query = all ? '?all=true' : '';
    const response = await fetch(
      `${API_BASE}/attendance-workspace/programs/${programId}/terms${query}`,
      { headers: getHeaders() }
    );
    if (!response.ok) return { success: false, data: [] };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:getProgramTerms:error`, { error: err.message });
    return { success: false, data: [] };
  }
};

export const getWeeklySchedule = async ({ programId, academicTermId, instructorId }) => {
  try {
    const params = new URLSearchParams({ programId: String(programId) });
    if (academicTermId) params.set('academicTermId', String(academicTermId));
    if (instructorId) params.set('instructorId', String(instructorId));
    const response = await fetch(`${API_BASE}/attendance-workspace/weekly-schedule?${params}`, {
      headers: getHeaders(),
    });
    if (!response.ok) return { success: false, data: null };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:getWeeklySchedule:error`, { error: err.message });
    return { success: false, data: null };
  }
};

export const getScheduleGrid = async (params) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/attendance-workspace/schedule-grid?${query}`, {
      headers: getHeaders(),
    });
    if (!response.ok) return { success: false, data: [] };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:getScheduleGrid:error`, { error: err.message });
    return { success: false, data: [] };
  }
};

export const getScheduleStatus = async (classIds, date) => {
  try {
    const query = new URLSearchParams({
      classIds: classIds.join(','),
      date: (date instanceof Date ? date : new Date(date)).toISOString(),
    }).toString();
    const response = await fetch(`${API_BASE}/attendance-workspace/schedule-status?${query}`, {
      headers: getHeaders(),
    });
    if (!response.ok) return { success: false, data: {} };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:getScheduleStatus:error`, { error: err.message });
    return { success: false, data: {} };
  }
};

export default {
  getInstructorPrograms,
  getAllPrograms,
  getProgramTerms,
  getWeeklySchedule,
  getScheduleGrid,
  getScheduleStatus,
};
