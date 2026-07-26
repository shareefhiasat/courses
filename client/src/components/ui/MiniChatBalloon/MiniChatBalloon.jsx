/**
 * MiniChatBalloon
 *
 * Draggable floating chat shortcut widget for admin/HR roles.
 * A simple FAB that opens the /chat page in a new tab when clicked.
 * Shows unread message count badge.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import chatSocket from '@services/realtime/chatSocket.js';
import { getUserRooms } from '@services/business/chatService.js';
import styles from './MiniChatBalloon.module.css';

const STORAGE_KEY = 'mini-chat-balloon-position';
const FAB_SIZE = 48;
const DEFAULT_MARGIN = 16;

const MiniChatBalloon = ({ groupRole = 'hr', groupLabel }) => {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isRTL = lang === 'ar';

  const wrapperRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, origLeft: 0, origTop: 0, moved: false });

  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {
      left: isRTL ? DEFAULT_MARGIN : undefined,
      right: isRTL ? undefined : DEFAULT_MARGIN,
      bottom: DEFAULT_MARGIN,
      top: undefined,
    };
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [hrGroupId, setHrGroupId] = useState(null);

  const myId = user?.dbId;

  // ── Unread count logic ─────────────────────────────────────────────────────
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const result = await getUserRooms();
        if (result.success) {
          // Calculate total unread from all rooms
          // This is a simplified approach - you may need to adjust based on your chat API
          const total = result.data.reduce((sum, room) => {
            return sum + (room.unreadCount || 0);
          }, 0);
          setUnreadCount(total);

          // Find HR group ID
          const hrGroup = result.data.find(room => room.name === '__ROLE_GROUP_hr__');
          if (hrGroup) {
            setHrGroupId(hrGroup.id);
          }
        }
      } catch (error) {
        console.error('Failed to load unread count:', error);
      }
    };

    loadUnreadCount();

    // Listen for new messages to update unread count
    const handleMessage = (message) => {
      if (message.senderId !== myId) {
        setUnreadCount(prev => prev + 1);
      }
    };

    chatSocket.on('message', handleMessage);

    return () => {
      chatSocket.off('message', handleMessage);
    };
  }, [myId]);

  // ── Drag handling (same pattern as DraggableFab) ──────────────────────────
  const clampToViewport = useCallback((left, top) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      left: Math.max(8, Math.min(left, w - FAB_SIZE - 8)),
      top: Math.max(8, Math.min(top, h - FAB_SIZE - 8)),
    };
  }, []);

  const persistPos = useCallback((left, top) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ left, top }));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (pos.top != null && pos.left != null) {
        const clamped = clampToViewport(pos.left, pos.top);
        setPos(clamped);
        persistPos(clamped.left, clamped.top);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pos, clampToViewport, persistPos]);

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: rect.left,
      origTop: rect.top,
      moved: false,
    };
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragState.current.moved = true;
      const newLeft = dragState.current.origLeft + dx;
      const newTop = dragState.current.origTop + dy;
      const clamped = clampToViewport(newLeft, newTop);
      setPos({ left: clamped.left, top: clamped.top, right: undefined, bottom: undefined });
    }
  }, [clampToViewport]);

  const handlePointerUp = useCallback(() => {
    if (dragState.current.dragging && dragState.current.moved) {
      if (pos.left != null && pos.top != null) {
        persistPos(pos.left, pos.top);
      }
    }
    dragState.current.dragging = false;
  }, [pos, persistPos]);

  useEffect(() => {
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const handleFabClick = useCallback(() => {
    if (dragState.current.moved) return; // was a drag, not a click
    // Open chat in new tab, directly to HR group if available
    const url = hrGroupId ? `/chat?dest=group:${hrGroupId}` : '/chat';
    window.open(url, '_blank');
  }, [hrGroupId]);

  const wrapperStyle = {
    left: pos.left != null ? `${pos.left}px` : undefined,
    top: pos.top != null ? `${pos.top}px` : undefined,
    right: pos.right != null ? `${pos.right}px` : undefined,
    bottom: pos.bottom != null ? `${pos.bottom}px` : undefined,
  };

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${isDark ? styles.dark : ''}`}
      style={wrapperStyle}
    >
      <button
        type="button"
        className={styles.fab}
        onPointerDown={handlePointerDown}
        onClick={handleFabClick}
        aria-label={t('mini_chat_title') || 'Chat'}
      >
        <MessageCircle size={16} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>
    </div>
  );
};

export default MiniChatBalloon;
