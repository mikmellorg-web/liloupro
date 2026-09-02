import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { getFirebaseMessaging, db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, getDocs, collection, query, where, arrayUnion } from 'firebase/firestore';

/**
 * Service to manage Firebase Cloud Messaging (FCM) Web Push tokens and foreground messages.
 * Designed to work gracefully when VAPID key is configured or left blank during preparation.
 */

// Chave VAPID pública gerada no Firebase Console (Certificado Web Push)
const DEFAULT_VAPID_KEY = 'BACyIDME-yrLJkLyX_8vpJV1pYDq6_DFmHBX0QxvP9l_THmBOlj4y4RZ7CafG0-oiN7kqSR6TrvPLVhEprLP-TI';

export const getVapidKey = (): string => {
  return (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined)?.trim() || DEFAULT_VAPID_KEY;
};

/**
 * Checks if Push Notifications and Service Workers are supported in the current environment.
 */
export const isPushNotificationSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
};

/**
 * Retrieves the current browser notification permission status.
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  return Notification.permission;
};

/**
 * Schedules a notification directly in the Service Worker timer.
 * This runs completely in background, allowing test notifications when screen is locked or app is closed.
 */
export const scheduleServiceWorkerNotification = async (options: {
  delayMs?: number;
  title?: string;
  body?: string;
  url?: string;
}): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  const {
    delayMs = 4000,
    title = 'LiLouPro • Notificação no Celular',
    body = '🎉 Teste de segundo plano com celular fechado funcionando com sucesso!',
    url = '/'
  } = options;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        delay: delayMs,
        title,
        body,
        url
      });
      return true;
    } else if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        delay: delayMs,
        title,
        body,
        url
      });
      return true;
    }
  } catch (err) {
    console.warn('[SW Notification] Failed to postMessage to Service Worker:', err);
  }
  return false;
};

/**
 * Requests push notification permission from the user and retrieves the FCM token if VAPID key is provided.
 */
export const requestFcmToken = async (): Promise<string | null> => {
  if (!isPushNotificationSupported()) {
    console.warn('[FCM] Push notifications are not supported in this browser environment.');
    return null;
  }

  const vapidKey = getVapidKey();

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission was not granted:', permission);
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn('[FCM] Firebase Messaging is not supported or failed to initialize.');
      return null;
    }

    // Obter service worker registration ativo
    const registration = await navigator.serviceWorker.ready;

    let token: string | null = null;
    
    // Tenta primeiro com a chave VAPID se configurada
    if (vapidKey) {
      try {
        token = await getToken(messaging, {
          serviceWorkerRegistration: registration,
          vapidKey: vapidKey
        });
      } catch (vapidErr: any) {
        console.warn('[FCM] Error with custom VAPID key, trying without VAPID key...', vapidErr?.message || vapidErr);
      }
    }

    // Fallback se não passou ou falhou com VAPID customizada
    if (!token) {
      try {
        token = await getToken(messaging, {
          serviceWorkerRegistration: registration
        });
      } catch (fallbackErr: any) {
        console.warn('[FCM] Error retrieving token with default options:', fallbackErr?.message || fallbackErr);
      }
    }

    // Fallback adicional caso getRegistration retorne uma instância diferente
    if (!token) {
      try {
        const swReg = await navigator.serviceWorker.getRegistration('/sw.js') || await navigator.serviceWorker.getRegistration();
        if (swReg) {
          token = await getToken(messaging, {
            serviceWorkerRegistration: swReg,
            ...(vapidKey ? { vapidKey } : {})
          });
        }
      } catch (regErr: any) {
        console.warn('[FCM] Error retrieving token via getRegistration:', regErr?.message || regErr);
      }
    }

    if (token) {
      console.log('[FCM] Token obtido com sucesso!');
      // Salva no Firestore se o usuário estiver autenticado
      await registerTokenInFirestore(token);
      return token;
    } else {
      console.warn('[FCM] Nenhum token de registro disponível.');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error retrieving FCM token:', error);
    return null;
  }
};

/**
 * Associates an FCM token with the logged-in member document and device registry in Firestore.
 */
export const registerTokenInFirestore = async (token: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || !token) return;

  try {
    // 1. Garante que o documento do membro com o UID do Auth receba o token
    const memberRef = doc(db, 'members', currentUser.uid);
    await setDoc(memberRef, {
      uid: currentUser.uid,
      email: currentUser.email || '',
      name: currentUser.displayName || '',
      fcmTokens: arrayUnion(token),
      fcmToken: token,
      lastFcmToken: token,
      lastFcmTokenUpdate: new Date(),
    }, { merge: true });

    // 2. Registra na coleção global de aparelhos 'fcm_tokens' para indexação rápida
    const safeTokenSuffix = token.slice(-16).replace(/[^a-zA-Z0-9]/g, '');
    const tokenDocId = `${currentUser.uid}_${safeTokenSuffix}`;
    await setDoc(doc(db, 'fcm_tokens', tokenDocId), {
      token,
      uid: currentUser.uid,
      email: currentUser.email || '',
      name: currentUser.displayName || '',
      updatedAt: new Date()
    }, { merge: true });

    // 3. Se houver outro documento de membro com mesmo e-mail (criado por líder), atualiza também
    if (currentUser.email) {
      try {
        const q = query(collection(db, 'members'), where('email', '==', currentUser.email));
        const emailSnap = await getDocs(q);
        emailSnap.forEach(async (d) => {
          if (d.id !== currentUser.uid) {
            await setDoc(doc(db, 'members', d.id), {
              fcmTokens: arrayUnion(token),
              fcmToken: token,
              lastFcmToken: token,
              lastFcmTokenUpdate: new Date()
            }, { merge: true });
          }
        });
      } catch (err) {
        // Silencioso em caso de query
      }
    }
    console.log('[FCM] Token de push registrado com sucesso no Firestore.');
  } catch (error) {
    console.warn('[FCM] Failed to update member fcmTokens in Firestore:', error);
  }
};

/**
 * Registers a listener for foreground messages when the app is open.
 */
export const setupForegroundMessageListener = async (
  onReceive: (payload: MessagePayload) => void
): Promise<(() => void) | null> => {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload);
      onReceive(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.warn('[FCM] Failed to setup onMessage listener:', error);
    return null;
  }
};

/**
 * Sends a push notification to one or multiple FCM tokens.
 * Sends request to backend endpoint /api/notifications/send-push.
 */
export const sendPushNotification = async (payload: {
  tokens: string[];
  title: string;
  body: string;
  url?: string;
  data?: Record<string, any>;
}): Promise<{ success: boolean; sentCount: number; errors?: any[] }> => {
  const { tokens, title, body, url = '/', data = {} } = payload;
  if (!tokens || tokens.length === 0) {
    return { success: true, sentCount: 0 };
  }

  // Filter valid non-empty tokens
  const validTokens = tokens.filter(t => typeof t === 'string' && t.trim().length > 10);
  if (validTokens.length === 0) {
    return { success: true, sentCount: 0 };
  }

  try {
    const response = await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokens: validTokens,
        title,
        body,
        url,
        data,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('[FCM] Push send request returned status:', response.status, errorText);
      return { success: false, sentCount: 0, errors: [errorText] };
    }

    const resJson = await response.json();
    return resJson;
  } catch (error) {
    console.warn('[FCM] Failed to send push notifications:', error);
    return { success: false, sentCount: 0, errors: [error] };
  }
};

