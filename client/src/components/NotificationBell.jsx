import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead,
  subscribeToNotifications 
} from '../firebase/notifications';
import { deleteNotification } from '../firebase/notifications';
import { useLang } from '../contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';

const NotificationBell = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [focused, setFocused] = useState(false);
  const prevUnreadRef = useRef(0);
  const audioRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const rootRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time notifications
    const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, [user]);

  // Load user preference for sound
  useEffect(() => {
    const loadPref = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.exists() ? snap.data() : {};
        setSoundEnabled(data.notificationSoundEnabled !== false);
      } catch {}
    };
    loadPref();
  }, [user]);

  // Prepare audio (guard browser support to avoid NotSupportedError)
  useEffect(() => {
    try {
      if (!audioRef.current) {
        const test = document.createElement('audio');
        const canPlayWav = !!test.canPlayType && test.canPlayType('audio/wav') !== '';
        if (canPlayWav) {
          // Tiny valid wav header tone (very short silence to avoid autoplay blocks)
          audioRef.current = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACAAABAQAA');
          audioRef.current.volume = 0.4;
        } else {
          // Disable sound if unsupported
          setSoundEnabled(false);
        }
      }
    } catch {
      setSoundEnabled(false);
    }
  }, []);

  // Play sound and show browser notification on unread increase
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    const prev = prevUnreadRef.current;
    if (unread > prev) {
      try { if (soundEnabled && audioRef.current) audioRef.current.play().catch(()=>{}); } catch {}
      // Browser notification
      try {
        if ('Notification' in window) {
          const maybeNotify = () => {
            const latest = notifications.find(n => !n.read) || notifications[0];
            if (!latest) return;
            const note = new Notification(latest.title || 'Notification', {
              body: latest.message || '',
              silent: true,
            });
            note.onclick = () => {
              window.focus();
              // Navigate to chat destination
              let dest = 'global';
              if (latest.data?.classId) dest = latest.data.classId;
              if (latest.data?.roomId) dest = `dm:${latest.data.roomId}`;
              const msgId = latest.data?.messageId;
              const url = msgId ? `/chat?dest=${encodeURIComponent(dest)}&msgId=${msgId}` : `/chat?dest=${encodeURIComponent(dest)}`;
              try { window.history.pushState({}, '', url); } catch {}
              try { window.dispatchEvent(new Event('popstate')); } catch {}
            };
          };
          if (Notification.permission === 'granted') {
            maybeNotify();
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(p => { if (p === 'granted') maybeNotify(); });
          }
        }
      } catch {}
    }
    prevUnreadRef.current = unread;
  }, [notifications, soundEnabled]);

  // Click outside / Escape to close
  useEffect(() => {
    if (!showDropdown) return;
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setShowDropdown(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setShowDropdown(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showDropdown]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimeCompact = (ts) => {
    const d = ts?.toDate?.() || (ts?.seconds ? new Date(ts.seconds * 1000) : (ts instanceof Date ? ts : null));
    if (!d) return '';
    const diff = Math.floor((Date.now() - d.getTime())/1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    return d.toLocaleDateString('en-GB');
  };

  const handleClearAll = async () => {
    if (!notifications.length) return;
    setShowConfirmClear(true);
  };

  const confirmClearAll = async () => {
    setLoading(true);
    try {
      await Promise.all(notifications.map(n => deleteNotification(n.id)));
      setShowDropdown(false);
    } finally {
      setLoading(false);
      setShowConfirmClear(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    setLoading(true);
    try {
      await markNotificationRead(notificationId);
    } finally {
      setLoading(false);
    }
  };

  const gotoFromNotification = (n) => {
    // Build destination query
    let dest = 'global';
    if (n.data?.classId) dest = n.data.classId; // class id
    if (n.data?.roomId) dest = `dm:${n.data.roomId}`;
    
    // Include message ID if available for highlighting
    const msgId = n.data?.messageId;
    const url = msgId 
      ? `/chat?dest=${encodeURIComponent(dest)}&msgId=${msgId}`
      : `/chat?dest=${encodeURIComponent(dest)}`;
    
    navigate(url);
    setShowDropdown(false);
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setLoading(true);
    try {
      await markAllNotificationsRead(user.uid);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'announcement': return '📢';
      case 'grade': return '📊';
      case 'activity': return '🎯';
      default: return 'ℹ️';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }} ref={rootRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '0.5rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(255,255,255,0.45)' : 'none',
          transition: 'box-shadow 0.15s ease-in-out'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            background: '#dc3545',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '0.7rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div>
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading || unreadCount === 0}
                style={{
                  background: 'none', border: 'none', color: unreadCount>0?'#667eea':'#bbb', cursor: unreadCount>0?'pointer':'default', fontSize: '0.9rem', marginRight: '8px'
                }}
              >
                {t('mark_all_read')}
              </button>
              <button
                onClick={handleClearAll}
                disabled={loading || notifications.length === 0}
                style={{
                  background: 'none', border: 'none', color: notifications.length>0?'#dc3545':'#bbb', cursor: notifications.length>0?'pointer':'default', fontSize: '0.9rem'
                }}
                title="Clear all notifications"
              >
                {t('clear_all') || 'Clear all'}
              </button>
            </div>
        {/* Footer toggle for sound */}
        <div style={{ padding:'0.5rem', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <label htmlFor="notif-sound" style={{ fontSize:'0.85rem', color:'var(--muted)' }}>Sound</label>
          <input id="notif-sound" type="checkbox" checked={soundEnabled} onChange={async (e)=>{
            const v = e.target.checked; setSoundEnabled(v);
            try { if (user) await setDoc(doc(db,'users',user.uid), { notificationSoundEnabled: v }, { merge:true }); } catch {}
          }} />
        </div>
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              notifications.slice(0, 10).map(notification => (
                <div
                  key={notification.id}
                  onClick={() => { if (!notification.read) handleMarkAsRead(notification.id); gotoFromNotification(notification); }}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: notification.read ? 'default' : 'pointer',
                    background: notification.read ? 'white' : '#f8f9ff',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: notification.read ? 'normal' : 'bold',
                        fontSize: '0.9rem',
                        marginBottom: '0.25rem',
                        color: '#333'
                      }}>
                        {notification.title}
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#666',
                        lineHeight: '1.3',
                        marginBottom: '0.25rem'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#999' }}>
                        {formatTimeCompact(notification.createdAt)}
                      </div>
                    </div>
                    {!notification.read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#667eea',
                        borderRadius: '50%',
                        flexShrink: 0,
                        marginTop: '0.25rem'
                      }} />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
                {t('nothing_yet') || 'Nothing yet!'}
              </div>
            )}
          </div>

          {notifications.length > 10 && (
            <div style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid #eee',
              textAlign: 'center'
            }}>
              <button style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}>
                {t('view_all_notifications') || 'View all notifications'}
              </button>
            </div>
          )}
        </div>
      )}
      <Modal
        open={showConfirmClear}
        title={t('confirm') || 'Confirm'}
        onClose={() => setShowConfirmClear(false)}
        actions={(
          <>
            <button onClick={() => setShowConfirmClear(false)} className="btn btn-secondary">{t('cancel') || 'Cancel'}</button>
            <button onClick={confirmClearAll} className="btn btn-danger">{t('clear_all') || 'Clear all'}</button>
          </>
        )}
      >
        <p style={{ margin: 0 }}>{t('are_you_sure_clear_all') || 'Are you sure you want to delete all notifications? This cannot be undone.'}</p>
      </Modal>
    </div>
  );
};

export default NotificationBell;
