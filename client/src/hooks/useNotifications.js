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
      const result = await getNotificationSettings();
      if (result && result.success && result.preferences) {
        const prefs = result.preferences;
        setSettings(prev => ({
          ...prev,
          soundEnabled: prefs.soundEnabled ?? prev.soundEnabled,
          vibrationEnabled: prefs.vibrationEnabled ?? prev.vibrationEnabled,
          browserNotificationsEnabled: prefs.browserNotifEnabled ?? prev.browserNotificationsEnabled,
          inAppEnabled: prefs.inAppEnabled ?? prev.inAppEnabled,
          emailEnabled: prefs.emailEnabled ?? prev.emailEnabled,
          smsEnabled: prefs.smsEnabled ?? prev.smsEnabled,
          pushEnabled: prefs.pushEnabled ?? prev.pushEnabled,
          permissionsRequested: true,
        }));
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }, [user]);

  // Save notification settings via service layer
  const saveSettings = useCallback(async (newSettings) => {
    if (!user) return false;

    try {
      const payload = {
        soundEnabled: newSettings.soundEnabled,
        vibrationEnabled: newSettings.vibrationEnabled,
        browserNotifEnabled: newSettings.browserNotificationsEnabled,
        inAppEnabled: newSettings.inAppEnabled ?? true,
        emailEnabled: newSettings.emailEnabled ?? false,
        smsEnabled: newSettings.smsEnabled ?? false,
        pushEnabled: newSettings.pushEnabled ?? false,
      };
      const result = await saveNotificationSettings(payload);
      if (result && result.success) {
        setSettings(newSettings);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      return false;
    }
  }, [user]);

  // Initialize notification permissions
  const initializeNotifications = useCallback(async () => {
    // TODO: Re-implement notifications in the future
    // Commented out to prevent ServiceWorkerManager errors
    // if (initializationRef.current || !user) return;
    // 
    // setIsInitializing(true);
    // initializationRef.current = true;
    //
    // try {
    //   const results = await notificationManager.initializeOnUserInteraction();
    //   
    //   // Update settings based on results
    //   const newSettings = {
    //     ...settings,
    //     permissionsRequested: true,
    //     soundEnabled: settings.soundEnabled && results.audio,
    //     vibrationEnabled: settings.vibrationEnabled && results.vibration,
    //     browserNotificationsEnabled: settings.browserNotificationsEnabled && results.notification
    //   };
    //
    //   await saveSettings(newSettings);
    // } catch (err) {
    //   console.error('Failed to initialize notifications:', err);
    // } finally {
    //   setIsInitializing(false);
    // }
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

