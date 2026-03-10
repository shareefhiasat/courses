/**
 * @swagger
 * /api/v1/attendance-sessions:
 *   get:
 *     summary: Get all attendance sessions
 *     description: Retrieve a list of attendance sessions (supports optional filtering)
 *     tags: [Attendance Sessions]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Get a single attendance session by ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: instructorId
 *         schema:
 *           type: string
 *         description: Filter by instructor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by session status
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date
 *     responses:
 *       200:
 *         description: Attendance sessions retrieved successfully
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
 *                     $ref: '#/components/schemas/AttendanceSession'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new attendance session
 *     description: Create a new attendance session record
 *     tags: [Attendance Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttendanceSessionInput'
 *     responses:
 *       201:
 *         description: Attendance session created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update an attendance session
 *     description: Update an existing attendance session record
 *     tags: [Attendance Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendance session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttendanceSessionInput'
 *     responses:
 *       200:
 *         description: Attendance session updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Attendance session not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete an attendance session
 *     description: Delete an attendance session by ID
 *     tags: [Attendance Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendance session ID
 *     responses:
 *       200:
 *         description: Attendance session deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   patch:
 *     summary: Start or end attendance session
 *     description: Start a new attendance session or end an existing one
 *     tags: [Attendance Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *           enum: [start, end]
 *         description: Action to perform
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Session ID (required for end action)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classId
 *               - instructorId
 *             properties:
 *               classId:
 *                 type: string
 *                 description: Class ID (required for start action)
 *               instructorId:
 *                 type: string
 *                 description: Instructor ID (required for start action)
 *     responses:
 *       200:
 *         description: Session action completed successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

const { API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const attendanceSessionsDbService = require('@services/db/attendanceSessionsDbService.cjs');

const {
  getAttendanceSessions,
  getAttendanceSessionById,
  create: createAttendanceSession,
  update: updateAttendanceSession,
  deleteAttendanceSession,
  startSession,
  endSession
} = attendanceSessionsDbService;

function handler(req, res) {
  const { method } = req;
  logger.info('API request received', {
    service: 'AttendanceSessionsAPI',
    method,
    url: `/api/${API_VERSION}/attendance-sessions`,
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
    case 'PATCH':
      return handlePatch(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
      return res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
  }
}

async function handleGet(req, res) {
  try {
    const { id, classId, instructorId, status, date } = req.query;

    if (id) {
      const result = await getAttendanceSessionById(id);
      return res.status(200).json(result);
    }

    const result = await getAttendanceSessions({
      classId,
      instructorId,
      status,
      date
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET handler', {
      service: 'AttendanceSessionsAPI',
      operation: 'handleGet',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePost(req, res) {
  try {
    const attendanceSessionData = req.body;

    if (!attendanceSessionData.classId || !attendanceSessionData.instructorId || !attendanceSessionData.sessionDate) {
      return res.status(400).json({
        success: false,
        error: 'classId, instructorId, and sessionDate are required'
      });
    }

    const result = await createAttendanceSession(attendanceSessionData);
    if (result.success) return res.status(201).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in POST handler', {
      service: 'AttendanceSessionsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Attendance session ID is required' });

    const result = await updateAttendanceSession(id, updateData);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PUT handler', {
      service: 'AttendanceSessionsAPI',
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

    if (!id) return res.status(400).json({ success: false, error: 'Attendance session ID is required' });

    const result = await deleteAttendanceSession(id);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in DELETE handler', {
      service: 'AttendanceSessionsAPI',
      operation: 'handleDelete',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handlePatch(req, res) {
  try {
    const { action, id } = req.query;
    const { classId, instructorId } = req.body;

    let result;
    if (action === 'start') {
      if (!classId || !instructorId) {
        return res.status(400).json({
          success: false,
          error: 'classId and instructorId are required for start action'
        });
      }
      result = await startSession(classId, instructorId, req.body);
    } else if (action === 'end') {
      if (!id) return res.status(400).json({ success: false, error: 'Session ID is required for end action' });
      result = await endSession(id);
    } else {
      return res.status(400).json({ success: false, error: 'action must be start or end' });
    }

    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (error) {
    logger.error('Error in PATCH handler', {
      service: 'AttendanceSessionsAPI',
      operation: 'handlePatch',
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = handler;
