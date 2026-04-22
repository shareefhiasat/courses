/**
 * File Search Controller — HTTP adapter for fileSearchService.
 */

import { searchFiles } from '../services/fileSearchService.js';

export const search = async (req, res) => {
  try {
    const {
      q,
      mimeTypePrefix,
      ownerId,
      folderId,
      folderPathPrefix,
      modifiedAfter,
      modifiedBefore,
      page,
      pageSize,
    } = req.query || {};

    const result = await searchFiles(req.user, {
      q,
      mimeTypePrefix,
      ownerId: ownerId ? parseInt(ownerId, 10) : undefined,
      folderId,
      folderPathPrefix,
      modifiedAfter,
      modifiedBefore,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 30,
    });
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (error) {
    console.error('[fileSearchController.search]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export default { search };
