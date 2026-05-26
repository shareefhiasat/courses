/**
 * File Service — orchestrates file lifecycle (upload, list, update, trash,
 * restore, preview, download) while keeping MinIO as the storage backend and
 * Postgres as the metadata source of truth.
 *
 * Upload pipeline (DUAL-VERSIONING):
 *   1. initiateUpload():
 *        - If (folderId, name, owner) already exists -> it's a re-upload:
 *          we create a NEW FileVersion row for the existing File, with a
 *          unique s3Key and is_current=false.
 *        - Else -> create File + first FileVersion (is_current=false).
 *        - Return a presigned PUT URL.
 *   2. Client PUTs the object directly to MinIO.
 *   3. completeUpload():
 *        - Verify the object exists (statObject) and capture MinIO's native
 *          versionId + etag as a double-record safety net.
 *        - Inside a transaction:
 *            a. Flip previous version's is_current=false (if any).
 *            b. Flip the new version's is_current=true.
 *            c. Update files.currentVersionId, size, mimeType, checksum.
 *        - Append a file_activity entry.
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  generatePresignedPutUrl,
  generatePresignedGetUrl,
  getObjectMetadata,
  streamObject,
  isInlinePreviewable,
  BUCKETS,
} from './minioService.js';
import { mapBucketName } from '../constants/driveConstants.js';
import { getDatabaseUserId } from '../utils/userResolver.js';
import { LMS_ROLES } from './keycloakAdminService.js';

const prisma = new PrismaClient();

const ok = (payload) => ({ success: true, payload, timestamp: Date.now() });
const err = (code, message, extra = {}) => ({
  success: false,
  error: { code, message, ...extra },
  timestamp: Date.now(),
});

/**
 * Build the S3 key for a specific version of a file.
 * Pattern: {bucketLogical}/{ownerId}/{fileId}/v{versionNumber}-{shortUuid}-{safeName}
 */
function buildVersionKey({ bucketLogical, ownerId, fileId, versionNumber, name }) {
  const shortUuid = uuidv4().slice(0, 8);
  const safeName = String(name).replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 120);
  return `${bucketLogical}/${ownerId}/${fileId}/v${versionNumber}-${shortUuid}-${safeName}`;
}

function resolveBucket(input) {
  if (!input) return BUCKETS.PRIVATE;
  const logical = String(input).toUpperCase();
  return BUCKETS[logical] || BUCKETS.PRIVATE;
}

// ============================================================================
// Upload pipeline
// ============================================================================

/**
 * Initiate an upload. Transparently handles new-file AND re-upload-of-same-name
 * (which becomes a new version).
 *
 * @param {string|object} keycloakUser - Keycloak id or user object
 * @param {object} input
 * @param {string} input.name
 * @param {string} input.mimeType
 * @param {number} input.size
 * @param {string} input.bucket           - logical bucket name (PRIVATE|SHARED|WORKFLOW)
 * @param {string|null} [input.folderId]
 * @param {string|null} [input.folderPath] - for legacy compat
 * @param {string|null} [input.changeNote]
 */
