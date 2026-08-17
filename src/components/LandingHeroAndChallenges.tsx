import React, { useState } from 'react';
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
  UserCheck
} from 'lucide-react';
import { Music2 } from './MusicIcon';

interface LandingHeroAndChallengesProps {
  onEnterApp: (mode: 'login' | 'signup') => void;
}

export default function LandingHeroAndChallenges({ onEnterApp }: LandingHeroAndChallengesProps) {
  // Estado para o Mockup Interativo do Hero (trazendo pessoas reais)
  const [mockupTab, setMockupTab] = useState<'liturgia' | 'escala' | 'cifra'>('liturgia');
  const [transposition, setTransposition] = useState<number>(0);

  const chordCircle = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const transposeChord = (chord: string, semitones: number) => {
    const idx = chordCircle.indexOf(chord);
    if (idx === -1) return chord;
    let newIdx = (idx + semitones) % 12;
    if (newIdx < 0) newIdx += 12;
    return chordCircle[newIdx];
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
      <section className="max-w-7xl mx-auto px-6 pt-4 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* Lado Esquerdo: Conceito, Slogan e Conexão Humana */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            
            {/* CONCEITO CENTRAL UNIFICADOR */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/30 text-brand text-xs font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>O culto começa muito antes do domingo</span>
            </div>

            {/* SLOGAN MANTIDO INTACTO */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
              Menos tempo organizando. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-amber-200 to-amber-400">
                Mais tempo servindo.
              </span>
            </h1>

            {/* SUBTÍTULO: Foco em pessoas (Líder, Músicos, Mídia, Pastor) */}
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Uma plataforma elegante e intuitiva criada para o ministério cristão. 
              Sincronize <strong>escalas, cifras no tom ideal, liturgia e projeção</strong> de forma simples — trazendo tranquilidade e paz para quem lidera.
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

          {/* Lado Direito: Preview do Produto (Interface Reativa demonstrando clareza) */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
              
              {/* Header do Mockup com Abas de Função */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400 font-semibold">
                    Culto de Domingo • IBN Sede
                  </span>
                </div>

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

              {/* Rodapé de Sintonia */}
              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Sincronizado na Nuvem
                </span>
                <span className="font-semibold text-slate-300">
                  Sem planilhas ou mensagens perdidas
                </span>
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
