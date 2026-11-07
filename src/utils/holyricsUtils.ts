import JSZip from 'jszip';
import { cleanLyricsForProjection } from '../services/chordService';

export interface HolyricsSongExport {
  title: string;
  artist?: string;
  key?: string;
  bpm?: number | string;
  timeSignature?: string;
  lyrics?: string;
  chords?: string;
}

export interface ParsedHolyricsSong {
  title: string;
  artist: string;
  baseKey: string;
  bpm: number;
  lyrics: string;
  chords: string;
}

/**
 * Sanitiza o nome de arquivo para ser seguro no sistema de arquivos do Windows/Mac
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[\\/*?:"<>|]/g, '')
    .trim() || 'Musica';
}

/**
 * Converte uma música do LiLouPro no formato clássico de arquivo de texto (.txt) do Holyrics
 */
export function formatSongForHolyrics(song: HolyricsSongExport): string {
  // Letra limpa organizada em slides equilibrados (2 a 4 linhas por slide)
  const rawText = song.lyrics || song.chords || '';
  const cleanedLyrics = cleanLyricsForProjection(rawText);

  // Garantia extra: remove qualquer linha remanescente de cabeçalho [Verso...], acordes entre parênteses ou repetições soltas
  const filteredLines = cleanedLyrics
    .split(/\r?\n/)
    .filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return true; // Mantém quebras de linha entre estrofes
      if (/^\s*\[[^\]]+\]/i.test(trimmed)) return false; // Tags [Verso 1], [Refrão], etc.
      if (/^\s*\{[^\}]+\}/i.test(trimmed)) return false;
      if (/^[\(\[]?\s*([0-9]+x|bis)\s*[\)\]]?$/i.test(trimmed)) return false;
      if (/^\s*\([^\)]*([A-G][#b]?)[^\)]*\)(\s*[0-9]+x)?\s*$/i.test(trimmed)) return false; // ( Bm7 G D A4 ) 2x
      return true;
    })
    .join('\n')
    // Remove múltiplos espaços ou quebras vazias consecutivas
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // No Holyrics, arquivos de texto de músicas contêm diretamente as estrofes separadas por linha em branco.
  // O título da música e artista são definidos pelo próprio nome do arquivo (.txt).
  // Dessa forma, NÃO são gerados slides indesejados com tags de [title] ou [artist] na tela da congregação!
  return filteredLines;
}

/**
 * Gera um arquivo ZIP contendo todas as músicas de um culto formatadas para o Holyrics,
 * além de um arquivo de programação do culto (.txt)
 */
