import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  generatePresignedPutUrl,
  generatePresignedGetUrl,
  copyObject,
  deleteObject,
} from './minioService.js';

const prisma = new PrismaClient();

async function uploadNewVersion(fileId, userId, { name, mimeType, size, changeNote }) {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!file || file.ownerId !== userId) {
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
        timestamp: Date.now(),
      };
    }

    const currentVersion = file.versions[0]?.versionNumber || 0;
    const newVersionNumber = currentVersion + 1;
    const versionId = uuidv4();
    const versionS3Key = `${file.bucket}/${userId}/${fileId}/v${newVersionNumber}/${name}`;

    await copyObject(file.bucket, file.s3Key, file.bucket, versionS3Key);

    await prisma.fileVersion.create({
      data: {
        id: versionId,
        fileId,
        versionNumber: currentVersion,
        s3Key: file.s3Key,
        size: file.size,
        uploadedById: userId,
        changeNote,
      },
    });

    const newS3Key = `${file.bucket}/${userId}/${fileId}/${name}`;
    const presignedUrl = await generatePresignedPutUrl(file.bucket, newS3Key);

    await prisma.file.update({
      where: { id: fileId },
      data: {
        s3Key: newS3Key,
        name,
        mimeType,
        size,
      },
    });

    await prisma.fileActivity.create({
      data: {
        fileId,
        userId,
        action: 'new_version',
        metadata: { versionNumber: newVersionNumber, changeNote },
      },
    });

    return {
      success: true,
      payload: { presignedUrl, versionNumber: newVersionNumber },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileVersionService] Error uploading new version:', error);
    return {
      success: false,
      error: { code: 'VERSION_UPLOAD_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function getFileVersions(fileId, userId) {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file) {
      return {
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'File not found' },
        timestamp: Date.now(),
      };
    }

    const hasAccess = file.ownerId === userId || 
      await prisma.fileShare.findFirst({
        where: { fileId, sharedWithId: userId },
      });

    if (!hasAccess) {
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
        timestamp: Date.now(),
      };
    }

    const versions = await prisma.fileVersion.findMany({
      where: { fileId },
      include: {
        uploadedBy: { select: { id: true, email: true, displayName: true } },
      },
      orderBy: { versionNumber: 'desc' },
    });

    return {
      success: true,
      payload: versions,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileVersionService] Error getting versions:', error);
    return {
      success: false,
      error: { code: 'GET_VERSIONS_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function restoreVersion(versionId, userId) {
  try {
    const version = await prisma.fileVersion.findUnique({
      where: { id: versionId },
      include: { file: true },
    });

    if (!version || version.file.ownerId !== userId) {
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
        timestamp: Date.now(),
      };
    }

    const currentVersionNumber = await prisma.fileVersion.count({
      where: { fileId: version.fileId },
    });

    await prisma.fileVersion.create({
      data: {
        fileId: version.fileId,
        versionNumber: currentVersionNumber,
        s3Key: version.file.s3Key,
        size: version.file.size,
        uploadedById: userId,
        changeNote: `Restored from version ${version.versionNumber}`,
      },
    });

    await copyObject(version.file.bucket, version.s3Key, version.file.bucket, version.file.s3Key);

    await prisma.file.update({
      where: { id: version.fileId },
      data: {
        s3Key: version.s3Key,
        size: version.size,
      },
    });

    await prisma.fileActivity.create({
      data: {
        fileId: version.fileId,
        userId,
        action: 'restore_version',
        metadata: { restoredVersionNumber: version.versionNumber },
      },
    });

    return {
      success: true,
      payload: { versionNumber: version.versionNumber },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileVersionService] Error restoring version:', error);
    return {
      success: false,
      error: { code: 'RESTORE_VERSION_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

async function downloadVersion(versionId, userId) {
  try {
    const version = await prisma.fileVersion.findUnique({
      where: { id: versionId },
      include: { file: true },
    });

    if (!version) {
      return {
        success: false,
        error: { code: 'VERSION_NOT_FOUND', message: 'Version not found' },
        timestamp: Date.now(),
      };
    }

    const hasAccess = version.file.ownerId === userId ||
      await prisma.fileShare.findFirst({
        where: { fileId: version.fileId, sharedWithId: userId },
      });

    if (!hasAccess) {
      return {
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
        timestamp: Date.now(),
      };
    }

    const presignedUrl = await generatePresignedGetUrl(version.file.bucket, version.s3Key);

    return {
      success: true,
      payload: { presignedUrl, version },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[fileVersionService] Error downloading version:', error);
    return {
      success: false,
      error: { code: 'DOWNLOAD_VERSION_FAILED', message: error.message },
      timestamp: Date.now(),
    };
  }
}

export {
  uploadNewVersion,
  getFileVersions,
  restoreVersion,
  downloadVersion,
};
