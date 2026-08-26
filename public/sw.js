// Service Worker with support for background Web Push Notifications, Badging, Luxury Icon & Automatic Seamless Update - v7.0
const CACHE_NAME = 'liloupro-v7.0-gold-luxury';
const BADGE_CACHE_NAME = 'app-badge-store';
const BADGE_CACHE_PATH = '/unread-badge-count';

self.addEventListener('install', (event) => {
  // Force active immediately without waiting for existing clients to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== BADGE_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Immediately take control of all open pages
      return self.clients.claim();
    }).then(() => {
      // Broadcast update event to all active windows
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_VERSION_UPDATED', version: CACHE_NAME, timestamp: Date.now() });
        });
      });
    })
  );
});

// Network-First strategy for manifest and icon assets to ensure immediate home screen icon updates
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (
    url.pathname.includes('manifest.json') ||
    url.pathname.includes('luxury_app_icon.jpg') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpeg')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Pass-through for default requests
  event.respondWith(fetch(event.request));
});

// Safely update badge on the device's home screen
async function updateAppBadge(count) {
  const badgeAPI = navigator.setAppBadge ? navigator : (self.navigator && self.navigator.setAppBadge ? self.navigator : null);
  if (badgeAPI) {
    try {
      if (count > 0) {
        await badgeAPI.setAppBadge(count);
      } else {
        await badgeAPI.clearAppBadge();
      }
    } catch (err) {
      console.warn("Error calling set/clear AppBadge in Service Worker context:", err);
    }
  }
}

// Persist the count in cache storage so it is persistent across Service Worker lifecycles
async function saveBadgeCountToCache(count) {
  try {
    const cache = await caches.open(BADGE_CACHE_NAME);
    await cache.put(BADGE_CACHE_PATH, new Response(String(count)));
  } catch (err) {
    console.error("Failed to save badge count to Cache Storage:", err);
  }
}

// Retrieve the count from cache storage
async function getBadgeCountFromCache() {
  try {
    const cache = await caches.open(BADGE_CACHE_NAME);
    const response = await cache.match(BADGE_CACHE_PATH);
    if (response) {
      const text = await response.text();
      return parseInt(text, 10) || 0;
    }
  } catch (err) {
    console.error("Failed to read badge count from Cache Storage:", err);
  }
  return 0;
}

// Synchronize badge via postMessage from the active React application or command SW update
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING' || event.data.type === 'FORCE_UPDATE') {
    self.skipWaiting();
    return;
  }
  if (event.data.type === 'CHECK_UPDATE') {
    self.registration.update();
    return;
  }
  if (event.data.type === 'SET_UNREAD_COUNT') {
    const count = parseInt(event.data.count, 10) || 0;
    event.waitUntil(
      saveBadgeCountToCache(count).then(() => updateAppBadge(count))
    );
  }
});

// Listen to Push Notifications sent from a server or Firebase Cloud Messaging
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'LiLouPro • Nova Notificação';
    const options = {
      body: payload.body || 'Você tem uma nova mensagem ou atualização no ministério.',
      icon: payload.icon || '/pwa-512x512.png?v=4.0',
      badge: payload.badge || '/pwa-192x192.png?v=4.0',
      tag: payload.tag || 'liloupro-msg-' + Date.now(),
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200, 100, 400],
      actions: [
        { action: 'open', title: '💬 Abrir Mensagem' },
        { action: 'dismiss', title: 'Fechar' }
      ],
      data: payload.data || { url: '/' },
    };

    // Determine badge count to display:
    event.waitUntil(
      (async () => {
        let badgeCount = payload.badgeCount;
        if (badgeCount === undefined) {
          const cachedCount = await getBadgeCountFromCache();
          badgeCount = cachedCount + 1;
        }

        await saveBadgeCountToCache(badgeCount);
        await updateAppBadge(badgeCount);
        await self.registration.showNotification(title, options);
      })()
    );
  } catch (error) {
    const text = event.data.text();
    event.waitUntil(
      (async () => {
        const cachedCount = await getBadgeCountFromCache();
        const badgeCount = cachedCount + 1;
        await saveBadgeCountToCache(badgeCount);
        await updateAppBadge(badgeCount);
        await self.registration.showNotification('LiLouPro • Nova Notificação', {
          body: text,
          icon: '/luxury_app_icon.jpg?v=2.0',
          badge: '/luxury_app_icon.jpg?v=2.0',
          renotify: true,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200, 100, 400],
          actions: [
            { action: 'open', title: '💬 Abrir Mensagem' },
            { action: 'dismiss', title: 'Fechar' }
          ]
        });
      })()
    );
  }
});

// Handle notification click: open/focus window and set app badge
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    (async () => {
      // Recalculate remaining active notifications to set as the badge
      const activeNotifications = await self.registration.getNotifications();
      const count = activeNotifications.length;
      await saveBadgeCountToCache(count);
      await updateAppBadge(count);

      const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('postMessage' in client) {
            client.postMessage({ type: 'NOTIFICATION_OPEN_REQUEST', data: event.notification.data });
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })()
  );
});

// Handle notification close/dismiss: update app badge accordingly
self.addEventListener('notificationclose', (event) => {
  event.waitUntil(
    (async () => {
      const activeNotifications = await self.registration.getNotifications();
      const count = activeNotifications.length;
      await saveBadgeCountToCache(count);
      await updateAppBadge(count);
    })()
  );
});

// Support Periodic Background Sync if registered and available
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-badge') {
    event.waitUntil(
      (async () => {
        const activeNotifications = await self.registration.getNotifications();
        const count = activeNotifications.length;
        await saveBadgeCountToCache(count);
        await updateAppBadge(count);
      })()
    );
  }
});
