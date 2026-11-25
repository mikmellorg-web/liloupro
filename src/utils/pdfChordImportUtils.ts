import { PDFDocument } from 'pdf-lib';
import { extractLyricsFromChords } from '../services/chordService';

export const MAX_PDF_FILE_SIZE_MB = 25;
export const MAX_PDF_FILE_SIZE_BYTES = MAX_PDF_FILE_SIZE_MB * 1024 * 1024;
const PDF_CHUNK_SIZE = 5;
const PDF_CHUNK_OVERLAP = 1;
const PDF_INTER_CHUNK_DELAY_MS = 1000;
const PDF_RETRY_BACKOFF_MS = [3000, 6000]; // 2ª tentativa após 3s, 3ª tentativa após 6s

export interface PdfExtractionProgress {
  fileName: string;
  chunkIndex: number;
  totalChunks: number;
  pageStart: number;
  pageEnd: number;
  totalPages: number;
  songsFoundInFile: number;
  chunkPercent: number;
  retryAttempt?: number;
  maxAttempts?: number;
  statusMessage?: string;
}

export interface FailedPdfChunkInfo {
  id: string;
  fileName: string;
  chunkIndex: number;
  totalChunks: number;
  pageStart: number;
  pageEnd: number;
  totalPages: number;
  base64Data: string;
  friendlyMessage: string;
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

interface PdfChunkApiError extends Error {
  status?: number;
  isTransient?: boolean;
}

function isTransientPdfApiError(status?: number, rawMessage?: string): boolean {
  if (status === 429 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  const msg = String(rawMessage || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('502') ||
    msg.includes('504') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate') ||
    msg.includes('alta demanda') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('timeout')
  );
}

/**
 * Sanitiza mensagens de erro para nunca exibir JSON bruto em inglês na interface.
 */
export function formatFriendlyPdfChunkError(
  pageStart: number,
  pageEnd: number,
  fileName?: string,
  totalFiles: number = 1
): string {
  const pageLabel =
    pageStart === pageEnd
      ? `a página ${pageStart}`
      : `as páginas ${pageStart}–${pageEnd}`;
  const filePrefix =
    totalFiles > 1 && fileName ? `[${fileName}] ` : '';
  return `${filePrefix}Não foi possível ler ${pageLabel} (alta demanda temporária do servidor).`;
}

export function sanitizeRawApiErrorMessage(rawError: any, fallback: string): string {
  const msg = String(rawError?.message || rawError || '').trim();
  if (!msg) return fallback;
  const lower = msg.toLowerCase();
  if (
    msg.includes('{') ||
    msg.includes('"error"') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('resource_exhausted') ||
    lower.includes('503') ||
    lower.includes('429')
  ) {
    return fallback;
  }
  return msg;
}

export const PDF_CHORD_EXTRACTION_SYSTEM_INSTRUCTION = `Você é um especialista sênior em transcrição e extração 100% fiel de cifras musicais (louvor e adoração) a partir de arquivos PDF — tanto PDFs digitais quanto PDFs escaneados/fotografados (OCR visual).

REGRAS CRÍTICAS E INVIOLÁVEIS DE EXTRAÇÃO:
1. SUPORTE A 1 MÚSICA OU CADERNO MULTI-MÚSICAS:
   - Analise todas as páginas do PDF do início ao fim.
   - Se o PDF contiver 1 música, retorne um array "songs" com 1 objeto.
   - Se o PDF for um caderno/coletânea com várias músicas, separe CADA música corretamente em seu próprio objeto dentro de "songs", na ordem em que aparecem no documento.
   - Não misture letras ou acordes de músicas diferentes.

2. METADADOS LIMPOS (NÃO REPETIR TÍTULO NEM "Tom: X" NO CORPO DA CIFRA):
   - "titulo": Título limpo da música, SEM numeração de índice (ex: remova "01 - ", "1. ") e SEM números de página.
   - "artista": Cantor, banda ou ministério se aparecer no cabeçalho/subtítulo; caso não conste, retorne string vazia "".
   - "tom": Tom musical principal (ex: "C", "G", "D", "Am", "F#m", "Bb") retirado do cabeçalho (ex: "Tom: G") ou inferido harmonicamente dos acordes principais da canção.
   - "bpm": Número inteiro do andamento (BPM) se indicado no PDF (entre 40 e 220), ou 0 se não informado.
   - IMPORTANTE: NÃO inclua a repetição do título da música nem a linha "Tom: X" no topo do campo "cifra", pois essas informações já vão nos campos "titulo" e "tom".

3. PROIBIDO INVENTAR OU INJETAR ETIQUETAS DE SEÇÃO INEXISTENTES:
   - Mantenha EXCLUSIVAMENTE os marcadores de seção que JÁ ESTIVEREM ESCRITOS no PDF original (ex.: se o PDF só tem "[Intro]", mantenha apenas "[Intro]").
   - É ESTRITAMENTE PROIBIDO adicionar "[Verso 1]", "[Verso 2]", "[Refrão]", "[Ponte]", "[Final]" ou qualquer outra tag quando o PDF original não tiver essas palavras escritas.
   - Se o PDF apenas separar estrofes com linha em branco, mantenha APENAS a linha em branco!

4. ANCORAGEM EXATA ACORDE × SÍLABA PELO ÍNDICE DE CARACTERE (COLUNA) DA LINHA DE BAIXO ("cifra"):
   - No PDF original, os textos usam fonte proporcional e tabulações/espaços largos entre acordes, o que desloca os acordes se copiados literalmente.
   - Para corrigir isso, calcule o alinhamento PELO ÍNDICE DE CARACTERE (COLUNA 0-INDEXED) da sílaba exata onde o acorde é tocado na linha de letra logo abaixo:
   - EXEMPLO 1 (OBRIGATÓRIO SEGUIR):
     Se na linha de baixo "Que toda a Terra proclame que Ele é Santo" a sílaba "Ter" começa na coluna 11, "pro" começa na coluna 17 e "San" começa na coluna 36, a linha de cima DEVE posicionar "Am/E" na coluna 11, "B/D#" na coluna 17 e "C#m7" na coluna 36 usando espaços em branco exatos:
     "           Am/E  B/D#               C#m7"
     "Que toda a Terra proclame que Ele é Santo"
   - EXEMPLO 2 (OBRIGATÓRIO SEGUIR):
     Se na linha "Te adoramos, Te adoramos" o acorde "Bb" está sobre "a" do primeiro "adoramos" (coluna 3), "F" sobre "a" do segundo "adoramos" (coluna 16), "Bb" sobre "ra" (coluna 19) e "C" sobre "mos" (coluna 21), posicione cada acorde exatamente nessas colunas com espaços em branco, NUNCA colando "F Bb C" juntos e NUNCA empurrando para o fim da linha:
     "   Bb           F  Bb C"
     "Te adoramos, Te adoramos"
   - NUNCA remova os espaços iniciais da linha de acordes e NUNCA colapse múltiplos espaços entre acordes!`;

export function buildPdfChordExtractionUserPrompt(fileName?: string): string {
  return `Extraia todas as músicas e cifras contidas neste arquivo PDF${fileName ? ` ("${fileName}")` : ""} com 100% de fidelidade ao documento original:
1. ANCORAGEM POR COLUNA DE CARACTERE (ACORDE × SÍLABA):
   - Ignore a largura visual enganosa das tabulações/fonte proporcional do PDF e posicione cada acorde na linha de cima exatamente no mesmo índice de caractere (coluna) da sílaba correspondente na linha de letra logo abaixo.
   - Exemplo 1: em "Que toda a Terra proclame que Ele é Santo", posicione "Am/E" exatamente na coluna 11 (sobre "Ter" de "Terra"), "B/D#" na coluna 17 (sobre "pro" de "proclame") e "C#m7" na coluna 36 (sobre "San" de "Santo"):
     "           Am/E  B/D#               C#m7"
     "Que toda a Terra proclame que Ele é Santo"
   - Exemplo 2: em "Te adoramos, Te adoramos", posicione "Bb" sobre "a" (coluna 3), "F" sobre o segundo "a" (coluna 16), "Bb" sobre "ra" (coluna 19) e "C" sobre "mos" (coluna 21), nunca colando "F Bb C" juntos.
2. NÃO INJETAR ETIQUETAS DE SEÇÃO INEXISTENTES:
   - NÃO adicione [Verso 1], [Verso 2], [Refrão] ou [Ponte] se essas palavras não estiverem escritas no PDF. Onde o PDF separa estrofes apenas com linha em branco, mantenha apenas a linha em branco.
3. SEM CABEÇALHO DUPLICADO NA CIFRA:
   - Remova da string "cifra" a repetição do Título da música e da linha "Tom: X" no topo, pois eles já vão nos campos "titulo" e "tom".`;
}

/**
 * Pós-processa a cifra extraída do PDF garantindo fidelidade 100% ao alinhamento Acorde × Sílaba:
 * - Converte tabulações (\t) em 6 espaços antes de processar.
 * - NUNCA aplica .trim() no início das linhas de acordes e NUNCA substitui múltiplos espaços por um único espaço.
 * - Remove da string `cifra` a repetição do Título da música, Artista e da linha `Tom: X` no topo.
 * - Remove apenas espaços em branco sobrando no FINAL (à direita) de cada linha.
 * - Se uma estrofe inteira estiver indentada/recuada à direita no PDF (onde todas as linhas de acordes E letras têm recuo comum),
 *   remove apenas o recuo comum mínimo de todas as linhas daquela estrofe na mesma proporção.
 */
export function formatExtractedPdfCifra(
  rawCifra: string,
  songTitle?: string,
  songArtist?: string
): string {
  if (!rawCifra) return '';

  const rawLines = String(rawCifra)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '      ')
    .replace(/\u00A0/g, ' ')
    .split('\n');

  // 1. Filtra rodapés/links de sites sem alterar os espaços à esquerda das linhas válidas
  const cleanedLines: string[] = [];
  for (const line of rawLines) {
    const rightTrimmed = line.replace(/ +$/g, '');
    const checkTrimmed = rightTrimmed.trim();

    if (checkTrimmed) {
      if (/^(?:https?:\/\/|www\.)\S+$/i.test(checkTrimmed)) continue;
      if (/(?:cifraclub\.com\.br|letras\.mus\.br|superpartituras\.com|bananacifras\.com)/i.test(checkTrimmed)) continue;
      if (/^(?:p[aá]gina|pag\.?|pg\.?)\s*\d+(?:\s*(?:de|\/)\s*\d+)?$/i.test(checkTrimmed)) continue;
      if (/^-?\s*\d+\s*\/\s*\d+\s*-?$/.test(checkTrimmed)) continue;
    }

    cleanedLines.push(checkTrimmed === '' ? '' : rightTrimmed);
  }

  // 2. Remove do topo da cifra a repetição do Título da música, Artista e da linha "Tom: X" / "BPM: X"
  const normHeader = (str?: string) =>
    String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const normTitle = normHeader(songTitle);
  const normArtist = normHeader(songArtist);

  let startIdx = 0;
  let inspectedNonEmpty = 0;
  while (startIdx < cleanedLines.length && inspectedNonEmpty < 6) {
    const currentTrimmed = cleanedLines[startIdx].trim();
    if (!currentTrimmed) {
      startIdx += 1;
      continue;
    }

    inspectedNonEmpty += 1;

    // Linha "Tom: X", "Tonalidade: X", "Key: X", "Capotraste...", "BPM: X" (isolados ou combinados)
    const isTomOrMetaHeader =
      /^(?:tom|tonalidade|key)\s*[:=-]\s*[A-G][#b]?(?:m|maj|min|menor|maior|7M|7m|7)?(?:\s*[\(\/|,-].*)?$/i.test(currentTrimmed) ||
      /^(?:bpm|andamento|tempo)\s*[:=-]\s*\d{2,3}(?:\s*bpm)?$/i.test(currentTrimmed) ||
      /^(?:capo(?:traste)?)\s*[:=-]?\s*\d+.*$/i.test(currentTrimmed);

    if (isTomOrMetaHeader) {
      startIdx += 1;
      continue;
    }

    // Linha que repete exatamente o título ou título + artista no cabeçalho
    const normLine = normHeader(currentTrimmed);
    const isRepeatedTitle =
      Boolean(normTitle && normLine) &&
      (normLine === normTitle ||
        (normArtist && normLine === `${normTitle}${normArtist}`) ||
        (normArtist && normLine === `${normArtist}${normTitle}`));

    const isRepeatedArtist =
      Boolean(normArtist && normLine && normLine.length >= 3) && normLine === normArtist;

    if (isRepeatedTitle || isRepeatedArtist) {
      startIdx += 1;
      continue;
    }

    break;
  }

  const bodyLines = cleanedLines.slice(startIdx);

  // 3. Compacta múltiplas linhas em branco consecutivas em apenas 1 linha vazia entre estrofes
  const compactLines: string[] = [];
  let emptyRun = 0;
  for (const line of bodyLines) {
    if (line === '') {
      emptyRun += 1;
      if (compactLines.length > 0 && emptyRun <= 1) {
        compactLines.push('');
      }
    } else {
      emptyRun = 0;
      compactLines.push(line);
    }
  }
  while (compactLines.length > 0 && compactLines[compactLines.length - 1] === '') {
    compactLines.pop();
  }

  // 4. Agrupa por estrofe (separada por linha em branco) e remove apenas o recuo comum da estrofe
  //    na mesma proporção entre linhas de acordes e linhas de letra
  const stanzas: string[][] = [];
  let currentStanza: string[] = [];
  for (const line of compactLines) {
    if (line === '') {
      if (currentStanza.length > 0) {
        stanzas.push(currentStanza);
        currentStanza = [];
      }
    } else {
      currentStanza.push(line);
    }
  }
  if (currentStanza.length > 0) {
    stanzas.push(currentStanza);
  }

  const dedentedStanzas = stanzas.map((stanzaLines) => {
    let minCommonIndent = Infinity;
    for (const l of stanzaLines) {
      if (!l) continue;
      const match = l.match(/^( *)/);
      const leadingSpaces = match ? match[1].length : 0;
      if (leadingSpaces < minCommonIndent) {
        minCommonIndent = leadingSpaces;
      }
    }
    if (!Number.isFinite(minCommonIndent) || minCommonIndent <= 0) {
      return stanzaLines.join('\n');
    }
    return stanzaLines.map((l) => l.slice(minCommonIndent)).join('\n');
  });

  return dedentedStanzas.join('\n\n');
}

/**
 * Envia um payload Base64 de PDF (arquivo inteiro ou bloco fatiado) para o endpoint server-side do Gemini.
 */
async function postPdfChunkToApi(
  base64Data: string,
  displayName: string
): Promise<RawExtractedPdfSong[]> {
  let response: Response;
  try {
    response = await fetch('/api/songs/extract-pdf-chords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: displayName,
        mimeType: 'application/pdf',
        base64Data,
        systemInstruction: PDF_CHORD_EXTRACTION_SYSTEM_INSTRUCTION,
        promptText: buildPdfChordExtractionUserPrompt(displayName)
      })
    });
  } catch (networkErr: any) {
    const err: PdfChunkApiError = new Error(
      'Instabilidade temporária de conexão com o servidor.'
    );
    err.isTransient = true;
    throw err;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const rawMsg = String(payload?.error || `HTTP ${response.status}`);
    const transient = isTransientPdfApiError(response.status, rawMsg);
    const err: PdfChunkApiError = new Error(
      sanitizeRawApiErrorMessage(
        rawMsg,
        'Não foi possível ler este trecho (alta demanda temporária do servidor).'
      )
    );
    err.status = response.status;
    err.isTransient = transient;
    throw err;
  }

  const rawSongs = Array.isArray(payload?.songs) ? payload.songs : [];
  return rawSongs.map((s: any) => ({
    ...s,
    cifra: formatExtractedPdfCifra(s?.cifra || '', s?.titulo, s?.artista)
  }));
}

