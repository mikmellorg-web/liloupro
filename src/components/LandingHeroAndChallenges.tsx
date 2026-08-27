import React, { useState, useRef } from 'react';
import heroDevicesImg from '../assets/images/liloupro_hero_capa_1787862990137.jpg';
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
  Upload
} from 'lucide-react';
import { Music2 } from './MusicIcon';

interface LandingHeroAndChallengesProps {
  onEnterApp: (mode: 'login' | 'signup') => void;
}

export default function LandingHeroAndChallenges({ onEnterApp }: LandingHeroAndChallengesProps) {
  const [heroImageSrc, setHeroImageSrc] = useState<string>(() => {
    return localStorage.getItem('liloupro_hero_original_image') || '/capa da landin page.png';
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setHeroImageSrc(dataUrl);
        try {
          localStorage.setItem('liloupro_hero_original_image', dataUrl);
          await fetch('/api/upload-hero-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: dataUrl, filename: file.name })
          });
        } catch (err) {
          console.error('Failed to sync upload to server:', err);
        }
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const weekDays = [
    {
      day: "SEGUNDA",
      role: "Líder de Louvor",
      title: "Escala montada com clareza",
      desc: "O líder monta a escala do domingo em 3 minutos sem precisar conferir 10 conversas para saber quem viajou.",
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30"
    },
    {
      day: "TERÇA",
      role: "Banda & Vocal",
      title: "Convite direto no celular",
      desc: "Os músicos e ministros recebem a notificação de serviço no smartphone e verificam suas funções no culto.",
      badgeColor: "bg-sky-500/15 text-sky-300 border-sky-500/30"
    },
    {
      day: "QUARTA",
      role: "Toda a Equipe",
      title: "Confirmação com 1 toque",
      desc: "Cada voluntário confirma presença no app. O líder vê o placar verde sem precisar mandar áudio no WhatsApp.",
      badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
    },
    {
      day: "QUINTA",
      role: "Pastor & Liderança",
      title: "Ordem litúrgica alinhada",
      desc: "As canções são ordenadas de acordo com o tema da mensagem. Pastor e liderança em completa sintonia.",
      badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30"
    },
    {
      day: "SEXTA",
      role: "Músicos em casa",
      title: "Estudo no tom correto",
      desc: "O violonista e o vocalista ensaiam exatamente na tonalidade e estrutura combinadas para o domingo.",
      badgeColor: "bg-brand/15 text-brand border-brand/30"
    },
    {
      day: "SÁBADO",
      role: "Operador de Mídia",
      title: "Telão e letras conferidos",
      desc: "A equipe de mídia abre a projeção no navegador. Sem pen drive corrompido ou digitação às pressas.",
      badgeColor: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
    },
    {
      day: "DOMINGO",
      role: "Toda a Igreja",
      title: "Serviço com paz e adoração",
      desc: "A equipe chega preparada e concentrada no seu chamado: guiar a igreja na adoração sem improvisos.",
      badgeColor: "bg-rose-500/15 text-rose-300 border-rose-500/30"
    }
  ];

  return (
    <div className="space-y-20 sm:space-y-28">
      {/* SEÇÃO 1: HERO INSTITUCIONAL */}
      <section className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-10 items-center">
          
          {/* Lado Esquerdo: Conceito, Slogan e Conexão Humana */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            
            {/* CONCEITO CENTRAL UNIFICADOR */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/30 text-brand text-xs font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>O culto começa muito antes do domingo</span>
            </div>

            {/* SLOGAN MANTIDO INTACTO */}
            <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.08]">
              Menos tempo organizando. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-amber-200 to-amber-400">
                Mais tempo servindo.
              </span>
            </h1>

            {/* SUBTÍTULO: Foco em pessoas (Líder, Músicos, Mídia, Pastor) */}
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Uma plataforma elegante e intuitiva criada para o ministério cristão. 
              Sincronize <strong>escalas, cifras no tom ideal, liturgia e projeção</strong> de forma simples — trazendo tranquilidade e praticidade para quem lidera.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <button
                onClick={() => onEnterApp('signup')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand hover:bg-brand/90 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-brand/25 transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Testar grátis 30 dias</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#semana-antes"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold text-sm transition-all text-center flex items-center justify-center gap-2"
              >
                <span>Ver a rotina semanal</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {/* Confiança de Adoção */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-brand" /> Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-brand" /> Teste sem compromisso
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-brand" /> Suporte humano em português
              </span>
            </div>
          </div>

          {/* Lado Direito: Imagem Original do Liloupro nos Dispositivos (Aumentada em ~20% no layout) */}
          <div className="lg:col-span-7 flex items-center justify-center lg:justify-end">
            <div 
              className="w-full max-w-3xl lg:max-w-none lg:w-[105%] xl:w-[108%] lg:-mr-3 xl:-mr-6 relative group cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) {
                  handleImageFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              title="Clique ou arraste o arquivo original (capa da landin page.png) para carregar"
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
              />

              <img
                src={heroImageSrc}
                alt="Liloupro em múltiplos dispositivos: Computador, Tablet e Celular"
                className="w-full h-auto rounded-2xl shadow-2xl block object-contain"
                referrerPolicy="no-referrer"
                onError={() => {
                  if (heroImageSrc === '/capa da landin page.png') {
                    setHeroImageSrc('/capa_da_landin_page.png');
                  } else if (heroImageSrc === '/capa_da_landin_page.png') {
                    setHeroImageSrc('/capa.png');
                  } else if (heroImageSrc === '/capa.png') {
                    setHeroImageSrc(heroDevicesImg);
                  }
                }}
              />

              {/* Botão sutil de carregamento do arquivo original */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-950/85 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg pointer-events-none">
                <Upload className="w-3.5 h-3.5 text-brand" />
                <span>{isUploading ? 'Salvando imagem...' : 'Carregar arquivo original'}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* RESPIRO VISUAL 1: MEMÓRIA DE MARCA E CONCEITO CENTRAL */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="relative py-10 px-8 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0d1627] to-slate-900 border border-white/10 text-center shadow-2xl overflow-hidden">
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
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
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
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">O Sábado à Noite do Líder</span>
            <h3 className="text-lg font-bold text-white">
              Cobrando presença no grupo do WhatsApp
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              O grupo se enche de mensagens e figurinhas, mas ninguém confirma se vai tocar. O líder passa a véspera do culto sem saber se terá baixista ou baterista.
            </p>
          </div>

          {/* Situação 2: O Músico */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-white/20 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-300">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">A Surpresa no Ensaio</span>
            <h3 className="text-lg font-bold text-white">
              Cifras em tons diferentes e retrabalho
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              O violonista estudou em sol (G), mas o ministro decide cantar em lá (A). Sem transposição rápida, o ensaio perde tempo e gera insegurança antes do culto.
            </p>
          </div>

          {/* Situação 3: A Mídia / Pastor */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-white/20 transition-all">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Tv className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">A Cabine de Projeção</span>
            <h3 className="text-lg font-bold text-white">
              Letras divergentes no telão da igreja
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              O operador de mídia recebe arquivos em pen drive ou slides fora de ordem em cima da hora, correndo o risco de passar a letra errada durante o louvor.
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
              Harmonia para a Liderança
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

      {/* MELHORIA 4: UMA SEMANA ANTES DO CULTO (Narrativa de Segunda a Domingo) */}
      <section id="semana-antes" className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            A Jornada Semanal
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Uma semana antes do culto
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Veja como o LiLouPro transforma a semana do ministério — sem correria na véspera e com toda a equipe alinhada.
          </p>
        </div>

        {/* Timeline Visual de 7 Dias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {weekDays.map((item, idx) => (
            <div 
              key={idx}
              className="bg-slate-900/70 hover:bg-slate-900 border border-white/10 hover:border-brand/40 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white tracking-widest uppercase">
                    {item.day}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.role}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-brand transition-colors">
                  {item.title}
                </h3>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* RESPIRO VISUAL 2: MEMÓRIA DE MARCA E POSICIONAMENTO */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="py-10 px-8 rounded-3xl bg-slate-900/80 border border-white/10 text-center space-y-2">
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
