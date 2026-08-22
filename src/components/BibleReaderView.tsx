import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, Book, Search, Sparkles, Copy, Highlighter, FileText, Share2, 
  ZoomIn, ZoomOut, Maximize2, Minimize2, Check, ArrowLeft, ArrowRight, 
  CornerDownRight, Play, Edit, RotateCcw, Volume2, Save, Trash2, Heart, Download, X, List, ChevronRight, AlertCircle,
  Eye, Glasses, SunDim, Mic, MicOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toJpeg } from 'html-to-image';
import { getLocalBiblePassage, adaptToNAA } from '../localBibleDb';
import { useAuth } from '../hooks/useAuth';
import { useBibleVersion } from '../contexts/BibleVersionContext';
import { parseBibleReference } from './BibleSearch';
import ContextualHelp from './ContextualHelp';

// Detailed map of Books of the Bible with grouping, abbreviations, and exact chapter counts
interface BibleBook {
  name: string;
  abbrev: string;
  apiId: string;
  chapters: number;
  testament: 'AT' | 'NT';
  category: string;
  color: string;
}

const BIBLE_BOOKS_DATA: BibleBook[] = [
  // Antigo Testamento (AT)
  // Pentateuco
  { name: "Gênesis", abbrev: "Gn", apiId: "Genesis", chapters: 50, testament: "AT", category: "Pentateuco", color: "from-emerald-500 to-teal-600" },
  { name: "Êxodo", abbrev: "Êx", apiId: "Exodus", chapters: 40, testament: "AT", category: "Pentateuco", color: "from-emerald-500 to-teal-600" },
  { name: "Levítico", abbrev: "Lv", apiId: "Leviticus", chapters: 27, testament: "AT", category: "Pentateuco", color: "from-emerald-500 to-teal-600" },
  { name: "Números", abbrev: "Nm", apiId: "Numbers", chapters: 36, testament: "AT", category: "Pentateuco", color: "from-emerald-500 to-teal-600" },
  { name: "Deuteronômio", abbrev: "Dt", apiId: "Deuteronomy", chapters: 34, testament: "AT", category: "Pentateuco", color: "from-emerald-500 to-teal-600" },
  // Históricos
  { name: "Josué", abbrev: "Js", apiId: "Joshua", chapters: 24, testament: "AT", category: "Históricos", color: "from-blue-500 to-indigo-600" },
  { name: "Juízes", abbrev: "Jz", apiId: "Judges", chapters: 21, testament: "AT", category: "Históricos", color: "from-blue-500 to-indigo-600" },
  { name: "Rute", abbrev: "Rt", apiId: "Ruth", chapters: 4, testament: "AT", category: "Históricos", color: "from-blue-500 to-indigo-600" },
  { name: "1 Samuel", abbrev: "1Sm", apiId: "1 Samuel", chapters: 31, testament: "AT", category: "Históricos", color: "from-blue-500 to-indigo-600" },
  { name: "2 Samuel", abbrev: "2Sm", apiId: "2 Samuel", chapters: 24, testament: "AT", category: "Históricos", color: "from-blue-500 to-indigo-600" },
  { name: "1 Reis", abbrev: "1Rs", apiId: "1 Kings", chapters: 22, testament: "AT", category: "Históricos", color: "from-blue-500 to-indigo-600" },
  { name: "2 Reis", abbrev: "2Rs", apiId: "2 Kings", chapters: 25, testament: "AT", category: "Históricos", color: "from-blue-500 to-indigo-600" },
  { name: "1 Crônicas", abbrev: "1Cr", apiId: "1 Chronicles", chapters: 29, testament: "AT", category: "Históricos", color: "from-blue-500 to-indigo-600" },
  { name: "2 Crônicas", abbrev: "2Cr", apiId: "2 Chronicles", chapters: 36, testament: "AT", category: "Históricos", color: "from-blue-500 to-indigo-600" },
  { name: "Esdras", abbrev: "Ed", apiId: "Ezra", chapters: 10, testament: "AT", category: "Históricos", color: "from-blue-500 to-indigo-600" },
  { name: "Neemias", abbrev: "Ne", apiId: "Nehemiah", chapters: 13, testament: "AT", category: "Históricos", color: "from-blue-500 to-indigo-600" },
  { name: "Ester", abbrev: "Et", apiId: "Esther", chapters: 10, testament: "AT", category: "Históricos", color: "from-blue-500 to-indigo-600" },
  // Poéticos
  { name: "Jó", abbrev: "Jó", apiId: "Job", chapters: 42, testament: "AT", category: "Poéticos", color: "from-fuchsia-500 to-pink-600" },
  { name: "Salmos", abbrev: "Sl", apiId: "Psalms", chapters: 150, testament: "AT", category: "Poéticos", color: "from-fuchsia-500 to-pink-600" },
  { name: "Provérbios", abbrev: "Pv", apiId: "Proverbs", chapters: 31, testament: "AT", category: "Poéticos", color: "from-fuchsia-500 to-pink-600" },
  { name: "Eclesiastes", abbrev: "Ec", apiId: "Ecclesiastes", chapters: 12, testament: "AT", category: "Poéticos", color: "from-fuchsia-500 to-pink-600" },
  { name: "Cânticos", abbrev: "Ct", apiId: "Song of Solomon", chapters: 8, testament: "AT", category: "Poéticos", color: "from-fuchsia-500 to-pink-600" },
  // Profetas Maiores
  { name: "Isaías", abbrev: "Is", apiId: "Isaiah", chapters: 66, testament: "AT", category: "Profetas Maiores", color: "from-amber-500 to-orange-600" },
  { name: "Jeremias", abbrev: "Jr", apiId: "Jeremiah", chapters: 52, testament: "AT", category: "Profetas Maiores", color: "from-amber-500 to-orange-600" },
  { name: "Lamentações", abbrev: "Lm", apiId: "Lamentations", chapters: 5, testament: "AT", category: "Profetas Maiores", color: "from-amber-500 to-orange-600" },
  { name: "Ezequiel", abbrev: "Ez", apiId: "Ezekiel", chapters: 48, testament: "AT", category: "Profetas Maiores", color: "from-amber-500 to-orange-600" },
  { name: "Daniel", abbrev: "Dn", apiId: "Daniel", chapters: 12, testament: "AT", category: "Profetas Maiores", color: "from-amber-500 to-orange-600" },
  // Profetas Menores
  { name: "Oseias", abbrev: "Os", apiId: "Hosea", chapters: 14, testament: "AT", category: "Profetas Menores", color: "from-orange-500 to-red-600" },
  { name: "Joel", abbrev: "Jl", apiId: "Joel", chapters: 3, testament: "AT", category: "Profetas Menores", color: "from-orange-500 to-red-600" },
  { name: "Amós", abbrev: "Am", apiId: "Amos", chapters: 9, testament: "AT", category: "Profetas Menores", color: "from-orange-500 to-red-600" },
  { name: "Obadias", abbrev: "Ob", apiId: "Obadiah", chapters: 1, testament: "AT", category: "Profetas Menores", color: "from-orange-500 to-red-600" },
  { name: "Jonas", abbrev: "Jn", apiId: "Jonah", chapters: 4, testament: "AT", category: "Profetas Menores", color: "from-orange-500 to-red-600" },
  { name: "Miqueias", abbrev: "Mq", apiId: "Micah", chapters: 7, testament: "AT", category: "Profetas Menores", color: "from-orange-500 to-red-600" },
  { name: "Naum", abbrev: "Na", apiId: "Nahum", chapters: 3, testament: "AT", category: "Profetas Menores", color: "from-orange-500 to-red-600" },
  { name: "Habacuque", abbrev: "Hc", apiId: "Habakkuk", chapters: 3, testament: "AT", category: "Profetas Menores", color: "from-orange-500 to-red-600" },
  { name: "Sofonias", abbrev: "Sf", apiId: "Zephaniah", chapters: 3, testament: "AT", category: "Profetas Menores", color: "from-orange-500 to-red-600" },
  { name: "Ageu", abbrev: "Ag", apiId: "Haggai", chapters: 2, testament: "AT", category: "Profetas Menores", color: "from-orange-500 to-red-600" },
  { name: "Zacarias", abbrev: "Zc", apiId: "Zechariah", chapters: 14, testament: "AT", category: "Profetas Menores", color: "from-orange-500 to-red-600" },
  { name: "Malaquias", abbrev: "Ml", apiId: "Malachi", chapters: 4, testament: "AT", category: "Profetas Menores", color: "from-orange-500 to-red-600" },

  // Novo Testamento (NT)
  // Evangelhos
  { name: "Mateus", abbrev: "Mt", apiId: "Matthew", chapters: 28, testament: "NT", category: "Evangelhos", color: "from-sky-500 to-blue-600" },
  { name: "Marcos", abbrev: "Mc", apiId: "Mark", chapters: 16, testament: "NT", category: "Evangelhos", color: "from-sky-500 to-blue-600" },
  { name: "Lucas", abbrev: "Lc", apiId: "Luke", chapters: 24, testament: "NT", category: "Evangelhos", color: "from-sky-500 to-blue-600" },
  { name: "João", abbrev: "Jo", apiId: "John", chapters: 21, testament: "NT", category: "Evangelhos", color: "from-sky-500 to-blue-600" },
  // Histórico NT
  { name: "Atos", abbrev: "At", apiId: "Acts", chapters: 28, testament: "NT", category: "Histórico NT", color: "from-teal-500 to-emerald-600" },
  // Epístolas de Paulo
  { name: "Romanos", abbrev: "Rm", apiId: "Romans", chapters: 16, testament: "NT", category: "Cartas Paulinas", color: "from-violet-500 to-purple-600" },
  { name: "1 Coríntios", abbrev: "1Co", apiId: "1 Corinthians", chapters: 16, testament: "NT", category: "Cartas Paulinas", color: "from-violet-500 to-purple-600" },
  { name: "2 Coríntios", abbrev: "2Co", apiId: "2 Corinthians", chapters: 13, testament: "NT", category: "Cartas Paulinas", color: "from-violet-500 to-purple-600" },
  { name: "Gálatas", abbrev: "Gl", apiId: "Galatians", chapters: 6, testament: "NT", category: "Cartas Paulinas", color: "from-violet-500 to-purple-600" },
  { name: "Efésios", abbrev: "Ef", apiId: "Ephesians", chapters: 6, testament: "NT", category: "Cartas Paulinas", color: "from-violet-500 to-purple-600" },
  { name: "Filipenses", abbrev: "Fp", apiId: "Philippians", chapters: 4, testament: "NT", category: "Cartas Paulinas", color: "from-violet-500 to-purple-600" },
  { name: "Colossenses", abbrev: "Cl", apiId: "Colossians", chapters: 4, testament: "NT", category: "Cartas Paulinas", color: "from-violet-500 to-purple-600" },
  { name: "1 Tessalonicenses", abbrev: "1Ts", apiId: "1 Thessalonians", chapters: 5, testament: "NT", category: "Cartas Paulinas", color: "from-violet-500 to-purple-600" },
  { name: "2 Tessalonicenses", abbrev: "2Ts", apiId: "2 Thessalonians", chapters: 3, testament: "NT", category: "Cartas Paulinas", color: "from-violet-500 to-purple-600" },
  { name: "1 Timóteo", abbrev: "1Tm", apiId: "1 Timothy", chapters: 6, testament: "NT", category: "Cartas Paulinas", color: "from-violet-500 to-purple-600" },
  { name: "2 Timóteo", abbrev: "2Tm", apiId: "2 Timothy", chapters: 4, testament: "NT", category: "Cartas Paulinas", color: "from-violet-500 to-purple-600" },
  { name: "Tito", abbrev: "Tt", apiId: "Titus", chapters: 3, testament: "NT", category: "Cartas Paulinas", color: "from-violet-500 to-purple-600" },
  { name: "Filemon", abbrev: "Fm", apiId: "Philemon", chapters: 1, testament: "NT", category: "Cartas Paulinas", color: "from-violet-500 to-purple-600" },
  // Epístolas Gerais
  { name: "Hebreus", abbrev: "Hb", apiId: "Hebrews", chapters: 13, testament: "NT", category: "Cartas Gerais", color: "from-indigo-500 to-violet-600" },
  { name: "Tiago", abbrev: "Tg", apiId: "James", chapters: 5, testament: "NT", category: "Cartas Gerais", color: "from-indigo-500 to-violet-600" },
  { name: "1 Pedro", abbrev: "1Pe", apiId: "1 Peter", chapters: 5, testament: "NT", category: "Cartas Gerais", color: "from-indigo-500 to-violet-600" },
  { name: "2 Pedro", abbrev: "2Pe", apiId: "2 Peter", chapters: 3, testament: "NT", category: "Cartas Gerais", color: "from-indigo-500 to-violet-600" },
  { name: "1 João", abbrev: "1Jo", apiId: "1 John", chapters: 5, testament: "NT", category: "Cartas Gerais", color: "from-indigo-500 to-violet-600" },
  { name: "2 João", abbrev: "2Jo", apiId: "2 John", chapters: 1, testament: "NT", category: "Cartas Gerais", color: "from-indigo-500 to-violet-600" },
  { name: "3 João", abbrev: "3Jo", apiId: "3 John", chapters: 1, testament: "NT", category: "Cartas Gerais", color: "from-indigo-500 to-violet-600" },
  { name: "Judas", abbrev: "Jd", apiId: "Jude", chapters: 1, testament: "NT", category: "Cartas Gerais", color: "from-indigo-500 to-violet-600" },
  // Apocalipse
  { name: "Apocalipse", abbrev: "Ap", apiId: "Revelation", chapters: 22, testament: "NT", category: "Revelação", color: "from-rose-500 to-red-600" }
];

// Client-side in-memory cache to make page-turning and navigation inside the Bible Reader completely instant (0ms)
const clientBibleCache = new Map<string, { verses: { verse: number; text: string }[]; isFallback: boolean; warning: string | null }>();

const saveClientBibleCache = () => {
  try {
    // Keep max 120 chapters in localStorage to prevent exceeding 5MB quota
    if (clientBibleCache.size > 120) {
      const keys = Array.from(clientBibleCache.keys());
      for (let i = 0; i < 30; i++) {
        clientBibleCache.delete(keys[i]);
      }
    }
    localStorage.setItem('lilo-bible-passages-cache-v4', JSON.stringify(Object.fromEntries(clientBibleCache.entries())));
  } catch (e) {
    console.warn("Could not save client bible cache:", e);
  }
};

