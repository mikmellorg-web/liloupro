import { GoogleGenAI, Type } from "@google/genai";

// Modelos ativos para leitura multimodal de PDF (digital ou escaneado)
const PDF_EXTRACTION_MODELS = [
  "gemini-4-hydrogen",
  "gemini-2.5-flash",
  "gemini-flash-latest"
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
    ) {
      return false;
    }
    return true;
  };

  if (isValid(key1)) return key1;
  if (isValid(key2)) return key2;
  return key1 || key2;
}

function cleanExtractedTitle(raw: string, fallbackFileName?: string): string {
  let title = String(raw || "")
    .replace(/\r?\n/g, " ")
    .replace(/^\s*(?:\d{1,3}\s*[-–.)\]]\s*)/, "")
    .replace(/\s*[-–|]?\s*(?:p[aá]g(?:ina)?\.?\s*\d+(?:\s*(?:de|\/)\s*\d+)?|\(\s*\d+\s*\/\s*\d+\s*\))\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!title && fallbackFileName) {
    title = fallbackFileName
      .replace(/\.pdf$/i, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  return title || "Música Importada";
}

function cleanExtractedKey(raw: string): string {
  const cleaned = String(raw || "")
    .replace(/^tom\s*[:=-]?\s*/i, "")
    .trim();
  const match = cleaned.match(/^([A-G][#b]?)(m(?:in|enor)?)?/i);
  if (!match) return "C";
  const root = match[1].charAt(0).toUpperCase() + match[1].slice(1);
  const minor = match[2] && !/maj|7M/i.test(cleaned) ? "m" : "";
  return `${root}${minor}`;
}

function cleanExtractedBpm(raw: any): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const numMatch = String(raw).match(/\d{2,3}/);
  if (!numMatch) return null;
  const parsed = Math.round(Number(numMatch[0]));
  if (Number.isFinite(parsed) && parsed >= 40 && parsed <= 220) {
    return parsed;
  }
  return null;
}

function cleanExtractedCifra(raw: string): string {
  if (!raw) return "";
  // Preserva estritamente espaços à esquerda e internos das linhas de acordes; apenas normaliza quebras de linha e tabs
  const lines = String(raw)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "    ")
    .replace(/\u00A0/g, " ")
    .split("\n");

  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    // Remove rodapés comuns de páginas e URLs de sites de cifras
    if (/^(?:https?:\/\/|www\.)\S+$/i.test(trimmed)) return false;
    if (/(?:cifraclub\.com\.br|letras\.mus\.br|superpartituras\.com|bananacifras\.com)/i.test(trimmed)) return false;
    if (/^(?:p[aá]gina|pag\.?|pg\.?)\s*\d+(?:\s*(?:de|\/)\s*\d+)?$/i.test(trimmed)) return false;
    if (/^-?\s*\d+\s*\/\s*\d+\s*-?$/.test(trimmed)) return false;
    return true;
  });

  // Remove apenas espaços excedentes à direita de cada linha (NUNCA aplica .trim() à esquerda!)
  const normalized: string[] = [];
  let consecutiveEmpty = 0;
  for (const line of filtered) {
    const rightTrimmed = line.replace(/ +$/g, "");
    if (rightTrimmed.trim() === "") {
      consecutiveEmpty += 1;
      if (normalized.length > 0 && consecutiveEmpty <= 1) {
        normalized.push("");
      }
    } else {
      consecutiveEmpty = 0;
      normalized.push(rightTrimmed);
    }
  }

  while (normalized.length > 0 && normalized[normalized.length - 1] === "") {
    normalized.pop();
  }

  // Se uma estrofe inteira estiver recuada à direita no PDF, remove apenas o recuo comum da estrofe
  // na mesma proporção tanto da linha de acordes quanto da linha da letra
  const stanzas: string[][] = [];
  let currentStanza: string[] = [];
  for (const line of normalized) {
    if (line === "") {
      if (currentStanza.length > 0) {
        stanzas.push(currentStanza);
        currentStanza = [];
      }
    } else {
      currentStanza.push(line);
    }
  }
  if (currentStanza.length > 0) {
    stanzas.push(currentStanza);
  }

  const dedentedStanzas = stanzas.map((stanzaLines) => {
    let minCommonIndent = Infinity;
    for (const l of stanzaLines) {
      if (!l) continue;
      const match = l.match(/^( *)/);
      const leading = match ? match[1].length : 0;
      if (leading < minCommonIndent) {
        minCommonIndent = leading;
      }
    }
    if (!Number.isFinite(minCommonIndent) || minCommonIndent <= 0) {
      return stanzaLines.join("\n");
    }
    return stanzaLines.map((l) => l.slice(minCommonIndent)).join("\n");
  });

  return dedentedStanzas.join("\n\n");
}

