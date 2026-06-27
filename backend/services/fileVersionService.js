/**
 * File Version Service
 *
 * Version management that treats versions as first-class, immutable records:
 *   - listing    — read-only
 *   - rollback   — metadata flip (no MinIO copy); previous current stays on disk
 *   - download   — stream a specific historical version through the proxy
 *   - initiate   — prefer fileService.initiateUpload which auto-increments
 *
 * Works alongside MinIO bucket versioning. Each version has its own unique
 * s3Key AND records the native MinIO versionId for belt-and-suspenders safety.
 */

import prisma from '../db/prismaClient.js';
import { USER_NAME_SELECT_WITH_ID } from '../utils/userNameFields.js';
import { v4 as uuidv4 } from 'uuid';
import {
  generatePresignedPutUrl,
  generatePresignedGetUrl,
  streamObject,
  BUCKETS,
} from './minioService.js';
import { getDatabaseUserId } from '../utils/database/userResolver.js';


const ok = (payload) => ({ success: true, payload, timestamp: Date.now() });
const err = (code, message) => ({
  success: false,
  error: { code, message },
  timestamp: Date.now(),
});

function resolveBucket(input) {
  if (!input) return BUCKETS.PRIVATE;
  return BUCKETS[String(input).toUpperCase()] || BUCKETS.PRIVATE;
}

/**
 * List every version of a file (newest first).
 */
export async function listVersions(fileId, actorUserId, actorRoles = []) {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.isDeleted) return err('FILE_NOT_FOUND', 'File not found');

    // Skip auth check for public links (actorUserId is null)
    if (actorUserId !== null) {
      // Owner or someone with a share sees versions.
      const owns = file.ownerId === actorUserId;
      if (!owns) {
        // Get user roles if not provided
        let userRoles = actorRoles;
        if (!userRoles || userRoles.length === 0) {
          const user = await prisma.user.findUnique({
            where: { id: actorUserId },
            include: { roleAssignments: true }
          });
          
          // Fetch role codes separately since UserRoleAssignment doesn't have role relation
          const roleIds = user?.roleAssignments?.map(ra => ra.roleId) || [];
          const roles = await prisma.userRoles.findMany({
            where: { id: { in: roleIds } },
            select: { code: true }
          });
          userRoles = roles.map(r => r.code.toLowerCase());
        }

        const share = await prisma.fileShare.findFirst({
          where: {
            fileId,
            OR: [
              { subjectType: 'USER', subjectUserId: actorUserId },
              { subjectType: 'ROLE', subjectRole: { in: userRoles } },
            ],
          },
        });
        if (!share) return err('ACCESS_DENIED', 'Access denied');
      }
    }

    const versions = await prisma.fileVersion.findMany({
      where: { fileId },
      include: {
        uploadedBy: { select: USER_NAME_SELECT_WITH_ID },
      },
      orderBy: { versionNumber: 'desc' },
    });
    return ok(versions);
  } catch (error) {
    console.error('[fileVersionService.listVersions]', error);
    return err('LIST_VERSIONS_FAILED', error.message);
  }
}

/**
 * Make an older version the current one by flipping `isCurrent`
 * (no S3 copy). The previous current version is retained as history.
 */
export async function rollbackToVersion(versionId, actorUserId) {
  try {
    const target = await prisma.fileVersion.findUnique({
      where: { id: versionId },
      include: { file: true },
    });
    if (!target) return err('VERSION_NOT_FOUND', 'Version not found');
    if (target.file.ownerId !== actorUserId) {
      return err('ACCESS_DENIED', 'Only owner can rollback');
    }
    if (target.isCurrent) return ok({ message: 'Already current', versionId });

    // Check for name conflicts in the same folder
    const existingFile = await prisma.file.findFirst({
      where: {
        id: { not: target.fileId },
        folderId: target.file.folderId,
        name: target.file.name,
        isDeleted: false,
      },
    });

    if (existingFile) {
      return err('NAME_CONFLICT', 'A file with this name already exists in this folder. Restore not allowed to prevent conflicts.');
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.fileVersion.updateMany({
        where: { fileId: target.fileId, isCurrent: true },
        data: { isCurrent: false },
      });
      const current = await tx.fileVersion.update({
        where: { id: versionId },
        data: { isCurrent: true },
      });
      const updatedFile = await tx.file.update({
        where: { id: target.fileId },
        data: {
          currentVersionId: current.id,
          s3Key: current.s3Key,
          size: current.size,
          checksumSha256: current.checksumSha256,
        },
      });
      await tx.fileActivity.create({
        data: {
          fileId: target.fileId,
          userId: actorUserId,
          action: 'rollback_version',
          metadata: { versionId, versionNumber: target.versionNumber },
        },
      });
      return { file: updatedFile, version: current };
    });

    return ok(result);
  } catch (error) {
    console.error('[fileVersionService.rollbackToVersion]', error);
    return err('ROLLBACK_FAILED', error.message);
  }
}

