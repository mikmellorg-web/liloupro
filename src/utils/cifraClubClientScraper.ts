// Client-side fallback scraper for Cifra Club
// Works directly in the browser if the server-side API is unavailable or returns 404

export interface ScrapedSongData {
  title: string;
  artist: string;
  key: string;
  bpm: number;
  timeSignature: string;
  chords: string;
  lyrics: string;
  capo?: string;
  artistImageUrl?: string;
}

export function parseCifraClubHtml(html: string, fallbackTitle = '', fallbackArtist = ''): ScrapedSongData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Title and Artist
  let title = fallbackTitle;
  let artist = fallbackArtist;

  const h1 = doc.querySelector('h1');
  if (h1 && h1.textContent) {
    const rawH1 = h1.textContent.replace(/<!--[\s\S]*?-->/g, '').trim();
    if (rawH1 && !rawH1.toLowerCase().includes('cifra club')) {
      title = rawH1;
    }
  }

  const titleTag = doc.querySelector('title');
  if (titleTag && titleTag.textContent) {
    const cleanTitle = titleTag.textContent.replace(/\s*-\s*Cifra Club/i, '').trim();
    const parts = cleanTitle.split(' - ');
    if (parts.length >= 2) {
      if (!artist) artist = parts[parts.length - 1].trim();
      if (!title) title = parts.slice(0, -1).join(' - ').trim();
    } else if (!title) {
      title = cleanTitle;
    }
  }

  // Key (Tom)
  let key = 'C';
  const toneEl = doc.querySelector('[data-anchor="--chord-tone"], [id="cifra_tom"], [data-key], .js-tom');
  if (toneEl && toneEl.textContent) {
    const rawKey = toneEl.textContent.trim().split(/[\s(]/)[0];
    if (rawKey) key = rawKey;
  }
  key = key.replace('m7m', 'm7').replace('min7', 'm7').replace('7+', '7M').replace('maj7', '7M').replace('M7', '7M').trim();

  // Capo
  let capo = '';
  const capoEl = doc.querySelector('[data-anchor="--chord-capo"], [id="cifra_capo"]');
  if (capoEl && capoEl.textContent) {
    capo = capoEl.textContent.trim();
  }

  // Artist Image
  let artistImageUrl = '';
  const metaImg = doc.querySelector('meta[property="og:image"]');
  if (metaImg) {
    artistImageUrl = metaImg.getAttribute('content') || '';
  }

  // Chords and Lyrics
  const pre = doc.querySelector('pre, .cifra_cnt');
  let chords = '';
  let lyrics = '';

  if (pre) {
    // Clone to manipulate
    const clone = pre.cloneNode(true) as HTMLElement;
    const rawText = clone.innerHTML
      .replace(/<div\b[^>]*>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n');

    const lines = rawText.split(/\r?\n/);
    const chordsLines: string[] = [];
    const lyricsLines: string[] = [];

    for (const rawLine of lines) {
      const stripped = rawLine.replace(/<[^>]*>/g, '').trim();
      if (!stripped) {
        chordsLines.push('');
        continue;
      }

      // Tab check
      const isTab = /^[a-gA-G1-9]#?[b]?\s*[\|:]/.test(stripped) && stripped.includes('-') ||
                    (stripped.includes('|') && stripped.match(/-{2,}/) !== null) ||
                    /^-{3,}$/.test(stripped) ||
                    /\[Tab\b/i.test(stripped);

      if (isTab) continue;

      let chordLine = rawLine
        .replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, '$1')
        .replace(/<span\b[^>]*>([\s\S]*?)<\/span>/gi, '$1')
        .replace(/<[^>]*>/g, '')
        .replace(/m7m/g, 'm7')
        .replace(/min7/g, 'm7')
        .replace(/7\+/g, '7M')
        .replace(/maj7/g, '7M')
        .replace(/M7/g, '7M');

      chordsLines.push(chordLine);

      const lyricLine = rawLine
        .replace(/<b\b[^>]*>[\s\S]*?<\/b>/gi, '')
        .replace(/<span\b[^>]*class=["']?(?:cifra|tab|tablatura|chord)["']?[^>]*>[\s\S]*?<\/span>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const isSection = /^\[[^\]]+\]$/.test(lyricLine);
      if ((/[a-zA-ZÀ-ÿ]{2,}/.test(lyricLine) && !/^\[Tab/i.test(lyricLine)) || isSection) {
        lyricsLines.push(lyricLine);
      } else if (stripped === '') {
        if (lyricsLines.length > 0 && lyricsLines[lyricsLines.length - 1] !== '') {
          lyricsLines.push('');
        }
      }
    }

    chords = chordsLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    lyrics = lyricsLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  return {
    title: title || 'Sem Título',
    artist: artist || '',
    key: key || 'C',
    bpm: 120,
    timeSignature: '4/4',
    chords,
    lyrics,
    capo,
    artistImageUrl
  };
}

export async function fetchCifraClubDirect(targetUrl: string): Promise<ScrapedSongData> {
  const proxyUrls = [
    targetUrl,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
  ];

  for (const pUrl of proxyUrls) {
    try {
      const res = await fetch(pUrl);
      if (res.ok) {
        const html = await res.text();
        if (html.includes('<pre') || html.includes('cifra_cnt')) {
          return parseCifraClubHtml(html);
        }
      }
    } catch {
      // Continue to next proxy
    }
  }

  throw new Error('Não foi possível carregar a página do Cifra Club via navegador.');
}
