/**
 * File Share Service
 *
 * Manages the unified `file_shares` ACL table which supports:
 *   - files AND folders
 *   - USER and ROLE subjects
 *   - optional expiry
 *
 * Legacy `fileShare` rows (file_shares) are still read by getSharedFiles for
 * backwards compatibility. New writes go exclusively through v2.
 */

import prisma from '../db/prismaClient.js';
import { Prisma } from '@prisma/client';
import { getDatabaseUserId } from '../utils/database/userResolver.js';
import { SHARE_SUBJECT_TYPES, SHARE_PERMISSIONS } from '../constants/driveConstants.js';


const ok = (data) => ({ success: true, data, timestamp: Date.now() });
const err = (code, message) => ({
  success: false,
  error: { code, message },
  timestamp: Date.now(),
});

const VALID_PERMISSIONS = new Set(Object.values(SHARE_PERMISSIONS));

/**
 * Create or update a share.
 *
 * @param {object} input
 * @param {string} [input.fileId]          - file to share (or folderId)
 * @param {string} [input.folderId]        - folder to share (or fileId)
 * @param {'USER'|'ROLE'} input.subjectType
 * @param {number} [input.subjectUserId]   - when subjectType=USER
 * @param {string} [input.subjectRole]     - when subjectType=ROLE (Keycloak role code)
 * @param {string} [input.permission='VIEW']
 * @param {string|null} [input.expiresAt]
 * @param {object} actor                   - { userId, roles[] }
 */
export async function createShare(input, actor) {
  try {
    const {
      fileId,
      folderId,
      subjectType,
      subjectUserId,
      subjectRole,
      permission = 'VIEW',
      expiresAt,
    } = input || {};
    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');
    if (!fileId && !folderId) return err('INVALID_INPUT', 'fileId or folderId required');
    if (fileId && folderId) return err('INVALID_INPUT', 'Provide fileId OR folderId, not both');
    if (!Object.values(SHARE_SUBJECT_TYPES).includes(subjectType)) return err('INVALID_INPUT', 'subjectType must be USER or ROLE');
    if (subjectType === 'USER' && !subjectUserId) return err('INVALID_INPUT', 'subjectUserId required for USER share');
    if (subjectType === 'ROLE' && !subjectRole) return err('INVALID_INPUT', 'subjectRole required for ROLE share');
    if (!VALID_PERMISSIONS.has(permission)) return err('INVALID_INPUT', `permission must be one of ${[...VALID_PERMISSIONS].join(', ')}`);

    // Only the owner (or super-admin) can grant shares.
    if (fileId) {
      const file = await prisma.file.findUnique({ where: { id: fileId }, select: { ownerId: true, isDeleted: true } });
      if (!file || file.isDeleted) return err('FILE_NOT_FOUND', 'File not found');
      if (file.ownerId !== actor.userId && !(actor.roles || []).includes('super_admin')) {
        return err('ACCESS_DENIED', 'Only owner can grant shares');
      }
    } else {
      const folder = await prisma.folder.findUnique({ where: { id: folderId }, select: { ownerId: true, isDeleted: true } });
      if (!folder || folder.isDeleted) return err('FOLDER_NOT_FOUND', 'Folder not found');
      if (folder.ownerId !== actor.userId && !(actor.roles || []).includes('super_admin')) {
        return err('ACCESS_DENIED', 'Only owner can grant shares');
      }
    }

    // Upsert: if an identical subject share already exists, update it.
    const dedupeWhere = {
      fileId: fileId ?? null,
      folderId: folderId ?? null,
      subjectType,
      subjectUserId: subjectType === 'USER' ? subjectUserId : null,
      subjectRole: subjectType === 'ROLE' ? subjectRole : null,
    };
    const existing = await prisma.fileShare.findFirst({ where: dedupeWhere });

    const data = {
      fileId: fileId ?? null,
      folderId: folderId ?? null,
      subjectType,
      subjectUserId: subjectType === 'USER' ? subjectUserId : null,
      subjectRole: subjectType === 'ROLE' ? subjectRole : null,
      permission,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      grantedById: actor.userId,
    };

    const share = existing
      ? await prisma.fileShare.update({ where: { id: existing.id }, data })
      : await prisma.fileShare.create({ data });

    if (fileId) {
      await prisma.fileActivity.create({
        data: {
          fileId,
          userId: actor.userId,
          action: existing ? 'share_updated' : 'share_created',
          metadata: { subjectType, subjectUserId, subjectRole, permission, expiresAt },
        },
      });
    }

    return ok(share);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return err('SHARE_EXISTS', 'Share already exists for this subject');
    }
    console.error('[fileShareService.createShare]', error);
    return err('SHARE_CREATE_FAILED', error.message);
  }
}

