import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
          select: { id: true, email: true, displayName: true }
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
      include: {
        user: {
          select: { id: true, email: true, displayName: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return {
      success: true,
      data: comments,
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
 * @param {number} commentId - Database comment ID
 * @param {number} userId - Database user ID requesting deletion
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteFileComment = async ({ commentId, userId }) => {
  try {
    const comment = await prisma.fileComment.findUnique({
      where: { id: commentId },
      include: { user: true }
    });

    if (!comment) {
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

    if (comment.userId !== userId && !isAdmin) {
      return {
        success: false,
        error: 'Insufficient permissions to delete comment',
        timestamp: Date.now()
      };
    }

    await prisma.fileComment.delete({
      where: { id: commentId }
    });

    return {
      success: true,
      message: 'Comment deleted successfully',
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[fileCommentService] Delete file comment error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete file comment',
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
