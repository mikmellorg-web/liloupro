import { CANONICAL_BIBLE_BOOKS } from './utils/bibleParser';
import { getPassageFromIndexedDB, savePassageToIndexedDB } from './utils/bibleIndexedDb';

export type BibleVersionCode = 'BLIVRE' | 'TB';

export interface BibleVersionMeta {
  id: BibleVersionCode;
  label: string;
  shortName: string;
  description: string;
  copyright: string;
}

export const AVAILABLE_BIBLE_VERSIONS: BibleVersionMeta[] = [
  {
    id: 'BLIVRE',
    label: 'Bíblia Livre (BLIVRE)',
    shortName: 'BLIVRE',
    description: 'Tradução em linguagem contemporânea sob licença aberta',
    copyright: 'Bíblia Livre (BLIVRE) • Licença Creative Commons Atribuição-CompartilhaIgual 3.0 (CC BY-SA 3.0) • biblialivre.org'
  },
  {
    id: 'TB',
    label: 'Tradução Brasileira — 1917 (TB)',
    shortName: 'TB 1917',
    description: 'Tradução histórica diretamente dos originais hebraico e grego',
    copyright: 'Tradução Brasileira (Edição de 1917) • Domínio Público'
  }
];

// Cache em memória para os datasets completos carregados
const bibleMemoryCache: { [version in BibleVersionCode]?: string[][][] } = {};
const loadingPromises: { [version in BibleVersionCode]?: Promise<string[][][] | null> } = {};

/**
 * Normaliza o código da versão para garantir que apenas BLIVRE ou TB sejam processadas
 */
export function normalizeVersionCode(version?: string): BibleVersionCode {
  if (!version) return 'BLIVRE';
  const v = version.toUpperCase();
  if (v.includes('TB') || v.includes('1917') || v.includes('BRASILEIRA')) {
    return 'TB';
  }
  return 'BLIVRE';
}

/**
 * Carrega o dataset completo da versão bíblica (compatível com navegador e Node.js)
 */
export async function loadBibleDataset(version: BibleVersionCode): Promise<string[][][] | null> {
  if (bibleMemoryCache[version]) {
    return bibleMemoryCache[version]!;
  }

  if (loadingPromises[version]) {
    return loadingPromises[version]!;
  }

  const promise = (async () => {
    const fileName = version === 'TB' ? 'tb.json' : 'blivre.json';

    // 1. Tentar carregar no ambiente do navegador via fetch
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      try {
        const res = await fetch(`/data/${fileName}`);
        if (res.ok) {
          const data: string[][][] = await res.json();
          if (Array.isArray(data) && data.length === 66) {
            bibleMemoryCache[version] = data;
            return data;
          }
        }
      } catch (err) {
        console.warn(`[localBibleDb] Falha ao buscar /data/${fileName} via fetch:`, err);
      }
    }

    // 2. Tentar carregar em ambiente Node.js / servidor (SSR ou dev)
    try {
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        const fs = await import('fs');
        const path = await import('path');
        const possiblePaths = [
          path.join(process.cwd(), 'public', 'data', fileName),
          path.join(process.cwd(), 'data', fileName),
          `/app/applet/public/data/${fileName}`,
          `/app/applet/data/${fileName}`
        ];

        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            const raw = fs.readFileSync(p, 'utf-8');
            const data: string[][][] = JSON.parse(raw);
            if (Array.isArray(data) && data.length === 66) {
              bibleMemoryCache[version] = data;
              return data;
            }
          }
        }
      }
    } catch (e) {
      // Ignora erro em navegadores que não suportam import dinâmico de fs
    }

    return null;
  })();

  loadingPromises[version] = promise;
  const result = await promise;
  delete loadingPromises[version];
  return result;
}

/**
 * Localiza o índice do livro (0 a 65) baseado no nome canônico ou abreviação
 */
