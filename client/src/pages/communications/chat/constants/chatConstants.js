import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Chat Constants
 * Centralized constants for chat functionality
 */

export const CHAT_TYPES = {
  GLOBAL: 'global',
  CLASS: 'class',
  DM: 'dm'
};

export const MESSAGE_TYPES = {
  TEXT: 'text',
  VOICE: 'voice',
  FILE: 'file',
  POLL: 'poll'
};

export const REACTION_TYPES = {
  THUMBS_UP: 'ThumbsUp',
  HEART: 'Heart',
  SMILE: 'Smile',
  SURPRISE: 'Surprise',
  FROWN: 'Frown',
  PRAY: 'Pray'
};

export const REACTION_COLORS = {
  [REACTION_TYPES.THUMBS_UP]: '#3b82f6', // Blue
  [REACTION_TYPES.HEART]: '#ef4444',     // Red
  [REACTION_TYPES.SMILE]: '#eab308',     // Yellow
  [REACTION_TYPES.SURPRISE]: '#f97316',  // Orange
  [REACTION_TYPES.FROWN]: '#6b7280',     // Gray
  [REACTION_TYPES.PRAY]: '#8b5cf6'      // Purple
};

export const FILE_UPLOAD_LIMITS = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,      // 10MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024,      // 50MB
  MAX_AUDIO_SIZE: 25 * 1024 * 1024,      // 25MB
  MAX_DOCUMENT_SIZE: 20 * 1024 * 1024,   // 20MB
  MAX_TOTAL_SIZE: 100 * 1024 * 1024      // 100MB
};

export const VOICE_RECORDING_DEFAULTS = {
  STUDENT_MAX_TIME: 60,      // 1 minute
  INSTRUCTOR_MAX_TIME: 300,  // 5 minutes
  ADMIN_MAX_TIME: 600,       // 10 minutes
  FORMAT: 'audio/webm',
  SAMPLE_RATE: 44100
};

export const CHAT_UI_STATES = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
  RECORDING: 'recording',
  UPLOADING: 'uploading'
};

export const SIDEBAR_CONFIG = {
  MIN_WIDTH: 280,
  MAX_WIDTH: 500,
  DEFAULT_WIDTH: 320,
  COLLAPSED_WIDTH: 0
};

export const SCROLL_CONFIG = {
  AUTO_SCROLL_THRESHOLD: 100,
  JUMP_TO_BOTTOM_THRESHOLD: 140,
  DEBOUNCE_DELAY: 300
};

export const EMOJI_LIST = [
  '😀', '😂', '❤️', '👍', '😎',
  '🎉', '🔥', '✨', '🙏', '💯',
  '👏', '🤝', '💪', '🎯', '🌟',
  '💡', '🚀', '💎', '🏆', '📚'
];

export const ANIMATION_DURATION = {
  FADE_IN: 200,
  SLIDE_IN: 300,
  PULSE: 1000,
  WAVE: 1200
};

export const LOCAL_STORAGE_KEYS = {
  SIDEBAR_WIDTH: 'chatSidebarWidth',
  SIDEBAR_COLLAPSED: 'chatSidebarCollapsed',
  NAVBAR_COLLAPSED: 'navbarCollapsed',
  USER_MESSAGE_COLOR: 'userMessageColor'
};

export const CHAT_ROUTES = {
  BASE: '/chat',
  WITH_DEST: '/chat?dest=:dest',
  WITH_MESSAGE: '/chat?dest=:dest&msgId=:msgId'
};

export const CLEAR_MESSAGE_MODES = {
  ALL: 'all',
  MINE: 'mine',
  THEIRS: 'theirs'
};

export const SEARCH_FILTERS = {
  ALL: 'all',
  MESSAGES: 'messages',
  USERS: 'users',
  FILES: 'files'
};

export const VALIDATION_RULES = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_POLL_QUESTION_LENGTH: 200,
  MAX_POLL_OPTION_LENGTH: 100,
  MIN_POLL_OPTIONS: 2,
  MAX_POLL_OPTIONS: 10
};
