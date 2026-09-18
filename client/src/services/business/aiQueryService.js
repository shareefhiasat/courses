/**
 * AI Quick-Question Business Service
 *
 * Dispatches predefined questions to the quick-answer endpoint.
 */

import { apiService } from '../api/apiService';

/**
 * Execute a predefined quick question (no LLM, uses cached/live tool execution).
 *
 * @param {string} questionId - The quick-question identifier
 * @param {string} lang - 'ar' | 'en'
 * @param {object} extraParams - Optional extra parameters
 * @returns {Promise<{ success: boolean, answer: string, tool?: string, data?: any, error?: string, fromCache?: boolean }>}
 */
export async function askAiQuickAssistant(questionId, lang = 'ar', extraParams = {}) {
  try {
    const response = await apiService.post('/ai/quick', {
      questionId,
      lang,
      extraParams,
    }, {
      timeout: 120000,
    });
    return response;
  } catch (error) {
    console.error('[AI Query Service] Failed to ask quick question:', error);
    return {
      success: false,
      error: error?.response?.data?.error || error?.message || 'Failed to connect to AI assistant',
      answer: error?.response?.data?.answer || (lang === 'ar' ? 'تعذر تنفيذ السؤال السريع حالياً.' : 'Failed to execute the quick question.'),
    };
  }
}

export default {
  askAiQuickAssistant,
};
