/**
 * Chat Database Service - PostgreSQL
 * 
 * Direct Prisma queries for chat operations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get or create a chat room
 * @param {Object} params - Room parameters
 * @param {string} params.type - 'global', 'class', or 'dm'
 * @param {number} params.classId - For class chats
 * @param {number} params.participantA - For DMs (lower userId)
 * @param {number} params.participantB - For DMs (higher userId)
 * @returns {Promise<Object>} Chat room
 */
export const getOrCreateRoom = async ({ type, classId, participantA, participantB }) => {
  try {
    // For DMs, ensure participantA < participantB for consistent ordering
    if (type === 'dm' && participantA && participantB) {
      if (participantA > participantB) {
        [participantA, participantB] = [participantB, participantA];
      }
    }

    const where = type === 'global' 
      ? { type: 'global' }
      : type === 'class'
      ? { type: 'class', classId }
      : { type: 'dm', participantA, participantB };

    let room = await prisma.chatRoom.findFirst({ where });

    if (!room) {
      room = await prisma.chatRoom.create({
        data: {
          type,
          classId: type === 'class' ? classId : null,
          participantA: type === 'dm' ? participantA : null,
          participantB: type === 'dm' ? participantB : null,
        },
        include: {
          class: true,
          userA: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          userB: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });
    } else {
      // Fetch with relations if found
      room = await prisma.chatRoom.findUnique({
        where: { id: room.id },
        include: {
          class: true,
          userA: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          userB: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });
    }

    return room;
  } catch (error) {
    console.error('[chat-postgres] Error in getOrCreateRoom:', error);
    throw error;
  }
};

/**
 * Get user's accessible chat rooms
 * @param {number} userId - User ID
 * @param {Array<string>} roles - User roles
 * @param {Array<number>} enrolledClassIds - Class IDs user is enrolled in
 * @returns {Promise<Array>} Chat rooms
 */
export const getUserRooms = async (userId, roles = [], enrolledClassIds = []) => {
  try {
    const isStudent = roles.some(r => r?.toLowerCase().includes('student'));
    const isStaff = roles.some(r => {
      const lc = r?.toLowerCase();
      return lc === 'instructor' || lc === 'hr' || lc === 'admin' || lc === 'super_admin' || lc === 'superadmin';
    });

    const rooms = [];

    // Global chat (all staff can access, students read-only)
    if (isStaff || isStudent) {
      let globalRoom = await prisma.chatRoom.findFirst({
        where: { type: 'global' },
        include: {
          _count: {
            select: { messages: { where: { isDeleted: false } } }
          }
        }
      });
      // Auto-create global room if it doesn't exist
      if (!globalRoom) {
        globalRoom = await prisma.chatRoom.create({
          data: { type: 'global' },
          include: {
            _count: {
              select: { messages: { where: { isDeleted: false } } }
            }
          }
        });
      }
      rooms.push(globalRoom);
    }

    // Class chats (enrolled classes for students, all classes for staff)
    if (isStaff) {
      // Staff can see all class chat rooms
      // First, auto-create chat rooms for any classes that don't have one yet
      const allClasses = await prisma.class.findMany({
        select: { id: true }
      });
      const allClassIds = allClasses.map(c => c.id);
      const existingClassRooms = await prisma.chatRoom.findMany({
        where: { type: 'class' },
        select: { classId: true }
      });
      const existingClassIds = new Set(existingClassRooms.map(r => r.classId));
      const missingClassIds = allClassIds.filter(id => !existingClassIds.has(id));
      if (missingClassIds.length > 0) {
        await prisma.chatRoom.createMany({
          data: missingClassIds.map(classId => ({ type: 'class', classId }))
        });
      }

      // Now fetch all class rooms
      const classRooms = await prisma.chatRoom.findMany({
        where: { type: 'class' },
        include: {
          class: {
            select: { id: true, nameEn: true, nameAr: true, code: true }
          },
          _count: {
            select: { messages: { where: { isDeleted: false } } }
          }
        }
      });
      rooms.push(...classRooms);
    } else if (enrolledClassIds.length > 0) {
      // Students see only their enrolled classes
      // Auto-create chat rooms for enrolled classes that don't have one
      const existingClassRooms = await prisma.chatRoom.findMany({
        where: { type: 'class', classId: { in: enrolledClassIds } },
        select: { classId: true }
      });
      const existingClassIds = new Set(existingClassRooms.map(r => r.classId));
      const missingClassIds = enrolledClassIds.filter(id => !existingClassIds.has(id));
      if (missingClassIds.length > 0) {
        await prisma.chatRoom.createMany({
          data: missingClassIds.map(classId => ({ type: 'class', classId }))
        });
      }

      const classRooms = await prisma.chatRoom.findMany({
        where: {
          type: 'class',
          classId: { in: enrolledClassIds }
        },
        include: {
          class: {
            select: { id: true, nameEn: true, nameAr: true, code: true }
          },
          _count: {
            select: { messages: { where: { isDeleted: false } } }
          }
        }
      });
      rooms.push(...classRooms);
    }

    // DM rooms (where user is participant)
    const dmRooms = await prisma.chatRoom.findMany({
      where: {
        type: 'dm',
        OR: [
          { participantA: userId },
          { participantB: userId }
        ]
      },
      include: {
        userA: {
          select: { id: true, firstName: true, lastName: true, email: true, profileImageUrl: true }
        },
        userB: {
          select: { id: true, firstName: true, lastName: true, email: true, profileImageUrl: true }
        },
        _count: {
          select: { messages: { where: { isDeleted: false } } }
        }
      }
    });
    rooms.push(...dmRooms);

    return rooms;
  } catch (error) {
    console.error('[chat-postgres] Error in getUserRooms:', error);
    throw error;
  }
};

/**
 * Get messages for a room
 * @param {number} roomId - Room ID
 * @param {Object} options - Pagination options
 * @returns {Promise<Array>} Messages
 */
export const getRoomMessages = async (roomId, { limit = 50, before = null, after = null } = {}) => {
  try {
    const where = {
      roomId,
      isDeleted: false
    };

    if (before) {
      where.id = { lt: before };
    } else if (after) {
      where.id = { gt: after };
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      include: {
        sender: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true, 
            profileImageUrl: true 
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            sender: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: { createdAt: before ? 'desc' : 'asc' },
      take: limit
    });

    return before ? messages.reverse() : messages;
  } catch (error) {
    console.error('[chat-postgres] Error in getRoomMessages:', error);
    throw error;
  }
};

/**
 * Create a new message
 * @param {Object} data - Message data
 * @returns {Promise<Object>} Created message
 */
export const createMessage = async (data) => {
  try {
    const message = await prisma.chatMessage.create({
      data: {
        roomId: data.roomId,
        senderId: data.senderId,
        type: data.type || 'text',
        content: data.content,
        fileUrl: data.fileUrl,
        filePath: data.filePath,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        pollOptions: data.pollOptions,
        replyToId: data.replyToId
      },
      include: {
        sender: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true, 
            profileImageUrl: true 
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            sender: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });

    return message;
  } catch (error) {
    console.error('[chat-postgres] Error in createMessage:', error);
    throw error;
  }
};

/**
 * Update a message
 * @param {number} messageId - Message ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated message
 */
export const updateMessage = async (messageId, data) => {
  try {
    const message = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content: data.content,
        isEdited: true,
        editedAt: new Date()
      },
      include: {
        sender: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true, 
            profileImageUrl: true 
          }
        }
      }
    });

    return message;
  } catch (error) {
    console.error('[chat-postgres] Error in updateMessage:', error);
    throw error;
  }
};

