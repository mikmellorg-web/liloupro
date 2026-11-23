import { GoogleGenAI, Type } from "@google/genai";
import { findLocalPopularSong } from "../../src/songsDatabase.js";
import { cleanCifraHtml, pairChordsAndLyricsIfSeparated } from "../../src/services/chordService.js";

function getGeminiApiKey(): string | undefined {
  const key1 = process.env.GEMINI_API_KEY;
  const key2 = process.env.GEMINI_API_KEY2;

  const isValid = (key: string | undefined): boolean => {
    if (!key) return false;
    const trimmed = key.trim();
    if (
      trimmed === "" ||
      trimmed === "MY_GEMINI_API_KEY" ||
      trimmed === "YOUR_GEMINI_API_KEY" ||
      trimmed === "GEMINI_API_KEY" ||
      trimmed.startsWith("MY_") ||
      trimmed.startsWith("YOUR_")
    ) return false;
    return true;
  };

  if (isValid(key1)) return key1;
  if (isValid(key2)) return key2;
  return key1 || key2;
}

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
    const { url, title: bodyTitle, artist: bodyArtist } = req.body || {};
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

    if (songSlug.endsWith('-simplificada')) {
      const normalSlug = songSlug.replace(/-simplificada$/, '');
      targetUrls.push(`https://www.cifraclub.com.br/${artistSlug}/${normalSlug}/`);
    }

    if (artistSlug.startsWith('banda-')) {
      const strippedArtist = artistSlug.replace(/^banda-/, '');
      targetUrls.push(`https://www.cifraclub.com.br/${strippedArtist}/${songSlug}/`);
      targetUrls.push(`https://www.cifraclub.com.br/${strippedArtist}/${songSlug}`);
    } else {
      targetUrls.push(`https://www.cifraclub.com.br/banda-${artistSlug}/${songSlug}/`);
      targetUrls.push(`https://www.cifraclub.com.br/banda-${artistSlug}/${songSlug}`);
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
        console.log('[CIFRACLUB-DIAG]', response.status, response.headers.get('server'), new URL(targetUrl).hostname);
        if (response.ok) {
          const bodyText = await response.text();
          if (bodyText.includes('<pre') || bodyText.includes('data-chord-container') || bodyText.includes('cifra_cnt')) {
            html = bodyText;
            break;
          }
        }
      } catch (e) {
        console.warn('Fetch error:', targetUrl, e);
      }
    }

    // Camada resiliente de alta disponibilidade (leitor de borda) se o fetch direto for barrado por WAF
    if (!html) {
      for (const targetUrl of targetUrls) {
        try {
          const readerUrl = `https://r.jina.ai/${targetUrl}`;
          const response = await fetch(readerUrl, {
            headers: {
              'X-Return-Format': 'html',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
          });
          if (response.ok) {
            const bodyText = await response.text();
            if (bodyText.includes('<pre') || bodyText.includes('data-chord-container') || bodyText.includes('cifra_cnt')) {
              html = bodyText;
              break;
            }
          }
        } catch (resErr: any) {
          console.warn('Resilient reader fetch error:', targetUrl, resErr);
        }
      }
    }

    // Direct scrape processing if HTML obtained
    if (html) {
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

      let capo = '';
      const capoMatch = html.match(/data-anchor=["']--chord-capo["'][^>]*>([\s\S]*?)<\/button>/i) ||
                        html.match(/id="cifra_capo"[^>]*>([\s\S]*?)<\/span>/i);
      if (capoMatch) {
        capo = htmlDecode(capoMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
      }

      let artistImageUrl = '';
      const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
      if (ogImage) artistImageUrl = htmlDecode(ogImage[1].trim());

      const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i) ||
                       html.match(/<div[^>]*class=["'][^"']*cifra_cnt[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

      if (preMatch) {
        let preHtml = preMatch[1];
        // Remove internal newlines trapped inside HTML tags/attributes
        preHtml = preHtml.replace(/<[^>]+>/g, (tag) => tag.replace(/\r?\n/g, ' '));

        preHtml = preHtml
          .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
          .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
          .replace(/<div\b[^>]*>/gi, '\n')
          .replace(/<\/div>/gi, '')
          .replace(/<p\b[^>]*>/gi, '\n')
          .replace(/<\/p>/gi, '')
          .replace(/<br\s*\/?>/gi, '\n');

        const rawLines = preHtml.split(/\r?\n/);
        const cleanedChordsLines: string[] = [];
        const lyricLines: string[] = [];
        let prevWasEmpty = false;

        for (const rawLine of rawLines) {
          const stripped = htmlDecode(rawLine.replace(/<[^>]*>/g, '')).trim();
          if (stripped === '') {
            if (!prevWasEmpty && cleanedChordsLines.length > 0) {
              cleanedChordsLines.push('');
              prevWasEmpty = true;
            }
            continue;
          }
          prevWasEmpty = false;

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
          const isChordOnly = /^(?:[A-G][b#]?(?:m|M|maj|min|dim|aug|sus|[0-9])*(?:\/[A-G][b#]?)?\s*|\([^\)]*\)\s*)+$/.test(cleanLine);
          const hasContent = (/[a-zA-ZÀ-ÿ]{2,}/.test(cleanLine) && !isTabHeader && !isChordOnly) || isSectionHeader;

          if (hasContent) {
            lyricLines.push(cleanLine);
          } else if (stripped === '') {
            if (lyricLines.length > 0 && lyricLines[lyricLines.length - 1] !== '') {
              lyricLines.push('');
            }
          }
        }

        const chordsClean = cleanedChordsLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        const lyricsClean = lyricLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

        if (chordsClean.length > 20) {
          const sanitizeValidBpm = (val: unknown): number | null => {
            const num = typeof val === 'number' ? val : Number(String(val ?? '').replace(/[^\d.]/g, ''));
            if (!Number.isFinite(num)) return null;
            const rounded = Math.round(num);
            return rounded >= 40 && rounded <= 220 ? rounded : null;
          };

          const sanitizeTimeSig = (val: unknown): string | null => {
            const m = String(val ?? '').trim().match(/\b(2\/4|3\/4|4\/4|6\/8|9\/8|12\/8)\b/);
            return m ? m[1] : null;
          };

          const lookupTitle = (extractedTitle || (typeof bodyTitle === 'string' ? bodyTitle.trim() : '') || songGuess).trim();
          const lookupArtist = (extractedArtist || (typeof bodyArtist === 'string' ? bodyArtist.trim() : '') || artistGuess).trim();

          let resolvedBpm: number | null = null;
          let timeSignature = '4/4';

          // 1. Extração direta dos metadados HTML ou do texto da cifra
          const htmlBpmPatterns = [
            /"bpm"\s*:\s*"?(\d{2,3})"?/i,
            /\bdata-bpm=["']?(\d{2,3})["']?/i,
            /"tempo"\s*:\s*"?(\d{2,3})"?/i,
            /\bandamento(?:<!-- -->)?\s*[:\-]?\s*(?:<[^>]+>\s*)*(\d{2,3})\s*(?:bpm)?/i
          ];
          for (const rx of htmlBpmPatterns) {
            const m = html.match(rx);
            const candidate = m ? sanitizeValidBpm(m[1]) : null;
            if (candidate) {
              resolvedBpm = candidate;
              break;
            }
          }

          if (!resolvedBpm) {
            const chordBpmMatch = chordsClean.match(/(?:\bbpm\s*[:=\-]?\s*(\d{2,3})\b|\b(\d{2,3})\s*bpm\b|\bandamento\s*[:=\-]?\s*(\d{2,3})\b)/i);
            if (chordBpmMatch) {
              resolvedBpm = sanitizeValidBpm(chordBpmMatch[1] || chordBpmMatch[2] || chordBpmMatch[3]);
            }
          }

          const chordTimeSigMatch = chordsClean.match(/\b(2\/4|3\/4|4\/4|6\/8|9\/8|12\/8)\b/);
          if (chordTimeSigMatch) {
            timeSignature = chordTimeSigMatch[1];
          }

          // 2. Consulta instantânea na base local curada (com validação estrita de título/artista)
          if (!resolvedBpm) {
            const localMetaHit = findLocalPopularSong(lookupTitle, lookupArtist);
            if (localMetaHit) {
              const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
              const lt = norm(localMetaHit.title);
              const qt = norm(lookupTitle);
              const la = norm(localMetaHit.artist);
              const qa = norm(lookupArtist);
              const titleOk = lt === qt || lt.includes(qt) || qt.includes(lt);
              const artistOk = !qa || la.includes(qa) || qa.includes(la);
              const localBpm = titleOk && artistOk ? sanitizeValidBpm(localMetaHit.bpm) : null;
              if (localBpm) {
                resolvedBpm = localBpm;
                const localTs = sanitizeTimeSig(localMetaHit.timeSignature);
                if (localTs) timeSignature = localTs;
              }
            }
          }

          // 3. Consulta real na internet via Gemini (Google Search Grounding -> Fallback JSON estruturado)
          if (!resolvedBpm) {
            const apiKey = getGeminiApiKey();
            if (apiKey) {
              try {
                const ai = new GoogleGenAI({
                  apiKey,
                  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
                });

                const parseBpmResponseText = (rawText: string) => {
                  const text = rawText.trim();
                  const jsonMatch = text.match(/\{[\s\S]*?\}/);
                  if (jsonMatch) {
                    try {
                      const parsed = JSON.parse(jsonMatch[0]);
                      const candidate = sanitizeValidBpm(parsed?.bpm);
                      if (candidate) {
                        resolvedBpm = candidate;
                        const ts = sanitizeTimeSig(parsed?.timeSignature);
                        if (ts) timeSignature = ts;
                        return true;
                      }
                    } catch {
                      // fallback para regex
                    }
                  }
                  const bpmRx = text.match(/"?bpm"?\s*[:=]\s*"?(\d{2,3})"?/i) || text.match(/\b(\d{2,3})\s*bpm\b/i);
                  const candidate = bpmRx ? sanitizeValidBpm(bpmRx[1]) : null;
                  if (candidate) {
                    resolvedBpm = candidate;
                    const ts = sanitizeTimeSig(text);
                    if (ts) timeSignature = ts;
                    return true;
                  }
                  return false;
                };

                // 3A. Busca ativa na internet com Google Search Grounding (TuneBat, SongBPM, MultiTracks, Musicstax, etc.)
                const searchGroundedPromise = (async () => {
                  const searchModels = ['gemini-2.5-flash', 'gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
                  for (const model of searchModels) {
                    try {
                      const response = await ai.models.generateContent({
                        model,
                        contents: `Pesquise na internet (TuneBat, SongBPM, MultiTracks, Musicstax, Chordify ou Cifra Club) o andamento exato em BPM e o compasso da gravação original da música "${lookupTitle}" de "${lookupArtist}". Responda APENAS com JSON válido no formato {"bpm": 74, "timeSignature": "4/4"} (bpm inteiro entre 40 e 220; compasso entre "4/4", "6/8", "3/4", "2/4", "9/8", "12/8"). Nunca use 120 como chute padrão se a música for lenta ou rápida.`,
                        config: {
                          tools: [{ googleSearch: {} }]
                        }
                      });
                      if (response?.text && parseBpmResponseText(response.text)) {
                        return;
                      }
                    } catch {
                      // Tenta o próximo modelo com Google Search
                    }
                  }
                })();

                await Promise.race([
                  searchGroundedPromise,
                  new Promise((resolve) => setTimeout(resolve, 3800))
                ]);

                // 3B. Fallback estruturado ultra-rápido caso a busca web exceda o tempo ou cota
                if (!resolvedBpm) {
                  const structuredModels = [
                    'gemini-2.5-flash',
                    'gemini-4-hydrogen',
                    'gemini-3.1-flash-lite',
                    'gemini-flash-lite-latest',
                    'gemini-flash-latest'
                  ];

                  const structuredPromise = (async () => {
                    for (const model of structuredModels) {
                      try {
                        const config: any = {
                          responseMimeType: 'application/json',
                          responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                              bpm: { type: Type.INTEGER },
                              timeSignature: { type: Type.STRING }
                            },
                            required: ['bpm', 'timeSignature']
                          }
                        };
                        if (model.includes('2.5')) {
                          config.thinkingConfig = { thinkingBudget: 0 };
                        }

                        const response = await ai.models.generateContent({
                          model,
                          contents: `Qual o BPM (andamento exato em batidas por minuto) e o compasso da gravação original da música "${lookupTitle}" de "${lookupArtist}"? Retorne apenas JSON válido {"bpm": número inteiro entre 40 e 220, "timeSignature": "4/4"|"6/8"|"3/4"|"2/4"}. Não use 120 como chute padrão se a música for lenta (ex: 64-78 BPM) ou rápida.`,
                          config
                        });
                        if (response?.text && parseBpmResponseText(response.text)) {
                          return;
                        }
                      } catch {
                        // Tenta o próximo modelo rápido disponível
                      }
                    }
                  })();

                  await Promise.race([
                    structuredPromise,
                    new Promise((resolve) => setTimeout(resolve, 2500))
                  ]);
                }
              } catch {
                // Fallback seguro para não travar a importação
              }
            }
          }

          const bpm = resolvedBpm ?? 120;

          return res.status(200).json({
            title: extractedTitle,
            artist: extractedArtist,
            key,
            bpm,
            timeSignature,
            chords: cleanCifraHtml(chordsClean),
            lyrics: cleanCifraHtml(lyricsClean),
            capo: capo || '',
            artistImageUrl: artistImageUrl || '',
            source: 'cifraclub'
          });
        }
      }
    }

    // MULTI-TIER FALLBACK PIPELINE
    // Tier 1: Local popular songs database - exact match validation only
    const songNameNorm = (songGuess || '').toLowerCase().trim();
    const artistNameNorm = (artistGuess || '').toLowerCase().trim();
    const localHit = findLocalPopularSong(songGuess, artistGuess) || findLocalPopularSong(songSlug, artistSlug);

    if (localHit) {
      const localTitleNorm = localHit.title.toLowerCase().trim();
      const localArtistNorm = localHit.artist.toLowerCase().trim();

      const titleMatches = localTitleNorm === songNameNorm ||
                           localTitleNorm.includes(songNameNorm) ||
                           songNameNorm.includes(localTitleNorm);

      const artistMatches = !artistNameNorm ||
                            localArtistNorm.includes(artistNameNorm) ||
                            artistNameNorm.includes(localArtistNorm);

      if (titleMatches && artistMatches) {
        return res.status(200).json({
          ...localHit,
          chords: cleanCifraHtml(localHit.chords),
          lyrics: cleanCifraHtml(localHit.lyrics),
          capo: '',
          artistImageUrl: '',
          source: 'local'
        });
      }
    }

    // Direct scrape failed and no exact match in curated local base:
    // TRANSPARENT FAILURE - Never hallucinate, guess or generate speculative chords.
    return res.status(422).json({
      error: `Não foi possível acessar a página original da cifra de "${songGuess}" no Cifra Club.`,
      details: 'A página original não pôde ser recuperada no momento (restrição de acesso temporária ou indisponibilidade). Você pode tentar novamente mais tarde ou cadastrar a letra e os acordes manualmente no editor do LiLouPro.'
    });
  } catch (error: any) {
    console.error('[Vercel CifraClub Handler Error]:', error);
    return res.status(500).json({
      error: 'Erro ao processar importação do Cifra Club.',
      details: error?.message || String(error)
    });
  }
}
