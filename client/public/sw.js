// Service Worker for Enhanced Mobile Notifications
const CACHE_NAME = 'courses-app-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.ico'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache).catch((error) => {
          console.log('Cache addAll failed:', error);
          // Continue with partial cache
          return Promise.resolve();
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://') || 
      event.request.url.startsWith('chrome-error://') ||
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // For network requests, add proper error handling
        return fetch(event.request)
          .catch((error) => {
            console.log('Network request failed:', error);
            // Return a basic offline response for HTML requests
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return new Response(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>Offline - Courses App</title>
                    <style>
                      body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 50px;
                        background: #f5f5f5;
                      }
                      .offline-message {
                        background: white;
                        padding: 30px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        max-width: 400px;
                        margin: 0 auto;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="offline-message">
                      <h2>🔴 You're Offline</h2>
                      <p>Please check your internet connection and try again.</p>
                      <button onclick="window.location.reload()">Retry</button>
                    </div>
                  </body>
                </html>
              `, {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/html' }
              });
            }
            
            // For other requests, return a basic error response
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: data.vibrate || [100, 50, 100],
    requireInteraction: false,
    silent: false,
    tag: data.tag || 'default',
    renotify: true,
    actions: [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Handle notification click - open the app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if no existing window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background sync for offline notification handling
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle background sync for notifications
  try {
    // This would sync any pending notifications when back online
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
