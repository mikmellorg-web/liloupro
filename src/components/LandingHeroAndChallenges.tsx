import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  MessageSquare, 
  RefreshCw, 
  FileText, 
  Users, 
  Calendar, 
  Sliders, 
  ShieldCheck, 
  Music, 
  Eye, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Smartphone,
  Tv,
  Share2,
  Heart,
  ChevronRight,
  Flame,
  UserCheck,
  Upload,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  RotateCcw
} from 'lucide-react';
import { Music2 } from './MusicIcon';
import { 
  getLocalAsset, 
  setLocalAsset, 
  fetchOfficialLandingImages, 
  saveOfficialLandingImages 
} from '../utils/landingImageService';

const defaultHeroDevicesImg = '/assets/aistudio/capa_da_landin_page.png_8d0c4e29_33bd5f3b.jpg';

interface LandingHeroAndChallengesProps {
  onEnterApp: (mode: 'login' | 'signup') => void;
}

export default function LandingHeroAndChallenges({ onEnterApp }: LandingHeroAndChallengesProps) {
  // Estado para o Mockup Interativo do Hero (trazendo pessoas reais)
  const [mockupTab, setMockupTab] = useState<'liturgia' | 'escala' | 'cifra'>('liturgia');
  const [transposition, setTransposition] = useState<number>(0);

  // Estado para Imagem Real Customizada do Painel do Hero
  const [customHeroImage, setCustomHeroImage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showUrlPrompt, setShowUrlPrompt] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeHeroImage = customHeroImage || defaultHeroDevicesImg || '/liloupro_devices_hero.jpg';

  useEffect(() => {
    let isMounted = true;
    (async () => {
      // 1. Carrega do cache local de alta resolução (IndexedDB)
      try {
        const localCached = await getLocalAsset<string>('hero_panel_custom_image_v2');
        if (localCached && isMounted) {
          setCustomHeroImage(localCached);
        } else {
          const savedImage = localStorage.getItem('liloupro_hero_panel_custom_image_v2');
          if (savedImage && isMounted) {
            setCustomHeroImage(savedImage);
          }
        }
      } catch (e) {
        console.warn('Could not read local hero image from storage', e);
      }

      // 2. Sincroniza com o servidor oficial do LiLouPro para visitantes públicos
      try {
        const remote = await fetchOfficialLandingImages();
        if (remote && remote.heroImage && isMounted) {
          setCustomHeroImage(remote.heroImage);
          await setLocalAsset('hero_panel_custom_image_v2', remote.heroImage);
        }
      } catch (e) {
        console.warn('Could not sync remote landing image', e);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveCustomImage = async (dataUrlOrPath: string) => {
    setCustomHeroImage(dataUrlOrPath);
    // Salva no IndexedDB sem limite de 5MB
    await setLocalAsset('hero_panel_custom_image_v2', dataUrlOrPath);
    try {
      localStorage.setItem('liloupro_hero_panel_custom_image_v2', dataUrlOrPath);
    } catch (e) {
      // Normal quando o print é ultra HD / 4K e ultrapassa a cota do localStorage
    }
    // Sincroniza com o backend para que a imagem fique disponível para o site oficial
    await saveOfficialLandingImages({ heroImage: dataUrlOrPath });
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, envie um arquivo de imagem válido (PNG, JPG, WEBP, SVG, AVIF, etc).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawData = e.target?.result as string;
      if (!rawData) return;
      // PRESERVAÇÃO TOTAL DE QUALIDADE: Sem compressão com perda, sem canvas resize, 100% resolução original
      saveCustomImage(rawData);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // reset input value so re-selecting same file triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveCustomImage = async () => {
    try {
      localStorage.removeItem('liloupro_hero_panel_custom_image_v2');
    } catch (e) {
      console.warn(e);
    }
    await setLocalAsset('hero_panel_custom_image_v2', null);
    await saveOfficialLandingImages({ heroImage: null });
    setCustomHeroImage(null);
  };

  const handleApplyUrl = () => {
    if (urlInputValue.trim()) {
      saveCustomImage(urlInputValue.trim());
      setUrlInputValue('');
      setShowUrlPrompt(false);
    }
  };

  const chordCircle = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const transposeChord = (chord: string, semitones: number) => {
    const idx = chordCircle.indexOf(chord);
    if (idx === -1) return chord;
    let newIdx = (idx + semitones) % 12;
    if (newIdx < 0) newIdx += 12;
    return chordCircle[newIdx];
  };

  const ministryCycle = [
    {
      step: "01",
      tag: "01 · Planejamento",
      title: "Escala pronta em minutos",
      desc: "O líder monta a escala do próximo culto — seja ele de oração, doutrina, jovens ou domingo — sem precisar conferir dez conversas pra saber quem está disponível.",
      icon: Calendar,
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      nextLabel: "Passo 02 · Convite"
    },
    {
      step: "02",
      tag: "02 · Convite",
      title: "Cada equipe sabe seu culto",
      desc: "Músicos e vocais recebem no celular a notificação de qual culto foram escalados, com data, horário e função — sem confundir com a escala de outro dia.",
      icon: Smartphone,
      badgeColor: "bg-sky-500/15 text-sky-300 border-sky-500/30",
      nextLabel: "Passo 03 · Confirmação"
    },
    {
      step: "03",
      tag: "03 · Confirmação",
      title: "Presença com 1 toque",
      desc: "Cada voluntário confirma participação direto no app. O líder acompanha o placar de confirmados sem cobrar ninguém no WhatsApp.",
      icon: UserCheck,
      badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      nextLabel: "Passo 04 · Ensaio"
    },
    {
      step: "04",
      tag: "04 · Ensaio",
      title: "Repertório no tom certo",
      desc: "A banda estuda o repertório daquele culto específico, com áudio de referência e cifra já na tonalidade combinada — antes mesmo de chegar ao ensaio.",
      icon: Music,
      badgeColor: "bg-brand/15 text-brand border-brand/30",
      nextLabel: "Passo 05 · Culto"
    },
    {
      step: "05",
      tag: "05 · Culto",
      title: "Liturgia e projeção sincronizadas",
      desc: "A ordem litúrgica está definida, a mídia projeta direto do navegador e toda a equipe segue o mesmo roteiro — sem surpresas de última hora.",
      icon: Tv,
      badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      nextLabel: "Passo 06 · Repete"
    },
    {
      step: "06",
      tag: "06 · Repete",
      title: "Pronto para o próximo culto",
      desc: "Assim que um culto termina, o ciclo recomeça para o próximo da agenda — seja daqui a dois dias ou na semana seguinte.",
      icon: RotateCcw,
      badgeColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      nextLabel: "Recomeça no Passo 01"
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* SEÇÃO 1: HERO INSTITUCIONAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 sm:pt-8 overflow-x-hidden">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-10 items-center">
          
          {/* Lado Esquerdo: Conceito, Slogan e Conexão Humana */}
          <div className="w-full lg:col-span-6 space-y-5 sm:space-y-6 text-center lg:text-left">
            
            {/* CONCEITO CENTRAL UNIFICADOR (Com detalhe em âmbar/dourado para unidade visual) */}
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-brand/10 border border-amber-400/25 text-brand text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>O culto começa muito antes do domingo</span>
            </div>

            {/* SLOGAN MANTIDO INTACTO (Tipografia fluida Mobile-First) */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-tight">
              Menos tempo organizando. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-amber-200 to-amber-400">
                Mais tempo servindo.
              </span>
            </h1>

            {/* SUBTÍTULO: Foco em pessoas (Líder, Músicos, Mídia, Pastor) */}
            <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Uma plataforma elegante e intuitiva criada para o ministério cristão. 
              Sincronize <strong>escalas, cifras no tom ideal, liturgia e projeção</strong> de forma simples — trazendo tranquilidade e paz para quem lidera.
            </p>

            {/* CTAs (Empilhados no Mobile 100% largura, texto sempre em linha única sem quebra) */}
            <div className="pt-1 flex flex-col sm:flex-row items-center justify-center lg:justify-start w-full sm:w-auto gap-3">
              <button
                onClick={() => onEnterApp('signup')}
                className="w-full sm:w-auto min-h-[52px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-brand hover:bg-brand/90 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider whitespace-nowrap shadow-xl shadow-brand/25 lg:shadow-2xl lg:shadow-brand/35 lg:ring-2 lg:ring-brand/40 lg:ring-offset-2 lg:ring-offset-slate-950 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
              >
                <span>Testar grátis 30 dias</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <a
                href="#jornada-ministerio"
                className="w-full sm:w-auto min-h-[52px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold text-sm sm:text-base whitespace-nowrap transition-all text-center"
              >
                <span>Ver a jornada do ministério</span>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </a>
            </div>

            {/* Confiança de Adoção */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Check className="w-3.5 h-3.5 text-brand shrink-0" /> Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Check className="w-3.5 h-3.5 text-brand shrink-0" /> Teste sem compromisso
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Check className="w-3.5 h-3.5 text-brand shrink-0" /> Suporte humano em português
              </span>
            </div>
          </div>

          {/* Lado Direito: Preview do Produto (Imagem dos Dispositivos Alinhada e com Moldura Elegante) */}
          <div className="w-full lg:col-span-6">
            <div 
              className={`relative w-full transition-all duration-200 ${
                activeHeroImage 
                  ? '' 
                  : 'bg-slate-900/90 border border-white/15 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-blue-950/50'
              }`}
            >
              {/* SE TIVER IMAGEM REAL / PADRÃO: EXIBE A IMAGEM EM ALTA RESOLUÇÃO COM MOLDURA TRANSLÚCIDA */}
              {activeHeroImage ? (
                <div className="relative w-full overflow-hidden border border-white/10 rounded-2xl shadow-2xl shadow-blue-950/50 bg-[#070b14] transform-gpu">
                  <img
                    src={activeHeroImage}
                    alt="Interface do LiLouPro no Celular, Notebook e Tablet"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-auto object-contain block rounded-2xl landing-crisp-img"
                  />
                  {/* Sutil vinheta interna para fusão suave com o fundo escuro */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                </div>
              ) : (
                /* MOCKUP ORIGINAL INTERATIVO */
                <div>
                  {/* Header do Mockup com Abas de Função */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 mb-5 gap-3">
                    <div className="flex items-center justify-between w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        <span className="ml-2 text-xs font-mono text-slate-400 font-semibold">
                          Culto de Domingo • IBN Sede
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs font-bold">
                        <button
                          onClick={() => setMockupTab('liturgia')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            mockupTab === 'liturgia' ? 'bg-brand text-slate-950' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Liturgia
                        </button>
                        <button
                          onClick={() => setMockupTab('escala')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            mockupTab === 'escala' ? 'bg-brand text-slate-950' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Escala & Equipe
                        </button>
                        <button
                          onClick={() => setMockupTab('cifra')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            mockupTab === 'cifra' ? 'bg-brand text-slate-950' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Cifra (Tom)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ABA 1: LITURGIA (Visão unificada entre Pastor, Louvor e Mídia) */}
                  {mockupTab === 'liturgia' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">01</span>
                          <div>
                            <p className="text-sm font-bold text-white">Abertura & Oração Inicial</p>
                            <p className="text-xs text-slate-400">Pr. Ricardo • 5 minutos</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Sincronizado
                        </span>
                      </div>

                      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-brand/10 border border-brand/30">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-brand text-slate-950 flex items-center justify-center font-bold text-xs">02</span>
                          <div>
                            <p className="text-sm font-bold text-white">Grande é o Senhor (G)</p>
                            <p className="text-xs text-brand/90">Carla (Ministra) • Daniel (Violão)</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand text-slate-950">
                          Tom G (Banda)
                        </span>
                      </div>

                      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">03</span>
                          <div>
                            <p className="text-sm font-bold text-white">Projeção • Letra no Telão</p>
                            <p className="text-xs text-slate-400">Gabriel (Mídia) • Sincronizado via PWA</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                          Pronto no Telão
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ABA 2: ESCALA E EQUIPE (Pessoas reais confirmadas) */}
                  {mockupTab === 'escala' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-brand font-bold text-xs">
                            CS
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Carla Santos (Ministra / Vocal)</p>
                            <p className="text-xs text-slate-400">Confirmado pelo celular na quarta-feira</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" /> Confirmada
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs">
                            DL
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Daniel Lemos (Violão & Guitarra)</p>
                            <p className="text-xs text-slate-400">Estudando com cifra transposta para G</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" /> Confirmado
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
                            GA
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Gabriel Andrade (Projeção & Mídia)</p>
                            <p className="text-xs text-slate-400">Slides de liturgia carregados na cabine</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" /> Confirmado
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ABA 3: CIFRA TRANSPOSTA EM TEMPO REAL */}
                  {mockupTab === 'cifra' && (
                    <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-white/10 font-mono text-sm">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10 font-sans">
                        <span className="text-xs font-bold text-slate-300">
                          Transposição Instantânea para Ensaio
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setTransposition(t => t - 1)}
                            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-white text-xs font-bold cursor-pointer"
                          >
                            -½ Tom
                          </button>
                          <span className="text-xs font-bold text-brand px-2">
                            {transposition === 0 ? 'Original (G)' : `${transposition > 0 ? '+' : ''}${transposition} semi`}
                          </span>
                          <button
                            onClick={() => setTransposition(t => t + 1)}
                            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-white text-xs font-bold cursor-pointer"
                          >
                            +½ Tom
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-brand font-bold">
                          {transposeChord('G', transposition)}              {transposeChord('D', transposition)}
                        </div>
                        <div className="text-slate-200 font-sans">
                          Senhor tu és bom, a tua misericórdia dura...
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <div className="text-brand font-bold">
                          {transposeChord('Em', transposition)}             {transposeChord('C', transposition)}
                        </div>
                        <div className="text-slate-200 font-sans">
                          Para sempre cantarei o teu louvor na assembleia...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rodapé de Sintonia (Espaçado e sem recorte nas bordas nem sobreposição com o botão flutuante) */}
              <div className="flex flex-wrap items-center justify-center sm:justify-between gap-4 pt-4 px-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>Sincronizado na Nuvem</span>
                </span>
                <span className="font-semibold text-slate-300 text-center sm:text-right">
                  Sem planilhas ou mensagens perdidas
                </span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* RESPIRO VISUAL 1: MEMÓRIA DE MARCA E CONCEITO CENTRAL */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="relative py-6 sm:py-8 px-6 sm:px-8 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0d1627] to-slate-900 border border-white/10 text-center shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent pointer-events-none" />
          
          <p className="relative z-10 text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-relaxed italic">
            "O culto começa muito antes do domingo."
          </p>
          <div className="relative z-10 mt-3 text-xs font-bold uppercase tracking-widest text-brand">
            Tudo o que acontece durante a semana constrói a atmosfera da adoração
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: POR QUE CANSA TANTO LIDERAR? (Falar das pessoas reais da igreja) */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5" />
            Empatia pela Liderança
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Por que organizar o louvor parece um segundo trabalho?
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            A maioria dos líderes de louvor ama servir, mas se esgota com a comunicação descentralizada antes de cada domingo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Situação 1: O Líder */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-white/20 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">ESCALA SEM ESTRESSE</span>
            <h3 className="text-lg font-bold text-white">
              Acabou a cobrança no WhatsApp na quinta à noite
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Os músicos informam a disponibilidade direto no app e a escala é gerada com confirmação automática, sem mensagens perdidas no grupo.
            </p>
          </div>

          {/* Situação 2: O Músico */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-white/20 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-300">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">ENSAIO SEM RETRABALHO</span>
            <h3 className="text-lg font-bold text-white">
              O tom certo para cada cantor, sem refazer cifras
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Transponha qualquer música em 1 clique direto na tela e deixe a referência de áudio pronta antes mesmo da equipe chegar para o ensaio.
            </p>
          </div>

          {/* Situação 3: A Mídia / Pastor */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-white/20 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Tv className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">PROJEÇÃO SINCRONIZADA</span>
            <h3 className="text-lg font-bold text-white">
              A mídia nunca mais pergunta qual é a próxima música
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              O repertório do culto já vai pronto e ordenado para o telão, podendo ser controlado direto pelo celular, sem slides desatualizados.
            </p>
          </div>

        </div>
      </section>

      {/* SEÇÃO 3: A SOLUÇÃO LILOUPRO (Da Escala ao Telão em harmonia) */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-br from-slate-900 via-[#0e172a] to-slate-900 border border-white/15 rounded-3xl p-8 sm:p-12 lg:p-14 shadow-2xl">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/25 text-brand text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Integração Ministerial
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Uma única plataforma para quem lidera, toca e projeta.
            </h2>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              O LiLouPro substitui planilhas soltas, grupos desorganizados e arquivos avulsos. 
              <strong> Tudo fica em um único lugar</strong>, acessível em qualquer smartphone ou computador.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-left">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-xs font-bold text-brand uppercase">01 • Liderança</span>
                <p className="text-sm font-bold text-white">Escalas sem conflito</p>
                <p className="text-xs text-slate-400">Sabendo quem está disponível</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-xs font-bold text-brand uppercase">02 • Músicos</span>
                <p className="text-sm font-bold text-white">Cifras no tom ideal</p>
                <p className="text-xs text-slate-400">Transposição e áudio de ensaio</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-xs font-bold text-brand uppercase">03 • Pastor</span>
                <p className="text-sm font-bold text-white">Liturgia organizada</p>
                <p className="text-xs text-slate-400">Ordem do culto compartilhada</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-xs font-bold text-brand uppercase">04 • Mídia</span>
                <p className="text-sm font-bold text-white">Projeção sincronizada</p>
                <p className="text-xs text-slate-400">Letras corretas no telão</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SEÇÃO: A JORNADA DO MINISTÉRIO (Ciclo Contínuo de Tarefas) */}
      <section id="jornada-ministerio" className="max-w-7xl mx-auto px-6 scroll-mt-24 relative">
        {/* Âncora invisível para compatibilidade com links antigos */}
        <span id="semana-antes" className="block -mt-24 pt-24 invisible" aria-hidden="true" />

        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/25 text-brand text-xs font-bold uppercase tracking-wider">
            <RotateCcw className="w-3.5 h-3.5" />
            A Jornada do Ministério
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Um ciclo, quantos cultos sua igreja precisar
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Não importa se sua igreja tem um culto por semana ou cinco — o LiLouPro se adapta ao ritmo real da sua rotina, repetindo esse ciclo automaticamente a cada culto.
          </p>
        </div>

        {/* Grade do Ciclo: 6 Etapas Numeradas (3x2 com Conexão em Loop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {ministryCycle.map((item, idx) => {
            const IconComp = item.icon;
            const isLast = idx === 5;

            return (
              <div 
                key={idx}
                className={`relative bg-slate-900/75 hover:bg-slate-900 border ${
                  isLast 
                    ? 'border-brand/40 bg-gradient-to-b from-slate-900 to-brand/5 shadow-brand/10' 
                    : 'border-white/10 hover:border-brand/30'
                } rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5 transition-all duration-300 group shadow-xl`}
              >
                <div className="space-y-4">
                  {/* Cabeçalho da Etapa com Número e Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${item.badgeColor}`}>
                        {item.tag}
                      </span>
                    </div>

                    {isLast ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-300 bg-rose-500/10 border border-rose-500/25 px-2.5 py-0.5 rounded-full">
                        <RotateCcw className="w-3 h-3" />
                        Reinicia
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                        ETAPA {item.step}
                      </span>
                    )}
                  </div>

                  {/* Título */}
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-brand transition-colors leading-snug">
                    {item.title}
                  </h3>

                  {/* Descrição */}
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Rodapé do Card com Próximo Passo */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Fluxo do ciclo:</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-300 group-hover:text-brand transition-colors">
                    <span>{item.nextLabel}</span>
                    {isLast ? (
                      <RotateCcw className="w-3.5 h-3.5 text-brand" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Conector Visual em Loop (Seta do Card 06 de volta para o Card 01) */}
        <div className="mt-8 p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-brand/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-brand">Ciclo Contínuo em Loop</span>
                <span className="text-[10px] font-bold text-slate-300 bg-white/10 border border-white/15 px-2 py-0.5 rounded-full">
                  Sem prender a rotina ao domingo
                </span>
              </div>
              <p className="text-sm font-semibold text-white mt-1">
                Ao término de qualquer culto, o LiLouPro recomeça o ciclo para o próximo culto da agenda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-950 border border-white/15 text-xs font-bold text-slate-200 shrink-0">
            <span className="text-slate-400">06 · Repete</span>
            <ArrowRight className="w-4 h-4 text-brand shrink-0" />
            <span className="text-brand flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              01 · Planejamento do próximo culto
            </span>
          </div>
        </div>
      </section>

      {/* RESPIRO VISUAL 2: MEMÓRIA DE MARCA E POSICIONAMENTO */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="py-6 sm:py-8 px-6 sm:px-8 rounded-3xl bg-slate-900/80 border border-white/10 text-center space-y-2">
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight italic">
            "Organização também é ministério."
          </p>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Cuidar das pessoas começa por respeitar o tempo e a dedicação de cada voluntário
          </p>
        </div>
      </section>
    </div>
  );
}
