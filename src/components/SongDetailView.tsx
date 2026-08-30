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




import {
  cn, getArtistImage, getArtistInitials, getArtistGradient, artistImageCache, cleanChordText, ArtistAvatar,
  formatBirthDate, EasyBirthDatePicker, getStyledChars, getStyledTextRuns, ChordButton, PairedChordLyricsRow,
  isDynamicTerm, getDynamicType, formatDynamicLabel, triggerDynamicExplanation, triggerDynamicsGuideModal,
  getDynamicExplanationDetails, DynamicExplanationModal, type DynamicExplanation, TimeSignatureDisplay, isSectionHeaderContent, parseBracketSubContent,
  parseLineSectionAndDynamics, RenderTextWithInlineBadges, RenderSectionOrDynamicsLine, SingleLineRow,
  compressAndResizeImage, ConfirmButton, formatDate, formatTime, NotificationCenter, getLocalDateTimeString,
  getLocalDateString, getFormatNameForPdf, Button, Card, Input, normalizeSongTitle, calculateSongMatchScore,
  findBestSongMatch, parseYoutubeVideoId, SERVICE_THEMES, getContrastColor
} from './songsShared';

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

