/**
 * Notification Sound and Vibration Utility
 * Handles mobile notification sounds and vibration that work even when phone is asleep
 */

import serviceWorkerManager from './serviceWorker';

class NotificationManager {
  constructor() {
    this.audioContext = null;
    this.oscillator = null;
    this.gainNode = null;
    this.isSupported = this.checkSupport();
    this.permissions = {
      notification: 'default',
      sound: true,
      vibration: true
    };
  }

  checkSupport() {
    return {
      audio: !!(window.AudioContext || window.webkitAudioContext),
      vibration: 'vibrate' in navigator,
      notification: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'serviceWorker' in navigator && 'PushManager' in window
    };
  }

  async initializeAudio() {
    if (!this.audioContext && this.isSupported.audio) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Resume audio context if suspended (required by some browsers)
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        
        return true;
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
        return false;
      }
    }
    return !!this.audioContext;
  }

  async requestNotificationPermission() {
    if (!this.isSupported.notification) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissions.notification = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  async requestPermissions() {
    const results = {
      notification: await this.requestNotificationPermission(),
      audio: await this.initializeAudio(),
      vibration: this.isSupported.vibration,
      serviceWorker: serviceWorkerManager.isReady() || await serviceWorkerManager.register()
    };

    return results;
  }

  playNotificationSound(type = 'default') {
    if (!this.isSupported.audio || !this.audioContext) {
      return false;
    }

    try {
      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Create oscillator for beep sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure sound based on type
      switch (type) {
        case 'message':
        case 'chat':
          oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
          break;
        case 'success':
          oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
          break;
        case 'warning':
          oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
          oscillator.frequency.setValueAtTime(554.37, this.audioContext.currentTime + 0.1); // C#5
          break;
        case 'error':
          oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.2);
          break;
        default:
          oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
      }

      // Set volume envelope
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      // Play sound
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);

      return true;
    } catch (error) {
      console.error('Failed to play notification sound:', error);
      return false;
    }
  }

  vibrate(pattern = 'default') {
    if (!this.isSupported.vibration) {
      return false;
    }

    try {
      let vibratePattern;
      
      switch (pattern) {
        case 'short':
          vibratePattern = 50;
          break;
        case 'long':
          vibratePattern = [200, 100, 200];
          break;
        case 'double':
          vibratePattern = [100, 50, 100];
          break;
        case 'triple':
          vibratePattern = [100, 50, 100, 50, 100];
          break;
        case 'message':
        case 'chat':
          vibratePattern = [50, 30, 50];
          break;
        case 'success':
          vibratePattern = [100, 50, 200];
          break;
        case 'warning':
          vibratePattern = [150, 100, 150];
          break;
        case 'error':
          vibratePattern = [200, 100, 200, 100, 200];
          break;
        default:
          vibratePattern = [100];
      }

      navigator.vibrate(vibratePattern);
      return true;
    } catch (error) {
      console.error('Failed to vibrate:', error);
      return false;
    }
  }

  async showBrowserNotification(title, options = {}) {
    if (!this.isSupported.notification || this.permissions.notification !== 'granted') {
      return false;
    }

    try {
      // Try service worker first for better mobile support
      if (serviceWorkerManager.isReady()) {
        return await serviceWorkerManager.showLocalNotification(title, {
          body: options.body || message,
          vibrate: options.vibrate || [100, 50, 100],
          requireInteraction: false,
          silent: false,
          tag: options.tag || 'notification',
          data: options.data || {}
        });
      }

      // Fallback to regular Notification API
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: options.vibrate || [100, 50, 100],
        requireInteraction: false,
        silent: false,
        ...options
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) {
          options.onClick();
        }
      };

      return true;
    } catch (error) {
      console.error('Failed to show browser notification:', error);
      return false;
    }
  }

  async triggerNotification(type = 'default', title, message, options = {}) {
    const settings = options.settings || {
      sound: true,
      vibration: true,
      browser: true
    };

    // Play sound
    if (settings.sound && this.permissions.sound) {
      this.playNotificationSound(type);
    }

    // Vibrate
    if (settings.vibration && this.permissions.vibration) {
      this.vibrate(type);
    }

    // Show browser notification
    if (settings.browser && title) {
      await this.showBrowserNotification(title, {
        body: message,
        ...options
      });
    }

    return true;
  }

  // Initialize on user interaction (required by browsers)
  async initializeOnUserInteraction() {
    const results = await this.requestPermissions();
    
    // Store in localStorage for persistence
    localStorage.setItem('notificationPermissions', JSON.stringify({
      ...this.permissions,
      ...results
    }));

    return results;
  }

  loadStoredPermissions() {
    try {
      const stored = localStorage.getItem('notificationPermissions');
      if (stored) {
        const permissions = JSON.parse(stored);
        this.permissions = { ...this.permissions, ...permissions };
      }
    } catch (error) {
      console.error('Failed to load stored permissions:', error);
    }
  }

  // Check if we're on mobile
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Check if page is visible (not in background)
  isPageVisible() {
    return !document.hidden;
  }

  // Enhanced notification that considers page visibility and mobile state
  async smartNotification(type, title, message, options = {}) {
    const isMobile = this.isMobile();
    const isVisible = this.isPageVisible();

    // If page is visible and not mobile, just play sound
    if (isVisible && !isMobile) {
      if (options.settings?.sound) {
        this.playNotificationSound(type);
      }
      return;
    }

    // If page is not visible or mobile, use full notification
    await this.triggerNotification(type, title, message, options);
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

// Auto-load stored permissions
if (typeof window !== 'undefined') {
  notificationManager.loadStoredPermissions();
}

export default notificationManager;
export { NotificationManager };
