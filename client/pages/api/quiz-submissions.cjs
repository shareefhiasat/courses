/**
 * @swagger
 * /api/v1/quiz-submissions:
 *   get:
 *     summary: Get all quiz submissions
 *     description: Retrieve a list of quiz submissions (supports optional filtering)
 *     tags: [Quiz Submissions]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single quiz submission by ID
 *       - in: query
 *         name: quizResultId
 *         schema:
 *           type: string
 *         description: Filter by quiz result ID
 *       - in: query
 *         name: questionId
 *         schema:
 *           type: string
 *         description: Filter by question ID
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *       - in: query
 *         name: isCorrect
 *         schema:
 *           type: boolean
 *         description: Filter by correctness
 *     responses:
 *       200:
 *         description: Quiz submissions retrieved successfully
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
 *                     $ref: '#/components/schemas/QuizSubmission'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new quiz submission
 *     description: Create a new quiz submission record
 *     tags: [Quiz Submissions]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuizSubmissionInput'
 *     responses:
 *       201:
 *         description: Quiz submission created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a quiz submission
 *     description: Update an existing quiz submission record
 *     tags: [Quiz Submissions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuizSubmissionInput'
 *     responses:
 *       200:
 *         description: Quiz submission updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Quiz submission not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a quiz submission
 *     description: Delete a quiz submission by ID
 *     tags: [Quiz Submissions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz submission ID
 *     responses:
 *       200:
 *         description: Quiz submission deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const quizSubmissionsDbService = require('@services/db/quizSubmissionsDbService.cjs');

const {
  getQuizSubmissions,
  getQuizSubmissionById,
  create: createQuizSubmission,
  update: updateQuizSubmission,
  deleteQuizSubmission
} = quizSubmissionsDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'QuizSubmissionsAPI',
    method,
    url: `/api/${API_VERSION}/quiz-submissions`,
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
    const { id, quizResultId, questionId, studentId, isCorrect } = req.query;

    if (id) {
      const result = await getQuizSubmissionById(id);
      return res.status(200).json(result);
    }

    const result = await getQuizSubmissions({
      quizResultId,
      questionId,
      studentId,
      isCorrect: isCorrect !== undefined ? isCorrect === 'true' : undefined
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'QuizSubmissionsAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const quizSubmissionData = req.body;

    if (!quizSubmissionData.quizResultId || !quizSubmissionData.questionId || !quizSubmissionData.studentId) {
      return res.status(400).json({
        success: false,
        error: 'quizResultId, questionId, and studentId are required'
      });
    }

    const result = await createQuizSubmission(quizSubmissionData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'QuizSubmissionsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Quiz submission ID is required' });

    const result = await updateQuizSubmission(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'QuizSubmissionsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Quiz submission ID is required' });

    const result = await deleteQuizSubmission(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'QuizSubmissionsAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
