/**
 * @swagger
 * /api/v1/announcements:
 *   get:
 *     summary: Get all announcements
 *     description: Retrieve a list of all announcements in the system
 *     tags: [Announcements]
 *     responses:
 *       200:
 *         description: List of announcements retrieved successfully
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
 *                     $ref: '#/components/schemas/Announcement'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new announcement
 *     description: Create a new announcement with the provided data
 *     tags: [Announcements]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnnouncementInput'
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Announcement'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/announcements/{id}:
 *   get:
 *     summary: Get announcement by ID
 *     description: Retrieve a specific announcement by its ID
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Announcement'
 *       404:
 *         description: Announcement not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   put:
 *     summary: Update an announcement
 *     description: Update an existing announcement with new data
 *     tags: [Announcements]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Announcement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnnouncementInput'
 *     responses:
 *       200:
 *         description: Announcement updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Announcement'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Announcement not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     summary: Delete an announcement
 *     description: Delete an announcement by its ID
 *     tags: [Announcements]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Announcement deleted successfully"
 *       404:
 *         description: Announcement not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const announcementDbService = require('@services/db/announcementDbService.cjs');

const {
  getAnnouncements,
  getAnnouncementById,
  create: createAnnouncement,
  update: updateAnnouncement,
  deleteAnnouncement
} = announcementDbService;

function handler(req, res) {
  const { method } = req;
  const startTime = Date.now();

  logger.info('API request received', {
    service: 'AnnouncementsAPI',
    method,
    url: `/api/${API_VERSION}/announcements`,
    query: req.query,
    body: req.body,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  });

  console.log(`[API Route] 📨 ${method} /api/${API_VERSION}/announcements - Query:`, req.query, 'Body:', req.body);

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
      const duration = Date.now() - startTime;
      logger.warn('Method not allowed', {
        service: 'AnnouncementsAPI',
        method,
        duration: `${duration}ms`
      });
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
  }
}

async function handleGet(req, res) {
  const startTime = Date.now();
  try {
    const { id } = req.query;

    logger.info('GET announcements request', {
      service: 'AnnouncementsAPI',
      operation: 'handleGet',
      announcementId: id || 'all'
    });

    if (id) {
      const result = await getAnnouncementById(id);
      return res.status(200).json(result);
    }

    const result = await getAnnouncements();
    return res.status(200).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in GET handler', {
      service: 'AnnouncementsAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  const startTime = Date.now();
  try {
    const announcementData = req.body;

    logger.info('POST announcement request', {
      service: 'AnnouncementsAPI',
      operation: 'handlePost',
      data: announcementData
    });

    if (!announcementData.title || !announcementData.content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    const result = await createAnnouncement(announcementData);
    if (result.success) {
      return res.status(201).json(result);
    }

    return res.status(400).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in POST handler', {
      service: 'AnnouncementsAPI',
      operation: 'handlePost',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePut(req, res) {
  const startTime = Date.now();
  try {
    const { id } = req.query;
    const updateData = req.body;

    logger.info('PUT announcement request', {
      service: 'AnnouncementsAPI',
      operation: 'handlePut',
      announcementId: id,
      data: updateData
    });

    if (!id) {
      return res.status(400).json({ success: false, error: 'Announcement ID is required' });
    }

    const result = await updateAnnouncement(id, updateData);
    if (result.success) {
      return res.status(200).json(result);
    }

    return res.status(400).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in PUT handler', {
      service: 'AnnouncementsAPI',
      operation: 'handlePut',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handleDelete(req, res) {
  const startTime = Date.now();
  try {
    const { id } = req.query;

    logger.info('DELETE announcement request', {
      service: 'AnnouncementsAPI',
      operation: 'handleDelete',
      announcementId: id
    });

    if (!id) {
      return res.status(400).json({ success: false, error: 'Announcement ID is required' });
    }

    const result = await deleteAnnouncement(id);
    if (result.success) {
      return res.status(200).json(result);
    }

    return res.status(400).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in DELETE handler', {
      service: 'AnnouncementsAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
