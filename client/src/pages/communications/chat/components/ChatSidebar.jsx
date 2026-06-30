/**
 * ChatSidebar Component
 * Renders the chat sidebar with classes, DMs, and navigation
 */

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { updateUser } from '@services/business/userService';
import { getThemedIcon } from '@constants/iconTypes';
import { formatDateTime } from '@utils/date';
import { ROLE_STRINGS } from '@utils/userUtils';
import { SIDEBAR_CONFIG } from '../constants/chatConstants';


import { info, error, warn, debug } from '@services/utils/logger.js';const ChatSidebar = memo(({ 
  state,
  actions,
  user,
  theme,
  t,
  isAdmin,
  unreadCounts,
  onDragStart,
  onDragMove,
  onDragEnd,
  resizingRef
}) => {
  const {
    isSidebarCollapsed,
    sidebarWidth,
    classes,
    selectedClass,
    safeClasses,
    safeDirectRooms,
    safeAllUsers,
    safeClassMembers,
    archivedRooms,
    archivedClasses,
    showArchived,
    showFavoritesOnly,
    dmSearch,
    globalChatSearch,
    setGlobalChatSearch,
    setShowArchived,
    setShowFavoritesOnly,
    setDmSearch,
    toggleSidebar
  } = state;

  const { handleClassChange, openDMWith, toggleStar } = actions;

  const [dragging, setDragging] = useState(false);

  // Handle drag events
  const handleDragStartLocal = useCallback((e) => {
    if (isSidebarCollapsed) return;
    setDragging(true);
    resizingRef.current = true;
    document.body.style.userSelect = 'none';
    onDragStart?.(e);
  }, [isSidebarCollapsed, onDragStart, resizingRef]);

  const handleDragMoveLocal = useCallback((e) => {
    if (!dragging || !resizingRef.current) return;
    onDragMove?.(e);
  }, [dragging, onDragMove, resizingRef]);

  const handleDragEndLocal = useCallback(() => {
    setDragging(false);
    resizingRef.current = false;
    document.body.style.userSelect = '';
    onDragEnd?.();
  }, [onDragEnd, resizingRef]);

  // Setup drag listeners
  useEffect(() => {
    if (dragging) {
      const move = (e) => handleDragMoveLocal(e);
      const up = () => handleDragEndLocal();
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      return () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      };
    }
  }, [dragging, handleDragMoveLocal, handleDragEndLocal]);

  // Toggle archive for class
  const toggleClassArchive = useCallback(async (cls) => {
    try {
      const next = { ...archivedClasses };
      if (next[cls.docId]) delete next[cls.docId]; 
      else next[cls.docId] = true;
      state.setArchivedClasses(next);
      await updateUser(user.uid, { archivedClasses: next });
    } catch {}
  }, [archivedClasses, user.uid, state]);

  // Toggle archive for room
  const toggleRoomArchive = useCallback(async (room) => {
    try {
      const next = { ...archivedRooms };
      if (next[room.id]) delete next[room.id]; 
      else next[room.id] = true;
      state.setArchivedRooms(next);
      await updateUser(user.uid, { archivedRooms: next });
    } catch {}
  }, [archivedRooms, user.uid, state]);

  // Filter and sort direct rooms
  const getFilteredRooms = useCallback(() => {
    if (archivedRooms === null) return [];
    
    let filtered = safeDirectRooms;
    // Hide archived unless showArchived is on
    filtered = filtered.filter(r => showArchived || !archivedRooms[r.id]);
    // Favorites only filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(r => (r.starBy || []).includes(user.uid));
    }
    if (dmSearch && isAdmin) {
      const search = dmSearch.toLowerCase();
      filtered = filtered.filter(room => {
        const otherId = (room.participants || []).find(p => p !== user.uid);
        const other = safeAllUsers.find(u => u.docId === otherId);
        const name = other?.displayName || other?.email || '';
        return name.toLowerCase().includes(search);
      });
    }
    // Sort: starred first (by me), then by lastMessageAt desc
    return [...filtered].sort((a, b) => {
      const aStar = (a.starBy || []).includes(user.uid) ? 1 : 0;
      const bStar = (b.starBy || []).includes(user.uid) ? 1 : 0;
      if (bStar !== aStar) return bStar - aStar;
      const aTime = (a.lastMessageAt?.toDate?.() || a.createdAt?.toDate?.() || 0);
      const bTime = (b.lastMessageAt?.toDate?.() || b.createdAt?.toDate?.() || 0);
      return bTime - aTime;
    });
  }, [safeDirectRooms, archivedRooms, showArchived, showFavoritesOnly, dmSearch, isAdmin, user.uid, safeAllUsers]);

  // Render unread count badge
  const renderUnreadBadge = (count) => {
    if (count <= 0) return null;
    return (
      <span style={{
        background: 'var(--brand)', 
        color: 'white', 
        borderRadius: '50%', 
        minWidth: 18, 
        height: 18, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '0.7rem', 
        fontWeight: 'bold', 
        padding: '0 5px'
      }}>
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  // Render user avatar
  const renderUserAvatar = (user, showIndicator = false, indicatorTitle = '') => {
    const initial = (user?.displayName || user?.email || 'D')[0]?.toUpperCase();
    
    return (
      <div style={{ position: 'relative' }}>
        {user?.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={user.displayName || user.email} 
            style={{ 
              width: 28, 
              height: 28, 
              borderRadius: '50%', 
              objectFit: 'cover', 
              opacity: showIndicator ? 0.5 : 1 
            }} 
          />
        ) : (
          <div style={{ 
            width: 28, 
            height: 28, 
            borderRadius: '50%', 
            background: showIndicator ? '#999' : 'linear-gradient(135deg,var(--brand),var(--brand2))', 
            color: 'white', 
            display:'flex', 
            alignItems:'center', 
            justifyContent:'center', 
            fontSize: 14, 
            fontWeight: 700, 
            opacity: showIndicator ? 0.5 : 1 
          }}>
            {initial}
          </div>
        )}
        {showIndicator && (
          <div style={{ 
            position: 'absolute', 
            top: -2, 
            right: -2, 
            width: 12, 
            height: 12, 
            borderRadius: '50%', 
            background: '#dc2626', 
            border: '2px solid white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }} title={indicatorTitle}>
            <span style={{ fontSize: 8, color: 'white' }}>✕</span>
          </div>
        )}
      </div>
    );
  };

  if (isSidebarCollapsed) {
    return (
      <>
        {/* Toggle Button when collapsed */}
        <button
          onClick={toggleSidebar}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.3s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            e.currentTarget.style.background = 'var(--brand)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            e.currentTarget.style.background = 'var(--panel)';
          }}
          title={t('expand_sidebar')}
        >
          {getThemedIcon('ui', 'chevron_right', 14, theme)}
        </button>
      </>
    );
  }

  return (
    <div 
      className="chat-sidebar" 
      style={{
        width: sidebarWidth,
        background: 'var(--panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'width 0.3s ease, border-right 0.3s ease',
        minWidth: SIDEBAR_CONFIG.MIN_WIDTH,
        maxWidth: SIDEBAR_CONFIG.MAX_WIDTH
      }}
    >
      {/* Class List */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Global Chat */}
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
            {getThemedIcon('ui', 'globe', 16, theme)}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ fontWeight: '600', fontSize: '0.85rem', flex:1 }}>
                  {t('global_chat')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                  {t('all_users')}
                </div>
                {renderUnreadBadge(unreadCounts['global'] || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Class Chats */}
        {archivedClasses !== null && safeClasses
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
              {getThemedIcon('ui', 'book_open', 16, theme)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                  <div style={{ 
                    fontWeight: '600', 
                    flex:1, 
                    whiteSpace:'nowrap', 
                    overflow:'hidden', 
                    textOverflow:'ellipsis' 
                  }}>
                    {cls.name}
                  </div>
                  {renderUnreadBadge(unreadCounts[cls.docId] || 0)}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await toggleClassArchive(cls);
                    }}
                    title={archivedClasses[cls.docId] ? t('unarchive') : t('archive')}
                    style={{ 
                      background:'transparent', 
                      border:'none', 
                      cursor:'pointer', 
                      color:'#888' 
                    }}
                  >
                    {archivedClasses[cls.docId] ? 
                      getThemedIcon('ui', 'upload', 16, theme) : 
                      getThemedIcon('ui', 'download', 16, theme)
                    }
                  </button>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  <div style={{ 
                    whiteSpace:'nowrap', 
                    overflow:'hidden', 
                    textOverflow:'ellipsis' 
                  }}>
                    {`${cls.term} - ${cls.code}`}
                  </div>
                  {cls.lastMessage && (
                    <div style={{ 
                      display:'flex', 
                      justifyContent:'space-between', 
                      gap:8, 
                      marginTop:2 
                    }}>
                      <span style={{ color:'#666' }}>{cls.lastMessage}</span>
                      <span style={{ color:'#888', fontSize:'0.8rem' }}>
                        {cls.lastMessageAt ? formatDateTime(cls.lastMessageAt) : ''}
                      </span>
                    </div>
                  )}
                </div>
                {/* Instructor info */}
                {(() => {
                  const instructor = cls.instructorId
                    ? safeAllUsers.find(u => u.docId === cls.instructorId)
                    : safeAllUsers.find(u => u.email === cls.ownerEmail);
                  if (!instructor) return null;
                  return (
                    <div style={{ 
                      fontSize: '0.85rem', 
                      color: '#444', 
                      marginTop: 4, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8 
                    }}>
                      {getThemedIcon('ui', 'graduation_cap', 14, theme)}
                      <strong>{instructor.displayName || instructor.email}</strong>
                      {instructor.studentNumber && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: '#666', 
                          marginLeft: '0.25rem', 
                          fontWeight: 'normal' 
                        }}>
                          ({instructor.studentNumber})
                        </span>
                      )}
                      {instructor.docId !== user.uid && (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            openDMWith(instructor); 
                          }}
                          style={{ 
                            padding: '4px 8px', 
                            borderRadius: 6, 
                            border: '1px solid var(--border)', 
                            background: 'transparent', 
                            color: 'var(--text)', 
                            cursor: 'pointer', 
                            fontSize: 16, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            width: 32, 
                            height: 32 
                          }}
                        >
                          {getThemedIcon('ui', 'message_square', 16, theme)}
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
        {isAdmin && (
          <input
            type="text"
            autoComplete="off"
            placeholder={t('chat_search_users')}
            value={dmSearch}
            onChange={(e) => setDmSearch(e.target.value)}
            style={{ 
              margin: '0.5rem 1rem', 
              padding: '6px 10px', 
              border: '1px solid #ddd', 
              borderRadius: 6, 
              fontSize: '0.85rem', 
              width: 'calc(100% - 2rem)' 
            }}
          />
        )}
        
        {getFilteredRooms().map(room => {
          const otherId = (room.participants || []).find(p => p !== user.uid);
          const other = safeAllUsers.find(u => u.docId === otherId);
          const label = other?.displayName || other?.email || t('conversation');
          const lastTime = room.lastMessageAt?.toDate?.();
          const isDeleted = !other || other.deleted;
          const isDisabled = other?.disabled || other?.isDisabled;
          const showIndicator = isDeleted || isDisabled;
          const indicatorTitle = isDeleted ? t('deleted_user') : (isDisabled ? t('disabled_user') : '');
          
          return (
            <div
              key={room.id}
              onClick={() => handleClassChange(`dm:${room.id}`)}
              onContextMenu={(e) => {
                e.preventDefault();
                state.setDmContextMenu({ roomId: room.id, x: e.clientX, y: e.clientY });
              }}
              style={{
                padding: '0.4rem 0.6rem', 
                cursor: 'pointer',
                background: selectedClass === `dm:${room.id}` ? 'rgba(0,0,0,0.06)' : 'var(--panel)',
                borderBottom: '1px solid var(--border)', 
                transition: 'background 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {renderUserAvatar(other, showIndicator, indicatorTitle)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ 
                      fontWeight: 600, 
                      whiteSpace:'nowrap', 
                      overflow:'hidden', 
                      textOverflow:'ellipsis', 
                      flex:1, 
                      opacity: showIndicator ? 0.6 : 1 
                    }}>
                      {label}
                      {other?.studentNumber && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--muted)', 
                          marginLeft: '0.25rem', 
                          fontWeight: 'normal' 
                        }}>
                          ({other.studentNumber})
                        </span>
                      )}
                    </div>
                    {renderUnreadBadge(unreadCounts[`dm:${room.id}`] || 0)}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--muted)', 
                    display:'flex', 
                    justifyContent:'space-between', 
                    gap: 8 
                  }}>
                    <span style={{ 
                      whiteSpace:'nowrap', 
                      overflow:'hidden', 
                      textOverflow:'ellipsis' 
                    }}>
                      {room.lastMessage || ''}
                    </span>
                    <span style={{ color:'#888', marginLeft: 8 }}>
                      {lastTime ? formatDateTime(lastTime) : ''}
                    </span>
                  </div>
                  {/* Operations row */}
                  <div style={{ display:'flex', gap:8, marginTop:6 }}>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleStar(room); 
                      }}
                      title={(room.starBy || []).includes(user.uid) ? 
                        t('unfavorite') : 
                        t('favorite')}
                      style={{ 
                        background:'transparent', 
                        border:'1px solid var(--border)', 
                        borderRadius:6, 
                        padding:'2px 6px', 
                        cursor:'pointer', 
                        color:'#666', 
                        fontSize:'0.9rem', 
                        lineHeight:1 
                      }}
                    >
                      {(room.starBy||[]).includes(user.uid)?'★':'☆'}
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await toggleRoomArchive(room);
                      }}
                      title={archivedRooms[room.id] ? 
                        t('unarchive') : 
                        t('archive')}
                      style={{ 
                        background:'transparent', 
                        border:'1px solid var(--border)', 
                        borderRadius:6, 
                        padding:'2px 6px', 
                        cursor:'pointer', 
                        color:'#666', 
                        fontSize:'0.9rem', 
                        lineHeight:1 
                      }}
                    >
                      {archivedRooms[room.id] ? 
                        getThemedIcon('ui', 'upload', 14, theme) : 
                        getThemedIcon('ui', 'download', 14, theme)
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: archived + favorites toggle */}
      <div style={{ 
        padding:'0.5rem 0.9rem', 
        borderTop:'1px solid var(--border)', 
        display:'flex', 
        alignItems:'center', 
        gap:16 
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input 
            id="toggle-archived" 
            type="checkbox" 
            checked={showArchived} 
            onChange={(e)=>setShowArchived(e.target.checked)} 
          />
          <label 
            htmlFor="toggle-archived" 
            style={{ 
              fontSize:'0.85rem', 
              color:'#666', 
              cursor:'pointer' 
            }}
          >
            {t('show_archived')}
          </label>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input 
            id="toggle-favorites" 
            type="checkbox" 
            checked={showFavoritesOnly} 
            onChange={(e)=>setShowFavoritesOnly(e.target.checked)} 
          />
          <label 
            htmlFor="toggle-favorites" 
            style={{ 
              fontSize:'0.85rem', 
              color:'#666', 
              cursor:'pointer' 
            }}
          >
            {t('favorites_only')}
          </label>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        style={{
          position: 'absolute',
          right: -3,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 0.3s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
          e.currentTarget.style.background = 'var(--brand)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          e.currentTarget.style.background = 'var(--panel)';
        }}
        title={t('collapse_sidebar')}
      >
        {getThemedIcon('ui', 'chevron_left', 14, theme)}
      </button>

      {/* Drag handle */}
      <div
        onMouseDown={handleDragStartLocal}
        style={{ 
          position:'absolute', 
          right: -3, 
          top:0, 
          bottom:0, 
          width:6, 
          cursor:'col-resize' 
        }}
        aria-label={t('resize_sidebar')}
      />
    </div>
  );
});

ChatSidebar.displayName = 'ChatSidebar';

export default ChatSidebar;