export async function initiateUpload(keycloakUser, input) {
  try {
    const userId = await getDatabaseUserId(keycloakUser);
    if (!userId) return err('USER_NOT_FOUND', 'User not found for the provided identity');

    const { name, mimeType, size, bucket, folderId = null, folderPath = null, changeNote = null } = input;
    if (!name || !mimeType || typeof size !== 'number' || size < 0) {
      return err('INVALID_INPUT', 'Missing/invalid name, mimeType, or size');
    }

    const bucketLogical = (bucket || 'PRIVATE').toUpperCase();
    const bucketReal = resolveBucket(bucketLogical);

    // Detect re-upload: same folder + same name for this owner.
    const existing = await prisma.file.findFirst({
      where: {
        ownerId: userId,
        name,
        folderId,
        isDeleted: false,
      },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    let file;
    let nextVersionNumber;

    if (existing) {
      file = existing;
      nextVersionNumber = (existing.versions[0]?.versionNumber || 0) + 1;
    } else {
      nextVersionNumber = 1;
      const fileId = uuidv4();
      const tempKey = `${bucketLogical}/${userId}/${fileId}/placeholder`;
      file = await prisma.file.create({
        data: {
          id: fileId,
          s3Key: tempKey, // overwritten when the first version becomes current
          bucket: mapBucketName(bucketLogical),
          name,
          mimeType,
          size,
          ownerId: userId,
          folderId,
          folderPath,
        },
      });
    }

    const s3Key = buildVersionKey({
      bucketLogical,
      ownerId: userId,
      fileId: file.id,
      versionNumber: nextVersionNumber,
      name,
    });

    const version = await prisma.fileVersion.create({
      data: {
        fileId: file.id,
        versionNumber: nextVersionNumber,
        s3Key,
        size,
        uploadedById: userId,
        changeNote,
        isCurrent: false,
      },
    });

    const presignedUrl = await generatePresignedPutUrl(bucketReal, s3Key);

    return ok({
      fileId: file.id,
      versionId: version.id,
      versionNumber: nextVersionNumber,
      s3Key,
      presignedUrl,
      isNewFile: !existing,
    });
  } catch (error) {
    console.error('[fileService.initiateUpload]', error);
    return err('UPLOAD_INIT_FAILED', error.message);
  }
}

/**
 * Finalise an upload: verify the object, record MinIO's native versionId,
 * atomically flip is_current, and update the parent File row.
 *
 * @param {string} fileId
 * @param {string} versionId
 * @param {object} [meta] - optional `{ checksum }` supplied by the client
 */
export async function completeUpload(fileId, versionId, meta = {}) {
  try {
    const version = await prisma.fileVersion.findUnique({
      where: { id: versionId },
      include: { file: true },
    });
    if (!version || version.fileId !== fileId) {
      return err('VERSION_NOT_FOUND', 'Version not found or does not belong to file');
    }
    if (version.isCurrent) {
      return err('ALREADY_FINALISED', 'Version is already marked current');
    }

    const file = version.file;
    const bucketReal = resolveBucket(file.bucket);

    // Verify with MinIO. This confirms the PUT actually happened.
    let stat;
    try {
      stat = await getObjectMetadata(bucketReal, version.s3Key);
    } catch (minioErr) {
      return err('UPLOAD_NOT_FOUND_IN_STORAGE', `Object missing in MinIO: ${minioErr.message}`);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Clear previous current version (if any).
      await tx.fileVersion.updateMany({
        where: { fileId, isCurrent: true },
        data: { isCurrent: false },
      });

      // Mark this version current + record MinIO's native versionId.
      const currentVersion = await tx.fileVersion.update({
        where: { id: versionId },
        data: {
          isCurrent: true,
          minioVersionId: stat.versionId,
          checksumSha256: meta.checksum || null,
          size: stat.size, // trust storage over client-declared size
        },
      });

      // Update the File to point at the new current version + cached metadata.
      const updatedFile = await tx.file.update({
        where: { id: fileId },
        data: {
          currentVersionId: currentVersion.id,
          s3Key: currentVersion.s3Key,
          size: currentVersion.size,
          checksumSha256: currentVersion.checksumSha256,
        },
      });

      await tx.fileActivity.create({
        data: {
          fileId,
          userId: version.uploadedById,
          action: currentVersion.versionNumber === 1 ? 'upload' : 'version_upload',
          metadata: {
            versionId: currentVersion.id,
            versionNumber: currentVersion.versionNumber,
            size: currentVersion.size,
            minioVersionId: stat.versionId,
          },
        },
      });

      return { file: updatedFile, version: currentVersion };
    });

    return ok(result);
  } catch (error) {
    console.error('[fileService.completeUpload]', error);
    return err('UPLOAD_COMPLETE_FAILED', error.message);
  }
}

// ============================================================================
// Read / list
// ============================================================================

export async function getFileById(fileId, actorUserId) {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        owner: { select: { id: true, keycloakId: true, email: true, displayName: true } },
        folder: { select: { id: true, name: true, path: true } },
        currentVersion: true,
        versions: { orderBy: { versionNumber: 'desc' }, take: 10 },
      },
    });
    if (!file || file.isDeleted) return err('FILE_NOT_FOUND', 'File not found');

    // NOTE: permission service will take over this check in PR #5. For now,
    // require owner or a legacy v1 share row.
    const owns = file.ownerId === actorUserId;
    const hasLegacyShare = !owns
      ? await prisma.fileShare.findFirst({ where: { fileId, sharedWithId: actorUserId } })
      : null;
    const hasV2Share = !owns
      ? await prisma.fileShareV2.findFirst({
          where: {
            fileId,
            OR: [
              { subjectType: 'USER', subjectUserId: actorUserId },
            ],
          },
        })
      : null;
    if (!owns && !hasLegacyShare && !hasV2Share) return err('ACCESS_DENIED', 'Access denied');

    return ok(file);
  } catch (error) {
    console.error('[fileService.getFileById]', error);
    return err('GET_FILE_FAILED', error.message);
  }
}

/**
 * List files for the current user (owned + shared + public-role) with
 * filter/search/sort/paginate support.
 */
