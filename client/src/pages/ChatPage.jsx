import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate, useLocation } from 'react-router-dom';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteField
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { getClasses, getEnrollments, getUsers } from '../firebase/firestore';
import { addNotification } from '../firebase/notifications';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastProvider';
import './ChatPage.css';

const ChatPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { t, lang } = useLang();
  const toast = useToast();
  const location = useLocation();
  
  // State
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('global');
  const [classMembers, setClassMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [directRooms, setDirectRooms] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [studentsOnly, setStudentsOnly] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [chatReads, setChatReads] = useState({}); // { 'class:<id>': Timestamp, 'dm:<id>': Timestamp, 'global': Timestamp }
  const [unreadCounts, setUnreadCounts] = useState({}); // { 'class:<id>': number, 'dm:<id>': number, 'global': number }
  const [showDeleteDMConfirm, setShowDeleteDMConfirm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = parseInt(localStorage.getItem('chatSidebarWidth') || '0', 10);
    return Number.isFinite(saved) && saved >= 280 && saved <= 500 ? saved : 320;
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
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [emojiCategory, setEmojiCategory] = useState('smileys');
  const [emojiSearch, setEmojiSearch] = useState('');
  
  
  // Refs
  const lastMsgObserverRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const messageInputRef = useRef(null);
  const suppressAutoScrollRef = useRef(false);
  const messagesUnsubRef = useRef(null);
  // Profile name for senderName in messages/polls
  const [profileName, setProfileName] = useState('');
  const [archivedRooms, setArchivedRooms] = useState(null); // null = loading, {} = loaded
  const [archivedClasses, setArchivedClasses] = useState(null); // null = loading, {} = loaded
  const [showArchived, setShowArchived] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  // Scroll management
  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const hasHighlightedRef = useRef(null);
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const usersResult = await getUsers();
        const me = usersResult.data?.find(u => u.docId === user?.uid);
        if (me?.displayName) setProfileName(me.displayName);
        setArchivedRooms(me?.archivedRooms || {});
        setArchivedClasses(me?.archivedClasses || {});
      } catch {}
    };
    loadProfile();
  }, [user]);

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

  // Close emoji picker on outside click (not on hover)
  useEffect(() => {
    if (!showEmojiPicker) return;
    const onDoc = (e) => {
      const picker = document.getElementById('emoji-picker');
      if (picker && !picker.contains(e.target)) setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showEmojiPicker]);

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
  }, [scrollContainerRef.current]);

  // Save edits to a message
  const handleSaveEdit = async () => {
    if (!editingMsg || !editingMsg.id) return setEditingMsg(null);
    try {
      const mref = doc(db, 'messages', editingMsg.id);
      await updateDoc(mref, {
        content: (editingMsg.content || '').trim(),
        messageType: 'text'
      });

      // If this edited message is the latest in its thread, refresh lastMessage preview
      try {
        const snap = await getDoc(mref);
        if (snap.exists()) {
          const m = snap.data();
          const msgsRef = collection(db, 'messages');
          if (m.type === 'class' && m.classId) {
            const q = query(msgsRef, where('classId', '==', m.classId), orderBy('createdAt', 'desc'));
            const qs = await getDocs(q);
            if (!qs.empty && qs.docs[0].id === editingMsg.id) {
              await updateDoc(doc(db, 'classes', m.classId), {
                lastMessage: (editingMsg.content || '').trim()
              });
            }
          } else if (m.type === 'dm' && m.roomId) {
            const q = query(msgsRef, where('type', '==', 'dm'), where('roomId', '==', m.roomId), orderBy('createdAt', 'desc'));
            const qs = await getDocs(q);
            if (!qs.empty && qs.docs[0].id === editingMsg.id) {
              await updateDoc(doc(db, 'directRooms', m.roomId), {
                lastMessage: (editingMsg.content || '').trim()
              });
            }
          }
        }
      } catch {}

      setEditingMsg(null);
      toast?.showSuccess(t('saved') || 'Saved');
    } catch (e) {
      console.error('Edit failed', e);
      toast?.showError(t('failed_to_save') || 'Failed to save');
    }
  };

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
      setShowEmojiPicker(false);
      setReactionMenu(null);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowEmojiPicker(false);
        setReactionMenu(null);
      }
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [showEmojiPicker, reactionMenu]);

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
      if (selectedClass === 'global') ids = (allUsers || []).map(u => u.docId).filter(Boolean);
      else if (selectedClass?.startsWith('dm:')) ids = (directRooms.find(r => `dm:${r.id}` === selectedClass)?.participants || []);
      else ids = (classMembers || []).map(m => m.docId).filter(Boolean);
      const recips = ids.filter(id => id && id !== user?.uid);
      const reads = {};
      recips.forEach(uid => {
        const uref = doc(db, 'users', uid);
        const unsub = onSnapshot(uref, (snap) => {
          const data = snap.data() || {};
          const r = data.chatReads?.[key];
          const d = r?.toDate?.() || (typeof r === 'string' ? new Date(r) : (r?.seconds ? new Date(r.seconds*1000) : null));
          if (d) {
            reads[uid] = d;
          } else {
            delete reads[uid];
          }
          setMemberReads({ ...reads });
        });
        unsubs.push(unsub);
      });
    } catch {}
    return () => { try { unsubs.forEach(u => u()); } catch {} };
  }, [selectedClass, allUsers, classMembers, directRooms, user?.uid]);

  // Read query param dest to jump directly from notifications
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dest = params.get('dest');
    if (dest) {
      setSelectedClass(dest);
      loadClassMembers(dest);
      // If classes not loaded yet, try to set a temp name
      const cls = classes.find(c => c.docId === dest);
      if (cls) setSelectedClassName(cls.name);
      else {
        (async () => {
          try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase/config');
            const snap = await getDoc(doc(db, 'classes', dest));
            if (snap.exists()) setSelectedClassName((snap.data().name) || '');
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
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.data() || {};
        setChatReads(data.chatReads || {});
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
    const msgsRef = collection(db, 'messages');
    const globalQ = query(msgsRef, where('type', '==', 'global'));
    const globalUnsub = onSnapshot(globalQ, (snap) => {
      let count = 0;
      snap.forEach(d => {
        const msg = d.data();
        if (msg.senderId === user.uid) return; // don't count my own messages
        const msgTime = msg.createdAt?.toDate?.() || new Date(msg.createdAt);
        if (!globalReadAt || new Date(globalReadAt) < msgTime) count++;
      });
      setUnreadCounts(prev => ({ ...prev, [globalKey]: count }));
    });

    // Classes
    const classUnsubs = classes.map(cls => {
      const classKey = cls.docId;
      const readAt = chatReads[classKey] || chatReads[`class:${classKey}`];
      const cq = query(msgsRef, where('classId', '==', classKey));
      return onSnapshot(cq, (snap) => {
        let count = 0;
        snap.forEach(d => {
          const msg = d.data();
          if (msg.senderId === user.uid) return;
          const msgTime = msg.createdAt?.toDate?.() || new Date(msg.createdAt);
          if (!readAt || new Date(readAt) < msgTime) count++;
        });
        setUnreadCounts(prev => ({ ...prev, [classKey]: count }));
      });
    });

    // DMs
    const dmUnsubs = directRooms.map(room => {
      const dmKey = `dm:${room.id}`;
      const readAt = chatReads[dmKey];
      const dq = query(msgsRef, where('type', '==', 'dm'), where('roomId', '==', room.id));
      return onSnapshot(dq, (snap) => {
        let count = 0;
        snap.forEach(d => {
          const msg = d.data();
          if (msg.senderId === user.uid) return;
          const msgTime = msg.createdAt?.toDate?.() || new Date(msg.createdAt);
          if (!readAt || new Date(readAt) < msgTime) count++;
        });
        setUnreadCounts(prev => ({ ...prev, [dmKey]: count }));
      });
    });

    return () => {
      globalUnsub();
      classUnsubs.forEach(u => u());
      dmUnsubs.forEach(u => u());
    };
  }, [user, chatReads, classes, directRooms]);

  // Mark as read when tab gains focus
  useEffect(() => {
    const handleFocus = async () => {
      if (!user || !selectedClass) return;
      try {
        const key = selectedClass === 'global' ? 'global' : selectedClass;
        await setDoc(doc(db, 'users', user.uid), { chatReads: { ...(chatReads || {}), [key]: serverTimestamp() } }, { merge: true });
        setChatReads(prev => ({ ...(prev || {}), [key]: new Date() }));
      } catch {}
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, selectedClass, chatReads]);

  // Star/Unstar a DM room
  const toggleStar = async (room) => {
    try {
      const roomRef = doc(db, 'directRooms', room.id);
      const starred = (room.starBy || []).includes(user.uid);
      await updateDoc(roomRef, {
        starBy: starred ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (e) { /* noop */ }
  };

  // Clear messages in a DM conversation (keep the room)
  const clearDMMessages = async (roomId, mode = 'all') => {
    // Only admins can clear all or others' messages
    if (!isAdmin && (mode === 'all' || mode === 'theirs')) {
      toast?.showError('Only admins can clear these messages');
      return;
    }
    try {
      const msgsRef = collection(db, 'messages');
      const q = query(msgsRef, where('type', '==', 'dm'), where('roomId', '==', roomId));
      const qs = await getDocs(q);
      let deletedCount = 0;
      
      // Filter messages based on mode
      for (const d of qs.docs) {
        const m = d.data();
        let shouldDelete = false;
        
        if (mode === 'all') {
          shouldDelete = true;
        } else if (mode === 'mine') {
          shouldDelete = m.senderId === user.uid;
        } else if (mode === 'theirs') {
          shouldDelete = m.senderId !== user.uid;
        }
        
        if (shouldDelete) {
          try { if (m.voicePath) await deleteObject(ref(storage, m.voicePath)); } catch {}
          try { if (m.filePath) await deleteObject(ref(storage, m.filePath)); } catch {}
          try { await deleteDoc(doc(db, 'messages', d.id)); deletedCount++; } catch {}
        }
      }
      
      // Update room metadata if all messages cleared
      if (mode === 'all' || deletedCount === qs.docs.length) {
        await updateDoc(doc(db, 'directRooms', roomId), {
          lastMessage: '',
          lastMessageAt: null
        });
      }
      
      setDmContextMenu(null);
      const modeLabel = mode === 'all' ? 'All messages' : mode === 'mine' ? 'Your messages' : 'Their messages';
      toast?.showSuccess(`${modeLabel} cleared`);
    } catch (err) {
      console.error('Clear messages failed:', err);
      toast?.showError('Failed to clear messages');
    }
  };

  // Delete entire DM conversation (admin)
  const deleteDMConversation = async () => {
    if (!isAdmin) return;
    try {
      const room = directRooms.find(r => `dm:${r.id}` === selectedClass);
      if (!room) return setShowDeleteDMConfirm(false);
      const roomId = room.id;
      // fetch all messages for this room
      const msgsRef = collection(db, 'messages');
      const q = query(msgsRef, where('type', '==', 'dm'), where('roomId', '==', roomId));
      const qs = await getDocs(q);
      // best-effort delete message attachments then docs
      for (const d of qs.docs) {
        const m = d.data();
        try { if (m.voicePath) await deleteObject(ref(storage, m.voicePath)); } catch {}
        try { if (m.filePath) await deleteObject(ref(storage, m.filePath)); } catch {}
        try { await deleteDoc(doc(db, 'messages', d.id)); } catch {}
      }
      // delete room itself
      await deleteDoc(doc(db, 'directRooms', roomId));
      setShowDeleteDMConfirm(false);
      setSelectedClass('global');
      toast?.showSuccess('Conversation deleted');
    } catch (err) {
      console.error('Delete conversation failed:', err);
      toast?.showError('Failed to delete conversation');
    }
  };

  // Load classes and setup with real-time subscriptions
  useEffect(() => {
    if (authLoading || !user) return;
    
    const unsubs = [];
    
    // Real-time subscription for classes
    const setupClassesSubscription = async () => {
      try {
        const classesRef = collection(db, 'classes');
        if (isAdmin) {
          // Admin: subscribe to all classes
          const unsub = onSnapshot(classesRef, (snap) => {
            const all = [];
            snap.forEach(d => all.push({ docId: d.id, ...d.data() }));
            setClasses(all);
          });
          unsubs.push(unsub);
        } else {
          // Student: first get enrollments, then subscribe to enrolled classes
          const enrollmentsResult = await getEnrollments();
          const allEnr = enrollmentsResult.success ? (enrollmentsResult.data || []) : [];
          const byUid = allEnr.filter(e => e.userId === user.uid);
          let mine = byUid;
          if (mine.length === 0 && user.email) {
            const byEmail = allEnr.filter(e => (e.userEmail || e.email) === user.email);
            mine = byEmail;
          }
          let ids = new Set(mine.map(e => e.classId));
          if (ids.size === 0) {
            try {
              const usersRes = await getUsers();
              const me = (usersRes.data || []).find(u => u.docId === user.uid || u.email === user.email);
              const enrolled = Array.isArray(me?.enrolledClasses) ? me.enrolledClasses : [];
              ids = new Set(enrolled);
            } catch {}
          }
          
          // Subscribe to all classes and filter on client side
          const unsub = onSnapshot(classesRef, (snap) => {
            const all = [];
            snap.forEach(d => {
              const data = { docId: d.id, ...d.data() };
              if (ids.has(d.id)) all.push(data);
            });
            setClasses(all);
            
            // Auto-select first class for students if needed
            if (!selectedClass || selectedClass === 'global') {
              if (all.length > 0) {
                setSelectedClass(all[0].docId);
                setSelectedClassName(all[0].name || '');
                loadClassMembers(all[0].docId);
              }
            }
          });
          unsubs.push(unsub);
          
          // Sync membership
          try {
            for (const id of Array.from(ids)) {
              await updateDoc(doc(db,'users',user.uid), { enrolledClasses: arrayUnion(id) });
            }
          } catch {}
        }
        setLoading(false);
      } catch (error) {
        console.error('Error setting up classes subscription:', error);
        setLoading(false);
      }
    };
    
    setupClassesSubscription();
    scrollToBottom();
    
    // subscribe to DM rooms
    const roomsRef = collection(db, 'directRooms');
    const rq = query(roomsRef, where('participants', 'array-contains', user.uid));
    const unsub = onSnapshot(rq, (snap) => {
      const rooms = [];
      snap.forEach(d => rooms.push({ id: d.id, ...d.data() }));
      setDirectRooms(rooms);
    });
    unsubs.push(unsub);
    
    return () => unsubs.forEach(u => u());
  }, [user, isAdmin, authLoading]);

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
      console.error('Failed to (re)subscribe messages:', e);
    }
    // cleanup on dependency change/unmount
    return () => {
      if (messagesUnsubRef.current) {
        try { messagesUnsubRef.current(); } catch {}
        messagesUnsubRef.current = null;
      }
    };
  }, [selectedClass]);
  
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
            await setDoc(doc(db, 'users', user.uid), { chatReads: { ...(chatReads || {}), [key]: serverTimestamp() } }, { merge: true });
            setChatReads(prev => ({ ...(prev || {}), [key]: new Date() }));
          } catch {}
        }
      }, { threshold: 0.5 });
      lastMsgObserverRef.current.observe(el);
    } catch {}
  }, [messages]);

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
    resizingRef.current = true;
    document.body.style.userSelect = 'none';
  };
  const onDragMove = (e) => {
    if (!resizingRef.current) return;
    const x = e.clientX;
    const min = 280, max = 500;
    const w = Math.min(max, Math.max(min, x));
    setSidebarWidth(w);
    try { localStorage.setItem('chatSidebarWidth', String(w)); } catch {}
  };
  const onDragEnd = () => {
    resizingRef.current = false;
    document.body.style.userSelect = '';
    try { localStorage.setItem('chatSidebarWidth', String(sidebarWidth)); } catch {}
  };
  useEffect(() => {
    const move = (e)=>onDragMove(e);
    const up = ()=>onDragEnd();
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  // Delete message (admins or the original sender). Also removes attachments when present.
  const handleDeleteMessage = async (msg) => {
    if (!isAdmin && msg?.senderId !== user?.uid) return;
    try {
      // Delete storage files if any (best effort)
      if (msg.voicePath) {
        try { await deleteObject(ref(storage, msg.voicePath)); } catch {}
      }
      if (msg.filePath) {
        try { await deleteObject(ref(storage, msg.filePath)); } catch {}
      }
      await deleteDoc(doc(db, 'messages', msg.id));
      
      // Update lastMessage for class if this was the last message
      if (msg.type === 'class' && msg.classId) {
        try {
          // Get remaining messages for this class
          const msgsRef = collection(db, 'messages');
          const q = query(msgsRef, where('classId', '==', msg.classId), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          if (snap.empty) {
            // No messages left, clear lastMessage
            await updateDoc(doc(db, 'classes', msg.classId), {
              lastMessage: '',
              lastMessageAt: null
            });
          } else {
            // Update to the new last message
            const lastMsg = snap.docs[0].data();
            const preview = lastMsg.messageType === 'text' ? lastMsg.content
              : (lastMsg.messageType === 'voice' ? '[Voice Message]'
                : (lastMsg.messageType === 'file' ? `[File: ${lastMsg.fileName}]` : 'Message'));
            await updateDoc(doc(db, 'classes', msg.classId), {
              lastMessage: preview,
              lastMessageAt: lastMsg.createdAt
            });
          }
        } catch (e) {
          console.warn('Failed to update class lastMessage:', e);
        }
      }
      
      // Update lastMessage for DM if this was the last message
      if (msg.type === 'dm' && msg.roomId) {
        try {
          const msgsRef = collection(db, 'messages');
          const q = query(msgsRef, where('type', '==', 'dm'), where('roomId', '==', msg.roomId), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          if (snap.empty) {
            await updateDoc(doc(db, 'directRooms', msg.roomId), {
              lastMessage: '',
              lastMessageAt: null
            });
          } else {
            const lastMsg = snap.docs[0].data();
            const preview = lastMsg.messageType === 'text' ? lastMsg.content
              : (lastMsg.messageType === 'voice' ? '[Voice Message]'
                : (lastMsg.messageType === 'file' ? `[File: ${lastMsg.fileName}]` : 'Message'));
            await updateDoc(doc(db, 'directRooms', msg.roomId), {
              lastMessage: preview,
              lastMessageAt: lastMsg.createdAt
            });
          }
        } catch (e) {
          console.warn('Failed to update DM lastMessage:', e);
        }
      }
      
      toast?.showSuccess('Message deleted');
    } catch (err) {
      console.error('Delete message failed:', err);
    }
  };

  const loadClasses = async () => {
    setLoading(true);
    try {
      const [classesResult, enrollmentsResult] = await Promise.all([
        getClasses(),
        getEnrollments()
      ]);

      if (!classesResult.success) {
        console.error('Failed to load classes:', classesResult.error);
        const errStr = typeof classesResult.error === 'string' ? classesResult.error : (classesResult.error?.message || 'Unknown error');
        toast?.showError(`Failed to load classes: ${errStr}`);
        return;
      }

      const all = classesResult.data || [];
      if (isAdmin) {
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
            const usersRes = await getUsers();
            const me = (usersRes.data || []).find(u => u.docId === user.uid || u.email === user.email);
            const enrolled = Array.isArray(me?.enrolledClasses) ? me.enrolledClasses : [];
            ids = new Set(enrolled);
          } catch {}
        }
        console.log('[Chat] loadClasses uid=', user.uid, 'email=', user.email, 'classIds=', Array.from(ids));
        const mineClasses = all.filter(c => ids.has(c.docId));
        setClasses(mineClasses);
        // Sync membership flags onto users/{uid} for rules
        try {
          const { updateDoc, doc, arrayUnion } = await import('firebase/firestore');
          const { db } = await import('../firebase/config');
          for (const id of Array.from(ids)) {
            await updateDoc(doc(db,'users',user.uid), { enrolledClasses: arrayUnion(id) });
          }
        } catch {}
        // If no dest specified and nothing selected yet, auto-select first class for students
        try {
          const params = new URLSearchParams(location.search);
          const dest = params.get('dest');
          if (!dest && (!selectedClass || selectedClass === 'global') && mineClasses.length > 0) {
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
      console.error('Error loading classes:', error);
      const msg = (error && (error.message || error.code)) ? `Failed to load classes: ${error.code || ''} ${error.message || ''}`.trim() : 'Failed to load classes';
      toast?.showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = () => {
    const messagesRef = collection(db, 'messages');
    let q;
    if (selectedClass === 'global') {
      q = query(messagesRef, where('type', '==', 'global'), orderBy('createdAt', 'asc'));
    } else if (selectedClass?.startsWith('dm:')) {
      const roomId = selectedClass.slice(3);
      q = query(messagesRef, where('type', '==', 'dm'), where('roomId', '==', roomId), orderBy('createdAt', 'asc'));
    } else {
      // Defensive: ensure users/{uid}.enrolledClasses contains selectedClass to satisfy rules
      (async () => {
        try {
          if (user?.uid && selectedClass) {
            const { updateDoc, doc, arrayUnion } = await import('firebase/firestore');
            const { db } = await import('../firebase/config');
            await updateDoc(doc(db, 'users', user.uid), { enrolledClasses: arrayUnion(selectedClass) });
          }
        } catch {}
      })();
      q = query(messagesRef, where('classId', '==', selectedClass), orderBy('createdAt', 'asc'));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);

      // memberReads now updates via user snapshots effect

      // Mark as read for this destination
      (async () => {
        try {
          const key = selectedClass === 'global' ? 'global' : selectedClass;
          await setDoc(doc(db, 'users', user.uid), { chatReads: { ...(chatReads || {}), [key]: serverTimestamp() } }, { merge: true });
          setChatReads(prev => ({ ...(prev || {}), [key]: new Date() }));
        } catch {}
      })();
    }, (error) => {
      console.error('Error loading messages:', error);
    });
    
    return unsubscribe;
  };

  const loadClassMembers = async (classId) => {
    // Safety: if auth user not ready yet, bail early to avoid null uid errors
    if (!user) return;
    if (classId === 'global') {
      const usersResult = await getUsers();
      const all = usersResult.success ? (usersResult.data || []) : [];
      // Exclude current user from members list
      setClassMembers(all.filter(u => u.docId !== user.uid));
      setAllUsers(all);
      return;
    }
    
    const usersResult = await getUsers();
    const allUsers = usersResult.success ? (usersResult.data || []) : [];
    // Prefer users who have this class id in enrolledClasses
    let members = allUsers.filter(u => Array.isArray(u.enrolledClasses) && u.enrolledClasses.includes(classId) && u.docId !== user.uid);
    // Ensure instructor/owner is included at top
    try {
      const cls = classes.find(c => c.docId === classId);
      const instructor = cls?.instructorId ? allUsers.find(u => u.docId === cls.instructorId)
                        : allUsers.find(u => u.email === cls?.ownerEmail);
      if (instructor && instructor.docId !== user.uid && !members.some(m => m.docId === instructor.docId)) {
        members = [instructor, ...members];
      }
    } catch {}
    // Optionally include platform admins so students can DM an admin (but not self)
    const admins = allUsers.filter(u => u.role === 'admin' && u.docId !== user.uid);
    admins.forEach(a => { if (!members.some(m => m.docId === a.docId)) members.push(a); });
    setClassMembers(members);
    setAllUsers(allUsers);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !audioBlob && !attachedFile) return;
    
    try {
      const messageData = {
        senderId: user.uid,
        senderName: user.displayName || profileName || user.email,
        senderEmail: user.email,
        type: selectedClass === 'global' ? 'global' : (selectedClass?.startsWith('dm:') ? 'dm' : 'class'),
        classId: selectedClass && !selectedClass.startsWith('dm:') && selectedClass !== 'global' ? selectedClass : null,
        roomId: selectedClass?.startsWith('dm:') ? selectedClass.slice(3) : null,
        createdAt: serverTimestamp(),
        readBy: [user.uid]
      };
      
      // Handle voice message
      if (audioBlob) {
        const voicePath = `voice-messages/${Date.now()}_${user.uid}.webm`;
        const voiceRef = ref(storage, voicePath);
        await uploadBytes(voiceRef, audioBlob);
        const voiceUrl = await getDownloadURL(voiceRef);
        
        messageData.messageType = 'voice';
        messageData.voiceUrl = voiceUrl;
        messageData.voicePath = voicePath;
        messageData.duration = recordingTime;
        messageData.content = '[Voice Message]';
      } else if (attachedFile) {
        // File attachment
        const filePath = `chat-attachments/${Date.now()}_${user.uid}_${attachedFile.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, attachedFile);
        const fileUrl = await getDownloadURL(fileRef);
        
        messageData.messageType = 'file';
        messageData.fileUrl = fileUrl;
        messageData.filePath = filePath;
        messageData.fileName = attachedFile.name;
        messageData.fileSize = attachedFile.size;
        messageData.fileType = attachedFile.type;
        messageData.content = `[File: ${attachedFile.name}]`;
      } else {
        // Text message
        messageData.messageType = 'text';
        messageData.content = newMessage.trim();
      }
      
      const added = await addDoc(collection(db, 'messages'), messageData);
      // If DM, update room last message metadata
      if (messageData.type === 'dm' && messageData.roomId) {
        try {
          const preview = messageData.messageType === 'text' ? messageData.content
            : (messageData.messageType === 'voice' ? '[Voice Message]'
              : (messageData.messageType === 'file' ? `[File: ${messageData.fileName}]` : 'Message'));
          await setDoc(doc(db, 'directRooms', messageData.roomId), {
            lastMessage: preview,
            lastMessageAt: serverTimestamp(),
          }, { merge: true });
          // Notify the other participant
          const otherId = (directRooms.find(r => r.id === messageData.roomId)?.participants || []).find(p => p !== user.uid);
          if (otherId) {
            await addNotification({
              userId: otherId,
              title: (profileName || user.displayName || user.email),
              message: preview,
              type: 'message',
              data: { roomId: messageData.roomId, messageId: added.id }
            });
          }
        } catch {}
      }
      // If class, update class last message metadata and notify class members (except sender)
      if (messageData.type === 'class' && messageData.classId) {
        try {
          const preview = messageData.messageType === 'text' ? messageData.content
            : (messageData.messageType === 'voice' ? '[Voice Message]'
              : (messageData.messageType === 'file' ? `[File: ${messageData.fileName}]` : 'Message'));
          await updateDoc(doc(db, 'classes', messageData.classId), {
            lastMessage: preview,
            lastMessageAt: serverTimestamp()
          });
          // Notify enrolled users
          try {
            const enr = await getEnrollments();
            const targets = (enr.data || []).filter(e => e.classId === messageData.classId && e.userId !== user.uid);
            for (const t of targets) {
              await addNotification({
                userId: t.userId,
                title: `💬 ${classes.find(c=>c.docId===messageData.classId)?.name || 'Class'}`,
                message: `${(profileName || user.displayName || user.email)}: ${preview.substring(0, 120)}`,
                type: 'chat',
                data: { classId: messageData.classId, messageId: added.id }
              });
            }
          } catch {}
        } catch {}
      }

      // If global, notify all users except sender
      if (messageData.type === 'global') {
        try {
          const preview = messageData.messageType === 'text' ? messageData.content
            : (messageData.messageType === 'voice' ? '[Voice Message]'
              : (messageData.messageType === 'file' ? `[File: ${messageData.fileName}]` : 'Message'));
          const usersRes = await getUsers();
          const others = (usersRes.data || []).filter(u => u.docId !== user.uid);
          for (const u2 of others) {
            await addNotification({
              userId: u2.docId,
              title: '💬 Global Chat',
              message: `${(profileName || user.displayName || user.email)}: ${preview.substring(0, 120)}`,
              type: 'chat',
              data: { type: 'global', messageId: added.id }
            });
          }
        } catch {}
      }
      
      // Reset
      setNewMessage('');
      setAudioBlob(null);
      setAttachedFile(null);
      setRecordingTime(0);
      messageInputRef.current?.focus();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast?.showError('Failed to send message');
    }
  };
  
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (10MB for videos, 5MB for others)
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast?.showError(`File size must be less than ${isVideo ? '10MB' : '5MB'}`);
      e.target.value = '';
      return;
    }
    
    setAttachedFile(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer with 60-second limit
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at 60 seconds (1 minute)
          if (newTime >= 60) {
            stopRecording();
            toast?.showInfo('Maximum recording time reached (1 minute)');
          }
          return newTime;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast?.showError('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClassChange = async (classId) => {
    setSelectedClass(classId);
    await loadClassMembers(classId);
  };

  // Create or open a DM room with another user
  const openDMWith = async (otherUser) => {
    if (!otherUser?.docId || otherUser.docId === user.uid) return;
    const roomId = [user.uid, otherUser.docId].sort().join('_');
    try {
      const roomRef = doc(db, 'directRooms', roomId);
      // Avoid reading a non-existent doc (would fail due to rules). Create/merge optimistically.
      await setDoc(roomRef, {
        participants: [user.uid, otherUser.docId],
        createdAt: serverTimestamp(),
        lastMessage: null
      }, { merge: true });
      setSelectedClass(`dm:${roomId}`);
      setShowMembers(false);
    } catch (err) {
      console.error('Open DM failed:', err);
      toast?.showError('Failed to start conversation');
    }
  };

  // Avoid redirect on refresh while auth is still resolving
  if (authLoading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  if (loading) return <Loading />;

  return (
    <>
    <div className="chat-page" style={{
      display: 'flex',
      height: 'calc(100vh - 60px)',
      background: 'var(--bg)',
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <div className="chat-sidebar" style={{
        width: sidebarWidth,
        background: 'var(--panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
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
              {receiptsFor.list.map(r => {
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
              <button onClick={()=>setReceiptsFor(null)} style={{ padding:'0.6rem 1.2rem', background:'linear-gradient(135deg, #667eea, #764ba2)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}>{t('close')||'Close'}</button>
            </div>
          </div>
        </div>
      )}

        {/* Class List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
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
                <span style={{ fontSize: '1.5rem' }}>🌐</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ fontWeight: '600', flex:1 }}>{t('global_chat')}</div>
                    {(() => { const c = unreadCounts['global']||0; if (c>0) { return (<span style={{background:'#667eea',color:'white',borderRadius:'50%',minWidth:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:'bold',padding:'0 5px'}}>{c>99?'99+':c}</span>);} return null; })()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>All users</div>
                  <div style={{ display:'flex', gap:8, marginTop:6 }}>
                    {/* Future operations row for global if needed */}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Class Chats */}
          {archivedClasses !== null && classes
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
                <span style={{ fontSize: '1.5rem' }}>📚</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                    <div style={{ fontWeight: '600', flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{cls.name}</div>
                    {(() => {
                      const count = unreadCounts[cls.docId] || 0;
                      if (count > 0) {
                        return (
                          <span style={{
                            background: '#667eea', color: 'white', borderRadius: '50%', minWidth: 20, height: 20,
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
                          await setDoc(doc(db,'users',user.uid), { archivedClasses: next }, { merge: true });
                        } catch {}
                      }}
                      title={archivedClasses[cls.docId] ? 'Unarchive' : 'Archive'}
                      style={{ background:'transparent', border:'none', cursor:'pointer', color:'#888' }}
                    >{archivedClasses[cls.docId] ? '📤' : '📥'}</button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', display:'flex', justifyContent:'space-between', gap:8 }}>
                    <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{cls.lastMessage || `${cls.term} - ${cls.code}`}</span>
                    <span style={{ color:'#888' }}>{cls.lastMessageAt?.toDate?.()?.toLocaleString('en-GB') || ''}</span>
                  </div>
                  {(() => {
                    const instructor = cls.instructorId
                      ? allUsers.find(u => u.docId === cls.instructorId)
                      : allUsers.find(u => u.email === cls.ownerEmail);
                    if (!instructor) return null;
                    return (
                      <div style={{ fontSize: '0.85rem', color: '#444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>👨‍🏫 
                          {/* Instructor: */}
                        </span>
                        <strong>{instructor.displayName || instructor.email}</strong>
                        {instructor.docId !== user.uid && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openDMWith(instructor); }}
                            style={{ padding: '2px 8px', borderRadius: 6, border: 'none', background: '#667eea', color: 'white', cursor: 'pointer', fontSize: 12 }}
                          >
                            Contact
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
          {/* {!showFavoritesOnly && (
            <div style={{ padding: '0.6rem 0.9rem', color: 'var(--muted)', fontWeight: 600, fontSize:'0.85rem', borderTop: '1px solid var(--border)' }}>
              Direct Messages
            </div>
          )} */}
          {isAdmin && (
            <input
              type="text"
              placeholder="Search DMs..."
              value={dmSearch}
              onChange={(e) => setDmSearch(e.target.value)}
              style={{ margin: '0.5rem 1rem', padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.85rem', width: 'calc(100% - 2rem)' }}
            />
          )}
          {directRooms.length === 0 && (
            <div style={{ padding: '0.4rem 0.6rem', color: 'var(--muted)' }}>No conversations</div>
          )}
          {(() => {
            if (archivedRooms === null) return null; // Don't show until loaded
            let filtered = directRooms;
            // hide archived unless showArchived is on
            filtered = filtered.filter(r => showArchived || !archivedRooms[r.id]);
            // favorites only filter
            if (showFavoritesOnly) {
              filtered = filtered.filter(r => (r.starBy || []).includes(user.uid));
            }
            if (dmSearch && isAdmin) {
              const search = dmSearch.toLowerCase();
              filtered = directRooms.filter(room => {
                const otherId = (room.participants || []).find(p => p !== user.uid);
                const other = allUsers.find(u => u.docId === otherId);
                const name = other?.displayName || other?.email || '';
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
            return filtered;
          })().map(room => {
            const otherId = (room.participants || []).find(p => p !== user.uid);
            const other = allUsers.find(u => u.docId === otherId);
            const label = other?.displayName || other?.email || 'Conversation';
            const initial = (other?.displayName || other?.email || 'D')[0]?.toUpperCase();
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
                  {other?.photoURL ? (
                    <img src={other.photoURL} alt={label} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--brand),var(--brand2))', color: 'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14, fontWeight: 700 }}>{initial}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ fontWeight: 600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1 }}>{label}</div>
                      {(() => { const c = unreadCounts[`dm:${room.id}`]||0; if (c>0) { return (<span style={{background:'#667eea',color:'white',borderRadius:'50%',minWidth:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:'bold',padding:'0 5px'}}>{c>99?'99+':c}</span>);} return null; })()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display:'flex', justifyContent:'space-between', gap: 8 }}>
                      <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{room.lastMessage || ''}</span>
                      <span style={{ color:'#888', marginLeft: 8 }}>
                        {lastTime ? `${lastTime.toLocaleDateString('en-GB')} ${lastTime.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}` : ''}
                      </span>
                    </div>
                    {/* Operations row (icons) */}
                    <div style={{ display:'flex', gap:8, marginTop:6 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(room); }}
                        title={(room.starBy || []).includes(user.uid) ? 'Unfavorite' : 'Favorite'}
                        style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:6, padding:'2px 6px', cursor:'pointer', color:'#666', fontSize:'0.9rem', lineHeight:1 }}
                      >{(room.starBy||[]).includes(user.uid)?'★':'☆'}</button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const next = { ...archivedRooms };
                            if (next[room.id]) delete next[room.id]; else next[room.id] = true;
                            setArchivedRooms(next);
                            await setDoc(doc(db,'users',user.uid), { archivedRooms: next }, { merge: true });
                          } catch {}
                        }}
                        title={archivedRooms[room.id] ? 'Unarchive' : 'Archive'}
                        style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:6, padding:'2px 6px', cursor:'pointer', color:'#666', fontSize:'0.9rem', lineHeight:1 }}
                      >{archivedRooms[room.id] ? '📤' : '📥'}</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Sidebar footer: archived + favorites toggle */}
        <div style={{ padding:'0.5rem 0.9rem', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input id="toggle-archived" type="checkbox" checked={showArchived} onChange={(e)=>setShowArchived(e.target.checked)} />
            <label htmlFor="toggle-archived" style={{ fontSize:'0.85rem', color:'#666', cursor:'pointer' }}>Show archived</label>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input id="toggle-favorites" type="checkbox" checked={showFavoritesOnly} onChange={(e)=>setShowFavoritesOnly(e.target.checked)} />
            <label htmlFor="toggle-favorites" style={{ fontSize:'0.85rem', color:'#666', cursor:'pointer' }}>Favorites only</label>
          </div>
        </div>
        {/* Drag handle */}
        <div
          onMouseDown={onDragStart}
          style={{ position:'absolute', right: -3, top:0, bottom:0, width:6, cursor:'col-resize' }}
          aria-label="Resize sidebar"
        />
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
          <div>
            <h3 style={{ margin: 0 }}>
              {selectedClass === 'global' ? t('global_chat') :
               (selectedClass?.startsWith('dm:')
                 ? (()=>{ const room = directRooms.find(r=>`dm:${r.id}`===selectedClass); const otherId=(room?.participants||[]).find(p=>p!==user.uid); const other=allUsers.find(u=>u.docId===otherId); return other?.displayName || other?.email || 'Direct Message'; })()
                 : (classes.find(c => c.docId === selectedClass)?.name || selectedClassName || 'Chat')
               )}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
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
              <span style={{ fontSize: '0.9rem', color: '#666' }}>
                {messages.length} {t('messages')}
              </span>
              <button
                type="button"
                onClick={() => { setShowSearch(!showSearch); if (!showSearch) setTimeout(() => document.getElementById('msg-search')?.focus(), 100); }}
                title={t('search_messages') || 'Search messages'}
                style={{ marginLeft: 'auto', background:'transparent', border:'none', cursor:'pointer', fontSize:'1.1rem', color:'#666' }}
              >🔍</button>
            </div>
            {/* Search input - collapsible */}
            {showSearch && (
              <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)' }}>
                <input
                  value={msgQuery}
                  onChange={(e)=>setMsgQuery(e.target.value)}
                  onBlur={() => { if (!msgQuery.trim()) setShowSearch(false); }}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setMsgQuery(''); setShowSearch(false); } }}
                  id="msg-search"
                  placeholder={t('search_messages') || t('search') || 'Search'}
                  style={{ width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:8, background:'var(--panel)', color:'var(--text)' }}
                />
              </div>
            )}
          </div>
          
          {classMembers.length > 0 && !selectedClass?.startsWith('dm:') && (
            <div onClick={() => setShowMembers(true)} style={{ fontSize: '0.9rem', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>
              👥 {classMembers.length} {t('members')}
            </div>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollContainerRef} style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.9rem',
          background: 'var(--bg)'
        }}>
          {(() => {
            const q = (msgQuery || '').trim().toLowerCase();
            const list = q
              ? messages.filter(m => (m.content || '').toLowerCase().includes(q) || (m.fileName || '').toLowerCase().includes(q))
              : messages;
            if (list.length === 0) {
              return (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#999'
                }}>
                  <p style={{ fontSize: '3rem', margin: 0 }}>💬</p>
                  <p style={{ color: 'var(--muted)' }}>{t('no_messages')}</p>
                </div>
              );
            }
            const groupedByDate = [];
            let lastDate = null;
            list.forEach((msg) => {
              const msgDate = msg.createdAt?.toDate?.() || new Date();
              const dateStr = msgDate.toLocaleDateString('en-GB');
              if (dateStr !== lastDate) {
                groupedByDate.push({ type: 'date', date: msgDate, dateStr });
                lastDate = dateStr;
              }
              groupedByDate.push({ type: 'message', ...msg });
            });
            
            return groupedByDate.map((item, idx) => {
              if (item.type === 'date') {
                const today = new Date().toLocaleDateString('en-GB');
                const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-GB');
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
              const isOwnMessage = msg.senderId === user.uid;
              const senderUser = allUsers.find(u => u.docId === msg.senderId);
              const isHighlighted = highlightedMsgId === msg.id;
              const bubbleColor = isOwnMessage ? (senderUser?.messageColor || '#667eea') : 'var(--panel)';
              // Smart contrast: if highlighted, force dark readable text
              const textColor = isHighlighted ? '#1e293b' : (isOwnMessage ? 'white' : 'var(--text)');
              
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
                    background: isHighlighted ? '#fff3cd' : bubbleColor,
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
                        opacity: 0.8
                      }}>
                        {msg.senderName}
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
                                Your browser doesn't support video playback.
                              </video>
                              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                                {fileName} • {(msg.fileSize ? Math.ceil(msg.fileSize/1024) : 0)} KB
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>📎</span>
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
                        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>📊 {msg.pollQuestion}</div>
                        {msg.pollOptions?.map((option, idx) => {
                          const votes = msg.pollVotes?.[idx] || [];
                          const totalVotes = Object.values(msg.pollVotes || {}).flat().length;
                          const percentage = totalVotes > 0 ? Math.round((votes.length / totalVotes) * 100) : 0;
                          const hasVoted = votes.includes(user.uid);
                          return (
                            <button
                              key={idx}
                              onClick={async () => {
                                try {
                                  suppressAutoScrollRef.current = true;
                                  const msgRef = doc(db, 'messages', msg.id);
                                  // Initialize pollVotes if it doesn't exist
                                  const currentVotes = msg.pollVotes || {};
                                  const updates = {};
                                  
                                  // Remove user from all options
                                  msg.pollOptions.forEach((_, i) => {
                                    const currentOptionVotes = currentVotes[i] || [];
                                    if (currentOptionVotes.includes(user.uid)) {
                                      updates[`pollVotes.${i}`] = arrayRemove(user.uid);
                                    }
                                  });
                                  
                                  // Apply removals if any
                                  if (Object.keys(updates).length > 0) {
                                    await updateDoc(msgRef, updates);
                                  }
                                  
                                  // Add to selected option
                                  await updateDoc(msgRef, {
                                    [`pollVotes.${idx}`]: arrayUnion(user.uid)
                                  });
                                } catch (err) {
                                  console.error('Poll vote error:', err);
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
                              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{option}</span>
                                <span style={{ fontWeight: 600 }}>{percentage}% ({votes.length})</span>
                              </div>
                            </button>
                          );
                        })}
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                          {Object.values(msg.pollVotes || {}).flat().length} {t('votes') || 'votes'}
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
                      color: 'var(--muted)'
                    }}>
                      {msg.createdAt?.toDate?.()?.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {isOwnMessage && (() => {
                        const msgTime = msg.createdAt?.toDate?.() || new Date();
                        const recipients = selectedClass === 'global'
                          ? (allUsers || []).map(u => u.docId).filter(id => id && id !== user.uid)
                          : (selectedClass?.startsWith('dm:')
                              ? (directRooms.find(r => r.id === selectedClass.slice(3))?.participants || []).filter(id => id && id !== user.uid)
                              : (classMembers || []).map(m => m.docId).filter(id => id && id !== user.uid)
                            );
                        const readCount = recipients.filter(id => memberReads[id] && memberReads[id] >= msgTime).length;
                        const allRead = recipients.length > 0 && readCount === recipients.length;
                        const anyRead = readCount > 0;
                        const style = { marginLeft: 6, fontWeight: 700, color: allRead ? '#3aa0ff' : (anyRead ? '#999' : '#999'), cursor: 'pointer' };
                        const tooltip = `Seen by ${readCount} of ${recipients.length}`;
                        return (
                          <span
                            style={style}
                            title={tooltip}
                            onClick={(e)=>{
                              e.stopPropagation();
                              const list = (recipients||[]).map(uid => ({
                                uid,
                                name: (allUsers||[]).find(u=>u.docId===uid)?.displayName || (allUsers||[]).find(u=>u.docId===uid)?.email || uid,
                                readAt: memberReads[uid]
                              })).sort((a,b)=> (b.readAt?.getTime?.()||0) - (a.readAt?.getTime?.()||0));
                              setReceiptsFor({ id: msg.id, list, readCount, total: recipients.length });
                            }}
                          >{anyRead ? '✓✓' : '✓'}</span>
                        );
                      })()}
                    </div>
                    {/* Emoji Reactions - Single per user */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (() => {
                      // Determine top emojis (most reactions)
                      const counts = {};
                      Object.values(msg.reactions || {}).forEach(emo => {
                        const isEmoji = typeof emo === 'string' && emo.length <= 3 && !/^[A-Za-z0-9+/_=-]+$/.test(emo);
                        if (!isEmoji) return;
                        counts[emo] = (counts[emo] || 0) + 1;
                      });
                      const topList = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3);
                      if (topList.length === 0) return null;
                      return (
                        <div style={{ position:'absolute', left: isOwnMessage? -22 : 'auto', right: isOwnMessage? 'auto' : -22, top: '50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:4 }}>
                          {topList.map(([emo, n]) => {
                            const active = msg.reactions[user.uid] === emo;
                            return (
                              <button key={emo}
                                onClick={async ()=>{
                                  try {
                                    const msgRef = doc(db, 'messages', msg.id);
                                    if (active) {
                                      await updateDoc(msgRef, { [`reactions.${user.uid}`]: deleteField() });
                                    } else {
                                      await updateDoc(msgRef, { [`reactions.${user.uid}`]: emo });
                                    }
                                  } catch {}
                                }}
                                title={`${n}`}
                                style={{ background:'white', border:'1px solid #eee', borderRadius:12, padding:'2px 6px', fontSize:'0.85rem', cursor:'pointer', boxShadow:'0 2px 6px rgba(0,0,0,0.06)', opacity: active?1:0.9 }}
                              >{emo} {n}</button>
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
                      title="React"
                      style={{ 
                        position:'absolute', 
                        bottom: -10, 
                        [isOwnMessage?'right':'left']: -14, 
                        background:'white', 
                        border:'1px solid var(--border)', 
                        borderRadius:'50%', 
                        width:28, 
                        height:28, 
                        display:'flex', 
                        alignItems:'center', 
                        justifyContent:'center', 
                        cursor:'pointer', 
                        fontSize:'1.1rem', 
                        padding:0, 
                        lineHeight:1, 
                        boxShadow:'0 2px 6px rgba(0,0,0,0.1)', 
                        opacity:0.9, 
                        transition:'opacity 0.2s' 
                      }}
                      onMouseEnter={(e)=>e.currentTarget.style.opacity='1'}
                      onMouseLeave={(e)=>e.currentTarget.style.opacity='0.9'}
                    >
                      <span aria-hidden="true" style={{ filter:'grayscale(100%) contrast(0.9)', opacity:0.65, display:'inline-block', transform:'translateY(1px)' }}>😊</span>
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
                          background: 'rgba(20,20,20,0.96)',
                          border: 'none',
                          borderRadius: 16,
                          padding: '0.4rem 0.6rem',
                          boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
                          zIndex: 50,
                          display: 'flex',
                          gap: '0.35rem'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {['👍','❤️','😂','😮','😢','🙏'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={async () => {
                              try {
                                const msgRef = doc(db, 'messages', reactionMenu.msgId);
                                await updateDoc(msgRef, { [`reactions.${user.uid}`]: emoji });
                                setReactionMenu(null);
                              } catch {}
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              fontSize: '1.6rem',
                              cursor: 'pointer',
                              padding: '0.35rem 0.45rem',
                              borderRadius: 10,
                              transition: 'transform 0.12s ease, background 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Three-dots inline menu */}
                    {(isOwnMessage || isAdmin) && (
                      <button
                        onMouseDown={(e)=>e.stopPropagation()}
                        onClick={(e)=>{ e.stopPropagation(); setMenuOpenId(menuOpenId===msg.id?null:msg.id); }}
                        title="More"
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
                            style={{ display:'block', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color:'var(--text)', transition:'background 0.2s' }}
                          >
                            {t('edit')||'Edit'}
                          </button>
                        )}
                        <button
                          onClick={()=>{
                            setReceiptsFor({ 
                              id: msg.id, 
                              list: (() => {
                                const msgTime = msg.createdAt?.toDate?.() || new Date();
                                const recipients = selectedClass === 'global'
                                  ? (allUsers || []).map(u => u.docId).filter(id => id && id !== user.uid)
                                  : (selectedClass?.startsWith('dm:')
                                      ? (directRooms.find(r => r.id === selectedClass.slice(3))?.participants || []).filter(id => id && id !== user.uid)
                                      : (classMembers || []).map(m => m.docId).filter(id => id && id !== user.uid)
                                    );
                                return recipients.map(uid => ({
                                  uid,
                                  name: (allUsers||[]).find(u=>u.docId===uid)?.displayName || (allUsers||[]).find(u=>u.docId===uid)?.email || uid,
                                  readAt: memberReads[uid]
                                })).sort((a,b)=> (b.readAt?.getTime?.()||0) - (a.readAt?.getTime?.()||0));
                              })(),
                              readCount: (() => {
                                const msgTime = msg.createdAt?.toDate?.() || new Date();
                                const recipients = selectedClass === 'global'
                                  ? (allUsers || []).map(u => u.docId).filter(id => id && id !== user.uid)
                                  : (selectedClass?.startsWith('dm:')
                                      ? (directRooms.find(r => r.id === selectedClass.slice(3))?.participants || []).filter(id => id && id !== user.uid)
                                      : (classMembers || []).map(m => m.docId).filter(id => id && id !== user.uid)
                                    );
                                return recipients.filter(id => memberReads[id] && memberReads[id] >= msgTime).length;
                              })(),
                              total: (() => {
                                const recipients = selectedClass === 'global'
                                  ? (allUsers || []).map(u => u.docId).filter(id => id && id !== user.uid)
                                  : (selectedClass?.startsWith('dm:')
                                      ? (directRooms.find(r => r.id === selectedClass.slice(3))?.participants || []).filter(id => id && id !== user.uid)
                                      : (classMembers || []).map(m => m.docId).filter(id => id && id !== user.uid)
                                    );
                                return recipients.length;
                              })()
                            });
                            setMenuOpenId(null);
                          }}
                          onMouseEnter={(e)=>e.target.style.background='rgba(102,126,234,0.1)'}
                          onMouseLeave={(e)=>e.target.style.background='transparent'}
                          style={{ display:'block', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color:'var(--brand)', transition:'background 0.2s', borderBottom:'1px solid var(--border)' }}
                        >
                          ℹ️ {t('info')||'Info'}
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
                          style={{ display:'block', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color:'var(--brand)', transition:'background 0.2s', borderBottom:'1px solid var(--border)' }}
                        >
                          🔗 {t('share')||'Share'}
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
                          style={{ display:'block', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color:'var(--brand)', transition:'background 0.2s', borderBottom:'1px solid var(--border)' }}
                        >
                          📋 {t('copy')||'Copy'}
                        </button>
                        {(isOwnMessage || isAdmin) && (
                          <button
                            onClick={()=>{ setMenuOpenId(null); handleDeleteMessage(msg); }}
                            onMouseEnter={(e)=>e.target.style.background='rgba(220,53,69,0.1)'}
                            onMouseLeave={(e)=>e.target.style.background='transparent'}
                            style={{ display:'block', background:'transparent', border:'none', padding:'8px 12px', width:'100%', textAlign:'start', cursor:'pointer', color:'#dc3545', transition:'background 0.2s' }}
                          >
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
            title={t('jump_to_bottom') || 'Jump to bottom'}
            style={{ position:'fixed', right: 24, bottom: 110, background:'#fff', border:'1px solid var(--border)', borderRadius: 20, padding:'8px 10px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', cursor:'pointer', zIndex: 20 }}
          >⬇️</button>
        )}
        {/* Bottom search removed - now under top header */}

        {/* Input Area */}
        <div style={{
          padding: '1rem',
          background: 'var(--panel)',
          borderTop: '1px solid var(--border)'
        }}>
          {/* Recording Preview */}
          {audioBlob && (
            <div style={{
              padding: '1rem',
              background: 'rgba(0,0,0,0.06)',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🎤</span>
                <div>
                  <div style={{ fontWeight: '600' }}>Voice Message Ready</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                    Duration: {formatTime(recordingTime)}
                  </div>
                </div>
              </div>
              <button
                onClick={cancelRecording}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ✕ Cancel
              </button>
            </div>
          )}

          {/* File Attachment Preview */}
          {attachedFile && (
            <div style={{
              padding: '1rem',
              background: '#f0f0f0',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📎</span>
                <div>
                  <div style={{ fontWeight: '600' }}>{attachedFile.name}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                    {(attachedFile.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAttachedFile(null)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ✕ Remove
              </button>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
            <input
              ref={messageInputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('type_message')}
              disabled={isRecording || !!audioBlob || !!attachedFile}
              style={{
                flex: 1,
                padding: '0.6rem 0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
            
            {/* Compact Action Buttons */}
            {!audioBlob && !attachedFile && (
              <>
                {/* Emoji Picker */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{
                    padding: '0.6rem',
                    background: 'transparent',
                    color: 'var(--muted)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.3rem'
                  }}
                  title="Emoji"
                >
                  😊
                </button>
                
                {/* Poll (Admin Only) */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowPollModal(true)}
                    style={{
                      padding: '0.6rem',
                      background: 'transparent',
                      color: 'var(--muted)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.3rem'
                    }}
                    title="Create Poll"
                  >
                    📊
                  </button>
                )}
              </>
            )}
                  {/* Emoji Picker with categories */}
            {showEmojiPicker && (
              <div
                id="emoji-picker"
                className="pop-in"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  marginBottom: '0.5rem',
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '0.5rem',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                  zIndex: 1000,
                  width: 360
                }}>
                <div style={{ display:'flex', gap:6, borderBottom:'1px solid var(--border)', padding:'6px', alignItems:'center' }}>
                  {[
                    ['smileys','😊'], ['hearts','❤️'], ['gestures','👍'], ['party','🎉'], ['animals','🐶'], ['food','🍕'], ['travel','✈️'], ['objects','📱'], ['sports','🏀'], ['weather','☀️'], ['symbols','♻️'], ['flags','🏳️‍🌈']
                  ].map(([cat, icon]) => (
                    <button key={cat} onClick={()=>setEmojiCategory(cat)} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:'1.1rem', padding:'4px 6px', borderRadius:6, color: emojiCategory===cat?'var(--brand)':'var(--text)' }}>{icon}</button>
                  ))}
                  <input
                    type="text"
                    value={emojiSearch}
                    onChange={(e)=>setEmojiSearch(e.target.value)}
                    placeholder="Search"
                    style={{ marginLeft:'auto', padding:'4px 8px', border:'1px solid var(--border)', borderRadius:6, fontSize:'0.85rem', width:120 }}
                  />
                </div>
                {(() => {
                  const sets = {
                    smileys: ['😀','😃','😄','😁','😆','😅','😂','🤣','🙂','😊','😉','🥰','😍','😘','😗','🤗','😎','🤔','😇','😴','🥳','😱','🤯','😢','😡','🤤','🤫','🤭','🤝','🙏'],
                    hearts: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💖','💕','💓','💗','💝','💞','💘'],
                    gestures: ['👍','👎','👌','✌️','👏','🙌','🤝','💪','🙏','👋','🤟','🤙'],
                    party: ['🎉','✨','🎊','🎈','🎁','💯','🌟','⭐','🌈'],
                    animals: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷'],
                    food: ['🍏','🍎','🍓','🍇','🍑','🍍','🥝','🍕','🍔','🍟','🌮','🍿','🎂','🍰','☕','🍺','🍻','🥂','🍷','🍹'],
                    travel: ['🚗','🚌','🚕','🚀','✈️','🛫','🛬','🚉','🚇','⛱️','🏖️','🏝️'],
                    objects: ['📱','💻','⌚','📷','📺','🎮','🎧','🎤','🎵','🎶','📌','📎','🔔','🔒'],
                    sports: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🥏','⛳','🏓','🏸','🥊','🥋','🎳','⛷️','🏂','🏊‍♂️','🚴‍♀️','🏃‍♂️','🏆','🥇','🥈','🥉'],
                    weather: ['☀️','🌤️','⛅','🌥️','☁️','🌧️','⛈️','🌩️','❄️','🌨️','🌪️','🌈','🌫️','💨','☔'],
                    symbols: ['✔️','✖️','➕','➖','❤️','❗','❓','⭐','✨','🔥','💯','♻️','🔞','⚠️','♠️','♥️','♦️','♣️'],
                    flags: ['🏳️','🏴','🏁','🚩','🏳️‍🌈','🇺🇸','🇬🇧','🇪🇺','🇸🇦','🇦🇪','🇯🇴','🇶🇦','🇪🇬','🇹🇷','🇮🇳','🇵🇰']
                  };
                  let list = sets[emojiCategory] || sets.smileys;
                  if (emojiSearch.trim()) {
                    const q = emojiSearch.trim().toLowerCase();
                    // naive filter: map certain keywords
                    const tags = {
                      smileys: ['smile','happy','face','laugh','sad','angry','sleep'],
                      hearts: ['love','heart'],
                      gestures: ['thumb','ok','clap','pray','hi','hand','muscle'],
                      party: ['party','sparkle','gift','star','rainbow'],
                      animals: ['dog','cat','panda','bear','lion','tiger','cow','pig'],
                      food: ['pizza','burger','coffee','cake','beer','wine'],
                      travel: ['car','bus','rocket','plane','beach'],
                      objects: ['phone','laptop','watch','camera','tv','game','bell','lock']
                    };
                    // If search includes a known tag, switch category to broaden
                    for (const [cat, words] of Object.entries(tags)) {
                      if (words.some(w => q.includes(w))) {
                        list = sets[cat];
                        break;
                      }
                    }
                  }
                  return (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(10, 1fr)', gap:6, padding:'8px' }}>
                      {list.map(emoji => (
                        <button key={emoji} type="button"
                          onClick={() => { setNewMessage(prev => prev + emoji); messageInputRef.current?.focus(); }}
                          style={{ background:'transparent', border:'none', fontSize:'1.4rem', cursor:'pointer', padding:4, borderRadius:6 }}
                          onMouseEnter={(e)=>e.currentTarget.style.background='rgba(0,0,0,0.05)'}
                          onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
                        >{emoji}</button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* File Attachment */}
            {!audioBlob && !attachedFile && (
              <label style={{
                padding: '0.6rem',
                background: 'transparent',
                color: 'var(--muted)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.3rem'
              }} title={t('attach') || 'Attach'}>
                📎
                <input
                  type="file"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                />
              </label>
            )}

            {/* Single primary button: Mic when empty, Send when has content */}
            <button
              type={(newMessage.trim() || audioBlob || attachedFile) ? 'submit' : 'button'}
              onClick={() => {
                if (!(newMessage.trim() || audioBlob || attachedFile)) {
                  if (isRecording) { stopRecording(); } else { startRecording(); }
                }
              }}
              disabled={false}
              className={!newMessage.trim() && !audioBlob && !attachedFile && isRecording ? 'recording-blink' : ''}
              style={{
                marginLeft: '0.5rem',
                background: (newMessage.trim() || audioBlob || attachedFile) ? 'linear-gradient(135deg, #667eea, #764ba2)' : (isRecording ? '#f44336' : 'linear-gradient(135deg, #efefef, #ddd)'),
                color: (newMessage.trim() || audioBlob || attachedFile) ? '#fff' : (isRecording ? '#fff' : '#555'),
                border: 'none',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(102,126,234,0.4)'
              }}
              title={(newMessage.trim() || audioBlob || attachedFile) ? (t('send')||'Send') : (isRecording ? (t('stop_recording')||'Stop Recording') : (t('record_voice')||'Record Voice'))}
            >
              {(newMessage.trim() || audioBlob || attachedFile) ? '📤' : (isRecording ? '⏹️' : '🎤')}
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
          📥 Clear Their Messages
        </button>)}
      </div>
    )}

    {/* Poll Creation Modal */}
    {showPollModal && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2200 }} onClick={()=>setShowPollModal(false)}>
        <div style={{ background:'var(--panel)', color:'var(--text)', border:'1px solid var(--border)', padding:'1.5rem', borderRadius:12, minWidth:400, maxWidth:600, width:'90%' }} onClick={(e)=>e.stopPropagation()}>
          <h3 style={{ marginTop:0, marginBottom:'1rem' }}>📊 {t('create_poll') || 'Create Poll'}</h3>
          <label style={{ display:'block', marginBottom:8, fontWeight:600 }}>{t('question') || 'Question'}</label>
          <input
            type="text"
            value={pollQuestion}
            onChange={(e)=>setPollQuestion(e.target.value)}
            placeholder="What's your question?"
            style={{ width:'100%', padding:'0.75rem', border:'1px solid var(--border)', borderRadius:8, marginBottom:'1rem', background:'var(--panel)', color:'var(--text)' }}
          />
          <label style={{ display:'block', marginBottom:8, fontWeight:600 }}>{t('options') || 'Options'}</label>
          {pollOptions.map((opt, idx) => (
            <div key={idx} style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input
                type="text"
                value={opt}
                onChange={(e)=>{
                  const newOpts = [...pollOptions];
                  newOpts[idx] = e.target.value;
                  setPollOptions(newOpts);
                }}
                placeholder={`Option ${idx + 1}`}
                style={{ flex:1, padding:'0.75rem', border:'1px solid var(--border)', borderRadius:8, background:'var(--panel)', color:'var(--text)' }}
              />
              {pollOptions.length > 2 && (
                <button
                  onClick={()=>setPollOptions(pollOptions.filter((_,i)=>i!==idx))}
                  style={{ padding:'0.75rem', background:'#dc3545', color:'white', border:'none', borderRadius:8, cursor:'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={()=>setPollOptions([...pollOptions, ''])}
            style={{ padding:'0.5rem 1rem', background:'var(--brand)', color:'white', border:'none', borderRadius:8, cursor:'pointer', marginBottom:'1rem' }}
          >
            + {t('add_option') || 'Add Option'}
          </button>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button onClick={()=>{setShowPollModal(false); setPollQuestion(''); setPollOptions(['','']);}} style={{ padding:'0.5rem 1rem', background:'#6c757d', color:'white', border:'none', borderRadius:8, cursor:'pointer' }}>{t('cancel')||'Cancel'}</button>
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
                    createdAt: serverTimestamp()
                  };
                  await addDoc(collection(db, 'messages'), pollData);
                  setShowPollModal(false);
                  setPollQuestion('');
                  setPollOptions(['','']);
                  toast?.showSuccess('Poll created!');
                } catch (err) {
                  console.error('Failed to create poll:', err);
                  toast?.showError('Failed to create poll');
                }
              }}
              style={{ padding:'0.5rem 1rem', background:'linear-gradient(135deg, #667eea, #764ba2)', color:'white', border:'none', borderRadius:8, cursor:'pointer' }}
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
            <button onClick={handleSaveEdit} style={{ background:'linear-gradient(135deg, #667eea, #764ba2)', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px', cursor:'pointer' }}>{t('save')||'Save'}</button>
          </div>
        </div>
      </div>
    )}

    {/* Members Side Drawer */}
    {showMembers && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }} onClick={()=>setShowMembers(false)}>
        {/* drawer */}
        <div onClick={(e)=>e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 360, background: 'white', boxShadow: '-4px 0 16px rgba(0,0,0,0.15)', padding: '1rem', pointerEvents: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Class Members</h3>
            <button onClick={()=>setShowMembers(false)} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>
          {/* search + filter */}
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
          <div style={{ overflowY: 'auto' }}>
            {(() => {
              let filtered = classMembers || [];
              if (memberSearch) {
                const search = memberSearch.toLowerCase();
                filtered = filtered.filter(m => 
                  (m.displayName || '').toLowerCase().includes(search) ||
                  (m.email || '').toLowerCase().includes(search)
                );
              }
              if (studentsOnly) {
                filtered = filtered.filter(m => m.role === 'student');
              }
              return filtered;
            })().map(m => (
              <div key={m.docId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#667eea', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {(m.displayName || m.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {m.displayName || m.email}
                      {m.role === 'admin' && (
                        <span style={{ fontSize: '0.7rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Admin</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>{m.email}</div>
                  </div>
                </div>
                <button onClick={()=>openDMWith(m)} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', cursor: 'pointer' }}>Start DM</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default ChatPage;
