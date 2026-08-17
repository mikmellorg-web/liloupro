import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Check, Copy, AlertCircle, RefreshCw, Sparkles, ChevronDown } from 'lucide-react';
import { getLocalBiblePassage, adaptToNAA } from '../localBibleDb';
import { useAuth } from '../hooks/useAuth';
import { useBibleVersion } from '../contexts/BibleVersionContext';

const BIBLE_BOOKS = [
  { name: "Gênesis", abbrev: "gn", apiId: "Genesis" },
  { name: "Êxodo", abbrev: "ex", apiId: "Exodus" },
  { name: "Levítico", abbrev: "lv", apiId: "Leviticus" },
  { name: "Números", abbrev: "nu", apiId: "Numbers" },
  { name: "Deuteronômio", abbrev: "dt", apiId: "Deuteronomy" },
  { name: "Josué", abbrev: "js", apiId: "Joshua" },
  { name: "Juízes", abbrev: "jz", apiId: "Judges" },
  { name: "Rute", abbrev: "rt", apiId: "Ruth" },
  { name: "1 Samuel", abbrev: "1sm", apiId: "1 Samuel" },
  { name: "2 Samuel", abbrev: "2sm", apiId: "2 Samuel" },
  { name: "1 Reis", abbrev: "1rs", apiId: "1 Kings" },
  { name: "2 Reis", abbrev: "2rs", apiId: "2 Kings" },
  { name: "1 Crônicas", abbrev: "1cr", apiId: "1 Chronicles" },
  { name: "2 Crônicas", abbrev: "2cr", apiId: "2 Chronicles" },
  { name: "Esdras", abbrev: "ez", apiId: "Ezra" },
  { name: "Neemias", abbrev: "ne", apiId: "Nehemiah" },
  { name: "Ester", abbrev: "et", apiId: "Esther" },
  { name: "Jó", abbrev: "jó", apiId: "Job" },
  { name: "Salmos", abbrev: "sl", apiId: "Psalms" },
  { name: "Provérbios", abbrev: "pv", apiId: "Proverbs" },
  { name: "Eclesiastes", abbrev: "ec", apiId: "Ecclesiastes" },
  { name: "Cânticos", abbrev: "ct", apiId: "Song of Solomon" },
  { name: "Isaías", abbrev: "is", apiId: "Isaiah" },
  { name: "Jeremias", abbrev: "jr", apiId: "Jeremiah" },
  { name: "Lamentações", abbrev: "lm", apiId: "Lamentations" },
  { name: "Ezequiel", abbrev: "ez", apiId: "Ezekiel" },
  { name: "Daniel", abbrev: "dn", apiId: "Daniel" },
  { name: "Oseias", abbrev: "os", apiId: "Hosea" },
  { name: "Joel", abbrev: "jl", apiId: "Joel" },
  { name: "Amós", abbrev: "am", apiId: "Amos" },
  { name: "Obadias", abbrev: "ob", apiId: "Obadiah" },
  { name: "Jonas", abbrev: "jn", apiId: "Jonah" },
  { name: "Miqueias", abbrev: "mq", apiId: "Micah" },
  { name: "Naum", abbrev: "na", apiId: "Nahum" },
  { name: "Habacuque", abbrev: "hc", apiId: "Habakkuk" },
  { name: "Sofonias", abbrev: "sf", apiId: "Zephaniah" },
  { name: "Ageu", abbrev: "ag", apiId: "Haggai" },
  { name: "Zacarias", abbrev: "zc", apiId: "Zechariah" },
  { name: "Malaquias", abbrev: "ml", apiId: "Malachi" },
  { name: "Mateus", abbrev: "mt", apiId: "Matthew" },
  { name: "Marcos", abbrev: "mc", apiId: "Mark" },
  { name: "Lucas", abbrev: "lc", apiId: "Luke" },
  { name: "João", abbrev: "jo", apiId: "John" },
  { name: "Atos", abbrev: "at", apiId: "Acts" },
  { name: "Romanos", abbrev: "rm", apiId: "Romans" },
  { name: "1 Coríntios", abbrev: "1co", apiId: "1 Corinthians" },
  { name: "2 Coríntios", abbrev: "2co", apiId: "2 Corinthians" },
  { name: "Gálatas", abbrev: "gl", apiId: "Galatians" },
  { name: "Efésios", abbrev: "ef", apiId: "Ephesians" },
  { name: "Filipenses", abbrev: "fp", apiId: "Philippians" },
  { name: "Colossenses", abbrev: "cl", apiId: "Colossians" },
  { name: "1 Tessalonicenses", abbrev: "1ts", apiId: "1 Thessalonians" },
  { name: "2 Tessalonicenses", abbrev: "2ts", apiId: "2 Thessalonians" },
  { name: "1 Timóteo", abbrev: "1tm", apiId: "1 Timothy" },
  { name: "2 Timóteo", abbrev: "2tm", apiId: "2 Timothy" },
  { name: "Tito", abbrev: "tt", apiId: "Titus" },
  { name: "Filemon", abbrev: "fm", apiId: "Philemon" },
  { name: "Hebreus", abbrev: "hb", apiId: "Hebrews" },
  { name: "Tiago", abbrev: "tg", apiId: "James" },
  { name: "1 Pedro", abbrev: "1pe", apiId: "1 Peter" },
  { name: "2 Pedro", abbrev: "2pe", apiId: "2 Peter" },
  { name: "1 João", abbrev: "1jo", apiId: "1 John" },
  { name: "2 João", abbrev: "2jo", apiId: "2 John" },
  { name: "3 João", abbrev: "3jo", apiId: "3 John" },
  { name: "Judas", abbrev: "jd", apiId: "Jude" },
  { name: "Apocalipse", abbrev: "ap", apiId: "Revelation" }
];

