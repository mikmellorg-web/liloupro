import { jsPDF } from 'jspdf';
import { getServiceSongIds } from './servicePlaylistUtils';
import { isChordLine } from '../services/chordService';
import { findLocalPopularSong } from '../songsDatabase';
import { parseLineSectionAndDynamics, ParsedSectionAndDynamics, normalizeSpacedTags, getDynamicExplanationDetails } from '../components/songsShared';

export interface CadernoOptions {
  allSongs?: any[];
  members?: any[];
  churchData?: any;
  user?: any;
  targetEmail?: string;
  forGoogleDocs?: boolean;
}

/**
 * Formata uma data para texto legível em português.
 */
function formatServiceDate(dateVal: any): string {
  if (!dateVal) return '';
  let d: Date;
  if (dateVal?.toDate) d = dateVal.toDate();
  else if (dateVal instanceof Date) d = dateVal;
  else d = new Date(dateVal);

  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) + ` às ` + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Escapa caracteres HTML perigosos preservando caracteres especiais.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Remove qualquer menção de versão da Bíblia (ex: (NAA), (NVI), (ARC), (BLIVRE), etc.)
 * tanto de textos litúrgicos, passagens bíblicas quanto de títulos de músicas.
 */
export function removeBibleVersionTags(text: string): string {
  if (!text) return '';
  return text
    .replace(/\s*\((?:NAA|NVI|ARC|ARA|BLIVRE|NVT|ACF|KJV|NTLH|NTHL|NBV)\)/gi, '')
    .trim();
}

/**
 * Formata os badges de seção, dinâmica e repetições em HTML compatível com Word e Google Docs,
 * replicando fielmente as cores, bordas, badges e espaçamentos do PDF ("Cifras do Culto")
 * e da visualização direta pelo app (SongDetailView).
 */
export function formatSectionDynamicsHtml(parsed: ParsedSectionAndDynamics, isTop: boolean = false): string {
  if (!parsed || !parsed.isMatch) return '';

  const badgesHtml: string[] = [];

  // 1. Badges de Seção ([Intro], [Verso], [Refrão], [Ponte], etc.) - ciano/teal LiLouPro
  for (const sec of parsed.sections) {
    const title = sec.title.toUpperCase();
    badgesHtml.push(
      `<span style="display: inline-block; padding: 2pt 6pt; margin-right: 4pt; margin-bottom: 2pt; font-family: Arial, Helvetica, sans-serif; font-size: 8pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; background-color: #eef6f8; color: #0e7490; border: 1pt solid #2ba9b8; border-radius: 4pt; vertical-align: middle; white-space: nowrap;">${escapeHtml(title)}</span>`
    );
  }

  // 2. Badges de Dinâmica (ex: N2 • BEM SUAVE, N6 • FORTE, PAUSA, etc.)
  for (const dyn of parsed.dynamics) {
    const cleanLabel = formatDynamicLabelForPdf(dyn.label);
    if (!cleanLabel) continue;

    const t = dyn.type?.toLowerCase() || '';
    let bg = '#f1f5f9';
    let border = '#cbd5e1';
    let textC = '#334155';

    if (t === 'n1' || t === 'n2' || t === 'sutil' || t === 'suave') {
      bg = '#ecfdf5';
      border = '#6ee7b7';
      textC = '#047857';
    } else if (t === 'n3' || t === 'n4' || t === 'moderado') {
      bg = '#f0f9ff';
      border = '#7dd3fc';
      textC = '#0369a1';
    } else if (t === 'n5' || t === 'n6' || t === 'forte' || t === 'meio forte') {
      bg = '#fff7ed';
      border = '#fdba74';
      textC = '#c2410c';
    } else if (t === 'n7' || t === 'clímax' || t === 'climax') {
      bg = '#fff1f2';
      border = '#fda4af';
      textC = '#be123c';
    } else if (t === 'pausa' || t === 'stop') {
      bg = '#fef2f2';
      border = '#fca5a5';
      textC = '#b91c1c';
    }

    badgesHtml.push(
      `<span style="display: inline-block; padding: 2pt 5pt; margin-right: 4pt; margin-bottom: 2pt; font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; background-color: ${bg}; color: ${textC}; border: 1pt solid ${border}; border-radius: 4pt; vertical-align: middle; white-space: nowrap;">${escapeHtml(cleanLabel)}</span>`
    );
  }

  // 3. Badges de Repetição (ex: 2X, 4X, BIS)
  for (const rep of parsed.repeats) {
    const repLabel = rep.toUpperCase();
    badgesHtml.push(
      `<span style="display: inline-block; padding: 2pt 5pt; margin-right: 4pt; margin-bottom: 2pt; font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; background-color: #fef3c7; color: #b45309; border: 1pt solid #fcd34d; border-radius: 4pt; vertical-align: middle; white-space: nowrap;">🔁 ${escapeHtml(repLabel)}</span>`
    );
  }

  // 4. Texto remanescente após tags
  if (parsed.remainingText) {
    badgesHtml.push(
      `<span style="font-family: Arial, Helvetica, sans-serif; font-size: 8pt; font-style: italic; font-weight: bold; color: #64748b; margin-left: 4pt; vertical-align: middle;">${escapeHtml(parsed.remainingText)}</span>`
    );
  }

  const topMargin = isTop ? '0pt' : '6pt';
  return `<p class="cifra-section MsoNormal" style="margin: 0pt; margin-top: ${topMargin}; margin-bottom: 3pt; mso-margin-top-alt: ${topMargin}; mso-margin-bottom-alt: 3pt; line-height: 1.25; page-break-after: avoid; mso-pagination: lines-together;">${badgesHtml.join('')}</p>`;
}

/**
 * Formata um conjunto de linhas de cifra para uma coluna usando parágrafos (<p>)
 * com margens estritamente zeradas (margin: 0pt) e altura de linha compacta (line-height: 1.15).
 * Isso garante que tanto no Google Docs (Ctrl+V) quanto no Microsoft Word (.doc) o espaçamento
 * seja compacto e idêntico ao PDF do aplicativo, sem grandes lacunas entre acordes e letras.
 */
function formatCifraColumnLines(lines: string[]): string {
  if (!lines || lines.length === 0) return '';

  const rendered: string[] = [];
  let lastWasEmpty = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const cleanLine = rawLine ? rawLine.replace(/\r/g, '') : '';
    const trimmed = cleanLine.trim();

    if (!trimmed) {
      // Evita acumular linhas vazias repetidas
      if (lastWasEmpty) continue;
      lastWasEmpty = true;
      rendered.push(
        `<p class="cifra-line MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 0pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 0pt; line-height: 1.15; mso-line-height-rule: exactly; font-family: 'Courier New', Courier, monospace; font-size: 10pt;">&nbsp;</p>`
      );
      continue;
    }

    lastWasEmpty = false;

    // Seção ou dinâmica: detecta usando o mesmo parser do PDF e SongDetailView (parseLineSectionAndDynamics)
    const norm = normalizeSpacedTags(cleanLine);
    const parsed = parseLineSectionAndDynamics(norm);

    if (parsed.isMatch) {
      const isTop = i === 0 || rendered.length === 0;
      rendered.push(formatSectionDynamicsHtml(parsed, isTop));
      continue;
    }

    const isChord = isChordLine(cleanLine);

    if (isChord) {
      // Linha de acordes: acordes destacados em negrito (<b>) e cor azul/teal (#2ba9b8) exatamente como no PDF
      const tokens = cleanLine.match(/(\S+|\s+)/g) || [cleanLine];
      const formattedTokens = tokens.map(token => {
        if (/^\s+$/.test(token)) {
          return token.replace(/ /g, '&nbsp;').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
        }
        return `<b><span style="color: #2ba9b8; font-weight: bold;">${escapeHtml(token)}</span></b>`;
      }).join('');

      rendered.push(
        `<p class="cifra-line MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 0pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 0pt; line-height: 1.15; mso-line-height-rule: exactly; font-family: 'Courier New', Courier, monospace; font-size: 10pt; font-weight: bold; color: #2ba9b8; white-space: pre;"><b>${formattedTokens}</b></p>`
      );
      continue;
    }

    // Linha de letra normal: cor cinza escuro (#3c3c3c) igual ao PDF
    const escapedLyric = escapeHtml(cleanLine)
      .replace(/ /g, '&nbsp;')
      .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');

    rendered.push(
      `<p class="cifra-line MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 0pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 0pt; line-height: 1.15; mso-line-height-rule: exactly; font-family: 'Courier New', Courier, monospace; font-size: 10pt; font-weight: normal; color: #3c3c3c; white-space: pre;">${escapedLyric}</p>`
    );
  }

  return rendered.join('\n');
}

