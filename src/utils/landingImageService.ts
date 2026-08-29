// Serviço de armazenamento e persistência em alta fidelidade para as imagens da Landing Page do LiLouPro
// Garante resolução 100% nativa sem compressão com perdas (sem artefatos de JPEG) e persistência pública

const DB_NAME = 'liloupro_landing_assets_db';
const DB_VERSION = 1;
const STORE_NAME = 'landing_images';

export interface LandingImagesData {
  heroImage?: string | null;
  moduleImages?: Record<string, string>;
  simulatorMedia?: Record<string | number, {
    type: 'image' | 'video';
    url: string;
    isEmbed?: boolean;
  }>;
}

// Inicializa ou obtém conexão com IndexedDB para armazenar prints em alta resolução (sem limite de 5MB)
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Salva valor no IndexedDB
export async function setLocalAsset(key: string, value: any): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Fallback silencioso para localStorage se IndexedDB falhar
    try {
      if (typeof value === 'string') {
        localStorage.setItem(`liloupro_asset_${key}`, value);
      } else {
        localStorage.setItem(`liloupro_asset_${key}`, JSON.stringify(value));
      }
    } catch (e) {
      console.warn('[Landing Assets] Armazenamento local em memória:', e);
    }
  }
}

// Recupera valor do IndexedDB
export async function getLocalAsset<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      const raw = localStorage.getItem(`liloupro_asset_${key}`);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch {
      return null;
    }
  }
}

// Sincroniza com o servidor público oficial (/api/landing/images)
export async function fetchOfficialLandingImages(): Promise<LandingImagesData | null> {
  try {
    const res = await fetch('/api/landing/images', {
      headers: { 'Accept': 'application/json' },
      cache: 'no-cache'
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('[Landing Assets] Servidor offline ou indisponível temporariamente:', err);
  }
  return null;
}

// Salva imagens no servidor oficial para que fiquem públicas para todos os visitantes do site
export async function saveOfficialLandingImages(data: Partial<LandingImagesData>): Promise<boolean> {
  try {
    const res = await fetch('/api/landing/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (err) {
    console.warn('[Landing Assets] Erro ao sincronizar com servidor público:', err);
    return false;
  }
}
