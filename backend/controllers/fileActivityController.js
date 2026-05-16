/**
 * File Activity Controller
 * Handles file activity audit trail endpoints
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ok = (payload) => ({ success: true, payload, timestamp: Date.now() });
const err = (code, message) => ({
  success: false,
  error: { code, message },
  timestamp: Date.now(),
});

/**
 * Get file activities
 * GET /api/v1/drive/files/:fileId/activities
 */
export async function getFileActivities(req, res) {
  try {
    const { fileId } = req.params;
    const userId = req.user?.dbId;

    if (!userId) {
      return res.status(401).json(err('UNAUTHORIZED', 'User not authenticated'));
    }

    // Check if user has access to the file
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { 
        ownerId: true,
        shares: {
          where: {
            OR: [
              { subjectType: 'USER', subjectUserId: userId },
              { subjectType: 'ROLE', subjectRole: { in: req.user?.roles || [] } }
            ]
          }
        }
      },
    });

    if (!file) {
      return res.status(404).json(err('FILE_NOT_FOUND', 'File not found'));
    }

    const isOwner = file.ownerId === userId;
    const hasAccess = isOwner || file.shares.length > 0 || (req.user?.roles || []).includes('super_admin');

    if (!hasAccess) {
      return res.status(403).json(err('ACCESS_DENIED', 'You do not have access to this file'));
    }

    // Fetch activities
    const activities = await prisma.fileActivity.findMany({
      where: { fileId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 activities
    });

    return res.json(ok(activities));
  } catch (error) {
    console.error('[fileActivityController.getFileActivities]', error);
    return res.status(500).json(err('GET_ACTIVITIES_FAILED', error.message));
  }
}
