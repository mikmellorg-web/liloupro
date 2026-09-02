/* eslint-disable no-undef */
// Service worker para Firebase Cloud Messaging (FCM) em segundo plano
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: "gen-lang-client-0330039755",
  appId: "1:255415345138:web:7da934465ab8a57b99d56b",
  apiKey: "AIzaSyD5TRm6D05LxqHuN8kthOHIfwGBxTXK5Hk",
  authDomain: "gen-lang-client-0330039755.firebaseapp.com",
  storageBucket: "gen-lang-client-0330039755.firebasestorage.app",
  messagingSenderId: "255415345138"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'LiLouPro • Notificação';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Nova mensagem no ministério de louvor.',
    icon: payload.notification?.icon || '/pwa-512x512.png?v=4.0',
    badge: payload.notification?.badge || '/pwa-192x192.png?v=4.0',
    vibrate: [200, 100, 200, 100, 200, 100, 400],
    data: {
      url: payload.data?.url || '/'
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
