import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { toPng } from 'html-to-image';
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Music, Calendar, Users, Home, Search, Plus, Minus, Download, Image as ImageIcon, Upload,
  Trash2, Edit, Save, ArrowLeft, Volume2, FileText, ExternalLink, Bell,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown, LogOut, Check, X, Sparkles, CloudOff, Wifi, WifiOff, Database,
  Clock, Activity, Maximize2, Minimize2, ThumbsUp, Menu, MoreHorizontal,
  Play, Pause, BookOpen, Book, Quote, GripVertical, Timer, ChevronsDown, RefreshCcw,
  Settings, FileDown, Youtube, MessageSquare, Share2, Zap, BarChart2, Copy,
  Send, Star, Lock, Unlock, CornerDownRight, Bold, Italic, Underline, Tv,
  AlertTriangle, Smartphone, Columns, Mic, MicOff, Loader2, GraduationCap, Camera, Gift, Baby, HelpCircle,
  Crown, ShieldCheck, Globe, Laptop, Mail
} from 'lucide-react';
import { Music2 } from './components/MusicIcon';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { 
  loginWithGoogle, logout, db, handleFirestoreError, OperationType,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  updateProfile, auth 
} from './lib/firebase';
import { 
  collection, query, onSnapshot, addDoc, deleteDoc, getDocs,
  doc, updateDoc, setDoc, getDoc, orderBy, Timestamp, where, serverTimestamp, deleteField 
} from 'firebase/firestore';
import { transposeLyricsAndChords, transposeChord, isChordLine, detectKey, isChordWord, parseChordLineIntoTokens, getCleanChordName, cleanTablatures } from './services/chordService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportJsonToExcel } from './utils/excelExport';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BibleSearch } from './components/BibleSearch';
import { ProjectorDisplay } from './components/ProjectorDisplay';
import { ProjectionView } from './components/ProjectionView';
import { ProjectionRemoteView } from './components/ProjectionRemoteView';
import { ChatView } from './components/ChatView';
import { ChordDictionaryModal, ChordDictionaryCard } from './components/ChordDictionary';
import CommercialLandingPage from './components/CommercialLandingPage';
import TheoryStudyView from './components/TheoryStudyView';
import { LeaderOnboardingWizard } from './components/LeaderOnboardingWizard';
import { CachedAvatar } from './components/CachedAvatar';
import BibleReaderView from './components/BibleReaderView';
import { forceCheckForAppUpdates } from './services/serviceWorkerManager';
import { QuickBibleSearch } from './components/QuickBibleSearch';
import { OfflineView } from './components/OfflineView';
import { SplashIntro } from './components/SplashIntro';
import { BibleVersionProvider } from './contexts/BibleVersionContext';
import HelpCenter from './components/HelpCenter';
import ContextualHelp from './components/ContextualHelp';
import MasterAdminView from './components/MasterAdminView';
import { TrialBanner } from './components/TrialBanner';
import { UpgradeModal } from './components/UpgradeModal';
import { SetPasswordView } from './components/SetPasswordView';
import { LuxuryAppInstallModal } from './components/LuxuryAppInstallModal';
import { CustomInstallBanner } from './components/CustomInstallBanner';
import { getChurchEffectivePlan, checkResourceLimit, ResourceCheckResult } from './services/planService';
import { getServiceSongs, getServicePlaylistSongs, getServiceSongIds, updateServicePlaylistUrl } from './utils/servicePlaylistUtils';
import { sendPushNotification, requestFcmToken, scheduleServiceWorkerNotification } from './services/fcmService';
import luxuryAppIcon from './assets/images/liloupro_luxury_logo_1787753536902.jpg';

