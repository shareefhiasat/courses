/**
 * User Resolver Utility
 *
 * Resolves a Keycloak identity (uuid, email, user object) to the local DB `users.id`.
 * Centralised so every service (files, sharing, workflows) uses the same lookup rules
 * and we never have to pass raw Prisma around.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Resolve a DB user id from:
 *   - a raw Keycloak UUID string
 *   - an email string
 *   - a request-user object `{ id?, keycloakId?, email?, displayName? }`
 *
 * @param {string|object|null|undefined} user
 * @returns {Promise<number|null>} numeric `users.id` or null when not found
 */
export const getDatabaseUserId = async (user) => {
  if (!user) return null;

  try {
    // String input: try keycloakId first, then email.
    if (typeof user === 'string') {
      const byKc = await prisma.user.findUnique({
        where: { keycloakId: user },
        select: { id: true },
      });
      if (byKc) return byKc.id;

      const byEmail = await prisma.user.findUnique({
        where: { email: user },
        select: { id: true },
      });
      return byEmail ? byEmail.id : null;
    }

    // Object input — keycloak id lives on different fields depending on caller.
    const kcId = user.keycloakId || user.sub || user.id;
    if (kcId && typeof kcId === 'string') {
      const byKc = await prisma.user.findUnique({
        where: { keycloakId: kcId },
        select: { id: true },
      });
      if (byKc) return byKc.id;
    }

    if (user.email) {
      const byEmail = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      });
      if (byEmail) return byEmail.id;
    }

    if (user.displayName) {
      const byName = await prisma.user.findFirst({
        where: { displayName: user.displayName },
        select: { id: true },
      });
      if (byName) return byName.id;
    }

    return null;
  } catch (err) {
    console.error('[userResolver] getDatabaseUserId failed:', err);
    return null;
  }
};

export default { getDatabaseUserId };
