// Service Worker with support for background Web Push Notifications, Firebase Cloud Messaging, Badging, Luxury Icon & Automatic Seamless Update - v9.2

// Global in-memory history of recently displayed notification fingerprints to prevent duplicates
const shownNotificationHistory = new Map();

function generateDeterministicTag(tag, title, body) {
  if (tag && typeof tag === 'string' && tag.trim().length > 0 && !tag.includes('undefined')) {
    return tag.trim();
  }
  const str = `${(title || '').trim().toLowerCase()}:${(body || '').trim().toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'liloupro-' + Math.abs(hash).toString(36);
}

function shouldDisplayNotification(title, body, tag) {
  const now = Date.now();
  // Clean entries older than 25 seconds
  for (const [key, timestamp] of shownNotificationHistory.entries()) {
    if (now - timestamp > 25000) {
      shownNotificationHistory.delete(key);
    }
  }

  const cleanTitle = (title || '').trim().toLowerCase();
  const cleanBody = (body || '').trim().toLowerCase();
  const fingerprint = tag ? `tag:${tag}` : `content:${cleanTitle}|${cleanBody}`;

  if (shownNotificationHistory.has(fingerprint)) {
    console.log('[sw.js] Ignorando notificação repetida recebida em intervalo curto:', fingerprint);
    return false;
  }

  shownNotificationHistory.set(fingerprint, now);
  return true;
}

// Unified function to safely display exactly ONE notification per event with badges & actions
async function displayUniqueNotification({
  title,
  body,
  icon,
  badge,
  tag,
  data,
  targetUrl
}) {
  const finalTitle = title || 'LiLouPro • Notificação';
  const finalBody = body || 'Nova mensagem no ministério de louvor.';
  const effectiveTag = generateDeterministicTag(tag, finalTitle, finalBody);

  if (!shouldDisplayNotification(finalTitle, finalBody, effectiveTag)) {
    return;
  }

  const finalIcon = icon || '/pwa-512x512.png?v=4.0';
  const finalBadge = badge || '/pwa-192x192.png?v=4.0';
  const finalUrl = targetUrl || '/';

  // Increment and persist badge
  try {
    const cachedCount = await getBadgeCountFromCache();
    const newCount = cachedCount + 1;
    await saveBadgeCountToCache(newCount);
    await updateAppBadge(newCount);
  } catch (badgeErr) {
    console.warn('[sw.js] Badge update warning:', badgeErr);
  }

  const options = {
    body: finalBody,
    icon: finalIcon,
    badge: finalBadge,
    tag: effectiveTag,
    renotify: false, // Critical: do NOT make a new sound or recreate card if tag matches
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200, 100, 400],
    actions: [
      { action: 'open', title: '💬 Abrir Mensagem' },
      { action: 'dismiss', title: 'Fechar' }
    ],
    data: { url: finalUrl, ...(data || {}) }
  };

  try {
    await self.registration.showNotification(finalTitle, options);
  } catch (err) {
    console.warn('[sw.js] Standard showNotification failed, trying fallback:', err);
    try {
      await self.registration.showNotification(finalTitle, {
        body: finalBody,
        icon: finalIcon,
        badge: finalBadge,
        tag: effectiveTag,
        data: { url: finalUrl }
      });
    } catch (fallbackErr) {
      console.warn('[sw.js] Minimal fallback showNotification:', fallbackErr);
      await self.registration.showNotification(finalTitle, {
        body: finalBody,
        tag: effectiveTag
      });
    }
  }
}

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
  messaging.onBackgroundMessage(async (payload) => {
    console.log('[sw.js] Received FCM background message:', payload);

    const title = payload.notification?.title || payload.data?.title || 'LiLouPro • Notificação';
    const body = payload.notification?.body || payload.data?.body || 'Nova atualização no ministério de louvor.';
    const icon = payload.notification?.icon || payload.data?.icon || '/pwa-512x512.png?v=4.0';
    const badge = payload.notification?.badge || payload.data?.badge || '/pwa-192x192.png?v=4.0';
    const targetUrl = payload.data?.url || payload.fcmOptions?.link || '/';
    const tag = payload.data?.tag || payload.notification?.tag;

    await displayUniqueNotification({
      title,
      body,
      icon,
      badge,
      tag,
      data: payload.data || {},
      targetUrl
    });
  });
} catch (err) {
  console.warn('[sw.js] Firebase Cloud Messaging background init deferred:', err);
}

const CACHE_NAME = 'liloupro-v9.2-dedup-fix';
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

  event.waitUntil(
    (async () => {
      try {
        const payload = event.data.json();
        const title = payload.notification?.title || payload.data?.title || payload.title || 'LiLouPro • Nova Notificação';
        const body = payload.notification?.body || payload.data?.body || payload.body || 'Você tem uma nova mensagem ou atualização no ministério.';
        const icon = payload.notification?.icon || payload.icon || '/pwa-512x512.png?v=4.0';
        const badge = payload.notification?.badge || payload.badge || '/pwa-192x192.png?v=4.0';
        const targetUrl = payload.data?.url || payload.fcmOptions?.link || payload.url || '/';
        const tag = payload.data?.tag || payload.notification?.tag || payload.tag;

        await displayUniqueNotification({
          title,
          body,
          icon,
          badge,
          tag,
          data: payload.data || {},
          targetUrl
        });
      } catch (err) {
        const text = event.data.text();
        await displayUniqueNotification({
          title: 'LiLouPro • Nova Notificação',
          body: text || 'Nova mensagem no ministério de louvor.',
          icon: '/pwa-512x512.png?v=4.0',
          badge: '/pwa-192x192.png?v=4.0',
          targetUrl: '/'
        });
      }
    })()
  );
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

      const targetUrl = event.notification.data?.url || '/';
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
        return clients.openWindow(targetUrl);
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
