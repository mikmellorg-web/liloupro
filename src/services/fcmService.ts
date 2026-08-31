import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { getFirebaseMessaging, db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

/**
 * Service to manage Firebase Cloud Messaging (FCM) Web Push tokens and foreground messages.
 * Designed to work gracefully when VAPID key is configured or left blank during preparation.
 */

// Chave VAPID pública definida via variável de ambiente (VITE_FIREBASE_VAPID_KEY)
export const getVapidKey = (): string => {
  return (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined)?.trim() || '';
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
  if (!vapidKey) {
    console.info('[FCM] VAPID Key is currently empty. FCM is prepared and will activate as soon as the key is set.');
    return null;
  }

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

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

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
