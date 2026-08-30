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
  getDynamicExplanationDetails, DynamicExplanationModal, isSectionHeaderContent, parseBracketSubContent,
  parseLineSectionAndDynamics, RenderTextWithInlineBadges, RenderSectionOrDynamicsLine, SingleLineRow,
  compressAndResizeImage, ConfirmButton, formatDate, formatTime, NotificationCenter, getLocalDateTimeString,
  getLocalDateString, getFormatNameForPdf, Button, Card, Input, normalizeSongTitle, calculateSongMatchScore,
  findBestSongMatch, parseYoutubeVideoId, SERVICE_THEMES, getContrastColor
} from './songsShared';

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



export * from './songsShared';
export { SongDetailView } from './SongDetailView';
export { AvailabilityView } from './AvailabilityView';
export { LiturgyEditor } from './LiturgyEditor';
// default exported above