export async function listFiles(keycloakUser, {
  folderId,
  folderPath,
  bucket,
  search,
  mimeTypePrefix,
  modifiedAfter,
  sortField = 'updatedAt',
  sortOrder = 'desc',
  page = 1,
  pageSize = 50,
  includeDeleted = false,
  deletedOnly = false,
  starredOnly = false,
  rootOnly = false,
  ownedOnly = false,
  sharedOnly = false,
} = {}) {
  try {
    const userId = await getDatabaseUserId(keycloakUser);
    if (!userId) return err('USER_NOT_FOUND', 'User not found');

    const where = {
      isDeleted: deletedOnly ? true : includeDeleted ? undefined : false,
    };

    // Ownership filter
    if (ownedOnly) {
      where.ownerId = userId;
    } else if (sharedOnly) {
      where.ownerId = { not: userId };
      where.shares = { some: { subjectType: 'USER', subjectUserId: userId } };
    } else {
      where.OR = [
        { ownerId: userId },
        { shares: { some: { subjectType: 'USER', subjectUserId: userId } } },
      ];
    }

    if (folderId !== undefined && folderId !== null && folderId !== '') {
      where.folderId = folderId;
    } else if (rootOnly) {
      where.folderId = null;
    }
    if (folderPath !== undefined) where.folderPath = folderPath;
    if (bucket) where.bucket = mapBucketName(bucket);

    // Mime type filter — supports comma-separated prefixes via AND
    if (mimeTypePrefix) {
      const prefixes = mimeTypePrefix.split(',').map(p => p.trim()).filter(Boolean);
      if (prefixes.length === 1) {
        where.mimeType = { startsWith: prefixes[0] };
      } else if (prefixes.length > 1) {
        const mimeConditions = prefixes.map(prefix => ({ mimeType: { startsWith: prefix } }));
        const hasOwnershipOr = Array.isArray(where.OR);
        if (hasOwnershipOr) {
          // Wrap existing OR + mime OR inside AND
          where.AND = [
            { OR: where.OR },
            { OR: mimeConditions },
          ];
          delete where.OR;
        } else {
          where.OR = mimeConditions;
        }
      }
    }

    if (modifiedAfter) where.updatedAt = { gte: new Date(modifiedAfter) };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (starredOnly) where.isStarred = true;

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        include: {
          owner: { select: { id: true, keycloakId: true, email: true, displayName: true, firstName: true, lastName: true } },
          currentVersion: { select: { versionNumber: true, size: true, createdAt: true } },
        },
        orderBy: { [sortField]: sortOrder },
        skip: Math.max(0, (page - 1) * pageSize),
        take: Math.min(200, pageSize),
      }),
      prisma.file.count({ where }),
    ]);

    // Add workflow counts for each file
    const fileIds = files.map(f => f.id);
    let workflowInstances = [];
    let workflowDocuments = [];
    try {
      workflowInstances = await prisma.workflowInstance.findMany({
        where: { fileId: { in: fileIds } },
        select: { fileId: true, status: true },
      });
      workflowDocuments = await prisma.workflowDocument.findMany({
        where: { fileId: { in: fileIds } },
        select: { fileId: true, status: true, fileVersionId: true },
      });
    } catch (error) {
      console.error('[fileService.listFiles] Failed to fetch workflow counts:', error);
      // Continue without workflow counts if query fails
    }

    // Aggregate workflow counts by file and status
    const workflowCountsMap = {};
    const workflowVersionMap = {}; // Map fileId to captured version ID
    
    // Process WorkflowInstance
    workflowInstances.forEach(instance => {
      if (!workflowCountsMap[instance.fileId]) {
        workflowCountsMap[instance.fileId] = {
          pending: 0,
          in_progress: 0,
          completed: 0,
          rejected: 0,
          needs_feedback: 0,
        };
      }
      const statusMap = {
        PENDING: 'pending',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        REJECTED: 'rejected',
        NEEDS_FEEDBACK: 'needs_feedback',
      };
      const mappedStatus = statusMap[instance.status] || 'pending';
      workflowCountsMap[instance.fileId][mappedStatus]++;
    });

    // Process WorkflowDocument (map to similar statuses)
    workflowDocuments.forEach(doc => {
      if (!workflowCountsMap[doc.fileId]) {
        workflowCountsMap[doc.fileId] = {
          pending: 0,
          in_progress: 0,
          completed: 0,
          rejected: 0,
          needs_feedback: 0,
        };
      }
      const statusMap = {
        DRAFT: 'pending',
        SUBMITTED: 'in_progress',
        UNDER_REVIEW: 'in_progress',
        APPROVED: 'completed',
        REJECTED: 'rejected',
        NEEDS_REVISION: 'needs_feedback',
      };
      const mappedStatus = statusMap[doc.status] || 'pending';
      workflowCountsMap[doc.fileId][mappedStatus]++;
      
      // Store the captured version ID for this file
      if (doc.fileVersionId) {
        workflowVersionMap[doc.fileId] = doc.fileVersionId;
      }
    });

    // Add share counts for each file (people + groups)
    let fileShares = [];
    try {
      fileShares = await prisma.fileShare.findMany({
        where: { fileId: { in: fileIds } },
        select: { fileId: true, subjectType: true },
      });
    } catch (error) {
      console.error('[fileService.listFiles] Failed to fetch share counts:', error);
      // Continue without share counts if query fails
    }

    // Aggregate share counts by file
    const shareCountsMap = {};
    fileShares.forEach(share => {
      if (!shareCountsMap[share.fileId]) {
        shareCountsMap[share.fileId] = {
          people: 0,
          groups: 0,
        };
      }
      if (share.subjectType === 'USER') {
        shareCountsMap[share.fileId].people++;
      } else if (share.subjectType === 'GROUP') {
        shareCountsMap[share.fileId].groups++;
      }
    });

    // Add public link counts for each file
    let publicLinks = [];
    try {
      publicLinks = await prisma.publicLink.findMany({
        where: { 
          fileId: { in: fileIds },
          revokedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        },
        select: { fileId: true },
      });
    } catch (error) {
      console.error('[fileService.listFiles] Failed to fetch public link counts:', error);
      // Continue without public link counts if query fails
    }

    // Aggregate public link counts by file
    const publicLinkCountsMap = {};
    publicLinks.forEach(link => {
      if (!publicLinkCountsMap[link.fileId]) {
        publicLinkCountsMap[link.fileId] = 0;
      }
      publicLinkCountsMap[link.fileId]++;
    });

    // Attach workflow and share counts to each file
    const filesWithCounts = files.map(file => {
      const counts = workflowCountsMap[file.id] || {
        pending: 0,
        in_progress: 0,
        completed: 0,
        rejected: 0,
        needs_feedback: 0,
      };
      const shares = shareCountsMap[file.id] || {
        people: 0,
        groups: 0,
      };
      const publicLinksCount = publicLinkCountsMap[file.id] || 0;
      
      // Get workflow version number if this file has a workflow with a captured version
      let workflowVersionNumber = null;
      if (workflowVersionMap[file.id] && file.versions) {
        const snapshotVersion = file.versions.find(v => v.id === workflowVersionMap[file.id]);
        if (snapshotVersion) {
          workflowVersionNumber = snapshotVersion.versionNumber;
        }
      }
      
      console.log('[fileService.listFiles] File:', file.id, file.name, 'workflowCounts:', counts, 'shareCounts:', shares, 'publicLinksCount:', publicLinksCount, 'workflowVersionNumber:', workflowVersionNumber);
      return {
        ...file,
        workflowCounts: counts,
        shareCounts: shares,
        publicLinksCount,
        versionCount: file.versions?.length || 1,
        versionNumber: file.currentVersion?.versionNumber || 1,
        workflowVersionNumber, // Add the captured workflow version number
      };
    });

    return ok({ files: filesWithCounts, total, page, pageSize });
  } catch (error) {
    console.error('[fileService.listFiles]', error);
    return err('LIST_FILES_FAILED', error.message);
  }
}