const normalizeText = (t: string) => 
  t.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export function parseBibleReference(userInput: string) {
  const cleanInput = userInput.trim();
  // Regex matches general reference format like "1 Joao 3:16" or "Salmo 23" or "Apocalipse 21:1-4"
  const regex = /^(\d?\s*[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]+)(?:\s+(\d+))?(?:\s*[:\s]\s*(\d+)(?:\s*[-–]\s*(\d+))?)?$/;
  const match = cleanInput.match(regex);
  if (!match) return null;

  const bookQuery = normalizeText(match[1]);
  const chapter = match[2] ? parseInt(match[2], 10) : 1;
  const startVerse = match[3] || "";
  const endVerse = match[4] || "";

  const book = BIBLE_BOOKS.find(b => 
    normalizeText(b.name) === bookQuery || 
    normalizeText(b.abbrev) === bookQuery ||
    normalizeText(b.name.replace(/\s+/g, "")) === bookQuery.replace(/\s+/g, "") ||
    normalizeText(b.abbrev.replace(/\s+/g, "")) === bookQuery.replace(/\s+/g, "")
  );

  if (!book) return null;

  return {
    book,
    chapter,
    verseRange: startVerse ? (endVerse ? `${startVerse}-${endVerse}` : startVerse) : ""
  };
}

interface BibleSearchProps {
  onInsert: (data: { title: string; text: string; version?: string }) => void;
  onInsertDirect?: (data: { title: string; text: string; version: string }) => void;
  onClose?: () => void;
}

// Shared local storage Cache for BibleSearch as well to achieve instant 0ms response
const localBibleCache = new Map<string, { verses: { verse: number; text: string }[]; isFallback: boolean; warning: string | null }>();

const loadLocalCache = () => {
  try {
    const stored = localStorage.getItem('lilo-bible-passages-cache-v4');
    if (stored) {
      const parsed = JSON.parse(stored);
      for (const [k, v] of Object.entries(parsed)) {
        localBibleCache.set(k, v as any);
      }
    }
  } catch (e) {
    console.warn("Could not load local bible cache in search:", e);
  }
};

