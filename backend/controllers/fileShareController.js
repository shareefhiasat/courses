/**
 * File Share Controller
 *
 * Thin HTTP layer over fileShareService for unified v2 ACL management.
 * Handles user and role shares with expiry and permission levels.
 */

import fileShareService from '../services/fileShareService.js';

export async function createFileShare(req, res) {
  const { fileId, folderId, subjectType, subjectId, permission, expiresAt } = req.body;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  
  // Validate subjectId conversion for USER shares
  let subjectUserId = undefined;
  if (subjectType === 'USER') {
    const parsedId = parseInt(subjectId, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SUBJECT_ID', message: 'subjectId must be a valid positive integer for USER shares' },
        timestamp: Date.now(),
      });
    }
    subjectUserId = parsedId;
  }
  
  const result = await fileShareService.createShare(
    {
      fileId,
      folderId,
      subjectType,
      subjectUserId,
      subjectRole: subjectType === 'ROLE' ? subjectId : undefined,
      permission,
      expiresAt,
    },
    actor
  );
  if (!result.success) return res.status(400).json(result);
  return res.status(201).json(result);
}

export async function listFileShares(req, res) {
  const { fileId } = req.params;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await fileShareService.listFileShares(fileId, actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function revokeFileShare(req, res) {
  const { shareId } = req.params;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await fileShareService.revokeShare(shareId, actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function listSharedWithMe(req, res) {
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await fileShareService.listSharedWithMe(actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function listSharedFiles(req, res) {
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await fileShareService.getSharedFiles(actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export default {
  createFileShare,
  listFileShares,
  revokeFileShare,
  listSharedWithMe,
  listSharedFiles,
};
