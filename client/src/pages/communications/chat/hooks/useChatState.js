/**
 * Chat State Hook
 * Manages all chat-related state
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  LOCAL_STORAGE_KEYS, 
  SIDEBAR_CONFIG, 
  CHAT_UI_STATES 
} from '../constants/chatConstants';

export const useChatState = (user) => {
  // Basic state
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedClass, setSelectedClass] = useState('global');
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  // Classes and members
  const [classes, setClasses] = useState([]);
  const [classMembers, setClassMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Direct messages
  const [directRooms, setDirectRooms] = useState([]);

  // UI state
  const [showMembers, setShowMembers] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem(LOCAL_STORAGE_KEYS.SIDEBAR_WIDTH) || '0', 10);
      return Number.isFinite(saved) && saved >= SIDEBAR_CONFIG.MIN_WIDTH && saved <= SIDEBAR_CONFIG.MAX_WIDTH 
        ? saved 
        : SIDEBAR_CONFIG.DEFAULT_WIDTH;
    } catch {
      return SIDEBAR_CONFIG.DEFAULT_WIDTH;
    }
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
    } catch {
      return false;
    }
  });

  // Search state
  const [memberSearch, setMemberSearch] = useState('');
  const [studentsOnly, setStudentsOnly] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [globalChatSearch, setGlobalChatSearch] = useState('');
  const [msgQuery, setMsgQuery] = useState('');

  // Read receipts and unread counts
  const [chatReads, setChatReads] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [memberReads, setMemberReads] = useState({});

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);

  // File upload state
  const [attachedFile, setAttachedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // UI interaction state
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [reactionMenu, setReactionMenu] = useState(null);
  const [dmContextMenu, setDmContextMenu] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showDeleteDMConfirm, setShowDeleteDMConfirm] = useState(false);

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Other state
  const [profileName, setProfileName] = useState('');
  const [archivedRooms, setArchivedRooms] = useState(null);
  const [archivedClasses, setArchivedClasses] = useState(null);
  const [selectedClassName, setSelectedClassName] = useState('');
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [myMessageColor, setMyMessageColor] = useState(null);
  const [receiptsFor, setReceiptsFor] = useState(null);
  const [showJump, setShowJump] = useState(false);
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(() => {
    try { 
      return localStorage.getItem(LOCAL_STORAGE_KEYS.NAVBAR_COLLAPSED) === 'true'; 
    } catch { 
      return false; 
    }
  });

  // Safe arrays for memoization
  const safeClasses = useMemo(() => (Array.isArray(classes) ? classes : []), [classes]);
  const safeDirectRooms = useMemo(() => (Array.isArray(directRooms) ? directRooms : []), [directRooms]);
  const safeClassMembers = useMemo(() => (Array.isArray(classMembers) ? classMembers : []), [classMembers]);
  const safeAllUsers = useMemo(() => (Array.isArray(allUsers) ? allUsers : []), [allUsers]);
  const safeMessages = useMemo(() => (Array.isArray(messages) ? messages : []), [messages]);

  // Actions
  const toggleSidebar = useCallback(() => {
    const newCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsed);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SIDEBAR_COLLAPSED, newCollapsed.toString());
    } catch {}
  }, [isSidebarCollapsed]);

  const resetInputState = useCallback(() => {
    setNewMessage('');
    setAudioBlob(null);
    setAttachedFile(null);
    setImagePreview(null);
    setRecordingTime(0);
    setIsUploading(false);
  }, []);

  const resetPollState = useCallback(() => {
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPollModal(false);
  }, []);

  const clearMenus = useCallback(() => {
    setMenuOpenId(null);
    setReactionMenu(null);
    setDmContextMenu(null);
    setShowEmojiPicker(false);
  }, []);

  // Computed values
  const chatType = useMemo(() => {
    if (selectedClass === 'global') return 'global';
    if (selectedClass?.startsWith('dm:')) return 'dm';
    return 'class';
  }, [selectedClass]);

  const chatId = useMemo(() => {
    if (selectedClass === 'global') return 'global';
    if (selectedClass?.startsWith('dm:')) return selectedClass.slice(3);
    return selectedClass;
  }, [selectedClass]);

  const canSendMessage = useMemo(() => {
    return newMessage.trim() || audioBlob || attachedFile;
  }, [newMessage, audioBlob, attachedFile]);

  const isDMChat = useMemo(() => {
    return selectedClass?.startsWith('dm:');
  }, [selectedClass]);

  const isGlobalChat = useMemo(() => {
    return selectedClass === 'global';
  }, [selectedClass]);

  return {
    // State
    loading,
    setLoading,
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    selectedClass,
    setSelectedClass,
    userHasInteracted,
    setUserHasInteracted,
    
    // Classes and members
    classes,
    setClasses,
    classMembers,
    setClassMembers,
    allUsers,
    setAllUsers,
    
    // Direct messages
    directRooms,
    setDirectRooms,
    
    // UI state
    showMembers,
    setShowMembers,
    showSearch,
    setShowSearch,
    showArchived,
    setShowArchived,
    showFavoritesOnly,
    setShowFavoritesOnly,
    
    // Sidebar
    sidebarWidth,
    setSidebarWidth,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    toggleSidebar,
    
    // Search
    memberSearch,
    setMemberSearch,
    studentsOnly,
    setStudentsOnly,
    dmSearch,
    setDmSearch,
    globalChatSearch,
    setGlobalChatSearch,
    msgQuery,
    setMsgQuery,
    
    // Read receipts
    chatReads,
    setChatReads,
    unreadCounts,
    setUnreadCounts,
    memberReads,
    setMemberReads,
    
    // Recording
    isRecording,
    setIsRecording,
    recordingTime,
    setRecordingTime,
    audioBlob,
    setAudioBlob,
    
    // File upload
    attachedFile,
    setAttachedFile,
    imagePreview,
    setImagePreview,
    isUploading,
    setIsUploading,
    
    // UI interactions
    menuOpenId,
    setMenuOpenId,
    editingMsg,
    setEditingMsg,
    reactionMenu,
    setReactionMenu,
    dmContextMenu,
    setDmContextMenu,
    showEmojiPicker,
    setShowEmojiPicker,
    showPollModal,
    setShowPollModal,
    showDeleteDMConfirm,
    setShowDeleteDMConfirm,
    
    // Poll
    pollQuestion,
    setPollQuestion,
    pollOptions,
    setPollOptions,
    resetPollState,
    
    // Other
    profileName,
    setProfileName,
    archivedRooms,
    setArchivedRooms,
    archivedClasses,
    setArchivedClasses,
    selectedClassName,
    setSelectedClassName,
    highlightedMsgId,
    setHighlightedMsgId,
    myMessageColor,
    setMyMessageColor,
    receiptsFor,
    setReceiptsFor,
    showJump,
    setShowJump,
    isNavbarCollapsed,
    setIsNavbarCollapsed,
    
    // Safe arrays
    safeClasses,
    safeDirectRooms,
    safeClassMembers,
    safeAllUsers,
    safeMessages,
    
    // Actions
    resetInputState,
    clearMenus,
    
    // Computed
    chatType,
    chatId,
    canSendMessage,
    isDMChat,
    isGlobalChat
  };
};

export default useChatState;
