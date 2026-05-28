// Quiz Business Service
// PURPOSE: Business logic layer for quiz operations
// ARCHITECTURE: Frontend → API Routes → Controllers → Business Services → DB Services → PostgreSQL

import { appConfig } from '@services/config/apiConfig.js';
import { getAuthToken } from '@utils/authHelpers';

/**
 * Helper function to make API requests
 */
async function apiRequest(endpoint, options = {}) {
  // Use centralized config to build API URL
  const baseUrl = appConfig.getApiBaseUrl();
  const version = appConfig.getApiVersion();
  
  // Handle case where base URL might already include /api or /api/v1
  const hasApi = baseUrl.includes('/api');
  const hasVersion = baseUrl.includes(`/${version}`) || baseUrl.includes(`/v1`);
  
  let url;
  if (hasVersion) {
    // Base URL already has version, so endpoint should not include it
    const cleanEndpoint = endpoint.replace(/^\/api\/v1/, '').replace(/^\/+/, '');
    url = `${baseUrl}/${cleanEndpoint}`;
  } else if (hasApi) {
    // Base URL has /api but not version, add version
    const cleanEndpoint = endpoint.replace(/^\/api\/v1/, '').replace(/^\/+/, '');
    url = `${baseUrl}/${version}/${cleanEndpoint}`;
  } else {
    // Base URL is just the base, add /api/v1
    const cleanEndpoint = endpoint.replace(/^\/api\/v1/, '');
    url = `${baseUrl}/api/${version}${cleanEndpoint}`;
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Request failed',
        code: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('[QuizService] API request error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}

export const getAllQuizzes = async (options = {}) => {
  const { page = 1, limit = 50, search = '', createdBy, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder
  });
  
  if (search) params.append('search', search);
  if (createdBy) params.append('createdBy', createdBy.toString());
  if (isActive !== undefined) params.append('isActive', isActive.toString());
  
  return apiRequest(`quizzes?${params.toString()}`);
};

export const getQuiz = async (id) => {
  return apiRequest(`quizzes/${id}`);
};

export const createQuiz = async (data, user) => {
  const quizData = {
    ...data,
    createdBy: user?.id || data.createdBy
  };
  
  return apiRequest('quizzes', {
    method: 'POST',
    body: JSON.stringify(quizData)
  });
};

export const updateQuiz = async (id, data, user) => {
  const quizData = {
    ...data,
    updatedBy: user?.id || data.updatedBy
  };
  
  return apiRequest(`quizzes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(quizData)
  });
};

export const deleteQuiz = async (id, user) => {
  return apiRequest(`quizzes/${id}`, {
    method: 'DELETE'
  });
};

export const getQuizzesByCreator = async (creatorId, options = {}) => {
  const { page = 1, limit = 50, search = '', isActive, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder
  });
  
  if (search) params.append('search', search);
  if (isActive !== undefined) params.append('isActive', isActive.toString());
  
  return apiRequest(`quizzes/creator/${creatorId}?${params.toString()}`);
};

export const getQuizzesBySubject = async (subjectId, options = {}) => {
  // This would need a specific endpoint in the backend
  // For now, return empty result
  return {
    success: true,
    data: [],
    total: 0
  };
};

export const getQuizzesByClass = async (classId, options = {}) => {
  // This would need a specific endpoint in the backend
  // For now, return empty result
  return {
    success: true,
    data: [],
    total: 0
  };
};

export const getActiveQuizzes = async (options = {}) => {
  return getAllQuizzes({ ...options, isActive: true });
};

export const getQuizStats = async (quizId) => {
  return apiRequest(`quizzes/stats?quizId=${quizId}`);
};

export const submitQuiz = async (quizId, submissionData) => {
  return apiRequest(`quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify(submissionData)
  });
};

export default {
  getAllQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizzesByCreator,
  getQuizzesBySubject,
  getQuizzesByClass,
  getActiveQuizzes,
  getQuizStats,
  submitQuiz,
};
