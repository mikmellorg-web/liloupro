// Comprehensive Bible command and reference parser for Portuguese speech and text input

export interface BibleBookInfo {
  name: string;
  abbrev: string;
  chapters: number;
  aliases: string[];
}

export interface BibleParsedCommand {
  bookName: string;
  chapter: number;
  verse?: number;
  displayText: string;
}

export const CANONICAL_BIBLE_BOOKS: BibleBookInfo[] = [
  // Antigo Testamento
  { name: "Gênesis", abbrev: "Gn", chapters: 50, aliases: ["genesis", "gn", "gen"] },
  { name: "Êxodo", abbrev: "Êx", chapters: 40, aliases: ["exodo", "ex", "êx"] },
  { name: "Levítico", abbrev: "Lv", chapters: 27, aliases: ["levitico", "lv", "lev"] },
  { name: "Números", abbrev: "Nm", chapters: 36, aliases: ["numeros", "nm", "nu", "num"] },
  { name: "Deuteronômio", abbrev: "Dt", chapters: 34, aliases: ["deuteronomio", "dt", "deut"] },
  { name: "Josué", abbrev: "Js", chapters: 24, aliases: ["josue", "js", "jos"] },
  { name: "Juízes", abbrev: "Jz", chapters: 21, aliases: ["juizes", "jz", "juiz"] },
  { name: "Rute", abbrev: "Rt", chapters: 4, aliases: ["rute", "rt", "rut"] },
  { name: "1 Samuel", abbrev: "1Sm", chapters: 31, aliases: ["1 samuel", "1samuel", "1 sm", "1sm", "1 sam", "primeiro samuel", "primeira samuel", "1º samuel", "1° samuel"] },
  { name: "2 Samuel", abbrev: "2Sm", chapters: 24, aliases: ["2 samuel", "2samuel", "2 sm", "2sm", "2 sam", "segundo samuel", "segunda samuel", "2º samuel", "2° samuel"] },
  { name: "1 Reis", abbrev: "1Rs", chapters: 22, aliases: ["1 reis", "1reis", "1 rs", "1rs", "primeiro reis", "1º reis", "1° reis"] },
  { name: "2 Reis", abbrev: "2Rs", chapters: 25, aliases: ["2 reis", "2reis", "2 rs", "2rs", "segundo reis", "2º reis", "2° reis"] },
  { name: "1 Crônicas", abbrev: "1Cr", chapters: 29, aliases: ["1 cronicas", "1cronicas", "1 cr", "1cr", "primeiro cronicas", "primeira cronicas", "1º cronicas", "1° cronicas"] },
  { name: "2 Crônicas", abbrev: "2Cr", chapters: 36, aliases: ["2 cronicas", "2cronicas", "2 cr", "2cr", "segundo cronicas", "segunda cronicas", "2º cronicas", "2° cronicas"] },
  { name: "Esdras", abbrev: "Ed", chapters: 10, aliases: ["esdras", "ed", "ez"] },
  { name: "Neemias", abbrev: "Ne", chapters: 13, aliases: ["neemias", "ne", "neem"] },
  { name: "Ester", abbrev: "Et", chapters: 10, aliases: ["ester", "et", "est"] },
  { name: "Jó", abbrev: "Jó", chapters: 42, aliases: ["jo", "jó"] },
  { name: "Salmos", abbrev: "Sl", chapters: 150, aliases: ["salmos", "salmo", "sl", "sal"] },
  { name: "Provérbios", abbrev: "Pv", chapters: 31, aliases: ["proverbios", "proverbio", "pv", "prov"] },
  { name: "Eclesiastes", abbrev: "Ec", chapters: 12, aliases: ["eclesiastes", "ec", "ecl"] },
  { name: "Cânticos", abbrev: "Ct", chapters: 8, aliases: ["canticos", "cantico dos canticos", "cantares", "cantares de salomao", "cantico", "ct"] },
  { name: "Isaías", abbrev: "Is", chapters: 66, aliases: ["isaias", "is", "isa"] },
  { name: "Jeremias", abbrev: "Jr", chapters: 52, aliases: ["jeremias", "jr", "jer"] },
  { name: "Lamentações", abbrev: "Lm", chapters: 5, aliases: ["lamentacoes", "lamentacoes de jeremias", "lm", "lam"] },
  { name: "Ezequiel", abbrev: "Ez", chapters: 48, aliases: ["ezequiel", "ez", "eze"] },
  { name: "Daniel", abbrev: "Dn", chapters: 12, aliases: ["daniel", "dn", "dan"] },
  { name: "Oseias", abbrev: "Os", chapters: 14, aliases: ["oseias", "os", "ose"] },
  { name: "Joel", abbrev: "Jl", chapters: 3, aliases: ["joel", "jl", "joe"] },
  { name: "Amós", abbrev: "Am", chapters: 9, aliases: ["amos", "am", "amo"] },
  { name: "Obadias", abbrev: "Ob", chapters: 1, aliases: ["obadias", "ob", "oba"] },
  { name: "Jonas", abbrev: "Jn", chapters: 4, aliases: ["jonas", "jn", "jon"] },
  { name: "Miqueias", abbrev: "Mq", chapters: 7, aliases: ["miqueias", "mq", "miq"] },
  { name: "Naum", abbrev: "Na", chapters: 3, aliases: ["naum", "na", "nau"] },
  { name: "Habacuque", abbrev: "Hc", chapters: 3, aliases: ["habacuque", "hc", "hab"] },
  { name: "Sofonias", abbrev: "Sf", chapters: 3, aliases: ["sofonias", "sf", "sof"] },
  { name: "Ageu", abbrev: "Ag", chapters: 2, aliases: ["ageu", "ag", "age"] },
  { name: "Zacarias", abbrev: "Zc", chapters: 14, aliases: ["zacarias", "zc", "zac"] },
  { name: "Malaquias", abbrev: "Ml", chapters: 4, aliases: ["malaquias", "ml", "mal"] },

  // Novo Testamento
  { name: "Mateus", abbrev: "Mt", chapters: 28, aliases: ["mateus", "mt", "mat"] },
  { name: "Marcos", abbrev: "Mc", chapters: 16, aliases: ["marcos", "mc", "mar", "marck", "marco"] },
  { name: "Lucas", abbrev: "Lc", chapters: 24, aliases: ["lucas", "lc", "luc"] },
  { name: "João", abbrev: "Jo", chapters: 21, aliases: ["joao", "jo", "jão"] },
  { name: "Atos", abbrev: "At", chapters: 28, aliases: ["atos", "atos dos apostolos", "at", "ato"] },
  { name: "Romanos", abbrev: "Rm", chapters: 16, aliases: ["romanos", "rm", "rom"] },
  { name: "1 Coríntios", abbrev: "1Co", chapters: 16, aliases: ["1 corintios", "1corintios", "1 co", "1co", "1 cor", "primeiro corintios", "primeira corintios", "1º corintios", "1° corintios"] },
  { name: "2 Coríntios", abbrev: "2Co", chapters: 13, aliases: ["2 corintios", "2corintios", "2 co", "2co", "2 cor", "segundo corintios", "segunda corintios", "2º corintios", "2° corintios"] },
  { name: "Gálatas", abbrev: "Gl", chapters: 6, aliases: ["galatas", "gl", "gal"] },
  { name: "Efésios", abbrev: "Ef", chapters: 6, aliases: ["efesios", "ef", "efe"] },
  { name: "Filipenses", abbrev: "Fp", chapters: 4, aliases: ["filipenses", "fp", "fil"] },
  { name: "Colossenses", abbrev: "Cl", chapters: 4, aliases: ["colossenses", "cl", "col"] },
  { name: "1 Tessalonicenses", abbrev: "1Ts", chapters: 5, aliases: ["1 tessalonicenses", "1tessalonicenses", "1 ts", "1ts", "primeiro tessalonicenses", "primeira tessalonicenses", "1º tessalonicenses", "1° tessalonicenses"] },
  { name: "2 Tessalonicenses", abbrev: "2Ts", chapters: 3, aliases: ["2 tessalonicenses", "2tessalonicenses", "2 ts", "2ts", "segundo tessalonicenses", "segunda tessalonicenses", "2º tessalonicenses", "2° tessalonicenses"] },
  { name: "1 Timóteo", abbrev: "1Tm", chapters: 6, aliases: ["1 timoteo", "1timoteo", "1 tm", "1tm", "primeiro timoteo", "primeira timoteo", "1º timoteo", "1° timoteo"] },
  { name: "2 Timóteo", abbrev: "2Tm", chapters: 4, aliases: ["2 timoteo", "2timoteo", "2 tm", "2tm", "segundo timoteo", "segunda timoteo", "2º timoteo", "2° timoteo"] },
  { name: "Tito", abbrev: "Tt", chapters: 3, aliases: ["tito", "tt", "tit"] },
  { name: "Filemon", abbrev: "Fm", chapters: 1, aliases: ["filemon", "fm", "flm"] },
  { name: "Hebreus", abbrev: "Hb", chapters: 13, aliases: ["hebreus", "hb", "heb"] },
  { name: "Tiago", abbrev: "Tg", chapters: 5, aliases: ["tiago", "tg", "tia"] },
  { name: "1 Pedro", abbrev: "1Pe", chapters: 5, aliases: ["1 pedro", "1pedro", "1 pe", "1pe", "1 ped", "primeiro pedro", "primeira pedro", "1º pedro", "1° pedro"] },
  { name: "2 Pedro", abbrev: "2Pe", chapters: 3, aliases: ["2 pedro", "2pedro", "2 pe", "2pe", "2 ped", "segundo pedro", "segunda pedro", "2º pedro", "2° pedro"] },
  { name: "1 João", abbrev: "1Jo", chapters: 5, aliases: ["1 joao", "1joao", "1 jo", "1jo", "primeiro joao", "primeira joao", "1º joao", "1° joao"] },
  { name: "2 João", abbrev: "2Jo", chapters: 1, aliases: ["2 joao", "2joao", "2 jo", "2jo", "segundo joao", "segunda joao", "2º joao", "2° joao"] },
  { name: "3 João", abbrev: "3Jo", chapters: 1, aliases: ["3 joao", "3joao", "3 jo", "3jo", "terceiro joao", "terceira joao", "3º joao", "3° joao"] },
  { name: "Judas", abbrev: "Jd", chapters: 1, aliases: ["judas", "jd", "jud"] },
  { name: "Apocalipse", abbrev: "Ap", chapters: 22, aliases: ["apocalipse", "revelacao", "ap", "apoc"] },
];

