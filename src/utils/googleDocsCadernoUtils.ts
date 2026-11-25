import { jsPDF } from 'jspdf';
import { getServiceSongIds } from './servicePlaylistUtils';
import { isChordLine } from '../services/chordService';
import { findLocalPopularSong } from '../songsDatabase';
import { parseLineSectionAndDynamics, ParsedSectionAndDynamics, normalizeSpacedTags, getDynamicExplanationDetails } from '../components/songsShared';
import { isGoogleEmail } from './googleCalendarUtils';
export { isGoogleEmail };

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
 * Remove marcações literais de negrito (<b>, </b>, <strong>, </strong> e **texto**)
 * preservando apenas o texto puro sem deslocar colunas.
 */
export function stripInlineBoldTags(text: string): string {
  if (!text) return '';
  return text
    .replace(/<\s*\/?\s*(b|strong)\b[^>]*>/gi, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1');
}

interface BoldTextSegment {
  text: string;
  bold: boolean;
}

/**
 * Converte marcações de negrito (<b>...</b>, <strong>...</strong>, **...**)
 * em segmentos limpos { text, bold }, sem caracteres de tag no fluxo final.
 */
export function parseBoldSegments(line: string): BoldTextSegment[] {
  if (!line) return [];

  const normalized = line.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
  const segments: BoldTextSegment[] = [];
  const tagRegex = /<\s*(\/?)\s*(b|strong)\b[^>]*>/gi;

  let isBold = false;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  const pushSegment = (text: string, bold: boolean) => {
    if (!text) return;
    const prev = segments[segments.length - 1];
    if (prev && prev.bold === bold) {
      prev.text += text;
    } else {
      segments.push({ text, bold });
    }
  };

  while ((match = tagRegex.exec(normalized)) !== null) {
    if (match.index > lastIdx) {
      pushSegment(normalized.slice(lastIdx, match.index), isBold);
    }
    const isClosing = match[1] === '/';
    isBold = !isClosing;
    lastIdx = tagRegex.lastIndex;
  }

  if (lastIdx < normalized.length) {
    pushSegment(normalized.slice(lastIdx), isBold);
  }

  return segments;
}

/**
 * Converte marcações de negrito (e itálico/sublinhado opcionais) em HTML real seguro com escapeHtml,
 * preservando espaços e tabulações em linhas monoespaçadas sem ocupar colunas extras.
 */
function formatInlineBoldHtml(line: string, preserveMonospaceSpaces: boolean = false): string {
  if (!line) return '';

  const normalized = line.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
  const tagRegex = /<\s*(\/?)\s*(b|strong|i|em|u)\b[^>]*>/gi;

  let isBold = false;
  let isItalic = false;
  let isUnderline = false;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let out = '';

  const emitChunk = (text: string) => {
    if (!text) return;
    let htmlText = escapeHtml(text);
    if (preserveMonospaceSpaces) {
      htmlText = htmlText
        .replace(/\t/g, '    ')
        .replace(/^ +/, (m) => '&nbsp;'.repeat(m.length))
        .replace(/ {2,}/g, (m) => '&nbsp;'.repeat(m.length - 1) + ' ');
    }
    if (isUnderline) htmlText = `<u>${htmlText}</u>`;
    if (isItalic) htmlText = `<em>${htmlText}</em>`;
    if (isBold) htmlText = `<strong style="font-weight: bold;">${htmlText}</strong>`;
    out += htmlText;
  };

  while ((match = tagRegex.exec(normalized)) !== null) {
    if (match.index > lastIdx) {
      emitChunk(normalized.slice(lastIdx, match.index));
    }
    const isClosing = match[1] === '/';
    const tag = match[2].toLowerCase();
    if (tag === 'b' || tag === 'strong') isBold = !isClosing;
    else if (tag === 'i' || tag === 'em') isItalic = !isClosing;
    else if (tag === 'u') isUnderline = !isClosing;
    lastIdx = tagRegex.lastIndex;
  }

  if (lastIdx < normalized.length) {
    emitChunk(normalized.slice(lastIdx));
  }

  return out;
}

/**
 * Remove tags inline (<b>, <strong>, <i>, <u> e **...**) mantendo apenas o texto visível
 * para medição exata de largura/quebra de linha e detecção de seções/acordes.
 */
function stripInlineFormattingForMeasure(text: string): string {
  if (!text) return '';
  return text
    .replace(/<\s*\/?\s*(b|strong|i|em|u)\b[^>]*>/gi, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1');
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

interface HtmlDensityProfile {
  name: 'normal' | 'compact' | 'tight';
  fontPt: number;
  lineHeightRatio: number;
  lineHeightPt: number;
  spacerFontPt: number;
  spacerHeightPt: number;
  sectionHeightPt: number;
  topSectionHeightPt: number;
  consecutiveSectionHeightPt: number;
  badgeFontPt: number;
  dynFontPt: number;
  badgePad: string;
  dynPad: string;
  sectionTopPt: number;
  sectionBottomPt: number;
  sectionLineH: number;
  colTopPadPt: number;
  maxCharsPerLine: number;
  collapseSectionSpacer: boolean;
}

const HTML_DENSITY_NORMAL: HtmlDensityProfile = {
  name: 'normal',
  fontPt: 8.5,
  lineHeightRatio: 1.12,
  lineHeightPt: 9.52,
  spacerFontPt: 7.5,
  spacerHeightPt: 8.4,
  sectionHeightPt: 21,
  topSectionHeightPt: 17,
  consecutiveSectionHeightPt: 18,
  badgeFontPt: 7.5,
  dynFontPt: 7.0,
  badgePad: '1.5pt 5pt',
  dynPad: '1.5pt 4.5pt',
  sectionTopPt: 4.5,
  sectionBottomPt: 2,
  sectionLineH: 1.18,
  colTopPadPt: 6,
  maxCharsPerLine: 42,
  collapseSectionSpacer: false
};

const HTML_DENSITY_COMPACT: HtmlDensityProfile = {
  name: 'compact',
  fontPt: 7.5,
  lineHeightRatio: 1.08,
  lineHeightPt: 8.1,
  spacerFontPt: 6.5,
  spacerHeightPt: 7.0,
  sectionHeightPt: 17.5,
  topSectionHeightPt: 14.5,
  consecutiveSectionHeightPt: 15,
  badgeFontPt: 7.0,
  dynFontPt: 6.5,
  badgePad: '1.2pt 4.5pt',
  dynPad: '1.2pt 3.5pt',
  sectionTopPt: 3,
  sectionBottomPt: 1.5,
  sectionLineH: 1.1,
  colTopPadPt: 4,
  maxCharsPerLine: 48,
  collapseSectionSpacer: true
};

const HTML_DENSITY_TIGHT: HtmlDensityProfile = {
  name: 'tight',
  fontPt: 7.0,
  lineHeightRatio: 1.05,
  lineHeightPt: 7.35,
  spacerFontPt: 5.5,
  spacerHeightPt: 5.8,
  sectionHeightPt: 15.5,
  topSectionHeightPt: 13,
  consecutiveSectionHeightPt: 13.5,
  badgeFontPt: 6.6,
  dynFontPt: 6.2,
  badgePad: '1pt 4pt',
  dynPad: '1pt 3pt',
  sectionTopPt: 2,
  sectionBottomPt: 1,
  sectionLineH: 1.05,
  colTopPadPt: 3,
  maxCharsPerLine: 52,
  collapseSectionSpacer: true
};

function resolveHtmlDensity(compactOrProfile: boolean | HtmlDensityProfile): HtmlDensityProfile {
  if (typeof compactOrProfile === 'boolean') {
    return compactOrProfile ? HTML_DENSITY_COMPACT : HTML_DENSITY_NORMAL;
  }
  return compactOrProfile;
}

/**
 * Formata os badges de seção, dinâmica e repetições em HTML compatível com Word e Google Docs,
 * replicando fielmente as cores, bordas, badges e espaçamentos do PDF ("Cifras do Culto")
 * e da visualização direta pelo app (SongDetailView).
 */
export function formatSectionDynamicsHtml(
  parsed: ParsedSectionAndDynamics,
  isTop: boolean = false,
  compactOrProfile: boolean | HtmlDensityProfile = false
): string {
  if (!parsed || !parsed.isMatch) return '';

  const density = resolveHtmlDensity(compactOrProfile);
  const isCompact = density.name !== 'normal';
  const badgesHtml: string[] = [];
  const badgeFontPt = `${density.badgeFontPt}pt`;
  const dynFontPt = `${density.dynFontPt}pt`;
  const badgePad = density.badgePad;
  const dynPad = density.dynPad;

  // 1. Badges de Seção ([Intro], [Verso], [Refrão], [Ponte], etc.) - ciano/teal LiLouPro
  for (const sec of parsed.sections) {
    const title = sec.title.toUpperCase();
    badgesHtml.push(
      `<span style="display: inline-block; padding: ${badgePad}; margin-right: 4pt; margin-bottom: ${isCompact ? '1pt' : '2pt'}; font-family: Arial, Helvetica, sans-serif; font-size: ${badgeFontPt}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; background-color: #eef6f8; color: #0e7490; border: 1pt solid #2ba9b8; border-radius: 4pt; vertical-align: middle; white-space: nowrap;">${escapeHtml(title)}</span>`
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
      `<span style="display: inline-block; padding: ${dynPad}; margin-right: 4pt; margin-bottom: ${isCompact ? '1pt' : '2pt'}; font-family: Arial, Helvetica, sans-serif; font-size: ${dynFontPt}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; background-color: ${bg}; color: ${textC}; border: 1pt solid ${border}; border-radius: 4pt; vertical-align: middle; white-space: nowrap;">${escapeHtml(cleanLabel)}</span>`
    );
  }

  // 3. Badges de Repetição (ex: 2X, 4X, BIS)
  for (const rep of parsed.repeats) {
    const repLabel = rep.toUpperCase();
    badgesHtml.push(
      `<span style="display: inline-block; padding: ${dynPad}; margin-right: 4pt; margin-bottom: ${isCompact ? '1pt' : '2pt'}; font-family: Arial, Helvetica, sans-serif; font-size: ${dynFontPt}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; background-color: #fef3c7; color: #b45309; border: 1pt solid #fcd34d; border-radius: 4pt; vertical-align: middle; white-space: nowrap;">🔁 ${escapeHtml(repLabel)}</span>`
    );
  }

  // 4. Texto remanescente após tags
  if (parsed.remainingText) {
    badgesHtml.push(
      `<span style="font-family: Arial, Helvetica, sans-serif; font-size: ${badgeFontPt}; font-style: italic; font-weight: bold; color: #64748b; margin-left: 4pt; vertical-align: middle;">${formatInlineBoldHtml(parsed.remainingText, false)}</span>`
    );
  }

  const topMargin = isTop ? '0pt' : `${density.sectionTopPt}pt`;
  const bottomMargin = `${density.sectionBottomPt}pt`;
  const sectionLineHeight = `${density.sectionLineH}`;
  return `<p class="cifra-section MsoNormal" style="margin: 0pt; margin-top: ${topMargin}; margin-bottom: ${bottomMargin}; mso-margin-top-alt: ${topMargin}; mso-margin-bottom-alt: ${bottomMargin}; line-height: ${sectionLineHeight}; page-break-after: avoid; mso-pagination: lines-together;">${badgesHtml.join('')}</p>`;
}

function renderHtmlSingleCifraLine(
  cleanLine: string,
  isChord: boolean,
  density: HtmlDensityProfile
): string {
  const fontPt = `${density.fontPt}pt`;
  const lineH = `${density.lineHeightRatio}`;

  if (isChord) {
    const cleanChordLine = stripInlineFormattingForMeasure(cleanLine).replace(/\t/g, '    ');
    const tokens = cleanChordLine.match(/(\S+|\s+)/g) || [cleanChordLine];
    const formattedTokens = tokens.map((token, tokenIdx) => {
      if (/^\s+$/.test(token)) {
        if (tokenIdx === 0) {
          return '&nbsp;'.repeat(token.length);
        }
        return token.length === 1 ? ' ' : '&nbsp;'.repeat(token.length - 1) + ' ';
      }
      return `<b><span style="color: #2ba9b8; font-weight: bold;">${escapeHtml(token)}</span></b>`;
    }).join('');

    return `<p class="cifra-line MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 0pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 0pt; line-height: ${lineH}; mso-line-height-rule: exactly; font-family: 'Courier New', Consolas, Courier, monospace; font-size: ${fontPt}; font-weight: bold; color: #2ba9b8; white-space: pre-wrap; word-wrap: break-word; word-break: break-word;"><b>${formattedTokens}</b></p>`;
  }

  const formattedLyric = formatInlineBoldHtml(cleanLine, true);
  return `<p class="cifra-line MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 0pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 0pt; line-height: ${lineH}; mso-line-height-rule: exactly; font-family: 'Courier New', Consolas, Courier, monospace; font-size: ${fontPt}; font-weight: normal; color: #3c3c3c; white-space: pre-wrap; word-wrap: break-word; word-break: break-word;">${formattedLyric}</p>`;
}

/**
 * Formata um conjunto de linhas de cifra para uma coluna usando parágrafos (<p>)
 * com margens estritamente zeradas (margin: 0pt) e altura de linha compacta.
 */
function formatCifraColumnLines(lines: string[], compactOrProfile: boolean | HtmlDensityProfile = false): string {
  if (!lines || lines.length === 0) return '';

  const density = resolveHtmlDensity(compactOrProfile);
  const rendered: string[] = [];
  let lastWasEmpty = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const cleanLine = rawLine ? rawLine.replace(/\r/g, '') : '';
    const trimmed = stripInlineFormattingForMeasure(cleanLine).trim();

    if (!trimmed) {
      if (lastWasEmpty) continue;
      if (density.collapseSectionSpacer && i + 1 < lines.length) {
        const nextNorm = normalizeSpacedTags(stripInlineFormattingForMeasure(lines[i + 1] || ''));
        if (parseLineSectionAndDynamics(nextNorm).isMatch) continue;
      }
      lastWasEmpty = true;
      rendered.push(
        `<p class="cifra-line MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 0pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 0pt; line-height: ${density.lineHeightRatio}; mso-line-height-rule: exactly; font-family: 'Courier New', Consolas, Courier, monospace; font-size: ${density.spacerFontPt}pt;">&nbsp;</p>`
      );
      continue;
    }

    lastWasEmpty = false;

    const norm = normalizeSpacedTags(stripInlineFormattingForMeasure(cleanLine));
    const parsed = parseLineSectionAndDynamics(norm);

    if (parsed.isMatch) {
      const isTop = i === 0 || rendered.length === 0;
      rendered.push(formatSectionDynamicsHtml(parsed, isTop, density));
      continue;
    }

    const isChord = isChordLine(stripInlineFormattingForMeasure(cleanLine));
    rendered.push(renderHtmlSingleCifraLine(cleanLine, isChord, density));
  }

  return rendered.join('\n');
}

type HtmlSongItem =
  | { type: 'section'; parsed: ParsedSectionAndDynamics; heightPt: number; isFirstInSong: boolean }
  | { type: 'pair'; chordLine: string; lyricLine: string; heightPt: number; lineUnits: number }
  | { type: 'single'; line: string; isChord: boolean; heightPt: number; lineUnits: number }
  | { type: 'spacer'; heightPt: number };

interface HtmlSongBlock {
  items: HtmlSongItem[];
  heightPt: number;
  lineUnits: number;
}

interface PackedHtmlPage {
  col1: HtmlSongBlock[];
  col2: HtmlSongBlock[];
  h1: number;
  h2: number;
  lines1: number;
  lines2: number;
}

function estimateWrappedLineCount(line: string, maxCharsPerLine: number): number {
  const visible = stripInlineFormattingForMeasure(line || '').replace(/\t/g, '    ');
  const trimmedRightLen = visible.replace(/\s+$/, '').length;
  if (trimmedRightLen <= maxCharsPerLine) return 1;
  return Math.max(1, Math.ceil(trimmedRightLen / maxCharsPerLine));
}

function measureHtmlCifraMetrics(rawCifra: string): { maxLineChars: number; totalNonEmptyLines: number } {
  const rawLines = (rawCifra || '').split(/\r?\n/);
  let maxLineChars = 0;
  let totalNonEmptyLines = 0;

  for (const rawLine of rawLines) {
    const visible = stripInlineFormattingForMeasure(rawLine || '').replace(/\r/g, '').replace(/\t/g, '    ');
    const trimmed = visible.trim();
    if (!trimmed) continue;
    totalNonEmptyLines++;

    const norm = normalizeSpacedTags(visible);
    if (parseLineSectionAndDynamics(norm).isMatch) continue;

    const lineLen = visible.replace(/\s+$/, '').length;
    if (lineLen > maxLineChars) {
      maxLineChars = lineLen;
    }
  }

  return { maxLineChars, totalNonEmptyLines };
}

function buildHtmlSongBlocks(rawCifra: string, density: HtmlDensityProfile): HtmlSongBlock[] {
  const rawLines = (rawCifra || '').split(/\r?\n/);
  while (rawLines.length > 0 && !stripInlineFormattingForMeasure(rawLines[rawLines.length - 1] || '').trim()) {
    rawLines.pop();
  }

  const items: HtmlSongItem[] = [];
  let i = 0;
  while (i < rawLines.length) {
    const cleanLine = (rawLines[i] || '').replace(/\r/g, '');
    const visibleLine = stripInlineFormattingForMeasure(cleanLine);
    const trimmed = visibleLine.trim();

    if (!trimmed) {
      if (items.length > 0 && items[items.length - 1].type !== 'spacer') {
        items.push({ type: 'spacer', heightPt: density.spacerHeightPt });
      }
      i++;
      continue;
    }

    const norm = normalizeSpacedTags(visibleLine);
    const parsed = parseLineSectionAndDynamics(norm);

    if (parsed.isMatch) {
      if (density.collapseSectionSpacer && items.length > 0 && items[items.length - 1].type === 'spacer') {
        items.pop();
      }
      const hasNext = i + 1 < rawLines.length;
      const nextVisible = hasNext ? stripInlineFormattingForMeasure(rawLines[i + 1] || '') : '';
      const nextNorm = hasNext ? normalizeSpacedTags(nextVisible) : '';
      const nextParsed = hasNext ? parseLineSectionAndDynamics(nextNorm) : { isMatch: false };
      const isNextSection = nextParsed.isMatch;
      const isTop = items.length === 0;
      const heightPt = isTop
        ? density.topSectionHeightPt
        : isNextSection
          ? density.consecutiveSectionHeightPt
          : density.sectionHeightPt;

      items.push({ type: 'section', parsed, heightPt, isFirstInSong: isTop });
      i++;
      continue;
    }

    const isCurrentChord = isChordLine(visibleLine);
    const hasNext = i + 1 < rawLines.length;
    const nextRaw = hasNext ? (rawLines[i + 1] || '').replace(/\r/g, '') : '';
    const nextVisible = hasNext ? stripInlineFormattingForMeasure(nextRaw) : '';
    const nextNorm = hasNext ? normalizeSpacedTags(nextVisible) : '';
    const nextParsed = hasNext ? parseLineSectionAndDynamics(nextNorm) : { isMatch: false };
    const isNextLyric = hasNext && !isChordLine(nextVisible) && !nextParsed.isMatch && nextVisible.trim() !== '';

    if (isCurrentChord && isNextLyric) {
      const chordWrapped = estimateWrappedLineCount(cleanLine, density.maxCharsPerLine);
      const lyricWrapped = estimateWrappedLineCount(nextRaw, density.maxCharsPerLine);
      const totalWrapped = chordWrapped + lyricWrapped;
      items.push({
        type: 'pair',
        chordLine: cleanLine,
        lyricLine: nextRaw,
        heightPt: density.lineHeightPt * totalWrapped,
        lineUnits: totalWrapped
      });
      i += 2;
    } else {
      const wrapped = estimateWrappedLineCount(cleanLine, density.maxCharsPerLine);
      items.push({
        type: 'single',
        line: cleanLine,
        isChord: isCurrentChord,
        heightPt: density.lineHeightPt * wrapped,
        lineUnits: wrapped
      });
      i++;
    }
  }

  // Agrupa cada estrofe inteira em um bloco atômico (mantendo cabeçalho de seção + versos da estrofe juntos sem quebrar no meio)
  const blocks: HtmlSongBlock[] = [];
  let currentItems: HtmlSongItem[] = [];
  let currentHeightPt = 0;
  let currentLineUnits = 0;

  const getItemLines = (it: HtmlSongItem): number => {
    if (it.type === 'pair' || it.type === 'single') return it.lineUnits;
    if (it.type === 'section') return 1;
    return 0;
  };

  for (const item of items) {
    if (item.type === 'section') {
      const hasMusicContent = currentItems.some(it => it.type === 'pair' || it.type === 'single');
      if (hasMusicContent) {
        blocks.push({ items: currentItems, heightPt: currentHeightPt, lineUnits: currentLineUnits });
        currentItems = [];
        currentHeightPt = 0;
        currentLineUnits = 0;
      }
      currentItems.push(item);
      currentHeightPt += item.heightPt;
      currentLineUnits += getItemLines(item);
    } else if (item.type === 'spacer') {
      if (currentItems.length > 0) {
        currentItems.push(item);
        currentHeightPt += item.heightPt;
        blocks.push({ items: currentItems, heightPt: currentHeightPt, lineUnits: currentLineUnits });
        currentItems = [];
        currentHeightPt = 0;
        currentLineUnits = 0;
      }
    } else {
      // Só divide se a música inteira não tiver nenhuma linha em branco nem seção (> 14 pares seguidos)
      const musicCount = currentItems.filter(it => it.type === 'pair' || it.type === 'single').length;
      if (musicCount >= 14) {
        blocks.push({ items: currentItems, heightPt: currentHeightPt, lineUnits: currentLineUnits });
        currentItems = [];
        currentHeightPt = 0;
        currentLineUnits = 0;
      }
      currentItems.push(item);
      currentHeightPt += item.heightPt;
      currentLineUnits += getItemLines(item);
    }
  }

  if (currentItems.length > 0) {
    while (currentItems.length > 0 && currentItems[currentItems.length - 1].type === 'spacer') {
      const removed = currentItems.pop()!;
      currentHeightPt -= removed.heightPt;
    }
    if (currentItems.length > 0) {
      blocks.push({ items: currentItems, heightPt: currentHeightPt, lineUnits: currentLineUnits });
    }
  }

  return blocks;
}

function measureHtmlBlocksHeightPt(blocks: HtmlSongBlock[]): number {
  let total = 0;
  for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
    const b = blocks[bIdx];
    total += b.heightPt;
    if (bIdx === blocks.length - 1 && b.items.length > 0) {
      const lastIt = b.items[b.items.length - 1];
      if (lastIt.type === 'spacer') {
        total -= lastIt.heightPt;
      }
    }
  }
  return Math.max(0, total);
}

function sumHtmlBlockLines(blocks: HtmlSongBlock[]): number {
  let total = 0;
  for (const b of blocks) {
    total += b.lineUnits;
  }
  return total;
}

function findBalancedHtmlTwoColSplit(
  remainingBlocks: HtmlSongBlock[],
  availColHeightPt: number
): number | null {
  if (remainingBlocks.length === 0) return 0;
  if (remainingBlocks.length === 1) {
    return measureHtmlBlocksHeightPt(remainingBlocks) <= availColHeightPt ? 1 : null;
  }

  let bestSplit: number | null = null;
  let minDiff = Infinity;

  for (let i = 0; i < remainingBlocks.length - 1; i++) {
    const col1 = remainingBlocks.slice(0, i + 1);
    const h1 = measureHtmlBlocksHeightPt(col1);
    if (h1 > availColHeightPt) break;

    const col2 = remainingBlocks.slice(i + 1);
    const h2 = measureHtmlBlocksHeightPt(col2);
    if (h2 <= availColHeightPt) {
      const diff = Math.abs(h1 - h2);
      if (diff < minDiff) {
        minDiff = diff;
        bestSplit = i + 1;
      }
    }
  }

  return bestSplit;
}

function packHtmlSongPages(
  blocks: HtmlSongBlock[],
  firstPageAvailPt: number,
  contPageAvailPt: number
): PackedHtmlPage[] {
  const pages: PackedHtmlPage[] = [];
  let curBlockIdx = 0;
  let isFirstPage = true;

  while (curBlockIdx < blocks.length) {
    const availColHeightPt = isFirstPage ? firstPageAvailPt : contPageAvailPt;
    const remainingBlocks = blocks.slice(curBlockIdx);
    const balancedSplit = findBalancedHtmlTwoColSplit(remainingBlocks, availColHeightPt);

    if (balancedSplit !== null) {
      const col1 = remainingBlocks.slice(0, balancedSplit);
      const col2 = remainingBlocks.slice(balancedSplit);
      pages.push({
        col1,
        col2,
        h1: measureHtmlBlocksHeightPt(col1),
        h2: measureHtmlBlocksHeightPt(col2),
        lines1: sumHtmlBlockLines(col1),
        lines2: sumHtmlBlockLines(col2)
      });
      break;
    }

    let col1EndIdx = 0;
    while (curBlockIdx + col1EndIdx < blocks.length) {
      const candidate = blocks.slice(curBlockIdx, curBlockIdx + col1EndIdx + 1);
      if (measureHtmlBlocksHeightPt(candidate) <= availColHeightPt) {
        col1EndIdx++;
      } else {
        break;
      }
    }
    if (col1EndIdx === 0) col1EndIdx = 1;

    const col1 = blocks.slice(curBlockIdx, curBlockIdx + col1EndIdx);
    curBlockIdx += col1EndIdx;

    let col2EndIdx = 0;
    while (curBlockIdx + col2EndIdx < blocks.length) {
      const candidate = blocks.slice(curBlockIdx, curBlockIdx + col2EndIdx + 1);
      if (measureHtmlBlocksHeightPt(candidate) <= availColHeightPt) {
        col2EndIdx++;
      } else {
        break;
      }
    }

    const col2 = blocks.slice(curBlockIdx, curBlockIdx + col2EndIdx);
    curBlockIdx += col2EndIdx;

    pages.push({
      col1,
      col2,
      h1: measureHtmlBlocksHeightPt(col1),
      h2: measureHtmlBlocksHeightPt(col2),
      lines1: sumHtmlBlockLines(col1),
      lines2: sumHtmlBlockLines(col2)
    });

    isFirstPage = false;
  }

  return pages;
}

function renderHtmlBlocksToColumn(blocks: HtmlSongBlock[], density: HtmlDensityProfile): string {
  if (!blocks || blocks.length === 0) {
    return '<p class="cifra-line MsoNormal" style="margin: 0pt;">&nbsp;</p>';
  }

  const stanzaHtmlList: string[] = [];
  let hasRenderedContent = false;

  for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
    const block = blocks[bIdx];
    const isLastBlock = bIdx === blocks.length - 1;
    const blockOut: string[] = [];

    for (let idx = 0; idx < block.items.length; idx++) {
      const item = block.items[idx];
      if (item.type === 'section') {
        const isTop = !hasRenderedContent && blockOut.length === 0;
        blockOut.push(formatSectionDynamicsHtml(item.parsed, isTop, density));
      } else if (item.type === 'pair') {
        blockOut.push(renderHtmlSingleCifraLine(item.chordLine, true, density));
        blockOut.push(renderHtmlSingleCifraLine(item.lyricLine, false, density));
      } else if (item.type === 'single') {
        blockOut.push(renderHtmlSingleCifraLine(item.line, item.isChord, density));
      } else if (item.type === 'spacer') {
        if (isLastBlock && idx === block.items.length - 1) {
          continue;
        }
        const nextBlockFirstItem =
          idx === block.items.length - 1 && bIdx + 1 < blocks.length
            ? blocks[bIdx + 1].items[0]
            : block.items[idx + 1];
        if (density.collapseSectionSpacer && nextBlockFirstItem && nextBlockFirstItem.type === 'section') {
          continue;
        }
        blockOut.push(
          `<p class="cifra-line MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 0pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 0pt; line-height: ${density.lineHeightRatio}; mso-line-height-rule: exactly; font-family: 'Courier New', Consolas, Courier, monospace; font-size: ${density.spacerFontPt}pt;">&nbsp;</p>`
        );
      }
    }

    if (blockOut.length > 0) {
      hasRenderedContent = true;
      stanzaHtmlList.push(
        `<div class="cifra-stanza" style="page-break-inside: avoid; break-inside: avoid; margin: 0; padding: 0;">${blockOut.join('\n')}</div>`
      );
    }
  }

  return stanzaHtmlList.length > 0
    ? stanzaHtmlList.join('\n')
    : '<p class="cifra-line MsoNormal" style="margin: 0pt;">&nbsp;</p>';
}

