/**
 * Subject Types Routes - API Endpoints
 * 
 * PURPOSE: Route definitions for subject type operations
 * ARCHITECTURE: HTTP Requests → Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';

const router = Router();

// Temporary static data until database schema is updated
const SUBJECT_TYPES_DATA = [
  { id: 1, code: 'CORE', nameEn: 'Core Subject', nameAr: 'موضوع أساسي', description: 'Fundamental subject for the program', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, code: 'ELECTIVE', nameEn: 'Elective Subject', nameAr: 'موضوع اختياري', description: 'Optional subject students can choose', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, code: 'SPECIALIZATION', nameEn: 'Specialization Subject', nameAr: 'موضوع تخصص', description: 'Subject for specific specialization track', isActive: true, createdAt: new Date(), updatedAt: new Date() }
];

/**
 * @swagger
 * components:
 *   schemas:
 *     SubjectType:
 *       type: object
 *       required:
 *         - code
 *         - nameEn
 *       properties:
 *         id:
 *           type: integer
 *           description: Subject type unique identifier
 *           example: 1
 *         code:
 *           type: string
 *           description: Subject type code
 *           example: "core"
 *         nameEn:
 *           type: string
 *           description: Subject type name in English
 *           example: "Core Subject"
 *         nameAr:
 *           type: string
 *           description: Subject type name in Arabic
 *           example: "موضوع أساسي"
 *         description:
 *           type: string
 *           description: Subject type description
 *           example: "Fundamental subject for the program"
 *         isActive:
 *           type: boolean
 *           description: Whether the subject type is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the subject type was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the subject type was last updated
 */

/**
 * @swagger
 * /subject-types:
 *   get:
 *     summary: Get all subject types
 *     description: Retrieve all subject types with pagination and filtering
 *     tags: [Subject Types]
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
 *         description: Subject types retrieved successfully
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
 *                     $ref: '#/components/schemas/SubjectType'
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
    
    let filteredData = [...SUBJECT_TYPES_DATA];
    
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
    console.error('[SubjectTypes Route] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /subject-types/{id}:
 *   get:
 *     summary: Get subject type by ID
 *     description: Retrieve a specific subject type by its ID
 *     tags: [Subject Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject type ID
 *     responses:
 *       200:
 *         description: Subject type retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SubjectType'
 *       404:
 *         description: Subject type not found
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const subjectType = SUBJECT_TYPES_DATA.find(item => item.id === parseInt(id));
    
    if (!subjectType) {
      return res.status(404).json({
        success: false,
        error: 'Subject type not found',
        code: 'NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: subjectType
    });
  } catch (error) {
    console.error('[SubjectTypes Route] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;
