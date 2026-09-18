/**
 * useNotificationsFeed Hook
 * 
 * React hook for managing notification feed with WebSocket real-time updates.
 * Integrates with the notification socket singleton and API service.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import notificationService from '@services/business/notificationService';
import { getNotificationSocket, initializeNotificationSocket } from '@services/realtime/notificationSocket';
import notificationManager from '@utils/notifications';
import { getNotificationSettings } from '@services/business/notificationService';

export const useNotificationsFeed = (options = {}) => {
  const { user } = useAuth();
  const { lang } = useLang();
  const { limit = 50, unreadOnly = false, category = null, archived } = options;
  
  const [notifications, setNotifications] = useState([]);
  const notificationsRef = useRef([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Sync ref with current notifications for loadNotifications merge
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Track recently deleted/archived notification IDs to prevent socket from re-adding them
  const deletedNotificationIds = useRef(new Set());
  const archivedNotificationIds = useRef(new Set());

  // Cache notification settings for real-time sound/browser notifications
  const settingsRef = useRef({ soundEnabled: true, browserNotificationsEnabled: true });

  // Load settings on mount and refresh periodically
  useEffect(() => {
    if (!user) return;
    const loadSettings = async () => {
      try {
        const result = await getNotificationSettings();
        if (result?.success && result.preferences) {
          const prefs = result.preferences;
          settingsRef.current = {
            soundEnabled: prefs.soundEnabled ?? true,
            browserNotificationsEnabled: prefs.browserNotifEnabled ?? true,
          };
        }
      } catch (err) {
        console.error('Failed to load notification settings for real-time:', err);
      }
    };
    loadSettings();
  }, [user]);

  // Load notifications from API
  const loadNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const params = { limit, unreadOnly, category, lang };
      if (archived != null) params.archived = archived;
      const result = await notificationService.getNotifications(params);
      
      if (result.success) {
        const loadedNotifications = result.notifications || [];
        const loadedIds = new Set(loadedNotifications.map(n => n.id));
        const pending = (notificationsRef.current || [])
          .filter(n => n.fromSocket && !loadedIds.has(n.id))
          .map(n => ({ ...n, fromSocket: false }));
        const merged = [...pending, ...loadedNotifications];
        setNotifications(merged);
        // Calculate unread count locally from merged notifications
        const calculatedUnread = merged.filter(n => !n.isRead && !n.isArchived).length;
        setUnreadCount(calculatedUnread);
      } else {
        setError(result.error || 'Failed to load notifications');
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit, unreadOnly, category, archived, lang]);

  // Refresh notifications
  const refresh = useCallback(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.markNotificationRead(notificationId);
      if (result.success) {
        let wasUnread = false;
        setNotifications(prev =>
          prev.map(n => {
            if (n.id !== notificationId) return n;
            wasUnread = !n.isRead && !n.isArchived;
            return { ...n, isRead: true, readAt: new Date().toISOString() };
          })
        );
        setUnreadCount(prev => Math.max(0, prev - (wasUnread ? 1 : 0)));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      return false;
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await notificationService.markAllRead();
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      return false;
    }
  }, []);

  // Archive notification
  const archive = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.archiveNotification(notificationId);
      if (result.success) {
        // Track this ID to prevent socket from re-adding it
        archivedNotificationIds.current.add(notificationId);

        // Clean up after 30 seconds
        setTimeout(() => {
          archivedNotificationIds.current.delete(notificationId);
        }, 30000);

        // Update local state - mark as archived (and read) so it appears in the archive filter
        let wasUnread = false;
        setNotifications(prev =>
          prev.map(n => {
            if (n.id !== notificationId) return n;
            wasUnread = !n.isRead && !n.isArchived;
            return { ...n, isArchived: true, isRead: true, readAt: new Date().toISOString() };
          })
        );
        setUnreadCount(prev => Math.max(0, prev - (wasUnread ? 1 : 0)));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to archive notification:', err);
      return false;
    }
  }, []);

  // Unarchive notification
  const unarchive = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.unarchiveNotification(notificationId);
      if (result.success) {
        let wasUnread = false;
        setNotifications(prev =>
          prev.map(n => {
            if (n.id !== notificationId) return n;
            wasUnread = !n.isRead;
            return { ...n, isArchived: false, archivedAt: null };
          })
        );
        if (wasUnread) {
          setUnreadCount(prev => prev + 1);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to unarchive notification:', err);
      return false;
    }
  }, []);

  // Archive all read
  const archiveAllRead = useCallback(async () => {
    try {
      const result = await notificationService.archiveAllRead();
      if (result.success) {
        // Update local state - archive all read items so they move to the archive filter
        setNotifications(prev =>
          prev.map(n => (n.isRead && !n.isArchived ? { ...n, isArchived: true } : n))
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to archive all read:', err);
      return false;
    }
  }, []);

  // Delete notification
  const remove = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.deleteNotification(notificationId);
      if (result.success) {
        // Track this ID to prevent socket from re-adding it
        deletedNotificationIds.current.add(notificationId);
        
        // Clean up after 30 seconds
        setTimeout(() => {
          deletedNotificationIds.current.delete(notificationId);
        }, 30000);
        
        // Update local state
        setNotifications(prev => {
          const notif = prev.find(n => n.id === notificationId);
          if (notif && !notif.isRead && !notif.isArchived) {
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
          }
          return prev.filter(n => n.id !== notificationId);
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete notification:', err);
      return false;
    }
  }, []);

  // Mark notification as unread
  const markAsUnread = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.markNotificationUnread(notificationId);
      if (result.success) {
        let wasRead = false;
        setNotifications(prev =>
          prev.map(n => {
            if (n.id !== notificationId) return n;
            wasRead = n.isRead && !n.isArchived;
            return { ...n, isRead: false, readAt: null };
          })
        );
        setUnreadCount(prev => prev + (wasRead ? 1 : 0));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to mark notification as unread:', err);
      return false;
    }
  }, []);

  // Initialize on mount and when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Initialize WebSocket connection
      initializeNotificationSocket().then(socket => {
        const handleNotification = (data) => {
          // New notification received via WebSocket (already mapped by backend)
          const mapped = data || {};
          mapped.fromSocket = true;

          // Don't add if this notification was recently deleted or archived
          if (deletedNotificationIds.current.has(mapped.id)) {
            return;
          }
          if (archivedNotificationIds.current.has(mapped.id)) {
            return;
          }
          
          setNotifications(prev => {
            // Deduplicate: skip if notification with same ID already exists
            if (prev.some(n => n.id === mapped.id)) {
              return prev;
            }
            return [mapped, ...prev];
          });
          if (!mapped.isRead && !mapped.isArchived) {
            setUnreadCount(prev => prev + 1);
          }

          // Trigger sound + browser notification based on user settings
          const settings = settingsRef.current;
          const title = mapped.title || mapped.message || 'New Notification';
          const body = mapped.message || mapped.body || '';
          notificationManager.smartNotification('default', title, body, {
            settings: {
              sound: settings.soundEnabled,
              vibration: false, // desktop, no vibration needed
              browser: settings.browserNotificationsEnabled,
            },
          });
        };
        
        const handleConnected = () => {
          setSocketConnected(true);
        };
        
        const handleDisconnected = () => {
          setSocketConnected(false);
        };
        
        socket.on('notification', handleNotification);
        socket.on('connected', handleConnected);
        socket.on('disconnected', handleDisconnected);
        
        setSocketConnected(socket.getConnectionStatus());
        
        return () => {
          socket.off('notification', handleNotification);
          socket.off('connected', handleConnected);
          socket.off('disconnected', handleDisconnected);
        };
      }).catch(err => {
        console.error('Failed to initialize notification socket:', err);
      });
    }
  }, [user, loadNotifications]);

  // Refresh cached settings (called after user toggles sound/browser in drawer)
  const refreshSettings = useCallback(async () => {
    if (!user) return;
    try {
      const result = await getNotificationSettings();
      if (result?.success && result.preferences) {
        const prefs = result.preferences;
        settingsRef.current = {
          soundEnabled: prefs.soundEnabled ?? true,
          browserNotificationsEnabled: prefs.browserNotifEnabled ?? true,
        };
      }
    } catch (err) {
      console.error('Failed to refresh notification settings:', err);
    }
  }, [user]);

  // Memoized values
  const unreadNotifications = useMemo(() => 
    notifications.filter(n => !n.isRead && !n.isArchived), 
    [notifications]
  );

  const readNotifications = useMemo(() => 
    notifications.filter(n => n.isRead && !n.isArchived), 
    [notifications]
  );

  const archivedNotifications = useMemo(() => 
    notifications.filter(n => n.isArchived), 
    [notifications]
  );

  return {
    notifications,
    unreadNotifications,
    readNotifications,
    archivedNotifications,
    unreadCount,
    loading,
    refreshing,
    error,
    socketConnected,
    refresh,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    archive,
    unarchive,
    archiveAllRead,
    remove,
    refreshSettings
  };
};

export default useNotificationsFeed;
