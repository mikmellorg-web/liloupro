import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Sparkles, Mic, MicOff, Send, X, Volume2, VolumeX, RotateCcw, 
  BookOpen, Music, Calendar, Plus, ChevronRight, ChevronLeft, HelpCircle,
  Tv, Maximize2, Check, ArrowRight, Loader2, Bot, Layers, CheckCircle2, Radio, Timer, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { findLocalPopularSong } from '../songsDatabase';
import { parseSpokenBibleCommand, isGeneralBibleRequest } from '../utils/bibleParser';
import { ScreenInteractiveManualModal, SCREEN_MANUALS } from './ScreenInteractiveManualModal';

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
  onOpenChange
}: LilouproAssistantProps) {
  const isLight = theme === 'light';
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = isOpenProp !== undefined;
  const isOpen = isControlled ? isOpenProp : internalIsOpen;

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
      return localStorage.getItem('liloupro_assistant_retracted') === 'true';
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

    window.addEventListener('liloupro:open-assistant', handleCustomOpen);
    window.addEventListener('liloupro:reset-assistant-pos', handleResetPos);
    return () => {
      window.removeEventListener('liloupro:open-assistant', handleCustomOpen);
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
      text: 'Olá! Sou o **Liloupro Assistente** 🎙️\nEstou aqui para guiá-lo em qualquer dúvida ou executar comandos de voz pelo app.',
      timestamp: new Date(),
      steps: [
        'Diga ex: "Como usar esta tela?"',
        'Diga ex: "Abrir player da música Teu amor não falha"',
        'Diga ex: "Abra o afinador do app"',
        'Diga ex: "Abra o metrônomo do app"',
        'Diga ex: "Abrir a bíblia do app no salmo 86"',
        'Pergunte ex: "Como faço para agendar um culto?"',
        'Pergunte ex: "Como cadastrar uma música nova no app?"'
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isListening, interimTranscript]);

  // Voice synthesis helper
  const speak = (textToSpeak: string) => {
    if (!speechSynthesisEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Clean markdown and symbols for clean spoken audio
      const clean = textToSpeak
        .replace(/\*\*/g, '')
        .replace(/[#_*~`]/g, '')
        .replace(/🎙️|🎵|📖|🗓️|➕|📺|✓/g, '')
        .trim();
      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang === 'pt-BR' || v.lang.startsWith('pt'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  const toggleSpeechSynthesis = () => {
    setSpeechSynthesisEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('liloupro_assistant_tts', String(next));
      } catch {}
      if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  // Initialize Speech Recognition
  const startListening = () => {
    if (typeof window === 'undefined') return;
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

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
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
          setInterimTranscript(interim);
        }

        if (final) {
          setInterimTranscript(final);
          stopListening();
          handleProcessInput(final);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        setInterimTranscript('');
        if (event.error === 'not-allowed') {
          addMessage({
            id: getUniqueAssistantMsgId('assistant'),
            sender: 'assistant',
            text: 'O acesso ao microfone foi negado. Habilite a permissão de áudio nas configurações do seu navegador ou digite sua dúvida no campo de texto!',
            timestamp: new Date()
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Speech recognition start failed:", e);
      setIsListening(false);
    }
  };

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
    // Normalize speech recognition phonetic variations in Portuguese
    norm = norm
      .replace(/\babril\b/g, 'abrir')
      .replace(/\babri\b/g, 'abrir')
      .replace(/\babriu\b/g, 'abrir')
      .replace(/\btoqua\b/g, 'toca')
      .replace(/\btoqui\b/g, 'toque');

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
    // 1. INTENT: ABRIR BÍBLIA (Passagem específica ou leitor geral)
    // Ex: "abra a bíblia em Marcos 12:20", "abra a bíblia", "salmo 23", "abrir bíblia"
    // ==========================================
    const parsedBible = parseSpokenBibleCommand(text);
    const isGeneralBible = !parsedBible && (
      isGeneralBibleRequest(text) ||
      ((norm.startsWith('abra') || norm.startsWith('abrir') || norm.startsWith('abre')) && (norm.includes('biblia') || norm.includes('escritura')))
    );

    if (parsedBible || isGeneralBible) {
      setIsLoading(false);

      if (parsedBible) {
        const { bookName, chapter, verse, displayText } = parsedBible;
        const verseText = verse !== undefined ? `, versículo **${verse}**` : '';
        const speechVerse = verse !== undefined ? `, versículo ${verse}` : '';
        const replyText = `Abrindo a Bíblia do Liloupro no livro de **${bookName}**, capítulo **${chapter}**${verseText}!`;
        const speakText = `Abrindo a Bíblia do Liloupro em ${bookName}, capítulo ${chapter}${speechVerse}.`;

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: `📖 Abrir ${displayText}`,
          actionIcon: <BookOpen size={15} />,
          actionSuccessMessage: `✓ Bíblia aberta em ${displayText}!`,
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
        const replyText = 'Abrindo a Bíblia Sagrada do Liloupro!';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '📖 Acessar Bíblia',
          actionIcon: <BookOpen size={15} />,
          actionSuccessMessage: '✓ Bíblia aberta com sucesso!',
          onActionClick: () => {
            onNavigate('bible');
            setIsOpen(false);
          }
        });

        speak(replyText);

        setTimeout(() => {
          onNavigate('bible');
          setIsOpen(false);
        }, 1000);

        return;
      }
    }

    // ==========================================
    // 2. INTENT: AFINADOR CROMÁTICO (LiLouPro Tuner)
    // Ex: "Abra o afinador do app", "abra o afinador", "afinar violão", "afinador"
    // ==========================================
    if (
      norm.includes('afinador') ||
      norm.includes('afinar violao') ||
      norm.includes('afinar instrumento') ||
      norm.includes('afinar meu violao') ||
      norm.includes('afinar meu instrumento') ||
      norm.includes('afinar guitarra') ||
      norm.includes('afinar baixo') ||
      norm.includes('afinar o baixo') ||
      norm.includes('afinar a guitarra') ||
      norm.includes('afinar o violao')
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
          actionSuccessMessage: '✓ Afinador aberto com sucesso!',
          onActionClick: () => {
            onOpenTuner?.();
            setIsOpen(false);
          }
        });

        speak('O afinador cromático fica na barra de ferramentas das cifras, ou você pode abri-lo agora tocando no botão.');
        return;
      } else {
        const replyText = 'Abrindo o **Afinador Cromático** do LiLouPro com detecção precisa por microfone!';
        const speakText = 'Abrindo o afinador cromático do aplicativo!';

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '🎯 Abrir Afinador Cromático',
          actionIcon: <Radio size={15} />,
          actionSuccessMessage: '✓ Afinador aberto com sucesso!',
          onActionClick: () => {
            onOpenTuner?.();
            setIsOpen(false);
          }
        });

        speak(speakText);

        setTimeout(() => {
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
      (norm.includes('ritmo') && (norm.startsWith('abra') || norm.startsWith('abrir') || norm.startsWith('abre')))
    ) {
      setIsLoading(false);

      const isPurelyQuestion = (
        norm.startsWith('como funciona') ||
        norm.startsWith('o que e') ||
        norm.startsWith('onde fica')
      ) && !norm.includes('abra') && !norm.includes('abrir') && !norm.includes('abre') && !norm.includes('iniciar');

      if (isPurelyQuestion) {
        const replyText = 'O **Metrônomo Interativo** do LiLouPro fica na barra de ferramentas das cifras e também pode ser aberto a qualquer momento:';
        const steps = [
          '1. Toque em qualquer música para abrir a cifra.',
          '2. Na barra de ferramentas, toque no botão do **Metrônomo (BPM)**.',
          '3. Ajuste o andamento (BPM), fórmula de compasso (4/4, 3/4, 6/8, 2/4) e divisões rítmicas.',
          '4. Use o botão **Tap Tempo** para encontrar a velocidade batendo o dedo.',
          '5. Ou abra-o instantaneamente dizendo: *"Abra o metrônomo do app"*.'
        ];

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          steps: steps,
          timestamp: new Date(),
          actionLabel: '⏱️ Abrir Metrônomo',
          actionIcon: <Timer size={15} />,
          actionSuccessMessage: '✓ Metrônomo aberto!',
          onActionClick: () => {
            onOpenMetronome?.();
            setIsOpen(false);
          }
        });

        speak('O metrônomo fica nas cifras ou você pode abri-lo agora mesmo!');
        return;
      } else {
        const replyText = 'Abrindo o **Metrônomo Interativo** do LiLouPro com controle de BPM, Tap Tempo e fórmulas de compasso!';
        const speakText = 'Abrindo o metrônomo do aplicativo!';

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '⏱️ Abrir Metrônomo',
          actionIcon: <Timer size={15} />,
          actionSuccessMessage: '✓ Metrônomo aberto com sucesso!',
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
    // 4. INTENT: PROJEÇÃO / TELÃO (Abertura Direta)
    // Ex: "abra a projeção", "abrir telão", "abra o modo projeção", "abra os slides"
    // ==========================================
    if (
      (norm.startsWith('abra') || norm.startsWith('abrir') || norm.startsWith('abre') || norm.startsWith('ir para') || norm.startsWith('acessar')) &&
      (norm.includes('projecao') || norm.includes('telao') || norm.includes('slides') || norm.includes('letras na tv') || norm.includes('modo projecao'))
    ) {
      setIsLoading(false);
      const replyText = 'Abrindo o modo de **Projeção para Telão e TV**!';
      const speakText = 'Abrindo a tela de projeção!';

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '📺 Ir para Projeção',
        actionIcon: <Tv size={15} />,
        actionSuccessMessage: '✓ Projeção aberta!',
        onActionClick: () => {
          onNavigate('projection');
          setIsOpen(false);
        }
      });

      speak(speakText);

      setTimeout(() => {
        onNavigate('projection');
        setIsOpen(false);
      }, 1000);

      return;
    }

    // ==========================================
    // 5. INTENT: LITURGIA / CULTOS (Abertura Direta)
    // Ex: "abra a liturgia", "abrir cultos", "abra os cultos", "abra o culto"
    // ==========================================
    if (
      (norm.startsWith('abra') || norm.startsWith('abrir') || norm.startsWith('abre') || norm.startsWith('ir para') || norm.startsWith('acessar')) &&
      (norm.includes('liturgia') || norm.includes('culto') || norm.includes('cultos') || norm.includes('ordem do culto'))
    ) {
      setIsLoading(false);
      const replyText = 'Abrindo a aba de **Liturgia e Cultos**!';
      const speakText = 'Abrindo liturgia e cultos!';

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '📅 Ir para Liturgia',
        actionIcon: <Calendar size={15} />,
        actionSuccessMessage: '✓ Liturgia aberta!',
        onActionClick: () => {
          onNavigate('liturgy');
          setIsOpen(false);
        }
      });

      speak(speakText);

      setTimeout(() => {
        onNavigate('liturgy');
        setIsOpen(false);
      }, 1000);

      return;
    }

    // ==========================================
    // 6. INTENT: ESCALAS / CALENDÁRIO (Abertura Direta)
    // Ex: "abra as escalas", "abrir escalas", "abra o calendário", "abra os voluntários"
    // ==========================================
    if (
      (norm.startsWith('abra') || norm.startsWith('abrir') || norm.startsWith('abre') || norm.startsWith('ir para') || norm.startsWith('acessar')) &&
      (norm.includes('escala') || norm.includes('escalas') || norm.includes('calendario') || norm.includes('voluntarios') || norm.includes('escalados'))
    ) {
      setIsLoading(false);
      const replyText = 'Abrindo a gestão de **Escalas e Calendário**!';
      const speakText = 'Abrindo escalas e calendário!';

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actionLabel: '👥 Ir para Escalas',
        actionIcon: <Calendar size={15} />,
        actionSuccessMessage: '✓ Escalas abertas!',
        onActionClick: () => {
          onNavigate('calendar');
          setIsOpen(false);
        }
      });

      speak(speakText);

      setTimeout(() => {
        onNavigate('calendar');
        setIsOpen(false);
      }, 1000);

      return;
    }

    // ==========================================
    // 7. INTENT: CADASTRO DE NOVA MÚSICA (Abertura Direta)
    // Ex: "abra cadastrar música", "abra nova música", "adicionar música", "cadastrar música"
    // ==========================================
    if (
      (norm.startsWith('abra') || norm.startsWith('abrir') || norm.startsWith('abre') || norm.startsWith('adicionar') || norm.startsWith('cadastrar')) &&
      (norm.includes('cadastrar musica') || norm.includes('cadastro de musica') || norm.includes('nova musica') || norm.includes('adicionar musica') || norm.includes('adicionar cifra'))
    ) {
      const isQuestion = norm.startsWith('como') || norm.startsWith('onde');
      if (!isQuestion) {
        setIsLoading(false);
        const replyText = 'Abrindo o formulário para **Cadastrar Nova Música**!';
        const speakText = 'Abrindo o cadastro de nova música!';

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '➕ Cadastrar Música',
          actionIcon: <Plus size={15} />,
          actionSuccessMessage: '✓ Formulário aberto!',
          onActionClick: () => {
            onOpenAddSong();
            setIsOpen(false);
          }
        });

        speak(speakText);

        setTimeout(() => {
          onOpenAddSong();
          setIsOpen(false);
        }, 1000);

        return;
      }
    }

    // ==========================================
    // 8. INTENT: TEORIA / MEMBROS / CHAT / AJUDA (Abertura Direta)
    // ==========================================
    if (norm.startsWith('abra') || norm.startsWith('abrir') || norm.startsWith('abre')) {
      if (norm.includes('teoria') || norm.includes('dicionario') || norm.includes('estudo')) {
        setIsLoading(false);
        const replyText = 'Abrindo a aba de **Teoria Musical e Dicionário de Acordes**!';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '🎼 Teoria Musical',
          actionIcon: <Music size={15} />,
          onActionClick: () => {
            onNavigate('theory');
            setIsOpen(false);
          }
        });
        speak('Abrindo teoria musical!');
        setTimeout(() => {
          onNavigate('theory');
          setIsOpen(false);
        }, 1000);
        return;
      }

      if (norm.includes('membros') || norm.includes('equipe') || norm.includes('musicos') || norm.includes('integrantes')) {
        setIsLoading(false);
        const replyText = 'Abrindo a gestão de **Membros e Equipe de Louvor**!';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '👥 Ver Membros',
          actionIcon: <Calendar size={15} />,
          onActionClick: () => {
            onNavigate('members');
            setIsOpen(false);
          }
        });
        speak('Abrindo equipe e membros!');
        setTimeout(() => {
          onNavigate('members');
          setIsOpen(false);
        }, 1000);
        return;
      }

      if (norm.includes('chat') || norm.includes('mensagens') || norm.includes('bate papo')) {
        setIsLoading(false);
        const replyText = 'Abrindo o **Chat da Equipe de Louvor**!';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '💬 Ir para Chat',
          actionIcon: <Bot size={15} />,
          onActionClick: () => {
            onNavigate('chat');
            setIsOpen(false);
          }
        });
        speak('Abrindo o chat da equipe!');
        setTimeout(() => {
          onNavigate('chat');
          setIsOpen(false);
        }, 1000);
        return;
      }

      if (norm.includes('ajuda') || norm.includes('suporte') || norm.includes('central de ajuda')) {
        setIsLoading(false);
        const replyText = 'Abrindo a **Central de Ajuda e Suporte**!';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '❓ Central de Ajuda',
          actionIcon: <HelpCircle size={15} />,
          onActionClick: () => {
            onOpenHelpCenter?.();
            setIsOpen(false);
          }
        });
        speak('Abrindo a central de ajuda!');
        setTimeout(() => {
          onOpenHelpCenter?.();
          setIsOpen(false);
        }, 1000);
        return;
      }
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
          actionSuccessMessage: '✓ Abrindo tela de Escalas!',
          onActionClick: () => {
            onNavigate('calendar');
            setIsOpen(false);
          }
        });

        speak('Para agendar um culto, vá na aba Escalas e clique em Novo Agendamento. Preencha o nome, tema, data e horário, e clique em Criar Agendamento. Depois, no card do culto, você escala os voluntários e vincula o repertório de músicas!');
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
          actionSuccessMessage: '✓ Abrindo cadastro de músicas!',
          onActionClick: () => {
            onOpenAddSong();
            setIsOpen(false);
          }
        });

        speak('Para cadastrar uma música, abra a aba Músicas e clique em Cadastrar Música. Você pode usar a busca automática integrada para importar a cifra, letra e tom com um toque!');
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
          actionSuccessMessage: '✓ Abrindo lista de membros!',
          onActionClick: () => {
            onNavigate('members');
            setIsOpen(false);
          }
        });

        speak('Para cadastrar um membro, vá na aba Membros, clique em Novo Membro, preencha os dados e selecione as funções ministeriais que ele exerce na equipe!');
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
          actionSuccessMessage: '✓ Abrindo tela de disponibilidade!',
          onActionClick: () => {
            onNavigate('availability');
            setIsOpen(false);
          }
        });

        speak('Para marcar disponibilidade, abra a aba Disponibilidade, marque verde para os dias que você pode servir e vermelho para os que não pode, depois clique em Salvar!');
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
          actionSuccessMessage: '✓ Abrindo liturgia!',
          onActionClick: () => {
            onNavigate('liturgy');
            setIsOpen(false);
          }
        });

        speak('Para montar a liturgia, acesse a aba Liturgia, selecione o culto e adicione os momentos da celebração vinculando as músicas do repertório!');
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
          actionSuccessMessage: '✓ Abrindo projeção!',
          onActionClick: () => {
            onNavigate('projection');
            setIsOpen(false);
          }
        });

        speak('Para projetar letras, abra a aba Projeção, clique em Abrir Tela do Telão, arraste para a TV e toque nas estrofes para transmitir ao vivo!');
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
          actionSuccessMessage: '✓ Abrindo músicas!',
          onActionClick: () => {
            onNavigate('songs');
            setIsOpen(false);
          }
        });

        speak('Para mudar o tom, abra a música e use os botões mais e menos de semitom no topo da tela. Todos os acordes e diagramas mudam instantaneamente!');
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
          actionSuccessMessage: '✓ Abrindo escalas!',
          onActionClick: () => {
            onNavigate('calendar');
            setIsOpen(false);
          }
        });

        speak('Para gerar escala com IA, vá na aba Escalas e clique no botão Gerar Escala com IA. A inteligência cruza as disponibilidades e funções dos voluntários automaticamente!');
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
          actionSuccessMessage: '✓ Abrindo escalas!',
          onActionClick: () => {
            onNavigate('calendar');
            setIsOpen(false);
          }
        });

        speak('Para compartilhar a escala, acesse a aba Escalas e use o botão WhatsApp para enviar ao grupo da equipe ou Baixar Escala Mês para gerar o PDF!');
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
          actionSuccessMessage: '✓ Afinador aberto!',
          onActionClick: () => {
            onOpenTuner?.();
            setIsOpen(false);
          }
        });

        speak('Para afinar, abra o afinador pelo assistente ou pela cifra, toque a corda do instrumento e acompanhe o ponteiro até ficar verde no centro!');
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
          actionSuccessMessage: '✓ Metrônomo aberto!',
          onActionClick: () => {
            onOpenMetronome?.();
            setIsOpen(false);
          }
        });

        speak('Para usar o metrônomo, diga abra o metrônomo ou abra pela cifra, ajuste o BPM ou dê toques no botão Tap Tempo para calcular o andamento da música!');
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
          actionSuccessMessage: '✓ Abrindo músicas!',
          onActionClick: () => {
            onNavigate('songs');
            setIsOpen(false);
          }
        });

        speak('O Modo Foco remove menus para estantes de partitura, com fontes ampliadas e rolagem automática ajustável para tocar no palco sem distrações!');
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
          actionSuccessMessage: '✓ Abrindo Bíblia!',
          onActionClick: () => {
            onNavigate('bible');
            setIsOpen(false);
          }
        });

        speak('Para ler ou projetar a Bíblia, peça qualquer versículo por voz como "abra a bíblia em Salmo 23" ou clique no botão projetar ao lado do versículo!');
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
          actionSuccessMessage: '✓ Abrindo músicas!',
          onActionClick: () => {
            onNavigate('songs');
            setIsOpen(false);
          }
        });

        speak('Para ensaiar, abra o Player da música dizendo "Tocar música" ou pela barra da cifra, e toque junto com o vídeo e áudio oficial!');
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

    const isSongCommand = !isQuestionOrHowTo && (
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
        // Then strip "tocar musica", "tocar a musica", "toque musica", "toque", "tocar", "ouvir", "reproduzir", "play"
        .replace(/^(abra|abrir|abre|ver|toque|tocar|toca|ouvir|reproduzir|dar\s+play|play|acesse|acessar)\s+(a\s+|o\s+)?(cifra|letra|musica|cancao|faixa|som|audio|video)\s+(da\s+musica\s+|de\s+musica\s+|da\s+|do\s+|de\s+)?/i, '')
        .replace(/^(abra|abrir|abre|ver|toque|tocar|toca|ouvir|reproduzir|dar\s+play|play|acesse|acessar)\s+(a\s+|o\s+)?(cifra|letra|musica|cancao|faixa|som|audio|video)\s+/i, '')
        .replace(/^(abra|abrir|abre|ver|toque|tocar|toca|ouvir|reproduzir|dar\s+play|play|acesse|acessar)\s+(a\s+|o\s+)?/i, '')
        .replace(/^(cifra|letra|musica|cancao|faixa)\s+(da\s+musica\s+|de\s+musica\s+|da\s+|do\s+|de\s+)/i, '')
        .replace(/^(cifra|letra|musica|cancao|faixa)\s+/i, '')
        .replace(/^[::\s\-–—"']+|["']+$/g, '')
        .replace(/\s+(no\s+|com\s+|pelo\s+)?(player|som|youtube)$/i, '')
        .trim();

      // If user asked to open player or play music without specifying a song
      if (isPlayerMode && (!cleanQuery || cleanQuery === 'player' || cleanQuery === 'musica' || cleanQuery === 'musicas' || cleanQuery === 'tal')) {
        if (currentSong) {
          setIsLoading(false);
          const replyText = `Tocando **"${currentSong.title}"** no player de áudio e vídeo!`;
          const speakText = `Tocando ${currentSong.title} no player!`;
          addMessage({
            id: getUniqueAssistantMsgId('assistant'),
            sender: 'assistant',
            text: replyText,
            timestamp: new Date(),
            actionLabel: `▶️ Tocar Música: ${currentSong.title}`,
            actionIcon: <Volume2 size={15} />,
            actionSuccessMessage: `✓ Player de ${currentSong.title} iniciado!`,
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
          const replyText = 'Qual música você gostaria de tocar? Diga por exemplo: *"Tocar música Teu amor não falha"* ou *"Abrir player da música Bondade de Deus"*.';
          addMessage({
            id: getUniqueAssistantMsgId('assistant'),
            sender: 'assistant',
            text: replyText,
            timestamp: new Date(),
            actionLabel: '🎵 Ver Músicas',
            actionIcon: <Music size={15} />,
            actionSuccessMessage: '✓ Repertório aberto!',
            onActionClick: () => {
              onNavigate('songs');
              setIsOpen(false);
            }
          });
          speak('Qual música você gostaria de tocar?');
          return;
        }
      }

      // If user just requested opening the general songbook
      if (!cleanQuery || cleanQuery === 'cifra' || cleanQuery === 'cifras' || cleanQuery === 'musica' || cleanQuery === 'musicas' || cleanQuery === 'repertorio') {
        setIsLoading(false);
        const replyText = 'Abrindo o repertório de **Músicas e Cifras**!';
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '🎵 Ir para Músicas',
          actionIcon: <Music size={15} />,
          actionSuccessMessage: '✓ Repertório aberto!',
          onActionClick: () => {
            onNavigate('songs');
            setIsOpen(false);
          }
        });
        speak('Abrindo o repertório de músicas e cifras!');
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
        foundSong = allSongs.find(s => {
          const titleNorm = normalize(s.title || '');
          const artistNorm = normalize(s.artist || '');
          return titleNorm.includes(cleanQuery) || cleanQuery.includes(titleNorm) || 
                 (artistNorm && (artistNorm.includes(cleanQuery) || cleanQuery.includes(artistNorm)));
        });
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
        const actionVerb = isTocarCommand ? 'Tocando' : (isPlayerMode ? 'Abrindo o player de' : (isLyricsOnly ? 'Abrindo a letra de' : 'Abrindo a cifra de'));
        const replyText = `${actionVerb} **"${foundSong.title}"**${focusText}${scrollText}!`;
        const speakText = `${actionVerb} ${foundSong.title}!`;

        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: isTocarCommand ? `▶️ Tocar Música: ${foundSong.title}` : (isPlayerMode ? `▶️ Abrir Player: ${foundSong.title}` : `🎵 Abrir ${foundSong.title}`),
          actionIcon: isPlayerMode ? <Volume2 size={15} /> : <Music size={15} />,
          actionSuccessMessage: `✓ ${isPlayerMode ? 'Player' : (isLyricsOnly ? 'Letra' : 'Cifra')} de ${foundSong.title} aberto${isFocusMode ? ' em Modo Foco' : ''}!`,
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
        norm.includes('cifra') ||
        norm.includes('musica') ||
        norm.includes('letra') ||
        norm.includes('player')
      ) {
        setIsLoading(false);
        const replyText = `Não encontrei a música **"${cleanQuery}"** no repertório. Deseja cadastrá-la agora mesmo?`;
        addMessage({
          id: getUniqueAssistantMsgId('assistant'),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
          actionLabel: '➕ Cadastrar Nova Música',
          actionIcon: <Plus size={15} />,
          actionSuccessMessage: '✓ Cadastro iniciado!',
          onActionClick: () => {
            onOpenAddSong();
            setIsOpen(false);
          }
        });
        speak(`Não encontrei a música ${cleanQuery} no repertório. Você pode cadastrá-la com um toque.`);
        return;
      }
    }

    // ==========================================
    // 9. GENERAL / AI FALLBACK (Via Gemini API ou Local Expert Guide)
    // ==========================================
    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-4).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiReply = data.reply || "Estou aqui para ajudar com qualquer dúvida do LiLouPro! Tente me perguntar como agendar um culto, cadastrar músicas ou abrir uma cifra.";
        
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
    } catch (apiErr) {
      console.warn("AI Assistant chat fetch failed, using local guide:", apiErr);
    }

    // Local graceful answer if network or API unreachable
    setIsLoading(false);
    const fallbackText = `Entendi sua dúvida sobre **"${text}"**.\nNo LiLouPro você tem acesso rápido a:\n• **Músicas**: Repertório, transposição de tom e diagramas.\n• **Liturgia & Escalas**: Agendamento de cultos e escalação da equipe.\n• **Bíblia**: Leitura completa offline de todos os 66 livros e Salmos.\n• **Projeção**: Transmissão em tempo real de letras no telão.`;

    addMessage({
      id: getUniqueAssistantMsgId('assistant'),
      sender: 'assistant',
      text: fallbackText,
      timestamp: new Date()
    });
    speak('Aqui está o guia rápido do Liloupro. Você pode navegar pelo menu ou tocar nas opções sugeridas!');
  };

  const handleQuickChip = (chipText: string) => {
    handleProcessInput(chipText);
  };

  return (
    <>
      {/* Floating Trigger Button (Hidden in Focus Mode, Retractable on Demand) */}
      <AnimatePresence mode="wait">
        {!isRetracted ? (
          <motion.div
            key="assistant-btn-expanded"
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="fixed z-[10005] bottom-[76px] sm:bottom-20 md:bottom-6 right-3 sm:right-6 select-none print:hidden flex items-center"
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
        ) : (
          <motion.div
            key="assistant-btn-retracted"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="fixed z-[10005] bottom-[86px] sm:bottom-24 md:bottom-12 right-0 select-none print:hidden flex items-center"
          >
            <div className="relative flex items-center rounded-l-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white font-black assistant-radiant-glow border-l border-t border-b border-sky-400/30 overflow-hidden pl-1.5 pr-2 py-1.5 shadow-xl">
              {/* Soft animated shimmer */}
              <div className="absolute inset-0 -translate-x-full animate-assistant-shimmer bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

              {/* Expand button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRetract(false);
                }}
                className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white active:scale-90 transition-all flex items-center justify-center"
                title="Expandir botão do Assistente"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>

              {/* Compact Trigger Button */}
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 sm:py-2 hover:bg-white/10 rounded-xl transition-all cursor-pointer active:scale-95 group"
                title="Liloupro Assistente (Toque para abrir)"
              >
                <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-slate-950/70 text-sky-300 border border-sky-400/40 shrink-0 shadow-inner group-hover:border-sky-300">
                  <Mic size={13} className="group-hover:scale-110 transition-transform stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  Assistente
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-300 opacity-90 animate-pulse" />
              </button>
            </div>
          </motion.div>
        )}
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

                <div className="flex items-center gap-1">
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

                        {/* Interactive Direct Action Button */}
                        {msg.actionLabel && msg.onActionClick && (
                          <div className="mt-3 pt-2.5 border-t border-slate-700/40">
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
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Real-time Listening Wave & Live Transcript */}
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-2xl border ${
                      isLight 
                        ? 'bg-sky-50/90 border-sky-300 text-slate-900' 
                        : 'bg-blue-950/40 border-blue-500/40 text-sky-200'
                    } flex flex-col items-center justify-center gap-2.5 text-center`}
                  >
                    <div className="flex items-center gap-1.5 h-6">
                      <span className="w-1.5 h-3 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-6 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-4 bg-sky-500 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-7 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                      <span className="w-1.5 h-3 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.35s]"></span>
                    </div>

                    <div className="space-y-1">
                      <p className="font-black text-xs uppercase tracking-wider text-sky-400 animate-pulse">
                        Ouvindo... Fale seu comando ou dúvida
                      </p>
                      {interimTranscript && (
                        <p className="text-xs italic font-medium opacity-90">
                          "{interimTranscript}"
                        </p>
                      )}
                    </div>

                    <button
                      onClick={stopListening}
                      className="text-[11px] px-3 py-1 rounded-full bg-slate-900 text-white hover:bg-slate-800 font-bold border border-slate-700"
                    >
                      Toque para Concluir
                    </button>
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
                  onClick={() => handleQuickChip('Abra a projeção')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 ${
                    isLight 
                      ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  📺 Projeção
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
