import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { toPng } from 'html-to-image';
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Music, Calendar, Users, Home, Search, Plus, Minus, Download, Image as ImageIcon, Upload,
  Trash2, Edit, Save, ArrowLeft, Volume2, Volume1, FileText, ExternalLink, Bell,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown, LogOut, Check, X, Sparkles, CloudOff, Wifi, WifiOff, Database,
  Clock, Activity, Maximize2, Minimize2, ThumbsUp, Menu, MoreHorizontal,
  Play, Pause, BookOpen, Book, Quote, GripVertical, Timer, ChevronsDown, RefreshCcw,
  Settings, FileDown, Youtube, MessageSquare, Share2, Zap, BarChart2, Copy,
  Send, Star, Lock, Unlock, CornerDownRight, Bold, Italic, Underline, Tv,
  AlertTriangle, Smartphone, Columns, Mic, MicOff, Loader2, GraduationCap, Camera, Gift, Baby, HelpCircle,
  Flame, TrendingUp, TrendingDown, Sliders, Layers, Bluetooth, Radio, Mail
} from 'lucide-react';
import { Music2 } from './MusicIcon';
import { BossPedalIcon } from './BossPedalIcon';
import { ChromaticTunerModal } from './ChromaticTunerModal';
import { StudyMetronomeModal } from './StudyMetronomeModal';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { 
  loginWithGoogle, logout, db, handleFirestoreError, OperationType,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  updateProfile, auth 
} from '../lib/firebase';
import { 
  collection, query, onSnapshot, addDoc, deleteDoc, getDocs,
  doc, updateDoc, setDoc, getDoc, orderBy, Timestamp, where, serverTimestamp, deleteField 
} from 'firebase/firestore';
import { 
  transposeLyricsAndChords, transposeChord, isChordLine, detectKey, isChordWord, 
  isAnnotationOrHeaderWord, parseChordLineIntoTokens, getCleanChordName, cleanTablatures, 
  cleanCifraHtml, HarmonicDisplayMode, convertLyricsAndChordsToHarmonicMode, 
  convertSingleChordToHarmonicMode, convertHarmonicToChordName, ChordToken, 
  areChordsInCapoShape, getCapoSemitonesFromText, cleanLyricsForDisplay, 
  extractLyricsFromChords, getEffectiveLyrics, stripDynamicsFromText 
} from '../services/chordService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportJsonToExcel } from '../utils/excelExport';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BibleSearch } from './BibleSearch';
import { ProjectorDisplay } from './ProjectorDisplay';
import { ProjectionView } from './ProjectionView';
import { ChatView } from './ChatView';
import { ChordDictionaryModal, ChordDictionaryCard, QuickChordPopover } from './ChordDictionary';
import CommercialLandingPage from './CommercialLandingPage';
import TheoryStudyView from './TheoryStudyView';
import { LeaderOnboardingWizard } from './LeaderOnboardingWizard';
import { CachedAvatar } from './CachedAvatar';
import BibleReaderView from './BibleReaderView';
import { QuickBibleSearch } from './QuickBibleSearch';
import { OfflineView } from './OfflineView';
import { SplashIntro } from './SplashIntro';
import { BibleVersionProvider } from '../contexts/BibleVersionContext';
import HelpCenter from './HelpCenter';
import ContextualHelp from './ContextualHelp';
import { FootswitchModal, FootswitchConfig, MVAVE_CHOCOLATE_DEFAULT_MAPPINGS } from './FootswitchModal';
import { getServicePlaylistSongs, getServiceSongs, getServiceSongIds, updateServicePlaylistUrl } from '../utils/servicePlaylistUtils';


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Map of popular Christian/Worship artists to optimized, high-vibe Unsplash images
export function getArtistImage(artist?: string) {
  if (!artist) return null;
  const normalized = artist.toLowerCase().trim();
  
  // High-quality static, optimized, fast Unsplash images matching the specific worship vibe
  if (normalized.includes('fernandinho')) {
    return 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=80'; // massive concert stage with lights
  }
  if (normalized.includes('gabriela rocha')) {
    return 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150&auto=format&fit=crop&q=80'; // dynamic vocalist female on stage
  }
  if (normalized.includes('isadora pompeo') || normalized.includes('isadora pomp√™o')) {
    return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&auto=format&fit=crop&q=80'; // worship acoustic guitar performer
  }
  if (normalized.includes('morada') || normalized.includes('casa worship') || normalized.includes('som do reino') || normalized.includes('central 3')) {
    return 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80'; // full corporate worship team with atmospheric fog & lights
  }
  if (normalized.includes('kemuel') || normalized.includes('vocal')) {
    return 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=150&auto=format&fit=crop&q=80'; // group vocal harmony
  }
  if (normalized.includes('aline barros') || normalized.includes('bruna karla') || normalized.includes('cassiane')) {
    return 'https://images.unsplash.com/photo-1484755560693-a4074577af3a?w=150&auto=format&fit=crop&q=80'; // passionate female singer under stage spotlight
  }
  if (normalized.includes('hillsong') || normalized.includes('bethel') || normalized.includes('elevation')) {
    return 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=150&auto=format&fit=crop&q=80'; // modern high-production arena worship
  }
  if (normalized.includes('alessandro') || normalized.includes('fhop') || normalized.includes('onething')) {
    return 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=150&auto=format&fit=crop&q=80'; // prayer room acoustic guitar/intimate atmosphere
  }
  if (normalized.includes('gabriel guedes') || normalized.includes('teclado') || normalized.includes('piano')) {
    return 'https://images.unsplash.com/photo-1552422535-c45813c61732?w=150&auto=format&fit=crop&q=80'; // grand piano key view
  }
  if (normalized.includes('preto no branco') || normalized.includes('cl√≥vis') || normalized.includes('clovis')) {
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80'; // gold condenser microphone in professional recording studio
  }
  if (normalized.includes('rufino') || normalized.includes('gerson')) {
    return 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=150&auto=format&fit=crop&q=80'; // warm classical acoustic guitar and singer aesthetic
  }
  if (normalized.includes('davi sacer') || normalized.includes('toque no altar') || normalized.includes('trazendo a arca')) {
    return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80'; // dynamic live concert mixer and warm backlights
  }
  if (normalized.includes('isaias saad') || normalized.includes('isa√≠as saad')) {
    return 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150&auto=format&fit=crop&q=80'; // live male vocalist with light flares
  }
  if (normalized.includes('diante do trono') || normalized.includes('ana paula valad√£o') || normalized.includes('valad√£o') || normalized.includes('n√≠vea soares') || normalized.includes('nivea soares')) {
    return 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&auto=format&fit=crop&q=80'; // aesthetic stage lights
  }
  if (normalized.includes('marcos brunet') || normalized.includes('j√∫lia vit√≥ria') || normalized.includes('julia vitoria')) {
    return 'https://images.unsplash.com/photo-1446057032654-9d8885b76c2a?w=150&auto=format&fit=crop&q=80'; // aesthetic acoustic vocalist
  }
  if (normalized.includes('zoe') || normalized.includes('luma elp√≠dio') || normalized.includes('luma elpidio')) {
    return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=150&auto=format&fit=crop&q=80'; // warm golden-hour sunset worship
  }
  if (normalized.includes('harpa') || normalized.includes('harpa crist√£')) {
    return 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=150&auto=format&fit=crop&q=80'; // warm classical acoustic vibe
  }
  if (normalized.includes('thalles roberto') || normalized.includes('talles roberto')) {
    return 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=150&auto=format&fit=crop&q=80'; // highly energetic stage presence
  }
  return null;
}

export function getArtistInitials(artist?: string) {
  if (!artist || artist.toLowerCase() === 'desconhecido') return 'üé∂';
  const parts = artist.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getArtistGradient(artist?: string) {
  if (!artist) return 'from-indigo-500 to-purple-600';
  const name = artist.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradients = [
    'from-blue-600 to-indigo-600',
    'from-emerald-600 to-teal-600',
    'from-violet-600 to-purple-600',
    'from-rose-600 to-pink-600',
    'from-amber-600 to-orange-600',
    'from-cyan-600 to-blue-600',
    'from-fuchsia-600 to-pink-600',
    'from-indigo-600 to-pink-600',
    'from-teal-600 to-cyan-600'
  ];
  const idx = Math.abs(hash) % gradients.length;
  return gradients[idx];
}

interface ArtistAvatarProps {
  artist?: string;
  size?: 'sm' | 'md' | 'lg';
  customImageUrl?: string;
}

const artistImageCache = new Map<string, string | null>();

export const cleanChordText = (text: string): string => {
  if (!text) return '';
  return text
    // Replace space followed by dot and optional space with spaces
    .replace(/\s\.\s?/g, '  ')
    // Replace capital chord note (A-G) followed by dot and space with chord + two spaces
    .replace(/([A-G][#b\/\(\)]*(?:m|maj|min|dim|aug|sus|add|[0-9])?)\.\s/g, '$1  ')
    // Replace capital chord note (A-G) followed by dot with chord + space
    .replace(/([A-G][#b\/\(\)]*(?:m|maj|min|dim|aug|sus|add|[0-9])?)\./g, '$1 ');
};

export function ArtistAvatar({ artist, size = 'md', customImageUrl }: ArtistAvatarProps) {
  const staticUrl = customImageUrl || getArtistImage(artist);
  const cacheKey = artist ? artist.trim().toLowerCase() : '';
  
  // Synchronous cache lookup on initial render to prevent flickering/empty frames
  const [dynamicUrl, setDynamicUrl] = useState<string | null>(() => {
    if (staticUrl) return staticUrl;
    if (cacheKey && artistImageCache.has(cacheKey)) {
      return artistImageCache.get(cacheKey) || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const initials = getArtistInitials(artist);
  const gradient = getArtistGradient(artist);

  useEffect(() => {
    // If we have a custom URL or static map URL, we don't need dynamic fetching
    if (staticUrl) {
      setDynamicUrl(staticUrl);
      return;
    }

    if (!artist || artist.trim().toLowerCase() === "desconhecido") {
      setDynamicUrl(null);
      return;
    }

    const cacheKey = artist.trim().toLowerCase();
    
    // Check global cache
    if (artistImageCache.has(cacheKey)) {
      setDynamicUrl(artistImageCache.get(cacheKey) || null);
      return;
    }

    // Otherwise, fetch from our server API
    let isMounted = true;
    setLoading(true);
    
    fetch(`/api/songs/artist-image-search?artist=${encodeURIComponent(artist)}`)
      .then(res => res.json())
      .then((data: any) => {
        if (isMounted) {
          const url = data.imageUrl || null;
          artistImageCache.set(cacheKey, url);
          setDynamicUrl(url);
        }
      })
      .catch(err => {
        console.warn("Imagem din√¢mica n√£o dispon√≠vel:", err);
        if (isMounted) {
          artistImageCache.set(cacheKey, null);
          setDynamicUrl(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [artist, staticUrl]);

  const imageUrl = staticUrl || dynamicUrl;

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px] rounded-lg',
    md: 'w-10 h-10 sm:w-12 sm:h-12 text-xs sm:text-base rounded-lg sm:rounded-xl',
    lg: 'w-11 h-11 sm:w-16 sm:h-16 text-sm sm:text-lg rounded-xl sm:rounded-2xl'
  };

  return (
    <div className={cn(
      "relative shrink-0 flex items-center justify-center overflow-hidden border border-white/10 shadow-md transition-all duration-300",
      imageUrl ? "bg-slate-800" : cn("bg-gradient-to-br", gradient),
      sizeClasses[size]
    )}>
      {/* Background/placeholder initials visible instantly */}
      <span className="font-black tracking-tighter text-white uppercase font-sans">
        {loading && !imageUrl ? "..." : initials}
      </span>

      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={artist || 'Artista'} 
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "absolute inset-0 w-full h-full object-cover select-none transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )} 
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      )}
    </div>
  );
}

function formatBirthDate(birthDateStr?: string) {
  if (!birthDateStr) return '';
  const parts = birthDateStr.split('-');
  if (parts.length < 3) return birthDateStr;
  const [_, month, day] = parts;
  const months = [
    'Janeiro', 'Fevereiro', 'Mar√ßo', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const mIndex = parseInt(month, 10) - 1;
  const monthName = months[mIndex] || month;
  return `${parseInt(day, 10)} de ${monthName}`;
}

interface EasyBirthDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  variant?: 'dark' | 'adaptive';
}

function EasyBirthDatePicker({ value, onChange, variant = 'adaptive' }: EasyBirthDatePickerProps) {
  let initialYear = '';
  let initialMonth = '';
  let initialDay = '';

  if (value && value.includes('-')) {
    const parts = value.split('-');
    if (parts.length === 3) {
      initialYear = parts[0];
      initialMonth = parts[1];
      initialDay = parts[2];
    }
  }

  const handleSelectChange = (type: 'day' | 'month' | 'year', val: string) => {
    let y = initialYear;
    let m = initialMonth;
    let d = initialDay;

    if (type === 'year') {
      y = val;
    } else if (type === 'month') {
      m = val;
    } else if (type === 'day') {
      d = val;
    }

    if (!y && !m && !d) {
      onChange('');
      return;
    }

    const yearStr = y || '1990';
    const monthStr = m ? m.padStart(2, '0') : '01';
    const dayStr = d ? d.padStart(2, '0') : '01';

    onChange(`${yearStr}-${monthStr}-${dayStr}`);
  };

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Mar√ßo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => String(currentYear - i));

  const selectClass = variant === 'dark'
    ? 'bg-white/5 border border-white/10 text-white h-12 rounded-lg px-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer [&>option]:bg-slate-950 [&>option]:text-white flex-1'
    : 'bg-background border border-input text-text-main h-10 rounded-lg px-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer flex-1';

  return (
    <div className="flex gap-2 items-center w-full">
      <select
        value={initialDay ? String(parseInt(initialDay, 10)) : ''}
        onChange={(e) => handleSelectChange('day', e.target.value)}
        className={selectClass}
      >
        <option value="">Dia</option>
        {days.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select
        value={initialMonth}
        onChange={(e) => handleSelectChange('month', e.target.value)}
        className={selectClass}
      >
        <option value="">M√™s</option>
        {months.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      <select
        value={initialYear}
        onChange={(e) => handleSelectChange('year', e.target.value)}
        className={selectClass}
      >
        <option value="">Ano</option>
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}

interface StyledChar {
  char: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

function getStyledChars(line: string): StyledChar[] {
  const result: StyledChar[] = [];
  let isBold = false;
  let isItalic = false;
  let isUnderline = false;
  let i = 0;
  
  while (i < line.length) {
    if (line.substring(i, i + 3) === '<b>') {
      isBold = true;
      i += 3;
      continue;
    }
    if (line.substring(i, i + 4) === '</b>') {
      isBold = false;
      i += 4;
      continue;
    }
    if (line.substring(i, i + 3) === '<i>') {
      isItalic = true;
      i += 3;
      continue;
    }
    if (line.substring(i, i + 4) === '</i>') {
      isItalic = false;
      i += 4;
      continue;
    }
    if (line.substring(i, i + 3) === '<u>') {
      isUnderline = true;
      i += 3;
      continue;
    }
    if (line.substring(i, i + 4) === '</u>') {
      isUnderline = false;
      i += 4;
      continue;
    }
    
    result.push({
      char: line[i],
      bold: isBold,
      italic: isItalic,
      underline: isUnderline
    });
    i++;
  }
  return result;
}

interface StyledRun {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

function getStyledTextRuns(chars: StyledChar[]): StyledRun[] {
  if (chars.length === 0) return [];
  const runs: StyledRun[] = [];
  let currentRun: StyledRun = {
    text: chars[0].char,
    bold: chars[0].bold,
    italic: chars[0].italic,
    underline: chars[0].underline
  };

  const isSpecialChar = (char: string) => char === '[' || char === ']' || char === '{' || char === '}';

  for (let i = 1; i < chars.length; i++) {
    const c = chars[i];
    const currentIsSpecial = isSpecialChar(c.char);
    const runIsSpecial = isSpecialChar(currentRun.text[0]);

    if (
      c.bold === currentRun.bold &&
      c.italic === currentRun.italic &&
      c.underline === currentRun.underline &&
      currentIsSpecial === runIsSpecial &&
      !currentIsSpecial
    ) {
      currentRun.text += c.char;
    } else {
      runs.push(currentRun);
      currentRun = {
        text: c.char,
        bold: c.bold,
        italic: c.italic,
        underline: c.underline
      };
    }
  }
  runs.push(currentRun);
  return runs;
}

const ChordButton = React.memo(function ChordButton({ 
  text, 
  bold, 
  italic, 
  underline, 
  setActiveChordInDict 
}: { 
  text: string; 
  bold?: boolean; 
  italic?: boolean; 
  underline?: boolean; 
  setActiveChordInDict: (val: string) => void;
}) {
  return (
    <button 
      type="button"
      onClick={() => {
        setActiveChordInDict(getCleanChordName(text));
      }}
      style={{ 
        display: 'inline-block',
        whiteSpace: 'pre',
        boxSizing: 'border-box',
        verticalAlign: 'baseline',
        padding: 0,
        margin: 0,
        border: 'none',
        letterSpacing: '0px',
        fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
      }}
      className={cn(
        "chord-btn cursor-pointer text-brand hover:text-white hover:bg-brand/80 dark:hover:bg-brand/30 p-0 m-0 rounded-xs border-b border-dashed border-brand/50 hover:border-brand/80 transition-all font-black select-all active:scale-95 shadow-sm relative duration-100 font-mono",
        bold && "font-black brightness-110",
        italic && "italic",
        underline && "underline decoration-current"
      )}
      title={`Clique para ver desenho de: ${getCleanChordName(text)}`}
    >
      {text}
    </button>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.text === nextProps.text &&
    prevProps.bold === nextProps.bold &&
    prevProps.italic === nextProps.italic &&
    prevProps.underline === nextProps.underline
  );
});

const PairedChordLyricsRow = React.memo(function PairedChordLyricsRow({ 
  chordLine, 
  lyricLine, 
  setActiveChordInDict 
}: { 
  chordLine: string; 
  lyricLine: string; 
  setActiveChordInDict: (val: string) => void;
}) {
  const chordStyles = getStyledChars(chordLine);
  const lyricStyles = getStyledChars(lyricLine);

  const maxLen = Math.max(chordStyles.length, lyricStyles.length);
  if (maxLen === 0) return null;

  const boundariesSet = new Set<number>();
  boundariesSet.add(0);

  // Identify bracketed or parenthesized tag ranges in chordLine e.g. [s√≥ guita], [N1], (2x)
  const tagRanges: { start: number; end: number }[] = [];
  const tagRegex = /(\([^)]+\)|\[[^\]]+\])/g;
  let match;
  while ((match = tagRegex.exec(chordLine)) !== null) {
    tagRanges.push({ start: match.index, end: match.index + match[0].length });
  }

  const isInsideTag = (idx: number) => {
    return tagRanges.some(r => idx > r.start && idx < r.end);
  };

  for (let j = 1; j < maxLen; j++) {
    // Prevent splitting a single chord word OR inside a bracket/paren tag
    const isInsideChord = j < chordStyles.length && j - 1 >= 0 && 
                          chordStyles[j].char !== ' ' && chordStyles[j - 1].char !== ' ';

    if (!isInsideChord && !isInsideTag(j)) {
      if (j < chordStyles.length) {
        const prevSpace = chordStyles[j - 1].char === ' ';
        const currChar = chordStyles[j].char !== ' ';
        if (prevSpace && currChar) {
          boundariesSet.add(j);
        }
      }
      if (j < lyricStyles.length) {
        const prevSpace = lyricStyles[j - 1].char === ' ';
        const currChar = lyricStyles[j].char !== ' ';
        if (prevSpace && currChar) {
          boundariesSet.add(j);
        }
      }
    }
  }

  const boundaries = Array.from(boundariesSet).sort((a, b) => a - b);
  
  return (
    <div 
      className="flex flex-wrap items-end gap-y-2 w-full select-none mb-1 sm:mb-1.5 break-inside-avoid font-mono"
      style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0px' }}
    >
      {boundaries.map((start, s) => {
        const end = (s < boundaries.length - 1) ? boundaries[s + 1] : maxLen;
        const widthCh = end - start;

        const segmentChordChars: StyledChar[] = [];
        for (let k = start; k < end; k++) {
          if (k < chordStyles.length) {
            segmentChordChars.push(chordStyles[k]);
          } else {
            segmentChordChars.push({ char: ' ', bold: false, italic: false, underline: false });
          }
        }

        const segmentLyricChars: StyledChar[] = [];
        for (let k = start; k < end; k++) {
          if (k < lyricStyles.length) {
            segmentLyricChars.push(lyricStyles[k]);
          } else {
            segmentLyricChars.push({ char: ' ', bold: false, italic: false, underline: false });
          }
        }

        // Isolate chord word or dynamic tag
        let rawWord = '';
        const rawCharsList: StyledChar[] = [];
        const firstChar = segmentChordChars[0]?.char;

        if (firstChar === '[' || firstChar === '(') {
          const closingChar = firstChar === '[' ? ']' : ')';
          for (const cObj of segmentChordChars) {
            rawWord += cObj.char;
            rawCharsList.push(cObj);
            if (cObj.char === closingChar && rawWord.length > 1) {
              break;
            }
          }
        } else {
          for (const cObj of segmentChordChars) {
            if (cObj.char !== ' ') {
              rawWord += cObj.char;
              rawCharsList.push(cObj);
            } else {
              break;
            }
          }
        }

        const spacesCount = Math.max(0, widthCh - rawWord.length);

        const isBracketedTag = (rawWord.startsWith('[') && rawWord.endsWith(']')) || (rawWord.startsWith('(') && rawWord.endsWith(')'));
        const cleanWord = isBracketedTag ? getCleanChordName(rawWord) : rawWord;
        const isActualChord = isChordWord(cleanWord);

        return (
          <div 
            key={s} 
            style={{ 
              minWidth: `${widthCh}ch`, 
              display: 'inline-block',
              verticalAlign: 'bottom',
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0px',
              boxSizing: 'border-box'
            }}
            className="flex flex-col select-none font-mono"
          >
            {/* Chord Slot */}
            <div 
              className="min-h-[1.4em] select-none text-brand font-black relative whitespace-pre leading-none flex items-center font-mono"
              style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0px' }}
            >
              {rawWord ? (
                <>
                  {isBracketedTag && !isActualChord ? (
                    <RenderTextWithInlineBadges text={rawWord} />
                  ) : (
                    <ChordButton 
                      text={isBracketedTag ? cleanWord : rawWord} 
                      bold={rawCharsList[0]?.bold} 
                      italic={rawCharsList[0]?.italic} 
                      underline={rawCharsList[0]?.underline}
                      setActiveChordInDict={setActiveChordInDict}
                    />
                  )}
                  {spacesCount > 0 ? ' '.repeat(spacesCount) : ''}
                </>
              ) : (
                ' '.repeat(widthCh)
              )}
            </div>

            {/* Lyric Slot */}
            <div 
              className="min-h-[1.4em] text-text-main relative whitespace-pre leading-none font-mono flex items-center"
              style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0px' }}
            >
              {getStyledTextRuns(segmentLyricChars).map((run, rIdx) => {
                const char = run.text[0];
                return (
                  <RenderTextWithInlineBadges 
                    key={rIdx}
                    text={run.text}
                    baseClasses={cn(
                      "font-mono",
                      run.bold && "font-black brightness-110",
                      run.italic && "italic",
                      run.underline && "underline decoration-current",
                      (char === '[' || char === ']') && "text-amber-500 font-extrabold",
                      (char === '{' || char === '}') && "text-cyan-500 font-extrabold"
                    )}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.chordLine === nextProps.chordLine && prevProps.lyricLine === nextProps.lyricLine;
});

interface ParsedSectionAndDynamics {
  isMatch: boolean;
  sections: { type: string; title: string }[];
  dynamics: { type: 'n1' | 'n2' | 'n3' | 'n4' | 'n5' | 'n6' | 'n7' | 'crescendo' | 'decrescendo' | 'acapella' | 'drums' | 'acoustic' | 'pausa' | 'keychange' | 'custom'; label: string }[];
  repeats: string[];
  remainingText: string;
}

function isDynamicTerm(str: string): boolean {
  if (!str || !str.trim()) return false;
  return true; // Any string passed as dynamic tag is valid
}

function getDynamicType(str: string): 'n1' | 'n2' | 'n3' | 'n4' | 'n5' | 'n6' | 'n7' | 'crescendo' | 'decrescendo' | 'acapella' | 'drums' | 'acoustic' | 'pausa' | 'keychange' | 'custom' {
  const l = str.toLowerCase().trim();

  // N7 Cl√≠max
  if (l.includes('n7') || l.includes('cl√≠max') || l.includes('climax') || l.includes('‚ö°') || l.includes('fff') || l.includes('fort√≠ssimo') || l.includes('fortissimo') || l.includes('explosivo')) return 'n7';

  // N5 Meio Forte (Checked before N6 so 'meio forte' isn't captured by N6 'forte')
  if (l.includes('n5') || l.includes('üåï') || l === 'mf' || l.startsWith('mf ') || l.endsWith(' mf') || l.includes('mf -') || l.includes('mf ‚Ä¢') || l.includes('meio-forte') || l.includes('meio forte') || l.includes('mezzo-forte') || l.includes('mezzo forte')) return 'n5';

  // N6 Forte
  if (l.includes('n6') || l.includes('üî•') || l === 'f' || l.startsWith('f ') || l.endsWith(' f') || l.includes('f -') || l.includes('f ‚Ä¢') || (l.includes('forte') && !l.includes('meio') && !l.includes('mezzo'))) return 'n6';

  // N4 Moderado
  if (l.includes('n4') || l.includes('üåñ') || l.includes('moderado')) return 'n4';

  // N3 Suave
  if (l.includes('n3') || l.includes('üåó') || l === 'mp' || l.startsWith('mp ') || l.endsWith(' mp') || l.includes('mp -') || l.includes('mp ‚Ä¢') || l.includes('meio-suave') || l.includes('meio suave') || (l.includes('suave') && !l.includes('bem suave'))) return 'n3';

  // N2 Bem Suave
  if (l.includes('n2') || l.includes('üåò') || l.includes('bem suave') || l.includes('toque leve') || l === 'p' || l.startsWith('p ') || l.endsWith(' p') || l.includes('p -') || l.includes('p ‚Ä¢') || (l.includes('piano') && !l.includes('teclado') && !l.includes('piano/pad'))) return 'n2';

  // N1 Sutil
  if (l.includes('n1') || l.includes('üåë') || l.includes('sutil') || l.includes('quase sil√™ncio') || l.includes('quase silencio') || l.includes('sussurro') || l === 'pp' || l.startsWith('pp ') || l.endsWith(' pp') || l.includes('pp -') || l.includes('pp ‚Ä¢') || l.includes('pian√≠ssimo') || l.includes('pianissimo')) return 'n1';

  // Indicators
  if (l.includes('pausa') || l.includes('pause') || l.includes('stop') || l.includes('parada') || l.includes('corta') || l.includes('üõë') || l.includes('‚è±Ô∏è') || l.includes('‚è∏Ô∏è')) return 'pausa';
  if (l.includes('crescendo') || l.includes('subindo') || l.includes('‚Üó')) return 'crescendo';
  if (l.includes('decrescendo') || l.includes('diminuindo') || l.includes('baixando') || l.includes('‚Üò')) return 'decrescendo';
  if (l.includes('acapella') || l.includes('vozes') || l.includes('üé§')) return 'acapella';
  if (l.includes('bateria') || l.includes('percuss√£o') || l.includes('groove') || l.includes('bumbo') || l.includes('ü•Å')) return 'drums';
  if (l.includes('viol√£o') || l.includes('violao') || l.includes('marcando') || l.includes('üé∏')) return 'acoustic';
  if (l.includes('sobe o tom') || l.includes('sobe tom') || l.includes('subida de tom') || l.includes('mudan√ßa de tom') || l.includes('mudanca de tom') || l.includes('modula√ß√£o') || l.includes('modulacao') || l.includes('üìà')) return 'keychange';

  return 'custom';
}

function formatDynamicLabel(raw: string, type: string): string {
  if (type === 'custom') return raw;
  if (raw.length > 3 && type !== 'pausa') return raw;
  switch (type) {
    case 'n1': return 'N1 üåë Sutil';
    case 'n2': return 'N2 üåò Bem Suave';
    case 'n3': return 'N3 üåó Suave';
    case 'n4': return 'N4 üåñ Moderado';
    case 'n5': return 'N5 üåï Meio Forte';
    case 'n6': return 'N6 üî• Forte';
    case 'n7': return 'N7 ‚ö° Cl√≠max';
    case 'crescendo': return 'Crescendo ‚Üó';
    case 'decrescendo': return 'Decrescendo ‚Üò';
    case 'pausa': return raw.includes('üõë') || raw.includes('Pausa') ? raw : 'Pausa üõë';
    case 'acapella': return 'Acapella üé§';
    case 'drums': return 'S√≥ Bateria ü•Å';
    case 'acoustic': return 'Viol√£o Marcando üé∏';
    case 'keychange': return 'Sobe o Tom üìà';
    default: return raw;
  }
}

export interface DynamicExplanation {
  raw: string;
  type: string;
  levelTag: string;
  emoji: string;
  title: string;
  subHeader: string;
  description: string;
  badgeClasses: string;
  iconType: string;
}

export function triggerDynamicExplanation(textOrType: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('liloupro-show-dynamic-popover', { detail: { text: textOrType } }));
  }
}

export function triggerDynamicsGuideModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('liloupro-show-dynamics-guide-modal'));
  }
}

export function getDynamicExplanationDetails(input: string): DynamicExplanation {
  const clean = input.toLowerCase().trim();

  // N7 Cl√≠max
  if (clean.includes('n7') || clean.includes('cl√≠max') || clean.includes('climax') || clean.includes('‚ö°') || clean.includes('fff') || clean.includes('fort√≠ssimo') || clean.includes('fortissimo') || clean.includes('explosivo')) {
    return {
      raw: input,
      type: 'n7',
      levelTag: 'N7',
      emoji: '‚ö°',
      title: 'N7 ‚ö° Cl√≠max',
      subHeader: 'N√≠vel 7 - Explos√£o Sonora',
      description: 'M√°ximo da m√∫sica! Explos√£o sonora, adora√ß√£o intensa e celebra√ß√£o total com a igreja.',
      badgeClasses: 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 text-white border-rose-300/50 shadow-xs shadow-rose-500/20 ring-1 ring-rose-400/30 font-black uppercase tracking-wider',
      iconType: 'n7'
    };
  }

  // N5 Meio Forte (Checked before N6 so 'meio forte' isn't matched to N6 'forte')
  if (clean.includes('n5') || clean.includes('üåï') || clean === 'mf' || clean.startsWith('mf ') || clean.endsWith(' mf') || clean.includes('meio-forte') || clean.includes('meio forte') || clean.includes('mezzo-forte')) {
    return {
      raw: input,
      type: 'n5',
      levelTag: 'N5',
      emoji: 'üåï',
      title: 'N5 üåï Meio Forte',
      subHeader: 'N√≠vel 5 - Energia Alta',
      description: 'Energia alta, ritmo firme e presen√ßa harmoniosa, ainda com espa√ßo para crescer ao cl√≠max.',
      badgeClasses: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-300/40 shadow-xs shadow-amber-500/20 font-black uppercase tracking-wider',
      iconType: 'n5'
    };
  }

  // N6 Forte
  if (clean.includes('n6') || clean.includes('üî•') || clean === 'f' || clean.startsWith('f ') || clean.endsWith(' f') || clean.includes('f -') || (clean.includes('forte') && !clean.includes('meio') && !clean.includes('mezzo'))) {
    return {
      raw: input,
      type: 'n6',
      levelTag: 'N6',
      emoji: 'üî•',
      title: 'N6 üî• Forte',
      subHeader: 'N√≠vel 6 - Grande Intensidade',
      description: 'Grande intensidade, presen√ßa total de instrumentos e vocais firmes no refr√£o.',
      badgeClasses: 'bg-gradient-to-r from-orange-600 to-red-500 text-white border-orange-400/40 shadow-xs shadow-orange-500/20 font-black uppercase tracking-wider',
      iconType: 'n6'
    };
  }

  // N4 Moderado
  if (clean.includes('n4') || clean.includes('üåñ') || clean.includes('moderado')) {
    return {
      raw: input,
      type: 'n4',
      levelTag: 'N4',
      emoji: 'üåñ',
      title: 'N4 üåñ Moderado',
      subHeader: 'N√≠vel 4 - Din√¢mica M√©dia',
      description: 'Din√¢mica equilibrada e ritmo constante, conduzindo a m√∫sica com fluidez.',
      badgeClasses: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white border-sky-400/40 shadow-xs shadow-sky-500/20 font-black uppercase tracking-wider',
      iconType: 'n4'
    };
  }

  // N3 Suave
  if (clean.includes('n3') || clean.includes('üåó') || clean === 'mp' || clean.startsWith('mp ') || clean.endsWith(' mp') || clean.includes('meio-suave') || clean.includes('meio suave') || (clean.includes('suave') && !clean.includes('bem suave'))) {
    return {
      raw: input,
      type: 'n3',
      levelTag: 'N3',
      emoji: 'üåó',
      title: 'N3 üåó Suave',
      subHeader: 'N√≠vel 3 - Suave',
      description: 'Come√ßa a ganhar corpo. Arranjo contido e bem definido para o verso.',
      badgeClasses: 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-teal-400/40 shadow-xs shadow-teal-500/20 font-black uppercase tracking-wider',
      iconType: 'n3'
    };
  }

  // N2 Bem Suave
  if (clean.includes('n2') || clean.includes('üåò') || clean.includes('bem suave') || clean.includes('toque leve') || clean === 'p' || clean.startsWith('p ') || clean.endsWith(' p')) {
    return {
      raw: input,
      type: 'n2',
      levelTag: 'N2',
      emoji: 'üåò',
      title: 'N2 üåò Bem Suave',
      subHeader: 'N√≠vel 2 - Bem Suave',
      description: 'Toque leve, sem peso.',
      badgeClasses: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/40 shadow-xs shadow-emerald-500/20 font-black uppercase tracking-wider',
      iconType: 'n2'
    };
  }

  // N1 Sutil
  if (clean.includes('n1') || clean.includes('üåë') || clean.includes('sutil') || clean.includes('quase sil√™ncio') || clean.includes('quase silencio') || clean.includes('sussurro') || clean === 'pp' || clean.startsWith('pp ') || clean.endsWith(' pp') || clean.includes('pian√≠ssimo') || clean.includes('pianissimo')) {
    return {
      raw: input,
      type: 'n1',
      levelTag: 'N1',
      emoji: 'üåë',
      title: 'N1 üåë Sutil',
      subHeader: 'N√≠vel 1 - Sutil e Intimista',
      description: 'Piano/Pad, clima de contempla√ß√£o. Intimista e muito suave para ministra√ß√£o.',
      badgeClasses: 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border-indigo-400/40 shadow-xs shadow-indigo-500/20 font-black uppercase tracking-wider',
      iconType: 'n1'
    };
  }

  // Pausa
  if (clean.includes('pausa') || clean.includes('pause') || clean.includes('stop') || clean.includes('parada') || clean.includes('corta') || clean.includes('üõë') || clean.includes('‚è±Ô∏è') || clean.includes('‚è∏Ô∏è')) {
    return {
      raw: input,
      type: 'pausa',
      levelTag: 'Pausa',
      emoji: 'üõë',
      title: 'Pausa',
      subHeader: 'Corte Seco / Sil√™ncio',
      description: 'Interrup√ß√£o moment√¢nea do som, corte seco ou sil√™ncio planejado para dar destaque √† voz ou ministra√ß√£o.',
      badgeClasses: 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-400/50 shadow-xs shadow-rose-500/20 font-black uppercase tracking-wider',
      iconType: 'pausa'
    };
  }

  // Crescendo
  if (clean.includes('crescendo') || clean.includes('subindo') || clean.includes('‚Üó')) {
    return {
      raw: input,
      type: 'crescendo',
      levelTag: 'Transi√ß√£o',
      emoji: '‚Üó',
      title: 'Crescendo ‚Üó',
      subHeader: 'Aumento de Intensidade',
      description: 'Aumentar a intensidade e o volume gradualmente ao longo das estrofes at√© o refr√£o ou ponte.',
      badgeClasses: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-400/40 shadow-xs shadow-violet-500/20 font-black uppercase tracking-wider',
      iconType: 'crescendo'
    };
  }

  // Decrescendo
  if (clean.includes('decrescendo') || clean.includes('diminuindo') || clean.includes('baixando') || clean.includes('‚Üò')) {
    return {
      raw: input,
      type: 'decrescendo',
      levelTag: 'Transi√ß√£o',
      emoji: '‚Üò',
      title: 'Decrescendo ‚Üò',
      subHeader: 'Redu√ß√£o de Intensidade',
      description: 'Diminuir a intensidade e o volume gradualmente, suavizando o som da banda para um momento de ora√ß√£o.',
      badgeClasses: 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white border-amber-400/40 shadow-xs shadow-amber-500/20 font-black uppercase tracking-wider',
      iconType: 'decrescendo'
    };
  }

  // Acapella
  if (clean.includes('acapella') || clean.includes('vozes') || clean.includes('üé§')) {
    return {
      raw: input,
      type: 'acapella',
      levelTag: 'Arranjo',
      emoji: 'üé§',
      title: 'Acapella üé§',
      subHeader: 'Vozes em Destaque',
      description: 'Somente a voz ou vozes da igreja/equipe sem instrumentos, criando grande impacto congregacional.',
      badgeClasses: 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-cyan-400/40 shadow-xs shadow-cyan-500/20 font-black uppercase tracking-wider',
      iconType: 'acapella'
    };
  }

  // Drums / Bateria
  if (clean.includes('bateria') || clean.includes('percuss√£o') || clean.includes('percussao') || clean.includes('groove') || clean.includes('bumbo') || clean.includes('ü•Å')) {
    return {
      raw: input,
      type: 'drums',
      levelTag: 'Arranjo',
      emoji: 'ü•Å',
      title: 'Bateria / Groove ü•Å',
      subHeader: 'Sustenta√ß√£o R√≠tmica',
      description: 'Lideran√ßa e condu√ß√£o da m√∫sica conduzida pela bateria/percuss√£o e bumbo.',
      badgeClasses: 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-400/40 shadow-xs shadow-orange-500/20 font-black uppercase tracking-wider',
      iconType: 'drums'
    };
  }

  // Viol√£o Marcando / Acoustic
  if (clean.includes('viol√£o') || clean.includes('violao') || clean.includes('marcando') || clean.includes('üé∏')) {
    return {
      raw: input,
      type: 'acoustic',
      levelTag: 'Arranjo',
      emoji: 'üé∏',
      title: 'Viol√£o Marcando üé∏',
      subHeader: 'Sustenta√ß√£o Harm√¥nica no Viol√£o',
      description: 'Execu√ß√£o do viol√£o marcando os tempos da m√∫sica ou mantendo a batida de condu√ß√£o para a equipe.',
      badgeClasses: 'bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-500 text-white border-amber-400/40 shadow-xs shadow-amber-500/20 font-black uppercase tracking-wider',
      iconType: 'acoustic'
    };
  }

  // Guitarra / Solo
  if (clean.includes('guita') || clean.includes('guitarra') || clean.includes('guitar')) {
    return {
      raw: input,
      type: 'custom',
      levelTag: 'Instrumento',
      emoji: 'üé∏',
      title: `[${input.toUpperCase()}]`,
      subHeader: 'Guitarra em Destaque',
      description: `Indica√ß√£o de din√¢mica personalizada para a equipe: Execu√ß√£o direcionada para a guitarra (${input}).`,
      badgeClasses: 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-500 text-white border-amber-400/40 shadow-xs shadow-amber-500/20 font-black uppercase tracking-wider',
      iconType: 'custom'
    };
  }

  // Teclado / Piano
  if (clean.includes('teclado') || clean.includes('piano') || clean.includes('pad') || clean.includes('synth') || clean.includes('organ')) {
    return {
      raw: input,
      type: 'custom',
      levelTag: 'Instrumento',
      emoji: 'üéπ',
      title: `[${input.toUpperCase()}]`,
      subHeader: 'Teclado / Piano em Destaque',
      description: `Indica√ß√£o de din√¢mica personalizada para a equipe: Condu√ß√£o com teclado/piano/pad (${input}).`,
      badgeClasses: 'bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-500 text-white border-indigo-400/40 shadow-xs shadow-indigo-500/20 font-black uppercase tracking-wider',
      iconType: 'custom'
    };
  }

  // Baixo / Bass
  if (clean.includes('baixo') || clean.includes('bass')) {
    return {
      raw: input,
      type: 'custom',
      levelTag: 'Instrumento',
      emoji: 'üé∏',
      title: `[${input.toUpperCase()}]`,
      subHeader: 'Baixo em Destaque',
      description: `Indica√ß√£o de din√¢mica personalizada para a equipe: Condu√ß√£o da linha de baixo (${input}).`,
      badgeClasses: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 text-white border-purple-400/40 shadow-xs shadow-purple-500/20 font-black uppercase tracking-wider',
      iconType: 'custom'
    };
  }

  // Sobe o Tom / Modula√ß√£o
  if (clean.includes('sobe o tom') || clean.includes('sobe tom') || clean.includes('subida de tom') || clean.includes('mudan√ßa de tom') || clean.includes('mudanca de tom') || clean.includes('modula√ß√£o') || clean.includes('modulacao') || clean.includes('üìà') || clean.includes('keychange')) {
    return {
      raw: input,
      type: 'keychange',
      levelTag: 'Modula√ß√£o',
      emoji: 'üìà',
      title: 'Sobe o Tom üìà',
      subHeader: 'Subida de Tom / Modula√ß√£o',
      description: 'Eleva√ß√£o da tonalidade da m√∫sica (geralmente meio tom ou um tom acima) para aumentar a energia e intensidade no final.',
      badgeClasses: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 text-white border-fuchsia-400/40 shadow-xs shadow-fuchsia-500/20 font-black uppercase tracking-wider',
      iconType: 'keychange'
    };
  }

  // Custom Fallback for ANY bracket tag (e.g. [s√≥ guita], [entra banda], [suave])
  return {
    raw: input,
    type: 'custom',
    levelTag: 'Din√¢mica',
    emoji: 'üéµ',
    title: `[${input.toUpperCase()}]`,
    subHeader: 'Din√¢mica Customizada da Equipe',
    description: `Marcador de express√£o e din√¢mica personalizado (${input}) adaptado para a realidade do seu grupo de louvor.`,
    badgeClasses: 'bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white border-sky-400/40 shadow-xs shadow-sky-500/20 font-black uppercase tracking-wider',
    iconType: 'custom'
  };
}

function DynamicExplanationModal({
  explanation,
  onClose
}: {
  explanation: DynamicExplanation | null;
  onClose: () => void;
}) {
  if (!explanation) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-[350] flex items-center justify-center p-4 animate-fadeIn"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-surface border border-border/80 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative flex flex-col items-center text-center space-y-4 notranslate"
          translate="no"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-text-muted hover:text-text-main hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer"
            title="Fechar"
          >
            <X size={18} />
          </button>

          {/* Badge Preview */}
          <div className="pt-2">
            <span className={cn(
              "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-sm font-black uppercase tracking-wider border shadow-sm",
              explanation.badgeClasses
            )}>
              <span>{explanation.title}</span>
            </span>
          </div>

          {/* Subheader */}
          <p className="text-xs font-black uppercase tracking-widest text-brand">
            {explanation.subHeader}
          </p>

          {/* Message / Description */}
          <div className="bg-black/5 dark:bg-white/5 border border-border/60 rounded-2xl p-4 w-full text-center">
            <p className="text-sm font-bold text-text-main leading-relaxed">
              "{explanation.description}"
            </p>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-brand text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            Entendi üëç
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function isSectionHeaderContent(str: string): boolean {
  if (!str) return false;
  const clean = str.trim().toLowerCase();
  return /^(intro|introdu√ß√£o|introducao|instr|instrumental|verso|verse|estrofe|coro|refr√£o|refrao|chorus|ponte|bridge|solo|interl√∫dio|interludio|interlude|outro|fim|final|tag|hook|ministra√ß√£o|ministracao|pr√©-refr√£o|pre-refr√£o|pre-refrao|pre-chorus|bis|coda|vocal|primeira parte|segunda parte|terceira parte|quarta parte|1¬™ parte|2¬™ parte|3¬™ parte|4¬™ parte|1a parte|2a parte|3a parte|4a parte|parte)(\s*[\d\w√°√©√≠√≥√∫√Å√â√ç√ì√öa-zA-Z\-\_\&]+)*$/i.test(clean);
}

function parseBracketSubContent(content: string): { isSection: boolean; sectionTitle: string; dynamicContent: string } | null {
  if (!content) return null;
  const parts = content.split(/[\-\/\|:]+/).map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2 && isSectionHeaderContent(parts[0])) {
    return {
      isSection: true,
      sectionTitle: parts[0].toUpperCase(),
      dynamicContent: parts.slice(1).join(' - ')
    };
  }
  return null;
}

function parseLineSectionAndDynamics(line: string): ParsedSectionAndDynamics {
  if (!line || !line.trim()) {
    return { isMatch: false, sections: [], dynamics: [], repeats: [], remainingText: '' };
  }

  const rawTrimmed = line.trim();

  // Handle lines WITHOUT brackets or parentheses
  if (!rawTrimmed.includes('[') && !rawTrimmed.includes('(')) {
    const cleanLine = rawTrimmed.replace(/^[\s:\-]+|[\s:\-]+$/g, '').trim();
    const cleanLower = cleanLine.toLowerCase();

    if (isSectionHeaderContent(cleanLower)) {
      return {
        isMatch: true,
        sections: [{ type: cleanLower, title: cleanLine.toUpperCase() }],
        dynamics: [],
        repeats: [],
        remainingText: ''
      };
    }

    const combined = parseBracketSubContent(cleanLine);
    if (combined) {
      const dynType = getDynamicType(combined.dynamicContent.toLowerCase());
      return {
        isMatch: true,
        sections: [{ type: combined.sectionTitle.toLowerCase(), title: combined.sectionTitle }],
        dynamics: [{ type: dynType, label: formatDynamicLabel(combined.dynamicContent, dynType) }],
        repeats: [],
        remainingText: ''
      };
    }

    const isDynamic = /^(n[1-7]|cl√≠max|climax|suave|bem suave|sutil|moderado|meio forte|forte|pausa|stop|corta|parada|crescendo|decrescendo|acapella|s√≥ bateria|so bateria|viol√£o marcando|violao marcando|sobe o tom|sobe tom|modula√ß√£o|modulacao)/i.test(cleanLower);
    if (isDynamic) {
      const dynType = getDynamicType(cleanLower);
      return {
        isMatch: true,
        sections: [],
        dynamics: [{ type: dynType, label: formatDynamicLabel(cleanLine, dynType) }],
        repeats: [],
        remainingText: ''
      };
    }

    return { isMatch: false, sections: [], dynamics: [], repeats: [], remainingText: rawTrimmed };
  }

  const sections: { type: string; title: string }[] = [];
  const dynamics: { type: 'n1' | 'n2' | 'n3' | 'n4' | 'n5' | 'n6' | 'n7' | 'crescendo' | 'decrescendo' | 'acapella' | 'drums' | 'acoustic' | 'pausa' | 'keychange' | 'custom'; label: string }[] = [];
  const repeats: string[] = [];

  let workStr = rawTrimmed;

  const bracketRegex = /\[([^\]]+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = bracketRegex.exec(rawTrimmed)) !== null) {
    const content = match[1].trim();
    if (!content) continue;
    const contentLower = content.toLowerCase();

    // Check if it's a standard section header
    if (isSectionHeaderContent(contentLower)) {
      sections.push({ type: contentLower, title: content.toUpperCase() });
      workStr = workStr.replace(match[0], '').trim();
    } else {
      const combined = parseBracketSubContent(content);
      if (combined) {
        sections.push({ type: combined.sectionTitle.toLowerCase(), title: combined.sectionTitle });
        const dynType = getDynamicType(combined.dynamicContent.toLowerCase());
        dynamics.push({ type: dynType, label: formatDynamicLabel(combined.dynamicContent, dynType) });
        workStr = workStr.replace(match[0], '').trim();
      } else {
        // Anything else in square brackets [] becomes a DYNAMIC TAG!
        const dynType = getDynamicType(contentLower);
        dynamics.push({ type: dynType, label: formatDynamicLabel(content, dynType) });
        workStr = workStr.replace(match[0], '').trim();
      }
    }
  }

  if (sections.length === 0 && dynamics.length === 0 && repeats.length === 0) {
    const isStandaloneSection = /^[\s\[\(\{\-]*([0-9]+\.?)?\s*(intro|introdu√ß√£o|introducao|instr|instrumental|verso|verse|estrofe|coro|refr√£o|refrao|chorus|ponte|bridge|solo|interl√∫dio|interludio|interlude|outro|fim|final|tag|hook|ministra√ß√£o|ministracao|pr√©-refr√£o|pre-refr√£o|pre-refrao|pre-chorus|bis|coda|vocal|primeira parte|segunda parte|terceira parte|quarta parte|1¬™ parte|2¬™ parte|3¬™ parte|4¬™ parte|1a parte|2a parte|3a parte|4a parte|parte)[\s0-9a-zA-Z√°√©√≠√≥√∫√Å√â√ç√ì√ö√£√µ√É√ï√¢√™√¥√Ç√ä√î√ß√á\:\.\-\]\)\}]*$/i.test(rawTrimmed);
    if (isStandaloneSection) {
      const cleanTitle = rawTrimmed.replace(/^[\[\(\{]+|[\]\)\}]+$/g, '').trim().toUpperCase();
      sections.push({ type: rawTrimmed.toLowerCase(), title: cleanTitle });
      workStr = '';
    }
  }

  const parenRegex = /\(([^)]+)\)/g;
  while ((match = parenRegex.exec(rawTrimmed)) !== null) {
    const content = match[1].trim();
    if (!content) continue;
    const contentLower = content.toLowerCase();

    if (/^([0-9]+x|bis)$/i.test(contentLower)) {
      repeats.push(content.toUpperCase());
      workStr = workStr.replace(match[0], '').trim();
    } else {
      const dynType = getDynamicType(contentLower);
      // Only recognize explicit, non-custom dynamics in parentheses (e.g. (suave), (forte), (pausa), (n1-n7))
      // Never treat chord extensions like (9), (11), (b5) in parentheses as dynamic tags
      const isChordExtensionNumber = /^(b|#)?[0-9]{1,2}(\+|\-)?(\/[b#]?[0-9]{1,2})?$/i.test(content) || /^(add|sus|maj|omit|no)[0-9]{1,2}$/i.test(content);
      if (dynType !== 'custom' && !isChordExtensionNumber) {
        dynamics.push({ type: dynType, label: formatDynamicLabel(content, dynType) });
        workStr = workStr.replace(match[0], '').trim();
      }
    }
  }

  if (workStr.trim() !== '') {
    const leftoverRepeatRegex = /^[\s\:\-\|]*(?:[\(\[]?([0-9]+x|bis)[\)\]]?)[\s\:\-\|]*$/i;
    const repeatMatch = workStr.trim().match(leftoverRepeatRegex);
    if (repeatMatch && (sections.length > 0 || dynamics.length > 0)) {
      repeats.push(repeatMatch[1].toUpperCase());
      workStr = '';
    }
  }

  const remainingText = workStr.trim();
  const isMatch = (sections.length > 0 || dynamics.length > 0 || repeats.length > 0) && remainingText === '';

  return {
    isMatch,
    sections,
    dynamics,
    repeats,
    remainingText
  };
}

function RenderTextWithInlineBadges({ text, baseClasses = '' }: { text: string; baseClasses?: string }) {
  if (!text) return null;

  const tagRegex = /(\([^)]+\)|\[[^\]]+\])/g;
  const parts = text.split(tagRegex);

  return (
    <>
      {parts.map((part, pIdx) => {
        if (!part) return null;

        const isParenthesis = part.startsWith('(') && part.endsWith(')');
        const isBracket = part.startsWith('[') && part.endsWith(']');

        if (isParenthesis || isBracket) {
          const content = part.slice(1, -1).trim();
          if (!content) return null;
          const contentLower = content.toLowerCase();

          // Pausa / Stop / Corte
          if (contentLower.includes('pausa') || contentLower.includes('pause') || contentLower.includes('stop') || contentLower.includes('parada') || contentLower.includes('corta') || contentLower.includes('üõë') || contentLower.includes('‚è±Ô∏è') || contentLower.includes('‚è∏Ô∏è')) {
            return (
              <button
                type="button"
                key={pIdx}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerDynamicExplanation(content);
                }}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-lg text-[10px] font-black uppercase tracking-wider border align-middle shadow-xs notranslate cursor-pointer hover:scale-105 active:scale-95 transition-all hover:brightness-110",
                  getDynamicExplanationDetails('pausa').badgeClasses
                )}
                translate="no"
                title="Clique para ver a explica√ß√£o"
              >
                <Pause size={10} className="fill-white text-white shrink-0" />
                <span>{content.includes('üõë') || content.includes('Pausa') ? content : `Pausa üõë`}</span>
              </button>
            );
          }

          // Repeat count e.g. (2x), (bis)
          if (/^([0-9]+x|bis)$/i.test(contentLower)) {
            return (
              <span key={pIdx} className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-600 to-amber-500 text-white border border-amber-400/40 align-middle shadow-xs">
                üîÅ {content.toUpperCase()}
              </span>
            );
          }

          // Section headers in brackets [...] (e.g., [Intro], [Refr√£o], [Verso 1], [Verso 3])
          const isSectionHeader = isBracket && isSectionHeaderContent(contentLower);

          if (isSectionHeader) {
            return (
              <button
                type="button"
                key={pIdx}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerDynamicsGuideModal();
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs shadow-brand/15 align-middle notranslate cursor-pointer hover:scale-105 active:scale-95 transition-all hover:brightness-110"
                translate="no"
                title="Clique para abrir o Guia de Se√ß√µes e Din√¢micas"
              >
                <Music size={10} className="text-white shrink-0" />
                <span>{content.toUpperCase()}</span>
              </button>
            );
          }

          // Combined section + dynamic (e.g., [Verso 3 - Bem suave])
          const combined = isBracket ? parseBracketSubContent(content) : null;
          if (combined) {
            const details = getDynamicExplanationDetails(combined.dynamicContent);
            return (
              <React.Fragment key={pIdx}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerDynamicsGuideModal();
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs shadow-brand/15 align-middle notranslate cursor-pointer hover:scale-105 active:scale-95 transition-all hover:brightness-110"
                  translate="no"
                  title="Clique para abrir o Guia de Se√ß√µes e Din√¢micas"
                >
                  <Music size={10} className="text-white shrink-0" />
                  <span>{combined.sectionTitle}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerDynamicExplanation(combined.dynamicContent);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-lg text-[10px] font-black uppercase tracking-wider border align-middle shadow-xs notranslate cursor-pointer hover:scale-105 active:scale-95 transition-all hover:brightness-110",
                    details.badgeClasses
                  )}
                  translate="no"
                  title={`Clique para ver a explica√ß√£o da din√¢mica: ${combined.dynamicContent}`}
                >
                  <span>{details.emoji} {combined.dynamicContent}</span>
                </button>
              </React.Fragment>
            );
          }

          // Check if parenthesized string is a musical chord extension like (9), (b9), (#9), (11), (13), (add9), (sus4), (b5), (7M), (7+)
          const isChordExtensionNumber = isParenthesis && (
            /^(b|#)?[0-9]{1,2}(\+|\-)?(\/[b#]?[0-9]{1,2})?$/i.test(content) ||
            /^(add|sus|maj|omit|no)[0-9]{1,2}$/i.test(content) ||
            /^(7M|7\+|maj7|dim|aug|m7)$/i.test(content)
          );

          // For brackets [...], any text is a custom dynamic or instrument arrangement tag
          // For parentheses (...), only explicit registered dynamic types (e.g. (suave), (forte), (crescendo), (n1-n7)) are badges
          const dynType = getDynamicType(contentLower);
          const shouldRenderBadge = isBracket || (isParenthesis && dynType !== 'custom' && !isChordExtensionNumber);

          if (shouldRenderBadge) {
            const details = getDynamicExplanationDetails(content);
            return (
              <button
                type="button"
                key={pIdx}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerDynamicExplanation(content);
                }}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-lg text-[10px] font-black uppercase tracking-wider border align-middle shadow-xs notranslate cursor-pointer hover:scale-105 active:scale-95 transition-all hover:brightness-110",
                  details.badgeClasses
                )}
                translate="no"
                title={`Clique para ver a explica√ß√£o da din√¢mica: ${content}`}
              >
                <span>{details.emoji} {content}</span>
              </button>
            );
          }
        }

        return (
          <span key={pIdx} className={baseClasses}>
            {part}
          </span>
        );
      })}
    </>
  );
}

function RenderSectionOrDynamicsLine({ parsed }: { parsed: ParsedSectionAndDynamics }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-1 mb-1 sm:mt-1.5 sm:mb-1.5 select-none notranslate" translate="no">
      {parsed.sections.map((sec, i) => {
        return (
          <button
            type="button"
            key={`sec-${i}`}
            onClick={(e) => {
              e.stopPropagation();
              triggerDynamicsGuideModal();
            }}
            className="sec-badge flex items-center px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border transition-all shadow-xs bg-gradient-to-r from-brand to-cyan-500 text-white border-brand/20 shadow-brand/15 cursor-pointer hover:scale-105 active:scale-95 hover:brightness-110"
            title="Clique para abrir o Guia de Se√ß√µes e Din√¢micas"
          >
            <span>{sec.title}</span>
          </button>
        );
      })}

      {parsed.dynamics.map((dyn, i) => {
        const details = getDynamicExplanationDetails(dyn.label);
        return (
          <button
            type="button"
            key={`dyn-${i}`}
            onClick={(e) => {
              e.stopPropagation();
              triggerDynamicExplanation(dyn.label);
            }}
            className={cn(
              "dyn-btn flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer hover:scale-105 active:scale-95 hover:brightness-110 shadow-xs",
              details.badgeClasses
            )}
            title="Clique para ver a explica√ß√£o da din√¢mica"
          >
            <span>{dyn.label}</span>
          </button>
        );
      })}

      {parsed.repeats.map((rep, i) => (
        <div key={`rep-${i}`} className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <span>üîÅ {rep}</span>
        </div>
      ))}

      {parsed.remainingText ? (
        <span className="text-xs font-bold italic text-text-muted ml-1">
          {parsed.remainingText}
        </span>
      ) : null}
    </div>
  );
}

const SingleLineRow = React.memo(function SingleLineRow({ 
  line, 
  isChord, 
  setActiveChordInDict 
}: { 
  line: string; 
  isChord: boolean; 
  setActiveChordInDict: (val: string) => void;
}) {
  if (isChord) {
    const tokens = parseChordLineIntoTokens(line);

    // Group consecutive tokens by isChord flag
    const tokenGroups: { isChord: boolean; tokens: ChordToken[] }[] = [];
    let currentGroup: { isChord: boolean; tokens: ChordToken[] } | null = null;

    for (const t of tokens) {
      if (!currentGroup || currentGroup.isChord !== t.isChord) {
        currentGroup = { isChord: t.isChord, tokens: [t] };
        tokenGroups.push(currentGroup);
      } else {
        currentGroup.tokens.push(t);
      }
    }

    return (
      <div 
        className="chord-line text-brand font-black min-h-[1.4em] mb-0.5 sm:mb-1 select-none flex flex-wrap items-center gap-x-0 font-mono"
        style={{ whiteSpace: 'pre', letterSpacing: '0', fontFamily: '"JetBrains Mono", monospace' }}
      >
        {tokenGroups.map((group, gIdx) => {
          if (group.isChord) {
            return group.tokens.map((token, tIdx) => {
              return (
                <ChordButton 
                  key={`g-${gIdx}-t-${tIdx}`}
                  text={token.text}
                  bold={token.bold}
                  italic={token.italic}
                  underline={token.underline}
                  setActiveChordInDict={setActiveChordInDict}
                />
              );
            });
          } else {
            const combinedText = group.tokens.map(t => t.text).join('');
            return (
              <RenderTextWithInlineBadges 
                key={`g-${gIdx}`}
                text={combinedText}
                baseClasses="font-mono text-brand font-black"
              />
            );
          }
        })}
      </div>
    );
  }

  // Check if line contains section or dynamics tags
  const parsedDyn = parseLineSectionAndDynamics(line);
  if (parsedDyn.isMatch) {
    return <RenderSectionOrDynamicsLine parsed={parsedDyn} />;
  }

  // Freestanding text line (for example: header [Intro], lyrics, or spacing)
  const styledChars = getStyledChars(line);
  const runs = getStyledTextRuns(styledChars);
  return (
    <div 
      style={{ whiteSpace: 'pre', minHeight: '1.4em' }}
      className="text-text-main mb-0.5 sm:mb-1"
    >
      {runs.length > 0 ? (
        runs.map((run, rIdx) => {
          const char = run.text[0];
          return (
            <RenderTextWithInlineBadges 
              key={rIdx}
              text={run.text}
              baseClasses={cn(
                run.bold && "font-black brightness-110",
                run.italic && "italic",
                run.underline && "underline decoration-current",
                (char === '[' || char === ']') && "text-amber-500 font-extrabold",
                (char === '{' || char === '}') && "text-cyan-500 font-extrabold"
              )}
            />
          );
        })
      ) : (
        '\n'
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.line === nextProps.line && prevProps.isChord === nextProps.isChord;
});

const compressAndResizeImage = (file: File, maxWidth = 180, maxHeight = 180): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const ConfirmButton = ({ 
  onConfirm, children, className, title 
}: { 
  onConfirm: () => void, children: React.ReactNode, className?: string, title?: string 
}) => {
  const [confirming, setConfirming] = useState(false);
  
  useEffect(() => {
    if (confirming) {
      const t = setTimeout(() => setConfirming(false), 3000);
      return () => clearTimeout(t);
    }
  }, [confirming]);
  
  return (
    <button 
      onClick={(e) => { 
        e.stopPropagation(); 
        if (confirming) { 
          onConfirm(); 
          setConfirming(false); 
        } else {
          setConfirming(true);
        }
      }}
      title={title}
      className={cn(
        "transition-all duration-200",
        confirming ? "bg-red-500 text-white scale-110 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg z-50 animate-pulse border-none ring-2 ring-white/20" : className
      )}
    >
      {confirming ? "Tem certeza?" : children}
    </button>
  );
};

const formatDate = (date: any, options?: Intl.DateTimeFormatOptions) => {
  if (!date) return '';
  try {
    const d = date?.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return 'Data Inv√°lida';
    return d.toLocaleDateString('pt-BR', options);
  } catch (e) {
    return 'Data Inv√°lida';
  }
};

const formatTime = (date: any) => {
  if (!date) return '';
  try {
    const d = date?.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '--:--';
  }
};

const NotificationCenter = ({ notifications, onMarkRead, onDelete, onClearRead, onClose, isSidebarCollapsed }: { 
  notifications: any[], 
  onMarkRead: (id: string) => void,
  onDelete: (id: string) => void,
  onClearRead: () => void,
  onClose: () => void,
  isSidebarCollapsed?: boolean
}) => {
  const readCount = notifications.filter(n => n.read).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={cn(
        "fixed z-[100] flex flex-col overflow-hidden notranslate bg-surface border border-border shadow-2xl rounded-2xl max-h-[500px]",
        "bottom-16 left-4 right-4 w-auto",
        "md:bottom-auto md:top-4 md:right-auto md:w-[400px]",
        isSidebarCollapsed ? "md:left-24" : "md:left-68"
      )}
      translate="no"
    >
      <div className="p-4 border-b border-border flex items-center justify-between bg-black/5 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-black text-text-main uppercase tracking-widest">Notifica√ß√µes</h3>
          {readCount > 0 && (
            <ConfirmButton 
              onConfirm={onClearRead}
              className="text-[10px] font-black uppercase text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full hover:bg-red-500/20 transition-all"
            >
              Limpar Lidas
            </ConfirmButton>
          )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 min-h-[100px]">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={cn(
                "p-3 rounded-xl border transition-all relative group/notif",
                notif.read 
                  ? "bg-transparent border-transparent opacity-90" 
                  : "bg-brand/5 border-brand/20 shadow-sm"
              )}
              onClick={() => !notif.read && onMarkRead(notif.id)}
            >
              <div className="flex gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  notif.type === 'announcement' ? "bg-amber-500/20 text-amber-500" :
                  notif.type === 'mural' ? "bg-brand/20 text-brand" :
                  "bg-blue-500/20 text-blue-500"
                )}>
                  {notif.type === 'announcement' ? <Bell size={20} /> :
                   notif.type === 'mural' ? <MessageSquare size={20} /> :
                   <Activity size={20} />}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-sm font-black text-text-main leading-tight truncate">{notif.title}</p>
                  <p className="text-xs text-text-main/90 font-medium mt-1 leading-relaxed line-clamp-2">{notif.content}</p>
                  <p className="text-[10px] text-text-main/60 font-bold mt-1 uppercase italic">
                    {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString('pt-BR') : ''} {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1" />
                )}
              </div>
              <ConfirmButton 
                onConfirm={() => onDelete(notif.id)}
                className={cn(
                  "absolute top-2 right-2 p-1 text-text-muted hover:text-red-500 transition-all",
                  notif.read ? "opacity-100" : "opacity-0 group-hover/notif:opacity-100"
                )}
              >
                <Trash2 size={12} />
              </ConfirmButton>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-text-main/60">
            <Bell size={40} className="mx-auto opacity-30 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">Sem novas notifica√ß√µes</p>
          </div>
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="p-3 border-t border-border bg-black/5 dark:bg-white/5 text-center">
          <p className="text-[10px] font-black text-text-main/40 uppercase tracking-widest">Voc√™ est√° em dia!</p>
        </div>
      )}
    </motion.div>
  );
};

const getLocalDateTimeString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getLocalDateString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFormatNameForPdf = (name: string) => {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.toLowerCase() === 'fran') return 'Franciane';
  if (/^fran\s+/i.test(trimmed)) {
    return trimmed.replace(/^fran\s+/i, 'Franciane ');
  }
  return name;
};

const Button = ({ 
  children, onClick, variant = 'primary', className, disabled 
}: { 
  children: React.ReactNode, onClick?: () => void, variant?: 'primary' | 'secondary' | 'danger' | 'ghost', className?: string, disabled?: boolean 
}) => {
  const variants = {
    primary: 'bg-brand text-brand-text hover:brightness-110 shadow-sm shadow-brand/20',
    secondary: 'bg-black/10 dark:bg-white/10 text-text-main hover:bg-black/20 dark:hover:bg-white/20 border border-border',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-100',
    ghost: 'bg-transparent text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
  };

  return (
    <button 
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
  <div style={style} className={cn("bg-card border border-border rounded-2xl shadow-sm overflow-hidden relative", className)}>
    {children}
  </div>
);

const Input = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props}
    className={cn(
      "w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand bg-black/25 text-text-main text-sm transition-all placeholder:text-text-muted/50 notranslate",
      props.className
    )}
    translate="no"
  />
);

function normalizeSongTitle(str: string): string {
  if (!str) return "";
  return str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, "")     // Remove special characters
    .replace(/\s+/g, " ")           // Collapse multiple spaces
    .trim();
}

function calculateSongMatchScore(normTitle: string, normSearch: string): number {
  if (!normTitle || !normSearch) return 0;
  if (normTitle === normSearch) return 100;

  const words1 = normTitle.split(/\s+/).filter(Boolean);
  const words2 = normSearch.split(/\s+/).filter(Boolean);

  if (words1.length === 0 || words2.length === 0) return 0;

  // Count how many words in words1 match words in words2
  let matchedCount = 0;
  const used2 = new Set<number>();

  for (const w1 of words1) {
    for (let i = 0; i < words2.length; i++) {
      if (used2.has(i)) continue;
      const w2 = words2[i];

      // Check if words match exactly, or as plural/singular, or as a strong prefix
      const isExact = w1 === w2;
      const isPluralSingular = (w1 + 's' === w2) || (w2 + 's' === w1);
      const isPrefix = (w1.length >= 4 && w2.length >= 4) && (w1.startsWith(w2) || w2.startsWith(w1));

      if (isExact || isPluralSingular || isPrefix) {
        matchedCount++;
        used2.add(i);
        break;
      }
    }
  }

  if (matchedCount === 0) return 0;

  // Calculate percentage-based score
  const maxWords = Math.max(words1.length, words2.length);
  const wordMatchRatio = matchedCount / maxWords;

  // Favor cases where the order/substring matches
  let substringBonus = 0;
  if (normTitle.includes(normSearch) || normSearch.includes(normTitle)) {
    substringBonus = 15;
  }

  // Penalty for length difference to favor closer titles
  const lengthDiff = Math.abs(normTitle.length - normSearch.length);
  const lengthPenalty = Math.min(20, lengthDiff * 0.5);

  return (wordMatchRatio * 80) + substringBonus - lengthPenalty;
}

export function findBestSongMatch<T extends { title: string }>(songs: T[], rawSearch: string): T | null {
  const normSearch = normalizeSongTitle(rawSearch);
  if (!normSearch) return null;

  // 1. Try exact normalized match first
  const exactMatch = songs.find(s => normalizeSongTitle(s.title) === normSearch);
  if (exactMatch) return exactMatch;

  // 2. Score all songs to find the best matching candidate
  let bestSong: T | null = null;
  let bestScore = 0;

  for (const song of songs) {
    const normTitle = normalizeSongTitle(song.title);
    const score = calculateSongMatchScore(normTitle, normSearch);
    if (score >= 40 && score > bestScore) {
      bestScore = score;
      bestSong = song;
    }
  }

  return bestSong;
}

function parseYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  const trimmed = url.trim();
  if (trimmed.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/* App component removed from split view */;

export const SERVICE_THEMES: Record<string, {
  name: string;
  icon: string;
  bgDark: string;
  bgLight: string;
  badge: string;
  text: string;
  desc: string;
}> = {
  normal: {
    name: 'Geral / Padr√£o',
    icon: '‚õ™',
    bgDark: '',
    bgLight: '',
    badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30 dark:bg-zinc-500/10 dark:text-zinc-300 dark:border-zinc-500/20',
    text: 'text-zinc-400 dark:text-zinc-300',
    desc: 'Tema padr√£o do aplicativo (usa as cores do minist√©rio)'
  },
  missions: {
    name: 'Culto de Miss√µes',
    icon: 'üåç',
    bgDark: 'linear-gradient(135deg, #064e3b 0%, #022c22 60%, #1c1917 100%)',
    bgLight: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    text: 'text-emerald-400 dark:text-emerald-300',
    desc: 'Vibe terra, verde floresta e marrom com foco global'
  },
  family: {
    name: 'Culto da Fam√≠lia',
    icon: 'üè°',
    bgDark: 'linear-gradient(135deg, #7c2d12 0%, #431407 60%, #18181b 100%)',
    bgLight: 'linear-gradient(135deg, #c2410c 0%, #9a3412 100%)',
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20',
    text: 'text-orange-400 dark:text-orange-300',
    desc: 'Vibe calorosa em terracota, p√™ssego e cores acolhedoras'
  },
  easter: {
    name: 'P√°scoa',
    icon: '‚úùÔ∏è',
    bgDark: 'linear-gradient(135deg, #4c1d95 0%, #2e1065 60%, #0c0a09 100%)',
    bgLight: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20',
    text: 'text-purple-400 dark:text-purple-300',
    desc: 'Violeta imperial e toques de luz dourada da ressurrei√ß√£o'
  },
  christmas: {
    name: 'Natal',
    icon: 'üéÑ',
    bgDark: 'linear-gradient(135deg, #052e16 0%, #18000a 60%, #021509 100%)',
    bgLight: 'linear-gradient(135deg, #15803d 0%, #14532d 100%)',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
    text: 'text-red-400 dark:text-red-300',
    desc: 'Verde pinheiro profundo, vinho e toques dourados'
  },
  palm_sunday: {
    name: 'Domingo de Ramos',
    icon: 'üåø',
    bgDark: 'linear-gradient(135deg, #1e3a1e 0%, #142214 60%, #111827 100%)',
    bgLight: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
    badge: 'bg-green-500/15 text-green-400 border-green-500/30 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20',
    text: 'text-green-400 dark:text-green-300',
    desc: 'Verde folha fresco e tons dourados de areia'
  },
  youth: {
    name: 'Culto de Jovens',
    icon: '‚ö°',
    bgDark: 'linear-gradient(135deg, #1e1b4b 0%, #311042 60%, #030712 100%)',
    bgLight: 'linear-gradient(135deg, #4338ca 0%, #2563eb 100%)',
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20',
    text: 'text-indigo-400 dark:text-indigo-300',
    desc: 'Neon moderno violeta, √≠ndigo profundo e azul el√©trico'
  },
  men: {
    name: 'Culto de Homens',
    icon: 'üõ°Ô∏è',
    bgDark: 'linear-gradient(135deg, #172554 0%, #0f172a 60%, #020617 100%)',
    bgLight: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
    text: 'text-blue-400 dark:text-blue-300',
    desc: 'Tons de a√ßo, cinza ard√≥sia e azul oceano profundo'
  },
  women: {
    name: 'Culto de Mulheres',
    icon: 'üå∏',
    bgDark: 'linear-gradient(135deg, #831843 0%, #4c0519 60%, #18000a 100%)',
    bgLight: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
    text: 'text-rose-400 dark:text-rose-300',
    desc: 'Rosa bronze, malva e tons quentes florais'
  },
  prayer: {
    name: 'Ora√ß√£o',
    icon: 'üôè',
    bgDark: 'linear-gradient(135deg, #1e1e38 0%, #111122 60%, #050510 100%)',
    bgLight: 'linear-gradient(135deg, #3730a3 0%, #312e81 100%)',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20',
    text: 'text-sky-400 dark:text-sky-300',
    desc: 'Azul crep√∫sculo sereno para introspec√ß√£o e comunh√£o'
  },
  vigil: {
    name: 'Vig√≠lia',
    icon: 'üåå',
    bgDark: 'linear-gradient(135deg, #090514 0%, #120b24 60%, #020105 100%)',
    bgLight: 'linear-gradient(135deg, #111827 0%, #030712 100%)',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    text: 'text-amber-400 dark:text-amber-300',
    desc: 'C√©u noturno estrelado, obsidian escuro e fachos de luz ouro'
  }
};

function getContrastColor(hex: string) {
  if (!hex) return '#ffffff';
  const color = hex.replace('#', '');
  if (color.length !== 6) return '#ffffff';
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 140 ? '#000000' : '#ffffff';
}


function TimeSignatureDisplay({ value, className }: { value: string, className?: string }) {
  if (!value || !value.includes('/')) return <span className={cn("font-black leading-none", className)}>{value}</span>;
  const [num, den] = value.split('/');
  return (
    <div className={cn("inline-flex flex-col items-center leading-[0.7] text-center", className)}>
      <span className="text-[15px] font-black leading-none">{num}</span>
      <div className="w-3 h-[1.5px] bg-current opacity-60 my-[2px]" />
      <span className="text-[15px] font-black leading-none">{den}</span>
    </div>
  );
}

// Main Component Export

export default function SongsView({ 
  onSelectSong, 
  initialAdd = false, 
  onAddModalClose,
  showLiturgySongs,
  setShowLiturgySongs,
  createNotifications,
  onStartPlaylist,
  theme
}: { 
  onSelectSong: (song: any) => void, 
  initialAdd?: boolean, 
  onAddModalClose?: () => void,
  showLiturgySongs: boolean,
  setShowLiturgySongs: (show: boolean) => void,
  createNotifications?: (title: string, content: string, type: 'announcement' | 'mural' | 'service' | 'general', excludeUserId?: string, preferenceKey?: 'notifyNewSongs' | 'notifyScheduleChanges' | 'notifyDayBeforeReminder' | 'notifyNewLiturgy') => Promise<void>,
  onStartPlaylist?: (songs: any[]) => void,
  theme?: 'light' | 'dark'
}) {
  const { user, isAdmin, memberData } = useAuth();
  const userChurchId = memberData?.churchId || 'semente';
  const [songs, setSongs] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isSpeechRunningRef = useRef(false);

  const normalize = useCallback((str: string) => {
    if (!str) return "";
    return str.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s]/g, "")     // Remove special chars like ( ) - :
      .replace(/\s+/g, " ")           // Collapse multiple spaces
      .trim();
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
        isSpeechRunningRef.current = true;
      };

      recognition.onend = () => {
        setIsListening(false);
        isSpeechRunningRef.current = false;
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        setIsListening(false);
        isSpeechRunningRef.current = false;
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const textToSearch = transcript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
          setSearchTerm(textToSearch);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;
    
    if (isListening || isSpeechRunningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping speech recognition:', e);
      }
      setIsListening(false);
      isSpeechRunningRef.current = false;
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        isSpeechRunningRef.current = true;
      } catch (e: any) {
        console.warn('Error starting speech recognition:', e);
        // If it was already started inside the browser engine, sync our indicator states nicely
        setIsListening(true);
        isSpeechRunningRef.current = true;
      }
    }
  };

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('');
  const [isAdding, setIsAdding] = useState(initialAdd && isAdmin);
  const [modalTab, setModalTab] = useState<'info' | 'lyrics' | 'chords' | 'media'>('info');
  const [isAddingLiturgySong, setIsAddingLiturgySong] = useState(false);
  const [liturgySongSearch, setLiturgySongSearch] = useState('');
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null);
  const [isEditingTargetPlaylist, setIsEditingTargetPlaylist] = useState(false);
  const [targetPlaylistUrl, setTargetPlaylistUrl] = useState('');
  const [isSavingTargetPlaylist, setIsSavingTargetPlaylist] = useState(false);

  useEffect(() => {
    if (initialAdd && isAdmin) {
      setIsAdding(true);
    }
  }, [initialAdd, isAdmin]);

  const closeAddingModal = () => {
    setIsAdding(false);
    setSuggestedVersions([]);
    setAutofillSuccess(null);
    setAutofillError(null);
    onAddModalClose?.();
  };

  const categories = [
    "CRIA√á√ÉO/ADORA√á√ÉO",
    "QUEDA/CONFISS√ÉO",
    "REDEN√á√ÉO/A√á√ÉO DE GRA√áAS",
    "CONSUMA√á√ÉO/RESPOSTA"
  ];
  const [newSong, setNewSong] = useState({ 
    title: '', 
    artist: '', 
    artistImageUrl: '',
    category: '',
    timeSignature: '4/4',
    baseKey: '',
    lyrics: '', 
    chords: '', 
    bpm: 80, 
    youtube: '',
    tags: [], 
    audio: [] as { name: string, url: string }[], 
    files: [] as { name: string, url: string, type: string }[],
    driveAudioLink: '',
    driveFilesLink: '',
    capo: ''
  });
  const [tempLink, setTempLink] = useState({ name: '', url: '' });

  const handleNewChordBeforeInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    const data = nativeEvent?.data;

    if (data === '.' || data === '. ' || data === '.\n') {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const val = textarea.value;

      if (start > 0) {
        const charBefore = val[start - 1];
        if (charBefore === ' ' || data === '. ' || /[A-G]/.test(charBefore)) {
          e.preventDefault();
          const end = textarea.selectionEnd;
          const spacesToInsert = charBefore === ' ' ? ' ' : '  ';
          const newVal = val.substring(0, start) + spacesToInsert + val.substring(end);
          const newPos = start + spacesToInsert.length;

          setNewSong(prev => ({ ...prev, chords: newVal }));
          requestAnimationFrame(() => {
            try {
              textarea.selectionStart = textarea.selectionEnd = newPos;
            } catch (err) {}
          });
        }
      }
    }
  };

  const handleNewChordKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === ' ') {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const val = textarea.value;

      if (start > 0 && val[start - 1] === ' ') {
        e.preventDefault();
        const end = textarea.selectionEnd;
        const newVal = val.substring(0, start) + ' ' + val.substring(end);
        const newPos = start + 1;

        setNewSong(prev => ({ ...prev, chords: newVal }));
        requestAnimationFrame(() => {
          try {
            textarea.selectionStart = textarea.selectionEnd = newPos;
          } catch (err) {}
        });
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    const songPath = 'songs';
    const q = query(collection(db, songPath), orderBy('title', 'asc'));
    const unsubSongs = onSnapshot(q, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      const filtered = items.filter(s => s.churchId === userChurchId || (!s.churchId && userChurchId === 'semente'));
      setSongs(filtered);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, songPath);
    });

    const servicesPath = 'services';
    const qServices = query(collection(db, servicesPath), orderBy('date', 'asc'));
    const unsubServices = onSnapshot(qServices, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      const filtered = docs.filter(s => s.churchId === userChurchId || (!s.churchId && userChurchId === 'semente'));
      setServices(filtered);
    });

    return () => {
      unsubSongs();
      unsubServices();
    };
  }, [user, userChurchId]);

  // Busca o culto alvo com uma liturgia ou setlist (prioriza o mais pr√≥ximo de agora, futuro ou passado recente)
  const targetService = useMemo(() => {
    if (services.length === 0) return null;
    
    const now = new Date();
    // Consideramos "hoje" como o dia inteiro para n√£o perder o culto que est√° acontecendo
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const servicesWithDates = services
      .map(s => {
        let date;
        if (s.date?.toDate) {
          date = s.date.toDate();
        } else if (s.date instanceof Date) {
          date = s.date;
        } else {
          date = new Date(s.date);
        }
        return { ...s, _actualDate: isNaN(date.getTime()) ? new Date(0) : date };
      })
      .filter(s => (s.liturgy && s.liturgy.length > 0) || (s.setlist && s.setlist.length > 0))
      .sort((a, b) => a._actualDate.getTime() - b._actualDate.getTime());

    if (servicesWithDates.length === 0) return null;
    
    // 1. Tenta encontrar o culto MAIS PR√ìXIMO no futuro ou hoje
    const futureService = servicesWithDates.find(s => s._actualDate >= startOfToday);
    if (futureService) return futureService;

    // 2. Se n√£o houver futuros, pega o √öLTIMO que aconteceu no passado,
    // mas apenas se tiver ocorrido h√° menos de 24 horas (como solicitado pelo usu√°rio)
    const lastService = servicesWithDates[servicesWithDates.length - 1];
    if (lastService) {
      const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      if (lastService._actualDate >= twentyFourHoursAgo) {
        return lastService;
      }
    }

    return null;
  }, [services]);

  const handleAddSongToLiturgy = async (song: any) => {
    if (!targetService) return;
    
    const liturgy = [...(targetService.liturgy || [])];
    const setlist = [...(targetService.setlist || [])];
    
    const inLiturgy = liturgy.some((item: any) => item.songId === song.id);
    const inSetlist = setlist.includes(song.id);
    if (inLiturgy || inSetlist) {
      alert("Esta m√∫sica j√° est√° agendada para este culto.");
      return;
    }

    const newItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      type: 'song',
      title: song.title,
      songId: song.id,
      content: song.artist || '',
      moment: 'Louvor'
    };

    const updatedLiturgy = [...liturgy, newItem];
    const updatedSetlist = updatedLiturgy
      .filter((item: any) => item && (item.type === 'song' || item.songId))
      .map((item: any) => item.songId || item.id)
      .filter(Boolean);

    try {
      await updateDoc(doc(db, 'services', targetService.id), {
        liturgy: updatedLiturgy,
        setlist: updatedSetlist,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao adicionar m√∫sica ao culto:", error);
      alert("N√£o foi poss√≠vel adicionar a m√∫sica.");
    }
  };

  const handleRemoveSongFromLiturgy = async (songId: string) => {
    if (!targetService) return;
    
    const song = songs.find(s => s.id === songId);
    
    const liturgy = [...(targetService.liturgy || [])];

    const updatedLiturgy = liturgy.filter((item: any) => {
      if (!item) return false;
      // If it has matching song ID
      if (item.songId && item.songId === songId) return false;
      // If it's the liturgy item's own unique ID
      if (item.id === songId) return false;
      
      // If the liturgy item matches the removed song via findBestSongMatch
      if (item.title && item.type === 'song') {
        const matchedSong = findBestSongMatch(songs, item.title);
        if (matchedSong && matchedSong.id === songId) return false;
      }
      return true;
    });

    const updatedSetlist = updatedLiturgy
      .filter((item: any) => item && (item.type === 'song' || item.songId))
      .map((item: any) => item.songId || item.id)
      .filter(Boolean);

    try {
      await updateDoc(doc(db, 'services', targetService.id), {
        liturgy: updatedLiturgy,
        setlist: updatedSetlist,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao remover m√∫sica do culto:", error);
      alert("N√£o foi poss√≠vel remover a m√∫sica.");
    }
  };

  const handleMoveLiturgySong = async (songId: string, direction: 'up' | 'down') => {
    if (!targetService) return;

    const liturgy = [...(targetService.liturgy || [])];

    // Swap in liturgy
    const itemIndex = liturgy.findIndex(item => item.songId === songId);
    if (itemIndex !== -1) {
      const songIndices = liturgy
        .map((item, idx) => (item.type === 'song' || item.songId) ? idx : -1)
        .filter(idx => idx !== -1);

      const positionInSongs = songIndices.indexOf(itemIndex);
      if (positionInSongs !== -1) {
        let targetIndex = -1;
        if (direction === 'up' && positionInSongs > 0) {
          targetIndex = songIndices[positionInSongs - 1];
        } else if (direction === 'down' && positionInSongs < songIndices.length - 1) {
          targetIndex = songIndices[positionInSongs + 1];
        }

        if (targetIndex !== -1) {
          const temp = liturgy[itemIndex];
          liturgy[itemIndex] = liturgy[targetIndex];
          liturgy[targetIndex] = temp;
        }
      }
    }

    const updatedSetlist = liturgy
      .filter((item: any) => item && (item.type === 'song' || item.songId))
      .map((item: any) => item.songId || item.id)
      .filter(Boolean);

    try {
      await updateDoc(doc(db, 'services', targetService.id), { 
        liturgy,
        setlist: updatedSetlist,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao ordenar m√∫sicas:", error);
      alert("N√£o foi poss√≠vel salvar a nova ordem.");
    }
  };

  const liturgySongIds = useMemo(() => {
    return getServiceSongIds(targetService, songs);
  }, [targetService, songs]);

  const filteredSongs = useMemo(() => {
    if (showLiturgySongs) {
      // Mapeia os IDs para os objetos reais das m√∫sicas mantendo a ORDEM da liturgia
      let sList = liturgySongIds
        .map((id: string) => songs.find(s => s.id === id))
        .filter(Boolean);
      if (showOnlyFavorites) {
        const favIds = memberData?.favoriteSongs || [];
        sList = sList.filter(s => favIds.includes(s.id));
      }
      return sList;
    }

    const filtered = songs.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.artist.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || s.category === selectedCategory;
      const matchesArtist = !selectedArtist || s.artist === selectedArtist;
      const matchesFavorites = !showOnlyFavorites || (memberData?.favoriteSongs || []).includes(s.id);
      return matchesSearch && matchesCategory && matchesArtist && matchesFavorites;
    });

    return [...filtered].sort((a, b) => {
      const cleanTitle = (title: string) => {
        const trimmed = (title || '').trim();
        const normalized = trimmed.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        // Remove any leading non-alphanumeric characters (like quotes, dashes, or spaces) for sorting key purposes
        const stripped = normalized.replace(/^[^a-z0-9]+/, "");
        return stripped || normalized;
      };
      const titleA = cleanTitle(a.title);
      const titleB = cleanTitle(b.title);
      return titleA.localeCompare(titleB);
    });
  }, [songs, showLiturgySongs, liturgySongIds, searchTerm, selectedCategory, selectedArtist, showOnlyFavorites, memberData]);

  const liturgyPlaylistSongs = useMemo(() => {
    if (!showLiturgySongs || !targetService) return [];
    return getServicePlaylistSongs(targetService, songs);
  }, [targetService, songs, showLiturgySongs]);

  const handleSaveTargetPlaylist = async () => {
    if (!targetService) return;
    setIsSavingTargetPlaylist(true);
    try {
      await updateServicePlaylistUrl(targetService.id, targetPlaylistUrl);
      setIsEditingTargetPlaylist(false);
    } catch (e) {
      console.error("Error updating target playlist URL:", e);
      alert("Erro ao atualizar playlist do culto no Firebase.");
    } finally {
      setIsSavingTargetPlaylist(false);
    }
  };

  const artists = Array.from(new Set(songs.map(s => s.artist).filter(Boolean))).sort();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillSuccess, setAutofillSuccess] = useState<string | null>(null);
  const [autofillError, setAutofillError] = useState<string | null>(null);
  const [suggestedVersions, setSuggestedVersions] = useState<{ artist: string, info?: string }[]>([]);
  const [isFindingVersions, setIsFindingVersions] = useState(false);
  const [cifraClubUrl, setCifraClubUrl] = useState('');
  const [isImportingCifra, setIsImportingCifra] = useState(false);

  const handleImportFromCifraClub = async () => {
    if (!cifraClubUrl) {
      setAutofillError("Por favor, cole um link v√°lido do Cifra Club primeiro.");
      return;
    }

    const trimmedUrl = cifraClubUrl.trim();
    if (!trimmedUrl.toLowerCase().includes("cifraclub.com.br")) {
      setAutofillError("O link deve pertencer ao site cifraclub.com.br.");
      return;
    }

    setIsImportingCifra(true);
    setAutofillSuccess(null);
    setAutofillError(null);

    try {
      const response = await fetch("/api/songs/import-cifraclub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || "N√£o foi poss√≠vel importar a cifra do Cifra Club.");
      }

      const data = await response.json();
      setNewSong({
        ...newSong,
        title: data.title || newSong.title,
        artist: data.artist || newSong.artist,
        artistImageUrl: data.artistImageUrl || newSong.artistImageUrl || '',
        baseKey: data.key || newSong.baseKey,
        bpm: data.bpm || newSong.bpm,
        timeSignature: data.timeSignature || newSong.timeSignature,
        chords: data.chords || newSong.chords,
        lyrics: data.lyrics || newSong.lyrics,
        capo: data.capo || newSong.capo
      });
      setCifraClubUrl('');
      setAutofillSuccess(`M√∫sica "${data.title}" importada e preenchida com sucesso direto do Cifra Club! Abas de cifra e letra tamb√©m atualizadas.`);
    } catch (error: any) {
      console.error("Erro ao importar do Cifra Club:", error);
      setAutofillError(error.message || "Erro de conex√£o ao realizar a importa√ß√£o direta do Cifra Club. Verifique o link e tente novamente.");
    } finally {
      setIsImportingCifra(false);
    }
  };
  
  const handleToggleFavorite = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (!user) return;
    const memberRef = doc(db, 'members', user.uid);
    const currentFavorites = [...(memberData?.favoriteSongs || [])];
    let updatedFavorites: string[];
    if (currentFavorites.includes(songId)) {
      updatedFavorites = currentFavorites.filter(id => id !== songId);
    } else {
      updatedFavorites = [...currentFavorites, songId];
    }
    try {
      await setDoc(memberRef, { favoriteSongs: updatedFavorites }, { merge: true });
    } catch (error) {
      console.error("Erro ao atualizar m√∫sicas favoritas:", error);
      handleFirestoreError(error, OperationType.WRITE, `members/${user.uid}`);
    }
  };

  const handleAddSong = async () => {
    if (!newSong.title) {
      alert('Por favor, insira pelo menos o t√≠tulo da m√∫sica.');
      return;
    }
    
    setIsSubmitting(true);
    const songPath = 'songs';
    try {
      const sanitizedChords = cleanTablatures(newSong.chords || '');
      const sanitizedLyrics = cleanTablatures(newSong.lyrics || '');

      await addDoc(collection(db, songPath), {
        ...newSong,
        chords: sanitizedChords,
        lyrics: sanitizedLyrics,
        createdAt: serverTimestamp(),
        churchId: userChurchId
      });
      if (createNotifications) {
        await createNotifications(
          'üéµ Nova M√∫sica Adicionada',
          `A m√∫sica "${newSong.title}"${newSong.artist ? ` (por ${newSong.artist})` : ''} foi cadastrada no repert√≥rio!`,
          'general',
          user?.uid,
          'notifyNewSongs'
        );
      }
      closeAddingModal();
      setNewSong({ title: '', artist: '', artistImageUrl: '', category: '', timeSignature: '4/4', baseKey: '', lyrics: '', chords: '', bpm: 80, youtube: '', tags: [], audio: [], files: [], driveAudioLink: '', driveFilesLink: '', capo: '' });
      setModalTab('info');
      setTempLink({ name: '', url: '' });
    } catch (error) {
      console.error(error);
      alert('Erro ao cadastrar m√∫sica. Verifique sua conex√£o ou permiss√µes.');
      handleFirestoreError(error, OperationType.CREATE, songPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMedia = (type: 'audio' | 'files') => {
    if (!tempLink.url) return;
    const name = tempLink.name || (type === 'audio' ? 'Guia de √Åudio' : 'Arquivo');
    if (type === 'audio') {
      setNewSong({ ...newSong, audio: [...newSong.audio, { name, url: tempLink.url }] });
    } else {
      setNewSong({ ...newSong, files: [...newSong.files, { name, url: tempLink.url, type: 'link' }] });
    }
    setTempLink({ name: '', url: '' });
  };

  const handleNewSongAudioFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      alert("Para melhor desempenho e limite de armazenamento, arquivos diretos devem ter at√© 800KB. Para √°udios mais longos, recomendamos informar um link do Google Drive ou OneDrive no campo de link.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      const name = tempLink.name || file.name;
      setNewSong(prev => ({
        ...prev,
        audio: [...prev.audio, { name, url: base64Data }]
      }));
      setTempLink({ name: '', url: '' });
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(showLiturgySongs ? "space-y-3 sm:space-y-4" : "space-y-6")}
    >
      {/* Sticky Header Container */}
      <div className={cn(
        "sticky top-[-16px] md:top-[-40px] z-30 bg-surface/95 backdrop-blur-md pt-2 md:pt-10 border-b border-border/10 space-y-4 md:space-y-6 -mx-4 md:-mx-10 px-4 md:px-10",
        showLiturgySongs ? "pb-2 sm:pb-3" : "pb-4 md:pb-6"
      )}>
        <div className="flex flex-col items-center justify-center text-center gap-3 md:gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">Repert√≥rio Musical</h1>
            <p className="text-text-main text-xs md:text-sm font-medium mb-4">Gerencie letras, cifras e transposi√ß√£o.</p>
            
            <div className="w-full max-w-xl text-left mx-auto">
              <ContextualHelp 
                id="songs"
                title="Repert√≥rio: Como encontrar e estudar?"
                description="O Repert√≥rio re√∫ne as letras, tons, bpm, guias de √°udio e arquivos complementares de todas as m√∫sicas cadastradas na igreja."
                steps={[
                  "Use o campo de busca no cabe√ßalho para filtrar m√∫sicas por t√≠tulo, artista ou fragmento de letra.",
                  "Toque na estrela para adicionar m√∫sicas aos seus favoritos e acess√°-las de forma imediata.",
                  "Abra uma m√∫sica para visualizar a cifra din√¢mica, onde voc√™ pode transpor o tom e usar a rolagem autom√°tica.",
                  "Assista ao v√≠deo ou ou√ßa os guias de √°udio oficiais anexados pelo seu l√≠der para alinhar a vers√£o do ensaio.",
                  "PEDAL BLUETOOTH & MIDI: Conecte pedais (AirTurn, PageTurner, Boss) ou footswitches MIDI para avan√ßar p√°ginas ou controlar a rolagem sem usar as m√£os no culto."
                ]}
                tip="Toque no √≠cone de microfone ao lado da busca para realizar pesquisa por comando de voz! √â super r√°pido!"
                theme={theme}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {targetService && (
              <button 
                onClick={() => setShowLiturgySongs(!showLiturgySongs)}
                className={cn(
                  "px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl font-black uppercase text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] flex items-center gap-1.5 sm:gap-2 transition-all shadow-xl active:scale-95 border-2 hover:scale-105",
                  showLiturgySongs 
                    ? "bg-brand text-brand-text border-brand shadow-brand/30 ring-4 ring-brand/20" 
                    : "bg-white text-primary border-brand hover:bg-brand hover:text-brand-text shadow-md dark:shadow-black/20"
                )}
              >
                <Zap size={12} className={cn("sm:w-3.5 sm:h-3.5", showLiturgySongs && "animate-pulse")} />
                {showLiturgySongs ? "Ver Todas as M√∫sicas" : "M√∫sicas do Culto"}
              </button>
            )}

            {user && (
              <button 
                type="button"
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className={cn(
                  "px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl font-black uppercase text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] flex items-center gap-1.5 sm:gap-2 transition-all shadow-xl active:scale-95 border-2 hover:scale-105",
                  showOnlyFavorites 
                    ? "bg-amber-500 text-white border-amber-500 shadow-amber-500/30 ring-4 ring-amber-500/20" 
                    : "bg-white text-primary border-brand hover:bg-brand hover:text-brand-text shadow-md dark:shadow-black/20"
                )}
              >
                <Star size={12} className={cn("sm:w-3.5 sm:h-3.5", showOnlyFavorites && "fill-white")} />
                {showOnlyFavorites ? "Ver Todas" : "Minhas Favoritas"}
              </button>
            )}

            {isAdmin && !showLiturgySongs && (
              <Button onClick={() => setIsAdding(true)} className="px-4 py-2 sm:px-6 sm:py-2.5 h-9 sm:h-10 text-[11px] sm:text-sm shadow-xl shadow-brand/20">
                <Plus size={16} className="sm:w-[18px] sm:h-[18px]" /> Cadastrar M√∫sica
              </Button>
            )}
          </div>
        </div>

        {showLiturgySongs && targetService && (
          <div className="bg-brand/5 border border-brand/20 rounded-xl p-3 sm:p-6 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-brand uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-1">M√∫sicas Agendadas para:</p>
                  <h2 className="text-lg sm:text-2xl font-black text-text-main tracking-tight">{targetService.title}</h2>
                  <p className="text-[10px] sm:text-xs text-text-main/80 font-bold mt-1 uppercase tracking-widest">{formatDate(targetService.date)} ‚Ä¢ {formatTime(targetService.date)}</p>
                  {liturgySongIds.length === 0 && (
                    <p className="text-[10px] sm:text-xs text-red-500 font-bold mt-2 italic">Aten√ß√£o: Nenhuma m√∫sica vinculada nesta liturgia.</p>
                  )}
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand border border-brand/20 shrink-0">
                  <Music size={20} className="sm:w-6 sm:h-6" />
                </div>
             </div>

             <div className="mt-3 pt-3 border-t border-brand/10 flex flex-row items-center justify-start gap-2.5 sm:gap-3 flex-wrap">
               {liturgyPlaylistSongs.length > 0 && onStartPlaylist ? (
                 <button
                   type="button"
                   onClick={() => onStartPlaylist(liturgyPlaylistSongs)}
                   className="flex items-center justify-center gap-1.5 h-8 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold uppercase text-[9px] sm:text-[10px] tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md shadow-red-600/20 cursor-pointer shrink-0"
                 >
                   <Play size={12} className="fill-white" />
                   Playlist do Culto ({liturgyPlaylistSongs.length})
                 </button>
               ) : (
                 <p className="text-[9px] sm:text-[10px] text-text-muted italic flex-1 min-w-[200px]">Cadastre links do YouTube nas m√∫sicas para liberar a playlist do culto.</p>
               )}

               {targetService.playlistUrl && !isEditingTargetPlaylist && (
                 <button
                   type="button"
                   onClick={() => { window.open(targetService.playlistUrl, '_blank'); }}
                   className="flex items-center justify-center gap-1.5 h-8 px-3 bg-white text-[#E60000] border border-[#E60000]/20 rounded-lg font-bold uppercase text-[9px] sm:text-[10px] tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md shadow-red-600/5 cursor-pointer shrink-0"
                 >
                   <Youtube size={12} fill="#E60000" />
                   Playlist Externa
                 </button>
               )}

               {isAdmin && !isEditingTargetPlaylist && (
                 <button
                   type="button"
                   onClick={() => {
                     setTargetPlaylistUrl(targetService.playlistUrl || '');
                     setIsEditingTargetPlaylist(true);
                   }}
                   className="flex items-center justify-center gap-1.5 h-8 px-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-main border border-border rounded-lg font-bold uppercase text-[9px] sm:text-[10px] tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                   title="Configurar Link da Playlist do Culto"
                 >
                   <Youtube size={12} className="text-[#E60000]" />
                   {targetService.playlistUrl ? "Alterar Link Playlist" : "+ Vincular Playlist"}
                 </button>
               )}

               {isAdmin && (
                 <button
                   type="button"
                   onClick={() => setIsAddingLiturgySong(true)}
                   className="flex items-center justify-center gap-1.5 h-8 px-3 bg-brand text-brand-text rounded-lg font-bold uppercase text-[9px] sm:text-[10px] tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md shadow-brand/10 cursor-pointer shrink-0"
                 >
                   <Plus size={12} /> Adicionar M√∫sica
                 </button>
               )}
             </div>

             {isEditingTargetPlaylist && (
               <div className="mt-3 pt-3 border-t border-brand/10 flex flex-col sm:flex-row items-center gap-2 animate-in fade-in duration-200">
                 <div className="relative flex-1 w-full">
                   <Input
                     placeholder="Cole o link da Playlist no YouTube ou Spotify..."
                     value={targetPlaylistUrl}
                     onChange={e => setTargetPlaylistUrl(e.target.value)}
                     className="bg-black/5 dark:bg-white/5 border-border text-text-main text-xs h-9 w-full rounded-lg"
                     autoFocus
                   />
                 </div>
                 <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                   <button
                     type="button"
                     disabled={isSavingTargetPlaylist}
                     onClick={handleSaveTargetPlaylist}
                     className="h-9 px-4 bg-brand text-brand-text font-bold text-xs rounded-lg uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-1 shrink-0"
                   >
                     {isSavingTargetPlaylist ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                     Salvar Link
                   </button>
                   <button
                     type="button"
                     onClick={() => setIsEditingTargetPlaylist(false)}
                     className="h-9 px-3 bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main font-bold text-xs rounded-lg transition-all"
                   >
                     Cancelar
                   </button>
                 </div>
               </div>
             )}
          </div>
        )}

        {!showLiturgySongs && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-main/60 group-focus-within:text-text-main transition-colors" size={20} />
              <Input 
                placeholder={isListening ? "Ouvindo... fale agora" : "Buscar por t√≠tulo ou artista..."} 
                className={cn(
                  "pl-12 h-12 text-base shadow-sm bg-black/5 dark:bg-white/5 border-border transition-all",
                  speechSupported ? "pr-12" : "pr-4",
                  isListening && "border-amber-500/50 dark:border-amber-500/40 focus:ring-amber-500/10 placeholder-amber-500/60 font-semibold"
                )}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                    isListening 
                      ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-500/20" 
                      : "text-text-muted hover:text-text-main hover:bg-black/10 dark:hover:bg-white/10"
                  )}
                  title={isListening ? "Parar de ouvir" : "Pesquisar por voz (Falar nome da m√∫sica)"}
                >
                  <Mic size={16} className={cn(isListening && "animate-bounce")} />
                </button>
              )}

              <AnimatePresence>
                {isListening && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 right-0 top-14 z-25 bg-amber-500 text-black text-[11px] font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg border border-amber-400"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                    </span>
                    <span>Modo de Voz Ativo: Fale o t√≠tulo ou o nome do artista claramente...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <select 
                value={selectedArtist} 
                onChange={(e) => setSelectedArtist(e.target.value)}
                className="h-12 px-4 bg-black/5 dark:bg-slate-900 border border-border rounded-lg text-text-main font-medium focus:ring-2 focus:ring-brand/20 outline-none transition-all cursor-pointer sm:min-w-[180px]"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-zinc-900 dark:text-zinc-100 font-bold">Todos os Artistas</option>
                {artists.map(artist => (
                  <option key={artist} value={artist} className="bg-white dark:bg-slate-900 text-zinc-900 dark:text-zinc-100">{artist}</option>
                ))}
              </select>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-12 px-4 bg-black/5 dark:bg-slate-900 border border-border rounded-lg text-text-main font-medium focus:ring-2 focus:ring-brand/20 outline-none transition-all cursor-pointer sm:min-w-[180px]"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-zinc-900 dark:text-zinc-100 font-bold">Todas as Categorias</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-zinc-900 dark:text-zinc-100">{cat}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className={cn("grid gap-2 sm:gap-3", showLiturgySongs ? "pt-1" : "pt-2 sm:pt-4")}>
        {filteredSongs.map((song, songIdx) => (
          <div 
            key={song.id} 
            onClick={() => onSelectSong(song)}
            className="flex flex-row items-center justify-between p-3 sm:p-5 bg-card border border-border rounded-xl hover:border-brand/60 hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left shadow-lg group cursor-pointer animate-in fade-in duration-200 gap-2.5 sm:gap-4 w-full max-w-full overflow-hidden"
          >
            <div className="flex-1 min-w-0 notranslate" translate="no">
               <div className="flex items-center gap-1.5 sm:gap-4">
                  {user && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(e, song.id);
                      }}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 text-text-muted/40 hover:text-amber-500 hover:bg-amber-500/5",
                        (memberData?.favoriteSongs || []).includes(song.id) && "text-amber-500 bg-amber-500/10"
                      )}
                      title={(memberData?.favoriteSongs || []).includes(song.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                      <Star 
                        size={17} 
                        className={cn(
                          "sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110", 
                          (memberData?.favoriteSongs || []).includes(song.id) ? "fill-amber-500 stroke-amber-500" : ""
                        )} 
                      />
                    </button>
                  )}
                  <ArtistAvatar artist={song.artist} customImageUrl={song.artistImageUrl} size="lg" />
                  <div className="min-w-0 flex-1">
                     <p className="font-bold text-text-main text-sm sm:text-xl transition-colors leading-tight truncate">
                        {showLiturgySongs && (
                          <span className="text-brand mr-1 sm:mr-1.5 font-black">{songIdx + 1}¬™</span>
                        )}
                        {song.title}
                     </p>
                     <div className="flex flex-wrap items-center gap-1 sm:gap-3 mt-0.5 sm:mt-1">
                        <p className="text-[11px] sm:text-base text-text-main/80 font-medium italic truncate max-w-[120px] sm:max-w-none">{song.artist || 'Desconhecido'}</p>
                        {song.category && (
                          <span className="text-[9px] sm:text-[13px] font-black bg-black/5 dark:bg-black/5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-text-main uppercase tracking-tight group-hover:bg-brand/20 group-hover:text-text-main transition-all border border-border whitespace-nowrap overflow-visible">
                            {song.category}
                          </span>
                        )}
                     </div>
                  </div>
               </div>
            </div>
            
            {/* Action buttons section */}
            <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
              {/* Liturgy specific reordering and deletion controls */}
              <div className="flex items-center gap-1 sm:gap-4">
                {showLiturgySongs && isAdmin && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      disabled={songIdx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveLiturgySong(song.id, 'up');
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-black/5 dark:bg-white/5 border border-border flex items-center justify-center hover:bg-brand hover:text-brand-text active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all text-text-muted cursor-pointer shrink-0"
                      title="Mover para cima"
                    >
                      <ChevronUp size={14} className="sm:w-5 sm:h-5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      disabled={songIdx === filteredSongs.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveLiturgySong(song.id, 'down');
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-black/5 dark:bg-white/5 border border-border flex items-center justify-center hover:bg-brand hover:text-brand-text active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all text-text-muted cursor-pointer shrink-0"
                      title="Mover para baixo"
                    >
                      <ChevronDown size={14} className="sm:w-5 sm:h-5 stroke-[2.5]" />
                    </button>
                    {deletingSongId === song.id ? (
                      <div className="flex items-center gap-1 sm:gap-1.5 animation-in fade-in zoom-in-95 duration-200">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSongFromLiturgy(song.id);
                            setDeletingSongId(null);
                          }}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-sm shrink-0"
                          title="Confirmar remo√ß√£o"
                        >
                          <Check size={14} className="sm:w-5 sm:h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingSongId(null);
                          }}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-black/5 dark:bg-white/10 border border-border flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/15 text-text-main active:scale-95 transition-all cursor-pointer shrink-0"
                          title="Cancelar"
                        >
                          <X size={14} className="sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingSongId(song.id);
                        }}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center hover:bg-red-500 hover:text-white active:scale-95 transition-all text-red-500 cursor-pointer shrink-0"
                        title="Remover m√∫sica do culto"
                      >
                        <X size={14} className="sm:w-4.5 sm:h-4.5" />
                      </button>
                    )}
                  </div>
                )}
                {!(showLiturgySongs && isAdmin) && (
                  <>
                    <div className="p-1 sm:p-2 rounded-lg bg-black/5 dark:bg-white/5 text-text-muted group-hover:text-text-main transition-all shrink-0 hidden sm:block">
                      <ChevronRight size={14} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="sm:hidden text-text-muted/40 shrink-0 ml-0.5">
                      <ChevronRight size={12} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredSongs.length === 0 && (
          <div className="text-center py-16 px-4 bg-card border border-border rounded-2xl shadow-xl mt-4 animate-in fade-in duration-300">
            <Music2 size={48} className="mx-auto text-text-muted/40 mb-4 animate-pulse" />
            <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-2">Nenhuma m√∫sica encontrada</h3>
            {showLiturgySongs ? (
              <div className="max-w-md mx-auto">
                <p className="text-xs text-text-main/70 mb-6 font-bold leading-relaxed">
                  Voc√™ est√° visualizando apenas as <span className="text-brand">M√∫sicas do Pr√≥ximo Culto</span>, mas nenhuma m√∫sica foi vinculada √† liturgia ou setlist deste culto ainda.
                </p>
                <button
                  type="button"
                  onClick={() => setShowLiturgySongs(false)}
                  className="px-6 py-3 bg-brand text-brand-text rounded-xl font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand/20 cursor-pointer"
                >
                  Ver Todas as M√∫sicas do Repert√≥rio
                </button>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <p className="text-xs text-text-main/70 font-bold leading-relaxed">
                  {searchTerm || selectedCategory || selectedArtist ? (
                    "Nenhuma m√∫sica do seu repert√≥rio corresponde aos filtros selecionados. Tente limpar os termos digitados."
                  ) : (
                    "Seu banco de dados de m√∫sicas est√° vazio. Clique no bot√£o 'Cadastrar M√∫sica' para adicionar o primeiro louvor!"
                  )}
                </p>
                {(searchTerm || selectedCategory || selectedArtist) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('');
                      setSelectedArtist('');
                    }}
                    className="mt-6 px-5 py-2.5 bg-black/10 dark:bg-white/10 text-text-main border border-border rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Limpar Filtros de Busca
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddingLiturgySong && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-border flex items-center justify-between bg-surface shrink-0">
                <div>
                  <h2 className="text-sm font-black text-text-main uppercase tracking-wider">Adicionar M√∫sica ao Culto</h2>
                  <p className="text-[10px] text-text-muted font-bold mt-0.5 uppercase tracking-wider">Selecione louvores do repert√≥rio para este culto</p>
                </div>
                <button 
                  onClick={() => {
                    setIsAddingLiturgySong(false);
                    setLiturgySongSearch('');
                  }} 
                  className="text-text-muted hover:text-text-main p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X size={20}/>
                </button>
              </div>

              <div className="p-4 border-b border-border bg-black/5 dark:bg-white/5 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-main/60" size={18} />
                  <input
                    type="text"
                    placeholder="Pesquisar por t√≠tulo ou artista..."
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-surface text-text-main placeholder-text-muted text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none transition-all"
                    value={liturgySongSearch}
                    onChange={(e) => setLiturgySongSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {songs
                  .filter(s => {
                    const term = liturgySongSearch.toLowerCase();
                    return s.title.toLowerCase().includes(term) || (s.artist || '').toLowerCase().includes(term);
                  })
                  .map(song => {
                    const isAlreadyAdded = liturgySongIds.includes(song.id);
                    return (
                      <div 
                        key={song.id} 
                        className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <ArtistAvatar artist={song.artist} customImageUrl={song.artistImageUrl} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-text-main text-sm truncate">{song.title}</p>
                            <p className="text-xs text-text-muted font-medium truncate">{song.artist || 'Artista Desconhecido'}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isAlreadyAdded}
                          onClick={() => handleAddSongToLiturgy(song)}
                          className={cn(
                            "px-3 py-1.5 h-8 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all select-none border flex items-center justify-center gap-1 cursor-pointer",
                            isAlreadyAdded 
                              ? "bg-black/10 border-border text-text-muted/60 cursor-not-allowed"
                              : "bg-brand border-brand/25 text-brand-text hover:bg-brand/90 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                          )}
                        >
                          {isAlreadyAdded ? (
                            <>
                              <Check size={12} />
                              <span>Agendada</span>
                            </>
                          ) : (
                            <>
                              <Plus size={12} />
                              <span>Adicionar</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}

                {songs.filter(s => {
                  const term = liturgySongSearch.toLowerCase();
                  return s.title.toLowerCase().includes(term) || (s.artist || '').toLowerCase().includes(term);
                }).length === 0 && (
                  <div className="text-center py-12 text-text-muted">
                    <Music2 size={32} className="mx-auto text-text-muted/40 mb-3 animate-pulse" />
                    <p className="text-xs font-black uppercase tracking-wider">Nenhuma m√∫sica encontrada</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-surface shrink-0">
                <h2 className="text-lg sm:text-xl font-bold text-text-main">Cadastrar M√∫sica</h2>
                <div className="flex items-center gap-2 sm:3">
                  <Button onClick={handleAddSong} variant="primary" className="hidden sm:flex text-[10px] sm:text-xs font-bold py-1 sm:1.5 px-3 sm:4" disabled={isSubmitting}>
                    {isSubmitting ? '...' : 'Salvar'}
                  </Button>
                  <button onClick={closeAddingModal} className="text-text-muted hover:text-text-main p-1"><X size={20}/></button>
                </div>
              </div>
              
              <div className="bg-black/5 dark:bg-white/5 border-b border-border flex px-4 sm:px-6 gap-2 overflow-x-auto shrink-0 min-h-[48px] sm:min-h-[56px] items-center no-scrollbar">
                <ModalTab label="Dados" active={modalTab === 'info'} onClick={() => setModalTab('info')} />
                <ModalTab label="Letra" active={modalTab === 'lyrics'} onClick={() => setModalTab('lyrics')} />
                <ModalTab label="Cifra" active={modalTab === 'chords'} onClick={() => setModalTab('chords')} />
                <ModalTab label="M√≠dia" active={modalTab === 'media'} onClick={() => setModalTab('media')} />
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1 h-[450px] bg-surface">
                {modalTab === 'info' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    
                    {/* Importador Direto do Cifra Club */}
                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 space-y-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                          <Music size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-text-main flex items-center gap-1.5">
                            Importar do Cifra Club
                          </h4>
                          <p className="text-xs text-text-muted">Insira o link exato do Cifra Club para carregar letra e acordes oficiais sem erros.</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                           type="text"
                           placeholder="Cole o link (Ex: https://www.cifraclub.com.br/ministerio-morada/para-que-entre-o-rei/)"
                           value={cifraClubUrl}
                           onChange={(e) => setCifraClubUrl(e.target.value)}
                           disabled={isImportingCifra}
                           className="w-full sm:flex-1 h-20 sm:h-18 px-4 rounded-xl border border-border bg-black/5 dark:bg-white/5 text-text-main placeholder-text-muted focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm sm:text-base font-medium transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleImportFromCifraClub()}
                          disabled={isImportingCifra}
                          className={cn(
                            "w-full sm:w-auto h-11 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all select-none border flex items-center justify-center gap-2 shrink-0",
                            isImportingCifra
                              ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg active:scale-95 border-emerald-500/20 cursor-pointer"
                          )}
                        >
                          {isImportingCifra ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Importando...</span>
                            </>
                          ) : (
                            <>
                              <Download size={16} />
                              <span>Importar Cifra</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {autofillSuccess && (
                      <div className="p-3 bg-emerald-500/15 border border-emerald-500/25 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
                        {autofillSuccess}
                      </div>
                    )}

                    {autofillError && (
                      <div className="p-3 bg-red-500/15 border border-red-500/25 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 animate-in fade-in duration-200">
                        {autofillError}
                      </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-text-main uppercase tracking-widest">T√≠tulo da M√∫sica *</label>
                        <Input 
                          value={newSong.title} 
                          onChange={e => {
                            setNewSong({...newSong, title: e.target.value});
                          }} 
                          placeholder="Ex: Bondade de Deus" 
                          className="h-12 text-lg font-semibold bg-black/5 dark:bg-white/5 border border-border text-text-main" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-text-main uppercase tracking-widest">Artista / Cantor</label>
                        <Input value={newSong.artist} onChange={e => setNewSong({...newSong, artist: e.target.value})} placeholder="Ex: Fernandinho" className="h-12 bg-black/5 dark:bg-white/5 border border-border text-text-main" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-black text-text-main uppercase tracking-widest">Imagem do Artista (Opcional)</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Input 
                          value={newSong.artistImageUrl || ''} 
                          onChange={e => setNewSong({...newSong, artistImageUrl: e.target.value})} 
                          placeholder="Cole o link de uma imagem real do cantor/banda da internet" 
                          className="h-12 bg-black/5 dark:bg-white/5 border border-border text-text-main flex-1" 
                        />
                        <div className="relative flex items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            id="newSongArtistImage"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 800 * 1024) {
                                  alert("A imagem deve ser menor que 800KB para salvar no banco de dados.");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (uploadEvent) => {
                                  const base64 = uploadEvent.target?.result as string;
                                  setNewSong({...newSong, artistImageUrl: base64});
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label 
                            htmlFor="newSongArtistImage"
                            className="h-12 px-5 rounded-lg bg-brand/10 hover:bg-brand/20 border border-brand/20 hover:border-brand/30 text-brand text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all w-full sm:w-auto shrink-0"
                          >
                            <Upload size={16} />
                            Subir Foto
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-text-main uppercase tracking-widest">Categoria Teol√≥gica</label>
                        <select 
                          value={newSong.category} 
                          onChange={e => setNewSong({...newSong, category: e.target.value})}
                          className="w-full h-12 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand bg-black/5 dark:bg-slate-900 text-text-main text-sm transition-all"
                        >
                          <option value="" className="bg-white dark:bg-slate-900 text-zinc-900 dark:text-zinc-100">Selecionar Categoria</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-zinc-900 dark:text-zinc-100">{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-text-main uppercase tracking-widest">BPM</label>
                        <Input type="number" value={newSong.bpm} onChange={e => setNewSong({...newSong, bpm: parseInt(e.target.value) || 80})} className="h-12 w-32 text-xl font-mono bg-black/5 dark:bg-white/5 border border-border text-text-main" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-text-main uppercase tracking-widest">Compasso</label>
                        <select 
                          value={newSong.timeSignature} 
                          onChange={e => setNewSong({...newSong, timeSignature: e.target.value})}
                          className="w-full h-12 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand bg-black/5 dark:bg-slate-900 text-text-main text-sm transition-all"
                        >
                          {['4/4', '3/4', '2/4', '6/8', '5/4', '7/8', '12/8'].map(ts => (
                            <option key={ts} value={ts} className="bg-white dark:bg-slate-900 text-zinc-900 dark:text-zinc-100">{ts}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-text-main uppercase tracking-widest">Tonalidade Original</label>
                        <Input value={newSong.baseKey} onChange={e => setNewSong({...newSong, baseKey: e.target.value})} placeholder="Ex: G, Dm, C#" className="h-12 bg-black/5 dark:bg-white/5 border border-border text-text-main" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-text-main uppercase tracking-widest">Capotraste (Posi√ß√£o no Bra√ßo)</label>
                        <select 
                          value={newSong.capo || ''} 
                          onChange={e => setNewSong({...newSong, capo: e.target.value})} 
                          className="h-12 w-full bg-black/5 dark:bg-white/5 border border-border text-text-main rounded-xl px-3 font-bold text-sm outline-none cursor-pointer"
                        >
                          <option value="" className="bg-surface text-text-main">Sem Capo (Afina√ß√£o Padr√£o)</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(fret => (
                            <option key={fret} value={fret + '¬™ casa'} className="bg-surface text-text-main">
                              Capo na {fret}¬™ Casa
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-text-main uppercase tracking-widest">Link do Youtube (Refer√™ncia)</label>
                        <Input 
                          value={newSong.youtube || ''} 
                          onChange={e => setNewSong({...newSong, youtube: e.target.value})} 
                          placeholder="https://www.youtube.com/watch?v=..." 
                          className="h-12 bg-black/5 dark:bg-white/5 border border-border text-text-main" 
                        />
                      </div>
                    </div>
                    
                    <div className="p-6 bg-brand/10 rounded-2xl border border-brand/20 flex items-center justify-between gap-4 mt-8">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand/20">
                             <Save size={24}/>
                          </div>
                          <div>
                             <p className="font-bold text-text-main">Pr√≥ximo Passo:</p>
                             <p className="text-sm text-text-muted">Adicionar a letra da m√∫sica</p>
                          </div>
                       </div>
                       <Button onClick={() => setModalTab('lyrics')} variant="secondary" className="px-6 h-12 shadow-sm">Continuar <ChevronRight size={18}/></Button>
                    </div>
                  </div>
                )}

                {modalTab === 'lyrics' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Apenas Letra</label>
                      {newSong.chords && (
                        <button
                          type="button"
                          onClick={() => {
                            const extracted = extractLyricsFromChords(newSong.chords || '');
                            if (extracted) {
                              setNewSong(prev => ({ ...prev, lyrics: extracted }));
                            }
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400/40 rounded-lg text-xs font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95 flex items-center gap-1.5"
                          title="Gerar letra limpa automaticamente a partir da cifra"
                        >
                          <Sparkles size={12} /> ‚ú® Extrair da Cifra
                        </button>
                      )}
                    </div>
                    <textarea 
                      className="w-full h-64 border border-border bg-black/5 dark:bg-white/5 rounded-lg p-3 focus:ring-2 focus:ring-brand/20 focus:border-brand text-text-main text-sm leading-relaxed"
                      placeholder="Cole apenas a letra da can√ß√£o aqui..."
                      value={newSong.lyrics}
                      onChange={e => setNewSong({...newSong, lyrics: e.target.value})}
                    />
                    <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-border">
                      <Button onClick={() => setModalTab('info')} variant="ghost" className="text-text-muted transition-colors hover:text-text-main"><ChevronLeft size={18}/> Voltar</Button>
                      <Button onClick={() => setModalTab('chords')} variant="secondary" className="px-6 shadow-sm">Pr√≥ximo: Cifra <ChevronRight size={18}/></Button>
                    </div>
                  </div>
                )}

                {modalTab === 'chords' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Letra com Cifras</label>
                    <textarea 
                      className="w-full h-64 border border-border bg-black/5 dark:bg-white/5 rounded-lg p-3 focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono text-text-main text-sm leading-relaxed"
                      placeholder="Ex:\nC            G\nGrandioso √©s Tu..."
                      value={newSong.chords}
                      onChange={e => setNewSong({...newSong, chords: cleanChordText(e.target.value)})}
                      onBeforeInput={handleNewChordBeforeInput}
                      onKeyDown={handleNewChordKeyDown}
                      spellCheck={false}
                      autoCorrect="off"
                      autoCapitalize="none"
                      autoComplete="off"
                    />
                    <p className="text-[10px] text-text-muted italic">Dica: Mantenha os acordes alinhados acima das palavras.</p>
                    <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-border">
                      <Button onClick={() => setModalTab('lyrics')} variant="ghost" className="text-text-muted transition-colors hover:text-text-main"><ChevronLeft size={18}/> Voltar</Button>
                      <Button onClick={() => setModalTab('media')} variant="secondary" className="px-6 shadow-sm">Pr√≥ximo: M√≠dia <ChevronRight size={18}/></Button>
                    </div>
                  </div>
                )}

                {modalTab === 'media' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-text-main uppercase tracking-widest pl-1">Links e √Åudio</p>
                      
                      {/* Google Drive Link directly */}
                      <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-2">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Link do Google Drive (Guias de √Åudio)</label>
                        <Input 
                          placeholder="Cole o link do Google Drive para os guias de √°udio"
                          value={newSong.driveAudioLink || ''}
                          onChange={e => setNewSong({...newSong, driveAudioLink: e.target.value})}
                          className="h-11 bg-black/5 dark:bg-white/5 border border-border text-text-main"
                        />
                        <p className="text-[9px] text-text-muted italic">Espa√ßo opcional para colocar pasta/link do drive com guias de √°udio.</p>
                      </div>

                      <div className="p-6 border-2 border-dashed border-border rounded-2xl bg-black/5 dark:bg-white/5 space-y-4">
                         <div className="flex flex-col items-center text-center gap-2 mb-2">
                            <Volume2 size={32} className="text-text-muted opacity-30" />
                            <p className="font-bold text-text-main text-sm">Adicionar Guia ou Refer√™ncia</p>
                         </div>
                         <div className="grid gap-3">
                            <Input 
                              placeholder="Nome (ex: Guia Voz, Ensaio...)" 
                              value={tempLink.name}
                              onChange={e => setTempLink({...tempLink, name: e.target.value})}
                              className="h-11"
                            />
                            <div className="flex gap-2">
                              <Input 
                                placeholder="Link/URL do √Åudio" 
                                value={tempLink.url}
                                onChange={e => setTempLink({...tempLink, url: e.target.value})}
                                className="h-11"
                              />
                              <Button onClick={() => addMedia('audio')} disabled={!tempLink.url} className="shrink-0 font-bold px-6">Adicionar Link</Button>
                            </div>

                            <div className="flex items-center gap-2 my-1">
                              <div className="h-px bg-border/60 flex-1" />
                              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">ou envie um arquivo de √°udio (MP3)</span>
                              <div className="h-px bg-border/60 flex-1" />
                            </div>

                            <input 
                              type="file" 
                              id="new-song-audio-file-input" 
                              className="hidden" 
                              accept="audio/*"
                              onChange={handleNewSongAudioFileUpload}
                            />
                            <Button 
                              variant="secondary"
                              onClick={() => document.getElementById('new-song-audio-file-input')?.click()}
                              className="w-full flex items-center justify-center gap-2 h-11 border-dashed border-border text-text-main font-bold hover:bg-black/5 dark:hover:bg-white/10"
                            >
                              <Upload size={16} />
                              <span>Anexar Arquivo MP3 / √Åudio</span>
                            </Button>
                         </div>
                      </div>
                      <div className="grid gap-2">
                         {newSong.audio.map((a, i) => (
                           <div key={i} className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 border border-border rounded-xl text-sm shadow-sm">
                              <div className="flex items-center gap-3 truncate">
                                 <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                                    <Volume2 size={18}/>
                                 </div>
                                 <p className="font-bold text-text-main truncate">{a.name}</p>
                              </div>
                              <button onClick={() => setNewSong({...newSong, audio: newSong.audio.filter((_, idx) => idx !== i)})} className="p-2 text-red-500 hover:text-red-600 transition-colors"><X size={18}/></button>
                           </div>
                         ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-text-main uppercase tracking-widest pl-1">Arquivos e Documentos</p>

                      {/* Google Drive Link directly */}
                      <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl space-y-2">
                        <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block">Link do Google Drive (Partituras/Arquivos)</label>
                        <Input 
                          placeholder="Cole o link do Google Drive para partituras/arquivos"
                          value={newSong.driveFilesLink || ''}
                          onChange={e => setNewSong({...newSong, driveFilesLink: e.target.value})}
                          className="h-11 bg-black/5 dark:bg-white/5 border border-border text-text-main"
                        />
                        <p className="text-[9px] text-text-muted italic">Espa√ßo opcional para colocar pasta/link do drive com partituras ou outros arquivos.</p>
                      </div>

                      <div className="p-6 border-2 border-dashed border-border rounded-2xl bg-black/5 dark:bg-white/5 space-y-4">
                         <div className="flex flex-col items-center text-center gap-2 mb-2">
                            <FileText size={32} className="text-text-muted opacity-30" />
                            <p className="font-bold text-text-main text-sm">Anexar Documento (PDF/PNG)</p>
                         </div>
                         <div className="grid gap-3">
                            <Input 
                              placeholder="Nome do arquivo" 
                              value={tempLink.name}
                              onChange={e => setTempLink({...tempLink, name: e.target.value})}
                              className="h-11"
                            />
                            <div className="flex gap-2">
                              <Input 
                                placeholder="Link do arquivo" 
                                value={tempLink.url}
                                onChange={e => setTempLink({...tempLink, url: e.target.value})}
                                className="h-11"
                              />
                              <Button onClick={() => addMedia('files')} disabled={!tempLink.url} className="shrink-0 font-bold px-6">Adicionar</Button>
                            </div>
                         </div>
                      </div>
                      <div className="grid gap-2">
                         {newSong.files.map((f, i) => (
                           <div key={i} className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 border border-border rounded-xl text-sm shadow-sm">
                              <div className="flex items-center gap-3 truncate">
                                 <div className="w-10 h-10 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center text-text-main">
                                    <FileText size={18}/>
                                 </div>
                                 <p className="font-bold text-text-main truncate">{f.name}</p>
                              </div>
                              <button onClick={() => setNewSong({...newSong, files: newSong.files.filter((_, idx) => idx !== i)})} className="p-2 text-red-500 hover:text-red-600 transition-colors"><X size={18}/></button>
                           </div>
                         ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-6 border-t flex flex-col sm:flex-row gap-3 bg-surface border-border shadow-2xl shrink-0 z-10">
                <Button onClick={closeAddingModal} variant="ghost" className="flex-1 font-bold order-2 sm:order-1 h-12 text-text-muted" disabled={isSubmitting}>Cancelar</Button>
                <Button onClick={handleAddSong} className="flex-[2] h-12 shadow-xl shadow-brand/20 font-black uppercase tracking-widest order-1 sm:order-2 bg-brand hover:bg-blue-700 text-white" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar e Finalizar'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ModalTab({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-2 sm:4 py-3 sm:4 text-[9px] sm:text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap",
        active ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-main"
      )}
    >
      {label}
    </button>
  );
}

export function SongDetailView({ 
  song, 
  onBack,
  theme,
  liturgySongs = [],
  allSongs = [],
  onSelectSong,
  activeLiturgyService,
  onFocusModeChange,
  initialFocusMode = false
}: { 
  song: any, 
  onBack: () => void,
  theme: 'dark' | 'light',
  liturgySongs?: any[],
  allSongs?: any[],
  onSelectSong?: (song: any) => void,
  activeLiturgyService?: any,
  onFocusModeChange?: (active: boolean) => void,
  initialFocusMode?: boolean
}) {
  const { user, isAdmin, memberData } = useAuth();

  const handleToggleFavorite = async () => {
    if (!user) return;
    const memberRef = doc(db, 'members', user.uid);
    const currentFavorites = [...(memberData?.favoriteSongs || [])];
    let updatedFavorites: string[];
    if (currentFavorites.includes(song.id)) {
      updatedFavorites = currentFavorites.filter(id => id !== song.id);
    } else {
      updatedFavorites = [...currentFavorites, song.id];
    }
    try {
      await setDoc(memberRef, { favoriteSongs: updatedFavorites }, { merge: true });
    } catch (error) {
      console.error("Erro ao atualizar m√∫sicas favoritas:", error);
      handleFirestoreError(error, OperationType.WRITE, `members/${user.uid}`);
    }
  };

  const effectiveSongList = useMemo(() => {
    if (liturgySongs && liturgySongs.length > 1) return liturgySongs;
    if (allSongs && allSongs.length > 1) return allSongs;
    return liturgySongs || [];
  }, [liturgySongs, allSongs]);

  const isFromLiturgy = Boolean(liturgySongs && liturgySongs.length > 1);

  const songIndexInList = useMemo(() => {
    if (!effectiveSongList || effectiveSongList.length === 0) return -1;
    return effectiveSongList.findIndex((s: any) => s.id === song.id);
  }, [effectiveSongList, song.id]);

  const hasNextSong = songIndexInList !== -1 && songIndexInList + 1 < effectiveSongList.length;
  const hasPrevSong = songIndexInList !== -1 && songIndexInList - 1 >= 0;
  
  const nextSong = hasNextSong ? effectiveSongList[songIndexInList + 1] : null;
  const prevSong = hasPrevSong ? effectiveSongList[songIndexInList - 1] : null;

  const handleSongSwitch = useCallback((targetSong: any) => {
    if (onSelectSong && targetSong) {
      onSelectSong(targetSong);
      // Scroll back to top smoothly
      setTimeout(() => {
        const container = document.getElementById('song-scroll-container');
        if (container) {
          container.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 80);
    }
  }, [onSelectSong]);

  // Gestos de Deslize (Swipe) para avan√ßar/voltar cifras no Modo Foco
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleFocusTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  };

  const handleFocusTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touchEnd = e.changedTouches[0];
    const deltaX = touchEnd.clientX - touchStartRef.current.x;
    const deltaY = touchEnd.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Reconhecer deslize horizontal n√≠tido:
    // - Deslocamento horizontal m√≠nimo de 50px
    // - Movimento predominantemente horizontal (deltaX > 1.4x deltaY para n√£o conflitar com rolagem vertical)
    // - Conclu√≠do em menos de 800ms
    if (Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4 && deltaTime < 800) {
      if (deltaX < 0) {
        // Deslizar para a Esquerda -> Avan√ßar para a Pr√≥xima M√∫sica
        if (hasNextSong && nextSong) {
          handleSongSwitch(nextSong);
        }
      } else {
        // Deslizar para a Direita -> Voltar para a M√∫sica Anterior
        if (hasPrevSong && prevSong) {
          handleSongSwitch(prevSong);
        }
      }
    }
  };

  const renderLiturgyNavigation = () => {
    if (!effectiveSongList || effectiveSongList.length <= 1 || songIndexInList === -1) return null;

    const currentNum = songIndexInList + 1;
    const totalNum = effectiveSongList.length;

    return (
      <div className="mt-10 pt-6 border-t border-dashed border-border/40 select-none notranslate" translate="no">
        <div className={cn("rounded-xl p-3.5 border space-y-3 transition-all", isStageMode ? "bg-zinc-950 border-amber-500/40 text-white shadow-lg shadow-black/50" : "bg-gradient-to-br from-brand/5 to-cyan-500/5 dark:from-white/0.5 dark:to-white/0 border-border/40")}>
          <div className="flex items-center justify-between gap-2 flex-wrap text-text-muted">
            <span className={cn("text-[9px] font-black uppercase tracking-widest flex items-center gap-1", isStageMode ? "text-amber-400" : "text-text-muted")}>
              <Zap size={10} className="text-yellow-500 animate-pulse" /> {isFromLiturgy ? "Roteiro do Culto" : "Repert√≥rio"}
            </span>
            <span className={cn("font-mono text-[9px] font-black uppercase px-1.5 py-0.5 rounded", isStageMode ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-black/10 dark:bg-white/10 text-text-main dark:text-zinc-200")}>
              M√∫sica {currentNum} de {totalNum}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
            {/* Bot√£o Anterior */}
            {hasPrevSong && prevSong ? (
               <button
                 type="button"
                 onClick={() => handleSongSwitch(prevSong)}
                 className={cn("group flex items-center justify-start text-left gap-2.5 py-1.5 px-3 rounded-xl border transition-all active:scale-95 cursor-pointer w-full", isStageMode ? "border-zinc-800 bg-zinc-900/90 text-white hover:bg-zinc-800 opacity-90 hover:opacity-100" : "border-border/20 bg-card/40 opacity-55 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5")}
               >
                 <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors", isStageMode ? "bg-zinc-800 text-zinc-300 group-hover:text-white" : "bg-black/5 dark:bg-white/5 text-text-muted/70 group-hover:text-text-muted")}>
                   <ChevronLeft size={14} strokeWidth={2.5} />
                 </div>
                 <div className="min-w-0 flex-1">
                   <span className={cn("block text-[10px] font-black uppercase tracking-widest leading-none mb-0.5", isStageMode ? "text-zinc-400" : "text-text-muted/60")}>Anterior</span>
                   <p className={cn("text-xs font-medium truncate", isStageMode ? "text-zinc-100" : "text-text-muted")}>{prevSong.title}</p>
                 </div>
               </button>
            ) : (
               <div className="hidden sm:block" />
            )}

            {/* Bot√£o Pr√≥ximo */}
            {hasNextSong && nextSong && (
               <button
                 type="button"
                 onClick={() => handleSongSwitch(nextSong)}
                 className="group flex items-center justify-end text-right gap-2.5 py-1.5 px-3 rounded-xl border border-brand/10 bg-gradient-to-r from-brand to-cyan-500 hover:brightness-110 text-white font-black transition-all active:scale-95 cursor-pointer w-full sm:col-start-2 shadow-lg shadow-brand/15"
               >
                 <div className="min-w-0 text-right flex-1 select-none">
                   <span className="block text-[11px] font-black text-white/80 uppercase tracking-widest leading-none mb-0.5">Pr√≥xima</span>
                   <p className="text-xs sm:text-sm font-black text-white truncate">
                     {nextSong.title}
                   </p>
                 </div>
                 <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 text-white group-hover:scale-105 transition-all">
                   <ChevronRight size={14} strokeWidth={3} />
                 </div>
               </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  const formatCapoText = (capo: string | undefined | null) => {
    if (!capo) return '';
    // Remove variations of "Capotraste na", "Capotraste no", "Capo na", "Capo no", "Capotraste", "Capo"
    let clean = capo.replace(/^(capotraste\s+na\s+|capotraste\s+no\s+|capo\s+na\s+|capo\s+no\s+|capotraste\s+|capo\s+|capotraste\s*:\s*|capo\s*:\s*)/i, '').trim();
    // Capitalize first letter
    if (clean) {
      clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return clean || capo;
  };

  const [transpose, setTranspose] = useState(0);
  const [isCapoEnabled, setIsCapoEnabled] = useState(true);
  const [selectedCapoFret, setSelectedCapoFret] = useState<number | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(initialFocusMode);

  useEffect(() => {
    if (onFocusModeChange) {
      onFocusModeChange(isFocusMode);
    }
    return () => {
      if (onFocusModeChange) {
        onFocusModeChange(false);
      }
    };
  }, [isFocusMode, onFocusModeChange]);
  const [isEditing, setIsEditing] = useState(false);
  const [isAnalyzingBible, setIsAnalyzingBible] = useState(false);
  const [isBibleExpanded, setIsBibleExpanded] = useState(false);
  const [bibleAnalysisError, setBibleAnalysisError] = useState<string | null>(null);

  const [isAnalyzingThemeSuggestions, setIsAnalyzingThemeSuggestions] = useState(false);
  const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(false);
  const [themeSuggestionsError, setThemeSuggestionsError] = useState<string | null>(null);

  const handleAnalyzeBible = async () => {
    setIsAnalyzingBible(true);
    setIsBibleExpanded(true);
    setBibleAnalysisError(null);
    try {
      const response = await fetch("/api/analyze-bible-references", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editedSong.title,
          content: editedSong.lyrics || editedSong.chords || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro desconhecido na an√°lise.");
      }

      const data = await response.json();
      
      // Save it automatically to Firestore
      await updateDoc(doc(db, 'songs', song.id), {
        bibleReferences: data
      });
      
    } catch (err: any) {
      console.error("Error analyzing bible references:", err);
      setBibleAnalysisError(err.message || "Erro ao gerar an√°lise b√≠blica.");
    } finally {
      setIsAnalyzingBible(false);
    }
  };

  const handleGetThemeSuggestions = async () => {
    setIsAnalyzingThemeSuggestions(true);
    setIsSuggestionsExpanded(true);
    setThemeSuggestionsError(null);
    try {
      const response = await fetch("/api/songs/theme-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editedSong.title,
          content: editedSong.lyrics || editedSong.chords || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro desconhecido ao obter sugest√µes.");
      }

      const data = await response.json();
      
      // Save it automatically to Firestore
      await updateDoc(doc(db, 'songs', song.id), {
        themeSuggestions: data
      });
      
    } catch (err: any) {
      console.error("Error generating theme suggestions:", err);
      setThemeSuggestionsError(err.message || "Erro ao gerar sugest√µes de tema.");
    } finally {
      setIsAnalyzingThemeSuggestions(false);
    }
  };

  const [isAnalyzingHarmony, setIsAnalyzingHarmony] = useState(false);
  const [isHarmonyExpanded, setIsHarmonyExpanded] = useState(false);
  const [harmonyAnalysisError, setHarmonyAnalysisError] = useState<string | null>(null);

  const handleAnalyzeHarmony = async () => {
    setIsAnalyzingHarmony(true);
    setIsHarmonyExpanded(true);
    setHarmonyAnalysisError(null);
    try {
      const response = await fetch("/api/songs/analyze-harmony", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editedSong.title,
          content: editedSong.lyrics || editedSong.chords || "",
          baseKey: editedSong.baseKey || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro desconhecido na an√°lise harm√¥nica.");
      }

      const data = await response.json();
      
      // Save it automatically to Firestore
      await updateDoc(doc(db, 'songs', song.id), {
        harmonyAnalysis: data
      });
      
    } catch (err: any) {
      console.error("Error analyzing harmony:", err);
      setHarmonyAnalysisError(err.message || "Erro ao gerar an√°lise harm√¥nica.");
    } finally {
      setIsAnalyzingHarmony(false);
    }
  };

  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillSuccess, setAutofillSuccess] = useState<string | null>(null);
  const [autofillError, setAutofillError] = useState<string | null>(null);
  const [editCifraClubUrl, setEditCifraClubUrl] = useState('');
  const [isImportingCifra, setIsImportingCifra] = useState(false);

  const handleImportFromCifraClub = async () => {
    if (!editCifraClubUrl) {
      setAutofillError("Por favor, cole um link v√°lido do Cifra Club primeiro.");
      return;
    }

    const trimmedUrl = editCifraClubUrl.trim();
    if (!trimmedUrl.toLowerCase().includes("cifraclub.com.br")) {
      setAutofillError("O link deve pertencer ao site cifraclub.com.br.");
      return;
    }

    setIsImportingCifra(true);
    setAutofillSuccess(null);
    setAutofillError(null);

    try {
      const response = await fetch("/api/songs/import-cifraclub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || "N√£o foi poss√≠vel importar a cifra do Cifra Club.");
      }

      const data = await response.json();
      setEditedSong(prev => ({
        ...prev,
        title: data.title || prev.title,
        artist: data.artist || prev.artist,
        artistImageUrl: data.artistImageUrl || prev.artistImageUrl || '',
        baseKey: data.key || prev.baseKey,
        bpm: data.bpm || prev.bpm,
        timeSignature: data.timeSignature || prev.timeSignature,
        chords: data.chords || prev.chords,
        lyrics: data.lyrics || prev.lyrics,
        capo: data.capo || prev.capo || ""
      }));
      setEditCifraClubUrl('');
      setAutofillSuccess(`M√∫sica "${data.title}" importada e preenchida com sucesso direto do Cifra Club! Abas de cifra e letra tamb√©m atualizadas.`);
    } catch (error: any) {
      console.error("Erro ao importar do Cifra Club:", error);
      setAutofillError(error.message || "Erro de conex√£o ao realizar a importa√ß√£o direta do Cifra Club. Verifique o link e tente novamente.");
    } finally {
      setIsImportingCifra(false);
    }
  };

  const [editedSong, setEditedSong] = useState(() => {
    const initialBpm = Number(song?.bpm);
    const safeBpm = !isNaN(initialBpm) && initialBpm > 0 ? initialBpm : 80;
    const initialChords = song?.chords || (song as any)?.cifra || (song as any)?.content || '';
    const initialLyrics = song?.lyrics || '';
    return {
      ...song,
      bpm: safeBpm,
      audio: song.audio || [],
      files: song.files || [],
      chords: initialChords,
      lyrics: initialLyrics,
      baseKey: song.baseKey || detectKey(initialChords) || '',
      driveAudioLink: song.driveAudioLink || '',
      driveFilesLink: song.driveFilesLink || '',
      capo: song.capo || ''
    };
  });
  const [referenceBpm, setReferenceBpm] = useState<number>(() => {
    const initialBpm = Number(song?.bpm);
    return !isNaN(initialBpm) && initialBpm > 0 ? initialBpm : 80;
  });

  // Initialize complete states when song ID changes
  useEffect(() => {
    const val = Number(song?.bpm);
    const parsedBpm = !isNaN(val) && val > 0 ? val : 80;
    const chordsData = song?.chords || (song as any)?.cifra || (song as any)?.content || '';
    const lyricsData = song?.lyrics || '';
    setReferenceBpm(parsedBpm);
    setEditedSong({
      ...song,
      bpm: parsedBpm,
      audio: song.audio || [],
      files: song.files || [],
      chords: chordsData,
      lyrics: lyricsData,
      baseKey: song.baseKey || detectKey(chordsData) || '',
      driveAudioLink: song.driveAudioLink || '',
      driveFilesLink: song.driveFilesLink || '',
      capo: song.capo || ''
    });
    setTranspose(0);
    setIsCapoEnabled(true);
    setSelectedCapoFret(null);
    setIsEditing(false); // Sair do modo edi√ß√£o ao trocar de m√∫sica
  }, [song.id]); 

  // Real-time synchronization with Firestore for this specific song
  useEffect(() => {
    if (!user) return;
    if (!song?.id) return;
    const songPath = 'songs';
    const songRef = doc(db, songPath, song.id);
    return onSnapshot(songRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as any;
        
        // Only update editedSong if not currently editing to avoid overwriting user input
        if (!isEditing) {
          const chordsData = data.chords || data.cifra || data.content || '';
          const lyricsData = data.lyrics || '';
          setEditedSong({
            ...data,
            audio: data.audio || [],
            files: data.files || [],
            chords: chordsData,
            lyrics: lyricsData,
            baseKey: data.baseKey || detectKey(chordsData) || '',
            driveAudioLink: data.driveAudioLink || '',
            driveFilesLink: data.driveFilesLink || '',
            capo: data.capo || ''
          });
          
          const newBpm = Number(data.bpm);
          if (!isNaN(newBpm) && newBpm > 0 && newBpm !== referenceBpm) {
            setReferenceBpm(newBpm);
            setEditedSong(prev => ({ ...prev, bpm: newBpm }));
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `${songPath}/${song.id}`);
    });
  }, [song.id, isEditing, user]);
  const [detailTab, setDetailTab] = useState<'lyrics' | 'chords' | 'media' | 'bpm'>('chords');
  const [showKeyMenu, setShowKeyMenu] = useState(false);
  const [showCapoMenu, setShowCapoMenu] = useState(false);
  const [harmonicDisplayMode, setHarmonicDisplayMode] = useState<HarmonicDisplayMode>('chords');
  const [showHarmonicMenu, setShowHarmonicMenu] = useState(false);
  const [showHarmonicGuideModal, setShowHarmonicGuideModal] = useState(false);
  const [showDynamicsGuideModal, setShowDynamicsGuideModal] = useState(false);
  const [showFootswitchModal, setShowFootswitchModal] = useState(false);
  const [showTunerModal, setShowTunerModal] = useState(false);
  const [showMetronomeModal, setShowMetronomeModal] = useState(false);
  const [showTimeSignatureMenu, setShowTimeSignatureMenu] = useState(false);
  const [customTimeSigInput, setCustomTimeSigInput] = useState('');
  const [savingTimeSig, setSavingTimeSig] = useState(false);
  const [timeSigFeedback, setTimeSigFeedback] = useState<string | null>(null);
  const [showBpmMenu, setShowBpmMenu] = useState(false);
  const [savingBpm, setSavingBpm] = useState(false);
  const [bpmFeedback, setBpmFeedback] = useState<string | null>(null);
  const [footswitchConfig, setFootswitchConfig] = useState<FootswitchConfig>(() => {
    try {
      const saved = localStorage.getItem('lilo-footswitch-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const mergedMappings: any = { ...MVAVE_CHOCOLATE_DEFAULT_MAPPINGS };
        if (parsed.mappings) {
          for (const k of Object.keys(MVAVE_CHOCOLATE_DEFAULT_MAPPINGS)) {
            const defaultArr = (MVAVE_CHOCOLATE_DEFAULT_MAPPINGS as any)[k] || [];
            const savedArr = Array.isArray(parsed.mappings[k]) ? parsed.mappings[k] : [];
            mergedMappings[k] = Array.from(new Set([...defaultArr, ...savedArr]));
          }
        }
        return {
          ...parsed,
          enabled: parsed.enabled ?? true,
          preset: parsed.preset || 'mvave_chocolate',
          mappings: mergedMappings
        };
      }
    } catch (e) {}
    return {
      enabled: true,
      preset: 'mvave_chocolate',
      autoNextSongAtBottom: true,
      mappings: MVAVE_CHOCOLATE_DEFAULT_MAPPINGS
    };
  });
  const [footswitchToast, setFootswitchToast] = useState<string | null>(null);

  // Visual Feedback for M-Vave Chocolate Pedal in chord screen (blinks the header button)
  const [activePedalButton, setActivePedalButton] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const pedalAnimTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerPedalVisualFeedback = useCallback((button: 'A' | 'B' | 'C' | 'D', _label?: string) => {
    setActivePedalButton(button);
    if (pedalAnimTimeoutRef.current) {
      clearTimeout(pedalAnimTimeoutRef.current);
    }
    pedalAnimTimeoutRef.current = setTimeout(() => {
      setActivePedalButton(null);
    }, 1400);
  }, []);

  const triggerFootswitchToast = useCallback((msg: string) => {
    setFootswitchToast(msg);
    setTimeout(() => setFootswitchToast(null), 2400);
  }, []);
  const [activeDynamicExplanation, setActiveDynamicExplanation] = useState<DynamicExplanation | null>(null);

  useEffect(() => {
    const handleShowDynamicExplanation = (e: CustomEvent) => {
      if (e.detail?.text) {
        const details = getDynamicExplanationDetails(e.detail.text);
        setActiveDynamicExplanation(details);
      }
    };
    const handleShowDynamicsGuide = () => {
      setShowDynamicsGuideModal(true);
    };
    window.addEventListener('liloupro-show-dynamic-popover' as any, handleShowDynamicExplanation as any);
    window.addEventListener('liloupro-show-dynamics-guide-modal' as any, handleShowDynamicsGuide as any);
    return () => {
      window.removeEventListener('liloupro-show-dynamic-popover' as any, handleShowDynamicExplanation as any);
      window.removeEventListener('liloupro-show-dynamics-guide-modal' as any, handleShowDynamicsGuide as any);
    };
  }, []);
  const [showChordDict, setShowChordDict] = useState(false);
  const [activeChordInDict, setActiveChordInDictRaw] = useState<string | undefined>(undefined);
  const [popoverChord, setPopoverChord] = useState<string | null>(null);

  const getCapoSemitones = (capoStr: string | undefined | null): number => {
    return getCapoSemitonesFromText(capoStr);
  };

  const originalCapoSemitones = useMemo(() => {
    return getCapoSemitonesFromText(editedSong.capo);
  }, [editedSong.capo]);

  const activeCapoFret = useMemo(() => {
    if (!isCapoEnabled) return 0;
    if (selectedCapoFret !== null) return selectedCapoFret;
    return originalCapoSemitones;
  }, [isCapoEnabled, selectedCapoFret, originalCapoSemitones]);

  const capoSemitones = activeCapoFret;

  const effectiveBaseKey = useMemo(() => {
    return editedSong.baseKey || detectKey(editedSong.chords || '') || 'C';
  }, [editedSong.baseKey, editedSong.chords]);

  const dbChordsAreInCapoShape = useMemo(() => {
    if (!editedSong.chords || originalCapoSemitones === 0) return false;
    return areChordsInCapoShape(editedSong.chords, effectiveBaseKey, originalCapoSemitones);
  }, [editedSong.chords, effectiveBaseKey, originalCapoSemitones]);

  const netTranspose = useMemo(() => {
    if (dbChordsAreInCapoShape) {
      return transpose + (originalCapoSemitones - activeCapoFret);
    } else {
      return transpose - activeCapoFret;
    }
  }, [dbChordsAreInCapoShape, transpose, originalCapoSemitones, activeCapoFret]);

  const currentKey = useMemo(() => {
    if (transpose === 0) return effectiveBaseKey;
    return transposeChord(effectiveBaseKey, transpose);
  }, [effectiveBaseKey, transpose]);

  const shapeKey = useMemo(() => {
    if (!currentKey) return '';
    if (activeCapoFret === 0) return currentKey;
    return transposeChord(currentKey, -activeCapoFret);
  }, [currentKey, activeCapoFret]);

  const setActiveChordInDict = useCallback((chord: string, openPopover = true) => {
    if (!chord) {
      setActiveChordInDictRaw(undefined);
      setPopoverChord(null);
      return;
    }
    const clean = getCleanChordName(chord);
    const keyToUse = currentKey || detectKey(editedSong.chords || '') || 'C';
    const realChord = convertHarmonicToChordName(clean, keyToUse);
    setActiveChordInDictRaw(realChord);
    if (openPopover) {
      setPopoverChord(realChord);
    }
  }, [currentKey, editedSong.chords]);

  const effectiveLyrics = useMemo(() => {
    return getEffectiveLyrics(editedSong.lyrics, editedSong.chords);
  }, [editedSong.lyrics, editedSong.chords]);

  const displayedContent = useMemo(() => {
    if (detailTab === 'lyrics') {
      return effectiveLyrics;
    }
    const transposedText = netTranspose === 0 
      ? (editedSong.chords || '') 
      : transposeLyricsAndChords(editedSong.chords || '', netTranspose);

    if (harmonicDisplayMode !== 'chords') {
      return convertLyricsAndChordsToHarmonicMode(transposedText, currentKey, harmonicDisplayMode);
    }
    return transposedText;
  }, [detailTab, effectiveLyrics, editedSong.chords, netTranspose, harmonicDisplayMode, currentKey]);

  const availableChordsInSong = useMemo(() => {
    const rawChords = detailTab === 'lyrics' 
      ? (editedSong.chords || '') 
      : (netTranspose === 0 ? (editedSong.chords || '') : transposeLyricsAndChords(editedSong.chords || '', netTranspose));
    if (!rawChords) return [];
    const matches: string[] = [];
    const lines = rawChords.split(/\r?\n/);
    lines.forEach(line => {
      if (isChordLine(line)) {
        const words = line.replace(/<\/?[biu]>/g, '').trim().split(/\s+/);
        words.forEach(w => {
          if (isChordWord(w) && !isAnnotationOrHeaderWord(w)) {
            const clean = getCleanChordName(w);
            if (clean && !isAnnotationOrHeaderWord(clean)) {
              matches.push(clean);
            }
          }
        });
      }
    });
    return Array.from(new Set(matches)).sort();
  }, [editedSong.chords, netTranspose, detailTab]);

  const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLATS: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };

  const handleKeySelect = async (targetNote: string) => {
    const effectiveBaseKey = editedSong.baseKey || detectKey(editedSong.chords || '') || 'C';
    
    const getBase = (k: string) => k.match(/^([A-G][#b]?)/)?.[1] || '';
    const baseNote = getBase(effectiveBaseKey);
    
    const baseNormalized = FLATS[baseNote] || baseNote;
    const targetNormalized = FLATS[targetNote] || targetNote;
    
    const baseIdx = ALL_NOTES.indexOf(baseNormalized);
    const targetIdx = ALL_NOTES.indexOf(targetNormalized);
    
    if (baseIdx === -1 || targetIdx === -1) return;
    
    setTranspose(targetIdx - baseIdx);
    setShowKeyMenu(false);

    if (!editedSong.baseKey && song?.id && user) {
      try {
        await updateDoc(doc(db, 'songs', song.id), { baseKey: effectiveBaseKey });
        setEditedSong(prev => ({ ...prev, baseKey: effectiveBaseKey }));
      } catch (e) {
        console.error('Erro ao salvar baseKey original detectada:', e);
      }
    }
  };

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPracticePlayer, setShowPracticePlayer] = useState(false);
  const [isPracticePlayerMinimized, setIsPracticePlayerMinimized] = useState(false);
  const [tempLink, setTempLink] = useState({ name: '', url: '' });
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [isAnalyzingAudioBpm, setIsAnalyzingAudioBpm] = useState(false);
  const [detectedBpmMsg, setDetectedBpmMsg] = useState<{ bpm: number; name: string } | null>(null);
  const [taps, setTaps] = useState<number[]>([]);
  const [songFontSize, setSongFontSize] = useState<number>(initialFocusMode ? 18 : 14); 
  const [numColumns, setNumColumns] = useState<number>(1);
  const [hasManuallyToggledColumns, setHasManuallyToggledColumns] = useState(false);
  const [isStageMode, setIsStageMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('liloupro_stage_mode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleStageMode = () => {
    setIsStageMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('liloupro_stage_mode', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Auto-detect device type (Tablet/iPad or Laptop/Notebook) on load or resize
  useEffect(() => {
    const handleDeviceDetection = () => {
      if (hasManuallyToggledColumns) return;
      // 1024px is standard landscape tablet and notebook breakpoint
      const isTabletOrLaptop = window.innerWidth >= 1024;
      setNumColumns(isTabletOrLaptop ? 2 : 1);
    };

    handleDeviceDetection();
    window.addEventListener('resize', handleDeviceDetection);
    return () => window.removeEventListener('resize', handleDeviceDetection);
  }, [hasManuallyToggledColumns]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const chordsTextareaRef = useRef<HTMLTextAreaElement>(null);
  const lyricsTextareaRef = useRef<HTMLTextAreaElement>(null);

  const cleanChordText = (text: string): string => {
    if (!text) return '';
    return text
      // Replace space followed by dot and optional space with spaces
      .replace(/\s\.\s?/g, '  ')
      // Replace capital chord note (A-G) followed by dot and space with chord + two spaces
      .replace(/([A-G][#b\/\(\)]*(?:m|maj|min|dim|aug|sus|add|[0-9])?)\.\s/g, '$1  ')
      // Replace capital chord note (A-G) followed by dot with chord + space
      .replace(/([A-G][#b\/\(\)]*(?:m|maj|min|dim|aug|sus|add|[0-9])?)\./g, '$1 ');
  };

  const handleChordBeforeInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    const data = nativeEvent?.data;

    // Intercept OS smart punctuation (double space -> period)
    if (data === '.' || data === '. ' || data === '.\n') {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const val = textarea.value;

      if (start > 0) {
        const charBefore = val[start - 1];
        if (charBefore === ' ' || data === '. ' || /[A-G]/.test(charBefore)) {
          e.preventDefault();
          const end = textarea.selectionEnd;
          const spacesToInsert = charBefore === ' ' ? ' ' : '  ';
          const newVal = val.substring(0, start) + spacesToInsert + val.substring(end);
          const newPos = start + spacesToInsert.length;

          const target = textarea;
          setEditedSong(prev => ({ ...prev, chords: newVal }));
          requestAnimationFrame(() => {
            try {
              target.selectionStart = target.selectionEnd = newPos;
            } catch (err) {}
          });
        }
      }
    }
  };

  const handleChordKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === ' ') {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const val = textarea.value;

      // Prevent OS double-space shortcut from replacing space space with . space
      if (start > 0 && val[start - 1] === ' ') {
        e.preventDefault();
        const end = textarea.selectionEnd;
        const newVal = val.substring(0, start) + ' ' + val.substring(end);
        const newPos = start + 1;
        const target = textarea;
        setEditedSong(prev => ({ ...prev, chords: newVal }));
        requestAnimationFrame(() => {
          try {
            target.selectionStart = target.selectionEnd = newPos;
          } catch (err) {}
        });
      }
    }
  };

  const handleInsertFormat = (type: 'bold' | 'italic' | 'underline' | 'brackets' | 'braces', target: 'chords' | 'lyrics' = 'chords') => {
    const textarea = target === 'chords' ? chordsTextareaRef.current : lyricsTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = target === 'chords' ? (editedSong.chords || '') : (editedSong.lyrics || '');
    const selectedText = text.substring(start, end);

    let prefix = '';
    let suffix = '';

    switch (type) {
      case 'bold':
        prefix = '<b>';
        suffix = '</b>';
        break;
      case 'italic':
        prefix = '<i>';
        suffix = '</i>';
        break;
      case 'underline':
        prefix = '<u>';
        suffix = '</u>';
        break;
      case 'brackets':
        prefix = '[';
        suffix = ']';
        break;
      case 'braces':
        prefix = '{';
        suffix = '}';
        break;
      default:
        break;
    }

    const replacement = prefix + selectedText + suffix;
    const newText = text.substring(0, start) + replacement + text.substring(end);

    if (target === 'chords') {
      setEditedSong({ ...editedSong, chords: newText });
    } else {
      setEditedSong({ ...editedSong, lyrics: newText });
    }

    // Focus back and restore select
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        if (selectedText.length > 0) {
          textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
        } else {
          textarea.setSelectionRange(start + prefix.length, start + prefix.length);
        }
      }
    }, 50);
  };

  const SECTIONS_FOR_QUICK_INSERT = [
    { label: 'Intro', tag: 'Intro' },
    { label: 'Primeira Parte', tag: 'Primeira Parte' },
    { label: 'Segunda Parte', tag: 'Segunda Parte' },
    { label: 'Verso 1', tag: 'Verso 1' },
    { label: 'Verso 2', tag: 'Verso 2' },
    { label: 'Verso 3', tag: 'Verso 3' },
    { label: 'Verso 4', tag: 'Verso 4' },
    { label: 'Verso 5', tag: 'Verso 5' },
    { label: 'Pr√©-Refr√£o', tag: 'Pr√©-Refr√£o' },
    { label: 'Refr√£o', tag: 'Refr√£o' },
    { label: 'Ponte', tag: 'Ponte' },
    { label: 'Solo', tag: 'Solo' },
    { label: 'Instrumental', tag: 'Instrumental' },
    { label: 'Ministra√ß√£o', tag: 'Ministra√ß√£o' },
    { label: 'Final', tag: 'Final' },
  ];

  const handleInsertSectionTag = (sectionTitle: string, target: 'chords' | 'lyrics' = 'chords') => {
    const textarea = target === 'chords' ? chordsTextareaRef.current : lyricsTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = (target === 'chords' ? editedSong.chords : editedSong.lyrics) || '';
    
    const charBefore = start > 0 ? text[start - 1] : '';
    const charAfter = end < text.length ? text[end] : '';

    const needsLeadingNewline = charBefore !== '' && charBefore !== '\n';
    const needsTrailingSpaceOrNewline = charAfter !== '' && charAfter !== '\n' && charAfter !== ' ';

    const insertion = `${needsLeadingNewline ? '\n' : ''}[${sectionTitle}]${needsTrailingSpaceOrNewline ? '\n' : ' '}`;
    const newText = text.substring(0, start) + insertion + text.substring(end);

    if (target === 'chords') {
      setEditedSong(prev => ({ ...prev, chords: newText }));
    } else {
      setEditedSong(prev => ({ ...prev, lyrics: newText }));
    }

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(start + insertion.length, start + insertion.length);
      }
    }, 50);
  };

  const handleInsertDynamicsTag = (tag: string, target: 'chords' | 'lyrics' = 'chords') => {
    const textarea = target === 'chords' ? chordsTextareaRef.current : lyricsTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = (target === 'chords' ? editedSong.chords : editedSong.lyrics) || '';
    
    const charBefore = start > 0 ? text[start - 1] : '';
    const charAfter = end < text.length ? text[end] : '';

    const needsLeadingSpace = charBefore !== '' && charBefore !== ' ' && charBefore !== '\n';
    const needsTrailingSpace = charAfter !== '' && charAfter !== ' ' && charAfter !== '\n';

    // Ensure tag is clean before wrapping in []
    const cleanTag = tag.replace(/^[\(\[]+|[\)\]]+$/g, '').trim();
    const insertion = `${needsLeadingSpace ? ' ' : ''}[${cleanTag}]${needsTrailingSpace ? ' ' : ''}`;
    const newText = text.substring(0, start) + insertion + text.substring(end);
    if (target === 'chords') {
      setEditedSong(prev => ({ ...prev, chords: newText }));
    } else {
      setEditedSong(prev => ({ ...prev, lyrics: newText }));
    }
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(start + insertion.length, start + insertion.length);
      }
    }, 50);
  };

  const handleInsertCustomDynamicsTag = (target: 'chords' | 'lyrics' = 'chords') => {
    const customTag = window.prompt("Digite a marca√ß√£o de din√¢mica personalizada (ex: s√≥ guita, teclado e pad, entra banda, base viol√£o):", "s√≥ guita");
    if (customTag && customTag.trim()) {
      handleInsertDynamicsTag(customTag.trim(), target);
    }
  };
  const categories = [
    "CRIA√á√ÉO/ADORA√á√ÉO",
    "QUEDA/CONFISS√ÉO",
    "REDEN√á√ÉO/A√á√ÉO DE GRA√áAS",
    "CONSUMA√á√ÉO/RESPOSTA"
  ];

  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [metronomeVolume, setMetronomeVolume] = useState<number>(() => {
    const saved = localStorage.getItem('metronome-volume');
    return saved !== null ? Number(saved) : 80;
  });
  useEffect(() => {
    localStorage.setItem('metronome-volume', String(metronomeVolume));
  }, [metronomeVolume]);
  
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);
  const [isSmartScroll, setIsSmartScroll] = useState(false); // Default to false so 0.2x speed is standard default
  const [scrollSpeed, setScrollSpeed] = useState(0.2); // 0.2 as default per user request
  const scrollSpeedRef = useRef(0.2);
  const scrollAccumulatorRef = useRef(0);

  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);

  // Intelligent Scroll Speed Calculation based on BPM & lyric/chord lengths
  useEffect(() => {
    if (!isSmartScroll) return;

    const text = (detailTab === 'chords' ? editedSong.chords : editedSong.lyrics) || '';
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const lineCount = Math.max(10, lines.length);
    const bpm = editedSong.bpm || 80;

    // Estimate song duration: 16 beats per non-empty line (represents full lyrics & spacing bars)
    const estimatedSeconds = (lineCount * 16 * 60) / bpm;
    const clampedSeconds = Math.min(480, Math.max(90, estimatedSeconds));

    // Wait slightly for DOM layouts to settle (font size changes, chord displays, full screen triggers)
    const timer = setTimeout(() => {
      const container = (isFullscreen || isFocusMode) 
        ? document.getElementById('song-scroll-container') 
        : document.documentElement;

      let scrollableHeight = 0;
      if ((isFullscreen || isFocusMode) && container) {
        scrollableHeight = container.scrollHeight - container.clientHeight;
      } else {
        const docEl = document.documentElement;
        scrollableHeight = docEl.scrollHeight - window.innerHeight;
      }

      // Safe fallback height if layout is hidden or not rendered
      if (scrollableHeight < 50) {
        scrollableHeight = lineCount * 45;
      }

      const requiredPixelsPerSecond = scrollableHeight / clampedSeconds;
      const computedSpeed = requiredPixelsPerSecond / 40; // Pixels per second = Speed * 40
      const finalSpeed = Math.min(1.5, Math.max(0.05, parseFloat(computedSpeed.toFixed(3))));

      setScrollSpeed(finalSpeed);
    }, 150);

    return () => clearTimeout(timer);
  }, [isSmartScroll, editedSong.bpm, detailTab, songFontSize, isFullscreen, isFocusMode, editedSong.chords, editedSong.lyrics]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;

    const scroll = (time: number) => {
      if (lastTime !== 0) {
        const deltaTime = (time - lastTime) / 1000;
        // Base pixels per second is 45 for slightly faster, better paced rhythm tracking
        const pixelsPerSecond = scrollSpeedRef.current * 45;
        scrollAccumulatorRef.current += pixelsPerSecond * deltaTime;
        
        const scrollStep = Math.floor(scrollAccumulatorRef.current);
        if (scrollStep >= 1) {
          scrollAccumulatorRef.current -= scrollStep;
          const container = document.getElementById('song-scroll-container');
          if (container) {
            container.scrollTop += scrollStep;
          } else {
            window.scrollBy(0, scrollStep);
          }
        }
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(scroll);
    };

    if (isAutoScrolling) {
      scrollAccumulatorRef.current = 0; // Reset when starting
      animationFrameId = requestAnimationFrame(scroll);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isAutoScrolling, isFullscreen, isFocusMode]);

  const executeFootswitchAction = useCallback((action: 'nextPage' | 'prevPage' | 'toggleAutoScroll' | 'nextSong' | 'prevSong' | 'speedUp' | 'speedDown') => {
    const container = document.getElementById('song-scroll-container') || window;
    const elem = document.getElementById('song-scroll-container');
    const currentTop = elem ? elem.scrollTop : window.scrollY;
    const maxScroll = elem ? (elem.scrollHeight - elem.clientHeight) : (document.documentElement.scrollHeight - window.innerHeight);

    if (action === 'nextPage') {
      triggerPedalVisualFeedback('B', 'Avan√ßar P√°gina ‚ñº');
      if (footswitchConfig.autoNextSongAtBottom && maxScroll > 0 && currentTop >= maxScroll - 45 && nextSong && onSelectSong) {
        onSelectSong(nextSong);
        return;
      }
      const step = (elem ? elem.clientHeight : window.innerHeight) * 0.65;
      container.scrollBy({ top: step, behavior: 'smooth' });
    } else if (action === 'prevPage') {
      triggerPedalVisualFeedback('A', 'Voltar P√°gina ‚ñ≤');
      const step = (elem ? elem.clientHeight : window.innerHeight) * 0.65;
      container.scrollBy({ top: -step, behavior: 'smooth' });
    } else if (action === 'toggleAutoScroll') {
      triggerPedalVisualFeedback('C', 'Auto-Scroll ‚ñ∂Ô∏è/‚è∏Ô∏è');
      setIsAutoScrolling(prev => !prev);
    } else if (action === 'nextSong') {
      triggerPedalVisualFeedback('D', 'Pr√≥xima M√∫sica ‚è≠Ô∏è');
      if (nextSong && onSelectSong) {
        onSelectSong(nextSong);
      }
    } else if (action === 'prevSong') {
      triggerPedalVisualFeedback('A', 'M√∫sica Anterior ‚èÆÔ∏è');
      if (prevSong && onSelectSong) {
        onSelectSong(prevSong);
      }
    } else if (action === 'speedUp') {
      triggerPedalVisualFeedback('B', 'Velocidade + ‚ö°');
      setScrollSpeed(prev => Math.min(2.0, parseFloat((prev + 0.1).toFixed(2))));
    } else if (action === 'speedDown') {
      triggerPedalVisualFeedback('A', 'Velocidade - üê¢');
      setScrollSpeed(prev => Math.max(0.1, parseFloat((prev - 0.1).toFixed(2))));
    }
  }, [footswitchConfig, nextSong, prevSong, onSelectSong, triggerPedalVisualFeedback]);

  // Intelligent Bluetooth Footswitch & MIDI HID Listener (Supports M-VAVE Chocolate 4-Foots in HID & MIDI modes)
  useEffect(() => {
    if (!footswitchConfig.enabled) return;

    const matchesKey = (actionName: string, keyName: string, e?: KeyboardEvent): boolean => {
      const list = footswitchConfig.mappings[actionName as keyof FootswitchConfig['mappings']] || [];
      const isMatch = list.some(k => 
        k === keyName || 
        k.toLowerCase() === keyName.toLowerCase() || 
        (e && k === e.code) || 
        (e && k.toLowerCase() === e.code.toLowerCase())
      );
      if (isMatch) return true;

      // Direct M-VAVE Chocolate HID fallbacks (1, 2, 3, 4 / A, B, C, D / PageUp/PageDown / Arrows / Media)
      if (actionName === 'prevPage') {
        return ['1', 'Digit1', 'a', 'A', 'KeyA', 'w', 'W', 'KeyW', 'k', 'K', 'KeyK', 'ArrowUp', 'PageUp', 'MediaTrackPrevious'].includes(keyName) ||
               (e ? ['Digit1', 'KeyA', 'KeyW', 'KeyK', 'ArrowUp', 'PageUp', 'MediaTrackPrevious'].includes(e.code) : false);
      }
      if (actionName === 'nextPage') {
        return ['2', 'Digit2', 'b', 'B', 'KeyB', 's', 'S', 'KeyS', 'j', 'J', 'KeyJ', 'ArrowDown', 'PageDown', 'MediaTrackNext'].includes(keyName) ||
               (e ? ['Digit2', 'KeyB', 'KeyS', 'KeyJ', 'ArrowDown', 'PageDown', 'MediaTrackNext'].includes(e.code) : false);
      }
      if (actionName === 'toggleAutoScroll') {
        return ['3', 'Digit3', 'c', 'C', 'KeyC', 'e', 'E', 'KeyE', 'l', 'L', 'KeyL', ' ', 'Space', 'MediaPlayPause'].includes(keyName) ||
               (e ? ['Digit3', 'KeyC', 'KeyE', 'KeyL', 'Space', 'MediaPlayPause'].includes(e.code) : false);
      }
      if (actionName === 'nextSong') {
        return ['Enter', '4', 'Digit4', 'd', 'D', 'KeyD', 'n', 'N', 'KeyN', 'r', 'R', 'KeyR', ';', 'ArrowRight'].includes(keyName) ||
               (e ? ['Enter', 'Digit4', 'KeyD', 'KeyN', 'KeyR', 'ArrowRight'].includes(e.code) : false);
      }
      return false;
    };

    const handleFootswitchKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }
      if (showHarmonicGuideModal || showDynamicsGuideModal) {
        return;
      }

      const keyName = e.key === ' ' ? 'Space' : e.key;

      if (matchesKey('nextPage', keyName, e)) {
        e.preventDefault();
        triggerPedalVisualFeedback('B', 'Pedal B: Avan√ßar P√°gina ‚ñº');
        if (showFootswitchModal) {
          triggerFootswitchToast('Pedal B detectado com sucesso! (Avan√ßar P√°gina ‚ñº)');
          return;
        }
        executeFootswitchAction('nextPage');
        return;
      }
      if (matchesKey('prevPage', keyName, e)) {
        e.preventDefault();
        triggerPedalVisualFeedback('A', 'Pedal A: Voltar P√°gina ‚ñ≤');
        if (showFootswitchModal) {
          triggerFootswitchToast('Pedal A detectado com sucesso! (Voltar P√°gina ‚ñ≤)');
          return;
        }
        executeFootswitchAction('prevPage');
        return;
      }
      if (matchesKey('toggleAutoScroll', keyName, e)) {
        e.preventDefault();
        triggerPedalVisualFeedback('C', 'Pedal C: Auto-Scroll ‚ñ∂Ô∏è/‚è∏Ô∏è');
        if (showFootswitchModal) {
          triggerFootswitchToast('Pedal C detectado com sucesso! (Auto-Scroll)');
          return;
        }
        executeFootswitchAction('toggleAutoScroll');
        return;
      }
      if (matchesKey('nextSong', keyName, e)) {
        e.preventDefault();
        triggerPedalVisualFeedback('D', 'Pedal D: Pr√≥xima M√∫sica ‚è≠Ô∏è');
        if (showFootswitchModal) {
          triggerFootswitchToast('Pedal D detectado com sucesso! (Pr√≥xima M√∫sica ‚è≠Ô∏è)');
          return;
        }
        executeFootswitchAction('nextSong');
        return;
      }
      if (matchesKey('prevSong', keyName, e)) {
        e.preventDefault();
        triggerPedalVisualFeedback('A', 'Pedal: M√∫sica Anterior ‚èÆÔ∏è');
        executeFootswitchAction('prevSong');
        return;
      }
      if (matchesKey('speedUp', keyName, e)) {
        e.preventDefault();
        triggerPedalVisualFeedback('B', 'Pedal: Velocidade + ‚ö°');
        executeFootswitchAction('speedUp');
        return;
      }
      if (matchesKey('speedDown', keyName, e)) {
        e.preventDefault();
        triggerPedalVisualFeedback('A', 'Pedal: Velocidade - üê¢');
        executeFootswitchAction('speedDown');
        return;
      }
    };

    window.addEventListener('keydown', handleFootswitchKey, true);

    // Web MIDI connection for M-VAVE Chocolate in MIDI mode
    let midiAccessObj: any = null;
    const handleMidiMessage = (message: any) => {
      if (showHarmonicGuideModal || showDynamicsGuideModal) return;
      const [status, data1, data2] = message.data || [];
      if (!status) return;

      const isProgramChange = status >= 192 && status <= 207;
      const isControlChange = status >= 176 && status <= 191;
      const isNoteOn = status >= 144 && status <= 159;

      if (isProgramChange || ((isControlChange || isNoteOn) && data2 > 0)) {
        const midiKey = `MIDI:${status}:${data1}`;

        // Pedal A -> prevPage
        if (midiKey === 'MIDI:192:0' || data1 === 48 || data1 === 1 || data1 === 60) {
          triggerPedalVisualFeedback('A', 'MIDI Pedal A: Voltar P√°gina ‚ñ≤');
          if (showFootswitchModal) {
            triggerFootswitchToast('MIDI Pedal A detectado! (Voltar P√°gina ‚ñ≤)');
            return;
          }
          executeFootswitchAction('prevPage');
          return;
        }
        // Pedal B -> nextPage
        if (midiKey === 'MIDI:192:1' || data1 === 49 || data1 === 2 || data1 === 62) {
          triggerPedalVisualFeedback('B', 'MIDI Pedal B: Avan√ßar P√°gina ‚ñº');
          if (showFootswitchModal) {
            triggerFootswitchToast('MIDI Pedal B detectado! (Avan√ßar P√°gina ‚ñº)');
            return;
          }
          executeFootswitchAction('nextPage');
          return;
        }
        // Pedal C -> toggleAutoScroll
        if (midiKey === 'MIDI:192:2' || data1 === 50 || data1 === 3 || data1 === 64) {
          triggerPedalVisualFeedback('C', 'MIDI Pedal C: Auto-Scroll ‚ñ∂Ô∏è/‚è∏Ô∏è');
          if (showFootswitchModal) {
            triggerFootswitchToast('MIDI Pedal C detectado! (Auto-Scroll)');
            return;
          }
          executeFootswitchAction('toggleAutoScroll');
          return;
        }
        // Pedal D -> nextSong
        if (midiKey === 'MIDI:192:3' || data1 === 51 || data1 === 4 || data1 === 65 || data1 === 67) {
          triggerPedalVisualFeedback('D', 'MIDI Pedal D: Pr√≥xima M√∫sica ‚è≠Ô∏è');
          if (showFootswitchModal) {
            triggerFootswitchToast('MIDI Pedal D detectado! (Pr√≥xima M√∫sica ‚è≠Ô∏è)');
            return;
          }
          executeFootswitchAction('nextSong');
          return;
        }
      }
    };

    if (typeof navigator !== 'undefined' && (navigator as any).requestMIDIAccess) {
      (navigator as any).requestMIDIAccess({ sysex: false })
        .then((access: any) => {
          midiAccessObj = access;
          for (const input of access.inputs.values()) {
            input.onmidimessage = handleMidiMessage;
          }
          access.onstatechange = (event: any) => {
            if (event.port && event.port.type === 'input') {
              event.port.onmidimessage = handleMidiMessage;
            }
          };
        })
        .catch(() => { /* MIDI not allowed or unavailable */ });
    }

    return () => {
      window.removeEventListener('keydown', handleFootswitchKey, true);
      if (midiAccessObj) {
        for (const input of midiAccessObj.inputs.values()) {
          input.onmidimessage = null;
        }
      }
    };
  }, [footswitchConfig, showFootswitchModal, showHarmonicGuideModal, showDynamicsGuideModal, executeFootswitchAction, triggerPedalVisualFeedback, triggerFootswitchToast]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const analyzeBpmFromAudio = async (url: string, name: string) => {
    setIsAnalyzingAudioBpm(true);
    setDetectedBpmMsg(null);
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      
      // Analyze first 45 seconds of the song - fast and highly accurate
      const secondsToAnalyze = 45;
      const maxSamples = Math.min(channelData.length, sampleRate * secondsToAnalyze);
      const bufferLength = maxSamples;
      const blockSize = 1024; // ~23ms blocks 
      const energy: number[] = [];
      
      for (let i = 0; i < bufferLength; i += blockSize) {
        let sum = 0;
        const limit = Math.min(i + blockSize, bufferLength);
        for (let j = i; j < limit; j++) {
          sum += channelData[j] * channelData[j];
        }
        energy.push(Math.sqrt(sum / blockSize));
      }
      
      const maxEnergy = Math.max(...energy);
      if (maxEnergy < 0.001) {
        setIsAnalyzingAudioBpm(false);
        return;
      }
      
      const peaks: number[] = [];
      const windowSize = 15; // ~340ms window
      const minThreshold = maxEnergy * 0.15;
      
      for (let i = windowSize; i < energy.length - windowSize; i++) {
        const val = energy[i];
        if (val < minThreshold) continue;
        
        let isLocalMax = true;
        for (let j = i - windowSize; j <= i + windowSize; j++) {
          if (energy[j] > val) {
            isLocalMax = false;
            break;
          }
        }
        
        if (isLocalMax) {
          peaks.push(i);
        }
      }
      
      if (peaks.length < 2) {
        setIsAnalyzingAudioBpm(false);
        return;
      }
      
      const intervals: number[] = [];
      for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i-1]);
      }
      
      const blockDuration = blockSize / sampleRate;
      let bestBpm = 120;
      let maxScore = -1;
      
      // Test candidate tempos
      for (let bpm = 55; bpm <= 190; bpm++) {
        const targetSecs = 60 / bpm;
        const targetBlocks = targetSecs / blockDuration;
        
        let score = 0;
        intervals.forEach(interval => {
          const diff = Math.abs(interval - targetBlocks);
          const doubleDiff = Math.abs(interval - targetBlocks * 2);
          const halfDiff = Math.abs(interval - targetBlocks / 2);
          
          if (diff < 1.5) score += 1.0;
          else if (diff < 3.0) score += 0.5;
          
          if (doubleDiff < 1.5) score += 0.5;
          if (halfDiff < 1.5) score += 0.5;
        });
        
        if (score > maxScore) {
          maxScore = score;
          bestBpm = bpm;
        }
      }
      
      // Filter extreme values or adjust octaves
      if (bestBpm > 175) bestBpm = Math.round(bestBpm / 2);
      if (bestBpm < 55) bestBpm = Math.round(bestBpm * 2);
      
      setDetectedBpmMsg({ bpm: bestBpm, name });
      updateBPM(bestBpm);
    } catch (err) {
      console.error("Erro na an√°lise autom√°tica de BPM do √°udio:", err);
    } finally {
      setIsAnalyzingAudioBpm(false);
    }
  };

  const handlePlayPause = (url: string, index: number, name?: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlayingAudioIndex(null);
    }

    if (playingAudioIndex === index) {
      audioRef.current.pause();
      setPlayingAudioIndex(null);
    } else {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.play().catch(err => console.error("Erro ao reproduzir √°udio:", err));
      setPlayingAudioIndex(index);
      if (name) {
        analyzeBpmFromAudio(url, name);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'files') => {
    const file = event.target.files?.[0];
    if (!file || !song) return;

    // Verificar tamanho (limite de ~800KB para persistir em Base64 no Firestore sem estourar o limite de 1MB do doc)
    if (file.size > 800 * 1024) {
      alert("Para este prot√≥tipo, o arquivo deve ter menos de 800KB. Em produ√ß√£o, usar√≠amos Firebase Storage.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      const newItem = { name: file.name, url: base64Data };
      const songPath = `songs/${song.id}`;
      
      const updatedArray = type === 'audio' 
        ? [...(editedSong.audio || []), newItem]
        : [...(editedSong.files || []), newItem];

      try {
        await updateDoc(doc(db, 'songs', song.id), { [type]: updatedArray });
        setEditedSong({ ...editedSong, [type]: updatedArray });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, songPath);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
        setIsFocusMode(false);
        setSongFontSize(14);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const toggleMetronome = () => {
    setIsMetronomeActive(prev => !prev);
  };

  // Split song text into blocks of lines separated by empty lines (verses/choruses/stanzas)
  const getSongBlocks = (text: string) => {
    const lines = (text || '').split(/\r?\n/);
    const blocks: string[][] = [];
    let currentBlock: string[] = [];

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      if (line.trim() === '') {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock);
          currentBlock = [];
          blocks.push(['']);
        }
      } else {
        currentBlock.push(line);
      }
    }
    if (currentBlock.length > 0) {
      blocks.push(currentBlock);
    }
    if (blocks.length > 0 && blocks[blocks.length - 1].length === 1 && blocks[blocks.length - 1][0] === '') {
      blocks.pop();
    }
    return blocks;
  };

  const handleToggleEdit = () => {
    if (!isEditing && transpose !== 0) {
      // Apply the active transposition to the edited song permanently
      const newChords = transposeLyricsAndChords(editedSong.chords || '', transpose);
      const newBaseKey = editedSong.baseKey ? transposeChord(editedSong.baseKey, transpose) : editedSong.baseKey;
      setEditedSong(prev => ({ 
        ...prev, 
        chords: newChords, 
        baseKey: newBaseKey 
      }));
      setTranspose(0);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    const songPath = `songs/${song.id}`;
    try {
      const sanitizedChords = cleanTablatures(editedSong.chords || '');
      const sanitizedLyrics = cleanTablatures(editedSong.lyrics || '');

      const finalData = { 
        ...editedSong,
        chords: sanitizedChords,
        lyrics: sanitizedLyrics
      };
      await updateDoc(doc(db, 'songs', song.id), finalData);
      setEditedSong(finalData); // Sync local state immediately
      setReferenceBpm(finalData.bpm); // Update reference to make it the new "Original"
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, songPath);
    }
  };

  const addMedia = (type: 'audio' | 'files') => {
    if (!tempLink.url) return;
    const name = tempLink.name || (type === 'audio' ? 'Guia de √Åudio' : 'Arquivo');
    if (type === 'audio') {
      setEditedSong({ ...editedSong, audio: [...editedSong.audio, { name, url: tempLink.url }] });
    } else {
      setEditedSong({ ...editedSong, files: [...editedSong.files, { name, url: tempLink.url, type: 'link' }] });
    }
    setTempLink({ name: '', url: '' });
  };

  const originalTimeSignature = useMemo(() => {
    return song?.timeSignature || '4/4';
  }, [song?.timeSignature]);

  const originalBpmValue = useMemo(() => {
    const val = Number(song?.bpm);
    return !isNaN(val) && val > 0 ? val : (referenceBpm || 80);
  }, [song?.bpm, referenceBpm]);

  const handleSelectTimeSignature = (sig: string) => {
    setEditedSong(prev => ({ ...prev, timeSignature: sig }));
    setTimeSigFeedback(`Compasso alterado para ${sig}`);
    setTimeout(() => setTimeSigFeedback(null), 2000);
  };

  const handleResetTimeSignature = () => {
    setEditedSong(prev => ({ ...prev, timeSignature: originalTimeSignature }));
    setTimeSigFeedback(`Voltou ao Compasso Original (${originalTimeSignature})`);
    setTimeout(() => setTimeSigFeedback(null), 2500);
  };

  const handleSaveTimeSignatureToFirebase = async () => {
    if (!song?.id) return;
    setSavingTimeSig(true);
    const servicePath = `songs/${song.id}`;
    try {
      const sigToSave = editedSong.timeSignature || originalTimeSignature || '4/4';
      await updateDoc(doc(db, 'songs', song.id), {
        timeSignature: sigToSave,
        updatedAt: new Date().toISOString()
      });
      setTimeSigFeedback('Compasso salvo no Firebase como padr√£o!');
      setTimeout(() => setTimeSigFeedback(null), 2500);
    } catch (err) {
      console.error('Erro ao salvar compasso:', err);
      setTimeSigFeedback('Erro ao salvar no banco de dados.');
      handleFirestoreError(err, OperationType.UPDATE, servicePath);
      setTimeout(() => setTimeSigFeedback(null), 3000);
    } finally {
      setSavingTimeSig(false);
    }
  };

  const handleResetBpm = () => {
    updateBPM(originalBpmValue);
    setBpmFeedback(`Voltou ao BPM Original (${originalBpmValue} BPM)`);
    setTimeout(() => setBpmFeedback(null), 2500);
  };

  const handleSaveBpmToFirebase = async () => {
    if (!song?.id) return;
    setSavingBpm(true);
    const servicePath = `songs/${song.id}`;
    try {
      const bpmToSave = editedSong.bpm || originalBpmValue || 80;
      await updateDoc(doc(db, 'songs', song.id), {
        bpm: bpmToSave,
        updatedAt: new Date().toISOString()
      });
      setBpmFeedback('BPM salvo no Firebase como padr√£o!');
      setTimeout(() => setBpmFeedback(null), 2500);
    } catch (err) {
      console.error('Erro ao salvar BPM:', err);
      setBpmFeedback('Erro ao salvar no banco de dados.');
      handleFirestoreError(err, OperationType.UPDATE, servicePath);
      setTimeout(() => setBpmFeedback(null), 3000);
    } finally {
      setSavingBpm(false);
    }
  };

  const updateBPM = (valueOrFn: number | ((prev: number) => number)) => {
    setEditedSong(prev => {
      const current = Number(prev.bpm) || 80;
      const newVal = typeof valueOrFn === 'function' ? valueOrFn(current) : valueOrFn;
      const safeVal = Math.floor(Math.max(20, Math.min(300, Number(newVal) || 80)));
      return { ...prev, bpm: safeVal };
    });
  };

  const handleTapTempo = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const now = Date.now();
    const newTaps = [...taps, now].filter(t => now - t < 3000); // Aumentado para 3 segundos para ritmos lentos
    
    if (newTaps.length > 1) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i-1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 20 && calculatedBpm <= 300) {
        updateBPM(calculatedBpm);
      }
    }
    setTaps(newTaps);
  };

  const downloadSongPDF = () => {
    const doc = new jsPDF();
    const margin = 15;
    let y = 20;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(editedSong.title || 'M√∫sica Sem T√≠tulo', margin, y);
    y += 10;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.text(`Artista: ${editedSong.artist || 'Desconhecido'}`, margin, y);
    y += 8;

    // Metadata (Key, BPM)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const capoSemitones = getCapoSemitones(editedSong.capo);
    const netTranspose = dbChordsAreInCapoShape
      ? (isCapoEnabled ? transpose : (transpose + capoSemitones))
      : (isCapoEnabled ? (transpose - capoSemitones) : transpose);
    const currentKey = transpose !== 0 
      ? transposeChord(editedSong.baseKey || '', transpose) 
      : (editedSong.baseKey || '-');
    const pdfShapeKey = capoSemitones > 0 && currentKey !== '-'
      ? transposeChord(currentKey, -capoSemitones)
      : currentKey;

    const displayKeyText = isCapoEnabled && capoSemitones > 0 && currentKey !== '-'
      ? `${currentKey} (Shape: ${pdfShapeKey})`
      : currentKey;

    doc.text(`Tom: ${displayKeyText} | BPM: ${editedSong.bpm || '-'} | Compasso: ${editedSong.timeSignature || '4/4'}${editedSong.capo ? ` | ${formatCapoText(editedSong.capo)}` : ''}`, margin, y);
    y += 8;

    // Line separator
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, 195, y);
    y += 10;

    // Chords/Lyrics - Double Column Format
    // We use Courier because it is a monospaced font, essential for chord alignment
    doc.setFont("courier", "normal");
    doc.setFontSize(8.5);
    
    const contentToExport = netTranspose === 0 
      ? (detailTab === 'chords' ? (editedSong.chords || '') : (editedSong.lyrics || ''))
      : transposeLyricsAndChords(detailTab === 'chords' ? (editedSong.chords || '') : (editedSong.lyrics || ''), netTranspose);

    const lines = contentToExport.split(/\r?\n/);
    const lineHeight = 4.2;
    const pageHeight = doc.internal.pageSize.height;

    const colWidth = 85;
    const colGap = 10;
    const col1X = margin;
    const col2X = margin + colWidth + colGap; // 15 + 85 + 10 = 110
    
    let currentCol = 1;
    let startY = y;
    const originalStartY = y;
    
    let currentPage = 1;
    const pagesWithCol2 = new Set<number>();

    lines.forEach((line) => {
      // Check if we need to switch column or add a new page
      if (y + lineHeight > pageHeight - 15) {
        if (currentCol === 1) {
          currentCol = 2;
          y = startY;
          pagesWithCol2.add(currentPage);
        } else {
          doc.addPage();
          currentPage++;
          currentCol = 1;
          startY = 20; // subsequent pages start higher
          y = startY;
        }
      }

      const isChord = isChordLine(line);
      if (isChord && detailTab === 'chords') {
        doc.setFont("courier", "bold");
        doc.setTextColor(43, 169, 184); // Brand color
      } else {
        doc.setFont("courier", "normal");
        doc.setTextColor(60, 60, 60);
      }

      // Check current x position based on currentCol
      const currentX = currentCol === 1 ? col1X : col2X;
      
      // Truncate line helper to fit within column width to avoid overlapping other column content
      let displayLine = line;
      if (doc.getTextWidth(line) > colWidth) {
        let temp = line;
        while (temp.length > 0 && doc.getTextWidth(temp) > colWidth - 2) {
          temp = temp.slice(0, -1);
        }
        displayLine = temp;
      }

      doc.text(displayLine, currentX, y);
      y += lineHeight;
    });

    // Draw center dividers for page layouts that ended up using Column 2
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      if (pagesWithCol2.has(i)) {
        doc.setPage(i);
        const pStartY = i === 1 ? originalStartY : 20;
        const dividerX = 105;
        doc.setDrawColor(225, 225, 230);
        doc.setLineWidth(0.25);
        doc.line(dividerX, pStartY, dividerX, pageHeight - 15);
      }
    }

    const fileName = `${editedSong.title?.replace(/\s+/g, '_')}_${detailTab === 'chords' ? 'Cifra' : 'Letra'}.pdf`;
    doc.save(fileName);
  };

  const renderPracticePlayer = () => {
    return (
      <AnimatePresence>
        {showPracticePlayer && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className={cn(
              "fixed left-0 right-0 p-4 flex justify-center pointer-events-none",
              isFocusMode ? "bottom-4 z-[220]" : "bottom-0 z-[120]"
            )}
          >
            <Card className={cn(
              "w-full transition-all duration-300 bg-slate-950 border-2 border-brand/35 shadow-2xl pointer-events-auto overflow-hidden flex flex-col study-player-card",
              isPracticePlayerMinimized ? "max-w-[280px] sm:max-w-xs" : "max-w-lg"
            )}>
              <div className="flex items-center justify-between p-3 border-b border-white/10 bg-slate-900/80">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white shrink-0">
                    <Volume2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[10px] font-black uppercase text-brand tracking-widest leading-none">
                      {isPracticePlayerMinimized ? "Minimizado" : "Modo Pratique"}
                    </h4>
                    <p className="text-xs font-bold text-white truncate max-w-[120px] sm:max-w-[200px] mt-0.5">{editedSong.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => setIsPracticePlayerMinimized(!isPracticePlayerMinimized)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
                    title={isPracticePlayerMinimized ? "Maximizar Player" : "Minimizar Player"}
                  >
                    {isPracticePlayerMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
                  </button>
                  <button 
                    onClick={() => setShowPracticePlayer(false)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
                    title="Fechar Player"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className={cn("p-4 space-y-4", isPracticePlayerMinimized ? "hidden" : "block")}>
                {editedSong.youtube && (
                  <div className="space-y-3">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${getYoutubeId(editedSong.youtube)}?autoplay=0`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}

                {editedSong.audio && editedSong.audio.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Music2 size={12} className="text-brand" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Guias de √Åudio</span>
                    </div>

                    {isAnalyzingAudioBpm && (
                      <div className="flex items-center gap-2 p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl text-[10px] select-none animate-pulse">
                        <Activity size={12} className="animate-spin-slow shrink-0" />
                        <span>Detectando ritmo do guia em segundo plano...</span>
                      </div>
                    )}

                    {detectedBpmMsg && (
                      <div className="p-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-[10px] flex items-center justify-between gap-1.5 shadow-sm">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Sparkles size={11} className="shrink-0 text-green-400 animate-bounce" />
                          <span className="truncate">"{detectedBpmMsg.name}": <strong className="text-white">{detectedBpmMsg.bpm} BPM</strong> aplicado!</span>
                        </div>
                        <button 
                          onClick={() => setDetectedBpmMsg(null)}
                          className="text-[8px] font-black uppercase tracking-wider text-slate-400 hover:text-white transition-all shrink-0 ml-1"
                        >
                          OK
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-1.5 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                      {editedSong.audio.map((a: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded-xl group transition-all">
                           <div className="flex items-center gap-3 min-w-0">
                              <button 
                                onClick={() => handlePlayPause(a.url, i, a.name)}
                                className={cn(
                                  "w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0",
                                  playingAudioIndex === i ? "bg-brand text-white shadow-lg" : "bg-white/10 text-slate-200 hover:bg-brand/25 hover:text-white"
                                )}
                              >
                                {playingAudioIndex === i ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
                              </button>
                              <p className="font-bold text-white truncate text-[10px] leading-none">{a.name}</p>
                           </div>
                           <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => analyzeBpmFromAudio(a.url, a.name)}
                                className="p-1 px-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/15 rounded transition-all mr-1"
                                title="An√°lise Inteligente de BPM"
                              >
                                <Activity size={11} className={isAnalyzingAudioBpm ? "animate-pulse" : ""} />
                              </button>
                              <a href={a.url} target="_blank" rel="noopener noreferrer" className="p-1 px-2 bg-brand/20 text-brand text-[9px] font-black uppercase rounded hover:bg-brand/30 transition-all">
                                Ver
                              </a>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-slate-900/80 border-t border-white/10 text-center">
                 <p className="text-[9px] font-black text-brand uppercase tracking-[0.2em] animate-pulse">
                   {isPracticePlayerMinimized ? "TOCANDO EM SEGUNDO PLANO..." : "Ouvindo e Aprendendo..."}
                 </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (isFocusMode) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onTouchStart={handleFocusTouchStart}
        onTouchEnd={handleFocusTouchEnd}
        className={cn(
          "fixed inset-0 z-[200] overflow-hidden flex flex-col notranslate",
          isStageMode ? "bg-black text-white" : "bg-background"
        )}
        translate="no"
      >
        {/* Header / Bar de Controles Unificada do Modo Foco */}
        <div className={cn(
          "flex items-center justify-between gap-2 px-3 sm:px-5 py-2 border-b select-none z-[110] shrink-0 min-h-[48px] relative opacity-100 shadow-md",
          isStageMode ? "bg-black border-amber-500/30 text-white" : "bg-card dark:bg-zinc-900 border-border text-text-main"
        )}>
          {/* Informa√ß√µes da M√∫sica */}
          <div className="min-w-0 flex items-center gap-2 shrink truncate">
            <span className="text-[8px] sm:text-[9px] font-black tracking-widest bg-brand/10 text-brand px-1.5 py-0.5 rounded border border-brand/20 uppercase shrink-0">MODO CULTO</span>
            <h2 className={cn("text-xs sm:text-sm font-black truncate max-w-[120px] sm:max-w-[200px]", isStageMode ? "text-white" : "text-text-main")} title={editedSong.title}>{editedSong.title}</h2>
            <span className={cn("text-[10px] hidden lg:inline truncate", isStageMode ? "text-amber-300 font-bold" : "text-text-muted")}>
              ‚Ä¢ Tom: <span className="font-bold text-brand">{currentKey}{isCapoEnabled && shapeKey && shapeKey !== currentKey ? ` (${shapeKey})` : ''}</span> ‚Ä¢ BPM: {editedSong.bpm || 'Orig'}
            </span>
          </div>

          {/* Bot√µes de A√ß√£o e Visualiza√ß√£o Alinhados numa √önica Linha */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Ajuste de Fonte */}
            <div className={cn("flex items-center gap-0.5 p-0.5 rounded-lg border shrink-0", isStageMode ? "bg-zinc-900 border-amber-500/30" : "bg-black/5 dark:bg-white/10 border-border/60")}>
              <button
                onClick={() => setSongFontSize(prev => Math.max(10, prev - 2))}
                className={cn("w-7 h-7 flex items-center justify-center rounded-md active:scale-90 cursor-pointer transition-all", isStageMode ? "hover:bg-zinc-800 text-white" : "hover:bg-black/10 dark:hover:bg-white/10 text-text-main")}
                title="Diminuir Fonte"
              >
                <Minus size={12} strokeWidth={3} />
              </button>
              <div className={cn("flex items-center justify-center select-none leading-none px-1 min-w-[26px]", isStageMode ? "text-amber-400 font-bold" : "text-text-main")}>
                <span className="font-mono font-black text-[11px] leading-none">{songFontSize}</span>
              </div>
              <button
                onClick={() => setSongFontSize(prev => Math.min(60, prev + 2))}
                className={cn("w-7 h-7 flex items-center justify-center rounded-md active:scale-90 cursor-pointer transition-all", isStageMode ? "hover:bg-zinc-800 text-white" : "hover:bg-black/10 dark:hover:bg-white/10 text-text-main")}
                title="Aumentar Fonte"
              >
                <Plus size={12} strokeWidth={3} />
              </button>
            </div>

            {/* Modo Palco Toggle */}
            <button
              onClick={toggleStageMode}
              className={cn(
                "h-8 px-2 sm:px-2.5 flex items-center justify-center gap-1 rounded-lg font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer border shadow-xs shrink-0",
                isStageMode 
                  ? "bg-amber-500 border-amber-400 text-black shadow-amber-500/30 font-black" 
                  : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border-border text-text-main"
              )}
              title={isStageMode ? "Desativar Modo Palco (Alto Contraste OLED)" : "Ativar Modo Palco (Alto Contraste OLED)"}
            >
              <Sparkles size={12} className={isStageMode ? "text-black fill-black" : "text-amber-500"} />
              <span className="hidden sm:inline">Palco</span>
            </button>

            {/* Columns */}
            <button
              onClick={() => setNumColumns(prev => prev === 1 ? 2 : 1)}
              className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-all border active:scale-90 cursor-pointer shrink-0", numColumns === 2 ? 'bg-cyan-500 border-cyan-400 text-white shadow-xs shadow-cyan-500/20' : isStageMode ? "bg-zinc-900 border-amber-500/30 text-white hover:bg-zinc-800" : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border-border text-text-main')}
              title="Alternar Colunas"
            >
              <Columns size={12} />
            </button>

            {/* Autoscroll */}
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={cn("h-8 px-2 sm:px-2.5 flex items-center justify-center gap-1 rounded-lg font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all active:scale-90 cursor-pointer shrink-0 border", isAutoScrolling ? 'bg-green-500 text-white border-green-400 shadow-xs shadow-green-500/20 animate-pulse' : isStageMode ? "bg-zinc-900 border-amber-500/30 text-white hover:bg-zinc-800" : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border-border text-text-main')}
            >
              <ChevronsDown size={12} />
              <span className="hidden sm:inline">Rolar</span>
            </button>

            {/* Pedal Button & Visual Feedback */}
            <button
              onClick={() => setShowFootswitchModal(true)}
              className={cn(
                "h-8 px-2 sm:px-2.5 flex items-center justify-center gap-1 rounded-lg font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all active:scale-90 cursor-pointer shrink-0 border",
                activePedalButton
                  ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.95)] ring-2 ring-emerald-300 scale-105"
                  : footswitchConfig.enabled
                  ? "bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-cyan-500/25 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20"
                  : isStageMode
                  ? "bg-zinc-900 border-amber-500/30 text-white hover:bg-zinc-800"
                  : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border-border text-text-main"
              )}
              title="Configurar ou verificar Pedal Bluetooth/MIDI M-Vave Chocolate"
            >
              <BossPedalIcon
                size={15}
                className={cn(
                  "shrink-0 transition-all duration-300",
                  activePedalButton
                    ? "scale-125 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
                    : footswitchConfig.enabled
                    ? "text-emerald-400 animate-pulse"
                    : "opacity-70"
                )}
              />
              <span className={cn(activePedalButton ? "inline font-extrabold text-emerald-100" : "hidden sm:inline")}>
                {activePedalButton ? `[${activePedalButton}]` : "Pedal"}
              </span>
            </button>


            {/* Speed Selector Trigger */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowSpeedSelector(!showSpeedSelector)}
                className={cn("h-8 px-2 sm:px-2.5 flex items-center justify-center gap-1 rounded-lg font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer border shrink-0", showSpeedSelector ? 'bg-cyan-500 border-cyan-400 text-white shadow-xs shadow-cyan-500/20' : isStageMode ? "bg-zinc-900 border-amber-500/30 text-white hover:bg-zinc-800" : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border-border text-text-main')}
                title="Escolher Velocidade de Rolagem"
              >
                <Settings size={12} className={showSpeedSelector ? 'rotate-45 transition-transform' : 'transition-transform'} />
                <span>Vel: {isSmartScroll ? 'AUTO' : `${scrollSpeed}x`}</span>
              </button>

              {showSpeedSelector && (
                <div className={cn(
                  "absolute right-0 top-full mt-2 z-[255] flex flex-col border rounded-xl p-3 shadow-2xl min-w-[210px] gap-2.5 opacity-100 select-none",
                  isStageMode 
                    ? "bg-zinc-950 border-amber-500/50 text-white shadow-[0_10px_35px_rgba(0,0,0,0.95)]" 
                    : "bg-surface dark:bg-zinc-900 border-border text-text-main shadow-2xl"
                )}>
                  <div className={cn(
                    "flex items-center justify-between p-2 rounded-lg border select-none",
                    isStageMode ? "bg-zinc-900 border-amber-500/30 text-white" : "bg-black/10 dark:bg-white/10 border-border/60"
                  )}>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        ‚ú® Auto Inteligente
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSmartScroll(!isSmartScroll)}
                      className={cn(
                        "w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 cursor-pointer outline-none relative shrink-0",
                        isSmartScroll ? "bg-cyan-500 justify-end" : "bg-zinc-300 dark:bg-zinc-700 justify-start"
                      )}
                      title="Alternar Modo de Rolagem Inteligente"
                    >
                      <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md pointer-events-none" />
                    </button>
                  </div>

                  <div className="h-px bg-border/40 my-0.5" />

                  <div className="px-1 text-left">
                    <span className={cn("text-[9px] font-black uppercase tracking-widest text-left block", isStageMode ? "text-zinc-400" : "text-text-muted")}>Ajuste Manual</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {[0.1, 0.2, 0.3, 0.5, 1, 1.5].map((speed) => {
                      const isActive = !isSmartScroll && scrollSpeed === speed;
                      return (
                        <button
                          type="button"
                          key={speed}
                          onClick={() => {
                            setIsSmartScroll(false);
                            setScrollSpeed(speed);
                            setShowSpeedSelector(false);
                          }}
                          className={cn(
                            "px-2 py-2 rounded-lg text-xs font-black transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer border",
                            isActive 
                              ? "bg-cyan-500 border-cyan-400 text-white shadow-md shadow-cyan-500/30 font-black" 
                              : isStageMode
                                ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white"
                                : "bg-black/5 dark:bg-white/10 border-border/60 text-text-main hover:bg-black/10 dark:hover:bg-white/20"
                          )}
                        >
                          <span>{speed}x</span>
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sair Button */}
            <button
              onClick={() => {
                setIsFocusMode(false);
                setSongFontSize(14);
              }}
              className="h-8 px-2.5 sm:px-3 bg-red-500 hover:bg-red-600 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-lg transition-all shadow-xs shadow-red-500/15 cursor-pointer select-none flex items-center justify-center gap-1 shrink-0 ml-1 active:scale-95"
              title="Sair do Modo Foco"
            >
              <X size={13} strokeWidth={2.5} />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Conte√∫do Principal (Cifra ou Letra) */}
        <div 
          id="song-scroll-container"
          className={cn(
            "flex-1 overflow-y-auto px-1 sm:px-2 py-6 custom-scrollbar transition-colors duration-300",
            !isAutoScrolling && "scroll-smooth",
            isStageMode && "bg-black"
          )}
        >
          <div className="w-full max-w-none mx-0 px-2 pb-12">
            {detailTab === 'chords' ? (
              // Renderiza√ß√£o elegante da Cifra
              <div 
                id="song-viewer-container"
                className={cn(
                  "bg-transparent selection:bg-brand/20 transition-all duration-300",
                  isStageMode ? "stage-mode text-white" : "text-text-main"
                )}
                style={{ 
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: `${songFontSize}px`,
                  letterSpacing: '0',
                  lineHeight: '1.4',
                  columnCount: numColumns,
                  columnGap: numColumns > 1 ? '3rem' : '0px',
                  columnRule: numColumns > 1 ? '1px dashed rgba(128, 128, 128, 0.2)' : 'none'
                }}
              >
                <style>
                  {`
                    #song-scroll-container {
                      scroll-behavior: smooth !important;
                      transition: scroll-behavior 0.3s ease-in-out;
                    }

                    #song-viewer-container {
                      overflow-x: auto !important;
                      -webkit-overflow-scrolling: touch;
                      scroll-behavior: smooth !important;
                      transition: scroll-behavior 0.3s ease-in-out;
                      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                    }

                    #song-viewer-container.stage-mode,
                    .stage-mode {
                      background-color: #000000 !important;
                      color: #ffffff !important;
                    }

                    #song-viewer-container.stage-mode,
                    #song-viewer-container.stage-mode div,
                    #song-viewer-container.stage-mode span,
                    #song-viewer-container.stage-mode p,
                    #song-viewer-container.stage-mode .text-text-main,
                    .light #song-viewer-container.stage-mode,
                    .light #song-viewer-container.stage-mode div,
                    .light #song-viewer-container.stage-mode span,
                    .light #song-viewer-container.stage-mode p,
                    .light #song-viewer-container.stage-mode .text-text-main,
                    .stage-mode,
                    .stage-mode div,
                    .stage-mode span,
                    .stage-mode p,
                    .stage-mode .text-text-main {
                      color: #ffffff !important;
                    }

                    #song-viewer-container.stage-mode .char-span,
                    #song-viewer-container.stage-mode div,
                    .stage-mode .char-span,
                    .stage-mode div {
                      font-weight: 600 !important;
                      text-shadow: 0 0 3px rgba(255, 255, 255, 0.3) !important;
                    }

                    #song-viewer-container.stage-mode .chord-line button,
                    #song-viewer-container.stage-mode .chord-btn,
                    .light #song-viewer-container.stage-mode .chord-line button,
                    .light #song-viewer-container.stage-mode .chord-btn,
                    .stage-mode .chord-line button,
                    .stage-mode .chord-btn {
                      color: #00f0ff !important;
                      background-color: rgba(0, 240, 255, 0.18) !important;
                      border: none !important;
                      outline: 1px solid rgba(0, 240, 255, 0.4) !important;
                      outline-offset: 0px !important;
                      font-weight: 900 !important;
                      letter-spacing: 0px !important;
                      padding: 0px !important;
                      margin: 0px !important;
                      border-radius: 3px !important;
                      text-shadow: 0 0 8px rgba(0, 240, 255, 0.8) !important;
                      box-sizing: border-box !important;
                      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                    }

                    #song-viewer-container.stage-mode .chord-line button:hover,
                    #song-viewer-container.stage-mode .chord-btn:hover,
                    .light #song-viewer-container.stage-mode .chord-line button:hover,
                    .light #song-viewer-container.stage-mode .chord-btn:hover,
                    .stage-mode .chord-line button:hover,
                    .stage-mode .chord-btn:hover {
                      color: #ffffff !important;
                      background-color: rgba(0, 240, 255, 0.4) !important;
                      outline-color: #00f0ff !important;
                      box-shadow: 0 0 12px rgba(0, 240, 255, 0.9) !important;
                    }

                    #song-viewer-container.stage-mode .sec-badge,
                    .light #song-viewer-container.stage-mode .sec-badge,
                    .stage-mode .sec-badge {
                      background: linear-gradient(135deg, #f59e0b, #d97706) !important;
                      color: #000000 !important;
                      font-weight: 900 !important;
                      border-color: #fbbf24 !important;
                      box-shadow: 0 0 12px rgba(245, 158, 11, 0.5) !important;
                    }

                    #song-viewer-container.stage-mode .dyn-btn,
                    .light #song-viewer-container.stage-mode .dyn-btn,
                    .stage-mode .dyn-btn {
                      background: linear-gradient(135deg, #06b6d4, #0284c7) !important;
                      color: #ffffff !important;
                      font-weight: 900 !important;
                      border-color: #38bdf8 !important;
                      box-shadow: 0 0 10px rgba(6, 182, 212, 0.5) !important;
                    }

                    #song-viewer-container.stage-mode .text-amber-500,
                    #song-viewer-container.stage-mode .text-amber-400,
                    .light #song-viewer-container.stage-mode .text-amber-500,
                    .light #song-viewer-container.stage-mode .text-amber-400,
                    .stage-mode .text-amber-500,
                    .stage-mode .text-amber-400 {
                      color: #fbbf24 !important;
                      font-weight: 800 !important;
                    }

                    #song-viewer-container.stage-mode .text-cyan-500,
                    #song-viewer-container.stage-mode .text-cyan-400,
                    .light #song-viewer-container.stage-mode .text-cyan-500,
                    .light #song-viewer-container.stage-mode .text-cyan-400,
                    .stage-mode .text-cyan-500,
                    .stage-mode .text-cyan-400 {
                      color: #38bdf8 !important;
                      font-weight: 800 !important;
                    }
                    
                    #song-viewer-container .chord-line {
                      display: flex !important;
                      flex-direction: row !important;
                      flex-wrap: wrap !important;
                      white-space: pre !important;
                      word-break: keep-all !important;
                      overflow-wrap: normal !important;
                      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                    }
                    
                    #song-viewer-container .chord-line .char-span { 
                      display: inline-block !important; 
                      width: 1ch !important; 
                      text-align: center !important;
                      white-space: pre !important;
                      word-break: keep-all !important;
                      overflow-wrap: normal !important;
                      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                    }
                    
                    #song-viewer-container .chord-line button,
                    #song-viewer-container .chord-btn {
                      white-space: pre !important;
                      word-break: keep-all !important;
                      overflow-wrap: normal !important;
                      display: inline-block !important;
                      box-sizing: border-box !important;
                      padding: 0px !important;
                      margin: 0px !important;
                      border: none !important;
                      letter-spacing: 0px !important;
                      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                    }
                    
                    #song-viewer-container .chord-line button,
                    #song-viewer-container .chord-btn {
                      color: #06b6d4 !important;
                      background-color: transparent !important;
                      border: none !important;
                      font-weight: 850 !important;
                      letter-spacing: 0px !important;
                      padding: 0px !important;
                      margin: 0px !important;
                      border-radius: 2px !important;
                      transition: all 0.2s ease;
                    }
                    
                    #song-viewer-container .chord-line button:hover,
                    #song-viewer-container .chord-btn:hover {
                      color: #ffffff !important;
                      background-color: rgba(6, 182, 212, 0.2) !important;
                      text-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
                    }
                    
                    /* Extremely high contrast for chord buttons in light mode when NOT in stage mode */
                    .light #song-viewer-container:not(.stage-mode) .chord-line button,
                    .light #song-viewer-container:not(.stage-mode) .chord-btn {
                      color: #0369a1 !important;
                      background-color: transparent !important;
                      border: none !important;
                      font-weight: 850 !important;
                      padding: 0px !important;
                      margin: 0px !important;
                      letter-spacing: 0px !important;
                    }
                    
                    .light #song-viewer-container:not(.stage-mode) .chord-line button:hover,
                    .light #song-viewer-container:not(.stage-mode) .chord-btn:hover {
                      color: #0369a1 !important;
                      background-color: rgba(3, 105, 161, 0.15) !important;
                    }
                  `}
                </style>
                {displayedContent ? (
                  getSongBlocks(displayedContent).map((block, bIdx) => {
                    if (block.length === 1 && block[0] === '') {
                      return <div key={`spacer-${bIdx}`} className="h-2 sm:h-2.5 break-inside-avoid block" />;
                    }

                    const rows: React.ReactNode[] = [];
                    let lIdx = 0;
                    while (lIdx < block.length) {
                      const currentLine = block[lIdx];
                      const isCurrentChord = isChordLine(currentLine);
                      const hasNext = lIdx + 1 < block.length;
                      const isNextLyric = hasNext && !isChordLine(block[lIdx + 1]);

                      if (isCurrentChord && isNextLyric) {
                        const nextLine = block[lIdx + 1];
                        rows.push(
                          <PairedChordLyricsRow 
                            key={`pair-${lIdx}`}
                            chordLine={currentLine}
                            lyricLine={nextLine}
                            setActiveChordInDict={setActiveChordInDict}
                          />
                        );
                        lIdx += 2;
                      } else {
                        rows.push(
                          <SingleLineRow 
                            key={`single-${lIdx}`}
                            line={currentLine}
                            isChord={isCurrentChord}
                            setActiveChordInDict={setActiveChordInDict}
                          />
                        );
                        lIdx += 1;
                      }
                    }

                    return (
                      <div key={`block-${bIdx}`} className="break-inside-avoid mb-3 sm:mb-4 block">
                        {rows}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                    <p className="italic font-sans text-lg">Nenhuma cifra cadastrada.</p>
                  </div>
                )}
              </div>
            ) : (
              // Renderiza√ß√£o da Letra
              <div 
                className="font-sans text-text-main leading-loose text-left transition-all duration-300"
                style={{ 
                  fontSize: `${songFontSize}px`,
                  columnCount: numColumns,
                  columnGap: numColumns > 1 ? '3rem' : '0px',
                  columnRule: numColumns > 1 ? '1px dashed rgba(128, 128, 128, 0.2)' : 'none'
                }}
              >
                {effectiveLyrics ? (
                  getSongBlocks(effectiveLyrics).map((block, bIdx) => {
                    if (block.length === 1 && block[0] === '') {
                      return <div key={`spacer-${bIdx}`} className="h-2 sm:h-2.5 break-inside-avoid block" />;
                    }

                    return (
                      <div key={`block-${bIdx}`} className="break-inside-avoid mb-3 sm:mb-4 block">
                        {block.map((line, lIdx) => {
                          if (isChordLine(line)) return null;
                          const elements: React.ReactNode[] = [];
                          let isBold = false;
                          let isItalic = false;
                          let isUnderline = false;
                          
                          let i = 0;
                          let charIdx = 0;
                          while (i < line.length) {
                            if (line.substring(i, i + 3) === '<b>') {
                              isBold = true;
                              i += 3;
                              continue;
                            }
                            if (line.substring(i, i + 4) === '</b>') {
                              isBold = false;
                              i += 4;
                              continue;
                            }
                            if (line.substring(i, i + 3) === '<i>') {
                              isItalic = true;
                              i += 3;
                              continue;
                            }
                            if (line.substring(i, i + 4) === '</i>') {
                              isItalic = false;
                              i += 4;
                              continue;
                            }
                            if (line.substring(i, i + 3) === '<u>') {
                              isUnderline = true;
                              i += 3;
                              continue;
                            }
                            if (line.substring(i, i + 4) === '</u>') {
                              isUnderline = false;
                              i += 4;
                              continue;
                            }

                            const char = line[i];
                            const classes = cn(
                              isBold && "font-black brightness-110",
                              isItalic && "italic",
                              isUnderline && "underline decoration-current",
                              (char === '[' || char === ']') && "text-amber-500 font-extrabold",
                              (char === '{' || char === '}') && "text-cyan-500 font-extrabold"
                            );

                            elements.push(
                              <span 
                                key={charIdx} 
                                className={classes}
                              >
                                {char}
                              </span>
                            );

                            charIdx++;
                            i++;
                          }

                          return (
                            <div key={lIdx} className="min-h-[1.2em] mb-1">
                              {elements.length > 0 ? elements : ' '}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                    <p className="italic font-sans text-lg">Nenhuma letra cadastrada.</p>
                  </div>
                )}
              </div>
            )}
            {renderLiturgyNavigation()}

            {/* Bot√£o de Sair no final da Cifra / Modo Foco */}
            <div className="mt-8 mb-6 flex justify-center">
              <button
                onClick={() => {
                  setIsFocusMode(false);
                  setSongFontSize(14);
                }}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 active:scale-95 shadow-md",
                  isStageMode
                    ? "bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-red-500/30 hover:border-red-500/60"
                    : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                )}
                title="Sair do Modo Foco"
              >
                <X size={15} strokeWidth={2.5} />
                <span>Sair do Modo Foco</span>
              </button>
            </div>
          </div>
        </div>

        {renderPracticePlayer()}

        {/* Popover Flutuante de Diagrama R√°pido de Acorde no Modo Foco */}
        <QuickChordPopover
          chord={popoverChord}
          onClose={() => setPopoverChord(null)}
          availableChords={availableChordsInSong}
          onSelectChord={(chord) => setActiveChordInDict(chord, true)}
          songKey={currentKey}
        />

        {/* Modal Guia de Din√¢micas & Express√£o Musical no Modo Foco */}
        <DynamicsGuideModal
          isOpen={showDynamicsGuideModal}
          onClose={() => setShowDynamicsGuideModal(false)}
        />

        {/* Dynamic Explanation Popup Modal no Modo Foco */}
        <DynamicExplanationModal
          explanation={activeDynamicExplanation}
          onClose={() => setActiveDynamicExplanation(null)}
        />

        {/* Footswitch Bluetooth / MIDI Modal no Modo Foco */}
        <FootswitchModal
          isOpen={showFootswitchModal}
          onClose={() => setShowFootswitchModal(false)}
          config={footswitchConfig}
          onUpdateConfig={setFootswitchConfig}
          activePedalButton={activePedalButton}
        />

        {/* Chromatic Tuner Modal no Modo Foco */}
        <ChromaticTunerModal
          isOpen={showTunerModal}
          onClose={() => setShowTunerModal(false)}
        />

        {/* Study Metronome Modal no Modo Foco */}
        <StudyMetronomeModal
          isOpen={showMetronomeModal}
          onClose={() => setShowMetronomeModal(false)}
          bpm={editedSong.bpm || 80}
          timeSignature={editedSong.timeSignature || '4/4'}
          onUpdateBpm={updateBPM}
          originalBpm={referenceBpm}
          originalTimeSignature={originalTimeSignature}
          isMetronomeActive={isMetronomeActive}
          onToggleMetronome={toggleMetronome}
          metronomeVolume={metronomeVolume}
          onUpdateVolume={setMetronomeVolume}
          onTapTempo={handleTapTempo}
        />

        {/* Footswitch Visual Feedback Toast no Modo Foco */}
        <AnimatePresence>
          {footswitchToast && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-emerald-950/90 dark:bg-emerald-900/90 text-emerald-100 border border-emerald-500/40 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 backdrop-blur-md pointer-events-none"
            >
              <BossPedalIcon size={18} className="text-emerald-400 animate-pulse shrink-0" />
              <span className="text-xs font-black tracking-wide">{footswitchToast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 pb-20"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap notranslate" translate="no">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onBack} className="p-2 bg-black/5 dark:bg-white/5 rounded-lg border border-border hover:bg-black/10 dark:hover:bg-white/10 transition-colors shadow-sm text-text-main"><ArrowLeft size={18}/></button>
          
          {user && (
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={cn(
                "p-2 rounded-lg border transition-all active:scale-95 cursor-pointer shadow-sm flex items-center justify-center h-10 w-10 shrink-0",
                (memberData?.favoriteSongs || []).includes(song.id)
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20" 
                  : "bg-black/5 dark:bg-white/5 border-border text-text-muted hover:text-amber-500 hover:border-amber-500/30"
              )}
              title={(memberData?.favoriteSongs || []).includes(song.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Star 
                size={18} 
                className={cn(
                  (memberData?.favoriteSongs || []).includes(song.id) ? "fill-amber-500 stroke-amber-500" : ""
                )} 
              />
            </button>
          )}

          <ArtistAvatar artist={editedSong.artist} customImageUrl={editedSong.artistImageUrl} size="md" />
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex flex-col gap-2 w-full">
                <Input 
                  value={editedSong.title} 
                  onChange={e => setEditedSong({...editedSong, title: e.target.value})}
                  className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 text-base sm:text-lg font-bold"
                  placeholder="T√≠tulo da m√∫sica"
                />
                <div className="flex flex-wrap gap-2">
                  <Input 
                    value={editedSong.artist} 
                    onChange={e => setEditedSong({...editedSong, artist: e.target.value})}
                    className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-9 text-sm italic flex-1 min-w-[120px]"
                    placeholder="Artista"
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Input 
                      value={editedSong.artistImageUrl || ''} 
                      onChange={e => setEditedSong({...editedSong, artistImageUrl: e.target.value})}
                      className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-9 text-xs flex-1"
                      placeholder="URL da Imagem do Artista"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        id="editedSongArtistImage"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 800 * 1024) {
                              alert("A imagem deve ser menor que 800KB para salvar no banco de dados.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (uploadEvent) => {
                              const base64 = uploadEvent.target?.result as string;
                              setEditedSong({...editedSong, artistImageUrl: base64});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label 
                        htmlFor="editedSongArtistImage"
                        className="h-9 px-2.5 rounded bg-brand/10 hover:bg-brand/20 border border-brand/20 hover:border-brand/30 text-brand text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
                        title="Subir imagem do dispositivo"
                      >
                        <Upload size={14} />
                        <span className="hidden sm:inline">Subir</span>
                      </label>
                    </div>
                  </div>
                  <select 
                    value={editedSong.category} 
                    onChange={e => setEditedSong({...editedSong, category: e.target.value})}
                    className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-9 text-[12px] uppercase font-bold rounded px-2 outline-none flex-1 min-w-[120px]"
                  >
                    <option value="" className="bg-surface text-text-muted">Categoria</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-surface text-zinc-900 dark:text-zinc-100 text-xs">{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select 
                    value={editedSong.timeSignature || '4/4'} 
                    onChange={e => setEditedSong({...editedSong, timeSignature: e.target.value})}
                    className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-8 text-[10px] uppercase font-bold rounded px-2 outline-none w-20"
                  >
                    {['4/4', '3/4', '2/4', '6/8', '5/4', '7/8', '12/8'].map(ts => (
                      <option key={ts} value={ts} className="bg-surface text-zinc-900 dark:text-zinc-100 text-xs">{ts}</option>
                    ))}
                  </select>
                  <div className="flex gap-1 items-center">
                    <Input 
                      value={editedSong.baseKey} 
                      onChange={e => setEditedSong({...editedSong, baseKey: e.target.value})}
                      className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-8 text-[10px] font-bold rounded px-2 outline-none w-16"
                      placeholder="Tom"
                    />
                    <button 
                      onClick={() => {
                        const detected = detectKey(editedSong.chords);
                        if (detected) setEditedSong({ ...editedSong, baseKey: detected });
                      }}
                      title="Sincronizar Tom com Cifra"
                      className="h-8 w-8 flex items-center justify-center bg-brand/10 text-brand rounded hover:bg-brand/20 transition-all"
                    >
                      <Sparkles size={14} />
                    </button>
                  </div>
                  <Input 
                    value={editedSong.youtube || ''} 
                    onChange={e => setEditedSong({...editedSong, youtube: e.target.value})}
                    className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-8 text-[10px] rounded px-2 outline-none flex-1 min-w-[120px]"
                    placeholder="Link Youtube"
                  />
                  <select 
                    value={editedSong.capo || ''} 
                    onChange={e => {
                      const val = e.target.value;
                      setEditedSong({...editedSong, capo: val});
                      setIsCapoEnabled(!!val);
                    }}
                    className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-8 text-[10px] rounded px-2 outline-none flex-1 min-w-[130px] font-bold cursor-pointer"
                  >
                    <option value="" className="bg-surface text-text-main">Capo: Sem Capo</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(fret => (
                      <option key={fret} value={fret + '¬™ casa'} className="bg-surface text-text-main">
                        Capo: {fret}¬™ Casa
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-xl sm:text-2xl font-bold text-text-main leading-tight break-words">{editedSong.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-sm sm:text-base text-text-muted italic truncate max-w-[140px] sm:max-w-[180px]">{editedSong.artist}</p>
                  {/* Key display moved next to YouTube icon */}
                  {editedSong.category && (
                    <span className="text-[11px] sm:text-[13px] font-black bg-brand px-2 py-0.5 sm:py-1 rounded text-white uppercase tracking-tight whitespace-nowrap">
                      {editedSong.category}
                    </span>
                  )}
                  {!isEditing && (
                    <button 
                      onClick={downloadSongPDF}
                      className="flex items-center gap-1 px-1.5 sm:px-4 py-1 sm:py-2 rounded-lg bg-brand text-white border border-brand/20 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-brand/10 shrink-0"
                      title="Baixar PDF"
                    >
                      <FileDown size={12} className="sm:w-[18px] sm:h-[18px]" />
                      <span className="text-[8px] sm:text-xs font-bold uppercase tracking-widest">PDF</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div 
          className="flex items-end gap-1.5 sm:gap-4 flex-nowrap w-full justify-between sm:justify-start overflow-x-auto header-buttons-scroll scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          <div className="flex items-end gap-1 sm:gap-1.5 flex-nowrap shrink-0">
             {/* Modo Foco (FOCO) - Primeiro Bot√£o da Esquerda */}
             <div className="flex flex-col items-center">
               <span className="text-[9px] sm:text-[11px] text-brand font-black uppercase tracking-widest mb-1">Modo</span>
               <button 
                 type="button"
                 onClick={() => { setIsFocusMode(true); setSongFontSize(18); }} 
                 title="Ativar Modo Foco (Otimizado para Culto e Celular)"
                 className="flex items-center gap-1 h-[38px] sm:h-[46px] px-2 sm:px-2.5 bg-gradient-to-r from-brand to-cyan-500 hover:brightness-110 text-white shadow-md rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer font-black uppercase text-xs border border-white/10"
               >
                 <Sparkles size={13} className="animate-pulse" />
                 <span>FOCO</span>
               </button>
             </div>

             {/* Tom */}
             <div className="flex flex-col items-center min-w-[40px] sm:min-w-[55px] relative">
                 <span className="text-[9px] sm:text-[11px] text-text-muted font-black uppercase tracking-widest mb-1">Tom</span>
                 <button 
                   onClick={() => setShowKeyMenu(!showKeyMenu)}
                   className="bg-brand text-white px-1.5 sm:px-2.5 py-1 py-sm-1.5 rounded-lg border border-white/20 leading-none min-h-[38px] sm:min-h-[46px] flex flex-col items-center justify-center w-full notranslate shadow-lg hover:brightness-110 active:scale-95 transition-all outline-none ring-offset-2 focus:ring-2 focus:ring-brand" 
                   translate="no"
                   title={isCapoEnabled && shapeKey && shapeKey !== currentKey ? `Tom Real: ${currentKey} | Acordes em: ${shapeKey}` : `Tom: ${currentKey}`}
                 >
                   <span className="text-sm sm:text-xl font-black">{currentKey}</span>
                   {isCapoEnabled && shapeKey && shapeKey !== currentKey && (
                     <span className="text-[8px] sm:text-[9px] font-bold block opacity-90 tracking-tight mt-0.5">
                       Shape: {shapeKey}
                     </span>
                   )}
                 </button>
             </div>

             {/* Caixa de Op√ß√µes e Sele√ß√£o do Capo */}
             <div className="flex flex-col items-center min-w-[70px] sm:min-w-[95px] relative">
               <span className="text-[9px] sm:text-[11px] text-text-muted font-black uppercase tracking-widest mb-1">Capo</span>
               <button 
                 type="button"
                 onClick={() => setShowCapoMenu(!showCapoMenu)}
                 className={cn(
                   "font-black text-xs sm:text-sm px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border leading-tight min-h-[38px] sm:min-h-[46px] flex flex-col items-center justify-center text-center shadow-lg w-full transition-all active:scale-95 cursor-pointer outline-none",
                   isCapoEnabled && capoSemitones > 0
                     ? "bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/30 shadow-amber-500/10"
                     : "bg-black/10 dark:bg-white/5 border-border text-text-muted hover:bg-black/15 dark:hover:bg-white/10"
                 )}
                 title="Abrir Caixa de Op√ß√µes do Capo (1¬™ a 12¬™ Casa)"
               >
                 {isCapoEnabled && capoSemitones > 0 ? (
                   <>
                     <span className="leading-tight font-black">{capoSemitones}¬™ Casa</span>
                     <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight text-amber-600 dark:text-amber-300 mt-0.5">
                       Shape: {shapeKey}
                     </span>
                   </>
                 ) : (
                   <>
                     <span className="leading-tight">Sem Capo</span>
                     <span className="text-[8px] font-bold uppercase tracking-wider opacity-70 mt-0.5 flex items-center gap-0.5 text-brand">
                       Escolher <ChevronDown size={10} />
                     </span>
                   </>
                 )}
               </button>
             </div>

             {/* Vis√£o Harm√¥nica por Fun√ß√£o / Graus */}
             <div className="flex items-end gap-2 flex-wrap justify-center">
               {/* Container da Vis√£o Harm√¥nica (T√≠tulo + Caixa de Bot√µes de Vis√£o Harm√¥nica) */}
               <div className="flex flex-col items-center">
                 <span className="text-[10px] sm:text-[11px] text-brand font-black uppercase tracking-widest mb-1 text-center">
                   Vis√£o Harm√¥nica
                 </span>
                 <div className="bg-brand/10 dark:bg-brand/20 border border-brand/30 p-1 rounded-xl flex items-center gap-1 min-h-[38px] sm:min-h-[46px] shadow-xs">
                   {/* Bot√£o √önico para Sele√ß√£o de Vis√£o Harm√¥nica (CIFRA ‚ûî GRAUS ‚ûî FUN√á√ÉO) */}
                   <button
                     type="button"
                     onClick={() => setShowHarmonicMenu(true)}
                     className={cn(
                       "px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm min-h-[30px] sm:min-h-[38px] active:scale-95 border select-none",
                       harmonicDisplayMode === 'chords' && "bg-brand border-brand/40 text-white hover:brightness-110",
                       harmonicDisplayMode === 'roman' && "bg-amber-500 border-amber-400 text-black font-black hover:bg-amber-400 shadow-amber-500/20",
                       harmonicDisplayMode === 'functions' && "bg-cyan-500 border-cyan-400 text-white font-black hover:bg-cyan-400 shadow-cyan-500/20"
                     )}
                     title="Toque para alternar a Vis√£o Harm√¥nica (CIFRA ‚ûî GRAUS ‚ûî FUN√á√ÉO)"
                   >
                     <Layers size={13} className="shrink-0" />
                     <span>
                       {harmonicDisplayMode === 'chords' && "Cifra"}
                       {harmonicDisplayMode === 'roman' && "Graus"}
                       {harmonicDisplayMode === 'functions' && "Fun√ß√µes"}
                     </span>
                     <ChevronDown size={11} className="opacity-80 shrink-0 ml-0.5" />
                   </button>
                   <button
                     type="button"
                     onClick={() => setShowHarmonicGuideModal(true)}
                     className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-gradient-to-r from-brand/25 via-sky-500/25 to-blue-500/25 hover:from-brand/35 hover:to-blue-500/35 text-brand dark:text-sky-300 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-brand/50 shadow-md shadow-brand/20 ring-1 ring-brand/30 min-h-[34px] sm:min-h-[38px]"
                     title="Consultar Guia & Quadro de Fun√ß√µes Harm√¥nicas"
                   >
                     <HelpCircle size={14} className="animate-pulse shrink-0" />
                     <span className="uppercase text-[10px] sm:text-[11px] tracking-wider font-extrabold">Guia</span>
                   </button>
                   <button
                     type="button"
                     onClick={() => setShowDynamicsGuideModal(true)}
                     className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-gradient-to-r from-rose-500/25 via-orange-500/25 to-amber-500/25 hover:from-rose-500/35 hover:to-amber-500/35 text-rose-500 dark:text-rose-300 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-rose-500/50 shadow-md shadow-rose-500/20 ring-1 ring-rose-500/30 min-h-[34px] sm:min-h-[38px]"
                     title="Guia de Din√¢micas & Express√£o Musical"
                   >
                     <Flame size={14} className="text-amber-500 dark:text-amber-400 animate-pulse shrink-0" />
                     <span className="uppercase text-[10px] sm:text-[11px] tracking-wider font-extrabold">Din√¢micas</span>
                   </button>
                   <button
                     type="button"
                     onClick={() => setShowFootswitchModal(true)}
                     className={cn(
                       "px-2 sm:px-3 py-1 sm:py-2 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border shadow-md min-h-[34px] sm:min-h-[38px]",
                       activePedalButton
                         ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white border-emerald-300 shadow-[0_0_28px_rgba(16,185,129,0.95)] ring-2 ring-emerald-300 scale-105"
                         : footswitchConfig.enabled
                         ? "bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-cyan-500/25 hover:from-emerald-500/35 hover:to-cyan-500/35 text-emerald-600 dark:text-emerald-300 border-emerald-500/50 shadow-emerald-500/20 ring-1 ring-emerald-500/30"
                         : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-muted border-border/50"
                     )}
                     title="Configurar Pedal Bluetooth & MIDI Footswitch"
                   >
                     <BossPedalIcon
                       size={17}
                       className={cn(
                         "shrink-0 transition-all duration-300",
                         activePedalButton
                           ? "scale-125 text-white drop-shadow-[0_0_12px_rgba(255,255,255,1)]"
                           : footswitchConfig.enabled
                           ? "animate-pulse text-emerald-500 dark:text-emerald-400"
                           : ""
                       )}
                     />
                     <span className="uppercase text-[10px] sm:text-[11px] tracking-wider font-extrabold">
                       {activePedalButton ? `[${activePedalButton}]` : "Pedal"}
                     </span>
                   </button>
                 </div>

               </div>
             </div>

             {/* Compasso (posicionado √† direita, ap√≥s Vis√£o Harm√¥nica) */}
             <div className="flex flex-col items-center min-w-[44px] sm:min-w-[58px]">
               <span className="text-[9px] sm:text-[11px] text-text-muted font-black uppercase tracking-widest mb-1">Comp.</span>
               <button
                 type="button"
                 onClick={() => setShowTimeSignatureMenu(true)}
                 className={cn(
                   "px-1.5 sm:px-2.5 py-1.5 rounded-lg border leading-tight min-h-[38px] sm:min-h-[46px] flex flex-col items-center justify-center text-center shadow-lg w-full transition-all active:scale-95 cursor-pointer outline-none select-none group",
                   (editedSong.timeSignature || '4/4') !== originalTimeSignature
                     ? "bg-amber-500 text-black border-amber-400 hover:bg-amber-400 shadow-amber-500/20"
                     : "bg-brand hover:bg-brand/90 text-white border-brand/30 shadow-brand/10 hover:brightness-110"
                 )}
                 title="M√©trica / Compasso (Toque para alterar entre 3/4, 6/8, 6/9 ou voltar ao original)"
               >
                 <TimeSignatureDisplay 
                   value={editedSong.timeSignature || song?.timeSignature || '4/4'} 
                   className={cn(
                     "scale-75 sm:scale-100 group-hover:scale-105 transition-transform",
                     (editedSong.timeSignature || '4/4') !== originalTimeSignature ? "text-black font-black" : "text-white font-black"
                   )} 
                 />
               </button>
             </div>

             {/* BPM (posicionado √† direita, ap√≥s Vis√£o Harm√¥nica) */}
             <div className="flex flex-col items-center min-w-[44px] sm:min-w-[58px]">
                <span className="text-[9px] sm:text-[11px] text-text-muted font-black uppercase tracking-widest mb-1">BPM</span>
                <button
                  type="button"
                  onClick={() => setShowBpmMenu(true)}
                  className={cn(
                    "px-1.5 sm:px-2.5 py-1.5 rounded-lg border leading-none min-h-[38px] sm:min-h-[46px] flex flex-col items-center justify-center w-full shadow-lg transition-all active:scale-95 cursor-pointer outline-none select-none group",
                    (editedSong.bpm || 80) !== originalBpmValue
                      ? "bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/30 shadow-amber-500/10"
                      : "bg-brand hover:bg-brand/90 text-white border-brand/30 shadow-brand/10 hover:brightness-110"
                  )}
                  title="Andamento / BPM (Toque para ajuste r√°pido, Tap Tempo ou voltar ao original)"
                >
                  <span className={cn(
                    "text-base sm:text-2xl font-black group-hover:scale-105 transition-transform",
                    (editedSong.bpm || 80) !== originalBpmValue ? "text-amber-500 dark:text-amber-400" : "text-white"
                  )}>
                    {editedSong.bpm || originalBpmValue}
                  </span>
                </button>
             </div>

             {/* Dividir Colunas (Layout) */}
             <div className="flex flex-col items-center">
               <span className="text-[9px] sm:text-[11px] text-text-muted font-black uppercase tracking-widest mb-1">Layout</span>
               <button 
                 onClick={() => {
                   setNumColumns(prev => prev === 1 ? 2 : 1);
                   setHasManuallyToggledColumns(true);
                 }}
                 className={cn(
                   "px-2 sm:px-3 rounded-lg border border-black/10 dark:border-white/20 leading-none min-h-[38px] sm:min-h-[46px] flex items-center justify-center shadow-lg active:scale-95 transition-all outline-none",
                   numColumns === 2
                     ? "bg-cyan-500 text-white"
                     : "bg-black/5 dark:bg-white/10 text-text-main hover:bg-black/10 dark:hover:bg-white/20"
                 )}
                 title={numColumns === 2 ? "Desativar Modo de 2 Colunas" : "Dividir cifra em 2 Colunas (Recomendado para Tablet e Notebook)"}
               >
                 <Columns size={16} className="sm:w-5 sm:h-5" />
               </button>
             </div>
          </div>{/* A√ß√µes: Expandir Tela (anteriormente Youtube), Editar, Lixeira */}
           <div className="flex items-center gap-3">
             {!isEditing && (
               <>
                 <button 
                   onClick={() => setIsFullscreen(!isFullscreen)} 
                   style={{ display: 'none' }} title=""
                   className={cn(
                     "h-11 w-11 sm:h-12 sm:w-12 bg-black/5 dark:bg-white/10 border border-border shadow-lg rounded-lg flex items-center justify-center transition-all active:scale-95 shrink-0",
                     isFullscreen 
                       ? "text-brand hover:bg-brand/10 bg-brand/10 dark:bg-brand/20 border-brand/20" 
                       : "text-text-main hover:bg-black/10 dark:hover:bg-white/20"
                   )}
                 >
                   {isFullscreen ? <Minimize2 size={20} strokeWidth={3} /> : <Maximize2 size={20} strokeWidth={3} />}
                 </button>
               </>
             )}
             
             {isAdmin && (
               <>
                 <Button 
                   variant="ghost" 
                   onClick={handleToggleEdit} 
                   className="h-11 w-11 sm:h-12 sm:w-12 bg-black/5 dark:bg-white/10 border border-border text-text-main hover:bg-black/10 dark:hover:bg-white/20 p-0 rounded-lg flex items-center justify-center shrink-0"
                 >
                   <Edit size={20}/>
                 </Button>
 
                 <ConfirmButton 
                   onConfirm={async () => {
                     const songPath = `songs/${song.id}`;
                     try {
                       await deleteDoc(doc(db, 'songs', song.id)); 
                       onBack(); 
                     } catch (error) {
                       handleFirestoreError(error, OperationType.DELETE, songPath);
                     }
                   }} 
                   className="h-11 w-11 sm:h-12 sm:w-12 bg-black/5 dark:bg-white/10 border border-border text-red-500 hover:bg-red-500/10 p-0 rounded-lg flex items-center justify-center shrink-0"
                 >
                   <Trash2 size={20}/>
                 </ConfirmButton>
               </>
             )}
           </div>
        </div>

      </div>

      <div className="w-full max-w-xl text-left">
        <ContextualHelp 
          id="song_detail"
          title="Cifras: Como estudar e usar?"
          description="O visualizador inteligente possui ferramentas de alta performance dispostas da esquerda para a direita no painel para auxiliar no seu ensaio em casa ou na hora da ministra√ß√£o."
          steps={[
            "MODO FOCO: Toque em 'FOCO' para ativar a visualiza√ß√£o em tela cheia com alto contraste e fonte otimizada para palco e celulares.",
            "TRANSPOSI√á√ÉO (TOM): Toque no tom atual para abrir o menu de transposi√ß√£o e alterar o tom de toda a cifra instantaneamente.",
            "CAPOTRASTE (CAPO): Toque no bot√£o de Capo para abrir a caixa de posi√ß√µes (1¬™ √† 12¬™ casa). O tom real √© mantido enquanto os acordes (shapes) s√£o recalculados para facilitar a execu√ß√£o.",
            "VIS√ÉO HARM√îNICA: Toque para abrir a caixa de op√ß√µes e escolher entre Cifra tradicional, Graus do Campo Harm√¥nico (I, V, VIm) ou Fun√ß√µes Harm√¥nicas (T√¥n, Dom, Rel). Clique no bot√£o (?) ao lado para ver o quadro explicativo.",
            "DIN√ÇMICA & EXPRESS√ÉO: Marcadores visuais de intensidade (Sutil, Cl√≠max, Crescendo ‚Üó, Acapella üé§, etc.) guiam a inten√ß√£o da banda durante o louvor. Clique no bot√£o de atalho (üî•) para abrir o guia completo.",
            "PEDAL BLUETOOTH & MIDI: Toque no bot√£o PEDAL na barra superior para conectar e configurar pedais Bluetooth (PageTurner, AirTurn, Boss) e footswitches MIDI para avan√ßar estrofes ou controlar a rolagem sem usar as m√£os.",
            "COMPASSO & BPM: Toque no Compasso para escolher entre m√©tricas (4/4, 3/4, 6/8, 6/9 etc.) ou voltar ao original. Toque no BPM para ajustar a velocidade, usar o Tap Tempo ou resetar para o BPM original da m√∫sica.",
            "DIVIDIR COLUNAS (LAYOUT): Alterne a exibi√ß√£o entre 1 ou 2 colunas para melhor aproveitamento da tela em tablets, celulares e notebooks.",
            "ROLAGEM AUTOM√ÅTICA: Ative o scroll autom√°tico com ajuste de velocidade para acompanhar a cifra sem precisar tocar na tela enquanto toca.",
            "TAMANHO DO TEXTO: Utilize os bot√µes de ajuste de fonte (A- e A+) para aumentar ou diminuir o tamanho dos acordes e da letra para facilitar a leitura √† dist√¢ncia.",
            "VISUALIZA√á√ÉO DE ACORDES: Escolha entre ver a posi√ß√£o dos Dedos ou os Intervalos (T, 3, 5, 7m, 7M) no bra√ßo do viol√£o. Toque sobre qualquer acorde na letra para ver o diagrama instantaneamente."
          ]}
          specialSteps={[
            "FUNDAMENTA√á√ÉO B√çBLICA: Ative a ferramenta para ver quais passagens e textos b√≠blicos d√£o base teol√≥gica para a letra desse louvor.",
            "SUGEST√ïES DO MESMO TEMA: Pe√ßa √† IA sugest√µes de outros louvores semelhantes para enriquecer o repert√≥rio do seu culto.",
            "APRENDA COM A M√öSICA: Expanda o painel de Harmonia para ver uma an√°lise te√≥rica rica das progress√µes e fun√ß√µes harm√¥nicas da composi√ß√£o."
          ]}
          tip="Voc√™ pode usar um pedal de virada de p√°gina bluetooth compat√≠vel no Modo Culto para avan√ßar as estrofes!"
          theme={theme}
        />
      </div>



      <div className="grid lg:grid-cols-12 gap-8 items-start w-full max-w-full">
        <div className="lg:col-span-8 space-y-4 min-w-0 w-full overflow-hidden">
          <div className="flex bg-card rounded-t-xl border border-border border-b-0 items-center">
              <div className="flex overflow-x-auto no-scrollbar flex-1 scroll-smooth">
                <button 
                  onClick={() => setDetailTab('chords')} 
                  className={cn(
                    "px-4 sm:px-8 py-4 text-sm sm:text-base font-bold uppercase transition-all border-r border-border whitespace-nowrap", 
                    detailTab === 'chords' 
                      ? "bg-brand text-white" 
                      : "text-text-main hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  Cifra
                </button>
                <button 
                  onClick={() => setDetailTab('lyrics')} 
                  className={cn(
                    "px-4 sm:px-8 py-4 text-sm sm:text-base font-bold uppercase transition-all border-r border-border whitespace-nowrap", 
                    detailTab === 'lyrics' 
                      ? "bg-brand text-white" 
                      : "text-text-main hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  Letra
                </button>
              </div>
              
              <div className="relative flex items-center gap-1 sm:gap-1.5 mr-2 border-l border-border pl-2 sm:pl-4 ml-auto h-full py-2">
                <button 
                  onClick={() => {
                    setIsAutoScrolling(!isAutoScrolling);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 sm:px-4 py-3 rounded-full text-xs sm:text-sm font-black uppercase transition-all border shrink-0 shadow-lg",
                    isAutoScrolling 
                      ? "bg-green-500 border-green-400 text-white ring-2 ring-white/20" 
                      : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border-black/10 dark:border-white/20 text-text-main"
                    )}
                  title="Rolagem Autom√°tica"
                >
                  <ChevronsDown size={14} className={cn("sm:w-4 sm:h-4", isAutoScrolling && "animate-bounce")} strokeWidth={3} />
                  <span className="hidden xs:inline">{isAutoScrolling ? 'Pausar' : 'AutoScroll'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSpeedSelector(!showSpeedSelector)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 sm:px-3 py-3 rounded-full text-[10px] font-black uppercase transition-all border shrink-0 shadow-lg h-9 sm:h-11",
                    showSpeedSelector
                      ? "bg-cyan-500 border-cyan-400 text-white ring-2 ring-white/10"
                      : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border-black/10 dark:border-white/20 text-text-main"
                  )}
                  title="Ajustar Velocidade de Rolagem"
                >
                  <Settings size={12} className={cn("sm:w-3.5 sm:h-3.5", showSpeedSelector && "rotate-45")} />
                  <span className="text-[9px] font-black tracking-tighter">
                    {isSmartScroll ? 'AUTO' : `${scrollSpeed}x`}
                  </span>
                </button>
                {showSpeedSelector && (
                  <div className={cn(
                    "absolute top-full right-0 mt-2 z-[999] flex flex-col border rounded-xl p-3 shadow-2xl min-w-[210px] gap-2.5 opacity-100 select-none",
                    isStageMode 
                      ? "bg-zinc-950 border-amber-500/50 text-white shadow-[0_10px_35px_rgba(0,0,0,0.95)]" 
                      : "bg-surface dark:bg-zinc-900 border-border text-text-main"
                  )}>
                    <div className={cn(
                      "flex items-center justify-between p-2 rounded-lg border select-none",
                      isStageMode ? "bg-zinc-900 border-amber-500/30" : "bg-black/10 dark:bg-white/10 border-border/60"
                    )}>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          ‚ú® Auto Inteligente
                        </span>
                        <span className="text-[8px] text-text-muted leading-none flex gap-1 mt-0.5">Ajusta pelo BPM do Louvor</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSmartScroll(!isSmartScroll);
                        }}
                        className={cn(
                          "w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 cursor-pointer outline-none relative shrink-0",
                          isSmartScroll ? "bg-cyan-500 justify-end" : "bg-border dark:bg-zinc-700 justify-start"
                        )}
                        title="Alternar Modo de Rolagem Inteligente"
                      >
                        <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md pointer-events-none" />
                      </button>
                    </div>

                    <div className="h-px bg-border/40 my-0.5" />

                    <div className="px-1 text-left">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Ajuste Manual</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {[0.1, 0.2, 0.3, 0.5, 1, 1.5].map((speed) => {
                        const isActive = !isSmartScroll && scrollSpeed === speed;
                        return (
                          <button
                            type="button"
                            key={speed}
                            onClick={() => {
                              setIsSmartScroll(false);
                              setScrollSpeed(speed);
                              setShowSpeedSelector(false);
                            }}
                            className={cn(
                              "px-2 py-2 rounded-lg text-xs font-black transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer border",
                              isActive 
                                ? "bg-cyan-500 border-cyan-400 text-white shadow-md shadow-cyan-500/30 font-black" 
                                : isStageMode
                                  ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white"
                                  : "bg-black/5 dark:bg-white/10 border-border/60 text-text-main hover:bg-black/10 dark:hover:bg-white/20"
                            )}
                          >
                            <span>{speed}x</span>
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                          </button>
                        );
                      })}
                    </div>

                    {isSmartScroll && (
                      <div className="text-center p-1.5 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-lg select-none">
                        <p className="text-[8.5px] font-bold uppercase tracking-wider">
                          Velocidade: {scrollSpeed}x
                        </p>
                        <p className="text-[7.5px] text-text-muted leading-none mt-0.5">Din√¢mica ({editedSong.bpm || 80} BPM)</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center px-1 pt-1.5 border-t border-border/40">
                      <span className="text-[7.5px] text-text-muted italic leading-none select-none">Prefira Autom√°tico</span>
                      <button
                        type="button"
                        onClick={() => setShowSpeedSelector(false)}
                        className="text-[9px] font-black uppercase tracking-wider text-cyan-500 hover:text-cyan-400 active:scale-95 leading-none"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </div>



             {(detailTab === 'chords' || detailTab === 'lyrics') && (
               <div className="flex border-l border-border bg-black/5 dark:bg-white/10 items-center px-1.5 sm:px-3 gap-1.5 sm:gap-2 self-stretch">
                 {/* Column Layout Selector */} <div style={{ display: 'none' }}>
                 <button 
                   onClick={() => {
                     setNumColumns(prev => prev === 1 ? 2 : 1);
                     setHasManuallyToggledColumns(true);
                   }}
                   className={cn(
                     "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition-all border border-black/10 dark:border-white/20 shadow-sm active:scale-90",
                     numColumns === 2
                       ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                       : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-muted"
                   )}
                   title={numColumns === 2 ? "Desativar Modo de 2 Colunas" : "Dividir cifra em 2 Colunas (Recomendado para Tablet e Notebook)"}
                 >
                   <Columns size={14} className={cn("sm:w-4 sm:h-4")} />
                 </button>

                 </div>

                 <button 
                   onClick={() => setSongFontSize(prev => Math.max(10, prev - 2))}
                   className={cn(
                     "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition-all border shadow-sm active:scale-90",
                     isStageMode
                       ? "bg-zinc-900 border-amber-500/30 text-white hover:bg-zinc-800"
                       : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-main border-black/10 dark:border-white/20"
                   )}
                   title="Diminuir Fonte"
                 >
                   <Minus size={15} strokeWidth={3} />
                 </button>
                 {/* Modo Palco Toggle */}
                 <button 
                   type="button"
                   onClick={toggleStageMode}
                   className={cn(
                     "h-7 sm:h-8 px-2 sm:px-2.5 flex items-center justify-center gap-1 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all border shadow-xs active:scale-90 cursor-pointer shrink-0",
                     isStageMode
                       ? "bg-amber-500 border-amber-400 text-black shadow-amber-500/20 font-black"
                       : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-muted border-black/10 dark:border-white/20"
                   )}
                   title={isStageMode ? "Desativar Modo Palco (Alto Contraste OLED)" : "Ativar Modo Palco (Alto Contraste OLED)"}
                 >
                   <Sparkles size={12} className={isStageMode ? "text-black fill-black" : "text-amber-500"} />
                   <span className="hidden sm:inline">Palco</span>
                 </button>

                 <div className="w-6 h-6 sm:w-8 sm:h-8 flex flex-col items-center justify-center select-none leading-none">
                   <span className={cn("text-[7.5px] font-black tracking-tighter uppercase", isStageMode ? "text-amber-400/80" : "text-text-muted")}>ZOOM</span>
                   <span className={cn("font-mono font-black text-[11px] sm:text-xs leading-none mt-0.5", isStageMode ? "text-amber-400" : "text-text-main")}>{songFontSize}</span>
                 </div>
                 <button 
                   onClick={() => setSongFontSize(prev => Math.min(60, prev + 2))}
                   className={cn(
                     "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition-all border shadow-sm active:scale-90",
                     isStageMode
                       ? "bg-zinc-900 border-amber-500/30 text-white hover:bg-zinc-800"
                       : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-main border-black/10 dark:border-white/20"
                   )}
                   title="Aumentar Fonte"
                 >
                   <Plus size={15} strokeWidth={3} />
                 </button>
               </div>
             )}


          </div>

          <div 
            id="song-scroll-container"
            className={cn(
              isFullscreen 
                ? "fixed inset-0 z-[100] bg-surface p-4 sm:p-8 overflow-auto" 
                : "relative max-h-[66vh] sm:max-h-[72vh] overflow-auto custom-scrollbar rounded-b-xl border border-t-0 border-border/80"
            )}
          >
            {isFullscreen && (
              <button 
                onClick={() => setIsFullscreen(false)}
                className="fixed top-4 right-4 z-[110] p-2.5 bg-red-500 text-white rounded-full shadow-2xl hover:bg-red-600 transition-all active:scale-95 flex items-center justify-center"
                title="Fechar Tela Cheia"
              >
                <Minimize2 size={20} />
              </button>
            )}
            
            <div className="notranslate" translate="no">
              <Card className={cn(
                "font-mono leading-relaxed shadow-xl border-border overflow-x-auto bg-card backdrop-blur-md relative text-text-main custom-scrollbar",
                isFullscreen ? "min-h-full w-full border-none shadow-none" : "min-h-[60vh] rounded-t-none"
              )} 
              style={{ letterSpacing: '0', fontVariantNumeric: 'tabular-nums' }}>
              {isFullscreen && (
                <div className="mb-6 border-b border-border pb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ArtistAvatar artist={song.artist} customImageUrl={song.artistImageUrl} size="md" />
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-text-main mb-1">{song.title}</h2>
                      <p className="text-sm text-text-muted italic">{song.artist}</p>
                    </div>
                  </div>
                  
                  {/* Floating Compact Controls Toolbar in Fullscreen Mode */}
                  <div className="flex flex-wrap items-center gap-2 lg:gap-3 bg-black/10 dark:bg-white/5 border border-border/60 p-2 rounded-xl backdrop-blur-md">
                    
                    {/* Tom (Transpose) */}
                    {editedSong.baseKey && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowKeyMenu(!showKeyMenu)}
                          className="bg-brand text-white px-3 py-1.5 rounded-lg border border-white/20 text-xs font-black uppercase flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all outline-none"
                        >
                          <span>Tom: {currentKey}{isCapoEnabled && shapeKey && shapeKey !== currentKey ? ` (Shape: ${shapeKey})` : ''}</span>
                        </button>
                      </div>
                    )}

                    <div className="h-6 w-px bg-border/50" />

                    {/* Zoom / Font Size */}
                    <div className="flex items-center gap-1.5">
                      <button 
                        type="button"
                        onClick={() => setSongFontSize(prev => Math.max(10, prev - 2))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 text-text-main transition-all border border-border"
                        title="Diminuir Fonte"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <div className="flex flex-col items-center justify-center select-none leading-none px-1">
                        <span className="text-[7px] text-text-muted font-black tracking-tighter uppercase">ZOOM</span>
                        <span className="font-mono font-black text-xs text-text-main leading-none mt-0.5">{songFontSize}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSongFontSize(prev => Math.min(60, prev + 2))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 text-text-main transition-all border border-border"
                        title="Aumentar Fonte"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>

                    <div className="h-6 w-px bg-border/50" />

                    {/* Modo Palco Toggle */}
                    <button
                      type="button"
                      onClick={toggleStageMode}
                      className={cn(
                        "h-8 px-2.5 flex items-center justify-center gap-1.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all border shrink-0 shadow-sm cursor-pointer",
                        isStageMode
                          ? "bg-amber-500 border-amber-400 text-black shadow-amber-500/20 font-black"
                          : "bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 border-border text-text-main"
                      )}
                      title={isStageMode ? "Desativar Modo Palco (Alto Contraste OLED)" : "Ativar Modo Palco (Alto Contraste OLED)"}
                    >
                      <Sparkles size={13} className={isStageMode ? "text-black fill-black" : "text-amber-500"} />
                      <span>Palco</span>
                    </button>

                    <div className="h-6 w-px bg-border/50" />

                    {/* Columns (Layout) */}
                    <button 
                      type="button"
                      onClick={() => {
                        setNumColumns(prev => prev === 1 ? 2 : 1);
                        setHasManuallyToggledColumns(true);
                      }}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg transition-all border shrink-0",
                        numColumns === 2
                          ? "bg-cyan-500 border-cyan-400 text-white"
                          : "bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 border-border text-text-main"
                      )}
                      title={numColumns === 2 ? "Desativar Modo de 2 Colunas" : "Dividir cifra em 2 Colunas"}
                    >
                      <Columns size={14} />
                    </button>

                    <div className="h-6 w-px bg-border/50" />

                    {/* AutoScroll */}
                    <div className="flex items-center gap-1.5 relative">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsAutoScrolling(!isAutoScrolling);
                        }}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all border shrink-0 shadow-sm",
                          isAutoScrolling 
                            ? "bg-green-500 border-green-400 text-white" 
                            : "bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 border-border text-text-main"
                        )}
                        title="Rolagem Autom√°tica"
                      >
                        <ChevronsDown size={12} className={cn(isAutoScrolling && "animate-bounce")} strokeWidth={3} />
                        <span>{isAutoScrolling ? 'Pausa' : 'Scroll'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowSpeedSelector(!showSpeedSelector)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border shrink-0",
                          showSpeedSelector
                            ? "bg-cyan-500 border-cyan-400 text-white"
                            : "bg-black/20 dark:bg-white/10 border-border text-text-main"
                        )}
                      >
                        <span>{isSmartScroll ? 'AUTO' : `${scrollSpeed}x`}</span>
                      </button>

                      {showSpeedSelector && (
                        <div className={cn(
                          "absolute bottom-full right-0 mb-2 z-[120] flex flex-col border rounded-xl p-3 shadow-2xl min-w-[210px] gap-2.5 opacity-100 select-none",
                          isStageMode 
                            ? "bg-zinc-950 border-amber-500/50 text-white shadow-[0_10px_35px_rgba(0,0,0,0.95)]" 
                            : "bg-surface dark:bg-zinc-900 border-border text-text-main"
                        )}>
                          <div className={cn(
                            "flex items-center justify-between p-2 rounded-lg border select-none",
                            isStageMode ? "bg-zinc-900 border-amber-500/30" : "bg-black/10 dark:bg-white/10 border-border/60"
                          )}>
                            <div className="flex flex-col text-left">
                              <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                ‚ú® Auto Inteligente
                              </span>
                              <span className="text-[8px] text-text-muted leading-none flex gap-1 mt-0.5">Pelo BPM ({editedSong.bpm || 80})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsSmartScroll(!isSmartScroll)}
                              className={cn(
                                "w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 cursor-pointer outline-none relative shrink-0",
                                isSmartScroll ? "bg-cyan-500 justify-end" : "bg-border dark:bg-zinc-700 justify-start"
                              )}
                            >
                              <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md pointer-events-none" />
                            </button>
                          </div>
                          
                          <div className="h-px bg-border/40 my-0.5" />
                          
                          <div className="grid grid-cols-2 gap-1.5">
                            {[0.1, 0.2, 0.3, 0.5, 1, 1.5].map((speed) => {
                              const isActive = !isSmartScroll && scrollSpeed === speed;
                              return (
                                <button
                                  type="button"
                                  key={speed}
                                  onClick={() => {
                                    setIsSmartScroll(false);
                                    setScrollSpeed(speed);
                                    setShowSpeedSelector(false);
                                  }}
                                  className={cn(
                                    "px-2 py-2 rounded-lg text-xs font-black transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer border",
                                    isActive 
                                      ? "bg-cyan-500 border-cyan-400 text-white shadow-md shadow-cyan-500/30 font-black" 
                                      : isStageMode
                                        ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white"
                                        : "bg-black/5 dark:bg-white/10 border-border/60 text-text-main hover:bg-black/10 dark:hover:bg-white/20"
                                  )}
                                >
                                  <span>{speed}x</span>
                                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            {detailTab === 'chords' && (
              isEditing ? (
                <div className="space-y-4">
                  {/* Sincroniza√ß√£o e Importa√ß√£o Cifra Club */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 space-y-3.5 shadow-sm">
                    {/* Sincroniza√ß√£o via Link Direto */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Music size={14} className="text-emerald-500" />
                        <span className="font-bold text-xs text-text-main uppercase tracking-wider">Sincronizar direto de link do Cifra Club</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          placeholder="Cole o link do Cifra Club (Ex: https://www.cifraclub.com.br/...)"
                          value={editCifraClubUrl}
                          onChange={(e) => setEditCifraClubUrl(e.target.value)}
                          disabled={isImportingCifra}
                          className="w-full sm:flex-1 h-20 sm:h-18 px-4 rounded-xl border border-border bg-black/10 dark:bg-zinc-900/40 text-text-main placeholder-text-muted focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleImportFromCifraClub()}
                          disabled={isImportingCifra}
                          className={cn(
                            "w-full sm:w-auto h-11 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all select-none border flex items-center justify-center gap-1.5 shrink-0",
                            isImportingCifra
                              ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 border-emerald-500/20 cursor-pointer"
                          )}
                        >
                          {isImportingCifra ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Importando...</span>
                            </>
                          ) : (
                            <>
                              <Download size={14} />
                              <span>Importar do Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {autofillSuccess && (
                    <p className="text-[11px] font-bold text-green-500 bg-green-500/10 p-2 rounded-lg border border-green-500/15">{autofillSuccess}</p>
                  )}
                  {autofillError && (
                    <p className="text-[11px] font-bold text-red-500 bg-red-500/10 p-2 rounded-lg border border-red-500/15">{autofillError}</p>
                  )}
                  <div className="p-4 bg-black/5 dark:bg-white/5 border border-border/60 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-brand uppercase tracking-wider">Formatador de Cifra</p>
                        <p className="text-[11px] text-text-muted">Selecione o texto e clique em um bot√£o para aplicar a formata√ß√£o no editor abaixo:</p>
                      </div>
                      <div className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/5 px-2 py-1 rounded border border-yellow-500/15 text-right self-start sm:self-center">
                        üí° Mantenha os acordes alinhados sobre a letra!
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40">
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('bold')}
                        className="p-2 bg-card hover:bg-black/5 dark:hover:bg-white/10 text-text-main hover:text-brand border border-border rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold"
                        title="Negrito (<b>texto</b>)"
                      >
                        <Bold size={14} strokeWidth={2.5} />
                        Negrito
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('italic')}
                        className="p-2 bg-card hover:bg-black/5 dark:hover:bg-white/10 text-text-main hover:text-brand border border-border rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold"
                        title="It√°lico (<i>texto</i>)"
                      >
                        <Italic size={14} strokeWidth={2.5} />
                        It√°lico
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('underline')}
                        className="p-2 bg-card hover:bg-black/5 dark:hover:bg-white/10 text-text-main hover:text-brand border border-border rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold"
                        title="Sublinhado (<u>texto</u>)"
                      >
                        <Underline size={14} strokeWidth={2.5} />
                        Sublinhado
                      </button>
                      
                      <div className="h-6 w-px bg-border/50 self-center mx-1" />
                      
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('brackets')}
                        className="p-2 bg-card hover:bg-black/5 dark:hover:bg-white/10 text-text-main hover:text-brand border border-border rounded-lg transition-all flex items-center gap-1.5 text-xs font-mono font-bold"
                        title="Colchetes [ texto ]"
                      >
                        <span className="text-brand">[ ]</span>
                        Colchetes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('braces')}
                        className="p-2 bg-card hover:bg-black/5 dark:hover:bg-white/10 text-text-main hover:text-brand border border-border rounded-lg transition-all flex items-center gap-1.5 text-xs font-mono font-bold"
                        title="Chaves { texto }"
                      >
                        <span className="text-brand">{"{ }"}</span>
                        Chaves
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const cleaned = cleanCifraHtml(editedSong.chords || '');
                          setEditedSong({ ...editedSong, chords: cleaned });
                        }}
                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        title="Limpar tags HTML coladas do Cifra Club / Web"
                      >
                        <Sparkles size={14} className="text-emerald-500" />
                        Limpar Cifra HTML
                      </button>

                      <div className="h-6 w-px bg-border/50 self-center mx-1 shrink-0" />

                      <div className="flex flex-col gap-1.5 w-full pt-0.5">
                        {/* Se√ß√µes da M√∫sica */}
                        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
                          <span className="text-[10px] font-bold text-text-muted uppercase shrink-0 flex items-center gap-1 mr-0.5">
                            <Music size={12} className="text-brand" /> Se√ß√µes:
                          </span>
                          {SECTIONS_FOR_QUICK_INSERT.map((sec) => (
                            <button
                              key={`chord-sec-${sec.tag}`}
                              type="button"
                              onClick={() => handleInsertSectionTag(sec.tag, 'chords')}
                              className="px-2 py-0.5 bg-gradient-to-r from-brand to-cyan-500 hover:from-brand-dark hover:to-cyan-600 text-white border border-brand/30 rounded-md transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95 flex items-center gap-1"
                              title={`Inserir [${sec.tag}]`}
                            >
                              + {sec.label}
                            </button>
                          ))}
                        </div>

                        {/* Din√¢micas */}
                        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5 border-t border-border/30 pt-1">
                          <span className="text-[10px] font-bold text-text-muted uppercase shrink-0 flex items-center gap-1">
                            <Flame size={12} className="text-rose-500" /> Din√¢micas:
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowDynamicsGuideModal(true)}
                            className="px-2.5 py-1 bg-gradient-to-r from-rose-500/25 via-orange-500/25 to-amber-500/25 hover:from-rose-500/35 hover:to-amber-500/35 text-rose-400 dark:text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-500/20 ring-1 ring-rose-500/30 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 cursor-pointer flex items-center gap-1 transition-all mr-1.5"
                            title="Abrir Guia de Din√¢mica e Express√£o de Louvor"
                          >
                            <HelpCircle size={11} className="animate-pulse text-amber-400" />
                            <span>Guia</span>
                          </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('N1 üåë Sutil', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border border-indigo-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="N1 üåë Sutil"
                        >
                          + N1 üåë Sutil
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('N2 üåò Bem Suave', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="N2 üåò Bem Suave"
                        >
                          + N2 üåò Bem Suave
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('N3 üåó Suave', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white border border-teal-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="N3 üåó Suave"
                        >
                          + N3 üåó Suave
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('N4 üåñ Moderado', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-sky-600 to-blue-600 text-white border border-sky-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="N4 üåñ Moderado"
                        >
                          + N4 üåñ Moderado
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('N5 üåï Meio Forte', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-300/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="N5 üåï Meio Forte"
                        >
                          + N5 üåï Meio Forte
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('N6 üî• Forte', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-orange-600 to-red-500 text-white border border-orange-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="N6 üî• Forte"
                        >
                          + N6 üî• Forte
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('N7 ‚ö° Cl√≠max', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 text-white border border-rose-300/50 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="N7 ‚ö° Cl√≠max"
                        >
                          + N7 ‚ö° Cl√≠max
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('Crescendo ‚Üó', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white border border-violet-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                        >
                          + Crescendo ‚Üó
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('Decrescendo ‚Üò', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-yellow-600 text-white border border-amber-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                        >
                          + Decrescendo ‚Üò
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('Pausa üõë', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-red-600 text-white border border-rose-400/50 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="Pausa / Interrup√ß√£o (üõë)"
                        >
                          + Pausa üõë
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('Acapella üé§', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-teal-600 text-white border border-cyan-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                        >
                          + Acapella üé§
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('S√≥ Bateria ü•Å', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white border border-orange-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                        >
                          + S√≥ Bateria ü•Å
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('Viol√£o Marcando üé∏', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-500 text-white border border-amber-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                        >
                          + Viol√£o Marcando üé∏
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('Sobe o Tom üìà', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 text-white border border-fuchsia-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="Sobe o Tom / Modula√ß√£o (üìà)"
                        >
                          + Sobe o Tom üìà
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('s√≥ guita', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white border border-amber-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="Inserir tag [s√≥ guita]"
                        >
                          + [s√≥ guita] üé∏
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertCustomDynamicsTag('chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-brand via-indigo-600 to-purple-600 text-white border border-brand/40 rounded-lg transition-all text-[10px] font-mono font-black shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95 flex items-center gap-1"
                          title="Inserir tag de din√¢mica customizada em colchetes [...]"
                        >
                          <Plus size={10} /> [Customizar...]
                        </button>
                      </div>
                    </div>
                    </div>
                  </div>
                  <textarea 
                    ref={chordsTextareaRef}
                    className="w-full h-[65vh] border-none focus:ring-0 resize-none bg-black/5 dark:bg-white/5 p-6 rounded-xl text-text-main font-mono leading-normal scrollbar-hide border border-border/50 notranslate"
                    translate="no"
                    style={{ 
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", Courier, monospace',
                      fontSize: `${songFontSize}px`,
                      whiteSpace: 'pre',
                      overflowX: 'auto'
                    }}
                    value={editedSong.chords}
                    onChange={e => setEditedSong({...editedSong, chords: cleanChordText(e.target.value)})}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain') || '';
                      if (pasted && (pasted.includes('<') || pasted.includes('data-chord'))) {
                        e.preventDefault();
                        const cleaned = cleanCifraHtml(pasted);
                        const target = e.target as HTMLTextAreaElement;
                        const start = target.selectionStart || 0;
                        const end = target.selectionEnd || 0;
                        const cur = editedSong.chords || '';
                        const next = cur.substring(0, start) + cleaned + cur.substring(end);
                        setEditedSong({ ...editedSong, chords: cleanChordText(next) });
                      }
                    }}
                    onBeforeInput={handleChordBeforeInput}
                    onKeyDown={handleChordKeyDown}
                    placeholder="D9           Am7\nGra√ßa, qu√£o maravilhosa..."
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="none"
                    autoComplete="off"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {detailTab === 'chords' && availableChordsInSong.length > 0 && (
                    <div className="bg-card/40 backdrop-blur-md border border-border/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-sm notranslate" translate="no">
                      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1 max-w-full">
                        <span className="text-[10px] font-black uppercase text-text-muted tracking-wider shrink-0 flex items-center gap-1">
                          <Music2 size={12} className="text-brand" /> Acordes:
                        </span>
                        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
                          {availableChordsInSong.map(chord => {
                            const converted = convertSingleChordToHarmonicMode(chord, currentKey, harmonicDisplayMode);
                            const isConvertedDifferent = harmonicDisplayMode !== 'chords' && converted !== chord;

                            return (
                              <button
                                key={chord}
                                onClick={() => {
                                  setActiveChordInDict(chord);
                                }}
                                className={cn(
                                  "px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer shrink-0 active:scale-95 flex items-center gap-1",
                                  activeChordInDict === chord
                                    ? "bg-brand text-white border-brand shadow-sm font-black scale-105"
                                    : "bg-black/5 dark:bg-white/5 border-border text-text-main hover:bg-brand/10 hover:border-brand/30"
                                )}
                                title={`Ver desenho do acorde ${chord}`}
                              >
                                <span>{chord}</span>
                                {isConvertedDifferent && (
                                  <span className="text-[10px] opacity-85 font-black px-1.5 py-0.5 bg-brand/20 text-brand rounded">
                                    {converted}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div 
                    id="song-viewer-container"
                    className={cn(
                      "bg-card/20 backdrop-blur-md overflow-x-auto custom-scrollbar relative notranslate rounded-2xl border border-border/60 transition-all duration-300",
                      isStageMode && "stage-mode bg-black text-white border-amber-500/30 shadow-[0_0_35px_rgba(245,158,11,0.15)]",
                      isFullscreen ? "min-h-full p-8" : "min-h-[60vh] p-6"
                    )}
                    translate="no"
                  >
                  <style>
                    {`
                      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
                      
                      #song-scroll-container {
                        scroll-behavior: smooth !important;
                        transition: scroll-behavior 0.3s ease-in-out;
                      }

                      #song-viewer-container {
                        overflow-x: auto !important;
                        -webkit-overflow-scrolling: touch;
                        scroll-behavior: smooth !important;
                        transition: scroll-behavior 0.3s ease-in-out;
                        font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                      }

                      #song-viewer-container.stage-mode,
                      .stage-mode {
                        background-color: #000000 !important;
                        color: #ffffff !important;
                      }

                      #song-viewer-container.stage-mode,
                      #song-viewer-container.stage-mode div,
                      #song-viewer-container.stage-mode span,
                      #song-viewer-container.stage-mode p,
                      #song-viewer-container.stage-mode .text-text-main,
                      .light #song-viewer-container.stage-mode,
                      .light #song-viewer-container.stage-mode div,
                      .light #song-viewer-container.stage-mode span,
                      .light #song-viewer-container.stage-mode p,
                      .light #song-viewer-container.stage-mode .text-text-main,
                      .stage-mode,
                      .stage-mode div,
                      .stage-mode span,
                      .stage-mode p,
                      .stage-mode .text-text-main {
                        color: #ffffff !important;
                      }

                      #song-viewer-container.stage-mode .char-span,
                      #song-viewer-container.stage-mode div,
                      .stage-mode .char-span,
                      .stage-mode div {
                        font-weight: 600 !important;
                        text-shadow: 0 0 3px rgba(255, 255, 255, 0.3) !important;
                      }

                      #song-viewer-container.stage-mode .chord-line button,
                      #song-viewer-container.stage-mode .chord-btn,
                      .light #song-viewer-container.stage-mode .chord-line button,
                      .light #song-viewer-container.stage-mode .chord-btn,
                      .stage-mode .chord-line button,
                      .stage-mode .chord-btn {
                        color: #00f0ff !important;
                        background-color: rgba(0, 240, 255, 0.18) !important;
                        border: none !important;
                        outline: 1px solid rgba(0, 240, 255, 0.4) !important;
                        outline-offset: 0px !important;
                        font-weight: 900 !important;
                        letter-spacing: 0px !important;
                        padding: 0px !important;
                        margin: 0px !important;
                        border-radius: 3px !important;
                        text-shadow: 0 0 8px rgba(0, 240, 255, 0.8) !important;
                        box-sizing: border-box !important;
                        font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                      }

                      #song-viewer-container.stage-mode .chord-line button:hover,
                      #song-viewer-container.stage-mode .chord-btn:hover,
                      .light #song-viewer-container.stage-mode .chord-line button:hover,
                      .light #song-viewer-container.stage-mode .chord-btn:hover,
                      .stage-mode .chord-line button:hover,
                      .stage-mode .chord-btn:hover {
                        color: #ffffff !important;
                        background-color: rgba(0, 240, 255, 0.4) !important;
                        outline-color: #00f0ff !important;
                        box-shadow: 0 0 12px rgba(0, 240, 255, 0.9) !important;
                      }

                      #song-viewer-container.stage-mode .sec-badge,
                      .light #song-viewer-container.stage-mode .sec-badge,
                      .stage-mode .sec-badge {
                        background: linear-gradient(135deg, #f59e0b, #d97706) !important;
                        color: #000000 !important;
                        font-weight: 900 !important;
                        border-color: #fbbf24 !important;
                        box-shadow: 0 0 12px rgba(245, 158, 11, 0.5) !important;
                      }

                      #song-viewer-container.stage-mode .dyn-btn,
                      .light #song-viewer-container.stage-mode .dyn-btn,
                      .stage-mode .dyn-btn {
                        background: linear-gradient(135deg, #06b6d4, #0284c7) !important;
                        color: #ffffff !important;
                        font-weight: 900 !important;
                        border-color: #38bdf8 !important;
                        box-shadow: 0 0 10px rgba(6, 182, 212, 0.5) !important;
                      }

                      #song-viewer-container.stage-mode .text-amber-500,
                      #song-viewer-container.stage-mode .text-amber-400,
                      .light #song-viewer-container.stage-mode .text-amber-500,
                      .light #song-viewer-container.stage-mode .text-amber-400,
                      .stage-mode .text-amber-500,
                      .stage-mode .text-amber-400 {
                        color: #fbbf24 !important;
                        font-weight: 800 !important;
                      }

                      #song-viewer-container.stage-mode .text-cyan-500,
                      #song-viewer-container.stage-mode .text-cyan-400,
                      .light #song-viewer-container.stage-mode .text-cyan-500,
                      .light #song-viewer-container.stage-mode .text-cyan-400,
                      .stage-mode .text-cyan-500,
                      .stage-mode .text-cyan-400 {
                        color: #38bdf8 !important;
                        font-weight: 800 !important;
                      }
                      
                      /* Allow wrapping on standalone chord lines to prevent horizontal overflow */
                      #song-viewer-container .chord-line {
                        display: flex !important;
                        flex-direction: row !important;
                        flex-wrap: wrap !important;
                        white-space: pre !important;
                        word-break: keep-all !important;
                        overflow-wrap: normal !important;
                        font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                      }
                      
                      #song-viewer-container .chord-line .char-span { 
                        display: inline-block !important; 
                        width: 1ch !important; 
                        text-align: center !important;
                        white-space: pre !important;
                        word-break: keep-all !important;
                        overflow-wrap: normal !important;
                        font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                      }
                      
                      #song-viewer-container .chord-line button,
                      #song-viewer-container .chord-btn {
                        white-space: pre !important;
                        word-break: keep-all !important;
                        overflow-wrap: normal !important;
                        display: inline-block !important;
                        box-sizing: border-box !important;
                        padding: 0px !important;
                        margin: 0px !important;
                        border: none !important;
                        letter-spacing: 0px !important;
                        font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
                      }
                      
                      /* Enhanced contrast for chord buttons in dark mode wrapper (default) */
                      #song-viewer-container .chord-line button,
                      #song-viewer-container .chord-btn {
                        color: #06b6d4 !important; /* Brighter, high-contrast cyan */
                        background-color: transparent !important;
                        border: none !important;
                        font-weight: 850 !important;
                        letter-spacing: 0px !important;
                        padding: 0px !important;
                        margin: 0px !important;
                        border-radius: 2px !important;
                        transition: all 0.2s ease;
                      }
                      
                      #song-viewer-container .chord-line button:hover,
                      #song-viewer-container .chord-btn:hover {
                        color: #ffffff !important;
                        background-color: rgba(6, 182, 212, 0.2) !important;
                        text-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
                      }
                      
                      /* Extremely high contrast for chord buttons in light mode when NOT in stage mode */
                      .light #song-viewer-container:not(.stage-mode) .chord-line button,
                      .light #song-viewer-container:not(.stage-mode) .chord-btn {
                        color: #0369a1 !important; /* High contrast Deep sky/ocean blue, ratio > 7:1 */
                        background-color: transparent !important;
                        border: none !important;
                        font-weight: 850 !important;
                        padding: 0px !important;
                        margin: 0px !important;
                        letter-spacing: 0px !important;
                      }
                      
                      .light #song-viewer-container:not(.stage-mode) .chord-line button:hover,
                      .light #song-viewer-container:not(.stage-mode) .chord-btn:hover {
                        color: #0369a1 !important;
                        background-color: rgba(3, 105, 161, 0.15) !important;
                      }
                    `}
                  </style>
                  {displayedContent ? (
                    <>
                      <div 
                        className="text-text-main selection:bg-brand/20 pb-6 transition-all duration-300"
                        style={{ 
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: isFullscreen ? `${songFontSize * 1.5}px` : `${songFontSize}px`,
                          letterSpacing: '0',
                          lineHeight: '1.4',
                          columnCount: numColumns,
                          columnGap: numColumns > 1 ? '3rem' : '0px',
                          columnRule: numColumns > 1 ? '1px dashed rgba(128, 128, 128, 0.2)' : 'none'
                        }}
                      >
                        {getSongBlocks(displayedContent).map((block, bIdx) => {
                          if (block.length === 1 && block[0] === '') {
                            return <div key={`spacer-${bIdx}`} className="h-1.5 sm:h-2 break-inside-avoid block" />;
                          }

                          const rows: React.ReactNode[] = [];
                          let lIdx = 0;
                          while (lIdx < block.length) {
                            const currentLine = block[lIdx];
                            const isCurrentChord = isChordLine(currentLine);
                            const hasNext = lIdx + 1 < block.length;
                            const isNextLyric = hasNext && !isChordLine(block[lIdx + 1]);

                            if (isCurrentChord && isNextLyric) {
                              const nextLine = block[lIdx + 1];
                              rows.push(
                                <PairedChordLyricsRow 
                                  key={`pair-${lIdx}`}
                                  chordLine={currentLine}
                                  lyricLine={nextLine}
                                  setActiveChordInDict={setActiveChordInDict}
                                />
                              );
                              lIdx += 2;
                            } else {
                              rows.push(
                                <SingleLineRow 
                                  key={`single-${lIdx}`}
                                  line={currentLine}
                                  isChord={isCurrentChord}
                                  setActiveChordInDict={setActiveChordInDict}
                                />
                              );
                              lIdx += 1;
                            }
                          }

                          return (
                            <div key={`block-${bIdx}`} className="break-inside-avoid mb-2 sm:mb-3 block">
                              {rows}
                            </div>
                          );
                        })}
                      </div>
                      {renderLiturgyNavigation()}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted space-y-4">
                      <p className="italic font-sans text-lg">Nenhuma cifra cadastrada.</p>
                      {user && !isEditing && (
                        <Button onClick={handleToggleEdit} variant="secondary">Adicionar Cifra</Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

            {detailTab === 'lyrics' && (
              isEditing ? (
                <div className="space-y-4">
                  {/* Sincroniza√ß√£o e Importa√ß√£o Cifra Club */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 space-y-3.5 shadow-sm">
                    {/* Sincroniza√ß√£o via Link Direto */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Music size={14} className="text-emerald-500" />
                        <span className="font-bold text-xs text-text-main uppercase tracking-wider">Sincronizar direto de link do Cifra Club</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          placeholder="Cole o link do Cifra Club (Ex: https://www.cifraclub.com.br/...)"
                          value={editCifraClubUrl}
                          onChange={(e) => setEditCifraClubUrl(e.target.value)}
                          disabled={isImportingCifra}
                          className="w-full sm:flex-1 h-20 sm:h-18 px-4 rounded-xl border border-border bg-black/10 dark:bg-zinc-900/40 text-text-main placeholder-text-muted focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleImportFromCifraClub()}
                          disabled={isImportingCifra}
                          className={cn(
                            "w-full sm:w-auto h-11 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all select-none border flex items-center justify-center gap-1.5 shrink-0",
                            isImportingCifra
                              ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 border-emerald-500/20 cursor-pointer"
                          )}
                        >
                          {isImportingCifra ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Importando...</span>
                            </>
                          ) : (
                            <>
                              <Download size={14} />
                              <span>Importar do Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {autofillSuccess && (
                    <p className="text-[11px] font-bold text-green-500 bg-green-500/10 p-2 rounded-lg border border-green-500/15">{autofillSuccess}</p>
                  )}
                  {autofillError && (
                    <p className="text-[11px] font-bold text-red-500 bg-red-500/10 p-2 rounded-lg border border-red-500/15">{autofillError}</p>
                  )}
                  <div className="p-4 bg-black/5 dark:bg-white/5 border border-border/60 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-brand uppercase tracking-wider">Formatador de Letra</p>
                        <p className="text-[11px] text-text-muted">Selecione o texto e clique em um bot√£o para aplicar a formata√ß√£o no editor abaixo:</p>
                      </div>
                      <div className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/5 px-2 py-1 rounded border border-yellow-500/15 text-right self-start sm:self-center">
                        üí° Formate sua letra para destacar refr√£os e divis√µes!
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40">
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('bold', 'lyrics')}
                        className="p-2 bg-card hover:bg-black/5 dark:hover:bg-white/10 text-text-main hover:text-brand border border-border rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold"
                        title="Negrito (<b>texto</b>)"
                      >
                        <Bold size={14} strokeWidth={2.5} />
                        Negrito
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('italic', 'lyrics')}
                        className="p-2 bg-card hover:bg-black/5 dark:hover:bg-white/10 text-text-main hover:text-brand border border-border rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold"
                        title="It√°lico (<i>texto</i>)"
                      >
                        <Italic size={14} strokeWidth={2.5} />
                        It√°lico
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('underline', 'lyrics')}
                        className="p-2 bg-card hover:bg-black/5 dark:hover:bg-white/10 text-text-main hover:text-brand border border-border rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold"
                        title="Sublinhado (<u>texto</u>)"
                      >
                        <Underline size={14} strokeWidth={2.5} />
                        Sublinhado
                      </button>
                      
                      <div className="h-6 w-px bg-border/50 self-center mx-1" />
                      
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('brackets', 'lyrics')}
                        className="p-2 bg-card hover:bg-black/5 dark:hover:bg-white/10 text-text-main hover:text-brand border border-border rounded-lg transition-all flex items-center gap-1.5 text-xs font-mono font-bold"
                        title="Colchetes [ texto ]"
                      >
                        <span className="text-brand">[ ]</span>
                        Colchetes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('braces', 'lyrics')}
                        className="p-2 bg-card hover:bg-black/5 dark:hover:bg-white/10 text-text-main hover:text-brand border border-border rounded-lg transition-all flex items-center gap-1.5 text-xs font-mono font-bold"
                        title="Chaves { texto }"
                      >
                        <span className="text-brand">{"{ }"}</span>
                        Chaves
                      </button>

                      <div className="h-6 w-px bg-border/50 self-center mx-1 shrink-0" />

                      <div className="flex flex-col gap-1.5 w-full pt-0.5">
                        {/* Se√ß√µes da M√∫sica */}
                        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
                          <span className="text-[10px] font-bold text-text-muted uppercase shrink-0 flex items-center gap-1 mr-0.5">
                            <Music size={12} className="text-brand" /> Se√ß√µes:
                          </span>
                          {SECTIONS_FOR_QUICK_INSERT.map((sec) => (
                            <button
                              key={`lyrics-sec-${sec.tag}`}
                              type="button"
                              onClick={() => handleInsertSectionTag(sec.tag, 'lyrics')}
                              className="px-2 py-0.5 bg-gradient-to-r from-brand to-cyan-500 hover:from-brand-dark hover:to-cyan-600 text-white border border-brand/30 rounded-md transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95 flex items-center gap-1"
                              title={`Inserir [${sec.tag}]`}
                            >
                              + {sec.label}
                            </button>
                          ))}
                        </div>

                        {/* A√ß√µes de Letra (Extrair, Limpar Din√¢micas e Limpar) */}
                        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5 border-t border-border/30 pt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const extracted = extractLyricsFromChords(editedSong.chords || '');
                              if (extracted) {
                                setEditedSong(prev => ({ ...prev, lyrics: extracted }));
                              }
                            }}
                            className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/40 rounded-lg transition-all text-[11px] font-mono font-black shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95 flex items-center gap-1.5"
                            title="Extrair e formatar letra limpa (sem cifras e sem din√¢micas) automaticamente a partir da cifra"
                          >
                            <Sparkles size={12} /> ‚ú® Extrair da Cifra
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (editedSong.lyrics) {
                                const cleaned = stripDynamicsFromText(cleanLyricsForDisplay(editedSong.lyrics));
                                setEditedSong(prev => ({ ...prev, lyrics: cleaned }));
                              }
                            }}
                            className="px-2.5 py-1 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-text-main border border-border rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95 flex items-center gap-1"
                            title="Remover qualquer marca√ß√£o de din√¢mica (ex: bem suave, s√≥ viol√£o) do texto atual da letra"
                          >
                            üßπ Remover Din√¢micas
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Deseja realmente limpar o texto da letra?")) {
                                setEditedSong(prev => ({ ...prev, lyrics: '' }));
                              }
                            }}
                            className="px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer ml-auto"
                            title="Limpar texto da letra"
                          >
                            Limpar Letra
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <textarea 
                    ref={lyricsTextareaRef}
                    className="w-full h-[65vh] border-none focus:ring-0 resize-none bg-black/5 dark:bg-white/5 p-6 rounded-xl font-sans text-text-main leading-relaxed scrollbar-hide border border-border/50 notranslate"
                    translate="no"
                    style={{ fontSize: `${songFontSize}px` }}
                    value={editedSong.lyrics}
                    onChange={e => setEditedSong({...editedSong, lyrics: e.target.value})}
                    placeholder="Cole aqui apenas a letra da m√∫sica..."
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="none"
                    autoComplete="off"
                  />
                </div>
              ) : (
                <div 
                  className={cn(
                    "p-6 relative rounded-b-xl notranslate transition-all duration-300",
                    isStageMode ? "bg-black text-white border border-amber-500/30 shadow-[0_0_35px_rgba(245,158,11,0.12)]" : "bg-card/20 backdrop-blur-md text-text-main",
                    isFullscreen && "p-8"
                  )}
                  translate="no"
                >
                  {effectiveLyrics ? (
                    <>
                      <div 
                        className={cn(
                          "font-sans leading-relaxed text-left transition-all duration-300 mb-6",
                          isStageMode ? "text-white font-medium" : "text-text-main",
                          isFullscreen ? "min-h-full" : ""
                        )}
                        style={{ 
                          fontSize: isFullscreen ? `${songFontSize * 1.5}px` : `${songFontSize}px`,
                          columnCount: numColumns,
                          columnGap: numColumns > 1 ? '3rem' : '0px',
                          columnRule: numColumns > 1 ? '1px dashed rgba(128, 128, 128, 0.2)' : 'none'
                        }}
                      >
                        {getSongBlocks(effectiveLyrics).map((block, bIdx) => {
                          if (block.length === 1 && block[0] === '') {
                            return <div key={`spacer-${bIdx}`} className="h-1.5 sm:h-2 break-inside-avoid block" />;
                          }

                          return (
                            <div key={`block-${bIdx}`} className="break-inside-avoid mb-2 sm:mb-3 block">
                              {block.map((line, lIdx) => {
                                if (isChordLine(line)) return null;
                                const elements: React.ReactNode[] = [];
                                let isBold = false;
                                let isItalic = false;
                                let isUnderline = false;
                                
                                let i = 0;
                                let charIdx = 0;
                                while (i < line.length) {
                                  if (line.substring(i, i + 3) === '<b>') {
                                    isBold = true;
                                    i += 3;
                                    continue;
                                  }
                                  if (line.substring(i, i + 4) === '</b>') {
                                    isBold = false;
                                    i += 4;
                                    continue;
                                  }
                                  if (line.substring(i, i + 3) === '<i>') {
                                    isItalic = true;
                                    i += 3;
                                    continue;
                                  }
                                  if (line.substring(i, i + 4) === '</i>') {
                                    isItalic = false;
                                    i += 4;
                                    continue;
                                  }
                                  if (line.substring(i, i + 3) === '<u>') {
                                    isUnderline = true;
                                    i += 3;
                                    continue;
                                  }
                                  if (line.substring(i, i + 4) === '</u>') {
                                    isUnderline = false;
                                    i += 4;
                                    continue;
                                  }

                                  const char = line[i];
                                  const classes = cn(
                                    isBold && "font-black brightness-110",
                                    isItalic && "italic",
                                    isUnderline && "underline decoration-current",
                                    (char === '[' || char === ']') && "text-amber-500 font-extrabold",
                                    (char === '{' || char === '}') && "text-cyan-500 font-extrabold"
                                  );

                                  elements.push(
                                    <span 
                                      key={charIdx} 
                                      className={classes}
                                    >
                                      {char}
                                    </span>
                                  );

                                  charIdx++;
                                  i++;
                                }

                                return (
                                  <div key={lIdx} className="min-h-[1.2em] mb-1">
                                    {elements.length > 0 ? elements : ' '}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                      {renderLiturgyNavigation()}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted space-y-4">
                      <p className="italic font-sans text-lg">Nenhuma letra cadastrada.</p>
                      {user && !isEditing && (
                        <Button onClick={handleToggleEdit} variant="secondary">Adicionar Letra</Button>
                      )}
                    </div>
                  )}
                </div>
              )
            )}

            {detailTab === 'bpm' && (
              <div className="font-sans flex flex-col items-center justify-center min-h-[50vh] gap-8">
                 <div className="text-center space-y-2">
                    <h4 className="text-xs font-bold text-text-main uppercase tracking-widest">BPM</h4>
                    <p className="text-7xl font-mono font-black text-text-main tracking-tighter">{editedSong.bpm}</p>
                    <p className="text-xs text-text-muted uppercase font-bold">Batidas por Minuto</p>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted uppercase font-bold pt-1">
                      <Volume2 size={14} className="text-text-muted" />
                      <span>Volume do Metr√¥nomo:</span>
                      <span className="text-brand font-mono font-black">{metronomeVolume}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-4 sm:gap-6 relative z-50">
                        <button 
                          type="button" 
                          onClick={() => setMetronomeVolume(prev => Math.max(0, prev - 10))} 
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/20 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-black/5 dark:shadow-white/5 text-text-main"
                          title="Diminuir Volume do Metr√¥nomo"
                        >
                          <Volume2 size={16} className="opacity-80" />
                          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Vol -</span>
                        </button>
                        <button type="button" onClick={() => updateBPM(prev => prev - 1)} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-black/10 dark:border-white/30 flex items-center justify-center text-4xl font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 text-text-main transition-all active:scale-90 shadow-lg shadow-black/10 dark:shadow-white/10">-</button>
                        <button type="button" onClick={() => updateBPM(prev => prev + 1)} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-black/10 dark:border-white/30 flex items-center justify-center text-4xl font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 text-text-main transition-all active:scale-90 shadow-lg shadow-black/10 dark:shadow-white/10">+</button>
                        <button 
                          type="button" 
                          onClick={() => setMetronomeVolume(prev => Math.min(100, prev + 10))} 
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/20 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-black/5 dark:shadow-white/5 text-text-main"
                          title="Aumentar Volume do Metr√¥nomo"
                        >
                          <Volume2 size={16} className="opacity-80" />
                          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Vol +</span>
                        </button>
                    </div>
                    {editedSong.bpm !== referenceBpm && (
                      <Button variant="primary" onClick={() => updateBPM(referenceBpm)} className="text-xs font-bold uppercase transition-all py-3 px-6 h-auto rounded-xl shadow-lg shadow-brand/20">
                        <RefreshCcw size={14} className="mr-2" /> Resetar para {referenceBpm} BPM
                      </Button>
                    )}
                    <button 
                      onClick={toggleMetronome}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 py-4 rounded-xl border font-bold uppercase text-[10px] sm:text-xs transition-all shadow-md mt-4",
                        isMetronomeActive 
                          ? "bg-red-500 border-red-400 text-white animate-pulse" 
                          : "bg-brand border-brand/20 text-white hover:brightness-110"
                      )}
                    >
                      <Timer size={16} />
                      <span>{isMetronomeActive ? "Metr√¥nomo Ligado" : "Ligar Metr√¥nomo"}</span>
                    </button>
                 </div>
              </div>
            )}
          </Card>
        </div>
      </div>
          
          {isEditing && (
            <div className="flex justify-end gap-3 translate-y-[-10px]">
              <Button onClick={handleSave} className="flex items-center gap-2 font-bold px-8 shadow-xl">
                 <Save size={18}/> Salvar Todas as Altera√ß√µes
              </Button>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 space-y-4 sm:space-y-6 sticky top-6">
          {detailTab === 'chords' && !isEditing && (
            <div id="chord-dictionary-card">
              <ChordDictionaryCard
                activeChord={activeChordInDict}
                setActiveChord={(chord) => setActiveChordInDict(chord, false)}
                availableChords={availableChordsInSong}
                songKey={currentKey}
              />
            </div>
          )}

          {/* FERRAMENTAS DE ESTUDO DA M√öSICA (PLAYER, LILOUPRO TUNER, METR√îNOMO & ARQUIVOS) */}
          <Card className="p-4 sm:p-5 space-y-5 bg-card border-border/80 shadow-xl relative overflow-hidden">
            {/* Header Ferramentas de Estudo */}
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
              <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-black shrink-0">
                <Zap size={18} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-text-main">
                  FERRAMENTAS DE ESTUDO DA M√öSICA
                </h3>
                <p className="text-[10px] text-text-muted leading-tight">
                  Player, Tuner, Metr√¥nomo e Recursos de Ensaio
                </p>
              </div>
            </div>

            {/* 1. PLAYER (MODO ESTUDO) */}
            {!isEditing && editedSong.youtube && (
              <div className="p-3.5 bg-gradient-to-br from-brand/10 to-transparent border border-brand/20 rounded-2xl relative overflow-hidden group space-y-2">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
                  <Volume2 size={50} className="text-brand" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-1 text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-brand flex items-center justify-center gap-1">
                      <Volume2 size={12} /> Player / Modo Estudo
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-text-muted mb-2.5 text-center">
                    D√™ o play para ouvir a m√∫sica enquanto visualiza a cifra.
                  </p>
                  <button 
                    onClick={() => {
                      const nextVal = !showPracticePlayer;
                      setShowPracticePlayer(nextVal);
                      if (nextVal) {
                        setIsPracticePlayerMinimized(false);
                      }
                    }}
                    className={cn(
                      "w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-95 font-black uppercase tracking-widest text-xs shadow-md cursor-pointer",
                      showPracticePlayer 
                        ? "bg-brand text-brand-text shadow-brand/20 ring-4 ring-brand/10" 
                        : "bg-white text-primary border-2 border-brand hover:bg-brand hover:text-brand-text"
                    )}
                  >
                    <Volume2 size={18} className={showPracticePlayer ? "animate-pulse" : ""} />
                    <span>{showPracticePlayer ? 'Ouvindo...' : 'Abrir Player'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. LILOUPRO TUNER (AFINADOR CROM√ÅTICO) */}
            {!isEditing && (
              <div className="p-3.5 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl relative overflow-hidden group space-y-2">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
                  <Radio size={50} className="text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                        <Radio size={12} /> LiLouPro Tuner
                      </span>
                      <span className="text-[8px] uppercase font-mono px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-black">
                        PRO
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-text-muted mb-2.5 text-center">
                    Afine o instrumento ou emita tom de refer√™ncia em tempo real.
                  </p>
                  <button
                    onClick={() => setShowTunerModal(true)}
                    className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-95 font-black uppercase tracking-widest text-xs shadow-md bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20 cursor-pointer"
                  >
                    <Radio size={18} />
                    <span>Abrir LiLouPro Tuner</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. LILOUPRO METRONOME (PEDAL DE RITMO & ESTUDO PRO) */}
            {!isEditing && (
              <div className="p-3.5 bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-transparent border border-cyan-500/20 rounded-2xl relative overflow-hidden group space-y-2.5">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
                  <Activity size={50} className="text-cyan-500 dark:text-cyan-400" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-400 flex items-center justify-center gap-1">
                        <Activity size={12} /> LiLouPro Metronome
                      </span>
                      <span className="text-[8px] uppercase font-mono px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 font-black">
                        PRO
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-text-muted mb-2.5 text-center">
                    Boutique Stompbox com subdivis√µes, speed trainer, e time selector
                  </p>

                  {/* Mini Quick Bar */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-border/50 mb-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateBPM(prev => Math.max(20, prev - 1))}
                        className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center font-bold text-xs hover:bg-muted text-text-main active:scale-95 cursor-pointer"
                        title="Diminuir 1 BPM"
                      >
                        -
                      </button>
                      <div className="px-2 text-center">
                        <span className="text-sm font-black font-mono text-cyan-600 dark:text-cyan-400">{editedSong.bpm || 80}</span>
                        <span className="text-[9px] font-bold text-text-muted ml-0.5">BPM</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateBPM(prev => Math.min(300, prev + 1))}
                        className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center font-bold text-xs hover:bg-muted text-text-main active:scale-95 cursor-pointer"
                        title="Aumentar 1 BPM"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleTapTempo}
                        className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase flex items-center gap-1 active:scale-95 cursor-pointer"
                        title="Tap Tempo"
                      >
                        <Flame size={12} /> TAP
                      </button>
                      <button
                        type="button"
                        onClick={toggleMetronome}
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all active:scale-95 cursor-pointer",
                          isMetronomeActive
                            ? "bg-rose-500 text-white shadow-sm"
                            : "bg-cyan-500 text-slate-950 font-black shadow-sm"
                        )}
                        title={isMetronomeActive ? "Parar" : "Tocar"}
                      >
                        {isMetronomeActive ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Big Pedal Launch Button */}
                  <button
                    onClick={() => setShowMetronomeModal(true)}
                    className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-95 font-black uppercase tracking-widest text-xs shadow-md bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-cyan-500/20 cursor-pointer"
                  >
                    <Activity size={18} />
                    <span>Abrir LiLouPro Metronome</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* 4. ARQUIVOS & AUDIOS */}
            <div className="pt-3 border-t border-border/60">
               <h3 className="text-[10px] sm:text-xs font-bold text-text-main uppercase mb-3 text-center sm:text-left tracking-wider">Arquivos & Audios</h3>
               <div className="p-3 sm:4 bg-blue-500/10 border border-dashed border-blue-500/30 rounded-xl flex flex-col items-center gap-2 sm:3 text-center">
                  <Volume2 size={20} className="text-text-main opacity-80 sm:w-6 sm:h-6"/>

                  
                  <input 
                    type="file" 
                    ref={audioInputRef} 
                    className="hidden" 
                    accept="audio/*"
                    onChange={(e) => handleFileUpload(e, 'audio')}
                  />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, 'files')}
                  />

                  {isAdmin && (
                    <div className="grid grid-cols-2 gap-2 w-full">
                    <Button 
                      variant="primary" 
                      className="text-[10px] sm:text-xs py-1.5 sm:py-2"
                      onClick={() => audioInputRef.current?.click()}
                    >
                      + √Åudio
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="bg-black/10 dark:bg-white/10 border-border text-text-main text-[10px] sm:text-xs py-1.5 sm:py-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      + Arquivo
                    </Button>
                  </div>
                )}
               </div>

               {/* File Listing and Management */}
               <div className="mt-4 space-y-2">
                  {isAnalyzingAudioBpm && (
                    <div className="flex items-center gap-2.5 p-3 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-xl text-xs select-none shadow-sm animate-pulse">
                      <Activity size={14} className="animate-spin-slow shrink-0" />
                      <div>
                        <p className="font-black uppercase tracking-wider text-[9px] leading-none">An√°lise em Andamento...</p>
                        <p className="text-[8.5px] opacity-75 mt-0.5">Estimando o BPM do √°udio carregado.</p>
                      </div>
                    </div>
                  )}

                  {detectedBpmMsg && (
                    <div className="p-3 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-xs space-y-2 shadow-sm">
                      <div className="flex items-start gap-2.5">
                        <Sparkles size={14} className="shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-black uppercase tracking-wider text-[9px] leading-none">BPM Detectado! ‚ö°</p>
                          <p className="text-[10px] font-bold text-text-main mt-1">
                            Andamento de <strong className="text-white">"{detectedBpmMsg.name}"</strong> ajustou o metr√¥nomo para <span className="font-extrabold text-white text-xs bg-green-500 px-1 rounded">{detectedBpmMsg.bpm} BPM</span>.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-green-500/10">
                        <span className="text-[7.5px] text-text-muted select-none">Ajuste manual continua dispon√≠vel</span>
                        <button 
                          onClick={() => setDetectedBpmMsg(null)}
                          className="text-[9px] font-black uppercase text-green-500 hover:text-green-400 active:scale-95"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                  )}

                  {editedSong.audio && editedSong.audio.length > 0 && (
                    <div className="space-y-1.5">
                      {editedSong.audio.map((a: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-black/5 dark:bg-white/5 border border-border rounded-xl group transition-all">
                           <div className="flex items-center gap-3 min-w-0">
                              <button 
                                onClick={() => handlePlayPause(a.url, i, a.name)}
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0",
                                  playingAudioIndex === i ? "bg-brand text-white shadow-lg" : "bg-black/10 dark:bg-white/10 text-text-main hover:bg-brand/20"
                                )}
                              >
                                {playingAudioIndex === i ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                              </button>
                              <p className="font-bold text-text-main truncate text-[11px] leading-none">{a.name}</p>
                           </div>
                           <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => analyzeBpmFromAudio(a.url, a.name)}
                                className="p-1.5 text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                                title="An√°lise Inteligente de BPM"
                              >
                                <Activity size={12} className={isAnalyzingAudioBpm ? "animate-pulse" : ""} />
                              </button>
                              {!isEditing && (
                                <a href={a.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-text-muted hover:text-text-main transition-all">
                                  <ExternalLink size={12}/>
                                </a>
                              )}
                             {isEditing && (
                               <ConfirmButton 
                                 onConfirm={() => setEditedSong({...editedSong, audio: editedSong.audio.filter((_: any, idx: number) => idx !== i)})}
                                 className="p-1.5 text-red-500 hover:bg-red-500/20 rounded-lg"
                               >
                                 <Trash2 size={12}/>
                               </ConfirmButton>
                             )}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {editedSong.files && editedSong.files.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      {editedSong.files.map((f: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded-xl group transition-all">
                           <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white shrink-0 border border-white/5">
                                 <FileText size={16} />
                              </div>
                              <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-white transition-colors truncate text-[11px] leading-none">{f.name}</a>
                           </div>
                            <div className="flex items-center gap-1">
                              <a href={f.url} target="_blank" rel="noopener noreferrer" className="p-2 text-white hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Baixar">
                                 <Download size={16}/>
                              </a>
                              {isEditing && (
                                <ConfirmButton 
                                  onConfirm={() => setEditedSong({...editedSong, files: editedSong.files.filter((_: any, idx: number) => idx !== i)})}
                                  className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg"
                                 >
                                  <Trash2 size={16}/>
                                </ConfirmButton>
                              )}
                            </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Google Drive links section */}
                  <div className="pt-2.5 mt-2 border-t border-white/10 space-y-3">
                     {/* Google Drive Audio Guides link */}
                     <div className="space-y-1">
                        <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider block">Link do Drive (Guias de √Åudio)</span>
                        {isEditing ? (
                          <Input 
                            value={editedSong.driveAudioLink || ''}
                            onChange={(e) => setEditedSong({...editedSong, driveAudioLink: e.target.value})}
                            placeholder="Cole o link do Drive para guias"
                            className="h-9 text-xs p-2 bg-black/10 dark:bg-white/5 border border-border text-text-main"
                          />
                        ) : (
                          editedSong.driveAudioLink ? (
                            <a 
                              href={editedSong.driveAudioLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center gap-2 p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold transition-all"
                            >
                              <ExternalLink size={14} className="shrink-0" />
                              <span className="truncate">Acessar Pasta de Guias no Drive</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-text-muted italic block pl-1">Sem link do Drive cadastrado</span>
                          )
                        )}
                     </div>

                     {/* Google Drive Files link */}
                     <div className="space-y-1">
                        <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider block">Link do Drive (Partituras/Arquivos)</span>
                        {isEditing ? (
                          <Input 
                            value={editedSong.driveFilesLink || ''}
                            onChange={(e) => setEditedSong({...editedSong, driveFilesLink: e.target.value})}
                            placeholder="Cole o link do Drive para partituras"
                            className="h-9 text-xs p-2 bg-black/10 dark:bg-white/5 border border-border text-text-main"
                          />
                        ) : (
                          editedSong.driveFilesLink ? (
                            <a 
                              href={editedSong.driveFilesLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center gap-2 p-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-xl text-xs font-bold transition-all"
                            >
                              <ExternalLink size={14} className="shrink-0" />
                              <span className="truncate">Acessar Pasta de Arquivos no Drive</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-text-muted italic block pl-1">Sem link do Drive cadastrado</span>
                          )
                        )}
                     </div>
                  </div>
               </div>
            </div>
          </Card>

          {/* SE√á√ÉO DE FERRAMENTAS ESPECIAIS (EXCLUSIVO LILOUPRO) */}
          <div className="mt-6 pt-6 border-t border-border/60 space-y-4">
            <div className="flex flex-col items-center text-center gap-1.5 px-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-base sm:text-lg font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 px-4 py-1 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse">
                  Exclusivo Liloupro
                </span>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 bg-clip-text text-transparent flex items-center justify-center gap-2 mt-1">
                <Sparkles size={16} className="text-amber-500 shrink-0 animate-pulse" />
                FERRAMENTAS ESPECIAIS
              </h3>
              <p className="text-[11px] sm:text-xs text-text-muted leading-relaxed max-w-[280px] sm:max-w-sm mx-auto">
                Recursos avan√ßados de intelig√™ncia teol√≥gica e an√°lise musical para elevar a excel√™ncia do seu minist√©rio.
              </p>
            </div>

            <Card className="p-4 bg-card border-border shadow-xl relative overflow-hidden transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
              <BookOpen size={80} className="text-brand" />
            </div>

            <div className="relative z-10">
              {/* Clickable Header for Collapsing styled as a Button */}
              <button 
                type="button"
                onClick={() => setIsBibleExpanded(!isBibleExpanded)}
                className={cn(
                  "w-full h-12 py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 font-black uppercase tracking-widest text-xs shadow-md transition-all group select-none cursor-pointer outline-none border border-transparent text-white bg-brand hover:brightness-110 active:scale-95",
                  isBibleExpanded && "shadow-inner"
                )}
              >
                <BookOpen size={18} className="text-white shrink-0 group-hover:scale-110 transition-transform" />
                <span>Fundamenta√ß√£o B√≠blica</span>
                <ChevronDown 
                  size={16} 
                  className={cn("text-white/70 transition-transform duration-300 ml-1 shrink-0", isBibleExpanded && "transform rotate-180")} 
                />
              </button>
            </div>

            <div className="relative z-10">
              <AnimatePresence initial={false}>
                {isBibleExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-border mt-3">
                      {isAnalyzingBible ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <Loader2 size={24} className="text-brand animate-spin mb-3" />
                          <p className="text-xs font-semibold text-text-main animate-pulse">Analisando letra...</p>
                          <p className="text-[10px] text-text-muted mt-1 max-w-[200px]">Mapeando temas com passagens b√≠blicas usando Intelig√™ncia Artificial.</p>
                        </div>
                      ) : bibleAnalysisError ? (
                        <div className="py-4 text-center">
                          <p className="text-xs font-semibold text-red-500 mb-2">{bibleAnalysisError}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalyzeBible();
                            }}
                            className="px-3 py-1.5 text-[10px] sm:text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                          >
                            Tentar Novamente
                          </button>
                        </div>
                      ) : editedSong.bibleReferences ? (
                        <div className="space-y-4">
                          {/* Title & Recalcular Button inside Expanded State */}
                          <div className="flex items-center justify-between text-text-muted text-[10px] uppercase font-bold tracking-wider">
                            <span>An√°lise Teol√≥gica</span>
                            {editedSong.bibleReferences && !isEditing && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAnalyzeBible();
                                }}
                                disabled={isAnalyzingBible}
                                className="flex items-center gap-1.5 text-text-muted hover:text-brand transition-all text-[9.5px] uppercase font-black tracking-widest bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg"
                                title="Recalcular An√°lise"
                              >
                                <RefreshCcw size={10} className={cn(isAnalyzingBible && "animate-spin")} />
                                <span>Recalcular</span>
                              </button>
                            )}
                          </div>

                          {/* Summary */}
                          <div className="bg-brand/5 dark:bg-white/5 border border-brand/10 dark:border-white/10 p-3.5 rounded-xl text-xs sm:text-sm text-text-main font-medium leading-relaxed italic relative">
                            <span className="absolute top-1 left-2 text-[24px] leading-none text-brand/20 font-serif">‚Äú</span>
                            <p className="pl-4">{editedSong.bibleReferences.summary}</p>
                          </div>

                          {/* References List */}
                          <div className="space-y-4">
                            {editedSong.bibleReferences.references?.map((ref: any, rIdx: number) => (
                              <div key={rIdx} className="border-l-2 border-brand/40 dark:border-brand/30 pl-3 py-0.5">
                                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                  <span className="text-xs sm:text-sm font-black text-brand tracking-wide">{ref.verseRef}</span>
                                </div>
                                <p className="text-xs sm:text-[13px] text-text-muted leading-relaxed italic dark:text-gray-300">
                                  "{ref.verseText}"
                                </p>
                                {ref.relation && (
                                  <p className="text-xs sm:text-[13px] text-text-main mt-1.5 font-medium bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded inline-block w-full leading-relaxed">
                                    <span className="font-bold text-brand mr-1">Rela√ß√£o:</span>{ref.relation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <p className="text-xs text-text-muted mb-4 max-w-[220px]">
                            Descubra quais passagens da B√≠blia d√£o respaldo teol√≥gico ou serviram como inspira√ß√£o para esta can√ß√£o.
                          </p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalyzeBible();
                            }}
                            disabled={isAnalyzingBible}
                            className="w-full h-12 py-3.5 px-4 bg-brand hover:bg-brand-hover text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2.5"
                          >
                            <Sparkles size={18} className="animate-pulse" />
                            Analisar com IA
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>

          {/* Sugest√µes do Mesmo Tema Card */}
          <Card className="p-4 bg-card border-border shadow-xl relative overflow-hidden transition-all mt-4">
            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
              <Music2 size={80} className="text-brand" />
            </div>

            <div className="relative z-10">
              <button 
                type="button"
                onClick={() => setIsSuggestionsExpanded(!isSuggestionsExpanded)}
                className={cn(
                  "w-full h-12 py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 font-black uppercase tracking-widest text-xs shadow-md transition-all group select-none cursor-pointer outline-none border border-transparent text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95",
                  isSuggestionsExpanded && "shadow-inner"
                )}
              >
                <Music size={18} className="text-white shrink-0 group-hover:scale-110 transition-transform" />
                <span>Sugest√µes do Mesmo Tema</span>
                <ChevronDown 
                  size={16} 
                  className={cn("text-white/70 transition-transform duration-300 ml-1 shrink-0", isSuggestionsExpanded && "transform rotate-180")} 
                />
              </button>
            </div>

            <div className="relative z-10">
              <AnimatePresence initial={false}>
                {isSuggestionsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-border mt-3">
                      {isAnalyzingThemeSuggestions ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <Loader2 size={24} className="text-indigo-500 animate-spin mb-3" />
                          <p className="text-xs font-semibold text-text-main animate-pulse">Buscando sugest√µes...</p>
                          <p className="text-[10px] text-text-muted mt-1 max-w-[200px]">Encontrando can√ß√µes com a mesma linha tem√°tica no acervo crist√£o usando IA.</p>
                        </div>
                      ) : themeSuggestionsError ? (
                        <div className="py-4 text-center">
                          <p className="text-xs font-semibold text-red-500 mb-2">{themeSuggestionsError}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetThemeSuggestions();
                            }}
                            className="px-3 py-1.5 text-[10px] sm:text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                          >
                            Tentar Novamente
                          </button>
                        </div>
                      ) : editedSong.themeSuggestions ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-text-muted text-[10px] uppercase font-bold tracking-wider">
                            <span className="text-indigo-500 dark:text-indigo-400 font-extrabold max-w-[180px] truncate">
                              Tema: {editedSong.themeSuggestions.themeName}
                            </span>
                            {!isEditing && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGetThemeSuggestions();
                                }}
                                disabled={isAnalyzingThemeSuggestions}
                                className="flex items-center gap-1.5 text-text-muted hover:text-indigo-500 transition-all text-[9.5px] uppercase font-black tracking-widest bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg shrink-0"
                                title="Recalcular Sugest√µes"
                              >
                                <RefreshCcw size={10} className={cn(isAnalyzingThemeSuggestions && "animate-spin")} />
                                <span>Recalcular</span>
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-text-muted leading-relaxed">
                            {editedSong.themeSuggestions.themeDescription}
                          </p>

                          <div className="space-y-3.5 pt-2">
                            {editedSong.themeSuggestions.suggestions?.map((sug: any, sIdx: number) => (
                              <div key={sIdx} className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/20 p-3 rounded-xl flex flex-col hover:border-indigo-500/35 transition-all">
                                <div className="flex items-start justify-between">
                                  <div className="min-w-0">
                                    <h4 className="text-xs sm:text-sm font-bold text-text-main truncate">{sug.title}</h4>
                                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block mt-0.5">{sug.artist}</span>
                                  </div>
                                </div>
                                <p className="text-xs text-text-muted mt-2 leading-relaxed italic border-t border-indigo-500/5 pt-2">
                                  "{sug.explanation}"
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <p className="text-xs text-text-muted mb-4 max-w-[220px]">
                            Para enriquecer seu repert√≥rio ou culto, pe√ßa √† IA sugest√µes de ao menos 3 louvores de mesmo tema.
                          </p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetThemeSuggestions();
                            }}
                            disabled={isAnalyzingThemeSuggestions}
                            className="w-full h-12 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2.5"
                          >
                            <Sparkles size={18} className="animate-pulse" />
                            Sugerir Louvores do Tema
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>

          {/* Aprenda com a M√∫sica (Harmonia) Card */}
          <Card className="p-4 bg-card border-border shadow-xl relative overflow-hidden transition-all mt-4">
            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
              <GraduationCap size={80} className="text-brand" />
            </div>

            <div className="relative z-10 font-sans">
              <button 
                type="button"
                onClick={() => setIsHarmonyExpanded(!isHarmonyExpanded)}
                className={cn(
                  "w-full h-12 py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 font-black uppercase tracking-widest text-xs shadow-md transition-all group select-none cursor-pointer outline-none border border-transparent text-white bg-indigo-700 hover:bg-indigo-800 active:scale-95",
                  isHarmonyExpanded && "shadow-inner bg-indigo-800"
                )}
              >
                <GraduationCap size={18} className="text-white shrink-0 group-hover:scale-110 transition-transform" />
                <span>Aprenda com a M√∫sica (Harmonia)</span>
                <ChevronDown 
                  size={16} 
                  className={cn("text-white/70 transition-transform duration-300 ml-1 shrink-0", isHarmonyExpanded && "transform rotate-180")} 
                />
              </button>
            </div>

            <div className="relative z-10">
              <AnimatePresence initial={false}>
                {isHarmonyExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-border mt-3 space-y-4">
                      {isAnalyzingHarmony ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <Loader2 size={24} className="text-indigo-500 animate-spin mb-3" />
                          <p className="text-xs font-semibold text-text-main animate-pulse">Analisando Harmonia...</p>
                          <p className="text-[10px] text-text-muted mt-1 max-w-[200px]">Mapeando campo harm√¥nico, cad√™ncias, AEM, dominantes secund√°rias e dicas para o altar usando IA.</p>
                        </div>
                      ) : harmonyAnalysisError ? (
                        <div className="py-4 text-center">
                          <p className="text-xs font-semibold text-red-500 mb-2">{harmonyAnalysisError}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalyzeHarmony();
                            }}
                            className="px-3 py-1.5 text-[10px] sm:text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                          >
                            Tentar Novamente
                          </button>
                        </div>
                      ) : editedSong.harmonyAnalysis ? (
                        <div className="space-y-4">
                          {/* Top Header & Recalculate */}
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-text-muted">
                            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">An√°lise Funcional</span>
                            {!isEditing && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAnalyzeHarmony();
                                }}
                                disabled={isAnalyzingHarmony}
                                className="flex items-center gap-1.5 text-text-muted hover:text-indigo-500 transition-all text-[9.5px] uppercase font-black tracking-widest bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg shrink-0"
                                title="Recalcular An√°lise"
                              >
                                <RefreshCcw size={10} className={cn(isAnalyzingHarmony && "animate-spin")} />
                                <span>Recalcular</span>
                              </button>
                            )}
                          </div>

                          {/* Key and Scale */}
                          <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 p-3 rounded-xl space-y-1.5 shadow-sm text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-indigo-700 dark:text-indigo-450">Tom Detectado:</span>
                              <span className="font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg text-xs">{editedSong.harmonyAnalysis.detectedKey}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-indigo-700 dark:text-indigo-450">Escala ({editedSong.harmonyAnalysis.scaleType}):</span>
                              <span className="font-mono text-text-main dark:text-white font-bold">
                                {editedSong.harmonyAnalysis.scaleNotes?.join(" ‚Ä¢ ")}
                              </span>
                            </div>
                          </div>

                          {/* Connection to Course / Teoria */}
                          <div className="bg-brand/5 dark:bg-white/5 border border-brand/10 p-3 rounded-xl text-[11px] leading-relaxed text-text-muted dark:text-slate-200">
                            <h4 className="font-black text-brand uppercase tracking-wider mb-1 text-[10px] flex items-center gap-1">
                              <Zap size={11} /> Conex√£o com os Cap√≠tulos do Curso:
                            </h4>
                            {editedSong.harmonyAnalysis.specialChords && editedSong.harmonyAnalysis.specialChords.length > 0 ? (
                              <p>
                                Esta m√∫sica faz uso fant√°stico de elementos avan√ßados apresentados no hino! Ela possui <span className="font-extrabold text-indigo-500 dark:text-indigo-400">{editedSong.harmonyAnalysis.specialChords.map((sc: any) => sc.chord).join(", ")}</span> classificado(s) como <strong className="text-indigo-500 dark:text-indigo-400">{editedSong.harmonyAnalysis.specialChords[0].concept}</strong>. Revise o <span className="underline font-bold text-indigo-600 dark:text-indigo-400">Cap√≠tulo 4 ou 5</span> do nosso Curso de Harmonia para entender a fundo o interc√¢mbio modal ou dominantes secund√°rias envolvidos!
                              </p>
                            ) : (
                              <p>
                                Esta can√ß√£o √© excelente para aplicar harmonia diat√¥nica essencial. Ela se enquadra perfeitamente nas cad√™ncias abordadas no <strong className="text-indigo-500 dark:text-indigo-400">Cap√≠tulo 2 (Introdu√ß√£o ao Campo Harm√¥nico)</strong> e no <strong className="text-indigo-500 dark:text-indigo-400">Cap√≠tulo 3 (Cad√™ncias Cl√°ssicas)</strong>. Pratique dedilhando e identificando as fun√ß√µes de T√¥nica, Subdominante e Dominante!
                              </p>
                            )}
                          </div>

                          {/* Campo Harm√¥nico Grid */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Campo Harm√¥nico Diat√¥nico do Tom</span>
                            <div className="grid grid-cols-4 gap-1.5">
                              {editedSong.harmonyAnalysis.harmonicField?.map((item: any, idx: number) => {
                                const isTonic = item.functionType === 'T√¥nica';
                                const isSub = item.functionType === 'Subdominante';
                                const colorClass = isTonic 
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                                  : isSub
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
                                return (
                                  <div key={idx} className={cn("border p-2 rounded-xl text-center space-y-0.5", colorClass)}>
                                    <span className="text-[9px] font-black uppercase font-mono block opacity-60 leading-none">{item.degree}</span>
                                    <span className="text-xs font-black block leading-tight">{item.chord}</span>
                                    <span className="text-[8px] font-bold block truncate opacity-75">{item.functionType}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Cad√™ncias encontradas */}
                          {editedSong.harmonyAnalysis.cadencesFound && editedSong.harmonyAnalysis.cadencesFound.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Movimentos e Cad√™ncias Identificadas</span>
                              <div className="space-y-1.5">
                                {editedSong.harmonyAnalysis.cadencesFound.map((cad: any, cidx: number) => (
                                  <div key={cidx} className="bg-black/5 dark:bg-white/5 border border-border p-2.5 rounded-xl space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{cad.name}</span>
                                      <span className="font-mono bg-black/10 dark:bg-white/5 px-1.5 py-0.5 rounded text-[10px] font-bold">{cad.progression}</span>
                                    </div>
                                    <p className="text-[11px] text-text-muted dark:text-slate-200 leading-relaxed font-normal">{cad.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Acordes Especiais */}
                          {editedSong.harmonyAnalysis.specialChords && editedSong.harmonyAnalysis.specialChords.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Dicas de Arranjo Harm√¥nico (Acordes Especiais / Empr√©stimos)</span>
                              <div className="space-y-1.5">
                                {editedSong.harmonyAnalysis.specialChords.map((spec: any, sidx: number) => (
                                  <div key={sidx} className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-black text-indigo-650 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">{spec.chord}</span>
                                      <span className="text-[10px] font-extrabold uppercase text-text-main dark:text-white">{spec.concept}</span>
                                    </div>
                                    <p className="text-[11px] text-text-muted dark:text-slate-200 leading-relaxed font-normal">{spec.explanation}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Musician Performance Tips */}
                          <div className="space-y-2 pt-1 border-t border-border">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1">
                              <Sparkles size={11} className="text-indigo-500 animate-pulse" /> Dicas de Execu√ß√£o para a Equipe
                            </span>
                            <div className="space-y-2">
                              <div className="bg-black/5 dark:bg-white/5 border border-border p-2.5 rounded-xl text-[11px] leading-relaxed">
                                <span className="font-black text-indigo-600 dark:text-indigo-400 block mb-0.5 uppercase tracking-wide text-[9.5px]">üéπ Tecladista</span>
                                <p className="text-text-muted dark:text-slate-200">{editedSong.harmonyAnalysis.musicianTips.keyboardist}</p>
                              </div>
                              <div className="bg-black/5 dark:bg-white/5 border border-border p-2.5 rounded-xl text-[11px] leading-relaxed">
                                <span className="font-black text-indigo-600 dark:text-indigo-400 block mb-0.5 uppercase tracking-wide text-[9.5px]">üé∏ Violonista / Guitarrista</span>
                                <p className="text-text-muted dark:text-slate-200">{editedSong.harmonyAnalysis.musicianTips.guitarist}</p>
                              </div>
                              <div className="bg-black/5 dark:bg-white/5 border border-border p-2.5 rounded-xl text-[11px] leading-relaxed">
                                <span className="font-black text-indigo-600 dark:text-indigo-400 block mb-0.5 uppercase tracking-wide text-[9.5px]">üé∏ Baixista</span>
                                <p className="text-text-muted dark:text-slate-200">{editedSong.harmonyAnalysis.musicianTips.bassist}</p>
                              </div>
                              <div className="bg-black/5 dark:bg-white/5 border border-border p-2.5 rounded-xl text-[11px] leading-relaxed">
                                <span className="font-black text-indigo-600 dark:text-indigo-400 block mb-0.5 uppercase tracking-wide text-[9.5px]">üé§ Ministros Vocais</span>
                                <p className="text-text-muted dark:text-slate-200">{editedSong.harmonyAnalysis.musicianTips.vocalist}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <p className="text-xs text-text-muted mb-4 max-w-[220px]">
                            Clique para analisar a harmonia e aprender fun√ß√µes harm√¥nicas, campo diat√¥nico e cad√™ncias desta m√∫sica usando IA.
                          </p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalyzeHarmony();
                            }}
                            disabled={isAnalyzingHarmony}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] sm:text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer"
                          >
                            <Sparkles size={14} className="animate-pulse" />
                            Analisar Harmonia
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
          </div>
        </aside>
      </div>

      {/* Tom/Key Selection Modal */}
      <AnimatePresence>
        {showKeyMenu && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[250] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Music2 className="text-brand h-5 w-5" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
                    Transposi√ß√£o de Tom
                  </h3>
                </div>
                <button 
                  onClick={() => setShowKeyMenu(false)}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-text-muted hover:text-text-main transition-all"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-text-muted leading-relaxed">
                Mude a tonalidade da cifra automaticamente escolhendo um dos tons abaixo:
              </p>

              {/* Stepper r√°pido de 1/2 Tom */}
              <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-2 rounded-2xl border border-border">
                <button
                  type="button"
                  onClick={() => setTranspose(t => t - 1)}
                  className="px-3 py-2 bg-black/10 dark:bg-white/10 hover:bg-brand hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-95"
                  title="Diminuir meio tom"
                >
                  - 1/2 Tom
                </button>
                <div className="text-center">
                  <span className="text-base font-black text-brand">{currentKey}</span>
                  {isCapoEnabled && shapeKey && shapeKey !== currentKey && (
                    <span className="block text-[10px] text-text-muted font-bold leading-none mt-0.5">Shape: {shapeKey}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setTranspose(t => t + 1)}
                  className="px-3 py-2 bg-black/10 dark:bg-white/10 hover:bg-brand hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-95"
                  title="Aumentar meio tom"
                >
                  + 1/2 Tom
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 py-1">
                {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map((note) => {
                  const getBaseNote = (k: string) => k.match(/^([A-G][#b]?)/)?.[1] || '';
                  const currentBase = getBaseNote(currentKey);
                  const normalizedCurrent = FLATS[currentBase] || currentBase;
                  const normalizedButton = FLATS[note] || note;
                  const isActive = normalizedCurrent === normalizedButton;
                  
                  return (
                    <button
                      key={note}
                      onClick={() => {
                        handleKeySelect(note);
                        setShowKeyMenu(false);
                      }}
                      className={cn(
                        "py-2.5 sm:py-3 rounded-xl text-xs font-black transition-all border cursor-pointer select-none",
                        isActive 
                          ? "bg-brand text-white border-brand shadow-lg scale-105" 
                          : "bg-black/5 dark:bg-white/5 text-text-main border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:border-border"
                      )}
                    >
                      {note}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-border pt-3">
                <button 
                  onClick={() => {
                    setTranspose(0);
                    setShowKeyMenu(false);
                  }}
                  className="w-full py-2.5 bg-black/5 dark:bg-white/5 border border-border rounded-xl text-xs font-black uppercase text-text-muted hover:text-text-main hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer select-none"
                >
                  Tom Original ({effectiveBaseKey})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Capo Selection Modal / Caixa de Op√ß√µes do Capo */}
      <AnimatePresence>
        {showCapoMenu && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[250] flex items-center justify-center p-3 sm:p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 relative max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                    <Sliders size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
                      Posi√ß√£o do Capo
                    </h3>
                    <p className="text-[10px] text-text-muted font-bold">
                      Tom Real: <span className="text-brand font-black">{currentKey}</span>
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowCapoMenu(false)}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-text-muted hover:text-text-main transition-all cursor-pointer"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Informa√ß√£o e Dica Musical */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-xs text-text-main space-y-1 shrink-0">
                <p className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Sparkles size={14} /> Caixa de Posi√ß√µes do Capotraste
                </p>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  Escolha em qual casa colocar a bra√ßadeira. O tom real da m√∫sica permanece <strong className="text-brand">{currentKey}</strong> e os acordes (shapes) s√£o recalculados para criar diferentes sonoridades no instrumento!
                </p>
              </div>

              {/* Bot√£o de Altern√¢ncia R√°pida Sem Capo */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsCapoEnabled(false);
                    setSelectedCapoFret(0);
                    setShowCapoMenu(false);
                  }}
                  className={cn(
                    "flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-2 cursor-pointer select-none",
                    !isCapoEnabled || activeCapoFret === 0
                      ? "bg-brand text-white border-brand shadow-md"
                      : "bg-black/5 dark:bg-white/5 text-text-muted border-border hover:bg-black/10 dark:hover:bg-white/10"
                  )}
                >
                  <X size={14} />
                  <span>Sem Capo (Tom Natural - Shape {currentKey})</span>
                </button>
              </div>

              {/* Grid / Lista de Posi√ß√µes do Capo (1¬™ a 12¬™ Casa) */}
              <div className="overflow-y-auto custom-scrollbar pr-1 space-y-1.5 max-h-[320px]">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((fret) => {
                  const calculatedShape = transposeChord(currentKey, -fret);
                  const isSelected = isCapoEnabled && activeCapoFret === fret;
                  const cleanShapeRoot = calculatedShape.replace(/[^A-G#b]/g, '');
                  const isCaged = ['C', 'A', 'G', 'E', 'D'].includes(cleanShapeRoot);

                  return (
                    <button
                      key={fret}
                      type="button"
                      onClick={() => {
                        setSelectedCapoFret(fret);
                        setIsCapoEnabled(true);
                        setShowCapoMenu(false);
                      }}
                      className={cn(
                        "w-full p-2.5 sm:p-3 rounded-xl text-xs font-medium transition-all border flex items-center justify-between cursor-pointer group text-left select-none",
                        isSelected
                          ? "bg-amber-500 text-black border-amber-400 font-black shadow-lg shadow-amber-500/20 scale-[1.01]"
                          : "bg-black/5 dark:bg-white/5 text-text-main border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:border-amber-500/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={cn(
                          "w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 border",
                          isSelected
                            ? "bg-black text-amber-400 border-black/20"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black"
                        )}>
                          {fret}¬∫
                        </span>
                        <div>
                          <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                            <span>{fret}¬™ Casa</span>
                            {isCaged && (
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-tight",
                                isSelected ? "bg-black/20 text-black" : "bg-amber-500/20 text-amber-600 dark:text-amber-300"
                              )}>
                                üé∏ Shape Aberto
                              </span>
                            )}
                          </div>
                          <p className={cn("text-[10px]", isSelected ? "text-black/80 font-bold" : "text-text-muted")}>
                            Acordes do bra√ßo em {calculatedShape}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase tracking-wider block opacity-75 font-bold">
                          Shape:
                        </span>
                        <span className={cn(
                          "text-sm sm:text-base font-black px-2 py-0.5 rounded-lg inline-block",
                          isSelected ? "bg-black text-amber-400" : "bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand"
                        )}>
                          {calculatedShape}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted shrink-0">
                <span>Toque para aplicar a casa desejada</span>
                <button
                  type="button"
                  onClick={() => setShowCapoMenu(false)}
                  className="px-3 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-text-main font-bold rounded-lg transition-all cursor-pointer"
                >
                  Ok
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Escolha da Vis√£o Harm√¥nica (CIFRA, GRAUS, FUN√á√ïES) */}
      <AnimatePresence>
        {showHarmonicMenu && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[250] flex items-center justify-center p-3 sm:p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 relative max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-brand/10 text-brand rounded-xl border border-brand/20">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
                      Vis√£o Harm√¥nica
                    </h3>
                    <p className="text-[10px] text-text-muted font-bold">
                      Tom Atual: <span className="text-brand font-black">{currentKey}</span>
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowHarmonicMenu(false)}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-text-muted hover:text-text-main transition-all cursor-pointer"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Dica do Modo Harm√¥nico */}
              <div className="bg-brand/10 border border-brand/20 rounded-2xl p-3 text-xs text-text-main space-y-1 shrink-0">
                <p className="font-bold flex items-center gap-1.5 text-brand">
                  <Sparkles size={14} /> Sele√ß√£o de Formato de Exibi√ß√£o
                </p>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  Escolha como os acordes da m√∫sica ser√£o apresentados na cifra. O modo <strong>Cifra Tradicional</strong> √© o formato padr√£o.
                </p>
              </div>

              {/* Op√ß√µes de Vis√£o Harm√¥nica */}
              <div className="space-y-2 py-1">
                {/* Op√ß√£o 1: CIFRA (PADR√ÉO) */}
                <button
                  type="button"
                  onClick={() => {
                    setHarmonicDisplayMode('chords');
                    setShowHarmonicMenu(false);
                  }}
                  className={cn(
                    "w-full p-3.5 rounded-2xl text-xs transition-all border flex items-center justify-between cursor-pointer text-left group",
                    harmonicDisplayMode === 'chords'
                      ? "bg-brand text-white border-brand shadow-lg shadow-brand/20 scale-[1.01]"
                      : "bg-black/5 dark:bg-white/5 text-text-main border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:border-brand/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border",
                      harmonicDisplayMode === 'chords'
                        ? "bg-white text-brand border-white/20"
                        : "bg-brand/15 text-brand border-brand/20 group-hover:bg-brand group-hover:text-white"
                    )}>
                      üé∏
                    </div>
                    <div>
                      <div className="font-black text-sm flex items-center gap-2">
                        <span>Cifra Tradicional</span>
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                          harmonicDisplayMode === 'chords' ? "bg-white/20 text-white" : "bg-brand/20 text-brand"
                        )}>
                          Padr√£o
                        </span>
                      </div>
                      <p className={cn("text-[11px] mt-0.5", harmonicDisplayMode === 'chords' ? "text-white/80" : "text-text-muted")}>
                        Exibe os acordes com os nomes reais (Ex: C, G, Am, F)
                      </p>
                    </div>
                  </div>
                </button>

                {/* Op√ß√£o 2: GRAUS (I, V, VI, IV) */}
                <button
                  type="button"
                  onClick={() => {
                    setHarmonicDisplayMode('roman');
                    setShowHarmonicMenu(false);
                  }}
                  className={cn(
                    "w-full p-3.5 rounded-2xl text-xs transition-all border flex items-center justify-between cursor-pointer text-left group",
                    harmonicDisplayMode === 'roman'
                      ? "bg-amber-500 text-black border-amber-400 font-black shadow-lg shadow-amber-500/20 scale-[1.01]"
                      : "bg-black/5 dark:bg-white/5 text-text-main border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:border-amber-500/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border",
                      harmonicDisplayMode === 'roman'
                        ? "bg-black text-amber-400 border-black/20"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black"
                    )}>
                      I V
                    </div>
                    <div>
                      <div className="font-black text-sm flex items-center gap-2">
                        <span>Graus do Campo Harm√¥nico</span>
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                          harmonicDisplayMode === 'roman' ? "bg-black/20 text-black" : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        )}>
                          Numerais
                        </span>
                      </div>
                      <p className={cn("text-[11px] mt-0.5", harmonicDisplayMode === 'roman' ? "text-black/80 font-bold" : "text-text-muted")}>
                        Exibe em graus num√©ricos romanos (Ex: I, V, VIm, IV)
                      </p>
                    </div>
                  </div>
                </button>

                {/* Op√ß√£o 3: FUN√á√ïES (T√¥n, Dom, Subd) */}
                <button
                  type="button"
                  onClick={() => {
                    setHarmonicDisplayMode('functions');
                    setShowHarmonicMenu(false);
                  }}
                  className={cn(
                    "w-full p-3.5 rounded-2xl text-xs transition-all border flex items-center justify-between cursor-pointer text-left group",
                    harmonicDisplayMode === 'functions'
                      ? "bg-cyan-500 text-white border-cyan-400 font-black shadow-lg shadow-cyan-500/20 scale-[1.01]"
                      : "bg-black/5 dark:bg-white/5 text-text-main border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:border-cyan-500/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border",
                      harmonicDisplayMode === 'functions'
                        ? "bg-white text-cyan-600 border-white/20"
                        : "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-white"
                    )}>
                      üéº
                    </div>
                    <div>
                      <div className="font-black text-sm flex items-center gap-2">
                        <span>Fun√ß√µes Harm√¥nicas</span>
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                          harmonicDisplayMode === 'functions' ? "bg-white/20 text-white" : "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                        )}>
                          An√°lise
                        </span>
                      </div>
                      <p className={cn("text-[11px] mt-0.5", harmonicDisplayMode === 'functions' ? "text-white/80" : "text-text-muted")}>
                        Exibe o papel harm√¥nico (Ex: T√¥n, Dom, Subd, Rel)
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted shrink-0">
                <span>Clique para aplicar o modo de vis√£o desejado</span>
                <button
                  type="button"
                  onClick={() => setShowHarmonicMenu(false)}
                  className="px-4 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-text-main font-bold rounded-lg transition-all cursor-pointer"
                >
                  Ok
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Guia & Tabela de Fun√ß√µes Harm√¥nicas */}
      <AnimatePresence>
        {showHarmonicGuideModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[260] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-3xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 relative max-h-[90vh] overflow-y-auto custom-scrollbar notranslate"
              translate="no"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand/10 text-brand border border-brand/20">
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-text-main">
                      Guia & Tabela de Fun√ß√µes Harm√¥nicas
                    </h3>
                    <p className="text-[11px] text-text-muted font-bold flex items-center gap-1.5 mt-0.5">
                      <span>Tom Atual da M√∫sica:</span>
                      <strong className="px-2 py-0.5 rounded bg-brand/15 text-brand font-mono font-black text-xs">
                        {currentKey || 'C'}
                      </strong>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHarmonicGuideModal(false)}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-text-muted hover:text-text-main transition-all cursor-pointer"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Introdu√ß√£o r√°pida */}
              <div className="bg-brand/5 border border-brand/20 rounded-2xl p-3 text-xs text-text-main space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-brand">
                  <Sparkles size={14} /> Como funciona a Vis√£o Harm√¥nica?
                </p>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  A <strong>Vis√£o Harm√¥nica</strong> analisa as cifras no tom selecionado (<strong>{currentKey || 'C'}</strong>) e permite alternar entre <strong>CIFRA</strong> (acordes originais), <strong>GRAUS</strong> (em algarismos romanos: I, V, VIm, IV) e <strong>FUN√á√ÉO</strong> (papel harm√¥nico: T√¥n, Dom, Rel, Subd).
                </p>
              </div>

              {/* Tabela dos Graus e Fun√ß√µes */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-text-main flex items-center gap-1.5">
                  <span>Quadro de Graus e Fun√ß√µes no Tom {currentKey || 'C'}</span>
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-black/5 dark:bg-white/5 border-b border-border text-[10px] font-black uppercase text-text-muted">
                        <th className="p-2.5">Grau</th>
                        <th className="p-2.5">Fun√ß√£o</th>
                        <th className="p-2.5">Papel Harm√¥nico</th>
                        <th className="p-2.5">Acorde Exemplo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(() => {
                        const keyBase = (currentKey || 'C').match(/^([A-G][#b]?)/)?.[1] || 'C';
                        const degrees = [
                          { roman: 'I', abbrev: 'T√¥n', name: 'T√¥nica', desc: 'Repouso / Centro Tonal principal', semitones: 0, minor: false },
                          { roman: 'IIm', abbrev: 'SubR', name: 'Supert√¥nica / Sub-Relativa', desc: 'Transi√ß√£o e prepara√ß√£o Subdominante', semitones: 2, minor: true },
                          { roman: 'IIIm', abbrev: 'Med', name: 'Mediante', desc: 'Repouso secund√°rio suave', semitones: 4, minor: true },
                          { roman: 'IV', abbrev: 'Subd', name: 'Subdominante', desc: 'Afastamento e meio de tens√£o', semitones: 5, minor: false },
                          { roman: 'V', abbrev: 'Dom', name: 'Dominante', desc: 'Tens√£o M√°xima (pede resolu√ß√£o na T√¥nica)', semitones: 7, minor: false },
                          { roman: 'VIm', abbrev: 'Rel', name: 'Relativa Menor', desc: 'Repouso secund√°rio / Tonalidade √≠ntima', semitones: 9, minor: true },
                          { roman: 'VII¬∫', abbrev: 'Sens', name: 'Sens√≠vel / Subt√¥nica', desc: 'Tens√£o direcional rumo √† T√¥nica', semitones: 11, minor: true },
                        ];

                        return degrees.map(deg => {
                          const chordNote = transposeChord(keyBase, deg.semitones);
                          const fullChord = `${chordNote}${deg.minor ? 'm' : ''}`;

                          return (
                            <tr key={deg.roman} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <td className="p-2.5 font-mono font-black text-brand text-xs">{deg.roman}</td>
                              <td className="p-2.5">
                                <span className="px-2 py-0.5 rounded-md bg-brand/10 text-brand font-mono font-black text-[11px]">
                                  {deg.abbrev}
                                </span>
                              </td>
                              <td className="p-2.5">
                                <span className="font-black text-text-main block">{deg.name}</span>
                                <span className="text-[10px] text-text-muted">{deg.desc}</span>
                              </td>
                              <td className="p-2.5">
                                <span className="px-2 py-1 rounded bg-black/10 dark:bg-white/10 font-mono font-bold text-text-main">
                                  {fullChord}
                                </span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invers√µes / Slash Chords */}
              <div className="bg-card border border-border rounded-2xl p-3.5 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-text-main">
                  Invers√µes de Baixo (Notas ap√≥s a barra `/`)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-border">
                    <span className="font-mono font-black text-brand text-xs block">/1 (ex: V/1)</span>
                    <span className="text-[10px] text-text-muted">Baixo na T√¥nica</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-border">
                    <span className="font-mono font-black text-brand text-xs block">/3 (ex: 1/3)</span>
                    <span className="text-[10px] text-text-muted">Baixo na Ter√ßa (Invers√£o)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-border">
                    <span className="font-mono font-black text-brand text-xs block">/5 (ex: 1/5)</span>
                    <span className="text-[10px] text-text-muted">Baixo na Quinta</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-border">
                    <span className="font-mono font-black text-brand text-xs block">/7 (ex: 1/7)</span>
                    <span className="text-[10px] text-text-muted">Baixo na S√©tima</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowHarmonicGuideModal(false)}
                  className="px-4 py-2 bg-brand text-white hover:bg-brand-dark rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Practice Player (Audio/Youtube) */}
      {renderPracticePlayer()}

      {/* Popover Flutuante de Diagrama R√°pido de Acorde */}
      <QuickChordPopover
        chord={popoverChord}
        onClose={() => setPopoverChord(null)}
        availableChords={availableChordsInSong}
        onSelectChord={(chord) => setActiveChordInDict(chord, true)}
        songKey={currentKey}
      />

      {/* Modal Guia de Din√¢micas & Express√£o Musical */}
      <DynamicsGuideModal
        isOpen={showDynamicsGuideModal}
        onClose={() => setShowDynamicsGuideModal(false)}
      />

      {/* Dynamic Explanation Popup Modal */}
      <DynamicExplanationModal
        explanation={activeDynamicExplanation}
        onClose={() => setActiveDynamicExplanation(null)}
      />

      {/* Footswitch Bluetooth / MIDI Modal */}
      <FootswitchModal
        isOpen={showFootswitchModal}
        onClose={() => setShowFootswitchModal(false)}
        config={footswitchConfig}
        onUpdateConfig={setFootswitchConfig}
        activePedalButton={activePedalButton}
      />
      {/* Chromatic Tuner Modal */}
      <ChromaticTunerModal
        isOpen={showTunerModal}
        onClose={() => setShowTunerModal(false)}
      />

      {/* Study Metronome Modal */}
      <StudyMetronomeModal
        isOpen={showMetronomeModal}
        onClose={() => setShowMetronomeModal(false)}
        bpm={editedSong.bpm || 80}
        timeSignature={editedSong.timeSignature || '4/4'}
        onUpdateBpm={updateBPM}
        originalBpm={referenceBpm}
        originalTimeSignature={originalTimeSignature}
        isMetronomeActive={isMetronomeActive}
        onToggleMetronome={toggleMetronome}
        metronomeVolume={metronomeVolume}
        onUpdateVolume={setMetronomeVolume}
        onTapTempo={handleTapTempo}
      />

      {/* Modal de M√©trica & Compasso Musical */}
      <AnimatePresence>
        {showTimeSignatureMenu && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[250] flex items-center justify-center p-3 sm:p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 relative max-h-[90vh] overflow-hidden notranslate"
              translate="no"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand/10 text-brand rounded-xl border border-brand/20">
                    <Timer size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
                      M√©trica & Compasso Musical
                    </h3>
                    <p className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 mt-0.5">
                      <span>Compasso Atual:</span>
                      <span className="px-2 py-0.5 rounded bg-brand/15 text-brand font-black text-xs font-mono">
                        {editedSong.timeSignature || originalTimeSignature || '4/4'}
                      </span>
                      <span>‚Ä¢ Original:</span>
                      <span className="font-bold text-text-main font-mono">
                        {originalTimeSignature}
                      </span>
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowTimeSignatureMenu(false)}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-text-muted hover:text-text-main transition-all cursor-pointer"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Feedback Alert */}
              <AnimatePresence>
                {timeSigFeedback && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 shrink-0"
                  >
                    <Check size={14} className="shrink-0" />
                    <span>{timeSigFeedback}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Informa√ß√£o / Dica */}
              <div className="bg-brand/5 border border-brand/20 rounded-2xl p-3 text-xs text-text-main space-y-1 shrink-0">
                <p className="font-bold flex items-center gap-1.5 text-brand">
                  <Sparkles size={14} /> Sele√ß√£o R√°pida de Compasso
                </p>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  Alterne a contagem e a m√©trica de tempo da m√∫sica. O metr√¥nomo do Liloupro acentuar√° o primeiro tempo automaticamente de acordo com o compasso escolhido!
                </p>
              </div>

              {/* Bot√£o de Restaurar para Original */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetTimeSignature}
                  disabled={(editedSong.timeSignature || '4/4') === originalTimeSignature}
                  className={cn(
                    "flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-2 cursor-pointer select-none",
                    (editedSong.timeSignature || '4/4') !== originalTimeSignature
                      ? "bg-amber-500 text-black border-amber-400 shadow-md hover:bg-amber-400 active:scale-95"
                      : "bg-black/5 dark:bg-white/5 text-text-muted border-border opacity-60 cursor-not-allowed"
                  )}
                >
                  <RefreshCcw size={14} />
                  <span>Voltar ao Compasso Original ({originalTimeSignature})</span>
                </button>
              </div>

              {/* Grid de Op√ß√µes de Compassos Comuns & Especiais */}
              <div className="overflow-y-auto custom-scrollbar pr-1 space-y-1.5 max-h-[280px]">
                {[
                  { value: '4/4', name: 'Quatern√°rio Simples', desc: '4 tempos. O mais comum na m√∫sica pop e louvor moderno.', badge: 'Mais Comum' },
                  { value: '3/4', name: 'Tern√°rio Simples', desc: '3 tempos (Valsa). Hinos congregacionais tradicionais e can√ß√µes tern√°rias.', badge: 'Valsa / Cl√°ssico' },
                  { value: '6/8', name: 'Bin√°rio Composto', desc: '2 pulsos tern√°rios (1-2-3, 4-5-6). Baladas fluidas, worship contempor√¢neo e dedilhados.', badge: 'Worship / Balada' },
                  { value: '2/4', name: 'Bin√°rio Simples', desc: '2 tempos. Marchas, ritmos r√°pidos e hinos solenes.', badge: 'Marcha / R√°pido' },
                  { value: '12/8', name: 'Quatern√°rio Composto', desc: '4 pulsos tern√°rios. Baladas lentas, blues e louvor intimista profundo.', badge: 'Blues / Balada Lenta' },
                  { value: '6/9', name: 'M√©trica Especial (6/9)', desc: 'Compasso e m√©trica composta com subdivis√£o estendida.', badge: 'M√©trica Especial' },
                  { value: '6/4', name: 'S√™xtuplo Simples', desc: '6 tempos por compasso. Andamentos lentos, reflexivos e espa√ßosos.', badge: 'Solene' },
                  { value: '9/8', name: 'Tern√°rio Composto', desc: '3 pulsos tern√°rios (1-2-3, 4-5-6, 7-8-9). Din√¢mica rica e expressiva.', badge: 'Tern√°rio Composto' },
                  { value: '2/2', name: 'Alla Breve', desc: '2 tempos em m√≠nima. Andamentos √°geis com pulsa√ß√£o ampla.', badge: 'Alla Breve' },
                  { value: '5/4', name: 'Assim√©trico (5 Tempos)', desc: 'M√©trica irregular (3+2 ou 2+3) para arranjos criativos.', badge: 'Assim√©trico' },
                  { value: '7/8', name: 'Progressivo (7 Tempos)', desc: 'M√©trica quebrada e moderna (3+2+2 ou 2+2+3).', badge: 'Progressivo' },
                ].map((item) => {
                  const isSelected = (editedSong.timeSignature || '4/4') === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleSelectTimeSignature(item.value)}
                      className={cn(
                        "w-full p-2.5 sm:p-3 rounded-2xl text-xs font-medium transition-all border flex items-center justify-between cursor-pointer group text-left select-none",
                        isSelected
                          ? "bg-brand text-white border-brand shadow-lg shadow-brand/20 scale-[1.01]"
                          : "bg-black/5 dark:bg-white/5 text-text-main border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:border-brand/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-11 h-11 rounded-xl font-black text-sm flex items-center justify-center shrink-0 border transition-all",
                          isSelected
                            ? "bg-white/20 text-white border-white/30 shadow-inner"
                            : "bg-brand/10 text-brand border-brand/20 group-hover:bg-brand group-hover:text-white"
                        )}>
                          <TimeSignatureDisplay value={item.value} className={isSelected ? "text-white scale-90" : "text-brand group-hover:text-white scale-90"} />
                        </div>
                        <div>
                          <div className="font-black text-xs sm:text-sm flex items-center gap-2">
                            <span>{item.name}</span>
                            <span className={cn(
                              "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                              isSelected ? "bg-white/20 text-white" : "bg-brand/15 text-brand"
                            )}>
                              {item.badge}
                            </span>
                          </div>
                          <p className={cn("text-[11px] mt-0.5", isSelected ? "text-white/80" : "text-text-muted")}>
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 ml-2 shadow-xs">
                          <Check size={14} className="text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Personalizado & Salvar no Firebase */}
              <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Input 
                    value={customTimeSigInput}
                    onChange={(e) => setCustomTimeSigInput(e.target.value)}
                    placeholder="Ex: 6/9, 3/8..."
                    className="h-9 text-xs w-28 text-center font-mono font-bold"
                  />
                  <Button
                    onClick={() => {
                      if (customTimeSigInput.trim()) {
                        handleSelectTimeSignature(customTimeSigInput.trim());
                        setCustomTimeSigInput('');
                      }
                    }}
                    disabled={!customTimeSigInput.trim()}
                    className="h-9 px-3 text-xs font-bold uppercase"
                  >
                    Aplicar
                  </Button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    onClick={handleSaveTimeSignatureToFirebase}
                    disabled={savingTimeSig}
                    className="h-9 px-4 text-xs font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md"
                  >
                    {savingTimeSig ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    <span>Salvar no Firebase</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowTimeSignatureMenu(false)}
                    className="h-9 px-4 text-xs font-bold uppercase"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Andamento & BPM */}
      <AnimatePresence>
        {showBpmMenu && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[250] flex items-center justify-center p-3 sm:p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 relative max-h-[90vh] overflow-y-auto custom-scrollbar notranslate"
              translate="no"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand/10 text-brand rounded-xl border border-brand/20">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
                      Andamento & Velocidade (BPM)
                    </h3>
                    <p className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 mt-0.5">
                      <span>BPM Atual:</span>
                      <span className="px-2 py-0.5 rounded bg-brand/15 text-brand font-black text-xs font-mono">
                        {editedSong.bpm || 80} BPM
                      </span>
                      <span>‚Ä¢ Original:</span>
                      <span className="font-bold text-text-main font-mono">
                        {originalBpmValue} BPM
                      </span>
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowBpmMenu(false)}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-text-muted hover:text-text-main transition-all cursor-pointer"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Feedback Alert */}
              <AnimatePresence>
                {bpmFeedback && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 shrink-0"
                  >
                    <Check size={14} className="shrink-0" />
                    <span>{bpmFeedback}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Display Gigante do BPM com Nome Italiano do Andamento */}
              <div className="bg-gradient-to-b from-brand/10 to-brand/5 border border-brand/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Batidas Por Minuto
                </span>
                <div className="flex items-baseline gap-2 my-1">
                  <span className="text-5xl sm:text-6xl font-mono font-black text-brand tracking-tighter">
                    {editedSong.bpm || 80}
                  </span>
                  <span className="text-sm font-black text-text-muted uppercase">BPM</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-brand/15 text-brand text-xs font-black uppercase tracking-wider mt-1">
                  {(editedSong.bpm || 80) < 60 && "Largo / Lento (Solene)"}
                  {(editedSong.bpm || 80) >= 60 && (editedSong.bpm || 80) <= 75 && "Adagio / Intimista (Balada Suave)"}
                  {(editedSong.bpm || 80) > 75 && (editedSong.bpm || 80) <= 90 && "Andante (Worship M√©dio)"}
                  {(editedSong.bpm || 80) > 90 && (editedSong.bpm || 80) <= 110 && "Moderato (Pop Worship)"}
                  {(editedSong.bpm || 80) > 110 && (editedSong.bpm || 80) <= 130 && "Allegro (Celebra√ß√£o / Louvor Vivo)"}
                  {(editedSong.bpm || 80) > 130 && (editedSong.bpm || 80) <= 150 && "Vivace (Jubiloso / Festa)"}
                  {(editedSong.bpm || 80) > 150 && "Presto (Acelerado / Alta Energia)"}
                </div>
              </div>

              {/* Bot√£o de Restaurar ao BPM Original */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetBpm}
                  disabled={(editedSong.bpm || 80) === originalBpmValue}
                  className={cn(
                    "flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-2 cursor-pointer select-none",
                    (editedSong.bpm || 80) !== originalBpmValue
                      ? "bg-amber-500 text-black border-amber-400 shadow-md hover:bg-amber-400 active:scale-95"
                      : "bg-black/5 dark:bg-white/5 text-text-muted border-border opacity-60 cursor-not-allowed"
                  )}
                >
                  <RefreshCcw size={14} />
                  <span>Voltar ao BPM Original ({originalBpmValue} BPM)</span>
                </button>
              </div>

              {/* Stepper R√°pido de Ajustes (-10, -5, -1, +1, +5, +10, /2, x2) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Ajuste R√°pido de Velocidade</span>
                <div className="grid grid-cols-6 gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateBPM(b => Math.max(20, b - 10))}
                    className="py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-border text-xs font-black transition-all active:scale-95 cursor-pointer"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => updateBPM(b => Math.max(20, b - 5))}
                    className="py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-border text-xs font-black transition-all active:scale-95 cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => updateBPM(b => Math.max(20, b - 1))}
                    className="py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-border text-xs font-black transition-all active:scale-95 cursor-pointer"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => updateBPM(b => Math.min(300, b + 1))}
                    className="py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-border text-xs font-black transition-all active:scale-95 cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => updateBPM(b => Math.min(300, b + 5))}
                    className="py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-border text-xs font-black transition-all active:scale-95 cursor-pointer"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => updateBPM(b => Math.min(300, b + 10))}
                    className="py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-border text-xs font-black transition-all active:scale-95 cursor-pointer"
                  >
                    +10
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => updateBPM(b => Math.round(b / 2))}
                    className="py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-brand hover:text-white border border-border text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Dividir velocidade pela metade (Half-Time)"
                  >
                    <span>/ 2</span>
                    <span className="text-[10px] opacity-75 font-normal">(Metade)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateBPM(b => Math.round(b * 2))}
                    className="py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-brand hover:text-white border border-border text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Dobrar velocidade (Double-Time)"
                  >
                    <span>√ó 2</span>
                    <span className="text-[10px] opacity-75 font-normal">(Dobro)</span>
                  </button>
                </div>
              </div>

              {/* Slider Cont√≠nuo */}
              <div className="space-y-1.5 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-border">
                <div className="flex justify-between items-center text-xs font-bold text-text-muted">
                  <span>40 BPM (Lento)</span>
                  <span className="font-mono font-black text-brand text-sm">{editedSong.bpm || 80} BPM</span>
                  <span>240 BPM (R√°pido)</span>
                </div>
                <input 
                  type="range"
                  min="40"
                  max="240"
                  step="1"
                  value={editedSong.bpm || 80}
                  onChange={(e) => updateBPM(Number(e.target.value))}
                  className="w-full accent-brand cursor-pointer h-2 bg-black/10 dark:bg-white/10 rounded-lg"
                />
              </div>

              {/* Bot√£o TAP TEMPO */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleTapTempo}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand via-sky-600 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/20 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-2">
                    <Flame size={18} className="animate-pulse text-amber-300" />
                    <span>TAP TEMPO</span>
                  </div>
                  <span className="text-[10px] font-bold opacity-80 normal-case tracking-normal">
                    Toque repetidamente no ritmo da m√∫sica para calcular o BPM
                  </span>
                </button>
              </div>

              {/* Presets Populares de Louvor */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Presets de Andamento</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { bpm: 58, label: '58 Contemplativo' },
                    { bpm: 68, label: '68 Worship Lento' },
                    { bpm: 76, label: '76 Worship M√©dio' },
                    { bpm: 92, label: '92 Pop / Moderato' },
                    { bpm: 115, label: '115 Celebra√ß√£o' },
                    { bpm: 130, label: '130 Jubiloso / Festa' },
                  ].map((p) => (
                    <button
                      key={p.bpm}
                      type="button"
                      onClick={() => updateBPM(p.bpm)}
                      className={cn(
                        "py-2 px-1 rounded-xl text-center border transition-all active:scale-95 cursor-pointer",
                        (editedSong.bpm || 80) === p.bpm
                          ? "bg-brand text-white border-brand font-black shadow-sm"
                          : "bg-black/5 dark:bg-white/5 text-text-main border-border hover:bg-black/10 dark:hover:bg-white/10"
                      )}
                    >
                      <div className="text-xs font-black font-mono">{p.bpm}</div>
                      <div className="text-[8px] truncate opacity-80">{p.label.split(' ')[1]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Metr√¥nomo √Åudio & Salvar no Firebase */}
              <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={toggleMetronome}
                  className={cn(
                    "w-full sm:w-auto h-9 px-4 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-sm",
                    isMetronomeActive
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20 animate-pulse"
                      : "bg-black/5 dark:bg-white/5 text-text-main border-border hover:bg-black/10 dark:hover:bg-white/10"
                  )}
                  title="Testar o andamento ouvindo os cliques do metr√¥nomo"
                >
                  <Volume2 size={14} />
                  <span>{isMetronomeActive ? "Metr√¥nomo Tocando" : "Ouvir Metr√¥nomo"}</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    onClick={handleSaveBpmToFirebase}
                    disabled={savingBpm}
                    className="h-9 px-4 text-xs font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md"
                  >
                    {savingBpm ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    <span>Salvar no Firebase</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowBpmMenu(false)}
                    className="h-9 px-4 text-xs font-bold uppercase"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footswitch Visual Feedback Toast */}
      <AnimatePresence>
        {footswitchToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-emerald-950/90 dark:bg-emerald-900/90 text-emerald-100 border border-emerald-500/40 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 backdrop-blur-md pointer-events-none"
          >
            <BossPedalIcon size={18} className="text-emerald-400 animate-bounce shrink-0" />
            <span className="text-xs sm:text-sm font-black tracking-wide">{footswitchToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DynamicsGuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[260] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-surface border border-border rounded-3xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-5 relative max-h-[90vh] overflow-y-auto custom-scrollbar notranslate"
          translate="no"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-r from-rose-500/20 via-orange-500/20 to-brand/20 text-rose-500 border border-rose-500/30">
                <Flame size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-text-main">
                  Guia R√°pido: Se√ß√µes, Din√¢micas & Express√£o Musical
                </h3>
                <p className="text-[11px] text-text-muted font-bold mt-0.5">
                  Marcadores visuais autom√°ticos e bot√µes interativos para cifras e letras
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-text-muted hover:text-text-main transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Novidade: Bot√µes de Atalho no Editor & Clique Interativo */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand/15 via-cyan-500/10 to-indigo-500/10 border border-brand/30 space-y-2">
            <div className="flex items-center gap-2 text-brand font-black text-xs uppercase tracking-wider">
              <Sparkles size={16} />
              <span>Recursos do Leitor e Editor Liloupro</span>
            </div>
            <ul className="text-[11px] text-text-muted space-y-1.5 leading-relaxed font-medium">
              <li className="flex items-start gap-1.5">
                <span className="text-brand font-bold shrink-0">‚ú¶</span>
                <span><strong>Inser√ß√£o em 1 Clique no Editor:</strong> Na tela de edi√ß√£o da m√∫sica, clique nos bot√µes r√°pidos de se√ß√µes (<code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">+ Refr√£o</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">+ Primeira Parte</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">+ Segunda Parte</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">+ Verso 1</code>) ou de din√¢micas para colar a tag direto onde o cursor estiver.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-brand font-bold shrink-0">‚ú¶</span>
                <span><strong>Badges Interativos:</strong> Ao ler a cifra, clique em qualquer etiqueta de din√¢mica ou pausa para abrir o modal explicativo com a orienta√ß√£o exata para vocal e instrumentistas.</span>
              </li>
            </ul>
          </div>

          {/* Se√ß√µes de Estrutura da M√∫sica */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
              <Music size={14} /> Se√ß√µes e Partes da M√∫sica
            </h4>
            <p className="text-[11px] text-text-muted">
              Ao colocar o nome da se√ß√£o entre colchetes como <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Refr√£o]</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Primeira Parte]</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Segunda Parte]</code> ou <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Verso 1]</code>, o aplicativo estiliza automaticamente com o mesmo padr√£o visual de destaque:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> REFR√ÉO
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> INTRO
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> PRIMEIRA PARTE
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> SEGUNDA PARTE
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> VERSO 1
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> VERSO 2
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widexúÏΩks#Ir ¯ΩE∑5 j…z∞Y,±HVµ≈*Në’íñCÎJI"ªôòLÄè¶`¶3ŸûNw{”ÕﬁÕûNk£÷ﬁ⁄ÿ»vÃŒLwf2}Â?È?†˘	ÁÓëëHê,ˆÏÃ¿∫Y@f<=<<<¸ô∞„”Êi‚ı?5Gq3a'I<h'^‘cª{ÈEÕïvõç¸ãQÛºå|v'=?ˇ¢ù6K˚^/>o^§sÎü0„≥∂;NÉ.KÉØ˝gWãù	[Xg_lø›√ñå≤kÈ–ãÃ÷!ÎÜ^öæˆ˛≥πì–ø`0òA⁄Ï¬–a8ßﬁ∞π»ÜÕ%6ºÑoI<éz~ØyÚ±_§Ï$ÜIá^˜á~“ıRüç¯DßÕÛÄfı√c˘˜–‡±Úª	èWﬁ•ü§:@ˆﬁº>ÿ˛›«øÛÜ:,ˆﬂºzSkΩ‡L}$(OÆ≤«ÏııØŒ¸ e=üm—ı?ÇÆ«.L‘™PSÖ)Ù÷ıõóÕ%c¿k˝eµÿ,–§≤xék≠¿≥ˆEé~Ghô ‰òÌ3/4Ä‘_÷@RúÎiÙ˛iv„0tI´˘œç≠c˜ı¢»¨É¬:«—ft?<ª™7ÿ≥uÄNpzÍ'[óëÉﬂæÜ^‰çÇ8™◊¢≈Z√lì©#bKúÓ R¢Q/8ç€*Ôñ⁄*”ëóåh~K¨;N“8i„Ä§ü˘…j
‡Ùõáã≠vÁày›QpÊãgOWp}£4¿!7Ω05ä]>jœs±ÏsO√ﬁê„Óm√?rÆ·©cOäÓ·fåïŒ’≠i¡U˙:à£6hDömjñÓ`ÜhÎüˇáø)ŒÀJ¡8Üÿ⁄YÎØLŸ^ÙHL1L∞Á%V’áK0€ÉsÎ˚„Q¬&X±v7,Ùv∏∏8º8‚›–ü¡x‰˜ÿ`Ñ1∑æxQº∞ÁıÊ°f0pvat˛ ˜˙◊ˇ%f>Qêv–Ô÷⁄¬– ìv)m€¨Û1∂YgˆmÊ¸ƒ{ˆ}¶æºØç¶ˆy;Mˆ'∂⁄»˜B˛˝û6Z7⁄∫Øç¶Œ6ﬂiÚÈ≤æ’^¯∂?ˆŒ¸ª€nÒè«>˝3ûy	†¡W1m∑†á˚,Öá~zG[lÈcl±•Ÿ∑°îueoÓkseﬁ«Œ ∑í`-Ôs[-·∂˙Ÿ}m´l™˘û¢GÀÊŸußõi3¯◊øò â˙^;)∆†K~Wªh˘cÏ¢ÂŸwQ˙·“æâ‰ã˚⁄C≤ø˚ÿBÿóÿA«·ÿø◊¥å;Ëˇ∏Ø$göo |bÏü› }w[(øk˘?a ◊π|gI0–…x ªõ≠¥Ú1∂“ Ï[…[7S˛Íæ∂Sﬁ„}l®¨7‹R1Î‘ø◊k’
n™ˇ˝æ6ü≠æ≠¯3sc˘AÃ^∆…ËOßÌ»ON8ù¬ëó´x¿|ò‰ı/b6Ùèu?Ìÿ<ÿf·ıØﬁ≈›l≤Gcì=ö}ìÂ»U‹e ª˚⁄fJó˜±œDw‚ÏJ¸ﬁΩÓ≤G∞À˛„ΩØ]¶Ã5ﬂf‚°±œÓxã}é¬Gü!Ç¿¬˜<¯Ó≥!l,?Bæ~û≈]/HÔfg=˛;ÎqÖùïVªqÿƒ≈kvÃ}fAæ$N9¶w⁄Ï,$˙·O(î8s_fóùª2√º;ﬁüY◊èÔawRgàØ:bü*ß„=Ì‘«Ï€ø˝Êæ6j6Ì|õ“#mì∫fbøXäıM~Çπ∆M≠»“§0\π˛ÃãÇÅ7Úõ√qÉ-XÁ{wá4l∆8E)g
À	«Ú(y·<ÉEK2Òg◊˝c˘sp˝Õ IÒ@˜Xpö¯_y≥”ó“GvµœN‘>∆ÂìñFﬂR>¬⁄Y|ÄˇùËÅ&ùæÍ™†ù◊[;õ[oﬁnÔ≥≠m¯y∞˝zgkæèmˇ…<ﬂø˛ã7?öNË∂û≥yQ/ûJÁ;
Â‚§ù‡æ∞¬∑+¸&zøù$ˇe=6z∑Ñ˙,àCD§zÂHµËNË·8Ü1 G“8Ïe¥Z°∫õrÿ∑ˇ„œúÑ’eÌ»∫CÅ÷qÄM{a√8°/ù∑ïÕ∏-≤ı¸ﬂ:tÀπï˚¿∂¸¬œ.˝0$öŸ∂Ú t˚OwènﬁYµá≠«¿⁄¢"ù_&G9˝øO|z„‘˚m¡¥åΩDÀX1q;ú…ˆÍp√˚ø˛ÊÆÒk·òåáúëà«(P°Z™KRu°∞∫OÛ∫ﬁ∂·oíI£{A≤\Èd◊ÎñbŸÜÄ< ⁄_ˇﬂwçhC?Ú“åñ†á¿l{—à(*CÉ(%@Â¢QúﬁÎA
ù¶ø-8ßàæÓÎt—ór¢VDº˝Îb/‡òà{ˇı∏k‹˚<â:xÖ¬˚Ãò_°®Â‡ú^<Ω{?JΩn<NGA˜∑ÈææÌ±êË®åõC®SäÅ_¿ùëb◊É˚."ê¿æk4|Å7ÈæóÆˇﬂàÙo,π˛’àTq›8ÍçøÜª`håŒ}b„ˇ≤€«m¸€Çé'„n?‘∏/Ñî˝I!„•Ñíﬂì¢Æ 1>ˆÅ·?àÄâ?˝üÓw„ﬁ8∑ıÛCˇL¸Ë°8,ÚBq´ıÿ‡˙_– ∑KŸ%[[àÙ–√ªtöÙjÿ\R†/$‡‹(ª†d‚èù˙%S˛µ©°üY±?) (πå+˘
¢)¢4«,TY/àòƒ´∫SY(Ç”´ å«√$^µ»-ÚOe…t∞s∆t´DÛ¥≥∏{˝èÓ±â[àf'hv˚˛ ‘ç1 €(â£S;åÊ÷S8≈O«¡»;l°¢ÎÛS+ç|xCñpCØ7KE"⁄√œôzL—")ØÄwûiUÚÎóRèKE£Ù$N0êÒ( )Ìz»∫¬û∞ÒÄçºSƒÚ^fr1D+%‹__„§Q†|èp„…É˙gBW≥–FqB∆π¡I‚•
õo8Û÷+lÆQ≥√7ÀW»äú\6}ú∞ﬁÏÒx4¡<[FóChÄøõ3_f«~⁄71Ëdñà,“Zπµ%%?õx∞®¥ÛÜŒ ∆qaú7Ç¸z˙YaÓõmbÙËÁ?1ˆ‹Rû*E÷6∏dètô]7>˚dÚ…'˛≈Ó‰Ïdu±∂qÊ°wÑ¡ËÚã¿?Ø_°eT}ú ña©tûç˙˛¿gìUf}ˇ|ïy—•(?jap⁄’ÿü±Bª∆&vc É hbú˙…<“çﬁ àÊŸ¿GkÀyl¬û·€çÒ®_áÀ*Xa≥?N∫˝ùî»+<ouÂ„?Éﬁ‡“á;¶ñ◊<ÑÖI‡ˆÁaüç6ÛﬂGº≥˝|ØG˛9√áıÜ“/`÷Ë]∆›~Ô¿KN˝—[ˇÑ◊Ç/∏’!`ö—8◊Î¯W©|É>∫~J˝Óãjßk µ√£ı˙·ëZÕÀ◊$ï7¥Gö√]Çë®û˝ú^5ÖºÙ>ÿæÚ@´éÚπ€¿ÙÒx§)‡VHµFØX:Óò“U†fqË{—g∞‹iÍù˙´å√˚3Ê!ﬁ§àå¿{*œá˝8 ~≤…·ë(∫GfàXjVÒÖZ–µöA˙˝˙Pí¶±ìˇ÷ÈƒS_≠àË£LˇUˆ”\åbü£`‡øÚOFTÒ@¸–™Ò°Ø◊k5µﬁòpˆÒX ¿ª¸∑V;#V¨◊9GE‘É7ë¬¡Ü[Íy·>∞ -¿ˇ`Ñ‡∫964ΩlÚõ}ÏÅèÑ±ƒçìH¥ÙúΩ¶æÍÙ≥¡VŸÚ,6QáM∂£|ÿ{˘oÎ§? ∞yCg^Õîè=õ‚·bgûuñÁ·˘<{ﬂ;m¯ÛË…Q+à∫·∏Áßuh∞-Ì”–˘/ î]8*„A≠ âƒ¥ÖcfÀ˜zaÒù¯÷x8&bxn`»nö=—d≠At¥”^m∑›£⁄ÂÚÄº|F˙‡åww8∆ëhíèQ{µ7·ı7ÏÍıõ›Ì	!zÏû≥7lòx_˛gÄq8ì«pM“a∏¸ÚV‚„ﬁƒÏU<>ãQ!ù@è_˘Û‰^¡π+¨l¨w,u˚-ˆÊ.¡»}°∫é»}ÇM
±$ÕÈ€Ú«)Ûé—®(ˆdPÖ 0€''@]5àh†HÀókûôòBÎ5ô/¢–—-˚Ã¿ü˜i¨u°k¯ÿF∆·Ü·%∞•¿πèXpÇ‹Ì Ó}x‡çXﬂKaU˝àç≈QÃÍ	J¿î¡f<A»√’.°Hôy˚»ˆıÇ[Ö&ø ∑Qﬁo≈w=ˇƒá#`3ŸIê‡ô{=çû˜°Gè·¡∆+¿∞‰ ZN@¬$Íê]iÃVâ
VN8ˆìKÿÄJx∞¢¿§w<œj*a˙íJÍi¡i
ó™ nÛœ`∏˚ë7L˚Ò®û∑:œÍ)<UÜ#+úÒ‹Ië¶AâV/Ó¶≠Å7¨√,|_–[ÖM–mΩy÷jaâV8,ò‹aÁSCå'áÜlYv“:	BÿD40lˇmek˜ÏŸ3`û«>G	3≠≠VËGß Òu÷nd°Ö›GÓµ€á[S∆ßÍ;[∏8s
üÊÓÓKcÀ∞{éP~C-¿7@ìTØ›»◊Ä5Íuoû0=ÄJãˆàøÄ®¯ıcx‘»Á a≈Á âú˙¨¯~±	Œ(˜˛”+xÄÙÓ%ú¸Í{IΩ1i~z%N	Òé*¿:|ü-6Zpµ›G1DéôZª÷òºW∆ z«hSúå˝¸|œßÄï!^}⁄qœ¡m!ÕÔ<j∂ü‘ Í‚˚„Z√=oÛù±Ó:ËlãÙ†UeÍ*‹B6)Ò÷XünAÄG;ƒKﬂ<!8Ï%Aú ª¸µO€ÈO6(„S8ç˘æ?˜ôáî(b4/J”˘Paîñ1ñå≥…èÚIMòú¢9Óù‘ïäqÚ·…—¬a‘˜°_ÄÜ∏’)ì“_2QRÿ\™®WX(‹ü˙RÂM‚:(Í@7`£îSõ∞ÃöÊ˝iˇy ØÜZÊkf,ﬁÊa€ª;÷Êxh%,˙B¿†ÚE˘DC:•·Ô}OÈı  eΩ ∂ƒ‘uÍ69Äuûœæ!á§5‹Jáp‘kÕö{^üóDJ’Ä•˛N4™gç.∂ùuhA’Jr TAÚŸ'∆R?“◊ﬁÎzﬁg°†=•V&"îÇ≈úÔgZUq¥·Ï·wNïúÊ#ôWg3hË≠Ë˝∫“\±†z¡uñT1D˝ÿù∫ü$qR8t·Ú⁄¢7ıπm¸áÖA:Ú#ºhÈUO{Œ¨ŒÕ3ﬁÔw"â§‡ê9ó°pıåﬂB~É_‚s^ò*ËÅ_˚âAﬂRLøyÚÍ™xHiD}<]¢ÄÃöWW`ÂI˘Ây GTàékTqW˛“z≠ù˛9Iõ¸^0j“ïøWbz¨âEÕæ)‡ÿ0üñH98î≤ª(†¯c‡)S`ï°HqÇ…¬+…≤ZMÂÏz¡i0JÈ–¥xÂÆ__¯—÷¬)ÒíPºd°|«_IáD|±ç˜$ÀÛ≈|ª ÜVVj¿^≤˝T‹À_LîŸ#€ú›œ_¯¿s‡^≠Àª	P(F¿˚ Œ˘îÚ‚8\ıw~yÆ≠÷ÖYgÀ âÿ@–RµAIWkÁ™—¡æI9yôÅF+Õ28vN˚tÂﬂ∂QÊŒ†I<|V‘V‰´5db‰èÔ?cùÂœÙEzüÒÖ¢îÖ\Õ Ï¨"--Î"/Ñ´àµ|ı’•Ó√ç*Ù˜˝®'Ô˘∏‘‚÷
Bòƒ;ﬂCIJj[Árw†\AC˚°(£m¢∫¨¨›}N`ﬂ°ÑüZD∂6hë¯Óπ\Â?¨5€G‘œ.è8k˝EºŸV‡4®7dmFµy˘O‰≤	…#‘r\iÙÚ]Kí∂µ¡ˆ∂˜˜ﬂlLpc«{…í˜zCY9eÑ|Z~‘Çÿ€ÕÜ º{ªÉWÄ$¢/©ê~æ¸Áhá|ﬁäá~TﬂçÜÈÍ¬¬π◊¯ü^QŸ…s‘é<˚ÙJÔoÚpÎÀ„–ã>»Mfpx%MWo“äéõÒÚÛ$7¢(G]˛#^0íXÅ@äB†5ä_—•à}Séö/ﬁ÷ÊŸØÖ⁄å8:Ö»d¡/ “~tkB4¶b“pmGßBﬁNwÏAÒ>~KÑŒöAâ≈Î xùìíoˇ¸ÿ√OØ≤˙ìáí64Z_≈ATØ˝(“≈˘VxˇÎüˇjoløæ˛ÀÎøx√vw^ÔÏ\ˇ’€ù7ËsÒÍÕª/ﬁº}à∆ˇ£ËG—Ø˛≥ü˛Î?ˇÑ˝ ˛ g◊ød1ª˛ópb8V<·ÕÍı<åd“Q/í∫EuÉÎ$7òC∂∂ìá-ÏÓ€ø˝{ÏMJ Qˇï@˝á?xÛG€Ï˙ÔSˆÈï)õ<|@5ÚOÏ·Kt∏E/@®7í’á?ä‡íéã;¡2{x≥ˆŒb8<TS¯òOäú› çpNºÎ_x$*LπÿÒ˙◊ˇ‡j∆=$¢°X˙ `Û7âê˘è?É·àÇÚ“Í¡Ωı4à®ªMòú7àS·/§âq˛pÉè©πˇÛ'Ô yg¡©7äìV7Ü«±óÙZÁp∫uaR@8"Êv˝§ ¯4QÓ9–•ü/ª˛&Ò…÷Çk´˝‰˙£n‡=`õ¿Ì‚Ωï»¯P{\#¬ŸÎ_¬Eº5◊0ôæÖQÁ®rìú%DYRzu·Ñ°md37+Jâ˘®l¢ 2+Øó3æ¨¿ô÷ÖòJÎR≠dt‘UﬁÜOÚ«0ì£dÆÆR‹bøZc>+wé¢–zY˚ùPü⁄≥g5©*≈€'“˛c¨ˇ¢
JCdŒÚ‚≤^Îq·m™n&Ÿ1ò"ÙœΩÄ¯ª≠∏õ÷lB±†Kêòã≥Jv–a°Ï¿(Ú#ñ˘∫{@ºOÅNò4Ô+aPïÆQY√'AD"¬´|,˙Áé‚)#ÒÖcô:zAwzí’ùGË¯´L‹.Hœ∑ö≠rË”5eÈøëJjÊÖAË«mÇ‰?Ø`¸ÌÖ 	÷ÀÔÆB¯´å|œ#!ÄévÆ¬§l∂SNrÚÂßW¢k…K*ï∏jÄ€ÏtﬁhŸµqpÍltY…`ì8rˆ`è|¿œ∫Ï\πØ€Qà˙¬ˇïbJèãwqV$–”À±∑ Ø‚›ß¥7≤æÁ5ﬂÉ´L¬m^y«—Ct£æê∏¬ˇUﬂôƒ∆hïtL~Çö`(6÷ï}>QÊØ	Q`QÓgpπ‘;T’5)J ¯—´,ò*¨ëjŸV´%[ôóU∞˘"tàt‰ò¯Qı2H Ëp…%i/3œﬁ…‘*é.á~ÎèﬂÓlqﬂA_FÒÈiËsÍ¬m	¸ﬁæ@˝Ú–Mägê‡wu≠É ª¥Fô©ZµSé'ªtòàÉIäò%úZWΩ¢¥≤†uœZ94&qƒi√â(öq≈ZSÄé˚ 0r¥»ZŒQπ–«™:òÁ¨6‰«5‘€g=K≤éÄœ\ßã5˛0UÛ9m·òä‰%k@•/E@ÆjsÕßÑbXu∑ΩÚ^†"rc&£%wk]&>ùØ<º¨ØŸO˜2^8˙X£›på>Íπü1µU*
ﬁ¥∏=Ét+>èÑ¯rØw"Ã~ÙáÂ‚À ›&ã;(ª}—ıC—Ñ˛–⁄Ñ¡(ÛT<':Kl6´≤ØE≤p…UNB`√ÑÚ‡§°@íQFÜpHq®˘I≥Ω¯ﬁ±ì/x¶>‡í4Ó—®äÅº)°=—Z-õ|V0@°Ó  2ík≈pYõ˙Mb#‰Á≠oÚ∞é˜	πÓbkáè∏‰ †Œ∏:»7F%O<∆B‚*!Kñ_)tH"öoÒ€à§»N¡ãNî’ﬁ’¡H6CÈõ3Lt‚ÊıΩÔ—cïIÕŸ˘Üñ¸™ôfga÷õ¬≥XfÏ´zÁ¢IÇaè–P∫6∆@fÂ#e †xøÚ>acƒ/I[	7Rˆà≤•ZJ,ÛÊ¯+u´Ê∫J.HüWëô
Ry⁄ª§ßñ÷œ}ˇCœª‰õHt5Eî'™¿…ùˆaÓ(ºÀ$≠µVM—≥O.rÔ]Nê@MX˝”´ºÁI„}^>öA;EìêN≤îv#IºÀ0n¯o}–¢Wh(æ*Õ ó!J…˘'∆‡‘ïö{|∫HA·‹j5¡bMÂÂÁ∂—π$§∫T√RDJx®ê.‹◊ Ì(æ∑lÅΩG\ı$@¥Ú[Åó≤-∫’ÛX˛PP«[≠¯Qú&Ø˛+Cy≠π¬K´≥+ÑÜ¿OI…T∫CypÒ⁄3ihVN¡RıqöÌä`\^˚Q<êë”cí%∆cVîçzA$≈s¿Ã˘$Õ8öYÚãé¯¬˛(ÖãKÃπÖ¨F6»xÔ∑Ùnø$ﬂ∆ƒ|)œÓ/≈a˛>Ø4gTíÆæOøm9x?>`8∏i¥¶≤<‹õnÀ9Fáﬂ¨â!~<F∑j#g¸lb¢7U&) ’c*ªMfÁo}Ú∏∞Òl*SÜ⁄¶ƒÔCÙL•4È	Ó·ëq‡˙#U∫_î’’≥[Ü,Ñ¥$R}5j9E%Qã“XÀø lKÎö9áËìÆcjY~"ÁxFçıZπΩ=ûì⁄°òh(Ûl«iøn-U“rß–tßZ€ù
ç/_™÷¯íŸ¯D≥R”µÛcîk"¡òOGá∏˝+‰ù≥"É‡√ òì”?<%xv„AçÏvD1eÚjg- ∂€^∑œ,W4jO4åF? 2µºxoÅå|Ûô&d)^)>ñNéo®„∏wâÆ¥‚Z®∑€Ø6Æ*tU[;˚{o^Ôºÿy≈cÑmm∞Ìæ€Ÿ€ŒY?ä≤ì>kÔ˚–‡ú!øä{Ò*StP≠nﬂK6FıvÊÒ}«6Ω‘ß{A^&`;§·±7˛ÎüˇÙÜ°Óø€•aÓmº=ÿŸ‹Ÿ€ Ö€™´jı0ûríHŸ∫¶8NÓÛ,Wúc‚§¨µºëM∫0_ˇ™«[2ŸÌô⁄⁄Bâ~Z‘í°0Õ¢¶î-d-gö~ÍùrM‡ÓˆÓã∑oˆŸﬁˆÎ≠Ì◊<0‹Ó∆€Õ"4ô©æïõb`≤∆ÖŸ¡DL~k¢µ¨lS§l,˝_ˇ¨"¿ô¡Éh_]#§◊øÇìóyôÇë´Œ‡Å“y∂Û¥é~}˘çÅØˇ)	b8@048zõ≥W¡´xºóƒ_öó–lósn∂H‘`5ÄôUû~ñÿY”n'Ö˙ÍÊÃ«C\ùŒÎ4’ù6Åür†Üaª/¡ÎË{˛cïæ˘‡'œEÁôÒÅf.!^6&ﬂCÄŸÀHP*¢O’“!⁄2§~xR+∞=SYû!‹P<[˘ƒñ[%\~'´ãäÀ$É¨Sﬁ≈ô)›"IDx©Ú3{Ω∑ÏIóä˝^ˆÙ{Ÿ”o∑Ïâf∫Î_\nëL˝≠;±∑&µ¿í_GÕ√$ﬂ¥Iı„'e'êP~hêH≈°ÈŸÆR⁄ÂBµqvU‡Ã].Àè4<¸*.ùû±#‘∫HË¢0õ/xÿêÃlô A€´toÎeæaƒ?Ïæáä/º(ÚÒòDvh∞Üõ1∞«ıG∞Aaì.Âªã†œXΩ=œ‡øŒ"¸YÜˇk/kf'¢5< xkùï®!˛h-bß∞≥ˆÉØÅÁ{b{UüÎ˚·˘*âü£h6¯Òòe⁄‚’ﬂóü¿»îdl‹{ ‡2¸ˇƒú|÷ãf°¨'ú≥I2⁄PfõL¿n¡rãAw9◊Ë©eüsÊ»`œπöª¸çâ∞5≥îF≈[q±–	Vß”$ckT—)KˆLéi)ﬂË«i0[D:îb\œ∂Îè<≤‘ysÜ€Œ?w°.«ˆ∂i´,üé¥‰Êh8ÑK{@Ì`¡8«:«Á±“ôÜ<OoÖ;≥ﬂÜÄWlhê7ÇqnBfrﬁ%◊#—¯£ï“∆—÷O·Ìá‚∂ƒPE˘t“Ü˚‚$∫xº®!»€h+8√‡%:@∑Ô\1t[ó¥!¢ïdù⁄E≤˘Ù~±b`gïqç±ﬂÉ˝zŸ<æl¢è° |4€‚Ê_$n&gÏ≠ÄÏ7«¿Ö\{≤b%#<cQ“IˆáGÜ∏M?√≤ìXúb6›R∫UT|à‚-≈,+Ø†I∏ëŸ™§Œ‡™ÖTBü?±(<ú}#=≤ı}:ÂTE!˛≠I“ƒ.R1q†+&i°ˇéòíã
oïT*G„jËµ0÷6[Vx&‚«;=Û‚Ø´˘ZÎÑÑº*I`0ê˛îcüf@∂ö‚Å·àFÏ\÷hÊF¢˚¡Ê›√ûïˆ„≤N.~»û∏’>∂63Ñ-„µÑ·o¯Ü˜:—o√:&ß¢+êPx°4R¶H¥ñ{Œﬁ£ÍÕ,œOt$U™Úm“xoT_-L6◊Ìiû|z%'0yØ÷òhjX¡µø‡¡iä⁄>«84Ùg™∞Di˘πY,∑√Wã¡|l !,á™–BE-‘<UÉò>Œ–*Ì´`¡Ω5˘QTW!M  k∂Åb#èÇQË´/¨”v XeÔé2SnÌ ã„Dµà¢õ‰üÆ≤ßãyÎ}∏¨≤√√Ÿ¿ù N<D:ÀGdVùª™Ú±vtî7Ö¢û’f˘äwÇô jz◊˚£À–ßE |O‰Â∂ºÑbû"ˇº|4ØñIŒJi◊
Ω)£^` x,jÍW<Øˇ8Ë·°–n-öo≤÷€∏ƒü£¸8Ø@÷6qdØ≤'≠mL]?˜º
ÅVŸÚm§ñ:Û¬‡4Ç©é‚°6St?	„sä:˘«âÔ}®Ÿ¶“≈Ä˜Q∂.Jm
kC\ÍÃ°´6≈ê—÷™,∑ı˜„=ÍÀ)P•FãKFçb{ÕÊwlÂª†˙Ó/£ùÅBåAL0{‘zp*=÷êuÇÖ⁄É'ıﬂ5„πc‹ëoz9æ(,JÒ¢F¸~&@œ˜7fΩ°Î£‡óL~Pò[∆Á©ù!4Œy©‡∂∞Éd?j±MJ„ÅopE[–Ãä;CNS%.@RÕî2/¥U™j©DπãxO¸ÿ‚√◊é(8ÚÒ»+û.u8’√‡,~W;ÇÒ∏‚≤—Ä°V4é1¯ÉâQÕP%M∂N≈Û´åiQ˜õçCQÏqîﬂÜQéÚÜ∆’‘»áŸs8gﬁºﬁ|ıÓ˙›zC√R˘§÷!^~¯)s6Ñg∫H–;ÏpÎËc¯¢ã„„hä⁄‡ëÇ9—…™àFµi=gÕEò€‚MéÍŒÀQùy9¨]ˆC¯éov¸V∞≤‹9‰ä'7äiá˛ÃáwFÔÊ‰æÛìóŸZúr ˘	ı8ZióÄèV,†~GPÿˆº˛Œ<Áµ∑nx±*g®Ì‰µ¡ß¿qò§˛&4∞ ∏Éöy˚£H»7ß‚‹•MÅxV#ZãØ8ú[ËazAÔ;fx5ƒ Ø]∂ÄJØÑT»ÿxfsLiÑ£M+√D<øñ∞{˙xû=]>“{∞„ô÷\á⁄{¨Î≥πOlﬂ-åùÔﬁô_ø—E	—Õó¶ùôi^÷ˆNﬁﬂÃÄÏî< ˆ∂^≠ÿÕøÖ¶›¸ÎA‡™)?ÔHıYIÒy–∆pè™ˇ00ñ€¿/∆'bi?á=vÃciÒ0Ë1ÖÎ#•÷áWP
˘.GUƒ(RgW£ﬁ©u™§sûRÑ6h7ñ∫ﬁÙV˙hJO!µwäˇì€á)a UlﬁT√∞ó´@Ô&$†‚¥◊SXT¡Îf±öI¶∆tF™˛@) ¥Tè˘å$PFw÷\ãÛÿ∆uŸπ‹•÷–L’ù˘>ﬂ>–¿(ZïT/_<Ó$LWj6Î*^ÀÖï•µï˝±¢,’¥Ï∆¬*mem%ı∫[π.K\≈ΩÃS\ŒZ¡Beº
f”¯Ó±.≈”iXóﬁÎ‰$?
Œ©+\D∫=ˆø®SπÅ∑˜è≠v∆‹Yå2b‡OtW¬N]Ú?WçÚ.‹î”RìûŸ∞≤`Ω~‘l4Ó\ƒ
PPBqµG™Éá±RÅâ’XÁ4~Hg∏≠Z¬”ŒõÌ6
'ï…hD´%á÷‚:ê-∂À]ãú.Hè3Q`fı*WY`»UFÃ\—ˇ˚.VÓ}Pôøµ‘‰Ωπ†Zê?ŸµzÿÁR:ç¯è	èçg˘à,ë0d†ñÅÁcPIﬂëÍÅ⁄Û.”ùH2PﬂÊ‰`Àôπvme—qïHF[ﬁÂõì€˜É#Ô„íw°Õ$”Na¶%¿
.ƒZ’fâòÂ<h5‚	Û°Rd*g3ÊDÙ¶T∞¢€¥ú,_w#jÂ- ›‰l≥2jïæÎﬁæüıV~% 3!P®ø¸g⁄x.É˘5Tb-!‘ß=ıû5QèÉÆv«™M÷2Ñe®!z ∂¡‡‹±úi¨ŸNàf™M5©ôVü◊u_0*ºf8Åh≥Û/Ü@uz57ÖÜªÄ˙›ÖÉ¢u∆@ü®ÒV_l∑€Ï!{ƒˇ®é/‚¬A∫{£2Ø˝≈⁄Zã≈∆∏ñajc‘˛RPÁù«9§âïG9‰„/-#ÜeZa íë0qFøNRäë ¬Ìà_ıB≠y9À"Öß®6YMŸ`CRÁÈ4B§ØDuuì<◊vœ(Csd^%
ÈQçÄ<Ÿ£ıfã]4]‰¡√dÚQÁx.l◊7 =ØF¸v˝PﬂxUåI≈¿ÁêÿHqx‘ÈÄ≤5Ô7bí‰Å-ìËO—&˛Ê!îrox‡ö`:yç©Âv)j¯úgJ¯úÁBK$õTïŸÓ3òe¶†L∑â£$°yœqî&äûı-f¢·|ux)ŸÓ7Œ√êŒqƒx KL> ¨¯%≈èæºã©Ûb.bƒ`ÙòöÇ2°ƒ©D⁄äÛ≠ëDXÕ∞hW$ØZüŸöπØê?JTx9ÚÁñp?œ[”¬¯›!≈íe(}Ö◊.≥3gh°Üä„¶ﬁba@üËôá‚±ƒÔ…/∫Ek{# é÷´’¯πﬂ T\ü˝J¶Ü‚ah ›‚Î¶û6¸TñÁôHç§∞I¸˝g÷∫í5BQãÌ€5∫»ÖÕvÜL©Âb…`{ﬁÜõ˚Å ZQ¶¿zõlÚq5 x,…‰Ò6»Q1ß-û™Áîxß§ÓB$Y≤Êı4bJ!çA‡àr@q≈‘^\√ãÆ["†Üçb∞üÙ˛¸¿åKÒ¨∫ùxÄCFÌ≥∏Ô	á‚}ó^	˜0Tü‰Ÿ∏≤ë!Ü∫¯hÅø≥ˇF–∫˚ö·¶R%Á›Å*É ñ˛ìÁj⁄~‹eBÌ¥ÀƒË<7oy≥1“N@ôLyFC\UF™ükŸ8—x˛f¶E¿£ä¥7q‰gÖâæ≥>⁄“[|d?A^J´DËMYúuûéFyˆ¯à|ÓuÕ3ô¥(Â†¥ûÍ-¢aGJˆµ…{Ω°UΩ°	tûx©fH Q¿…∫÷“úÙÜ›U∏„òQÙíW¡1∫¢xÊt˘˚Jºt7Ys§=â ÜŸîæw‰òòOe
Å£L±ﬂ‡Õf¡íΩ1∫⁄dê-P⁄zØsŒS"u´©Q-∆'Â„îD>À∆0N<;◊«{ü9*]¨Ñó„∑îÄÒ>Í]ìZê:Û0æG¶Õ` ru¢Ì¯ó&@ˆHéàFn¬4ÏŒÆ∑y[⁄Èeò…MèasØÍoƒ{fÉS.úa⁄Äuúè=ﬁ∑ÔMÆœ≥˚Öb”(tﬁ	◊Ø2§R¥∞Â]¶õ@)F∂k¨÷Â6À±.6Jwˇ8Ä˛s••‘¬íéátÖπœ˜÷…’E&ãC¡.F±…Exí	;]J¢gìU}Áòf'^‹H±CI8÷
k¶fÕ/¡ªò:àª\:ÃèÜJòc/ï‹¬MØM∂KìJ⁄Ì1[≠Q[¡Y5+ØõƒDÕ!∞)e|rÔKÉì?ˆ¬É∂ﬁ5∫yY ö≈ﬁÔä<]Ôö‰Ôéz÷	Ö»∑VxË€ÇHÀ ∫êWì]iı^Z=8ÒT˝Å«@Bê:WZa«|Ã#è”DITRˇêM3Ï¢ì äòZÙBa¶0—Ü1¢0M<çZï§◊ö…zVübT9)&¬VQ	–ùG!´á¨z$≤,®óåN(¬d´me:8fÊ*‘˚L´Fπsäò2∞å≤πè◊,l"†∂ﬁ{˛ÆAphtœ4d‡÷ÔÊXòX[}4œ3À˙Õ≠Ω^ú`¢Ã›≤C√Í?∑Ü∆ãâ1*ª›ß}∆∞√Œ‘ïËÿñ¢–‹G\s a16∆@·2±X≤ù;\é%«r,M]é%€rö˚àÀa‡c.Gßd9ñfZé‚zT	ô®œ£@–≈d≈‰‹<£ÛñNåq[ßZ∆€UEÎX;7lYD«;l«1ÿ•iÉÕEEaC.n„”˙‹;b6O`◊{›|§EûbNëb‰L»KYã8…dúã\Îú=	Rí:"Ù‡†∆æOÇ”qí%&◊"u{©a,qÁawÅ.Û8ó2mx≈Äóä"«‰≤¿\ÿSzFú„Ø¡´ñ9!d≈¥RJ≈QŒÀ)”fåÊπ¢^ÅIR‘W≈∂Ñ•€DâÔY}˘≤·[6 mÊ vêS•YÿUµõ$`ï	Î>XIa˜P XÕ †ôõÕ∆C-:ß¨ãÅﬂ–JbÃ>W∏MÀπ^‰ûåªTª6y»ºÆwèÛ|AÇŒ∫„)°MaÓC]NxKYªH£gF√S@—I®6>ﬂﬁeüoø›xÖâÚ¨–˙ˆÔ˛=ì·¢Wy“AÂ∫5·“hÀÕQ8ó:õ˝…?1 ’ıDÑÑZWÔÄU/ŒT	6 oÑFåQm<ƒË√i1Fj°@mSg§Q≠ª[’ÒØˇä=<x≥√Üˇ‰‰xª±˚‡!€Iêz(“aèPÆÂÛîÑ=Là˘óÖiŒ–"?‰îÇéLª‘*Ü$UáÑ´ÒÂvtLçD:{“SıVæ¶1£|àpèo"]◊ï`hNΩÒÍï:¯8·∫±(ÖCëxD®(#ôF¥·QE‹˙iûb‚£o“ mc8‘4J 3èq£çÖÑùú{∞8¨ge…éâ~â\É¸˚XÕ÷Œ*5d1ŸÄ*Øëbp1∞V‚osÊ´˜v)(ÔıPÜ`Fñ4ƒvC!•{Õœ#ì¨ÊafaÌêJ8)yFØ5e9˘D£UEKc©˙.”RõT"˜D€Ôñ†ÎZ∏—Âêbñ¯∆J–é·Ñ±∫3Æ±¥€MŸ®NˆçÖ‰í√®ª1UèjÅf. ô.¶X%È57úJ˚Ò99:„·xàöF`éE5Ù ·é#iÛüO¥eÍ÷çXï_î4VàJÈ™∆©oâíETn»*:ﬁç¸¡p$Ü.=6»\\∞Û¡` Ê i.Æ€8ët˘úfR/®ã6-ƒVn"&õŸüÛfZÂâ†ãm“-"Ï¶ßÿæ+µÔ›b;©≥S/<Û(ê,<0¶ø[~ÍÂ1Ô8	P]õ%´ıN„D&—¿”∑Â@Ê√Ì˘ŸÈ†ÏPtuÕxY¶A	7ˇ‰πÉÔÅ¢xÍ9ò
7R5§4≠P!5∂@µ|ZÔí∆mrc<äõèπ ú´e†ø0ƒoÑõL£Àé«£‘’íädWéﬂ∑∑[{∑∑µÅÜkÜ.Î9Wfï;jÁä≥≤ßπ”ﬁÀ»4™ÎÍ!/"∂ÇQTñaËc®·Ûj–ç€∂Râô¶Rwl‰ëÛ∞©6Î|ƒ\≤nL]’xUù~â¡Ùm|sp¬mz≥ÿ)ÁsìˆÙ‘“⁄ ¶‘ŸΩ‡∏!h«ü]]±xËua∆´™˛v⁄lßp†5Ì˝"Ωß◊›–KS4åy6ó¬køyŸ|4∑.Q{PäúÑ˛√?M`XÄÙiìGô`_çS4Ûï?ëj ÔßﬁPm‘“ÆÏ∫£ïÇr˝Eµ5∫tRåå&ÜÓﬁ˝Å#)¬T››∞hÕQp⁄Õ≠ÔQﬂ3Y†µÖ˛¢——∞–è“&~OEØíi}sÎàÑ‰w…4‚dÛ‡ÀL∂õÚäÎâkFkma®Ae¿≤n'§&ƒŒõ'ct∞˜.öÁMÄ£22!∏…›≥«^¯?ÍV\@ü{œÊT5ÂúÒûx…gfn£U∂â¡˜¯=ÙπY3n'¡1ÙŸtØ?‡Õ°Èz@'£Î_º|ßîêÀC(ËîÖëÃ}˙◊/œºå∑ÖO·@„[¯£djoôÉMG˛0}vuXêwœΩd¬=«# k/Ì“Ù¨Z¬,é)8n)©†LË¨Q•œmÜŒFˇcXtFF‹1¨ßDz$Åëboµ™ 
Y˝ée†3{ e ‰º≠óÿÄ√∏¡ÄﬂâzFe∏mı„Üuî1`¨ˆﬁìÄÅ“Ò¡P,∞™µó‹⁄≥U?◊ÄÂÇ1…M$»˙W∞¿>Æù`0MÈò@®ÑK.¨“—§Äó√gsª∑7∂ ‹Êî3Ì!¬√ê–ƒoyÎ‰4 Ñı\QbÑp?¿ÙÃ≥3≤§Kæ¨I„J…‡#4 J8·0äLåKv‚we(ﬁ|gˆF`zvEˇËsY∏
∞$ „2≤t∞äˇ"}NõÀDzó$¡KzjKPÑUßÏ«7°…ˇa«ßMX€ﬁ¬J€Ë;≤ËÍ·b{xq§í1Ü1Ôz»áIÍ}Ñ É¥ÈÑxp‹\⁄[‹ÇkÿUq ∂„Kõ¬«<txUŒ≤8ÇÕ⁄˝Ï*Û_ùË†[l≠∞>∆ÅYP–|€Ä	…á’ÏÒy:≈«dSÔ˜0)û[Q Õƒàìtn}m≥Ôü%qD˛m)ê¢gWãO&Îk|l∂Qõwî
–ÒŸEZ8:ãÕ3vßwÀ¯ÌÎhYé<˛Ã}/«[ÑN•ı(Ïf|ÑõûïÓ»´nT7ª’&Ufä≠◊œÄN—ƒππ“n#êDS˘≥N{é≠RπK’ùïáPRÎ™1π/!,˚ƒÅ˝»É^ráı·âUDû˚›é·≤67_Î"PÁ‡zøPaóSÔÊNáù¡¨–/ï–{¶G¢ÔGm±e‘áÀ4 ;U–[ﬂÃíßQÀ2ˇŸ\ı„ùs€≥Ïv
f˜vñ	<Õ}>™V?‰E'Ù)\3ä#n˝™hß<qÍÈpÇîÛ0ö[/ƒ∏úE~≥h´pbÁª=∫†ìK˘$ß™S©ÔwDSÛÃ4˛÷^ƒ‹≈
Dv§'öîA~çG‚GˆÚ§ ±s@ma÷Ñk†ªºB9÷-TÌ¶$:G}X´äÌ ƒ˙¥ÎˆËÿ˛^‚}çâÅ·â'»Ùj û√¿øs¬˜*∂QÌ2F≠∏-˘∏d˚ﬁ˜Ú∞›‹ç3,˝"òΩòa6pù±IgÚÕÛT=◊¯c<÷∞\CÕO"Ò†≠·Å~Æ[èÈ÷Ø‰|›t”π"ü\v:öÖî'WR˚Z ˙‘´%H∏Yõ+w”Å«‚Ú«‰˘©∆¥ÿsﬁÙ“:Ë≠“˜$>∑ìŸct+cΩªV≈å%&Á–[=ob`\À"€ò8†'≠|í0«¥õÕ∂±AUZæ¬
€U'„+¨“ˆuë¨Ngb£L¸qq{:…úKb(J¢iÖ√#1œ—Ê¯pûxC«ÓCπ%zÑËß´s3ukï“s/cÓ‡P•ÁÙÀD]*—i≥·qxŸl+»ÄòúKÄÌ˚ùa]eWf∞ÅÃK◊|°∏ÍíwÆ˘û\t{ËãjºôÙÔπn·≈{+Õvmf¢Kê@•µ&'7Fﬂ‰¡ÅÊÄOé·π-G^È˝6§çl
`‘J<n1Mçdap˝&[p€ù•¬¸MF‰Ò£Æü†PÎ}ŸòÄL}~Zsv¨&gÎjmI∑f;∂¥0¨À»£¨~ê—lhx‚ü¢iY´’™M¨ÿc≈+•)<Ù‘…"∞ÿx&	œN∏PZÏJÂ0l\EE¶zŒdG+ú_»ÑF+ˆ≥é◊ O˙ﬂí1O
õ»‘"Î=∏_„˘D!an˝¿	M8GX≥Z¬z¿¿|4?r‡ﬂôé}íÄ¶˛àcì£dmRX†gW®ê/‰S?jTxø5"[çıd˙9‰Ë~/D]∆≥d<yÚØÎÊ†%Y…Ä≤–Å„Iz)ÔÇFÙ.èŒQá∫•≈…Õ}ºSSæÏ Ú’kﬁpÿTïpMÓŸﬂ$/˛⁄|ƒ/i›µ&◊%#gìd«>R{Eb*väm;ƒ„""…P3û∆IsS‹7S1¬?Æ”t-&5¢¿¿πE∏Î-vx¨	V_\Ë†⁄¨±∂¿KUl§<%π≤ëõ4±¸dn}˘âl¢√øM∂Áıÿi≥∂ˆfı8õ’µ6kãù6Ç¶-[YπY+è`bG∂ÚòœlÅ-¢^Õãfﬂv$:†(Œ®ë√C¶º†TDé
áˇ®Ñà3	bw;oì¨2ÌwÚu–B«.â45|6«LÏhŒ?¿ø®KKxàÌ≤2Ç(+±Å\˚?3f¸®ƒôÇA¡àÍãÛ‚{’c,A#uÍ›@ñb±åP·«†õ”»Ï-)'6_⁄æìF0‘ãÒ‚#ˆ1â•b6S∂¯C`¸>Ù·'œÊ0◊_Í.ÌM0?¢Õ°¿q$∏I˙eÃÑ[î¡l“w˘∆§H ÷^êÆÕ“H¶,fÎΩT6Ã?s¿h-„}Ÿ“Y.√ä A,∑Î>¨ÀëçS3¶X53˝^ïã$PªìÈB3ôüqπE°Ûí¨Å÷~s±Ω2ÁÍi5ìçh˝·à•)F±ÙaÈ¬Ç?”D)ˆ%]s"oA¸ª∞.ÈDìDh¥∑ÔIXw
Xg’´¬òÑ¿V‘,c∞	é^XŸVy£ÒHﬂ´(ÌÕ4Çp*k¬_√ R…[L*Üé¶b≈i˜∏ÿ.“Ûr+H£Õ$°Ü∫⁄F¢x˛™”Œ-ıTR¿„>r…•ÿÎ)ÜÀ@6à´·¥1Vhc$úÒ°_†ËYˇô4Säir;Ü‚9±f#Œ ‘˚÷I„‹˙+î´`êRLUâÜclÆ≠	Â|g‹’Ã.u∏ôTjQQk&œ~GﬂGõ/)jAì?¨¿f'˚„ƒ¡=Ä37¥ã<vöx=Í†ïò¥íÁùfÇhÏ%◊ﬂ∞3=˜R,√¶Q˙b˚úÉL+‡Z¬Ø˜“ÌN¬hä◊Û“˛qå\â7∫˛%YSrõ∂,/vçÊ˛qÀ2Ì=ua•8U‹¿z1öÍ%~◊?ˆ	IÒ ÿo8≤¬‰ÜoÛîé˛ƒ;ãmñÇvU4L9Ò,Z·πıoˇ¸Ôr€BüΩŒL	_ev¢ﬂ˛˘ñ`P≠•«Qq≤î≤“∑úÚ∏…‹ÙKÖÆ:6Ò¨ºå¡«#oô‰™§®úÔ=ÀÃ0–y^¿≈qÏ¶vVˆY h¿˚dî	Õçun•∫RYª˙Õ≈éÖ9:ÖGCã£ÃƒÇΩÜ!çŒæ,ÎLá‡´z˛â7GV.f5‚.öVî\ô⁄ﬂ 0¢]ÿ!ê¯âÉÜ$UB\Â`p9öÓAÇX*"
2a„ÿ6QY∑ƒ)ÆÊmTÍh óÛ pb†üﬂûÁ˙Ÿ’Ò$¶Ø!woı™Iéë-RQ¯Œ'÷?ä÷ﬂÏûÀY<≤*u”!Púé§8HªπªSÀFQsπ„—Ôc(Ê|‹0ºiƒ±‚P'È+rÅz=C¬oNäÏê√S≈πC”z¢ªÄ-∑qŒÍIÆW“K‚!êñqÇ˙∑2E3≤a	H®ˆ»Ú§7πp‹$º∆àΩ„4a≥Ù’f	Zx¬ø»Îeõòâ´X”á£|î
€(Û$Ÿ$˚}/3Ë¥åïeJG‡Ãa˘≠qäjÒ´√⁄V<†t¡>ö€÷0±,´˝pÏÒ˛ÓÇ˛ÒékG‰]Ô…d=d˝‡_>ªÍML5πÍﬁ3≥u—' ˝fjœ‹‹eY5w…8ÅÖßNïy·8s!yÀoπ
ˆçz≈”%lè¨9ﬂ7?Ω:ûº◊)N:D?˝1pâÄN|TÖ´Ÿ∆Û‰…ŸÏ≤ªÃáœÃ6zè5ã§,˜Ãä\ÎÓöû8‘Í¢WR=H˜ÅS />1«,·«!w≈Éò◊”¬¢+Î·ow),⁄’W%√°ãôœÉÛÒØXÒyBï7K±òÃ“WKÿ¡’qﬂKïPñCπDˆIëß—úıè4¨∑J‰Ê∑æÃ¯‘,ø÷æ2”∫ ©UﬁWIÊÜÒ≥’›aaM.¥≤	gvN√â“Yá\çi0ÁíålÒë9'Q8ˆÈ~ˇ®Õu«‚'˙ ·[‰ˇdœ;myjÖßÀ'_
	£¸≠X¨—£%$ëNë.1Øb∑ËfJ+¶¿M¬HY]ﬁ>YÃ-ô U·éòÏ~≤ì`Æ·Ç≠KQG@J1Œë?≤√ˆóÌ/WÜ_&ß«^}ÂÈ¸‚R{æ≥¸hæ›Zj—¯+;Éà'ºÀú≥G&‹=~N^ /Ê‘·i÷D+–√%án«∫]™îm$öN:PèÁl|K=7Ô¬®õ˘ïÕ@A{ıÉ€Ÿà±áÊ¶‚wÄÁF\.PÆÌ*STÿµã∆`]0-g"πò1êÀmNlöœ‰„E.ìdL<.QC¬=`îÒóO0H@¢¢ïŒ Z?W(\óππ≤s:•:;Œh„MR8Á‘Æ4&°ÚVÀÕ2Ì!ÍÌ–/L≥“!¡n&ku¢}‘°9Ç∞kRàÂúxJ´PwÛ/ÒŒ-˚È_7ÎÇ·“∏-ˆ,Ωe‰KaÆpæi+–n∏∏˙R»ssœ™RTeEv^Îÿç…NÄ:Î∏ù-\öÈ—h3Ñ3W vƒf‹-:∫Ô7Ñû˝öeJS-‚˝J≤à¢u∏≈œMG˝LDéÊv3¡ªÓ^u‚–¸‹o”=.¨B@Xq∞á¯8˚>aç4^®˙†%∆kÕ…–<}4ø¯heæ≥“Üfò€Ê8≈lÉ‹›{q›ú≈/ Ä£ X∏RØ/6âú´•GôÎ#2É^è˛M1¿|ibl÷&?"óYoÃc„–—o›ÑÓ≈BôòÈ8Äkóf©®æö%ûàã´`ö‚c¸@±h§k4ˇ!=£Áuœiª£4≠j…N±§Ã*“µ·ÏÔLˆÔÇ¨M+˜» VntÉv°åK3Ü±raücT7áızã`∏Ií±k‘√™˜MãÁ^¡ÅoE∞˚|ö¶AUΩI,ˆ"∆]V⁄,KÌf9¢“ T[ÇN	˜A0ú›ü,Ú˜*Ÿ„+ˆπ!|©a=Yòl*aRd=ÃN∆∫˙≤e˜^„PpaÕÏˆKS≈Ö\ æ‰&ıCÖïú◊Û°Íï@Œ{	˛s∫uuiT+ïbï«Iëè({√<ªJ]wO%R™Ã«.ÎØ¸√YNÍ´Ã™œ&¿22Ek í)¢KO¸® XªæUˇTøƒ0‘≈^"m∫P	‘zÃïKòI≠+q:.›´˛…aJ9rÂ©pSö¶ØU˘¢N[2FKÀÛãOœ?]V=äëôBô+5◊Yz:ˇË	˛«õs9‚‰ü;åYïhB(.*ZvãCÚE…èππ\ÌlQJóïñ‹6ÒSvH ‰ZkMmå˙0CmÃ=ˇ§¨@˘ry’,WΩ)ïñÂì´Qx54Ê	NcJï˘öÇf∆i◊¶ª‘Ññóp˙'›v3çŒ{Æ%vˇ\5=∑õßç´$à®|ı»kÿXÀŒMYK∏Æ¡ÌÄnQ©àÜA¸x<‘Õ—oµÑ9òtZÛ¢ÂÚŒáÛìãó7E&hphçºU¬ fé‘DŸK1≠Db"JÙógã!b^ú≤âQH¡	‹^ñßÙheì›ƒîL¸‹.}S79,B®Û≈Œàês•3}ÆÚÏäbﬁ<«¢ºbhÅ‚’˝ÄÜtöΩ‡4·U0à∆òØ/{‰‹ŸŸ,‹òÀ_OYjÎ]ª…7ÈA≤‹∂¢	-?h…GIù‰˜vz®‚‰ÈQX@AX˜˝Q˝ÕÒW∞◊∏ØIöó¨©D&«FÎ$ÙFıÜå˚"é1¡IŸhûÚÌhö
Àÿ—|<≠ÿEøﬁûgÀ|k◊y¯ﬁù^µ˘e3¥ÂÉÚyÑ|?ÀF*€¶˘xl<ü>ÅJuˆY≥ÿX;>Dß‰8⁄·¬GÜ=f}¯ø ìﬁ˜6ß¸Â
WaáàTq˜7p7∑áñÍ∞r)˚∏®WÉ<¯˝‹·4ÒÅÆäü©$Ñ‡h@¸É{	™}™’°9£¯]“Âè™K≈0Íh6πÍµävÛ}˙ßD]m|d∆ßX±| ’jOß…¯ôJˇƒg˙ˆ2üY
‘Kiıî°C∫h„õï¡´F∆n∂h	|Ußo«aSöËë≥:ÚZ≠˚¶†QRåÛ¨ò–Vëãh»@ÊßÚîSΩÂ'⁄Å?∏‡!åÉﬂËß»≠§Én%ypöÃ≠ìDÄÆ„é,AÄO˝ƒ«0ß<VÆ˚¡å"]é	÷EWQ£‘‘Ûj·!€„©nz>€Äk\a≤Ë∑y†Ùx∏ê5Îà<tÈ≥
°Ækπ:ò·Ü∏ØÜKò}(Ö>4ÛG>Ä?:äUOd‚•Y≠Ü»æ∆ßêƒ3®AœÉU[e√é‚Ÿ¥+ò-˚qÉÊ÷MÏÚRΩ¨⁄è€ƒ´Ÿ”"P3ºÊ)†"O…uß1pãõ∑∏≈'S1Æ˝Å-Ïˆ@õ/Ìa≥ú&ÀS´⁄+√•MéQ∏Ù±c#¢ØÂWXÊêk1¥ƒL‘é!XW8&ü üX)b&e1“ ‰úe÷k=Àˆfd^õ5\ÊSgÀ˜LÓ’kçmóGcù!îÊLã•áñ´•<≠¥\Z‹`mΩ‘K˛›.›¥x∑Î2¡ﬁ}ÆÁ‘AÒDÄ#ñı¥=3Jÿ=Îw4tBQu$îÍ≠è~õÛ%£—≥π‘áõ/Ã•ê^¬àAì~∏îXîâ∆Â3â‚∑Å<≤‘Rª∞∆‚>Ëˆ…øÌ¢πd¸«xT•feE¨Èﬂ≈’ü‚¡”3b¨í‚bÓbr<’ÒªPÇê`õßr⁄∆”3¥"FÓÿsìÖﬂäœ£0ˆzd¢jz≤ΩﬁIaÌU=ò¨
0∑Õ–dò s2IT'∫c2!â¸4m..jäûc¡≤é¶ë∂Q‹;:”ª ,{¯{î ã{€r©{õµB4´@ü∑Ω≠ó≠«Ïµ–⁄¿1b9ŸR¸Œáı¬. «aT3i‚⁄⁄Cù>å˜Íìy¨/∞Õ¯X$™È˘´î˙∆–è<°S†õO⁄PÔC˙ç»zƒXu(SïGÃä@;zùßÏ¢ã¿ycÆŒ^VπQYL Ó2¥˘9]õ˙⁄ÂIJÛô≥
¡{}«ÃPß‚6,/E™oÚˇÿ–›¢F©Œœ›ŒEA´Âjw*≤IÑÄdÂ≥ÎøO›ëyà-´¥ê◊¬∆Ì“D+Ò°+XÑ-ﬂÎ!]∂/ÛhXæ∞¸xk‘3ÉZYÖmZ¶ÌÃ∏∂Í∞Ù÷q¥=sÄI5îîMªhâ8UpÀTeO›q∫™õ‚èÑsäÚ√ÂTaa=n∆i:4¿»<M6lFH-<≤%"∫SfèUÃêﬁQlOõπ6}vï4ùŸaÑ∆ŒgAoó±∫Ãs÷`ø˛˘ˇˆﬂlÙÇ∆Y}è?…Üü¬…ëÏÎ ÍíqMN›Ë—äã∂ΩÉØa
’ÇôB∂¥T◊,
s™GcÜ´Ÿ˚´◊ov∑'Ô·6ÜÌÆÀT•Q<1Ûãﬂÿ†0À='Á%~—õﬁ$:"7,F_·x±–7·1ÍV†?ÄÆ)ö«ﬂı0˘¶…°KÀıtù-Ï;ÈI[›áC-ˆŸ-âKf¨äj∑´YíN\{"ãbñßÀ§~Bô)ƒÑ\˝,Õ-b>ÄÖ-t‡ê|ùÚDSäòì`sf| ca˙0‹~úpAøØe·ç)‘PHô†ª¿¨¥ÿgÜ?@KhÓëEV "„ƒ,DŸû‹4rá∞°H—√ìP89y¡√àß˘@O0î“çviÉgë~ÙX<√ÄzgAäQëB.ƒ4ö”d<4ëDTÑ&7/·MÊ√/|Ë‘Øõ'}√jqTî´/·fP†•ıÒä[R•ìbâ‚1,KÈ,†|Í‡Åj√^+–b:g/úß‘Èß"’ı/I	‰%÷P JõUö¯Gâ&U	∏R‚Öëeypÿ,ˇ!^o•Œs¢Rb∆òïgè|PQUı
B±√π‡z8 ıä#Éí-€xW ICÓ±/?G™ç(ÑË˙®é®Dt3A8\HûDv©Ñ*∂–ŸÉY•P
ﬂ‰pÅV8)áK¥AÂmßDÅ∞⁄XÑ·~¡ﬂ‰§…“'t@
€‚ßˇãÛ–∂-úÆE—–Ãjø?ËbÿËiåI(†»◊ı;æõ—ù™˛´`”gø´›]Jª“ª¥ñ …“‘Ìíá(
+L§àK›•n±ÿo€î‰v~œ—hâQkâWÇAL∂/PPæ}—ıCÎçRïöÚ≤ wqÌ`£€”-W’.€Ò∂-;øVÁW˘©®Y≤´Ôñ5∂“m∞Y–úL¡›µ!ì∂Î“¯v‚U≈N>{fâ‚fƒõ±æ˝⁄/“gÛ•ƒ4 djÏÛ∞Í=%…?>i•-Y∑AEú°n—·Àu$^täÖYÅôtd›!lŸ⁄ÀÄ´Ï›UC.gøÓtkÎò	%"báY}QP\§e‘°ÇwlWÔÖõÌ7óü‰Êäóúë‡—∑ãS*å
ÕSNõÛ“†?¬ºì–ÌÇF≥EzËun⁄¸îWu§ 2ùÆ8Y¸"œUÖ“ñ?ÇıÅÀ|n™ëá†É√K#/3¨¶Îœù6@TÂU/ç∆hÔÃ!ﬁ◊ä°µ1òFµ¿⁄Å…EÚÂzC-nº√jUX©æ«5ëv™Éñè¬	´ã,ÙDyŒ0=¶:oÿŒaıVl˜y+¬÷kXk∂y€ÈS‚◊b1k¨n¶hÂ:∏°]…Ö}¢“„5‹W∆É¸Få˜ïxÃÄÌÖªmëy–ái gòÈÈ?"_Xë¨¶±›[Úr7–Éÿó<û›£¿‚U1§BÑu*€fàm )Ù£vu
mt<Ö@ªçÒßRÁôÆC√"g›aFÁï¢N•ljo˛q“ñûM∑;|ÓË¯©p U¡}«˘ë ß®ë–Ñ™¸@s˙(‹Ω/qO∏Õ5œQÆÂá”‚;ïòqÒ+ÅÆÑ ¿Û∞Ó9 •eß“mi80ÊvÄù‚âÈ8ù˘V’ñßy¥Á[!qèﬂJGÒp/ÅªÕ)ÖT±≈íT>πMó‘C‘KòïÂ…ôû\…`ÀÙ{ßjºS∏ó‚RT†Èjò•zuOR^Ë∏±ïMÚJA(§¯÷ŸRâ öPÌÛ®óyˆ·2~2‰˛Nú+«f«Àïû¯ª‚ÿHŒ¨ôiÒ∏OûÿØ˛◊Uëus¸6|pë°Àw”AÄÛÕQ‹LÖ9 Ìˆ„&°"P`(aÊú’£cªø<Uài´„Pvd6k™ïê‚ó°˝tgÇ¢}ñ-˛îUãZ’ÿ≤ã…ÉXXb2π8!EW)òÓ0œÌ&1EL3\ñ”SWûÚW0©©?NπL'Œ0gFÑÆÂ_ç{ÛXúúzi˜R·EêrZê¢ÑõTh0¯Ö‹ôái5NÇ."ëﬂ≤-¿GÊôÎ‚bŸd"Ú}p‹Oï âÔÖ"[	M¿”≈B £áΩLÂ•-!≈l€$+∞∂¡eJî≠3Í˙j’´±Wúûûã¸$¿U¢‘«êÏô„ÒJ1:¸◊®OiUqL≥‰wß“í—q± ⁄≠ß+ÛJÊ!€—®$µï*ã∂*˛E0ö±√Ñzúú¿%•‹ä®ì˘QâÃFp¶ÚÕ·ìˆYˇ®‡&kÃd˜ÕÛ≠∏Eä4Èë√©™B e~n¢e√!+?‚r,ﬁù1Á®ô∞DZ2TsJÊ|?·¥psN„íXQÍ xqÌ!±ÂçÁ≠nﬂK6Fı6∆xáÑu´À+µƒu∂‹ÒT£ﬂ)V8µ"6¢ó]Uú#∆ëË8«0-ÇÑ¡WîàŸ¬ªí”2HùqJB¨∏^î]y-Q™(‘#ÿƒSc¨œQÇAcﬁú˚5ñ¡P€5√Ü©<s·41•àí≥Væ◊Õ√:¿<Ì6V Th[ç≤û
Åû*S2è 'cãñ—∞iWCnÀã∏ÆE‹Ÿç{^¸zÌ,œkNG≈∏d“+åÏQ—á¶xMõ%b≠éI◊qÕcº$.÷@Œì«l¢πä∏c¬¬\LÕØVè<Øg)3Ûì∏7ì¥F…y~◊B9ñ¡Eÿæ“±H¸CÑ…Aá nywé\nπÑév~/5)HcmJÚˆTJM*Qûæ˙Ÿ0k‘oì	•4ãÒ-“≠ˇfÏ®ÍñD∑⁄z zã®% îõPyòı®§éƒqiì6‰⁄øÛÜä§∆‰:≤ëóD5W…-ºº’	è]e›€zñ< æ‹‘eLTπn‹Ÿzd]	ø5Œ†∏3ÔVO`ﬁ€.—w¢åw∑y¡-YByq¬^≈!éUPÅô»W¬Hæß<ùIﬂ…πnV>Ei•õl∆∏{l:7è⁄Ã}ëÁ’f?—¢ƒTlñtw[«é*qÓJcÏñ‹b2ºûñ°T/ÒƒëpVÿ¬rrk¬Ù˙øƒ‚CV∫Ê.NôSqVU"—⁄⁄OçS™ﬂ\U¿Û÷°8ãÈﬁ%Gø•yK≠aèï°_%vÈ  ímÿ°alx[û⁄)”æ∫£yÔ·§ª˝†áﬁπŸ)Å`OXOâ=V%ËËî®TÂØßhÆ¬Z‚«`/GDv8eÜS<∏•∑f¿9°£≤3`7’<e¡åƒΩØ|ø‹÷LAÃÁ∆÷QrW)ó⁄’‘ŸF2gõ}@g ÓîÅï53+õ—în'ÏÏZS÷s	⁄îÌïª⁄ÿÇ˜Àˆ0BA<S∂yY(˚Ú@¡VÁ¶|p∏ÔD'1{·E—¨g∫q¢[ÿ¯7ü≠ü›Å8gÛ+‰kÁüoˇˆ €£$éN◊Å)πze Ù7ÊÔxzw£Ç (e)y+Å‘xa*àR4ŸÚ"ﬂ„:üß–øág^¯„1r°‰’åjç€gÒX‰ »ßIâﬁfKµ^m=va¯Õ,B›f<∆Í„6Í˚x\
	Á3¬´ñ¨ÑÎÍ*ˆ\ª.Kµí.°|ÆÑ•ic7´áè
“ªŸu„≥±‹¯q—{ªp–Td)À≤èT¡îò“Sv‡Ïœ>ˇ#íücv‡ﬁÖ#?∞67bö»6*hÈÇ·wI¢ﬂπ…˙’yyö>˛πq∆Ø
ÄwzuÁ0˚(y}µ¶Â¯U?;ﬂØµ/g&ôÍµJ;tFbÚZ:8U´;W&Ï∑R”ZZﬁÇÏ–öõ◊^™JÇﬁ“ÒTåª\%õ	~Dﬁ©Â™≤÷¸ST•ßÂI|’œL∑G¸8í˚è}€‰æî}Sf7-ög!’ïTS/Æ¯!Ã}^%˚£Ä*≠À”¯V°ê´àzï’-„R≥YÄ;ZvuTY¬©í1iyO,~§eâO‹iÄ’è;%pŒƒ√“ÑØC…l’‘√ñ¿W‡Èü∫¶I§°ﬁîƒ¥ÍáßEùb/õ7Øu˜"œêZL…ô•¥=éÅ¶J≤dÎr≈ùR=Ojˆô.√·•¶ëﬂ©ÈU®ô≤£Á‹`en≈aºbè}ˇ§µrCñ±‘ÅæƒÖÜ\à4`óDZÛbö~)ÃNGm‰¥òht™tÎÆGZ†´EÚjÀHZ>ŒR‘ô~y‹Ú.Zn∆ä‡Í<ê‘&»ÌH f∫PVä*ÉZÅ‹ØFΩYÚáfôB;.Áp9J[‰ñµiÆ≤•R$ëèAøÀ/µxLFvá„s’‰ªJöˆ„djZò)Iaf–1wß%w<µëJåÓ,Ï´ÉyÂÇ8-áü&°‡B[Xâyıxözj®‚ØKÓŒp°yô"kï`VdZ%óVÿâ¬@ˇyx"âÀa9Ì U»+˚ˆÔ˛˝ÌBïı7Tˆ˘Æaj˙ÿ%Éœ0A9aæK<†ºv{ò◊é}˚üˇ√ÔtÅÍ'wÜ <:ﬁäd‹º2∑∂≤"ﬂ1º
C/aø˛˘œ˛Ê_ˇ˘'∑FÇ€ËKP0ª¶¢(^ù¿Tz"UfqJÛŸ83gÛO!≈}√t0®  ø"·ª…ıœÃsCHŒöI oﬂïªR”gJ&8.∆£lÖ~oïΩıª ¡5û≤∂htyx¥Œû±´âÎJVï"29úê7⁄Ô™n˝iÎ$N∂Ωnü◊/÷ÊôòU9≠êp~ü’⁄4∂Ã2Àáﬂøı/œØ|[=FYád~)‚Pˆ{‘`ÖG0ñ√£≤ñ
5Z√q
`+≥¨tãW@l√≈&1I†»ËÛu—c£ïc\Ø{ÛÏò∞Ó¯∞}‘
	b®OÛXx‘p˜ÜPP˚í(N⁄å2[‘*ô¨Kîd‹Ã≠ÑÍh·æßS†b $€ÄfŒáÖ$œ,∏-óXœâÊ≠˘±nf-≈cuxdBßDQ
πG†5^á>ñÚc«ùT◊Ö(2U§ä+§@„h?O˚5=ö¢GÀUJTkb3÷+”ª2k˛•“tà ∂[K˛‡àﬂ{À@1(kﬁ%seè™‹Ø^ÊÊ4”ÿ¬«<Ø™H»â˙ J…8s™‘C%ÃΩô3~*'ŸÃ◊7òDPôfC:Ìﬁ$:∏ÙÎ-µÂ‘ÜTnÎfÒœ≠‘¨XA ÌîCä5ît∑‚–™úÌVL£¢,›5·©å†À)˘n°a»|ÓxÚï2_N¡ˆiR¶[∞Ûéû1â¶É≠fÊ¸¨ÌH˝háÈ‘tÜÙ¢Æ≤≈rÖª⁄≤CQ∂tDEùHπì0è[Õ¡“ñÀ |RvÁ¶ |+å_˙Ë∂k±=‘≠‘kπK˚w~eı÷
æ˚˘ª2∑˛t|L1Æ‚HX≥ﬂ‘µˇQ€pÌG‹Æ‡“œæ∂Ââ≠Í◊ü;ŸœÎﬁ˜óò◊cä{Ó‘?Ø∏˙ª<ˆ•ìˇÏ]ÉLãî∑°ë7’û>…öñ^∑‘Õﬂ¢˘:é/œ—T1∆@´ÖH´C‹5‹À»t>RÈvπ€Q!+í†´ÁÕ≈G®”~Tê«BwMÁ=”
˚J@Ió'ÔfﬂG_ˇÃ	ÌQ?¯ÙF}L·`ã∆zL¡∆áÄìW O¶ls÷‚πﬂ—ÉòÒSû»Ã\¥Õ34<p˚ÍóyXYì∂÷‡ÀÖ#’®¯ê¡Ô0AsŸÎƒ ÿ*ZÛ&˛)∑Ü'ò÷ w1“> €∏50¶(h±ç˙ó(éÉWÛ¨G F\ì\p"Ëäl±æåtè¡V∞ç!OíÏev»"„vÜ[µÇ@DÌªÚÑŒñ∏ˇπ4T≥j¯€QÔSÕ}mNÀÌAÛÂ∂Ôù›}imñ—∞èRS5É€Ù"Xá<,Ú+4r†‰Z.wi◊≈ˆ&YÖßfü}Ã"ÔÃ?E|‡±y»€ùÏ…—∏‹cp!p√Ñ/ÄËÉÎoFÄu0#ˆïF1Ú1
‡Í•
á?—(‡í ›¬Î_¡º˝0≥Î{  ^LﬂAi«˝pz…<aÁà”>s¶%Û‡)U†€–OW›Ë[â7œH*MF%Zıs—¢ù5-~gˆqU'°|œÕúßãrœΩw	Z∞æÔèF√tua·‹k¸ÖOQ≈ﬂ"\ú<GLxˆÈH∞¢ÔﬁÓd¸ı¬H<⁄[cÚæÏÍUI»ê≤°∞Ô3√;œÿ‹—7[Q¥⁄(8_fÅ—ßﬁâ›nò¿°,îK∏D38‰‚5L–¥DƒÖú['`LKˆÌjΩ)Ü˘îΩ™p>…–ì9NTË™“›ô∑ƒ¯◊öÛ ÇÂi≈C?™œ≥⁄ód‘>]√…åõŒí3Ü£5p£ i∂¨¨™’ù'`∂tªô€IÖ`èÙôé"§=·öˆq_‡ÙRS–†Twr3ui˛K¢S=ä¯Ÿ—ıø¿ S∆üÏÙ5ò †¢'¡È]ß ı≥j%g‚éîD”ˆ<“˜¡…L÷w ≤E^àÁÖ&TséÛì∏!‹IòDå¨˜Øˇ	”¢a™2D‡S8´›ÛMµ7¸Ü„Q¯Îâ,p>ünåÅΩ∞»x#¿≈Ì+ÔªÊa(Å:	K ﬁﬂé—m‹Ñ€¡ö˚c“∞"œÛÎüˇÏßˇ˙œ?)$ßÕ‹T=÷düJwªw©ü`Ä¢ÁY∑J’í∏6Qã›âW^)˚îœeÓçˇXÂlè%˜<Âµsn
$ìÔ«ΩÀÔö√£Qˇû√˚9<≥Kì7Ü’ÀPŸΩ‘OnÀÌ…C+„Ù¡Ôó'Œ—oˇÓØ¶¿˝.∞{‚ò˝M„Çu¯m”6ß£e@√	L}~˝K@‰3≤§Õü˚(otß`¶ïI|◊h‹±fÜCøïò!Ò§F8Ã†{ûTSã«™Úæd#kÙ©:
 h¬ãèh‰ÜlNÜ—W3R§“]"aæH;+%ŒXF¡¥f£ªÕ™®ú‘‘aVäªg?#• “:ÀäÒ#Ô,8ıFq“ÍÜ¡8Ü†uû¿x`ç›Ããã˘MFı9J‹â¡/Q:7Ve◊ﬂ$>â)âDgÇ¯s.çø}m
XkAÉj.
m¡·‚ì)@v--™êÏ≤U”^ÀPÿ+rú"∏yb”ô4Ω≥!AÍèˆçï
Ì¡.ãzm?ÌgÄÁç@∑˚#Ía¸+ª' wÆ ß¨_aÏaNF∂?Çï∏d/»wV:‰Ω0J¬vc∏;˘[~˙aŸªT,kézWÇTª¬"¸ÑK“˛Câ6§ÿ¶Z≤î⁄’Ó¬•˜C≤ﬁ\\Ë0sé7/Ë¡◊ÕÂ6pÏáO;pîäWS«?5”…∑·ô%2I$ SÃ¢®™´E¸[∂)™S∏ó‚ó&œ¿!Áö)≠ó
˛É’Cúﬂƒ∑P	e™{›:˝Oã(löÆïÂtÀ˚ì¿é√î‘…lo˚ı÷ˆÎÉm∂µÕ∂_±ÛÜ}˚∑_‰f-ú€¥ô[Uµ¸¢§«ríd•√˘ÉãtUÿ1§ñâHu‘Iâ®«t¥Ì*¥xy‚Ñô™œ‘ØNOl·∫uâ|˘ÆT=ÃSKMÂÀK√ÙÕBÜÌê÷b¢qgÜ«Â»\ u¸VŸS1‚Íb«ô`÷b–`ø´‹.∏ÂÊ¥“Ré≥ó{™∆Ìƒv¥ıDÛT6gÚ…'ƒ#S›W¡húú^Ó¿TàIz´å˚∏ ?Ñ˛n⁄o‰î’¿¸¿!8Rq∑óT}î∆—ÈNÔπ˙h£ÑTy§çjóﬁR¢{/≠÷'ÿØ≤+˙≤™N„3'¡)ÇwêÓbïEc Ì2A◊ËÂdÒ√èËd˝§ıê∑°5vx‘XUGsxD„Q|ÉRÛΩÙA!Ø—&
≈W√mC⁄xS‰˚˙#Ááö‘⁄g∆êcBq¯áóÌJ†:BdìÄ˘™XUD%Çwº9h¥ƒB¥ ≤`”`†ssü)5PºzóZ%ÒÀÓﬁüÒúp]°â´3¿ÇÍo—'{ÄÅè‘Ês/≠˙3Â˙ 1A´ó«hqx$ûdŒY¿‹›Gm\∞˝¬ôB%µ≈kp4õ71ã`,úóÑüê±ûV|€]Ü~ZÁSAz"ª° …®ü1•_õ…¶œeÚ±n8Åsº"Äv.ÜÎW\Ãa]„E¨>o(1™]Wk5\Ø©nC.óò≥\§„SCEœÓnÀ˘æòÂÃV,-IæŒöæ]<õáèËR ™i√e/xZ…Ï™RÿûÙ[÷Í≈£¬å≤ó$>Å◊o^nø=∏˛È€ù7¸ #Ãõ÷dú¡ôœ\¿AÌ%∂(îôÈúÖÕ·¨∆µwBY„}UÁ/J úí∑¡óø’°ÀüYa[lLBvo„’∆o7ÿ∆ª?Ÿyµ≥Ò∂|ÅG@][xeëﬂC°ªÛzgsg„U%‡Î[Z^‡˜ÄE¿æ‹yÌ´
∫ƒ?ÂJe+ŸêµæK˝d‡™'çÎÏ/Öú\t˚;Ω\ª€Ø˜7>ﬂﬁeL¨‹Ù5ãìíÉ€¬ N¨Øà—E±§≥.Í,ƒÎﬂü≤Í)˚v„˙/Øˇ‚¨“ŒÎÉÌ∑õ€˚˚s˙RygAÍÇı`ı]+AÏé}€ıÆıu0òæB√q2}cÅîá%Î£î2ñGyS≤:y)Î‚à◊˙⁄àá÷•±¥'Wf„ãù˝7˚∞.õovﬂΩ˛A•E	„Òôsãà√ŸF∂Æˇ%∫ˆEÈzx±ΩASõäîÓ8õÎï=*Y≠¨å±VŸÛíïíe¨ÎD/ıU¢G÷5*¥$WË’õw_ºy+¥±%∑—Ù%Å≈˘œ÷„Îå‹DP0∂›„ßCøÙº©´ëƒ©πŸ£í’» ´ë=/YY∆∫ÙR_zd]çBKr5∂_onø}ª«ŒA˘ç!Öˆ@‹∞ık‹‹T4∂™›¯´…≈@!	jÛ$FÖzL–E3_ áŸFÒ~Cq1˚üìïSÌ^zëÅ#Ÿ£GÃ˘f%…ûó`à,#öVÁOØt¸†G9~d‡0Z@»Ø¸z¢‘O™HAëTaŒ„˙ïêåÕì$ÔÇ˛·â&ÒkΩ˙—~ù‚/ ‹Ω›P;Ñøπ(y7>ÛÛ_o˝¸ﬁ-üyt}—È+íc·Û^‚ù –é€…ôŸ34F¢ñ∫^ÿ£ßw¸O&´Lér£Ë|∆á*≈tüÂC^h«°ÔEüicæ Í\†òãMû≠≥≥8Ë}fLJf˝êô·sŸçV%ü9V»«2O∂úÈUVkÏœX≠üG5KıT¢◊||BgÌ€Sÿ>◊ £ÉW®™“§√ EÔˆ≈–CI¸<Íbw¥G(∏ß>™e˝˙â¶\À.ÑÄ (xπ-Ââà@ŒãR&˙g Ç<¡©eòh‰≠Oõ©E≤gƒz)ß¬,ﬁ⁄Ó%1 Ya3Y`Ë]∆cÿEÀ2ÔYî	´Æ¨ ˆfgôMx!!¸◊
-R°∂,T2§È≠fU:—∂⁄ùI∞íxDµ[+9=Ωÿ'•lÓ6Î¥á¨≥ö¯'9=ˆÍ0Ò_´≥“ÄjN¯{©FF!yà(§	Z¡Dp}®√àVd	1¸‹Ù,?„œ•Cƒå¨AT^û`3´l©”ŒHµ7“÷È<íèñi∑≤ËÆ2&æ_öGG,±Îç˙-X}‹MÏ!ºj/ã9Àa2Ñ˘ï92uLù'Ìye4ùJç´êJ2ÿéö	
ûÆ$˘∆æyå≠î\ ¶ÊTF®î?Â9ı!‚< ÀÑ˘∞gxÎı’&T™$ÙΩãº≤:ÓLÕ¥ ÚÄŸ™∆âCáÂÇ™ÉOπ∫4µ
*i…·y•$«äVù?Ã≤”íÄ€L–ºË
f.™-ëœ’ˆãq3k_ô)^X~QgâQÕÅï©≤ƒ¸=gﬂß∂ƒQ+x±i§L(X$°jùy¿ÇU…g∆;l‡Uêé|¥K{∆à–⁄ (‘V˝…˘†OÌ5"∫W≠V+kdíi+´.s‹±F™∏*É#¿Çˆ∑“áÛ£œÆÍæ√:Ãoˇ≠Ò˝oéÍÛ,u-⁄ı¢eX¡~+é‚q∑øèÂKêé‚!Ç“;%WA°i’Ê”O`ü¬*u˚¬E\H¯√7‹õ¶ŸÇí?VdÑ.I{`nJ{⁄tÕÍ…∫ıWÏ;_Ïó”ƒ;ñvœ £c‘À+õ∑áqí≤¬‹öu]_n¿%◊ê[M$>˜éI ç÷>OÇ·~ÇN»ôü—£B<˛2˚©≤TÏÂ©aù
J÷b”ñ€√	¥≥¢ô¬è‚7O¨'<ûÿÃ‰¶gWò;o.Q6–æ¸àvéfo/ôøMEP”†á€e=iõñàzÚrn6í€ÊS•«hTn.üªvX<‰)úê|^§ŸfÇÇ7ân§Vd3◊û>ãëqñƒ—ª°´XITŸªG~Ì¯=»èDÇ∫Ì≈öl±ÒÒ±œ∞‡G99ö!uvn€KsF` öG|·üuRXU~æLE’’Z*z^Ê7‰ Õ£ÜÃøñ⁄•˛\îµÌ˚l—4Ç*J]È∑a[ûGÃΩ'∫Éï:-ûåúz~”îc83h≥M¥ì≈„R~Á,yáñ”![Py:ÓD◊øÍ1Ûa 'åÙ©õxlãÀß„ùM„ó'õãFÄ&¿˙ûƒÁ÷ªâ¬a>¬(“Õs‹ïÖ,◊Wƒ∏ª≤¬|k$V¡µ ®h´·¨L˘Xf‚hò5fõô5¡¥-Kß4¸y©•eÅ'NF+ªÓÏà†∏>Y∑Ö™‚ÇÎ∆•ÊnQ?ˇVà^%÷I¨xgVŸs,˚˙l.21ÚJ±-õa>’…I!V¨ÕŸ…åÀì†éÈ”’ëÕºI¨•Ñû¢Ò‡ ‰–ã03F.U+y8;d…ty*Ùye‹v^ô.ºk/‚¯ﬁyG|˜2“≥∞nB«Ï$ªRØÌé”†€)iüØ—,m}ø€Á≠ˇpè¸í∆-Ê=Ô“Oxj@4;xºp÷ˆΩ(¢òiàg)ÔÊã8¸28…t3Ùüú¯I∂÷üËÁl_çé2K£æ:éú°gàªÅn
∏ä ˜]ÊΩ„…Á»K«KH—£=›‘sæô?¸7€0çv˚®ö#’◊ıÏâ™‰πeg9Û]>åD
Œ≥ πR"||]ûíëπß…†$+x∆ÊCqvﬁVÍnû"òÃM∫¡⁄ç‰›˘W¶Â\)‹®l◊Ö*Ú˛)(FÍt›âµû’MPÅ@ÖA‰7›≤∑Ÿ}ì{í	qÚ6ñú®ï≈∆µŒt”Uƒ∏∂µ'ˆ˜J_ ÃŸàŸ8¬æÄCLYøêø–ÌÑë-GΩu„ºBÚ7ï4m—qÄπ¬_Ú$öÖA÷≤AíweY˚"˚Uír≥ÿTQ—)#tdª¢ñU±≈KveÃ1„ÓÊqkIö=©2%gQ%@ÆıΩ3JnﬂGŒ»„ñ!reÕzÉ◊‹’mÅr+Ùöo ¨¨ÍÀ:ÓJ BaqÌ±#™≈Ê:ºàñxÖ‹∂aI±m‡’GmÎ_^órÜQd%2ºˆë⁄ôÅñÑõ]áá6ïS¸7π`.e¥&ôE6ÌéC≈ÿúvfM\8J"çªús˘«pº$>5/PhLmfñ9ﬂ™Mº
b®Wó#gõ_0r°iÒöúÓÀßãmçhã«Nˆ£D|^ò∞K*ZQ(ÍR¢ZÖ¢ZdÑEÆÌÏ0„à”“¢)rÄÇ√‚›/D38SOaç9çsR\8I\Ùvmìs˘ŸÏxÈeoö£pM(¶ïC`ïFÒ∂ä_I
pí7ïY u—«AP$^⁄ÔîKÉä)_µWï-ıΩ§ó˚CfUª„p|Å°øÇtƒ3≈	ôUëRó[QmàOÈ˚ô(ô‚èÖËO•ÖUP]e≈UVè¸Û/‘◊öIP÷Ë*œ2ˆYﬁvˆD7ÓÈéa∑v¢·xDñ=õ˘oÕ¨áÃ≤j©H0àÍh^jêFÀäFÆ|4ëÃSQ&ÿ?Èe+Ü¡®^õØÒÃ7)E{Æiô‹Ï7Z‚ﬁrÛÏê™©#‚®{üûÜ>Ox@pÙM˜ìÀFàﬁí„!f4…Ã≠‰qÍs„”º≈Fn§!ZÅµJb‹Írù[_¢„¢“Üp!‰ ≈Ê[≠ñ⁄‰ºR˜H∫ä≠LRu[_óPe5ûèdR ’FØ«◊·TpˆD¯h
Ç(ÉD≤Ft∞ÉKîP`≈€/õ¢®#≥±˝ˇ   ˇˇÏ}{o$…qÁˇ˚)j˙bSÀn>f8ª;‚=$wñ6áìúµ¨—bß»Æ!KÍÓÍ≠Ííj0p8l¿`wê @8üŸ,p¿AÄ†˘MÙ¨èp˘™|WVwsfµrbwÿı gdddD‰/*€ÜI•‹¶pÆπµ∂ùŒŒ]X"–6Üê`îæ¯|‘¶EÌ°•g„Û”ÁÙ’ΩQ∆l˝ƒky$m`Ê…à˙pòt‰È%~∑V7Ò´˝DiE≠(‰Ω∞PíàÍ‚ÅàÙmi0l∑è Í˚x≈ÇjUÌr¢AgHE0ñ&á:w Ó=7óx>U-gœAûekœ√∞≠‡û:»õI±-G∏|§E‘ú(tBè}KiÚñÌ}+ÇäEU‚Víh<ÇætÏ=Gè+z,IÀÄ∑¬≠RΩçÑí¡ﬂ
§í‘≈ö≈pe›L∆~5•!Q[1nû∆›ã§à≤7ÂLk®Ñ`„∂¨*x4y†ëú¯{£($&…⁄ä∂[y¥‚—ä–˘Ø»¥◊®nÍ◊†‚Z∏¢Ñ≠ä·)ı@8Ÿéué⁄éà·‰ë32yâq÷Õ⁄÷dQ1ÜŒ›˝zîAÌgcÑ4…zó4 l2∑ï°Rı:ÄÜ“L˙äkhâ˙™m03M⁄£QÍ∫◊´J˝öMìELﬁ*ﬁ ·,UF‹G+≤ÂâôÓ ã¿5´Î'¸ı?˛k4!Ä°ˆî)a{u§0•,2"˛≠A©2‰{•Èﬁ≤Ïp5Tí¶[òÕ˜Ri’ˇΩ¶ªô<˙êˆ kΩ™ñ=ƒºï†Õñ©ë[\·?5Üﬁ•!ìG—Œe:j A&;M‚~ÙÖÖM{r≤y◊™Ωj¬:˚l©µÇ“ıíÿO5∆Aπ4Í¶q9gÉBŸ	E±Næß√‰âá=ÑÒa›ú\v· }´¶üAú'•<Áêˇ	Ø°»wÇªç4@*ÏÆmäºpÀÖk^≤ä˙ç.üØ»ÅâÂdÖå◊i{›OÀÕc=∫}´ó4T}‹v§!QQ˜±O◊Wé,πáól‹•„ìœ∆≠≠®Àµœ¨Räö™3;[l≈YŒ°$ª≠Y£WoôBˇEo\(7mD1a8”&;¥K⁄∏ı∏©óã∑2ª0D¢a˙äË£àÌO…ñŒ#åiëyâ ‘´Û>,ö±]Q±pÉí†‘$.˛r‰4u)7ﬁngRçÄìÎ»4«êàf≠ı)HT#"ØÀÔõ∂ÁOPsO•∂“ÍÛJ&¥.ıé'∫§ÕF˘Da∑Ÿê®∂ﬁ≤ó‹÷GQá3s.vØÆ≈∞Q›X¶Íy—ìdÔ≤Ÿ`{ùå\FB8ËêyÁÓ€ÇNÛñÃîUñì≥_ÁeË”ìˇònØˇ´πÇó‘¸…›ˇí%„≈◊x4Õ:´lÑ"É:ÖxèyªÒh< ≥&…(π¿àYâ—çlBquÈ«eﬂY?iæ%ZDË?≤ç¿édë®ˇ≥◊âBÍ§·£:ÿ”¥à$#•jC‡…%,ºIéëX“	üp ≥º≈†Ã8u	aÉ!©Ó‘Æ(Y≥öhÍ3UC¥®¸ó…ç˜jΩí6uB∞€|aq £:ö∂“rñF]Üúöâ†ïõ¨—¿e◊ΩQQ%ïÌÄ`SÉ◊ıV´UNè¶~’Ÿä˘PŸeöª´Í}ß∫qE¡NZ™ºâ‹
E–xdû•—7,X+z¸í=xcK,*—ﬂ¿≠TÑ
≈B£ VR—˛`ˇÙÂÒ≥ø˘Í‰ËŸW)‡’™Z„≈Ò˛ÛΩ˝„NÙ¸Óó'˚;"r6NˆûΩ<‹’n‹„’øzŸ9>5ÓÌÍ˜Nˆ~h‹∫˚ª”˝Á⁄Õ£˝”Œ⁄Ω√£CÌŒÓ›ﬂÌ»ü~ÂÙ÷>€;‹;ÓfX[˚)Ödw@U‘{GˆÑ\Ω(q¶ñ‰l:lé‹Ì \N¡æ/Â2Ç©öΩei∞ùŒÈﬁ≥£„˝=—ÑŒ”ΩcxÅu≈ŒÒ>E%Yñ Jÿ0ÏÌvñwé?€ßp?‰ÓÒﬁÓﬁ!˚ÄÇÌÓEœ√Œ	ÀÒË‰ÂsñÈÒﬁ…ã£ìS—Ôˇ£˝ÁG'À∑è¿ã]V¿Öhèºÿ;8Zﬁ›€Ÿ/Ô˝≈›/üÓ√›ùΩÉΩßJçÅæ∞¬	áÊ†µJA °˝∏w=’9ÿˇ_ò›‰„Í ùœ;œ°ÄËÓo#£úæ8 “b]tÌ}—9|∂w˘ë⁄ÊËEÁ‰.|ƒP~ óùó¢⁄«{œ‰üﬁ˝=Ü}Fãyyz|Dï\≥|È(h Gc+êŸ©û%¸-¡V‡%¬~¢–s4Ë›¥g"O`ox»"·b∆‘+e«Ä >Ñì0ä+ëbf
FÓíéêªƒéº+˛¡X¢?Œ„˘≈jK~_‡Aa∏ø%◊Dä¬(VñÓã'å&∞§oc*¨—ÕarÖÕ+H.Ù÷…˘e“˜*7»Ov„õß	¢≤'}ƒ™»•gê 
{Ò"œ˙iël`m©ÜË	ëÛ%‡›R≥rg<∫lJhØ“Ç„éPwKv•ÿ™˘¡ÆÌ∂Ñ°˚ÍÀE?W 4°ôÏSpã=~%g∫A˚åÅËn—‡RH˘útùÚ)1ºo5_})¿§rÚ	UŸ|ª˝¯mŸxz·ÖﬂÄOvzŸ†¸Ü]˘?∆Ë¬@:ë÷Öt£∫ö,–›.HÕ#~ºézX¯kRƒoÔÅvÆ∏Tj—HA÷j¿‡4
“%ÙÁ¯ÅÚ»Ô$œ≥º±’§/Í|ñ$]Ñ˙NcÑàí¥˚uËÂ&$$©Ó˚ ≠y’?Óv1c©úé|g∆b>–Á–)lÿ ﬂ∏∏ú+Œ 5y)Ld∑wj≥q˜ﬁBÓY„˛4 2ê	Úèƒ‡˛fQñfÛ˚Eåì9zÕ.ãÂ'Ï'nIYê∫Q~£’{¢¸mÖM˝E|ß‹øõù7ª¯ˇŸ¢j—‚sD∑∏DóöXÜ•Ííô‰;¿Ã…UÑ±Ä9√%ë∆‰ÊÇ[ŸßAÈL6N˙s£?È •qT`«ÍA·yß>P2¬sÏ¸Ùê;2èï&ßµÇ%izÎ'f
iÌR¥∫∂≤"¸``1<øÑ›#“°Íkgõ‹n6ˆ‡Og¥}9ÎÏ4~B?tÙ •Ó ˛˚,Fseô?t⁄Y<8ß;QO’éNIàŒAˆñ†€%Ì2SU!O
¥lÏëìÇó"ê®Ô÷ÒˆÀª ä-…ƒ8"sËÙáÎeß¿}?ÄOÏΩyìúèG.C◊}UFP·úL*_›m+ÄFXXΩQΩ“∂B2;*Á˘ì"Âf,Ÿ◊ãßÿÊS¡ ¯€D§®π0 O·r[±`Z‡’ó*oËIeˆ“FDÀÀ—≥å∂âFYƒ$üeXEp5Îg@„Wó…Äˆ33Æ∏¶Â<h˝ñ>˜ >í;^n£S±%Ër¯¡!˝≠à!Júh\‚1($Ÿ/D‹	º‡=˛Ê!˜Yz÷Kæ 1çb∫v:pì´QY>¬CaÅñ$aä⁄Ó±ão]uΩ<‡
Ë‹óSûTíesaÅ…µÚ„A1>ÉáŸ‡dãÀl•◊£¯xdîy —7xKa•åLûµaﬁP£ ¸ 
Í	â>Wƒ[¸	≥,ÜV‹.
ˇ∑%A√RÊñ’%èﬁ ¸ôÃï
åÒ©l8ıáœO∆±H≥πÀ*ˆû¬áJ?#ª-g{ºl#kÒY˙ÌÍ_lSU~/î©‡ø¯Dã!Ï§>\°Ö√-´Ñ“ )˝™Í9uz€∂dπÁ¶[>¸€‘§±E√oòÛﬁd∞ﬂ≈^CIÍ$1Q|´©ˆæñµ˛Àòé∞"'t¶0åâk#ﬂ˚ô°Ÿõày≈≥„∆#qÑñ›ÁÒP–’waAt˛6.Ó0¥«mé
∑+	¸j}8ë∞‚nÒ´zãÜç◊¨5-|C<a_l”s∑.áó∑Ø≈J¿˛PT“ÌÀ∏``ìã≤n^4¸5Õk–ÀZ®¿sè6,!<øpCâÜ.·Ã‰ £¨8ò∂Ù+û≠<ïêÙt Qh% T£D‡öH2˝≤3WP⁄‰$ÅﬂÂ›Æ%a‰EÎ%Öÿ!0!õ•<œ	w…I:-„√¶ÙM˚ÇJHÕ≈E#jçûß‚∏´6˘â£ûàs…:—h®ÈáLÉÇÑîcW≤}âVÒœ≥10·≈≈ˆ0Ó ¥Êà/+%ò![Ä]:Ûxû∆£ƒõo‰+6gæ§	5ª}Ú·s/	Q)òØi_ƒÈhÁE≤?5ï”Ã¢Bt|§Ô¸èúœF[*iXnMQ∂∆’»Ë#93∑QÂYºŸÌ#M-ô„©h]`]Ωzä´˛	ànÁóTã°ﬁ´–µ¿À∏∞Ÿ2—ÓWÈúH§§˚îEYb
„∂íçê≤•ÍP„}ª<§rb{R›6„lî;C|öÈ<ø»Ú[ïgSeh©ßÒ‹ö±_†c‘• t ûA_ìùä‘HQúñ€MÖàaO!d≤I 2'ß(Ñæ÷&é‚≤…ÖQ¢ïUD—Ø·ˆ◊„$ø—%P˛Ÿ"ÜÍÍ&˘”õÊ¿Ò E\úãCl™J≤Ï◊ëïhÇﬂπ¿J⁄lóLq4$∫§ˆñ§Sœ‡]2YF]˚us\nm√ÜA⁄!J#Å¸$’⁄#;ﬁœ@hŒc‡‹ΩQV`¡zç≥¢'}°@*GNVwO3Ä(E‡⁄*ƒuv¨ÑFî
À->ís¡g◊∂‰“ÎßÄ
@ı=/ƒK
¬4@ç/eΩ¨ìl`*êŒÕ6Q¶#æ@÷‚≤O°[]©Sêëú$—È˚©ç˛õAw>eç¨z*ÿMí!Fdøâ–	Çö«Pç¬÷˛n!M.Ò∞±“æF-]€K–≥BÓy~3emÙø»˙/_ÓÔÇ∏o‹k‚	RMÔ1¢>^l√~ív3 K´´•ŒXà≥hò‘F+ &a7íó>Lk¶"/Q¡^Åñ8f≤/EG·]˙"ñµ0µûóR!oû•@ŸEm·èø˛Áˇfo„HË¬w”bòÓæyõÙdè‚◊1˝©ìzFπD‘(uyO®Åë{?ú∞v‹Fo≤ù(”A⁄ç€—…‡uÌÑT ºñÀVY˘&Œ∏Ìˆòá¸¶a7u¡qn:9óˆrZù∆6ò5 ™c%súÈÒh/[dsZÎ6.›–ÙçD 1Õí]‡iMnÇWB[Yè‡dh≤+ô¿˙¢ïO5dˇ´‘§‰Hl“x^ë≥#Vx6h®§áêŒ≥ÿÿüÜnœ∂mãF ì‹´ÜôÌâ÷ÏrF•Pu'Î°ôr:›YlrL-∫¶–mÖn£!)tÒB(tÒÇ+tÒ7WË‚oU°€8Ït≤Bó‰#∫çÜfH¥mpLkÅ∂]¥1{[,b§°{[dh‘]˛E†ÒÆNœç E†°/•«•∂T
5jUmÖhz]Ø4ΩöπhV‘wa¨jád.úuπz∆qèP’çœ<H#U€h>`3óõyHG”"\2∫ˇ)aëä,”¡)ïÕÓ%˘®Ÿ‡-&˛©Q2xõ∆]’˘Å4Éúè‡?¥h‰Y!‹  	PÈw0`EiÆFç∞"ÿ∏œ$˝K´ïG±»Ç‘∂›òÒû\∆9ﬂ¢˝ıe<*:√°Ôa(√u´ã∫±öô:qΩæJíüv1¸ŒB/#ÜMz1˜Å&Œâ›rÄ°´Ëc±pïÍÓ†≤OÈãZŸó∞qÉú◊Z‰ÏñEÙ≤“-n˘§∫˝>uò@âÒ˚G«ª{œÖ√Í˜#ú<0âëø˜æ®OâÔ€ﬁÇØˇõ4OlØ¸·Áˇﬁ`-æ˝ _ë⁄~úèv‚!9§ˇ3·6Éñç7ÂëPœ0à)/lGπÇË¬ÃC™rœÃ {	ò=0ÃC˘îÓ„’»sD√Aµ™ÈQñ ¸‘wÙÂNºG¥œÅ‡;£Ê ¢VÊG¸Ö¢£“\’¨óYÔè Ãö±ö›då€„ÖøÄo…èùD´ù Àr¸µWÔæ…Sz.R˛˚OÂ‡èqä>K{óx]Êˇ<Œ”=Ω˚Ê¨«~¶¸◊ﬁ[t≠•ﬂ@fΩ>˘—Èﬂ˝{ü˛H˙ú˜	Ò_4Dv8ÿê.yÂ…ErÕ&—qr±w=læ˛Ò;ˇ„≥◊P¬E*Ô¥ıÆŒr©I2Zb<E9]
úåfËóåa)§åíÒ^?˚I˙<˙ÏX"?"A?°ÎóX0PR&˜˛Ò∑Â=Ç˛LÓ˛œˇ˝ø˚πx@Aõ…É_îw®eöˇøàáô‹ˇßﬂï˜”n˛·Wˇ∂‡h‹Œ´€∏ÉypQÚ8èıÜ>ß¡kÕ∂≤Cf[˘˘g{Èa[ã…—ç∏0M˜ô⁄p›÷nöó‰HçÜµù∞M Â5.◊,ùµ®iæ`l‰>ﬂ…åFÑÏ6j∏fnÁØﬂ.J&nÖm$H±ûR¢ﬁW¢
_⁄bá	4ımFª5wïﬁft1∫“8E6⁄ThK+⁄ﬁq¥‹ø-/G´mê¸P$ÎÇ@›˝&ñÉáwcDÁÓ∆›$jí∆=º˚=,—¸:Má¯á˛¢4tXÃÁ–J‚˚á>,ﬁF˙ïtÿmÎ#©ˇÌ˜_ÉW‚¸Kó˛MsK`≈ê°kE_¡™kk2ÕbÒˆ+√SA^jÈ†”o<x-˜—Z;:Ω˚f4Óe—2Ã_òwˇgpûñ3j∆√o“∑–=P˙˙‹ûﬂ}Ç≤Ë"ì∆àNnèZ˛≠âF|P£áÌËd|6¢• Ä·(π˚=é‡8ëú◊¶H»!˙q? Ô˛©>}ûD*ärî„3⁄Ñ;ŒÛ¥´TVè°!_[∆Ö´Àìx∞√>⁄¥}ÛÌã¥8 ∫'–…õ Á•‰„$kÂYÈ≠Ù„¡Ç%œ›Ò«gîËô*Rç˛c0Ì%∏)m Õî?#o[eÌK"ßF6—3hÎî•°ï)»2‰Í¡dê´ú2â=jGª	|{â‡MÏf
?“ÇmKLà
¶ qûÇÊ!'‚…¿nñ/.Eá/w:&ùQXmùŒ$ ¯í+>–√P< œd˝óÉwYvåYÓ^
<9œ”!,ZÇbX%>.…ê?së°4~"_œ†¡VZŒˆ∂Q1JÚ«‚M±{Q≤~ñ ¢Ï<s‡QŸ¯Eû}•Ó&í¡y÷M∫œ≈~áﬁxyºøÉïÄlö,K÷¬´t–ÕÆ⁄PDÛıÂh4,û,/¡µØp´á0Â˚ÀE2Ën„oˇW ∏E!Û´≥^<¯)Ì4s˚íheU{A™D&◊Z<ÊâO›búΩπ_É*ˇéBp'+'˙”¡˚≠U}U‹Ô*K{OWpcÔ5S¢yÁT·|ßí…îf±âÖiéå˚,ZÉˆfÉœEºø≈tª¸z#Rµø∂Z≤wCj1ESôÖ°l.∫«<ŸO|É;]3”íßgê:ô\%πÅ]$(E≤jΩ"}©3¢ª!ÆìÚg8:Ã ¬j;£ıG‚7j}pO!/Y@ÜrEñ¥G¬#]∫è∆)ﬁåíYV*ŸÓµåEÑm97„T≥ãΩ\-!ÜïÀ–$Bπ‚3Z)ÃóOsb“'*ø≠M‘Úª¨◊=a‘ß0-J˛ kYæéëÉ≈≈ô.mï‘™I¶'øhìÅ>zSfæ¯ÂSÍﬂ+>4…ö&ˆ ´ÚU$≠ZjŒRåÍemÿ2®7»Yb{8..ç◊µí>òS©¡eﬁä$›.	Ö˝íófÒ≥∂˝≤,A=∂e,Q∫m—k%q9‡y
–èé›.Å»]ª“@©Km¯Uúö¬T◊é¢>ï7Ãﬂhå"(’<†f|¬∏üXª%Uëµföâ©∫·M[ìèî˘}(™kÙ.å^˛6ÕÀÍ%FàÿÆÖ+l‹Ç[·≥øDîq"ó7ãl±@3@-«k~pÅ>&á|ÀúB’¨@ı3∂≥vSõªÿLà’çôﬁÀMﬂí‰7N-ÒÚÆU<¶yeøBˆs‚n±◊| ÑÓåõÒç-!AµÌ€Ú29¡≈ﬁ/Õ˛äÍJÕ¥ÙPºﬂÈKbÔP'ê¬†Á]Êõç$:¿"ÈÄìQû…¿: yù¥8Ûö∆ÁÅVb…⁄eEélßìvÛ¡^»¢≠‰ùX(%\∫BI·Ò¿Å<£’é}a´û·õ-Uû©ühéı“d5∑Gedœˆ»q¨È˝;EïB=ıE˙äÛ•∂)ëZH+4Ëü≤óSÄº¸núôxó≤?µ›EÈÂ^;f8S ⁄|ÑwXàì9}Ivºú?Çõ¬ÿ§Dﬁ‡˚q®{˜îÛÇ2Q5SI@„ºÁˆ_ü√QÊˆ.äœ{ÕÚcòSyÔΩu…sXP§≈D^<ñ¢.xŒNàèáÿ	±nåN™£¸bááì´}¶Ï•–YÇm3MP+ZEÉ˘˝QƒÙd∏üoDD=+Æ∑6ï‚–B∂íLì…†"öªIë¸$f¯3ËûÉ¶èF±>5π"q⁄^X¥z»¿º:DÜíÜﬂ‡u÷ﬁ∑—‹Ÿ“ß2E
Ü‘S¿yr£˙º»¡âﬁ9^ÜŒ≈æ+º'*ï{…! rŒ∞⁄˝)'.˘I	O¨ñπé)\N@À§+Î¢∫9ø#µ≤|IÎ≈ç0¿fô∆0	€Ée’3ô ﬂ>ì™cgPRÖ)óínV%ÂõS©%È>„]é¨í∂S·ååïhÔø*≥Q‘ú/X>◊õÂ»ƒxM0!©ÜÜdØÂ“~”ãGœÅÅ\ π]ê√PÙ‹Q„_§‰÷¢∫˚ÙK˜ﬂ6Ê¶Û‰˜«‡ﬁÕÈáw√pZÀ®ôº-ºÜ%H¯'"H¯#Ñ˙ˇÑ√è"-™t#,û»y÷≥áì†ê◊¢˛YÎë:v„Úë+ ÖÀ0È…h QKtïW+Ì5Ñ≤#2?¥≈D◊±ñØ∞á˙OV1à¿+R∫Äå^á>axÀ¶«óY— øÉ|s^Eiù∂|˘HE{ñ#ÂÿÜJ‰â±∆[e¥π53‹á f°>∆5˘≈*%EÓ_∑0îsD„6CÎ%h3˘ùgWÊ Y◊kŸ]µHü¡?Jc$∞ow4<v©ób8ﬁ¨±È`†≈ﬂı¯õl<ü%∫{ÕÑÓñÜ§™§VYäI©É›ãØÁ≤&…Í:Œía ∑Oï5∏ÔìW»ÁË5˝ÂÉƒ t
dkÄäOzD#XKQê˝π/≈‚F¡π‡6˛≥âòˆå‘?_#ÜÂìÍy-·ç1ï í2~ê∫=ˆG‡…∞ØGÑTg$Á≈&Ú˛Í™Ωœ…»m≤¢«*£M⁄¬ÈÑ”≥µ+1ÁçH[b aƒÎ&·£õ9Hm√òYåë„i¢8‡Xj){◊Öá'›=ºÜìèî‰˙S ˝øÏ=^ÅÙ•6ê‚>aNF4‡^œe—üó]—†÷jF©Wy◊Íc4ÖızõV≥ÜmËi™^⁄HF‹˘ôïÑÙ©bºÊä\@’˛ïaXCƒ-6´SöMzÑ–cïºßó™ÿ{-hNê8&óD4x¡|äQ:Lì}0®A7ŸNE º™Ò≤àäìZg€ø.(ñÕö}q?Û7-PäÑ,ÌX≤§êBˇñyˇPgæ™ ÏNwÁ¶RG‡CÙ˝rà¿]I∏º5k∏ºí9ÍëÚ¥xxÍZÁâ>{« ·Í£r®lQﬁn0÷P>cE„∆4º é!ŒJJ˙y†Î(Kz\u¿‡˘„"bœõ=	Œó"¢c∂r^jƒ¢»o~º≤bi
%lDÂªk÷¯~÷ÆeŒEÒ÷K”Ük’ÉGûzXì"ıHúG¢-ÜÈ†·\;£à£∂ÉhÍ™Ç„kÙlt–t-R‚B{äQû˝4˘Î¥;∫‹ú<º≠hÜäã>Ek¶©22º≤∆UùãÖ®nılTÊ
ÈHû1Ì&¶£√;ò˜,Å;ö¶∂®ÀûWµ0ˆe(-æç¡h[mW„à—…_ôçN‹¯,¡¨ªM–ÂìnJ√+sÜ2V±ìÜN‚TZ»óN∞Jµv2˜ãèTàoæïR¶£™ íÆƒ≈g§éµHV1âËÌ|˚©≈]„{^Ìˆ£ï
@◊Q…‚∫»¬°∏Çj˘Âìé¨3^€f%#61Œ}å»(÷`An≤±QG+·≠¥3Îûc.‰‚e%5Iµ\håØeË6vŒ;∫ÿ´0∞Ã25v8nN1©Ä5"ìóYZYïwÈ—7†«⁄#Ìx¸$árd:í•¬˚‡A<‘öHúHì<!uù»ûWí?Z$J[ÜñG6>•U]ßf>0O∏Vv}%dıt»JO‘8WâTáΩÂ9ÖÄâö˚ÉVg8\¥“§GT™G∞6pñ˜D±ÛßMÁ6©Ö©õ(˚õ3¡ê!Y´&<Á£¥wI√Ò·ª/Ç1œ8(©:"è%ôaol—vY2Œ~…ÄF:viÀ◊˛¿•¨ûbL^ŒÉYâﬂOÿı	7˙–Ÿ€∂±ˆúMﬂéBT$ﬂÈ«0÷ûüà'y≤k9W∂BFPﬁ[p¸kÎÄ∫ÊÎióÛubÌ1ËF≤0ã˜0$föo¿v!D€k≠<3€≤˚Æ4‡ä÷w˘˚QÁ"ß!Á∂÷FùfΩDâ0M+|U´smZ„®?íÂ€u√ºGÊô>·V˘X∂H¨sñ_ÙME≤°awXà›SX5a-"ãi?KÁ≠G++ç-å7]í|=NÌ£guT<‹$Ù>⁄l–ßñe»∂µ—„!‡Gøg”‡T+µy“CDó$¢±µ[d§/aÑÆZ´+•sÄ∆Ñ,√á#œåK»3Å<Ò†åƒ?œ≥^ñ‚∏QkòB„–J≠l<b∆[¯EÍ1»â];k6¶¨Ûh¿D≈>`Ç…T˘öyö]gõª8 ∂˙ÑX¨„Z$å}AZ«{¸¨óY^∂Aó?¢ˆ&À˚ZsÀ+S∑l‹vˆ´K≈mÔFíaŸ=ÃR“óÚªä⁄Fy&£s≤E}‚b/N1yuBk,πö(TA¥}bz√‘Xº›≤2◊?˛˙7ˇÓH≤kÌ!øûîÅ4ñª—œ∞ÍmdªJ˛È ⁄˜6'ìË2I/.GO¢ï%ÓùøA&R?`´µ¸¡∫*-H_≠Ííîl4>C+±0E∫ÙO≤Á—∞ı8¬•¸MXÛe⁄Ì&”UJ¶µ√◊ö≥dtï`ÊghŒæn≠ZV´•›alˆ(	›Ñ÷£à3îAm1ùó-+~ËZòt˝uÈkÈ™≠#‘∆÷^d~#ä\%g™œ≥!á¡BäçÂ°e⁄∫àÔ8|ä5Æπ◊õB{åJsTí]]U¸nJûÜ±∂€∫Èµê‘Ïl¬RÈj¢ûÇ2ôÀﬁâgêµäÛ<ÎıŒb”◊m¢Ñ†ê‰$õ—IyÜI¥
´êK ÄÙ”‰fsÇ!.ÏmTÃ@M¸∂ÜÎU)ö	U§M≥˙Ö¨k:m~)q±Îy§0
m3Eàßóº!a¿Ä[ºZ[#sÇx®Ï◊¶é@9P"]R`K29=l†K6∞!4Uª
Fìì6	∑
¯÷>–Aî>39P—˜hπ]¬ôaB_ €˛–À™Ä∞)ﬁ≠ç—⁄Öyè–˝ÔÔ«Ó˛é6ûfŸOèÜ∞V∞M‡ä…∂™Î±jÒsO7ÜH4§ﬂ‘3j∑nÆŒ¿æ˙y∂§ã∫6”a¿3\êâTJöƒFf˚cª{èŸY◊Ö4˝ñÀ>ÅóÓº±uò.≈⁄3ì¡Èx„†» ÉÅ.Ä`‚∂µwÏ∂ [ˇ≥±\Je‚æº«≠¯i!¡ò@Â˙√›ÇÀËÍ	¥¶HÂIx!∂ç∏‹#ìlÿ%	Q
`¶Hà∫©ÎC◊:°§ö+z@?(¸ø…≥~kîÀ≠¡√cŒÿ¸Â]ªwâù_˜$œB´q vÊ¡RﬁEû"Nª(∂¿Gä˛Èrçi(3H@f∑+LıﬁÈ?ÅÔ[»·„*ÔríÉ√√¸”PD‚NŒy”«–œî G=N‡§
EÇ!Œ‹6s ñCÎ(ÒÍ]vLÓ?›ZÉEÏw˚Úﬁ[ˆ•^≥8VØ≥{ ≤‚“Äây£ãê>7√ƒÂál¯†À°S‰Ä9—EuFw≠în?aÖlHˆ”¥é"*À	â†C/o,”∑É≥#d[·1òÊeÍ/Z?'ÇÍLÚ˙◊à!;◊ŒÑ"@c&ø¯yƒQ†#kóÂ®Ÿ™ôùM∫Ï_"
];+1çπ¸”Ô"3]?Ñ£nl˝·WˇçGyVï»Pd⁄πåk}’˘™0d‚VúUÓDîÚùGDìX÷‚ÌªcZ–∏ÇSM‹çs˘∏ô<ök›R˘*≈”1æ7Ñc1¢S´Ö?[P;7Ô!I9WÛ")æß:X—)â«h¸ﬂÎåà∑˛O46Ê±ô—ƒå"5&∆èƒ\®Q%Kıé”∏∆ìÃH´ﬁçîÿd’o3-µJ._[πN"Kiˆ∂râ¯aO‰ÄÈét[’Œ£/,ô´-9ClUk≠©Àûj=-ó˜uÀ®ıî∂ªñH\ˆáD-û0µ›„e·<éGF,ÌÍ≥Œ˚!:(˙jŒ¨Kıá8®∆ÊnÇ–§^ånÎv.Í¥zÀº~ûE¬…»#øßÆˇ¥M
oŸª~ë —⁄C«—<ö¨≈˜A®Xdùâb¢-,∏e$La;Ît®"X7	:Èœ^UÛ∞HŒÖ qR/Úo%VÌXËwœAƒOø`{'ÑcôNre“\≈ÊÛI9ÓÕ∑Ñ^{ÖQó¯™SoD´√^-6'‚ßÁuãï‰2˚·|’5ñÓ)®Ÿª≈SãXkÜàı}äXŒNıHU_∞Ìv`ÁÀì˝ùÒIú4Û.d9ﬁóû˘lp1}g6πò¯jf«|ƒÅ='∑q(9sêI¬/•‘î*	.∂≤–gµzÜ±‰Ü∞¨pÍís∞≥+±∫∞P-æ8üU◊Xçl:Kïµ^®æ˜πW8ıKY⁄∏±u4$Q:∂Ûò&.\SÇÜ9,EŸ~˜z—eÊ≤UÖ»w[àwõﬁãΩc(ßs∞ˇ£ŒÒÇ:˝
y´˚˙√	÷áäZ—á§ªøò\≥†æXÙŒ>ØÆÄWœ5ı›œΩR–ƒ§õª®0âbƒ‡¡¢0&'¨Õ8ˆÈœ‚n¿æVóJyWı¶Gú-U%º9ìw/‰©ˆ,[åÍeÚ;¥H÷ß∏¿ùèÉÿ|¥Ê^fa´Ç©Z+aà[^Ü	{a¸7d\≈ôº˚(€œû»-ÚU‡ñ'X¯fœÆ∑tÙéÂPœÍagÑecn‡$rm†í.  üq%#a∂ﬂRÊW»]~jæ#˙ò<m4NÍóÎ·˝ê≥˙Æ=Gˆm«Ö§bÎe?ªØxâœV@yà_˜]…—Sa Ì§ÆKe	Œ¶∞,˘à÷∑Ÿ≤¯¥∏*´~Ÿ
πG¸+îÇÁ¸IÅL∏0˙à=uSn@UﬂtXúºnÊBò°oÿ¨yO=”¡Êß iÏAŸC=¬C§S–Ç;≈À¨yﬂ{dÁTˆa:˘¥éƒ1Ñπ„ø~0£Ã»´pîù¬È°	·D˛ ~à[79ïO@hz,'ŸTË}£U*i∂ıì ‹ãﬂˇ®v≤G]vD}óÀAàππù(Õ∏ã7ºÛı8ÓÒ◊∂›z◊
%Z»G7RŸ]j2À JÅé]^˚”›Dçôƒ≈°/SÇßŒŸ
;çY‰K™2ã‘0OﬁıŸ]„’íàDTg9kœ|µUüÖWﬂPÑ4e;oÖÇ…ÿÙ1∑ƒÊ	∞Â:Ló4ù¢ù◊£ZFÍJ]ß	´⁄l±ËÁ}Eï}ñU‘´âÏRŸL–¸Iu˚Y˙µÿ“≤KÍ≈Ø˚í&øzéWaô˜À4}( a§‹¥njÅ∞ÓØø›Á¬ñ*¨÷Hö[ﬂ›Kø˛“˙Ûä.’
]E[¯Â/˛„w?è^H⁄⁄,j}nú/ó©`M}¥º∞Vj£’—vÖ40LúQ DàÖ°⁄ZtïÿÕÆ≥^vë∆ã∫jCw»≥Ú3∑±ﬁ“T]í	x˝nµ◊S´Øù.ˇL»|TÆƒ9Zs4MíB@ç∂çr_"E∂Æ“—e:P§MÂû*tÚG≤ÏYπ±'yÿ∂ı°Îhoj•Ñ:+VMz ú≈—Æx∑ü6UÉ¨N∫”4·ÀêIdµ$»'∏YwÈﬂπYpÔVlÁ∫Î°‘àî”€¢lìª~Ywz{I¡k˝Ò=≠“*ëU ∂¨<ƒhÛ-p—§à2 *äEËo¯yôà`[$ˆ…úîCÌSº®PÔÉg◊ZTÃˇ4›˝VüÂh:¥w	=Ÿ‰ÜﬂR_•àtyˇAàÔYp_re]Pá<Ô¶´Ÿ¬Ä≤x zÊÚ…ûT´cË«D ©ªn[cÿŒ{WcÁŒ∏òájX»)uä∫‚.È† _]<u’–º‘”±TÌz#CNÖÅΩoß≠≠¨~5≥∑q‘Èıì¥YÔn∫6ÛÔC˛O‘<Nﬁ"¿JÙ=Ã∑=Ké;ò„éú„NñÁ3dy¯≈>t¬˚ù<àõò>√”Éœ!G¯7j¿Xé„`’üg?Ifh˜Œg–Óùœ¢&üœ“$ºé!{à™Â-ÚIñ+#?»±GÜRÑù˝AëíM~òEgÙ\V∂·≤x˜Õ˘∏ó¡4ä‚A6¬√MøM
øL§ãtïr«7xòZ¸«î—¿¸eÎ’'Î<pÄó)gnKˆÇÁ*•Ûús:≥ê'(N∑nƒYq<ÁsùtùùÓ§™$!˙£a„π‡!Tò •–fó¿3Õ™¨Ø«√ëv§´YèJÒ)rS) AS|îH&íÍpÂ‚
ıFËAÄj@ÖŸ0îM»dMyG"cÌå\%£\…’p˜§WB’a™l¡≠À—¢¡¿Ω;9¡éß√ŸÈ“å⁄™ŒÚ‘˛‘Áˇ„ó$…Ì§†◊∞BZµùÒ[∑∞◊§Ï+ws¿·ì|d<°gYñ°QèÎﬁ≠S$+gPìrﬁ*;kCè‰ÅãﬂQ∑£êØ≈⁄ÄÌü≥ª!®Ó€Rû&YÖÏj€Jµ¶Íù√]us¬“Œ>û˚ÃÕ+‘ä&G‘Ù%=XµA1ƒÍ%bX3ò§>»/»Ë•›'—y~3emdxYˇÂÀ˝]`∆Ω&Í’H¶=»ÆH|Nú3Ñj"vr^Yë>ÿ…˜Ö¿LB…<*3mv>Ô<ÔÏEw¡ü„Œ›ø˚ØGÅuPfPÿ'Â9∏∞˜π2ÿf{À¡:Kæº'8#.ÜÊqÆ5r¢„)¬œ:¢Œå¿§xêS˙,ÈëÛYËq˘»à$]„Ö4≤íq\◊.(î#˘•`–AVa]º
5éªBÊ˙és÷K⁄‰ìfÉÑ”Ÿπ,∫Ω“H‘Ωõ'ç•àÊRç7)Ïf{a,RÊæ¡ù}!ŸÈeE‚iD›})n}ÆbŒÔ,ﬂÿﬁˆGˇìOE∫°Ä`√¡/Tè¨`›°iáÁa AﬁŒŸzV∆»^ÇUKƒów,‰4É¥¿è9ÿ—&∆¥¡_˚]‚ë“∏⁄&M7–?G…À>Å¥»–jr¢oñ©c‘U«C	§≥DÊ\äis≈M’RgâÃIæÚ|DåŸØ?ú∞∫m¡œÓıÌkß”¸T–N∂˝Óã¨µ0Á9Ä{Å|rd^˘âÂÛ˛ÒüXEÇºˇæK'Ä01ΩrÅ H(öL’€˚ú‚y’ÖÜ¢©RQ ¨t≠¬àö6£© ¢¨YYÅ¢¶Ãkî(kÜ”bEŸ3´â≈2	–õWjÕ- Ñ∏/)ö&û≤*˙NÖÌƒæ@x¢I«y¬
W;	Eö…Ä@s§»÷∆˝8Úâ&ÉO ?—T€Ûò§{GÅ¢I·ùaüÕX…cC?öä’s~¯P4ÖÌÓ™∑&$˝˘"F—TÂˇâ…ÖEÊròwÌ; ëbuÄío˙Y{òÛk®ì•ùU.1ÕÜE”{;≥_Iâ∞n√#MÓï≤∂kO(∫ˇº&»K:ΩÉM±d«ú*iG]
j†NÒ˙’üb)Éä•*ÁÕ ßÜ˚ﬁf®b•ø;ò*ö|“‚,hU|,v ÛX√ ¨ÿ∑a;tLﬂ˙]z√ØsñGΩ];&?ƒÚÌÿûµ:8W4M%CœÁ_‰√ë¬V÷8 E>ˆYã¶:ß˘™[R„X_`Sj£c±fÖÿ≈™_
+gDÕ¢iûÿYjµÓAãU}:-VÀ}tÍL‚ÌúKÄhı¿’ΩÈ‡º7Ó&Ö¡[…g>ﬁT}Úâ∑Q!£~∞…0n’ÍñÍ^	ÛÕ$Ω7ááÓE0ÕÖå&WO}Ï€ÍÑ2©∞íﬁ„6S¿¶ª≤!Û⁄æÜ
Fﬂy±hj“ﬁ°OÅnFSmèÚiñ¬wåw&äıÆ∂∫¯Wé >yüÎB¿ÃYBÙû|ËoëµWÌˆYGì5÷›K‚DD¶≥|OÉ≈JùóúπT@∆ÖQV¿ƒ—ƒè˝ﬁ;XMæFﬁfúß‡{Çésó8_9w9Ûí£iFk¥ó∫EÓ åÂ>?ú9ö¬–ÊX·AGQæÒÒ∑†gÑ°£	ªŒãC«
õ©◊Ç@ÈXA˜€gS‘—Ñ~ïÛÏ™ÄıÇ"‚Õ».º¿uÂ[O]1˜∏3^s ¬˘"JeÿÉh|O@àÅΩÕMC2≤∫i∞„ëÇˇ¬ò`ﬂÍzWà+U÷õZ–|$Cá¶ÿâ««v|a≠ﬁ/"©¬Ω†Úë>ˆŸ*†˘å±iR∞ænñ/˙ç!6Éy¬Ù—>5|G·˙0˘ ˚|˙ˇ:∏}òﬁØˆﬂâÇW_˘ØlÎÁÊá©¶	¿ﬂúzÄ‡ˆLÉÓG⁄V˝V• ˝m^hòf1P“
jÔÁ˝Gj=?¯?^∑˚É ƒfQàjBÚ∫œàiæêÄºn˜àÈæ∫¥"ê$)GsÑ
$Uª?ò≈Ä&áx£›#t …?–º‰YË√T¶≥ZñÓNìÆ∆ïÖîô-OÛÜƒÙﬁ!1UNÎjEˆü‹ iÁú!IûA∞ÉòÍ@b
Éƒ4!¶o#!&ù‘√"ƒTìLHà©íX™-Ωs–ØêBÏ6R·{PªÃ•êd{ÔHÖò¶G+$uq©4ˆ,u`I)Ô∫êî?|!Õ ¬ìŒ¶ƒ1ƒTìKÃfàÈªhà)lssﬂ¿Üñ2Ê nhÕuvÄC[áÃrhÀt@á∂>òÏê‰ÏT‡$U%Á¨æ àòÓì!¯∞U<DÓ©+ÚLäàÈªåà…#–ÖHbSÇ$íœßj°%Ü`"íL+q1Öb#b≤„#"°â⁄Õ:¡jˇº∞1U  u11M,√pOÿâ§éï¯âòº≠5°ß¿S$ü’¿Tƒ4?\ELv®lÆ∞ài6êEL3-b∫∞ELÅ6±†È˜ºài
EL° åòÊ¬Xff‡‚±ºËÒú^J ¨jÙ&¥/˜Rêp´jXï#ÅMUÁ2kzi0nIµ&	MS *Ú4-Œ!OAxáÏ’‡7YW˜“–ÃCO™ΩåDL¶ØVç/mÚN√ˇ4¿Öò¨‡Ö§¶≈.§µ©É_àiCR“¸¯≥œ–>$ÔD˜;”A«∑À%∫ûÌcKß[ŒŸ{˚6$4”ù8ÔZk·ƒÕ≥æço—éÁ›ÎMÚΩ˝i—È¢·d¬~ÿﬂ (#bÕÊ§¸m∑Ä}1üËõ˘ ˛>=4ÒˆõìÚ∑Ô›„§oÏìvÎwu¢ºåu˛¡ë‹ú≤ºèJ3¡Ã¬§=èn_†V;œz≈ﬁÄ‘ Ùnˇ<Óùè{»*OS<Å1ÇqèÇW≈+6∂_⁄æµLÉ`≈—ÓPp…gh#L∫Oo®πª∞q:*`kbÇ≈E2¢/ìoã¶—-™˜ë∏√Úÿ±3ò–äPπÜ¸^ä.¯¡c{dPS£Dí*[pÇ7
ö≥Ü;˘§eS4ÑŒEöUã‰≥QŒg'Va-’Û6æy]+Q*á¯tÿZ◊˜≥•raâ∂´}v!~ëè˝∞ı≠E˝3ÿ`œJÖ«ô¯AQ∞cß&yYÇfËêÛSA¶ïüU’ÔóÙÎT˘RR†2MÙZ7-l“7.ÈŸrõ›8†Í;Dq¯Qﬁ	¶	}ùòµ™œ…]>ö˛OŸPÜ>Õ>ﬁa#ÿßÃ"6»Z…ı0ÀG•ı?`„§√TG9Ü©Tê%îoDIªe√y6å/àë∫π¯i≠ë8^ß/»æ„·º$ï'ı[≤õZ	˘ÆÊÅ<L@ÌµLΩK>¡?ó«=ΩŸ•‰A"TÀbF;ùl<ﬂ¿h#ÔêÀü•ÉÛ÷C˘ÙöPeìóƒm¡C‚sD\|R¿"ô¥>5ò!Ôﬂ'‰gm%‡Ù¶r<»ë7¶%d#Ã7ª™–`≥dí$;‘Õ∆…¯,ÕÖ_™≠{…(´.%Ù’€<º÷;¶$o~´gd7ªÃ2'ôd¡p√[—ÍŒ—o’5∆ÁÕŸ›§8OÓ{“ÓÒﬁœ¥ΩÁΩ±$;Tπ˛o'Ñ˛⁄d⁄VTõJãM&=ìyAÑ˛ã˘√EJnUc6`egaÅMä#"áÈB=QGåçOÄ ñfóÂÈ*tˆ]‘ûEå¥mçî^MÆî8Z÷Ì7Yæü_6õ¯Ä∞…¨j≥$'µ·ØX&_BçïŒ|Öô4?D˚«∑Ëd‘öjfÿ_ß≈f„¶FËËä» <Uö˘Ù!nN≥_äî!6UÃjBOÅë&ÙTπ'ñìò¸XL†ìlßπ^+Ê›·÷pô	u5ƒéä|¬£§1ì·¶Êä]V#iZ®%–ncYÓ˚ »ÆŸCﬁ‘"è EßûÍSGïÚ”xï°Jè~§&’Sµ©ûÍ™QıTG≠jˇ∂æö’h√‘Æz≤™akç ÙäY=Ö¿ôU.pïäåÂ≈¸≠<ãÊ“ÕVy4’]Ì|ØÎÛá∫‹°oòé3æº∆Lœf„”ÛÉ˘pÉ˘ÛÇ∫5ÕãTü&´ú‡S«'˜Î`=vÜ„»…¥;Èf'&¯våÍ.—ÊÒ≈∑Ü9X1”§-†≤∑∞æÃ˜∂g∂∏t¶∏gÎ_·¶ò÷	.G™0´‘_C“Ø∂xJÙ°ú8PrØ)≠◊ê–ΩJC' }ûπ"sª&ùın≈ÄØëa„≤˙ù»¡íp›ïnöı≠Ó™6ÀZ6Øl:	v∂ı ±JY©’∂@TH°v…”˚”*mN¡R2√¶M»§©û2U&L@¨7UÍOîz”d˙I2ü)R_∞õerXßÜMh≥äH⁄∫]l g[Õya8 Ã&§{∫qqôt‡ ƒØƒâü`N2∂`)V◊L5$C•E´›ä«£}KÈÁc◊Ï.;1êîƒå%kVcâ]>›ÁWä>öﬂ,á•04ıÌËÉx5ÓC;Ä(œUœ¨¯„∆•”4éx2d¥7È≈8G<¯hßó~=N¢AÉ2¬ßÒYú^g‡„<Î'wøâÛˆ∆≤πSØ»AõÁˆ6Â©Kªï¥µ#≥‰èöÎ>ÀŒ Èg|Ü◊≠OXér‡¨∏åªŸïÙãü‚±He÷Ehá˜nÒn∑télQkπA&ÂsÌë2öø˛∂j⁄¿÷∂c¶^ÅÕßM
√ìFW∑lt(™Ïã<)í¡y¢∑rRƒoìœí§{Ú<)ä¯"±Së⁄“◊æÿœK1Ù¬çˆßÎv≥ã'¥¯z’˛irùé,≈∂Ç ∞»ªÃêf…5	'ì)æ^YØÀ©MÒÑÀ:lŸ8ïÄ’Î++Àú≠óx’•-ûﬁ{¥¬¿Iü9çËF¡¿jπlØ∫,ùﬂï ó?ÆÅ	`-óÕÒ´ÀrÒéT&ˇ¿ )lJ´–Ë»y›	‰¨ ÿÿ(–,FÍ}Íx›Ñ:ñE‡∫ïùlG^Øï=Eú∞±ì[ÍÑœ%ﬁ`æÛ >n@”*˙(í!óP‚0DÁr*÷R*‘û@_peìÒnÈS‰†3ÛìJf’–´ÓYàQÇ1aƒ/Ü]î}Æ—_lõÓ<Àßµ∂b∫˛h 6˛ƒ5ÿ~VkÒùë$(‚ÔS;K
eâ˛º*“”Âá+tiq®Ω≤ˆePjÉ˙ÛÇŸ(4®7®?
Ô„§ı±µq¬öæ¨4œ‘˝Íƒm2˚µû∞´!tN˝I}»} Ÿ$®}7äé◊—≤‹xy~ù∆)À√'ﬁÂA1ﬁÍ3~æ¢›bøB: ∑!—…+õ=ò?î4^ß¨´◊'é÷W4O·EqF[õ?àNÅ≥¡ˆq–£/ôõ≈|õÁ¿{€€¢Ûﬁ8Õ£Ñ5SÏéflùk+≈\ÅÕ”Ô˘´mMm∂4Qê=tﬁﬂMz…àØ∑.K]òwzIú≥7õvE•Eˆ»;ñ2›'¿M*∞lF§=Ï4&ûÌûF8x}b@ÿ‚Ô\˙
È\á◊–√˘w}%˙–6∂q∑c>l+K¶¥I–LŒác|´Y/¬≈ÍñDYÅÈÆ√‹áî∏6)›<ÄiëñOÛ∏∏î2ÀîúX;⁄œÊ˙ﬁ5ô¸€$ÿ2ª¿ ,ª„∞°—n0Œ Ó¬¨∏˝ˇ   ˇˇ –‹m‹