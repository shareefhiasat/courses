/**
 * File Search Service
 *
 * Uses the `files.searchVector` tsvector column (maintained by the
 * files_search_trigger DB trigger) plus secondary metadata filters.
 *
 * The raw query intentionally joins visibility conditions so users never
 * see other people's private files in search results, even if the
 * controller forgets a filter.
 */

import prisma from '../db/prismaClient.js';
import { Prisma } from '@prisma/client';
import { getDatabaseUserId } from '../utils/database/userResolver.js';


const ok = (payload) => ({ success: true, payload, timestamp: Date.now() });
const err = (code, message) => ({
  success: false,
  error: { code, message },
  timestamp: Date.now(),
});

/**
 * @param {string|object} keycloakUser
 * @param {object} filters
 * @param {string}  filters.q                 - full-text search query
 * @param {string}  [filters.mimeTypePrefix]  - e.g. 'image/', 'application/pdf'
 * @param {number}  [filters.ownerId]
 * @param {string}  [filters.folderId]
 * @param {string}  [filters.folderPathPrefix]
 * @param {string}  [filters.modifiedAfter]
 * @param {string}  [filters.modifiedBefore]
 * @param {number}  [filters.page=1]
 * @param {number}  [filters.pageSize=30]
 */
export async function searchFiles(keycloakUser, filters = {}) {
  try {
    const actorUserId = await getDatabaseUserId(keycloakUser);
    if (!actorUserId) return err('USER_NOT_FOUND', 'User not found');

    const {
      q,
      mimeTypePrefix,
      ownerId,
      folderId,
      folderPathPrefix,
      modifiedAfter,
      modifiedBefore,
      page = 1,
      pageSize = 30,
    } = filters;

    const offset = Math.max(0, (page - 1) * pageSize);
    const limit = Math.min(200, pageSize);

    // plainto_tsquery is user-input safe (no operator injection) and matches
    // our simple-dictionary indexing strategy.
    const tsquery = q ? Prisma.sql`plainto_tsquery('simple', ${q})` : null;

    const parts = [
      Prisma.sql`f."isDeleted" = FALSE`,
      Prisma.sql`(
        f."ownerId" = ${actorUserId}
        OR EXISTS (
          SELECT 1 FROM file_shares s
          WHERE s."fileId" = f.id
            AND (
              (s."subjectType" = 'USER' AND s."subjectUserId" = ${actorUserId})
            )
        )
      )`,
    ];
    if (q) parts.push(Prisma.sql`f."searchVector" @@ ${tsquery}`);
    if (mimeTypePrefix) parts.push(Prisma.sql`f."mimeType" LIKE ${mimeTypePrefix + '%'}`);
    if (ownerId) parts.push(Prisma.sql`f."ownerId" = ${ownerId}`);
    if (folderId) parts.push(Prisma.sql`f."folderId" = ${folderId}::uuid`);
    if (folderPathPrefix) parts.push(Prisma.sql`f."folderPath" LIKE ${folderPathPrefix + '%'}`);
    if (modifiedAfter) parts.push(Prisma.sql`f."updatedAt" >= ${new Date(modifiedAfter)}`);
    if (modifiedBefore) parts.push(Prisma.sql`f."updatedAt" <= ${new Date(modifiedBefore)}`);

    const where = Prisma.join(parts, ' AND ');
    const rank = q ? Prisma.sql`ts_rank(f."searchVector", ${tsquery})` : Prisma.sql`0`;
    const orderBy = q
      ? Prisma.sql`ts_rank(f."searchVector", ${tsquery}) DESC, f."updatedAt" DESC`
      : Prisma.sql`f."updatedAt" DESC`;

    const rows = await prisma.$queryRaw`
      SELECT
        f.id,
        f.name,
        f."mimeType",
        f.size,
        f."ownerId",
        f."folderId",
        f."folderPath",
        f."workflowStatus",
        f."isStarred",
        f."createdAt",
        f."updatedAt",
        ${rank} AS rank
      FROM files f
      WHERE ${where}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalRows = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count FROM files f WHERE ${where}
    `;

    return ok({
      results: rows,
      total: totalRows[0]?.count ?? 0,
      page,
      pageSize: limit,
    });
  } catch (error) {
    console.error('[fileSearchService.searchFiles]', error);
    return err('SEARCH_FAILED', error.message);
  }
}

export default { searchFiles };