/**
 * Presigned GET URL for a specific version (preview only — NEVER for sensitive
 * workflow documents; use `streamVersion` for those).
 */
export async function getVersionPreviewUrl(versionId, actorUserId) {
  try {
    const version = await prisma.fileVersion.findUnique({
      where: { id: versionId },
      include: { file: true },
    });
    if (!version) return err('VERSION_NOT_FOUND', 'Version not found');

    if (version.file.ownerId !== actorUserId) {
      const share = await prisma.fileShareV2.findFirst({
        where: {
          fileId: version.fileId,
          OR: [{ subjectType: 'USER', subjectUserId: actorUserId }],
        },
      });
      if (!share) return err('ACCESS_DENIED', 'Access denied');
    }

    const bucketReal = resolveBucket(version.file.bucket);
    const url = await generatePresignedGetUrl(bucketReal, version.s3Key);
    return ok({ url, version });
  } catch (error) {
    console.error('[fileVersionService.getVersionPreviewUrl]', error);
    return err('PREVIEW_VERSION_FAILED', error.message);
  }
}

/**
 * Stream a specific version through Express (proxied download).
 */
export async function streamVersion({ versionId, req, res, actorUserId }) {
  const version = await prisma.fileVersion.findUnique({
    where: { id: versionId },
    include: { file: true },
  });
  if (!version) {
    return res.status(404).json(err('VERSION_NOT_FOUND', 'Version not found'));
  }

  const bucketReal = resolveBucket(version.file.bucket);
  await prisma.fileActivity.create({
    data: {
      fileId: version.fileId,
      userId: actorUserId,
      action: 'download_version',
      metadata: { versionId, versionNumber: version.versionNumber },
    },
  });

  return streamObject({
    bucket: bucketReal,
    objectKey: version.s3Key,
    req,
    res,
    filename: `v${version.versionNumber}-${version.file.name}`,
    mimeType: version.file.mimeType,
  });
}

/**
 * Initiate an explicit new-version upload for a specific existing file.
 * Returns a presigned PUT URL + new versionId. Client then calls
 * fileService.completeUpload(fileId, versionId) to finalise.
 */
export async function initiateVersionUpload(fileId, keycloakUser, input = {}) {
  try {
    const userId = await getDatabaseUserId(keycloakUser);
    if (!userId) return err('USER_NOT_FOUND', 'User not found');

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });
    if (!file || file.isDeleted) return err('FILE_NOT_FOUND', 'File not found');
    if (file.ownerId !== userId) return err('ACCESS_DENIED', 'Only owner can add versions');

    const {
      name = file.name,
      mimeType = file.mimeType,
      size,
      changeNote = null,
    } = input;
    if (typeof size !== 'number' || size < 0) {
      return err('INVALID_INPUT', 'Size is required and must be a non-negative number');
    }

    const nextVersionNumber = (file.versions[0]?.versionNumber || 0) + 1;
    const bucketLogical = String(file.bucket).toUpperCase();
    const bucketReal = resolveBucket(bucketLogical);
    const shortUuid = uuidv4().slice(0, 8);
    const safeName = String(name).replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 120);
    const s3Key = `${bucketLogical}/${userId}/${fileId}/v${nextVersionNumber}-${shortUuid}-${safeName}`;

    const version = await prisma.fileVersion.create({
      data: {
        fileId,
        versionNumber: nextVersionNumber,
        s3Key,
        size,
        uploadedById: userId,
        changeNote,
        isCurrent: false,
      },
    });

    // If name/mime are changing, update when finalising.
    if (name !== file.name || mimeType !== file.mimeType) {
      await prisma.file.update({
        where: { id: fileId },
        data: { name, mimeType },
      });
    }

    const presignedUrl = await generatePresignedPutUrl(bucketReal, s3Key);

    return ok({
      fileId,
      versionId: version.id,
      versionNumber: nextVersionNumber,
      s3Key,
      presignedUrl,
    });
  } catch (error) {
    console.error('[fileVersionService.initiateVersionUpload]', error);
    return err('VERSION_INIT_FAILED', error.message);
  }
}

// Back-compat aliases used by existing controller.
export const getFileVersions = listVersions;
export const restoreVersion = rollbackToVersion;
export const uploadNewVersion = initiateVersionUpload;

export default {
  listVersions,
  rollbackToVersion,
  getVersionPreviewUrl,
  streamVersion,
  initiateVersionUpload,
  getFileVersions,
  restoreVersion,
  uploadNewVersion,
};
