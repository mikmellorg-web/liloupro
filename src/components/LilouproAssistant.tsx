import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Sparkles, Mic, MicOff, Send, X, Volume2, VolumeX, RotateCcw, 
  BookOpen, Music, Calendar, Plus, ChevronRight, ChevronLeft, HelpCircle,
  Tv, Maximize2, Check, ArrowRight, Loader2, Bot, Layers, CheckCircle2, Radio, Timer, Users,
  Play, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { findLocalPopularSong } from '../songsDatabase';
import { parseSpokenBibleCommand, isGeneralBibleRequest } from '../utils/bibleParser';
import { ScreenInteractiveManualModal, SCREEN_MANUALS } from './ScreenInteractiveManualModal';
import { GoogleCalendarIcon } from './GoogleCalendarIcon';
import { GoogleDocsIcon } from './GoogleDocsIcon';
import { getServicePlaylistSongs, getServiceSongs } from '../utils/servicePlaylistUtils';
import { downloadCifrasCultoPDF } from '../utils/googleDocsCadernoUtils';

/**
 * =========================================================================
 * 🛡️ VOZ OFICIAL E PERMANENTE DO ASSISTENTE LILOU - REGRA DE BLINDAGEM 🛡️
 * =========================================================================
 * IDENTIDADE VOCAL: Masculina, expressiva, natural, qualidade de estúdio.
 * MOTOR: Gemini TTS (Google GenAI) com preset de voz 'Puck'.
 * 
 * ⚠️ REGRA FUNDAMENTAL E PERMANENTE:
 * NÃO ALTERE, SUBSTITUA, DEGRADE OU TROQUE ESTA CONFIGURAÇÃO EM NENHUMA ATUALIZAÇÃO
 * DO APLICATIVO, REFATORAÇÃO OU MUDANÇA DE CÓDIGO SEM AUTORIZAÇÃO EXPLÍCITA DO USUÁRIO.
 * O sintetizador robótico nativo do navegador (window.speechSynthesis) NÃO DEVE
 * ser utilizado para reproduzir as respostas do LiLou.
 * =========================================================================
 */
export const LILOU_OFFICIAL_VOICE_CONFIG = {
  voiceName: 'Puck' as const,
  gender: 'male' as const,
  engine: 'gemini-tts' as const,
  model: 'gemini-3.8-flash-tts' as const,
  fallbackModel: 'gemini-3.8-flash-lite-tts' as const,
  style: 'Voz masculina brasileira jovem, natural, clara, amigável e conversacional',
  mimeType: 'audio/wav' as const,
} as const;

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  steps?: string[];
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onActionClick?: () => void;
  actionSuccessMessage?: string;
  secondaryActionLabel?: string;
  secondaryActionIcon?: React.ReactNode;
  onSecondaryActionClick?: () => void;
}

interface LilouproAssistantProps {
  theme: 'dark' | 'light';
  allSongs: any[];
  currentSong?: any;
  onNavigate: (tab: 'home' | 'songs' | 'calendar' | 'members' | 'liturgy' | 'availability' | 'settings' | 'admin' | 'projection' | 'chat' | 'theory' | 'bible' | 'offline' | 'master') => void;
  onOpenSong: (song: any, options?: { focusMode?: boolean; scrollSpeed?: number; autoScroll?: boolean; showPlayer?: boolean }) => void;
  onOpenBible: (bookName: string, chapter: number, verse?: number) => void;
  onOpenAddSong: () => void;
  onOpenTuner?: () => void;
  onOpenMetronome?: () => void;
  onOpenHelpCenter?: () => void;
  isAdmin?: boolean;
  currentTab?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  services?: any[];
  activeService?: any;
  onStartPlaylist?: (songs: any[]) => void;
  onDownloadCifrasCulto?: (service?: any) => void;
}

export const openLilouproAssistant = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('liloupro:open-assistant'));
  }
};

let assistantMsgCounter = 0;
const getUniqueAssistantMsgId = (sender: string) => {
  assistantMsgCounter += 1;
  return `${sender}-${Date.now()}-${assistantMsgCounter}-${Math.random().toString(36).substring(2, 8)}`;
};

/**
 * Detecta se uma transcrição contém as palavras-chave de ativação:
 * "Oi Lilou", "Ok Lilou", "Oi Lioi", "Ok Lioi", "Ei Lilou", "Lilou", "Olá Lilou", etc.
 * e extrai qualquer comando que tenha sido dito imediatamente depois.
 */
export function checkLilouWakeWord(transcript: string): { detected: boolean; commandAfter: string } {
  if (!transcript || typeof transcript !== 'string') return { detected: false, commandAfter: '' };

  const norm = transcript
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!norm || norm.length < 3) return { detected: false, commandAfter: '' };

  // Prefixos comuns em português com todas as grafias e variações fonéticas ("Oi Lilou", "OK Lilou", "E aí Lilou", etc.)
  const prefixes = '(?:oi|oie|ola|ok|okay|oq|oque|o\\s+que|ei|hey|heey|he|fala|opa|alo|alou|e\\s+ai|eai|eaí|iai|iae|ou|ae|eae)';
  // Variações fonéticas de reconhecimento de fala para "Lilou" e "Liloupro"
  const lilouVariants = '(?:liloupro|lilou\\s+pro|lilopro|lilo\\s+pro|lilou|li\\s+lou|lioi|liou|lio|lilo|li\\s+lo|lilu|li\\s+lu|lilow|liloo|lillou|lee\\s+lou|lili|nilou|lelou|leilou|laylou|milou|liluo|lilum|lilon|lelo|lile|lulu|lou)';

  // 1. Prefixo + Lilou/Lioi (ex: "oi lilou ...", "ok lilou ...", "e ai lilou ...")
  const prefixedRegex = new RegExp(`(?:^|\\b)${prefixes}\\s+${lilouVariants}(?:\\b|\\s+|$)(.*)`, 'i');
  const matchPrefixed = norm.match(prefixedRegex);
  if (matchPrefixed) {
    return {
      detected: true,
      commandAfter: (matchPrefixed[1] || '').trim()
    };
  }

  // 2. Apenas o nome Lilou / Liloupro (ex: "lilou toca tal música", "lilou abre a bíblia")
  const directRegex = new RegExp(`(?:^|\\b)${lilouVariants}(?:\\b|\\s+|$)(.*)`, 'i');
  const matchDirect = norm.match(directRegex);
  if (matchDirect) {
    return {
      detected: true,
      commandAfter: (matchDirect[1] || '').trim()
    };
  }

  return { detected: false, commandAfter: '' };
}

// Respostas dinâmicas e naturais para o assistente (tom humano, curto e sem afetações)
const GREETING_VARIATIONS = [
  'Oi! Pode falar.',
  'Oi! Tô aqui.',
  'Pode falar.',
  'Claro, pode falar.',
  'Oi! Como posso ajudar?'
];

function getRandomGreeting(): string {
  const idx = Math.floor(Math.random() * GREETING_VARIATIONS.length);
  return GREETING_VARIATIONS[idx];
}

const NOT_UNDERSTOOD_VARIATIONS = [
  'Não entendi o que você falou. Pode repetir?',
  'Não entendi. Pode falar de novo?',
  'Pode repetir pra mim?',
  'Não consegui ouvir. Pode falar novamente?'
];

function getRandomNotUnderstood(): string {
  const idx = Math.floor(Math.random() * NOT_UNDERSTOOD_VARIATIONS.length);
  return NOT_UNDERSTOOD_VARIATIONS[idx];
}

const ACTION_OPENING_VARIATIONS = [
  'Claro, já vou abrir.',
  'Pode deixar.',
  'Já vou abrir.',
  'Claro, vou abrir.',
  'Claro.',
  'Vamos lá.',
  'Pode deixar comigo.'
];

function getRandomOpening(resourceName?: string): string {
  if (resourceName) {
    const specific = [
      `Claro, já vou abrir ${resourceName}.`,
      `Pode deixar, abrindo ${resourceName}.`,
      `Claro, vou abrir ${resourceName}.`,
      `Já vou abrir ${resourceName}.`,
      'Pode deixar.',
      'Claro.'
    ];
    return specific[Math.floor(Math.random() * specific.length)];
  }
  return ACTION_OPENING_VARIATIONS[Math.floor(Math.random() * ACTION_OPENING_VARIATIONS.length)];
}

const ACTION_DONE_VARIATIONS = [
  'Pronto.',
  'Já abriu.',
  'Feito.',
  'Pronto, pode usar.',
  'Já está aberto.'
];

function getRandomDone(): string {
  const idx = Math.floor(Math.random() * ACTION_DONE_VARIATIONS.length);
  return ACTION_DONE_VARIATIONS[idx];
}

