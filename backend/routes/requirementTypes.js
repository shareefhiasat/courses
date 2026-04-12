/**
 * Requirement Types Routes - API Endpoints
 * 
 * PURPOSE: Route definitions for requirement type operations
 * ARCHITECTURE: HTTP Requests → Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';

const router = Router();

// Temporary static data until database schema is updated
const REQUIREMENT_TYPES_DATA = [
  { id: 1, code: 'MANDATORY', nameEn: 'Mandatory', nameAr: 'إلزامي', description: 'Required subject for graduation', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, code: 'OPTIONAL', nameEn: 'Optional', nameAr: 'اختياري', description: 'Not required but recommended', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, code: 'PREREQUISITE', nameEn: 'Prerequisite', nameAr: 'مطلب سابق', description: 'Required before taking other subjects', isActive: true, createdAt: new Date(), updatedAt: new Date() }
];

/**
 * @swagger
 * components:
 *   schemas:
 *     RequirementType:
 *       type: object
 *       required:
 *         - code
 *         - nameEn
 *       properties:
 *         id:
 *           type: integer
 *           description: Requirement type unique identifier
 *           example: 1
 *         code:
 *           type: string
 *           description: Requirement type code
 *           example: "mandatory"
 *         nameEn:
 *           type: string
 *           description: Requirement type name in English
 *           example: "Mandatory"
 *         nameAr:
 *           type: string
 *           description: Requirement type name in Arabic
 *           example: "إلزامي"
 *         description:
 *           type: string
 *           description: Requirement type description
 *           example: "Required subject for graduation"
 *         isActive:
 *           type: boolean
 *           description: Whether the requirement type is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the requirement type was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the requirement type was last updated
 */

/**
 * @swagger
 * /requirement-types:
 *   get:
 *     summary: Get all requirement types
 *     description: Retrieve all requirement types with pagination and filtering
 *     tags: [Requirement Types]
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
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for code or name
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Requirement types retrieved successfully
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
 *                     $ref: '#/components/schemas/RequirementType'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 50
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 */
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 50, search, isActive, sortBy = 'code', sortOrder = 'asc' } = req.query;
    
    let filteredData = [...REQUIREMENT_TYPES_DATA];
    
    // Apply filters
    if (search) {
      filteredData = filteredData.filter(item => 
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        item.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        (item.nameAr && item.nameAr.includes(search))
      );
    }
    
    if (isActive !== undefined) {
      const activeFilter = isActive === 'true' || isActive === true;
      filteredData = filteredData.filter(item => item.isActive === activeFilter);
    }
    
    // Apply sorting
    filteredData.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    // Apply pagination
    const total = filteredData.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[RequirementTypes Route] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /requirement-types/{id}:
 *   get:
 *     summary: Get requirement type by ID
 *     description: Retrieve a specific requirement type by its ID
 *     tags: [Requirement Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Requirement type ID
 *     responses:
 *       200:
 *         description: Requirement type retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RequirementType'
 *       404:
 *         description: Requirement type not found
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const requirementType = REQUIREMENT_TYPES_DATA.find(item => item.id === parseInt(id));
    
    if (!requirementType) {
      return res.status(404).json({
        success: false,
        error: 'Requirement type not found',
        code: 'NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: requirementType
    });
  } catch (error) {
    console.error('[RequirementTypes Route] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;
