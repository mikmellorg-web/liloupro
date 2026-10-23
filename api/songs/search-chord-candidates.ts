import { GoogleGenAI } from "@google/genai";
import { findLocalPopularSong } from "../../src/songsDatabase.js";

function getGeminiApiKey(): string | undefined {
  const key1 = process.env.GEMINI_API_KEY;
  const key2 = process.env.GEMINI_API_KEY2;
  const key3 = process.env.VITE_GEMINI_API_KEY;

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
  if (isValid(key3)) return key3;
  return key1 || key2 || key3;
}

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

async function verifyCandidate(url: string, searchedTitle: string, searchedArtist?: string) {
  try {
    let html = '';

    // 1. Tentativa de fetch direto com cabeçalhos de navegador e Referer
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': 'https://www.cifraclub.com.br/'
        },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const bodyText = await res.text();
        if (bodyText.includes('<pre') || bodyText.includes('data-chord-container') || bodyText.includes('cifra_cnt')) {
          html = bodyText;
        }
      }
    } catch {}

    // 2. Camada resiliente de alta disponibilidade (leitor de borda) se o fetch direto for barrado por WAF (Akamai/Cloudflare)
    if (!html) {
      try {
        const readerUrl = `https://r.jina.ai/${url}`;
        const resReader = await fetch(readerUrl, {
          headers: {
            'X-Return-Format': 'html',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
          },
          signal: AbortSignal.timeout(4500)
        });
        if (resReader.ok) {
          const bodyText = await resReader.text();
          if (bodyText.includes('<pre') || bodyText.includes('data-chord-container') || bodyText.includes('cifra_cnt') || bodyText.includes('data-chord-page')) {
            html = bodyText;
          }
        }
      } catch {}
    }

    if (!html) return null;

    // Extrai título e artista do <title> oficial
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    if (!titleMatch) return null;

    const rawTitle = titleMatch[1].replace(/\s*-\s*Cifra Club/i, '').trim();
    const parts = rawTitle.split(' - ');
    if (parts.length < 2) return null;

    const extractedArtist = parts[parts.length - 1].trim();
    const extractedTitle = parts.slice(0, -1).join(' - ').trim();

    // Validação estrita: não aceita páginas de erro ou home ("Cifra Club - Seu site...")
    if (extractedTitle.toLowerCase().includes('cifra club') || extractedArtist.toLowerCase().includes('cifra club')) {
      return null;
    }

    // Validação de correspondência do título
    const normSearchedTitle = slugify(searchedTitle).replace(/-/g, ' ');
    const normExtractedTitle = slugify(extractedTitle).replace(/-/g, ' ');

    const titleMatches = normExtractedTitle.includes(normSearchedTitle) || normSearchedTitle.includes(normExtractedTitle);
    if (!titleMatches) return null;

    // Se o artista foi especificado pelo usuário, valida correspondência exata ou aproximada do artista
    if (searchedArtist && searchedArtist.trim()) {
      const normSearchedArtist = slugify(searchedArtist).replace(/-/g, ' ');
      const normExtractedArtist = slugify(extractedArtist).replace(/-/g, ' ');
      const artistMatches = normExtractedArtist.includes(normSearchedArtist) || normSearchedArtist.includes(normExtractedArtist);
      if (!artistMatches) return null;
    }

    // Extração do tom (key)
    let key = "C";
    const toneMatch = html.match(/data-anchor=["']--chord-tone["'][^>]*>([\s\S]*?)<\/button>/i) ||
                      html.match(/Tom(?:<!-- -->)?:\s*<\/span>\s*<button[^>]*>([\s\S]*?)<\/button>/i) ||
                      html.match(/id="cifra_tom"[^>]*>[\s\S]*?>([^<]+)<\/a>/i);
    if (toneMatch) {
      key = toneMatch[1].replace(/<[^>]*>/g, '').trim().split(/[\s(]/)[0].trim() || "C";
    }

    return {
      title: extractedTitle,
      artist: extractedArtist,
      key,
      url,
      source: "cifraclub.com.br"
    };
  } catch {
    return null;
  }
}

function classifySearchError(err: any): { status: 'quota_exceeded' | 'service_unavailable' | 'error'; message: string } {
  if (!err) return { status: 'error', message: 'Falha temporária ao pesquisar na web.' };
  const statusCode = err?.status || err?.statusCode;
  const msg = (err?.message || String(err)).toLowerCase();

  if (statusCode === 429 || msg.includes("429") || msg.includes("resource_exhausted") || msg.includes("quota") || msg.includes("rate limit")) {
    return {
      status: 'quota_exceeded',
      message: 'O serviço de pesquisa atingiu temporariamente o limite de uso. Tente novamente mais tarde ou prossiga com o cadastro manual.'
    };
  }

  if (statusCode === 503 || msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand") || msg.includes("temporarily unavailable") || msg.includes("overloaded")) {
    return {
      status: 'service_unavailable',
      message: 'O serviço de pesquisa online está temporariamente indisponível. Tente novamente em instantes ou prossiga com o cadastro manual.'
    };
  }

  return {
    status: 'error',
    message: 'Não foi possível completar a pesquisa na web no momento. Você pode prosseguir com o cadastro manual.'
  };
}

// Vercel Serverless Function: Pesquisa de Candidatos de Cifra
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
    const { title, artist } = req.body || {};
    const trimmedTitle = (title || "").trim();
    const trimmedArtist = (artist || "").trim();

    if (!trimmedTitle) {
      return res.status(400).json({ error: "O título da música é obrigatório.", candidates: [] });
    }

    const candidates: Array<{
      id: string;
      title: string;
      artist: string;
      key?: string;
      source: string;
      badge: string;
      url: string;
      isLocal?: boolean;
      data?: any;
    }> = [];

    // 1. Verificação na base local de músicas populares consolidadas
    const localHit = findLocalPopularSong(trimmedTitle, trimmedArtist);
    if (localHit) {
      candidates.push({
        id: `local_${slugify(localHit.title)}`,
        title: localHit.title,
        artist: localHit.artist,
        key: localHit.key,
        source: "LiLouPro Base Verificada",
        badge: "Oficial Lilou",
        url: `local:${localHit.title}`,
        isLocal: true,
        data: localHit
      });
    }

    const urlsToVerify = new Set<string>();

    // 2. Se o usuário informou o artista, gera URLs diretas para verificação
    if (trimmedArtist) {
      const artistSlug = slugify(trimmedArtist);
      const titleSlug = slugify(trimmedTitle);
      if (artistSlug && titleSlug) {
        urlsToVerify.add(`https://www.cifraclub.com.br/${artistSlug}/${titleSlug}/`);
        urlsToVerify.add(`https://www.cifraclub.com.br/${artistSlug}/${titleSlug}/simplificada.html`);
      }
    }

    // 3. Pesquisa real na Web via Google Search Grounding (Gemini 2.5 Flash)
    let searchFailure: { status: 'quota_exceeded' | 'service_unavailable' | 'error'; message: string } | null = null;
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const searchQuery = trimmedArtist
          ? `site:cifraclub.com.br "${trimmedTitle}" "${trimmedArtist}" cifra`
          : `site:cifraclub.com.br "${trimmedTitle}" cifra`;

        const prompt = `Realize uma pesquisa no Google por: ${searchQuery}.
Identifique páginas de cifras no Cifra Club (cifraclub.com.br) para a canção "${trimmedTitle}"${trimmedArtist ? ` do artista "${trimmedArtist}"` : ""}.
Retorne estritamente um array JSON de objetos contendo os links reais encontrados:
[
  {
    "title": "título exato",
    "artist": "nome do artista",
    "url": "https://www.cifraclub.com.br/slug-artista/slug-musica/"
  }
]
Apenas URLs válidas do domínio cifraclub.com.br.`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        const text = geminiRes.text || '';

        // Extrai JSON estruturado se presente
        const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (item.url && typeof item.url === 'string' && item.url.includes('cifraclub.com.br')) {
                  const cleanUrl = item.url.trim().replace(/\/+$/, '') + '/';
                  urlsToVerify.add(cleanUrl);
                }
              }
            }
          } catch {}
        }

        // Extrai URLs do Cifra Club via Regex direto do texto
        const urlMatches = text.match(/https?:\/\/(?:www\.)?cifraclub\.com\.br\/[a-z0-9\-]+\/[a-z0-9\-]+\/?/gi) || [];
        for (const u of urlMatches) {
          urlsToVerify.add(u.trim().replace(/\/+$/, '') + '/');
        }

        // Extrai URLs de grounding chunks se fornecido pelo Google Search Grounding
        try {
          const groundingChunks = (geminiRes as any)?.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (Array.isArray(groundingChunks)) {
            for (const chunk of groundingChunks) {
              const uri = chunk?.web?.uri;
              if (uri && typeof uri === 'string' && uri.includes('cifraclub.com.br')) {
                const cleanUrl = uri.trim().replace(/\/+$/, '') + '/';
                urlsToVerify.add(cleanUrl);
              }
            }
          }
        } catch {}
      } catch (searchErr: any) {
        const classified = classifySearchError(searchErr);
        searchFailure = classified;

        // Extração diagnóstica segura para inspeção nos logs da Vercel (sem expor credenciais)
        let httpStatus = searchErr?.status ?? searchErr?.statusCode ?? searchErr?.response?.status ?? null;
        let technicalCode = searchErr?.code ?? searchErr?.error?.code ?? searchErr?.response?.data?.error?.code ?? null;
        let internalStatus = searchErr?.error?.status ?? searchErr?.response?.data?.error?.status ?? null;
        let rawMessage = searchErr?.message ?? searchErr?.error?.message ?? searchErr?.response?.data?.error?.message ?? String(searchErr);

        // Se a mensagem contiver uma string JSON (padrão de ApiError do Google: {"error":{"code":429,"message":"...","status":"RESOURCE_EXHAUSTED"}}),
        // analisa em try/catch seguro apenas para preencher campos ausentes mantendo prioridade das propriedades diretas
        if (typeof rawMessage === 'string' && rawMessage.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(rawMessage);
            const errObj = parsed?.error ?? parsed;
            if (errObj && typeof errObj === 'object') {
              if (technicalCode === null && errObj.code !== undefined) {
                technicalCode = errObj.code;
              }
              if (internalStatus === null && errObj.status !== undefined) {
                internalStatus = errObj.status;
              }
              if (httpStatus === null && typeof errObj.code === 'number') {
                httpStatus = errObj.code;
              }
              if (errObj.message && typeof errObj.message === 'string') {
                rawMessage = errObj.message;
              }
            }
          } catch {}
        }

        const sanitizedMessage = typeof rawMessage === 'string'
          ? rawMessage.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
          : String(rawMessage);

        const diagnosticDetails = {
          httpStatus,
          technicalCode,
          internalStatus,
          classifiedAs: classified.status,
          message: sanitizedMessage
        };

        console.error('[search-chord-candidates] Diagnóstico de Erro Gemini/Google:', JSON.stringify(diagnosticDetails));
      }
    } else {
      searchFailure = {
        status: 'error',
        message: 'Chave de busca não configurada no servidor. Prossiga com o cadastro manual.'
      };
    }

    // 4. Validação rigorosa dos candidatos diretamente na página do Cifra Club
    const verificationPromises = Array.from(urlsToVerify).map(async (url) => {
      return await verifyCandidate(url, trimmedTitle, trimmedArtist);
    });

    const verifiedResults = await Promise.all(verificationPromises);

    for (const verified of verifiedResults) {
      if (verified) {
        const isSimplificada = verified.url.includes('simplificada');
        candidates.push({
          id: `cifraclub_${slugify(verified.artist)}_${slugify(verified.title)}${isSimplificada ? '_simp' : ''}`,
          title: isSimplificada ? `${verified.title} (Simplificada)` : verified.title,
          artist: verified.artist,
          key: verified.key,
          badge: isSimplificada ? 'Simplificada' : 'Versão Principal',
          source: 'cifraclub.com.br',
          url: verified.url
        });
      }
    }

    // 5. Desduplica por URL e por Artista+Título
    const seen = new Set<string>();
    const uniqueCandidates = candidates.filter(cand => {
      const key = `${cand.title.toLowerCase()}_${cand.artist.toLowerCase()}_${cand.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Se encontrou candidatos verificados com sucesso
    if (uniqueCandidates.length > 0) {
      return res.status(200).json({
        candidates: uniqueCandidates,
        status: 'success',
        error: null
      });
    }

    // Se NÃO encontrou candidatos e houve falha de busca externa (429, 503, erro de rede)
    if (searchFailure) {
      return res.status(200).json({
        candidates: [],
        status: searchFailure.status,
        error: searchFailure.message
      });
    }

    // Pesquisa concluída com sucesso sem resultados correspondentes
    return res.status(200).json({
      candidates: [],
      status: 'no_results',
      error: null
    });
  } catch (err: any) {
    const outerStatus = err?.status ?? err?.statusCode ?? 500;
    const outerMessage = (err?.message || String(err)).replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]');
    console.error("[search-chord-candidates] Erro inesperado:", JSON.stringify({ status: outerStatus, message: outerMessage }));
    return res.status(500).json({
      candidates: [],
      status: 'error',
      error: "Falha inesperada ao processar a pesquisa. Você pode continuar com o cadastro manual."
    });
  }
}
