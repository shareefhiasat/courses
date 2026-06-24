/**
 * Chat WebSocket Client
 * 
 * Manages real-time chat message delivery via WebSocket
 */

import { info, error, warn, debug } from '@services/utils/logger.js';

class ChatSocket {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.connected = false;
    this.connecting = false;
    this.token = null;
  }

  /**
   * Connect to chat WebSocket server
   * @param {string} token - JWT token for authentication
   */
  connect(token) {
    if (this.connected || this.connecting) {
      debug('[chatSocket] Already connected or connecting');
      return;
    }

    this.token = token;
    this.connecting = true;

    try {
      // Use Vite dev server proxy for WebSocket - connect to same host as frontend
      // This avoids mixed content issues (HTTPS page -> WS backend)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host; // e.g., localhost:5174
      const wsPath = import.meta.env.VITE_CHAT_WS_PATH || '/ws/notifications';
      const wsUrl = `${protocol}//${host}${wsPath}?token=${encodeURIComponent(token)}`;

      info('[chatSocket] Connecting to:', wsUrl.replace(token, '***'));

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        info('[chatSocket] Connected');
        this.connected = true;
        this.connecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          debug('[chatSocket] Message received:', message.type);
          
          // Handle different message types
          switch (message.type) {
            case 'connected':
              this.emit('connected', message);
              break;
            case 'chat:message':
              this.emit('message', message.data);
              break;
            case 'chat:message_updated':
              this.emit('message_updated', message.data);
              break;
            case 'chat:message_deleted':
              this.emit('message_deleted', message.data);
              break;
            case 'chat:reaction':
              this.emit('reaction', message.data);
              break;
            case 'chat:poll_vote':
              this.emit('poll_vote', message.data);
              break;
            case 'pong':
              // Keepalive response
              break;
            default:
              warn('[chatSocket] Unknown message type:', message.type);
          }
        } catch (err) {
          error('[chatSocket] Error parsing message:', err);
        }
      };

      this.ws.onerror = (err) => {
        error('[chatSocket] WebSocket error:', err);
        this.emit('error', err);
      };

      this.ws.onclose = (event) => {
        info('[chatSocket] Disconnected:', event.code, event.reason);
        this.connected = false;
        this.connecting = false;
        this.emit('disconnected');

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
          info(`[chatSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
          
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(this.token);
          }, delay);
        } else {
          error('[chatSocket] Max reconnect attempts reached');
        }
      };

      // Send periodic ping to keep connection alive
      this.pingInterval = setInterval(() => {
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Every 30 seconds

    } catch (err) {
      error('[chatSocket] Connection error:', err);
      this.connecting = false;
      this.emit('error', err);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
    this.connecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Unregister event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to all registered listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        error(`[chatSocket] Error in ${event} listener:`, err);
      }
    });
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
const chatSocket = new ChatSocket();

export default chatSocket;
