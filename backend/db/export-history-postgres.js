/**
 * Export History DB Service - PostgreSQL Operations
 *
 * PURPOSE: Database operations for export history logging
 * ARCHITECTURE: DB Services → Prisma → PostgreSQL
 */

import prisma from './prismaClient.js';

const ALLOWED_EXPORT_TYPES = ['attendance_daily', 'attendance_daily_official', 'official_attendance', 'behavioral', 'penalty', 'summary'];
const ALLOWED_FORMATS = ['pdf', 'excel', 'csv'];
const MAX_LIMIT = 200;
const MAX_FILENAME_LENGTH = 255;
const MAX_METADATA_SIZE = 4096;

/**
 * Create an export history entry
 */
export async function createExportHistory(data) {
  try {
    const {
      userId,
      exportType,
      format,
      filename,
      classId = null,
      subjectId = null,
      programId = null,
      reportDate = null,
      fileId = null,
      mimeType = null,
      metadata = null,
    } = data;

    if (!ALLOWED_EXPORT_TYPES.includes(exportType)) {
      return { success: false, error: 'Invalid exportType' };
    }
    if (!ALLOWED_FORMATS.includes(format)) {
      return { success: false, error: 'Invalid format' };
    }
    if (!filename || typeof filename !== 'string' || filename.length > MAX_FILENAME_LENGTH) {
      return { success: false, error: 'Invalid filename' };
    }
    if (metadata) {
      try {
        const metadataStr = JSON.stringify(metadata);
        if (metadataStr.length > MAX_METADATA_SIZE) {
          return { success: false, error: 'Metadata too large' };
        }
      } catch {
        return { success: false, error: 'Invalid metadata' };
      }
    }

    const record = await prisma.exportHistory.create({
      data: {
        userId,
        exportType,
        format,
        filename,
        classId: classId ? parseInt(classId) : null,
        subjectId: subjectId ? parseInt(subjectId) : null,
        programId: programId ? parseInt(programId) : null,
        reportDate,
        fileId: fileId || undefined,
        mimeType: mimeType || undefined,
        metadata: metadata || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return { success: true, data: record };
  } catch (error) {
    console.error('Error creating export history:', error);
    return { success: false, error: 'Failed to create export history' };
  }
}

export async function getExportHistories(filters = {}) {
  try {
    const {
      exportType,
      format,
      userId,
      search = '',
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = filters;

    const where = {};

    if (exportType && ALLOWED_EXPORT_TYPES.includes(exportType)) where.exportType = exportType;
    if (format && ALLOWED_FORMATS.includes(format)) where.format = format;
    if (userId) where.userId = parseInt(userId);

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        {
          user: {
            displayName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          user: {
            email: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const records = await prisma.exportHistory.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            profileImageUrl: true,
            keycloakId: true,
            roleAssignments: {
              select: {
                role: {
                  select: {
                    id: true,
                    code: true,
                    nameEn: true,
                    nameAr: true,
                  },
                },
              },
            },
            instructorClasses: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit) || 100, MAX_LIMIT),
      skip: Math.min(Math.max(parseInt(offset) || 0, 0), 100000),
    });

    const total = await prisma.exportHistory.count({ where });

    const transformedRecords = records.map((record) => {
      if (record.user?.profileImageUrl && !record.user.profileImageUrl.startsWith('http') && !record.user.profileImageUrl.startsWith('/api/')) {
        record.user.profileImageUrl = `/api/v1/user-images/proxy/${record.user.keycloakId}/profile`;
      }
      return record;
    });

    return { success: true, data: transformedRecords, total };
  } catch (error) {
    console.error('Error getting export histories:', error);
    return { success: false, error: 'Failed to retrieve export history' };
  }
}

/**
 * Get a single export history entry by id
 */
export async function getExportHistoryById(id) {
  try {
    const record = await prisma.exportHistory.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });
    if (!record) {
      return { success: false, error: 'Export record not found' };
    }
    return { success: true, data: record };
  } catch (error) {
    console.error('Error getting export history by id:', error);
    return { success: false, error: 'Failed to retrieve export history' };
  }
}

export default { createExportHistory, getExportHistories, getExportHistoryById };
