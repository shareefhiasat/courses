import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useColorTheme } from '@contexts/ColorThemeContext';
import { NotificationDrawer } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import useNotificationsFeed from '@hooks/useNotificationsFeed';

const NotificationBell = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const { primaryColor } = useColorTheme();
  const { unreadCount } = useNotificationsFeed({ limit: 10 });
  const [showDrawer, setShowDrawer] = useState(false);
  const [focused, setFocused] = useState(false);
  const [balloonKey, setBalloonKey] = useState(0);
  const prevUnreadRef = useRef(0);
  const rootRef = useRef(null);

  // Trigger balloon animation when unread count increases
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setBalloonKey(prev => prev + 1);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

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
            border: '1px solid rgba(255,255,255,0.95)',
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
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key={balloonKey}
                initial={{ scale: 0, y: 5 }}
                animate={{ scale: [0, 1.3, 1], y: 0 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: 'rgb(255,215,31)',
                  color: '#15803d',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  border: '2px solid #fff',
                  boxSizing: 'border-box',
                  textShadow: '0 0 2px rgba(255,255,255,0.8)',
                  boxShadow: '0 0 6px 1px rgba(34,197,94,0.45)'
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      <NotificationDrawer isOpen={showDrawer} onClose={() => setShowDrawer(false)} />
    </>
  );
};

export default NotificationBell;
