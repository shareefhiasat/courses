/**
 * @swagger
 * /api/v1/penalties:
 *   get:
 *     summary: Get all penalties
 *     description: Retrieve a list of penalties (supports optional filtering)
 *     tags: [Penalties]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single penalty by ID
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
 *         description: Filter by penalty type
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
 *         description: Penalties retrieved successfully
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
 *                     $ref: '#/components/schemas/Penalty'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new penalty
 *     description: Create a new penalty record
 *     tags: [Penalties]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PenaltyInput'
 *     responses:
 *       201:
 *         description: Penalty created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a penalty
 *     description: Update an existing penalty record
 *     tags: [Penalties]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Penalty ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PenaltyInput'
 *     responses:
 *       200:
 *         description: Penalty updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Penalty not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a penalty
 *     description: Delete a penalty by ID
 *     tags: [Penalties]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Penalty ID
 *     responses:
 *       200:
 *         description: Penalty deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const penaltyDbService = require('@services/db/penaltyDbService.cjs');

const {
  getPenalties,
  getPenaltyById,
  create: createPenalty,
  update: updatePenalty,
  deletePenalty
} = penaltyDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'PenaltiesAPI',
    method,
    url: `/api/${API_VERSION}/penalties`,
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
    const { id, studentId, classId, instructorId, type, severity, status } = req.query;

    if (id) {
      const result = await getPenaltyById(id);
      return res.status(200).json(result);
    }

    const result = await getPenalties({
      studentId,
      classId,
      instructorId,
      type,
      severity,
      status
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'PenaltiesAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const penaltyData = req.body;

    if (!penaltyData.studentId || !penaltyData.type || !penaltyData.description) {
      return res.status(400).json({
        success: false,
        error: 'studentId, type, and description are required'
      });
    }

    const result = await createPenalty(penaltyData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'PenaltiesAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Penalty ID is required' });

    const result = await updatePenalty(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'PenaltiesAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Penalty ID is required' });

    const result = await deletePenalty(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'PenaltiesAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
