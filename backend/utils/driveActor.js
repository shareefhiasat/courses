/**
 * Resolve the authenticated drive actor (numeric DB user id + roles).
 * Falls back to Keycloak identity lookup when `req.user.dbId` is missing.
 */

import { getDatabaseUserId } from './database/userResolver.js';
import prisma from '../db/prismaClient.js';

async function loadDbRoleCodes(userId) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    include: { roleAssignments: { include: { role: true } } },
  });
  return user?.roleAssignments?.map((ra) => ra.role?.code?.toLowerCase()).filter(Boolean) || [];
}

export function mergeActorRoles(tokenRoles = [], dbRoles = []) {
  return [...new Set([
    ...tokenRoles.map((r) => String(r).toLowerCase()),
    ...dbRoles.map((r) => String(r).toLowerCase()),
  ])];
}

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

  const tokenRoles = (req.user.roles || []).map((r) => String(r).toLowerCase());
  const dbRoles = await loadDbRoleCodes(numericId);
  const roles = mergeActorRoles(tokenRoles, dbRoles);

  return {
    userId: numericId,
    roles,
    keycloakId: req.user.keycloakId,
    email: req.user.email,
  };
}

export default { resolveDriveActor };
