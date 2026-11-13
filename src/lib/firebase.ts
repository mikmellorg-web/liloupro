import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore,
  memoryLocalCache,
  setLogLevel
} from 'firebase/firestore';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress Firestore verbose internal transport and idle stream disconnect logs
try {
  setLogLevel('silent');
} catch {}

const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const msg = args.map(a => (typeof a === 'string' ? a : (a?.message || ''))).join(' ');
  // Benign Firestore connection housekeeping or free-tier daily quota exhaustion (app continues via persistentLocalCache)
  if (
    msg.includes('Disconnecting idle stream') ||
    msg.includes('Timed out waiting for new targets') ||
    msg.includes('ECONNRESET') ||
    msg.includes('GrpcConnection') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('resource-exhausted') ||
    (msg.includes('@firebase/firestore') && (msg.includes('CANCELLED') || msg.includes('UNAVAILABLE') || msg.includes('Listen')))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Safe Firebase Cloud Messaging instance retrieval with browser compatibility check
let messagingInstance: Messaging | null = null;
export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') return null;
  if (!messagingInstance) {
    try {
      const supported = await isSupported();
      if (supported) {
        messagingInstance = getMessaging(app);
      }
    } catch {
      return null;
    }
  }
  return messagingInstance;
};

export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        localCache: memoryLocalCache()
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
})();

export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = async () => {
  try {
    sessionStorage.setItem('liloupro_just_logged_out', 'true');
    // Also remove the permanent hide flag on manual logout so next login asks again
    localStorage.removeItem('liloupro_hide_install_prompt');
  } catch (e) {}
  return signOut(auth);
};

export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code || '';
  if (
    message.includes('Quota limit exceeded') ||
    message.includes('resource-exhausted') ||
    code === 'resource-exhausted' ||
    code === 'unavailable'
  ) {
    console.warn(`[LiLouPro Cache] Usando dados locais em cache para "${path}" (limite diário do Firestore atingido).`);
    return;
  }
  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

