/**
 * ChatInput Component
 * Renders the chat input area with file upload, voice recording, and emoji picker
 */

import React, { memo, useRef, useState, useCallback, useEffect } from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { EMOJI_LIST, MESSAGE_TYPES } from '../constants/chatConstants';
import { formatTime, getMaxVoiceTimeDisplay } from '../utils/chatHelpers';


import { info, error, warn, debug } from '@services/utils/logger.js';const ChatInput = memo(({ 
  state,
  actions,
  user,
  theme,
  t,
  isAdmin,
  onSendMessage
}) => {
  const {
    newMessage,
    setNewMessage,
    isRecording,
    recordingTime,
    audioBlob,
    attachedFile,
    imagePreview,
    isUploading,
    showEmojiPicker,
    setShowEmojiPicker,
    showPollModal,
    setShowPollModal,
    pollQuestion,
    setPollQuestion,
    pollOptions,
    setPollOptions,
    messageInputRef
  } = state;

  const {
    handleFileSelect,
    startRecording,
    stopRecording,
    cancelRecording,
    createPoll
  } = actions;

  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ bottom: 70, right: 20 });

  // Handle emoji picker positioning
  useEffect(() => {
    if (showEmojiPicker && messageInputRef.current) {
      const rect = messageInputRef.current.getBoundingClientRect();
      setEmojiPickerPosition({
        bottom: window.innerHeight - rect.top + 10,
        right: window.innerWidth - rect.right
      });
    }
  }, [showEmojiPicker, messageInputRef]);

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji) => {
    setNewMessage(prev => prev + emoji);
    messageInputRef.current?.focus();
    setShowEmojiPicker(false);
  }, [setNewMessage, messageInputRef, setShowEmojiPicker]);

  // Handle poll option change
  const handlePollOptionChange = useCallback((index, value) => {
    const newOpts = [...pollOptions];
    newOpts[index] = value;
    setPollOptions(newOpts);
  }, [pollOptions, setPollOptions]);

  // Add poll option
  const addPollOption = useCallback(() => {
    setPollOptions([...pollOptions, '']);
  }, [pollOptions, setPollOptions]);

  // Remove poll option
  const removePollOption = useCallback((index) => {
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  }, [pollOptions, setPollOptions]);

  // Reset poll
  const resetPoll = useCallback(() => {
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPollModal(false);
  }, [setPollQuestion, setPollOptions, setShowPollModal]);

  // Handle poll creation
  const handleCreatePoll = useCallback(async () => {
    await createPoll();
  }, [createPoll]);

  // Handle file removal
  const handleRemoveFile = useCallback(() => {
    state.setAttachedFile(null);
    state.setImagePreview(null);
  }, [state]);

  // Get button title based on state
  const getButtonTitle = () => {
    if (isUploading) return 'Uploading...';
    if (newMessage.trim() || audioBlob || attachedFile) return t('send') || 'Send';
    if (isRecording) return t('stop_recording') || 'Stop Recording';
    return t('record_voice') || 'Record Voice';
  };

  // Get button icon based on state
  const getButtonIcon = () => {
    if (isUploading) {
      return (
        <div style={{
          width: 18,
          height: 18,
          border: '2px solid #ffffff',
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      );
    }
    if (newMessage.trim() || audioBlob || attachedFile) {
      return getThemedIcon('ui', 'send', 18, theme);
    }
    if (isRecording) {
      return getThemedIcon('ui', 'square', 18, theme);
    }
    return getThemedIcon('ui', 'mic', 18, theme);
  };

  return (
    <>
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
                getThemedIcon('ui', 'attachment', 20, theme)
              )}
              <div>
                <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                  {attachedFile.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {(attachedFile.size / 1024).toFixed(2)} KB
                </div>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
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

        {/* Voice Message Ready */}
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
              <span style={{ 
                fontSize: '0.7rem', 
                fontFamily: 'monospace', 
                background: 'rgba(255,255,255,0.15)', 
                padding: '1px 4px', 
                borderRadius: '2px' 
              }}>
                {formatTime(recordingTime)} / {getMaxVoiceTimeDisplay(user?.role || 'student')}
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
        <form onSubmit={onSendMessage} className="form-actions" style={{ position: 'relative' }}>
          {/* Recording Interface */}
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
              {/* Animated Waves */}
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
              
              {/* Recording Info */}
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
                <span style={{ 
                  fontSize: '0.7rem', 
                  fontFamily: 'monospace', 
                  background: 'rgba(255,255,255,0.15)', 
                  padding: '1px 4px', 
                  borderRadius: '2px' 
                }}>
                  {formatTime(recordingTime)} / {getMaxVoiceTimeDisplay(user?.role || 'student')}
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
          
          {/* Emoji Picker Button */}
          <button
            type="button"
            data-emoji-button="true"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
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
          
          {/* Action Buttons */}
          {!audioBlob && (
            <>
              {/* Poll Button (Admin Only) */}
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
              {getThemedIcon('ui', 'attachment', 20, theme)}
              <input
                type="file"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx,.zip,.rar"
              />
            </label>
          )}

          {/* Send/Record Button */}
          <button
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
              background: isUploading ? '#6c757d' : 
                       ((newMessage.trim() || audioBlob || attachedFile) ? '#25D366' : 
                        (isRecording ? '#dc3545' : '#25D366')),
              color: (newMessage.trim() || audioBlob || attachedFile) ? '#fff' : 
                     (isRecording ? '#fff' : '#666'),
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
            title={getButtonTitle()}
          >
            {/* Recording Indicator */}
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
                  {formatTime(recordingTime)}/{getMaxVoiceTimeDisplay(user?.role || 'student').replace(' minutes', 'm')}
                </span>
              </div>
            )}
            
            {getButtonIcon()}
          </button>
        </form>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          data-emoji-picker="true"
          style={{
            position: 'fixed',
            bottom: `${emojiPickerPosition.bottom}px`,
            right: `${emojiPickerPosition.right}px`,
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
            {EMOJI_LIST.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiSelect(emoji)}
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

      {/* Poll Creation Modal */}
      {showPollModal && (
        <div style={{ 
          position:'fixed', 
          inset:0, 
          background:'rgba(0,0,0,0.5)', 
          display:'flex', 
          alignItems:'center', 
          justifyContent:'center', 
          zIndex:2200 
        }} onClick={resetPoll}>
          <div style={{ 
            background:'var(--panel)', 
            color:'var(--text)', 
            border:'1px solid var(--border)', 
            padding:'2rem', 
            borderRadius:16, 
            minWidth:450, 
            maxWidth:550, 
            width:'90%', 
            boxShadow:'0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
          }} onClick={(e)=>e.stopPropagation()}>
            <div style={{ 
              display:'flex', 
              alignItems:'center', 
              justifyContent:'space-between', 
              marginBottom:'1.5rem' 
            }}>
              <h3 style={{ 
                margin:0, 
                fontSize:'1.25rem', 
                fontWeight:700, 
                display:'flex', 
                alignItems:'center', 
                gap:'0.5rem' 
              }}>
                <div style={{ 
                  width:32, 
                  height:32, 
                  background:'linear-gradient(135deg, var(--brand), var(--brand2))', 
                  borderRadius:'50%', 
                  display:'flex', 
                  alignItems:'center', 
                  justifyContent:'center', 
                  color:'white', 
                  fontSize:'1rem' 
                }}>
                  {getThemedIcon('ui', 'bar_chart', 18, theme)}
                </div>
                {t('create_poll') || 'Create Poll'}
              </h3>
              <button 
                onClick={resetPoll} 
                style={{ 
                  background:'transparent', 
                  border:'none', 
                  cursor:'pointer', 
                  color:'var(--muted)', 
                  fontSize:'1.5rem', 
                  padding:0, 
                  width:24, 
                  height:24, 
                  display:'flex', 
                  alignItems:'center', 
                  justifyContent:'center' 
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={{ 
                display:'block', 
                marginBottom:'0.5rem', 
                fontWeight:600, 
                fontSize:'0.9rem', 
                color:'var(--text)' 
              }}>
                {t('question') || 'Question'}
              </label>
              <input
                type="text"
                value={pollQuestion}
                onChange={(e)=>setPollQuestion(e.target.value)}
                placeholder={t('chat.question_placeholder', 'What would you like to know?')}
                style={{ 
                  width:'100%', 
                  padding:'0.875rem', 
                  border:'2px solid var(--border)', 
                  borderRadius:12, 
                  marginBottom:'0', 
                  background:'var(--panel)', 
                  color:'var(--text)', 
                  fontSize:'0.95rem', 
                  transition:'border-color 0.2s', 
                  outline:'none' 
                }}
                onFocus={(e)=>e.target.style.borderColor='var(--brand)'}
                onBlur={(e)=>e.target.style.borderColor='var(--border)'}
              />
            </div>
            
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={{ 
                display:'block', 
                marginBottom:'0.5rem', 
                fontWeight:600, 
                fontSize:'0.9rem', 
                color:'var(--text)' 
              }}>
                {t('options') || 'Options'}
              </label>
              <div style={{ 
                background:'var(--background)', 
                padding:'1rem', 
                borderRadius:12, 
                border:'1px solid var(--border)' 
              }}>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} style={{ 
                    display:'flex', 
                    gap:'0.75rem', 
                    marginBottom:'0.75rem', 
                    alignItems:'center' 
                  }}>
                    <div style={{ 
                      width:24, 
                      height:24, 
                      borderRadius:'50%', 
                      background:'var(--brand)', 
                      color:'white', 
                      display:'flex', 
                      alignItems:'center', 
                      justifyContent:'center', 
                      fontSize:'0.75rem', 
                      fontWeight:600, 
                      flexShrink:0 
                    }}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e)=>handlePollOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      style={{ 
                        flex:1, 
                        padding:'0.625rem 0.875rem', 
                        border:'1px solid var(--border)', 
                        borderRadius:8, 
                        background:'var(--panel)', 
                        color:'var(--text)', 
                        fontSize:'0.9rem' 
                      }}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => removePollOption(idx)}
                        style={{ 
                          width:32, 
                          height:32, 
                          background:'var(--danger)', 
                          color:'white', 
                          border:'none', 
                          borderRadius:'50%', 
                          cursor:'pointer', 
                          display:'flex', 
                          alignItems:'center', 
                          justifyContent:'center', 
                          fontSize:'1rem', 
                          flexShrink:0 
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={addPollOption}
              style={{ 
                width:'100%', 
                padding:'0.75rem', 
                background:'transparent', 
                color:'var(--brand)', 
                border:'2px dashed var(--brand)', 
                borderRadius:12, 
                cursor:'pointer', 
                marginBottom:'1.5rem', 
                fontWeight:600, 
                display:'flex', 
                alignItems:'center', 
                justifyContent:'center', 
                gap:'0.5rem', 
                transition:'all 0.2s' 
              }}
              onMouseOver={(e)=>{e.target.style.background='var(--brand)'; e.target.style.color='white';}}
              onMouseOut={(e)=>{e.target.style.background='transparent'; e.target.style.color='var(--brand)';}}
            >
              {getThemedIcon('ui', 'plus', 18, theme)}
              {t('add_option') || 'Add Option'}
            </button>
            
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem' }}>
              <button 
                onClick={resetPoll}
                style={{ 
                  padding:'0.75rem 1.5rem', 
                  background:'transparent', 
                  color:'var(--muted)', 
                  border:'1px solid var(--border)', 
                  borderRadius:10, 
                  cursor:'pointer', 
                  fontWeight:600, 
                  fontSize:'0.9rem', 
                  transition:'all 0.2s' 
                }}
                onMouseOver={(e)=>{e.target.style.background='var(--background)';}}
                onMouseOut={(e)=>{e.target.style.background='transparent';}}
              >
                {t('cancel')||'Cancel'}
              </button>
              <button
                onClick={handleCreatePoll}
                style={{ 
                  padding:'0.75rem 1.5rem', 
                  background:'linear-gradient(135deg, var(--brand), var(--brand2))', 
                  color:'white', 
                  border:'none', 
                  borderRadius:10, 
                  cursor:'pointer', 
                  fontWeight:600, 
                  fontSize:'0.9rem', 
                  boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                }}
              >
                {t('create')||'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