const saveLocalCache = () => {
  try {
    if (localBibleCache.size > 120) {
      const keys = Array.from(localBibleCache.keys());
      for (let i = 0; i < 30; i++) {
        localBibleCache.delete(keys[i]);
      }
    }
    localStorage.setItem('lilo-bible-passages-cache-v4', JSON.stringify(Object.fromEntries(localBibleCache.entries())));
  } catch (e) {
    console.warn("Could not save local bible cache in search:", e);
  }
};

function filterVersesByRange(verses: { verse: number; text: string }[], rangeStr: string) {
  if (!rangeStr) return verses;
  const match = rangeStr.match(/^(\d+)(?:-(\d+))?$/);
  if (!match) return verses;
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : start;
  return verses.filter(v => v.verse >= start && v.verse <= end);
}

export function BibleSearch({ onInsert, onInsertDirect, onClose }: BibleSearchProps) {
  const [searchTab, setSearchTab] = useState<'text' | 'select'>('text');
  const [searchText, setSearchText] = useState('');
  const { memberData } = useAuth();
  const [bibleVersion, setBibleVersion] = useState<'NAA' | 'NVI' | 'ARC'>('NAA');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  useEffect(() => {
    // No-op or keep empty
  }, [memberData?.defaultBibleVersion]);
  
  // Select fields
  const [selectedBookIndex, setSelectedBookIndex] = useState(18); // Default to Psalms (idx 18)
  const [selectedChapter, setSelectedChapter] = useState('23');
  const [selectedVerse, setSelectedVerse] = useState('1');
  const [selectedEndVerse, setSelectedEndVerse] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [results, setResults] = useState<{ reference: string; text: string; verses: any[] } | null>(null);

  const handleTextSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setResults(null);

    const parsed = parseBibleReference(searchText);
    if (!parsed) {
      setErrorMsg('Referência não compreendida. Use o formato: "Livro Capítulo:Versículo" ou "Livro Capítulo" (Ex: João 3:16 ou Sl 23).');
      setIsLoading(false);
      return;
    }

    try {
      await fetchPassage(parsed.book.apiId, parsed.book.name, parsed.chapter, parsed.verseRange);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Falha ao buscar versículo. Verifique se o livro, capítulo e versículos existem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setResults(null);

    const book = BIBLE_BOOKS[selectedBookIndex];
    const chInt = parseInt(selectedChapter, 10) || 1;
    const startV = selectedVerse.trim();
    const endV = selectedEndVerse.trim();

    let vRange = startV;
    if (startV && endV && parseInt(endV, 10) > parseInt(startV, 10)) {
      vRange = `${startV}-${endV}`;
    }

    try {
      await fetchPassage(book.apiId, book.name, chInt, vRange);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao recuperar passagem. Verifique sua conexão e os dados inseridos.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPassage = async (apiId: string, portugueseName: string, chapter: number, verseRange: string) => {
    loadLocalCache();
    
    // Attempt cache read
    const wholeChapterKey = `${portugueseName}-${chapter}-${bibleVersion}`;
    const specificRangeKey = `${portugueseName}-${chapter}-${verseRange || 'all'}-${bibleVersion}`;
    
    let cachedData: any = null;
    if (localBibleCache.has(wholeChapterKey)) {
      const cached = localBibleCache.get(wholeChapterKey)!;
      const filteredVerses = filterVersesByRange(cached.verses, verseRange);
      cachedData = {
        verses: filteredVerses,
        isFallback: cached.isFallback,
        warning: cached.warning
      };
    } else if (localBibleCache.has(specificRangeKey)) {
      const cached = localBibleCache.get(specificRangeKey)!;
      cachedData = {
        verses: cached.verses,
        isFallback: cached.isFallback,
        warning: cached.warning
      };
    }

    let cachedFallback = false;
    if (cachedData) {
      console.log(`[Search Cache] Serving cached passage for: ${portugueseName} ${chapter}:${verseRange}`);
      let finalRef = `${portugueseName} ${chapter}`;
      if (verseRange) {
        finalRef += `:${verseRange}`;
      }
      finalRef += ` (${bibleVersion})`;

      let cleanText = '';
      if (cachedData.verses && cachedData.verses.length > 0) {
        cleanText = cachedData.verses.map((v: any) => `${v.verse}. ${v.text.trim()}`).join('\n\n');
      } else {
        cleanText = '';
      }

      setResults({
        reference: finalRef,
        text: cleanText,
        verses: cachedData.verses || []
      });
      
      if (!cachedData.isFallback) {
        return;
      }
      cachedFallback = true;
    }

    let data: any = null;
    let fallbackUsed = false;

    // 1. Try our high-fidelity Gemini-powered Bible API that respects the exact chosen version (NAA, ARA, ARC, NVI, NTLH, ACF)
    try {
      const response = await fetch("/api/bible/passage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book: portugueseName,
          chapter,
          verseRange,
          version: bibleVersion
        })
      });

      if (response.ok) {
        const jsonData = await response.json();
        const isDemoMessage = jsonData && !!jsonData.isDemo;
        if (isDemoMessage) {
          console.warn("Local Bible API returned demo instructions. Forcing bible-api.com fallback.");
        } else {
          data = jsonData;
          fallbackUsed = !!jsonData.isFallback;
        }
      } else {
        console.warn(`Local Bible API returned status ${response.status}. Attempting bible-api.com fallback.`);
      }
    } catch (err) {
      console.warn("Error calling local Bible API, falling back to bible-api.com:", err);
    }

    // 2. Fallback to the third-party bible-api.com (defaulting to Almeida)
    if (!data) {
      fallbackUsed = true;
      const bookNameOptions = [
        portugueseName,                // e.g. "Gênesis", "João", "1 João"
        apiId,                         // e.g. "Genesis", "John", "1 John"
        normalizeText(portugueseName)   // e.g. "genesis", "joao"
      ];

      let lastError: any = null;

      for (const nameOpt of bookNameOptions) {
        let queryRef = `${nameOpt} ${chapter}`;
        if (verseRange) {
          queryRef += `:${verseRange}`;
        }

        try {
          const response = await fetch(`https://bible-api.com/${encodeURIComponent(queryRef)}?translation=almeida`);
          if (response.ok) {
            data = await response.json();
            break;
          } else {
            lastError = new Error(`API returned status ${response.status} for ${queryRef}`);
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (!data) {
        console.warn("Could not fetch from any online APIs, utilizing safe local offline database.");
        try {
          const offlineResult = getLocalBiblePassage(portugueseName, chapter, bibleVersion);
          const filteredVerses = filterVersesByRange(offlineResult.verses, verseRange);
          data = {
            verses: filteredVerses,
            isFallback: offlineResult.isFallback,
            warning: offlineResult.warning
          };
        } catch (localDbErr) {
          throw lastError || new Error('Não foi possível obter a passagem bíblica das APIs.');
        }
      }
    }

    if (data && data.verses && bibleVersion === 'NAA') {
      data.verses = data.verses.map((v: any) => ({
        ...v,
        text: adaptToNAA(v.text)
      }));
    }
    
    // Format the reference representation
    let finalRef = `${portugueseName} ${chapter}`;
    if (verseRange) {
      finalRef += `:${verseRange}`;
    }
    finalRef += ` (${bibleVersion})`;

    // Format cleaner text
    let cleanText = '';
    if (data.verses && data.verses.length > 0) {
      cleanText = data.verses.map((v: any) => `${v.verse}. ${v.text.trim()}`).join('\n\n');
    } else {
      cleanText = (data.text || '').trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');
    }

    // Store in local cache to reduce latency next time
    const cacheKeyToSave = verseRange ? specificRangeKey : wholeChapterKey;
    localBibleCache.set(cacheKeyToSave, {
      verses: data.verses || [],
      isFallback: fallbackUsed,
      warning: fallbackUsed ? "Carregado via tradução Almeida clássica como fallback." : null
    });
    saveLocalCache();

    setResults({
      reference: finalRef,
      text: cleanText,
      verses: data.verses || []
    });
  };

  const handleInsertAll = () => {
    if (!results) return;
    onInsert({
      title: results.reference,
      text: results.text,
      version: bibleVersion
    });
  };

  const handleInsertTitle = () => {
    if (!results) return;
    onInsert({
      title: results.reference,
      text: '',
      version: bibleVersion
    });
  };

  const handleInsertText = () => {
    if (!results) return;
    onInsert({
      title: '',
      text: results.text,
      version: bibleVersion
    });
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-xl max-w-full w-full mx-auto space-y-4 text-white bible-search-container">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-brand" />
          <div>
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-brand">Assistente Bíblico Integrado</h4>
            <p className="text-[9px] text-text-muted uppercase tracking-widest leading-none mt-1">Busca Rápida de Versículos (Filtros NAA, NVI, ARC)</p>
          </div>
        </div>
        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-white text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
          >
            Fechar
          </button>
        )}
      </div>

      {/* Tabs & Bible Version Selection */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
        <div className="flex gap-2 flex-1">
          <button
            type="button"
            onClick={() => { setSearchTab('text'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider border transition-all ${
              searchTab === 'text'
                ? 'bg-brand text-white border-brand shadow-md'
                : 'bg-black/20 text-white/60 border-white/5 hover:bg-black/30'
            }`}
          >
            <span>Referência Livre</span>
          </button>
          <button
            type="button"
            onClick={() => { setSearchTab('select'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider border transition-all ${
              searchTab === 'select'
                ? 'bg-brand text-white border-brand shadow-md'
                : 'bg-black/20 text-white/60 border-white/5 hover:bg-black/30'
            }`}
          >
            <span>Livro e Capítulo</span>
          </button>
        </div>
        <div className="relative shrink-0 select-none">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between gap-1.5 bg-black/25 hover:bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white transition-all cursor-pointer h-10 w-full sm:w-32"
          >
            <span className="text-text-muted text-[9px] font-bold">Versão:</span>
            <span className="text-brand font-black">{bibleVersion}</span>
            <ChevronDown size={12} className={`text-text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {dropdownOpen && (
            <>
              {/* Backdrop to close the dropdown */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)} 
              />
              <div className="absolute right-0 mt-1.5 w-full bg-zinc-950 border border-white/10 rounded-xl shadow-xl p-1.5 z-50 flex flex-col gap-1 min-w-[110px] animate-in fade-in slide-in-from-top-2 duration-150">
                {(['NAA', 'NVI', 'ARC'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setBibleVersion(v);
                      setResults(null);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                      bibleVersion === v
                        ? 'bg-brand text-white font-extrabold'
                        : 'text-text-muted hover:text-text-main hover:bg-white/5'
                    }`}
                  >
                    <span>{v}</span>
                    {bibleVersion === v && <Check size={11} strokeWidth={3} className="text-white shrink-0" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Query Forms */}
      {searchTab === 'text' ? (
        <form onSubmit={handleTextSearch} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Ex: joao 3:16 ou Sl 23:1-3"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-black/40 border border-white/10 text-xs text-white pl-10 pr-4 py-2.5 h-10 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchText}
            className="h-10 px-4 bg-brand hover:brightness-110 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs shrink-0"
          >
            {isLoading ? <RefreshCw size={14} className="animate-spin" /> : 'Consultar'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSelectSearch} className="space-y-3">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-12 sm:col-span-5 space-y-1">
              <label className="text-[9px] text-text-muted font-bold uppercase tracking-wider block pl-1">Livro</label>
              <select
                value={selectedBookIndex}
                onChange={(e) => setSelectedBookIndex(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-white/10 text-white text-xs p-2 rounded-xl h-10 focus:outline-none"
              >
                {BIBLE_BOOKS.map((b, i) => (
                  <option key={b.apiId} value={i}>
                    {b.name} ({b.abbrev.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-span-4 sm:col-span-2 space-y-1">
              <label className="text-[9px] text-text-muted font-bold uppercase tracking-wider block pl-1">Cap.</label>
              <input
                type="number"
                min="1"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full bg-black/20 border border-white/10 text-center text-xs text-white h-10 rounded-xl"
              />
            </div>

            <div className="col-span-4 sm:col-span-2 space-y-1">
              <label className="text-[9px] text-text-muted font-bold uppercase tracking-wider block pl-1">V. Inicial</label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 1"
                value={selectedVerse}
                onChange={(e) => setSelectedVerse(e.target.value)}
                className="w-full bg-black/20 border border-white/10 text-center text-xs text-white h-10 rounded-xl"
              />
            </div>

            <div className="col-span-4 sm:col-span-3 space-y-1">
              <label className="text-[9px] text-text-muted font-bold uppercase tracking-wider block pl-1">V. Final (Opcional)</label>
              <input
                type="number"
                min="1"
                placeholder="S/ fim"
                value={selectedEndVerse}
                onChange={(e) => setSelectedEndVerse(e.target.value)}
                className="w-full bg-black/20 border border-white/10 text-center text-xs text-white h-10 rounded-xl"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 bg-brand hover:brightness-110 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition-all"
          >
            {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            Buscar Passagem
          </button>
        </form>
      )}

      {/* Warning/Error Message */}
      {errorMsg && (
        <div className="flex gap-2 items-start bg-red-950/40 border border-red-500/20 text-red-400 p-3 rounded-xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-[10px] sm:text-xs leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {/* Loading Placeholder */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-white/40">
          <RefreshCw size={24} className="animate-spin text-brand" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Consultando base {bibleVersion}...</span>
        </div>
      )}

      {/* Search results display */}
      {results && (
        <div className="bg-black/25 border border-white/5 rounded-xl p-4.5 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-brand/5 border border-brand/15 p-2 rounded-xl">
            <span className="text-xs font-black text-brand uppercase tracking-wider bg-brand/10 px-2.5 py-1 rounded-md">
              {results.reference}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[8px] font-black uppercase text-white/50 tracking-widest">Inserir na Liturgia:</span>
              <button
                type="button"
                onClick={handleInsertAll}
                className="text-[9px] bg-brand hover:brightness-115 text-white/90 font-black uppercase tracking-wider px-2 py-1 rounded inline-flex items-center gap-1 cursor-pointer"
                title="Insere o título (Ex: João 3:16) e o texto do versículo nos Detalhes"
              >
                Duplo
              </button>
              <button
                type="button"
                onClick={handleInsertTitle}
                className="text-[9px] bg-white/10 hover:bg-white/20 text-white/90 font-black uppercase tracking-wider px-2 py-1 rounded cursor-pointer"
                title="Insere apenas a referência no Título"
              >
                Título
              </button>
              <button
                type="button"
                onClick={handleInsertText}
                className="text-[9px] bg-white/10 hover:bg-white/20 text-white/90 font-black uppercase tracking-wider px-2 py-1 rounded cursor-pointer"
                title="Insere apenas o versículo nos Detalhes/Conteúdo"
              >
                Texto
              </button>
              {onInsertDirect && (
                <button
                  type="button"
                  onClick={() => onInsertDirect({
                    title: results.reference,
                    text: results.text,
                    version: bibleVersion
                  })}
                  className="text-[9px] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider px-2.5 py-1 rounded inline-flex items-center gap-1 cursor-pointer"
                  title="Inserir diretamente na liturgia selecionada"
                >
                  Direto 🚀
                </button>
              )}
            </div>
          </div>
          <div className="border-t border-white/5 pt-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar text-xs sm:text-xs leading-relaxed text-white/80 italic pl-2 border-l-2 border-white/25">
            {results.verses && results.verses.length > 0 ? (
              results.verses.map((v: any, i: number) => (
                <span key={i} className="mr-1.5">
                  <sup className="text-[8px] font-black text-brand/80 mr-0.5">{v.verse}</sup>
                  {v.text.trim()}
                </span>
              ))
            ) : (
              <span>{results.text}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
