/**
 * File Share Controller
 *
 * Thin HTTP layer over fileShareService for unified v2 ACL management.
 * Handles user and role shares with expiry and permission levels.
 */

import fileShareService from '../services/fileShareService.js';
import prisma from '../db/prismaClient.js';
import notificationGateway from '../services/notifications/index.js';
import { EVENTS } from '../services/notifications/constants.js';
import { SHARE_SUBJECT_TYPES } from '../constants/driveConstants.js';
import { buildNotificationNameVars } from '../utils/localizedUserName.js';
import { resolveDriveActor } from '../utils/driveActor.js';

export async function createFileShare(req, res) {
  const { fileId, folderId, subjectType, subjectId, permission, expiresAt } = req.body;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };

  // Validate subjectType
  if (!Object.values(SHARE_SUBJECT_TYPES).includes(subjectType)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_SUBJECT_TYPE', message: `subjectType must be one of ${Object.values(SHARE_SUBJECT_TYPES).join(', ')}` },
      timestamp: Date.now(),
    });
  }

  // Validate subjectId conversion for USER shares
  let subjectUserId = undefined;
  if (subjectType === SHARE_SUBJECT_TYPES.USER) {
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
      subjectRole: subjectType === SHARE_SUBJECT_TYPES.ROLE ? subjectId : undefined,
      permission,
      expiresAt,
    },
    actor
  );
  if (!result.success) return res.status(400).json(result);

  // Emit notification for folder share
  if (result.success && folderId && subjectType === SHARE_SUBJECT_TYPES.USER) {
    try {
      const folderResult = await fileShareService.getFolderDetailsForNotification(folderId);
      if (folderResult.success && folderResult.payload) {
        const folder = folderResult.payload;
        const sharer = await prisma.user.findUnique({
          where: { id: req.user?.dbId },
          select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true }
        });
        await notificationGateway.emit(
          EVENTS.DRIVE_FOLDER_SHARED,
          {
            ...buildNotificationNameVars(sharer, 'Unknown User'),
            folderName: folder.name,
            folderNameAr: folder.nameAr,
            sharedBy: folder.owner?.displayName || `${folder.owner?.firstName} ${folder.owner?.lastName}`,
            senderName: sharer?.displayName || 'Unknown',
            senderId: req.user?.dbId,
            recipientType: 'user',
            recipientUserId: subjectUserId,
          },
          req.user,
          { userId: subjectUserId }
        );
      }
    } catch (notifError) {
      console.error('[fileShareController] Failed to emit folder share notification:', notifError);
    }
  }

  return res.status(201).json(result);
}

export async function listFileShares(req, res) {
  try {
    const { fileId } = req.params;
    const { subjectType } = req.query;
    const actor = await resolveDriveActor(req);
    if (!actor?.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_ACTOR', message: 'Authenticated actor required' },
        timestamp: Date.now(),
      });
    }

    console.log('[fileShareController] listFileShares called:', { fileId, subjectType, userId: actor.userId, roles: actor.roles });

    const result = await fileShareService.listFileShares(fileId, actor, subjectType);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (error) {
    console.error('[fileShareController.listFileShares]', error);
    return res.status(500).json({
      success: false,
      error: { code: 'LIST_SHARES_FAILED', message: error.message },
      timestamp: Date.now(),
    });
  }
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

export async function listSharedByMe(req, res) {
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await fileShareService.listSharedByMe(actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export default {
  createFileShare,
  listFileShares,
  revokeFileShare,
  listSharedWithMe,
  listSharedByMe,
  listSharedFiles,
};
