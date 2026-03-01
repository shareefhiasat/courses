/**
 * Chat Actions Hook
 * Manages all chat-related actions and operations
 */

import { useCallback, useRef } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from '@services/other/config';
import { chatService } from '@services/business/chatService';
import { addNotification } from '@services/business/notificationService';
import { getUsers } from '@services/business/userService';
import { filterBadWords } from '@utils/badWordFilter';
import { canParticipate } from '@utils/userStatus';
import { ActivityLogger } from '@services/other/activityLogger';
import logger from '@utils/logger';

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
  canEditMessage
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
    profileName,
    safeAllUsers,
    safeDirectRooms,
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
    logger.info('loadClassMembers called', { 
      classId, 
      hasUser: !!user,
      userId: user?.uid,
      safeAllUsersLength: safeAllUsers.length
    });
    
    if (!user) {
      logger.warn('loadClassMembers early return - no user');
      return;
    }
    
    if (classId === 'global') {
      logger.info('Loading global chat members');
      if (safeAllUsers.length > 0) {
        logger.info('Using cached allUsers for global chat', { count: safeAllUsers.length });
        state.setClassMembers(safeAllUsers.filter(u => u.docId !== user.uid && u.email !== user.email));
      } else {
        logger.info('Fetching allUsers for global chat');
        const usersResult = await getUsers();
        const all = usersResult.success ? (usersResult.data || []) : [];
        logger.info('Fetched allUsers', { count: all.length, success: usersResult.success });
        state.setAllUsers(all);
        state.setClassMembers(all.filter(u => u.docId !== user.uid && u.email !== user.email));
      }
      return;
    }
    
    logger.info('Loading class members', { classId });
    
    const allUsersToUse = safeAllUsers.length > 0 ? safeAllUsers : 
      (() => {
        logger.info('Fetching allUsers for class members');
        const result = getUsers();
        return result.success ? (result.data || []) : [];
      })();
    
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
    
    logger.info('Setting class members', { 
      classId, 
      membersCount: members.length,
      adminsCount: admins.length
    });
    
    state.setClassMembers(members);
    
    if (safeAllUsers.length === 0) {
      logger.info('Updating allUsers cache', { count: allUsersToUse.length });
      state.setAllUsers(allUsersToUse);
    }
  }, [user, safeAllUsers, state]);

  // Send message
  const handleSendMessage = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    if (!newMessage.trim() && !audioBlob && !attachedFile || isUploading) return;
    
    setIsUploading(true);
    
    // Check user participation
    try {
      const participationCheck = canParticipate(profileName || user, []);
      if (!participationCheck) {
        toast?.showError?.('You cannot send messages. Your account is disabled, archived, or you have no active enrollments.');
        setIsUploading(false);
        return;
      }
    } catch (error) {
      // Continue anyway - don't block if status check fails
    }
    
    try {
      const chatType = getChatType(selectedClass);
      const chatId = getChatId(selectedClass);
      
      const messageData = {
        senderId: user.uid,
        senderName: user.displayName || profileName || user.email,
        senderEmail: user.email,
        type: chatType,
        classId: chatType === CHAT_TYPES.CLASS ? chatId : null,
        roomId: chatType === CHAT_TYPES.DM ? chatId : null,
        createdAt: serverTimestamp(),
        readBy: [user.uid]
      };
      
      // Handle voice message
      if (audioBlob) {
        try {
          const voicePath = `voice-messages/${Date.now()}_${user.uid}.webm`;
          const voiceRef = ref(storage, voicePath);
          
          const metadata = {
            contentType: audioBlob.type || 'audio/webm',
            cacheControl: 'public, max-age=31536000',
            customMetadata: {
              uploadedBy: user.uid,
              timestamp: Date.now().toString()
            }
          };
          
          const uploadTask = uploadBytesResumable(voiceRef, audioBlob, metadata);
          
          await new Promise((resolve, reject) => {
            uploadTask.on('state_changed', 
              (snapshot) => {},
              (error) => {
                logger.error('Voice upload failed:', error);
                reject(error);
              },
              () => resolve()
            );
          });
          
          const voiceUrl = await getDownloadURL(voiceRef);
          messageData.messageType = MESSAGE_TYPES.VOICE;
          messageData.voiceUrl = voiceUrl;
          messageData.voicePath = voicePath;
          messageData.duration = recordingTime;
          messageData.content = '[Voice Message]';
        } catch (uploadError) {
          logger.error('Voice upload failed:', uploadError);
          toast?.showError('Failed to upload voice message. Please check your internet connection and try again.');
          setIsUploading(false);
          return;
        }
      } else if (attachedFile) {
        // File attachment
        const safeName = sanitizeFilename(attachedFile.name);
        const filePath = `chat-attachments/${Date.now()}_${user.uid}_${safeName}`;
        const fileRef = ref(storage, filePath);
        
        await uploadBytesResumable(fileRef, attachedFile);
        const fileUrl = await getDownloadURL(fileRef);
        
        messageData.messageType = MESSAGE_TYPES.FILE;
        messageData.fileUrl = fileUrl;
        messageData.filePath = filePath;
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
          toast?.showWarning('Your message has been filtered for inappropriate content.');
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
        logger.warn('Failed to log message sent activity:', logError);
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
    } catch (error) {
      logger.error('Error sending message:', error);
      toast?.showError('Failed to send message');
    } finally {
      setIsUploading(false);
    }
  }, [
    newMessage, audioBlob, attachedFile, isUploading, selectedClass, user, 
    profileName, toast, recordingTime, resetInputState
  ]);

  // File selection
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!isFileTypeAllowed(file)) {
      toast?.showError('File type not allowed');
      e.target.value = '';
      return;
    }
    
    if (file.size > FILE_UPLOAD_LIMITS.MAX_TOTAL_SIZE) {
      const maxSizeMB = FILE_UPLOAD_LIMITS.MAX_TOTAL_SIZE / (1024 * 1024);
      toast?.showError(`File too large. Maximum size: ${maxSizeMB}MB`);
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
            toast?.showInfo(`Maximum recording time reached (${maxTime})`);
          }
          return newTime;
        });
      }, 1000);
      
    } catch (error) {
      logger.error('Error starting recording:', error);
      toast?.showError('Microphone access denied');
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
    if (!canDeleteMessage(msg, user.uid, user.isAdmin)) return;
    
    try {
      // Delete storage files if any
      if (msg.voicePath) {
        try { await deleteObject(ref(storage, msg.voicePath)); } catch {}
      }
      if (msg.filePath) {
        try { await deleteObject(ref(storage, msg.filePath)); } catch {}
      }
      
      await chatService.deleteMessage(msg.id);
      
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
      
      toast?.showSuccess('Message deleted');
    } catch (err) {
      logger.error('Delete message failed:', err);
      toast?.showError('Failed to delete message');
    }
  }, [user, toast]);

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
        logger.warn('Message content filtered for inappropriate content', {
          originalLength: originalContent.length,
          filteredLength: filteredContent.length,
          userId: user?.uid
        });
        toast?.showWarning(t('chat_message_filtered_inappropriate_content'));
      }

      setEditingMsg(null);
      toast?.showSuccess(t('chat_saved'));
    } catch (e) {
      logger.error('Edit failed', e);
      toast?.showError(t('chat_failed_to_save'));
    }
  }, [state.editingMsg, user, toast, t, setEditingMsg]);

  // DM actions
  const openDMWith = useCallback(async (otherUser) => {
    const otherUserId = otherUser?.docId || otherUser?.id || otherUser?.uid;
    
    if (!otherUserId || otherUserId === user.uid) {
      logger.warn('openDMWith validation failed', { 
        otherUserId,
        isSelf: otherUserId === user.uid,
        currentUserId: user?.uid
      });
      return;
    }
    
    try {
      const roomId = await chatService.createDMRoom(user.uid, otherUserId);
      setSelectedClass(`dm:${roomId}`);
      setShowMembers(false);
    } catch (err) {
      logger.error('Open DM failed:', err);
      toast?.showError('Failed to start conversation');
    }
  }, [user, setSelectedClass, setShowMembers, toast]);

  const toggleStar = useCallback(async (room) => {
    try {
      await chatService.toggleStarRoom(room.id, user.uid);
    } catch (e) { 
      /* noop */ 
    }
  }, [user]);

  const clearDMMessages = useCallback(async (roomId, mode = CLEAR_MESSAGE_MODES.ALL) => {
    if (!user.isAdmin && (mode === CLEAR_MESSAGE_MODES.ALL || mode === CLEAR_MESSAGE_MODES.THEIRS)) {
      toast?.showError(t('only_admins_can_clear') || 'Only admins can clear these messages');
      return;
    }
    
    try {
      const deletedCount = await chatService.clearChatMessages(roomId, mode, user.uid);
      
      setDmContextMenu(null);
      const modeLabel = mode === CLEAR_MESSAGE_MODES.ALL ? (t('all_messages') || 'All messages') : 
                       mode === CLEAR_MESSAGE_MODES.MINE ? (t('your_messages') || 'Your messages') : 
                       (t('their_messages') || 'Their messages');
      toast?.showSuccess(`${modeLabel} ${t('cleared') || 'cleared'}`);
    } catch (err) {
      logger.error('Clear messages failed:', err);
      toast?.showError(t('failed_to_clear_messages') || 'Failed to clear messages');
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
      toast?.showSuccess(t('conversation_deleted') || 'Conversation deleted');
    } catch (err) {
      logger.error('Delete conversation failed:', err);
      toast?.showError(t('failed_to_delete_conversation') || 'Failed to delete conversation');
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
        type: chatType,
        classId: chatType === CHAT_TYPES.CLASS ? chatId : null,
        roomId: chatType === CHAT_TYPES.DM ? chatId : null,
        senderId: user.uid,
        senderName: profileName || user.displayName || user.email,
        messageType: MESSAGE_TYPES.POLL,
        pollQuestion: pollQuestion.trim(),
        pollOptions: pollOptions.filter(o => o.trim()),
        pollVotes: {},
        createdAt: serverTimestamp()
      };
      
      await chatService.createPollMessage(pollData);
      resetPollState();
      toast?.showSuccess('Poll created!');
    } catch (err) {
      logger.error('Failed to create poll:', err);
      toast?.showError('Failed to create poll');
    }
  }, [pollQuestion, pollOptions, selectedClass, user, profileName, resetPollState, toast]);

  // Class change
  const handleClassChange = useCallback((classId) => {
    logger.info('handleClassChange called', { 
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
      toast?.showSuccess('Message link copied!');
    }).catch(() => {
      toast?.showError('Failed to copy link');
    });
  }, [selectedClass, toast]);

  // Copy message
  const copyMessage = useCallback((content) => {
    navigator.clipboard.writeText(content).then(() => {
      toast?.showSuccess('Message copied! Paste to forward');
    }).catch(() => {
      toast?.showError('Failed to copy');
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