function selectOptimalHtmlSongPlan(
  rawCifra: string,
  firstPageAvailPt: number,
  contPageAvailPt: number
): { selectedDensity: HtmlDensityProfile; selectedPages: PackedHtmlPage[] } {
  const { maxLineChars, totalNonEmptyLines } = measureHtmlCifraMetrics(rawCifra);

  // Ajuste dinâmico de fonte: 8.5pt padrão, reduzindo para 7.5pt ou 7pt se linha > 42 caracteres ou música longa
  let candidateProfiles: HtmlDensityProfile[];
  if (maxLineChars > 48 || totalNonEmptyLines > 76) {
    candidateProfiles = [HTML_DENSITY_TIGHT];
  } else if (maxLineChars > 42 || totalNonEmptyLines > 52) {
    candidateProfiles = [HTML_DENSITY_COMPACT, HTML_DENSITY_TIGHT];
  } else {
    candidateProfiles = [HTML_DENSITY_NORMAL, HTML_DENSITY_COMPACT, HTML_DENSITY_TIGHT];
  }

  let selectedDensity = candidateProfiles[0];
  let selectedPages = packHtmlSongPages(
    buildHtmlSongBlocks(rawCifra, selectedDensity),
    firstPageAvailPt,
    contPageAvailPt
  );

  for (let i = 1; i < candidateProfiles.length; i++) {
    if (selectedPages.length <= 1) break;
    const nextDensity = candidateProfiles[i];
    const nextBlocks = buildHtmlSongBlocks(rawCifra, nextDensity);
    const nextPages = packHtmlSongPages(nextBlocks, firstPageAvailPt, contPageAvailPt);
    if (nextPages.length <= selectedPages.length) {
      selectedDensity = nextDensity;
      selectedPages = nextPages;
    }
  }

  return { selectedDensity, selectedPages };
}

