import { LiturgyEditor } from "./SongsView";
import { ConfirmButton } from "./ConfirmButton";
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
  AlertTriangle, Smartphone, Columns, Mic, MicOff, Loader2, GraduationCap, Camera, Gift, Baby, HelpCircle
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


// Main Component Export

export default function LiturgyView({ 
  onOpenSong,
  createNotifications,
  allSongs = [],
  onStartPlaylist,
  theme
}: { 
  onOpenSong?: (songId: string) => void,
  createNotifications?: (title: string, content: string, type: 'announcement' | 'mural' | 'service' | 'general', excludeUserId?: string, preferenceKey?: 'notifyNewSongs' | 'notifyScheduleChanges' | 'notifyDayBeforeReminder' | 'notifyNewLiturgy') => Promise<void>,
  allSongs?: any[],
  onStartPlaylist?: (songs: any[]) => void,
  theme?: 'light' | 'dark'
}) {
  const { user, isAdmin, memberData } = useAuth();
  const userChurchId = memberData?.churchId || 'semente';
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const liturgyRef = useRef<HTMLDivElement>(null);

  const [members, setMembers] = useState<any[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [isEditingKidsNotes, setIsEditingKidsNotes] = useState(false);
  const [isEditingBabiesNotes, setIsEditingBabiesNotes] = useState(false);
  const [tempKidsNotes, setTempKidsNotes] = useState('');
  const [tempBabiesNotes, setTempBabiesNotes] = useState('');

  useEffect(() => {
    if (!user) return;
    const memberPath = 'members';
    return onSnapshot(collection(db, memberPath), (snap) => {
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching members in LiturgyView:", error);
    });
  }, [user]);

  const selectedService = services.find(s => s.id === selectedServiceId);

  useEffect(() => {
    if (selectedService) {
      setTempKidsNotes(selectedService.kidsNotes || '');
      setTempBabiesNotes(selectedService.babiesNotes || '');
    }
  }, [selectedServiceId, selectedService?.kidsNotes, selectedService?.babiesNotes]);

  const handleSaveKidsNotes = async () => {
    if (!selectedService) return;
    try {
      await updateDoc(doc(db, 'services', selectedService.id), {
        kidsNotes: tempKidsNotes
      });
      setIsEditingKidsNotes(false);
    } catch (e) {
      console.error("Error saving kids notes:", e);
    }
  };

  const handleSaveBabiesNotes = async () => {
    if (!selectedService) return;
    try {
      await updateDoc(doc(db, 'services', selectedService.id), {
        babiesNotes: tempBabiesNotes
      });
      setIsEditingBabiesNotes(false);
    } catch (e) {
      console.error("Error saving babies notes:", e);
    }
  };

  useEffect(() => {
    if (!user) return;
    const servicePath = 'services';
    const q = query(collection(db, servicePath), orderBy('date', 'desc'));
    return onSnapshot(q, (snap) => {
      const allServices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = allServices.filter((s: any) => {
        const matchChurch = s.churchId === userChurchId || (!s.churchId && userChurchId === 'semente');
        if (!matchChurch) return false;

        if (!s.date) return false;
        
        let d;
        if (s.date?.toDate) {
          d = s.date.toDate();
        } else if (s.date instanceof Date) {
          d = s.date;
        } else {
          d = new Date(s.date);
        }
        
        return !isNaN(d.getTime());
      });
      
      setServices(filtered);
      
      if (filtered.length > 0) {
        const currentSelectedStillExists = filtered.some(s => s.id === selectedServiceId);
        if (!selectedServiceId || !currentSelectedStillExists) {
          const nowStr = getLocalDateTimeString();
          const nextService = [...filtered].reverse().find((s: any) => {
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
            const sDay = serviceDateStr.split('T')[0];
            const nowDay = nowStr.split('T')[0];
            return sDay === nowDay || serviceDateStr >= nowStr;
          });
          setSelectedServiceId(nextService ? nextService.id : filtered[0].id);
        }
      } else {
        setSelectedServiceId(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, servicePath);
    });
  }, [user, userChurchId, selectedServiceId]);

  const playlistSongs = useMemo(() => {
    if (!selectedService || !selectedService.liturgy || !allSongs.length) return [];
    const songItems = selectedService.liturgy.filter((item: any) => item.type === 'song');
    return songItems
      .map((item: any) => allSongs.find(s => s.id === item.songId))
      .filter((song: any) => song && song.youtube && parseYoutubeVideoId(song.youtube));
  }, [selectedService, allSongs]);

  const handleExportPDF = () => {
    if (!selectedService || !selectedService.liturgy) return;

    const doc = new (jsPDF as any)();
    const dateStr = new Date(selectedService.date).toLocaleDateString('pt-BR');
    const timeStr = new Date(selectedService.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Header
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(22);
    doc.setTextColor(6, 11, 31);
    doc.text('Liturgia do Culto', pageWidth / 2, 22, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(70);
    doc.text(`${selectedService.title}`, pageWidth / 2, 32, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Data: ${dateStr} às ${timeStr}`, pageWidth / 2, 42, { align: 'center' });

    const smartCapitalize = (str: string) => {
      if (!str) return '';
      const s = str.trim();
      if (s.length === 0) return '';
      
      let result = s;
      // Se estiver tudo em maiúsculo, transformamos em minúsculo primeiro para evitar o "gritado"
      if (s === s.toUpperCase() && s !== s.toLowerCase()) {
        result = s.toLowerCase();
      }

      // Garante a primeira letra maiúscula
      result = result.charAt(0).toUpperCase() + result.slice(1);

      // Lista de termos sagrados que sempre devem ser capitalizados
      const holyNames = [
        'Deus', 'Jesus', 'Cristo', 'Senhor', 'Espírito', 'Espirito', 'Santo', 'Pai', 'Filho', 
        'Maria', 'Bíblia', 'Biblia', 'Evangelho', 'Salmo', 'Amém', 'Amem'
      ];

      holyNames.forEach(name => {
        const regex = new RegExp(`\\b${name}\\b`, 'gi');
        result = result.replace(regex, (match) => name);
      });

      return result;
    };

    const tableData = selectedService.liturgy.map((item: any) => {
      const typeMap: any = {
        reading: 'Leitura',
        song: 'Música',
        speech: 'Pregação',
        prayer: 'Oração',
        announcements: 'Avisos',
        offering: 'Ofertas',
        other: 'Outro'
      };
      
      const songDetails = item.type === 'song' ? (allSongs || []).find(s => s.id === item.songId) : null;
      const resolvedTitle = item.title || songDetails?.title || '';
      let titleWithDetails = smartCapitalize(resolvedTitle);
      if (item.type === 'song' && item.songOrder) {
        titleWithDetails = `[${item.songOrder}] ${titleWithDetails}`;
      }
      if (item.type === 'song' && item.vocalist) {
        titleWithDetails += ` - 🎤 ${item.vocalist}`;
      }
      if (item.details && item.type !== 'reading') {
        titleWithDetails += `\n"${item.details}"`;
      }
      
      return [
        typeMap[item.type] || smartCapitalize(item.type),
        titleWithDetails,
        smartCapitalize(item.content || '-')
      ];
    });

    autoTable(doc, {
      startY: 55,
      head: [['Tipo', 'Título', 'Descrição']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [6, 11, 31], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      styles: { 
        fontSize: 10, 
        cellPadding: 5,
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 70 },
        2: { cellWidth: 'auto' }
      }
    });

    doc.save(`liturgia_${dateStr.replace(/\//g, '-')}.pdf`);
  };

  const handleExportBookletPDF = async () => {
    if (!selectedService || !selectedService.liturgy) return;

    const doc = new (jsPDF as any)();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Cover Page
    doc.setFontSize(28);
    doc.setTextColor(43, 169, 184); // brand
    doc.text('Livreto do Culto', pageWidth / 2, 80, { align: 'center' });
    
    doc.setFontSize(22);
    doc.setTextColor(60);
    doc.text(selectedService.title, pageWidth / 2, 100, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    const dStr = new Date(selectedService.date).toLocaleDateString('pt-BR');
    doc.text(dStr, pageWidth / 2, 115, { align: 'center' });

    // Liturgy Summary Page
    doc.addPage();
    doc.setFontSize(20);
    doc.setTextColor(43, 169, 184);
    doc.text('Ordem do Culto', margin, 30);
    
    let y = 45;
    selectedService.liturgy.forEach((item: any, idx: number) => {
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${item.type.toUpperCase()}`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${item.title}`, margin + 35, y);
      y += 6;

      if (item.details && item.type !== 'reading') {
        doc.setFontSize(10);
        doc.setTextColor(110);
        const lines = doc.splitTextToSize(`"${item.details}"`, pageWidth - margin * 2 - 40);
        lines.forEach((line: string) => {
          doc.text(line, margin + 35, y);
          y += 5;
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 30;
          }
        });
        y += 3;
      } else {
        y += 4;
      }

      if (y > pageHeight - 20) {
        doc.addPage();
        y = 30;
      }
    });

    // Song Details Pages
    const songItems = selectedService.liturgy.filter((i: any) => i.type === 'song');
    
    for (const item of songItems) {
      doc.addPage();
      doc.setFontSize(24);
      doc.setTextColor(43, 169, 184);
      doc.text(item.title, margin, 30);

      // Fetch song data if songId exists
      if (item.songId) {
        try {
          const songSnap = await getDoc(doc(db, 'songs', item.songId));
          if (songSnap.exists()) {
            const song = songSnap.data() as any;
            
            // Stats/Info
            doc.setFontSize(10);
            doc.setTextColor(140);
            doc.text(`Tom: ${song.key || '-'}  |  BPM: ${song.bpm || '-'}`, margin, 40);

            doc.setFontSize(11);
            doc.setTextColor(40);
            doc.setFont('courier', 'normal');
            
            const lyrics = song.chords || '';
            const splitLyrics = doc.splitTextToSize(lyrics, pageWidth - (margin * 2));
            
            doc.text(splitLyrics, margin, 50);
          }
        } catch (e) {
          console.error('Error fetching song for booklet:', e);
        }
      } else {
        doc.setFontSize(12);
        doc.setTextColor(150);
        doc.text('(Conteúdo da música não encontrado)', margin, 50);
      }
    }

    doc.save(`livreto_${dStr.replace(/\//g, '-')}.pdf`);
  };

  const handleExportImage = () => {
    if (liturgyRef.current) {
      toPng(liturgyRef.current, { cacheBust: true, backgroundColor: '#0f172a' })
        .then((dataUrl) => {
          const link = document.createElement('a');
          const dateStr = new Date(selectedService?.date || Date.now()).toLocaleDateString('pt-BR').replace(/\//g, '-');
          link.download = `liturgia_${dateStr}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error('oops, something went wrong!', err);
        });
    }
  };

  const handleShareWhatsApp = () => {
    if (!selectedService || !selectedService.liturgy) return;

    const dateStr = new Date(selectedService.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeStr = new Date(selectedService.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let message = `*ORDEM DO CULTO* 📖\n`;
    message += `*${selectedService.title}*\n`;
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
      reading: '📖 Leitura',
      song: '🎵 Música',
      speech: '🗣️ Pregação',
      prayer: '🙏 Oração',
      announcements: '📢 Avisos',
      offering: '💸 Ofertas',
      other: '✨ Outro'
    };

    selectedService.liturgy.forEach((item: any, idx: number) => {
      message += `${idx + 1}. *${typeMap[item.type] || smartCapitalize(item.type)}*\n`;
      const songDetails = item.type === 'song' ? (allSongs || []).find(s => s.id === item.songId) : null;
      const resolvedTitle = item.title || songDetails?.title || '';
      let titleStr = smartCapitalize(resolvedTitle);
      if (item.type === 'song' && item.songOrder) {
        titleStr = `[${item.songOrder}] ${titleStr}`;
      }
      if (item.type === 'song' && item.vocalist) {
        titleStr += ` - 🎤 ${item.vocalist}`;
      }
      message += `${titleStr}\n`;
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 liturgy-view">
      <div className="flex flex-col items-center justify-center text-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-main tracking-tight">Gestão de Liturgia</h1>
          <p className="text-text-muted text-sm mb-4">Configure a ordem do culto para os próximos eventos.</p>
          
          <div className="w-full max-w-xl text-left mx-auto">
            <ContextualHelp 
              id="liturgy"
              title="Liturgia: Como organizar o Culto?"
              description="A liturgia define a ordem cronológica do culto (músicas, avisos, momentos de louvor ou pregação) alinhando a equipe técnica de projeção e mídia com os músicos."
              steps={[
                "Selecione um Culto/Evento na barra de datas logo abaixo.",
                "Se for líder/admin, clique em 'Editar Liturgia' para montar o roteiro e definir a ordem dos elementos.",
                "Adicione as músicas correspondentes e inclua links de playlists do YouTube/Spotify para o ensaio.",
                "Clique em 'Salvar Liturgia' e depois em 'Exportar em PDF' ou 'WhatsApp' para enviar o roteiro pronto para a equipe."
              ]}
              tip="O sistema de Liturgia é totalmente integrado ao Projetor Virtual. Qualquer alteração ou ordem de música salva aqui atualizará instantaneamente os slides de projeção!"
              theme={theme}
            />
          </div>
        </div>
        {selectedService && (selectedService.liturgy?.length > 0 || selectedService.playlistUrl) && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {playlistSongs.length > 0 && onStartPlaylist && (
              <Button 
                onClick={() => onStartPlaylist(playlistSongs)} 
                className="bg-red-600 hover:bg-red-700 text-white px-6 border-none shadow-lg transition-all font-bold"
              >
                <Play size={18} className="fill-white" />
                Ouvir Playlist ({playlistSongs.length})
              </Button>
            )}
            {selectedService.playlistUrl && (
              <Button 
                onClick={() => { window.open(selectedService.playlistUrl, '_blank'); }} 
                className="bg-white text-[#E60000] hover:bg-white/90 px-6 border border-[#E60000]/20 shadow-md transition-all font-bold"
              >
                <Youtube size={18} fill="#E60000" />
                Playlist Externa
              </Button>
            )}
            {selectedService.liturgy?.length > 0 && (
              <>
                <Button 
                  onClick={handleExportPDF} 
                  className="bg-brand text-white hover:bg-brand/90 px-6 border-none shadow-md transition-all font-bold"
                >
                  <FileDown size={18} />
                  Baixar PDF
                </Button>
                <Button 
                  onClick={handleShareWhatsApp} 
                  className="bg-emerald-600 text-white hover:bg-emerald-700 px-6 border-none shadow-md transition-all font-bold"
                >
                  <Share2 size={18} />
                  WhatsApp
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-10 max-w-4xl mx-auto w-full px-2 sm:px-4">
        <aside className="w-full">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 sm:w-16 h-[1px] bg-brand/30"></span>
              <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.3em] opacity-80 whitespace-nowrap">Agenda de Cultos</h3>
              <span className="w-8 sm:w-16 h-[1px] bg-brand/30"></span>
            </div>
            
            <div className="w-full flex overflow-x-auto pb-4 no-scrollbar snap-x gap-3 px-2 sm:justify-center">
              {services.length > 0 ? (
                services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedServiceId(s.id)}
                    className={cn(
                      "min-w-[160px] sm:min-w-[180px] text-left p-4 rounded-2xl border transition-all duration-300 group relative snap-center",
                      selectedServiceId === s.id
                        ? "bg-brand border-brand text-white shadow-xl shadow-brand/20 scale-[1.05] z-10"
                        : "bg-black/10 dark:bg-white/5 border-border text-text-main hover:bg-black/20 dark:hover:bg-white/10 hover:border-brand/40"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest",
                        selectedServiceId === s.id ? "text-white/80" : "text-text-main/70"
                      )}>
                        {formatDate(s.date, { weekday: 'short' })}.
                      </span>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        s.liturgy?.length > 0 ? "bg-green-400" : "bg-amber-400 opacity-50"
                      )} />
                    </div>
                    <p className="font-black text-[12px] sm:text-sm leading-tight tracking-tight truncate uppercase">{s.title}</p>
                    <p className={cn(
                      "text-[9px] font-bold mt-1 opacity-70",
                      selectedServiceId === s.id ? "text-white" : "text-text-main/70"
                    )}>
                      {formatDate(s.date, { day: '2-digit', month: 'short' })} • {formatTime(s.date)}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-xs text-text-main font-bold italic p-4">Nenhum culto encontrado.</p>
              )}
            </div>
          </div>
        </aside>

        <div className="w-full">
          {selectedService ? (
            <div className="space-y-6">
              /* Traditional clipboard card (original view) */
                <div ref={liturgyRef} className="relative pt-4 animate-in fade-in duration-300">
                  {/* Clipboard Clip */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-32 h-10 bg-brand rounded-t-xl border-x border-t border-brand/20 flex items-center justify-center shadow-lg">
                    <div className="w-16 h-2.5 bg-black/20 rounded-full border border-white/5 shadow-inner"></div>
                  </div>
                  
                  <Card className="p-3 sm:p-10 relative overflow-hidden bg-card border-border shadow-2xl rounded-t-none">
                    {/* Visual texture for paper-like feel */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#888888_1px,transparent_1px)] [background-size:16px_1px]"></div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center gap-4 mb-8 border-b border-border pb-8">
                      <div className="w-16 h-16 rounded-2xl bg-brand/20 flex items-center justify-center text-brand shrink-0 shadow-lg border border-brand/20">
                        <BookOpen size={32} />
                      </div>
                      <div>
                         <h2 className="text-3xl sm:text-4xl font-black text-text-main tracking-tight leading-tight">{selectedService.title}</h2>
                         <p className="text-text-main/80 text-sm sm:text-lg font-bold mt-2">
                           {formatDate(selectedService.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} às {formatTime(selectedService.date)}
                         </p>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <LiturgyEditor key={selectedService.id} service={selectedService} onOpenSong={onOpenSong} createNotifications={createNotifications} />
                    </div>
                  </Card>
                </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center bg-black/5 dark:bg-white/5 border border-dashed border-border rounded-3xl p-10 text-center">
               <div className="max-w-xs space-y-4">
                  <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto text-text-main/20">
                    <BookOpen size={32} />
                  </div>
                  <p className="text-sm text-text-muted font-medium italic">Selecione um culto ao lado para configurar sua liturgia e ordem.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}