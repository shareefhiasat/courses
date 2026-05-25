/**
 * Weekly Summary API Client
 * 
 * PURPOSE: HTTP client for weekly summary API communication
 * ARCHITECTURE: Frontend → API Client → Backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

/**
 * Get authentication token
 */
async function getToken() {
  const keycloak = window.keycloak;
  if (!keycloak || !keycloak.authenticated) {
    throw new Error('User not authenticated');
  }
  return keycloak.token;
}

/**
 * Generate weekly summary
 */
export async function generateWeeklySummary(data) {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/weekly-summary/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get daily documents for a date range
 */
export async function getDailyDocuments(weekStart, weekEnd) {
  try {
    const token = await getToken();
    const response = await fetch(
      `${API_BASE_URL}/api/v1/weekly-summary/daily-documents?weekStart=${weekStart}&weekEnd=${weekEnd}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting daily documents:', error);
    return { success: false, error: error.message };
  }
}

export default {
  generateWeeklySummary,
  getDailyDocuments
};
