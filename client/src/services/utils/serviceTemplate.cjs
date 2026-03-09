/**
 * API Service Template
 * 
 * PURPOSE:
 * Provides a reusable template for creating API route handlers
 * Can be copied and adapted for any collection/model
 * 
 * USAGE:
 * 1. Copy this file: serviceTemplate.cjs -> newCollectionApi.cjs
 * 2. Replace 'Collection' with your collection name
 * 3. Replace 'collection' with your collection name (lowercase)
 * 4. Update the import path to your database service
 * 5. Add/modify endpoints as needed
 * 6. Add Swagger documentation
 */

/**
 * @swagger
 * /api/v1/collections:
 *   get:
 *     summary: Get all collections
 *     description: Retrieve a list of all collections in the system
 *     tags: [Collections]
 *     responses:
 *       200:
 *         description: List of collections retrieved successfully
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
 *                     $ref: '#/components/schemas/Collection'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new collection
 *     description: Create a new collection with the provided data
 *     tags: [Collections]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CollectionInput'
 *     responses:
 *       201:
 *         description: Collection created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Collection'
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
 * /api/v1/collections/{id}:
 *   get:
 *     summary: Get collection by ID
 *     description: Retrieve a specific collection by its ID
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection ID
 *     responses:
 *       200:
 *         description: Collection retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Collection'
 *       404:
 *         description: Collection not found
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
 *     summary: Update a collection
 *     description: Update an existing collection with new data
 *     tags: [Collections]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CollectionInput'
 *     responses:
 *       200:
 *         description: Collection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Collection'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Collection not found
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
 *     summary: Delete a collection
 *     description: Delete a collection by its ID
 *     tags: [Collections]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection ID
 *     responses:
 *       200:
 *         description: Collection deleted successfully
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
 *                   example: "Collection deleted successfully"
 *       404:
 *         description: Collection not found
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
 * Collections API Route
 * Handles all collection operations for the frontend
 * Uses MongoDB/Prisma on the server side
 * CommonJS version for Node.js compatibility
 */

const { getApiUrl, API_VERSION } = require('../../src/services/api/apiConfig.cjs');
const { logger, logSecurityEvent } = require('../../src/services/utils/logger');
const collectionDbService = require('../../src/services/db/collectionDbService-mongodb.cjs');

// Use aliases for cleaner code
const {
  getCollections,
  getCollectionById,
  create: createCollection,
  update: updateCollection,
  deleteCollection: deleteCollection
} = collectionDbService;

function handler(req, res) {
  const { method } = req;
  const startTime = Date.now();
  
  // Log request with structured data
  logger.info('API request received', {
    service: 'CollectionsAPI',
    method,
    url: `/api/${API_VERSION}/collections`,
    query: req.query,
    body: req.body,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  });
  
  console.log(`[API Route] 📨 ${method} /api/${API_VERSION}/collections - Query:`, req.query, 'Body:', req.body);

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
        service: 'CollectionsAPI',
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
    logger.info('GET collections request', {
      service: 'CollectionsAPI',
      operation: 'handleGet',
      collectionId: id || 'all'
    });
    
    console.log(`[API Route] 📥 GET handler - ID: ${id || 'all'}`);
    
    if (id) {
      // Get specific collection
      console.log(`[API Route] Fetching collection by ID: ${id}`);
      const result = await getCollectionById(id);
      const duration = Date.now() - startTime;
      
      logger.info('Collection retrieved successfully', {
        service: 'CollectionsAPI',
        operation: 'handleGet',
        collectionId: id,
        success: result.success,
        duration: `${duration}ms`
      });
      
      console.log(`[API Route] ✅ GET result:`, result);
      return res.status(200).json(result);
    } else {
      // Get all collections
      console.log('[API Route] Fetching all collections');
      const result = await getCollections();
      const duration = Date.now() - startTime;
      
      logger.info('Collections retrieved successfully', {
        service: 'CollectionsAPI',
        operation: 'handleGet',
        count: result.data?.length || 0,
        success: result.success,
        duration: `${duration}ms`
      });
      
      console.log(`[API Route] ✅ GET result: ${result.data?.length || 0} collections`);
      return res.status(200).json(result);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in GET handler', {
      service: 'CollectionsAPI',
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
    const collectionData = req.body;
    logger.info('POST collection request', {
      service: 'CollectionsAPI',
      operation: 'handlePost',
      data: collectionData
    });
    
    console.log('[API Route] 📝 POST handler - Creating collection:', collectionData.name || 'unnamed');
    
    // Validate required fields
    if (!collectionData.name) {
      const duration = Date.now() - startTime;
      logger.warn('Missing required field: name', {
        service: 'CollectionsAPI',
        operation: 'handlePost',
        duration: `${duration}ms`
      });
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    
    const result = await createCollection(collectionData);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info('Collection created successfully', {
        service: 'CollectionsAPI',
        operation: 'handlePost',
        collectionId: result.data.id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ POST result:', result);
      return res.status(201).json(result);
    } else {
      logger.error('Failed to create collection', {
        service: 'CollectionsAPI',
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
      service: 'CollectionsAPI',
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
    
    logger.info('PUT collection request', {
      service: 'CollectionsAPI',
      operation: 'handlePut',
      collectionId: id,
      data: updateData
    });
    
    console.log(`[API Route] 🔄 PUT handler - Updating collection: ${id}`);
    
    if (!id) {
      const duration = Date.now() - startTime;
      logger.warn('Missing collection ID', {
        service: 'CollectionsAPI',
        operation: 'handlePut',
        duration: `${duration}ms`
      });
      return res.status(400).json({ success: false, error: 'Collection ID is required' });
    }
    
    const result = await updateCollection(id, updateData);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info('Collection updated successfully', {
        service: 'CollectionsAPI',
        operation: 'handlePut',
        collectionId: id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ PUT result:', result);
      return res.status(200).json(result);
    } else {
      logger.error('Failed to update collection', {
        service: 'CollectionsAPI',
        operation: 'handlePut',
        collectionId: id,
        error: result.error,
        duration: `${duration}ms`
      });
      console.log('[API Route] ❌ PUT result:', result);
      return res.status(400).json(result);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in PUT handler', {
      service: 'CollectionsAPI',
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
    
    logger.info('DELETE collection request', {
      service: 'CollectionsAPI',
      operation: 'handleDelete',
      collectionId: id
    });
    
    console.log(`[API Route] 🗑️ DELETE handler - Deleting collection: ${id}`);
    
    if (!id) {
      const duration = Date.now() - startTime;
      logger.warn('Missing collection ID', {
        service: 'CollectionsAPI',
        operation: 'handleDelete',
        duration: `${duration}ms`
      });
      return res.status(400).json({ success: false, error: 'Collection ID is required' });
    }
    
    const result = await deleteCollection(id);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info('Collection deleted successfully', {
        service: 'CollectionsAPI',
        operation: 'handleDelete',
        collectionId: id,
        duration: `${duration}ms`
      });
      console.log('[API Route] ✅ DELETE result:', result);
      return res.status(200).json(result);
    } else {
      logger.error('Failed to delete collection', {
        service: 'CollectionsAPI',
        operation: 'handleDelete',
        collectionId: id,
        error: result.error,
        duration: `${duration}ms`
      });
      console.log('[API Route] ❌ DELETE result:', result);
      return res.status(400).json(result);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in DELETE handler', {
      service: 'CollectionsAPI',
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
