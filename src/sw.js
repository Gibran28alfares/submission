/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

// precache (WAJIB untuk PWA)
precacheAndRoute(self.__WB_MANIFEST);

// ====================
// RUNTIME CACHING
// ====================

// API
registerRoute(
  ({ url }) => url.origin === 'https://story-api.dicoding.dev',
  new NetworkFirst({
    cacheName: 'api-cache',
  })
);

// Map tiles
registerRoute(
  ({ url }) => url.origin.includes('tile.openstreetmap.org'),
  new StaleWhileRevalidate({
    cacheName: 'map-tiles',
  })
);

// Images
registerRoute(
  ({ url }) =>
    url.href.startsWith('https://story-api.dicoding.dev/v1/stories'),
  new StaleWhileRevalidate({
    cacheName: 'story-images',
  })
);

// ====================
//  PUSH NOTIFICATION 
// ====================

self.addEventListener('push', (event) => {
  console.log('[v0] Push event received from server:', event);

  let data = {
    title: 'Notifikasi Baru',
    options: {
      body: 'Ada update terbaru!',
      icon: '/images/icon-192.png',
      badge: '/images/icon-192.png',
    },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[v0] Push payload:', payload);

      data.title = payload.title || data.title;
      data.options.body = payload.body || data.options.body;
      data.options.icon = payload.icon || data.options.icon;
      data.options.badge = payload.badge || data.options.badge;
    } catch (e) {
      console.error('[v0] Payload parsing error:', e);
      // Fallback untuk text payload
      data.options.body = event.data.text();
    }
  }

  console.log('[v0] Showing notification with data:', data);
  event.waitUntil(
    self.registration.showNotification(data.title, data.options)
  );
});

// ====================
// NOTIFICATION CLICK HANDLER
// ====================

self.addEventListener('notificationclick', (event) => {
  console.log('[v0] Notification clicked:', event.notification.title);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Cek apakah sudah ada window terbuka
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          console.log('[v0] Focusing existing window');
          return client.focus();
        }
      }
      // Jika tidak ada, buka window baru
      console.log('[v0] Opening new window');
      return clients.openWindow('/');
    })
  );
});

// ====================
// NOTIFICATION CLOSE HANDLER
// ====================

self.addEventListener('notificationclose', (event) => {
  console.log('[v0] Notification closed:', event.notification.title);
});
