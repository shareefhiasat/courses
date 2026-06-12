const API_BASE = '/api/v1/scheduled-sessions';

/**
 * Validate a session without saving
 */
export const validateSession = async (sessionData) => {
  try {
    const response = await fetch(`${API_BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error validating session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a single scheduled session
 */
export const createSession = async (sessionData) => {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create recurring sessions
 */
export const createRecurringSessions = async (baseSession, recurrenceConfig) => {
  try {
    const response = await fetch(`${API_BASE}/recurring`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseSession,
        recurrenceConfig,
        createSeries: true
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating recurring sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a scheduled session
 */
export const updateSession = async (sessionId, sessionData) => {
  try {
    const response = await fetch(`${API_BASE}/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a scheduled session
 */
export const deleteSession = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE}/${sessionId}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all scheduled sessions with filters
 */
export const getSessions = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE}?${queryParams}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get session by ID
 */
export const getSessionById = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE}/${sessionId}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get sessions by instructor
 */
export const getSessionsByInstructor = async (instructorId, filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE}/by-instructor/${instructorId}?${queryParams}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting instructor sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get sessions by classroom
 */
export const getSessionsByClassroom = async (classroomId, filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE}/by-room/${classroomId}?${queryParams}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting classroom sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get best instructor/room suggestions
 */
export const getSuggestions = async (classId, preferredTime = null) => {
  try {
    const response = await fetch(`${API_BASE}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, preferredTime })
    });
    return await response.json();
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get alternative time suggestions
 */
export const getAlternativeTimes = async (classId, instructorId, classroomId, originalStart = null) => {
  try {
    const response = await fetch(`${API_BASE}/alternative-times`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, instructorId, classroomId, originalStart })
    });
    return await response.json();
  } catch (error) {
    console.error('Error getting alternative times:', error);
    return { success: false, error: error.message };
  }
};

export default {
  validateSession,
  createSession,
  createRecurringSessions,
  updateSession,
  deleteSession,
  getSessions,
  getSessionById,
  getSessionsByInstructor,
  getSessionsByClassroom,
  getSuggestions,
  getAlternativeTimes
};
