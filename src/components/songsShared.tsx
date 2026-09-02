// LiLouPro SongsView - clean build
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



export function cn(...inputs: ClassValue[]) {
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
  if (normalized.includes('isadora pompeo') || normalized.includes('isadora pompêo')) {
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
  if (normalized.includes('preto no branco') || normalized.includes('clóvis') || normalized.includes('clovis')) {
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80'; // gold condenser microphone in professional recording studio
  }
  if (normalized.includes('rufino') || normalized.includes('gerson')) {
    return 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=150&auto=format&fit=crop&q=80'; // warm classical acoustic guitar and singer aesthetic
  }
  if (normalized.includes('davi sacer') || normalized.includes('toque no altar') || normalized.includes('trazendo a arca')) {
    return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80'; // dynamic live concert mixer and warm backlights
  }
  if (normalized.includes('isaias saad') || normalized.includes('isaías saad')) {
    return 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150&auto=format&fit=crop&q=80'; // live male vocalist with light flares
  }
  if (normalized.includes('diante do trono') || normalized.includes('ana paula valadão') || normalized.includes('valadão') || normalized.includes('nívea soares') || normalized.includes('nivea soares')) {
    return 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&auto=format&fit=crop&q=80'; // aesthetic stage lights
  }
  if (normalized.includes('marcos brunet') || normalized.includes('júlia vitória') || normalized.includes('julia vitoria')) {
    return 'https://images.unsplash.com/photo-1446057032654-9d8885b76c2a?w=150&auto=format&fit=crop&q=80'; // aesthetic acoustic vocalist
  }
  if (normalized.includes('zoe') || normalized.includes('luma elpídio') || normalized.includes('luma elpidio')) {
    return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=150&auto=format&fit=crop&q=80'; // warm golden-hour sunset worship
  }
  if (normalized.includes('harpa') || normalized.includes('harpa cristã')) {
    return 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=150&auto=format&fit=crop&q=80'; // warm classical acoustic vibe
  }
  if (normalized.includes('thalles roberto') || normalized.includes('talles roberto')) {
    return 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=150&auto=format&fit=crop&q=80'; // highly energetic stage presence
  }
  return null;
}

export function getArtistInitials(artist?: string) {
  if (!artist || artist.toLowerCase() === 'desconhecido') return '🎶';
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

export const artistImageCache = new Map<string, string | null>();

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
        console.warn("Imagem dinâmica não disponível:", err);
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

export function formatBirthDate(birthDateStr?: string) {
  if (!birthDateStr) return '';
  const parts = birthDateStr.split('-');
  if (parts.length < 3) return birthDateStr;
  const [_, month, day] = parts;
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
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

export function EasyBirthDatePicker({ value, onChange, variant = 'adaptive' }: EasyBirthDatePickerProps) {
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
    { value: '03', label: 'Março' },
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
        <option value="">Mês</option>
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

export function getStyledChars(line: string): StyledChar[] {
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

export function getStyledTextRuns(chars: StyledChar[]): StyledRun[] {
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

export const ChordButton = React.memo(function ChordButton({ 
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

export const PairedChordLyricsRow = React.memo(function PairedChordLyricsRow({ 
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

  // Identify bracketed or parenthesized tag ranges in chordLine e.g. [só guita], [N1], (2x)
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

export function isDynamicTerm(str: string): boolean {
  if (!str || !str.trim()) return false;
  return true; // Any string passed as dynamic tag is valid
}

export function getDynamicType(str: string): 'n1' | 'n2' | 'n3' | 'n4' | 'n5' | 'n6' | 'n7' | 'crescendo' | 'decrescendo' | 'acapella' | 'drums' | 'acoustic' | 'pausa' | 'keychange' | 'custom' {
  const l = str.toLowerCase().trim();

  // N7 Clímax
  if (l.includes('n7') || l.includes('clímax') || l.includes('climax') || l.includes('⚡') || l.includes('fff') || l.includes('fortíssimo') || l.includes('fortissimo') || l.includes('explosivo')) return 'n7';

  // N5 Meio Forte (Checked before N6 so 'meio forte' isn't captured by N6 'forte')
  if (l.includes('n5') || l.includes('🌕') || l === 'mf' || l.startsWith('mf ') || l.endsWith(' mf') || l.includes('mf -') || l.includes('mf •') || l.includes('meio-forte') || l.includes('meio forte') || l.includes('mezzo-forte') || l.includes('mezzo forte')) return 'n5';

  // N6 Forte
  if (l.includes('n6') || l.includes('🔥') || l === 'f' || l.startsWith('f ') || l.endsWith(' f') || l.includes('f -') || l.includes('f •') || (l.includes('forte') && !l.includes('meio') && !l.includes('mezzo'))) return 'n6';

  // N4 Moderado
  if (l.includes('n4') || l.includes('🌖') || l.includes('moderado')) return 'n4';

  // N3 Suave
  if (l.includes('n3') || l.includes('🌗') || l === 'mp' || l.startsWith('mp ') || l.endsWith(' mp') || l.includes('mp -') || l.includes('mp •') || l.includes('meio-suave') || l.includes('meio suave') || (l.includes('suave') && !l.includes('bem suave'))) return 'n3';

  // N2 Bem Suave
  if (l.includes('n2') || l.includes('🌘') || l.includes('bem suave') || l.includes('toque leve') || l === 'p' || l.startsWith('p ') || l.endsWith(' p') || l.includes('p -') || l.includes('p •') || (l.includes('piano') && !l.includes('teclado') && !l.includes('piano/pad'))) return 'n2';

  // N1 Sutil
  if (l.includes('n1') || l.includes('🌑') || l.includes('sutil') || l.includes('quase silêncio') || l.includes('quase silencio') || l.includes('sussurro') || l === 'pp' || l.startsWith('pp ') || l.endsWith(' pp') || l.includes('pp -') || l.includes('pp •') || l.includes('pianíssimo') || l.includes('pianissimo')) return 'n1';

  // Indicators
  if (l.includes('pausa') || l.includes('pause') || l.includes('stop') || l.includes('parada') || l.includes('corta') || l.includes('🛑') || l.includes('⏱️') || l.includes('⏸️')) return 'pausa';
  if (l.includes('crescendo') || l.includes('subindo') || l.includes('↗')) return 'crescendo';
  if (l.includes('decrescendo') || l.includes('diminuindo') || l.includes('baixando') || l.includes('↘')) return 'decrescendo';
  if (l.includes('acapella') || l.includes('vozes') || l.includes('🎤')) return 'acapella';
  if (l.includes('bateria') || l.includes('percussão') || l.includes('groove') || l.includes('bumbo') || l.includes('🥁')) return 'drums';
  if (l.includes('violão') || l.includes('violao') || l.includes('marcando') || l.includes('🎸')) return 'acoustic';
  if (l.includes('sobe o tom') || l.includes('sobe tom') || l.includes('subida de tom') || l.includes('mudança de tom') || l.includes('mudanca de tom') || l.includes('modulação') || l.includes('modulacao') || l.includes('📈')) return 'keychange';

  return 'custom';
}

export function formatDynamicLabel(raw: string, type: string): string {
  if (type === 'custom') return raw;
  if (raw.length > 3 && type !== 'pausa') return raw;
  switch (type) {
    case 'n1': return 'N1 🌑 Sutil';
    case 'n2': return 'N2 🌘 Bem Suave';
    case 'n3': return 'N3 🌗 Suave';
    case 'n4': return 'N4 🌖 Moderado';
    case 'n5': return 'N5 🌕 Meio Forte';
    case 'n6': return 'N6 🔥 Forte';
    case 'n7': return 'N7 ⚡ Clímax';
    case 'crescendo': return 'Crescendo ↗';
    case 'decrescendo': return 'Decrescendo ↘';
    case 'pausa': return raw.includes('🛑') || raw.includes('Pausa') ? raw : 'Pausa 🛑';
    case 'acapella': return 'Acapella 🎤';
    case 'drums': return 'Só Bateria 🥁';
    case 'acoustic': return 'Violão Marcando 🎸';
    case 'keychange': return 'Sobe o Tom 📈';
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

  // N7 Clímax
  if (clean.includes('n7') || clean.includes('clímax') || clean.includes('climax') || clean.includes('⚡') || clean.includes('fff') || clean.includes('fortíssimo') || clean.includes('fortissimo') || clean.includes('explosivo')) {
    return {
      raw: input,
      type: 'n7',
      levelTag: 'N7',
      emoji: '⚡',
      title: 'N7 ⚡ Clímax',
      subHeader: 'Nível 7 - Explosão Sonora',
      description: 'Máximo da música! Explosão sonora, adoração intensa e celebração total com a igreja.',
      badgeClasses: 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 text-white border-rose-300/50 shadow-xs shadow-rose-500/20 ring-1 ring-rose-400/30 font-black uppercase tracking-wider',
      iconType: 'n7'
    };
  }

  // N5 Meio Forte (Checked before N6 so 'meio forte' isn't matched to N6 'forte')
  if (clean.includes('n5') || clean.includes('🌕') || clean === 'mf' || clean.startsWith('mf ') || clean.endsWith(' mf') || clean.includes('meio-forte') || clean.includes('meio forte') || clean.includes('mezzo-forte')) {
    return {
      raw: input,
      type: 'n5',
      levelTag: 'N5',
      emoji: '🌕',
      title: 'N5 🌕 Meio Forte',
      subHeader: 'Nível 5 - Energia Alta',
      description: 'Energia alta, ritmo firme e presença harmoniosa, ainda com espaço para crescer ao clímax.',
      badgeClasses: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-300/40 shadow-xs shadow-amber-500/20 font-black uppercase tracking-wider',
      iconType: 'n5'
    };
  }

  // N6 Forte
  if (clean.includes('n6') || clean.includes('🔥') || clean === 'f' || clean.startsWith('f ') || clean.endsWith(' f') || clean.includes('f -') || (clean.includes('forte') && !clean.includes('meio') && !clean.includes('mezzo'))) {
    return {
      raw: input,
      type: 'n6',
      levelTag: 'N6',
      emoji: '🔥',
      title: 'N6 🔥 Forte',
      subHeader: 'Nível 6 - Grande Intensidade',
      description: 'Grande intensidade, presença total de instrumentos e vocais firmes no refrão.',
      badgeClasses: 'bg-gradient-to-r from-orange-600 to-red-500 text-white border-orange-400/40 shadow-xs shadow-orange-500/20 font-black uppercase tracking-wider',
      iconType: 'n6'
    };
  }

  // N4 Moderado
  if (clean.includes('n4') || clean.includes('🌖') || clean.includes('moderado')) {
    return {
      raw: input,
      type: 'n4',
      levelTag: 'N4',
      emoji: '🌖',
      title: 'N4 🌖 Moderado',
      subHeader: 'Nível 4 - Dinâmica Média',
      description: 'Dinâmica equilibrada e ritmo constante, conduzindo a música com fluidez.',
      badgeClasses: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white border-sky-400/40 shadow-xs shadow-sky-500/20 font-black uppercase tracking-wider',
      iconType: 'n4'
    };
  }

  // N3 Suave
  if (clean.includes('n3') || clean.includes('🌗') || clean === 'mp' || clean.startsWith('mp ') || clean.endsWith(' mp') || clean.includes('meio-suave') || clean.includes('meio suave') || (clean.includes('suave') && !clean.includes('bem suave'))) {
    return {
      raw: input,
      type: 'n3',
      levelTag: 'N3',
      emoji: '🌗',
      title: 'N3 🌗 Suave',
      subHeader: 'Nível 3 - Suave',
      description: 'Começa a ganhar corpo. Arranjo contido e bem definido para o verso.',
      badgeClasses: 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-teal-400/40 shadow-xs shadow-teal-500/20 font-black uppercase tracking-wider',
      iconType: 'n3'
    };
  }

  // N2 Bem Suave
  if (clean.includes('n2') || clean.includes('🌘') || clean.includes('bem suave') || clean.includes('toque leve') || clean === 'p' || clean.startsWith('p ') || clean.endsWith(' p')) {
    return {
      raw: input,
      type: 'n2',
      levelTag: 'N2',
      emoji: '🌘',
      title: 'N2 🌘 Bem Suave',
      subHeader: 'Nível 2 - Bem Suave',
      description: 'Toque leve, sem peso.',
      badgeClasses: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/40 shadow-xs shadow-emerald-500/20 font-black uppercase tracking-wider',
      iconType: 'n2'
    };
  }

  // N1 Sutil
  if (clean.includes('n1') || clean.includes('🌑') || clean.includes('sutil') || clean.includes('quase silêncio') || clean.includes('quase silencio') || clean.includes('sussurro') || clean === 'pp' || clean.startsWith('pp ') || clean.endsWith(' pp') || clean.includes('pianíssimo') || clean.includes('pianissimo')) {
    return {
      raw: input,
      type: 'n1',
      levelTag: 'N1',
      emoji: '🌑',
      title: 'N1 🌑 Sutil',
      subHeader: 'Nível 1 - Sutil e Intimista',
      description: 'Piano/Pad, clima de contemplação. Intimista e muito suave para ministração.',
      badgeClasses: 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border-indigo-400/40 shadow-xs shadow-indigo-500/20 font-black uppercase tracking-wider',
      iconType: 'n1'
    };
  }

  // Pausa
  if (clean.includes('pausa') || clean.includes('pause') || clean.includes('stop') || clean.includes('parada') || clean.includes('corta') || clean.includes('🛑') || clean.includes('⏱️') || clean.includes('⏸️')) {
    return {
      raw: input,
      type: 'pausa',
      levelTag: 'Pausa',
      emoji: '🛑',
      title: 'Pausa',
      subHeader: 'Corte Seco / Silêncio',
      description: 'Interrupção momentânea do som, corte seco ou silêncio planejado para dar destaque à voz ou ministração.',
      badgeClasses: 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-400/50 shadow-xs shadow-rose-500/20 font-black uppercase tracking-wider',
      iconType: 'pausa'
    };
  }

  // Crescendo
  if (clean.includes('crescendo') || clean.includes('subindo') || clean.includes('↗')) {
    return {
      raw: input,
      type: 'crescendo',
      levelTag: 'Transição',
      emoji: '↗',
      title: 'Crescendo ↗',
      subHeader: 'Aumento de Intensidade',
      description: 'Aumentar a intensidade e o volume gradualmente ao longo das estrofes até o refrão ou ponte.',
      badgeClasses: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-400/40 shadow-xs shadow-violet-500/20 font-black uppercase tracking-wider',
      iconType: 'crescendo'
    };
  }

  // Decrescendo
  if (clean.includes('decrescendo') || clean.includes('diminuindo') || clean.includes('baixando') || clean.includes('↘')) {
    return {
      raw: input,
      type: 'decrescendo',
      levelTag: 'Transição',
      emoji: '↘',
      title: 'Decrescendo ↘',
      subHeader: 'Redução de Intensidade',
      description: 'Diminuir a intensidade e o volume gradualmente, suavizando o som da banda para um momento de oração.',
      badgeClasses: 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white border-amber-400/40 shadow-xs shadow-amber-500/20 font-black uppercase tracking-wider',
      iconType: 'decrescendo'
    };
  }

  // Acapella
  if (clean.includes('acapella') || clean.includes('vozes') || clean.includes('🎤')) {
    return {
      raw: input,
      type: 'acapella',
      levelTag: 'Arranjo',
      emoji: '🎤',
      title: 'Acapella 🎤',
      subHeader: 'Vozes em Destaque',
      description: 'Somente a voz ou vozes da igreja/equipe sem instrumentos, criando grande impacto congregacional.',
      badgeClasses: 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-cyan-400/40 shadow-xs shadow-cyan-500/20 font-black uppercase tracking-wider',
      iconType: 'acapella'
    };
  }

  // Drums / Bateria
  if (clean.includes('bateria') || clean.includes('percussão') || clean.includes('percussao') || clean.includes('groove') || clean.includes('bumbo') || clean.includes('🥁')) {
    return {
      raw: input,
      type: 'drums',
      levelTag: 'Arranjo',
      emoji: '🥁',
      title: 'Bateria / Groove 🥁',
      subHeader: 'Sustentação Rítmica',
      description: 'Liderança e condução da música conduzida pela bateria/percussão e bumbo.',
      badgeClasses: 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-400/40 shadow-xs shadow-orange-500/20 font-black uppercase tracking-wider',
      iconType: 'drums'
    };
  }

  // Violão Marcando / Acoustic
  if (clean.includes('violão') || clean.includes('violao') || clean.includes('marcando') || clean.includes('🎸')) {
    return {
      raw: input,
      type: 'acoustic',
      levelTag: 'Arranjo',
      emoji: '🎸',
      title: 'Violão Marcando 🎸',
      subHeader: 'Sustentação Harmônica no Violão',
      description: 'Execução do violão marcando os tempos da música ou mantendo a batida de condução para a equipe.',
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
      emoji: '🎸',
      title: `[${input.toUpperCase()}]`,
      subHeader: 'Guitarra em Destaque',
      description: `Indicação de dinâmica personalizada para a equipe: Execução direcionada para a guitarra (${input}).`,
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
      emoji: '🎹',
      title: `[${input.toUpperCase()}]`,
      subHeader: 'Teclado / Piano em Destaque',
      description: `Indicação de dinâmica personalizada para a equipe: Condução com teclado/piano/pad (${input}).`,
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
      emoji: '🎸',
      title: `[${input.toUpperCase()}]`,
      subHeader: 'Baixo em Destaque',
      description: `Indicação de dinâmica personalizada para a equipe: Condução da linha de baixo (${input}).`,
      badgeClasses: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 text-white border-purple-400/40 shadow-xs shadow-purple-500/20 font-black uppercase tracking-wider',
      iconType: 'custom'
    };
  }

  // Sobe o Tom / Modulação
  if (clean.includes('sobe o tom') || clean.includes('sobe tom') || clean.includes('subida de tom') || clean.includes('mudança de tom') || clean.includes('mudanca de tom') || clean.includes('modulação') || clean.includes('modulacao') || clean.includes('📈') || clean.includes('keychange')) {
    return {
      raw: input,
      type: 'keychange',
      levelTag: 'Modulação',
      emoji: '📈',
      title: 'Sobe o Tom 📈',
      subHeader: 'Subida de Tom / Modulação',
      description: 'Elevação da tonalidade da música (geralmente meio tom ou um tom acima) para aumentar a energia e intensidade no final.',
      badgeClasses: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 text-white border-fuchsia-400/40 shadow-xs shadow-fuchsia-500/20 font-black uppercase tracking-wider',
      iconType: 'keychange'
    };
  }

  // Custom Fallback for ANY bracket tag (e.g. [só guita], [entra banda], [suave])
  return {
    raw: input,
    type: 'custom',
    levelTag: 'Dinâmica',
    emoji: '🎵',
    title: `[${input.toUpperCase()}]`,
    subHeader: 'Dinâmica Customizada da Equipe',
    description: `Marcador de expressão e dinâmica personalizado (${input}) adaptado para a realidade do seu grupo de louvor.`,
    badgeClasses: 'bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white border-sky-400/40 shadow-xs shadow-sky-500/20 font-black uppercase tracking-wider',
    iconType: 'custom'
  };
}

export function DynamicExplanationModal({
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
            Entendi 👍
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function isSectionHeaderContent(str: string): boolean {
  if (!str) return false;
  const clean = str.trim().toLowerCase();
  return /^(intro|introdução|introducao|instr|instrumental|verso|verse|estrofe|coro|refrão|refrao|chorus|ponte|bridge|solo|interlúdio|interludio|interlude|outro|fim|final|tag|hook|ministração|ministracao|pré-refrão|pre-refrão|pre-refrao|pre-chorus|bis|coda|vocal|primeira parte|segunda parte|terceira parte|quarta parte|1ª parte|2ª parte|3ª parte|4ª parte|1a parte|2a parte|3a parte|4a parte|parte)(\s*[\d\wáéíóúÁÉÍÓÚa-zA-Z\-\_\&]+)*$/i.test(clean);
}

export function parseBracketSubContent(content: string): { isSection: boolean; sectionTitle: string; dynamicContent: string } | null {
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

export function parseLineSectionAndDynamics(line: string): ParsedSectionAndDynamics {
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

    const isDynamic = /^(n[1-7]|clímax|climax|suave|bem suave|sutil|moderado|meio forte|forte|pausa|stop|corta|parada|crescendo|decrescendo|acapella|só bateria|so bateria|violão marcando|violao marcando|sobe o tom|sobe tom|modulação|modulacao)/i.test(cleanLower);
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
    const isStandaloneSection = /^[\s\[\(\{\-]*([0-9]+\.?)?\s*(intro|introdução|introducao|instr|instrumental|verso|verse|estrofe|coro|refrão|refrao|chorus|ponte|bridge|solo|interlúdio|interludio|interlude|outro|fim|final|tag|hook|ministração|ministracao|pré-refrão|pre-refrão|pre-refrao|pre-chorus|bis|coda|vocal|primeira parte|segunda parte|terceira parte|quarta parte|1ª parte|2ª parte|3ª parte|4ª parte|1a parte|2a parte|3a parte|4a parte|parte)[\s0-9a-zA-ZáéíóúÁÉÍÓÚãõÃÕâêôÂÊÔçÇ\:\.\-\]\)\}]*$/i.test(rawTrimmed);
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

export function RenderTextWithInlineBadges({ text, baseClasses = '' }: { text: string; baseClasses?: string }) {
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
          if (contentLower.includes('pausa') || contentLower.includes('pause') || contentLower.includes('stop') || contentLower.includes('parada') || contentLower.includes('corta') || contentLower.includes('🛑') || contentLower.includes('⏱️') || contentLower.includes('⏸️')) {
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
                title="Clique para ver a explicação"
              >
                <Pause size={10} className="fill-white text-white shrink-0" />
                <span>{content.includes('🛑') || content.includes('Pausa') ? content : `Pausa 🛑`}</span>
              </button>
            );
          }

          // Repeat count e.g. (2x), (bis)
          if (/^([0-9]+x|bis)$/i.test(contentLower)) {
            return (
              <span key={pIdx} className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-600 to-amber-500 text-white border border-amber-400/40 align-middle shadow-xs">
                🔁 {content.toUpperCase()}
              </span>
            );
          }

          // Section headers in brackets [...] (e.g., [Intro], [Refrão], [Verso 1], [Verso 3])
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
                title="Clique para abrir o Guia de Seções e Dinâmicas"
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
                  title="Clique para abrir o Guia de Seções e Dinâmicas"
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
                  title={`Clique para ver a explicação da dinâmica: ${combined.dynamicContent}`}
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
                title={`Clique para ver a explicação da dinâmica: ${content}`}
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

export function RenderSectionOrDynamicsLine({ parsed }: { parsed: ParsedSectionAndDynamics }) {
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
            title="Clique para abrir o Guia de Seções e Dinâmicas"
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
            title="Clique para ver a explicação da dinâmica"
          >
            <span>{dyn.label}</span>
          </button>
        );
      })}

      {parsed.repeats.map((rep, i) => (
        <div key={`rep-${i}`} className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <span>🔁 {rep}</span>
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

export const SingleLineRow = React.memo(function SingleLineRow({ 
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

export const compressAndResizeImage = (file: File, maxWidth = 180, maxHeight = 180): Promise<string> => {
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

export const ConfirmButton = ({ 
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

export const formatDate = (date: any, options?: Intl.DateTimeFormatOptions) => {
  if (!date) return '';
  try {
    const d = date?.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return 'Data Inválida';
    return d.toLocaleDateString('pt-BR', options);
  } catch (e) {
    return 'Data Inválida';
  }
};

export const formatTime = (date: any) => {
  if (!date) return '';
  try {
    const d = date?.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '--:--';
  }
};

export const NotificationCenter = ({ notifications, onMarkRead, onDelete, onClearRead, onClose, isSidebarCollapsed }: { 
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
          <h3 className="text-base font-black text-text-main uppercase tracking-widest">Notificações</h3>
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
            <p className="text-xs font-black uppercase tracking-widest">Sem novas notificações</p>
          </div>
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="p-3 border-t border-border bg-black/5 dark:bg-white/5 text-center">
          <p className="text-[10px] font-black text-text-main/40 uppercase tracking-widest">Você está em dia!</p>
        </div>
      )}
    </motion.div>
  );
};

export const getLocalDateTimeString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const getLocalDateString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getFormatNameForPdf = (name: string) => {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.toLowerCase() === 'fran') return 'Franciane';
  if (/^fran\s+/i.test(trimmed)) {
    return trimmed.replace(/^fran\s+/i, 'Franciane ');
  }
  return name;
};

export const Button = ({ 
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

export const Card = ({ children, className, style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
  <div style={style} className={cn("bg-card border border-border rounded-2xl shadow-sm overflow-hidden relative", className)}>
    {children}
  </div>
);

export const Input = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props}
    className={cn(
      "w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand bg-black/25 text-text-main text-sm transition-all placeholder:text-text-muted/50 notranslate",
      props.className
    )}
    translate="no"
  />
);

export function normalizeSongTitle(str: string): string {
  if (!str) return "";
  return str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, "")     // Remove special characters
    .replace(/\s+/g, " ")           // Collapse multiple spaces
    .trim();
}

export function calculateSongMatchScore(normTitle: string, normSearch: string): number {
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

export function parseYoutubeVideoId(url: string): string | null {
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
    name: 'Geral / Padrão',
    icon: '⛪',
    bgDark: '',
    bgLight: '',
    badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30 dark:bg-zinc-500/10 dark:text-zinc-300 dark:border-zinc-500/20',
    text: 'text-zinc-400 dark:text-zinc-300',
    desc: 'Tema padrão do aplicativo (usa as cores do ministério)'
  },
  santa_ceia: {
    name: 'Culto de Santa Ceia',
    icon: '🍞🍷',
    bgDark: 'linear-gradient(135deg, #450a0a 0%, #2b0606 60%, #170000 100%)',
    bgLight: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
    badge: 'bg-red-900/25 text-red-300 border-red-700/40 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800/50',
    text: 'text-red-400 dark:text-red-300',
    desc: 'Vinho bordeaux nobre, pão e cálice em memorial sagrado de comunhão'
  },
  missions: {
    name: 'Culto de Missões',
    icon: '🌍',
    bgDark: 'linear-gradient(135deg, #064e3b 0%, #022c22 60%, #1c1917 100%)',
    bgLight: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    text: 'text-emerald-400 dark:text-emerald-300',
    desc: 'Vibe terra, verde floresta e marrom com foco global'
  },
  family: {
    name: 'Culto da Família',
    icon: '🏡',
    bgDark: 'linear-gradient(135deg, #7c2d12 0%, #431407 60%, #18181b 100%)',
    bgLight: 'linear-gradient(135deg, #c2410c 0%, #9a3412 100%)',
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20',
    text: 'text-orange-400 dark:text-orange-300',
    desc: 'Vibe calorosa em terracota, pêssego e cores acolhedoras'
  },
  easter: {
    name: 'Páscoa',
    icon: '✝️',
    bgDark: 'linear-gradient(135deg, #4c1d95 0%, #2e1065 60%, #0c0a09 100%)',
    bgLight: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20',
    text: 'text-purple-400 dark:text-purple-300',
    desc: 'Violeta imperial e toques de luz dourada da ressurreição'
  },
  christmas: {
    name: 'Natal',
    icon: '🎄',
    bgDark: 'linear-gradient(135deg, #052e16 0%, #18000a 60%, #021509 100%)',
    bgLight: 'linear-gradient(135deg, #15803d 0%, #14532d 100%)',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
    text: 'text-red-400 dark:text-red-300',
    desc: 'Verde pinheiro profundo, vinho e toques dourados'
  },
  palm_sunday: {
    name: 'Domingo de Ramos',
    icon: '🌿',
    bgDark: 'linear-gradient(135deg, #1e3a1e 0%, #142214 60%, #111827 100%)',
    bgLight: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
    badge: 'bg-green-500/15 text-green-400 border-green-500/30 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20',
    text: 'text-green-400 dark:text-green-300',
    desc: 'Verde folha fresco e tons dourados de areia'
  },
  youth: {
    name: 'Culto de Jovens',
    icon: '⚡',
    bgDark: 'linear-gradient(135deg, #1e1b4b 0%, #311042 60%, #030712 100%)',
    bgLight: 'linear-gradient(135deg, #4338ca 0%, #2563eb 100%)',
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20',
    text: 'text-indigo-400 dark:text-indigo-300',
    desc: 'Neon moderno violeta, índigo profundo e azul elétrico'
  },
  men: {
    name: 'Culto de Homens',
    icon: '🛡️',
    bgDark: 'linear-gradient(135deg, #172554 0%, #0f172a 60%, #020617 100%)',
    bgLight: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
    text: 'text-blue-400 dark:text-blue-300',
    desc: 'Tons de aço, cinza ardósia e azul oceano profundo'
  },
  women: {
    name: 'Culto de Mulheres',
    icon: '🌸',
    bgDark: 'linear-gradient(135deg, #831843 0%, #4c0519 60%, #18000a 100%)',
    bgLight: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
    text: 'text-rose-400 dark:text-rose-300',
    desc: 'Rosa bronze, malva e tons quentes florais'
  },
  prayer: {
    name: 'Oração',
    icon: '🙏',
    bgDark: 'linear-gradient(135deg, #1e1e38 0%, #111122 60%, #050510 100%)',
    bgLight: 'linear-gradient(135deg, #3730a3 0%, #312e81 100%)',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20',
    text: 'text-sky-400 dark:text-sky-300',
    desc: 'Azul crepúsculo sereno para introspecção e comunhão'
  },
  vigil: {
    name: 'Vigília',
    icon: '🌌',
    bgDark: 'linear-gradient(135deg, #090514 0%, #120b24 60%, #020105 100%)',
    bgLight: 'linear-gradient(135deg, #111827 0%, #030712 100%)',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    text: 'text-amber-400 dark:text-amber-300',
    desc: 'Céu noturno estrelado, obsidian escuro e fachos de luz ouro'
  }
};

export function getContrastColor(hex: string) {
  if (!hex) return '#ffffff';
  const color = hex.replace('#', '');
  if (color.length !== 6) return '#ffffff';
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 140 ? '#000000' : '#ffffff';
}




export function TimeSignatureDisplay({ value, className }: { value: string, className?: string }) {
  if (!value) return null;
  const parts = value.split('/');
  const num = parts[0] || '4';
  const den = parts[1] || '4';
  return (
    <div className={cn("inline-flex flex-col items-center justify-center font-serif leading-none select-none text-[10px] font-bold text-text-secondary dark:text-text-muted", className)}>
      <span className="border-b border-current px-0.5 pb-0.2">{num}</span>
      <span className="px-0.5 pt-0.2">{den}</span>
    </div>
  );
}


export interface LiturgyItem {
  id: string;
  type?: 'song' | 'moment' | 'observation' | 'media';
  title: string;
  duration?: number;
  notes?: string;
  songId?: string;
  key?: string;
  artist?: string;
  assignedVocalistIds?: string[];
  assignedVocalistNames?: string[];
  [key: string]: any;
}

export interface MomentGroup {
  moment: string;
  items: { item: LiturgyItem; originalIndex: number }[];
}
