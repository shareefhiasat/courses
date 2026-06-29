/**
 * Chat Controller
 * 
 * HTTP handlers for chat operations
 */

import chatDb from '../db/chat-postgres.js';
import prisma from '../db/prismaClient.js';
import notificationGateway from '../services/notifications/index.js';
import { EVENTS } from '../services/notifications/constants.js';


/**
 * Resolve Keycloak UUID to database user ID
 */
const resolveDbUserId = (req) => {
  if (req.user?.dbId) return req.user.dbId;
  if (req.actor?.userId) return req.actor.userId;
  return null;
};

/**
 * Get user's chat rooms
 * GET /api/v1/chat/rooms
 */
export const getRooms = async (req, res) => {
  try {
    const userId = resolveDbUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }
    
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

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

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
    const userId = resolveDbUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }

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

    // Get user roles for access check
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: { roleAssignments: { include: { role: true } } }
    });
    const userRoles = userRecord?.roleAssignments?.map(ra => ra.role.code) || [];
    const isStaffAdmin = userRoles.some(r => {
      const lc = r?.toLowerCase();
      return lc === 'admin' || lc === 'super_admin' || lc === 'superadmin' || lc === 'hr' || lc === 'instructor';
    });

    // Check access permissions
    const hasAccess = 
      isStaffAdmin || // Admin/HR can access all rooms
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
    const userId = resolveDbUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }
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
      // Always emit to sender so they get real-time update of their own message
      global.chatWSEmitter(userId, 'chat:message', message);

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
      // For group chats, emit to all participants
      else if (room.type === 'group') {
        const participants = await prisma.chatRoomParticipant.findMany({
          where: { roomId: parseInt(roomId) },
          select: { userId: true }
        });
        const recipientIds = participants.map(p => p.userId).filter(id => id !== userId);
        recipientIds.forEach(recipientId => {
          global.chatWSEmitter(recipientId, 'chat:message', message);
        });
      }
    }

    // Send notifications
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });
    const senderName = `${sender.firstName} ${sender.lastName}`;

    // Parse @mentions from message content
    const mentionedUserIds = [];
    if (messageData.content && messageData.type === 'text') {
      const mentionPattern = /@(\w+)/g;
      const mentions = [...messageData.content.matchAll(mentionPattern)];
      
      if (mentions.length > 0) {
        const mentionedNames = mentions.map(m => m[1].toLowerCase());
        
        // Resolve mentions to user IDs (match by firstName, lastName, or displayName)
        const mentionedUsers = await prisma.user.findMany({
          where: {
            OR: [
              { firstName: { in: mentionedNames, mode: 'insensitive' } },
              { lastName: { in: mentionedNames, mode: 'insensitive' } },
              { displayName: { in: mentionedNames, mode: 'insensitive' } }
            ],
            isActive: true
          },
          select: { id: true }
        });
        
        mentionedUserIds.push(...mentionedUsers.map(u => u.id).filter(id => id !== userId));
      }
    }

    // Send mention notifications to mentioned users
    if (mentionedUserIds.length > 0) {
      const roomName = room.type === 'class' 
        ? room.class.nameEn 
        : room.type === 'dm' 
          ? 'Direct Message' 
          : 'Global Chat';
      
      for (const mentionedUserId of mentionedUserIds) {
        await notificationGateway.emit(
          EVENTS.CHAT_MENTION,
          {
            senderName,
            roomName,
            messagePreview: messageData.content?.substring(0, 50) || '[File]'
          },
          { id: userId },
          { userId: mentionedUserId }
        );
      }
    }

    if (room.type === 'class') {
      // Notify all class members except sender and mentioned users
      const classMembers = [
        ...room.class.enrollments.map(e => e.userId),
        room.class.instructorId
      ].filter(id => id && id !== userId && !mentionedUserIds.includes(id));
      
      if (classMembers.length > 0) {
        await notificationGateway.emit(
          EVENTS.CHAT_MESSAGE_RECEIVED,
          {
            roomName: room.class.nameEn,
            senderName,
            messagePreview: messageData.content?.substring(0, 50) || '[File]'
          },
          { id: userId },
          { userIds: classMembers }
        );
      }
    } else if (room.type === 'dm') {
      // Notify the other participant (only if not mentioned)
      const recipientId = room.participantA === userId ? room.participantB : room.participantA;
      if (recipientId && !mentionedUserIds.includes(recipientId)) {
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
    } else if (room.type === 'group') {
      // Notify all group participants except sender and mentioned users
      const participants = await prisma.chatRoomParticipant.findMany({
        where: { roomId: parseInt(roomId) },
        select: { userId: true }
      });
      const participantIds = participants.map(p => p.userId).filter(id => id !== userId && !mentionedUserIds.includes(id));
      
      if (participantIds.length > 0) {
        await notificationGateway.emit(
          EVENTS.CHAT_MESSAGE_RECEIVED,
          {
            roomName: room.name || 'Group Chat',
            senderName,
            messagePreview: messageData.content?.substring(0, 50) || '[File]'
          },
          { id: userId },
          { userIds: participantIds }
        );
      }
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
    const userId = resolveDbUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }
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
    const userId = resolveDbUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }

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
    const userId = resolveDbUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }
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
    const userRoles = user.roleAssignments.map(ra => ra.role.code.toLowerCase());
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
    const userId = resolveDbUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }
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
    const userId = resolveDbUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }
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
    const userId = resolveDbUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
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

