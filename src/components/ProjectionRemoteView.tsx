import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Tv, Monitor, Search, ChevronRight, ChevronLeft, Play, Square, Settings as SettingsIcon, 
  HelpCircle, RefreshCw, Calendar, Music, Sparkles, BookOpen, ExternalLink, Trash2,
  Plus, UploadCloud, Check, Volume2, Megaphone, Gift, History as HistoryIcon,
  Keyboard, Info, Sliders, LayoutGrid, Smartphone, Eye, EyeOff, Radio, Copy,
  ArrowRight, ShieldCheck, Wifi, WifiOff, X, ArrowLeft, Send, CheckCircle2,
  Activity, Zap, AlertTriangle, ScreenShare, Layers, ListOrdered, ChevronDown,
  Clock, Flame, Heart, FileText, CheckCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  doc, setDoc, getDoc, onSnapshot, collection, query, orderBy 
} from 'firebase/firestore';
import { cleanLyricsForProjection } from '../services/chordService';
import { useAuth } from '../hooks/useAuth';

// Text and song title normalizers for smart matching
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

  let matchedCount = 0;
  const used2 = new Set<number>();

  for (const w1 of words1) {
    for (let i = 0; i < words2.length; i++) {
      if (used2.has(i)) continue;
      const w2 = words2[i];

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

  const maxWords = Math.max(words1.length, words2.length);
  const wordMatchRatio = matchedCount / maxWords;

  let substringBonus = 0;
  if (normTitle.includes(normSearch) || normSearch.includes(normTitle)) {
    substringBonus = 15;
  }

  const lengthDiff = Math.abs(normTitle.length - normSearch.length);
  const lengthPenalty = Math.min(20, lengthDiff * 0.5);

  return (wordMatchRatio * 80) + substringBonus - lengthPenalty;
}

function findBestSongMatch<T extends { title: string }>(songs: T[], rawSearch: string): T | null {
  const normSearch = normalizeSongTitle(rawSearch);
  if (!normSearch) return null;

  const exactMatch = songs.find(s => normalizeSongTitle(s.title) === normSearch);
  if (exactMatch) return exactMatch;

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

interface ProjectionRemoteViewProps {
  allSongs?: any[];
  allServices?: any[];
  onBackToApp?: () => void;
}

export function ProjectionRemoteView({ 
  allSongs: propsSongs = [], 
  allServices: propsServices = [],
  onBackToApp 
}: ProjectionRemoteViewProps) {
  const { memberData, churchData } = useAuth();
  
  // URL parameters detection
  const searchParams = new URLSearchParams(window.location.search);
  const paramChurch = searchParams.get('church');
  const paramSession = searchParams.get('session');
  
  const churchId = paramChurch || memberData?.churchId || localStorage.getItem('lilo_active_church_id') || 'semente';
  const sessionId = paramSession || churchId;

  // Real-time Firestore fetching fallback (if props are empty in standalone remote mode)
  const [fetchedSongs, setFetchedSongs] = useState<any[]>([]);
  const [fetchedServices, setFetchedServices] = useState<any[]>([]);

  useEffect(() => {
    // Listen to church songs
    const qSongs = query(collection(db, 'songs'));
    const unsubSongs = onSnapshot(qSongs, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const filtered = docs.filter(s => s.churchId === churchId || (!s.churchId && churchId === 'semente'));
      setFetchedSongs(filtered);
    }, (err) => {
      console.warn("Could not load songs in remote:", err);
    });

    // Listen to church services
    const qServices = query(collection(db, 'services'));
    const unsubServices = onSnapshot(qServices, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const filtered = docs.filter(s => s.churchId === churchId || (!s.churchId && churchId === 'semente'));
      setFetchedServices(filtered);
    }, (err) => {
      console.warn("Could not load services in remote:", err);
    });

    return () => {
      unsubSongs();
      unsubServices();
    };
  }, [churchId]);

  const allSongs = useMemo(() => {
    return propsSongs.length > 0 ? propsSongs : fetchedSongs;
  }, [propsSongs, fetchedSongs]);

  const allServices = useMemo(() => {
    return propsServices.length > 0 ? propsServices : fetchedServices;
  }, [propsServices, fetchedServices]);

  // Session state from Firestore
  const [sessionData, setSessionData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'liturgy' | 'slides' | 'repertoire' | 'bible' | 'alert'>('liturgy');
  
  // Selected Service state
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [showServiceDropdown, setShowServiceDropdown] = useState<boolean>(false);

  // Connection diagnostics & status modal
  const [showConnectionModal, setShowConnectionModal] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isTestingPing, setIsTestingPing] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<'success' | 'none'>('none');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [reconnectCount, setReconnectCount] = useState<number>(0);

  // Periodic timer for reactive relative time display (e.g. "há 4s")
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Repertoire & search
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [customAlertText, setCustomAlertText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Bible quick search
  const [bibleBook, setBibleBook] = useState('João');
  const [bibleChapter, setBibleChapter] = useState('3');
  const [bibleVerse, setBibleVerse] = useState('16');
  const [bibleText, setBibleText] = useState('Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.');
  const [isProjectingBible, setIsProjectingBible] = useState(false);

  // Vibrate helper for tactile mobile feedback
  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(25);
      }
    } catch {
      // Ignore vibration errors
    }
  };

  // Listen to Firestore projection session
  useEffect(() => {
    const docRef = doc(db, 'projection_sessions', sessionId);
    const unsub = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSessionData(data);
        setIsConnected(true);
        if (data.selectedServiceId && !selectedServiceId) {
          setSelectedServiceId(data.selectedServiceId);
        }
      } else {
        // Create initial session if empty
        const initial = {
          churchId,
          text: '',
          theme: 'black',
          fontSize: 64,
          activeSlideIdx: -1,
          slides: [],
          blackout: false,
          clearText: false,
          showLogo: false,
          scrollingAlert: null,
          updatedAt: new Date().toISOString()
        };
        setDoc(docRef, initial).catch(console.error);
        setSessionData(initial);
        setIsConnected(true);
      }
    }, (error) => {
      console.warn("Remote Firestore connection warning:", error);
      setIsConnected(false);
    });

    return () => unsub();
  }, [sessionId, churchId]);

  // Broadcast channel for local same-tab testing fallback
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('lilo-projection-sync');
      channel.onmessage = (event) => {
        if (event.data) {
          setSessionData((prev: any) => ({ ...prev, ...event.data }));
          setIsConnected(true);
        }
      };
    } catch {
      // Safe fallback
    }
    return () => {
      if (channel) channel.close();
    };
  }, []);

  // Update session in Firestore and BroadcastChannel
  const updateSession = async (patch: Partial<any>) => {
    triggerHaptic();
    const docRef = doc(db, 'projection_sessions', sessionId);
    const newSession = {
      ...(sessionData || {}),
      ...patch,
      updatedAt: new Date().toISOString()
    };
    setSessionData(newSession);

    try {
      await setDoc(docRef, patch, { merge: true });
    } catch (err) {
      console.warn("Erro ao atualizar sessão remota no Firestore:", err);
    }

    try {
      const channel = new BroadcastChannel('lilo-projection-sync');
      channel.postMessage(newSession);
      channel.close();
    } catch {
      // Ignore
    }
  };

  // Find candidate services (sorted by date)
  const servicesWithLiturgy = useMemo(() => {
    if (!allServices || allServices.length === 0) return [];
    
    return allServices
      .map(s => {
        let date;
        if (s.date?.toDate) {
          date = s.date.toDate();
        } else if (s.date instanceof Date) {
          date = s.date;
        } else if (s.date) {
          date = new Date(s.date);
        } else {
          date = new Date(0);
        }
        return { ...s, _actualDate: isNaN(date.getTime()) ? new Date(0) : date };
      })
      .filter(s => (s.liturgy && s.liturgy.length > 0) || (s.setlist && s.setlist.length > 0))
      .sort((a, b) => b._actualDate.getTime() - a._actualDate.getTime());
  }, [allServices]);

  // Auto-select active service if not chosen yet
  useEffect(() => {
    if (!selectedServiceId && servicesWithLiturgy.length > 0) {
      if (sessionData?.selectedServiceId) {
        const exists = servicesWithLiturgy.some(s => s.id === sessionData.selectedServiceId);
        if (exists) {
          setSelectedServiceId(sessionData.selectedServiceId);
          return;
        }
      }

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 1. Future or today's service
      const futureOrToday = [...servicesWithLiturgy]
        .reverse()
        .find(s => s._actualDate >= startOfToday);

      if (futureOrToday) {
        setSelectedServiceId(futureOrToday.id);
      } else {
        // 2. Most recent service
        setSelectedServiceId(servicesWithLiturgy[0].id);
      }
    }
  }, [selectedServiceId, servicesWithLiturgy, sessionData?.selectedServiceId]);

  const selectedService = useMemo(() => {
    return allServices.find(s => s.id === selectedServiceId) || servicesWithLiturgy[0] || null;
  }, [allServices, selectedServiceId, servicesWithLiturgy]);

  // Helper to split any lyric block with too many lines into balanced, harmonious sub-slides (max 4 lines per slide)
  const splitStropheHarmoniously = (strophe: string, maxLines: number = 4): string[] => {
    const lines = strophe.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= maxLines) {
      return [strophe];
    }
    
    const totalLines = lines.length;
    const numGroups = Math.ceil(totalLines / maxLines);
    const linesPerGroup = Math.ceil(totalLines / numGroups);
    
    const result: string[] = [];
    for (let i = 0; i < totalLines; i += linesPerGroup) {
      const groupLines = lines.slice(i, i + linesPerGroup);
      result.push(groupLines.join('\n'));
    }
    return result;
  };

  // Build slides from any lyrics or liturgy item text
  const buildSlidesFromContent = (item: any): string[] => {
    if (!item) return [];
    const lyricsText = item.lyrics || item.details || item.content || '';
    if (!lyricsText && !item.title) return [];

    const rawLyrics = cleanLyricsForProjection(lyricsText);
    let chunks: string[] = [];

    if (rawLyrics.includes('\n\n')) {
      chunks = rawLyrics
        .split(/\r?\n\r?\n+/)
        .map(b => b.trim())
        .filter(b => b.length > 0);
    } else if (rawLyrics.includes('\n')) {
      const lines = rawLyrics.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
      for (let i = 0; i < lines.length; i += 4) {
        chunks.push(lines.slice(i, i + 4).join('\n'));
      }
    } else if (item.isLiturgyItem && rawLyrics.length > 130) {
      const verseSplit = rawLyrics.split(/(?=\b\d+[\.\s]|\b\[\d+\])/);
      if (verseSplit.length > 1) {
        chunks = verseSplit.map(s => s.trim()).filter(s => s.length > 0);
      } else {
        chunks = rawLyrics.split(/(?<=\. )/g).map(s => s.trim()).filter(s => s.length > 0);
      }
    } else if (rawLyrics.trim()) {
      chunks = [rawLyrics.trim()];
    }

    const processedChunks = chunks.flatMap(chunk => splitStropheHarmoniously(chunk, 4));

    if (item.isLiturgyItem && item.title && item.id !== 'custom-free-text') {
      const titleLabel = item.artist || 'Momento';
      const introSlide = `${titleLabel}\n${item.title}`;
      return [introSlide, ...processedChunks];
    }

    return processedChunks.length > 0 ? processedChunks : [item.title || 'Slide'];
  };

  // Extract sequential Liturgy stages for the selected service
  const serviceLiturgyItems = useMemo(() => {
    if (!selectedService || !selectedService.liturgy) return [];

    return selectedService.liturgy.map((item: any, idx: number) => {
      const itemId = item.id || `liturgy-item-${idx}-${item.title}`;

      if (item.type === 'song') {
        let match: any = null;

        if (item.songId) {
          match = allSongs.find(s => s.id === item.songId);
        }
        if (!match && item.title) {
          const t = item.title.toLowerCase().trim();
          match = allSongs.find(s => s.title?.toLowerCase().trim() === t);
        }
        if (!match && item.title) {
          const normTitle = normalizeSongTitle(item.title);
          match = allSongs.find(s => normalizeSongTitle(s.title) === normTitle);
        }
        if (!match && item.title) {
          const lowerT = item.title.toLowerCase().trim();
          if (lowerT.includes('teu povo') || lowerT.includes('é o teu povo')) {
            const povoSong = allSongs.find(s => {
              const st = s.title?.toLowerCase().trim() || '';
              return st === 'é o teu povo' || st === 'e o teu povo' || st.startsWith('é o teu povo') || st.startsWith('e o teu povo');
            });
            if (povoSong) match = povoSong;
          }
        }
        if (!match && item.title) {
          match = findBestSongMatch(allSongs, item.title);
        }

        if (match) {
          return {
            ...match,
            id: match.id,
            type: 'song',
            lyrics: match.lyrics || '',
            liturgyItemId: itemId,
            stageIndex: idx,
            stageNumber: idx + 1,
            isSong: true
          };
        } else {
          return {
            id: itemId,
            title: item.title,
            artist: 'Música',
            type: 'song',
            lyrics: item.lyrics || item.details || 'Sem letra vinculada no repertório.',
            isPlaceholder: true,
            liturgyItemId: itemId,
            stageIndex: idx,
            stageNumber: idx + 1,
            isSong: true
          };
        }
      } else {
        // Non-song item (scripture reading, prayer, offering, word, etc.)
        let lyrics = item.details || item.content || '';

        // Standard Biblical Readings resolution
        const isMarcos10 = item.title && (
          item.title.toLowerCase().includes('marcos 10') || 
          item.title.toLowerCase().includes('mc 10')
        ) && (
          item.title.includes('1-12') || 
          item.title.includes('1 a 12') ||
          (lyrics && lyrics.includes('divorciar') && lyrics.includes('Moisés'))
        );

        const isSalmo92 = item.title && (
          item.title.toLowerCase().includes('salmo 92') ||
          item.title.toLowerCase().includes('salmos 92') ||
          item.title.toLowerCase().includes('sl 92')
        ) && (
          item.title.includes('1-5') ||
          item.title.includes('1 a 5') ||
          (lyrics && (lyrics.includes('render graças') || lyrics.includes('ó Altíssimo') || lyrics.includes('dez cordas')))
        );

        const isFilipenses4 = item.title && (
          item.title.toLowerCase().includes('filipenses 4') ||
          item.title.toLowerCase().includes('fp 4') ||
          item.title.toLowerCase().includes('philippians 4') ||
          item.title.toLowerCase().includes('phil 4')
        ) && (
          item.title.includes('4-7') ||
          item.title.includes('4 a 7') ||
          (lyrics && (lyrics.includes('Alegrem-se') || lyrics.includes('moderação') || lyrics.includes('preocupados') || lyrics.includes('excede todo') || lyrics.includes('alegrai-vos')))
        );

        if (isMarcos10) {
          lyrics = `1. Saindo dali, Jesus foi para o território da Judeia e para além do Jordão. E outra vez as multidões se reuniram junto a ele, e, de novo, ele as ensinava, segundo o seu costume.

2. E, aproximando-se alguns fariseus, o puseram à prova, perguntando: — É lícito ao marido repudiar a sua mulher?

3. Jesus respondeu: — O que foi que Moisés ordenou a vocês?

4. Eles disseram: — Moisés permitiu escrever uma carta de divórcio e repudiar.

5. Mas Jesus lhes disse: — Foi por causa da dureza do coração de vocês que Moisés deixou escrito esse mandamento.

6. Porém, desde o princípio da criação, Deus os fez homem e mulher.

7. "Por isso o homem deixará o seu pai e a sua mãe e se unirá à sua mulher,

8. tornando-se os dois uma só carne." De modo que já não são mais dois, porém uma só carne.

9. Portanto, que ninguém separe o que Deus ajuntou.

10. Em casa, os discípulos voltaram a fazer perguntas sobre esse assunto.

11. E Jesus lhes disse: — Quem repudiar a sua mulher e casar com outra comete adultério contra aquela.

12. E, se ela repudiar o seu marido e casar com outro, comete adultério.`;
        } else if (isSalmo92) {
          lyrics = `1. Bom é render graças ao Senhor e cantar louvores ao teu nome, ó Altíssimo,

2. anunciar de manhã a tua misericórdia e, durante as noites, a tua fidelidade,

3. com instrumentos de dez cordas, ao som da lira e com a solenidade da harpa.

4. Pois me alegraste, Senhor, com os teus feitos; exultarei nas obras das tuas mãos.

5. Como são grandes, Senhor, as tuas obras! Os teus pensamentos, que profundos!`;
        } else if (isFilipenses4) {
          lyrics = `4. Alegrem-se sempre no Senhor; outra vez digo: alegrem-se!

5. Que a moderação de vocês seja conhecida por todos. Perto está o Senhor.

6. Não fiquem preocupados com coisa alguma, mas, em tudo, sejam conhecidos diante de Deus os pedidos de vocês, pela oração e pela súplica, com ações de graças.

7. E a paz de Deus, que excede todo entendimento, guardará o coração e a mente de vocês em Cristo Jesus.`;
        }

        let artistLabel = 'Leitura Bíblica';
        if (item.type === 'speech') artistLabel = 'Ministração/Palavra';
        else if (item.type === 'prayer') artistLabel = 'Oração';
        else if (item.type === 'announcements') artistLabel = 'Avisos';
        else if (item.type === 'offering') artistLabel = 'Ofertas';
        else if (item.type === 'other') artistLabel = 'Momento';

        const lowerMoment = (item.moment || '').toLowerCase();
        const lowerTitle = (item.title || '').toLowerCase();
        const lowerLyrics = lyrics.toLowerCase();

        if (lowerMoment.includes('oração') || lowerTitle.includes('oração') || item.type === 'prayer') {
          artistLabel = 'Oração';
        } else if (lowerMoment.includes('aviso') || lowerTitle.includes('aviso') || item.type === 'announcements') {
          artistLabel = 'Avisos';
        } else if (lowerMoment.includes('ofert') || lowerTitle.includes('ofert') || lowerLyrics.includes('ofertório') || lowerLyrics.includes('oferta') || item.type === 'offering') {
          artistLabel = 'Ofertas';
        } else if (lowerMoment.includes('pregação') || lowerTitle.includes('pregação') || lowerMoment.includes('palavra') || lowerTitle.includes('palavra') || item.type === 'speech') {
          artistLabel = 'Ministração/Palavra';
        }

        let resolvedTitle = item.title?.trim();
        if (!resolvedTitle || 
            resolvedTitle.toLowerCase() === 'leitura' || 
            resolvedTitle.toLowerCase() === 'leitura bíblica' || 
            resolvedTitle.toLowerCase() === 'texto bíblico' ||
            resolvedTitle.toLowerCase() === 'momento') {
          
          if (artistLabel === 'Oração') resolvedTitle = 'Oração';
          else if (artistLabel === 'Avisos') resolvedTitle = 'Avisos';
          else if (artistLabel === 'Ofertas') resolvedTitle = 'Ofertas';
          else if (artistLabel === 'Ministração/Palavra') resolvedTitle = 'Palavra / Pregação';
          else if (item.moment) resolvedTitle = item.moment;
          else resolvedTitle = 'Leitura Bíblica';
        }

        return {
          id: itemId,
          title: resolvedTitle,
          artist: artistLabel,
          type: item.type || 'moment',
          bibleVersion: item.bibleVersion || 'NAA',
          lyrics: lyrics || 'Este item da liturgia não possui conteúdo de texto cadastrado.',
          isLiturgyItem: true,
          liturgyItemId: itemId,
          stageIndex: idx,
          stageNumber: idx + 1,
          isSong: false
        };
      }
    });
  }, [selectedService, allSongs]);

  // Current active liturgy item index
  const activeLiturgyIndex = useMemo(() => {
    if (!sessionData?.activeSongId && !sessionData?.activeLiturgyItemId) return -1;
    const targetId = sessionData.activeLiturgyItemId || sessionData.activeSongId;
    return serviceLiturgyItems.findIndex(i => i.id === targetId || i.liturgyItemId === targetId);
  }, [sessionData, serviceLiturgyItems]);

  const activeLiturgyItem = useMemo(() => {
    if (activeLiturgyIndex >= 0 && activeLiturgyIndex < serviceLiturgyItems.length) {
      return serviceLiturgyItems[activeLiturgyIndex];
    }
    return null;
  }, [activeLiturgyIndex, serviceLiturgyItems]);

  // Next and Previous liturgy items
  const nextLiturgyItem = useMemo(() => {
    if (activeLiturgyIndex >= 0 && activeLiturgyIndex < serviceLiturgyItems.length - 1) {
      return serviceLiturgyItems[activeLiturgyIndex + 1];
    }
    return null;
  }, [activeLiturgyIndex, serviceLiturgyItems]);

  const prevLiturgyItem = useMemo(() => {
    if (activeLiturgyIndex > 0) {
      return serviceLiturgyItems[activeLiturgyIndex - 1];
    }
    return null;
  }, [activeLiturgyIndex, serviceLiturgyItems]);

  // Project any Liturgy Item directly from mobile phone
  const handleSelectLiturgyItemToProject = (item: any, itemIndex: number) => {
    const rawSlides = buildSlidesFromContent(item);
    const firstSlideText = rawSlides[0] || item.title || '';

    updateSession({
      activeSongId: item.id,
      activeSongTitle: item.title,
      activeSongArtist: item.artist || '',
      selectedServiceId: selectedService?.id || selectedServiceId,
      activeLiturgyItemId: item.liturgyItemId || item.id,
      activeLiturgyIndex: itemIndex,
      slides: rawSlides.map((s, idx) => ({ type: 'text', text: s, index: idx })),
      activeSlideIdx: 0,
      text: firstSlideText,
      slideImageUrl: null,
      blackout: false,
      clearText: false,
      showLogo: false
    });

    setActiveTab('slides');
  };

  // Switch to next liturgy stage
  const handleGoToNextLiturgyStage = () => {
    if (nextLiturgyItem) {
      handleSelectLiturgyItemToProject(nextLiturgyItem, activeLiturgyIndex + 1);
    }
  };

  // Switch to prev liturgy stage
  const handleGoToPrevLiturgyStage = () => {
    if (prevLiturgyItem) {
      handleSelectLiturgyItemToProject(prevLiturgyItem, activeLiturgyIndex - 1);
    }
  };

  // Slide controls
  const handleSelectSlide = (idx: number) => {
    const rawSlides = sessionData?.slides || [];
    const targetSlide = rawSlides[idx];
    const textToShow = typeof targetSlide === 'string' ? targetSlide : (targetSlide?.text || '');
    const isImage = typeof targetSlide === 'object' && targetSlide !== null && targetSlide.type === 'image';

    updateSession({
      activeSlideIdx: idx,
      text: textToShow,
      slideImageUrl: isImage ? targetSlide.imageUrl : null,
      blackout: false,
      clearText: false,
      showLogo: false
    });
  };

  const handleNextSlide = () => {
    const rawSlides = sessionData?.slides || [];
    if (rawSlides.length === 0) return;
    const currentIdx = sessionData?.activeSlideIdx ?? -1;
    const nextIdx = currentIdx + 1;
    
    if (nextIdx < rawSlides.length) {
      handleSelectSlide(nextIdx);
    } else if (nextIdx >= rawSlides.length && nextLiturgyItem) {
      // If at the end of current slides, clicking next can automatically advance to next liturgy item!
      handleGoToNextLiturgyStage();
    }
  };

  const handlePrevSlide = () => {
    const rawSlides = sessionData?.slides || [];
    if (rawSlides.length === 0) return;
    const currentIdx = sessionData?.activeSlideIdx ?? 0;
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) {
      handleSelectSlide(prevIdx);
    }
  };

  const handleToggleBlackout = () => {
    const next = !sessionData?.blackout;
    updateSession({ blackout: next });
  };

  const handleToggleClearText = () => {
    const next = !sessionData?.clearText;
    updateSession({ 
      clearText: next,
      showLogo: next ? false : sessionData?.showLogo 
    });
  };

  const handleToggleLogo = () => {
    const next = !sessionData?.showLogo;
    updateSession({ 
      showLogo: next,
      clearText: next ? false : sessionData?.clearText 
    });
  };

  const handleSendAlert = (alertText: string | null) => {
    updateSession({ scrollingAlert: alertText });
    if (!alertText) setCustomAlertText('');
  };

  // Select a song from full repertoire
  const handleSelectSongToProject = (song: any) => {
    const rawSlides = buildSlidesFromContent(song);
    const firstSlide = rawSlides[0] || song.title;

    updateSession({
      activeSongId: song.id,
      activeSongTitle: song.title,
      activeSongArtist: song.artist || 'Música',
      activeLiturgyItemId: song.id,
      activeLiturgyIndex: -1,
      slides: rawSlides.map((s, i) => ({ type: 'text', text: s, index: i })),
      activeSlideIdx: 0,
      text: firstSlide,
      slideImageUrl: null,
      blackout: false,
      clearText: false,
      showLogo: false
    });

    setActiveTab('slides');
  };

  // Project Bible verse
  const handleProjectBibleVerse = () => {
    const reference = `${bibleBook} ${bibleChapter}:${bibleVerse}`;
    const fullSlideText = `"${bibleText}"\n\n— ${reference} (NAA)`;
    
    updateSession({
      activeSongId: 'bible-verse',
      activeSongTitle: reference,
      activeSongArtist: 'Bíblia Sagrada',
      slides: [{ type: 'text', text: fullSlideText, index: 0 }],
      activeSlideIdx: 0,
      text: fullSlideText,
      slideImageUrl: null,
      blackout: false,
      clearText: false,
      showLogo: false
    });

    setActiveTab('slides');
  };

  // Connection calculations
  const projectorOnlineAt = sessionData?.projectorOnlineAt;
  const isProjectorLive = useMemo(() => {
    if (!projectorOnlineAt) return false;
    const diff = currentTime - new Date(projectorOnlineAt).getTime();
    return diff < 40000; // heartbeat is sent every 15s; 40s tolerance
  }, [projectorOnlineAt, currentTime]);

  const secondsSinceProjector = useMemo(() => {
    if (!projectorOnlineAt) return null;
    return Math.max(0, Math.floor((currentTime - new Date(projectorOnlineAt).getTime()) / 1000));
  }, [projectorOnlineAt, currentTime]);

  // Sync state classification
  const syncStatus = useMemo<'synced' | 'cloud_ready' | 'connecting' | 'disconnected'>(() => {
    if (!isConnected && !sessionData) return 'connecting';
    if (!isConnected) return 'disconnected';
    if (isProjectorLive) return 'synced';
    return 'cloud_ready';
  }, [isConnected, sessionData, isProjectorLive]);

  // Ping test function
  const handleTestPing = async () => {
    triggerHaptic();
    setIsTestingPing(true);
    setPingResult('none');
    const timestamp = Date.now();
    await updateSession({ pingTimestamp: timestamp });
    setTimeout(() => {
      setIsTestingPing(false);
      setPingResult('success');
      setTimeout(() => setPingResult('none'), 4000);
    }, 500);
  };

  // Generate QR Code for connection pairing modal
  useEffect(() => {
    if (showConnectionModal) {
      const remoteUrl = `${window.location.origin}?remote=true&church=${churchId}&session=${sessionId}`;
      QRCode.toDataURL(remoteUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#09090b', light: '#ffffff' }
      }).then(url => setQrCodeDataUrl(url)).catch(() => {});
    }
  }, [showConnectionModal, churchId, sessionId]);

  // Filter songs for search
  const filteredSongs = useMemo(() => {
    if (!songSearchQuery.trim()) return allSongs.slice(0, 40);
    const q = songSearchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return allSongs.filter(s => {
      const t = (s.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const a = (s.artist || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const l = (s.lyrics || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return t.includes(q) || a.includes(q) || l.includes(q);
    });
  }, [allSongs, songSearchQuery]);

  // Current active slides list
  const currentSlides: any[] = useMemo(() => {
    const raw = sessionData?.slides;
    if (Array.isArray(raw)) return raw;
    return [];
  }, [sessionData]);

  const activeSlideIdx = sessionData?.activeSlideIdx ?? -1;
  const isLastSlide = activeSlideIdx >= currentSlides.length - 1 && currentSlides.length > 0;

  // Copy remote URL helper
  const handleCopyLink = () => {
    const url = `${window.location.origin}?remote=true&church=${churchId}&session=${sessionId}`;
    navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  // Helper for liturgy category badge
  const getItemBadgeInfo = (item: any) => {
    if (item.type === 'song' || item.isSong) {
      return { label: 'Música', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', icon: Music };
    }
    if (item.type === 'prayer' || item.artist === 'Oração') {
      return { label: 'Oração', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: Heart };
    }
    if (item.type === 'offering' || item.artist === 'Ofertas') {
      return { label: 'Dízimos / Ofertas', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Gift };
    }
    if (item.type === 'speech' || item.artist === 'Ministração/Palavra') {
      return { label: 'Palavra / Pregação', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: BookOpen };
    }
    if (item.type === 'announcements' || item.artist === 'Avisos') {
      return { label: 'Avisos', bg: 'bg-pink-500/10 text-pink-400 border-pink-500/30', icon: Megaphone };
    }
    return { label: item.artist || 'Momento', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: Sparkles };
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between select-none pb-28 font-sans">
      {/* Top Mobile Status Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4 py-3 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {onBackToApp && (
              <button 
                onClick={onBackToApp}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Voltar ao App"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                {/* Visual Connection Status Indicator */}
                {syncStatus === 'synced' && (
                  <button 
                    onClick={() => { triggerHaptic(); setShowConnectionModal(true); }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm"
                    title="Telão conectado e sincronizado em tempo real"
                  >
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <Wifi size={11} className="shrink-0" />
                    <span>Telão Sincronizado</span>
                  </button>
                )}

                {syncStatus === 'cloud_ready' && (
                  <button 
                    onClick={() => { triggerHaptic(); setShowConnectionModal(true); }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm"
                    title="Nuvem ativa. Clique para abrir o telão ou verificar conexão."
                  >
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                    <Monitor size={11} className="shrink-0" />
                    <span>Nuvem OK • Telão em Espera</span>
                  </button>
                )}

                {syncStatus === 'connecting' && (
                  <button 
                    onClick={() => { triggerHaptic(); setShowConnectionModal(true); }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-400 text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    <RefreshCw size={10} className="animate-spin shrink-0" />
                    <span>Conectando...</span>
                  </button>
                )}

                {syncStatus === 'disconnected' && (
                  <button 
                    onClick={() => { triggerHaptic(); setShowConnectionModal(true); }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                  >
                    <WifiOff size={11} className="shrink-0" />
                    <span>Desconectado (Reconectar)</span>
                  </button>
                )}
              </div>
              <h2 className="text-xs font-bold text-zinc-300 mt-0.5">
                Controle Remoto de Projeção
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTestPing}
              disabled={isTestingPing}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 transition-colors"
              title="Testar sinal com o telão (Ping)"
            >
              {isTestingPing ? (
                <RefreshCw size={15} className="animate-spin text-amber-400" />
              ) : pingResult === 'success' ? (
                <CheckCircle2 size={15} className="text-emerald-400" />
              ) : (
                <Zap size={15} />
              )}
            </button>

            <button
              onClick={() => { triggerHaptic(); setShowConnectionModal(true); }}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
              title="Status e Diagnóstico de Conexão"
            >
              <Activity size={15} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Mobile Pills) */}
        <div className="max-w-md mx-auto mt-2.5 flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
          <button
            onClick={() => { triggerHaptic(); setActiveTab('liturgy'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'liturgy'
                ? 'bg-amber-500 text-zinc-950 shadow-md scale-102'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            <ListOrdered size={14} />
            Liturgia ({serviceLiturgyItems.length})
          </button>

          <button
            onClick={() => { triggerHaptic(); setActiveTab('slides'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'slides'
                ? 'bg-amber-500 text-zinc-950 shadow-md scale-102'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            <Layers size={14} />
            Slides {currentSlides.length > 0 && `(${activeSlideIdx + 1}/${currentSlides.length})`}
          </button>

          <button
            onClick={() => { triggerHaptic(); setActiveTab('repertoire'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'repertoire'
                ? 'bg-amber-500 text-zinc-950 shadow-md scale-102'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            <Music size={14} />
            Músicas
          </button>

          <button
            onClick={() => { triggerHaptic(); setActiveTab('bible'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'bible'
                ? 'bg-amber-500 text-zinc-950 shadow-md scale-102'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            Bíblia
          </button>

          <button
            onClick={() => { triggerHaptic(); setActiveTab('alert'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'alert'
                ? 'bg-amber-500 text-zinc-950 shadow-md scale-102'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            <Megaphone size={14} />
            Avisos
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="max-w-md mx-auto w-full p-4 flex-1 space-y-4">
        
        {/* Tab 1: Liturgia / Roteiro Completo do Culto */}
        {activeTab === 'liturgy' && (
          <div className="space-y-4">
            {/* Culto Selector Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Culto Selecionado
                  </span>
                  <h3 className="text-base font-black text-zinc-100 flex items-center gap-1.5">
                    <Calendar size={16} className="text-amber-400" />
                    {selectedService?.title || 'Culto de Celebração'}
                  </h3>
                </div>

                {servicesWithLiturgy.length > 1 && (
                  <button
                    onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                    className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-amber-400 border border-zinc-700 flex items-center gap-1"
                  >
                    Trocar Culto <ChevronDown size={14} />
                  </button>
                )}
              </div>

              {selectedService?.date && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Clock size={13} className="text-zinc-500" />
                  <span>
                    {new Date(selectedService.date).toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                  {selectedService.theme && (
                    <span className="text-amber-400/90 font-medium truncate">
                      • {selectedService.theme}
                    </span>
                  )}
                </div>
              )}

              {/* Dropdown to switch service */}
              {showServiceDropdown && (
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
                  <p className="text-[10px] font-black uppercase text-zinc-500 px-2 py-1">Selecione o Culto:</p>
                  {servicesWithLiturgy.map(srv => {
                    const isSrvActive = srv.id === selectedService?.id;
                    const dateStr = srv.date ? new Date(srv.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';
                    return (
                      <button
                        key={srv.id}
                        onClick={() => {
                          setSelectedServiceId(srv.id);
                          setShowServiceDropdown(false);
                          updateSession({ selectedServiceId: srv.id });
                        }}
                        className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all ${
                          isSrvActive 
                            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300' 
                            : 'hover:bg-zinc-900 text-zinc-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate">{srv.title}</p>
                          <p className="text-[10px] text-zinc-500 font-normal">{dateStr} • {srv.liturgy?.length || 0} etapas</p>
                        </div>
                        {isSrvActive && <CheckCircle size={14} className="text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Liturgy Stages List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Etapas da Liturgia ({serviceLiturgyItems.length})
                </span>
                <span className="text-[10px] text-zinc-500 italic">
                  Toque para projetar diretamente
                </span>
              </div>

              {serviceLiturgyItems.length === 0 ? (
                <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center space-y-2">
                  <ListOrdered size={32} className="text-zinc-600 mx-auto" />
                  <p className="text-sm font-bold text-zinc-300">Nenhuma etapa cadastrada neste culto.</p>
                  <p className="text-xs text-zinc-500">
                    Cadastre o roteiro da liturgia no menu "Escala &gt; Liturgia" do aplicativo.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {serviceLiturgyItems.map((item, idx) => {
                    const isActive = (sessionData?.activeSongId === item.id || sessionData?.activeLiturgyItemId === item.liturgyItemId);
                    const badgeInfo = getItemBadgeInfo(item);
                    const IconComponent = badgeInfo.icon;

                    return (
                      <div
                        key={item.id || idx}
                        onClick={() => handleSelectLiturgyItemToProject(item, idx)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left active:scale-98 ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-amber-500/50 ring-1 ring-amber-500/30 shadow-lg'
                            : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            {/* Step Number Badge */}
                            <span className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black font-mono shrink-0 mt-0.5 ${
                              isActive ? 'bg-amber-500 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {idx + 1}
                            </span>

                            <div className="min-w-0">
                              {/* Category Badge */}
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${badgeInfo.bg}`}>
                                  <IconComponent size={10} />
                                  {badgeInfo.label}
                                </span>

                                {isActive && (
                                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    No Telão
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h4 className={`text-sm font-black truncate leading-snug ${
                                isActive ? 'text-amber-300' : 'text-zinc-100'
                              }`}>
                                {item.title}
                              </h4>

                              {/* Subtitle / Artist / Details */}
                              {item.artist && item.artist !== badgeInfo.label && (
                                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                  {item.artist}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quick Action Button */}
                          <div className="shrink-0 flex items-center mt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectLiturgyItemToProject(item, idx);
                              }}
                              className={`p-2 rounded-xl text-xs font-black transition-all ${
                                isActive
                                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                                  : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
                              }`}
                              title="Projetar etapa"
                            >
                              <Play size={14} fill={isActive ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Slides / Letras com Navegação de Etapa e Troca Rápida */}
        {activeTab === 'slides' && (
          <div className="space-y-4">
            {/* Active Liturgy Item Header Banner */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {activeLiturgyIndex >= 0 ? `Etapa ${activeLiturgyIndex + 1} de ${serviceLiturgyItems.length}` : 'Música Avulsa'}
                    </span>
                    {activeLiturgyItem?.artist && (
                      <span className="text-[10px] text-zinc-400 truncate">
                        • {activeLiturgyItem.artist}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-zinc-100 truncate mt-1">
                    {sessionData?.activeSongTitle || 'Nenhum slide selecionado'}
                  </h3>
                </div>

                <button
                  onClick={() => { triggerHaptic(); setActiveTab('liturgy'); }}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-amber-400 border border-zinc-700 shrink-0 flex items-center gap-1 shadow-sm"
                >
                  <ListOrdered size={13} />
                  Ver Roteiro
                </button>
              </div>

              {/* Liturgy Stages Quick Navigation Bar */}
              {serviceLiturgyItems.length > 0 && (
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <button
                    disabled={!prevLiturgyItem}
                    onClick={handleGoToPrevLiturgyStage}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 text-[11px] font-bold border border-zinc-800 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ChevronLeft size={14} />
                    <span className="truncate">
                      {prevLiturgyItem ? `Etapa ${prevLiturgyItem.stageNumber}: ${prevLiturgyItem.title}` : 'Início'}
                    </span>
                  </button>

                  <button
                    disabled={!nextLiturgyItem}
                    onClick={handleGoToNextLiturgyStage}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-30 disabled:pointer-events-none text-amber-300 text-[11px] font-black border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span className="truncate">
                      {nextLiturgyItem ? `Etapa ${nextLiturgyItem.stageNumber}: ${nextLiturgyItem.title}` : 'Fim'}
                    </span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Current Active Slide Text Preview Card */}
            {sessionData?.text && !sessionData?.blackout && !sessionData?.clearText && (
              <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1">
                  Exibindo no Telão Agora ({activeSlideIdx + 1}/{currentSlides.length}):
                </span>
                <p className="text-sm font-bold whitespace-pre-wrap leading-relaxed">
                  {sessionData.text}
                </p>
              </div>
            )}

            {/* Slide Grid / Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Slides da Etapa ({currentSlides.length})
                </span>
                <span className="text-[10px] text-zinc-500 italic">
                  Toque para projetar
                </span>
              </div>

              {currentSlides.length === 0 ? (
                <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center space-y-2">
                  <Tv size={32} className="text-zinc-600 mx-auto" />
                  <p className="text-sm font-bold text-zinc-300">Nenhum slide disponível.</p>
                  <p className="text-xs text-zinc-500">
                    Abra a aba "Liturgia" ou "Músicas" e selecione um item para projetar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {currentSlides.map((slide, idx) => {
                    const isSelected = idx === activeSlideIdx;
                    const text = typeof slide === 'string' ? slide : (slide?.text || '');
                    const isImage = typeof slide === 'object' && slide?.type === 'image';

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectSlide(idx)}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden active:scale-98 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-500/40 shadow-lg text-white'
                            : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isSelected ? 'bg-amber-400 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            Slide {idx + 1}
                          </span>

                          {isSelected && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Ativo
                            </span>
                          )}
                        </div>

                        {isImage ? (
                          <div className="text-xs italic text-zinc-400">
                            🖼 Slide com Imagem Personalizada
                          </div>
                        ) : (
                          <p className="text-xs font-semibold whitespace-pre-wrap leading-relaxed line-clamp-4">
                            {text}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Músicas (Repertório Completo) */}
        {activeTab === 'repertoire' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Buscar música por título, artista ou trecho..."
                value={songSearchQuery}
                onChange={(e) => setSongSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Repertório ({filteredSongs.length})
                </span>
                <span className="text-[10px] text-zinc-500 italic">
                  Toque para projetar
                </span>
              </div>

              {filteredSongs.length === 0 ? (
                <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center text-zinc-500 text-xs">
                  Nenhuma música encontrada para "{songSearchQuery}".
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSongs.map((song) => {
                    const isProjectingThis = sessionData?.activeSongId === song.id;
                    return (
                      <div
                        key={song.id}
                        onClick={() => handleSelectSongToProject(song)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                          isProjectingThis 
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                            : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <h4 className="text-xs font-black truncate">{song.title}</h4>
                            <p className="text-[10px] text-zinc-400 truncate mt-0.5">{song.artist || 'Artista não informado'}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSongToProject(song);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[11px] uppercase tracking-wider shadow-sm shrink-0"
                          >
                            Projetar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Bíblia */}
        {activeTab === 'bible' && (
          <div className="space-y-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-sm">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Projeção Instantânea
              </span>
              <h3 className="text-base font-black text-zinc-100">Bíblia Sagrada</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Livro</label>
                <input
                  type="text"
                  value={bibleBook}
                  onChange={(e) => setBibleBook(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Capítulo</label>
                <input
                  type="text"
                  value={bibleChapter}
                  onChange={(e) => setBibleChapter(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Versículo</label>
                <input
                  type="text"
                  value={bibleVerse}
                  onChange={(e) => setBibleVerse(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Texto do Versículo</label>
              <textarea
                rows={4}
                value={bibleText}
                onChange={(e) => setBibleText(e.target.value)}
                className="w-full p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs leading-relaxed focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <button
              onClick={handleProjectBibleVerse}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <BookOpen size={16} />
              Projetar Versículo no Telão
            </button>
          </div>
        )}

        {/* Tab 5: Quick Scrolling Alert / Aviso no Rodapé */}
        {activeTab === 'alert' && (
          <div className="space-y-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-sm">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Letreiro no Rodapé do Telão
              </span>
              <h3 className="text-base font-black text-zinc-100">Aviso Rápido</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Exiba uma mensagem urgente em letreiro rolante no rodapé do telão sem interromper o louvor.
              </p>
            </div>

            {sessionData?.scrollingAlert && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase text-amber-400">Aviso Ativo no Telão:</span>
                  <p className="text-xs font-bold text-zinc-100 truncate">{sessionData.scrollingAlert}</p>
                </div>
                <button
                  onClick={() => handleSendAlert(null)}
                  className="px-2.5 py-1 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold border border-red-500/30"
                >
                  Remover
                </button>
              </div>
            )}

            <div>
              <input
                type="text"
                placeholder="Ex: Veículo placa ABC-1234 com farol ligado..."
                value={customAlertText}
                onChange={(e) => setCustomAlertText(e.target.value)}
                className="w-full p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quick preset buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCustomAlertText('Veículo com farol ligado no estacionamento.')}
                className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[11px] font-bold text-left"
              >
                🚗 Farol Ligado
              </button>
              <button
                onClick={() => setCustomAlertText('Pais dos bebês favor comparecer ao Berçário.')}
                className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[11px] font-bold text-left"
              >
                👶 Chamado Berçário
              </button>
              <button
                onClick={() => setCustomAlertText('Favor colocar os celulares no modo silencioso.')}
                className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[11px] font-bold text-left"
              >
                🔕 Modo Silencioso
              </button>
              <button
                onClick={() => setCustomAlertText('Ensaio geral da equipe logo após o culto.')}
                className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[11px] font-bold text-left"
              >
                🎵 Ensaio da Equipe
              </button>
            </div>

            <button
              disabled={!customAlertText.trim()}
              onClick={() => handleSendAlert(customAlertText.trim())}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <Send size={15} />
              Enviar Aviso para o Telão
            </button>
          </div>
        )}
      </main>

      {/* Fixed Sticky Mobile Bottom Controls (Thumb Ergonomics) */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 p-3 shadow-2xl">
        <div className="max-w-md mx-auto space-y-2">
          {/* Quick Aux Actions (Blackout, Clear, Logo) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleToggleBlackout}
              className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider border flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                sessionData?.blackout 
                  ? 'bg-red-500 text-white border-red-400 shadow-md ring-2 ring-red-500/30' 
                  : 'bg-zinc-800/90 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              <Square size={13} fill={sessionData?.blackout ? 'currentColor' : 'none'} />
              {sessionData?.blackout ? 'Ativo (Apagado)' : 'Apagar'}
            </button>

            <button
              onClick={handleToggleClearText}
              className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider border flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                sessionData?.clearText 
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md ring-2 ring-amber-500/30' 
                  : 'bg-zinc-800/90 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              <Sparkles size={13} />
              {sessionData?.clearText ? 'Texto Oculto' : 'Limpar'}
            </button>

            <button
              onClick={handleToggleLogo}
              className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider border flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                sessionData?.showLogo 
                  ? 'bg-blue-500 text-white border-blue-400 shadow-md ring-2 ring-blue-500/30' 
                  : 'bg-zinc-800/90 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              <Tv size={13} />
              {sessionData?.showLogo ? 'Logo Ativo' : 'Logo'}
            </button>
          </div>

          {/* Primary Navigation Buttons (Big Touch Targets) */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handlePrevSlide}
              disabled={activeSlideIdx <= 0 || currentSlides.length === 0}
              className="py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none border border-zinc-700 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
            >
              <ChevronLeft size={20} />
              Anterior
            </button>

            <button
              onClick={handleNextSlide}
              disabled={(activeSlideIdx >= currentSlides.length - 1 && !nextLiturgyItem) || currentSlides.length === 0}
              className="py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:pointer-events-none text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg truncate px-2"
            >
              <span className="truncate">
                {isLastSlide && nextLiturgyItem 
                  ? `Próx: Etapa ${nextLiturgyItem.stageNumber}` 
                  : 'Próximo'}
              </span>
              <ChevronRight size={20} className="shrink-0" />
            </button>
          </div>
        </div>
      </footer>

      {/* Connection Diagnostics & Pairing Modal */}
      <AnimatePresence>
        {showConnectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-5 text-white shadow-2xl space-y-4 my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-zinc-100">Status de Conexão</h3>
                    <p className="text-[11px] text-zinc-400">Sincronização em tempo real com o Telão</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConnectionModal(false)}
                  className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status Breakdown Cards */}
              <div className="space-y-2.5">
                {/* 1. Telão (Projector) Status */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  isProjectorLive 
                    ? 'bg-emerald-950/20 border-emerald-500/30' 
                    : 'bg-amber-950/20 border-amber-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor size={16} className={isProjectorLive ? 'text-emerald-400' : 'text-amber-400'} />
                      <span className="text-xs font-bold text-zinc-200">Telão da Projeção</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                      isProjectorLive 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isProjectorLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      {isProjectorLive ? 'Ao Vivo & Online' : 'Aguardando Telão'}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                    {isProjectorLive 
                      ? `O telão do projetor está aberto, respondendo ativamente (sinal recebido há ${secondsSinceProjector ?? 0}s).` 
                      : 'O telão ainda não enviou sinal recente. Certifique-se de que a tela de projeção está aberta no computador da igreja.'}
                  </p>

                  {!isProjectorLive && (
                    <button
                      onClick={() => window.open(`${window.location.origin}?projection=true&church=${churchId}&session=${sessionId}`, '_blank')}
                      className="mt-2.5 w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <ExternalLink size={13} />
                      Abrir Tela de Projeção em Nova Aba
                    </button>
                  )}
                </div>

                {/* 2. Nuvem Firebase Status */}
                <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi size={16} className="text-blue-400" />
                      <span className="text-xs font-bold text-zinc-200">Nuvem em Tempo Real</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      Conectado
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Sessão / Congregação:</span>
                    <span className="font-mono text-zinc-200 font-bold">{sessionId}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Culto Ativo no Celular:</span>
                    <span className="text-amber-400 font-bold truncate max-w-[200px]">
                      {selectedService?.title || 'Padrão'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ping Test Button */}
              <div>
                <button
                  disabled={isTestingPing}
                  onClick={handleTestPing}
                  className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  {isTestingPing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Testando Comunicação com o Telão...
                    </>
                  ) : pingResult === 'success' ? (
                    <>
                      <CheckCircle2 size={14} />
                      Sinal Enviado ao Telão com Sucesso!
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Enviar Sinal de Teste (Ping) ao Telão
                    </>
                  )}
                </button>
              </div>

              {/* Pairing QR Code and Share */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Pareamento com Outro Celular
                </span>
                <p className="text-[11px] text-zinc-400 leading-tight">
                  Escaneie com a câmera do celular de outro membro para controlar a projeção:
                </p>

                {qrCodeDataUrl ? (
                  <div className="flex justify-center py-1">
                    <img 
                      src={qrCodeDataUrl} 
                      alt="QR Code Controle Remoto" 
                      className="w-36 h-36 rounded-xl border border-zinc-700 bg-white p-1.5 shadow-md"
                    />
                  </div>
                ) : (
                  <div className="w-36 h-36 mx-auto rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                    Gerando QR...
                  </div>
                )}

                <button
                  onClick={handleCopyLink}
                  className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  {copyFeedback ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      Link Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copiar Link do Controle
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
