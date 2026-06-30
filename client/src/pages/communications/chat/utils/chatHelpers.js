/**
 * Chat Helper Functions
 * Utility functions for chat functionality
 */

import { 
  CHAT_TYPES, 
  MESSAGE_TYPES, 
  REACTION_TYPES,
  VOICE_RECORDING_DEFAULTS,
  VALIDATION_RULES 
} from '../constants/chatConstants';
import { ROLE_STRINGS, resolveUserRole } from '@utils/userUtils';
import { getUserRoles } from '@services/business/userService';
import { getVoiceRecordingLimits } from '@constants';


import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Normalize any user object into a chat-compatible format with docId, uid, and role.
 * Shared by useChatActions and useChatSubscriptions (previously duplicated).
 */
export const normalizeChatUser = (u) => {
  if (!u) return u;
  if (u.docId) return u;
  const roles = getUserRoles(u);
  const roleCode = resolveUserRole({ ...u, roles }) || roles[0];
  return {
    ...u,
    docId: u.keycloakId || u.uid || String(u.id),
    uid: u.keycloakId || u.uid || String(u.id),
    isStudent: roles.includes('student') || roleCode === 'student',
    role: roleCode,
    enrolledClasses: u.enrolledClasses || []
  };
};/**
 * Get chat type from selected class string
 */
export const getChatType = (selectedClass) => {
  if (selectedClass === 'global') return CHAT_TYPES.GLOBAL;
  if (selectedClass?.startsWith('dm:')) return CHAT_TYPES.DM;
  if (selectedClass?.startsWith('group:')) return CHAT_TYPES.GROUP;
  return CHAT_TYPES.CLASS;
};

/**
 * Get chat ID from selected class string
 */
export const getChatId = (selectedClass) => {
  if (selectedClass === 'global') return 'global';
  if (selectedClass?.startsWith('dm:')) return selectedClass.slice(3);
  if (selectedClass?.startsWith('group:')) return selectedClass.slice(6);
  return selectedClass;
};

/**
 * Format recording time display
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get max voice time display for role
 */
export const getMaxVoiceTimeDisplay = (role) => {
  const voiceLimits = getVoiceRecordingLimits(role);
  const maxTime = voiceLimits.maxRecordingTime;
  const minutes = Math.floor(maxTime / 60);
  return `${minutes} minutes`;
};

/**
 * Validate message content
 */
export const validateMessage = (content) => {
  if (!content || typeof content !== 'string') {
    return { isValid: false, error: 'Message content is required' };
  }
  
  if (content.length > VALIDATION_RULES.MAX_MESSAGE_LENGTH) {
    return { 
      isValid: false, 
      error: `Message too long. Maximum ${VALIDATION_RULES.MAX_MESSAGE_LENGTH} characters` 
    };
  }
  
  return { isValid: true };
};

/**
 * Validate poll data
 */
export const validatePoll = (question, options) => {
  if (!question?.trim()) {
    return { isValid: false, error: 'Poll question is required' };
  }
  
  if (question.length > VALIDATION_RULES.MAX_POLL_QUESTION_LENGTH) {
    return { 
      isValid: false, 
      error: `Question too long. Maximum ${VALIDATION_RULES.MAX_POLL_QUESTION_LENGTH} characters` 
    };
  }
  
  const validOptions = options.filter(opt => opt?.trim());
  if (validOptions.length < VALIDATION_RULES.MIN_POLL_OPTIONS) {
    return { 
      isValid: false, 
      error: `At least ${VALIDATION_RULES.MIN_POLL_OPTIONS} options required` 
    };
  }
  
  if (validOptions.length > VALIDATION_RULES.MAX_POLL_OPTIONS) {
    return { 
      isValid: false, 
      error: `Maximum ${VALIDATION_RULES.MAX_POLL_OPTIONS} options allowed` 
    };
  }
  
  const invalidOption = validOptions.find(opt => 
    opt.length > VALIDATION_RULES.MAX_POLL_OPTION_LENGTH
  );
  
  if (invalidOption) {
    return { 
      isValid: false, 
      error: `Option too long. Maximum ${VALIDATION_RULES.MAX_POLL_OPTION_LENGTH} characters` 
    };
  }
  
  return { isValid: true };
};

/**
 * Get user's role-based voice recording limits
 */
export const getUserVoiceLimits = (userRole) => {
  switch (userRole) {
    case ROLE_STRINGS.ADMIN:
      return {
        maxRecordingTime: VOICE_RECORDING_DEFAULTS.ADMIN_MAX_TIME,
        format: VOICE_RECORDING_DEFAULTS.FORMAT
      };
    case ROLE_STRINGS.INSTRUCTOR:
      return {
        maxRecordingTime: VOICE_RECORDING_DEFAULTS.INSTRUCTOR_MAX_TIME,
        format: VOICE_RECORDING_DEFAULTS.FORMAT
      };
    default:
      return {
        maxRecordingTime: VOICE_RECORDING_DEFAULTS.STUDENT_MAX_TIME,
        format: VOICE_RECORDING_DEFAULTS.FORMAT
      };
  }
};