/**
 * Get folder details for notification purposes
 */
export async function getFolderDetailsForNotification(folderId) {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        owner: { select: { displayName: true, firstName: true, lastName: true, displayNameAr: true, firstNameAr: true, lastNameAr: true } }
      }
    });
    return ok(folder);
  } catch (error) {
    console.error('[fileShareService.getFolderDetailsForNotification]', error);
    return err('FOLDER_NOT_FOUND', error.message);
  }
}

export async function revokeShare(shareId, actor) {
  try {
    const share = await prisma.fileShare.findUnique({
      where: { id: shareId },
      include: {
        file: { select: { ownerId: true } },
        folder: { select: { ownerId: true } },
        grantedBy: { select: { id: true } },
      },
    });
    if (!share) return err('SHARE_NOT_FOUND', 'Share not found');
    
    // Only the original sharer (grantedBy) can revoke the share
    const isOriginalSharer = share.grantedBy?.id === actor.userId;
    const ownerId = share.file?.ownerId ?? share.folder?.ownerId;
    const isOwner = ownerId === actor.userId;
    const isAdmin = (actor.roles || []).includes('super_admin');
    
    if (!isOriginalSharer && !isOwner && !isAdmin) {
      return err('ACCESS_DENIED', 'Only the original sharer, file owner, or admin can revoke');
    }

    await prisma.fileShare.delete({ where: { id: shareId } });
    if (share.fileId) {
      await prisma.fileActivity.create({
        data: {
          fileId: share.fileId,
          userId: actor.userId,
          action: 'share_revoked',
          metadata: { shareId, subjectType: share.subjectType },
        },
      });
    }
    return ok({ shareId });
  } catch (error) {
    console.error('[fileShareService.revokeShare]', error);
    return err('SHARE_REVOKE_FAILED', error.message);
  }
}

