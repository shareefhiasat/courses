/**
 * Authentication Helper Functions
 * 
 * PURPOSE: Centralized token and authentication management
 * ARCHITECTURE: Single source of truth for auth token operations
 */

import { STORAGE_KEYS } from '@services/config/apiConfig.js';

/**
 * Get the authentication token from localStorage
 * @returns {string|null} The auth token or null if not found
 */
export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.KEYCLOAK_TOKEN);
};

/**
 * Set the authentication token in localStorage
 * @param {string} token - The auth token to store
 */
export const setAuthToken = (token) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.KEYCLOAK_TOKEN, token);
};

/**
 * Remove the authentication token from localStorage
 */
export const clearAuthToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.KEYCLOAK_TOKEN);
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Get authorization headers for API requests
 * @returns {Object} Headers object with Authorization header
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Get authorization header value only
 * @returns {string|null} The Authorization header value or null
 */
export const getAuthHeaderValue = () => {
  const token = getAuthToken();
  return token ? `Bearer ${token}` : null;
};

export default {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  isAuthenticated,
  getAuthHeaders,
  getAuthHeaderValue
};
