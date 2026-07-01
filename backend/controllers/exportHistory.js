/**
 * Export History Controller - API Layer
 *
 * PURPOSE: HTTP request handling for export history operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import prisma from '../db/prismaClient.js';
import { logExport, getExportHistory, getExportHistoryById } from '../services/exportHistory.js';
import { streamFile } from '../services/fileService.js';
import { LMS_ROLES } from '../services/keycloakAdminService.js';

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

    const {
      exportType,
      format,
      filename,
      classId,
      subjectId,
      programId,
      reportDate,
      fileId,
      mimeType,
      metadata,
    } = req.body;

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

    if (fileId) {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        select: { ownerId: true, isDeleted: true },
      });
      if (!file || file.isDeleted || file.ownerId !== dbId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid fileId — file must belong to the current user',
        });
      }
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
      fileId: fileId || null,
      mimeType: mimeType || null,
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
 * - super_admin can see all records (optional ?userId= filter)
 * - All other roles see only their own records
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
    const isSuperAdmin = userRoles.includes(LMS_ROLES.SUPER_ADMIN);
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

    if (isSuperAdmin) {
      if (userId) filters.userId = userId;
    } else {
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

/**
 * GET /api/v1/export-history/:id/file
 * Stream an export file via audit path (owner or super_admin only)
 */
export const getExportHistoryFileController = async (req, res) => {
  try {
    const dbId = req.user?.dbId;
    if (!dbId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }

    const { id } = req.params;
    const result = await getExportHistoryById(id);

    if (!result.success || !result.data) {
      return res.status(404).json({ success: false, error: result.error || 'Export record not found' });
    }

    const record = result.data;

    if (!record.fileId) {
      return res.status(404).json({
        success: false,
        error: 'File was not stored for this export',
        code: 'FILE_NOT_STORED',
      });
    }

    const userRoles = req.user?.roles || [];
    const isSuperAdmin = userRoles.includes(LMS_ROLES.SUPER_ADMIN);
    const isOwner = record.userId === dbId;

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const useAuditBypass = isSuperAdmin && !isOwner;

    if (useAuditBypass) {
      await prisma.fileActivity.create({
        data: {
          fileId: record.fileId,
          userId: dbId,
          action: 'EXPORT_HISTORY_VIEW',
        },
      }).catch((err) => console.warn('[exportHistory] audit log failed:', err.message));
    }

    return streamFile({
      fileId: record.fileId,
      req,
      res,
      actorUserId: dbId,
      skipAccessCheck: useAuditBypass,
    });
  } catch (error) {
    console.error('Error in getExportHistoryFileController:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
};
