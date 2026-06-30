/**
 * MessageList Component
 * Renders the list of messages with date grouping and search functionality
 */

import React, { memo } from 'react';
import { formatDate } from '@utils/date';
import MessageBubble from './MessageBubble';
import { groupMessagesByDate, filterMessages } from '../utils/chatHelpers';


import { info, error, warn, debug } from '@services/utils/logger.js';const MessageList = memo(({ 
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
          color: 'var(--muted)',
          fontSize: '0.95rem',
          fontWeight: 500,
          margin: 0,
          maxWidth: 280,
          lineHeight: 1.5,
        }}>
          {msgQuery?.trim() || globalChatSearch ? 
            (t('no_messages_found')) : 
            (t('no_messages'))
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
          if (item.dateStr === today) label = t('today');
          else if (item.dateStr === yesterday) label = t('yesterday');
          
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
