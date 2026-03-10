/**
 * @swagger
 * /api/v1/activity-logs:
 *   get:
 *     summary: Get all activity logs
 *     description: Retrieve a list of activity logs (supports optional filtering)
 *     tags: [Activity Logs]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single activity log by ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *       - in: query
 *         name: resourceId
 *         schema:
 *           type: string
 *         description: Filter by resource ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: summary
 *         schema:
 *           type: boolean
 *         description: Get user activity summary instead of logs (requires userId)
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ActivityLog'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new activity log
 *     description: Create a new activity log record
 *     tags: [Activity Logs]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityLogInput'
 *     responses:
 *       201:
 *         description: Activity log created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update an activity log
 *     description: Update an existing activity log record
 *     tags: [Activity Logs]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity log ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityLogInput'
 *     responses:
 *       200:
 *         description: Activity log updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Activity log not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete an activity log
 *     description: Delete an activity log by ID
 *     tags: [Activity Logs]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity log ID
 *     responses:
 *       200:
 *         description: Activity log deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const activityLogDbService = require('@services/db/activityLogDbService.cjs');

const {
  getActivityLogs,
  getActivityLogById,
  create: createActivityLog,
  update: updateActivityLog,
  deleteActivityLog,
  logActivity,
  getUserSummary
} = activityLogDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'ActivityLogsAPI',
    method,
    url: `/api/${API_VERSION}/activity-logs`,
    query: req.query
  });

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'PUT':
      return handlePut(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
  }
}

async function handleGet(req, res) {
  try {
    const { id, userId, action, resource, resourceId, startDate, endDate, summary } = req.query;

    if (id) {
      const result = await getActivityLogById(id);
      return res.status(200).json(result);
    }

    if (summary === 'true' && userId) {
      const result = await getUserSummary(userId, { startDate, endDate });
      return res.status(200).json(result);
    }

    const result = await getActivityLogs({
      userId,
      action,
      resource,
      resourceId,
      startDate,
      endDate
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'ActivityLogsAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const activityLogData = req.body;

    if (!activityLogData.userId || !activityLogData.action || !activityLogData.resource || !activityLogData.resourceId) {
      return res.status(400).json({
        success: false,
        error: 'userId, action, resource, and resourceId are required'
      });
    }

    const result = await createActivityLog(activityLogData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'ActivityLogsAPI',
      operation: 'handlePost',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePut(req, res) {
  try {
    const { id } = req.query;
    const updateData = req.body;

    if (!id) return res.status(400).json({ success: false, error: 'Activity log ID is required' });

    const result = await updateActivityLog(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'ActivityLogsAPI',
      operation: 'handlePut',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.query;

    if (!id) return res.status(400).json({ success: false, error: 'Activity log ID is required' });

    const result = await deleteActivityLog(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'ActivityLogsAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
