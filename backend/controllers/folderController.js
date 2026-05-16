/**
 * Folder Controller — thin HTTP layer over folderService.
 */

import * as folderService from '../services/folderService.js';

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

export const getFolder = async (req, res) => {
  const result = await folderService.getFolderWithBreadcrumb(req.params.folderId, req.user?.dbId);
  return jsonOrStatus(res, result);
};

export const createFolder = async (req, res) => {
  const { name, parentId, isPrivate } = req.body || {};
  const result = await folderService.createFolder(req.user, { name, parentId, isPrivate });
  return jsonOrStatus(res, result, 201);
};

export const updateFolder = async (req, res) => {
  const result = await folderService.updateFolder(req.params.folderId, req.user?.dbId, req.body || {});
  return jsonOrStatus(res, result);
};

export const softDeleteFolder = async (req, res) => {
  const result = await folderService.softDeleteFolder(req.params.folderId, req.user?.dbId);
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
