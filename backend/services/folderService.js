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

import prisma from '../db/prismaClient.js';
import { USER_NAME_SELECT_WITH_ID } from '../utils/userNameFields.js';
import { Prisma } from '@prisma/client';
import { getDatabaseUserId } from '../utils/database/userResolver.js';
import { LMS_ROLES } from './keycloakAdminService.js';


const ok = (payload) => ({ success: true, payload, timestamp: Date.now() });
const err = (code, message) => ({
  success: false,
  error: { code, message },
  timestamp: Date.now(),
});

/**
 * Helper: Soft delete folder and all its descendants (folders and files)
 * Uses raw SQL for efficient recursive path-based deletion
 */
async function softDeleteFolderTree(tx, folderPath, deletedAt, deletedById) {
  await tx.$executeRaw`
    UPDATE folders
    SET "isDeleted" = TRUE, "deletedAt" = ${deletedAt}, "deletedById" = ${deletedById}
    WHERE (path = ${folderPath} OR path LIKE ${folderPath + '/%'}) AND "isDeleted" = FALSE
  `;
  await tx.$executeRaw`
    UPDATE files
    SET "isDeleted" = TRUE, "deletedAt" = ${deletedAt}, "deletedById" = ${deletedById}
    WHERE "folderId" IN (
      SELECT id FROM folders WHERE path = ${folderPath} OR path LIKE ${folderPath + '/%'}
    ) AND "isDeleted" = FALSE
  `;
}

// --------------------------------------------------------------------------
// Reads
// --------------------------------------------------------------------------

/**
 * Build hierarchical tree structure of all folders with file counts
 */
export async function getFolderTree(keycloakUser) {
  try {
    const userId = await getDatabaseUserId(keycloakUser);
    if (!userId) return err('USER_NOT_FOUND', 'User not found');

    // Get all non-deleted folders for the user
    const folders = await prisma.folder.findMany({
      where: {
        ownerId: userId,
        isDeleted: false,
      },
      orderBy: { name: 'asc' },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Count files and calculate sizes in each folder
    const folderIds = folders.map(f => f.id);
    const fileStats = await prisma.file.groupBy({
      by: ['folderId'],
      where: {
        folderId: { in: folderIds },
        isDeleted: false,
      },
      _count: {
        id: true,
      },
      _sum: {
        size: true,
      },
    });

    const countMap = new Map(
      fileStats.map(fc => [fc.folderId, fc._count.id])
    );
    const sizeMap = new Map(
      fileStats.map(fc => [fc.folderId, fc._sum.size || 0])
    );

    console.log('[folderService.getFolderTree] File stats:', fileStats);
    console.log('[folderService.getFolderTree] Size map:', Object.fromEntries(sizeMap));

    // Build tree structure
    const folderMap = new Map();
    const rootFolders = [];

    // First pass: create map of all folders
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        fileCount: countMap.get(folder.id) || 0,
        totalSize: sizeMap.get(folder.id) || 0,
        children: [],
      });
    });

    // Second pass: build hierarchy
    folders.forEach(folder => {
      const folderNode = folderMap.get(folder.id);
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId).children.push(folderNode);
      } else {
        rootFolders.push(folderNode);
      }
    });

    return ok(rootFolders);
  } catch (error) {
    console.error('[folderService.getFolderTree]', error);
    return err('TREE_FETCH_FAILED', error.message);
  }
}

/**
 * List immediate children of a folder (or the root if parentId is null).
 */
