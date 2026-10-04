// LiLouPro - Repertório Musical
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Plus, Music, Star, ChevronRight, Zap, Settings, Mic, X, 
  ExternalLink, Sparkles, FolderOpen, Save, Play, FileText, Youtube,
  ChevronUp, ChevronDown, Trash2, Calendar, Clock, ArrowUpDown
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, onSnapshot, addDoc, query, orderBy, serverTimestamp, doc, updateDoc 
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { getArtistImage, ArtistAvatar } from './songsShared';
import { DEFAULT_LOCAL_SONGS } from '../songsDatabase';
import { GoogleDriveIcon } from './GoogleDriveIcon';
import ContextualHelp from './ContextualHelp';
import { CadernoGoogleDocsModal } from './CadernoGoogleDocsModal';

// Re-exports for critical modules referenced by App.tsx and LiturgyView
export { SongDetailView } from './SongDetailView';
export { AvailabilityView } from './AvailabilityView';
export { LiturgyEditor } from './LiturgyEditor';

interface SongsViewProps {
  onSelectSong: (song: any) => void;
  initialAdd?: boolean;
  onAddModalClose?: () => void;
  showLiturgySongs?: boolean;
  setShowLiturgySongs?: (show: boolean) => void;
  createNotifications?: any;
  onStartPlaylist?: (songs: any[]) => void;
  theme?: string;
  allSongs?: any[];
  liturgySongs?: any[];
  activeLiturgyService?: any;
  allServices?: any[];
}

// Extrai ou classifica a categoria litúrgica / teológica da música
function getSongCategory(song: any): string | null {
  if (song.category && typeof song.category === 'string' && song.category.trim()) {
    return song.category.toUpperCase().trim();
  }

  // Verificar se tem bloco de liturgia associado (ex: Criação, Queda, Redenção, Consumação)
  if (song.liturgySection && typeof song.liturgySection === 'string') {
    return song.liturgySection.toUpperCase().trim();
  }

  // Verificar nas tags
  if (Array.isArray(song.tags) && song.tags.length > 0) {
    const candidate = song.tags.find((t: any) => {
      const s = String(t).toLowerCase().trim();
      return s !== 'louvor' && s !== 'geral' && s.length > 2;
    });
    if (candidate) return String(candidate).toUpperCase().trim();
  } else if (typeof song.tags === 'string' && song.tags) {
    const parts = song.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    const candidate = parts.find((t: string) => t.toLowerCase() !== 'louvor' && t.length > 2);
    if (candidate) return candidate.toUpperCase();
  }

  // Mapeamento padrão de temas litúrgicos das canções cristãs clássicas
  const normTitle = (song.title || '').toLowerCase().trim();
  if (normTitle.includes('é o teu povo') || normTitle.includes('e o teu povo')) {
    return 'CRIAÇÃO/ADORAÇÃO';
  }
  if (normTitle.includes('perdão e graça') || normTitle.includes('perdao e graca')) {
    return 'QUEDA/CONFISSÃO';
  }
  if (normTitle.includes('tudo pra tua gloria') || normTitle.includes('tudo para tua glória') || normTitle.includes('tudo pra tua glória')) {
    return 'REDENÇÃO/AÇÃO DE GRAÇAS';
  }
  if (normTitle.includes('alto preço') || normTitle.includes('alto preco') || normTitle.includes('bondade de deus')) {
    return 'REDENÇÃO/AÇÃO DE GRAÇAS';
  }
  if (normTitle.includes('bendito seja deus e pai') || normTitle.includes('canção do apocalipse') || normTitle.includes('cancao do apocalipse')) {
    return 'CONSUMAÇÃO/RESPOSTA';
  }
  if (normTitle.includes('ceia') || normTitle.includes('corpo e sangue')) {
    return 'CEIA DO SENHOR';
  }
  if (normTitle.includes('comunhão') || normTitle.includes('comunhao')) {
    return 'COMUNHÃO/EDIFICAÇÃO';
  }
  return null;
}

// Formata data e horário para exibição no card de culto com dia da semana e clareza total
function formatServiceDateTime(serviceDate: any, serviceTime?: string): string {
  let dateObj: Date | null = null;
  if (serviceDate?.toDate) {
    dateObj = serviceDate.toDate();
  } else if (serviceDate instanceof Date) {
    dateObj = serviceDate;
  } else if (typeof serviceDate === 'string' && serviceDate) {
    // Tenta formato YYYY-MM-DD
    const parts = serviceDate.split('-');
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      const d = new Date(serviceDate);
      if (!isNaN(d.getTime())) dateObj = d;
    }
  }

  if (!dateObj) {
    const now = new Date();
    const daysUntilNextSunday = (7 - now.getDay()) % 7 || 7;
    dateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilNextSunday);
  }

  const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const weekDay = daysOfWeek[dateObj.getDay()];
  const day = String(dateObj.getDate()).padStart(2, '0');
  const monthName = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const rawTime = serviceTime || (dateObj ? `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}` : '10:30');
  const cleanTime = rawTime === '00:00' ? '10:30' : rawTime;

  return `${weekDay}, ${day} de ${monthName} de ${year} • ${cleanTime}h`;
}

