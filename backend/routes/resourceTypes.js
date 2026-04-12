import express from 'express';
const router = express.Router();
import {
  getAllResourceTypes,
  getResourceTypeById,
  createResourceType,
  updateResourceType,
  deleteResourceType
} from '../db/resourceTypes-postgres.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     ResourceType:
 *       type: object
 *       required:
 *         - code
 *         - nameEn
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the resource type
 *         code:
 *           type: string
 *           description: Unique code for the resource type
 *           example: "LINK"
 *         nameEn:
 *           type: string
 *           description: English name of the resource type
 *           example: "Link"
 *         nameAr:
 *           type: string
 *           description: Arabic name of the resource type
 *           example: "رابط"
 *         descriptionEn:
 *           type: string
 *           description: English description of the resource type
 *           example: "External link resource"
 *         descriptionAr:
 *           type: string
 *           description: Arabic description of the resource type
 *           example: "مصدر الرابط الخارجي"
 *         icon:
 *           type: string
 *           description: Icon name for the resource type
 *           example: "link"
 *         color:
 *           type: string
 *           description: Color code for the resource type
 *           example: "#3B82F6"
 *         isActive:
 *           type: boolean
 *           description: Whether the resource type is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the resource type was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the resource type was last updated
 */

/**
 * @swagger
 * /resource-types:
 *   get:
 *     summary: Get all resource types
 *     tags: [Resource Types]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for code, nameEn, or nameAr
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: code
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of resource types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ResourceType'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  try {
    const result = await getAllResourceTypes(req.query);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[ResourceTypes Router] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /resource-types/{id}:
 *   get:
 *     summary: Get resource type by ID
 *     tags: [Resource Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource type ID
 *     responses:
 *       200:
 *         description: Resource type details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ResourceType'
 *       404:
 *         description: Resource type not found
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await getResourceTypeById(req.params.id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[ResourceTypes Router] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /resource-types:
 *   post:
 *     summary: Create a new resource type
 *     tags: [Resource Types]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - nameEn
 *             properties:
 *               code:
 *                 type: string
 *                 example: "LINK"
 *               nameEn:
 *                 type: string
 *                 example: "Link"
 *               nameAr:
 *                 type: string
 *                 example: "رابط"
 *               descriptionEn:
 *                 type: string
 *                 example: "External link resource"
 *               descriptionAr:
 *                 type: string
 *                 example: "مصدر الرابط الخارجي"
 *               icon:
 *                 type: string
 *                 example: "link"
 *               color:
 *                 type: string
 *                 example: "#3B82F6"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Resource type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ResourceType'
 *       400:
 *         description: Bad request
 */
router.post('/', async (req, res) => {
  try {
    const result = await createResourceType(req.body, req.user);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[ResourceTypes Router] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /resource-types/{id}:
 *   put:
 *     summary: Update resource type
 *     tags: [Resource Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "LINK"
 *               nameEn:
 *                 type: string
 *                 example: "Link"
 *               nameAr:
 *                 type: string
 *                 example: "رابط"
 *               descriptionEn:
 *                 type: string
 *                 example: "External link resource"
 *               descriptionAr:
 *                 type: string
 *                 example: "مصدر الرابط الخارجي"
 *               icon:
 *                 type: string
 *                 example: "link"
 *               color:
 *                 type: string
 *                 example: "#3B82F6"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Resource type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ResourceType'
 *       404:
 *         description: Resource type not found
 */
router.put('/:id', async (req, res) => {
  try {
    const result = await updateResourceType(req.params.id, req.body, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[ResourceTypes Router] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /resource-types/{id}:
 *   delete:
 *     summary: Delete resource type
 *     tags: [Resource Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource type ID
 *     responses:
 *       200:
 *         description: Resource type deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ResourceType'
 *       404:
 *         description: Resource type not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteResourceType(req.params.id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[ResourceTypes Router] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