/**
 * Divide uma cifra em duas colunas balanceadas (50% / 50% por altura real)
 * utilizando o algoritmo "Smart Fit" anti-órfãos para Word (.doc) e Prévia.
 */
function splitCifraIntoTwoColumnsHtml(rawCifra: string): { col1Html: string; col2Html: string } {
  if (!rawCifra || !rawCifra.trim()) {
    return {
      col1Html: '<p class="cifra-line MsoNormal" style="margin: 0pt; color: #64748b; font-style: italic; font-family: Arial, sans-serif; font-size: 9pt;">(Cifra/Letra não cadastrada no repertório)</p>',
      col2Html: '<p class="cifra-line MsoNormal" style="margin: 0pt;">&nbsp;</p>'
    };
  }

  const firstPageAvailPt = 640;
  const contPageAvailPt = 675;
  const { selectedDensity, selectedPages } = selectOptimalHtmlSongPlan(rawCifra, firstPageAvailPt, contPageAvailPt);

  const firstPage = selectedPages[0];
  if (!firstPage) {
    return {
      col1Html: '<p class="cifra-line MsoNormal" style="margin: 0pt;">&nbsp;</p>',
      col2Html: '<p class="cifra-line MsoNormal" style="margin: 0pt;">&nbsp;</p>'
    };
  }

  return {
    col1Html: renderHtmlBlocksToColumn(firstPage.col1, selectedDensity),
    col2Html: renderHtmlBlocksToColumn(firstPage.col2, selectedDensity)
  };
}

