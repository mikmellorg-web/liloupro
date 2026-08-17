import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Tv, Monitor, Search, ChevronRight, Play, Square, Settings as SettingsIcon, 
  HelpCircle, RefreshCw, Calendar, Music, Sparkles, BookOpen, ExternalLink, Trash2,
  Plus, UploadCloud, Check, Volume2, Megaphone, Gift, History as HistoryIcon,
  Keyboard, Info, Sliders, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BibleSearch } from './BibleSearch';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, doc, setDoc, addDoc, deleteDoc, query, orderBy, onSnapshot 
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { cleanLyricsForProjection } from '../services/chordService';

// Simple Card component to preserve visual consistency with existing UI
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-surface border border-border rounded-3xl p-6 shadow-sm transition-all relative overflow-hidden ${className || ''}`}>
    {children}
  </div>
);

// Simple button component to preserve visual consistency with existing UI
const Button = ({ 
  children, onClick, className, variant = 'primary', disabled, title 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string; 
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  title?: string;
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700';
      case 'ghost':
        return 'bg-transparent hover:bg-white/10 text-text-main border-none';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'primary':
      default:
        return 'bg-brand hover:brightness-110 text-white';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all inline-flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${getVariantClasses()} ${className || ''}`}
    >
      {children}
    </button>
  );
};

const normalizeText = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD') // decompose diacritics
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]/g, '') // keep only letters and digits
    .trim();
};

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

