/**
 * Student Progress Service
 * 
 * Manages student learning progress tracking
 */

import { info, error } from '@services/utils/logger.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Log learning time for a student
 * @param {string} userId - User ID
 * @param {number} hours - Hours spent learning
 * @returns {Promise<Object>} Result
 */
export async function logLearningTime(userId, hours) {
  try {
    const response = await fetch(`${API_BASE}/progress/learning-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, hours })
    });
    return await response.json();
  } catch (err) {
    error('Failed to log learning time:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update student progress after completing a quiz
 * @param {string} userId - User ID
 * @param {string} quizId - Quiz ID
 * @param {Object} quizResult - Quiz result data
 * @returns {Promise<Object>} Result
 */
export async function updateProgressAfterQuiz(userId, quizId, quizResult) {
  try {
    const response = await fetch(`${API_BASE}/progress/quiz-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, quizId, ...quizResult })
    });
    return await response.json();
  } catch (err) {
    error('Failed to update progress after quiz:', err);
    return { success: false, error: err.message };
  }
}