export const PDF_CHORDS_SYSTEM_INSTRUCTION = `Você é um especialista sênior em transcrição e extração 100% fiel de cifras musicais (louvor e adoração) a partir de arquivos PDF — tanto PDFs digitais quanto PDFs escaneados/fotografados (OCR visual).

REGRAS CRÍTICAS E INVIOLÁVEIS DE EXTRAÇÃO:
1. SUPORTE A 1 MÚSICA OU CADERNO MULTI-MÚSICAS:
   - Analise todas as páginas do PDF do início ao fim.
   - Se o PDF contiver 1 música, retorne um array "songs" com 1 objeto.
   - Se o PDF for um caderno/coletânea com várias músicas, separe CADA música corretamente em seu próprio objeto dentro de "songs", na ordem em que aparecem no documento.
   - Não misture letras ou acordes de músicas diferentes.

2. METADADOS LIMPOS:
   - "titulo": Título limpo da música, SEM numeração de índice (ex: remova "01 - ", "1. ") e SEM números de página.
   - "artista": Cantor, banda ou ministério se aparecer no cabeçalho/subtítulo; caso não conste, retorne string vazia "".
   - "tom": Tom musical principal (ex: "C", "G", "D", "Am", "F#m", "Bb") retirado do cabeçalho (ex: "Tom: G") ou inferido harmonicamente dos acordes principais da canção.
   - "bpm": Número inteiro do andamento (BPM) se indicado no PDF (entre 40 e 220), ou 0 se não informado.

3. PROIBIDO INVENTAR OU INSERIR ETIQUETAS DE SEÇÃO:
   - Mantenha EXCLUSIVAMENTE os marcadores de seção que JÁ ESTIVEREM ESCRITOS no PDF original (ex.: se o PDF só tem "[Intro]", mantenha apenas "[Intro]").
   - É ESTRITAMENTE PROIBIDO inserir "[Verso 1]", "[Verso 2]", "[Refrão]", "[Ponte]", "[Final]" ou qualquer outra tag onde o PDF original possui apenas estrofes separadas por linha em branco!

4. PRESERVAÇÃO EXATA DO ALINHAMENTO ACORDE × SÍLABA EM FONTE MONOESPAÇADA ("cifra"):
   - Considere que a cifra final será exibida em FONTE MONOESPAÇADA (cada caractere ocupa exatamente a mesma largura horizontal).
   - Alinhe cada acorde usando ESPAÇOS EM BRANCO EXATOS (" ") para que a primeira letra do acorde fique na MESMA COLUNA DE CARACTERES da sílaba/palavra correspondente na linha da letra logo abaixo.
   - Exemplo prático: se na letra "Em Espírito, em verdade" o acorde "F" está posicionado sobre a sílaba "pí" de "Espírito" (coluna 5) e o acorde "C/F" está sobre a sílaba "ver" de "verdade" (coluna 16), a linha de acordes DEVE conter exatamente os 5 espaços iniciais antes de "F" e os espaços exatos entre "F" e "C/F":
     "     F          C/F"
     "Em Espírito, em verdade"
   - NUNCA remova os espaços iniciais da linha de acordes e NUNCA colapse os espaços entre os acordes!
   - Se uma estrofe inteira estiver recuada/indentada à direita no PDF (como um bloco com Tab), remova apenas o recuo comum tanto da linha de acordes quanto da linha da letra na mesma proporção, mantendo o alinhamento relativo Acorde × Sílaba 100% intacto.
   - Mantenha linhas em branco separando cada estrofe exatamente como no PDF.
   - Remova apenas rodapés, números de página ("Página 1 de 4", "1/2") e links de sites externos.`;

