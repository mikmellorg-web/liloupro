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
  Monitor,
  ZoomIn,
  BookOpen
} from 'lucide-react';
import { Music2 } from './MusicIcon';
import { LiturgyReadyPreview, LiturgyEditorPreview } from './LiturgyPreviewMockups';
import {
  ProjectionDashboardPreview,
  ProjectionSlidesPreview,
  ProjectionOperatorGuidePreview
} from './ProjectionPreviewMockups';
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
  escala: '/tela-escalas.png',
  cifras: '/tela-cifra.png',
  caged: '/tela-harmonia.png',
  repertorio: '/tela-repertorio.png',
  exclusivo: '/assets/aistudio/image_f1a7abe2_clean.png',
  liturgia: '/assets/aistudio/image_43623333.png',
  projecao: '/assets/aistudio/image_33eb4975.png',
  comunicacao: '/assets/aistudio/Interface_de_Chat_Canal_Geral_clean.png',
  liturgia_culto: '/tela-liturgia-pronta.png'
};

const defaultModuleVideos: Record<string, string> = {
  pedal: '/assets/aistudio/Rolagem_de_cifra_bdfa1655.mp4'
};

const defaultSimulatorMedia: Record<number, SimulatorCustomMedia> = {
  0: {
    type: 'video',
    url: '/demo-pedal.mp4',
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

  // Estado para alternar entre Raio-X Harmônico, Violão (5 Shapes CAGED) e Teclado Didático no modal de Acordes
  const [chordInstrumentTab, setChordInstrumentTab] = useState<'harmonia' | 'violao' | 'teclado' | 'transposicao_capo' | 'completa'>('harmonia');
  // Estado para alternar entre Visão Geral (Mockup), Transposição + Capo (lado a lado), Transposição, Capo e Cifra Completa no modal de Cifras
  const [cifraCardSubTab, setCifraCardSubTab] = useState<'geral' | 'ambos' | 'transposicao' | 'capo' | 'cifra'>('geral');
  // Estado para alternar entre Player sem Anúncios, Repertório/Playlist e Tuner/Metrônomo no card de Player & Estudo
  const [playerCardSubTab, setPlayerCardSubTab] = useState<'player' | 'playlist' | 'estudo'>('player');
  // Estado para alternar entre Bíblia/Harmonia e Seções/Dinâmica/Expressão no card Exclusivo LiLouPro
  const [exclusivoCardSubTab, setExclusivoCardSubTab] = useState<'biblia' | 'dinamica'>('dinamica');
  // Estado para alternar entre Escala & Disparo WhatsApp e Disponibilidade em 3 Passos no modal de Escalas
  const [escalaCardSubTab, setEscalaCardSubTab] = useState<'escala' | 'disponibilidade'>('escala');
  // Estado para alternar entre Liturgia Pronta (Modo Culto) e Edição Customizável no modal de Liturgia
  const [liturgiaCardSubTab, setLiturgiaCardSubTab] = useState<'pronta' | 'edicao'>('pronta');
  // Estado para alternar entre Painel do Projetor, Slides da Letra & Simulador e Guia do Operador no modal de Projeção
  const [projecaoCardSubTab, setProjecaoCardSubTab] = useState<'painel' | 'slides' | 'guia'>('painel');
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
      title: "Rolagem Inteligente & Pedal Bluetooth",
      badge: "MODO PALCO & MÃOS LIVRES",
      duration: "Vídeo Real",
      subtitle: "Controle a rolagem da cifra com o pé usando Pedal Bluetooth ou ajuste a velocidade automática para tocar do início ao fim sem tirar as mãos do instrumento.",
      steps: [
        { label: "1. Acionamento com o Pé (Pedal Bluetooth)", desc: "Inicie, pause ou avance a cifra no palco sem tocar na tela" },
        { label: "2. Velocidade de Rolagem Ajustável", desc: "Controle fino de velocidade e tamanho da fonte para leitura perfeita" },
        { label: "3. Modo Palco de Alto Contraste", desc: "Visual limpo com acordes em destaque e marcações de dinâmica (Forte, Suave, Refrão)" }
      ],
      mockupType: "escala"
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
      title: "Repertório Musical Completo & Playlists do Ministério",
      featureLabel: "Módulo • Repertório & Playlists",
      icon: Music,
      isExclusive: true,
      exclusiveBadge: "REPERTÓRIO & PLAYLISTS",
      description: "Centralize todas as letras, cifras e áudios da igreja com busca instantânea, integração com Google Drive e playlists para ensaio.",
      benefits: [
        "Busca rápida por música, cantor, tema ou músicas do culto",
        "Playlists personalizadas para a equipe ouvir e ensaiar durante a semana"
      ]
    },
    {
      id: "escala",
      title: "Escalas Confirmadas no Celular & Disparo no WhatsApp",
      featureLabel: "Módulo • Escalas & Repertório",
      icon: Calendar,
      isExclusive: false,
      exclusiveBadge: "ESCALAS & REPERTÓRIO",
      description: "Seus músicos marcam os dias livres e você monta a escala do mês sem cobrar ninguém no grupo.",
      benefits: [
        "Confirmação de presença em 1 toque e lembretes no WhatsApp",
        "Repertório completo do culto conectado ao Google Docs e PDF"
      ]
    },
    {
      id: "cifras",
      title: "Cifra Inteligente, Tom em 1 Clique & Player sem Anúncios",
      featureLabel: "Módulo • Cifras, Tom & Player Integrado",
      icon: FileText,
      isExclusive: true,
      exclusiveBadge: "CIFRAS, TOM & PLAYER INTEGRADO",
      description: "Mude o tom na hora, calcule o capotraste e ouça a música de referência enquanto estuda a cifra.",
      benefits: [
        "Transposição instantânea com ajuste automático de capotraste",
        "Player integrado com YouTube, Spotify e marcações de dinâmica"
      ]
    },
    {
      id: "caged",
      title: "Contexto Harmônico & 5 Formas de Fazer o Mesmo Acorde",
      featureLabel: "Módulo • Acordes & Campo Harmônico",
      icon: Sliders,
      isExclusive: true,
      exclusiveBadge: "ACORDES & CAMPO HARMÔNICO",
      description: "Diagramas visuais no violão, guitarra e teclado com função de cada acorde no tom da música.",
      benefits: [
        "5 posições no braço com indicação de dedos e notas",
        "Campo harmônico visual para tocar com segurança sem decorar teoria"
      ]
    },
    {
      id: "liturgia_culto",
      title: "Liturgia Completa & Ordem do Culto em Tempo Real",
      featureLabel: "Módulo • Liturgia & Ordem do Culto",
      icon: BookOpen,
      isExclusive: false,
      exclusiveBadge: "LITURGIA & ORDEM DO CULTO",
      description: "Organize cada momento do culto com leituras bíblicas integradas, ministros, tons das músicas, playlist automática e exportação em 1 clique para o Google Docs.",
      benefits: [
        "Acesso rápido no celular com Tocar Setlist, Cifras do Culto e Google Docs",
        "Leituras bíblicas integradas e tons definidos para toda a equipe"
      ]
    },
    {
      id: "projecao_datashow",
      title: "Projeção Data Show, Letras Sincronizadas & Avisos ao Vivo",
      featureLabel: "Módulo • Projeção & Data Show",
      icon: Tv,
      isExclusive: false,
      exclusiveBadge: "PROJEÇÃO & DATA SHOW",
      description: "Controle o telão, TVs ou OBS Studio com sincronização instantânea da liturgia, slides de letras, cronômetro, alertas rolantes e controle remoto pelo celular.",
      benefits: [
        "Sincronização automática com o roteiro do culto, OBS Studio e Holyrics",
        "Atalhos de avisos rápidos, cronômetro e letreiro de alertas sem interromper o culto"
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
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Do <strong className="text-white">LiLouPro Player sem anúncios</strong>, <strong className="text-white">Controle de cifra por Pedal Bluetooth</strong> e <strong className="text-white">Escala Inteligente do Culto</strong> até <strong className="text-white">Transposição em 1 clique</strong>, <strong className="text-white">Cálculo do Capotraste</strong>, e <strong className="text-white">Contexto Harmônico do Acorde</strong>.
          </p>
        </div>

        {/* Grid de Consequências e Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {consequenceModules.map((item) => {
            const IconComp = item.icon;
            const rawCardImage = moduleImages[item.id] || defaultModuleImages[item.id];
            const cardImage = item.id === 'caged'
              ? '/tela-harmonia.png'
              : item.id === 'cifras'
                ? '/tela-cifra.png'
                : item.id === 'escala'
                  ? '/tela-escalas.png'
                  : item.id === 'repertorio'
                    ? '/tela-repertorio.png'
                    : item.id === 'liturgia_culto'
                      ? '/tela-liturgia-pronta.png'
                      : item.id === 'projecao_datashow'
                        ? 'vector:projecao_datashow'
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
                className={`h-full bg-[#111827] hover:bg-[#161F33] border ${
                  item.isExclusive
                    ? 'border-amber-500/35 hover:border-amber-400/70 shadow-amber-500/5'
                    : 'border-blue-400/20 hover:border-brand/40'
                } rounded-3xl p-4 sm:p-6 space-y-4 transition-all duration-300 flex flex-col justify-between cursor-pointer group shadow-xl shadow-black/30 relative overflow-hidden`}
              >
                <div className="space-y-3 sm:space-y-4">
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
                          {item.exclusiveBadge}
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
                    <div className="relative w-full space-y-2.5 pt-1.5">
                      {item.id === 'repertorio' || item.id === 'cifras' || item.id === 'caged' || item.id === 'escala' || item.id === 'liturgia_culto' || item.id === 'projecao_datashow' ? (
                        <div className="relative z-0 mx-auto w-full cursor-pointer group before:absolute before:-inset-2 before:rounded-[2rem] before:bg-gradient-to-tr before:from-blue-600/20 before:via-cyan-500/5 before:to-amber-500/15 before:blur-xl before:-z-10">
                          {/* Aro externo grafite/preto fosco */}
                          <div className="relative rounded-[1.65rem] p-[2.5px] bg-gradient-to-b from-zinc-500/40 via-zinc-800/60 to-zinc-950 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.85),0_0_20px_rgba(59,130,246,0.12)]">
                            {/* Botões físicos discretos no topo direito da carcaça */}
                            <div className="absolute -top-[4px] right-10 w-7 h-[3px] rounded-t bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-600 border-t border-white/30 pointer-events-none" />
                            <div className="absolute -top-[4px] right-20 w-5 h-[3px] rounded-t bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-600 border-t border-white/30 pointer-events-none" />

                            {/* Moldura preta de vidro (Bezel fino) */}
                            <div className="relative rounded-[1.5rem] bg-zinc-900 p-2 sm:p-2.5 shadow-[inset_0_0_6px_rgba(255,255,255,0.08)] border border-zinc-800">
                              {/* Câmera frontal no centro superior do Bezel */}
                              <div className="mx-auto mb-1.5 w-2 h-2 rounded-full bg-[#11131c] ring-1 ring-white/15 flex items-center justify-center pointer-events-none">
                                <span className="w-0.5 h-0.5 rounded-full bg-blue-400/70" />
                              </div>

                              {/* Tela interna nítida preenchendo 100% sem sobras laterais */}
                              <div className="relative w-full rounded-[1.05rem] overflow-hidden border border-white/10 bg-[#060d1f] aspect-[4/3]">
                                {item.id === 'liturgia_culto' ? (
                                  <div className="w-full h-full transition-transform duration-500 group-hover:scale-[1.02]">
                                    <LiturgyReadyPreview variant="compact" />
                                  </div>
                                ) : item.id === 'projecao_datashow' ? (
                                  <div className="w-full h-full transition-transform duration-500 group-hover:scale-[1.02]">
                                    <ProjectionDashboardPreview variant="compact" />
                                  </div>
                                ) : (
                                  <img
                                    src={cardImage}
                                    alt={`Print real do LiLouPro - ${item.title}`}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-fill object-top transition-transform duration-500 group-hover:scale-[1.03]"
                                  />
                                )}
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.07] z-10" />
                                <div className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-white/25 z-10" />
                                <div className="absolute bottom-2.5 right-2.5 z-20 pointer-events-none flex items-center gap-1.5 rounded-full bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-blue-300 border border-blue-400/30 shadow-lg">
                                  <ZoomIn className="w-3.5 h-3.5" />
                                  <span>Ampliar tela</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative overflow-hidden rounded-xl aspect-[16/10] bg-[#060d1f] border border-white/10 cursor-pointer">
                          <img
                            src={cardImage}
                            alt={`Print real do LiLouPro - ${item.title}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain block bg-[#0b1120] p-1 transition-transform duration-300 group-hover:scale-[1.02] landing-crisp-img"
                          />
                        </div>
                      )}
                      {item.id === 'caged' && (
                        <div className="px-3 py-1.5 rounded-xl bg-[#0B1120] border border-white/10 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-400">
                            🎸 5 formas de montar o mesmo acorde & campo harmônico
                          </span>
                          <span className="text-slate-300">Toque para ampliar</span>
                        </div>
                      )}
                      {item.id === 'escala' && (
                        <div className="px-3 py-1.5 rounded-xl bg-[#0B1120] border border-emerald-500/25 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-400">
                            ✓ Confirmação em 1 Toque • WhatsApp • Docs & PDF
                          </span>
                          <span className="text-slate-300">Escala Real</span>
                        </div>
                      )}
                      {item.id === 'cifras' && (
                        <div className="px-3 py-1.5 rounded-xl bg-[#0B1120] border border-amber-500/25 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-400">
                            ⚡ Cifra Inteligente • Tom em 1 Clique • Player Integrado
                          </span>
                          <span className="text-slate-300">Toque para ampliar</span>
                        </div>
                      )}
                      {item.id === 'repertorio' && (
                        <div className="px-3 py-1.5 rounded-xl bg-[#0B1120] border border-amber-500/25 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-400">
                            🎵 Repertório organizado por culto, artista e categoria
                          </span>
                          <span className="text-slate-300">Toque para ampliar</span>
                        </div>
                      )}
                      {item.id === 'liturgia_culto' && (
                        <div className="px-3 py-1.5 rounded-xl bg-[#0B1120] border border-sky-500/25 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-sky-400">
                            Ordem do culto, leituras bíblicas e cifras sincronizadas
                          </span>
                          <span className="text-slate-300">Tela Real</span>
                        </div>
                      )}
                      {item.id === 'projecao_datashow' && (
                        <div className="px-3 py-1.5 rounded-xl bg-[#0B1120] border border-purple-500/25 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-purple-400">
                            Projeção sincronizada, avisos rápidos e cronômetro no telão
                          </span>
                          <span className="text-slate-300">Tela Real</span>
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
                    {item.title}
                  </h3>

                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-2">
                    {item.description}
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
        <div className="bg-[#111827] border border-blue-400/20 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/40">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Play className="w-3.5 h-3.5" />
              Demonstração Real do App
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Veja o sistema em funcionamento
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Assista à rolagem inteligente da cifra no Modo Palco com acionamento mãos-livres por Pedal Bluetooth.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
                        ? 'bg-[#0F172A] border-brand/50 shadow-lg' 
                        : 'bg-slate-800/60 border-white/10 hover:border-white/20'
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
                      <div className="mt-4 pt-3 border-t border-white/10 space-y-2.5">
                        {demo.steps.map((step, sIdx) => (
                          <div key={sIdx} className="flex flex-col text-xs gap-0.5">
                            <span className="text-brand font-bold">{step.label}</span>
                            <span className="text-slate-300 text-[11px]">{step.desc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Card visual do Pedal Bluetooth M-VAVE no palco */}
              <div className="mt-4 rounded-2xl overflow-hidden border border-blue-400/25 bg-[#0F172A] shadow-xl relative group">
                <img
                  src="/pedal-bluetooth.png"
                  alt="Controlador Pedal Bluetooth M-VAVE no palco"
                  className="w-full h-56 sm:h-64 object-cover object-center"
                  loading="lazy"
                />
                <div className="bg-slate-950/85 backdrop-blur-md px-4 py-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-200 font-medium">
                    🦶 Compatível com M-VAVE Chocolate e pedais Bluetooth padrão
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full shrink-0">
                    Plug &amp; Play
                  </span>
                </div>
              </div>
            </div>

            {/* Lado Direito: Visualização Real da Interface (Vídeo Real do Pedal Bluetooth e Prints Reais) */}
            <div className="lg:col-span-7">
              {(() => {
                const baseMedia = simulatorMedia[activeDemo] || defaultSimulatorMedia[activeDemo];
                let currentMedia = baseMedia;

                // Permite alternar sub-abas visuais nos cenários 0, 1 e 2
                if (activeDemo === 0 && (!simulatorMedia[0] || simulatorMedia[0].url === defaultSimulatorMedia[0].url || simulatorMedia[0].url === '/assets/aistudio/Rolagem_de_cifra_bdfa1655.mp4')) {
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
                      url: '/demo-pedal.mp4',
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
                    className={`bg-[#0F172A] border ${
                      currentMedia 
                        ? 'border-blue-400/25 shadow-black/40' 
                        : 'border-white/15'
                    } rounded-3xl px-3 py-4 sm:p-6 shadow-2xl relative min-h-[400px] flex flex-col justify-between transition-all duration-300 overflow-hidden group`}
                  >
                    {/* Cabeçalho do Telão focado em Modo Palco & Pedal Bluetooth */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${currentMedia ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400'}`} />
                        <span className="text-xs font-bold text-white">
                          Modo Palco &amp; Rolagem por Pedal Bluetooth
                        </span>
                      </div>

                      <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-white/10 text-[11px] font-bold">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-400 text-slate-950 font-extrabold">
                          🦶 Pedal Bluetooth
                        </span>
                      </div>
                    </div>

                    {/* Corpo do Telão: Mídia Real em Alta Definição */}
                    <div className="py-3 my-auto flex flex-col justify-center">
                      {currentMedia && (
                        activeDemo === 0 && stageSimSubTab === 'pedal' && currentMedia.type === 'video' && !currentMedia.isEmbed ? (
                          <div className="w-full flex items-center justify-center py-2">
                            {/* Mockup ultrarrealista de Tablet adaptado exatamente à proporção natural do vídeo */}
                            <div className="relative z-0 w-full max-w-[540px] mx-auto before:absolute before:-inset-2 sm:before:-inset-3 before:rounded-[24px] before:bg-gradient-to-tr before:from-blue-600/25 before:via-cyan-500/10 before:to-emerald-500/20 before:blur-2xl before:-z-10">
                              <div className="relative w-full bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 p-[6px] sm:p-[10px] rounded-[18px] sm:rounded-[24px] shadow-[0_14px_35px_rgba(0,0,0,0.75)] border border-slate-400/40 ring-1 ring-inset ring-white/20">
                                {/* Botões físicos sutis no topo direito da moldura */}
                                <div className="absolute -top-[4px] right-10 sm:right-14 w-7 sm:w-9 h-[3px] sm:h-[4px] rounded-t-md bg-gradient-to-b from-slate-500 to-slate-700 border-t border-slate-400/30 pointer-events-none" />
                                <div className="absolute -top-[4px] right-20 sm:right-28 w-5 sm:w-7 h-[3px] sm:h-[4px] rounded-t-md bg-gradient-to-b from-slate-500 to-slate-700 border-t border-slate-400/30 pointer-events-none" />
                                <div className="absolute -top-[4px] right-28 sm:right-36 w-5 sm:w-7 h-[3px] sm:h-[4px] rounded-t-md bg-gradient-to-b from-slate-500 to-slate-700 border-t border-slate-400/30 pointer-events-none" />

                                {/* Câmera frontal discreta centralizada na borda superior da moldura (sem cobrir a tela) */}
                                <div className="mx-auto mb-1 sm:mb-1.5 flex items-center justify-center gap-1.5 pointer-events-none">
                                  <span className="w-2 h-2 rounded-full bg-[#11131c] ring-1 ring-white/15 flex items-center justify-center">
                                    <span className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-blue-400/60" />
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-zinc-800/80" />
                                </div>

                                {/* Tela interna preenchendo 100% de ponta a ponta sem espaços vazios */}
                                <div className="w-full overflow-hidden rounded-[12px] sm:rounded-[15px] bg-[#0B1120] border-[3px] border-zinc-950 relative">
                                  <video
                                    key={currentMedia.url}
                                    src={currentMedia.url}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-auto block object-cover"
                                  />
                                  {/* Reflexo diagonal sutil de vidro */}
                                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] z-20" />
                                  {/* Barra Home horizontal do iPadOS */}
                                  <div className="pointer-events-none absolute bottom-1 sm:bottom-1.5 left-1/2 -translate-x-1/2 w-20 sm:w-28 h-0.5 sm:h-1 rounded-full bg-white/30 z-20" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
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
                        )
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
        <div className="py-6 sm:py-8 px-6 sm:px-8 rounded-3xl bg-[#111827] border border-blue-400/20 text-center space-y-2 shadow-xl shadow-black/30">
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight italic">
            "Menos improviso. Mais adoração."
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
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
                    : chordInstrumentTab === 'violao'
                      ? '/assets/aistudio/image_1fbeb889.png'
                      : '/tela-harmonia.png')
                : selected.id === 'cifras'
                  ? (cifraCardSubTab === 'capo'
                      ? '/assets/aistudio/image_e6f41181.png'
                      : cifraCardSubTab === 'cifra'
                        ? '/assets/aistudio/image_bf73e394.png'
                        : cifraCardSubTab === 'transposicao'
                          ? '/assets/aistudio/image_ed96a73b.png'
                          : '/tela-cifra.png')
                  : selected.id === 'escala'
                    ? (escalaCardSubTab === 'disponibilidade'
                        ? '/disponibilidade-3-passos.png'
                        : '/tela-escalas.png')
                    : selected.id === 'repertorio'
                      ? '/tela-repertorio.png'
                    : selected.id === 'liturgia_culto'
                      ? (liturgiaCardSubTab === 'edicao'
                          ? '/tela-liturgia-edicao.png'
                          : '/tela-liturgia-pronta.png')
                    : selected.id === 'projecao_datashow'
                      ? 'vector:projecao_datashow'
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
                          {selected.id === 'caged'
                            ? (chordInstrumentTab === 'teclado'
                                ? 'Piano & Teclado: Teclado Didático Centrado com Baixo (B) e Notas (N)'
                                : chordInstrumentTab === 'violao'
                                  ? 'Violão & Guitarra: 5 Shapes do Sistema CAGED no Braço'
                                  : selected.title)
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

                  {/* Seletor rápido Raio-X Harmônico vs Violão (5 Shapes CAGED) vs Teclado no modal de Acordes */}
                  {selected.id === 'caged' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setChordInstrumentTab('harmonia')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          chordInstrumentTab === 'harmonia'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        ✨ Raio-X & Campo Harmônico
                      </button>
                      <button
                        type="button"
                        onClick={() => setChordInstrumentTab('violao')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          chordInstrumentTab === 'violao'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        🎸 5 Shapes do CAGED (Dedos & Intervalos)
                      </button>
                      <button
                        type="button"
                        onClick={() => setChordInstrumentTab('teclado')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          chordInstrumentTab === 'teclado'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        🎹 Teclado Didático Centrado
                      </button>
                    </div>
                  )}

                  {/* Seletor rápido Transposição 1 Clique + Capotraste + Cifra no modal de Cifras */}
                  {selected.id === 'cifras' && (
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setCifraCardSubTab('geral')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          cifraCardSubTab === 'geral'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        ✨ Cifra + Player
                      </button>
                      <button
                        type="button"
                        onClick={() => setCifraCardSubTab('ambos')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          cifraCardSubTab === 'ambos'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        🔀 Tom + Capo
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

                  {/* Seletor rápido Escala & Disparo WhatsApp vs Disponibilidade em 3 Passos no modal de Escalas */}
                  {selected.id === 'escala' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setEscalaCardSubTab('escala')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          escalaCardSubTab === 'escala'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Escala &amp; Disparo WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => setEscalaCardSubTab('disponibilidade')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          escalaCardSubTab === 'disponibilidade'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Disponibilidade em 3 Passos
                      </button>
                    </div>
                  )}

                  {/* Seletor rápido Liturgia Pronta (Modo Culto) vs Edição Customizável no modal de Liturgia */}
                  {selected.id === 'liturgia_culto' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setLiturgiaCardSubTab('pronta')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          liturgiaCardSubTab === 'pronta'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Liturgia Pronta (Modo Culto)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLiturgiaCardSubTab('edicao')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          liturgiaCardSubTab === 'edicao'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Edição Customizável
                      </button>
                    </div>
                  )}

                  {/* Seletor rápido 3 Abas no modal de Projeção Data Show */}
                  {selected.id === 'projecao_datashow' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setProjecaoCardSubTab('painel')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          projecaoCardSubTab === 'painel'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Painel do Projetor
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjecaoCardSubTab('slides')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          projecaoCardSubTab === 'slides'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Slides da Letra &amp; Simulador
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjecaoCardSubTab('guia')}
                        className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                          projecaoCardSubTab === 'guia'
                            ? 'bg-brand text-slate-950 font-extrabold shadow-md'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Guia do Operador
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
                      {selected.id === 'liturgia_culto' ? (
                        <div className="w-full max-w-full max-h-[75vh] overflow-y-auto p-1 sm:p-2 bg-[#0b1120]">
                          {liturgiaCardSubTab === 'edicao' ? (
                            <LiturgyEditorPreview />
                          ) : (
                            <LiturgyReadyPreview variant="expanded" />
                          )}
                        </div>
                      ) : selected.id === 'projecao_datashow' ? (
                        <div className="w-full max-w-full max-h-[75vh] overflow-y-auto p-1 sm:p-2 bg-[#0b1120]">
                          {projecaoCardSubTab === 'slides' ? (
                            <ProjectionSlidesPreview />
                          ) : projecaoCardSubTab === 'guia' ? (
                            <ProjectionOperatorGuidePreview />
                          ) : (
                            <ProjectionDashboardPreview variant="expanded" />
                          )}
                        </div>
                      ) : selected.id === 'cifras' && cifraCardSubTab === 'ambos' ? (
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 sm:p-4 bg-[#0b1120] items-center">
                          <div className="flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl p-2 sm:p-3 border border-white/10 w-full max-w-full overflow-auto">
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
                          <div className="flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl p-2 sm:p-3 border border-amber-500/30 w-full max-w-full overflow-auto">
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
                        <div className="w-full max-w-full overflow-auto">
                          <img 
                            src={currentImage} 
                            alt={`Print real do LiLouPro - ${selected.title}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full max-h-[80vh] sm:max-h-[520px] object-contain rounded-xl sm:rounded-2xl block bg-[#0b1120] p-0 sm:p-2 landing-crisp-img"
                          />
                        </div>
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
                      {selected.id === 'caged'
                        ? 'Recurso técnico completo para violão e guitarra: alterne entre os 5 Shapes do Sistema CAGED (Shape 1/5 a 5/5) para tocar o mesmo acorde em qualquer região do braço, com visualização detalhada de Dedos e Intervalos (T, 3, 5, 7m, 7M). Para tecladistas, o app oferece o Teclado Didático Centrado.'
                        : selected.id === 'escala' && escalaCardSubTab === 'disponibilidade'
                          ? "Cada músico marca sua agenda pelo celular em 3 passos simples: (1) escolhe os dias no calendário, (2) confirma 'Conte Comigo' ou 'Não Posso' com trava automática de 24h antes do culto, e (3) finaliza notificando a liderança."
                          : selected.id === 'liturgia_culto'
                            ? (liturgiaCardSubTab === 'edicao'
                                ? "Na Edição Customizável, o líder monta e personaliza cada momento do culto (Palavra Inicial, Louvor / Adoração, Leitura Bíblica com Assistente Bíblico integrado, duração em minutos e ordem dos blocos com setas de reordenação) de forma simples e flexível."
                                : "No Modo Culto, toda a equipe acompanha em tempo real pelo celular ou tablet a sequência exata do culto, leituras bíblicas integradas, ministros responsáveis e tons definidos, além de acesso rápido a Tocar Setlist, Cifras do Culto e Google Docs.")
                            : selected.id === 'projecao_datashow'
                              ? (projecaoCardSubTab === 'slides'
                                  ? "Na tela de Slides da Letra & Simulador, o operador visualiza todas as estrofes em grade, clica em qualquer slide para projetar ao vivo (com indicação 'NO TELÃO'), navega com as setas do teclado e digita textos livres instantaneamente."
                                  : projecaoCardSubTab === 'guia'
                                    ? "O Guia Prático do Operador orienta passo a passo qualquer voluntário da mídia sobre transmissão em segunda tela (F11 e Win + P), sincronização de letras, troca de fundo (inclusive ajustes para VGA) e controles de blackout e alertas."
                                    : "No Painel do Projetor, a equipe de mídia sincroniza o roteiro ativo do culto e controla em tempo real a tela do projetor, avisos rápidos em 1 clique, cronômetro regressivo e letreiro de alertas rolantes sem interromper a adoração.")
                              : selected.description}
                    </p>

                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        O que sua equipe aproveita nesta funcionalidade:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {(selected.id === 'caged'
                          ? [
                              "Violão e Guitarra: 5 Shapes do CAGED (Shape 1/5 a 5/5) + Dedos e Intervalos",
                              "Análise em tempo real de Grau e Função Harmônica do acorde",
                              "Piano e Teclado: Teclado Didático Centrado com Baixo (B) e Notas (N)"
                            ]
                          : selected.benefits
                        ).map((b, i) => (
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
