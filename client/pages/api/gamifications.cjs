/**
 * @swagger
 * /api/v1/gamifications:
 *   get:
 *     summary: Get all gamification records
 *     description: Retrieve a list of gamification records (supports optional filtering)
 *     tags: [Gamifications]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single gamification record by ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by gamification type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: stats
 *         schema:
 *           type: boolean
 *         description: Get user stats instead of records (requires userId)
 *     responses:
 *       200:
 *         description: Gamifications retrieved successfully
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
 *                     $ref: '#/components/schemas/Gamification'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new gamification record
 *     description: Create a new gamification record
 *     tags: [Gamifications]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GamificationInput'
 *     responses:
 *       201:
 *         description: Gamification record created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a gamification record
 *     description: Update an existing gamification record
 *     tags: [Gamifications]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Gamification record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GamificationInput'
 *     responses:
 *       200:
 *         description: Gamification record updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Gamification record not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a gamification record
 *     description: Delete a gamification record by ID
 *     tags: [Gamifications]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Gamification record ID
 *     responses:
 *       200:
 *         description: Gamification record deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const gamificationDbService = require('@services/db/gamificationDbService.cjs');

const {
  getGamifications,
  getGamificationById,
  create: createGamification,
  update: updateGamification,
  deleteGamification,
  getUserStats
} = gamificationDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'GamificationsAPI',
    method,
    url: `/api/${API_VERSION}/gamifications`,
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
    const { id, userId, type, isActive, stats } = req.query;

    if (id) {
      const result = await getGamificationById(id);
      return res.status(200).json(result);
    }

    if (stats === 'true' && userId) {
      const result = await getUserStats(userId);
      return res.status(200).json(result);
    }

    const result = await getGamifications({
      userId,
      type,
      isActive: isActive !== undefined ? isActive === 'true' : undefined
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'GamificationsAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const gamificationData = req.body;

    if (!gamificationData.userId || !gamificationData.type || !gamificationData.name) {
      return res.status(400).json({
        success: false,
        error: 'userId, type, and name are required'
      });
    }

    const result = await createGamification(gamificationData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'GamificationsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Gamification record ID is required' });

    const result = await updateGamification(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'GamificationsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Gamification record ID is required' });

    const result = await deleteGamification(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'GamificationsAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