/**
 * Divide uma cifra em duas colunas balanceadas para economizar espaço
 * e garantir o mesmo espaçamento compacto do PDF do aplicativo.
 */
function splitCifraIntoTwoColumnsHtml(rawCifra: string): { col1Html: string; col2Html: string } {
  if (!rawCifra || !rawCifra.trim()) {
    return {
      col1Html: '<p class="cifra-line MsoNormal" style="margin: 0pt; color: #64748b; font-style: italic; font-family: Arial, sans-serif; font-size: 9pt;">(Cifra/Letra não cadastrada no repertório)</p>',
      col2Html: '<p class="cifra-line MsoNormal" style="margin: 0pt;">&nbsp;</p>'
    };
  }

  const lines = rawCifra.split(/\r?\n/);

  // Se a cifra tiver poucas linhas (ex: <= 14 linhas), renderiza na coluna 1 e deixa coluna 2 limpa
  if (lines.length <= 14) {
    return {
      col1Html: formatCifraColumnLines(lines),
      col2Html: '<p class="cifra-line MsoNormal" style="margin: 0pt;">&nbsp;</p>'
    };
  }

  // Encontra o melhor ponto de divisão perto do centro (priorizando seções e linhas vazias)
  const total = lines.length;
  const targetSplit = Math.ceil(total / 2);
  let bestSplit = targetSplit;
  let minDiff = Infinity;

  const minIdx = Math.max(4, Math.floor(total * 0.35));
  const maxIdx = Math.min(total - 4, Math.ceil(total * 0.65));

  for (let i = minIdx; i <= maxIdx; i++) {
    const rawL = lines[i] || '';
    const norm = normalizeSpacedTags(rawL);
    const parsed = parseLineSectionAndDynamics(norm);
    const isSection = parsed.isMatch || /^[\s\[\(\{\-]*([0-9]+\.?)?\s*(verso|refrão|refrao|chorus|intro|introdução|introducao|ponte|bridge|solo|outro|final|fim|coro|estrofe|parte|part|primeira parte|segunda parte|terceira parte|quarta parte|1ª parte|2ª parte|3ª parte|4ª parte|ministração|ministracao|interlúdio|interludio|interlude|pre-chorus|pré-refrão|pre-refrao|coda|tag|hook|vocal|todos|instr|instrumental|bis)/i.test(rawL.trim());
    const isEmpty = rawL.trim().length === 0;

    if (isSection || isEmpty) {
      const distance = Math.abs(i - targetSplit);
      const score = isSection ? distance * 0.7 : distance;
      if (score < minDiff) {
        minDiff = score;
        bestSplit = i;
      }
    }
  }

  const col1Lines = lines.slice(0, bestSplit);
  let col2Lines = lines.slice(bestSplit);

  // Remove linha vazia inicial da coluna 2 se o corte foi em uma quebra de estrofe
  if (col2Lines.length > 0 && !col2Lines[0].trim()) {
    col2Lines = col2Lines.slice(1);
  }

  return {
    col1Html: formatCifraColumnLines(col1Lines),
    col2Html: formatCifraColumnLines(col2Lines)
  };
}

/**
 * Renderiza uma música com seu cabeçalho completo seguido diretamente pelas cifras em 2 colunas compactas.
 * Usa quebra de página explícita (page-break-before: always) anterior à música para que Word e Google Docs
 * mantenham título, artista, tom/compasso e a primeira página de acordes juntos, sem gerar páginas em branco.
 */
function renderSongSheetHtml(song: {
  title: string;
  artist: string;
  key: string;
  bpm: string;
  timeSignature: string;
  chords: string;
}, index: number = 0): string {
  const { col1Html, col2Html } = splitCifraIntoTwoColumnsHtml(song.chords);

  // O cabeçalho e as duas colunas de cifra são estruturados dentro da MESMA tabela (cifra-song-table).
  // A linha do cabeçalho (<thead>) possui keep-with-next (page-break-after: avoid) e borda inferior direta,
  // enquanto a linha das colunas permite divisão suave (mso-row-cant-split: false).
  // Isso impede que o Word ou Google Docs separem o cabeçalho da música ou criem folhas em branco isoladas.
  return `
  <!-- MÚSICA ${index + 1}: ${escapeHtml(song.title)} -->
  <table class="cifra-song-table" width="100%" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border: none; margin: 0; margin-bottom: 24pt; padding: 0; table-layout: fixed; page-break-before: always; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
    <thead>
      <tr class="cifra-header-row" style="page-break-after: avoid; page-break-inside: avoid; mso-special-format: keep-with-next;">
        <th colspan="2" style="text-align: left; font-weight: normal; padding: 0; margin: 0; border: none; border-bottom: 1.5pt solid #cbd5e1; padding-bottom: 6pt;">
          <p class="MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 2pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 2pt; font-family: Arial, Helvetica, sans-serif; font-size: 18pt; font-weight: bold; color: #000000; line-height: 1.15; page-break-after: avoid; mso-pagination: lines-together;">
            ${escapeHtml(song.title)}
          </p>
          <p class="MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 2pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 2pt; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; font-style: italic; color: #374151; line-height: 1.25; page-break-after: avoid; mso-pagination: lines-together;">
            Artista: ${escapeHtml(song.artist || 'Desconhecido')}
          </p>
          <p class="MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 2pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 2pt; font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #4b5563; line-height: 1.25; page-break-after: avoid; mso-pagination: lines-together;">
            Tom: <b>${escapeHtml(song.key || '-')}</b>${song.bpm ? ` | BPM: ${escapeHtml(song.bpm)}` : ''}${song.timeSignature ? ` | Compasso: ${escapeHtml(song.timeSignature)}` : ''}
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr class="cifra-body-row" style="vertical-align: top; page-break-inside: auto; mso-row-cant-split: false;">
        <td width="50%" valign="top" style="width: 50%; vertical-align: top; padding-top: 8pt; padding-right: 12pt; border: none; margin: 0;">
          ${col1Html}
        </td>
        <td width="50%" valign="top" style="width: 50%; vertical-align: top; padding-top: 8pt; padding-left: 12pt; border: none; margin: 0;">
          ${col2Html}
        </td>
      </tr>
    </tbody>
  </table>`;
}

/**
 * Extrai e unifica as músicas do culto a partir da liturgia, setlist e catálogo de músicas.
 * Garante que todas as cifras (inclusive de itens de liturgia ou harpa cristã) sejam recuperadas.
 */
export function getCadernoSongs(service: any, allSongs: any[] = []): Array<{
  id: string;
  title: string;
  artist: string;
  key: string;
  bpm: string;
  timeSignature: string;
  chords: string;
}> {
  if (!service) return [];

  const results: any[] = [];
  const seenKeys = new Set<string>();

  const liturgy = Array.isArray(service.liturgy) ? service.liturgy : [];

  // 1. Processa itens da liturgia primeiro (respeita a ordem exata do culto)
  liturgy.forEach((item: any, idx: number) => {
    if (!item) return;
    const type = String(item.type || '').toLowerCase();
    const isSong = type === 'song' || !!item.songId || !!item.chords;

    // Tenta encontrar a música no catálogo allSongs
    let matchedSong: any = null;
    if (item.songId) {
      matchedSong = allSongs.find(s => s.id === item.songId || s.uid === item.songId);
    }
    if (!matchedSong && item.id) {
      matchedSong = allSongs.find(s => s.id === item.id || s.uid === item.id);
    }
    if (!matchedSong && item.title) {
      const cleanItemTitle = removeBibleVersionTags(item.title).toLowerCase().trim();
      matchedSong = allSongs.find(s => {
        const t = removeBibleVersionTags(s.title || '').toLowerCase().trim();
        return t === cleanItemTitle || t.includes(cleanItemTitle) || cleanItemTitle.includes(t);
      });
    }

    if (isSong || matchedSong) {
      const rawTitle = item.title || matchedSong?.title || item.content || `Música ${idx + 1}`;
      const title = removeBibleVersionTags(rawTitle);
      const titleKey = title.toLowerCase().trim();

      if (titleKey && !seenKeys.has(titleKey)) {
        seenKeys.add(titleKey);

        const rawArtist = item.artist || matchedSong?.artist || item.responsible || item.vocalist || '';
        const artist = removeBibleVersionTags(rawArtist) || 'Desconhecido';
        const key = item.key || item.tom || matchedSong?.key || matchedSong?.tone || matchedSong?.baseKey || '-';
        const bpm = item.bpm || matchedSong?.bpm ? `${item.bpm || matchedSong?.bpm} BPM` : '';
        const meter = item.timeSignature || item.compass || matchedSong?.timeSignature || matchedSong?.compass || '';

        // Tenta buscar a cifra de todas as fontes disponíveis
        let chords = 
          item.chords || 
          matchedSong?.chords || 
          matchedSong?.cifra || 
          item.cifra || 
          (item.details && isChordLine(item.details) ? item.details : '') || 
          matchedSong?.lyrics || 
          item.lyrics || 
          (item.details && item.details.length > 20 ? item.details : '') ||
          '';

        // Se ainda não tiver cifra, verifica na base local de músicas populares / Harpa Cristã
        if (!chords || !chords.trim()) {
          const localSong = findLocalPopularSong(title, artist);
          if (localSong?.chords || localSong?.lyrics) {
            chords = localSong.chords || localSong.lyrics || '';
          }
        }

        results.push({
          id: matchedSong?.id || item.songId || item.id || `liturgy-song-${idx}`,
          title,
          artist,
          key,
          bpm,
          timeSignature: meter,
          chords
        });
      }
    }
  });

  // 2. Processa setlist caso existam músicas adicionadas no setlist que não estejam na liturgia
  const setlist = Array.isArray(service.setlist) ? service.setlist : [];
  setlist.forEach((entry: any, idx: number) => {
    let matchedSong: any = null;
    if (typeof entry === 'string') {
      matchedSong = allSongs.find(s => s.id === entry) || allSongs.find(s => removeBibleVersionTags(s.title || '').toLowerCase().trim() === entry.toLowerCase().trim());
    } else if (entry && typeof entry === 'object') {
      if (entry.songId) matchedSong = allSongs.find(s => s.id === entry.songId);
      if (!matchedSong && entry.id) matchedSong = allSongs.find(s => s.id === entry.id);
      if (!matchedSong && entry.title) {
        const cleanT = removeBibleVersionTags(entry.title).toLowerCase().trim();
        matchedSong = allSongs.find(s => removeBibleVersionTags(s.title || '').toLowerCase().trim() === cleanT);
      }
    }

    if (matchedSong) {
      const title = removeBibleVersionTags(matchedSong.title || `Música ${idx + 1}`);
      const titleKey = title.toLowerCase().trim();
      if (titleKey && !seenKeys.has(titleKey)) {
        seenKeys.add(titleKey);

        const artist = removeBibleVersionTags(matchedSong.artist || '') || 'Desconhecido';
        const key = matchedSong.key || matchedSong.tone || matchedSong.baseKey || '-';
        const bpm = matchedSong.bpm ? `${matchedSong.bpm} BPM` : '';
        const meter = matchedSong.timeSignature || matchedSong.compass || '';

        let chords = matchedSong.chords || matchedSong.cifra || matchedSong.lyrics || '';
        if (!chords || !chords.trim()) {
          const localSong = findLocalPopularSong(title, artist);
          if (localSong?.chords || localSong?.lyrics) {
            chords = localSong.chords || localSong.lyrics || '';
          }
        }

        results.push({
          id: matchedSong.id || `setlist-song-${idx}`,
          title,
          artist,
          key,
          bpm,
          timeSignature: meter,
          chords
        });
      }
    }
  });

  return results;
}

/**
 * Mapeia tipos de liturgia para rótulos em português
 */
const LITURGY_TYPE_LABELS: Record<string, string> = {
  song: 'Música / Louvor',
  reading: 'Leitura Bíblica',
  speech: 'Pregação / Mensagem',
  prayer: 'Oração',
  announcements: 'Avisos',
  offering: 'Dízimos & Ofertas',
  moment: 'Momento Especial',
  other: 'Outro Momento'
};

/**
 * Gera o documento completo do Caderno do Culto em formato HTML rico,
 * perfeitamente compatível com o Word (.doc) e Google Docs.
 */
export function generateCadernoHtml(service: any, options: CadernoOptions = {}): string {
  if (!service) return '';
  if (options.forGoogleDocs) {
    return generateCadernoGoogleDocsHtml(service, options);
  }

  const churchName = options.churchData?.name || 'Ministério de Louvor';
  const serviceTitle = service.title || 'Culto de Celebração';
  const formattedDate = formatServiceDate(service.date);
  const location = options.churchData?.address || options.churchData?.city || '';

  // Equipe da escala
  const scaleEntries: { role: string; names: string }[] = [];
  if (service.scales && options.members && options.members.length > 0) {
    Object.entries(service.scales).forEach(([role, ids]) => {
      const assignedIds = Array.isArray(ids) ? ids : [ids].filter(Boolean);
      if (assignedIds.length > 0) {
        const names = assignedIds.map(id => {
          const m = options.members?.find((member: any) => member.id === id || member.uid === id);
          return m?.name || 'Membro';
        });
        scaleEntries.push({ role, names: names.join(', ') });
      }
    });
  }

  // Liturgia
  const liturgyItems = Array.isArray(service.liturgy) ? service.liturgy : [];

  // Músicas com resolução e fallback inteligente
  const songs = getCadernoSongs(service, options.allSongs || []);

  let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>Caderno do Culto — ${serviceTitle}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 210mm 297mm; /* A4 */
      margin: 20mm 15mm 20mm 15mm;
      mso-header-margin: 35.4pt;
      mso-footer-margin: 35.4pt;
      mso-paper-source: 0;
    }
    div.Section1 {
      page: Section1;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #1e293b;
      line-height: 1.4;
      max-width: 850px;
      margin: 0 auto;
      padding: 15px;
      background-color: #ffffff;
    }
    p, p.MsoNormal {
      margin: 0pt;
      margin-bottom: 0pt;
      font-family: Arial, Helvetica, sans-serif;
    }
    h1 {
      color: #1e3a8a;
      font-size: 22pt;
      margin-top: 4pt;
      margin-bottom: 4pt;
      border-bottom: 2pt solid #3b82f6;
      padding-bottom: 6pt;
    }
    h2 {
      color: #1d4ed8;
      font-size: 14pt;
      margin-top: 18pt;
      margin-bottom: 8pt;
      border-bottom: 1.5pt solid #e2e8f0;
      padding-bottom: 4pt;
      page-break-after: avoid;
    }
    .header-info {
      font-size: 10.5pt;
      color: #4b5563;
      margin-bottom: 15pt;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      font-size: 8.5pt;
      font-weight: bold;
      border-radius: 4px;
      background-color: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8pt;
      margin-bottom: 16pt;
      font-size: 9.5pt;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 6pt 8pt;
      text-align: left;
    }
    table.data-table th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: bold;
    }
    table.data-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .song-sheet {
      margin-top: 0pt;
      margin-bottom: 24pt;
    }
    p.cifra-line {
      margin: 0pt;
      margin-top: 0pt;
      margin-bottom: 0pt;
      mso-margin-top-alt: 0pt;
      mso-margin-bottom-alt: 0pt;
      font-family: 'Courier New', Courier, monospace;
      font-size: 10pt;
      line-height: 1.15;
      mso-line-height-rule: exactly;
      white-space: pre;
    }
    p.cifra-section {
      margin: 0pt;
      margin-top: 6pt;
      margin-bottom: 3pt;
      mso-margin-top-alt: 6pt;
      mso-margin-bottom-alt: 3pt;
      line-height: 1.25;
      page-break-after: avoid;
      mso-pagination: lines-together;
    }
    table.cifra-song-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin: 0;
      margin-bottom: 24pt;
      padding: 0;
      table-layout: fixed;
      page-break-before: always;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    table.cifra-song-table th, table.cifra-song-table td {
      border: none;
      padding: 0;
      margin: 0;
    }
    tr.cifra-header-row {
      page-break-after: avoid;
      page-break-inside: avoid;
      mso-special-format: keep-with-next;
    }
    tr.cifra-body-row {
      vertical-align: top;
      page-break-inside: auto;
      mso-row-cant-split: false;
    }
    table.cifra-columns-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin: 0;
      padding: 0;
      table-layout: fixed;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    table.cifra-columns-table td {
      border: none;
      padding: 0;
      vertical-align: top;
      width: 50%;
    }
    .footer {
      margin-top: 14pt;
      padding-top: 6pt;
      border-top: 1px solid #cbd5e1;
      font-size: 8.5pt;
      color: #94a3b8;
      text-align: center;
      page-break-inside: avoid;
    }
  </style>
</head>
<body lang="pt-BR">
<div class="Section1">

  <!-- CABEÇALHO OFICIAL DO CULTO -->
  <div style="text-align: center; margin-bottom: 15pt;">
    <div style="font-size: 13pt; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1px;">
      ${churchName}
    </div>
    <h1 style="text-align: center; border-bottom: none; margin: 6pt 0 4pt 0;">
      Caderno do Culto & Liturgia
    </h1>
    <div style="font-size: 16pt; font-weight: bold; color: #2563eb; margin-bottom: 6pt;">
      ${serviceTitle}
    </div>
    <div class="header-info" style="text-align: center;">
      📅 <b>Data:</b> ${formattedDate}
      ${location ? `<br>📍 <b>Local:</b> ${location}` : ''}
      ${service.theme && service.theme !== 'normal' ? `<br>✨ <b>Tema / Ocasião:</b> ${service.theme.toUpperCase()}` : ''}
    </div>
  </div>

  <hr style="border: 0; border-top: 1.5pt solid #3b82f6; margin: 12pt 0 16pt 0;">
`;

  // 1. SEÇÃO DE EQUIPE ESCALADA
  if (scaleEntries.length > 0) {
    html += `
  <h2>👥 Equipe Escalada (Ministério de Louvor & Culto)</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 35%;">Função / Ministério</th>
        <th>Integrantes Escalados</th>
      </tr>
    </thead>
    <tbody>
      ${scaleEntries.map(entry => `
      <tr>
        <td><b>${entry.role}</b></td>
        <td>${entry.names}</td>
      </tr>`).join('')}
    </tbody>
  </table>
`;
  }

  // 2. SEÇÃO DE LITURGIA (ORDEM DO CULTO)
  if (liturgyItems.length > 0) {
    html += `
  <h2>📖 Ordem do Culto (Liturgia Oficial)</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 5%; text-align: center;">#</th>
        <th style="width: 25%;">Momento</th>
        <th>Detalhes / Título / Passagem Bíblica</th>
        <th style="width: 20%;">Responsável</th>
        <th style="width: 10%; text-align: center;">Duração</th>
      </tr>
    </thead>
    <tbody>
      ${liturgyItems.map((item: any, idx: number) => {
        const typeLabel = LITURGY_TYPE_LABELS[item.type] || item.type || 'Momento';
        const durationText = item.duration ? `${item.duration} min` : '-';
        
        // Remove qualquer menção à versão da Bíblia (ex: (NAA), (NVI), etc.)
        const cleanTitle = removeBibleVersionTags(item.title || '-');
        const cleanDetails = item.details ? `<br><small style="color: #64748b;">${removeBibleVersionTags(item.details)}</small>` : '';

        return `
      <tr>
        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
        <td><span class="badge">${typeLabel}</span></td>
        <td><b>${cleanTitle}</b>${cleanDetails}</td>
        <td>${item.responsible || item.vocalist || '-'}</td>
        <td style="text-align: center;">${durationText}</td>
      </tr>`;
      }).join('')}
    </tbody>
  </table>
`;
  }

  // 3. SEÇÃO DE CIFRAS E REPERTÓRIO COMPLETO
  // Cada música é renderizada em sua própria tabela indivisível (cabeçalho + cifras em 2 colunas)
  // com page-break-before: always, garantindo que o título nunca fique isolado em página em branco.
  if (songs.length > 0) {
    songs.forEach((song, idx) => {
      html += renderSongSheetHtml(song, idx);
    });
  }

  // RODAPÉ
  html += `
  <div class="footer">
    Documento oficial gerado automaticamente pelo <b>LiLouPro</b> — Gestão de Louvor e Culto.<br>
    Acesse em: <a href="https://liloupro.app" style="color: #2563eb;">https://liloupro.app</a>
  </div>
</div>
</body>
</html>`;

  return html;
}

/**
 * Gera o documento HTML do Caderno do Culto formatado especialmente para o Google Docs (Ctrl+V).
 * Contém o cabeçalho oficial do culto, a equipe escalada, a liturgia/ordem do culto e a lista de repertório,
 * sem os blocos de cifra (que ficam exclusivamente disponíveis no botão Baixar .doc).
 */
export function generateCadernoGoogleDocsHtml(service: any, options: CadernoOptions = {}): string {
  if (!service) return '';

  const churchName = options.churchData?.name || 'Ministério de Louvor';
  const serviceTitle = service.title || 'Culto de Celebração';
  const formattedDate = formatServiceDate(service.date);
  const location = options.churchData?.address || options.churchData?.city || '';

  // Equipe da escala
  const scaleEntries: { role: string; names: string }[] = [];
  if (service.scales && options.members && options.members.length > 0) {
    Object.entries(service.scales).forEach(([role, ids]) => {
      const assignedIds = Array.isArray(ids) ? ids : [ids].filter(Boolean);
      if (assignedIds.length > 0) {
        const names = assignedIds.map(id => {
          const m = options.members?.find((member: any) => member.id === id || member.uid === id);
          return m?.name || 'Membro';
        });
        scaleEntries.push({ role, names: names.join(', ') });
      }
    });
  }

  // Liturgia
  const liturgyItems = Array.isArray(service.liturgy) ? service.liturgy : [];

  // Músicas
  const songs = getCadernoSongs(service, options.allSongs || []);

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Caderno do Culto — ${escapeHtml(serviceTitle)}</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #1e293b;
      line-height: 1.4;
      font-size: 11pt;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0 16pt 0;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 6pt 8pt;
      text-align: left;
    }
    table.data-table th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: bold;
    }
    table.data-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .badge {
      display: inline-block;
      padding: 2pt 6pt;
      font-size: 8.5pt;
      font-weight: bold;
      border-radius: 4pt;
      background-color: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
  </style>
</head>
<body lang="pt-BR">
<div>

  <!-- CABEÇALHO OFICIAL DO CULTO -->
  <div style="text-align: center; margin-bottom: 14pt;">
    <div style="font-size: 13pt; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1px;">
      ${escapeHtml(churchName)}
    </div>
    <div style="font-size: 22pt; font-weight: bold; color: #000000; margin: 4pt 0 4pt 0;">
      <b>Caderno do Culto & Liturgia</b>
    </div>
    <div style="font-size: 16pt; font-weight: bold; color: #2563eb; margin-bottom: 6pt;">
      ${escapeHtml(serviceTitle)}
    </div>
    <div style="font-size: 10pt; color: #64748b; text-align: center;">
      📅 <b>Data:</b> ${escapeHtml(formattedDate)}
      ${location ? `<br>📍 <b>Local:</b> ${escapeHtml(location)}` : ''}
      ${service.theme && service.theme !== 'normal' ? `<br>✨ <b>Tema / Ocasião:</b> ${escapeHtml(service.theme.toUpperCase())}` : ''}
    </div>
  </div>

  <hr style="border: 0; border-top: 1.5pt solid #3b82f6; margin: 12pt 0 16pt 0;">
`;

  // 1. SEÇÃO DE EQUIPE ESCALADA
  if (scaleEntries.length > 0) {
    html += `
  <div style="font-size: 14pt; font-weight: bold; color: #1e293b; margin: 12pt 0 6pt 0;">
    <b>👥 Equipe Escalada (Ministério de Louvor & Culto)</b>
  </div>
  <table class="data-table" border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 16pt;">
    <thead>
      <tr style="background-color: #f1f5f9;">
        <th style="width: 35%; text-align: left; padding: 6pt 8pt; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Função / Ministério</th>
        <th style="text-align: left; padding: 6pt 8pt; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Integrantes Escalados</th>
      </tr>
    </thead>
    <tbody>
      ${scaleEntries.map(entry => `
      <tr>
        <td style="padding: 6pt 8pt; border: 1px solid #cbd5e1;"><b>${escapeHtml(entry.role)}</b></td>
        <td style="padding: 6pt 8pt; border: 1px solid #cbd5e1;">${escapeHtml(entry.names)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
`;
  }

  // 2. SEÇÃO DE LITURGIA (ORDEM DO CULTO)
  if (liturgyItems.length > 0) {
    html += `
  <div style="font-size: 14pt; font-weight: bold; color: #1e293b; margin: 16pt 0 6pt 0;">
    <b>📖 Ordem do Culto (Liturgia Oficial)</b>
  </div>
  <table class="data-table" border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 18pt;">
    <thead>
      <tr style="background-color: #f1f5f9;">
        <th style="width: 5%; text-align: center; padding: 6pt 8pt; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">#</th>
        <th style="width: 25%; text-align: left; padding: 6pt 8pt; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Momento</th>
        <th style="text-align: left; padding: 6pt 8pt; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Detalhes / Título / Passagem Bíblica</th>
        <th style="width: 20%; text-align: left; padding: 6pt 8pt; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Responsável</th>
        <th style="width: 10%; text-align: center; padding: 6pt 8pt; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Duração</th>
      </tr>
    </thead>
    <tbody>
      ${liturgyItems.map((item: any, idx: number) => {
        const typeLabel = LITURGY_TYPE_LABELS[item.type] || item.type || 'Momento';
        const durationText = item.duration ? `${item.duration} min` : '-';
        const cleanTitle = removeBibleVersionTags(item.title || '-');
        const cleanDetails = item.details ? `<br><small style="color: #64748b;">${escapeHtml(removeBibleVersionTags(item.details))}</small>` : '';

        return `
      <tr>
        <td style="text-align: center; font-weight: bold; padding: 6pt 8pt; border: 1px solid #cbd5e1;">${idx + 1}</td>
        <td style="padding: 6pt 8pt; border: 1px solid #cbd5e1;"><span class="badge">${escapeHtml(typeLabel)}</span></td>
        <td style="padding: 6pt 8pt; border: 1px solid #cbd5e1;"><b>${escapeHtml(cleanTitle)}</b>${cleanDetails}</td>
        <td style="padding: 6pt 8pt; border: 1px solid #cbd5e1;">${escapeHtml(item.person || '-')}</td>
        <td style="text-align: center; padding: 6pt 8pt; border: 1px solid #cbd5e1;">${escapeHtml(durationText)}</td>
      </tr>`;
      }).join('')}
    </tbody>
  </table>
`;
  }

  // 3. SEÇÃO DE REPERTÓRIO MUSICAL (LISTA DE MÚSICAS SEM CIFRAS)
  if (songs.length > 0) {
    html += `
  <div style="font-size: 14pt; font-weight: bold; color: #1e293b; margin: 16pt 0 6pt 0;">
    <b>🎵 Músicas do Culto (Repertório)</b>
  </div>
  <table class="data-table" border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 12pt;">
    <thead>
      <tr style="background-color: #f1f5f9;">
        <th style="width: 6%; text-align: center; padding: 6pt 8pt; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">#</th>
        <th style="text-align: left; padding: 6pt 8pt; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Música / Título</th>
        <th style="width: 25%; text-align: left; padding: 6pt 8pt; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Artista / Ministério</th>
        <th style="width: 12%; text-align: center; padding: 6pt 8pt; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Tom</th>
        <th style="width: 12%; text-align: center; padding: 6pt 8pt; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">BPM</th>
      </tr>
    </thead>
    <tbody>
      ${songs.map((song, idx) => `
      <tr>
        <td style="text-align: center; font-weight: bold; padding: 6pt 8pt; border: 1px solid #cbd5e1;">${idx + 1}</td>
        <td style="padding: 6pt 8pt; border: 1px solid #cbd5e1;"><b>${escapeHtml(song.title)}</b></td>
        <td style="padding: 6pt 8pt; border: 1px solid #cbd5e1;">${escapeHtml(song.artist || 'Desconhecido')}</td>
        <td style="text-align: center; font-weight: bold; color: #2563eb; padding: 6pt 8pt; border: 1px solid #cbd5e1;">${escapeHtml(song.key || '-')}</td>
        <td style="text-align: center; padding: 6pt 8pt; border: 1px solid #cbd5e1;">${escapeHtml(song.bpm || '-')}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="font-size: 9.5pt; color: #64748b; font-style: italic; margin-top: 4pt; margin-bottom: 16pt;">
    * O caderno com todas as cifras completas diagramadas em duas colunas está disponível no botão <b>Baixar Caderno (.doc)</b> do LiLouPro.
  </div>
`;
  }

  // RODAPÉ
  html += `
  <div style="margin-top: 20pt; padding-top: 8pt; border-top: 1px solid #cbd5e1; font-size: 8.5pt; color: #94a3b8; text-align: center;">
    Documento oficial gerado automaticamente pelo <b>LiLouPro</b> — Gestão de Louvor e Culto.<br>
    Acesse em: <a href="https://liloupro.app" style="color: #2563eb;">https://liloupro.app</a>
  </div>
</div>
</body>
</html>`;

  return html;
}

/**
 * Copia o Caderno completo do Culto com formatação rica (HTML + texto) para o Clipboard
 * e abre o Google Docs direcionando para a conta especificada.
 */
export async function copyCadernoAndOpenGoogleDocs(service: any, options: CadernoOptions = {}): Promise<boolean> {
  const htmlContent = generateCadernoGoogleDocsHtml(service, options);
  if (!htmlContent) return false;

  // Cria texto simples de fallback
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  const plainText = tempDiv.innerText || tempDiv.textContent || '';

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blobHtml = new Blob([htmlContent], { type: 'text/html' });
      const blobText = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        })
      ]);
    } else {
      await navigator.clipboard.writeText(plainText);
    }
  } catch (err) {
    console.warn('Falha na Clipboard API avançada, tentando fallback text:', err);
    try {
      await navigator.clipboard.writeText(plainText);
    } catch (e2) {
      console.error('Falha ao copiar:', e2);
    }
  }

  // Abre nova aba do Google Docs direcionando para a conta individual do membro logado
  const memberEmail = options.targetEmail || options.user?.email || (typeof options.user === 'string' ? options.user : '') || '';
  const targetEmail = memberEmail && memberEmail.includes('@') ? memberEmail.trim() : '';
  const googleDocsUrl = targetEmail
    ? `https://docs.google.com/document/create?authuser=${encodeURIComponent(targetEmail)}`
    : 'https://docs.new';

  if (typeof window !== 'undefined') {
    window.open(googleDocsUrl, '_blank', 'noopener,noreferrer');
  }

  return true;
}

