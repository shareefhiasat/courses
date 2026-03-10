/**
 * @swagger
 * /api/v1/subject-enrollments:
 *   get:
 *     summary: Get all subject enrollments
 *     description: Retrieve a list of subject enrollments (supports optional filtering)
 *     tags: [Subject Enrollments]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single subject enrollment by ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *         description: Filter by subject ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by enrollment status
 *       - in: query
 *         name: userEnrollments
 *         schema:
 *           type: boolean
 *         description: Get user's subject enrollments (requires userId)
 *       - in: query
 *         name: stats
 *         schema:
 *           type: boolean
 *         description: Get subject statistics instead of enrollments (requires subjectId)
 *     responses:
 *       200:
 *         description: Subject enrollments retrieved successfully
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
 *                     $ref: '#/components/schemas/SubjectEnrollment'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new subject enrollment
 *     description: Create a new subject enrollment record
 *     tags: [Subject Enrollments]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubjectEnrollmentInput'
 *     responses:
 *       201:
 *         description: Subject enrollment created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a subject enrollment
 *     description: Update an existing subject enrollment record
 *     tags: [Subject Enrollments]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject enrollment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubjectEnrollmentInput'
 *     responses:
 *       200:
 *         description: Subject enrollment updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Subject enrollment not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a subject enrollment
 *     description: Delete a subject enrollment by ID
 *     tags: [Subject Enrollments]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject enrollment ID
 *     responses:
 *       200:
 *         description: Subject enrollment deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const subjectEnrollmentsDbService = require('@services/db/subjectEnrollmentsDbService.cjs');

const {
  getSubjectEnrollments,
  getSubjectEnrollmentById,
  create: createSubjectEnrollment,
  update: updateSubjectEnrollment,
  deleteSubjectEnrollment,
  getUserEnrollments,
  getSubjectStats
} = subjectEnrollmentsDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'SubjectEnrollmentsAPI',
    method,
    url: `/api/${API_VERSION}/subject-enrollments`,
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
    const { id, userId, subjectId, status, userEnrollments, stats } = req.query;

    if (id) {
      const result = await getSubjectEnrollmentById(id);
      return res.status(200).json(result);
    }

    if (userEnrollments === 'true' && userId) {
      const result = await getUserEnrollments(userId);
      return res.status(200).json(result);
    }

    if (stats === 'true' && subjectId) {
      const result = await getSubjectStats(subjectId);
      return res.status(200).json(result);
    }

    const result = await getSubjectEnrollments({
      userId,
      subjectId,
      status
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'SubjectEnrollmentsAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const subjectEnrollmentData = req.body;

    if (!subjectEnrollmentData.userId || !subjectEnrollmentData.subjectId) {
      return res.status(400).json({
        success: false,
        error: 'userId and subjectId are required'
      });
    }

    const result = await createSubjectEnrollment(subjectEnrollmentData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'SubjectEnrollmentsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Subject enrollment ID is required' });

    const result = await updateSubjectEnrollment(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'SubjectEnrollmentsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Subject enrollment ID is required' });

    const result = await deleteSubjectEnrollment(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'SubjectEnrollmentsAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