/**
 * Soft delete a message
 * @param {number} messageId - Message ID
 * @returns {Promise<Object>} Deleted message
 */
export const deleteMessage = async (messageId) => {
  try {
    const message = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: null,
        fileUrl: null,
        filePath: null
      }
    });

    return message;
  } catch (error) {
    console.error('[chat-postgres] Error in deleteMessage:', error);
    throw error;
  }
};

/**
 * Add or remove a reaction
 * @param {number} messageId - Message ID
 * @param {number} userId - User ID
 * @param {string} reactionType - Reaction type (ThumbsUp, Heart, etc.)
 * @param {boolean} remove - Whether to remove the reaction
 * @returns {Promise<Object>} Updated message
 */
export const toggleReaction = async (messageId, userId, reactionType, remove = false) => {
  try {
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new Error('Message not found');
    }

    const reactions = message.reactions || {};
    
    if (remove) {
      delete reactions[userId];
    } else {
      reactions[userId] = reactionType;
    }

    const updated = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { reactions },
      include: {
        sender: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true, 
            profileImageUrl: true 
          }
        }
      }
    });

    return updated;
  } catch (error) {
    console.error('[chat-postgres] Error in toggleReaction:', error);
    throw error;
  }
};

/**
 * Vote on a poll
 * @param {number} messageId - Message ID
 * @param {number} userId - User ID
 * @param {number} optionIndex - Poll option index
 * @returns {Promise<Object>} Updated message
 */
