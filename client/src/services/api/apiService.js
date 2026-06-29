/**
 * API Service - Central API Client Service
 * 
 * PURPOSE:
 * Centralized API client for making HTTP requests to the LMS backend
 * This service handles all communication between frontend and backend APIs
 * 
 * ARCHITECTURE:
 * - Frontend → API Service → Backend API Routes
 * - Business logic should call this service, not direct DB services
 * - Handles authentication, error handling, and response formatting
 * 
 * @typedef {import('@types/index').ApiResponse} ApiResponse
 */

import axios from 'axios';
import { info, error, warn, debug } from '../utils/logger.js';
import { appConfig } from '../config/apiConfig.js';

// Create axios instance with versioned base URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000, // 30 seconds to handle Nextcloud operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // console.log('🔑 [API Service] Request interceptor called for:', config.url);
    // Add Keycloak token if available
    const token = localStorage.getItem('keycloak_token');
    // console.log('🔑 [API Service] Token from localStorage:', token ? '✅ Found' : '❌ Not found');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log('🔑 [API Service] Authorization header set:', config.headers.Authorization);
    } else {
      // console.log('🔑 [API Service] No token found, request will be unauthenticated');
    }
    // For FormData, let axios set the Content-Type automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    // console.log('🔑 [API Service] Final headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('🔑 [API Service] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh the token
      try {
        const keycloak = window.keycloak;
        if (keycloak && !keycloak.tokenExpired) {
          await keycloak.updateToken(30);
          const newToken = keycloak.token;

          if (newToken) {
            localStorage.setItem('keycloak_token', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            console.log('🔑 [API Service] Token refreshed, retrying request');
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('🔑 [API Service] Token refresh failed:', refreshError);
        // Clear invalid token
        localStorage.removeItem('keycloak_token');
      }
    }

    // Suppress noisy 404 errors where missing data is expected
    if (error.response?.status === 404 && (
      originalRequest.url?.includes('standup-attendance') ||
      /\/subjects\/\d+/.test(originalRequest.url || '')
    )) {
      debug('[API Service] Expected 404:', originalRequest.url);
      return Promise.reject(error);
    }

    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Simple in-memory cache for GET requests
const requestCache = new Map();
const CACHE_TTL = 300000; // 5 minutes in milliseconds

// Mock data storage for development
const mockData = {
  programs: [],
  subjects: [],
  classes: [],
  users: [],
  activities: [],
  attendance: [],
  enrollments: []
};

const matchesSearch = (value, search) => {
  if (!search) return true;
  return String(value || '').toLowerCase().includes(String(search).toLowerCase());
};

const applyCollectionFilters = (items, filters = {}, searchableFields = []) => {
  const normalizedFilters = filters || {};

  return items.filter((item) => {
    if (normalizedFilters.id && item.id !== normalizedFilters.id) return false;
    if (normalizedFilters.email && item.email !== normalizedFilters.email) return false;
    if (normalizedFilters.code && item.code !== normalizedFilters.code) return false;
    if (normalizedFilters.role && item.role !== normalizedFilters.role) return false;
    if (normalizedFilters.isActive !== undefined && item.isActive !== normalizedFilters.isActive) return false;
    if (normalizedFilters.search) {
      const fieldsToSearch = searchableFields.length > 0 ? searchableFields : Object.keys(item);
      if (!fieldsToSearch.some((field) => matchesSearch(item[field], normalizedFilters.search))) {
        return false;
      }
    }

    return true;
  });
};

// Mock API endpoints for development
const mockEndpoints = {
  programs: {
    getAll: async (filters = {}) => ({ success: true, data: applyCollectionFilters(mockData.programs, filters, ['nameEn', 'nameAr', 'code']) }),
    getById: async (id) => ({ success: true, data: mockData.programs.find(p => p.id === id) }),
    create: async (data) => {
      const newProgram = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
      mockData.programs.push(newProgram);
      return { success: true, data: newProgram };
    },
    update: async (id, data) => {
      const index = mockData.programs.findIndex(p => p.id === id);
      if (index !== -1) {
        mockData.programs[index] = { ...mockData.programs[index], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: mockData.programs[index] };
      }
      return { success: false, error: 'Program not found' };
    },
    delete: async (id) => {
      const index = mockData.programs.findIndex(p => p.id === id);
      if (index !== -1) {
        mockData.programs.splice(index, 1);
        return { success: true };
      }
      return { success: false, error: 'Program not found' };
    }
  },
  subjects: {
    getAll: async (filters = {}) => ({ success: true, data: applyCollectionFilters(mockData.subjects, filters, ['nameEn', 'nameAr', 'code']) }),
    getById: async (id) => ({ success: true, data: mockData.subjects.find(s => s.id === id) }),
    create: async (data) => {
      const newSubject = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
      mockData.subjects.push(newSubject);
      return { success: true, data: newSubject };
    },
    update: async (id, data) => {
      const index = mockData.subjects.findIndex(s => s.id === id);
      if (index !== -1) {
        mockData.subjects[index] = { ...mockData.subjects[index], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: mockData.subjects[index] };
      }
      return { success: false, error: 'Subject not found' };
    },
    delete: async (id) => {
      const index = mockData.subjects.findIndex(s => s.id === id);
      if (index !== -1) {
        mockData.subjects.splice(index, 1);
        return { success: true };
      }
      return { success: false, error: 'Subject not found' };
    }
  },
  classes: {
    getAll: async (filters = {}) => ({ success: true, data: applyCollectionFilters(mockData.classes, filters, ['nameEn', 'nameAr', 'code']) }),
    getById: async (id) => ({ success: true, data: mockData.classes.find(c => c.id === id) }),
    create: async (data) => {
      const newClass = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
      mockData.classes.push(newClass);
      return { success: true, data: newClass };
    },
    update: async (id, data) => {
      const index = mockData.classes.findIndex(c => c.id === id);
      if (index !== -1) {
        mockData.classes[index] = { ...mockData.classes[index], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: mockData.classes[index] };
      }
      return { success: false, error: 'Class not found' };
    },
    delete: async (id) => {
      const index = mockData.classes.findIndex(c => c.id === id);
      if (index !== -1) {
        mockData.classes.splice(index, 1);
        return { success: true };
      }
      return { success: false, error: 'Class not found' };
    }
  },
  users: {
    getAll: async (filters = {}) => ({ success: true, data: applyCollectionFilters(mockData.users, filters, ['email', 'displayName', 'name', 'role']) }),
    getById: async (id) => ({ success: true, data: mockData.users.find(u => u.id === id) }),
    create: async (data) => {
      const newUser = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
      mockData.users.push(newUser);
      return { success: true, data: newUser };
    },
    update: async (id, data) => {
      const index = mockData.users.findIndex(u => u.id === id);
      if (index !== -1) {
        mockData.users[index] = { ...mockData.users[index], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: mockData.users[index] };
      }
      return { success: false, error: 'User not found' };
    },
    delete: async (id) => {
      const index = mockData.users.findIndex(u => u.id === id);
      if (index !== -1) {
        mockData.users.splice(index, 1);
        return { success: true };
      }
      return { success: false, error: 'User not found' };
    }
  },
  activities: {
    getAll: async (filters = {}) => ({ success: true, data: applyCollectionFilters(mockData.activities, filters, ['title', 'type', 'description']) }),
    getById: async (id) => ({ success: true, data: mockData.activities.find(a => a.id === id) }),
    create: async (data) => {
      const newActivity = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
      mockData.activities.push(newActivity);
      return { success: true, data: newActivity };
    },
    update: async (id, data) => {
      const index = mockData.activities.findIndex(a => a.id === id);
      if (index !== -1) {
        mockData.activities[index] = { ...mockData.activities[index], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: mockData.activities[index] };
      }
      return { success: false, error: 'Activity not found' };
    },
    delete: async (id) => {
      const index = mockData.activities.findIndex(a => a.id === id);
      if (index !== -1) {
        mockData.activities.splice(index, 1);
        return { success: true };
      }
      return { success: false, error: 'Activity not found' };
    }
  },
  attendance: {
    getAll: async (filters = {}) => ({ success: true, data: applyCollectionFilters(mockData.attendance, filters, ['status', 'notes', 'location']) }),
    getById: async (id) => ({ success: true, data: mockData.attendance.find(a => a.id === id) }),
    create: async (data) => {
      const newAttendance = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
      mockData.attendance.push(newAttendance);
      return { success: true, data: newAttendance };
    },
    update: async (id, data) => {
      const index = mockData.attendance.findIndex(a => a.id === id);
      if (index !== -1) {
        mockData.attendance[index] = { ...mockData.attendance[index], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: mockData.attendance[index] };
      }
      return { success: false, error: 'Attendance record not found' };
    },
    delete: async (id) => {
      const index = mockData.attendance.findIndex(a => a.id === id);
      if (index !== -1) {
        mockData.attendance.splice(index, 1);
        return { success: true };
      }
      return { success: false, error: 'Attendance record not found' };
    }
  },
  enrollments: {
    getAll: async (filters = {}) => ({ success: true, data: applyCollectionFilters(mockData.enrollments, filters, ['status', 'notes']) }),
    getById: async (id) => ({ success: true, data: mockData.enrollments.find(e => e.id === id) }),
    create: async (data) => {
      const newEnrollment = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
      mockData.enrollments.push(newEnrollment);
      return { success: true, data: newEnrollment };
    },
    update: async (id, data) => {
      const index = mockData.enrollments.findIndex(e => e.id === id);
      if (index !== -1) {
        mockData.enrollments[index] = { ...mockData.enrollments[index], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: mockData.enrollments[index] };
      }
      return { success: false, error: 'Enrollment not found' };
    },
    delete: async (id) => {
      const index = mockData.enrollments.findIndex(e => e.id === id);
      if (index !== -1) {
        mockData.enrollments.splice(index, 1);
        return { success: true };
      }
      return { success: false, error: 'Enrollment not found' };
    }
  }
};

// Export mock endpoints for development
export const users = mockEndpoints.users;
export const classes = mockEndpoints.classes;
export const activities = mockEndpoints.activities;
export const attendance = mockEndpoints.attendance;
export const enrollments = mockEndpoints.enrollments;

// Additional mock endpoints
export const announcements = mockEndpoints.activities;
export const behaviors = mockEndpoints.activities;
export const bookmarks = mockEndpoints.activities;
export const categories = mockEndpoints.activities;
export const chat = mockEndpoints.activities;
export const notifications = mockEndpoints.activities;
export const participations = mockEndpoints.activities;
export const penalties = mockEndpoints.activities;
export const programs = mockEndpoints.programs;  // Fixed: Use programs endpoint
export const questionBank = mockEndpoints.activities;
export const quizzes = mockEndpoints.activities;
export const quizResults = mockEndpoints.activities;
export const quizSubmissions = mockEndpoints.activities;
export const resources = mockEndpoints.activities;
export const schedules = mockEndpoints.activities;
export const subjects = mockEndpoints.subjects;  // Fixed: Use subjects endpoint
export const templates = mockEndpoints.activities;

// Export the API client for real API calls
export { apiClient };

// Create apiService wrapper for backward compatibility and expected interface
export const apiService = {
  get: async (url, config) => {
    try {
      // Check cache for GET requests (skip for blob responses)
      const isBlobRequest = config?.responseType === 'blob';
      // Include query params in cache key so cache-busting works
      const paramsStr = config?.params ? JSON.stringify(config.params) : '';
      const cacheKey = `${url}?${paramsStr}`;
      const now = Date.now();
      const cached = requestCache.get(cacheKey);

      if (!isBlobRequest && cached && now - cached.timestamp < CACHE_TTL) {
        debug('[API Service] Cache hit for:', url);
        return cached.data;
      }

      const response = await apiClient.get(url, config);
      const data = response.data;

      // For blob responses, return the full response with the blob
      if (isBlobRequest) {
        return { success: true, data: response.data };
      }

      // Cache the response
      requestCache.set(cacheKey, {
        data,
        timestamp: now
      });

      // Clear old cache entries if cache is too large
      if (requestCache.size > 100) {
        const firstKey = requestCache.keys().next().value;
        requestCache.delete(firstKey);
      }

      return data;
    } catch (error) {
      // Suppress 404 errors for endpoints where missing data is expected
      if (error.response?.status === 404 && (
        String(url || '').includes('standup-attendance') ||
        /\/subjects\/\d+/.test(String(url || ''))
      )) {
        debug('[API Service] Expected 404 for GET:', url);
      } else {
        console.error('API GET Error:', error);
      }
      throw error;
    }
  },
  
  post: async (url, data, config) => {
    try {
      const response = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  },
  
  put: async (url, data, config) => {
    try {
      const response = await apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      console.error('API PUT Error:', error);
      throw error;
    }
  },

  patch: async (url, data, config) => {
    try {
      const response = await apiClient.patch(url, data, config);
      return response.data;
    } catch (error) {
      console.error('API PATCH Error:', error);
      throw error;
    }
  },

  delete: async (url, config) => {
    try {
      const response = await apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      console.error('API DELETE Error:', error);
      throw error;
    }
  },
  
  /**
   * Clear the request cache
   * Useful for invalidating cache after mutations
   */
  clearCache: () => {
    requestCache.clear();
    debug('[API Service] Cache cleared');
  },
  
  /**
   * Clear specific cache entry
   * @param {string} url - The URL to clear from cache
   */
  clearCacheEntry: (url) => {
    requestCache.delete(url);
    debug('[API Service] Cache entry cleared for:', url);
  },

  /**
   * Clear all cache entries whose URL starts with the given prefix
   * Useful for invalidating cache after mutations that affect multiple endpoints
   * @param {string} prefix - The URL prefix to match (e.g., 'standup-attendance')
   */
  clearCacheByPrefix: (prefix) => {
    for (const key of requestCache.keys()) {
      if (key.startsWith(prefix)) {
        requestCache.delete(key);
      }
    }
    debug('[API Service] Cache entries cleared for prefix:', prefix);
  }
};

// Export default
export default {
  users,
  classes,
  activities,
  attendance,
  enrollments,
  announcements,
  behaviors,
  bookmarks,
  categories,
  chat,
  notifications,
  participations,
  penalties,
  programs,
  questionBank,
  quizzes,
  quizResults,
  quizSubmissions,
  resources,
  schedules,
  subjects,
  templates,
  apiClient,
  apiService
};