export async function listFileShares(fileId, actor, subjectType = null) {
  try {
    console.log('[fileShareService] listFileShares called:', { fileId, subjectType, userId: actor?.userId, roles: actor?.roles });
    
    // Get user's application roles from database
    const user = await prisma.user.findUnique({
      where: { id: actor?.userId },
      include: { roleAssignments: true }
    });
    
    const roleIds = user?.roleAssignments?.map(ra => ra.roleId) || [];
    const roles = await prisma.userRoles.findMany({
      where: { id: { in: roleIds } },
      select: { code: true }
    });
    const userRoles = roles.map(r => r.code.toLowerCase());
    
    console.log('[fileShareService] User application roles:', userRoles);
    
    const where = { fileId };
    
    // Add subjectType filter if provided
    if (subjectType) {
      where.subjectType = subjectType;
    }
    
    const shares = await prisma.fileShare.findMany({
      where,
      include: {
        subjectUser: { select: { id: true, email: true, displayName: true } },
        grantedBy: { select: { id: true, email: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log('[fileShareService] Shares fetched from DB:', shares.length);
    console.log('[fileShareService] Shares before filter:', shares.map(s => ({ subjectType: s.subjectType, subjectRole: s.subjectRole, subjectUserId: s.subjectUserId })));
    
    // Filter based on user permissions
    const filteredShares = shares.filter(share => {
      // If subjectType filter is active, strictly enforce it
      if (subjectType) {
        // For USER shares: only show if user is recipient or granter
        if (subjectType === 'USER') {
          if (share.subjectType !== 'USER') return false;
          if (share.subjectUserId === actor?.userId) return true;
          if (share.grantedById === actor?.userId) return true;
          const isAdmin = userRoles.includes('super_admin') || userRoles.includes('admin');
          if (isAdmin) return true;
          return false;
        }
        
        // For ROLE shares: only show if user has the role or is granter
        if (subjectType === 'ROLE') {
          if (share.subjectType !== 'ROLE') return false;
          const hasRole = userRoles.some(role => role === share.subjectRole?.toLowerCase());
          console.log('[fileShareService] ROLE share check:', { shareRole: share.subjectRole, userRoles, hasRole });
          if (hasRole) return true;
          if (share.grantedById === actor?.userId) return true;
          const isAdmin = userRoles.includes('super_admin') || userRoles.includes('admin');
          if (isAdmin) return true;
          return false;
        }
      }
      
      // No subjectType filter - show all shares the user has access to
      // User is the one who granted the share
      if (share.grantedById === actor?.userId) return true;
      
      // User is admin
      const isAdmin = actor?.roles?.includes('SUPER_ADMIN') || actor?.roles?.includes('ADMIN');
      if (isAdmin) return true;
      
      // For USER shares, check if user is the recipient
      if (share.subjectType === 'USER' && share.subjectUserId === actor?.userId) return true;
      
      // For ROLE shares, check if user has the role (case-insensitive)
      if (share.subjectType === 'ROLE') {
        const hasRole = actor?.roles?.some(role => role.toLowerCase() === share.subjectRole?.toLowerCase());
        if (hasRole) return true;
      }
      
      return false;
    });
    
    console.log('[fileShareService] Shares after filter:', filteredShares.length);
    
    return ok(filteredShares);
  } catch (error) {
    console.error('[fileShareService.listFileShares]', error);
    return err('LIST_SHARES_FAILED', error.message);
  }
}

/**
 * Everything shared with the actor: direct user shares + role shares + any
 * legacy v1 rows. Returns files and folders in a single unified list.
 */
export async function listSharedWithMe(actor) {
  try {
    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');

    // Get user's application roles from database
    const user = await prisma.user.findUnique({
      where: { id: actor.userId },
      include: { roleAssignments: true }
    });
    
    const roleIds = user?.roleAssignments?.map(ra => ra.roleId) || [];
    const roles = await prisma.userRoles.findMany({
      where: { id: { in: roleIds } },
      select: { code: true }
    });
    const userRoles = roles.map(r => r.code.toLowerCase());
    
    console.log('[listSharedWithMe] actor:', actor);
    console.log('[listSharedWithMe] user application roles:', userRoles);

    const now = new Date();
    const v2FileShares = await prisma.fileShare.findMany({
      where: {
        fileId: { not: null },
        OR: [
          { subjectType: 'USER', subjectUserId: actor.userId },
          { subjectType: 'ROLE', subjectRole: { in: userRoles } },
        ],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
      include: {
        file: {
          include: {
            owner: { select: { id: true, email: true, displayName: true } },
          },
        },
      },
    });

    const v2FolderShares = await prisma.fileShare.findMany({
      where: {
        folderId: { not: null },
        OR: [
          { subjectType: 'USER', subjectUserId: actor.userId },
          { subjectType: 'ROLE', subjectRole: { in: userRoles } },
        ],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
      include: {
        folder: {
          include: {
            owner: { select: { id: true, email: true, displayName: true } },
          },
        },
      },
    });

    // Add workflow counts for shared files
    const fileIds = v2FileShares.map(share => share.fileId);
    let workflowInstances = [];
    let workflowDocuments = [];
    try {
      workflowInstances = await prisma.workflowInstance.findMany({
        where: { fileId: { in: fileIds } },
        select: { fileId: true, status: true },
      });
      workflowDocuments = await prisma.workflowDocument.findMany({
        where: { fileId: { in: fileIds } },
        select: { fileId: true, status: true },
      });
    } catch (error) {
      console.error('[listSharedWithMe] Failed to fetch workflow counts:', error);
    }

    // Aggregate workflow counts by file
    const workflowCountsMap = {};
    workflowInstances.forEach(instance => {
      if (!workflowCountsMap[instance.fileId]) {
        workflowCountsMap[instance.fileId] = {
          draft: 0, submitted: 0, in_review: 0, approved: 0, rejected: 0, cancelled: 0,
        };
      }
      const statusMap = {
        DRAFT: 'draft', SUBMITTED: 'submitted', IN_REVIEW: 'in_review',
        APPROVED: 'approved', REJECTED: 'rejected', CANCELLED: 'cancelled',
      };
      const mappedStatus = statusMap[instance.status] || 'draft';
      workflowCountsMap[instance.fileId][mappedStatus]++;
    });

    workflowDocuments.forEach(doc => {
      if (!workflowCountsMap[doc.fileId]) {
        workflowCountsMap[doc.fileId] = {
          draft: 0, submitted: 0, in_review: 0, approved: 0, rejected: 0, cancelled: 0,
        };
      }
      const statusMap = {
        DRAFT: 'draft', SUBMITTED: 'submitted', UNDER_REVIEW: 'in_review',
        APPROVED: 'approved', REJECTED: 'rejected', NEEDS_REVISION: 'draft', WITHDRAWN: 'cancelled',
      };
      const mappedStatus = statusMap[doc.status] || 'draft';
      workflowCountsMap[doc.fileId][mappedStatus]++;
    });

    // Attach workflow counts to file shares
    const filesWithCounts = v2FileShares.map(share => ({
      ...share,
      file: {
        ...share.file,
        workflowCounts: workflowCountsMap[share.fileId] || {
          draft: 0, submitted: 0, in_review: 0, approved: 0, rejected: 0, cancelled: 0,
        },
      },
    }));

    return ok({
      files: filesWithCounts,
      folders: v2FolderShares,
    });
  } catch (error) {
    console.error('[fileShareService.listSharedWithMe]', error);
    return err('LIST_SHARED_FAILED', error.message);
  }
}

/**
 * Everything shared by the actor: files and folders where the actor is the owner
 * and has shared them with others. Returns files and folders in a single unified list.
 */
export async function listSharedByMe(actor) {
  try {
    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');

    const now = new Date();
    const v2FileShares = await prisma.fileShare.findMany({
      where: {
        fileId: { not: null },
        file: {
          ownerId: actor.userId,
          isDeleted: false,
        },
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
      include: {
        file: {
          include: {
            owner: { select: { id: true, email: true, displayName: true } },
          },
        },
      },
    });

    const v2FolderShares = await prisma.fileShare.findMany({
      where: {
        folderId: { not: null },
        folder: {
          ownerId: actor.userId,
          isDeleted: false,
        },
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
      include: {
        folder: {
          include: {
            owner: { select: { id: true, email: true, displayName: true } },
          },
        },
      },
    });

    // Add workflow counts for shared files
    const fileIds = v2FileShares.map(share => share.fileId);
    let workflowInstances = [];
    let workflowDocuments = [];
    try {
      workflowInstances = await prisma.workflowInstance.findMany({
        where: { fileId: { in: fileIds } },
        select: { fileId: true, status: true },
      });
      workflowDocuments = await prisma.workflowDocument.findMany({
        where: { fileId: { in: fileIds } },
        select: { fileId: true, status: true },
      });
    } catch (error) {
      console.error('[listSharedByMe] Failed to fetch workflow counts:', error);
    }

    // Aggregate workflow counts by file
    const workflowCountsMap = {};
    workflowInstances.forEach(instance => {
      if (!workflowCountsMap[instance.fileId]) {
        workflowCountsMap[instance.fileId] = {
          draft: 0, submitted: 0, in_review: 0, approved: 0, rejected: 0, cancelled: 0,
        };
      }
      const statusMap = {
        DRAFT: 'draft', SUBMITTED: 'submitted', IN_REVIEW: 'in_review',
        APPROVED: 'approved', REJECTED: 'rejected', CANCELLED: 'cancelled',
      };
      const mappedStatus = statusMap[instance.status] || 'draft';
      workflowCountsMap[instance.fileId][mappedStatus]++;
    });

    workflowDocuments.forEach(doc => {
      if (!workflowCountsMap[doc.fileId]) {
        workflowCountsMap[doc.fileId] = {
          draft: 0, submitted: 0, in_review: 0, approved: 0, rejected: 0, cancelled: 0,
        };
      }
      const statusMap = {
        DRAFT: 'draft', SUBMITTED: 'submitted', UNDER_REVIEW: 'in_review',
        APPROVED: 'approved', REJECTED: 'rejected', NEEDS_REVISION: 'draft', WITHDRAWN: 'cancelled',
      };
      const mappedStatus = statusMap[doc.status] || 'draft';
      workflowCountsMap[doc.fileId][mappedStatus]++;
    });

    // Attach workflow counts to file shares
    const filesWithCounts = v2FileShares.map(share => ({
      ...share,
      file: {
        ...share.file,
        workflowCounts: workflowCountsMap[share.fileId] || {
          draft: 0, submitted: 0, in_review: 0, approved: 0, rejected: 0, cancelled: 0,
        },
      },
    }));

    return ok({
      files: filesWithCounts,
      folders: v2FolderShares,
    });
  } catch (error) {
    console.error('[fileShareService.listSharedByMe]', error);
    return err('LIST_SHARED_FAILED', error.message);
  }
}

// -------- Legacy aliases for existing controller (driveNew.js still calls) --
// These delegate to v2 under the hood, accepting the old shape.

export async function shareFile(fileId, userId, { sharedWithId, permission, expiresAt }) {
  // actor is already resolved userId on the legacy path
  return createShare(
    {
      fileId,
      subjectType: 'USER',
      subjectUserId: sharedWithId,
      permission,
      expiresAt,
    },
    { userId, roles: [] }
  );
}

export async function unshareFile(shareId, userId) {
  return revokeShare(shareId, { userId, roles: [] });
}

export async function getSharedFiles(actor) {
  // Actor is already resolved with userId and roles from the controller
  if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');
  const result = await listSharedWithMe(actor);
  if (!result.success) return result;
  return ok(result.data.files);
}

/**
 * Check if a file is shared with anyone
 */
export async function isFileShared(fileId) {
  try {
    const shareCount = await prisma.fileShare.count({
      where: { fileId: { not: null }, fileId },
    });
    return shareCount > 0;
  } catch (error) {
    console.error('[fileShareService.isFileShared]', error);
    return false;
  }
}

/**
 * Check if a folder is shared with anyone
 */
export async function isFolderShared(folderId) {
  try {
    const shareCount = await prisma.fileShare.count({
      where: { folderId: { not: null }, folderId },
    });
    return shareCount > 0;
  } catch (error) {
    console.error('[fileShareService.isFolderShared]', error);
    return false;
  }
}

export default {
  createShare,
  revokeShare,
  listFileShares,
  listSharedWithMe,
  listSharedByMe,
  getSharedFiles,
  getFolderDetailsForNotification,
  shareFile,
  unshareFile,
  isFileShared,
  isFolderShared,
};
