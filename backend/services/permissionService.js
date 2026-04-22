/**
 * Permission Service — single source of truth for file & folder ACL checks.
 *
 * Resolution order (first match wins, most permissive wins among direct ACLs):
 *   1. Owner                              → EDIT
 *   2. Super-admin role on the actor      → EDIT
 *   3. Direct user share on the FILE      → share.permission
 *   4. Direct role share on the FILE      → share.permission (user must have role)
 *   5. Direct user share on the FOLDER    → inherit for children files
 *   6. Direct role share on the FOLDER    → inherit for children files
 *   7. Ancestor folder share (recursive)  → inherit
 *   8. Denied
 *
 * Permission hierarchy: VIEW < DOWNLOAD < COMMENT < EDIT. `hasLevel` returns
 * true iff the granted permission is at least the required level.
 */

import { PrismaClient } from '@prisma/client';
import { getAncestorIds } from './folderService.js';

const prisma = new PrismaClient();

const RANK = { VIEW: 1, DOWNLOAD: 2, COMMENT: 3, EDIT: 4 };
const SUPER_ADMIN_ROLE = 'super_admin';

const ok = (permission) => ({ allowed: true, permission });
const deny = (reason = 'no_matching_share') => ({ allowed: false, reason });

/**
 * @param {'VIEW'|'DOWNLOAD'|'COMMENT'|'EDIT'} granted
 * @param {'VIEW'|'DOWNLOAD'|'COMMENT'|'EDIT'} required
 */
export function hasLevel(granted, required) {
  return (RANK[granted] || 0) >= (RANK[required] || 0);
}

/**
 * Resolve a user's permission on a file (including inherited folder shares).
 *
 * @param {string} fileId
 * @param {object} actor - { userId, roles[] }
 * @returns {Promise<{ allowed: boolean, permission?: string, reason?: string }>}
 */
export async function canAccessFile(fileId, actor) {
  if (!actor?.userId) return deny('no_actor');

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      ownerId: true,
      folderId: true,
      isDeleted: true,
    },
  });
  if (!file || file.isDeleted) return deny('file_not_found');
  if (file.ownerId === actor.userId) return ok('EDIT');
  if ((actor.roles || []).includes(SUPER_ADMIN_ROLE)) return ok('EDIT');

  const now = new Date();

  // Direct file shares (user OR role).
  const direct = await prisma.fileShareV2.findMany({
    where: {
      fileId,
      OR: [
        { subjectType: 'USER', subjectUserId: actor.userId },
        {
          subjectType: 'ROLE',
          subjectRole: { in: actor.roles || [] },
        },
      ],
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    },
    select: { permission: true },
  });
  const directBest = bestRank(direct);
  if (directBest) return ok(directBest);

  // Ancestor folder shares.
  if (file.folderId) {
    const ancestors = await getAncestorIds(file.folderId);
    if (ancestors.length > 0) {
      const folderShares = await prisma.fileShareV2.findMany({
        where: {
          folderId: { in: ancestors },
          OR: [
            { subjectType: 'USER', subjectUserId: actor.userId },
            { subjectType: 'ROLE', subjectRole: { in: actor.roles || [] } },
          ],
          AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
        },
        select: { permission: true },
      });
      const inheritedBest = bestRank(folderShares);
      if (inheritedBest) return ok(inheritedBest);
    }
  }

  return deny();
}

/**
 * Folder variant of canAccessFile — owner/super-admin/direct/ancestor lookup.
 */
export async function canAccessFolder(folderId, actor) {
  if (!actor?.userId) return deny('no_actor');
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { id: true, ownerId: true, isDeleted: true },
  });
  if (!folder || folder.isDeleted) return deny('folder_not_found');
  if (folder.ownerId === actor.userId) return ok('EDIT');
  if ((actor.roles || []).includes(SUPER_ADMIN_ROLE)) return ok('EDIT');

  const now = new Date();
  const ancestors = await getAncestorIds(folderId);
  const scope = [folderId, ...ancestors.filter((a) => a !== folderId)];
  const rows = await prisma.fileShareV2.findMany({
    where: {
      folderId: { in: scope },
      OR: [
        { subjectType: 'USER', subjectUserId: actor.userId },
        { subjectType: 'ROLE', subjectRole: { in: actor.roles || [] } },
      ],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
    },
    select: { permission: true },
  });
  const best = bestRank(rows);
  return best ? ok(best) : deny();
}

/**
 * Require a specific permission level for a file; throws HTTP-friendly errors.
 */
export async function requireFilePermission(fileId, actor, requiredLevel = 'VIEW') {
  const result = await canAccessFile(fileId, actor);
  if (!result.allowed) {
    const status = result.reason === 'file_not_found' ? 404 : 403;
    const err = new Error(result.reason || 'forbidden');
    err.status = status;
    err.code = result.reason === 'file_not_found' ? 'FILE_NOT_FOUND' : 'ACCESS_DENIED';
    throw err;
  }
  if (!hasLevel(result.permission, requiredLevel)) {
    const err = new Error(`Required ${requiredLevel}, granted ${result.permission}`);
    err.status = 403;
    err.code = 'INSUFFICIENT_PERMISSION';
    throw err;
  }
  return result.permission;
}

// -- helpers ----------------------------------------------------------------

function bestRank(shares) {
  let best = null;
  for (const s of shares) {
    if (!best || (RANK[s.permission] || 0) > (RANK[best] || 0)) best = s.permission;
  }
  return best;
}

export default {
  hasLevel,
  canAccessFile,
  canAccessFolder,
  requireFilePermission,
};
