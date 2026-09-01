// Service Worker with support for background Web Push Notifications, Firebase Cloud Messaging, Badging, Luxury Icon & Automatic Seamless Update - v9.0

// Import official Firebase compat libraries for background messaging
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

  // Initialize Firebase with public client configuration (safe for client-side/service worker)
  const firebaseConfig = {
    projectId: "gen-lang-client-0330039755",
    appId: "1:255415345138:web:7da934465ab8a57b99d56b",
    apiKey: "AIzaSyD5TRm6D05LxqHuN8kthOHIfwGBxTXK5Hk",
    authDomain: "gen-lang-client-0330039755.firebaseapp.com",
    storageBucket: "gen-lang-client-0330039755.firebasestorage.app",
    messagingSenderId: "255415345138"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const messaging = firebase.messaging();

  // Official background message handler for Firebase Cloud Messaging
  messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Received FCM background message:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'LiLouPro • Notificação';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Nova atualização no ministério de louvor.',
      icon: payload.notification?.icon || payload.data?.icon || '/pwa-512x512.png?v=4.0',
      badge: '/pwa-192x192.png?v=4.0',
      data: payload.data || { url: '/' },
      vibrate: [200, 100, 200, 100, 200, 100, 400],
      tag: payload.data?.tag || 'liloupro-fcm-' + Date.now(),
      requireInteraction: true,
      renotify: true,
      actions: [
        { action: 'open', title: '💬 Abrir Mensagem' },
        { action: 'dismiss', title: 'Fechar' }
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (err) {
  console.warn('[sw.js] Firebase Cloud Messaging background init deferred:', err);
}

const CACHE_NAME = 'liloupro-v9.0-gold-official-pwa';
const BADGE_CACHE_NAME = 'app-badge-store';
const BADGE_CACHE_PATH = '/unread-badge-count';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-180x180.png',
  '/luxury_app_icon.jpg',
  '/favicon.png',
  '/favicon-32x32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('Pre-cache partial fallback:', err);
      });
    }).then(() => self.skipWaiting())
  );
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
    return;
  }
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const delay = parseInt(event.data.delay, 10) || 4000;
    const title = event.data.title || 'LiLouPro • Notificação do Sistema';
    const body = event.data.body || 'Teste de notificação com celular fechado funcionando perfeitamente! 🎉';
    const url = event.data.url || '/';

    setTimeout(() => {
      self.registration.showNotification(title, {
        body: body,
        icon: '/pwa-512x512.png?v=4.0',
        badge: '/pwa-192x192.png?v=4.0',
        vibrate: [200, 100, 200, 100, 200, 100, 400],
        tag: 'liloupro-test-' + Date.now(),
        renotify: true,
        requireInteraction: true,
        data: { url: url },
        actions: [
          { action: 'open', title: '💬 Abrir Mensagem' },
          { action: 'dismiss', title: 'Fechar' }
        ]
      });
    }, delay);
    return;
  }
});

// Listen to Push Notifications sent from a server or Firebase Cloud Messaging
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.notification?.title || payload.data?.title || payload.title || 'LiLouPro • Nova Notificação';
    const body = payload.notification?.body || payload.data?.body || payload.body || 'Você tem uma nova mensagem ou atualização no ministério.';
    const icon = payload.notification?.icon || payload.icon || '/pwa-512x512.png?v=4.0';
    const badge = payload.notification?.badge || payload.badge || '/pwa-192x192.png?v=4.0';
    const targetUrl = payload.data?.url || payload.fcmOptions?.link || payload.url || '/';

    const options = {
      body,
      icon,
      badge,
      tag: payload.tag || 'liloupro-msg-' + Date.now(),
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200, 100, 400],
      actions: [
        { action: 'open', title: '💬 Abrir Mensagem' },
        { action: 'dismiss', title: 'Fechar' }
      ],
      data: { url: targetUrl, ...(payload.data || {}) },
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
