/**
 * Resolve the authenticated drive actor (numeric DB user id + roles).
 * Falls back to Keycloak identity lookup when `req.user.dbId` is missing.
 */

import { getDatabaseUserId } from './database/userResolver.js';

/**
 * @param {import('express').Request} req
 * @returns {Promise<{ userId: number, roles: string[], keycloakId?: string, email?: string } | null>}
 */
export async function resolveDriveActor(req) {
  if (!req?.user) return null;

  let userId = req.user.dbId;
  if (userId == null) {
    userId = await getDatabaseUserId(req.user);
  }

  if (userId == null) return null;

  const numericId = Number(userId);
  if (Number.isNaN(numericId)) return null;

  const roles = [...new Set((req.user.roles || []).map((r) => String(r).toLowerCase()))];

  return {
    userId: numericId,
    roles,
    keycloakId: req.user.keycloakId,
    email: req.user.email,
  };
}

export default { resolveDriveActor };
