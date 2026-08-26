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

function formatBirthDate(birthDateStr?: string) {
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

function isDynamicTerm(str: string): boolean {
  if (!str || !str.trim()) return false;
  return true; // Any string passed as dynamic tag is valid
}

function getDynamicType(str: string): 'n1' | 'n2' | 'n3' | 'n4' | 'n5' | 'n6' | 'n7' | 'crescendo' | 'decrescendo' | 'acapella' | 'drums' | 'acoustic' | 'pausa' | 'keychange' | 'custom' {
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

function formatDynamicLabel(raw: string, type: string): string {
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
            Entendi 👍
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function isSectionHeaderContent(str: string): boolean {
  if (!str) return false;
  const clean = str.trim().toLowerCase();
  return /^(intro|introdução|introducao|instr|instrumental|verso|verse|estrofe|coro|refrão|refrao|chorus|ponte|bridge|solo|interlúdio|interludio|interlude|outro|fim|final|tag|hook|ministração|ministracao|pré-refrão|pre-refrão|pre-refrao|pre-chorus|bis|coda|vocal|primeira parte|segunda parte|terceira parte|quarta parte|1ª parte|2ª parte|3ª parte|4ª parte|1a parte|2a parte|3a parte|4a parte|parte)(\s*[\d\wáéíóúÁÉÍÓÚa-zA-Z\-\_\&]+)*$/i.test(clean);
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
    if (isNaN(d.getTime())) return 'Data Inválida';
    return d.toLocaleDateString('pt-BR', options);
  } catch (e) {
    return 'Data Inválida';
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
    name: 'Geral / Padrão',
    icon: '⛪',
    bgDark: '',
    bgLight: '',
    badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30 dark:bg-zinc-500/10 dark:text-zinc-300 dark:border-zinc-500/20',
    text: 'text-zinc-400 dark:text-zinc-300',
    desc: 'Tema padrão do aplicativo (usa as cores do ministério)'
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
    "CRIAÇÃO/ADORAÇÃO",
    "QUEDA/CONFISSÃO",
    "REDENÇÃO/AÇÃO DE GRAÇAS",
    "CONSUMAÇÃO/RESPOSTA"
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

  // Busca o culto alvo com uma liturgia ou setlist (prioriza o mais próximo de agora, futuro ou passado recente)
  const targetService = useMemo(() => {
    if (services.length === 0) return null;
    
    const now = new Date();
    // Consideramos "hoje" como o dia inteiro para não perder o culto que está acontecendo
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
    
    // 1. Tenta encontrar o culto MAIS PRÓXIMO no futuro ou hoje
    const futureService = servicesWithDates.find(s => s._actualDate >= startOfToday);
    if (futureService) return futureService;

    // 2. Se não houver futuros, pega o ÚLTIMO que aconteceu no passado,
    // mas apenas se tiver ocorrido há menos de 24 horas (como solicitado pelo usuário)
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
      alert("Esta música já está agendada para este culto.");
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
      console.error("Erro ao adicionar música ao culto:", error);
      alert("Não foi possível adicionar a música.");
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
      console.error("Erro ao remover música do culto:", error);
      alert("Não foi possível remover a música.");
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
      console.error("Erro ao ordenar músicas:", error);
      alert("Não foi possível salvar a nova ordem.");
    }
  };

  const liturgySongIds = useMemo(() => {
    return getServiceSongIds(targetService, songs);
  }, [targetService, songs]);

  const filteredSongs = useMemo(() => {
    if (showLiturgySongs) {
      // Mapeia os IDs para os objetos reais das músicas mantendo a ORDEM da liturgia
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
      setAutofillError("Por favor, cole um link válido do Cifra Club primeiro.");
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
        throw new Error(errData.details || errData.error || "Não foi possível importar a cifra do Cifra Club.");
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
      setAutofillSuccess(`Música "${data.title}" importada e preenchida com sucesso direto do Cifra Club! Abas de cifra e letra também atualizadas.`);
    } catch (error: any) {
      console.error("Erro ao importar do Cifra Club:", error);
      setAutofillError(error.message || "Erro de conexão ao realizar a importação direta do Cifra Club. Verifique o link e tente novamente.");
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
      console.error("Erro ao atualizar músicas favoritas:", error);
      handleFirestoreError(error, OperationType.WRITE, `members/${user.uid}`);
    }
  };

  const handleAddSong = async () => {
    if (!newSong.title) {
      alert('Por favor, insira pelo menos o título da música.');
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
          '🎵 Nova Música Adicionada',
          `A música "${newSong.title}"${newSong.artist ? ` (por ${newSong.artist})` : ''} foi cadastrada no repertório!`,
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
      alert('Erro ao cadastrar música. Verifique sua conexão ou permissões.');
      handleFirestoreError(error, OperationType.CREATE, songPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMedia = (type: 'audio' | 'files') => {
    if (!tempLink.url) return;
    const name = tempLink.name || (type === 'audio' ? 'Guia de Áudio' : 'Arquivo');
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
      alert("Para melhor desempenho e limite de armazenamento, arquivos diretos devem ter até 800KB. Para áudios mais longos, recomendamos informar um link do Google Drive ou OneDrive no campo de link.");
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
            <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">Repertório Musical</h1>
            <p className="text-text-main text-xs md:text-sm font-medium mb-4">Gerencie letras, cifras e transposição.</p>
            
            <div className="w-full max-w-xl text-left mx-auto">
              <ContextualHelp 
                id="songs"
                title="Repertório: Como encontrar e estudar?"
                description="O Repertório reúne as letras, tons, bpm, guias de áudio e arquivos complementares de todas as músicas cadastradas na igreja."
                steps={[
                  "Use o campo de busca no cabeçalho para filtrar músicas por título, artista ou fragmento de letra.",
                  "Toque na estrela para adicionar músicas aos seus favoritos e acessá-las de forma imediata.",
                  "Abra uma música para visualizar a cifra dinâmica, onde você pode transpor o tom e usar a rolagem automática.",
                  "Assista ao vídeo ou ouça os guias de áudio oficiais anexados pelo seu líder para alinhar a versão do ensaio.",
                  "PEDAL BLUETOOTH & MIDI: Conecte pedais (AirTurn, PageTurner, Boss) ou footswitches MIDI para avançar páginas ou controlar a rolagem sem usar as mãos no culto."
                ]}
                tip="Toque no ícone de microfone ao lado da busca para realizar pesquisa por comando de voz! É super rápido!"
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
                {showLiturgySongs ? "Ver Todas as Músicas" : "Músicas do Culto"}
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
                <Plus size={16} className="sm:w-[18px] sm:h-[18px]" /> Cadastrar Música
              </Button>
            )}
          </div>
        </div>

        {showLiturgySongs && targetService && (
          <div className="bg-brand/5 border border-brand/20 rounded-xl p-3 sm:p-6 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-brand uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-1">Músicas Agendadas para:</p>
                  <h2 className="text-lg sm:text-2xl font-black text-text-main tracking-tight">{targetService.title}</h2>
                  <p className="text-[10px] sm:text-xs text-text-main/80 font-bold mt-1 uppercase tracking-widest">{formatDate(targetService.date)} • {formatTime(targetService.date)}</p>
                  {liturgySongIds.length === 0 && (
                    <p className="text-[10px] sm:text-xs text-red-500 font-bold mt-2 italic">Atenção: Nenhuma música vinculada nesta liturgia.</p>
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
                 <p className="text-[9px] sm:text-[10px] text-text-muted italic flex-1 min-w-[200px]">Cadastre links do YouTube nas músicas para liberar a playlist do culto.</p>
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
                   <Plus size={12} /> Adicionar Música
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
                placeholder={isListening ? "Ouvindo... fale agora" : "Buscar por título ou artista..."} 
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
                  title={isListening ? "Parar de ouvir" : "Pesquisar por voz (Falar nome da música)"}
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
                    <span>Modo de Voz Ativo: Fale o título ou o nome do artista claramente...</span>
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
                          <span className="text-brand mr-1 sm:mr-1.5 font-black">{songIdx + 1}ª</span>
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
                          title="Confirmar remoção"
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
                        title="Remover música do culto"
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
            <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-2">Nenhuma música encontrada</h3>
            {showLiturgySongs ? (
              <div className="max-w-md mx-auto">
                <p className="text-xs text-text-main/70 mb-6 font-bold leading-relaxed">
                  Você está visualizando apenas as <span className="text-brand">Músicas do Próximo Culto</span>, mas nenhuma música foi vinculada à liturgia ou setlist deste culto ainda.
                </p>
                <button
                  type="button"
                  onClick={() => setShowLiturgySongs(false)}
                  className="px-6 py-3 bg-brand text-brand-text rounded-xl font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand/20 cursor-pointer"
                >
                  Ver Todas as Músicas do Repertório
                </button>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <p className="text-xs text-text-main/70 font-bold leading-relaxed">
                  {searchTerm || selectedCategory || selectedArtist ? (
                    "Nenhuma música do seu repertório corresponde aos filtros selecionados. Tente limpar os termos digitados."
                  ) : (
                    "Seu banco de dados de músicas está vazio. Clique no botão 'Cadastrar Música' para adicionar o primeiro louvor!"
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
                  <h2 className="text-sm font-black text-text-main uppercase tracking-wider">Adicionar Música ao Culto</h2>
                  <p className="text-[10px] text-text-muted font-bold mt-0.5 uppercase tracking-wider">Selecione louvores do repertório para este culto</p>
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
                    placeholder="Pesquisar por título ou artista..."
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
                    <p className="text-xs font-black uppercase tracking-wider">Nenhuma música encontrada</p>
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
                <h2 className="text-lg sm:text-xl font-bold text-text-main">Cadastrar Música</h2>
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
                <ModalTab label="Mídia" active={modalTab === 'media'} onClick={() => setModalTab('media')} />
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
                        <label className="text-xs font-black text-text-main uppercase tracking-widest">Título da Música *</label>
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
                        <label className="text-xs font-black text-text-main uppercase tracking-widest">Categoria Teológica</label>
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
                        <label className="text-xs font-black text-text-main uppercase tracking-widest">Capotraste (Posição no Braço)</label>
                        <select 
                          value={newSong.capo || ''} 
                          onChange={e => setNewSong({...newSong, capo: e.target.value})} 
                          className="h-12 w-full bg-black/5 dark:bg-white/5 border border-border text-text-main rounded-xl px-3 font-bold text-sm outline-none cursor-pointer"
                        >
                          <option value="" className="bg-surface text-text-main">Sem Capo (Afinação Padrão)</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(fret => (
                            <option key={fret} value={fret + 'ª casa'} className="bg-surface text-text-main">
                              Capo na {fret}ª Casa
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-text-main uppercase tracking-widest">Link do Youtube (Referência)</label>
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
                             <p className="font-bold text-text-main">Próximo Passo:</p>
                             <p className="text-sm text-text-muted">Adicionar a letra da música</p>
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
                          <Sparkles size={12} /> ✨ Extrair da Cifra
                        </button>
                      )}
                    </div>
                    <textarea 
                      className="w-full h-64 border border-border bg-black/5 dark:bg-white/5 rounded-lg p-3 focus:ring-2 focus:ring-brand/20 focus:border-brand text-text-main text-sm leading-relaxed"
                      placeholder="Cole apenas a letra da canção aqui..."
                      value={newSong.lyrics}
                      onChange={e => setNewSong({...newSong, lyrics: e.target.value})}
                    />
                    <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-border">
                      <Button onClick={() => setModalTab('info')} variant="ghost" className="text-text-muted transition-colors hover:text-text-main"><ChevronLeft size={18}/> Voltar</Button>
                      <Button onClick={() => setModalTab('chords')} variant="secondary" className="px-6 shadow-sm">Próximo: Cifra <ChevronRight size={18}/></Button>
                    </div>
                  </div>
                )}

                {modalTab === 'chords' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Letra com Cifras</label>
                    <textarea 
                      className="w-full h-64 border border-border bg-black/5 dark:bg-white/5 rounded-lg p-3 focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono text-text-main text-sm leading-relaxed"
                      placeholder="Ex:\nC            G\nGrandioso és Tu..."
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
                      <Button onClick={() => setModalTab('media')} variant="secondary" className="px-6 shadow-sm">Próximo: Mídia <ChevronRight size={18}/></Button>
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
                      <p className="text-[10px] font-black text-text-main uppercase tracking-widest pl-1">Links e Áudio</p>
                      
                      {/* Google Drive Link directly */}
                      <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-2">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Link do Google Drive (Guias de Áudio)</label>
                        <Input 
                          placeholder="Cole o link do Google Drive para os guias de áudio"
                          value={newSong.driveAudioLink || ''}
                          onChange={e => setNewSong({...newSong, driveAudioLink: e.target.value})}
                          className="h-11 bg-black/5 dark:bg-white/5 border border-border text-text-main"
                        />
                        <p className="text-[9px] text-text-muted italic">Espaço opcional para colocar pasta/link do drive com guias de áudio.</p>
                      </div>

                      <div className="p-6 border-2 border-dashed border-border rounded-2xl bg-black/5 dark:bg-white/5 space-y-4">
                         <div className="flex flex-col items-center text-center gap-2 mb-2">
                            <Volume2 size={32} className="text-text-muted opacity-30" />
                            <p className="font-bold text-text-main text-sm">Adicionar Guia ou Referência</p>
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
                                placeholder="Link/URL do Áudio" 
                                value={tempLink.url}
                                onChange={e => setTempLink({...tempLink, url: e.target.value})}
                                className="h-11"
                              />
                              <Button onClick={() => addMedia('audio')} disabled={!tempLink.url} className="shrink-0 font-bold px-6">Adicionar Link</Button>
                            </div>

                            <div className="flex items-center gap-2 my-1">
                              <div className="h-px bg-border/60 flex-1" />
                              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">ou envie um arquivo de áudio (MP3)</span>
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
                              <span>Anexar Arquivo MP3 / Áudio</span>
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
                        <p className="text-[9px] text-text-muted italic">Espaço opcional para colocar pasta/link do drive com partituras ou outros arquivos.</p>
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
      console.error("Erro ao atualizar músicas favoritas:", error);
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

  // Gestos de Deslize (Swipe) para avançar/voltar cifras no Modo Foco
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

    // Reconhecer deslize horizontal nítido:
    // - Deslocamento horizontal mínimo de 50px
    // - Movimento predominantemente horizontal (deltaX > 1.4x deltaY para não conflitar com rolagem vertical)
    // - Concluído em menos de 800ms
    if (Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4 && deltaTime < 800) {
      if (deltaX < 0) {
        // Deslizar para a Esquerda -> Avançar para a Próxima Música
        if (hasNextSong && nextSong) {
          handleSongSwitch(nextSong);
        }
      } else {
        // Deslizar para a Direita -> Voltar para a Música Anterior
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
              <Zap size={10} className="text-yellow-500 animate-pulse" /> {isFromLiturgy ? "Roteiro do Culto" : "Repertório"}
            </span>
            <span className={cn("font-mono text-[9px] font-black uppercase px-1.5 py-0.5 rounded", isStageMode ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-black/10 dark:bg-white/10 text-text-main dark:text-zinc-200")}>
              Música {currentNum} de {totalNum}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
            {/* Botão Anterior */}
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

            {/* Botão Próximo */}
            {hasNextSong && nextSong && (
               <button
                 type="button"
                 onClick={() => handleSongSwitch(nextSong)}
                 className="group flex items-center justify-end text-right gap-2.5 py-1.5 px-3 rounded-xl border border-brand/10 bg-gradient-to-r from-brand to-cyan-500 hover:brightness-110 text-white font-black transition-all active:scale-95 cursor-pointer w-full sm:col-start-2 shadow-lg shadow-brand/15"
               >
                 <div className="min-w-0 text-right flex-1 select-none">
                   <span className="block text-[11px] font-black text-white/80 uppercase tracking-widest leading-none mb-0.5">Próxima</span>
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
        throw new Error(errorData.error || "Erro desconhecido na análise.");
      }

      const data = await response.json();
      
      // Save it automatically to Firestore
      await updateDoc(doc(db, 'songs', song.id), {
        bibleReferences: data
      });
      
    } catch (err: any) {
      console.error("Error analyzing bible references:", err);
      setBibleAnalysisError(err.message || "Erro ao gerar análise bíblica.");
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
        throw new Error(errorData.error || "Erro desconhecido ao obter sugestões.");
      }

      const data = await response.json();
      
      // Save it automatically to Firestore
      await updateDoc(doc(db, 'songs', song.id), {
        themeSuggestions: data
      });
      
    } catch (err: any) {
      console.error("Error generating theme suggestions:", err);
      setThemeSuggestionsError(err.message || "Erro ao gerar sugestões de tema.");
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
        throw new Error(errorData.error || "Erro desconhecido na análise harmônica.");
      }

      const data = await response.json();
      
      // Save it automatically to Firestore
      await updateDoc(doc(db, 'songs', song.id), {
        harmonyAnalysis: data
      });
      
    } catch (err: any) {
      console.error("Error analyzing harmony:", err);
      setHarmonyAnalysisError(err.message || "Erro ao gerar análise harmônica.");
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
      setAutofillError("Por favor, cole um link válido do Cifra Club primeiro.");
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
        throw new Error(errData.details || errData.error || "Não foi possível importar a cifra do Cifra Club.");
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
      setAutofillSuccess(`Música "${data.title}" importada e preenchida com sucesso direto do Cifra Club! Abas de cifra e letra também atualizadas.`);
    } catch (error: any) {
      console.error("Erro ao importar do Cifra Club:", error);
      setAutofillError(error.message || "Erro de conexão ao realizar a importação direta do Cifra Club. Verifique o link e tente novamente.");
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
    setIsEditing(false); // Sair do modo edição ao trocar de música
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
    { label: 'Pré-Refrão', tag: 'Pré-Refrão' },
    { label: 'Refrão', tag: 'Refrão' },
    { label: 'Ponte', tag: 'Ponte' },
    { label: 'Solo', tag: 'Solo' },
    { label: 'Instrumental', tag: 'Instrumental' },
    { label: 'Ministração', tag: 'Ministração' },
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
    const customTag = window.prompt("Digite a marcação de dinâmica personalizada (ex: só guita, teclado e pad, entra banda, base violão):", "só guita");
    if (customTag && customTag.trim()) {
      handleInsertDynamicsTag(customTag.trim(), target);
    }
  };
  const categories = [
    "CRIAÇÃO/ADORAÇÃO",
    "QUEDA/CONFISSÃO",
    "REDENÇÃO/AÇÃO DE GRAÇAS",
    "CONSUMAÇÃO/RESPOSTA"
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
      triggerPedalVisualFeedback('B', 'Avançar Página ▼');
      if (footswitchConfig.autoNextSongAtBottom && maxScroll > 0 && currentTop >= maxScroll - 45 && nextSong && onSelectSong) {
        onSelectSong(nextSong);
        return;
      }
      const step = (elem ? elem.clientHeight : window.innerHeight) * 0.65;
      container.scrollBy({ top: step, behavior: 'smooth' });
    } else if (action === 'prevPage') {
      triggerPedalVisualFeedback('A', 'Voltar Página ▲');
      const step = (elem ? elem.clientHeight : window.innerHeight) * 0.65;
      container.scrollBy({ top: -step, behavior: 'smooth' });
    } else if (action === 'toggleAutoScroll') {
      triggerPedalVisualFeedback('C', 'Auto-Scroll ▶️/⏸️');
      setIsAutoScrolling(prev => !prev);
    } else if (action === 'nextSong') {
      triggerPedalVisualFeedback('D', 'Próxima Música ⏭️');
      if (nextSong && onSelectSong) {
        onSelectSong(nextSong);
      }
    } else if (action === 'prevSong') {
      triggerPedalVisualFeedback('A', 'Música Anterior ⏮️');
      if (prevSong && onSelectSong) {
        onSelectSong(prevSong);
      }
    } else if (action === 'speedUp') {
      triggerPedalVisualFeedback('B', 'Velocidade + ⚡');
      setScrollSpeed(prev => Math.min(2.0, parseFloat((prev + 0.1).toFixed(2))));
    } else if (action === 'speedDown') {
      triggerPedalVisualFeedback('A', 'Velocidade - 🐢');
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
        triggerPedalVisualFeedback('B', 'Pedal B: Avançar Página ▼');
        if (showFootswitchModal) {
          triggerFootswitchToast('Pedal B detectado com sucesso! (Avançar Página ▼)');
          return;
        }
        executeFootswitchAction('nextPage');
        return;
      }
      if (matchesKey('prevPage', keyName, e)) {
        e.preventDefault();
        triggerPedalVisualFeedback('A', 'Pedal A: Voltar Página ▲');
        if (showFootswitchModal) {
          triggerFootswitchToast('Pedal A detectado com sucesso! (Voltar Página ▲)');
          return;
        }
        executeFootswitchAction('prevPage');
        return;
      }
      if (matchesKey('toggleAutoScroll', keyName, e)) {
        e.preventDefault();
        triggerPedalVisualFeedback('C', 'Pedal C: Auto-Scroll ▶️/⏸️');
        if (showFootswitchModal) {
          triggerFootswitchToast('Pedal C detectado com sucesso! (Auto-Scroll)');
          return;
        }
        executeFootswitchAction('toggleAutoScroll');
        return;
      }
      if (matchesKey('nextSong', keyName, e)) {
        e.preventDefault();
        triggerPedalVisualFeedback('D', 'Pedal D: Próxima Música ⏭️');
        if (showFootswitchModal) {
          triggerFootswitchToast('Pedal D detectado com sucesso! (Próxima Música ⏭️)');
          return;
        }
        executeFootswitchAction('nextSong');
        return;
      }
      if (matchesKey('prevSong', keyName, e)) {
        e.preventDefault();
        triggerPedalVisualFeedback('A', 'Pedal: Música Anterior ⏮️');
        executeFootswitchAction('prevSong');
        return;
      }
      if (matchesKey('speedUp', keyName, e)) {
        e.preventDefault();
        triggerPedalVisualFeedback('B', 'Pedal: Velocidade + ⚡');
        executeFootswitchAction('speedUp');
        return;
      }
      if (matchesKey('speedDown', keyName, e)) {
        e.preventDefault();
        triggerPedalVisualFeedback('A', 'Pedal: Velocidade - 🐢');
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
          triggerPedalVisualFeedback('A', 'MIDI Pedal A: Voltar Página ▲');
          if (showFootswitchModal) {
            triggerFootswitchToast('MIDI Pedal A detectado! (Voltar Página ▲)');
            return;
          }
          executeFootswitchAction('prevPage');
          return;
        }
        // Pedal B -> nextPage
        if (midiKey === 'MIDI:192:1' || data1 === 49 || data1 === 2 || data1 === 62) {
          triggerPedalVisualFeedback('B', 'MIDI Pedal B: Avançar Página ▼');
          if (showFootswitchModal) {
            triggerFootswitchToast('MIDI Pedal B detectado! (Avançar Página ▼)');
            return;
          }
          executeFootswitchAction('nextPage');
          return;
        }
        // Pedal C -> toggleAutoScroll
        if (midiKey === 'MIDI:192:2' || data1 === 50 || data1 === 3 || data1 === 64) {
          triggerPedalVisualFeedback('C', 'MIDI Pedal C: Auto-Scroll ▶️/⏸️');
          if (showFootswitchModal) {
            triggerFootswitchToast('MIDI Pedal C detectado! (Auto-Scroll)');
            return;
          }
          executeFootswitchAction('toggleAutoScroll');
          return;
        }
        // Pedal D -> nextSong
        if (midiKey === 'MIDI:192:3' || data1 === 51 || data1 === 4 || data1 === 65 || data1 === 67) {
          triggerPedalVisualFeedback('D', 'MIDI Pedal D: Próxima Música ⏭️');
          if (showFootswitchModal) {
            triggerFootswitchToast('MIDI Pedal D detectado! (Próxima Música ⏭️)');
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
      console.error("Erro na análise automática de BPM do áudio:", err);
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
      audioRef.current.play().catch(err => console.error("Erro ao reproduzir áudio:", err));
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
      alert("Para este protótipo, o arquivo deve ter menos de 800KB. Em produção, usaríamos Firebase Storage.");
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
    const name = tempLink.name || (type === 'audio' ? 'Guia de Áudio' : 'Arquivo');
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
      setTimeSigFeedback('Compasso salvo no Firebase como padrão!');
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
      setBpmFeedback('BPM salvo no Firebase como padrão!');
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
    doc.text(editedSong.title || 'Música Sem Título', margin, y);
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
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Guias de Áudio</span>
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
                                title="Análise Inteligente de BPM"
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
          {/* Informações da Música */}
          <div className="min-w-0 flex items-center gap-2 shrink truncate">
            <span className="text-[8px] sm:text-[9px] font-black tracking-widest bg-brand/10 text-brand px-1.5 py-0.5 rounded border border-brand/20 uppercase shrink-0">MODO CULTO</span>
            <h2 className={cn("text-xs sm:text-sm font-black truncate max-w-[120px] sm:max-w-[200px]", isStageMode ? "text-white" : "text-text-main")} title={editedSong.title}>{editedSong.title}</h2>
            <span className={cn("text-[10px] hidden lg:inline truncate", isStageMode ? "text-amber-300 font-bold" : "text-text-muted")}>
              • Tom: <span className="font-bold text-brand">{currentKey}{isCapoEnabled && shapeKey && shapeKey !== currentKey ? ` (${shapeKey})` : ''}</span> • BPM: {editedSong.bpm || 'Orig'}
            </span>
          </div>

          {/* Botões de Ação e Visualização Alinhados numa Única Linha */}
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
                        ✨ Auto Inteligente
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

        {/* Conteúdo Principal (Cifra ou Letra) */}
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
              // Renderização elegante da Cifra
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
              // Renderização da Letra
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

            {/* Botão de Sair no final da Cifra / Modo Foco */}
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

        {/* Popover Flutuante de Diagrama Rápido de Acorde no Modo Foco */}
        <QuickChordPopover
          chord={popoverChord}
          onClose={() => setPopoverChord(null)}
          availableChords={availableChordsInSong}
          onSelectChord={(chord) => setActiveChordInDict(chord, true)}
          songKey={currentKey}
        />

        {/* Modal Guia de Dinâmicas & Expressão Musical no Modo Foco */}
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
                  placeholder="Título da música"
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
                      <option key={fret} value={fret + 'ª casa'} className="bg-surface text-text-main">
                        Capo: {fret}ª Casa
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
             {/* Modo Foco (FOCO) - Primeiro Botão da Esquerda */}
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

             {/* Caixa de Opções e Seleção do Capo */}
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
                 title="Abrir Caixa de Opções do Capo (1ª a 12ª Casa)"
               >
                 {isCapoEnabled && capoSemitones > 0 ? (
                   <>
                     <span className="leading-tight font-black">{capoSemitones}ª Casa</span>
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

             {/* Visão Harmônica por Função / Graus */}
             <div className="flex items-end gap-2 flex-wrap justify-center">
               {/* Container da Visão Harmônica (Título + Caixa de Botões de Visão Harmônica) */}
               <div className="flex flex-col items-center">
                 <span className="text-[10px] sm:text-[11px] text-brand font-black uppercase tracking-widest mb-1 text-center">
                   Visão Harmônica
                 </span>
                 <div className="bg-brand/10 dark:bg-brand/20 border border-brand/30 p-1 rounded-xl flex items-center gap-1 min-h-[38px] sm:min-h-[46px] shadow-xs">
                   {/* Botão Único para Seleção de Visão Harmônica (CIFRA ➔ GRAUS ➔ FUNÇÃO) */}
                   <button
                     type="button"
                     onClick={() => setShowHarmonicMenu(true)}
                     className={cn(
                       "px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm min-h-[30px] sm:min-h-[38px] active:scale-95 border select-none",
                       harmonicDisplayMode === 'chords' && "bg-brand border-brand/40 text-white hover:brightness-110",
                       harmonicDisplayMode === 'roman' && "bg-amber-500 border-amber-400 text-black font-black hover:bg-amber-400 shadow-amber-500/20",
                       harmonicDisplayMode === 'functions' && "bg-cyan-500 border-cyan-400 text-white font-black hover:bg-cyan-400 shadow-cyan-500/20"
                     )}
                     title="Toque para alternar a Visão Harmônica (CIFRA ➔ GRAUS ➔ FUNÇÃO)"
                   >
                     <Layers size={13} className="shrink-0" />
                     <span>
                       {harmonicDisplayMode === 'chords' && "Cifra"}
                       {harmonicDisplayMode === 'roman' && "Graus"}
                       {harmonicDisplayMode === 'functions' && "Funções"}
                     </span>
                     <ChevronDown size={11} className="opacity-80 shrink-0 ml-0.5" />
                   </button>
                   <button
                     type="button"
                     onClick={() => setShowHarmonicGuideModal(true)}
                     className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-gradient-to-r from-brand/25 via-sky-500/25 to-blue-500/25 hover:from-brand/35 hover:to-blue-500/35 text-brand dark:text-sky-300 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-brand/50 shadow-md shadow-brand/20 ring-1 ring-brand/30 min-h-[34px] sm:min-h-[38px]"
                     title="Consultar Guia & Quadro de Funções Harmônicas"
                   >
                     <HelpCircle size={14} className="animate-pulse shrink-0" />
                     <span className="uppercase text-[10px] sm:text-[11px] tracking-wider font-extrabold">Guia</span>
                   </button>
                   <button
                     type="button"
                     onClick={() => setShowDynamicsGuideModal(true)}
                     className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-gradient-to-r from-rose-500/25 via-orange-500/25 to-amber-500/25 hover:from-rose-500/35 hover:to-amber-500/35 text-rose-500 dark:text-rose-300 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-rose-500/50 shadow-md shadow-rose-500/20 ring-1 ring-rose-500/30 min-h-[34px] sm:min-h-[38px]"
                     title="Guia de Dinâmicas & Expressão Musical"
                   >
                     <Flame size={14} className="text-amber-500 dark:text-amber-400 animate-pulse shrink-0" />
                     <span className="uppercase text-[10px] sm:text-[11px] tracking-wider font-extrabold">Dinâmicas</span>
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

             {/* Compasso (posicionado à direita, após Visão Harmônica) */}
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
                 title="Métrica / Compasso (Toque para alterar entre 3/4, 6/8, 6/9 ou voltar ao original)"
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

             {/* BPM (posicionado à direita, após Visão Harmônica) */}
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
                  title="Andamento / BPM (Toque para ajuste rápido, Tap Tempo ou voltar ao original)"
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
          </div>{/* Ações: Expandir Tela (anteriormente Youtube), Editar, Lixeira */}
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
          description="O visualizador inteligente possui ferramentas de alta performance dispostas da esquerda para a direita no painel para auxiliar no seu ensaio em casa ou na hora da ministração."
          steps={[
            "MODO FOCO: Toque em 'FOCO' para ativar a visualização em tela cheia com alto contraste e fonte otimizada para palco e celulares.",
            "TRANSPOSIÇÃO (TOM): Toque no tom atual para abrir o menu de transposição e alterar o tom de toda a cifra instantaneamente.",
            "CAPOTRASTE (CAPO): Toque no botão de Capo para abrir a caixa de posições (1ª à 12ª casa). O tom real é mantido enquanto os acordes (shapes) são recalculados para facilitar a execução.",
            "VISÃO HARMÔNICA: Toque para abrir a caixa de opções e escolher entre Cifra tradicional, Graus do Campo Harmônico (I, V, VIm) ou Funções Harmônicas (Tôn, Dom, Rel). Clique no botão (?) ao lado para ver o quadro explicativo.",
            "DINÂMICA & EXPRESSÃO: Marcadores visuais de intensidade (Sutil, Clímax, Crescendo ↗, Acapella 🎤, etc.) guiam a intenção da banda durante o louvor. Clique no botão de atalho (🔥) para abrir o guia completo.",
            "PEDAL BLUETOOTH & MIDI: Toque no botão PEDAL na barra superior para conectar e configurar pedais Bluetooth (PageTurner, AirTurn, Boss) e footswitches MIDI para avançar estrofes ou controlar a rolagem sem usar as mãos.",
            "COMPASSO & BPM: Toque no Compasso para escolher entre métricas (4/4, 3/4, 6/8, 6/9 etc.) ou voltar ao original. Toque no BPM para ajustar a velocidade, usar o Tap Tempo ou resetar para o BPM original da música.",
            "DIVIDIR COLUNAS (LAYOUT): Alterne a exibição entre 1 ou 2 colunas para melhor aproveitamento da tela em tablets, celulares e notebooks.",
            "ROLAGEM AUTOMÁTICA: Ative o scroll automático com ajuste de velocidade para acompanhar a cifra sem precisar tocar na tela enquanto toca.",
            "TAMANHO DO TEXTO: Utilize os botões de ajuste de fonte (A- e A+) para aumentar ou diminuir o tamanho dos acordes e da letra para facilitar a leitura à distância.",
            "VISUALIZAÇÃO DE ACORDES: Escolha entre ver a posição dos Dedos ou os Intervalos (T, 3, 5, 7m, 7M) no braço do violão. Toque sobre qualquer acorde na letra para ver o diagrama instantaneamente."
          ]}
          specialSteps={[
            "FUNDAMENTAÇÃO BÍBLICA: Ative a ferramenta para ver quais passagens e textos bíblicos dão base teológica para a letra desse louvor.",
            "SUGESTÕES DO MESMO TEMA: Peça à IA sugestões de outros louvores semelhantes para enriquecer o repertório do seu culto.",
            "APRENDA COM A MÚSICA: Expanda o painel de Harmonia para ver uma análise teórica rica das progressões e funções harmônicas da composição."
          ]}
          tip="Você pode usar um pedal de virada de página bluetooth compatível no Modo Culto para avançar as estrofes!"
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
                  title="Rolagem Automática"
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
                          ✨ Auto Inteligente
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
                        <p className="text-[7.5px] text-text-muted leading-none mt-0.5">Dinâmica ({editedSong.bpm || 80} BPM)</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center px-1 pt-1.5 border-t border-border/40">
                      <span className="text-[7.5px] text-text-muted italic leading-none select-none">Prefira Automático</span>
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
                        title="Rolagem Automática"
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
                                ✨ Auto Inteligente
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
                  {/* Sincronização e Importação Cifra Club */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 space-y-3.5 shadow-sm">
                    {/* Sincronização via Link Direto */}
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
                        <p className="text-[11px] text-text-muted">Selecione o texto e clique em um botão para aplicar a formatação no editor abaixo:</p>
                      </div>
                      <div className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/5 px-2 py-1 rounded border border-yellow-500/15 text-right self-start sm:self-center">
                        💡 Mantenha os acordes alinhados sobre a letra!
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
                        title="Itálico (<i>texto</i>)"
                      >
                        <Italic size={14} strokeWidth={2.5} />
                        Itálico
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
                        {/* Seções da Música */}
                        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
                          <span className="text-[10px] font-bold text-text-muted uppercase shrink-0 flex items-center gap-1 mr-0.5">
                            <Music size={12} className="text-brand" /> Seções:
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

                        {/* Dinâmicas */}
                        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5 border-t border-border/30 pt-1">
                          <span className="text-[10px] font-bold text-text-muted uppercase shrink-0 flex items-center gap-1">
                            <Flame size={12} className="text-rose-500" /> Dinâmicas:
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowDynamicsGuideModal(true)}
                            className="px-2.5 py-1 bg-gradient-to-r from-rose-500/25 via-orange-500/25 to-amber-500/25 hover:from-rose-500/35 hover:to-amber-500/35 text-rose-400 dark:text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-500/20 ring-1 ring-rose-500/30 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 cursor-pointer flex items-center gap-1 transition-all mr-1.5"
                            title="Abrir Guia de Dinâmica e Expressão de Louvor"
                          >
                            <HelpCircle size={11} className="animate-pulse text-amber-400" />
                            <span>Guia</span>
                          </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('N1 🌑 Sutil', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border border-indigo-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="N1 🌑 Sutil"
                        >
                          + N1 🌑 Sutil
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('N2 🌘 Bem Suave', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="N2 🌘 Bem Suave"
                        >
                          + N2 🌘 Bem Suave
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('N3 🌗 Suave', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white border border-teal-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="N3 🌗 Suave"
                        >
                          + N3 🌗 Suave
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('N4 🌖 Moderado', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-sky-600 to-blue-600 text-white border border-sky-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="N4 🌖 Moderado"
                        >
                          + N4 🌖 Moderado
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('N5 🌕 Meio Forte', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-300/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="N5 🌕 Meio Forte"
                        >
                          + N5 🌕 Meio Forte
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('N6 🔥 Forte', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-orange-600 to-red-500 text-white border border-orange-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="N6 🔥 Forte"
                        >
                          + N6 🔥 Forte
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('N7 ⚡ Clímax', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 text-white border border-rose-300/50 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="N7 ⚡ Clímax"
                        >
                          + N7 ⚡ Clímax
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('Crescendo ↗', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white border border-violet-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                        >
                          + Crescendo ↗
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('Decrescendo ↘', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-yellow-600 text-white border border-amber-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                        >
                          + Decrescendo ↘
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('Pausa 🛑', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-red-600 text-white border border-rose-400/50 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="Pausa / Interrupção (🛑)"
                        >
                          + Pausa 🛑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('Acapella 🎤', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-teal-600 text-white border border-cyan-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                        >
                          + Acapella 🎤
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('Só Bateria 🥁', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white border border-orange-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                        >
                          + Só Bateria 🥁
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('Violão Marcando 🎸', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-500 text-white border border-amber-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                        >
                          + Violão Marcando 🎸
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('Sobe o Tom 📈', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 text-white border border-fuchsia-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="Sobe o Tom / Modulação (📈)"
                        >
                          + Sobe o Tom 📈
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertDynamicsTag('só guita', 'chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white border border-amber-400/40 rounded-lg transition-all text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
                          title="Inserir tag [só guita]"
                        >
                          + [só guita] 🎸
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertCustomDynamicsTag('chords')}
                          className="px-2.5 py-1 bg-gradient-to-r from-brand via-indigo-600 to-purple-600 text-white border border-brand/40 rounded-lg transition-all text-[10px] font-mono font-black shrink-0 cursor-pointer shadow-xs hover:brightness-110 active:scale-95 flex items-center gap-1"
                          title="Inserir tag de dinâmica customizada em colchetes [...]"
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
                    placeholder="D9           Am7\nGraça, quão maravilhosa..."
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
                  {/* Sincronização e Importação Cifra Club */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 space-y-3.5 shadow-sm">
                    {/* Sincronização via Link Direto */}
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
                        <p className="text-[11px] text-text-muted">Selecione o texto e clique em um botão para aplicar a formatação no editor abaixo:</p>
                      </div>
                      <div className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/5 px-2 py-1 rounded border border-yellow-500/15 text-right self-start sm:self-center">
                        💡 Formate sua letra para destacar refrãos e divisões!
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
                        title="Itálico (<i>texto</i>)"
                      >
                        <Italic size={14} strokeWidth={2.5} />
                        Itálico
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
                        {/* Seções da Música */}
                        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
                          <span className="text-[10px] font-bold text-text-muted uppercase shrink-0 flex items-center gap-1 mr-0.5">
                            <Music size={12} className="text-brand" /> Seções:
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

                        {/* Ações de Letra (Extrair, Limpar Dinâmicas e Limpar) */}
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
                            title="Extrair e formatar letra limpa (sem cifras e sem dinâmicas) automaticamente a partir da cifra"
                          >
                            <Sparkles size={12} /> ✨ Extrair da Cifra
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
                            title="Remover qualquer marcação de dinâmica (ex: bem suave, só violão) do texto atual da letra"
                          >
                            🧹 Remover Dinâmicas
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
                    placeholder="Cole aqui apenas a letra da música..."
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
                      <span>Volume do Metrônomo:</span>
                      <span className="text-brand font-mono font-black">{metronomeVolume}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-4 sm:gap-6 relative z-50">
                        <button 
                          type="button" 
                          onClick={() => setMetronomeVolume(prev => Math.max(0, prev - 10))} 
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/20 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-black/5 dark:shadow-white/5 text-text-main"
                          title="Diminuir Volume do Metrônomo"
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
                          title="Aumentar Volume do Metrônomo"
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
                      <span>{isMetronomeActive ? "Metrônomo Ligado" : "Ligar Metrônomo"}</span>
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
                 <Save size={18}/> Salvar Todas as Alterações
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

          {/* FERRAMENTAS DE ESTUDO DA MÚSICA (PLAYER, LILOUPRO TUNER, METRÔNOMO & ARQUIVOS) */}
          <Card className="p-4 sm:p-5 space-y-5 bg-card border-border/80 shadow-xl relative overflow-hidden">
            {/* Header Ferramentas de Estudo */}
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
              <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-black shrink-0">
                <Zap size={18} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-text-main">
                  FERRAMENTAS DE ESTUDO DA MÚSICA
                </h3>
                <p className="text-[10px] text-text-muted leading-tight">
                  Player, Tuner, Metrônomo e Recursos de Ensaio
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
                    Dê o play para ouvir a música enquanto visualiza a cifra.
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

            {/* 2. LILOUPRO TUNER (AFINADOR CROMÁTICO) */}
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
                    Afine o instrumento ou emita tom de referência em tempo real.
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
                    Boutique Stompbox com subdivisões, speed trainer, e time selector
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
                      + Áudio
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
                        <p className="font-black uppercase tracking-wider text-[9px] leading-none">Análise em Andamento...</p>
                        <p className="text-[8.5px] opacity-75 mt-0.5">Estimando o BPM do áudio carregado.</p>
                      </div>
                    </div>
                  )}

                  {detectedBpmMsg && (
                    <div className="p-3 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-xs space-y-2 shadow-sm">
                      <div className="flex items-start gap-2.5">
                        <Sparkles size={14} className="shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-black uppercase tracking-wider text-[9px] leading-none">BPM Detectado! ⚡</p>
                          <p className="text-[10px] font-bold text-text-main mt-1">
                            Andamento de <strong className="text-white">"{detectedBpmMsg.name}"</strong> ajustou o metrônomo para <span className="font-extrabold text-white text-xs bg-green-500 px-1 rounded">{detectedBpmMsg.bpm} BPM</span>.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-green-500/10">
                        <span className="text-[7.5px] text-text-muted select-none">Ajuste manual continua disponível</span>
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
                                title="Análise Inteligente de BPM"
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
                        <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider block">Link do Drive (Guias de Áudio)</span>
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

          {/* SEÇÃO DE FERRAMENTAS ESPECIAIS (EXCLUSIVO LILOUPRO) */}
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
                Recursos avançados de inteligência teológica e análise musical para elevar a excelência do seu ministério.
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
                <span>Fundamentação Bíblica</span>
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
                          <p className="text-[10px] text-text-muted mt-1 max-w-[200px]">Mapeando temas com passagens bíblicas usando Inteligência Artificial.</p>
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
                            <span>Análise Teológica</span>
                            {editedSong.bibleReferences && !isEditing && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAnalyzeBible();
                                }}
                                disabled={isAnalyzingBible}
                                className="flex items-center gap-1.5 text-text-muted hover:text-brand transition-all text-[9.5px] uppercase font-black tracking-widest bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg"
                                title="Recalcular Análise"
                              >
                                <RefreshCcw size={10} className={cn(isAnalyzingBible && "animate-spin")} />
                                <span>Recalcular</span>
                              </button>
                            )}
                          </div>

                          {/* Summary */}
                          <div className="bg-brand/5 dark:bg-white/5 border border-brand/10 dark:border-white/10 p-3.5 rounded-xl text-xs sm:text-sm text-text-main font-medium leading-relaxed italic relative">
                            <span className="absolute top-1 left-2 text-[24px] leading-none text-brand/20 font-serif">“</span>
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
                                    <span className="font-bold text-brand mr-1">Relação:</span>{ref.relation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <p className="text-xs text-text-muted mb-4 max-w-[220px]">
                            Descubra quais passagens da Bíblia dão respaldo teológico ou serviram como inspiração para esta canção.
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

          {/* Sugestões do Mesmo Tema Card */}
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
                <span>Sugestões do Mesmo Tema</span>
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
                          <p className="text-xs font-semibold text-text-main animate-pulse">Buscando sugestões...</p>
                          <p className="text-[10px] text-text-muted mt-1 max-w-[200px]">Encontrando canções com a mesma linha temática no acervo cristão usando IA.</p>
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
                                title="Recalcular Sugestões"
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
                            Para enriquecer seu repertório ou culto, peça à IA sugestões de ao menos 3 louvores de mesmo tema.
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

          {/* Aprenda com a Música (Harmonia) Card */}
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
                <span>Aprenda com a Música (Harmonia)</span>
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
                          <p className="text-[10px] text-text-muted mt-1 max-w-[200px]">Mapeando campo harmônico, cadências, AEM, dominantes secundárias e dicas para o altar usando IA.</p>
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
                            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Análise Funcional</span>
                            {!isEditing && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAnalyzeHarmony();
                                }}
                                disabled={isAnalyzingHarmony}
                                className="flex items-center gap-1.5 text-text-muted hover:text-indigo-500 transition-all text-[9.5px] uppercase font-black tracking-widest bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg shrink-0"
                                title="Recalcular Análise"
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
                                {editedSong.harmonyAnalysis.scaleNotes?.join(" • ")}
                              </span>
                            </div>
                          </div>

                          {/* Connection to Course / Teoria */}
                          <div className="bg-brand/5 dark:bg-white/5 border border-brand/10 p-3 rounded-xl text-[11px] leading-relaxed text-text-muted dark:text-slate-200">
                            <h4 className="font-black text-brand uppercase tracking-wider mb-1 text-[10px] flex items-center gap-1">
                              <Zap size={11} /> Conexão com os Capítulos do Curso:
                            </h4>
                            {editedSong.harmonyAnalysis.specialChords && editedSong.harmonyAnalysis.specialChords.length > 0 ? (
                              <p>
                                Esta música faz uso fantástico de elementos avançados apresentados no hino! Ela possui <span className="font-extrabold text-indigo-500 dark:text-indigo-400">{editedSong.harmonyAnalysis.specialChords.map((sc: any) => sc.chord).join(", ")}</span> classificado(s) como <strong className="text-indigo-500 dark:text-indigo-400">{editedSong.harmonyAnalysis.specialChords[0].concept}</strong>. Revise o <span className="underline font-bold text-indigo-600 dark:text-indigo-400">Capítulo 4 ou 5</span> do nosso Curso de Harmonia para entender a fundo o intercâmbio modal ou dominantes secundárias envolvidos!
                              </p>
                            ) : (
                              <p>
                                Esta canção é excelente para aplicar harmonia diatônica essencial. Ela se enquadra perfeitamente nas cadências abordadas no <strong className="text-indigo-500 dark:text-indigo-400">Capítulo 2 (Introdução ao Campo Harmônico)</strong> e no <strong className="text-indigo-500 dark:text-indigo-400">Capítulo 3 (Cadências Clássicas)</strong>. Pratique dedilhando e identificando as funções de Tônica, Subdominante e Dominante!
                              </p>
                            )}
                          </div>

                          {/* Campo Harmônico Grid */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Campo Harmônico Diatônico do Tom</span>
                            <div className="grid grid-cols-4 gap-1.5">
                              {editedSong.harmonyAnalysis.harmonicField?.map((item: any, idx: number) => {
                                const isTonic = item.functionType === 'Tônica';
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

                          {/* Cadências encontradas */}
                          {editedSong.harmonyAnalysis.cadencesFound && editedSong.harmonyAnalysis.cadencesFound.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Movimentos e Cadências Identificadas</span>
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
                              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Dicas de Arranjo Harmônico (Acordes Especiais / Empréstimos)</span>
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
                              <Sparkles size={11} className="text-indigo-500 animate-pulse" /> Dicas de Execução para a Equipe
                            </span>
                            <div className="space-y-2">
                              <div className="bg-black/5 dark:bg-white/5 border border-border p-2.5 rounded-xl text-[11px] leading-relaxed">
                                <span className="font-black text-indigo-600 dark:text-indigo-400 block mb-0.5 uppercase tracking-wide text-[9.5px]">🎹 Tecladista</span>
                                <p className="text-text-muted dark:text-slate-200">{editedSong.harmonyAnalysis.musicianTips.keyboardist}</p>
                              </div>
                              <div className="bg-black/5 dark:bg-white/5 border border-border p-2.5 rounded-xl text-[11px] leading-relaxed">
                                <span className="font-black text-indigo-600 dark:text-indigo-400 block mb-0.5 uppercase tracking-wide text-[9.5px]">🎸 Violonista / Guitarrista</span>
                                <p className="text-text-muted dark:text-slate-200">{editedSong.harmonyAnalysis.musicianTips.guitarist}</p>
                              </div>
                              <div className="bg-black/5 dark:bg-white/5 border border-border p-2.5 rounded-xl text-[11px] leading-relaxed">
                                <span className="font-black text-indigo-600 dark:text-indigo-400 block mb-0.5 uppercase tracking-wide text-[9.5px]">🎸 Baixista</span>
                                <p className="text-text-muted dark:text-slate-200">{editedSong.harmonyAnalysis.musicianTips.bassist}</p>
                              </div>
                              <div className="bg-black/5 dark:bg-white/5 border border-border p-2.5 rounded-xl text-[11px] leading-relaxed">
                                <span className="font-black text-indigo-600 dark:text-indigo-400 block mb-0.5 uppercase tracking-wide text-[9.5px]">🎤 Ministros Vocais</span>
                                <p className="text-text-muted dark:text-slate-200">{editedSong.harmonyAnalysis.musicianTips.vocalist}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <p className="text-xs text-text-muted mb-4 max-w-[220px]">
                            Clique para analisar a harmonia e aprender funções harmônicas, campo diatônico e cadências desta música usando IA.
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
                    Transposição de Tom
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

              {/* Stepper rápido de 1/2 Tom */}
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

      {/* Capo Selection Modal / Caixa de Opções do Capo */}
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
                      Posição do Capo
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

              {/* Informação e Dica Musical */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-xs text-text-main space-y-1 shrink-0">
                <p className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Sparkles size={14} /> Caixa de Posições do Capotraste
                </p>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  Escolha em qual casa colocar a braçadeira. O tom real da música permanece <strong className="text-brand">{currentKey}</strong> e os acordes (shapes) são recalculados para criar diferentes sonoridades no instrumento!
                </p>
              </div>

              {/* Botão de Alternância Rápida Sem Capo */}
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

              {/* Grid / Lista de Posições do Capo (1ª a 12ª Casa) */}
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
                          {fret}º
                        </span>
                        <div>
                          <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                            <span>{fret}ª Casa</span>
                            {isCaged && (
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-tight",
                                isSelected ? "bg-black/20 text-black" : "bg-amber-500/20 text-amber-600 dark:text-amber-300"
                              )}>
                                🎸 Shape Aberto
                              </span>
                            )}
                          </div>
                          <p className={cn("text-[10px]", isSelected ? "text-black/80 font-bold" : "text-text-muted")}>
                            Acordes do braço em {calculatedShape}
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

      {/* Modal de Escolha da Visão Harmônica (CIFRA, GRAUS, FUNÇÕES) */}
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
                      Visão Harmônica
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

              {/* Dica do Modo Harmônico */}
              <div className="bg-brand/10 border border-brand/20 rounded-2xl p-3 text-xs text-text-main space-y-1 shrink-0">
                <p className="font-bold flex items-center gap-1.5 text-brand">
                  <Sparkles size={14} /> Seleção de Formato de Exibição
                </p>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  Escolha como os acordes da música serão apresentados na cifra. O modo <strong>Cifra Tradicional</strong> é o formato padrão.
                </p>
              </div>

              {/* Opções de Visão Harmônica */}
              <div className="space-y-2 py-1">
                {/* Opção 1: CIFRA (PADRÃO) */}
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
                      🎸
                    </div>
                    <div>
                      <div className="font-black text-sm flex items-center gap-2">
                        <span>Cifra Tradicional</span>
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                          harmonicDisplayMode === 'chords' ? "bg-white/20 text-white" : "bg-brand/20 text-brand"
                        )}>
                          Padrão
                        </span>
                      </div>
                      <p className={cn("text-[11px] mt-0.5", harmonicDisplayMode === 'chords' ? "text-white/80" : "text-text-muted")}>
                        Exibe os acordes com os nomes reais (Ex: C, G, Am, F)
                      </p>
                    </div>
                  </div>
                </button>

                {/* Opção 2: GRAUS (I, V, VI, IV) */}
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
                        <span>Graus do Campo Harmônico</span>
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                          harmonicDisplayMode === 'roman' ? "bg-black/20 text-black" : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        )}>
                          Numerais
                        </span>
                      </div>
                      <p className={cn("text-[11px] mt-0.5", harmonicDisplayMode === 'roman' ? "text-black/80 font-bold" : "text-text-muted")}>
                        Exibe em graus numéricos romanos (Ex: I, V, VIm, IV)
                      </p>
                    </div>
                  </div>
                </button>

                {/* Opção 3: FUNÇÕES (Tôn, Dom, Subd) */}
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
                      🎼
                    </div>
                    <div>
                      <div className="font-black text-sm flex items-center gap-2">
                        <span>Funções Harmônicas</span>
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                          harmonicDisplayMode === 'functions' ? "bg-white/20 text-white" : "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                        )}>
                          Análise
                        </span>
                      </div>
                      <p className={cn("text-[11px] mt-0.5", harmonicDisplayMode === 'functions' ? "text-white/80" : "text-text-muted")}>
                        Exibe o papel harmônico (Ex: Tôn, Dom, Subd, Rel)
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted shrink-0">
                <span>Clique para aplicar o modo de visão desejado</span>
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

      {/* Modal Guia & Tabela de Funções Harmônicas */}
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
                      Guia & Tabela de Funções Harmônicas
                    </h3>
                    <p className="text-[11px] text-text-muted font-bold flex items-center gap-1.5 mt-0.5">
                      <span>Tom Atual da Música:</span>
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

              {/* Introdução rápida */}
              <div className="bg-brand/5 border border-brand/20 rounded-2xl p-3 text-xs text-text-main space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-brand">
                  <Sparkles size={14} /> Como funciona a Visão Harmônica?
                </p>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  A <strong>Visão Harmônica</strong> analisa as cifras no tom selecionado (<strong>{currentKey || 'C'}</strong>) e permite alternar entre <strong>CIFRA</strong> (acordes originais), <strong>GRAUS</strong> (em algarismos romanos: I, V, VIm, IV) e <strong>FUNÇÃO</strong> (papel harmônico: Tôn, Dom, Rel, Subd).
                </p>
              </div>

              {/* Tabela dos Graus e Funções */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-text-main flex items-center gap-1.5">
                  <span>Quadro de Graus e Funções no Tom {currentKey || 'C'}</span>
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-black/5 dark:bg-white/5 border-b border-border text-[10px] font-black uppercase text-text-muted">
                        <th className="p-2.5">Grau</th>
                        <th className="p-2.5">Função</th>
                        <th className="p-2.5">Papel Harmônico</th>
                        <th className="p-2.5">Acorde Exemplo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(() => {
                        const keyBase = (currentKey || 'C').match(/^([A-G][#b]?)/)?.[1] || 'C';
                        const degrees = [
                          { roman: 'I', abbrev: 'Tôn', name: 'Tônica', desc: 'Repouso / Centro Tonal principal', semitones: 0, minor: false },
                          { roman: 'IIm', abbrev: 'SubR', name: 'Supertônica / Sub-Relativa', desc: 'Transição e preparação Subdominante', semitones: 2, minor: true },
                          { roman: 'IIIm', abbrev: 'Med', name: 'Mediante', desc: 'Repouso secundário suave', semitones: 4, minor: true },
                          { roman: 'IV', abbrev: 'Subd', name: 'Subdominante', desc: 'Afastamento e meio de tensão', semitones: 5, minor: false },
                          { roman: 'V', abbrev: 'Dom', name: 'Dominante', desc: 'Tensão Máxima (pede resolução na Tônica)', semitones: 7, minor: false },
                          { roman: 'VIm', abbrev: 'Rel', name: 'Relativa Menor', desc: 'Repouso secundário / Tonalidade íntima', semitones: 9, minor: true },
                          { roman: 'VIIº', abbrev: 'Sens', name: 'Sensível / Subtônica', desc: 'Tensão direcional rumo à Tônica', semitones: 11, minor: true },
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

              {/* Inversões / Slash Chords */}
              <div className="bg-card border border-border rounded-2xl p-3.5 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-text-main">
                  Inversões de Baixo (Notas após a barra `/`)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-border">
                    <span className="font-mono font-black text-brand text-xs block">/1 (ex: V/1)</span>
                    <span className="text-[10px] text-text-muted">Baixo na Tônica</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-border">
                    <span className="font-mono font-black text-brand text-xs block">/3 (ex: 1/3)</span>
                    <span className="text-[10px] text-text-muted">Baixo na Terça (Inversão)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-border">
                    <span className="font-mono font-black text-brand text-xs block">/5 (ex: 1/5)</span>
                    <span className="text-[10px] text-text-muted">Baixo na Quinta</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-border">
                    <span className="font-mono font-black text-brand text-xs block">/7 (ex: 1/7)</span>
                    <span className="text-[10px] text-text-muted">Baixo na Sétima</span>
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

      {/* Popover Flutuante de Diagrama Rápido de Acorde */}
      <QuickChordPopover
        chord={popoverChord}
        onClose={() => setPopoverChord(null)}
        availableChords={availableChordsInSong}
        onSelectChord={(chord) => setActiveChordInDict(chord, true)}
        songKey={currentKey}
      />

      {/* Modal Guia de Dinâmicas & Expressão Musical */}
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

      {/* Modal de Métrica & Compasso Musical */}
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
                      Métrica & Compasso Musical
                    </h3>
                    <p className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 mt-0.5">
                      <span>Compasso Atual:</span>
                      <span className="px-2 py-0.5 rounded bg-brand/15 text-brand font-black text-xs font-mono">
                        {editedSong.timeSignature || originalTimeSignature || '4/4'}
                      </span>
                      <span>• Original:</span>
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

              {/* Informação / Dica */}
              <div className="bg-brand/5 border border-brand/20 rounded-2xl p-3 text-xs text-text-main space-y-1 shrink-0">
                <p className="font-bold flex items-center gap-1.5 text-brand">
                  <Sparkles size={14} /> Seleção Rápida de Compasso
                </p>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  Alterne a contagem e a métrica de tempo da música. O metrônomo do Liloupro acentuará o primeiro tempo automaticamente de acordo com o compasso escolhido!
                </p>
              </div>

              {/* Botão de Restaurar para Original */}
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

              {/* Grid de Opções de Compassos Comuns & Especiais */}
              <div className="overflow-y-auto custom-scrollbar pr-1 space-y-1.5 max-h-[280px]">
                {[
                  { value: '4/4', name: 'Quaternário Simples', desc: '4 tempos. O mais comum na música pop e louvor moderno.', badge: 'Mais Comum' },
                  { value: '3/4', name: 'Ternário Simples', desc: '3 tempos (Valsa). Hinos congregacionais tradicionais e canções ternárias.', badge: 'Valsa / Clássico' },
                  { value: '6/8', name: 'Binário Composto', desc: '2 pulsos ternários (1-2-3, 4-5-6). Baladas fluidas, worship contemporâneo e dedilhados.', badge: 'Worship / Balada' },
                  { value: '2/4', name: 'Binário Simples', desc: '2 tempos. Marchas, ritmos rápidos e hinos solenes.', badge: 'Marcha / Rápido' },
                  { value: '12/8', name: 'Quaternário Composto', desc: '4 pulsos ternários. Baladas lentas, blues e louvor intimista profundo.', badge: 'Blues / Balada Lenta' },
                  { value: '6/9', name: 'Métrica Especial (6/9)', desc: 'Compasso e métrica composta com subdivisão estendida.', badge: 'Métrica Especial' },
                  { value: '6/4', name: 'Sêxtuplo Simples', desc: '6 tempos por compasso. Andamentos lentos, reflexivos e espaçosos.', badge: 'Solene' },
                  { value: '9/8', name: 'Ternário Composto', desc: '3 pulsos ternários (1-2-3, 4-5-6, 7-8-9). Dinâmica rica e expressiva.', badge: 'Ternário Composto' },
                  { value: '2/2', name: 'Alla Breve', desc: '2 tempos em mínima. Andamentos ágeis com pulsação ampla.', badge: 'Alla Breve' },
                  { value: '5/4', name: 'Assimétrico (5 Tempos)', desc: 'Métrica irregular (3+2 ou 2+3) para arranjos criativos.', badge: 'Assimétrico' },
                  { value: '7/8', name: 'Progressivo (7 Tempos)', desc: 'Métrica quebrada e moderna (3+2+2 ou 2+2+3).', badge: 'Progressivo' },
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
                      <span>• Original:</span>
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
                  {(editedSong.bpm || 80) > 75 && (editedSong.bpm || 80) <= 90 && "Andante (Worship Médio)"}
                  {(editedSong.bpm || 80) > 90 && (editedSong.bpm || 80) <= 110 && "Moderato (Pop Worship)"}
                  {(editedSong.bpm || 80) > 110 && (editedSong.bpm || 80) <= 130 && "Allegro (Celebração / Louvor Vivo)"}
                  {(editedSong.bpm || 80) > 130 && (editedSong.bpm || 80) <= 150 && "Vivace (Jubiloso / Festa)"}
                  {(editedSong.bpm || 80) > 150 && "Presto (Acelerado / Alta Energia)"}
                </div>
              </div>

              {/* Botão de Restaurar ao BPM Original */}
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

              {/* Stepper Rápido de Ajustes (-10, -5, -1, +1, +5, +10, /2, x2) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Ajuste Rápido de Velocidade</span>
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
                    <span>× 2</span>
                    <span className="text-[10px] opacity-75 font-normal">(Dobro)</span>
                  </button>
                </div>
              </div>

              {/* Slider Contínuo */}
              <div className="space-y-1.5 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-border">
                <div className="flex justify-between items-center text-xs font-bold text-text-muted">
                  <span>40 BPM (Lento)</span>
                  <span className="font-mono font-black text-brand text-sm">{editedSong.bpm || 80} BPM</span>
                  <span>240 BPM (Rápido)</span>
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

              {/* Botão TAP TEMPO */}
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
                    Toque repetidamente no ritmo da música para calcular o BPM
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
                    { bpm: 76, label: '76 Worship Médio' },
                    { bpm: 92, label: '92 Pop / Moderato' },
                    { bpm: 115, label: '115 Celebração' },
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

              {/* Metrônomo Áudio & Salvar no Firebase */}
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
                  title="Testar o andamento ouvindo os cliques do metrônomo"
                >
                  <Volume2 size={14} />
                  <span>{isMetronomeActive ? "Metrônomo Tocando" : "Ouvir Metrônomo"}</span>
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
                  Guia Rápido: Seções, Dinâmicas & Expressão Musical
                </h3>
                <p className="text-[11px] text-text-muted font-bold mt-0.5">
                  Marcadores visuais automáticos e botões interativos para cifras e letras
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

          {/* Novidade: Botões de Atalho no Editor & Clique Interativo */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand/15 via-cyan-500/10 to-indigo-500/10 border border-brand/30 space-y-2">
            <div className="flex items-center gap-2 text-brand font-black text-xs uppercase tracking-wider">
              <Sparkles size={16} />
              <span>Recursos do Leitor e Editor Liloupro</span>
            </div>
            <ul className="text-[11px] text-text-muted space-y-1.5 leading-relaxed font-medium">
              <li className="flex items-start gap-1.5">
                <span className="text-brand font-bold shrink-0">✦</span>
                <span><strong>Inserção em 1 Clique no Editor:</strong> Na tela de edição da música, clique nos botões rápidos de seções (<code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">+ Refrão</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">+ Primeira Parte</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">+ Segunda Parte</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">+ Verso 1</code>) ou de dinâmicas para colar a tag direto onde o cursor estiver.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-brand font-bold shrink-0">✦</span>
                <span><strong>Badges Interativos:</strong> Ao ler a cifra, clique em qualquer etiqueta de dinâmica ou pausa para abrir o modal explicativo com a orientação exata para vocal e instrumentistas.</span>
              </li>
            </ul>
          </div>

          {/* Seções de Estrutura da Música */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
              <Music size={14} /> Seções e Partes da Música
            </h4>
            <p className="text-[11px] text-text-muted">
              Ao colocar o nome da seção entre colchetes como <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Refrão]</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Primeira Parte]</code>, <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Segunda Parte]</code> ou <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">[Verso 1]</code>, o aplicativo estiliza automaticamente com o mesmo padrão visual de destaque:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> REFRÃO
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
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> VERSO 3
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> VERSO 4
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Music size={12} /> VERSO 5
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Layers size={12} /> PONTE
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand to-cyan-500 text-white border border-brand/20 shadow-xs">
                <Zap size={12} /> SOLO
              </span>
            </div>
          </div>

          {/* 7 Níveis de Dinâmica */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
              <Volume2 size={14} /> 7 Níveis de Dinâmica Musical
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* N1 */}
              <div 
                onClick={() => triggerDynamicExplanation('n1')}
                className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:border-indigo-500/60"
              >
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-black font-mono shrink-0 flex items-center gap-1 shadow-xs">
                  N1 🌑
                </span>
                <div>
                  <h5 className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase">Sutil</h5>
                  <p className="text-[11px] text-text-muted mt-0.5">Piano/Pad, clima de contemplação e ministração.</p>
                </div>
              </div>

              {/* N2 */}
              <div 
                onClick={() => triggerDynamicExplanation('n2')}
                className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:border-emerald-500/60"
              >
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black font-mono shrink-0 flex items-center gap-1 shadow-xs">
                  N2 🌘
                </span>
                <div>
                  <h5 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">Bem Suave</h5>
                  <p className="text-[11px] text-text-muted mt-0.5">Toque leve, arranjo contido e sem peso.</p>
                </div>
              </div>

              {/* N3 */}
              <div 
                onClick={() => triggerDynamicExplanation('n3')}
                className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-start gap-3 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:border-teal-500/60"
              >
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-black font-mono shrink-0 flex items-center gap-1 shadow-xs">
                  N3 🌗
                </span>
                <div>
                  <h5 className="text-xs font-black text-teal-600 dark:text-teal-400 uppercase">Suave</h5>
                  <p className="text-[11px] text-text-muted mt-0.5">Começa a ganhar corpo no verso.</p>
                </div>
              </div>

              {/* N4 */}
              <div 
                onClick={() => triggerDynamicExplanation('n4')}
                className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-start gap-3 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:border-sky-500/60"
              >
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 text-white text-xs font-black font-mono shrink-0 flex items-center gap-1 shadow-xs">
                  N4 🌖
                </span>
                <div>
                  <h5 className="text-xs font-black text-sky-600 dark:text-sky-400 uppercase">Moderado</h5>
                  <p className="text-[11px] text-text-muted mt-0.5">Dinâmica equilibrada e ritmo constante.</p>
                </div>
              </div>

              {/* N5 */}
              <div 
                onClick={() => triggerDynamicExplanation('n5')}
                className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:border-amber-500/60"
              >
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black font-mono shrink-0 flex items-center gap-1 shadow-xs">
                  N5 🌕
                </span>
                <div>
                  <h5 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase">Meio Forte</h5>
                  <p className="text-[11px] text-text-muted mt-0.5">Energia alta, com espaço para crescer ao clímax.</p>
                </div>
              </div>

              {/* N6 */}
              <div 
                onClick={() => triggerDynamicExplanation('n6')}
                className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:border-orange-500/60"
              >
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-orange-600 to-red-500 text-white text-xs font-black font-mono shrink-0 flex items-center gap-1 shadow-xs">
                  N6 🔥
                </span>
                <div>
                  <h5 className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase">Forte</h5>
                  <p className="text-[11px] text-text-muted mt-0.5">Grande intensidade e presença de vocais.</p>
                </div>
              </div>

              {/* N7 */}
              <div 
                onClick={() => triggerDynamicExplanation('n7')}
                className="p-3 sm:col-span-2 rounded-2xl bg-gradient-to-r from-rose-500/20 via-red-500/20 to-amber-500/20 border border-rose-500/40 flex items-start gap-3 shadow-xs cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:border-rose-500/70"
              >
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 text-white text-xs font-black font-mono shrink-0 flex items-center gap-1 shadow-xs">
                  N7 ⚡
                </span>
                <div>
                  <h5 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase flex items-center gap-1">
                    <span>Clímax</span>
                    <Zap size={13} className="text-rose-500 animate-pulse" />
                  </h5>
                  <p className="text-[11px] text-text-muted mt-0.5">Explosão sonora total, adoração e celebração máxima com a igreja.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Indicadores de Expressão e Transição */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
              <TrendingUp size={14} /> INDICADORES DE INTENSIDADE & EXPRESSÃO
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div 
                onClick={() => triggerDynamicExplanation('crescendo')}
                className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:border-violet-500/50"
              >
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-xs shadow-xs">Crescendo ↗</span>
                <span className="text-[11px] text-text-muted font-bold">Subindo a intensidade nota por nota</span>
              </div>

              <div 
                onClick={() => triggerDynamicExplanation('decrescendo')}
                className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:border-amber-500/50"
              >
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold text-xs shadow-xs">Decrescendo ↘</span>
                <span className="text-[11px] text-text-muted font-bold">Suavizando o volume para transição</span>
              </div>

              <div 
                onClick={() => triggerDynamicExplanation('pausa')}
                className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:border-rose-500/50"
              >
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs shadow-xs">Pausa 🛑</span>
                <span className="text-[11px] text-text-muted font-bold">Interrupção ou corte seco no arranjo</span>
              </div>

              <div 
                onClick={() => triggerDynamicExplanation('acapella')}
                className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:border-cyan-500/50"
              >
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold text-xs shadow-xs">Acapella 🎤</span>
                <span className="text-[11px] text-text-muted font-bold">Apenas a igreja e a equipe cantando sem instrumentos</span>
              </div>

              <div 
                onClick={() => triggerDynamicExplanation('drums')}
                className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:border-orange-500/50"
              >
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs shadow-xs">Só Bateria 🥁</span>
                <span className="text-[11px] text-text-muted font-bold">Groove de percussão mantendo a pulsação</span>
              </div>

              <div 
                onClick={() => triggerDynamicExplanation('acoustic')}
                className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:border-amber-500/50"
              >
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-500 text-white font-bold text-xs shadow-xs">Violão Marcando 🎸</span>
                <span className="text-[11px] text-text-muted font-bold">Base harmônica e rítmica conduzida pelo violão</span>
              </div>

              <div 
                onClick={() => triggerDynamicExplanation('keychange')}
                className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:border-fuchsia-500/50"
              >
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 text-white font-bold text-xs shadow-xs">Sobe o Tom 📈</span>
                <span className="text-[11px] text-text-muted font-bold">Modulação e elevação da tonalidade na música</span>
              </div>
            </div>
          </div>

          {/* Dica de Uso */}
          <div className="p-3.5 rounded-2xl bg-brand/10 border border-brand/30 flex items-start gap-3">
            <Sparkles size={18} className="text-brand shrink-0 mt-0.5" />
            <div className="text-xs text-text-main space-y-1">
              <p className="font-bold">Dica Liloupro:</p>
              <p className="text-text-muted text-[11px]">
                Tudo o que você escrever entre colchetes como <strong className="text-brand">[só guita]</strong>, <strong className="text-brand">[teclado e pad]</strong>, <strong className="text-brand">[entra a banda]</strong>, <strong className="text-brand">[suave]</strong> ou <strong className="text-brand">[Pausa 🛑]</strong> se transforma automaticamente em um tag de dinâmica personalizado com botão interativo para o leitor de cifras!
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Entendi
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function AvailabilityView({ createNotifications, theme }: { createNotifications?: any, theme?: 'light' | 'dark' }) {
  const { user, isAdmin, memberData } = useAuth();
  const userChurchId = memberData?.churchId || 'semente';
  const [currentDate, setCurrentDate] = useState(new Date());
  const lastUnlockedTargetRef = useRef<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [submissionStatus, setSubmissionStatus] = useState<{ success: boolean; message: string; admins: { name: string; phone: string }[]; adminEmails?: { name: string; email: string }[] } | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [lockStatus, setLockStatus] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [unlockHours, setUnlockHours] = useState<number>(() => {
    const saved = localStorage.getItem('app-availability-unlock-hours');
    return saved ? Number(saved) : 48;
  });
  const [presetHours, setPresetHours] = useState<string>(() => {
    const saved = localStorage.getItem('app-availability-unlock-hours');
    const val = saved ? Number(saved) : 48;
    return [12, 24, 48, 72, 120, 168].includes(val) ? String(val) : 'custom';
  });
  const [reminderDeadline, setReminderDeadline] = useState<string>(() => {
    return localStorage.getItem('app-reminder-deadline') || '20:00';
  });
  const [reminderMessageTemplate, setReminderMessageTemplate] = useState<string>(() => {
    return localStorage.getItem('app-reminder-template') || 
      'Olá {NOME} tudo bem? O prazo para marcar sua disponibilidade na escala do Louvor termina hoje, conto com sua colaboração. Obrigado por servir na igreja local! Deus abençoe!';
  });

  useEffect(() => {
    localStorage.setItem('app-reminder-deadline', reminderDeadline);
  }, [reminderDeadline]);

  useEffect(() => {
    localStorage.setItem('app-reminder-template', reminderMessageTemplate);
  }, [reminderMessageTemplate]);

  // Automatically detect if there is a month that has been unlocked (released) for scheduling,
  // and direct the member to that month as the default on first load or when a new month is unlocked.
  useEffect(() => {
    if (!user) return;
    const locksQuery = collection(db, 'availability_locks');
    const unsubscribe = onSnapshot(locksQuery, (snap) => {
      const allLocks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const unlockedLocks = allLocks.filter(lock => lock.unlocked === true);

      if (unlockedLocks.length > 0) {
        // Sort chronologically (ID is "YYYY-MM" so alphabetical sort matches chronological)
        unlockedLocks.sort((a, b) => a.id.localeCompare(b.id));

        const now = new Date();
        const nowMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Look for future unlocked months relative to today (e.g. '2026-08' > '2026-07')
        const futureUnlockedLocks = unlockedLocks.filter(lock => lock.id > nowMonthStr);

        let targetLock: any = null;
        if (futureUnlockedLocks.length > 0) {
          // Prioritize the latest future unlocked month (e.g. August when we are in July)
          targetLock = futureUnlockedLocks[futureUnlockedLocks.length - 1];
        } else {
          // If no future month unlocked, check if current month is unlocked
          const currentLock = unlockedLocks.find(lock => lock.id === nowMonthStr);
          if (currentLock) {
            targetLock = currentLock;
          } else {
            // Otherwise pick the latest unlocked month overall
            targetLock = unlockedLocks[unlockedLocks.length - 1];
          }
        }

        if (targetLock && targetLock.id !== lastUnlockedTargetRef.current) {
          const [yearStr, monthStr] = targetLock.id.split('-');
          const targetYear = parseInt(yearStr, 10);
          const targetMonth = parseInt(monthStr, 10) - 1;

          if (!isNaN(targetYear) && !isNaN(targetMonth)) {
            lastUnlockedTargetRef.current = targetLock.id;
            const updatedDate = new Date(targetYear, targetMonth, 1);
            setCurrentDate(updatedDate);
            setSelectedDate(updatedDate);
          }
        }
      }
    }, (error) => {
      console.error("Error listening to availability locks:", error);
    });

    return () => unsubscribe();
  }, [user]);
  
  const [detailMember, setDetailMember] = useState<any>(null);
  const [detailAvailability, setDetailAvailability] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit-admin'>('view');
  const [adminSelectedDate, setAdminSelectedDate] = useState<Date | null>(null);

  const cleanWhatsapp = (num: string) => {
    if (!num) return '';
    const digits = num.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10 || digits.length === 11) {
      return '55' + digits;
    }
    return digits;
  };

  const getFiveHoursBefore = (deadlineStr: string) => {
    try {
      if (!deadlineStr || !deadlineStr.includes(':')) return '';
      const [hStr, mStr] = deadlineStr.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (isNaN(h) || isNaN(m)) return '';
      let targetH = h - 5;
      if (targetH < 0) targetH += 24;
      return `${String(targetH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } catch (e) {
      return '';
    }
  };

  const handleSendReminder = (m: any) => {
    const rawPhone = m.whatsapp || '';
    const phone = cleanWhatsapp(rawPhone);
    const fullName = m.name || m.email?.split('@')[0] || 'Ministro';
    const name = fullName.trim().split(' ')[0];
    
    let message = reminderMessageTemplate
      .replace(/{NOME DA PESSOA}/g, name)
      .replace(/{NOME}/g, name)
      .replace(/NOME DA PESSOA/g, name);
    
    const encodedMessage = encodeURIComponent(message);
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
  };

  const handleCopyGroupAnnouncement = () => {
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const names = missingMembers.map(m => {
      const fullName = m.name || m.email?.split('@')[0] || 'Ministro';
      const firstName = fullName.trim().split(' ')[0];
      return `• *${firstName}*`;
    }).join('\n');
    const message = `📢 *ATENÇÃO MINISTÉRIO DE LOUVOR* 📢\n\n🗓️ Hoje é o último dia para cadastrar sua disponibilidade para as escalas do mês de *${monthName}*.\n\n⚠️ O prazo encerra *HOJE às ${reminderDeadline}*!\n\n⏳ *Falta preencher:*\n${names}\n\nPor favor, acessem o sistema e façam suas marcações o quanto antes! 👇\n🔗 ${window.location.origin}\n\nContamos com a colaboração de todos! 🙏`;
    
    navigator.clipboard.writeText(message);
    alert("Mensagem para o grupo copiada para a área de transferência! Cole no WhatsApp do ministério.");
  };

  const handleViewAvailabilityDetail = async (member: any) => {
    setDetailMember(member);
    setModalMode('view');
    setAdminSelectedDate(null);
    setLoadingDetail(true);
    setDetailAvailability([]);
    
    try {
      const q = query(
        collection(db, 'availability'),
        where('userId', '==', member.id || member.uid || member.userId),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => doc.data());
      setDetailAvailability(data);
    } catch (e) {
      console.error("Erro ao carregar disponibilidade detalhada:", e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const setAdminMemberAvailability = async (memberId: string, date: Date, status: 'available' | 'unavailable' | 'clear') => {
    if (!isAdmin) return;
    const dateStr = getLocalDateString(date);
    const availabilityPath = 'availability';
    const availabilityId = `${memberId}_${dateStr}`;
    const availRef = doc(db, availabilityPath, availabilityId);
    
    try {
      if (status === 'clear') {
        await deleteDoc(availRef);
        setDetailAvailability(prev => prev.filter(a => a.date !== dateStr));
      } else {
        await setDoc(availRef, {
          userId: memberId,
          date: dateStr,
          status: status,
          updatedAt: serverTimestamp(),
        });
        const updated = {
          userId: memberId,
          date: dateStr,
          status: status,
          updatedAt: new Date()
        };
        setDetailAvailability(prev => {
          const filtered = prev.filter(a => a.date !== dateStr);
          return [...filtered, updated];
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, availabilityPath);
    }
  };

  const toggleMemberFinishedStatus = async (member: any) => {
    if (!isAdmin) return;
    try {
      const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const statusMap = member.availabilityStatus || {};
      const isFinished = statusMap[currentMonthStr] === 'finished';
      
      const newStatusMap = {
        ...statusMap,
        [currentMonthStr]: isFinished ? 'pending' : 'finished'
      };
      
      const memberRef = doc(db, 'members', member.id);
      await updateDoc(memberRef, {
        availabilityStatus: newStatusMap,
        lastAvailabilityUpdate: serverTimestamp()
      });
      
      setDetailMember(prev => ({
        ...prev,
        availabilityStatus: newStatusMap
      }));
    } catch (e) {
      console.error("Erro ao alterar status de conclusão:", e);
      alert("Erro ao alterar status de conclusão.");
    }
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const startStr = `${year}-${month}-01`;
      
      const nextMonthDate = new Date(year, currentDate.getMonth() + 1, 1);
      const nextYear = nextMonthDate.getFullYear();
      const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
      const endStr = `${nextYear}-${nextMonth}-01`;

      const qAllAvail = query(
        collection(db, 'availability'),
        where('date', '>=', startStr),
        where('date', '<', endStr)
      );
      const snapAllAvail = await getDocs(qAllAvail);
      const allAvailDocs = snapAllAvail.docs.map(doc => doc.data());

      const excelData = finishedMembers.map(m => {
        const memberAvailDocs = allAvailDocs.filter(doc => doc.userId === m.id && doc.status === 'available');
        const sortedDates = memberAvailDocs
          .map(doc => doc.date)
          .sort((a, b) => a.localeCompare(b));
        
        const formattedDates = sortedDates.map(dateStr => {
          const [yr, mo, dy] = dateStr.split('-');
          const dateObj = new Date(parseInt(yr, 10), parseInt(mo, 10) - 1, parseInt(dy, 10));
          const weekdayStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
          return `${dy}/${mo} (${weekdayStr})`;
        }).join(', ');

        const rolesStr = Array.isArray(m.roles) ? m.roles.join(', ') : m.roles || '';

        return {
          "Nome do Ministro": m.name || m.email?.split('@')[0] || '',
          "E-mail": m.email || '',
          "WhatsApp": m.whatsapp || '',
          "Instrumentos / Funções": rolesStr,
          "Dias Disponíveis": formattedDates,
          "Quantidade de Dias": sortedDates.length,
          "Mês de Referência": currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        };
      });

      if (excelData.length === 0) {
        alert("Nenhum ministro marcou a disponibilidade ainda para este mês.");
        return;
      }

      exportJsonToExcel(
        excelData,
        `Disponibilidade_Marcaram_${month}_${year}`,
        "Disponibilidade"
      );
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      alert("Ocorreu um erro ao exportar o arquivo Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleSendAvailabilityEmailReport = async () => {
    try {
      let recipients: string[] = [];
      const settingsSnap = await getDoc(doc(db, 'settings', 'notifications'));
      if (settingsSnap.exists()) {
        const sd = settingsSnap.data();
        if (sd.adminEmail && sd.adminEmail.trim()) recipients.push(sd.adminEmail.trim());
        if (sd.adminEmail2 && sd.adminEmail2.trim()) recipients.push(sd.adminEmail2.trim());
        if (sd.adminEmail3 && sd.adminEmail3.trim()) recipients.push(sd.adminEmail3.trim());
      }
      if (recipients.length === 0) {
        const adminMembers = allMembers.filter(m => (m.isAdmin || m.email === 'mikmellorg@gmail.com') && m.email);
        adminMembers.forEach(a => { if (a.email && !recipients.includes(a.email)) recipients.push(a.email); });
      }

      const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      let bodyText = `🗓️ RELATÓRIO DE DISPONIBILIDADE DA EQUIPE DE LOUVOR\n`;
      bodyText += `Período: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}\n\n`;
      bodyText += `📊 RESUMO DE PARTICIPAÇÃO:\n`;
      bodyText += `• Total de Ministros Ativos: ${activeMembers.length}\n`;
      bodyText += `• Ministros Concluídos: ${finishedMembers.length}\n`;
      bodyText += `• Ministros Pendentes: ${missingMembers.length}\n\n`;

      if (missingMembers.length > 0) {
        bodyText += `⚠️ MEMBROS PENDENTES DE MARCAÇÃO:\n`;
        missingMembers.forEach(m => {
          bodyText += `• ${m.name || m.email}\n`;
        });
      } else {
        bodyText += `🎉 Todos os ministros já concluíram a marcação de disponibilidade!\n`;
      }

      bodyText += `\n_Relatório gerado via LiLouPro_`;

      const recipientStr = recipients.length > 0 ? recipients.join(',') : '';
      const subject = `🗓️ Relatório de Disponibilidade - ${monthName} - LiLouPro`;
      const mailtoUrl = `mailto:${recipientStr}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      window.open(mailtoUrl, '_self');
    } catch (e) {
      console.error("Erro ao preparar e-mail:", e);
      alert("Ocorreu um erro ao preparar o e-mail de relatório.");
    }
  };

  const handleDownloadMonthlyAvailabilityPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const startStr = `${year}-${month}-01`;
      
      const nextMonthDate = new Date(year, currentDate.getMonth() + 1, 1);
      const nextYear = nextMonthDate.getFullYear();
      const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
      const endStr = `${nextYear}-${nextMonth}-01`;

      const qAllAvail = query(
        collection(db, 'availability'),
        where('date', '>=', startStr),
        where('date', '<', endStr)
      );
      const snapAllAvail = await getDocs(qAllAvail);
      const allAvailDocs = snapAllAvail.docs.map(doc => doc.data());

      const availMapByDate: Record<string, string[]> = {};
      allAvailDocs.filter(d => d.status === 'available').forEach(doc => {
        if (!availMapByDate[doc.date]) {
          availMapByDate[doc.date] = [];
        }
        availMapByDate[doc.date].push(doc.userId);
      });

      const sortedServices = [...services].sort((a, b) => a.date.localeCompare(b.date));

      const doc = new jsPDF();
      
      // Header Banner
      doc.setFillColor(6, 11, 31);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      doc.text(`Relatório de Disponibilidade dos Ministros`, 14, 18);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Período da Escala: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, 14, 26);
      doc.setFontSize(9);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 33);

      // Section 1: Resume / Metadata Overview
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo de Participação", 14, 52);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Total de Ministros Ativos: ${activeMembers.length}`, 14, 59);
      doc.text(`Ministros que marcaram disponibilidade: ${finishedMembers.length}`, 14, 65);
      doc.text(`Ministros com marcação pendente (faltantes): ${missingMembers.length}`, 14, 71);

      // Border Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 76, 196, 76);

      // Section 2: Detailed day-by-day availability
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Detalhamento por Dia de Culto", 14, 85);

      const tableData: any[][] = [];
      sortedServices.forEach(service => {
        const sDateObj = new Date(service.date);
        const formattedDate = sDateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' });
        const formattedTime = sDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const dateKey = service.date.split('T')[0];
        const availableUserIds = availMapByDate[dateKey] || [];
        
        const availableNames = availableUserIds
          .map(uId => {
            const memberObj = activeMembers.find(m => m.id === uId || m.uid === uId);
            if (!memberObj) return null;
            const rawName = memberObj.name || memberObj.email?.split('@')[0] || '';
            const formattedName = getFormatNameForPdf(rawName);
            const rolesStr = Array.isArray(memberObj.roles) && memberObj.roles.length > 0
              ? ` (${memberObj.roles.slice(0, 2).join(', ')})`
              : '';
            return `${formattedName}${rolesStr}`;
          })
          .filter(Boolean);

        const availableNamesStr = availableNames.length > 0 
          ? availableNames.join('\n') 
          : 'Nenhum ministro marcado como disponível para este dia';

        tableData.push([
          `${formattedDate}\n(${formattedTime})`,
          service.title,
          availableNames.length,
          availableNamesStr
        ]);
      });

      autoTable(doc, {
        startY: 91,
        head: [['Data / Hora', 'Culto', 'Qtd', 'Ministros Disponíveis']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [43, 169, 184], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
        },
        styles: { 
          fontSize: 8.5, 
          cellPadding: 4,
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
          valign: 'top',
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: 'bold' },
          1: { cellWidth: 40 },
          2: { cellWidth: 12, halign: 'center' },
          3: { cellWidth: 'auto' }
        }
      });

      // Section 3: Overall member status on a second page
      doc.addPage();
      doc.setFillColor(6, 11, 31);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Status Geral de Todos os Ministros de Escala", 14, 13);

      const memberRows: any[][] = [];
      activeMembers.forEach(member => {
        const isFin = finishedMembers.some(m => m.id === member.id);
        const userAvails = allAvailDocs.filter(d => d.userId === member.id && d.status === 'available');
        const totalAvailsStr = isFin 
          ? `${userAvails.length} dia(s) livre(s)`
          : 'Não marcou';

        const rawName = member.name || member.email || '';
        memberRows.push([
          getFormatNameForPdf(rawName),
          Array.isArray(member.roles) ? member.roles.join(', ') : member.roles || '-',
          isFin ? 'CONCLUÍDO' : 'PENDENTE',
          totalAvailsStr
        ]);
      });

      memberRows.sort((a, b) => {
        if (a[2] === b[2]) {
          return a[0].localeCompare(b[0]);
        }
        return a[2] === 'CONCLUÍDO' ? -1 : 1;
      });

      autoTable(doc, {
        startY: 28,
        head: [['Ministro', 'Instrumentos / Funções', 'Status', 'Dias Disponíveis']],
        body: memberRows,
        theme: 'striped',
        headStyles: { 
          fillColor: [6, 11, 31], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8.5, 
          cellPadding: 4 
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 65 },
          2: { 
            cellWidth: 30, 
            halign: 'center',
            fontStyle: 'bold'
          },
          3: { cellWidth: 'auto', halign: 'center' }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const val = data.cell.raw;
            if (val === 'CONCLUÍDO') {
              data.cell.styles.textColor = [34, 197, 94];
            } else {
              data.cell.styles.textColor = [234, 179, 8];
            }
          }
        }
      });

      doc.save(`Acompanhamento_Disponibilidade_${month}_${year}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const startStr = `${year}-${month}-01T00:00`;
    
    // End of month should be the start of the next month to cover everything
    const nextMonthDate = new Date(year, currentDate.getMonth() + 1, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    const endStr = `${nextYear}-${nextMonth}-01T00:00`;
    
    // All members for context
    const memberPath = 'members';
    const unsubMembers = onSnapshot(collection(db, memberPath), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const filtered = docs.filter(m => m.churchId === userChurchId || (!m.churchId && userChurchId === 'semente'));
      setAllMembers(filtered);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, memberPath);
    });

    // Scheduled services for context
    const servicePath = 'services';
    const qServices = query(
      collection(db, servicePath),
      where('date', '>=', startStr),
      where('date', '<', endStr),
      orderBy('date', 'asc')
    );

    const unsubServices = onSnapshot(qServices, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const filtered = docs.filter(s => s.churchId === userChurchId || (!s.churchId && userChurchId === 'semente'));
      setServices(filtered);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, servicePath);
    });

    // Personal availability
    const availabilityPath = 'availability';
    const qAvail = query(
      collection(db, availabilityPath),
      where('userId', '==', user.uid),
      where('date', '>=', startStr.split('T')[0]),
      where('date', '<', endStr.split('T')[0])
    );

    const unsubAvail = onSnapshot(qAvail, (snap) => {
      setAvailabilities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, availabilityPath);
    });

    // Lock status for the current month
    const currentMonthStr = `${year}-${month}`;
    const lockRef = doc(db, 'availability_locks', currentMonthStr);
    const unsubLock = onSnapshot(lockRef, (snap) => {
      if (snap.exists()) {
        setLockStatus(snap.data());
      } else {
        setLockStatus({ unlocked: false });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `availability_locks/${currentMonthStr}`);
    });

    return () => {
      unsubMembers();
      unsubServices();
      unsubAvail();
      unsubLock();
    };
  }, [currentDate, user, userChurchId]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  useEffect(() => {
    if (!lockStatus || !lockStatus.unlocked || !lockStatus.deadline) {
      setTimeLeft('');
      return;
    }

    const calculateTimeLeft = () => {
      const deadlineTime = new Date(lockStatus.deadline).getTime();
      const diff = deadlineTime - Date.now();

      if (diff <= 0) {
        setTimeLeft('expired');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [lockStatus]);

  const isLocked = !lockStatus?.unlocked || timeLeft === 'expired';

  const setDayAvailability = async (date: Date, status: 'available' | 'unavailable') => {
    if (!user) return;
    if (isLocked) {
      alert("A marcação de disponibilidade para este mês está bloqueada no momento.");
      return;
    }
    const dateStr = getLocalDateString(date);
    const availabilityPath = 'availability';
    const availabilityId = `${user.uid}_${dateStr}`;
    
    try {
      const availRef = doc(db, availabilityPath, availabilityId);
      const existingStatus = availabilities.find(a => a.date === dateStr)?.status;
      
      if (existingStatus === status) {
        await deleteDoc(availRef);
      } else {
        await setDoc(availRef, {
          userId: user.uid,
          date: dateStr,
          status: status,
          updatedAt: serverTimestamp(),
        });
      }

      // Reset monthly status to pending on change so they are forced to finalize and notify again
      const currentUserData = allMembers.find(m => m.id === user.uid);
      const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      if (currentUserData?.availabilityStatus?.[currentMonthStr] === 'finished') {
        const updatedStatus = { ...(currentUserData.availabilityStatus || {}) };
        delete updatedStatus[currentMonthStr];
        await updateDoc(doc(db, 'members', user.uid), {
          availabilityStatus: updatedStatus
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, availabilityPath);
    }
  };

  const activeLockHours = useMemo(() => {
    if (lockStatus?.hours) return Number(lockStatus.hours);
    if (lockStatus?.deadline && lockStatus?.unlockedAt) {
      const start = new Date(lockStatus.unlockedAt).getTime();
      const end = new Date(lockStatus.deadline).getTime();
      const diffHours = Math.round((end - start) / (1000 * 60 * 60));
      if (diffHours > 0) return diffHours;
    }
    return unlockHours || 48;
  }, [lockStatus, unlockHours]);

  const handleToggleAvailabilityLock = async () => {
    const wantToUnlock = isLocked;

    try {
      const lockRef = doc(db, 'availability_locks', currentMonthStr);
      if (wantToUnlock) {
        const hoursToSet = unlockHours > 0 ? unlockHours : 48;
        const unlockedAt = new Date().toISOString();
        const deadline = new Date(Date.now() + hoursToSet * 60 * 60 * 1000).toISOString();
        
        await setDoc(lockRef, {
          unlocked: true,
          unlockedAt,
          deadline,
          hours: hoursToSet,
        });

        // Trigger notifications to everyone
        if (createNotifications) {
          const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          const hoursFormatted = hoursToSet >= 24 && hoursToSet % 24 === 0 
            ? `${hoursToSet / 24} dia${hoursToSet / 24 > 1 ? 's' : ''}` 
            : `${hoursToSet} horas`;
          await createNotifications(
            "🗓️ Marcação do Mês Liberada!",
            `A marcação de disponibilidade para o mês de ${monthName} foi liberada! Você tem ${hoursFormatted} (${hoursToSet}h) para preencher seus dias livres.`,
            "announcement"
          );
        }
      } else {
        await setDoc(lockRef, {
          unlocked: false,
          hours: activeLockHours,
        });
      }
    } catch (e) {
      console.error("Erro ao alterar o status de bloqueio do calendário:", e);
    }
  };

  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const activeMembers = useMemo(() => {
    return allMembers.filter(m => Array.isArray(m.roles) && m.roles.length > 0);
  }, [allMembers]);

  const finishedMembers = useMemo(() => {
    return activeMembers.filter(m => m.availabilityStatus?.[currentMonthStr] === 'finished');
  }, [activeMembers, currentMonthStr]);

  const missingMembers = useMemo(() => {
    return activeMembers.filter(m => m.availabilityStatus?.[currentMonthStr] !== 'finished');
  }, [activeMembers, currentMonthStr]);

  const currentUserData = allMembers.find(m => m.id === user?.uid);
  const isFinished = currentUserData?.availabilityStatus?.[currentMonthStr] === 'finished';

  const availableDaysCount = availabilities.filter(a => a.status === 'available').length;
  const daysWithServices = services.map(s => new Date(s.date).getDate());

  const handleFinishAvailability = async () => {
    if (!user || isFinished) return;
    setIsFinishing(true);
    
    try {
      const memberPath = `members/${user.uid}`;
      const statusMap = currentUserData?.availabilityStatus || {};
      
      // Mark as finished in database
      await updateDoc(doc(db, 'members', user.uid), {
        availabilityStatus: {
          ...statusMap,
          [currentMonthStr]: 'finished'
        },
        lastAvailabilityUpdate: serverTimestamp()
      });

      // Calculate missing members
      const localActiveMembers = allMembers.filter(m => Array.isArray(m.roles) && m.roles.length > 0);
      const localFinishedMembers = localActiveMembers.filter(m => m.availabilityStatus?.[currentMonthStr] === 'finished');
      const localMissingMembers = localActiveMembers.filter(m => m.availabilityStatus?.[currentMonthStr] !== 'finished' && m.id !== user.uid);
      
      const missingCount = localMissingMembers.length;
      const finishedCount = localFinishedMembers.length + 1; // including current user
      
      // Get Admin phones and emails from settings and members list
      let adminTargets: { name: string; phone: string }[] = [];
      let adminEmailTargets: { name: string; email: string }[] = [];
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'notifications'));
        if (settingsSnap.exists()) {
          const sd = settingsSnap.data();
          if (sd.whatsappAdmin) {
            const p = cleanWhatsapp(sd.whatsappAdmin);
            if (p) {
              const matchingMember = allMembers.find(m => m.whatsapp && cleanWhatsapp(m.whatsapp) === p);
              adminTargets.push({
                name: matchingMember?.name || 'Administrador Principal',
                phone: p
              });
            }
          }
          if (sd.whatsappAdmin2) {
            const p2 = cleanWhatsapp(sd.whatsappAdmin2);
            if (p2) {
              const matchingMember = allMembers.find(m => m.whatsapp && cleanWhatsapp(m.whatsapp) === p2);
              adminTargets.push({
                name: matchingMember?.name || 'Administrador Auxiliar 1',
                phone: p2
              });
            }
          }
          if (sd.whatsappAdmin3) {
            const p3 = cleanWhatsapp(sd.whatsappAdmin3);
            if (p3) {
              const matchingMember = allMembers.find(m => m.whatsapp && cleanWhatsapp(m.whatsapp) === p3);
              adminTargets.push({
                name: matchingMember?.name || 'Administrador Auxiliar 2',
                phone: p3
              });
            }
          }

          if (sd.adminEmail && sd.adminEmail.trim()) {
            adminEmailTargets.push({ name: 'Administrador Principal', email: sd.adminEmail.trim() });
          }
          if (sd.adminEmail2 && sd.adminEmail2.trim()) {
            adminEmailTargets.push({ name: 'Administrador Auxiliar 1', email: sd.adminEmail2.trim() });
          }
          if (sd.adminEmail3 && sd.adminEmail3.trim()) {
            adminEmailTargets.push({ name: 'Administrador Auxiliar 2', email: sd.adminEmail3.trim() });
          }
        }
      } catch (e) {
        console.log("Using fallback admin phones and emails");
      }

      // Fallback from members where isAdmin is true if not configured
      if (adminTargets.length === 0 || adminEmailTargets.length === 0) {
        const adminMembers = allMembers.filter(m => m.isAdmin === true || m.email === 'mikmellorg@gmail.com');
        adminMembers.forEach(a => {
          const phone = cleanWhatsapp(a.whatsapp || '');
          if (phone && adminTargets.length === 0) {
            adminTargets.push({
              name: a.name || 'Coordenador',
              phone: phone
            });
          }
          if (a.email && adminEmailTargets.length === 0) {
            adminEmailTargets.push({
              name: a.name || 'Coordenador',
              email: a.email
            });
          }
        });
      }

      // Create message
      let message = `*🗓️ DISPONIBILIDADE CONCLUÍDA*\n\n`;
      message += `O membro *${currentUserData?.name || currentUserData?.email || 'Membro'}* acabou de concluir a sua marcação de disponibilidade para o mês de *${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}*.\n\n`;
      
      message += `📊 *CONTAGEM GERAL:*\n`;
      message += `✅ Marcaram: *${finishedCount} de ${localActiveMembers.length}*\n`;
      message += `⏳ Faltando marcar: *${missingCount} de ${localActiveMembers.length}*\n\n`;
      
      if (missingCount > 0) {
        message += `⚠️ *MEMBROS PENDENTES DE MARCAÇÃO:*\n`;
        localMissingMembers.forEach(m => {
          message += `• ${m.name || m.email}\n`;
        });
      } else {
        message += `🎉 *TODOS OS MEMBROS CONCLUÍRAM!* A escala de ministros já pode ser elaborada e editada no painel administrativo.`;
      }

      message += `\n\n_Enviado via LiLouPro_`;

      const encodedMessage = encodeURIComponent(message);
      
      // Also write in-app notifications for ALL administrators to ensure they never miss it!
      const adminUsersDocs = allMembers.filter(m => m.isAdmin === true || m.email === 'mikmellorg@gmail.com');
      const inAppNotificationsPromises = adminUsersDocs.map(admin => {
        const adminUserId = admin.id || admin.uid;
        if (!adminUserId || adminUserId === user.uid) return Promise.resolve();
        return addDoc(collection(db, 'notifications'), {
          userId: adminUserId,
          title: `🗓️ Disponibilidade de ${currentUserData?.name || 'Membro'}`,
          content: `${currentUserData?.name || 'Um ministro'} acabou de concluir a sua marcação para ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.`,
          type: 'general',
          read: false,
          createdAt: serverTimestamp()
        });
      });
      await Promise.all(inAppNotificationsPromises);

      // Store success state and show the popup dialog
      setSubmissionStatus({
        success: true,
        message: message,
        admins: adminTargets,
        adminEmails: adminEmailTargets
      });

      // Attempt popup for the first admin immediately
      if (adminTargets.length > 0) {
        try {
          const firstAdmin = adminTargets[0];
          const waUrl = `https://wa.me/${firstAdmin.phone}?text=${encodedMessage}`;
          const confirmMsg = `Sua disponibilidade para ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} foi salva com sucesso!\n\nDeseja abrir o WhatsApp agora para enviar a mensagem de notificação para o coordenador ${firstAdmin.name}?`;
          
          if (window.confirm(confirmMsg)) {
            window.open(waUrl, '_blank');
          }
        } catch (e) {
          console.log("Auto-popup blocked, user will use the modal buttons.");
        }
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `members/${user?.uid}`);
    } finally {
      setIsFinishing(false);
    }
  };

  const getServicesForDay = (day: number) => {
    const dayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return services.filter(s => s.date.startsWith(dayStr));
  };

  const getAvailabilityForDay = (day: number) => {
    const dateStr = getLocalDateString(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    return availabilities.find(a => a.date === dateStr);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
       <div className="flex flex-col items-center justify-center text-center gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-text-main tracking-tight">Minha Disponibilidade</h1>
            <p className="text-text-main text-lg font-bold">Marque todos os seus dias livres para facilitar a criação da escala.</p>
          </div>
          
          <div className="w-full max-w-xl text-left">
            <ContextualHelp 
              id="availability"
              title="Disponibilidade: Como marcar?"
              description="A marcação de disponibilidade permite que a liderança crie escalas justas sem conflitos e sem a necessidade de perguntar um a um no WhatsApp."
              steps={[
                "Utilize os botões do Mês de Referência para planejar o mês correto.",
                "Clique em qualquer dia do calendário para alternar o status: Disponível (Verde), Parcialmente Disponível (Amarelo) ou Indisponível (Vermelho).",
                "Ao terminar de marcar, clique no botão 'Finalizar Envio' abaixo para notificar os líderes e confirmar sua participação."
              ]}
              tip="Mantenha sua agenda sempre atualizada! Se surgir um imprevisto ou viagem, você pode atualizar suas datas a qualquer momento antes do fechamento da escala."
              theme={theme}
            />
          </div>
          
          <div className="w-full max-w-4xl grid sm:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col items-center justify-center border-border bg-card/50">
               <span className="text-[10px] font-black uppercase tracking-widest text-text-main mb-1">Mês de Referência</span>
               <div className="flex items-center gap-2">
                 <button onClick={prevMonth} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-text-main transition-colors"><ChevronLeft size={18}/></button>
                 <span className="font-black text-text-main uppercase text-xs tracking-tight">
                   {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                 </span>
                 <button onClick={nextMonth} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-text-main transition-colors"><ChevronRight size={18}/></button>
               </div>
            </Card>
 
            <Card className={cn(
              "p-4 flex flex-col items-center justify-center border-border transition-all",
              isFinished ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10 border-yellow-500/20"
            )}>
               <span className="text-[10px] font-black uppercase tracking-widest text-text-main mb-1">Status do Mês</span>
               <div className="flex items-center gap-2">
                 <div className={cn("w-2 h-2 rounded-full animate-pulse", isFinished ? "bg-green-500" : "bg-yellow-500")} />
                 <span className={cn("font-black text-xs uppercase", isFinished ? "text-green-500" : "text-yellow-600 dark:text-yellow-400")}>
                   {isFinished ? "Concluído" : "Pendente"}
                 </span>
               </div>
            </Card>
 
            <Card className="p-4 flex flex-col items-center justify-center border-border bg-brand/5">
               <span className="text-[10px] font-black uppercase tracking-widest text-text-main mb-1">Status Marcação</span>
               <div className="flex items-center gap-2">
                 <span className="font-black text-text-main text-lg leading-none">{availableDaysCount}</span>
                 <span className="text-[10px] font-bold text-text-main uppercase">Dias Disponíveis</span>
               </div>
            </Card>

            <Card className={cn(
              "p-4 flex flex-col items-center justify-center border-border transition-all",
              isLocked ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"
            )}>
               <span className="text-[10px] font-black uppercase tracking-widest text-text-main mb-1">Período de Marcação</span>
               <div className="flex flex-col items-center gap-1">
                 <div className="flex items-center gap-2">
                   {isLocked ? <Lock size={14} className="text-red-500" /> : <Unlock size={14} className="text-green-500" />}
                   <span className={cn("font-black text-xs uppercase", isLocked ? "text-red-500" : "text-green-500")}>
                     {isLocked ? (timeLeft === 'expired' ? "Prazo Expirado" : "Bloqueado") : "Liberado"}
                   </span>
                 </div>
                 {!isLocked && timeLeft && (
                   <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-green-500/90 dark:text-green-400">
                     <Timer size={10} className="animate-pulse" />
                     <span>{timeLeft}</span>
                   </div>
                 )}
               </div>
            </Card>
          </div>

          {isAdmin && (
            <div className="w-full max-w-4xl p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className={cn("p-2.5 rounded-xl shrink-0", isLocked ? "bg-red-500/15 text-red-500" : "bg-green-500/15 text-green-500")}>
                  {isLocked ? <Lock size={22} /> : <Unlock size={22} />}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-wider text-text-main flex items-center gap-2 flex-wrap">
                    Controle de Marcação (Admin)
                    <span className="text-[10px] bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded-md font-bold">
                      Prazo: {activeLockHours >= 24 && activeLockHours % 24 === 0 ? `${activeLockHours / 24}d (${activeLockHours}h)` : `${activeLockHours}h`}
                    </span>
                  </p>
                  <p className="text-[11px] font-bold text-text-muted mt-0.5">
                    {isLocked 
                      ? (timeLeft === 'expired' 
                          ? `O prazo de ${activeLockHours}h expirou. A marcação automática de disponibilidade para os membros está encerrada.` 
                          : "A marcação de disponibilidade está bloqueada.")
                      : `A marcação de disponibilidade está liberada (${activeLockHours}h). Restam: ${timeLeft || 'carregando...'}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                {isLocked && (
                  <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 border border-border p-1.5 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-muted px-1 hidden sm:inline">Tempo de Liberação:</span>
                    <select
                      value={presetHours}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPresetHours(val);
                        if (val !== 'custom') {
                          const num = Number(val);
                          setUnlockHours(num);
                          localStorage.setItem('app-availability-unlock-hours', String(num));
                        }
                      }}
                      className="bg-card text-text-main text-xs font-bold rounded-lg p-1.5 border border-border outline-none cursor-pointer"
                    >
                      <option value="12">12 horas (1/2 dia)</option>
                      <option value="24">24 horas (1 dia)</option>
                      <option value="48">48 horas (2 dias - Padrão)</option>
                      <option value="72">72 horas (3 dias)</option>
                      <option value="120">120 horas (5 dias)</option>
                      <option value="168">168 horas (7 dias / 1 semana)</option>
                      <option value="custom">Personalizado...</option>
                    </select>

                    {presetHours === 'custom' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="720"
                          value={unlockHours}
                          onChange={(e) => {
                            const val = Math.max(1, Math.min(720, Number(e.target.value) || 1));
                            setUnlockHours(val);
                            localStorage.setItem('app-availability-unlock-hours', String(val));
                          }}
                          className="w-16 bg-card text-text-main text-xs font-bold rounded-lg p-1.5 border border-border outline-none text-center"
                          placeholder="Horas"
                        />
                        <span className="text-xs font-bold text-text-muted pr-1">h</span>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleToggleAvailabilityLock}
                  className={cn(
                    "px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl border flex items-center gap-2 transition-all cursor-pointer shadow-md",
                    isLocked 
                      ? "bg-green-600 hover:bg-green-500 text-white border-green-500/30 hover:scale-105" 
                      : "bg-red-600 hover:bg-red-500 text-white border-red-500/30 hover:scale-105"
                  )}
                >
                  {isLocked ? (
                    <>
                      <Unlock size={14} /> Liberar Marcação ({unlockHours}h)
                    </>
                  ) : (
                    <>
                      <Lock size={14} /> Bloquear Marcação
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {!isFinished && !isLocked && availabilities.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-4xl p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left flex items-start gap-3 shadow-sm select-none"
            >
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-black uppercase text-amber-500 tracking-wider">Lembrete de Envio Importante ⚠️</p>
                <p className="text-[11px] font-bold text-text-muted mt-1 leading-normal">
                  Suas marcações estão salvas temporariamente na grade, mas a coordenação continuará vendo seu status como <span className="text-amber-500 font-black underline">PENDENTE</span> no dashboard até que você finalize seu envio.
                  Para que os administradores recebam as notificações e elaborem a escala, por favor, clique no botão <span className="font-extrabold text-text-main">“Finalizar e Notificar Liderança”</span> abaixo para concluir.
                </p>
              </div>
            </motion.div>
          )}

          <div className="flex items-center justify-center">
            <Button
              onClick={handleFinishAvailability}
              disabled={isFinishing || isFinished || isLocked}
              className={cn(
                "px-10 py-3 shadow-xl transition-all font-black uppercase tracking-widest text-[10px] h-12 rounded-xl border group",
                isFinished 
                  ? "bg-green-500 border-green-400 text-white cursor-default" 
                  : (isLocked ? "bg-card border-border text-text-muted cursor-not-allowed opacity-50" : "bg-brand hover:scale-105 border-brand shadow-brand/20")
              )}
            >
              {isFinished ? (
                <div className="flex items-center gap-2">
                  <Check size={18} strokeWidth={3} /> Disponibilidade Enviada
                </div>
              ) : isFinishing ? (
                <div className="flex items-center gap-2">
                  <RefreshCcw size={16} className="animate-spin" /> Notificando Admin...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send size={16} /> Finalizar e Notificar Liderança
                </div>
              )}
            </Button>
          </div>
       </div>

       <div className="grid lg:grid-cols-2 gap-8">
          <Card className="p-6 sm:p-8 bg-card backdrop-blur-md border border-border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Calendar size={120} />
            </div>
            
            <div className="grid grid-cols-7 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((d, i) => (
                <div key={d} className={cn("text-center text-[10px] font-black uppercase tracking-widest pb-4", i === 0 ? "text-red-400" : "text-text-main/90")}>
                  {d}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {blanks.map(b => <div key={`b-${b}`} className="aspect-square"></div>)}
              {days.map(d => {
                const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                const dayServices = getServicesForDay(d);
                const availability = getAvailabilityForDay(d);
                const isSunday = dayDate.getDay() === 0;
                const isToday = new Date().toDateString() === dayDate.toDateString();
                const isSelected = selectedDate?.getDate() === d && selectedDate?.getMonth() === currentDate.getMonth();
                const hasServices = dayServices.length > 0;
 
                return (
                  <button 
                    key={d} 
                    onClick={() => setSelectedDate(dayDate)}
                    className={cn(
                      "aspect-square rounded-xl border transition-all flex flex-col items-center justify-center relative group p-1",
                      hasServices && !isSelected ? "border-blue-500/60 bg-blue-500/10 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/5 text-blue-500 dark:text-blue-300" 
                        : (isSunday ? "bg-red-500/5 border-red-500/10 text-red-600 dark:text-red-100" : "bg-black/5 dark:bg-white/5 border-border text-text-main font-black"),
                      isSelected ? "ring-2 ring-brand border-brand bg-brand/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "hover:bg-black/10 dark:hover:bg-white/10 hover:border-text-muted/20",
                      isToday && "bg-brand/10 border-brand/50 ring-1 ring-brand/30"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-black relative z-10", 
                      (isSunday && !hasServices) && "text-red-400", 
                      hasServices && "text-blue-500 dark:text-blue-300",
                      isToday && "text-brand"
                    )}>{d}</span>
                    
                    {hasServices && (
                       <div className="absolute top-1 right-1 opacity-40 group-hover:opacity-100 transition-opacity">
                         <Star size={8} fill="currentColor" className="text-blue-400" />
                       </div>
                    )}

                    <div className="flex flex-col items-center gap-1 mt-1">
                      {availability && (
                         <div className={cn(
                           "w-1.5 h-1.5 rounded-full shadow-sm",
                           availability.status === 'available' ? "bg-green-400" : "bg-red-500"
                         )} />
                      )}
                      {dayServices.length > 0 && (
                        <div className="flex gap-0.5">
                          {dayServices.map(s => (
                            <div key={s.id} className="w-1 h-1 rounded-full bg-blue-400/50" />
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 text-[10px] font-black uppercase tracking-widest text-text-main">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400" /> Disponível</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> Indisponível</div>
              <div className="flex items-center gap-2 sm:col-span-1 border-l sm:border-l pl-3 border-border"><div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" /> Culto Agendado</div>
            </div>
          </Card>

          <div className="space-y-4">
             {selectedDate ? (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-end justify-between px-1">
                    <h3 className="text-xl font-black text-text-main tracking-tight">
                      {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                  </div>
                  
                  <Card className="p-6 bg-card border-border shadow-xl">
                    <p className="text-[16px] font-black text-text-main uppercase tracking-widest mb-4 text-center">Minha Disponibilidade Geral</p>
                    {isLocked && (
                      <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-center">
                        <p className="text-xs font-black text-red-500 flex items-center justify-center gap-1.5 leading-tight">
                          <Lock size={12} />
                          {timeLeft === 'expired' 
                            ? `Prazo de ${activeLockHours}h expirou. Marcação bloqueada.` 
                            : "Calendário bloqueado pelo administrador."}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {(['available', 'unavailable'] as const).map(status => {
                        const dateStr = getLocalDateString(selectedDate);
                        const isActive = availabilities.find(a => a.date === dateStr)?.status === status;
                        return (
                          <button
                            key={status}
                            onClick={() => setDayAvailability(selectedDate, status)}
                            disabled={isLocked}
                            className={cn(
                              "py-4 px-2 rounded-2xl flex flex-col items-center justify-center transition-all border gap-2 group",
                              isActive 
                                ? (status === 'available' ? "bg-green-500 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "bg-red-500 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]")
                                : "bg-black/5 dark:bg-white/5 border-border text-text-main font-black hover:bg-black/10 hover:border-brand/40",
                              isLocked && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {status === 'available' ? <Check size={20} strokeWidth={3}/> : <X size={20} strokeWidth={3}/>}
                            <span className="text-[14px] font-black uppercase tracking-widest">
                              {status === 'available' ? 'Conte comigo' : 'Não posso'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Card>

                  {getServicesForDay(selectedDate.getDate()).length > 0 && (
                    <div className="space-y-4">
                      <p className="text-[12px] font-black text-text-main uppercase tracking-widest pl-1">Cultos agendados para este dia:</p>
                      {getServicesForDay(selectedDate.getDate()).map(service => (
                        <Card key={service.id} className="p-5 border-border bg-card flex items-center justify-between group">
                          <div>
                            <h4 className="font-black text-text-main text-lg tracking-tight">{service.title}</h4>
                            <p className="text-xs text-text-main font-black mt-1 flex items-center gap-1.5 ">
                               <Clock size={12} className="text-text-main"/>
                               {new Date(service.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex -space-x-1.5 overflow-hidden">
                             {(() => {
                               const matchedIds = Array.from(new Set(Object.values(service.scales || {}).flat().filter(Boolean) as string[]));
                               return matchedIds.slice(0, 4).map((memberId) => {
                                 const m = allMembers.find(mem => mem.id === memberId || mem.uid === memberId);
                                 return (
                                   <div 
                                     key={memberId} 
                                     className="w-7 h-7 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-[10px] font-black text-brand overflow-hidden shrink-0 relative"
                                     title={m?.name || "Integrante"}
                                   >
                                     <CachedAvatar 
                                       photoUrl={m?.photoUrl} 
                                       alt={m?.name} 
                                       className="w-full h-full" 
                                       fallbackText={m?.name}
                                     />
                                   </div>
                                 );
                               });
                             })()}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
               </div>
             ) : (
               <div className="h-full flex items-center justify-center p-10 text-center border-2 border-dashed border-border rounded-3xl opacity-50">
                  <div className="max-w-xs space-y-4">
                       <Calendar size={48} className="mx-auto text-text-main" />
                     <p className="text-sm text-text-main font-black italic">Selecione um dia no calendário para gerenciar sua disponibilidade.</p>
                  </div>
               </div>
             )}
          </div>
       </div>

       {/* Painel de Acompanhamento de Marcações */}
       {isAdmin && (
         <Card className="p-6 bg-card border-border shadow-xl w-full">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-5 mb-5">
           <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
               <Activity size={22} className="animate-pulse" />
             </div>
             <div className="text-left">
               <h3 className="text-base font-black uppercase tracking-wider text-text-main">Acompanhamento das Marcações</h3>
               <p className="text-[11px] font-bold text-text-muted mt-0.5">Participação dos ministros na escala de {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
             </div>
           </div>
           
           <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
             <div className="flex gap-4 w-full sm:w-auto">
               <div className="flex-1 sm:flex-initial bg-green-500/10 dark:bg-green-500/5 px-4 py-2 rounded-xl border border-green-500/20 text-center min-w-[80px]">
                 <span className="block text-lg font-black text-green-500">{finishedMembers.length}</span>
                 <span className="text-[9px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Concluídos</span>
               </div>
               <div className="flex-1 sm:flex-initial bg-yellow-500/10 dark:bg-yellow-500/5 px-4 py-2 rounded-xl border border-yellow-500/20 text-center font-black min-w-[80px]">
                 <span className="block text-lg font-black text-yellow-600 dark:text-yellow-400">{missingMembers.length}</span>
                 <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">Faltantes</span>
               </div>
             </div>
             
             <Button
               onClick={handleSendAvailabilityEmailReport}
               variant="secondary"
               className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/30 font-black text-[10px] uppercase tracking-widest h-10 px-3.5 rounded-xl shrink-0 inline-flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
             >
               <Mail size={14} />
               <span>Enviar E-mail</span>
             </Button>

             <Button
               onClick={handleDownloadMonthlyAvailabilityPdf}
               disabled={isDownloadingPdf}
               variant="primary"
               className="bg-brand hover:brightness-110 text-white font-black text-[10px] uppercase tracking-widest h-10 px-4 rounded-xl shadow-lg shadow-brand/20 shrink-0 inline-flex items-center justify-center gap-2"
             >
               {isDownloadingPdf ? (
                 <>
                   <RefreshCcw size={14} className="animate-spin" />
                   <span>Gerando PDF...</span>
                 </>
               ) : (
                 <>
                   <Download size={14} />
                   <span>Baixar PDF</span>
                 </>
               )}
             </Button>
           </div>
         </div>

         {/* Lembrete / Cobrança de Disponibilidade (Apenas para Admins) */}
         {isAdmin && missingMembers.length > 0 && (
           <div className="mb-6 p-5 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 text-left space-y-4">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
               <div className="flex items-center gap-2">
                 <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
                 <h4 className="text-xs font-black uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                   Cobrança de Disponibilidade ⏰
                 </h4>
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-text-muted">Prazo termina hoje às:</span>
                 <input 
                   type="text" 
                   value={reminderDeadline} 
                   onChange={e => setReminderDeadline(e.target.value)}
                   placeholder="Ex: 20:00"
                   className="w-20 bg-black/5 dark:bg-white/5 border border-border rounded-lg px-2 py-1 text-xs font-bold text-center text-text-main focus:outline-none focus:ring-1 focus:ring-brand"
                 />
               </div>
             </div>
             
             <div className="space-y-1.5 p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border/60">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                 <label className="text-[10px] font-black uppercase tracking-wider text-text-main">
                   Mensagem de Lembrete Individual (WhatsApp) 💬
                 </label>
                 <span className="text-[8px] font-semibold text-zinc-400 dark:text-zinc-500">
                   Use <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">{`{NOME}`}</code> para o nome do ministro
                 </span>
               </div>
               <textarea
                 value={reminderMessageTemplate}
                 onChange={e => setReminderMessageTemplate(e.target.value)}
                 rows={3}
                 className="w-full bg-white/50 dark:bg-zinc-950/50 border border-border/80 rounded-xl p-2.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-brand leading-relaxed"
                 placeholder="Editar a mensagem que será enviada para o WhatsApp de cada um..."
               />
             </div>

             <p className="text-[11px] text-text-muted font-bold leading-relaxed">
               Personalize o horário e a mensagem do template acima. O botão <span className="text-emerald-500">Lembrete</span> ao lado do nome de cada ministro pendente abrirá o WhatsApp individual com essa mensagem formatada. Use o botão abaixo para copiar o aviso coletivo do grupo.
             </p>

             {getFiveHoursBefore(reminderDeadline) && (
               <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                 💡 No WhatsApp pessoal, a sugestão é disparar o lembrete individual às <span className="font-black underline">{getFiveHoursBefore(reminderDeadline)}</span> (5 horas antes do prazo) para que todos tenham tempo de marcar!
               </div>
             )}

             <div className="flex flex-wrap gap-3 pt-2 border-t border-border/40">
               <Button
                 onClick={handleCopyGroupAnnouncement}
                 className="w-full sm:w-auto h-9 px-4 rounded-xl text-[10px] uppercase font-black tracking-wider inline-flex items-center justify-center gap-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main border border-border"
               >
                 <Copy size={12} />
                 <span>Copiar Chamada de Grupo 📋</span>
               </Button>
             </div>
           </div>
         )}

         <div className="grid md:grid-cols-2 gap-6">
           {/* Concluídos */}
           <div className="space-y-3">
             <div className="flex items-center justify-between gap-2">
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                 <p className="text-xs font-black uppercase tracking-wider text-green-500">
                   Marcaram ({finishedMembers.length})
                 </p>
               </div>
               {finishedMembers.length > 0 && (
                 <button
                   onClick={handleExportExcel}
                   disabled={isExportingExcel}
                   className="p-1.5 px-2.5 bg-emerald-500/10 dark:bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider transition-all scale-95 hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-90"
                   title="Exportar dados e dias disponíveis para Excel"
                 >
                   {isExportingExcel ? (
                     <Loader2 size={11} className="animate-spin text-emerald-500" />
                   ) : (
                     <FileDown size={11} className="text-emerald-650 dark:text-emerald-400" />
                   )}
                   <span>Exportar Excel</span>
                 </button>
               )}
             </div>
             {finishedMembers.length > 0 ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                 {finishedMembers.map(m => (
                   <button 
                     key={m.id} 
                     id={`btn-availability-member-${m.id}`}
                     onClick={() => handleViewAvailabilityDetail(m)}
                     className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-green-500/5 text-green-600 dark:text-green-400 border border-green-500/10 leading-snug truncate hover:bg-green-500/15 hover:border-green-500/30 cursor-pointer text-left active:scale-95 transition-all outline-none"
                     title={`${m.name || m.email} (Clique para ver datas)`}
                   >
                     {m.name || m.email?.split('@')[0]}
                   </button>
                 ))}
               </div>
             ) : (
               <p className="text-xs italic text-text-muted font-bold pl-4">Nenhum ministro marcou ainda.</p>
             )}
           </div>

           {/* Faltantes */}
           <div className="space-y-3">
             <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
               <p className="text-xs font-black uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                 Falta Marcar ({missingMembers.length})
               </p>
             </div>
             {missingMembers.length > 0 ? (
               <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                 {missingMembers.map(m => (
                   <div 
                     key={m.id} 
                     className="flex items-center justify-between p-2 rounded-xl bg-yellow-500/5 border border-yellow-500/10 hover:bg-yellow-500/10 transition-all gap-2"
                   >
                     <button 
                       id={`btn-availability-member-${m.id}`}
                       onClick={() => handleViewAvailabilityDetail(m)}
                       className="text-[11px] font-bold text-yellow-600 dark:text-yellow-400 leading-snug truncate text-left grow outline-none py-1.5"
                       title={`${m.name || m.email} (Clique para ver datas)`}
                     >
                       {m.name || m.email?.split('@')[0]}
                       {m.whatsapp && (
                         <span className="block text-[9px] text-zinc-400 font-normal truncate mt-0.5">{m.whatsapp}</span>
                       )}
                     </button>
                     
                     {isAdmin && (
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           handleSendReminder(m);
                         }}
                         className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all scale-95 hover:scale-100 shrink-0"
                         title="Enviar lembrete individual pelo WhatsApp"
                       >
                         <MessageSquare size={10} />
                         <span>Lembrete</span>
                       </button>
                     )}
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-xs italic text-text-muted font-bold pl-4">Todos os ministros estão em dia! 🎉</p>
             )}
           </div>
         </div>
       </Card>
       )}

       <Card className="p-6 bg-gradient-to-r from-brand/10 to-transparent border-brand/20">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand/20 rounded-2xl text-brand shrink-0">
               <Activity size={24} />
            </div>
            <div>
               <h4 className="font-black text-text-main uppercase tracking-tight text-sm">Por que marcar disponibilidade?</h4>
               <p className="text-text-main text-sm mt-2 leading-relaxed font-bold">
                 Marcar seus dias livres nos ajuda a organizar as escalas mensais de forma mais justa e eficiente. 
                 Assim, evitamos escalar você em dias que você realmente não pode estar presente.
               </p>
            </div>
          </div>
       </Card>

        <AnimatePresence>
          {detailMember && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
              >
                <div className="p-6 border-b border-border flex items-center justify-between bg-surface shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center text-white text-xl font-black shadow-lg shadow-brand/20">
                      {(detailMember.name || detailMember.email)?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-text-main leading-tight">{detailMember.name || detailMember.email}</h2>
                      <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Datas Disponíveis</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDetailMember(null)}
                    className="p-2 text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all cursor-pointer outline-none"
                  >
                    <X size={24}/>
                  </button>
                </div>
                {isAdmin && (
                  <div className="px-6 py-2 bg-black/5 dark:bg-white/5 border-b border-border flex items-center justify-around gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setModalMode('view')}
                      className={cn(
                        "flex-1 py-1 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all text-center border-dashed border",
                        modalMode === 'view' ? "bg-black/15 dark:bg-white/10 text-brand border-brand font-extrabold" : "text-text-muted hover:text-text-main border-transparent"
                      )}
                    >
                      Visualizar Datas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalMode('edit-admin');
                        if (!adminSelectedDate) {
                          setAdminSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
                        }
                      }}
                      className={cn(
                        "flex-1 py-1 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5 border-dashed border",
                        modalMode === 'edit-admin' ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 text-amber-500 font-extrabold" : "text-text-muted hover:text-text-main border-transparent"
                      )}
                    >
                      <Zap size={10} className="text-amber-500" />
                      Marcar Dias (Admin)
                    </button>
                  </div>
                )}

                <div className="p-6 overflow-y-auto flex-1 bg-surface space-y-6">
                  {loadingDetail ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <RefreshCcw size={32} className="text-brand animate-spin" />
                      <p className="text-xs font-black text-text-muted uppercase tracking-widest">Buscando datas...</p>
                    </div>
                  ) : modalMode === 'edit-admin' ? (
                    <div className="space-y-4 text-left">
                      {/* Status Toggle Header */}
                      <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border flex items-center justify-between gap-3">
                        <div className="text-left space-y-0.5">
                          <span className="block text-[8px] font-black text-text-muted uppercase tracking-widest">Status de Conclusão</span>
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              (detailMember.availabilityStatus?.[currentMonthStr] === 'finished') ? "bg-green-500" : "bg-yellow-500"
                            )} />
                            <span className="text-xs font-bold text-text-main">
                              {(detailMember.availabilityStatus?.[currentMonthStr] === 'finished') ? "Preenchido e Concluído" : "Pendente"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleMemberFinishedStatus(detailMember)}
                          className={cn(
                            "py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border shrink-0",
                            (detailMember.availabilityStatus?.[currentMonthStr] === 'finished')
                              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-extrabold hover:bg-yellow-500/20"
                              : "bg-green-500/10 border-green-500/30 text-green-500 font-extrabold hover:bg-green-500/20"
                          )}
                        >
                          {(detailMember.availabilityStatus?.[currentMonthStr] === 'finished') ? "Marcar Pendente" : "Marcar Concluído"}
                        </button>
                      </div>

                      {/* Info Banner */}
                      <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-500 leading-normal">
                        ⚡ <strong>Modo Administrador:</strong> Suas alterações são aplicadas instantaneamente e ignoram qualquer prazo encerrado ou bloqueio do calendário.
                      </div>

                      {/* Mini-Calendar Component of the Reference Month */}
                      <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-border space-y-3">
                        <div className="text-center font-black text-xs text-text-main uppercase tracking-widest pb-1 border-b border-border/40">
                          {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </div>
                        <div className="grid grid-cols-7 text-center text-[9px] font-black text-text-muted uppercase tracking-wider">
                          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((wd, idx) => (
                            <span key={idx} className={idx === 0 ? "text-red-400" : ""}>{wd}</span>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {blanks.map(b => <div key={`b-${b}`} className="aspect-square"></div>)}
                          {days.map(d => {
                            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                            const dayStr = getLocalDateString(dayDate);
                            const avail = detailAvailability.find(a => a.date === dayStr);
                            const isSelected = adminSelectedDate?.getDate() === d && adminSelectedDate?.getMonth() === currentDate.getMonth();

                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setAdminSelectedDate(dayDate)}
                                className={cn(
                                  "aspect-square rounded-lg border transition-all flex flex-col items-center justify-center p-1 relative text-[11px] font-black cursor-pointer",
                                  avail?.status === 'available' ? "bg-green-500/20 border-green-500/40 text-green-500 font-extrabold shadow-inner"
                                    : (avail?.status === 'unavailable' ? "bg-red-500/20 border-red-500/40 text-red-500 font-extrabold shadow-inner" : "bg-black/10 dark:bg-white/5 border-border text-text-main"),
                                  isSelected ? "ring-2 ring-amber-500 border-amber-500 scale-102 z-10 font-black" : "hover:bg-black/20 dark:hover:bg-white/10"
                                )}
                              >
                                <span>{d}</span>
                                {avail && (
                                  <div className={cn(
                                    "w-1 h-1 rounded-full absolute bottom-1",
                                    avail.status === 'available' ? "bg-green-500" : "bg-red-500"
                                  )} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        
                        <div className="flex items-center gap-4 justify-center text-[8.5px] font-black text-text-muted uppercase tracking-wider pt-2 border-t border-border/20">
                          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-green-500/20 border border-green-500/40" /> Disponível</span>
                          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/40" /> Indisponível</span>
                        </div>
                      </div>

                      {/* Day Action Controls */}
                      {adminSelectedDate ? (
                        <div className="bg-black/5 dark:bg-white/5 border border-border/80 rounded-xl p-3.5 space-y-2 text-center animate-in fade-in duration-200">
                          <p className="text-[10px] font-black uppercase text-brand tracking-widest pl-1 leading-none mb-1">
                            Dia Selecionado: {adminSelectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                          </p>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setAdminMemberAvailability(detailMember.id, adminSelectedDate, 'available')}
                              className="py-2.5 px-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500/20 transition-all font-black uppercase text-[8.1px] tracking-wide"
                            >
                              Disponível ✅
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminMemberAvailability(detailMember.id, adminSelectedDate, 'unavailable')}
                              className="py-2.5 px-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all font-black uppercase text-[8.1px] tracking-wide"
                            >
                              Não Posso ❌
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminMemberAvailability(detailMember.id, adminSelectedDate, 'clear')}
                              className="py-2.5 px-1.5 rounded-lg bg-zinc-550/10 border border-zinc-500/30 text-zinc-400 hover:bg-zinc-500/20 transition-all font-black uppercase text-[8.1px] tracking-wide"
                            >
                              Limpar 🗑️
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 text-center text-[10px] font-bold text-text-muted italic bg-black/5 dark:bg-white/5 border border-dashed border-border rounded-xl">
                          Selecione um dia acima no mini-grade para alterar a disponibilidade.
                        </div>
                      )}
                    </div>
                  ) : detailAvailability.length > 0 ? (
                    (() => {
                      const grouped: Record<string, any[]> = {};
                      detailAvailability
                        .filter(a => a.status === 'available')
                        .forEach(a => {
                          const date = new Date(a.date + 'T00:00');
                          const monthKey = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                          if (!grouped[monthKey]) grouped[monthKey] = [];
                          grouped[monthKey].push(a);
                        });

                      const monthEntries = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));

                      if (monthEntries.length === 0) {
                        return (
                          <div className="text-center py-20 bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-border w-full">
                            <Calendar size={48} className="mx-auto text-text-muted/30 mb-4" />
                            <p className="text-sm font-black text-text-muted uppercase tracking-widest">Nenhuma data disponível marcada.</p>
                          </div>
                        );
                      }

                      return monthEntries.map(([month, dates]) => (
                        <div key={month} className="space-y-3">
                          <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] pl-1 text-left">{month}</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {dates.sort((a, b) => a.date.localeCompare(b.date)).map((d, i) => {
                              const dateObj = new Date(d.date + 'T00:00');
                              return (
                                <div key={i} className="flex flex-col p-3 bg-black/5 dark:bg-white/5 border border-border rounded-xl text-left">
                                  <span className="text-xs font-black text-text-main">
                                    {dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                  </span>
                                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-tight">
                                    {dateObj.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()
                  ) : (
                    <div className="text-center py-20 bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-border w-full">
                      <Calendar size={48} className="mx-auto text-text-muted/30 mb-4" />
                      <p className="text-sm font-black text-text-muted uppercase tracking-widest">Nenhuma data marcada.</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t border-border bg-black/5 dark:bg-white/5 flex justify-center shrink-0">
                  <Button onClick={() => setDetailMember(null)} variant="secondary" className="px-8 font-black uppercase text-[10px] tracking-widest">
                    Fechar
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {submissionStatus && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-xl bg-card border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="p-6 sm:p-8 flex-1 overflow-y-auto text-center space-y-6">
                  <div className="mx-auto w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/5">
                    <Check size={32} strokeWidth={3} className="animate-bounce" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-text-main tracking-tight">Disponibilidade Enviada!</h2>
                    <p className="text-xs font-bold text-text-muted max-w-md mx-auto">
                      Suas preferências foram registradas com sucesso no aplicativo. Além disso, criamos uma notificação em tempo real no painel administrativo dos coordenadores.
                    </p>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-left space-y-3">
                    <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Smartphone size={14} /> Canal WhatsApp das Lideranças
                    </h3>
                    <p className="text-[11px] font-bold text-text-muted leading-relaxed">
                      Seu navegador pode ter bloqueado a abertura automática da janela de envio. Para garantir que os líderes recebam sua mensagem formatada no celular, toque em enviar abaixo para cada um deles:
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {submissionStatus.admins.length > 0 ? (
                        submissionStatus.admins.map((adm, idx) => {
                          const waUrl = `https://wa.me/${adm.phone}?text=${encodeURIComponent(submissionStatus.message)}`;
                          return (
                            <div key={adm.phone + idx} className="flex gap-2 items-center bg-card border border-border/80 rounded-xl p-3 justify-between shadow-sm">
                              <div className="text-left w-2/3">
                                <p className="text-xs font-black text-text-main pr-2 truncate">{adm.name}</p>
                                <p className="text-[9px] font-mono text-text-muted mt-0.5">{adm.phone}</p>
                              </div>
                              <Button
                                onClick={() => window.open(waUrl, '_blank')}
                                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wide rounded-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all text-xs shrink-0"
                              >
                                Enviar 💬
                              </Button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs font-bold text-center py-2 text-text-muted">Nenhum número de WhatsApp administrativo configurado.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-2xl text-left space-y-3">
                    <h3 className="text-xs font-black text-sky-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Mail size={14} /> Canal E-mail dos Administradores
                    </h3>
                    <p className="text-[11px] font-bold text-text-muted leading-relaxed">
                      Envie o relatório de confirmação de disponibilidade diretamente para o e-mail oficial dos coordenadores da igreja:
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {submissionStatus.adminEmails && submissionStatus.adminEmails.length > 0 ? (
                        submissionStatus.adminEmails.map((adm, idx) => {
                          const mailSubject = `🗓️ Disponibilidade Concluída - ${currentUserData?.name || 'Membro'} - ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
                          const mailtoUrl = `mailto:${adm.email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(submissionStatus.message)}`;
                          return (
                            <div key={adm.email + idx} className="flex gap-2 items-center bg-card border border-border/80 rounded-xl p-3 justify-between shadow-sm">
                              <div className="text-left w-2/3">
                                <p className="text-xs font-black text-text-main pr-2 truncate">{adm.name}</p>
                                <p className="text-[9px] font-mono text-text-muted mt-0.5 truncate">{adm.email}</p>
                              </div>
                              <Button
                                onClick={() => window.open(mailtoUrl, '_self')}
                                className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-[10px] uppercase tracking-wide rounded-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all text-xs shrink-0"
                              >
                                Enviar E-mail ✉️
                              </Button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs font-bold text-center py-2 text-text-muted">Nenhum e-mail administrativo configurado.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted pl-1">Prévia da Mensagem Gerada</label>
                    <pre className="text-[10px] bg-black/15 dark:bg-white/5 border border-border p-4 rounded-xl font-mono text-text-main whitespace-pre-wrap leading-tight text-left select-all cursor-pointer shadow-inner max-h-[160px] overflow-y-auto" title="Clique para selecionar e copiar">
                      {submissionStatus.message}
                    </pre>
                  </div>
                </div>

                <div className="p-4 bg-black/5 dark:bg-white/5 border-t border-border flex items-center justify-center gap-3">
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(submissionStatus.message);
                      alert("Copiado com sucesso para a área de transferência!");
                    }}
                    variant="secondary" 
                    className="flex-1 max-w-[180px] font-black uppercase text-[10px] tracking-widest h-10 border border-border rounded-xl"
                  >
                     Copiar Texto 📋
                  </Button>
                  <Button 
                    onClick={() => setSubmissionStatus(null)} 
                    className="flex-1 max-w-[180px] bg-brand text-white font-black uppercase text-[10px] tracking-widest h-10 rounded-xl"
                  >
                     Entendido ✅
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Floating Sticky Bottom Action Bar for Mobile/Desktop Usability */}
        {!isFinished && !isLocked && availabilities.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg bg-zinc-950/90 dark:bg-zinc-900/95 backdrop-blur-md border border-amber-500/30 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-6 duration-300">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" /> PENDENTE DE ENVIO ⚠️
              </p>
              <p className="text-[10px] font-bold text-text-muted mt-0.5 leading-normal max-w-[260px] xs:max-w-xs">
                Toque em finalizar para enviar sua escala para a liderança.
              </p>
            </div>
            <Button
              onClick={handleFinishAvailability}
              disabled={isFinishing}
              className="bg-brand text-white font-black uppercase text-[10px] tracking-widest h-9 px-4 rounded-xl shadow-lg shadow-brand/20 shrink-0"
            >
              {isFinishing ? (
                <RefreshCcw size={12} className="animate-spin" />
              ) : (
                <div className="flex items-center gap-1.5">
                  <Send size={12} /> Finalizar
                </div>
              )}
            </Button>
          </div>
        )}
    </motion.div>
  );
}

interface LiturgyItem {
  id: string;
  type: string;
  title: string;
  content: string;
  details: string;
  songId?: string;
  moment?: string;
}

interface MomentGroup {
  moment: string;
  items: { item: LiturgyItem; originalIndex: number }[];
}

function getMomentGroups(liturgy: LiturgyItem[]): MomentGroup[] {
  const groups: MomentGroup[] = [];
  if (!liturgy || liturgy.length === 0) return groups;

  let currentGroup: MomentGroup | null = null;

  liturgy.forEach((item, index) => {
    const itemMoment = item.moment?.trim() || "";
    const displayMoment = itemMoment || "Sem Momento";

    if (!currentGroup || currentGroup.moment !== displayMoment) {
      currentGroup = {
        moment: displayMoment,
        items: []
      };
      groups.push(currentGroup);
    }

    currentGroup.items.push({ item, originalIndex: index });
  });

  return groups;
}

function getMomentStyles(momentName: string) {
  const name = (momentName || "").toLowerCase().trim();
  
  if (name === "ofertório" || name === "ofertorio" || name.includes("ofertório") || name.includes("ofertorio")) {
    return {
      bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
      border: "border-emerald-500/30 dark:border-emerald-500/40 border-l-[6px] border-l-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
      label: "OFERTÓRIO"
    };
  }
  if (name === "palavra auxiliar" || name.includes("palavra auxiliar")) {
    return {
      bg: "bg-amber-500/5 dark:bg-amber-500/10",
      border: "border-amber-500/30 dark:border-amber-500/40 border-l-[6px] border-l-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
      label: "PALAVRA AUXILIAR"
    };
  }
  if (name === "palavra inicial" || name.includes("palavra inicial")) {
    return {
      bg: "bg-amber-500/5 dark:bg-amber-500/10",
      border: "border-amber-500/30 dark:border-amber-500/40 border-l-[6px] border-l-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
      label: "PALAVRA INICIAL"
    };
  }
  if (name === "palavra final" || name.includes("palavra final")) {
    return {
      bg: "bg-amber-500/5 dark:bg-amber-500/10",
      border: "border-amber-500/30 dark:border-amber-500/40 border-l-[6px] border-l-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
      label: "PALAVRA FINAL"
    };
  }
  if (name.includes("pregação") || name.includes("palavra") || name.includes("sermão") || name.includes("mensagem") || name.includes("ministração")) {
    return {
      bg: "bg-amber-500/5 dark:bg-amber-500/10",
      border: "border-amber-500/30 dark:border-amber-500/40 border-l-[6px] border-l-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
      label: "MENSAGEM / PALAVRA"
    };
  }
  if (name.includes("oração") || name.includes("clamor") || name.includes("intercessão") || name.includes("confissão")) {
    return {
      bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
      border: "border-emerald-500/30 dark:border-emerald-500/40 border-l-[6px] border-l-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
      label: "ORAÇÃO / INTERCESSÃO"
    };
  }
  if (name.includes("aviso") || name.includes("comunhão") || name.includes("oferta") || name.includes("dízimo")) {
    return {
      bg: "bg-purple-500/5 dark:bg-purple-500/10",
      border: "border-purple-500/30 dark:border-purple-500/40 border-l-[6px] border-l-purple-500",
      text: "text-purple-600 dark:text-purple-400",
      dot: "bg-purple-500",
      label: "AVISOS / COMUNHÃO"
    };
  }
  if (name.includes("louvor") || name.includes("inicial") || name.includes("música") || name.includes("canto") || name.includes("adoração")) {
    return {
      bg: "bg-blue-500/5 dark:bg-blue-500/10",
      border: "border-blue-500/30 dark:border-blue-500/40 border-l-[6px] border-l-blue-500",
      text: "text-blue-600 dark:text-blue-400",
      dot: "bg-blue-500",
      label: "LOUVOR / ADORAÇÃO"
    };
  }
  if (name.includes("encerramento") || name.includes("bênção") || name.includes("final") || name.includes("despedida")) {
    return {
      bg: "bg-rose-500/5 dark:bg-rose-500/10",
      border: "border-rose-500/30 dark:border-rose-500/40 border-l-[6px] border-l-rose-500",
      text: "text-rose-600 dark:text-rose-400",
      dot: "bg-rose-500",
      label: "ENCERRAMENTO"
    };
  }
  if (name === "sem momento" || name === "") {
    return {
      bg: "bg-black/5 dark:bg-white/5",
      border: "border-border border-l-[6px] border-l-muted-foreground/40",
      text: "text-text-muted",
      dot: "bg-muted-foreground",
      label: "MOMENTO AUXILIAR"
    };
  }
  
  return {
    bg: "bg-cyan-500/5 dark:bg-cyan-500/10",
    border: "border-cyan-500/30 dark:border-cyan-500/40 border-l-[6px] border-l-cyan-500",
    text: "text-cyan-600 dark:text-cyan-400",
    dot: "bg-cyan-500",
    label: momentName.toUpperCase()
  };
}

function LiturgyItemCard({
  item,
  idx,
  isAdmin,
  onOpenSong,
  startEditing,
  handleMove,
  handleRemoveItem,
  serviceLiturgyLength,
  dragControlsEnabled = true,
  calculatedTime
}: {
  item: any;
  idx: number;
  isAdmin: boolean;
  onOpenSong?: (songId: string) => void;
  startEditing: (item: any, idx?: number) => void;
  handleMove: (idx: number, direction: 'up' | 'down') => void;
  handleRemoveItem: (itemId: string, index: number) => void;
  serviceLiturgyLength: number;
  dragControlsEnabled?: boolean;
  calculatedTime?: string;
}) {
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const dragControls = useDragControls();

  const Card = (isAdmin && dragControlsEnabled) ? Reorder.Item : motion.div;
  
  const cardProps: any = {
    layout: true,
    initial: { opacity: 0, x: -24 },
    animate: { opacity: 1, x: 0 },
    whileDrag: {
      scale: 1.025,
      rotate: 0.5,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
      filter: "brightness(1.05)",
    },
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 26,
      mass: 0.6,
      opacity: { duration: 0.3, delay: Math.min(idx * 0.04, 0.25) },
      x: { type: "spring", stiffness: 280, damping: 22, delay: Math.min(idx * 0.04, 0.25) }
    },
    onClick: () => {
      if (item.type === 'song' && onOpenSong) {
        onOpenSong(item.songId || '');
      } else if (isAdmin) {
        startEditing(item, idx);
      }
    },
    className: cn(
      "flex items-start sm:items-center gap-2 sm:gap-4 bg-black/5 dark:bg-white/5 p-2.5 sm:p-5 rounded-xl border border-black/10 dark:border-white/10 group hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all shadow-sm w-full select-none",
      (isAdmin || (item.type === 'song' && onOpenSong)) && "cursor-pointer"
    )
  };

  if (isAdmin && dragControlsEnabled) {
    cardProps.value = item;
    cardProps.dragListener = false;
    cardProps.dragControls = dragControls;
  }

  return (
    <Card {...cardProps}>
       <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          {isAdmin && dragControlsEnabled && (
            <div 
              onPointerDown={(e) => {
                e.preventDefault();
                dragControls.start(e);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              className="self-stretch flex items-center justify-center px-1.5 sm:px-2.5 text-text-muted hover:text-brand bg-black/10 dark:bg-white/5 hover:bg-black/15 dark:hover:bg-white/10 rounded-xl border border-black/5 dark:border-white/10 cursor-grab active:cursor-grabbing transition-colors touch-none"
              title="Arrastar para reordenar"
            >
              <GripVertical size={16} />
            </div>
          )}
          {isAdmin && (
            <div className="flex flex-col gap-1.5">
               <button 
                 onClick={(e) => { e.stopPropagation(); handleMove(idx, 'up'); }} 
                 className={cn(
                   "w-[38px] h-[38px] sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-800 border border-white/10 text-white hover:bg-slate-700 active:scale-95 transition-all shadow-sm",
                   idx === 0 && "opacity-0 pointer-events-none"
                 )}
               >
                 <ChevronUp size={16} />
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); handleMove(idx, 'down'); }} 
                 className={cn(
                   "w-[38px] h-[38px] sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-800 border border-white/10 text-white hover:bg-slate-700 active:scale-95 transition-all shadow-sm",
                   idx === (serviceLiturgyLength - 1) && "opacity-0 pointer-events-none"
                 )}
               >
                 <ChevronDown size={16} />
               </button>
            </div>
          )}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-brand flex items-center justify-center text-[11px] sm:text-[11px] font-black text-white shrink-0 border border-brand/30 shadow-sm">
                {idx + 1}
            </div>
            {calculatedTime && (
              <span className="text-[8px] font-mono font-black tracking-tighter text-brand bg-brand/10 dark:bg-brand/20 border border-brand/25 px-1.5 py-0.5 rounded leading-none shrink-0" title="Início estimado">
                {calculatedTime}
              </span>
            )}
          </div>
       </div>
       <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-6 min-w-0 py-0.5">
         {item.content && (
           <div className="shrink-0 w-fit">
              <p className="text-[11px] sm:text-xs text-white font-black uppercase tracking-widest bg-brand px-2 sm:px-4 py-1.5 sm:py-2.5 rounded sm:rounded-xl border border-white/20 shadow-md leading-none text-center">
                {item.content}
              </p>
           </div>
         )}
         
         <div className="min-w-0 flex-1 notranslate" translate="no">
            {item.moment && (
              <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-brand uppercase block mb-0.5">
                {item.moment}
              </span>
            )}
            <p className="text-text-main text-base sm:text-lg font-bold flex items-center flex-wrap gap-1.5 sm:gap-3 leading-tight tracking-tight">
              {item.type === 'reading' && <BookOpen size={14} className="text-text-main shrink-0"/>}
              {item.type === 'song' && <Music2 size={14} className="text-brand shrink-0"/>}
              {item.type === 'speech' && <Quote size={14} className="text-purple-600 shrink-0"/>}
              {item.type === 'prayer' && <Check size={14} className="text-teal-600 shrink-0"/>}
              {item.type === 'announcements' && <Volume2 size={14} className="text-red-500 shrink-0"/>}
              {item.type === 'offering' && <Gift size={14} className="text-emerald-500 shrink-0"/>}
              {item.type === 'other' && <Activity size={14} className="text-green-600 shrink-0"/>}
              <span className="truncate">{item.title}</span>
              {item.duration && (
                <span className="text-[8px] font-black uppercase tracking-widest bg-[#E60000]/10 border border-[#E60000]/25 text-[#E60000] dark:text-red-400 px-1.5 py-0.5 rounded leading-none shrink-0 flex items-center gap-1 self-center">
                  <Clock size={9} /> {item.duration}m
                </span>
              )}
            </p>
            {item.details && (
              <div className="mt-2 space-y-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTextExpanded(!isTextExpanded);
                  }}
                  className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-text-muted hover:text-brand bg-black/10 dark:bg-white/5 hover:bg-black/15 dark:hover:bg-white/10 px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10 transition-all cursor-pointer select-none"
                  title={isTextExpanded ? "Recolher texto" : "Ver texto completo"}
                >
                  <FileText size={11} className="text-brand" />
                  <span>{isTextExpanded ? 'Recolher Texto' : 'Ver Texto'}</span>
                  {isTextExpanded ? <ChevronUp size={12} className="text-brand" /> : <ChevronDown size={12} className="text-brand" />}
                </button>
                <AnimatePresence initial={false}>
                  {isTextExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-1 pl-3 py-2 border-l-[3px] border-brand/60 text-[11px] sm:text-xs text-text-main italic whitespace-pre-line leading-relaxed max-w-2xl bg-black/5 dark:bg-black/30 p-3 rounded-r-xl border border-black/5 dark:border-white/5">
                        "{item.details}"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
         </div>
       </div>
       <div className="button-container flex items-center gap-0.5 sm:opacity-0 group-hover:opacity-100 transition-opacity self-center">
          {isAdmin && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); startEditing(item, idx); }} 
                className="p-1 sm:p-2 hover:bg-white/5 rounded-lg text-white transition-colors" 
                title="Editar"
              >
                <Edit size={12}/>
              </button>
              <ConfirmButton 
                onConfirm={() => handleRemoveItem(item.id, idx)}
                className="p-1 sm:p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" 
                title="Excluir"
              >
                <Trash2 size={12}/>
              </ConfirmButton>
            </>
          )}
       </div>
    </Card>
  );
}

function MultiVocalistSelector({
  value,
  onChange,
  vocalists,
  members
}: {
  value: string;
  onChange: (newValue: string) => void;
  vocalists: any[];
  members: any[];
}) {
  const [customInput, setCustomInput] = useState('');

  const selectedList = useMemo(() => {
    if (!value) return [];
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }, [value]);

  const handleToggleMember = (memberName: string) => {
    let updated: string[];
    if (selectedList.includes(memberName)) {
      updated = selectedList.filter(name => name !== memberName);
    } else {
      updated = [...selectedList, memberName];
    }
    onChange(updated.join(', '));
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selectedList.includes(trimmed)) {
      const updated = [...selectedList, trimmed];
      onChange(updated.join(', '));
      setCustomInput('');
    }
  };

  const handleSelectDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected && !selectedList.includes(selected)) {
      const updated = [...selectedList, selected];
      onChange(updated.join(', '));
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-2.5 bg-black/10 dark:bg-white/5 p-3.5 rounded-xl border border-border/70 text-left">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-text-main uppercase tracking-wider flex items-center gap-1.5 opacity-90">
          <Mic size={13} className="text-brand" />
          Cantor(es) / Vocais ({selectedList.length})
        </label>
        {selectedList.length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] text-red-400 hover:text-red-300 font-bold underline transition-colors"
          >
            Limpar todos
          </button>
        )}
      </div>

      {/* Badges of selected vocalists */}
      <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-black/20 dark:bg-black/40 rounded-lg border border-border/40 items-center">
        {selectedList.length === 0 ? (
          <span className="text-[11px] text-text-muted/70 italic px-1">
            Nenhum cantor selecionado. Toque nas sugestões abaixo ou escolha no menu.
          </span>
        ) : (
          selectedList.map((name, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-brand/20 border border-brand/40 text-brand shadow-xs animate-in fade-in zoom-in-95 duration-150"
            >
              🎤 {name}
              <button
                type="button"
                onClick={() => handleToggleMember(name)}
                className="hover:bg-brand/30 rounded-full p-0.5 text-brand/80 hover:text-brand transition-colors cursor-pointer"
                title={`Remover ${name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Quick Select Chips from Team Vocalists */}
      {vocalists.length > 0 && (
        <div className="space-y-1 pt-1">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">
            Toque para adicionar/remover cantores da equipe:
          </span>
          <div className="flex flex-wrap gap-1">
            {vocalists.map((m) => {
              const isSelected = selectedList.includes(m.name);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleToggleMember(m.name)}
                  className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer select-none",
                    isSelected
                      ? "bg-brand text-slate-950 border-brand shadow-sm font-black"
                      : "bg-black/20 border-border text-text-muted hover:text-text-main hover:border-brand/40"
                  )}
                >
                  {isSelected ? <Check size={11} /> : <Plus size={11} />}
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dropdown for all members + Custom Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {/* Select Dropdown */}
        <select
          onChange={handleSelectDropdown}
          className="w-full bg-black/20 border border-border rounded-lg text-text-main text-xs p-2 h-9 outline-none focus:ring-2 focus:ring-brand/35 cursor-pointer"
          defaultValue=""
        >
          <option value="" disabled>+ Adicionar cantor da lista...</option>
          <optgroup label="Vocais Cadastrados">
            {vocalists.map(m => (
              <option key={m.id} value={m.name} disabled={selectedList.includes(m.name)}>
                {selectedList.includes(m.name) ? `✓ ${m.name} (já selecionado)` : m.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Outros Integrantes">
            {members.filter(m => !vocalists.some(v => v.id === m.id)).map(m => (
              <option key={m.id} value={m.name} disabled={selectedList.includes(m.name)}>
                {selectedList.includes(m.name) ? `✓ ${m.name} (já selecionado)` : m.name}
              </option>
            ))}
          </optgroup>
        </select>

        {/* Custom Input */}
        <div className="flex items-center gap-1.5">
          <Input
            placeholder="Ou digite cantor convidado..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            className="bg-black/20 border-border text-text-main h-9 text-xs py-0"
          />
          <Button
            onClick={handleAddCustom}
            disabled={!customInput.trim()}
            className="h-9 px-3 bg-brand/20 hover:bg-brand/30 border border-brand/40 text-brand text-xs font-bold rounded-lg shrink-0 flex items-center gap-1"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

const LITURGY_SONG_MOMENTS = [
  "PRIMEIRA MÚSICA",
  "SEGUNDA MÚSICA",
  "TERCEIRA MÚSICA",
  "QUARTA MÚSICA",
  "QUINTA MÚSICA",
  "SEXTA MÚSICA",
  "SÉTIMA MÚSICA",
  "OITAVA MÚSICA",
  "NONA MÚSICA",
  "DÉCIMA MÚSICA"
];

const LITURGY_GENERAL_MOMENTS = [
  "Palavra Inicial",
  "Louvor Inicial",
  "Oração",
  "Pregação",
  "Palavra Auxiliar",
  "Avisos",
  "Ofertório",
  "Louvor Final",
  "Palavra Final"
];

const LITURGY_SONG_CATEGORIES = [
  "ABERTURA",
  "CRIAÇÃO/ADORAÇÃO",
  "QUEDA/CONFISSÃO",
  "REDENÇÃO/AÇÃO DE GRAÇAS",
  "CONSUMAÇÃO/RESPOSTA",
  "DÍZIMOS/OFERTAS",
  "ORAÇÃO/INTERCESSÃO",
  "APELO/DECISÃO",
  "JÚBILO/CELEBRAÇÃO",
  "CEIA/COMUNHÃO",
  "ADORAÇÃO",
  "ENCERRAMENTO",
  "PERSONALIZAR"
];

const LITURGY_NON_SONG_CATEGORIES = [
  "CHAMADO À ADORAÇÃO",
  "EXPLICAÇÃO DO EVANGELHO",
  "ORAÇÃO PASTORAL",
  "DÍZIMOS/OFERTAS",
  "AVISOS DO CULTO",
  "PREGAÇÃO",
  "BÊNÇÃO FINAL",
  "OUTRO"
];

export function LiturgyEditor({ 
  service, 
  onOpenSong, 
  playlistOnly = false,
  createNotifications
}: { 
  service: any, 
  onOpenSong?: (songId: string) => void, 
  playlistOnly?: boolean,
  createNotifications?: (title: string, content: string, type: 'announcement' | 'mural' | 'service' | 'general', excludeUserId?: string, preferenceKey?: 'notifyNewSongs' | 'notifyScheduleChanges' | 'notifyDayBeforeReminder' | 'notifyNewLiturgy') => Promise<void>
}) {
  const { user, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState((service?.liturgy || []).length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [pastServices, setPastServices] = useState<any[]>([]);
  const [confirmDeleteLiturgy, setConfirmDeleteLiturgy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveFeedbackMessage, setSaveFeedbackMessage] = useState<string | null>(null);
  const [itemEditStatus, setItemEditStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [addItemStatus, setAddItemStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const handleSaveLiturgy = async () => {
    setSaveStatus("saving");
    setSaveFeedbackMessage("Salvando alterações no Firebase...");
    const servicePath = `services/${service.id}`;
    try {
      const liturgy = service.liturgy || [];
      await updateDoc(doc(db, "services", service.id), { 
        liturgy,
        updatedAt: new Date().toISOString()
      });
      setSaveStatus("success");
      setSaveFeedbackMessage("Liturgia salva com sucesso no Firebase!");
      setTimeout(() => {
        setIsEditing(false);
        setSaveStatus("idle");
        setSaveFeedbackMessage(null);
      }, 1200);
    } catch (error) {
      console.error("Erro ao salvar liturgia:", error);
      setSaveStatus("error");
      setSaveFeedbackMessage("Falha ao salvar no banco de dados. Tente novamente.");
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveFeedbackMessage(null);
      }, 3500);
    }
  };

  useEffect(() => {
    if (confirmDeleteLiturgy) {
      const timer = setTimeout(() => {
        setConfirmDeleteLiturgy(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmDeleteLiturgy]);

  const handleClearLiturgy = async () => {
    setIsSaving(true);
    const servicePath = `services/${service.id}`;
    try {
      await updateDoc(doc(db, 'services', service.id), { liturgy: [] });
      setConfirmDeleteLiturgy(false);
      setIsEditing(true); // Go back to editing/adding mode when cleared
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
    } finally {
      setIsSaving(false);
    }
  };
  const [newItem, setNewItem] = useState({ type: 'reading', title: '', content: '', details: '', songId: '', moment: '', bibleVersion: 'NAA', vocalist: '', duration: '' });
  const [editItem, setEditItem] = useState({ type: 'reading', title: '', content: '', details: '', songId: '', moment: '', bibleVersion: 'NAA', vocalist: '', duration: '' });

  useEffect(() => {
    if (!user) return;
    const memberPath = 'members';
    const unsub = onSnapshot(collection(db, memberPath), (snap) => {
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching members inside LiturgyEditor:", error);
    });
    return unsub;
  }, [user]);

  const vocalists = useMemo(() => {
    return (members || []).filter(m => 
      m.roles?.some((role: string) => 
        role.toLowerCase().includes('vocal')
      )
    );
  }, [members]);

  const normalizedLiturgy = useMemo(() => {
    if (!service?.liturgy || !Array.isArray(service.liturgy)) return [];
    const seenIds = new Set<string>();
    return service.liturgy.map((item: any, index: number) => {
      let itemId = item?.id && typeof item.id === 'string' && item.id.trim() !== ''
        ? item.id
        : (item?.songId ? `song-${item.songId}-${index}` : `liturgy-item-${index}-${item?.type || 'item'}`);
      
      if (seenIds.has(itemId)) {
        itemId = `${itemId}-dup-${index}`;
      }
      seenIds.add(itemId);

      return {
        ...item,
        id: itemId
      };
    });
  }, [service?.liturgy]);

  const timelineTimes = useMemo(() => {
    if (!service || !normalizedLiturgy) return {} as Record<string, string>;
    let currentTime = new Date(service.date);
    if (isNaN(currentTime.getTime())) {
      currentTime = new Date();
    }
    const timeline: Record<string, string> = {};
    normalizedLiturgy.forEach((item: any) => {
      const hrs = String(currentTime.getHours()).padStart(2, '0');
      const mins = String(currentTime.getMinutes()).padStart(2, '0');
      timeline[item.id] = `${hrs}:${mins}`;
      
      const durationVal = parseInt(item.duration);
      if (!isNaN(durationVal) && durationVal > 0) {
        currentTime.setMinutes(currentTime.getMinutes() + durationVal);
      }
    });
    return timeline;
  }, [service?.date, normalizedLiturgy]);
  const [showBibleSearch, setShowBibleSearch] = useState(false);
  const [showEditBibleSearch, setShowEditBibleSearch] = useState(false);
  const [isGroupedByMoments, setIsGroupedByMoments] = useState(true);
  const [showCustomMomentInput, setShowCustomMomentInput] = useState(false);
  const [showCustomMomentInputEdit, setShowCustomMomentInputEdit] = useState(false);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [showCustomCategoryInputEdit, setShowCustomCategoryInputEdit] = useState(false);

  useEffect(() => {
    if (!service) return;
    setIsEditing((service.liturgy || []).length === 0);
    setEditingId(null);
  }, [service?.id]);

  useEffect(() => {
    if (!user) return;
    if (!isEditing && !editingId) return;
    const songPath = 'songs';
    const q = query(collection(db, songPath), orderBy('title', 'asc'));
    return onSnapshot(q, (snap) => {
      setSongs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching songs:", error);
    });
  }, [isEditing, editingId, user]);

  useEffect(() => {
    if (!isCloning || !user) return;
    const servicePath = 'services';
    const q = query(collection(db, servicePath), orderBy('date', 'desc'));
    return onSnapshot(q, (snap) => {
      // Filtra cultos que já possuem liturgia
      setPastServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).filter(s => s.id !== service.id && s.liturgy?.length > 0));
    }, (error) => {
       console.error("Error fetching past services:", error);
    });
  }, [isCloning, user, service.id]);

  const handleCloneLiturgy = async (sourceId: string) => {
    const source = pastServices.find(s => s.id === sourceId);
    if (!source || !source.liturgy) return;

    setIsSaving(true);
    try {
      // Deep copy and generate new IDs
      const clonedLiturgy = source.liturgy.map((item: any) => ({
        ...item,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)
      }));
      await updateDoc(doc(db, 'services', service.id), { liturgy: clonedLiturgy });
      setIsCloning(false);

      if (createNotifications) {
        const dateStr = new Date(service.date).toLocaleDateString('pt-BR');
        await createNotifications(
          '📖 Nova Liturgia Disponível',
          `A liturgia para o culto "${service.title}" em ${dateStr} foi definida. Venha conferir!`,
          'service',
          user?.uid,
          'notifyNewLiturgy'
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `services/${service.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.title) return;
    setIsSaving(true);
    setAddItemStatus("saving");
    const servicePath = `services/${service.id}`;
    try {
      const liturgy = service.liturgy || [];
      const updatedLiturgy = [...liturgy, { ...newItem, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() }];
      const songIds = updatedLiturgy
        .filter((item: any) => item && (item.type === 'song' || item.songId))
        .map((item: any) => item.songId || item.id)
        .filter(Boolean);

      await updateDoc(doc(db, "services", service.id), { 
        liturgy: updatedLiturgy,
        setlist: songIds,
        updatedAt: new Date().toISOString()
      });
      setAddItemStatus("success");
      setNewItem({ type: "reading", title: "", content: "", details: "", songId: "", moment: "", bibleVersion: "NAA", vocalist: "", duration: "" });
      setShowCustomMomentInput(false);
      setShowBibleSearch(false);

      if (liturgy.length === 0 && createNotifications) {
        const dateStr = new Date(service.date).toLocaleDateString("pt-BR");
        await createNotifications(
          "📖 Nova Liturgia Disponível",
          `A liturgia para o culto "${service.title}" em ${dateStr} foi definida. Venha conferir!`,
          "service",
          user?.uid,
          "notifyNewLiturgy"
        );
      }
      setTimeout(() => {
        setAddItemStatus("idle");
      }, 1500);
    } catch (error) {
      setAddItemStatus("error");
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
      setTimeout(() => {
        setAddItemStatus("idle");
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualNotifyLiturgy = async () => {
    if (!createNotifications) return;
    setIsSaving(true);
    try {
      const dateStr = new Date(service.date).toLocaleDateString('pt-BR');
      await createNotifications(
        '📖 Nova Liturgia Disponível',
        `A liturgia para o culto "${service.title}" em ${dateStr} foi definida. Venha conferir!`,
        'service',
        user?.uid,
        'notifyNewLiturgy'
      );
      alert("Notificação enviada com sucesso para todos os membros!");
    } catch (e) {
      console.error("Erro ao notificar liturgia:", e);
      alert("Não foi possível enviar a notificação.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareLiturgyWhatsApp = () => {
    if (!service || !service.liturgy) return;

    const dateStr = new Date(service.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeStr = new Date(service.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let message = `*ORDEM DO CULTO* 📖\n`;
    message += `*${service.title}*\n`;
    message += `📅 ${dateStr}\n`;
    message += `⏰ ${timeStr}\n\n`;

    const smartCapitalize = (str: string) => {
      if (!str) return '';
      const s = str.trim();
      if (s.length === 0) return '';
      let result = s;
      if (s === s.toUpperCase() && s !== s.toLowerCase()) {
        result = s.toLowerCase();
      }
      result = result.charAt(0).toUpperCase() + result.slice(1);
      const holyNames = [
        'Deus', 'Jesus', 'Cristo', 'Senhor', 'Espírito', 'Espirito', 'Santo', 'Pai', 'Filho', 
        'Maria', 'Bíblia', 'Biblia', 'Evangelho', 'Salmo', 'Amém', 'Amem'
      ];
      holyNames.forEach(name => {
        const regex = new RegExp(`\\b${name}\\b`, 'gi');
        result = result.replace(regex, () => name);
      });
      return result;
    };

    const typeMap: any = {
      reading: 'Leitura 📖',
      song: 'Música 🎵',
      speech: 'Palavra 🗣️',
      prayer: 'Oração 🙏',
      announcements: 'Avisos 📢',
      offering: 'Ofertas 💸',
      other: 'Outro ✨'
    };

    service.liturgy.forEach((item: any, idx: number) => {
      message += `${idx + 1}. *${typeMap[item.type] || smartCapitalize(item.type)}*\n`;
      message += `${smartCapitalize(item.title)}\n`;
      if (item.content) {
        message += `_${smartCapitalize(item.content)}_\n`;
      }
      if (item.details && item.type !== 'reading') {
        message += `_"${item.details}"_\n`;
      }
      message += `\n`;
    });

    message += `_Gerado por LiLouPro_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleUpdateItem = async (itemId: string, itemIdx?: number) => {
    setIsSaving(true);
    setItemEditStatus("saving");
    const servicePath = `services/${service.id}`;
    try {
      const liturgy = [...(service.liturgy || [])];
      let index = -1;
      if (itemId) {
        index = liturgy.findIndex(i => i.id === itemId);
      }
      if (index === -1 && typeof itemIdx === "number" && itemIdx >= 0 && itemIdx < liturgy.length) {
        index = itemIdx;
      }
      if (index === -1 && itemId) {
        index = liturgy.findIndex(i => i.songId === itemId || (i.title && i.title === editItem.title));
      }
      if (index !== -1) {
        const existingItem = liturgy[index];
        const finalId = existingItem.id || itemId || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());
        liturgy[index] = { 
          ...existingItem,
          ...editItem, 
          id: finalId 
        };
        
        const updateData: any = { 
          liturgy,
          updatedAt: new Date().toISOString()
        };
        
        if (editItem.type === "song" && editItem.songId) {
          const setlist = [...(service.setlist || [])];
          const oldSongId = existingItem.songId;
          if (oldSongId && oldSongId !== editItem.songId) {
            const setlistIdx = setlist.indexOf(oldSongId);
            if (setlistIdx !== -1) {
              setlist[setlistIdx] = editItem.songId;
            } else if (!setlist.includes(editItem.songId)) {
              setlist.push(editItem.songId);
            }
          } else if (!setlist.includes(editItem.songId)) {
            setlist.push(editItem.songId);
          }
          updateData.setlist = setlist;
        }

        await updateDoc(doc(db, "services", service.id), updateData);
        setItemEditStatus("success");
        setTimeout(() => {
          setEditingId(null);
          setItemEditStatus("idle");
        }, 700);
      } else {
        console.warn("Item não encontrado para atualização:", { itemId, itemIdx });
        setItemEditStatus("error");
        setTimeout(() => {
          setItemEditStatus("idle");
        }, 2000);
      }
    } catch (error) {
      setItemEditStatus("error");
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
      setTimeout(() => {
        setItemEditStatus("idle");
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (item: any, itemIdx?: number) => {
    const editKey = item.id || (typeof itemIdx === 'number' ? `item-${itemIdx}` : Date.now().toString());
    setEditingId(editKey);
    setEditItem({ 
      type: item.type, 
      title: item.title, 
      content: item.content, 
      details: item.details || '', 
      songId: item.songId || '',
      moment: item.moment || '',
      bibleVersion: item.bibleVersion || 'NAA',
      vocalist: item.vocalist || '',
      duration: item.duration || ''
    });
    const standardMoments = ["", ...LITURGY_GENERAL_MOMENTS, ...LITURGY_SONG_MOMENTS];
    const isCustom = item.moment && !standardMoments.includes(item.moment);
    setShowCustomMomentInputEdit(!!isCustom);
    const isCustomCat = item.type === 'song' && item.content && !LITURGY_SONG_CATEGORIES.includes(item.content);
    setShowCustomCategoryInputEdit(!!isCustomCat);
    setShowEditBibleSearch(false);
  };

  const handleRemoveItem = async (itemId: string, index: number) => {
    const servicePath = `services/${service.id}`;
    try {
      const liturgy = service.liturgy || [];
      const updatedLiturgy = liturgy.filter((_: any, i: number) => i !== index);
      const songIds = updatedLiturgy
        .filter((item: any) => item && (item.type === 'song' || item.songId))
        .map((item: any) => item.songId || item.id)
        .filter(Boolean);

      const updateData: any = { 
        liturgy: updatedLiturgy,
        setlist: songIds,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(doc(db, 'services', service.id), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
    }
  };

  const handleReorder = async (newOrder: any[]) => {
    const servicePath = `services/${service.id}`;
    try {
      const songIds = newOrder
        .filter((item: any) => item && (item.type === 'song' || item.songId))
        .map((item: any) => item.songId || item.id)
        .filter(Boolean);

      await updateDoc(doc(db, 'services', service.id), { 
        liturgy: newOrder,
        setlist: songIds,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
    }
  };

  const handlePlaylistUpdate = async (url: string) => {
    const servicePath = `services/${service.id}`;
    try {
      await updateServicePlaylistUrl(service.id, url);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const liturgy = [...(service.liturgy || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= liturgy.length) return;

    if (!window.confirm('Deseja alterar a ordem da música no culto?')) return;

    const temp = liturgy[index];
    liturgy[index] = liturgy[newIndex];
    liturgy[newIndex] = temp;
    
    const songIds = liturgy
      .filter((item: any) => item && (item.type === 'song' || item.songId))
      .map((item: any) => item.songId || item.id)
      .filter(Boolean);

    const servicePath = `services/${service.id}`;
    try {
      await updateDoc(doc(db, 'services', service.id), { 
        liturgy,
        setlist: songIds,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
    }
  };

  const handleMoveMomentGroup = async (groupIndex: number, direction: 'up' | 'down') => {
    const groups = getMomentGroups(service.liturgy || []);
    if (direction === 'up' && groupIndex === 0) return;
    if (direction === 'down' && groupIndex === groups.length - 1) return;

    if (!window.confirm('Deseja alterar a ordem deste momento no culto?')) return;

    const targetGroupIndex = direction === 'up' ? groupIndex - 1 : groupIndex + 1;
    
    const reorderedGroups = [...groups];
    const temp = reorderedGroups[groupIndex];
    reorderedGroups[groupIndex] = reorderedGroups[targetGroupIndex];
    reorderedGroups[targetGroupIndex] = temp;

    const updatedLiturgy = reorderedGroups.flatMap(g => g.items.map(gi => gi.item));
    const songIds = updatedLiturgy
      .filter((item: any) => item && (item.type === 'song' || item.songId))
      .map((item: any) => item.songId || item.id)
      .filter(Boolean);
    
    const servicePath = `services/${service.id}`;
    try {
      await updateDoc(doc(db, 'services', service.id), { 
        liturgy: updatedLiturgy,
        setlist: songIds,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
    }
  };

  if (playlistOnly) {
    return (
      <div className="mt-8 space-y-4 pt-8 border-t border-white/10">
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
             <h4 className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-8 sm:12 h-[1px] bg-brand/50"></span> 
                Playlist do Culto
                <span className="w-8 sm:12 h-[1px] bg-brand/50"></span>
             </h4>
          </div>

          <div className="bg-brand/10 p-5 rounded-2xl border border-brand/20 shadow-lg shadow-brand/5 max-w-2xl mx-auto w-full">
             <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-brand/20 flex items-center justify-center text-brand shrink-0 shadow-inner">
                  <Youtube size={24} />
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-[10px] font-black text-text-main uppercase tracking-[0.15em] pl-1 flex items-center gap-2 opacity-80">
                     Link da Playlist no YouTube
                  </label>
                  <Input 
                    placeholder="https://youtube.com/playlist?list=..." 
                    value={service.playlistUrl || ''} 
                    onChange={e => handlePlaylistUpdate(e.target.value)}
                    className="bg-black/20 dark:bg-white/5 border border-white/10 text-text-main h-11 text-xs py-0 w-full focus:ring-brand/30 transition-all rounded-xl"
                  />
                </div>
                {service.playlistUrl && (
                  <div className="shrink-0 self-end pb-0.5">
                    <Button 
                      onClick={() => { window.open(service.playlistUrl, '_blank'); }}
                      className="h-11 px-4 bg-white hover:bg-white/90 text-[#E60000] border border-[#E60000]/20 font-bold rounded-xl shadow-lg shadow-red-500/5 flex items-center gap-2"
                    >
                      <Youtube size={16} fill="#E60000" />
                      Playlist do Culto
                    </Button>
                  </div>
                )}
             </div>
          </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4 pt-8 border-t border-black/10 dark:border-white/10">
        <div className="flex flex-col items-center justify-center gap-4 mb-6">
           <h4 className="text-[10px] sm:text-[11px] font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-8 sm:12 h-[1px] bg-brand/50"></span> 
              Liturgia e Louvor
              <span className="w-8 sm:12 h-[1px] bg-brand/50"></span>
           </h4>
           {isAdmin && (
             <div className="flex flex-wrap items-center justify-center gap-3">
               {isEditing ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSaveLiturgy} 
                    disabled={saveStatus === "saving"}
                    className={cn(
                      "text-[10px] sm:text-[11px] font-black uppercase tracking-widest flex items-center gap-2 px-5 py-2 rounded-full border shadow-lg active:scale-95 cursor-pointer transition-all",
                      saveStatus === "saving" && "bg-amber-600 text-white border-amber-600 cursor-wait",
                      saveStatus === "success" && "bg-emerald-600 text-white border-emerald-600",
                      saveStatus === "error" && "bg-red-600 text-white border-red-600",
                      saveStatus === "idle" && "text-white bg-emerald-600 hover:bg-emerald-700 border-emerald-600/30 shadow-emerald-600/20"
                    )}
                  >
                    {saveStatus === "saving" ? (
                      <>
                        <Loader2 size={14} className="animate-spin"/>
                        Salvando...
                      </>
                    ) : saveStatus === "success" ? (
                      <>
                        <Check size={14} strokeWidth={3}/>
                        Salvo no Firebase!
                      </>
                    ) : (
                      <>
                        <Save size={14}/>
                        Salvar Liturgia
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="text-[10px] sm:text-[11px] font-black text-text-muted hover:text-text-main transition-all uppercase tracking-widest flex items-center gap-1.5 bg-black/10 hover:bg-black/20 px-3.5 py-2 rounded-full border border-border shadow cursor-pointer"
                    title="Fechar modo de edição"
                  >
                    <X size={14}/>
                    Sair
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="text-[10px] sm:text-[11px] font-black text-brand dark:text-white transition-all uppercase tracking-widest flex items-center gap-2 bg-brand/10 dark:bg-brand/30 hover:bg-brand/20 dark:hover:bg-brand/40 px-5 py-2 rounded-full border border-brand/20 dark:border-brand/40 shadow-lg shadow-brand/10 active:scale-95 cursor-pointer"
                >
                  <Plus size={14}/>
                  Configurar Liturgia
                </button>
              )}
               <button 
                 onClick={() => setIsCloning(!isCloning)} 
                 className="text-[10px] sm:text-[11px] font-black text-text-main transition-all uppercase tracking-widest flex items-center gap-2 bg-black/10 hover:bg-black/20 px-5 py-2 rounded-full border border-border shadow-lg active:scale-95 cursor-pointer"
               >
                 <Copy size={14}/>
                 Clonar Anterior
               </button>
               {(service.liturgy || []).length > 0 && (
                 <>
                   <button 
                     onClick={handleManualNotifyLiturgy} 
                     disabled={isSaving}
                     className="text-[10px] sm:text-[11px] font-black text-emerald-700 dark:text-white transition-all uppercase tracking-widest flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-600/30 hover:bg-emerald-500/20 dark:hover:bg-emerald-600/50 px-5 py-2 rounded-full border border-emerald-500/20 dark:border-emerald-500/40 shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50 cursor-pointer"
                   >
                     <Bell size={14}/>
                     Notificar Membros (In-App)
                   </button>
                   <button 
                     onClick={handleShareLiturgyWhatsApp} 
                     disabled={isSaving}
                     className="text-[10px] sm:text-[11px] font-black text-white transition-all uppercase tracking-widest flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-5 py-2 rounded-full border border-emerald-600/30 shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
                   >
                     <Share2 size={14}/>
                     Compartilhar no WhatsApp
                   </button>
                   <button 
                     onClick={() => {
                       if (confirmDeleteLiturgy) {
                         handleClearLiturgy();
                       } else {
                         setConfirmDeleteLiturgy(true);
                       }
                     }}
                     disabled={isSaving}
                     className={`text-[10px] sm:text-[11px] font-black transition-all uppercase tracking-widest flex items-center gap-2 px-5 py-2 rounded-full border active:scale-95 disabled:opacity-50 cursor-pointer ${
                       confirmDeleteLiturgy 
                         ? 'bg-red-600 text-white border-red-600 animate-pulse' 
                         : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                     }`}
                   >
                     <Trash2 size={14}/>
                     {confirmDeleteLiturgy ? 'Confirmar Excluir?' : 'Excluir Liturgia'}
                   </button>
                 </>
               )}
             </div>
           )}

           {/* Agrupar por Momentos Toggle */}
           {(service.liturgy || []).length > 0 && (
             <div className="flex items-center justify-center gap-3 mt-2 bg-black/5 dark:bg-white/5 py-2 px-5 rounded-full border border-black/5 dark:border-white/5 shadow-sm">
               <span className="text-[10px] font-black uppercase tracking-widest text-[#E60000]/80 dark:text-zinc-400">Listar Sequencial</span>
               <button
                 type="button"
                 onClick={() => setIsGroupedByMoments(!isGroupedByMoments)}
                 className={cn(
                   "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                   isGroupedByMoments ? "bg-brand" : "bg-zinc-400 dark:bg-zinc-600"
                 )}
               >
                 <span
                   className={cn(
                     "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                     isGroupedByMoments ? "translate-x-5" : "translate-x-0"
                   )}
                 />
               </button>
               <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", isGroupedByMoments ? "text-brand" : "text-zinc-500")}>Agrupar por Momentos 🧩</span>
             </div>
           )}
        </div>

       {isCloning && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-8 bg-brand/5 border border-brand/20 rounded-2xl p-6 overflow-hidden max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-between mb-4 px-1">
               <div>
                 <h4 className="text-[11px] font-black text-brand uppercase tracking-widest leading-none">Clonar Liturgia</h4>
                 <p className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-tight">Escolha um culto para copiar os itens</p>
               </div>
               <button onClick={() => setIsCloning(false)} className="text-brand hover:scale-110 transition-transform p-2 cursor-pointer"><X size={20}/></button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {pastServices.length > 0 ? (
                pastServices.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleCloneLiturgy(s.id)}
                    className="bg-black/5 dark:bg-black/10 border border-black/10 dark:border-white/5 hover:bg-brand hover:border-brand px-5 py-4 rounded-2xl transition-all text-left min-w-[220px] group cursor-pointer"
                  >
                    <span className="text-[10px] font-black text-brand group-hover:text-white uppercase tracking-widest block mb-1.5 opacity-80">
                      {new Date(s.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                    </span>
                    <p className="text-sm font-black text-text-main group-hover:text-white leading-tight line-clamp-1 uppercase tracking-tight">{s.title}</p>
                    <div className="flex items-center gap-2 mt-2 opacity-60">
                       <BookOpen size={10} className="text-text-main group-hover:text-white"/>
                       <p className="text-[10px] text-text-main group-hover:text-white font-black uppercase tracking-widest">{s.liturgy.length} itens</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="w-full text-center py-6">
                  <p className="text-xs text-brand/60 font-bold italic">Nenhum culto anterior com liturgia encontrado no sistema.</p>
                </div>
              )}
            </div>
          </motion.div>
       )}

        {/* Visualização limpa da Liturgia sem campo redundante de playlist */}

       {isEditing && (
          <div className="space-y-4 mb-6 animate-in slide-in-from-top duration-300">
             <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl space-y-4 border border-border mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                   <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-[9px] font-black text-text-main uppercase pl-1 opacity-70">Atividade do Culto</label>
                      <select 
                        className="w-full bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand cursor-pointer"
                        value={newItem.type}
                        onChange={e => setNewItem({...newItem, type: e.target.value})}
                      >
                        <option value="reading">📖 Leitura Bíblica</option>
                        <option value="song">🎵 Música/Louvor</option>
                        <option value="speech">🎤 Palavra</option>
                        <option value="prayer">🙏 Oração Pastoral</option>
                        <option value="announcements">📢 Avisos</option>
                        <option value="offering">💸 Ofertas</option>
                        <option value="other">✨ Outro</option>
                      </select>
                   </div>
                   <div className={cn(newItem.type === 'song' ? "sm:col-span-3" : "sm:col-span-4", "space-y-1.5")}>
                      <label className="text-[9px] font-black text-text-main uppercase pl-1 opacity-70">Título</label>
                      {newItem.type === 'song' ? (
                        <div className="relative">
                           <input
                             list="song-list-new"
                             placeholder="Pesquisar música..."
                             value={newItem.title}
                             onChange={e => {
                               const selectedSong = songs.find(s => s.title === e.target.value);
                               setNewItem({
                                 ...newItem, 
                                 title: e.target.value,
                                 songId: selectedSong ? selectedSong.id : ''
                               });
                             }}
                             className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand bg-black/25 text-text-main h-10 text-xs py-0 transition-all placeholder:text-text-muted/50"
                           />
                           <datalist id="song-list-new">
                             {songs.map(s => <option key={s.id} value={s.title}>{s.artist}</option>)}
                           </datalist>
                        </div>
                      ) : (
                        <Input 
                          placeholder="Ex: Salmo 23" 
                          value={newItem.title} 
                          onChange={e => setNewItem({...newItem, title: e.target.value, songId: ''})}
                          className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 text-xs py-0"
                        />
                      )}
                   </div>

                   {newItem.type === 'song' && (
                     <div className="sm:col-span-12">
                       <MultiVocalistSelector
                         value={newItem.vocalist || ''}
                         onChange={(val) => setNewItem({ ...newItem, vocalist: val })}
                         vocalists={vocalists}
                         members={members}
                       />
                     </div>
                   )}

                   <div className={cn(newItem.type === 'song' ? "sm:col-span-2" : "sm:col-span-3", "space-y-1.5")}>
                      <label className="text-[9px] font-black text-text-main uppercase pl-1 opacity-70">
                        {newItem.type === 'song' ? 'CATEGORIA DA MÚSICA' : 'CATEGORIA'}
                      </label>
                      {newItem.type === 'song' ? (
                        <div className="space-y-2">
                          <select 
                            className="w-full bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand cursor-pointer"
                            value={showCustomCategoryInput ? 'custom' : (newItem.content || '')}
                            onChange={e => {
                              if (e.target.value === 'custom') {
                                setShowCustomCategoryInput(true);
                                setNewItem({ ...newItem, content: '' });
                              } else {
                                setShowCustomCategoryInput(false);
                                setNewItem({ ...newItem, content: e.target.value });
                              }
                            }}
                          >
                            <option value="">Opcional</option>
                            {LITURGY_SONG_CATEGORIES.map((opt, oIdx) => (
                              <option key={opt} value={opt === 'PERSONALIZAR' ? 'custom' : opt}>
                                {`${oIdx + 1} - ${opt}`}
                              </option>
                            ))}
                          </select>
                          {showCustomCategoryInput && (
                            <Input 
                              placeholder="Digite a categoria personalizada..."
                              value={newItem.content}
                              onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                              className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 text-xs py-0"
                            />
                          )}
                        </div>
                      ) : (
                        <select 
                          className="w-full bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand cursor-pointer"
                          value={newItem.content}
                          onChange={e => setNewItem({...newItem, content: e.target.value})}
                        >
                          <option value="">Opcional</option>
                          {LITURGY_NON_SONG_CATEGORIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                   </div>
                   <div className="sm:col-span-2">
                      <Button 
                        onClick={handleAddItem} 
                        disabled={addItemStatus === "saving" || isSaving || !newItem.title}
                        className={cn(
                          "w-full h-10 text-[10px] uppercase font-black tracking-widest transition-all",
                          addItemStatus === "saving" && "bg-amber-600 hover:bg-amber-600 text-white cursor-wait",
                          addItemStatus === "success" && "bg-emerald-600 hover:bg-emerald-600 text-white",
                          addItemStatus === "error" && "bg-red-600 hover:bg-red-600 text-white",
                          addItemStatus === "idle" && "bg-brand hover:brightness-110 text-white"
                        )}
                      >
                        {addItemStatus === "saving" ? (
                          <span className="flex items-center gap-1.5 justify-center">
                            <Loader2 size={14} className="animate-spin" />
                            Salvando...
                          </span>
                        ) : addItemStatus === "success" ? (
                          <span className="flex items-center gap-1.5 justify-center">
                            <Check size={14} strokeWidth={3} />
                            Adicionado!
                          </span>
                        ) : addItemStatus === "error" ? (
                          <span className="flex items-center gap-1.5 justify-center">
                            <AlertTriangle size={14} />
                            Erro ao Salvar
                          </span>
                        ) : (
                          "Adicionar"
                        )}
                      </Button>
                   </div>

                    {/* Momento do Culto */}
                    <div className="sm:col-span-12 space-y-1.5 pt-3 border-t border-border/20">
                       <label className="text-[9px] font-black text-text-main/80 uppercase pl-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                          {newItem.type === 'song' ? 'Ordem / Momento da Música' : 'Agrupar em qual Momento?'}
                       </label>
                       <div className="flex flex-col sm:flex-row gap-2">
                          <select 
                             className="w-full sm:w-1/2 bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand cursor-pointer"
                             value={showCustomMomentInput ? 'custom' : (newItem.moment || '')}
                             onChange={e => {
                                if (e.target.value === 'custom') {
                                   setShowCustomMomentInput(true);
                                   setNewItem(prev => ({ ...prev, moment: '' }));
                                } else {
                                   setShowCustomMomentInput(false);
                                   setNewItem(prev => ({ ...prev, moment: e.target.value }));
                                }
                             }}
                          >
                             <option value="">Nenhum (Sem Momento)</option>
                             {newItem.type === 'song' ? (
                               <>
                                 <optgroup label="Ordem das Músicas">
                                   {LITURGY_SONG_MOMENTS.map(moment => (
                                     <option key={moment} value={moment}>🎵 {moment}</option>
                                   ))}
                                 </optgroup>
                                 <optgroup label="Momentos Gerais">
                                   {LITURGY_GENERAL_MOMENTS.map(moment => (
                                     <option key={moment} value={moment}>{moment}</option>
                                   ))}
                                 </optgroup>
                               </>
                             ) : (
                               LITURGY_GENERAL_MOMENTS.map(moment => (
                                 <option key={moment} value={moment}>{moment}</option>
                               ))
                             )}
                             <option value="custom">⚙️ Personalizado (Digitar)...</option>
                          </select>
                          {showCustomMomentInput && (
                             <Input 
                                placeholder="Digite um nome para o momento personalizado (Ex: Doxologia)..."
                                value={newItem.moment}
                                onChange={e => setNewItem(prev => ({ ...prev, moment: e.target.value }))}
                                className="flex-1 bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 text-xs py-0"
                             />
                          )}
                          <div className="w-full sm:w-1/4 shrink-0 flex items-center gap-2 bg-black/25 border border-border rounded-lg px-3 h-10 group focus-within:ring-2 focus-within:ring-brand/35 focus-within:border-brand">
                            <Clock size={13} className="text-brand shrink-0" />
                            <input 
                              type="number"
                              min="0"
                              placeholder="Tempo (min)..."
                              className="w-full bg-transparent border-none text-text-main text-xs p-0 outline-none focus:ring-0 focus:outline-none"
                              value={newItem.duration || ''}
                              onChange={e => setNewItem(prev => ({ ...prev, duration: e.target.value }))}
                            />
                          </div>
                       </div>
                    </div>

                    {/* Optional details (verses or texts) for the liturgy item */}
                    <div className="sm:col-span-12 space-y-1.5 pt-3">
                       <div className="flex items-center justify-between pl-1">
                          <label className="text-[9px] font-black text-text-main/80 uppercase">
                            Conteúdo / Detalhes (Opcional)
                          </label>
                          {newItem.type !== 'song' && (
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-text-main/60 uppercase">
                              <span>Versão do Texto:</span>
                              <select
                                value={newItem.bibleVersion || 'NAA'}
                                onChange={e => setNewItem(prev => ({ ...prev, bibleVersion: e.target.value }))}
                                className="bg-black/20 border border-border rounded px-1.5 py-0.5 text-[9px] font-black uppercase text-text-main outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                              >
                                <option value="NAA">NAA 2017 (Nova Almeida Atualizada)</option>
                                <option value="ARA">ARA (Revista & Atu.)</option>
                                <option value="ARC">ARC (Revista & Corr.)</option>
                                <option value="NVI">NVI (Internacional)</option>
                                <option value="NTLH">NTLH (Linguagem Hoje)</option>
                                <option value="ACF">ACF (Almeida Fiel)</option>
                              </select>
                            </div>
                          )}
                       </div>
                       <textarea 
                         placeholder="Insira o texto bíblico, versículo ou anotações..."
                         value={newItem.details}
                         onChange={e => setNewItem(prev => ({ ...prev, details: e.target.value }))}
                         className="w-full min-h-[85px] bg-black/20 border border-border text-xs text-text-main p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand resize-y leading-relaxed"
                       />
                    </div>

                    {/* Bible search component trigger */}
                    {newItem.type !== 'song' && (
                      <div className="pt-2 border-t border-white/5 col-span-1 sm:col-span-12 space-y-3">
                        <button
                          type="button"
                          onClick={() => setShowBibleSearch(!showBibleSearch)}
                          className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2 bg-brand/10 hover:bg-brand/20 border border-brand/20 px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center"
                        >
                          <BookOpen size={13} />
                          {showBibleSearch ? 'Fechar Assistente Bíblico' : 'Abrir Assistente Bíblico'}
                        </button>
                        
                        {showBibleSearch && (
                          <div className="mt-2">
                            <BibleSearch 
                              onInsert={({ title, text, version }) => {
                                setNewItem(prev => ({
                                  ...prev,
                                  title: title || prev.title,
                                  details: text || prev.details,
                                  bibleVersion: version || prev.bibleVersion || 'NAA'
                                }));
                              }}
                              onInsertDirect={async ({ title, text, version }) => {
                                setIsSaving(true);
                                try {
                                  const liturgy = service.liturgy || [];
                                  const newLiturgyItem = {
                                    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                                    type: newItem.type || 'reading',
                                    title,
                                    content: newItem.content || 'CHAMADO À ADORAÇÃO',
                                    details: text,
                                    songId: '',
                                    moment: newItem.moment || '',
                                    bibleVersion: version
                                  };
                                  const updatedLiturgy = [...liturgy, newLiturgyItem];
                                  await updateDoc(doc(db, 'services', service.id), { liturgy: updatedLiturgy });
                                  setNewItem({ type: 'reading', title: '', content: '', details: '', songId: '', moment: '', bibleVersion: 'NAA', vocalist: '', duration: '' });
                                  setShowBibleSearch(false);
                                } catch (error) {
                                  console.error("Error inserting directly:", error);
                                } finally {
                                  setIsSaving(false);
                                }
                              }}
                              onClose={() => setShowBibleSearch(false)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                </div>
             </div>
          </div>
       )}

       <div className="space-y-4 sm:space-y-5">
          {(service.liturgy || []).length > 0 ? (
            (() => {
              const renderItem = (item: any, idx: number) => {
                const isItemEditing = editingId === item.id;
                
                if (isItemEditing) {
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={`${item.id}-${idx}`} 
                      className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-brand/30 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          <div className="sm:col-span-3 space-y-1.5">
                            <label className="text-[9px] font-black text-text-main uppercase pl-1 opacity-70">Atividade do Culto</label>
                            <select 
                              className="w-full bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand cursor-pointer"
                              value={editItem.type}
                              onChange={e => setEditItem({...editItem, type: e.target.value})}
                            >
                              <option value="reading">📖 Leitura</option>
                              <option value="song">🎵 Música</option>
                              <option value="speech">🎤 Palavra</option>
                              <option value="prayer">🙏 Oração</option>
                              <option value="announcements">📢 Avisos</option>
                              <option value="offering">💸 Ofertas</option>
                              <option value="other">✨ Outro</option>
                            </select>
                          </div>
                          <div className={cn(editItem.type === 'song' ? "sm:col-span-3" : "sm:col-span-4", "space-y-1.5")}>
                            {editItem.type === 'song' ? (
                              <div className="relative">
                                 <input
                                   list="song-list-edit"
                                   placeholder="Selecione uma música..."
                                   value={editItem.title}
                                   onChange={e => {
                                     const selectedSong = songs.find(s => s.title === e.target.value);
                                     setEditItem({
                                       ...editItem, 
                                       title: e.target.value,
                                       songId: selectedSong ? selectedSong.id : ''
                                     });
                                   }}
                                   className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand bg-black/25 text-text-main h-10 text-xs py-0 transition-all placeholder:text-text-muted/50"
                                 />
                                 <datalist id="song-list-edit">
                                   {songs.map(s => <option key={s.id} value={s.title}>{s.artist}</option>)}
                                 </datalist>
                              </div>
                            ) : (
                              <Input 
                                value={editItem.title} 
                                onChange={e => setEditItem({...editItem, title: e.target.value, songId: ''})}
                                className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 text-xs py-0"
                              />
                            )}
                          </div>

                          {editItem.type === 'song' && (
                            <div className="sm:col-span-12">
                              <MultiVocalistSelector
                                value={editItem.vocalist || ''}
                                onChange={(val) => setEditItem({ ...editItem, vocalist: val })}
                                vocalists={vocalists}
                                members={members}
                              />
                            </div>
                          )}

                          <div className={cn(editItem.type === 'song' ? "sm:col-span-2" : "sm:col-span-3", "space-y-1.5")}>
                            <label className="text-[9px] font-black text-text-main uppercase pl-1 opacity-70">
                              {editItem.type === 'song' ? 'CATEGORIA DA MÚSICA' : 'CATEGORIA'}
                            </label>
                            {editItem.type === 'song' ? (
                              <div className="space-y-2">
                                <select 
                                  className="w-full bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand appearance-none cursor-pointer"
                                  value={showCustomCategoryInputEdit ? 'custom' : (editItem.content || '')}
                                  onChange={e => {
                                    if (e.target.value === 'custom') {
                                      setShowCustomCategoryInputEdit(true);
                                      setEditItem({ ...editItem, content: '' });
                                    } else {
                                      setShowCustomCategoryInputEdit(false);
                                      setEditItem({ ...editItem, content: e.target.value });
                                    }
                                  }}
                                >
                                  <option value="">Opcional</option>
                                  {LITURGY_SONG_CATEGORIES.map((opt, oIdx) => (
                                    <option key={opt} value={opt === 'PERSONALIZAR' ? 'custom' : opt}>
                                      {`${oIdx + 1} - ${opt}`}
                                    </option>
                                  ))}
                                  {editItem.content && !LITURGY_SONG_CATEGORIES.includes(editItem.content) && !showCustomCategoryInputEdit && (
                                    <option value={editItem.content}>{editItem.content}</option>
                                  )}
                                </select>
                                {showCustomCategoryInputEdit && (
                                  <Input 
                                    placeholder="Digite a categoria personalizada..."
                                    value={editItem.content}
                                    onChange={e => setEditItem({ ...editItem, content: e.target.value })}
                                    className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 text-xs py-0"
                                  />
                                )}
                              </div>
                            ) : (
                              <select 
                                className="w-full bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand appearance-none cursor-pointer"
                                value={editItem.content}
                                onChange={e => setEditItem({...editItem, content: e.target.value})}
                              >
                                <option value="">Opcional</option>
                                {LITURGY_NON_SONG_CATEGORIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                {editItem.content && !LITURGY_NON_SONG_CATEGORIES.includes(editItem.content) && (
                                  <option value={editItem.content}>{editItem.content}</option>
                                )}
                              </select>
                            )}
                          </div>
                          <div className="sm:col-span-2 flex gap-2">
                            <Button 
                              onClick={() => handleUpdateItem(item.id, idx)} 
                              disabled={itemEditStatus === "saving" || isSaving}
                              className={cn(
                                "flex-1 h-10 text-[10px] uppercase font-black tracking-widest transition-all",
                                itemEditStatus === "saving" && "bg-amber-600 hover:bg-amber-600 text-white cursor-wait",
                                itemEditStatus === "success" && "bg-emerald-600 hover:bg-emerald-600 text-white",
                                itemEditStatus === "error" && "bg-red-600 hover:bg-red-600 text-white",
                                itemEditStatus === "idle" && "bg-brand hover:brightness-110 text-white"
                              )}
                            >
                              {itemEditStatus === "saving" ? (
                                <span className="flex items-center gap-1.5 justify-center">
                                  <Loader2 size={14} className="animate-spin" />
                                  Salvando...
                                </span>
                              ) : itemEditStatus === "success" ? (
                                <span className="flex items-center gap-1.5 justify-center">
                                  <Check size={14} strokeWidth={3} />
                                  Salvo!
                                </span>
                              ) : itemEditStatus === "error" ? (
                                <span className="flex items-center gap-1.5 justify-center">
                                  <AlertTriangle size={14} />
                                  Erro!
                                </span>
                              ) : (
                                "Salvar"
                              )}
                            </Button>
                            <Button onClick={() => setEditingId(null)} variant="secondary" className="h-10 px-3 bg-black/5 border border-border text-text-main"><X size={14}/></Button>
                          </div>
                        </div>

                        {/* Momento do Culto */}
                        <div className="space-y-1.5 pt-3 border-t border-white/5">
                           <label className="text-[9px] font-black text-text-main/80 uppercase pl-1 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                              {editItem.type === 'song' ? 'Ordem / Momento da Música' : 'Momento do Culto (Agrupador)'}
                           </label>
                           <div className="flex flex-col sm:flex-row gap-2">
                              <select 
                                 className="w-full sm:w-1/2 bg-black/20 border border-border rounded-lg text-text-main text-xs p-2.5 h-10 outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand cursor-pointer"
                                 value={showCustomMomentInputEdit ? 'custom' : (editItem.moment || '')}
                                 onChange={e => {
                                    if (e.target.value === 'custom') {
                                       setShowCustomMomentInputEdit(true);
                                       setEditItem(prev => ({ ...prev, moment: '' }));
                                    } else {
                                       setShowCustomMomentInputEdit(false);
                                       setEditItem(prev => ({ ...prev, moment: e.target.value }));
                                    }
                                 }}
                              >
                                 <option value="">Nenhum (Sem Momento)</option>
                                 {editItem.type === 'song' ? (
                                   <>
                                     <optgroup label="Ordem das Músicas">
                                       {LITURGY_SONG_MOMENTS.map(moment => (
                                         <option key={moment} value={moment}>🎵 {moment}</option>
                                       ))}
                                     </optgroup>
                                     <optgroup label="Momentos Gerais">
                                       {LITURGY_GENERAL_MOMENTS.map(moment => (
                                         <option key={moment} value={moment}>{moment}</option>
                                       ))}
                                     </optgroup>
                                   </>
                                 ) : (
                                   LITURGY_GENERAL_MOMENTS.map(moment => (
                                     <option key={moment} value={moment}>{moment}</option>
                                   ))
                                 )}
                                 <option value="custom">⚙️ Personalizado (Digitar)...</option>
                              </select>
                              {showCustomMomentInputEdit && (
                                 <Input 
                                    placeholder="Digite um nome para o momento personalizado (Ex: Doxologia)..."
                                    value={editItem.moment || ''}
                                    onChange={e => setEditItem(prev => ({ ...prev, moment: e.target.value }))}
                                    className="flex-1 bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 text-xs py-0"
                                 />
                              )}
                              <div className="w-full sm:w-1/4 shrink-0 flex items-center gap-2 bg-black/25 border border-border rounded-lg px-3 h-10 group focus-within:ring-2 focus-within:ring-brand/35 focus-within:border-brand">
                                <Clock size={13} className="text-brand shrink-0" />
                                <input 
                                  type="number"
                                  min="0"
                                  placeholder="Tempo (min)..."
                                  className="w-full bg-transparent border-none text-text-main text-xs p-0 outline-none focus:ring-0 focus:outline-none"
                                  value={editItem.duration || ''}
                                  onChange={e => setEditItem(prev => ({ ...prev, duration: e.target.value }))}
                                />
                              </div>
                           </div>
                        </div>

                        {/* Optional edit details (verses or texts) */}
                        <div className="space-y-1.5 pt-3 border-t border-white/5">
                           <div className="flex items-center justify-between pl-1">
                              <label className="text-[9px] font-black text-text-main/80 uppercase">
                                Conteúdo / Detalhes (Opcional)
                              </label>
                              {editItem.type !== 'song' && (
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-text-main/60 uppercase">
                                  <span>Versão do Texto:</span>
                                  <select
                                    value={editItem.bibleVersion || 'NAA'}
                                    onChange={e => setEditItem(prev => ({ ...prev, bibleVersion: e.target.value }))}
                                    className="bg-black/20 border border-border rounded px-1.5 py-0.5 text-[9px] font-black uppercase text-text-main outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                                  >
                                    <option value="NAA">NAA 2017 (Nova Almeida Atualizada)</option>
                                    <option value="ARA">ARA (Revista & Atu.)</option>
                                    <option value="ARC">ARC (Revista & Corr.)</option>
                                    <option value="NVI">NVI (Internacional)</option>
                                    <option value="NTLH">NTLH (Linguagem Hoje)</option>
                                    <option value="ACF">ACF (Almeida Fiel)</option>
                                  </select>
                                </div>
                              )}
                           </div>
                           <textarea 
                             placeholder="Insira o texto bíblico, versículo ou anotações..."
                             value={editItem.details || ''}
                             onChange={e => setEditItem(prev => ({ ...prev, details: e.target.value }))}
                             className="w-full min-h-[85px] bg-black/20 border border-border text-xs text-text-main p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand resize-y leading-relaxed"
                           />
                        </div>

                        {/* Bible search component trigger */}
                        {editItem.type !== 'song' && (
                          <div className="pt-2 border-t border-white/5 space-y-3">
                            <button
                              type="button"
                              onClick={() => setShowEditBibleSearch(!showEditBibleSearch)}
                              className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2 bg-brand/10 hover:bg-brand/20 border border-brand/20 px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center"
                            >
                              <BookOpen size={13} />
                              {showEditBibleSearch ? 'Fechar Assistente Bíblico' : 'Abrir Assistente Bíblico'}
                            </button>
                            
                            {showEditBibleSearch && (
                              <div className="mt-2">
                                <BibleSearch 
                                  onInsert={({ title, text, version }) => {
                                    setEditItem(prev => ({
                                      ...prev,
                                      title: title || prev.title,
                                      details: text || prev.details,
                                      bibleVersion: version || prev.bibleVersion || 'NAA'
                                    }));
                                  }}
                                  onInsertDirect={async ({ title, text, version }) => {
                                    setIsSaving(true);
                                    try {
                                      const liturgy = service.liturgy || [];
                                      const updatedLiturgy = liturgy.map((li: any) => {
                                        if (li.id === item.id) {
                                          return {
                                            ...li,
                                            title,
                                            details: text,
                                            bibleVersion: version
                                          };
                                        }
                                        return li;
                                      });
                                      await updateDoc(doc(db, 'services', service.id), { liturgy: updatedLiturgy });
                                      setEditingId(null);
                                      setShowEditBibleSearch(false);
                                    } catch (error) {
                                      console.error("Error updating directly:", error);
                                    } finally {
                                      setIsSaving(false);
                                    }
                                  }}
                                  onClose={() => setShowEditBibleSearch(false)}
                                />
                              </div>
                            )}
                          </div>
                        )}
                    </motion.div>
                  );
                }

                return (
                  <LiturgyItemCard
                    key={`${item.id}-${idx}`}
                    item={item}
                    idx={idx}
                    isAdmin={isAdmin}
                    onOpenSong={onOpenSong}
                    startEditing={startEditing}
                    handleMove={handleMove}
                    handleRemoveItem={handleRemoveItem}
                    serviceLiturgyLength={normalizedLiturgy.length}
                    dragControlsEnabled={false}
                    calculatedTime={timelineTimes[item.id]}
                  />
                );
              };

              if (isGroupedByMoments) {
                const groups = getMomentGroups(normalizedLiturgy);
                return (
                  <div className="space-y-6">
                    {groups.map((group, gIdx) => {
                      const style = getMomentStyles(group.moment);
                      return (
                        <div key={`moment-group-${group.moment}-${gIdx}`} className={cn("rounded-2xl border p-4 sm:p-5 transition-all space-y-3", style.bg, style.border)}>
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-black/10 dark:border-white/10 gap-2">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", style.dot)} />
                              <h4 className={cn("text-xs font-black uppercase tracking-widest", style.text)}>
                                {style.label}
                              </h4>
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-1 sm:gap-1.5 no-export shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleMoveMomentGroup(gIdx, 'up'); }}
                                  disabled={gIdx === 0}
                                  className={cn(
                                    "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/15 text-text-main dark:text-zinc-300 hover:bg-black/20 dark:hover:bg-white/10 active:scale-95 transition-all disabled:opacity-20",
                                    gIdx === 0 && "cursor-not-allowed"
                                  )}
                                  title="Subir momento completo"
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleMoveMomentGroup(gIdx, 'down'); }}
                                  disabled={gIdx === groups.length - 1}
                                  className={cn(
                                    "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/15 text-text-main dark:text-zinc-300 hover:bg-black/20 dark:hover:bg-white/10 active:scale-95 transition-all disabled:opacity-20",
                                    gIdx === groups.length - 1 && "cursor-not-allowed"
                                  )}
                                  title="Descer momento completo"
                                >
                                  <ChevronDown size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          {isAdmin ? (
                            <Reorder.Group
                              values={group.items.map(gi => gi.item)}
                              onReorder={(newItemsOrder) => {
                                const updatedLiturgy = [...normalizedLiturgy];
                                const originalIndices = group.items.map(gi => gi.originalIndex);
                                originalIndices.forEach((origIdx, oIdx) => {
                                  updatedLiturgy[origIdx] = newItemsOrder[oIdx];
                                });
                                handleReorder(updatedLiturgy);
                              }}
                              axis="y"
                              className="space-y-3"
                            >
                              {group.items.map(({ item, originalIndex }) => {
                                const isItemEditing = editingId === item.id;
                                if (isItemEditing) {
                                  return (
                                    <Reorder.Item
                                      key={item.id}
                                      value={item}
                                      dragListener={false}
                                      className="w-full"
                                    >
                                      {renderItem(item, originalIndex)}
                                    </Reorder.Item>
                                  );
                                }
                                return (
                                  <LiturgyItemCard
                                    key={item.id}
                                    item={item}
                                    idx={originalIndex}
                                    isAdmin={isAdmin}
                                    onOpenSong={onOpenSong}
                                    startEditing={startEditing}
                                    handleMove={handleMove}
                                    handleRemoveItem={handleRemoveItem}
                                    serviceLiturgyLength={normalizedLiturgy.length}
                                    dragControlsEnabled={isAdmin}
                                    calculatedTime={timelineTimes[item.id]}
                                  />
                                );
                              })}
                            </Reorder.Group>
                          ) : (
                            <div className="space-y-3">
                              {group.items.map(({ item, originalIndex }) => (
                                <LiturgyItemCard
                                  key={item.id}
                                  item={item}
                                  idx={originalIndex}
                                  isAdmin={false}
                                  onOpenSong={onOpenSong}
                                  startEditing={startEditing}
                                  handleMove={handleMove}
                                  handleRemoveItem={handleRemoveItem}
                                  serviceLiturgyLength={normalizedLiturgy.length}
                                  dragControlsEnabled={false}
                                  calculatedTime={timelineTimes[item.id]}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return isAdmin ? (
                <Reorder.Group 
                  values={normalizedLiturgy} 
                  onReorder={handleReorder} 
                  axis="y" 
                  className="space-y-4"
                >
                  {normalizedLiturgy.map((item: any, idx: number) => {
                    const isItemEditing = editingId === item.id;
                    if (isItemEditing) {
                      return (
                        <Reorder.Item
                          key={item.id}
                          value={item}
                          dragListener={false}
                          className="w-full"
                        >
                          {renderItem(item, idx)}
                        </Reorder.Item>
                      );
                    }
                    return (
                      <LiturgyItemCard
                        key={item.id}
                        item={item}
                        idx={idx}
                        isAdmin={isAdmin}
                        onOpenSong={onOpenSong}
                        startEditing={startEditing}
                        handleMove={handleMove}
                        handleRemoveItem={handleRemoveItem}
                        serviceLiturgyLength={normalizedLiturgy.length}
                        dragControlsEnabled={isAdmin}
                        calculatedTime={timelineTimes[item.id]}
                      />
                    );
                  })}
                </Reorder.Group>
              ) : (
                <div className="space-y-4">
                  {normalizedLiturgy.map((item: any, idx: number) => (
                    <LiturgyItemCard
                      key={item.id}
                      item={item}
                      idx={idx}
                      isAdmin={false}
                      onOpenSong={onOpenSong}
                      startEditing={startEditing}
                      handleMove={handleMove}
                      handleRemoveItem={handleRemoveItem}
                      serviceLiturgyLength={normalizedLiturgy.length}
                      dragControlsEnabled={false}
                      calculatedTime={timelineTimes[item.id]}
                    />
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="p-10 text-center border border-dashed border-border rounded-2xl bg-black/5 dark:bg-white/5">
               <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 text-text-main/20">
                  <Calendar size={24} />
               </div>
               <p className="text-sm sm:text-xs text-text-muted font-medium italic tracking-wide mb-6">Liturgia não configurada. Clique no botão abaixo para começar.</p>
               {isAdmin && (
                 <Button 
                   onClick={() => setIsEditing(true)}
                   className="bg-brand text-white font-black uppercase text-[10px] tracking-widest px-8 py-3 rounded-xl shadow-xl shadow-brand/20"
                 >
                   Configurar Liturgia
                 </Button>
               )}
            </div>
          )}
       </div>
        {isAdmin && (service.liturgy?.length > 0) && (
          <div className="pt-8 flex flex-col justify-center items-center gap-3">
            <AnimatePresence>
              {saveFeedbackMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg border",
                    saveStatus === "saving" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                    saveStatus === "success" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                    saveStatus === "error" && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                  )}
                >
                  {saveStatus === "saving" && <Loader2 size={15} className="animate-spin shrink-0" />}
                  {saveStatus === "success" && <Check size={15} strokeWidth={3} className="shrink-0" />}
                  {saveStatus === "error" && <AlertTriangle size={15} className="shrink-0" />}
                  <span>{saveFeedbackMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full sm:w-auto">
              <Button 
                onClick={handleSaveLiturgy}
                disabled={saveStatus === "saving"}
                className={cn(
                  "w-full sm:w-auto font-black uppercase text-xs tracking-widest px-10 py-4 rounded-xl shadow-xl flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-95 cursor-pointer",
                  saveStatus === "saving" && "bg-amber-600 text-white shadow-amber-600/20 cursor-wait opacity-90",
                  saveStatus === "success" && "bg-emerald-600 hover:bg-emerald-600 text-white shadow-emerald-600/30 scale-[1.02]",
                  saveStatus === "error" && "bg-red-600 hover:bg-red-600 text-white shadow-red-600/30",
                  saveStatus === "idle" && "bg-brand hover:bg-blue-700 text-white shadow-brand/20 hover:scale-[1.02]"
                )}
              >
                {saveStatus === "saving" && (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Salvando...</span>
                  </>
                )}
                {saveStatus === "success" && (
                  <>
                    <Check size={18} strokeWidth={3} className="text-white animate-bounce" />
                    <span>Liturgia Salva com Sucesso!</span>
                  </>
                )}
                {saveStatus === "error" && (
                  <>
                    <AlertTriangle size={18} className="text-white" />
                    <span>Erro ao Salvar! Tentar Novamente</span>
                  </>
                )}
                {saveStatus === "idle" && (
                  <>
                    <Check size={18} strokeWidth={3} />
                    <span>Concluir e Salvar Liturgia</span>
                  </>
                )}
              </Button>
              <button 
                type="button"
                onClick={() => {
                  if (confirmDeleteLiturgy) {
                    handleClearLiturgy();
                  } else {
                    setConfirmDeleteLiturgy(true);
                  }
                }}
                disabled={isSaving || saveStatus === "saving"}
                className={`w-full sm:w-auto font-black uppercase text-xs tracking-widest px-10 py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 border cursor-pointer active:scale-95 disabled:opacity-50 ${
                  confirmDeleteLiturgy 
                    ? "bg-red-600 border-red-600 text-white animate-pulse" 
                    : "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-500"
                }`}
              >
                <Trash2 size={18} />
                {confirmDeleteLiturgy ? "Confirmar Excluir?" : "Excluir Liturgia"}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}