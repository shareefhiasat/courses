/**
 * Weekly Summary Controller - Request Handlers
 * 
 * PURPOSE: Handle HTTP requests for weekly summary operations
 * ARCHITECTURE: Routes → Controllers → Services → DB Services → Prisma
 */

import {
  generateWeeklySummary,
  getDailyDocumentsForRange
} from '../services/weeklySummaryService.js';
import { emit } from '../services/notifications/index.js';
import { EVENTS } from '../services/notifications/constants.js';

/**
 * Generate weekly summary
 */
export async function generateWeeklySummaryController(req, res) {
  try {
    const { weekStart, weekEnd, comments } = req.body;
    const user = req.user; // Keycloak user from middleware

    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ success: false, error: 'weekStart and weekEnd are required' });
    }

    // Validate date format
    const startDate = new Date(weekStart);
    const endDate = new Date(weekEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }

    if (startDate > endDate) {
      return res.status(400).json({ success: false, error: 'weekStart must be before or equal to weekEnd' });
    }

    const result = await generateWeeklySummary({
      weekStart,
      weekEnd,
      hrUserId: user.dbId,
      comments
    });

    if (result.success) {
      // Emit notification to Admin users
      try {
        await emit(EVENTS.WORKFLOW_SUBMITTED, {
          title: result.data.document.title,
          workflowType: result.data.document.workflowType,
          documentId: result.data.document.id,
          date: result.data.document.date
        }, user, { role: 'admin' });
      } catch (notificationError) {
        console.error('Failed to emit notification:', notificationError);
        // Don't fail the request if notification fails
      }

      res.status(201).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in generateWeeklySummaryController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Get daily documents for a date range
 */
export async function getDailyDocumentsController(req, res) {
  try {
    const { weekStart, weekEnd } = req.query;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ success: false, error: 'weekStart and weekEnd are required' });
    }

    const result = await getDailyDocumentsForRange(weekStart, weekEnd);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in getDailyDocumentsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export default {
  generateWeeklySummaryController,
  getDailyDocumentsController
};
