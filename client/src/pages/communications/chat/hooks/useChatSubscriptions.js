/**
 * Chat Subscriptions Hook
 * Manages all real-time subscriptions for chat
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { doc } from 'firebase/firestore';
import { db } from '@services/other/config';
import { getClasses } from '@services/business/classService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getUsers } from '@services/business/userService';
import { getUserProfile } from '@services/business/userService';
import { chatService } from '@services/business/chatService';
import { ROLE_STRINGS } from '@utils/userUtils';
import { ActivityLogger } from '@services/other/activityLogger';
import logger from '@utils/logger';

import { LOCAL_STORAGE_KEYS } from '../constants/chatConstants';
import { getChatType, getChatId } from '../utils/chatHelpers';

export const useChatSubscriptions = (user, isAdmin, state, actions) => {
  const location = useLocation();
  
  const {
    selectedClass,
    setLoading,
    setClasses,
    setDirectRooms,
    setAllUsers,
    setMessages,
    setChatReads,
    setUnreadCounts,
    setMemberReads,
    setProfileName,
    setArchivedRooms,
    setArchivedClasses,
    setMyMessageColor,
    setSelectedClassName,
    setHighlightedMsgId,
    safeClasses,
    safeDirectRooms,
    safeAllUsers,
    safeClassMembers,
    userHasInteracted,
    isNavbarCollapsed
  } = state;
  
  const { loadClassMembers } = actions;
  
  // Refs
  const messagesUnsubRef = useRef(null);
  const lastMsgObserverRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const suppressAutoScrollRef = useRef(false);
  const hasHighlightedRef = useRef(null);
  const lastProcessedMessageRef = useRef(new Set()); // Track processed messages

  // Load user profile
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
  }, [user, setProfileName, setArchivedRooms, setArchivedClasses, setMyMessageColor]);

  // Subscribe to user message color changes
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
  }, [user?.uid, setMyMessageColor]);

  // Load classes and setup subscriptions
  useEffect(() => {
    if (!user) return;
    
    const unsubs = [];
    
    const setupClassesSubscription = async () => {
      try {
        let ids = new Set();
        if (!isAdmin) {
          // Student: get enrolled classes
          const enrollmentsResult = await getEnrollments();
          const allEnr = enrollmentsResult.success ? (enrollmentsResult.data || []) : [];
          const byUid = allEnr.filter(e => e.userId === user.uid);
          let mine = byUid;
          if (mine.length === 0 && user.email) {
            const byEmail = allEnr.filter(e => (e.userEmail || e.email) === user.email);
            mine = byEmail;
          }
          ids = new Set(mine.map(e => e.classId));
          if (ids.size === 0) {
            try {
              const me = await getUserProfile(user);
              const enrolled = Array.isArray(me?.enrolledClasses) ? me.enrolledClasses : [];
              ids = new Set(enrolled);
            } catch {}
          }
        }
        
        const unsub = chatService.subscribeToClasses((all) => {
          setClasses(all);
          
          // Auto-select first class for students if needed
          if (!userHasInteracted && (!selectedClass || selectedClass === 'global')) {
            if (all.length > 0) {
              logger.info('Auto-selecting first class', { 
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
        }, isAdmin, user.uid, ids);
        unsubs.push(unsub);
        
        // Sync membership
        try {
          await chatService.syncUserEnrollments(user.uid, ids);
        } catch {}
        setLoading(false);
      } catch (error) {
        logger.error('Error setting up classes subscription:', error);
        setLoading(false);
      }
    };
    
    setupClassesSubscription();
    
    // Subscribe to DM rooms
    const unsub = chatService.subscribeToDirectRooms((snap) => {
      const rooms = [];
      snap.forEach(d => rooms.push({ id: d.id, ...d.data() }));
      setDirectRooms(rooms);
    });
    unsubs.push(unsub);
    
    return () => unsubs.forEach(u => u());
  }, [user, isAdmin, loadClassMembers, selectedClass, userHasInteracted, setSelectedClass, setSelectedClassName, setClasses, setDirectRooms, setLoading]);

  // Load all users once for DM labels
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const u = await getUsers();
        setAllUsers(u.success ? (u.data || []) : []);
      } catch {}
    };
    fetchUsers();
  }, [setAllUsers]);

  // Load/Reload messages when destination changes
  const loadMessages = useCallback(() => {
    const chatType = getChatType(selectedClass);
    const chatId = getChatId(selectedClass);
    
    const unsubscribe = chatService.subscribeToMessages(chatType, chatId, (snapshot) => {
      const msgs = [];
      const newMessageIds = new Set();
      
      snapshot.forEach((doc) => {
        const msg = { id: doc.id, ...doc.data() };
        msgs.push(msg);
        newMessageIds.add(doc.id);
        
        // Only log message received for NEW messages from other users (after initial load)
        if (lastProcessedMessageRef.current.size > 0 && 
            !lastProcessedMessageRef.current.has(doc.id) && 
            msg.senderId !== user.uid) {
          try {
            ActivityLogger.messageReceived({
              messageId: doc.id,
              messageType: msg.messageType,
              chatType: chatType,
              classId: msg.classId,
              roomId: msg.roomId,
              senderId: msg.senderId,
              senderName: msg.senderName,
              contentLength: msg.content?.length || 0,
              hasAttachment: !!(msg.voiceUrl || msg.fileUrl)
            });
          } catch (logError) {
            logger.warn('Failed to log message received activity:', logError);
          }
        }
      });
      
      // Update processed messages tracking after initial load
      if (lastProcessedMessageRef.current.size === 0) {
        // First load - populate with existing messages
        lastProcessedMessageRef.current = newMessageIds;
      } else {
        // Subsequent loads - only add new messages
        newMessageIds.forEach(id => lastProcessedMessageRef.current.add(id));
      }
      
      logger.info('Messages loaded', { 
        chatType, 
        chatId, 
        messageCount: msgs.length
      });
      
      setMessages(msgs);

      // Mark as read for this destination
      (async () => {
        try {
          const key = selectedClass === 'global' ? 'global' : selectedClass;
          const newReadTime = await chatService.updateUserChatReads(user.uid, key);
          setChatReads(prev => ({ ...(prev || {}), [key]: newReadTime }));
        } catch {}
      })();
    }, (error) => {
      logger.error('Error loading messages:', error);
    });
    
    return unsubscribe;
  }, [selectedClass, user, setMessages, setChatReads]);

  // Clear message tracking when switching rooms
  useEffect(() => {
    // Clear tracking when switching to a different room
    lastProcessedMessageRef.current.clear();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass) return;
    try {
      // cleanup any existing listener
      if (messagesUnsubRef.current) {
        try { messagesUnsubRef.current(); } catch {}
        messagesUnsubRef.current = null;
      }
      const unsub = loadMessages();
      messagesUnsubRef.current = unsub;
    } catch (e) {
      logger.error('Failed to (re)subscribe messages:', e);
    }
    return () => {
      if (messagesUnsubRef.current) {
        try { messagesUnsubRef.current(); } catch {}
        messagesUnsubRef.current = null;
      }
    };
  }, [selectedClass, loadMessages]);

  // Load user's chat read markers
  useEffect(() => {
    const loadReads = async () => {
      try {
        const reads = await chatService.getUserChatReads(user.uid);
        setChatReads(reads);
      } catch {}
    };
    if (user) loadReads();
  }, [user, setChatReads]);

  // Calculate unread counts for all chats
  useEffect(() => {
    if (!user) return;
    
    const counts = {};
    
    // Global
    const globalUnsub = chatService.subscribeToUnreadCounts(chatReads, (chatKey, count) => {
      setUnreadCounts(prev => ({ ...prev, [chatKey]: count }));
    });

    // Classes
    const classUnsubs = safeClasses.map(cls => {
      const classKey = cls.docId;
      return chatService.subscribeToClassUnreadCounts(classKey, chatReads, (chatKey, count) => {
        setUnreadCounts(prev => ({ ...prev, [chatKey]: count }));
      });
    });

    // DMs
    const dmUnsubs = safeDirectRooms.map(room => {
      return chatService.subscribeToDMUnreadCounts(room, chatReads, (roomId, count) => {
        setUnreadCounts(prev => ({ ...prev, [`dm:${roomId}`]: count }));
      });
    });

    return () => {
      globalUnsub();
      classUnsubs.forEach(u => u());
      dmUnsubs.forEach(u => u());
    };
  }, [user, chatReads, safeClasses, safeDirectRooms, setUnreadCounts]);

  // Compute member read markers for current destination
  useEffect(() => {
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
  }, [selectedClass, safeAllUsers, safeClassMembers, safeDirectRooms, user?.uid, setMemberReads]);

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
  }, [user, selectedClass, chatReads, setChatReads]);

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
  }, [location.search, setSelectedClass, loadClassMembers, safeClasses, setSelectedClassName]);

  // Handle URL parameters for message highlighting
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

    // Only highlight once per msgId per mount
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
  }, [location.search, selectedClass, setSelectedClass, setHighlightedMsgId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const nearBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) < 100;
    if (suppressAutoScrollRef.current) { 
      suppressAutoScrollRef.current = false; 
      return; 
    }
    if (nearBottom || selectedClass) {
      setTimeout(() => {
        try { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); } catch {}
      }, 0);
    }
  }, [state.messages?.length, selectedClass]);

  // Show jump to bottom button when scrolled up
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      state.setShowJump(dist > 140);
    };
    el.addEventListener('scroll', onScroll);
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [state.setShowJump]);

  // Listen for navbar toggle events
  useEffect(() => {
    const handleNavbarToggle = (e) => {
      state.setIsNavbarCollapsed(e.detail.collapsed);
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
  }, [isNavbarCollapsed, state.setIsNavbarCollapsed]);

  // Remove outer page scrollbar while on Chat
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return {
    // Refs for components to use
    messagesEndRef,
    scrollContainerRef,
    lastMsgObserverRef,
    suppressAutoScrollRef,
    hasHighlightedRef
  };
};
