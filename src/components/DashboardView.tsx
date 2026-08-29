import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { getServicePlaylistSongs } from '../utils/servicePlaylistUtils';
import { COLOR_PRESETS } from '../App';
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
  AlertTriangle, Smartphone, Columns, Mic, MicOff, Loader2, GraduationCap, Camera, Gift, Baby, HelpCircle, Compass
} from 'lucide-react';
import { Music2 } from './MusicIcon';
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
import { transposeLyricsAndChords, transposeChord, isChordLine, detectKey, isChordWord, parseChordLineIntoTokens, getCleanChordName, cleanTablatures } from '../services/chordService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BibleSearch } from './BibleSearch';
import { ProjectorDisplay } from './ProjectorDisplay';
import { ProjectionView } from './ProjectionView';
import { ChatView } from './ChatView';
import { ChordDictionaryModal, ChordDictionaryCard } from './ChordDictionary';
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
import { WelcomeTourModal } from './WelcomeTourModal';


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


function QuickLink({ icon, label, subtitle, color, onClick }: { icon: React.ReactNode, label: string, subtitle?: string | React.ReactNode, color: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("p-4 sm:p-6 rounded-2xl flex flex-col items-start justify-center gap-2 sm:gap-3 transition-all border shadow-lg hover:shadow-2xl active:scale-95 group text-left w-full", color)}>
      <div className="p-2 sm:p-3 rounded-xl bg-black/5 dark:bg-white/20 group-hover:bg-black/10 dark:group-hover:bg-white/30 transition-all shadow-sm text-text-main">
        {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
      </div>
      <div>
        <span className="block text-lg sm:text-2xl font-black tracking-tight text-text-main">{label}</span>
        {subtitle && (
          <p className="text-[11px] font-black uppercase tracking-wider text-text-muted mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
}

function TimeSignatureDisplay({ value, className }: { value: string, className?: string }) {
  if (!value || !value.includes('/')) return <span className={className}>{value}</span>;
  const [num, den] = value.split('/');
  return (
    <div className={cn("inline-flex flex-col items-center leading-[0.7] text-center", className)}>
      <span className="text-[15px] font-black">{num}</span>
      <div className="w-3 h-[1.5px] bg-current opacity-40 my-[2px]" />
      <span className="text-[15px] font-black">{den}</span>
    </div>
  );
}

// Main Component Export

export default function DashboardView({ 
  onNavigate, 
  onOpenSong,
  createNotifications,
  setShowLiturgySongs,
  theme,
  allSongs = [],
  onStartPlaylist
}: { 
  onNavigate: (tab: any) => void, 
  onOpenSong?: (songId: string) => void,
  createNotifications: (title: string, content: string, type: 'announcement' | 'mural' | 'service' | 'general', excludeUserId?: string, preferenceKey?: 'notifyNewSongs' | 'notifyScheduleChanges' | 'notifyDayBeforeReminder' | 'notifyNewLiturgy') => Promise<void>,
  setShowLiturgySongs?: (show: boolean) => void,
  theme: 'dark' | 'light',
  allSongs?: any[],
  onStartPlaylist?: (songs: any[]) => void
}) {
  const { user, memberData, isAdmin, churchData } = useAuth();
  const userChurchId = memberData?.churchId || 'semente';
  const [nextService, setNextService] = useState<any>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const card = document.querySelector('.next-service-card');
      if (card) {
        const rect = card.getBoundingClientRect();
        setShowStickyHeader(rect.bottom < 60);
      } else {
        setShowStickyHeader(window.scrollY > 280);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [nextService]);

  const homeServicePlaylistSongs = useMemo(() => {
    return getServicePlaylistSongs(nextService, allSongs);
  }, [nextService, allSongs]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isEditingAnnouncements, setIsEditingAnnouncements] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [muralItems, setMuralItems] = useState<any[]>([]);
  const [newMuralText, setNewMuralText] = useState('');
  const [newMuralType, setNewMuralType] = useState<'sugestao' | 'ideia' | 'necessidade' | 'oracao' | 'outro'>('sugestao');
  const [isAddingMural, setIsAddingMural] = useState(false);
  const [replyingItemId, setReplyingItemId] = useState<string | null>(null);
  const [muralReplyText, setMuralReplyText] = useState('');
  const [songCount, setSongCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [dashboardMembers, setDashboardMembers] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('dismissed_leader_onboarding') !== 'true';
  });
  const [showMemberTour, setShowMemberTour] = useState(false);

  useEffect(() => {
    // Check if new member should see welcome tour (non-admin or new user who hasn't seen it)
    if (!isAdmin && memberData) {
      const dismissedLocal = localStorage.getItem('liloupro_member_tour_completed') === 'true';
      if (!dismissedLocal && !memberData?.memberTourCompleted) {
        setShowMemberTour(true);
      }
    }
  }, [isAdmin, memberData]);

  useEffect(() => {
    if (memberData?.dismissedOnboarding === true) {
      setShowOnboarding(false);
    } else if (churchData && churchData.name && churchData.name.toLowerCase() !== 'semente') {
      setShowOnboarding(false);
      localStorage.setItem('dismissed_leader_onboarding', 'true');
      if (user && memberData && memberData.dismissedOnboarding !== true) {
        updateDoc(doc(db, 'members', user.uid), { dismissedOnboarding: true }).catch(err => {
          console.error("Erro ao silenciar onboarding:", err);
        });
      }
    }
  }, [memberData, churchData, user]);
  const [isRestoring, setIsRestoring] = useState(false);

  const today = new Date();
  const currentMonthNum = today.getMonth() + 1;
  const currentDayNum = today.getDate();

  const getIsBirthdayToday = (birthDateStr?: string) => {
    if (!birthDateStr) return false;
    const parts = birthDateStr.split('-');
    if (parts.length < 3) return false;
    const [_, m, d] = parts;
    return parseInt(m, 10) === currentMonthNum && parseInt(d, 10) === currentDayNum;
  };

  const currentLoggedMember = dashboardMembers.find(m => m.id === user?.uid || m.uid === user?.uid);
  const isUserBirthdayToday = currentLoggedMember ? getIsBirthdayToday(currentLoggedMember.birthDate) : false;

  const birthdaysCurrentMonth = dashboardMembers
    .filter(m => {
      if (!m.birthDate) return false;
      const parts = m.birthDate.split('-');
      if (parts.length < 3) return false;
      return parseInt(parts[1], 10) === currentMonthNum;
    })
    .sort((a, b) => {
      const dayA = parseInt(a.birthDate.split('-')[2], 10);
      const dayB = parseInt(b.birthDate.split('-')[2], 10);
      return dayA - dayB;
    });

  const handleRestoreSementeHistory = async () => {
    if (!user) return;
    const currentName = churchData?.name || 'Minha Igreja';
    
    const confirmMessage = `Você deseja restaurar seu histórico de músicas, membros e cultos? \n\nIsso irá:\n1. Trazer de volta todas as suas músicas, integrantes e cultos antigos.\n2. Definir o nome de sua igreja atual ("${currentName}") na igreja principal.\n3. Recarregar o aplicativo para aplicar as mudanças.\n\nQuer continuar?`;
    
    if (!window.confirm(confirmMessage)) return;
    
    setIsRestoring(true);
    try {
      // 1. Rename 'semente' church name to this customized church name
      const sementeChurchRef = doc(db, 'churches', 'semente');
      await setDoc(sementeChurchRef, {
        name: currentName,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      }, { merge: true });
      
      // 2. Point leader's member record back to 'semente'
      const memberRef = doc(db, 'members', user.uid);
      await updateDoc(memberRef, {
        churchId: 'semente',
        isAdmin: true,
        dismissedOnboarding: true
      });
      localStorage.setItem('dismissed_leader_onboarding', 'true');
      
      alert(`Histórico restaurado com sucesso! A igreja "${currentName}" foi restabelecida com todas as suas músicas e membros.`);
      window.location.reload();
    } catch (err) {
      console.error("Erro ao recuperar histórico:", err);
      alert("Não foi possível restaurar os dados de forma automatizada.");
    } finally {
      setIsRestoring(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const servicePath = 'services';
    const q = query(collection(db, servicePath), orderBy('date', 'desc'));
    const unsubServices = onSnapshot(q, (snap) => {
      const services = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const filtered = services.filter((s: any) => s.churchId === userChurchId || (!s.churchId && userChurchId === 'semente'));
      setAllServices(filtered);
      const nowString = getLocalDateTimeString();
      const nowDay = nowString.split('T')[0];
      
      const future = filtered
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
          return sDay === nowDay || s._serviceDateStr >= nowString;
        })
        .sort((a: any, b: any) => a._serviceDateStr.localeCompare(b._serviceDateStr));
      
      setNextService(future[0] || null);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, servicePath);
    });

    const annPath = 'announcements';
    const annQ = query(collection(db, annPath));
    const unsubAnn = onSnapshot(annQ, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter((item: any) => item.churchId === userChurchId || (!item.churchId && userChurchId === 'semente'))
        .sort((a: any, b: any) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return timeA - timeB; // Announcements sorted asc
        });
      setAnnouncements(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, annPath);
    });

    const muralPath = 'mural';
    const muralQ = query(collection(db, muralPath));
    const unsubMural = onSnapshot(muralQ, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter((item: any) => item.churchId === userChurchId || (!item.churchId && userChurchId === 'semente'))
        .sort((a: any, b: any) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return timeB - timeA; // Mural sorted desc
        });
      setMuralItems(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, muralPath);
    });

    const songPath = 'songs';
    const unsubSongs = onSnapshot(collection(db, songPath), (snap) => {
      const count = snap.docs.map(doc => doc.data() as any)
        .filter((s: any) => s.churchId === userChurchId || (!s.churchId && userChurchId === 'semente')).length;
      setSongCount(count);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, songPath);
    });

    const memberPath = 'members';
    const unsubMembers = onSnapshot(collection(db, memberPath), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter((m: any) => m.churchId === userChurchId || (!m.churchId && userChurchId === 'semente'));
      setDashboardMembers(list);
      setMemberCount(list.length);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, memberPath);
    });

    return () => {
      unsubServices();
      unsubAnn();
      unsubMural();
      unsubSongs();
      unsubMembers();
    };
  }, [user, userChurchId]);

  // Limpeza automática do Mural (itens com mais de uma semana)
  useEffect(() => {
    if (!user || !isAdmin) return;
    
    const cleanupMural = async () => {
      try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const q = query(
          collection(db, 'mural'),
          where('createdAt', '<', Timestamp.fromDate(oneWeekAgo))
        );
        
        const snap = await getDocs(q);
        if (!snap.empty) {
          const deletions = snap.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deletions);
        }
      } catch (error) {
        console.error("Mural cleanup error:", error);
      }
    };

    cleanupMural();
  }, [user, isAdmin]);

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        text: newAnnouncement,
        createdAt: serverTimestamp(),
        color: ['brand', 'amber-500', 'purple-500'][announcements.length % 3],
        churchId: userChurchId
      });
      
      // Trigger notification
      await createNotifications(
        "Novo Aviso",
        newAnnouncement,
        'announcement',
        user?.uid
      );

      setNewAnnouncement('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'announcements');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
    }
  };

  const handleAddMuralItem = async () => {
    if (!newMuralText.trim() || !user) return;
    try {
      await addDoc(collection(db, 'mural'), {
        text: newMuralText,
        type: newMuralType,
        authorId: user.uid,
        authorName: memberData?.name || user.displayName || 'Membro',
        createdAt: serverTimestamp(),
        churchId: userChurchId
      });

      // Trigger notification
      const authorName = memberData?.name || user.displayName || 'Alguém';
      await createNotifications(
        `${authorName} postou no Mural`,
        newMuralText,
        'mural',
        user.uid
      );

      setNewMuralText('');
      setIsAddingMural(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'mural');
    }
  };

  const handleDeleteMuralItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'mural', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `mural/${id}`);
    }
  };

  const handleReplyMuralItem = async (id: string) => {
    if (!muralReplyText.trim() || !user) return;
    try {
      await updateDoc(doc(db, 'mural', id), {
        reply: muralReplyText,
        repliedBy: memberData?.name || user.displayName || 'Administrador',
        repliedAt: Date.now() // Use simple timestamp for easy formatting or serverTimestamp
      });
      setMuralReplyText('');
      setReplyingItemId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `mural/${id}`);
    }
  };

  const handleRemoveMuralReply = async (id: string) => {
    try {
      await updateDoc(doc(db, 'mural', id), {
        reply: deleteField(),
        repliedBy: deleteField(),
        repliedAt: deleteField()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `mural/${id}`);
    }
  };

  const adjustColorBrightness = (hex: string, percent: number) => {
    let h = hex.replace('#', '');
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    let R = parseInt(h.substring(0, 2), 16) || 0;
    let G = parseInt(h.substring(2, 4), 16) || 0;
    let B = parseInt(h.substring(4, 6), 16) || 0;

    R = Math.max(0, Math.min(255, Math.floor(R * (1 + percent / 100))));
    G = Math.max(0, Math.min(255, Math.floor(G * (1 + percent / 100))));
    B = Math.max(0, Math.min(255, Math.floor(B * (1 + percent / 100))));

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  };

  const currentThemeKey = churchData?.themeColor || 'navy';
  const currentTheme = COLOR_PRESETS[currentThemeKey] || COLOR_PRESETS.navy;
  const isCustomTheme = currentThemeKey === 'custom';
  
  let primaryColor: string;
  let surfaceColor: string;
  
  if (theme === 'dark') {
    primaryColor = isCustomTheme ? (churchData?.customBrandColor || '#2ba9b8') : currentTheme.primary;
    surfaceColor = isCustomTheme ? '#0b0f19' : currentTheme.surfaceDark;
  } else {
    if (isCustomTheme) {
      const customColor = churchData?.customBrandColor || '#2ba9b8';
      primaryColor = customColor;
      surfaceColor = adjustColorBrightness(customColor, -25);
    } else if (currentThemeKey === 'black') {
      primaryColor = '#27272a';
      surfaceColor = '#09090b';
    } else {
      primaryColor = currentTheme.brandDark;
      surfaceColor = currentTheme.brandLight;
    }
  }

  return (
    <>
      <AnimatePresence>
        {showStickyHeader && nextService && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className="fixed top-0 left-0 right-0 z-[45] sticky-scroll-header bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-border shadow-lg select-none"
          >
            <div className="max-w-6xl mx-auto px-4 md:px-10 h-14 sm:h-16 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {/* Theme Icon / Emoji Badge */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 border",
                  nextService.theme && nextService.theme !== 'normal' 
                    ? "bg-brand/15 border-brand/30 text-brand" 
                    : "bg-black/5 dark:bg-white/5 border-border text-text-main"
                )}>
                  {nextService.theme && SERVICE_THEMES[nextService.theme] 
                    ? SERVICE_THEMES[nextService.theme].icon 
                    : '⛪'}
                </div>
                
                {/* Title & Info */}
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-text-main truncate tracking-tight flex items-center gap-2">
                    {nextService.title}
                  </h4>
                  <p className="text-[10px] sm:text-xs font-bold text-text-muted mt-0.5 flex items-center gap-1.5">
                    <span>{formatDate(nextService.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <span>•</span>
                    <span>{formatTime(nextService.date)}</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Button 
                  onClick={() => onNavigate('calendar')} 
                  variant="ghost"
                  className="px-2 sm:px-2.5 py-1.5 h-8 text-[10px] sm:text-xs font-black uppercase tracking-tight text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Escala
                </Button>
                <Button 
                  onClick={() => onNavigate('liturgy')} 
                  variant="ghost"
                  className="px-2 sm:px-2.5 py-1.5 h-8 text-[10px] sm:text-xs font-black uppercase tracking-tight text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Liturgia
                </Button>
                <Button 
                  onClick={() => { setShowLiturgySongs?.(true); onNavigate('songs'); }} 
                  className="bg-brand text-white px-2.5 sm:px-3 py-1.5 h-8 text-[10px] sm:text-xs font-black uppercase tracking-tight shadow-md hover:brightness-110"
                >
                  Músicas
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-10"
      >
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 overflow-hidden">
        <div className="flex items-center gap-4 max-w-full">
          {churchData?.logoUrl && (
            <img 
              referrerPolicy="no-referrer"
              src={churchData.logoUrl} 
              className={cn(
                "w-14 h-14 shrink-0 border border-border/40",
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
              alt="Logo Igreja" 
            />
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-main">Olá, {memberData?.name?.split(' ')[0]} 👋</h1>
            <p className="text-text-muted dark:text-white text-sm sm:text-base mt-1 font-semibold">
              {churchData?.name ? `Bem-vindo ao portal da ${churchData.name}` : "Bem-vindo ao LiLouPro"}
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">Status dos Membros</p>
          <span className="text-xs font-bold text-text-main bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded border border-black/10 dark:border-white/20">● Online</span>
          {isAdmin && (
            <div className="mt-2">
              <span className="text-[10px] font-black text-brand uppercase tracking-widest px-2 py-0.5 bg-brand/10 border border-brand/20 rounded">Modo Administrador</span>
            </div>
          )}
        </div>
      </header>

      {userChurchId !== 'semente' && (
        <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black text-amber-500 uppercase tracking-wider">
                Suas Músicas e Membros Sumiram?
              </h3>
              <p className="text-xs text-text-muted leading-relaxed max-w-2xl">
                Percebemos que você registrou a igreja como <strong className="text-text-main">{churchData?.name || 'sua nova congregação'}</strong>. Isso criou um ambiente novo em branco. Suas músicas, integrantes e cultos anteriores ainda estão salvos no banco de dados principal. Você pode recuperar 100% de seus dados e manter seu novo nome de igreja!
              </p>
            </div>
          </div>
          <div className="shrink-0 w-full md:w-auto flex gap-3">
            <Button 
              onClick={handleRestoreSementeHistory}
              disabled={isRestoring}
              className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-5 h-11 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center gap-2"
            >
              {isRestoring ? 'Restaurando...' : 'Recuperar Todo Histórico'}
            </Button>
          </div>
        </div>
      )}

      {userChurchId === 'semente' && showOnboarding && (!churchData || churchData?.name?.toLowerCase() === 'semente') && (
        <LeaderOnboardingWizard 
          user={user}
          memberData={memberData}
          onComplete={async () => {
            setShowOnboarding(false);
            localStorage.setItem('dismissed_leader_onboarding', 'true');
            if (user) {
              try {
                await updateDoc(doc(db, 'members', user.uid), { dismissedOnboarding: true });
              } catch (err) {
                console.error("Erro ao salvar onboarding no Firestore:", err);
              }
            }
          }}
          onDismiss={async () => {
            setShowOnboarding(false);
            localStorage.setItem('dismissed_leader_onboarding', 'true');
            if (user) {
              try {
                await updateDoc(doc(db, 'members', user.uid), { dismissedOnboarding: true });
              } catch (err) {
                console.error("Erro ao salvar onboarding no Firestore:", err);
              }
            }
          }}
        />
      )}

      {/* Member Welcome Tour Modal */}
      <WelcomeTourModal
        user={user}
        memberData={memberData}
        isOpen={showMemberTour}
        onClose={() => setShowMemberTour(false)}
        onNavigateTab={onNavigate}
      />

      {/* Persistent Quick Tour Banner for Members */}
      {!isAdmin && (
        <div className="bg-gradient-to-r from-brand/15 via-indigo-500/10 to-emerald-500/10 border border-brand/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand/20 text-brand flex items-center justify-center shrink-0 border border-brand/30">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">
                  Guia do Ministro: Escala, Repertório & Disponibilidade
                </h4>
                <span className="text-[9px] font-black uppercase bg-brand/20 text-brand px-2 py-0.5 rounded-full border border-brand/30">
                  Tour Rápido
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                Aprenda a consultar suas músicas, marcar presença nas escalas e preencher sua disponibilidade mensal.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMemberTour(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-brand hover:bg-brand-light text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
          >
            <Compass size={14} />
            <span>Ver Tour Guiado</span>
          </button>
        </div>
      )}

      {isUserBirthdayToday && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/20 via-brand/15 to-purple-500/20 p-8 shadow-2xl flex flex-col md:flex-row items-center gap-6"
        >
          {/* Confetti style sparkles backdrop */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 bg-amber-500/20 border-2 border-amber-500/50 rounded-full flex items-center justify-center text-4xl sm:text-5xl shadow-lg shrink-0 animate-pulse">
            🎂
          </div>

          <div className="relative z-10 space-y-2 text-center md:text-left flex-1">
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-block animate-bounce-short">
              FELIZ ANIVERSÁRIO! 🎉
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
              Parabéns, {memberData?.name?.split(' ')[0]}! 🌟
            </h2>
            <p className="text-text-muted text-xs sm:text-sm leading-relaxed max-w-2xl font-medium">
              Hoje celebramos com muita alegria e gratidão a sua vida! Que o Senhor derrame bênçãos sem medida sobre os seus caminhos, coroando você de favor e graça. Obrigado por fazer parte deste ministério e somar conosco nessa linda jornada de adoração! ❤️🙌
            </p>
          </div>
          
          <div className="absolute right-4 top-4 text-2xl opacity-20 pointer-events-none select-none">🎈</div>
          <div className="absolute left-1/2 bottom-2 text-xl opacity-25 pointer-events-none select-none">✨</div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card 
            style={{
              background: (() => {
                if (nextService?.theme && nextService.theme !== 'normal') {
                  const sTheme = SERVICE_THEMES[nextService.theme];
                  if (sTheme) {
                    return theme === 'dark' ? sTheme.bgDark : sTheme.bgLight;
                  }
                }
                return `linear-gradient(135deg, ${primaryColor} 0%, ${surfaceColor} 100%)`;
              })()
            }}
            className="p-0 border-none shadow-xl text-white overflow-hidden relative group next-service-card"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="absolute top-14 right-6 sm:top-24 sm:right-8 pointer-events-none select-none">
               <div className="flex flex-col items-end">
                 <p className="text-sm sm:text-2xl font-black uppercase tracking-[0.2em] leading-tight mb-0.5">
                   <span className="text-white">Li</span><span className="text-white/60 -ml-[0.2em]">turgia</span>
                 </p>
                 <p className="text-sm sm:text-2xl font-black uppercase tracking-[0.2em] leading-tight mb-0.5">
                   <span className="text-white">Lou</span><span className="text-white/60 -ml-[0.2em]">vor</span>
                 </p>
                 <p className="text-sm sm:text-2xl font-black uppercase tracking-[0.2em] leading-tight">
                   <span className="text-white">Pro</span><span className="text-white/60 -ml-[0.2em]">jeção</span>
                 </p>
               </div>
            </div>

            <div className="p-6 sm:p-8 relative z-10">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4 sm:mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-white/90 flex items-center gap-2">
                  <Calendar size={14} className="sm:w-4 sm:h-4" /> Próximo Culto Confirmado
                </h2>
                {nextService?.theme && nextService.theme !== 'normal' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm border border-white/25 shadow-sm">
                    <span>{SERVICE_THEMES[nextService.theme]?.icon}</span>
                    <span>{SERVICE_THEMES[nextService.theme]?.name}</span>
                  </span>
                )}
              </div>
              {nextService ? (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-xl sm:text-3xl font-extrabold mb-2 tracking-tight line-clamp-2 text-white">{nextService.title}</h3>
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-white font-medium overflow-hidden">
                       <span className="flex items-center gap-2 bg-white/10 px-2 sm:px-3 py-1 rounded-lg text-[12px] sm:text-base truncate font-black">
                          <Check size={14} className="text-white shrink-0"/> 
                          {formatDate(nextService.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                       </span>
                       <span className="flex items-center gap-2 bg-white/10 px-2 sm:px-3 py-1 rounded-lg text-[12px] sm:text-base shrink-0 font-black">
                          <Clock size={14} className="text-white shrink-0"/> 
                          {formatTime(nextService.date)}
                       </span>
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-4 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
                    <Button onClick={() => onNavigate('calendar')} className="bg-white text-primary hover:bg-white/90 px-3 sm:px-5 py-2.5 sm:py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-tight shadow-xl animate-fade-in w-full sm:w-auto text-center justify-center">
                      Ver Escala
                    </Button>
                    <Button onClick={() => onNavigate('liturgy')} className="bg-white text-primary hover:bg-white/90 px-3 sm:px-5 py-2.5 sm:py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-tight shadow-xl animate-fade-in w-full sm:w-auto text-center justify-center">
                      Ver Liturgia
                    </Button>
                    <Button onClick={() => { setShowLiturgySongs?.(true); onNavigate('songs'); }} className="bg-white text-primary hover:bg-white/90 px-4 sm:px-6 py-3 sm:py-3 text-xs sm:text-[13px] font-black uppercase tracking-tight shadow-xl animate-fade-in col-span-2 sm:col-span-auto w-full sm:w-auto text-center justify-center">
                      MÚSICAS DO CULTO
                    </Button>
                  </div>

                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-white font-bold italic text-lg shadow-sm">Nenhum culto agendado para os próximos dias.</p>
                  {isAdmin && <Button onClick={() => onNavigate('calendar')} className="mt-4 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border-border">Agendar Agora</Button>}
                </div>
              )}
            </div>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <QuickLink 
              icon={<Music2 />} 
              label="Repertório" 
              subtitle={`${songCount} ${songCount === 1 ? 'música cadastrada' : 'músicas cadastradas'}`}
              color="bg-brand/10 border-brand/20" 
              onClick={() => onNavigate('songs')} 
            />
            <QuickLink icon={<ThumbsUp />} label="Minha Disponibilidade" color="bg-sky-500/10 border-sky-500/20" onClick={() => onNavigate('availability')} />
            <QuickLink icon={<BookOpen />} label="Liturgia" color="bg-blue-500/10 border-blue-500/20" onClick={() => onNavigate('liturgy')} />
            <QuickLink icon={<Tv />} label="Projeção" subtitle="Letras, cifras e slides" color="bg-emerald-500/10 border-emerald-500/20" onClick={() => onNavigate('projection')} />
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-6">
           <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Avisos da Semana</h3>
                {isAdmin && (
                   <button 
                     onClick={() => setIsEditingAnnouncements(!isEditingAnnouncements)}
                     className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-border text-text-main/80 hover:text-text-main hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                     title="Editar avisos"
                   >
                     {isEditingAnnouncements ? <Check size={14} /> : <Edit size={14} />}
                   </button>
                 )}
               </div>

              {isEditingAnnouncements && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 bg-black/5 dark:bg-white/5 border border-border rounded-xl px-4 py-2 text-sm text-text-main focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-text-muted/50"
                      placeholder="Escreva um novo aviso..."
                      value={newAnnouncement}
                      onChange={(e) => setNewAnnouncement(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddAnnouncement()}
                    />
                    <button 
                      onClick={handleAddAnnouncement}
                      className="bg-brand text-white p-2 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-brand/20 active:scale-95"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-black/5 dark:bg-white/5 border border-border rounded-xl p-5 relative overflow-hidden group">
                 <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform text-text-main pointer-events-none">
                    <Bell size={80}/>
                 </div>
                 <div className="space-y-4 relative z-10">
                   {announcements.length > 0 ? (
                     announcements.map((ann) => (
                       <div key={ann.id} className="flex gap-3 items-start group/ann">
                         <div className={cn(
                           "w-1 h-10 rounded-full shrink-0", 
                           ann.color === 'brand' ? 'bg-brand' : ann.color === 'amber-500' ? 'bg-amber-500' : 'bg-purple-500'
                         )}></div>
                         <p className="text-text-main text-sm leading-relaxed font-bold flex-1">
                           {ann.text}
                         </p>
                         {isEditingAnnouncements && (
                           <ConfirmButton 
                             onConfirm={() => handleDeleteAnnouncement(ann.id)}
                             className="text-red-500 p-1 rounded-lg hover:bg-red-500/10 opacity-0 group-hover/ann:opacity-100 transition-all font-bold"
                           >
                             <Trash2 size={14} />
                           </ConfirmButton>
                         )}
                       </div>
                     ))
                   ) : (
                     <div className="py-4 text-center">
                        <p className="text-text-main/80 text-xs font-bold italic tracking-wide">Nenhum aviso publicado no momento</p>
                     </div>
                   )}
                 </div>
              </div>
           </Card>

           <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Meu Mural</h3>
                   <p className="text-[10px] text-text-main font-black uppercase mt-1 tracking-tight">Sugestões, Ideias e Pedidos</p>
                </div>
                <button 
                  onClick={() => setIsAddingMural(!isAddingMural)}
                  className="p-1.5 rounded-lg bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-all font-semibold"
                  title="Novo post"
                >
                  {isAddingMural ? <X size={16} /> : <div className="flex items-center gap-1"><Plus size={14} /> <span className="text-[10px] uppercase font-bold">Postar</span></div>}
                </button>
              </div>

              <AnimatePresence>
                {isAddingMural && (
                  <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                     className="mb-6 space-y-3 overflow-hidden bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-border"
                  >
                     <div className="flex gap-2 flex-wrap">
                        {(['sugestao', 'ideia', 'necessidade', 'oracao', 'outro'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setNewMuralType(type)}
                            className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                              newMuralType === type 
                                ? "bg-brand text-white shadow-lg shadow-brand/20 scale-105" 
                                : "bg-black/5 dark:bg-white/10 text-text-muted hover:bg-black/10"
                            )}
                          >
                            {type === 'sugestao' ? '💡 Sugestão' : 
                             type === 'ideia' ? '✨ Ideia' : 
                             type === 'necessidade' ? '🤝 Necessidade' : 
                             type === 'oracao' ? '🙏 Oração' : '📌 Outro'}
                          </button>
                        ))}
                     </div>
                     <textarea 
                       className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-text-main focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-text-muted/50 min-h-[100px] resize-none"
                       placeholder="No que você está pensando? Compartilhe com o grupo..."
                       value={newMuralText}
                       onChange={(e) => setNewMuralText(e.target.value)}
                     />
                     <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsAddingMural(false)} className="text-xs py-1.5 h-auto">Cancelar</Button>
                        <Button onClick={handleAddMuralItem} className="text-xs py-1.5 px-6 h-auto">Publicar</Button>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                 {muralItems.length > 0 ? (
                   muralItems.map((item) => (
                     <div key={item.id} className="p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-border group/mural relative">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-[10px] font-black text-text-main dark:text-brand uppercase">
                                 {item.authorName?.charAt(0) || 'M'}
                              </div>
                              <div>
                                 <p className="text-[11px] font-black text-text-main leading-none">{item.authorName}</p>
                                 <p className="text-[9px] text-text-muted font-bold mt-0.5 uppercase">{formatTime(item.createdAt)} • {formatDate(item.createdAt)}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border",
                                item.type === 'oracao' ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                                item.type === 'sugestao' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                item.type === 'ideia' ? "bg-brand/10 text-brand border-brand/20" :
                                "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              )}>
                                {item.type}
                              </span>
                              {isAdmin && (
                                <ConfirmButton 
                                   onConfirm={() => handleDeleteMuralItem(item.id)}
                                   className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-all font-black text-[9px] uppercase tracking-wider flex items-center gap-1 border border-red-500/20 px-1.5 py-0.5"
                                >
                                   <Trash2 size={10} />
                                   <span>Apagar</span>
                                </ConfirmButton>
                              )}
                              {!isAdmin && user?.uid === item.authorId && (
                                <ConfirmButton 
                                   onConfirm={() => handleDeleteMuralItem(item.id)}
                                   className="p-1 text-text-muted hover:text-red-500 transition-all font-bold"
                                >
                                   <Trash2 size={12} />
                                </ConfirmButton>
                              )}
                           </div>
                        </div>
                        <p className="text-sm text-text-main leading-relaxed font-medium whitespace-pre-wrap pl-10 mb-2">
                           {item.text}
                        </p>

                        {/* Admin Reply Display */}
                        {item.reply && (
                          <div className="mt-3 ml-10 p-3 bg-brand/5 rounded-xl border border-brand/10 space-y-1 relative">
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-1.5">
                                <CornerDownRight size={13} className="text-brand" />
                                <span className="text-[10px] font-black uppercase text-brand tracking-wider">Resposta do {item.repliedBy || 'Administrador'}</span>
                              </div>
                              {isAdmin && (
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => {
                                      setReplyingItemId(item.id);
                                      setMuralReplyText(item.reply);
                                    }}
                                    className="text-[9px] text-brand hover:underline font-bold uppercase tracking-wider"
                                  >
                                    Editar
                                  </button>
                                  <button 
                                    onClick={() => handleRemoveMuralReply(item.id)}
                                    className="text-[9px] text-text-muted hover:text-red-500 font-bold uppercase tracking-wider"
                                    title="Excluir resposta"
                                  >
                                    Remover
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-text-main font-semibold whitespace-pre-wrap leading-relaxed">
                              {item.reply}
                            </p>
                          </div>
                        )}

                        {/* Admin Responder Box */}
                        {replyingItemId === item.id ? (
                          <div className="mt-3 ml-10 space-y-2 bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-border">
                            <p className="text-[10px] uppercase font-black text-brand tracking-wider flex items-center gap-1">
                              Responder para {item.authorName}
                            </p>
                            <textarea 
                              className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-text-main focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-text-muted/50 min-h-[60px] resize-none"
                              placeholder="Digite sua resposta de administrador..."
                              value={muralReplyText}
                              onChange={(e) => setMuralReplyText(e.target.value)}
                            />
                            <div className="flex justify-end gap-1.5">
                              <Button 
                                variant="ghost" 
                                onClick={() => {
                                  setReplyingItemId(null);
                                  setMuralReplyText('');
                                }} 
                                className="text-[10px] py-1 h-7 border border-border px-3 font-bold uppercase tracking-wider"
                              >
                                Cancelar
                              </Button>
                              <Button 
                                onClick={() => handleReplyMuralItem(item.id)} 
                                className="text-[10px] py-1 h-7 bg-brand text-white px-4 font-bold uppercase tracking-wider"
                              >
                                Salvar Resposta
                              </Button>
                            </div>
                          </div>
                        ) : (
                          isAdmin && !item.reply && (
                            <div className="mt-2 ml-10">
                              <button
                                onClick={() => {
                                  setReplyingItemId(item.id);
                                  setMuralReplyText('');
                                }}
                                className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-brand bg-brand/10 hover:bg-brand/20 transition-all px-2.5 py-1 rounded-md tracking-widest border border-brand/10"
                              >
                                <MessageSquare size={10} />
                                <span>Responder</span>
                              </button>
                            </div>
                          )
                        )}
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-10">
                      <MessageSquare className="mx-auto text-text-muted/30 mb-2" size={32} />
                      <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Nenhuma publicação ainda</p>
                      <p className="text-[10px] text-text-muted mt-1">Seja o primeiro a compartilhar!</p>
                   </div>
                 )}
              </div>
           </Card>

           {/* Aniversariantes do Mês Card */}
           <Card className="p-6 space-y-4">
             <div className="flex items-center gap-2.5">
               <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/10">
                 <Gift size={16} className="animate-pulse" />
               </div>
               <div>
                 <h3 className="text-sm font-black text-text-main uppercase tracking-widest leading-none">Aniversariantes do Mês</h3>
                 <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1">
                   {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
                 </p>
               </div>
             </div>

             <div className="space-y-3">
               {birthdaysCurrentMonth.length > 0 ? (
                 birthdaysCurrentMonth.map((member) => {
                   const isToday = getIsBirthdayToday(member.birthDate);
                   return (
                     <div 
                       key={member.id} 
                       className={cn(
                         "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                         isToday 
                           ? "bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/5 scale-[1.02]" 
                           : "bg-black/5 dark:bg-white/5 border-border hover:bg-black/10 dark:hover:bg-white/10"
                       )}
                     >
                       <div className="relative">
                         <CachedAvatar 
                           photoUrl={member.photoUrl} 
                           alt={member.name} 
                           className="w-10 h-10 rounded-full" 
                           fallbackText={member.name}
                         />
                         {isToday && (
                           <span className="absolute -top-1 -right-1 text-xs" title="Aniversariando Hoje!">👑</span>
                         )}
                       </div>
                       <div className="min-w-0 flex-1">
                         <p className="text-xs sm:text-sm font-black text-text-main truncate flex items-center gap-1.5">
                           <span>{member.name}</span>
                           {isToday && (
                             <span className="bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest animate-bounce-short">
                               Hoje!
                             </span>
                           )}
                         </p>
                         <p className="text-[10px] text-text-muted font-semibold truncate">
                           🎂 {formatBirthDate(member.birthDate)}
                         </p>
                       </div>
                     </div>
                   );
                 })
               ) : (
                 <div className="py-4 text-center">
                   <p className="text-text-muted text-xs font-bold italic">Nenhum aniversariante registrado este mês.</p>
                 </div>
               )}
             </div>
           </Card>
        </aside>
      </div>
    </motion.div>
    </>
  );
}