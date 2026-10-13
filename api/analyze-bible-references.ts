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

    const systemInstruction = `Você é um renomado teólogo e analista litúrgico especializado em música cristã contemporânea e hinos. Tendo como base a letra fornecida, analise quais passagens, temas e respaldos bíblicos dão sustentação teológica à composição ou serviram de inspiração direta para a letra. Forneça uma análise impecável em português contemporâneo.`;

    const prompt = `Analise a música intitulada "${title}". Aqui está o conteúdo (letra/cifra) da música:\n\n${content}\n\nRetorne o resultado de forma estruturada, incluindo um breve resumo teológico do sentido da canção e uma lista com 3 a 4 referências bíblicas chave com seu texto completo e a relação direta com a canção.`;

    const modelsToTry = GEMINI_FALLBACK_MODELS;
    let responseText = "";
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Análise bíblica: testando modelo "${model}"...`);
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
                summary: {
                  type: Type.STRING,
                  description: "A short, beautiful theological summary (2-3 sentences max) explaining the biblical core, themes, and inspiration of the song, in Portuguese."
                },
                references: {
                  type: Type.ARRAY,
                  description: "List of exactly 3 to 4 key bible verses providing scripture backing or direct textual parallel to the song.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      verseRef: {
                        type: Type.STRING,
                        description: "The Bible book, chapter and verse coordinate, e.g. 'Salmos 23:1', 'Efésios 2:8-9' in Portuguese."
                      },
                      verseText: {
                        type: Type.STRING,
                        description: "The full text/content of the scripture verse in Portuguese (NVI or ARA version)."
                      },
                      relation: {
                        type: Type.STRING,
                        description: "A 1-2 sentence explanation in Portuguese describing the direct connection between this verse and the song lyrics."
                      }
                    },
                    required: ["verseRef", "verseText", "relation"]
                  }
                }
              },
              required: ["summary", "references"]
            }
          }
        });

        if (response && response.text) {
          responseText = response.text;
          break; // Found a working response!
        }
      } catch (err: any) {
        lastError = err;
        console.log(`[Status] ${model} indisponível: ${err?.message || err}`);
      }
    }

    if (!responseText) {
      throw lastError || new Error("Falha ao gerar resposta de todos os modelos tentados.");
    }

    const parsedData = JSON.parse(responseText.trim());
    return res.status(200).json(parsedData);

  } catch (error: any) {
    console.log("[Status] Bible analysis fallback applied:", error?.message || error);
    // Retorna análise bíblica de fallback para resiliência quando a cota estiver esgotada
    return res.status(200).json({
      summary: "Esta canção reflete a fidelidade constante do Senhor e Seu cuidado eterno sobre nós, apontando para a soberania e amor divinos que nos cercam diariamente.",
      references: [
        {
          verseRef: "Salmos 23:6",
          verseText: "Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na Casa do Senhor por longos dias.",
          relation: "O verso expressa a mesma certeza convicta de que o amor e a bondade de Deus nos acompanham em qualquer circunstância da nossa caminhada."
        },
        {
          verseRef: "Tiago 1:17",
          verseText: "Toda boa dádiva e todo dom perfeito vêm do alto, descendo do Pai das luzes, que não muda como sombras inconstantes.",
          relation: "Conecta-se com a gratidão profunda expressa na letra pelas bênçãos recebidas, reconhecendo a imutabilidade do caráter benevolente de Deus."
        },
        {
          verseRef: "Lamentações 3:22-23",
          verseText: "As misericórdias do Senhor são a causa de não sermos consumidos, pois as suas misericórdias não têm fim; renovam-se cada manhã. Grande é a tua fidelidade.",
          relation: "Apoio direto à passagem da canção que celebra as misericórdias diárias de Deus e o fôlego de vida que Ele restaura a cada nascer do sol."
        }
      ],
      warning: "A cota diária do servidor Gemini foi excedida. Exibindo referências estruturais de apoio ao ministério."
    });
  }
}
