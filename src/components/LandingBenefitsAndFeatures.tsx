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

export default function LandingBenefitsAndFeatures({ onEnterApp }: LandingBenefitsAndFeaturesProps) {
  // Estado para modal de detalhes dos módulos
  const [activeModuleModal, setActiveModuleModal] = useState<string | null>(null);

  // Estado para imagens reais dos módulos (armazenadas em localStorage)
  const [moduleImages, setModuleImages] = useState<Record<string, string>>({});
  const [isDraggingModal, setIsDraggingModal] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [urlInputValue, setUrlInputValue] = useState<string>('');
  const [uploadToast, setUploadToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para mídias customizadas do Telão do Simulador (prints reais ou vídeos curtos)
  const [simulatorMedia, setSimulatorMedia] = useState<Record<number, SimulatorCustomMedia>>({});
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
        const localModules = await getLocalAsset<Record<string, string>>('feature_module_images');
        if (localModules && isMounted) {
          setModuleImages(localModules);
        } else {
          const saved = localStorage.getItem('liloupro_feature_module_images');
          if (saved && isMounted) {
            setModuleImages(JSON.parse(saved));
          }
        }
      } catch (e) {
        console.warn('Could not read module images from storage', e);
      }

      try {
        const localSim = await getLocalAsset<Record<number, SimulatorCustomMedia>>('simulator_custom_media');
        if (localSim && isMounted) {
          setSimulatorMedia(localSim);
        } else {
          const savedSim = localStorage.getItem('liloupro_simulator_custom_media');
          if (savedSim && isMounted) {
            const parsed = JSON.parse(savedSim);
            const cleaned: Record<number, SimulatorCustomMedia> = {};
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
              const merged = { ...prev, ...remote.moduleImages };
              setLocalAsset('feature_module_images', merged);
              return merged;
            });
          }
          if (remote.simulatorMedia && Object.keys(remote.simulatorMedia).length > 0) {
            setSimulatorMedia(prev => {
              const merged = { ...prev, ...remote.simulatorMedia };
              setLocalAsset('simulator_custom_media', merged);
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
      setLocalAsset('feature_module_images', updated);
      saveOfficialLandingImages({ moduleImages: { [moduleId]: dataUrl } });
      try {
        localStorage.setItem('liloupro_feature_module_images', JSON.stringify(updated));
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
      delete updated[moduleId];
      setLocalAsset('feature_module_images', updated);
      saveOfficialLandingImages({ moduleImages: { [moduleId]: '' } });
      try {
        localStorage.setItem('liloupro_feature_module_images', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    showFeedbackToast('Print removido.');
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
      setLocalAsset('simulator_custom_media', updated);
      saveOfficialLandingImages({ simulatorMedia: { [demoId]: media } });
      try {
        localStorage.setItem('liloupro_simulator_custom_media', JSON.stringify(updated));
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
      delete updated[demoId];
      setLocalAsset('simulator_custom_media', updated);
      saveOfficialLandingImages({ simulatorMedia: { [demoId]: null } });
      try {
        localStorage.setItem('liloupro_simulator_custom_media', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    showFeedbackToast('Mídia removida. Simulação original restaurada.');
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

  // Estado para a Seção: Veja o LiLouPro Funcionando (Simulador interativo de 20s)
  const [activeDemo, setActiveDemo] = useState<number>(0);
  const [demoProgress, setDemoProgress] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  const demos = [
    {
      id: 0,
      title: "Escalas sem retrabalho",
      badge: "Escalas Inteligentes",
      duration: "20 seg",
      subtitle: "Monte a escala em minutos sabendo exatamente quem está disponível na sua equipe.",
      steps: [
        { label: "1. Selecionar culto", desc: "Culto de Domingo • 19h00" },
        { label: "2. Escalar músicos", desc: "Daniel (Violão) • Carla (Vocal)" },
        { label: "3. Confirmação instantânea", desc: "A equipe responde pelo celular" }
      ],
      mockupType: "escala"
    },
    {
      id: 1,
      title: "Cifra no tom exato",
      badge: "Transposição Instantânea",
      duration: "15 seg",
      subtitle: "Altere a tonalidade em 1 clique durante o ensaio para que todos toquem com segurança no tom certo.",
      steps: [
        { label: "1. Abrir cifra", desc: "Grande é o Senhor (Tom original G)" },
        { label: "2. Ajustar tom para o vocal", desc: "Transpor para A (+2 semitons)" },
        { label: "3. Sincronizar com a banda", desc: "Teclado e violão atualizados na hora" }
      ],
      mockupType: "cifra"
    },
    {
      id: 2,
      title: "Projeção sem pen drive",
      badge: "Telão Conectado",
      duration: "20 seg",
      subtitle: "O operador de mídia projeta as letras no telão direto pelo navegador com um clique.",
      steps: [
        { label: "1. Selecionar liturgia", desc: "Ordem das canções e leitura" },
        { label: "2. Conectar telão", desc: "Projeção em tela cheia via web" },
        { label: "3. Controle remoto", desc: "Avançar estrofes em sincronia" }
      ],
      mockupType: "projecao"
    }
  ];

  // Auto-play do simulador interativo
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

  // MÓDULOS COM CONSEQUÊNCIAS (Melhoria 2: Como isso melhora a vida do líder?)
  const consequenceModules = [
    {
      id: "escala",
      title: "Confirmações automáticas de escala antes do ensaio",
      featureLabel: "Módulo • Escalas Inteligentes",
      icon: Calendar,
      description: "Monte escalas considerando a disponibilidade real de cada voluntário. Chega de perguntar de dez em dez no WhatsApp quem vai poder tocar no domingo.",
      benefits: [
        "Placar de confirmação verde e vermelho na tela",
        "Avisos automáticos de rodízio e descanso",
        "Histórico transparente de participação"
      ]
    },
    {
      id: "repertorio",
      title: "Todos ensaiam exatamente a mesma versão",
      featureLabel: "Módulo • Repertório Centralizado",
      icon: Music,
      description: "Acabe com a confusão sobre qual arranjo ou introdução será tocada. O Liloupro possui um player sem anúncios na página da cifra para que todos possam ensaiar a mesma versão da música.",
      benefits: [
        "Catálogo completo de hinos e canções",
        "Links de áudio de referência para estudo em casa",
        "Filtro por andamento, tom e tema litúrgico"
      ]
    },
    {
      id: "cifras",
      title: "Ninguém mais precisa procurar outra tonalidade",
      featureLabel: "Módulo • Cifras & Tom Ideal",
      icon: Sliders,
      description: "Mude o tom da música em tempo real durante o ensaio e todos os músicos veem os acordes ajustados na hora em seus celulares.",
      benefits: [
        "Transposição instantânea de acordes com 1 clique",
        "Visualização clara para violão, teclado e baixo",
        "Cálculo automático de capotraste"
      ]
    },
    {
      id: "comunicacao",
      title: "Todos recebem a informação certa na hora certa",
      featureLabel: "Módulo • Comunicação & Avisos",
      icon: MessageSquare,
      description: "Envie comunicados sobre horários de ensaio, trajes e avisos litúrgicos diretamente pelo aplicativo sem mensagens perdidas em grupos.",
      benefits: [
        "Notificações diretas para os escalados da semana",
        "Confirmação individual com 1 toque",
        "Zero mensagens paralelas ou figurinhas no grupo"
      ]
    },
    {
      id: "liturgia",
      title: "O pastor e a banda na mesma página antes do ensaio",
      featureLabel: "Módulo • Ordem Litúrgica",
      icon: Layers,
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
      description: "Projete letras e fundos diretamente no telão da igreja usando qualquer navegador. Sem pen drive corrompido ou slides reescritos às pressas.",
      benefits: [
        "Projeção limpa em tela cheia via navegador",
        "Sincronizada em tempo real com a ordem do culto",
        "Leve e funcional em qualquer computador da mídia"
      ]
    },
    {
      id: "membros",
      title: "A liderança visualiza os voluntários ativos em paz",
      featureLabel: "Módulo • Membros & Funções",
      icon: Users,
      description: "Cadastre músicos, vocais e técnicos com seus respectivos instrumentos e histórico de serviço para distribuir melhor as escalas do mês.",
      benefits: [
        "Perfis com instrumentos principais e secundários",
        "Registro claro para quem lidera o ministério",
        "Controle simples de férias e indisponibilidade"
      ]
    },
    {
      id: "pwa",
      title: "O músico abre a cifra no celular sem gastar dados",
      featureLabel: "Módulo • PWA & Acesso Móvel",
      icon: Smartphone,
      description: "Funciona em qualquer smartphone Android ou iPhone. Abra no ensaio ou no púlpito com velocidade instantânea e leitura confortável no modo escuro.",
      benefits: [
        "Instalável na tela inicial sem ocupar memória",
        "Filosofia Mobile-First com botões amplos",
        "Modo escuro otimizado para o palco da igreja"
      ]
    },
    {
      id: "seguranca",
      title: "O ministério preservado mesmo com troca de liderança",
      featureLabel: "Módulo • Memória & Proteção",
      icon: ShieldCheck,
      description: "Todo o histórico de escalas, repertórios e cadernos da igreja fica guardado em segurança na nuvem, sem depender do celular particular de ninguém.",
      benefits: [
        "Backup automático na nuvem em tempo real",
        "Histórico do ministério sempre preservado",
        "Acesso contínuo para futuras gerações de líderes"
      ]
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* SEÇÃO 4 & 5: AS FUNCIONALIDADES COMO CONSEQUÊNCIAS (O que melhora na rotina) */}
      <section id="funcionalidades" className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/25 text-brand text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Alívio para a Liderança
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Como o LiLouPro melhora a rotina de cada voluntário
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Cada recurso foi pensado para eliminar atritos na comunicação da equipe e dar mais tempo para o que realmente importa.
          </p>
        </div>

        {/* Grid de Consequências e Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {consequenceModules.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setActiveModuleModal(item.id)}
                className="bg-slate-900/60 hover:bg-slate-900 border border-white/10 hover:border-brand/40 rounded-3xl p-6 sm:p-8 space-y-5 transition-all duration-300 flex flex-col justify-between cursor-pointer group shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      {moduleImages[item.id] && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand bg-brand/10 border border-brand/25 px-2 py-0.5 rounded-full">
                          <ImageIcon className="w-3 h-3" />
                          Print real
                        </span>
                      )}
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                        {item.featureLabel.split('•')[1]?.trim()}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-brand transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-2">
                  {item.benefits.slice(0, 2).map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-brand group-hover:underline">
                    <span className="flex items-center gap-1.5">
                      {moduleImages[item.id] ? 'Ver print real na prática' : 'Ver como funciona na prática'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200">
                      {moduleImages[item.id] ? 'Trocar print' : 'Subir print'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RESPIRO VISUAL 3: MEMÓRIA DE MARCA */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="py-6 sm:py-8 px-6 sm:px-8 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0a1829] to-slate-900 border border-white/10 text-center space-y-2 shadow-xl">
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight italic">
            "Toda equipe afinada. Toda igreja conectada."
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-brand">
            Alinhamento entre ministros, músicos e equipe técnica
          </p>
        </div>
      </section>

      {/* SEÇÃO 6: VEJA FUNCIONANDO EM 20 SEGUNDOS (Simulador com pessoas reais) */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-slate-900/80 border border-white/15 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Play className="w-3.5 h-3.5" />
              Simulador Interativo
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Veja o sistema em funcionamento
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Navegue pelos cenários abaixo e veja a fluidez do LiLouPro em ação.
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
                      <span className="text-[10px] font-mono text-slate-400">
                        {demo.duration}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {demo.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {demo.subtitle}
                    </p>

                    {isActive && (
                      <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                        {demo.steps.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-semibold">{step.label}</span>
                            <span className="text-slate-400 font-mono text-[11px]">{step.desc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Lado Direito: Visualização Real da Interface (Pessoas e Funções ou Mídia Customizada: Print/Vídeo) */}
            <div className="lg:col-span-7">
              {(() => {
                const currentMedia = simulatorMedia[activeDemo];

                return (
                  <div 
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingSimulator(true);
                    }}
                    onDragLeave={() => setIsDraggingSimulator(false)}
                    onDrop={handleSimulatorFileDrop}
                    className={`bg-slate-950 border ${
                      isDraggingSimulator 
                        ? 'border-brand ring-2 ring-brand/40 bg-slate-900/90' 
                        : currentMedia 
                          ? 'border-brand/40 shadow-brand/10' 
                          : 'border-white/10'
                    } rounded-3xl p-5 sm:p-6 shadow-2xl relative min-h-[360px] flex flex-col justify-between transition-all duration-300 overflow-hidden group`}
                  >
                    {/* Overlay de Drag and Drop para Imagem ou Vídeo */}
                    {isDraggingSimulator && (
                      <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-sm border-2 border-dashed border-brand rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-3 pointer-events-none">
                        <div className="w-16 h-16 rounded-3xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand animate-bounce">
                          <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-base font-bold text-white">
                          Solte o arquivo de imagem ou vídeo curto aqui
                        </p>
                        <p className="text-xs text-slate-300 max-w-sm">
                          Será aplicado imediatamente ao telão do cenário: <span className="text-brand font-bold">{demos[activeDemo].title}</span>
                        </p>
                      </div>
                    )}

                    {/* Cabeçalho do Telão com Ações de Customização */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${currentMedia ? 'bg-brand animate-pulse' : 'bg-emerald-400'}`} />
                        <span className="text-xs font-bold text-white">
                          {demos[activeDemo].badge} • IBN Sede
                        </span>
                        {currentMedia && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand bg-brand/10 border border-brand/30 px-2 py-0.5 rounded-full">
                            {currentMedia.type === 'video' ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                            {currentMedia.type === 'video' ? 'Vídeo Real' : 'Print Real'}
                          </span>
                        )}
                      </div>

                      {/* Botões de Edição do Telão */}
                      <div className="flex items-center gap-2">
                        {currentMedia ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setIsCustomizingSimulator(true)}
                              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Trocar mídia deste cenário"
                            >
                              <Upload className="w-3.5 h-3.5 text-brand" />
                              <span>Trocar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => removeSimulatorMedia(activeDemo)}
                              className="px-2 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Restaurar simulação original"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Restaurar</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsCustomizingSimulator(true)}
                            className="px-3 py-1 rounded-xl bg-brand/15 hover:bg-brand/25 border border-brand/30 text-brand text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Subir imagem ou vídeo</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Corpo do Telão: Mídia Customizada OU Simulação Nativa */}
                    <div className="py-4 my-auto flex flex-col justify-center">
                      {currentMedia ? (
                        <div className="w-full flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-slate-900/60 border border-white/10 p-2 sm:p-3 relative group/media">
                          {currentMedia.type === 'video' ? (
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
                              <video
                                key={currentMedia.url}
                                src={currentMedia.url}
                                controls
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full max-h-[380px] object-contain rounded-xl bg-black shadow-2xl"
                              />
                            )
                          ) : (
                            <img
                              src={currentMedia.url}
                              alt={demos[activeDemo].title}
                              loading="lazy"
                              decoding="async"
                              className="w-full max-h-[380px] object-contain rounded-xl shadow-2xl landing-crisp-img"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {demos[activeDemo].mockupType === 'escala' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-white/10">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-brand/20 text-brand font-bold flex items-center justify-center text-xs">DL</div>
                                  <div>
                                    <p className="text-sm font-bold text-white">Daniel Lemos • Violão & Guitarra</p>
                                    <p className="text-xs text-slate-400">Escalado para Domingo 19h</p>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                  Confirmado
                                </span>
                              </div>

                              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-white/10">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-sky-500/20 text-sky-300 font-bold flex items-center justify-center text-xs">CS</div>
                                  <div>
                                    <p className="text-sm font-bold text-white">Carla Santos • Ministra de Louvor</p>
                                    <p className="text-xs text-slate-400">Escalada para Domingo 19h</p>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                  Confirmada
                                </span>
                              </div>
                            </div>
                          )}

                          {demos[activeDemo].mockupType === 'cifra' && (
                            <div className="bg-slate-900 p-4 rounded-xl border border-white/10 font-mono text-xs space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-white/10 font-sans">
                                <span className="font-bold text-white">Grande é o Senhor (Tom de Ensaio: A)</span>
                                <span className="text-[11px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">Transposto +2 semi</span>
                              </div>
                              <div className="space-y-1">
                                <div className="text-brand font-bold">A                    E                    F#m                  D</div>
                                <div className="text-slate-200 font-sans">Senhor tu és bom, a tua misericórdia dura para sempre...</div>
                              </div>
                            </div>
                          )}

                          {demos[activeDemo].mockupType === 'projecao' && (
                            <div className="bg-slate-900 p-6 rounded-xl border border-white/10 text-center space-y-3">
                              <span className="text-[10px] font-mono text-sky-300 uppercase tracking-widest bg-sky-500/10 px-2.5 py-1 rounded-full">
                                Projeção Web • Telão Principal
                              </span>
                              <p className="text-lg sm:text-xl font-bold text-white">
                                "SENHOR TU ÉS BOM, A TUA MISERICÓRDIA DURA PARA SEMPRE"
                              </p>
                              <p className="text-xs text-slate-400">
                                Operador: Gabriel Andrade • Sincronizado na hora
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Barra de Rodapé do Telão */}
                    <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-400">
                        <span>{demos[activeDemo].title}</span>
                        <span className="text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={() => setIsCustomizingSimulator(true)}
                          className="text-slate-400 hover:text-brand underline decoration-dotted transition-colors cursor-pointer"
                        >
                          {currentMedia ? 'Personalizar mídia' : 'Subir imagem ou vídeo curto'}
                        </button>
                      </div>

                      <button
                        onClick={() => onEnterApp('signup')}
                        className="text-xs font-bold text-brand hover:underline cursor-pointer ml-auto sm:ml-0"
                      >
                        Testar essa função na minha igreja →
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

      {/* INPUT OCULTO PARA SUBIR ARQUIVO DE IMAGEM REAL */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* INPUT OCULTO PARA SUBIR ARQUIVOS DO SIMULADOR (IMAGENS OU VÍDEOS CURTOS) */}
      <input 
        type="file" 
        ref={simulatorFileInputRef} 
        onChange={handleSimulatorFileInputChange} 
        accept="image/*,video/mp4,video/webm,video/quicktime,video/ogg" 
        className="hidden" 
      />

      {/* TOAST DE FEEDBACK DE UPLOAD */}
      {uploadToast && (
        <div className="fixed bottom-6 right-6 z-[999] bg-brand text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl text-xs flex items-center gap-2 border border-brand/40 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 size={16} className="text-slate-950 shrink-0" />
          <span>{uploadToast}</span>
        </div>
      )}

      {/* MODAL DE CUSTOMIZAÇÃO DO TELÃO DO SIMULADOR (PRINTS REAIS OU VÍDEOS CURTOS) */}
      {isCustomizingSimulator && (
        <div 
          onClick={() => setIsCustomizingSimulator(false)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-white/15 rounded-3xl p-5 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative"
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-brand uppercase tracking-wider">
                    Personalizar Telão • Cenário {activeDemo + 1}
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    {demos[activeDemo].title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCustomizingSimulator(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Suba uma captura de tela real do app ou um vídeo curto (MP4, WebM ou link do YouTube) para ser exibido no telão da direita deste cenário.
            </p>

            {/* Opção 1: Upload de Arquivo Direto */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand" />
                Subir arquivo do computador ou celular
              </span>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => simulatorFileInputRef.current?.click()}
                  className="flex-1 py-3 px-4 rounded-xl bg-brand hover:bg-brand/90 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand/20 transition-all cursor-pointer"
                >
                  <Upload size={15} />
                  Escolher Imagem ou Vídeo Curto
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Formatos: Imagens (PNG, JPG, WEBP) ou Vídeos (MP4, WebM até 8MB)
              </p>
            </div>

            {/* Opção 2: Inserir por Link / URL */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-sky-400" />
                Ou colar link (Imagem, Vídeo MP4 ou YouTube)
              </span>

              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="url" 
                  value={simUrlInput}
                  onChange={(e) => setSimUrlInput(e.target.value)}
                  placeholder="https://exemplo.com/print.png ou youtube.com/watch?v=..."
                  className="flex-1 bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplySimulatorUrl(simUrlInput, activeDemo);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleApplySimulatorUrl(simUrlInput, activeDemo)}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  Aplicar URL
                </button>
              </div>
            </div>

            {/* Estado atual da mídia do cenário */}
            {simulatorMedia[activeDemo] && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Mídia personalizada ativa neste cenário</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    removeSimulatorMedia(activeDemo);
                    setIsCustomizingSimulator(false);
                  }}
                  className="text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                >
                  Restaurar padrão
                </button>
              </div>
            )}

            {/* Botão Fechar */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCustomizingSimulator(false)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DE MÓDULO COM UPLOAD E VISUALIZADOR DE PRINT REAL DO APP */}
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
              const currentImage = moduleImages[selected.id];

              return (
                <>
                  {/* Cabeçalho do Modal com Ações */}
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
                          {currentImage && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              Print real configurado
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                          {selected.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      {/* Controles de Edição de Imagem */}
                      {currentImage ? (
                        <>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
                            title="Trocar captura de tela"
                          >
                            <Upload size={13} />
                            <span>Trocar print</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
                            title="Inserir por URL"
                          >
                            <LinkIcon size={13} />
                            <span>Link</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => removeModuleImage(selected.id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 transition-all cursor-pointer"
                            title="Remover print e voltar ao padrão"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
                        >
                          <LinkIcon size={13} />
                          <span>Inserir por link</span>
                        </button>
                      )}

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

                  {/* Barra de Inserção por URL (quando aberta) */}
                  {showUrlInput && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-brand/30 flex flex-col sm:flex-row items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
                      <input
                        type="url"
                        value={urlInputValue}
                        onChange={(e) => setUrlInputValue(e.target.value)}
                        placeholder="Cole aqui a URL direta da imagem (ex: https://.../print.png)"
                        className="flex-1 bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand w-full"
                      />
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            if (urlInputValue.trim()) {
                              saveModuleImage(selected.id, urlInputValue.trim());
                              setUrlInputValue('');
                              setShowUrlInput(false);
                            }
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 bg-brand text-slate-950 font-bold text-xs rounded-xl hover:bg-brand/90 transition-all cursor-pointer"
                        >
                          Salvar Print
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(false)}
                          className="px-3 py-2 bg-white/10 text-slate-300 font-semibold text-xs rounded-xl hover:bg-white/15 transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ÁREA DA IMAGEM REAL / DROPZONE EDITÁVEL */}
                  {currentImage ? (
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingModal(true); }}
                      onDragLeave={() => setIsDraggingModal(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingModal(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processImageFile(file, selected.id);
                      }}
                      className="relative group rounded-2xl overflow-hidden border border-white/15 bg-slate-950 shadow-2xl flex flex-col items-center justify-center transition-all"
                    >
                      <img 
                        src={currentImage} 
                        alt={`Print real do LiLouPro - ${selected.title}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full max-h-[460px] object-contain rounded-2xl block bg-slate-950 landing-crisp-img"
                      />

                      {/* Overlay para arrastar e soltar substituição rápida */}
                      {isDraggingModal && (
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-brand rounded-2xl z-20">
                          <Upload className="w-10 h-10 text-brand animate-bounce mb-3" />
                          <p className="text-base font-bold text-white">Solte a imagem para atualizar este print</p>
                          <p className="text-xs text-slate-400 mt-1">Substitui o print atual do módulo {selected.featureLabel.split('•')[1]?.trim()}</p>
                        </div>
                      )}

                      {/* Barra de Ação rápida no rodapé da imagem */}
                      <div className="w-full py-2 px-4 bg-slate-950/90 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          Print real da tela do LiLouPro
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-brand hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Upload size={12} /> Trocar arquivo
                          </button>
                          <button
                            type="button"
                            onClick={() => removeModuleImage(selected.id)}
                            className="text-slate-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={12} /> Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* DROPZONE DE UPLOAD QUANDO NÃO HÁ IMAGEM AINDA */
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingModal(true); }}
                      onDragLeave={() => setIsDraggingModal(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingModal(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processImageFile(file, selected.id);
                      }}
                      className={`rounded-2xl border-2 border-dashed ${
                        isDraggingModal ? 'border-brand bg-brand/10 scale-[1.01]' : 'border-white/20 hover:border-brand/40 bg-slate-950/70'
                      } p-8 sm:p-10 text-center transition-all duration-200 space-y-4`}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/25 flex items-center justify-center text-brand mx-auto shadow-lg shadow-brand/10">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                      
                      <div className="space-y-1.5 max-w-lg mx-auto">
                        <h4 className="text-base sm:text-lg font-bold text-white">
                          Suba o print real do LiLouPro ({selected.featureLabel.split('•')[1]?.trim()})
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                          Arraste a captura de tela real do app para cá ou escolha uma imagem do seu computador para exibir aos visitantes exatamente como o recurso funciona.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-3 rounded-xl bg-brand hover:bg-brand/90 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-brand/20 transition-all cursor-pointer"
                        >
                          <Upload size={14} />
                          Subir print do computador
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(true)}
                          className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
                        >
                          <LinkIcon size={14} />
                          Colar link da imagem
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Formatos aceitos: PNG, JPG, WEBP • Otimização automática e salvo na nuvem/navegador
                      </p>
                    </div>
                  )}

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
