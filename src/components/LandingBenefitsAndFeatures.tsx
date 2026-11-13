import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Users, 
  Music, 
  Sliders, 
  Tv, 
  MessageSquare, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  Layers, 
  FileText,
  Volume2,
  Check,
  Zap,
  Heart,
  UserCheck,
  Upload,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  Video,
  Film,
  X,
  Monitor
} from 'lucide-react';
import { Music2 } from './MusicIcon';
import { 
  getLocalAsset, 
  setLocalAsset, 
  fetchOfficialLandingImages, 
  saveOfficialLandingImages 
} from '../utils/landingImageService';

interface LandingBenefitsAndFeaturesProps {
  onEnterApp: (mode: 'login' | 'signup') => void;
}

interface SimulatorCustomMedia {
  type: 'image' | 'video';
  url: string;
  isEmbed?: boolean;
}

const defaultModuleImages: Record<string, string> = {
  escala: '/assets/aistudio/Foto_Escala_do_Culto_373d59c4.png',
  cifras: '/assets/aistudio/image_ed96a73b.png',
  caged: '/assets/aistudio/image_1fbeb889.png',
  repertorio: '/assets/aistudio/image_ed670cb5.png',
  exclusivo: '/assets/aistudio/image_f1a7abe2_clean.png',
  liturgia: '/assets/aistudio/image_43623333.png',
  projecao: '/assets/aistudio/image_33eb4975.png',
  comunicacao: '/assets/aistudio/Interface_de_Chat_Canal_Geral_clean.png'
};

const defaultModuleVideos: Record<string, string> = {
  pedal: '/assets/aistudio/Rolagem_de_cifra_bdfa1655.mp4'
};

const defaultSimulatorMedia: Record<number, SimulatorCustomMedia> = {
  0: {
    type: 'video',
    url: '/assets/aistudio/Rolagem_de_cifra_bdfa1655.mp4',
    isEmbed: false
  },
  1: {
    type: 'image',
    url: '/assets/aistudio/image_1fbeb889.png'
  },
  2: {
    type: 'image',
    url: '/assets/aistudio/image_ed670cb5.png'
  }
};

