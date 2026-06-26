/**
 * purgeTrash.js
 *
 * Nightly job: permanently deletes files that have been soft-deleted
 * for longer than PURGE_AFTER_DAYS (default 30). Removes every MinIO
 * version then removes the DB row (CASCADE removes versions, shares,
 * comments, activities, preferences).
 *
 * USAGE:
 *   node backend/scripts/purgeTrash.js            # run once
 *   node backend/scripts/purgeTrash.js --dry-run  # list what would go
 *
 * Scheduling: add to cron / Windows Task Scheduler / GitHub Actions.
 */

import prisma from '../db/prismaClient.js';
import {
  BUCKETS,
  deleteObject,
  deleteObjectVersion,
} from '../services/minioService.js';

const DEFAULT_DAYS = parseInt(process.env.PURGE_AFTER_DAYS || '30', 10);

function resolveBucket(input) {
  if (!input) return BUCKETS.PRIVATE;
  return BUCKETS[String(input).toUpperCase()] || BUCKETS.PRIVATE;
}

export async function runPurge({ days = DEFAULT_DAYS, dryRun = false, logger = console } = {}) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  logger.log(`[purgeTrash] Scanning for files soft-deleted before ${cutoff.toISOString()}`);

  const candidates = await prisma.file.findMany({
    where: { isDeleted: true, deletedAt: { lt: cutoff } },
    include: { versions: true },
  });
  logger.log(`[purgeTrash] Found ${candidates.length} files eligible for purge`);

  if (dryRun) {
    candidates.forEach((f) => logger.log(`  - ${f.id} ${f.name} (deletedAt=${f.deletedAt?.toISOString()})`));
    return { purged: 0, candidates: candidates.length, dryRun: true };
  }

  let purged = 0;
  for (const file of candidates) {
    const bucketReal = resolveBucket(file.bucket);
    for (const version of file.versions) {
      try {
        if (version.minioVersionId) {
          await deleteObjectVersion(bucketReal, version.s3Key, version.minioVersionId);
        } else {
          await deleteObject(bucketReal, version.s3Key);
        }
      } catch (storageErr) {
        logger.warn(`[purgeTrash] Storage delete failed for version ${version.id}:`, storageErr.message);
      }
    }
    try {
      await prisma.file.delete({ where: { id: file.id } });
      purged += 1;
      logger.log(`[purgeTrash] Purged ${file.id} ${file.name}`);
    } catch (dbErr) {
      logger.error(`[purgeTrash] DB delete failed for ${file.id}:`, dbErr.message);
    }
  }

  // Also purge folders soft-deleted beyond the cutoff whose files are all gone.
  const staleFolders = await prisma.folder.findMany({
    where: { isDeleted: true, deletedAt: { lt: cutoff } },
  });
  let foldersPurged = 0;
  for (const folder of staleFolders) {
    try {
      await prisma.folder.delete({ where: { id: folder.id } });
      foldersPurged += 1;
    } catch (err) {
      // likely has non-deleted children via cascade; skip
    }
  }

  logger.log(`[purgeTrash] Done. Files purged: ${purged}. Folders purged: ${foldersPurged}.`);
  return { purged, foldersPurged, candidates: candidates.length };
}

// Self-execute when run as a script.
const entry = process.argv[1] ? process.argv[1].replace(/\\/g, '/') : '';
const isMain =
  entry !== '' &&
  (import.meta.url === `file://${entry}` || import.meta.url === `file:///${entry}`);

if (isMain) {
  const dryRun = process.argv.includes('--dry-run');
  const daysArg = process.argv.find((a) => a.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.slice(7), 10) : DEFAULT_DAYS;

  runPurge({ days, dryRun })
    .then((summary) => {
      console.log('[purgeTrash] Summary:', summary);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[purgeTrash] Fatal:', err);
      process.exit(1);
    });
}
