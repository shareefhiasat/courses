import { info, error } from '../utils/logger.js';

const serviceName = 'welcomeService';

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost:8001/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('keycloak_token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const getWelcomePreferences = async () => {
  try {
    const response = await fetch(`${API_BASE}/welcome/preferences`, {
      headers: getHeaders(),
    });
    if (!response.ok) return { success: false, data: null };
    const json = await response.json();
    return json;
  } catch (err) {
    error(`${serviceName}:getWelcomePreferences:error`, { error: err.message });
    return { success: false, data: null };
  }
};

export const saveWelcomePreferences = async (preferences) => {
  try {
    const response = await fetch(`${API_BASE}/welcome/preferences`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(preferences),
    });
    if (!response.ok) return { success: false, data: null };
    const json = await response.json();
    return json;
  } catch (err) {
    error(`${serviceName}:saveWelcomePreferences:error`, { error: err.message });
    return { success: false, data: null };
  }
};

export const getLocalPreferredMode = () => {
  try {
    return localStorage.getItem('welcome_preferred_mode') || null;
  } catch {
    return null;
  }
};

export const setLocalPreferredMode = (mode) => {
  try {
    if (mode) {
      localStorage.setItem('welcome_preferred_mode', mode);
    } else {
      localStorage.removeItem('welcome_preferred_mode');
    }
  } catch {
    /* noop */
  }
};

export default {
  getWelcomePreferences,
  saveWelcomePreferences,
  getLocalPreferredMode,
  setLocalPreferredMode,
};
