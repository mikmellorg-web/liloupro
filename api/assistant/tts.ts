import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

/**
 * =========================================================================
 * VOZ OFICIAL DO LILOU - CONFIGURAÇÃO DE IDENTIDADE VOCAL DO SISTEMA
 * =========================================================================
 * Identidade vocal oficial: Voz masculina de estúdio 'Puck' via Gemini TTS.
 * NÃO ALTERE, SUBSTITUA, DEGRADE OU TROQUE ESTA CONFIGURAÇÃO EM NENHUMA ATUALIZAÇÃO
 * DO APLICATIVO, REFATORAÇÃO OU MUDANÇA DE CÓDIGO SEM AUTORIZAÇÃO EXPLÍCITA DO USUÁRIO.
 * =========================================================================
 */
const LILOU_OFFICIAL_VOICE_CONFIG = {
  voiceName: 'Puck' as const,
  gender: 'male' as const,
  engine: 'gemini-tts' as const,
  model: 'gemini-3.8-flash-tts' as const,
  fallbackModel: 'gemini-3.8-flash-lite-tts' as const,
  style: 'Voz masculina brasileira jovem, natural, clara, amigável e conversacional',
  mimeType: 'audio/wav' as const,
} as const;

// Cache em memória para o ciclo de vida da Serverless Function
const assistantTtsCache = new Map<string, string>();
let isDiskCacheLoaded = false;

function loadTtsDiskCache() {
  if (isDiskCacheLoaded) return;
  const candidateCachePaths = [
    path.join(process.cwd(), 'assistant_tts_cache.json'),
    path.join(process.cwd(), 'public', 'assistant_tts_cache.json'),
  ];

  for (const cachePath of candidateCachePaths) {
    try {
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, 'utf8');
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string') {
            assistantTtsCache.set(k.toLowerCase().trim(), v);
          }
        }
        isDiskCacheLoaded = true;
        break;
      }
    } catch {}
  }
}

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

export default async function handler(req: any, res: any) {
  // Configuração padrão de CORS para endpoints na Vercel
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
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "O texto é obrigatório." });
    }

    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/[#_*~`]/g, '')
      .replace(/🎙️|🎵|📖|🗓️|➕|📺|✓/g, '')
      .trim();

    if (!cleanText) {
      return res.status(400).json({ error: "Texto vazio." });
    }

    const cacheKey = cleanText.toLowerCase();

    // 1. Tenta carregar e consultar o cache de áudio oficial pré-gerado
    loadTtsDiskCache();
    if (assistantTtsCache.has(cacheKey)) {
      return res.json({
        audioBase64: assistantTtsCache.get(cacheKey),
        mimeType: LILOU_OFFICIAL_VOICE_CONFIG.mimeType,
        cached: true
      });
    }

    // 2. Síntese ao vivo com Gemini TTS caso a frase ainda não esteja no cache
    const apiKey = getGeminiApiKey();
    let audioBase64: string | undefined;

    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const modelsToTry = [LILOU_OFFICIAL_VOICE_CONFIG.model, LILOU_OFFICIAL_VOICE_CONFIG.fallbackModel];

      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: cleanText,
                    speechMetadata: {
                      style: LILOU_OFFICIAL_VOICE_CONFIG.style
                    }
                  }
                ]
              }
            ] as any,
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: LILOU_OFFICIAL_VOICE_CONFIG.voiceName }
                }
              }
            }
          });

          audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (audioBase64) break;
        } catch (mErr: any) {
          console.warn(`[Vercel TTS] Model ${model} unavailable:`, mErr?.message?.slice(0, 100));
        }
      }
    }

    // 3. Se a síntese ao vivo não estiver disponível, não substitui por frase arbitrária ou incompatível
    if (!audioBase64) {
      return res.status(503).json({ error: "Não foi possível sintetizar a frase solicitada no momento." });
    }

    // Salva em memória para requisições subsequentes
    assistantTtsCache.set(cacheKey, audioBase64);

    return res.json({
      audioBase64,
      mimeType: LILOU_OFFICIAL_VOICE_CONFIG.mimeType
    });
  } catch (err: any) {
    console.warn("[Assistant TTS Serverless Error]:", err?.message || err);
    return res.status(500).json({ error: "Erro interno no processamento de TTS." });
  }
}