/**
 * Renderiza uma música com quebra de página explícita do Word no início,
 * cabeçalho simples no topo (sem <thead> para evitar repetição do título pelo Word)
 * e tabela de 2 colunas com largura travada (245pt + 10pt + 245pt = 500pt).
 */
function renderSongSheetHtml(song: {
  title: string;
  artist: string;
  key: string;
  bpm: string;
  timeSignature: string;
  chords: string;
}, index: number = 0): string {
  const rawCifra = (song.chords || '').trim();
  const safeTitleHtml = formatInlineBoldHtml(song.title || 'Música Sem Título', false);
  const safeArtistHtml = formatInlineBoldHtml(song.artist || 'Desconhecido', false);
  const safeKeyHtml = escapeHtml(song.key || '-');
  const safeBpmHtml = song.bpm ? ` | BPM: ${escapeHtml(song.bpm)}` : '';
  const safeTimeHtml = song.timeSignature ? ` | Compasso: ${escapeHtml(song.timeSignature)}` : '';

  if (!rawCifra) {
    const emptyCol = splitCifraIntoTwoColumnsHtml('');
    return `
  <!-- MÚSICA ${index + 1}: ${escapeHtml(song.title)} -->
  <br clear="all" style="page-break-before: always; mso-break-type: page-break;" />
  <div class="song-header-block" style="width: 500pt; max-width: 100%; border-bottom: 1.5pt solid #cbd5e1; padding-bottom: 6pt; margin-bottom: 8pt; page-break-inside: avoid; page-break-after: avoid;">
    <p class="MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 2pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 2pt; font-family: Arial, Helvetica, sans-serif; font-size: 18pt; font-weight: bold; color: #000000; line-height: 1.15; page-break-after: avoid; mso-pagination: lines-together;">
      ${safeTitleHtml}
    </p>
    <p class="MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 2pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 2pt; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; font-style: italic; color: #374151; line-height: 1.25; page-break-after: avoid; mso-pagination: lines-together;">
      Artista: ${safeArtistHtml}
    </p>
    <p class="MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 2pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 2pt; font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #4b5563; line-height: 1.25; page-break-after: avoid; mso-pagination: lines-together;">
      Tom: <b>${safeKeyHtml}</b>${safeBpmHtml}${safeTimeHtml}
    </p>
  </div>
  <table class="cifra-song-table" width="100%" border="0" cellpadding="0" cellspacing="0" style="width: 500pt; max-width: 100%; table-layout: fixed; border-collapse: collapse; border: none; margin: 0; padding: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
    <colgroup>
      <col width="245pt" style="width: 245pt;" />
      <col width="10pt" style="width: 10pt;" />
      <col width="245pt" style="width: 245pt;" />
    </colgroup>
    <tbody>
      <tr class="cifra-body-row" style="vertical-align: top;">
        <td width="245pt" valign="top" style="width: 245pt; vertical-align: top; overflow: hidden; word-wrap: break-word; padding: 0; border: none; margin: 0;">
          ${emptyCol.col1Html}
        </td>
        <td width="10pt" valign="top" style="width: 10pt; vertical-align: top; padding: 0; border: none; margin: 0;">&nbsp;</td>
        <td width="245pt" valign="top" style="width: 245pt; vertical-align: top; overflow: hidden; word-wrap: break-word; padding: 0; border: none; margin: 0;">
          ${emptyCol.col2Html}
        </td>
      </tr>
    </tbody>
  </table>`;
  }

  const firstPageAvailPt = 640;
  const contPageAvailPt = 675;
  const { selectedDensity, selectedPages } = selectOptimalHtmlSongPlan(rawCifra, firstPageAvailPt, contPageAvailPt);

  return selectedPages.map((pagePlan, pageIdx) => {
    const col1Html = renderHtmlBlocksToColumn(pagePlan.col1, selectedDensity);
    const col2Html = renderHtmlBlocksToColumn(pagePlan.col2, selectedDensity);
    const colPadTop = `${selectedDensity.colTopPadPt}pt`;

    const headerHtml = pageIdx === 0
      ? `
    <p class="MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 2pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 2pt; font-family: Arial, Helvetica, sans-serif; font-size: 18pt; font-weight: bold; color: #000000; line-height: 1.15; page-break-after: avoid; mso-pagination: lines-together;">
      ${safeTitleHtml}
    </p>
    <p class="MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 2pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 2pt; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; font-style: italic; color: #374151; line-height: 1.25; page-break-after: avoid; mso-pagination: lines-together;">
      Artista: ${safeArtistHtml}
    </p>
    <p class="MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 2pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 2pt; font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #4b5563; line-height: 1.25; page-break-after: avoid; mso-pagination: lines-together;">
      Tom: <b>${safeKeyHtml}</b>${safeBpmHtml}${safeTimeHtml}
    </p>`
      : `
    <p class="MsoNormal" style="margin: 0pt; margin-top: 0pt; margin-bottom: 2pt; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 2pt; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; font-weight: bold; color: #64748b; line-height: 1.2; page-break-after: avoid; mso-pagination: lines-together;">
      ${safeTitleHtml} (Continuação)
    </p>`;

    return `
  <!-- MÚSICA ${index + 1} (PÁGINA ${pageIdx + 1}/${selectedPages.length}): ${escapeHtml(song.title)} -->
  <br clear="all" style="page-break-before: always; mso-break-type: page-break;" />
  <div class="song-header-block" style="width: 500pt; max-width: 100%; border-bottom: ${pageIdx === 0 ? '1.5pt' : '0.75pt'} solid #cbd5e1; padding-bottom: ${pageIdx === 0 ? '6pt' : '3pt'}; margin-bottom: ${colPadTop}; page-break-inside: avoid; page-break-after: avoid;">
    ${headerHtml}
  </div>
  <table class="cifra-song-table" width="100%" border="0" cellpadding="0" cellspacing="0" style="width: 500pt; max-width: 100%; table-layout: fixed; border-collapse: collapse; border: none; margin: 0; padding: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
    <colgroup>
      <col width="245pt" style="width: 245pt;" />
      <col width="10pt" style="width: 10pt;" />
      <col width="245pt" style="width: 245pt;" />
    </colgroup>
    <tbody>
      <tr class="cifra-body-row" style="vertical-align: top;">
        <td width="245pt" valign="top" style="width: 245pt; vertical-align: top; overflow: hidden; word-wrap: break-word; padding: 0; border: none; margin: 0;">
          ${col1Html}
        </td>
        <td width="10pt" valign="top" style="width: 10pt; vertical-align: top; padding: 0; border: none; margin: 0;">&nbsp;</td>
        <td width="245pt" valign="top" style="width: 245pt; vertical-align: top; overflow: hidden; word-wrap: break-word; padding: 0; border: none; margin: 0;">
          ${col2Html}
        </td>
      </tr>
    </tbody>
  </table>`;
  }).join('\n');
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
  <title>Caderno do Culto — ${escapeHtml(stripInlineFormattingForMeasure(serviceTitle))}</title>
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
    table.data-table tr {
      page-break-inside: avoid;
      mso-row-cant-split: true;
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
      margin-bottom: 0pt;
    }
    p.cifra-line {
      margin: 0pt;
      margin-top: 0pt;
      margin-bottom: 0pt;
      mso-margin-top-alt: 0pt;
      mso-margin-bottom-alt: 0pt;
      font-family: 'Courier New', Consolas, Courier, monospace;
      font-size: 8.5pt;
      line-height: 1.12;
      mso-line-height-rule: exactly;
      white-space: pre-wrap;
      word-wrap: break-word;
      word-break: break-word;
    }
    p.cifra-section {
      margin: 0pt;
      margin-top: 4.5pt;
      margin-bottom: 2pt;
      mso-margin-top-alt: 4.5pt;
      mso-margin-bottom-alt: 2pt;
      line-height: 1.18;
      page-break-after: avoid;
      mso-pagination: lines-together;
    }
    div.cifra-stanza {
      page-break-inside: avoid;
      break-inside: avoid;
      margin: 0;
      padding: 0;
    }
    div.song-header-block {
      width: 500pt;
      max-width: 100%;
      page-break-inside: avoid;
      page-break-after: avoid;
      mso-pagination: lines-together;
    }
    table.cifra-song-table {
      width: 500pt;
      max-width: 100%;
      border-collapse: collapse;
      border: none;
      margin: 0;
      margin-bottom: 0pt;
      padding: 0;
      table-layout: fixed;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    table.cifra-song-table th, table.cifra-song-table td {
      border: none;
      padding: 0;
      margin: 0;
      overflow: hidden;
      word-wrap: break-word;
    }
    tr.cifra-body-row {
      vertical-align: top;
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
      ${formatInlineBoldHtml(churchName)}
    </div>
    <h1 style="text-align: center; border-bottom: none; margin: 6pt 0 4pt 0;">
      Caderno do Culto & Liturgia
    </h1>
    <div style="font-size: 16pt; font-weight: bold; color: #2563eb; margin-bottom: 6pt;">
      ${formatInlineBoldHtml(serviceTitle)}
    </div>
    <div class="header-info" style="text-align: center;">
      📅 <b>Data:</b> ${escapeHtml(formattedDate)}
      ${location ? `<br>📍 <b>Local:</b> ${formatInlineBoldHtml(location)}` : ''}
      ${service.theme && service.theme !== 'normal' ? `<br>✨ <b>Tema / Ocasião:</b> ${formatInlineBoldHtml(String(service.theme).toUpperCase())}` : ''}
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
        <td><b>${formatInlineBoldHtml(entry.role)}</b></td>
        <td>${formatInlineBoldHtml(entry.names)}</td>
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

        // Remove qualquer menção à versão da Bíblia (ex: (NAA), (NVI), etc.) e aplica negrito real seguro
        const cleanTitle = removeBibleVersionTags(item.title || '-');
        const cleanDetailsRaw = item.details ? removeBibleVersionTags(item.details) : '';
        const cleanDetails = cleanDetailsRaw ? `<br><small style="color: #64748b;">${formatInlineBoldHtml(cleanDetailsRaw)}</small>` : '';
        const responsible = item.responsible || item.vocalist || item.person || '-';

        return `
      <tr>
        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
        <td><span class="badge">${formatInlineBoldHtml(typeLabel)}</span></td>
        <td><b>${formatInlineBoldHtml(cleanTitle)}</b>${cleanDetails}</td>
        <td>${formatInlineBoldHtml(responsible)}</td>
        <td style="text-align: center;">${escapeHtml(durationText)}</td>
      </tr>`;
      }).join('')}
    </tbody>
  </table>