export function SongsView({
  onSelectSong,
  initialAdd = false,
  onAddModalClose,
  showLiturgySongs: propShowLiturgySongs = false,
  setShowLiturgySongs: propSetShowLiturgySongs,
  createNotifications,
  onStartPlaylist,
  theme = 'dark',
  allSongs: propAllSongs,
  liturgySongs: propLiturgySongs,
  activeLiturgyService: propActiveLiturgyService,
  allServices: propAllServices
}: SongsViewProps) {
  const { churchData, isAdmin, user } = useAuth();
  const churchId = churchData?.id || localStorage.getItem('lilo_active_church_id') || 'semente';

  // Lista de músicas principal
  const [songs, setSongs] = useState<any[]>(() => {
    if (propAllSongs && propAllSongs.length > 0) return propAllSongs;
    try {
      const cached = localStorage.getItem('liloupro_offline_songs');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_LOCAL_SONGS.map((s, idx) => ({ id: `local_seed_${idx}`, ...s, tone: s.key }));
  });

  const [loading, setLoading] = useState(false);

  // Filtros ativos
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyLiturgy, setShowOnlyLiturgy] = useState(propShowLiturgySongs);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Reconhecimento de voz para busca
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Favoritos persistidos
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('liloupro_favorite_songs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {}
    return new Set();
  });

  // Modal de Adicionar Música
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialAdd);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newTone, setNewTone] = useState('C');
  const [newBpm, setNewBpm] = useState<number | ''>('');
  const [newCategory, setNewCategory] = useState('');
  const [newLyrics, setNewLyrics] = useState('');
  const [savingSong, setSavingSong] = useState(false);

  // Modal do Google Drive da Equipe
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveUrlInput, setDriveUrlInput] = useState(() => {
    return (
      churchData?.teamDriveUrl || 
      churchData?.driveFolderUrl || 
      localStorage.getItem('liloupro_team_drive_url') || 
      ''
    );
  });
  const [savingDriveUrl, setSavingDriveUrl] = useState(false);

  // Modal de Vincular Playlist (YouTube)
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [playlistUrlInput, setPlaylistUrlInput] = useState('');

  // Modal do Caderno de Cifras (Google Docs)
  const [isCadernoModalOpen, setIsCadernoModalOpen] = useState(false);

  // Modal de Adicionar Música Diretamente ao Culto Atual
  const [isAddToServiceModalOpen, setIsAddToServiceModalOpen] = useState(false);

  // Pergunta de confirmação para mudança de ordem nas Músicas do Culto
  const [reorderConfirm, setReorderConfirm] = useState<{
    index: number;
    direction: 'up' | 'down';
    songTitle: string;
  } | null>(null);

  // Determinar o culto ativo para a seção "Músicas do Culto"
  const currentService = useMemo(() => {
    if (propActiveLiturgyService) return propActiveLiturgyService;
    if (propAllServices && propAllServices.length > 0) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const parseDate = (s: any) => {
        let d;
        if (s.date?.toDate) d = s.date.toDate();
        else if (s.date instanceof Date) d = s.date;
        else d = new Date(s.date);
        return isNaN(d.getTime()) ? new Date(0) : d;
      };

      const sorted = [...propAllServices].sort((a, b) => parseDate(a).getTime() - parseDate(b).getTime());

      // 1. Prioriza o próximo culto agendado a partir de hoje
      const upcoming = sorted.find(s => parseDate(s) >= startOfToday);
      if (upcoming) return upcoming;

      // 2. Se não houver cultos futuros, utiliza o mais recente
      return sorted[sorted.length - 1];
    }

    // Fallback: calcula dinamicamente a data do próximo domingo
    const now = new Date();
    const daysUntilNextSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilNextSunday);
    const yyyy = nextSunday.getFullYear();
    const mm = String(nextSunday.getMonth() + 1).padStart(2, '0');
    const dd = String(nextSunday.getDate()).padStart(2, '0');

    return {
      id: 'upcoming_sunday_service',
      title: 'Culto de Domingo',
      name: 'Culto de Domingo',
      date: `${yyyy}-${mm}-${dd}`,
      time: '10:30',
      liturgy: []
    };
  }, [propActiveLiturgyService, propAllServices]);

  // Lista ordenada das músicas do culto ativo
  const [orderedLiturgySongs, setOrderedLiturgySongs] = useState<any[]>([]);

  // Helper para preservar momentos não-musicais (leituras bíblicas, orações, pregações) ao reordenar canções
  const buildUpdatedLiturgy = (existingLiturgy: any[], reorderedSongs: any[]) => {
    if (!existingLiturgy || !Array.isArray(existingLiturgy) || existingLiturgy.length === 0) {
      return reorderedSongs.map((s, idx) => ({
        type: 'song',
        songId: s.id,
        title: s.title,
        artist: s.artist || '',
        tone: s.tone || s.key || 'C',
        order: idx + 1
      }));
    }

    let songIdx = 0;
    return existingLiturgy.map(item => {
      const type = String(item?.type || '').toLowerCase();
      const titleLower = String(item?.title || item?.songTitle || '').toLowerCase().trim();
      const isNonSong = ['reading', 'speech', 'prayer', 'announcements', 'announcement', 'offering', 'moment', 'other'].includes(type) ||
        titleLower.startsWith('leitura');

      if (!isNonSong && (type === 'song' || item.songId || songIdx < reorderedSongs.length)) {
        if (songIdx < reorderedSongs.length) {
          const s = reorderedSongs[songIdx++];
          return {
            ...item,
            ...s,
            type: 'song',
            songId: s.id,
            title: s.title,
            artist: s.artist || item.artist || '',
            tone: s.tone || s.key || item.tone || 'C'
          };
        }
      }
      return item;
    });
  };

  // Sincronizar orderedLiturgySongs com o culto e com a lista completa de músicas
  useEffect(() => {
    let rawList: any[] = [];

    // Se houver culto com liturgia estruturada
    if (currentService?.liturgy && Array.isArray(currentService.liturgy) && currentService.liturgy.length > 0) {
      // Filtrar estritamente canções da liturgia (ignora leituras bíblicas, orações, pregações e outros momentos)
      const songItems = currentService.liturgy.filter((item: any) => {
        if (!item) return false;
        const type = String(item.type || '').toLowerCase();
        // Ignora categoricamente momentos não musicais
        if (['reading', 'speech', 'prayer', 'announcements', 'announcement', 'offering', 'moment', 'other'].includes(type)) {
          return false;
        }
        const titleLower = String(item.title || item.songTitle || '').toLowerCase().trim();
        const artistLower = String(item.artist || item.songArtist || '').toLowerCase().trim();
        if (titleLower.startsWith('leitura') || artistLower.startsWith('leitura')) return false;

        // Se o tipo for explicitamente 'song' ou tiver songId
        if (type === 'song' || item.songId) return true;

        // Se não tiver tipo, aceita apenas se for uma música real do repertório
        return songs.some(s => s.id === item.id || s.title?.toLowerCase().trim() === titleLower);
      });

      rawList = songItems
        .map((item: any) => {
          const sId = item.songId || item.id;
          const found = songs.find((s) => s.id === sId || s.title?.toLowerCase().trim() === (item.title || item.songTitle || '').toLowerCase().trim());
          if (found) {
            return {
              ...found,
              ...item,
              id: found.id || sId,
              title: item.title || item.songTitle || found.title,
              artist: item.artist || item.songArtist || found.artist,
              artistImageUrl: item.artistImageUrl || found.artistImageUrl || item.customImageUrl || found.customImageUrl || item.coverImage || found.coverImage,
              customImageUrl: item.artistImageUrl || found.artistImageUrl || item.customImageUrl || found.customImageUrl || item.coverImage || found.coverImage,
              tone: item.tone || item.key || found.tone || found.key,
              category: item.category || getSongCategory(found) || 'LOUVOR'
            };
          }
          if (item.type === 'song' || item.songId) {
            return {
              id: sId || `liturgy_song_${Math.random()}`,
              title: item.title || item.songTitle,
              artist: item.artist || item.songArtist || 'Desconhecido',
              tone: item.tone || item.key || 'C',
              category: item.category || 'LOUVOR',
              lyrics: item.lyrics || '',
              chords: item.chords || ''
            };
          }
          return null;
        })
        .filter(Boolean);
    } 
    // Fallback: se houver setlist no culto
    else if (currentService?.setlist && Array.isArray(currentService.setlist) && currentService.setlist.length > 0) {
      rawList = currentService.setlist
        .map((idOrItem: any) => {
          const sId = typeof idOrItem === 'string' ? idOrItem : idOrItem.songId || idOrItem.id;
          return songs.find(s => s.id === sId);
        })
        .filter(Boolean);
    }
    // Fallback: se houver propLiturgySongs
    else if (propLiturgySongs && propLiturgySongs.length > 0) {
      rawList = [...propLiturgySongs];
    } 
    // Se não houver músicas na liturgia ou setlist deste culto, lista vazia para indicar aguardo de definição
    else {
      rawList = [];
    }

    setOrderedLiturgySongs(rawList);
  }, [currentService, propLiturgySongs, songs]);

  // Sincronizar prop inicial de add modal
  useEffect(() => {
    if (initialAdd) {
      setIsAddModalOpen(true);
    }
  }, [initialAdd]);

  // Sincronizar propShowLiturgySongs
  useEffect(() => {
    setShowOnlyLiturgy(propShowLiturgySongs);
  }, [propShowLiturgySongs]);

  // Sincronizar com propAllSongs quando disponível
  useEffect(() => {
    if (propAllSongs && propAllSongs.length > 0) {
      setSongs(propAllSongs);
      setLoading(false);
    }
  }, [propAllSongs]);

  // Carregar e monitorar coleção 'songs' do Firestore
  useEffect(() => {
    if (!db) return;
    if (propAllSongs && propAllSongs.length > 0) return;

    setLoading(true);
    try {
      const songsRef = collection(db, 'songs');
      const q = query(songsRef, orderBy('title', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loaded: any[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() });
        });

        const filtered = loaded.filter(
          (s) => !s.churchId || s.churchId === churchId || s.churchId === 'semente' || churchId === 'semente'
        );

        if (filtered.length > 0) {
          setSongs(filtered);
        } else if (loaded.length > 0) {
          setSongs(loaded);
        } else {
          setSongs(DEFAULT_LOCAL_SONGS.map((s, idx) => ({ id: `local_seed_${idx}`, ...s, tone: s.key })));
        }
        setLoading(false);
      }, (err) => {
        console.warn('[SongsView] Erro no snapshot do Firestore:', err);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('[SongsView] Erro ao carregar músicas:', e);
      setLoading(false);
    }
  }, [churchId, propAllSongs]);

  // Alternar favorito
  const toggleFavorite = (songId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      try {
        localStorage.setItem('liloupro_favorite_songs', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Reconhecimento de voz (Busca por voz)
  const toggleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não possui suporte para busca por voz. Recomendamos utilizar o Google Chrome.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Erro ao acionar busca por voz:', err);
      setIsListening(false);
    }
  };

  // Abrir Drive da Equipe
  const handleOpenTeamDrive = () => {
    const currentUrl = 
      churchData?.teamDriveUrl || 
      churchData?.driveFolderUrl || 
      localStorage.getItem('liloupro_team_drive_url');

    if (currentUrl && currentUrl.trim()) {
      window.open(currentUrl.trim(), '_blank', 'noopener,noreferrer');
    } else {
      setIsDriveModalOpen(true);
    }
  };

  // Salvar link do Google Drive
  const handleSaveDriveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDriveUrl(true);
    const cleanUrl = driveUrlInput.trim();
    try {
      localStorage.setItem('liloupro_team_drive_url', cleanUrl);
      if (db && churchId && isAdmin) {
        const churchRef = doc(db, 'churches', churchId);
        await updateDoc(churchRef, { teamDriveUrl: cleanUrl });
      }
      setIsDriveModalOpen(false);
      if (cleanUrl) {
        window.open(cleanUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Erro ao salvar URL do Drive:', err);
      setIsDriveModalOpen(false);
    } finally {
      setSavingDriveUrl(false);
    }
  };

  // Cadastrar nova música geral
  const handleAddSongSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSavingSong(true);
    try {
      const tagsArray = newCategory.trim() 
        ? [newCategory.trim()] 
        : ['Louvor'];

      if (db) {
        await addDoc(collection(db, 'songs'), {
          title: newTitle.trim(),
          artist: newArtist.trim() || 'Desconhecido',
          key: newTone.trim() || 'C',
          tone: newTone.trim() || 'C',
          bpm: newBpm ? Number(newBpm) : null,
          category: newCategory.trim() || null,
          chords: newLyrics.trim(),
          lyrics: newLyrics.trim(),
          tags: tagsArray,
          churchId: churchId || 'semente',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      setNewTitle('');
      setNewArtist('');
      setNewTone('C');
      setNewBpm('');
      setNewCategory('');
      setNewLyrics('');
      setIsAddModalOpen(false);
      if (onAddModalClose) onAddModalClose();
    } catch (err) {
      console.error('[SongsView] Erro ao cadastrar música:', err);
    } finally {
      setSavingSong(false);
    }
  };

  // Funções de reordenação litúrgica (Mover para Cima / Baixo)
  const executeMoveSongUp = async (index: number) => {
    if (index <= 0) return;
    const newList = [...orderedLiturgySongs];
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    setOrderedLiturgySongs(newList);

    // Salvar no Firestore se for culto real
    if (db && currentService?.id && !currentService.id.startsWith('default_')) {
      try {
        const serviceRef = doc(db, 'services', currentService.id);
        const updatedLiturgy = buildUpdatedLiturgy(currentService.liturgy, newList);
        const songIds = newList.map(s => s.id).filter(Boolean);
        await updateDoc(serviceRef, { 
          liturgy: updatedLiturgy,
          setlist: songIds
        });
      } catch (err) {
        console.warn('Erro ao salvar nova ordem no culto:', err);
      }
    }
  };

  const executeMoveSongDown = async (index: number) => {
    if (index >= orderedLiturgySongs.length - 1) return;
    const newList = [...orderedLiturgySongs];
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    setOrderedLiturgySongs(newList);

    // Salvar no Firestore se for culto real
    if (db && currentService?.id && !currentService.id.startsWith('default_')) {
      try {
        const serviceRef = doc(db, 'services', currentService.id);
        const updatedLiturgy = buildUpdatedLiturgy(currentService.liturgy, newList);
        const songIds = newList.map(s => s.id).filter(Boolean);
        await updateDoc(serviceRef, { 
          liturgy: updatedLiturgy,
          setlist: songIds
        });
      } catch (err) {
        console.warn('Erro ao salvar nova ordem no culto:', err);
      }
    }
  };

  const handleMoveSongUp = (index: number, songTitle: string) => {
    if (index <= 0) return;
    setReorderConfirm({ index, direction: 'up', songTitle });
  };

  const handleMoveSongDown = (index: number, songTitle: string) => {
    if (index >= orderedLiturgySongs.length - 1) return;
    setReorderConfirm({ index, direction: 'down', songTitle });
  };

  // Remover música da liturgia
  const handleRemoveSongFromLiturgy = async (index: number) => {
    const songToRemove = orderedLiturgySongs[index];
    if (!confirm(`Deseja remover "${songToRemove.title}" das músicas deste culto?`)) return;

    const newList = orderedLiturgySongs.filter((_, idx) => idx !== index);
    setOrderedLiturgySongs(newList);

    if (db && currentService?.id && !currentService.id.startsWith('default_')) {
      try {
        const serviceRef = doc(db, 'services', currentService.id);
        const updatedLiturgy = (currentService.liturgy || []).filter((item: any) => {
          const sId = item.songId || item.id;
          return sId !== songToRemove.id && item.title !== songToRemove.title;
        });
        const songIds = newList.map(s => s.id).filter(Boolean);
        await updateDoc(serviceRef, { 
          liturgy: updatedLiturgy,
          setlist: songIds
        });
      } catch (err) {
        console.warn('Erro ao remover música do culto:', err);
      }
    }
  };

  // Iniciar reprodução da Playlist do Culto
  const handleStartLiturgyPlaylist = () => {
    if (orderedLiturgySongs.length === 0) return;
    if (onStartPlaylist) {
      onStartPlaylist(orderedLiturgySongs);
    } else {
      // Abre a primeira música diretamente
      onSelectSong(orderedLiturgySongs[0]);
    }
  };

  // Salvar Playlist do YouTube vinculada
  const handleSavePlaylistUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = playlistUrlInput.trim();
    if (db && currentService?.id && !currentService.id.startsWith('default_')) {
      try {
        const serviceRef = doc(db, 'services', currentService.id);
        await updateDoc(serviceRef, { playlistUrl: clean, youtubePlaylistUrl: clean });
      } catch (err) {
        console.warn('Erro ao salvar playlist vinculada:', err);
      }
    }
    setIsPlaylistModalOpen(false);
    if (clean) {
      window.open(clean, '_blank', 'noopener,noreferrer');
    }
  };

  // Artistas únicos para o dropdown
  const uniqueArtists = useMemo(() => {
    const artistSet = new Set<string>();
    songs.forEach((s) => {
      const a = (s.artist || '').trim();
      if (a && a.toLowerCase() !== 'desconhecido') {
        artistSet.add(a);
      }
    });
    return Array.from(artistSet).sort((a, b) => a.localeCompare(b));
  }, [songs]);

  // Categorias únicas para o dropdown
  const uniqueCategories = useMemo(() => {
    const catSet = new Set<string>();
    songs.forEach((s) => {
      const c = getSongCategory(s);
      if (c) catSet.add(c);
    });
    // Adicionar categorias de referência litúrgica se vazias
    if (catSet.size === 0) {
      catSet.add('CRIAÇÃO/ADORAÇÃO');
      catSet.add('QUEDA/CONFISSÃO');
      catSet.add('REDENÇÃO/AÇÃO DE GRAÇAS');
      catSet.add('CONSUMAÇÃO/RESPOSTA');
    }
    return Array.from(catSet).sort((a, b) => a.localeCompare(b));
  }, [songs]);

  // Filtragem da lista de músicas para a visualização "Todas as Músicas"
  const filteredAllSongs = useMemo(() => {
    let list = [...songs];

    // Filtro por busca de texto (título, artista, letra)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => 
        (s.title || '').toLowerCase().includes(q) ||
        (s.artist || '').toLowerCase().includes(q) ||
        (s.lyrics || '').toLowerCase().includes(q) ||
        (s.chords || '').toLowerCase().includes(q)
      );
    }

    // Filtro por artista selecionado
    if (selectedArtist !== 'all') {
      list = list.filter((s) => (s.artist || '').toLowerCase() === selectedArtist.toLowerCase());
    }

    // Filtro por categoria selecionada
    if (selectedCategory !== 'all') {
      list = list.filter((s) => {
        const cat = getSongCategory(s);
        return cat && cat.toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    // Filtro "Minhas Favoritas"
    if (showOnlyFavorites) {
      list = list.filter((s) => favoriteIds.has(s.id));
    }

    // Ordenação alfabética por título
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    return list;
  }, [songs, searchQuery, selectedArtist, selectedCategory, showOnlyFavorites, favoriteIds]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#080d1a] text-slate-100 px-4 sm:px-8 py-6">
      {/* Título e Subtítulo Centralizados */}
      <div className="text-center max-w-2xl mx-auto mb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Repertório Musical
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
          Gerencie letras, cifras e transposição.
        </p>

        {/* Guia Rápido com Accordion / Ajuda */}
        <div className="w-full text-left mt-3">
          <ContextualHelp 
            id="repertorio-guia"
            title="REPERTÓRIO: COMO ENCONTRAR E ESTUDAR?"
            description="Aprenda a pesquisar, transpor, favoritar e gerenciar as cifras e letras do repertório do ministério de louvor."
            steps={[
              "Em 'MÚSICAS DO CULTO', você vê as músicas na ordem litúrgica exata com botões para subir e descer a ordem.",
              "Clique em 'PLAYLIST DO CULTO' para iniciar o playback contínuo com contagem e transição de acordes.",
              "Use 'CIFRAS DO CULTO' para gerar o caderno completo pronto para impressão ou Google Docs.",
              "Use os botões de seta para cima e para baixo ao lado de cada canção para ajustar o fluxo da liturgia.",
              "Alterne para 'VER TODAS AS MÚSICAS' sempre que precisar buscar no acervo geral da igreja."
            ]}
            tip="As músicas do culto seguem o ritmo da liturgia: Criação/Adoração, Queda/Confissão, Redenção e Consumação!"
            theme={theme as any}
          />
        </div>
      </div>

      {/* Linha de Botões de Ação Principais (Pills) */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-6">
        {/* Toggle: MÚSICAS DO CULTO vs VER TODAS AS MÚSICAS */}
        {showOnlyLiturgy ? (
          <button
            type="button"
            onClick={() => {
              setShowOnlyLiturgy(false);
              if (propSetShowLiturgySongs) propSetShowLiturgySongs(false);
            }}
            className="px-5 py-2 sm:py-2.5 rounded-full font-bold text-xs uppercase tracking-wide flex items-center gap-2 transition-all shadow-md bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 shadow-blue-500/25 active:scale-95 cursor-pointer"
          >
            <Zap size={14} className="fill-white" />
            <span>VER TODAS AS MÚSICAS</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowOnlyLiturgy(true);
              if (propSetShowLiturgySongs) propSetShowLiturgySongs(true);
            }}
            className="px-5 py-2 sm:py-2.5 rounded-full font-bold text-xs uppercase tracking-wide flex items-center gap-2 transition-all shadow-sm bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 active:scale-95 cursor-pointer"
          >
            <Zap size={14} className="fill-slate-900" />
            <span>MÚSICAS DO CULTO</span>
          </button>
        )}

        {/* MINHAS FAVORITAS */}
        <button
          type="button"
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className={`px-5 py-2 sm:py-2.5 rounded-full font-bold text-xs uppercase tracking-wide flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer ${
            showOnlyFavorites 
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300 shadow-md shadow-amber-400/25' 
              : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-200'
          }`}
        >
          <Star size={14} className={showOnlyFavorites ? 'fill-slate-950' : 'fill-transparent text-slate-900'} />
          <span>MINHAS FAVORITAS</span>
        </button>

        {/* DRIVE DA EQUIPE + CONFIGURAR */}
        <div className="inline-flex items-center rounded-full bg-white border border-slate-200 shadow-sm overflow-hidden text-slate-900 font-bold text-xs uppercase tracking-wide">
          <button
            type="button"
            onClick={handleOpenTeamDrive}
            className="px-4 py-2 sm:py-2.5 flex items-center gap-2 hover:bg-slate-100 transition active:scale-98 cursor-pointer"
            title="Abrir pasta de arquivos e áudios no Google Drive"
          >
            <GoogleDriveIcon size={16} />
            <span>DRIVE DA EQUIPE</span>
          </button>
          <div className="w-[1px] h-5 bg-slate-200" />
          <button
            type="button"
            onClick={() => setIsDriveModalOpen(true)}
            className="px-2.5 py-2 sm:py-2.5 hover:bg-slate-100 text-slate-600 hover:text-slate-950 transition active:scale-95 cursor-pointer"
            title="Configurar link do Google Drive"
          >
            <Settings size={14} />
          </button>
        </div>

        {/* CADASTRAR MÚSICA (quando estiver vendo todas) */}
        {!showOnlyLiturgy && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Cadastrar Música</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODO 1: MÚSICAS DO CULTO (ORDEM LITÚRGICA + PLAYLIST + AÇÕES)   */}
      {/* ============================================================== */}
      {showOnlyLiturgy ? (
        <div className="max-w-5xl mx-auto w-full space-y-4 flex-1 pb-16">
          {/* Card Azul de Cabeçalho do Culto */}
          <div className="bg-[#0b1633] border border-blue-900/60 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
            {/* Ícone de música estilizado no canto superior direito */}
            <div className="absolute top-5 right-5 sm:top-7 sm:right-7 w-12 h-12 rounded-full bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
              <Music size={22} />
            </div>

            <div className="pr-14">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-widest text-blue-400">
                  Próximo Culto
                </span>
                {orderedLiturgySongs.length === 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    <Clock size={11} />
                    <span>Aguardando definição das músicas</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <Sparkles size={11} />
                    <span>Liturgia Definida ({orderedLiturgySongs.length} músicas)</span>
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentService?.title || currentService?.name || 'Culto de Celebração'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1 flex items-center gap-2">
                <Calendar size={14} className="text-blue-400 shrink-0" />
                <span>{formatServiceDateTime(currentService?.date, currentService?.time)}</span>
              </p>
            </div>

            {/* Barra de Ações do Culto: Playlist, Cifras, Vincular Playlist, Adicionar Música */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-6">
              {/* PLAYLIST DO CULTO (Vermelho com play) */}
              <button
                type="button"
                onClick={handleStartLiturgyPlaylist}
                disabled={orderedLiturgySongs.length === 0}
                className={`px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
                  orderedLiturgySongs.length > 0
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
                }`}
                title={orderedLiturgySongs.length === 0 ? "Aguardando definição das músicas para liberar a playlist" : "Tocar playlist do culto"}
              >
                <Play size={14} className={orderedLiturgySongs.length > 0 ? "fill-white" : "fill-slate-500"} />
                <span>PLAYLIST DO CULTO ({orderedLiturgySongs.length})</span>
              </button>

              {/* CIFRAS DO CULTO (Azul com ícone de documento) */}
              <button
                type="button"
                onClick={() => setIsCadernoModalOpen(true)}
                disabled={orderedLiturgySongs.length === 0}
                className={`px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
                  orderedLiturgySongs.length > 0
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
                }`}
                title={orderedLiturgySongs.length === 0 ? "Aguardando definição das músicas para gerar o caderno de cifras" : "Gerar caderno de cifras do culto"}
              >
                <FileText size={14} />
                <span>CIFRAS DO CULTO</span>
              </button>

              {/* VINCULAR PLAYLIST (YouTube outline/dark) */}
              {orderedLiturgySongs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPlaylistUrlInput(currentService?.playlistUrl || currentService?.youtubePlaylistUrl || '');
                    setIsPlaylistModalOpen(true);
                  }}
                  className="px-3.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide bg-[#0d1a3a] hover:bg-[#122452] text-slate-200 border border-slate-700/80 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Youtube size={15} className="text-red-500" />
                  <span>+ VINCULAR PLAYLIST</span>
                </button>
              )}

              {/* ADICIONAR MÚSICA (Azul claro/vibrante) */}
              <button
                type="button"
                onClick={() => setIsAddToServiceModalOpen(true)}
                className="px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide bg-blue-500 hover:bg-blue-400 text-white flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={15} />
                <span>ADICIONAR MÚSICA</span>
              </button>
            </div>
          </div>

          {/* Lista de Músicas do Culto com Numeração Litúrgica (1ª, 2ª, 3ª...) e Botões de Subir/Descer/Excluir */}
          <div className="space-y-3 pt-2">
            {orderedLiturgySongs.length === 0 ? (
              <div className="bg-[#0e172e]/95 border border-amber-500/30 rounded-3xl p-6 sm:p-10 text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden backdrop-blur-md animate-fade-in">
                {/* Glow decorativo de fundo */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 shadow-lg shadow-amber-500/10">
                  <Clock size={36} className="animate-pulse" />
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Liturgia em Elaboração</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
                  Aguardando definição das músicas
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-lg mx-auto mb-5">
                  A liturgia e a seleção de louvores para este culto ainda estão sendo preparadas pela liderança do ministério.
                </p>

                {/* Box com a Data do Próximo Culto em Grande Destaque */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 max-w-md mx-auto mb-6 text-left shadow-inner">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                    <Calendar size={13} className="text-blue-400" />
                    <span>Data do Próximo Culto:</span>
                  </p>
                  <p className="text-sm sm:text-base font-extrabold text-white">
                    {formatServiceDateTime(currentService?.date, currentService?.time)}
                  </p>
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-start gap-2">
                    <span className="text-amber-400 text-xs leading-none">💡</span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Assim que o repertório for definido, as cifras no tom do cantor, a ordem de execução e a playlist estarão disponíveis aqui para estudo da equipe.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOnlyLiturgy(false);
                      if (propSetShowLiturgySongs) propSetShowLiturgySongs(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wide border border-slate-700 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Music size={14} />
                    <span>Ver Todas as Músicas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddToServiceModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wide shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Plus size={15} />
                    <span>Adicionar Músicas a este Culto</span>
                  </button>
                </div>
              </div>
            ) : (
              orderedLiturgySongs.map((song, index) => {
                const isFav = favoriteIds.has(song.id);
                const categoryBadge = getSongCategory(song);
                const isFirst = index === 0;
                const isLast = index === orderedLiturgySongs.length - 1;

                return (
                  <div
                    key={`${song.id}-${index}`}
                    onClick={() => onSelectSong(song)}
                    className="bg-[#121b33]/90 hover:bg-[#162244] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between transition-all duration-150 cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-4">
                      {/* Estrela de Favorito */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(song.id);
                        }}
                        className="p-1 text-slate-500 hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
                        title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        <Star
                          size={20}
                          className={
                            isFav
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-500 hover:text-slate-300 stroke-[1.5]'
                          }
                        />
                      </button>

                      {/* Thumbnail do Artista */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700/60 shadow-xs flex items-center justify-center">
                        <ArtistAvatar
                          artist={song.artist}
                          customImageUrl={song.artistImageUrl || song.customImageUrl || song.coverImage}
                          size="lg"
                        />
                      </div>

                      {/* Ordem Litúrgica (1ª, 2ª, 3ª...) + Título, Artista e Badge */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base sm:text-lg font-black text-blue-400 shrink-0">
                            {index + 1}ª
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate tracking-tight">
                            {song.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs sm:text-sm text-slate-300 italic font-medium truncate max-w-[200px] sm:max-w-xs">
                            {song.artist || 'Artista Desconhecido'}
                          </span>
                          {categoryBadge && (
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#0e162b] border border-slate-700/80 text-slate-200 px-2.5 py-0.5 rounded-md shrink-0">
                              {categoryBadge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação na Ordem Litúrgica: Subir, Descer e Excluir */}
                    <div className="shrink-0 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {/* Botão Subir Ordem */}
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveSongUp(index, song.title)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          isFirst 
                            ? 'opacity-30 border-slate-800 text-slate-600 cursor-not-allowed bg-slate-900/40' 
                            : 'border-slate-800 bg-[#0f172a] hover:bg-slate-800 text-slate-300 hover:text-white active:scale-95'
                        }`}
                        title="Mover para cima"
                      >
                        <ChevronUp size={18} />
                      </button>

                      {/* Botão Descer Ordem */}
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveSongDown(index, song.title)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          isLast 
                            ? 'opacity-30 border-slate-800 text-slate-600 cursor-not-allowed bg-slate-900/40' 
                            : 'border-slate-800 bg-[#0f172a] hover:bg-slate-800 text-slate-300 hover:text-white active:scale-95'
                        }`}
                        title="Mover para baixo"
                      >
                        <ChevronDown size={18} />
                      </button>

                      {/* Botão Excluir do Culto */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSongFromLiturgy(index)}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-red-950/60 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer ml-0.5"
                        title="Remover da liturgia deste culto"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* MODO 2: VER TODAS AS MÚSICAS (BUSCA + FILTROS + CATÁLOGO GERAL) */
        /* ============================================================== */
        <>
          {/* Barra de Busca e Filtros de Seleção */}
          <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-6">
            {/* Campo de Busca por Título ou Artista com Microfone */}
            <div className="relative flex-1 bg-[#101a35]/90 border border-slate-800/90 rounded-2xl flex items-center px-4 py-1.5 focus-within:border-blue-500/80 transition shadow-inner">
              <Search size={18} className="text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título ou artista..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none py-2"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-white transition mr-1 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={toggleVoiceSearch}
                title={isListening ? 'Ouvindo... Clique para pausar busca por voz' : 'Buscar por voz (fale o título ou artista)'}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isListening ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mic size={18} />
              </button>
            </div>

            {/* Dropdown Todos os Artistas */}
            <div className="w-full md:w-auto">
              <select
                value={selectedArtist}
                onChange={(e) => setSelectedArtist(e.target.value)}
                className="w-full md:w-56 bg-[#101a35]/90 border border-slate-800/90 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-200 font-medium cursor-pointer focus:outline-none focus:border-blue-500 transition shadow-inner"
              >
                <option value="all">Todos os Artistas</option>
                {uniqueArtists.map((artist) => (
                  <option key={artist} value={artist}>
                    {artist}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown Todas as Categorias */}
            <div className="w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full md:w-56 bg-[#101a35]/90 border border-slate-800/90 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-200 font-medium cursor-pointer focus:outline-none focus:border-blue-500 transition shadow-inner"
              >
                <option value="all">Todas as Categorias</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista Vertical de Músicas (Cards Horizontais Empilhados) */}
          <div className="max-w-5xl mx-auto w-full space-y-3 flex-1 pb-16">
            {loading ? (
              <div className="text-center py-20 text-slate-400 text-sm">
                Carregando repertório musical...
              </div>
            ) : filteredAllSongs.length === 0 ? (
              <div className="text-center py-16 bg-[#101a35]/60 border border-dashed border-slate-800 rounded-2xl p-8 max-w-md mx-auto">
                <Music size={42} className="mx-auto text-slate-600 mb-3" />
                <h3 className="text-base font-bold text-white mb-1">Nenhuma música encontrada</h3>
                <p className="text-xs text-slate-400 mb-5">
                  {searchQuery || selectedArtist !== 'all' || selectedCategory !== 'all' || showOnlyFavorites
                    ? 'Tente ajustar os filtros ou limpar os termos de busca.'
                    : 'Cadastre sua primeira música para começar o repertório.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedArtist('all');
                    setSelectedCategory('all');
                    setShowOnlyFavorites(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                >
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              filteredAllSongs.map((song) => {
                const isFav = favoriteIds.has(song.id);
                const categoryBadge = getSongCategory(song);

                return (
                  <div
                    key={song.id}
                    onClick={() => onSelectSong(song)}
                    className="bg-[#121b33]/90 hover:bg-[#162244] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between transition-all duration-150 cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-4">
                      {/* Estrela de Favorito */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(song.id);
                        }}
                        className="p-1 text-slate-500 hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
                        title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        <Star
                          size={20}
                          className={
                            isFav
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-500 hover:text-slate-300 stroke-[1.5]'
                          }
                        />
                      </button>

                      {/* Thumbnail / Foto do Artista */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700/60 shadow-xs flex items-center justify-center">
                        <ArtistAvatar
                          artist={song.artist}
                          customImageUrl={song.artistImageUrl || song.customImageUrl || song.coverImage}
                          size="lg"
                        />
                      </div>

                      {/* Título, Artista em Itálico e Categoria Litúrgica */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate tracking-tight">
                          {song.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs sm:text-sm text-slate-300 italic font-medium truncate max-w-[200px] sm:max-w-xs">
                            {song.artist || 'Artista Desconhecido'}
                          </span>
                          {categoryBadge && (
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#0e162b] border border-slate-700/80 text-slate-200 px-2.5 py-0.5 rounded-md shrink-0">
                              {categoryBadge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Seta Direita */}
                    <div className="shrink-0 flex items-center text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADICIONAR MÚSICA AO CULTO ATUAL                          */}
      {/* ============================================================== */}
      {isAddToServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#101a35] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="text-blue-500" size={20} />
                <h3 className="font-bold text-base text-white">Adicionar Música ao Culto</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddToServiceModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Selecione uma música do acervo para adicionar à liturgia de <strong>{currentService?.title || 'Culto Domingo'}</strong>:
            </p>

            <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 mt-2">
              {songs.map((song) => {
                const alreadyInLiturgy = orderedLiturgySongs.some(
                  (s) => s.id === song.id || (s.title || '').toLowerCase().trim() === (song.title || '').toLowerCase().trim()
                );

                return (
                  <div
                    key={song.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center">
                        <ArtistAvatar 
                          artist={song.artist} 
                          customImageUrl={song.artistImageUrl || song.customImageUrl || song.coverImage}
                          size="sm" 
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{song.title}</h4>
                        <p className="text-xs text-slate-400 italic">{song.artist}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={alreadyInLiturgy}
                      onClick={async () => {
                        const nextList = [...orderedLiturgySongs, song];
                        setOrderedLiturgySongs(nextList);
                        setIsAddToServiceModalOpen(false);

                        if (db && currentService?.id && !currentService.id.startsWith('default_')) {
                          try {
                            const serviceRef = doc(db, 'services', currentService.id);
                            const newLiturgyItem = {
                              id: `lit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                              type: 'song',
                              songId: song.id,
                              title: song.title,
                              artist: song.artist || '',
                              tone: song.tone || song.key || 'C',
                              order: (currentService.liturgy?.length || 0) + 1
                            };
                            const updatedLiturgy = [...(currentService.liturgy || []), newLiturgyItem];
                            const songIds = nextList.map(s => s.id).filter(Boolean);
                            await updateDoc(serviceRef, { 
                              liturgy: updatedLiturgy,
                              setlist: songIds
                            });
                          } catch (err) {
                            console.warn('Erro ao salvar adição no culto:', err);
                          }
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer ${
                        alreadyInLiturgy 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                      }`}
                    >
                      {alreadyInLiturgy ? 'Já no culto' : '+ Adicionar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: VINCULAR PLAYLIST (YOUTUBE)                              */}
      {/* ============================================================== */}
      {isPlaylistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#101a35] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Youtube size={20} className="text-red-500" />
                <h3 className="font-bold text-base text-white">Vincular Playlist de Estudo</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPlaylistModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlaylistUrl} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Link da Playlist do YouTube ou Spotify
                </label>
                <input
                  type="url"
                  value={playlistUrlInput}
                  onChange={(e) => setPlaylistUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-2">
                  Cole o link da playlist com as versões de referência que a equipe ensaiará para este culto.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaylistModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>Salvar Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CADERNO DE CIFRAS DO CULTO (GOOGLE DOCS / IMPRESSÃO)    */}
      {/* ============================================================== */}
      {isCadernoModalOpen && (
        <CadernoGoogleDocsModal
          isOpen={isCadernoModalOpen}
          onClose={() => setIsCadernoModalOpen(false)}
          service={{
            ...currentService,
            liturgy: orderedLiturgySongs
          }}
          options={{
            allSongs: songs,
            members: [],
            churchData,
            user
          }}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIGURAÇÃO DO GOOGLE DRIVE DA EQUIPE                  */}
      {/* ============================================================== */}
      {isDriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#101a35] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <GoogleDriveIcon size={20} />
                <h3 className="font-bold text-base text-white">Google Drive da Equipe</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDriveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDriveUrl} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Link da Pasta Compartilhada no Google Drive
                </label>
                <input
                  type="url"
                  value={driveUrlInput}
                  onChange={(e) => setDriveUrlInput(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-2">
                  Cole aqui o link público ou da equipe para partituras, cifras em PDF, gravações e multitracks.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDriveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDriveUrl}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>{savingDriveUrl ? 'Salvando...' : 'Salvar & Abrir'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CADASTRAR NOVA MÚSICA                                   */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#101a35] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Music className="text-blue-500" size={20} />
                <h3 className="font-bold text-base text-white">Cadastrar Nova Música</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  if (onAddModalClose) onAddModalClose();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSongSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Título da Música *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Bondade de Deus"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Artista / Ministério *
                  </label>
                  <input
                    type="text"
                    required
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    placeholder="Ex: Isaías Saad"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tom Original
                  </label>
                  <input
                    type="text"
                    value={newTone}
                    onChange={(e) => setNewTone(e.target.value)}
                    placeholder="C, G, D, Em..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    BPM
                  </label>
                  <input
                    type="number"
                    value={newBpm}
                    onChange={(e) => setNewBpm(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="72"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria Litúrgica
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Ex: Redenção/Ação de Graças"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cifra e Letra Completa
                </label>
                <textarea
                  rows={8}
                  value={newLyrics}
                  onChange={(e) => setNewLyrics(e.target.value)}
                  placeholder="Cole aqui a letra cifrada com os acordes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    if (onAddModalClose) onAddModalClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSong}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {savingSong ? 'Salvando...' : 'Salvar Música'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação: Mudar a ordem? */}
      {reorderConfirm && (
        <div 
          className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 notranslate" 
          translate="no"
          onClick={() => setReorderConfirm(null)}
        >
          <div 
            className="bg-[#0f172a] border border-slate-700/80 rounded-2xl p-5 sm:p-6 max-w-xs w-full shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <ArrowUpDown size={22} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Mudar a ordem?
              </h3>
              <p className="text-xs text-slate-400 font-medium truncate px-2">
                "{reorderConfirm.songTitle}"
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReorderConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wide cursor-pointer transition-all active:scale-95 min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const { index, direction } = reorderConfirm;
                  setReorderConfirm(null);
                  if (direction === 'up') {
                    executeMoveSongUp(index);
                  } else {
                    executeMoveSongDown(index);
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wide shadow-lg shadow-blue-600/30 cursor-pointer transition-all active:scale-95 min-h-[44px]"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SongsView;