// ============================================================================
// Update / trash / restore / permanent delete
// ============================================================================

export async function updateFile(fileId, actorUserId, updates) {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.isDeleted) return err('FILE_NOT_FOUND', 'File not found');
    if (file.ownerId !== actorUserId) return err('ACCESS_DENIED', 'Only owner can update');

    // Allow only a whitelist of mutable fields.
    const safe = {};
    ['name', 'folderId', 'folderPath', 'isStarred'].forEach((k) => {
      if (updates[k] !== undefined) safe[k] = updates[k];
    });

    const updated = await prisma.file.update({ where: { id: fileId }, data: safe });
    await prisma.fileActivity.create({
      data: { fileId, userId: actorUserId, action: 'RENAME', metadata: safe },
    });
    return ok(updated);
  } catch (error) {
    console.error('[fileService.updateFile]', error);
    return err('UPDATE_FAILED', error.message);
  }
}

export async function softDeleteFile(fileId, actorUserId, actorRoles = []) {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return err('FILE_NOT_FOUND', 'File not found');
    if (file.ownerId !== actorUserId) return err('ACCESS_DENIED', 'Only owner can trash');

    // Check if file is shared (unless super_admin)
    const isSuperAdmin = actorRoles.includes(LMS_ROLES.SUPER_ADMIN);
    if (!isSuperAdmin) {
      const { isFileShared } = await import('./fileShareService.js');
      const shared = await isFileShared(fileId);
      if (shared) {
        return err('FILE_SHARED', 'Cannot delete shared files. Remove shares first.');
      }

      // Check workflow status
      const workflowStatus = await getFileWorkflowStatus(fileId, actorUserId);
      if (workflowStatus.hasWorkflow) {
        if (workflowStatus.status !== 'REJECTED') {
          return err('WORKFLOW_ACTIVE', 'Cannot delete files with active workflows.');
        }
        if (!workflowStatus.isOwner) {
          return err('WORKFLOW_NOT_OWNER', 'Only the workflow owner can delete rejected workflow files.');
        }
      }
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: actorUserId },
    });
    await prisma.fileActivity.create({
      data: { fileId, userId: actorUserId, action: 'DELETE' },
    });
    return ok(updated);
  } catch (error) {
    console.error('[fileService.softDeleteFile]', error);
    return err('SOFT_DELETE_FAILED', error.message);
  }
}

