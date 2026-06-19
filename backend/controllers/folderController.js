/**
 * Folder Controller — thin HTTP layer over folderService.
 */

import * as folderService from '../services/folderService.js';
import { PrismaClient } from '@prisma/client';
import notificationGateway from '../services/notifications/index.js';
import { EVENTS } from '../services/notifications/constants.js';

const prisma = new PrismaClient();

const jsonOrStatus = (res, result, okStatus = 200) => {
  if (!result.success) {
    const code = result.error?.code;
    const status = code === 'FOLDER_NOT_FOUND' || code === 'PARENT_NOT_FOUND' ? 404
      : code === 'ACCESS_DENIED' ? 403
      : code === 'FOLDER_EXISTS' || code === 'CYCLE' || code === 'INVALID_INPUT' ? 400
      : 500;
    return res.status(status).json(result);
  }
  return res.status(okStatus).json(result);
};

export const listChildren = async (req, res) => {
  const result = await folderService.listChildren(req.user, {
    parentId: req.query.parentId || null,
    includeDeleted: req.query.includeDeleted === 'true',
  });
  return jsonOrStatus(res, result);
};

export const getFolderTree = async (req, res) => {
  const result = await folderService.getFolderTree(req.user);
  return jsonOrStatus(res, result);
};

export const getFolder = async (req, res) => {
  console.log('[folderController] getFolder called with folderId:', req.params.folderId, 'userId:', req.user?.dbId);
  const result = await folderService.getFolderWithBreadcrumb(req.params.folderId, req.user?.dbId);
  console.log('[folderController] getFolder result:', result);
  return jsonOrStatus(res, result);
};

export const createFolder = async (req, res) => {
  const { name, parentId, isPrivate } = req.body || {};
  const result = await folderService.createFolder(req.user, { name, parentId, isPrivate });
  
  // Emit notification for folder creation if successful
  if (result.success && result.payload) {
    try {
      const folder = await prisma.folder.findUnique({
        where: { id: result.payload.id },
        include: {
          user: { select: { displayName: true, firstName: true, lastName: true, displayNameAr: true, firstNameAr: true, lastNameAr: true } }
        }
      });

      if (folder && folder.parentId) {
        // Get all users who have access to parent folder
        const parentShares = await prisma.folderShare.findMany({
          where: { folderId: folder.parentId },
          select: { sharedWithId: true }
        });

        const recipientIds = [folder.userId, ...parentShares.map(s => s.sharedWithId)].filter(id => id !== req.user?.dbId);

        if (recipientIds.length > 0) {
          await notificationGateway.emit(
            EVENTS.DRIVE_FOLDER_CREATED,
            {
              folderName: folder.name,
              createdBy: folder.user?.displayName || `${folder.user?.firstName} ${folder.user?.lastName}`
            },
            req.user,
            { userIds: recipientIds }
          );
        }
      }
    } catch (notifError) {
      console.error('[folderController] Failed to emit folder creation notification:', notifError);
    }
  }
  
  return jsonOrStatus(res, result, 201);
};

export const updateFolder = async (req, res) => {
  const result = await folderService.updateFolder(req.params.folderId, req.user?.dbId, req.body || {});
  return jsonOrStatus(res, result);
};

export const softDeleteFolder = async (req, res) => {
  // Get folder details before deletion
  const folder = await prisma.folder.findUnique({
    where: { id: req.params.folderId },
    include: {
      user: { select: { displayName: true, firstName: true, lastName: true, displayNameAr: true, firstNameAr: true, lastNameAr: true } }
    }
  });

  const result = await folderService.softDeleteFolder(req.params.folderId, req.user?.dbId, req.user?.roles || []);
  
  // Emit notification for folder deletion if successful
  if (result.success && folder) {
    try {
      // Get all users who have access to this folder
      const folderShares = await prisma.folderShare.findMany({
        where: { folderId: folder.id },
        select: { sharedWithId: true }
      });

      const recipientIds = [folder.userId, ...folderShares.map(s => s.sharedWithId)].filter(id => id !== req.user?.dbId);

      if (recipientIds.length > 0) {
        await notificationGateway.emit(
          EVENTS.DRIVE_FOLDER_DELETED,
          {
            folderName: folder.name,
            deletedBy: folder.user?.displayName || `${folder.user?.firstName} ${folder.user?.lastName}`
          },
          req.user,
          { userIds: recipientIds }
        );
      }
    } catch (notifError) {
      console.error('[folderController] Failed to emit folder deletion notification:', notifError);
    }
  }
  
  return jsonOrStatus(res, result);
};

export const restoreFolder = async (req, res) => {
  const result = await folderService.restoreFolder(req.params.folderId, req.user?.dbId);
  return jsonOrStatus(res, result);
};

export const toggleStarFolder = async (req, res) => {
  const result = await folderService.toggleStarFolder(req.params.folderId, req.user?.dbId);
  return jsonOrStatus(res, result);
};

export const downloadFolder = async (req, res) => {
  const result = await folderService.downloadFolder(req.params.folderId, req.user?.dbId, req, res);
  if (!result.success) {
    const code = result.error?.code;
    const status = code === 'FOLDER_NOT_FOUND' ? 404
      : code === 'ACCESS_DENIED' ? 403
      : 500;
    return res.status(status).json(result);
  }
  // Result is handled by streaming response in service
};
