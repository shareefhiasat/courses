/**
 * @swagger
 * /api/v1/question-bank:
 *   get:
 *     summary: Get all question bank items
 *     description: Retrieve a list of question bank items (supports optional filtering)
 *     tags: [Question Bank]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single question bank item by ID
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *         description: Filter by creator ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by question type
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *         description: Filter by difficulty level
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query (searches title, question, description)
 *       - in: query
 *         name: stats
 *         schema:
 *           type: boolean
 *         description: Get statistics instead of items
 *     responses:
 *       200:
 *         description: Question bank items retrieved successfully
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
 *                     $ref: '#/components/schemas/QuestionBank'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new question bank item
 *     description: Create a new question bank record
 *     tags: [Question Bank]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionBankInput'
 *     responses:
 *       201:
 *         description: Question bank item created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a question bank item
 *     description: Update an existing question bank record
 *     tags: [Question Bank]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question bank item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionBankInput'
 *     responses:
 *       200:
 *         description: Question bank item updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Question bank item not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a question bank item
 *     description: Delete a question bank item by ID
 *     tags: [Question Bank]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question bank item ID
 *     responses:
 *       200:
 *         description: Question bank item deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const questionBankDbService = require('@services/db/questionBankDbService.cjs');

const {
  getQuestionBanks,
  getQuestionBankById,
  create: createQuestionBank,
  update: updateQuestionBank,
  deleteQuestionBank,
  searchQuestions,
  getStats
} = questionBankDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'QuestionBankAPI',
    method,
    url: `/api/${API_VERSION}/question-bank`,
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
    const { id, createdBy, category, type, difficulty, isActive, search, stats } = req.query;

    if (id) {
      const result = await getQuestionBankById(id);
      return res.status(200).json(result);
    }

    if (stats === 'true') {
      const result = await getStats(createdBy);
      return res.status(200).json(result);
    }

    if (search) {
      const result = await searchQuestions({
        query: search,
        category,
        type,
        difficulty,
        createdBy
      });
      return res.status(200).json(result);
    }

    const result = await getQuestionBanks({
      createdBy,
      category,
      type,
      difficulty,
      isActive: isActive !== undefined ? isActive === 'true' : undefined
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'QuestionBankAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const questionBankData = req.body;

    if (!questionBankData.title || !questionBankData.question || !questionBankData.correctAnswer || !questionBankData.createdBy) {
      return res.status(400).json({
        success: false,
        error: 'title, question, correctAnswer, and createdBy are required'
      });
    }

    const result = await createQuestionBank(questionBankData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'QuestionBankAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Question bank item ID is required' });

    const result = await updateQuestionBank(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'QuestionBankAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Question bank item ID is required' });

    const result = await deleteQuestionBank(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'QuestionBankAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
