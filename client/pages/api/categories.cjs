/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve a list of all categories in the system
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
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
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new category
 *     description: Create a new category with the provided data
 *     tags: [Categories]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
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
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: Retrieve a specific category by its ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
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
 *     summary: Update a category
 *     description: Update an existing category with new data
 *     tags: [Categories]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Category not found
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
 *     summary: Delete a category
 *     description: Delete a category by its ID
 *     tags: [Categories]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
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
 *                   example: "Category deleted successfully"
 *       404:
 *         description: Category not found
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
 * Categories API Route
 * Handles all category operations for the frontend
 * Uses MongoDB/Prisma on the server side
 * CommonJS version for Node.js compatibility
 */

const { getApiUrl, API_VERSION } = require('../../src/services/api/apiConfig.cjs');
const dbService = require('../../src/services/db/categoryDbService-mongodb.cjs');
const getCategoriesFromDb = dbService.getCategories;
const getCategoryByIdFromDb = dbService.getCategoryById;
const createCategoryToDb = dbService.create;
const updateCategoryInDb = dbService.update;
const deleteCategoryFromDb = dbService.deleteCategory;

function handler(req, res) {
  const { method } = req;
  console.log(`[API Route] 📨 ${method} /api/${API_VERSION}/categories - Query:`, req.query, 'Body:', req.body);

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
      console.log(`[API Route] ❌ Method not allowed: ${method}`);
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
  }
}

async function handleGet(req, res) {
  try {
    const { id } = req.query;
    console.log(`[API Route] 📥 GET handler - ID: ${id || 'all'}`);
    
    if (id) {
      // Get specific category
      console.log(`[API Route] Fetching category by ID: ${id}`);
      const result = await getCategoryByIdFromDb(id);
      console.log(`[API Route] ✅ GET result:`, result);
      return res.status(200).json(result);
    } else {
      // Get all categories
      console.log('[API Route] Fetching all categories');
      const result = await getCategoriesFromDb();
      console.log(`[API Route] ✅ GET result: ${result.data?.length || 0} categories`);
      return res.status(200).json(result);
    }
  } catch (error) {
    console.error('[API Route] ❌ Error in GET handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const categoryData = req.body;
    console.log('[API Route] 📝 POST handler - Creating category:', categoryData.nameEn);
    
    const result = await createCategoryToDb(categoryData);
    console.log('[API Route] ✅ POST result:', result);
    return res.status(201).json(result);
  } catch (error) {
    console.error('[API Route] ❌ Error in POST handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePut(req, res) {
  try {
    const { id, ...categoryData } = req.body;
    console.log(`[API Route] 📝 PUT handler - Updating category: ${id}`);
    
    if (!id) {
      console.log('[API Route] ❌ PUT failed: No ID provided');
      return res.status(400).json({ success: false, error: 'Category ID is required' });
    }
    
    const result = await updateCategoryInDb(id, categoryData);
    console.log('[API Route] ✅ PUT result:', result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[API Route] ❌ Error in PUT handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.query;
    console.log(`[API Route] 🗑️ DELETE handler - Deleting category: ${id}`);
    
    if (!id) {
      console.log('[API Route] ❌ DELETE failed: No ID provided');
      return res.status(400).json({ success: false, error: 'Category ID is required' });
    }
    
    const result = await deleteCategoryFromDb(id);
    console.log('[API Route] ✅ DELETE result:', result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[API Route] ❌ Error in DELETE handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { handler };
