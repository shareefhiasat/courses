/**
 * MessageBubble Component
 * Renders individual chat messages with reactions, receipts, and actions
 */

import React, { memo, useRef, useState, useCallback } from 'react';
import { doc } from 'firebase/firestore';
import { db } from '@services/other/config';
import { chatService } from '@services/business/chatService';
import { getThemedIcon, getColoredIcon } from '@constants/iconTypes';
import { 
  REACTION_TYPES, 
  REACTION_COLORS, 
  MESSAGE_TYPES,
  EMOJI_LIST 
} from '../constants/chatConstants';
import {
  isOwnMessage,
  getReactionDisplay,
  getReactionIcon,
  hasUserVoted,
  getUserVote,
  calculatePollResults,
  formatTime,
  canEditMessage,
  canDeleteMessage
} from '../utils/chatHelpers';

const MessageBubble = memo(({ 
  msg, 
  user, 
  theme, 
  t, 
  lang, 
  allUsers, 
  selectedClass, 
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
  logger
}) => {
  const [reactionMenu, setReactionMenu] = useState(null);
  const reactionMenuRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const isOwn = isOwnMessage(msg, user.uid);
  const senderUser = allUsers.find(u => u.docId === msg.senderId);
  const isHighlighted = highlightedMsgId === msg.id;
  const myProfile = allUsers.find(u => u.docId === user?.uid);

  // Get user's theme color
  const getUserThemeColor = () => {
    try {
      const savedColor = localStorage.getItem('userMessageColor');
      if (savedColor) {
        return savedColor;
      }
    } catch {}
    return myMessageColor || '#800020';
  };

  // Handle reaction menu
  const handleReactionClick = useCallback((e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setReactionMenu({ msgId: msg.id, x: rect.left, y: rect.bottom + 4 });
    onReactionMenu?.(msg.id, rect.left, rect.bottom + 4);
  }, [msg.id, onReactionMenu]);

  // Add reaction
  const handleAddReaction = useCallback(async (reactionName) => {
    try {
      await chatService.addReaction(msg.id, user.uid, reactionName);
      setReactionMenu(null);
    } catch {}
  }, [msg.id, user.uid]);

  // Remove reaction
  const handleRemoveReaction = useCallback(async () => {
    try {
      await chatService.removeReaction(msg.id, user.uid);
    } catch {}
  }, [msg.id, user.uid]);

  // Handle poll vote
  const handlePollVote = useCallback(async (optionIndex) => {
    try {
      const msgRef = doc(db, 'messages', msg.id);
      const currentVotes = msg.pollVotes || {};
      
      // Remove user from all options first
      await Promise.all(
        Object.keys(currentVotes).map(async (i) => {
          const currentOptionVotes = currentVotes[i] || [];
          if (currentOptionVotes.includes(user.uid)) {
            await chatService.removePollVote(msgRef.id, user.uid, parseInt(i));
          }
        })
      );
      
      // Add to selected option
      await chatService.votePoll(msgRef.id, user.uid, optionIndex);
    } catch (err) {
      logger.error('Poll vote error:', err);
      toast?.showError('Failed to vote');
    }
  }, [msg.id, msg.pollVotes, user.uid, toast, logger]);

  // Get message content based on type
  const renderMessageContent = () => {
    switch (msg.messageType) {
      case MESSAGE_TYPES.VOICE:
        return (
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
        );

      case MESSAGE_TYPES.FILE:
        return renderFileContent();

      case MESSAGE_TYPES.POLL:
        return renderPollContent();

      default:
        return renderTextContent();
    }
  };

  const renderFileContent = () => {
    const fileName = msg.fileName || 'Attachment';
    const fileType = fileName.split('.').pop()?.toLowerCase() || '';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType);
    const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(fileType);
    
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
            {fileName} • {Math.ceil((msg.fileSize || 0) / 1024)} KB
          </div>
        </div>
      );
    }
    
    if (isVideo) {
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
            {fileName} • {Math.ceil((msg.fileSize || 0) / 1024)} KB
          </div>
        </div>
      );
    }
    
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
          {Math.ceil((msg.fileSize || 0) / 1024)} KB
        </span>
      </div>
    );
  };

  const renderPollContent = () => {
    const results = calculatePollResults(msg.pollVotes);
    const totalVotes = Object.values(results).reduce((sum, r) => sum + r.votes.length, 0);
    const userVote = getUserVote(msg.pollVotes, user.uid);

    return (
      <div style={{ minWidth: 250 }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {getThemedIcon('ui', 'bar_chart', 20, theme)} {msg.pollQuestion}
        </div>
        {msg.pollOptions?.map((option, idx) => {
          const result = results[idx] || { votes: [], percentage: 0 };
          const hasVoted = result.votes.includes(user.uid);
          
          return (
            <button
              key={idx}
              onClick={() => handlePollVote(idx)}
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
                width: `${result.percentage}%`,
                background: 'rgba(102,126,234,0.1)',
                transition: 'width 0.3s'
              }} />
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', color: '#000000' }}>
                <span>{option}</span>
                <span style={{ fontWeight: 600 }}>{result.percentage}% ({result.votes.length})</span>
              </div>
            </button>
          );
        })}
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
          {totalVotes} {t('votes') || 'votes'}
        </div>
      </div>
    );
  };

  const renderTextContent = () => {
    const text = msg.content || '';
    // Hide standalone token-like strings
    const looksLikeToken = /^[A-Za-z0-9+/_=-]{20,}$/.test(text) && !text.includes('http');
    if (looksLikeToken) return null;
    return <div>{text}</div>;
  };

  // Render reactions
  const renderReactions = () => {
    const reactions = getReactionDisplay(msg.reactions, theme, getThemedIcon, getColoredIcon);
    
    if (reactions.length === 0) return null;

    return (
      <div style={{ 
        position:'absolute', 
        left: isOwn ? -22 : 'auto', 
        right: isOwn ? 'auto' : -22, 
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
        {reactions.map(({ reaction, count, color, icon }) => {
          const active = msg.reactions[user.uid] === reaction;
          return (
            <button key={reaction}
              onClick={async () => {
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
                background: active ? `${color}20` : 'transparent',
                border: active ? `1px solid ${color}` : '1px solid var(--border)',
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
                  e.currentTarget.style.background = `${color}10`;
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
              {icon}
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: '600',
                lineHeight: 1,
                color: active ? color : 'var(--text-secondary)'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  // Render read receipts
  const renderReadReceipts = () => {
    if (!isOwn) return null;

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
    const userColor = getUserThemeColor();
    
    return (
      <span
        style={{ 
          marginLeft: 8, 
          fontSize: '1.1rem',
          fontWeight: 700, 
          color: allRead ? userColor : (anyRead ? `${userColor}99` : `${userColor}66`), 
          cursor: 'pointer',
          transition: 'color 0.2s'
        }}
        title={`Seen by ${readCount} of ${recips.length}`}
        onClick={() => {
          const list = recips.map(uid => ({
            uid,
            name: allUsers.find(u=>u.docId===uid)?.displayName || allUsers.find(u=>u.docId===uid)?.email || uid,
            readAt: memberReads[uid]
          })).sort((a,b)=> (b.readAt?.getTime?.()||0) - (a.readAt?.getTime?.()||0));
          onShowInfo?.(msg.id, list, readCount, recips.length);
        }}
      >
        {anyRead ? '✓✓' : '✓'}
      </span>
    );
  };

  // Render message actions menu
  const renderActionsMenu = () => {
    if (!isOwn && !isAdmin) return null;

    return (
      <>
        <button
          onMouseDown={(e)=>e.stopPropagation()}
          onClick={(e)=>{ e.stopPropagation(); onContextMenu?.(msg.id); }}
          title={t('more') || 'More'}
          style={{ position:'absolute', top:4, right:4, background:'transparent', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:'1rem', padding:'2px 4px', lineHeight:1 }}
        >⋮</button>
      </>
    );
  };

  return (
    <div
      key={msg.id}
      id={`msg-${msg.id}`}
      style={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        marginBottom: '1rem',
        transition: 'all 0.3s ease'
      }}
    >
      <div 
        onContextMenu={(e)=>{e.preventDefault(); onContextMenu?.(msg.id);}}
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
          background: isHighlighted ? '#fff3cdCC' : '#ffffffCC',
          color: isHighlighted ? '#1e293b' : '#000000',
          padding: '0.5rem 0.75rem',
          paddingRight: (isOwn || isAdmin) ? '2.5rem' : '0.75rem',
          paddingBottom: '1.5rem',
          borderRadius: '12px',
          boxShadow: isHighlighted ? '0 0 20px rgba(255,193,7,0.5)' : '0 2px 4px rgba(0,0,0,0.08)',
          border: isHighlighted ? '2px solid #ffc107' : '1px solid var(--border)',
          position: 'relative',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Sender Info */}
        {!isOwn && !selectedClass?.startsWith('dm:') && (
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

        {/* Message Content */}
        {renderMessageContent()}

        {/* Timestamp + Receipts */}
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
          {renderReadReceipts()}
        </div>

        {/* Reactions */}
        {renderReactions()}

        {/* Reaction Button */}
        <button
          onClick={handleReactionClick}
          title={t('react') || 'React'}
          style={{ 
            position:'absolute', 
            bottom: -12, 
            [isOwn?'right':'left']: -16, 
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
            fontSize:'1.2rem'
          }}
          onMouseEnter={(e)=>e.currentTarget.style.transform='scale(1.05)'}
          onMouseLeave={(e)=>e.currentTarget.style.transform='scale(1)'}
        >
          <span aria-hidden="true" style={{ display:'inline-block', transform:'translateY(1px)' }}>
            {getThemedIcon('ui', 'smile', 16, theme)}
          </span>
        </button>

        {/* Actions Menu */}
        {renderActionsMenu()}

        {/* Reaction Menu */}
        {reactionMenu?.msgId === msg.id && (
          <div
            className="pop-in"
            ref={reactionMenuRef}
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              [isOwn ? 'right' : 'left']: 'calc(100% + 8px)',
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
            {Object.values(REACTION_TYPES).map((reactionName) => {
              const icon = getReactionIcon(reactionName, theme, getThemedIcon, getColoredIcon);
              return (
                <button
                  key={reactionName}
                  onClick={() => handleAddReaction(reactionName)}
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
                  {icon}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
