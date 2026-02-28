/**
 * MessageList Component
 * Renders the list of messages with date grouping and search functionality
 */

import React, { memo } from 'react';
import { formatDate } from '@utils/date';
import { getThemedIcon } from '@constants/iconTypes';
import MessageBubble from './MessageBubble';
import { groupMessagesByDate, filterMessages } from '../utils/chatHelpers';

const MessageList = memo(({ 
  messages, 
  msgQuery, 
  globalChatSearch, 
  selectedClass, 
  user, 
  theme, 
  t, 
  lang, 
  allUsers, 
  safeAllUsers, 
  safeDirectRooms, 
  safeClassMembers, 
  memberReads, 
  highlightedMsgId, 
  myMessageColor, 
  isAdmin,
  onEdit,
  onDelete,
  onShowInfo,
  onShare,
  onCopy,
  onReactionMenu,
  onContextMenu,
  toast,
  logger,
  messagesEndRef 
}) => {
  
  // Filter messages based on search
  const filteredMessages = (() => {
    let list = messages || [];
    
    // Apply global chat search
    if (globalChatSearch && selectedClass === 'global') {
      list = filterMessages(list, globalChatSearch, allUsers);
    }
    
    // Apply regular message search
    if (msgQuery?.trim()) {
      list = filterMessages(list, msgQuery, allUsers);
    }
    
    return list;
  })();

  // Group messages by date
  const groupedMessages = groupMessagesByDate(filteredMessages);

  // Handle empty state
  if (!filteredMessages || filteredMessages.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        color: '#999'
      }}>
        <p style={{ fontSize: '3rem', margin: 0 }}>
          {getThemedIcon('ui', 'message_square', 42, theme)}
        </p>
        <p style={{ color: 'var(--muted)' }}>
          {msgQuery?.trim() || globalChatSearch ? 
            (t('no_messages_found') || 'No messages found') : 
            (t('no_messages') || 'No messages')
          }
        </p>
      </div>
    );
  }

  return (
    <>
      {groupedMessages.map((item, idx) => {
        if (item.type === 'date') {
          const today = formatDate(new Date());
          const yesterday = formatDate(new Date(Date.now() - 86400000));
          let label = item.dateStr;
          if (item.dateStr === today) label = 'Today';
          else if (item.dateStr === yesterday) label = 'Yesterday';
          
          return (
            <div key={`date-${idx}`} style={{ 
              display:'flex', 
              alignItems:'center', 
              margin:'1.5rem 0 1rem' 
            }}>
              <div style={{ flex:1, height:1, background:'var(--border)' }} />
              <div style={{ 
                padding:'0 1rem', 
                fontSize:'0.8rem', 
                color:'var(--muted)', 
                fontWeight:600 
              }}>
                {label}
              </div>
              <div style={{ flex:1, height:1, background:'var(--border)' }} />
            </div>
          );
        }
        
        const msg = item;
        return (
          <MessageBubble
            key={msg.id}
            msg={msg}
            user={user}
            theme={theme}
            t={t}
            lang={lang}
            allUsers={allUsers}
            selectedClass={selectedClass}
            safeAllUsers={safeAllUsers}
            safeDirectRooms={safeDirectRooms}
            safeClassMembers={safeClassMembers}
            memberReads={memberReads}
            highlightedMsgId={highlightedMsgId}
            myMessageColor={myMessageColor}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
            onShowInfo={onShowInfo}
            onShare={onShare}
            onCopy={onCopy}
            onReactionMenu={onReactionMenu}
            onContextMenu={onContextMenu}
            toast={toast}
            logger={logger}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
