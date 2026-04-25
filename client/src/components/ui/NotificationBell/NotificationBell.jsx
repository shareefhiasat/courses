import React, { useState, useRef } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { NotificationDrawer } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import useNotificationsFeed from '@hooks/useNotificationsFeed';

const NotificationBell = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const { unreadCount } = useNotificationsFeed({ limit: 10 });
  const [showDrawer, setShowDrawer] = useState(false);
  const [focused, setFocused] = useState(false);
  const rootRef = useRef(null);

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
          {getThemedIcon('ui', 'bell', 18)}
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: 'rgb(255,215,31)',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              border: '2px solid white',
              boxSizing: 'border-box'
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
