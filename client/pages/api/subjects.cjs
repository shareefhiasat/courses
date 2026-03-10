/**
 * @swagger
 * /api/v1/subjects:
 *   get:
 *     summary: Get all subjects
 *     description: Retrieve a list of all subjects in the system
 *     tags: [Subjects]
 *     responses:
 *       200:
 *         description: List of subjects retrieved successfully
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
 *                     $ref: '#/components/schemas/Subject'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new subject
 *     description: Create a new subject with the provided data
 *     tags: [Subjects]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubjectInput'
 *     responses:
 *       201:
 *         description: Subject created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subject'
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
 * /api/v1/subjects/{id}:
 *   get:
 *     summary: Get subject by ID
 *     description: Retrieve a specific subject by its ID
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subject'
 *       404:
 *         description: Subject not found
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
 *     summary: Update a subject
 *     description: Update an existing subject with new data
 *     tags: [Subjects]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubjectInput'
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subject'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Subject not found
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
 *     summary: Delete a subject
 *     description: Delete a subject by its ID
 *     tags: [Subjects]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject deleted successfully
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
 *                   example: "Subject deleted successfully"
 *       404:
 *         description: Subject not found
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
 * Subjects API Route
 * Handles all subject operations for the frontend
 * Uses MongoDB/Prisma on the server side
 * CommonJS version for Node.js compatibility
 */

const { getApiUrl, API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger, logSecurityEvent } = require('@services/utils/logger');
const subjectDbService = require('@services/db/subjectDbService.cjs');

const {
  getSubjects,
  getSubjectById,
  create: createSubject,
  update: updateSubject,
  deleteSubject: deleteSubject
} = subjectDbService;

function handler(req, res) {
  const { method } = req;
  const startTime = Date.now();
  
  logger.info('API request received', {
    service: 'SubjectsAPI',
    method,
    url: `/api/${API_VERSION}/subjects`,
    query: req.query,
    body: req.body,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  });
  
  console.log(`[API Route] 📨 ${method} /api/${API_VERSION}/subjects - Query:`, req.query, 'Body:', req.body);

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
        service: 'SubjectsAPI',
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
    logger.info('GET subjects request', {
      service: 'SubjectsAPI',
      operation: 'handleGet',
      subjectId: id || 'all'
    });
    
    console.log(`[API Route] 📥 GET handler - ID: ${id || 'all'}`);
    
    if (id) {
      console.log(`[API Route] Fetching subject by ID: ${id}`);
      const result = await getSubjectById(id);
      const duration = Date.now() - startTime;
      
      logger.info('Subject retrieved successfully', {
        service: 'SubjectsAPI',
        operation: 'handleGet',
        subjectId: id,
        success: result.success,
        duration: `${duration}ms`
      });
      
      console.log(`[API Route] ✅ GET result:`, result);
      return res.status(200).json(result);
    } else {
      console.log('[API Route] Fetching all subjects');
      const result = await getSubjects();
      const duration = Date.now() - startTime;
      
      logger.info('Subjects retrieved successfully', {
        service: 'SubjectsAPI',
        operation: 'handleGet',
        count: result.data?.length || 0,
        success: result.success,
        duration: `${duration}ms`
      });
      
      console.log(`[API Route] ✅ GET result: ${result.data?.length || 0} subjects`);
      return res.status(200).json(result);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in GET handler', {
      service: 'SubjectsAPI',
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
    const subjectData = req.body;
    logger.info('POST subject request', {
      service: 'SubjectsAPI',
      operation: 'handlePost',
      data: subjectData
    });
    
    console.log('[API Route] 📝 POST handler - Creating subject:', subjectData.nameEn || 'unnamed');
    
    if (!subjectData.nameEn || !subjectData.code || !subjectData.programId) {
      const duration = Date.now() - startTime;
      logger.warn('Missing required fields', {
        service: 'SubjectsAPI',
        operation: 'handlePost',
        duration: `${duration}ms`
      });
      return res.status(400).json({ 
        success: false, 
        error: 'Name (nameEn), code, and programId are required' 
      });
    }
    
    const result = await createSubject(subjectData);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info('Subject created successfully', {
        service: 'SubjectsAPI',
        operation: 'handlePost',
        subjectId: result.data.id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ POST result:', result);
      return res.status(201).json(result);
    } else {
      logger.error('Failed to create subject', {
        service: 'SubjectsAPI',
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
      service: 'SubjectsAPI',
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
    
    logger.info('PUT subject request', {
      service: 'SubjectsAPI',
      operation: 'handlePut',
      subjectId: id,
      data: updateData
    });
    
    console.log(`[API Route] 🔄 PUT handler - Updating subject: ${id}`);
    
    if (!id) {
      const duration = Date.now() - startTime;
      logger.warn('Missing subject ID', {
        service: 'SubjectsAPI',
        operation: 'handlePut',
        duration: `${duration}ms`
      });
      return res.status(400).json({ success: false, error: 'Subject ID is required' });
    }
    
    const result = await updateSubject(id, updateData);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info('Subject updated successfully', {
        service: 'SubjectsAPI',
        operation: 'handlePut',
        subjectId: id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ PUT result:', result);
      return res.status(200).json(result);
    } else {
      logger.error('Failed to update subject', {
        service: 'SubjectsAPI',
        operation: 'handlePut',
        subjectId: id,
        error: result.error,
        duration: `${duration}ms`
      });
      console.log('[API Route] ❌ PUT result:', result);
      return res.status(400).json(result);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in PUT handler', {
      service: 'SubjectsAPI',
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
    
    logger.info('DELETE subject request', {
      service: 'SubjectsAPI',
      operation: 'handleDelete',
      subjectId: id
    });
    
    console.log(`[API Route] 🗑️ DELETE handler - Deleting subject: ${id}`);
    
    if (!id) {
      const duration = Date.now() - startTime;
      logger.warn('Missing subject ID', {
        service: 'SubjectsAPI',
        operation: 'handleDelete',
        duration: `${duration}ms`
      });
      return res.status(400).json({ success: false, error: 'Subject ID is required' });
    }
    
    const result = await deleteSubject(id);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info('Subject deleted successfully', {
        service: 'SubjectsAPI',
        operation: 'handleDelete',
        subjectId: id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ DELETE result:', result);
      return res.status(200).json(result);
    } else {
      logger.error('Failed to delete subject', {
        service: 'SubjectsAPI',
        operation: 'handleDelete',
        subjectId: id,
        error: result.error,
        duration: `${duration}ms`
      });
      console.log('[API Route] ❌ DELETE result:', result);
      return res.status(400).json(result);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in DELETE handler', {
      service: 'SubjectsAPI',
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
