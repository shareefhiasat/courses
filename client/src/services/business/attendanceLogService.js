import { error } from '../utils/logger.js';

const serviceName = 'attendanceLogService';

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost:8001/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('keycloak_token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const getLectureLog = async (classId, date) => {
  try {
    const query = new URLSearchParams({ classId, date }).toString();
    const response = await fetch(`${API_BASE}/attendance/lecture-log?${query}`, {
      headers: getHeaders(),
    });
    if (!response.ok) return { success: false, data: [] };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:getLectureLog:error`, { error: err.message });
    return { success: false, data: [] };
  }
};

export const getRecordHistory = async (attendanceId) => {
  try {
    const response = await fetch(`${API_BASE}/attendance/record-history/${attendanceId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) return { success: false, data: [] };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:getRecordHistory:error`, { error: err.message });
    return { success: false, data: [] };
  }
};

export default {
  getLectureLog,
  getRecordHistory,
};