`;
  }

  // RODAPÉ DA LITURGIA (quando há músicas, posicionado antes das cifras para não criar página órfã no final do .doc)
  const footerHtml = `
  <div class="footer">
    Documento oficial gerado automaticamente pelo <b>LiLouPro</b> — Gestão de Louvor e Culto.<br>
    Acesse em: <a href="https://liloupro.app" style="color: #2563eb;">https://liloupro.app</a>
  </div>`;

  // 3. SEÇÃO DE CIFRAS E REPERTÓRIO COMPLETO
  // Cada folha de música é renderizada em sua própria tabela indivisível (cabeçalho + cifras em 2 colunas)
  // com Smart Fit anti-órfãos e page-break-before: always.
  if (songs.length > 0) {
    html += footerHtml;
    songs.forEach((song, idx) => {
      html += renderSongSheetHtml(song, idx);
    });
  } else {
    html += footerHtml;
  }

  html += `
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
  <title>Caderno do Culto — ${escapeHtml(stripInlineFormattingForMeasure(serviceTitle))}</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #1e293b;
      line-height: 1.4;
      font-size: 11pt;
    }
    table.data-table {
      width: 480pt;
      table-layout: fixed;
      border-collapse: collapse;
      margin: 10pt 0 16pt 0;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 4pt 6pt;
      text-align: left;
      vertical-align: top;
    }
    table.data-table tr {
      page-break-inside: avoid;
    }
    table.data-table th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: bold;
      font-size: 9pt;
      white-space: nowrap;
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
      ${formatInlineBoldHtml(churchName)}
    </div>
    <div style="font-size: 22pt; font-weight: bold; color: #000000; margin: 4pt 0 4pt 0;">
      <b>Caderno do Culto & Liturgia</b>
    </div>
    <div style="font-size: 16pt; font-weight: bold; color: #2563eb; margin-bottom: 6pt;">
      ${formatInlineBoldHtml(serviceTitle)}
    </div>
    <div style="font-size: 10pt; color: #64748b; text-align: center;">
      📅 <b>Data:</b> ${escapeHtml(formattedDate)}
      ${location ? `<br>📍 <b>Local:</b> ${formatInlineBoldHtml(location)}` : ''}
      ${service.theme && service.theme !== 'normal' ? `<br>✨ <b>Tema / Ocasião:</b> ${formatInlineBoldHtml(String(service.theme).toUpperCase())}` : ''}
    </div>
  </div>

  <hr style="border: 0; border-top: 1.5pt solid #3b82f6; margin: 12pt 0 16pt 0;">
