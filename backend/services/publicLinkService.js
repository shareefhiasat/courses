/**
 * Public Link Service
 *
 * Manages revocable, optionally password-protected tokenised sharing links
 * stored in `public_links`. Every link points at either a file OR a folder
 * (never both), can have a max-downloads cap, an expiry date, and can be
 * revoked at any time.
 *
 * Security notes:
 *   - Tokens are generated via crypto.randomBytes (32 bytes base64url) so
 *     they are unguessable.
 *   - Passwords are stored as bcrypt hashes; never reversible.
 *   - Public-facing endpoints consume tokens ONLY — they never accept fileId
 *     or folderId directly, so enumeration attacks are impossible.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

const ok = (payload) => ({ success: true, payload, timestamp: Date.now() });
const err = (code, message) => ({
  success: false,
  error: { code, message },
  timestamp: Date.now(),
});

const DEFAULT_EXPIRY_DAYS = parseInt(process.env.PUBLIC_LINK_DEFAULT_EXPIRY_DAYS || '7', 10);

function generateToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function buildPublicUrl(token) {
  const base = process.env.PUBLIC_LINK_BASE_URL || '';
  return `${base.replace(/\/$/, '')}/${token}`;
}

// --------------------------------------------------------------------------
// Authoring
// --------------------------------------------------------------------------

/**
 * Create a new public link for a file OR a folder.
 *
 * @param {object} input
 * @param {string} [input.fileId]
 * @param {string} [input.folderId]
 * @param {string} [input.password]       - plaintext, hashed before store
 * @param {number} [input.maxDownloads]   - null = unlimited
 * @param {number} [input.expiryDays=7]   - shorthand for expiresAt
 * @param {string|Date} [input.expiresAt] - explicit
 * @param {object} actor                  - { userId, roles[] }
 */
export async function createLink(input, actor) {
  try {
    const {
      fileId,
      folderId,
      password,
      maxDownloads,
      expiryDays,
      expiresAt,
    } = input || {};

    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');
    if (!fileId && !folderId) return err('INVALID_INPUT', 'fileId or folderId required');
    if (fileId && folderId) return err('INVALID_INPUT', 'Provide fileId OR folderId, not both');

    // Ownership check.
    if (fileId) {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        select: { ownerId: true, isDeleted: true },
      });
      if (!file || file.isDeleted) return err('FILE_NOT_FOUND', 'File not found');
      if (file.ownerId !== actor.userId && !(actor.roles || []).includes('super_admin')) {
        return err('ACCESS_DENIED', 'Only owner can create public links');
      }
    } else {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
        select: { ownerId: true, isDeleted: true },
      });
      if (!folder || folder.isDeleted) return err('FOLDER_NOT_FOUND', 'Folder not found');
      if (folder.ownerId !== actor.userId && !(actor.roles || []).includes('super_admin')) {
        return err('ACCESS_DENIED', 'Only owner can create public links');
      }
    }

    const computedExpiry = expiresAt
      ? new Date(expiresAt)
      : new Date(Date.now() + (expiryDays || DEFAULT_EXPIRY_DAYS) * 86_400_000);

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const link = await prisma.publicLink.create({
      data: {
        fileId: fileId ?? null,
        folderId: folderId ?? null,
        token: generateToken(),
        passwordHash,
        maxDownloads: typeof maxDownloads === 'number' ? maxDownloads : null,
        expiresAt: computedExpiry,
        createdById: actor.userId,
      },
    });

    if (fileId) {
      await prisma.fileActivity.create({
        data: {
          fileId,
          userId: actor.userId,
          action: 'public_link_created',
          metadata: {
            linkId: link.id,
            expiresAt: link.expiresAt,
            passwordProtected: !!passwordHash,
            maxDownloads: link.maxDownloads,
          },
        },
      });
    }

    return ok({
      id: link.id,
      token: link.token,
      url: buildPublicUrl(link.token),
      expiresAt: link.expiresAt,
      maxDownloads: link.maxDownloads,
      passwordProtected: !!passwordHash,
    });
  } catch (error) {
    console.error('[publicLinkService.createLink]', error);
    return err('PUBLIC_LINK_CREATE_FAILED', error.message);
  }
}

export async function listLinksForFile(fileId, actor) {
  try {
    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { ownerId: true, isDeleted: true },
    });
    if (!file || file.isDeleted) return err('FILE_NOT_FOUND', 'File not found');
    if (file.ownerId !== actor.userId && !(actor.roles || []).includes('super_admin')) {
      return err('ACCESS_DENIED', 'Only owner can see public links');
    }
    const links = await prisma.publicLink.findMany({
      where: { fileId },
      orderBy: { createdAt: 'desc' },
    });
    const sanitised = links.map((l) => ({
      id: l.id,
      token: l.token,
      url: buildPublicUrl(l.token),
      expiresAt: l.expiresAt,
      revokedAt: l.revokedAt,
      maxDownloads: l.maxDownloads,
      downloadCount: l.downloadCount,
      passwordProtected: !!l.passwordHash,
      createdAt: l.createdAt,
    }));
    return ok(sanitised);
  } catch (error) {
    console.error('[publicLinkService.listLinksForFile]', error);
    return err('LIST_LINKS_FAILED', error.message);
  }
}

