const DB_NAME = 'liloupro-photo-cache';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

export interface CachedPhoto {
  url: string;        // The key (photoUrl from firebase/unsplash)
  dataUrl: string;    // Base64 string of the cached image
  timestamp: number;  // Sourced timestamp
}

let dbInstance: IDBDatabase | null = null;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };

    request.onsuccess = (event: any) => {
      dbInstance = event.target.result;
      resolve(dbInstance!);
    };

    request.onerror = (event: any) => {
      console.error('Failed to open photo cache database:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Get cached image from IDB
export async function getCachedPhoto(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.dataUrl);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.error('Error reading from photo cache:', err);
    return null;
  }
}

// Save image to IDB
export async function setCachedPhoto(url: string, dataUrl: string): Promise<void> {
  if (!url || !dataUrl) return;
  try {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const item: CachedPhoto = {
        url,
        dataUrl,
        timestamp: Date.now()
      };
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error putting in photo cache:', err);
  }
}

// Low level helper to download remote image and convert to Base64
export async function convertRemoteImageToBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) {
    return url;
  }
  
  // Use fetch with referrerPolicy to download CORS-friendly or unsplash image
  const response = await fetch(url, { referrerPolicy: 'no-referrer' });
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Background syncing helper
export async function syncPhotoCache(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    if (url.startsWith('data:')) {
      // It's already in base64, save to cache if not exists
      const cached = await getCachedPhoto(url);
      if (!cached) {
        await setCachedPhoto(url, url);
      }
      return url;
    }

    // Attempt to download and update cache in secondary thread flow
    const dataUrl = await convertRemoteImageToBase64(url);
    await setCachedPhoto(url, dataUrl);
    return dataUrl;
  } catch (err) {
    console.warn('Silent fallback: background photo download failed or bypass CORS', url, err);
    return null;
  }
}
