/**
 * @swagger
 * /api/v1/quiz-results:
 *   get:
 *     summary: Get all quiz results
 *     description: Retrieve a list of quiz results (supports optional filtering)
 *     tags: [Quiz Results]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single quiz result by ID
 *       - in: query
 *         name: quizId
 *         schema:
 *           type: string
 *         description: Filter by quiz ID
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
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Quiz results retrieved successfully
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
 *                     $ref: '#/components/schemas/QuizResult'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new quiz result
 *     description: Create a new quiz result record
 *     tags: [Quiz Results]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuizResultInput'
 *     responses:
 *       201:
 *         description: Quiz result created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a quiz result
 *     description: Update an existing quiz result record
 *     tags: [Quiz Results]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz result ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuizResultInput'
 *     responses:
 *       200:
 *         description: Quiz result updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Quiz result not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a quiz result
 *     description: Delete a quiz result by ID
 *     tags: [Quiz Results]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz result ID
 *     responses:
 *       200:
 *         description: Quiz result deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const quizResultsDbService = require('@services/db/quizResultsDbService.cjs');

const {
  getQuizResults,
  getQuizResultById,
  create: createQuizResult,
  update: updateQuizResult,
  deleteQuizResult
} = quizResultsDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'QuizResultsAPI',
    method,
    url: `/api/${API_VERSION}/quiz-results`,
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
    const { id, quizId, studentId, classId, status } = req.query;

    if (id) {
      const result = await getQuizResultById(id);
      return res.status(200).json(result);
    }

    const result = await getQuizResults({
      quizId,
      studentId,
      classId,
      status
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'QuizResultsAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const quizResultData = req.body;

    if (!quizResultData.quizId || !quizResultData.studentId || !quizResultData.classId) {
      return res.status(400).json({
        success: false,
        error: 'quizId, studentId, and classId are required'
      });
    }

    const result = await createQuizResult(quizResultData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'QuizResultsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Quiz result ID is required' });

    const result = await updateQuizResult(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'QuizResultsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Quiz result ID is required' });

    const result = await deleteQuizResult(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'QuizResultsAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