/**
 * Normalizes text: strips accents, lowercases, replaces ordinal words with digits,
 * collapses redundant whitespace.
 */
export function normalizeBibleText(raw: string): string {
  if (!raw) return "";
  let text = raw.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Convert common ordinal words from speech recognition into digits
  text = text.replace(/\bprimeir[oa]\b/g, "1")
             .replace(/\b1[º°]\b/g, "1")
             .replace(/\bsegund[oa]\b/g, "2")
             .replace(/\b2[º°]\b/g, "2")
             .replace(/\bterceir[oa]\b/g, "3")
             .replace(/\b3[º°]\b/g, "3");

  return text;
}

/**
 * Checks if the user's intent is simply opening the Bible view without a specific passage
 */
export function isGeneralBibleRequest(rawInput: string): boolean {
  const norm = normalizeBibleText(rawInput);
  if (!norm.includes("biblia")) return false;

  // If there are numbers, it's likely a specific reference request
  if (/\d+/.test(norm)) return false;

  const generalPatterns = [
    "abrir a biblia",
    "abrir biblia",
    "abra a biblia",
    "abra biblia",
    "abre a biblia",
    "ver biblia",
    "ver a biblia",
    "mostrar biblia",
    "ir para a biblia",
    "ir para biblia",
    "acessar a biblia",
    "acessar biblia",
    "ler a biblia",
    "ler biblia",
    "biblia sagrada",
    "biblia do app"
  ];

  return generalPatterns.some(p => norm.includes(p)) || norm === "biblia";
}