export async function listChildren(keycloakUser, { parentId = null, includeDeleted = false, deletedOnly = false } = {}) {
  try {
    const userId = await getDatabaseUserId(keycloakUser);
    if (!userId) return err('USER_NOT_FOUND', 'User not found');

    const where = { ownerId: userId };
    if (deletedOnly) {
      where.isDeleted = true;
    } else if (!includeDeleted) {
      where.isDeleted = false;
    }
    if (parentId !== undefined && parentId !== null && parentId !== '') {
      where.parentId = parentId;
    } else {
      where.parentId = null;
    }
    const folders = await prisma.folder.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
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
    console.log('[folderService.getFolderWithBreadcrumb] folderId:', folderId, 'actorUserId:', actorUserId);
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    console.log('[folderService.getFolderWithBreadcrumb] folder:', folder);
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
    console.log('[folderService.getFolderWithBreadcrumb] chainRows:', chainRows);
    const result = ok({ folder, breadcrumb: chainRows });
    console.log('[folderService.getFolderWithBreadcrumb] returning:', result);
    return result;
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
    const suffixStart = oldPath.length + 1;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.folder.update({
        where: { id: folderId },
        data: { ...patch, path: newPath },
      });

      // Rewrite paths of descendant folders.
      if (newPath !== oldPath) {
        // Prisma binds JS numbers as bigint; PostgreSQL substring() requires integer.
        await tx.$executeRaw(
          Prisma.sql`
            UPDATE folders
            SET path = ${newPath} || substring(path FROM ${Prisma.raw(String(suffixStart))})
            WHERE path = ${oldPath} OR path LIKE ${oldPath + '/%'}
          `
        );
        // Denormalised folder_path on files is legacy; keep it in sync when present.
        await tx.$executeRaw(
          Prisma.sql`
            UPDATE files
            SET "folderPath" = ${newPath} || substring("folderPath" FROM ${Prisma.raw(String(suffixStart))})
            WHERE "folderPath" = ${oldPath} OR "folderPath" LIKE ${oldPath + '/%'}
          `
        );
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
export async function softDeleteFolder(folderId, actorUserId, actorRoles = []) {
  try {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) return err('FOLDER_NOT_FOUND', 'Folder not found');
    if (folder.ownerId !== actorUserId) return err('ACCESS_DENIED', 'Only owner can trash');

    // Check if folder is shared (unless super_admin)
    const isSuperAdmin = actorRoles.includes(LMS_ROLES.SUPER_ADMIN);
    if (!isSuperAdmin) {
      const { isFolderShared } = await import('./fileShareService.js');
      const shared = await isFolderShared(folderId);
      if (shared) {
        return err('FOLDER_SHARED', 'Cannot delete shared folders. Remove shares first.');
      }
    }

    const oldPath = folder.path;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      await softDeleteFolderTree(tx, oldPath, now, actorUserId);
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

    // Check for name conflicts in the same parent folder
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id: { not: folderId },
        parentId: folder.parentId,
        name: folder.name,
        isDeleted: false,
      },
    });

    if (existingFolder) {
      return err('NAME_CONFLICT', 'A folder with this name already exists in this location. Restore not allowed to prevent conflicts.');
    }

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

/**
 * Hard-delete a trashed folder, its descendants, and all contained files.
 */
export async function permanentDeleteFolder(folderId, actorUserId) {
  try {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) return err('FOLDER_NOT_FOUND', 'Folder not found');
    if (folder.ownerId !== actorUserId) return err('ACCESS_DENIED', 'Only owner can hard-delete');
    if (!folder.isDeleted) return err('NOT_IN_TRASH', 'Folder must be in trash before permanent delete');

    const descendantRows = await prisma.$queryRaw`
      SELECT id FROM folders WHERE path = ${folder.path} OR path LIKE ${folder.path + '/%'}
    `;
    const folderIds = descendantRows.map((row) => row.id);

    const files = await prisma.file.findMany({
      where: { folderId: { in: folderIds } },
      select: { id: true },
    });

    const { permanentDeleteFile } = await import('./fileService.js');
    for (const file of files) {
      const result = await permanentDeleteFile(file.id, actorUserId);
      if (!result.success) return result;
    }

    await prisma.folder.delete({ where: { id: folderId } });

    return ok({ message: 'Folder permanently deleted', folderId });
  } catch (error) {
    console.error('[folderService.permanentDeleteFolder]', error);
    return err('PERMANENT_DELETE_FOLDER_FAILED', error.message);
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

/**
 * Download a folder as a zip file. Streams all files in the folder and subfolders
 * into a zip archive and sends it to the client.
 */
export async function downloadFolder(folderId, actorUserId, req, res) {
  try {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.isDeleted) return err('FOLDER_NOT_FOUND', 'Folder not found');
    if (folder.ownerId !== actorUserId) return err('ACCESS_DENIED', 'Only owner can download');

    // Get all descendant folder IDs (this folder and all subfolders)
    const descendantFolders = await prisma.$queryRaw`
      WITH RECURSIVE descendants AS (
        SELECT id FROM folders WHERE id = ${folderId}
        UNION ALL
        SELECT f.id FROM folders f
        JOIN descendants d ON f."parentId" = d.id
      )
      SELECT id FROM descendants
    `;
    const folderIds = descendantFolders.map(f => f.id);

    // Get all files in this folder and subfolders
    const files = await prisma.file.findMany({
      where: {
        folderId: { in: folderIds },
        isDeleted: false,
      },
      include: {
        owner: { select: USER_NAME_SELECT_WITH_ID },
      },
    });

    if (files.length === 0) {
      return err('NO_FILES', 'Folder is empty');
    }

    // Import archiver for zip creation
    const archiver = (await import('archiver')).default;

    // Set up zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    // Set response headers
    res.attachment(`${folder.name}.zip`);
    archive.pipe(res);

    // Add each file to the zip
    for (const file of files) {
      try {
        const BUCKETS = {
          PRIVATE: process.env.MINIO_BUCKET_PRIVATE || 'lms-private',
          WORKFLOW: process.env.MINIO_BUCKET_WORKFLOW || 'lms-workflow',
          SHARED: process.env.MINIO_BUCKET_SHARED || 'lms-shared',
        };
        const bucket = BUCKETS[file.bucket] || file.bucket;

        // Get the s3Key from the latest version or fall back to file.s3Key
        let s3Key = file.s3Key;
        const fileVersionService = (await import('./fileVersionService.js')).default;
        const versionRes = await fileVersionService.listVersions(file.id, null);
        if (versionRes.success && versionRes.payload.length > 0) {
          s3Key = versionRes.payload[0].s3Key;
        }

        if (!s3Key) {
          console.error('[downloadFolder] No s3Key for file:', file.id);
          continue;
        }

        // Stream the file from MinIO
        const { minioClient } = await import('./minioService.js');
        const stream = await minioClient.getObject(bucket, s3Key);

        // Create relative path for the file in the zip
        const relativePath = file.name;
        archive.append(stream, { name: relativePath });
      } catch (error) {
        console.error('[downloadFolder] Failed to add file to zip:', file.id, error);
        // Continue with other files even if one fails
      }
    }

    await archive.finalize();
    return { success: true };
  } catch (error) {
    console.error('[folderService.downloadFolder]', error);
    return err('DOWNLOAD_FOLDER_FAILED', error.message);
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
  permanentDeleteFolder,
  toggleStarFolder,
  downloadFolder,
};
