/**
 * useNotificationsFeed Hook
 * 
 * React hook for managing notification feed with WebSocket real-time updates.
 * Integrates with the notification socket singleton and API service.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import notificationService from '@services/business/notificationService';
import { getNotificationSocket, initializeNotificationSocket } from '@services/realtime/notificationSocket';

export const useNotificationsFeed = (options = {}) => {
  const { user } = useAuth();
  const { limit = 50, unreadOnly = false, category = null, archived = false } = options;
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Load notifications from API
  const loadNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const result = await notificationService.getNotifications({
        limit,
        unreadOnly,
        category,
        archived
      });
      
      if (result.success) {
        setNotifications(result.notifications || []);
        setUnreadCount(result.unreadCount || 0);
      } else {
        setError(result.error || 'Failed to load notifications');
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit, unreadOnly, category, archived]);

  // Refresh notifications
  const refresh = useCallback(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.markNotificationRead(notificationId);
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
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
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, isArchived: true, archivedAt: new Date().toISOString() }
              : n
          )
        );
        if (archived) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to archive notification:', err);
      return false;
    }
  }, [archived]);

  // Archive all read
  const archiveAllRead = useCallback(async () => {
    try {
      const result = await notificationService.archiveAllRead();
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.filter(n => !n.isRead || n.isArchived)
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
        // Update local state
        setNotifications(prev => {
          const notif = prev.find(n => n.id === notificationId);
          setNotifications(prev.filter(n => n.id !== notificationId));
          if (notif && !notif.isRead && !notif.isArchived) {
            setUnreadCount(prev => Math.max(0, prev - 1));
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

  // Initialize on mount and when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Initialize WebSocket connection
      initializeNotificationSocket().then(socket => {
        const handleNotification = (data) => {
          // New notification received via WebSocket
          setNotifications(prev => [data, ...prev]);
          if (!data.isRead && !data.isArchived) {
            setUnreadCount(prev => prev + 1);
          }
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
    markAllAsRead,
    archive,
    archiveAllRead,
    remove
  };
};

export default useNotificationsFeed;