export const PDF_CHORDS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    songs: {
      type: Type.ARRAY,
      description: "Lista completa de músicas extraídas do PDF (1 item para cifra individual ou múltiplos itens para caderno/coletânea).",
      items: {
        type: Type.OBJECT,
        properties: {
          titulo: {
            type: Type.STRING,
            description: "Título limpo da música, sem números de página ou numeração de índice."
          },
          artista: {
            type: Type.STRING,
            description: "Nome do artista, cantor ou ministério se identificado no PDF; caso contrário string vazia."
          },
          tom: {
            type: Type.STRING,
            description: "Tom musical (ex: C, G, D, Am, F#m, Bb) extraído do cabeçalho ou inferido dos acordes."
          },
          bpm: {
            type: Type.INTEGER,
            description: "Andamento em BPM se informado no PDF (40-220), ou 0 caso não conste."
          },
          cifra: {
            type: Type.STRING,
            description: "Cifra completa em texto monoespaçado preservando com exatidão os espaços iniciais e internos de cada linha de acordes na mesma coluna da sílaba correspondente da letra abaixo, mantendo apenas os marcadores de seção existentes no PDF (sem inventar [Verso], [Refrão], etc.)."
          }
        },
        required: ["titulo", "artista", "tom", "bpm", "cifra"]
      }
    }
  },
  required: ["songs"]
};

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { fileName, base64Data } = req.body || {};

    if (!base64Data || typeof base64Data !== "string") {
      return res.status(400).json({ error: "Arquivo PDF inválido ou ausente." });
    }

    const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/i, "").trim();
    if (!cleanBase64 || cleanBase64.length < 32) {
      return res.status(400).json({ error: "Conteúdo do PDF vazio ou corrompido." });
    }

    // Limite de segurança (~25MB em arquivo original)
    if (cleanBase64.length > 35 * 1024 * 1024) {
      return res.status(413).json({
        error: `O arquivo "${fileName || "PDF"}" ultrapassa o limite de 25 MB. Se for um PDF escaneado muito pesado, comprima-o antes de importar.`
      });
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(503).json({
        error: "Serviço de leitura com IA temporariamente indisponível (chave Gemini não configurada)."
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const promptText = `Extraia todas as músicas e cifras contidas neste arquivo PDF${fileName ? ` ("${fileName}")` : ""} com 100% de fidelidade visual ao original:
- NÃO invente nem adicione etiquetas de seção ([Verso 1], [Refrão], [Ponte], etc.): mantenha EXCLUSIVAMENTE os marcadores que já estiverem escritos no PDF. Onde houver apenas linha em branco entre estrofes, mantenha apenas a linha em branco.
- Fonte monoespaçada: posicione cada acorde usando espaços em branco exatos para que a primeira letra do acorde fique na mesma coluna de caracteres da sílaba correspondente na linha da letra logo abaixo (incluindo os espaços iniciais antes do primeiro acorde da linha).
- Se uma estrofe inteira estiver recuada à direita no PDF, remova apenas o recuo comum tanto da linha de acordes quanto da linha da letra na mesma proporção.
- Remova números de página, rodapés e links de sites.`;

    let responseText = "";
    let lastError: any = null;

    for (const model of PDF_EXTRACTION_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: cleanBase64
                  }
                },
                {
                  text: promptText
                }
              ]
            }
          ],
          config: {
            systemInstruction: PDF_CHORDS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: PDF_CHORDS_RESPONSE_SCHEMA
          }
        });

        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[PDF Extract] Modelo ${model} indisponível:`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error("Não foi possível ler este PDF com a IA no momento.");
    }

    let parsed: any;
    try {
      const cleanedJson = responseText
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "");
      parsed = JSON.parse(cleanedJson);
    } catch {
      throw new Error("A IA retornou um formato inesperado ao ler este PDF. Tente novamente.");
    }

    const rawSongs = Array.isArray(parsed?.songs) ? parsed.songs : [];
    const normalizedSongs = rawSongs
      .map((item: any) => {
        const cifra = cleanExtractedCifra(item?.cifra || "");
        const titulo = cleanExtractedTitle(item?.titulo || "", rawSongs.length === 1 ? fileName : undefined);
        const artista = String(item?.artista || "").replace(/\r?\n/g, " ").trim();
        const tom = cleanExtractedKey(item?.tom || "");
        const bpm = cleanExtractedBpm(item?.bpm);

        return {
          titulo,
          artista,
          tom,
          bpm,
          cifra
        };
      })
      .filter((song: any) => song.titulo.trim().length > 0 && song.cifra.trim().length > 0);

    return res.status(200).json({
      songs: normalizedSongs,
      fileName: fileName || "arquivo.pdf"
    });
  } catch (error: any) {
    console.error("[PDF Extract API] Erro:", error?.message || error);
    const msg = String(error?.message || "");
    if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate")) {
      return res.status(429).json({
        error: "O serviço de leitura com IA está com alta demanda no momento. Aguarde alguns segundos e tente novamente."
      });
    }
    return res.status(500).json({
      error: error?.message || "Erro ao extrair cifras do PDF. Verifique se o arquivo está legível e tente novamente."
    });
  }
}