/**
 * Faz o download do Caderno formatado em arquivo .doc (Word / Google Docs compatível).
 */
export function downloadCadernoWordDoc(service: any, options: CadernoOptions = {}): void {
  const htmlContent = generateCadernoHtml(service, { ...options, forGoogleDocs: false });
  if (!htmlContent) return;

  const serviceTitle = (service.title || 'Culto').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚãõÃÕâêôÂÊÔçÇ\s_-]/g, '').trim();
  const dateStr = service.date ? new Date(service.date).toLocaleDateString('pt-BR').replace(/\//g, '-') : 'data';
  const filename = `Caderno_do_Culto_${serviceTitle}_${dateStr}.doc`;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Sanitiza e formata labels de dinâmica para o PDF, removendo emojis não suportados pelo jsPDF
 * e convertendo para marcadores elegantes e universais em texto legível.
 */
export function formatDynamicLabelForPdf(label: string): string {
  if (!label) return '';
  let clean = label
    .replace(/🌑|🌘|🌗|🌖|🌕|🔥|⚡|🛑|↗|↘|🎤|🥁|🎸|📈/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  clean = clean.replace(/^(N[1-7])\s+([A-Za-zÀ-ÿ])/i, '$1 • $2');
  return clean;
}

/**
 * Renderiza os badges de seção, dinâmica e repetições no PDF exatamente no mesmo padrão
 * visual proporcional da visualização direta pelo app (SongDetailView), respeitando a largura
 * da coluna e impedindo qualquer sobreposição entre colunas.
 */
export function printSectionDynamicsToPdf(
  doc: jsPDF,
  parsed: ParsedSectionAndDynamics,
  x: number,
  y: number,
  colWidth: number,
  isFollowedBySection: boolean = false
): number {
  const badgeHeight = 4.2;
  const radius = 1.0;
  let curX = x;
  const startY = y + 0.6; // Posição superior do retângulo do badge

  // 1. Badges de Seção ([Intro], [Verso], [Refrão], [Ponte], etc.)
  for (const sec of parsed.sections) {
    const title = sec.title.toUpperCase();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const textWidth = doc.getTextWidth(title);
    const padX = 2.2;
    const badgeW = Math.min(textWidth + padX * 2, colWidth - (curX - x));
    if (badgeW <= 4) break;

    // Fundo suave e borda ciano/teal da marca LiLouPro
    doc.setFillColor(238, 246, 248);
    doc.setDrawColor(43, 169, 184);
    doc.setLineWidth(0.25);
    doc.roundedRect(curX, startY, badgeW, badgeHeight, radius, radius, 'FD');

    // Texto nítido em azul petróleo escuro
    doc.setTextColor(14, 116, 144);
    doc.text(title, curX + padX, startY + badgeHeight - 1.1);

    curX += badgeW + 2.0;
  }

  // 2. Badges de Dinâmica (ex: N2 • BEM SUAVE, N6 • FORTE, PAUSA, etc.)
  for (const dyn of parsed.dynamics) {
    if (curX >= x + colWidth - 5) break;

    const cleanLabel = formatDynamicLabelForPdf(dyn.label);
    if (!cleanLabel) continue;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.0);
    const textWidth = doc.getTextWidth(cleanLabel);
    const padX = 2.0;
    const badgeW = Math.min(textWidth + padX * 2, colWidth - (curX - x));
    if (badgeW <= 4) break;

    // Paleta de cores proporcional ao nível de dinâmica
    let fill = [241, 245, 249];
    let stroke = [203, 213, 225];
    let textC = [51, 65, 85];

    const t = dyn.type?.toLowerCase() || '';
    if (t === 'n1' || t === 'n2' || t === 'sutil' || t === 'suave') {
      fill = [236, 253, 245];
      stroke = [110, 231, 183];
      textC = [4, 120, 87];
    } else if (t === 'n3' || t === 'n4' || t === 'moderado') {
      fill = [240, 249, 255];
      stroke = [125, 211, 252];
      textC = [3, 105, 161];
    } else if (t === 'n5' || t === 'n6' || t === 'forte' || t === 'meio forte') {
      fill = [255, 247, 237];
      stroke = [253, 186, 116];
      textC = [194, 65, 12];
    } else if (t === 'n7' || t === 'clímax' || t === 'climax') {
      fill = [255, 241, 242];
      stroke = [253, 164, 175];
      textC = [190, 18, 60];
    } else if (t === 'pausa' || t === 'stop') {
      fill = [254, 242, 242];
      stroke = [252, 165, 165];
      textC = [185, 28, 28];
    }

    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
    doc.setLineWidth(0.25);
    doc.roundedRect(curX, startY, badgeW, badgeHeight, radius, radius, 'FD');

    doc.setTextColor(textC[0], textC[1], textC[2]);
    doc.text(cleanLabel, curX + padX, startY + badgeHeight - 1.1);

    curX += badgeW + 2.0;
  }

  // 3. Badges de Repetição (ex: 2X, 4X, BIS)
  for (const rep of parsed.repeats) {
    if (curX >= x + colWidth - 5) break;

    const repLabel = rep.toUpperCase();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.0);
    const textWidth = doc.getTextWidth(repLabel);
    const padX = 1.8;
    const badgeW = Math.min(textWidth + padX * 2, colWidth - (curX - x));
    if (badgeW <= 4) break;

    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(252, 211, 77);
    doc.setLineWidth(0.25);
    doc.roundedRect(curX, startY, badgeW, badgeHeight, radius, radius, 'FD');

    doc.setTextColor(180, 83, 9);
    doc.text(repLabel, curX + padX, startY + badgeHeight - 1.1);

    curX += badgeW + 2.0;
  }

  // Se a próxima linha for outro badge de seção/dinâmica consecutivo, avança 5.8mm (gap de 1.6mm entre badges).
  // Se a próxima linha for texto (cifras ou letra), avança 9.6mm para que a linha de base do texto
  // mantenha uma margem de respiro limpa de ~2.3mm abaixo da borda inferior do badge, eliminando colisões.
  return isFollowedBySection ? 5.8 : 9.6;
}

