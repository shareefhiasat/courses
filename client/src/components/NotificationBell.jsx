import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToNotifications } from '../firebase/notifications';
import { useLang } from '../contexts/LangContext';
import NotificationDrawer from './NotificationDrawer';
import { Bell } from 'lucide-react';

const NotificationBell = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const [notifications, setNotifications] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [focused, setFocused] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
    });
    return unsubscribe;
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;

  if (!user) return null;

  return (
    <>
      <div style={{ position: 'relative' }} ref={rootRef}>
        <button
          onClick={() => setShowDrawer(true)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            background: 'linear-gradient(135deg, #D4AF37, #FFD700)',
            border: '1px solid rgba(255,255,255,0.7)',
            cursor: 'pointer',
            position: 'relative',
            padding: 0,
            borderRadius: 8,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            outline: 'none',
            boxShadow: focused ? '0 0 0 2px rgba(0,0,0,0.25)' : 'none',
            transition: 'box-shadow 0.15s ease-in-out'
          }}
        >
          <Bell size={18} color="#2E3B4E" />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: '#dc3545',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              border: '2px solid white'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
      <NotificationDrawer isOpen={showDrawer} onClose={() => setShowDrawer(false)} />
    </>
  );
};

export default NotificationBell;