export async function restoreFile(fileId, actorUserId) {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return err('FILE_NOT_FOUND', 'File not found');
    if (file.ownerId !== actorUserId) return err('ACCESS_DENIED', 'Only owner can restore');

    // Check for name conflicts in the same folder
    const existingFile = await prisma.file.findFirst({
      where: {
        id: { not: fileId },
        folderId: file.folderId,
        name: file.name,
        isDeleted: false,
      },
    });

    if (existingFile) {
      return err('NAME_CONFLICT', 'A file with this name already exists in this folder. Restore not allowed to prevent conflicts.');
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { isDeleted: false, deletedAt: null, deletedById: null },
    });
    await prisma.fileActivity.create({
      data: { fileId, userId: actorUserId, action: 'RESTORE' },
    });
    return ok(updated);
  } catch (error) {
    console.error('[fileService.restoreFile]', error);
    return err('RESTORE_FAILED', error.message);
  }
}

/**
 * Get workflow status for a file
 * Returns whether file has a workflow, its status, and if the user is the owner
 */
export async function getFileWorkflowStatus(fileId, userId) {
  try {
    const workflow = await prisma.workflowInstance.findFirst({
      where: { fileId },
      include: { initiatedBy: true },
    });

    if (!workflow) {
      return { hasWorkflow: false };
    }

    return {
      hasWorkflow: true,
      status: workflow.status,
      isOwner: workflow.initiatedById === userId,
    };
  } catch (error) {
    console.error('[fileService.getFileWorkflowStatus]', error);
    return { hasWorkflow: false };
  }
}

/**
 * Check if a file can be deleted and return the reason if not
 */
export async function canDeleteFile(fileId, userId, roles = []) {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return { canDelete: false, reason: 'FILE_NOT_FOUND' };
    if (file.ownerId !== userId) return { canDelete: false, reason: 'NOT_OWNER' };

    const isSuperAdmin = roles.includes(LMS_ROLES.SUPER_ADMIN);
    if (isSuperAdmin) return { canDelete: true };

    const { isFileShared } = await import('./fileShareService.js');
    const shared = await isFileShared(fileId);
    if (shared) return { canDelete: false, reason: 'FILE_SHARED' };

    const workflowStatus = await getFileWorkflowStatus(fileId, userId);
    if (workflowStatus.hasWorkflow) {
      if (workflowStatus.status !== 'REJECTED') {
        return { canDelete: false, reason: 'WORKFLOW_ACTIVE' };
      }
      if (!workflowStatus.isOwner) {
        return { canDelete: false, reason: 'WORKFLOW_NOT_OWNER' };
      }
    }

    return { canDelete: true };
  } catch (error) {
    console.error('[fileService.canDeleteFile]', error);
    return { canDelete: false, reason: 'ERROR' };
  }
}

/**
 * Hard-delete: removes ALL MinIO versions then removes the DB row.
 * Normally called by the purge cron, but also exposed as an admin escape hatch.
 */
export async function permanentDeleteFile(fileId, actorUserId) {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { versions: true },
    });
    if (!file) return err('FILE_NOT_FOUND', 'File not found');
    if (file.ownerId !== actorUserId) return err('ACCESS_DENIED', 'Only owner can hard-delete');

    const bucketReal = resolveBucket(file.bucket);
    const { deleteObject, deleteObjectVersion } = await import('./minioService.js');

    for (const v of file.versions) {
      if (v.minioVersionId) {
        await deleteObjectVersion(bucketReal, v.s3Key, v.minioVersionId).catch(() => {});
      } else {
        await deleteObject(bucketReal, v.s3Key).catch(() => {});
      }
    }

    await prisma.file.delete({ where: { id: fileId } });
    return ok({ message: 'File permanently deleted', fileId });
  } catch (error) {
    console.error('[fileService.permanentDeleteFile]', error);
    return err('PERMANENT_DELETE_FAILED', error.message);
  }
}

