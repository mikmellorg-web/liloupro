import { PDFDocument } from 'pdf-lib';
import { extractLyricsFromChords } from '../services/chordService';

export const MAX_PDF_FILE_SIZE_MB = 25;
export const MAX_PDF_FILE_SIZE_BYTES = MAX_PDF_FILE_SIZE_MB * 1024 * 1024;
const PDF_CHUNK_SIZE = 5;
const PDF_CHUNK_OVERLAP = 1;

export interface PdfExtractionProgress {
  fileName: string;
  chunkIndex: number;
  totalChunks: number;
  pageStart: number;
  pageEnd: number;
  totalPages: number;
  songsFoundInFile: number;
  chunkPercent: number;
}

export type DuplicateStatus = 'new' | 'duplicate' | 'version';

export interface RawExtractedPdfSong {
  titulo: string;
  artista: string;
  tom: string;
  bpm: number | null;
  cifra: string;
}

export interface ExtractedPdfSong extends RawExtractedPdfSong {
  id: string;
  sourceFileName: string;
  status: DuplicateStatus;
  selected: boolean;
  matchedSongId?: string;
  matchedSongTitle?: string;
  matchedSongKey?: string;
  matchedSongArtist?: string;
  matchReason?: string;
}

/**
 * Normaliza o título da música removendo acentos, pontuações e sufixos comuns
 * como "(Ao Vivo)", "(Acústico)", "(Live)", "(Oficial)", etc.
 */
export function normalizeTitleForDuplicateCheck(title: string): string {
  if (!title) return '';
  let text = String(title)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Remove sufixos entre parênteses ou colchetes comuns em versões
  text = text.replace(
    /[\(\[]\s*(?:ao vivo|live|ac[uú]stico|acustico|acoustic|oficial|official|studio|est[uú]dio|estudio|vers[aã]o\s+[^)\]]+|simplificada|cifra|playback|lyric\s*video|clipe|part\.?\s+[^)\]]+|feat\.?\s+[^)\]]+|ft\.?\s+[^)\]]+)\s*[\)\]]/gi,
    ' '
  );

  // Remove sufixos após hífen/barra no final
  text = text.replace(
    /\s*[-–—|\/]\s*(?:ao vivo|live|acustico|oficial|studio|estudio|versao\s+.*|simplificada|cifra)\s*$/i,
    ' '
  );

  // Remove numeração inicial (ex: "01 - ", "12. ")
  text = text.replace(/^\s*\d{1,3}\s*[-–.)\]]\s*/, '');

  // Remove pontuação e colapsa espaços
  return text
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normaliza o tom musical para comparação consistente (ex: "G", "Am", "F#", "Bb").
 */
export function normalizeKeyForComparison(key?: string | null): string {
  if (!key) return '';
  const cleaned = String(key)
    .replace(/^tom\s*[:=-]?\s*/i, '')
    .trim();
  const match = cleaned.match(/^([A-G][#b]?)(m(?:in|enor)?)?/i);
  if (!match) return '';
  const root = match[1].charAt(0).toUpperCase() + match[1].slice(1);
  const minor = match[2] && !/maj|7M/i.test(cleaned) ? 'm' : '';

  // Equivalência enarmônica básica para evitar falso positivo de "tom diferente" (ex: C# vs Db)
  const enharmonicMap: Record<string, string> = {
    Db: 'C#',
    Eb: 'D#',
    Gb: 'F#',
    Ab: 'G#',
    Bb: 'A#'
  };
  const canonicalRoot = enharmonicMap[root] || root;
  return `${canonicalRoot}${minor}`;
}

/**
 * Extrai e normaliza o início da letra (sem acordes e sem marcadores de seção)
 * para comparar músicas com títulos parecidos ou iguais.
 */
export function extractNormalizedLyricOpening(chordsOrLyrics?: string | null): string {
  if (!chordsOrLyrics) return '';
  const pureLyrics = extractLyricsFromChords(String(chordsOrLyrics));
  const lines = pureLyrics
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      // Ignora marcadores de seção como [Intro], [Verso 1], [Refrão]
      if (/^\[[^\]]+\]$/.test(line)) return false;
      if (/^(?:intro|introducao|introdução|verso|estrofe|refrao|refrão|coro|ponte|pre-refrao|pré-refrão|solo|final|outro)\b[\s\d:.-]*$/i.test(line)) {
        return false;
      }
      return true;
    });

  const joined = lines
    .slice(0, 5)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return joined.slice(0, 160);
}