/**
 * Renderiza uma linha individual de cifra no PDF em fonte Courier monoespaçada,
 * exatamente no padrão visual da aba Cifra do aplicativo, com corte seguro caso exceda
 * a largura da coluna.
 */
export function printCifraLineToPdf(
  doc: jsPDF,
  rawLine: string,
  x: number,
  y: number,
  colWidth: number,
  isChord: boolean
): void {
  const cleanLine = (rawLine || '').replace(/\r/g, '').replace(/\t/g, '    ');
  const trimmed = cleanLine.trim();
  if (!trimmed) return;

  doc.setFontSize(9);
  if (isChord) {
    // Courier Bold + cor da marca (rgb 43, 169, 184)
    doc.setFont('courier', 'bold');
    doc.setTextColor(43, 169, 184);
  } else {
    // Letra em cinza escuro nítido
    doc.setFont('courier', 'normal');
    doc.setTextColor(30, 41, 59);
  }

  const safeLine = cleanLine.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

  let displayLine = safeLine;
  if (doc.getTextWidth(displayLine) > colWidth - 1) {
    let temp = displayLine;
    while (temp.length > 0 && doc.getTextWidth(temp) > colWidth - 2) {
      temp = temp.slice(0, -1);
    }
    displayLine = temp;
  }

  doc.text(displayLine, x, y);
}

