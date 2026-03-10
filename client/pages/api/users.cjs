/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of users (supports optional filtering)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single user by ID
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Get a single user by email
 *       - in: query
 *         name: isAdmin
 *         schema:
 *           type: boolean
 *         description: Filter by admin flag
 *       - in: query
 *         name: isInstructor
 *         schema:
 *           type: boolean
 *         description: Filter by instructor flag
 *       - in: query
 *         name: isStudent
 *         schema:
 *           type: boolean
 *         description: Filter by student flag
 *       - in: query
 *         name: isHR
 *         schema:
 *           type: boolean
 *         description: Filter by HR flag
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (active/disabled/etc)
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new user
 *     description: Create a new user record
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a user
 *     description: Update an existing user record
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a user
 *     description: Delete a user by ID
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const userDbService = require('@services/db/userDbService.cjs');

const {
  getUsers,
  getUserById,
  getUserByEmail,
  create: createUser,
  update: updateUser,
  deleteUser
} = userDbService;

const parseBoolean = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
};

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'UsersAPI',
    method,
    url: `/api/${API_VERSION}/users`,
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
    const { id, email, isAdmin, isInstructor, isStudent, isHR, status } = req.query;

    if (id) {
      const result = await getUserById(id);
      return res.status(200).json(result);
    }

    if (email) {
      const result = await getUserByEmail(email);
      return res.status(200).json(result);
    }

    const result = await getUsers({
      isAdmin: parseBoolean(isAdmin),
      isInstructor: parseBoolean(isInstructor),
      isStudent: parseBoolean(isStudent),
      isHR: parseBoolean(isHR),
      status
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'UsersAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const userData = req.body;

    if (!userData.email || !userData.displayName) {
      return res.status(400).json({ success: false, error: 'email and displayName are required' });
    }

    const result = await createUser(userData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'UsersAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'User ID is required' });

    const result = await updateUser(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'UsersAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'User ID is required' });

    const result = await deleteUser(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'UsersAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
