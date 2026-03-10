/**
 * @swagger
 * /api/v1/programs:
 *   get:
 *     summary: Get all programs
 *     description: Retrieve a list of all programs in the system
 *     tags: [Programs]
 *     responses:
 *       200:
 *         description: List of programs retrieved successfully
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
 *                     $ref: '#/components/schemas/Program'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new program
 *     description: Create a new program with the provided data
 *     tags: [Programs]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProgramInput'
 *     responses:
 *       201:
 *         description: Program created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Program'
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
 * /api/v1/programs/{id}:
 *   get:
 *     summary: Get program by ID
 *     description: Retrieve a specific program by its ID
 *     tags: [Programs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *     responses:
 *       200:
 *         description: Program retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Program'
 *       404:
 *         description: Program not found
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
 *     summary: Update a program
 *     description: Update an existing program with new data
 *     tags: [Programs]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProgramInput'
 *     responses:
 *       200:
 *         description: Program updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Program'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Program not found
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
 *     summary: Delete a program
 *     description: Delete a program by its ID
 *     tags: [Programs]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *     responses:
 *       200:
 *         description: Program deleted successfully
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
 *                   example: "Program deleted successfully"
 *       404:
 *         description: Program not found
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
 * Programs API Route
 * Handles all program operations for the frontend
 * Uses MongoDB/Prisma on the server side
 * CommonJS version for Node.js compatibility
 */

const { getApiUrl, API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger, logSecurityEvent } = require('@services/utils/logger');
const programDbService = require('@services/db/programDbService.cjs');

// Use aliases for cleaner code
const {
  getPrograms,
  getProgramById,
  create: createProgram,
  update: updateProgram,
  deleteProgram: deleteProgram
} = programDbService;

function handler(req, res) {
  const { method } = req;
  const startTime = Date.now();
  
  // Log request with structured data
  logger.info('API request received', {
    service: 'ProgramsAPI',
    method,
    url: `/api/${API_VERSION}/programs`,
    query: req.query,
    body: req.body,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  });
  
  console.log(`[API Route] 📨 ${method} /api/${API_VERSION}/programs - Query:`, req.query, 'Body:', req.body);

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
        service: 'ProgramsAPI',
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
    logger.info('GET programs request', {
      service: 'ProgramsAPI',
      operation: 'handleGet',
      programId: id || 'all'
    });
    
    console.log(`[API Route] 📥 GET handler - ID: ${id || 'all'}`);
    
    if (id) {
      // Get specific program
      console.log(`[API Route] Fetching program by ID: ${id}`);
      const result = await getProgramById(id);
      const duration = Date.now() - startTime;
      
      logger.info('Program retrieved successfully', {
        service: 'ProgramsAPI',
        operation: 'handleGet',
        programId: id,
        success: result.success,
        duration: `${duration}ms`
      });
      
      console.log(`[API Route] ✅ GET result:`, result);
      return res.status(200).json(result);
    } else {
      // Get all programs
      console.log('[API Route] Fetching all programs');
      const result = await getPrograms();
      const duration = Date.now() - startTime;
      
      logger.info('Programs retrieved successfully', {
        service: 'ProgramsAPI',
        operation: 'handleGet',
        count: result.data?.length || 0,
        success: result.success,
        duration: `${duration}ms`
      });
      
      console.log(`[API Route] ✅ GET result: ${result.data?.length || 0} programs`);
      return res.status(200).json(result);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in GET handler', {
      service: 'ProgramsAPI',
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
    const programData = req.body;
    logger.info('POST program request', {
      service: 'ProgramsAPI',
      operation: 'handlePost',
      data: programData
    });
    
    console.log('[API Route] 📝 POST handler - Creating program:', programData.nameEn || 'unnamed');
    
    // Validate required fields
    if (!programData.nameEn || !programData.code) {
      const duration = Date.now() - startTime;
      logger.warn('Missing required fields', {
        service: 'ProgramsAPI',
        operation: 'handlePost',
        duration: `${duration}ms`
      });
      return res.status(400).json({ success: false, error: 'Name (nameEn) and code are required' });
    }
    
    const result = await createProgram(programData);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info('Program created successfully', {
        service: 'ProgramsAPI',
        operation: 'handlePost',
        programId: result.data.id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ POST result:', result);
      return res.status(201).json(result);
    } else {
      logger.error('Failed to create program', {
        service: 'ProgramsAPI',
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
      service: 'ProgramsAPI',
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
    
    logger.info('PUT program request', {
      service: 'ProgramsAPI',
      operation: 'handlePut',
      programId: id,
      data: updateData
    });
    
    console.log(`[API Route] 🔄 PUT handler - Updating program: ${id}`);
    
    if (!id) {
      const duration = Date.now() - startTime;
      logger.warn('Missing program ID', {
        service: 'ProgramsAPI',
        operation: 'handlePut',
        duration: `${duration}ms`
      });
      return res.status(400).json({ success: false, error: 'Program ID is required' });
    }
    
    const result = await updateProgram(id, updateData);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info('Program updated successfully', {
        service: 'ProgramsAPI',
        operation: 'handlePut',
        programId: id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ PUT result:', result);
      return res.status(200).json(result);
    } else {
      logger.error('Failed to update program', {
        service: 'ProgramsAPI',
        operation: 'handlePut',
        programId: id,
        error: result.error,
        duration: `${duration}ms`
      });
      console.log('[API Route] ❌ PUT result:', result);
      return res.status(400).json(result);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in PUT handler', {
      service: 'ProgramsAPI',
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
    
    logger.info('DELETE program request', {
      service: 'ProgramsAPI',
      operation: 'handleDelete',
      programId: id
    });
    
    console.log(`[API Route] 🗑️ DELETE handler - Deleting program: ${id}`);
    
    if (!id) {
      const duration = Date.now() - startTime;
      logger.warn('Missing program ID', {
        service: 'ProgramsAPI',
        operation: 'handleDelete',
        duration: `${duration}ms`
      });
      return res.status(400).json({ success: false, error: 'Program ID is required' });
    }
    
    const result = await deleteProgram(id);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info('Program deleted successfully', {
        service: 'ProgramsAPI',
        operation: 'handleDelete',
        programId: id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ DELETE result:', result);
      return res.status(200).json(result);
    } else {
      logger.error('Failed to delete program', {
        service: 'ProgramsAPI',
        operation: 'handleDelete',
        programId: id,
        error: result.error,
        duration: `${duration}ms`
      });
      console.log('[API Route] ❌ DELETE result:', result);
      return res.status(400).json(result);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in DELETE handler', {
      service: 'ProgramsAPI',
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
