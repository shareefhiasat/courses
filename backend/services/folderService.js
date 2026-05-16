/**
 * Folder Service
 *
 * CRUD + tree ops for the new `folders` table. Maintains the materialised
 * `path` column whenever a folder is created/renamed/moved so that recursive
 * permission lookups and prefix search stay cheap.
 *
 * Permissions are purposely owner-only for now; role/user ACL via FileShareV2
 * kicks in via permissionService (PR #5).
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { getDatabaseUserId } from '../utils/userResolver.js';

const prisma = new PrismaClient();

const ok = (payload) => ({ success: true, payload, timestamp: Date.now() });
const err = (code, message) => ({
  success: false,
  error: { code, message },
  timestamp: Date.now(),
});

// --------------------------------------------------------------------------
// Reads
// --------------------------------------------------------------------------

/**
 * List immediate children of a folder (or the root if parentId is null).
 */
export async function listChildren(keycloakUser, { parentId = null, includeDeleted = false } = {}) {
  try {
    const userId = await getDatabaseUserId(keycloakUser);
    if (!userId) return err('USER_NOT_FOUND', 'User not found');

    const where = {
      ownerId: userId,
      ...(includeDeleted ? {} : { isDeleted: false }),
    };
    if (parentId !== undefined && parentId !== null && parentId !== '') {
      where.parentId = parentId;
    } else {
      where.parentId = null;
    }
    const folders = await prisma.folder.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return ok(folders);
  } catch (error) {
    console.error('[folderService.listChildren]', error);
    return err('LIST_FOLDERS_FAILED', error.message);
  }
}

/**
 * Resolve a folder by id including breadcrumb (root-to-self chain).
 */
export async function getFolderWithBreadcrumb(folderId, actorUserId) {
  try {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.isDeleted) return err('FOLDER_NOT_FOUND', 'Folder not found');

    const chainRows = await prisma.$queryRaw`
      WITH RECURSIVE chain AS (
        SELECT id, name, "parentId", path, 0 AS depth FROM folders WHERE id = ${folderId}
        UNION ALL
        SELECT f.id, f.name, f."parentId", f.path, c.depth + 1
        FROM folders f
        JOIN chain c ON f.id = c."parentId"
      )
      SELECT id, name, "parentId", path FROM chain ORDER BY depth DESC
    `;
    return ok({ folder, breadcrumb: chainRows });
  } catch (error) {
    console.error('[folderService.getFolderWithBreadcrumb]', error);
    return err('GET_FOLDER_FAILED', error.message);
  }
}

/**
 * Return the ids of a folder and every ancestor up to the root.
 * Used by permissionService for inherited-permission lookups.
 */
export async function getAncestorIds(folderId) {
  if (!folderId) return [];
  const rows = await prisma.$queryRaw`
    WITH RECURSIVE chain AS (
      SELECT id, "parentId" FROM folders WHERE id = ${folderId}
      UNION ALL
      SELECT f.id, f."parentId"
      FROM folders f
      JOIN chain c ON f.id = c."parentId"
    )
    SELECT id FROM chain
  `;
  return rows.map((r) => r.id);
}

// --------------------------------------------------------------------------
// Writes
// --------------------------------------------------------------------------

export async function createFolder(keycloakUser, { name, parentId = null, isPrivate = false } = {}) {
  try {
    const userId = await getDatabaseUserId(keycloakUser);
    if (!userId) return err('USER_NOT_FOUND', 'User not found');
    if (!name) return err('INVALID_INPUT', 'Folder name is required');

    let parentPath = '';
    if (parentId) {
      const parent = await prisma.folder.findUnique({ where: { id: parentId } });
      if (!parent || parent.isDeleted) return err('PARENT_NOT_FOUND', 'Parent folder not found');
      if (parent.ownerId !== userId) return err('ACCESS_DENIED', 'Parent folder not owned by you');
      parentPath = parent.path;
    }
    const path = parentPath ? `${parentPath}/${name}` : `/${name}`;

    const folder = await prisma.folder.create({
      data: { name, parentId, ownerId: userId, path, isPrivate },
    });
    return ok(folder);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return err('FOLDER_EXISTS', 'A folder with this name already exists at this location');
    }
    console.error('[folderService.createFolder]', error);
    return err('CREATE_FOLDER_FAILED', error.message);
  }
}

/**
 * Rename or move a folder (or toggle privacy). On rename/move we recompute the
 * materialised `path` for the folder AND all descendants + all files under them.
 */
