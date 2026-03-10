/**
 * @swagger
 * /api/v1/resources:
 *   get:
 *     summary: Get all resources
 *     description: Retrieve a list of resources (supports optional filtering)
 *     tags: [Resources]
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *         description: Filter by subject ID
 *       - in: query
 *         name: programId
 *         schema:
 *           type: string
 *         description: Filter by program ID
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *     responses:
 *       200:
 *         description: List of resources retrieved successfully
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
 *                     $ref: '#/components/schemas/Resource'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new resource
 *     description: Create a new resource with the provided data
 *     tags: [Resources]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResourceInput'
 *     responses:
 *       201:
 *         description: Resource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
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
 * /api/v1/resources/{id}:
 *   get:
 *     summary: Get resource by ID
 *     description: Retrieve a specific resource by its ID
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       404:
 *         description: Resource not found
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
 *     summary: Update a resource
 *     description: Update an existing resource with new data
 *     tags: [Resources]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResourceInput'
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a resource
 *     description: Delete a resource by its ID
 *     tags: [Resources]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource deleted successfully
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const resourceDbService = require('@services/db/resourceDbService.cjs');

const {
  getResources,
  getResourceById,
  create: createResource,
  update: updateResource,
  deleteResource
} = resourceDbService;

function handler(req, res) {
  const { method } = req;
  const startTime = Date.now();

  logger.info('API request received', {
    service: 'ResourcesAPI',
    method,
    url: `/api/${API_VERSION}/resources`,
    query: req.query,
    body: req.body,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  });

  console.log(`[API Route] 📨 ${method} /api/${API_VERSION}/resources - Query:`, req.query, 'Body:', req.body);

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
        service: 'ResourcesAPI',
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
    const { id, classId, subjectId, programId, categoryId, type } = req.query;

    if (id) {
      const result = await getResourceById(id);
      return res.status(200).json(result);
    }

    const result = await getResources({ classId, subjectId, programId, categoryId, type });
    return res.status(200).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in GET handler', {
      service: 'ResourcesAPI',
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
    const resourceData = req.body;

    if (!resourceData.titleEn || !resourceData.type) {
      return res.status(400).json({
        success: false,
        error: 'titleEn and type are required'
      });
    }

    const result = await createResource(resourceData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in POST handler', {
      service: 'ResourcesAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Resource ID is required' });

    const result = await updateResource(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in PUT handler', {
      service: 'ResourcesAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Resource ID is required' });

    const result = await deleteResource(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in DELETE handler', {
      service: 'ResourcesAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
