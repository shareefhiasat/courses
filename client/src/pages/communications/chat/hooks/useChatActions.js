/**
 * Chat Actions Hook
 * Manages all chat-related actions and operations
 */

import { useCallback, useRef } from 'react';
import { chatService } from '@services/business/chatService';
import { getChatServerTimestamp, uploadChatFile, deleteChatFile } from '@services/business/chatRealtimeService';
import { addNotification } from '@services/business/notificationService';
import { getUsers } from '@services/business/userService';
import { filterBadWords } from '@utils/badWordFilter';
import { canParticipate } from '@utils/userStatus';
import { ActivityLogger } from '@services/other/activityLogger';
import { info, error, warn, debug } from '@services/utils/logger.js';
import {
  MESSAGE_TYPES,
  CHAT_TYPES,
  FILE_UPLOAD_LIMITS,
  CLEAR_MESSAGE_MODES
} from '../constants/chatConstants';
import {
  getChatType,
  getChatId,
  formatTime,
  getMaxVoiceTimeDisplay,
  validateMessage,
  validatePoll,
  isFileTypeAllowed,
  sanitizeFilename,
  generateShareUrl,
  canDeleteMessage,
  canEditMessage,
  normalizeChatUser
} from '../utils/chatHelpers';

export const useChatActions = (user, state, toast, t) => {
  const {
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
    setAttachedFile,
    setUserHasInteracted,
    profileName,
    safeAllUsers,
    safeDirectRooms,
    setDirectRooms,
    safeClassMembers,
    memberReads,
    receiptsFor,
    setReceiptsFor,
    recordingTime,
    setIsRecording,
    setRecordingTime,
    setAudioBlob,
    setImagePreview,
    setShowPollModal,
    pollQuestion,
    pollOptions,
    resetPollState
  } = state;

  // Refs for recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  // Load class members
  const loadClassMembers = useCallback(async (classId) => {
    info('loadClassMembers called', { 
      classId, 
      hasUser: !!user,
      userId: user?.uid,
      safeAllUsersLength: safeAllUsers.length
    });
    
    if (!user) {
      warn('loadClassMembers early return - no user');
      return;
    }
    
    if (classId === 'global') {
      info('Loading global chat members');
      if (safeAllUsers.length > 0) {
        info('Using cached allUsers for global chat', { count: safeAllUsers.length });
        const normalized = safeAllUsers.map(normalizeChatUser);
        state.setClassMembers(normalized.filter(u => u.docId !== user.uid && u.email !== user.email));
      } else {
        info('Fetching allUsers for global chat');
        const usersResult = await getUsers();
        const all = (usersResult.success ? (usersResult.data || []) : []).map(normalizeChatUser);
        info('Fetched allUsers', { count: all.length, success: usersResult.success });
        state.setAllUsers(all);
        state.setClassMembers(all.filter(u => u.docId !== user.uid && u.email !== user.email));
      }
      return;
    }
    
    info('Loading class members', { classId });
    
    let allUsersToUse;
    if (safeAllUsers.length > 0) {
      allUsersToUse = safeAllUsers.map(normalizeChatUser);
    } else {
      info('Fetching allUsers for class members');
      const result = await getUsers();
      allUsersToUse = (result.success ? (result.data || []) : []).map(normalizeChatUser);
    }
    
    let members = allUsersToUse.filter(u => 
      Array.isArray(u.enrolledClasses) && 
      u.enrolledClasses.includes(classId) && 
      u.docId !== user.uid && 
      u.email !== user.email
    );
    
    // Ensure instructor/owner is included at top
    try {
      const cls = state.safeClasses.find(c => c.docId === classId);
      const instructor = cls?.instructorId ? allUsersToUse.find(u => u.docId === cls.instructorId)
                        : allUsersToUse.find(u => u.email === cls?.ownerEmail);
      if (instructor && instructor.docId !== user.uid && instructor.email !== user.email && 
          !members.some(m => m.docId === instructor.docId)) {
        members = [instructor, ...members];
      }
    } catch {}
    
    // Include platform admins
    const admins = allUsersToUse.filter(u => u.role === 'admin' && u.docId !== user.uid && u.email !== user.email);
    admins.forEach(a => { 
      if (!members.some(m => m.docId === a.docId)) members.push(a); 
    });
    
    info('Setting class members', { 
      classId, 
      membersCount: members.length,
      adminsCount: admins.length
    });
    
    state.setClassMembers(members);
    
    if (safeAllUsers.length === 0) {
      info('Updating allUsers cache', { count: allUsersToUse.length });
      state.setAllUsers(allUsersToUse);
    }
  }, [user, safeAllUsers, state]);

  // Send message
  const handleSendMessage = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    if (!newMessage.trim() && !audioBlob && !attachedFile || isUploading) return;
    
    setIsUploading(true);
    
    // Check user participation (skip for staff roles and global chat)
    try {
      const isStaffRole = state?.isAdmin || state?.isSuperAdmin || state?.isInstructor || state?.isHR;
      const isGlobalChat = selectedClass === 'global' || selectedClass === CHAT_TYPES.GLOBAL;
      if (!isStaffRole && !isGlobalChat) {
        const participationCheck = canParticipate(profileName || user, []);
        if (!participationCheck) {
          toast?.showError?.('You cannot send messages. Your account is disabled, archived, or you have no active enrollments.');
          setIsUploading(false);
          return;
        }
      }
    } catch (err) {
      // Continue anyway - don't block if status check fails
    }
    
    try {
      const chatType = getChatType(selectedClass);
      const chatId = getChatId(selectedClass);
      
      const messageData = {
        senderId: user.uid,
        senderName: user.displayName || profileName || user.email,
        senderEmail: user.email,
        chatType: chatType,
        type: chatType,
        classId: chatType === CHAT_TYPES.CLASS ? chatId : null,
        roomId: (chatType === CHAT_TYPES.DM || chatType === CHAT_TYPES.GROUP) ? chatId : null,
        createdAt: getChatServerTimestamp(),
        readBy: [user.uid]
      };
      
      // Handle voice message
      if (audioBlob) {
        try {
          const voicePath = `voice-messages/${Date.now()}_${user.uid}.webm`;
          const metadata = {
            contentType: audioBlob.type || 'audio/webm',
            cacheControl: 'public, max-age=31536000',
            customMetadata: {
              uploadedBy: user.uid,
              timestamp: Date.now().toString()
            }
          };

          const { fileUrl: voiceUrl, filePath: actualVoicePath } = await uploadChatFile(voicePath, audioBlob, metadata);
          messageData.messageType = MESSAGE_TYPES.VOICE;
          messageData.voiceUrl = voiceUrl;
          messageData.voicePath = actualVoicePath || voicePath;
          messageData.duration = recordingTime;
          messageData.content = '[Voice Message]';
        } catch (uploadError) {
          error('Voice upload failed:', uploadError);
          toast?.showError(t('voice_upload_failed'));
          setIsUploading(false);
          return;
        }
      } else if (attachedFile) {
        // File attachment
        const safeName = sanitizeFilename(attachedFile.name);
        const filePath = `chat-attachments/${Date.now()}_${user.uid}_${safeName}`;
        const { fileUrl, filePath: actualFilePath } = await uploadChatFile(filePath, attachedFile);
        
        messageData.messageType = MESSAGE_TYPES.FILE;
        messageData.fileUrl = fileUrl;
        messageData.filePath = actualFilePath || filePath;
        messageData.fileName = attachedFile.name;
        messageData.fileSize = attachedFile.size;
        messageData.fileType = attachedFile.type;
        messageData.content = `[File: ${attachedFile.name}]`;
      } else {
        // Text message
        const originalContent = newMessage.trim();
        const filteredContent = filterBadWords(originalContent);
        
        messageData.messageType = MESSAGE_TYPES.TEXT;
        messageData.content = filteredContent;
        
        if (originalContent !== filteredContent) {
          toast?.showWarning(t('message_filtered_inappropriate'));
        }
      }
      
      const added = await chatService.sendMessage(messageData);

      // Log message sent activity
      try {
        await ActivityLogger.messageSent({
          messageId: added.id,
          messageType: messageData.messageType,
          chatType: chatType,
          classId: messageData.classId,
          roomId: messageData.roomId,
          contentLength: messageData.content?.length || 0,
          hasAttachment: !!(messageData.voiceUrl || messageData.fileUrl)
        });
      } catch (logError) {
        warn('Failed to log message sent activity:', logError);
      }

      // Notify for global chat
      if (chatType === CHAT_TYPES.GLOBAL) {
        try {
          const preview = messageData.messageType === MESSAGE_TYPES.TEXT ? messageData.content
            : (messageData.messageType === MESSAGE_TYPES.VOICE ? '[Voice Message]'
              : (messageData.messageType === MESSAGE_TYPES.FILE ? `[File: ${messageData.fileName}]` : 'Message'));
          const usersRes = await getUsers();
          const others = (usersRes.data || []).filter(u => u.docId !== user.uid);
          for (const u2 of others) {
            await addNotification({
              userId: u2.docId,
              title: '💬 Global Chat',
              message: `${(profileName || user.displayName || user.email)}: ${preview.substring(0, 120)}`,
              type: 'chat',
              data: { type: CHAT_TYPES.GLOBAL, messageId: added.id }
            });
          }
        } catch {}
      }
      
      resetInputState();
    } catch (err) {
      error('Error sending message:', err);
      toast?.showError(t('failed_to_send'));
    } finally {
      setIsUploading(false);
    }
  }, [
    newMessage, audioBlob, attachedFile, isUploading, selectedClass, user, 
    profileName, toast, recordingTime, resetInputState, state
  ]);

  // File selection
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!isFileTypeAllowed(file)) {
      toast?.showError(t('chat_file_type_not_allowed'));
      e.target.value = '';
      return;
    }
    
    if (file.size > FILE_UPLOAD_LIMITS.MAX_TOTAL_SIZE) {
      const maxSizeMB = FILE_UPLOAD_LIMITS.MAX_TOTAL_SIZE / (1024 * 1024);
      toast?.showError(t('file_too_large_max').replace('{max}', maxSizeMB));
      e.target.value = '';
      return;
    }
    
    state.setAttachedFile(file);
    
    // Create image preview if it's an image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        state.setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      state.setImagePreview(null);
    }
    
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    toast?.showSuccess(`File "${file.name}" attached (${fileSizeMB}MB)`);
  }, [toast, state]);

  // Voice recording
  const startRecording = useCallback(async () => {
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
        state.setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at role-based time limit
          const userRole = user?.role || 'student';
          const maxTime = getMaxVoiceTimeDisplay(userRole);
          if (newTime >= parseInt(maxTime) * 60) {
            stopRecording();
            toast?.showInfo(t('max_recording_time_reached').replace('{max}', maxTime));
          }
          return newTime;
        });
      }, 1000);
      
    } catch (err) {
      error('Error starting recording:', err);
      toast?.showError(t('microphone_access_denied'));
    }
  }, [user, toast, state]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  }, []);

  const cancelRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingTime(0);
    setAudioBlob(null);
    clearInterval(recordingIntervalRef.current);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Message actions
  const handleDeleteMessage = useCallback(async (msg) => {
    if (!canDeleteMessage(msg, user?.dbId ?? user.uid, user.isAdmin)) return;
    
    try {
      // Delete storage files if any
      if (msg.voicePath) {
        try { await deleteChatFile(msg.voicePath); } catch {}
      }
      if (msg.filePath) {
        try { await deleteChatFile(msg.filePath); } catch {}
      }
      
      await chatService.deleteMessage(msg.id);
      
      // Immediately remove from local state for instant UI feedback
      setMessages(prev => (prev || []).filter(m => m.id !== msg.id));
      
      // Update lastMessage if needed
      if (msg.type === 'class' && msg.classId) {
        try {
          await chatService.updateLastMessageAfterDeletion(msg);
        } catch (e) {}
      }
      
      if (msg.type === 'dm' && msg.roomId) {
        try {
          await chatService.updateLastMessageAfterDeletion(msg);
        } catch (e) {}
      }
      
      toast?.showSuccess(t('message_deleted'));
    } catch (err) {
      error('Delete message failed:', err);
      toast?.showError(t('failed_to_delete_message'));
    }
  }, [user, toast, setMessages]);

  const handleSaveEdit = useCallback(async () => {
    if (!state.editingMsg || !state.editingMsg.id) {
      setEditingMsg(null);
      return;
    }
    
    try {
      const originalContent = (state.editingMsg.content || '').trim();
      const filteredContent = filterBadWords(originalContent);
      
      await chatService.editMessage(state.editingMsg.id, filteredContent);

      if (originalContent !== filteredContent) {
        warn('Message content filtered for inappropriate content', {
          originalLength: originalContent.length,
          filteredLength: filteredContent.length,
          userId: user?.uid
        });
        toast?.showWarning(t('chat_message_filtered_inappropriate_content'));
      }

      // Update local state immediately for instant UI feedback
      setMessages(prev => (prev || []).map(m =>
        m.id === state.editingMsg.id ? { ...m, content: filteredContent, edited: true, editedAt: new Date().toISOString() } : m
      ));

      setEditingMsg(null);
      toast?.showSuccess(t('chat_saved'));
    } catch (e) {
      error('Edit failed', e);
      toast?.showError(t('chat_failed_to_save'));
    }
  }, [state.editingMsg, user, toast, t, setEditingMsg, setMessages]);

  // DM actions
  const openDMWith = useCallback(async (otherUser) => {
    const otherUserId = otherUser?.docId || otherUser?.id || otherUser?.uid;
    const otherUserDbId = otherUser?.id;
    
    if (!otherUserId) {
      warn('openDMWith validation failed', { 
        otherUserId,
        currentUserId: user?.uid
      });
      return;
    }
    
    try {
      const roomId = await chatService.createDMRoom(user.uid, otherUserDbId || otherUserId);
      setSelectedClass(`dm:${roomId}`);
      setShowMembers(false);
    } catch (err) {
      error('Open DM failed:', err);
      toast?.showError(t('failed_to_start_conversation'));
    }
  }, [user, setSelectedClass, setShowMembers, toast]);

  const toggleStar = useCallback(async (room) => {
    try {
      const result = await chatService.toggleStarRoom(room.id, user.uid);
      if (result?.success) {
        // Update local state so UI reflects the change immediately
        const starredSet = new Set(result.starred || []);
        if (setDirectRooms) {
          setDirectRooms(prev => (Array.isArray(prev) ? prev : []).map(r => ({
            ...r,
            starBy: starredSet.has(String(r.id)) ? [user.uid] : []
          })));
        }
      }
    } catch (e) { 
      /* noop */ 
    }
  }, [user, setDirectRooms]);

  const clearDMMessages = useCallback(async (roomId, mode = CLEAR_MESSAGE_MODES.ALL) => {
    if (!user.isAdmin && (mode === CLEAR_MESSAGE_MODES.ALL || mode === CLEAR_MESSAGE_MODES.THEIRS)) {
      toast?.showError(t('only_admins_can_clear'));
      return;
    }
    
    try {
      const deletedCount = await chatService.clearChatMessages(roomId, mode, user.uid);
      
      setDmContextMenu(null);
      const modeLabel = mode === CLEAR_MESSAGE_MODES.ALL ? t('all_messages') : 
                       mode === CLEAR_MESSAGE_MODES.MINE ? t('your_messages') : 
                       t('their_messages');
      toast?.showSuccess(`${modeLabel} ${t('cleared')}`);
    } catch (err) {
      error('Clear messages failed:', err);
      toast?.showError(t('failed_to_clear_messages'));
    }
  }, [user, toast, t, setDmContextMenu]);

  const deleteDMConversation = useCallback(async () => {
    if (!user.isAdmin) return;
    
    try {
      const room = safeDirectRooms.find(r => `dm:${r.id}` === selectedClass);
      if (!room) return setShowDeleteDMConfirm(false);
      
      const roomId = room.id;
      await chatService.deleteDirectRoom(roomId);
      setShowDeleteDMConfirm(false);
      setSelectedClass('global');
      toast?.showSuccess(t('conversation_deleted'));
    } catch (err) {
      error('Delete conversation failed:', err);
      toast?.showError(t('failed_to_delete_conversation'));
    }
  }, [user, safeDirectRooms, selectedClass, setShowDeleteDMConfirm, setSelectedClass, toast]);

  // Poll actions
  const createPoll = useCallback(async () => {
    const validation = validatePoll(pollQuestion, pollOptions);
    if (!validation.isValid) {
      toast?.showError(validation.error);
      return;
    }
    
    try {
      const chatType = getChatType(selectedClass);
      const chatId = getChatId(selectedClass);
      
      const pollData = {
        chatType: chatType,
        type: chatType,
        classId: chatType === CHAT_TYPES.CLASS ? chatId : null,
        roomId: (chatType === CHAT_TYPES.DM || chatType === CHAT_TYPES.GROUP) ? chatId : null,
        senderId: user.uid,
        senderName: profileName || user.displayName || user.email,
        messageType: MESSAGE_TYPES.POLL,
        pollQuestion: pollQuestion.trim(),
        pollOptions: pollOptions.filter(o => o.trim()),
        pollVotes: {},
        createdAt: getChatServerTimestamp()
      };
      
      await chatService.createPollMessage(pollData);
      resetPollState();
      toast?.showSuccess(t('poll_created'));
    } catch (err) {
      error('Failed to create poll:', err);
      toast?.showError(t('failed_to_create_poll'));
    }
  }, [pollQuestion, pollOptions, selectedClass, user, profileName, resetPollState, toast]);

  // Class change
  const handleClassChange = useCallback((classId) => {
    info('handleClassChange called', { 
      classId, 
      previousClassId: selectedClass,
      isDM: classId?.startsWith('dm:'),
      isGlobal: classId === 'global'
    });
    
    setUserHasInteracted(true);
    setSelectedClass(classId);
    loadClassMembers(classId);
  }, [selectedClass, setSelectedClass, setUserHasInteracted, loadClassMembers]);

  // Share message
  const shareMessage = useCallback((messageId) => {
    const shareUrl = generateShareUrl(messageId, selectedClass);
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast?.showSuccess(t('message_link_copied'));
    }).catch(() => {
      toast?.showError(t('failed_to_copy_link'));
    });
  }, [selectedClass, toast]);

  // Copy message
  const copyMessage = useCallback((content) => {
    navigator.clipboard.writeText(content).then(() => {
      toast?.showSuccess(t('message_copied'));
    }).catch(() => {
      toast?.showError(t('failed_to_copy'));
    });
  }, [toast]);

  return {
    // Actions
    loadClassMembers,
    handleSendMessage,
    handleFileSelect,
    startRecording,
    stopRecording,
    cancelRecording,
    handleDeleteMessage,
    handleSaveEdit,
    openDMWith,
    toggleStar,
    clearDMMessages,
    deleteDMConversation,
    createPoll,
    handleClassChange,
    shareMessage,
    copyMessage,
    
    // Refs
    mediaRecorderRef,
    audioChunksRef,
    recordingIntervalRef
  };
};