// ============================================================================
// Preview & download
// ============================================================================

/**
 * Return a short-lived presigned GET URL for inline preview of safe types,
 * or a signal to use the proxy download for everything else.
 * @param {string} fileId - File ID
 * @param {number} actorUserId - User ID
 * @param {string} fileVersionId - Optional specific file version ID for workflow snapshots
 */
export async function getPreviewUrl(fileId, actorUserId, fileVersionId = null) {
  console.log('[fileService.getPreviewUrl] Request:', { fileId, actorUserId, fileVersionId });
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    console.log('[fileService.getPreviewUrl] File found:', file ? { id: file.id, name: file.name, isDeleted: file.isDeleted, s3Key: file.s3Key } : null);
    if (!file || file.isDeleted) return err('FILE_NOT_FOUND', 'File not found');

    // Check if file has a placeholder key (incomplete upload)
    if (file.s3Key && file.s3Key.includes('/placeholder')) {
      console.log('[fileService.getPreviewUrl] File has placeholder key, upload not complete');
      return err('FILE_NOT_READY', 'File upload not completed');
    }

    // Check if file has no versions
    const versionCount = await prisma.fileVersion.count({ where: { fileId } });
    console.log('[fileService.getPreviewUrl] Version count:', versionCount);
    if (versionCount === 0) {
      console.log('[fileService.getPreviewUrl] No versions found');
      return err('FILE_NOT_READY', 'File upload not completed');
    }

    const bucketReal = resolveBucket(file.bucket);

    // Check if it's an office document that should use Collabora
    const isOfficeDocument = file.mimeType?.includes('word') ||
                           file.mimeType?.includes('document') ||
                           file.mimeType?.includes('presentation') ||
                           file.mimeType?.includes('spreadsheet') ||
                           file.mimeType?.includes('excel') ||
                           file.mimeType?.includes('powerpoint') ||
                           file.mimeType?.includes('officedocument');

    if (isOfficeDocument) {
      const { generateWopiToken } = await import('./wopiService.js');

      // Get user info for WOPI context
      const user = await prisma.user.findUnique({ where: { id: actorUserId } });
      const userInfo = {
        displayName: user?.displayName || 'User',
        email: user?.email || '',
        id: user?.id || actorUserId,
      };

      // If fileVersionId is provided, use read-only permission to preserve snapshot
      // Default to read-only (view mode) for preview, user can explicitly edit if needed
      const permission = 'read';
      const wopiToken = generateWopiToken(actorUserId, fileId, permission, userInfo, fileVersionId);

      await prisma.fileActivity.create({
        data: { fileId, userId: actorUserId, action: 'preview' },
      });

      return ok({ mode: 'collabora', wopiToken });
    }

    if (!isInlinePreviewable(file.mimeType)) {
      return ok({ mode: 'download' });
    }
    // Use backend proxy URL instead of direct MinIO presigned URL to avoid mixed content
    const url = `/api/v1/drive/files/${fileId}/download${fileVersionId ? `?versionId=${fileVersionId}` : ''}`;

    await prisma.fileActivity.create({
      data: { fileId, userId: actorUserId, action: 'preview' },
    });
    return ok({ mode: 'inline', url, mimeType: file.mimeType });
  } catch (error) {
    console.error('[fileService.getPreviewUrl]', error);
    return err('PREVIEW_FAILED', error.message);
  }
}

/**
 * Stream a file through Express (no presigned URL exposure).
 * Caller is responsible for auth + permission check BEFORE invoking this.
 * @param {object} args
 * @param {string} args.fileId
 * @param {object} args.req
 * @param {object} args.res
 * @param {number} args.actorUserId
 * @param {string} args.versionId - Optional specific file version ID for workflow snapshots
 */