const prefetchPassage = async (book: BibleBook, chapter: number, version: string) => {
  const cacheKey = `${book.name}-${chapter}-${version}`;
  if (clientBibleCache.has(cacheKey)) return;

  try {
    const response = await fetch("/api/bible/passage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        book: book.name,
        chapter: chapter,
        version: version
      })
    });

    if (response.ok) {
      const data = await response.json();
      const isDemoMessage = data && data.verses && data.verses.some((v: any) => 
        v.text.includes("demonstração") || v.text.includes("chave de API") || v.text.includes("AI Studio")
      );
      if (data && data.verses && !isDemoMessage) {
        clientBibleCache.set(cacheKey, {
          verses: data.verses,
          isFallback: !!data.isFallback,
          warning: data.warning || null
        });
        saveClientBibleCache();
      }
    }
  } catch (err) {
    console.warn("Silent background prefetch failed:", err);
  }
};

const prefetchAdjacentPassages = (currentBook: BibleBook, currentChapter: number, version: string) => {
  // Determine next chapter
  let nextBook = currentBook;
  let nextChapter = currentChapter + 1;
  if (nextChapter > currentBook.chapters) {
    const currentIdx = BIBLE_BOOKS_DATA.findIndex(b => b.name === currentBook.name);
    if (currentIdx < BIBLE_BOOKS_DATA.length - 1) {
      nextBook = BIBLE_BOOKS_DATA[currentIdx + 1];
      nextChapter = 1;
    } else {
      nextChapter = -1; // No next
    }
  }

  // Determine prev chapter
  let prevBook = currentBook;
  let prevChapter = currentChapter - 1;
  if (prevChapter < 1) {
    const currentIdx = BIBLE_BOOKS_DATA.findIndex(b => b.name === currentBook.name);
    if (currentIdx > 0) {
      prevBook = BIBLE_BOOKS_DATA[currentIdx - 1];
      prevChapter = prevBook.chapters;
    } else {
      prevChapter = -1; // No prev
    }
  }

  // Execute background fetch after a short delay to keep current render buttery smooth
  setTimeout(() => {
    if (nextChapter !== -1) {
      prefetchPassage(nextBook, nextChapter, version);
    }
    if (prevChapter !== -1) {
      prefetchPassage(prevBook, prevChapter, version);
    }
  }, 1200);
};

const parseLiturgyReference = (title: string, defaultVersion: string = 'NAA') => {
  let version = defaultVersion;
  const versionMatch = title.match(/\((NAA|ARA|ARC|NVI|NTLH|ACF)\)/i);
  if (versionMatch) {
    version = versionMatch[1].toUpperCase();
    title = title.replace(/\((NAA|ARA|ARC|NVI|NTLH|ACF)\)/i, '').trim();
  }

  const refMatch = title.match(/^(.+?)\s+(\d+)(?::(\d+(?:-\d+)?))?$/);
  if (refMatch) {
    const bookName = refMatch[1].trim();
    const chapter = parseInt(refMatch[2], 10);
    const verses = refMatch[3] || null;
    return { bookName, chapter, verses, version };
  }
  return null;
};