export async function revokeLink(linkId, actor) {
  try {
    const link = await prisma.publicLink.findUnique({
      where: { id: linkId },
      include: {
        file: { select: { ownerId: true } },
        folder: { select: { ownerId: true } },
      },
    });
    if (!link) return err('LINK_NOT_FOUND', 'Public link not found');
    if (link.revokedAt) return ok({ alreadyRevoked: true, id: link.id });

    const ownerId = link.file?.ownerId ?? link.folder?.ownerId;
    const isOwner = ownerId === actor.userId;
    const isAdmin = (actor.roles || []).includes('super_admin');
    if (!isOwner && !isAdmin) return err('ACCESS_DENIED', 'Only owner can revoke');

    const updated = await prisma.publicLink.update({
      where: { id: linkId },
      data: { revokedAt: new Date() },
    });
    if (link.fileId) {
      await prisma.fileActivity.create({
        data: {
          fileId: link.fileId,
          userId: actor.userId,
          action: 'public_link_revoked',
          metadata: { linkId: link.id },
        },
      });
    }
    return ok({ id: updated.id, revokedAt: updated.revokedAt });
  } catch (error) {
    console.error('[publicLinkService.revokeLink]', error);
    return err('PUBLIC_LINK_REVOKE_FAILED', error.message);
  }
}

// --------------------------------------------------------------------------
// Public consumption (unauthenticated)
// --------------------------------------------------------------------------

/**
 * Return metadata for a token: filename / size / whether password required.
 * Does NOT return fileId or owner details.
 */
export async function inspectLink(token) {
  try {
    const link = await prisma.publicLink.findUnique({
      where: { token },
      include: {
        file: { select: { name: true, size: true, mimeType: true, isDeleted: true } },
        folder: { select: { name: true, isDeleted: true } },
      },
    });
    if (!link || link.revokedAt) return err('INVALID_TOKEN', 'Invalid or revoked link');
    if (link.expiresAt && link.expiresAt < new Date()) return err('INVALID_TOKEN', 'Link expired');
    if (link.maxDownloads && link.downloadCount >= link.maxDownloads) {
      return err('INVALID_TOKEN', 'Download limit reached');
    }
    if (link.file && link.file.isDeleted) return err('FILE_NOT_FOUND', 'File no longer available');
    if (link.folder && link.folder.isDeleted) return err('FOLDER_NOT_FOUND', 'Folder no longer available');

    return ok({
      type: link.fileId ? 'file' : 'folder',
      name: link.file?.name ?? link.folder?.name ?? null,
      size: link.file?.size ?? null,
      mimeType: link.file?.mimeType ?? null,
      passwordRequired: !!link.passwordHash,
      expiresAt: link.expiresAt,
    });
  } catch (error) {
    console.error('[publicLinkService.inspectLink]', error);
    return err('INSPECT_FAILED', error.message);
  }
}

/**
 * Resolve a token into a consumable file handle (fileId + link row).
 * Enforces password, expiry, revocation and download-limit.
 *
 * Caller (controller) uses the returned handle to stream/download the file
 * through the MinIO proxy.
 */
export async function resolveTokenForDownload(token, { password } = {}) {
  try {
    const link = await prisma.publicLink.findUnique({
      where: { token },
      include: { file: true, folder: true },
    });
    if (!link || link.revokedAt) return err('INVALID_TOKEN', 'Invalid or revoked link');
    if (link.expiresAt && link.expiresAt < new Date()) return err('INVALID_TOKEN', 'Link expired');
    if (link.maxDownloads && link.downloadCount >= link.maxDownloads) {
      return err('INVALID_TOKEN', 'Download limit reached');
    }
    if (!link.fileId) return err('UNSUPPORTED', 'Folder links require a different flow (zip)');
    if (!link.file || link.file.isDeleted) return err('FILE_NOT_FOUND', 'File no longer available');

    if (link.passwordHash) {
      if (!password) return err('PASSWORD_REQUIRED', 'Password required');
      const match = await bcrypt.compare(password, link.passwordHash);
      if (!match) return err('INVALID_PASSWORD', 'Incorrect password');
    }

    // Atomically bump the counter (returns the new value for max-limit race safety).
    const updated = await prisma.publicLink.update({
      where: { id: link.id },
      data: { downloadCount: { increment: 1 } },
      select: { downloadCount: true, maxDownloads: true },
    });
    if (updated.maxDownloads && updated.downloadCount > updated.maxDownloads) {
      // rolled over the cap — roll back the increment (best effort)
      await prisma.publicLink.update({
        where: { id: link.id },
        data: { downloadCount: { decrement: 1 } },
      });
      return err('INVALID_TOKEN', 'Download limit reached');
    }

    await prisma.fileActivity.create({
      data: {
        fileId: link.fileId,
        userId: link.createdById,
        action: 'public_download',
        metadata: { linkId: link.id, downloadCount: updated.downloadCount },
      },
    });

    return ok({
      file: link.file,
      downloadCount: updated.downloadCount,
    });
  } catch (error) {
    console.error('[publicLinkService.resolveTokenForDownload]', error);
    return err('RESOLVE_FAILED', error.message);
  }
}

export default {
  createLink,
  listLinksForFile,
  revokeLink,
  inspectLink,
  resolveTokenForDownload,
};
