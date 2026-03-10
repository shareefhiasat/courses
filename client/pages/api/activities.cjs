/**
 * @swagger
 * /api/v1/activities:
 *   get:
 *     summary: Get all activities
 *     description: Retrieve a list of all activities in the system
 *     tags: [Activities]
 *     responses:
 *       200:
 *         description: List of activities retrieved successfully
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
 *                     $ref: '#/components/schemas/Activity'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new activity
 *     description: Create a new activity with the provided data
 *     tags: [Activities]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityInput'
 *     responses:
 *       201:
 *         description: Activity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/activities/{id}:
 *   get:
 *     summary: Get activity by ID
 *     description: Retrieve a specific activity by its ID
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       404:
 *         description: Activity not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   put:
 *     summary: Update an activity
 *     description: Update an existing activity with new data
 *     tags: [Activities]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityInput'
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Activity not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     summary: Delete an activity
 *     description: Delete an activity by its ID
 *     tags: [Activities]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Activity deleted successfully"
 *       404:
 *         description: Activity not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * Activities API Route
 * Handles all activity operations for the frontend
 * Uses MongoDB/Prisma on the server side
 * CommonJS version for Node.js compatibility
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const activityDbService = require('@services/db/activityDbService.cjs');

const {
  getActivities,
  getActivityById,
  create: createActivity,
  update: updateActivity,
  deleteActivity
} = activityDbService;

function handler(req, res) {
  const { method } = req;
  const startTime = Date.now();

  logger.info('API request received', {
    service: 'ActivitiesAPI',
    method,
    url: `/api/${API_VERSION}/activities`,
    query: req.query,
    body: req.body,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  });

  console.log(`[API Route] 📨 ${method} /api/${API_VERSION}/activities - Query:`, req.query, 'Body:', req.body);

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
      const duration = Date.now() - startTime;
      logger.warn('Method not allowed', {
        service: 'ActivitiesAPI',
        method,
        duration: `${duration}ms`
      });
      console.log(`[API Route] ❌ Method not allowed: ${method}`);
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
  }
}

async function handleGet(req, res) {
  const startTime = Date.now();
  try {
    const { id } = req.query;
    logger.info('GET activities request', {
      service: 'ActivitiesAPI',
      operation: 'handleGet',
      activityId: id || 'all'
    });

    console.log(`[API Route] 📥 GET handler - ID: ${id || 'all'}`);

    if (id) {
      console.log(`[API Route] Fetching activity by ID: ${id}`);
      const result = await getActivityById(id);
      const duration = Date.now() - startTime;

      logger.info('Activity retrieved successfully', {
        service: 'ActivitiesAPI',
        operation: 'handleGet',
        activityId: id,
        success: result.success,
        duration: `${duration}ms`
      });

      console.log('[API Route] ✅ GET result:', result);
      return res.status(200).json(result);
    }

    console.log('[API Route] Fetching all activities');
    const result = await getActivities();
    const duration = Date.now() - startTime;

    logger.info('Activities retrieved successfully', {
      service: 'ActivitiesAPI',
      operation: 'handleGet',
      count: result.data?.length || 0,
      success: result.success,
      duration: `${duration}ms`
    });

    console.log(`[API Route] ✅ GET result: ${result.data?.length || 0} activities`);
    return res.status(200).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in GET handler', {
      service: 'ActivitiesAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[API Route] ❌ Error in GET handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  const startTime = Date.now();
  try {
    const activityData = req.body;
    logger.info('POST activity request', {
      service: 'ActivitiesAPI',
      operation: 'handlePost',
      data: activityData
    });

    console.log('[API Route] 📝 POST handler - Creating activity:', activityData.title || activityData.nameEn || 'unnamed');

    if (!activityData.title || !activityData.classId || !activityData.subjectId) {
      const duration = Date.now() - startTime;
      logger.warn('Missing required fields', {
        service: 'ActivitiesAPI',
        operation: 'handlePost',
        duration: `${duration}ms`
      });
      return res.status(400).json({
        success: false,
        error: 'Title, classId, and subjectId are required'
      });
    }

    const result = await createActivity(activityData);
    const duration = Date.now() - startTime;

    if (result.success) {
      logger.info('Activity created successfully', {
        service: 'ActivitiesAPI',
        operation: 'handlePost',
        activityId: result.data.id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ POST result:', result);
      return res.status(201).json(result);
    }

    logger.error('Failed to create activity', {
      service: 'ActivitiesAPI',
      operation: 'handlePost',
      error: result.error,
      duration: `${duration}ms`
    });
    console.log('[API Route] ❌ POST result:', result);
    return res.status(400).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in POST handler', {
      service: 'ActivitiesAPI',
      operation: 'handlePost',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[API Route] ❌ Error in POST handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePut(req, res) {
  const startTime = Date.now();
  try {
    const { id } = req.query;
    const updateData = req.body;

    logger.info('PUT activity request', {
      service: 'ActivitiesAPI',
      operation: 'handlePut',
      activityId: id,
      data: updateData
    });

    console.log(`[API Route] 🔄 PUT handler - Updating activity: ${id}`);

    if (!id) {
      const duration = Date.now() - startTime;
      logger.warn('Missing activity ID', {
        service: 'ActivitiesAPI',
        operation: 'handlePut',
        duration: `${duration}ms`
      });
      return res.status(400).json({ success: false, error: 'Activity ID is required' });
    }

    const result = await updateActivity(id, updateData);
    const duration = Date.now() - startTime;

    if (result.success) {
      logger.info('Activity updated successfully', {
        service: 'ActivitiesAPI',
        operation: 'handlePut',
        activityId: id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ PUT result:', result);
      return res.status(200).json(result);
    }

    logger.error('Failed to update activity', {
      service: 'ActivitiesAPI',
      operation: 'handlePut',
      activityId: id,
      error: result.error,
      duration: `${duration}ms`
    });
    console.log('[API Route] ❌ PUT result:', result);
    return res.status(400).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in PUT handler', {
      service: 'ActivitiesAPI',
      operation: 'handlePut',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[API Route] ❌ Error in PUT handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handleDelete(req, res) {
  const startTime = Date.now();
  try {
    const { id } = req.query;

    logger.info('DELETE activity request', {
      service: 'ActivitiesAPI',
      operation: 'handleDelete',
      activityId: id
    });

    console.log(`[API Route] 🗑️ DELETE handler - Deleting activity: ${id}`);

    if (!id) {
      const duration = Date.now() - startTime;
      logger.warn('Missing activity ID', {
        service: 'ActivitiesAPI',
        operation: 'handleDelete',
        duration: `${duration}ms`
      });
      return res.status(400).json({ success: false, error: 'Activity ID is required' });
    }

    const result = await deleteActivity(id);
    const duration = Date.now() - startTime;

    if (result.success) {
      logger.info('Activity deleted successfully', {
        service: 'ActivitiesAPI',
        operation: 'handleDelete',
        activityId: id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ DELETE result:', result);
      return res.status(200).json(result);
    }

    logger.error('Failed to delete activity', {
      service: 'ActivitiesAPI',
      operation: 'handleDelete',
      activityId: id,
      error: result.error,
      duration: `${duration}ms`
    });
    console.log('[API Route] ❌ DELETE result:', result);
    return res.status(400).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in DELETE handler', {
      service: 'ActivitiesAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[API Route] ❌ Error in DELETE handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