export const votePoll = async (messageId, userId, optionIndex) => {
  try {
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });

    if (!message || message.type !== 'poll') {
      throw new Error('Poll message not found');
    }

    const pollOptions = message.pollOptions || [];
    
    // Remove user's previous votes
    pollOptions.forEach(option => {
      if (option.votes) {
        option.votes = option.votes.filter(id => id !== userId);
      }
    });

    // Add new vote
    if (pollOptions[optionIndex]) {
      if (!pollOptions[optionIndex].votes) {
        pollOptions[optionIndex].votes = [];
      }
      pollOptions[optionIndex].votes.push(userId);
    }

    const updated = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { pollOptions },
      include: {
        sender: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true, 
            profileImageUrl: true 
          }
        }
      }
    });

    return updated;
  } catch (error) {
    console.error('[chat-postgres] Error in votePoll:', error);
    throw error;
  }
};

/**
 * Get users available for DM based on role permissions
 * @param {number} userId - Current user ID
 * @param {Array<string>} userRoles - Current user's roles
 * @returns {Promise<Array>} Available users
 */
export const getAvailableDMUsers = async (userId, userRoles = []) => {
  try {
    const roles = userRoles.map(r => r.toLowerCase());
    const isStudent = roles.includes('student');
    const isStaff = roles.some(r => ['instructor', 'hr', 'admin', 'super_admin', 'superadmin'].includes(r));

    let where = {
      id: { not: userId },
      isActive: true
    };

    if (isStudent) {
      // Students can only DM their instructors
      // Get classes where user is enrolled
      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        select: { classId: true }
      });
      const classIds = enrollments.map(e => e.classId);

      // Get instructors of those classes
      const classes = await prisma.class.findMany({
        where: { id: { in: classIds } },
        select: { instructorId: true }
      });
      const instructorIds = [...new Set(classes.map(c => c.instructorId).filter(Boolean))];

      where.id = { in: instructorIds };
    } else if (isStaff) {
      // Staff can DM other staff and students
      // No additional filtering needed
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profileImageUrl: true,
        roleAssignments: {
          include: {
            role: {
              select: { code: true, nameEn: true }
            }
          }
        }
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    return users;
  } catch (error) {
    console.error('[chat-postgres] Error in getAvailableDMUsers:', error);
    throw error;
  }
};

export default {
  getOrCreateRoom,
  getUserRooms,
  getRoomMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  toggleReaction,
  votePoll,
  getAvailableDMUsers
};