export function findBookIndex(bookName: string): number {
  const normBook = (bookName || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (let i = 0; i < CANONICAL_BIBLE_BOOKS.length; i++) {
    const b = CANONICAL_BIBLE_BOOKS[i];
    const bNorm = b.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const abbrevNorm = b.abbrev.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (
      bNorm === normBook ||
      abbrevNorm === normBook ||
      b.aliases.some(a => a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normBook)
    ) {
      return i;
    }
  }

  return -1;
}

export interface LocalBiblePassageResult {
  verses: { verse: number; text: string }[];
  isFallback: boolean;
  isDemo?: boolean;
  warning?: string;
}

/**
 * Função assíncrona principal:
 * 1. Consulta IndexedDB local (0ms após primeiro acesso)
 * 2. Consulta Cache em Memória
 * 3. Carrega Dataset completo se necessário
 * 4. Salva no IndexedDB com chave separada por versão (ex: Salmos-23-BLIVRE ou Salmos-23-TB)
 * 5. NUNCA aplica modificações artificiais de texto. O texto original é rigorosamente preservado.
 */
export async function getBiblePassageAsync(
  bookName: string,
  chapter: number,
  version: string = 'BLIVRE'
): Promise<LocalBiblePassageResult> {
  const versionCode = normalizeVersionCode(version);
  const bookIndex = findBookIndex(bookName);

  if (bookIndex === -1) {
    return {
      verses: [],
      isFallback: true,
      warning: `Livro "${bookName}" não localizado no cânon bíblico.`
    };
  }

  const bookMeta = CANONICAL_BIBLE_BOOKS[bookIndex];

  // 1. Verificar cache local no IndexedDB
  try {
    const cached = await getPassageFromIndexedDB(bookMeta.name, chapter, versionCode);
    if (cached && cached.verses && cached.verses.length > 0) {
      return {
        verses: cached.verses,
        isFallback: false
      };
    }
  } catch (err) {
    console.warn('[localBibleDb] Erro ao ler IndexedDB:', err);
  }

  // 2. Carregar dataset do JSON correspondente
  const bible = await loadBibleDataset(versionCode);
  if (!bible || !bible[bookIndex]) {
    return {
      verses: [],
      isFallback: true,
      warning: `Texto de ${bookMeta.name} não disponível no dataset da versão ${versionCode}.`
    };
  }

  const bookChapters = bible[bookIndex];
  const chapterZeroIndex = chapter - 1;
  const chapterVerses = bookChapters[chapterZeroIndex];

  if (!chapterVerses || !Array.isArray(chapterVerses)) {
    return {
      verses: [],
      isFallback: true,
      warning: `Capítulo ${chapter} não encontrado para ${bookMeta.name}.`
    };
  }

  // Extrair versículos exatamente como estão no texto original da tradução
  const verses = chapterVerses.map((verseText, idx) => {
    const cleanText = typeof verseText === 'string' ? verseText.trim() : String(verseText);
    return {
      verse: idx + 1,
      text: cleanText // Texto 100% puro e fiel à tradução selecionada
    };
  });

  // 3. Persistir de forma assíncrona no IndexedDB para acessos futuros offline instantâneos
  try {
    savePassageToIndexedDB({
      book: bookMeta.name,
      chapter,
      version: versionCode,
      verses,
      isFallback: false
    }).catch(() => {});
  } catch (e) {}

  return {
    verses,
    isFallback: false
  };
}

/**
 * Consulta síncrona para compatibilidade com componentes existentes.
 * Se os dados estiverem em memória, retorna os versículos imediatos.
 * Se ainda não estiver em memória, inicia o carregamento em segundo plano.
 */
export function getLocalBiblePassage(
  bookName: string,
  chapter: number,
  version: string = 'BLIVRE'
): LocalBiblePassageResult {
  const versionCode = normalizeVersionCode(version);
  const bookIndex = findBookIndex(bookName);

  if (bookIndex === -1) {
    return {
      verses: [],
      isFallback: true,
      warning: `Livro "${bookName}" não localizado no índice bíblico.`
    };
  }

  const memoryData = bibleMemoryCache[versionCode];
  if (!memoryData || !memoryData[bookIndex]) {
    // Dispara carregamento assíncrono para estar pronto na próxima leitura
    loadBibleDataset(versionCode).catch(() => {});

    return {
      verses: [],
      isFallback: true,
      warning: `Carregando versão ${versionCode}...`
    };
  }

  const bookChapters = memoryData[bookIndex];
  const chapterZeroIndex = chapter - 1;
  const chapterVerses = bookChapters[chapterZeroIndex];

  if (!chapterVerses || !Array.isArray(chapterVerses)) {
    return {
      verses: [],
      isFallback: true,
      warning: `Capítulo ${chapter} não encontrado.`
    };
  }

  const verses = chapterVerses.map((verseText, idx) => ({
    verse: idx + 1,
    text: typeof verseText === 'string' ? verseText.trim() : String(verseText)
  }));

  return {
    verses,
    isFallback: false
  };
}

export default {
  getLocalBiblePassage,
  getBiblePassageAsync,
  loadBibleDataset,
  AVAILABLE_BIBLE_VERSIONS,
  normalizeVersionCode
};