function findBestSongMatch<T extends { title: string }>(songs: T[], rawSearch: string): T | null {
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

const BG_PRESETS = [
  {
    id: 'solid-black',
    name: 'Fundo Preto',
    desc: 'Fundo preto totalmente opaco, ideal para foco máximo na letra.',
    icon: '⬛',
    url: 'solid-black'
  },
  {
    id: 'bible',
    name: 'Bíblia Aberta (Palavra)',
    desc: 'Bíblia sagrada sob luz quente e mística, perfeita para pregações e leitura da Palavra.',
    icon: '📖',
    url: 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'empty-cross',
    name: 'Cruz Vazia',
    desc: 'Silhueta dramática de uma cruz sob o céu do crepúsculo, simbolizando a ressurreição.',
    icon: '✝️',
    url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'worship-hands-1',
    name: 'Adoradores (Mãos Ergues)',
    desc: 'Fiéis com mãos levantadas em adoração coletiva sob iluminação calorosa.',
    icon: '🙌',
    url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'worship-hands-2',
    name: 'Louvor e Entrega',
    desc: 'Ambiente de oração e adoração íntima sob luz celestial inspiradora.',
    icon: '✨',
    url: 'https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: 'worship-celebration',
    name: 'Comunidade Louvando',
    desc: 'Igreja unida louvando e celebrando a presença do Senhor de braços abertos.',
    icon: '🔥',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop'
  }
];

interface ProjectionViewProps {
  allSongs: any[];
  allServices: any[];
}

export function ProjectionView({ allSongs, allServices }: ProjectionViewProps) {
  const { memberData, churchData } = useAuth();
  const userChurchId = memberData?.churchId || 'semente';

  // Navigation & selection states
  const [selectedLiturgyId, setSelectedLiturgyId] = useState<string>('');
  const [activeSong, setActiveSong] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSection, setSearchSection] = useState<'songs' | 'bible'>('songs');
  
  // Custom temporary playlist
  const [customPlaylist, setCustomPlaylist] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('lilo-projection-playlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Local state to store manual mappings (liturgyItemId -> repertoireSongId)
  const [manualLinkMap, setManualLinkMap] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('lilo-projection-manual-links');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Local state to store temporary custom lyrics edits (songId/liturgyItemId -> lyrics string)
  const [sessionLyricsMap, setSessionLyricsMap] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('lilo-projection-session-lyrics');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Panel settings and details
  const [showLinkPanel, setShowLinkPanel] = useState<boolean>(false);
  const [showEditLyricsPanel, setShowEditLyricsPanel] = useState<boolean>(false);
  const [manualLinkSelection, setManualLinkSelection] = useState<string>('');
  const [quickLyricsText, setQuickLyricsText] = useState<string>('');
  const [freeText, setFreeText] = useState<string>('');
  const [showPracticalGuide, setShowPracticalGuide] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('lilo-projection-show-guide');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  // Auto-sync showPracticalGuide to localStorage
  useEffect(() => {
    localStorage.setItem('lilo-projection-show-guide', String(showPracticalGuide));
  }, [showPracticalGuide]);

  // Offertory image slides
  const [offertoryImages, setOffertoryImages] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem('lilo-projection-images');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [isDraggingOverZone, setIsDraggingOverZone] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-sync offertory images to localStorage
  useEffect(() => {
    localStorage.setItem('lilo-projection-images', JSON.stringify(offertoryImages));
  }, [offertoryImages]);

  // Image compressor helper (resizes to max 1280px and quality 0.75)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 1280;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Invalid image file'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsDataURL(file);
    });
  };

  const handleUploadImages = async (files: FileList) => {
    if (!activeSong) return;
    const itemId = activeSong.liturgyItemId || activeSong.id;
    if (!itemId) return;

    const imagesOnly = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imagesOnly.length === 0) return;

    const compressedList: string[] = [];
    for (const f of imagesOnly) {
      try {
        const compressed = await compressImage(f);
        compressedList.push(compressed);
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    }

    if (compressedList.length > 0) {
      setOffertoryImages(prev => {
        const current = prev[itemId] || [];
        return {
          ...prev,
          [itemId]: [...current, ...compressedList]
        };
      });
      setActiveSlideIdx(0);
      setBlackout(false);
    }
  };

  const handleDeleteImage = (imgIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeSong) return;
    const itemId = activeSong.liturgyItemId || activeSong.id;
    if (!itemId) return;

    setOffertoryImages(prev => {
      const current = prev[itemId] || [];
      const updated = current.filter((_, idx) => idx !== imgIdx);
      return {
        ...prev,
        [itemId]: updated
      };
    });

    setActiveSlideIdx(-1);
    syncCurrentState();
  };

  // Helper detect if active is an offertory / dízimo / ajuda
  const isOffertoryItem = useMemo(() => {
    if (!activeSong) return false;
    const titleLower = normalizeText(activeSong.title || '');
    const lyricsLower = normalizeText(activeSong.lyrics || '');
    return titleLower.includes('oferta') || titleLower.includes('ofert') || titleLower.includes('dizim') || titleLower.includes('contribu') ||
           lyricsLower.includes('oferta') || lyricsLower.includes('ofert') || lyricsLower.includes('dizim');
  }, [activeSong]);

  // Persist manual links in background
  useEffect(() => {
    localStorage.setItem('lilo-projection-manual-links', JSON.stringify(manualLinkMap));
  }, [manualLinkMap]);

  // Persist session lyrics edits
  useEffect(() => {
    localStorage.setItem('lilo-projection-session-lyrics', JSON.stringify(sessionLyricsMap));
  }, [sessionLyricsMap]);

  // Firestore background presets state, uploading status and handlers
  const [presets, setPresets] = useState<any[]>(BG_PRESETS);
  const [isUploadingBg, setIsUploadingBg] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'projection_presets'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const filtered = docs.filter((d: any) => d.churchId === userChurchId || (!d.churchId && userChurchId === 'semente'));

      if (filtered.length > 0) {
        setPresets(filtered);
      } else {
        // Seeding database with default BG_PRESETS
        const seedDefaults = async () => {
          try {
            const batchPromises = BG_PRESETS.map((preset, idx) => {
              const docRef = doc(collection(db, 'projection_presets'), `${userChurchId}_${preset.id}`);
              return setDoc(docRef, {
                name: preset.name,
                url: preset.url,
                desc: preset.desc || '',
                icon: preset.icon || '',
                createdAt: new Date(Date.now() + idx * 1000), // stable sorting order
                churchId: userChurchId
              });
            });
            await Promise.all(batchPromises);
          } catch (err) {
            console.error("Error seeding default presets in Firestore:", err);
            handleFirestoreError(err, OperationType.WRITE, 'projection_presets');
          }
        };
        seedDefaults();
        setPresets(BG_PRESETS);
      }
    }, (error) => {
      console.error("Error reading projection presets:", error);
      handleFirestoreError(error, OperationType.GET, 'projection_presets');
    });
    return () => unsub();
  }, [userChurchId]);

  const handleRestoreDefaultPresets = async () => {
    try {
      const batchPromises = BG_PRESETS.map((preset, idx) => {
        const docRef = doc(collection(db, 'projection_presets'), preset.id);
        return setDoc(docRef, {
          name: preset.name,
          url: preset.url,
          desc: preset.desc || '',
          icon: preset.icon || '',
          createdAt: new Date(Date.now() + idx * 1000)
        });
      });
      await Promise.all(batchPromises);
      alert("Fundos padrões restaurados com sucesso na galeria!");
    } catch (err) {
      console.error("Erro ao restaurar padrões:", err);
      alert("Não foi possível restaurar os fundos no banco de dados.");
      handleFirestoreError(err, OperationType.WRITE, 'projection_presets');
    }
  };

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, envie apenas arquivos de imagem.');
      return;
    }

    setIsUploadingBg(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = async () => {
        // Step 1: Initial scale down to 960px (Standard for crisp presentation background slides)
        const maxInitialDim = 960;
        let width = img.width;
        let height = img.height;
        if (width > maxInitialDim || height > maxInitialDim) {
          if (width > height) {
            height = Math.round((height * maxInitialDim) / width);
            width = maxInitialDim;
          } else {
            width = Math.round((width * maxInitialDim) / height);
            height = maxInitialDim;
          }
        }

        let quality = 0.75;
        let scaleFactor = 1.0;
        let compressedBase64 = '';
        
        // Step 2: Adaptive compression loop
        // Iteratively scale down or reduce quality if the resulting base64 string exceeds 750,000 characters (~550KB).
        // This ensures the custom image fits perfectly within Firestore's 1MB (1,048,576 bytes) strict document size limit.
        let iteration = 0;
        let ctxOk = false;

        while (iteration < 6) {
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * scaleFactor);
          canvas.height = Math.round(height * scaleFactor);
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctxOk = true;
            // Draw original image resized
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            
            if (compressedBase64.length <= 750000) {
              break; // Ideal size reached!
            }
          }
          
          // Gradually dial down quality and scale representing 20% smaller area each step
          scaleFactor *= 0.8;
          quality -= 0.1;
          if (quality <= 0.35) {
            quality = 0.35;
          }
          iteration++;
        }

        if (ctxOk && compressedBase64) {
          try {
            const cleanName = file.name.replace(/\.[^/.]+$/, "").substring(0, 30);
            await addDoc(collection(db, 'projection_presets'), {
              name: cleanName || 'Personalizado',
              url: compressedBase64,
              desc: 'Fundo personalizado carregado por upload',
              icon: '🎨',
              createdAt: new Date(),
              churchId: userChurchId
            });
          } catch (error) {
            console.error("Erro ao salvar fundo em Firestore:", error);
            const errMsg = error instanceof Error ? error.message : "Erro desconhecido";
            alert(`Não foi possível salvar a imagem no banco de dados. Detalhe: ${errMsg}`);
            handleFirestoreError(error, OperationType.CREATE, 'projection_presets');
          } finally {
            setIsUploadingBg(false);
          }
        } else {
          setIsUploadingBg(false);
          alert('Não foi possível inicializar o renderizador de imagem.');
        }
      };
      img.onerror = () => {
        setIsUploadingBg(false);
        alert('Erro ao processar imagem.');
      };
    };
    reader.onerror = () => {
      setIsUploadingBg(false);
      alert('Erro ao ler arquivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePreset = async (presetId: string) => {
    if (!window.confirm("Deseja realmente remover esta imagem de fundo da galeria?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'projection_presets', presetId));
    } catch (error) {
      console.error("Erro ao deletar preset de fundo:", error);
      alert("Não foi possível excluir o fundo do banco de dados.");
      handleFirestoreError(error, OperationType.DELETE, `projection_presets/${presetId}`);
    }
  };

  // Projection state settings in sync with storage
  const [theme, setTheme] = useState<'black' | 'white' | 'dark-blue' | 'burgundy' | 'charcoal' | 'aurora' | 'sunset' | 'forest' | 'custom-image' | 'custom-video'>(() => {
    return (localStorage.getItem('lilo-projection-theme') as any) || 'black';
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    return Number(localStorage.getItem('lilo-projection-font-size')) || 64;
  });
  const [customBgUrl, setCustomBgUrl] = useState<string>(() => {
    return localStorage.getItem('lilo-projection-custom-bg-url') || '';
  });
  const [bgOpacity, setBgOpacity] = useState<number>(() => {
    const val = localStorage.getItem('lilo-projection-bg-opacity');
    return val !== null ? Number(val) : 0.5;
  });
  const [bgBlur, setBgBlur] = useState<number>(() => {
    const val = localStorage.getItem('lilo-projection-bg-blur');
    return val !== null ? Number(val) : 2;
  });
  const [bgBrightness, setBgBrightness] = useState<number>(() => {
    const val = localStorage.getItem('lilo-projection-bg-brightness');
    return val !== null ? Number(val) : 40;
  });
  const [bgContrast, setBgContrast] = useState<number>(() => {
    const val = localStorage.getItem('lilo-projection-bg-contrast');
    return val !== null ? Number(val) : 100;
  });
  const [bgSaturation, setBgSaturation] = useState<number>(() => {
    const val = localStorage.getItem('lilo-projection-bg-saturation');
    return val !== null ? Number(val) : 100;
  });
  const [textAlign, setTextAlign] = useState<'center' | 'left' | 'right'>(() => {
    return (localStorage.getItem('lilo-projection-text-align') as any) || 'center';
  });
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>(() => {
    return (localStorage.getItem('lilo-projection-text-position') as any) || 'center';
  });
  const [textColor, setTextColor] = useState<string>(() => {
    return localStorage.getItem('lilo-projection-text-color') || '#ffffff';
  });
  const [textShadow, setTextShadow] = useState<boolean>(() => {
    const val = localStorage.getItem('lilo-projection-text-shadow');
    return val !== null ? val === 'true' : true;
  });
  const [textUppercase, setTextUppercase] = useState<boolean>(() => {
    return localStorage.getItem('lilo-projection-text-uppercase') === 'true';
  });
  const [fontFamily, setFontFamily] = useState<string>(() => {
    return localStorage.getItem('lilo-projection-font-family') || 'Inter';
  });
  const [transitionType, setTransitionType] = useState<'fade' | 'slide' | 'scale' | 'instant'>(() => {
    return (localStorage.getItem('lilo-projection-transition-type') as any) || 'slide';
  });

  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(-1);
  const [blackout, setBlackout] = useState<boolean>(false);
  const [clearText, setClearText] = useState<boolean>(false);
  const [showLogo, setShowLogo] = useState<boolean>(false);
  const [scrollingAlert, setScrollingAlert] = useState<string>('');
  const [popupBlocked, setPopupBlocked] = useState<boolean>(false);

  const [countdownUntil, setCountdownUntil] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('lilo-projection-countdown-until');
      return stored ? Number(stored) : null;
    } catch {
      return null;
    }
  });

  const [controllerTimeLeft, setControllerTimeLeft] = useState<string | null>(null);
  const [slideHistory, setSlideHistory] = useState<{ id: string; text: string; time: string }[]>([]);

  useEffect(() => {
    if (!countdownUntil) {
      setControllerTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = countdownUntil - now;
      if (diff <= 0) {
        setControllerTimeLeft('Finalizado ⏰');
        return false;
      }
      const totalSecs = Math.floor(diff / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      setControllerTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      return true;
    };

    const hasTimeLeft = updateTimer();
    if (!hasTimeLeft) return;

    const interval = setInterval(() => {
      const active = updateTimer();
      if (!active) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [countdownUntil]);

  useEffect(() => {
    if (countdownUntil) {
      localStorage.setItem('lilo-projection-countdown-until', countdownUntil.toString());
    } else {
      localStorage.removeItem('lilo-projection-countdown-until');
    }
    syncCurrentState();
  }, [countdownUntil]);

  // Auto-sync state values on change
  useEffect(() => {
    localStorage.setItem('lilo-projection-playlist', JSON.stringify(customPlaylist));
  }, [customPlaylist]);

  // Divided slides calculated dynamically based on the active song's lyrics or liturgy text
  const slides = useMemo(() => {
    if (!activeSong) return [];
    
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

    let textSlides: any[] = [];
    if (activeSong.lyrics) {
      // Clean up formatting HTML tags, dynamic tags (N1..N7, Crescendo, Pausa, etc.), chords, and section headers
      const rawLyrics = cleanLyricsForProjection(activeSong.lyrics);
      let chunks: string[] = [];

      // Split based on formatting
      if (rawLyrics.includes('\n\n')) {
        chunks = rawLyrics
          .split(/\r?\n\r?\n+/)
          .map((block: string) => block.trim())
          .filter((block: string) => block.length > 0);
      } else if (rawLyrics.includes('\n')) {
        // Group single lines into slides of at most 4 lines for optimal, non-fragmented layout
        const lines = rawLyrics.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
        const groupedChunks: string[] = [];
        for (let i = 0; i < lines.length; i += 4) {
          groupedChunks.push(lines.slice(i, i + 4).join('\n'));
        }
        chunks = groupedChunks;
      } else if (activeSong.isLiturgyItem && rawLyrics.length > 130) {
        // Split by verse numbers or sentences
        const verseSplit = rawLyrics.split(/(?=\b\d+[\.\s]|\b\[\d+\])/);
        if (verseSplit.length > 1) {
          chunks = verseSplit.map(s => s.trim()).filter(s => s.length > 0);
        } else {
          chunks = rawLyrics.split(/(?<=\. )/g).map(s => s.trim()).filter(s => s.length > 0);
        }
      } else {
        chunks = [rawLyrics];
      }

      // Harmoniously post-process all chunks to ensure absolutely no slide has more than 4 lines
      const processedChunks = chunks.flatMap(chunk => splitStropheHarmoniously(chunk, 4));

      // Prepend a beautiful reference/title cover slide for liturgy items
      if (activeSong.isLiturgyItem && activeSong.title && activeSong.id !== 'custom-free-text') {
        const titleLabel = activeSong.artist || 'Momento';
        const introSlide = `${titleLabel}\n${activeSong.title}`;
        textSlides = [introSlide, ...processedChunks];
      } else {
        textSlides = processedChunks;
      }
    } else {
      if (activeSong.title && activeSong.id !== 'custom-free-text') {
        const titleLabel = activeSong.artist || 'Momento';
        textSlides = [`${titleLabel}\n${activeSong.title}`];
      }
    }

    // Combine with uploaded image slides
    const itemId = activeSong.liturgyItemId || activeSong.id;
    const uploadedImages = itemId ? (offertoryImages[itemId] || []) : [];
    
    const imageSlides = uploadedImages.map((imgBase64, imgIdx) => ({
      type: 'image',
      imageUrl: imgBase64,
      title: `Slide Imagem ${imgIdx + 1}`
    }));

    return [...imageSlides, ...textSlides];
  }, [activeSong, offertoryImages]);

  // Sync state across channels & store the active state in localStorage 
  const syncCurrentState = (
    forceSlideText?: any, 
    isBlackout: boolean = blackout,
    isClearText: boolean = clearText,
    isShowLogo: boolean = showLogo,
    isScrollingAlert: string = scrollingAlert
  ) => {
    const activeSlide = forceSlideText !== undefined ? forceSlideText : slides[activeSlideIdx];
    const isImage = typeof activeSlide === 'object' && activeSlide !== null && activeSlide.type === 'image';
    const textToShow = isBlackout ? '' : (isImage ? '' : (typeof activeSlide === 'string' ? activeSlide : ''));
    
    const config = {
      text: textToShow,
      theme,
      fontSize,
      customBgUrl,
      bgOpacity,
      bgBlur,
      bgBrightness,
      bgContrast,
      bgSaturation,
      textAlign,
      textPosition,
      textColor,
      textShadow,
      slideImageUrl: isImage && !isBlackout ? activeSlide.imageUrl : null,
      countdownUntil: isBlackout ? null : countdownUntil,
      clearText: isClearText,
      showLogo: isShowLogo,
      churchLogoUrl: churchData?.logoUrl || null,
      churchName: churchData?.name || 'LiLouPro',
      scrollingAlert: isScrollingAlert || null,
      blackout: isBlackout,
      textUppercase,
      fontFamily,
      transitionType,
    };
    
    // 1. Storage update (backup)
    localStorage.setItem('lilo-projection-state', JSON.stringify(config));
    
    // 1.5 Add to slide history
    if (textToShow && textToShow.trim()) {
      setSlideHistory(prev => {
        if (prev.length > 0 && prev[0].text === textToShow) return prev;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        return [{
          id: Math.random().toString(36).substring(2, 9),
          text: textToShow,
          time: timeStr
        }, ...prev].slice(0, 15);
      });
    }
    
    // 2. Broadcast event
    try {
      const channel = new BroadcastChannel('lilo-projection-sync');
      channel.postMessage(config);
      channel.close();
    } catch (e) {
      // Safe fallback
    }
  };

  // Sync back to storage and trigger instant sync when setting values modify
  useEffect(() => {
    localStorage.setItem('lilo-projection-theme', theme);
    localStorage.setItem('lilo-projection-custom-bg-url', customBgUrl);
    localStorage.setItem('lilo-projection-bg-opacity', bgOpacity.toString());
    localStorage.setItem('lilo-projection-bg-blur', bgBlur.toString());
    localStorage.setItem('lilo-projection-bg-brightness', bgBrightness.toString());
    localStorage.setItem('lilo-projection-bg-contrast', bgContrast.toString());
    localStorage.setItem('lilo-projection-bg-saturation', bgSaturation.toString());
    localStorage.setItem('lilo-projection-text-align', textAlign);
    localStorage.setItem('lilo-projection-text-position', textPosition);
    localStorage.setItem('lilo-projection-text-color', textColor);
    localStorage.setItem('lilo-projection-text-shadow', textShadow.toString());
    localStorage.setItem('lilo-projection-text-uppercase', textUppercase.toString());
    localStorage.setItem('lilo-projection-font-family', fontFamily);
    localStorage.setItem('lilo-projection-transition-type', transitionType);
    syncCurrentState(undefined, blackout, clearText, showLogo, scrollingAlert);
  }, [theme, customBgUrl, bgOpacity, bgBlur, bgBrightness, bgContrast, bgSaturation, textAlign, textPosition, textColor, textShadow, textUppercase, fontFamily, transitionType, clearText, showLogo, scrollingAlert, blackout, countdownUntil, slides, activeSlideIdx, churchData]);

  useEffect(() => {
    localStorage.setItem('lilo-projection-font-size', fontSize.toString());
    syncCurrentState();
  }, [fontSize]);

  // Switch slides with synchronization
  const handleSelectSlide = (idx: number) => {
    setBlackout(false);
    setClearText(false);
    setShowLogo(false);
    setActiveSlideIdx(idx);
    syncCurrentState(slides[idx], false, false, false, scrollingAlert);
  };

  // Toggle projecting off/on immediately (blackout)
  const handleToggleBlackout = () => {
    const nextBlackout = !blackout;
    setBlackout(nextBlackout);
    syncCurrentState(nextBlackout ? '' : slides[activeSlideIdx], nextBlackout, clearText, showLogo, scrollingAlert);
  };

  const handleToggleClearText = () => {
    const nextClear = !clearText;
    setClearText(nextClear);
    if (nextClear) setShowLogo(false);
    syncCurrentState(undefined, blackout, nextClear, false, scrollingAlert);
  };

  const handleToggleShowLogo = () => {
    const nextLogo = !showLogo;
    setShowLogo(nextLogo);
    if (nextLogo) setClearText(false);
    syncCurrentState(undefined, blackout, false, nextLogo, scrollingAlert);
  };

  // Quick switch between next and previous slides
  const handleNextSlide = () => {
    if (slides.length === 0) return;
    const nextIdx = activeSlideIdx + 1;
    if (nextIdx < slides.length) {
      handleSelectSlide(nextIdx);
    }
  };

  const handlePrevSlide = () => {
    if (slides.length === 0) return;
    const prevIdx = activeSlideIdx - 1;
    if (prevIdx >= 0) {
      handleSelectSlide(prevIdx);
    }
  };

  const handleClearProjection = () => {
    setActiveSlideIdx(-1);
    setBlackout(true);
    setClearText(false);
    setShowLogo(false);
    syncCurrentState('', true, false, false, scrollingAlert);
  };

  // Keyboard navigation controller
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is editing inputs/textareas
      const tagName = (e.target as HTMLElement).tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleToggleBlackout();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToggleClearText();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleToggleShowLogo();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleClearProjection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides, activeSlideIdx, theme, fontSize, blackout, clearText, showLogo, scrollingAlert]);

  // Open dedicated standalone projector tab
  const handleOpenProjectorWindow = async () => {
    let left = 100;
    let top = 100;
    let width = 1024;
    let height = 768;

    // Detect if there's a second screen to position on
    try {
      if ('getScreenDetails' in window) {
        const screenDetails = await (window as any).getScreenDetails();
        const secondaryScreen = screenDetails.screens.find((s: any) => s !== screenDetails.currentScreen);
        if (secondaryScreen) {
          left = secondaryScreen.availLeft;
          top = secondaryScreen.availTop;
          width = secondaryScreen.availWidth || secondaryScreen.width;
          height = secondaryScreen.availHeight || secondaryScreen.height;
        }
      } else if (window.screen && window.screen.width) {
        // Fallback: Guess secondary monitor is to the right of standard monitors
        left = window.screen.width;
      }
    } catch (e) {
      console.log("Window positioning helper fallback used:", e);
      if (window.screen && window.screen.width) {
        left = window.screen.width;
      }
    }

    const features = `left=${left},top=${top},width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no,scrollbars=no,resizable=yes`;
    try {
      const win = window.open(`${window.location.origin}?projection=true`, '_blank', features);
      if (!win || win.closed || typeof win.closed === 'undefined') {
        setPopupBlocked(true);
      } else {
        setPopupBlocked(false);
        // Immediately send our current state to newly loaded window
        setTimeout(() => {
          syncCurrentState();
        }, 700);
      }
    } catch (e) {
      console.error(e);
      setPopupBlocked(true);
    }
  };

  // Filter songs based on search input
  const filteredSongs = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase().trim();
    return allSongs.filter(song => 
      song.title?.toLowerCase().includes(query) || 
      song.artist?.toLowerCase().includes(query) ||
      song.category?.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [allSongs, searchQuery]);

  // Active service selection lookup
  const sortedServices = useMemo(() => {
    return [...allServices].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [allServices]);

  // Auto-select latest liturgy on first paint or when list changes
  useEffect(() => {
    if (sortedServices.length > 0 && !selectedLiturgyId) {
      setSelectedLiturgyId(sortedServices[0].id);
    }
  }, [sortedServices, selectedLiturgyId]);

  const selectedService = useMemo(() => {
    return allServices.find(s => s.id === selectedLiturgyId);
  }, [allServices, selectedLiturgyId]);

  // Extract song and liturgy entities from selected liturgy service
  const serviceSongs = useMemo(() => {
    if (!selectedService || !selectedService.liturgy) return [];
    
    return selectedService.liturgy
      .map((item: any) => {
        const itemId = item.id || `liturgy-item-${item.title}`;
        
        if (item.type === 'song') {
          let match = null;

          // 1. Check if there is a manual link established for this liturgy item
          if (manualLinkMap[itemId]) {
            match = allSongs.find(s => s.id === manualLinkMap[itemId]);
          }

          // 2. Check if item has a valid songId defined in the service liturgy
          if (!match && item.songId) {
            match = allSongs.find(s => s.id === item.songId);
          }

          // 3. Try exact case-insensitive title match
          if (!match && item.title) {
            const t = item.title.toLowerCase().trim();
            match = allSongs.find(s => s.title?.toLowerCase().trim() === t);
          }

          // 4. Try robust normalized/accent-free title matching
          if (!match && item.title) {
            const normTitle = normalizeSongTitle(item.title);
            match = allSongs.find(s => normalizeSongTitle(s.title) === normTitle);
          }

          // Override for "É o teu povo" vs "Teu povo" to match user request perfectly
          if (!match && item.title) {
            const lowerT = item.title.toLowerCase().trim();
            if (lowerT.includes('teu povo') || lowerT.includes('é o teu povo')) {
              const povoSong = allSongs.find(s => {
                const st = s.title?.toLowerCase().trim() || '';
                return st === 'é o teu povo' || st === 'e o teu povo' || st.startsWith('é o teu povo') || st.startsWith('e o teu povo');
              });
              if (povoSong) {
                match = povoSong;
              }
            }
          }

          // 5. Try lazy findBestSongMatch (robust scoring)
          if (!match && item.title) {
            match = findBestSongMatch(allSongs, item.title);
          }

          if (match) {
            // Clone and override lyrics if there's a temporary session edit
            const finalId = match.id;
            const lyrics = sessionLyricsMap[finalId] || sessionLyricsMap[itemId] || match.lyrics || '';
            return {
              ...match,
              id: finalId,
              type: 'song',
              lyrics,
              isManuallyLinked: !!manualLinkMap[itemId],
              liturgyItemId: itemId
            };
          } else {
            // Fallback placeholder song
            const lyrics = sessionLyricsMap[itemId] || '';
            return {
              id: itemId,
              title: item.title,
              artist: 'Letra não vinculada',
              type: 'song',
              lyrics: lyrics || 'Sem letra vinculada. Clique em "Vincular com Repertório" acima ou "Editar Letra Rápida" para digitar ou colar os versos desta música.',
              isPlaceholder: true,
              liturgyItemId: itemId
            };
          }
        } else {
          // It is a reading/prayer/speech etc.
          // Its verses/text is stored in `item.details` or `item.content`.
          // We can split it into slides!
          let lyrics = item.details || item.content || '';
          
          // Specific correction for Marcos 10:1-12 NAA 2017 text
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

          // Robust check if the moment, title, or lyrics tells us more about the category
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

          // Determine a smart resolved title
          let resolvedTitle = item.title?.trim();
          if (!resolvedTitle || 
              resolvedTitle.toLowerCase() === 'leitura' || 
              resolvedTitle.toLowerCase() === 'leitura bíblica' || 
              resolvedTitle.toLowerCase() === 'texto bíblico' ||
              resolvedTitle.toLowerCase() === 'momento') {
            
            if (artistLabel === 'Oração') {
              resolvedTitle = 'Oração';
            } else if (artistLabel === 'Avisos') {
              resolvedTitle = 'Avisos';
            } else if (artistLabel === 'Ofertório' || artistLabel === 'Ofertas') {
              resolvedTitle = 'Ofertas';
            } else if (artistLabel === 'Ministração/Palavra') {
              resolvedTitle = 'Palavra / Pregação';
            } else if (item.moment) {
              resolvedTitle = item.moment;
            } else {
              resolvedTitle = 'Leitura';
            }
          }

          // Map types for rendering icons
          let resolvedType = item.type;
          if (artistLabel === 'Oração') {
            resolvedType = 'prayer';
          } else if (artistLabel === 'Avisos') {
            resolvedType = 'announcements';
          } else if (artistLabel === 'Ofertório' || artistLabel === 'Ofertas') {
            resolvedType = 'offering';
          }

          return {
            id: itemId,
            title: resolvedTitle,
            artist: artistLabel,
            type: resolvedType,
            bibleVersion: item.bibleVersion || 'NAA',
            lyrics: lyrics || 'Este item da liturgia não possui conteúdo de texto cadastrado.',
            isPlaceholder: false,
            isLiturgyItem: true,
            liturgyItemId: itemId
          };
        }
      });
  }, [selectedService, allSongs, manualLinkMap, sessionLyricsMap]);

  // Easy control handlers for quicklist playlist
  const handleAddToPlaylist = (song: any) => {
    if (customPlaylist.some(s => s.id === song.id)) return;
    setCustomPlaylist([...customPlaylist, song]);
    setSearchQuery('');
  };

  const handleRemoveFromPlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomPlaylist(customPlaylist.filter(s => s.id !== id));
    if (activeSong && activeSong.id === id) {
      setActiveSong(null);
      setActiveSlideIdx(-1);
    }
  };

  // Handle manual linking of a song in liturgy
  const handleApplyManualLink = () => {
    if (!activeSong) return;
    const itemId = activeSong.liturgyItemId || activeSong.id;
    if (!itemId || !manualLinkSelection) return;

    setManualLinkMap(prev => ({
      ...prev,
      [itemId]: manualLinkSelection
    }));
    
    // Auto-load the matched song values to update current preview
    const matchedSong = allSongs.find(s => s.id === manualLinkSelection);
    if (matchedSong) {
      setActiveSong({
        ...matchedSong,
        isManuallyLinked: true,
        liturgyItemId: itemId
      });
      setActiveSlideIdx(0); // auto-select slide 1 for convenience
    }
    
    setShowLinkPanel(false);
    setManualLinkSelection('');
  };

  const handleRemoveManualLink = () => {
    if (!activeSong) return;
    const itemId = activeSong.liturgyItemId || activeSong.id;
    if (!itemId) return;

    setManualLinkMap(prev => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });

    // Reset back to original unlinked placeholder
    const originalItem = selectedService?.liturgy?.find((i: any) => i.id === itemId);
    if (originalItem) {
      setActiveSong({
        id: itemId,
        title: originalItem.title,
        artist: 'Letra não vinculada',
        lyrics: sessionLyricsMap[itemId] || originalItem.content || 'Sem letra vinculada. Clique em "Vincular com Repertório" acima ou "Editar Letra Rápida" para digitar ou colar os versos desta música.',
        isPlaceholder: true,
        liturgyItemId: itemId
      });
    } else {
      setActiveSong(null);
    }
    
    setActiveSlideIdx(-1);
    setShowLinkPanel(false);
  };

  // Handle provisional lyrics editing inside projection view
  const handleSaveQuickLyrics = () => {
    if (!activeSong) return;
    const itemId = activeSong.liturgyItemId || activeSong.id;
    if (!itemId) return;

    setSessionLyricsMap(prev => ({
      ...prev,
      [itemId]: quickLyricsText
    }));

    setActiveSong((prev: any) => ({
      ...prev,
      lyrics: quickLyricsText
    }));

    setActiveSlideIdx(0); // auto-select slide 1 for convenience
    setShowEditLyricsPanel(false);
  };

  const handleProjectFreeText = () => {
    const textToUse = freeText.trim();
    if (!textToUse) return;

    const virtualSong = {
      id: 'custom-free-text',
      title: 'Texto Personalizado',
      artist: 'DIGITAÇÃO AO VIVO',
      type: 'other',
      lyrics: textToUse,
      isPlaceholder: false,
      isLiturgyItem: true,
      liturgyItemId: 'custom-free-text'
    };

    setActiveSong(virtualSong);
    setActiveSlideIdx(0);
    setBlackout(false);

    // Calculate first chunk of text to display immediately
    let firstSlide = textToUse;
    if (textToUse.includes('\n\n')) {
      firstSlide = textToUse.split(/\r?\n\r?\n+/)[0].trim();
    } else if (textToUse.includes('\n')) {
      firstSlide = textToUse.split(/\r?\n+/)[0].trim();
    }

    syncCurrentState(firstSlide, false);
  };

  const handleProjectQuickAnnouncement = (text: string) => {
    if (!text.trim()) return;
    const virtualSong = {
      id: 'custom-free-text',
      title: 'Aviso Rápido 📢',
      artist: 'PROJEÇÃO INSTANTÂNEA',
      type: 'other',
      lyrics: text,
      isPlaceholder: false,
      isLiturgyItem: true,
      liturgyItemId: 'custom-free-text'
    };
    setActiveSong(virtualSong);
    setActiveSlideIdx(0);
    setBlackout(false);
    setClearText(false);
    setShowLogo(false);
    
    let firstSlide = text.trim();
    if (firstSlide.includes('\n\n')) {
      firstSlide = firstSlide.split(/\r?\n\r?\n+/)[0].trim();
    } else if (firstSlide.includes('\n')) {
      firstSlide = firstSlide.split(/\r?\n+/)[0].trim();
    }
    syncCurrentState(firstSlide, false, false, false, scrollingAlert);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6 text-left"
    >
      {/* Upper header action layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-main tracking-tight flex items-center gap-2">
            <Tv className="text-brand shrink-0" size={28} /> Projeção Data Show
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5">
            Apresente letras fluidas no projetor, TVs ou telão da igreja com sincronização instantânea.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button 
            onClick={() => setShowPracticalGuide(!showPracticalGuide)} 
            variant="secondary"
            className={`py-2 sm:py-2.5 px-4 shrink-0 font-extrabold text-[11px] uppercase tracking-wider ${
              showPracticalGuide ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 font-black' : ''
            }`}
          >
            <HelpCircle size={14} className={showPracticalGuide ? 'text-amber-500 animate-pulse' : ''} />
            <span>Manual do Operador {showPracticalGuide ? '▲' : '▼'}</span>
          </Button>

          <Button 
            onClick={handleOpenProjectorWindow} 
            className="shadow-md shadow-brand/20 py-2 sm:py-2.5 px-4 bg-brand hover:brightness-110 shrink-0 font-extrabold text-[11px] uppercase tracking-wider"
          >
            <ExternalLink size={14} />
            <span>Abrir Janela do Projetor ↗️</span>
          </Button>

          <a 
            href={`${window.location.origin}?projection=true`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              setTimeout(() => {
                syncCurrentState();
              }, 1000);
            }}
            className="flex items-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl text-[11px] uppercase tracking-wider font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/15 transition-all outline-none cursor-pointer"
          >
            <ExternalLink size={14} />
            <span>Nova Aba (Link Seguro) ↗️</span>
          </a>
        </div>
      </div>

      {/* Popup Blocked Warning Info Banner */}
      {(popupBlocked || window.self !== window.top) && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl text-xs space-y-2.5">
          <div className="flex items-start gap-2.5">
            <span className="text-sm mt-0.5">⚠️</span>
            <div className="space-y-1">
              <p className="font-bold">Aviso sobre o Projetor (Bloqueio de Abas)</p>
              <p className="opacity-90 leading-relaxed">
                Navegadores em ambientes de visualização ou com bloqueadores ativos impedem a abertura automática de novas janelas pop-up.
              </p>
              <p className="opacity-90 leading-relaxed font-semibold">
                Para resolver: Clique no botão <span className="text-emerald-400">"Nova Aba (Link Seguro)"</span> acima para abrir diretamente o projetor sem bloqueios.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Projection screen quick configuration dashboard */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left column: Selector menu (Songs and worship liturgy) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-stretch">
          
          {/* Liturgy selection */}
          <div className="p-4 rounded-2xl border border-border/80 bg-black/5 dark:bg-white/5 space-y-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-brand tracking-widest">
              <Calendar size={14} />
              <span>Sincronizar com Culto</span>
            </div>
            
            <select
              value={selectedLiturgyId}
              onChange={e => setSelectedLiturgyId(e.target.value)}
              className="w-full bg-black/20 border border-border rounded-xl py-2 px-3 text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand cursor-pointer"
            >
              <option value="">Selecione um Culto/Agenda...</option>
              {sortedServices.map((service: any) => (
                <option key={service.id} value={service.id}>
                  {new Date(service.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {service.title}
                </option>
              ))}
            </select>

            {selectedService && serviceSongs.length > 0 && (
              <div className="pt-2.5 border-t border-border/40 space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                <span className="block text-[10px] font-black uppercase text-text-muted/80 tracking-wide">
                  Roteiro da Liturgia ({serviceSongs.length} itens):
                </span>
                <div className="flex flex-col gap-1">
                  {serviceSongs.map(song => (
                    <button
                      key={song.id}
                      onClick={() => {
                        setActiveSong(song);
                        setActiveSlideIdx(-1);
                        setQuickLyricsText(song.lyrics || '');
                        setShowLinkPanel(false);
                        setShowEditLyricsPanel(false);
                        setManualLinkSelection('');
                      }}
                      className={`text-left p-2 rounded-xl text-xs font-black truncate transition-all flex items-center justify-between border ${
                        activeSong?.id === song.id 
                          ? 'bg-brand/10 border-brand/40 text-brand' 
                          : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 dark:hover:bg-white/10 text-text-main'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {song.type === 'song' ? (
                          <Music size={11} className="shrink-0 opacity-75" />
                        ) : (song.type === 'prayer' || song.artist === 'Oração') ? (
                          <Check size={11} className="shrink-0 opacity-75 text-teal-500" />
                        ) : (song.type === 'announcements' || song.artist === 'Avisos') ? (
                          <Volume2 size={11} className="shrink-0 opacity-75 text-red-500" />
                        ) : (song.type === 'offering' || song.artist === 'Ofertas') ? (
                          <Gift size={11} className="shrink-0 opacity-75 text-emerald-500" />
                        ) : (song.type === 'reading' || song.artist === 'Leitura Bíblica') ? (
                          <BookOpen size={11} className="shrink-0 opacity-75 text-emerald-500" />
                        ) : (
                          <Sparkles size={11} className="shrink-0 opacity-75 text-amber-500" />
                        )}
                        <span className="truncate">{song.title}</span>
                        {song.bibleVersion && (
                          <span className="text-[7.5px] font-black px-1.5 py-0.5 bg-brand/10 border border-brand/20 text-brand rounded leading-none shrink-0">
                            {song.bibleVersion}
                          </span>
                        )}
                      </div>
                      <ChevronRight size={11} className="shrink-0 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {selectedService && serviceSongs.length === 0 && (
              <p className="text-[10px] text-zinc-400 italic font-medium leading-normal">
                Esse culto não possui nenhum item cadastrado em sua liturgia de forma direta. Use a busca abaixo para carregar músicas.
              </p>
            )}
          </div>

          {/* Quick Playlist & General Search with Tabbed Section */}
          <div className="p-4 rounded-2xl border border-border/80 bg-black/5 dark:bg-white/5 space-y-3 flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-brand tracking-widest">
                <Tv size={14} />
                <span>Busca & Roteiro Rápido</span>
              </div>
              <span className="text-[9px] font-black px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded-full text-text-muted">
                {customPlaylist.length} total
              </span>
            </div>

            {/* Selection Tabs */}
            <div className="flex gap-1.5 p-1 bg-black/20 dark:bg-white/5 rounded-xl shrink-0 border border-border/40">
              <button
                type="button"
                onClick={() => setSearchSection('songs')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                  searchSection === 'songs'
                    ? 'bg-brand text-white shadow-md'
                    : 'text-text-muted hover:text-text-main hover:bg-white/5'
                }`}
              >
                <Music size={12} />
                <span>Músicas</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchSection('bible')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                  searchSection === 'bible'
                    ? 'bg-brand text-white shadow-md'
                    : 'text-text-muted hover:text-text-main hover:bg-white/5'
                }`}
              >
                <BookOpen size={12} />
                <span>Bíblia</span>
              </button>
            </div>

            {searchSection === 'songs' ? (
              <>
                {/* Quick search input */}
                <div className="relative shrink-0">
                  <Search className="absolute left-3 top-3 text-text-muted h-4 w-4 opacity-70" />
                  <input
                    type="text"
                    placeholder="Pesquisar música no repertório..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-black/20 border border-border/80 pl-9 pr-4 py-2.5 text-sm rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand font-medium placeholder:text-text-muted/50 transition-all font-sans"
                  />
                  
                  {/* Dropdown results */}
                  <AnimatePresence>
                    {searchQuery.trim().length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute z-30 inset-x-0 top-full mt-1.5 bg-surface border border-border rounded-xl shadow-2xl p-1.5 space-y-0.5 max-h-[220px] overflow-y-auto custom-scrollbar"
                      >
                        <div className="p-1.5 text-[10px] font-black uppercase text-text-muted tracking-wide border-b border-border/40 mb-1">
                          Resultados Encontrados ({filteredSongs.length})
                        </div>
                        {filteredSongs.map((song: any) => (
                          <button
                            key={song.id}
                            onClick={() => {
                              handleAddToPlaylist(song);
                              setSearchQuery('');
                            }}
                            className="w-full text-left p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl flex flex-col transition-all border border-transparent hover:border-border/40"
                          >
                            <span className="text-sm font-bold text-text-main line-clamp-1 leading-snug">{song.title}</span>
                            {song.artist && <span className="text-xs font-black uppercase text-text-muted tracking-tight leading-none text-zinc-400 mt-1">{song.artist}</span>}
                          </button>
                        ))}
                        {filteredSongs.length === 0 && (
                          <div className="p-4 text-center text-xs text-text-muted italic">
                            Nenhuma música encontrada...
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Custom playlist list */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 min-h-[150px]">
                  {customPlaylist.map((song, idx) => (
                    <div
                      key={song.id}
                      onClick={() => {
                        setActiveSong(song);
                        setActiveSlideIdx(-1);
                        setQuickLyricsText(song.lyrics || '');
                        setShowLinkPanel(false);
                        setShowEditLyricsPanel(false);
                        setManualLinkSelection('');
                      }}
                      className={`relative p-3.5 rounded-xl border text-sm font-bold transition-all flex items-center justify-between cursor-pointer select-none group ${
                        activeSong?.id === song.id
                          ? 'bg-brand/10 border-brand/50 text-brand'
                          : 'bg-card border-border hover:bg-black/10 text-text-main'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-8">
                        {song.type === 'song' ? (
                          <Music size={14} className="shrink-0 text-zinc-400" />
                        ) : (song.type === 'prayer' || song.artist === 'Oração') ? (
                          <Check size={14} className="shrink-0 text-teal-500" />
                        ) : (song.type === 'announcements' || song.artist === 'Avisos') ? (
                          <Volume2 size={14} className="shrink-0 text-red-500" />
                        ) : (song.type === 'offering' || song.artist === 'Ofertas') ? (
                          <Gift size={14} className="shrink-0 text-emerald-500" />
                        ) : (song.type === 'reading' || song.artist === 'Leitura Bíblica') ? (
                          <BookOpen size={14} className="shrink-0 text-emerald-500" />
                        ) : (
                          <Sparkles size={14} className="shrink-0 text-amber-500" />
                        )}
                        <div className="flex flex-col gap-0.5 truncate">
                          <span className="font-extrabold truncate text-sm">{song.title}</span>
                          <span className="text-xs uppercase font-black text-text-muted truncate">
                            {idx + 1}. {song.artist || 'Sem autor'}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => handleRemoveFromPlaylist(song.id, e)}
                        className="absolute right-2 top-2.5 p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-500/15 duration-200"
                        title="Remover desta lista"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {customPlaylist.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center text-text-muted space-y-2 opacity-50 select-none my-auto">
                      <BookOpen size={28} className="text-text-muted" />
                      <p className="text-xs font-bold leading-normal">Seu roteiro rápido de projeção está vazio.</p>
                      <p className="text-[10px] italic leading-snug">Pesquise músicas ou versículos para adicioná-los aqui e facilitar o seu fluxo!</p>
                    </div>
                  )}
                </div>
                
                {customPlaylist.length > 0 && (
                  <button
                    onClick={() => {
                      setCustomPlaylist([]);
                      setActiveSong(null);
                      setActiveSlideIdx(-1);
                    }}
                    className="w-full text-center py-1.5 rounded-xl border border-border text-[9px] font-black uppercase text-text-muted hover:bg-black/5 dark:hover:bg-white/5 transition-all mt-2"
                  >
                    Limpar Lista Rápida 🗑️
                  </button>
                )}
              </>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar select-none">
                <BibleSearch 
                  onInsert={(data) => {
                    const bibleItem = {
                      id: `bible-temp-${Date.now()}`,
                      title: data.title || 'Texto Bíblico',
                      artist: `Bíblia (${data.version || 'NAA'})`,
                      type: 'reading',
                      bibleVersion: data.version || 'NAA',
                      lyrics: data.text,
                      isLiturgyItem: true,
                      liturgyItemId: `bible-temp-${Date.now()}`
                    };
                    setCustomPlaylist(prev => [...prev, bibleItem]);
                    setActiveSong(bibleItem);
                    setActiveSlideIdx(-1);
                    setQuickLyricsText(data.text);
                    setSearchSection('songs');
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Middle/Right column: Interactive Slides & Active Live Console */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          
          {/* Main Monitor Display Console */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-black/5 dark:bg-white/5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-xs font-black uppercase tracking-widest text-text-main">
                  Painel de Controle em Tempo Real 🎮
                </h2>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleToggleBlackout}
                  className={`px-3 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all border flex items-center gap-1.5 ${
                    blackout 
                      ? 'bg-red-500/25 border-red-500/50 text-red-600 dark:text-red-400 font-extrabold animate-pulse' 
                      : 'bg-black/5 dark:bg-white/5 border-border text-zinc-400 hover:bg-black/10 transition-colors'
                  }`}
                  title="Ocultar tudo: letra e fundo (Atalho: Esc ou B)"
                >
                  <Square size={12} className={blackout ? 'fill-red-500' : ''} />
                  <span>{blackout ? 'TELA ENCOBERTA [ESC]' : 'TELA ATIVA'}</span>
                </button>

                {/* SUGGESTION 3: Limpar Texto */}
                <button
                  onClick={handleToggleClearText}
                  className={`px-3 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all border flex items-center gap-1.5 ${
                    clearText && !blackout
                      ? 'bg-amber-500/25 border-amber-500/50 text-amber-600 dark:text-amber-400 font-extrabold' 
                      : 'bg-black/5 dark:bg-white/5 border-border text-zinc-400 hover:bg-black/10 transition-colors'
                  }`}
                  title="Ocultar apenas a letra da música, mantendo o fundo visual ativo (Atalho: T)"
                >
                  <Sparkles size={12} className={clearText && !blackout ? 'text-amber-500 animate-pulse' : ''} />
                  <span>{clearText && !blackout ? 'LETRA OCULTA [T]' : 'LIMPAR TEXTO'}</span>
                </button>

                {/* SUGGESTION 3: Projetar Logo */}
                <button
                  onClick={handleToggleShowLogo}
                  className={`px-3 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all border flex items-center gap-1.5 ${
                    showLogo && !blackout
                      ? 'bg-indigo-500/25 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 font-extrabold' 
                      : 'bg-black/5 dark:bg-white/5 border-border text-zinc-400 hover:bg-black/10 transition-colors'
                  }`}
                  title="Exibir o logotipo oficial da igreja (Atalho: L)"
                >
                  <Tv size={12} className={showLogo && !blackout ? 'text-indigo-500 animate-bounce' : ''} />
                  <span>{showLogo && !blackout ? 'LOGO PROJETADO [L]' : 'PROJETAR LOGO'}</span>
                </button>

                <Button 
                  onClick={handleClearProjection} 
                  variant="secondary"
                  className="px-2.5 py-1.5 text-[9px]"
                  title="Limpar texto do projetor (Atalho: C)"
                >
                  Limpar Tudo [C]
                </Button>
              </div>
            </div>

            {/* Quick Announcements shortcuts */}
            <div className="p-3.5 rounded-xl bg-black/15 dark:bg-zinc-900/40 border border-border/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2 select-none">
                <span className="text-[10px] font-black uppercase text-brand tracking-widest flex items-center gap-1.5">
                  <Megaphone size={12} className="text-brand animate-pulse" />
                  Atalhos de Avisos Rápidos 📢
                </span>
                <span className="text-[8px] text-text-muted font-black uppercase tracking-wider">
                  Projetar Instantaneamente
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Culto inicia em breve ⏳', text: 'O culto começará em breve.\nPrepare o seu coração!' },
                  { label: 'Boas-vindas! 🎉', text: 'Seja muito bem-vindo!\nFicamos felizes com sua presença.' },
                  { label: 'Celular Silencioso 📱', text: 'Por favor, coloque seu celular\nno modo silencioso.' },
                  { label: 'Dízimos e Ofertas 💸', text: 'Momento de Dízimos e Ofertas.\nDeus ama ao que dá com alegria!' },
                  { label: 'Ministério Infantil 🧒', text: 'Crianças liberadas para\no Ministério Infantil.' }
                ].map((announcement, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleProjectQuickAnnouncement(announcement.text)}
                    className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                      activeSong?.id === 'custom-free-text' && activeSong?.lyrics === announcement.text && !blackout
                        ? 'bg-emerald-500/25 border-emerald-500 text-emerald-400 font-extrabold shadow-md shadow-emerald-500/15'
                        : 'bg-black/10 hover:bg-black/20 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-300 border-border/60 hover:text-white'
                    }`}
                  >
                    {announcement.label}
                  </button>
                ))}
              </div>

              {/* Custom Quick Notice Input directly in the bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite outro aviso personalizado e aperte Enter para projetar na hora..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleProjectQuickAnnouncement((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="flex-1 bg-black/20 border border-border/85 px-3 py-1.5 text-xs rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand font-medium placeholder:text-text-muted/40 transition-all"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handleProjectQuickAnnouncement(input.value);
                      input.value = '';
                    }
                  }}
                  className="bg-brand hover:brightness-110 text-white font-black uppercase text-[9px] px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  Projetar 🚀
                </button>
              </div>

              {/* Cronômetro Regressivo Integrado */}
              <div className="pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 select-none">
                  <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1">
                    ⏱️ Cronômetro no Telão:
                  </span>
                  {controllerTimeLeft ? (
                    <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-lg animate-pulse">
                      {controllerTimeLeft}
                    </span>
                  ) : (
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                      Inativo
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {[1, 3, 5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        const targetEpoch = Date.now() + mins * 60 * 1000;
                        setCountdownUntil(targetEpoch);
                      }}
                      className="text-[9px] font-black bg-white/5 hover:bg-white/10 text-white border border-white/10 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                      title={`Adicionar cronômetro de ${mins} minutos`}
                    >
                      +{mins}m
                    </button>
                  ))}
                  {countdownUntil && (
                    <button
                      type="button"
                      onClick={() => {
                        setCountdownUntil(null);
                      }}
                      className="text-[9px] font-black bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                      title="Zerar / Ocultar cronômetro"
                    >
                      Zerar ❌
                    </button>
                  )}
                </div>
              </div>

              {/* Letreiro Digital de Alertas Rolante (Suggestion 5) */}
              <div className="pt-2.5 border-t border-white/5 flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">
                      📢 Letreiro de Alertas (Marquee):
                    </span>
                  </div>
                  {scrollingAlert ? (
                    <span className="text-[9px] font-mono font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
                      Ativo: "{scrollingAlert.length > 25 ? scrollingAlert.substring(0, 25) + '...' : scrollingAlert}"
                    </span>
                  ) : (
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                      Nenhum Alerta Ativo
                    </span>
                  )}
                </div>

                {/* Preset quick actions */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const num = window.prompt("Digite o número da criança no Berçário:");
                      if (num) {
                        const alertText = `CHAMANDO PAIS DA CRIANÇA Nº ${num.trim()} NO BERÇÁRIO`;
                        setScrollingAlert(alertText);
                        syncCurrentState(undefined, blackout, clearText, showLogo, alertText);
                      }
                    }}
                    className="text-[9px] font-black bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
                    title="Alerta de Berçário"
                  >
                    👶 Chamar Berçário
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const placa = window.prompt("Digite a placa do veículo:");
                      if (placa) {
                        const alertText = `ATENÇÃO: VEÍCULO PLACA ${placa.trim().toUpperCase()} OBSTRUINDO A SAÍDA, FAVOR RETIRAR`;
                        setScrollingAlert(alertText);
                        syncCurrentState(undefined, blackout, clearText, showLogo, alertText);
                      }
                    }}
                    className="text-[9px] font-black bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
                    title="Alerta de Veículo"
                  >
                    🚗 Placa do Carro
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const alertText = `REUNIÃO DE OBREIROS APÓS O CULTO DE HOJE`;
                      setScrollingAlert(alertText);
                      syncCurrentState(undefined, blackout, clearText, showLogo, alertText);
                    }}
                    className="text-[9px] font-black bg-white/5 hover:bg-white/10 text-white border border-white/10 px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
                    title="Aviso de Reunião"
                  >
                    💼 Reunião de Obreiros
                  </button>

                  {scrollingAlert && (
                    <button
                      type="button"
                      onClick={() => {
                        setScrollingAlert('');
                        syncCurrentState(undefined, blackout, clearText, showLogo, '');
                      }}
                      className="text-[9px] font-black bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400 border border-zinc-500/20 px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
                    >
                      Remover Alerta ❌
                    </button>
                  )}
                </div>

                {/* Custom alert input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="custom-scrolling-alert-input"
                    placeholder="Digite um aviso personalizado para rolar no telão e pressione Enviar..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const text = (e.target as HTMLInputElement).value.trim();
                        if (text) {
                          setScrollingAlert(text);
                          syncCurrentState(undefined, blackout, clearText, showLogo, text);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                    className="flex-1 bg-black/20 border border-border/85 px-3 py-1.5 text-[11px] rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand font-medium placeholder:text-text-muted/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = document.getElementById('custom-scrolling-alert-input') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        const text = input.value.trim();
                        setScrollingAlert(text);
                        syncCurrentState(undefined, blackout, clearText, showLogo, text);
                        input.value = '';
                      }
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[9px] px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    Exibir Alerta 📢
                  </button>
                </div>
              </div>
            </div>

            {/* Quick slide instructions info panel */}
            {activeSong ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 bg-black/15 dark:bg-zinc-900/50 p-3 rounded-xl border border-border/40">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      {activeSong.title}
                      {activeSong.isManuallyLinked && (
                        <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">vinculado</span>
                      )}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-0.5">
                      {activeSong.artist || 'Letra não vinculada'}
                    </p>
                  </div>
                  <span className="text-[9px] font-mono font-black uppercase tracking-wider rounded-lg px-2 py-1 bg-brand/10 border border-brand/20 text-brand">
                    {slides.length} slides
                  </span>
                </div>

                {/* Manual Link & Quick Text Input Controls */}
                <div className="p-3.5 rounded-xl bg-black/10 dark:bg-zinc-950/20 border border-border/60 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                      Letra e Associação de Vínculo 🎛️
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setManualLinkSelection('');
                          setShowLinkPanel(!showLinkPanel);
                          setShowEditLyricsPanel(false);
                        }}
                        className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border transition-colors ${
                          showLinkPanel 
                            ? 'bg-brand text-white border-brand' 
                            : 'bg-black/15 hover:bg-black/25 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-200 border-border/40'
                        }`}
                      >
                        {showLinkPanel ? 'Ocultar Associação' : 'Vincular com Repertório 🔗'}
                      </button>
                      <button
                        onClick={() => {
                          setQuickLyricsText(activeSong.lyrics || '');
                          setShowEditLyricsPanel(!showEditLyricsPanel);
                          setShowLinkPanel(false);
                        }}
                        className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border transition-colors ${
                          showEditLyricsPanel 
                            ? 'bg-brand text-white border-brand' 
                            : 'bg-black/15 hover:bg-black/25 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-200 border-border/40'
                        }`}
                      >
                        {showEditLyricsPanel ? 'Concluir Edição' : 'Editar Letra Rápida 📝'}
                      </button>
                    </div>
                  </div>

                  {/* Manual linking interface */}
                  {showLinkPanel && (
                    <div className="space-y-2 p-3 bg-black/25 border border-border/40 rounded-lg text-left shadow-inner">
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-400 font-bold leading-normal">
                        Associe esta música da liturgia a alguma música cadastrada no seu repertório geral para herdar a letra automaticamente:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={manualLinkSelection}
                          onChange={e => setManualLinkSelection(e.target.value)}
                          className="flex-1 bg-black/20 border border-border rounded-lg py-1.5 px-2.5 text-xs font-bold text-text-main outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand cursor-pointer"
                        >
                          <option value="">Selecione uma música do Repertório...</option>
                          {[...allSongs].sort((a,b) => a.title.localeCompare(b.title)).map(s => (
                            <option key={s.id} value={s.id}>{s.title} {s.artist ? `(${s.artist})` : ''}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleApplyManualLink}
                          disabled={!manualLinkSelection}
                          className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-brand hover:brightness-110 text-white rounded-lg active:scale-95 transition-all text-center disabled:opacity-50"
                        >
                          Vincular
                        </button>
                        {activeSong.isManuallyLinked && (
                          <button
                            onClick={handleRemoveManualLink}
                            className="px-2.5 py-1.5 text-xs font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg active:scale-95 transition-all"
                            title="Desfazer associação manual"
                          >
                            Remover Vínculo
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick lyrics editing interface */}
                  {showEditLyricsPanel && (
                    <div className="p-3 bg-black/25 border border-border/40 rounded-lg space-y-2 text-left shadow-inner">
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-400 font-bold leading-normal">
                        Atualize a letra desta música abaixo. Pule uma linha vazia entre cada estrofe para criar slides separados:
                      </p>
                      <textarea
                        value={quickLyricsText}
                        onChange={e => setQuickLyricsText(e.target.value)}
                        rows={6}
                        placeholder="Cole a letra ou versos da música aqui..."
                        className="w-full bg-black/20 border border-border p-2.5 text-xs rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand font-medium transition-all"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowEditLyricsPanel(false)}
                          className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:bg-black/5"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveQuickLyrics}
                          className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-brand hover:brightness-110 text-white rounded-lg active:scale-95 transition-all"
                        >
                          Salvar Letra Provisória
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Drag and Drop Zone for JPEG Upload */}
                {activeSong && (
                  <div className="space-y-2 mb-4">
                    <div 
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOverZone(true);
                      }}
                      onDragLeave={() => setIsDraggingOverZone(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingOverZone(false);
                        if (e.dataTransfer.files) {
                          handleUploadImages(e.dataTransfer.files);
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center relative group select-none ${
                        isDraggingOverZone 
                          ? 'border-brand bg-brand/10 text-brand' 
                          : isOffertoryItem
                          ? 'border-brand/40 bg-brand/5 dark:bg-brand/10 hover:border-brand hover:bg-brand/10'
                          : 'border-border bg-black/5 dark:bg-white/5 hover:border-border-hover hover:bg-black/10'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={(e) => {
                          if (e.target.files) {
                            handleUploadImages(e.target.files);
                          }
                        }}
                        accept="image/jpeg,image/jpg" 
                        multiple 
                        className="hidden" 
                      />
                      
                      <div className="flex items-center gap-2">
                        <Monitor size={16} className={isOffertoryItem ? "text-brand" : "text-text-muted"} />
                        <span className="text-xs font-black uppercase tracking-widest text-text-main">
                          {isOffertoryItem ? 'Slides do Ofertório / Dízimo (JPEG)' : 'Subir Imagem para Slide (JPEG)'}
                        </span>
                      </div>
                      
                      <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-wider">
                        Arraste um slide JPEG aqui ou clique para abrir a pasta
                      </p>
                    </div>
                  </div>
                )}

                {/* Slides Grid Selector */}
                {slides.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                    {slides.map((slide, idx) => {
                      const isImage = typeof slide === 'object' && slide !== null && slide.type === 'image';
                      const slideText = isImage ? '' : slide;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectSlide(idx)}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between min-h-[135px] h-auto overflow-hidden ${
                            activeSlideIdx === idx && !blackout
                              ? 'bg-brand border-brand text-white shadow-lg shadow-brand/15 ring-2 ring-brand/35'
                              : activeSlideIdx === idx && blackout
                              ? 'bg-brand/35 border-brand/50 text-slate-200 border-dashed line-through'
                              : 'bg-card border-border hover:bg-black/10 dark:hover:bg-white/10 text-text-main'
                          }`}
                        >
                          {isImage ? (
                            <>
                              {/* Background thumbnail for the image slide */}
                              <img 
                                src={slide.imageUrl} 
                                alt={slide.title} 
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 w-full h-full object-cover opacity-25 dark:opacity-15 group-hover:scale-105 transition-all pointer-events-none" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                              
                              {/* Slide control headers */}
                              <div className="flex items-center justify-between gap-1 z-10 w-full pb-1">
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand/40 text-white border border-brand/20 font-mono font-black uppercase">
                                  SLIDE IMAGEM
                                </span>
                                
                                <div className="flex items-center gap-1.5 no-export z-20">
                                  {activeSlideIdx === idx && !blackout && (
                                    <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500 px-1 py-0.5 rounded leading-none text-white">NO TELÃO</span>
                                  )}

                                  <button
                                    onClick={(e) => handleDeleteImage(idx, e)}
                                    className="text-white hover:text-red-400 p-1 bg-black/40 hover:bg-black/75 rounded transition-all opacity-0 group-hover:opacity-100"
                                    title="Excluir slide de imagem"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>

                              <p className="text-[10px] uppercase font-black tracking-wider text-white z-10 truncate w-full mt-auto">
                                {slide.title}
                              </p>
                            </>
                          ) : (
                            <>
                              {/* Numerical indicator label */}
                              <div className="flex items-center justify-between gap-1 mb-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-black ${
                                  activeSlideIdx === idx && !blackout ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/15 text-text-muted font-bold'
                                }`}>
                                  SLIDE {idx + 1}
                                </span>
                                
                                {activeSlideIdx === idx && !blackout && (
                                  <span className="text-[8px] font-black uppercase tracking-widest bg-white/20 px-1.5 py-0.5 rounded leading-none">NO TELÃO</span>
                                )}
                              </div>

                              {/* Slide content lines preview */}
                              <p className="text-sm sm:text-base font-bold line-clamp-6 leading-relaxed flex-1 select-none whitespace-pre-line overflow-hidden break-words text-left">
                                {slideText}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-black/10 dark:bg-white/5 rounded-xl border border-dashed border-border flex flex-col items-center justify-center space-y-2">
                    <Tv size={22} className="text-text-muted" />
                    <p className="text-xs font-bold text-text-muted">Nenhuma letra cadastrada para esta música.</p>
                    <p className="text-[10px] max-w-sm text-center text-zinc-400">Entre na edição de músicas no menu Repertório e preencha a Letra com estrofes para que possamos recortar automaticamente em slides apropriados.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center bg-black/10 dark:bg-white/5 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center space-y-3">
                <Tv size={36} className="text-text-muted" />
                <p className="text-sm font-black text-text-muted uppercase tracking-wider">Apresentador Livre de Projeção</p>
                <p className="text-xs max-w-md text-zinc-400 leading-relaxed font-bold">
                  Selecione uma música no menu esquerdo (roteiro rápido ou setlist do culto) para visualizar suas estrofes e comandar o datashow.
                </p>
              </div>
            )}
          </div>

          {/* Quick Realtime Simulator Preview & Settings Panel */}
          <div className="space-y-4">
            
            {/* Top row: Live Simulator and Live Chat/Text Box side by side */}
            <div className="grid md:grid-cols-2 gap-4">
              
              {/* Live Simulador (Aesthetic feedback for the operator) */}
              <div className="p-4 rounded-2xl border border-border/80 bg-zinc-950 text-white flex flex-col h-[230px] justify-between relative overflow-hidden group projector-preview">
                {/* Style override for mini-marquee inside preview */}
                <style>{`
                  @keyframes marquee-scroll-mini {
                    0% { transform: translate3d(0, 0, 0); }
                    100% { transform: translate3d(-50%, 0, 0); }
                  }
                  .animate-marquee-scroll-mini {
                    display: inline-block;
                    white-space: nowrap;
                    animation: marquee-scroll-mini 10s linear infinite;
                  }
                `}</style>

                {/* Floating tech background badge */}
                <div className="absolute top-3 right-3 text-[8px] font-mono font-black text-white/35 bg-white/10 px-1.5 py-0.5 rounded tracking-widest select-none z-10">
                  PREVIEW AO VIVO
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-black text-white/75 uppercase tracking-widest mb-2 shrink-0 select-none z-10">
                  <Monitor size={12} className="text-emerald-400" />
                  <span>Simulador do Projetor</span>
                </div>

                {/* Centered lyric preview in simulator box */}
                <div className="flex-1 flex items-center justify-center text-center p-3 overflow-hidden select-none z-10">
                  <AnimatePresence mode="wait">
                    {blackout ? (
                      <motion.div
                        key="blackout-preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        className="text-[9px] font-black uppercase text-red-500 tracking-widest flex flex-col items-center gap-1"
                      >
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping mb-1" />
                        <span>● TELA ENCOBERTA (BLACKOUT)</span>
                        <span className="text-[7px] text-zinc-500 font-mono normal-case">Nenhum conteúdo está sendo emitido para o projetor</span>
                      </motion.div>
                    ) : showLogo ? (
                      <motion.div
                        key="logo-preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center justify-center p-1"
                      >
                        {churchData?.logoUrl ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 p-1 mb-1 flex items-center justify-center shadow-lg">
                            <img 
                              src={churchData.logoUrl} 
                              alt="Logo da Igreja" 
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mb-1 bg-white/5">
                            <span className="text-[8px] font-serif font-black text-white tracking-widest">LLP</span>
                          </div>
                        )}
                        <span className="text-[10px] font-black text-center text-white/90 truncate max-w-[180px]">
                          {churchData?.name || 'LiLouPro'}
                        </span>
                        <span className="text-[7px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">
                          Logotipo Projetado
                        </span>
                        {controllerTimeLeft && (
                          <div className="font-mono font-black text-emerald-400 text-xs tracking-wider mt-1.5 bg-black/60 px-1.5 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                            {controllerTimeLeft}
                          </div>
                        )}
                      </motion.div>
                    ) : clearText ? (
                      <motion.div
                        key="clear-text-preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center gap-2"
                      >
                        {controllerTimeLeft && (
                          <div className="font-mono font-black text-emerald-400 text-xl tracking-widest animate-pulse">
                            {controllerTimeLeft}
                          </div>
                        )}
                        <span className="text-[8px] text-zinc-400 bg-zinc-800/40 border border-zinc-700/30 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                          Letra Ocultada (Fundo Ativo)
                        </span>
                      </motion.div>
                    ) : activeSlideIdx >= 0 && slides[activeSlideIdx] ? (() => {
                      const activeSlide = slides[activeSlideIdx];
                      const isImage = typeof activeSlide === 'object' && activeSlide !== null && activeSlide.type === 'image';
                      
                      if (isImage) {
                        return (
                          <motion.div
                            key={`preview-${activeSlideIdx}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-2"
                          >
                            <img 
                              src={activeSlide.imageUrl} 
                              alt="Preview Slide"
                              referrerPolicy="no-referrer"
                              className="max-w-[80%] max-h-[70%] object-contain rounded-lg border border-border"
                            />
                            {controllerTimeLeft && (
                              <div className="font-mono font-black text-emerald-400 text-[10px] tracking-wider mt-1 bg-black/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                {controllerTimeLeft}
                              </div>
                            )}
                          </motion.div>
                        );
                      }
                      
                      return (
                        <motion.div
                          key={activeSlideIdx + '-' + (controllerTimeLeft ? 'with-timer' : 'no-timer')}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col items-center justify-center text-center max-w-full"
                        >
                          <p
                            className="font-bold tracking-wide line-clamp-4 whitespace-pre-line text-white leading-snug"
                            style={{ 
                              fontSize: `${Math.max(11, Math.min(fontSize * 0.22, 18))}px`,
                              textTransform: textUppercase ? 'uppercase' : 'none',
                              fontFamily: fontFamily === 'Montserrat' ? '"Montserrat", sans-serif' :
                                          fontFamily === 'Space Grotesk' ? '"Space Grotesk", sans-serif' :
                                          fontFamily === 'Playfair Display' ? '"Playfair Display", serif' :
                                          fontFamily === 'Arial Black' ? '"Arial Black", sans-serif' :
                                          '"Inter", sans-serif',
                              textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 3px 12px rgba(0,0,0,0.95)',
                              WebkitTextStroke: '0.8px rgba(0,0,0,0.85)'
                            }}
                          >
                            {activeSlide}
                          </p>
                          {controllerTimeLeft && (
                            <div className="font-mono font-black text-emerald-400 text-sm tracking-widest mt-1.5 animate-pulse">
                              {controllerTimeLeft}
                            </div>
                          )}
                        </motion.div>
                      );
                    })() : controllerTimeLeft ? (
                      <motion.div
                        key="only-timer-preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center gap-1"
                      >
                        <div className="font-mono font-black text-emerald-400 text-2xl tracking-widest animate-pulse">
                          {controllerTimeLeft}
                        </div>
                        <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest">
                          Apenas Cronômetro Ativo
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty-preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.2 }}
                        className="text-[9px] font-black uppercase text-zinc-500 tracking-widest flex flex-col items-center gap-1"
                      >
                        <span>Tela Desligada ou sem texto</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Miniature Scrolling Alert Marquee inside preview */}
                {scrollingAlert && !blackout && (
                  <div className="absolute bottom-6 inset-x-0 h-4 bg-red-600/95 border-y border-red-500/50 flex items-center overflow-hidden z-20">
                    <div className="bg-red-700 px-1.5 h-full flex items-center justify-center font-black text-[5px] tracking-wider text-white border-r border-red-500/30 shrink-0 select-none">
                      📢 AVISO
                    </div>
                    <div className="flex-1 overflow-hidden relative flex items-center text-white select-none">
                      <div className="animate-marquee-scroll-mini font-bold text-[7px] tracking-wide whitespace-nowrap">
                        <span>{scrollingAlert} &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; {scrollingAlert} &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-[8px] font-mono text-zinc-500 tracking-widest mt-2 shrink-0 text-center select-none border-t border-white/5 pt-2 z-10">
                  Use as setas do teclado ◀ / ▶
                </div>
              </div>

              {/* Quick Live Text Input Box */}
              <div className="p-4 rounded-2xl border border-border/80 bg-black/5 dark:bg-white/5 space-y-3 flex flex-col justify-between h-[230px]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase text-brand tracking-widest">
                      <Sparkles size={14} className="text-brand animate-pulse" />
                      <span>Digitação Livre ao Vivo</span>
                    </div>
                    {activeSong?.id === 'custom-free-text' ? (
                      <span className="text-[8px] font-mono font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded animate-pulse">
                        No Telão
                      </span>
                    ) : (
                      <span className="text-[8px] font-mono font-black uppercase tracking-widest bg-black/10 dark:bg-white/10 text-text-muted px-1.5 py-0.5 rounded">
                        Rascunho
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-text-muted leading-tight">
                    Digite avisos, recados rápidos para membros ou versículos extras e projete imediatamente:
                  </p>

                  <textarea
                    value={freeText}
                    onChange={e => setFreeText(e.target.value)}
                    placeholder="Ex: Sala de Berçário: Chamar os pais do Lucas..."
                    rows={3}
                    className="w-full bg-black/20 border border-border/80 p-2 text-xs rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand font-medium placeholder:text-text-muted/40 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleProjectFreeText}
                    disabled={!freeText.trim()}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-45 disabled:pointer-events-none text-white ${
                      activeSong?.id === 'custom-free-text' && !blackout
                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/15'
                        : 'bg-brand hover:brightness-110 shadow-md shadow-brand/15'
                    }`}
                  >
                    <Tv size={12} />
                    <span>{activeSong?.id === 'custom-free-text' && !blackout ? 'Atualizar Telão' : 'Projetar Texto'}</span>
                  </button>
                  
                  {freeText && (
                    <button
                      type="button"
                      onClick={() => {
                        setFreeText('');
                        if (activeSong?.id === 'custom-free-text') {
                          handleClearProjection();
                        }
                      }}
                      className="p-1.5 rounded-xl border border-border/60 hover:bg-red-500/10 hover:text-red-500 text-zinc-400 transition-all active:scale-95 shrink-0"
                      title="Limpar texto"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Row: Full Width Config Box */}
            <div className="p-5 rounded-2xl border border-border/80 bg-black/5 dark:bg-white/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-2.5 gap-2">
                <div className="flex items-center gap-2">
                  <SettingsIcon size={16} className="text-brand" />
                  <span className="text-xs font-black uppercase text-brand tracking-widest">Painel de Configurações Visuais do Projetor</span>
                </div>
                {/* Explanatory tips summary */}
                <div className="flex items-start sm:items-center gap-1.5 text-[8.5px] text-text-muted leading-tight">
                  <HelpCircle size={11} className="text-brand shrink-0" />
                  <p>Ative o F11 na aba popup do projetor posicionada na segunda tela para a exibição cheia.</p>
                </div>
              </div>

              {/* Grid with 4 functional columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Column 1: Format & Text Configuration */}
                <div className="space-y-4">
                  <span className="block text-[10px] font-black uppercase text-text-muted tracking-wider border-b border-white/5 pb-1 select-none">Ajustes de Texto</span>
                  
                  {/* Font Size Settings */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-text-muted">
                      <span>Tamanho da Fonte:</span>
                      <span className="font-mono bg-black/20 dark:bg-white/25 px-2 py-0.5 rounded font-black text-text-main text-[10px]">{fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={32}
                      max={180}
                      step={2}
                      value={fontSize}
                      onChange={e => setFontSize(Number(e.target.value))}
                      className="w-full accent-brand bg-zinc-700/50 block cursor-pointer h-1.5 rounded-lg"
                    />
                    <div className="flex justify-between text-[8px] text-zinc-500 font-bold px-0.5">
                      <span>Mín (32px)</span>
                      <span>Máx (180px)</span>
                    </div>
                  </div>

                  {/* Text Layout Controls */}
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <span className="block text-[8.5px] font-bold text-text-muted uppercase tracking-wider">Alt. Vertical:</span>
                      <div className="flex rounded-lg overflow-hidden bg-black/25 border border-border/80 p-0.5">
                        {[
                          { id: 'top', label: 'Topo' },
                          { id: 'center', label: 'Meio' },
                          { id: 'bottom', label: 'Base' }
                        ].map(pos => (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => setTextPosition(pos.id as any)}
                            className={`flex-1 py-0.5 rounded text-[8px] font-black uppercase transition-all ${
                              textPosition === pos.id ? 'bg-brand text-white shadow-sm font-extrabold' : 'text-text-muted hover:text-text-main'
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[8.5px] font-bold text-text-muted uppercase tracking-wider">Alinhamento:</span>
                      <div className="flex rounded-lg overflow-hidden bg-black/25 border border-border/80 p-0.5">
                        {[
                          { id: 'left', label: 'Esq' },
                          { id: 'center', label: 'Cent' },
                          { id: 'right', label: 'Dir' }
                        ].map(align => (
                          <button
                            key={align.id}
                            type="button"
                            onClick={() => setTextAlign(align.id as any)}
                            className={`flex-1 py-0.5 rounded text-[8px] font-black uppercase transition-all ${
                              textAlign === align.id ? 'bg-brand text-white shadow-sm font-extrabold' : 'text-text-muted hover:text-text-main'
                            }`}
                          >
                            {align.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fonte de Worship */}
                    <div className="space-y-1">
                      <span className="block text-[8.5px] font-bold text-text-muted uppercase tracking-wider">Fonte do Telão:</span>
                      <select
                        value={fontFamily}
                        onChange={e => setFontFamily(e.target.value)}
                        className="w-full bg-black/20 border border-border rounded-lg py-1 px-2 text-[10px] font-black uppercase text-text-main outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                      >
                        <option value="Inter">Inter (Limpa/Moderna)</option>
                        <option value="Montserrat">Montserrat (Worship Clássico)</option>
                        <option value="Space Grotesk">Space Grotesk (Tech/Ousada)</option>
                        <option value="Playfair Display">Playfair Display (Serif/Hinos)</option>
                        <option value="Arial Black">Arial Black (Ultra Impacto)</option>
                      </select>
                    </div>

                    {/* Transição de Slides */}
                    <div className="space-y-1">
                      <span className="block text-[8.5px] font-bold text-text-muted uppercase tracking-wider">Estilo de Transição:</span>
                      <select
                        value={transitionType}
                        onChange={e => setTransitionType(e.target.value as any)}
                        className="w-full bg-black/20 border border-border rounded-lg py-1 px-2 text-[10px] font-black uppercase text-text-main outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                      >
                        <option value="slide">Deslizar Suave (Slide)</option>
                        <option value="fade">Desvanecer (Fade Out/In)</option>
                        <option value="scale">Zoom sutil (Scale)</option>
                        <option value="instant">Instantâneo (Sem transição)</option>
                      </select>
                    </div>

                    {/* Letras em Caixa Alta (Uppercase) */}
                    <div className="flex items-center justify-between pt-1 select-none">
                      <span className="text-[8.5px] font-bold text-text-muted uppercase tracking-wider">Letras em Caixa Alta:</span>
                      <button
                        type="button"
                        onClick={() => setTextUppercase(!textUppercase)}
                        className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border transition-all flex items-center gap-1 leading-none ${
                          textUppercase 
                            ? 'bg-brand/20 border-brand/50 text-brand font-black' 
                            : 'bg-zinc-850 border-border text-zinc-400 hover:text-white'
                        }`}
                      >
                        {textUppercase ? 'ATIVADO' : 'DESATIVADO'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 2: Themes & Adjustments */}
                <div className="space-y-4">
                  <span className="block text-[10px] font-black uppercase text-text-muted tracking-wider border-b border-white/5 pb-1 select-none">Tema & Cores</span>
                  
                  {/* Theme Selector */}
                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-text-muted">Selecione o Tema:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'black', label: 'Preto', color: 'bg-black border-zinc-800' },
                        { id: 'white', label: 'Branco', color: 'bg-white border-zinc-300' },
                        { id: 'dark-blue', label: 'Marinho', color: 'bg-indigo-950 border-indigo-900' },
                        { id: 'burgundy', label: 'Vinho', color: 'bg-rose-950 border-rose-900' },
                        { id: 'charcoal', label: 'Cinza', color: 'bg-stone-900 border-stone-800' },
                        { id: 'aurora', label: 'Aurora', color: 'bg-gradient-to-tr from-teal-950 to-purple-950 border-teal-900' },
                        { id: 'sunset', label: 'Ocaso', color: 'bg-gradient-to-b from-purple-950 to-orange-950/70 border-zinc-800' },
                        { id: 'forest', label: 'Floresta', color: 'bg-gradient-to-tr from-emerald-950 to-zinc-900 border-zinc-800' },
                        { id: 'custom-image', label: 'Imagem 🖼️', color: 'bg-teal-900 border-emerald-800' },
                        { id: 'custom-video', label: 'Vídeo 🎥', color: 'bg-cyan-900 border-cyan-850' },
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTheme(t.id as any);
                            if (t.id === 'white') {
                              setTextColor('#000000');
                              setTextShadow(false);
                            } else if (t.id === 'black') {
                              setTextColor('#ffffff');
                              setTextShadow(true);
                            }
                          }}
                          className={`py-1 px-1 flex flex-col items-center justify-center border rounded-lg text-[8px] font-black uppercase gap-0.5 transition-all ${
                            t.id === 'white' ? 'text-black' : 'text-white'
                          } ${t.color} ${
                            theme === t.id ? 'ring-2 ring-brand border-white scale-102 font-extrabold' : 'opacity-70 scale-95 hover:opacity-100'
                          }`}
                        >
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color inputs and projection shadow */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-0.5">
                      <span className="block text-[8px] font-bold text-text-muted uppercase tracking-wider">Cor da Letra:</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="color" 
                          value={textColor} 
                          onChange={e => setTextColor(e.target.value)}
                          className="w-5 h-5 rounded border border-white/10 bg-transparent cursor-pointer p-0 shrink-0 block"
                        />
                        <input 
                          type="text" 
                          value={textColor} 
                          onChange={e => setTextColor(e.target.value)}
                          className="w-full bg-black/25 border border-border/80 h-5 px-1 text-[8px] font-mono font-bold text-center rounded outline-none text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={() => setTextShadow(!textShadow)}
                        className={`h-5.5 rounded-lg text-[8px] font-black uppercase border transition-all flex items-center justify-center gap-1 ${
                          textShadow 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-extrabold' 
                            : 'bg-zinc-800/40 border-border text-zinc-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${textShadow ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                        Sombra Letra
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 3: Suggestions Gallery */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1 select-none">
                    <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">Fundos Padrão (Sugestões)</span>
                    <span className="text-[7.5px] font-black uppercase text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded leading-none shrink-0 text-center">Curados ⚡</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {presets
                      .filter(preset => ['solid-black', 'bible', 'empty-cross', 'worship-hands-1', 'worship-hands-2', 'worship-celebration'].includes(preset.id))
                      .map(preset => {
                        const isActive = preset.id === 'solid-black'
                          ? theme === 'black'
                          : (theme === 'custom-image' && customBgUrl === preset.url);
                        return (
                          <div
                            key={preset.id}
                            className={`group relative h-12 rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 border text-left flex flex-col justify-end ${
                              isActive ? 'ring-2 ring-brand border-white scale-[1.02]' : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (preset.id === 'solid-black') {
                                  setTheme('black');
                                  setTextColor('#ffffff');
                                  setTextShadow(true);
                                } else {
                                  setTheme('custom-image');
                                  setCustomBgUrl(preset.url);
                                }
                              }}
                              title={preset.desc || preset.name}
                              className="absolute inset-0 w-full h-full text-left flex flex-col justify-end p-2 z-10"
                            >
                              {preset.id === 'solid-black' ? (
                                <div className="absolute inset-0 bg-black border border-zinc-800" />
                              ) : (
                                <img 
                                  src={preset.url} 
                                  alt={preset.name}
                                  referrerPolicy="no-referrer"
                                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none"
                                  style={{ filter: 'brightness(52%)' }}
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                              <div className="relative z-10 w-full flex items-center justify-between gap-1 leading-none pointer-events-none">
                                <span className="text-[8px] font-black uppercase tracking-wide text-white truncate w-14 leading-none">
                                  {preset.name}
                                </span>
                                <span className="text-[10px] leading-none select-none">{preset.icon || '🖼️'}</span>
                              </div>
                            </button>

                            {/* Delete Hover Trigger */}
                            {preset.id !== 'solid-black' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeletePreset(preset.id);
                                }}
                                title="Remover sugestão de fundo"
                                className="absolute top-1 right-1 z-20 p-1 bg-black/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                              >
                                <Trash2 size={9} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Column 4: Custom Gallery */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1 select-none">
                    <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">Fundos Personalizados</span>
                    <button
                      type="button"
                      onClick={handleRestoreDefaultPresets}
                      className="text-[8px] font-black uppercase text-zinc-400 hover:text-brand bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 px-1 py-0.5 rounded leading-none transition-all"
                      title="Restaurar originais na galeria em nuvem"
                    >
                      Restaurar 🔄
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {presets
                      .filter(preset => !['solid-black', 'bible', 'empty-cross', 'worship-hands-1', 'worship-hands-2', 'worship-celebration'].includes(preset.id))
                      .map(preset => {
                        const isActive = theme === 'custom-image' && customBgUrl === preset.url;
                        return (
                          <div
                            key={preset.id}
                            className={`group relative h-12 rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 border text-left flex flex-col justify-end ${
                              isActive ? 'ring-2 ring-brand border-white scale-[1.02]' : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            {/* Inner selection button */}
                            <button
                              type="button"
                              onClick={() => {
                                setTheme('custom-image');
                                setCustomBgUrl(preset.url);
                              }}
                              title={preset.desc || preset.name}
                              className="absolute inset-0 w-full h-full text-left flex flex-col justify-end p-2 z-10"
                            >
                              <img 
                                src={preset.url} 
                                alt={preset.name}
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none animate-slow-motion"
                                style={{ filter: 'brightness(50%)' }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                              <div className="relative z-10 w-full flex items-center justify-between gap-1 leading-none pointer-events-none">
                                <span className="text-[8px] font-black uppercase tracking-wide text-white truncate w-14 leading-none">
                                  {preset.name}
                                </span>
                                <span className="text-[10px] leading-none select-none">{preset.icon || '🖼️'}</span>
                              </div>
                            </button>

                            {/* Delete Hover Trigger */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeletePreset(preset.id);
                              }}
                              title="Remover fundo da galeria"
                              className="absolute top-1 right-1 z-20 p-1 bg-black/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                            >
                              <Trash2 size={9} />
                            </button>
                          </div>
                        );
                      })}

                    {/* Drag and Drop and File Select Card */}
                    <label
                      htmlFor="bg-upload-input"
                      className={`relative h-12 rounded-xl border border-dashed hover:border-brand border-zinc-700 hover:bg-white/5 bg-black/30 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group text-center p-1 ${
                        isUploadingBg ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isUploadingBg) return;
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleImageUpload(e.dataTransfer.files[0]);
                        }
                      }}
                    >
                      <input 
                        type="file" 
                        id="bg-upload-input" 
                        accept="image/*" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0]);
                          }
                        }}
                        disabled={isUploadingBg}
                        className="hidden"
                      />
                      {isUploadingBg ? (
                        <div className="flex flex-col items-center gap-0.5 text-brand animate-pulse">
                          <RefreshCw size={12} className="animate-spin" />
                          <span className="text-[7px] font-bold uppercase tracking-wider">Otimizando...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center leading-none">
                          <UploadCloud size={14} className="text-zinc-500 group-hover:text-brand transition-colors mb-0.5" />
                          <span className="text-[7.5px] font-black uppercase text-zinc-400 group-hover:text-text-main tracking-tight leading-none text-center">Arraste Nova</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Column 4: Slide History */}
                <div className="space-y-4 flex flex-col">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1 select-none">
                    <span className="text-[10px] font-black uppercase text-text-muted tracking-wider flex items-center gap-1">
                      <HistoryIcon size={10} className="text-brand" />
                      Histórico de Slides
                    </span>
                    {slideHistory.length > 0 && (
                      <button 
                        type="button"
                        onClick={() => setSlideHistory([])}
                        className="text-[8px] font-black uppercase text-red-400 hover:text-red-300 transition-colors"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-1.5 max-h-[160px] min-h-[160px]">
                    {slideHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500 bg-black/10 rounded-xl border border-white/5 border-dashed">
                        <HistoryIcon size={20} className="opacity-20 mb-1" />
                        <span className="text-[8.5px] uppercase font-bold tracking-wider">Histórico Vazio</span>
                        <span className="text-[7.5px] font-mono mt-0.5">Slides projetados aparecerão aqui</span>
                      </div>
                    ) : (
                      slideHistory.map((item) => {
                        const activeSlide = slides[activeSlideIdx];
                        const activeText = typeof activeSlide === 'string' ? activeSlide : '';
                        const isCurrent = activeText === item.text && !blackout && !clearText && !showLogo;
                        
                        return (
                          <motion.button
                            key={item.id}
                            type="button"
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              syncCurrentState(item.text);
                            }}
                            className={`w-full text-left p-2 rounded-xl border transition-all duration-300 flex flex-col justify-between gap-1.5 ${
                              isCurrent
                                ? 'bg-brand/15 border-brand/50 text-brand font-extrabold shadow-sm shadow-brand/10'
                                : 'bg-black/20 border-white/5 hover:border-white/20 hover:bg-black/35 text-zinc-300 hover:text-white'
                            }`}
                          >
                            <span className="text-[9px] leading-snug font-medium line-clamp-3">
                              {item.text}
                            </span>
                            <div className="flex items-center justify-between text-[7px] font-mono text-zinc-500 uppercase">
                              <span>⏱️ Re-projetar</span>
                              <span>{item.time}</span>
                            </div>
                          </motion.button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Inline Background attributes configs - Full Width Spanning Column */}
                {(theme === 'custom-image' || theme === 'custom-video') && (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-4 p-4 sm:p-5 bg-black/30 dark:bg-zinc-900/40 border border-brand/20 rounded-2xl text-left shadow-lg space-y-4">
                    {/* Title and Exemplo trigger */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-brand tracking-widest">
                          {theme === 'custom-image' ? 'Imagem de Fundo Personalizada 🖼️' : 'Vídeo de Fundo Personalizado 🎥'}
                        </span>
                        <span className="text-[8px] bg-brand/10 text-brand border border-brand/20 px-1.5 py-0.5 rounded font-black uppercase">
                          Configurações Ativas
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          if (theme === 'custom-image') {
                            setCustomBgUrl('https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=1200&auto=format&fit=crop');
                          } else {
                            setCustomBgUrl('https://assets.mixkit.co/videos/preview/mixkit-background-of-a-glowing-neon-dust-42171-large.mp4');
                          }
                        }}
                        className="text-[8px] font-black uppercase underline text-zinc-400 hover:text-white transition-colors flex items-center gap-1 self-start sm:self-auto"
                      >
                        Carregar URL de Exemplo ✨
                      </button>
                    </div>

                    {/* Main input for URL */}
                    <div className="space-y-1">
                      <label className="block text-[8.5px] font-bold text-text-muted uppercase tracking-wider">URL do Arquivo de Mídia (Internet):</label>
                      <input
                        type="text"
                        placeholder={theme === 'custom-image' ? "Cole a URL da imagem de fundo (.jpg, .png, .webp)" : "Cole a URL do vídeo mp4 alternativo"}
                        value={customBgUrl}
                        onChange={e => setCustomBgUrl(e.target.value)}
                        className="w-full bg-black/40 border border-border/80 text-[10px] sm:text-xs rounded-xl p-2.5 font-medium text-zinc-100 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Config Sliders Grid */}
                    <div className="space-y-2">
                      <span className="block text-[8.5px] font-bold text-text-muted uppercase tracking-wider mb-1">Ajustes Finos da Imagem:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        <div className="space-y-1.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400">
                            <span>Opacidade:</span>
                            <span className="font-mono text-brand font-black">{Math.round(bgOpacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min={0.1}
                            max={0.9}
                            step={0.05}
                            value={bgOpacity}
                            onChange={e => setBgOpacity(Number(e.target.value))}
                            className="w-full accent-brand bg-zinc-700/50 block cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400">
                            <span>Desfoque:</span>
                            <span className="font-mono text-brand font-black">{bgBlur}px</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={12}
                            step={1}
                            value={bgBlur}
                            onChange={e => setBgBlur(Number(e.target.value))}
                            className="w-full accent-brand bg-zinc-700/50 block cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400">
                            <span>Brilho:</span>
                            <span className="font-mono text-brand font-black">{bgBrightness}%</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={150}
                            step={5}
                            value={bgBrightness}
                            onChange={e => setBgBrightness(Number(e.target.value))}
                            className="w-full accent-brand bg-zinc-700/50 block cursor-pointer"
                            title="Aumente para clarear os fundos escuros em aparelhos antigos"
                          />
                        </div>

                        <div className="space-y-1.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400">
                            <span>Contraste:</span>
                            <span className="font-mono text-brand font-black">{bgContrast}%</span>
                          </div>
                          <input
                            type="range"
                            min={50}
                            max={200}
                            step={5}
                            value={bgContrast}
                            onChange={e => setBgContrast(Number(e.target.value))}
                            className="w-full accent-brand bg-zinc-700/50 block cursor-pointer"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1 space-y-1.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400">
                            <span>Saturação:</span>
                            <span className="font-mono text-brand font-black">{bgSaturation}%</span>
                          </div>
                          <input
                            type="range"
                            min={50}
                            max={200}
                            step={5}
                            value={bgSaturation}
                            onChange={e => setBgSaturation(Number(e.target.value))}
                            className="w-full accent-brand bg-zinc-700/50 block cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* VGA booster mode shortcut presets */}
                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-border/40">
                        <p className="text-[8px] leading-normal text-zinc-400 font-medium">
                          💡 <strong>Dica de Transmissão:</strong> Se o projetor VGA ou TV antiga estiver escura, use os botões rápidos para clareamento dinâmico:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setBgBrightness(85);
                              setBgContrast(125);
                              setBgSaturation(160);
                              setBgOpacity(0.75);
                            }}
                            className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/100 hover:text-white text-amber-400 border border-amber-500/20 text-[7.5px] font-extrabold uppercase tracking-wider transition-all"
                          >
                            ⚡ Otimizar para VGA (Médio)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBgBrightness(115);
                              setBgContrast(140);
                              setBgSaturation(190);
                              setBgOpacity(0.85);
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/100 hover:text-white text-emerald-400 border border-emerald-500/20 text-[7.5px] font-extrabold uppercase tracking-wider transition-all"
                          >
                            🚀 Ultra Brilho (VGA Fraco)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBgBrightness(40);
                              setBgContrast(100);
                              setBgSaturation(100);
                              setBgOpacity(0.5);
                            }}
                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-350 border border-zinc-700 text-[7.5px] font-extrabold uppercase tracking-wider transition-all"
                          >
                            Restaurar Padrão
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Guia Prático do Operador */}
      <AnimatePresence>
        {showPracticalGuide && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full"
          >
            <div className="p-6 rounded-3xl border border-amber-500/20 bg-amber-500/5 space-y-6 mt-4">
              
              {/* Header do Guia */}
              <div className="flex items-start justify-between gap-4 border-b border-amber-500/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                    <BookOpen size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black uppercase text-amber-500 tracking-wider">
                      Guia Prático do Operador de Projeção
                    </h2>
                    <p className="text-text-muted text-sm font-medium mt-0.5">
                      O passo a passo definitivo para operar o telão, data show ou painel de LED da igreja com excelência e zero falhas.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPracticalGuide(false)}
                  className="px-4 py-2 rounded-xl border border-amber-500/20 hover:bg-amber-500/10 text-xs font-black uppercase text-amber-500 transition-all hover:scale-95 shrink-0"
                >
                  Recolher Guia ✕
                </button>
              </div>

              {/* Bento Grid de Instruções */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Card 1: Configuração do Projetor */}
                <div className="p-5 rounded-2xl border border-border bg-black/25 dark:bg-zinc-900/30 hover:border-brand/40 hover:bg-black/40 transition-all duration-300 flex flex-col justify-between group">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm bg-amber-500/10 text-amber-500 font-serif font-black w-6 h-6 rounded-lg flex items-center justify-center border border-amber-500/20">
                        1
                      </span>
                      <span className="text-sm sm:text-base font-black uppercase text-text-main tracking-wider flex items-center gap-1.5">
                        <Monitor size={15} className="text-indigo-400 group-hover:animate-bounce" />
                        A Transmissão (Telas)
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                      Para exibir as letras na segunda tela (projetor ou TV) sem ver o painel de controle do Liloupro:
                    </p>
                    <ul className="text-xs sm:text-sm text-text-muted space-y-2 pl-4 list-disc">
                      <li>
                        Clique em <strong className="text-white">"Abrir Janela do Projetor"</strong> ou no link de segurança para abrir a aba de transmissão.
                      </li>
                      <li>
                        Arraste essa nova aba para a <strong className="text-white">segunda tela</strong> conectada (sua saída de vídeo física).
                      </li>
                      <li>
                        Dê um clique dentro dela e aperte <strong className="text-emerald-400 font-mono">F11</strong> para entrar no modo Tela Cheia sem bordas.
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[10px] sm:text-xs text-indigo-400 font-mono font-bold">
                    💡 Dica: Configure o Windows como "Estender Telas" (Win + P).
                  </div>
                </div>

                {/* Card 2: Liturgia e Letras */}
                <div className="p-5 rounded-2xl border border-border bg-black/25 dark:bg-zinc-900/30 hover:border-brand/40 hover:bg-black/40 transition-all duration-300 flex flex-col justify-between group">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm bg-amber-500/10 text-amber-500 font-serif font-black w-6 h-6 rounded-lg flex items-center justify-center border border-amber-500/20">
                        2
                      </span>
                      <span className="text-sm sm:text-base font-black uppercase text-text-main tracking-wider flex items-center gap-1.5">
                        <LayoutGrid size={15} className="text-emerald-400 group-hover:rotate-45 transition-transform" />
                        Liturgia & Letras
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                      Gerencie as músicas, leituras e momentos do roteiro oficial do culto em poucos cliques:
                    </p>
                    <ul className="text-xs sm:text-sm text-text-muted space-y-2 pl-4 list-disc">
                      <li>
                        Selecione o Culto ativo no seletor para sincronizar automaticamente a ordem de músicas e leituras.
                      </li>
                      <li>
                        Use as <strong className="text-emerald-400 font-mono">Setas do Teclado (◀ / ▶)</strong> para passar os slides rapidamente, ou clique direto na estrofe.
                      </li>
                      <li>
                        Caso um item não tenha letra, use o botão de <strong className="text-white">vincular música</strong> para ligá-lo a uma música do repertório na hora.
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[10px] sm:text-xs text-emerald-400 font-mono font-bold">
                    ⚡ Use as setas do teclado para manter o foco no culto!
                  </div>
                </div>

                {/* Card 3: Fundos e Imagens */}
                <div className="p-5 rounded-2xl border border-border bg-black/25 dark:bg-zinc-900/30 hover:border-brand/40 hover:bg-black/40 transition-all duration-300 flex flex-col justify-between group">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm bg-amber-500/10 text-amber-500 font-serif font-black w-6 h-6 rounded-lg flex items-center justify-center border border-amber-500/20">
                        3
                      </span>
                      <span className="text-sm sm:text-base font-black uppercase text-text-main tracking-wider flex items-center gap-1.5">
                        <Sliders size={15} className="text-brand group-hover:animate-pulse" />
                        Troca de Fundo
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                      Mude a estética visual do telão instantaneamente para combinar com o clima da canção:
                    </p>
                    <ul className="text-xs sm:text-sm text-text-muted space-y-2 pl-4 list-disc">
                      <li>
                        Selecione cores sólidas ou navegue pelas <strong className="text-white">Sugestões Curadas</strong> (como Bíblia ou Adoradores).
                      </li>
                      <li>
                        Faça upload arrastando qualquer arquivo JPG ou PNG para o box <strong className="text-white">"Arraste Nova"</strong> para salvar na galeria.
                      </li>
                      <li>
                        <strong>Ajustes Finos (VGA antigo):</strong> Controle o Brilho, Contraste e Desfoque para clarear os fundos e deixar a letra ultra legível em projetores antigos.
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[10px] sm:text-xs text-brand font-mono font-bold">
                    🖼️ Use o botão "Otimizar para VGA" em aparelhos escuros.
                  </div>
                </div>

                {/* Card 4: Botões de Pânico e Emergência */}
                <div className="p-5 rounded-2xl border border-border bg-black/25 dark:bg-zinc-900/30 hover:border-brand/40 hover:bg-black/40 transition-all duration-300 flex flex-col justify-between group">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm bg-amber-500/10 text-amber-500 font-serif font-black w-6 h-6 rounded-lg flex items-center justify-center border border-amber-500/20">
                        4
                      </span>
                      <span className="text-sm sm:text-base font-black uppercase text-text-main tracking-wider flex items-center gap-1.5">
                        <Megaphone size={15} className="text-red-400 group-hover:animate-bounce" />
                        Controles & Alertas
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                      Ferramentas críticas para lidar com imprevistos e avisar a igreja sem ruídos sonoros:
                    </p>
                    <ul className="text-xs sm:text-sm text-text-muted space-y-2 pl-4 list-disc">
                      <li>
                        <strong className="text-red-400">Blackout (Tela Encoberta):</strong> Apaga todo o telão na hora em caso de falha de energia ou erro do cantor.
                      </li>
                      <li>
                        <strong className="text-white">Limpar Texto:</strong> Oculta a letra da música nos solos e instrumentais longos, mantendo o fundo de tela visível.
                      </li>
                      <li>
                        <strong className="text-emerald-400">Alertas Rolantes:</strong> Digite um recado no painel e mande rodar silenciosamente na base da tela para os membros.
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[10px] sm:text-xs text-red-400 font-mono font-bold">
                    📢 Ideal para chamar pais ao berçário ou avisar placas de carros.
                  </div>
                </div>

              </div>

              {/* Tabela de Atalhos Rápidos para o Teclado */}
              <div className="p-5 rounded-2xl bg-black/30 border border-amber-500/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-amber-500/10 pb-2.5">
                  <Keyboard size={18} className="text-amber-500 animate-pulse" />
                  <span className="text-sm font-black uppercase text-amber-500 tracking-wider">
                    Atalhos de Teclado Rápidos (Opere como um Profissional 🚀)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  
                  <div className="p-3 bg-black/45 rounded-xl border border-white/5 text-center flex flex-col justify-center items-center gap-1.5">
                    <kbd className="px-2.5 py-1 bg-zinc-850 border border-zinc-700 rounded text-xs font-mono font-black text-white shadow-sm">
                      ▶ / Seta Dir
                    </kbd>
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Próximo Slide</span>
                  </div>

                  <div className="p-3 bg-black/45 rounded-xl border border-white/5 text-center flex flex-col justify-center items-center gap-1.5">
                    <kbd className="px-2.5 py-1 bg-zinc-850 border border-zinc-700 rounded text-xs font-mono font-black text-white shadow-sm">
                      ◀ / Seta Esq
                    </kbd>
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Slide Anterior</span>
                  </div>

                  <div className="p-3 bg-black/45 rounded-xl border border-white/5 text-center flex flex-col justify-center items-center gap-1.5">
                    <kbd className="px-2.5 py-1 bg-red-600 border border-red-500 rounded text-xs font-mono font-black text-white shadow-sm">
                      ESC / B
                    </kbd>
                    <span className="text-[10px] uppercase font-bold text-red-400">Tela Preta (Blackout)</span>
                  </div>

                  <div className="p-3 bg-black/45 rounded-xl border border-white/5 text-center flex flex-col justify-center items-center gap-1.5">
                    <kbd className="px-2.5 py-1 bg-zinc-850 border border-zinc-700 rounded text-xs font-mono font-black text-white shadow-sm">
                      T
                    </kbd>
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Ocultar Letra (Clear)</span>
                  </div>

                  <div className="p-3 bg-black/45 rounded-xl border border-white/5 text-center flex flex-col justify-center items-center gap-1.5">
                    <kbd className="px-2.5 py-1 bg-indigo-600 border border-indigo-500 rounded text-xs font-mono font-black text-white shadow-sm">
                      L
                    </kbd>
                    <span className="text-[10px] uppercase font-bold text-indigo-400">Projetar Logo Igreja</span>
                  </div>

                  <div className="p-3 bg-black/45 rounded-xl border border-white/5 text-center flex flex-col justify-center items-center gap-1.5">
                    <kbd className="px-2.5 py-1 bg-zinc-850 border border-zinc-700 rounded text-xs font-mono font-black text-white shadow-sm">
                      F11
                    </kbd>
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Modo Tela Cheia</span>
                  </div>

                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