/**
 * Check if file type is allowed for upload
 */
export const isFileTypeAllowed = (file) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
    'application/pdf', 
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip', 'application/x-rar-compressed'
  ];
  
  return allowedTypes.includes(file.type);
};

/**
 * Get file type category
 */
export const getFileTypeCategory = (fileType) => {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('video/')) return 'video';
  if (fileType.startsWith('audio/')) return 'audio';
  if (fileType.includes('pdf') || fileType.includes('document') || 
      fileType.includes('spreadsheet') || fileType.includes('presentation')) {
    return 'document';
  }
  return 'other';
};

/**
 * Sanitize filename for upload
 */
export const sanitizeFilename = (filename) => {
  if (!filename) return 'file';
  return filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if message is from current user
 */
export const isOwnMessage = (message, currentUserId) => {
  return message.senderId === currentUserId;
};

/**
 * Get other participant in DM
 */
export const getOtherParticipant = (room, currentUserId) => {
  return room.participants?.find(p => p !== currentUserId);
};

/**
 * Check if user can delete message
 */
export const canDeleteMessage = (message, currentUserId, isAdmin) => {
  return isAdmin || message.senderId === currentUserId || message.senderId === currentUserId?.toString();
};

/**
 * Check if user can edit message
 */
export const canEditMessage = (message, currentUserId, isAdmin) => {
  return (isAdmin || message.senderId === currentUserId || message.senderId === currentUserId?.toString()) && 
         message.messageType === MESSAGE_TYPES.TEXT;
};

/**
 * Generate message share URL
 */
export const generateShareUrl = (messageId, destination) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/chat?dest=${destination}&msgId=${messageId}`;
};

/**
 * Group messages by date
 */
export const groupMessagesByDate = (messages) => {
  const grouped = [];
  let lastDate = null;
  
  messages.forEach((message) => {
    const msgDate = message.createdAt?.toDate() || new Date();
    const dateStr = msgDate.toLocaleDateString();
    
    if (dateStr !== lastDate) {
      grouped.push({ type: 'date', date: msgDate, dateStr });
      lastDate = dateStr;
    }
    
    grouped.push({ type: 'message', ...message });
  });
  
  return grouped;
};

/**
 * Filter messages by search query
 */
export const filterMessages = (messages, query, allUsers = []) => {
  if (!query?.trim()) return messages;
  
  const searchTerm = query.toLowerCase();
  
  return messages.filter(message => {
    const contentMatch = (message.content || '').toLowerCase().includes(searchTerm);
    const fileNameMatch = (message.fileName || '').toLowerCase().includes(searchTerm);
    const sender = allUsers.find(u => u.docId === message.senderId);
    const senderMatch = sender && (
      (sender.displayName || '').toLowerCase().includes(searchTerm) ||
      (sender.email || '').toLowerCase().includes(searchTerm)
    );
    
    return contentMatch || fileNameMatch || senderMatch;
  });
};

/**
 * Calculate poll results
 */
export const calculatePollResults = (pollVotes) => {
  const totalVotes = Object.values(pollVotes || {}).flat().length;
  const results = {};
  
  Object.entries(pollVotes || {}).forEach(([optionIndex, votes]) => {
    const voteCount = votes.length;
    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
    results[optionIndex] = {
      votes: voteCount,
      percentage,
      voters: votes
    };
  });
  
  return results;
};

/**
 * Get reaction display data
 */
export const getReactionDisplay = (reactions, theme, getThemedIcon, getColoredIcon) => {
  const counts = {};
  
  Object.values(reactions || {}).forEach(reaction => {
    if (Object.values(REACTION_TYPES).includes(reaction)) {
      counts[reaction] = (counts[reaction] || 0) + 1;
    }
  });
  
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([reaction, count]) => ({
      reaction,
      count,
      color: REACTION_COLORS[reaction] || '#6b7280',
      icon: getReactionIcon(reaction, theme, getThemedIcon, getColoredIcon)
    }));
};

/**
 * Get reaction icon
 */
export const getReactionIcon = (reaction, theme, getThemedIcon, getColoredIcon) => {
  const iconMap = {
    [REACTION_TYPES.THUMBS_UP]: 'thumbs_up',
    [REACTION_TYPES.HEART]: 'heart',
    [REACTION_TYPES.SMILE]: 'smile',
    [REACTION_TYPES.SURPRISE]: 'help_circle',
    [REACTION_TYPES.FROWN]: 'x_circle',
    [REACTION_TYPES.PRAY]: 'star'
  };
  
  const iconName = iconMap[reaction] || 'smile';
  return getThemedIcon('ui', iconName, 18, theme);
};

/**
 * Check if user has voted in poll
 */
export const hasUserVoted = (pollVotes, userId, optionIndex) => {
  return pollVotes?.[optionIndex]?.includes(userId) || false;
};

/**
 * Get user's vote in poll
 */
export const getUserVote = (pollVotes, userId) => {
  for (const [optionIndex, votes] of Object.entries(pollVotes || {})) {
    if (votes.includes(userId)) {
      return parseInt(optionIndex);
    }
  }
  return -1;
};
