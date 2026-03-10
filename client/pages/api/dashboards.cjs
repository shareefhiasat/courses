/**
 * @swagger
 * /api/v1/dashboards:
 *   get:
 *     summary: Get all dashboards
 *     description: Retrieve a list of dashboards (supports optional filtering)
 *     tags: [Dashboards]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single dashboard by ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *         description: Filter by default status
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: default
 *         schema:
 *           type: boolean
 *         description: Get user default dashboard instead of all dashboards (requires userId)
 *     responses:
 *       200:
 *         description: Dashboards retrieved successfully
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
 *                     $ref: '#/components/schemas/Dashboard'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new dashboard
 *     description: Create a new dashboard record
 *     tags: [Dashboards]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DashboardInput'
 *     responses:
 *       201:
 *         description: Dashboard created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a dashboard
 *     description: Update an existing dashboard record
 *     tags: [Dashboards]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dashboard ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DashboardInput'
 *     responses:
 *       200:
 *         description: Dashboard updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Dashboard not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a dashboard
 *     description: Delete a dashboard by ID
 *     tags: [Dashboards]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dashboard ID
 *     responses:
 *       200:
 *         description: Dashboard deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   patch:
 *     summary: Set dashboard as default
 *     description: Set a dashboard as the user's default dashboard
 *     tags: [Dashboards]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dashboard ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *     responses:
 *       200:
 *         description: Dashboard set as default successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const dashboardDbService = require('@services/db/dashboardDbService.cjs');

const {
  getDashboards,
  getDashboardById,
  create: createDashboard,
  update: updateDashboard,
  deleteDashboard,
  getUserDefault,
  setAsDefault
} = dashboardDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'DashboardsAPI',
    method,
    url: `/api/${API_VERSION}/dashboards`,
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
    const { id, userId, isDefault, isActive, default: getDefault } = req.query;

    if (id) {
      const result = await getDashboardById(id);
      return res.status(200).json(result);
    }

    if (getDefault === 'true' && userId) {
      const result = await getUserDefault(userId);
      return res.status(200).json(result);
    }

    const result = await getDashboards({
      userId,
      isDefault: isDefault !== undefined ? isDefault === 'true' : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'DashboardsAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const dashboardData = req.body;

    if (!dashboardData.userId || !dashboardData.name || !dashboardData.layout || !dashboardData.widgets) {
      return res.status(400).json({
        success: false,
        error: 'userId, name, layout, and widgets are required'
      });
    }

    const result = await createDashboard(dashboardData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'DashboardsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Dashboard ID is required' });

    const result = await updateDashboard(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'DashboardsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Dashboard ID is required' });

    const result = await deleteDashboard(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'DashboardsAPI',
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
    const { userId } = req.body;

    if (!id) return res.status(400).json({ success: false, error: 'Dashboard ID is required' });
    if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });

    const result = await setAsDefault(id, userId);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PATCH handler', {
      service: 'DashboardsAPI',
      operation: 'handlePatch',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