/**
 * Calcula similaridade de palavras (Jaccard) entre dois trechos de letra normalizados.
 */
function calculateTokenSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const minLen = Math.min(a.length, b.length);
  if (minLen >= 35 && (a.startsWith(b.slice(0, minLen)) || b.startsWith(a.slice(0, minLen)))) {
    return 0.95;
  }

  const tokensA = new Set(a.split(' ').filter((w) => w.length >= 3));
  const tokensB = new Set(b.split(' ').filter((w) => w.length >= 3));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersection += 1;
  });

  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Lê um arquivo PDF no navegador e converte para Base64 puro (sem prefixo data:).
 */
export function readPdfFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      const base64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
      if (!base64) {
        reject(new Error(`Não foi possível ler o arquivo "${file.name}".`));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => {
      reject(new Error(`Erro ao ler o arquivo "${file.name}".`));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Valida se o tamanho do arquivo PDF respeita o limite de segurança de 25 MB.
 */
export function validatePdfFileSize(file: File): string | null {
  if (file.size > MAX_PDF_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1).replace('.', ',');
    return `O arquivo "${file.name}" tem ${sizeMb} MB e ultrapassa o limite de ${MAX_PDF_FILE_SIZE_MB} MB. Se for um PDF escaneado muito pesado, comprima o arquivo antes de importar.`;
  }
  return null;
}

/**
 * Envia um payload Base64 de PDF (arquivo inteiro ou bloco fatiado) para o endpoint server-side do Gemini.
 */
async function postPdfChunkToApi(
  base64Data: string,
  displayName: string
): Promise<RawExtractedPdfSong[]> {
  const response = await fetch('/api/songs/extract-pdf-chords', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: displayName,
      mimeType: 'application/pdf',
      base64Data
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload?.error || `Falha ao processar "${displayName}". Tente novamente.`
    );
  }

  return Array.isArray(payload?.songs) ? payload.songs : [];
}

/**
 * Une duas cifras da mesma música que atravessaram uma emenda de bloco,
 * evitando duplicar linhas já presentes na página de overlap.
 */
function mergeOverlappingCifra(prevCifra: string, nextCifra: string): string {
  const cleanPrev = (prevCifra || '').trimEnd();
  const cleanNext = (nextCifra || '').trim();
  if (!cleanPrev) return cleanNext;
  if (!cleanNext) return cleanPrev;

  const normPrev = cleanPrev.replace(/\s+/g, ' ').trim().toLowerCase();
  const normNext = cleanNext.replace(/\s+/g, ' ').trim().toLowerCase();

  // Se uma cifra já contém a outra (caso comum no overlap de 1 página), mantém a mais completa
  if (normNext.includes(normPrev)) return cleanNext;
  if (normPrev.includes(normNext)) return cleanPrev;

  const prevLines = cleanPrev.split('\n');
  const nextLines = cleanNext.split('\n');

  const normLine = (l: string) =>
    l
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  // Procura maior sobreposição exata entre o final de prevLines e o início de nextLines
  const maxOverlap = Math.min(prevLines.length, nextLines.length, 30);
  let bestOverlap = 0;

  for (let overlap = maxOverlap; overlap >= 2; overlap -= 1) {
    let allMatch = true;
    for (let i = 0; i < overlap; i += 1) {
      const a = normLine(prevLines[prevLines.length - overlap + i]);
      const b = normLine(nextLines[i]);
      if (a !== b) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) {
      bestOverlap = overlap;
      break;
    }
  }

  if (bestOverlap > 0) {
    const remaining = nextLines.slice(bestOverlap);
    return remaining.length > 0 ? `${cleanPrev}\n${remaining.join('\n')}` : cleanPrev;
  }

  // Sem sobreposição exata nas bordas: verifica se o início da letra já existe na versão anterior
  const prevOpening = extractNormalizedLyricOpening(cleanPrev);
  const nextOpening = extractNormalizedLyricOpening(cleanNext);
  if (
    prevOpening.length >= 30 &&
    nextOpening.length >= 30 &&
    calculateTokenSimilarity(prevOpening, nextOpening) >= 0.7
  ) {
    // Mesma música extraída duas vezes por causa da página de overlap: fica com a versão mais completa
    return cleanNext.length >= cleanPrev.length ? cleanNext : cleanPrev;
  }

  // Caso seja continuação genuína (ex: música longa de 2-3 páginas sem repetição do início)
  return `${cleanPrev}\n\n${cleanNext}`;
}