export async function streamFile({ fileId, req, res, actorUserId, versionId = null }) {
  console.log('[streamFile] Starting download for fileId:', fileId, 'actorUserId:', actorUserId, 'versionId:', versionId);
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  console.log('[streamFile] File found:', file ? { id: file.id, name: file.name, bucket: file.bucket, s3Key: file.s3Key } : null);
  if (!file || file.isDeleted) {
    console.log('[streamFile] File not found or deleted');
    return res.status(404).json(err('FILE_NOT_FOUND', 'File not found'));
  }

  // Check ownership or share access
  const owns = file.ownerId === actorUserId;
  console.log('[streamFile] Ownership check:', { owns, ownerId: file.ownerId, actorUserId });
  if (!owns) {
    const share = await prisma.fileShareV2.findFirst({
      where: {
        fileId,
        OR: [
          { subjectType: 'USER', subjectUserId: actorUserId },
        ],
      },
    });
    console.log('[streamFile] Share check:', share ? { id: share.id, subjectType: share.subjectType } : null);
    if (!share) return res.status(403).json(err('ACCESS_DENIED', 'Access denied'));
  }

  let s3Key;
  let bucketName;

  // If versionId is provided, use that specific version
  if (versionId) {
    console.log('[streamFile] Using specific version:', versionId);
    const fileVersion = await prisma.fileVersion.findUnique({
      where: { id: versionId }
    });
    if (fileVersion && fileVersion.fileId === fileId) {
      s3Key = fileVersion.s3Key;
      bucketName = file.bucket;
      console.log('[streamFile] Using version s3Key:', s3Key);
    } else {
      console.warn('[streamFile] File version not found or mismatch, falling back to current');
    }
  }

  // If no versionId or version not found, get latest version's s3Key
  if (!s3Key) {
    const latestVersion = await prisma.fileVersion.findFirst({
      where: { fileId, isCurrent: true },
      orderBy: { versionNumber: 'desc' },
    });
    console.log('[streamFile] Latest version:', latestVersion ? { id: latestVersion.id, versionNumber: latestVersion.versionNumber, s3Key: latestVersion.s3Key } : null);

    if (latestVersion && latestVersion.s3Key) {
      s3Key = latestVersion.s3Key;
      bucketName = file.bucket;
      console.log('[streamFile] Using version s3Key:', s3Key);
    } else if (file.s3Key) {
      s3Key = file.s3Key;
      bucketName = file.bucket;
      console.log('[streamFile] Using file s3Key:', s3Key);
    } else {
      console.log('[streamFile] No s3Key found in version or file');
      return res.status(404).json(err('FILE_NOT_FOUND', 'No file content available'));
    }
  }

  const bucketReal = resolveBucket(bucketName);
  console.log('[streamFile] Bucket mapping:', { bucketName, bucketReal });

  await prisma.fileActivity.create({
    data: { fileId, userId: actorUserId, action: 'DOWNLOAD' },
  });

  console.log('[streamFile] Streaming object with:', { bucket: bucketReal, objectKey: s3Key, filename: file.name });

  try {
    return await streamObject({
      bucket: bucketReal,
      objectKey: s3Key,
      req,
      res,
      filename: file.name,
      mimeType: file.mimeType,
    });
  } catch (error) {
    console.log('[streamFile] Stream failed with error:', error.message);
    // If the s3Key doesn't exist (legacy file), try to find the object by listing objects in the bucket
    if (error.code === 'NotFound' || error.message.includes('Not Found')) {
      console.log('[streamFile] Object not found, attempting to find by listing bucket');
      const { minioClient } = await import('./minioService.js');
      try {
        const prefix = `${file.bucket}/${file.ownerId}/${file.id}/`;
        console.log('[streamFile] Listing objects with prefix:', prefix);
        const objectsStream = minioClient.listObjects(bucketReal, prefix, true);
        const objects = [];
        for await (const obj of objectsStream) {
          objects.push(obj);
        }
        console.log('[streamFile] Found objects:', objects.length);
        if (objects.length > 0) {
          // Use the first object found
          const fallbackKey = objects[0].name;
          console.log('[streamFile] Using fallback key:', fallbackKey);
          return await streamObject({
            bucket: bucketReal,
            objectKey: fallbackKey,
            req,
            res,
            filename: file.name,
            mimeType: file.mimeType,
          });
        }
      } catch (listError) {
        console.error('[streamFile] Failed to list objects:', listError);
      }
    }
    throw error;
  }
}

// ============================================================================
// Legacy helpers (kept temporarily so existing controllers keep compiling)
// Will be removed once PR #5 (new sharing endpoints) lands.
// ============================================================================

export async function addComment(fileId, userId, content) {
  try {
    const row = await prisma.fileComment.create({
      data: { fileId, userId, content },
    });
    return ok(row);
  } catch (error) {
    return err('ADD_COMMENT_FAILED', error.message);
  }
}