export async function generateHolyricsZipForService(service: any, songs: HolyricsSongExport[]): Promise<Blob> {
  const zip = new JSZip();

  const folderName = `Holyrics_${sanitizeFilename(service.title || service.name || 'Culto')}`;
  const songsFolder = zip.folder(`${folderName}/Musicas`);
  const cleanFolder = zip.folder(`${folderName}/Musicas_Sem_Numeracao`);

  // 1. Arquivos individuais de cada música numerados conforme a ordem oficial da Liturgia
  // Ex: "01 - Teu Povo.txt", "02 - Depois do Jardim.txt", etc.
  // Isso garante que no Holyrics e no Windows os arquivos fiquem ordenados EXATAMENTE na ordem do culto!
  songs.forEach((song, idx) => {
    const songTxt = formatSongForHolyrics(song);
    const safeTitle = sanitizeFilename(song.title || `Musica_${idx + 1}`);
    const numPrefix = String(idx + 1).padStart(2, '0');
    
    // Pasta principal: com prefixo para garantir a ordenação correta no Holyrics
    const fileName = `${numPrefix} - ${safeTitle}.txt`;
    if (songsFolder) {
      songsFolder.file(fileName, songTxt);
    }

    // Pasta alternativa: sem numeração no nome do arquivo
    if (cleanFolder) {
      cleanFolder.file(`${safeTitle}.txt`, songTxt);
    }
  });

  // 2. Arquivo de programação / ordem do culto
  const serviceLines: string[] = [
    `=== PROGRAMAÇÃO DO CULTO - LILOUPRO PARA HOLYRICS ===`,
    `Culto: ${service.title || service.name || 'Culto de Louvor'}`,
    service.date ? `Data: ${service.date}` : '',
    service.time ? `Horário: ${service.time}` : '',
    '',
    `--- REPERTÓRIO DE MÚSICAS (ORDEM OFICIAL DA LITURGIA) ---`,
    ...songs.map((song, idx) => {
      const parts = [`${String(idx + 1).padStart(2, '0')}. ${song.title}`];
      if (song.artist) parts.push(`(${song.artist})`);
      if (song.key) parts.push(`- Tom: ${song.key}`);
      if (song.bpm) parts.push(`- BPM: ${song.bpm}`);
      return parts.join(' ');
    }),
    '',
    `Instruções para o Holyrics:`,
    `1. Na pasta "Musicas", os arquivos já estão numerados (01, 02, 03...) na ordem exata da liturgia.`,
    `2. No Holyrics, ao importar a pasta ou os arquivos, eles ficam perfeitamente ordenados.`,
    `3. Sincronizado e exportado pelo LiLouPro.`
  ].filter(line => line !== null && line !== undefined);

  zip.file(`${folderName}/Programacao_do_Culto.txt`, serviceLines.join('\n'));

  // 3. Arquivo de lista simples para cópia rápida
  const simpleList = songs.map((s, idx) => `${String(idx + 1).padStart(2, '0')} - ${s.title}`).join('\n');
  zip.file(`${folderName}/Ordem_do_Culto.txt`, simpleList);

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Dispara o download de um Blob no navegador
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Processa o conteúdo de arquivos importados do Holyrics (.txt) e extrai músicas estruturadas
 */
export function parseHolyricsTextFile(content: string, fallbackTitle: string): ParsedHolyricsSong {
  const lines = content.split(/\r?\n/);
  
  let title = fallbackTitle.replace(/\.txt$/i, '').trim();
  let artist = '';
  let baseKey = '';
  let bpm = 80;
  const lyricLines: string[] = [];

  // Remove prefixos numéricos comuns (ex: "01_Música" -> "Música")
  title = title.replace(/^\d+[\s_-]+/, '').trim();

  let insideLyrics = false;

  for (let line of lines) {
    const trimmed = line.trim();

    // Detecção de tags de metadados do Holyrics [tag] valor
    const tagMatch = trimmed.match(/^\[(title|artist|author|key|tom|bpm|tempo)\]\s*(.*)$/i);
    if (!insideLyrics && tagMatch) {
      const tag = tagMatch[1].toLowerCase();
      const val = tagMatch[2].trim();
      if (tag === 'title' && val) title = val;
      if ((tag === 'artist' || tag === 'author') && val) artist = val;
      if ((tag === 'key' || tag === 'tom') && val) baseKey = val;
      if ((tag === 'bpm' || tag === 'tempo') && val) {
        const parsedBpm = parseInt(val, 10);
        if (!isNaN(parsedBpm) && parsedBpm > 0) bpm = parsedBpm;
      }
      continue;
    }

    // Se encontramos a primeira linha que não é tag nem vazia, começamos a letra
    if (trimmed !== '') {
      insideLyrics = true;
    }

    if (insideLyrics) {
      lyricLines.push(line);
    }
  }

  const cleanLyrics = lyricLines.join('\n').trim();

  return {
    title: title || 'Música Sem Título',
    artist: artist || 'Desconhecido',
    baseKey: baseKey || '',
    bpm,
    lyrics: cleanLyrics,
    chords: cleanLyrics // Base inicial caso venha apenas a letra
  };
}

/**
 * Script oficial em JavaScript (Holyrics JSLib) para automação e importação de cultos do LiLouPro
 */
export const HOLYRICS_JAVASCRIPT_SCRIPT = `// ========================================================
// SCRIPT DE IMPORTAÇÃO AUTOMÁTICA - LILOUPRO PARA HOLYRICS
// ========================================================
function scriptAction(obj) {
    var clipboard = h.getClipboard();
    if (!clipboard || clipboard.trim() === '') {
        h.hly('ShowNotification', { 'text': 'Área de transferência vazia! Copie o culto no LiLouPro primeiro.' });
        h.log('Área de transferência vazia. Copie a lista do culto no LiLouPro.');
        return;
    }

    var lines = clipboard.split("\\n");
    var adicionadas = 0;
    var naoEncontradas = [];

    for (var i = 0; i < lines.length; i++) {
        var songTitle = lines[i].trim();
        // Ignora linhas vazias ou comentários
        if (songTitle === '' || songTitle.indexOf('//') === 0 || songTitle.indexOf('#') === 0) {
            continue;
        }

        // Pesquisa a música no acervo interno do Holyrics
        var result = h.hly('SearchSong', { 'text': songTitle });
        if (!result || !result.data || result.data.length === 0) {
            // Tenta buscar sem prefixos numéricos (ex: "01 - Teu Povo" -> "Teu Povo")
            var cleanTitle = songTitle.replace(/^\d+[\s._-]+/, '').trim();
            if (cleanTitle !== songTitle) {
                result = h.hly('SearchSong', { 'text': cleanTitle });
            }
        }

        if (result && result.data && result.data.length > 0) {
            var song = result.data[0];
            // Adiciona a música diretamente na playlist de projeção
            h.hly('AddToLyricsPlaylist', { 'id_song': song.id });
            adicionadas++;
            h.log('✓ Adicionada ao culto: ' + song.title);
        } else {
            naoEncontradas.push(songTitle);
            h.log('⚠ Não encontrada no acervo: ' + songTitle);
        }
    }

    if (adicionadas > 0) {
        h.hly('ShowNotification', { 'text': 'LiLouPro: ' + adicionadas + ' música(s) adicionada(s) à playlist!' });
    }
    if (naoEncontradas.length > 0) {
        h.log('Músicas não encontradas (cadastre-as ou importe o .zip gerado no LiLouPro): ' + naoEncontradas.join(', '));
    }
}`;
