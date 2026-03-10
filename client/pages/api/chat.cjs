/**
 * @swagger
 * /api/v1/chat:
 *   get:
 *     summary: Get all chat messages
 *     description: Retrieve a list of chat messages (supports optional filtering)
 *     tags: [Chat]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single chat message by ID
 *       - in: query
 *         name: senderId
 *         schema:
 *           type: string
 *         description: Filter by sender ID
 *       - in: query
 *         name: receiverId
 *         schema:
 *           type: string
 *         description: Filter by receiver ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by message type
 *       - in: query
 *         name: conversation
 *         schema:
 *           type: boolean
 *         description: Get conversation between two users (requires senderId and receiverId)
 *       - in: query
 *         name: stats
 *         schema:
 *           type: boolean
 *         description: Get user statistics instead of messages (requires senderId)
 *     responses:
 *       200:
 *         description: Chat messages retrieved successfully
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
 *                     $ref: '#/components/schemas/Chat'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new chat message
 *     description: Create a new chat message record
 *     tags: [Chat]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatInput'
 *     responses:
 *       201:
 *         description: Chat message created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a chat message
 *     description: Update an existing chat message record
 *     tags: [Chat]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatInput'
 *     responses:
 *       200:
 *         description: Chat message updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Chat message not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a chat message
 *     description: Delete a chat message by ID
 *     tags: [Chat]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat message ID
 *     responses:
 *       200:
 *         description: Chat message deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const chatDbService = require('@services/db/chatDbService.cjs');

const {
  getChats,
  getChatById,
  create: createChat,
  update: updateChat,
  deleteChat,
  getConversation,
  getUserStats
} = chatDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'ChatAPI',
    method,
    url: `/api/${API_VERSION}/chat`,
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
    const { id, senderId, receiverId, classId, type, conversation, stats } = req.query;

    if (id) {
      const result = await getChatById(id);
      return res.status(200).json(result);
    }

    if (conversation === 'true' && senderId && receiverId) {
      const result = await getConversation(senderId, receiverId, req.query);
      return res.status(200).json(result);
    }

    if (stats === 'true' && senderId) {
      const result = await getUserStats(senderId);
      return res.status(200).json(result);
    }

    const result = await getChats({
      senderId,
      receiverId,
      classId,
      type
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'ChatAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const chatData = req.body;

    if (!chatData.senderId || !chatData.receiverId || !chatData.message) {
      return res.status(400).json({
        success: false,
        error: 'senderId, receiverId, and message are required'
      });
    }

    const result = await createChat(chatData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'ChatAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Chat message ID is required' });

    const result = await updateChat(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'ChatAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Chat message ID is required' });

    const result = await deleteChat(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'ChatAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
