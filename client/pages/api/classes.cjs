/**
 * @swagger
 * /api/v1/classes:
 *   get:
 *     summary: Get all classes
 *     description: Retrieve a list of all classes in the system
 *     tags: [Classes]
 *     responses:
 *       200:
 *         description: List of classes retrieved successfully
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
 *                     $ref: '#/components/schemas/Class'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new class
 *     description: Create a new class with the provided data
 *     tags: [Classes]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassInput'
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
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
 * /api/v1/classes/{id}:
 *   get:
 *     summary: Get class by ID
 *     description: Retrieve a specific class by its ID
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         description: Class not found
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
 *     summary: Update a class
 *     description: Update an existing class with new data
 *     tags: [Classes]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassInput'
 *     responses:
 *       200:
 *         description: Class updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Class not found
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
 *     summary: Delete a class
 *     description: Delete a class by its ID
 *     tags: [Classes]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class deleted successfully
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
 *                   example: "Class deleted successfully"
 *       404:
 *         description: Class not found
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

/**
 * Classes API Route
 * Handles all class operations for the frontend
 * Uses MongoDB/Prisma on the server side
 * CommonJS version for Node.js compatibility
 */

const { getApiUrl, API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger, logSecurityEvent } = require('@services/utils/logger');
const classDbService = require('@services/db/classDbService.cjs');

const {
  getClasses,
  getClassById,
  create: createClass,
  update: updateClass,
  deleteClass: deleteClass
} = classDbService;

function handler(req, res) {
  const { method } = req;
  const startTime = Date.now();
  
  logger.info('API request received', {
    service: 'ClassesAPI',
    method,
    url: `/api/${API_VERSION}/classes`,
    query: req.query,
    body: req.body,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  });
  
  console.log(`[API Route] 📨 ${method} /api/${API_VERSION}/classes - Query:`, req.query, 'Body:', req.body);

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
        service: 'ClassesAPI',
        method,
        duration: `${duration}ms`
      });
      console.log(`[API Route] ❌ Method not allowed: ${method}`);
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
  }
}

async function handleGet(req, res) {
  const startTime = Date.now();
  try {
    const { id } = req.query;
    logger.info('GET classes request', {
      service: 'ClassesAPI',
      operation: 'handleGet',
      classId: id || 'all'
    });
    
    console.log(`[API Route] 📥 GET handler - ID: ${id || 'all'}`);
    
    if (id) {
      console.log(`[API Route] Fetching class by ID: ${id}`);
      const result = await getClassById(id);
      const duration = Date.now() - startTime;
      
      logger.info('Class retrieved successfully', {
        service: 'ClassesAPI',
        operation: 'handleGet',
        classId: id,
        success: result.success,
        duration: `${duration}ms`
      });
      
      console.log(`[API Route] ✅ GET result:`, result);
      return res.status(200).json(result);
    } else {
      console.log('[API Route] Fetching all classes');
      const result = await getClasses();
      const duration = Date.now() - startTime;
      
      logger.info('Classes retrieved successfully', {
        service: 'ClassesAPI',
        operation: 'handleGet',
        count: result.data?.length || 0,
        success: result.success,
        duration: `${duration}ms`
      });
      
      console.log(`[API Route] ✅ GET result: ${result.data?.length || 0} classes`);
      return res.status(200).json(result);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in GET handler', {
      service: 'ClassesAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[API Route] ❌ Error in GET handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  const startTime = Date.now();
  try {
    const classData = req.body;
    logger.info('POST class request', {
      service: 'ClassesAPI',
      operation: 'handlePost',
      data: classData
    });
    
    console.log('[API Route] 📝 POST handler - Creating class:', classData.nameEn || 'unnamed');
    
    if (!classData.nameEn || !classData.code || !classData.subjectId || !classData.programId) {
      const duration = Date.now() - startTime;
      logger.warn('Missing required fields', {
        service: 'ClassesAPI',
        operation: 'handlePost',
        duration: `${duration}ms`
      });
      return res.status(400).json({ 
        success: false, 
        error: 'Name (nameEn), code, subjectId, and programId are required' 
      });
    }
    
    const result = await createClass(classData);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info('Class created successfully', {
        service: 'ClassesAPI',
        operation: 'handlePost',
        classId: result.data.id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ POST result:', result);
      return res.status(201).json(result);
    } else {
      logger.error('Failed to create class', {
        service: 'ClassesAPI',
        operation: 'handlePost',
        error: result.error,
        duration: `${duration}ms`
      });
      console.log('[API Route] ❌ POST result:', result);
      return res.status(400).json(result);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in POST handler', {
      service: 'ClassesAPI',
      operation: 'handlePost',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[API Route] ❌ Error in POST handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePut(req, res) {
  const startTime = Date.now();
  try {
    const { id } = req.query;
    const updateData = req.body;
    
    logger.info('PUT class request', {
      service: 'ClassesAPI',
      operation: 'handlePut',
      classId: id,
      data: updateData
    });
    
    console.log(`[API Route] 🔄 PUT handler - Updating class: ${id}`);
    
    if (!id) {
      const duration = Date.now() - startTime;
      logger.warn('Missing class ID', {
        service: 'ClassesAPI',
        operation: 'handlePut',
        duration: `${duration}ms`
      });
      return res.status(400).json({ success: false, error: 'Class ID is required' });
    }
    
    const result = await updateClass(id, updateData);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info('Class updated successfully', {
        service: 'ClassesAPI',
        operation: 'handlePut',
        classId: id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ PUT result:', result);
      return res.status(200).json(result);
    } else {
      logger.error('Failed to update class', {
        service: 'ClassesAPI',
        operation: 'handlePut',
        classId: id,
        error: result.error,
        duration: `${duration}ms`
      });
      console.log('[API Route] ❌ PUT result:', result);
      return res.status(400).json(result);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in PUT handler', {
      service: 'ClassesAPI',
      operation: 'handlePut',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[API Route] ❌ Error in PUT handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handleDelete(req, res) {
  const startTime = Date.now();
  try {
    const { id } = req.query;
    
    logger.info('DELETE class request', {
      service: 'ClassesAPI',
      operation: 'handleDelete',
      classId: id
    });
    
    console.log(`[API Route] 🗑️ DELETE handler - Deleting class: ${id}`);
    
    if (!id) {
      const duration = Date.now() - startTime;
      logger.warn('Missing class ID', {
        service: 'ClassesAPI',
        operation: 'handleDelete',
        duration: `${duration}ms`
      });
      return res.status(400).json({ success: false, error: 'Class ID is required' });
    }
    
    const result = await deleteClass(id);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info('Class deleted successfully', {
        service: 'ClassesAPI',
        operation: 'handleDelete',
        classId: id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ DELETE result:', result);
      return res.status(200).json(result);
    } else {
      logger.error('Failed to delete class', {
        service: 'ClassesAPI',
        operation: 'handleDelete',
        classId: id,
        error: result.error,
        duration: `${duration}ms`
      });
      console.log('[API Route] ❌ DELETE result:', result);
      return res.status(400).json(result);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in DELETE handler', {
      service: 'ClassesAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[API Route] ❌ Error in DELETE handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