export default function LandingBenefitsAndFeatures({ onEnterApp }: LandingBenefitsAndFeaturesProps) {
  // Estado para modal de detalhes dos módulos
  const [activeModuleModal, setActiveModuleModal] = useState<string | null>(null);
  const [specialBannerModal, setSpecialBannerModal] = useState<'disponibilidade' | 'academia' | 'biblia' | null>(null);

  // Estado para alternar entre Violão (5 Shapes CAGED) e Teclado Didático no card/modal e no simulador
  const [chordInstrumentTab, setChordInstrumentTab] = useState<'violao' | 'teclado' | 'transposicao_capo' | 'completa'>('violao');
  // Estado para alternar entre Transposição + Capo (lado a lado), Transposição, Capo e Cifra Completa no card de Cifras
  const [cifraCardSubTab, setCifraCardSubTab] = useState<'ambos' | 'transposicao' | 'capo' | 'cifra'>('ambos');
  // Estado para alternar entre Player sem Anúncios, Repertório/Playlist e Tuner/Metrônomo no card de Player & Estudo
  const [playerCardSubTab, setPlayerCardSubTab] = useState<'player' | 'playlist' | 'estudo'>('player');
  // Estado para alternar entre Bíblia/Harmonia e Seções/Dinâmica/Expressão no card Exclusivo LiLouPro
  const [exclusivoCardSubTab, setExclusivoCardSubTab] = useState<'biblia' | 'dinamica'>('dinamica');
  // Estado para alternar entre Pedal Bluetooth, Escala, Liturgia, Projeção e Chat no cenário 0 do simulador
  const [stageSimSubTab, setStageSimSubTab] = useState<'pedal' | 'escala' | 'liturgia' | 'projecao' | 'comunicacao'>('pedal');
  // Estado para alternar entre Player sem Anúncios, Exclusivo LiLouPro, Dinâmica/Expressão, Estudo e Playlist no cenário 2 do simulador
  const [exclusiveSimSubTab, setExclusiveSimSubTab] = useState<'player' | 'exclusivo' | 'dinamica' | 'estudo' | 'playlist'>('player');

  // Estado para imagens reais dos módulos (armazenadas em localStorage)
  const [moduleImages, setModuleImages] = useState<Record<string, string>>(defaultModuleImages);
  const [isDraggingModal, setIsDraggingModal] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [urlInputValue, setUrlInputValue] = useState<string>('');
  const [uploadToast, setUploadToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para mídias customizadas do Telão do Simulador (prints reais ou vídeos curtos)
  const [simulatorMedia, setSimulatorMedia] = useState<Record<number, SimulatorCustomMedia>>(defaultSimulatorMedia);
  const [isCustomizingSimulator, setIsCustomizingSimulator] = useState<boolean>(false);
  const [simUrlInput, setSimUrlInput] = useState<string>('');
  const [isDraggingSimulator, setIsDraggingSimulator] = useState<boolean>(false);
  const simulatorFileInputRef = useRef<HTMLInputElement>(null);

  // Carrega imagens salvas no IndexedDB e sincroniza com o servidor oficial
  useEffect(() => {
    let isMounted = true;
    (async () => {
      // 1. Carrega do cache local em IndexedDB (alta definição)
      try {
        const localModules = await getLocalAsset<Record<string, string>>('feature_module_images_v4');
        if (localModules && isMounted) {
          setModuleImages({ ...defaultModuleImages, ...localModules });
        } else {
          const saved = localStorage.getItem('liloupro_feature_module_images_v4');
          if (saved && isMounted) {
            setModuleImages({ ...defaultModuleImages, ...JSON.parse(saved) });
          }
        }
      } catch (e) {
        console.warn('Could not read module images from storage', e);
      }

      try {
        const localSim = await getLocalAsset<Record<number, SimulatorCustomMedia>>('simulator_custom_media_v4');
        if (localSim && isMounted) {
          setSimulatorMedia({ ...defaultSimulatorMedia, ...localSim });
        } else {
          const savedSim = localStorage.getItem('liloupro_simulator_custom_media_v4');
          if (savedSim && isMounted) {
            const parsed = JSON.parse(savedSim);
            const cleaned: Record<number, SimulatorCustomMedia> = { ...defaultSimulatorMedia };
            Object.entries(parsed).forEach(([key, val]) => {
              const item = val as any;
              if (item && item.url) {
                cleaned[Number(key)] = {
                  type: item.type === 'video' ? 'video' : 'image',
                  url: item.url,
                  isEmbed: !!item.isEmbed
                };
              }
            });
            setSimulatorMedia(cleaned);
          }
        }
      } catch (e) {
        console.warn('Could not read simulator media from storage', e);
      }

      // 2. Sincroniza com o servidor oficial do LiLouPro para o público
      try {
        const remote = await fetchOfficialLandingImages();
        if (remote && isMounted) {
          if (remote.moduleImages && Object.keys(remote.moduleImages).length > 0) {
            setModuleImages(prev => {
              const merged = { ...defaultModuleImages, ...prev, ...remote.moduleImages };
              setLocalAsset('feature_module_images_v4', merged);
              return merged;
            });
          }
          if (remote.simulatorMedia && Object.keys(remote.simulatorMedia).length > 0) {
            setSimulatorMedia(prev => {
              const merged = { ...defaultSimulatorMedia, ...prev, ...remote.simulatorMedia };
              setLocalAsset('simulator_custom_media_v4', merged);
              return merged;
            });
          }
        }
      } catch (e) {
        console.warn('Could not sync remote landing feature images', e);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const showFeedbackToast = (msg: string) => {
    setUploadToast(msg);
    setTimeout(() => setUploadToast(null), 3000);
  };

  const saveModuleImage = async (moduleId: string, dataUrl: string) => {
    setModuleImages(prev => {
      const updated = { ...prev, [moduleId]: dataUrl };
      setLocalAsset('feature_module_images_v3', updated);
      saveOfficialLandingImages({ moduleImages: { [moduleId]: dataUrl } });
      try {
        localStorage.setItem('liloupro_feature_module_images_v3', JSON.stringify(updated));
      } catch (e) {
        // quota excedida é contornada com sucesso pelo IndexedDB
      }
      return updated;
    });
    showFeedbackToast('Print real salvo em qualidade máxima original!');
  };

  const removeModuleImage = async (moduleId: string) => {
    setModuleImages(prev => {
      const updated = { ...prev };
      if (defaultModuleImages[moduleId]) {
        updated[moduleId] = defaultModuleImages[moduleId];
      } else {
        delete updated[moduleId];
      }
      setLocalAsset('feature_module_images_v3', updated);
      saveOfficialLandingImages({ moduleImages: { [moduleId]: updated[moduleId] || '' } });
      try {
        localStorage.setItem('liloupro_feature_module_images_v3', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    showFeedbackToast('Print restaurado para a imagem oficial.');
  };

  const processImageFile = (file: File, moduleId: string) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, envie um arquivo de imagem válido (PNG, JPG, WEBP, SVG, AVIF, etc).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawData = e.target?.result as string;
      if (!rawData) return;
      // QUALIDADE MÁXIMA NATIVA: Sem compressão JPEG ou perda de resolução
      saveModuleImage(moduleId, rawData);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeModuleModal) {
      processImageFile(file, activeModuleModal);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Funções do Simulador Interativo (Telão da Direita com Prints Reais e Vídeos Curtos)
  const saveSimulatorMedia = async (demoId: number, media: SimulatorCustomMedia) => {
    setSimulatorMedia(prev => {
      const updated = { ...prev, [demoId]: media };
      setLocalAsset('simulator_custom_media_v3', updated);
      saveOfficialLandingImages({ simulatorMedia: { [demoId]: media } });
      try {
        localStorage.setItem('liloupro_simulator_custom_media_v3', JSON.stringify(updated));
      } catch (e) {
        // quota excedida é contornada com sucesso pelo IndexedDB
      }
      return updated;
    });
    showFeedbackToast(media.type === 'video' ? 'Vídeo curto configurado no telão!' : 'Print real configurado em alta definição!');
  };

  const removeSimulatorMedia = async (demoId: number) => {
    setSimulatorMedia(prev => {
      const updated = { ...prev };
      if (defaultSimulatorMedia[demoId]) {
        updated[demoId] = defaultSimulatorMedia[demoId];
      } else {
        delete updated[demoId];
      }
      setLocalAsset('simulator_custom_media_v3', updated);
      saveOfficialLandingImages({ simulatorMedia: { [demoId]: updated[demoId] || null } });
      try {
        localStorage.setItem('liloupro_simulator_custom_media_v3', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    showFeedbackToast('Mídia oficial restaurada.');
  };

  const processSimulatorFile = (file: File, demoId: number) => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg)$/i.test(file.name);
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert('Por favor, selecione um arquivo de imagem (PNG, JPG, WEBP, SVG) ou vídeo curto (MP4, WEBM).');
      return;
    }

    if (isVideo) {
      if (file.size > 8 * 1024 * 1024) {
        showFeedbackToast('Vídeo maior que 8MB. Para vídeos mais longos, recomendamos colar o link do YouTube ou MP4 direto.');
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          saveSimulatorMedia(demoId, {
            type: 'video',
            url: dataUrl,
            isEmbed: false
          });
          setIsCustomizingSimulator(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawData = e.target?.result as string;
        if (!rawData) return;
        // QUALIDADE MÁXIMA: Preserva resolução nativa do print
        saveSimulatorMedia(demoId, {
          type: 'image',
          url: rawData
        });
        setIsCustomizingSimulator(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulatorFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSimulatorFile(file, activeDemo);
    }
    if (simulatorFileInputRef.current) simulatorFileInputRef.current.value = '';
  };

  const handleApplySimulatorUrl = (url: string, demoId: number) => {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Detecta se é link de YouTube
    const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      saveSimulatorMedia(demoId, {
        type: 'video',
        url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}`,
        isEmbed: true
      });
      setSimUrlInput('');
      setIsCustomizingSimulator(false);
      return;
    }

    // Detecta se é link de Vimeo
    const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      saveSimulatorMedia(demoId, {
        type: 'video',
        url: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1`,
        isEmbed: true
      });
      setSimUrlInput('');
      setIsCustomizingSimulator(false);
      return;
    }

    // Detecta se é arquivo de vídeo direto (.mp4, .webm, .mov, .ogg)
    const isVideoExt = /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(trimmed);
    if (isVideoExt) {
      saveSimulatorMedia(demoId, {
        type: 'video',
        url: trimmed,
        isEmbed: false
      });
    } else {
      saveSimulatorMedia(demoId, {
        type: 'image',
        url: trimmed
      });
    }
    setSimUrlInput('');
    setIsCustomizingSimulator(false);
  };

  const handleSimulatorFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingSimulator(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSimulatorFile(file, activeDemo);
    }
  };

  // Estado para a Seção: Veja o LiLouPro Funcionando (Simulador interativo)
  const [activeDemo, setActiveDemo] = useState<number>(0);
  const [demoProgress, setDemoProgress] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  const demos = [
    {
      id: 0,
      title: "Pedal Bluetooth, Escala, Liturgia, Projeção & Chat",
      badge: "Palco, Escala, Liturgia, Mídia & Chat",
      duration: "Vídeo + Fotos Reais",
      subtitle: "Controle a rolagem da cifra com Pedal Bluetooth e acompanhe a Escala, o Cronograma Litúrgico, o Painel do Operador de Mídia e o Chat da equipe.",
      steps: [
        { label: "1. Pedal Bluetooth & Escala do Culto", desc: "Rolagem mãos-livres no palco e confirmação em 1 toque" },
        { label: "2. Liturgia & Cronograma Interativo", desc: "Tocar Setlist, Cifras do Culto, Leituras Bíblicas e Ministro" },
        { label: "3. Projeção em Tempo Real & Chat", desc: "Avisos rápidos, cronômetro, alertas no telão e Canal Geral" }
      ],
      mockupType: "escala"
    },
    {
      id: 1,
      title: "5 Shapes do CAGED (Violão/Guitarra), Tom 1 Clique & Capo",
      badge: "Violão/Guitarra, Tom, Capo & Teclado",
      duration: "Prints Reais",
      subtitle: "No violão e guitarra, explore os 5 shapes do CAGED como variação do mesmo acorde. Para tecladistas, alterne para o Teclado Didático Centrado.",
      steps: [
        { label: "1. 5 Shapes do CAGED (Violão/Guitarra)", desc: "Variações do mesmo acorde em 5 regiões do braço" },
        { label: "2. Transposição 1 Clique & Capotraste", desc: "Mude entre os 12 tons e veja as casas com Shape Aberto" },
        { label: "3. Modo Teclado Didático Centrado", desc: "Visualização própria para teclas com Baixo (B) e Notas (N)" }
      ],
      mockupType: "cifra"
    },
    {
      id: 2,
      title: "LiLouPro Player sem Anúncios & Recursos Exclusivos",
      badge: "Player sem Anúncios • Exclusivo PRO",
      duration: "Prints Reais",
      subtitle: "Ouça e repita a música no LiLouPro Player sem anúncios direto na cifra, com Fundamentação Bíblica, Sugestões do Mesmo Tema, Harmonia, Tuner e Metrônomo.",
      steps: [
        { label: "1. LiLouPro Player sem Anúncios", desc: "Modo Pratique flutuante na cifra com função Repetir" },
        { label: "2. Fundamentação Bíblica & Harmonia", desc: "Base teológica, sugestões do mesmo tema e análise harmônica" },
        { label: "3. Minha Playlist, Tuner & Metrônomo", desc: "Repertório organizado com afinador e metrônomo stompbox" }
      ],
      mockupType: "projecao"
    }
  ];

  // Auto-play do simulador interativo (quando ativado)
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setDemoProgress((prev) => {
        if (prev >= 100) {
          setActiveDemo((current) => (current + 1) % demos.length);
          return 0;
        }
        return prev + 4;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isAutoPlaying, demos.length]);

  const handleSelectDemo = (idx: number) => {
    setIsAutoPlaying(false);
    setActiveDemo(idx);
    setDemoProgress(0);
  };

  // MÓDULOS COM CONSEQUÊNCIAS E PRINTS REAIS EM DESTAQUE NA PÁGINA
  const consequenceModules = [
    {
      id: "repertorio",
      title: "LiLouPro Player sem Anúncios, Playlist e Estúdio",
      featureLabel: "Módulo • Player sem Anúncios & Estúdio",
      icon: Music,
      isExclusive: true,
      exclusiveBadge: "PLAYER SEM ANÚNCIOS",
      description: "Ouça e repita a música direto na cifra sem propagandas, organize sua Playlist e use o Afinador e Metrônomo.",
      benefits: [
        "LiLouPro Player (Modo Pratique) sem anúncios direto na tela da cifra",
        "Repertório Musical organizado com Minha Playlist e integração Drive",
        "LiLouPro Tuner PRO e Metrônomo Stompbox integrados"
      ]
    },
    {
      id: "pedal",
      title: "Rolagem Automática com Pedal Bluetooth no Palco",
      featureLabel: "Módulo • Pedal Bluetooth & Modo Palco",
      icon: Zap,
      isExclusive: true,
      exclusiveBadge: "CONTROLE POR PEDAL BLUETOOTH",
      description: "Toque com as mãos livres no instrumento acionando e controlando a rolagem da cifra pelo seu Pedal Bluetooth.",
      benefits: [
        "Controle de rolagem mãos-livres via Pedal Bluetooth",
        "Modo Culto/Palco de alto contraste com tags de dinâmica",
        "Ajuste fino de velocidade (0.2x a 2.0x) e tamanho de fonte"
      ]
    },
    {
      id: "escala",
      title: "Auto-Escala e Confirmação sem Confusão no WhatsApp",
      featureLabel: "Módulo • Confirmação & Escala do Culto",
      icon: Calendar,
      isExclusive: false,
      exclusiveBadge: "AUTO-ESCALA & CONFIRMAÇÃO",
      description: "Voluntários confirmam presença em 1 toque. Monte a equipe com Auto-Escala e exporte em PDF, WhatsApp e Agenda.",
      benefits: [
        "Confirmação de disponibilidade em tempo real por voluntário",
        "Composição visual da escala com funções e edição rápida",
        "Integração com WhatsApp, PDF, Google Agenda e Google Docs"
      ]
    },
    {
      id: "cifras",
      title: "Transposição em 1 Clique & Cálculo do Capotraste",
      featureLabel: "Módulo • Transposição 1 Clique & Capotraste",
      icon: FileText,
      isExclusive: true,
      exclusiveBadge: "TOM EM 1 CLIQUE + CAPO",
      description: "Mude o tom em 1 clique entre os 12 tons e veja em qual casa usar o capotraste com shapes abertos.",
      benefits: [
        "Transposição de tom em 1 clique com indicação do Shape base",
        "Caixa de Posições do Capotraste com destaque de '🎸 Shape Aberto'",
        "Cifra completa em 1 ou 2 colunas com Modo Foco e Dinâmicas"
      ]
    },
    {
      id: "caged",
      title: "Violão & Guitarra: 5 Shapes do CAGED no Braço",
      featureLabel: "Módulo • Violão/Guitarra (CAGED) & Teclado",
      icon: Sliders,
      isExclusive: true,
      exclusiveBadge: "5 SHAPES CAGED (VIOLÃO/GUITARRA)",
      description: "Alterne entre os 5 shapes do CAGED para tocar o mesmo acorde em todo o braço ou use o Teclado Didático.",
      benefits: [
        "Violão e Guitarra: 5 Shapes do CAGED (Shape 1/5 a 5/5) + Dedos e Intervalos",
        "Análise em tempo real de Grau e Função Harmônica do acorde",
        "Piano e Teclado: Teclado Didático Centrado com Baixo (B) e Notas (N)"
      ]
    },
    {
      id: "exclusivo",
      title: "Seções Exclusivas, Dinâmica, Bíblia e Harmonia",
      featureLabel: "Exclusivo LiLouPro • Ferramentas Especiais",
      icon: Sparkles,
      isExclusive: true,
      exclusiveBadge: "EXCLUSIVO LILOUPRO",
      description: "Tags de seções, 7 níveis de dinâmica (Sutil ao Clímax), expressões, Fundamentação Bíblica e Harmonia Aplicada.",
      benefits: [
        "Seções e Partes da Música + 7 Níveis de Dinâmica Musical (N1 a N7)",
        "Indicadores de Intensidade & Expressão (Crescendo, Pausa, Acapella, etc.)",
        "Fundamentação Bíblica, Mesmo Tema e Harmonia Aplicada passo a passo"
      ]
    },
    {
      id: "liturgia",
      title: "Liturgia e Cronograma do Culto: Pastor, Banda e Mídia na mesma página",
      featureLabel: "Módulo • Liturgia & Cronograma do Culto",
      icon: Layers,
      isExclusive: false,
      exclusiveBadge: "LITURGIA & SETLIST DO CULTO",
      description: "Organize a ordem completa do culto com leituras bíblicas integradas (BLIVRE), músicas na sequência com indicação de Tom e ministro responsável, além de botões para Tocar Setlist, Cifras do Culto e Google Docs.",
      benefits: [
        "Cronograma numerado com passagens bíblicas e músicas do culto",
        "Indicação clara de Tom e ministro(a) em cada canção",
        "Acesso direto a 'Tocar Setlist', 'Cifras do Culto' e 'Google Docs'"
      ]
    },
    {
      id: "projecao",
      title: "Tela de Projeção e Painel de Controle em Tempo Real para o Operador de Mídia",
      featureLabel: "Módulo • Projeção & Controle de Mídia",
      icon: Tv,
      isExclusive: false,
      exclusiveBadge: "CONTROLE DE PROJEÇÃO AO VIVO",
      description: "Sincronize o telão com a liturgia do culto em 1 clique. O operador de mídia conta com atalhos de avisos rápidos, cronômetro regressivo no telão e letreiro de alertas (Chamar Berçário, Placa do Carro, Reunião).",
      benefits: [
        "Roteiro da liturgia sincronizado + busca rápida de Músicas e Bíblia",
        "Atalhos instantâneos (Boas-vindas, Celular Silencioso, Dízimos, Infantil)",
        "Cronômetro no telão (+1m a +15m) e Letreiro de Alertas (Marquee)"
      ]
    },
    {
      id: "comunicacao",
      title: "Chat da Equipe com Conversas sobre o Culto e Avisos Sincronizados",
      featureLabel: "Módulo • Chat & Comunicação da Equipe",
      icon: MessageSquare,
      isExclusive: false,
      exclusiveBadge: "CHAT DO MINISTÉRIO AO VIVO",
      description: "Converse com a equipe no Canal Geral diretamente dentro do LiLouPro. Veja quem está online, identifique os instrumentos de cada voluntário e alinhe repertório e ensaios sem mensagens perdidas.",
      benefits: [
        "Canal Geral sincronizado com identificação de instrumentos por membro",
        "Barra de reações rápidas musicais e ministeriais em 1 toque",
        "Conversas focadas no culto sem ruído ou distrações de redes sociais"
      ]
    }
  ];

  return (
    <div className="space-y-10 sm:space-y-12 py-4 sm:py-6">
      {/* SEÇÃO 4 & 5: AS FUNCIONALIDADES COM FOTOS E VÍDEO REAIS EM DESTAQUE */}
      <section id="funcionalidades" className="max-w-7xl mx-auto px-6 py-4 sm:py-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/25 text-brand text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Tecnologia & Recursos Exclusivos LiLouPro
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Veja as telas reais e os diferenciais exclusivos do LiLouPro
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Do <strong className="text-slate-200">LiLouPro Player sem anúncios</strong>, <strong className="text-slate-200">Controle de cifra por Pedal Bluetooth</strong> e <strong className="text-slate-200">Escala Inteligente do Culto</strong> até <strong className="text-slate-200">Transposição em 1 clique</strong>, <strong className="text-slate-200">Cálculo do Capotraste</strong>, e <strong className="text-slate-200">Shapes do CAGED</strong>.
          </p>
        </div>

        {/* Grid de Consequências e Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {consequenceModules.map((item) => {
            const IconComp = item.icon;
            const rawCardImage = moduleImages[item.id] || defaultModuleImages[item.id];
            const cardImage = item.id === 'caged'
              ? (chordInstrumentTab === 'teclado'
                  ? '/assets/aistudio/image_b8dba094.png'
                  : (moduleImages.caged || '/assets/aistudio/image_1fbeb889.png'))
              : item.id === 'cifras'
                ? (cifraCardSubTab === 'capo'
                    ? '/assets/aistudio/image_e6f41181.png'
                    : cifraCardSubTab === 'cifra'
                      ? '/assets/aistudio/image_bf73e394.png'
                      : '/assets/aistudio/image_ed96a73b.png')
                : item.id === 'repertorio'
                  ? (playerCardSubTab === 'playlist'
                      ? '/assets/aistudio/image_2266ed87_clean.png'
                      : playerCardSubTab === 'estudo'
                        ? '/assets/aistudio/image_b8efaf19.png'
                        : '/assets/aistudio/image_ed670cb5.png')
                  : item.id === 'exclusivo'
                    ? (exclusivoCardSubTab === 'dinamica'
                        ? '/assets/aistudio/image_d6211dcb.png'
                        : '/assets/aistudio/image_f1a7abe2_clean.png')
                    : rawCardImage;
            const cardVideo = defaultModuleVideos[item.id];

            return (
              <div
                key={item.id}
                onClick={() => setActiveModuleModal(item.id)}
                className={`bg-slate-900/60 hover:bg-slate-900 border ${
                  item.isExclusive
                    ? 'border-amber-500/35 hover:border-amber-400/70 shadow-amber-500/5'
                    : 'border-white/10 hover:border-brand/40'
                } rounded-3xl p-6 sm:p-7 space-y-5 transition-all duration-300 flex flex-col justify-between cursor-pointer group shadow-lg relative overflow-hidden`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`w-11 h-11 rounded-2xl ${
                      item.isExclusive
                        ? 'bg-amber-500/15 border border-amber-400/40 text-amber-400'
                        : 'bg-brand/15 border border-brand/30 text-brand'
                    } flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {item.exclusiveBadge && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm ${
                          item.isExclusive
                            ? 'text-amber-300 bg-amber-500/15 border border-amber-400/35'
                            : 'text-emerald-300 bg-emerald-500/15 border border-emerald-400/35'
                        }`}>
                          <Sparkles className={`w-2.5 h-2.5 ${item.isExclusive ? 'text-amber-400' : 'text-emerald-400'}`} />
                          {item.id === 'caged' && chordInstrumentTab === 'teclado'
                            ? 'TECLADO DIDÁTICO CENTRADO'
                            : item.exclusiveBadge}
                        </span>
                      )}
                      {!item.exclusiveBadge && (cardImage || cardVideo) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand bg-brand/10 border border-brand/25 px-2 py-0.5 rounded-full">
                          <ImageIcon className="w-3 h-3" />
                          Tela Real
                        </span>
                      )}
                      {!item.exclusiveBadge && !cardImage && !cardVideo && (
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                          {item.featureLabel.split('•')[1]?.trim()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Seletor rápido Violão (5 Shapes CAGED) vs Teclado Didático no card de Acordes */}
                  {item.id === 'caged' && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-between bg-slate-950/90 p-1 rounded-xl border border-white/10 text-[11px] font-bold"
                    >
                      <button
                        type="button"
                        onClick={() => setChordInstrumentTab('violao')}
                        className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          chordInstrumentTab !== 'teclado'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>🎸 Violão / Guitarra (5 Shapes CAGED)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setChordInstrumentTab('teclado')}
                        className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          chordInstrumentTab === 'teclado'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>🎹 Teclado</span>
                      </button>
                    </div>
                  )}

                  {/* Seletor rápido Transposição 1 Clique + Cálculo do Capotraste + Cifra no card de Cifras */}
                  {item.id === 'cifras' && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="grid grid-cols-4 gap-1 bg-slate-950/90 p-1 rounded-xl border border-white/10 text-[10px] font-bold"
                    >
                      <button
                        type="button"
                        onClick={() => setCifraCardSubTab('ambos')}
                        className={`py-1.5 px-1.5 rounded-lg transition-all cursor-pointer truncate ${
                          cifraCardSubTab === 'ambos'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🔀 Tom + Capo
                      </button>
                      <button
                        type="button"
                        onClick={() => setCifraCardSubTab('transposicao')}
                        className={`py-1.5 px-1.5 rounded-lg transition-all cursor-pointer truncate ${
                          cifraCardSubTab === 'transposicao'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🎵 1 Clique
                      </button>
                      <button
                        type="button"
                        onClick={() => setCifraCardSubTab('capo')}
                        className={`py-1.5 px-1.5 rounded-lg transition-all cursor-pointer truncate ${
                          cifraCardSubTab === 'capo'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🎸 Capotraste
                      </button>
                      <button
                        type="button"
                        onClick={() => setCifraCardSubTab('cifra')}
                        className={`py-1.5 px-1.5 rounded-lg transition-all cursor-pointer truncate ${
                          cifraCardSubTab === 'cifra'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🎼 Cifra 2 Col
                      </button>
                    </div>
                  )}

                  {/* Seletor rápido Player sem Anúncios vs Playlist vs Tuner/Metrônomo no card de Repertório & Player */}
                  {item.id === 'repertorio' && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="grid grid-cols-3 gap-1 bg-slate-950/90 p-1 rounded-xl border border-white/10 text-[10px] font-bold"
                    >
                      <button
                        type="button"
                        onClick={() => setPlayerCardSubTab('player')}
                        className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer truncate ${
                          playerCardSubTab === 'player'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ▶️ Player s/ Anúncios
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayerCardSubTab('playlist')}
                        className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer truncate ${
                          playerCardSubTab === 'playlist'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🎵 Minha Playlist
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayerCardSubTab('estudo')}
                        className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer truncate ${
                          playerCardSubTab === 'estudo'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🎧 Tuner & BPM
                      </button>
                    </div>
                  )}

                  {/* Seletor rápido Seções/Dinâmica/Expressão vs Bíblia/Harmonia no card Exclusivo LiLouPro */}
                  {item.id === 'exclusivo' && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="grid grid-cols-2 gap-1 bg-slate-950/90 p-1 rounded-xl border border-white/10 text-[10px] font-bold"
                    >
                      <button
                        type="button"
                        onClick={() => setExclusivoCardSubTab('dinamica')}
                        className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer truncate ${
                          exclusivoCardSubTab === 'dinamica'
                            ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🎚️ Dinâmica & Expressão
                      </button>
                      <button
                        type="button"
                        onClick={() => setExclusivoCardSubTab('biblia')}
                        className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer truncate ${
                          exclusivoCardSubTab === 'biblia'
                            ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        📖 Bíblia & Harmonia
                      </button>
                    </div>
                  )}

                  {/* Exibição de Vídeo Real direto no Card (ex: Rolagem por Pedal Bluetooth) */}
                  {cardVideo && (
                    <div className="relative w-full rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#0b1120] shadow-xl">
                      <div className="w-full h-56 sm:h-60 overflow-hidden flex items-center justify-center bg-[#0b1120]">
                        <video
                          src={cardVideo}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-contain scale-[1.03] transform-gpu"
                        />
                      </div>
                      <div className="px-3 py-1.5 bg-slate-950/95 border-t border-white/10 flex items-center justify-between text-[10px]">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          PEDAL BLUETOOTH + ROLAGEM ATIVA
                        </span>
                        <span className="text-slate-400 font-mono">Toque para ampliar</span>
                      </div>
                    </div>
                  )}

                  {/* Exibição de Foto Real direto no Card */}
                  {!cardVideo && cardImage && (
                    <div className="relative w-full rounded-2xl overflow-hidden border border-white/15 bg-[#0b1120] shadow-xl">
                      {item.id === 'cifras' && cifraCardSubTab === 'ambos' ? (
                        <div className="w-full h-56 sm:h-60 grid grid-cols-2 gap-1.5 p-1.5 bg-[#0b1120] items-center">
                          <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950/70 rounded-xl p-1 border border-white/10 overflow-hidden">
                            <img
                              src="/assets/aistudio/image_ed96a73b.png"
                              alt="Transposição de Tom em 1 Clique no LiLouPro"
                              loading="lazy"
                              decoding="async"
                              className="w-full h-44 sm:h-48 object-contain landing-crisp-img"
                            />
                            <span className="text-[9px] font-extrabold text-sky-400 uppercase tracking-wider mt-0.5">
                              🎵 Tom em 1 Clique
                            </span>
                          </div>
                          <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950/70 rounded-xl p-1 border border-amber-500/25 overflow-hidden">
                            <img
                              src="/assets/aistudio/image_e6f41181.png"
                              alt="Cálculo Automático da Posição do Capotraste no LiLouPro"
                              loading="lazy"
                              decoding="async"
                              className="w-full h-44 sm:h-48 object-contain landing-crisp-img"
                            />
                            <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-wider mt-0.5">
                              🎸 Cálculo do Capo
                            </span>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={cardImage}
                          alt={`Print real do LiLouPro - ${item.title}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-56 sm:h-60 object-contain block bg-[#0b1120] p-1 transition-transform duration-300 group-hover:scale-[1.02] landing-crisp-img"
                        />
                      )}
                      {item.id === 'caged' && (
                        <div className="px-3 py-1.5 bg-slate-950/95 border-t border-white/10 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-400">
                            {chordInstrumentTab === 'teclado'
                              ? '🎹 Teclado Didático: Baixo (B) + Notas (N)'
                              : '🎸 Violão/Guitarra: Shape 1/5 a 5/5 (CAGED)'}
                          </span>
                          <span className="text-slate-400">
                            {chordInstrumentTab === 'teclado' ? 'Graus & Teclas' : 'Dedos & Intervalos'}
                          </span>
                        </div>
                      )}
                      {item.id === 'escala' && (
                        <div className="px-3 py-1.5 bg-slate-950/95 border-t border-emerald-500/20 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-400">
                            ✓ Estou Disponível • Auto-Escala • PDF & WhatsApp
                          </span>
                          <span className="text-slate-400">Escala Real</span>
                        </div>
                      )}
                      {item.id === 'cifras' && (
                        <div className="px-3 py-1.5 bg-slate-950/95 border-t border-amber-500/20 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-400">
                            {cifraCardSubTab === 'capo'
                              ? '🎸 Caixa de Posições do Capo • Shape Aberto'
                              : cifraCardSubTab === 'transposicao'
                                ? '🎵 Transposição de Tom em 1 Clique (12 Tons)'
                                : cifraCardSubTab === 'cifra'
                                  ? '🎼 Cifra em 2 Colunas • Modo Foco & Dinâmicas'
                                  : '⚡ Transposição em 1 Clique + Cálculo do Capo'}
                          </span>
                          <span className="text-slate-400">Toque para ampliar</span>
                        </div>
                      )}
                      {item.id === 'repertorio' && (
                        <div className="px-3 py-1.5 bg-slate-950/95 border-t border-brand/25 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-400">
                            {playerCardSubTab === 'player'
                              ? '▶️ LiLouPro Player sem Anúncios • Modo Pratique'
                              : playerCardSubTab === 'playlist'
                                ? '🎵 Repertório Musical & Minha Playlist'
                                : '🎧 Tuner Cromático PRO & Metrônomo Stompbox'}
                          </span>
                          <span className="text-slate-400">Zero Propagandas</span>
                        </div>
                      )}
                      {item.id === 'exclusivo' && (
                        <div className="px-3 py-1.5 bg-slate-950/95 border-t border-amber-500/20 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-400">
                            {exclusivoCardSubTab === 'dinamica'
                              ? '🎚️ Seções • 7 Níveis de Dinâmica • Expressão'
                              : '✨ Bíblia • Mesmo Tema • Harmonia'}
                          </span>
                          <span className="text-slate-400">Exclusivo LiLouPro</span>
                        </div>
                      )}
                      {item.id === 'liturgia' && (
                        <div className="px-3 py-1.5 bg-slate-950/95 border-t border-sky-500/20 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-sky-400">
                            📖 Tocar Setlist • Cifras do Culto • Leituras & Tons
                          </span>
                          <span className="text-slate-400">Cronograma Real</span>
                        </div>
                      )}
                      {item.id === 'projecao' && (
                        <div className="px-3 py-1.5 bg-slate-950/95 border-t border-purple-500/20 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-purple-400">
                            🖥️ Avisos Rápidos • Cronômetro • Alerta Berçário
                          </span>
                          <span className="text-slate-400">Painel de Mídia</span>
                        </div>
                      )}
                      {item.id === 'comunicacao' && (
                        <div className="px-3 py-1.5 bg-slate-950/95 border-t border-emerald-500/20 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-400">
                            💬 Canal Geral Sincronizado • Funções & Reações
                          </span>
                          <span className="text-slate-400">Chat da Equipe</span>
                        </div>
                      )}
                    </div>
                  )}

                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-brand transition-colors leading-snug">
                    {item.id === 'caged' && chordInstrumentTab === 'teclado'
                      ? 'Piano & Teclado: Teclado Didático Centrado com Baixo (B) e Notas (N)'
                      : item.title}
                  </h3>

                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-2">
                    {item.id === 'caged' && chordInstrumentTab === 'teclado'
                      ? 'Visualização dedicada para tecladistas com Baixo (B), Notas do acorde (N), grau e função harmônica.'
                      : item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-2">
                  {item.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                  <div className="pt-2.5 flex items-center justify-between text-xs font-bold text-brand group-hover:underline">
                    <span className="flex items-center gap-1.5">
                      {cardVideo ? 'Assistir demonstração em tela cheia' : cardImage ? 'Ampliar tela real em alta definição' : 'Ver como funciona na prática'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200">
                      Ver detalhes
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SEÇÃO 6: VEJA FUNCIONANDO NA PRÁTICA (Simulador com Vídeo Real do Pedal Bluetooth e Prints Reais) */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-slate-900/80 border border-white/15 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Play className="w-3.5 h-3.5" />
              Demonstração Real do App
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Veja o sistema em funcionamento
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Navegue pelos cenários abaixo para assistir à rolagem por Pedal Bluetooth, ver a confirmação da Escala do Culto, Transposição em 1 Clique, Cálculo do Capotraste e o LiLouPro Player sem anúncios.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Lado Esquerdo: Abas de Cenários */}
            <div className="lg:col-span-5 space-y-3">
              {demos.map((demo, idx) => {
                const isActive = activeDemo === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectDemo(idx)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-950 border-brand/50 shadow-lg' 
                        : 'bg-slate-900/40 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-extrabold uppercase tracking-wider ${isActive ? 'text-brand' : 'text-slate-400'}`}>
                        {demo.badge}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        {demo.duration}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {demo.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {demo.subtitle}
                    </p>

                    {isActive && (
                      <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                        {demo.steps.map((step, sIdx) => (
                          <div key={sIdx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-0.5">
                            <span className="text-brand font-bold">{step.label}</span>
                            <span className="text-slate-300 text-[11px]">{step.desc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Lado Direito: Visualização Real da Interface (Vídeo Real do Pedal Bluetooth e Prints Reais) */}
            <div className="lg:col-span-7">
              {(() => {
                const baseMedia = simulatorMedia[activeDemo] || defaultSimulatorMedia[activeDemo];
                let currentMedia = baseMedia;

                // Permite alternar sub-abas visuais nos cenários 0, 1 e 2
                if (activeDemo === 0 && (!simulatorMedia[0] || simulatorMedia[0].url === defaultSimulatorMedia[0].url)) {
                  if (stageSimSubTab === 'escala') {
                    currentMedia = {
                      type: 'image',
                      url: '/assets/aistudio/Foto_Escala_do_Culto_373d59c4.png'
                    };
                  } else if (stageSimSubTab === 'liturgia') {
                    currentMedia = {
                      type: 'image',
                      url: '/assets/aistudio/image_43623333.png'
                    };
                  } else if (stageSimSubTab === 'projecao') {
                    currentMedia = {
                      type: 'image',
                      url: '/assets/aistudio/image_33eb4975.png'
                    };
                  } else if (stageSimSubTab === 'comunicacao') {
                    currentMedia = {
                      type: 'image',
                      url: '/assets/aistudio/Interface_de_Chat_Canal_Geral_clean.png'
                    };
                  } else {
                    currentMedia = {
                      type: 'video',
                      url: '/assets/aistudio/Rolagem_de_cifra_bdfa1655.mp4',
                      isEmbed: false
                    };
                  }
                } else if (activeDemo === 1 && (!simulatorMedia[1] || simulatorMedia[1].url === defaultSimulatorMedia[1].url)) {
                  const urlMap = {
                    violao: '/assets/aistudio/image_1fbeb889.png',
                    teclado: '/assets/aistudio/image_b8dba094.png',
                    transposicao_capo: '/assets/aistudio/image_ed96a73b.png',
                    completa: '/assets/aistudio/image_bf73e394.png'
                  };
                  currentMedia = {
                    type: 'image',
                    url: urlMap[chordInstrumentTab]
                  };
                } else if (activeDemo === 2 && (!simulatorMedia[2] || simulatorMedia[2].url === defaultSimulatorMedia[2].url)) {
                  const sim2UrlMap = {
                    player: '/assets/aistudio/image_ed670cb5.png',
                    dinamica: '/assets/aistudio/image_d6211dcb.png',
                    exclusivo: '/assets/aistudio/image_f1a7abe2_clean.png',
                    estudo: '/assets/aistudio/image_b8efaf19.png',
                    playlist: '/assets/aistudio/image_2266ed87_clean.png'
                  };
                  currentMedia = {
                    type: 'image',
                    url: sim2UrlMap[exclusiveSimSubTab]
                  };
                }

                return (
                  <div 
                    className={`bg-slate-950 border ${
                      currentMedia 
                        ? 'border-brand/40 shadow-brand/10' 
                        : 'border-white/10'
                    } rounded-3xl p-5 sm:p-6 shadow-2xl relative min-h-[400px] flex flex-col justify-between transition-all duration-300 overflow-hidden group`}
                  >
                    {/* Cabeçalho do Telão com Sub-seletores Interativos */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${currentMedia ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400'}`} />
                        <span className="text-xs font-bold text-white">
                          {demos[activeDemo].badge}
                        </span>
                      </div>

                      {/* Sub-abas do Cenário 0: Pedal Bluetooth, Escala, Liturgia, Projeção e Chat */}
                      {activeDemo === 0 && (
                        <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setStageSimSubTab('pedal')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              stageSimSubTab === 'pedal' ? 'bg-emerald-400 text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            🦶 Pedal Bluetooth
                          </button>
                          <button
                            type="button"
                            onClick={() => setStageSimSubTab('escala')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              stageSimSubTab === 'escala' ? 'bg-brand text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            📅 Escala
                          </button>
                          <button
                            type="button"
                            onClick={() => setStageSimSubTab('liturgia')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              stageSimSubTab === 'liturgia' ? 'bg-brand text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            📖 Liturgia
                          </button>
                          <button
                            type="button"
                            onClick={() => setStageSimSubTab('projecao')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              stageSimSubTab === 'projecao' ? 'bg-brand text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            🖥️ Projeção
                          </button>
                          <button
                            type="button"
                            onClick={() => setStageSimSubTab('comunicacao')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              stageSimSubTab === 'comunicacao' ? 'bg-brand text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            💬 Chat
                          </button>
                        </div>
                      )}

                      {/* Sub-abas do Cenário 1: 5 Shapes CAGED, Teclado, Transposição + Capo e Cifra Completa */}
                      {activeDemo === 1 && (
                        <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setChordInstrumentTab('violao')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              chordInstrumentTab === 'violao' ? 'bg-brand text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            🎸 5 Shapes CAGED
                          </button>
                          <button
                            type="button"
                            onClick={() => setChordInstrumentTab('transposicao_capo')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              chordInstrumentTab === 'transposicao_capo' ? 'bg-amber-400 text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            🔀 Tom 1 Clique & Capo
                          </button>
                          <button
                            type="button"
                            onClick={() => setChordInstrumentTab('teclado')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              chordInstrumentTab === 'teclado' ? 'bg-brand text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            🎹 Teclado
                          </button>
                          <button
                            type="button"
                            onClick={() => setChordInstrumentTab('completa')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              chordInstrumentTab === 'completa' ? 'bg-brand text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            🎼 Cifra
                          </button>
                        </div>
                      )}

                      {/* Sub-abas do Cenário 2: Player sem Anúncios, Dinâmica/Expressão, Exclusivo LiLouPro, Estudo e Playlist */}
                      {activeDemo === 2 && (
                        <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setExclusiveSimSubTab('player')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              exclusiveSimSubTab === 'player' ? 'bg-emerald-400 text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            ▶️ Player s/ Anúncios
                          </button>
                          <button
                            type="button"
                            onClick={() => setExclusiveSimSubTab('dinamica')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              exclusiveSimSubTab === 'dinamica' ? 'bg-sky-400 text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            🎚️ Dinâmica & Expressão
                          </button>
                          <button
                            type="button"
                            onClick={() => setExclusiveSimSubTab('exclusivo')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              exclusiveSimSubTab === 'exclusivo' ? 'bg-amber-400 text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            ✨ Bíblia & Harmonia
                          </button>
                          <button
                            type="button"
                            onClick={() => setExclusiveSimSubTab('playlist')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              exclusiveSimSubTab === 'playlist' ? 'bg-brand text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            🎵 Playlist
                          </button>
                          <button
                            type="button"
                            onClick={() => setExclusiveSimSubTab('estudo')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              exclusiveSimSubTab === 'estudo' ? 'bg-brand text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            🎧 Tuner & BPM
                          </button>
                        </div>
                      )}

                    </div>

                    {/* Corpo do Telão: Mídia Real em Alta Definição */}
                    <div className="py-3 my-auto flex flex-col justify-center">
                      {currentMedia && (
                        <div className="w-full flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-[#0b1120] border border-white/10 p-2 relative group/media">
                          {activeDemo === 1 && chordInstrumentTab === 'transposicao_capo' ? (
                            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 p-2 bg-[#0b1120] items-center">
                              <div className="flex flex-col items-center justify-center bg-slate-950/80 rounded-xl p-2 border border-white/10">
                                <img
                                  src="/assets/aistudio/image_ed96a73b.png"
                                  alt="Transposição de Tom em 1 Clique"
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full max-h-[360px] object-contain rounded-lg landing-crisp-img"
                                />
                                <span className="text-[11px] font-bold text-sky-400 mt-1.5">
                                  🎵 Transposição de Tom em 1 Clique
                                </span>
                              </div>
                              <div className="flex flex-col items-center justify-center bg-slate-950/80 rounded-xl p-2 border border-amber-500/30">
                                <img
                                  src="/assets/aistudio/image_e6f41181.png"
                                  alt="Cálculo Automático da Posição do Capotraste"
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full max-h-[360px] object-contain rounded-lg landing-crisp-img"
                                />
                                <span className="text-[11px] font-bold text-amber-400 mt-1.5">
                                  🎸 Cálculo do Capotraste (Shape Aberto)
                                </span>
                              </div>
                            </div>
                          ) : currentMedia.type === 'video' ? (
                            currentMedia.isEmbed ? (
                              <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black">
                                <iframe
                                  src={currentMedia.url}
                                  title={`Vídeo - ${demos[activeDemo].title}`}
                                  className="w-full h-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            ) : (
                              <div className="w-full overflow-hidden rounded-xl bg-[#0b1120] shadow-2xl flex items-center justify-center">
                                <video
                                  key={currentMedia.url}
                                  src={currentMedia.url}
                                  controls
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className="w-full max-h-[420px] object-contain scale-[1.02] transform-gpu bg-[#0b1120]"
                                />
                              </div>
                            )
                          ) : (
                            <img
                              src={currentMedia.url}
                              alt={demos[activeDemo].title}
                              loading="lazy"
                              decoding="async"
                              className="w-full max-h-[420px] object-contain rounded-xl shadow-2xl landing-crisp-img"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Barra de Rodapé do Telão */}
                    <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-300 font-medium">
                        {activeDemo === 0 && (
                          <span>
                            {stageSimSubTab === 'escala'
                              ? '📅 Escala do Culto: confirmação de disponibilidade em 1 toque, Auto-Escala e exportação completa'
                              : stageSimSubTab === 'liturgia'
                                ? '📖 Liturgia do Culto: cronograma com leituras bíblicas, músicas com Tom, Ministro e Tocar Setlist'
                                : stageSimSubTab === 'projecao'
                                  ? '🖥️ Painel de Projeção: avisos rápidos, cronômetro regressivo e letreiro de alertas ao vivo no telão'
                                  : stageSimSubTab === 'comunicacao'
                                    ? '💬 Chat do Ministério: Canal Geral sincronizado com funções musicais e reações rápidas'
                                    : '🦶 Pedal Bluetooth: acione a rolagem da cifra com o pé sem tirar as mãos do violão ou teclado'}
                          </span>
                        )}
                        {activeDemo === 1 && (
                          <span>
                            {chordInstrumentTab === 'transposicao_capo'
                              ? '⚡ Transposição em 1 Clique + Cálculo Inteligente do Capotraste com indicação de Shape Aberto'
                              : chordInstrumentTab === 'teclado'
                                ? '🎹 Modo Teclado Didático Centrado: visualização dedicada para teclas com Baixo (B) e Notas (N)'
                                : chordInstrumentTab === 'completa'
                                  ? '🎼 Cifra Completa em 2 Colunas: Modo Foco, marcações de dinâmica e visão harmônica'
                                  : '🎸 Exclusivo Violão e Guitarra: 5 Shapes do CAGED (1/5 a 5/5) para variar o mesmo acorde em todo o braço'}
                          </span>
                        )}
                        {activeDemo === 2 && (
                          <span>
                            {exclusiveSimSubTab === 'player'
                              ? '▶️ LiLouPro Player sem Anúncios: ouça e repita a música direto na tela da cifra sem propagandas'
                              : '✨ Exclusivo LiLouPro: Fundamentação Bíblica, Mesmo Tema, Harmonia, Playlist, Tuner e Metrônomo'}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onEnterApp('signup')}
                        className="text-xs font-bold text-brand hover:underline cursor-pointer shrink-0 ml-auto sm:ml-0"
                      >
                        Testar na minha igreja →
                      </button>
                    </div>

                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* RESPIRO VISUAL 4: MEMÓRIA DE MARCA */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="py-6 sm:py-8 px-6 sm:px-8 rounded-3xl bg-slate-900/80 border border-white/10 text-center space-y-2">
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight italic">
            "Menos improviso. Mais adoração."
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Quando a técnica e a organização funcionam em paz, o ministério floresce
          </p>
        </div>
      </section>

      {/* MODAL DE DETALHES DE MÓDULO COM VISUALIZADOR DE PRINT/VÍDEO REAL DO APP */}
      {activeModuleModal && (
        <div 
          onClick={() => {
            setActiveModuleModal(null);
            setShowUrlInput(false);
          }}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-white/15 rounded-3xl p-5 sm:p-8 max-w-3xl lg:max-w-4xl w-full max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl relative"
          >
            {(() => {
              const selected = consequenceModules.find(m => m.id === activeModuleModal);
              if (!selected) return null;
              const IconComp = selected.icon;
              const rawCurrentImage = moduleImages[selected.id] || defaultModuleImages[selected.id];
              const currentImage = selected.id === 'caged'
                ? (chordInstrumentTab === 'teclado'
                    ? '/assets/aistudio/image_b8dba094.png'
                    : (moduleImages.caged || '/assets/aistudio/image_1fbeb889.png'))
                : selected.id === 'cifras'
                  ? (cifraCardSubTab === 'capo'
                      ? '/assets/aistudio/image_e6f41181.png'
                      : cifraCardSubTab === 'cifra'
                        ? '/assets/aistudio/image_bf73e394.png'
                        : '/assets/aistudio/image_ed96a73b.png')
                  : selected.id === 'repertorio'
                    ? (playerCardSubTab === 'playlist'
                        ? '/assets/aistudio/image_2266ed87_clean.png'
                        : playerCardSubTab === 'estudo'
                          ? '/assets/aistudio/image_b8efaf19.png'
                          : '/assets/aistudio/image_ed670cb5.png')
                    : selected.id === 'exclusivo'
                      ? (exclusivoCardSubTab === 'dinamica'
                          ? '/assets/aistudio/image_d6211dcb.png'
                          : '/assets/aistudio/image_f1a7abe2_clean.png')
                      : rawCurrentImage;
              const currentVideo = defaultModuleVideos[selected.id];

              return (
                <>
                  {/* Cabeçalho do Modal */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand shrink-0">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand uppercase tracking-wider">
                            {selected.featureLabel}
                          </span>
                          {(currentImage || currentVideo) && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              {currentVideo ? 'Vídeo real em ação' : 'Tela Real do LiLouPro'}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                          {selected.id === 'caged' && chordInstrumentTab === 'teclado'
                            ? 'Piano & Teclado: Teclado Didático Centrado com Baixo (B) e Notas (N)'
                            : selected.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => {
                          setActiveModuleModal(null);
                          setShowUrlInput(false);
                        }}
                        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-base font-bold flex items-center justify-center transition-all cursor-pointer"
                        aria-label="Fechar"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Seletor rápido Violão (5 Shapes CAGED) vs Teclado no modal de Acordes */}
                  {selected.id === 'caged' && (
                    <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setChordInstrumentTab('violao')}
                        className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          chordInstrumentTab !== 'teclado'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        🎸 Violão / Guitarra (5 Shapes do CAGED • Dedos & Intervalos)
                      </button>
                      <button
                        type="button"
                        onClick={() => setChordInstrumentTab('teclado')}
                        className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          chordInstrumentTab === 'teclado'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        🎹 Teclado Didático Centrado (Baixo & Notas)
                      </button>
                    </div>
                  )}

                  {/* Seletor rápido Transposição 1 Clique + Capotraste + Cifra no modal de Cifras */}
                  {selected.id === 'cifras' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setCifraCardSubTab('ambos')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          cifraCardSubTab === 'ambos'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        🔀 Tom 1 Clique + Capo
                      </button>
                      <button
                        type="button"
                        onClick={() => setCifraCardSubTab('transposicao')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          cifraCardSubTab === 'transposicao'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        🎵 Transposição 1 Clique
                      </button>
                      <button
                        type="button"
                        onClick={() => setCifraCardSubTab('capo')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          cifraCardSubTab === 'capo'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        🎸 Cálculo do Capotraste
                      </button>
                      <button
                        type="button"
                        onClick={() => setCifraCardSubTab('cifra')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          cifraCardSubTab === 'cifra'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        🎼 Cifra Completa (2 Col)
                      </button>
                    </div>
                  )}

                  {/* Seletor rápido Player sem Anúncios + Playlist + Tuner/Metrônomo no modal de Repertório */}
                  {selected.id === 'repertorio' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setPlayerCardSubTab('player')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          playerCardSubTab === 'player'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        ▶️ LiLouPro Player sem Anúncios
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayerCardSubTab('playlist')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          playerCardSubTab === 'playlist'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        🎵 Repertório & Minha Playlist
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayerCardSubTab('estudo')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          playerCardSubTab === 'estudo'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        🎧 Tuner PRO & Metrônomo Stompbox
                      </button>
                    </div>
                  )}

                  {/* Seletor rápido Seções/Dinâmica/Expressão vs Bíblia/Harmonia no modal Exclusivo LiLouPro */}
                  {selected.id === 'exclusivo' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setExclusivoCardSubTab('dinamica')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          exclusivoCardSubTab === 'dinamica'
                            ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        🎚️ Seções da Música, 7 Níveis de Dinâmica & Expressão
                      </button>
                      <button
                        type="button"
                        onClick={() => setExclusivoCardSubTab('biblia')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          exclusivoCardSubTab === 'biblia'
                            ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        📖 Fundamentação Bíblica, Mesmo Tema & Harmonia
                      </button>
                    </div>
                  )}

                  {/* ÁREA DO VÍDEO REAL OU IMAGEM REAL */}
                  {currentVideo ? (
                    <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#0b1120] shadow-2xl flex flex-col items-center justify-center">
                      <div className="w-full overflow-hidden bg-[#0b1120] flex items-center justify-center">
                        <video
                          src={currentVideo}
                          controls
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full max-h-[480px] object-contain scale-[1.02] transform-gpu bg-[#0b1120]"
                        />
                      </div>
                      <div className="w-full py-2.5 px-4 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                        <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          Demonstração real: Rolagem de cifra controlada por Pedal Bluetooth
                        </span>
                      </div>
                    </div>
                  ) : currentImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-[#0b1120] shadow-2xl flex flex-col items-center justify-center transition-all">
                      {selected.id === 'cifras' && cifraCardSubTab === 'ambos' ? (
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#0b1120] items-center">
                          <div className="flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl p-3 border border-white/10">
                            <img
                              src="/assets/aistudio/image_ed96a73b.png"
                              alt="Transposição de Tom em 1 Clique no LiLouPro"
                              loading="lazy"
                              decoding="async"
                              className="w-full max-h-[400px] object-contain rounded-xl landing-crisp-img"
                            />
                            <span className="text-xs font-extrabold text-sky-400 mt-2">
                              🎵 Transposição de Tom em 1 Clique (12 Tons + ±1/2 Tom)
                            </span>
                          </div>
                          <div className="flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl p-3 border border-amber-500/30">
                            <img
                              src="/assets/aistudio/image_e6f41181.png"
                              alt="Cálculo Automático da Posição do Capotraste no LiLouPro"
                              loading="lazy"
                              decoding="async"
                              className="w-full max-h-[400px] object-contain rounded-xl landing-crisp-img"
                            />
                            <span className="text-xs font-extrabold text-amber-400 mt-2">
                              🎸 Cálculo Automático do Capotraste (Destaque Shape Aberto)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={currentImage} 
                          alt={`Print real do LiLouPro - ${selected.title}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full max-h-[480px] object-contain rounded-2xl block bg-[#0b1120] p-2 landing-crisp-img"
                        />
                      )}

                      {/* Rodapé da imagem */}
                      <div className="w-full py-2 px-4 bg-slate-950/90 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          Print real da tela do LiLouPro
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Informações detalhadas do módulo */}
                  <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 space-y-3">
                    <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                      {selected.description}
                    </p>

                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        O que sua equipe aproveita nesta funcionalidade:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {selected.benefits.map((b, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Modal com Botões de Ação */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => {
                        setActiveModuleModal(null);
                        onEnterApp('signup');
                      }}
                      className="w-full sm:flex-1 py-4 rounded-xl bg-brand hover:bg-brand/90 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-brand/20 transition-all cursor-pointer"
                    >
                      Experimentar grátis por 30 dias na sua igreja
                    </button>
                    <button
                      onClick={() => {
                        setActiveModuleModal(null);
                        setShowUrlInput(false);
                      }}
                      className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL PARA AMPLIAR AS 3 TELAS DA SEÇÃO DE DISPONIBILIDADE, ACADEMIA E BÍBLIA */}
      {specialBannerModal && (
        <div
          onClick={() => setSpecialBannerModal(null)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-white/15 rounded-3xl p-5 sm:p-8 max-w-3xl lg:max-w-4xl w-full max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl relative"
          >
            {(() => {
              const modalData = {
                disponibilidade: {
                  badge: 'Módulo • Minha Disponibilidade (3 Passos Simples)',
                  title: 'Minha Disponibilidade: Marque os dias de culto em 3 passos simples',
                  image: '/assets/aistudio/image_85ebf322.png',
                  description: 'No LiLouPro, cada músico voluntário informa sua agenda para o mês em apenas 3 passos intuitivos: Passo 1 (Marque no calendário os dias que você pode), Passo 2 (Confirme em "Conte Comigo" ou "Não Posso") e Passo 3 (Finalize e notifique a liderança).',
                  benefits: [
                    'Passo 1: Calendário visual com indicação dos cultos agendados',
                    'Passo 2: Botões rápidos "Conte Comigo" e "Não Posso"',
                    'Passo 3: Envio em 1 clique para atualizar a liderança em tempo real'
                  ]
                },
                academia: {
                  badge: 'Exclusivo LiLouPro • Curso Completo dentro do App',
                  title: 'Academia de Teoria Musical: Domine Harmonia e Arranjos',
                  image: '/assets/aistudio/image_6c194acd.png',
                  description: 'Um verdadeiro curso de teoria musical e harmonia dentro do aplicativo para capacitar toda a sua equipe de louvor a tocar com excelência, propósito e alto conhecimento teórico.',
                  benefits: [
                    'Módulos de Intervalos, Campo Harmônico e Inversões de Acordes',
                    'Funções Modernas, Cadências Harmônicas e Empréstimo Modal (E.M.)',
                    'Dominantes & SubV e modo prático de Auto-Desafio'
                  ]
                },
                biblia: {
                  badge: 'Módulo • Bíblia Sagrada Integrada no LiLouPro',
                  title: 'Bíblia Integrada: Acompanhe em Casa ou no Culto pelo LiLouPro',
                  image: '/assets/aistudio/image_47dfdafb.png',
                  description: 'O músico voluntário pode ler a Bíblia em casa ou acompanhar a Palavra durante o culto diretamente dentro do LiLouPro, sem precisar alternar entre aplicativos.',
                  benefits: [
                    'Ferramentas completas: Marcar versículos com cores, Anotar e Favoritar',
                    'Compartilhar e copiar versículos com 1 toque',
                    'Controle de tamanho de letra (A- / A+) e rolagem automática'
                  ]
                }
              }[specialBannerModal];

              return (
                <>
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                        {modalData.badge}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight mt-0.5">
                        {modalData.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSpecialBannerModal(null)}
                      className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-base font-bold flex items-center justify-center transition-all cursor-pointer shrink-0"
                      aria-label="Fechar"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setSpecialBannerModal('disponibilidade')}
                      className={`py-2 px-2 rounded-xl transition-all cursor-pointer truncate ${
                        specialBannerModal === 'disponibilidade'
                          ? 'bg-emerald-400 text-slate-950 font-extrabold shadow-md'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      👍 Minha Disponibilidade
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecialBannerModal('academia')}
                      className={`py-2 px-2 rounded-xl transition-all cursor-pointer truncate ${
                        specialBannerModal === 'academia'
                          ? 'bg-indigo-400 text-slate-950 font-extrabold shadow-md'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      🎓 Academia Musical
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecialBannerModal('biblia')}
                      className={`py-2 px-2 rounded-xl transition-all cursor-pointer truncate ${
                        specialBannerModal === 'biblia'
                          ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      📖 Bíblia Integrada
                    </button>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-white/15 bg-[#0b1120] shadow-2xl flex flex-col items-center justify-center">
                    <img
                      src={modalData.image}
                      alt={modalData.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full max-h-[480px] object-contain rounded-2xl block bg-[#0b1120] p-2 landing-crisp-img"
                    />
                    <div className="w-full py-2 px-4 bg-slate-950/90 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        Print real da tela do LiLouPro
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 space-y-3">
                    <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                      {modalData.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5">
                      {modalData.benefits.map((b, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