/**
 * Executa a leitura de um bloco de páginas com até 3 tentativas automáticas
 * e backoff progressivo (2.5s antes da 2ª tentativa e 5s antes da 3ª tentativa).
 */
async function postPdfChunkWithRetry(params: {
  base64Data: string;
  displayName: string;
  fileName: string;
  chunkIndex: number;
  totalChunks: number;
  pageStart: number;
  pageEnd: number;
  totalPages: number;
  songsFoundInFile: number;
  chunkPercent: number;
  onProgress?: (progress: PdfExtractionProgress) => void;
}): Promise<RawExtractedPdfSong[]> {
  const maxAttempts = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await postPdfChunkToApi(params.base64Data, params.displayName);
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.isTransient !== false &&
        isTransientPdfApiError(err?.status, err?.message);

      if (!isTransient || attempt >= maxAttempts) {
        break;
      }

      const nextAttempt = attempt + 1;
      const delayMs = PDF_RETRY_BACKOFF_MS[attempt - 1] ?? 6000;
      const retryMsg = `Servidor ocupado nas páginas ${params.pageStart}–${params.pageEnd}, tentando novamente (${nextAttempt}/${maxAttempts})...`;

      params.onProgress?.({
        fileName: params.fileName,
        chunkIndex: params.chunkIndex,
        totalChunks: params.totalChunks,
        pageStart: params.pageStart,
        pageEnd: params.pageEnd,
        totalPages: params.totalPages,
        songsFoundInFile: params.songsFoundInFile,
        chunkPercent: params.chunkPercent,
        retryAttempt: nextAttempt,
        maxAttempts,
        statusMessage: retryMsg
      });

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error('Instabilidade temporária do servidor.');
}