/**
 * Create group chat room (staff only)
 * POST /api/v1/chat/rooms/group
 */
export const createGroupRoom = async (req, res) => {
  try {
    const userId = resolveDbUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }

    // Check if user is staff (instructor, hr, admin, super_admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: { role: true }
        }
      }
    });
    const userRoles = user.roleAssignments.map(ra => ra.role.code);
    const isStaff = userRoles.some(role => ['instructor', 'hr', 'admin', 'super_admin'].includes(role));
    
    if (!isStaff) {
      return res.status(403).json({ success: false, error: 'Only staff can create group chats' });
    }

    const { name, participantIds } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }
    
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one participant is required' });
    }

    // Create group room
    const room = await prisma.chatRoom.create({
      data: {
        type: 'group',
        name: name.trim(),
        createdBy: userId,
        participants: {
          create: [
            { userId }, // Creator is automatically a participant
            ...participantIds.filter(id => id !== userId).map(id => ({ userId: id }))
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                profileImageUrl: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('[chatController] Error in createGroupRoom:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Add participant to group chat (creator only)
 * POST /api/v1/chat/rooms/:roomId/participants
 */
export const addParticipant = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId: participantId } = req.body;
    const userId = resolveDbUserId(req);
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }

    // Check if room exists and user is creator
    const room = await prisma.chatRoom.findUnique({
      where: { id: parseInt(roomId) }
    });

    if (!room || room.type !== 'group') {
      return res.status(404).json({ success: false, error: 'Group chat not found' });
    }

    if (room.createdBy !== userId) {
      return res.status(403).json({ success: false, error: 'Only the group creator can add participants' });
    }

    // Add participant
    const participant = await prisma.chatRoomParticipant.create({
      data: {
        roomId: parseInt(roomId),
        userId: participantId
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: participant
    });
  } catch (error) {
    console.error('[chatController] Error in addParticipant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Remove participant from group chat (creator only)
 * DELETE /api/v1/chat/rooms/:roomId/participants/:participantUserId
 */
export const removeParticipant = async (req, res) => {
  try {
    const { roomId, participantUserId } = req.params;
    const userId = resolveDbUserId(req);
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }

    // Check if room exists and user is creator
    const room = await prisma.chatRoom.findUnique({
      where: { id: parseInt(roomId) }
    });

    if (!room || room.type !== 'group') {
      return res.status(404).json({ success: false, error: 'Group chat not found' });
    }

    if (room.createdBy !== userId) {
      return res.status(403).json({ success: false, error: 'Only the group creator can remove participants' });
    }

    // Cannot remove creator
    if (parseInt(participantUserId) === room.createdBy) {
      return res.status(400).json({ success: false, error: 'Cannot remove group creator' });
    }

    // Remove participant
    await prisma.chatRoomParticipant.deleteMany({
      where: {
        roomId: parseInt(roomId),
        userId: parseInt(participantUserId)
      }
    });

    res.json({
      success: true,
      message: 'Participant removed'
    });
  } catch (error) {
    console.error('[chatController] Error in removeParticipant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update group chat name (creator only)
 * PATCH /api/v1/chat/rooms/:roomId
 */
export const updateGroupRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name } = req.body;
    const userId = resolveDbUserId(req);
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }

    // Check if room exists and user is creator
    const room = await prisma.chatRoom.findUnique({
      where: { id: parseInt(roomId) }
    });

    if (!room || room.type !== 'group') {
      return res.status(404).json({ success: false, error: 'Group chat not found' });
    }

    if (room.createdBy !== userId) {
      return res.status(403).json({ success: false, error: 'Only the group creator can update the group' });
    }

    // Update room name
    const updatedRoom = await prisma.chatRoom.update({
      where: { id: parseInt(roomId) },
      data: { name: name.trim() },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                profileImageUrl: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedRoom
    });
  } catch (error) {
    console.error('[chatController] Error in updateGroupRoom:', error);
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
  getAvailableUsers,
  createGroupRoom,
  addParticipant,
  removeParticipant,
  updateGroupRoom
};
