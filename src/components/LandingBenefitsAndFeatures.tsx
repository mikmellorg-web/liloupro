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
  exclusivo: '/assets/aistudio/image_f1a7abe2_clean.png'
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

  // Estado para alternar entre Violão (5 Shapes CAGED) e Teclado Didático no card/modal e no simulador
  const [chordInstrumentTab, setChordInstrumentTab] = useState<'violao' | 'teclado' | 'transposicao_capo' | 'completa'>('violao');
  // Estado para alternar entre Transposição + Capo (lado a lado), Transposição, Capo e Cifra Completa no card de Cifras
  const [cifraCardSubTab, setCifraCardSubTab] = useState<'ambos' | 'transposicao' | 'capo' | 'cifra'>('ambos');
  // Estado para alternar entre Player sem Anúncios, Repertório/Playlist e Tuner/Metrônomo no card de Player & Estudo
  const [playerCardSubTab, setPlayerCardSubTab] = useState<'player' | 'playlist' | 'estudo'>('player');
  // Estado para alternar entre Pedal Bluetooth (Vídeo) e Escala do Culto (Foto) no cenário 0 do simulador
  const [stageSimSubTab, setStageSimSubTab] = useState<'pedal' | 'escala'>('pedal');
  // Estado para alternar entre Player sem Anúncios, Exclusivo LiLouPro, Estudo e Playlist no cenário 2 do simulador
  const [exclusiveSimSubTab, setExclusiveSimSubTab] = useState<'player' | 'exclusivo' | 'estudo' | 'playlist'>('player');

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
        const localModules = await getLocalAsset<Record<string, string>>('feature_module_images_v3');
        if (localModules && isMounted) {
          setModuleImages({ ...defaultModuleImages, ...localModules });
        } else {
          const saved = localStorage.getItem('liloupro_feature_module_images_v3');
          if (saved && isMounted) {
            setModuleImages({ ...defaultModuleImages, ...JSON.parse(saved) });
          }
        }
      } catch (e) {
        console.warn('Could not read module images from storage', e);
      }

      try {
        const localSim = await getLocalAsset<Record<number, SimulatorCustomMedia>>('simulator_custom_media_v3');
        if (localSim && isMounted) {
          setSimulatorMedia({ ...defaultSimulatorMedia, ...localSim });
        } else {
          const savedSim = localStorage.getItem('liloupro_simulator_custom_media_v3');
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
              setLocalAsset('feature_module_images_v3', merged);
              return merged;
            });
          }
          if (remote.simulatorMedia && Object.keys(remote.simulatorMedia).length > 0) {
            setSimulatorMedia(prev => {
              const merged = { ...defaultSimulatorMedia, ...prev, ...remote.simulatorMedia };
              setLocalAsset('simulator_custom_media_v3', merged);
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
      title: "Rolagem por Pedal Bluetooth & Escala do Culto",
      badge: "Palco, Pedal Bluetooth & Escala",
      duration: "Vídeo + Foto Real",
      subtitle: "Controle a rolagem da cifra com o pé via Pedal Bluetooth no altar e gerencie a confirmação de disponibilidade e escala musical em tempo real.",
      steps: [
        { label: "1. Rolagem por Pedal Bluetooth", desc: "Mãos livres no instrumento com velocidade calibrada" },
        { label: "2. Confirmação de Disponibilidade", desc: "Botões 'Estou Disponível' / 'Não Posso' para voluntários" },
        { label: "3. Auto-Escala & Exportação", desc: "PDF, WhatsApp, Google Agenda e Caderno no Google Docs" }
      ],
      mockupType: "escala"
    },
    {
      id: 1,
      title: "5 Shapes do CAGED, Transposição 1 Clique & Capotraste",
      badge: "Violão, Teclado, Tom & Capo",
      duration: "Prints Reais",
      subtitle: "Explore os 5 shapes do CAGED como variação do mesmo acorde, mude o tom em 1 clique e calcule automaticamente a casa ideal do capotraste.",
      steps: [
        { label: "1. 5 Shapes do CAGED (1/5 a 5/5)", desc: "Variações do mesmo acorde em 5 regiões do braço" },
        { label: "2. Transposição de Tom em 1 Clique", desc: "Mude entre os 12 tons ou ±1/2 tom instantaneamente" },
        { label: "3. Cálculo Inteligente do Capotraste", desc: "Indica as casas com Shape Aberto mantendo o tom real" }
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
      id: "caged",
      title: "5 Shapes do CAGED como variação do mesmo acorde no Violão, Guitarra e Teclado",
      featureLabel: "Módulo • 5 Shapes CAGED & Acordes",
      icon: Sliders,
      isExclusive: true,
      exclusiveBadge: "5 SHAPES DO CAGED",
      description: "Não fique preso a uma única posição: alterne entre os 5 shapes do CAGED para tocar o mesmo acorde em qualquer região do braço do violão ou guitarra, além do Teclado Didático Centrado.",
      benefits: [
        "5 Shapes do CAGED (Shape 1/5 a 5/5) para o mesmo acorde",
        "Alternância entre Dedos e Intervalos + Grau e Função Harmônica",
        "Teclado Didático Centrado com separação de Baixo (B) e Notas (N)"
      ]
    },
    {
      id: "pedal",
      title: "Rolagem de cifra automática com controle por Pedal Bluetooth no palco",
      featureLabel: "Módulo • Pedal Bluetooth & Modo Palco",
      icon: Zap,
      isExclusive: true,
      exclusiveBadge: "CONTROLE POR PEDAL BLUETOOTH",
      description: "Toque no altar com as mãos 100% livres no instrumento. Acione, pause e controle a velocidade da rolagem automática da cifra diretamente pelo seu Pedal Bluetooth no Modo Culto.",
      benefits: [
        "Controle de rolagem mãos-livres via Pedal Bluetooth",
        "Modo Culto/Palco de alto contraste com tags de dinâmica",
        "Ajuste fino de velocidade (0.2x a 2.0x) e tamanho de fonte"
      ]
    },
    {
      id: "escala",
      title: "Confirmação de Disponibilidade e Escala do Culto sem confusão no WhatsApp",
      featureLabel: "Módulo • Confirmação & Escala do Culto",
      icon: Calendar,
      isExclusive: false,
      exclusiveBadge: "AUTO-ESCALA & CONFIRMAÇÃO",
      description: "Cada voluntário confirma presença com 1 toque ('Estou Disponível' / 'Não Posso'). Monte a equipe com Auto-Escala e exporte em PDF, WhatsApp, Google Agenda ou Caderno no Google Docs.",
      benefits: [
        "Confirmação de disponibilidade em tempo real por voluntário",
        "Composição visual da escala com funções e edição rápida",
        "Integração com WhatsApp, PDF, Google Agenda e Google Docs"
      ]
    },
    {
      id: "cifras",
      title: "Transposição de Tons em 1 Clique & Cálculo Inteligente do Capotraste",
      featureLabel: "Módulo • Transposição 1 Clique & Capotraste",
      icon: FileText,
      isExclusive: true,
      exclusiveBadge: "TOM EM 1 CLIQUE + CAPO",
      description: "Mude a tonalidade da cifra em 1 clique (±1/2 tom ou grade com os 12 tons) e descubra em qual casa colocar o capotraste para tocar com shapes abertos mantendo o tom real da música.",
      benefits: [
        "Transposição de tom em 1 clique com indicação do Shape base",
        "Caixa de Posições do Capotraste com destaque de '🎸 Shape Aberto'",
        "Cifra completa em 1 ou 2 colunas com Modo Foco e Dinâmicas"
      ]
    },
    {
      id: "repertorio",
      title: "LiLouPro Player sem Anúncios direto na Cifra, Playlist e Estúdio de Ensaio",
      featureLabel: "Módulo • Player sem Anúncios & Estúdio",
      icon: Music,
      isExclusive: true,
      exclusiveBadge: "PLAYER SEM ANÚNCIOS",
      description: "Estude a música com o LiLouPro Player flutuante sem interrupções de propagandas e com botão Repetir, monte sua Playlist de estudo e use o Afinador PRO e Metrônomo Stompbox.",
      benefits: [
        "LiLouPro Player (Modo Pratique) sem anúncios direto na tela da cifra",
        "Repertório Musical organizado com Minha Playlist e integração Drive",
        "LiLouPro Tuner PRO e Metrônomo Stompbox integrados"
      ]
    },
    {
      id: "exclusivo",
      title: "Recursos Exclusivos LiLouPro: Fundamentação Bíblica, Temas e Harmonia",
      featureLabel: "Exclusivo LiLouPro • Ferramentas Especiais",
      icon: Sparkles,
      isExclusive: true,
      exclusiveBadge: "EXCLUSIVO LILOUPRO",
      description: "Recursos avançados de inteligência teológica e análise musical criados para elevar a excelência espiritual e técnica do seu ministério de louvor.",
      benefits: [
        "Fundamentação Bíblica completa de cada canção do repertório",
        "Sugestões automáticas de músicas do Mesmo Tema litúrgico",
        "Aprenda com a Música: análise de harmonia aplicada passo a passo"
      ]
    },
    {
      id: "liturgia",
      title: "O pastor e a banda na mesma página antes do ensaio",
      featureLabel: "Módulo • Ordem Litúrgica",
      icon: Layers,
      isExclusive: false,
      description: "Organize a ordem do culto, pregação e momentos de louvor para que o pastor, ministro e mídia saibam o tempo exato de cada etapa.",
      benefits: [
        "Cronograma interativo do início ao fim do culto",
        "Alinhamento prévio com a mensagem pastoral",
        "Tranquilidade para quem dirige o culto"
      ]
    },
    {
      id: "projecao",
      title: "O operador de mídia transmite as letras sem retrabalho",
      featureLabel: "Módulo • Projeção & Telão",
      icon: Tv,
      isExclusive: false,
      description: "Projete letras e fundos diretamente no telão da igreja usando qualquer navegador. Sem pen drive corrompido ou slides reescritos às pressas.",
      benefits: [
        "Projeção limpa em tela cheia via navegador",
        "Sincronizada em tempo real com a ordem do culto",
        "Leve e funcional em qualquer computador da mídia"
      ]
    },
    {
      id: "comunicacao",
      title: "Todos recebem a informação certa na hora certa",
      featureLabel: "Módulo • Comunicação & Avisos",
      icon: MessageSquare,
      isExclusive: false,
      description: "Envie comunicados sobre horários de ensaio, trajes e avisos litúrgicos diretamente pelo aplicativo sem mensagens perdidas em grupos.",
      benefits: [
        "Notificações diretas para os escalados da semana",
        "Confirmação individual com 1 toque",
        "Zero mensagens paralelas ou figurinhas no grupo"
      ]
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* SEÇÃO 4 & 5: AS FUNCIONALIDADES COM FOTOS E VÍDEO REAIS EM DESTAQUE */}
      <section id="funcionalidades" className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/25 text-brand text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Tecnologia & Recursos Exclusivos LiLouPro
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Veja as telas reais e os diferenciais exclusivos do LiLouPro
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Dos <strong className="text-slate-200">5 shapes do CAGED</strong>, <strong className="text-slate-200">transposição em 1 clique</strong> e <strong className="text-slate-200">cálculo do capotraste</strong> ao <strong className="text-slate-200">LiLouPro Player sem anúncios</strong>, <strong className="text-slate-200">Pedal Bluetooth</strong> e <strong className="text-slate-200">Escala Inteligente do Culto</strong>.
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
                              ? '🎹 Baixo (B) + Notas (N) Centradas'
                              : '🔄 Shape 1/5 a 5/5 • Variações CAGED'}
                          </span>
                          <span className="text-slate-400">Dedos & Intervalos</span>
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
                            ✨ Bíblia • Mesmo Tema • Harmonia
                          </span>
                          <span className="text-slate-400">Exclusivo LiLouPro</span>
                        </div>
                      )}
                    </div>
                  )}

                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-brand transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
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

      {/* BANNER DE DESTAQUE ESPECIAL: RECURSOS EXCLUSIVOS LILOUPRO */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-[#0d1629] to-slate-950 border border-amber-500/35 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-widest shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Exclusivo LiLouPro • Ferramentas Especiais
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                Player sem Anúncios, 5 Shapes do CAGED, Capotraste e Inteligência Teológica
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                O LiLouPro vai muito além de um leitor de cifras comum. É a única plataforma com <strong className="text-white">LiLouPro Player sem anúncios</strong> integrado à cifra, <strong className="text-white">Transposição em 1 Clique</strong>, <strong className="text-white">Cálculo Automático do Capotraste</strong>, <strong className="text-white">5 Shapes do CAGED</strong> e <strong className="text-white">Fundamentação Bíblica</strong>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-400">🎸 5 Shapes CAGED + Capotraste</p>
                  <p className="text-xs text-slate-300">5 variações do mesmo acorde no braço todo e cálculo automático de casas do Capotraste com Shape Aberto.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-400">▶️ Player sem Anúncios + Pedal</p>
                  <p className="text-xs text-slate-300">Ouça e repita trechos na própria cifra sem propagandas e role a tela no palco com seu Pedal Bluetooth.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-sky-400">📅 Confirmação e Escala do Culto</p>
                  <p className="text-xs text-slate-300">Disponibilidade em 1 toque, Auto-Escala e exportação para WhatsApp, PDF, Google Agenda e Google Docs.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-purple-400">📖 Bíblia, Harmonia & Estúdio</p>
                  <p className="text-xs text-slate-300">Fundamentação Bíblica, sugestões do Mesmo Tema, análise harmônica, Tuner PRO e Metrônomo Stompbox.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div
                onClick={() => setActiveModuleModal('repertorio')}
                className="rounded-2xl overflow-hidden border border-emerald-400/35 bg-[#0b1120] shadow-2xl p-2 space-y-2 cursor-pointer hover:border-emerald-400/70 transition-all"
              >
                <img
                  src="/assets/aistudio/image_ed670cb5.png"
                  alt="LiLouPro Player sem anúncios integrado diretamente na página da cifra"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto object-contain rounded-xl landing-crisp-img"
                />
                <p className="text-[11px] font-bold text-center text-emerald-300 py-1">
                  ▶️ LiLouPro Player sem Anúncios na Cifra
                </p>
              </div>
              <div
                onClick={() => setActiveModuleModal('exclusivo')}
                className="rounded-2xl overflow-hidden border border-amber-400/30 bg-[#0b1120] shadow-2xl p-2 space-y-2 cursor-pointer hover:border-amber-400/70 transition-all"
              >
                <img
                  src="/assets/aistudio/image_f1a7abe2_clean.png"
                  alt="Exclusivo LiLouPro - Fundamentação Bíblica, Sugestões do Mesmo Tema e Aprenda Harmonia"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto object-contain rounded-xl landing-crisp-img"
                />
                <p className="text-[11px] font-bold text-center text-amber-300 py-1">
                  ✨ Bíblia, Mesmo Tema & Harmonia Aplicada
                </p>
              </div>
            </div>
          </div>
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

                      {/* Sub-abas do Cenário 0: Vídeo Pedal Bluetooth vs Foto Escala do Culto */}
                      {activeDemo === 0 && (
                        <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setStageSimSubTab('pedal')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              stageSimSubTab === 'pedal' ? 'bg-emerald-400 text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            🦶 Vídeo: Pedal Bluetooth
                          </button>
                          <button
                            type="button"
                            onClick={() => setStageSimSubTab('escala')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              stageSimSubTab === 'escala' ? 'bg-brand text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            📅 Escala & Confirmação
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

                      {/* Sub-abas do Cenário 2: Player sem Anúncios, Exclusivo LiLouPro, Estudo e Playlist */}
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
                            onClick={() => setExclusiveSimSubTab('exclusivo')}
                            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              exclusiveSimSubTab === 'exclusivo' ? 'bg-amber-400 text-slate-950 font-extrabold' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            ✨ Exclusivo
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
                              : '🦶 Pedal Bluetooth: acione a rolagem da cifra com o pé sem tirar as mãos do violão ou teclado'}
                          </span>
                        )}
                        {activeDemo === 1 && (
                          <span>
                            {chordInstrumentTab === 'transposicao_capo'
                              ? '⚡ Transposição em 1 Clique + Cálculo Inteligente do Capotraste com indicação de Shape Aberto'
                              : '🎸 5 Shapes do CAGED: veja 5 variações do mesmo acorde em todo o braço + Teclado Didático'}
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
                          {selected.title}
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
    </div>
  );
}
