// Vercel Serverless Function: Import Cifra Club
export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'A URL do Cifra Club é obrigatória.' });
    }

    let cleanUrl = url.trim().replace(/^["'\\]+|["'\\]+$/g, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(cleanUrl);
    } catch {
      return res.status(400).json({ error: 'URL inválida. Por favor, insira um link válido do Cifra Club.' });
    }

    if (!parsedUrl.hostname.includes('cifraclub.com.br')) {
      return res.status(400).json({ error: 'URL inválida. Por favor, insira uma URL do cifraclub.com.br.' });
    }

    parsedUrl.hostname = 'www.cifraclub.com.br';
    const pathSegments = parsedUrl.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);

    if (pathSegments.length === 0) {
      return res.status(400).json({ error: 'Por favor, insira o link de uma música específica do Cifra Club.' });
    }

    const artistSlug = pathSegments[0] || '';
    let songSlug = (pathSegments[1] || '').replace(/\.html$/i, '');

    const formatSlug = (slug: string) => {
      return slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
        .trim();
    };

    const artistGuess = formatSlug(artistSlug);
    const songGuess = formatSlug(songSlug);

    const targetUrls = [
      `https://www.cifraclub.com.br/${artistSlug}/${songSlug}/`,
      `https://www.cifraclub.com.br/${artistSlug}/${songSlug}`
    ];

    if (/^\d+-/.test(songSlug)) {
      const stripped = songSlug.replace(/^\d+-/, '');
      targetUrls.push(`https://www.cifraclub.com.br/${artistSlug}/${stripped}/`);
    }

    const htmlDecode = (str: string) => {
      return str
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'");
    };

    let html = '';
    for (const targetUrl of targetUrls) {
      try {
        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Referer': 'https://www.cifraclub.com.br/'
          }
        });
        if (response.ok) {
          html = await response.text();
          if (html.includes('<pre') || html.includes('cifra_cnt')) break;
        }
      } catch (e) {
        console.warn('Fetch error:', targetUrl, e);
      }
    }

    if (!html) {
      return res.status(404).json({
        error: 'Não foi possível carregar a página do Cifra Club.',
        details: 'Verifique se o link está correto.'
      });
    }

    // Extract title & artist
    let extractedTitle = songGuess;
    let extractedArtist = artistGuess;

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      const cleanFull = htmlDecode(titleMatch[1].replace(/\s*-\s*Cifra Club/i, '').trim());
      const parts = cleanFull.split(' - ');
      if (parts.length >= 2) {
        extractedArtist = parts[parts.length - 1].trim();
        extractedTitle = parts.slice(0, -1).join(' - ').trim();
      } else {
        extractedTitle = cleanFull;
      }
    }

    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
      const cleanH1 = htmlDecode(h1Match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
      if (cleanH1 && !cleanH1.toLowerCase().includes('cifra club')) {
        extractedTitle = cleanH1;
      }
    }

    // Key
    let key = 'C';
    const toneMatch = html.match(/data-anchor=["']--chord-tone["'][^>]*>([\s\S]*?)<\/button>/i) ||
                      html.match(/Tom(?:<!-- -->)?:\s*<\/span>\s*<button[^>]*>([\s\S]*?)<\/button>/i) ||
                      html.match(/id="cifra_tom"[^>]*>[\s\S]*?>([^<]+)<\/a>/i) ||
                      html.match(/data-key=["']([^"']+)["']/i);
    if (toneMatch) {
      const rawKey = htmlDecode(toneMatch[1].replace(/<[^>]*>/g, '').trim());
      const baseNote = rawKey.split(/[\s(]/)[0].trim();
      if (baseNote) key = baseNote;
    }

    key = key.replace('m7m', 'm7').replace('min7', 'm7').replace('7+', '7M').replace('maj7', '7M').replace('M7', '7M').trim();

    // Capo
    let capo = '';
    const capoMatch = html.match(/data-anchor=["']--chord-capo["'][^>]*>([\s\S]*?)<\/button>/i) ||
                      html.match(/id="cifra_capo"[^>]*>([\s\S]*?)<\/span>/i);
    if (capoMatch) {
      capo = htmlDecode(capoMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
    }

    // Image
    let artistImageUrl = '';
    const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImage) artistImageUrl = htmlDecode(ogImage[1].trim());

    // Chords and lyrics
    const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i) ||
                     html.match(/<div[^>]*class=["'][^"']*cifra_cnt[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

    let chordsClean = '';
    let lyricsClean = '';

    if (preMatch) {
      let preHtml = preMatch[1]
        .replace(/<div\b[^>]*>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n');

      const rawLines = preHtml.split(/\r?\n/);
      const cleanedChordsLines: string[] = [];
      const lyricLines: string[] = [];

      for (const rawLine of rawLines) {
        const stripped = htmlDecode(rawLine.replace(/<[^>]*>/g, '')).trim();
        if (stripped === '') {
          cleanedChordsLines.push('');
          continue;
        }

        const isTab = (
          /^[a-gA-G1-9]#?[b]?\s*[\|:]/.test(stripped) && stripped.includes('-')
        ) || (
          stripped.includes('|') && (stripped.match(/-{2,}/) !== null)
        ) || /^-{3,}$/.test(stripped) || /\[Tab\b/i.test(stripped);

        if (isTab) continue;

        let cleanedChordLine = htmlDecode(
          rawLine
            .replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, '$1')
            .replace(/<span\b[^>]*>([\s\S]*?)<\/span>/gi, '$1')
            .replace(/<[^>]*>/g, '')
        );

        cleanedChordLine = cleanedChordLine
          .replace(/m7m/g, 'm7')
          .replace(/min7/g, 'm7')
          .replace(/7\+/g, '7M')
          .replace(/maj7/g, '7M')
          .replace(/M7/g, '7M');

        cleanedChordsLines.push(cleanedChordLine);

        const lineWithoutChords = rawLine
          .replace(/<b\b[^>]*>[\s\S]*?<\/b>/gi, '')
          .replace(/<span\b[^>]*class=["']?(?:cifra|tab|tablatura|chord)["']?[^>]*>[\s\S]*?<\/span>/gi, '');

        const cleanLine = htmlDecode(lineWithoutChords.replace(/<[^>]*>/g, ''))
          .replace(/\s+/g, ' ')
          .trim();

        const isTabHeader = /^\[Tab/i.test(cleanLine) || /^Riff/i.test(cleanLine);
        const isSectionHeader = /^\[[^\]]+\]$/.test(cleanLine) && !isTabHeader;
        const hasContent = (/[a-zA-ZÀ-ÿ]{2,}/.test(cleanLine) && !isTabHeader) || isSectionHeader;

        if (hasContent) {
          lyricLines.push(cleanLine);
        } else if (stripped === '') {
          if (lyricLines.length > 0 && lyricLines[lyricLines.length - 1] !== '') {
            lyricLines.push('');
          }
        }
      }

      chordsClean = cleanedChordsLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      lyricsClean = lyricLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    return res.status(200).json({
      title: extractedTitle,
      artist: extractedArtist,
      key,
      bpm: 120,
      timeSignature: '4/4',
      chords: chordsClean,
      lyrics: lyricsClean,
      capo: capo || '',
      artistImageUrl: artistImageUrl || ''
    });
  } catch (error: any) {
    console.error('[Vercel CifraClub Handler Error]:', error);
    return res.status(500).json({
      error: 'Erro ao processar importação do Cifra Club.',
      details: error?.message || String(error)
    });
  }
}
