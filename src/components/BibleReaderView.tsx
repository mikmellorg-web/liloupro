import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BookOpen, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  Loader2,
  Info,
  Highlighter,
  FileText,
  Bookmark,
  Share2,
  Trash2,
  X,
  Palette,
  Maximize2,
  Minimize2,
  ChevronsDown
} from 'lucide-react';
import { CANONICAL_BIBLE_BOOKS } from '../utils/bibleParser';
import { 
  getBiblePassageAsync, 
  AVAILABLE_BIBLE_VERSIONS, 
  BibleVersionCode 
} from '../localBibleDb';

interface BibleReaderViewProps {
  theme?: string;
  services?: any[];
}

type HighlightColor = 'amber' | 'emerald' | 'sky' | 'rose';

const HIGHLIGHT_CONFIG: Record<HighlightColor, { bg: string; border: string; dot: string; label: string; text: string }> = {
  amber: { 
    bg: 'bg-amber-500/15', 
    border: 'border-l-4 border-amber-500', 
    dot: 'bg-amber-500', 
    label: 'Amarelo',
    text: 'text-amber-400'
  },
  emerald: { 
    bg: 'bg-emerald-500/15', 
    border: 'border-l-4 border-emerald-500', 
    dot: 'bg-emerald-500', 
    label: 'Verde',
    text: 'text-emerald-400'
  },
  sky: { 
    bg: 'bg-sky-500/15', 
    border: 'border-l-4 border-sky-500', 
    dot: 'bg-sky-500', 
    label: 'Azul',
    text: 'text-sky-400'
  },
  rose: { 
    bg: 'bg-rose-500/15', 
    border: 'border-l-4 border-rose-500', 
    dot: 'bg-rose-500', 
    label: 'Rosa',
    text: 'text-rose-400'
  }
};

