/**
 * Permissions Service
 * 
 * PURPOSE: Business logic for permission management
 * ARCHITECTURE: Services → DB
 */

import prisma from '../db/prismaClient.js';
import { expandWithDependencies, SUPER_ADMIN_ONLY_OPERATION_KEYS } from '../utils/permissionDependencies.js';


/**
 * Get all permissions
 */
export const permissionsService = {
  /**
   * Get all permissions (screens, operations, role permissions)
   */
  async getPermissions(lang = 'en') {
    try {
      // Fetch from database
      const screens = await prisma.screen.findMany({
        where: { isActive: true },
        include: {
          operations: {
            where: { isActive: true },
            include: {
              rolePermissions: true
            },
            orderBy: { category: 'asc' }
          }
        },
        orderBy: { category: 'asc' }
      });
      
      // Get all roles
      const roles = ['super_admin', 'admin', 'hr', 'instructor', 'student'];
      
      // Build tree structure
      const tree = screens.map(screen => ({
        id: screen.id,
        screenId: screen.screenId,
        name: lang === 'ar' ? screen.nameAr : screen.nameEn,
        description: lang === 'ar' ? screen.descriptionAr : screen.descriptionEn,
        category: screen.category,
        operations: screen.operations.map(op => ({
          id: op.id,
          operationKey: op.operationKey,
          name: lang === 'ar' ? op.nameAr : op.nameEn,
          description: lang === 'ar' ? op.descriptionAr : op.descriptionEn,
          category: op.category,
          permissions: roles.map(role => {
            const perm = op.rolePermissions.find(p => p.role === role);
            return {
              role,
              allowed: perm ? perm.allowed : false
            };
          })
        }))
      }));
      
      return tree;
    } catch (error) {
      console.error('Error getting permissions:', error);
      throw error;
    }
  },
  
  /**
   * Update permissions (batch update)
   */
  async updatePermissions(updates) {
    try {
      console.log(`📝 Updating ${updates.length} permissions`);

      const allOps = await prisma.operation.findMany({
        where: { isActive: true },
        select: { id: true, operationKey: true, screenId: true },
      });
      const opById = new Map(allOps.map((o) => [o.id, o]));
      const opByKey = new Map(allOps.map((o) => [o.operationKey, o]));

      const grantingKeys = [];
      const grantUpdates = [];
      for (const update of updates) {
        if (!update.allowed) continue;
        const op = opById.get(update.operationId);
        if (!op) continue;
        if (SUPER_ADMIN_ONLY_OPERATION_KEYS.has(op.operationKey) && update.role !== 'super_admin') {
          continue;
        }
        grantingKeys.push(op.operationKey);
        grantUpdates.push({ update, op });
      }

      const { implied } = expandWithDependencies(grantingKeys, opByKey);

      const merged = new Map();
      for (const update of updates) {
        merged.set(`${update.role}:${update.operationId}`, update);
      }

      for (const { update, op } of grantUpdates) {
        const { implied: perOpImplied } = expandWithDependencies([op.operationKey], opByKey);
        for (const item of perOpImplied) {
          const prereqOp = opByKey.get(item.operationKey);
          if (!prereqOp) continue;
          if (SUPER_ADMIN_ONLY_OPERATION_KEYS.has(item.operationKey) && update.role !== 'super_admin') {
            continue;
          }
          merged.set(`${update.role}:${prereqOp.id}`, {
            role: update.role,
            screenId: prereqOp.screenId,
            operationId: prereqOp.id,
            allowed: true,
          });
        }
      }

      const mergedUpdates = [...merged.values()];

      const result = await prisma.$transaction(async (tx) => {
        const results = [];
        for (const update of mergedUpdates) {
          const { role, screenId, operationId, allowed } = update;
          const permission = await tx.rolePermission.upsert({
            where: {
              role_screenId_operationId: { role, screenId, operationId },
            },
            update: { allowed, updatedAt: new Date() },
            create: { role, screenId, operationId, allowed },
          });
          results.push(permission);
        }
        return results;
      });

      console.log('✅ Permissions updated successfully');
      return { permissions: result, impliedGrants: implied };
    } catch (error) {
      console.error('Error updating permissions:', error);
      throw error;
    }
  },
  
  /**
   * Check if a role has a specific permission (by screenId + operationKey or full operationKey).
   */
  async checkPermission(role, screenId, operationKey) {
    const key = operationKey.includes('.') ? operationKey : `${screenId}.${operationKey}`;
    return this.checkPermissionForRoles([role], key);
  },

  /**
   * Union check: allowed if any of the user's roles grants the operation.
   * @param {string[]} roles
   * @param {string} operationKey - e.g. "qr-scanner.canMarkAttendance"
   */
  async checkPermissionForRoles(roles = [], operationKey) {
    try {
      const uniqueRoles = [...new Set((roles || []).map((r) => String(r).toLowerCase()))];
      if (uniqueRoles.length === 0) return false;

      const operation = await prisma.operation.findFirst({
        where: { operationKey, isActive: true },
        include: {
          rolePermissions: {
            where: { role: { in: uniqueRoles } },
          },
        },
      });

      if (!operation) return false;
      return operation.rolePermissions.some((p) => p.allowed);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  },
};

export default permissionsService;
