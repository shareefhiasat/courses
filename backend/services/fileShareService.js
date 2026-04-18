import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Convert Keycloak UUID to database User ID
 * @param {string} keycloakId - The Keycloak user UUID
 * @returns {Promise<number>} - The database user ID (integer)
 */
async function getUserIdFromKeycloakId(keycloakId) {
  try {
    const user = await prisma.user.findUnique({
      where: { keycloakId },
      select: { id: true }
    });
    
    if (!user) {
      throw new Error(`User not found for keycloakId: ${keycloakId}`);
    }
    
    return user.id;
  } catch (error) {
    console.error('[fileShareService] Error converting keycloakId to userId:', error);
    throw error;
  }
}

async function shareFile(fileId, userId, { sharedWithId, permission, expiresAt }) {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.ownerId !== userId) {
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
        timestamp: Date.now(),
      };
    }

    const share = await prisma.fileShare.create({
      data: {
        fileId,
        sharedById: userId,
        sharedWithId,
        permission: permission || 'VIEW',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        sharedWith: { select: { id: true, email: true, displayName: true } },
      },
    });

    await prisma.fileActivity.create({
      data: {
        fileId,
        userId,
        action: 'share',
        metadata: { sharedWithId, permission },
      },
    });

    return {
      success: true,
      payload: share,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileShareService] Error sharing file:', error);
    return {
      success: false,
      error: { code: 'SHARE_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function unshareFile(shareId, userId) {
  try {
    const share = await prisma.fileShare.findUnique({
      where: { id: shareId },
      include: { file: true },
    });

    if (!share || share.file.ownerId !== userId) {
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
        timestamp: Date.now(),
      };
    }

    await prisma.fileShare.delete({ where: { id: shareId } });

    await prisma.fileActivity.create({
      data: {
        fileId: share.fileId,
        userId,
        action: 'unshare',
        metadata: { sharedWithId: share.sharedWithId },
      },
    });

    return {
      success: true,
      payload: { shareId },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileShareService] Error unsharing file:', error);
    return {
      success: false,
      error: { code: 'UNSHARE_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function getSharedFiles(keycloakId) {
  try {
    // Convert keycloakId (UUID) to userId (integer)
    const userId = await getUserIdFromKeycloakId(keycloakId);
    
    const shares = await prisma.fileShare.findMany({
      where: { sharedWithId: userId },
      include: {
        file: {
          include: {
            owner: { select: { id: true, email: true, displayName: true } },
          },
        },
        sharedBy: { select: { id: true, email: true, displayName: true } },
      },
    });

    return {
      success: true,
      payload: shares,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileShareService] Error getting shared files:', error);
    return {
      success: false,
      error: { code: 'GET_SHARED_FILES_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

export {
  shareFile,
  unshareFile,
  getSharedFiles,
};