`;

  // 1. SEÇÃO DE EQUIPE ESCALADA (150pt + 330pt = 480pt)
  if (scaleEntries.length > 0) {
    html += `
  <div style="font-size: 14pt; font-weight: bold; color: #1e293b; margin: 12pt 0 6pt 0; page-break-after: avoid;">
    <b>👥 Equipe Escalada (Ministério de Louvor & Culto)</b>
  </div>
  <table class="data-table" border="1" cellpadding="4" cellspacing="0" width="480pt" style="width: 480pt; table-layout: fixed; border-collapse: collapse; margin-bottom: 16pt;">
    <colgroup>
      <col width="150pt" style="width: 150pt;" />
      <col width="330pt" style="width: 330pt;" />
    </colgroup>
    <thead>
      <tr style="background-color: #f1f5f9; page-break-inside: avoid;">
        <th width="150pt" style="width: 150pt; text-align: left; padding: 4pt 6pt; vertical-align: top; font-size: 9pt; white-space: nowrap; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Função / Ministério</th>
        <th width="330pt" style="width: 330pt; text-align: left; padding: 4pt 6pt; vertical-align: top; font-size: 9pt; white-space: nowrap; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Integrantes Escalados</th>
      </tr>
    </thead>
    <tbody>
      ${scaleEntries.map(entry => `
      <tr style="page-break-inside: avoid;">
        <td width="150pt" style="width: 150pt; font-size: 9.5pt; line-height: 1.25; padding: 4pt 6pt; vertical-align: top; border: 1px solid #cbd5e1;"><b>${formatInlineBoldHtml(entry.role)}</b></td>
        <td width="330pt" style="width: 330pt; font-size: 9.5pt; line-height: 1.25; padding: 4pt 6pt; vertical-align: top; border: 1px solid #cbd5e1;">${formatInlineBoldHtml(entry.names)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
`;
  }

  // 2. SEÇÃO DE LITURGIA (ORDEM DO CULTO: 25pt + 85pt + 240pt + 75pt + 55pt = 480pt)
  if (liturgyItems.length > 0) {
    html += `
  <div style="font-size: 14pt; font-weight: bold; color: #1e293b; margin: 16pt 0 6pt 0; page-break-after: avoid;">
    <b>📖 Ordem do Culto (Liturgia Oficial)</b>
  </div>
  <table class="data-table" border="1" cellpadding="4" cellspacing="0" width="480pt" style="width: 480pt; table-layout: fixed; border-collapse: collapse; margin-bottom: 18pt;">
    <colgroup>
      <col width="25pt" style="width: 25pt;" />
      <col width="85pt" style="width: 85pt;" />
      <col width="240pt" style="width: 240pt;" />
      <col width="75pt" style="width: 75pt;" />
      <col width="55pt" style="width: 55pt;" />
    </colgroup>
    <thead>
      <tr style="background-color: #f1f5f9; page-break-inside: avoid;">
        <th width="25pt" style="width: 25pt; text-align: center; padding: 4pt 6pt; vertical-align: top; font-size: 9pt; white-space: nowrap; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">#</th>
        <th width="85pt" style="width: 85pt; text-align: left; padding: 4pt 6pt; vertical-align: top; font-size: 9pt; white-space: nowrap; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Momento</th>
        <th width="240pt" style="width: 240pt; text-align: left; padding: 4pt 6pt; vertical-align: top; font-size: 9pt; white-space: nowrap; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Detalhes / Título / Passagem Bíblica</th>
        <th width="75pt" style="width: 75pt; text-align: left; padding: 4pt 6pt; vertical-align: top; font-size: 9pt; white-space: nowrap; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Responsável</th>
        <th width="55pt" style="width: 55pt; text-align: center; padding: 4pt 6pt; vertical-align: top; font-size: 9pt; white-space: nowrap; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Duração</th>
      </tr>
    </thead>
    <tbody>
      ${liturgyItems.map((item: any, idx: number) => {
        const typeLabel = LITURGY_TYPE_LABELS[item.type] || item.type || 'Momento';
        const durationText = item.duration ? `${item.duration} min` : '-';
        const cleanTitle = removeBibleVersionTags(item.title || '-');
        const cleanDetailsRaw = item.details ? removeBibleVersionTags(item.details) : '';
        const continuousDetailsText = cleanDetailsRaw
          ? formatInlineBoldHtml(
              cleanDetailsRaw
                .replace(/\r?\n+/g, ' ')
                .replace(/\s{2,}/g, ' ')
                .trim()
            )
          : '';
        const cleanDetails = continuousDetailsText
          ? `<div style="font-size: 8.5pt; line-height: 1.2; color: #475569; margin: 0; padding: 0;">${continuousDetailsText}</div>`
          : '';
        const responsible = item.responsible || item.vocalist || item.person || '-';

        return `
      <tr style="page-break-inside: avoid;">
        <td width="25pt" style="width: 25pt; text-align: center; font-size: 9.5pt; font-weight: bold; padding: 4pt 6pt; vertical-align: top; border: 1px solid #cbd5e1;">${idx + 1}</td>
        <td width="85pt" style="width: 85pt; padding: 4pt 6pt; vertical-align: top; border: 1px solid #cbd5e1;"><span class="badge">${formatInlineBoldHtml(typeLabel)}</span></td>
        <td width="240pt" style="width: 240pt; padding: 4pt 6pt; vertical-align: top; border: 1px solid #cbd5e1;"><div style="font-size: 9.5pt; font-weight: bold; line-height: 1.2; color: #1e293b; margin: 0${cleanDetails ? ' 0 2pt 0' : ''}; padding: 0;"><b>${formatInlineBoldHtml(cleanTitle)}</b></div>${cleanDetails}</td>
        <td width="75pt" style="width: 75pt; font-size: 9pt; line-height: 1.2; padding: 4pt 6pt; vertical-align: top; border: 1px solid #cbd5e1;">${formatInlineBoldHtml(responsible)}</td>
        <td width="55pt" style="width: 55pt; font-size: 9pt; line-height: 1.2; text-align: center; padding: 4pt 6pt; vertical-align: top; border: 1px solid #cbd5e1;">${escapeHtml(durationText)}</td>
      </tr>`;
      }).join('')}
    </tbody>
  </table>
`;
  }

  // 3. SEÇÃO DE REPERTÓRIO MUSICAL (LISTA DE MÚSICAS SEM CIFRAS: 25pt + 220pt + 135pt + 50pt + 50pt = 480pt)
  if (songs.length > 0) {
    html += `
  <div style="font-size: 14pt; font-weight: bold; color: #1e293b; margin: 16pt 0 6pt 0; page-break-after: avoid;">
    <b>🎵 Músicas do Culto (Repertório)</b>
  </div>
  <table class="data-table" border="1" cellpadding="4" cellspacing="0" width="480pt" style="width: 480pt; table-layout: fixed; border-collapse: collapse; margin-bottom: 12pt;">
    <colgroup>
      <col width="25pt" style="width: 25pt;" />
      <col width="220pt" style="width: 220pt;" />
      <col width="135pt" style="width: 135pt;" />
      <col width="50pt" style="width: 50pt;" />
      <col width="50pt" style="width: 50pt;" />
    </colgroup>
    <thead>
      <tr style="background-color: #f1f5f9; page-break-inside: avoid;">
        <th width="25pt" style="width: 25pt; text-align: center; padding: 4pt 6pt; vertical-align: top; font-size: 9pt; white-space: nowrap; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">#</th>
        <th width="220pt" style="width: 220pt; text-align: left; padding: 4pt 6pt; vertical-align: top; font-size: 9pt; white-space: nowrap; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Música / Título</th>
        <th width="135pt" style="width: 135pt; text-align: left; padding: 4pt 6pt; vertical-align: top; font-size: 9pt; white-space: nowrap; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Artista / Ministério</th>
        <th width="50pt" style="width: 50pt; text-align: center; padding: 4pt 6pt; vertical-align: top; font-size: 9pt; white-space: nowrap; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">Tom</th>
        <th width="50pt" style="width: 50pt; text-align: center; padding: 4pt 6pt; vertical-align: top; font-size: 9pt; white-space: nowrap; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1;">BPM</th>
      </tr>
    </thead>
    <tbody>
      ${songs.map((song, idx) => `
      <tr style="page-break-inside: avoid;">
        <td width="25pt" style="width: 25pt; text-align: center; font-size: 9.5pt; font-weight: bold; padding: 4pt 6pt; vertical-align: top; border: 1px solid #cbd5e1;">${idx + 1}</td>
        <td width="220pt" style="width: 220pt; font-size: 9.5pt; line-height: 1.25; padding: 4pt 6pt; vertical-align: top; border: 1px solid #cbd5e1;"><b>${formatInlineBoldHtml(song.title)}</b></td>
        <td width="135pt" style="width: 135pt; font-size: 9pt; line-height: 1.25; padding: 4pt 6pt; vertical-align: top; border: 1px solid #cbd5e1;">${formatInlineBoldHtml(song.artist || 'Desconhecido')}</td>
        <td width="50pt" style="width: 50pt; text-align: center; font-size: 9.5pt; font-weight: bold; color: #2563eb; padding: 4pt 6pt; vertical-align: top; border: 1px solid #cbd5e1;">${escapeHtml(song.key || '-')}</td>
        <td width="50pt" style="width: 50pt; text-align: center; font-size: 9pt; padding: 4pt 6pt; vertical-align: top; border: 1px solid #cbd5e1;">${escapeHtml(song.bpm || '-')}</td>
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
  <div style="margin-top: 20pt; padding-top: 8pt; border-top: 1px solid #cbd5e1; font-size: 8.5pt; color: #94a3b8; text-align: center; page-break-inside: avoid;">
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
  const isGoogle = isGoogleEmail(memberEmail);
  const targetEmail = memberEmail && memberEmail.includes('@') && isGoogle ? memberEmail.trim() : '';
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

export interface PdfDensityProfile {
  name: 'normal' | 'compact' | 'tight';
  fontSize: number;
  lineHeight: number;
  sectionHeight: number;
  consecutiveSectionHeight: number;
  badgeHeight: number;
  badgeStartOffset: number;
  badgeFontSize: number;
  dynFontSize: number;
  blockGap: number;
  collapseSectionSpacer: boolean;
}

const PDF_DENSITY_NORMAL: PdfDensityProfile = {
  name: 'normal',
  fontSize: 9,
  lineHeight: 4.2,
  sectionHeight: 9.6,
  consecutiveSectionHeight: 5.8,
  badgeHeight: 4.2,
  badgeStartOffset: 0.6,
  badgeFontSize: 7.5,
  dynFontSize: 7.0,
  blockGap: 2.0,
  collapseSectionSpacer: false
};

const PDF_DENSITY_COMPACT: PdfDensityProfile = {
  name: 'compact',
  fontSize: 8.0,
  lineHeight: 3.45,
  sectionHeight: 7.2,
  consecutiveSectionHeight: 4.7,
  badgeHeight: 3.5,
  badgeStartOffset: 0.4,
  badgeFontSize: 6.8,
  dynFontSize: 6.3,
  blockGap: 1.0,
  collapseSectionSpacer: true
};

const PDF_DENSITY_TIGHT: PdfDensityProfile = {
  name: 'tight',
  fontSize: 7.5,
  lineHeight: 3.2,
  sectionHeight: 6.4,
  consecutiveSectionHeight: 4.3,
  badgeHeight: 3.2,
  badgeStartOffset: 0.35,
  badgeFontSize: 6.4,
  dynFontSize: 6.0,
  blockGap: 0.7,
  collapseSectionSpacer: true
};

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
  isFollowedBySection: boolean = false,
  density: PdfDensityProfile = PDF_DENSITY_NORMAL
): number {
  const badgeHeight = density.badgeHeight;
  const radius = 1.0;
  let curX = x;
  const startY = y + density.badgeStartOffset; // Posição superior do retângulo do badge

  // 1. Badges de Seção ([Intro], [Verso], [Refrão], [Ponte], etc.)
  for (const sec of parsed.sections) {
    const title = sec.title.toUpperCase();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(density.badgeFontSize);
    const textWidth = doc.getTextWidth(title);
    const padX = density.name === 'normal' ? 2.2 : 1.8;
    const badgeW = Math.min(textWidth + padX * 2, colWidth - (curX - x));
    if (badgeW <= 4) break;

    // Fundo suave e borda ciano/teal da marca LiLouPro
    doc.setFillColor(238, 246, 248);
    doc.setDrawColor(43, 169, 184);
    doc.setLineWidth(0.25);
    doc.roundedRect(curX, startY, badgeW, badgeHeight, radius, radius, 'FD');

    // Texto nítido em azul petróleo escuro
    doc.setTextColor(14, 116, 144);
    doc.text(title, curX + padX, startY + badgeHeight - (density.name === 'normal' ? 1.1 : 0.9));

    curX += badgeW + 2.0;
  }

  // 2. Badges de Dinâmica (ex: N2 • BEM SUAVE, N6 • FORTE, PAUSA, etc.)
  for (const dyn of parsed.dynamics) {
    if (curX >= x + colWidth - 5) break;

    const cleanLabel = formatDynamicLabelForPdf(dyn.label);
    if (!cleanLabel) continue;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(density.dynFontSize);
    const textWidth = doc.getTextWidth(cleanLabel);
    const padX = density.name === 'normal' ? 2.0 : 1.6;
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
    doc.text(cleanLabel, curX + padX, startY + badgeHeight - (density.name === 'normal' ? 1.1 : 0.9));

    curX += badgeW + 2.0;
  }

  // 3. Badges de Repetição (ex: 2X, 4X, BIS)
  for (const rep of parsed.repeats) {
    if (curX >= x + colWidth - 5) break;

    const repLabel = rep.toUpperCase();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(density.dynFontSize);
    const textWidth = doc.getTextWidth(repLabel);
    const padX = density.name === 'normal' ? 1.8 : 1.5;
    const badgeW = Math.min(textWidth + padX * 2, colWidth - (curX - x));
    if (badgeW <= 4) break;

    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(252, 211, 77);
    doc.setLineWidth(0.25);
    doc.roundedRect(curX, startY, badgeW, badgeHeight, radius, radius, 'FD');

    doc.setTextColor(180, 83, 9);
    doc.text(repLabel, curX + padX, startY + badgeHeight - (density.name === 'normal' ? 1.1 : 0.9));

    curX += badgeW + 2.0;
  }

  return isFollowedBySection ? density.consecutiveSectionHeight : density.sectionHeight;
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
  isChord: boolean,
  fontSize: number = 9
): void {
  const cleanLine = (rawLine || '').replace(/\r/g, '').replace(/\t/g, '    ');
  const trimmed = stripInlineBoldTags(cleanLine).trim();
  if (!trimmed) return;

  doc.setFontSize(fontSize);
  const safeLine = cleanLine.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

  if (isChord) {
    // Courier Bold + cor da marca (rgb 43, 169, 184) sem tags literais
    doc.setFont('courier', 'bold');
    doc.setTextColor(43, 169, 184);

    let displayLine = stripInlineBoldTags(safeLine);
    if (doc.getTextWidth(displayLine) > colWidth - 1) {
      let temp = displayLine;
      while (temp.length > 0 && doc.getTextWidth(temp) > colWidth - 2) {
        temp = temp.slice(0, -1);
      }
      displayLine = temp;
    }

    doc.text(displayLine, x, y);
    return;
  }

  // Letra em cinza escuro nítido, aplicando negrito real em <b>/<strong>/**...** sem deslocar colunas
  doc.setTextColor(30, 41, 59);
  const segments = parseBoldSegments(safeLine);
  let curX = x;
  const maxX = x + colWidth - 1;

  for (const seg of segments) {
    if (!seg.text) continue;
    doc.setFont('courier', seg.bold ? 'bold' : 'normal');
    const segWidth = doc.getTextWidth(seg.text);

    if (curX + segWidth > maxX) {
      let clipped = '';
      for (const ch of seg.text) {
        if (curX + doc.getTextWidth(clipped + ch) > maxX) break;
        clipped += ch;
      }
      if (clipped) {
        doc.text(clipped, curX, y);
      }
      break;
    }

    doc.text(seg.text, curX, y);
    curX += segWidth;
  }
}

export type SongItem = 
  | { type: 'section'; parsed: ParsedSectionAndDynamics; height: number; raw: string }
  | { type: 'pair'; chordLine: string; lyricLine: string; height: number }
  | { type: 'single'; line: string; isChord: boolean; height: number }
  | { type: 'spacer'; height: number };

export interface SongBlock {
  items: SongItem[];
  height: number;
  lineUnits: number;
}

/**
 * Agrupa as linhas da música em blocos lógicos estruturados (estrofes/seções),
 * garantindo que pares de acordes e letras permaneçam atômicos e que seções e dinâmicas
 * sejam identificadas e tratadas como badges de cabeçalho.
 */
export function buildSongBlocks(
  rawContent: string,
  density: PdfDensityProfile = PDF_DENSITY_NORMAL
): SongBlock[] {
  const rawLines = (rawContent || '').split(/\r?\n/);
  while (rawLines.length > 0 && !rawLines[rawLines.length - 1].trim()) {
    rawLines.pop();
  }

  const items: SongItem[] = [];
  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = stripInlineBoldTags(line).trim();

    if (!trimmed) {
      if (items.length > 0 && items[items.length - 1].type !== 'spacer') {
        items.push({ type: 'spacer', height: density.collapseSectionSpacer ? 1.5 : 2.5 });
      }
      i++;
      continue;
    }

    const norm = normalizeSpacedTags(line);
    const parsed = parseLineSectionAndDynamics(norm);

    if (parsed.isMatch) {
      // No modo compacto, evita acumular spacer imediatamente antes de um cabeçalho de seção
      if (density.collapseSectionSpacer && items.length > 0 && items[items.length - 1].type === 'spacer') {
        items.pop();
      }
      const hasNext = i + 1 < rawLines.length;
      const nextLine = hasNext ? rawLines[i + 1] : '';
      const nextNorm = hasNext ? normalizeSpacedTags(nextLine) : '';
      const nextParsed = hasNext ? parseLineSectionAndDynamics(nextNorm) : { isMatch: false };
      const isNextSection = nextParsed.isMatch;
      const height = isNextSection ? density.consecutiveSectionHeight : density.sectionHeight;

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
      items.push({ type: 'pair', chordLine: line, lyricLine: nextLine, height: density.lineHeight * 2 });
      i += 2;
    } else {
      items.push({ type: 'single', line, isChord: isCurrentChord, height: density.lineHeight });
      i++;
    }
  }

  // Agrupa os itens em blocos separados por seção ou espaçador
  const blocks: SongBlock[] = [];
  let currentItems: SongItem[] = [];
  let currentHeight = 0;
  let currentLineUnits = 0;

  const getItemLines = (it: SongItem): number => {
    if (it.type === 'pair') return 2;
    if (it.type === 'single' || it.type === 'section') return 1;
    return 0;
  };

  for (const item of items) {
    if (item.type === 'section') {
      const hasMusicContent = currentItems.some(it => it.type === 'pair' || it.type === 'single');
      if (hasMusicContent) {
        blocks.push({ items: currentItems, height: currentHeight, lineUnits: currentLineUnits });
        currentItems = [];
        currentHeight = 0;
        currentLineUnits = 0;
      }
      currentItems.push(item);
      currentHeight += item.height;
      currentLineUnits += getItemLines(item);
    } else if (item.type === 'spacer') {
      if (currentItems.length > 0) {
        blocks.push({ items: currentItems, height: currentHeight, lineUnits: currentLineUnits });
        currentItems = [];
        currentHeight = 0;
        currentLineUnits = 0;
      }
    } else {
      const musicCount = currentItems.filter(it => it.type === 'pair' || it.type === 'single').length;
      if (musicCount >= 4) {
        blocks.push({ items: currentItems, height: currentHeight, lineUnits: currentLineUnits });
        currentItems = [];
        currentHeight = 0;
        currentLineUnits = 0;
      }
      currentItems.push(item);
      currentHeight += item.height;
      currentLineUnits += getItemLines(item);
    }
  }

  if (currentItems.length > 0) {
    blocks.push({ items: currentItems, height: currentHeight, lineUnits: currentLineUnits });
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
  colWidth: number,
  density: PdfDensityProfile = PDF_DENSITY_NORMAL
): number {
  let y = startY;
  for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
    const block = blocks[bIdx];
    if (bIdx > 0) {
      y += density.blockGap; // Espaço sutil entre blocos
    }
    for (let itemIdx = 0; itemIdx < block.items.length; itemIdx++) {
      const item = block.items[itemIdx];
      const nextItem = block.items[itemIdx + 1];

      if (item.type === 'section') {
        const isFollowedBySection = nextItem && nextItem.type === 'section';
        const h = printSectionDynamicsToPdf(doc, item.parsed, x, y, colWidth, isFollowedBySection, density);
        y += h;
      } else if (item.type === 'pair') {
        printCifraLineToPdf(doc, item.chordLine, x, y, colWidth, true, density.fontSize);
        printCifraLineToPdf(doc, item.lyricLine, x, y + density.lineHeight, colWidth, false, density.fontSize);
        y += density.lineHeight * 2;
      } else if (item.type === 'single') {
        printCifraLineToPdf(doc, item.line, x, y, colWidth, item.isChord, density.fontSize);
        y += density.lineHeight;
      } else if (item.type === 'spacer') {
        y += item.height;
      }
    }
  }
  return y;
}

