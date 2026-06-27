import prisma from '../db/prismaClient.js';
import { USER_NAME_SELECT_WITH_ID } from '../utils/userNameFields.js';

/**
 * Add comment to file
 * @param {string} fileId - File ID in Nextcloud
 * @param {number} userId - Database user ID adding the comment
 * @param {string} comment - Comment text
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const addFileComment = async ({ fileId, userId, comment }) => {
  try {
    if (!comment || comment.trim().length === 0) {
      return {
        success: false,
        error: 'Comment text is required',
        timestamp: Date.now()
      };
    }

    const fileComment = await prisma.fileComment.create({
      data: {
        fileId,
        userId,
        content: comment.trim()
      },
      include: {
        user: {
          select: USER_NAME_SELECT_WITH_ID
        }
      }
    });

    return {
      success: true,
      payload: fileComment,
      error: null,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[fileCommentService] Add file comment error:', error);
    return {
      success: false,
      error: error.message || 'Failed to add file comment',
      timestamp: Date.now()
    };
  }
};

/**
 * Get file comments
 * @param {string} fileId - File ID in Nextcloud
 * @param {number} userId - Database user ID requesting comments
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getFileComments = async ({ fileId, userId }) => {
  try {
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

    const comments = await prisma.fileComment.findMany({
      where: { fileId },
      select: {
        id: true,
        content: true,
        userId: true,
        createdAt: true,
        user: {
          select: USER_NAME_SELECT_WITH_ID
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return {
      success: true,
      payload: comments,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[fileCommentService] Get file comments error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get file comments',
      timestamp: Date.now()
    };
  }
};

/**
 * Delete file comment
 * @param {string} commentId - Database comment ID (UUID)
 * @param {number} userId - Database user ID requesting deletion
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteFileComment = async ({ commentId, userId }) => {
  try {
    console.log('[fileCommentService] deleteFileComment called with:', { commentId, userId, commentIdType: typeof commentId });

    if (!commentId) {
      console.log('[fileCommentService] Missing commentId');
      return {
        success: false,
        error: 'Comment ID is required',
        timestamp: Date.now()
      };
    }

    const comment = await prisma.fileComment.findUnique({
      where: { id: commentId },
      include: { 
        user: true,
        file: { select: { ownerId: true } }
      }
    });

    if (!comment) {
      console.log('[fileCommentService] Comment not found with ID:', commentId);
      return {
        success: false,
        error: 'Comment not found',
        timestamp: Date.now()
      };
    }

    console.log('[fileCommentService] Comment found:', { commentId: comment.id, userId: comment.userId, fileOwnerId: comment.file.ownerId });

    // Check if user is the comment owner, file owner, or admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roleAssignments: { include: { role: true } } }
    });

    if (!user) {
      console.log('[fileCommentService] User not found with ID:', userId);
      return {
        success: false,
        error: 'User not found',
        timestamp: Date.now()
      };
    }

    const roles = user.roleAssignments.map(ra => ra.role.code);
    const isAdmin = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN') || roles.includes('HR');

    console.log('[fileCommentService] User roles:', roles, 'isAdmin:', isAdmin);

    // Only comment owner, file owner, admin, or HR can delete
    if (comment.userId !== userId && comment.file.ownerId !== userId && !isAdmin) {
      console.log('[fileCommentService] Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to delete comment',
        timestamp: Date.now()
      };
    }

    await prisma.fileComment.delete({
      where: { id: commentId }
    });

    console.log('[fileCommentService] Comment deleted successfully');

    return {
      success: true,
      message: 'Comment deleted successfully',
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[fileCommentService] Delete error:', error);
    console.error('[fileCommentService] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    console.error('[fileCommentService] Error stack:', error.stack);
    return {
      success: false,
      error: error.message || 'Failed to delete comment',
      timestamp: Date.now()
    };
  }
};

/**
 * Update file comment
 * @param {number} commentId - Database comment ID
 * @param {string} comment - Updated comment text
 * @param {number} userId - Database user ID requesting update
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateFileComment = async ({ commentId, comment, userId }) => {
  try {
    if (!comment || comment.trim().length === 0) {
      return {
        success: false,
        error: 'Comment text is required',
        timestamp: Date.now()
      };
    }

    const existingComment = await prisma.fileComment.findUnique({
      where: { id: commentId },
      include: { user: true }
    });

    if (!existingComment) {
      return {
        success: false,
        error: 'Comment not found',
        timestamp: Date.now()
      };
    }

    // Check if user is the comment owner or admin
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

    if (existingComment.userId !== userId && !isAdmin) {
      return {
        success: false,
        error: 'Insufficient permissions to update comment',
        timestamp: Date.now()
      };
    }

    const updatedComment = await prisma.fileComment.update({
      where: { id: commentId },
      data: { content: comment.trim() },
      include: {
        user: {
          select: { id: true, email: true, displayName: true }
        }
      }
    });

    return {
      success: true,
      payload: updatedComment,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[fileCommentService] Update file comment error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update file comment',
      timestamp: Date.now()
    };
  }
};

export default {
  addFileComment,
  getFileComments,
  deleteFileComment,
  updateFileComment
};
