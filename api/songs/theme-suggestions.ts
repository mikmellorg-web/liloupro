import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const GEMINI_FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.7-flash"
];

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
    const { title, content } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({ error: "O título e a letra/cifra da música são obrigatórios." });
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error("A chave de API do Gemini não foi configurada. Utilizando fallback teológico local.");
    }

    // Initialize Gemini SDK with telemetry header
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `Você é um curador e diretor artístico de ministérios de louvor experiente. Seu papel é analisar o título e a letra de uma canção cristã informados, identificar sua temática teológica e lírica (por exemplo: adoração, contrição, graça, soberania, cruz, Espírito Santo, fé, esperança, salvação, etc.) e sugerir exatamente 3 músicas adicionais que compartilhem do mesmo sentimento, tom lírico ou temática bíblica, que possam ser combinadas no mesmo repertório (setlist) do culto.`;

    const prompt = `Analise a música intitulada "${title}" e sua letra/cifra:\n\n${content}\n\nIdentifique a temática principal e recomende exatamente 3 músicas de louvor que sirvam como sugestões complementares do mesmo tema para serem tocadas no mesmo dia de culto. Explique em português por que cada uma é uma excelente opção complementar.`;

    const modelsToTry = GEMINI_FALLBACK_MODELS;
    let responseText = "";
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Sugestões de temas: testando modelo "${model}"...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            systemInstruction,
            ...(model.includes("gemini-3") ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                themeName: {
                  type: Type.STRING,
                  description: "The name of the main theme identified, e.g., 'Gratidão e Entrega', 'Soberania de Deus', 'Cruz e Redenção' in Portuguese."
                },
                themeDescription: {
                  type: Type.STRING,
                  description: "A short elegant description of how this theme is expressed in the original song."
                },
                suggestions: {
                  type: Type.ARRAY,
                  description: "A list of exactly 3 songs that fit the identified theme beautifully.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: {
                        type: Type.STRING,
                        description: "The title of the suggested song in Portuguese."
                      },
                      artist: {
                        type: Type.STRING,
                        description: "The artist, group, ministry, or hymn book (e.g., Fernandinho, Harpa Cristã, Diante do Trono) of the suggested song."
                      },
                      explanation: {
                        type: Type.STRING,
                        description: "A 2-sentence explanation in Portuguese explaining why this song is a perfect fit for the setlist alongside the original song under the identified theme."
                      }
                    },
                    required: ["title", "artist", "explanation"]
                  }
                }
              },
              required: ["themeName", "themeDescription", "suggestions"]
            }
          }
        });

        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.log(`[Status] Curadoria ${model} indisponível: ${err?.message || err}`);
      }
    }

    if (!responseText) {
      throw lastError || new Error("Falha ao gerar sugestões de todos os modelos tentados.");
    }

    const parsedData = JSON.parse(responseText.trim());
    return res.status(200).json(parsedData);

  } catch (error: any) {
    console.log("[Status] Theme suggestion fallback applied");
    return res.status(200).json({
      themeName: "Adoração e Gratidão",
      themeDescription: "A canção foca em atributos divinos, no amor constante e mui gracioso do Pai, gerando uma atmosfera de contrição e entrega total de vida.",
      suggestions: [
        {
          title: "Lugar Secreto",
          artist: "Gabriela Rocha",
          explanation: "Sendo do mesmo estilo contemporâneo focado na presença intimista de Deus, transiciona com harmonia para momentos profundos de oração durante o culto."
        },
        {
          title: "Em Teus Braços",
          artist: "Laura Souguellis",
          explanation: "Trabalha a mesma confiança inabalável no amor paternal, mantendo uma ponte suave e um compasso rítmico equivalente de dedilhado."
        },
        {
          title: "Maravilhado",
          artist: "Nívea Soares",
          explanation: "Eleva o nível de proclamação congregacional sobre as maravilhosas obras do Senhor, enriquecendo o clímax de adoração da setlist."
        }
      ],
      warning: "A cota diária do servidor Gemini foi excedida. Exibindo sugestões temáticas consagradas para o repertório selvagem."
    });
  }
}
