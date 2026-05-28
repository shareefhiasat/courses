/**
 * File Activity Controller
 * Handles file activity audit trail endpoints
 */

import { getFileActivities as getFileActivitiesService } from '../services/fileActivityService.js';
import { ACTIVITY_ERROR_CODES, ACTIVITY_ERROR_MESSAGES } from '../constants/activity-errors.js';

const ok = (payload) => ({ success: true, payload, timestamp: Date.now() });
const err = (code, message) => ({
  success: false,
  error: { code, message },
  timestamp: Date.now(),
});

/**
 * Get file activities
 * GET /api/v1/drive/files/:fileId/activities
 */
export async function getFileActivities(req, res) {
  try {
    const { fileId } = req.params;
    const userId = req.user?.dbId;

    if (!userId) {
      return res.status(401).json(err(
        ACTIVITY_ERROR_CODES.UNAUTHORIZED,
        ACTIVITY_ERROR_MESSAGES[ACTIVITY_ERROR_CODES.UNAUTHORIZED]
      ));
    }

    // Use service layer to fetch activities
    const result = await getFileActivitiesService({ fileId, userId, limit: 500 });

    if (!result.success) {
      return res.status(404).json(err(
        ACTIVITY_ERROR_CODES.FILE_NOT_FOUND,
        result.error
      ));
    }

    return res.json(ok(result.data));
  } catch (error) {
    console.error('[fileActivityController.getFileActivities]', error);
    return res.status(500).json(err(
      ACTIVITY_ERROR_CODES.GET_ACTIVITIES_FAILED,
      error.message
    ));
  }
}
