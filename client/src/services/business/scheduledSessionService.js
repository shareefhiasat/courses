const API_BASE = '/api/v1/scheduled-sessions';

/**
 * Get all scheduled sessions
 */
export const getAllScheduledSessions = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.classId) params.append('classId', filters.classId);
    if (filters.instructorId) params.append('instructorId', filters.instructorId);
    if (filters.classroomId) params.append('classroomId', filters.classroomId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await fetch(`${API_BASE}?${params}`);
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error getting scheduled sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get scheduled session by ID
 */
export const getScheduledSessionById = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/${id}`);
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error getting scheduled session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a new scheduled session
 */
export const createScheduledSession = async (data) => {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error creating scheduled session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a scheduled session
 */
export const updateScheduledSession = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error updating scheduled session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a scheduled session (soft delete)
 */
export const deleteScheduledSession = async (id, deletedBy = null, deletionReason = null) => {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ deletedBy, deletionReason })
    });
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error deleting scheduled session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Restore a soft-deleted session (admin only)
 */
export const restoreScheduledSession = async (id, restoredBy = null) => {
  try {
    const response = await fetch(`${API_BASE}/${id}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ restoredBy })
    });
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error restoring scheduled session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update session status
 */
export const updateSessionStatus = async (id, status, updatedBy = null, reason = null) => {
  try {
    const response = await fetch(`${API_BASE}/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, updatedBy, reason })
    });
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error updating session status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancel a session
 */
export const cancelSession = async (id, cancelledBy = null, reason = null) => {
  try {
    const response = await fetch(`${API_BASE}/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cancelledBy, reason })
    });
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error cancelling session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancel recurring series
 */
export const cancelRecurringSeries = async (id, cancelledBy = null, reason = null) => {
  try {
    const response = await fetch(`${API_BASE}/${id}/cancel-series`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cancelledBy, reason })
    });
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error cancelling series:', error);
    return { success: false, error: error.message };
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
  cancelRecurringSeries
};
