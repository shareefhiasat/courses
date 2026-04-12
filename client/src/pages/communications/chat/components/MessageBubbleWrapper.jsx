/**
 * MessageBubble Wrapper Component
 * Temporary wrapper for gradual extraction of message bubble logic
 * Phase 1: Just renders JSX, keeps all logic in parent
 */

import React from 'react';
import { getThemedIcon, getColoredIcon } from '@constants/iconTypes';


import { info, error, warn, debug } from '@services/utils/logger.js';const MessageBubbleWrapper = ({ 
  msg, 
  user, 
  allUsers, 
  selectedClass, 
  highlightedMsgId, 
  theme, 
  t, 
  isAdmin,
  safeAllUsers,
  safeDirectRooms,
  safeClassMembers,
  memberReads,
  formatTime,
  // Event handlers (passed from parent)
  onContextMenu,
  onTouchStart,
  onTouchEnd,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onPollVote,
  onReactionClick,
  onMenuClick,
  onEditClick,
  onReceiptsClick,
  onCopyClick,
  onDeleteClick,
  // State
  menuOpenId,
  reactionMenu,
  reactionMenuRef,
  suppressAutoScrollRef,
  longPressTimerRef
}) => {
  const isOwnMessage = msg.senderId === user.uid;
  const senderUser = allUsers.find(u => u.docId === msg.senderId);
  const isHighlighted = highlightedMsgId === msg.id;
  const myProfile = allUsers.find(u => u.docId === user?.uid);
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
      <div 
        onContextMenu={onContextMenu}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
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
        }}
      >
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
            {msg.senderName}
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

        {/* Message Content - Text */}
        {msg.messageType === 'text' && (
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {msg.content}
          </div>
        )}

        {/* TODO: Add other message types (voice, file, poll) in next phase */}
        {msg.messageType !== 'text' && (
          <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
            {msg.messageType} message (to be implemented)
          </div>
        )}

        {/* TODO: Add reactions, menu, etc. in next phase */}
      </div>
    </div>
  );
};

export default MessageBubbleWrapper;
