/* eslint-disable no-undef */
// Service worker para Firebase Cloud Messaging (FCM) em segundo plano - v9.2
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const shownHistory = new Map();

function getDeterministicTag(tag, title, body) {
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

function shouldShow(fingerprint) {
  const now = Date.now();
  for (const [k, t] of shownHistory.entries()) {
    if (now - t > 25000) shownHistory.delete(k);
  }
  if (shownHistory.has(fingerprint)) return false;
  shownHistory.set(fingerprint, now);
  return true;
}

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

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'LiLouPro • Notificação';
  const body = payload.notification?.body || payload.data?.body || 'Nova mensagem no ministério de louvor.';
  const effectiveTag = getDeterministicTag(payload.data?.tag || payload.notification?.tag, notificationTitle, body);

  if (!shouldShow(effectiveTag)) {
    console.log('[firebase-messaging-sw.js] Descartando notificação duplicada:', effectiveTag);
    return;
  }

  const notificationOptions = {
    body,
    icon: payload.notification?.icon || payload.data?.icon || '/pwa-512x512.png?v=4.0',
    badge: payload.notification?.badge || payload.data?.badge || '/pwa-192x192.png?v=4.0',
    tag: effectiveTag,
    renotify: false,
    vibrate: [200, 100, 200, 100, 200, 100, 400],
    data: {
      url: payload.data?.url || payload.fcmOptions?.link || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
