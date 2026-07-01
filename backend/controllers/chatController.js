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
    let hasAccess = 
      isStaffAdmin || // Admin/HR can access all rooms
      room.type === 'global' || // Everyone can access global
      (room.type === 'class' && room.class.enrollments.length > 0) || // Enrolled in class
      (room.type === 'class' && room.class.instructorId === userId) || // Instructor of class
      (room.type === 'dm' && (room.participantA === userId || room.participantB === userId)); // Participant in DM

    // For group chats, check if user is a participant
    if (!hasAccess && room.type === 'group') {
      const groupParticipant = await prisma.chatRoomParticipant.findFirst({
        where: { roomId: parseInt(roomId), userId }
      });
      hasAccess = !!groupParticipant;
    }

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

    // Self-DM is always allowed (like WhatsApp "Message Yourself" / notes)
    const isSelfDM = userId === recipientId;

    // Check DM permissions (skip for self-DM)
    if (!isSelfDM) {
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
    const isStaff = userRoles.some(role => 
      ['instructor', 'hr', 'admin', 'super_admin'].includes(role.toLowerCase())
    );
    
    if (!isStaff) {
      return res.status(403).json({ success: false, error: 'Only staff can create group chats' });
    }

    const { name, nameAr, participantIds } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }
    
    if (!nameAr || !nameAr.trim()) {
      return res.status(400).json({ success: false, error: 'Arabic group name is required' });
    }
    
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one participant is required' });
    }

    // Validate participant IDs exist
    const validUsers = await prisma.user.findMany({
      where: { id: { in: participantIds }, isActive: true },
      select: { id: true }
    });
    const validIds = validUsers.map(u => u.id);
    const invalidIds = participantIds.filter(id => !validIds.includes(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `${invalidIds.length} participant(s) not found or inactive` 
      });
    }

    // Create group room
    // Creator is added as participant by default but can leave later
    const allParticipantIds = [...new Set([userId, ...participantIds])];
    const room = await prisma.chatRoom.create({
      data: {
        type: 'group',
        name: name.trim(),
        nameAr: nameAr.trim(),
        createdBy: userId,
        participants: {
          create: allParticipantIds.map(id => ({ userId: id }))
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

    // Allow creator to leave (remove themselves) but prevent removing others unless creator
    if (parseInt(participantUserId) !== userId && room.createdBy !== userId) {
      return res.status(403).json({ success: false, error: 'Only the group creator can remove participants' });
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
    const { name, nameAr } = req.body;
    const userId = resolveDbUserId(req);
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }

    if (!nameAr || !nameAr.trim()) {
      return res.status(400).json({ success: false, error: 'Arabic group name is required' });
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
      data: { name: name.trim(), nameAr: nameAr.trim() },
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

/**
 * Get group chat room stats (admin only)
 * GET /api/v1/chat/rooms/:roomId/stats
 */
export const getRoomStats = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = resolveDbUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: parseInt(roomId) },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true, firstName: true, lastName: true, displayName: true, profileImageUrl: true, keycloakId: true,
                email: true, studentNumber: true,
                roleAssignments: { include: { role: { select: { code: true, nameEn: true } } } },
                _count: { select: { enrollments: true, chatRoomParticipations: true } }
              }
            }
          }
        },
        creator: {
          select: { id: true, firstName: true, lastName: true, displayName: true }
        },
        class: {
          select: { id: true, nameEn: true, nameAr: true, code: true }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ success: false, error: 'Chat room not found' });
    }

    // Verify user is a participant (for group/DM) or has access (for class/global)
    if (room.type === 'group') {
      const isParticipant = room.participants?.some(p => p.userId === userId);
      if (!isParticipant) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    } else if (room.type === 'dm') {
      if (room.participantA !== userId && room.participantB !== userId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    // Get message stats
    const messages = await prisma.chatMessage.findMany({
      where: { roomId: parseInt(roomId), isDeleted: false },
      select: { id: true, type: true, content: true, fileName: true, fileType: true, fileUrl: true, createdAt: true, senderId: true },
      orderBy: { createdAt: 'desc' }
    });

    const totalMessages = messages.length;
    const mediaMessages = messages.filter(m => m.type === 'file' && m.fileType && m.fileType.startsWith('image/'));
    const documentMessages = messages.filter(m => m.type === 'file' && (!m.fileType || !m.fileType.startsWith('image/')));
    const voiceMessages = messages.filter(m => m.type === 'voice');
    const linkMessages = messages.filter(m => m.type === 'text' && m.content && /https?:\/\/\S+/i.test(m.content));

    res.json({
      success: true,
      data: {
        roomId: room.id,
        name: room.name,
        nameAr: room.nameAr,
        type: room.type,
        createdAt: room.createdAt,
        createdBy: room.createdBy,
        creator: room.creator,
        participantCount: room.participants?.length || 0,
        participants: (room.participants || []).map(p => ({
          ...p,
          user: p.user ? {
            ...p.user,
            profileImageUrl: p.user.profileImageUrl && !p.user.profileImageUrl.startsWith('http') && !p.user.profileImageUrl.startsWith('/api/')
              ? `/api/v1/user-images/proxy/${p.user.keycloakId}/profile`
              : p.user.profileImageUrl
          } : p.user
        })),
        totalMessages,
        mediaCount: mediaMessages.length,
        mediaItems: mediaMessages.slice(0, 50).map(m => ({
          id: m.id, fileName: m.fileName, fileUrl: m.fileUrl, fileType: m.fileType, createdAt: m.createdAt, senderId: m.senderId
        })),
        documentCount: documentMessages.length,
        documentItems: documentMessages.slice(0, 50).map(m => ({
          id: m.id, fileName: m.fileName, fileUrl: m.fileUrl, fileType: m.fileType, createdAt: m.createdAt, senderId: m.senderId
        })),
        voiceCount: voiceMessages.length,
        linkCount: linkMessages.length,
        linkItems: linkMessages.slice(0, 50).map(m => {
          const urlMatch = m.content.match(/https?:\/\/\S+/i);
          return { id: m.id, url: urlMatch ? urlMatch[0] : '', content: m.content?.substring(0, 100), createdAt: m.createdAt, senderId: m.senderId };
        })
      }
    });
  } catch (error) {
    console.error('[chatController] Error in getRoomStats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Toggle star on a message (any user can star)
 * POST /api/v1/chat/messages/:messageId/star
 */
export const toggleStarMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = resolveDbUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: parseInt(messageId) },
      include: { room: true }
    });

    if (!message || message.isDeleted) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Verify user has access to the room
    const room = message.room;
    let hasAccess = room.type === 'global';
    if (!hasAccess) {
      if (room.type === 'dm') {
        hasAccess = room.participantA === userId || room.participantB === userId;
      } else if (room.type === 'group') {
        const participant = await prisma.chatRoomParticipant.findFirst({
          where: { roomId: room.id, userId }
        });
        hasAccess = !!participant;
      } else if (room.type === 'class') {
        const userRecord = await prisma.user.findUnique({
          where: { id: userId },
          include: { roleAssignments: { include: { role: true } } }
        });
        const userRoles = userRecord?.roleAssignments?.map(ra => ra.role.code) || [];
        const isStaff = userRoles.some(r => ['admin', 'super_admin', 'superadmin', 'hr', 'instructor'].includes(r?.toLowerCase()));
        hasAccess = isStaff || (room.classId && await prisma.enrollment.findFirst({
          where: { classId: room.classId, studentId: userId }
        }));
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const starredBy = Array.isArray(message.starredBy) ? message.starredBy : [];
    const userIdNum = userId;
    const isStarred = starredBy.includes(userIdNum);

    const updated = await prisma.chatMessage.update({
      where: { id: parseInt(messageId) },
      data: {
        starredBy: isStarred
          ? starredBy.filter(id => id !== userIdNum)
          : [...starredBy, userIdNum]
      }
    });

    res.json({
      success: true,
      data: {
        messageId: updated.id,
        starredBy: updated.starredBy,
        isStarred: !isStarred
      }
    });
  } catch (error) {
    console.error('[chatController] Error in toggleStarMessage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Toggle pin on a message (group chats only, one pinned message per room)
 * POST /api/v1/chat/messages/:messageId/pin
 */
export const togglePinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = resolveDbUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: parseInt(messageId) },
      include: { room: true }
    });

    if (!message || message.isDeleted) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Only group chats support pinning
    if (message.room.type !== 'group') {
      return res.status(400).json({ success: false, error: 'Pinning is only available in group chats' });
    }

    // Verify user is a participant
    const participant = await prisma.chatRoomParticipant.findFirst({
      where: { roomId: message.roomId, userId }
    });
    if (!participant) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // If this message is already pinned, unpin it
    if (message.pinnedById !== null) {
      await prisma.chatMessage.update({
        where: { id: parseInt(messageId) },
        data: { pinnedById: null }
      });
      return res.json({
        success: true,
        data: { messageId: parseInt(messageId), isPinned: false }
      });
    }

    // Otherwise, unpin any existing pinned message in this room, then pin this one
    await prisma.chatMessage.updateMany({
      where: { roomId: message.roomId, pinnedById: { not: null } },
      data: { pinnedById: null }
    });

    const updated = await prisma.chatMessage.update({
      where: { id: parseInt(messageId) },
      data: { pinnedById: userId }
    });

    res.json({
      success: true,
      data: {
        messageId: updated.id,
        isPinned: true,
        pinnedById: updated.pinnedById
      }
    });
  } catch (error) {
    console.error('[chatController] Error in togglePinMessage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Assign a new admin (transfer creator role) for a group chat
 * PATCH /api/v1/chat/rooms/:roomId/assign-admin
 */
export const assignGroupAdmin = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { newAdminId } = req.body;
    const userId = resolveDbUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found in database' });
    }
    if (!newAdminId) {
      return res.status(400).json({ success: false, error: 'newAdminId is required' });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: parseInt(roomId) },
      include: { participants: true }
    });

    if (!room || room.type !== 'group') {
      return res.status(404).json({ success: false, error: 'Group chat not found' });
    }
    if (room.createdBy !== userId) {
      return res.status(403).json({ success: false, error: 'Only the current admin can assign a new admin' });
    }
    const targetParticipant = room.participants.find(p => p.userId === parseInt(newAdminId));
    if (!targetParticipant) {
      return res.status(400).json({ success: false, error: 'Target user is not a participant' });
    }

    const updatedRoom = await prisma.chatRoom.update({
      where: { id: parseInt(roomId) },
      data: { createdBy: parseInt(newAdminId) },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, displayName: true, firstName: true, lastName: true, profileImageUrl: true }
            }
          }
        },
        creator: {
          select: { id: true, firstName: true, lastName: true, displayName: true }
        }
      }
    });

    res.json({
      success: true,
      data: updatedRoom,
      message: 'Admin assigned successfully'
    });
  } catch (error) {
    console.error('[chatController] Error in assignGroupAdmin:', error);
    res.status(500).json({ success: false, error: error.message });
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
  updateGroupRoom,
  getRoomStats,
  toggleStarMessage,
  togglePinMessage,
  assignGroupAdmin
};
