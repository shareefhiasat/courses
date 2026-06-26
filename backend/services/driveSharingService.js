/**
 * Drive Sharing Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for file sharing operations
 * ARCHITECTURE: Controllers → Business Services → Nextcloud Service → Database
 */

import prisma from '../db/prismaClient.js';
import * as fileService from './fileService.js';
import { getDatabaseUserId } from '../utils/database/userResolver.js';


/**
 * Share file with specific user
 * @param {string} fileId - File ID in Nextcloud (file path)
 * @param {number} targetUserId - Database user ID to share with
 * @param {number} permissions - Permission bitmask (1=read, 2=write, 4=share, 8=delete)
 * @param {number} sharedById - Database user ID who is sharing
 * @param {Date} expiresAt - Optional expiration date
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const shareFileWithUser = async ({ fileId, targetUserId, permissions = 'VIEW', sharedById, expiresAt = null }) => {
  try {
    // Validate users
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { roleAssignments: { include: { role: true } } }
    });

    if (!targetUser) {
      return {
        success: false,
        error: 'Target user not found',
        timestamp: Date.now()
      };
    }

    const sharedByUser = await prisma.user.findUnique({
      where: { id: sharedById }
    });

    if (!sharedByUser) {
      return {
        success: false,
        error: 'Sharing user not found',
        timestamp: Date.now()
      };
    }

    // Create share in MinIO
    const shareResult = await fileService.shareFile(fileId, targetUserId, permissions, expiresAt);

    if (!shareResult.success) {
      return {
        success: false,
        error: shareResult.error || 'Failed to create share',
        timestamp: Date.now()
      };
    }

    return {
      success: true,
      data: shareResult.payload,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[driveSharingService] Share file with user error:', error);
    return {
      success: false,
      error: error.message || 'Failed to share file',
      timestamp: Date.now()
    };
  }
};

/**
 * Get shares for a file
 * @param {string} fileId - File ID in Nextcloud
 * @param {number} userId - Database user ID requesting shares
 * @param {string} subjectType - Optional filter by subject type ('USER' or 'ROLE')
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getFileShares = async ({ fileId, userId, subjectType }) => {
  try {
    const where = { fileId };
    
    // Add subjectType filter if provided
    if (subjectType) {
      where.subjectType = subjectType;
    }

    const shares = await prisma.fileShare.findMany({
      where,
      include: {
        grantedBy: {
          select: { id: true, email: true, displayName: true }
        },
        subjectUser: {
          select: { id: true, email: true, displayName: true }
        }
      }
    });

    // Filter based on user permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roleAssignments: { include: { role: true } } }
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        timestamp: Date.now()
      };
    }

    const roles = user.roleAssignments.map(ra => ra.role.code);
    const isAdmin = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');

    console.log('[driveSharingService] User roles:', roles);
    console.log('[driveSharingService] Shares before filter:', shares.map(s => ({ subjectType: s.subjectType, subjectRole: s.subjectRole, subjectUserId: s.subjectUserId })));

    // Filter based on user permissions
    const filteredShares = shares.filter(share => {
      // If subjectType filter is active, strictly enforce it
      if (subjectType) {
        // For USER shares: only show if user is recipient or granter
        if (subjectType === 'USER') {
          if (share.subjectType !== 'USER') return false;
          if (share.subjectUserId === userId) return true;
          if (share.grantedById === userId) return true;
          if (isAdmin) return true;
          return false;
        }
        
        // For ROLE shares: only show if user has the role or is granter
        if (subjectType === 'ROLE') {
          if (share.subjectType !== 'ROLE') return false;
          const hasRole = roles.some(role => role.toLowerCase() === share.subjectRole?.toLowerCase());
          console.log('[driveSharingService] ROLE share check:', { shareRole: share.subjectRole, userRoles: roles, hasRole });
          if (hasRole) return true;
          if (share.grantedById === userId) return true;
          if (isAdmin) return true;
          return false;
        }
      }
      
      // No subjectType filter - show all shares the user has access to
      // User is the one who granted the share
      if (share.grantedById === userId) return true;
      
      // User is admin
      if (isAdmin) return true;
      
      // For USER shares, check if user is the recipient
      if (share.subjectType === 'USER' && share.subjectUserId === userId) return true;
      
      // For ROLE shares, check if user has the role (case-insensitive)
      if (share.subjectType === 'ROLE') {
        const hasRole = roles.some(role => role.toLowerCase() === share.subjectRole?.toLowerCase());
        if (hasRole) return true;
      }
      
      return false;
    });

    console.log('[driveSharingService] Shares after filter:', filteredShares.length);

    return {
      success: true,
      data: filteredShares,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[driveSharingService] Get file shares error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get file shares',
      timestamp: Date.now()
    };
  }
};

/**
 * Update share permissions
 * @param {number} shareId - Database share ID
 * @param {number} permissions - New permission bitmask
 * @param {number} userId - Database user ID requesting update
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateSharePermission = async ({ shareId, permissions, userId }) => {
  try {
    const share = await prisma.fileShare.findUnique({
      where: { id: shareId },
      include: {
        sharedBy: true,
        sharedWith: true
      }
    });

    if (!share) {
      return {
        success: false,
        error: 'Share not found',
        timestamp: Date.now()
      };
    }

    // Check if user is the share owner or admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roleAssignments: { include: { role: true } } }
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        timestamp: Date.now()
      };
    }

    const roles = user.roleAssignments.map(ra => ra.role.code);
    const isAdmin = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');

    if (share.sharedById !== userId && !isAdmin) {
      return {
        success: false,
        error: 'Insufficient permissions to update share',
        timestamp: Date.now()
      };
    }

    // Update share in database
    const updatedShare = await prisma.fileShare.update({
      where: { id: shareId },
      data: { permissions }
    });

    return {
      success: true,
      data: updatedShare,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[driveSharingService] Update share permission error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update share permission',
      timestamp: Date.now()
    };
  }
};

/**
 * Delete share
 * @param {number} shareId - Database share ID
 * @param {number} userId - Database user ID requesting deletion
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteShare = async ({ shareId, userId }) => {
  try {
    const share = await prisma.fileShare.findUnique({
      where: { id: shareId },
      include: {
        sharedBy: true
      }
    });

    if (!share) {
      return {
        success: false,
        error: 'Share not found',
        timestamp: Date.now()
      };
    }

    // Check if user is the share owner or admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roleAssignments: { include: { role: true } } }
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        timestamp: Date.now()
      };
    }

    const roles = user.roleAssignments.map(ra => ra.role.code);
    const isAdmin = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');

    if (share.sharedById !== userId && !isAdmin) {
      return {
        success: false,
        error: 'Insufficient permissions to delete share',
        timestamp: Date.now()
      };
    }

    // Delete share from database
    await prisma.fileShare.delete({
      where: { id: shareId }
    });

    return {
      success: true,
      message: 'Share deleted successfully',
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[driveSharingService] Delete share error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete share',
      timestamp: Date.now()
    };
  }
};

export default {
  shareFileWithUser,
  getFileShares,
  updateSharePermission,
  deleteShare
};
