import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Mic, MicOff, Send, X, Volume2, VolumeX, RotateCcw, 
  BookOpen, Music, Calendar, Plus, ChevronRight, ChevronLeft, HelpCircle,
  Tv, Maximize2, Check, ArrowRight, Loader2, Bot, Layers, CheckCircle2, Radio, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { findLocalPopularSong } from '../songsDatabase';
import { parseSpokenBibleCommand, isGeneralBibleRequest } from '../utils/bibleParser';

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
}

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
  currentTab = 'home'
}: LilouproAssistantProps) {
  const isLight = theme === 'light';
  const [isOpen, setIsOpen] = useState(false);
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

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Olá! Sou o **Liloupro Assistente** 🎙️\nEstou aqui para guiá-lo em qualquer dúvida ou executar comandos de voz pelo app.',
      timestamp: new Date(),
      steps: [
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

    const isSongCommand =
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
      norm.includes('rolagem');

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
    // 4. INTENT: COMO AGENDAR UM CULTO?
    // ==========================================
    if (
      norm.includes('agendar') && (norm.includes('culto') || norm.includes('evento')) ||
      norm.includes('como agendar') ||
      norm.includes('criar culto') ||
      norm.includes('marcar culto') ||
      norm.includes('novo culto')
    ) {
      setIsLoading(false);
      const replyText = 'Aqui está o passo a passo para **agendar um culto** no LiLouPro:';
      const steps = [
        '1. Clique na aba **Liturgia** (ou **Escalas**) no menu principal.',
        '2. Toque no botão **"+ Novo Culto / Evento"** no topo da tela.',
        '3. Preencha o nome do culto (ex: Domingo Noite), data, horário e ministério.',
        '4. Adicione os momentos da liturgia e vincule as músicas do repertório.',
        '5. Escale os músicos da equipe e acompanhe as confirmações de presença!'
      ];

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        steps: steps,
        timestamp: new Date(),
        actionLabel: '🗓️ Ir para Liturgia e Agendar',
        actionIcon: <Calendar size={15} />,
        onActionClick: () => {
          onNavigate('liturgy');
          setIsOpen(false);
        }
      });

      speak('Para agendar um culto, vá até a aba Liturgia ou Escalas e clique em Novo Culto. Lá você define data, horário, escala e o repertório da celebração!');
      return;
    }

    // ==========================================
    // 4. INTENT: COMO CADASTRAR UMA MÚSICA NOVA?
    // ==========================================
    if (
      norm.includes('cadastrar') && (norm.includes('musica') || norm.includes('cifra')) ||
      norm.includes('como cadastrar') ||
      norm.includes('adicionar musica') ||
      norm.includes('inserir musica') ||
      norm.includes('nova musica')
    ) {
      setIsLoading(false);
      const replyText = 'Aqui está o passo a passo para **cadastrar uma nova música**:';
      const steps = [
        '1. Acesse a aba **Músicas** (Repertório) no menu de navegação.',
        '2. Toque no botão **"+ Nova Música"** no canto superior direito.',
        '3. Digite o título e artista da canção.',
        '4. Escolha a **Busca Automática** (Cifra Club / YouTube) ou cole a cifra e letra manualmente.',
        '5. O LiLouPro detectará o tom original e gerará os diagramas de acordes automaticamente para violão!'
      ];

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        steps: steps,
        timestamp: new Date(),
        actionLabel: '➕ Cadastrar Nova Música Agora',
        actionIcon: <Plus size={15} />,
        onActionClick: () => {
          onOpenAddSong();
          setIsOpen(false);
        }
      });

      speak('Para cadastrar uma nova música, abra a aba Músicas e toque em Nova Música. Você pode digitar o nome e usar a busca automática integrada!');
      return;
    }

    // ==========================================
    // 5. INTENT: COMO PROJETAR LETRAS / TELÃO
    // ==========================================
    if (
      norm.includes('projetar') ||
      norm.includes('projecao') ||
      norm.includes('telao') ||
      norm.includes('transmissao') ||
      norm.includes('como projetar')
    ) {
      setIsLoading(false);
      const replyText = 'Para **projetar letras** na igreja ou telão:';
      const steps = [
        '1. Abra a aba **Projeção** no menu.',
        '2. Conecte o computador ao projetor ou TV (modo estender vídeo).',
        '3. Toque em **"Abrir Tela do Telão"** para abrir a janela limpa de projeção.',
        '4. No celular ou painel de controle, toque nas estrofes para trocar as frases em tempo real com fade suave!'
      ];

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        steps: steps,
        timestamp: new Date(),
        actionLabel: '📺 Abrir Modo Projeção',
        actionIcon: <Tv size={15} />,
        onActionClick: () => {
          onNavigate('projection');
          setIsOpen(false);
        }
      });

      speak('Para projetar letras, abra a aba Projeção e clique em Abrir Tela do Telão para transmitir as estrofes ao vivo!');
      return;
    }

    // ==========================================
    // 6. INTENT: COMO MUDAR TOM / TRANSPOSIÇÃO
    // ==========================================
    if (
      norm.includes('mudar tom') ||
      norm.includes('transpor') ||
      norm.includes('tom da cifra') ||
      norm.includes('como transpor') ||
      norm.includes('trocar tom')
    ) {
      setIsLoading(false);
      const replyText = 'Para **mudar o tom** de qualquer cifra no LiLouPro:';
      const steps = [
        '1. Abra qualquer música do seu repertório.',
        '2. No topo da cifra, clique nos botões **- (bemol)** ou **+ (sustenido)**.',
        '3. Todos os acordes da letra são transpostos instantaneamente.',
        '4. Os diagramas de acordes de violão se adaptam na mesma hora ao novo tom!'
      ];

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        steps: steps,
        timestamp: new Date(),
        actionLabel: '🎵 Ver Repertório de Músicas',
        actionIcon: <Music size={15} />,
        onActionClick: () => {
          onNavigate('songs');
          setIsOpen(false);
        }
      });

      speak('Para mudar o tom, abra a música e use os botões mais e menos de semitom no topo da tela!');
      return;
    }

    // ==========================================
    // 7. INTENT: COMO USAR O MODO FOCO
    // ==========================================
    if (
      norm.includes('como usar o modo foco') ||
      norm.includes('o que e modo foco') ||
      norm.includes('modo foco como funciona')
    ) {
      setIsLoading(false);
      const replyText = 'O **Modo Foco** foi desenhado para músicos no palco e estantes de partitura:';
      const steps = [
        '1. Ele oculta todas as barras de navegação e menus para deixar 100% da tela para a cifra.',
        '2. Aumenta o tamanho das fontes e dos acordes para leitura clara à distância.',
        '3. Permite ativar a **Rolagem Automática (AutoScroll)** na velocidade desejada.',
        '4. Suporta pedaleira Bluetooth (Footswitch) para rolar a página com os pés sem soltar o instrumento!'
      ];

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        steps: steps,
        timestamp: new Date()
      });

      speak('O Modo Foco oculta os menus do app para leitura limpa no palco, com fontes ampliadas e rolagem automática para o músico!');
      return;
    }

    // ==========================================
    // 8. INTENT: VER ESCALAS / CALENDÁRIO
    // ==========================================
    if (
      norm.includes('escalas') ||
      norm.includes('ver escala') ||
      norm.includes('calendario') ||
      norm.includes('quem toca')
    ) {
      setIsLoading(false);
      const replyText = 'Aqui estão as opções de **Escalas e Calendário**:';
      const steps = [
        'Acesse a aba **Escalas** para ver todos os cultos do mês, equipes escaladas e músicas escolhidas.'
      ];

      addMessage({
        id: getUniqueAssistantMsgId('assistant'),
        sender: 'assistant',
        text: replyText,
        steps: steps,
        timestamp: new Date(),
        actionLabel: '🗓️ Ver Escalas',
        actionIcon: <Calendar size={15} />,
        onActionClick: () => {
          onNavigate('calendar');
          setIsOpen(false);
        }
      });

      speak('Abrindo a central de escalas e calendário de cultos!');
      return;
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
            className="fixed z-[95] bottom-20 md:bottom-6 right-3 sm:right-6 select-none print:hidden flex items-center"
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
            className="fixed z-[95] bottom-24 md:bottom-12 right-0 select-none print:hidden flex items-center"
          >
            <div className="relative flex items-center rounded-l-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white font-black assistant-radiant-glow border-l border-t border-b border-sky-400/30 overflow-hidden pl-1 pr-1.5 py-1 shadow-xl">
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
                <span className="text-[10px] font-black uppercase tracking-wider hidden xs:inline sm:inline text-white">
                  Voz
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-300 opacity-90" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Assistant Modal / Flyout Card */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-end sm:justify-end sm:p-6">
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
                <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider shrink-0">
                  Dúvidas rápidas:
                </span>
                <button
                  onClick={() => handleQuickChip('Abra o afinador do app')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 font-semibold ${
                    isLight 
                      ? 'bg-amber-50 border-amber-300 hover:bg-amber-100 text-amber-900' 
                      : 'bg-amber-950/60 border-amber-600/40 hover:bg-amber-900/60 text-amber-300'
                  }`}
                >
                  🎯 Afinador do app
                </button>
                <button
                  onClick={() => handleQuickChip('Abra o metrônomo do app')}
                  className={`px-2.5 py-1 rounded-full border transition-all shrink-0 active:scale-95 font-semibold ${
                    isLight 
                      ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 text-emerald-900' 
                      : 'bg-emerald-950/60 border-emerald-600/40 hover:bg-emerald-900/60 text-emerald-300'
                  }`}
                >
                  ⏱️ Metrônomo do app
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
    </>
  );
}
