import React, { useState, useEffect } from 'react';
import { Search, Copy, Check, Sparkles, BookOpen, Trash2, ArrowRight, CornerDownLeft, AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLocalBiblePassage, adaptToNAA } from '../localBibleDb';
import { parseBibleReference } from './BibleSearch';
import { useAuth } from '../hooks/useAuth';
import { useBibleVersion } from '../contexts/BibleVersionContext';

const TRANSLATIONS = [
  { id: 'NAA', name: 'NAA 2017 (Nova Almeida Atualizada)' }
];

const QUICK_SUGGESTIONS = [
  { label: 'Salmo 23', query: 'Salmo 23' },
  { label: 'João 3:16', query: 'João 3:16' },
  { label: 'Salmo 91', query: 'Salmo 91' },
  { label: 'Mateus 6:9-13', query: 'Mateus 6:9-13' },
  { label: 'Gênesis 1:1-5', query: 'Gênesis 1:1-5' }
];

export function QuickBibleSearch() {
  const [query, setQuery] = useState('');
  const { memberData } = useAuth();
  const [translation, setTranslation] = useState<string>('NAA');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // No-op or empty
  }, [memberData?.defaultBibleVersion]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Active result state
  const [result, setResult] = useState<{
    reference: string;
    verses: { verse: number; text: string }[];
    isFallback: boolean;
    warning: string | null;
  } | null>(null);

  // Load cache on action or read locally
  const executeSearch = async (searchQuery: string, selectedTranslation: string = translation) => {
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;

    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const parsed = parseBibleReference(cleanQuery);
      if (!parsed) {
        throw new Error('Formato inválido. Tente algo como: "Salmo 23", "João 3:16" ou "Mateus 6:9-13".');
      }

      const { book, chapter, verseRange } = parsed;
      const wholeChapterKey = `${book.name}-${chapter}-${selectedTranslation}`;
      const specificRangeKey = `${book.name}-${chapter}-${verseRange || 'all'}-${selectedTranslation}`;

      // 1. Try browser localStorage cache first for 0ms response!
      let cachedResult: any = null;
      try {
        const stored = localStorage.getItem('lilo-bible-passages-cache-v4');
        if (stored) {
          const cacheMap = JSON.parse(stored);
          if (cacheMap[wholeChapterKey]) {
            cachedResult = cacheMap[wholeChapterKey];
            if (verseRange) {
              // Filter verses to only matched range
              const match = verseRange.match(/^(\d+)(?:-(\d+))?$/);
              if (match) {
                const start = parseInt(match[1], 10);
                const end = match[2] ? parseInt(match[2], 10) : start;
                cachedResult = {
                  ...cachedResult,
                  verses: cachedResult.verses.filter((v: any) => v.verse >= start && v.verse <= end)
                };
              }
            }
          } else if (cacheMap[specificRangeKey]) {
            cachedResult = cacheMap[specificRangeKey];
          }
        }
      } catch (e) {
        console.warn('Could not read local storage bible cache in quick search:', e);
      }

      let cachedFallback = false;
      if (cachedResult) {
        setResult({
          reference: `${book.name} ${chapter}${verseRange ? ':' + verseRange : ''} (${selectedTranslation})`,
          verses: cachedResult.verses,
          isFallback: !!cachedResult.isFallback,
          warning: cachedResult.warning || null
        });
        setIsLoading(false);
        
        if (!cachedResult.isFallback) {
          return;
        }
        cachedFallback = true;
      }

      // 2. Fetch from full-stack API
      let apiData: any = null;
      let isFallback = false;
      let warningMessage: string | null = null;

      try {
        const response = await fetch('/api/bible/passage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            book: book.name,
            chapter,
            version: selectedTranslation,
            verseRange
          })
        });

        if (response.ok) {
          const jsonData = await response.json();
          const isDemoMessage = jsonData && !!jsonData.isDemo;
          if (isDemoMessage) {
            throw new Error('Demonstração ativa. Ativando busca direta pelo navegador.');
          }
          apiData = jsonData;
          isFallback = !!apiData.isFallback;
          warningMessage = apiData.warning || null;
        } else {
          throw new Error('Server response was not OK');
        }
      } catch (apiErr) {
        if (cachedFallback) {
          console.log("[Quick Bible Search] Keeping cached fallback instead of failing/disrupting UI.");
          setIsLoading(false);
          return;
        }
        console.warn('Failed API fetch in quick search, trying direct fallback api...', apiErr);
        // Direct browser fallback to online bible-api
        try {
          const apiQueryRef = verseRange ? `${book.apiId} ${chapter}:${verseRange}` : `${book.apiId} ${chapter}`;
          const fallbackRes = await fetch(`https://bible-api.com/${encodeURIComponent(apiQueryRef)}?translation=almeida`);
          if (fallbackRes.ok) {
            const fbData = await fallbackRes.json();
            const formattedVerses = fbData.verses.map((v: any, idx: number) => ({
              verse: v.verse || idx + 1,
              text: v.text.trim()
            }));
            apiData = {
              verses: formattedVerses,
              isFallback: true,
              warning: 'Servidor principal offline. Carregado via tradução Almeida clássica externa.'
            };
            isFallback = true;
            warningMessage = apiData.warning;
          }
        } catch (fbErr) {
          console.warn('Information: External API fallback not available in quick search.');
        }
      }

      // 3. Fallback to offline database if completely disconnected/no Gemini API key
      if (!apiData || !apiData.verses) {
        const offlineData = getLocalBiblePassage(book.name, chapter, selectedTranslation);
        // Filter offline verses if range specified
        let versesToUse = offlineData.verses;
        if (verseRange) {
          const match = verseRange.match(/^(\d+)(?:-(\d+))?$/);
          if (match) {
            const start = parseInt(match[1], 10);
            const end = match[2] ? parseInt(match[2], 10) : start;
            versesToUse = versesToUse.filter((v: any) => v.verse >= start && v.verse <= end);
          }
        }
        
        apiData = {
          verses: versesToUse,
          isFallback: true,
          warning: offlineData.warning
        };
        isFallback = true;
        warningMessage = offlineData.warning;
      }

      // Populate results and update cache
      if (apiData && apiData.verses) {
        if (selectedTranslation === 'NAA') {
          apiData.verses = apiData.verses.map((v: any) => ({
            ...v,
            text: adaptToNAA(v.text)
          }));
        }
        
        const finalRef = `${book.name} ${chapter}${verseRange ? ':' + verseRange : ''} (${selectedTranslation})`;
        setResult({
          reference: finalRef,
          verses: apiData.verses,
          isFallback,
          warning: warningMessage
        });

        // Save back into local storage cache
        try {
          const stored = localStorage.getItem('lilo-bible-passages-cache-v4');
          const cacheMap = stored ? JSON.parse(stored) : {};
          const cacheKeyToSave = verseRange ? specificRangeKey : wholeChapterKey;
          cacheMap[cacheKeyToSave] = {
            verses: apiData.verses,
            isFallback,
            warning: warningMessage
          };
          
          // limit cache size
          const keys = Object.keys(cacheMap);
          if (keys.length > 120) {
            delete cacheMap[keys[0]];
          }
          localStorage.setItem('lilo-bible-passages-cache-v4', JSON.stringify(cacheMap));
        } catch (e) {
          console.warn('Could not update localStorage bible cache:', e);
        }
      } else {
        throw new Error('Nenhum versículo pôde ser encontrado.');
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao buscar versículo. Por favor, verifique a escrita.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch(query);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const formattedText = `*${result.reference}*\n` + result.verses.map(v => `${v.verse}. ${v.text}`).join('\n\n');
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearResult = () => {
    setResult(null);
    setQuery('');
    setError(null);
  };

  return (
    <div id="quick-bible-search-container" className="p-5 rounded-xl border border-dashed border-sky-500/30 dark:border-sky-500/40 bg-sky-500/[0.01] dark:bg-sky-500/[0.02] space-y-4">
      <div className="flex gap-2.5 items-start">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
          <BookOpen size={16} className="text-sky-400 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black text-text-main uppercase tracking-wider flex items-center gap-2">
            Consulta Rápida à Bíblia Sagrada
            <span className="bg-sky-500/10 text-sky-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-widest">
              Offline-Ready
            </span>
          </h4>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Consulte qualquer versículo ou passagem bíblica instantaneamente para apoiar seu culto, pregação ou ensaio sem sair do painel.
          </p>
        </div>
      </div>

      {/* Main Search Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Query input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ex: João 3:16 ou Salmos 23"
              className="w-full h-11 pl-4 pr-10 rounded-xl bg-black/10 dark:bg-white/5 border border-border focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-xs text-text-main placeholder-text-muted transition-all"
            />
            <button
              onClick={() => executeSearch(query)}
              disabled={isLoading || !query.trim()}
              className="absolute right-1.5 top-1.5 w-8 h-8 rounded-lg bg-sky-500/10 hover:bg-sky-500/25 flex items-center justify-center text-sky-400 hover:text-sky-300 disabled:opacity-40 transition-colors cursor-pointer"
              title="Pesquisar versículo"
            >
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Translation selector with NAA, NVI, ARC as a dropdown */}
          <div className="relative w-full sm:w-36 shrink-0 select-none">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between gap-1.5 h-11 px-3.5 rounded-xl bg-black/10 dark:bg-white/5 border border-border text-[11px] font-black uppercase tracking-wider text-text-main transition-all cursor-pointer hover:bg-black/20"
            >
              <span className="text-text-muted shrink-0">Tradução:</span>
              <span className="text-sky-400 font-black">{translation}</span>
              <ChevronDown size={13} className={`text-text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDropdownOpen(false)} 
                />
                <div className="absolute right-0 top-full mt-1.5 w-full bg-zinc-950 border border-border rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 min-w-[120px]">
                  {(['NAA', 'NVI', 'ARC'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setTranslation(v);
                        setResult(null); // Clear result on version switch to force fresh retrieval
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                        translation === v
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 font-extrabold'
                          : 'text-text-muted hover:text-text-main hover:bg-white/5'
                      }`}
                    >
                      <span>{v}</span>
                      {translation === v && <Check size={11} strokeWidth={3} className="text-sky-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider mr-1">Sugestões:</span>
          {QUICK_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.query}
              type="button"
              onClick={() => {
                setQuery(suggestion.query);
                executeSearch(suggestion.query);
              }}
              className="h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/10 dark:bg-white/5 border border-border/40 hover:border-sky-500/40 hover:text-sky-400 transition-all cursor-pointer select-none"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Output */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 flex items-start gap-2"
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Search Result */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col items-center justify-center py-6 gap-2 text-text-muted"
          >
            <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Consultando Bíblia...</span>
          </motion.div>
        ) : result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3"
          >
            {/* Header / Actions */}
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-text-main tracking-tight">{result.reference}</span>
                {result.isFallback && (
                  <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-widest">
                    Demo/Local
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-8 h-8 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-black/25 dark:hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-text-main transition-colors cursor-pointer"
                  title="Copiar para o clipboard"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
                <button
                  type="button"
                  onClick={clearResult}
                  className="w-8 h-8 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-black/25 dark:hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                  title="Limpar consulta"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Verses representation */}
            <div className="max-h-56 overflow-y-auto pr-1 space-y-2 text-xs leading-relaxed text-text-main font-sans text-left scrollbar-thin scrollbar-thumb-slate-800">
              {result.verses.map((v) => (
                <p key={v.verse} className="hover:bg-white/[0.02] p-1 rounded transition-colors">
                  <sup className="text-[10px] font-black text-sky-400 mr-1.5 select-none">{v.verse}</sup>
                  {v.text}
                </p>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
