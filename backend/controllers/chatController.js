/**
 * Chat Controller
 * 
 * HTTP handlers for chat operations
 */

import chatDb from '../db/chat-postgres.js';
import { PrismaClient } from '@prisma/client';
import notificationGateway from '../services/notifications/index.js';
import { EVENTS } from '../services/notifications/constants.js';

const prisma = new PrismaClient();

/**
 * Get user's chat rooms
 * GET /api/v1/chat/rooms
 */
export const getRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: {
            role: true
          }
        }
      }
    });

    const roles = user.roleAssignments.map(ra => ra.role.code);

    // Get enrolled class IDs
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { classId: true }
    });
    const enrolledClassIds = enrollments.map(e => e.classId);

    // Get rooms
    const rooms = await chatDb.getUserRooms(userId, roles, enrolledClassIds);

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('[chatController] Error in getRooms:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get messages for a room
 * GET /api/v1/chat/rooms/:roomId/messages
 */
export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit, before, after } = req.query;
    const userId = req.user.id;

    // Verify user has access to this room
    const room = await prisma.chatRoom.findUnique({
      where: { id: parseInt(roomId) },
      include: {
        class: {
          include: {
            enrollments: {
              where: { userId }
            },
            instructor: true
          }
        }
      }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Check access permissions
    const hasAccess = 
      room.type === 'global' || // Everyone can access global
      (room.type === 'class' && room.class.enrollments.length > 0) || // Enrolled in class
      (room.type === 'class' && room.class.instructorId === userId) || // Instructor of class
      (room.type === 'dm' && (room.participantA === userId || room.participantB === userId)); // Participant in DM

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const messages = await chatDb.getRoomMessages(parseInt(roomId), {
      limit: limit ? parseInt(limit) : 50,
      before: before ? parseInt(before) : null,
      after: after ? parseInt(after) : null
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('[chatController] Error in getMessages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Send a message
 * POST /api/v1/chat/rooms/:roomId/messages
 */
export const sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const messageData = req.body;

    // Verify room exists and user has access
    const room = await prisma.chatRoom.findUnique({
      where: { id: parseInt(roomId) },
      include: {
        class: {
          include: {
            enrollments: true,
            instructor: true
          }
        }
      }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Create message
    const message = await chatDb.createMessage({
      roomId: parseInt(roomId),
      senderId: userId,
      type: messageData.type || 'text',
      content: messageData.content,
      fileUrl: messageData.fileUrl,
      filePath: messageData.filePath,
      fileName: messageData.fileName,
      fileType: messageData.fileType,
      fileSize: messageData.fileSize,
      pollOptions: messageData.pollOptions,
      replyToId: messageData.replyToId
    });

    // Emit WebSocket event (will be handled by websocketServer)
    if (global.chatWSEmitter) {
      // For class chats, emit to all enrolled students and instructor
      if (room.type === 'class') {
        const recipients = [
          ...room.class.enrollments.map(e => e.userId),
          room.class.instructorId
        ].filter(id => id && id !== userId);

        recipients.forEach(recipientId => {
          global.chatWSEmitter(recipientId, 'chat:message', message);
        });
      }
      // For DMs, emit to the other participant
      else if (room.type === 'dm') {
        const recipientId = room.participantA === userId ? room.participantB : room.participantA;
        if (recipientId) {
          global.chatWSEmitter(recipientId, 'chat:message', message);
        }
      }
      // For global, emit to all connected users (handled by broadcast)
      else if (room.type === 'global') {
        if (global.chatWSBroadcast) {
          global.chatWSBroadcast('chat:message', message);
        }
      }
    }

    // Send notifications
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });
    const senderName = `${sender.firstName} ${sender.lastName}`;

    if (room.type === 'class') {
      // Notify all class members except sender
      await notificationGateway.emit(
        EVENTS.CHAT_MESSAGE_RECEIVED,
        {
          roomName: room.class.nameEn,
          senderName,
          messagePreview: messageData.content?.substring(0, 50) || '[File]'
        },
        { id: userId },
        { classId: room.classId }
      );
    } else if (room.type === 'dm') {
      // Notify the other participant
      const recipientId = room.participantA === userId ? room.participantB : room.participantA;
      await notificationGateway.emit(
        EVENTS.CHAT_DM_RECEIVED,
        {
          senderName,
          messagePreview: messageData.content?.substring(0, 50) || '[File]'
        },
        { id: userId },
        { userId: recipientId }
      );
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('[chatController] Error in sendMessage:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update a message
 * PUT /api/v1/chat/messages/:messageId
 */
export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    // Verify message exists and user is sender
    const existingMessage = await prisma.chatMessage.findUnique({
      where: { id: parseInt(messageId) }
    });

    if (!existingMessage) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    if (existingMessage.senderId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own messages'
      });
    }

    const message = await chatDb.updateMessage(parseInt(messageId), { content });

    // Emit WebSocket event for real-time update
    if (global.chatWSBroadcast) {
      global.chatWSBroadcast('chat:message_updated', message);
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('[chatController] Error in updateMessage:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a message
 * DELETE /api/v1/chat/messages/:messageId
 */
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Verify message exists and user is sender or admin
    const existingMessage = await prisma.chatMessage.findUnique({
      where: { id: parseInt(messageId) }
    });

    if (!existingMessage) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Get user roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: { role: true }
        }
      }
    });
    const roles = user.roleAssignments.map(ra => ra.role.code);
    const isAdmin = roles.some(r => ['admin', 'superadmin'].includes(r));

    if (existingMessage.senderId !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own messages'
      });
    }

    const message = await chatDb.deleteMessage(parseInt(messageId));

    // Emit WebSocket event for real-time update
    if (global.chatWSBroadcast) {
      global.chatWSBroadcast('chat:message_deleted', { id: message.id, roomId: message.roomId });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('[chatController] Error in deleteMessage:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create or get DM room
 * POST /api/v1/chat/dm
 */
export const createDM = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        error: 'recipientId is required'
      });
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId }
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    // Check DM permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: { role: true }
        }
      }
    });
    const userRoles = user.roleAssignments.map(ra => ra.role.code);
    const isStudent = userRoles.includes('student');

    if (isStudent) {
      // Students can only DM their instructors
      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        select: { classId: true }
      });
      const classIds = enrollments.map(e => e.classId);

      const classes = await prisma.class.findMany({
        where: { id: { in: classIds } },
        select: { instructorId: true }
      });
      const instructorIds = classes.map(c => c.instructorId).filter(Boolean);

      if (!instructorIds.includes(recipientId)) {
        return res.status(403).json({
          success: false,
          error: 'Students can only message their instructors'
        });
      }
    }

    // Create or get DM room
    const room = await chatDb.getOrCreateRoom({
      type: 'dm',
      participantA: Math.min(userId, recipientId),
      participantB: Math.max(userId, recipientId)
    });

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('[chatController] Error in createDM:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Add/remove reaction
 * POST /api/v1/chat/messages/:messageId/reactions
 */
export const toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { reactionType, remove } = req.body;

    const message = await chatDb.toggleReaction(
      parseInt(messageId),
      userId,
      reactionType,
      remove || false
    );

    // Emit WebSocket event for real-time update
    if (global.chatWSBroadcast) {
      global.chatWSBroadcast('chat:reaction', message);
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('[chatController] Error in toggleReaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Vote on poll
 * POST /api/v1/chat/messages/:messageId/vote
 */
export const votePoll = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { optionIndex } = req.body;

    const message = await chatDb.votePoll(
      parseInt(messageId),
      userId,
      optionIndex
    );

    // Emit WebSocket event for real-time update
    if (global.chatWSBroadcast) {
      global.chatWSBroadcast('chat:poll_vote', message);
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('[chatController] Error in votePoll:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get users available for DM
 * GET /api/v1/chat/users
 */
export const getAvailableUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: { role: true }
        }
      }
    });
    const userRoles = user.roleAssignments.map(ra => ra.role.code);

    const users = await chatDb.getAvailableDMUsers(userId, userRoles);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('[chatController] Error in getAvailableUsers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  getRooms,
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  createDM,
  toggleReaction,
  votePoll,
  getAvailableUsers
};
