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
  const lines: string[] = [];

  // Metadados compatíveis com Holyrics
  if (song.title) {
    lines.push(`[title] ${song.title.trim()}`);
  }
  if (song.artist) {
    lines.push(`[artist] ${song.artist.trim()}`);
  }
  if (song.key) {
    lines.push(`[key] ${song.key.trim()}`);
  }
  if (song.bpm) {
    lines.push(`[bpm] ${song.bpm}`);
  }
  if (song.timeSignature) {
    lines.push(`[time_signature] ${song.timeSignature}`);
  }

  // Linha em branco separando os metadados da letra
  lines.push('');

  // Letra limpa (sem cifras embutidas ou acordes soltos)
  const rawText = song.lyrics || song.chords || '';
  const cleanedLyrics = cleanLyricsForProjection(rawText);

  // O Holyrics espera quebras duplas entre estrofes/refrões
  // Se a letra já tiver tags como [Verso], [Refrão], nós as preservamos ou organizamos
  const formattedLyrics = cleanedLyrics
    .split(/\n{2,}/)
    .map(stanza => stanza.trim())
    .filter(Boolean)
    .join('\n\n');

  lines.push(formattedLyrics);

  return lines.join('\n');
}

/**
 * Gera um arquivo ZIP contendo todas as músicas de um culto formatadas para o Holyrics,
 * além de um arquivo de programação do culto (.txt)
 */
export async function generateHolyricsZipForService(service: any, songs: HolyricsSongExport[]): Promise<Blob> {
  const zip = new JSZip();

  const folderName = `Holyrics_${sanitizeFilename(service.title || service.name || 'Culto')}`;
  const songsFolder = zip.folder(`${folderName}/Musicas`);

  // 1. Arquivos individuais de cada música
  songs.forEach((song, idx) => {
    const songTxt = formatSongForHolyrics(song);
    const prefix = String(idx + 1).padStart(2, '0');
    const safeTitle = sanitizeFilename(song.title || `Musica_${idx + 1}`);
    const fileName = `${prefix}_${safeTitle}.txt`;
    if (songsFolder) {
      songsFolder.file(fileName, songTxt);
    }
  });

  // 2. Arquivo de programação / ordem do culto
  const serviceLines: string[] = [
    `=== PROGRAMAÇÃO DO CULTO - LILOUPRO PARA HOLYRICS ===`,
    `Culto: ${service.title || service.name || 'Culto de Louvor'}`,
    service.date ? `Data: ${service.date}` : '',
    service.time ? `Horário: ${service.time}` : '',
    '',
    `--- REPERTÓRIO DE MÚSICAS ---`,
    ...songs.map((song, idx) => {
      const parts = [`${idx + 1}. ${song.title}`];
      if (song.artist) parts.push(`(${song.artist})`);
      if (song.key) parts.push(`- Tom: ${song.key}`);
      if (song.bpm) parts.push(`- BPM: ${song.bpm}`);
      return parts.join(' ');
    }),
    '',
    `Instruções para o Holyrics:`,
    `1. Copie os arquivos da pasta "Musicas" para a pasta de músicas do Holyrics.`,
    `2. No Holyrics, clique em "Músicas" -> "Adicionar à Lista" para montar a ordem do culto.`,
    `3. Sincronizado e exportado pelo LiLouPro.`
  ].filter(line => line !== null && line !== undefined);

  zip.file(`${folderName}/Programacao_do_Culto.txt`, serviceLines.join('\n'));

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
