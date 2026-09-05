/**
 * Liloupro Bible Local Cache (IndexedDB)
 * 
 * Fornece armazenamento persistente de alta capacidade no navegador para:
 * 1. Capítulos e versículos lidos em qualquer versão bíblica (BLIVRE, ARA, NVI, ARC, NAA).
 * 2. Cópia completa offline da Bíblia Livre (66 livros / 1189 capítulos).
 * 3. Recuperação instantânea com latência próxima de 0ms, imune a quedas de rede ou modo avião.
 */

export interface CachedBiblePassage {
  id: string; // Ex: "Gênesis-1-BLIVRE"
  book: string;
  chapter: number;
  version: string;
  verses: { verse: number; text: string }[];
  isFallback: boolean;
  warning: string | null;
  timestamp: number;
}

const DB_NAME = 'liloupro-bible-cache-v1';
const DB_VERSION = 1;
const STORE_PASSAGES = 'passages';
const STORE_META = 'meta';

let dbInstancePromise: Promise<IDBDatabase | null> | null = null;

/**
 * Abre ou recupera a conexão única com o IndexedDB do Liloupro
 */
export function openBibleIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (dbInstancePromise) {
    return dbInstancePromise;
  }

  dbInstancePromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_PASSAGES)) {
          const passageStore = db.createObjectStore(STORE_PASSAGES, { keyPath: 'id' });
          passageStore.createIndex('book', 'book', { unique: false });
          passageStore.createIndex('version', 'version', { unique: false });
          passageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Trata fechamento inesperado
        db.onversionchange = () => {
          db.close();
          dbInstancePromise = null;
        };
        resolve(db);
      };

      request.onerror = (err) => {
        console.warn('[IndexedDB Bible] Erro ao abrir banco local:', err);
        resolve(null);
      };

      request.onblocked = () => {
        console.warn('[IndexedDB Bible] Abertura do banco bloqueada por outra aba.');
        resolve(null);
      };
    } catch (e) {
      console.warn('[IndexedDB Bible] Falha ao inicializar IndexedDB:', e);
      resolve(null);
    }
  });

  return dbInstancePromise;
}

/**
 * Monta o identificador padrão de chave do capítulo
 */
export function buildPassageKey(book: string, chapter: number, version: string): string {
  return `${book.trim()}-${chapter}-${version.trim().toUpperCase()}`;
}

/**
 * Busca um capítulo bíblico salvo no IndexedDB local
 */
export async function getPassageFromIndexedDB(
  book: string,
  chapter: number,
  version: string
): Promise<CachedBiblePassage | null> {
  const db = await openBibleIndexedDB();
  if (!db) return null;

  const key = buildPassageKey(book, chapter, version);

  return new Promise<CachedBiblePassage | null>((resolve) => {
    try {
      const transaction = db.transaction([STORE_PASSAGES], 'readonly');
      const store = transaction.objectStore(STORE_PASSAGES);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as CachedBiblePassage | undefined;
        if (result && Array.isArray(result.verses) && result.verses.length > 0) {
          resolve(result);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Salva um capítulo no IndexedDB para acesso instantâneo futuro
 */
export async function savePassageToIndexedDB(data: {
  book: string;
  chapter: number;
  version: string;
  verses: { verse: number; text: string }[];
  isFallback?: boolean;
  warning?: string | null;
}): Promise<void> {
  const db = await openBibleIndexedDB();
  if (!db) return;

  if (!data.verses || data.verses.length === 0) return;

  const key = buildPassageKey(data.book, data.chapter, data.version);
  const entry: CachedBiblePassage = {
    id: key,
    book: data.book,
    chapter: data.chapter,
    version: data.version.toUpperCase(),
    verses: data.verses,
    isFallback: !!data.isFallback,
    warning: data.warning || null,
    timestamp: Date.now()
  };

  return new Promise<void>((resolve) => {
    try {
      const transaction = db.transaction([STORE_PASSAGES], 'readwrite');
      const store = transaction.objectStore(STORE_PASSAGES);
      store.put(entry);

      transaction.oncomplete = () => resolve();
      transaction.onerror = (err) => {
        console.warn('[IndexedDB Bible] Erro ao salvar passagem:', err);
        resolve();
      };
    } catch (e) {
      resolve();
    }
  });
}

/**
 * Salva o banco de dados completo da Bíblia Livre (66 livros) no IndexedDB
 */
export async function saveBlivreFullToIndexedDB(fullData: string[][][]): Promise<void> {
  const db = await openBibleIndexedDB();
  if (!db) return;

  if (!Array.isArray(fullData) || fullData.length !== 66) return;

  return new Promise<void>((resolve) => {
    try {
      const transaction = db.transaction([STORE_META], 'readwrite');
      const store = transaction.objectStore(STORE_META);
      store.put({
        key: 'blivre_full',
        data: fullData,
        savedAt: Date.now()
      });

      transaction.oncomplete = () => {
        console.log('[IndexedDB Bible] Cópia integral da Bíblia Livre persistida localmente com sucesso!');
        resolve();
      };
      transaction.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
}

/**
 * Recupera o banco de dados completo da Bíblia Livre do IndexedDB local
 */
export async function getBlivreFullFromIndexedDB(): Promise<string[][][] | null> {
  const db = await openBibleIndexedDB();
  if (!db) return null;

  return new Promise<string[][][] | null>((resolve) => {
    try {
      const transaction = db.transaction([STORE_META], 'readonly');
      const store = transaction.objectStore(STORE_META);
      const request = store.get('blivre_full');

      request.onsuccess = () => {
        const result = request.result;
        if (result && Array.isArray(result.data) && result.data.length === 66) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Carrega passagens recentes do IndexedDB para aquecer o cache em memória
 */
export async function loadRecentPassagesFromIndexedDB(maxCount = 200): Promise<CachedBiblePassage[]> {
  const db = await openBibleIndexedDB();
  if (!db) return [];

  return new Promise<CachedBiblePassage[]>((resolve) => {
    try {
      const transaction = db.transaction([STORE_PASSAGES], 'readonly');
      const store = transaction.objectStore(STORE_PASSAGES);
      const request = store.openCursor(null, 'prev');
      const list: CachedBiblePassage[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && list.length < maxCount) {
          list.push(cursor.value);
          cursor.continue();
        } else {
          resolve(list);
        }
      };

      request.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
}
