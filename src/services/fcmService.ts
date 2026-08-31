import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { getFirebaseMessaging, db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

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

    const tokenOptions: { serviceWorkerRegistration: ServiceWorkerRegistration; vapidKey?: string } = {
      serviceWorkerRegistration: registration,
    };
    if (vapidKey) {
      tokenOptions.vapidKey = vapidKey;
    }

    const token = await getToken(messaging, tokenOptions);

    if (token) {
      console.log('[FCM] Token obtained successfully');
      // Salva no Firestore se o usuário estiver autenticado
      await registerTokenInFirestore(token);
      return token;
    } else {
      console.warn('[FCM] No registration token available.');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error retrieving FCM token:', error);
    return null;
  }
};

/**
 * Associates an FCM token with the logged-in member document in Firestore.
 */
export const registerTokenInFirestore = async (token: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || !token) return;

  const memberPath = `members/${currentUser.uid}`;
  try {
    const memberRef = doc(db, 'members', currentUser.uid);
    await updateDoc(memberRef, {
      fcmTokens: arrayUnion(token),
      lastFcmTokenUpdate: new Date(),
    });
  } catch (error) {
    // Não interrompe o app se o documento ainda não existir ou permissão falhar
    console.warn('[FCM] Failed to update member fcmTokens:', error);
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

