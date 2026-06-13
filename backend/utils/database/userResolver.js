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
 * Auto-create user in database if not found (sync from Keycloak)
 */
const autoCreateUser = async (keycloakId, email, firstName, lastName, displayName) => {
  console.log('[userResolver] User not found in database, creating sync from Keycloak:', keycloakId);
  try {
    // Check if user exists by email (might have different keycloakId)
    if (email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
        select: { id: true, keycloakId: true }
      });
      if (existingByEmail) {
        // Update keycloakId if different
        if (existingByEmail.keycloakId !== keycloakId) {
          console.log('[userResolver] User exists by email, updating keycloakId:', existingByEmail.id);
          await prisma.user.update({
            where: { id: existingByEmail.id },
            data: { keycloakId }
          });
        }
        console.log('[userResolver] Returning existing user ID:', existingByEmail.id);
        return existingByEmail.id;
      }
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        keycloakId,
        email: email || 'pending@example.com',
        firstName: firstName || 'Pending',
        lastName: lastName || 'Sync',
        displayName: displayName || null,
        isActive: true
      },
      select: { id: true }
    });
    console.log('[userResolver] Auto-created user with ID:', user.id);
    return user.id;
  } catch (err) {
    console.error('[userResolver] Failed to auto-create user:', err);
    return null;
  }
};

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
      if (byEmail) return byEmail.id;

      // Auto-create if not found
      return await autoCreateUser(user, null, null, null, null);
    }

    // Object input — keycloak id lives on different fields depending on caller.
    const kcId = user.keycloakId || user.sub || user.id;
    if (kcId && typeof kcId === 'string') {
      const byKc = await prisma.user.findUnique({
        where: { keycloakId: kcId },
        select: { id: true },
      });
      if (byKc) return byKc.id;

      // Auto-create if not found
      return await autoCreateUser(kcId, user.email, user.firstName, user.lastName, user.displayName);
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