interface PackedPdfPage {
  col1: SongBlock[];
  col2: SongBlock[];
  h1: number;
  h2: number;
  lines1: number;
  lines2: number;
}

function measureBlocksHeight(blocks: SongBlock[], blockGap: number): number {
  let total = 0;
  for (let i = 0; i < blocks.length; i++) {
    total += blocks[i].height + (i > 0 ? blockGap : 0);
  }
  return total;
}

function sumBlockLines(blocks: SongBlock[]): number {
  let total = 0;
  for (const b of blocks) {
    total += b.lineUnits;
  }
  return total;
}

function findBalancedTwoColSplit(
  remainingBlocks: SongBlock[],
  availColHeight: number,
  blockGap: number
): number | null {
  if (remainingBlocks.length === 0) return 0;
  if (remainingBlocks.length === 1) {
    return remainingBlocks[0].height <= availColHeight ? 1 : null;
  }

  let bestSplit: number | null = null;
  let minDiff = Infinity;
  let curH1 = 0;

  for (let i = 0; i < remainingBlocks.length - 1; i++) {
    curH1 += remainingBlocks[i].height + (i > 0 ? blockGap : 0);
    if (curH1 > availColHeight) break;

    let curH2 = 0;
    let validH2 = true;
    for (let j = i + 1; j < remainingBlocks.length; j++) {
      curH2 += remainingBlocks[j].height + (j > i + 1 ? blockGap : 0);
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
      }
    }
  }

  return bestSplit;
}

