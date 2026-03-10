/**
 * @swagger
 * /api/v1/participations:
 *   get:
 *     summary: Get all participations
 *     description: Retrieve a list of participation records (supports optional filtering)
 *     tags: [Participations]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single participation by ID
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *       - in: query
 *         name: activityId
 *         schema:
 *           type: string
 *         description: Filter by activity ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by participation type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Participations retrieved successfully
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
 *                     $ref: '#/components/schemas/Participation'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new participation record
 *     description: Create a new participation record
 *     tags: [Participations]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParticipationInput'
 *     responses:
 *       201:
 *         description: Participation created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a participation record
 *     description: Update an existing participation record
 *     tags: [Participations]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Participation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParticipationInput'
 *     responses:
 *       200:
 *         description: Participation updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Participation not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a participation record
 *     description: Delete a participation record by ID
 *     tags: [Participations]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Participation ID
 *     responses:
 *       200:
 *         description: Participation deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const participationDbService = require('@services/db/participationDbService.cjs');

const {
  getParticipations,
  getParticipationById,
  create: createParticipation,
  update: updateParticipation,
  deleteParticipation
} = participationDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'ParticipationsAPI',
    method,
    url: `/api/${API_VERSION}/participations`,
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
    const { id, studentId, activityId, classId, type, status } = req.query;

    if (id) {
      const result = await getParticipationById(id);
      return res.status(200).json(result);
    }

    const result = await getParticipations({
      studentId,
      activityId,
      classId,
      type,
      status
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'ParticipationsAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const participationData = req.body;

    if (!participationData.studentId || !participationData.activityId || !participationData.classId) {
      return res.status(400).json({
        success: false,
        error: 'studentId, activityId, and classId are required'
      });
    }

    const result = await createParticipation(participationData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'ParticipationsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Participation ID is required' });

    const result = await updateParticipation(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'ParticipationsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Participation ID is required' });

    const result = await deleteParticipation(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'ParticipationsAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
