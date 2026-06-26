/**
 * WebSocket Server for Real-time Notifications
 * 
 * Implements a WebSocket server at /ws/notifications for real-time notification delivery.
 * Uses Keycloak token authentication.
 */

import { WebSocketServer } from 'ws';
import prisma from '../db/prismaClient.js';
import jwt from 'jsonwebtoken';


// Store connected clients: Map<userId, Set<WebSocket>>
const clients = new Map();

/**
 * Verify Keycloak JWT token and extract user info
 * @param {string} token - JWT token from handshake
 * @returns {Object|null} User info or null if invalid
 */
const verifyToken = async (token) => {
  try {
    if (!token) return null;
    
    // Remove 'Bearer ' prefix if present
    const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    // Simple JWT decode without verification for development (same as keycloakAuth middleware)
    const decoded = jwt.decode(actualToken);
    
    if (!decoded) {
      throw new Error('Invalid token');
    }
    
    // Check token expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    return decoded;
  } catch (error) {
    console.error('[WebSocket] Token verification failed:', error.message);
    return null;
  }
};

/**
 * Create and initialize WebSocket server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} WebSocket server instance with emit function
 */
export const createNotificationWebSocketServer = (httpServer) => {
  const wss = new WebSocketServer({
    server: httpServer,
    path: process.env.NOTIFICATIONS_WS_PATH || '/ws/notifications'
  });
  
  wss.on('connection', async (ws, req) => {
    // Extract token from query parameter or header
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || req.headers['authorization'];
    
    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded) {
      ws.close(4001, 'Authentication failed');
      return;
    }
    
    // Get user ID from Keycloak subject or email
    const keycloakId = decoded.sub || decoded.preferred_username;
    let user;
    
    try {
      user = await prisma.user.findUnique({
        where: { keycloakId }
      });
      
      if (!user) {
        // Fallback to email lookup
        user = await prisma.user.findUnique({
          where: { email: decoded.email || decoded.preferred_username }
        });
      }
      
      if (!user) {
        ws.close(4002, 'User not found');
        return;
      }
    } catch (error) {
      console.error('[WebSocket] User lookup failed:', error);
      ws.close(4003, 'User lookup failed');
      return;
    }
    
    const userId = user.id;
    
    // Add client to map
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId).add(ws);
    
    console.log(`[WebSocket] Client connected: userId=${userId}, totalClients=${clients.size}`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      userId,
      timestamp: new Date().toISOString()
    }));
    
    // Handle incoming messages (if needed for future features)
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('[WebSocket] Message received:', message);
        
        // Handle ping/pong for keepalive
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('[WebSocket] Message parse error:', error);
      }
    });
    
    // Handle disconnect
    ws.on('close', () => {
      const userClients = clients.get(userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          clients.delete(userId);
        }
      }
      console.log(`[WebSocket] Client disconnected: userId=${userId}, totalClients=${clients.size}`);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });
  });
  
  // Emit function for notification gateway
  const emit = (userId, event, data) => {
    const userClients = clients.get(userId);
    if (userClients && userClients.size > 0) {
      const message = JSON.stringify({
        type: event,
        data,
        timestamp: new Date().toISOString()
      });
      
      userClients.forEach(client => {
        if (client.readyState === 1) { // OPEN
          client.send(message);
        }
      });
      
      console.log(`[WebSocket] Emitted to user ${userId}: ${event}`);
    }
  };
  
  // Broadcast function (for admin alerts, etc.)
  const broadcast = (event, data) => {
    const message = JSON.stringify({
      type: event,
      data,
      timestamp: new Date().toISOString()
    });
    
    clients.forEach((userClients) => {
      userClients.forEach(client => {
        if (client.readyState === 1) { // OPEN
          client.send(message);
        }
      });
    });
    
    console.log(`[WebSocket] Broadcasted: ${event}`);
  };
  
  // Get connected users count
  const getConnectedCount = () => {
    return clients.size;
  };
  
  console.log('[WebSocket] Server initialized on path:', process.env.NOTIFICATIONS_WS_PATH || '/ws/notifications');
  
  // Expose emit and broadcast globally for chat controller
  global.chatWSEmitter = emit;
  global.chatWSBroadcast = broadcast;
  
  return {
    wss,
    emit,
    broadcast,
    getConnectedCount
  };
};

export default {
  createNotificationWebSocketServer
};
