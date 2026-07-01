/**
 * Export History Controller - API Layer
 *
 * PURPOSE: HTTP request handling for export history operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import { logExport, getExportHistory } from '../services/exportHistory.js';
import { LMS_ROLES } from '../services/keycloakAdminService.js';

const PRIVILEGED_ROLES = [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.ADMIN, LMS_ROLES.HR, LMS_ROLES.INSTRUCTOR];

/**
 * POST /api/v1/export-history
 * Log a new export event
 */
export const logExportController = async (req, res) => {
  try {
    const dbId = req.user?.dbId;
    if (!dbId) {
      return res.status(401).json({
        success: false,
        error: 'User not found in database',
      });
    }

    const { exportType, format, filename, classId, subjectId, programId, reportDate, metadata } = req.body;

    if (!exportType || !format || !filename) {
      return res.status(400).json({
        success: false,
        error: 'exportType, format, and filename are required',
      });
    }

    if (typeof filename !== 'string' || filename.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename',
      });
    }

    const result = await logExport({
      userId: dbId,
      exportType,
      format,
      filename,
      classId,
      subjectId,
      programId,
      reportDate,
      metadata,
    });

    if (result.success) {
      res.status(201).json({ success: true, data: result.data });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error in logExportController:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * GET /api/v1/export-history
 * Get export history with optional filters
 * - Privileged roles (admin, super_admin, HR, instructor) can see all records
 * - Other roles (e.g. student) can only see their own records
 */
export const getExportHistoryController = async (req, res) => {
  try {
    const {
      exportType,
      format,
      userId,
      search,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = req.query;

    const userRoles = req.user?.roles || [];
    const isPrivileged = userRoles.some(role => PRIVILEGED_ROLES.includes(role));
    const requestingUserId = req.user?.dbId;

    const filters = {
      exportType,
      format,
      search,
      startDate,
      endDate,
      limit,
      offset,
    };

    if (isPrivileged && userId) {
      filters.userId = userId;
    } else if (!isPrivileged) {
      filters.userId = requestingUserId;
    }

    const result = await getExportHistory(filters);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error in getExportHistoryController:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