export function LilouproAssistant({
  theme,
  allSongs = [],
  currentSong,
  onNavigate,
  onOpenSong,
  onOpenBible,
  onOpenAddSong,
  onOpenTuner,
  onOpenMetronome,
  onOpenHelpCenter,
  isAdmin = false,
  currentTab = 'home',
  isOpen: isOpenProp,
  onOpenChange,
  services = [],
  activeService,
  onStartPlaylist,
  onDownloadCifrasCulto
}: LilouproAssistantProps) {
  const isLight = theme === 'light';
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = isOpenProp !== undefined;
  const isOpen = isControlled ? isOpenProp : internalIsOpen;

  const targetService = useMemo(() => {
    if (activeService) return activeService;
    if (!services || services.length === 0) return null;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const servicesWithDates = services
      .map(s => {
        let date;
        if (s.date?.toDate) date = s.date.toDate();
        else if (s.date instanceof Date) date = s.date;
        else date = new Date(s.date);
        return { ...s, _actualDate: isNaN(date.getTime()) ? new Date(0) : date };
      })
      .filter(s => (s.liturgy && s.liturgy.length > 0) || (s.setlist && s.setlist.length > 0))
      .sort((a, b) => a._actualDate.getTime() - b._actualDate.getTime());

    if (servicesWithDates.length === 0) {
      const allSorted = [...services]
        .map(s => {
          let date = s.date?.toDate ? s.date.toDate() : (s.date instanceof Date ? s.date : new Date(s.date));
          return { ...s, _actualDate: isNaN(date.getTime()) ? new Date(0) : date };
        })
        .sort((a, b) => a._actualDate.getTime() - b._actualDate.getTime());
      const future = allSorted.find(s => s._actualDate >= startOfToday);
      return future || allSorted[allSorted.length - 1] || null;
    }

    const future = servicesWithDates.find(s => s._actualDate >= startOfToday);
    if (future) return future;
    return servicesWithDates[servicesWithDates.length - 1] || null;
  }, [activeService, services]);

  const setIsOpen = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isOpen) : val;
    if (!isControlled) {
      setInternalIsOpen(nextVal);
    }
    onOpenChange?.(nextVal);
  }, [isOpen, isControlled, onOpenChange]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('liloupro_assistant_tts') !== 'false';
    } catch {
      return true;
    }
  });

  // Retractable floating button state (can dock to lateral edge)
  const [isRetracted, setIsRetracted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('liloupro_assistant_retracted');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const toggleRetract = (val?: boolean) => {
    setIsRetracted(prev => {
      const next = val !== undefined ? val : !prev;
      try {
        localStorage.setItem('liloupro_assistant_retracted', String(next));
      } catch {}
      return next;
    });
  };

  // Global listeners for direct programmatic triggering (from header, menus, cards)
  useEffect(() => {
    const handleCustomOpen = () => {
      setIsOpen(true);
      setIsRetracted(false);
      try {
        localStorage.setItem('liloupro_assistant_retracted', 'false');
      } catch {}
    };

    const handleResetPos = () => {
      setIsRetracted(false);
      try {
        localStorage.setItem('liloupro_assistant_retracted', 'false');
      } catch {}
    };

    const handleCustomVoiceOpen = () => {
      setIsOpen(true);
      setIsRetracted(false);
      try {
        localStorage.setItem('liloupro_assistant_retracted', 'false');
      } catch {}
      // Inicia a escuta visual e transcrição instantânea no painel
      setTimeout(() => {
        startListening();
      }, 750);
    };

    window.addEventListener('liloupro:open-assistant', handleCustomOpen);
    window.addEventListener('liloupro:open-assistant-voice', handleCustomVoiceOpen);
    window.addEventListener('liloupro:reset-assistant-pos', handleResetPos);
    return () => {
      window.removeEventListener('liloupro:open-assistant', handleCustomOpen);
      window.removeEventListener('liloupro:open-assistant-voice', handleCustomVoiceOpen);
      window.removeEventListener('liloupro:reset-assistant-pos', handleResetPos);
    };
  }, [setIsOpen]);

  // State for Screen Interactive Manual
  const [isInteractiveManualOpen, setIsInteractiveManualOpen] = useState(false);
  const [interactiveManualKey, setInteractiveManualKey] = useState<string>('home');

  // Identificação inteligente da tela atual
  const currentScreenKey = useMemo(() => {
    if (currentSong && currentTab === 'songs') {
      return 'song_detail';
    }
    if (currentTab && SCREEN_MANUALS[currentTab]) {
      return currentTab;
    }
    return 'home';
  }, [currentSong, currentTab]);

  const currentScreenData = SCREEN_MANUALS[currentScreenKey] || SCREEN_MANUALS['home'];

  const currentScreenTitle = useMemo(() => {
    if (currentSong && currentTab === 'songs') {
      return `Cifra: ${currentSong.title || 'Música'}`;
    }
    return currentScreenData.screenName;
  }, [currentSong, currentTab, currentScreenData]);

  const handleOpenScreenManual = (screenKey?: string) => {
    const targetKey = screenKey || currentScreenKey;
    setInteractiveManualKey(targetKey);
    setIsInteractiveManualOpen(true);
  };

  const handleAskHowToUseThisScreen = (screenKey?: string) => {
    const targetKey = screenKey || currentScreenKey;
    const targetData = SCREEN_MANUALS[targetKey] || SCREEN_MANUALS['home'];
    
    addMessage({
      id: getUniqueAssistantMsgId('user'),
      sender: 'user',
      text: `Como usar esta tela? (${targetData.screenName})`,
      timestamp: new Date()
    });

    const stepsList = targetData.steps.map(s => `• **${s.title}**: ${s.description}`).join('\n');
    const replyText = `Aqui está o guia de **${targetData.screenName}**:\n\n${targetData.tagline}\n\n${stepsList}\n\n💡 *Dica de ouro:* ${targetData.proTips[0] || 'Aproveite os recursos práticos integrados no LiLouPro!'}`;
    const speakText = `Abrindo o manual interativo de ${targetData.screenName}!`;

    addMessage({
      id: getUniqueAssistantMsgId('assistant'),
      sender: 'assistant',
      text: replyText,
      timestamp: new Date(),
      actionLabel: `📖 Abrir Manual Interativo: ${targetData.screenName}`,
      actionIcon: <BookOpen size={15} />,
      actionSuccessMessage: `✓ Manual interativo aberto!`,
      onActionClick: () => {
        handleOpenScreenManual(targetKey);
      }
    });

    speak(speakText);
    handleOpenScreenManual(targetKey);
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Oi! Pode falar 🎙️\nO que você precisa agora no LiLouPro?',
      timestamp: new Date(),
      steps: [
        'Diga "Oi Lilou" ou "Ok Lilou" para chamar por voz a qualquer momento',
        'Diga ex: "Abre o afinador"',
        'Diga ex: "Abre o metrônomo"',
        'Diga ex: "Tocar playlist do culto"',
        'Diga ex: "Abre a cifra de [música]"',
        'Diga ex: "Abre a Bíblia no Salmo 23"'
      ]
    }
  ]);

  // Wake Word ("Oi Lilou" / "Ok Lilou") State & Refs
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('liloupro_assistant_wakeword') === 'true';
    } catch {
      return false;
    }
  });
  const [isWakeWordActive, setIsWakeWordActive] = useState<boolean>(false);

  const wakeWordRecognitionRef = useRef<any>(null);
  const wakeWordRestartTimeoutRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(isListening);
  const wakeWordEnabledRef = useRef<boolean>(wakeWordEnabled);
  const isOpenRef = useRef<boolean>(isOpen);
  const isHandlingWakeRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const isManualMicSessionActiveRef = useRef<boolean>(false);
  const pendingActionRef = useRef<{ 
    type: 'confirm_add_song' | 'disambiguate_song_bible'; 
    songTitle?: string;
    pendingSong?: any;
    pendingBible?: { bookName: string; chapter: number; verse?: number; displayText: string };
  } | null>(null);
  const startListeningRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    wakeWordEnabledRef.current = wakeWordEnabled;
  }, [wakeWordEnabled]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestInterimRef = useRef<string>('');
  const wakeWordDebounceTimeoutRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const turnOffAllListeningRef = useRef<(() => void) | null>(null);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isListening, interimTranscript]);

  // Audio player ref for high-fidelity Gemini TTS male voice (Voz Oficial Puck)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsClientCacheRef = useRef<Map<string, string>>(new Map());

  /**
   * Função oficial de reprodução vocal do LiLou.
   * Utiliza exclusivamente o motor Gemini TTS com a voz de estúdio 'Puck'.
   * 
   * REGRA DE BLINDAGEM: window.speechSynthesis NUNCA deve ser utilizado como fallback.
   * Se o serviço de TTS estiver temporariamente indisponível, a voz robótica do navegador
   * não deve substituir silenciosamente a voz oficial.
   */
  const speak = useCallback((textToSpeak: string, onEnded?: () => void) => {
    const finishSpeechAndResume = () => {
      isSpeakingRef.current = false;
      if (onEnded) {
        onEnded();
      } else if (isManualMicSessionActiveRef.current) {
        setTimeout(() => {
          if (isManualMicSessionActiveRef.current && !isSpeakingRef.current && !isListeningRef.current) {
            startListeningRef.current?.();
          }
        }, 120);
      }
    };

    if (!speechSynthesisEnabled || typeof window === 'undefined') {
      finishSpeechAndResume();
      return;
    }

    // Cancela qualquer reprodução em andamento imediatamente
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch {}
      currentAudioRef.current = null;
    }

    // Garante que o sintetizador nativo do navegador não interfira
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    // Limpa tags e markdown para uma pronúncia limpa e natural
    const clean = textToSpeak
      .replace(/\*\*/g, '')
      .replace(/[#_*~`]/g, '')
      .replace(/🎙️|🎵|📖|🗓️|➕|📺|✓/g, '')
      .trim();
    if (!clean) {
      finishSpeechAndResume();
      return;
    }

    // Marca o estado de fala como true de forma síncrona imediata antes do fetch da rede,
    // eliminando a janela cega contra ativações indevidas de SpeechRecognition
    isSpeakingRef.current = true;

    const attachAndPlay = (audio: HTMLAudioElement) => {
      currentAudioRef.current = audio;
      isSpeakingRef.current = true;
      audio.onended = () => {
        finishSpeechAndResume();
      };
      audio.play().catch((err) => {
        console.warn("[LiLou Voice]: Reprodução de áudio:", err);
        finishSpeechAndResume();
      });
    };

    const cacheKey = clean.toLowerCase();
    const cached = ttsClientCacheRef.current.get(cacheKey);
    if (cached) {
      try {
        const audio = new Audio(`data:${LILOU_OFFICIAL_VOICE_CONFIG.mimeType};base64,${cached}`);
        attachAndPlay(audio);
        return;
      } catch (err) {
        console.warn("[LiLou Voice]: Falha ao instanciar áudio cache:", err);
        finishSpeechAndResume();
        return;
      }
    }

    // Requisita a síntese de estúdio oficial Puck no Gemini TTS
    fetch('/api/assistant/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`TTS server error: ${res.status}`);
        const data = await res.json();
        if (data?.audioBase64) {
          ttsClientCacheRef.current.set(cacheKey, data.audioBase64);
          const audio = new Audio(`data:${LILOU_OFFICIAL_VOICE_CONFIG.mimeType};base64,${data.audioBase64}`);
          attachAndPlay(audio);
        } else {
          finishSpeechAndResume();
        }
      })
      .catch((err) => {
        // REGRA DE BLINDAGEM: window.speechSynthesis NUNCA assume como fallback.
        // Preserva a identidade vocal sem ruído mecânico ou robótico.
        console.warn("[LiLou Voice]: Síntese temporariamente indisponível. Fallback robótico estritamente bloqueado:", err);
        finishSpeechAndResume();
      });
  }, [speechSynthesisEnabled]);

  const toggleSpeechSynthesis = () => {
    setSpeechSynthesisEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('liloupro_assistant_tts', String(next));
      } catch {}
      if (!next) {
        if (currentAudioRef.current) {
          try {
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
          } catch {}
          currentAudioRef.current = null;
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      }
      return next;
    });
  };

  // Initialize Speech Recognition
  const startListening = () => {
    if (typeof window === 'undefined') return;
    if (isSpeakingRef.current) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: 'Seu navegador atual não suporta o reconhecimento de voz nativo. Mas você pode digitar sua pergunta ou comando abaixo normalmente!',
        timestamp: new Date()
      });
      inputRef.current?.focus();
      return;
    }

    // Marca imediatamente o estado síncrono para impedir qualquer corrida de wake word
    setIsListening(true);
    isListeningRef.current = true;

    // Cancela qualquer timer de reinício de wake word pendente
    if (wakeWordRestartTimeoutRef.current) {
      clearTimeout(wakeWordRestartTimeoutRef.current);
      wakeWordRestartTimeoutRef.current = null;
    }

    // Interromper com segurança a escuta por wake word removendo handlers primeiro para evitar novo ciclo
    if (wakeWordRecognitionRef.current) {
      try {
        wakeWordRecognitionRef.current.onend = null;
        wakeWordRecognitionRef.current.onerror = null;
        wakeWordRecognitionRef.current.abort();
      } catch {}
      wakeWordRecognitionRef.current = null;
      setIsWakeWordActive(false);
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setInterimTranscript('');
        latestInterimRef.current = '';

        // Se o usuário não falar nada por 6.5 segundos, desliga o microfone automaticamente
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          if (!latestInterimRef.current || !latestInterimRef.current.trim()) {
            turnOffAllListeningRef.current?.();
          }
        }, 6500);
      };

      recognition.onresult = (event: any) => {
        // Se houver áudio do assistente ainda tocando no momento em que a fala do usuário é detectada,
        // interrompe o áudio imediatamente para priorizar a voz do usuário e evitar que o microfone capture o som do alto-falante.
        // Nunca descarta a transcrição do usuário por causa de referências residuais de áudio.
        if (currentAudioRef.current) {
          const audio = currentAudioRef.current;
          if (!audio.paused && !audio.ended && audio.currentTime > 0 && audio.currentTime < (audio.duration || Infinity)) {
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch {}
          }
          currentAudioRef.current = null;
        }

        if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
          try {
            window.speechSynthesis.cancel();
          } catch {}
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          latestInterimRef.current = interim;
          setInterimTranscript(interim);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('liloupro:voice-sound-detected', { detail: { soundDetected: true } }));
          }
          // Reinicia o timer de silêncio para dar tempo de terminar o comando
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
            if (!latestInterimRef.current || !latestInterimRef.current.trim()) {
              turnOffAllListeningRef.current?.();
            }
          }, 4500);
        }

        if (final) {
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
          latestInterimRef.current = '';
          setInterimTranscript(final);
          stopListening();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('liloupro:voice-command-captured', { detail: { command: final } }));
          }
          handleProcessInput(final);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        isListeningRef.current = false;
        setInterimTranscript('');
        latestInterimRef.current = '';
        turnOffAllListeningRef.current?.();

        // Se o erro for de microfone (comum em iframes de preview ou navegadores sem permissão),
        // abre o painel do assistente para oferecer botões rápidos e campo de texto direto
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
          setIsOpen(true);
          setIsRetracted(false);
          addMessage({
            id: getUniqueAssistantMsgId('assistant'),
            sender: 'assistant',
            text: '🎙️ **Microfone não acessível nesta janela (comum em telas de preview/iframe)**.\n\nVocê pode tocar em qualquer um dos **botões de atalho rápido abaixo** (🎯 Afinador, ⏱️ Metrônomo, 👥 Escalas, 📖 Bíblia, 🗓️ Liturgia) ou digitar qualquer comando no campo de texto para executar tudo perfeitamente!',
            timestamp: new Date()
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
        recognitionRef.current = null;
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        if (latestInterimRef.current && latestInterimRef.current.trim()) {
          const textToProcess = latestInterimRef.current.trim();
          latestInterimRef.current = '';
          setInterimTranscript('');
          handleProcessInput(textToProcess);
        } else {
          // Usuário não falou nada no comando: se wake word estiver habilitado, volta para escuta de wake word sem loop
          if (wakeWordEnabledRef.current) {
            setIsListening(false);
            isListeningRef.current = false;
          } else {
            turnOffAllListeningRef.current?.();
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Speech recognition start failed:", e);
      setIsListening(false);
    }
  };

  startListeningRef.current = startListening;

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const addMessage = (msg: Message) => {
    setMessages(prev => {
      const isDuplicateId = !msg.id || prev.some(m => m.id === msg.id);
      const safeId = isDuplicateId ? getUniqueAssistantMsgId(msg.sender) : msg.id;
      return [...prev, { ...msg, id: safeId }];
    });
  };

  // Helper to normalize strings for comparison
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Process user input (from speech or text)
  const handleProcessInput = async (rawInput: string) => {
    const text = rawInput.trim();
    if (!text) return;

    // Add user message to conversation
    addMessage({
      id: getUniqueAssistantMsgId('user'),
      sender: 'user',
      text: text,
      timestamp: new Date()
    });

    setInputText('');
    setInterimTranscript('');
    setIsLoading(true);

    let norm = normalize(text);
    // Se a mensagem contém o gatilho "Oi Lilou" / "Ok Lilou" / "E aí Lilou" seguido de um comando na mesma fala,
    // extrai o comando para processamento direto
    const wakeCheck = checkLilouWakeWord(text);
    if (wakeCheck.detected && wakeCheck.commandAfter) {
      norm = normalize(wakeCheck.commandAfter);
    }

    // Normaliza variações fonéticas comuns de transcrição de voz em português
    norm = norm
      .replace(/\babril\b/g, 'abrir')
      .replace(/\babri\b/g, 'abrir')
      .replace(/\babriu\b/g, 'abrir')
      .replace(/\btoqua\b/g, 'toca')
      .replace(/\btoqui\b/g, 'toque');

    // Remove prefixos de saudação ou nomes do assistente que acompanham o comando (ex: "e aí lilou abre o afinador", "liloupro toca Raridade")
    const strippedCommand = norm
      .replace(/^(?:oi|oie|ola|ok|okay|oq|oque|ei|hey|heey|fala|opa|alo|alou|e\s+ai|eai|eaí|iai|iae|ou|ae|eae)\s+(?:liloupro|lilou\s+pro|lilopro|lilou|li\s+lou|lioi|liou|lio|lilo|lilu|lillou|lelou|leilou|lili|milou|lulu|lou)\s+/i, '')
      .replace(/^(?:liloupro|lilou\s+pro|lilopro|lilou|li\s+lou|lioi|liou|lio|lilo|lilu|lillou|lelou|leilou|lili|milou|lulu|lou)\s+/i, '')
      .replace(/^(?:por\s+favor|faz\s+favor|por\s+gentileza|gentileza|poderia|pode|da\s+pra|voce\s+pode|favor|quero|queria|gostaria\s+de)\s+/i, '')
      .replace(/\s+(?:por\s+favor|obrigado|valeu|brigado)$/i, '')
      .trim();

    if (strippedCommand && strippedCommand.length >= 2) {
      norm = strippedCommand;
    }

    // Versão limpa sem pontuações para análise robusta de intenções
    const cleanNorm = norm.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ').replace(/\s+/g, ' ').trim();

    // ==========================================
    // 00. RESPOSTA A PERGUNTA PENDENTE / CONVERSAÇÃO CONTÍNUA (ex: "Você quer cadastrar?")
    // ==========================================
    if (pendingActionRef.current?.type === 'confirm_add_song') {
      const fullNorm = normalize(text);
      const isNo = (
        norm.includes('nao') ||
        norm.includes('deixa') ||
        norm.includes('cancela') ||
        norm.includes('cancelar') ||
        norm.includes('precisa') ||
        fullNorm.includes('nao') ||
        norm === 'n'
      );
      const isYes = (
        norm.includes('sim') ||
        norm.includes('quero') ||
        norm.includes('cadastr') ||
        norm.includes('pode') ||
        norm.includes('bora') ||
        norm.includes('com certeza') ||
        norm.includes('positivo') ||
        norm.includes('claro') ||
        fullNorm.includes('sim') ||
        fullNorm.includes('quero') ||
        fullNorm.includes('cadastr') ||
        norm === 's'
      );

      if (isNo) {
        pendingActionRef.current = null;
        setIsLoading(false);
        const replyText = 'Tudo bem! Se precisar de outra música ou cifra, é só me chamar.';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date()
        });
        speak(replyText);
        return;
      } else if (isYes) {
        pendingActionRef.current = null;
        setIsLoading(false);
        const replyText = 'Beleza! Abrindo a tela para você cadastrar a música.';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '➕ Cadastrar Nova Música',
          actionIcon: <Plus size={15} />,
          actionSuccessMessage: '✓ Aberto!',
          onActionClick: () => {
            onOpenAddSong();
            setIsOpen(false);
          }
        });
        speak(replyText);
        setTimeout(() => {
          onOpenAddSong();
          setIsOpen(false);
        }, 1000);
        return;
      } else {
        // Se o usuário falou outro comando (ex: "Abre o afinador"), limpa a pergunta pendente e prossegue normalmente
        pendingActionRef.current = null;
      }
    }

    if (pendingActionRef.current?.type === 'disambiguate_song_bible') {
      const { pendingSong, pendingBible } = pendingActionRef.current;
      const isMusicChoice = (
        norm.includes('musica') ||
        norm.includes('cifra') ||
        norm.includes('louvor') ||
        norm.includes('cancao') ||
        norm.includes('tocar') ||
        norm.includes('ouvir')
      );
      const isBibleChoice = (
        norm.includes('biblia') ||
        norm.includes('capitulo') ||
        norm.includes('passagem') ||
        norm.includes('livro') ||
        norm.includes('ler')
      );

      if (isMusicChoice && pendingSong) {
        pendingActionRef.current = null;
        setIsLoading(false);
        const replyText = `Abrindo a música **"${pendingSong.title}"**.`;
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: `🎵 Abrir ${pendingSong.title}`,
          actionIcon: <Music size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onOpenSong(pendingSong);
            setIsOpen(false);
          }
        });
        speak(`Abrindo a música ${pendingSong.title}.`);
        setTimeout(() => {
          onOpenSong(pendingSong);
          setIsOpen(false);
        }, 900);
        return;
      } else if (isBibleChoice && pendingBible) {
        pendingActionRef.current = null;
        setIsLoading(false);
        const { bookName, chapter, verse, displayText } = pendingBible;
        const replyText = `Abrindo a Bíblia em **${displayText}**.`;
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: `📖 Abrir ${displayText}`,
          actionIcon: <BookOpen size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onOpenBible(bookName, chapter, verse);
            setIsOpen(false);
          }
        });
        speak(`Abrindo a Bíblia em ${displayText}.`);
        setTimeout(() => {
          onOpenBible(bookName, chapter, verse);
          setIsOpen(false);
        }, 900);
        return;
      } else {
        pendingActionRef.current = null;
      }
    }

    // ==========================================
    // 00. INTENT: SAUDAÇÃO & WAKE RESPONSE ("Oi Lilou", "Ok Lilou", "Oi Lioi", "Olá", "Oi")
    // ==========================================
    const isGreetingIntent = (
      norm === 'oi lilou' ||
      norm === 'ok lilou' ||
      norm === 'e ai lilou' ||
      norm === 'eai lilou' ||
      norm === 'ola lilou' ||
      norm === 'ei lilou' ||
      norm === 'lilou' ||
      norm === 'liloupro' ||
      norm === 'lioi' ||
      norm === 'oi liou' ||
      norm === 'ok liou' ||
      norm === 'oi lilu' ||
      norm === 'ok lilu' ||
      norm === 'oi lilo' ||
      norm === 'ok lilo' ||
      norm === 'oi' ||
      norm === 'ola' ||
      norm === 'bom dia' ||
      norm === 'boa tarde' ||
      norm === 'boa noite' ||
      norm === 'fala lilou' ||
      norm === 'opa lilou' ||
      norm === 'tudo bem' ||
      norm === 'oi tudo bem' ||
      (wakeCheck.detected && !wakeCheck.commandAfter)
    );

    if (isGreetingIntent) {
      setIsLoading(false);
      const greetingSpoken = getRandomGreeting();
      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: `🎙️ **${greetingSpoken}**`,
        timestamp: new Date(),
        steps: [
          'Diga: "Abre o afinador"',
          'Diga: "Abre o metrônomo"',
          'Diga: "Abre a cifra de [música]"',
          'Diga: "Tocar playlist do culto"',
          'Diga: "Abre a Bíblia no Salmo 23"'
        ]
      });
      speak(greetingSpoken, () => {
        startListening();
      });
      return;
    }

    // ==========================================
    // 00B. INTENT: AGRADECIMENTO AO ASSISTENTE ("Obrigado, Lilou", "Valeu, Lilou", "Muito obrigado")
    // ==========================================
    const isGratitudeIntent = (
      /^((muito\s+)?obrigad[oa]|valeu(\s+mesmo)?|brigad[oa]|gratidao|agradeco|agradecido)(\s+(lilou(pro)?|amigo|pela\s+ajuda|demais|viu))?$/i.test(cleanNorm) ||
      cleanNorm === 'obrigado' ||
      cleanNorm === 'obrigada' ||
      cleanNorm === 'muito obrigado' ||
      cleanNorm === 'muito obrigada' ||
      cleanNorm === 'valeu' ||
      cleanNorm === 'valeu mesmo' ||
      cleanNorm === 'valeu lilou' ||
      cleanNorm === 'obrigado lilou' ||
      cleanNorm === 'obrigada lilou' ||
      cleanNorm === 'obrigado pela ajuda' ||
      cleanNorm === 'obrigada pela ajuda' ||
      cleanNorm === 'valeu pela ajuda' ||
      cleanNorm === 'brigado' ||
      cleanNorm === 'brigada' ||
      cleanNorm === 'brigado lilou' ||
      cleanNorm === 'brigada lilou'
    );

    if (isGratitudeIntent) {
      setIsLoading(false);
      const GRATITUDE_RESPONSES = [
        "Por nada! Tô aqui pra ajudar.",
        "De nada! Sempre que precisar.",
        "Disponha! Tô por aqui.",
        "Imagina! Tô aqui pra ajudar.",
        "Por nada! Pode contar comigo."
      ];
      const randomResponse = GRATITUDE_RESPONSES[Math.floor(Math.random() * GRATITUDE_RESPONSES.length)];

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: `🤝 **${randomResponse}**`,
        timestamp: new Date()
      });

      speak(randomResponse);
      return;
    }

    // ==========================================
    // 0. INTENT: COMO USAR ESTA TELA / MANUAL INTERATIVO DA TELA
    // Ex: "Como usar esta tela?", "Como funciona esta tela?", "Manual desta tela", "Ajuda nesta tela"
    // ==========================================
    const isHowToUseScreen = (
      norm.includes('como usar esta tela') ||
      norm.includes('como usar essa tela') ||
      norm.includes('como funciona esta tela') ||
      norm.includes('como funciona essa tela') ||
      norm.includes('manual desta tela') ||
      norm.includes('manual dessa tela') ||
      norm.includes('manual da tela') ||
      norm.includes('ajuda desta tela') ||
      norm.includes('ajuda nessa tela') ||
      norm.includes('o que faz esta tela') ||
      norm.includes('como mexer nesta tela') ||
      norm.includes('como mexer nessa tela') ||
      norm.includes('manual interativo') ||
      norm.includes('guia da tela') ||
      norm.includes('guia desta tela') ||
      norm === 'como usar' ||
      norm === 'manual' ||
      norm === 'ajuda'
    );

    if (isHowToUseScreen) {
      setIsLoading(false);
      handleAskHowToUseThisScreen();
      return;
    }

    // ==========================================
    // 0A. INTENT: TOCAR PRÓXIMA MÚSICA / PRÓXIMO LOUVOR
    // Ex: "tocar próxima música", "próxima música", "tocar próximo louvor", "próximo louvor", "pular música"
    // ==========================================
    const isNextSongCommand = (
      norm.includes('proxima musica') ||
      norm.includes('proximo louvor') ||
      norm.includes('tocar proxima') ||
      norm.includes('tocar o proximo') ||
      norm.includes('proxima do culto') ||
      norm.includes('proxima da lista') ||
      norm.includes('pular musica') ||
      norm.includes('passar musica')
    );

    if (isNextSongCommand) {
      setIsLoading(false);
      const serviceSongs = targetService ? getServiceSongs(targetService, allSongs) : [];
      
      if (serviceSongs.length === 0) {
        const replyText = 'Ainda não temos músicas cadastradas no culto de hoje.';
        const speakText = 'Ainda não tem músicas no culto de hoje.';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '🗓️ Abrir Liturgia',
          onActionClick: () => {
            onNavigate('liturgy');
            setIsOpen(false);
          }
        });
        speak(speakText);
        return;
      }

      // Encontra a próxima música em relação à atual ou a primeira
      let nextSong = serviceSongs[0];
      if (currentSong) {
        const currentIndex = serviceSongs.findIndex(s => s.id === currentSong.id);
        if (currentIndex >= 0 && currentIndex + 1 < serviceSongs.length) {
          nextSong = serviceSongs[currentIndex + 1];
        }
      }

      const replyText = `Tocando **"${nextSong.title}"** ${nextSong.artist ? `(${nextSong.artist})` : ''}.`;
      const speakText = `Beleza, vou abrir ${nextSong.title}.`;

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: `▶️ Ouvir "${nextSong.title}"`,
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onOpenSong(nextSong, { showPlayer: true });
          setIsOpen(false);
        }
      });
      speak(speakText);

      setTimeout(() => {
        onOpenSong(nextSong, { showPlayer: true });
        setIsOpen(false);
      }, 900);
      return;
    }

    // ==========================================
    // 0B. INTENT: QUANTOS MEMBROS NA ESCALA DE HOJE?
    // Ex: "quantos membros na escala de hoje?", "quem está escalado hoje?", "escala de hoje", "voluntários de hoje"
    // ==========================================
    const isScaleTodayCommand = (
      (norm.includes('quantos membros') || norm.includes('quem esta') || norm.includes('quem tá') || norm.includes('quantas pessoas') || norm.includes('qual a escala') || norm.includes('ver escala') || norm.includes('mostrar escala') || norm.includes('membros na escala')) &&
      (norm.includes('hoje') || norm.includes('de hoje') || norm.includes('proximo culto') || norm.includes('deste culto') || norm.includes('do culto'))
    ) || norm === 'quantos membros na escala de hoje' || norm === 'escala de hoje';

    if (isScaleTodayCommand) {
      setIsLoading(false);
      if (!targetService) {
        const replyText = 'Não encontrei nenhum culto agendado para hoje. Quer ver as **Escalas**?';
        const speakText = 'Não achei culto pra hoje.';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '👥 Ver Escalas',
          onActionClick: () => {
            onNavigate('calendar');
            setIsOpen(false);
          }
        });
        speak(speakText);
        return;
      }

      const scales = targetService.scales || {};
      const uniqueMemberIds = new Set();
      const rolesSummary = [];

      Object.entries(scales).forEach(([role, ids]) => {
        if (Array.isArray(ids)) {
          ids.forEach(id => {
            if (id && typeof id === 'string') uniqueMemberIds.add(id);
          });
          if (ids.length > 0) rolesSummary.push(`${role}: ${ids.length}`);
        } else if (ids && typeof ids === 'string') {
          uniqueMemberIds.add(ids);
          rolesSummary.push(`${role}: 1`);
        }
      });

      const memberCount = uniqueMemberIds.size;
      const serviceTitle = targetService.title || 'Culto';

      let replyText = '';
      let speakText = '';

      if (memberCount > 0) {
        replyText = `Hoje no **${serviceTitle}**, temos **${memberCount} pessoa(s) na escala**:\n${rolesSummary.length > 0 ? `\n• ${rolesSummary.slice(0, 5).join('\n• ')}` : ''}`;
        speakText = `Hoje temos ${memberCount} ${memberCount === 1 ? 'pessoa' : 'pessoas'} na escala.`;
      } else {
        replyText = `O culto **${serviceTitle}** ainda está sem membros escalados.`;
        speakText = 'Esse culto ainda está sem escala.';
      }

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '👥 Abrir Escala Completa',
        onActionClick: () => {
          onNavigate('calendar');
          setIsOpen(false);
        }
      });
      speak(speakText);
      return;
    }

    // ==========================================
    // 0C. INTENT: ABRIR CIFRA DO PRÓXIMO LOUVOR / PRÓXIMA CIFRA
    // Ex: "abrir cifra do próximo louvor", "cifra do próximo louvor", "abrir cifra da próxima música", "ver próxima cifra"
    // ==========================================
    const isNextChordsCommand = (
      (norm.includes('cifra') || norm.includes('tom') || norm.includes('acordes')) &&
      (norm.includes('proximo louvor') || norm.includes('proxima musica') || norm.includes('proxima') || norm.includes('da liturgia') || norm.includes('do culto'))
    ) || norm === 'abrir cifra do proximo louvor';

    if (isNextChordsCommand) {
      setIsLoading(false);
      const serviceSongs = targetService ? getServiceSongs(targetService, allSongs) : [];

      if (serviceSongs.length === 0) {
        const replyText = 'A liturgia de hoje ainda não tem músicas cadastradas.';
        const speakText = 'A liturgia de hoje ainda não tem músicas cadastradas.';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '🗓️ Abrir Liturgia',
          onActionClick: () => {
            onNavigate('liturgy');
            setIsOpen(false);
          }
        });
        speak(speakText);
        return;
      }

      // Encontra a próxima música em relação à atual ou a primeira
      let nextSong = serviceSongs[0];
      if (currentSong) {
        const currentIndex = serviceSongs.findIndex(s => s.id === currentSong.id);
        if (currentIndex >= 0 && currentIndex + 1 < serviceSongs.length) {
          nextSong = serviceSongs[currentIndex + 1];
        }
      }

      const songTone = nextSong.key ? `no tom **${nextSong.key}**` : '';
      const replyText = `Abrindo a cifra de **"${nextSong.title}"** ${songTone}.`;
      const speakText = `Claro, vou abrir ${nextSong.title}.`;

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: `🎼 Ver Cifra de "${nextSong.title}"`,
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onOpenSong(nextSong);
          setIsOpen(false);
        }
      });
      speak(speakText);

      setTimeout(() => {
        onOpenSong(nextSong);
        setIsOpen(false);
      }, 900);
      return;
    }

    // ==========================================
    // 1. INTENT: TOCAR PLAYLIST DO CULTO (Tocar músicas na ordem)
    // Ex: "Tocar playlist do culto", "toque a playlist do culto", "tocar musicas do culto", "ouvir playlist do culto", "tocar playlist"
    // ==========================================
    const isPlayPlaylistCommand = (
      (
        (norm.includes('tocar') || norm.includes('toque') || norm.includes('toca') || norm.includes('ouvir') || norm.includes('ouca') || norm.includes('ouça') || norm.includes('reproduzir') || norm.includes('soltar') || norm.includes('solte') || norm.includes('play') || norm.startsWith('dar play')) &&
        (
          norm.includes('playlist do culto') ||
          norm.includes('playlist de culto') ||
          norm.includes('playlist culto') ||
          norm.includes('musicas do culto') ||
          norm.includes('musica do culto') ||
          norm.includes('louvores do culto') ||
          norm.includes('ordem do culto') ||
          (norm.includes('playlist') && (norm.includes('culto') || norm.includes('hoje') || norm.includes('domingo') || norm.includes('celebracao') || norm.includes('liturgia')))
        )
      ) ||
      norm === 'tocar playlist do culto' ||
      norm === 'tocar a playlist do culto' ||
      norm === 'tocar playlist' ||
      norm === 'playlist do culto' ||
      norm === 'ouvir playlist do culto' ||
      norm === 'tocar as musicas do culto' ||
      norm === 'tocar musicas do culto'
    );

    if (isPlayPlaylistCommand) {
      setIsLoading(false);

      if (!targetService) {
        const replyText = 'Não encontrei nenhum culto agendado no momento para tocar a playlist. Você pode criar ou agendar um culto na aba **Escalas**!';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '🗓️ Abrir Escalas',
          actionIcon: <Calendar size={15} />,
          onActionClick: () => {
            onNavigate('calendar');
            setIsOpen(false);
          }
        });
        speak('Não encontrei nenhum culto agendado no momento.');
        return;
      }

      const playlistSongs = getServicePlaylistSongs(targetService, allSongs);

      if (!playlistSongs || playlistSongs.length === 0) {
        const allLiturgySongs = getServiceSongs(targetService, allSongs);
        const replyText = allLiturgySongs.length > 0
          ? `O culto **${targetService.title}** possui ${allLiturgySongs.length} música(s) na liturgia, mas nenhuma possui link do YouTube cadastrado para reprodução. Cadastre os links do YouTube nas músicas para liberar a playlist do culto!`
          : `O culto **${targetService.title}** ainda não possui músicas vinculadas à liturgia. Acesse a aba **Liturgia** ou **Músicas** para adicionar as músicas do culto.`;

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '🎵 Ver Músicas do Culto',
          actionIcon: <Music size={15} />,
          onActionClick: () => {
            onNavigate('songs');
            setIsOpen(false);
          }
        });

        speak(allLiturgySongs.length > 0
          ? 'As músicas do culto ainda não têm áudio cadastrado.'
          : 'Não há músicas na liturgia deste culto.');
        return;
      }

      // Tocar a playlist do culto na ordem
      onStartPlaylist?.(playlistSongs);

      const songsListText = playlistSongs
        .map((s, idx) => `**${idx + 1}.** ${s.title}${s.artist ? ` — *${s.artist}*` : ''}`)
        .join('\n');

      const replyText = `Iniciando a playlist do culto **${targetService.title}** (${playlistSongs.length} músicas):\n\n${songsListText}`;
      const speakText = 'Beleza, vou abrir a playlist.';

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: `▶️ Tocar Playlist (${playlistSongs.length} músicas)`,
        actionIcon: <Play size={15} />,
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onStartPlaylist?.(playlistSongs);
        }
      });

      speak(speakText);
      return;
    }

    // ==========================================
    // 2. INTENT: BAIXAR MÚSICAS DO CULTO (Baixar o PDF com todas as cifras do culto)
    // Ex: "Baixar músicas do culto", "baixar cifras do culto", "baixar pdf do culto", "baixar as cifras do culto"
    // ==========================================
    const isDownloadCultoSongs = (
      (
        (norm.includes('baixar') || norm.includes('baixa') || norm.includes('baixe') || norm.includes('fazer download') || norm.includes('download') || norm.includes('gerar') || norm.includes('exportar') || norm.includes('salvar') || norm.includes('imprimir')) &&
        (
          norm.includes('musicas do culto') ||
          norm.includes('musica do culto') ||
          norm.includes('cifras do culto') ||
          norm.includes('cifra do culto') ||
          norm.includes('pdf do culto') ||
          norm.includes('pdf de cifras') ||
          norm.includes('pdf das cifras') ||
          norm.includes('pdf das musicas') ||
          norm.includes('pdf com todas as cifras') ||
          norm.includes('todas as cifras do culto') ||
          (norm.includes('cifras') && (norm.includes('culto') || norm.includes('liturgia'))) ||
          (norm.includes('musicas') && (norm.includes('culto') || norm.includes('liturgia')) && (norm.includes('pdf') || norm.includes('cifra') || norm.includes('baixar')))
        )
      ) ||
      norm === 'baixar musicas do culto' ||
      norm === 'baixar músicas do culto' ||
      norm === 'baixar cifras do culto' ||
      norm === 'baixar cifra do culto' ||
      norm === 'baixar pdf do culto' ||
      norm === 'pdf do culto' ||
      norm === 'cifras do culto'
    );

    if (isDownloadCultoSongs) {
      setIsLoading(false);

      if (!targetService) {
        const replyText = 'Não encontrei nenhum culto agendado no momento para baixar as cifras. Crie ou agende um culto na aba **Escalas**!';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '🗓️ Abrir Escalas',
          actionIcon: <Calendar size={15} />,
          onActionClick: () => {
            onNavigate('calendar');
            setIsOpen(false);
          }
        });
        speak('Não encontrei nenhum culto agendado no momento.');
        return;
      }

      // Executa o download das cifras do culto em PDF
      try {
        if (onDownloadCifrasCulto) {
          onDownloadCifrasCulto(targetService);
        } else {
          downloadCifrasCultoPDF(targetService, { allSongs });
        }
      } catch (err) {
        console.error('Erro ao baixar cifras do culto via assistente:', err);
      }

      const replyText = `Gerando o PDF com as cifras do culto **${targetService.title}**.`;
      const speakText = 'Pode deixar, gerando o PDF.';

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '📄 Baixar Cifras do Culto (PDF)',
        actionIcon: <FileText size={15} />,
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          if (onDownloadCifrasCulto) {
            onDownloadCifrasCulto(targetService);
          } else {
            downloadCifrasCultoPDF(targetService, { allSongs });
          }
        }
      });

      speak(speakText);
      return;
    }

    // ==========================================
    // 3. INTENT: ABRIR BÍBLIA (Passagem específica ou leitor geral)
    // Ex: "abra a bíblia em Marcos 12:20", "abra a bíblia", "salmo 23", "abrir bíblia"
    // ==========================================
    // Identificação de intenção explicitamente musical (tem prioridade absoluta sobre referências bíblicas)
    const hasExplicitMusicIntent = (
      /\b(toca|tocar|toque|toquem|reproduz|reproduza|reproduzir|dar\s+play|play|ouvir|solta|soltar)\b/i.test(cleanNorm) ||
      /\b(cifra|cifras|acordes?|tablatura|letra\s+da\s+musica|letra\s+de|letra|player|video\s+clip|cancao|louvor)\b/i.test(cleanNorm) ||
      /\b(abra|abrir|abre|mostra|mostrar|mostre|ver|veja)\s+(a\s+|o\s+)?(cifra|letra|musica|cancao|louvor|faixa|player)\b/i.test(cleanNorm) ||
      /\bquero\s+(a\s+|o\s+)?(cifra|letra|musica|ouvir|tocar)\b/i.test(cleanNorm)
    );

    // Identificação de intenção explicitamente bíblica
    const hasExplicitBibleIntent = (
      /\b(na\s+biblia|pela\s+biblia|na\s+escritura|nas\s+escrituras)\b/i.test(cleanNorm) ||
      /\b(ler|leia|leiam|leitura|versiculo|capitulo)\b/i.test(cleanNorm) ||
      /\b(biblia\s+sagrada|livro\s+de|evangelho\s+segundo|evangelho\s+de|epistola|carta\s+aos)\b/i.test(cleanNorm) ||
      /\b(abra|abrir|abre)\s+(a\s+)?(biblia|escritura|palavra)\b/i.test(cleanNorm)
    );

    // Se o comando tiver intenção claramente musical, NÃO consome como Bíblia (prioridade musical)
    const parsedBible = !hasExplicitMusicIntent ? parseSpokenBibleCommand(text) : null;
    const isGeneralBible = !hasExplicitMusicIntent && !parsedBible && (
      isGeneralBibleRequest(text) ||
      ((cleanNorm.startsWith('abra') || cleanNorm.startsWith('abrir') || cleanNorm.startsWith('abre')) && (cleanNorm.includes('biblia') || cleanNorm.includes('escritura')))
    );

    if (parsedBible || isGeneralBible) {
      if (parsedBible) {
        // Se NÃO há intenção bíblica explícita (ex: o usuário disse apenas "Abre Isaías 53"):
        // Verifica se existe ambiguidade real (uma música com esse título no repertório)
        if (!hasExplicitBibleIntent) {
          const candidateTitle = cleanNorm
            .replace(/^(abra|abrir|abre|ver|veja|mostra|mostrar|mostre)\s+/i, '')
            .trim();

          const matchingSong = allSongs.find(s => {
            const t = normalize(s.title || '');
            return t === candidateTitle || t === normalize(parsedBible.displayText) || (candidateTitle.length >= 4 && t.startsWith(candidateTitle));
          }) || (findLocalPopularSong(candidateTitle, "") ? {
            id: `popular-${candidateTitle.replace(/\s+/g, '-')}`,
            title: candidateTitle.charAt(0).toUpperCase() + candidateTitle.slice(1)
          } : null);

          if (matchingSong) {
            // Ambiguidade real: existe tanto a música quanto a passagem bíblica
            setIsLoading(false);
            const replyText = 'Você quer a música ou o capítulo da Bíblia?';
            const speakText = 'Você quer a música ou o capítulo da Bíblia?';

            pendingActionRef.current = {
              type: 'disambiguate_song_bible',
              pendingSong: matchingSong,
              pendingBible: {
                bookName: parsedBible.bookName,
                chapter: parsedBible.chapter,
                verse: parsedBible.verse,
                displayText: parsedBible.displayText
              }
            };

            addMessage({
              id: getUniqueAssistantMsgId('assistant'),
              sender: 'assistant',
              text: replyText,
              timestamp: new Date(),
              actionLabel: `🎵 Música: ${matchingSong.title}`,
              actionIcon: <Music size={15} />,
              actionSuccessMessage: getRandomDone(),
              onActionClick: () => {
                pendingActionRef.current = null;
                onOpenSong(matchingSong);
                setIsOpen(false);
              },
              secondaryActionLabel: `📖 Bíblia: ${parsedBible.displayText}`,
              secondaryActionIcon: <BookOpen size={15} />,
              onSecondaryActionClick: () => {
                pendingActionRef.current = null;
                onOpenBible(parsedBible.bookName, parsedBible.chapter, parsedBible.verse);
                setIsOpen(false);
              }
            });

            speak(speakText, () => {
              startListening();
            });
            return;
          }
        }

        // Sem ambiguidade ou com intenção explicitamente bíblica: abre a Bíblia
        setIsLoading(false);
        const { bookName, chapter, verse, displayText } = parsedBible;
        const verseText = verse !== undefined ? `, versículo **${verse}**` : '';
        const speechVerse = verse !== undefined ? ` versículo ${verse}` : '';
        const replyText = `Abrindo a Bíblia em **${bookName} ${chapter}**${verseText}.`;
        const speakText = `Claro, abrindo ${bookName} ${chapter}${speechVerse}.`;

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: `📖 Abrir ${displayText}`,
          actionIcon: <BookOpen size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onOpenBible(bookName, chapter, verse);
            setIsOpen(false);
          }
        });

        speak(speakText);

        setTimeout(() => {
          onOpenBible(bookName, chapter, verse);
          setIsOpen(false);
        }, 1100);

        return;
      } else {
        setIsLoading(false);
        const replyText = 'Claro, abrindo a **Bíblia**.';
        const speakText = 'Claro.';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '📖 Acessar Bíblia',
          actionIcon: <BookOpen size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onNavigate('bible');
            setIsOpen(false);
          }
        });

        speak(speakText);

        setTimeout(() => {
          onNavigate('bible');
          setIsOpen(false);
        }, 1000);

        return;
      }
    }

    // ==========================================
    // 2. INTENT: AFINADOR CROMÁTICO (LiLouPro Tuner)
    // Ex: "Abra o afinador do app", "abra o afinador", "afinar violão", "afinador", "afinar", "quero afinar"
    // ==========================================
    if (
      norm.includes('afinador') ||
      norm.includes('afinar') ||
      norm.includes('afinacao') ||
      norm === 'afinador' ||
      norm === 'afinar'
    ) {
      setIsLoading(false);

      const isPurelyQuestion = (
        norm.startsWith('como funciona') ||
        norm.startsWith('o que e') ||
        norm.startsWith('onde fica') ||
        norm.startsWith('onde encontro')
      ) && !norm.includes('abra') && !norm.includes('abrir') && !norm.includes('abre') && !norm.includes('iniciar');

      if (isPurelyQuestion) {
        const replyText = 'O **Afinador Cromático (LiLouPro Tuner)** fica disponível na barra de ferramentas das cifras de qualquer música, e também pode ser aberto automaticamente pelo assistente:';
        const steps = [
          '1. Toque em qualquer música na aba **Músicas** para abrir a cifra.',
          '2. Na barra de ferramentas, toque no botão **"LiLouPro Tuner"** (ícone de frequência).',
          '3. Permita o microfone para afinação em tempo real com indicador de afinação, oitavas e desvio em cents.',
          '4. Suporta afinações: Cromático Livre, Violão Padrão (E A D G B E), Drop D, DADGAD e Contrabaixo!',
          '5. Você também pode abri-lo instantaneamente a qualquer momento dizendo: *"Abra o afinador do app"*.'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '🎯 Abrir Afinador Cromático',
          actionIcon: <Radio size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onOpenTuner?.();
            setIsOpen(false);
          }
        });

        speak('O afinador fica na barra da cifra ou toque no botão pra abrir.');
        return;
      } else {
        const replyText = 'Claro, já vou abrir o **Afinador**.';
        const speakText = 'Claro, já vou abrir.';

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '🎯 Abrir Afinador',
          actionIcon: <Radio size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            turnOffAllListening();
            onOpenTuner?.();
            setIsOpen(false);
          }
        });

        speak(speakText);

        setTimeout(() => {
          turnOffAllListening();
          onOpenTuner?.();
          setIsOpen(false);
        }, 1000);

        return;
      }
    }

    // ==========================================
    // 3. INTENT: METRÔNOMO INTERATIVO (Pedal de Ritmo / BPM)
    // Ex: "abra o metrônomo", "abrir metrônomo", "abra o metrônomo do app", "metrônomo"
    // ==========================================
    if (
      norm.includes('metronomo') ||
      norm.includes('pedal de ritmo') ||
      norm.includes('marcador de tempo') ||
      norm.includes('bpm') ||
      norm === 'metronomo' ||
      norm === 'ritmo' ||
      norm === 'bpm' ||
      (norm.includes('ritmo') && (norm.startsWith('abra') || norm.startsWith('abrir') || norm.startsWith('abre') || norm.includes('bota') || norm.includes('coloca') || norm.includes('iniciar')))
    ) {
      setIsLoading(false);

      const isPurelyQuestion = (
        norm.startsWith('como funciona') ||
        norm.startsWith('o que e') ||
        norm.startsWith('onde fica')
      ) && !norm.includes('abra') && !norm.includes('abrir') && !norm.includes('abre') && !norm.includes('iniciar');

      if (isPurelyQuestion) {
        const replyText = 'O **Metrônomo** fica na barra de ferramentas das cifras e também pode ser aberto a qualquer momento:';
        const steps = [
          '1. Toque em qualquer música para abrir a cifra.',
          '2. Na barra de ferramentas, toque no botão do **Metrônomo (BPM)**.',
          '3. Ajuste o andamento (BPM), fórmula de compasso (4/4, 3/4, 6/8, 2/4) e divisões rítmicas.',
          '4. Use o botão **Tap Tempo** para encontrar a velocidade batendo o dedo.',
          '5. Ou abra-o instantaneamente dizendo: *"Abra o metrônomo"*.'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '⏱️ Abrir Metrônomo',
          actionIcon: <Timer size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onOpenMetronome?.();
            setIsOpen(false);
          }
        });

        speak('O metrônomo fica nas cifras ou toque no botão pra abrir.');
        return;
      } else {
        const replyText = 'Pode deixar, abrindo o **Metrônomo**.';
        const speakText = 'Pode deixar.';

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '⏱️ Abrir Metrônomo',
          actionIcon: <Timer size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onOpenMetronome?.();
            setIsOpen(false);
          }
        });

        speak(speakText);

        setTimeout(() => {
          onOpenMetronome?.();
          setIsOpen(false);
        }, 1000);

        return;
      }
    }

    // ==========================================
    // 3B. INTENT: PRÓXIMO CULTO / DATA E HORÁRIO DO CULTO
    // Ex: "qual o próximo culto?", "quando é o próximo culto?", "próximo culto", "próximo agendamento"
    // ==========================================
    const isNextServiceIntent = (
      norm.includes('proximo culto') ||
      norm.includes('quando e o culto') ||
      norm.includes('quando e o proximo') ||
      norm.includes('qual o proximo culto') ||
      norm.includes('qual o culto') ||
      norm.includes('data do culto') ||
      norm.includes('horario do culto') ||
      norm.includes('proximo agendamento') ||
      norm === 'proximo culto' ||
      norm === 'culto'
    );

    if (isNextServiceIntent) {
      setIsLoading(false);
      if (!targetService) {
        const replyText = 'Não encontrei nenhum culto agendado no momento. Você pode criar um novo culto na aba **Escalas**!';
        const speakText = 'Não achei culto agendado pra hoje.';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '🗓️ Abrir Escalas',
          onActionClick: () => {
            onNavigate('calendar');
            setIsOpen(false);
          }
        });
        speak(speakText);
        return;
      }

      const serviceTitle = targetService.title || 'Culto';
      let dateString = '';
      if (targetService._actualDate && !isNaN(targetService._actualDate.getTime()) && targetService._actualDate.getTime() > 0) {
        dateString = targetService._actualDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
      } else if (targetService.date) {
        dateString = String(targetService.date);
      }
      const timeString = targetService.time ? ` às ${targetService.time}` : '';
      const replyText = `O próximo culto é **"${serviceTitle}"**${dateString ? ` agendado para **${dateString}**${timeString}` : ''}.`;
      const speakText = `O próximo culto é ${serviceTitle}.`;

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '📅 Ver na Liturgia',
        actionIcon: <Calendar size={15} />,
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onNavigate('liturgy');
          setIsOpen(false);
        }
      });
      speak(speakText);
      return;
    }

    // ==========================================
    // 4. INTENT: PROJEÇÃO / TELÃO (Abertura Direta)
    // Ex: "abra a projeção", "abrir telão", "abra o modo projeção", "abra os slides", "telão", "projeção"
    // ==========================================
    if (
      norm.includes('projecao') ||
      norm.includes('telao') ||
      norm.includes('slides') ||
      norm.includes('letras na tv') ||
      norm.includes('modo projecao') ||
      norm.includes('projetor') ||
      norm === 'telao' ||
      norm === 'projecao' ||
      norm === 'abrir telao' ||
      norm === 'abrir projecao'
    ) {
      setIsLoading(false);
      const replyText = 'Pode deixar, abrindo a **Projeção**.';
      const speakText = 'Pode deixar.';

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '📺 Ir para Projeção',
        actionIcon: <Tv size={15} />,
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onNavigate('projection');
          setIsOpen(false);
        }
      });

      speak(speakText);

      setTimeout(() => {
        onNavigate('projection');
        setIsOpen(false);
      }, 900);

      return;
    }

    // ==========================================
    // 5. INTENT: LITURGIA / CULTOS (Abertura Direta)
    // Ex: "abra a liturgia", "abrir cultos", "liturgia", "ordem do culto", "ver liturgia"
    // ==========================================
    if (
      norm.includes('liturgia') ||
      norm.includes('ordem do culto') ||
      norm.includes('programacao do culto') ||
      norm === 'liturgia' ||
      norm === 'abrir liturgia' ||
      norm === 'ver liturgia'
    ) {
      setIsLoading(false);
      const replyText = 'Claro, abrindo a **Liturgia**.';
      const speakText = 'Claro, vou abrir.';

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '📅 Ir para Liturgia',
        actionIcon: <Calendar size={15} />,
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onNavigate('liturgy');
          setIsOpen(false);
        }
      });

      speak(speakText);

      setTimeout(() => {
        onNavigate('liturgy');
        setIsOpen(false);
      }, 900);

      return;
    }

    // ==========================================
    // 6. INTENT: ESCALAS / CALENDÁRIO (Abertura Direta)
    // Ex: "abra as escalas", "abrir escalas", "escalas", "escala", "ver escalas", "voluntários"
    // ==========================================
    if (
      norm.includes('escala') ||
      norm.includes('escalas') ||
      norm.includes('calendario') ||
      norm.includes('voluntarios') ||
      norm.includes('escalados') ||
      norm === 'escalas' ||
      norm === 'escala' ||
      norm === 'abrir escalas' ||
      norm === 'ver escalas'
    ) {
      setIsLoading(false);
      const replyText = 'Pode deixar, abrindo as **Escalas**.';
      const speakText = 'Pode deixar.';

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '👥 Ir para Escalas',
        actionIcon: <Calendar size={15} />,
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onNavigate('calendar');
          setIsOpen(false);
        }
      });

      speak(speakText);

      setTimeout(() => {
        onNavigate('calendar');
        setIsOpen(false);
      }, 900);

      return;
    }

    // ==========================================
    // 6B. INTENT: ABRIR REPERTÓRIO / MÚSICAS (Abertura Direta)
    // Ex: "abrir músicas", "ver músicas", "repertório", "todas as músicas", "abrir repertório"
    // ==========================================
    if (
      (
        norm === 'musicas' ||
        norm === 'musica' ||
        norm === 'repertorio' ||
        norm === 'abrir musicas' ||
        norm === 'ver musicas' ||
        norm === 'abrir repertorio' ||
        norm === 'ver repertorio' ||
        norm === 'todas as musicas' ||
        norm === 'lista de musicas' ||
        ((norm.startsWith('abra') || norm.startsWith('abrir') || norm.startsWith('abre') || norm.startsWith('ver') || norm.startsWith('ir para')) && (norm.includes('repertorio') || norm.includes('todas as musicas') || norm.includes('lista de musicas')))
      ) && !norm.includes('cadastrar') && !norm.includes('adicionar') && !norm.includes('nova') && !norm.includes('tocar')
    ) {
      setIsLoading(false);
      const replyText = 'Claro, abrindo o **Repertório de Músicas**.';
      const speakText = 'Claro, abrindo o repertório.';

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '🎵 Ir para Músicas',
        actionIcon: <Music size={15} />,
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onNavigate('songs');
          setIsOpen(false);
        }
      });

      speak(speakText);

      setTimeout(() => {
        onNavigate('songs');
        setIsOpen(false);
      }, 900);

      return;
    }

    // ==========================================
    // 7. INTENT: CADASTRO DE NOVA MÚSICA (Abertura Direta)
    // Ex: "cadastrar música", "nova música", "adicionar música", "cadastrar cifra"
    // ==========================================
    if (
      norm.includes('cadastrar musica') ||
      norm.includes('cadastro de musica') ||
      norm.includes('nova musica') ||
      norm.includes('adicionar musica') ||
      norm.includes('adicionar cifra') ||
      norm === 'cadastrar musica' ||
      norm === 'nova musica'
    ) {
      const isQuestion = norm.startsWith('como') || norm.startsWith('onde');
      if (!isQuestion) {
        setIsLoading(false);
        const replyText = 'Claro, abrindo o cadastro de **Nova Música**.';
        const speakText = 'Claro, já vou abrir.';

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '➕ Cadastrar Música',
          actionIcon: <Plus size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onOpenAddSong();
            setIsOpen(false);
          }
        });

        speak(speakText);

        setTimeout(() => {
          onOpenAddSong();
          setIsOpen(false);
        }, 900);

        return;
      }
    }

    // ==========================================
    // 8. INTENT: NAVEGAÇÃO DIRETA (Membros, Disponibilidade, Teoria, Chat, Tela Inicial, Configurações, Ajuda)
    // ==========================================
    if (
      norm.includes('membros') ||
      norm.includes('equipe') ||
      norm.includes('musicos') ||
      norm.includes('integrantes') ||
      norm.includes('voluntarios') ||
      norm === 'membros' ||
      norm === 'equipe'
    ) {
      setIsLoading(false);
      const replyText = 'Claro, abrindo **Membros** da equipe.';
      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '👥 Ver Membros',
        actionIcon: <Calendar size={15} />,
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onNavigate('members');
          setIsOpen(false);
        }
      });
      speak('Pode deixar.');
      setTimeout(() => {
        onNavigate('members');
        setIsOpen(false);
      }, 900);
      return;
    }

    if (
      norm.includes('disponibilidade') ||
      norm.includes('minha disponibilidade') ||
      norm.includes('agenda de disponibilidade') ||
      norm === 'disponibilidade'
    ) {
      setIsLoading(false);
      const replyText = 'Claro, abrindo a tela de **Disponibilidade**.';
      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '🗓️ Ver Disponibilidade',
        actionIcon: <Calendar size={15} />,
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onNavigate('availability');
          setIsOpen(false);
        }
      });
      speak('Pode deixar.');
      setTimeout(() => {
        onNavigate('availability');
        setIsOpen(false);
      }, 900);
      return;
    }

    if (
      norm === 'inicio' ||
      norm === 'tela inicial' ||
      norm.includes('ir para o inicio') ||
      norm.includes('ir para tela inicial') ||
      norm === 'home' ||
      norm === 'dashboard'
    ) {
      setIsLoading(false);
      const replyText = 'Voltando para a **Tela Inicial**.';
      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '🏠 Tela Inicial',
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onNavigate('home');
          setIsOpen(false);
        }
      });
      speak('Pode deixar.');
      setTimeout(() => {
        onNavigate('home');
        setIsOpen(false);
      }, 900);
      return;
    }

    if (
      norm.includes('teoria') ||
      norm.includes('dicionario') ||
      norm.includes('estudo') ||
      norm === 'teoria'
    ) {
      setIsLoading(false);
      const replyText = 'Claro, abrindo **Teoria Musical**.';
      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '🎼 Teoria Musical',
        actionIcon: <Music size={15} />,
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onNavigate('theory');
          setIsOpen(false);
        }
      });
      speak('Claro, já vou abrir.');
      setTimeout(() => {
        onNavigate('theory');
        setIsOpen(false);
      }, 900);
      return;
    }

    if (
      norm.includes('chat') ||
      norm.includes('mensagens da equipe') ||
      norm.includes('bate papo') ||
      norm === 'chat'
    ) {
      setIsLoading(false);
      const replyText = 'Claro, abrindo o **Chat** da equipe.';
      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '💬 Ir para Chat',
        actionIcon: <Bot size={15} />,
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onNavigate('chat');
          setIsOpen(false);
        }
      });
      speak('Já vou abrir.');
      setTimeout(() => {
        onNavigate('chat');
        setIsOpen(false);
      }, 900);
      return;
    }

    if (
      norm.includes('configuracoes') ||
      norm.includes('configuracao') ||
      norm.includes('ajustes') ||
      norm === 'configuracoes'
    ) {
      setIsLoading(false);
      const replyText = 'Abrindo as **Configurações**.';
      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '⚙️ Configurações',
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onNavigate('settings');
          setIsOpen(false);
        }
      });
      speak('Pode deixar.');
      setTimeout(() => {
        onNavigate('settings');
        setIsOpen(false);
      }, 900);
      return;
    }

    if (norm.includes('ajuda') || norm.includes('suporte') || norm.includes('central de ajuda') || norm === 'ajuda') {
      setIsLoading(false);
      const replyText = 'Claro, abrindo a **Central de Ajuda**.';
      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '❓ Central de Ajuda',
        actionIcon: <HelpCircle size={15} />,
        actionSuccessMessage: getRandomDone(),
        onActionClick: () => {
          onOpenHelpCenter?.();
          setIsOpen(false);
        }
      });
      speak('Pode deixar.');
      setTimeout(() => {
        onOpenHelpCenter?.();
        setIsOpen(false);
      }, 900);
      return;
    }

    // ==========================================
    // DETECT QUESTIONS & HOW-TO / TUTORIAL COMMANDS
    // Ex: "Como faço para agendar um culto?", "Como agendar um culto?", "Como cadastrar uma música nova?", "Como cadastrar membro?", "Como marcar disponibilidade?"
    // ==========================================
    const isQuestionOrHowTo = 
      norm.startsWith('como ') ||
      norm === 'como' ||
      norm.startsWith('o que ') ||
      norm.startsWith('qual ') ||
      norm.startsWith('onde ') ||
      norm.startsWith('por que ') ||
      norm.startsWith('porque ') ||
      norm.startsWith('passo a passo') ||
      norm.startsWith('tutorial') ||
      norm.startsWith('guia') ||
      norm.startsWith('duvida') ||
      norm.startsWith('ajuda ') ||
      norm.includes('como faco') ||
      norm.includes('como fazer') ||
      norm.includes('como cadastrar') ||
      norm.includes('como agendar') ||
      norm.includes('como criar') ||
      norm.includes('como montar') ||
      norm.includes('como usar') ||
      norm.includes('como funciona') ||
      norm.includes('como marcar') ||
      norm.includes('como mudar') ||
      norm.includes('como transpor') ||
      norm.includes('como projetar') ||
      norm.includes('como afinar') ||
      norm.includes('como ensaiar') ||
      norm.includes('como praticar') ||
      norm.includes('como baixar') ||
      norm.includes('como exportar') ||
      norm.includes('como compartilhar') ||
      norm.includes('como escalar') ||
      norm.includes('como gerar escala');

    if (isQuestionOrHowTo) {
      // 0. COMO USAR / ADICIONAR NO GOOGLE AGENDA?
      if (norm.includes('google agenda') || norm.includes('google calendar') || norm.includes('salvar na agenda') || norm.includes('sincronizar agenda')) {
        setIsLoading(false);
        const replyText = 'Veja como sincronizar e salvar qualquer culto no seu **Google Agenda** com 1 clique:';
        const steps = [
          '1. **Na Tela Inicial**: No card de "Próximo Culto Confirmado", clique no botão **"📅 Google Agenda"**.',
          '2. **Ou na aba Escalas**: Em qualquer card de culto agendado, ao lado dos botões PDF e WhatsApp, clique no botão azul **"Google Agenda"**.',
          '3. **Abertura Automática**: O Google Agenda abre diretamente com todos os detalhes prontos: data e hora de início e término, tema do culto, equipe escalada, suas funções na escala e o repertório das músicas com seus respectivos tons.',
          '4. **Notificações no Celular**: Basta clicar em "Salvar" no Google Agenda e seu celular emitirá lembretes e alertas automáticos antes do culto!'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: 'Sincronizar no Google Agenda',
          actionIcon: <GoogleCalendarIcon size={16} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onNavigate('calendar');
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 0.1 COMO CRIAR CADERNO NO GOOGLE DOCS / EXPORTAR GOOGLE DRIVE?
      if (norm.includes('google doc') || norm.includes('google drive') || norm.includes('caderno') || norm.includes('gerar caderno') || norm.includes('cifras no docs')) {
        setIsLoading(false);
        const replyText = 'Veja como gerar o **Caderno Oficial do Culto no Google Docs** com liturgia e todas as cifras completas:';
        const steps = [
          '1. **No Card do Culto (Escalas ou Liturgia)**: Localize o culto desejado e clique no botão **"📄 Criar Caderno no Google Docs"** com o ícone oficial do Google Docs.',
          '2. **Modal Inteligente**: Uma janela exclusiva se abrirá mostrando a quantidade de momentos da liturgia, cifras e voluntários escalados.',
          '3. **1 Clique para Abrir**: Ao clicar em **"Abrir no Google Docs"**, todo o caderno (cabeçalho da igreja, ordem dos momentos, equipe e cifras completas) é copiado com formatação rica e o Google Docs é aberto automaticamente numa nova aba.',
          '4. **Basta Colar (Ctrl + V)**: Na página em branco do Google Docs, pressione Ctrl + V para ver todo o caderno perfeitamente estilizado, com tons destacados, notas e cifras prontas para ensaio e impressão!',
          '5. **Baixar .doc**: Você também pode baixar o arquivo .doc direto para o seu computador ou Google Drive.'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: 'Ver Cultos e Liturgia',
          actionIcon: <GoogleDocsIcon size={16} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onNavigate('liturgy');
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 1. COMO AGENDAR UM CULTO / CRIAR CULTO?
      if (
        norm.includes('agendar') ||
        norm.includes('agenda') ||
        norm.includes('novo culto') ||
        norm.includes('criar culto') ||
        norm.includes('marcar culto') ||
        (norm.includes('culto') && (norm.includes('criar') || norm.includes('agendar') || norm.includes('fazer') || norm.includes('marcar') || norm.includes('adicionar') || norm.includes('faco')))
      ) {
        setIsLoading(false);
        const replyText = 'Aqui está o passo a passo completo e detalhado para **agendar um culto e organizar a celebração** no LiLouPro:';
        const steps = [
          '1. **Acessar a Agenda**: No menu principal, clique na aba **Escalas** (no menu inferior do celular ou no menu lateral do computador).',
          '2. **Abrir Novo Agendamento**: No topo da tela, clique no botão **"+ Novo Agendamento"**.',
          '3. **Preencher o Formulário de Agendamento**:\n   • **Identificação do Culto**: Digite o nome da celebração (ex: *Culto de Celebração*, *Culto de Domingo Noite*, *Culto de Jovens*);\n   • **Tema / Ocasião**: Selecione o tema no seletor (ex: *Normal*, *Santa Ceia*, *Missões*, *Família*, *Jovens*, *Batismo*);\n   • **Data e Horário**: Defina o dia e o horário do início do culto;\n   • **Link da Playlist (Opcional)**: Cole o link do YouTube com a playlist das músicas para os músicos ensaiarem;\n   • Clique em **"Criar Agendamento"**.',
          '4. **Escalar a Equipe**: No card do culto recém-criado, clique no botão de editar escala para selecionar os voluntários em cada função (Vocal, Violão, Teclado, Bateria, Baixo, Mídia/Projeção, Som, etc.) — ou clique em **"Gerar Escala com IA"** para que o assistente inteligente cruze as disponibilidades e monte a escala automaticamente!',
          '5. **Definir Músicas e Liturgia**: No card do culto, clique em **"Lista de Músicas"** (ou abra a aba **Liturgia**) para definir a ordem dos momentos e vincular as canções do repertório já nos tons corretos.',
          '6. **Notificar e Compartilhar**: Clique no botão **"WhatsApp"** no topo da página para enviar a escala formatada com 1 toque para o grupo do ministério ou em **"Baixar Escala Mês"** para gerar o documento oficial em PDF!'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '🗓️ Ir para Escalas e Agendar Culto',
          actionIcon: <Calendar size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onNavigate('calendar');
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 2. COMO CADASTRAR UMA MÚSICA NOVA?
      if (
        (norm.includes('musica') || norm.includes('cifra') || norm.includes('cancao') || norm.includes('repertorio')) &&
        (norm.includes('cadastrar') || norm.includes('adicionar') || norm.includes('inserir') || norm.includes('nova') || norm.includes('novo') || norm.includes('salvar') || norm.includes('colocar') || norm.includes('faco') || norm.includes('como'))
      ) {
        setIsLoading(false);
        const replyText = 'Aqui está o passo a passo completo para **cadastrar uma nova música** no repertório do LiLouPro:';
        const steps = [
          '1. **Acessar o Repertório**: Acesse a aba **Músicas** no menu de navegação.',
          '2. **Iniciar Cadastro**: Toque no botão **"+ Cadastrar Música"** localizado no canto superior da tela.',
          '3. **Busca Automática com 1 Clique (Mais Rápido)**: Digite o título da canção e artista na barra de pesquisa integrada (Cifra Club / YouTube / Letras). O app busca e preenche automaticamente a cifra completa, letra, tom original e o vídeo do YouTube!',
          '4. **Cadastro Manual**: Se preferir, digite o título, artista, selecione o Tom Original, informe o BPM, cole o link do YouTube e cole a letra com acordes no editor.',
          '5. **Salvar no Repertório**: Toque em **"Salvar Música"**. A canção fica salva na nuvem para toda a igreja, pronta com diagramas de acordes anatômicos (dedos e intervalos), transposição de tom e rolagem automática no Modo Foco.'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '➕ Cadastrar Nova Música Agora',
          actionIcon: <Plus size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onOpenAddSong();
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 3. COMO CADASTRAR MEMBRO / INTEGRANTE / VOLUNTÁRIO?
      if (
        (norm.includes('membro') || norm.includes('integrante') || norm.includes('voluntario') || norm.includes('musico') || norm.includes('cantor') || norm.includes('equipe')) &&
        (norm.includes('cadastrar') || norm.includes('adicionar') || norm.includes('inserir') || norm.includes('novo') || norm.includes('faco') || norm.includes('como'))
      ) {
        setIsLoading(false);
        const replyText = 'Passo a passo para **cadastrar integrantes e voluntários** no ministério de louvor:';
        const steps = [
          '1. **Acessar Membros**: Clique na aba **Membros** no menu principal.',
          '2. **Novo Cadastro**: Toque no botão **"+ Novo Membro"** no topo da tela.',
          '3. **Preencher os Dados**:\n   • **Nome Completo**: Nome do integrante;\n   • **WhatsApp com DDD**: Fundamental para envio automático de escalas e avisos de culto;\n   • **E-mail**: Para notificações e login no sistema;\n   • **Data de Nascimento**: Para o controle de aniversariantes da equipe.',
          '4. **Definir Funções Ministeriais**: Marque as caixas de atuação da pessoa (ex: *Vocal*, *Violão*, *Teclado*, *Baixo*, *Bateria*, *Guitarra*, *Mídia/Projeção*, *Sonoplastia*, *Ministro de Louvor*).',
          '5. **Salvar**: Clique em **"Salvar"**. O membro já estará apto para ser escalado nos cultos e poderá preencher suas disponibilidades mensais!'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '👥 Ir para Membros',
          actionIcon: <Users size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onNavigate('members');
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 4. COMO MARCAR / PREENCHER DISPONIBILIDADE?
      if (
        norm.includes('disponibilidade') ||
        norm.includes('disponivel') ||
        norm.includes('indisponivel') ||
        norm.includes('posso tocar') ||
        norm.includes('nao posso')
      ) {
        setIsLoading(false);
        const replyText = 'Passo a passo para **informar suas disponibilidades para os cultos do mês**:';
        const steps = [
          '1. **Acessar a Tela**: Acesse a aba **Disponibilidade** no menu de navegação.',
          '2. **Visualizar o Calendário**: Você verá a lista de todos os cultos e eventos programados pela liderança para o mês atual.',
          '3. **Marcar as Datas**:\n   • Toque no culto para alternar entre **Disponível (Verde)** e **Indisponível (Vermelho)**;\n   • Adicione observações se houver restrições de horário (ex: *chego após as 19h*).',
          '4. **Salvar Respostas**: Clique no botão **"Salvar Disponibilidade"**.',
          '5. **Benefício**: A liderança e o gerador de escala por IA consultarão suas datas e respeitarão seus dias de folga automaticamente!'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '📅 Marcar Minha Disponibilidade',
          actionIcon: <Calendar size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onNavigate('availability');
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 5. COMO MONTAR LITURGIA / ORDEM DO CULTO?
      if (
        norm.includes('liturgia') ||
        norm.includes('ordem do culto') ||
        norm.includes('ordem de culto') ||
        norm.includes('momentos do culto')
      ) {
        setIsLoading(false);
        const replyText = 'Passo a passo para **estruturar a liturgia e ordem do culto**:';
        const steps = [
          '1. **Acessar Liturgia**: Toque na aba **Liturgia** no menu principal.',
          '2. **Selecionar o Culto**: Escolha o culto agendado na lista de celebrações.',
          '3. **Estruturar os Blocos**: Clique em **"+ Adicionar Momento"** para criar a sequência cronológica (ex: *Oração Inicial*, *Momento de Louvor*, *Dízimos & Ofertas*, *Ministração da Palavra*, *Ceia do Senhor*, *Bênção Final*).',
          '4. **Vincular Músicas do Repertório**: No bloco de louvor, clique em **"+ Adicionar Música"** e vincule as canções do repertório já com as versões e tonalidades definidas.',
          '5. **Definir Duração e Observações**: Indique o tempo previsto de cada momento e anotações para o operador de som e projeção.',
          '6. **Sincronização em Tempo Real**: A liturgia fica sincronizada automaticamente com o telão de projeção e com os dispositivos dos músicos no altar!'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '📋 Ir para Liturgia',
          actionIcon: <Layers size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onNavigate('liturgy');
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 6. COMO PROJETAR LETRAS / TELÃO DA IGREJA?
      if (
        norm.includes('projetar') ||
        norm.includes('projecao') ||
        norm.includes('telao') ||
        norm.includes('tv') ||
        norm.includes('transmissao')
      ) {
        setIsLoading(false);
        const replyText = 'Passo a passo para **projetar as letras das músicas no telão ou TV da igreja**:';
        const steps = [
          '1. **Conectar a Tela**: Conecte o computador ao projetor ou TV via cabo HDMI (ou sem fio) e configure a exibição no modo **Estender Área de Trabalho** (no Windows: pressione `Win + P` e escolha *Estender*).',
          '2. **Acessar Projeção**: No LiLouPro, clique na aba **Projeção** no menu.',
          '3. **Abrir Tela do Telão**: Clique no botão **"Abrir Tela do Telão"** — isso abrirá uma nova janela limpa, sem menus, dedicada exclusivamente para o público.',
          '4. **Posicionar em Tela Cheia**: Arraste essa janela para o monitor da TV/Projetor e pressione `F11` (tela cheia).',
          '5. **Controlar a Projeção**: No monitor principal (ou no seu celular/tablet), selecione a música e toque nas estrofes para trocar as frases na tela instantaneamente com transição suave.',
          '6. **Botões de Emergência**: Utilize os botões **Blackout (Tela Preta)**, **Limpar Texto** ou o envio direto de versículos da **Bíblia**!'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '📺 Abrir Painel de Projeção',
          actionIcon: <Tv size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onNavigate('projection');
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 7. COMO MUDAR O TOM / TRANSPOSIÇÃO DE CIFRA?
      if (
        norm.includes('mudar tom') ||
        norm.includes('transpor') ||
        norm.includes('transposicao') ||
        norm.includes('tom da cifra') ||
        norm.includes('trocar tom') ||
        norm.includes('semitom')
      ) {
        setIsLoading(false);
        const replyText = 'Passo a passo para **mudar o tom de qualquer música** no LiLouPro:';
        const steps = [
          '1. **Abrir a Cifra**: Acesse a aba **Músicas** e abra a canção desejada.',
          '2. **Ajustar Semitons**: Na barra de ferramentas no topo da cifra, localize os controles de tom:\n   • Clique em **- (Diminuir meio tom / Bemol)**;\n   • Clique em **+ (Aumentar meio tom / Sustenido)**;\n   • Ou selecione diretamente a nota desejada no seletor de tom.',
          '3. **Recálculo Harmônico**: Todos os acordes da letra são transpostos instantaneamente com precisão harmônica.',
          '4. **Diagramas Anatômicos**: Os diagramas de acordes no rodapé mudam na mesma hora, mostrando a digitação exata e a opção de ver por Dedos ou por Intervalos.',
          '5. **Salvar Tom do Culto**: O tom alterado pode ser fixado para a escala do dia para que todos os músicos ensaiem na tonalidade certa!'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '🎵 Ver Repertório de Músicas',
          actionIcon: <Music size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onNavigate('songs');
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 8. COMO GERAR ESCALA AUTOMÁTICA COM IA?
      if (
        (norm.includes('ia') || norm.includes('inteligencia artificial') || norm.includes('automatica') || norm.includes('automatico')) &&
        (norm.includes('escala') || norm.includes('escalar'))
      ) {
        setIsLoading(false);
        const replyText = 'Passo a passo para **gerar escalas de ministério automaticamente com Inteligência Artificial**:';
        const steps = [
          '1. **Acessar Escalas**: Clique na aba **Escalas** no menu principal.',
          '2. **Localizar o Culto**: Encontre o card do culto que deseja escalar.',
          '3. **Disparar a IA**: Toque no botão **"Gerar Escala com IA"** no card do culto.',
          '4. **Processamento Inteligente**: O algoritmo analisa em segundos:\n   • As **disponibilidades confirmadas** pelos membros para aquela data;\n   • As **funções habilitadas** no cadastro de cada integrante (vocal, violão, teclado, etc.);\n   • O **histórico de escalas recentes**, evitando sobrecarregar os mesmos voluntários em cultos seguidos.',
          '5. **Revisar e Aprovar**: A escala é preenchida na tela para você revisar e aprovar ou trocar qualquer integrante com 1 clique antes de publicar!'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '🤖 Ir para Escalas e Usar IA',
          actionIcon: <Bot size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onNavigate('calendar');
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 9. COMO COMPARTILHAR ESCALA NO WHATSAPP OU BAIXAR EM PDF?
      if (
        norm.includes('whatsapp') ||
        norm.includes('pdf') ||
        norm.includes('baixar escala') ||
        norm.includes('imprimir escala') ||
        norm.includes('compartilhar escala') ||
        norm.includes('enviar escala')
      ) {
        setIsLoading(false);
        const replyText = 'Passo a passo para **compartilhar ou exportar a escala do ministério**:';
        const steps = [
          '1. **Acessar a Aba Escalas**: Clique em **Escalas** no menu principal.',
          '2. **Compartilhar no WhatsApp**: Clique no botão **"WhatsApp"** no topo da página. O LiLouPro gera uma mensagem completa, organizada por data e função com emojis de instrumentos, pronta para disparar no grupo de louvor com 1 toque!',
          '3. **Lembrete Individual**: No card de cada voluntário escalado, você pode clicar no ícone do WhatsApp para enviar uma mensagem personalizada de convocação direto para ele.',
          '4. **Baixar em PDF**: Clique no botão **"Baixar Escala Mês"** para gerar um documento PDF diagramado para impressão no mural da igreja ou arquivamento.'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '🗓️ Ir para Escalas',
          actionIcon: <Calendar size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onNavigate('calendar');
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 10. COMO USAR O AFINADOR / AFINAR INSTRUMENTOS?
      if (
        norm.includes('afinar') ||
        norm.includes('afinador')
      ) {
        setIsLoading(false);
        const replyText = 'Passo a passo para **afinar seu instrumento** com o Afinador Cromático do LiLouPro:';
        const steps = [
          '1. **Abrir a Ferramenta**: Diga ao assistente *"Abra o afinador"* ou abra qualquer música e clique no ícone de afinador (frequência) na barra superior.',
          '2. **Permissão de Microfone**: Permita o acesso ao microfone no navegador se solicitado.',
          '3. **Tocar a Corda**: Toque a corda solta do instrumento (violão, guitarra, baixo, ukulele) próximo ao microfone.',
          '4. **Leitura Cromática em Tempo Real**:\n   • **Ponteiro à esquerda / Vermelho**: Corda frouxa (aperte);\n   • **Centro / Verde brilhante**: Afinado com precisão absoluta (0 cents);\n   • **Ponteiro à direita / Vermelho**: Corda apertada (afrouxe).'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '🎯 Abrir Afinador do App',
          actionIcon: <Radio size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onOpenTuner?.();
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 11. COMO USAR O METRÔNOMO / AJUSTAR BPM?
      if (
        norm.includes('metronomo') ||
        norm.includes('bpm') ||
        norm.includes('andamento') ||
        norm.includes('ritmo') ||
        norm.includes('clique') ||
        norm.includes('click') ||
        norm.includes('tap tempo')
      ) {
        setIsLoading(false);
        const replyText = 'Passo a passo para **ensaiar com o Metrônomo Interativo**:';
        const steps = [
          '1. **Abrir o Metrônomo**: Diga *"Abra o metrônomo"* ao assistente ou toque no ícone de metrônomo dentro de qualquer cifra.',
          '2. **Ajustar o BPM**: Arraste a barra ou use os botões **+ / -** para definir as batidas por minuto.',
          '3. **Calcular com TAP TEMPO**: Se não souber o BPM numérico, dê 4 toques ritmados no botão **TAP TEMPO** seguindo a batida da música para que o app calcule o andamento exato na hora!',
          '4. **Compasso & Timbre**: Escolha a fórmula de compasso (4/4, 3/4, 6/8) e o som do clique (clássico, madeira ou digital).',
          '5. **Iniciar**: Clique em Play para iniciar o clique e manter a precisão rítmica da equipe durante os ensaios!'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '⏱️ Abrir Metrônomo do App',
          actionIcon: <Timer size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onOpenMetronome?.();
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 12. COMO USAR O MODO FOCO / MODO PALCO?
      if (
        norm.includes('modo foco') ||
        norm.includes('modo palco') ||
        norm.includes('estante') ||
        norm.includes('autoscroll') ||
        norm.includes('rolagem')
      ) {
        setIsLoading(false);
        const replyText = 'Passo a passo para **usar o Modo Foco nas estantes de partitura e palcos**:';
        const steps = [
          '1. **Entrar no Modo Foco**: Ao abrir qualquer cifra, clique no botão **"Modo Foco"** no topo da tela (ou diga *"Abrir modo foco"*).',
          '2. **Tela 100% Limpa**: Menus, barras e botões são recolhidos para dedicar toda a tela aos acordes e letras com alto contraste.',
          '3. **Aumentar Tipografia**: Ajuste o tamanho da letra para leitura confortável na estante de partitura a vários metros de distância.',
          '4. **Rolagem Automática (AutoScroll)**: Toque no controle de rolagem e defina a velocidade (ex: 0.3x, 0.5x, 1x) para a página descer suavemente enquanto você toca.',
          '5. **Pedais Bluetooth**: Totalmente compatível com pedais Footswitch para passar a página com os pés sem soltar o instrumento!'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '🎵 Ver Repertório de Músicas',
          actionIcon: <Music size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onNavigate('songs');
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 13. COMO USAR A BÍBLIA E PROJETAR VERSÍCULOS?
      if (
        norm.includes('biblia') ||
        norm.includes('versiculo') ||
        norm.includes('escritura') ||
        norm.includes('capitulo')
      ) {
        setIsLoading(false);
        const replyText = 'Passo a passo para **ler a Bíblia e projetar versículos no culto**:';
        const steps = [
          '1. **Acessar a Bíblia**: Diga ao assistente ex: *"Abra a bíblia em Salmos 23"* ou *"Abra a bíblia em João 3:16"* ou acesse a aba **Bíblia** no menu.',
          '2. **Navegar pelos Livros**: Escolha o livro, capítulo e versão bíblica desejada com busca rápida.',
          '3. **Projetar Versículo no Telão**: Ao lado de cada versículo há o botão **"Projetar"**. Basta tocar nele para transmitir o texto sagrado imediatamente para a tela do projetor ou TV em tamanho grande e legível para a igreja.',
          '4. O versículo é enviado em tempo real sem precisar digitar nada!'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '📖 Acessar Bíblia Sagrada',
          actionIcon: <BookOpen size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onNavigate('bible');
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }

      // 14. COMO ENSAIAR COM O PLAYER / MODO PRATIQUE?
      if (
        norm.includes('player') ||
        norm.includes('pratique') ||
        norm.includes('ensaiar') ||
        norm.includes('ouvir musica') ||
        norm.includes('tocar junto')
      ) {
        setIsLoading(false);
        const replyText = 'Passo a passo para **ensaiar com o Player e Modo Pratique**:';
        const steps = [
          '1. Peça ao assistente ex: *"Tocar música Teu amor não falha"* ou abra a cifra e clique no botão **"Player / Modo Pratique"**.',
          '2. O player integrado carrega o vídeo oficial do YouTube ou áudio guia sincronizado com a letra.',
          '3. Você pode tocar junto lendo os acordes transpostos na tela e controlar o volume.',
          '4. Ideal para estudar a dinâmica, introduções e pontes da música antes do ensaio presencial com a banda!'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '🎵 Ver Músicas',
          actionIcon: <Music size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onNavigate('songs');
            setIsOpen(false);
          }
        });

        speak('Pronto, deixei o passo a passo na tela.');
        return;
      }
    }

    // ==========================================
    // 9. INTENT: ABRIR MÚSICA / CIFRA / LETRA / PLAYER (Abertura Direta)
    // Ex: "abrir player da música Teu amor não falha", "tocar música Teu amor não falha", "tocar música Bondade de Deus", "abra o player da música Bondade de Deus", "abra Raridade", "tocar cifra", "ver cifra"
    // ==========================================
    const isPlayerMode = 
      norm.includes('player') || 
      norm.includes('ouvir') || 
      norm.includes('tocar audio') || 
      norm.includes('tocar video') || 
      norm.includes('modo estudo') || 
      norm.includes('modo pratique') ||
      norm.startsWith('tocar') ||
      norm.startsWith('toque') ||
      norm.startsWith('toca') ||
      norm.startsWith('play') ||
      norm.startsWith('reproduzir') ||
      norm.includes('tocar musica') ||
      norm.includes('toque musica') ||
      norm.includes('toca musica') ||
      norm.includes('dar play');

    const matchesAnyKnownSong = !isQuestionOrHowTo && (
      allSongs.some(s => {
        const t = normalize(s.title || '');
        return t === norm || (norm.length >= 4 && (t.startsWith(norm) || norm.startsWith(t)));
      }) ||
      Boolean(findLocalPopularSong(norm, ""))
    );

    const isSongCommand = !isQuestionOrHowTo && (
      matchesAnyKnownSong ||
      norm.startsWith('abra') ||
      norm.startsWith('abrir') ||
      norm.startsWith('abre') ||
      norm.startsWith('tocar') ||
      norm.startsWith('toque') ||
      norm.startsWith('toca') ||
      norm.startsWith('play') ||
      norm.startsWith('dar play') ||
      norm.startsWith('ver') ||
      norm.startsWith('ouvir') ||
      norm.startsWith('reproduzir') ||
      norm.startsWith('mostra') ||
      norm.startsWith('mostrar') ||
      norm.startsWith('mostre') ||
      norm.startsWith('quero') ||
      norm.includes('cifra') ||
      norm.includes('musica') ||
      norm.includes('cancao') ||
      norm.includes('letra') ||
      norm.includes('player') ||
      norm.includes('modo foco') ||
      norm.includes('rolagem')
    );

    if (isSongCommand) {
      const isFocusMode = norm.includes('modo foco') || norm.includes('no foco') || norm.includes('foco');
      const isLyricsOnly = norm.includes('letra') && !norm.includes('cifra') && !isPlayerMode;

      // Extract scroll speed if mentioned (e.g. "rolagem 3 x", "rolagem 3x", "velocidade 3", "3x", "0.3x")
      let scrollSpeed: number | undefined = undefined;
      let autoScroll = false;
      const scrollMatch = text.match(/(?:rolagem|velocidade|scroll)\s*(\d+(?:[.,]\d+)?)\s*x?/i) ||
                          text.match(/(\d+(?:[.,]\d+)?)\s*x/i);
      
      if (scrollMatch && scrollMatch[1]) {
        const parsedSpeed = parseFloat(scrollMatch[1].replace(',', '.'));
        if (!isNaN(parsedSpeed) && parsedSpeed > 0) {
          scrollSpeed = parsedSpeed;
          autoScroll = true;
        }
      } else if (norm.includes('rolagem') || norm.includes('autoscroll') || norm.includes('auto scroll')) {
        scrollSpeed = 0.3;
        autoScroll = true;
      }

      // Extract song name candidate by cleaning control words and command prefixes
      let cleanQuery = norm
        .replace(/no modo foco/g, '')
        .replace(/modo foco/g, '')
        .replace(/em foco/g, '')
        .replace(/no foco/g, '')
        .replace(/na rolagem \d+(\.\d+)? ?x?/g, '')
        .replace(/com rolagem \d+(\.\d+)? ?x?/g, '')
        .replace(/velocidade \d+(\.\d+)? ?x?/g, '')
        .replace(/rolagem \d+(\.\d+)? ?x?/g, '')
        .replace(/\d+(\.\d+)? ?x/g, '')
        .replace(/na rolagem/g, '')
        .replace(/com rolagem/g, '')
        .replace(/com autoscroll/g, '')
        .replace(/autoscroll/g, '')
        .replace(/rolagem automatica/g, '')
        .replace(/do app/g, '')
        .replace(/no app/g, '')
        .replace(/por favor/g, '')
        .trim();

      // First strip "player" commands: e.g. "abrir player da musica Teu amor", "abrir player Teu amor", "player Teu amor"
      cleanQuery = cleanQuery
        .replace(/^(abra|abrir|abre|ver|toque|tocar|toca|acesse|acessar|iniciar|solte|soltar)\s+(o\s+|a\s+)?player\s+(da\s+musica\s+|de\s+musica\s+|da\s+|do\s+|de\s+)?/i, '')
        .replace(/^(abra|abrir|abre|ver|toque|tocar|toca|acesse|acessar|iniciar|solte|soltar)\s+player\s+/i, '')
        .replace(/^(o\s+|a\s+)?player\s+(da\s+musica\s+|de\s+musica\s+|da\s+|do\s+|de\s+)/i, '')
        .replace(/^(o\s+|a\s+)?player\s+/i, '')
        // Then strip "tocar musica", "tocar a musica", "toque musica", "toque", "tocar", "ouvir", "reproduzir", "play", "mostra", "quero a cifra"
        .replace(/^(quero\s+(a\s+|o\s+)?(cifra|letra|musica)\s+(de\s+|da\s+|do\s+)?|quero\s+(ouvir|tocar)\s+)/i, '')
        .replace(/^(abra|abrir|abre|ver|veja|mostra|mostrar|mostre|toque|tocar|toca|ouvir|reproduzir|dar\s+play|play|acesse|acessar)\s+(a\s+|o\s+)?(cifra|letra|musica|cancao|faixa|som|audio|video)\s+(da\s+musica\s+|de\s+musica\s+|da\s+|do\s+|de\s+)?/i, '')
        .replace(/^(abra|abrir|abre|ver|veja|mostra|mostrar|mostre|toque|tocar|toca|ouvir|reproduzir|dar\s+play|play|acesse|acessar)\s+(a\s+|o\s+)?(cifra|letra|musica|cancao|faixa|som|audio|video)\s+/i, '')
        .replace(/^(abra|abrir|abre|ver|veja|mostra|mostrar|mostre|toque|tocar|toca|ouvir|reproduzir|dar\s+play|play|acesse|acessar)\s+(a\s+|o\s+)?/i, '')
        .replace(/^(cifra|letra|musica|cancao|faixa)\s+(da\s+musica\s+|de\s+musica\s+|da\s+|do\s+|de\s+)/i, '')
        .replace(/^(cifra|letra|musica|cancao|faixa)\s+/i, '')
        .replace(/^[::\s\-–—"']+|["']+$/g, '')
        .replace(/\s+(no\s+|com\s+|pelo\s+)?(player|som|youtube)$/i, '')
        .trim();

      // If user asked to open player or play music without specifying a song
      if (isPlayerMode && (!cleanQuery || cleanQuery === 'player' || cleanQuery === 'musica' || cleanQuery === 'musicas' || cleanQuery === 'tal')) {
        if (currentSong) {
          setIsLoading(false);
          const replyText = `Tocando **"${currentSong.title}"** no player.`;
          const speakText = `Tocando ${currentSong.title}.`;
          addMessage({
            id: getUniqueAssistantMsgId('assistant'),
            sender: 'assistant',
            text: replyText,
            timestamp: new Date(),
            actionLabel: `▶️ Tocar Música: ${currentSong.title}`,
            actionIcon: <Volume2 size={15} />,
            actionSuccessMessage: '✓ Pronto!',
            onActionClick: () => {
              onOpenSong(currentSong, {
                focusMode: isFocusMode,
                scrollSpeed: scrollSpeed,
                autoScroll: autoScroll,
                showPlayer: true
              });
              setIsOpen(false);
            }
          });
          speak(speakText);
          setTimeout(() => {
            onOpenSong(currentSong, {
              focusMode: isFocusMode,
              scrollSpeed: scrollSpeed,
              autoScroll: autoScroll,
              showPlayer: true
            });
            setIsOpen(false);
          }, 1100);
          return;
        } else {
          setIsLoading(false);
          const replyText = 'Qual música você gostaria de tocar? Diga por exemplo: *"Tocar música Teu amor não falha"*.';
          addMessage({
            id: getUniqueAssistantMsgId('assistant'),
            sender: 'assistant',
            text: replyText,
            timestamp: new Date(),
            actionLabel: '🎵 Ver Músicas',
            actionIcon: <Music size={15} />,
            actionSuccessMessage: '✓ Pronto!',
            onActionClick: () => {
              onNavigate('songs');
              setIsOpen(false);
            }
          });
          speak('Qual música você quer tocar?', () => {
            startListening();
          });
          return;
        }
      }

      // If user just requested opening the general songbook
      if (!cleanQuery || cleanQuery === 'cifra' || cleanQuery === 'cifras' || cleanQuery === 'musica' || cleanQuery === 'musicas' || cleanQuery === 'repertorio') {
        setIsLoading(false);
        const replyText = 'Claro, abrindo o **Repertório**.';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '🎵 Ir para Músicas',
          actionIcon: <Music size={15} />,
          actionSuccessMessage: '✓ Pronto!',
          onActionClick: () => {
            onNavigate('songs');
            setIsOpen(false);
          }
        });
        speak('Claro, abrindo o repertório.');
        setTimeout(() => {
          onNavigate('songs');
          setIsOpen(false);
        }, 1000);
        return;
      }

      // Find in existing church songs (allSongs)
      // 1. Exact match on title
      let foundSong = allSongs.find(s => normalize(s.title || '') === cleanQuery);
      // 2. Starts with on title
      if (!foundSong) {
        foundSong = allSongs.find(s => {
          const t = normalize(s.title || '');
          return t.startsWith(cleanQuery) || cleanQuery.startsWith(t);
        });
      }
      // 3. Substring match on title or artist
      if (!foundSong) {
        // Protege contra palavras comuns conversacionais isoladas gerando falsos positivos (ex: "obrigado" não deve casar "Obrigado Jesus pelo seu sangue")
        const isCommonConversationalWord = ['obrigado', 'obrigada', 'valeu', 'brigado', 'grato', 'gratidao', 'tks', 'thanks'].includes(cleanQuery);
        if (!isCommonConversationalWord && cleanQuery.length >= 3) {
          foundSong = allSongs.find(s => {
            const titleNorm = normalize(s.title || '');
            const artistNorm = normalize(s.artist || '');
            return titleNorm.includes(cleanQuery) || cleanQuery.includes(titleNorm) || 
                   (artistNorm && (artistNorm.includes(cleanQuery) || cleanQuery.includes(artistNorm)));
          });
        }
      }

      // If not in allSongs, check built-in popular songs database (e.g. Teu Amor Não Falha)
      if (!foundSong) {
        const popular = findLocalPopularSong(cleanQuery, "");
        if (popular) {
          foundSong = {
            id: `popular-${normalize(popular.title).replace(/\s+/g, '-')}`,
            title: popular.title,
            artist: popular.artist,
            key: popular.key,
            bpm: popular.bpm,
            timeSignature: popular.timeSignature,
            chords: popular.chords,
            lyrics: popular.lyrics,
            youtube: popular.youtube || undefined,
            isFavorite: false
          };
        }
      }

      if (foundSong) {
        setIsLoading(false);
        const focusText = isFocusMode ? ' no **Modo Foco**' : '';
        const scrollText = scrollSpeed !== undefined ? ` com **rolagem automática (${scrollSpeed}x)**` : '';
        const isTocarCommand = norm.startsWith('tocar') || norm.startsWith('toque') || norm.startsWith('toca') || norm.startsWith('play') || norm.startsWith('reproduzir');
        let speakText = '';
        let replyText = '';

        if (isTocarCommand) {
          speakText = `Beleza, vou abrir ${foundSong.title}.`;
          replyText = `Tocando **"${foundSong.title}"**${focusText}${scrollText}.`;
        } else if (isPlayerMode) {
          speakText = 'Já vou abrir o player.';
          replyText = `Abrindo o player de **"${foundSong.title}"**${focusText}${scrollText}.`;
        } else if (isLyricsOnly) {
          speakText = 'Claro, vou abrir a letra.';
          replyText = `Abrindo a letra de **"${foundSong.title}"**${focusText}${scrollText}.`;
        } else {
          speakText = 'Claro, vou abrir.';
          replyText = `Abrindo a cifra de **"${foundSong.title}"**${focusText}${scrollText}.`;
        }

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: isTocarCommand ? `▶️ Tocar Música: ${foundSong.title}` : (isPlayerMode ? `▶️ Abrir Player: ${foundSong.title}` : `🎵 Abrir ${foundSong.title}`),
          actionIcon: isPlayerMode ? <Volume2 size={15} /> : <Music size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            onOpenSong(foundSong, {
              focusMode: isFocusMode,
              scrollSpeed: scrollSpeed,
              autoScroll: autoScroll,
              showPlayer: isPlayerMode
            });
            setIsOpen(false);
          }
        });

        speak(speakText);

        // Auto execute after short confirmation delay
        setTimeout(() => {
          onOpenSong(foundSong, {
            focusMode: isFocusMode,
            scrollSpeed: scrollSpeed,
            autoScroll: autoScroll,
            showPlayer: isPlayerMode
          });
          setIsOpen(false);
        }, 1100);

        return;
      } else if (
        norm.startsWith('abra') ||
        norm.startsWith('abrir') ||
        norm.startsWith('abre') ||
        norm.startsWith('tocar') ||
        norm.startsWith('toque') ||
        norm.startsWith('toca') ||
        norm.startsWith('play') ||
        norm.startsWith('reproduzir') ||
        norm.includes('cifra') ||
        norm.includes('musica') ||
        norm.includes('letra') ||
        norm.includes('player')
      ) {
        setIsLoading(false);
        const replyText = `Não achei **"${cleanQuery}"** no repertório. Você quer cadastrar?`;
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '➕ Cadastrar Nova Música',
          actionIcon: <Plus size={15} />,
          actionSuccessMessage: getRandomDone(),
          onActionClick: () => {
            pendingActionRef.current = null;
            onOpenAddSong();
            setIsOpen(false);
          }
        });
        pendingActionRef.current = { type: 'confirm_add_song', songTitle: cleanQuery };
        speak(`Não achei ${cleanQuery} no repertório. Você quer cadastrar?`, () => {
          startListening();
        });
        return;
      }
    }

    // ==========================================
    // 9. GENERAL / AI FALLBACK (Via Gemini API ou Local Expert Guide)
    // ==========================================
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          history: messages.slice(-4).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        })
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const aiReply = data.reply;
        if (aiReply) {
          setIsLoading(false);
          addMessage({
            id: getUniqueAssistantMsgId('assistant'),
            sender: 'assistant',
            text: aiReply,
            timestamp: new Date()
          });
          speak(aiReply);
          return;
        }
      }
    } catch (apiErr) {
      console.warn("AI Assistant chat fetch failed, using local guide:", apiErr);
    }

    // Local graceful answer if network or API unreachable
    setIsLoading(false);
    const notUnderstoodMsg = getRandomNotUnderstood();
    const fallbackText = `**${notUnderstoodMsg}**\nVocê pode me pedir ações como:\n• "Abre o afinador"\n• "Abre o metrônomo"\n• "Abre a cifra de [música]"\n• "Abre o player"\n• "Abre a Bíblia no Salmo 23"`;

    addMessage({
      id: getUniqueAssistantMsgId('assistant'),
      sender: 'assistant',
      text: fallbackText,
      timestamp: new Date()
    });
    speak(notUnderstoodMsg, () => {
      startListening();
    });
  };

  const handleQuickChip = (chipText: string) => {
    handleProcessInput(chipText);
  };

  // Web Audio chime para ativação do Wake Word ("Oi Lilou")
  const lastChimeTimeRef = useRef<number>(0);
  const playWakeChime = useCallback(() => {
    const nowMs = Date.now();
    // Previne repetição / loop: se tocou há menos de 1800ms, ignora
    if (nowMs - lastChimeTimeRef.current < 1800) {
      return;
    }
    lastChimeTimeRef.current = nowMs;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5

      gainNode.gain.setValueAtTime(0.16, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);

      setTimeout(() => {
        try { ctx.close(); } catch {}
      }, 350);
    } catch {
      // Falha silenciosa no AudioContext
    }
  }, []);

  // Manipulador acionado quando as palavras-chave "Oi Lilou" ou "Ok Lilou" são detectadas
  const handleWakeWordTriggered = useCallback((commandAfter: string) => {
    if (isHandlingWakeRef.current) return;
    isHandlingWakeRef.current = true;

    playWakeChime();

    // Abrir o assistente se estiver fechado
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('liloupro:voice-sound-detected', { detail: { soundDetected: true } }));
      window.dispatchEvent(new CustomEvent('liloupro:voice-command-captured', { detail: { command: commandAfter || 'Oi Lilou' } }));
    }

    if (!isOpenRef.current) {
      setIsOpen(true);
      setIsRetracted(false);
    }

    const greetingSpoken = getRandomGreeting();

    if (!commandAfter || commandAfter.trim().length < 2) {
      // Usuário disse apenas "Oi Lilou", "Ok Lilou", "E aí Lilou"
      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: `🎙️ **${greetingSpoken}**`,
        timestamp: new Date(),
        steps: [
          'Diga: "Abre o afinador"',
          'Diga: "Abre o metrônomo"',
          'Diga: "Abre a cifra de [música]"',
          'Diga: "Tocar playlist do culto"',
          'Diga: "Abre a Bíblia no Salmo 23"'
        ]
      });

      // Fala a saudação com a voz oficial Puck e, logo que terminar, abre o microfone para escutar o comando
      speak(greetingSpoken, () => {
        isHandlingWakeRef.current = false;
        startListening();
      });
    } else {
      // Usuário disse "Oi Lilou" + comando direto (ex: "Oi Lilou abre o afinador")
      isHandlingWakeRef.current = false;
      addMessage({
        id: getUniqueAssistantMsgId('user'),
        sender: 'user',
        text: commandAfter.trim(),
        timestamp: new Date()
      });

      handleProcessInput(commandAfter.trim());
    }
  }, [playWakeChime, setIsOpen, speak, startListening, handleProcessInput]);

  const stopWakeWordListening = useCallback(() => {
    if (wakeWordDebounceTimeoutRef.current) {
      clearTimeout(wakeWordDebounceTimeoutRef.current);
      wakeWordDebounceTimeoutRef.current = null;
    }
    if (wakeWordRestartTimeoutRef.current) {
      clearTimeout(wakeWordRestartTimeoutRef.current);
      wakeWordRestartTimeoutRef.current = null;
    }
    if (wakeWordRecognitionRef.current) {
      try {
        wakeWordRecognitionRef.current.onend = null;
        wakeWordRecognitionRef.current.onerror = null;
        wakeWordRecognitionRef.current.abort();
      } catch {}
      wakeWordRecognitionRef.current = null;
    }
    setIsWakeWordActive(false);
  }, []);

  // Desliga completamente todos os microfones, escutas e estados
  const turnOffAllListening = useCallback(() => {
    isManualMicSessionActiveRef.current = false;
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    pendingActionRef.current = null;
    stopWakeWordListening();
    setWakeWordEnabled(false);
    wakeWordEnabledRef.current = false;
    try {
      localStorage.setItem('liloupro_assistant_wakeword', 'false');
    } catch {}
    setIsWakeWordActive(false);
    setIsListening(false);
    isListeningRef.current = false;
    setInterimTranscript('');
    latestInterimRef.current = '';

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('liloupro:wakeword-change', { detail: { enabled: false } }));
      window.dispatchEvent(new CustomEvent('liloupro:voice-sound-detected', { detail: { soundDetected: false } }));
    }
  }, [stopWakeWordListening]);

  useEffect(() => {
    turnOffAllListeningRef.current = turnOffAllListening;
  }, [turnOffAllListening]);

  const startWakeWordListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const isAudioSpeaking = Boolean(currentAudioRef.current && !currentAudioRef.current.paused && !currentAudioRef.current.ended);
    if (
      isSpeakingRef.current ||
      !wakeWordEnabledRef.current ||
      isListeningRef.current ||
      isHandlingWakeRef.current ||
      isManualMicSessionActiveRef.current ||
      Boolean(recognitionRef.current) ||
      isAudioSpeaking ||
      (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking)
    ) {
      return;
    }

    try {
      if (wakeWordRestartTimeoutRef.current) {
        clearTimeout(wakeWordRestartTimeoutRef.current);
        wakeWordRestartTimeoutRef.current = null;
      }

      if (wakeWordRecognitionRef.current) {
        try { 
          wakeWordRecognitionRef.current.onend = null;
          wakeWordRecognitionRef.current.onerror = null;
          wakeWordRecognitionRef.current.abort(); 
        } catch {}
        wakeWordRecognitionRef.current = null;
      }

      const rec = new SpeechRecognition();
      rec.lang = 'pt-BR';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 3;

      rec.onstart = () => {
        setIsWakeWordActive(true);
      };

      rec.onresult = (event: any) => {
        // Ignora áudio se o próprio sintetizador ou player de áudio estiver falando ou se já estiver processando
        const isPlayingNow = Boolean(currentAudioRef.current && !currentAudioRef.current.paused && !currentAudioRef.current.ended);
        if (isPlayingNow || (typeof window !== 'undefined' && window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending))) {
          return;
        }
        if (isHandlingWakeRef.current || isListeningRef.current) {
          return;
        }

        // Checa todas as alternativas retornadas pelo reconhecimento de fala
        let candidates: string[] = [];
        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (!res) continue;
          for (let j = 0; j < res.length; ++j) {
            const transcript = res[j]?.transcript?.trim();
            if (transcript) candidates.push(transcript);
          }
        }

        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += ' ' + (event.results[i][0]?.transcript || '');
        }
        fullTranscript = fullTranscript.trim();
        if (fullTranscript) candidates.push(fullTranscript);

        if (fullTranscript && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('liloupro:voice-sound-detected', { detail: { soundDetected: true } }));
        }

        let matchResult = { detected: false, commandAfter: '' };
        for (const candidate of candidates) {
          const check = checkLilouWakeWord(candidate);
          if (check.detected) {
            matchResult = check;
            break;
          }
        }

        if (matchResult.detected) {
          const commandAfter = matchResult.commandAfter;
          // Se o comando já foi dito na mesma frase (ex: "Oi Lilou abre o afinador")
          if (commandAfter && commandAfter.trim().length >= 2) {
            if (wakeWordDebounceTimeoutRef.current) {
              clearTimeout(wakeWordDebounceTimeoutRef.current);
              wakeWordDebounceTimeoutRef.current = null;
            }
            try {
              rec.onend = null;
              rec.onerror = null;
              rec.abort();
            } catch {}
            wakeWordRecognitionRef.current = null;
            setIsWakeWordActive(false);
            if (wakeWordRestartTimeoutRef.current) {
              clearTimeout(wakeWordRestartTimeoutRef.current);
              wakeWordRestartTimeoutRef.current = null;
            }
            handleWakeWordTriggered(commandAfter);
            return;
          }

          // Se apenas o gatilho foi ouvido, aguarda 250ms para ativação rápida
          if (!wakeWordDebounceTimeoutRef.current) {
            wakeWordDebounceTimeoutRef.current = setTimeout(() => {
              wakeWordDebounceTimeoutRef.current = null;
              try {
                rec.onend = null;
                rec.onerror = null;
                rec.abort();
              } catch {}
              wakeWordRecognitionRef.current = null;
              setIsWakeWordActive(false);
              if (wakeWordRestartTimeoutRef.current) {
                clearTimeout(wakeWordRestartTimeoutRef.current);
                wakeWordRestartTimeoutRef.current = null;
              }
              handleWakeWordTriggered('');
            }, 250);
          }
        }
      };

      rec.onerror = (event: any) => {
        setIsWakeWordActive(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          console.warn('Microfone não autorizado para escuta de wake word.');
          setWakeWordEnabled(false);
          wakeWordEnabledRef.current = false;
          try { localStorage.setItem('liloupro_assistant_wakeword', 'false'); } catch {}
        }
        if (event.error === 'aborted' || event.error === 'audio-capture') {
          if (wakeWordRestartTimeoutRef.current) {
            clearTimeout(wakeWordRestartTimeoutRef.current);
            wakeWordRestartTimeoutRef.current = null;
          }
        }
      };

      rec.onend = () => {
        setIsWakeWordActive(false);
        if (wakeWordRestartTimeoutRef.current) {
          clearTimeout(wakeWordRestartTimeoutRef.current);
          wakeWordRestartTimeoutRef.current = null;
        }

        // Se este listener já foi substituído por outro ou anulado voluntariamente, não reinicia
        if (wakeWordRecognitionRef.current !== rec) {
          return;
        }

        // Se o modo wake word foi desativado, ou se estamos escutando comando ativo, ou processando gatilho
        if (
          !wakeWordEnabledRef.current ||
          isListeningRef.current ||
          isHandlingWakeRef.current ||
          Boolean(recognitionRef.current)
        ) {
          return;
        }

        // Reinício controlado e suave (1200ms) sem loop cego de 60ms para evitar bips sucessivos
        wakeWordRestartTimeoutRef.current = setTimeout(() => {
          wakeWordRestartTimeoutRef.current = null;
          if (
            wakeWordEnabledRef.current &&
            !isListeningRef.current &&
            !isHandlingWakeRef.current &&
            !recognitionRef.current &&
            wakeWordRecognitionRef.current === rec
          ) {
            startWakeWordListening();
          }
        }, 1200);
      };

      wakeWordRecognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('Falha ao iniciar reconhecimento por wake word:', err);
      setIsWakeWordActive(false);
    }
  }, [handleWakeWordTriggered]);

  // Efeito para manter o reconhecimento de Wake Word ativo quando habilitado
  useEffect(() => {
    if (wakeWordEnabled && !isListening) {
      startWakeWordListening();
    } else {
      stopWakeWordListening();
    }

    return () => {
      stopWakeWordListening();
    };
  }, [wakeWordEnabled, isListening, startWakeWordListening, stopWakeWordListening]);

  // Alternar o Modo Wake Word ("Oi Lilou")
  const toggleWakeWord = useCallback(() => {
    setWakeWordEnabled(prev => {
      const next = !prev;
      if (!next) {
        turnOffAllListening();
        return false;
      }
      wakeWordEnabledRef.current = true;
      isManualMicSessionActiveRef.current = true;
      try {
        localStorage.setItem('liloupro_assistant_wakeword', 'true');
      } catch {}

      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('liloupro:wakeword-change', { detail: { enabled: true } }));
        }
      }, 0);

      startListening();
      return true;
    });
  }, [startListening, turnOffAllListening]);

  useEffect(() => {
    const handleMicAction = () => {
      // Se qualquer modo de escuta ou microfone estiver ativo, desliga completamente
      const isCurrentlyActive = isListeningRef.current || wakeWordEnabledRef.current || isWakeWordActive || isManualMicSessionActiveRef.current || Boolean(recognitionRef.current);
      if (isCurrentlyActive) {
        turnOffAllListening();
      } else {
        isManualMicSessionActiveRef.current = true;
        setWakeWordEnabled(true);
        wakeWordEnabledRef.current = true;
        try {
          localStorage.setItem('liloupro_assistant_wakeword', 'true');
        } catch {}
        startListening();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('liloupro:wakeword-change', { detail: { enabled: true } }));
        }
      }
    };

    const handleStartListen = () => {
      handleMicAction();
    };

    window.addEventListener('liloupro:mic-tap', handleMicAction);
    window.addEventListener('liloupro:toggle-wakeword', handleMicAction);
    window.addEventListener('liloupro:start-listening', handleStartListen);
    return () => {
      window.removeEventListener('liloupro:mic-tap', handleMicAction);
      window.removeEventListener('liloupro:toggle-wakeword', handleMicAction);
      window.removeEventListener('liloupro:start-listening', handleStartListen);
    };
  }, [startListening, turnOffAllListening, isWakeWordActive]);

  return (
    <>
      {/* Floating Active Voice Pill across all screens when listening with drawer closed */}
      <AnimatePresence>
        {!isOpen && isListening && (
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', damping: 22, stiffness: 350 }}
            className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[10008] max-w-[94vw] sm:max-w-md pointer-events-auto"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-950/95 backdrop-blur-md border border-sky-400/60 shadow-2xl shadow-sky-500/30 text-white select-none">
              <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-sky-500/25 text-sky-400 shrink-0">
                <span className="absolute inset-0 rounded-full animate-ping bg-sky-400/40" />
                <Mic size={15} className="relative z-10 animate-pulse text-sky-300 stroke-[2.5]" />
              </div>
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 flex items-center gap-1.5">
                  LiLou Ouvindo
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </span>
                <span className="text-xs font-bold text-slate-100 truncate max-w-[210px] sm:max-w-[290px]">
                  {interimTranscript || 'Pode falar seu comando...'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  turnOffAllListening();
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
                title="Desligar microfone"
              >
                <X size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button (Acesso rápido e retrátil ao Liloupro Assistente) */}
      <AnimatePresence mode="wait">
        {!isRetracted ? (
          <motion.div
            key="assistant-btn-expanded"
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="fixed z-[10005] bottom-[84px] sm:bottom-22 md:bottom-6 right-3 sm:right-6 select-none print:hidden flex items-center"
          >
            <div className="relative flex items-center rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white font-black assistant-radiant-glow border border-sky-400/30 overflow-hidden shadow-xl">
              {/* Soft animated glass light shimmer */}
              <div className="absolute inset-0 -translate-x-full animate-assistant-shimmer bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

              {/* Main Button to Open Assistant */}
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center gap-2 pl-3.5 pr-2 py-2.5 sm:py-3 text-xs sm:text-sm cursor-pointer active:scale-95 transition-all group"
                title="Liloupro Assistente (Comandos de voz e guia)"
              >
                <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-slate-950/70 text-sky-300 border border-sky-400/40 shrink-0 shadow-inner group-hover:border-sky-300 transition-colors">
                  <Mic size={14} className="group-hover:scale-110 transition-transform stroke-[2.5]" />
                </div>
                
                <span className="tracking-wider uppercase font-black text-[11px] sm:text-xs text-white">
                  Assistente
                </span>

                <Sparkles size={12} className="text-sky-300 opacity-80 shrink-0" />

                {wakeWordEnabled && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-200 text-[9px] font-black tracking-wider uppercase">
                    <Radio size={9} className="animate-pulse text-amber-300" />
                    <span>"Oi Lilou"</span>
                  </span>
                )}

                <span className="flex h-2 w-2 relative ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-300"></span>
                </span>
              </button>

              {/* Separator */}
              <div className="w-[1px] h-5 bg-white/20" />

              {/* Retract button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRetract(true);
                }}
                className="px-2 sm:px-2.5 py-2.5 sm:py-3 text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all flex items-center justify-center"
                title="Esconder na lateral (modo retrátil)"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        ) : isRetracted ? (
          <motion.div
            key="assistant-btn-retracted"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="fixed z-[10005] bottom-[86px] sm:bottom-24 md:bottom-12 right-0 select-none print:hidden flex items-center"
          >
            <div className="relative flex items-center rounded-l-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white font-black assistant-radiant-glow border-l border-t border-b border-sky-400/30 overflow-hidden pl-1 pr-1.5 py-1 shadow-lg">
              {/* Soft animated shimmer */}
              <div className="absolute inset-0 -translate-x-full animate-assistant-shimmer bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

              {/* Expand button (tiny chevron) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRetract(false);
                }}
                className="w-5 sm:w-6 h-7 hover:bg-white/15 rounded-l-full text-white/80 hover:text-white active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                title="Expandir botão do Assistente"
                aria-label="Expandir botão do Assistente"
              >
                <ChevronLeft size={14} strokeWidth={2.5} />
              </button>

              {/* Minimalist Micro Trigger Button */}
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center w-7 h-7 rounded-full bg-slate-950/75 text-sky-300 border border-sky-400/40 hover:border-sky-300 shrink-0 shadow-inner active:scale-95 transition-all group ml-0.5 cursor-pointer"
                title="Liloupro Assistente (Toque para falar ou digitar)"
                aria-label="Liloupro Assistente"
              >
                <Mic size={13} className="group-hover:scale-110 transition-transform stroke-[2.5]" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-300"></span>
                </span>
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Main Assistant Modal / Flyout Card */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10010] flex items-end sm:items-end sm:justify-end sm:p-6">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { stopListening(); setIsOpen(false); }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
            />

            {/* Assistant Panel */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`relative z-10 w-full sm:w-[420px] h-[85vh] sm:h-[620px] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl border ${
                isLight 
                  ? 'bg-white text-slate-900 border-slate-200' 
                  : 'bg-slate-950 text-slate-100 border-blue-500/40 shadow-blue-950/50'
              } overflow-hidden`}
            >
              {/* Header */}
              <div className={`p-4 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/30">
                    <Bot size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-wide flex items-center gap-1.5">
                      <span>Liloupro Assistente</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-sky-400 border border-blue-500/30 font-black uppercase">
                        Voz & Texto
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5">
                  {/* Wake Word ("Oi Lilou") Mode Toggle */}
                  <button
                    type="button"
                    onClick={toggleWakeWord}
                    title={
                      wakeWordEnabled 
                        ? "Modo de escuta ativa 'Oi Lilou' ligado. Diga 'Oi Lilou' ou 'Ok Lilou' a qualquer momento. Toque para desligar." 
                        : "Ligar modo de escuta 'Oi Lilou' (permite chamar o assistente dizendo 'Oi Lilou' ou 'Ok Lilou' sem as mãos)"
                    }
                    className={`flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm shrink-0 border ${
                      wakeWordEnabled
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-amber-500/10'
                        : isLight
                          ? 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-800'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    <Radio size={13} className={wakeWordEnabled ? 'animate-pulse text-amber-400' : ''} />
                    <span className="hidden xs:inline">"Oi Lilou"</span>
                    <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full ${
                      wakeWordEnabled ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-700/60 text-slate-400'
                    }`}>
                      {wakeWordEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* TTS Voice Toggle */}
                  <button
                    onClick={toggleSpeechSynthesis}
                    title={speechSynthesisEnabled ? "Respostas com áudio ativadas" : "Respostas com áudio desativadas"}
                    className={`p-2 rounded-xl transition-all ${
                      speechSynthesisEnabled 
                        ? 'text-sky-400 hover:bg-blue-500/10' 
                        : 'text-slate-400 hover:bg-slate-500/10'
                    }`}
                  >
                    {speechSynthesisEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>

                  {/* Dock to side toggle */}
                  <button
                    onClick={() => toggleRetract()}
                    title={isRetracted ? "Fixar botão expandido" : "Recolher botão para a lateral"}
                    className="p-2 text-slate-400 hover:text-sky-400 hover:bg-blue-500/10 rounded-xl transition-all"
                  >
                    {isRetracted ? <Maximize2 size={15} /> : <ChevronRight size={16} />}
                  </button>

                  {/* Reset Chat */}
                  <button
                    onClick={() => {
                      if (currentAudioRef.current) {
                        try {
                          currentAudioRef.current.pause();
                          currentAudioRef.current.currentTime = 0;
                        } catch {}
                        currentAudioRef.current = null;
                      }
                      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                      }
                      setMessages([{
                        id: 'welcome-reset',
                        sender: 'assistant',
                        text: 'Histórico reiniciado! Em que posso ajudar você agora?',
                        timestamp: new Date()
                      }]);
                    }}
                    title="Limpar conversa"
                    className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-500/10 rounded-xl transition-all"
                  >
                    <RotateCcw size={15} />
                  </button>

                  {/* Close button */}
                  <button
                    onClick={() => {
                      stopListening();
                      if (currentAudioRef.current) {
                        try {
                          currentAudioRef.current.pause();
                          currentAudioRef.current.currentTime = 0;
                        } catch {}
                        currentAudioRef.current = null;
                      }
                      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                      }
                      setIsOpen(false);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-500/10 rounded-xl transition-all ml-1"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Contextual Screen Identification & "Como usar esta tela?" Button */}
              <div className={`px-3 sm:px-4 py-2 sm:py-2.5 border-b flex items-center justify-between gap-2.5 ${
                isLight 
                  ? 'bg-blue-50/70 border-slate-200' 
                  : 'bg-blue-950/30 border-blue-900/40'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                      Tela Atual
                    </div>
                    <div className="text-xs font-black truncate text-slate-200 mt-0.5" title={currentScreenTitle}>
                      {currentScreenTitle}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAskHowToUseThisScreen()}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-md shadow-blue-500/25 flex items-center gap-1.5 shrink-0 transition-all active:scale-95 min-h-[38px] sm:min-h-[40px] cursor-pointer"
                  title={`Abrir manual interativo de ${currentScreenTitle}`}
                >
                  <HelpCircle size={14} strokeWidth={2.5} className="text-sky-200 shrink-0" />
                  <span>Como usar esta tela?</span>
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-[13px] leading-relaxed">
                {messages.map((msg, index) => {
                  const isUser = msg.sender === 'user';
                  const itemKey = msg.id ? `${msg.id}-${index}` : `msg-${index}`;
                  return (
                    <motion.div
                      key={itemKey}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[90%] p-3.5 rounded-2xl ${
                          isUser
                            ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white font-medium rounded-tr-xs shadow-md shadow-blue-500/20'
                            : isLight
                              ? 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                              : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-xs'
                        }`}
                      >
                        {/* Message content with bold support */}
                        <div className="whitespace-pre-line space-y-1">
                          {msg.text.split('\n').map((line, lIdx) => {
                            // Simple parser for bold **text**
                            const parts = line.split(/(\*\*.*?\*\*)/g);
                            return (
                              <p key={lIdx}>
                                {parts.map((part, pIdx) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={pIdx} className="font-black text-sky-400">{part.slice(2, -2)}</strong>;
                                  }
                                  return part;
                                })}
                              </p>
                            );
                          })}
                        </div>

                        {/* Step-by-step numbered checklist if provided */}
                        {msg.steps && msg.steps.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-700/40 space-y-1.5">
                            {msg.steps.map((step, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-1.5 text-[11px] leading-snug">
                                <ChevronRight size={13} className="text-sky-400 shrink-0 mt-0.5" />
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Interactive Direct Action Button(s) */}
                        {msg.actionLabel && msg.onActionClick && (
                          <div className={`mt-3 pt-2.5 border-t border-slate-700/40 ${msg.secondaryActionLabel ? 'space-y-2' : ''}`}>
                            <button
                              onClick={() => {
                                msg.onActionClick?.();
                              }}
                              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/25 active:scale-95 cursor-pointer"
                            >
                              {msg.actionIcon}
                              <span>{msg.actionLabel}</span>
                              <ArrowRight size={13} strokeWidth={3} className="ml-auto" />
                            </button>

                            {msg.secondaryActionLabel && msg.onSecondaryActionClick && (
                              <button
                                onClick={() => {
                                  msg.onSecondaryActionClick?.();
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/25 active:scale-95 cursor-pointer"
                              >
                                {msg.secondaryActionIcon}
                                <span>{msg.secondaryActionLabel}</span>
                                <ArrowRight size={13} strokeWidth={3} className="ml-auto" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Indicativo Visual Dinâmico: Ouvindo + Transcrição Instantânea */}
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`p-4 rounded-2xl border shadow-xl ${
                      isLight 
                        ? 'bg-gradient-to-b from-blue-50 to-indigo-50/80 border-blue-300 text-slate-900' 
                        : 'bg-gradient-to-b from-slate-900/95 to-blue-950/90 border-blue-500/50 text-sky-100 shadow-blue-500/10'
                    } flex flex-col gap-3`}
                  >
                    {/* Header com radar visual e status */}
                    <div className="flex items-center justify-between gap-2 border-b border-blue-500/20 pb-2">
                      <div className="flex items-center gap-2">
                        {/* Radar pulsante de áudio */}
                        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/20 text-blue-400">
                          <span className="absolute inset-0 rounded-full bg-blue-500/40 animate-ping" />
                          <Mic size={15} className="relative z-10 animate-pulse text-blue-400" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            Lilou ouvindo agora...
                          </span>
                          <p className="text-[11px] text-slate-400">Fale naturalmente o que você precisa</p>
                        </div>
                      </div>

                      {/* Equalizador dinâmico de barras de voz */}
                      <div className="flex items-center gap-1 h-5 px-2 py-1 rounded-lg bg-blue-950/50 border border-blue-500/30">
                        <span className="w-1 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1 h-5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce"></span>
                        <span className="w-1 h-6 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                        <span className="w-1 h-3 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.35s]"></span>
                      </div>
                    </div>

                    {/* Transcrição Instantânea em Tempo Real */}
                    <div className={`p-3 rounded-xl border min-h-[48px] flex items-center gap-2 ${
                      isLight 
                        ? 'bg-white border-blue-200 text-slate-800' 
                        : 'bg-slate-950/80 border-blue-500/30 text-white'
                    }`}>
                      <span className="text-blue-400 font-bold shrink-0 text-xs">Você:</span>
                      {interimTranscript ? (
                        <p className="text-sm font-semibold text-emerald-400 dark:text-emerald-300 leading-snug flex-1 break-words animate-pulse">
                          "{interimTranscript}"
                          <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-400 animate-ping align-middle" />
                        </p>
                      ) : (
                        <p className="text-xs italic text-slate-400 dark:text-slate-400 flex-1">
                          Aguardando sua fala... Comece a falar!
                        </p>
                      )}
                    </div>

                    {/* Botão de conclusão rápida */}
                    <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                      <span className="text-slate-400 text-[10px]">
                        {interimTranscript ? '✓ Transcrição ativa em tempo real' : 'Microfone captando áudio'}
                      </span>
                      <button
                        type="button"
                        onClick={stopListening}
                        className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] shadow-sm active:scale-95 transition-all cursor-pointer"
                      >
                        Enviar agora
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Loading indicator */}
                {isLoading && !isListening && (
                  <div className="flex items-center gap-2 text-xs text-sky-400 p-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processando comando...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestion chips */}
              <div className={`px-3 py-2 border-t flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] whitespace-nowrap ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
              }`}>
                <button
                  type="button"
                  onClick={() => handleAskHowToUseThisScreen()}
                  className={`px-3 py-1 rounded-full border transition-all shrink-0 active:scale-95 font-bold flex items-center gap-1 shadow-sm ${
                    isLight 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700' 
                      : 'bg-blue-600 border-blue-500 text-white shadow-blue-500/30 hover:bg-blue-500'
                  }`}
                  title={`Abrir manual da tela: ${currentScreenTitle}`}
                >
                  <HelpCircle size={12} strokeWidth={2.5} />
                  <span>Como usar esta tela?</span>
                </button>

                <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider shrink-0 ml-1">
                  Dúvidas:
                </span>
                {/* New Natural Voice & Quick Actions */}
                <button
                  type="button"
                  onClick={() => handleQuickChip('Tocar próxima música')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 font-bold ${
                    isLight 
                      ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 text-emerald-900' 
                      : 'bg-emerald-950/70 border-emerald-500/50 hover:bg-emerald-900/80 text-emerald-300'
                  }`}
                  title="Comando de voz: 'Tocar próxima música'"
                >
                  ⏭️ Tocar próxima música
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickChip('Quantos membros na escala de hoje?')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 font-bold ${
                    isLight 
                      ? 'bg-purple-50 border-purple-300 hover:bg-purple-100 text-purple-900' 
                      : 'bg-purple-950/70 border-purple-500/50 hover:bg-purple-900/80 text-purple-300'
                  }`}
                  title="Comando de voz: 'Quantos membros na escala de hoje?'"
                >
                  👥 Membros na escala de hoje?
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickChip('Abrir cifra do próximo louvor')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 font-bold ${
                    isLight 
                      ? 'bg-amber-50 border-amber-300 hover:bg-amber-100 text-amber-900' 
                      : 'bg-amber-950/70 border-amber-500/50 hover:bg-amber-900/80 text-amber-300'
                  }`}
                  title="Comando de voz: 'Abrir cifra do próximo louvor'"
                >
                  🎼 Cifra do próximo louvor
                </button>
                <button
                  onClick={() => handleQuickChip('Como faço para agendar um culto?')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 font-semibold ${
                    isLight 
                      ? 'bg-blue-50 border-blue-300 hover:bg-blue-100 text-blue-900' 
                      : 'bg-blue-950/60 border-blue-600/40 hover:bg-blue-900/60 text-blue-300'
                  }`}
                >
                  🗓️ Como agendar culto?
                </button>
                <button
                  onClick={() => handleQuickChip('Como cadastrar uma música nova no app?')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 font-semibold ${
                    isLight 
                      ? 'bg-purple-50 border-purple-300 hover:bg-purple-100 text-purple-900' 
                      : 'bg-purple-950/60 border-purple-600/40 hover:bg-purple-900/60 text-purple-300'
                  }`}
                >
                  ➕ Como cadastrar música?
                </button>
                <button
                  onClick={() => handleQuickChip('Como cadastrar membro no ministério?')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 font-semibold ${
                    isLight 
                      ? 'bg-sky-50 border-sky-300 hover:bg-sky-100 text-sky-900' 
                      : 'bg-sky-950/60 border-sky-600/40 hover:bg-sky-900/60 text-sky-300'
                  }`}
                >
                  👥 Como cadastrar membro?
                </button>
                <button
                  onClick={() => handleQuickChip('Abra o afinador do app')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 font-semibold ${
                    isLight 
                      ? 'bg-amber-50 border-amber-300 hover:bg-amber-100 text-amber-900' 
                      : 'bg-amber-950/60 border-amber-600/40 hover:bg-amber-900/60 text-amber-300'
                  }`}
                >
                  🎯 Afinador
                </button>
                <button
                  onClick={() => handleQuickChip('Abra o metrônomo do app')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 font-semibold ${
                    isLight 
                      ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 text-emerald-900' 
                      : 'bg-emerald-950/60 border-emerald-600/40 hover:bg-emerald-900/60 text-emerald-300'
                  }`}
                >
                  ⏱️ Metrônomo
                </button>
                <button
                  onClick={() => handleQuickChip('Abra o repertório de músicas')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 ${
                    isLight 
                      ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  🎵 Repertório
                </button>
                <button
                  onClick={() => handleQuickChip('Tocar playlist do culto')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 ${
                    isLight 
                      ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  ▶️ Playlist
                </button>
                <button
                  onClick={() => handleQuickChip('Abra as escalas')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 ${
                    isLight 
                      ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  👥 Escalas
                </button>
                <button
                  onClick={() => handleQuickChip('Abra a liturgia')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 ${
                    isLight 
                      ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  🗓️ Liturgia
                </button>
                <button
                  onClick={() => handleQuickChip('Abra a bíblia no Salmo 23')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 ${
                    isLight 
                      ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  📖 Salmo 23
                </button>
                <button
                  onClick={() => handleQuickChip('Abra a projeção')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 ${
                    isLight 
                      ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  📺 Projeção
                </button>
                <button
                  onClick={() => handleQuickChip('Abra os membros')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 ${
                    isLight 
                      ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  👥 Membros
                </button>
                <button
                  onClick={() => handleQuickChip('Abra a disponibilidade')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 ${
                    isLight 
                      ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  🗓️ Disponibilidade
                </button>
              </div>

              {/* Input Area (Voice and Text) */}
              <div className={`p-3 border-t flex items-center gap-2 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                {/* Voice Mic Trigger */}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`p-2.5 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                      : 'bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:brightness-110 active:scale-95 shadow-md shadow-blue-500/30'
                  }`}
                  title={isListening ? "Parar gravação de voz" : "Falar por comando de voz"}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} strokeWidth={2.5} />}
                </button>

                {/* Text input for noisy environments */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleProcessInput(inputText);
                    }
                  }}
                  placeholder="Fale no microfone ou digite aqui..."
                  className={`flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border focus:outline-none transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 focus:border-sky-500 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-900 border-slate-800 focus:border-sky-500 text-slate-100 placeholder:text-slate-500'
                  }`}
                />

                {/* Send Button */}
                <button
                  type="button"
                  disabled={!inputText.trim()}
                  onClick={() => handleProcessInput(inputText)}
                  className={`p-2.5 rounded-full transition-all shrink-0 ${
                    inputText.trim()
                      ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:brightness-110 active:scale-95 shadow-md shadow-blue-500/30'
                      : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                  }`}
                  title="Enviar mensagem"
                >
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Screen Interactive Manual Modal */}
      <ScreenInteractiveManualModal
        isOpen={isInteractiveManualOpen}
        onClose={() => setIsInteractiveManualOpen(false)}
        theme={theme}
        initialScreenKey={interactiveManualKey}
        onOpenHelpCenter={onOpenHelpCenter}
      />
    </>
  );
}
