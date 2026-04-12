/**
 * Nextcloud ACL Sync Service
 *
 * PURPOSE:
 * Synchronize Keycloak user roles to Nextcloud groups for ACL enforcement.
 */

import { listUsers, getUserRealmRoles } from './keycloakAdminService.js';
import {
  ensureUser,
  ensureGroup,
  addUserToGroup,
  removeUserFromGroup
} from './nextcloudService.js';

const ROLE_TO_GROUP_MAP = {
  super_admin: process.env.NEXTCLOUD_GROUP_SUPER_ADMIN || 'nc_admins',
  admin: process.env.NEXTCLOUD_GROUP_ADMIN || 'nc_admins',
  hr: process.env.NEXTCLOUD_GROUP_HR || 'nc_hr',
  instructor: process.env.NEXTCLOUD_GROUP_INSTRUCTOR || 'nc_instructors',
  student: process.env.NEXTCLOUD_GROUP_STUDENT || 'nc_students'
};

const MANAGED_GROUPS = [...new Set(Object.values(ROLE_TO_GROUP_MAP))];

const resultOk = (payload, meta = {}) => ({
  success: true,
  payload,
  timestamp: Date.now(),
  ...meta
});

const resultErr = (code, message, meta = {}) => ({
  success: false,
  error: { code, message },
  timestamp: Date.now(),
  ...meta
});

const mapRolesToGroups = (roles = []) => {
  const groups = new Set();

  roles.forEach((role) => {
    const key = String(role || '').toLowerCase();
    if (ROLE_TO_GROUP_MAP[key]) {
      groups.add(ROLE_TO_GROUP_MAP[key]);
    }
  });

  return [...groups];
};

export const getAclMapping = async () => {
  return resultOk({
    roleToGroup: ROLE_TO_GROUP_MAP,
    managedGroups: MANAGED_GROUPS
  });
};

export const syncUserAcl = async ({ keycloakUser }) => {
  try {
    if (!keycloakUser?.id || !keycloakUser?.username) {
      return resultErr('ACL_SYNC_INVALID_USER', 'keycloakUser.id and keycloakUser.username are required');
    }

    const rolesResult = await getUserRealmRoles(keycloakUser.id);
    if (!rolesResult.success) {
      return resultErr('ACL_SYNC_ROLE_FETCH_FAILED', rolesResult.error || 'Failed to fetch user roles', {
        payload: { keycloakUserId: keycloakUser.id }
      });
    }

    const roleNames = rolesResult.data.map((r) => r.name);
    const targetGroups = mapRolesToGroups(roleNames);

    for (const groupId of MANAGED_GROUPS) {
      await ensureGroup(groupId);
    }

    const ensureNcUserResult = await ensureUser({
      userId: keycloakUser.username,
      email: keycloakUser.email || '',
      displayName: `${keycloakUser.firstName || ''} ${keycloakUser.lastName || ''}`.trim() || keycloakUser.username
    });

    if (!ensureNcUserResult.success) {
      return ensureNcUserResult;
    }

    const added = [];
    const removed = [];

    for (const groupId of targetGroups) {
      const addResult = await addUserToGroup({
        groupId,
        userId: keycloakUser.username
      });

      if (addResult.success) {
        added.push(groupId);
      }
    }

    for (const groupId of MANAGED_GROUPS.filter((groupId) => !targetGroups.includes(groupId))) {
      const removeResult = await removeUserFromGroup({
        groupId,
        userId: keycloakUser.username
      });

      if (removeResult.success) {
        removed.push(groupId);
      }
    }

    return resultOk({
      keycloakUserId: keycloakUser.id,
      nextcloudUserId: keycloakUser.username,
      roles: roleNames,
      targetGroups,
      groupsAdded: added,
      groupsRemoved: removed
    });
  } catch (error) {
    return resultErr('ACL_SYNC_USER_FAILED', error.message, {
      payload: { keycloakUserId: keycloakUser?.id || null }
    });
  }
};

export const syncAllUserAcls = async ({ search = '', first = 0, max = 100 } = {}) => {
  try {
    const usersResult = await listUsers({ search, first, max });
    if (!usersResult.success) {
      return resultErr('ACL_SYNC_USERS_FETCH_FAILED', usersResult.error || 'Failed to fetch users');
    }

    const synced = [];
    const failed = [];

    for (const keycloakUser of usersResult.data) {
      const result = await syncUserAcl({ keycloakUser });
      if (result.success) {
        synced.push(result.payload);
      } else {
        failed.push({
          keycloakUserId: keycloakUser.id,
          username: keycloakUser.username,
          error: result.error
        });
      }
    }

    return resultOk({
      total: usersResult.data.length,
      synced,
      failed
    });
  } catch (error) {
    return resultErr('ACL_SYNC_ALL_FAILED', error.message);
  }
};

export default {
  getAclMapping,
  syncUserAcl,
  syncAllUserAcls
};
