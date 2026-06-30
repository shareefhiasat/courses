import React, { useState, useEffect, useRef, useMemo, memo, useLayoutEffect, useCallback } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Navigate, useLocation } from 'react-router-dom';
import { ROLE_STRINGS, ROLE_PRIORITY_CHAT, resolveUserRole, getChatUserDisplayName } from '@utils/userUtils';
import { getThemedIcon, getColoredIcon, getIconWithColor, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { getAcademicTermLabel } from '@constants/academicTerms';
import RoleBadge from './components/RoleBadge';
import { getClasses } from '@services/business/classService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getUsers, getUserRoles } from '@services/business/userService';
import { getUserProfile, updateUser } from '@services/business/userService';
import { addNotification } from '@services/business/notificationService';
import { chatService } from '@services/business/chatService';
import { getChatServerTimestamp } from '@services/business/chatRealtimeService';
import { useToast, Input } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { info, error, warn, debug } from '@services/utils/logger.js';
import './ChatPage.css';
import './ChatPageEmojiStyles.css';
import { formatDateTime, formatDate } from '@utils/date';
import { DEFAULT_ACCENT, normalizeHexColor } from '@utils/color';
import { canParticipate } from '@utils/userStatus';
import { filterBadWords, containsBadWords } from '@utils/badWordFilter';
import { 
  getRoleConfig,
  isFileTypeAllowedForRole,
  getRoleLimit,
  validateFileUploadForRole,
  canUserUploadFile,
  getVoiceRecordingLimits
} from '@constants';

// Chat-specific constants and utilities
import { 
  CHAT_TYPES, 
  MESSAGE_TYPES, 
  REACTION_TYPES,
  FILE_UPLOAD_LIMITS,
  VOICE_RECORDING_DEFAULTS,
  CHAT_UI_STATES,
  SIDEBAR_CONFIG,
  SCROLL_CONFIG,
  EMOJI_LIST,
  ANIMATION_DURATION,
  LOCAL_STORAGE_KEYS,
  CHAT_ROUTES,
  CLEAR_MESSAGE_MODES,
  SEARCH_FILTERS,
  VALIDATION_RULES
} from './constants/chatConstants';

import {
  formatTime,
  getMaxVoiceTimeDisplay
} from './utils/chatHelpers';

// Minimal state hook for gradual migration
import { useChatStateMinimal } from './hooks/useChatStateMinimal';

// Component wrappers for gradual extraction
import MessageBubbleWrapper from './components/MessageBubbleWrapper';
import { useChatActions } from './hooks/useChatActions';
import GroupChatModal from './components/GroupChatModal';
import ParticipantManagementModal from './components/ParticipantManagementModal';
import GroupInfoPanel from './components/GroupInfoPanel';
import ChatWallpaperPicker, { getWallpaperStyle, getStoredWallpaper } from './components/ChatWallpaperPicker';

const withAuthToken = (url) => {
  if (!url) return url;
  const token = localStorage.getItem('keycloak_token');
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}token=${encodeURIComponent(token)}`;
};


const ChatPage = memo(() => {
  const { user, isAdmin, isSuperAdmin, isHR, isInstructor, loading: authLoading } = useAuth();
  const { t, lang } = useLang();
  const isRTL = lang === 'ar';
  const { theme } = useTheme();

  // ── Guided Tour ──────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = `chatTourSeen_${lang}`;
  const buildTourSteps = useCallback(() => [
    { target: '[data-tour="chat-sidebar"]', content: t('tour.chat_sidebar'), disableBeacon: true, placement: 'right' },
    { target: '[data-tour="chat-room-list"]', content: t('tour.chat_room_list'), disableBeacon: true, placement: 'right' },
    { target: '[data-tour="chat-search"]', content: t('tour.chat_search'), disableBeacon: true, placement: 'right' },
    { target: '[data-tour="chat-members"]', content: t('tour.chat_members'), disableBeacon: true, placement: 'left' },
    { target: '[data-tour="chat-input"]', content: t('tour.chat_input'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="chat-file-attach"]', content: t('tour.chat_file_attach'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="chat-voice"]', content: t('tour.chat_voice'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="chat-emoji-btn"]', content: t('tour.chat_emoji'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="chat-poll-btn"]', content: t('tour.chat_poll'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="chat-reaction-btn"]', content: t('tour.chat_reactions'), disableBeacon: true, placement: 'left' },
  ].filter(s => !!document.querySelector(s.target)), [t]);
  const startTour = useCallback(() => {
    const steps = buildTourSteps();
    if (steps.length === 0) return;
    setTourSteps(steps);
    setRunTour(true);
  }, [buildTourSteps]);
  useEffect(() => {
    window.addEventListener('app:joyride', startTour);
    window.addEventListener('app:help', startTour);
    return () => { window.removeEventListener('app:joyride', startTour); window.removeEventListener('app:help', startTour); };
  }, [startTour]);
  useEffect(() => { try { if (!localStorage.getItem(tourSeenKey)) startTour(); } catch {} }, [tourSeenKey, startTour]);
  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') { setRunTour(false); try { localStorage.setItem(tourSeenKey, 'true'); } catch {} }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);
  // ──────────────────────────────────────────────────────────────────────────
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  const location = useLocation();
  
  info('ChatPage mount');
  
  // Initialize minimal state hook for gradual migration
  const minimalState = useChatStateMinimal(user);
  
    
  // State
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(CHAT_TYPES.GLOBAL);
  const selectedClassRef = useRef(selectedClass);
  const userHasInteractedRef = useRef(false);
  const [classMembers, setClassMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [directRooms, setDirectRooms] = useState([]);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [studentsOnly, setStudentsOnly] = useState(false);
  const [roleFilter, setRoleFilter] = useState(null);
  const [dmSearch, setDmSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [globalChatSearch, setGlobalChatSearch] = useState('');
  const [chatReads, setChatReads] = useState({}); // { 'class:<id>': Timestamp, 'dm:<id>': Timestamp, 'global': Timestamp }
  const [unreadCounts, setUnreadCounts] = useState({}); // { 'class:<id>': number, 'dm:<id>': number, 'global': number }
  const [showDeleteDMConfirm, setShowDeleteDMConfirm] = useState(false);
  const [showNewDMPicker, setShowNewDMPicker] = useState(false);
  const [dmUserSearch, setDmUserSearch] = useState('');
  const [availableDMUsers, setAvailableDMUsers] = useState([]);
  const [dmUsersLoading, setDmUsersLoading] = useState(false);
  const [dmRoleFilter, setDmRoleFilter] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showGroupInfoPanel, setShowGroupInfoPanel] = useState(false);
  const [classInfoRoomId, setClassInfoRoomId] = useState(null);

  const isStaffRole = isAdmin || isSuperAdmin || isHR || isInstructor;
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = parseInt(localStorage.getItem(LOCAL_STORAGE_KEYS.SIDEBAR_WIDTH) || '0', 10);
    return Number.isFinite(saved) && saved >= SIDEBAR_CONFIG.MIN_WIDTH && saved <= SIDEBAR_CONFIG.MAX_WIDTH 
      ? saved 
      : SIDEBAR_CONFIG.DEFAULT_WIDTH;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
    return saved;
  });
  const [selectedClassName, setSelectedClassName] = useState('');
  const resizingRef = useRef(false);
  const [sidebarDividerHeight, setSidebarDividerHeight] = useState(() => {
    const saved = parseInt(localStorage.getItem(LOCAL_STORAGE_KEYS.SIDEBAR_DIVIDER_HEIGHT) || '0', 10);
    return Number.isFinite(saved) && saved > 0 ? saved : null; // null = auto/flex
  });
  const dividerDraggingRef = useRef(false);
  const [menuOpenId, setMenuOpenId] = useState(null); // current message actions menu id
  const [editingMsg, setEditingMsg] = useState(null); // { id, content }
  const [memberReads, setMemberReads] = useState({}); // { uid: Date }
  const [receiptsFor, setReceiptsFor] = useState(null); // { id, list:[] }
  const longPressTimerRef = useRef(null);
  const [msgQuery, setMsgQuery] = useState('');
  const [dmContextMenu, setDmContextMenu] = useState(null); // { roomId, x, y }
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionMenu, setReactionMenu] = useState(null); // { msgId, x, y }
  const reactionMenuRef = useRef(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  
  // Profile name for senderName in messages/polls
  const [profileName, setProfileName] = useState('');
  
  // Refs that need to be available for hooks
  const messageInputRef = useRef(null);
  
  // State that needs to be available for hooks
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  
  // Memoized safe variables
  const safeClasses = useMemo(() => (Array.isArray(classes) ? classes : []), [classes]);
  const safeDirectRooms = useMemo(() => (Array.isArray(directRooms) ? directRooms : []), [directRooms]);
  const safeClassMembers = useMemo(() => (Array.isArray(classMembers) ? classMembers : []), [classMembers]);
  const safeAllUsers = useMemo(() => (Array.isArray(allUsers) ? allUsers : []), [allUsers]);
  const safeMessages = useMemo(() => (Array.isArray(messages) ? messages : []), [messages]);
  
  // Functions that the hook expects
  const resetInputState = useCallback(() => {
    setNewMessage('');
    setAudioBlob(null);
    setAttachedFile(null);
    setImagePreview(null);
    setEditingMsg(null);
  }, []);

  const resetPollState = useCallback(() => {
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPollModal(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const newValue = !prev;
      try { 
        localStorage.setItem(LOCAL_STORAGE_KEYS.SIDEBAR_COLLAPSED, String(newValue)); 
      } catch {}
      return newValue;
    });
  }, []);
  
  // Use chat actions hook for functionality that will be moved to components
    const chatState = {
    selectedClass,
    newMessage,
    audioBlob,
    attachedFile,
    isUploading,
    setIsUploading,
    setMessages,
    resetInputState,
    setEditingMsg,
    setReactionMenu,
    setDmContextMenu,
    setShowDeleteDMConfirm,
    setSelectedClass,
    setChatReads,
    setHighlightedMsgId,
    setShowMembers,
    setNewMessage,
    setAudioBlob,
    setAttachedFile,
    setImagePreview,
    setShowPollModal,
    setPollQuestion,
    setPollOptions,
    resetPollState,
    setUserHasInteracted,
    safeClasses,
    safeAllUsers,
    safeClassMembers,
    safeDirectRooms,
    setDirectRooms,
    isAdmin,
    isSuperAdmin,
    isInstructor,
    isHR,
    messageInputRef,
    setShowEmojiPicker,
    pollQuestion,
    pollOptions,
    profileName,
    setAllUsers,
    setClassMembers,
    isRecording,
    setIsRecording,
    recordingTime,
    setRecordingTime
  };

  const {
    loadClassMembers,
    handleSendMessage: sendMessage,
    startRecording,
    stopRecording,
    cancelRecording,
    handleFileSelect,
    openDMWith,
    handleAddReaction,
    handleRemoveReaction,
    handleDeleteMessage,
    handleSaveEdit,
    toggleStar,
    clearDMMessages,
    deleteDMConversation,
    createPollMessage
  } = useChatActions(user, chatState, toast, t);
  
  // Wrapper function for form submission
  const handleSendMessage = useCallback((e) => {
    e?.preventDefault();
    sendMessage(e); // Pass the event to the hook's sendMessage
  }, [sendMessage]);
  
  // Handle star message toggle
  const handleToggleStar = useCallback(async (msg) => {
    try {
      const result = await chatService.toggleStarMessage(msg.id);
      if (result.success) {
        setMessages(prev => (prev || []).map(m =>
          m.id === msg.id
            ? { ...m, starredBy: result.data.starredBy }
            : m
        ));
        toast?.showSuccess(result.data.isStarred ? (t('message_starred') || 'Message starred') : (t('message_unstarred') || 'Message unstarred'));
      }
    } catch (err) {
      error('Failed to toggle star:', err);
      toast?.showError(t('failed_to_star') || 'Failed to star message');
    }
  }, [t, toast, setMessages]);

  // Handle pin message toggle (group only)
  const handleTogglePin = useCallback(async (msg) => {
    try {
      const result = await chatService.togglePinMessage(msg.id);
      if (result.success) {
        setMessages(prev => (prev || []).map(m => {
          if (m.id === msg.id) {
            return { ...m, pinnedById: result.data.isPinned ? (user?.dbId || user?.uid) : null };
          }
          // Unpin any other pinned message in the same room
          if (m.pinnedById !== null && m.pinnedById !== undefined) {
            return { ...m, pinnedById: null };
          }
          return m;
        }));
        toast?.showSuccess(result.data.isPinned ? (t('message_pinned') || 'Message pinned') : (t('message_unpinned') || 'Message unpinned'));
      }
    } catch (err) {
      error('Failed to toggle pin:', err);
      toast?.showError(t('failed_to_pin') || 'Failed to pin message');
    }
  }, [t, toast, setMessages, user]);

  // Handle class change
  const handleClassChange = useCallback((classId) => {
    userHasInteractedRef.current = true;
    setUserHasInteracted(true);
    selectedClassRef.current = classId;
    setSelectedClass(classId);
  }, [setSelectedClass, setUserHasInteracted]);

  // Open New DM picker - load available users
  const openNewDMPicker = useCallback(async () => {
    setShowNewDMPicker(true);
    setDmUserSearch('');
    setDmRoleFilter(null);
    setDmUsersLoading(true);
    try {
      const result = await chatService.getAvailableDMUsers();
      setAvailableDMUsers(result.success ? (result.data || []) : []);
    } catch (err) {
      error('Failed to load available DM users:', err);
      setAvailableDMUsers([]);
    } finally {
      setDmUsersLoading(false);
    }
  }, []);

  // Start DM with a user from the picker
  const startDMFromPicker = useCallback(async (otherUser) => {
    const otherUserId = otherUser?.id || otherUser?.docId || otherUser?.uid;
    if (!otherUserId || otherUserId === user?.uid) return;
    try {
      const result = await chatService.createDM(otherUserId);
      if (result.success && result.data) {
        setSelectedClass(`dm:${result.data.id}`);
        setUserHasInteracted(true);
      }
    } catch (err) {
      error('Failed to start DM:', err);
      toast?.showError?.('Failed to start conversation');
    }
    setShowNewDMPicker(false);
  }, [user, setSelectedClass, setUserHasInteracted, toast]);

  // Helper to merge starBy from localStorage into rooms
  const mergeStarData = useCallback((rooms) => {
    try {
      const starred = JSON.parse(localStorage.getItem(`chat_starred_${user?.uid}`) || '[]');
      const starredSet = new Set(starred);
      return rooms.map(r => ({
        ...r,
        starBy: starredSet.has(String(r.id)) ? [user.uid] : []
      }));
    } catch {
      return rooms;
    }
  }, [user?.uid]);

  // Helper function to get user's theme color
  const getUserThemeColor = () => {
    // Try to get from localStorage first (from ProfileSettings)
    const savedColor = localStorage.getItem('userMessageColor');
    if (savedColor) {
      return normalizeHexColor(savedColor, DEFAULT_ACCENT);
    }
    // Fallback to default maroon
    return DEFAULT_ACCENT;
  };
  
  
  // Refs
  const lastMsgObserverRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const suppressAutoScrollRef = useRef(false);
  const messagesUnsubRef = useRef(null);
  const [archivedRooms, setArchivedRooms] = useState({}); // Start with empty object
  const [archivedClasses, setArchivedClasses] = useState({}); // Start with empty object to show classes
  const [showArchived, setShowArchived] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(() => {
    try { return localStorage.getItem('navbarCollapsed') === 'true'; } catch { return false; }
  });
  // Scroll management
  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [myMessageColor, setMyMessageColor] = useState(null);
  const hasHighlightedRef = useRef(null);
  const [chatWallpaper, setChatWallpaper] = useState(() => getStoredWallpaper());
  const [wallpaperNonce, setWallpaperNonce] = useState(0);

  useEffect(() => {
    const handler = () => {
      setChatWallpaper(getStoredWallpaper());
      setWallpaperNonce(n => n + 1);
    };
    window.addEventListener('chatWallpaperChange', handler);
    return () => window.removeEventListener('chatWallpaperChange', handler);
  }, []);

  const loadMessages = useCallback(() => {
    let chatType, chatId;
    
    if (selectedClass === 'global') {
      chatType = 'global';
      chatId = 'global';
    } else if (selectedClass?.startsWith('dm:')) {
      chatType = 'dm';
      chatId = selectedClass.slice(3);
    } else if (selectedClass?.startsWith('group:')) {
      chatType = 'group';
      chatId = selectedClass.slice(6);
    } else {
      // Defensive: ensure users/{uid}.enrolledClasses contains selectedClass to satisfy rules
      (async () => {
        try {
          if (user?.uid && selectedClass) {
            await chatService.syncUserEnrollment(user.uid, selectedClass);
          }
        } catch {}
      })();
      chatType = 'class';
      chatId = selectedClass;
    }
    
    const unsubscribe = chatService.subscribeToMessages(chatType, chatId, (snapshot) => {
      // Check if this is a real-time delta (delete/update) vs full load
      const isDelta = snapshot.length === 1 && (snapshot[0]._deleted || snapshot[0]._updated);
      
      if (isDelta) {
        const delta = snapshot[0];
        if (delta._deleted) {
          setMessages(prev => (prev || []).filter(m => m.id !== delta.id));
          return;
        }
        if (delta._updated) {
          setMessages(prev => (prev || []).map(m => m.id === delta.id ? { ...m, ...delta } : m));
          return;
        }
      }
      
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      
      info('Messages loaded', { 
        chatType, 
        chatId, 
        messageCount: msgs.length,
        messageIds: msgs.map(m => ({ id: m.id, content: m.content?.substring(0, 20) }))
      });
      
      // Check for duplicates
      const duplicateIds = msgs.filter((msg, index) => msgs.findIndex(m => m.id === msg.id) !== index);
      if (duplicateIds.length > 0) {
        warn('Duplicate messages found', { 
          duplicateIds: duplicateIds.map(d => ({ id: d.id, content: d.content?.substring(0, 20) }))
        });
      }
      
      setMessages(msgs);

      // memberReads now updates via user snapshots effect

      // Mark as read for this destination
      (async () => {
        try {
          const key = selectedClass === 'global' ? 'global' : selectedClass;
          const newReadTime = await chatService.updateUserChatReads(user.uid, key);
          setChatReads(prev => ({ ...(prev || {}), [key]: newReadTime }));
        } catch {}
      })();
    }, (error) => {
      error('Error loading messages:', error);
    });
    
    return unsubscribe;
  }, [selectedClass, user]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const me = await getUserProfile(user);
        if (me?.displayName) setProfileName(me.displayName);
        setArchivedRooms(me?.archivedRooms || {});
        setArchivedClasses(me?.archivedClasses || {});
        if (me?.messageColor) setMyMessageColor(me.messageColor);
      } catch {}
    };
    if (user?.uid) loadProfile();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    let unsub = null;
    (async () => {
      try {
        unsub = chatService.subscribeToUserMessageColor(user.uid, (messageColor) => {
          if (messageColor) setMyMessageColor(messageColor);
        });
      } catch {}
    })();
    return () => { try { unsub && unsub(); } catch {} };
  }, [user?.uid]);

  // Close reaction menu on outside click
  useEffect(() => {
    if (!reactionMenu) return;
    const onDoc = (e) => {
      if (!reactionMenuRef.current) { setReactionMenu(null); return; }
      if (!reactionMenuRef.current.contains(e.target)) setReactionMenu(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [reactionMenu]);

  // Close three-dots message menu on outside click (no auto-hide on hover)
  useEffect(() => {
    if (!menuOpenId) return;
    const onDoc = () => setMenuOpenId(null);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpenId]);

  // Auto-scroll to bottom on new messages or thread change
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const nearBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) < 100;
    if (suppressAutoScrollRef.current) { suppressAutoScrollRef.current = false; return; }
    if (nearBottom || selectedClass) {
      // defer till DOM paints
      setTimeout(() => {
        try { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); } catch {}
      }, 0);
    }
  }, [messages.length, selectedClass]);

  // Show a floating "jump to bottom" when scrolled up
  const [showJump, setShowJump] = useState(false);
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowJump(dist > 140);
    };
    el.addEventListener('scroll', onScroll);
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close actions menu on click-away or Escape
  useEffect(() => {
    if (!menuOpenId) return;
    const onDoc = (e) => { setMenuOpenId(null); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpenId(null); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpenId]);

  // Close DM context menu on click-away or Escape
  useEffect(() => {
    if (!dmContextMenu) return;
    const onDoc = (e) => { setDmContextMenu(null); };
    const onKey = (e) => { if (e.key === 'Escape') setDmContextMenu(null); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [dmContextMenu]);

  // Close emoji picker and reaction menu on click-away
  useEffect(() => {
    if (!showEmojiPicker && !reactionMenu) return;
    const onDoc = (e) => {
      // Only close if clicking outside the emoji picker or reaction menu
      const emojiPicker = document.querySelector('[data-emoji-picker="true"]');
      const reactionMenuEl = document.querySelector('[data-reaction-menu="true"]');
      
      // Don't close if clicking on emoji button
      if (e.target.closest('[data-emoji-button="true"]')) return;
      
      if (showEmojiPicker && emojiPicker && !emojiPicker.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (reactionMenu && reactionMenuEl && !reactionMenuEl.contains(e.target)) {
        setReactionMenu(null);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showEmojiPicker) setShowEmojiPicker(false);
        if (reactionMenu) setReactionMenu(null);
      }
    };
    // Use mousedown instead of click to prevent immediate closing
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [showEmojiPicker, reactionMenu]);

  // Listen for navbar toggle events and update CSS variable
  useEffect(() => {
    const handleNavbarToggle = (e) => {
      setIsNavbarCollapsed(e.detail.collapsed);
      // Update CSS variable for dynamic height calculation
      document.documentElement.style.setProperty('--navbar-height', e.detail.collapsed ? '0px' : '60px');
    };
    
    // Set initial value
    document.documentElement.style.setProperty('--navbar-height', isNavbarCollapsed ? '0px' : '60px');
    
    window.addEventListener('navbar:toggle', handleNavbarToggle);
    return () => {
      window.removeEventListener('navbar:toggle', handleNavbarToggle);
      // Cleanup CSS variable on unmount
      document.documentElement.style.removeProperty('--navbar-height');
    };
  }, [isNavbarCollapsed]);

  // Remove outer page scrollbar while on Chat
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Compute member read markers for current destination from users.chatReads
  useEffect(() => {
    // Subscribe in real-time to recipients' user docs so ticks update live
    let unsubs = [];
    try {
      const key = selectedClass === 'global' ? 'global' : selectedClass;
      let ids = [];
      if (selectedClass === 'global') ids = safeAllUsers.map(u => u.docId).filter(Boolean);
      else if (selectedClass?.startsWith('dm:')) ids = (safeDirectRooms.find(r => `dm:${r.id}` === selectedClass)?.participants || []);
      else ids = safeClassMembers.map(m => m.docId).filter(Boolean);
      const recips = ids.filter(id => id && id !== user?.uid);
      const reads = {};
      const unsub = chatService.subscribeToUserReadReceipts(recips, key, (uid, readTime) => {
        if (readTime) {
          reads[uid] = readTime;
        } else {
          delete reads[uid];
        }
        setMemberReads({ ...reads });
      });
      unsubs.push(unsub);
    } catch {}
    return () => { try { unsubs.forEach(u => u()); } catch {} };
  }, [selectedClass, safeAllUsers, safeClassMembers, safeDirectRooms, user?.uid]);

  // Read query param dest to jump directly from notifications
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dest = params.get('dest');
    if (dest) {
      setSelectedClass(dest);
      loadClassMembers(dest);
      // If classes not loaded yet, try to set a temp name
      const cls = safeClasses.find(c => c.docId === dest);
      if (cls) setSelectedClassName(cls.name);
      else {
        (async () => {
          try {
            const className = await chatService.getClassName(dest);
            if (className) setSelectedClassName(className);
          } catch {}
        })();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Load user's chat read markers
  useEffect(() => {
    const loadReads = async () => {
      try {
        const reads = await chatService.getUserChatReads(user.uid);
        setChatReads(reads);
      } catch {}
    };
    if (user) loadReads();
  }, [user]);

  // Calculate unread counts for all chats
  useEffect(() => {
    if (!user) return;
    const counts = {};
    
    // Global
    const globalKey = 'global';
    const globalReadAt = chatReads[globalKey];
    const globalUnsub = chatService.subscribeToUnreadCounts(chatReads, (chatKey, count) => {
      setUnreadCounts(prev => ({ ...prev, [chatKey]: count }));
    });

    // Classes
    const classUnsubs = (safeClasses).map(cls => {
      const classKey = cls.docId;
      return chatService.subscribeToClassUnreadCounts(classKey, chatReads, (chatKey, count) => {
        setUnreadCounts(prev => ({ ...prev, [chatKey]: count }));
      });
    });

    // DMs
    const dmUnsubs = (safeDirectRooms).map(room => {
      return chatService.subscribeToDMUnreadCounts(room, chatReads, (roomId, count) => {
        setUnreadCounts(prev => ({ ...prev, [`dm:${roomId}`]: count }));
      });
    });

    return () => {
      globalUnsub();
      classUnsubs.forEach(u => u());
      dmUnsubs.forEach(u => u());
    };
  }, [user, chatReads, safeClasses, safeDirectRooms]);

  // Mark as read when tab gains focus
  useEffect(() => {
    const handleFocus = async () => {
      if (!user || !selectedClass) return;
      try {
        const key = selectedClass === 'global' ? 'global' : selectedClass;
        const newReadTime = await chatService.updateUserChatReads(user.uid, key);
        setChatReads(prev => ({ ...(prev || {}), [key]: newReadTime }));
      } catch {}
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, selectedClass, chatReads]);

  // Load class members when selected class changes
  const loadingClassMembersRef = useRef(new Set());
  const loadClassMembersRef = useRef(loadClassMembers);
  loadClassMembersRef.current = loadClassMembers;
  useEffect(() => {
    if (selectedClass && user && !selectedClass.startsWith('dm:')) {
      // Don't cache 'global' - it gets overwritten when auto-selecting a class
      if (selectedClass !== 'global' && loadingClassMembersRef.current.has(selectedClass)) {
        info('Skipping loadClassMembers - already loaded', { selectedClass });
        return;
      }
      loadingClassMembersRef.current.add(selectedClass);
      loadClassMembersRef.current(selectedClass);
    }
  }, [selectedClass, user?.uid]);

  // Load classes and setup with real-time subscriptions
  useEffect(() => {
    if (authLoading || !user) return;
    
    const unsubs = [];
    
    // Real-time subscription for classes
    const setupClassesSubscription = async () => {
      try {
        let ids = new Set();

        if (isSuperAdmin || isHR || isAdmin || isInstructor) {
          const classesResult = await getClasses();
          if (classesResult.success) {
            (classesResult.data || []).forEach((cls) => ids.add(cls.docId || cls.id));
          }
        } else {
          // Student: enrolled classes (API already scoped to self)
          const enrollmentsResult = await getEnrollments();
          const allEnr = enrollmentsResult.success ? (enrollmentsResult.data || []) : [];
          const byUid = allEnr.filter((e) => e.userId === user.uid);
          let mine = byUid;
          if (mine.length === 0 && user.email) {
            mine = allEnr.filter((e) => (e.userEmail || e.email) === user.email);
          }
          mine.forEach((e) => ids.add(e.classId));
          if (ids.size === 0) {
            try {
              const me = await getUserProfile(user);
              const enrolled = Array.isArray(me?.enrolledClasses) ? me.enrolledClasses : [];
              enrolled.forEach((id) => ids.add(id));
            } catch {}
          }
        }
        
        const unsub = chatService.subscribeToClasses((all) => {
          info('Classes received from subscription', { 
            count: all.length,
            classIds: all.map(c => ({ id: c.docId, name: c.name }))
          });
          setClasses(all);
          
          // Auto-select first class for students if needed (only if no user interaction)
          const urlDest = new URLSearchParams(location.search).get('dest');
          if (!userHasInteractedRef.current && (!selectedClassRef.current || selectedClassRef.current === 'global') && !urlDest) {
            if (all.length > 0) {
              info('Auto-selecting first class', { 
                reason: 'student_auto_select',
                currentSelectedClass: selectedClassRef.current,
                firstClassId: all[0].docId,
                firstClassName: all[0].name,
                userHasInteracted: userHasInteractedRef.current
              });
              selectedClassRef.current = all[0].docId;
              setSelectedClass(all[0].docId);
              setSelectedClassName(all[0].name || '');
              loadClassMembers(all[0].docId);
            }
          }
        }, isSuperAdmin || isHR, user.uid, ids);
        unsubs.push(unsub);
        
        // Sync membership
        try {
          await chatService.syncUserEnrollments(user.uid, ids);
        } catch {}
        setLoading(false);
      } catch (error) {
        error('Error setting up classes subscription:', error);
        setLoading(false);
      }
    };
    
    setupClassesSubscription();
    scrollToBottom();
    
    // subscribe to DM rooms
    const unsub = chatService.subscribeToDirectRooms((snap) => {
      const rooms = [];
      snap.forEach(d => rooms.push({ id: d.id, ...d.data() }));
      // Merge starBy from localStorage
      try {
        const starred = JSON.parse(localStorage.getItem(`chat_starred_${user?.uid}`) || '[]');
        const starredSet = new Set(starred);
        rooms.forEach(r => {
          r.starBy = starredSet.has(String(r.id)) ? [user.uid] : [];
        });
      } catch {}
      setDirectRooms(rooms);
    });
    unsubs.push(unsub);
    
    return () => unsubs.forEach(u => u());
  }, [user, isAdmin, isSuperAdmin, isHR, isInstructor, authLoading]);

  // Load all users once for DM labels
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const u = await getUsers();
        setAllUsers(u.success ? (u.data || []) : []);
      } catch {}
    };
    fetchUsers();
  }, []);
  
  // Initialize chat WebSocket connection on mount
  useEffect(() => {
    const token = localStorage.getItem('keycloak_token');
    if (token) {
      chatService.initializeChatService(token);
    }
    // Don't disconnect on cleanup - React strict mode double-invokes effects
    // The socket has its own reconnection logic
    return () => {
      // Only disconnect if page is truly unmounting (not strict mode re-mount)
    };
  }, []);
  
  // Load/Reload messages when destination changes, ensuring previous listener is cleaned up
  useEffect(() => {
    if (!selectedClass) return;
    try {
      // cleanup any existing listener before creating a new one
      if (messagesUnsubRef.current) {
        try { messagesUnsubRef.current(); } catch {}
        messagesUnsubRef.current = null;
      }
      const unsub = loadMessages();
      messagesUnsubRef.current = unsub;
    } catch (e) {
      error('Failed to (re)subscribe messages:', e);
    }
    // cleanup on dependency change/unmount
    return () => {
      if (messagesUnsubRef.current) {
        try { messagesUnsubRef.current(); } catch {}
        messagesUnsubRef.current = null;
      }
    };
  }, [selectedClass, loadMessages]);
  
  // Auto-scroll only when new messages are appended
  const prevCountRef = useRef(0);
  useEffect(() => {
    const prev = prevCountRef.current;
    const curr = messages.length;
    if (suppressAutoScrollRef.current) {
      suppressAutoScrollRef.current = false;
    } else if (curr > prev) {
      scrollToBottom();
    }
    prevCountRef.current = curr;
    // If last message is visible, mark as read
    try {
      if (lastMsgObserverRef.current) {
        lastMsgObserverRef.current.disconnect();
      }
      const el = messagesEndRef.current;
      if (!el) return;
      lastMsgObserverRef.current = new IntersectionObserver(async (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && user && selectedClass) {
          try {
            const key = selectedClass === 'global' ? 'global' : selectedClass;
            const newReadTime = await chatService.updateUserChatReads(user.uid, key);
            setChatReads(prev => ({ ...(prev || {}), [key]: newReadTime }));
          } catch {}
        }
      }, { threshold: 0.5 });
      lastMsgObserverRef.current.observe(el);
    } catch {}
  }, [messages, selectedClass, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle URL parameters for message highlighting (share links, notifications)
  const urlDestInitializedRef = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const msgId = params.get('msgId');
    const dest = params.get('dest');

    if (!msgId || !dest) return;

    // Only force selection from URL once on initial load
    if (!urlDestInitializedRef.current) {
      urlDestInitializedRef.current = true;
      if (dest !== selectedClass) {
        setSelectedClass(dest);
      }
    }

    // Once we've already highlighted this msgId, don't re-process
    if (hasHighlightedRef.current === msgId) return;

    // Try repeatedly until the message DOM exists
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(`msg-${msgId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMsgId(msgId);
        setTimeout(() => setHighlightedMsgId(null), 3000);
        hasHighlightedRef.current = msgId;
        return;
      }
      attempts += 1;
      if (attempts < 60) requestAnimationFrame(tryScroll);
    };
    tryScroll();
  }, [location.search, selectedClass, messages]);

  // Sidebar drag-resize
  const onDragStart = (e) => {
    if (isSidebarCollapsed) return; // Prevent resizing when collapsed
    resizingRef.current = true;
    document.body.style.userSelect = 'none';
  };
  const onDragMove = (e) => {
    if (!resizingRef.current) return;
    const x = e.clientX;
    const min = SIDEBAR_CONFIG.MIN_WIDTH, max = SIDEBAR_CONFIG.MAX_WIDTH;
    const w = Math.min(max, Math.max(min, x));
    setSidebarWidth(w);
    try { localStorage.setItem(LOCAL_STORAGE_KEYS.SIDEBAR_WIDTH, String(w)); } catch {}
  };
  const onDragEnd = () => {
    resizingRef.current = false;
    document.body.style.userSelect = '';
    try { localStorage.setItem(LOCAL_STORAGE_KEYS.SIDEBAR_WIDTH, String(sidebarWidth)); } catch {}
  };
  useEffect(() => {
    const move = (e)=>onDragMove(e);
    const up = ()=>onDragEnd();
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [onDragEnd]);

  // Sidebar divider drag (vertical, between classes and DMs)
  const onDividerDragStart = (e) => {
    e.preventDefault();
    dividerDraggingRef.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';
  };
  const onDividerDragMove = (e) => {
    if (!dividerDraggingRef.current) return;
    const sidebarEl = document.querySelector('[data-tour="chat-sidebar"]');
    if (!sidebarEl) return;
    const rect = sidebarEl.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const min = 80;
    const max = rect.height - 120;
    const h = Math.min(max, Math.max(min, y));
    setSidebarDividerHeight(h);
  };
  const onDividerDragEnd = () => {
    if (!dividerDraggingRef.current) return;
    dividerDraggingRef.current = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    try { localStorage.setItem(LOCAL_STORAGE_KEYS.SIDEBAR_DIVIDER_HEIGHT, String(sidebarDividerHeight)); } catch {}
  };
  useEffect(() => {
    const move = (e) => onDividerDragMove(e);
    const up = () => onDividerDragEnd();
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [sidebarDividerHeight]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const [classesResult, enrollmentsResult] = await Promise.all([
        getClasses(),
        getEnrollments()
      ]);

      if (!classesResult.success) {
        error('Failed to load classes:', classesResult.error);
        const errStr = typeof classesResult.error === 'string' ? classesResult.error : (classesResult.error?.message || t('unknown'));
        toast?.showError(t('failed_to_load_classes') + errStr);
        return;
      }

      const all = classesResult.data || [];
      if (isAdmin || isSuperAdmin) {
        setClasses(all);
      } else if (user?.uid) {
        const allEnr = enrollmentsResult.success ? (enrollmentsResult.data || []) : [];
        const byUid = allEnr.filter(e => e.userId === user.uid);
        let mine = byUid;
        // Fallback: some enrollments may store userEmail instead
        if (mine.length === 0 && user.email) {
          const byEmail = allEnr.filter(e => (e.userEmail || e.email) === user.email);
          mine = byEmail;
        }
        // Fallback 2: use users/{uid}.enrolledClasses
        let ids = new Set(mine.map(e => e.classId));
        if (ids.size === 0) {
          try {
            const me = await getUserProfile(user);
            const enrolled = Array.isArray(me?.enrolledClasses) ? me.enrolledClasses : [];
            ids = new Set(enrolled);
          } catch {}
        }
        const mineClasses = all.filter(c => ids.has(c.docId));
        setClasses(mineClasses);
        // Sync membership flags onto users/{uid} for rules
        try {
          await chatService.syncUserEnrollments(user.uid, ids);
        } catch {}
        // If no dest specified and nothing selected yet, auto-select first class for students
        try {
          const params = new URLSearchParams(location.search);
          const dest = params.get('dest');
          if (!dest && !userHasInteractedRef.current && (!selectedClassRef.current || selectedClassRef.current === 'global') && mineClasses.length > 0 && !isStaffRole) {
            info('Auto-selecting first class (location check)', { 
              reason: 'location_dest_check',
              currentSelectedClass: selectedClassRef.current,
              firstClassId: mineClasses[0].docId,
              firstClassName: mineClasses[0].name,
              hasDest: !!dest,
              userHasInteracted: userHasInteractedRef.current
            });
            selectedClassRef.current = mineClasses[0].docId;
            setSelectedClass(mineClasses[0].docId);
            setSelectedClassName(mineClasses[0].name || '');
            await loadClassMembers(mineClasses[0].docId);
          }
        } catch {}
      } else {
        // Not signed in yet
        setClasses([]);
      }
      // Keep selection unless set above for students
      if (!selectedClass) {
        setSelectedClass('global');
      }
    } catch (error) {
      error('Error loading classes:', error);
      const msg = (error && (error.message || error.code)) ? `Failed to load classes: ${error.code || ''} ${error.message || ''}`.trim() : 'Failed to load classes';
      toast?.showError(msg);
    } finally {
      setLoading(false);
    }
  };

  



  // Use GlobalLoading for initial data load only (not for chat transitions)
  const hasLoadedInitialMessages = useRef(false);
  
  useLayoutEffect(() => {
    info('Global loading effect triggered', { 
      authLoading, 
      hasUser: !!user,
      messagesLength: messages?.length || 0,
      userId: user?.uid,
      isInitialLoad: !messages || messages.length === 0,
      hasLoadedInitial: hasLoadedInitialMessages.current
    });
    
    if (authLoading) return;
    if (!user) return;

    // Only show loading for initial load, not for chat transitions
    if (hasLoadedInitialMessages.current) {
      info('Skipping global loading - already loaded initial messages');
      return;
    }

    // Set flag immediately to prevent multiple triggers
    hasLoadedInitialMessages.current = true;

    if (messages && messages.length > 0) {
      info('Messages already loaded, marking as initial load complete', { messagesLength: messages.length });
      return;
    }

    let stopped = false;
    info('Starting global loading for initial load');
    const stopGlobalLoading = startLoading();
    const safeStop = () => {
      if (stopped) return;
      stopped = true;
      info('Stopping global loading');
      stopGlobalLoading();
    };

    // Wait a bit for messages to load, then stop loading
    const timeout = setTimeout(() => {
      if (!stopped) {
        info('Global loading timeout reached, stopping loading', { messagesLength: messages?.length || 0 });
        safeStop();
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
      safeStop();
    };
  }, [authLoading, user?.uid]); // Remove messages dependency to prevent loops

  return (
    <>
    <Joyride continuous run={runTour} steps={tourSteps} callback={handleTourCallback} scrollOffset={100} scrollToFirstStep showSkipButton showProgress tooltipComponent={TourTooltipComponent}
      locale={{ back: t('tour_back'), close: t('tour_close'), last: t('tour_finish'), next: t('tour_next'), skip: t('tour_skip') }}
      styles={{ options: { primaryColor: 'var(--color-primary,#800020)', textColor: theme === 'dark' ? '#e5e7eb' : '#111', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', zIndex: 10000 } }}
    />
    <div className="chat-page" data-theme={theme}>
      {/* Sidebar */}
      <div data-tour="chat-sidebar" className="chat-sidebar" style={{
        width: isSidebarCollapsed ? 0 : sidebarWidth,
        background: 'var(--panel)',
        borderRight: isSidebarCollapsed ? 'none' : '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'width 0.3s ease, border-right 0.3s ease',
        minWidth: isSidebarCollapsed ? 0 : 280,
        maxWidth: 500
      }}>
        {/* Header (hide title word to save space) */}
        {/* Header strip removed per user request */}

      {/* Read receipts modal - Message Info */}
      {receiptsFor && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2100 }} onClick={()=>setReceiptsFor(null)}>
          <div style={{ background:'var(--panel)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:12, minWidth:360, maxWidth:520 }} onClick={(e)=>e.stopPropagation()}>
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
              <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:700 }}>{t('message_info')}</h3>
              <div style={{ fontSize:'0.9rem', color:'var(--muted)', marginTop:4 }}>
                {(() => { const seen = receiptsFor.list.filter(r=>!!r.readAt).length; return `${t('seen_by')} ${seen} ${t('of')} ${receiptsFor.total}`; })()}
              </div>
            </div>
            <div style={{ maxHeight:'50vh', overflowY:'auto', padding:'0.75rem 0' }}>
              {(receiptsFor.list || []).map(r => {
                const hasRead = !!r.readAt;
                const recipientUser = (allUsers || []).find(u => u.docId === r.uid);
                const recipientRole = recipientUser ? resolveUserRole(recipientUser) : null;
                const recipientRoleColor = recipientRole ? getUserRoleColor(recipientRole) : '#6b7280';
                return (
                  <div key={r.uid} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 1.25rem', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
                      <span style={{ fontSize:'1.1rem', fontWeight:700, color: hasRead ? '#3aa0ff' : 'var(--muted)', flexShrink:0 }}>
                        {hasRead ? '✓✓' : '✓'}
                      </span>
                      {recipientRole && (
                        <RoleBadge user={recipientUser} size={10} fontSize='0.65rem' showLabel={true} style={{ borderRadius: 8, padding: '1px 5px' }} />
                      )}
                      <span style={{ fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</span>
                    </div>
                    <div style={{ fontSize:'0.85rem', color:'var(--muted)', textAlign:'right', flexShrink:0, marginLeft:8 }}>
                      {r.readAt ? (
                        <>
                          <div>{r.readAt.toLocaleDateString?.('en-GB') || ''}</div>
                          <div>{r.readAt.toLocaleTimeString?.('en-GB', {hour:'2-digit',minute:'2-digit'}) || ''}</div>
                        </>
                      ) : (
                        <div style={{ fontStyle:'italic' }}>{t('not_seen_yet')}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding:'0.75rem 1.25rem', textAlign:'right', borderTop:'1px solid var(--border)' }}>
              <button onClick={()=>setReceiptsFor(null)} style={{ padding:'0.6rem 1.2rem', background:'var(--brand)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}>{t('close')||'Close'}</button>
            </div>
          </div>
        </div>
      )}

        {/* Class List + DM List with resizable divider */}
        <div data-tour="chat-room-list" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Section: Global Chat + Classes */}
        <div style={{
          flex: sidebarDividerHeight ? '0 0 auto' : '1 1 0',
          height: sidebarDividerHeight || undefined,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 60
        }}>
          {/* Global Chat */}
          {(
            <div
              onClick={() => handleClassChange('global')}
              style={{
                padding: '0.4rem 0.6rem',
                cursor: 'pointer',
                background: selectedClass === 'global' ? 'rgba(0,0,0,0.06)' : 'var(--panel)',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getThemedIcon('ui', 'globe', 16, theme)}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', flex:1 }}>{t('global_chat')}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: '#666' }}>{t('all_users')}</div>
                    {(() => { const c = unreadCounts['global']||0; if (c>0) { return (<span style={{background:'var(--brand)',color:'white',borderRadius:'50%',minWidth:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:'bold',padding:'0 5px'}}>{c>99?'99+':c}</span>);} return null; })()}
                  </div>
                  {/* <div style={{ display:'flex', gap:8, marginTop:6 }}>
                    <Input
                      type="text"
                      placeholder={t('chat_search_messages')}
                      value={globalChatSearch || ''}
                      onChange={(e) => setGlobalChatSearch(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', fontSize: '0.9rem' }}
                    />
                  </div> */}
                </div>
              </div>
            </div>
          )}

          {/* Class Chats */}
          {(Array.isArray(classes) ? classes : [])
            .filter(cls => showArchived || !archivedClasses[cls.docId])
            .map(cls => (
            <div
              key={cls.docId}
              onClick={() => handleClassChange(cls.docId)}
              style={{
                padding: '0.6rem 0.9rem',
                cursor: 'pointer',
                background: selectedClass === cls.docId ? 'var(--background)' : 'var(--panel)',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {getThemedIcon('ui', 'book_open', 16, theme)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                    <div style={{ fontWeight: '600', flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{cls.name}</div>
                    {(() => {
                      const count = unreadCounts[cls.docId] || 0;
                      if (count > 0) {
                        return (
                          <span style={{
                            background: 'var(--brand)', color: 'white', borderRadius: '50%', minWidth: 20, height: 20,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--font-size-xs)', fontWeight: 'bold', padding: '0 6px'
                          }}>{count > 99 ? '99+' : count}</span>
                        );
                      }
                      return null;
                    })()}
                    <button
                      onClick={async (e)=>{
                        e.stopPropagation();
                        try {
                          const next = { ...archivedClasses };
                          if (next[cls.docId]) delete next[cls.docId]; else next[cls.docId] = true;
                          setArchivedClasses(next);
                          await updateUser(user.uid, { archivedClasses: next });
                        } catch {}
                      }}
                      title={archivedClasses[cls.docId] ? t('unarchive') : t('archive')}
                      style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--muted)' }}
                    >{archivedClasses[cls.docId] ? getThemedIcon('ui', 'upload', 16, theme) : getThemedIcon('ui', 'download', 16, theme)}</button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{`${getAcademicTermLabel(cls.term, lang)} - ${cls.code}`}</span>
                      {(() => {
                        const count = cls.enrollmentCount ?? cls._count?.enrollments ?? 0;
                        if (count > 0) {
                          return (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: '0.7rem',
                              background: 'var(--background)',
                              color: 'var(--muted)',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}>
                              {getIconWithColor('user_role', 'student', 10, 'var(--muted)')}
                              {count}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    {cls.lastMessage && (
                      <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginTop:2 }}>
                        <span style={{ color: 'var(--muted)' }}>{cls.lastMessage}</span>
                        <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{cls.lastMessageAt ? formatDateTime(cls.lastMessageAt) : ''}</span>
                      </div>
                    )}
                  </div>
                  {(() => {
                    const instructor = cls.instructorId
                      ? allUsers.find(u => u.docId === cls.instructorId)
                      : allUsers.find(u => u.email === cls.ownerEmail);
                    if (!instructor) return null;
                    return (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {getThemedIcon('ui', 'graduation_cap', 14, theme)}
                        <strong>{instructor.displayName || instructor.email}</strong>
                        <RoleBadge user={instructor} />
                        {instructor.studentNumber && (
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)', marginLeft: '0.25rem', fontWeight: 'normal' }}>
                            ({instructor.studentNumber})
                          </span>
                        )}
                        {instructor.docId !== user.uid && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openDMWith(instructor); }}
                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 'var(--font-size-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}
                          >
                            {getThemedIcon('ui', 'message_square', 16, theme)}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}

        </div>
        {/* Resizable Divider */}
        <div
          onMouseDown={onDividerDragStart}
          onDoubleClick={() => { setSidebarDividerHeight(null); try { localStorage.removeItem(LOCAL_STORAGE_KEYS.SIDEBAR_DIVIDER_HEIGHT); } catch {} }}
          title={t('drag_to_resize_reset')}
          style={{
            height: 6,
            flexShrink: 0,
            cursor: 'row-resize',
            background: 'var(--border)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--brand)'; }}
          onMouseOut={(e) => { if (!dividerDraggingRef.current) e.currentTarget.style.background = 'var(--border)'; }}
        >
          <div style={{ width: 32, height: 2, borderRadius: 1, background: 'var(--muted)', opacity: 0.5 }} />
        </div>

        {/* Bottom Section: Direct Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 60
        }}>
          {/* Create Group Button (Staff Only) */}
          {isStaffRole && (
            <div style={{ padding: '0.5rem 0.9rem', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setShowGroupModal(true)}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: 'var(--brand)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {getThemedIcon('ui', 'user_plus', 16, theme)}
                <span>{t('chat_create_group')}</span>
              </button>
            </div>
          )}
          
          {/* Group Chats */}
          {(() => {
            const groupRooms = (Array.isArray(safeDirectRooms) ? safeDirectRooms : []).filter(r => r.type === 'group');
            if (groupRooms.length === 0) return null;
            const filteredGroupRooms = groupSearch
              ? groupRooms.filter(r => (r.name || '').toLowerCase().includes(groupSearch.toLowerCase()))
              : groupRooms;
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.9rem', borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {getThemedIcon('ui', 'users', 14, theme)}
                    {t('chat_group_chats')}
                  </span>
                </div>
                {groupRooms.length > 3 && (
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder={t('chat_search_groups') || t('chat_search_users')}
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    style={{ margin: '0.5rem 1rem', padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.85rem', width: 'calc(100% - 2rem)' }}
                  />
                )}
                {filteredGroupRooms.map(room => {
                  const isCreator = room.createdBy === user?.dbId;
                  const participantCount = room.participants?.length || 0;
                  return (
                    <div
                      key={room.id}
                      onClick={() => handleClassChange(`group:${room.id}`)}
                      style={{
                        padding: '0.4rem 0.6rem', cursor: 'pointer',
                        background: selectedClass === `group:${room.id}` ? 'rgba(0,0,0,0.06)' : 'var(--panel)',
                        borderBottom: '1px solid var(--border)', transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #7e57c2, #5e35b1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>
                          {(room.name || 'G')[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                              {room.name || t('group_chat')}
                            </div>
                            {isCreator && getIconWithColor('ui', 'crown', 12, '#ffc107')}
                            {(() => { const c = unreadCounts[`group:${room.id}`] || 0; if (c > 0) { return (<span style={{ background: 'var(--brand)', color: 'white', borderRadius: '50%', minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', padding: '0 5px' }}>{c > 99 ? '99+' : c}</span>); } return null; })()}
                          </div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <span>{participantCount} {t('chat_members')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
          
          {/* Direct Messages */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.9rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '0.85rem' }}>{t('chat_direct_messages')}</span>
            {isStaffRole && (
              <button
                onClick={openNewDMPicker}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--brand)', fontSize: '1.1rem', padding: '2px 6px', borderRadius: 4 }}
                title={t('start_new_conversation')}
              >
                +
              </button>
            )}
          </div>
          {(() => {
            const dmRooms = (Array.isArray(safeDirectRooms) ? safeDirectRooms : []).filter(r => r.type !== 'group');
            return dmRooms.length > 3;
          })() && (
            <input
              type="text"
              autoComplete="off"
              placeholder={t('chat_search_users')}
              value={dmSearch}
              onChange={(e) => setDmSearch(e.target.value)}
              style={{ margin: '0.5rem 1rem', padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.85rem', width: 'calc(100% - 2rem)' }}
            />
          )}
          {directRooms.length === 0 && (
            <div style={{ padding: '0.4rem 0.6rem', color: 'var(--muted)' }}>{t('chat_no_messages')}</div>
          )}
          {(() => {
            if (archivedRooms === null) return []; // Return empty array instead of null
            let filtered = Array.isArray(safeDirectRooms) ? safeDirectRooms : [];
            // Only show DM rooms in the DM section (groups have their own section)
            filtered = filtered.filter(r => r.type !== 'group');
            // hide archived unless showArchived is on
            filtered = filtered.filter(r => showArchived || !archivedRooms[r.id]);
            // favorites only filter
            if (showFavoritesOnly) {
              filtered = filtered.filter(r => (r.starBy || []).includes(user.uid));
            }
            if (dmSearch) {
              const search = dmSearch.toLowerCase();
              filtered = filtered.filter(room => {
                const otherUser = (room.userA?.id === user?.dbId || (user?.email && room.userA?.email === user?.email)) ? room.userB : room.userA;
                const name = otherUser ? getChatUserDisplayName(otherUser, lang) || otherUser.email || '' : '';
                return name.toLowerCase().includes(search);
              });
            }
            // sort: starred first (by me), then by lastMessageAt desc
            filtered = [...filtered].sort((a, b) => {
              const aStar = (a.starBy || []).includes(user.uid) ? 1 : 0;
              const bStar = (b.starBy || []).includes(user.uid) ? 1 : 0;
              if (bStar !== aStar) return bStar - aStar;
              const aTime = (a.lastMessageAt?.toDate?.() || a.createdAt?.toDate?.() || 0);
              const bTime = (b.lastMessageAt?.toDate?.() || b.createdAt?.toDate?.() || 0);
              return bTime - aTime;
            });
            return Array.isArray(filtered) ? filtered : [];
          })()
            .filter(Boolean)
            .flatMap(x => Array.isArray(x) ? x : [x])
            .map(room => {
            // DM rooms have participantA/participantB (numeric DB IDs) and userA/userB (user data)
            // user.uid is a Keycloak UUID, so we can't match participants directly
            // Instead, use userA/userB data included in the room object
            const otherUser = (room.userA?.id === user?.dbId || (user?.email && room.userA?.email === user?.email)) ? room.userB : room.userA;
            const otherId = otherUser?.id;
            const label = otherUser ? getChatUserDisplayName(otherUser, lang) || otherUser.email || t('conversation') : t('conversation');
            const initial = (label || t('conversation'))[0]?.toUpperCase();
            const lastTime = room.lastMessageAt?.toDate?.();
            return (
              <div
                key={room.id}
                onClick={() => handleClassChange(`dm:${room.id}`)}
                onContextMenu={(e)=>{ e.preventDefault(); setDmContextMenu({ roomId: room.id, x: e.clientX, y: e.clientY }); }}
                style={{
                  padding: '0.4rem 0.6rem', cursor: 'pointer',
                  background: selectedClass === `dm:${room.id}` ? 'rgba(0,0,0,0.06)' : 'var(--panel)',
                  borderBottom: '1px solid var(--border)', transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {(() => {
                    // For DM: show X only if deleted or disabled on user level
                    const isDeleted = !otherUser;
                    const isDisabled = false;
                    const showIndicator = isDeleted || isDisabled;
                    const indicatorTitle = isDeleted ? 'Deleted User' : (isDisabled ? 'Disabled User' : '');
                    return (
                      <>
                        {otherUser?.profileImageUrl ? (
                          <div style={{ position: 'relative' }}>
                            <img src={otherUser.profileImageUrl} alt={label} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', opacity: showIndicator ? 0.5 : 1 }} />
                            {showIndicator && (
                              <div style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#dc2626', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={indicatorTitle}>
                                <span style={{ fontSize: 8, color: 'white' }}>✕</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: showIndicator ? 'var(--muted)' : 'linear-gradient(135deg,var(--brand),var(--brand2))', color: 'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 'var(--font-size-sm)', fontWeight: 700, opacity: showIndicator ? 0.5 : 1 }}>{initial}</div>
                            {showIndicator && (
                              <div style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#dc2626', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={indicatorTitle}>
                                <span style={{ fontSize: 8, color: 'white' }}>✕</span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ fontWeight: 600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1, opacity: !otherUser ? 0.6 : 1 }}>
                        {label}
                      </div>
                      {otherUser && <RoleBadge user={otherUser} />}
                      {(() => { const c = unreadCounts[`dm:${room.id}`]||0; if (c>0) { return (<span style={{background:'var(--brand)',color:'white',borderRadius:'50%',minWidth:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:'bold',padding:'0 5px'}}>{c>99?'99+':c}</span>);} return null; })()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display:'flex', justifyContent:'space-between', gap: 8 }}>
                      <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{room.lastMessage || ''}</span>
                      <span style={{ color: 'var(--muted)', marginLeft: 8 }}>
                        {lastTime ? formatDateTime(lastTime) : ''}
                      </span>
                    </div>
                    {/* Operations row (icons) */}
                    <div style={{ display:'flex', gap:8, marginTop:6 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(room); }}
                        title={(room.starBy || []).includes(user.uid) ? t('unfavorite') : t('favorite')}
                        style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:6, padding:'2px 6px', cursor:'pointer', color:(room.starBy||[]).includes(user.uid)?'#facc15':'var(--muted)', fontSize:'0.9rem', lineHeight:1 }}
                      >{(room.starBy||[]).includes(user.uid)?'★':'☆'}</button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const next = { ...archivedRooms };
                            if (next[room.id]) delete next[room.id]; else next[room.id] = true;
                            setArchivedRooms(next);
                            await updateUser(user.uid, { archivedRooms: next });
                          } catch {}
                        }}
                        title={archivedRooms[room.id] ? t('unarchive') : t('archive')}
                        style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:6, padding:'2px 6px', cursor:'pointer', color:'var(--muted)', fontSize:'0.9rem', lineHeight:1 }}
                      >{archivedRooms[room.id] ? getThemedIcon('ui', 'upload', 14, theme) : getThemedIcon('ui', 'download', 14, theme)}</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
        {/* Sidebar footer: archived + favorites toggle */}
        <div style={{ padding:'0.5rem 0.9rem', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input id="toggle-archived" type="checkbox" checked={showArchived} onChange={(e)=>setShowArchived(e.target.checked)} />
            <label htmlFor="toggle-archived" style={{ fontSize:'0.85rem', color:'var(--muted)', cursor:'pointer' }}>{t('show_archived')}</label>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input id="toggle-favorites" type="checkbox" checked={showFavoritesOnly} onChange={(e)=>setShowFavoritesOnly(e.target.checked)} />
            <label htmlFor="toggle-favorites" style={{ fontSize:'0.85rem', color:'var(--muted)', cursor:'pointer' }}>{t('favorites_only')}</label>
          </div>
        </div>
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          style={{
            position: 'absolute',
            left: isSidebarCollapsed ? 12 : 'auto',
            right: isSidebarCollapsed ? 'auto' : -3,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'left 0.3s ease, right 0.3s ease, transform 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            e.currentTarget.style.background = 'var(--brand)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            e.currentTarget.style.background = 'var(--panel)';
          }}
          title={isSidebarCollapsed ? t('expand_sidebar') : t('collapse_sidebar')}
        >
          {getThemedIcon('ui', isSidebarCollapsed ? 'chevron_right' : 'chevron_left', 14, theme)}
        </button>

        {/* Drag handle (only show when not collapsed) */}
        {!isSidebarCollapsed && (
          <div
            onMouseDown={onDragStart}
            style={{ position:'absolute', right: -3, top:0, bottom:0, width:6, cursor:'col-resize' }}
            aria-label={t('resize_sidebar')}
          />
        )}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        <div style={{
          padding: '1rem 1.5rem',
          background: 'var(--panel)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Left Container (flex: 1) */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
            {/* Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {selectedClass === 'global' ? t('global_chat') :
                 (selectedClass?.startsWith('dm:')
                   ? (()=>{ 
                      const room = directRooms.find(r=>`dm:${r.id}`===selectedClass); 
                      const otherUser = (room?.userA?.id === user?.dbId || (user?.email && room?.userA?.email === user?.email)) ? room?.userB : room?.userA;
                      return otherUser ? getChatUserDisplayName(otherUser, lang) || otherUser.email || t('direct_message') : t('direct_message');
                    })()
                   : selectedClass?.startsWith('group:')
                     ? (()=>{ 
                        const groupId = parseInt(selectedClass.split(':')[1]);
                        const grp = directRooms.find(r => r.id === groupId && r.type === 'group');
                        return grp?.name || t('group_chat');
                      })()
                     : (classes.find(c => c.docId === selectedClass)?.name || selectedClassName || t('chat'))
                 )}
              </h3>
              {/* Display name for DM conversations */}
              {selectedClass?.startsWith('dm:') && (()=>{ 
                const room = directRooms.find(r=>`dm:${r.id}`===selectedClass); 
                const otherUser = (room?.userA?.id === user?.dbId || (user?.email && room?.userA?.email === user?.email)) ? room?.userB : room?.userA;
                const displayName = otherUser ? getChatUserDisplayName(otherUser, lang) : null;
                const email = otherUser?.email;
                if (displayName) {
                  return (
                    <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.25rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {displayName}
                      {otherUser && <RoleBadge user={otherUser} />}
                      {email && email !== displayName && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: '0.25rem', opacity: 0.7 }}>
                          ({email})
                        </span>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
              {/* DM info button */}
              {selectedClass?.startsWith('dm:') && (() => {
                const dmId = parseInt(selectedClass.split(':')[1]);
                const room = directRooms.find(r => r.id === dmId);
                if (!room) return null;
                return (
                  <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.25rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setShowGroupInfoPanel(true)}
                      style={{
                        fontSize: '0.7rem', background: 'transparent', color: 'var(--muted)',
                        border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px',
                        cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.target.style.borderColor = 'var(--brand)'; e.target.style.color = 'var(--brand)'; }}
                      onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--muted)'; }}
                      title={t('chat_group_info') || 'Info'}
                    >
                      {getThemedIcon('ui', 'info', 12, theme)}
                      {t('chat_group_info') || 'Info'}
                    </button>
                  </div>
                );
              })()}
              {/* Group info: participant count, admin badge, leave button */}
              {selectedClass?.startsWith('group:') && (()=>{
                const groupId = parseInt(selectedClass.split(':')[1]);
                const grp = directRooms.find(r => r.id === groupId && r.type === 'group');
                if (!grp) return null;
                const isCreator = grp.createdBy === user?.dbId;
                const participantCount = grp.participants?.length || 0;
                return (
                  <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.25rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                      onClick={() => setShowParticipantModal(true)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'underline' }}
                      title={t('chat_manage_participants')}
                    >
                      {getThemedIcon('ui', 'users', 14, theme)}
                      {participantCount} {t('chat_members')}
                    </span>
                    <button
                      onClick={() => setShowGroupInfoPanel(true)}
                      style={{
                        fontSize: '0.7rem', background: 'transparent', color: 'var(--muted)',
                        border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px',
                        cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.target.style.borderColor = 'var(--brand)'; e.target.style.color = 'var(--brand)'; }}
                      onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--muted)'; }}
                      title={t('chat_group_info') || 'Group Info'}
                    >
                      {getThemedIcon('ui', 'info', 12, theme)}
                      {t('chat_group_info') || 'Info'}
                    </button>
                    {isCreator && (
                      <span style={{ fontSize: '0.7rem', background: 'rgba(255, 193, 7, 0.12)', color: '#ffc107', padding: '1px 6px', borderRadius: 8, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {getIconWithColor('ui', 'crown', 10, '#ffc107')}
                        {t('chat_group_admin')}
                      </span>
                    )}
                    {!isCreator && (
                      <button
                        onClick={async () => {
                          if (!confirm(t('chat_leave_group_confirm'))) return;
                          try {
                            const result = await chatService.leaveGroupRoom(groupId, user?.dbId);
                            if (result.success) {
                              toast?.showSuccess(t('chat_left_group'));
                              setSelectedClass('global');
                              // Refresh rooms to remove the left group from sidebar
                              try {
                                const roomsResult = await chatService.getUserRooms();
                                if (roomsResult.success) {
                                  const rooms = [];
                                  roomsResult.data.forEach(r => {
                                    if (r.type === 'dm') {
                                      rooms.push({
                                        id: r.id,
                                        participantA: r.participantA,
                                        participantB: r.participantB,
                                        userA: r.userA,
                                        userB: r.userB,
                                        type: 'dm',
                                        lastMessage: null,
                                        createdAt: r.createdAt
                                      });
                                    } else if (r.type === 'group') {
                                      rooms.push({
                                        id: r.id,
                                        type: 'group',
                                        name: r.name,
                                        createdBy: r.createdBy,
                                        participants: r.participants,
                                        creator: r.creator,
                                        lastMessage: null,
                                        createdAt: r.createdAt
                                      });
                                    }
                                  });
                                  setDirectRooms(rooms);
                                }
                              } catch (e) {
                                error('Failed to refresh rooms after leaving group:', e);
                              }
                            } else {
                              toast?.showError(t('chat_leave_group_failed'));
                            }
                          } catch (err) {
                            error('Failed to leave group:', err);
                            toast?.showError(t('chat_leave_group_failed'));
                          }
                        }}
                        style={{ fontSize: '0.7rem', background: 'transparent', color: '#dc2626', border: '1px solid #dc262640', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.target.style.background = '#dc2626'; e.target.style.color = 'white'; }}
                        onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#dc2626'; }}
                      >
                        {getThemedIcon('ui', 'x', 10, theme)}
                        {t('chat_leave_group')}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
            
            {/* Class Badge */}
            {(() => {
              const isGlobal = selectedClass === 'global';
              const isDM = selectedClass?.startsWith('dm:');
              const isGroup = selectedClass?.startsWith('group:');
              const bg = isGlobal ? 'rgba(25, 118, 210, 0.12)' : isDM ? 'rgba(239, 108, 0, 0.12)' : isGroup ? 'rgba(126, 87, 194, 0.12)' : 'rgba(46, 125, 50, 0.12)';
              const color = isGlobal ? '#1976d2' : isDM ? '#ef6c00' : isGroup ? '#7e57c2' : '#2e7d32';
              const label = isGlobal ? t('chat_global') : isDM ? t('chat_dm_label') : isGroup ? t('chat_group_label') : t('chat_class_label');
              return (
                <span style={{ fontSize: 'var(--font-size-xs)', background: bg, color, padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                  {label}
                </span>
              );
            })()}
            
            {/* Messages Count */}
            <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
              {messages.length} {t('messages')}
            </span>
            
            {/* DM Name (if any) - shown for DM conversations */}
            {selectedClass?.startsWith('dm:') && (()=>{ 
              const room = directRooms.find(r=>`dm:${r.id}`===selectedClass); 
              const otherUser = (room?.userA?.id === user?.dbId || (user?.email && room?.userA?.email === user?.email)) ? room?.userB : room?.userA;
              return otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email : null;
            })() && (
              <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 500 }}>
                {(()=>{ 
                  const room = directRooms.find(r=>`dm:${r.id}`===selectedClass); 
                  const otherUser = (room?.userA?.id === user?.dbId || (user?.email && room?.userA?.email === user?.email)) ? room?.userB : room?.userA;
                  return otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email : '';
                })()}
              </span>
            )}
          </div>
          {/* Search Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              data-tour="chat-search"
              type="button"
              onClick={() => { setShowSearch(!showSearch); if (!showSearch) setTimeout(() => document.getElementById('msg-search')?.focus(), 100); }}
              title={t('search_messages')}
              style={{ 
                background:'transparent', 
                border:'1px solid var(--border)',
                borderRadius: 8,
                cursor:'pointer', 
                fontSize: 'var(--font-size-md)', 
                color:'var(--muted)',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e)=>{e.target.style.background='var(--background)'; e.target.style.borderColor='var(--brand)';}}
              onMouseOut={(e)=>{e.target.style.background='transparent'; e.target.style.borderColor='var(--border)';}}
            >
              {getThemedIcon('ui', 'search', 16, theme)}
            </button>
            <ChatWallpaperPicker theme={theme} t={t} />
          </div>
        </div>

        {/* Search input - collapsible */}
        {showSearch && (
          <div style={{ 
            padding: '0.75rem 1.5rem', 
            borderBottom: '1px solid var(--border)',
            background: 'var(--panel)'
          }}>
            <input
              autoComplete="off"
              value={msgQuery}
              onChange={(e)=>setMsgQuery(e.target.value)}
              onBlur={() => { if (!msgQuery.trim()) setShowSearch(false); }}
              onKeyDown={(e) => { if (e.key === 'Escape') { setMsgQuery(''); setShowSearch(false); } }}
              id="msg-search"
              placeholder={t('chat_search_messages')}
              style={{ 
                width:'100%', 
                padding:'0.625rem 0.875rem', 
                border:'1px solid var(--border)', 
                borderRadius:8, 
                background:'var(--panel)', 
                color:'var(--text)',
                fontSize:'0.9rem'
              }}
            />
          </div>
        )}

        {/* Pinned message banner — group chats only */}
        {selectedClass?.startsWith('group:') && (() => {
          const pinnedMsg = (safeMessages || []).find(m => m.pinnedById !== null && m.pinnedById !== undefined && !m.isDeleted);
          if (!pinnedMsg) return null;
          const pinnedSender = (allUsers || []).find(u => u.docId === pinnedMsg.senderId || u.id === pinnedMsg.senderId || String(u.id) === String(pinnedMsg.senderId));
          const pinnedSenderName = pinnedMsg.senderName || getChatUserDisplayName(pinnedSender, lang) || t('unknown') || 'Unknown';
          return (
            <div
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--panel)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onClick={() => {
                const el = document.getElementById(`msg-${pinnedMsg.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setHighlightedMsgId(pinnedMsg.id);
                  setTimeout(() => setHighlightedMsgId(null), 2000);
                }
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--background)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--panel)'; }}
            >
              {getThemedIcon('ui', 'pin', 14, theme)}
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--brand)', marginRight: '0.25rem' }}>
                  {t('pinned_message') || 'Pinned'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.8 }}>
                  {pinnedMsg.content || pinnedMsg.pollQuestion || pinnedMsg.fileName || '...'}
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', flexShrink: 0 }}>
                {pinnedSenderName}
              </span>
            </div>
          );
        })()}

        {/* Members button - moved to separate row */}
        {classMembers.length > 0 && !selectedClass?.startsWith('dm:') && !selectedClass?.startsWith('group:') && (
          <div style={{ padding: '0.5rem 1.5rem', background: 'var(--panel)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div onClick={() => setShowMembers(true)} style={{ fontSize: '0.9rem', color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {getThemedIcon('ui', 'users', 16, theme)} {classMembers.length} {t('chat_members')}
            </div>
            <button
              onClick={async () => {
                if (selectedClass === 'global') {
                  const rid = await chatService.resolveRoomId('global', 'global');
                  if (rid) {
                    setClassInfoRoomId(rid);
                    setShowGroupInfoPanel(true);
                  }
                } else if (selectedClass && selectedClass !== 'global') {
                  const rid = await chatService.resolveRoomId('class', selectedClass);
                  if (rid) {
                    setClassInfoRoomId(rid);
                    setShowGroupInfoPanel(true);
                  }
                }
              }}
              style={{
                fontSize: '0.7rem', background: 'transparent', color: 'var(--muted)',
                border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px',
                cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = 'var(--brand)'; e.target.style.color = 'var(--brand)'; }}
              onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--muted)'; }}
              title={t('chat_group_info') || 'Info'}
            >
              {getThemedIcon('ui', 'info', 12, theme)}
              {t('chat_group_info') || 'Info'}
            </button>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollContainerRef} style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.9rem',
          ...getWallpaperStyle(chatWallpaper, theme === 'dark')
        }}>
          {(() => {
            const q = (msgQuery || '').trim().toLowerCase();
            const globalSearch = selectedClass === 'global' ? (globalChatSearch || '').trim().toLowerCase() : '';
            let list = messages || [];
            
            // Apply global chat search (search in messages and class names)
            if (globalSearch && selectedClass === 'global') {
              list = list.filter(m => {
                const matchesMessage = (m.content || '').toLowerCase().includes(globalSearch) || (m.fileName || '').toLowerCase().includes(globalSearch);
                const sender = allUsers.find(u => u.docId === m.senderId);
                const matchesSender = sender && ((sender.displayName || '').toLowerCase().includes(globalSearch) || (sender.email || '').toLowerCase().includes(globalSearch));
                return matchesMessage || matchesSender;
              });
            }
            
            // Apply regular message search
            if (q) {
              list = list.filter(m => (m.content || '').toLowerCase().includes(q) || (m.fileName || '').toLowerCase().includes(q));
            }
            if (!list || list.length === 0) {
              return (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '60%',
                  padding: '2rem',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    fontSize: '2rem',
                  }}>
                    {(msgQuery?.trim() || globalChatSearch) ? '🔍' : '💬'}
                  </div>
                  <p style={{
                    color: theme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(100,110,130,0.7)',
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    margin: 0,
                    maxWidth: 320,
                    lineHeight: 1.6,
                  }}>
                    {(msgQuery?.trim() || globalChatSearch) ? (t('no_messages_found')) : (t('no_messages'))}
                  </p>
                </div>
              );
            }
            const groupedByDate = [];
            let lastDate = null;
            list.forEach((msg) => {
              const msgDate = msg.createdAt?.toDate() || new Date();
              const dateStr = formatDate(msgDate);
              if (dateStr !== lastDate) {
                groupedByDate.push({ type: 'date', date: msgDate, dateStr });
                lastDate = dateStr;
              }
              groupedByDate.push({ type: 'message', ...msg });
            });
            
            return groupedByDate.map((item, idx) => {
              if (item.type === 'date') {
                const today = formatDate(new Date());
                const yesterday = formatDate(new Date(Date.now() - 86400000));
                let label = item.dateStr;
                if (item.dateStr === today) label = t('today');
                else if (item.dateStr === yesterday) label = t('yesterday');
                return (
                  <div key={`date-${idx}`} style={{ display:'flex', alignItems:'center', margin:'1.5rem 0 1rem' }}>
                    <div style={{ flex:1, height:1, background:'var(--border)' }} />
                    <div style={{ padding:'0 1rem', fontSize:'0.8rem', color:'var(--muted)', fontWeight:600 }}>{label}</div>
                    <div style={{ flex:1, height:1, background:'var(--border)' }} />
                  </div>
                );
              }
              const msg = item;
              const isOwnMessage = msg.senderId === user?.dbId || msg.senderId === user?.uid;
              const senderUser = allUsers.find(u => u.docId === msg.senderId || u.id === msg.senderId || String(u.id) === String(msg.senderId));
              const isHighlighted = highlightedMsgId === msg.id;
              const myProfile = allUsers.find(u => u.docId === user?.uid || u.id === user?.dbId || String(u.id) === String(user?.dbId));
              const bubbleColor = isOwnMessage
                ? '#ffffff'  // Always white for own messages
                : '#ffffff';
              
              // Add alpha transparency to bubble colors
              const transparentBubbleColor = bubbleColor + 'CC'; // Add 80% opacity (CC in hex)
              // Smart contrast: if highlighted, force dark readable text
              const textColor = isHighlighted ? '#1e293b' : (isOwnMessage ? '#000000' : '#000000');
              
              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                    marginBottom: '1.75rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div onContextMenu={(e)=>{e.preventDefault(); setMenuOpenId(msg.id);}}
                       onTouchStart={(e)=>{ 
                         clearTimeout(longPressTimerRef.current); 
                         longPressTimerRef.current = setTimeout(()=>{
                           const touch = e.touches[0];
                           setReactionMenu({ msgId: msg.id, x: touch.clientX, y: touch.clientY });
                         }, 500); 
                       }}
                       onTouchEnd={()=>{ clearTimeout(longPressTimerRef.current); }}
                       onMouseDown={(e)=>{
                         if (e.button === 0) {
                           clearTimeout(longPressTimerRef.current);
                           longPressTimerRef.current = setTimeout(()=>{
                             setReactionMenu({ msgId: msg.id, x: e.clientX, y: e.clientY });
                           }, 500);
                         }
                       }}
                       onMouseUp={()=>{ clearTimeout(longPressTimerRef.current); }}
                       onMouseLeave={()=>{ clearTimeout(longPressTimerRef.current); }}
                       className={isHighlighted ? 'flash-pulse' : ''}
                       style={{
                    maxWidth: '60%',
                    background: isHighlighted ? '#fff3cdCC' : transparentBubbleColor,
                    color: textColor,
                    padding: '0.5rem 0.75rem',
                    paddingInlineEnd: (isOwnMessage || isAdmin) ? '2.5rem' : '0.75rem',
                    paddingBottom: '1.75rem',
                    borderRadius: '12px',
                    boxShadow: isHighlighted ? '0 0 20px rgba(255,193,7,0.5)' : '0 2px 4px rgba(0,0,0,0.08)',
                    border: isHighlighted ? '2px solid #ffc107' : '1px solid var(--border)',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}>
                    {/* Sender Info (show only in class/global, not DM) */}
                    {!isOwnMessage && !selectedClass?.startsWith('dm:') && (
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        marginBottom: '0.25rem',
                        opacity: senderUser?.deleted || senderUser?.disabled || senderUser?.isDisabled ? 0.5 : 0.8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {msg.senderName || getChatUserDisplayName(senderUser, lang) || t('unknown')}
                        {senderUser && (
                          <RoleBadge user={senderUser} size={12} fontSize='0.7rem' style={{ borderRadius: '4px', padding: '0.1rem 0.3rem', marginInlineStart: '0.25rem' }} />
                        )}
                        {senderUser?.studentNumber && (
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)', marginInlineStart: '0.25rem', fontWeight: 'normal' }}>
                            ({senderUser.studentNumber})
                          </span>
                        )}
                        {(senderUser?.deleted || senderUser?.disabled || senderUser?.isDisabled) && (
                          <span style={{
                            fontSize: '0.7rem',
                            background: '#dc2626',
                            color: 'white',
                            borderRadius: '50%',
                            width: 14,
                            height: 14,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1
                          }} title={senderUser?.deleted ? t('deleted_user') : t('disabled_user')}>✕</span>
                        )}
                      </div>
                    )}

                    {/* Message Content */}
                    {msg.messageType === 'voice' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <audio
                          controls
                          src={withAuthToken(msg.voiceUrl)}
                          style={{ width: '200px', height: '30px' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                          {formatTime(msg.duration || 0)}
                        </span>
                      </div>
                    ) : msg.messageType === 'file' ? (
                      (() => {
                        const fileName = msg.fileName || t('attachment');
                        const fileType = fileName.split('.').pop()?.toLowerCase() || '';
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType) || msg.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)/i);
                        const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(fileType) || msg.fileUrl?.match(/\.(mp4|webm|ogg|mov)/i);
                        
                        if (isImage) {
                          return (
                            <div style={{ maxWidth: '300px' }}>
                              <img
                                src={withAuthToken(msg.fileUrl)}
                                alt={fileName}
                                style={{ width: '100%', borderRadius: 8, cursor: 'pointer' }}
                                onClick={() => window.open(withAuthToken(msg.fileUrl), '_blank')}
                              />
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)', marginTop: 4 }}>
                                {fileName} • {(msg.fileSize ? Math.ceil(msg.fileSize/1024) : 0)} KB
                              </div>
                            </div>
                          );
                        } else if (isVideo) {
                          return (
                            <div style={{ maxWidth: '300px' }}>
                              <video
                                controls
                                style={{ width: '100%', borderRadius: 8 }}
                                preload="metadata"
                              >
                                <source src={withAuthToken(msg.fileUrl)} type={`video/${fileType}`} />
                                {t('browser_no_video_support')}
                              </video>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)', marginTop: 4 }}>
                                {fileName} • {(msg.fileSize ? Math.ceil(msg.fileSize/1024) : 0)} KB
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {getThemedIcon('ui', 'paperclip', 16, theme)}
                              <a
                                href={withAuthToken(msg.fileUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'underline' }}
                                download
                              >
                                {fileName}
                              </a>
                              <span style={{ fontSize: '0.8rem', opacity: 0.85, color: 'var(--muted)' }}>
                                {(msg.fileSize ? Math.ceil(msg.fileSize/1024) : 0)} KB
                              </span>
                            </div>
                          );
                        }
                      })()
                    ) : msg.messageType === 'poll' ? (
                      <div style={{ minWidth: 250 }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {getThemedIcon('ui', 'bar_chart', 20, theme)} {msg.pollQuestion}
                        </div>
                        {msg.pollOptions?.map((option, idx) => {
                          const optionText = typeof option === 'string' ? option : (option?.text || '');
                          const optionVotes = typeof option === 'object' && option?.votes ? option.votes : (msg.pollVotes?.[idx] || []);
                          const totalVotes = (msg.pollVotes && typeof msg.pollVotes === 'object') 
                            ? Object.values(msg.pollVotes).flat().length 
                            : (msg.pollOptions || []).reduce((sum, o) => sum + (o?.votes?.length || 0), 0);
                          const percentage = totalVotes > 0 ? Math.round((optionVotes.length / totalVotes) * 100) : 0;
                          const hasVoted = optionVotes.includes(user?.dbId) || optionVotes.includes(user?.dbId?.toString()) || optionVotes.includes(user?.uid);
                          return (
                            <button
                              key={idx}
                              onClick={async () => {
                                try {
                                  suppressAutoScrollRef.current = true;
                                  // Initialize pollVotes if it doesn't exist
                                  const currentVotes = msg.pollVotes || {};
                                  // Remove user from all options
                                  await Promise.all(
                                    msg.pollOptions.map(async (_, i) => {
                                      const currentOptionVotes = currentVotes[i] || [];
                                      if (currentOptionVotes.includes(user?.dbId) || currentOptionVotes.includes(user?.dbId?.toString())) {
                                        await chatService.removePollVote(msg.id, user.uid, i);
                                      }
                                    })
                                  );
                                  
                                  // Add to selected option
                                  const result = await chatService.votePoll(msg.id, user.uid, idx);
                                  
                                  // Update local state immediately
                                  if (result?.success && result?.data) {
                                    setMessages(prev => (prev || []).map(m => m.id === msg.id ? { ...m, pollVotes: result.data.pollVotes, pollOptions: result.data.pollOptions } : m));
                                  }
                                } catch (err) {
                                  error('Poll vote error:', err);
                                  toast?.showError(t('failed_to_vote'));
                                }
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '0.5rem',
                                marginBottom: '0.25rem',
                                background: hasVoted ? 'rgba(102,126,234,0.2)' : 'rgba(0,0,0,0.05)',
                                border: hasVoted ? '2px solid var(--brand)' : '1px solid var(--border)',
                                borderRadius: 8,
                                cursor: 'pointer',
                                textAlign: 'left',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: `${percentage}%`,
                                background: 'rgba(102,126,234,0.1)',
                                transition: 'width 0.3s'
                              }} />
                              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', color: '#000000' }}>
                                <span>{optionText}</span>
                                <span style={{ fontWeight: 600 }}>{percentage}% ({optionVotes.length})</span>
                              </div>
                            </button>
                          );
                        })}
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                          {(msg.pollVotes && typeof msg.pollVotes === 'object' 
                            ? Object.values(msg.pollVotes).flat().length 
                            : (msg.pollOptions || []).reduce((sum, o) => sum + (o?.votes?.length || 0), 0))} {t('votes')}
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const text = msg.content || '';
                        // Hide standalone token-like strings (e.g., zRG... with no spaces/links)
                        const looksLikeToken = /^[A-Za-z0-9+/_=-]{20,}$/.test(text) && !text.includes('http');
                        if (looksLikeToken) return null;
                        return <div>{text}</div>;
                      })()
                    )}

                    {/* Timestamp + receipts — dedicated bottom row */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0.35rem',
                      insetInlineEnd: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.7rem',
                      opacity: 0.7,
                      color: getUserThemeColor(),
                      whiteSpace: 'nowrap',
                      lineHeight: 1
                    }}>
                      {isOwnMessage && (() => {
                        const msgTime = msg.createdAt?.toDate() || new Date();
                        const recips = selectedClass === 'global'
                          ? safeAllUsers.map(u => u.docId).filter(id => id && id !== user.uid)
                          : (selectedClass?.startsWith('dm:')
                              ? (safeDirectRooms.find(r => r.id === selectedClass.slice(3))?.participants || []).filter(id => id && id !== user.uid)
                              : safeClassMembers.map(m => m.docId).filter(id => id && id !== user.uid)
                            );
                        const readCount = recips.filter(id => memberReads[id] && memberReads[id] >= msgTime).length;
                        const allRead = recips.length > 0 && readCount === recips.length;
                        const anyRead = readCount > 0;
                        const tickStyle = { 
                          fontSize: '1.1rem',
                          fontWeight: 700, 
                          color: allRead ? getUserThemeColor() : (anyRead ? `${getUserThemeColor()}99` : `${getUserThemeColor()}66`), 
                          cursor: 'pointer',
                          transition: 'color 0.2s',
                          lineHeight: 1
                        };
                        const tooltip = `${t('seen_by')} ${readCount} ${t('of')} ${recips.length}`;
                        return (
                          <span
                            style={tickStyle}
                            title={tooltip}
                            onClick={(e)=>{
                              e.stopPropagation();
                              const list = (recips||[]).map(uid => ({
                                uid,
                                name: (allUsers||[]).find(u=>u.docId===uid)?.displayName || (allUsers||[]).find(u=>u.docId===uid)?.email || uid,
                                readAt: memberReads[uid]
                              })).sort((a,b)=> (b.readAt?.getTime?.()||0) - (a.readAt?.getTime?.()||0));
                              setReceiptsFor({ id: msg.id, list, readCount, total: recips.length });
                            }}
                          >{anyRead ? '✓✓' : '✓'}</span>
                        );
                      })()}
                      <span>{msg.createdAt?.toDate()?.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    {/* Icon/Emoji Reactions - Single per user */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (() => {
                      // Determine top reactions (most reactions)
                      const counts = {};
                      Object.values(msg.reactions || {}).forEach(reaction => {
                        // Check if it's an emoji (old format) or reaction name (new format)
                        const isEmoji = typeof reaction === 'string' && reaction.length <= 3 && !/^[A-Za-z0-9+/_=-]+$/.test(reaction);
                        const isReactionName = ['ThumbsUp','Heart','Smile','Surprise','Frown','Pray'].includes(reaction);
                        if (!isEmoji && !isReactionName) return;
                        counts[reaction] = (counts[reaction] || 0) + 1;
                      });
                      const topList = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3);
                      if (topList.length === 0) return null;
                      
                      const getReactionDisplay = (reaction, color) => {
                        // Check if it's a reaction name (new format)
                        if (['ThumbsUp','Heart','Smile','Surprise','Frown','Pray'].includes(reaction)) {
                          const iconName = reaction === 'ThumbsUp' ? 'thumbs_up' :
                            reaction === 'Heart' ? 'heart' :
                            reaction === 'Smile' ? 'smile' :
                            reaction === 'Surprise' ? 'help_circle' :
                            reaction === 'Frown' ? 'x_circle' :
                            reaction === 'Pray' ? 'star' : 'smile';
                          return getIconWithColor('ui', iconName, 18, color);
                        }
                        // Return emoji as-is (old format)
                        return reaction;
                      };

                      const getReactionColor = (reaction) => {
                        // Define colors for each reaction type
                        const reactionColors = {
                          'ThumbsUp': '#3b82f6', // Blue
                          'Heart': '#ef4444',   // Red
                          'Smile': '#eab308',  // Yellow
                          'Surprise': '#f97316', // Orange
                          'Frown': '#6b7280',   // Gray
                          'Pray': '#8b5cf6',    // Purple
                        };
                        
                        // Check if it's a reaction name (new format)
                        if (['ThumbsUp','Heart','Smile','Surprise','Frown','Pray'].includes(reaction)) {
                          return reactionColors[reaction] || '#6b7280';
                        }
                        
                        // For emojis, use a default color
                        return '#6b7280';
                      };

                      return (
                        <div style={{ 
                          position:'absolute', 
                          insetInlineStart: -22, 
                          top: '50%', 
                          transform:'translateY(-50%)', 
                          display:'flex', 
                          flexDirection:'row', 
                          gap:6,
                          padding: '2px',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: 16,
                          boxShadow: 'none'
                        }}>
                          {topList.map(([reaction, count]) => {
                            const active = msg.reactions[user.uid] === reaction;
                            const reactionColor = getReactionColor(reaction);
                            return (
                              <button key={reaction}
                                onClick={async ()=>{
                                  try {
                                    let result;
                                    if (active) {
                                      result = await chatService.removeReaction(msg.id, user.uid);
                                    } else {
                                      result = await chatService.addReaction(msg.id, user.uid, reaction);
                                    }
                                    if (result?.success && result?.data?.reactions) {
                                      setMessages(prev => (prev || []).map(m => m.id === msg.id ? { ...m, reactions: result.data.reactions } : m));
                                    }
                                  } catch {}
                                }}
                                title={`${count} ${t('reactions')}`}
                                style={{ 
                                  background: active ? `${reactionColor}20` : 'transparent',
                                  border: active ? `1px solid ${reactionColor}` : 'none',
                                  borderRadius:12, 
                                  padding:'4px 8px', 
                                  fontSize:'0.85rem', 
                                  cursor:'pointer', 
                                  boxShadow:'none', 
                                  opacity: active?1:0.9,
                                  transition:'all 0.2s ease',
                                  display:'flex',
                                  alignItems:'center',
                                  gap:'4px',
                                  color: 'var(--text)',
                                  fontWeight: active ? '600' : '500',
                                  minWidth: 'fit-content'
                                }}
                                onMouseEnter={(e) => {
                                  if (!active) {
                                    e.currentTarget.style.background = `${reactionColor}10`;
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!active) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }
                                }}
                              >
                                {getReactionDisplay(reaction, reactionColor)}
                                <span style={{ 
                                  fontSize: 'var(--font-size-xs)', 
                                  fontWeight: '600',
                                  lineHeight: 1,
                                  color: active ? reactionColor : 'var(--text-secondary)'
                                }}>
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Emoji reaction button (placed just outside bubble to avoid covering time) */}
                    <button
                      data-tour="chat-reaction-btn"
                      onClick={(e)=>{ 
                        e.stopPropagation(); 
                        const rect = e.currentTarget.getBoundingClientRect();
                        setReactionMenu({ msgId: msg.id, x: rect.left, y: rect.bottom + 4 }); 
                      }}
                      title={t('react')}
                      style={{ 
                        position:'absolute', 
                        bottom: -14, 
                        insetInlineStart: -14, 
                        background:'var(--panel)', 
                        border:'2px solid var(--border)', 
                        borderRadius:'50%', 
                        width:30, 
                        height:30, 
                        display:'flex', 
                        alignItems:'center', 
                        justifyContent:'center', 
                        cursor:'pointer', 
                        boxShadow:'0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)', 
                        transition:'all 0.2s ease',
                        fontSize:'1.2rem',
                        fontFamily:'"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "EmojiSymbols", sans-serif',
                        zIndex: 2
                      }}
                      onMouseEnter={(e)=>e.currentTarget.style.transform='scale(1.05)'}
                      onMouseLeave={(e)=>e.currentTarget.style.transform='scale(1)'}
                    >
                      <span aria-hidden="true" style={{ display:'inline-block', transform:'translateY(1px)' }}>{getIconWithColor('ui', 'smile', 16, '#eab308')}</span>
                    </button>

                    {/* Anchored Reaction Menu (fixed positioning to avoid overflow) */}
                    {reactionMenu?.msgId === msg.id && (() => {
                      const menuW = 280;
                      const menuH = 44;
                      let mx = reactionMenu.x;
                      let my = reactionMenu.y;
                      // Clamp to viewport
                      if (mx + menuW > window.innerWidth) mx = window.innerWidth - menuW - 8;
                      if (mx < 8) mx = 8;
                      if (my + menuH > window.innerHeight) my = reactionMenu.y - menuH - 24;
                      if (my < 8) my = 8;
                      return (
                      <div
                        className="pop-in"
                        ref={reactionMenuRef}
                        style={{
                          position: 'fixed',
                          left: mx,
                          top: my,
                          background: 'var(--panel)',
                          border: '1px solid var(--border)',
                          borderRadius: 16,
                          padding: '0.4rem 0.6rem',
                          boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
                          zIndex: 9999,
                          display: 'flex',
                          gap: '0.35rem'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {['ThumbsUp','Heart','Smile','Surprise','Frown','Pray'].map((reactionName, index) => {
                          const reactionColors = {
                            'ThumbsUp': '#3b82f6',
                            'Heart': '#ef4444',
                            'Smile': '#eab308',
                            'Surprise': '#f97316',
                            'Frown': '#6b7280',
                            'Pray': '#8b5cf6',
                          };
                          const reactionColor = reactionColors[reactionName] || '#6b7280';
                          const getReactionIcon = (name, size) => {
                            return getIconWithColor('ui', 
                              name === 'ThumbsUp' ? 'thumbs_up' :
                              name === 'Heart' ? 'heart' :
                              name === 'Smile' ? 'smile' :
                              name === 'Surprise' ? 'help_circle' :
                              name === 'Frown' ? 'x_circle' :
                              name === 'Pray' ? 'star' : 'smile',
                              size, reactionColor);
                          };
                          return (
                            <button
                            key={reactionName}
                            onClick={async () => {
                              try {
                                const result = await chatService.addReaction(reactionMenu.msgId, user.uid, reactionName);
                                setReactionMenu(null);
                                if (result?.success && result?.data?.reactions) {
                                  setMessages(prev => (prev || []).map(m => m.id === reactionMenu.msgId ? { ...m, reactions: result.data.reactions } : m));
                                }
                              } catch {}
                            }}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--border)',
                              fontSize: 'var(--font-size-md)',
                              cursor: 'pointer',
                              padding: '0.5rem',
                              borderRadius: '12px',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text)',
                              backgroundColor: 'var(--background-secondary)',
                              backdropFilter: 'blur(8px)'
                            }}
                            onMouseEnter={(e) => { 
                              e.currentTarget.style.background = 'var(--background-hover)'; 
                              e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)'; 
                              e.currentTarget.style.borderColor = 'var(--accent)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                            }} 
                            onMouseLeave={(e) => { 
                              e.currentTarget.style.background = 'var(--background-secondary)'; 
                              e.currentTarget.style.transform = 'scale(1) translateY(0)'; 
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            title={reactionName}
                          >
                            {getReactionIcon(reactionName, 18)}
                          </button>
                        );
                        })}
                      </div>
                      );
                    })()}

                    {/* Star indicator (if starred by current user) */}
                    {(() => {
                      const starredBy = Array.isArray(msg.starredBy) ? msg.starredBy : [];
                      const isStarred = starredBy.includes(user?.dbId) || starredBy.includes(user?.uid);
                      if (!isStarred) return null;
                      return (
                        <span
                          style={{ position:'absolute', top:-10, insetInlineStart: -10, display:'flex', alignItems:'center', justifyContent:'center', width:24, height:24, background:'var(--panel)', borderRadius:'50%', boxShadow:'0 2px 8px rgba(0,0,0,0.15)', border:'2px solid #facc15' }}
                          title={t('starred') || 'Starred'}
                        >
                          {getIconWithColor('ui', 'star', 16, '#facc15')}
                        </span>
                      );
                    })()}

                    {/* Three-dots inline menu — visible to all users for star/pin */}
                    <button
                      onMouseDown={(e)=>e.stopPropagation()}
                      onClick={(e)=>{ e.stopPropagation(); setMenuOpenId(menuOpenId===msg.id?null:msg.id); }}
                      title={t('more')}
                      style={{ position:'absolute', top:4, insetInlineEnd: 4, background:'transparent', border:'none', color:'var(--muted)', cursor:'pointer', fontSize: 'var(--font-size-md)', padding:'2px 4px', lineHeight:1, opacity:0.6 }}
                    >⋮</button>
                    {menuOpenId===msg.id && (
                      <div
                        style={{ position:'absolute', top:26, insetInlineEnd: 6, background:'var(--panel)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, boxShadow:'0 6px 16px rgba(0,0,0,0.2)', zIndex:5 }}
                        onMouseDown={(e)=>e.stopPropagation()}
                      >
                        {(isOwnMessage || isAdmin) && msg.messageType !== 'voice' && msg.messageType !== 'file' && msg.messageType !== 'poll' && (
                          <button
                            onClick={()=>{ setEditingMsg({ id: msg.id, content: msg.content||'' }); setMenuOpenId(null); }}
                            onMouseEnter={(e)=>e.target.style.background='rgba(0,0,0,0.05)'}
                            onMouseLeave={(e)=>e.target.style.background='transparent'}
                            style={{ display:'flex', alignItems:'center', gap:'8px', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color:'var(--text)', transition:'background 0.2s' }}
                          >
                            {getThemedIcon('ui', 'edit', 14, theme)}
                            {t('edit')||'Edit'}
                          </button>
                        )}
                        {/* Star button — available to all users in all chat types */}
                        <button
                          onClick={()=>{ setMenuOpenId(null); handleToggleStar(msg); }}
                          onMouseEnter={(e)=>e.target.style.background='rgba(250,204,21,0.1)'}
                          onMouseLeave={(e)=>e.target.style.background='transparent'}
                          style={{ display:'flex', alignItems:'center', gap:'8px', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color:'var(--text)', transition:'background 0.2s', borderBottom:'1px solid var(--border)' }}
                        >
                          {getThemedIcon('ui', 'star', 14, theme)}
                          {(() => {
                            const starredBy = Array.isArray(msg.starredBy) ? msg.starredBy : [];
                            const isStarred = starredBy.includes(user?.dbId) || starredBy.includes(user?.uid);
                            return isStarred ? (t('unstar') || 'Unstar') : (t('star') || 'Star');
                          })()}
                        </button>
                        {/* Pin button — group chats only */}
                        {selectedClass?.startsWith('group:') && (
                          <button
                            onClick={()=>{ setMenuOpenId(null); handleTogglePin(msg); }}
                            onMouseEnter={(e)=>e.target.style.background='rgba(102,126,234,0.1)'}
                            onMouseLeave={(e)=>e.target.style.background='transparent'}
                            style={{ display:'flex', alignItems:'center', gap:'8px', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color: msg.pinnedById ? 'var(--brand)' : 'var(--text)', transition:'background 0.2s', borderBottom:'1px solid var(--border)' }}
                          >
                            {getThemedIcon('ui', 'pin', 14, theme)}
                            {msg.pinnedById ? (t('unpin') || 'Unpin') : (t('pin') || 'Pin')}
                          </button>
                        )}
                        <button
                          onClick={()=>{
                            setReceiptsFor({ 
                              id: msg.id, 
                              list: (() => {
                                const msgTime = msg.createdAt?.toDate() || new Date();
                                const recipients = selectedClass === 'global'
                                  ? safeAllUsers.map(u => u.docId).filter(id => id && id !== user.uid)
                                  : (selectedClass?.startsWith('dm:')
                                      ? (safeDirectRooms.find(r => r.id === selectedClass.slice(3))?.participants || []).filter(id => id && id !== user.uid)
                                      : safeClassMembers.map(m => m.docId).filter(id => id && id !== user.uid)
                                    );
                                return recipients.map(uid => ({
                                  uid,
                                  name: (allUsers||[]).find(u=>u.docId===uid)?.displayName || (allUsers||[]).find(u=>u.docId===uid)?.email || uid,
                                  readAt: memberReads[uid]
                                })).sort((a,b)=> (b.readAt?.getTime?.()||0) - (a.readAt?.getTime?.()||0));
                              })(),
                              readCount: (() => {
                                const msgTime = msg.createdAt?.toDate() || new Date();
                                const recipients = selectedClass === 'global'
                                  ? (allUsers || []).map(u => u.docId).filter(id => id && id !== user.uid)
                                  : (selectedClass?.startsWith('dm:')
                                      ? (directRooms.find(r => r.id === selectedClass.slice(3))?.participants || []).filter(id => id && id !== user.uid)
                                      : (Array.isArray(classMembers) ? classMembers : []).map(m => m.docId).filter(id => id && id !== user.uid)
                                    );
                                return recipients.filter(id => memberReads[id] && memberReads[id] >= msgTime).length;
                              })(),
                              total: (() => {
                                const recipients = selectedClass === 'global'
                                  ? (allUsers || []).map(u => u.docId).filter(id => id && id !== user.uid)
                                  : (selectedClass?.startsWith('dm:')
                                      ? (directRooms.find(r => r.id === selectedClass.slice(3))?.participants || []).filter(id => id && id !== user.uid)
                                        : (Array.isArray(classMembers) ? classMembers : []).map(m => m.docId).filter(id => id && id !== user.uid)
                                    );
                                return recipients.length;
                              })()
                            });
                            setMenuOpenId(null);
                          }}
                          onMouseEnter={(e)=>e.target.style.background='rgba(102,126,234,0.1)'}
                          onMouseLeave={(e)=>e.target.style.background='transparent'}
                          style={{ display:'flex', alignItems:'center', gap:'8px', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color:'var(--brand)', transition:'background 0.2s', borderBottom:'1px solid var(--border)' }}
                        >
                          {getThemedIcon('ui', 'info', 14, theme)}
                          {t('info')}
                        </button>
                        <button
                          onClick={()=>{
                            const shareUrl = `${window.location.origin}/chat?dest=${selectedClass}&msgId=${msg.id}`;
                            navigator.clipboard.writeText(shareUrl).then(()=>{
                              toast?.showSuccess(t('message_link_copied'));
                              setMenuOpenId(null);
                            }).catch(()=>{
                              toast?.showError(t('failed_to_copy_link'));
                            });
                          }}
                          onMouseEnter={(e)=>e.target.style.background='rgba(102,126,234,0.1)'}
                          onMouseLeave={(e)=>e.target.style.background='transparent'}
                          style={{ display:'flex', alignItems:'center', gap:'8px', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color:'var(--brand)', transition:'background 0.2s', borderBottom:'1px solid var(--border)' }}
                        >
                          {getThemedIcon('ui', 'share', 14, theme)}
                          {t('chat_share_message') || 'Share'}
                        </button>
                        <button
                          onClick={()=>{
                            // Copy message content for forwarding
                            const content = msg.content || msg.pollQuestion || msg.fileName || t('message');
                            navigator.clipboard.writeText(content).then(()=>{
                              toast?.showSuccess(t('message_copied'));
                              setMenuOpenId(null);
                            }).catch(()=>{
                              toast?.showError(t('failed_to_copy'));
                            });
                          }}
                          onMouseEnter={(e)=>e.target.style.background='rgba(102,126,234,0.1)'}
                          onMouseLeave={(e)=>e.target.style.background='transparent'}
                          style={{ display:'flex', alignItems:'center', gap:'8px', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color:'var(--brand)', transition:'background 0.2s', borderBottom:'1px solid var(--border)' }}
                        >
                          {getThemedIcon('ui', 'copy', 14, theme)}
                          {t('chat_copy_message') || 'Copy'}
                        </button>
                        {(isOwnMessage || isAdmin) && (
                          <button
                            onClick={()=>{ setMenuOpenId(null); handleDeleteMessage(msg); }}
                            onMouseEnter={(e)=>e.target.style.background='rgba(220,53,69,0.1)'}
                            onMouseLeave={(e)=>e.target.style.background='transparent'}
                            style={{ display:'flex', alignItems:'center', gap:'8px', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color:'#dc3545', transition:'background 0.2s' }}
                          >
                            {getThemedIcon('ui', 'trash2', 14, theme)}
                            {t('delete')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })()}
          <div ref={messagesEndRef} />
        </div>
        {showJump && (
          <button
            onClick={() => { try { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); } catch {} }}
            title={t('chat_jump_to_bottom')}
            style={{ position:'fixed', right: 24, bottom: 110, background:'var(--panel)', border:'1px solid var(--border)', borderRadius: 20, padding:'8px 10px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', cursor:'pointer', zIndex: 20 }}
          >
            {getThemedIcon('ui', 'download', 16, theme)}
          </button>
        )}
        {/* Bottom search removed - now under top header */}

        {/* Input Area */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          padding: '1rem',
          background: 'var(--panel)',
          borderTop: '1px solid var(--border)',
          zIndex: 10,
          overflow: 'hidden'
        }}>
          {/* File Attachment Preview */}
          {attachedFile && (
            <div style={{
              padding: '0.5rem',
              background: 'var(--bg)',
              borderRadius: '6px',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt={t('preview')} 
                    style={{
                      width: 40,
                      height: 40,
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid var(--border)'
                    }}
                  />
                ) : (
                  getThemedIcon('ui', 'paperclip', 20, theme)
                )}
                <div>
                  <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{attachedFile.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {(attachedFile.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setAttachedFile(null);
                  setImagePreview(null);
                }}
                style={{
                  padding: '0.3rem 0.6rem',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-xs)'
                }}
              >
                ✕ {t('remove')}
              </button>
            </div>
          )}

          {/* Voice Message Ready - Above Input when not recording but has audio */}
          {!isRecording && audioBlob && (
            <div style={{
              padding: '0.4rem 0.6rem',
              background: 'linear-gradient(135deg, #25D366, #20b858)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'white',
              boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              height: '32px',
              marginBottom: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {getThemedIcon('ui', 'mic', 14, theme)}
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '500' }}>
                  {t('voice_message_ready')}
                </span>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-family-mono)', background: 'rgba(255,255,255,0.15)', padding: '1px 4px', borderRadius: '2px' }}>
                  {formatTime(recordingTime)} / {getMaxVoiceTimeDisplay(user?.role || ROLE_STRINGS.STUDENT)}
                </span>
              </div>
              <button
                type="button"
                onClick={cancelRecording}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '0.65rem'
                }}
              >
                {t('cancel')}
              </button>
            </div>
          )}

          {/* Input Form */}
          <form data-tour="chat-input" onSubmit={handleSendMessage} className="form-actions" style={{ position: 'relative' }}>
            {/* Hide input during recording, show compact recording interface instead */}
            {isRecording ? (
              <div style={{
                padding: '0.4rem 0.6rem',
                background: 'linear-gradient(135deg, #ff4444, #dc3545)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'white',
                boxShadow: '0 2px 6px rgba(255, 68, 68, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                height: '32px',
                width: '100%'
              }}>
                {/* Compact Animated Waves */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  opacity: 0.3
                }}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{
                      width: '2px',
                      height: '12px',
                      background: 'white',
                      borderRadius: '1px',
                      animation: `wave ${1.2 + i * 0.1}s infinite ease-in-out`,
                      animationDelay: `${i * 0.1}s`
                    }} />
                  ))}
                </div>
                
                {/* Compact Recording Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: 'white',
                    borderRadius: '50%',
                    animation: 'pulse 1s infinite'
                  }} />
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '500' }}>
                    {t('recording')}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-family-mono)', background: 'rgba(255,255,255,0.15)', padding: '1px 4px', borderRadius: '2px' }}>
                    {formatTime(recordingTime)} / {getMaxVoiceTimeDisplay(user?.role || ROLE_STRINGS.STUDENT)}
                  </span>
                </div>
              </div>
            ) : (
              <input
                ref={messageInputRef}
                type="text"
                autoComplete="off"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('chat_type_a_message')}
                disabled={isUploading}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  outline: 'none',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                }}
              />
            )}
            
            {/* Emoji Picker - Always Visible */}
            <button
              type="button"
              data-emoji-button="true"
              data-tour="chat-emoji-btn"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
              }}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                transition: 'all 0.2s'
              }}
              title={t('emoji')}
              onMouseOver={(e)=>{e.target.style.background='var(--background)'; e.target.style.borderColor='var(--brand)';}}
              onMouseOut={(e)=>{e.target.style.background='transparent'; e.target.style.borderColor='var(--border)';}}
            >
              {getThemedIcon('ui', 'smile', 16, theme)}
            </button>
            
            {/* Compact Action Buttons */}
            {!audioBlob && (
              <>
                {/* Poll (Admin Only) */}
                <button
                  type="button"
                  data-tour="chat-poll-btn"
                  onClick={() => setShowPollModal(true)}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    color: 'var(--muted)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    transition: 'all 0.2s'
                  }}
                  title={t('create_poll')}
                  onMouseOver={(e)=>{e.target.style.background='var(--background)'; e.target.style.borderColor='var(--brand)';}}
                  onMouseOut={(e)=>{e.target.style.background='transparent'; e.target.style.borderColor='var(--border)';}}
                >
                  {getThemedIcon('ui', 'bar_chart', 16, theme)}
                </button>
              </>
            )}
            {/* Debug: Test emoji picker visibility */}
            {/* Development debug removed */}
            
            {/* Modern Compact Emoji Picker */}
            {showEmojiPicker && (
              <div
                data-emoji-picker="true"
                style={{
                  position: 'fixed',
                  bottom: '70px',
                  right: '20px',
                  zIndex: 9999,
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  backdropFilter: 'blur(12px)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '4px',
                  width: '200px'
                }}>
                  {[
                    '😀', '😂', '❤️', '👍', '😎',
                    '🎉', '🔥', '✨', '🙏', '💯',
                    '👏', '🤝', '💪', '🎯', '🌟',
                    '💡', '🚀', '💎', '🏆', '📚'
                  ].map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setNewMessage(prev => prev + emoji);
                        messageInputRef.current?.focus();
                        setShowEmojiPicker(false);
                      }}
                      style={{
                        fontSize: '1.5rem',
                        padding: '8px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--background-hover)';
                        e.currentTarget.style.transform = 'scale(1.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* File Attachment */}
            {!audioBlob && !attachedFile && (
              <label data-tour="chat-file-attach" style={{
                padding: '0.6rem',
                background: 'transparent',
                color: 'var(--muted)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.3rem'
              }} title={t('attach')}>
                {getThemedIcon('ui', 'attachment', 20, theme)}
                <input
                  type="file"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx,.zip,.rar"
                />
              </label>
            )}

            {/* Single primary button: Mic when empty, Send when has content */}
            <button
              data-tour="chat-voice"
              type={(newMessage.trim() || audioBlob || attachedFile) ? 'submit' : 'button'}
              onClick={() => {
                if (!(newMessage.trim() || audioBlob || attachedFile)) {
                  if (isRecording) { 
                    stopRecording(); 
                  } else { 
                    startRecording(); 
                  }
                }
              }}
              disabled={isUploading}
              className={!newMessage.trim() && !audioBlob && !attachedFile && isRecording ? 'recording-blink' : ''}
              style={{
                marginLeft: '0.5rem',
                background: isUploading ? '#6c757d' : ((newMessage.trim() || audioBlob || attachedFile) ? '#25D366' : (isRecording ? '#dc3545' : '#25D366')),
                color: (newMessage.trim() || audioBlob || attachedFile) ? '#fff' : (isRecording ? '#fff' : 'var(--muted)'),
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                position: 'relative',
                opacity: isUploading ? 0.7 : 1
              }}
              title={isUploading ? t('uploading') : ((newMessage.trim() || audioBlob || attachedFile) ? t('send') : (isRecording ? t('stop_recording') : t('record_voice')))}
            >
              {/* Recording Indicator with Waves */}
              {isRecording && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#dc3545',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)',
                  zIndex: 10
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    background: 'white',
                    borderRadius: '50%',
                    animation: 'pulse 1.4s infinite ease-in-out'
                  }}></span>
                  <span style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    background: 'white',
                    borderRadius: '50%',
                    animation: 'pulse 1.4s infinite ease-in-out 0.2s'
                  }}></span>
                  <span style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    background: 'white',
                    borderRadius: '50%',
                    animation: 'pulse 1.4s infinite ease-in-out 0.4s'
                  }}></span>
                  <span style={{ fontSize: '9px', marginLeft: '2px' }}>
                    {formatTime(recordingTime)}/{getMaxVoiceTimeDisplay(user?.role || ROLE_STRINGS.STUDENT).replace(' minutes', 'm')}
                  </span>
                </div>
              )}
              
              {isUploading ? (
                <div style={{
                  width: 18,
                  height: 18,
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (newMessage.trim() || audioBlob || attachedFile) ? (
                getThemedIcon('ui', 'send', 18, theme)
              ) : isRecording ? (
                getThemedIcon('ui', 'square', 18, theme)
              ) : (
                getThemedIcon('ui', 'mic', 18, theme)
              )}
            </button>
          </form>
        </div>
      </div>
    </div>

    {/* Reaction Menu: now rendered anchored per message (see bubble block) */}

    {/* DM Context Menu */}
    {dmContextMenu && (
      <div
        style={{
          position: 'fixed',
          top: dmContextMenu.y,
          left: dmContextMenu.x,
          background: 'var(--panel)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
          zIndex: 3000,
          minWidth: 200
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isAdmin && (
        <button
          onClick={() => clearDMMessages(dmContextMenu.roomId, 'all')}
          onMouseEnter={(e) => e.target.style.background = 'rgba(220,53,69,0.1)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
          style={{
            display: 'block',
            background: 'transparent',
            border: 'none',
            padding: '10px 14px',
            width: '100%',
            textAlign: 'start',
            cursor: 'pointer',
            color: '#dc3545',
            fontWeight: 500,
            transition: 'background 0.2s',
            borderBottom: '1px solid var(--border)'
          }}
        >
          🗑️ Clear All Messages
        </button>)}
        <button
          onClick={() => clearDMMessages(dmContextMenu.roomId, 'mine')}
          onMouseEnter={(e) => e.target.style.background = 'rgba(102,126,234,0.1)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
          style={{
            display: 'block',
            background: 'transparent',
            border: 'none',
            padding: '10px 14px',
            width: '100%',
            textAlign: 'start',
            cursor: 'pointer',
            color: 'var(--brand)',
            fontWeight: 500,
            transition: 'background 0.2s',
            borderBottom: '1px solid var(--border)'
          }}
        >
          📤 Clear My Messages
        </button>
        {isAdmin && (
        <button
          onClick={() => clearDMMessages(dmContextMenu.roomId, 'theirs')}
          onMouseEnter={(e) => e.target.style.background = 'rgba(102,126,234,0.1)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
          style={{
            display: 'block',
            background: 'transparent',
            border: 'none',
            padding: '10px 14px',
            width: '100%',
            textAlign: 'start',
            cursor: 'pointer',
            color: 'var(--brand)',
            fontWeight: 500,
            transition: 'background 0.2s'
          }}
        >
          {getThemedIcon('ui', 'download', 16, theme)} Clear Their Messages
        </button>)}
      </div>
    )}

    {/* Poll Creation Modal */}
    {showPollModal && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2200 }} onClick={()=>setShowPollModal(false)}>
        <div style={{ background:'var(--panel)', color:'var(--text)', border:'1px solid var(--border)', padding:'1.5rem', borderRadius:16, minWidth:450, maxWidth:550, width:'90%', boxShadow:'0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} onClick={(e)=>e.stopPropagation()}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
            <h3 style={{ margin:0, fontSize:'1.15rem', fontWeight:700, display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <div style={{ width:32, height:32, background:'linear-gradient(135deg, var(--brand), var(--brand2))', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize: 'var(--font-size-md)' }}>{getThemedIcon('ui', 'bar_chart', 18, theme)}</div>
              {t('create_poll')}
            </h3>
            <button onClick={()=>setShowPollModal(false)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:'1.25rem', padding:'4px 8px', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
              onMouseEnter={(e)=>{e.target.style.background='var(--background)'; e.target.style.color='var(--text)';}}
              onMouseLeave={(e)=>{e.target.style.background='transparent'; e.target.style.color='var(--muted)';}}
            >✕</button>
          </div>
          
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={{ display:'block', marginBottom:'0.4rem', fontWeight:600, fontSize:'0.85rem', color:'var(--text)', textTransform:'capitalize' }}>{t('question')}</label>
            <input
              type="text"
              autoComplete="off"
              value={pollQuestion}
              onChange={(e)=>setPollQuestion(e.target.value)}
              placeholder={t('chat_question_placeholder') || 'What would you like to know?'}
              style={{ width:'100%', padding:'0.75rem', border:'2px solid var(--border)', borderRadius:10, background:'var(--panel)', color:'var(--text)', fontSize:'0.9rem', transition:'border-color 0.2s', outline:'none' }}
              onFocus={(e)=>e.target.style.borderColor='var(--brand)'}
              onBlur={(e)=>e.target.style.borderColor='var(--border)'}
            />
          </div>
          
          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', marginBottom:'0.4rem', fontWeight:600, fontSize:'0.85rem', color:'var(--text)', textTransform:'capitalize' }}>{t('options')}</label>
            <div style={{ background:'var(--background)', padding:'0.75rem', borderRadius:10, border:'1px solid var(--border)' }}>
              {pollOptions.map((opt, idx) => (
                <div key={idx} style={{ display:'flex', gap:'0.5rem', marginBottom: idx < pollOptions.length - 1 ? '0.5rem' : 0, alignItems:'center' }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--brand)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:700, flexShrink:0 }}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <input
                    type="text"
                    autoComplete="off"
                    value={opt}
                    onChange={(e)=>{
                      const newOpts = [...pollOptions];
                      newOpts[idx] = e.target.value;
                      setPollOptions(newOpts);
                    }}
                    placeholder={t('chat.option_number', { number: idx + 1 }) || `Option ${idx + 1}`}
                    style={{ flex:1, padding:'0.5rem 0.75rem', border:'1px solid var(--border)', borderRadius:8, background:'var(--panel)', color:'var(--text)', fontSize:'0.85rem', transition:'border-color 0.2s', outline:'none' }}
                    onFocus={(e)=>e.target.style.borderColor='var(--brand)'}
                    onBlur={(e)=>e.target.style.borderColor='var(--border)'}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={()=>setPollOptions(pollOptions.filter((_,i)=>i!==idx))}
                      style={{ width:28, height:28, background:'transparent', color:'var(--muted)', border:'1px solid var(--border)', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', flexShrink:0, transition:'all 0.2s' }}
                      onMouseEnter={(e)=>{e.target.style.background='#ef4444'; e.target.style.color='white'; e.target.style.borderColor='#ef4444';}}
                      onMouseLeave={(e)=>{e.target.style.background='transparent'; e.target.style.color='var(--muted)'; e.target.style.borderColor='var(--border)';}}
                      title={t('remove') || 'Remove'}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={()=>setPollOptions([...pollOptions, ''])}
            style={{ width:'100%', padding:'0.6rem', background:'transparent', color:'var(--brand)', border:'2px dashed var(--border)', borderRadius:10, cursor:'pointer', marginBottom:'1.25rem', fontWeight:600, fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', transition:'all 0.2s' }}
            onMouseEnter={(e)=>{e.target.style.borderColor='var(--brand)'; e.target.style.background='var(--brand)10';}}
            onMouseLeave={(e)=>{e.target.style.borderColor='var(--border)'; e.target.style.background='transparent';}}
          >
            {getThemedIcon('ui', 'plus', 16, theme)}
            {t('add_option')}
          </button>
          
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
            <button 
              onClick={()=>{setShowPollModal(false); setPollQuestion(''); setPollOptions(['','']);}} 
              style={{ padding:'0.6rem 1.25rem', background:'transparent', color:'var(--muted)', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.85rem', transition:'all 0.2s' }}
              onMouseOver={(e)=>{e.target.style.background='var(--background)'; e.target.style.color='var(--text)';}}
              onMouseOut={(e)=>{e.target.style.background='transparent'; e.target.style.color='var(--muted)';}}
            >
              {t('cancel')}
            </button>
            <button
              onClick={async ()=>{
                if (!pollQuestion.trim() || pollOptions.filter(o=>o.trim()).length < 2) {
                  toast?.showError(t('please_enter_question_and_options'));
                  return;
                }
                try {
                  const pollData = {
                    type: selectedClass === 'global' ? 'global' : (selectedClass?.startsWith('dm:') ? 'dm' : 'class'),
                    classId: selectedClass?.startsWith('dm:') ? null : (selectedClass === 'global' ? null : selectedClass),
                    roomId: selectedClass?.startsWith('dm:') ? selectedClass.slice(3) : null,
                    senderId: user.uid,
                    senderName: profileName || user.displayName || user.email,
                    messageType: 'poll',
                    pollQuestion: pollQuestion.trim(),
                    pollOptions: pollOptions.filter(o=>o.trim()),
                    pollVotes: {},
                    createdAt: getChatServerTimestamp()
                  };
                  await chatService.createPollMessage(pollData);
                  setShowPollModal(false);
                  setPollQuestion('');
                  setPollOptions(['','']);
                  toast?.showSuccess(t('poll_created'));
                } catch (err) {
                  error('Failed to create poll:', err);
                  toast?.showError(t('failed_to_create_poll'));
                }
              }}
              style={{ padding:'0.6rem 1.25rem', background:'linear-gradient(135deg, var(--brand), var(--brand2))', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.85rem', boxShadow:'0 2px 4px rgba(0,0,0,0.08)', transition:'all 0.2s' }}
              onMouseEnter={(e)=>{e.target.style.transform='translateY(-1px)'; e.target.style.boxShadow='0 4px 8px rgba(0,0,0,0.12)';}}
              onMouseLeave={(e)=>{e.target.style.transform='translateY(0)'; e.target.style.boxShadow='0 2px 4px rgba(0,0,0,0.08)';}}
            >
              {t('create')}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Edit Modal */}
    {editingMsg && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2200 }} onClick={()=>setEditingMsg(null)}>
        <div style={{ background:'var(--panel)', color:'var(--text)', border:'1px solid var(--border)', padding:'1rem', borderRadius:12, minWidth:320, maxWidth:520, width:'90%' }} onClick={(e)=>e.stopPropagation()}>
          <h3 style={{ marginTop:0, marginBottom:8 }}>{t('edit')}</h3>
          <textarea rows={5} value={editingMsg.content} onChange={(e)=>setEditingMsg({ ...editingMsg, content: e.target.value })} style={{ width:'100%', background:'var(--panel)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, padding:8 }} />
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:10 }}>
            <button onClick={()=>setEditingMsg(null)} style={{ background:'transparent', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', cursor:'pointer' }}>{t('cancel')}</button>
            <button onClick={handleSaveEdit} style={{ background:'linear-gradient(135deg, #800020, #600018)', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px', cursor:'pointer' }}>{t('save')}</button>
          </div>
        </div>
      </div>
    )}

    {/* New DM Picker Drawer */}
    {showNewDMPicker && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.45)' }} onClick={() => setShowNewDMPicker(false)}>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 0,
            [lang === 'ar' ? 'left' : 'right']: 0,
            height: '100%',
            width: '100%',
            maxWidth: 480,
            background: 'var(--panel)',
            boxShadow: lang === 'ar' ? '4px 0 24px rgba(0,0,0,0.2)' : '-4px 0 24px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: lang === 'ar' ? 'slideInLeft 0.25s ease-out' : 'slideInRight 0.25s ease-out',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {getThemedIcon('ui', 'message_square', 20, theme)}
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{t('start_new_conversation')}</h3>
            </div>
            <button onClick={() => setShowNewDMPicker(false)} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)', padding: '4px 8px', borderRadius: 6 }}>✕</button>
          </div>

          {/* Role Filter Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0.75rem 1.5rem 0' }}>
            {[{ key: 'all', label: t('chat_all'), icon: null, color: null },
              { key: 'student', label: t('chat_filter_students'), icon: 'student', color: getUserRoleColor('student') },
              { key: 'instructor', label: t('chat_filter_instructors'), icon: 'instructor', color: getUserRoleColor('instructor') },
              { key: 'admin', label: t('chat_filter_admins'), icon: 'admin', color: getUserRoleColor('admin') },
              { key: 'hr', label: t('chat_filter_hr'), icon: 'hr', color: getUserRoleColor('hr') },
            ].map(chip => {
              const isActive = (chip.key === 'all' && !dmRoleFilter) || dmRoleFilter === chip.key;
              const chipColor = chip.color || '#6b7280';
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setDmRoleFilter(chip.key === 'all' ? null : chip.key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    padding: '3px 10px', borderRadius: 12,
                    border: `1px solid ${isActive ? chipColor : 'var(--border)'}`,
                    background: isActive ? `${chipColor}15` : 'transparent',
                    color: isActive ? chipColor : 'var(--text)',
                    fontSize: 'var(--font-size-xs)', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                >
                  {chip.icon && getIconWithColor('user_role', chip.icon, 12, isActive ? chipColor : '#9ca3af')}
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div style={{ padding: '0.75rem 1.25rem', flexShrink: 0 }}>
            <input
              type="text"
              autoComplete="off"
              placeholder={t('search_users')}
              value={dmUserSearch}
              onChange={(e) => setDmUserSearch(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.95rem', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.25rem 1rem' }}>
            {dmUsersLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>{t('loading_users')}</div>
            ) : availableDMUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>{t('no_users_available')}</div>
            ) : (
              availableDMUsers
                .filter(u => {
                  if (!dmUserSearch) return true;
                  const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
                  const email = (u.email || '').toLowerCase();
                  const search = dmUserSearch.toLowerCase();
                  return name.includes(search) || email.includes(search);
                })
                .filter(u => {
                  if (!dmRoleFilter) return true;
                  return resolveUserRole(u) === dmRoleFilter;
                })
                .map(u => {
                  const name = getChatUserDisplayName(u, lang);
                  const initials = name.charAt(0).toUpperCase();
                  const role = resolveUserRole(u);
                  return (
                    <div
                      key={u.id}
                      onClick={() => startDMFromPicker(u)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: 8, borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {u.profileImageUrl ? (
                        <img src={u.profileImageUrl} alt={name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--brand),var(--brand2))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                          {initials}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {role && <RoleBadge user={u} size={10} fontSize="0.7rem" style={{ borderRadius: 8, padding: '1px 5px' }} />}
                          {role === 'student' && u.enrollmentCount > 0 && (
                            <span title={t('enrolled_classes')} style={{ fontSize: '0.65rem', background: 'var(--bg)', color: 'var(--muted)', padding: '1px 5px', borderRadius: 8, fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {u.enrollmentCount} {t('classes')}
                            </span>
                          )}
                          {role === 'instructor' && u.classCount > 0 && (
                            <span title={t('teaching_classes')} style={{ fontSize: '0.65rem', background: 'var(--bg)', color: 'var(--muted)', padding: '1px 5px', borderRadius: 8, fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {u.classCount} {t('classes')}
                            </span>
                          )}
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{u.email}</div>
                      </div>
                      {getThemedIcon('ui', 'message_square', 16, theme)}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    )}

    {/* Members Side Drawer */}
    {showMembers && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }} onClick={()=>setShowMembers(false)}>
        {/* drawer */}
        <div data-tour="chat-members" onClick={(e)=>e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 420, background: 'var(--panel)', boxShadow: '-4px 0 16px rgba(0,0,0,0.15)', padding: '1rem', pointerEvents: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 12 }}>
            {!selectedClass?.startsWith('dm:') && (
              <input
                type="text"
                autoComplete="off"
                placeholder={t('chat_search_members')}
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.95rem', background: 'var(--bg)', color: 'var(--text)' }}
              />
            )}
            <button onClick={()=>setShowMembers(false)} style={{ background: 'transparent', border: 'none', fontSize: 'var(--font-size-lg)', cursor: 'pointer', color: 'var(--text)', flexShrink: 0, padding: '4px 8px' }}>✕</button>
          </div>
          {/* role filter chips - only show for class chats */}
          {!selectedClass?.startsWith('dm:') && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {(isStaffRole
                  ? [{ key: 'all', label: t('chat_all'), icon: null, color: null },
                     { key: 'student', label: t('chat_filter_students'), icon: 'student', color: getUserRoleColor('student') },
                     { key: 'instructor', label: t('chat_filter_instructors'), icon: 'instructor', color: getUserRoleColor('instructor') },
                     { key: 'admin', label: t('chat_filter_admins'), icon: 'admin', color: getUserRoleColor('admin') },
                     { key: 'hr', label: t('chat_filter_hr'), icon: 'hr', color: getUserRoleColor('hr') }]
                  : [{ key: 'all', label: t('chat_all'), icon: null, color: null },
                     { key: 'student', label: t('chat_filter_students'), icon: 'student', color: getUserRoleColor('student') },
                     { key: 'instructor', label: t('chat_filter_instructors'), icon: 'instructor', color: getUserRoleColor('instructor') }]
                ).map(chip => {
                  const isActive = (chip.key === 'all' && !studentsOnly && !roleFilter) ||
                    (chip.key === 'student' && studentsOnly) ||
                    (chip.key !== 'all' && roleFilter === chip.key);
                  const chipColor = chip.color || '#6b7280';
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => {
                        if (chip.key === 'all') {
                          setStudentsOnly(false);
                          setRoleFilter(null);
                        } else if (chip.key === 'student') {
                          setStudentsOnly(true);
                          setRoleFilter(null);
                        } else {
                          setStudentsOnly(false);
                          setRoleFilter(chip.key);
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        border: `1px solid ${isActive ? chipColor : 'var(--border)'}`,
                        background: isActive ? `${chipColor}15` : 'transparent',
                        color: isActive ? chipColor : 'var(--text)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {chip.icon && getIconWithColor('user_role', chip.icon, 12, isActive ? chipColor : '#9ca3af')}
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            {selectedClass?.startsWith('dm:') ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                <p>{t('dm_conversation_description')}</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{t('dm_private_messages')}</p>
              </div>
            ) : (
              (() => {
                try {
                  // Start with a guaranteed array - use multiple safety layers
                  let filtered = [];
                  
                  // Layer 1: Ensure classMembers is an array
                  if (Array.isArray(classMembers)) {
                    filtered = [...classMembers]; // Create a copy to avoid mutations
                  } else if (classMembers && typeof classMembers === 'object') {
                    // Layer 2: Handle object that might be array-like
                    filtered = Object.values(classMembers).filter(item => item && typeof item === 'object');
                  }
                  
                  // Layer 3: Apply search filter if needed
                  if (memberSearch && Array.isArray(filtered) && filtered.length > 0) {
                    const search = memberSearch.toLowerCase();
                    filtered = filtered.filter(m => {
                      if (!m || typeof m !== 'object') return false;
                      const displayName = (m.displayName || '').toLowerCase();
                      const email = (m.email || '').toLowerCase();
                      return displayName.includes(search) || email.includes(search);
                    });
                  }
                  
                  // Layer 4: Apply students only filter if needed
                  if (studentsOnly && Array.isArray(filtered) && filtered.length > 0) {
                    filtered = filtered.filter(m => {
                      if (!m || typeof m !== 'object') return false;
                      return m.isStudent === true;
                    });
                  }
                  
                  // Layer 4b: Apply role filter if needed
                  if (roleFilter && Array.isArray(filtered) && filtered.length > 0) {
                    filtered = filtered.filter(m => {
                      if (!m || typeof m !== 'object') return false;
                      const roles = getUserRoles(m);
                      return roles.includes(roleFilter);
                    });
                  }
                  
                  // Layer 5: Filter out the logged-in user if needed
                  if (Array.isArray(filtered) && filtered.length > 0 && user) {
                    filtered = filtered.filter(m => {
                      if (!m || typeof m !== 'object') return false;
                      const excludeByDocId = m.docId !== user.uid;
                      const excludeByEmail = m.email !== user.email;
                      return excludeByDocId && excludeByEmail;
                    });
                  }
                  
                  // Layer 6: Final absolute safety check
                  if (!Array.isArray(filtered)) {
                    console.warn('[ChatPage] filtered is not an array, using empty array', { filtered, classMembers });
                    filtered = [];
                  }
                  
                  // Layer 7: Ensure all items are valid objects
                  filtered = filtered.filter(m => m && typeof m === 'object' && m.docId);
                  
                  // Layer 8: Bulletproof map with try-catch for each item
                  return filtered.map((m, index) => {
                    try {
                      // For class members: show X if unenrolled from this specific class
                      const isDeleted = !m || m.deleted;
                      const isDisabled = m?.disabled || m?.isDisabled || m?.isActive === false;
                      const isUnenrolled = selectedClass && selectedClass !== 'global' && !selectedClass.startsWith('dm:') && 
                        m.isStudent === true && !(Array.isArray(m.enrolledClasses) && m.enrolledClasses.includes(selectedClass));
                      const showIndicator = isDeleted || isDisabled || isUnenrolled;
                      const indicatorTitle = isDeleted ? t('deleted_user') : (isDisabled ? t('disabled_user') : (isUnenrolled ? t('unenrolled_from_class') : ''));
                
                return (
                  <div key={m.docId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                      {m.profileImageUrl ? (
                        <img src={m.profileImageUrl} alt={m.displayName || m.email} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', opacity: showIndicator ? 0.5 : 1 }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: showIndicator ? 'var(--muted)' : 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, opacity: showIndicator ? 0.5 : 1 }}>
                          {(m.displayName || m.email || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      {showIndicator && (
                        <div style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#dc2626', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={indicatorTitle}>
                          <span style={{ fontSize: 8, color: 'white' }}>✕</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RoleBadge user={m} />
                        {m.displayName || m.email}
                        {m.studentNumber && (
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)', fontWeight: 'normal' }}>
                            ({m.studentNumber})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)' }}>{m.email}</div>
                    </div>
                  </div>
                  {m.docId !== user.uid && (
                    <button 
                      onClick={() => {
                        info('Member clicked for DM', { 
                          member: m,
                          hasDocId: !!m.docId,
                          hasId: !!m.id,
                          hasUid: !!m.uid,
                          email: m.email,
                          displayName: m.displayName
                        });
                        openDMWith(m);
                      }} 
                      style={{ 
                        padding: '6px 10px', 
                        borderRadius: 6, 
                        border: '1px solid var(--border)', 
                        background: 'transparent', 
                        color: 'var(--text)', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        fontSize: 'var(--font-size-md)'
                      }}
                    >
                      {getThemedIcon('ui', 'message_square', 16, theme)}
                    </button>
                  )}
                </div>
              );
            } catch (itemError) {
              console.error('[ChatPage] Error rendering member item:', { itemError, member: m, index });
              return (
                <div key={`error-${index}`} style={{ padding: '0.5rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                  {t('error_loading_member')}
                </div>
              );
            }
          });
        } catch (error) {
          console.error('[ChatPage] Error in member list rendering:', { error, classMembers, memberSearch, studentsOnly });
          return (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              {t('unable_to_load_members')}
            </div>
          );
        }
      })()
            )}
          </div>
        </div>
      </div>
    )}
    
    {/* Group Chat Modals */}
    <GroupChatModal
      isOpen={showGroupModal}
      onClose={() => setShowGroupModal(false)}
      onGroupCreated={async (newRoom) => {
        // Manually refresh rooms since subscription doesn't auto-update
        try {
          const result = await chatService.getUserRooms();
          if (result.success) {
            const rooms = [];
            result.data.forEach(r => {
              if (r.type === 'dm') {
                rooms.push({
                  id: r.id,
                  participantA: r.participantA,
                  participantB: r.participantB,
                  userA: r.userA,
                  userB: r.userB,
                  type: 'dm',
                  lastMessage: null,
                  createdAt: r.createdAt
                });
              } else if (r.type === 'group') {
                rooms.push({
                  id: r.id,
                  type: 'group',
                  name: r.name,
                  createdBy: r.createdBy,
                  participants: r.participants,
                  creator: r.creator,
                  lastMessage: null,
                  createdAt: r.createdAt
                });
              }
            });
            setDirectRooms(mergeStarData(rooms));
          }
        } catch (e) {
          error('Failed to refresh rooms after group creation:', e);
        }
        if (newRoom?.id) {
          setSelectedClass(`group:${newRoom.id}`);
        }
      }}
    />
    
    <ParticipantManagementModal
      isOpen={showParticipantModal}
      onClose={() => setShowParticipantModal(false)}
      room={(() => {
        // Find the current room from classes/directRooms
        if (selectedClass?.startsWith('group:')) {
          const groupId = parseInt(selectedClass.split(':')[1]);
          return classes.find(c => c.id === groupId && c.type === 'group') ||
                 directRooms.find(r => r.id === groupId && r.type === 'group');
        }
        return null;
      })()}
      currentUserId={user?.dbId}
      onParticipantsChanged={async () => {
        // Manually refresh rooms to get updated participant counts
        try {
          const result = await chatService.getUserRooms();
          if (result.success) {
            const rooms = [];
            result.data.forEach(r => {
              if (r.type === 'dm') {
                rooms.push({
                  id: r.id,
                  participantA: r.participantA,
                  participantB: r.participantB,
                  userA: r.userA,
                  userB: r.userB,
                  type: 'dm',
                  lastMessage: null,
                  createdAt: r.createdAt
                });
              } else if (r.type === 'group') {
                rooms.push({
                  id: r.id,
                  type: 'group',
                  name: r.name,
                  createdBy: r.createdBy,
                  participants: r.participants,
                  creator: r.creator,
                  lastMessage: null,
                  createdAt: r.createdAt
                });
              }
            });
            setDirectRooms(mergeStarData(rooms));
          }
        } catch (e) {
          error('Failed to refresh rooms after participant change:', e);
        }
      }}
    />

    <GroupInfoPanel
      isOpen={showGroupInfoPanel}
      onClose={() => setShowGroupInfoPanel(false)}
      roomId={(() => {
        if (selectedClass?.startsWith('group:')) {
          return parseInt(selectedClass.split(':')[1]);
        }
        if (selectedClass?.startsWith('dm:')) {
          return parseInt(selectedClass.split(':')[1]);
        }
        if (classInfoRoomId) {
          return classInfoRoomId;
        }
        return null;
      })()}
      roomName={(() => {
        if (selectedClass === 'global') return t('global_chat');
        if (selectedClass?.startsWith('group:')) {
          const groupId = parseInt(selectedClass.split(':')[1]);
          const grp = directRooms.find(r => r.id === groupId && r.type === 'group');
          return grp?.name || t('group_chat');
        }
        if (selectedClass?.startsWith('dm:')) {
          const dmId = parseInt(selectedClass.split(':')[1]);
          const room = directRooms.find(r => r.id === dmId);
          const otherUser = (room?.userA?.id === user?.dbId || (user?.email && room?.userA?.email === user?.email)) ? room?.userB : room?.userA;
          return otherUser ? getChatUserDisplayName(otherUser, lang) : t('direct_message');
        }
        if (classInfoRoomId) {
          return classes.find(c => c.docId === selectedClass)?.name || selectedClassName || t('chat');
        }
        return null;
      })()}
      isCreator={(() => {
        if (selectedClass?.startsWith('group:')) {
          const groupId = parseInt(selectedClass.split(':')[1]);
          const grp = directRooms.find(r => r.id === groupId && r.type === 'group');
          return grp?.createdBy === user?.dbId;
        }
        return false;
      })()}
      currentUser={user}
      roomType={(() => {
        if (selectedClass === 'global') return 'global';
        if (selectedClass?.startsWith('group:')) return 'group';
        if (selectedClass?.startsWith('dm:')) return 'dm';
        if (classInfoRoomId) return 'class';
        return null;
      })()}
      onLeaveGroup={async () => {
        if (selectedClass?.startsWith('group:')) {
          const groupId = parseInt(selectedClass.split(':')[1]);
          setSelectedClass('global');
          try {
            const result = await chatService.getUserRooms();
            if (result.success) {
              const rooms = [];
              result.data.forEach(r => {
                if (r.type === 'dm') {
                  rooms.push({ id: r.id, participantA: r.participantA, participantB: r.participantB, userA: r.userA, userB: r.userB, type: 'dm', lastMessage: r.lastMessage || null, lastMessageAt: r.lastMessageAt || null, createdAt: r.createdAt, starBy: r.starBy || [] });
                } else if (r.type === 'group') {
                  rooms.push({ id: r.id, type: 'group', name: r.name, createdBy: r.createdBy, participants: r.participants, creator: r.creator, lastMessage: r.lastMessage || null, lastMessageAt: r.lastMessageAt || null, createdAt: r.createdAt, starBy: r.starBy || [] });
                }
              });
              setDirectRooms(mergeStarData(rooms));
            }
          } catch (e) {
            error('Failed to refresh rooms after leaving group:', e);
          }
        }
      }}
      onAdminChanged={async () => {
        try {
          const result = await chatService.getUserRooms();
          if (result.success) {
            const rooms = [];
            result.data.forEach(r => {
              if (r.type === 'dm') {
                rooms.push({ id: r.id, participantA: r.participantA, participantB: r.participantB, userA: r.userA, userB: r.userB, type: 'dm', lastMessage: r.lastMessage || null, lastMessageAt: r.lastMessageAt || null, createdAt: r.createdAt, starBy: r.starBy || [] });
              } else if (r.type === 'group') {
                rooms.push({ id: r.id, type: 'group', name: r.name, createdBy: r.createdBy, participants: r.participants, creator: r.creator, lastMessage: r.lastMessage || null, lastMessageAt: r.lastMessageAt || null, createdAt: r.createdAt, starBy: r.starBy || [] });
              }
            });
            setDirectRooms(mergeStarData(rooms));
          }
        } catch (e) {
          error('Failed to refresh rooms after admin change:', e);
        }
      }}
    />
    </>
  );
});

export default ChatPage;