/**
 * Intelligently parses spoken or typed commands for Bible passages.
 * Handles inputs like:
 * - "abra a bíblia do app em Marcos capítulo 12 versículo 20"
 * - "abrir a bíblia em Marcos 12:20"
 * - "abrir bíblia no livro de Marcos capitulo 12 versículo 20"
 * - "ler salmo 23 versículo 1"
 * - "abrir a bíblia em 1 Coríntios 13 4"
 * - "Marcos 12 20"
 */
export function parseSpokenBibleCommand(userInput: string): BibleParsedCommand | null {
  if (!userInput || !userInput.trim()) return null;

  let norm = normalizeBibleText(userInput);

  // Do not intercept explanatory study questions meant for AI
  if (
    norm.startsWith("o que significa") ||
    norm.startsWith("oque significa") ||
    norm.startsWith("o que quer dizer") ||
    norm.startsWith("oque quer dizer") ||
    norm.startsWith("explique") ||
    norm.startsWith("significado de") ||
    norm.startsWith("quem foi") ||
    norm.startsWith("por que") ||
    norm.startsWith("porque")
  ) {
    return null;
  }

  // Strip non-essential carrier prefixes like "abra a biblia do app em", "ler na biblia", etc.
  const carrierPhrases = [
    /^(?:por favor\s+|por gentileza\s+)?(?:abra|abrir|abre|abram|ver|veja|ler|leia|ir para|mostrar|mostre|acesse|acessar)\s+(?:a\s+)?(?:biblia|passagem|texto|palavra)(?:\s+(?:sagrada|do\s+app|do\s+aplicativo))?(?:\s+(?:no\s+livro\s+de|livro\s+de|livro|evangelho\s+de|evangelho\s+segundo|evangelho|carta\s+aos|epistola\s+aos|em|no|na))?\s+/i,
    /^(?:biblia\s+(?:sagrada\s+|do\s+app\s+|do\s+aplicativo\s+)?(?:no\s+livro\s+de|livro\s+de|livro|em|no|na)\s+)/i,
    /^(?:no\s+livro\s+de|livro\s+de|no\s+livro|livro|evangelho\s+de|evangelho\s+segundo|evangelho)\s+/i,
    /^(?:abra|abrir|abre|veja|ver|leia|ler)\s+(?:o\s+|a\s+)?(?:livro\s+de\s+|evangelho\s+de\s+)?/i,
  ];

  for (const regex of carrierPhrases) {
    norm = norm.replace(regex, "");
  }

  // Also strip trailing qualifiers like "na biblia", "na biblia do app"
  norm = norm.replace(/\s+(?:na\s+biblia(?:\s+do\s+app)?|pela\s+biblia)$/i, "").trim();

  // Look for book match in CANONICAL_BIBLE_BOOKS
  // We sort books by longest alias first so "1 João" is checked before "João", "1 Coríntios" before "Coríntios", etc.
  let matchedBook: BibleBookInfo | null = null;
  let matchedAlias = "";

  // Prepare aliases sorted by length descending
  const allAliases: { alias: string; book: BibleBookInfo }[] = [];
  for (const book of CANONICAL_BIBLE_BOOKS) {
    const list = [book.name.toLowerCase(), book.abbrev.toLowerCase(), ...book.aliases];
    for (const a of list) {
      const normA = normalizeBibleText(a);
      allAliases.push({ alias: normA, book });
    }
  }
  allAliases.sort((a, b) => b.alias.length - a.alias.length);

  for (const item of allAliases) {
    // Check if norm starts with this alias, or contains it as a distinct word
    const boundaryRegex = new RegExp(`(^|\\b)${item.alias}(\\b|$)`, "i");
    if (boundaryRegex.test(norm)) {
      matchedBook = item.book;
      matchedAlias = item.alias;
      break;
    }
  }

  if (!matchedBook) {
    return null;
  }

  // Strip the matched book alias from the start/middle to analyze remaining chapter/verse
  let remaining = norm.replace(new RegExp(`(^|\\b)${matchedAlias}(\\b|$)`, "i"), " ").trim();

  // Normalize separator markers
  remaining = remaining.replace(/\bcapitulo\b|\bcap\b/gi, "C");
  remaining = remaining.replace(/\bversiculo[s]?\b|\bvers\b|\bver\b|\bv\b/gi, "V");

  let chapter = 1;
  let verse: number | undefined = undefined;

  // Case 1: Pattern with explicit markers like "C 12 V 20" or "12 : 20" or "12 V 20"
  const explicitMarker = remaining.match(/(?:C\s*)?(\d+)\s*(?:V|:)\s*(\d+)/i);
  if (explicitMarker) {
    chapter = parseInt(explicitMarker[1], 10);
    verse = parseInt(explicitMarker[2], 10);
  } else {
    // Case 2: Just space-separated numbers or single number, e.g. "12 20" or "12" or "C 12"
    const numberMatches = remaining.match(/\d+/g);
    if (numberMatches && numberMatches.length > 0) {
      chapter = parseInt(numberMatches[0], 10);
      if (numberMatches.length > 1) {
        verse = parseInt(numberMatches[1], 10);
      }
    }
  }

  // Safety clamps: validate chapter
  if (isNaN(chapter) || chapter < 1) {
    chapter = 1;
  } else if (chapter > matchedBook.chapters) {
    chapter = matchedBook.chapters;
  }

  // Safety clamps: validate verse
  if (verse !== undefined && (isNaN(verse) || verse < 1)) {
    verse = undefined;
  }

  const displayText = verse 
    ? `${matchedBook.name} ${chapter}:${verse}` 
    : `${matchedBook.name} ${chapter}`;

  return {
    bookName: matchedBook.name,
    chapter,
    verse,
    displayText
  };
}