export type SongItem = 
  | { type: 'section'; parsed: ParsedSectionAndDynamics; height: number; raw: string }
  | { type: 'pair'; chordLine: string; lyricLine: string; height: number }
  | { type: 'single'; line: string; isChord: boolean; height: number }
  | { type: 'spacer'; height: number };

export interface SongBlock {
  items: SongItem[];
  height: number;
}

/**
 * Agrupa as linhas da música em blocos lógicos estruturados (estrofes/seções),
 * garantindo que pares de acordes e letras permaneçam atômicos e que seções e dinâmicas
 * sejam identificadas e tratadas como badges de cabeçalho.
 */
export function buildSongBlocks(rawContent: string): SongBlock[] {
  const rawLines = (rawContent || '').split(/\r?\n/);
  while (rawLines.length > 0 && !rawLines[rawLines.length - 1].trim()) {
    rawLines.pop();
  }

  const items: SongItem[] = [];
  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (items.length > 0 && items[items.length - 1].type !== 'spacer') {
        items.push({ type: 'spacer', height: 2.5 });
      }
      i++;
      continue;
    }

    const norm = normalizeSpacedTags(line);
    const parsed = parseLineSectionAndDynamics(norm);

    if (parsed.isMatch) {
      const hasNext = i + 1 < rawLines.length;
      const nextLine = hasNext ? rawLines[i + 1] : '';
      const nextNorm = hasNext ? normalizeSpacedTags(nextLine) : '';
      const nextParsed = hasNext ? parseLineSectionAndDynamics(nextNorm) : { isMatch: false };
      const isNextSection = nextParsed.isMatch;
      const height = isNextSection ? 5.8 : 9.6;

      items.push({ type: 'section', parsed, height, raw: line });
      i++;
      continue;
    }

    const isCurrentChord = isChordLine(line);
    const hasNext = i + 1 < rawLines.length;
    const nextLine = hasNext ? rawLines[i + 1] : '';
    const nextNorm = hasNext ? normalizeSpacedTags(nextLine) : '';
    const nextParsed = hasNext ? parseLineSectionAndDynamics(nextNorm) : { isMatch: false };
    const isNextLyric = hasNext && !isChordLine(nextLine) && !nextParsed.isMatch && nextLine.trim() !== '';

    if (isCurrentChord && isNextLyric) {
      items.push({ type: 'pair', chordLine: line, lyricLine: nextLine, height: 8.4 });
      i += 2;
    } else {
      items.push({ type: 'single', line, isChord: isCurrentChord, height: 4.2 });
      i++;
    }
  }

  // Agrupa os itens em blocos separados por seção ou espaçador
  const blocks: SongBlock[] = [];
  let currentItems: SongItem[] = [];
  let currentHeight = 0;

  for (const item of items) {
    if (item.type === 'section') {
      // Se currentItems já contém acordes ou letras, fecha o bloco anterior e inicia novo
      const hasMusicContent = currentItems.some(it => it.type === 'pair' || it.type === 'single');
      if (hasMusicContent) {
        blocks.push({ items: currentItems, height: currentHeight });
        currentItems = [];
        currentHeight = 0;
      }
      currentItems.push(item);
      currentHeight += item.height;
    } else if (item.type === 'spacer') {
      if (currentItems.length > 0) {
        blocks.push({ items: currentItems, height: currentHeight });
        currentItems = [];
        currentHeight = 0;
      }
    } else {
      // Se o bloco já acumulou 4 ou mais itens de música (pares de acorde/letra ou linhas avulsas),
      // fecha o bloco atual para evitar blocos monolíticos e garantir que mesmo estrofes longas
      // ou páginas de continuação sejam distribuídas perfeitamente em 2 colunas
      const musicCount = currentItems.filter(it => it.type === 'pair' || it.type === 'single').length;
      if (musicCount >= 4) {
        blocks.push({ items: currentItems, height: currentHeight });
        currentItems = [];
        currentHeight = 0;
      }
      currentItems.push(item);
      currentHeight += item.height;
    }
  }

  if (currentItems.length > 0) {
    blocks.push({ items: currentItems, height: currentHeight });
  }

  return blocks;
}

