import React, { useState, useEffect, useRef, useMemo, memo, useLayoutEffect, useCallback } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Navigate, useLocation } from 'react-router-dom';
import { ROLE_STRINGS } from '@utils/userUtils';
import { getThemedIcon, getColoredIcon, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
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

const ChatPage = memo(() => {
  const { user, isAdmin, isSuperAdmin, isHR, isInstructor, loading: authLoading } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();

  // ── Guided Tour ──────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const tourSeenKey = `chatTourSeen_${lang}`;
  const tourSteps = useMemo(() => [
    { target: 'body', content: t('tour.chat_message_area'), disableBeacon: true, placement: 'center' },
    { target: '[data-tour="chat-sidebar"]', content: t('tour.chat_sidebar'), disableBeacon: true, placement: 'right' },
    { target: '[data-tour="chat-room-list"]', content: t('tour.chat_room_list'), disableBeacon: true, placement: 'right' },
    { target: '[data-tour="chat-search"]', content: t('tour.chat_search'), disableBeacon: true, placement: 'right' },
    { target: '[data-tour="chat-members"]', content: t('tour.chat_members'), disableBeacon: true, placement: 'left' },
    { target: '[data-tour="chat-input"]', content: t('tour.chat_input'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="chat-file-attach"]', content: t('tour.chat_file_attach'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="chat-voice"]', content: t('tour.chat_voice'), disableBeacon: true, placement: 'top' },
  ], [lang, t]);
  useEffect(() => {
    const start = () => setRunTour(true);
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => { window.removeEventListener('app:joyride', start); window.removeEventListener('app:help', start); };
  }, []);
  useEffect(() => { try { if (!localStorage.getItem(tourSeenKey)) setRunTour(true); } catch {} }, [tourSeenKey]);
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
  const [classMembers, setClassMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [directRooms, setDirectRooms] = useState([]);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [studentsOnly, setStudentsOnly] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [globalChatSearch, setGlobalChatSearch] = useState('');
  const [chatReads, setChatReads] = useState({}); // { 'class:<id>': Timestamp, 'dm:<id>': Timestamp, 'global': Timestamp }
  const [unreadCounts, setUnreadCounts] = useState({}); // { 'class:<id>': number, 'dm:<id>': number, 'global': number }
  const [showDeleteDMConfirm, setShowDeleteDMConfirm] = useState(false);
  const [showNewDMPicker, setShowNewDMPicker] = useState(false);
  const [dmUserSearch, setDmUserSearch] = useState('');
  const [availableDMUsers, setAvailableDMUsers] = useState([]);
  const [dmUsersLoading, setDmUsersLoading] = useState(false);

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
    setClassMembers
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
  
  // Handle class change
  const handleClassChange = useCallback((classId) => {
    setUserHasInteracted(true);
    setSelectedClass(classId);
  }, [setSelectedClass, setUserHasInteracted]);

  // Open New DM picker - load available users
  const openNewDMPicker = useCallback(async () => {
    setShowNewDMPicker(true);
    setDmUserSearch('');
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

  const loadMessages = useCallback(() => {
    let chatType, chatId;
    
    if (selectedClass === 'global') {
      chatType = 'global';
      chatId = 'global';
    } else if (selectedClass?.startsWith('dm:')) {
      chatType = 'dm';
      chatId = selectedClass.slice(3);
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
  useEffect(() => {
    if (selectedClass && user && selectedClass !== 'global' && !selectedClass.startsWith('dm:')) {
      // Prevent loading the same class multiple times
      if (loadingClassMembersRef.current.has(selectedClass)) {
        info('Skipping loadClassMembers - already loaded', { selectedClass });
        return;
      }
      loadingClassMembersRef.current.add(selectedClass);
      loadClassMembers(selectedClass);
    }
  }, [selectedClass, user?.uid]); // Use user.uid instead of user object

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
          if (!userHasInteracted && (!selectedClass || selectedClass === 'global')) {
            if (all.length > 0) {
              info('Auto-selecting first class', { 
                reason: 'student_auto_select',
                currentSelectedClass: selectedClass,
                firstClassId: all[0].docId,
                firstClassName: all[0].name,
                userHasInteracted
              });
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
      setDirectRooms(rooms);
    });
    unsubs.push(unsub);
    
    return () => unsubs.forEach(u => u());
  }, [user, isAdmin, isSuperAdmin, isHR, isInstructor, authLoading, selectedClass]); // Remove loadClassMembers from dependencies

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
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const msgId = params.get('msgId');
    const dest = params.get('dest');

    if (!msgId || !dest) return;

    // Ensure destination is selected
    if (dest !== selectedClass) {
      setSelectedClass(dest);
      return;
    }

    // Only highlight once per msgId per mount (don't retrigger on new messages)
    if (hasHighlightedRef.current === msgId) return;

    // Try repeatedly until the message DOM exists
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(`msg-${msgId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMsgId(msgId);
        setTimeout(() => setHighlightedMsgId(null), 3000);
        hasHighlightedRef.current = msgId; // Track which msgId we highlighted
        // Keep msgId in URL (don't remove it)
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

  const loadClasses = async () => {
    setLoading(true);
    try {
      const [classesResult, enrollmentsResult] = await Promise.all([
        getClasses(),
        getEnrollments()
      ]);

      if (!classesResult.success) {
        error('Failed to load classes:', classesResult.error);
        const errStr = typeof classesResult.error === 'string' ? classesResult.error : (classesResult.error?.message || 'Unknown error');
        toast?.showError(`Failed to load classes: ${errStr}`);
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
          if (!dest && !userHasInteracted && (!selectedClass || selectedClass === 'global') && mineClasses.length > 0) {
            info('Auto-selecting first class (location check)', { 
              reason: 'location_dest_check',
              currentSelectedClass: selectedClass,
              firstClassId: mineClasses[0].docId,
              firstClassName: mineClasses[0].name,
              hasDest: !!dest,
              userHasInteracted
            });
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
              <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:700 }}>{t('message_info') || 'Message Info'}</h3>
              <div style={{ fontSize:'0.9rem', color:'var(--muted)', marginTop:4 }}>
                {(() => { const seen = receiptsFor.list.filter(r=>!!r.readAt).length; return `Seen by ${seen} of ${receiptsFor.total}`; })()}
              </div>
            </div>
            <div style={{ maxHeight:'50vh', overflowY:'auto', padding:'0.75rem 0' }}>
              {(receiptsFor.list || []).map(r => {
                const hasRead = !!r.readAt;
                return (
                  <div key={r.uid} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 1.25rem', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                      <span style={{ fontSize:'1.1rem', fontWeight:700, color: hasRead ? '#3aa0ff' : '#999' }}>
                        {hasRead ? '✓✓' : '✓'}
                      </span>
                      <span style={{ fontWeight:500 }}>{r.name}</span>
                    </div>
                    <div style={{ fontSize:'0.85rem', color:'var(--muted)', textAlign:'right' }}>
                      {r.readAt ? (
                        <>
                          <div>{r.readAt.toLocaleDateString?.('en-GB') || ''}</div>
                          <div>{r.readAt.toLocaleTimeString?.('en-GB', {hour:'2-digit',minute:'2-digit'}) || ''}</div>
                        </>
                      ) : (
                        <div style={{ fontStyle:'italic' }}>Not seen yet</div>
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

        {/* Class List */}
        <div data-tour="chat-room-list" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
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
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{t('all_users') || 'All users'}</div>
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
                background: selectedClass === cls.docId ? 'rgba(0,0,0,0.06)' : 'var(--panel)',
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
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', padding: '0 6px'
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
                      title={archivedClasses[cls.docId] ? (t('unarchive') || 'Unarchive') : (t('archive') || 'Archive')}
                      style={{ background:'transparent', border:'none', cursor:'pointer', color:'#888' }}
                    >{archivedClasses[cls.docId] ? getThemedIcon('ui', 'upload', 16, theme) : getThemedIcon('ui', 'download', 16, theme)}</button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    <div style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{`${cls.term} - ${cls.code}`}</div>
                    {cls.lastMessage && (
                      <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginTop:2 }}>
                        <span style={{ color:'#666' }}>{cls.lastMessage}</span>
                        <span style={{ color:'#888', fontSize:'0.8rem' }}>{cls.lastMessageAt ? formatDateTime(cls.lastMessageAt) : ''}</span>
                      </div>
                    )}
                  </div>
                  {(() => {
                    const instructor = cls.instructorId
                      ? allUsers.find(u => u.docId === cls.instructorId)
                      : allUsers.find(u => u.email === cls.ownerEmail);
                    if (!instructor) return null;
                    return (
                      <div style={{ fontSize: '0.85rem', color: '#444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {getThemedIcon('ui', 'graduation_cap', 14, theme)}
                        <strong>{instructor.displayName || instructor.email}</strong>
                        {instructor.studentNumber && (
                          <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '0.25rem', fontWeight: 'normal' }}>
                            ({instructor.studentNumber})
                          </span>
                        )}
                        {instructor.docId !== user.uid && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openDMWith(instructor); }}
                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}
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

          {/* Direct Messages */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.9rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '0.85rem' }}>Direct Messages</span>
            {isStaffRole && (
              <button
                onClick={openNewDMPicker}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--brand)', fontSize: '1.1rem', padding: '2px 6px', borderRadius: 4 }}
                title="Start new conversation"
              >
                +
              </button>
            )}
          </div>
          {isStaffRole && (
            <input
              type="text"
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
            // hide archived unless showArchived is on
            filtered = filtered.filter(r => showArchived || !archivedRooms[r.id]);
            // favorites only filter
            if (showFavoritesOnly) {
              filtered = filtered.filter(r => (r.starBy || []).includes(user.uid));
            }
            if (dmSearch && isStaffRole) {
              const search = dmSearch.toLowerCase();
              filtered = (Array.isArray(safeDirectRooms) ? safeDirectRooms : []).filter(room => {
                const otherUser = room.userA?.id === user?.dbId ? room.userB : room.userA;
                const name = otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email || '' : '';
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
            const otherUser = room.userA?.id === user.dbId ? room.userB : room.userA;
            const otherId = otherUser?.id;
            const label = otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email || 'Conversation' : 'Conversation';
            const initial = (label || 'D')[0]?.toUpperCase();
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
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: showIndicator ? '#999' : 'linear-gradient(135deg,var(--brand),var(--brand2))', color: 'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14, fontWeight: 700, opacity: showIndicator ? 0.5 : 1 }}>{initial}</div>
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
                      {(() => { const c = unreadCounts[`dm:${room.id}`]||0; if (c>0) { return (<span style={{background:'var(--brand)',color:'white',borderRadius:'50%',minWidth:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:'bold',padding:'0 5px'}}>{c>99?'99+':c}</span>);} return null; })()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display:'flex', justifyContent:'space-between', gap: 8 }}>
                      <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{room.lastMessage || ''}</span>
                      <span style={{ color:'#888', marginLeft: 8 }}>
                        {lastTime ? formatDateTime(lastTime) : ''}
                      </span>
                    </div>
                    {/* Operations row (icons) */}
                    <div style={{ display:'flex', gap:8, marginTop:6 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(room); }}
                        title={(room.starBy || []).includes(user.uid) ? (t('unfavorite') || 'Unfavorite') : (t('favorite') || 'Favorite')}
                        style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:6, padding:'2px 6px', cursor:'pointer', color:'#666', fontSize:'0.9rem', lineHeight:1 }}
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
                        title={archivedRooms[room.id] ? (t('unarchive') || 'Unarchive') : (t('archive') || 'Archive')}
                        style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:6, padding:'2px 6px', cursor:'pointer', color:'#666', fontSize:'0.9rem', lineHeight:1 }}
                      >{archivedRooms[room.id] ? getThemedIcon('ui', 'upload', 14, theme) : getThemedIcon('ui', 'download', 14, theme)}</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Sidebar footer: archived + favorites toggle */}
        <div style={{ padding:'0.5rem 0.9rem', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input id="toggle-archived" type="checkbox" checked={showArchived} onChange={(e)=>setShowArchived(e.target.checked)} />
            <label htmlFor="toggle-archived" style={{ fontSize:'0.85rem', color:'#666', cursor:'pointer' }}>{t('show_archived') || 'Show archived'}</label>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input id="toggle-favorites" type="checkbox" checked={showFavoritesOnly} onChange={(e)=>setShowFavoritesOnly(e.target.checked)} />
            <label htmlFor="toggle-favorites" style={{ fontSize:'0.85rem', color:'#666', cursor:'pointer' }}>{t('favorites_only') || 'Favorites only'}</label>
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
          title={isSidebarCollapsed ? (t('expand_sidebar') || 'Expand sidebar') : (t('collapse_sidebar') || 'Collapse sidebar')}
        >
          {getThemedIcon('ui', isSidebarCollapsed ? 'chevron_right' : 'chevron_left', 14, theme)}
        </button>

        {/* Drag handle (only show when not collapsed) */}
        {!isSidebarCollapsed && (
          <div
            onMouseDown={onDragStart}
            style={{ position:'absolute', right: -3, top:0, bottom:0, width:6, cursor:'col-resize' }}
            aria-label={t('resize_sidebar') || 'Resize sidebar'}
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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Title */}
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {selectedClass === 'global' ? t('global_chat') :
                 (selectedClass?.startsWith('dm:')
                   ? (()=>{ 
                      const room = directRooms.find(r=>`dm:${r.id}`===selectedClass); 
                      const otherUser = room?.userA?.id === user?.dbId ? room?.userB : room?.userA;
                      return otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email || 'Direct Message' : 'Direct Message';
                    })()
                   : (classes.find(c => c.docId === selectedClass)?.name || selectedClassName || 'Chat')
                 )}
              </h3>
              {/* Display name for DM conversations */}
              {selectedClass?.startsWith('dm:') && (()=>{ 
                const room = directRooms.find(r=>`dm:${r.id}`===selectedClass); 
                const otherUser = room?.userA?.id === user?.dbId ? room?.userB : room?.userA;
                const displayName = otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() : null;
                const email = otherUser?.email;
                if (displayName) {
                  return (
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem', fontWeight: 500 }}>
                      {displayName}
                      {email && email !== displayName && (
                        <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '0.25rem' }}>
                          ({email})
                        </span>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            
            {/* Class Badge */}
            <span style={{
              fontSize: '0.75rem',
              background: selectedClass === 'global' ? '#e3f2fd' : (selectedClass?.startsWith('dm:') ? '#fff3e0' : '#e8f5e9'),
              color: selectedClass === 'global' ? '#1976d2' : (selectedClass?.startsWith('dm:') ? '#ef6c00' : '#2e7d32'),
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 600
            }}>
              {selectedClass === 'global' ? 'Global' : (selectedClass?.startsWith('dm:') ? 'DM' : 'Class')}
            </span>
            
            {/* Messages Count */}
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              {messages.length} {t('messages')}
            </span>
            
            {/* DM Name (if any) - shown for DM conversations */}
            {selectedClass?.startsWith('dm:') && (()=>{ 
              const room = directRooms.find(r=>`dm:${r.id}`===selectedClass); 
              const otherUser = room?.userA?.id === user?.dbId ? room?.userB : room?.userA;
              return otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email : null;
            })() && (
              <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 500 }}>
                {(()=>{ 
                  const room = directRooms.find(r=>`dm:${r.id}`===selectedClass); 
                  const otherUser = room?.userA?.id === user?.dbId ? room?.userB : room?.userA;
                  return otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email : '';
                })()}
              </span>
            )}
          </div>
          {/* Search Button */}
          <div>
            <button
              data-tour="chat-search"
              type="button"
              onClick={() => { setShowSearch(!showSearch); if (!showSearch) setTimeout(() => document.getElementById('msg-search')?.focus(), 100); }}
              title={t('search_messages') || 'Search messages'}
              style={{ 
                background:'transparent', 
                border:'1px solid var(--border)',
                borderRadius: 8,
                cursor:'pointer', 
                fontSize:'1rem', 
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

        {/* Members button - moved to separate row */}
        {classMembers.length > 0 && !selectedClass?.startsWith('dm:') && (
          <div style={{ padding: '0.5rem 1.5rem', background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
            <div onClick={() => setShowMembers(true)} style={{ fontSize: '0.9rem', color: '#666', cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {getThemedIcon('ui', 'users', 16, theme)} {classMembers.length} {t('chat_members')}
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollContainerRef} style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.9rem',
          background: 'var(--bg)'
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
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#999'
                }}>
                  <p style={{ fontSize: '3rem', margin: 0 }}>{getThemedIcon('ui', 'message_square', 42, theme)}</p>
                  <p style={{ color: 'var(--muted)' }}>{t('no_messages')}</p>
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
                if (item.dateStr === today) label = 'Today';
                else if (item.dateStr === yesterday) label = 'Yesterday';
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
                    marginBottom: '1rem',
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
                    paddingRight: (isOwnMessage || isAdmin) ? '2.5rem' : '0.75rem',
                    paddingBottom: '1.5rem',
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
                        {msg.senderName || senderUser?.displayName || 'Unknown'}
                        {(() => {
                          if (!senderUser) return null;
                          const roles = getUserRoles(senderUser);
                          const primaryRole = roles.find(r => ['super_admin', 'superadmin', 'admin', 'instructor', 'hr'].includes(r));
                          if (!primaryRole) return null;
                          const roleIcon = getUserRoleIcon(primaryRole);
                          const roleColor = getUserRoleColor(primaryRole);
                          const roleLabel = { super_admin: 'Super Admin', superadmin: 'Super Admin', admin: 'Admin', instructor: 'Instructor', hr: 'HR' }[primaryRole] || primaryRole;
                          return (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.15rem',
                              fontSize: '0.7rem',
                              color: roleColor,
                              background: `${roleColor}15`,
                              borderRadius: '4px',
                              padding: '0.1rem 0.3rem',
                              fontWeight: '500',
                              marginLeft: '0.25rem'
                            }} title={roleLabel}>
                              {roleIcon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{React.cloneElement(roleIcon, { size: 12 })}</span>}
                              {roleLabel}
                            </span>
                          );
                        })()}
                        {senderUser?.studentNumber && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '0.25rem', fontWeight: 'normal' }}>
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
                          }} title={senderUser?.deleted ? (t('deleted_user') || 'Deleted User') : (t('disabled_user') || 'Disabled User')}>✕</span>
                        )}
                      </div>
                    )}

                    {/* Message Content */}
                    {msg.messageType === 'voice' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <audio
                          controls
                          src={msg.voiceUrl}
                          style={{ width: '200px', height: '30px' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                          {formatTime(msg.duration || 0)}
                        </span>
                      </div>
                    ) : msg.messageType === 'file' ? (
                      (() => {
                        const fileName = msg.fileName || 'Attachment';
                        const fileType = fileName.split('.').pop()?.toLowerCase() || '';
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType) || msg.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)/i);
                        const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(fileType) || msg.fileUrl?.match(/\.(mp4|webm|ogg|mov)/i);
                        
                        if (isImage) {
                          return (
                            <div style={{ maxWidth: '300px' }}>
                              <img
                                src={msg.fileUrl}
                                alt={fileName}
                                style={{ width: '100%', borderRadius: 8, cursor: 'pointer' }}
                                onClick={() => window.open(msg.fileUrl, '_blank')}
                              />
                              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
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
                                <source src={msg.fileUrl} type={`video/${fileType}`} />
                                {t('browser_no_video_support') || 'Your browser doesn\'t support video playback.'}
                              </video>
                              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                                {fileName} • {(msg.fileSize ? Math.ceil(msg.fileSize/1024) : 0)} KB
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {getThemedIcon('ui', 'paperclip', 16, theme)}
                              <a
                                href={msg.fileUrl}
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
                                  await chatService.votePoll(msg.id, user.uid, idx);
                                } catch (err) {
                                  error('Poll vote error:', err);
                                  toast?.showError('Failed to vote');
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
                            : (msg.pollOptions || []).reduce((sum, o) => sum + (o?.votes?.length || 0), 0))} {t('votes') || 'votes'}
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

                    {/* Timestamp + receipts */}
                    <div style={{
                      fontSize: '0.7rem',
                      marginTop: '0.25rem',
                      opacity: 0.7,
                      color: getUserThemeColor()
                    }}>
                      {msg.createdAt?.toDate()?.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
                        const style = { 
                          marginLeft: 8, 
                          fontSize: '1.1rem',
                          fontWeight: 700, 
                          color: allRead ? getUserThemeColor() : (anyRead ? `${getUserThemeColor()}99` : `${getUserThemeColor()}66`), 
                          cursor: 'pointer',
                          transition: 'color 0.2s'
                        };
                        const tooltip = `Seen by ${readCount} of ${recips.length}`;
                        return (
                          <span
                            style={style}
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
                          const getReactionIcon = (name, size, theme, iconColor) => {
                            switch(name) {
                              case 'ThumbsUp':
                                return getColoredIcon('ui', 'thumbs_up', size, iconColor, theme);
                              case 'Heart':
                                return getColoredIcon('ui', 'heart', size, iconColor, theme);
                              case 'Smile':
                                return getColoredIcon('ui', 'smile', size, iconColor, theme);
                              case 'Surprise':
                                return getColoredIcon('ui', 'help_circle', size, iconColor, theme);
                              case 'Frown':
                                return getColoredIcon('ui', 'x_circle', size, iconColor, theme);
                              case 'Pray':
                                return getColoredIcon('ui', 'star', size, iconColor, theme);
                              default:
                                return getColoredIcon('ui', 'smile', size, iconColor, theme);
                            }
                          };
                          return getReactionIcon(reaction, 14, theme, color);
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
                          left: isOwnMessage? -22 : 'auto', 
                          right: isOwnMessage? 'auto' : -22, 
                          top: '50%', 
                          transform:'translateY(-50%)', 
                          display:'flex', 
                          flexDirection:'row', 
                          gap:6,
                          padding: '4px',
                          background: 'var(--panel)',
                          border: '1px solid var(--border)',
                          borderRadius: 16,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)'
                        }}>
                          {topList.map(([reaction, count]) => {
                            const active = msg.reactions[user.uid] === reaction;
                            const reactionColor = getReactionColor(reaction);
                            return (
                              <button key={reaction}
                                onClick={async ()=>{
                                  try {
                                    if (active) {
                                      await chatService.removeReaction(msg.id, user.uid);
                                    } else {
                                      await chatService.addReaction(msg.id, user.uid, reaction);
                                    }
                                  } catch {}
                                }}
                                title={`${count} ${count === 1 ? 'reaction' : 'reactions'}`}
                                style={{ 
                                  background: active ? `${reactionColor}20` : 'transparent',
                                  border: active ? `1px solid ${reactionColor}` : '1px solid var(--border)',
                                  borderRadius:12, 
                                  padding:'4px 8px', 
                                  fontSize:'0.85rem', 
                                  cursor:'pointer', 
                                  boxShadow:'0 2px 4px rgba(0,0,0,0.08)', 
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
                                  fontSize: '0.75rem', 
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
                      onClick={(e)=>{ 
                        e.stopPropagation(); 
                        const rect = e.currentTarget.getBoundingClientRect();
                        setReactionMenu({ msgId: msg.id, x: rect.left, y: rect.bottom + 4 }); 
                      }}
                      title={t('react') || 'React'}
                      style={{ 
                        position:'absolute', 
                        bottom: -12, 
                        [isOwnMessage?'right':'left']: -16, 
                        background:'linear-gradient(135deg, #ffffff, #f8f9fa)', 
                        border:'2px solid #e9ecef', 
                        borderRadius:'50%', 
                        width:32, 
                        height:32, 
                        display:'flex', 
                        alignItems:'center', 
                        justifyContent:'center', 
                        cursor:'pointer', 
                        boxShadow:'0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)', 
                        transition:'all 0.2s ease',
                        fontSize:'1.2rem',
                        fontFamily:'"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "EmojiSymbols", sans-serif'
                      }}
                      onMouseEnter={(e)=>e.currentTarget.style.transform='scale(1.05)'}
                      onMouseLeave={(e)=>e.currentTarget.style.transform='scale(1)'}
                    >
                      <span aria-hidden="true" style={{ display:'inline-block', transform:'translateY(1px)' }}>{getThemedIcon('ui', 'smile', 16, theme)}</span>
                    </button>

                    {/* Anchored Reaction Menu (sticky to this message) */}
                    {reactionMenu?.msgId === msg.id && (
                      <div
                        className="pop-in"
                        ref={reactionMenuRef}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          [isOwnMessage ? 'right' : 'left']: 'calc(100% + 8px)',
                          background: 'var(--panel)',
                          border: '1px solid var(--border)',
                          borderRadius: 16,
                          padding: '0.4rem 0.6rem',
                          boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
                          zIndex: 50,
                          display: 'flex',
                          gap: '0.35rem'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {['ThumbsUp','Heart','Smile','Surprise','Frown','Pray'].map((reactionName, index) => {
                          const getReactionIcon = (name, size, theme) => {
                            switch(name) {
                              case 'ThumbsUp':
                                return getThemedIcon('ui', 'thumbs_up', size, theme);
                              case 'Heart':
                                return getThemedIcon('ui', 'heart', size, theme);
                              case 'Smile':
                                return getThemedIcon('ui', 'smile', size, theme);
                              case 'Surprise':
                                return getThemedIcon('ui', 'help_circle', size, theme);
                              case 'Frown':
                                return getThemedIcon('ui', 'x_circle', size, theme);
                              case 'Pray':
                                return getThemedIcon('ui', 'star', size, theme);
                              default:
                                return getThemedIcon('ui', 'smile', size, theme);
                            }
                          };
                          return (
                            <button
                            key={reactionName}
                            onClick={async () => {
                              try {
                                await chatService.addReaction(reactionMenu.msgId, user.uid, reactionName);
                                setReactionMenu(null);
                              } catch {}
                            }}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--border)',
                              fontSize: '1rem',
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
                            {getReactionIcon(reactionName, 18, theme)}
                          </button>
                        );
                        })}
                      </div>
                    )}

                    {/* Three-dots inline menu */}
                    {(isOwnMessage || isAdmin) && (
                      <button
                        onMouseDown={(e)=>e.stopPropagation()}
                        onClick={(e)=>{ e.stopPropagation(); setMenuOpenId(menuOpenId===msg.id?null:msg.id); }}
                        title={t('more') || 'More'}
                        style={{ position:'absolute', top:4, right:4, background:'transparent', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:'1rem', padding:'2px 4px', lineHeight:1 }}
                      >⋮</button>
                    )}
                    {menuOpenId===msg.id && (
                      <div
                        style={{ position:'absolute', top:26, right:6, background:'var(--panel)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, boxShadow:'0 6px 16px rgba(0,0,0,0.2)', zIndex:5 }}
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
                          {t('info')||'Info'}
                        </button>
                        <button
                          onClick={()=>{
                            const shareUrl = `${window.location.origin}/chat?dest=${selectedClass}&msgId=${msg.id}`;
                            navigator.clipboard.writeText(shareUrl).then(()=>{
                              toast?.showSuccess('Message link copied!');
                              setMenuOpenId(null);
                            }).catch(()=>{
                              toast?.showError('Failed to copy link');
                            });
                          }}
                          onMouseEnter={(e)=>e.target.style.background='rgba(102,126,234,0.1)'}
                          onMouseLeave={(e)=>e.target.style.background='transparent'}
                          style={{ display:'flex', alignItems:'center', gap:'8px', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color:'var(--brand)', transition:'background 0.2s', borderBottom:'1px solid var(--border)' }}
                        >
                          {getThemedIcon('ui', 'share', 14, theme)}
                          {t('share')||'Share'}
                        </button>
                        <button
                          onClick={()=>{
                            // Copy message content for forwarding
                            const content = msg.content || msg.pollQuestion || msg.fileName || 'Message';
                            navigator.clipboard.writeText(content).then(()=>{
                              toast?.showSuccess('Message copied! Paste to forward');
                              setMenuOpenId(null);
                            }).catch(()=>{
                              toast?.showError('Failed to copy');
                            });
                          }}
                          onMouseEnter={(e)=>e.target.style.background='rgba(102,126,234,0.1)'}
                          onMouseLeave={(e)=>e.target.style.background='transparent'}
                          style={{ display:'flex', alignItems:'center', gap:'8px', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color:'var(--brand)', transition:'background 0.2s', borderBottom:'1px solid var(--border)' }}
                        >
                          {getThemedIcon('ui', 'copy', 14, theme)}
                          {t('copy')||'Copy'}
                        </button>
                        {(isOwnMessage || isAdmin) && (
                          <button
                            onClick={()=>{ setMenuOpenId(null); handleDeleteMessage(msg); }}
                            onMouseEnter={(e)=>e.target.style.background='rgba(220,53,69,0.1)'}
                            onMouseLeave={(e)=>e.target.style.background='transparent'}
                            style={{ display:'flex', alignItems:'center', gap:'8px', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color:'#dc3545', transition:'background 0.2s' }}
                          >
                            {getThemedIcon('ui', 'trash2', 14, theme)}
                            {t('delete')||'Delete'}
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
            style={{ position:'fixed', right: 24, bottom: 110, background:'#fff', border:'1px solid var(--border)', borderRadius: 20, padding:'8px 10px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', cursor:'pointer', zIndex: 20 }}
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
              background: '#f8f9fa',
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
                    alt={t('preview') || 'Preview'} 
                    style={{
                      width: 40,
                      height: 40,
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
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
                  fontSize: '0.75rem'
                }}
              >
                ✕ Remove
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
                <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                  Voice Message Ready
                </span>
                <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', background: 'rgba(255,255,255,0.15)', padding: '1px 4px', borderRadius: '2px' }}>
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
                Cancel
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
                  <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                    Recording
                  </span>
                  <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', background: 'rgba(255,255,255,0.15)', padding: '1px 4px', borderRadius: '2px' }}>
                    {formatTime(recordingTime)} / {getMaxVoiceTimeDisplay(user?.role || ROLE_STRINGS.STUDENT)}
                  </span>
                </div>
              </div>
            ) : (
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('chat_type_a_message')}
                disabled={isUploading}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            )}
            
            {/* Emoji Picker - Always Visible */}
            <button
              type="button"
              data-emoji-button="true"
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
              title={t('emoji') || 'Emoji'}
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
                  title={t('create_poll') || 'Create Poll'}
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
              }} title={t('attach') || 'Attach'}>
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
                color: (newMessage.trim() || audioBlob || attachedFile) ? '#fff' : (isRecording ? '#fff' : '#666'),
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
              title={isUploading ? 'Uploading...' : ((newMessage.trim() || audioBlob || attachedFile) ? (t('send')||'Send') : (isRecording ? (t('stop_recording')||'Stop Recording') : (t('record_voice')||'Record Voice')))}
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
        <div style={{ background:'var(--panel)', color:'var(--text)', border:'1px solid var(--border)', padding:'2rem', borderRadius:16, minWidth:450, maxWidth:550, width:'90%', boxShadow:'0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} onClick={(e)=>e.stopPropagation()}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
            <h3 style={{ margin:0, fontSize:'1.25rem', fontWeight:700, display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <div style={{ width:32, height:32, background:'linear-gradient(135deg, var(--brand), var(--brand2))', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1rem' }}>{getThemedIcon('ui', 'bar_chart', 18, theme)}</div>
              {t('create_poll') || 'Create Poll'}
            </h3>
            <button onClick={()=>setShowPollModal(false)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:'1.5rem', padding:0, width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          </div>
          
          <div style={{ marginBottom:'1.5rem' }}>
            <label style={{ display:'block', marginBottom:'0.5rem', fontWeight:600, fontSize:'0.9rem', color:'var(--text)' }}>{t('question') || 'Question'}</label>
            <input
              type="text"
              value={pollQuestion}
              onChange={(e)=>setPollQuestion(e.target.value)}
              placeholder={t('chat.question_placeholder', 'What would you like to know?')}
              style={{ width:'100%', padding:'0.875rem', border:'2px solid var(--border)', borderRadius:12, marginBottom:'0', background:'var(--panel)', color:'var(--text)', fontSize:'0.95rem', transition:'border-color 0.2s', outline:'none' }}
              onFocus={(e)=>e.target.style.borderColor='var(--brand)'}
              onBlur={(e)=>e.target.style.borderColor='var(--border)'}
            />
          </div>
          
          <div style={{ marginBottom:'1.5rem' }}>
            <label style={{ display:'block', marginBottom:'0.5rem', fontWeight:600, fontSize:'0.9rem', color:'var(--text)' }}>{t('options') || 'Options'}</label>
            <div style={{ background:'var(--background)', padding:'1rem', borderRadius:12, border:'1px solid var(--border)' }}>
              {pollOptions.map((opt, idx) => (
                <div key={idx} style={{ display:'flex', gap:'0.75rem', marginBottom:'0.75rem', alignItems:'center' }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--brand)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:600, flexShrink:0 }}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e)=>{
                      const newOpts = [...pollOptions];
                      newOpts[idx] = e.target.value;
                      setPollOptions(newOpts);
                    }}
                    placeholder={t('chat.option_number', { number: idx + 1 }) || `Option ${idx + 1}`}
                    style={{ flex:1, padding:'0.625rem 0.875rem', border:'1px solid var(--border)', borderRadius:8, background:'var(--panel)', color:'var(--text)', fontSize:'0.9rem' }}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={()=>setPollOptions(pollOptions.filter((_,i)=>i!==idx))}
                      style={{ width:32, height:32, background:'var(--danger)', color:'white', border:'none', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={()=>setPollOptions([...pollOptions, ''])}
            style={{ width:'100%', padding:'0.75rem', background:'transparent', color:'var(--brand)', border:'2px dashed var(--brand)', borderRadius:12, cursor:'pointer', marginBottom:'1.5rem', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', transition:'all 0.2s' }}
            onMouseOver={(e)=>{e.target.style.background='var(--brand)'; e.target.style.color='white';}}
            onMouseOut={(e)=>{e.target.style.background='transparent'; e.target.style.color='var(--brand)';}}
          >
            {getThemedIcon('ui', 'plus', 18, theme)}
            {t('add_option') || 'Add Option'}
          </button>
          
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem' }}>
            <button 
              onClick={()=>{setShowPollModal(false); setPollQuestion(''); setPollOptions(['','']);}} 
              style={{ padding:'0.75rem 1.5rem', background:'transparent', color:'var(--muted)', border:'1px solid var(--border)', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:'0.9rem', transition:'all 0.2s' }}
              onMouseOver={(e)=>{e.target.style.background='var(--background)';}}
              onMouseOut={(e)=>{e.target.style.background='transparent';}}
            >
              {t('cancel')||'Cancel'}
            </button>
            <button
              onClick={async ()=>{
                if (!pollQuestion.trim() || pollOptions.filter(o=>o.trim()).length < 2) {
                  toast?.showError('Please enter a question and at least 2 options');
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
                  toast?.showSuccess('Poll created!');
                } catch (err) {
                  error('Failed to create poll:', err);
                  toast?.showError('Failed to create poll');
                }
              }}
              style={{ padding:'0.75rem 1.5rem', background:'linear-gradient(135deg, var(--brand), var(--brand2))', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:'0.9rem', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            >
              {t('create')||'Create'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Edit Modal */}
    {editingMsg && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2200 }} onClick={()=>setEditingMsg(null)}>
        <div style={{ background:'var(--panel)', color:'var(--text)', border:'1px solid var(--border)', padding:'1rem', borderRadius:12, minWidth:320, maxWidth:520, width:'90%' }} onClick={(e)=>e.stopPropagation()}>
          <h3 style={{ marginTop:0, marginBottom:8 }}>{t('edit') || 'Edit'}</h3>
          <textarea rows={5} value={editingMsg.content} onChange={(e)=>setEditingMsg({ ...editingMsg, content: e.target.value })} style={{ width:'100%', background:'var(--panel)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, padding:8 }} />
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:10 }}>
            <button onClick={()=>setEditingMsg(null)} style={{ background:'transparent', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', cursor:'pointer' }}>{t('cancel')||'Cancel'}</button>
            <button onClick={handleSaveEdit} style={{ background:'linear-gradient(135deg, #800020, #600018)', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px', cursor:'pointer' }}>{t('save')||'Save'}</button>
          </div>
        </div>
      </div>
    )}

    {/* New DM Picker Modal */}
    {showNewDMPicker && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowNewDMPicker(false)}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--panel)', borderRadius: 12, width: 400, maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Start New Conversation</h3>
            <button onClick={() => setShowNewDMPicker(false)} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text)' }}>✕</button>
          </div>
          <div style={{ padding: '0.75rem 1.5rem' }}>
            <input
              type="text"
              placeholder="Search users..."
              value={dmUserSearch}
              onChange={(e) => setDmUserSearch(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.95rem', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem 1rem' }}>
            {dmUsersLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Loading users...</div>
            ) : availableDMUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No users available</div>
            ) : (
              availableDMUsers
                .filter(u => {
                  if (!dmUserSearch) return true;
                  const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
                  const email = (u.email || '').toLowerCase();
                  const search = dmUserSearch.toLowerCase();
                  return name.includes(search) || email.includes(search);
                })
                .map(u => {
                  const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown';
                  const initials = name.charAt(0).toUpperCase();
                  const roles = (u.roleAssignments || []).map(ra => ra.role?.code).filter(Boolean);
                  const roleLabel = roles.includes('superadmin') ? 'Super Admin' : roles.includes('admin') ? 'Admin' : roles.includes('hr') ? 'HR' : roles.includes('instructor') ? 'Instructor' : roles.includes('student') ? 'Student' : '';
                  return (
                    <div
                      key={u.id}
                      onClick={() => startDMFromPicker(u)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.5rem', cursor: 'pointer', borderRadius: 8, borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#800020', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{u.email}</div>
                      </div>
                      {roleLabel && (
                        <span style={{ fontSize: '0.7rem', background: 'var(--brand)', color: 'white', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{roleLabel}</span>
                      )}
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
        <div data-tour="chat-members" onClick={(e)=>e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 360, background: 'white', boxShadow: '-4px 0 16px rgba(0,0,0,0.15)', padding: '1rem', pointerEvents: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>
              {selectedClass?.startsWith('dm:') ? 'Direct Message' : 'Class Members'}
            </h3>
            <button onClick={()=>setShowMembers(false)} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>
          {/* search + filter - only show for class chats */}
          {!selectedClass?.startsWith('dm:') && (
            <>
              <input
                type="text"
                placeholder="Search members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, marginBottom: 8, fontSize: '0.95rem' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={studentsOnly}
                  onChange={(e) => setStudentsOnly(e.target.checked)}
                />
                <span style={{ fontSize: '0.9rem' }}>Students only</span>
              </label>
            </>
          )}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            {selectedClass?.startsWith('dm:') ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <p>This is a direct message conversation.</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Only you and the other participant can see these messages.</p>
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
                      const isDisabled = m?.disabled || m?.isDisabled;
                      const isUnenrolled = selectedClass && selectedClass !== 'global' && !selectedClass.startsWith('dm:') && 
                        m.isStudent === true && !(Array.isArray(m.enrolledClasses) && m.enrolledClasses.includes(selectedClass));
                      const showIndicator = isDeleted || isDisabled || isUnenrolled;
                      const indicatorTitle = isDeleted ? 'Deleted User' : (isDisabled ? 'Disabled User' : (isUnenrolled ? 'Unenrolled from this class' : ''));
                
                return (
                  <div key={m.docId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: showIndicator ? '#999' : '#800020', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, opacity: showIndicator ? 0.5 : 1 }}>
                        {(m.displayName || m.email || '?').charAt(0).toUpperCase()}
                      </div>
                      {showIndicator && (
                        <div style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#dc2626', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={indicatorTitle}>
                          <span style={{ fontSize: 8, color: 'white' }}>✕</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {m.displayName || m.email}
                        {m.studentNumber && (
                          <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>
                            ({m.studentNumber})
                          </span>
                        )}
                        {m.role === ROLE_STRINGS.ADMIN && (
                          <span style={{ fontSize: '0.7rem', background: 'linear-gradient(135deg, #800020, #600018)', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Admin</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>{m.email}</div>
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
                        fontSize: 16
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
                <div key={`error-${index}`} style={{ padding: '0.5rem', color: '#999', fontStyle: 'italic' }}>
                  Error loading member
                </div>
              );
            }
          });
        } catch (error) {
          console.error('[ChatPage] Error in member list rendering:', { error, classMembers, memberSearch, studentsOnly });
          return (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              Unable to load members. Please refresh the page.
            </div>
          );
        }
      })()
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
});

export default ChatPage;