/**
 * Mescla músicas extraídas de um bloco sequencial no acumulado do mesmo arquivo PDF,
 * deduplicando títulos repetidos pelo overlap de 1 página e unindo músicas fragmentadas na emenda.
 */
function mergeChunkSongsIntoAccumulated(
  accumulated: RawExtractedPdfSong[],
  incomingSongs: RawExtractedPdfSong[],
  isSubsequentChunk: boolean
): RawExtractedPdfSong[] {
  const result = [...accumulated];

  for (let idx = 0; idx < incomingSongs.length; idx += 1) {
    const incoming = incomingSongs[idx];
    const incomingNormTitle = normalizeTitleForDuplicateCheck(incoming.titulo);

    // 1. Verifica se o primeiro item de um bloco subsequente é continuação sem título da última música anterior
    const looksLikeContinuationTitle =
      isSubsequentChunk &&
      idx === 0 &&
      result.length > 0 &&
      /^(?:continua[cç][aã]o|m[uú]sica importada|sem t[ií]tulo|parte\s*2)$/i.test(
        (incoming.titulo || '').trim()
      );

    if (looksLikeContinuationTitle) {
      const lastIdx = result.length - 1;
      result[lastIdx] = {
        ...result[lastIdx],
        cifra: mergeOverlappingCifra(result[lastIdx].cifra, incoming.cifra)
      };
      continue;
    }

    // 2. Verifica se já existe música com o mesmo título normalizado nos blocos anteriores do mesmo PDF
    let existingIdx = -1;
    if (incomingNormTitle) {
      // Busca de trás para frente para priorizar a emenda mais recente do caderno
      for (let j = result.length - 1; j >= 0; j -= 1) {
        if (normalizeTitleForDuplicateCheck(result[j].titulo) === incomingNormTitle) {
          existingIdx = j;
          break;
        }
      }
    }

    if (existingIdx >= 0) {
      const existing = result[existingIdx];
      const mergedCifra = mergeOverlappingCifra(existing.cifra, incoming.cifra);
      result[existingIdx] = {
        titulo: existing.titulo.length >= incoming.titulo.length ? existing.titulo : incoming.titulo,
        artista: existing.artista || incoming.artista,
        tom: existing.tom && existing.tom !== 'C' ? existing.tom : incoming.tom || existing.tom,
        bpm: existing.bpm ?? incoming.bpm,
        cifra: mergedCifra
      };
      continue;
    }

    result.push(incoming);
  }

  return result;
}

/**
 * Calcula os intervalos de páginas (0-indexed inclusivos) em blocos de até 5 páginas
 * com overlap de 1 página entre blocos adjacentes para PDFs maiores que 5 páginas.
 */
function buildPdfPageChunks(totalPages: number): Array<{ startIdx: number; endIdx: number }> {
  if (totalPages <= PDF_CHUNK_SIZE) {
    return [{ startIdx: 0, endIdx: Math.max(0, totalPages - 1) }];
  }

  const chunks: Array<{ startIdx: number; endIdx: number }> = [];
  const step = Math.max(1, PDF_CHUNK_SIZE - PDF_CHUNK_OVERLAP);
  let startIdx = 0;

  while (startIdx < totalPages) {
    const endIdx = Math.min(totalPages - 1, startIdx + PDF_CHUNK_SIZE - 1);
    chunks.push({ startIdx, endIdx });
    if (endIdx >= totalPages - 1) break;
    startIdx += step;
  }

  return chunks;
}

export interface ExtractPdfFileOptions {
  onProgress?: (progress: PdfExtractionProgress) => void;
  onChunkWarning?: (warning: string) => void;
}

/**
 * Envia um arquivo PDF para o endpoint server-side do Gemini com fatiamento automático
 * em blocos de 5 páginas (via pdf-lib) para apostilas grandes, merge na emenda das páginas
 * e emissão de progresso real bloco a bloco.
 */
