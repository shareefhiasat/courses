import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { getNotificationSettings, saveNotificationSettings } from '@services/business/notificationService';
import notificationManager from '../utils/notifications';
import { info, error, warn, debug } from '@services/utils/logger.js';

export const useNotifications = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    soundEnabled: true,
    vibrationEnabled: true,
    browserNotificationsEnabled: true,
    permissionsRequested: false
  });
  const [isInitializing, setIsInitializing] = useState(false);
  const initializationRef = useRef(false);

  // Load notification settings via service layer
  const loadSettings = useCallback(async () => {
    if (!user) return;

    try {
      const result = await getNotificationSettings(user.uid);
      if (result.success) {
        setSettings(prev => ({ ...prev, ...result.data }));
      }
    } catch (error) {
      error('Failed to load notification settings:', error);
    }
  }, [user]);

  // Save notification settings via service layer
  const saveSettings = useCallback(async (newSettings) => {
    if (!user) return false;

    try {
      const result = await saveNotificationSettings(user.uid, newSettings);
      if (result.success) {
        setSettings(newSettings);
        return true;
      }
      return false;
    } catch (error) {
      error('Failed to save notification settings:', error);
      return false;
    }
  }, [user]);

  // Initialize notification permissions
  const initializeNotifications = useCallback(async () => {
    if (initializationRef.current || !user) return;
    
    setIsInitializing(true);
    initializationRef.current = true;

    try {
      const results = await notificationManager.initializeOnUserInteraction();
      
      // Update settings based on results
      const newSettings = {
        ...settings,
        permissionsRequested: true,
        soundEnabled: settings.soundEnabled && results.audio,
        vibrationEnabled: settings.vibrationEnabled && results.vibration,
        browserNotificationsEnabled: settings.browserNotificationsEnabled && results.notification
      };

      await saveSettings(newSettings);
    } catch (error) {
      error('Failed to initialize notifications:', error);
    } finally {
      setIsInitializing(false);
    }
  }, [user, settings, saveSettings]);

  // Trigger notification with current settings
  const triggerNotification = useCallback(async (type, title, message, options = {}) => {
    const notificationOptions = {
      settings: {
        sound: settings.soundEnabled,
        vibration: settings.vibrationEnabled,
        browser: settings.browserNotificationsEnabled
      },
      ...options
    };

    return await notificationManager.smartNotification(type, title, message, notificationOptions);
  }, [settings]);

  // Update individual setting
  const updateSetting = useCallback(async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    const success = await saveSettings(newSettings);
    return success;
  }, [settings, saveSettings]);

  // Check if notifications are supported
  const checkSupport = useCallback(() => {
    return notificationManager.isSupported;
  }, []);

  // Check if running on mobile
  const isMobile = useCallback(() => {
    return notificationManager.isMobile();
  }, []);

  // Load settings on mount and when user changes
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isInitializing,
    initializeNotifications,
    triggerNotification,
    updateSetting,
    checkSupport,
    isMobile,
    saveSettings
  };
};

export default useNotifications;

