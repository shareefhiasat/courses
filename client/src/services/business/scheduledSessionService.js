import api from '@api';

const BASE = '/scheduled-sessions';

function buildParams(filters = {}) {
  const params = {};
  if (filters.classId) params.classId = filters.classId;
  if (filters.instructorId) params.instructorId = filters.instructorId;
  if (filters.classroomId) params.classroomId = filters.classroomId;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.status) params.status = filters.status;
  if (filters.isActive !== undefined) params.isActive = filters.isActive;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  return params;
}

/**
 * Get all scheduled sessions (authenticated)
 */
export const getAllScheduledSessions = async (filters = {}) => {
  try {
    return await api.get(BASE, { params: buildParams(filters) });
  } catch (err) {
    console.error('Error getting scheduled sessions:', err);
    return { success: false, error: err.message, data: [] };
  }
};

export const getScheduledSessionById = async (id) => {
  try {
    return await api.get(`${BASE}/${id}`);
  } catch (err) {
    console.error('Error getting scheduled session:', err);
    return { success: false, error: err.message };
  }
};

export const createScheduledSession = async (data) => {
  try {
    return await api.post(BASE, data);
  } catch (err) {
    console.error('Error creating scheduled session:', err);
    return { success: false, error: err.message };
  }
};

export const updateScheduledSession = async (id, data) => {
  try {
    return await api.put(`${BASE}/${id}`, data);
  } catch (err) {
    console.error('Error updating scheduled session:', err);
    return { success: false, error: err.message };
  }
};

export const deleteScheduledSession = async (id, deletedBy = null, deletionReason = null) => {
  try {
    return await api.delete(`${BASE}/${id}`, { data: { deletedBy, deletionReason } });
  } catch (err) {
    console.error('Error deleting scheduled session:', err);
    return { success: false, error: err.message };
  }
};

export const restoreScheduledSession = async (id, restoredBy = null) => {
  try {
    return await api.post(`${BASE}/${id}/restore`, { restoredBy });
  } catch (err) {
    console.error('Error restoring scheduled session:', err);
    return { success: false, error: err.message };
  }
};

export const updateSessionStatus = async (id, status, updatedBy = null, reason = null) => {
  try {
    return await api.patch(`${BASE}/${id}/status`, { status, updatedBy, reason });
  } catch (err) {
    console.error('Error updating session status:', err);
    return { success: false, error: err.message };
  }
};

export const cancelSession = async (id, cancelledBy = null, reason = null) => {
  try {
    return await api.post(`${BASE}/${id}/cancel`, { cancelledBy, reason });
  } catch (err) {
    console.error('Error cancelling session:', err);
    return { success: false, error: err.message };
  }
};

export const cancelRecurringSeries = async (id, cancelledBy = null, reason = null) => {
  try {
    return await api.post(`${BASE}/${id}/cancel-series`, { cancelledBy, reason });
  } catch (err) {
    console.error('Error cancelling series:', err);
    return { success: false, error: err.message };
  }
};

export default {
  getAllScheduledSessions,
  getScheduledSessionById,
  createScheduledSession,
  updateScheduledSession,
  deleteScheduledSession,
  restoreScheduledSession,
  updateSessionStatus,
  cancelSession,
  cancelRecurringSeries,
};
