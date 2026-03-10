/**
 * @swagger
 * /api/v1/attendance:
 *   get:
 *     summary: Get all attendance records
 *     description: Retrieve a list of attendance records (supports optional filtering)
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single attendance record by ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by attendance status
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date
 *       - in: query
 *         name: stats
 *         schema:
 *           type: boolean
 *         description: Get class statistics instead of records (requires classId)
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
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
 *                     $ref: '#/components/schemas/Attendance'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new attendance record
 *     description: Create a new attendance record
 *     tags: [Attendance]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttendanceInput'
 *     responses:
 *       201:
 *         description: Attendance record created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update an attendance record
 *     description: Update an existing attendance record
 *     tags: [Attendance]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendance record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttendanceInput'
 *     responses:
 *       200:
 *         description: Attendance record updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Attendance record not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete an attendance record
 *     description: Delete an attendance record by ID
 *     tags: [Attendance]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendance record ID
 *     responses:
 *       200:
 *         description: Attendance record deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const attendanceDbService = require('@services/db/attendanceDbService.cjs');

const {
  getAttendance,
  getAttendanceById,
  create: createAttendance,
  update: updateAttendance,
  deleteAttendance,
  getClassStats
} = attendanceDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'AttendanceAPI',
    method,
    url: `/api/${API_VERSION}/attendance`,
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
    const { id, userId, classId, status, date, stats, startDate, endDate } = req.query;

    if (id) {
      const result = await getAttendanceById(id);
      return res.status(200).json(result);
    }

    if (stats === 'true' && classId) {
      const result = await getClassStats(classId, { startDate, endDate });
      return res.status(200).json(result);
    }

    const result = await getAttendance({
      userId,
      classId,
      status,
      date
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'AttendanceAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const attendanceData = req.body;

    if (!attendanceData.userId || !attendanceData.classId || !attendanceData.date || !attendanceData.status) {
      return res.status(400).json({
        success: false,
        error: 'userId, classId, date, and status are required'
      });
    }

    const result = await createAttendance(attendanceData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'AttendanceAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Attendance record ID is required' });

    const result = await updateAttendance(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'AttendanceAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Attendance record ID is required' });

    const result = await deleteAttendance(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'AttendanceAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