export async function extractSongsFromPdfFile(
  file: File,
  options?: ExtractPdfFileOptions
): Promise<RawExtractedPdfSong[]> {
  const sizeError = validatePdfFileSize(file);
  if (sizeError) {
    throw new Error(sizeError);
  }

  let sourcePdf: PDFDocument | null = null;
  let totalPages = 0;

  try {
    const arrayBuffer = await file.arrayBuffer();
    sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    totalPages = sourcePdf.getPageCount();
  } catch {
    // Fallback seguro caso o PDF tenha estrutura incomum que o pdf-lib não abra
    sourcePdf = null;
    totalPages = 0;
  }

  // PDFs com até 5 páginas (ou fallback quando não foi possível inspecionar páginas): envio único
  if (!sourcePdf || totalPages <= PDF_CHUNK_SIZE) {
    const pageCountDisplay = totalPages > 0 ? totalPages : 1;
    options?.onProgress?.({
      fileName: file.name,
      chunkIndex: 1,
      totalChunks: 1,
      pageStart: 1,
      pageEnd: pageCountDisplay,
      totalPages: pageCountDisplay,
      songsFoundInFile: 0,
      chunkPercent: 15
    });

    const base64Data = await readPdfFileAsBase64(file);
    const songs = await postPdfChunkToApi(base64Data, file.name);

    options?.onProgress?.({
      fileName: file.name,
      chunkIndex: 1,
      totalChunks: 1,
      pageStart: 1,
      pageEnd: pageCountDisplay,
      totalPages: pageCountDisplay,
      songsFoundInFile: songs.length,
      chunkPercent: 100
    });

    return songs;
  }

  // Apostilas grandes (> 5 páginas): fatia automaticamente no navegador em blocos de 5 páginas com overlap de 1 página
  const chunks = buildPdfPageChunks(totalPages);
  let accumulatedSongs: RawExtractedPdfSong[] = [];
  let failedChunks = 0;
  let lastChunkError: Error | null = null;

  for (let i = 0; i < chunks.length; i += 1) {
    const { startIdx, endIdx } = chunks[i];
    const pageStart = startIdx + 1;
    const pageEnd = endIdx + 1;
    const chunkIndex = i + 1;

    options?.onProgress?.({
      fileName: file.name,
      chunkIndex,
      totalChunks: chunks.length,
      pageStart,
      pageEnd,
      totalPages,
      songsFoundInFile: accumulatedSongs.length,
      chunkPercent: Math.round((i / chunks.length) * 100)
    });

    const chunkPdf = await PDFDocument.create();
    const pageIndices: number[] = [];
    for (let p = startIdx; p <= endIdx; p += 1) {
      pageIndices.push(p);
    }
    const copiedPages = await chunkPdf.copyPages(sourcePdf, pageIndices);
    for (const page of copiedPages) {
      chunkPdf.addPage(page);
    }

    const chunkBase64 = await chunkPdf.saveAsBase64({ dataUri: false });
    const chunkLabel = `${file.name} (páginas ${pageStart}-${pageEnd})`;

    let chunkSongs: RawExtractedPdfSong[] | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        chunkSongs = await postPdfChunkToApi(chunkBase64, chunkLabel);
        break;
      } catch (err: any) {
        lastChunkError = err instanceof Error ? err : new Error(String(err));
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }
    }

    if (chunkSongs) {
      accumulatedSongs = mergeChunkSongsIntoAccumulated(
        accumulatedSongs,
        chunkSongs,
        i > 0
      );
    } else {
      failedChunks += 1;
      options?.onChunkWarning?.(
        `Bloco ${chunkIndex} (páginas ${pageStart}–${pageEnd}) de "${file.name}": ${
          lastChunkError?.message || 'não foi possível extrair este trecho.'
        }`
      );
    }

    options?.onProgress?.({
      fileName: file.name,
      chunkIndex,
      totalChunks: chunks.length,
      pageStart,
      pageEnd,
      totalPages,
      songsFoundInFile: accumulatedSongs.length,
      chunkPercent: Math.round(((i + 1) / chunks.length) * 100)
    });
  }

  if (accumulatedSongs.length === 0 && failedChunks === chunks.length && lastChunkError) {
    throw lastChunkError;
  }

  return accumulatedSongs;
}

/**
 * Compara músicas extraídas dos PDFs com o repertório já cadastrado da igreja ativa (churchId),
 * classificando cada música em:
 * - 'new' (NOVA - marcada por padrão)
 * - 'duplicate' (JÁ CADASTRADA - desmarcada por padrão)
 * - 'version' (POSSÍVEL VERSÃO DIFERENTE - permite marcar/desmarcar)
 */