/**
 * Desenha uma lista de blocos em uma coluna específica do PDF a partir de (x, y).
 */
export function renderBlocksToColumn(
  doc: jsPDF,
  blocks: SongBlock[],
  x: number,
  startY: number,
  colWidth: number
): number {
  let y = startY;
  for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
    const block = blocks[bIdx];
    if (bIdx > 0) {
      y += 2.0; // Espaço sutil entre blocos
    }
    for (let itemIdx = 0; itemIdx < block.items.length; itemIdx++) {
      const item = block.items[itemIdx];
      const nextItem = block.items[itemIdx + 1];

      if (item.type === 'section') {
        const isFollowedBySection = nextItem && nextItem.type === 'section';
        const h = printSectionDynamicsToPdf(doc, item.parsed, x, y, colWidth, isFollowedBySection);
        y += h;
      } else if (item.type === 'pair') {
        printCifraLineToPdf(doc, item.chordLine, x, y, colWidth, true);
        printCifraLineToPdf(doc, item.lyricLine, x, y + 4.2, colWidth, false);
        y += 8.4;
      } else if (item.type === 'single') {
        printCifraLineToPdf(doc, item.line, x, y, colWidth, item.isChord);
        y += 4.2;
      } else if (item.type === 'spacer') {
        y += 2.5;
      }
    }
  }
  return y;
}

