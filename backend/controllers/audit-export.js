/**
 * Audit Export Controller
 * 
 * PURPOSE: Export audit trail data for regulatory requests
 * ARCHITECTURE: Controller → Service → DB
 */

import { PrismaClient } from '@prisma/client';
import { getPermissionDenialLogs } from '../services/permissionDenialAuditService.js';

const prisma = new PrismaClient();

/**
 * GET /api/v1/audit-export/workflow-status-history
 * Export workflow status history for regulatory requests
 */
export const exportWorkflowStatusHistoryController = async (req, res) => {
  try {
    const { startDate, endDate, documentId, actorId, format = 'csv' } = req.query;

    // Validate HR or Admin role
    const { user } = req;
    if (!user || !user.roles || (!user.roles.includes('hr') && !user.roles.includes('admin'))) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. HR or Admin role required.'
      });
    }

    // Build where clause
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (documentId) where.workflowDocumentId = parseInt(documentId);
    if (actorId) where.actorId = parseInt(actorId);

    // Fetch audit trail data
    const auditTrail = await prisma.workflowStatusHistory.findMany({
      where,
      include: {
        workflowDocument: {
          include: {
            file: true,
            submitter: true,
            class: true
          }
        },
        actor: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-trail-${new Date().toISOString().split('T')[0]}.json"`);
      return res.json({
        success: true,
        data: auditTrail,
        exportedAt: new Date().toISOString(),
        filters: { startDate, endDate, documentId, actorId }
      });
    }

    // CSV format (default)
    const csvHeader = 'ID,Document ID,Document Title,From Status,To Status,Actor ID,Actor Name,Reason,Created At\n';
    const csvRows = auditTrail.map(record => {
      const doc = record.workflowDocument;
      return [
        record.id,
        record.workflowDocumentId,
        `"${doc?.title || ''}"`,
        record.fromStatus || '',
        record.toStatus,
        record.actorId,
        `"${record.actor?.name || record.actor?.firstName || ''}"`,
        `"${(record.reason || '').replace(/"/g, '""')}"`,
        record.createdAt.toISOString()
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-trail-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error in exportWorkflowStatusHistoryController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/audit-export/permission-denials
 * Export permission denial logs for regulatory requests
 */
export const exportPermissionDenialsController = async (req, res) => {
  try {
    const { startDate, endDate, userId, format = 'csv' } = req.query;

    // Validate HR or Admin role
    const { user } = req;
    if (!user || !user.roles || (!user.roles.includes('hr') && !user.roles.includes('admin'))) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. HR or Admin role required.'
      });
    }

    // Fetch permission denial logs
    const result = await getPermissionDenialLogs({
      startDate,
      endDate,
      userId,
      limit: 10000 // Large limit for export
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    const denialLogs = result.data;

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="permission-denials-${new Date().toISOString().split('T')[0]}.json"`);
      return res.json({
        success: true,
        data: denialLogs,
        exportedAt: new Date().toISOString(),
        filters: { startDate, endDate, userId }
      });
    }

    // CSV format (default)
    const csvHeader = 'ID,User ID,User Name,Action,Resource,Reason,User Role,Created At\n';
    const csvRows = denialLogs.map(record => {
      return [
        record.id,
        record.userId,
        `"${record.user?.name || record.user?.firstName || ''}"`,
        `"${record.action}"`,
        `"${record.resource}"`,
        `"${(record.reason || '').replace(/"/g, '""')}"`,
        `"${record.userRole}"`,
        record.createdAt.toISOString()
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="permission-denials-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error in exportPermissionDenialsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export default {
  exportWorkflowStatusHistoryController,
  exportPermissionDenialsController
};