export async function generatePublicLink(fileId, keycloakUser, expiryDays = 7) {
  try {
    const userId = await getDatabaseUserId(keycloakUser);
    if (!userId) return err('USER_NOT_FOUND', 'User not found');
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.ownerId !== userId) return err('ACCESS_DENIED', 'Access denied');

    const token = uuidv4().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const link = await prisma.publicLink.create({
      data: { fileId, token, expiresAt, createdById: userId },
    });
    await prisma.fileActivity.create({
      data: { fileId, userId, action: 'public_link_created', metadata: { expiryDays } },
    });

    const base = process.env.PUBLIC_LINK_BASE_URL || '';
    return ok({ publicUrl: `${base}/${token}`, token: link.token, expiresAt: link.expiresAt });
  } catch (error) {
    console.error('[fileService.generatePublicLink]', error);
    return err('PUBLIC_LINK_FAILED', error.message);
  }
}

export async function getFileByPublicToken(token) {
  try {
    const link = await prisma.publicLink.findUnique({
      where: { token },
      include: { file: { include: { owner: { select: { id: true, displayName: true } } } } },
    });
    if (!link || link.revokedAt) return err('INVALID_TOKEN', 'Invalid or revoked link');
    if (link.expiresAt && link.expiresAt < new Date()) return err('INVALID_TOKEN', 'Link expired');
    if (!link.file || link.file.isDeleted) return err('FILE_NOT_FOUND', 'File no longer available');

    const bucketReal = resolveBucket(link.file.bucket);
    const presignedUrl = await generatePresignedGetUrl(bucketReal, link.file.s3Key);
    return ok({ ...link.file, presignedUrl });
  } catch (error) {
    console.error('[fileService.getFileByPublicToken]', error);
    return err('GET_PUBLIC_FILE_FAILED', error.message);
  }
}

export async function toggleStarFile(fileId, actorUserId) {
  try {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return err('FILE_NOT_FOUND', 'File not found');

    // Allow starring if user is owner or has access via shares
    const hasAccess = file.ownerId === actorUserId || await prisma.fileShare.findFirst({
      where: {
        fileId,
        subjectType: 'USER',
        subjectUserId: actorUserId,
      },
    });

    if (!hasAccess) {
      console.error('[toggleStarFile] Access denied for user', actorUserId, 'on file', fileId, 'owner', file.ownerId);
      return err('ACCESS_DENIED', 'Access denied');
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { isStarred: !file.isStarred },
    });
    await prisma.fileActivity.create({
      data: { fileId, userId: actorUserId, action: updated.isStarred ? 'starred' : 'unstarred' },
    });
    return ok(updated);
  } catch (error) {
    console.error('[toggleStarFile] Error:', error);
    return err('TOGGLE_STAR_FAILED', error.message);
  }
}

/**
 * Back-compat shim: old controllers still call deleteFile expecting a soft delete.
 */
export const deleteFile = softDeleteFile;

/**
 * Minimal createFolder using the new Folder model. A dedicated folderService
 * (PR #4) will expand this with move/rename/tree listing.
 *
 * @param {string|object} keycloakUser
 * @param {object} input
 * @param {string} input.name
 * @param {string|null} [input.parentId]
 * @param {boolean} [input.isPrivate]
 */
export async function createFolder(keycloakUser, input) {
  try {
    const userId = await getDatabaseUserId(keycloakUser);
    if (!userId) return err('USER_NOT_FOUND', 'User not found');

    const { name, parentId = null, isPrivate = false } = input || {};
    if (!name) return err('INVALID_INPUT', 'Folder name required');

    let parentPath = '';
    if (parentId) {
      const parent = await prisma.folder.findUnique({ where: { id: parentId } });
      if (!parent || parent.isDeleted) return err('PARENT_NOT_FOUND', 'Parent folder not found');
      parentPath = parent.path;
    }
    const path = parentPath ? `${parentPath}/${name}` : `/${name}`;

    const folder = await prisma.folder.create({
      data: { name, parentId, ownerId: userId, path, isPrivate },
    });
    return ok(folder);
  } catch (error) {
    if (error?.code === 'P2002') {
      return err('FOLDER_EXISTS', 'A folder with this name already exists at this location');
    }
    console.error('[fileService.createFolder]', error);
    return err('CREATE_FOLDER_FAILED', error.message);
  }
}

export default {
  initiateUpload,
  completeUpload,
  getFileById,
  listFiles,
  updateFile,
  softDeleteFile,
  deleteFile,
  restoreFile,
  permanentDeleteFile,
  getPreviewUrl,
  streamFile,
  addComment,
  generatePublicLink,
  getFileByPublicToken,
  toggleStarFile,
  createFolder,
  getFileWorkflowStatus,
  canDeleteFile,
};