function packSongPages(
  blocks: SongBlock[],
  firstPageAvailH: number,
  contPageAvailH: number,
  blockGap: number
): PackedPdfPage[] {
  const pages: PackedPdfPage[] = [];
  let curBlockIdx = 0;
  let isFirstPage = true;

  while (curBlockIdx < blocks.length) {
    const availColHeight = isFirstPage ? firstPageAvailH : contPageAvailH;
    const remainingBlocks = blocks.slice(curBlockIdx);
    const balancedSplit = findBalancedTwoColSplit(remainingBlocks, availColHeight, blockGap);

    if (balancedSplit !== null) {
      const col1 = remainingBlocks.slice(0, balancedSplit);
      const col2 = remainingBlocks.slice(balancedSplit);
      pages.push({
        col1,
        col2,
        h1: measureBlocksHeight(col1, blockGap),
        h2: measureBlocksHeight(col2, blockGap),
        lines1: sumBlockLines(col1),
        lines2: sumBlockLines(col2)
      });
      break;
    }

    let col1H = 0;
    let col1EndIdx = 0;
    while (
      curBlockIdx + col1EndIdx < blocks.length &&
      col1H + blocks[curBlockIdx + col1EndIdx].height + (col1EndIdx > 0 ? blockGap : 0) <= availColHeight
    ) {
      col1H += blocks[curBlockIdx + col1EndIdx].height + (col1EndIdx > 0 ? blockGap : 0);
      col1EndIdx++;
    }
    if (col1EndIdx === 0) col1EndIdx = 1;

    const col1 = blocks.slice(curBlockIdx, curBlockIdx + col1EndIdx);
    curBlockIdx += col1EndIdx;

    let col2H = 0;
    let col2EndIdx = 0;
    while (
      curBlockIdx + col2EndIdx < blocks.length &&
      col2H + blocks[curBlockIdx + col2EndIdx].height + (col2EndIdx > 0 ? blockGap : 0) <= availColHeight
    ) {
      col2H += blocks[curBlockIdx + col2EndIdx].height + (col2EndIdx > 0 ? blockGap : 0);
      col2EndIdx++;
    }

    const col2 = blocks.slice(curBlockIdx, curBlockIdx + col2EndIdx);
    curBlockIdx += col2EndIdx;

    pages.push({
      col1,
      col2,
      h1: measureBlocksHeight(col1, blockGap),
      h2: measureBlocksHeight(col2, blockGap),
      lines1: sumBlockLines(col1),
      lines2: sumBlockLines(col2)
    });

    isFirstPage = false;
  }

  return pages;
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
 * Renderiza uma música completa no PDF com algoritmo "Smart Fit" anti-órfãos e distribuição proporcional em 2 colunas:
 * - Seções e dinâmicas são convertidas em badges elegantes e compactos.
 * - Músicas com sobra pequena que gerariam página extra quase vazia ("Continuação" órfã) são compactadas automaticamente em 1 página.
 * - Pares de acorde/letra nunca são quebrados através de colunas ou páginas.
 * - Cada página mantém 2 colunas balanceadas (50% / 50%) respeitando a largura máxima da coluna.
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

  const firstPageStartY = 43;
  const contPageStartY = 22;
  const firstPageAvailH = bottomMargin - firstPageStartY;
  const contPageAvailH = bottomMargin - contPageStartY;

  const normalBlocks = buildSongBlocks(rawContent, PDF_DENSITY_NORMAL);
  if (normalBlocks.length === 0) return;

  const normalPages = packSongPages(normalBlocks, firstPageAvailH, contPageAvailH, PDF_DENSITY_NORMAL.blockGap);

  let selectedDensity: PdfDensityProfile = PDF_DENSITY_NORMAL;
  let selectedPages: PackedPdfPage[] = normalPages;

  // Smart Fit: Detecta sobra pequena na última página (até ~15 linhas ou < 25% da página) para eliminar páginas órfãs
  if (normalPages.length > 1) {
    const normalLast = normalPages[normalPages.length - 1];
    const normalLastLines = normalLast.lines1 + normalLast.lines2;
    const normalLastHeight = normalLast.h1 + normalLast.h2;
    const refPageCapacity = 2 * (normalPages.length === 2 ? firstPageAvailH : contPageAvailH);
    const normalLastRatio = normalLastHeight / refPageCapacity;

    const isSmallOverflow = normalLastLines <= 15 || normalLastRatio < 0.25;

    if (isSmallOverflow) {
      const compactBlocks = buildSongBlocks(rawContent, PDF_DENSITY_COMPACT);
      const compactPages = packSongPages(compactBlocks, firstPageAvailH, contPageAvailH, PDF_DENSITY_COMPACT.blockGap);

      if (compactPages.length < normalPages.length) {
        selectedDensity = PDF_DENSITY_COMPACT;
        selectedPages = compactPages;
      } else {
        const compactLast = compactPages[compactPages.length - 1];
        const compactLastLines = compactLast.lines1 + compactLast.lines2;
        const compactLastRatio = (compactLast.h1 + compactLast.h2) / refPageCapacity;

        // Se o modo compacto ainda deixou sobra pequena, aplica o ajuste fino (tight) para absorver na folha anterior
        if (compactLastLines <= 15 || compactLastRatio < 0.25) {
          const tightBlocks = buildSongBlocks(rawContent, PDF_DENSITY_TIGHT);
          const tightPages = packSongPages(tightBlocks, firstPageAvailH, contPageAvailH, PDF_DENSITY_TIGHT.blockGap);
          if (tightPages.length < normalPages.length) {
            selectedDensity = PDF_DENSITY_TIGHT;
            selectedPages = tightPages;
          }
        }
      }
    }
  }

  const pagesWithCol2 = new Set<number>();

  selectedPages.forEach((pagePlan, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage();
      currentSongPage++;

      // Cabeçalho de continuação apenas quando houver conteúdo substancial na página extra
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`${titlePrefix}${opt.song.title} (Continuação)`, margin, 13);
      doc.setDrawColor(220, 225, 230);
      doc.setLineWidth(0.25);
      doc.line(margin, 15.5, pageWidth - margin, 15.5);
    }

    const pageStartY = pageIndex === 0 ? firstPageStartY : contPageStartY;
    renderBlocksToColumn(doc, pagePlan.col1, col1X, pageStartY, colWidth, selectedDensity);
    if (pagePlan.col2.length > 0) {
      renderBlocksToColumn(doc, pagePlan.col2, col2X, pageStartY, colWidth, selectedDensity);
      pagesWithCol2.add(currentSongPage);
    }
  });

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