export async function updateFolder(folderId, actorUserId, updates = {}) {
  try {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.isDeleted) return err('FOLDER_NOT_FOUND', 'Folder not found');
    if (folder.ownerId !== actorUserId) return err('ACCESS_DENIED', 'Only owner can update');

    const patch = {};
    if (typeof updates.name === 'string' && updates.name !== folder.name) patch.name = updates.name;
    if (updates.parentId !== undefined && updates.parentId !== folder.parentId) patch.parentId = updates.parentId;
    if (typeof updates.isPrivate === 'boolean') patch.isPrivate = updates.isPrivate;
    if (Object.keys(patch).length === 0) return ok(folder);

    // Determine new parent path if we're moving.
    let newParentPath = '';
    if (patch.parentId !== undefined && patch.parentId !== null) {
      // Prevent cycles: the new parent must not be self or a descendant of self.
      if (patch.parentId === folderId) return err('CYCLE', 'Cannot move folder into itself');
      const descendants = await prisma.$queryRaw`
        WITH RECURSIVE sub AS (
          SELECT id FROM folders WHERE "parentId" = ${folderId}
          UNION ALL
          SELECT f.id FROM folders f JOIN sub s ON f."parentId" = s.id
        )
        SELECT id FROM sub
      `;
      if (descendants.some((d) => d.id === patch.parentId)) {
        return err('CYCLE', 'Cannot move folder into one of its descendants');
      }
      const parent = await prisma.folder.findUnique({ where: { id: patch.parentId } });
      if (!parent || parent.isDeleted) return err('PARENT_NOT_FOUND', 'Parent folder not found');
      if (parent.ownerId !== actorUserId) return err('ACCESS_DENIED', 'Parent folder not owned by you');
      newParentPath = parent.path;
    } else if (patch.parentId === null) {
      newParentPath = '';
    } else {
      // Not moving; derive current parent path.
      const parts = folder.path.split('/').slice(0, -1);
      newParentPath = parts.join('/');
    }
    const newName = patch.name ?? folder.name;
    const newPath = newParentPath ? `${newParentPath}/${newName}` : `/${newName}`;
    const oldPath = folder.path;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.folder.update({
        where: { id: folderId },
        data: { ...patch, path: newPath },
      });

      // Rewrite paths of descendant folders.
      if (newPath !== oldPath) {
        await tx.$executeRaw`
          UPDATE folders
          SET path = ${newPath} || substring(path FROM ${oldPath.length + 1})
          WHERE path = ${oldPath} OR path LIKE ${oldPath + '/%'}
        `;
        // Denormalised folder_path on files is legacy; keep it in sync when present.
        await tx.$executeRaw`
          UPDATE files
          SET "folderPath" = ${newPath} || substring("folderPath" FROM ${oldPath.length + 1})
          WHERE "folderPath" = ${oldPath} OR "folderPath" LIKE ${oldPath + '/%'}
        `;
      }

      return updated;
    });

    return ok(result);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return err('FOLDER_EXISTS', 'A folder with this name already exists at destination');
    }
    console.error('[folderService.updateFolder]', error);
    return err('UPDATE_FOLDER_FAILED', error.message);
  }
}

/**
 * Soft-delete a folder. Cascade soft-delete to descendant folders AND the
 * files inside them (so they disappear from the Drive view but stay
 * recoverable via the Trash).
 */
export async function softDeleteFolder(folderId, actorUserId) {
  try {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) return err('FOLDER_NOT_FOUND', 'Folder not found');
    if (folder.ownerId !== actorUserId) return err('ACCESS_DENIED', 'Only owner can trash');

    const oldPath = folder.path;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE folders
        SET "isDeleted" = TRUE, "deletedAt" = ${now}, "deletedById" = ${actorUserId}
        WHERE (path = ${oldPath} OR path LIKE ${oldPath + '/%'}) AND "isDeleted" = FALSE
      `;
      await tx.$executeRaw`
        UPDATE files
        SET "isDeleted" = TRUE, "deletedAt" = ${now}, "deletedById" = ${actorUserId}
        WHERE "folderId" IN (
          SELECT id FROM folders WHERE path = ${oldPath} OR path LIKE ${oldPath + '/%'}
        ) AND "isDeleted" = FALSE
      `;
      return tx.folder.findUnique({ where: { id: folderId } });
    });

    return ok(result);
  } catch (error) {
    console.error('[folderService.softDeleteFolder]', error);
    return err('SOFT_DELETE_FOLDER_FAILED', error.message);
  }
}

/**
 * Restore a soft-deleted folder (and its descendants / files).
 */
export async function restoreFolder(folderId, actorUserId) {
  try {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) return err('FOLDER_NOT_FOUND', 'Folder not found');
    if (folder.ownerId !== actorUserId) return err('ACCESS_DENIED', 'Only owner can restore');

    const oldPath = folder.path;
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE folders
        SET "isDeleted" = FALSE, "deletedAt" = NULL, "deletedById" = NULL
        WHERE path = ${oldPath} OR path LIKE ${oldPath + '/%'}
      `;
      await tx.$executeRaw`
        UPDATE files
        SET "isDeleted" = FALSE, "deletedAt" = NULL, "deletedById" = NULL
        WHERE "folderId" IN (
          SELECT id FROM folders WHERE path = ${oldPath} OR path LIKE ${oldPath + '/%'}
        )
      `;
    });

    return ok({ folderId });
  } catch (error) {
    console.error('[folderService.restoreFolder]', error);
    return err('RESTORE_FOLDER_FAILED', error.message);
  }
}

export async function toggleStarFolder(folderId, actorUserId) {
  try {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) return err('FOLDER_NOT_FOUND', 'Folder not found');
    if (folder.ownerId !== actorUserId) return err('ACCESS_DENIED', 'Only owner can star folder');

    const updated = await prisma.folder.update({
      where: { id: folderId },
      data: { isStarred: !folder.isStarred },
    });
    return ok(updated);
  } catch (error) {
    console.error('[folderService.toggleStarFolder]', error);
    return err('TOGGLE_STAR_FOLDER_FAILED', error.message);
  }
}

export default {
  listChildren,
  getFolderWithBreadcrumb,
  getAncestorIds,
  createFolder,
  updateFolder,
  softDeleteFolder,
  restoreFolder,
  toggleStarFolder,
};
