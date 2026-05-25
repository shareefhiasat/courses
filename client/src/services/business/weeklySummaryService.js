/**
 * Weekly Summary Business Service
 * 
 * PURPOSE: Business logic for weekly summary operations
 * ARCHITECTURE: UI Components → Business Service → API Client → Backend API
 */

import {
  generateWeeklySummary as generateWeeklySummaryAPI,
  getDailyDocuments as getDailyDocumentsAPI
} from '@services/api/weekly-summary-api.js';

/**
 * Generate weekly attendance summary
 */
export async function generateWeeklySummary(weekStart, weekEnd, comments) {
  try {
    const result = await generateWeeklySummaryAPI({
      weekStart,
      weekEnd,
      comments
    });

    return result;
  } catch (error) {
    console.error('Error in generateWeeklySummary:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get daily documents for a date range
 */
export async function getDailyDocuments(weekStart, weekEnd) {
  try {
    const result = await getDailyDocumentsAPI(weekStart, weekEnd);
    return result;
  } catch (error) {
    console.error('Error in getDailyDocuments:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current week date range (Monday to Sunday)
 */
export function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  const sunday = new Date(now.setDate(diff + 6));

  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0]
  };
}

/**
 * Get previous week date range
 */
export function getPreviousWeekRange() {
  const current = getCurrentWeekRange();
  const weekStart = new Date(current.weekStart);
  const weekEnd = new Date(current.weekEnd);

  weekStart.setDate(weekStart.getDate() - 7);
  weekEnd.setDate(weekEnd.getDate() - 7);

  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0]
  };
}

export default {
  generateWeeklySummary,
  getDailyDocuments,
  getCurrentWeekRange,
  getPreviousWeekRange
};
