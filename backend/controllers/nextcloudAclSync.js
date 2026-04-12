/**
 * Nextcloud ACL Sync Controller
 */

import {
  getAclMapping,
  syncUserAcl,
  syncAllUserAcls
} from '../services/nextcloudAclSyncService.js';

export const getAclMappingController = async (req, res) => {
  try {
    const result = await getAclMapping();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch ACL mapping'
    });
  }
};

export const syncUserAclController = async (req, res) => {
  try {
    const { keycloakUser } = req.body;
    if (!keycloakUser?.id || !keycloakUser?.username) {
      return res.status(400).json({
        success: false,
        error: 'keycloakUser.id and keycloakUser.username are required'
      });
    }

    const result = await syncUserAcl({ keycloakUser });
    const status = result.success ? 200 : 400;
    return res.status(status).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync ACL for user'
    });
  }
};

export const syncAllUserAclsController = async (req, res) => {
  try {
    const { search = '', first = 0, max = 100 } = req.body || {};

    const result = await syncAllUserAcls({
      search,
      first: Number(first) || 0,
      max: Number(max) || 100
    });

    const status = result.success ? 200 : 400;
    return res.status(status).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync ACLs'
    });
  }
};