export function BibleReaderView({ theme = 'dark' }: BibleReaderViewProps) {
  // Versão bíblica selecionada (BLIVRE ou TB)
  const [currentVersion, setCurrentVersion] = useState<BibleVersionCode>(() => {
    try {
      const saved = localStorage.getItem('liloupro_bible_reader_version');
      if (saved === 'TB' || saved === 'BLIVRE') return saved;
    } catch (e) {}
    return 'BLIVRE';
  });

  // Recuperar último livro persistido no localStorage
  const [selectedBookIndex, setSelectedBookIndex] = useState<number>(() => {
    try {
      const savedBook = localStorage.getItem('liloupro_last_bible_book');
      if (savedBook) {
        const foundIdx = CANONICAL_BIBLE_BOOKS.findIndex(
          b => b.name.toLowerCase() === savedBook.toLowerCase() || b.aliases.includes(savedBook.toLowerCase())
        );
        if (foundIdx !== -1) return foundIdx;
      }
    } catch (e) {}
    return 18; // Padrão: Salmos (index 18)
  });

  const [selectedChapter, setSelectedChapter] = useState<number>(() => {
    try {
      const savedChap = localStorage.getItem('liloupro_last_bible_chapter');
      if (savedChap) return parseInt(savedChap, 10) || 1;
    } catch (e) {}
    return 23; // Salmo 23
  });

  // Versículo selecionado pelo usuário
  const [selectedVerse, setSelectedVerse] = useState<number | null>(() => {
    try {
      const savedV = localStorage.getItem('liloupro_last_bible_verse');
      if (savedV) return parseInt(savedV, 10) || null;
    } catch (e) {}
    return null;
  });

  // Efeito temporário de pulso/destaque ao navegar para um versículo
  const [scrolledTargetVerse, setScrolledTargetVerse] = useState<number | null>(null);

  const [fontSize, setFontSize] = useState<number>(18);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);
  const [sharedVerse, setSharedVerse] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Rolagem Automática (Mesma lógica e velocidades das cifras)
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [showSpeedSelector, setShowSpeedSelector] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('liloupro_bible_scroll_speed');
      if (saved) return parseFloat(saved) || 0.2;
    } catch (e) {}
    return 0.2;
  });
  const scrollSpeedRef = useRef<number>(scrollSpeed);
  const scrollAccumulatorRef = useRef<number>(0);
  const speedSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
    try {
      localStorage.setItem('liloupro_bible_scroll_speed', scrollSpeed.toString());
    } catch (e) {}
  }, [scrollSpeed]);

  // Fechar popover de velocidade ao clicar fora
  useEffect(() => {
    if (!showSpeedSelector) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (speedSelectorRef.current && !speedSelectorRef.current.contains(e.target as Node)) {
        setShowSpeedSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSpeedSelector]);

  // Loop de Rolagem Automática (AnimationFrame com mesma física das cifras, funcionando na tela normal e expandida)
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;

    const scroll = (time: number) => {
      if (lastTime !== 0) {
        const deltaTime = (time - lastTime) / 1000;
        const pixelsPerSecond = scrollSpeedRef.current * 45;
        scrollAccumulatorRef.current += pixelsPerSecond * deltaTime;

        const scrollStep = Math.floor(scrollAccumulatorRef.current);
        if (scrollStep >= 1) {
          scrollAccumulatorRef.current -= scrollStep;
          const container = document.getElementById('bible-verses-scroll-container');
          const isContainerScrollable = Boolean(container && (container.scrollHeight - container.clientHeight > 10));

          if (isContainerScrollable && container) {
            const maxScroll = container.scrollHeight - container.clientHeight;
            if (container.scrollTop >= maxScroll - 2) {
              setIsAutoScrolling(false);
              return;
            }
            container.scrollTop += scrollStep;
          } else {
            // Se a rolagem for da janela/página inteira (modo normal sem expandir)
            const doc = document.documentElement;
            const currentScroll = window.scrollY || doc.scrollTop;
            const maxWindowScroll = Math.max(doc.scrollHeight, document.body.scrollHeight) - window.innerHeight;

            if (maxWindowScroll > 10 && currentScroll >= maxWindowScroll - 4) {
              setIsAutoScrolling(false);
              return;
            }
            window.scrollBy(0, scrollStep);
            if (container && container.scrollHeight > container.clientHeight) {
              container.scrollTop += scrollStep;
            }
          }
        }
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(scroll);
    };

    if (isAutoScrolling) {
      scrollAccumulatorRef.current = 0;
      animationFrameId = requestAnimationFrame(scroll);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isAutoScrolling]);

  // Gestos de Deslize (Swipe) para avançar/voltar capítulos (mesma lógica do Modo Foco das cifras)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touchEnd = e.changedTouches[0];
    const deltaX = touchEnd.clientX - touchStartRef.current.x;
    const deltaY = touchEnd.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Reconhecer deslize horizontal nítido:
    // - Deslocamento horizontal mínimo de 50px
    // - Movimento predominantemente horizontal (deltaX > 1.4x deltaY para não conflitar com rolagem vertical)
    // - Concluído em menos de 800ms
    if (Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4 && deltaTime < 800) {
      if (deltaX < 0) {
        // Deslizar para a Esquerda -> Avançar para o Próximo Capítulo
        handleNextChapter();
      } else {
        // Deslizar para a Direita -> Voltar para o Capítulo Anterior
        handlePrevChapter();
      }
    }
  };

  // Tecla Escape para sair da tela cheia
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Rolar suavemente para o topo ao trocar de capítulo por deslize ou navegação
  useEffect(() => {
    if (!selectedVerse) {
      const container = document.getElementById('bible-verses-scroll-container');
      const isContainerScrollable = Boolean(container && (container.scrollHeight - container.clientHeight > 10));
      if (isContainerScrollable && container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [selectedChapter, selectedBookIndex, selectedVerse]);

  // Estados de Interação Bíblica (Marcações, Anotações, Favoritos)
  const [highlights, setHighlights] = useState<Record<string, HighlightColor>>(() => {
    try {
      const raw = localStorage.getItem('liloupro_bible_highlights');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  const [notes, setNotes] = useState<Record<string, { text: string; date: number }>>(() => {
    try {
      const raw = localStorage.getItem('liloupro_bible_notes');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('liloupro_bible_favorites');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  // Paleta de cores aberta para versículo específico
  const [paletteVerse, setPaletteVerse] = useState<number | null>(null);
  // Editor de anotação aberto para versículo específico
  const [editingNoteVerse, setEditingNoteVerse] = useState<number | null>(null);
  const [noteDraftText, setNoteDraftText] = useState<string>('');

  // Versículo ativo selecionado para toque em telas móveis/tablets
  const [activeVerseKey, setActiveVerseKey] = useState<string | null>(null);

  // Estado dos versículos e carregamento
  const [verses, setVerses] = useState<{ verse: number; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const currentBook = CANONICAL_BIBLE_BOOKS[selectedBookIndex] || CANONICAL_BIBLE_BOOKS[0];
  const activeVersionMeta = AVAILABLE_BIBLE_VERSIONS.find(v => v.id === currentVersion) || AVAILABLE_BIBLE_VERSIONS[0];

  const getVerseKey = (verseNum: number) => `${currentBook.name}_${selectedChapter}_${verseNum}`;

  // Carregar versículos do capítulo selecionado na versão ativa
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setEditingNoteVerse(null);
    setPaletteVerse(null);

    getBiblePassageAsync(currentBook.name, selectedChapter, currentVersion)
      .then((res) => {
        if (isCancelled) return;
        if (res.verses && res.verses.length > 0) {
          setVerses(res.verses);
          setLoadError(null);
        } else if (res.warning) {
          setVerses([]);
          setLoadError(res.warning);
        } else {
          setVerses([]);
          setLoadError('Nenhum versículo encontrado para este capítulo.');
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('[BibleReaderView] Falha ao carregar passagem:', err);
        setVerses([]);
        setLoadError('Falha ao carregar o texto bíblico.');
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentBook.name, selectedChapter, currentVersion]);

  // Rolar automaticamente para o versículo selecionado após o carregamento
  useEffect(() => {
    if (!isLoading && verses.length > 0 && selectedVerse) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`verse-${selectedVerse}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setScrolledTargetVerse(selectedVerse);
          const clearTimer = setTimeout(() => setScrolledTargetVerse(null), 2500);
          return () => clearTimeout(clearTimer);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading, selectedChapter, selectedBookIndex, selectedVerse]);

  // Persistir última leitura e versão
  useEffect(() => {
    try {
      localStorage.setItem('liloupro_last_bible_book', currentBook.name);
      localStorage.setItem('liloupro_last_bible_chapter', selectedChapter.toString());
      localStorage.setItem('liloupro_bible_reader_version', currentVersion);
    } catch (e) {}
  }, [currentBook.name, selectedChapter, currentVersion]);

  // Função para selecionar versículo com rolagem suave
  const handleSelectVerse = (verseNum: number | null) => {
    setSelectedVerse(verseNum);
    if (verseNum) {
      setActiveVerseKey(getVerseKey(verseNum));
      setScrolledTargetVerse(verseNum);
      try {
        localStorage.setItem('liloupro_last_bible_verse', verseNum.toString());
      } catch (e) {}

      setTimeout(() => {
        const el = document.getElementById(`verse-${verseNum}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      setTimeout(() => {
        setScrolledTargetVerse(null);
      }, 2500);
    } else {
      setActiveVerseKey(null);
      try {
        localStorage.removeItem('liloupro_last_bible_verse');
      } catch (e) {}
    }
  };

  const handleNextChapter = () => {
    setIsAutoScrolling(false);
    if (selectedChapter < currentBook.chapters) {
      setSelectedChapter(prev => prev + 1);
      setSelectedVerse(null);
      setActiveVerseKey(null);
    } else if (selectedBookIndex < CANONICAL_BIBLE_BOOKS.length - 1) {
      setSelectedBookIndex(prev => prev + 1);
      setSelectedChapter(1);
      setSelectedVerse(null);
      setActiveVerseKey(null);
    }
  };

  const handlePrevChapter = () => {
    setIsAutoScrolling(false);
    if (selectedChapter > 1) {
      setSelectedChapter(prev => prev - 1);
      setSelectedVerse(null);
      setActiveVerseKey(null);
    } else if (selectedBookIndex > 0) {
      const prevBookIdx = selectedBookIndex - 1;
      setSelectedBookIndex(prevBookIdx);
      setSelectedChapter(CANONICAL_BIBLE_BOOKS[prevBookIdx].chapters);
      setSelectedVerse(null);
      setActiveVerseKey(null);
    }
  };

  // 1. Marcar Texto (Highlight)
  const handleSetHighlight = (verseNum: number, color: HighlightColor) => {
    const key = getVerseKey(verseNum);
    setHighlights(prev => {
      const next = { ...prev, [key]: color };
      try { localStorage.setItem('liloupro_bible_highlights', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    setPaletteVerse(null);
  };

  const handleRemoveHighlight = (verseNum: number) => {
    const key = getVerseKey(verseNum);
    setHighlights(prev => {
      const next = { ...prev };
      delete next[key];
      try { localStorage.setItem('liloupro_bible_highlights', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    setPaletteVerse(null);
  };

  const handleToggleHighlightQuick = (verseNum: number) => {
    const key = getVerseKey(verseNum);
    if (highlights[key]) {
      handleRemoveHighlight(verseNum);
    } else {
      handleSetHighlight(verseNum, 'amber');
    }
  };

  // 2. Fazer Anotações
  const handleOpenNoteEditor = (verseNum: number) => {
    const key = getVerseKey(verseNum);
    setNoteDraftText(notes[key]?.text || '');
    setEditingNoteVerse(verseNum);
    setPaletteVerse(null);
  };

  const handleSaveNote = (verseNum: number) => {
    const key = getVerseKey(verseNum);
    const trimmed = noteDraftText.trim();
    setNotes(prev => {
      const next = { ...prev };
      if (trimmed) {
        next[key] = { text: trimmed, date: Date.now() };
      } else {
        delete next[key];
      }
      try { localStorage.setItem('liloupro_bible_notes', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    setEditingNoteVerse(null);
    setNoteDraftText('');
  };

  const handleDeleteNote = (verseNum: number) => {
    const key = getVerseKey(verseNum);
    setNotes(prev => {
      const next = { ...prev };
      delete next[key];
      try { localStorage.setItem('liloupro_bible_notes', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    setEditingNoteVerse(null);
    setNoteDraftText('');
  };

  // 3. Marcar como Favorito
  const handleToggleFavorite = (verseNum: number) => {
    const key = getVerseKey(verseNum);
    setFavorites(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      try { localStorage.setItem('liloupro_bible_favorites', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  // 4. Compartilhar
  const handleShareVerse = async (verseNum: number, text: string) => {
    const shareTitle = `${currentBook.name} ${selectedChapter}:${verseNum} (${activeVersionMeta.shortName})`;
    const shareText = `"${text}"\n\n— ${shareTitle}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText
        });
        setSharedVerse(verseNum);
        setTimeout(() => setSharedVerse(null), 2500);
        return;
      } catch (err) {
        // Se usuário cancelou o diálogo de compartilhamento, não faz nada
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Fallback: cópia direta para a área de transferência
    try {
      await navigator.clipboard.writeText(shareText);
      setSharedVerse(verseNum);
      setTimeout(() => setSharedVerse(null), 2500);
    } catch (e) {
      console.warn('Erro ao compartilhar versículo:', e);
    }
  };

  const handleCopyVerse = (verseNum: number, text: string) => {
    const formatted = `"${text}" — ${currentBook.name} ${selectedChapter}:${verseNum} (${activeVersionMeta.shortName})`;
    navigator.clipboard.writeText(formatted);
    setCopiedVerse(verseNum);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  // Filtragem de livros na barra lateral
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return CANONICAL_BIBLE_BOOKS;
    const q = searchQuery.toLowerCase().trim();
    return CANONICAL_BIBLE_BOOKS.filter(
      b => b.name.toLowerCase().includes(q) || b.abbrev.toLowerCase().includes(q) || b.aliases.some(a => a.includes(q))
    );
  }, [searchQuery]);

  const isDark = theme !== 'light';

  return (
    <div className={`flex flex-col lg:flex-row ${
      isFullscreen 
        ? 'fixed inset-0 z-[150] h-screen w-screen overflow-hidden notranslate' 
        : 'h-[calc(100dvh-5.5rem)] md:h-[calc(100dvh-7rem)] max-h-[calc(100dvh-5.5rem)] md:max-h-[calc(100dvh-7rem)] overflow-hidden rounded-2xl border shadow-sm'
    } ${isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-200'}`} translate="no">
      {/* Sidebar de Seleção de Livros e Capítulos */}
      <div className={`${isFullscreen ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-64 lg:shrink-0 border-b lg:border-b-0 lg:border-r ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'} p-3 sm:p-4 gap-2.5 max-h-[25vh] sm:max-h-[30vh] lg:max-h-full lg:h-full overflow-hidden shrink-0`}>
        <div className="flex items-center gap-2 shrink-0">
          <BookOpen className="text-amber-500" size={18} />
          <h2 className="font-bold text-xs sm:text-sm uppercase tracking-wider">Bíblia Sagrada</h2>
          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold ml-auto">
            {activeVersionMeta.shortName}
          </span>
        </div>

        {/* Busca Rápida de Livro */}
        <div className="relative shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar livro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-100 border-slate-200 text-slate-800 placeholder-slate-400'} focus:outline-none focus:ring-1 focus:ring-amber-500`}
          />
        </div>

        {/* Lista de Livros */}
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
          {filteredBooks.map((b) => {
            const originalIndex = CANONICAL_BIBLE_BOOKS.findIndex(orig => orig.name === b.name);
            const isSelected = originalIndex === selectedBookIndex;
            return (
              <button
                key={b.name}
                onClick={() => {
                  setIsAutoScrolling(false);
                  setSelectedBookIndex(originalIndex);
                  setSelectedChapter(1);
                  setSelectedVerse(null);
                  setActiveVerseKey(null);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between min-h-[38px] ${
                  isSelected 
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' 
                    : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>{b.name}</span>
                <span className={`text-[10px] ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                  {b.chapters} cap.
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo Principal do Leitor */}
      <div 
        className="flex-1 flex flex-col overflow-hidden h-full relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Barra Superior de Controles: Capítulos, Versículos, Versão e Formatação (Fixa e Compacta) */}
        <div className={`sticky top-0 z-30 backdrop-blur-md shadow-xs ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'} px-2.5 py-1.5 sm:px-4 sm:py-2 border-b flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 shrink-0`}>
          {/* Navegação de Livro, Capítulo, Versículo e Expandir */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handlePrevChapter}
              className={`p-1.5 rounded-lg border min-w-[34px] min-h-[34px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}
              title="Capítulo Anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="font-bold text-xs sm:text-sm text-amber-500 whitespace-nowrap px-1">
              {currentBook.name}
            </span>

            {/* Seletor de Capítulo */}
            <select
              value={selectedChapter}
              onChange={(e) => {
                setIsAutoScrolling(false);
                const chap = parseInt(e.target.value, 10);
                setSelectedChapter(chap);
                setSelectedVerse(null);
                setActiveVerseKey(null);
              }}
              className={`px-1.5 py-1 rounded-lg border font-bold text-xs sm:text-sm min-h-[34px] sm:min-h-[38px] ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'} focus:outline-none focus:ring-1 focus:ring-amber-500`}
              title="Escolher Capítulo"
            >
              {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((c) => (
                <option key={c} value={c}>
                  Cap. {c}
                </option>
              ))}
            </select>

            {/* Seletor de Versículo */}
            <select
              value={selectedVerse ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                handleSelectVerse(val ? parseInt(val, 10) : null);
              }}
              className={`px-1.5 py-1 rounded-lg border font-bold text-xs sm:text-sm min-h-[34px] sm:min-h-[38px] ${
                selectedVerse 
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 font-extrabold' 
                  : isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
              } focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors`}
              title="Escolher Versículo"
            >
              <option value="">Vers. Todos</option>
              {verses.map((v) => (
                <option key={v.verse} value={v.verse}>
                  Vers. {v.verse}
                </option>
              ))}
            </select>

            {/* Seta para direita > que avança os capítulos */}
            <button
              type="button"
              onClick={handleNextChapter}
              className={`p-1.5 rounded-lg border min-w-[34px] min-h-[34px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}
              title="Próximo Capítulo"
            >
              <ChevronRight size={16} />
            </button>

            {/* 3) Botão de expandir ao lado da seta para direita > */}
            <button
              type="button"
              onClick={() => setIsFullscreen(prev => !prev)}
              className={`p-1.5 rounded-lg border min-w-[34px] min-h-[34px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 ${
                isFullscreen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                  : isDark
                  ? 'border-slate-700/60 bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white'
                  : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
              }`}
              title={isFullscreen ? "Sair da Tela Toda (Esc)" : "Expandir Tela Toda"}
              aria-label={isFullscreen ? "Sair da Tela Toda" : "Expandir Tela Toda"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>

          {/* Controles da Direita: Versão da Bíblia > Tamanho da Fonte > Rolar > Velocidade */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap">
            {/* 1. Botão de Versão da Bíblia */}
            <select
              id="bible-version-select"
              value={currentVersion}
              onChange={(e) => setCurrentVersion(e.target.value as BibleVersionCode)}
              className={`px-2 py-1 text-xs font-semibold rounded-lg border min-h-[34px] sm:min-h-[38px] shrink-0 ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-750' 
                  : 'bg-white border-slate-300 text-amber-600 hover:bg-slate-50'
              } focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors shadow-sm`}
            >
              {AVAILABLE_BIBLE_VERSIONS.map((v) => (
                <option key={v.id} value={v.id} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                  {v.label}
                </option>
              ))}
            </select>

            {/* 2. Tamanho da Fonte: A- 18 A+ */}
            <div className={`flex items-center gap-0.5 p-0.5 rounded-lg border min-h-[34px] sm:min-h-[38px] shrink-0 ${
              isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-100 border-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                className="px-1.5 py-0.5 text-xs font-bold text-slate-400 hover:text-white min-h-[30px] flex items-center justify-center rounded transition-colors cursor-pointer"
                title="Diminuir fonte"
              >
                A-
              </button>
              <span className="text-[11px] font-mono text-slate-400 px-1 font-semibold">{fontSize}</span>
              <button
                type="button"
                onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
                className="px-1.5 py-0.5 text-xs font-bold text-slate-400 hover:text-white min-h-[30px] flex items-center justify-center rounded transition-colors cursor-pointer"
                title="Aumentar fonte"
              >
                A+
              </button>
            </div>

            {/* 3. Botão de Rolar (Apenas ícone) */}
            <button
              type="button"
              onClick={() => setIsAutoScrolling(prev => !prev)}
              className={`p-1.5 rounded-lg border min-w-[34px] min-h-[34px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 ${
                isAutoScrolling
                  ? 'bg-green-500 border-green-400 text-white shadow-xs shadow-green-500/30'
                  : isDark
                  ? 'border-slate-700/60 bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white'
                  : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
              }`}
              title={isAutoScrolling ? "Pausar Rolagem Automática" : "Iniciar Rolagem Automática"}
              aria-label={isAutoScrolling ? "Pausar Rolagem Automática" : "Iniciar Rolagem Automática"}
            >
              <ChevronsDown size={16} className={isAutoScrolling ? "animate-bounce" : ""} strokeWidth={2.5} />
            </button>

            {/* 4. Botão de Velocidade */}
            <div ref={speedSelectorRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowSpeedSelector(prev => !prev)}
                className={`flex items-center justify-center px-2 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all border shrink-0 min-h-[34px] sm:min-h-[38px] cursor-pointer active:scale-95 ${
                  showSpeedSelector
                    ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                    : isDark
                    ? 'border-slate-700/60 bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white'
                    : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                }`}
                title="Ajustar Velocidade de Rolagem"
                aria-label="Ajustar Velocidade de Rolagem"
              >
                <span>{scrollSpeed}x</span>
              </button>

              {/* Popover de Velocidades de Rolagem */}
              {showSpeedSelector && (
                <div 
                  className={`absolute right-0 top-full mt-2 z-[255] flex flex-col border rounded-xl p-3 shadow-2xl min-w-[190px] gap-2 select-none ${
                    isDark 
                      ? 'bg-slate-900 border-slate-700 text-white shadow-[0_10px_35px_rgba(0,0,0,0.9)]' 
                      : 'bg-white border-slate-200 text-slate-900 shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Velocidade
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSpeedSelector(false)}
                      className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[0.1, 0.2, 0.3, 0.5, 1, 1.5].map((speed) => {
                      const isActive = scrollSpeed === speed;
                      return (
                        <button
                          type="button"
                          key={speed}
                          onClick={() => {
                            setScrollSpeed(speed);
                            setShowSpeedSelector(false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-xs font-black transition-all text-center flex items-center justify-center gap-1 cursor-pointer border ${
                            isActive
                              ? 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow-sm'
                              : isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:text-white'
                              : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                          }`}
                        >
                          <span>{speed}x</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Versículos Otimizada para Celular e Tablet */}
        <div 
          id="bible-verses-scroll-container"
          className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-6 md:px-8 md:py-8 max-w-3xl mx-auto w-full space-y-1 sm:space-y-1.5 custom-scrollbar"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="animate-spin text-amber-500" size={28} />
              <p className="text-sm font-medium">Carregando {currentBook.name} {selectedChapter} ({activeVersionMeta.shortName})...</p>
            </div>
          ) : loadError ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <p className="text-base text-rose-400 font-semibold">{loadError}</p>
              <p className="text-xs text-slate-500">Tente selecionar outro capítulo ou versão bíblica.</p>
            </div>
          ) : verses.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Nenhum versículo disponível para esta passagem.
            </div>
          ) : (
            <>
              {verses.map((v) => {
                const vKey = getVerseKey(v.verse);
                const highlightColor = highlights[vKey];
                const highlightConfig = highlightColor ? HIGHLIGHT_CONFIG[highlightColor] : null;
                const noteObj = notes[vKey];
                const isFavorite = !!favorites[vKey];
                const isEditingNote = editingNoteVerse === v.verse;
                const isPaletteOpen = paletteVerse === v.verse;
                const isShared = sharedVerse === v.verse;
                const isCopied = copiedVerse === v.verse;
                const isSelectedOrActive = activeVerseKey === vKey || selectedVerse === v.verse;
                const isTargeted = scrolledTargetVerse === v.verse;
                const isActionOpen = isSelectedOrActive || isEditingNote || isPaletteOpen;

                return (
                  <div
                    key={v.verse}
                    id={`verse-${v.verse}`}
                    onClick={() => {
                      if (activeVerseKey === vKey) {
                        setActiveVerseKey(null);
                      } else {
                        setActiveVerseKey(vKey);
                        setSelectedVerse(v.verse);
                      }
                    }}
                    className={`group relative px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 border cursor-pointer ${
                      isTargeted
                        ? 'ring-2 ring-amber-500 bg-amber-500/10 border-amber-500/60 shadow-sm'
                        : isSelectedOrActive
                          ? isDark ? 'bg-slate-900/90 border-slate-700/80 shadow-xs' : 'bg-white border-slate-300 shadow-xs'
                          : highlightConfig 
                            ? `${highlightConfig.bg} ${highlightConfig.border} border-slate-700/30` 
                            : isDark ? 'border-transparent hover:border-slate-800 hover:bg-slate-900/40' : 'border-transparent hover:border-slate-200 hover:bg-slate-100/60'
                    } ${isFavorite ? 'ring-1 ring-amber-500/30' : ''}`}
                  >
                    {/* Linha do Versículo: Número e Texto Contínuo */}
                    <div className="flex items-start gap-1.5">
                      <p 
                        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                        className="leading-relaxed flex-1 select-text"
                      >
                        <sup className={`font-bold mr-1.5 text-[11px] sm:text-xs select-none ${
                          isSelectedOrActive || isTargeted ? 'text-amber-400 font-extrabold underline' : 'text-amber-500/90'
                        }`}>
                          {v.verse}
                        </sup>
                        <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                          {v.text}
                        </span>
                      </p>

                      {/* Mini Indicadores Visuais (Favorito, Anotação, Marcação) */}
                      <div className="flex items-center gap-1 shrink-0 pt-0.5 select-none">
                        {isFavorite && (
                          <span title="Versículo Favorito">
                            <Bookmark size={13} className="fill-amber-400 text-amber-400" />
                          </span>
                        )}
                        {noteObj && (
                          <span title="Possui Anotação">
                            <FileText size={13} className="text-sky-400" />
                          </span>
                        )}
                        {highlightConfig && (
                          <span 
                            className={`w-2 h-2 rounded-full ${highlightConfig.dot}`} 
                            title={`Marcado: ${highlightConfig.label}`} 
                          />
                        )}
                      </div>
                    </div>

                    {/* Exibição da Anotação salva (se houver e não estiver editando) */}
                    {noteObj && !isEditingNote && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className={`mt-2 p-2.5 rounded-lg border text-xs ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 text-[11px] font-semibold text-sky-400">
                          <span className="flex items-center gap-1">
                            <FileText size={11} />
                            Anotação
                          </span>
                          <button
                            onClick={() => handleOpenNoteEditor(v.verse)}
                            className="text-slate-400 hover:text-white transition-colors"
                          >
                            Editar
                          </button>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{noteObj.text}</p>
                      </div>
                    )}

                    {/* Editor de Anotações inline */}
                    {isEditingNote && (
                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className={`mt-2 p-3 rounded-lg border ${
                          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold flex items-center gap-1 text-amber-400">
                            <FileText size={13} />
                            Anotação — {currentBook.name} {selectedChapter}:{v.verse}
                          </span>
                          <button 
                            onClick={() => setEditingNoteVerse(null)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={noteDraftText}
                          onChange={(e) => setNoteDraftText(e.target.value)}
                          placeholder="Escreva sua reflexão, insight ou comentário pastoral..."
                          className={`w-full p-2 text-xs rounded-lg border resize-none focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                          }`}
                        />
                        <div className="flex items-center justify-end gap-1.5 mt-2">
                          {noteObj && (
                            <button
                              onClick={() => handleDeleteNote(v.verse)}
                              className="px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1 min-h-[36px]"
                            >
                              <Trash2 size={12} />
                              <span>Excluir</span>
                            </button>
                          )}
                          <button
                            onClick={() => setEditingNoteVerse(null)}
                            className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800 text-xs font-semibold min-h-[36px]"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveNote(v.verse)}
                            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold min-h-[36px] shadow-xs"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Paleta de Cores para Marcação de Texto */}
                    {isPaletteOpen && (
                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className={`mt-2 p-2 rounded-lg border flex items-center gap-1.5 flex-wrap ${
                          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-md'
                        }`}
                      >
                        <span className="text-[11px] font-semibold text-slate-400 px-1">Cor:</span>
                        {(Object.keys(HIGHLIGHT_CONFIG) as HighlightColor[]).map((col) => (
                          <button
                            key={col}
                            onClick={() => handleSetHighlight(v.verse, col)}
                            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 border min-h-[34px] ${
                              highlightColor === col 
                                ? `${HIGHLIGHT_CONFIG[col].bg} border-current ${HIGHLIGHT_CONFIG[col].text} font-bold` 
                                : isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${HIGHLIGHT_CONFIG[col].dot}`} />
                            <span>{HIGHLIGHT_CONFIG[col].label}</span>
                          </button>
                        ))}
                        {highlightColor && (
                          <button
                            onClick={() => handleRemoveHighlight(v.verse)}
                            className="px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/10 rounded-md min-h-[34px] ml-auto"
                          >
                            Desmarcar
                          </button>
                        )}
                      </div>
                    )}

                    {/* Barra de Ações: Aparece somente quando o versículo está ativo/tocado (ou no hover no desktop) */}
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className={`items-center gap-1 mt-1.5 pt-1.5 border-t border-slate-800/40 flex-wrap ${
                        isActionOpen ? 'flex' : 'hidden sm:group-hover:flex'
                      }`}
                    >
                      {/* Botão: Marcar Texto */}
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleToggleHighlightQuick(v.verse)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors min-h-[36px] ${
                            highlightConfig
                              ? `${highlightConfig.bg} ${highlightConfig.text} border border-current`
                              : isDark ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Marcar / Destacar texto"
                        >
                          <Highlighter size={13} className={highlightConfig ? highlightConfig.text : 'text-amber-400'} />
                          <span>{highlightConfig ? 'Marcado' : 'Marcar'}</span>
                        </button>

                        <button
                          onClick={() => setPaletteVerse(prev => prev === v.verse ? null : v.verse)}
                          className={`p-1.5 rounded-lg text-xs transition-colors min-h-[36px] min-w-[32px] flex items-center justify-center ${
                            isPaletteOpen 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                              : isDark ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                          title="Escolher cor da marcação"
                        >
                          <Palette size={13} />
                        </button>
                      </div>

                      {/* Botão: Fazer Anotações */}
                      <button
                        onClick={() => handleOpenNoteEditor(v.verse)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors min-h-[36px] ${
                          noteObj 
                            ? 'bg-sky-500/15 text-sky-400 border border-sky-500/40' 
                            : isDark ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Fazer anotação no versículo"
                      >
                        <FileText size={13} className={noteObj ? 'text-sky-400' : 'text-sky-400'} />
                        <span>{noteObj ? 'Anotação' : 'Anotar'}</span>
                      </button>

                      {/* Botão: Marcar como Favorito */}
                      <button
                        onClick={() => handleToggleFavorite(v.verse)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors min-h-[36px] ${
                          isFavorite 
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40' 
                            : isDark ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title={isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
                      >
                        <Bookmark size={13} className={isFavorite ? 'fill-amber-400 text-amber-400' : 'text-amber-400'} />
                        <span>{isFavorite ? 'Favorito' : 'Favoritar'}</span>
                      </button>

                      {/* Botão: Compartilhar */}
                      <button
                        onClick={() => handleShareVerse(v.verse, v.text)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors min-h-[36px] ${
                          isShared 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                            : isDark ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Compartilhar versículo com referência"
                      >
                        {isShared ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} className="text-violet-400" />}
                        <span>{isShared ? 'Pronto!' : 'Compartilhar'}</span>
                      </button>

                      {/* Botão: Copiar */}
                      <button
                        onClick={() => handleCopyVerse(v.verse, v.text)}
                        className="px-2 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors min-h-[36px] flex items-center gap-1 ml-auto"
                        title="Copiar com referência"
                      >
                        {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Rodapé com Créditos e Atribuição Legal da Tradução */}
              <div className="pt-6 pb-4 text-center border-t border-slate-800/60 mt-6">
                <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-900/40 px-3 py-1.5 rounded-full border border-slate-800">
                  <Info size={12} className="text-amber-500 shrink-0" />
                  <span>{activeVersionMeta.copyright}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BibleReaderView;