export interface RenderSongPdfOptions {
  songIdx?: number;
  serviceTitle?: string;
  serviceDate?: string;
  song: {
    title: string;
    artist?: string;
    key?: string;
    bpm?: string | number;
    timeSignature?: string;
    capo?: any;
    chords?: string;
    lyrics?: string;
  };
  contentToRender: string;
  isSingleSong?: boolean;
}

/**
 * Renderiza uma música completa no PDF com distribuição proporcional das seções e dinâmicas
 * em duas colunas, exatamente como na visualização direta do aplicativo:
 * - Seções e dinâmicas são convertidas em badges elegantes e compactos.
 * - Os blocos (estrofes/refrões) são distribuídos de forma equilibrada entre as Colunas 1 e 2.
 * - Pares de acorde/letra nunca são quebrados através de colunas ou páginas.
 * - Cada coluna respeita estritamente sua largura máxima, evitando qualquer invasão da outra coluna.
 */
export function renderSongToPdfFlow(doc: jsPDF, opt: RenderSongPdfOptions): void {
  const pageWidth = 210;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 12;
  const colWidth = 88;
  const colGap = 10;
  const col1X = margin; // 12mm
  const col2X = margin + colWidth + colGap; // 110mm
  const dividerX = 105;
  const bottomMargin = pageHeight - 16; // 281mm

  const songStartPage = (doc as any).internal.getNumberOfPages();
  let currentSongPage = songStartPage;

  // --- CABEÇALHO DA MÚSICA NO MESMO ESTILO DO APP ---
  if (opt.serviceTitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${opt.serviceTitle} • LiLouPro`, margin, 13);
    if (opt.serviceDate) {
      doc.text(opt.serviceDate, pageWidth - margin, 13, { align: 'right' });
    }
  }

  const titlePrefix = typeof opt.songIdx === 'number' && opt.songIdx >= 0 ? `${opt.songIdx + 1}. ` : '';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text(`${titlePrefix}${opt.song.title || 'Música Sem Título'}`, margin, 22);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(`Artista: ${opt.song.artist || 'Desconhecido'}`, margin, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  const keyPart = `Tom: ${opt.song.key || '-'}`;
  const bpmPart = opt.song.bpm ? `   |   BPM: ${opt.song.bpm}` : '';
  const timePart = opt.song.timeSignature ? `   |   Compasso: ${opt.song.timeSignature}` : '';
  doc.text(`${keyPart}${bpmPart}${timePart}`, margin, 33.5);

  // Linha divisória do cabeçalho
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.35);
  doc.line(margin, 36.5, pageWidth - margin, 36.5);

  const rawContent = (opt.contentToRender || '').trim();
  if (!rawContent) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('(Cifra/Letra não cadastrada no repertório)', margin, 48);
    return;
  }

  const blocks = buildSongBlocks(rawContent);
  if (blocks.length === 0) return;

  const pagesWithCol2 = new Set<number>();
  let curBlockIdx = 0;
  let isFirstPageOfSong = true;

  while (curBlockIdx < blocks.length) {
    const pageStartY = isFirstPageOfSong ? 43 : 22;
    const availColHeight = bottomMargin - pageStartY;
    const remainingBlocks = blocks.slice(curBlockIdx);

    // Calcula altura total dos blocos restantes com espaçamento entre eles
    let remTotalHeight = 0;
    for (let b = 0; b < remainingBlocks.length; b++) {
      remTotalHeight += remainingBlocks[b].height + (b > 0 ? 2.0 : 0);
    }

    if (remTotalHeight <= 2 * availColHeight) {
      // TODOS os blocos restantes cabem NESTA página!
      // Encontra a divisão balanceada e proporcional entre Coluna 1 e Coluna 2
      let bestSplit = remainingBlocks.length;
      let minDiff = Infinity;
      let curH1 = 0;

      // Se houver 2 ou mais blocos, prioriza OBRIGATORIAMENTE a distribuição em 2 colunas,
      // evitando que a Coluna 2 fique vazia e garantindo equilíbrio visual
      const canSplitTwoCols = remainingBlocks.length >= 2;
      const maxSplitIndex = canSplitTwoCols ? remainingBlocks.length - 1 : remainingBlocks.length;
      let foundValidTwoColSplit = false;

      for (let i = 0; i < maxSplitIndex; i++) {
        curH1 += remainingBlocks[i].height + (i > 0 ? 2.0 : 0);
        if (curH1 > availColHeight) break;

        let curH2 = 0;
        let validH2 = true;
        for (let j = i + 1; j < remainingBlocks.length; j++) {
          curH2 += remainingBlocks[j].height + (j > i + 1 ? 2.0 : 0);
          if (curH2 > availColHeight) {
            validH2 = false;
            break;
          }
        }

        if (validH2) {
          const diff = Math.abs(curH1 - curH2);
          if (diff < minDiff) {
            minDiff = diff;
            bestSplit = i + 1;
            foundValidTwoColSplit = true;
          }
        }
      }

      // Se havia múltiplos blocos mas nenhuma combinação coube estritamente, usa ponto médio
      if (canSplitTwoCols && !foundValidTwoColSplit) {
        bestSplit = Math.max(1, Math.floor(remainingBlocks.length / 2));
      }

      const col1Blocks = remainingBlocks.slice(0, bestSplit);
      const col2Blocks = remainingBlocks.slice(bestSplit);

      renderBlocksToColumn(doc, col1Blocks, col1X, pageStartY, colWidth);
      if (col2Blocks.length > 0) {
        renderBlocksToColumn(doc, col2Blocks, col2X, pageStartY, colWidth);
        pagesWithCol2.add(currentSongPage);
      }

      curBlockIdx += remainingBlocks.length;
      break;
    } else {
      // Os blocos restantes excedem a página atual.
      // Preenche a Coluna 1 até o limite da página, e a Coluna 2 até o limite,
      // avançando para uma nova página para o restante dos blocos.
      let col1H = 0;
      let col1EndIdx = 0;
      while (
        curBlockIdx + col1EndIdx < blocks.length &&
        col1H + blocks[curBlockIdx + col1EndIdx].height + (col1EndIdx > 0 ? 2.0 : 0) <= availColHeight
      ) {
        col1H += blocks[curBlockIdx + col1EndIdx].height + (col1EndIdx > 0 ? 2.0 : 0);
        col1EndIdx++;
      }

      if (col1EndIdx === 0) {
        col1EndIdx = 1;
      }

      const col1Blocks = blocks.slice(curBlockIdx, curBlockIdx + col1EndIdx);
      renderBlocksToColumn(doc, col1Blocks, col1X, pageStartY, colWidth);
      curBlockIdx += col1EndIdx;

      let col2H = 0;
      let col2EndIdx = 0;
      while (
        curBlockIdx + col2EndIdx < blocks.length &&
        col2H + blocks[curBlockIdx + col2EndIdx].height + (col2EndIdx > 0 ? 2.0 : 0) <= availColHeight
      ) {
        col2H += blocks[curBlockIdx + col2EndIdx].height + (col2EndIdx > 0 ? 2.0 : 0);
        col2EndIdx++;
      }

      if (col2EndIdx > 0) {
        const col2Blocks = blocks.slice(curBlockIdx, curBlockIdx + col2EndIdx);
        renderBlocksToColumn(doc, col2Blocks, col2X, pageStartY, colWidth);
        pagesWithCol2.add(currentSongPage);
        curBlockIdx += col2EndIdx;
      }

      if (curBlockIdx < blocks.length) {
        doc.addPage();
        currentSongPage++;
        isFirstPageOfSong = false;

        // Cabeçalho de continuação
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`${titlePrefix}${opt.song.title} (Continuação)`, margin, 13);
        doc.setDrawColor(220, 225, 230);
        doc.setLineWidth(0.25);
        doc.line(margin, 15.5, pageWidth - margin, 15.5);
      }
    }
  }

  // Desenha as divisórias centrais nas páginas que utilizaram Coluna 2
  for (let p = songStartPage; p <= currentSongPage; p++) {
    if (pagesWithCol2.has(p)) {
      doc.setPage(p);
      const divStartY = p === songStartPage ? 40 : 18;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.line(dividerX, divStartY, dividerX, bottomMargin);
    }
  }
}

/**
 * Baixa todas as cifras do culto em formato PDF, seguindo fielmente o padrão
 * visual e de diagramação da aba de Cifras do aplicativo:
 * - Diagramação proporcional e equilibrada em duas colunas.
 * - Badges estilizados de seção e dinâmica ([Intro], [Refrão], N2 • Bem Suave, etc.).
 * - Fonte Courier monoespaçada com acordes em negrito na cor da marca LiLouPro (#2ba9b4).
 * - Cabeçalho elegante e linha divisória central.
 * - Cada música inicia em sua própria página.
 */
export function downloadCifrasCultoPDF(service: any, options: CadernoOptions = {}): void {
  if (!service) return;

  const songs = getCadernoSongs(service, options.allSongs || []);
  if (songs.length === 0) {
    alert('Nenhuma música com cifra encontrada na liturgia deste culto.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 12;
  const serviceTitle = service.title || 'Culto de Celebração';
  const serviceDate = formatServiceDate(service.date) || new Date().toLocaleDateString('pt-BR');

  songs.forEach((song, songIdx) => {
    if (songIdx > 0) {
      doc.addPage();
    }

    const rawChords = (song.chords || '').trim();
    renderSongToPdfFlow(doc, {
      songIdx,
      serviceTitle,
      serviceDate,
      song,
      contentToRender: rawChords
    });
  });

  // Numeração de páginas no rodapé de todas as páginas geradas
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`LiLouPro • Cifras do Culto`, margin, 292);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, 292, { align: 'right' });
  }

  const cleanTitle = (service.title || 'culto')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_');
  const dateStr = service.date ? new Date(service.date).toLocaleDateString('pt-BR').replace(/\//g, '-') : 'data';
  const filename = `Cifras_do_Culto_${cleanTitle}_${dateStr}.pdf`;
  doc.save(filename);
}


