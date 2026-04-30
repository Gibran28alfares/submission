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
  console.log('Push diterima:', event);

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

      data.title = payload.title || data.title;
      data.options.body = payload.options.body || data.options.body;
    } catch (e) {
      console.error('Payload error:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, data.options)
  );
});

// ====================
// CLICK HANDLER
// ====================

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});
