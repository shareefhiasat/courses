import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@services/other/config';
import notificationManager from '../utils/notifications';

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

  // Load notification settings from Firestore
  const loadSettings = useCallback(async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setSettings(prev => ({
          ...prev,
          soundEnabled: data.notificationSoundEnabled !== false,
          vibrationEnabled: data.notificationVibrationEnabled !== false,
          browserNotificationsEnabled: data.browserNotificationsEnabled !== false,
          permissionsRequested: data.notificationPermissionsRequested || false
        }));
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }, [user]);

  // Save notification settings to Firestore
  const saveSettings = useCallback(async (newSettings) => {
    if (!user) return false;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notificationSoundEnabled: newSettings.soundEnabled,
        notificationVibrationEnabled: newSettings.vibrationEnabled,
        browserNotificationsEnabled: newSettings.browserNotificationsEnabled,
        notificationPermissionsRequested: newSettings.permissionsRequested
      });
      setSettings(newSettings);
      return true;
    } catch (error) {
      console.error('Failed to save notification settings:', error);
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
      console.error('Failed to initialize notifications:', error);
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