export function classifyExtractedPdfSongs(
  extractedItems: Array<RawExtractedPdfSong & { sourceFileName: string }>,
  existingChurchSongs: any[]
): ExtractedPdfSong[] {
  const indexedExisting = (existingChurchSongs || []).map((song) => {
    const rawKey = song?.baseKey || song?.key || song?.tone || '';
    const lyricsSource =
      (typeof song?.lyrics === 'string' && song.lyrics.trim()) ||
      (typeof song?.chords === 'string' && song.chords.trim()) ||
      '';
    return {
      song,
      normTitle: normalizeTitleForDuplicateCheck(song?.title || ''),
      normKey: normalizeKeyForComparison(rawKey),
      displayKey: rawKey || 'C',
      lyricOpening: extractNormalizedLyricOpening(lyricsSource)
    };
  });

  return extractedItems.map((item, index) => {
    const normTitle = normalizeTitleForDuplicateCheck(item.titulo);
    const normKey = normalizeKeyForComparison(item.tom);
    const lyricOpening = extractNormalizedLyricOpening(item.cifra);

    let matchedEntry: (typeof indexedExisting)[number] | null = null;
    let titleMatched = false;
    let lyricSimilarity = 0;

    // 1. Busca por título normalizado exato
    if (normTitle) {
      const exactTitleMatch = indexedExisting.find(
        (entry) => entry.normTitle && entry.normTitle === normTitle
      );
      if (exactTitleMatch) {
        matchedEntry = exactTitleMatch;
        titleMatched = true;
        lyricSimilarity = calculateTokenSimilarity(lyricOpening, exactTitleMatch.lyricOpening);
      }
    }

    // 2. Se não bateu título exato, verifica início da letra (evita duplicatas com título ligeiramente diferente)
    if (!matchedEntry && lyricOpening.length >= 35) {
      let bestSim = 0;
      let bestEntry: (typeof indexedExisting)[number] | null = null;
      for (const entry of indexedExisting) {
        if (entry.lyricOpening.length < 30) continue;
        const sim = calculateTokenSimilarity(lyricOpening, entry.lyricOpening);
        if (sim > bestSim) {
          bestSim = sim;
          bestEntry = entry;
        }
      }
      if (bestEntry && bestSim >= 0.72) {
        matchedEntry = bestEntry;
        lyricSimilarity = bestSim;
      }
    }

    let status: DuplicateStatus = 'new';
    let selected = true;
    let matchReason: string | undefined;

    if (matchedEntry) {
      const hasBothKeys = Boolean(normKey && matchedEntry.normKey);
      const differentKey = hasBothKeys && normKey !== matchedEntry.normKey;
      const hasBothLyrics = lyricOpening.length >= 30 && matchedEntry.lyricOpening.length >= 30;
      const differentStructure = hasBothLyrics && lyricSimilarity < 0.5;

      if (titleMatched && (differentKey || differentStructure)) {
        status = 'version';
        selected = false;
        if (differentKey && differentStructure) {
          matchReason = `Mesmo título, mas tom (${item.tom} vs ${matchedEntry.displayKey}) e estrutura diferentes`;
        } else if (differentKey) {
          matchReason = `No app está em ${matchedEntry.displayKey}, neste PDF está em ${item.tom}`;
        } else {
          matchReason = 'Mesmo título, mas letra/estrutura diferente da versão cadastrada';
        }
      } else {
        status = 'duplicate';
        selected = false;
        matchReason = titleMatched
          ? 'Já existe no app'
          : `Letra idêntica à música "${matchedEntry.song?.title || 'cadastrada'}"`;
      }
    }

    return {
      id: `pdf_song_${Date.now()}_${index}`,
      sourceFileName: item.sourceFileName,
      titulo: item.titulo,
      artista: item.artista || '',
      tom: item.tom || 'C',
      bpm: item.bpm,
      cifra: item.cifra,
      status,
      selected,
      matchedSongId: matchedEntry?.song?.id,
      matchedSongTitle: matchedEntry?.song?.title,
      matchedSongKey: matchedEntry?.displayKey,
      matchedSongArtist: matchedEntry?.song?.artist,
      matchReason
    };
  });
}
