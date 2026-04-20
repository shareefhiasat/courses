import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  generatePresignedPutUrl,
  generatePresignedGetUrl,
  deleteObject,
  BUCKETS,
} from './minioService.js';
import { mapBucketName } from '../constants/driveConstants.js';

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
    console.error('[fileService] Error converting keycloakId to userId:', error);
    throw error;
  }
}

async function initiateUpload(keycloakId, { name, mimeType, size, bucket, folderPath, workflowStatus }) {
  try {
    // Convert keycloakId (UUID) to userId (integer)
    const userId = await getUserIdFromKeycloakId(keycloakId);
    
    const fileId = uuidv4();
    const s3Key = `${bucket}/${userId}/${fileId}/${name}`;

    const file = await prisma.file.create({
      data: {
        id: fileId,
        s3Key,
        bucket: mapBucketName(bucket),
        name,
        mimeType,
        size,
        ownerId: userId,
        folderPath: folderPath || null,
        workflowStatus: workflowStatus || 'DRAFT',
      },
    });

    const presignedUrl = await generatePresignedPutUrl(bucket, s3Key);

    await prisma.fileActivity.create({
      data: {
        fileId: file.id,
        userId,
        action: 'upload',
        metadata: { size, mimeType },
      },
    });

    return {
      success: true,
      payload: {
        fileId: file.id,
        presignedUrl,
        s3Key,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileService] Error initiating upload:', error);
    return {
      success: false,
      error: { code: 'UPLOAD_INIT_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function completeUpload(fileId) {
  try {
    const file = await prisma.file.update({
      where: { id: fileId },
      data: { updatedAt: new Date() },
    });

    return {
      success: true,
      payload: file,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileService] Error completing upload:', error);
    return {
      success: false,
      error: { code: 'UPLOAD_COMPLETE_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function getFileById(fileId, userId) {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        owner: { select: { id: true, email: true, displayName: true } },
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
        shares: {
          include: {
            sharedWith: { select: { id: true, email: true, displayName: true } },
          },
        },
        comments: {
          include: {
            user: { select: { id: true, email: true, displayName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: {
            user: { select: { id: true, email: true, displayName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!file) {
      return {
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'File not found' },
        timestamp: Date.now(),
      };
    }

    const hasAccess = file.ownerId === userId || file.shares.some(s => s.sharedWithId === userId);
    if (!hasAccess) {
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
        timestamp: Date.now(),
      };
    }

    const presignedUrl = await generatePresignedGetUrl(file.bucket, file.s3Key);

    return {
      success: true,
      payload: { ...file, presignedUrl },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileService] Error getting file:', error);
    return {
      success: false,
      error: { code: 'GET_FILE_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function listFiles(keycloakId, { bucket, folderPath, workflowStatus } = {}) {
  try {
    // Convert keycloakId (UUID) to userId (integer)
    const userId = await getUserIdFromKeycloakId(keycloakId);
    
    const where = {
      OR: [
        { ownerId: userId },
        { shares: { some: { sharedWithId: userId } } },
      ],
      isActive: true,
    };

    if (bucket) where.bucket = mapBucketName(bucket);
    if (folderPath !== undefined) where.folderPath = folderPath;
    if (workflowStatus) where.workflowStatus = workflowStatus;

    const files = await prisma.file.findMany({
      where,
      include: {
        owner: { select: { id: true, email: true, displayName: true } },
        shares: { select: { sharedWithId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      payload: files,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileService] Error listing files:', error);
    return {
      success: false,
      error: { code: 'LIST_FILES_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function updateFile(fileId, userId, updates) {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.ownerId !== userId) {
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
        timestamp: Date.now(),
      };
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: updates,
    });

    await prisma.fileActivity.create({
      data: {
        fileId,
        userId,
        action: 'update',
        metadata: updates,
      },
    });

    return {
      success: true,
      payload: updated,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileService] Error updating file:', error);
    return {
      success: false,
      error: { code: 'UPDATE_FILE_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function deleteFile(fileId, userId) {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.ownerId !== userId) {
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
        timestamp: Date.now(),
      };
    }

    await deleteObject(file.bucket, file.s3Key);

    await prisma.file.update({
      where: { id: fileId },
      data: { isActive: false },
    });

    await prisma.fileActivity.create({
      data: {
        fileId,
        userId,
        action: 'delete',
      },
    });

    return {
      success: true,
      payload: { fileId },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileService] Error deleting file:', error);
    return {
      success: false,
      error: { code: 'DELETE_FILE_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function generatePublicLink(fileId, keycloakId, expiryDays = 7) {
  try {
    let userId;
    try {
      userId = await getUserIdFromKeycloakId(keycloakId);
    } catch (error) {
      console.error('[fileService] Error converting keycloakId to userId:', error);
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'User not found' },
        timestamp: Date.now(),
      };
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.ownerId !== userId) {
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
        timestamp: Date.now(),
      };
    }

    const token = uuidv4();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: {
        publicLinkToken: token,
        publicLinkExpiry: expiry,
      },
    });

    await prisma.fileActivity.create({
      data: {
        fileId,
        userId,
        action: 'public_link_created',
        metadata: { expiryDays },
      },
    });

    const publicUrl = `${process.env.PUBLIC_LINK_BASE_URL}/${token}`;

    return {
      success: true,
      payload: { publicUrl, token, expiry },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileService] Error generating public link:', error);
    return {
      success: false,
      error: { code: 'PUBLIC_LINK_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function getFileByPublicToken(token) {
  try {
    const file = await prisma.file.findUnique({
      where: { publicLinkToken: token },
      include: {
        owner: { select: { id: true, displayName: true } },
      },
    });

    if (!file || !file.publicLinkExpiry || file.publicLinkExpiry < new Date()) {
      return {
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired link' },
        timestamp: Date.now(),
      };
    }

    const presignedUrl = await generatePresignedGetUrl(file.bucket, file.s3Key);

    return {
      success: true,
      payload: { ...file, presignedUrl },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileService] Error getting file by token:', error);
    return {
      success: false,
      error: { code: 'GET_PUBLIC_FILE_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function toggleStarFile(fileId, userId) {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.ownerId !== userId) {
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
        timestamp: Date.now(),
      };
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { isStarred: !file.isStarred },
    });

    await prisma.fileActivity.create({
      data: {
        fileId,
        userId,
        action: updated.isStarred ? 'starred' : 'unstarred',
      },
    });

    return {
      success: true,
      payload: updated,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileService] Error toggling star:', error);
    return {
      success: false,
      error: { code: 'TOGGLE_STAR_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function softDeleteFile(fileId, userId) {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.ownerId !== userId) {
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
        timestamp: Date.now(),
      };
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    await prisma.fileActivity.create({
      data: {
        fileId,
        userId,
        action: 'soft_delete',
      },
    });

    return {
      success: true,
      payload: updated,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileService] Error soft deleting file:', error);
    return {
      success: false,
      error: { code: 'SOFT_DELETE_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function restoreFile(fileId, userId) {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.ownerId !== userId) {
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
        timestamp: Date.now(),
      };
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedById: null,
      },
    });

    await prisma.fileActivity.create({
      data: {
        fileId,
        userId,
        action: 'restored',
      },
    });

    return {
      success: true,
      payload: updated,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileService] Error restoring file:', error);
    return {
      success: false,
      error: { code: 'RESTORE_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function permanentDeleteFile(fileId, userId) {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.ownerId !== userId) {
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
        timestamp: Date.now(),
      };
    }

    // Delete from MinIO
    await deleteObject(file.bucket, file.s3Key);

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    await prisma.fileActivity.create({
      data: {
        fileId,
        userId,
        action: 'permanent_delete',
      },
    });

    return {
      success: true,
      payload: { message: 'File permanently deleted' },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileService] Error permanently deleting file:', error);
    return {
      success: false,
      error: { code: 'PERMANENT_DELETE_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function createFolder(keycloakId, { name, bucket, folderPath }) {
  try {
    let userId;
    try {
      userId = await getUserIdFromKeycloakId(keycloakId);
    } catch (error) {
      console.error('[fileService] Error converting keycloakId to userId:', error);
      throw new Error('User not found');
    }

    const fileId = uuidv4();
    const currentPath = folderPath || '';
    const s3Key = `${bucket}/${userId}/${fileId}/.keep`;

    const file = await prisma.file.create({
      data: {
        id: fileId,
        s3Key,
        bucket: mapBucketName(bucket),
        name,
        mimeType: 'application/x-directory',
        size: 0,
        ownerId: userId,
        folderPath: currentPath, // folderPath is the parent path, not the folder name
      },
    });

    const newPath = currentPath ? `${currentPath}/${name}` : name;

    await prisma.fileActivity.create({
      data: {
        fileId: file.id,
        userId,
        action: 'create_folder',
        metadata: { folderPath: newPath },
      },
    });

    return {
      success: true,
      payload: file,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileService] Error creating folder:', error);
    return {
      success: false,
      error: { code: 'CREATE_FOLDER_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

export {
  initiateUpload,
  completeUpload,
  getFileById,
  listFiles,
  updateFile,
  deleteFile,
  generatePublicLink,
  getFileByPublicToken,
  toggleStarFile,
  softDeleteFile,
  restoreFile,
  permanentDeleteFile,
  createFolder,
};
