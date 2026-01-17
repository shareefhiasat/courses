// Service Worker Registration Utility
class ServiceWorkerManager {
  constructor() {
    this.swRegistration = null;
    this.isSupported = 'serviceWorker' in navigator;
  }

  async register() {
    if (!this.isSupported) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.swRegistration = registration;
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      console.log('Service Worker registered successfully:', registration);
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async unregister() {
    if (!this.swRegistration) {
      return true;
    }

    try {
      const result = await this.swRegistration.unregister();
      this.swRegistration = null;
      console.log('Service Worker unregistered:', result);
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  async requestNotificationPermission() {
    if (!this.swRegistration) {
      console.warn('Service Worker not registered');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  async subscribeToPush() {
    if (!this.swRegistration) {
      console.warn('Service Worker not registered');
      return null;
    }

    try {
      // This would typically involve your backend for push notifications
      // For now, we'll just return the subscription info
      const subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        const newSubscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array('your-vapid-public-key')
        });
        return newSubscription;
      }
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async showLocalNotification(title, options = {}) {
    if (!this.swRegistration) {
      console.warn('Service Worker not registered');
      return false;
    }

    try {
      await this.swRegistration.showNotification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        requireInteraction: false,
        silent: false,
        ...options
      });
      return true;
    } catch (error) {
      console.error('Failed to show local notification:', error);
      return false;
    }
  }

  getRegistration() {
    return this.swRegistration;
  }

  isReady() {
    return !!this.swRegistration;
  }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

// Auto-register if supported
if (typeof window !== 'undefined' && serviceWorkerManager.isSupported) {
  // Wait for page to load before registering
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      serviceWorkerManager.register();
    });
  } else {
    serviceWorkerManager.register();
  }
}

export default serviceWorkerManager;
export { ServiceWorkerManager };