const parseTextToVerses = (text: string): { verse: number; text: string }[] => {
  if (!text || !text.trim()) return [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const versesList: { verse: number; text: string }[] = [];
  
  let currentVerseNum = 1;
  for (const line of lines) {
    const match = line.match(/^\[?(\d+)\]?[\s.:-]\s*(.*)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      const txt = match[2].trim();
      versesList.push({ verse: num, text: txt });
      currentVerseNum = num + 1;
    } else {
      versesList.push({ verse: currentVerseNum, text: line });
      currentVerseNum++;
    }
  }
  
  if (versesList.length === 0) {
    const matches = Array.from(text.matchAll(/(?:^|\s)(\d+)[\s.:-]\s*([^0-9]+)/g));
    if (matches.length > 0) {
      for (const m of matches) {
        versesList.push({ verse: parseInt(m[1], 10), text: m[2].trim() });
      }
    } else {
      versesList.push({ verse: 1, text: text.trim() });
    }
  }
  
  return versesList;
};

export default function BibleReaderView({ theme = 'dark', services = [] }: { theme?: 'dark' | 'light'; services?: any[] }) {
  const isLight = theme === 'light';
  // Navigation states initialized from localStorage so the last read passage is restored seamlessly
  const [selectedBook, setSelectedBook] = useState<BibleBook>(() => {
    try {
      const savedBookName = localStorage.getItem('liloupro_last_bible_book');
      if (savedBookName) {
        const found = BIBLE_BOOKS_DATA.find(
          b => b.name.toLowerCase() === savedBookName.toLowerCase() ||
               b.abbrev.toLowerCase() === savedBookName.toLowerCase() ||
               b.apiId.toLowerCase() === savedBookName.toLowerCase()
        );
        if (found) return found;
      }
    } catch (e) {
      console.warn("Could not load saved Bible book:", e);
    }
    return BIBLE_BOOKS_DATA.find(b => b.name === "João") || BIBLE_BOOKS_DATA[43];
  });

  const [selectedChapter, setSelectedChapter] = useState<number>(() => {
    try {
      const savedChapter = localStorage.getItem('liloupro_last_bible_chapter');
      if (savedChapter) {
        const parsed = parseInt(savedChapter, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load saved Bible chapter:", e);
    }
    return 3;
  });

  // Persist last read passage whenever selectedBook or selectedChapter changes
  useEffect(() => {
    if (selectedBook && selectedChapter) {
      try {
        localStorage.setItem('liloupro_last_bible_book', selectedBook.name);
        localStorage.setItem('liloupro_last_bible_chapter', selectedChapter.toString());
      } catch (e) {
        console.warn("Could not save last Bible passage:", e);
      }
    }
  }, [selectedBook, selectedChapter]);
  const { memberData } = useAuth();
  const { forcedVersion } = useBibleVersion();
  // As requested, the app's main Bible Reader uses "Bíblia Livre (BLIVRE)" to be 100% free of copyright issues and commercial-ready, while liturgy/projection uses "NAA 2017"
  const bibleVersion: string = 'BLIVRE';
  const setBibleVersion = (v: string) => {};

  const hasInitializedFromLiturgy = useRef(false);

  useEffect(() => {
    localStorage.setItem('preferred_bible_version', 'NAA');
  }, []);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);
  const [searchBookQuery, setSearchBookQuery] = useState<string>('');
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'AT' | 'NT'>('ALL');

  // Interactive selectors
  const [showBookDropdown, setShowBookDropdown] = useState<boolean>(false);
  const [showChapterSelector, setShowChapterSelector] = useState<boolean>(false);
  const [showVerseSelector, setShowVerseSelector] = useState<boolean>(false);

  // Content states
  const [verses, setVerses] = useState<{ verse: number; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackActive, setIsFallbackActive] = useState<boolean>(false);
  const [fallbackWarning, setFallbackWarning] = useState<string | null>(null);

  // UI preferences
  const [fontSize, setFontSize] = useState<number>(18); // px
  const [nightMode, setNightMode] = useState<'off' | 'sepia' | 'pitchBlack'>('off');
  const [blueLightFilter, setBlueLightFilter] = useState<boolean>(false);
  const [brightnessLevel, setBrightnessLevel] = useState<'high' | 'medium' | 'low'>('high');
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Highlighting & Notes & Favorites (persisted in localStorage)
  const [highlights, setHighlights] = useState<Record<string, string>>({}); // key: "Book-Chapter-Verse" -> color class
  const [notes, setNotes] = useState<Record<string, string>>({}); // key: "Book-Chapter-Verse" -> text
  const [favorites, setFavorites] = useState<string[]>([]); // list of keys "Book-Chapter-Verse"

  // Context overlay on verse click
  const [activeVerseOverlay, setActiveVerseOverlay] = useState<{ verse: number; text: string } | null>(null);
  const [isWritingNote, setIsWritingNote] = useState<boolean>(false);
  const [tempNoteText, setTempNoteText] = useState<string>('');

  // AI Explainer Drawer
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [showAiDrawer, setShowAiDrawer] = useState<boolean>(false);

  // Card Creator Modal
  const [showCardCreator, setShowCardCreator] = useState<boolean>(false);
  const [cardVerse, setCardVerse] = useState<{ verse: number; text: string } | null>(null);
  const [cardTheme, setCardTheme] = useState<string>('cosmic'); // cosmic, sunset, forest, elegant-dark, minimal-light
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState<boolean>(false);
  const [isSharingCard, setIsSharingCard] = useState<boolean>(false);

  // AI Assistant Chat Panel
  const [showAiAssistant, setShowAiAssistant] = useState<boolean>(false);
  const [aiChatQuery, setAiChatQuery] = useState<string>('');
  const [aiChatResponses, setAiChatResponses] = useState<{ query: string; response: string; timestamp: Date }[]>([]);
  const [isAssistantLoading, setIsAssistantLoading] = useState<boolean>(false);

  // Thematic Keyword Search States
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'theme'>('chat');
  const [topSearchQuery, setTopSearchQuery] = useState<string>('');
  const [themeSearchQuery, setThemeSearchQuery] = useState<string>('');
  const [themeSearchResults, setThemeSearchResults] = useState<{ reference: string; text: string; explanation: string }[]>([]);
  const [isThemeSearching, setIsThemeSearching] = useState<boolean>(false);
  const [themeSearchError, setThemeSearchError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedChatIndex, setCopiedChatIndex] = useState<number | null>(null);

  // Voice Search States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [listeningTarget, setListeningTarget] = useState<'top' | 'chat' | 'theme' | null>(null);
  const activeRecognitionRef = useRef<any>(null);

  // Voice command speech recognition handler
  const startVoiceRecognition = (target: 'top' | 'chat' | 'theme', setter: (val: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz direto. Tente usar o Google Chrome ou Microsoft Edge.");
      return;
    }

    if (isListening) {
      if (activeRecognitionRef.current) {
        try { activeRecognitionRef.current.stop(); } catch(e) {}
      }
      setIsListening(false);
      setListeningTarget(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
        setListeningTarget(target);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        const cleaned = currentTranscript.trim();
        if (cleaned) {
          setter(cleaned);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Reconhecimento de voz:", event.error);
        setIsListening(false);
        setListeningTarget(null);
      };

      recognition.onend = () => {
        setIsListening(false);
        setListeningTarget(null);
      };

      activeRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Erro ao iniciar microfone:", err);
      setIsListening(false);
      setListeningTarget(null);
    }
  };

  // Scroll anchor reference
  const readerTopRef = useRef<HTMLDivElement>(null);

  // Load persisted highlights, notes, and favorites on mount
  useEffect(() => {
    try {
      const storedHighlights = localStorage.getItem('lilo-bible-highlights');
      if (storedHighlights) setHighlights(JSON.parse(storedHighlights));

      const storedNotes = localStorage.getItem('lilo-bible-notes');
      if (storedNotes) setNotes(JSON.parse(storedNotes));

      const storedFavorites = localStorage.getItem('lilo-bible-favorites');
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));

      const storedPassages = localStorage.getItem('lilo-bible-passages-cache-v4');
      if (storedPassages) {
        const parsed = JSON.parse(storedPassages);
        for (const [k, v] of Object.entries(parsed)) {
          clientBibleCache.set(k, v as any);
        }
      }
    } catch (e) {
      console.warn("Could not parse persisted bible data:", e);
    }
  }, []);

  // Sync and pre-populate local Bible cache with saved readings from service liturgies
  const liturgicalReadingsList = useMemo(() => {
    if (!services || services.length === 0) return [];
    
    const list: {
      book: BibleBook;
      chapter: number;
      version: string;
      serviceTitle: string;
      serviceDate: string;
      itemTitle: string;
      details: string;
    }[] = [];

    services.forEach((s: any) => {
      const readings = (s.liturgy || []).filter((item: any) => item.type === 'reading');
      readings.forEach((item: any) => {
        const title = item.title || '';
        const details = item.details || item.content || '';
        if (!title) return;

        let version = 'NAA';
        const parsed = parseLiturgyReference(title, version);
        if (parsed) {
          const standardBook = BIBLE_BOOKS_DATA.find(b => 
            b.name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 
            parsed.bookName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          );
          if (standardBook) {
            list.push({
              book: standardBook,
              chapter: parsed.chapter,
              version: 'NAA',
              serviceTitle: s.title,
              serviceDate: s.date,
              itemTitle: title,
              details: details
            });
          }
        }
      });
    });

    return list;
  }, [services]);

  const closestReading = useMemo(() => {
    if (liturgicalReadingsList.length === 0) return null;
    // Return the first reading (or closest date)
    const sorted = [...liturgicalReadingsList].sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
    return sorted[0];
  }, [liturgicalReadingsList]);

  // Synchronize liturgy readings to client Bible cache
  useEffect(() => {
    if (liturgicalReadingsList.length === 0) return;

    liturgicalReadingsList.forEach((reading) => {
      const cacheKey = `${reading.book.name}-${reading.chapter}-NAA`;
      const parsedVerses = parseTextToVerses(reading.details).map(v => ({
        ...v,
        text: adaptToNAA(v.text)
      }));
      if (parsedVerses.length > 0) {
        clientBibleCache.set(cacheKey, {
          verses: parsedVerses,
          isFallback: true,
          warning: `Texto da liturgia do culto "${reading.serviceTitle}" adaptado para NAA 2017.`
        });
      }
    });

    saveClientBibleCache();
  }, [liturgicalReadingsList]);

  // Automatically select the closest liturgy reading on initial load ONLY if user has no saved reading history
  useEffect(() => {
    const hasSavedPassage = localStorage.getItem('liloupro_last_bible_book');
    if (!hasSavedPassage && closestReading && !hasInitializedFromLiturgy.current) {
      setSelectedBook(closestReading.book);
      setSelectedChapter(closestReading.chapter);
      hasInitializedFromLiturgy.current = true;
    }
  }, [closestReading]);

  // Fetch passage whenever book, chapter, or version changes
  useEffect(() => {
    let active = true;
    const loadPassage = async () => {
      setIsLoading(true);
      setError(null);
      setIsFallbackActive(false);
      setFallbackWarning(null);

      const cacheKey = `${selectedBook.name}-${selectedChapter}-${bibleVersion}`;
      let cachedFallback = false;
      if (clientBibleCache.has(cacheKey)) {
        const cached = clientBibleCache.get(cacheKey)!;
        // Clean and adapt cached verses to modern NAA 2017 to avoid displaying old/incorrect terms from cached fallbacks
        const cleanVerses = cached.verses.map(v => ({
          ...v,
          text: bibleVersion === 'NAA' ? adaptToNAA(v.text) : v.text
        }));
        setVerses(cleanVerses);
        setIsFallbackActive(cached.isFallback);
        setFallbackWarning(cached.warning);
        setIsLoading(false);
        // Scroll smoothly to top of passage
        readerTopRef.current?.scrollIntoView({ behavior: 'smooth' });

        // Trigger background prefetch for adjacent chapters so they are ready if not cached yet
        prefetchAdjacentPassages(selectedBook, selectedChapter, bibleVersion);
        
        if (!cached.isFallback) {
          return;
        }
        cachedFallback = true;
      }

      try {
        const response = await fetch("/api/bible/passage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            book: selectedBook.name,
            chapter: selectedChapter,
            version: bibleVersion
          })
        });

        if (!response.ok) {
          throw new Error("Erro na resposta do servidor.");
        }

        const data = await response.json();
        if (active) {
          if (data && data.verses) {
            // Guard: check if returned verses are offline demo instructions
            const isDemoMessage = !!data.isDemo;
            if (isDemoMessage) {
              throw new Error("Demonstração ativa. Ativando busca direta pelo navegador.");
            }

            setVerses(data.verses);
            setIsFallbackActive(!!data.isFallback);
            setFallbackWarning(data.warning || null);
            
            // Store in client-side cache
            clientBibleCache.set(cacheKey, {
              verses: data.verses,
              isFallback: !!data.isFallback,
              warning: data.warning || null
            });
            saveClientBibleCache();

            // Background prefetch next/prev chapters
            prefetchAdjacentPassages(selectedBook, selectedChapter, bibleVersion);
          } else {
            throw new Error("Formato de resposta inválido.");
          }
        }
      } catch (err: any) {
        if (active) {
          if (cachedFallback) {
            console.log("[Bible Reader] Silently skipped background fallback override since cached fallback is already present.");
            return;
          }
          console.warn("Notice: Local server passage load deferred, trying direct browser fallbacks:", err);
          
          try {
            // First try direct browser fallback to online bolls.life Portuguese Bible API
            const bollsBookId = BIBLE_BOOKS_DATA.findIndex(b => b.name === selectedBook.name) + 1;
            const BOLLS_TRANSLATIONS: Record<string, string> = {
              "NAA": "ARA",
              "ARA": "ARA",
              "ARC": "ARC",
              "NVI": "NVIPT",
              "NTLH": "AA",
              "ACF": "ACF",
              "BLIVRE": "AA" // Use public domain AA (Almeida Atualizada) as fallback to prevent any copyright issues
            };
            const bollsTranslation = BOLLS_TRANSLATIONS[bibleVersion] || "ARA";
            const res = await fetch(`https://bolls.life/api/v1/single/${bollsTranslation}/${bollsBookId}/${selectedChapter}/`);
            if (res.ok) {
              const fbData = await res.json();
              if (active && Array.isArray(fbData)) {
                const formattedVerses = fbData.map((v: any) => ({
                  verse: Number(v.verse),
                  text: bibleVersion === 'NAA' ? adaptToNAA(v.text.trim()) : v.text.trim()
                }));
                setVerses(formattedVerses);
                setIsFallbackActive(true);
                const warningMsg = bibleVersion === 'BLIVRE'
                  ? "Exibindo tradução Almeida (AA) pública como contingência para a Bíblia Livre."
                  : `Exibindo tradução ${bibleVersion} via servidor de contingência.`;
                setFallbackWarning(warningMsg);
                setError(null);

                // Also cache fallback results so we don't spam requests
                clientBibleCache.set(cacheKey, {
                  verses: formattedVerses,
                  isFallback: true,
                  warning: warningMsg
                });
                saveClientBibleCache();

                prefetchAdjacentPassages(selectedBook, selectedChapter, bibleVersion);
                return;
              }
            }
          } catch (fallbackErr) {
            console.warn("Information: Fallback bolls-api not available, attempting bible-api.com fallback.");
          }

          try {
            // Direct browser-friendly bible-api.com fallback (supports CORS)
            const queryRef = `${selectedBook.apiId} ${selectedChapter}`;
            const res = await fetch(`https://bible-api.com/${encodeURIComponent(queryRef)}?translation=almeida`);
            if (res.ok) {
              const fbData = await res.json();
              if (active && fbData && fbData.verses) {
                const formattedVerses = fbData.verses.map((v: any, idx: number) => ({
                  verse: Number(v.verse || idx + 1),
                  text: bibleVersion === 'NAA' ? adaptToNAA(v.text.trim()) : v.text.trim()
                }));
                setVerses(formattedVerses);
                setIsFallbackActive(true);
                setFallbackWarning("Exibindo tradução Almeida via servidor de contingência super-resiliente.");
                setError(null);

                clientBibleCache.set(cacheKey, {
                  verses: formattedVerses,
                  isFallback: true,
                  warning: "Exibindo tradução Almeida via servidor de contingência super-resiliente."
                });
                saveClientBibleCache();

                prefetchAdjacentPassages(selectedBook, selectedChapter, bibleVersion);
                return;
              }
            }
          } catch (apiErr) {
            console.warn("Information: bible-api.com fallback not available.");
          }

          // Ultra resilient final client-side offline database fallback
          if (active) {
            try {
              const offlineResult = getLocalBiblePassage(selectedBook.name, selectedChapter, bibleVersion);
              setVerses(offlineResult.verses);
              setIsFallbackActive(offlineResult.isFallback);
              setFallbackWarning(offlineResult.warning);
              setError(null);
            } catch (localErr) {
              setError("Não foi possível carregar este capítulo. Tente selecionar outra tradução ou recarregue.");
            }
          }
        }
      } finally {
        if (active) {
          setIsLoading(false);
          // Scroll smoothly to top of passage
          readerTopRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    loadPassage();
    return () => {
      active = false;
    };
  }, [selectedBook, selectedChapter, bibleVersion, reloadTrigger]);

  // Handle Book Selection
  const handleSelectBook = (book: BibleBook) => {
    hasInitializedFromLiturgy.current = true;
    setSelectedBook(book);
    setSelectedChapter(1); // Reset chapter to 1 on book change
    setShowBookDropdown(false);
    setShowChapterSelector(true); // Auto open chapter selector for premium UX
    setShowVerseSelector(false);
    setActiveVerseOverlay(null);
  };

  // Handle Chapter Selection
  const handleSelectChapter = (ch: number) => {
    hasInitializedFromLiturgy.current = true;
    setSelectedChapter(ch);
    setShowChapterSelector(false);
    setShowVerseSelector(true); // Auto open verse selector for premium UX
    setActiveVerseOverlay(null);
  };

  // Handle Verse Selection
  const handleSelectVerse = (verseNum: number) => {
    hasInitializedFromLiturgy.current = true;
    setShowVerseSelector(false);
    const element = document.getElementById(`verse-container-${verseNum}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const foundVerse = verses.find(v => v.verse === verseNum);
      if (foundVerse) {
        setActiveVerseOverlay(foundVerse);
        const verseKey = `${selectedBook.name}-${selectedChapter}-${verseNum}`;
        setTempNoteText(notes[verseKey] || '');
        setIsWritingNote(false);
      }
    }
  };

  // Persist highlights
  const toggleHighlight = (key: string, color: string) => {
    const updated = { ...highlights };
    if (updated[key] === color) {
      delete updated[key]; // Unhighlight if same color is clicked
    } else {
      updated[key] = color;
    }
    setHighlights(updated);
    localStorage.setItem('lilo-bible-highlights', JSON.stringify(updated));
  };

  const removeHighlight = (key: string) => {
    const updated = { ...highlights };
    delete updated[key];
    setHighlights(updated);
    localStorage.setItem('lilo-bible-highlights', JSON.stringify(updated));
  };

  // Persist notes
  const saveNote = (key: string, text: string) => {
    const updated = { ...notes };
    if (!text.trim()) {
      delete updated[key];
    } else {
      updated[key] = text;
    }
    setNotes(updated);
    localStorage.setItem('lilo-bible-notes', JSON.stringify(updated));
    setIsWritingNote(false);
  };

  const deleteNote = (key: string) => {
    const updated = { ...notes };
    delete updated[key];
    setNotes(updated);
    localStorage.setItem('lilo-bible-notes', JSON.stringify(updated));
    setIsWritingNote(false);
    setTempNoteText('');
  };

  // Persist Favorites
  const toggleFavorite = (key: string) => {
    let updated = [...favorites];
    if (updated.includes(key)) {
      updated = updated.filter(k => k !== key);
    } else {
      updated.push(key);
    }
    setFavorites(updated);
    localStorage.setItem('lilo-bible-favorites', JSON.stringify(updated));
  };

  // Fetch verse explanation from Gemini with real-time streaming
  const handleExplainVerse = async (vNum: number, vText: string) => {
    setIsAiLoading(true);
    setAiAnalysis('');
    setShowAiDrawer(true);
    try {
      const assistResponse = await fetch("/api/bible/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passage: `${selectedBook.name} ${selectedChapter}:${vNum}`,
          text: vText,
          version: bibleVersion,
          stream: true
        })
      });

      if (!assistResponse.ok) {
        throw new Error("Falha ao comunicar com o assistente.");
      }

      if (assistResponse.body) {
        const reader = assistResponse.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulated += parsed.text;
                  setAiAnalysis(accumulated);
                }
              } catch (e) {
                // Ignore partial JSON chunks
              }
            }
          }
        }

        if (!accumulated) {
          const data = await assistResponse.json();
          setAiAnalysis(data.explanation);
        }
      } else {
        const data = await assistResponse.json();
        setAiAnalysis(data.explanation);
      }
    } catch (err: any) {
      console.error("Error explaining verse:", err);
      setAiAnalysis("Desculpe, ocorreu uma falha ao contatar o assistente teológico. Verifique sua conexão de rede ou tente novamente.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle Bible study Chat query with streaming
  const handleAssistantQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatQuery.trim()) return;

    const userQuery = aiChatQuery;
    setAiChatQuery('');
    setIsAssistantLoading(true);

    const msgIndex = aiChatResponses.length;
    setAiChatResponses(prev => [
      ...prev, 
      { query: userQuery, response: '', timestamp: new Date() }
    ]);

    try {
      const response = await fetch("/api/bible/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passage: `${selectedBook.name} ${selectedChapter}`,
          text: `Dúvida do usuário: "${userQuery}". Contexto: O usuário está lendo ${selectedBook.name} capítulo ${selectedChapter}.`,
          version: bibleVersion,
          isGeneralQuery: true,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error("Erro na consulta.");
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulated += parsed.text;
                  setAiChatResponses(prev => {
                    const next = [...prev];
                    if (next[msgIndex]) {
                      next[msgIndex] = { ...next[msgIndex], response: accumulated };
                    }
                    return next;
                  });
                }
              } catch (e) {
                // Ignore partial JSON chunks
              }
            }
          }
        }

        if (!accumulated) {
          const data = await response.json();
          setAiChatResponses(prev => {
            const next = [...prev];
            if (next[msgIndex]) {
              next[msgIndex] = { ...next[msgIndex], response: data.explanation };
            }
            return next;
          });
        }
      } else {
        const data = await response.json();
        setAiChatResponses(prev => {
          const next = [...prev];
          if (next[msgIndex]) {
            next[msgIndex] = { ...next[msgIndex], response: data.explanation };
          }
          return next;
        });
      }
    } catch (err: any) {
      console.error("Assistant chat error:", err);
      setAiChatResponses(prev => {
        const next = [...prev];
        if (next[msgIndex]) {
          next[msgIndex] = { ...next[msgIndex], response: "Não foi possível obter resposta no momento. Certifique-se de que a chave do Gemini está correta nas Configurações." };
        }
        return next;
      });
    } finally {
      setIsAssistantLoading(false);
    }
  };

  // Expose triggerThemeSearch so it can be called from the top bar or other views
  const triggerThemeSearch = async (query: string) => {
    if (!query.trim()) return;
    setThemeSearchQuery(query);
    setTopSearchQuery(query);
    setShowAiAssistant(true);
    setSidebarTab('theme');

    setIsThemeSearching(true);
    setThemeSearchError(null);
    setThemeSearchResults([]);

    try {
      const response = await fetch('/api/bible/keyword-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: query,
          version: 'NAA' // Search using the high-fidelity NAA translation
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao consultar passagens temáticas.');
      }

      const data = await response.json();
      if (data && Array.isArray(data.passages)) {
        setThemeSearchResults(data.passages);
      } else {
        throw new Error('Nenhum resultado recebido do assistente.');
      }
    } catch (err: any) {
      console.error("Theme search error:", err);
      setThemeSearchError(err?.message || 'Falha ao buscar passagens temáticas por inteligência artificial.');
    } finally {
      setIsThemeSearching(false);
    }
  };

  // Handle thematic search with Gemini API
  const handleThemeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerThemeSearch(themeSearchQuery);
  };

  // Handle navigation to a passage returned in the thematic search results
  const handleNavigateToPassage = (refStr: string) => {
    const parsed = parseBibleReference(refStr);
    if (parsed) {
      const foundBook = BIBLE_BOOKS_DATA.find(b => b.name.toLowerCase() === parsed.book.name.toLowerCase());
      if (foundBook) {
        setSelectedBook(foundBook);
        setSelectedChapter(parsed.chapter);
        
        // Scroll to the verse if specified
        if (parsed.verseRange) {
          const verseNum = parseInt(parsed.verseRange.split('-')[0], 10);
          setTimeout(() => {
            const element = document.getElementById(`verse-container-${verseNum}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Highlight/overlay the verse for a premium experience
              const foundVerse = verses.find(v => v.verse === verseNum);
              if (foundVerse) {
                setActiveVerseOverlay(foundVerse);
              }
            }
          }, 800);
        }
      }
    }
  };

  // Generate Image Card
  const downloadVerseCard = async () => {
    if (!cardRef.current) return;
    setIsGeneratingCard(true);
    try {
      const dataUrl = await toJpeg(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Lilo_Versiculo_${selectedBook.name}_${selectedChapter}_${cardVerse?.verse}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image card:", err);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Share Card on WhatsApp
  const shareOnWhatsApp = async () => {
    if (!cardRef.current || !cardVerse) return;
    setIsSharingCard(true);
    try {
      const dataUrl = await toJpeg(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      
      // Get image blob for sharing
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `Liloupro_${selectedBook.name}_${selectedChapter}_${cardVerse.verse}.jpg`, { type: 'image/jpeg' });

      // If Web Share API is available for files, share ONLY the card image
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file]
        });
      } else {
        // Fallback: Download the card image automatically so the user can send it, and open WhatsApp
        const link = document.createElement('a');
        link.download = `Liloupro_Versiculo_${selectedBook.name}_${selectedChapter}_${cardVerse.verse}.jpg`;
        link.href = dataUrl;
        link.click();
        
        // Open WhatsApp Web/Desktop directly
        const whatsappUrl = `https://web.whatsapp.com/`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (err) {
      console.error("Error sharing to WhatsApp:", err);
      // Fallback: try download
      const dataUrl = await toJpeg(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Liloupro_Versiculo_${selectedBook.name}_${selectedChapter}_${cardVerse.verse}.jpg`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsSharingCard(false);
    }
  };

  // Filter books list
  const filteredBooks = useMemo(() => {
    return BIBLE_BOOKS_DATA.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(searchBookQuery.toLowerCase()) || 
                            b.abbrev.toLowerCase().includes(searchBookQuery.toLowerCase());
      const matchesTestament = testamentFilter === 'ALL' || b.testament === testamentFilter;
      return matchesSearch && matchesTestament;
    });
  }, [searchBookQuery, testamentFilter]);

  // Navigate chapters
  const handlePrevChapter = () => {
    hasInitializedFromLiturgy.current = true;
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else {
      // Go to previous book's last chapter
      const currentIdx = BIBLE_BOOKS_DATA.findIndex(b => b.name === selectedBook.name);
      if (currentIdx > 0) {
        const prevBook = BIBLE_BOOKS_DATA[currentIdx - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(prevBook.chapters);
      }
    }
  };

  const handleNextChapter = () => {
    hasInitializedFromLiturgy.current = true;
    if (selectedChapter < selectedBook.chapters) {
      setSelectedChapter(selectedChapter + 1);
    } else {
      // Go to next book's chapter 1
      const currentIdx = BIBLE_BOOKS_DATA.findIndex(b => b.name === selectedBook.name);
      if (currentIdx < BIBLE_BOOKS_DATA.length - 1) {
        const nextBook = BIBLE_BOOKS_DATA[currentIdx + 1];
        setSelectedBook(nextBook);
        setSelectedChapter(1);
      }
    }
  };

  return (
    <div 
      className={`flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-160px)] min-h-[450px] ${
        nightMode === 'sepia' ? 'bg-[#fbf4e2] text-[#4a3b2c]' :
        nightMode === 'pitchBlack' ? 'bg-[#000000] text-[#dfcc9f]' :
        isLight ? 'bg-zinc-50 text-zinc-900' : 'bg-slate-950 text-slate-100'
      } font-sans relative overflow-hidden`} 
      id="bible-reader-root"
      style={{
        filter: `brightness(${brightnessLevel === 'high' ? '100' : brightnessLevel === 'medium' ? '82' : '65'}%)`,
        transition: 'filter 0.3s ease-in-out'
      }}
    >
      {/* Warm Blue Light Blocker Overlay (Night Comfort Shift) */}
      {blueLightFilter && (
        <div className="absolute inset-0 bg-[#ff8800]/[0.07] mix-blend-multiply pointer-events-none z-[100] transition-all duration-300" />
      )}

      {/* Scroll anchor */}
      <div ref={readerTopRef} />

      {/* Top Header Controls (Hidden in absolute zen reading mode) */}
      <AnimatePresence>
        {!isZenMode && (
          <motion.div 
            initial={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-b ${
              nightMode === 'sepia' ? 'border-[#ebdcb9] bg-[#ebdcb9]/95' :
              nightMode === 'pitchBlack' ? 'border-zinc-900 bg-black/95' :
              isLight ? 'border-zinc-200 bg-white/95' : 'border-slate-800 bg-slate-900/95'
            } backdrop-blur-md p-3 sm:p-4 shrink-0 z-30 flex flex-col gap-3 relative`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Selector Triggers */}
              <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                  <button 
                    id="book-selector-btn"
                    onClick={() => {
                      setShowBookDropdown(!showBookDropdown);
                      setShowChapterSelector(false);
                      setShowVerseSelector(false);
                    }}
                    className={`flex-1 sm:flex-none flex items-center justify-between sm:justify-start gap-1.5 px-3 py-2 ${isLight ? 'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-100 border-zinc-200 text-brand-dark' : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border-slate-700/60 text-brand'} rounded-xl transition-all font-extrabold text-xs sm:text-sm border shadow-md`}
                  >
                    <BookOpen size={16} className="shrink-0" />
                    <span className="truncate max-w-[80px] sm:max-w-none">{selectedBook.name}</span>
                    <ChevronRight size={12} className={`transform transition-transform shrink-0 ${showBookDropdown ? 'rotate-90' : ''}`} />
                  </button>

                  <button 
                    id="chapter-selector-btn"
                    onClick={() => {
                      setShowChapterSelector(!showChapterSelector);
                      setShowBookDropdown(false);
                      setShowVerseSelector(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 ${isLight ? 'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-100 border-zinc-200 text-zinc-800' : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border-slate-700/60 text-slate-100'} rounded-xl transition-all font-extrabold text-xs sm:text-sm border shadow-md shrink-0`}
                  >
                    <span>Cap. {selectedChapter}</span>
                    <ChevronRight size={12} className={`transform transition-transform shrink-0 ${showChapterSelector ? 'rotate-90' : ''}`} />
                  </button>

                  <button 
                    id="verse-selector-btn"
                    onClick={() => {
                      setShowVerseSelector(!showVerseSelector);
                      setShowBookDropdown(false);
                      setShowChapterSelector(false);
                    }}
                    disabled={verses.length === 0}
                    className={`flex items-center gap-1.5 px-3 py-2 ${isLight ? 'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-100 border-zinc-200 text-zinc-800' : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border-slate-700/60 text-slate-100'} rounded-xl transition-all font-extrabold text-xs sm:text-sm border shadow-md shrink-0 disabled:opacity-55`}
                    title="Selecione o Versículo"
                  >
                    <span>Ver. {activeVerseOverlay ? activeVerseOverlay.verse : 'Sel.'}</span>
                    <ChevronRight size={12} className={`transform transition-transform shrink-0 ${showVerseSelector ? 'rotate-90' : ''}`} />
                  </button>
                </div>

                {/* Next/Prev simple arrow shortcuts */}
                <div className={`flex items-center gap-1 ${isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-slate-850 border-slate-700/40'} p-1 rounded-xl border shrink-0`}>
                  <button 
                    onClick={handlePrevChapter}
                    className={`p-1.5 ${isLight ? 'hover:bg-zinc-200 text-zinc-600' : 'hover:bg-slate-700 text-slate-300'} rounded-lg transition-colors`}
                    title="Capítulo Anterior"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button 
                    onClick={handleNextChapter}
                    className={`p-1.5 ${isLight ? 'hover:bg-zinc-200 text-zinc-600' : 'hover:bg-slate-700 text-slate-300'} rounded-lg transition-colors`}
                    title="Próximo Capítulo"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Version & Preference Tools */}
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto overflow-x-auto sm:overflow-x-visible pb-1 sm:pb-0 custom-scrollbar select-none">
                <div className="flex items-center gap-2 shrink-0">
                  {/* AI Assistant Toggle Button (Highly visible on the far-left, pulsing and bright) */}
                  <button 
                    id="bible-ai-assistant-toggle"
                    onClick={() => setShowAiAssistant(!showAiAssistant)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-lg border cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${
                      showAiAssistant 
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.45)]' 
                        : (isLight 
                            ? 'bg-gradient-to-r from-violet-100 via-indigo-100 to-violet-150 border-violet-300 text-violet-800 hover:from-violet-200 hover:to-indigo-200 shadow-[0_0_12px_rgba(124,58,237,0.35)] animate-pulse' 
                            : 'bg-gradient-to-r from-violet-900/90 via-indigo-950/90 to-violet-950/90 border-violet-700/80 text-violet-100 hover:from-violet-800 hover:to-indigo-900 shadow-[0_0_15px_rgba(139,92,246,0.45)] animate-pulse')
                    }`}
                  >
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                    </span>
                    <Sparkles size={14} className="text-violet-400 shrink-0 animate-pulse" />
                    <span className="inline text-[11px] uppercase tracking-wider font-extrabold">Assistente IA</span>
                  </button>

                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wide shadow-sm border shrink-0 ${
                      isLight 
                        ? 'bg-zinc-100 text-zinc-800 border-zinc-200' 
                        : 'bg-slate-800 text-slate-100 border-slate-700'
                    }`}
                    title="Bíblia Livre (Livre de Direitos Autorais)"
                  >
                    Tradução: Bíblia Livre (BLIVRE)
                  </div>

                  <button
                    onClick={() => {
                      const cacheKey = `${selectedBook.name}-${selectedChapter}-${bibleVersion}`;
                      clientBibleCache.delete(cacheKey);
                      saveClientBibleCache();
                      try {
                        localStorage.removeItem('lilo-bible-search-cache');
                        localStorage.removeItem('lilo-bible-passages-cache-v3');
                        localStorage.removeItem('lilo-bible-passages-cache-v4');
                      } catch (e) {}
                      setReloadTrigger(prev => prev + 1);
                    }}
                    className={`p-1.5 rounded-xl transition-all border shadow-md shrink-0 flex items-center justify-center ${
                      isLight 
                        ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-200 active:bg-zinc-300' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60 active:bg-slate-900'
                    }`}
                    title="Recarregar Capítulo Atual"
                  >
                    <RotateCcw size={13} />
                  </button>

                  {/* Font Adjustments */}
                  <div className={`flex items-center ${isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-slate-800 border-slate-700/60'} p-0.5 rounded-xl border shadow-md`}>
                    <button 
                      onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                      className={`p-1 ${isLight ? 'hover:bg-zinc-200 text-zinc-600' : 'hover:bg-slate-700 text-slate-300'} rounded-lg transition-colors`}
                      title="Diminuir Fonte"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className={`text-[10px] px-1.5 font-mono ${isLight ? 'text-zinc-500' : 'text-slate-400'} font-bold`}>{fontSize}px</span>
                    <button 
                      onClick={() => setFontSize(prev => Math.min(32, prev + 2))}
                      className={`p-1 ${isLight ? 'hover:bg-zinc-200 text-zinc-600' : 'hover:bg-slate-700 text-slate-300'} rounded-lg transition-colors`}
                      title="Aumentar Fonte"
                    >
                      <ZoomIn size={14} />
                    </button>
                  </div>

                  {/* Night Reading Mode Controls */}
                  <div className={`flex items-center ${isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-slate-800 border-slate-700/60'} p-0.5 rounded-xl border shadow-md gap-0.5`}>
                    <button
                      onClick={() => setNightMode('off')}
                      className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        nightMode === 'off'
                          ? 'bg-brand text-slate-950 font-black shadow-sm'
                          : `${isLight ? 'text-zinc-650 hover:bg-zinc-200/50' : 'text-slate-400 hover:bg-slate-700/50'}`
                      }`}
                      title="Leitura Padrão"
                    >
                      Dia
                    </button>
                    <button
                      onClick={() => setNightMode('sepia')}
                      className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        nightMode === 'sepia'
                          ? 'bg-amber-400 text-amber-950 font-black shadow-sm'
                          : `${isLight ? 'text-zinc-650 hover:bg-zinc-200/50' : 'text-slate-400 hover:bg-slate-700/50'}`
                      }`}
                      title="Leitura Sépia (Filtro Âmbar Confortável)"
                    >
                      Sépia
                    </button>
                    <button
                      onClick={() => setNightMode('pitchBlack')}
                      className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        nightMode === 'pitchBlack'
                          ? 'bg-zinc-900 text-yellow-500 border border-yellow-500/35 font-black shadow-sm'
                          : `${isLight ? 'text-zinc-650 hover:bg-zinc-200/50' : 'text-slate-400 hover:bg-slate-700/50'}`
                      }`}
                      title="Leitura Noturna Extrema (Fundo Preto Amoled)"
                    >
                      Breu
                    </button>
                  </div>

                  {/* Anti-Fatigue / Eye Comfort Controls */}
                  <button
                    onClick={() => setBlueLightFilter(!blueLightFilter)}
                    className={`p-1.5 rounded-xl transition-all border shadow-md shrink-0 flex items-center justify-center gap-1 ${
                      blueLightFilter
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
                        : `${isLight ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60'}`
                    }`}
                    title="Filtro Anti-Luz Azul para Noite (Prepara o Cérebro para o Sono)"
                  >
                    <Glasses size={13} className={blueLightFilter ? 'animate-pulse' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Filtro</span>
                  </button>

                  <div className={`flex items-center ${isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-slate-800 border-slate-700/60'} p-0.5 rounded-xl border shadow-md gap-0.5`}>
                    <button
                      onClick={() => {
                        if (brightnessLevel === 'high') setBrightnessLevel('medium');
                        else if (brightnessLevel === 'medium') setBrightnessLevel('low');
                        else setBrightnessLevel('high');
                      }}
                      className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 ${
                        brightnessLevel !== 'high' 
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/10 font-black' 
                          : `${isLight ? 'text-zinc-650 hover:bg-zinc-200/50' : 'text-slate-400 hover:bg-slate-700/50'}`
                      }`}
                      title={`Brilho do Ecrã: ${brightnessLevel === 'high' ? 'Alto (100%)' : brightnessLevel === 'medium' ? 'Médio (82%)' : 'Baixo (65%)'}`}
                    >
                      <SunDim size={12} className={brightnessLevel !== 'high' ? 'text-amber-500' : ''} />
                      <span>{brightnessLevel === 'high' ? '100%' : brightnessLevel === 'medium' ? '82%' : '65%'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Focus/Zen Mode Toggle */}
                  <button 
                    onClick={() => setIsZenMode(true)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 ${isLight ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60'} rounded-xl transition-colors border text-xs font-bold`}
                    title="Modo Foco / Zen"
                  >
                    <Maximize2 size={13} />
                    <span className="inline text-[11px]">Expandir</span>
                  </button>
                </div>
              </div>

              {/* Keyword Search Sub-Bar */}
              <div className={`flex flex-col sm:flex-row sm:items-center gap-2.5 border-t ${isLight ? 'border-zinc-100' : 'border-slate-800/60'} pt-3`}>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    triggerThemeSearch(topSearchQuery);
                  }}
                  className="flex items-center gap-2 w-full max-w-md shrink-0"
                >
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Search size={14} className="text-brand" />
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar temas na Bíblia por IA (Ex: Perdão, Amor, Fé)..."
                      value={topSearchQuery}
                      onChange={(e) => setTopSearchQuery(e.target.value)}
                      className={`w-full ${isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-950 focus:border-indigo-400' : 'bg-slate-800 border-slate-700/60 text-slate-100 focus:border-indigo-500'} focus:outline-none rounded-xl pl-9 pr-9 py-2 text-xs border shadow-sm h-9`}
                    />
                    <button
                      type="button"
                      onClick={() => startVoiceRecognition('top', setTopSearchQuery)}
                      title={isListening && listeningTarget === 'top' ? "Ouvindo... Clique para parar" : "Capturar tema por comando de voz"}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${
                        isListening && listeningTarget === 'top'
                          ? 'text-red-500 animate-pulse bg-red-500/10'
                          : isLight ? 'text-zinc-400 hover:text-indigo-600' : 'text-slate-400 hover:text-indigo-400'
                      }`}
                    >
                      {isListening && listeningTarget === 'top' ? <MicOff size={14} /> : <Mic size={14} />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="h-9 px-4 bg-brand text-slate-950 font-black rounded-xl transition-all hover:bg-brand/90 text-[10px] uppercase tracking-wider shadow-md shrink-0 flex items-center justify-center cursor-pointer"
                  >
                    Buscar por Tema
                  </button>
                </form>
                <div className={`flex flex-wrap items-center gap-1.5 text-[10px] font-bold ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>
                  <span className="shrink-0">Temas populares:</span>
                  {['Perdão', 'Fé', 'Amor', 'Graça'].map(pop => (
                    <button
                      key={pop}
                      type="button"
                      onClick={() => triggerThemeSearch(pop)}
                      className={`px-2 py-1 rounded-lg border ${isLight ? 'bg-zinc-100 border-zinc-200 hover:bg-zinc-250 text-zinc-700' : 'bg-slate-800/50 border-slate-700/40 hover:bg-slate-750 text-slate-300'} transition-all cursor-pointer`}
                    >
                      {pop}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Popovers / Selectors (Drop-down views) - Inside the sticky container so they scroll with it */}
            <AnimatePresence>
              {showBookDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute top-[125px] sm:top-[72px] left-4 max-w-lg w-[calc(100%-2rem)] max-h-[70vh] ${isLight ? 'bg-white border-zinc-200 shadow-xl' : 'bg-slate-900 border-slate-800'} border rounded-2xl shadow-2xl z-30 p-4 flex flex-col gap-3 overflow-hidden`}
                >
                  <div className="flex items-center justify-between gap-3 shrink-0">
                    <h3 className={`font-extrabold text-sm ${isLight ? 'text-zinc-800' : 'text-slate-200'} flex items-center gap-2`}>
                      <BookOpen size={16} className="text-brand" />
                      Selecione o Livro
                    </h3>
                    <button 
                      onClick={() => setShowBookDropdown(false)}
                      className={`p-1 ${isLight ? 'hover:bg-zinc-100 text-zinc-500' : 'hover:bg-slate-800 text-slate-400'} rounded-lg`}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Liturgical Readings Quick Access */}
                  {liturgicalReadingsList.length > 0 && (
                    <div className="shrink-0 space-y-1 pb-2 border-b border-white/5">
                      <span className={`text-[9px] font-black uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>
                        Leituras Planejadas da Liturgia
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto no-scrollbar py-0.5">
                        {liturgicalReadingsList.map((reading, rIdx) => {
                          const isCurrentlySelected = selectedBook.name === reading.book.name && selectedChapter === reading.chapter && bibleVersion === 'NAA';
                          return (
                            <button
                              key={rIdx}
                              onClick={() => {
                                setSelectedBook(reading.book);
                                setSelectedChapter(reading.chapter);
                                setBibleVersion('NAA');
                                setShowBookDropdown(false);
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                isCurrentlySelected
                                  ? 'bg-brand text-slate-950 font-black scale-95 shadow-sm'
                                  : (isLight ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800' : 'bg-slate-800 hover:bg-slate-700 text-brand border border-brand/20')
                              }`}
                              title={`${reading.serviceTitle} (${reading.serviceDate})`}
                            >
                              <BookOpen size={10} />
                              {reading.itemTitle}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Filter controls */}
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Pesquisar livro... (Ex: Jo, Sl, Romanos)"
                        value={searchBookQuery}
                        onChange={(e) => setSearchBookQuery(e.target.value)}
                        className={`w-full pl-9 pr-3 py-1.5 ${isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400' : 'bg-slate-950 border-slate-800 text-slate-100'} focus:border-brand border rounded-xl text-xs focus:outline-none`}
                      />
                    </div>
                    <div className={`flex ${isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-slate-950 border-slate-800'} p-0.5 rounded-xl border`}>
                      <button
                        onClick={() => setTestamentFilter('ALL')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors ${testamentFilter === 'ALL' ? (isLight ? 'bg-white text-zinc-800 shadow-sm' : 'bg-slate-800 text-slate-100') : 'text-slate-400'}`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => setTestamentFilter('AT')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors ${testamentFilter === 'AT' ? (isLight ? 'bg-emerald-100 text-emerald-800 shadow-sm' : 'bg-emerald-950/60 text-emerald-300') : 'text-slate-400'}`}
                      >
                        A.T.
                      </button>
                      <button
                        onClick={() => setTestamentFilter('NT')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors ${testamentFilter === 'NT' ? (isLight ? 'bg-sky-100 text-sky-800 shadow-sm' : 'bg-sky-950/60 text-sky-300') : 'text-slate-400'}`}
                      >
                        N.T.
                      </button>
                    </div>
                  </div>

                  {/* Books Grid */}
                  <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 custom-scrollbar">
                    {filteredBooks.map((book) => {
                      const isSelected = selectedBook.name === book.name;
                      return (
                        <button
                          key={book.name}
                          onClick={() => handleSelectBook(book)}
                          className={`flex items-center justify-between p-2 rounded-xl text-left transition-all border ${
                            isSelected 
                              ? (isLight ? 'bg-brand/10 border-brand text-brand-dark font-black' : 'bg-slate-800 border-brand text-brand') 
                              : (isLight ? 'bg-zinc-50 border-zinc-200/60 hover:bg-zinc-100 text-zinc-700' : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/50 hover:border-slate-700 text-slate-300')
                          }`}
                        >
                          <div className="flex flex-col leading-tight">
                            <span className="text-xs font-extrabold">{book.name}</span>
                            <span className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-slate-500'} font-mono`}>{book.category}</span>
                          </div>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isLight ? 'bg-zinc-200/80 border-zinc-300 text-zinc-600' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                            {book.chapters} cap
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {showChapterSelector && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute top-[125px] sm:top-[72px] left-4 sm:left-[150px] max-w-sm w-[calc(100%-2rem)] ${isLight ? 'bg-white border-zinc-200 shadow-xl' : 'bg-slate-900 border-slate-800'} border rounded-2xl shadow-2xl z-30 p-4 flex flex-col gap-3`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={`font-extrabold text-sm ${isLight ? 'text-zinc-800' : 'text-slate-200'}`}>
                      Capítulos de <span className="text-brand">{selectedBook.name}</span>
                    </h3>
                    <button 
                      onClick={() => setShowChapterSelector(false)}
                      className={`p-1 ${isLight ? 'hover:bg-zinc-100 text-zinc-500' : 'hover:bg-slate-800 text-slate-400'} rounded-lg`}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Scrollable grid of chapter numbers */}
                  <div className="max-h-[40vh] overflow-y-auto grid grid-cols-5 sm:grid-cols-6 gap-2 p-1 custom-scrollbar">
                    {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => {
                      const isSelected = selectedChapter === ch;
                      return (
                        <button
                          key={ch}
                          onClick={() => handleSelectChapter(ch)}
                          className={`aspect-square flex items-center justify-center rounded-xl text-xs font-black transition-all border ${
                            isSelected 
                              ? 'bg-brand text-slate-950 border-brand scale-105 shadow-md shadow-brand/20' 
                              : (isLight ? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700' : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700 text-slate-200')
                          }`}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {showVerseSelector && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute top-[125px] sm:top-[72px] left-4 sm:left-[240px] max-w-sm w-[calc(100%-2rem)] ${isLight ? 'bg-white border-zinc-200 shadow-xl' : 'bg-slate-900 border-slate-800'} border rounded-2xl shadow-2xl z-30 p-4 flex flex-col gap-3`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={`font-extrabold text-sm ${isLight ? 'text-zinc-800' : 'text-slate-200'}`}>
                      Versículos de <span className="text-brand">{selectedBook.name} {selectedChapter}</span>
                    </h3>
                    <button 
                      onClick={() => setShowVerseSelector(false)}
                      className={`p-1 ${isLight ? 'hover:bg-zinc-100 text-zinc-500' : 'hover:bg-slate-800 text-slate-400'} rounded-lg`}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Scrollable grid of verse numbers */}
                  <div className="max-h-[40vh] overflow-y-auto grid grid-cols-5 sm:grid-cols-6 gap-2 p-1 custom-scrollbar">
                    {verses.map((v) => {
                      const isSelected = activeVerseOverlay?.verse === v.verse;
                      return (
                        <button
                          key={v.verse}
                          onClick={() => handleSelectVerse(v.verse)}
                          className={`aspect-square flex items-center justify-center rounded-xl text-xs font-black transition-all border ${
                            isSelected 
                              ? 'bg-brand text-slate-950 border-brand scale-105 shadow-md shadow-brand/20' 
                              : (isLight ? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700' : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700 text-slate-200')
                          }`}
                        >
                          {v.verse}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Zen Mode exit button */}
      {isZenMode && (
        <button
          onClick={() => setIsZenMode(false)}
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 ${isLight ? 'bg-white/90 text-zinc-800 border-zinc-200' : 'bg-slate-900/90 text-slate-100 border-slate-800'} border rounded-full shadow-2xl backdrop-blur-md text-xs font-black transition-all group scale-95 hover:scale-100`}
        >
          <Minimize2 size={14} className="group-hover:rotate-45 transition-transform" />
          <span>Sair do Modo Foco</span>
        </button>
      )}

      {/* Main Body Layout (Flexbox splitter for reader content vs sidebars) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT COLUMN: Clean scripture reading flow */}
        <div className={`flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar ${
          nightMode === 'sepia' ? 'bg-[#fbf4e2] text-[#4a3b2c]' :
          nightMode === 'pitchBlack' ? 'bg-[#000000] text-[#dfcc9f]' :
          isLight ? 'bg-zinc-50 text-zinc-900' : 'bg-slate-950 text-slate-100'
        }`}>
          <div className="max-w-2xl mx-auto w-full flex flex-col h-full">
            
            {/* Loading Indicator */}
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className={`w-12 h-12 border-4 border-t-brand ${isLight ? 'border-zinc-200' : 'border-slate-800'} rounded-full animate-spin`} />
                <p className={`text-sm font-bold ${isLight ? 'text-zinc-500' : 'text-slate-400'} uppercase tracking-wider animate-pulse`}>Buscando versículos em {selectedBook.name}...</p>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={48} className="text-red-500 mb-3" />
                <p className="text-red-400 font-bold mb-4">{error}</p>
                <button 
                  onClick={() => setSelectedChapter(selectedChapter)} // trigger reload
                  className={`px-4 py-2 ${isLight ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800 border border-zinc-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-100'} rounded-xl font-bold text-xs flex items-center gap-2`}
                >
                  <RotateCcw size={14} />
                  Tentar Novamente
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6 pb-24">
                
                {/* Guia Rápido do Estudo Bíblico */}
                <ContextualHelp
                  id="bible_study_guide"
                  title="Estudo e Ministração Bíblica"
                  description="Explore os recursos exclusivos do Liloupro para enriquecer a sua leitura, preparar pregações e compartilhar a Palavra de forma moderna e profissional."
                  steps={[
                    "Toque em qualquer versículo para abrir o menu de interação rápida: aplique marcadores coloridos, favorite passagens prediletas ou crie anotações de estudo pessoal.",
                    "O Assistente de IA do Liloupro responde dúvidas sobre teologia sistemática, termos originais, contextos históricos ou referências bíblicas no chat lateral — com suporte a ditar por voz 🎤.",
                    "Utilize a barra de Busca por Tema para encontrar passagens sugeridas por IA. Toque no ícone do microfone 🎤 para captar e buscar o tema desejado por comando de voz sem precisar digitar!"
                  ]}
                  specialSteps={[
                    "Criar Card de Imagem: No menu de versículos, toque no ícone de imagem para personalizar a tipografia, cores, plano de fundo e gerar um lindo slide/imagem pronto para compartilhar!",
                    "Envio Direto: Compartilhe textos bíblicos e as análises teológicas diretamente com a sua equipe no WhatsApp com apenas um toque."
                  ]}
                  tip="Gere e baixe os Cards de Versículos em alta definição. Eles se adaptam perfeitamente para posts no Instagram ou slides de Projeção!"
                  theme={isLight ? 'light' : 'dark'}
                />

                {/* Visual Header / Title for the current chapter */}
                <div className={`text-center md:text-left py-4 border-b ${
                  nightMode === 'sepia' ? 'border-[#dacda8]/60' :
                  nightMode === 'pitchBlack' ? 'border-zinc-900' :
                  isLight ? 'border-zinc-200' : 'border-slate-900'
                }`}>
                  <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand mb-1">
                    <span>{selectedBook.testament === 'AT' ? 'Antigo Testamento' : 'Novo Testamento'}</span>
                    <span>•</span>
                    <span>{selectedBook.category}</span>
                  </div>
                  <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${
                    nightMode === 'sepia' ? 'text-[#36271c]' :
                    nightMode === 'pitchBlack' ? 'text-[#fbf0d3]' :
                    isLight ? 'text-zinc-900' : 'text-slate-50'
                  }`}>
                    {selectedBook.name} {selectedChapter}
                  </h1>
                  <p className={`text-xs ${
                    nightMode === 'sepia' ? 'text-[#6e5845]' :
                    nightMode === 'pitchBlack' ? 'text-[#b29e74]' :
                    isLight ? 'text-zinc-500' : 'text-slate-400'
                  } font-mono mt-1 uppercase tracking-wide`}>
                    Tradução: {bibleVersion} • {verses.length} versículos
                  </p>
                </div>

                {/* Verses Content Block */}
                <div 
                  className="flex flex-col gap-5 leading-relaxed tracking-wide text-justify font-sans"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {verses.map((v) => {
                    const verseKey = `${selectedBook.name}-${selectedChapter}-${v.verse}`;
                    const highlightColor = highlights[verseKey];
                    const hasNote = !!notes[verseKey];
                    const isFav = favorites.includes(verseKey);

                    return (
                      <div 
                        key={v.verse}
                        id={`verse-container-${v.verse}`}
                        onClick={() => {
                          setActiveVerseOverlay(v);
                          setTempNoteText(notes[verseKey] || '');
                          setIsWritingNote(false);
                        }}
                        className={`group relative p-2 rounded-xl transition-all duration-300 cursor-pointer select-text ${
                          activeVerseOverlay?.verse === v.verse 
                            ? (nightMode === 'sepia' ? 'bg-[#ebdcb9] ring-1 ring-[#dacda8]' :
                               nightMode === 'pitchBlack' ? 'bg-zinc-900/60 ring-1 ring-zinc-800' :
                               isLight ? 'bg-zinc-100 ring-1 ring-zinc-200' : 'bg-slate-900/60 ring-1 ring-slate-800') 
                            : (nightMode === 'sepia' ? 'hover:bg-[#f3e5c5]' :
                               nightMode === 'pitchBlack' ? 'hover:bg-zinc-950/45' :
                               isLight ? 'hover:bg-zinc-100/50' : 'hover:bg-slate-900/20')
                        }`}
                      >
                        {/* Verses styling container */}
                        <p className="inline align-baseline">
                          <span className={`font-extrabold font-mono text-xs sm:text-sm mr-2 text-brand select-none align-super ${
                            nightMode === 'sepia' ? 'bg-[#ebdcb9] border-[#dacda8] text-amber-950' :
                            nightMode === 'pitchBlack' ? 'bg-[#050505] border-zinc-900 text-[#dfcc9f]' :
                            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-slate-900 border-slate-800'
                          } px-1.5 py-0.5 rounded border`}>
                            {v.verse}
                          </span>
                          
                          <span className={`transition-all duration-200 py-0.5 rounded ${
                            highlightColor === 'yellow' ? (nightMode === 'sepia' ? 'bg-yellow-300 text-zinc-950' : nightMode === 'pitchBlack' ? 'bg-yellow-500/35 text-yellow-100' : isLight ? 'bg-yellow-200 text-zinc-950' : 'bg-yellow-500/25 text-yellow-100') :
                            highlightColor === 'green' ? (nightMode === 'sepia' ? 'bg-emerald-200 text-zinc-950' : nightMode === 'pitchBlack' ? 'bg-emerald-500/35 text-emerald-100' : isLight ? 'bg-emerald-100 text-zinc-950' : 'bg-emerald-500/25 text-emerald-100') :
                            highlightColor === 'blue' ? (nightMode === 'sepia' ? 'bg-sky-200 text-zinc-950' : nightMode === 'pitchBlack' ? 'bg-sky-500/35 text-sky-100' : isLight ? 'bg-sky-100 text-zinc-950' : 'bg-sky-500/25 text-sky-100') :
                            highlightColor === 'pink' ? (nightMode === 'sepia' ? 'bg-pink-300 text-zinc-950' : nightMode === 'pitchBlack' ? 'bg-pink-500/35 text-pink-100' : isLight ? 'bg-pink-100 text-zinc-950' : 'bg-pink-500/25 text-pink-100') : ''
                          }`}>
                            {v.text}
                          </span>
                        </p>

                        {/* Interactive metadata tags on the verse line */}
                        <div className="inline-flex items-center gap-1.5 ml-2 select-none vertical-align-middle">
                          {hasNote && (
                            <span className="inline-flex items-center justify-center p-1 bg-amber-950/60 border border-amber-900/50 text-amber-400 rounded-lg text-[10px]" title="Ver anotação">
                              <FileText size={10} />
                            </span>
                          )}
                          {isFav && (
                            <span className="inline-flex items-center justify-center p-1 bg-rose-950/60 border border-rose-900/50 text-rose-400 rounded-lg text-[10px]" title="Favorito">
                              <Heart size={10} fill="currentColor" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer simple navigation shortcuts */}
                <div className={`flex items-center justify-between mt-12 pt-6 border-t ${
                  nightMode === 'sepia' ? 'border-[#dacda8]/60' :
                  nightMode === 'pitchBlack' ? 'border-zinc-900' :
                  isLight ? 'border-zinc-200' : 'border-slate-900'
                }`}>
                  <button
                    onClick={handlePrevChapter}
                    className={`flex items-center gap-2 px-4 py-2 ${
                      nightMode === 'sepia' ? 'bg-[#ebdcb9] hover:bg-[#ebdcb9]/85 border-[#dacda8]/75 text-amber-950' :
                      nightMode === 'pitchBlack' ? 'bg-zinc-900 hover:bg-zinc-850 border-zinc-850 text-[#dfcc9f]' :
                      isLight ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                    } rounded-xl border text-xs font-bold transition-all`}
                  >
                    <ArrowLeft size={14} />
                    Anterior
                  </button>

                  <div className={`text-xs font-extrabold ${
                    nightMode === 'sepia' ? 'text-[#8c7a65]' :
                    nightMode === 'pitchBlack' ? 'text-[#a28e64]' :
                    isLight ? 'text-zinc-400' : 'text-slate-500'
                  } uppercase tracking-widest font-mono`}>
                    {selectedBook.name} {selectedChapter}
                  </div>

                  <button
                    onClick={handleNextChapter}
                    className={`flex items-center gap-2 px-4 py-2 ${
                      nightMode === 'sepia' ? 'bg-[#ebdcb9] hover:bg-[#ebdcb9]/85 border-[#dacda8]/75 text-amber-950' :
                      nightMode === 'pitchBlack' ? 'bg-zinc-900 hover:bg-zinc-850 border-zinc-850 text-[#dfcc9f]' :
                      isLight ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                    } rounded-xl border text-xs font-bold transition-all`}
                  >
                    Próximo
                    <ArrowRight size={14} />
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* RIGHT SIDEBAR 1: AI Chat Assistant Panel */}
        <AnimatePresence>
          {showAiAssistant && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className={`fixed md:relative right-0 top-0 bottom-0 h-[100dvh] max-h-[100dvh] md:h-full w-full md:w-[400px] ${
                nightMode === 'sepia' ? 'bg-[#fbf4e2] border-[#dacda8] text-[#4a3b2c]' :
                nightMode === 'pitchBlack' ? 'bg-[#000000] border-zinc-900 text-[#dfcc9f]' :
                isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-800' : 'bg-slate-900 border-slate-800 text-slate-100'
              } border-l flex flex-col z-50 md:z-30 shadow-2xl overflow-hidden`}
            >
              {/* Sidebar Header */}
              <div className={`p-4 border-b ${
                nightMode === 'sepia' ? 'border-[#ebdcb9] bg-[#ebdcb9]' :
                nightMode === 'pitchBlack' ? 'border-zinc-900 bg-black' :
                isLight ? 'border-zinc-200 bg-zinc-100' : 'border-slate-800 bg-slate-950'
              } flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 ${
                    nightMode === 'sepia' ? 'bg-amber-100 border-amber-200 text-amber-800' :
                    nightMode === 'pitchBlack' ? 'bg-zinc-900 text-amber-400 border-zinc-800' :
                    isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-indigo-950 text-indigo-400 border-indigo-900'
                  } rounded-xl border`}>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className={`font-extrabold text-sm ${
                      nightMode === 'sepia' ? 'text-[#36271c]' :
                      nightMode === 'pitchBlack' ? 'text-[#fbf0d3]' :
                      isLight ? 'text-zinc-800' : 'text-slate-200'
                    }`}>Assistente de Estudo</h3>
                    <p className={`text-[10px] ${
                      nightMode === 'sepia' ? 'text-amber-800' :
                      nightMode === 'pitchBlack' ? 'text-amber-500' :
                      isLight ? 'text-indigo-600' : 'text-indigo-400'
                    } font-bold uppercase tracking-wider`}>Desenvolvido pelo Gemini</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAiAssistant(false)}
                  className={`p-1.5 ${isLight ? 'hover:bg-zinc-200 text-zinc-500' : 'hover:bg-slate-800 text-slate-400'} rounded-xl`}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Sidebar Navigation Tabs */}
              <div className={`flex border-b ${
                nightMode === 'sepia' ? 'border-[#ebdcb9] bg-[#ebdcb9]/50' :
                nightMode === 'pitchBlack' ? 'border-zinc-900 bg-black/40' :
                isLight ? 'border-zinc-200 bg-zinc-50' : 'border-slate-850 bg-slate-950/40'
              } p-1.5 gap-1.5 shrink-0`}>
                <button
                  type="button"
                  onClick={() => setSidebarTab('chat')}
                  className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                    sidebarTab === 'chat'
                      ? 'bg-brand text-slate-900 font-extrabold shadow-md'
                      : 'text-text-muted hover:text-text-main hover:bg-white/5'
                  }`}
                >
                  Perguntar à IA (Chat)
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('theme')}
                  className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                    sidebarTab === 'theme'
                      ? 'bg-brand text-slate-900 font-extrabold shadow-md'
                      : 'text-text-muted hover:text-text-main hover:bg-white/5'
                  }`}
                >
                  Buscar por Tema 🔍
                </button>
              </div>

              {/* Sidebar Body */}
              {sidebarTab === 'chat' ? (
                <>
                  {/* Chat Log */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                    
                    {/* Intro welcome block */}
                    <div className={`${
                      nightMode === 'sepia' ? 'bg-[#ebdcb9]/40 border-[#dacda8]/70 text-[#4a3b2c]' :
                      nightMode === 'pitchBlack' ? 'bg-zinc-900/40 border-zinc-800/50 text-[#dfcc9f]' :
                      isLight ? 'bg-indigo-50/50 border-indigo-100' : 'bg-indigo-950/30 border-indigo-900/50'
                    } border p-4 rounded-2xl flex flex-col gap-2`}>
                      <span className={`text-[11px] sm:text-xs font-black ${
                        nightMode === 'sepia' ? 'text-amber-850' :
                        nightMode === 'pitchBlack' ? 'text-amber-400' :
                        isLight ? 'text-indigo-600' : 'text-indigo-300'
                      } uppercase tracking-wider`}>Bons estudos!</span>
                      <p className={`text-[13px] sm:text-sm ${
                        nightMode === 'sepia' ? 'text-[#4a3b2c]' :
                        nightMode === 'pitchBlack' ? 'text-[#b29e74]' :
                        isLight ? 'text-zinc-700' : 'text-indigo-100'
                      } leading-relaxed`}>
                        Olá! Sou o seu assistente teológico no Liloupro. Você pode tirar dúvidas sobre hermenêutica, teologia sistemática, contextos históricos ou encontrar versículos sobre temas específicos.
                      </p>
                      <p className={`text-[13px] sm:text-sm ${
                        nightMode === 'sepia' ? 'text-amber-800/90' :
                        nightMode === 'pitchBlack' ? 'text-amber-500' :
                        isLight ? 'text-indigo-600/80' : 'text-indigo-400'
                      } font-medium`}>
                        Ex: "O que significa a palavra 'Logos' em João 1?" ou "Busque versículos sobre consolo para os aflitos".
                      </p>

                      {/* Espaço de Digitação Integrado (Para facilitar no celular) */}
                      <form onSubmit={handleAssistantQuery} className="mt-3 flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Perguntar ao assistente..."
                            value={aiChatQuery}
                            onChange={(e) => setAiChatQuery(e.target.value)}
                            disabled={isAssistantLoading}
                            className={`w-full ${
                              nightMode === 'sepia' ? 'bg-[#fbf4e2] border-[#dacda8] text-[#4a3b2c] placeholder-[#8c7a65] focus:border-[#cbbb98]' :
                              nightMode === 'pitchBlack' ? 'bg-[#050505] border-zinc-850 text-[#dfcc9f] placeholder-zinc-700 focus:border-zinc-750' :
                              isLight ? 'bg-white border-zinc-300 text-zinc-900 focus:border-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-100 focus:border-indigo-500'
                            } focus:outline-none rounded-xl pl-3.5 pr-9 py-2.5 text-xs border shadow-inner`}
                          />
                          <button
                            type="button"
                            onClick={() => startVoiceRecognition('chat', setAiChatQuery)}
                            title={isListening && listeningTarget === 'chat' ? "Ouvindo... Clique para parar" : "Falar pergunta por comando de voz 🎤"}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${
                              isListening && listeningTarget === 'chat'
                                ? 'text-red-500 animate-pulse bg-red-500/10'
                                : 'text-zinc-400 hover:text-indigo-400'
                            }`}
                          >
                            {isListening && listeningTarget === 'chat' ? <MicOff size={15} /> : <Mic size={15} />}
                          </button>
                        </div>
                        <button
                          type="submit"
                          disabled={isAssistantLoading}
                          className="p-2.5 bg-indigo-900 hover:bg-indigo-850 active:bg-indigo-900 text-indigo-100 rounded-xl transition-all disabled:opacity-50 shrink-0 flex items-center justify-center shadow-sm"
                        >
                          <CornerDownRight size={15} />
                        </button>
                      </form>
                    </div>

                    {/* Message list */}
                    {aiChatResponses.map((msg, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        {/* User Query */}
                        <div className={`self-end max-w-[85%] border px-3.5 py-2.5 rounded-2xl rounded-tr-none text-[13px] sm:text-sm leading-relaxed font-bold ${
                          nightMode === 'sepia' ? 'bg-[#cbbb98] border-[#bba475] text-[#2c1c0e]' :
                          nightMode === 'pitchBlack' ? 'bg-zinc-900 border-zinc-800 text-[#dfcc9f]' :
                          'bg-indigo-900 border-indigo-800 text-slate-100'
                        }`}>
                          {msg.query}
                        </div>
                        {/* AI Answer */}
                        <div className={`self-start max-w-[90%] border p-4 rounded-2xl rounded-tl-none text-[13.5px] sm:text-[15px] leading-relaxed flex flex-col gap-2.5 shadow-sm ${
                          nightMode === 'sepia' ? 'bg-[#ebdcb9] border-[#dacda8] text-[#36271c]' :
                          nightMode === 'pitchBlack' ? 'bg-zinc-950 border-zinc-900 text-[#dfcc9f]' :
                          isLight ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-slate-800/80 border-slate-700/50 text-slate-200'
                        }`}>
                          <div className={`prose max-w-none whitespace-pre-line text-[13.5px] sm:text-[15px] leading-relaxed ${
                            nightMode === 'sepia' ? 'text-[#36271c]' :
                            nightMode === 'pitchBlack' ? 'text-[#dfcc9f]' :
                            isLight ? 'prose-zinc text-zinc-850' : 'prose-invert text-slate-100'
                          }`}>
                            {msg.response}
                          </div>
                          
                          {/* Share & Copy Action Row */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5 mt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.response);
                                setCopiedChatIndex(idx);
                                setTimeout(() => setCopiedChatIndex(null), 2000);
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                nightMode === 'sepia' ? 'bg-[#fbf4e2]/80 hover:bg-[#ebdcb9] text-[#4a3b2c] border border-[#dacda8]/70' :
                                nightMode === 'pitchBlack' ? 'bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-[#b29e74] hover:text-white' :
                                isLight 
                                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950' 
                                  : 'bg-slate-900 hover:bg-slate-850 border border-slate-800/60 text-slate-400 hover:text-white'
                              }`}
                              title="Copiar explicação"
                            >
                              {copiedChatIndex === idx ? (
                                <Check size={11} className="text-emerald-500" />
                              ) : (
                                <Copy size={11} />
                              )}
                              <span>{copiedChatIndex === idx ? 'Copiado!' : 'Copiar'}</span>
                            </button>
                            
                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`*Explicação Teológica - LiLouPro*\n\n${msg.response}\n\n_Enviado via LiLouPro - Liturgia, Louvor e Projeção_`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-extrabold transition-all shadow-sm"
                              title="Compartilhar explicação no WhatsApp"
                            >
                              <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.63 2.01 14.167.989 11.55.989c-5.45 0-9.877 4.371-9.881 9.799a9.704 9.704 0 001.442 5.01l-.952 3.478 3.562-.934zM17.91 14.316c-.326-.162-1.927-.938-2.222-1.046-.295-.108-.51-.162-.725.162-.215.324-.83 1.045-1.018 1.262-.188.216-.376.243-.702.082-.326-.162-1.378-.501-2.625-1.599-.971-.856-1.628-1.916-1.819-2.24-.191-.324-.02-.5-.182-.661-.146-.146-.326-.379-.49-.569-.162-.189-.217-.324-.326-.541-.109-.217-.055-.405-.027-.568.027-.162.215-.513.323-.756.108-.243.162-.405.242-.568.081-.162.041-.302-.02-.465-.06-.162-.51-1.216-.7-1.674-.184-.444-.37-.383-.51-.39l-.433-.006c-.149 0-.391.055-.595.275-.204.22-.779.751-.779 1.83 0 1.08.795 2.122.905 2.27.11.149 1.564 2.355 3.79 3.302.529.225 1.011.396 1.358.505.532.167 1.017.143 1.399.087.427-.062 1.319-.533 1.503-1.047.184-.513.184-.954.129-1.047-.055-.094-.203-.162-.529-.325z"/>
                              </svg>
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}

                    {isAssistantLoading && (
                      <div className={`flex items-center gap-2 self-start ${
                        nightMode === 'sepia' ? 'bg-[#ebdcb9] border-[#dacda8]/75 text-[#4a3b2c]' :
                        nightMode === 'pitchBlack' ? 'bg-zinc-900 border-zinc-800 text-[#dfcc9f]' :
                        isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : 'bg-slate-800/50 border-slate-700/40'
                      } px-4 py-3 rounded-2xl border`}>
                        <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.4s]" />
                        <span className={`text-[10px] uppercase font-bold ${
                          nightMode === 'sepia' ? 'text-amber-950' :
                          nightMode === 'pitchBlack' ? 'text-amber-500' :
                          isLight ? 'text-zinc-500' : 'text-slate-400'
                        } tracking-wider ml-1`}>Analisando escrituras...</span>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleAssistantQuery} className={`p-3 border-t ${
                    nightMode === 'sepia' ? 'border-[#ebdcb9] bg-[#ebdcb9]' :
                    nightMode === 'pitchBlack' ? 'border-zinc-900 bg-black' :
                    isLight ? 'border-zinc-200 bg-zinc-100' : 'border-slate-800 bg-slate-950'
                  } flex items-center gap-2`}>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Perguntar ao assistente..."
                        value={aiChatQuery}
                        onChange={(e) => setAiChatQuery(e.target.value)}
                        disabled={isAssistantLoading}
                        className={`w-full ${
                          nightMode === 'sepia' ? 'bg-[#fbf4e2] border-[#dacda8] text-[#4a3b2c] placeholder-[#8c7a65] focus:border-[#cbbb98]' :
                          nightMode === 'pitchBlack' ? 'bg-[#050505] border-zinc-800 text-[#dfcc9f] placeholder-zinc-700 focus:border-zinc-700' :
                          isLight ? 'bg-white border-zinc-300 text-zinc-900 focus:border-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-100 focus:border-indigo-500'
                        } focus:outline-none rounded-xl pl-3 pr-8 py-2 text-xs`}
                      />
                      <button
                        type="button"
                        onClick={() => startVoiceRecognition('chat', setAiChatQuery)}
                        title={isListening && listeningTarget === 'chat' ? "Ouvindo... Clique para parar" : "Falar pergunta por comando de voz 🎤"}
                        className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${
                          isListening && listeningTarget === 'chat'
                            ? 'text-red-500 animate-pulse bg-red-500/10'
                            : 'text-zinc-400 hover:text-indigo-400'
                        }`}
                      >
                        {isListening && listeningTarget === 'chat' ? <MicOff size={14} /> : <Mic size={14} />}
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={isAssistantLoading}
                      className="p-2 bg-indigo-900 hover:bg-indigo-850 active:bg-indigo-900 text-indigo-100 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <CornerDownRight size={16} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Thematic keyword search input */}
                  <form onSubmit={handleThemeSearch} className={`p-3.5 border-b ${
                    nightMode === 'sepia' ? 'border-[#ebdcb9] bg-[#ebdcb9]' :
                    nightMode === 'pitchBlack' ? 'border-zinc-900 bg-black' :
                    isLight ? 'border-zinc-200 bg-zinc-100' : 'border-slate-800 bg-slate-950'
                  } flex items-center gap-2`}>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                        <Search size={14} className="text-brand" />
                      </span>
                      <input
                        type="text"
                        placeholder="Buscar tema (Ex: Perdão, Amor, Fé)..."
                        value={themeSearchQuery}
                        onChange={(e) => setThemeSearchQuery(e.target.value)}
                        disabled={isThemeSearching}
                        className={`w-full ${
                          nightMode === 'sepia' ? 'bg-[#fbf4e2] border-[#dacda8] text-[#4a3b2c] placeholder-[#8c7a65] focus:border-[#cbbb98]' :
                          nightMode === 'pitchBlack' ? 'bg-[#050505] border-zinc-800 text-[#dfcc9f] placeholder-zinc-700 focus:border-zinc-700' :
                          isLight ? 'bg-white border-zinc-300 text-zinc-900 focus:border-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-100 focus:border-indigo-500'
                        } focus:outline-none rounded-xl pl-9 pr-8 py-2 h-10 text-xs`}
                      />
                      <button
                        type="button"
                        onClick={() => startVoiceRecognition('theme', setThemeSearchQuery)}
                        title={isListening && listeningTarget === 'theme' ? "Ouvindo... Clique para parar" : "Falar tema por comando de voz 🎤"}
                        className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${
                          isListening && listeningTarget === 'theme'
                            ? 'text-red-500 animate-pulse bg-red-500/10'
                            : 'text-zinc-400 hover:text-indigo-400'
                        }`}
                      >
                        {isListening && listeningTarget === 'theme' ? <MicOff size={14} /> : <Mic size={14} />}
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={isThemeSearching || !themeSearchQuery.trim()}
                      className="h-10 px-3 bg-indigo-900 hover:bg-indigo-850 active:bg-indigo-900 text-indigo-100 font-extrabold rounded-xl transition-all disabled:opacity-50 text-[11px] uppercase tracking-wider shrink-0 flex items-center justify-center"
                    >
                      Buscar
                    </button>
                  </form>

                  {/* Results log */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                    {/* Error block */}
                    {themeSearchError && (
                      <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/20 text-red-400 text-xs flex gap-2 items-start">
                        <AlertCircle size={15} className="shrink-0 mt-0.5" />
                        <p>{themeSearchError}</p>
                      </div>
                    )}

                    {/* Waiting / Intro welcome block */}
                    {themeSearchResults.length === 0 && !isThemeSearching && (
                      <div className={`${
                        nightMode === 'sepia' ? 'bg-[#ebdcb9]/40 border-[#dacda8] text-[#4a3b2c]' :
                        nightMode === 'pitchBlack' ? 'bg-zinc-900/40 border-zinc-800 text-[#dfcc9f]' :
                        isLight ? 'bg-indigo-50/50 border-indigo-100 text-zinc-700' : 'bg-slate-800/40 border-slate-800 text-slate-300'
                      } border p-4 rounded-2xl flex flex-col gap-2 text-center items-center py-8`}>
                        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand mb-2">
                          <Book size={20} />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-brand">Busca por Palavra-Chave / Tema</h4>
                        <p className="text-[13px] sm:text-sm leading-relaxed max-w-xs">
                          Digite um tema como <strong>"Perdão"</strong>, <strong>"Amor"</strong>, <strong>"Graça"</strong>, ou <strong>"Provação"</strong> para encontrar passagens bíblicas chave selecionadas pela IA para o seu culto ou reflexão.
                        </p>
                      </div>
                    )}

                    {/* Loading spinner */}
                    {isThemeSearching && (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-muted">
                        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand animate-pulse">Buscando as escrituras por IA...</span>
                      </div>
                    )}

                    {/* Passages List */}
                    {themeSearchResults.map((passage, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`border rounded-2xl p-4 flex flex-col gap-3 transition-all relative ${
                          nightMode === 'sepia' ? 'bg-[#ebdcb9] border-[#dacda8] hover:border-amber-600/40 shadow-sm' :
                          nightMode === 'pitchBlack' ? 'bg-zinc-950 border-zinc-900 hover:border-zinc-850/40 shadow-md' :
                          isLight 
                            ? 'bg-white border-zinc-200 hover:border-brand-dark/40 shadow-sm' 
                            : 'bg-slate-950/40 border-slate-800/80 hover:border-brand/40 shadow-md'
                        }`}
                      >
                        {/* Passage card header */}
                        <div className="flex items-center justify-between gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleNavigateToPassage(passage.reference)}
                            className="text-xs font-black text-brand uppercase tracking-tight flex items-center gap-1.5 hover:underline cursor-pointer bg-brand/5 hover:bg-brand/15 px-2.5 py-1 rounded-lg border border-brand/10"
                            title="Navegar e ler este capítulo na Bíblia"
                          >
                            <BookOpen size={12} />
                            <span>{passage.reference}</span>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const textToCopy = `*${passage.reference}*\n${passage.text}\n\n_Liloupro - Gestão de Culto e Adoração_`;
                                navigator.clipboard.writeText(textToCopy);
                                setCopiedIndex(index);
                                setTimeout(() => setCopiedIndex(null), 2000);
                              }}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                nightMode === 'sepia' ? 'bg-[#fbf4e2] hover:bg-[#ebdcb9]/80 border-[#dacda8] text-[#4a3b2c] hover:text-[#36271c]' :
                                nightMode === 'pitchBlack' ? 'bg-zinc-900 hover:bg-zinc-850 border-zinc-850 text-[#dfcc9f] hover:text-white' :
                                isLight 
                                  ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-500 hover:text-zinc-800' 
                                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                              title="Copiar texto"
                            >
                              {copiedIndex === index ? (
                                <Check size={12} className="text-emerald-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Passage body text */}
                        <p className={`text-sm sm:text-[15px] leading-relaxed italic border-l-2 border-brand/35 pl-3 ${
                          nightMode === 'sepia' ? 'text-[#36271c]' :
                          nightMode === 'pitchBlack' ? 'text-[#fbf0d3]' :
                          isLight ? 'text-zinc-750' : 'text-slate-100'
                        }`}>
                          "{passage.text.trim()}"
                        </p>

                        {/* AI Connection commentary explanation */}
                        {passage.explanation && (
                          <div className={`p-3 rounded-xl text-[12.5px] sm:text-[13.5px] leading-relaxed flex gap-2.5 items-start ${
                            nightMode === 'sepia' ? 'bg-amber-100/55 text-amber-950 border border-amber-200/60' :
                            nightMode === 'pitchBlack' ? 'bg-zinc-900 text-zinc-300 border border-zinc-800' :
                            isLight 
                              ? 'bg-indigo-50/55 text-zinc-700 border border-indigo-100/60' 
                              : 'bg-indigo-950/20 text-indigo-200 border border-indigo-900/40'
                          }`}>
                            <Sparkles size={13} className="shrink-0 text-brand mt-0.5" />
                            <p>{passage.explanation}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* VERSE ACTIONS OVERLAY BOX (Pops up at the bottom on verse click) */}
      <AnimatePresence>
        {activeVerseOverlay && (() => {
          const verseKey = `${selectedBook.name}-${selectedChapter}-${activeVerseOverlay.verse}`;
          const isFav = favorites.includes(verseKey);
          const currentHighlight = highlights[verseKey];
          const hasNote = !!notes[verseKey];

          return (
            <motion.div
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 150, opacity: 0 }}
              className={`fixed bottom-[76px] sm:bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-xl w-[calc(100%-2rem)] md:w-full ${isLight ? 'bg-white/98 border-zinc-200' : 'bg-slate-900/98 border-slate-800'} backdrop-blur-lg border rounded-2xl shadow-2xl z-[100] p-4 flex flex-col gap-3`}
            >
              {/* Selected Verse Info & Close */}
              <div className={`flex items-center justify-between gap-3 border-b ${isLight ? 'border-zinc-200' : 'border-slate-800'} pb-2`}>
                <span className="text-xs font-black text-brand uppercase tracking-wider flex items-center gap-1.5">
                  <Book size={14} />
                  {selectedBook.name} {selectedChapter}:{activeVerseOverlay.verse}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCardVerse(activeVerseOverlay);
                      setShowCardCreator(true);
                    }}
                    className={`${isLight ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-slate-800 text-slate-400 hover:text-slate-200'} p-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors`}
                    title="Criar Card Visual"
                  >
                    <Share2 size={12} />
                    <span>Criar Card</span>
                  </button>
                  <button 
                    onClick={() => setActiveVerseOverlay(null)}
                    className={`p-1 ${isLight ? 'hover:bg-zinc-200 text-zinc-500' : 'hover:bg-slate-800 text-slate-400'} rounded-lg`}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                
                {/* Highlight Colors picker */}
                <div className={`flex items-center gap-1.5 ${isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-slate-950 border-slate-800'} p-1.5 rounded-xl border`}>
                  <button 
                    onClick={() => toggleHighlight(verseKey, 'yellow')}
                    className={`w-5 h-5 rounded-full bg-yellow-400 hover:scale-110 active:scale-95 transition-all relative ${currentHighlight === 'yellow' ? 'ring-2 ring-white scale-105' : ''}`}
                    title="Amarelo"
                  />
                  <button 
                    onClick={() => toggleHighlight(verseKey, 'green')}
                    className={`w-5 h-5 rounded-full bg-emerald-500 hover:scale-110 active:scale-95 transition-all relative ${currentHighlight === 'green' ? 'ring-2 ring-white scale-105' : ''}`}
                    title="Verde"
                  />
                  <button 
                    onClick={() => toggleHighlight(verseKey, 'blue')}
                    className={`w-5 h-5 rounded-full bg-sky-500 hover:scale-110 active:scale-95 transition-all relative ${currentHighlight === 'blue' ? 'ring-2 ring-white scale-105' : ''}`}
                    title="Azul"
                  />
                  <button 
                    onClick={() => toggleHighlight(verseKey, 'pink')}
                    className={`w-5 h-5 rounded-full bg-pink-500 hover:scale-110 active:scale-95 transition-all relative ${currentHighlight === 'pink' ? 'ring-2 ring-white scale-105' : ''}`}
                    title="Rosa"
                  />
                  {currentHighlight && (
                    <button 
                      onClick={() => removeHighlight(verseKey)}
                      className={`p-1 ${isLight ? 'hover:bg-zinc-200' : 'hover:bg-slate-800'} rounded-lg text-red-400`}
                      title="Remover Marca texto"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(verseKey)}
                    className={`p-2 rounded-xl border transition-all ${
                      isFav 
                        ? (isLight ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-rose-950/60 border-rose-900 text-rose-400')
                        : (isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-700' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200')
                    }`}
                    title="Favoritar Versículo"
                  >
                    <Heart size={14} fill={isFav ? "currentColor" : "none"} />
                  </button>

                   {/* Copy Button */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`"${activeVerseOverlay.text}" - ${selectedBook.name} ${selectedChapter}:${activeVerseOverlay.verse} (${bibleVersion})`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`p-2 ${isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'} border rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold min-w-[75px] justify-center`}
                    title="Copiar Versículo"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-500" />
                        <span className="text-emerald-500">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  {/* Write Note Button */}
                  <button
                    onClick={() => setIsWritingNote(!isWritingNote)}
                    className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                      hasNote || isWritingNote
                        ? (isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-950/50 border-amber-900 text-amber-400')
                        : (isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700')
                    }`}
                  >
                    <Edit size={14} />
                    <span>Anotar</span>
                  </button>

                  {/* Gemini Explainer Shortcut */}
                  <button
                    onClick={() => handleExplainVerse(activeVerseOverlay.verse, activeVerseOverlay.text)}
                    className="p-2 bg-indigo-950/80 border border-indigo-900 text-indigo-200 hover:bg-indigo-900/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-102"
                  >
                    <Sparkles size={14} className="text-indigo-400" />
                    <span>Estudo IA</span>
                  </button>
                </div>

              </div>

              {/* Note Writing Sub-Section */}
              {isWritingNote && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className={`flex flex-col gap-2 mt-2 pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-slate-800'}`}
                >
                  <label className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Anotações Pessoais</label>
                  <textarea
                    placeholder="Escreva seus pensamentos, reflexões ou insights sobre este versículo..."
                    value={tempNoteText}
                    onChange={(e) => setTempNoteText(e.target.value)}
                    className={`w-full h-20 p-2.5 ${isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-amber-400' : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500'} border rounded-xl text-xs focus:outline-none custom-scrollbar`}
                  />
                  <div className="flex items-center justify-end gap-2">
                    {hasNote && (
                      <button 
                        onClick={() => deleteNote(verseKey)}
                        className="px-3 py-1.5 bg-red-950/50 border border-red-900/40 text-red-400 text-[10px] font-bold rounded-lg hover:bg-red-900/30 transition-colors"
                      >
                        Excluir
                      </button>
                    )}
                    <button 
                      onClick={() => saveNote(verseKey, tempNoteText)}
                      className="px-3 py-1.5 bg-amber-950 border border-amber-900 text-amber-300 text-[10px] font-bold rounded-lg hover:bg-amber-900/40 transition-colors"
                    >
                      Salvar Anotação
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* DETAILED GEMINI AI EXPLAINER DRAWER (Pulls from the right/bottom) */}
      <AnimatePresence>
        {showAiDrawer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end">
            <motion.div
              initial={{ x: 500, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 500, opacity: 0 }}
              className={`w-full max-w-xl h-full ${isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-800' : 'bg-slate-900 border-slate-800 text-slate-100'} border-l flex flex-col shadow-2xl relative`}
            >
              {/* Header */}
              <div className={`p-4 border-b ${isLight ? 'border-zinc-200 bg-zinc-100' : 'border-slate-800 bg-slate-950'} flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 ${isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-indigo-950 text-indigo-400 border-indigo-900'} rounded-xl border`}>
                    <Sparkles size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className={`font-extrabold text-sm ${isLight ? 'text-zinc-800' : 'text-slate-100'}`}>Comentário Bíblico Gemini</h3>
                    <p className={`text-[10px] ${isLight ? 'text-indigo-600' : 'text-indigo-400'} font-bold uppercase tracking-wider`}>Estudo Avançado de Passagem</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAiDrawer(false)}
                  className={`p-1.5 ${isLight ? 'hover:bg-zinc-200 text-zinc-500' : 'hover:bg-slate-800 text-slate-400'} rounded-xl`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Commentary Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                
                {/* Passage Quote card */}
                {activeVerseOverlay && (
                  <div className={`p-4 ${isLight ? 'bg-white border-zinc-200 text-zinc-800 shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-200'} border rounded-2xl relative overflow-hidden`}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    <span className={`text-[10px] font-black uppercase ${isLight ? 'text-indigo-600' : 'text-indigo-400'} tracking-wider`}>Passagem Selecionada</span>
                    <blockquote className={`text-sm font-bold ${isLight ? 'text-zinc-800' : 'text-slate-200'} italic mt-1 leading-relaxed`}>
                      "{activeVerseOverlay.text}"
                    </blockquote>
                    <cite className={`block text-right text-xs ${isLight ? 'text-zinc-500' : 'text-slate-400'} font-mono font-bold mt-2 uppercase tracking-wide`}>
                      — {selectedBook.name} {selectedChapter}:{activeVerseOverlay.verse} ({bibleVersion})
                    </cite>
                  </div>
                )}

                {/* Loading state */}
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className={`w-10 h-10 border-4 border-t-indigo-500 ${isLight ? 'border-zinc-200' : 'border-slate-800'} rounded-full animate-spin`} />
                    <p className={`text-xs font-black uppercase tracking-widest ${isLight ? 'text-indigo-600' : 'text-indigo-400'} animate-pulse`}>Sondando profundezas teológicas...</p>
                  </div>
                ) : (
                  <div className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-zinc-700 prose prose-zinc' : 'text-slate-200 prose prose-invert'} max-w-none whitespace-pre-line p-1`}>
                    {aiAnalysis}
                  </div>
                )}

              </div>

              {/* Close footer button */}
              <div className={`p-4 border-t ${isLight ? 'border-zinc-200 bg-zinc-100' : 'border-slate-800 bg-slate-950'} flex items-center justify-end shrink-0`}>
                {aiAnalysis && !isAiLoading && (
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`*Estudo Bíblico - Liloupro*\n\n📖 *Passagem:* ${selectedBook.name} ${selectedChapter}:${activeVerseOverlay?.verse || ''}\n\n"${activeVerseOverlay?.text || ''}"\n\n💡 *Explicação do Gemini:* \n${aiAnalysis}\n\n_Enviado via Liloupro_`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md mr-2 cursor-pointer"
                    title="Compartilhar estudo no WhatsApp"
                  >
                    <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.63 2.01 14.167.989 11.55.989c-5.45 0-9.877 4.371-9.881 9.799a9.704 9.704 0 001.442 5.01l-.952 3.478 3.562-.934zM17.91 14.316c-.326-.162-1.927-.938-2.222-1.046-.295-.108-.51-.162-.725.162-.215.324-.83 1.045-1.018 1.262-.188.216-.376.243-.702.082-.326-.162-1.378-.501-2.625-1.599-.971-.856-1.628-1.916-1.819-2.24-.191-.324-.02-.5-.182-.661-.146-.146-.326-.379-.49-.569-.162-.189-.217-.324-.326-.541-.109-.217-.055-.405-.027-.568.027-.162.215-.513.323-.756.108-.243.162-.405.242-.568.081-.162.041-.302-.02-.465-.06-.162-.51-1.216-.7-1.674-.184-.444-.37-.383-.51-.39l-.433-.006c-.149 0-.391.055-.595.275-.204.22-.779.751-.779 1.83 0 1.08.795 2.122.905 2.27.11.149 1.564 2.355 3.79 3.302.529.225 1.011.396 1.358.505.532.167 1.017.143 1.399.087.427-.062 1.319-.533 1.503-1.047.184-.513.184-.954.129-1.047-.055-.094-.203-.162-.529-.325z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                )}
                <button
                  onClick={() => setShowAiDrawer(false)}
                  className={`px-4 py-2 ${isLight ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700 border border-zinc-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-100'} rounded-xl text-xs font-bold transition-colors cursor-pointer`}
                >
                  Fechar Comentário
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GRAPHIC VERSE CARD CREATOR MODAL */}
      <AnimatePresence>
        {showCardCreator && cardVerse && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">Gerador de Card Bíblico</span>
                <button 
                  onClick={() => setShowCardCreator(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Visual Preview area */}
              <div className="p-6 flex justify-center bg-slate-950 border-b border-slate-800">
                <div 
                  ref={cardRef}
                  id="bible-verse-card-canvas"
                  className={`w-[320px] aspect-square rounded-2xl p-6 flex flex-col justify-between text-white shadow-2xl relative overflow-hidden select-none bg-gradient-to-br ${
                    cardTheme === 'cosmic' ? 'from-slate-950 via-indigo-950 to-slate-900' :
                    cardTheme === 'sunset' ? 'from-orange-600 via-pink-600 to-purple-800' :
                    cardTheme === 'forest' ? 'from-teal-900 via-emerald-950 to-slate-950' :
                    cardTheme === 'elegant-dark' ? 'from-neutral-900 to-neutral-950' :
                    'from-slate-100 to-slate-200 text-slate-900'
                  }`}
                >
                  {/* Subtle layout decorative graphics */}
                  <div className="absolute top-4 left-4 opacity-15">
                    <BookOpen size={48} className={cardTheme === 'minimal-light' ? 'text-slate-900' : 'text-white'} />
                  </div>

                  {/* Logo header */}
                  <span className={`text-[9px] font-black uppercase tracking-widest ${cardTheme === 'minimal-light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Liloupro • Bíblia
                  </span>

                  {/* Verse Text Quote */}
                  <div className="my-auto">
                    <p className={`text-sm sm:text-base font-extrabold tracking-wide leading-relaxed italic ${cardTheme === 'minimal-light' ? 'text-slate-900' : 'text-slate-50'}`}>
                      "{cardVerse.text}"
                    </p>
                  </div>

                  {/* Reference Footer */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <span className={`text-xs font-black uppercase tracking-widest ${cardTheme === 'minimal-light' ? 'text-slate-900' : 'text-brand'}`}>
                      {selectedBook.name} {selectedChapter}:{cardVerse.verse}
                    </span>
                    <span className={`text-[9px] font-bold ${cardTheme === 'minimal-light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      ({bibleVersion})
                    </span>
                  </div>
                </div>
              </div>

              {/* Selection controls / Theme Picker */}
              <div className="p-4 space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Selecione o Tema Visual</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCardTheme('cosmic')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${cardTheme === 'cosmic' ? 'bg-indigo-900/40 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                    >
                      Cósmico
                    </button>
                    <button
                      onClick={() => setCardTheme('sunset')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${cardTheme === 'sunset' ? 'bg-pink-900/40 border-pink-500 text-pink-200' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                    >
                      Pôr do Sol
                    </button>
                    <button
                      onClick={() => setCardTheme('forest')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${cardTheme === 'forest' ? 'bg-emerald-900/40 border-emerald-500 text-emerald-200' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                    >
                      Floresta
                    </button>
                    <button
                      onClick={() => setCardTheme('elegant-dark')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${cardTheme === 'elegant-dark' ? 'bg-neutral-800 border-neutral-600 text-neutral-200' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                    >
                      Nero
                    </button>
                    <button
                      onClick={() => setCardTheme('minimal-light')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${cardTheme === 'minimal-light' ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                    >
                      Sândalo
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setShowCardCreator(false)}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={shareOnWhatsApp}
                    disabled={isSharingCard || isGeneratingCard}
                    className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba56] text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md shadow-[#25D366]/10 disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.004 0C5.373 0 0 5.373 0 12.004c0 2.115.549 4.18 1.595 6.002L0 24l6.135-1.571a11.947 11.947 0 005.869 1.575c6.63 0 12.004-5.373 12.004-12.004C24.008 5.373 18.634 0 12.004 0zm6.814 17.069c-.28.788-1.393 1.451-1.921 1.503-.473.048-.946.068-1.596-.135-.853-.266-1.897-.665-3.23-1.24a13.376 13.376 0 01-4.484-3.13 10.985 10.985 0 01-2.203-3.649c-.432-.907-.655-1.815-.655-2.678 0-1.423.743-2.128 1.011-2.408.234-.244.517-.311.69-.311.17 0 .341.002.49.011.162.01.378-.063.593.447.234.557.788 1.924.853 2.057.067.135.111.292.02.473-.09.18-.135.292-.27.447-.135.156-.282.35-.403.473-.135.135-.28.28-.121.551a8.47 8.47 0 001.554 1.924 9.176 9.176 0 002.261 1.393c.28.135.443.111.604-.067.162-.18.69-.788.873-1.057.18-.27.364-.225.604-.135.244.09 1.53.722 1.791.853.26.135.433.203.497.311.063.111.063.655-.217 1.442z" />
                    </svg>
                    <span>{isSharingCard ? 'Compartilhando...' : 'WhatsApp'}</span>
                  </button>
                  <button
                    onClick={downloadVerseCard}
                    disabled={isGeneratingCard || isSharingCard}
                    className="px-4 py-2 bg-brand text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-md shadow-brand/10 disabled:opacity-50"
                  >
                    <Download size={14} />
                    <span>{isGeneratingCard ? 'Baixando...' : 'Baixar Card JPEG'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
