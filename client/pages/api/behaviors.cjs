/**
 * @swagger
 * /api/v1/behaviors:
 *   get:
 *     summary: Get all behavior records
 *     description: Retrieve a list of behavior records (supports optional filtering)
 *     tags: [Behaviors]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single behavior by ID
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: instructorId
 *         schema:
 *           type: string
 *         description: Filter by instructor ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by behavior type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by behavior category
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *         description: Filter by severity level
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Behaviors retrieved successfully
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
 *                     $ref: '#/components/schemas/Behavior'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new behavior record
 *     description: Create a new behavior record
 *     tags: [Behaviors]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BehaviorInput'
 *     responses:
 *       201:
 *         description: Behavior created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a behavior record
 *     description: Update an existing behavior record
 *     tags: [Behaviors]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Behavior ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BehaviorInput'
 *     responses:
 *       200:
 *         description: Behavior updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Behavior not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a behavior record
 *     description: Delete a behavior record by ID
 *     tags: [Behaviors]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Behavior ID
 *     responses:
 *       200:
 *         description: Behavior deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const behaviorDbService = require('@services/db/behaviorDbService.cjs');

const {
  getBehaviors,
  getBehaviorById,
  create: createBehavior,
  update: updateBehavior,
  deleteBehavior
} = behaviorDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'BehaviorsAPI',
    method,
    url: `/api/${API_VERSION}/behaviors`,
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
    const { id, studentId, classId, instructorId, type, category, severity, status } = req.query;

    if (id) {
      const result = await getBehaviorById(id);
      return res.status(200).json(result);
    }

    const result = await getBehaviors({
      studentId,
      classId,
      instructorId,
      type,
      category,
      severity,
      status
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'BehaviorsAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const behaviorData = req.body;

    if (!behaviorData.studentId || !behaviorData.type || !behaviorData.description) {
      return res.status(400).json({
        success: false,
        error: 'studentId, type, and description are required'
      });
    }

    const result = await createBehavior(behaviorData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'BehaviorsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Behavior ID is required' });

    const result = await updateBehavior(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'BehaviorsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Behavior ID is required' });

    const result = await deleteBehavior(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'BehaviorsAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