// Lazy-loaded components for code-splitting
const DashboardView = lazy(() => import('./components/DashboardView'));
const SongsView = lazy(() => import('./components/SongsView'));
const LiturgyView = lazy(() => import('./components/LiturgyView'));
import { SongDetailView, AvailabilityView, LiturgyEditor } from './components/SongsView';


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
        console.warn("Imagem dinâmica do artista não disponível:", err);
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
      }}
      className={cn(
        "chord-btn cursor-pointer text-brand hover:text-white hover:bg-brand/80 dark:hover:bg-brand/30 px-0 rounded border-b border-dashed border-brand/50 hover:border-brand/80 transition-all font-black select-all active:scale-95 shadow-sm relative duration-100 font-mono",
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

  for (let j = 1; j < maxLen; j++) {
    // Prevent splitting a single chord word by avoiding boundaries inside contiguous non-space chord characters
    const isInsideChord = j < chordStyles.length && j - 1 >= 0 && 
                          chordStyles[j].char !== ' ' && chordStyles[j - 1].char !== ' ';

    if (!isInsideChord) {
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
    <div className="flex flex-wrap items-end gap-y-2 w-full select-none mb-3 break-inside-avoid">
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

        // Isolate chord word
        let chordWord = '';
        const chordCharsList: StyledChar[] = [];
        for (const cObj of segmentChordChars) {
          if (cObj.char !== ' ') {
            chordWord += cObj.char;
            chordCharsList.push(cObj);
          } else {
            break;
          }
        }

        const spacesCount = widthCh - chordWord.length;

        return (
          <div 
            key={s} 
            style={{ 
              width: `${widthCh}ch`, 
              minWidth: `${widthCh}ch`, 
              maxWidth: `${widthCh}ch`,
              display: 'inline-block',
              verticalAlign: 'bottom'
            }}
            className="flex flex-col select-none"
          >
            {/* Chord Slot */}
            <div className="min-h-[1.4em] select-none text-brand font-black relative whitespace-pre leading-none flex items-end">
              {chordWord ? (
                <>
                  <ChordButton 
                    text={chordWord} 
                    bold={chordCharsList[0]?.bold} 
                    italic={chordCharsList[0]?.italic} 
                    underline={chordCharsList[0]?.underline}
                    setActiveChordInDict={setActiveChordInDict}
                  />
                  {spacesCount > 0 ? ' '.repeat(spacesCount) : ''}
                </>
              ) : (
                ' '.repeat(widthCh)
              )}
            </div>

            {/* Lyric Slot */}
            <div className="min-h-[1.4em] text-text-main relative whitespace-pre leading-none">
              {getStyledTextRuns(segmentLyricChars).map((run, rIdx) => {
                const char = run.text[0];
                return (
                  <span 
                    key={rIdx} 
                    className={cn(
                      run.bold && "font-black brightness-110",
                      run.italic && "italic",
                      run.underline && "underline decoration-current",
                      (char === '[' || char === ']') && "text-amber-500 font-extrabold",
                      (char === '{' || char === '}') && "text-cyan-500 font-extrabold"
                    )}
                  >
                    {run.text}
                  </span>
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
    let elemIdx = 0;
    return (
      <div 
        className="chord-line text-brand font-black min-h-[1.4em] mb-1 select-none"
        style={{ whiteSpace: 'pre', letterSpacing: '0', fontFamily: '"JetBrains Mono", monospace' }}
      >
        {tokens.map((token, tIdx) => {
          if (token.isChord) {
            elemIdx += token.text.length;
            return (
              <ChordButton 
                key={`t-${tIdx}`}
                text={token.text}
                bold={token.bold}
                italic={token.italic}
                underline={token.underline}
                setActiveChordInDict={setActiveChordInDict}
              />
            );
          } else {
            const charSpans: React.ReactNode[] = [];
            let currentText = '';
            let currentClasses = '';
            
            const isSpecial = (char: string) => char === '[' || char === ']' || char === '{' || char === '}';
            
            for (let c = 0; c < token.text.length; c++) {
              const char = token.text[c];
              const classes = cn(
                token.bold && "font-black brightness-110",
                token.italic && "italic",
                token.underline && "underline decoration-current",
                (char === '[' || char === ']') && "text-amber-500 font-extrabold",
                (char === '{' || char === '}') && "text-cyan-500 font-extrabold"
              );
              
              if (isSpecial(char)) {
                if (currentText) {
                  charSpans.push(
                    <span key={`c-${elemIdx - currentText.length}`} className={currentClasses}>
                      {currentText}
                    </span>
                  );
                  currentText = '';
                }
                charSpans.push(
                  <span key={`c-${elemIdx}`} className={classes}>
                    {char}
                  </span>
                );
                elemIdx++;
              } else {
                if (currentText && classes !== currentClasses) {
                  charSpans.push(
                    <span key={`c-${elemIdx - currentText.length}`} className={currentClasses}>
                      {currentText}
                    </span>
                  );
                  currentText = '';
                }
                currentText += char;
                currentClasses = classes;
                elemIdx++;
              }
            }
            if (currentText) {
              charSpans.push(
                <span key={`c-${elemIdx - currentText.length}`} className={currentClasses}>
                  {currentText}
                </span>
              );
            }
            return <React.Fragment key={`t-${tIdx}`}>{charSpans}</React.Fragment>;
          }
        })}
      </div>
    );
  }

  // Freestanding text line (for example: header [Intro], lyrics, or spacing)
  const styledChars = getStyledChars(line);
  const runs = getStyledTextRuns(styledChars);
  return (
    <div 
      style={{ whiteSpace: 'pre', minHeight: '1.4em' }}
      className="text-text-main mb-1"
    >
      {runs.length > 0 ? (
        runs.map((run, rIdx) => {
          const char = run.text[0];
          return (
            <span 
              key={rIdx} 
              className={cn(
                run.bold && "font-black brightness-110",
                run.italic && "italic",
                run.underline && "underline decoration-current",
                (char === '[' || char === ']') && "text-amber-500 font-extrabold",
                (char === '{' || char === '}') && "text-cyan-500 font-extrabold"
              )}
            >
              {run.text}
            </span>
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

// --- Main App Logic ---

export default function App() {
  const isProjectionWindow = window.location.search.includes('projection=true');
  const isRemoteWindow = window.location.search.includes('remote=true');

  if (isProjectionWindow) {
    return <ProjectorDisplay />;
  }

  if (isRemoteWindow) {
    return (
      <AuthProvider>
        <ProjectionRemoteView />
      </AuthProvider>
    );
  }

  return (
    <BibleVersionProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </BibleVersionProvider>
  );
}

function AuthView({ 
  defaultMode = 'login', 
  onBackToLanding 
}: { 
  defaultMode?: 'login' | 'signup', 
  onBackToLanding?: () => void 
}) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Check if opened after logout or first time to show install prompt automatically
  useEffect(() => {
    try {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      const justLoggedOut = sessionStorage.getItem('liloupro_just_logged_out') === 'true';
      const promptHidden = localStorage.getItem('liloupro_hide_install_prompt') === 'true';

      if (!isStandalone && (justLoggedOut || !promptHidden)) {
        setShowInstallModal(true);
        if (justLoggedOut) {
          sessionStorage.removeItem('liloupro_just_logged_out');
        }
      }
    } catch (e) {
      console.warn("Could not check install prompt state:", e);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name) throw new Error('Por favor, informe seu nome.');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        // The useAuth hook will detect the user change and sync with Firestore
      } else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setSuccess('E-mail de recuperação enviado com sucesso!');
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      let message = 'Ocorreu um erro ao tentar realizar o cadastro.';
      
      const errorCode = err.code || 'erro-desconhecido';
      
      if (err.code === 'auth/user-not-found') message = 'Usuário não encontrado.';
      else if (err.code === 'auth/wrong-password') message = 'Senha incorreta.';
      else if (err.code === 'auth/invalid-email') message = 'E-mail inválido.';
      else if (err.code === 'auth/email-already-in-use') message = 'Este e-mail já está em uso por outro usuário.';
      else if (err.code === 'auth/weak-password') message = 'A senha deve ter pelo menos 6 caracteres.';
      else if (err.code === 'auth/operation-not-allowed') message = 'ERRO CRÍTICO: O login com E-mail/Senha não está ativado no seu Firebase Console. Por favor, ative-o em Authentication > Sign-in method.';
      else if (err.code === 'auth/configuration-not-found') message = 'Erro de configuração. Verifique se o projeto Firebase existe e está configurado corretamente.';
      else if (err.code === 'auth/network-request-failed') message = 'Erro de rede. Verifique sua conexão.';
      
      setError(`${message} (${errorCode})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-6 relative">
      {onBackToLanding && (
        <button 
          type="button"
          onClick={onBackToLanding}
          className="absolute top-6 left-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors py-2 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer z-50 shadow-md"
        >
          ← Voltar para o site
        </button>
      )}
      <Card className="max-w-md w-full p-8 space-y-6 bg-white/5 border-white/10 backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="relative inline-block mx-auto cursor-pointer group" onClick={() => setShowInstallModal(true)} title="Instalar aplicativo oficial no celular">
            <img 
              src={luxuryAppIcon} 
              alt="LiLouPro" 
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/60 shadow-lg shadow-black/60 group-hover:scale-105 transition-transform" 
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full border border-amber-200 shadow-md">
              <Sparkles size={10} className="fill-slate-950 stroke-slate-950" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight tracking-tight">LiLouPro</h1>
          <p className="text-white/90 text-sm font-medium">
            {mode === 'login' && 'Faça login para acessar sua escala.'}
            {mode === 'signup' && 'Crie sua conta para começar.'}
            {mode === 'forgot' && 'Recupere o acesso à sua conta.'}
          </p>

          <button
            type="button"
            onClick={() => setShowInstallModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105 mt-1"
          >
            <Smartphone size={12} className="text-amber-400" />
            <span>Já baixou o app no celular?</span>
            <ChevronRight size={12} />
          </button>
          
          {error && error.includes('auth/network-request-failed') && (
            <div className="p-4 mt-4 bg-orange-500/20 border border-orange-500/40 rounded-xl text-xs text-orange-200 leading-relaxed text-left">
              <p className="font-bold mb-1 uppercase tracking-widest flex items-center gap-2">
                <Settings size={12} /> Dica Técnica (Erro de Rede):
              </p>
              Para resolver este erro, acesse seu <b>Firestore Console &gt; Authentication &gt; Settings &gt; Authorized Domains</b> e adicione os seguintes domínios:
              <ul className="list-disc ml-4 mt-1 space-y-0.5 opacity-80">
                <li>liloupro.ai.studio</li>
                <li>ais-dev-db6wdygdzybm7rptwxhxjc-239798971644.us-east5.run.app</li>
                <li>ais-pre-db6wdygdzybm7rptwxhxjc-239798971644.us-east5.run.app</li>
              </ul>
            </div>
          )}
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-white/70 uppercase tracking-widest pl-1">Nome Completo</label>
              <Input 
                placeholder="Seu nome" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-white/70 uppercase tracking-widest pl-1">E-mail</label>
            <Input 
              type="email"
              placeholder="seu@email.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-white/70 uppercase tracking-widest pl-1">Senha</label>
              <Input 
                type="password"
                placeholder="******" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
          )}

          {error && (
            <p className="text-[11px] text-red-400 font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20 italic text-center">
              {error}
            </p>
          )}

          {success && (
            <p className="text-[11px] text-brand font-bold bg-brand/10 p-3 rounded-xl border border-brand/20 italic text-center">
              {success}
            </p>
          )}

          <Button 
            disabled={loading}
            className="w-full py-4 bg-brand hover:bg-brand/90 text-white shadow-xl shadow-brand/20 uppercase tracking-widest font-black text-xs h-14 rounded-xl"
          >
            {loading ? 'Processando...' : (mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Cadastrar' : 'Enviar Link')}
          </Button>
        </form>

        <div className="space-y-4">
          {mode === 'login' && (
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setMode('forgot')}
                className="text-[11px] text-white/60 hover:text-white transition-colors font-black uppercase tracking-widest text-center"
              >
                Esqueceu sua senha?
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-white/50"><span className="bg-surface px-2">ou</span></div>
              </div>

              <Button 
                onClick={loginWithGoogle} 
                variant="ghost" 
                className="w-full py-4 flex items-center justify-center gap-3 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs h-14 rounded-xl shadow-sm"
              >
                 <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" alt="Google" />
                 Entrar com Google
              </Button>
            </div>
          )}

          <div className="text-center pt-2">
            <button 
              onClick={() => {
                setError(null);
                setSuccess(null);
                setMode(mode === 'signup' ? 'login' : mode === 'forgot' ? 'login' : 'signup');
              }}
              className="text-[11px] font-black text-brand hover:text-cyan-300 uppercase tracking-widest underline decoration-2 underline-offset-4"
            >
              {mode === 'signup' ? 'Já tem uma conta? Faça Login' : mode === 'forgot' ? 'Voltar para o Login' : 'Não tem uma conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </Card>

      {/* Luxury App PWA Install Prompt Modal & Floating Banner */}
      <LuxuryAppInstallModal 
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        userName="Ministro"
      />
      <CustomInstallBanner 
        onOpenGuideModal={() => setShowInstallModal(true)}
      />
    </div>
  );
}

// Color Presets for Church Customization
export const COLOR_PRESETS: Record<string, {
  name: string;
  brandDark: string;
  brandLight: string;
  primary: string;
  accent: string;
  surfaceDark: string;
  surfaceLight: string;
}> = {
  semente: {
    name: "Semente original (Verde-água)",
    brandDark: "#2ba9b8",
    brandLight: "#0284c7",
    primary: "#115e59",
    accent: "#0f766e",
    surfaceDark: "#042f2e",
    surfaceLight: "#ffffff"
  },
  navy: {
    name: "Céu Celestial (Azul)",
    brandDark: "#3b82f6",
    brandLight: "#1d4ed8",
    primary: "#1e3a8a",
    accent: "#1d4ed8",
    surfaceDark: "#0f172a",
    surfaceLight: "#ffffff"
  },
  burgundy: {
    name: "Fogo Clássico (Vinho)",
    brandDark: "#ef4444",
    brandLight: "#b91c1c",
    primary: "#7f1d1d",
    accent: "#b91c1c",
    surfaceDark: "#1a0505",
    surfaceLight: "#ffffff"
  },
  lavender: {
    name: "Litúrgico Real (Roxo)",
    brandDark: "#a855f7",
    brandLight: "#7e22ce",
    primary: "#581c87",
    accent: "#7e22ce",
    surfaceDark: "#120924",
    surfaceLight: "#ffffff"
  },
  gold: {
    name: "Chama Dourada (Dourado)",
    brandDark: "#f59e0b",
    brandLight: "#d97706",
    primary: "#78350f",
    accent: "#b45309",
    surfaceDark: "#1a0f02",
    surfaceLight: "#ffffff"
  },
  forest: {
    name: "Oliveira & Esperança (Verde)",
    brandDark: "#10b981",
    brandLight: "#047857",
    primary: "#064e3b",
    accent: "#047857",
    surfaceDark: "#022c22",
    surfaceLight: "#ffffff"
  },
  black: {
    name: "Preto Absoluto (Jet Black)",
    brandDark: "#f8fafc",
    brandLight: "#09090b",
    primary: "#18181b",
    accent: "#ffffff",
    surfaceDark: "#000000",
    surfaceLight: "#ffffff"
  }
};

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

function DynamicThemeStyle({ churchData }: { churchData: any }) {
  if (!churchData) return null;
  
  const themeKey = churchData.themeColor || 'navy';
  let activeTheme = COLOR_PRESETS[themeKey];
  
  if (themeKey === 'custom' && churchData.customBrandColor) {
    const customBrand = churchData.customBrandColor;
    activeTheme = {
      name: "Customizado",
      brandDark: customBrand,
      brandLight: customBrand,
      primary: customBrand,
      accent: customBrand,
      surfaceDark: "#0b0f19",
      surfaceLight: "#ffffff"
    };
  } else if (!activeTheme) {
    activeTheme = COLOR_PRESETS.navy;
  }
  
  const brandDarkText = getContrastColor(activeTheme.brandDark);
  const brandLightText = getContrastColor(activeTheme.brandLight);
  
  const styleContent = `
    :root {
      --primary: ${activeTheme.primary};
      --brand: ${activeTheme.brandDark};
      --brand-text: ${brandDarkText};
      --accent: ${activeTheme.accent};
      --surface: ${activeTheme.surfaceDark};
    }
    .light {
      --primary: ${activeTheme.primary};
      --brand: ${activeTheme.brandLight};
      --brand-text: ${brandLightText};
      --accent: ${activeTheme.accent};
      --surface: ${activeTheme.surfaceLight};
    }
    .dark select option {
      background-color: ${activeTheme.surfaceDark};
    }
  `;
  
  return <style dangerouslySetInnerHTML={{ __html: styleContent }} />;
}

function MainContent() {
  const { user, loading, memberData, isAdmin, churchData } = useAuth();
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('liloupro_splash_shown');
  });
  const userChurchId = memberData?.churchId || 'semente';
  const userEmailLower = user?.email?.toLowerCase() || '';
  const isMasterAdmin = userEmailLower === 'miqueiasmellopro@gmail.com' || userEmailLower === 'mikmellorg@gmail.com' || memberData?.isMasterAdmin === true;

  const [landingMode, setLandingMode] = useState<'landing' | 'login' | 'signup'>('landing');
  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    const view = urlParams.get('view');
    const landing = urlParams.get('landing');
    const sales = urlParams.get('sales');
    const pathname = window.location.pathname;

    return (
      page === 'landing' ||
      page === 'sales' ||
      view === 'landing' ||
      view === 'sales' ||
      landing === 'true' ||
      sales === 'true' ||
      pathname === '/landing' ||
      pathname === '/sales' ||
      window.location.hash === '#landing' ||
      window.location.hash === '#sales'
    );
  });
  const [activeTab, setActiveTab] = useState<'home' | 'songs' | 'calendar' | 'members' | 'liturgy' | 'availability' | 'settings' | 'admin' | 'projection' | 'chat' | 'theory' | 'bible' | 'offline' | 'master'>('home');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineSyncTime, setOfflineSyncTime] = useState<string | null>(() => localStorage.getItem('liloupro_offline_sync_time'));
  const [isSyncing, setIsSyncing] = useState(false);
  const [upgradeModalResult, setUpgradeModalResult] = useState<ResourceCheckResult | null>(null);

  const effectivePlan = useMemo(() => {
    return getChurchEffectivePlan(churchData);
  }, [churchData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [showLiturgySongs, setShowLiturgySongs] = useState(false);
  const [shouldOpenAddModal, setShouldOpenAddModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isOpenHelpCenter, setIsOpenHelpCenter] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isBottomBarCollapsed, setIsBottomBarCollapsed] = useState(false);
  const [isSongFocusMode, setIsSongFocusMode] = useState(false);
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);

  // Worship service video playlist states
  const [activePlaylistSongs, setActivePlaylistSongs] = useState<any[] | null>(null);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState<number>(0);
  const [isPlaylistPlayerOpen, setIsPlaylistPlayerOpen] = useState<boolean>(false);
  const [isPlaylistPlayerMinimized, setIsPlaylistPlayerMinimized] = useState<boolean>(false);
  const [showInstallPromptModal, setShowInstallPromptModal] = useState<boolean>(false);

  // Auto-check if logged-in user hasn't installed PWA and hasn't dismissed the prompt
  useEffect(() => {
    if (!user || loading) return;
    try {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      const isPromptDismissed = localStorage.getItem('liloupro_hide_install_prompt') === 'true';
      const promptShownInSession = sessionStorage.getItem('liloupro_install_prompt_shown') === 'true';

      if (!isStandalone && !isPromptDismissed && !promptShownInSession) {
        // Show after a pleasant short delay on first login
        const timer = setTimeout(() => {
          setShowInstallPromptModal(true);
          sessionStorage.setItem('liloupro_install_prompt_shown', 'true');
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn("Could not check standalone or install prompt status:", e);
    }
  }, [user, loading]);

  const alertedNotificationsRef = useRef<Set<string>>(new Set());
  const isFirstLoadNotificationsRef = useRef(true);

  // Floating WhatsApp Heads-Up Notification Banner State
  const [whatsAppBanner, setWhatsAppBanner] = useState<{
    id: string;
    title: string;
    content: string;
    type?: string;
  } | null>(null);
  const whatsAppBannerTimeoutRef = useRef<any>(null);

  // WhatsApp-style Audio Synthesizer Chime
  const playWhatsAppNotificationChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      // Tone 1 (E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      // Tone 2 (G5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.08);
      gain2.gain.setValueAtTime(0, now + 0.08);
      gain2.gain.linearRampToValueAtTime(0.4, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.45);
    } catch (err) {
      console.warn("Chime error:", err);
    }
  }, []);

  // WhatsApp Pattern Haptic Vibration
  const triggerNotificationVibration = useCallback(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 200, 100, 400]);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Dispatch both WhatsApp In-App Heads-Up Banner and Native System Push Notification
  const triggerWhatsAppNotificationAlert = useCallback((n: { id?: string; title?: string; content?: string; type?: string }) => {
    playWhatsAppNotificationChime();
    triggerNotificationVibration();

    setWhatsAppBanner({
      id: n.id || 'notif-' + Date.now(),
      title: n.title || 'LiLouPro • Notificação',
      content: n.content || 'Você tem uma nova atualização no ministério.',
      type: n.type
    });

    if (whatsAppBannerTimeoutRef.current) {
      clearTimeout(whatsAppBannerTimeoutRef.current);
    }
    whatsAppBannerTimeoutRef.current = setTimeout(() => {
      setWhatsAppBanner(null);
    }, 7000);

    // Trigger Native PWA System Notification (lockscreen / status tray outside the app)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notifTitle = n.title || 'LiLouPro • Notificação';
      const notifOptions: any = {
        body: n.content || 'Você tem uma nova atualização no ministério.',
        icon: luxuryAppIcon,
        badge: luxuryAppIcon,
        tag: n.id || 'liloupro-msg-' + Date.now(),
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200, 100, 400],
        actions: [
          { action: 'open', title: '💬 Abrir Mensagem' },
          { action: 'dismiss', title: 'Fechar' }
        ],
        data: { id: n.id, type: n.type }
      };

      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(notifTitle, notifOptions);
        }).catch(() => {
          try {
            new Notification(notifTitle, notifOptions);
          } catch (e) {}
        });
      } else {
        try {
          new Notification(notifTitle, notifOptions);
        } catch (e) {}
      }
    }
  }, [playWhatsAppNotificationChime, triggerNotificationVibration]);

  // Listen for Service Worker click messages
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'NOTIFICATION_OPEN_REQUEST') {
          setShowNotifications(true);
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }
  }, []);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Auto-close notifications panel when active tab changes
  useEffect(() => {
    setShowNotifications(false);
  }, [activeTab]);

  // Capture invite code from URL parameters and store in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteCodeParam = urlParams.get('invite') || urlParams.get('code') || urlParams.get('join');
      if (inviteCodeParam) {
        const uppercaseCode = inviteCodeParam.trim().toUpperCase();
        localStorage.setItem('pending_invite_code', uppercaseCode);
        
        // Remove parameter from URL smoothly
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.delete('invite');
        searchParams.delete('code');
        searchParams.delete('join');
        let newSearch = searchParams.toString();
        const nextUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
        window.history.replaceState({}, document.title, nextUrl);
      }
    }
  }, []);

  const handleSyncOfflineData = useCallback(() => {
    setIsSyncing(true);
    try {
      // Save all songs, members, and services to localStorage
      localStorage.setItem('liloupro_offline_songs', JSON.stringify(allSongs));
      localStorage.setItem('liloupro_offline_services', JSON.stringify(allServices));
      localStorage.setItem('liloupro_offline_members', JSON.stringify(allMembers));
      
      const nowStr = new Date().toLocaleString('pt-BR');
      localStorage.setItem('liloupro_offline_sync_time', nowStr);
      setOfflineSyncTime(nowStr);
      
      alert('Sincronização offline concluída com sucesso! 💾\nSuas cifras, escalas e dados de membros agora estão disponíveis offline.');
    } catch (err) {
      console.error('Erro ao sincronizar dados offline:', err);
      alert('Erro ao sincronizar dados locais: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSyncing(false);
    }
  }, [allSongs, allServices, allMembers]);

  // Auto-join congregation when user & memberData are loaded successfully
  useEffect(() => {
    const autoJoinChurch = async () => {
      const pendingCode = localStorage.getItem('pending_invite_code');
      if (pendingCode && user && memberData && !loading) {
        try {
          const q = query(collection(db, 'churches'), where('inviteCode', '==', pendingCode));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            const churchDoc = querySnap.docs[0];
            const churchId = churchDoc.id;
            const churchName = churchDoc.data().name;

            if (memberData.churchId !== churchId) {
              const memberRef = doc(db, 'members', user.uid);
              await updateDoc(memberRef, {
                churchId: churchId,
                isAdmin: false // Joined musicians are standard members initially
              });
              alert(`Você entrou com sucesso na congregação: ${churchName}! ✨`);
            }
          } else {
            console.warn("Código de convite inválido:", pendingCode);
          }
        } catch (err) {
          console.error("Erro ao ingressar com código automático:", err);
        } finally {
          localStorage.removeItem('pending_invite_code');
        }
      }
    };

    if (user && memberData && !loading) {
      autoJoinChurch();
    }
  }, [user, memberData, loading]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'songs'), (snap) => {
      const songs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const filteredSongs = songs.filter(s => s.churchId === userChurchId || (!s.churchId && userChurchId === 'semente'));
      setAllSongs(filteredSongs);
      
      // Keep selectedSong in sync with real-time updates
      setSelectedSong(prev => {
        if (!prev) return null;
        const updated = filteredSongs.find(s => s.id === prev.id);
        return updated || prev;
      });
    });
    return unsub;
  }, [user, userChurchId]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter((n: any) => !n.deleted)
        .sort((a: any, b: any) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return timeB - timeA;
        });
      setNotifications(items);
      const nextUnreadCount = items.filter((n: any) => !n.read).length;
      setUnreadCount(nextUnreadCount);

      // Trigger WhatsApp style system & heads-up banner notification for newly arrived notifications
      if (!isFirstLoadNotificationsRef.current) {
        items.forEach((n: any) => {
          if (!n.read && !alertedNotificationsRef.current.has(n.id)) {
            alertedNotificationsRef.current.add(n.id);
            triggerWhatsAppNotificationAlert(n);
          }
        });
      } else {
        // Collect current unread IDs to prevent alerting historical items on initial load
        items.forEach((n: any) => {
          if (!n.read) {
            alertedNotificationsRef.current.add(n.id);
          }
        });
        isFirstLoadNotificationsRef.current = false;
      }
    }, (error) => {
      console.error("Notifications snapshot error:", error);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    // 1. Native platform Badging API call (runs in active window context)
    if ('setAppBadge' in navigator) {
      if (unreadCount > 0) {
        (navigator as any).setAppBadge(unreadCount).catch((err: any) => {
          console.error("Erro ao definir badge do app:", err);
        });
      } else {
        (navigator as any).clearAppBadge().catch((err: any) => {
          console.error("Erro ao limpar badge do app:", err);
        });
      }
    }

    // 2. Persist the current badge count in Cache Storage so the Service Worker can access it
    // when the app is closed, asleep, or running in the background.
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.open('app-badge-store')
        .then((cache) => {
          return cache.put('/unread-badge-count', new Response(String(unreadCount)));
        })
        .catch((err) => {
          console.error("Erro ao sincronizar badge no Cache Storage:", err);
        });
    }

    // 3. Update the Service Worker instance in real-time via Message API
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_UNREAD_COUNT',
        count: unreadCount
      });
    }
  }, [unreadCount]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'members'), (snap) => {
      const members = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const filtered = members.filter(m => m.churchId === userChurchId || (!m.churchId && userChurchId === 'semente'));
      setAllMembers(filtered);
    }, (error) => {
      console.error("Members snapshot error:", error);
    });
    return unsub;
  }, [user, userChurchId]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'services'), (snap) => {
      const services = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const filtered = services.filter(s => s.churchId === userChurchId || (!s.churchId && userChurchId === 'semente'));
      setAllServices(filtered);
    }, (error) => {
      console.error("Services snapshot error in MainContent:", error);
    });
    return unsub;
  }, [user, userChurchId]);

  // Busca o culto alvo com uma liturgia ou setlist (prioriza o mais próximo de agora, futuro ou passado recente)
  const activeLiturgyService = useMemo(() => {
    if (allServices.length === 0) return null;
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const servicesWithDates = allServices
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
    // mas apenas se tiver ocorrido há menos de 24 horas
    const lastService = servicesWithDates[servicesWithDates.length - 1];
    if (lastService) {
      const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      if (lastService._actualDate >= twentyFourHoursAgo) {
        return lastService;
      }
    }

    return null;
  }, [allServices]);

  const activeLiturgySongs = useMemo(() => {
    return getServiceSongs(activeLiturgyService, allSongs);
  }, [activeLiturgyService, allSongs]);

  useEffect(() => {
    if (!user || allServices.length === 0 || allMembers.length === 0) return;

    const checkUpcomingReminders = async () => {
      const now = new Date();
      const nowTime = now.getTime();
      const twentyFourHoursFromNow = nowTime + 24 * 60 * 60 * 1000;

      // Filter for future services starting in the next 24 hours
      const upcomingServices = allServices.filter(service => {
        if (!service.date) return false;
        const serviceTime = new Date(service.date).getTime();
        // Starts in the next 24 hours and is in the future
        return serviceTime > nowTime && serviceTime <= twentyFourHoursFromNow;
      });

      for (const service of upcomingServices) {
        const scales = service.scales || {};
        const isUserScheduled = Object.values(scales).flat().includes(user.uid);

        if (isUserScheduled) {
          const myMemberProfile = allMembers.find(m => m.id === user.uid || m.uid === user.uid);
          // Default to true if not specified
          if (myMemberProfile?.notifyDayBeforeReminder === false) {
            continue;
          }

          const notificationId = `reminder-${service.id}-${user.uid}`;
          const notifRef = doc(db, 'notifications', notificationId);

          try {
            const notifSnap = await getDoc(notifRef);
            if (!notifSnap.exists()) {
              // Find the roles the user is scheduled for
              const myRoles = Object.entries(scales)
                .filter(([role, ids]) => Array.isArray(ids) ? ids.includes(user.uid) : ids === user.uid)
                .map(([role]) => role)
                .join(', ');

              await setDoc(notifRef, {
                userId: user.uid,
                title: '⏰ Lembrete de Escala (24h)',
                content: `Você está escalado para o culto "${service.title}" em menos de 24 horas (${new Date(service.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}h). Função: ${myRoles}.`,
                type: 'service',
                read: false,
                createdAt: serverTimestamp()
              });
            }
          } catch (e) {
            console.error("Error setting scale reminder notification:", e);
          }
        }
      }
    };

    checkUpcomingReminders();
  }, [user, allServices, allMembers]);

  const handleMarkNotifAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    try {
      if (id.startsWith('reminder-')) {
        await updateDoc(doc(db, 'notifications', id), { deleted: true });
      } else {
        await deleteDoc(doc(db, 'notifications', id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearReadNotifications = async () => {
    try {
      const readNotifications = notifications.filter(n => n.read);
      const operations = readNotifications.map(n => {
        if (n.id.startsWith('reminder-')) {
          return updateDoc(doc(db, 'notifications', n.id), { deleted: true });
        } else {
          return deleteDoc(doc(db, 'notifications', n.id));
        }
      });
      await Promise.all(operations);
    } catch (e) {
      console.error("Error clearing notifications:", e);
    }
  };

  const createNotifications = async (
    title: string, 
    content: string, 
    type: 'announcement' | 'mural' | 'service' | 'general', 
    excludeUserId?: string,
    preferenceKey?: 'notifyNewSongs' | 'notifyScheduleChanges' | 'notifyDayBeforeReminder' | 'notifyNewLiturgy'
  ) => {
    try {
      if (!allMembers || allMembers.length === 0) {
        console.warn("No members available to notify");
        return;
      }
      const targets = allMembers.filter(m => {
        const userId = m.uid || m.id;
        if (!userId) return false;
        if (userId === excludeUserId) return false;
        
        // Respect customizable user preferences
        if (preferenceKey) {
          if (m[preferenceKey] === false) {
            return false;
          }
        }
        return true;
      });
      if (targets.length === 0) return;

      const creations = targets.map(m => {
        const userId = m.uid || m.id;
        if (!userId) return Promise.resolve();
        return addDoc(collection(db, 'notifications'), {
          userId,
          title,
          content,
          type,
          read: false,
          createdAt: serverTimestamp()
        });
      });
      await Promise.all(creations);

      // Disparar Web Push (FCM) em background para todos os aparelhos dos membros selecionados
      const pushTokens: string[] = [];
      targets.forEach(m => {
        if (Array.isArray(m.fcmTokens) && m.fcmTokens.length > 0) {
          m.fcmTokens.forEach((tok: any) => {
            if (typeof tok === 'string' && tok.trim().length > 10 && !pushTokens.includes(tok.trim())) {
              pushTokens.push(tok.trim());
            }
          });
        }
        if (typeof m.fcmToken === 'string' && m.fcmToken.trim().length > 10 && !pushTokens.includes(m.fcmToken.trim())) {
          pushTokens.push(m.fcmToken.trim());
        }
        if (typeof m.lastFcmToken === 'string' && m.lastFcmToken.trim().length > 10 && !pushTokens.includes(m.lastFcmToken.trim())) {
          pushTokens.push(m.lastFcmToken.trim());
        }
      });

      // Também buscar tokens atualizados diretamente no Firestore para garantir entrega máxima
      try {
        const membersSnap = await getDocs(collection(db, 'members'));
        const targetUserIds = new Set(targets.map(t => t.uid || t.id));
        membersSnap.forEach(docSnap => {
          if (targetUserIds.has(docSnap.id)) {
            const data = docSnap.data();
            if (Array.isArray(data.fcmTokens)) {
              data.fcmTokens.forEach((tok: any) => {
                if (typeof tok === 'string' && tok.trim().length > 10 && !pushTokens.includes(tok.trim())) {
                  pushTokens.push(tok.trim());
                }
              });
            }
            if (typeof data.fcmToken === 'string' && data.fcmToken.trim().length > 10 && !pushTokens.includes(data.fcmToken.trim())) {
              pushTokens.push(data.fcmToken.trim());
            }
            if (typeof data.lastFcmToken === 'string' && data.lastFcmToken.trim().length > 10 && !pushTokens.includes(data.lastFcmToken.trim())) {
              pushTokens.push(data.lastFcmToken.trim());
            }
          }
        });
      } catch (fcmFetchErr) {
        console.warn('[FCM] Error fetching fresh tokens from Firestore:', fcmFetchErr);
      }

      if (pushTokens.length > 0) {
        const targetUrl = type === 'service' || preferenceKey === 'notifyNewLiturgy' ? '/?tab=liturgy' : '/';
        // Envio assíncrono não bloqueante
        sendPushNotification({
          tokens: pushTokens,
          title,
          body: content,
          url: targetUrl,
          data: { type, timestamp: Date.now() }
        }).catch(err => {
          console.warn('[FCM] Push send background notification caught:', err);
        });
      }
    } catch (e) {
      console.error("Error creating notifications:", e);
    }
  };

  const handleOpenSongById = (songId: string) => {
    const song = allSongs.find(s => s.id === songId);
    if (song) {
      setSelectedSong(song);
      setActiveTab('songs');
      setShowLiturgySongs(true);
    }
  };

  const handleStartWorshipPlaylist = (songsList: any[]) => {
    setActivePlaylistSongs(songsList);
    setCurrentPlaylistIndex(0);
    setIsPlaylistPlayerOpen(true);
    setIsPlaylistPlayerMinimized(false);
  };

  const getPlaylistEmbedUrl = (songs: any[], index: number) => {
    if (!songs || songs.length === 0) return '';
    const currentSong = songs[index];
    if (!currentSong) return '';
    const currentId = parseYoutubeVideoId(currentSong.youtube);
    if (!currentId) return '';
    
    // Get all valid YouTube video IDs
    const allIds = songs.map(s => parseYoutubeVideoId(s.youtube)).filter(Boolean);
    
    // Create the playlist parameter by joining all IDs.
    // YouTube player will play the main video first, and the playlist parameter will populate the playlist queue!
    return `https://www.youtube.com/embed/${currentId}?playlist=${allIds.join(',')}&autoplay=1&enablejsapi=1`;
  };

  const renderWorshipPlaylistPlayer = () => {
    if (!isPlaylistPlayerOpen || !activePlaylistSongs || activePlaylistSongs.length === 0) return null;

    const currentSong = activePlaylistSongs[currentPlaylistIndex];
    if (!currentSong) return null;

    const currentId = parseYoutubeVideoId(currentSong.youtube);

    return (
      <AnimatePresence>
        {isPlaylistPlayerMinimized ? (
          <motion.div
            key="playlist-minimized"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[210] bg-zinc-950 text-white rounded-full py-2 px-4 shadow-2xl flex items-center gap-3 border border-red-500/40 hover:border-red-500 transition-all cursor-pointer"
            onClick={() => setIsPlaylistPlayerMinimized(false)}
          >
            <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg animate-pulse">
              <Play size={12} className="fill-white ml-0.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase text-red-500 tracking-wider leading-none">Ouvindo Culto</p>
              <p className="text-xs font-bold truncate max-w-[150px] sm:max-w-[200px] mt-0.5 text-zinc-100">{currentSong.title}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setIsPlaylistPlayerMinimized(false)}
                className="p-1 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                title="Expandir"
              >
                <Maximize2 size={12} />
              </button>
              <button 
                onClick={() => { setIsPlaylistPlayerOpen(false); setActivePlaylistSongs(null); }}
                className="p-1 hover:bg-white/10 rounded-full text-zinc-400 hover:text-red-500 transition-colors"
                title="Fechar"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="playlist-expanded"
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[210] bg-zinc-950 text-white border border-white/10 shadow-2xl rounded-2xl w-[calc(100%-2rem)] sm:w-96 overflow-hidden flex flex-col max-h-[480px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-zinc-900/80">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Youtube size={16} className="fill-white" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[9px] font-black uppercase text-red-500 tracking-wider leading-none">Playlist do Culto</h4>
                  <p className="text-[11px] font-bold text-zinc-300 truncate mt-0.5">LiLouPro Player</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => setIsPlaylistPlayerMinimized(true)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  title="Minimizar"
                >
                  <Minimize2 size={14} />
                </button>
                <button 
                  onClick={() => { setIsPlaylistPlayerOpen(false); setActivePlaylistSongs(null); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                  title="Fechar"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Video Player Embed */}
            <div className="w-full aspect-video bg-black relative border-b border-white/5">
              {currentId ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={getPlaylistEmbedUrl(activePlaylistSongs, currentPlaylistIndex)}
                  title="Worship Setlist YouTube Player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 p-4 text-center">
                  <p className="text-xs text-zinc-400 italic">Vídeo indisponível para este louvor.</p>
                </div>
              )}
            </div>

            {/* Track Navigation controls */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-zinc-900/40">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-xs font-black truncate text-zinc-100">{currentSong.title}</p>
                <p className="text-[10px] text-zinc-400 truncate italic">{currentSong.artist || 'Artista Desconhecido'}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  disabled={currentPlaylistIndex === 0}
                  onClick={() => setCurrentPlaylistIndex(prev => Math.max(0, prev - 1))}
                  className="p-1 hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg text-zinc-300 transition-colors"
                  title="Anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[10px] font-black font-mono text-zinc-500 bg-black/30 px-1.5 py-0.5 rounded">
                  {currentPlaylistIndex + 1}/{activePlaylistSongs.length}
                </span>
                <button
                  disabled={currentPlaylistIndex === activePlaylistSongs.length - 1}
                  onClick={() => setCurrentPlaylistIndex(prev => Math.min(activePlaylistSongs.length - 1, prev + 1))}
                  className="p-1 hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg text-zinc-300 transition-colors"
                  title="Próxima"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Tracklist Queue */}
            <div className="flex-1 overflow-y-auto max-h-[160px] p-2 space-y-1 custom-scrollbar bg-zinc-950/80">
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 px-2 py-1">Ordem das Músicas</p>
              {activePlaylistSongs.map((song, idx) => {
                const isActive = idx === currentPlaylistIndex;
                return (
                  <div
                    key={song.id}
                    onClick={() => setCurrentPlaylistIndex(idx)}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl transition-all text-left cursor-pointer border",
                      isActive
                        ? "bg-red-500/10 border-red-500/20 text-red-400 font-bold animate-pulse"
                        : "border-transparent hover:bg-white/5 text-zinc-300 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        "text-[10px] font-bold shrink-0 w-5 text-center font-mono",
                        isActive ? "text-red-500" : "text-zinc-500"
                      )}>
                        {idx + 1}ª
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs truncate leading-tight">{song.title}</p>
                        <p className="text-[9px] text-zinc-500 truncate italic mt-0.5">{song.artist}</p>
                      </div>
                    </div>
                    {isActive && (
                      <div className="flex items-center gap-1 text-red-500 pr-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                        <Youtube size={12} className="fill-red-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };
  
  if (showSplash) {
    return (
      <SplashIntro 
        onComplete={() => {
          setShowSplash(false);
          try {
            sessionStorage.setItem('liloupro_splash_shown', 'true');
          } catch (e) {
            console.warn("Could not set sessionStorage item:", e);
          }
        }} 
      />
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-primary"
        >
          <Music2 size={48} />
        </motion.div>
      </div>
    );
  }

  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const passwordToken = urlParams?.get('token');

  if (passwordToken && !user) {
    return (
      <SetPasswordView
        token={passwordToken}
        onPasswordSetSuccess={() => {
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          setLandingMode('login');
        }}
        onGoToLogin={() => {
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          setLandingMode('login');
        }}
      />
    );
  }

  if (!user || showLandingPage) {
    if (landingMode === 'login' && !user) {
      return <AuthView defaultMode="login" onBackToLanding={() => { setLandingMode('landing'); }} />;
    }
    if (landingMode === 'signup' && !user) {
      return <AuthView defaultMode="signup" onBackToLanding={() => { setLandingMode('landing'); }} />;
    }
    return (
      <div className="relative">
        {user && (
          <div className="sticky top-0 left-0 right-0 z-[100] bg-slate-900 border-b border-brand/30 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-xl">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Você está visualizando a <strong>Página de Vendas Pública (Sales Page)</strong>.
            </span>
            <button 
              onClick={() => setShowLandingPage(false)}
              className="bg-brand text-slate-950 px-3.5 py-1.5 rounded-xl hover:bg-brand-light text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Ir para o Painel da Igreja
            </button>
          </div>
        )}
        <CommercialLandingPage onEnterApp={(mode) => {
          if (user) {
            setShowLandingPage(false);
          } else {
            setLandingMode(mode);
          }
        }} />
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-surface transition-all duration-300",
      isSongFocusMode ? "p-0" : (isBottomBarCollapsed ? "pb-6 md:pb-0" : "pb-24 md:pb-0"),
      isSongFocusMode ? "md:pl-0" : (isSidebarCollapsed ? "md:pl-20" : "md:pl-64")
    )}>
      <DynamicThemeStyle churchData={churchData} />

      {/* Trial / Subscription Status Banner */}
      {!isSongFocusMode && (
        <TrialBanner 
          effectivePlan={effectivePlan} 
          onOpenUpgradeModal={() => {
            setUpgradeModalResult({
              allowed: false,
              limit: 0,
              currentCount: 0,
              resourceNameLabel: effectivePlan.plan.name,
              effectivePlan
            });
          }} 
        />
      )}
      
      {/* Offline Alert Banner */}
      {!isOnline && !isSongFocusMode && (
        <div className="bg-amber-500 text-slate-900 text-[11px] font-black uppercase tracking-widest text-center py-2.5 px-4 flex items-center justify-center gap-2 select-none z-[80] relative shadow-md">
          <WifiOff size={14} strokeWidth={2.5} />
          <span>Você está navegando em Modo Offline. Acesse as cifras e escalas salvas localmente!</span>
          <button 
            onClick={() => { setActiveTab('offline'); setShowMoreMenu(false); }}
            className="ml-3 bg-slate-900 text-white hover:bg-slate-800 text-[9px] px-3 py-1 rounded-full font-black tracking-widest transition-all active:scale-95 cursor-pointer uppercase shadow-sm"
          >
            Abrir Central
          </button>
        </div>
      )}
      {/* Retractable Bottom Menu Toggle Button (Mobile only) */}
      {!isSongFocusMode && (
        <button 
          onClick={() => setIsBottomBarCollapsed(!isBottomBarCollapsed)}
          className={cn(
            "md:hidden fixed z-[100] left-1/2 -translate-x-1/2 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-out select-none active:scale-90 border",
            isBottomBarCollapsed 
              ? "bottom-4 w-9 h-9 bg-brand text-white border-brand/40 shadow-brand/20" 
              : "bottom-[54px] w-8 h-8 bg-surface/80 backdrop-blur-md text-text-muted border-border/60 hover:text-text-main"
          )}
          aria-label={isBottomBarCollapsed ? "Exibir Menu" : "Ocultar Menu"}
        >
          {isBottomBarCollapsed ? (
            <ChevronUp size={16} className="stroke-[3]" />
          ) : (
            <ChevronDown size={14} className="stroke-[2.5]" />
          )}
        </button>
      )}

      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      
      {/* Notifications Panel & WhatsApp Floating Banner (Global Viewport) */}
      <AnimatePresence>
        {whatsAppBanner && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            onClick={() => {
              setShowNotifications(true);
              setWhatsAppBanner(null);
            }}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-[10000] w-[calc(100vw-1.5rem)] max-w-md bg-slate-950/95 dark:bg-slate-900/95 text-slate-100 border border-emerald-500/40 shadow-2xl shadow-emerald-950/60 rounded-2xl p-3.5 backdrop-blur-xl flex items-start gap-3 cursor-pointer hover:border-emerald-400 transition-all group antialiased select-none"
          >
            <div className="relative shrink-0">
              <img
                src={luxuryAppIcon}
                alt="LiLouPro"
                className="w-11 h-11 rounded-2xl object-cover border border-emerald-500/40 shadow-md group-hover:scale-105 transition-transform"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-950 rounded-full flex items-center justify-center">
                <MessageSquare size={9} className="text-slate-950 font-black fill-slate-950 shrink-0" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-black tracking-tight text-emerald-400 truncate">
                    {whatsAppBanner.title || 'LiLouPro • Notificação'}
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.2 rounded-full border border-emerald-500/30 shrink-0">
                    agora
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWhatsAppBanner(null);
                  }}
                  className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                  title="Fechar"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-snug">
                {whatsAppBanner.content}
              </p>

              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-emerald-400/90 group-hover:text-emerald-300 transition-colors">
                <span>Toque para ver detalhes no aplicativo</span>
                <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Panel (Global Viewport) */}
      <AnimatePresence>
        {showNotifications && (
          <NotificationCenter 
            notifications={notifications} 
            onMarkRead={handleMarkNotifAsRead}
            onDelete={handleDeleteNotif}
            onClearRead={handleClearReadNotifications}
            onClose={() => setShowNotifications(false)}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        )}
      </AnimatePresence>

      <nav 
        className={cn(
          "fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 bg-surface text-text-main border-t border-border md:border-t-0 md:border-r z-50 flex md:flex-col items-stretch justify-around md:justify-start py-1 md:py-0 transition-all duration-300 shadow-xl notranslate",
          isSidebarCollapsed ? "md:w-20" : "md:w-64",
          isBottomBarCollapsed ? "translate-y-full md:translate-y-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto" : "translate-y-0 opacity-100 pointer-events-auto",
          isSongFocusMode && "hidden pointer-events-none opacity-0 translate-y-full md:translate-x-[-100%]"
        )}
        translate="no"
      >
        <div className="hidden md:flex flex-col p-6 border-b border-border mb-6 relative">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-brand rounded-full flex items-center justify-center border-2 border-surface hover:scale-110 transition-transform z-10 text-white"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div className={cn("flex items-center gap-2 mb-1 overflow-hidden transition-all", isSidebarCollapsed ? "justify-center" : "justify-start")}>
             {churchData?.logoUrl ? (
                <img 
                  referrerPolicy="no-referrer"
                  src={churchData.logoUrl} 
                  className={cn(
                    "w-10 h-10 shrink-0 border border-border/40",
                    churchData.logoFit === 'cover' ? "object-cover" : "object-contain",
                    churchData.logoRadius === 'rounded-none' ? "rounded-none" :
                    churchData.logoRadius === 'rounded-lg' ? "rounded-lg" :
                    churchData.logoRadius === 'rounded-2xl' ? "rounded-2xl" :
                    churchData.logoRadius === 'rounded-full' ? "rounded-full" : "rounded-xl",
                    churchData.logoPadding || (churchData.logoFit === 'cover' ? "p-0" : "p-1"),
                    churchData.logoBg === 'white' ? "bg-white" :
                    churchData.logoBg === 'black' ? "bg-zinc-950" :
                    churchData.logoBg === 'theme' ? "bg-brand/10" :
                    churchData.logoBg === 'transparent' ? "bg-transparent" : "bg-white/5"
                  )}
                  style={{
                    backgroundColor: (churchData.logoBg === 'custom' && churchData.logoBgCustomColor) ? churchData.logoBgCustomColor : undefined
                  }}
                  alt="Logo" 
                />
             ) : (
                <div className="p-2 bg-brand rounded-lg shadow-lg shrink-0">
                   <Music2 size={24} className="text-white" />
                </div>
             )}
             {!isSidebarCollapsed && (
               <motion.div 
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="flex flex-col min-w-0"
               >
                 <h1 className="text-sm font-black tracking-tight whitespace-nowrap truncate text-text-main max-w-[130px]">
                   {churchData?.name || "LiLouPro"}
                 </h1>
                 {churchData?.name && (
                   <span className="text-[9px] font-bold text-brand uppercase tracking-wider block">
                     Portal de Louvor
                   </span>
                 )}
               </motion.div>
             )}
          </div>
          {isMasterAdmin && !isSidebarCollapsed && (
            <button 
              onClick={() => setActiveTab('master')}
              className="mt-2 w-full py-1.5 px-2 bg-gradient-to-r from-amber-500/20 to-brand/20 hover:from-amber-500/30 hover:to-brand/30 border border-amber-500/30 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black uppercase text-amber-300 transition-all shadow-sm"
            >
              <Crown size={12} className="text-amber-400 animate-pulse" /> Painel Master
            </button>
          )}
        </div>

        <div className="flex md:flex-col flex-1 px-2 md:px-4 gap-1 md:gap-2 items-center md:items-stretch justify-center md:justify-start overflow-y-auto custom-scrollbar">
          <NavIcon 
            icon={<Home size={22} />} 
            active={activeTab === 'home'} 
            onClick={() => { setActiveTab('home'); setShowMoreMenu(false); }} 
            label="Início" 
            isCollapsed={isSidebarCollapsed} 
            title="Início"
          />

          <NavIcon 
            icon={<Calendar size={22} />} 
            active={activeTab === 'calendar'} 
            onClick={() => { setActiveTab('calendar'); setShowMoreMenu(false); }} 
            label={
              <span className="flex flex-col md:flex-row items-center md:gap-1 text-center md:text-left leading-[1.05] md:leading-normal">
                <span className="md:hidden text-[9px] font-black tracking-tighter">Agenda/</span>
                <span className="md:hidden text-[9px] font-black tracking-tighter">Escala</span>
                <span className="hidden md:inline">Agenda / Escala</span>
              </span>
            } 
            title="Agenda e Escala de Cultos"
            isCollapsed={isSidebarCollapsed} 
          />
          
          {/* Members - Visible on Mobile and Desktop */}
          <NavIcon 
            icon={<Users size={22} />} 
            active={activeTab === 'members'} 
            onClick={() => { setActiveTab('members'); setShowMoreMenu(false); }} 
            label="Membros" 
            isCollapsed={isSidebarCollapsed} 
          />

          {/* Chat - Visible on Mobile and Desktop */}
          <NavIcon 
            icon={<MessageSquare size={22} />} 
            active={activeTab === 'chat'} 
            onClick={() => { setActiveTab('chat'); setShowMoreMenu(false); }} 
            label="Chat" 
            isCollapsed={isSidebarCollapsed} 
          />

          {/* Notifications - Visible on Mobile and Desktop */}
          <NavIcon 
            icon={
              <div className="relative">
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-surface leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
            } 
            active={showNotifications} 
            onClick={() => { 
              setShowNotifications(!showNotifications); 
              setShowMoreMenu(false); 
            }} 
            label="Notificações" 
            title="Notificações"
            isCollapsed={isSidebarCollapsed} 
          />



          <div className="hidden md:block my-2 border-t border-border/50" />
          
          {/* More Menu Toggle */}
          <div className="flex flex-col">
            <NavIcon 
              icon={showMoreMenu ? <ChevronDown size={22} /> : <Menu size={22} />} 
              active={['liturgy', 'availability', 'settings', 'theory', 'bible', 'songs', 'master'].includes(activeTab)} 
              onClick={() => setShowMoreMenu(!showMoreMenu)} 
              label="Mais" 
              isCollapsed={isSidebarCollapsed} 
            />
            
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={window.innerWidth >= 768 ? { height: 0, opacity: 0 } : { y: 100, opacity: 0 }}
                  animate={window.innerWidth >= 768 ? { height: 'auto', opacity: 1 } : { y: 0, opacity: 1 }}
                  exit={window.innerWidth >= 768 ? { height: 0, opacity: 0 } : { y: 100, opacity: 0 }}
                  className={cn(
                    "overflow-hidden flex flex-col gap-1 mt-1 more-menu-container",
                    "fixed md:relative bottom-16 md:bottom-auto left-4 right-4 md:left-0 md:right-0 bg-slate-900 border border-slate-800 p-4 md:p-3 rounded-2xl md:rounded-xl shadow-2xl z-[60]"
                  )}
                >
                  <NavIcon icon={<Book size={20} />} active={activeTab === 'bible'} onClick={() => { setActiveTab('bible'); setShowMoreMenu(false); }} label="Bíblia Sagrada" isCollapsed={isSidebarCollapsed} subItem />
                  <NavIcon 
                    icon={<GraduationCap size={20} className="text-purple-400 dark:text-purple-300 animate-pulse drop-shadow-[0_0_10px_rgba(168,85,247,0.9)] shrink-0" />} 
                    active={activeTab === 'theory'} 
                    onClick={() => { setActiveTab('theory'); setShowMoreMenu(false); }} 
                    label="Teoria Musical" 
                    isCollapsed={isSidebarCollapsed} 
                    subItem 
                  />
                  <NavIcon icon={<CloudOff size={20} />} active={activeTab === 'offline'} onClick={() => { setActiveTab('offline'); setShowMoreMenu(false); }} label="Acesso Offline 💾" isCollapsed={isSidebarCollapsed} subItem />
                  
                  <div className="mx-4 my-2 border-t border-border opacity-50" />
                  
                  <NavIcon 
                    icon={<HelpCircle size={18} />} 
                    active={isOpenHelpCenter}
                    onClick={() => { setIsOpenHelpCenter(true); setShowMoreMenu(false); }} 
                    label="Tutoriais & Manual" 
                    isCollapsed={isSidebarCollapsed} 
                    subItem 
                  />
                  <NavIcon 
                    icon={<Globe size={18} className="text-brand" />} 
                    onClick={() => { setShowLandingPage(true); setShowMoreMenu(false); }} 
                    label="Página de Apresentação" 
                    isCollapsed={isSidebarCollapsed} 
                    subItem 
                  />
                  <NavIcon 
                    icon={<Settings size={18} />} 
                    active={activeTab === 'settings'}
                    onClick={() => { setActiveTab('settings'); setShowMoreMenu(false); }} 
                    label="Configurações" 
                    isCollapsed={isSidebarCollapsed} 
                    subItem 
                  />
                  {isMasterAdmin && (
                    <NavIcon 
                      icon={<Crown size={18} className="text-amber-400 animate-pulse shrink-0" />} 
                      active={activeTab === 'master'}
                      onClick={() => { setActiveTab('master'); setShowMoreMenu(false); }} 
                      label="Painel Master 👑" 
                      isCollapsed={isSidebarCollapsed} 
                      subItem 
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="hidden md:block my-2 border-t border-border mx-4" />

        <div className={cn("hidden md:flex md:mt-auto md:p-4 md:pb-8 md:flex-col items-center gap-4 transition-all", isSidebarCollapsed ? "md:p-4" : "md:bg-black/5 dark:md:bg-white/10")}>
           {memberData && !isSidebarCollapsed && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="hidden md:flex items-center gap-3 mb-2 w-full"
             >
               <div className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center text-xs font-bold text-slate-900 shrink-0 overflow-hidden">
                 <CachedAvatar 
                   photoUrl={memberData.photoUrl} 
                   alt={memberData.name} 
                   className="w-full h-full" 
                   fallbackText={memberData.name}
                 />
               </div>
               <div className="text-left overflow-hidden">
                 <p className="text-xs font-bold uppercase truncate text-text-main">{memberData.name}</p>
                 <p className="text-text-muted text-[10px] truncate">{memberData.roles?.[0] || 'Membro'}</p>
               </div>
             </motion.div>
           )}
           {memberData && isSidebarCollapsed && (
             <div className="hidden md:flex w-8 h-8 rounded-full bg-cyan-400 items-center justify-center text-xs font-bold text-slate-900 shrink-0 relative group overflow-hidden">
                <CachedAvatar 
                  photoUrl={memberData.photoUrl} 
                  alt={memberData.name} 
                  className="w-full h-full" 
                  fallbackText={memberData.name}
                />
                <div className="absolute left-full ml-4 px-2 py-1 bg-surface border border-border text-text-main text-[10px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                   {memberData.name}
                </div>
             </div>
           )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-10">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <DashboardView 
              key="home" 
              onNavigate={setActiveTab} 
              onOpenSong={handleOpenSongById}
              createNotifications={createNotifications}
              setShowLiturgySongs={setShowLiturgySongs}
              theme={theme}
              allSongs={allSongs}
              onStartPlaylist={handleStartWorshipPlaylist}
            />
          )}
          {activeTab === 'songs' && !selectedSong && (
            <SongsView 
              key="songs" 
              onSelectSong={setSelectedSong} 
              initialAdd={shouldOpenAddModal} 
              onAddModalClose={() => setShouldOpenAddModal(false)} 
              showLiturgySongs={showLiturgySongs}
              setShowLiturgySongs={setShowLiturgySongs}
              createNotifications={createNotifications}
              onStartPlaylist={handleStartWorshipPlaylist}
              theme={theme}
            />
          )}
          {activeTab === 'songs' && selectedSong && (
            <SongDetailView 
              key={selectedSong.id} 
              song={selectedSong} 
              onBack={() => { setSelectedSong(null); setIsSongFocusMode(false); }} 
              theme={theme}
              liturgySongs={activeLiturgySongs}
              allSongs={allSongs}
              onSelectSong={setSelectedSong}
              activeLiturgyService={activeLiturgyService}
              onFocusModeChange={setIsSongFocusMode}
              initialFocusMode={isSongFocusMode}
            />
          )}
          {activeTab === 'calendar' && (
            <CalendarView 
              key="calendar" 
              onOpenSong={handleOpenSongById} 
              createNotifications={createNotifications}
              theme={theme}
            />
          )}
          {activeTab === 'availability' && <AvailabilityView key="availability" createNotifications={createNotifications} theme={theme} />}
          {activeTab === 'liturgy' && (
            <LiturgyView 
              key="liturgy" 
              onOpenSong={handleOpenSongById} 
              createNotifications={createNotifications} 
              allSongs={allSongs}
              onStartPlaylist={handleStartWorshipPlaylist}
              theme={theme}
            />
          )}
          {activeTab === 'members' && <MembersView key="members" />}
          {activeTab === 'chat' && <ChatView key="chat" />}
          {activeTab === 'admin' && isAdmin && <AdminDashboardView key="admin" />}
          {activeTab === 'settings' && (
            <SettingsView 
              key="settings" 
              theme={theme} 
              onThemeChange={setTheme} 
              isAdmin={isAdmin}
              allMembers={allMembers}
              onReplaySplash={() => setShowSplash(true)}
              onTriggerNotification={triggerWhatsAppNotificationAlert}
            />
          )}
          {activeTab === 'projection' && (
            <ProjectionView 
              key="projection" 
              allSongs={allSongs} 
              allServices={allServices} 
            />
          )}
          {activeTab === 'theory' && (
            <TheoryStudyView key="theory" />
          )}
          {activeTab === 'bible' && (
            <BibleReaderView key="bible" theme={theme} services={allServices} />
          )}
          {activeTab === 'offline' && (
            <OfflineView 
              key="offline"
              isOnline={isOnline}
              offlineSyncTime={offlineSyncTime}
              isSyncing={isSyncing}
              onSync={handleSyncOfflineData}
              onlineSongs={allSongs}
              onlineServices={allServices}
              onlineMembers={allMembers}
            />
          )}
          {activeTab === 'master' && (
            <MasterAdminView key="master" theme={theme} />
          )}
        </AnimatePresence>
      </main>

      {/* Interactive Onboarding, Help & Training Center */}
      <HelpCenter 
        theme={theme}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        isOpen={isOpenHelpCenter}
        onClose={() => setIsOpenHelpCenter(false)}
      />

      {renderWorshipPlaylistPlayer()}

      <UpgradeModal 
        isOpen={!!upgradeModalResult} 
        onClose={() => setUpgradeModalResult(null)} 
        resourceCheck={upgradeModalResult} 
      />

      {/* Luxury PWA Install Modal & Floating Banner for Logged-in Users */}
      <LuxuryAppInstallModal
        isOpen={showInstallPromptModal}
        onClose={() => setShowInstallPromptModal(false)}
        userName={memberData?.name ? memberData.name.split(' ')[0] : (user?.displayName ? user.displayName.split(' ')[0] : 'Ministro')}
      />
      <CustomInstallBanner 
        onOpenGuideModal={() => setShowInstallPromptModal(true)}
      />
    </div>
  );
}

function NavIcon({ 
  icon, active, onClick, label, danger, isMobileOnlyIcon, isCollapsed, subItem, success, title
}: { 
  icon: React.ReactNode, active?: boolean, onClick: () => void, label: React.ReactNode, danger?: boolean, isMobileOnlyIcon?: boolean, isCollapsed?: boolean, subItem?: boolean, success?: boolean, title?: string
}) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={cn(
        "flex flex-col md:flex-row items-center gap-3 transition-all duration-300 px-3 md:px-4 py-2 md:py-3 rounded-lg text-sm font-medium whitespace-nowrap relative group notranslate",
        isCollapsed ? "md:justify-center md:px-0" : "md:justify-start",
        subItem && !isCollapsed && "md:ml-4 md:py-1.5",
        active 
          ? success 
            ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
            : "bg-brand text-white shadow-lg" 
          : success
            ? "text-green-600 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20"
            : danger 
              ? "text-red-500 hover:text-red-600 hover:bg-red-500/10" 
              : "text-white/80 hover:text-white hover:bg-white/10"
      )}
      translate="no"
    >
      <div className={cn("p-1 shrink-0", subItem && !isCollapsed && "scale-90")}>
        {icon}
      </div>
      <span className={cn(
        "transition-all duration-300 flex items-center gap-1.5", 
        isMobileOnlyIcon && "md:hidden",
        isCollapsed ? "md:hidden opacity-0" : "opacity-100",
        subItem 
          ? "text-xs sm:text-xs md:text-[11px] font-black uppercase tracking-[0.05em]" 
          : "text-[9px] md:text-sm font-medium"
      )}>
        {label}
      </span>
      
      {isCollapsed && (
        <div className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          {label}
        </div>
      )}
    </button>
  );
}

// --- Views ---

// DashboardView has been moved to src/components/DashboardView.tsx











































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































// QuickLink has been moved to src/components/DashboardView.tsx

















// TimeSignatureDisplay has been moved to src/components/SongsView.tsx











// SongsView has been moved to src/components/SongsView.tsx

































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































// LiturgyView has been moved to src/components/LiturgyView.tsx











































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































function CalendarView({ 
  onOpenSong,
  createNotifications,
  theme
}: { 
  onOpenSong?: (songId: string) => void,
  createNotifications: (title: string, content: string, type: 'announcement' | 'mural' | 'service' | 'general', excludeUserId?: string, preferenceKey?: 'notifyNewSongs' | 'notifyScheduleChanges' | 'notifyDayBeforeReminder' | 'notifyNewLiturgy') => Promise<void>,
  theme?: 'light' | 'dark'
}) {
  const { user, isAdmin, memberData } = useAuth();
  const userChurchId = memberData?.churchId || 'semente';
  const [services, setServices] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState({ title: '', date: '', scales: {}, setlist: [], playlistUrl: '', theme: 'normal' });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [localScales, setLocalScales] = useState<Record<string, string[]>>({});

  const roles = ['Vocal Principal', 'Backing Vocal', 'Violão', 'Guitarra', 'Bateria', 'Baixo', 'Teclado', 'Percussão', 'Operador de áudio', 'Mídia', 'Projeção'];

  // Quick Edit Floating Popover State
  const [quickEditData, setQuickEditData] = useState<{
    service: any;
    member: any;
    assignedRoles: string[];
  } | null>(null);
  const [quickToast, setQuickToast] = useState<string | null>(null);

  const showQuickToast = (msg: string) => {
    setQuickToast(msg);
    setTimeout(() => setQuickToast(null), 3000);
  };

  const handleToggleRoleQuickly = async (roleName: string) => {
    if (!quickEditData) return;
    const { service, member } = quickEditData;
    const currentScales = { ...(service.scales || {}) };
    let roleList = Array.isArray(currentScales[roleName])
      ? [...currentScales[roleName]]
      : (currentScales[roleName] ? [currentScales[roleName]] : []);

    const isAssigned = roleList.includes(member.id);
    if (isAssigned) {
      roleList = roleList.filter(id => id !== member.id);
    } else {
      roleList.push(member.id);
    }
    currentScales[roleName] = roleList;

    const newAssignedRoles = Object.entries(currentScales)
      .filter(([_, ids]) => (Array.isArray(ids) ? ids : [ids]).includes(member.id))
      .map(([r]) => r);

    setServices(prev => prev.map(s => s.id === service.id ? { ...s, scales: currentScales } : s));
    setQuickEditData(prev => prev ? {
      ...prev,
      service: { ...prev.service, scales: currentScales },
      assignedRoles: newAssignedRoles
    } : null);

    try {
      await updateDoc(doc(db, 'services', service.id), { scales: currentScales });
      showQuickToast(`Função "${roleName}" ${isAssigned ? 'removida de' : 'atribuída a'} ${member.name.split(' ')[0]}!`);
    } catch (err) {
      console.error("Erro ao salvar edição rápida:", err);
      showQuickToast("Erro ao atualizar função.");
    }
  };

  const handleSwapMemberQuickly = async (newMemberId: string) => {
    if (!quickEditData || !newMemberId) return;
    const { service, member } = quickEditData;
    const newMemberObj = members.find(m => m.id === newMemberId);
    if (!newMemberObj) return;

    const currentScales = { ...(service.scales || {}) };
    Object.keys(currentScales).forEach(role => {
      let list = Array.isArray(currentScales[role])
        ? [...currentScales[role]]
        : (currentScales[role] ? [currentScales[role]] : []);
      if (list.includes(member.id)) {
        list = list.filter(id => id !== member.id);
        if (!list.includes(newMemberId)) {
          list.push(newMemberId);
        }
        currentScales[role] = list;
      }
    });

    setServices(prev => prev.map(s => s.id === service.id ? { ...s, scales: currentScales } : s));
    setQuickEditData(null);

    try {
      await updateDoc(doc(db, 'services', service.id), { scales: currentScales });
      showQuickToast(`Substituído: ${member.name} ➡️ ${newMemberObj.name}!`);
    } catch (err) {
      console.error("Erro ao substituir membro:", err);
      showQuickToast("Erro ao substituir voluntário.");
    }
  };

  const handleRemoveMemberQuickly = async () => {
    if (!quickEditData) return;
    const { service, member } = quickEditData;
    const currentScales = { ...(service.scales || {}) };
    Object.keys(currentScales).forEach(role => {
      let list = Array.isArray(currentScales[role])
        ? [...currentScales[role]]
        : (currentScales[role] ? [currentScales[role]] : []);
      currentScales[role] = list.filter(id => id !== member.id);
    });

    setServices(prev => prev.map(s => s.id === service.id ? { ...s, scales: currentScales } : s));
    setQuickEditData(null);

    try {
      await updateDoc(doc(db, 'services', service.id), { scales: currentScales });
      showQuickToast(`${member.name} foi removido(a) da escala.`);
    } catch (err) {
      console.error("Erro ao remover membro:", err);
      showQuickToast("Erro ao remover voluntário.");
    }
  };

  const handleConfirmVolunteer = async (serviceId: string, memberId: string, status: 'confirmed' | 'declined') => {
    const serviceRef = doc(db, 'services', serviceId);
    try {
      await updateDoc(serviceRef, {
        [`confirmations.${memberId}`]: status
      });
      setServices(prev => prev.map(svc => {
        if (svc.id === serviceId) {
          const currentConfirmations = svc.confirmations || {};
          return {
            ...svc,
            confirmations: {
              ...currentConfirmations,
              [memberId]: status
            }
          };
        }
        return svc;
      }));
    } catch (error) {
      console.error("Erro ao confirmar voluntário:", error);
    }
  };

  // Filtros de busca para cultos (título e data)
  const [filterTitle, setFilterTitle] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      if (filterTitle) {
        const titleMatch = service.title?.toLowerCase().includes(filterTitle.toLowerCase());
        if (!titleMatch) return false;
      }
      if (filterDate) {
        let sDateObj: Date;
        if (service.date?.toDate) {
          sDateObj = service.date.toDate();
        } else if (service.date instanceof Date) {
          sDateObj = service.date;
        } else {
          sDateObj = new Date(service.date);
        }
        if (!isNaN(sDateObj.getTime())) {
          const sDateStr = getLocalDateString(sDateObj);
          if (sDateStr !== filterDate) return false;
        } else {
          return false;
        }
      }
      return true;
    });
  }, [services, filterTitle, filterDate]);

  const handleSaveAndCompleteScale = async (service: any) => {
    const servicePath = `services/${service.id}`;
    try {
      await updateDoc(doc(db, 'services', service.id), { scales: localScales });
      
      if (createNotifications) {
        const dateStr = new Date(service.date).toLocaleDateString('pt-BR');
        await createNotifications(
          '📅 Escala Publicada',
          `A escala para o culto "${service.title}" em ${dateStr} foi definida/atualizada. Abra o app para conferir!`,
          'service',
          user?.uid,
          'notifyScheduleChanges'
        );
      }
      
      setEditingServiceId(null);
      setLocalScales({});
      alert("Culto e escala salvos e publicados com sucesso! Os membros foram notificados.");
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, servicePath);
    }
  };

  useEffect(() => {
    if (!user) return;
    const servicePath = 'services';
    const memberPath = 'members';
    
    const unsubServices = onSnapshot(query(collection(db, servicePath), orderBy('date', 'asc')), (snap) => {
      const allServices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const filtered = allServices.filter((s: any) => s.churchId === userChurchId || (!s.churchId && userChurchId === 'semente'));
      const now = getLocalDateTimeString();
      const nowDay = now.split('T')[0];
      
      // Filtra para mostrar apenas cultos futuros (ou de hoje) e normaliza as datas
      const futureServices = filtered
        .map((s: any) => {
          let serviceDateStr = '';
          if (s.date?.toDate) {
            serviceDateStr = getLocalDateTimeString(s.date.toDate());
          } else if (s.date instanceof Date) {
            serviceDateStr = getLocalDateTimeString(s.date);
          } else if (typeof s.date === 'string') {
            serviceDateStr = s.date;
          } else {
            serviceDateStr = getLocalDateTimeString(new Date(s.date));
          }
          return { ...s, _serviceDateStr: serviceDateStr };
        })
        .filter((s: any) => {
          const sDay = s._serviceDateStr.split('T')[0];
          return sDay === nowDay || s._serviceDateStr >= now;
        });
      setServices(futureServices);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, servicePath);
    });

    const unsubMembers = onSnapshot(collection(db, memberPath), (snap) => {
      const allMembers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const filtered = allMembers.filter((m: any) => m.churchId === userChurchId || (!m.churchId && userChurchId === 'semente'));
      setMembers(filtered);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, memberPath);
    });

    const unsubGroupLink = onSnapshot(doc(db, 'settings', 'notifications'), (snap) => {
      if (snap.exists()) {
        setWhatsappGroupLink(snap.data().whatsappGroupLink || '');
      }
    });

    return () => {
      unsubServices();
      unsubMembers();
      unsubGroupLink();
    };
  }, [user, userChurchId]);

  const handleAddService = async () => {
    if(!newService.title || !newService.date) return;
    const servicePath = 'services';
    try {
      await addDoc(collection(db, servicePath), { 
        ...newService, 
        availability: {},
        liturgy: [],
        createdAt: serverTimestamp(),
        churchId: userChurchId
      });

      // Trigger notification
      const dateStr = new Date(newService.date).toLocaleDateString('pt-BR');
      await createNotifications(
        "Novo Culto Agendado",
        `${newService.title} - ${dateStr}`,
        'service',
        user?.uid,
        'notifyScheduleChanges'
      );

      setIsAdding(false);
      setNewService({ title: '', date: '', scales: {}, setlist: [], playlistUrl: '', theme: 'normal' });
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, servicePath);
    }
  };

  const setAvailability = async (serviceId: string, status: 'available' | 'unavailable' | 'maybe') => {
    if (!user) return;
    const servicePath = `services/${serviceId}`;
    try {
      const serviceRef = doc(db, 'services', serviceId);
      const service = services.find(s => s.id === serviceId);
      const updatedAvailability = { ...(service.availability || {}), [user.uid]: status };
      await updateDoc(serviceRef, { availability: updatedAvailability });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
    }
  };

  const downloadScalePDF = (service: any) => {
    const doc = new jsPDF();
    const date = service.date?.toDate ? service.date.toDate() : new Date(service.date);
    const dateStr = !isNaN(date.getTime()) ? date.toLocaleDateString('pt-BR') : '--';
    const timeStr = !isNaN(date.getTime()) ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--';

    doc.setFontSize(18);
    doc.setTextColor(43, 169, 184);
    doc.text(`Escala: ${service.title || 'Culto'}`, 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Data: ${dateStr} - ${timeStr}h`, 14, 28);

    const allRolesForPdf = Array.from(new Set([
      ...roles,
      'Professor Babies',
      'Professor Kids',
      ...Object.keys(service.scales || {})
    ]));

    const tableData: any[][] = [];

    allRolesForPdf.forEach(role => {
      const ids = service.scales?.[role] || [];
      const assignedIds = (Array.isArray(ids) ? ids : [ids]).filter(Boolean);
      const names = assignedIds.map(id => {
        const member = members.find(m => m.id === id || m.name === id || m.name?.trim().toLowerCase() === String(id).trim().toLowerCase());
        const rawName = member ? member.name : String(id);
        return getFormatNameForPdf(rawName);
      }).join(', ');

      if (assignedIds.length > 0 || roles.includes(role)) {
        tableData.push([role, names || '---']);
      }
    });

    if (tableData.length === 0) {
      tableData.push(['Sem escalas', 'Nenhum ministro escalado até o momento.']);
    }

    autoTable(doc, {
      startY: 35,
      head: [['Função / Instrumento', 'Ministro(s) Escalado(s)']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [43, 169, 184],
        textColor: 255,
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [43, 169, 184]
      },
      styles: { 
        fontSize: 10, 
        cellPadding: 5,
        textColor: 40,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { cellWidth: 'auto' }
      }
    });

    const cleanTitle = (service.title || 'Culto').replace(/[\s\/\\:*?"<>|]/g, '_');
    const cleanDate = dateStr.replace(/[\s\/\\:*?"<>|]/g, '-');
    doc.save(`Escala_${cleanTitle}_${cleanDate}.pdf`);
  };

  const downloadScaleImage = (serviceId: string, title: string, dateStr: string) => {
    const element = document.getElementById(`scale-card-${serviceId}`);
    if (element) {
      // Pequeno timeout para garantir que o DOM está pronto se necessário
      toPng(element, { 
        cacheBust: true, 
        backgroundColor: '#022c22', // deep emerald surface
        filter: (node) => {
          const exclusionClasses = ['no-export'];
          return !exclusionClasses.some(cls => (node as HTMLElement).classList?.contains(cls));
        },
        // Ajustamos o estilo para a exportação ficar bonita
        style: {
          margin: '0',
          padding: '0'
        }
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          const cleanDate = dateStr.replace(/\//g, '-');
          link.download = `Escala_${title.replace(/\s+/g, '_')}_${cleanDate}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error('Falha ao exportar imagem', err);
        });
    }
  };

  const downloadScaleExcel = (service: any) => {
    const dateStr = formatDate(service.date);
    
    const allRolesForExcel = [...roles, 'Professor Babies', 'Professor Kids'];
    const rows = allRolesForExcel.map(role => {
      const memberIds = service.scales?.[role] || [];
      const assignedIds = Array.isArray(memberIds) ? memberIds : [memberIds].filter(Boolean);
      const names = assignedIds.map((mId: string) => {
        const m = members.find(mem => mem.id === mId);
        return m ? getFormatNameForPdf(m.name) : 'N/A';
      }).join(', ');
      return { Função: role, Membros: names };
    });

    exportJsonToExcel(
      rows,
      `Escala_${service.title ? service.title.replace(/\s+/g, '_') : 'Culto'}_${dateStr}`,
      'Escala'
    );
  };

  const shareScaleWhatsAppIndividual = (service: any) => {
    const date = service.date?.toDate ? service.date.toDate() : new Date(service.date);
    const dateStr = !isNaN(date.getTime()) 
      ? date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) 
      : '--';
    const timeStr = !isNaN(date.getTime()) 
      ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
      : '--';

    let message = `📢 *ESCALA DO CULTO* 📢\n`;
    message += `*${service.title || 'Culto'}*\n`;
    message += `📅 *Data:* ${dateStr}\n`;
    message += `⏰ *Hora:* ${timeStr}h\n\n`;
    message += `🎶 *EQUIPE DO MINISTÉRIO:* 🎶\n`;

    const allRolesForShare = Array.from(new Set([
      ...roles,
      'Professor Babies',
      'Professor Kids',
      ...Object.keys(service.scales || {})
    ]));

    let hasAnyMember = false;

    allRolesForShare.forEach(role => {
      const ids = service.scales?.[role] || [];
      const assignedIds = (Array.isArray(ids) ? ids : [ids]).filter(Boolean);
      if (assignedIds.length > 0) {
        hasAnyMember = true;
        const names = assignedIds.map(id => {
          const member = members.find(m => m.id === id || m.name === id || m.name?.trim().toLowerCase() === String(id).trim().toLowerCase());
          const rawName = member ? member.name : String(id);
          return getFormatNameForPdf(rawName);
        }).join(', ');
        message += `• *${role}:* ${names}\n`;
      }
    });

    if (!hasAnyMember) {
      message += `_Nenhum ministro escalado ainda._\n`;
    }

    if (service.playlistUrl) {
      message += `\n🎧 *Playlist do Culto:* ${service.playlistUrl}\n`;
    }

    message += `\n🔗 *Acesse o nosso sistema:* ${window.location.origin}\n\n`;
    message += `_Gerado por LiLouPro_`;

    try {
      navigator.clipboard.writeText(message);
      showQuickToast("Escala copiada! Abrindo WhatsApp...");
    } catch (err) {
      console.warn("Could not copy to clipboard", err);
    }

    const encoded = encodeURIComponent(message);
    if (whatsappGroupLink) {
      window.open(whatsappGroupLink, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank', 'noopener,noreferrer');
    }
  };

  const generateMonthPDF = () => {
    if (services.length === 0) return null;
    
    // Configura a folha como paisagem (landscape)
    const doc = new jsPDF({ orientation: 'landscape' });
    const now = new Date();
    const monthYear = formatDate(now, { month: 'long', year: 'numeric' });
    
    // Ordena os cultos por data
    const sortedServices = [...services].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    doc.setFontSize(22);
    doc.setTextColor(43, 169, 184); // cor da marca
    doc.text(`Escala Mensal: ${monthYear}`, 14, 20);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Documento gerado em: ${formatDate(new Date(), { day: '2-digit', month: '2-digit', year: 'numeric' })} ${formatTime(new Date())}`, 14, 26);
    
    // Cabeçalho: Primeira coluna é a Função, as demais são as datas dos cultos
    const headers = [['Instrumento / Função', ...sortedServices.map(s => {
      const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
      return isNaN(d.getTime()) ? 'Data Inválida' : `${d.getDate()}/${d.getMonth() + 1}\n${s.title}`;
    })]];

    // Dados: Uma linha para cada função (Role)
    const allRolesForMonthPdf = Array.from(new Set([
      ...roles,
      'Professor Babies',
      'Professor Kids',
      ...sortedServices.flatMap(s => Object.keys(s.scales || {}))
    ]));
    const tableData = allRolesForMonthPdf.map(role => {
      const row = [role];
      sortedServices.forEach(service => {
        const memberIds = service.scales?.[role] || [];
        const assignedIds = (Array.isArray(memberIds) ? memberIds : [memberIds]).filter(Boolean);
        const memberNames = assignedIds
          .map(id => {
            const member = members.find(m => m.id === id || m.name === id || m.name?.trim().toLowerCase() === String(id).trim().toLowerCase());
            const rawName = member ? member.name : String(id);
            const formattedMemberName = getFormatNameForPdf(rawName);
            const firstName = formattedMemberName.split(' ')[0];
            const hasDuplicateFirstName = members.filter(m => getFormatNameForPdf(m.name).split(' ')[0] === firstName).length > 1;
            
            return hasDuplicateFirstName ? formattedMemberName : firstName;
          })
          .join(', ');
        row.push(memberNames || '---');
      });
      return row;
    });

    autoTable(doc, {
      startY: 32,
      head: headers,
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [43, 169, 184], 
        fontSize: 8, 
        halign: 'center',
        valign: 'middle',
        textColor: 255,
        lineWidth: 0.1,
        lineColor: [43, 169, 184]
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left', cellWidth: 40, fillColor: [245, 245, 245], lineColor: [180, 180, 180] }
      },
      margin: { left: 14, right: 14, bottom: 15 },
      alternateRowStyles: {
        fillColor: [252, 252, 252]
      }
    });

    // Rodapé simples
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `LiLouPro - Sistema de Gestão de Louvor`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    const cleanMonthYear = monthYear.replace(/[\s\/\\:*?"<>|]/g, '_');
    return { doc, filename: `Escala_Mensal_${cleanMonthYear}.pdf` };
  };

  const downloadMonthPDF = () => {
    const result = generateMonthPDF();
    if (result) {
      result.doc.save(result.filename);
    }
  };

  const shareMonthWhatsApp = async () => {
    const now = new Date();
    const monthYear = formatDate(now, { month: 'long', year: 'numeric' });
    const sortedServices = [...services].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let message = `📢 *ESCALA MENSAL DE LOUVOR - ${monthYear.toUpperCase()}* 📢\n\n`;

    if (sortedServices.length === 0) {
      message += `_Nenhum culto agendado para este mês._\n`;
    } else {
      sortedServices.forEach(service => {
        const d = service.date?.toDate ? service.date.toDate() : new Date(service.date);
        const dateStr = isNaN(d.getTime()) ? '--' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        message += `📅 *${dateStr} - ${service.title || 'Culto'}*\n`;
        
        const allRolesForMonth = Array.from(new Set([
          ...roles,
          'Professor Babies',
          'Professor Kids',
          ...Object.keys(service.scales || {})
        ]));

        let count = 0;
        allRolesForMonth.forEach(role => {
          const ids = service.scales?.[role] || [];
          const assignedIds = (Array.isArray(ids) ? ids : [ids]).filter(Boolean);
          if (assignedIds.length > 0) {
            count++;
            const names = assignedIds.map(id => {
              const member = members.find(m => m.id === id || m.name === id || m.name?.trim().toLowerCase() === String(id).trim().toLowerCase());
              return getFormatNameForPdf(member ? member.name : String(id));
            }).join(', ');
            message += `  • *${role}:* ${names}\n`;
          }
        });

        if (count === 0) {
          message += `  _Escala pendente_\n`;
        }
        message += `\n`;
      });
    }

    message += `🔗 *Acesse o nosso sistema:* ${window.location.origin}\n_Gerado por LiLouPro_`;

    try {
      navigator.clipboard.writeText(message);
      showQuickToast("Texto da escala mensal copiado! Abrindo WhatsApp...");
    } catch (err) {
      console.warn("Could not copy to clipboard", err);
    }

    const encoded = encodeURIComponent(message);
    const targetUrl = whatsappGroupLink || `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');

    try {
      const result = generateMonthPDF();
      if (result) {
        result.doc.save(result.filename);
      }
    } catch (e) {
      console.error("Erro ao salvar PDF mensal:", e);
    }
  };

  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const suggestScalesForService = async (serviceId: string) => {
    setIsGenerating(serviceId);
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const dateStr = service.date.split('T')[0];
    const servicePath = `services/${serviceId}`;

    try {
      // 1. Fetch general availabilities for this date
      const availSnap = await getDocs(query(
        collection(db, 'availability'),
        where('date', '==', dateStr)
      ));
      const generalAvail = availSnap.docs.reduce((acc, doc) => {
        acc[doc.data().userId] = doc.data().status;
        return acc;
      }, {} as Record<string, string>);

      // 2. Calculate participation frequency (last 90 days)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
      const historyServices = services.filter(s => s.date >= getLocalDateTimeString(threeMonthsAgo) && s.date < service.date);
      
      const usageCount: Record<string, number> = {};
      historyServices.forEach(s => {
        Object.values(s.scales || {}).flat().forEach((mId: any) => {
          usageCount[mId] = (usageCount[mId] || 0) + 1;
        });
      });

      // 3. Generate suggestions for each role
      const baseScales = (editingServiceId === serviceId) ? localScales : (service.scales || {});
      const newScales: Record<string, string[]> = { ...baseScales };
      
      roles.forEach(role => {
        // Only suggest if not already filled
        if (newScales[role] && newScales[role].length > 0) return;

        const candidates = members.filter(m => Array.isArray(m.roles) && m.roles.includes(role));
        
        const scoredCandidates = candidates.map(m => {
          let score = 0;
          
          // Availability check
          const specificAvail = service.availability?.[m.id];
          const generalStatus = generalAvail[m.id];

          if (specificAvail === 'unavailable') return null;
          if (generalStatus === 'unavailable' && !specificAvail) return null;

          if (specificAvail === 'available') score += 100;
          else if (generalStatus === 'available') score += 50;
          else if (specificAvail === 'maybe') score += 10;

          // Frequency check (favor those who played less)
          const frequency = usageCount[m.id] || 0;
          score -= frequency * 5;

          return { id: m.id, score };
        }).filter(Boolean) as { id: string, score: number }[];

        // Sort by score descending
        scoredCandidates.sort((a, b) => b.score - a.score);

        if (scoredCandidates.length > 0) {
          // Add top candidate
          newScales[role] = [scoredCandidates[0].id];
        }
      });

      if (editingServiceId === serviceId) {
        setLocalScales(newScales);
        alert("Sugestão de escala gerada localmente! Ajuste as marcações e clique em 'Concluir e Salvar' para consolidar.");
      } else {
        await updateDoc(doc(db, 'services', serviceId), { scales: newScales });
        const svc = services.find(s => s.id === serviceId);
        if (createNotifications && svc) {
          const dateStr = new Date(svc.date).toLocaleDateString('pt-BR');
          await createNotifications(
            '📅 Escala Gerada',
            `Uma nova sugestão de escala para "${svc.title}" em ${dateStr} foi definida.`,
            'service',
            user?.uid,
            'notifyScheduleChanges'
          );
        }
        alert("Sugestão de escala gerada com sucesso! Baseada em disponibilidade e rodízio de membros.");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, servicePath);
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 calendar-view">
      <div className="flex flex-col items-center justify-center text-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-main tracking-tight">Calendário & Escalas</h1>
          <p className="text-text-main text-sm font-medium mb-4">Organize as escalas de louvor e disponibilidades.</p>
          
          <div className="w-full max-w-xl text-left mx-auto">
            <ContextualHelp 
              id="calendar"
              title="Escala: Como Confirmar seu Culto?"
              description="A Escala do Culto reúne todo o time escalado (músicos, vocalistas e técnicos) e as músicas selecionadas para cada evento da igreja."
              steps={[
                "Localize o Culto desejado listado abaixo.",
                "Se você estiver escalado, utilize os botões de confirmação (Sim / Não) para informar sua presença ao líder.",
                "Clique em 'Lista de Músicas' para estudar o repertório específico daquele dia, abrindo cifras ou o player.",
                "Compartilhe a escala no grupo do WhatsApp da igreja usando o botão 'Compartilhar Escala' ou baixe em PDF."
              ]}
              tip="Preencher as disponibilidades no menu correspondente ajuda a liderança a escalar você nos melhores dias possíveis de forma automática com a nossa IA inteligente!"
              theme={theme}
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {isAdmin && (
            <Button onClick={() => setIsAdding(true)} className="px-6 py-2.5">
              <Plus size={18}/> Novo Agendamento
            </Button>
          )}
          <Button 
            onClick={downloadMonthPDF} 
            className="bg-brand text-white hover:bg-brand/90 px-6 py-2.5 border-none shadow-md transition-all font-bold flex items-center"
          >
            <FileDown size={18} className="mr-2" /> Baixar Escala Mês
          </Button>
          <Button 
            onClick={shareMonthWhatsApp} 
            className="bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-2.5 border-none shadow-md transition-all font-bold"
          >
            <Share2 size={18} className="mr-2" /> WhatsApp
          </Button>
        </div>
      </div>

      {/* Filtros de Busca */}
      <div className="max-w-4xl mx-auto w-full px-4 no-export">
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-end shadow-md">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-black text-text-main uppercase tracking-widest pl-1 block">Buscar por título</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60 w-4 h-4" />
              <Input 
                placeholder="Buscar culto por título..." 
                value={filterTitle}
                onChange={e => setFilterTitle(e.target.value)}
                className="pl-10 h-11 bg-black/10 dark:bg-white/5 border border-border text-text-main rounded-xl"
              />
            </div>
          </div>
          
          <div className="w-full sm:w-56 space-y-1.5">
            <label className="text-[10px] font-black text-text-main uppercase tracking-widest pl-1 block">Filtrar por data</label>
            <Input 
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="h-11 bg-black/10 dark:bg-white/5 border border-border text-text-main rounded-xl"
            />
          </div>

          {(filterTitle || filterDate) && (
            <button
              onClick={() => {
                setFilterTitle('');
                setFilterDate('');
              }}
              className="h-11 px-5 rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <X size={14} /> Limpar
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-8">
        {filteredServices.length > 0 ? (
          filteredServices.map(service => (
            <div key={service.id} id={`scale-card-${service.id}`} className="rounded-3xl overflow-hidden">
            <Card 
              className={cn(
                "p-0 border overflow-visible shadow-2xl backdrop-blur-md transition-all duration-300",
                service.theme === 'missions' && "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10",
                service.theme === 'family' && "border-orange-500/30 bg-orange-500/5 dark:bg-orange-950/10",
                service.theme === 'easter' && "border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/10",
                service.theme === 'christmas' && "border-red-500/30 bg-red-500/5 dark:bg-red-950/10",
                service.theme === 'palm_sunday' && "border-green-500/30 bg-green-500/5 dark:bg-green-950/10",
                service.theme === 'youth' && "border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/10",
                service.theme === 'men' && "border-blue-500/30 bg-blue-500/5 dark:bg-blue-950/10",
                service.theme === 'women' && "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10",
                service.theme === 'prayer' && "border-sky-500/30 bg-sky-500/5 dark:bg-sky-950/10",
                service.theme === 'vigil' && "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10",
                (!service.theme || service.theme === 'normal') && "border-border bg-black/5 dark:bg-white/5"
              )}
            >
              <div className={cn(
                "flex flex-col md:flex-row justify-between md:items-center gap-4 sm:gap-6 p-4 sm:p-8 border-b transition-all duration-300",
                service.theme === 'missions' && "bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/20",
                service.theme === 'family' && "bg-orange-500/5 dark:bg-orange-950/10 border-orange-500/20",
                service.theme === 'easter' && "bg-purple-500/5 dark:bg-purple-950/10 border-purple-500/20",
                service.theme === 'christmas' && "bg-red-500/5 dark:bg-red-950/10 border-red-500/20",
                service.theme === 'palm_sunday' && "bg-green-500/5 dark:bg-green-950/10 border-green-500/20",
                service.theme === 'youth' && "bg-indigo-500/5 dark:bg-indigo-950/10 border-indigo-500/20",
                service.theme === 'men' && "bg-blue-500/5 dark:bg-blue-950/10 border-blue-500/20",
                service.theme === 'women' && "bg-rose-500/5 dark:bg-rose-950/10 border-rose-500/20",
                service.theme === 'prayer' && "bg-sky-500/5 dark:bg-sky-950/10 border-sky-500/20",
                service.theme === 'vigil' && "bg-amber-500/5 dark:bg-amber-950/10 border-amber-500/20",
                (!service.theme || service.theme === 'normal') && "bg-black/5 dark:bg-white/5 border-border"
              )}>
               <div className="flex gap-4 sm:gap-6 items-center">
                 {(() => {
                   const hasLiturgy = service.liturgy && Array.isArray(service.liturgy) && service.liturgy.length > 0;
                   const isThemed = service.theme && service.theme !== 'normal';
                   return (
                     <div className={cn(
                       "w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center shadow-inner shrink-0 text-text-main relative border transition-all duration-300",
                       hasLiturgy 
                         ? "bg-brand/15 border-brand/50 shadow-md shadow-brand/10 dark:bg-brand/10" 
                         : (isThemed 
                            ? "bg-white/10 dark:bg-black/40 border-current/20" 
                            : "bg-black/10 dark:bg-white/10 border-border")
                     )}>
                       <span className="text-[8px] sm:text-[10px] font-black text-text-main/90 uppercase leading-none mb-0.5 sm:1 tracking-tighter">{formatDate(service.date, { month: 'short' })}</span>
                       <span className="text-lg sm:text-2xl font-black leading-none">{(() => {
                         const d = service.date?.toDate ? service.date.toDate() : new Date(service.date);
                         return !isNaN(d.getTime()) ? d.getDate() : '--';
                       })()}</span>
                       {hasLiturgy && (
                         <div 
                           className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand text-white rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-md" 
                           title="Liturgia Configurada"
                         >
                           <Check size={10} strokeWidth={4} />
                         </div>
                       )}
                     </div>
                   );
                 })()}
                 <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-1 sm:mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-2xl font-black text-text-main tracking-tight leading-tight truncate">{service.title}</h3>
                      {service.liturgy && Array.isArray(service.liturgy) && service.liturgy.length > 0 && (
                        <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-brand/10 border border-brand/30 text-brand">
                          <Check size={10} strokeWidth={3} /> Liturgia Pronta
                        </span>
                      )}
                      
                      {isAdmin ? (
                        <select
                          value={service.theme || 'normal'}
                          onChange={async (e) => {
                            const newTheme = e.target.value;
                            await updateDoc(doc(db, 'services', service.id), { theme: newTheme });
                          }}
                          className={cn(
                            "inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border bg-black/10 dark:bg-white/5 outline-none cursor-pointer hover:scale-105 transition-all text-text-main",
                            (SERVICE_THEMES[service.theme || 'normal'] || SERVICE_THEMES.normal).badge
                          )}
                        >
                          {Object.entries(SERVICE_THEMES).map(([key, t]) => (
                            <option key={key} value={key} className="bg-surface text-text-main">
                              {t.icon} {t.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        service.theme && service.theme !== 'normal' && (
                          <span className={cn(
                            "inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border",
                            (SERVICE_THEMES[service.theme] || SERVICE_THEMES.normal).badge
                          )}>
                            <span>{(SERVICE_THEMES[service.theme] || SERVICE_THEMES.normal).icon}</span>
                            <span>{(SERVICE_THEMES[service.theme] || SERVICE_THEMES.normal).name}</span>
                          </span>
                        )
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                       {service.playlistUrl ? (
                         <Button 
                           onClick={() => { window.open(service.playlistUrl, '_blank'); }}
                           className="bg-white hover:bg-white/90 text-[#E60000] border border-[#E60000]/20 rounded-full px-5 h-9 sm:h-10 shadow-md shadow-red-900/5 transition-all flex items-center gap-2 group"
                         >
                           <Youtube size={18} fill="#E60000" className="group-hover:scale-105 transition-transform" />
                           <span className="text-xs font-bold">Playlist do Culto</span>
                         </Button>
                       ) : (
                         <div className="flex items-center gap-2 opacity-30 grayscale cursor-not-allowed">
                            <div className="w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center">
                               <Youtube size={16} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest">Sem Playlist</span>
                         </div>
                       )}
                    </div>
                  </div>
                   <p className="text-[10px] sm:text-sm text-text-main font-bold flex items-center gap-1 sm:2">
                      <Clock size={12} className="text-brand sm:w-[14px] sm:h-[14px] shrink-0"/>
                      <span className="truncate">{formatDate(service.date, { weekday: 'short' })} • {formatTime(service.date)}</span>
                   </p>
                 </div>
               </div>
               
               <div className="flex flex-col sm:items-end gap-3 sm:gap-4 no-export">
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => downloadScalePDF(service)}
                      className="text-[9px] sm:text-[10px] font-black text-white hover:brightness-110 transition-all uppercase tracking-widest flex items-center gap-2 bg-brand px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-brand/20 shadow-sm"
                    >
                      <Download size={11} className="sm:w-3.5 sm:h-3.5"/> PDF
                    </button>
                    <button 
                      onClick={() => shareScaleWhatsAppIndividual(service)}
                      className="text-[9px] sm:text-[10px] font-black text-white hover:brightness-110 transition-all uppercase tracking-widest flex items-center gap-2 bg-emerald-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-emerald-600/20 shadow-sm"
                    >
                      <Share2 size={11} className="sm:w-3.5 sm:h-3.5"/> WhatsApp
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm(`Deseja realmente excluir o agendamento do culto "${service.title}"? Esta ação removerá o culto e a escala associada.`)) {
                            const servicePath = `services/${service.id}`;
                            try {
                              await deleteDoc(doc(db, 'services', service.id));
                            } catch (error) {
                              handleFirestoreError(error, OperationType.DELETE, servicePath);
                            }
                          }
                        }}
                        className="text-[9px] sm:text-[10px] font-black text-red-500 hover:text-white hover:bg-red-600 transition-all uppercase tracking-widest flex items-center gap-1.5 bg-red-500/10 hover:border-red-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-red-500/20 shadow-sm cursor-pointer"
                        title="Excluir agendamento do culto"
                      >
                        <X size={13} strokeWidth={2.5} className="sm:w-3.5 sm:h-3.5"/> Excluir Culto
                      </button>
                    )}
               </div>
            </div>
          </div>

            <div className="p-4 sm:p-8">
               {(() => {
                 const isEditingThis = editingServiceId === service.id;
                 const scalesToUse = isEditingThis ? localScales : (service.scales || {});
                 
                 return (
                   <>
                     <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-border pb-3 sm:4 mb-6 sm:8 gap-4">
                       <h4 className="text-[9px] sm:text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                          <span className="w-3 sm:4 h-[1px] bg-brand"></span> Composição da Escala Musical
                       </h4>
                       {isAdmin && (
                         <div className="flex flex-wrap items-center gap-2">
                           {isEditingThis ? (
                             <>
                               <span className="text-[9px] font-black uppercase bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-1.5 rounded-full animate-pulse flex items-center gap-1.5">
                                 <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                 Editando Escala
                               </span>
                               
                               <Button 
                                 onClick={() => suggestScalesForService(service.id)}
                                 disabled={isGenerating === service.id}
                                 className="bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 h-auto rounded-full"
                               >
                                 {isGenerating === service.id ? (
                                   <RefreshCcw size={12} className="animate-spin mr-2" />
                                 ) : (
                                   <Sparkles size={12} className="mr-2" />
                                 )}
                                 Auto-Sugerir
                               </Button>

                               <Button 
                                 onClick={() => {
                                   if (confirm("Deseja descartar as alterações não salvas nesta escala?")) {
                                     setEditingServiceId(null);
                                     setLocalScales({});
                                   }
                                 }}
                                 className="bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 h-auto rounded-full border border-border"
                               >
                                 Cancelar
                               </Button>

                               <Button 
                                 onClick={() => handleSaveAndCompleteScale(service)}
                                 className="bg-green-600 text-white hover:bg-green-700 text-[9px] font-black uppercase tracking-widest px-5 py-1.5 h-auto rounded-full shadow-lg shadow-green-950/20"
                               >
                                 💾 Concluir e Salvar Culto
                               </Button>
                             </>
                           ) : (
                             <>
                               <Button 
                                 onClick={() => {
                                   setEditingServiceId(service.id);
                                   setLocalScales(service.scales || {});
                                 }}
                                 className="bg-blue-600 text-white hover:bg-blue-700 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 h-auto rounded-full"
                               >
                                 ✏️ Editar Escala
                               </Button>
                               
                               <Button 
                                 onClick={() => {
                                   setEditingServiceId(service.id);
                                   setLocalScales(service.scales || {});
                                   setTimeout(() => {
                                     suggestScalesForService(service.id);
                                   }, 100);
                                 }}
                                 disabled={isGenerating === service.id}
                                 className="bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 h-auto rounded-full"
                               >
                                 {isGenerating === service.id ? (
                                   <RefreshCcw size={12} className="animate-spin mr-2" />
                                 ) : (
                                   <Sparkles size={12} className="mr-2" />
                                 )}
                                 Auto-Escala
                               </Button>
                             </>
                           )}
                         </div>
                       )}
                     </div>

                     <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {Object.entries(
                        roles.reduce((acc, role) => {
                          const ids = scalesToUse[role] || [];
                          const assignedIds = Array.isArray(ids) ? ids : [ids].filter(Boolean);
                          assignedIds.forEach(id => {
                            if (!acc[id]) acc[id] = [];
                            acc[id].push(role);
                          });
                          return acc;
                        }, {} as Record<string, string[]>)
                      ).map(([mId, assignedRoles]) => {
                        const member = members.find(m => m.id === mId);
                        if (!member) return null;
                        return (
                          <motion.div 
                            key={mId} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group p-4 rounded-2xl bg-brand/20 border border-brand/30 shadow-xl hover:border-brand/40 transition-all h-full flex flex-col min-h-[160px]"
                          >
                            <div className="flex items-center gap-3 min-w-0 w-full mb-2.5 border-b border-white/5 pb-2">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand/10 dark:bg-white/10 flex items-center justify-center border border-brand/30 shadow-md shrink-0 overflow-hidden relative">
                                <CachedAvatar 
                                  photoUrl={member.photoUrl} 
                                  alt={member.name} 
                                  className="w-full h-full" 
                                  fallbackText={member.name}
                                />
                                <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-brand border-2 border-surface shadow-[0_0_6px_rgba(37,99,235,0.6)]"></div>
                              </div>
                              <div className="min-w-0 flex-1 flex flex-col justify-center">
                                <span className="font-black text-text-main text-base sm:text-lg tracking-tight truncate block leading-tight">{member.name}</span>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickEditData({ service, member, assignedRoles });
                                    }}
                                    className="mt-1.5 text-[10px] font-black text-brand uppercase bg-brand/15 hover:bg-brand/30 border border-brand/30 px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit shrink-0 cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-all"
                                    title="Edição rápida de função"
                                  >
                                    <Zap size={10} className="fill-brand shrink-0" />
                                    <span>Edição Rápida</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <div 
                              onClick={(e) => {
                                if (isAdmin) {
                                  e.stopPropagation();
                                  setQuickEditData({ service, member, assignedRoles });
                                }
                              }}
                              className={cn(
                                "flex flex-col gap-1 p-2 -mx-1.5 rounded-xl transition-all min-h-[36px]",
                                isAdmin && "cursor-pointer hover:bg-brand/10 group/roleclick"
                              )}
                              title={isAdmin ? "Clique para edição rápida de função" : undefined}
                            >
                              <p className="text-xs sm:text-sm font-bold text-text-main leading-relaxed break-words">
                                <span className="text-text-muted/40 mr-1">/</span>
                                {assignedRoles.join(' • ')}
                              </p>
                            </div>

                            {/* Confirmation Status Badge & Action Controls */}
                            {(() => {
                              const confirmationStatus = service.confirmations?.[mId] || 'pending';
                              return (
                                <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2">
                                  <div className="flex items-center justify-between text-[10px] font-black uppercase">
                                    <span className="text-text-muted">Presença:</span>
                                    {confirmationStatus === 'confirmed' && (
                                      <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 font-black">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Confirmado
                                      </span>
                                    )}
                                    {confirmationStatus === 'declined' && (
                                      <span className="text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1 font-black">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                        Recusado
                                      </span>
                                    )}
                                    {confirmationStatus === 'pending' && (
                                      <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1 font-black">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                        Pendente
                                      </span>
                                    )}
                                  </div>

                                  {(member.uid === user?.uid || isAdmin) && (
                                    <div className="flex gap-1.5 mt-1 no-export">
                                      <button
                                        type="button"
                                        onClick={() => handleConfirmVolunteer(service.id, mId, 'confirmed')}
                                        className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all border ${
                                          confirmationStatus === 'confirmed'
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md font-extrabold'
                                            : 'bg-emerald-500/5 hover:bg-emerald-500/20 border-emerald-500/15 text-emerald-400'
                                        }`}
                                      >
                                        Confirmar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleConfirmVolunteer(service.id, mId, 'declined')}
                                        className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all border ${
                                          confirmationStatus === 'declined'
                                            ? 'bg-rose-600 border-rose-600 text-white shadow-md font-extrabold'
                                            : 'bg-rose-500/5 hover:bg-rose-500/20 border-rose-500/15 text-rose-400'
                                        }`}
                                      >
                                        Recusar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                            
                            {isAdmin && isEditingThis &&
                              <div className="mt-auto pt-3 border-t border-border flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity no-export">
                                 {assignedRoles.map((role, rIdx) => (
                                   <button
                                     key={rIdx}
                                     onClick={() => {
                                       const updatedScales = { ...scalesToUse };
                                       updatedScales[role] = (Array.isArray(updatedScales[role]) ? updatedScales[role] : [updatedScales[role]]).filter((id: string) => id !== mId);
                                       setLocalScales(updatedScales);
                                     }}
                                     className="text-[8px] font-black uppercase text-red-400 hover:bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/10 flex items-center gap-1"
                                     title={`Remover ${role}`}
                                   >
                                      {role} <X size={8} />
                                   </button>
                                 ))}
                              </div>
                            }
                          </motion.div>
                        );
                      })}

                      {/* Add member to role section */}
                      {isAdmin && isEditingThis && (
                        <div className="p-4 rounded-2xl bg-brand/5 border border-dashed border-brand/20 flex flex-col justify-center gap-4 no-export h-full min-h-[160px]">
                          <p className="text-[10px] font-black text-text-main uppercase tracking-widest text-center">Adicionar à Escala</p>
                          <div className="space-y-3">
                            {roles.map(role => (
                              <div key={role} className="relative group/role">
                                  <select 
                                    className="w-full bg-black/5 dark:bg-slate-900 border border-border rounded-lg py-2 px-3 text-[10px] sm:text-[11px] font-black uppercase tracking-tighter cursor-pointer outline-none hover:bg-black/10 dark:hover:bg-slate-700 transition-all text-text-main appearance-none"
                                  value=""
                                  onChange={(e) => {
                                     if (!e.target.value) return;
                                     const updatedScales = { ...scalesToUse };
                                     const currentList = Array.isArray(updatedScales[role]) ? updatedScales[role] : (updatedScales[role] ? [updatedScales[role]] : []);
                                     if (!currentList.includes(e.target.value)) {
                                        updatedScales[role] = [...currentList, e.target.value];
                                        setLocalScales(updatedScales);
                                     }
                                  }}
                                >
                                <option value="" className="bg-white dark:bg-slate-900 text-zinc-900 dark:text-zinc-100">+ {role}</option>
                                  {members.map(m => {
                                    const availability = service.availability?.[m.uid];
                                    let label = '⚪';
                                    if(availability === 'available') label = '✅';
                                    if(availability === 'unavailable') label = '❌';
                                    if(availability === 'maybe') label = '❓';
                                    
                                    const memberIds = scalesToUse[role] || [];
                                    const assignedIds = Array.isArray(memberIds) ? memberIds : [memberIds].filter(Boolean);
                                    if (assignedIds.includes(m.id)) return null;
                                    
                                    return (
                                      <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-zinc-900 dark:text-zinc-100">{label} {m.name}</option>
                                    );
                                  })}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                     </div>

                      {/* Divider */}
                      <div className="my-8 border-t border-border/40"></div>

                      {/* Heading: Ministério Infantil */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-border pb-3 sm:pb-4 mb-6 gap-4">
                        <h4 className="text-[10px] sm:text-[11px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                           <span className="w-3 sm:w-4 h-[1px] bg-brand"></span> Ministério Infantil (Babies & Kids)
                        </h4>
                        <span className="text-[9px] font-black uppercase text-text-muted bg-black/10 dark:bg-white/5 border border-border px-3 py-1 rounded-full shrink-0">
                          👶 Classes Ativas
                        </span>
                      </div>

                      {/* Cards Grid for Kids and Babies Classes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {[
                          {
                            key: 'Professor Babies',
                            className: 'Classe dos Pequenos (Babies)',
                            ageGuide: '0 a 3 anos',
                            colorClass: 'border-rose-500/20 bg-rose-500/5',
                            accentColor: 'rose',
                            icon: <Baby size={20} className="text-rose-400" />
                          },
                          {
                            key: 'Professor Kids',
                            className: 'Classe das Crianças (Kids)',
                            ageGuide: '4 a 10 anos',
                            colorClass: 'border-emerald-500/20 bg-emerald-500/5',
                            accentColor: 'emerald',
                            icon: <Gift size={20} className="text-emerald-400" />
                          }
                        ].map(clazz => {
                          const teacherId = scalesToUse[clazz.key]?.[0];
                          const teacher = teacherId ? members.find(m => m.id === teacherId) : null;
                          
                          // Recomendados are members with the role
                          const recommendedMembers = members.filter(m => Array.isArray(m.roles) && m.roles.includes(clazz.key));
                          const otherMembers = members.filter(m => !Array.isArray(m.roles) || !m.roles.includes(clazz.key));

                          return (
                            <div 
                              key={clazz.key} 
                              className={cn(
                                "p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 relative overflow-hidden min-h-[200px]",
                                clazz.colorClass,
                                teacher ? "shadow-md" : "border-dashed"
                              )}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-black/10 dark:bg-white/5 border border-border">
                                      {clazz.icon}
                                    </div>
                                    <div>
                                      <h5 className="font-black text-text-main text-sm sm:text-base leading-none mb-1">{clazz.className}</h5>
                                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{clazz.ageGuide}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Teacher info */}
                                {teacher ? (
                                  <div className="flex items-center gap-3.5 bg-black/10 dark:bg-white/5 border border-border/40 p-3 rounded-xl">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-brand/10 dark:bg-white/10 flex items-center justify-center border border-brand/20 shadow-sm shrink-0 overflow-hidden">
                                      <CachedAvatar 
                                        photoUrl={teacher.photoUrl} 
                                        alt={teacher.name} 
                                        className="w-full h-full" 
                                        fallbackText={teacher.name}
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <span className="font-black text-text-main text-sm block leading-tight truncate">{teacher.name}</span>
                                      <span className="text-[10px] font-bold text-brand/80 block mt-0.5 uppercase tracking-wide">Professor Escalado</span>
                                    </div>
                                    {teacher.whatsapp && (
                                      <button
                                        onClick={() => {
                                          const date = service.date?.toDate ? service.date.toDate() : new Date(service.date);
                                          const dateStr = !isNaN(date.getTime()) 
                                            ? date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) 
                                            : '--';
                                          const timeStr = !isNaN(date.getTime()) 
                                            ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
                                            : '--';
                                          
                                          const text = `Olá, *${teacher.name}*! Tudo bem?\n\nVocê está escalado(a) como *Professor(a) na Classe ${clazz.className}* para o próximo culto:\n\n⛪ *${service.title}*\n📅 *Data:* ${dateStr}\n⏰ *Hora:* ${timeStr}h\n\nContamos muito com sua presença para abençoar a vida dos nossos pequenos! Caso tenha algum imprevisto, avise a liderança com antecedência. 🙏✨`;
                                          
                                          const phone = teacher.whatsapp.replace(/\D/g, '');
                                          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                                        }}
                                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer h-10 w-10 shrink-0"
                                        title="Enviar lembrete individual pelo WhatsApp"
                                      >
                                        <Share2 size={16} />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/15 p-3.5 rounded-xl">
                                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                      <AlertTriangle size={16} className="text-red-400" />
                                    </div>
                                    <div>
                                      <span className="font-black text-red-400 text-xs uppercase tracking-wide block leading-none mb-1">Sem professor</span>
                                      <span className="text-[10px] font-medium text-text-muted/80 block">Ninguém foi escalado para esta classe hoje.</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Admin selector */}
                              {isAdmin && isEditingThis && (
                                <div className="mt-4 pt-3 border-t border-border/60 space-y-2 no-export">
                                  <label className="text-[9px] font-black uppercase text-text-muted tracking-widest pl-0.5 block">Escalar Professor</label>
                                  <div className="flex gap-2 items-center">
                                    <select
                                      className="flex-1 bg-black/10 dark:bg-slate-900 border border-border rounded-xl py-2 px-3 text-[11px] font-black uppercase tracking-tight cursor-pointer outline-none hover:bg-black/15 dark:hover:bg-slate-800 transition-all text-text-main"
                                      value={teacherId || ""}
                                      onChange={(e) => {
                                        const updatedScales = { ...scalesToUse };
                                        if (e.target.value) {
                                          updatedScales[clazz.key] = [e.target.value];
                                        } else {
                                          delete updatedScales[clazz.key];
                                        }
                                        setLocalScales(updatedScales);
                                      }}
                                    >
                                      <option value="" className="bg-white dark:bg-slate-850 text-zinc-900 dark:text-zinc-100">-- Selecionar Integrante --</option>
                                      
                                      {recommendedMembers.length > 0 && (
                                        <optgroup label="✨ RECOMENDADOS (TEM A FUNÇÃO)" className="bg-white dark:bg-slate-850 text-purple-600 dark:text-purple-400 font-bold">
                                          {recommendedMembers.map(m => {
                                            const availability = service.availability?.[m.uid];
                                            let label = '⚪';
                                            if(availability === 'available') label = '✅';
                                            if(availability === 'unavailable') label = '❌';
                                            if(availability === 'maybe') label = '❓';
                                            return (
                                              <option key={m.id} value={m.id} className="bg-white dark:bg-slate-850 text-zinc-900 dark:text-zinc-100 font-medium">{label} {m.name}</option>
                                            );
                                          })}
                                        </optgroup>
                                      )}

                                      <optgroup label="👥 OUTROS MEMBROS" className="bg-white dark:bg-slate-850 text-zinc-500 dark:text-zinc-400">
                                        {otherMembers.map(m => {
                                          const availability = service.availability?.[m.uid];
                                          let label = '⚪';
                                          if(availability === 'available') label = '✅';
                                          if(availability === 'unavailable') label = '❌';
                                          if(availability === 'maybe') label = '❓';
                                          return (
                                            <option key={m.id} value={m.id} className="bg-white dark:bg-slate-850 text-zinc-900 dark:text-zinc-100">{label} {m.name}</option>
                                          );
                                        })}
                                      </optgroup>
                                    </select>
                                    
                                    {teacher && (
                                      <button
                                        onClick={() => {
                                          const updatedScales = { ...scalesToUse };
                                          delete updatedScales[clazz.key];
                                          setLocalScales(updatedScales);
                                        }}
                                        className="p-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all cursor-pointer h-9 w-9 flex items-center justify-center shrink-0"
                                        title="Remover escala"
                                      >
                                        <X size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                   </>
                 );
               })()}
                
                <div className="mt-8 pt-8 border-t border-white/10">
                  <LiturgyEditor key={`editor-${service.id}`} service={service} onOpenSong={onOpenSong} playlistOnly={true} />
                </div>
              </div>
          </Card>
        </div>
          ))
        ) : (
          <div className="py-16 text-center text-text-main/60 bg-card border border-border rounded-3xl p-8 max-w-lg mx-auto w-full shadow-lg">
            <Calendar size={48} className="mx-auto opacity-30 mb-4 text-brand" />
            <p className="text-sm font-black uppercase tracking-widest">Nenhum culto encontrado</p>
            <p className="text-xs mt-2 text-text-main/70 font-medium">Não há cultos correspondentes aos filtros selecionados.</p>
            {(filterTitle || filterDate) && (
              <button
                onClick={() => {
                  setFilterTitle('');
                  setFilterDate('');
                }}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest bg-brand text-white hover:brightness-110 rounded-xl shadow-md active:scale-95 transition-all"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Adding Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface border border-border rounded-2xl p-6 sm:8 w-full max-w-md shadow-2xl space-y-6 my-auto">
              <h2 className="text-xl sm:text-2xl font-black text-text-main tracking-tight">Agendar Culto</h2>
              <div className="space-y-4 sm:5">
                 <div className="space-y-2">
                   <label className="text-[9px] sm:text-[10px] font-black text-text-main uppercase tracking-widest pl-1">Identificação do Culto</label>
                   <Input placeholder="Ex: Culto de Jovens" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 sm:12" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] sm:text-[10px] font-black text-text-main uppercase tracking-widest pl-1">Tema / Ocasião do Culto</label>
                   <select 
                     value={newService.theme || 'normal'} 
                     onChange={e => setNewService({...newService, theme: e.target.value})} 
                     className="w-full bg-black/5 dark:bg-slate-900 border border-border rounded-xl h-10 sm:h-12 px-3 text-xs font-bold text-text-main hover:bg-black/10 dark:hover:bg-slate-800 transition-all outline-none cursor-pointer"
                   >
                     {Object.entries(SERVICE_THEMES).map(([key, t]) => (
                       <option key={key} value={key} className="bg-surface text-text-main">
                         {t.icon} {t.name}
                       </option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] sm:text-[10px] font-black text-text-main uppercase tracking-widest pl-1">Data e Horário</label>
                   <Input type="datetime-local" value={newService.date} onChange={e => setNewService({...newService, date: e.target.value})} className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 sm:12" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-red-500 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                      <Youtube size={10} /> Link da Playlist Culto (Opcional)
                    </label>
                    <Input placeholder="Link do Youtube" value={newService.playlistUrl} onChange={e => setNewService({...newService, playlistUrl: e.target.value})} className="bg-black/5 dark:bg-white/5 border border-border text-text-main h-10 sm:12" />
                 </div>
              </div>
               <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button variant="ghost" onClick={() => setIsAdding(false)} className="sm:flex-1 text-text-main hover:bg-black/5 dark:hover:bg-white/5 border border-border h-10 sm:h-auto font-bold">Cancelar</Button>
                <Button onClick={handleAddService} className="sm:flex-1 bg-brand hover:brightness-110 shadow-lg shadow-brand/20 h-10 sm:h-auto text-xs font-black uppercase tracking-widest text-white">Criar Agendamento</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Edit Floating Modal */}
      <AnimatePresence>
        {quickEditData && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 no-export"
            onClick={() => setQuickEditData(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-brand/40 shadow-2xl rounded-3xl p-5 sm:p-7 w-full max-w-lg space-y-6 my-auto text-text-main relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand/20 overflow-hidden border border-brand/40 flex items-center justify-center shrink-0 shadow-md">
                    <CachedAvatar 
                      photoUrl={quickEditData.member.photoUrl} 
                      alt={quickEditData.member.name}
                      className="w-full h-full"
                      fallbackText={quickEditData.member.name}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-brand bg-brand/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-brand/20">
                        <Zap size={10} className="fill-brand" /> Edição Rápida de Escala
                      </span>
                    </div>
                    <h3 className="text-base sm:text-xl font-black text-text-main leading-tight truncate">{quickEditData.member.name}</h3>
                    <p className="text-xs text-text-muted font-bold truncate">{quickEditData.service.title}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setQuickEditData(null)}
                  className="p-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 text-text-main transition-colors cursor-pointer shrink-0"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Roles Toggle */}
              <div>
                <label className="text-[10px] font-black text-text-main uppercase tracking-widest block mb-1">
                  Alternar Funções na Escala
                </label>
                <p className="text-xs text-text-muted mb-3 font-medium">
                  Clique para adicionar ou remover {quickEditData.member.name.split(' ')[0]} das funções deste culto:
                </p>
                <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto p-1 custom-scrollbar">
                  {[...roles, 'Professor Babies', 'Professor Kids'].map(role => {
                    const isAssigned = quickEditData.assignedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleToggleRoleQuickly(role)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shadow-sm",
                          isAssigned
                            ? "bg-brand text-white border-brand shadow-brand/20 scale-102 font-black"
                            : "bg-black/5 dark:bg-white/5 text-text-main border-border hover:bg-black/10 dark:hover:bg-white/10"
                        )}
                      >
                        {isAssigned ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Swap Member */}
              <div className="pt-4 border-t border-border/60">
                <label className="text-[10px] font-black text-text-main uppercase tracking-widest block mb-1">
                  Substituição Rápida de Integrante
                </label>
                <p className="text-xs text-text-muted mb-2 font-medium">
                  Substitua {quickEditData.member.name.split(' ')[0]} por outro voluntário em todas as funções ativas:
                </p>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSwapMemberQuickly(e.target.value);
                    }
                  }}
                  defaultValue=""
                  className="w-full bg-black/5 dark:bg-white/5 border border-border text-text-main rounded-xl p-3 text-xs font-bold outline-none cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <option value="" disabled className="bg-surface text-text-main">Selecione quem vai assumir as funções...</option>
                  {members
                    .filter(m => m.id !== quickEditData.member.id)
                    .map(m => (
                      <option key={m.id} value={m.id} className="bg-surface text-text-main">
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleRemoveMemberQuickly}
                  className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} /> Remover da Escala
                </button>

                <button
                  type="button"
                  onClick={() => setQuickEditData(null)}
                  className="px-5 py-2.5 rounded-xl bg-brand text-white font-black text-xs uppercase tracking-wider hover:bg-brand/90 transition-all cursor-pointer shadow-md shadow-brand/20"
                >
                  Concluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Edit Toast Notification */}
      <AnimatePresence>
        {quickToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[120] bg-emerald-600 text-white font-black text-xs sm:text-sm px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-emerald-400/40"
          >
            <Zap size={18} className="fill-white shrink-0 animate-bounce" />
            <span>{quickToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MembersView() {
  const { user, isAdmin } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [newMember, setNewMember] = useState({ name: '', email: '', whatsapp: '', roles: [] as string[], photoUrl: '', birthDate: '' });
  const [isMemberCameraActive, setIsMemberCameraActive] = useState(false);
  const rolesList = ['Vocal Principal', 'Backing Vocal', 'Violão', 'Guitarra', 'Baixo', 'Bateria', 'Teclado', 'Percussão', 'Operador de áudio', 'Mídia', 'Projeção', 'Professor Kids', 'Professor Babies'];

  useEffect(() => {
    if (!user) return;
    const memberPath = 'members';
    return onSnapshot(collection(db, memberPath), (snap) => {
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, memberPath);
    });
  }, [user]);

  const isMaster = user?.email === 'mikmellorg@gmail.com';

  const toggleAdmin = async (member: any) => {
    if (!isMaster) return;
    
    const memberPath = `members/${member.id}`;
    const adminPath = `admins/${member.id}`;
    const newStatus = !member.isAdmin;
    
    try {
      // Update member document
      await updateDoc(doc(db, 'members', member.id), { isAdmin: newStatus });
      
      // Update admins collection for rules lookup
      if (newStatus) {
        await setDoc(doc(db, 'admins', member.id), {
          email: member.email,
          assignedAt: serverTimestamp()
        });
      } else {
        await deleteDoc(doc(db, 'admins', member.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, memberPath);
    }
  };

  const handleSaveMember = async () => {
    if (!newMember.name) return;
    
    if (editingMember) {
      const memberPath = `members/${editingMember.id}`;
      try {
        await updateDoc(doc(db, 'members', editingMember.id), {
          name: newMember.name,
          email: newMember.email,
          whatsapp: newMember.whatsapp,
          roles: newMember.roles,
          photoUrl: newMember.photoUrl || '',
          birthDate: newMember.birthDate || ''
        });
        setEditingMember(null);
        setIsAdding(false);
        setNewMember({ name: '', email: '', whatsapp: '', roles: [], photoUrl: '', birthDate: '' });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, memberPath);
      }
    } else {
      // Generate a pseudo-uid if it's manual
      const manualUid = `manual_${Date.now()}`;
      const memberPath = `members/${manualUid}`;
      try {
        await setDoc(doc(db, 'members', manualUid), {
          ...newMember,
          birthDate: newMember.birthDate || '',
          uid: manualUid,
          availability: {}
        });
        setIsAdding(false);
        setNewMember({ name: '', email: '', whatsapp: '', roles: [], photoUrl: '', birthDate: '' });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, memberPath);
      }
    }
  };

  const startEdit = (member: any) => {
    setEditingMember(member);
    setNewMember({
      name: member.name || '',
      email: member.email || '',
      whatsapp: member.whatsapp || '',
      roles: member.roles || [],
      photoUrl: member.photoUrl || '',
      birthDate: member.birthDate || ''
    });
    setIsAdding(true);
  };

  const toggleRole = async (member: any, role: string) => {
    const memberPath = `members/${member.id}`;
    try {
      const roles = member.roles || [];
      const newRoles = roles.includes(role) ? roles.filter((r: any) => r !== role) : [...roles, role];
      await updateDoc(doc(db, 'members', member.id), { roles: newRoles });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, memberPath);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col items-center justify-center text-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-main tracking-tight">Membros</h1>
          <p className="text-text-main text-sm font-medium">Gerencie os integrantes e suas funções ministeriais.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setIsAdding(true); setEditingMember(null); setNewMember({ name: '', email: '', whatsapp: '', roles: [], photoUrl: '', birthDate: '' }); }} className="px-6">
            <Plus size={18} /> Novo Membro
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        {members.map(member => (
          <Card key={member.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 border-border bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all group overflow-hidden">
            <div className="flex items-center gap-4 sm:gap-5">
               <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-brand/10 dark:bg-white/10 flex items-center justify-center text-text-main dark:text-white font-black text-2xl sm:text-3xl border border-border shadow-sm shrink-0 relative">
                 <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                   {member.photoUrl ? (
                     <img 
                       referrerPolicy="no-referrer"
                       src={member.photoUrl} 
                       alt={member.name} 
                       className="w-full h-full object-cover" 
                     />
                   ) : (
                     member.name?.[0]
                   )}
                 </div>
                 {member.isAdmin && (
                   <div className="absolute -top-1 -right-1 bg-brand text-white p-1 rounded-full border-2 border-surface shadow-lg z-10" title="Administrador">
                     <Settings size={10} className="animate-spin-slow" />
                   </div>
                 )}
               </div>
               <div className="min-w-0">
                 <div className="flex items-center gap-2">
                   <p className="font-black text-text-main text-base sm:text-lg tracking-tight leading-tight truncate">{member.name}</p>
                   {member.isAdmin && (
                     <span className="bg-brand/20 text-brand text-[9px] font-black px-1.5 py-0.5 rounded border border-brand/20 uppercase tracking-widest">Adm</span>
                   )}
                 </div>
                 <div className="flex flex-col gap-0.5 mt-0.5">
                   <p className="text-[10px] sm:text-xs text-text-main/80 font-medium truncate">{member.email || 'Sem e-mail'}</p>
                    {member.birthDate && (
                      <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-semibold truncate flex items-center gap-1">
                        <span>🎂</span>
                        <span>{formatBirthDate(member.birthDate)}</span>
                      </p>
                    )}
                   {member.whatsapp && (
                     <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium truncate flex items-center gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>
                       {member.whatsapp}
                     </p>
                   )}
                 </div>
               </div>
            </div>
            
            <div className="flex items-center gap-2 grow sm:grow-0 justify-end sm:justify-start">
                {isMaster && member.id !== user?.uid && (
                  <button 
                    onClick={() => toggleAdmin(member)}
                    className={cn(
                      "p-1 px-3 rounded-lg text-[10px] font-bold uppercase transition-all border shrink-0",
                      member.isAdmin 
                        ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20" 
                        : "bg-brand/10 text-brand border-brand/20 hover:bg-brand/20"
                    )}
                  >
                    {member.isAdmin ? "Remover ADM" : "Tornar ADM"}
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button 
                      onClick={() => startEdit(member)}
                      className="p-1 px-3 bg-brand/10 text-brand rounded-lg text-[10px] font-bold uppercase hover:bg-brand/20 transition-all border border-brand/20"
                    >
                      Editar
                    </button>
                    <ConfirmButton 
                      onConfirm={async () => { 
                        const memberPath = `members/${member.id}`;
                        try {
                          await deleteDoc(doc(db, 'members', member.id));
                        } catch (error) {
                          handleFirestoreError(error, OperationType.DELETE, memberPath);
                        }
                      }}
                      className="sm:hidden p-1 px-3 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-bold uppercase border border-red-500/10"
                    >
                      Excluir
                    </ConfirmButton>
                  </>
                )}
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 sm:max-w-md sm:justify-end items-center">
              {rolesList.map(role => (
                <button
                  key={role}
                  onClick={() => isAdmin && toggleRole(member, role)}
                  className={cn(
                    "px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase transition-all border tracking-tight",
                    member.roles?.includes(role) 
                      ? "bg-brand border-brand text-white shadow-lg shadow-brand/20" 
                      : "bg-black/5 dark:bg-white/5 border-border text-text-muted hover:border-brand/40 hover:text-text-main",
                    !isAdmin && "cursor-default"
                  )}
                >
                  {role}
                </button>
              ))}
              {isAdmin && (
                <ConfirmButton 
                  onConfirm={async () => { 
                    const memberPath = `members/${member.id}`;
                    try {
                      await deleteDoc(doc(db, 'members', member.id));
                    } catch (error) {
                      handleFirestoreError(error, OperationType.DELETE, memberPath);
                    }
                  }}
                  className="hidden sm:flex p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </ConfirmButton>
              )}
            </div>
          </Card>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl p-8 space-y-8 my-auto">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {editingMember ? 'Editar Membro' : 'Novo Integrante'}
                </h2>
                <button onClick={() => setIsAdding(false)} className="text-white/60 hover:text-white transition-colors"><X /></button>
              </div>
              
              <div className="space-y-5">
                {/* Photo URL Selector */}
                <div className="flex flex-col gap-4 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 relative">
                      {newMember.photoUrl ? (
                        <img 
                          referrerPolicy="no-referrer"
                          src={newMember.photoUrl} 
                          alt="Foto do integrante" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-black text-white/55">{newMember.name?.[0] || '?'}</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-white/60 uppercase tracking-widest pl-1">Escolher Predefinição</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'f1', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80' },
                          { id: 'm1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80' },
                          { id: 'mus1', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&h=150&q=80' },
                          { id: 'mus2', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=150&h=150&q=80' },
                          { id: 'key', url: 'https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=150&h=150&q=80' },
                          { id: 'drum', url: 'https://images.unsplash.com/photo-1510119635499-cbb51c65aaea?auto=format&fit=crop&w=150&h=150&q=80' }
                        ].map(preset => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setNewMember({ ...newMember, photoUrl: preset.url })}
                            className={cn(
                              "w-7 h-7 rounded-full overflow-hidden border transition-all hover:scale-105",
                              newMember.photoUrl === preset.url ? "border-brand ring-1 ring-brand" : "border-white/10"
                            )}
                          >
                            <img referrerPolicy="no-referrer" src={preset.url} className="w-full h-full object-cover" alt="Preset" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Drag and Drop & Camera selection grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full animate-fade-in">
                    <div 
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          try {
                            const base64 = await compressAndResizeImage(file);
                            setNewMember({ ...newMember, photoUrl: base64 });
                          } catch (err) {
                            console.error(err);
                            alert('Erro ao carregar a imagem. Tente outro arquivo.');
                          }
                        }
                      }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = async (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const base64 = await compressAndResizeImage(file);
                              setNewMember({ ...newMember, photoUrl: base64 });
                            } catch (err) {
                              console.error(err);
                              alert('Erro ao carregar a imagem. Tente outro arquivo.');
                            }
                          }
                        };
                        input.click();
                      }}
                      className="border border-dashed border-white/20 hover:border-brand/60 bg-white/5 rounded-2xl p-3 px-4 transition-all duration-200 flex flex-col items-center justify-center text-center gap-1 cursor-pointer group active:scale-[0.98] min-h-[84px]"
                    >
                      <Upload size={16} className="text-white/40 group-hover:text-brand transition-colors animate-pulse" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-white group-hover:text-brand transition-colors">
                          Carregar Arquivo
                        </p>
                        <p className="text-[9px] text-white/50 leading-tight">
                          Arraste ou clique para buscar
                        </p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setIsMemberCameraActive(true)}
                      className="border border-dashed border-white/20 hover:border-brand/60 bg-white/5 rounded-2xl p-3 px-4 transition-all duration-200 flex flex-col items-center justify-center text-center gap-1 cursor-pointer group active:scale-[0.98] min-h-[84px]"
                    >
                      <Camera size={16} className="text-white/40 group-hover:text-brand transition-colors" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-white group-hover:text-brand transition-colors">
                          Tirar Foto na Hora
                        </p>
                        <p className="text-[9px] text-white/50 leading-tight">
                          Usar a câmera do dispositivo
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <AnimatePresence>
                    {isMemberCameraActive && (
                      <CameraCapture 
                        onCapture={(base64) => setNewMember({ ...newMember, photoUrl: base64 })} 
                        onClose={() => setIsMemberCameraActive(false)} 
                      />
                    )}
                  </AnimatePresence>
                  <label className="text-[10px] font-black text-white uppercase tracking-widest pl-1">Nome do Ministro</label>
                  <Input placeholder="Ex: João da Silva" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="bg-white/5 border-white/10 text-white h-12" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest pl-1">E-mail de Contato</label>
                  <Input type="email" placeholder="Ex: joao@email.com" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="bg-white/5 border-white/10 text-white h-12" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest pl-1">WhatsApp</label>
                  <Input placeholder="Ex: (11) 98765-4321" value={newMember.whatsapp} onChange={e => setNewMember({...newMember, whatsapp: e.target.value})} className="bg-white/5 border-white/10 text-white h-12" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest pl-1">Data de Nascimento (Opcional)</label>
                  <EasyBirthDatePicker value={newMember.birthDate || ''} onChange={val => setNewMember({...newMember, birthDate: val})} variant="dark" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="ghost" onClick={() => setIsAdding(false)} className="flex-1 text-white hover:bg-white/5 border border-white/10">Sair</Button>
                <Button onClick={handleSaveMember} className="flex-1 bg-brand hover:brightness-110 shadow-lg shadow-brand/20">
                  {editingMember ? 'Salvar Edição' : 'Salvar Membro'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LocalThemeStyleOverride({ themeColor, customBrandColor }: { themeColor: string; customBrandColor: string }) {
  let activeTheme = COLOR_PRESETS[themeColor];
  
  if (themeColor === 'custom' && customBrandColor) {
    activeTheme = {
      name: "Customizado",
      brandDark: customBrandColor,
      brandLight: customBrandColor,
      primary: customBrandColor,
      accent: customBrandColor,
      surfaceDark: "#0b0f19",
      surfaceLight: "#ffffff"
    };
  } else if (!activeTheme) {
    activeTheme = COLOR_PRESETS.navy;
  }
  
  const brandDarkText = getContrastColor(activeTheme.brandDark);
  const brandLightText = getContrastColor(activeTheme.brandLight);
  
  const styleContent = `
    :root {
      --primary: ${activeTheme.primary} !important;
      --brand: ${activeTheme.brandDark} !important;
      --brand-text: ${brandDarkText} !important;
      --accent: ${activeTheme.accent} !important;
      --surface: ${activeTheme.surfaceDark} !important;
    }
    .light {
      --primary: ${activeTheme.primary} !important;
      --brand: ${activeTheme.brandLight} !important;
      --brand-text: ${brandLightText} !important;
      --accent: ${activeTheme.accent} !important;
      --surface: ${activeTheme.surfaceLight} !important;
    }
  `;
  
  return <style dangerouslySetInnerHTML={{ __html: styleContent }} />;
}

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initCamera() {
      setIsInitializing(true);
      setError(null);
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);

        const constraints: MediaStreamConstraints = {
          video: selectedCameraId 
            ? { deviceId: { exact: selectedCameraId } } 
            : { facingMode: 'user' }
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        if (!selectedCameraId && videoDevices.length > 0) {
          const tracks = mediaStream.getVideoTracks();
          if (tracks.length > 0) {
            const currentSettings = tracks[0].getSettings();
            if (currentSettings.deviceId) {
              setSelectedCameraId(currentSettings.deviceId);
            }
          }
        }
      } catch (err: any) {
        console.error('Erro de câmera: ', err);
        setError(
          err.name === 'NotAllowedError' 
            ? 'Acesso à câmera negado. Por favor, libere a permissão no seu navegador.' 
            : 'FALHA: Câmera indisponível ou já em uso.'
        );
      } finally {
        setIsInitializing(false);
      }
    }

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedCameraId]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    const canvas = document.createElement('canvas');
    const size = 180;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const videoWidth = video.videoWidth || size;
      const videoHeight = video.videoHeight || size;
      const minDimension = Math.min(videoWidth, videoHeight);
      
      const sx = (videoWidth - minDimension) / 2;
      const sy = (videoHeight - minDimension) / 2;
      
      ctx.drawImage(
        video,
        sx, sy, minDimension, minDimension,
        0, 0, size, size
      );
      
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      onCapture(base64);
      onClose();
    }
  };

  const toggleCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].deviceId);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-950 border border-white/10 rounded-3xl p-6 w-full max-w-sm flex flex-col gap-5 text-white relative shadow-2xl overflow-hidden"
      >
        <button 
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-25"
        >
          <X size={16} />
        </button>

        <div className="text-center space-y-1 mt-2">
          <h4 className="text-sm font-black uppercase tracking-widest text-brand">Tirar Foto do Aparelho</h4>
          <p className="text-[10px] text-zinc-400">Posicione seu rosto ou instrumento no centro da marcação circular</p>
        </div>

        <div className="relative aspect-square w-full rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden flex items-center justify-center">
          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900 z-10">
              <RefreshCcw size={24} className="animate-spin text-brand" />
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Iniciando câmera...</p>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center gap-3 bg-zinc-950 z-10">
              <AlertTriangle size={32} className="text-amber-500" />
              <p className="text-xs font-semibold text-zinc-300 leading-relaxed">{error}</p>
              <button 
                onClick={onClose}
                type="button"
                className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-[10px] uppercase font-black tracking-widest rounded-full"
              >
                Voltar
              </button>
            </div>
          ) : (
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          )}

          {!error && !isInitializing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-2 border-brand/50 border-dashed animate-pulse ring-8 ring-black/50" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 justify-center">
          {cameras.length > 1 && (
            <button
              onClick={toggleCamera}
              type="button"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 text-zinc-300"
              title="Trocar Câmera"
            >
              <RefreshCcw size={12} />
              Alternar Câmera
            </button>
          )}

          {!error && !isInitializing && (
            <button
              onClick={handleCapture}
              type="button"
              className="px-6 py-2.5 bg-brand hover:bg-brand/90 text-brand-text font-black rounded-full transition-all text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-brand/20 active:scale-95"
            >
              <Camera size={14} />
              Capturar Foto
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SettingsView({ theme, onThemeChange, isAdmin, allMembers, onReplaySplash, onTriggerNotification }: { 
  theme: 'dark' | 'light', 
  onThemeChange: (t: 'dark' | 'light') => void,
  isAdmin: boolean,
  allMembers?: any[],
  onReplaySplash?: () => void,
  onTriggerNotification?: (n: any) => void
}) {
  const { user, memberData, churchData } = useAuth();
  const [churchCodeInput, setChurchCodeInput] = useState('');
  const [newChurchName, setNewChurchName] = useState('');
  const [isJoiningChurch, setIsJoiningChurch] = useState(false);
  const [isCreatingChurch, setIsCreatingChurch] = useState(false);
  const [section, setSection] = useState<'general' | 'reports'>('general');

  // Local Branding Preview state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFitPreview, setLogoFitPreview] = useState<'cover' | 'contain'>('contain');
  const [logoPaddingPreview, setLogoPaddingPreview] = useState<string>('p-1');
  const [logoBgPreview, setLogoBgPreview] = useState<string>('transparent');
  const [logoBgCustomColorPreview, setLogoBgCustomColorPreview] = useState<string>('#ffffff');
  const [logoRadiusPreview, setLogoRadiusPreview] = useState<string>('rounded-xl');
  const [themeColorPreview, setThemeColorPreview] = useState<string>('navy');
  const [customBrandColorPreview, setCustomBrandColorPreview] = useState<string>('#2ba9b8');
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [previewDeviceMode, setPreviewDeviceMode] = useState<'mobile' | 'web'>('mobile');
  const [unreadBadgeCount, setUnreadBadgeCount] = useState<number>(1);
  const [showSettingsInstallModal, setShowSettingsInstallModal] = useState<boolean>(false);

  useEffect(() => {
    if (churchData) {
      setLogoPreview(churchData.logoUrl || null);
      setLogoFitPreview(churchData.logoFit || 'contain');
      setLogoPaddingPreview(churchData.logoPadding || 'p-1');
      setLogoBgPreview(churchData.logoBg || 'transparent');
      setLogoBgCustomColorPreview(churchData.logoBgCustomColor || '#ffffff');
      setLogoRadiusPreview(churchData.logoRadius || 'rounded-xl');
      setThemeColorPreview(churchData.themeColor || 'navy');
      setCustomBrandColorPreview(churchData.customBrandColor || '#2ba9b8');
    }
  }, [churchData]);

  const handleJoinChurchByCode = async () => {
    const code = churchCodeInput.trim().toUpperCase();
    if (!code || !user) return;
    setIsJoiningChurch(true);
    try {
      const q = query(collection(db, 'churches'), where('inviteCode', '==', code));
      const querySnap = await getDocs(q);
      if (querySnap.empty) {
        alert("Código de ingresso não localizado ou inválido.");
        setIsJoiningChurch(false);
        return;
      }
      const churchDoc = querySnap.docs[0];
      const churchId = churchDoc.id;
      
      // Update user member profile
      const memberRef = doc(db, 'members', user.uid);
      await updateDoc(memberRef, {
        churchId: churchId,
        isAdmin: false // Joined members are volunteers by default
      });
      
      alert(`Você entrou com sucesso na igreja: ${churchDoc.data().name}!`);
      setChurchCodeInput('');
    } catch (err) {
      console.error(err);
      alert("Falha ao entrar na igreja de destino.");
    } finally {
      setIsJoiningChurch(false);
    }
  };

  const handleCreateNewChurch = async () => {
    const name = newChurchName.trim();
    if (!name || !user) return;
    setIsCreatingChurch(true);
    try {
      // Create random code
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const inviteCode = `IGREJA-${randomSuffix}`;
      const churchId = `igreja_${Date.now()}`;
      
      const churchRef = doc(db, 'churches', churchId);
      await setDoc(churchRef, {
        name,
        inviteCode,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      
      // Update member roles and churchId
      const memberRef = doc(db, 'members', user.uid);
      await updateDoc(memberRef, {
        churchId: churchId,
        isAdmin: true
      });
      
      alert(`Igreja "${name}" criada com sucesso! Código de ingresso: ${inviteCode}`);
      setNewChurchName('');
    } catch (err) {
      console.error(err);
      alert("Falha ao criar nova igreja.");
    } finally {
      setIsCreatingChurch(false);
    }
  };
  const [pwaGuideTab, setPwaGuideTab] = useState<'android' | 'ios'>('android');
  const [testCountdown, setTestCountdown] = useState<number | null>(null);
  const [isTestingBadge, setIsTestingBadge] = useState(false);
  const testIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (testIntervalRef.current) {
        clearInterval(testIntervalRef.current);
      }
    };
  }, []);

  const triggerTestNotification = () => {
    setUnreadBadgeCount(prev => prev + 1);
    // 1. Update app icon badge if browser supports it
    if ('setAppBadge' in navigator) {
      (navigator as any).setAppBadge(3).catch(() => {});
    }

    const notifObj = {
      id: 'test-pwa-' + Date.now(),
      title: '💬 LiLouPro • Escala do Culto',
      content: 'Você foi escalado para o próximo culto de domingo! Toque aqui para visualizar sua escala e o repertório completo.',
      type: 'service'
    };

    if (onTriggerNotification) {
      onTriggerNotification(notifObj);
    } else {
      // Audio Chime
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') ctx.resume();
          const now = ctx.currentTime;
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(659.25, now);
          gain1.gain.setValueAtTime(0, now);
          gain1.gain.linearRampToValueAtTime(0.3, now + 0.01);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.22);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(783.99, now + 0.08);
          gain2.gain.setValueAtTime(0, now + 0.08);
          gain2.gain.linearRampToValueAtTime(0.4, now + 0.09);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.08);
          osc2.stop(now + 0.45);
        }
      } catch (e) {}

      // Vibration
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200, 100, 200, 100, 400]);
        } catch (e) {}
      }

      // Native Notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notifObj.title, { body: notifObj.content, icon: luxuryAppIcon });
        } catch (e) {}
      }
    }

    setIsTestingBadge(false);
    setTestCountdown(null);
  };

  const handleScheduleTestNotification = async () => {
    // Request permission asynchronously if supported, without blocking or throwing errors in iframe preview
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      } catch (err) {
        console.warn("Notification permission request inside iframe or restricted environment:", err);
      }
    }

    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
    }

    setTestCountdown(5);
    setIsTestingBadge(true);

    const interval = setInterval(() => {
      setTestCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          testIntervalRef.current = null;
          triggerTestNotification();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    testIntervalRef.current = interval;
  };

  const handleClearTestBadge = () => {
    setUnreadBadgeCount(0);
    if ('clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge()
        .then(() => {
          alert("Badge do ícone limpa com sucesso!");
        })
        .catch((err: any) => {
          console.error("Erro ao limpar badge:", err);
        });
    } else {
      alert("Seu dispositivo ou navegador atual não suporta a API de Badges ou não está no modo PWA.");
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState(user?.displayName || '');
  const [userPhotoUrl, setUserPhotoUrl] = useState('');
  const [userBirthDate, setUserBirthDate] = useState('');
  const [defaultBibleVersion, setDefaultBibleVersion] = useState('NAA');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPhone2, setAdminPhone2] = useState('');
  const [adminPhone3, setAdminPhone3] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminEmail2, setAdminEmail2] = useState('');
  const [adminEmail3, setAdminEmail3] = useState('');
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert("Seu navegador ou celular não suporta notificações do sistema.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        // Obter e registrar token FCM imediatamente
        try {
          const tok = await requestFcmToken();
          if (tok) {
            console.log('[FCM] Token registrado com sucesso via Ajustes:', tok.slice(0, 10) + '...');
          }
        } catch (fcmErr) {
          console.warn('[FCM] Registro do token falhou:', fcmErr);
        }
        alert("Excelente! Notificações nativas autorizadas no seu aparelho. Agora o aplicativo está pronto para receber avisos e atualizar o ícone sempre que houver novidades.");
      } else if (permission === 'denied') {
        alert("O recebimento de notificações foi silenciado. Para receber avisos importantes, permita as notificações nas configurações do seu celular ou navegador.");
      }
    } catch (err) {
      console.error("Erro ao solicitar permissão de notificações:", err);
    }
  };

  const currentMember = allMembers?.find(m => m.id === user?.uid || m.uid === user?.uid);
  const hasInitializedSettingsRef = useRef(false);

  useEffect(() => {
    hasInitializedSettingsRef.current = false;
  }, [user]);

  useEffect(() => {
    if (currentMember && !hasInitializedSettingsRef.current) {
      if (currentMember.photoUrl) {
        setUserPhotoUrl(currentMember.photoUrl);
      } else {
        setUserPhotoUrl('');
      }
      if (currentMember.name) {
        setUserName(currentMember.name);
      }
      if (currentMember.birthDate) {
        setUserBirthDate(currentMember.birthDate);
      }
      if (currentMember.defaultBibleVersion) {
        setDefaultBibleVersion(currentMember.defaultBibleVersion);
      }
      hasInitializedSettingsRef.current = true;
    }
  }, [currentMember]);

  const handleTogglePreference = async (key: 'notifyDayBeforeReminder' | 'notifyNewSongs' | 'notifyScheduleChanges' | 'notifyNewLiturgy') => {
    if (!user) return;
    const currentVal = currentMember?.[key] !== false; // defaults to true
    try {
      await updateDoc(doc(db, 'members', user.uid), {
        [key]: !currentVal
      });
    } catch (error) {
      console.error(`Erro ao atualizar preferência ${key}:`, error);
      alert("Não foi possível salvar sua preferência de notificação.");
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(doc(db, 'settings', 'notifications'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAdminPhone(data.whatsappAdmin || '');
        setAdminPhone2(data.whatsappAdmin2 || '');
        setAdminPhone3(data.whatsappAdmin3 || '');
        setAdminEmail(data.adminEmail || '');
        setAdminEmail2(data.adminEmail2 || '');
        setAdminEmail3(data.adminEmail3 || '');
        setWhatsappGroupLink(data.whatsappGroupLink || '');
      }
    });
    return () => unsub();
  }, [isAdmin]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'members', user.uid), { 
        name: userName,
        photoUrl: userPhotoUrl,
        birthDate: userBirthDate,
        defaultBibleVersion: defaultBibleVersion
      });
      await updateProfile(user, { displayName: userName });
      hasInitializedSettingsRef.current = false; // allow reloading newest settings values
      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePhone = async () => {
    setIsSavingPhone(true);
    try {
      await setDoc(doc(db, 'settings', 'notifications'), {
        whatsappAdmin: adminPhone,
        whatsappAdmin2: adminPhone2,
        whatsappAdmin3: adminPhone3,
        adminEmail: adminEmail,
        adminEmail2: adminEmail2,
        adminEmail3: adminEmail3,
        whatsappGroupLink: whatsappGroupLink,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("Configurações administrativas de WhatsApp e E-mail salvas com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar configurações.");
    } finally {
      setIsSavingPhone(false);
    }
  };

  const checkForUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const result = await forceCheckForAppUpdates();
      setIsCheckingUpdate(false);
      alert(result.message);
    } catch (err) {
      setIsCheckingUpdate(false);
      console.error('Erro ao buscar atualizações:', err);
      alert('Não foi possível verificar atualizações no momento.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-32">
       <div className="flex justify-between items-end">
         <div>
           <h1 className="text-3xl font-black text-text-main tracking-tight">Configurações</h1>
           <p className="text-text-muted text-sm">Personalize sua experiência no aplicativo.</p>
         </div>
         <div className="bg-brand/10 text-brand px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand/20 shadow-sm">
           LiLouPro - v2.6.0
         </div>
       </div>

       {isAdmin && (
         <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-border/80 w-fit max-w-full overflow-x-auto gap-1">
           <button
             onClick={() => setSection('general')}
             className={cn(
               "px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
               section === 'general'
                 ? "bg-brand text-brand-text shadow-md shadow-brand/20"
                 : "text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5"
             )}
           >
             <Settings size={14} />
             Ajustes Gerais
           </button>
           <button
             onClick={() => setSection('reports')}
             className={cn(
               "px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
               section === 'reports'
                 ? "bg-brand text-brand-text shadow-md shadow-brand/20"
                 : "text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5"
             )}
           >
             <Activity size={14} />
             Relatórios
           </button>
         </div>
       )}

       {section === 'general' ? (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LocalThemeStyleOverride 
              themeColor={themeColorPreview} 
              customBrandColor={customBrandColorPreview} 
            />
           {/* Notification Preferences Card */}
            <Card className="p-8 space-y-6">
               <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                 <Bell size={14} className="text-brand" /> Preferências de Notificação
               </h3>
               <p className="text-xs text-text-muted leading-relaxed">
                 Personalize quais tipos de notificações você deseja receber neste aplicativo.
               </p>

               {/* Status das Notificações do Sistema / Native PWA System Notifications Setup */}
                <div className="p-4 rounded-xl border border-border bg-black/5 dark:bg-white/5 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-[10px] uppercase font-black tracking-widest text-text-main">
                      Notificações no Celular (Push)
                    </p>
                    
                    {notificationPermission === 'granted' ? (
                      <div className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-500 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Permissão Ativa
                      </div>
                    ) : notificationPermission === 'denied' ? (
                      <div className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-500 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Bloqueado no Navegador
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Aguardando Ativação
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Receba notificações e avisos de escalas mesmo quando o aplicativo estiver totalmente fechado ou com a tela do celular desligada.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <Button
                      onClick={async () => {
                        try {
                          const perm = await Notification.requestPermission();
                          setNotificationPermission(perm);
                          const tok = await requestFcmToken();
                          if (tok) {
                            alert("✅ Notificações Ativadas! Token de Push gerado e salvo com sucesso no Firebase.");
                          } else {
                            alert("✅ Permissão solicitada (" + perm + "). No celular, toque no botão verde ao lado para testar a notificação com a tela desligada!");
                          }
                        } catch (e: any) {
                          alert("Aviso: " + (e?.message || String(e)));
                        }
                      }}
                      className="bg-brand hover:brightness-110 text-white font-black text-[10px] uppercase tracking-wider h-10 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-brand/20 cursor-pointer"
                    >
                      <Bell size={14} />
                      <span>{notificationPermission === 'granted' ? '🔄 Atualizar Token' : '🔔 Ativar Permissão'}</span>
                    </Button>

                    <Button
                      onClick={async () => {
                        try {
                          let perm = notificationPermission;
                          if (perm !== 'granted') {
                            perm = await Notification.requestPermission();
                            setNotificationPermission(perm);
                          }
                          
                          if (perm !== 'granted') {
                            alert("⚠️ A permissão de notificações não foi concedida nas configurações do seu navegador.");
                            return;
                          }

                          // 1. Agenda disparo direto no Service Worker (roda em background mesmo com tela desligada)
                          await scheduleServiceWorkerNotification({
                            delayMs: 4000,
                            title: "LiLouPro • Notificação no Celular",
                            body: "🎉 Teste de segundo plano com celular fechado funcionando com sucesso!",
                            url: "/"
                          });

                          // 2. Dispara também via servidor se houver token FCM ativo
                          requestFcmToken().then(tok => {
                            if (tok) {
                              setTimeout(() => {
                                sendPushNotification({
                                  tokens: [tok],
                                  title: "LiLouPro • Notificação",
                                  body: "🎉 Notificação remota FCM entregue com sucesso!",
                                  url: "/"
                                });
                              }, 4000);
                            }
                          }).catch(() => {});

                          alert("🚀 TESTE INICIADO!\n\nBLOQUEIE a tela do celular ou FECHE o aplicativo AGORA.\nEm 4 segundos a notificação vai tocar na tela!");
                        } catch (err: any) {
                          alert("Erro ao disparar teste: " + (err?.message || String(err)));
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider h-10 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <Sparkles size={14} />
                      <span>📲 Testar Celular Fechado (4s)</span>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/40">
                   <div className="space-y-0.5 max-w-[80%]">
                     <h4 className="text-xs font-black text-text-main uppercase tracking-wider">Lembretes de Escala</h4>
                     <p className="text-[10px] text-text-muted leading-tight">Receber lembrete automático 24 horas antes do início de um culto em que você estiver escalado.</p>
                   </div>
                   <button
                     onClick={() => handleTogglePreference('notifyDayBeforeReminder')}
                     className={cn(
                       "w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer outline-none",
                       currentMember?.notifyDayBeforeReminder !== false ? "bg-brand justify-end" : "bg-border dark:bg-zinc-700 justify-start"
                     )}
                   >
                     <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md cursor-pointer" />
                   </button>
                 </div>

                 <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/40">
                   <div className="space-y-0.5 max-w-[80%]">
                     <h4 className="text-xs font-black text-text-main uppercase tracking-wider">Novas Músicas</h4>
                     <p className="text-[10px] text-text-muted leading-tight">Ser notificado quando uma nova música for adicionada ao repertório do grupo de louvor.</p>
                   </div>
                   <button
                     onClick={() => handleTogglePreference('notifyNewSongs')}
                     className={cn(
                       "w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer outline-none",
                       currentMember?.notifyNewSongs !== false ? "bg-brand justify-end" : "bg-border dark:bg-zinc-700 justify-start"
                     )}
                   >
                     <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md cursor-pointer" />
                   </button>
                 </div>

                 <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/40">
                   <div className="space-y-0.5 max-w-[80%]">
                     <h4 className="text-xs font-black text-text-main uppercase tracking-wider">Alterações na Escala</h4>
                     <p className="text-[10px] text-text-muted leading-tight">Receber avisos sobre novos agendamentos, escalas e atualizações nos cultos.</p>
                   </div>
                   <button
                     onClick={() => handleTogglePreference('notifyScheduleChanges')}
                     className={cn(
                       "w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer outline-none",
                       currentMember?.notifyScheduleChanges !== false ? "bg-brand justify-end" : "bg-border dark:bg-zinc-700 justify-start"
                     )}
                   >
                     <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md cursor-pointer" />
                   </button>
                 </div>

                 <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/40">
                   <div className="space-y-0.5 max-w-[80%]">
                     <h4 className="text-xs font-black text-text-main uppercase tracking-wider">Nova Liturgia</h4>
                     <p className="text-[10px] text-text-muted leading-tight">Ser notificado quando uma nova liturgia for criada e salva pelo administrador.</p>
                   </div>
                   <button
                     onClick={() => handleTogglePreference('notifyNewLiturgy')}
                     className={cn(
                       "w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer outline-none",
                       currentMember?.notifyNewLiturgy !== false ? "bg-brand justify-end" : "bg-border dark:bg-zinc-700 justify-start"
                     )}
                   >
                     <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md cursor-pointer" />
                   </button>
                 </div>
               </div>
            </Card>

            {/* Sua Igreja / Organização (Multi-Igreja / Tenancy Isolation) */}
           <Card className="p-8 space-y-6">
              <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                <Home size={14} className="text-brand" /> Sua Igreja / Organização
              </h3>
              
              <div className="space-y-4">
                {churchData ? (
                  <div className="bg-brand/5 border border-brand/20 rounded-2xl p-4 space-y-2">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Igreja Ativa:</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-brand tracking-tight">{churchData.name}</p>
                      {isAdmin && (
                        <Button 
                          onClick={async () => {
                            const newName = window.prompt("Digite o novo nome para a sua igreja:", churchData.name);
                            if (newName && newName.trim()) {
                              try {
                                await updateDoc(doc(db, 'churches', churchData.id), {
                                  name: newName.trim()
                                });
                              } catch (err) {
                                console.error("Erro ao atualizar nome da congregação:", err);
                                alert("Não foi possível alterar o nome.");
                              }
                            }
                          }}
                          variant="ghost" 
                          className="h-7 text-[10px] text-text-muted hover:text-brand font-bold uppercase tracking-wider px-2"
                        >
                          Alterar Nome
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/50">
                      <span className="text-text-muted font-semibold uppercase tracking-wider text-[10px]">Código de Ingresso:</span>
                      <span className="p-1 px-2.5 bg-brand text-white font-mono text-[10px] font-black rounded-lg uppercase select-all tracking-wider font-bold">
                        {churchData.inviteCode}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-xs text-text-muted">
                    Nenhuma organização ativa encontrada para sua conta.
                  </div>
                )}

                {/* Multi-Igreja Controls */}
                <div className="space-y-3 pt-2">
                  {/* Entrar em uma igreja */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Entrar em outra Igreja</label>
                    <div className="flex gap-2">
                      <Input 
                        value={churchCodeInput}
                        onChange={e => setChurchCodeInput(e.target.value.toUpperCase())}
                        placeholder="CÓDIGO (ex: SEMENTE123)"
                        className="text-xs uppercase font-mono"
                      />
                      <Button 
                        onClick={handleJoinChurchByCode}
                        disabled={isJoiningChurch || !churchCodeInput.trim()}
                        variant="secondary"
                        className="shrink-0"
                      >
                        {isJoiningChurch ? <RefreshCcw size={14} className="animate-spin" /> : "Entrar"}
                      </Button>
                    </div>
                  </div>

                  {/* Criar uma igreja */}
                  {isAdmin && (
                    <div className="space-y-1.5 pt-2 border-t border-border/30">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Criar Nova Igreja (SaaS)</label>
                      <div className="space-y-2">
                        <Input 
                          value={newChurchName}
                          onChange={e => setNewChurchName(e.target.value)}
                          placeholder="Nome da Nova Igreja"
                          className="text-xs"
                         />
                        <Button 
                          onClick={handleCreateNewChurch}
                          disabled={isCreatingChurch || !newChurchName.trim()}
                          className="w-full text-xs"
                        >
                          {isCreatingChurch ? <RefreshCcw size={14} className="animate-spin" /> : "Criar Nova Organização"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
           </Card>

           {/* Compartilhar & Convidar pelo WhatsApp */}
           <Card className="p-8 space-y-6 bg-gradient-to-br from-green-500/10 via-brand/5 to-transparent border-green-500/20 shadow-lg shadow-green-500/5">
              <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                <Share2 size={14} className="text-green-500" strokeWidth={3} /> Compartilhar &amp; Convidar
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Convide músicos, cantores e lideranças para fazerem parte do {churchData ? `ministério de louvor da ${churchData.name}` : "Liloupro"}. Envie um link com convite pronto diretamente pelo WhatsApp!
              </p>
              
              <Button
                onClick={() => {
                  const churchSuffix = churchData 
                    ? ` no ministério de louvor da *${churchData.name}*` 
                    : '';
                  const codeSuffix = churchData 
                    ? `\n\nAo cadastrar sua conta, informe nosso código de ingresso:\n👉 *${churchData.inviteCode}*` 
                    : '';
                  const inviteMsg = `Olá! Quero te convidar para usar o app *Liloupro*${churchSuffix}! 🎵\n\nAbra o aplicativo por aqui:\n${window.location.origin}${codeSuffix}`;
                  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteMsg)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase tracking-widest h-11 gap-2 flex items-center justify-center rounded-xl shadow-lg shadow-green-600/20 transition-all select-none border border-green-500/10 cursor-pointer"
              >
                <Share2 size={15} strokeWidth={3} />
                Convidar via WhatsApp
              </Button>
           </Card>

            {/* Abertura do Aplicativo / Splash Intro */}
            <Card className="p-8 space-y-6 bg-gradient-to-br from-brand/10 via-violet-500/5 to-transparent border-brand/20 shadow-lg shadow-brand/5">
               <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                 <Sparkles size={14} className="text-brand animate-pulse" /> Abertura do Aplicativo (Splash Intro)
               </h3>
               <p className="text-xs text-text-muted leading-relaxed">
                 Assista à elegante animação de entrada com a formação das sílabas do <strong>Liloupro</strong>: <span className="text-brand font-black">LI</span>turgia, <span className="text-violet-400 font-black">LOU</span>vor e <span className="text-emerald-400 font-black">PRO</span>jeção.
               </p>
               
               <Button
                 onClick={() => {
                   try {
                     sessionStorage.removeItem('liloupro_splash_shown');
                   } catch (e) {}
                   if (onReplaySplash) {
                     onReplaySplash();
                   }
                 }}
                 className="w-full bg-brand hover:brightness-110 text-white font-black text-xs uppercase tracking-widest h-11 gap-2 flex items-center justify-center rounded-xl shadow-lg shadow-brand/20 transition-all select-none border border-brand/20 cursor-pointer"
               >
                 ✨ Reassistir Introdução Animada
               </Button>
            </Card>

            {/* Custom Church Branding Controls & Live Preview Cards */}
            {isAdmin && churchData && (
              <>
                <Card className="p-8 space-y-6">
                   <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                     <Sparkles size={14} className="text-brand animate-pulse" /> Identidade Visual & Cores
                   </h3>
                   <p className="text-xs text-text-muted leading-relaxed">
                     Personalize o aplicativo com a identidade visual da sua igreja! Altere as cores e o logotipo à esquerda e acompanhe o resultado em tempo real no painel de visualização ao lado.
                   </p>
                   
                   {/* Logo Upload Section */}
                   <div className="space-y-3 pt-2">
                     <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">
                       Logotipo / Foto da Igreja
                     </label>
                     
                     <div className="flex flex-col sm:flex-row items-center gap-4 bg-brand/5 border border-brand/20 p-4 rounded-2xl">
                       <div className={cn(
                          "w-16 h-16 shrink-0 border border-border/40 overflow-hidden relative flex items-center justify-center",
                          logoRadiusPreview === 'rounded-none' ? 'rounded-none' :
                          logoRadiusPreview === 'rounded-lg' ? 'rounded-lg' :
                          logoRadiusPreview === 'rounded-2xl' ? 'rounded-2xl' :
                          logoRadiusPreview === 'rounded-full' ? 'rounded-full' : 'rounded-xl',
                          logoBgPreview === 'white' ? 'bg-white' :
                          logoBgPreview === 'black' ? 'bg-zinc-950' :
                          logoBgPreview === 'theme' ? 'bg-brand/10' :
                          logoBgPreview === 'transparent' ? 'bg-transparent' : 'bg-surface'
                        )}
                        style={{
                          backgroundColor: (logoBgPreview === 'custom' && logoBgCustomColorPreview) ? logoBgCustomColorPreview : undefined
                        }}>
                         {logoPreview ? (
                           <img 
                             referrerPolicy="no-referrer"
                             src={logoPreview} 
                             className={cn(
                               "w-full h-full",
                               logoFitPreview === 'cover' ? "object-cover" : "object-contain",
                               logoPaddingPreview || "p-1"
                             )}
                             alt="Preview Logo" 
                           />
                         ) : (
                           <Music2 size={24} className="text-text-muted opacity-40" />
                         )}
                       </div>
                       <div className="flex-1 w-full text-center sm:text-left space-y-2">
                         <p className="text-xs font-bold text-text-main">Modificar Logo da Organização</p>
                         <p className="text-[10px] text-text-muted leading-relaxed">
                           Formato ideal: PNG transparente ou quadrado. Suporta arquivos de até 10MB (redimensionado automaticamente).
                         </p>
                         <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                           <label className="cursor-pointer bg-brand hover:bg-brand/80 text-brand-text font-black text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors shadow-sm select-none">
                             Selecionar Imagem
                             <input 
                               type="file" 
                               accept="image/*" 
                               className="hidden" 
                               onChange={async (e) => {
                                 const file = e.target.files?.[0];
                                 if (!file) return;
                                 if (file.size > 10 * 1024 * 1024) {
                                   alert("Por favor, selecione uma imagem de até 10MB.");
                                   return;
                                 }
                                 const reader = new FileReader();
                                 reader.onload = async (ev) => {
                                   const base64 = ev.target?.result as string;
                                   const img = new Image();
                                    img.onload = () => {
                                      const canvas = document.createElement('canvas');
                                      const MAX_WIDTH = 400;
                                      const MAX_HEIGHT = 400;
                                      let width = img.width;
                                      let height = img.height;

                                      if (width > height) {
                                        if (width > MAX_WIDTH) {
                                          height = Math.round((height * MAX_WIDTH) / width);
                                          width = MAX_WIDTH;
                                        }
                                      } else {
                                        if (height > MAX_HEIGHT) {
                                          width = Math.round((width * MAX_HEIGHT) / height);
                                          height = MAX_HEIGHT;
                                        }
                                      }

                                      canvas.width = width;
                                      canvas.height = height;

                                      const ctx = canvas.getContext('2d');
                                      if (ctx) {
                                        ctx.drawImage(img, 0, 0, width, height);
                                        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                                        const resizedBase64 = canvas.toDataURL(mimeType, 0.85);
                                        setLogoPreview(resizedBase64);
                                      } else {
                                        setLogoPreview(base64);
                                      }
                                    };
                                    img.src = base64;
                                 };
                                 reader.readAsDataURL(file);
                               }}
                             />
                           </label>
                           <button
                             type="button"
                             onClick={() => setLogoPreview(luxuryAppIcon)}
                             className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 font-black text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer select-none"
                           >
                             <Sparkles size={12} className="text-amber-500 shrink-0" />
                             Usar Ícone Luxo Ouro
                           </button>

                           {logoPreview && (
                             <Button 
                               onClick={() => setLogoPreview(null)}
                               variant="ghost" 
                               className="h-7 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10 font-bold uppercase tracking-wider select-none p-0 px-2"
                             >
                               Limpar Logo
                             </Button>
                           )}
                         </div>
                       </div>
                     </div>

                     {/* Logo Fit Selector Controls */}
                     {logoPreview && (
                       <div className="space-y-4 bg-brand/5 border border-brand/10 p-4 rounded-2xl">
                         <div>
                           <span className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1 block">
                             Ajuste de Exibição do Logo
                           </span>
                           <div className="grid grid-cols-2 gap-2 mt-1.5">
                             <button
                               type="button"
                               onClick={() => setLogoFitPreview('cover')}
                               className={cn(
                                 "flex flex-col items-center justify-center p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all select-none text-center",
                                 logoFitPreview === 'cover'
                                   ? "bg-brand text-brand-text border-brand shadow-sm"
                                   : "bg-surface text-text-main border-border hover:border-brand/40"
                               )}
                             >
                               <span>Preencher Totalmente</span>
                               <span className="text-[8px] font-medium text-text-muted mt-0.5 normal-case">Cortar bordas excedentes</span>
                             </button>
                             <button
                               type="button"
                               onClick={() => setLogoFitPreview('contain')}
                               className={cn(
                                 "flex flex-col items-center justify-center p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all select-none text-center",
                                 logoFitPreview === 'contain'
                                   ? "bg-brand text-brand-text border-brand shadow-sm"
                                   : "bg-surface text-text-main border-border hover:border-brand/40"
                               )}
                             >
                               <span>Contido / Centralizado</span>
                               <span className="text-[8px] font-medium text-text-muted mt-0.5 normal-case">Preservar logo completo</span>
                             </button>
                           </div>
                         </div>

                         {/* Margem Interna (Padding) */}
                         <div className="space-y-1.5">
                           <span className="text-[9px] font-black text-text-muted uppercase tracking-widest pl-1 block">
                             Margem de Segurança (Espaçamento Interno)
                           </span>
                           <div className="grid grid-cols-4 gap-1.5">
                             {[
                               { id: 'p-0', label: 'Nenhum' },
                               { id: 'p-1', label: 'Pequeno' },
                               { id: 'p-2', label: 'Médio' },
                               { id: 'p-3', label: 'Grande' }
                             ].map((pad) => (
                               <button
                                 key={pad.id}
                                 type="button"
                                 onClick={() => setLogoPaddingPreview(pad.id)}
                                 className={cn(
                                   "p-1.5 text-[9px] font-black rounded-lg border uppercase transition-all select-none text-center",
                                   logoPaddingPreview === pad.id
                                     ? "bg-brand/20 text-brand border-brand"
                                     : "bg-surface text-text-main border-border hover:border-brand/35"
                                 )}
                               >
                                 {pad.label}
                               </button>
                             ))}
                           </div>
                           <p className="text-[8px] text-text-muted">Ótimo para dar margem a logos pretos/brancos com o nome da igreja perto das bordas.</p>
                         </div>

                         {/* Cor de Fundo da Caixa */}
                         <div className="space-y-1.5">
                           <span className="text-[9px] font-black text-text-muted uppercase tracking-widest pl-1 block">
                             Fundo da Caixa do Logo
                           </span>
                           <div className="grid grid-cols-5 gap-1">
                             {[
                               { id: 'transparent', label: 'Transp.' },
                               { id: 'white', label: 'Branco' },
                               { id: 'black', label: 'Escuro' },
                               { id: 'theme', label: 'Tema' },
                               { id: 'custom', label: 'Personal.' }
                             ].map((bgItem) => (
                               <button
                                 key={bgItem.id}
                                 type="button"
                                 onClick={() => setLogoBgPreview(bgItem.id)}
                                 className={cn(
                                   "p-1 text-[8px] font-black rounded-lg border uppercase transition-all select-none text-center truncate",
                                   logoBgPreview === bgItem.id
                                     ? "bg-brand/20 text-brand border-brand"
                                     : "bg-surface text-text-main border-border hover:border-brand/35"
                                 )}
                               >
                                 {bgItem.label}
                               </button>
                             ))}
                           </div>
                           {logoBgPreview === 'custom' && (
                             <div className="flex items-center gap-2 mt-2 bg-surface p-2 rounded-xl border border-border">
                               <span className="text-[8px] font-black tracking-widest text-text-muted uppercase">Definir Cor:</span>
                               <input 
                                 type="color" 
                                 value={logoBgCustomColorPreview} 
                                 onChange={e => setLogoBgCustomColorPreview(e.target.value)}
                                 className="w-8 h-5 rounded cursor-pointer border-0 bg-transparent shrink-0"
                                />
                               <span className="text-[10px] font-mono text-text-main uppercase">{logoBgCustomColorPreview}</span>
                             </div>
                           )}
                           <p className="text-[8px] text-text-muted">Selecione "Branco" ou uma cor personalizada se seu logo tiver fundo branco.</p>
                         </div>

                         {/* Arredondamento dos Cantos */}
                         <div className="space-y-1.5">
                           <span className="text-[9px] font-black text-text-muted uppercase tracking-widest pl-1 block">
                             Formato dos Cantos (Arredondamento)
                           </span>
                           <div className="grid grid-cols-5 gap-1">
                             {[
                               { id: 'rounded-none', label: 'Quadrado' },
                               { id: 'rounded-lg', label: 'Pequeno' },
                               { id: 'rounded-xl', label: 'Padrão' },
                               { id: 'rounded-2xl', label: 'Grande' },
                               { id: 'rounded-full', label: 'Círculo' }
                             ].map((rad) => (
                               <button
                                 key={rad.id}
                                 type="button"
                                 onClick={() => setLogoRadiusPreview(rad.id)}
                                 className={cn(
                                   "p-1 text-[8px] font-black rounded-lg border uppercase transition-all select-none text-center truncate",
                                   logoRadiusPreview === rad.id
                                     ? "bg-brand/20 text-brand border-brand"
                                     : "bg-surface text-text-main border-border hover:border-brand/35"
                                 )}
                               >
                                 {rad.label}
                               </button>
                             ))}
                           </div>
                           <p className="text-[8px] text-text-muted">Cantos retos evitam o corte de nomes nas quinas do logo.</p>
                         </div>
                       </div>
                     )}
                   </div>

                   {/* Color Customization Section */}
                   <div className="space-y-4 pt-3 border-t border-border/30">
                     <div>
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">
                         Paleta de Cores
                       </label>
                       <p className="text-[10px] text-text-muted mt-1">
                         Escolha um de nossos temas ou selecione uma cor personalizada.
                       </p>
                     </div>

                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                       {Object.entries(COLOR_PRESETS).map(([key, preset]) => {
                         const isActive = themeColorPreview === key;
                         return (
                           <button
                             type="button"
                             key={key}
                             onClick={() => setThemeColorPreview(key)}
                             className={cn(
                               "relative p-3 rounded-xl border text-left transition-all hover:scale-102 flex flex-col gap-2 bg-surface select-none",
                               isActive 
                                 ? "border-brand ring-2 ring-brand/20 shadow-md shadow-brand/10"
                                 : "border-border hover:border-brand/40"
                             )}
                           >
                             <div className="flex gap-1">
                               <span className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: preset.brandDark }} />
                               <span className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: preset.primary }} />
                               <span className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: preset.surfaceDark }} />
                             </div>
                             <span className="text-[10px] font-black truncate text-text-main uppercase tracking-wider leading-none">
                               {preset.name.split(' (')[0]}
                             </span>
                           </button>
                         );
                       })}
                       
                       {/* Custom Brand Option */}
                       <button
                         type="button"
                         onClick={() => setThemeColorPreview('custom')}
                         className={cn(
                           "p-3 rounded-xl border text-left transition-all hover:scale-102 flex flex-col gap-2 bg-surface select-none",
                           themeColorPreview === 'custom'
                             ? "border-brand ring-2 ring-brand/20 shadow-md"
                             : "border-border hover:border-brand/40"
                         )}
                       >
                         <div className="flex items-center gap-1">
                           <span 
                             className="w-4 h-4 rounded-full border border-white/10 block" 
                             style={{ backgroundColor: customBrandColorPreview || '#2ba9b8' }} 
                           />
                           <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                           <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-wider leading-none text-text-main">
                           Customizado
                         </span>
                       </button>
                     </div>

                     {/* Custom hex color selection */}
                     {themeColorPreview === 'custom' && (
                       <motion.div 
                         initial={{ opacity: 0, y: -5 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="p-4 bg-brand/5 border border-brand/20 rounded-2xl flex items-center justify-between gap-4"
                       >
                         <div className="flex items-center gap-3">
                           <input 
                             type="color" 
                             value={customBrandColorPreview || '#2ba9b8'} 
                             onChange={(e) => setCustomBrandColorPreview(e.target.value)}
                             className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent shrink-0"
                           />
                           <div className="min-w-0">
                             <p className="text-xs font-bold text-text-main truncate">Cor Principal</p>
                             <p className="text-[10px] text-text-muted font-mono">{customBrandColorPreview || '#2ba9b8'}</p>
                           </div>
                         </div>
                         <Input 
                           type="text" 
                           value={customBrandColorPreview || '#2ba9b8'}
                           onChange={(e) => {
                             const val = e.target.value.trim();
                             if (val.startsWith('#') && val.length === 7) {
                               setCustomBrandColorPreview(val);
                             }
                           }}
                           placeholder="#2ba9b8"
                           className="w-24 text-xs font-mono h-8"
                           maxLength={7}
                         />
                       </motion.div>
                     )}
                   </div>
                </Card>

                {/* Live System Theme & Logo Mockup Panel Card */}
                <Card className="p-8 space-y-6 flex flex-col justify-between">
                   <div className="space-y-3">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-3">
                       <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                         <Activity size={14} className="text-brand animate-pulse" /> Painel de Pré-visualização
                       </h3>

                       {/* Device Toggle Buttons: [ 📱 Celular (PWA) ] [ 🌐 Navegador (Web) ] */}
                       <div className="flex items-center gap-1 bg-black/10 dark:bg-white/10 p-1 rounded-xl shrink-0 self-start sm:self-auto">
                         <button
                           type="button"
                           onClick={() => setPreviewDeviceMode('mobile')}
                           className={cn(
                             "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer select-none",
                             previewDeviceMode === 'mobile'
                               ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                               : "text-text-muted hover:text-text-main"
                           )}
                         >
                           <Smartphone size={12} />
                           Smartphone (Celular)
                         </button>
                         <button
                           type="button"
                           onClick={() => setPreviewDeviceMode('web')}
                           className={cn(
                             "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer select-none",
                             previewDeviceMode === 'web'
                               ? "bg-brand text-white shadow-md font-extrabold"
                               : "text-text-muted hover:text-text-main"
                           )}
                         >
                           <Globe size={12} />
                           Navegador (Web)
                         </button>
                       </div>
                     </div>
                     <p className="text-xs text-text-muted leading-relaxed">
                       {previewDeviceMode === 'mobile' 
                         ? "Simulação em tempo real da tela inicial do seu celular. Veja exatamente como o ícone e a marca do seu aplicativo se destacam no smartphone!"
                         : "Veja como sua identidade visual se comportará nos principais cards, botões e cabeçalhos do portal web."
                       }
                     </p>
                   </div>

                   {previewDeviceMode === 'mobile' ? (
                     /* Sleek Real Smartphone Frame Replica */
                     <div className="relative flex justify-center py-2">
                       <div className="w-60 h-[400px] bg-slate-950 rounded-[44px] border-[6px] border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 font-sans select-none border-amber-500/20">
                         {/* Speaker & Camera notch */}
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-zinc-800 rounded-b-2xl z-20 flex items-center justify-center">
                           <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 mr-2" />
                           <span className="w-10 h-1 bg-zinc-900 rounded-full" />
                         </div>

                         {/* Wallpaper */}
                         <div className="absolute inset-0 bg-gradient-to-b from-[#080d1a] via-[#0f172a] to-[#030712] z-0 opacity-95" />
                         <div className="absolute top-1/4 left-1/4 w-36 h-36 bg-amber-500/15 rounded-full filter blur-[40px] z-0 animate-pulse" />
                         <div className="absolute bottom-1/4 right-1/4 w-36 h-36 bg-sky-500/15 rounded-full filter blur-[40px] z-0 animate-pulse" />

                         {/* Status Bar */}
                         <div className="flex justify-between items-center text-[9px] text-white/70 font-semibold z-10 pt-1.5 px-3">
                           <span>19:42</span>
                           <div className="flex items-center gap-1.5">
                             <span className="text-[8px] font-bold tracking-wider">5G</span>
                             <div className="w-3.5 h-2 border border-white/70 rounded-[2px] flex items-center p-[1px]">
                               <div className="w-full h-full bg-white rounded-[1px]" />
                             </div>
                           </div>
                         </div>

                         {/* Home Screen App Grid */}
                         <div className="grid grid-cols-4 gap-y-6 gap-x-2 z-10 mt-5 px-1 flex-1 content-start">
                           <div className="flex flex-col items-center gap-1 opacity-40">
                             <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white shadow-md">
                               <span className="text-sm">💬</span>
                             </div>
                             <span className="text-[7px] text-white/80 truncate max-w-full">Whats</span>
                           </div>
                           <div className="flex flex-col items-center gap-1 opacity-40">
                             <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                               <span className="text-sm">🌐</span>
                             </div>
                             <span className="text-[7px] text-white/80 truncate max-w-full">Safari</span>
                           </div>
                           <div className="flex flex-col items-center gap-1 opacity-40">
                             <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
                               <span className="text-sm">📺</span>
                             </div>
                             <span className="text-[7px] text-white/80 truncate max-w-full">Video</span>
                           </div>
                           <div className="flex flex-col items-center gap-1 opacity-40">
                             <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-white shadow-md">
                               <span className="text-sm">⚙️</span>
                             </div>
                             <span className="text-[7px] text-white/80 truncate max-w-full">Ajustes</span>
                           </div>

                           {/* THE LILOUPRO / CHURCH ICON - PROMINENT & FLOATING */}
                           <motion.div 
                             initial={{ scale: 0.95, y: 3 }}
                             animate={{ scale: [1, 1.05, 1], y: [0, -4, 0] }}
                             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                             className="flex flex-col items-center gap-1.5 col-span-4 justify-self-center my-3"
                           >
                             <div className="relative">
                               {/* Outer Golden Glow ring */}
                               <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-amber-300 rounded-2xl opacity-50 blur-md animate-pulse" />
                               
                               {/* Icon Preview */}
                               <div className={cn(
                                 "w-16 h-16 border border-amber-500/40 shadow-2xl relative overflow-hidden flex items-center justify-center z-10",
                                 logoRadiusPreview === 'rounded-none' ? 'rounded-none' :
                                 logoRadiusPreview === 'rounded-lg' ? 'rounded-xl' :
                                 logoRadiusPreview === 'rounded-2xl' ? 'rounded-3xl' :
                                 logoRadiusPreview === 'rounded-full' ? 'rounded-full' : 'rounded-2xl',
                                 logoBgPreview === 'white' ? 'bg-white' :
                                 logoBgPreview === 'black' ? 'bg-zinc-950' :
                                 logoBgPreview === 'theme' ? 'bg-brand' :
                                 logoBgPreview === 'transparent' ? 'bg-[#070b13]' : 'bg-[#070b13]'
                               )}
                               style={{
                                 backgroundColor: (logoBgPreview === 'custom' && logoBgCustomColorPreview) ? logoBgCustomColorPreview : undefined
                               }}>
                                 <img 
                                   src={logoPreview || churchData?.logoUrl || luxuryAppIcon} 
                                   referrerPolicy="no-referrer"
                                   alt="Ícone do Aplicativo no Celular" 
                                   className={cn(
                                     "w-full h-full",
                                     logoFitPreview === 'cover' ? "object-cover" : "object-contain",
                                     logoPaddingPreview || "p-1"
                                   )}
                                 />
                               </div>
                               
                               {/* Dynamic Red Notification Badge */}
                               {unreadBadgeCount > 0 && (
                                 <button
                                   type="button"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setUnreadBadgeCount(0);
                                   }}
                                   className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[9px] min-w-[20px] h-5 px-1 rounded-full z-20 shadow-lg border border-red-400 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                   title="Clique para zerar a notificação"
                                 >
                                   {unreadBadgeCount}
                                 </button>
                               )}
                             </div>
                             <span className="text-[10px] font-black tracking-wider text-amber-300 drop-shadow-md truncate max-w-[140px] text-center">
                               {churchData?.name || "LiLouPro"}
                             </span>
                           </motion.div>
                         </div>

                         {/* Dock */}
                         <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 flex justify-around items-center z-10 mb-2 border border-white/10 mx-1">
                           <div className="w-8 h-8 rounded-xl bg-green-500/40" />
                           <div className="w-8 h-8 rounded-xl bg-blue-400/40" />
                           {/* Active PWA Icon on Dock */}
                           <div className="w-8 h-8 rounded-xl bg-[#070b13] border border-amber-500/40 overflow-hidden flex items-center justify-center shadow-md">
                             <img 
                               src={logoPreview || churchData?.logoUrl || luxuryAppIcon} 
                               referrerPolicy="no-referrer"
                               className="w-full h-full object-cover" 
                               alt="PWA Dock" 
                             />
                           </div>
                           <div className="w-8 h-8 rounded-xl bg-amber-600/40" />
                         </div>

                         {/* Home Indicator */}
                         <div className="w-20 h-1 bg-white/40 rounded-full self-center mb-0.5 z-10" />
                       </div>
                     </div>
                   ) : (
                     /* Sleek Browser-like UI Frame Replica */
                     <div className="bg-black/10 dark:bg-black/30 border border-border/60 rounded-2xl p-5 space-y-4 shadow-inner">
                       <div className="flex items-center justify-between border-b border-border/10 pb-3">
                         <div className="flex items-center gap-1.5 shrink-0">
                           <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                           <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                           <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                         </div>
                         <span className="text-[9px] font-mono text-text-muted truncate max-w-[140px] pl-3">
                           portal.liloupro.app
                         </span>
                         <div className="w-8" />
                       </div>

                       {/* Miniature layout mockup of the application */}
                       <div className="grid grid-cols-12 gap-3 bg-surface/90 rounded-xl p-3 border border-border/40 text-[var(--text-main)] overflow-hidden"
                            style={{
                              '--brand': themeColorPreview === 'custom' ? customBrandColorPreview : COLOR_PRESETS[themeColorPreview]?.brandDark,
                              '--primary': themeColorPreview === 'custom' ? customBrandColorPreview : COLOR_PRESETS[themeColorPreview]?.primary,
                            } as React.CSSProperties}>
                         
                         {/* Mock Dashboard Sidebar on Left */}
                         <div className="col-span-4 border-r border-border/10 pr-2 space-y-3 min-w-0">
                           <div className="flex items-center gap-1.5 min-w-0">
                             {logoPreview ? (
                               <img 
                                 src={logoPreview} 
                                 className={cn(
                                   "w-5 h-5 border border-border/40 shrink-0",
                                   logoFitPreview === 'cover' ? "object-cover" : "object-contain",
                                   logoRadiusPreview === 'rounded-none' ? 'rounded-none' :
                                   logoRadiusPreview === 'rounded-lg' ? 'rounded' :
                                   logoRadiusPreview === 'rounded-xl' ? 'rounded-md' :
                                   logoRadiusPreview === 'rounded-2xl' ? 'rounded-lg' : 'rounded-full',
                                   logoPaddingPreview === 'p-0' ? 'p-0' :
                                   logoPaddingPreview === 'p-1' ? 'p-[1px]' :
                                   logoPaddingPreview === 'p-2' ? 'p-[2px]' : 'p-1',
                                   logoBgPreview === 'white' ? 'bg-white' :
                                   logoBgPreview === 'black' ? 'bg-zinc-950' :
                                   logoBgPreview === 'theme' ? 'bg-brand/10' :
                                   logoBgPreview === 'transparent' ? 'bg-transparent' : 'bg-white/5'
                                 )}
                                 style={{
                                   backgroundColor: (logoBgPreview === 'custom' && logoBgCustomColorPreview) ? logoBgCustomColorPreview : undefined
                                 }}
                                 alt="Logo Mockup" 
                               />
                             ) : (
                               <div className="w-5 h-5 bg-[var(--brand)] rounded flex items-center justify-center shrink-0">
                                 <Music2 size={10} className="text-background" />
                               </div>
                             )}
                             <span className="text-[8px] font-black tracking-tight truncate text-text-main max-w-[50px]">
                               {churchData?.name || "Minha Igreja"}
                             </span>
                           </div>
                           
                           {/* Navigation Items mockup */}
                           <div className="space-y-1">
                             <div className="h-3.5 rounded-md bg-[var(--brand)]/10 flex items-center px-1.5 gap-1 border border-[var(--brand)]/20">
                               <Home size={7} className="text-[var(--brand)] shrink-0" />
                               <div className="w-8 h-0.5 bg-[var(--brand)] rounded shrink-0" />
                             </div>
                             <div className="h-3.5 rounded-md flex items-center px-1.5 gap-1 opacity-45">
                               <Music size={7} className="text-text-muted shrink-0" />
                               <div className="w-8 h-0.5 bg-text-muted rounded shrink-0" />
                             </div>
                             <div className="h-3.5 rounded-md flex items-center px-1.5 gap-1 opacity-45">
                               <Users size={7} className="text-text-muted shrink-0" />
                               <div className="w-8 h-0.5 bg-text-muted rounded shrink-0" />
                             </div>
                           </div>
                         </div>

                         {/* Mock Dashboard Screen Content on Right */}
                         <div className="col-span-8 pl-1 space-y-2.5 min-w-0">
                           <div className="space-y-0.5">
                             <h4 className="text-[9px] font-black text-text-main leading-tight truncate">
                               Olá, {user?.displayName?.split(' ')[0] || "Membro"} 👋
                             </h4>
                             <p className="text-[6px] text-text-muted truncate">
                               Portal de Serviços de Louvor
                             </p>
                           </div>

                           {/* Mini grid content cards */}
                           <div className="grid grid-cols-2 gap-1.5">
                             <div className="p-1.5 rounded-md bg-[var(--brand)]/5 border border-[var(--brand)]/15 space-y-1 shrink-0">
                               <div className="w-5 h-1 bg-[var(--brand)] rounded opacity-75" />
                               <div className="w-8 h-1 bg-[var(--brand)]/20 rounded" />
                             </div>
                             <div className="p-1.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/40 space-y-1 shrink-0">
                               <div className="w-5 h-1 bg-text-muted rounded opacity-75" />
                               <div className="w-8 h-1 bg-text-muted/25 rounded" />
                             </div>
                           </div>

                           {/* Action button mock */}
                           <button 
                             type="button"
                             className="w-full py-1 rounded bg-[var(--brand)] text-[8px] font-black text-[var(--brand-text)] uppercase tracking-wider flex items-center justify-center gap-1 opacity-90 shadow-sm"
                           >
                             <Sparkles size={8} className="text-[var(--brand-text)]" /> Simular Ação
                           </button>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* Save/Discard Controls & Visual Pending indicators */}
                   <div className="pt-4 border-t border-border/30">
                     {logoPreview !== (churchData.logoUrl || null) || 
                       logoFitPreview !== (churchData.logoFit || 'contain') || 
                       logoPaddingPreview !== (churchData.logoPadding || 'p-1') || 
                       logoBgPreview !== (churchData.logoBg || 'transparent') || 
                       logoBgCustomColorPreview !== (churchData.logoBgCustomColor || '#ffffff') || 
                       logoRadiusPreview !== (churchData.logoRadius || 'rounded-xl') || 
                      themeColorPreview !== (churchData.themeColor || 'navy') || 
                      customBrandColorPreview !== (churchData.customBrandColor || '#2ba9b8') ? (
                       <motion.div 
                         initial={{ opacity: 0, y: 8 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="space-y-3"
                       >
                         <div className="flex items-start gap-2.5 text-amber-500 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 p-3 rounded-xl">
                           <Zap size={13} className="shrink-0 text-amber-500 animate-bounce mt-0.5" />
                           <div className="text-[9px] sm:text-[11px] font-medium leading-relaxed text-text-main">
                             <span className="font-bold text-amber-500">Alterações não gravadas!</span> Clique em "Salvar & Aplicar" para publicar esta nova aparência para todos os membros ou "Descartar" para restaurar a identidade ativa.
                           </div>
                         </div>
                         
                         <div className="flex flex-col sm:flex-row gap-2">
                           <Button 
                             onClick={async () => {
                               setIsSavingBranding(true);
                               try {
                                 const updatedBranding: any = {
                                   themeColor: themeColorPreview,
                                   customBrandColor: customBrandColorPreview,
                                   logoFit: logoFitPreview,
                                   logoPadding: logoPaddingPreview,
                                   logoBg: logoBgPreview,
                                   logoBgCustomColor: logoBgCustomColorPreview,
                                   logoRadius: logoRadiusPreview,
                                 };
                                 if (logoPreview === null) {
                                   updatedBranding.logoUrl = deleteField();
                                 } else {
                                   updatedBranding.logoUrl = logoPreview;
                                 }
                                 await updateDoc(doc(db, 'churches', churchData.id), updatedBranding);
                                 alert("Visual da sua igreja atualizado e aplicado com sucesso no Firestore!");
                               } catch (err) {
                                 console.error("Erro ao aplicar visual:", err);
                                 alert("Infelizmente não foi possível salvar.");
                               } finally {
                                 setIsSavingBranding(false);
                               }
                             }}
                             disabled={isSavingBranding}
                             className="flex-1 bg-brand text-brand-text font-black uppercase tracking-wider text-[10px] h-9 gap-1.5"
                           >
                             {isSavingBranding ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
                             Salvar & Aplicar
                           </Button>
                           
                           <Button 
                             onClick={() => {
                               setLogoPreview(churchData.logoUrl || null);
                               setThemeColorPreview(churchData.themeColor || 'navy');
                               setCustomBrandColorPreview(churchData.customBrandColor || '#2ba9b8');
                               setLogoFitPreview(churchData.logoFit || 'contain');
                               setLogoPaddingPreview(churchData.logoPadding || 'p-1');
                               setLogoBgPreview(churchData.logoBg || 'transparent');
                               setLogoBgCustomColorPreview(churchData.logoBgCustomColor || '#ffffff');
                               setLogoRadiusPreview(churchData.logoRadius || 'rounded-xl');
                             }}
                             disabled={isSavingBranding}
                             variant="ghost"
                             className="flex-1 border border-border hover:bg-black/5 dark:hover:bg-white/5 font-black uppercase tracking-wider text-[10px] h-9 text-text-muted hover:text-text-main"
                           >
                             Descartar Alterações
                           </Button>
                         </div>
                       </motion.div>
                     ) : (
                       <div className="flex items-center justify-center gap-1.5 py-1 text-center">
                         <Check size={12} className="text-green-500 shrink-0" />
                         <span className="text-[10px] font-bold text-text-muted">Aparência sincronizada com o servidor</span>
                       </div>
                     )}
                   </div>
                </Card>
              </>
            )}

           {/* Profile Card */}
           <Card className="p-8 space-y-6">
              <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                <Users size={14} className="text-brand" /> Perfil do Usuário
              </h3>
              
              <div className="space-y-4">
                {/* Profile Photo Display & Preset Selector */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-border/10">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-full bg-brand/10 border-2 border-brand/40 overflow-hidden flex items-center justify-center shadow-lg relative group">
                      {userPhotoUrl ? (
                        <img 
                          referrerPolicy="no-referrer"
                          src={userPhotoUrl} 
                          alt="Foto do perfil" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-black text-text-main">{userName?.[0] || user?.email?.[0] || '?'}</span>
                      )}
                    </div>
                    {userPhotoUrl && (
                      <button 
                        onClick={() => setUserPhotoUrl('')}
                        type="button"
                        className="absolute -bottom-1 -right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-[8px] font-black border border-surface shadow-md"
                        title="Remover foto"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-3 w-full animate-fade-in">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block text-left">Foto de Perfil (Enviar do aparelho, tirar com a câmera ou predefinição)</label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                      <div 
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith('image/')) {
                            try {
                              const base64 = await compressAndResizeImage(file);
                              setUserPhotoUrl(base64);
                            } catch (err) {
                              console.error(err);
                              alert('Erro ao carregar a imagem. Tente outro arquivo.');
                            }
                          }
                        }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const base64 = await compressAndResizeImage(file);
                                setUserPhotoUrl(base64);
                              } catch (err) {
                                console.error(err);
                                alert('Erro ao carregar a imagem. Tente outro arquivo.');
                              }
                            }
                          };
                          input.click();
                        }}
                        className="border border-dashed border-border hover:border-brand/60 bg-black/5 dark:bg-white/5 rounded-2xl p-3 px-4 transition-all duration-200 flex flex-col items-center justify-center text-center gap-1 cursor-pointer group active:scale-[0.98] min-h-[84px]"
                      >
                        <Upload size={16} className="text-text-muted group-hover:text-brand transition-colors animate-pulse" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-text-main group-hover:text-brand transition-colors">
                            Selecionar Arquivo
                          </p>
                          <p className="text-[9px] text-text-muted leading-tight">
                            Arraste ou clique para buscar
                          </p>
                        </div>
                      </div>

                      <div 
                        onClick={() => setIsCameraActive(true)}
                        className="border border-dashed border-border hover:border-brand/60 bg-black/5 dark:bg-white/5 rounded-2xl p-3 px-4 transition-all duration-200 flex flex-col items-center justify-center text-center gap-1 cursor-pointer group active:scale-[0.98] min-h-[84px]"
                      >
                        <Camera size={16} className="text-text-muted group-hover:text-brand transition-colors" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-text-main group-hover:text-brand transition-colors">
                            Tirar Foto na Hora
                          </p>
                          <p className="text-[9px] text-text-muted leading-tight">
                            Tirar selfie diretamente do celular
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'singer1', title: 'Cantora', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80' },
                        { id: 'singer2', title: 'Cantor', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80' },
                        { id: 'guitar1', title: 'Guitarra', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&h=150&q=80' },
                        { id: 'guitar2', title: 'Violão', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=150&h=150&q=80' },
                        { id: 'piano', title: 'Teclado', url: 'https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=150&h=150&q=80' },
                        { id: 'drum', title: 'Batera', url: 'https://images.unsplash.com/photo-1510119635499-cbb51c65aaea?auto=format&fit=crop&w=150&h=150&q=80' }
                      ].map(preset => (
                        <button 
                          key={preset.id}
                          type="button"
                          onClick={() => setUserPhotoUrl(preset.url)}
                          className={cn(
                            "w-8 h-8 rounded-full overflow-hidden border-2 transition-all hover:scale-105 shadow-sm shrink-0",
                            userPhotoUrl === preset.url ? "border-brand ring-2 ring-brand/30" : "border-border hover:border-text-muted"
                          )}
                          title={preset.title}
                        >
                          <img referrerPolicy="no-referrer" src={preset.url} className="w-full h-full object-cover" alt={preset.title} />
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-text-muted">Arraste um arquivo ou selecione um preset acima.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <AnimatePresence>
                    {isCameraActive && (
                      <CameraCapture 
                        onCapture={(base64) => setUserPhotoUrl(base64)} 
                        onClose={() => setIsCameraActive(false)} 
                      />
                    )}
                  </AnimatePresence>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Nome de Exibição</label>
                  <Input 
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">E-mail</label>
                  <Input 
                    value={user?.email || ''}
                    disabled
                    className="opacity-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Data de Nascimento (Opcional)</label>
                  <EasyBirthDatePicker 
                    value={userBirthDate}
                    onChange={val => setUserBirthDate(val)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Versão Padrão da Bíblia</label>
                  <div className="w-full h-11 bg-black/5 dark:bg-white/5 border border-border text-xs text-sky-400 px-4 rounded-xl flex items-center font-black select-none">
                    NAA 2017 (Nova Almeida Atualizada - Padrão)
                  </div>
                </div>

                <Button 
                  onClick={handleUpdateProfile} 
                  className="w-full mt-2" 
                  disabled={isSaving || (userName === (user?.displayName || '') && userPhotoUrl === (currentMember?.photoUrl || '') && userBirthDate === (currentMember?.birthDate || '') && defaultBibleVersion === (currentMember?.defaultBibleVersion || 'NAA'))}
                >
                  {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Alterações
                </Button>
              </div>
           </Card>

           {/* Appearance Card */}
           <Card className="p-8 space-y-6">
              <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-brand" /> Aparência
              </h3>
              
              <div className="space-y-4">
                <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Modo de Visualização:</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => onThemeChange('dark')}
                    className={cn(
                      "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                      theme === 'dark' 
                        ? "bg-brand/20 border-brand text-text-main shadow-lg shadow-brand/10 scale-105" 
                        : "bg-surface border-border text-text-muted hover:bg-black/5 dark:hover:bg-white/5 opacity-60"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-white">
                      <Zap size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Escuro</span>
                  </button>
   
                  <button 
                    onClick={() => onThemeChange('light')}
                    className={cn(
                      "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                      theme === 'light' 
                        ? "bg-brand/20 border-brand text-brand shadow-lg shadow-brand/10 scale-105" 
                        : "bg-surface border-border text-text-muted hover:bg-black/5 dark:hover:bg-white/5 opacity-60"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center text-primary">
                      <Sparkles size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Claro</span>
                  </button>
                </div>
              </div>
           </Card>
   
            {/* Novo Ícone de Luxo (Premium) Card */}
            <Card className="p-8 space-y-6 md:col-span-2 border-amber-500/20 bg-amber-500/[0.01] dark:bg-amber-500/[0.02]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-500 animate-pulse" /> ✨ Novo Ícone de Luxo (Premium &amp; Comercial)
                  </h3>
                  <p className="text-xs text-text-muted">
                    Visualize o novo ícone do aplicativo com acabamento profissional e colcheia dourada antes da publicação oficial.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
                {/* Smartphone Home Screen Mockup */}
                <div className="relative flex justify-center">
                  <div className="w-56 h-[380px] bg-slate-950 rounded-[40px] border-[6px] border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 font-sans select-none">
                    {/* Speaker & Camera notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-zinc-800 rounded-b-2xl z-20 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 mr-2" />
                      <span className="w-8 h-1 bg-zinc-900 rounded-full" />
                    </div>

                    {/* Smartphone Background Wallpaper (Warm/Luxurious) */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#090d16] via-[#111827] to-[#030712] z-0 opacity-90" />
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-amber-500/10 rounded-full filter blur-[40px] z-0 animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-sky-500/10 rounded-full filter blur-[40px] z-0 animate-pulse" />

                    {/* Status bar */}
                    <div className="flex justify-between items-center text-[8px] text-white/60 font-medium z-10 pt-1.5 px-2">
                      <span>14:40</span>
                      <div className="flex items-center gap-1">
                        <span>5G</span>
                        <div className="w-3 h-1.5 border border-white/60 rounded-[2px] flex items-center p-[1px]">
                          <div className="w-full h-full bg-white/80 rounded-[1px]" />
                        </div>
                      </div>
                    </div>

                    {/* Home Screen Icons Grid */}
                    <div className="grid grid-cols-4 gap-y-6 gap-x-2 z-10 mt-6 px-1 flex-1 content-start">
                      {/* Random Mock Icons */}
                      <div className="flex flex-col items-center gap-1 opacity-40">
                        <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center text-white shadow-md">
                          <span className="text-[14px]">💬</span>
                        </div>
                        <span className="text-[7px] text-white/80 truncate max-w-full">Whats</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 opacity-40">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                          <span className="text-[14px]">🌐</span>
                        </div>
                        <span className="text-[7px] text-white/80 truncate max-w-full">Safari</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 opacity-40">
                        <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
                          <span className="text-[14px]">📺</span>
                        </div>
                        <span className="text-[7px] text-white/80 truncate max-w-full">Video</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 opacity-40">
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-white shadow-md">
                          <span className="text-[14px]">⚙️</span>
                        </div>
                        <span className="text-[7px] text-white/80 truncate max-w-full">Ajustes</span>
                      </div>

                      {/* THE LILOUPRO ICON - PROMINENT & FLOATING */}
                      <motion.div 
                        initial={{ scale: 0.9, y: 5 }}
                        animate={{ scale: [1, 1.05, 1], y: [0, -4, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="flex flex-col items-center gap-1.5 col-span-4 justify-self-center my-4"
                      >
                        <div className="relative">
                          {/* Outer Luxury Golden Glow ring */}
                          <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 to-amber-300 rounded-2xl opacity-40 blur-md animate-pulse" />
                          
                          {/* The Real App Icon Preview */}
                          <div className="w-16 h-16 rounded-2xl bg-[#070b13] border border-amber-500/40 shadow-2xl relative overflow-hidden flex items-center justify-center z-10">
                            <img 
                              src={luxuryAppIcon} 
                              referrerPolicy="no-referrer"
                              alt="Novo Ícone Liloupro" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Dynamic Red Notification Badge */}
                          {unreadBadgeCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUnreadBadgeCount(0);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[8px] min-w-[18px] h-4 px-1 rounded-full z-20 shadow-md border border-red-400/60 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                              title="Clique para zerar a notificação"
                            >
                              {unreadBadgeCount}
                            </button>
                          )}
                        </div>
                        <span className="text-[9px] font-black tracking-wider text-amber-300 drop-shadow-md">LiLouPro</span>
                      </motion.div>
                    </div>

                    {/* Bottom Dock */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 flex justify-around items-center z-10 mb-2 border border-white/5 mx-2">
                      <div className="w-8 h-8 rounded-lg bg-green-500 opacity-40" />
                      <div className="w-8 h-8 rounded-lg bg-blue-400 opacity-40" />
                      {/* Active PWA Icon on Dock */}
                      <div className="w-8 h-8 rounded-lg bg-[#070b13] border border-amber-500/30 overflow-hidden flex items-center justify-center shadow-md">
                        <img 
                          src={luxuryAppIcon} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                          alt="LiLouPro" 
                        />
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-amber-600 opacity-40" />
                    </div>

                    {/* Bottom indicator bar */}
                    <div className="w-20 h-1 bg-white/40 rounded-full self-center mb-1 z-10" />
                  </div>
                </div>

                {/* Right Column: Information & Actions */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                      ✨ Status: Pronto para Visualização
                    </div>
                    <h4 className="text-sm font-black text-text-main">Sua Marca de Forma Excepcional</h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Este novo ícone foi gerado com acabamento tridimensional premium. Ele utiliza a cor de fundo oficial escura do aplicativo com a colcheia central banhada a ouro metálico com brilho reluzente e reflexos realistas.
                    </p>
                    <p className="text-xs text-text-muted leading-relaxed">
                      A visualização ao lado simula como ele ficará destacado e elegante na tela inicial de um smartphone Android ou iOS.
                    </p>
                  </div>

                  <div className="p-3.5 bg-black/5 dark:bg-white/5 border border-border/40 rounded-2xl space-y-2">
                    <p className="text-[10px] uppercase font-black text-text-main tracking-wider">Como aplicar oficialmente?</p>
                    <p className="text-[10px] text-text-muted leading-relaxed">
                      O ícone já está disponível nas configurações e pode ser visualizado no seu painel. Quando você clicar em <span className="font-bold text-amber-500">Republicar</span> para gerar a nova versão do aplicativo, o sistema PWA lerá a imagem atualizada e aplicará para todos os celulares.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button 
                      type="button"
                      onClick={() => setShowSettingsInstallModal(true)}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-wider text-[10px] h-10 gap-1.5 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      <Smartphone size={14} className="stroke-[2.5]" />
                      Instalar no Celular
                    </button>
                    <a 
                      href={luxuryAppIcon} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-text-main border border-border font-black uppercase tracking-wider text-[10px] h-10 gap-1.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Sparkles size={14} />
                      Ver em Tela Cheia
                    </a>
                    <a 
                      href="/pwa-512x512.png?v=6.0" 
                      download="liloupro_icone_luxo_512x512.png"
                      className="flex-1 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-text-main border border-border font-black uppercase tracking-wider text-[10px] h-10 gap-1.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Download size={14} />
                      Baixar Ícone (PNG)
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            

            {/* PWA Connection & Notification Guide Card */}
            <Card className="p-8 space-y-6 md:col-span-2 border-amber-500/15 bg-amber-500/[0.01] dark:bg-amber-500/[0.02]">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                 <div className="space-y-1">
                   <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                     <Smartphone size={18} className="text-amber-500" /> Guia de Instalação PWA &amp; Notificações
                   </h3>
                   <p className="text-xs text-text-muted">
                     Instale o aplicativo na sua tela de início para ativar recursos de segundo plano e o selo de aviso (badge) no ícone.
                   </p>
                 </div>
                 
                 {/* OS Tab Selector */}
                 <div className="flex bg-black/10 dark:bg-white/10 p-1 rounded-xl border border-border/40 gap-1 w-fit shrink-0">
                   <button
                     type="button"
                     onClick={() => setPwaGuideTab('android')}
                     className={cn(
                       "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                       pwaGuideTab === 'android'
                         ? "bg-amber-500 text-black shadow-md font-extrabold"
                         : "text-text-muted hover:text-text-main"
                     )}
                   >
                     Android / Chrome
                   </button>
                   <button
                     type="button"
                     onClick={() => setPwaGuideTab('ios')}
                     className={cn(
                       "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                       pwaGuideTab === 'ios'
                         ? "bg-amber-500 text-black shadow-md font-extrabold"
                         : "text-text-muted hover:text-text-main"
                     )}
                   >
                     iOS / iPhone (Safari)
                   </button>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                 {/* Step 1: Instalação */}
                 <div className="space-y-4">
                   <h4 className="text-xs font-black text-brand uppercase tracking-wider flex items-center gap-2">
                     <span className="w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[10px] font-extrabold">1</span>
                     Passo 1: Instalar na Tela Inicial (PWA)
                   </h4>
                   
                   {pwaGuideTab === 'android' ? (
                     <div className="space-y-3 text-xs leading-relaxed text-text-muted pl-7">
                       <p>
                         Para aproveitar o app como se fosse um aplicativo nativo da Play Store, siga os passos abaixo:
                       </p>
                       <ul className="space-y-2 list-disc list-inside">
                         <li>Abra o aplicativo utilizando o navegador <strong className="text-text-main">Google Chrome</strong>.</li>
                         <li>Clique no botão de <strong className="text-text-main">três pontos (Menu)</strong> no canto superior direito do Chrome.</li>
                         <li>Toque na opção <strong className="text-text-main font-semibold">"Instalar aplicativo"</strong> ou <strong className="text-text-main font-semibold">"Adicionar à tela inicial"</strong>.</li>
                         <li>Confirme e aguarde o ícone do aplicativo aparecer na sua tela principal ou gaveta de apps.</li>
                       </ul>
                     </div>
                   ) : (
                     <div className="space-y-3 text-xs leading-relaxed text-text-muted pl-7">
                       <p>
                         A Apple exige que o aplicativo seja instalado através do Safari para habilitar o envio de notificações de sistema:
                       </p>
                       <ul className="space-y-2 list-disc list-inside">
                         <li>Certifique-se de carregar este site no navegador oficial <strong className="text-text-main font-semibold">Safari</strong> do seu iPhone.</li>
                         <li>Toque no botão de <strong className="text-text-main">Compartilhar</strong> (o ícone de um quadrado com uma seta apontando para cima, localizado no rodapé do Safari).</li>
                         <li>Role a folha de opções para baixo e toque em <strong className="text-text-main">"Adicionar à Tela de Início"</strong>.</li>
                         <li>Toque em <strong className="text-text-main">"Adicionar"</strong> no canto superior direito para confirmar.</li>
                       </ul>
                     </div>
                   )}
                 </div>

                 {/* Step 2: Permissões de Notificação e Badges */}
                 <div className="space-y-4">
                   <h4 className="text-xs font-black text-brand uppercase tracking-wider flex items-center gap-2">
                     <span className="w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[10px] font-extrabold">2</span>
                     Passo 2: Ativar Avisos e Selo (Badge) no Ícone
                   </h4>

                   {pwaGuideTab === 'android' ? (
                     <div className="space-y-3 text-xs leading-relaxed text-text-muted pl-7">
                       <p>
                         Garanta que o sistema do celular atualize a bolinha de avisos (badge) mesmo com o aplicativo fechado ou em segundo plano:
                       </p>
                       <ul className="space-y-2 lg:space-y-3 list-decimal list-inside">
                         <li>Dê um toque longo sobre o ícone do app recém-instalado na sua tela inicial e escolha <strong className="text-text-main">"Informações do app"</strong> (ou toque no ícone com a letra "i").</li>
                         <li>Entre na seção de <strong className="text-text-main">"Notificações"</strong> do Android e confirme se a chave geral está ligada, incluindo <strong className="text-text-main">"Permitir selo no ícone"</strong> ou "Permitir ponto de notificação".</li>
                         <li>Retorne na tela de informações do app, acesse <strong className="text-text-main">"Bateria"</strong> ou "Uso de bateria" e selecione a opção <strong className="text-text-main font-semibold">"Sem Restrições"</strong> (isso impede que o Android suspenda as sincronizações de avisos do app em segundo plano).</li>
                       </ul>
                     </div>
                   ) : (
                     <div className="space-y-3 text-xs leading-relaxed text-text-muted pl-7">
                       <p>
                         O iOS do iPhone requer passos específicos de configuração de permissões do sistema após a instalação:
                       </p>
                       <ul className="space-y-2 lg:space-y-3 list-decimal list-inside">
                         <li>Carregue o app tocando no ícone criado na sua <strong className="text-text-main">Tela de Início</strong> (e não pelo navegador normal).</li>
                         <li>Clique no botão <strong className="text-text-main font-black text-brand">"Permitir Notificações no Celular"</strong> acima nesta página para disparar o pedido inicial do iOS e autorize clicando em "Permitir".</li>
                         <li>Abra o aplicativo de <strong className="text-text-main font-semibold">Ajustes</strong> nativo do seu iPhone, role até encontrar a lista com todos os aplicativos no final e toque sobre o nome deste app.</li>
                         <li>Toque em <strong className="text-text-main font-semibold font-black text-brand">"Notificações"</strong> e garanta que <strong className="text-text-main font-black text-brand">"Avisos" (Badges)</strong> estão totalmente liberados no sistema do iOS para ligar a bolinha vermelha no ícone.</li>
                       </ul>
                     </div>
                   )}
                 </div>
               </div>

               {/* Seção de Teste de Notificações e Badges */}
               <div id="pwa-test-notifications-panel" className="p-5 rounded-xl border border-dashed border-amber-500/30 dark:border-amber-500/40 bg-amber-500/[0.02] space-y-4">
                 <div className="flex gap-2.5 items-start">
                   <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                     <Zap size={16} className="text-amber-500 animate-pulse" />
                   </div>
                   <div className="space-y-1">
                     <h4 className="text-xs font-black text-text-main uppercase tracking-wider">
                       Testador Integrado de Avisos &amp; Selos (PWA)
                     </h4>
                     <p className="text-[11px] text-text-muted leading-relaxed">
                       Agende um aviso local automático para comprovar que as notificações no sistema operam perfeitamente e o contador numérico (marcação vermelha/badge) sobre o ícone do aplicativo se atualiza corretamente mesmo sem o aplicativo estar em primeiro plano.
                     </p>
                   </div>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-3 pt-1">
                   <button
                     id="pwa-instant-test-btn"
                     type="button"
                     onClick={triggerTestNotification}
                     className="flex-1 h-11 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
                   >
                     <Zap size={14} className="fill-slate-950 shrink-0" />
                     <span>Testar Notificação Agora</span>
                   </button>

                   <button
                     id="pwa-schedule-test-btn"
                     type="button"
                     onClick={handleScheduleTestNotification}
                     disabled={isTestingBadge}
                     className={cn(
                       "flex-1 h-11 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md",
                       isTestingBadge
                         ? "bg-amber-500 text-black animate-pulse font-extrabold"
                         : "bg-brand text-white hover:brightness-110 shadow-brand/10 font-bold"
                     )}
                   >
                     <Clock size={14} className={isTestingBadge ? "animate-spin" : ""} />
                     {testCountdown !== null 
                       ? `Disparando em ${testCountdown}s... MINIMIZE AGORA!` 
                       : "Agendar Teste (Em 5 segundos)"
                     }
                   </button>

                   <button
                     id="pwa-clear-badge-btn"
                     type="button"
                     onClick={handleClearTestBadge}
                     className="px-4 h-11 rounded-xl border border-border bg-black/5 dark:bg-white/5 font-black text-[10px] uppercase tracking-widest text-text-muted hover:text-text-main hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center gap-2 transition-all shrink-0"
                   >
                     <RefreshCcw size={14} />
                     Zerar Ícone (Limpar Selo)
                   </button>
                 </div>

                 <div className="text-[10px] text-text-muted italic flex items-start gap-1.5 pl-1.5 leading-relaxed">
                   <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                   <span><strong>Passo a passo do teste:</strong> Clique no botão de agendamento acima, minimize o aplicativo (ou bloqueie a tela do celular) em até 5 segundos e aguarde. O seu celular disparará o aviso e mudará o badge do app para 3.</span>
                 </div>
               </div>

               {/* Consulta Rápida à Bíblia */}
               <QuickBibleSearch />

               {/* Banner de Notas */}
               <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                 <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                 <div className="space-y-1">
                   <p className="text-[10px] uppercase font-black tracking-wider text-amber-500">
                     Por que isso é necessário?
                   </p>
                   <p className="text-[10px] text-text-muted leading-relaxed">
                     Os navegadores modernos (especialmente no iOS) bloqueiam notificações e atualizações de selos numéricos (badges) sobre o ícone por questões de privacidade e segurança do sistema a menos que o app seja primeiramente adicionado à tela de início (como PWA) e possua permissão de notificação explícita dada nas configurações do smartphone.
                   </p>
                 </div>
               </div>
            </Card>

           {/* Admin Settings (Conditional) */}
           {isAdmin && (
             <Card className="p-8 space-y-6">
                <div>
                  <h3 className="text-xs font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                    <Bell size={16} className="text-brand" /> WhatsApp Administrativo
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed mt-1">
                    Configure os números dos administradores que receberão notificações automáticas de escala e avisos importantes via WhatsApp.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Administrador WhatsApp 1 (Principal)</label>
                    <Input 
                      placeholder="Ex: 5511999999999"
                      value={adminPhone}
                      onChange={e => setAdminPhone(e.target.value)}
                      className="font-mono h-11 bg-white/5 border-white/10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Administrador WhatsApp 2</label>
                    <Input 
                      placeholder="Ex: 5511999999999"
                      value={adminPhone2}
                      onChange={e => setAdminPhone2(e.target.value)}
                      className="font-mono h-11 bg-white/5 border-white/10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Administrador WhatsApp 3</label>
                    <Input 
                      placeholder="Ex: 5511999999999"
                      value={adminPhone3}
                      onChange={e => setAdminPhone3(e.target.value)}
                      className="font-mono h-11 bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                      <Mail size={16} className="text-brand" /> E-mails de Notificação Administrativa
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed mt-1">
                      Configure os e-mails dos administradores para recebimento de relatórios de escala, disponibilidade e alertas por e-mail.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Administrador E-mail 1 (Principal)</label>
                    <Input 
                      type="email"
                      placeholder="ex: pastor@igreja.com"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      className="font-mono h-11 bg-white/5 border-white/10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Administrador E-mail 2</label>
                    <Input 
                      type="email"
                      placeholder="ex: lider@igreja.com"
                      value={adminEmail2}
                      onChange={e => setAdminEmail2(e.target.value)}
                      className="font-mono h-11 bg-white/5 border-white/10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Administrador E-mail 3</label>
                    <Input 
                      type="email"
                      placeholder="ex: coordenador@igreja.com"
                      value={adminEmail3}
                      onChange={e => setAdminEmail3(e.target.value)}
                      className="font-mono h-11 bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-white/10">
                  <label className="text-[10px] font-black text-brand uppercase tracking-widest pl-1">Link Padrão de Compartilhamento (Grupo de Louvor)</label>
                  <Input 
                    placeholder="Ex: https://chat.whatsapp.com/Gj3Hdf..."
                    value={whatsappGroupLink}
                    onChange={e => setWhatsappGroupLink(e.target.value)}
                    className="font-mono h-11 bg-white/5 border-white/10"
                  />
                  <p className="text-[9px] text-zinc-400 pl-1 leading-normal">
                    Adicione o link de convite do grupo do WhatsApp do ministério de louvor para abrir de forma automática ao compartilhar escalas.
                  </p>
                </div>

                <Button 
                  onClick={handleSavePhone} 
                  disabled={isSavingPhone}
                  className="w-full h-11 mt-2 font-bold uppercase tracking-wider text-xs"
                >
                  {isSavingPhone ? <RefreshCcw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  Salvar Configurações Administrativas
                </Button>

                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-tight bg-amber-500/10 p-2.5 rounded-lg leading-relaxed">
                  Atenção: Os e-mails e números configurados acima receberão as cópias dos relatórios de escala gerados no sistema.
                </p>
             </Card>
           )}

           {/* Information Card */}
           <Card className="p-8 space-y-6 bg-brand/5">
              <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-brand" /> Sistema e Informações
              </h3>
              
              <div className="space-y-4">
                 <div className="flex justify-between items-center border-b border-border pb-3">
                   <span className="text-xs font-bold text-text-muted uppercase">Versão do App</span>
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-text-main">2.6.0</span>
                     <button 
                       onClick={checkForUpdates}
                       disabled={isCheckingUpdate}
                       className={cn(
                         "p-1.5 rounded-lg border border-border flex items-center justify-center gap-1.5 transition-all active:scale-95",
                         isCheckingUpdate ? "bg-brand/10 text-brand animate-pulse" : "bg-surface hover:bg-black/5 dark:hover:bg-white/5 text-text-muted hover:text-brand"
                       )}
                       title="Verificar se há novas versões"
                     >
                       <RefreshCcw size={12} className={isCheckingUpdate ? "animate-spin" : ""} />
                       <span className="text-[9px] font-black uppercase tracking-tighter">
                         {isCheckingUpdate ? 'Buscando...' : 'Atualizar'}
                       </span>
                     </button>
                   </div>
                 </div>
                 
                 <div className="flex justify-between items-center border-b border-border pb-3">
                   <span className="text-xs font-bold text-text-muted uppercase">Status do Sistema</span>
                   <span className="text-[10px] font-black uppercase text-green-500 flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Operacional
                   </span>
                 </div>
                 
                 <div className="flex justify-between items-center border-b border-border pb-3">
                   <span className="text-xs font-bold text-text-muted uppercase">Desenvolvedor</span>
                   <span className="text-[10px] font-black text-text-main">Miqueias M</span>
                 </div>

                 <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-text-muted uppercase">Sair da Conta</span>
                   <ConfirmButton 
                    onConfirm={() => logout()}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                   >
                     <LogOut size={18} />
                   </ConfirmButton>
                 </div>
              </div>
           </Card>
         </div>
       ) : (
         <AdminDashboardView />
       )}

      {/* Settings On-Demand PWA Luxury Install Modal */}
      <LuxuryAppInstallModal 
        isOpen={showSettingsInstallModal}
        onClose={() => setShowSettingsInstallModal(false)}
        userName={memberData?.name ? memberData.name.split(' ')[0] : 'Ministro'}
      />
    </motion.div>
  );
}

function AdminDashboardView() {
  const { user } = useAuth();
  const [songs, setSongs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [biblicalSearch, setBiblicalSearch] = useState('');
  const [songSearch, setSongSearch] = useState('');
  const [rankingSearch, setRankingSearch] = useState('');

  const [biblicalPage, setBiblicalPage] = useState(1);
  const [biblicalPerPage, setBiblicalPerPage] = useState(10);

  const [songPage, setSongPage] = useState(1);
  const [songPerPage, setSongPerPage] = useState(10);

  useEffect(() => {
    setBiblicalPage(1);
  }, [biblicalSearch, timeRange]);

  useEffect(() => {
    setSongPage(1);
  }, [songSearch, timeRange]);
  
  const [viewingMember, setViewingMember] = useState<any>(null);
  const [viewingAvailability, setViewingAvailability] = useState<any[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [whatsappAdminPhone, setWhatsappAdminPhone] = useState('');

  const handleViewAvailability = async (member: any) => {
    setViewingMember(member);
    setLoadingAvailability(true);
    setViewingAvailability([]);
    
    try {
      const q = query(
        collection(db, 'availability'),
        where('userId', '==', member.id || member.uid),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => doc.data());
      setViewingAvailability(data);
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const unsubSongs = onSnapshot(collection(db, 'songs'), (snap) => {
      setSongs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'songs');
    });

    const unsubMembers = onSnapshot(collection(db, 'members'), (snap) => {
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'members');
    });

    const unsubServices = onSnapshot(collection(db, 'services'), (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'services');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'notifications'), (snap) => {
      if (snap.exists()) {
        setWhatsappAdminPhone(snap.data().whatsappAdmin || '');
      }
    }, (error) => {
      console.log("Error loading notifications settings for admin dashboard:", error);
    });

    return () => {
      unsubSongs();
      unsubMembers();
      unsubServices();
      unsubSettings();
    };
  }, [user]);

  const filteredServicesByTime = useMemo(() => {
    if (timeRange === 'all') return services;
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(now.getDate() - parseInt(timeRange));
    const thresholdStr = getLocalDateString(threshold);
    return services.filter(s => s.date >= thresholdStr);
  }, [services, timeRange]);

  // Recent activity: members who updated availability recently
  const recentActivity = [...members]
    .filter(m => m.lastAvailabilityUpdate)
    .sort((a, b) => {
      const aTime = a.lastAvailabilityUpdate?.seconds || new Date(a.lastAvailabilityUpdate).getTime() / 1000;
      const bTime = b.lastAvailabilityUpdate?.seconds || new Date(b.lastAvailabilityUpdate).getTime() / 1000;
      return bTime - aTime;
    })
    .slice(0, 5);

  // Data Aggregation
  const songHistory = useMemo(() => {
    const history: { date: string, title: string, serviceTitle: string }[] = [];
    filteredServicesByTime.forEach((service: any) => {
      const seenInService = new Set<string>();
      const serviceSongs = [
        ...(service.setlist || []),
        ...(service.liturgy?.filter((item: any) => item.type === 'song' || item.songId)
           .map((item: any) => item.songId || item.title || item.content) || [])
      ];
      
      serviceSongs.forEach(songRef => {
        if (!songRef) return;
        
        // Search by ID, or by case-insensitive title in the repository
        const songObj = songs.find(s => 
          s.id === songRef || 
          s.title?.toLowerCase().trim() === songRef.toString().toLowerCase().trim()
        );
        
        // Use official title if found, otherwise fallback to the reference string (title/content)
        let songTitle = songRef.toString();
        if (songObj) {
          songTitle = songObj.title;
        } else if (songRef.toString().length > 25 && !songRef.toString().includes(' ')) {
          // If it looks like an ID (long, no spaces) but no song found, it's orphan data we can't display nicely
          // However, if the user says it's missing, maybe it's because of this filter. 
          // We'll keep it for now but be careful.
          return;
        }
        
        if (!seenInService.has(songTitle)) {
          seenInService.add(songTitle);
          history.push({
            date: service.date || '',
            title: songTitle,
            serviceTitle: service.title || 'Culto sem título'
          });
        }
      });
    });
    return history.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [filteredServicesByTime, songs]);

  const filteredSongHistory = useMemo(() => {
    return songHistory.filter(item => 
      item.title.toLowerCase().includes(songSearch.toLowerCase()) ||
      item.serviceTitle.toLowerCase().includes(songSearch.toLowerCase())
    );
  }, [songHistory, songSearch]);

  const totalSongPages = Math.max(1, Math.ceil(filteredSongHistory.length / (songPerPage === -1 ? (filteredSongHistory.length || 1) : songPerPage)));

  const paginatedSongHistory = useMemo(() => {
    if (songPerPage === -1) return filteredSongHistory;
    const start = (songPage - 1) * songPerPage;
    return filteredSongHistory.slice(start, start + songPerPage);
  }, [filteredSongHistory, songPage, songPerPage]);

  const songStats = useMemo(() => {
    const stats: Record<string, number> = {};
    songHistory.forEach(item => {
      stats[item.title] = (stats[item.title] || 0) + 1;
    });
    return stats;
  }, [songHistory]);

  const memberStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredServicesByTime.forEach((service: any) => {
      const scales = service.scales || {};
      Object.values(scales).forEach((memberId: any) => {
        if (!memberId) return;
        const memberObj = members.find(m => m.id === memberId || m.uid === memberId);
        const name = memberObj ? memberObj.name : 'Membro Desconhecido';
        stats[name] = (stats[name] || 0) + 1;
      });
    });
    return stats;
  }, [filteredServicesByTime, members]);

  const memberChartData = Object.entries(memberStats)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const rotationStats = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    const sixMonthsAgoStr = getLocalDateString(sixMonthsAgo);

    const last6MonthsServices = services.filter(s => s.date && s.date >= sixMonthsAgoStr);

    const participationCount: Record<string, number> = {};
    const participationDetails: Record<string, { date: string, title: string, role: string }[]> = {};

    members.forEach(m => {
      const id = m.id || m.uid;
      participationCount[id] = 0;
      participationDetails[id] = [];
    });

    last6MonthsServices.forEach(service => {
      const scales = service.scales || {};
      Object.entries(scales).forEach(([roleKey, memberIdOrArray]: [string, any]) => {
        const memberIds = Array.isArray(memberIdOrArray) ? memberIdOrArray : [memberIdOrArray];
        memberIds.forEach(memberId => {
          if (!memberId) return;
          const m = members.find(x => x.id === memberId || x.uid === memberId);
          if (m) {
            const id = m.id || m.uid;
            participationCount[id] = (participationCount[id] || 0) + 1;
            participationDetails[id].push({
              date: service.date,
              title: service.title || 'Culto',
              role: roleKey
            });
          }
        });
      });
    });

    const list = members.map(m => {
      const id = m.id || m.uid;
      const count = participationCount[id] || 0;
      const history = (participationDetails[id] || []).sort((a, b) => b.date.localeCompare(a.date));
      return {
        id,
        name: m.name || 'Sem Nome',
        count,
        history,
        roles: m.roles || []
      };
    }).sort((a, b) => b.count - a.count);

    const activeInPeriod = list.filter(item => item.count > 0);
    const inactiveInPeriod = list.filter(item => item.count === 0);

    // Calculate rotation index
    let rotationScore = 0;
    let rotationRating = 'Sem dados';
    let rotationColor = 'text-text-muted bg-white/5 border-border';

    if (activeInPeriod.length > 0) {
      const counts = activeInPeriod.map(i => i.count);
      const sum = counts.reduce((a, b) => a + b, 0);
      const mean = sum / counts.length;
      
      if (counts.length > 1) {
        const squaredDiffs = counts.map(c => Math.pow(c - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / counts.length;
        const stdDev = Math.sqrt(variance);
        
        // Coefficient of Variation (lower standard deviation relative to mean is more balanced)
        const cv = mean > 0 ? stdDev / mean : 0;
        // Map coefficient of variation into 100-point rotating health score
        rotationScore = Math.max(0, Math.min(100, Math.round(100 - (cv * 40))));
      } else {
        rotationScore = 100;
      }

      if (rotationScore >= 75) {
        rotationRating = 'Equilibrada';
        rotationColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      } else if (rotationScore >= 45) {
        rotationRating = 'Moderada';
        rotationColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      } else {
        rotationRating = 'Sobrecarga';
        rotationColor = 'text-red-400 bg-red-500/10 border-red-500/20';
      }
    }

    const averageParticipation = activeInPeriod.length > 0 
      ? activeInPeriod.reduce((acc, c) => acc + c.count, 0) / activeInPeriod.length 
      : 0;

    const burnoutRisks = activeInPeriod.filter(item => {
      // High frequency threshold: served more than 8 times in 6 months or significantly above average
      return item.count >= 8 || (item.count >= 5 && item.count > averageParticipation * 1.5);
    });

    return {
      list,
      activeInPeriod,
      inactiveInPeriod,
      servicesCount: last6MonthsServices.length,
      rotationScore,
      rotationRating,
      rotationColor,
      burnoutRisks,
      averageParticipation: parseFloat(averageParticipation.toFixed(1))
    };
  }, [services, members]);

  const biblicalTexts = filteredServicesByTime
    .filter(s => s.liturgy?.some((item: any) => item.type === 'reading'))
    .flatMap(s => {
      return (s.liturgy || [])
        .filter((item: any) => item.type === 'reading')
        .map((item: any) => ({
          date: s.date,
          serviceTitle: s.title,
          text: item.title || item.content
        }));
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const filteredBiblicalTexts = useMemo(() => {
    return biblicalTexts.filter(item => 
      item.text.toLowerCase().includes(biblicalSearch.toLowerCase()) ||
      item.serviceTitle.toLowerCase().includes(biblicalSearch.toLowerCase())
    );
  }, [biblicalTexts, biblicalSearch]);

  const totalBiblicalPages = Math.max(1, Math.ceil(filteredBiblicalTexts.length / (biblicalPerPage === -1 ? (filteredBiblicalTexts.length || 1) : biblicalPerPage)));

  const paginatedBiblicalTexts = useMemo(() => {
    if (biblicalPerPage === -1) return filteredBiblicalTexts;
    const start = (biblicalPage - 1) * biblicalPerPage;
    return filteredBiblicalTexts.slice(start, start + biblicalPerPage);
  }, [filteredBiblicalTexts, biblicalPage, biblicalPerPage]);

  const rankedSongs = useMemo(() => {
    return Object.entries(songStats)
      .map(([name, count]) => {
        const occurrences = songHistory
          .filter(h => h.title === name)
          .map(h => ({ date: h.date, serviceTitle: h.serviceTitle }));
        return { name, count: count as number, occurrences };
      })
      .sort((a, b) => b.count - a.count);
  }, [songStats, songHistory]);

  const filteredRankedSongs = useMemo(() => {
    if (!rankingSearch.trim()) {
      return rankedSongs.slice(0, 8);
    }
    return rankedSongs.filter(item =>
      item.name.toLowerCase().includes(rankingSearch.toLowerCase())
    );
  }, [rankedSongs, rankingSearch]);

  const songsWithKeyIssues = useMemo(() => {
    return songs.filter(s => {
      if (!s.chords || !s.baseKey) return false;
      const detected = detectKey(s.chords);
      if (!detected) return false;
      
      const getBaseNote = (k: string) => k.match(/^([A-G][#b]?)/)?.[1] || k;
      const currentBase = getBaseNote(s.baseKey);
      
      const FLATS_LOCAL: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
      const normCurrent = FLATS_LOCAL[currentBase] || currentBase;
      const normDetected = FLATS_LOCAL[detected] || detected;
      
      return normCurrent !== normDetected;
    });
  }, [songs]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Carregando relatórios...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {!whatsappAdminPhone && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left select-none shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex gap-3.5 items-start">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-amber-500 tracking-wider">Número de WhatsApp Administrativo Ausente ⚠️</p>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Você ainda não configurou um número de WhatsApp principal para receber as notificações automáticas de escala e marcas de disponibilidades dos membros. Por favor, acesse a aba <strong className="text-text-main font-semibold">"Configurações"</strong> no menu lateral/superior e salve seu número no formato de DDI (55) + DDD + Número completo (ex: 5511999999999).
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">Painel de Relatórios</h1>
          <p className="text-text-muted text-sm uppercase tracking-widest font-black mt-1">Visão analítica - Acesso Restrito</p>
        </div>
        
        <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-border self-start">
           {[
             { id: 'all', label: 'Tudo' },
             { id: '30', label: '30 dias' },
             { id: '90', label: '90 dias' },
             { id: '365', label: '1 ano' }
           ].map(opt => (
             <button
               key={opt.id}
               onClick={() => setTimeRange(opt.id)}
               className={cn(
                 "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                 timeRange === opt.id 
                   ? "bg-brand text-white shadow-lg shadow-brand/20" 
                   : "text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5"
               )}
             >
               {opt.label}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-brand/10 border-brand/20">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center">
                <Music2 size={20} />
             </div>
             <div>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Total Músicas</p>
                <h4 className="text-xl font-black text-text-main tracking-tight">{songs.length}</h4>
             </div>
          </div>
        </Card>
        <Card className="p-4 bg-indigo-500/10 border-indigo-500/20">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                <Calendar size={20} />
             </div>
             <div>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Total Cultos</p>
                <h4 className="text-xl font-black text-text-main tracking-tight">{services.length}</h4>
             </div>
          </div>
        </Card>
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                <Users size={20} />
             </div>
             <div>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Total Equipe</p>
                <h4 className="text-xl font-black text-text-main tracking-tight">{members.length}</h4>
             </div>
          </div>
        </Card>
        <Card className="p-4 bg-amber-500/10 border-amber-500/20">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <Activity size={20} />
             </div>
             <div>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">No Período</p>
                <h4 className="text-xl font-black text-text-main tracking-tight">
                  {filteredServicesByTime.length} <span className="text-[10px] text-text-muted opacity-60">cultos</span>
                </h4>
             </div>
          </div>
        </Card>
      </div>

      {/* Top Section with Bar Chart */}
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-8 bg-card border-border shadow-xl">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
                    <BarChart2 size={24} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest leading-none">Ranking de Músicas</h3>
                    <p className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-wider">Músicas mais ministradas no período</p>
                 </div>
              </div>

              <div className="relative w-full sm:w-64">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                 <input 
                   type="text"
                   placeholder="Pesquisar música no ranking..."
                   value={rankingSearch}
                   onChange={e => setRankingSearch(e.target.value)}
                   className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-lg pl-9 pr-4 py-2 text-[10px] sm:text-xs text-text-main focus:outline-none focus:border-brand/50 transition-all placeholder:text-text-muted/50"
                 />
                 {rankingSearch && (
                   <button 
                     onClick={() => setRankingSearch('')}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                   >
                     <X size={12} />
                   </button>
                 )}
              </div>
           </div>

           <div className="space-y-6">
              {filteredRankedSongs.length > 0 ? filteredRankedSongs.map((stat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-start px-1">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <span className="text-[10px] font-black text-text-muted w-4">{i + 1}</span>
                       <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-text-main truncate pr-4">{stat.name}</span>
                          {stat.occurrences && stat.occurrences.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] uppercase font-black text-text-muted mr-1">Usos:</span>
                              {stat.occurrences.map((occ, oIdx) => {
                                const dStr = occ.date ? formatDate(occ.date) : '';
                                if (!dStr || dStr === 'Data Inválida') return null;
                                return (
                                  <span 
                                    key={oIdx} 
                                    className="text-xs font-mono font-bold px-2 py-1 rounded bg-black/10 dark:bg-white/10 text-text-muted border border-border/40 leading-none" 
                                    title={`${dStr} - ${occ.serviceTitle}`}
                                  >
                                    {dStr}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                       </div>
                    </div>
                    <span className="text-[11px] font-black text-brand bg-brand/10 px-3 py-1 rounded-full border border-brand/10 leading-none shrink-0">
                      {stat.count} {stat.count === 1 ? 'vez' : 'vezes'}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-border shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(stat.count / (rankedSongs[0]?.count || 1)) * 100}%` }}
                      transition={{ duration: 1.5, ease: "circOut", delay: i * 0.1 }}
                      className="h-full bg-gradient-to-r from-brand to-cyan-400 rounded-full shadow-lg" 
                    />
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl">
                   <p className="text-sm text-text-muted font-black uppercase tracking-widest italic">
                     {rankingSearch ? `Nenhuma música encontrada para "${rankingSearch}"` : "Sem dados de músicas para o período selecionado."}
                   </p>
                </div>
              )}
           </div>
        </Card>

        <Card className="lg:col-span-1 p-8 border-brand/20 bg-brand/5 dark:bg-white/5 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-brand" /> Atividade Recente
            </h3>
          </div>
          <div className="space-y-4 grow">
            {recentActivity.length > 0 ? recentActivity.map((member, idx) => (
              <button 
                key={idx} 
                onClick={() => handleViewAvailability(member)}
                className="w-full text-left bg-card p-3 rounded-xl border border-border hover:border-brand/60 hover:bg-brand/5 transition-all flex items-center gap-3 shadow-sm group/item h-[60px]"
              >
                <div className="w-10 h-10 rounded-xl bg-brand/10 group-hover/item:bg-brand group-hover/item:text-white transition-all flex items-center justify-center text-brand font-black shrink-0">
                  {member.name?.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-text-main truncate group-hover/item:text-brand transition-colors">{member.name}</p>
                  <p className="text-[9px] text-text-muted uppercase font-bold tracking-tighter">Ver disponibilidade</p>
                </div>
                <div className="ml-auto text-[9px] text-text-muted font-black italic pr-1">
                  {member.lastAvailabilityUpdate?.toDate ? 
                    new Date(member.lastAvailabilityUpdate.toDate()).toLocaleDateString('pt-BR') :
                    new Date(member.lastAvailabilityUpdate).toLocaleDateString('pt-BR')
                  }
                </div>
              </button>
            )) : (
              <div className="py-12 text-center text-text-muted text-[9px] font-black uppercase tracking-widest italic opacity-50">
                Sem atividade registrada
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Seção de Análise de Frequência e Rotatividade de Membros (Últimos 6 Meses) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-text-main tracking-tight">Análise de Escala & Rotatividade</h2>
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-black mt-1">
            Auditoria de frequência e revezamento do time nos últimos 6 meses
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gráfico de Barras de Frequência */}
          <Card className="lg:col-span-2 p-8 bg-card border-border shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
                    <BarChart2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest leading-none">Frequência de Ministrações</h3>
                    <p className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-wider">Histórico individual de escalas</p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[10px] text-text-muted font-black uppercase tracking-wider bg-black/10 dark:bg-white/10 px-2 py-1 rounded">
                    {rotationStats.servicesCount} Cultos no Período
                  </span>
                </div>
              </div>

              {rotationStats.activeInPeriod.length > 0 ? (
                <div className="h-[360px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart 
                      data={rotationStats.activeInPeriod.map(p => ({
                        name: p.name,
                        "Ministrações": p.count
                      }))} 
                      layout="vertical" 
                      margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} horizontal={false} />
                      <XAxis type="number" stroke="currentColor" strokeOpacity={0.2} tickLine={false} axisLine={false} className="text-text-muted text-[9px]" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="currentColor" 
                        fontSize={10} 
                        width={110} 
                        axisLine={false}
                        tickLine={false}
                        className="text-text-main font-bold"
                      />
                      <ReTooltip 
                        cursor={{ fill: 'currentColor', fillOpacity: 0.03 }}
                        contentStyle={{ 
                          backgroundColor: 'var(--color-surface)', 
                          border: '1px solid var(--color-border)', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          boxShadow: '0 10px 15px -10px rgba(0,0,0,0.3)', 
                          color: 'var(--color-text-main)' 
                        }}
                        itemStyle={{ color: '#8b5cf6', fontWeight: 'black' }}
                      />
                      <Bar dataKey="Ministrações" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={12}>
                        {rotationStats.activeInPeriod.map((_, index) => (
                          <Cell key={`cell-${index}`} fillOpacity={Math.max(0.3, 1 - (index * 0.05))} />
                        ))}
                      </Bar>
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-24 text-center border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center space-y-2">
                  <Users size={32} className="text-text-muted/30" />
                  <p className="text-xs text-text-muted font-black uppercase tracking-widest italic pr-1">
                    Nenhuma escala registrada nos últimos 6 meses.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Sidebar de Métricas de Rotatividade */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card className="p-6 bg-card border-border flex flex-col justify-between h-full space-y-6">
              {/* Rotation Health Index */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-black text-text-muted uppercase tracking-wider">Índice de Rotatividade</h4>
                  <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border", rotationStats.rotationColor)}>
                    {rotationStats.rotationRating}
                  </span>
                </div>
                
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl font-black tracking-tighter text-text-main">{rotationStats.rotationScore}%</span>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none font-mono">de equilíbrio</span>
                </div>
                
                <div className="w-full bg-black/10 dark:bg-white/5 h-2 rounded-full overflow-hidden border border-border mb-3">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${rotationStats.rotationScore}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      rotationStats.rotationScore >= 75 ? "bg-emerald-500" :
                      rotationStats.rotationScore >= 45 ? "bg-amber-500" : "bg-red-500"
                    )}
                  />
                </div>
                
                <p className="text-[10px] leading-relaxed text-text-muted font-bold uppercase tracking-tight">
                  Mede a igualdade na divisão de papéis. Escores altos mostram excelente engajamento coletivo, evitando a estafa e sobrecarga de poucas pessoas.
                </p>
              </div>

              {/* Burnout Risks / Alertas */}
              <div className="pt-4 border-t border-border/50">
                <h5 className="text-[10px] font-black text-text-main uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-amber-500" /> Risco de Overload / Sobrecarga
                </h5>
                
                {rotationStats.burnoutRisks.length > 0 ? (
                  <div className="space-y-1.5">
                    {rotationStats.burnoutRisks.slice(0, 3).map((b, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 text-[10px]">
                        <span className="font-extrabold text-text-main truncate max-w-[125px]">{b.name}</span>
                        <span className="font-black text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded uppercase font-mono text-[9px]">
                          {b.count} escalas
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[9px] font-black text-center text-emerald-400 uppercase tracking-widest">
                    Escalas balanceadas! Sem sobrecarga
                  </div>
                )}
              </div>

              {/* Inactive Members List */}
              <div className="pt-4 border-t border-border/50">
                <h5 className="text-[10px] font-black text-text-main uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Users size={12} className="text-text-muted" /> Sem Escalar no Período ({rotationStats.inactiveInPeriod.length})
                </h5>
                
                {rotationStats.inactiveInPeriod.length > 0 ? (
                  <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {rotationStats.inactiveInPeriod.map((m, idx) => {
                      const rolesList = m.roles || [];
                      const rolesStr = rolesList.slice(0, 2).join(', ');
                      return (
                        <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-border text-[10px]">
                          <div className="min-w-0 pr-2">
                            <p className="font-extrabold text-text-main truncate">{m.name}</p>
                            {rolesStr && <p className="text-[8px] text-text-muted truncate uppercase tracking-tight">{rolesStr}</p>}
                          </div>
                          <span className="text-[8px] font-black text-text-muted uppercase tracking-widest bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded shrink-0">
                            0 escalas
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[9px] font-black text-center text-indigo-400 uppercase tracking-widest">
                    100% dos voluntários atuando!
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Biblical Texts Table */}
        <Card className="lg:col-span-2 overflow-hidden border-border bg-card shadow-xl">
          <div className="p-4 sm:p-6 border-b border-border bg-brand/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-brand shrink-0" />
              <div>
                <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest leading-none">Histórico de Leituras</h3>
                <p className="text-[9px] text-text-muted mt-1 uppercase font-bold tracking-tighter">{filteredBiblicalTexts.length} registros</p>
              </div>
            </div>
            
            <div className="relative w-full sm:w-64">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
               <input 
                 type="text"
                 placeholder="Filtrar por texto ou culto..."
                 value={biblicalSearch}
                 onChange={e => setBiblicalSearch(e.target.value)}
                 className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-lg pl-9 pr-4 py-2 text-[10px] sm:text-xs text-text-main focus:outline-none focus:border-brand/50 transition-all placeholder:text-text-muted/50"
               />
               {biblicalSearch && (
                 <button 
                   onClick={() => setBiblicalSearch('')}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                 >
                   <X size={12} />
                 </button>
               )}
            </div>
          </div>
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="bg-black/5 dark:bg-white/5">
                  <th className="py-3 px-6 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Data</th>
                  <th className="py-3 px-6 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Texto/Referência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedBiblicalTexts.length > 0 ? paginatedBiblicalTexts.map((item, idx) => (
                  <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-6 text-[10px] font-black text-white whitespace-nowrap">
                      <span className="bg-brand px-2 py-1 rounded border border-white/20 shadow-sm">
                        {new Date(item.date).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs italic text-text-main">
                      <div className="flex items-start gap-2">
                        <Quote size={12} className="text-brand mt-0.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span>{item.text}</span>
                      </div>
                      <p className="text-[9px] text-text-muted mt-1 uppercase font-bold">{item.serviceTitle}</p>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={2} className="py-12 text-center text-[10px] text-text-muted uppercase font-black tracking-widest italic">
                       Nenhum resultado encontrado para "{biblicalSearch}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer de Paginação e Carregar Mais */}
          {filteredBiblicalTexts.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-border bg-black/5 dark:bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-text-muted font-bold">
              <div className="flex items-center gap-2">
                <span>Exibir:</span>
                <select
                  value={biblicalPerPage}
                  onChange={(e) => {
                    setBiblicalPerPage(Number(e.target.value));
                    setBiblicalPage(1);
                  }}
                  className="bg-card border border-border rounded-lg px-2.5 py-1 text-[10px] font-bold text-text-main focus:outline-none focus:border-brand transition-all cursor-pointer"
                >
                  <option value={5}>5 por pág.</option>
                  <option value={10}>10 por pág.</option>
                  <option value={20}>20 por pág.</option>
                  <option value={50}>50 por pág.</option>
                  <option value={-1}>Todos ({filteredBiblicalTexts.length})</option>
                </select>
                <span className="hidden sm:inline text-text-muted">
                  • Mostrando {Math.min((biblicalPage - 1) * (biblicalPerPage === -1 ? filteredBiblicalTexts.length : biblicalPerPage) + 1, filteredBiblicalTexts.length)}–
                  {Math.min(biblicalPage * (biblicalPerPage === -1 ? filteredBiblicalTexts.length : biblicalPerPage), filteredBiblicalTexts.length)} de {filteredBiblicalTexts.length}
                </span>
              </div>

              {biblicalPerPage !== -1 && (
                <div className="flex items-center gap-2">
                  {totalBiblicalPages > 1 && (
                    <>
                      <button
                        onClick={() => setBiblicalPage(p => Math.max(1, p - 1))}
                        disabled={biblicalPage === 1}
                        className="p-1.5 rounded-lg border border-border bg-card text-text-main hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                        title="Página Anterior"
                      >
                        <ChevronLeft size={14} />
                        <span className="hidden sm:inline text-[9px] uppercase font-black">Anterior</span>
                      </button>

                      <span className="text-[10px] font-mono font-black text-text-main px-2">
                        {biblicalPage} / {totalBiblicalPages}
                      </span>

                      <button
                        onClick={() => setBiblicalPage(p => Math.min(totalBiblicalPages, p + 1))}
                        disabled={biblicalPage === totalBiblicalPages}
                        className="p-1.5 rounded-lg border border-border bg-card text-text-main hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                        title="Próxima Página"
                      >
                        <span className="hidden sm:inline text-[9px] uppercase font-black">Próximo</span>
                        <ChevronRight size={14} />
                      </button>
                    </>
                  )}

                  {biblicalPage * biblicalPerPage < filteredBiblicalTexts.length && (
                    <button
                      onClick={() => setBiblicalPerPage(prev => prev + 10)}
                      className="ml-1 px-2.5 py-1 rounded-lg bg-brand/10 border border-brand/20 text-brand hover:bg-brand hover:text-white transition-all text-[9px] uppercase font-black"
                    >
                      + Carregar mais 10
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="lg:col-span-2 overflow-hidden border-border bg-card">
          <div className="p-4 sm:p-6 border-b border-border bg-brand/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Music2 size={16} className="text-brand shrink-0" />
              <div>
                <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest leading-none">HISTÓRICO DE MÚSICAS</h3>
                <p className="text-[9px] text-text-muted mt-1 uppercase font-bold tracking-tighter">{filteredSongHistory.length} registros</p>
              </div>
            </div>
            
            <div className="relative w-full sm:w-64">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
               <input 
                 type="text"
                 placeholder="Filtrar por música ou culto..."
                 value={songSearch}
                 onChange={e => setSongSearch(e.target.value)}
                 className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-lg pl-9 pr-4 py-2 text-[10px] sm:text-xs text-text-main focus:outline-none focus:border-brand/50 transition-all placeholder:text-text-muted/50"
               />
               {songSearch && (
                 <button 
                   onClick={() => setSongSearch('')}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                 >
                   <X size={12} />
                 </button>
               )}
            </div>
          </div>
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="bg-black/5 dark:bg-white/5">
                  <th className="py-3 px-6 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Data</th>
                  <th className="py-3 px-6 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Música</th>
                  <th className="py-3 px-6 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Culto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedSongHistory.length > 0 ? paginatedSongHistory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-6 text-[10px] font-black text-white whitespace-nowrap">
                      <span className="bg-brand px-2 py-1 rounded border border-white/20 shadow-sm">
                        {new Date(item.date).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-main">{item.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[10px] text-text-muted italic">
                      {item.serviceTitle}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-[10px] text-text-muted uppercase font-black tracking-[0.2em] italic">
                       {songSearch ? `Nenhuma música encontrada para "${songSearch}"` : "Sem dados de músicas"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer de Paginação e Carregar Mais */}
          {filteredSongHistory.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-border bg-black/5 dark:bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-text-muted font-bold">
              <div className="flex items-center gap-2">
                <span>Exibir:</span>
                <select
                  value={songPerPage}
                  onChange={(e) => {
                    setSongPerPage(Number(e.target.value));
                    setSongPage(1);
                  }}
                  className="bg-card border border-border rounded-lg px-2.5 py-1 text-[10px] font-bold text-text-main focus:outline-none focus:border-brand transition-all cursor-pointer"
                >
                  <option value={5}>5 por pág.</option>
                  <option value={10}>10 por pág.</option>
                  <option value={20}>20 por pág.</option>
                  <option value={50}>50 por pág.</option>
                  <option value={-1}>Todos ({filteredSongHistory.length})</option>
                </select>
                <span className="hidden sm:inline text-text-muted">
                  • Mostrando {Math.min((songPage - 1) * (songPerPage === -1 ? filteredSongHistory.length : songPerPage) + 1, filteredSongHistory.length)}–
                  {Math.min(songPage * (songPerPage === -1 ? filteredSongHistory.length : songPerPage), filteredSongHistory.length)} de {filteredSongHistory.length}
                </span>
              </div>

              {songPerPage !== -1 && (
                <div className="flex items-center gap-2">
                  {totalSongPages > 1 && (
                    <>
                      <button
                        onClick={() => setSongPage(p => Math.max(1, p - 1))}
                        disabled={songPage === 1}
                        className="p-1.5 rounded-lg border border-border bg-card text-text-main hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                        title="Página Anterior"
                      >
                        <ChevronLeft size={14} />
                        <span className="hidden sm:inline text-[9px] uppercase font-black">Anterior</span>
                      </button>

                      <span className="text-[10px] font-mono font-black text-text-main px-2">
                        {songPage} / {totalSongPages}
                      </span>

                      <button
                        onClick={() => setSongPage(p => Math.min(totalSongPages, p + 1))}
                        disabled={songPage === totalSongPages}
                        className="p-1.5 rounded-lg border border-border bg-card text-text-main hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                        title="Próxima Página"
                      >
                        <span className="hidden sm:inline text-[9px] uppercase font-black">Próximo</span>
                        <ChevronRight size={14} />
                      </button>
                    </>
                  )}

                  {songPage * songPerPage < filteredSongHistory.length && (
                    <button
                      onClick={() => setSongPerPage(prev => prev + 10)}
                      className="ml-1 px-2.5 py-1 rounded-lg bg-brand/10 border border-brand/20 text-brand hover:bg-brand hover:text-white transition-all text-[9px] uppercase font-black"
                    >
                      + Carregar mais 10
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Members chart */}
        <Card className="p-6 h-full">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
              <Users size={14} className="text-brand" /> Participação de Membros
            </h3>
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Top 10</span>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={memberChartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="currentColor" 
                  fontSize={9} 
                  width={100} 
                  axisLine={false}
                  tickLine={false}
                  className="text-text-muted"
                />
                <ReTooltip 
                  cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
                  contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: 'var(--color-text-main)' }}
                  itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16}>
                  {memberChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.07)} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {viewingMember && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center text-white text-xl font-black shadow-lg shadow-brand/20">
                    {viewingMember.name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-main leading-tight">{viewingMember.name}</h2>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Datas Disponíveis</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingMember(null)}
                  className="p-2 text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all"
                >
                  <X size={24}/>
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-surface space-y-6">
                {loadingAvailability ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <RefreshCcw size={32} className="text-brand animate-spin" />
                    <p className="text-xs font-black text-text-muted uppercase tracking-widest">Buscando datas...</p>
                  </div>
                ) : viewingAvailability.length > 0 ? (
                  (() => {
                    const grouped: Record<string, any[]> = {};
                    viewingAvailability
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
                        <div className="text-center py-20 bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-border">
                          <Calendar size={48} className="mx-auto text-text-muted/30 mb-4" />
                          <p className="text-sm font-black text-text-muted uppercase tracking-widest">Nenhuma data disponível marcada.</p>
                        </div>
                      );
                    }

                    return monthEntries.map(([month, dates]) => (
                      <div key={month} className="space-y-3">
                        <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] pl-1">{month}</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {dates.sort((a, b) => a.date.localeCompare(b.date)).map((d, i) => {
                            const dateObj = new Date(d.date + 'T00:00');
                            return (
                              <div key={i} className="flex flex-col p-3 bg-black/5 dark:bg-white/5 border border-border rounded-xl">
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
                  <div className="text-center py-20 bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-border">
                    <Calendar size={48} className="mx-auto text-text-muted/30 mb-4" />
                    <p className="text-sm font-black text-text-muted uppercase tracking-widest">Nenhuma data marcada.</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-border bg-black/5 dark:bg-white/5 flex justify-center">
                <Button onClick={() => setViewingMember(null)} variant="secondary" className="px-8 font-black uppercase text-[10px] tracking-widest">
                  Fechar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Song Key Audit Section */}
      {songsWithKeyIssues.length > 0 && (
        <Card className="p-8 border-amber-500/30 bg-amber-500/5">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500">
                 <Sparkles size={24} />
              </div>
              <div>
                 <h3 className="text-sm font-black text-text-main uppercase tracking-widest leading-none">Auditoria de Músicas</h3>
                 <p className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-wider">Músicas com possível divergência entre cabeçalho e cifra</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {songsWithKeyIssues.map(s => {
                const detected = detectKey(s.chords);
                return (
                  <div key={s.id} className="p-4 bg-white/5 border border-border rounded-xl flex items-center justify-between group">
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-text-main truncate">{s.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black uppercase text-red-400 bg-red-400/10 px-2 py-0.5 rounded">Cabeçalho: <span className="normal-case">{s.baseKey}</span></span>
                        <span className="text-[9px] font-black uppercase text-green-400 bg-green-400/10 px-2 py-0.5 rounded">Detectado: <span className="normal-case">{detected}</span></span>
                      </div>
                    </div>
                    <ConfirmButton 
                      title="Fix Key"
                      onConfirm={async () => {
                        if (detected) {
                          await updateDoc(doc(db, 'songs', s.id), { baseKey: detected });
                        }
                      }}
                      className="p-2 bg-brand/10 text-brand rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-brand/20"
                    >
                      <Check size={16} />
                    </ConfirmButton>
                  </div>
                );
              })}
           </div>
        </Card>
      )}

      {/* Participation Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-12">
        <StatCard label="Total de Cultos" value={services.length} icon={<Calendar size={16}/>} color="brand" />
        <StatCard label="Músicas Únicas" value={songs.length} icon={<Music2 size={16}/>} color="purple" />
        <StatCard label="Membros Ativos" value={members.length} icon={<Users size={16}/>} color="green" />
        <StatCard label="Leituras Totais" value={biblicalTexts.length} icon={<BookOpen size={16}/>} color="orange" />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  const colors: any = {
    brand: "text-brand border-brand/20 bg-brand/5 shadow-brand/10",
    purple: "text-purple-400 border-purple-500/20 bg-purple-500/5 shadow-purple-500/10",
    green: "text-green-400 border-green-500/20 bg-green-500/5 shadow-green-500/10",
    orange: "text-orange-400 border-orange-500/20 bg-orange-500/5 shadow-orange-500/10",
    cyan: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5 shadow-cyan-500/10"
  };

  return (
    <Card className={cn("p-5 border flex flex-col items-center justify-center gap-2", colors[color])}>
      <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 mb-1">
        {icon}
      </div>
      <div className="text-2xl font-black tracking-tighter">{value}</div>
      <div className="text-[9px] font-black uppercase tracking-widest opacity-60 text-center">{label}</div>
    </Card>
  );
}
                
                
