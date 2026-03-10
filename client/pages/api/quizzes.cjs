/**
 * @swagger
 * /api/v1/quizzes:
 *   get:
 *     summary: Get all quizzes
 *     description: Retrieve a list of quizzes (supports optional filtering)
 *     tags: [Quizzes]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single quiz by ID
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
 *         description: Filter by quiz type
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *         description: Filter by published status
 *       - in: query
 *         name: stats
 *         schema:
 *           type: boolean
 *         description: Get quiz statistics instead of quiz (requires id)
 *     responses:
 *       200:
 *         description: Quizzes retrieved successfully
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
 *                     $ref: '#/components/schemas/Quiz'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new quiz
 *     description: Create a new quiz record
 *     tags: [Quizzes]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuizInput'
 *     responses:
 *       201:
 *         description: Quiz created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a quiz
 *     description: Update an existing quiz record
 *     tags: [Quizzes]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuizInput'
 *     responses:
 *       200:
 *         description: Quiz updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a quiz
 *     description: Delete a quiz by ID
 *     tags: [Quizzes]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   patch:
 *     summary: Publish a quiz
 *     description: Publish a quiz to make it available to students
 *     tags: [Quizzes]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Quiz published successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const quizzesDbService = require('@services/db/quizzesDbService.cjs');

const {
  getQuizzes,
  getQuizById,
  create: createQuiz,
  update: updateQuiz,
  deleteQuiz,
  publishQuiz,
  getQuizStats
} = quizzesDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'QuizzesAPI',
    method,
    url: `/api/${API_VERSION}/quizzes`,
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
    const { id, classId, instructorId, type, isPublished, stats } = req.query;

    if (id) {
      if (stats === 'true') {
        const result = await getQuizStats(id);
        return res.status(200).json(result);
      } else {
        const result = await getQuizById(id);
        return res.status(200).json(result);
      }
    }

    const result = await getQuizzes({
      classId,
      instructorId,
      type,
      isPublished: isPublished !== undefined ? isPublished === 'true' : undefined
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'QuizzesAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const quizData = req.body;

    if (!quizData.title || !quizData.classId || !quizData.instructorId || !quizData.maxScore || !quizData.passingScore) {
      return res.status(400).json({
        success: false,
        error: 'title, classId, instructorId, maxScore, and passingScore are required'
      });
    }

    const result = await createQuiz(quizData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'QuizzesAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Quiz ID is required' });

    const result = await updateQuiz(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'QuizzesAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Quiz ID is required' });

    const result = await deleteQuiz(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'QuizzesAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Quiz ID is required' });

    const result = await publishQuiz(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PATCH handler', {
      service: 'QuizzesAPI',
      operation: 'handlePatch',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
