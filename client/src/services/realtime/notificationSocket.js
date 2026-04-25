/**
 * Notification Socket Client Singleton
 * 
 * Manages WebSocket connection for real-time notifications.
 * Singleton pattern ensures only one connection per browser session.
 */

import keycloak from '@config/keycloak';

class NotificationSocket {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnected = false;
    this.userId = null;
  }

  /**
   * Connect to WebSocket server
   * @param {string} token - JWT token for authentication
   * @returns {Promise<void>}
   */
  async connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[NotificationSocket] Already connected');
      return;
    }

    const wsUrl = this.getWebSocketUrl(token);
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('[NotificationSocket] Connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected', null);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[NotificationSocket] Message received:', message);
          
          if (message.type === 'notification:new') {
            this.emit('notification', message.data);
          } else if (message.type === 'connected') {
            this.userId = message.userId;
            this.emit('connected', message);
          } else if (message.type === 'pong') {
            // Ping/pong response
          }
        } catch (error) {
          console.error('[NotificationSocket] Failed to parse message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('[NotificationSocket] Disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.emit('disconnected', null);
        
        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          console.log(`[NotificationSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
          setTimeout(() => this.connect(token), delay);
        } else {
          console.error('[NotificationSocket] Max reconnection attempts reached');
          this.emit('error', { message: 'Max reconnection attempts reached' });
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[NotificationSocket] Error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('[NotificationSocket] Failed to connect:', error);
      this.emit('error', error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.userId = null;
      console.log('[NotificationSocket] Disconnected');
    }
  }

  /**
   * Get WebSocket URL with token
   * @param {string} token - JWT token
   * @returns {string} WebSocket URL
   */
  getWebSocketUrl(token) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsPath = process.env.NOTIFICATIONS_WS_PATH || '/ws/notifications';
    return `${protocol}//${host}${wsPath}?token=${encodeURIComponent(token)}`;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[NotificationSocket] Listener error for event "${event}":`, error);
        }
      });
    }
  }

  /**
   * Send ping message to keep connection alive
   */
  ping() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get current user ID
   * @returns {number|null} User ID
   */
  getUserId() {
    return this.userId;
  }
}

// Singleton instance
let socketInstance = null;

/**
 * Get or create notification socket singleton
 * @returns {NotificationSocket} Singleton instance
 */
export const getNotificationSocket = () => {
  if (!socketInstance) {
    socketInstance = new NotificationSocket();
  }
  return socketInstance;
};

/**
 * Initialize notification socket with authentication
 * @returns {Promise<NotificationSocket>} Socket instance
 */
export const initializeNotificationSocket = async () => {
  const socket = getNotificationSocket();
  const token = keycloak.token;
  
  if (token) {
    await socket.connect(token);
  } else {
    console.error('[NotificationSocket] No token available');
  }
  
  return socket;
};

export default getNotificationSocket;