/**
 * Une duas cifras da mesma música que atravessaram uma emenda de bloco,
 * evitando duplicar linhas já presentes na página de overlap e NUNCA usando .trim()
 * à esquerda para não deslocar os acordes da primeira linha.
 */
function mergeOverlappingCifra(prevCifra: string, nextCifra: string): string {
  const cleanPrev = formatExtractedPdfCifra(prevCifra || '');
  const cleanNext = formatExtractedPdfCifra(nextCifra || '');
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
export function mergeChunkSongsIntoAccumulated(
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
  totalFiles?: number;
  onProgress?: (progress: PdfExtractionProgress) => void;
  onChunkWarning?: (warning: string) => void;
  onChunkFailed?: (failedChunk: FailedPdfChunkInfo) => void;
}

/**
 * Reprocessa exclusivamente um bloco de páginas que falhou anteriormente,
 * aplicando a mesma política de até 3 tentativas automáticas com backoff (2.5s / 5s).
 */
export async function retryFailedPdfChunk(
  chunk: FailedPdfChunkInfo,
  onProgress?: (progress: PdfExtractionProgress) => void
): Promise<RawExtractedPdfSong[]> {
  const chunkLabel =
    chunk.totalChunks > 1
      ? `${chunk.fileName} (páginas ${chunk.pageStart}-${chunk.pageEnd})`
      : chunk.fileName;

  return postPdfChunkWithRetry({
    base64Data: chunk.base64Data,
    displayName: chunkLabel,
    fileName: chunk.fileName,
    chunkIndex: chunk.chunkIndex,
    totalChunks: chunk.totalChunks,
    pageStart: chunk.pageStart,
    pageEnd: chunk.pageEnd,
    totalPages: chunk.totalPages,
    songsFoundInFile: 0,
    chunkPercent: 50,
    onProgress
  });
}

/**
 * Envia um arquivo PDF para o endpoint server-side do Gemini com fatiamento automático
 * em blocos de 5 páginas (via pdf-lib) para apostilas grandes, merge na emenda das páginas,
 * retentativa automática inteligente (3 tentativas com backoff 2.5s/5s) e intervalo de 600ms entre blocos.
 */
export async function extractSongsFromPdfFile(
  file: File,
  options?: ExtractPdfFileOptions
): Promise<RawExtractedPdfSong[]> {
  const sizeError = validatePdfFileSize(file);
  if (sizeError) {
    throw new Error(sizeError);
  }

  const totalFiles = options?.totalFiles ?? 1;
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

  // PDFs com até 5 páginas (ou fallback quando não foi possível inspecionar páginas): envio único com até 3 tentativas
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
    try {
      const songs = await postPdfChunkWithRetry({
        base64Data,
        displayName: file.name,
        fileName: file.name,
        chunkIndex: 1,
        totalChunks: 1,
        pageStart: 1,
        pageEnd: pageCountDisplay,
        totalPages: pageCountDisplay,
        songsFoundInFile: 0,
        chunkPercent: 30,
        onProgress: options?.onProgress
      });

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
    } catch {
      const friendlyMessage = formatFriendlyPdfChunkError(
        1,
        pageCountDisplay,
        file.name,
        totalFiles
      );
      options?.onChunkFailed?.({
        id: `${file.name}_chunk_1_${Date.now()}`,
        fileName: file.name,
        chunkIndex: 1,
        totalChunks: 1,
        pageStart: 1,
        pageEnd: pageCountDisplay,
        totalPages: pageCountDisplay,
        base64Data,
        friendlyMessage
      });
      throw new Error(friendlyMessage);
    }
  }

  // Apostilas grandes (> 5 páginas): fatia automaticamente no navegador em blocos de 5 páginas com overlap de 1 página
  const chunks = buildPdfPageChunks(totalPages);
  let accumulatedSongs: RawExtractedPdfSong[] = [];
  let failedChunks = 0;
  let lastFriendlyError: string | null = null;

  for (let i = 0; i < chunks.length; i += 1) {
    // Pequeno intervalo de 600ms entre o envio de blocos consecutivos para evitar rajadas simultâneas
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, PDF_INTER_CHUNK_DELAY_MS));
    }

    const { startIdx, endIdx } = chunks[i];
    const pageStart = startIdx + 1;
    const pageEnd = endIdx + 1;
    const chunkIndex = i + 1;
    const currentPercent = Math.round((i / chunks.length) * 100);

    options?.onProgress?.({
      fileName: file.name,
      chunkIndex,
      totalChunks: chunks.length,
      pageStart,
      pageEnd,
      totalPages,
      songsFoundInFile: accumulatedSongs.length,
      chunkPercent: currentPercent
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

    try {
      const chunkSongs = await postPdfChunkWithRetry({
        base64Data: chunkBase64,
        displayName: chunkLabel,
        fileName: file.name,
        chunkIndex,
        totalChunks: chunks.length,
        pageStart,
        pageEnd,
        totalPages,
        songsFoundInFile: accumulatedSongs.length,
        chunkPercent: currentPercent,
        onProgress: options?.onProgress
      });

      accumulatedSongs = mergeChunkSongsIntoAccumulated(
        accumulatedSongs,
        chunkSongs,
        i > 0
      );
    } catch {
      failedChunks += 1;
      const friendlyMessage = formatFriendlyPdfChunkError(
        pageStart,
        pageEnd,
        file.name,
        totalFiles
      );
      lastFriendlyError = friendlyMessage;
      options?.onChunkWarning?.(friendlyMessage);
      options?.onChunkFailed?.({
        id: `${file.name}_chunk_${chunkIndex}_${Date.now()}`,
        fileName: file.name,
        chunkIndex,
        totalChunks: chunks.length,
        pageStart,
        pageEnd,
        totalPages,
        base64Data: chunkBase64,
        friendlyMessage
      });
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

  if (accumulatedSongs.length === 0 && failedChunks === chunks.length && lastFriendlyError) {
    throw new Error(lastFriendlyError);
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
