/**
 * @swagger
 * /api/v1/enrollments:
 *   get:
 *     summary: Get all enrollments
 *     description: Retrieve a list of enrollments (supports optional filtering)
 *     tags: [Enrollments]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single enrollment by ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by enrollment status
 *       - in: query
 *         name: stats
 *         schema:
 *           type: boolean
 *         description: Get class statistics instead of enrollments (requires classId)
 *     responses:
 *       200:
 *         description: Enrollments retrieved successfully
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
 *                     $ref: '#/components/schemas/Enrollment'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new enrollment
 *     description: Create a new enrollment record
 *     tags: [Enrollments]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EnrollmentInput'
 *     responses:
 *       201:
 *         description: Enrollment created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update an enrollment
 *     description: Update an existing enrollment record
 *     tags: [Enrollments]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EnrollmentInput'
 *     responses:
 *       200:
 *         description: Enrollment updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Enrollment not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete an enrollment
 *     description: Delete an enrollment by ID
 *     tags: [Enrollments]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   patch:
 *     summary: Approve or reject enrollment
 *     description: Approve or reject an enrollment
 *     tags: [Enrollments]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - approvedBy
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Action to perform
 *               approvedBy:
 *                 type: string
 *                 description: Approver user ID
 *               notes:
 *                 type: string
 *                 description: Notes for rejection
 *     responses:
 *       200:
 *         description: Enrollment action completed successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const enrollmentDbService = require('@services/db/enrollmentDbService.cjs');

const {
  getEnrollments,
  getEnrollmentById,
  create: createEnrollment,
  update: updateEnrollment,
  deleteEnrollment,
  approveEnrollment,
  rejectEnrollment,
  getClassStats
} = enrollmentDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'EnrollmentsAPI',
    method,
    url: `/api/${API_VERSION}/enrollments`,
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
    case 'PATCH':
      return handlePatch(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
      return res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
  }
}

async function handleGet(req, res) {
  try {
    const { id, userId, classId, status, stats } = req.query;

    if (id) {
      const result = await getEnrollmentById(id);
      return res.status(200).json(result);
    }

    if (stats === 'true' && classId) {
      const result = await getClassStats(classId);
      return res.status(200).json(result);
    }

    const result = await getEnrollments({
      userId,
      classId,
      status
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'EnrollmentsAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const enrollmentData = req.body;

    if (!enrollmentData.userId || !enrollmentData.classId) {
      return res.status(400).json({
        success: false,
        error: 'userId and classId are required'
      });
    }

    const result = await createEnrollment(enrollmentData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'EnrollmentsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Enrollment ID is required' });

    const result = await updateEnrollment(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'EnrollmentsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Enrollment ID is required' });

    const result = await deleteEnrollment(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'EnrollmentsAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePatch(req, res) {
  try {
    const { id } = req.query;
    const { action, approvedBy, notes } = req.body;

    if (!id) return res.status(400).json({ success: false, error: 'Enrollment ID is required' });
    if (!action || !approvedBy) return res.status(400).json({ success: false, error: 'action and approvedBy are required' });

    let result;
    if (action === 'approve') {
      result = await approveEnrollment(id, approvedBy);
    } else if (action === 'reject') {
      result = await rejectEnrollment(id, approvedBy, notes);
    } else {
      return res.status(400).json({ success: false, error: 'action must be approve or reject' });
    }

    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PATCH handler', {
      service: 'EnrollmentsAPI',
      operation: 'handlePatch',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
