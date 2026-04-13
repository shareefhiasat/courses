/**
 * Permissions Service
 * 
 * PURPOSE: Business logic for permission management
 * ARCHITECTURE: Services → DB
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      
      // Use transaction for atomic updates
      const result = await prisma.$transaction(async (tx) => {
        const results = [];
        
        for (const update of updates) {
          const { role, screenId, operationId, allowed } = update;
          
          // Upsert the permission
          const permission = await tx.rolePermission.upsert({
            where: {
              role_screenId_operationId: {
                role,
                screenId,
                operationId
              }
            },
            update: {
              allowed,
              updatedAt: new Date()
            },
            create: {
              role,
              screenId,
              operationId,
              allowed
            }
          });
          
          results.push(permission);
        }
        
        return results;
      });
      
      console.log('✅ Permissions updated successfully');
      return result;
    } catch (error) {
      console.error('Error updating permissions:', error);
      throw error;
    }
  },
  
  /**
   * Check if a role has a specific permission
   */
  async checkPermission(role, screenId, operationKey) {
    try {
      const screen = await prisma.screen.findUnique({
        where: { screenId },
        include: {
          operations: {
            where: { operationKey },
            include: {
              rolePermissions: {
                where: { role }
              }
            }
          }
        }
      });
      
      if (!screen || !screen.operations[0]) {
        return false;
      }
      
      const permission = screen.operations[0].rolePermissions[0];
      return permission ? permission.allowed : false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
};

export default permissionsService;
