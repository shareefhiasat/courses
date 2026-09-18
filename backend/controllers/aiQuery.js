/**
 * AI Query Controller
 *
 * Handles HTTP requests for the offline AI Q&A Assistant.
 */

import { processAiQuery, processQuickQuestion } from '../services/aiQueryService.js';
import { warmupAllMetrics } from '../ai/dataCache.js';
import { invalidateAllAiCache } from '../ai/cache.js';

/**
 * POST /api/v1/ai/query
 */
export async function queryAiAssistantController(req, res) {
  try {
    const { message, lang, history } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Question text (message) is required.',
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Question length exceeds 500 characters limit.',
      });
    }

    const userLang = lang === 'en' ? 'en' : 'ar';
    const conversationHistory = Array.isArray(history) ? history.slice(-10) : [];

    console.log('[AI Query] Incoming:', { message: message.trim().slice(0, 100), lang: userLang, userId: req.user?.id, historyLen: conversationHistory.length });

    const result = await processAiQuery(req, message.trim(), userLang, conversationHistory);

    console.log('[AI Query] Result:', { tool: result.tool, success: result.success, hasAnswer: !!result.answer });

    return res.json(result);
  } catch (error) {
    console.error('[AI Query] Error:', { message: message?.trim()?.slice(0, 100), error: error.message, stack: error.stack?.split('\n').slice(0, 5).join(' | ') });
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing your query.',
      message: error.message,
    });
  }
}

/**
 * POST /api/v1/ai/quick
 * Execute a predefined quick question bypassing the LLM.
 */
export async function quickQuestionController(req, res) {
  try {
    const { questionId, lang, extraParams } = req.body || {};

    if (!questionId || typeof questionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'questionId is required.',
      });
    }

    const result = await processQuickQuestion(req, { questionId, lang, extraParams });

    return res.json(result);
  } catch (error) {
    console.error('[AI Quick] Error:', {
      questionId: req.body?.questionId,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join(' | '),
    });
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing the quick question.',
      message: error.message,
    });
  }
}

/**
 * POST /api/v1/ai/cache/refresh
 * Manually trigger the AI metric cache warm-up.
 */
export async function refreshAiCacheController(req, res) {
  try {
    const startedAt = Date.now();
    await warmupAllMetrics();
    return res.json({
      success: true,
      message: 'AI metric cache refreshed',
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('[AI Query] Cache refresh error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to refresh AI metric cache',
      message: error.message,
    });
  }
}

/**
 * POST /api/v1/ai/cache/invalidate
 * Manually invalidate all AI answer + metric caches (high-rate invalidation trigger).
 */
export async function invalidateAiCacheController(req, res) {
  try {
    const result = await invalidateAllAiCache();
    return res.json({
      success: true,
      message: 'AI caches invalidated',
      ...result,
    });
  } catch (error) {
    console.error('[AI Query] Cache invalidation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to invalidate AI cache',
      message: error.message,
    });
  }
}

export default {
  queryAiAssistantController,
  quickQuestionController,
  refreshAiCacheController,
  invalidateAiCacheController,
};
